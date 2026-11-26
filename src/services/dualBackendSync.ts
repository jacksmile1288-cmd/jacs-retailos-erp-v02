export type StorageOperationalMode = 'LOCAL_ONLY' | 'ONLINE_CLOUD' | 'HYBRID_MIGRATION';
export const STORAGE_MODE_KEY = 'jacs_storage_mode';

export interface SyncStatusSnapshot {
  isOnline: boolean;
  isSyncing: boolean;
  queuedCount: number;
  lastSyncTime: string | null;
  supabaseStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONFIG_REQUIRED';
  gasStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONFIG_REQUIRED';
  lastSyncFailed?: boolean;
  lastSyncErrorMessage?: string | null;
  storageMode?: StorageOperationalMode;
}

export interface SyncQueueItem {
  id: string;
  type: string;
  action: 'UPSERT' | 'DELETE' | 'INSERT';
  payload: any;
  timestamp: string;
  retryCount?: number;
  lastError?: string;
}

export interface FailedDualSyncQueueItem extends SyncQueueItem {
  failedAt: string;
  reason: string;
}

export type BackendProvider = 'SUPABASE' | 'GAS' | 'LOCAL';

export interface DualBackendConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  gasWebhookUrl: string;
  provider?: BackendProvider;
}

export type CloverEnvironment = 'PRODUCTION' | 'SANDBOX';

export interface CloverConfig {
  merchantId: string;
  apiToken: string;
  environment: CloverEnvironment;
  autoCleanDummy: boolean;
  lastSyncAt: string | null;
  lastSyncSummary: string | null;
}

export type RemoteCommandType =
  | 'REMOTE_MAINTENANCE_LOCK'
  | 'REMOTE_FORCE_SYNC'
  | 'REMOTE_DIAGNOSTIC_REPORT'
  | 'REMOTE_SOFT_RELOAD';

export interface RemoteCommandPayload {
  id: string;
  command: RemoteCommandType;
  targetBranchId: string; // 'ALL_BRANCHES' | branchId
  customMessage?: string;
  lockActive?: boolean;
  issuedBy: string;
  issuedAt: string;
  tx_uuid: string;
  senderTabId?: string;
}

export interface RemoteCommandExecutionLog {
  commandId: string;
  command: RemoteCommandType;
  targetBranchId: string;
  branchId: string;
  branchName?: string;
  status: 'DISPATCHED' | 'EXECUTED' | 'FAILED';
  transport: 'GAS_SUPABASE' | 'LOCAL_BROADCAST' | 'HYBRID';
  details: string;
  executedAt: string;
  customMessage?: string;
}

export interface BranchTelemetryErrorItem {
  id?: string;
  timestamp: string;
  branchId?: string;
  level?: string;
  module?: string;
  route?: string;
  action?: string;
  message: string;
  stackSummary?: string;
  sourceFile?: string;
  lineNumber?: number;
}

export interface BranchTelemetryReport {
  id: string;
  branchId: string;
  branchName: string;
  appVersion: string;
  localStorageUsedBytes: number;
  localStorageRemainingBytes: number;
  localStorageRemainingPercent: number;
  pendingSyncCount: number;
  lastErrorLogs: BranchTelemetryErrorItem[];
  isMaintenanceLocked: boolean;
  reportedAt: string;
  commandId?: string;
}

const REMOTE_CMD_BUS_KEY = 'jacs_remote_command_bus';
const REMOTE_ACK_BUS_KEY = 'jacs_remote_ack_bus';
const REMOTE_TELEMETRY_BUS_KEY = 'jacs_remote_telemetry_bus';
const REMOTE_CHANNEL_NAME = 'jacs_retailos_remote_hub';
const DUAL_FAILED_QUEUE_KEY = 'jacs_dual_backend_failed_queue_v1';
const MAX_QUEUE_RETRIES = 3;

export function generateTxUuid(): string {
  return 'UUID-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9).toUpperCase();
}

class DualBackendSyncEngine {
  private config: DualBackendConfig = {
    supabaseUrl: '',
    supabaseAnonKey: '',
    gasWebhookUrl: '',
    provider: 'LOCAL'
  };

  private cloverConfig: CloverConfig = {
    merchantId: '',
    apiToken: '',
    environment: 'PRODUCTION',
    autoCleanDummy: true,
    lastSyncAt: null,
    lastSyncSummary: null
  };

  private queue: SyncQueueItem[] = [];
  private isSyncing = false;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private lastSyncTime: string | null = null;
  private lastSyncFailed = false;
  private lastSyncErrorMessage: string | null = null;
  private supabaseLastConnected: boolean | null = null;
  private storageMode: StorageOperationalMode = 'ONLINE_CLOUD';
  private listeners: Set<(snap: SyncStatusSnapshot) => void> = new Set();

  private remoteChannel: BroadcastChannel | null = null;
  private tabId: string = 'TAB-' + Math.random().toString(36).substring(2, 9);
  private commandListeners: Set<(cmd: RemoteCommandPayload) => void> = new Set();
  private ackListeners: Set<(logs: RemoteCommandExecutionLog[]) => void> = new Set();
  private telemetryListeners: Set<(reports: BranchTelemetryReport[]) => void> = new Set();

  constructor() {
    this.loadConfig();
    this.loadQueue();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
        this.processQueue();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });

      this.initRemoteHubTransport();
    }
  }

  private initRemoteHubTransport() {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.remoteChannel = new BroadcastChannel(REMOTE_CHANNEL_NAME);
        this.remoteChannel.onmessage = (event) => {
          const data = event.data;
          if (!data || !data.kind) return;
          if (data.kind === 'REMOTE_COMMAND' && data.payload) {
            this.commandListeners.forEach((fn) => fn(data.payload));
          } else if (data.kind === 'REMOTE_ACK') {
            const logs = this.getRemoteCommandLogs();
            this.ackListeners.forEach((fn) => fn(logs));
          } else if (data.kind === 'REMOTE_TELEMETRY') {
            const reports = this.getTelemetryReports();
            this.telemetryListeners.forEach((fn) => fn(reports));
          }
        };
      }
    } catch {}

    try {
      window.addEventListener('storage', (e) => {
        if (e.key === REMOTE_CMD_BUS_KEY && e.newValue) {
          try {
            const list: RemoteCommandPayload[] = JSON.parse(e.newValue);
            if (Array.isArray(list) && list.length > 0) {
              this.commandListeners.forEach((fn) => fn(list[0]));
            }
          } catch {}
        } else if (e.key === REMOTE_ACK_BUS_KEY) {
          this.ackListeners.forEach((fn) => fn(this.getRemoteCommandLogs()));
        } else if (e.key === REMOTE_TELEMETRY_BUS_KEY) {
          this.telemetryListeners.forEach((fn) => fn(this.getTelemetryReports()));
        }
      });
    } catch {}
  }

  private loadConfig() {
    try {
      const saved = localStorage.getItem('jacs_dual_backend_config');
      if (saved) {
        this.config = JSON.parse(saved);
      }
    } catch {}
    try {
      const savedMode = localStorage.getItem(STORAGE_MODE_KEY);
      if (
        savedMode === 'LOCAL_ONLY' ||
        savedMode === 'ONLINE_CLOUD' ||
        savedMode === 'HYBRID_MIGRATION'
      ) {
        this.storageMode = savedMode;
      } else {
        const hasCloud = Boolean(
          (this.config.supabaseUrl && this.config.supabaseAnonKey) || this.config.gasWebhookUrl
        );
        this.storageMode = hasCloud ? 'ONLINE_CLOUD' : 'ONLINE_CLOUD';
      }
    } catch {}
    try {
      const savedClover = localStorage.getItem('jacs_clover_config');
      const legacyToken = localStorage.getItem('jacs_superadmin_api_key') || '';
      if (savedClover) {
        const parsed = JSON.parse(savedClover);
        this.cloverConfig = {
          merchantId: parsed.merchantId || '',
          apiToken: parsed.apiToken || legacyToken || '',
          environment: parsed.environment === 'SANDBOX' ? 'SANDBOX' : 'PRODUCTION',
          autoCleanDummy: typeof parsed.autoCleanDummy === 'boolean' ? parsed.autoCleanDummy : true,
          lastSyncAt: parsed.lastSyncAt || null,
          lastSyncSummary: parsed.lastSyncSummary || null
        };
      } else if (legacyToken) {
        this.cloverConfig.apiToken = legacyToken;
      }
    } catch {}
  }

  private loadQueue() {
    try {
      const saved = localStorage.getItem('jacs_dual_backend_queue');
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch {}
  }

  private saveQueue() {
    try {
      localStorage.setItem('jacs_dual_backend_queue', JSON.stringify(this.queue));
    } catch {}
  }

  public getQueuedCount(): number {
    return this.queue.length;
  }

  public clearQueue(): number {
    const cleared = this.queue.length;
    this.queue = [];
    try {
      localStorage.removeItem('jacs_dual_backend_queue');
      localStorage.removeItem(DUAL_FAILED_QUEUE_KEY);
    } catch {}
    this.lastSyncFailed = false;
    this.lastSyncErrorMessage = null;
    this.notify();
    return cleared;
  }

  private recordFailedQueueItem(item: SyncQueueItem, reason: string) {
    try {
      const raw = localStorage.getItem(DUAL_FAILED_QUEUE_KEY);
      const existing: FailedDualSyncQueueItem[] = raw ? JSON.parse(raw) : [];
      const entry: FailedDualSyncQueueItem = {
        ...item,
        failedAt: new Date().toISOString(),
        reason,
      };
      const next = [entry, ...(Array.isArray(existing) ? existing : [])].slice(0, 50);
      localStorage.setItem(DUAL_FAILED_QUEUE_KEY, JSON.stringify(next));
    } catch {}
  }

  private isNonRetriableHttpError(status: number, bodyText = ''): boolean {
    if (status === 400 || status === 404 || status === 409 || status === 422) {
      return true;
    }
    if (
      /23505|23503|23502|23514|22P02|42P01|42703|PGRST|duplicate key|already exists|unique constraint|violates|schema cache|does not exist|could not find|invalid input/i.test(
        bodyText
      )
    ) {
      return true;
    }
    return false;
  }

  public getConfig(): DualBackendConfig {
    return { ...this.config };
  }

  public getStorageMode(): StorageOperationalMode {
    try {
      const savedMode =
        typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_MODE_KEY) : null;
      if (
        savedMode === 'LOCAL_ONLY' ||
        savedMode === 'ONLINE_CLOUD' ||
        savedMode === 'HYBRID_MIGRATION'
      ) {
        this.storageMode = savedMode;
      }
    } catch {}
    return this.storageMode;
  }

  public setStorageMode(mode: StorageOperationalMode) {
    this.storageMode = mode;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_MODE_KEY, mode);
      }
    } catch {}
    if (mode === 'LOCAL_ONLY' || mode === 'HYBRID_MIGRATION') {
      this.lastSyncFailed = false;
      this.lastSyncErrorMessage = null;
    }
    if (mode === 'LOCAL_ONLY') {
      this.config = { ...this.config, provider: 'LOCAL' };
    } else if (mode === 'ONLINE_CLOUD') {
      const nextProvider: BackendProvider =
        this.config.supabaseUrl && this.config.supabaseAnonKey
          ? 'SUPABASE'
          : this.config.gasWebhookUrl
          ? 'GAS'
          : 'SUPABASE';
      this.config = { ...this.config, provider: nextProvider };
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jacs_dual_backend_config', JSON.stringify(this.config));
      }
    } catch {}
    this.notify();
  }

  public saveConfig(cfg: Partial<DualBackendConfig>) {
    this.config = { ...this.config, ...cfg };
    try {
      localStorage.setItem('jacs_dual_backend_config', JSON.stringify(this.config));
    } catch {}
    this.notify();
  }

  public getCloverConfig(): CloverConfig {
    return { ...this.cloverConfig };
  }

  public saveCloverConfig(cfg: Partial<CloverConfig>): CloverConfig {
    this.cloverConfig = {
      ...this.cloverConfig,
      ...cfg,
      environment: (cfg.environment ?? this.cloverConfig.environment) === 'SANDBOX' ? 'SANDBOX' : 'PRODUCTION'
    };
    try {
      localStorage.setItem('jacs_clover_config', JSON.stringify(this.cloverConfig));
      if (typeof cfg.apiToken === 'string' && cfg.apiToken.trim()) {
        localStorage.setItem('jacs_superadmin_api_key', cfg.apiToken.trim());
      }
    } catch {}
    return { ...this.cloverConfig };
  }

  public async proxyCloverFetch(
    endpointUrl: string,
    apiToken: string
  ): Promise<{
    ok: boolean;
    status: number;
    data?: any;
    transport?: 'GAS_PROXY' | 'SUPABASE_PROXY';
    error?: string;
  }> {
    const txUuid = generateTxUuid();
    const nowIso = new Date().toISOString();
    const sessionSig =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('jacs_session_sig') || 'JACS-SECURE-SIG'
        : 'JACS-SECURE-SIG';

    // 1. Coba GAS Webhook Proxy jika dikonfigurasi
    if (this.config.gasWebhookUrl) {
      try {
        const res = await fetch(this.config.gasWebhookUrl, {
          method: 'POST',
          headers: this.getSignedHeaders(txUuid, nowIso),
          body: JSON.stringify({
            action: 'CLOVER_PROXY_FETCH',
            url: endpointUrl,
            method: 'GET',
            headers: {
              Authorization: `Bearer ${apiToken}`,
              Accept: 'application/json'
            },
            session_signature: sessionSig,
            tx_uuid: txUuid
          })
        });
        const text = await res.text();
        let parsed: any = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          parsed = null;
        }
        const status = Number(parsed?.status || res.status || 200);
        const payloadData = parsed?.data !== undefined ? parsed.data : parsed;
        if (res.ok && status >= 200 && status < 300 && payloadData) {
          return { ok: true, status, data: payloadData, transport: 'GAS_PROXY' };
        }
        return {
          ok: false,
          status,
          transport: 'GAS_PROXY',
          error: parsed?.message || parsed?.error || `GAS Proxy HTTP ${status}`
        };
      } catch (e: any) {
        // lanjut fallback ke Supabase Edge Function jika ada
      }
    }

    // 2. Fallback ke Supabase Edge Function Proxy (`clover-proxy`) jika dikonfigurasi
    if (this.config.supabaseUrl && this.config.supabaseAnonKey) {
      try {
        const base = this.config.supabaseUrl.replace(/\/+$/, '');
        const res = await fetch(`${base}/functions/v1/clover-proxy`, {
          method: 'POST',
          headers: {
            ...this.getSignedHeaders(txUuid, nowIso),
            apikey: this.config.supabaseAnonKey,
            Authorization: `Bearer ${this.config.supabaseAnonKey}`
          },
          body: JSON.stringify({
            url: endpointUrl,
            method: 'GET',
            cloverToken: apiToken
          })
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data) {
          return { ok: true, status: res.status, data, transport: 'SUPABASE_PROXY' };
        }
        return {
          ok: false,
          status: res.status,
          transport: 'SUPABASE_PROXY',
          error: data?.message || data?.error || `Supabase Proxy HTTP ${res.status}`
        };
      } catch (e: any) {
        return {
          ok: false,
          status: 0,
          transport: 'SUPABASE_PROXY',
          error: e?.message || 'Gagal menghubungi Supabase Proxy'
        };
      }
    }

    return {
      ok: false,
      status: 0,
      error: 'Proxy GAS Webhook atau Supabase Edge Function belum dikonfigurasi.'
    };
  }

  public markSyncSuccess(timestamp?: string) {
    this.lastSyncTime = timestamp || new Date().toISOString();
    this.lastSyncFailed = false;
    this.lastSyncErrorMessage = null;
    if (this.config.supabaseUrl && this.config.supabaseAnonKey) {
      this.supabaseLastConnected = true;
    }
    this.notify();
  }

  public markSyncFailure(errorMessage?: string) {
    this.lastSyncFailed = true;
    this.lastSyncErrorMessage = errorMessage || 'Sinkronisasi gagal';
    this.notify();
  }

  public markPingResult(result: {
    supabaseConfigured?: boolean;
    supabaseConnected?: boolean;
    gasConnected?: boolean;
  }) {
    if (result.supabaseConnected === true) {
      this.supabaseLastConnected = true;
      this.lastSyncFailed = false;
      this.lastSyncErrorMessage = null;
    } else if (result.supabaseConfigured && result.supabaseConnected === false) {
      this.supabaseLastConnected = false;
    }
    if (result.gasConnected === true && !result.supabaseConfigured) {
      this.lastSyncFailed = false;
      this.lastSyncErrorMessage = null;
    }
    this.notify();
  }

  public getSnapshot(): SyncStatusSnapshot {
    const hasSupabase = Boolean(this.config.supabaseUrl && this.config.supabaseAnonKey);
    const activeMode = this.getStorageMode();
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queuedCount: this.queue.length,
      lastSyncTime: this.lastSyncTime,
      supabaseStatus: !hasSupabase
        ? 'CONFIG_REQUIRED'
        : this.supabaseLastConnected === false
        ? 'DISCONNECTED'
        : 'CONNECTED',
      gasStatus: this.config.gasWebhookUrl ? 'CONNECTED' : 'CONFIG_REQUIRED',
      lastSyncFailed: activeMode === 'LOCAL_ONLY' ? false : this.lastSyncFailed,
      lastSyncErrorMessage: activeMode === 'LOCAL_ONLY' ? null : this.lastSyncErrorMessage,
      storageMode: activeMode,
    };
  }

  public subscribe(listener: (snap: SyncStatusSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  private notifyScheduled = false;

  private notify() {
    if (this.notifyScheduled) return;
    this.notifyScheduled = true;
    const flush = () => {
      this.notifyScheduled = false;
      const snap = this.getSnapshot();
      this.listeners.forEach((fn) => fn(snap));
    };
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(flush);
    } else {
      Promise.resolve().then(flush);
    }
  }

  public enqueue(type: string, action: 'UPSERT' | 'DELETE' | 'INSERT', payload: any) {
    const mode = this.getStorageMode();
    if (mode === 'LOCAL_ONLY') {
      // Mode 1: Lokal Saja (100% Offline — Tanpa Cloud) -> Tidak membuat panggilan otomatis ke Cloud
      return;
    }
    const txUuid = payload?.tx_uuid || payload?.transaction_id || payload?.id;
    if (txUuid && this.queue.some(q => (q.payload?.tx_uuid === txUuid || q.payload?.transaction_id === txUuid || q.payload?.id === txUuid))) {
      return; // Skip duplicate queue item (Idempotency via tx_uuid)
    }
    const item: SyncQueueItem = {
      id: `SYNC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      action,
      payload,
      timestamp: new Date().toISOString()
    };
    this.queue.push(item);
    this.saveQueue();
    this.notify();

    if (this.isOnline && mode === 'ONLINE_CLOUD') {
      this.processQueue();
    }
  }

  public async processQueue(): Promise<number> {
    if (this.getStorageMode() === 'LOCAL_ONLY') return 0;
    if (this.isSyncing || this.queue.length === 0 || !this.isOnline) return 0;

    this.isSyncing = true;
    this.notify();

    let syncedCount = 0;

    try {
      while (this.queue.length > 0 && this.isOnline) {
        const item = this.queue[0];
        const result = await this.sendPayload(item);

        if (result.outcome === 'SYNCED') {
          this.queue.shift();
          this.saveQueue();
          this.lastSyncTime = new Date().toISOString();
          syncedCount++;
        } else if (result.outcome === 'DISCARD_FAILED') {
          console.warn(
            '[DualBackendSync] Mengeluarkan item antrean non-retriable (400/404/409/23505):',
            item.type,
            result.reason
          );
          this.recordFailedQueueItem(item, result.reason || 'Ditolak server (validasi skema/duplikasi)');
          this.queue.shift();
          this.saveQueue();
        } else {
          const nextRetry = (item.retryCount || 0) + 1;
          if (nextRetry >= MAX_QUEUE_RETRIES) {
            console.warn(
              '[DualBackendSync] Item melewati batas retry, dikeluarkan dari antrean aktif:',
              item.type,
              result.reason
            );
            this.recordFailedQueueItem(
              item,
              result.reason || `Melewati batas retry (${MAX_QUEUE_RETRIES}x)`
            );
            this.queue.shift();
            this.saveQueue();
          } else {
            this.queue[0] = {
              ...item,
              retryCount: nextRetry,
              lastError: result.reason,
            };
            this.saveQueue();
            break;
          }
        }
      }

      if (this.queue.length === 0) {
        this.lastSyncFailed = false;
        this.lastSyncErrorMessage = null;
      }
    } catch (e) {
      console.warn('Sync error:', e);
    } finally {
      this.isSyncing = false;
      this.notify();
    }

    return syncedCount;
  }

  private getSignedHeaders(txUuid: string, timestamp: string): Record<string, string> {
    const sessionSig =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('jacs_session_sig') || 'JACS-SECURE-SIG'
        : 'JACS-SECURE-SIG';
    return {
      'Content-Type': 'application/json',
      'X-Session-Signature': sessionSig,
      'X-Client-Timestamp': timestamp,
      'X-Tx-Uuid': txUuid
    };
  }

  private async sendPayload(
    item: SyncQueueItem
  ): Promise<{ outcome: 'SYNCED' | 'DISCARD_FAILED' | 'RETRY_LATER'; reason?: string }> {
    const hasSupabase = Boolean(this.config.supabaseUrl && this.config.supabaseAnonKey);
    const hasGas = Boolean(this.config.gasWebhookUrl);

    if (!hasSupabase && !hasGas) {
      return {
        outcome: 'DISCARD_FAILED',
        reason: 'Endpoint Supabase & GAS belum dikonfigurasi untuk antrean item ini.',
      };
    }

    let supabaseOutcome: 'SYNCED' | 'DISCARD_FAILED' | 'RETRY_LATER' = 'SYNCED';
    let gasOutcome: 'SYNCED' | 'DISCARD_FAILED' | 'RETRY_LATER' = 'SYNCED';
    const reasons: string[] = [];

    const sessionSig = typeof localStorage !== 'undefined' ? (localStorage.getItem('jacs_session_sig') || 'JACS-SECURE-SIG') : 'JACS-SECURE-SIG';
    const txUuid = item.payload?.tx_uuid || item.payload?.transaction_id || generateTxUuid();
    const timestamp = new Date().toISOString();

    // Supabase Sync (if configured)
    if (hasSupabase) {
      try {
        const baseUrl = this.config.supabaseUrl.trim().replace(/\/+$/, '');
        const endpoint = `${baseUrl}/rest/v1/${item.type.toLowerCase()}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            ...this.getSignedHeaders(txUuid, timestamp),
            'apikey': this.config.supabaseAnonKey,
            'Authorization': `Bearer ${this.config.supabaseAnonKey}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({ ...item.payload, _session_sig: sessionSig, _tx_uuid: txUuid })
        });
        if (res.ok) {
          supabaseOutcome = 'SYNCED';
        } else {
          const errText = await res.text().catch(() => '');
          if (this.isNonRetriableHttpError(res.status, errText)) {
            supabaseOutcome = 'DISCARD_FAILED';
            reasons.push(`Supabase HTTP ${res.status}: ${errText.slice(0, 140) || 'Schema/Conflict'}`);
          } else {
            supabaseOutcome = 'RETRY_LATER';
            reasons.push(`Supabase HTTP ${res.status}`);
          }
        }
      } catch (err: any) {
        supabaseOutcome = 'RETRY_LATER';
        reasons.push(`Supabase network error: ${err?.message || 'Fetch failed'}`);
      }
    }

    // Google Apps Script Sync (if configured)
    if (hasGas) {
      try {
        const res = await fetch(this.config.gasWebhookUrl, {
          method: 'POST',
          headers: this.getSignedHeaders(txUuid, timestamp),
          body: JSON.stringify({ ...item, session_signature: sessionSig, tx_uuid: txUuid })
        });
        if (res.ok) {
          gasOutcome = 'SYNCED';
        } else {
          const errText = await res.text().catch(() => '');
          if (this.isNonRetriableHttpError(res.status, errText)) {
            gasOutcome = 'DISCARD_FAILED';
            reasons.push(`GAS HTTP ${res.status}: ${errText.slice(0, 140) || 'Rejected'}`);
          } else {
            gasOutcome = 'RETRY_LATER';
            reasons.push(`GAS HTTP ${res.status}`);
          }
        }
      } catch (err: any) {
        gasOutcome = 'RETRY_LATER';
        reasons.push(`GAS network error: ${err?.message || 'Fetch failed'}`);
      }
    }

    if (supabaseOutcome === 'RETRY_LATER' || gasOutcome === 'RETRY_LATER') {
      return { outcome: 'RETRY_LATER', reason: reasons.join(' | ') };
    }
    if (supabaseOutcome === 'DISCARD_FAILED' || gasOutcome === 'DISCARD_FAILED') {
      return { outcome: 'DISCARD_FAILED', reason: reasons.join(' | ') };
    }
    return { outcome: 'SYNCED' };
  }

  // =========================================================================
  // REMOTE MAINTENANCE & TELEMETRY HUB
  // =========================================================================

  public getRemoteCommandLogs(): RemoteCommandExecutionLog[] {
    try {
      const saved = localStorage.getItem(REMOTE_ACK_BUS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  public getTelemetryReports(): BranchTelemetryReport[] {
    try {
      const saved = localStorage.getItem(REMOTE_TELEMETRY_BUS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  public clearRemoteHubLogs() {
    try {
      localStorage.removeItem(REMOTE_CMD_BUS_KEY);
      localStorage.removeItem(REMOTE_ACK_BUS_KEY);
      localStorage.removeItem(REMOTE_TELEMETRY_BUS_KEY);
    } catch {}
    this.ackListeners.forEach((fn) => fn([]));
    this.telemetryListeners.forEach((fn) => fn([]));
  }

  public subscribeRemoteCommands(listener: (cmd: RemoteCommandPayload) => void): () => void {
    this.commandListeners.add(listener);
    return () => this.commandListeners.delete(listener);
  }

  public subscribeRemoteAcks(listener: (logs: RemoteCommandExecutionLog[]) => void): () => void {
    this.ackListeners.add(listener);
    listener(this.getRemoteCommandLogs());
    return () => this.ackListeners.delete(listener);
  }

  public subscribeTelemetryReports(listener: (reports: BranchTelemetryReport[]) => void): () => void {
    this.telemetryListeners.add(listener);
    listener(this.getTelemetryReports());
    return () => this.telemetryListeners.delete(listener);
  }

  public async dispatchRemoteCommand(params: {
    command: RemoteCommandType;
    targetBranchId: string;
    customMessage?: string;
    lockActive?: boolean;
    issuedBy?: string;
  }): Promise<{
    command: RemoteCommandPayload;
    transport: 'GAS_SUPABASE' | 'LOCAL_BROADCAST' | 'HYBRID';
    remoteOk: boolean;
  }> {
    const txUuid = generateTxUuid();
    const nowIso = new Date().toISOString();
    const command: RemoteCommandPayload = {
      id: `RCMD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      command: params.command,
      targetBranchId: params.targetBranchId || 'ALL_BRANCHES',
      customMessage: params.customMessage,
      lockActive: params.lockActive,
      issuedBy: params.issuedBy || 'Super Admin',
      issuedAt: nowIso,
      tx_uuid: txUuid,
      senderTabId: this.tabId
    };

    let hasRemoteEndpoint = false;
    let remoteOk = false;
    const sessionSig =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('jacs_session_sig') || 'JACS-SECURE-SIG'
        : 'JACS-SECURE-SIG';

    // 1. Dispatch to Supabase (if configured)
    if (this.config.supabaseUrl && this.config.supabaseAnonKey) {
      hasRemoteEndpoint = true;
      try {
        const res = await fetch(`${this.config.supabaseUrl}/rest/v1/remote_commands`, {
          method: 'POST',
          headers: {
            ...this.getSignedHeaders(txUuid, nowIso),
            'apikey': this.config.supabaseAnonKey,
            'Authorization': `Bearer ${this.config.supabaseAnonKey}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            action: 'DISPATCH_REMOTE_COMMAND',
            id: command.id,
            command: command.command,
            target_branch_id: command.targetBranchId,
            custom_message: command.customMessage || null,
            lock_active: command.lockActive ?? null,
            issued_by: command.issuedBy,
            issued_at: command.issuedAt,
            tx_uuid: command.tx_uuid,
            session_signature: sessionSig
          })
        });
        if (res.ok) remoteOk = true;
      } catch {}
    }

    // 2. Dispatch to Google Apps Script (if configured)
    if (this.config.gasWebhookUrl) {
      hasRemoteEndpoint = true;
      try {
        const res = await fetch(this.config.gasWebhookUrl, {
          method: 'POST',
          headers: this.getSignedHeaders(txUuid, nowIso),
          body: JSON.stringify({
            action: 'DISPATCH_REMOTE_COMMAND',
            payload: command,
            session_signature: sessionSig,
            tx_uuid: txUuid
          })
        });
        if (res.ok) remoteOk = true;
      } catch {}
    }

    const transport: 'GAS_SUPABASE' | 'LOCAL_BROADCAST' | 'HYBRID' = hasRemoteEndpoint
      ? remoteOk
        ? 'HYBRID'
        : 'LOCAL_BROADCAST'
      : 'LOCAL_BROADCAST';

    // 3. Persist on local bus for cross-tab polling & storage events
    try {
      const existingRaw = localStorage.getItem(REMOTE_CMD_BUS_KEY);
      const existing: RemoteCommandPayload[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [command, ...(Array.isArray(existing) ? existing : [])].slice(0, 40);
      localStorage.setItem(REMOTE_CMD_BUS_KEY, JSON.stringify(updated));
    } catch {}

    // 4. Broadcast across browser tabs via BroadcastChannel
    try {
      this.remoteChannel?.postMessage({ kind: 'REMOTE_COMMAND', payload: command });
    } catch {}

    // 5. Notify current-tab subscriber as well so single-tab testing executes seamlessly
    this.commandListeners.forEach((fn) => fn(command));

    return { command, transport, remoteOk };
  }

  public async pollRemoteCommands(branchId: string): Promise<RemoteCommandPayload[]> {
    const collected: RemoteCommandPayload[] = [];
    const nowIso = new Date().toISOString();
    const txUuid = generateTxUuid();
    const sessionSig =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('jacs_session_sig') || 'JACS-SECURE-SIG'
        : 'JACS-SECURE-SIG';

    const isLocalOnlyMode = this.getStorageMode() === 'LOCAL_ONLY';

    // 1. Poll Supabase remote_commands (if configured and not LOCAL_ONLY)
    if (!isLocalOnlyMode && this.config.supabaseUrl && this.config.supabaseAnonKey && this.isOnline) {
      try {
        const url = `${this.config.supabaseUrl}/rest/v1/remote_commands?or=(target_branch_id.eq.ALL_BRANCHES,target_branch_id.eq.${encodeURIComponent(branchId)})&order=issued_at.desc&limit=15`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            ...this.getSignedHeaders(txUuid, nowIso),
            'apikey': this.config.supabaseAnonKey,
            'Authorization': `Bearer ${this.config.supabaseAnonKey}`,
            'X-Remote-Action': 'POLL_REMOTE_COMMANDS'
          }
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows)) {
            rows.forEach((r: any) => {
              collected.push({
                id: r.id,
                command: r.command,
                targetBranchId: r.target_branch_id || r.targetBranchId || 'ALL_BRANCHES',
                customMessage: r.custom_message || r.customMessage,
                lockActive: r.lock_active ?? r.lockActive,
                issuedBy: r.issued_by || r.issuedBy || 'Super Admin',
                issuedAt: r.issued_at || r.issuedAt || nowIso,
                tx_uuid: r.tx_uuid || generateTxUuid()
              });
            });
          }
        }
      } catch {}
    }

    // 2. Poll Google Apps Script (if configured and not LOCAL_ONLY)
    if (!isLocalOnlyMode && this.config.gasWebhookUrl && this.isOnline) {
      try {
        const res = await fetch(this.config.gasWebhookUrl, {
          method: 'POST',
          headers: this.getSignedHeaders(txUuid, nowIso),
          body: JSON.stringify({
            action: 'POLL_REMOTE_COMMANDS',
            branchId,
            session_signature: sessionSig,
            tx_uuid: txUuid,
            timestamp: nowIso
          })
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data?.commands) ? data.commands : Array.isArray(data) ? data : [];
          list.forEach((c: any) => {
            if (c && c.id && c.command) collected.push(c);
          });
        }
      } catch {}
    }

    // 3. Always merge local cross-tab bus
    try {
      const raw = localStorage.getItem(REMOTE_CMD_BUS_KEY);
      if (raw) {
        const localCmds: RemoteCommandPayload[] = JSON.parse(raw);
        if (Array.isArray(localCmds)) {
          localCmds.forEach((c) => {
            if (
              c &&
              (c.targetBranchId === 'ALL_BRANCHES' || c.targetBranchId === branchId) &&
              !collected.some((x) => x.id === c.id)
            ) {
              collected.push(c);
            }
          });
        }
      }
    } catch {}

    return collected;
  }

  public publishRemoteAck(log: RemoteCommandExecutionLog) {
    try {
      const existing = this.getRemoteCommandLogs();
      const next = [log, ...existing.filter((x) => !(x.commandId === log.commandId && x.branchId === log.branchId && x.status === log.status))].slice(0, 60);
      localStorage.setItem(REMOTE_ACK_BUS_KEY, JSON.stringify(next));
      this.ackListeners.forEach((fn) => fn(next));
      this.remoteChannel?.postMessage({ kind: 'REMOTE_ACK', payload: log });
    } catch {}
  }

  public async publishTelemetryReport(report: BranchTelemetryReport) {
    try {
      const existing = this.getTelemetryReports();
      const next = [report, ...existing.filter((x) => x.id !== report.id)].slice(0, 30);
      localStorage.setItem(REMOTE_TELEMETRY_BUS_KEY, JSON.stringify(next));
      this.telemetryListeners.forEach((fn) => fn(next));
      this.remoteChannel?.postMessage({ kind: 'REMOTE_TELEMETRY', payload: report });
    } catch {}

    // Best-effort upload to configured GAS/Supabase (skip in LOCAL_ONLY mode)
    if (this.getStorageMode() === 'LOCAL_ONLY') return;
    const txUuid = generateTxUuid();
    if (this.config.gasWebhookUrl && this.isOnline) {
      try {
        await fetch(this.config.gasWebhookUrl, {
          method: 'POST',
          headers: this.getSignedHeaders(txUuid, report.reportedAt),
          body: JSON.stringify({
            action: 'REPORT_REMOTE_TELEMETRY',
            payload: report,
            tx_uuid: txUuid
          })
        });
      } catch {}
    }
  }

  public async testConnections(): Promise<{ supabase: string; gas: string }> {
    let supabaseMsg = 'Not Configured';
    let gasMsg = 'Not Configured';

    if (this.config.supabaseUrl && this.config.supabaseAnonKey) {
      const baseUrl = this.config.supabaseUrl.trim().replace(/\/+$/, '');
      const anonKey = this.config.supabaseAnonKey.trim();
      const headers = {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: 'application/json',
      };
      try {
        let targetTable = 'jacs_erp_snapshots';
        let res = await fetch(`${baseUrl}/rest/v1/${targetTable}?select=id&limit=1`, { headers });
        if (res.status === 404) {
          targetTable = 'cloud_sync';
          res = await fetch(`${baseUrl}/rest/v1/${targetTable}?select=id&limit=1`, { headers });
        }
        if (res.ok) {
          supabaseMsg = `Connected (${targetTable} • ${res.status} OK)`;
          this.markPingResult({ supabaseConfigured: true, supabaseConnected: true });
        } else {
          supabaseMsg = `Failed (${res.status})`;
          this.markPingResult({ supabaseConfigured: true, supabaseConnected: false });
        }
      } catch (e: any) {
        supabaseMsg = `Error: ${e.message || 'Network Fail'}`;
        this.markPingResult({ supabaseConfigured: true, supabaseConnected: false });
      }
    }

    if (this.config.gasWebhookUrl) {
      try {
        const res = await fetch(this.config.gasWebhookUrl, { method: 'OPTIONS' });
        gasMsg = res.ok ? 'Connected (200 OK)' : `Ready (${res.status})`;
      } catch (e: any) {
        gasMsg = `Webhook Ready (CORS Warning Possible)`;
      }
    }

    return { supabase: supabaseMsg, gas: gasMsg };
  }

  public exportBackupJson(data: any) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JacS_RetailOS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const dualBackendSync = new DualBackendSyncEngine();
