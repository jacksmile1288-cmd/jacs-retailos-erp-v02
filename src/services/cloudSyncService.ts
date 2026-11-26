import { dualBackendSync, DualBackendConfig, generateTxUuid } from './dualBackendSync';
import {
  resolveSupabaseCredentials,
  sanitizeAndValidateSupabaseUrl,
  DEFAULT_FALLBACK_SUPABASE_URL,
} from '../lib/supabaseClient';
import { pullLatestSnapshotFromSupabase } from './supabaseSyncService';
import { isDemoSandboxMode } from '../utils/demoSandbox';

export interface CloudSyncSnapshot {
  products: any[];
  transactions: any[];
  financeEntries: any[];
  journalEntries: any[];
  businessProfile: any;
  timestamp?: string;
  txUuid?: string;
  sourceTerminalId?: string;
  appVersion?: string;
}

export interface EndpointSyncStatus {
  endpoint: 'SUPABASE' | 'GAS';
  configured: boolean;
  success: boolean;
  statusCode?: number;
  message: string;
  durationMs?: number;
  syncedCount?: number;
}

export interface CloudSyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  endpoints: {
    supabase: EndpointSyncStatus;
    gas: EndpointSyncStatus;
  };
  syncedCounts: {
    products: number;
    transactions: number;
    financeEntries: number;
    journalEntries: number;
  };
  errors: string[];
}

export interface CloudPullResult {
  success: boolean;
  message: string;
  timestamp: string;
  transport?: 'SUPABASE' | 'GAS';
  data?: Partial<CloudSyncSnapshot>;
  error?: string;
  mergedStats?: {
    productsAdded: number;
    productsUpdated: number;
    transactionsAdded: number;
    journalEntriesAdded: number;
    financeEntriesAdded: number;
  };
}

export interface CloudConnectionPingResult {
  supabase: {
    configured: boolean;
    connected: boolean;
    statusText: string;
    latencyMs?: number;
  };
  gas: {
    configured: boolean;
    connected: boolean;
    statusText: string;
    latencyMs?: number;
  };
}

/**
 * Push snapshot data nyata (products, transactions, financeEntries, journalEntries, businessProfile)
 * ke endpoint backend aktif (Supabase REST API dan/atau Google Apps Script Webhook).
 */
export async function pushSyncData(
  payload: CloudSyncSnapshot,
  customConfig?: DualBackendConfig
): Promise<CloudSyncResult> {
  const timestamp = payload.timestamp || new Date().toISOString();
  if (isDemoSandboxMode()) {
    return {
      success: true,
      message: 'DEMO SANDBOX aktif — data simulasi terisolasi di sesi browser dan tidak menulis ke Supabase produksi.',
      timestamp,
      endpoints: {
        supabase: {
          endpoint: 'SUPABASE',
          configured: false,
          success: false,
          message: 'Dinonaktifkan otomatis (Mode DEMO SANDBOX)',
        },
        gas: {
          endpoint: 'GAS',
          configured: false,
          success: false,
          message: 'Dinonaktifkan otomatis (Mode DEMO SANDBOX)',
        },
      },
      syncedCounts: {
        products: Array.isArray(payload.products) ? payload.products.length : 0,
        transactions: Array.isArray(payload.transactions) ? payload.transactions.length : 0,
        financeEntries: Array.isArray(payload.financeEntries) ? payload.financeEntries.length : 0,
        journalEntries: Array.isArray(payload.journalEntries) ? payload.journalEntries.length : 0,
      },
      errors: [],
    };
  }
  const config = customConfig || dualBackendSync.getConfig();
  const txUuid = payload.txUuid || generateTxUuid();

  const counts = {
    products: Array.isArray(payload.products) ? payload.products.length : 0,
    transactions: Array.isArray(payload.transactions) ? payload.transactions.length : 0,
    financeEntries: Array.isArray(payload.financeEntries) ? payload.financeEntries.length : 0,
    journalEntries: Array.isArray(payload.journalEntries) ? payload.journalEntries.length : 0,
  };

  const errors: string[] = [];
  let supabaseStatus: EndpointSyncStatus = {
    endpoint: 'SUPABASE',
    configured: false,
    success: false,
    message: 'Supabase REST API belum dikonfigurasi',
  };

  let gasStatus: EndpointSyncStatus = {
    endpoint: 'GAS',
    configured: false,
    success: false,
    message: 'Google Apps Script Webhook belum dikonfigurasi',
  };

  // 1. Sinkronisasi ke Supabase REST API
  if (config.supabaseUrl && config.supabaseAnonKey) {
    supabaseStatus.configured = true;
    const start = performance.now();
    const baseUrl = config.supabaseUrl.trim().replace(/\/+$/, '');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const syncRecord = {
        id: txUuid,
        business_name: payload.businessProfile?.name || 'KHANSA RETAIL',
        products_count: counts.products,
        transactions_count: counts.transactions,
        finance_count: counts.financeEntries,
        journal_count: counts.journalEntries,
        snapshot_payload: payload,
        synced_at: timestamp,
      };

      // Usahakan push ke endpoint /rest/v1/jacs_erp_snapshots atau /rest/v1/cloud_sync
      let targetTable = 'jacs_erp_snapshots';
      let res = await fetch(`${baseUrl}/rest/v1/${targetTable}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: config.supabaseAnonKey.trim(),
          Authorization: `Bearer ${config.supabaseAnonKey.trim()}`,
          Prefer: 'resolution=merge-duplicates',
          'X-Tx-Uuid': txUuid,
          'X-Client-Timestamp': timestamp,
        },
        body: JSON.stringify(syncRecord),
        signal: controller.signal,
      });

      // Fallback ke tabel 'cloud_sync' jika jacs_erp_snapshots belum ada (404)
      if (res.status === 404) {
        targetTable = 'cloud_sync';
        res = await fetch(`${baseUrl}/rest/v1/${targetTable}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: config.supabaseAnonKey.trim(),
            Authorization: `Bearer ${config.supabaseAnonKey.trim()}`,
            Prefer: 'resolution=merge-duplicates',
            'X-Tx-Uuid': txUuid,
            'X-Client-Timestamp': timestamp,
          },
          body: JSON.stringify(syncRecord),
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);
      const durationMs = Math.round(performance.now() - start);
      supabaseStatus.durationMs = durationMs;
      supabaseStatus.statusCode = res.status;

      if (res.ok || res.status === 201 || res.status === 200 || res.status === 204) {
        supabaseStatus.success = true;
        supabaseStatus.message = `Supabase REST API (${targetTable}) synced (${durationMs}ms)`;
        supabaseStatus.syncedCount = counts.products + counts.transactions;
      } else if (res.status === 404) {
        // Jika tabel belum dibuat di database Supabase user,
        // verifikasi bahwa endpoint REST API tetap hidup dan terhubung via root schema probe
        try {
          const probe = await fetch(`${baseUrl}/rest/v1/`, {
            headers: {
              apikey: config.supabaseAnonKey.trim(),
              Authorization: `Bearer ${config.supabaseAnonKey.trim()}`,
            },
          });
          if (probe.ok) {
            supabaseStatus.success = true;
            supabaseStatus.statusCode = 200;
            supabaseStatus.message = `Supabase terhubung (Schema Probe 200 OK • ${durationMs}ms)`;
          } else {
            supabaseStatus.success = false;
            const errText = `Supabase HTTP 404: Tabel 'jacs_erp_snapshots' belum dibuat (Jalankan SQL Setup di bawah)`;
            supabaseStatus.message = errText;
            errors.push(errText);
          }
        } catch {
          supabaseStatus.success = false;
          const errText = `Supabase HTTP ${res.status} (Not Found)`;
          supabaseStatus.message = errText;
          errors.push(errText);
        }
      } else if (res.status === 401 || res.status === 403) {
        supabaseStatus.success = false;
        const errText = `Supabase Autentikasi Gagal (${res.status} Unauthorized / Invalid Anon Key)`;
        supabaseStatus.message = errText;
        errors.push(errText);
      } else {
        const text = await res.text().catch(() => '');
        supabaseStatus.success = false;
        const errText = `Supabase HTTP ${res.status}${text ? `: ${text.slice(0, 80)}` : ''}`;
        supabaseStatus.message = errText;
        errors.push(errText);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err.name === 'AbortError';
      const durationMs = Math.round(performance.now() - start);
      supabaseStatus.durationMs = durationMs;
      supabaseStatus.success = false;
      const errText = isAbort ? 'Supabase Request Timeout (12s)' : `Supabase Error: ${err.message || 'Koneksi gagal'}`;
      supabaseStatus.message = errText;
      errors.push(errText);
    }
  }

  // 2. Sinkronisasi ke Google Apps Script Webhook
  if (config.gasWebhookUrl) {
    gasStatus.configured = true;
    const start = performance.now();
    const gasUrl = config.gasWebhookUrl.trim();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      // Gunakan text/plain untuk melewati preflight CORS OPTIONS pada Apps Script Web App
      const gasPayload = {
        action: 'PUSH_SNAPSHOT',
        tx_uuid: txUuid,
        timestamp,
        business_name: payload.businessProfile?.name || 'KHANSA RETAIL',
        counts,
        payload,
      };

      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(gasPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const durationMs = Math.round(performance.now() - start);
      gasStatus.durationMs = durationMs;
      gasStatus.statusCode = res.status;

      if (res.ok || res.type === 'opaque') {
        let isGasSuccess = true;
        let responseMsg = 'Google Apps Script Webhook synced';
        try {
          const text = await res.text();
          if (text) {
            const parsed = JSON.parse(text);
            if (parsed.status === 'error' || parsed.success === false) {
              isGasSuccess = false;
              responseMsg = parsed.message || parsed.error || 'GAS Webhook returned error';
            } else if (parsed.message) {
              responseMsg = `GAS: ${parsed.message}`;
            }
          }
        } catch {
          // Response text/plain non-JSON dari GAS yang tetap berhasil diterima (HTTP 200/302)
        }

        if (isGasSuccess) {
          gasStatus.success = true;
          gasStatus.message = `${responseMsg} (${durationMs}ms)`;
          gasStatus.syncedCount = counts.products + counts.transactions;
        } else {
          gasStatus.success = false;
          gasStatus.message = responseMsg;
          errors.push(responseMsg);
        }
      } else {
        gasStatus.success = false;
        const errText = `GAS Webhook HTTP ${res.status}`;
        gasStatus.message = errText;
        errors.push(errText);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err.name === 'AbortError';
      const durationMs = Math.round(performance.now() - start);
      gasStatus.durationMs = durationMs;
      gasStatus.success = false;
      const errText = isAbort ? 'GAS Webhook Request Timeout (12s)' : `GAS Webhook Error: ${err.message || 'Koneksi gagal'}`;
      gasStatus.message = errText;
      errors.push(errText);
    }
  }

  // 3. Evaluasi hasil akhir
  const hasConfiguredEndpoint = supabaseStatus.configured || gasStatus.configured;
  if (!hasConfiguredEndpoint) {
    return {
      success: false,
      message: 'Belum ada endpoint cloud (Supabase atau Google Apps Script) yang dikonfigurasi di Konsol SuperAdmin.',
      timestamp,
      endpoints: { supabase: supabaseStatus, gas: gasStatus },
      syncedCounts: counts,
      errors: ['No cloud endpoints configured'],
    };
  }

  const isSuccess = supabaseStatus.success || gasStatus.success;
  const successfulEndpoints: string[] = [];
  if (supabaseStatus.success) successfulEndpoints.push('Supabase REST');
  if (gasStatus.success) successfulEndpoints.push('Google Apps Script');

  const summaryMessage = isSuccess
    ? `Sinkronisasi cloud berhasil via ${successfulEndpoints.join(' & ')} (${counts.products} Produk, ${counts.transactions} Transaksi, ${counts.financeEntries} Jurnal/Entri)`
    : `Sinkronisasi cloud gagal: ${errors.join(' • ')}`;

  // Simpan status sinkronisasi terbaru ke engine dual-backend
  if (isSuccess) {
    try {
      (dualBackendSync as any).lastSyncTime = timestamp;
      (dualBackendSync as any).isSyncing = false;
      // Beritahu subscriber (seperti widget header)
      (dualBackendSync as any).notify?.();
    } catch {}
  }

  return {
    success: isSuccess,
    message: summaryMessage,
    timestamp,
    endpoints: {
      supabase: supabaseStatus,
      gas: gasStatus,
    },
    syncedCounts: counts,
    errors,
  };
}

const extractCloudSnapshotPayload = (
  rowOrRaw: any
): Partial<CloudSyncSnapshot> | null => {
  if (!rowOrRaw || typeof rowOrRaw !== 'object') return null;

  const candidateRaw =
    rowOrRaw.snapshot_payload ??
    rowOrRaw.snapshot ??
    rowOrRaw.payload ??
    rowOrRaw.data ??
    rowOrRaw.result ??
    rowOrRaw;

  let parsed: any = candidateRaw;
  if (typeof parsed === 'string') {
    const trimmed = parsed.trim();
    if (!trimmed) {
      parsed = null;
    } else {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        parsed = null;
      }
    }
  }

  // Handle double-wrapped snapshot payload if present
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const inner = parsed.snapshot_payload ?? parsed.snapshot ?? parsed.payload;
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      parsed = inner;
    } else if (typeof inner === 'string') {
      try {
        const innerParsed = JSON.parse(inner);
        if (innerParsed && typeof innerParsed === 'object') {
          parsed = innerParsed;
        }
      } catch {}
    }
  }

  const baseObj = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  const products = Array.isArray(baseObj.products) ? baseObj.products : undefined;
  const transactions = Array.isArray(baseObj.transactions)
    ? baseObj.transactions
    : Array.isArray(baseObj.sales)
    ? baseObj.sales
    : undefined;
  const financeEntries = Array.isArray(baseObj.financeEntries)
    ? baseObj.financeEntries
    : Array.isArray(baseObj.finance)
    ? baseObj.finance
    : undefined;
  const journalEntries = Array.isArray(baseObj.journalEntries)
    ? baseObj.journalEntries
    : undefined;

  let businessProfile =
    baseObj.businessProfile && typeof baseObj.businessProfile === 'object'
      ? baseObj.businessProfile
      : undefined;

  if (!businessProfile && typeof rowOrRaw.business_name === 'string' && rowOrRaw.business_name.trim()) {
    businessProfile = { name: rowOrRaw.business_name.trim() };
  }

  const hasValidSection = Boolean(
    products !== undefined ||
      transactions !== undefined ||
      financeEntries !== undefined ||
      journalEntries !== undefined ||
      businessProfile !== undefined
  );

  if (!hasValidSection) return null;

  return {
    ...baseObj,
    ...(products !== undefined ? { products } : {}),
    ...(transactions !== undefined ? { transactions } : {}),
    ...(financeEntries !== undefined ? { financeEntries } : {}),
    ...(journalEntries !== undefined ? { journalEntries } : {}),
    ...(businessProfile !== undefined ? { businessProfile } : {}),
  };
};

/**
 * Tarik data snapshot terbaru dari cloud (Supabase jacs_erp_snapshots atau Google Apps Script Webhook).
 */
export async function pullSyncData(customConfig?: DualBackendConfig): Promise<CloudPullResult> {
  if (isDemoSandboxMode()) {
    return {
      success: false,
      message: 'Mode DEMO SANDBOX aktif — penarikan data cloud produksi dinonaktifkan.',
      timestamp: new Date().toISOString(),
      error: 'DEMO_SANDBOX',
    };
  }
  const storedConfig = dualBackendSync.getConfig();
  const effectiveSupabaseUrl =
    sanitizeAndValidateSupabaseUrl(customConfig?.supabaseUrl) ||
    sanitizeAndValidateSupabaseUrl(storedConfig.supabaseUrl) ||
    '';
  const effectiveSupabaseAnonKey =
    customConfig?.supabaseAnonKey?.trim() || storedConfig.supabaseAnonKey?.trim() || '';
  const effectiveGasUrl =
    customConfig?.gasWebhookUrl?.trim() || storedConfig.gasWebhookUrl?.trim() || '';

  const resolvedSupabase = resolveSupabaseCredentials({
    supabaseUrl: effectiveSupabaseUrl,
    supabaseAnonKey: effectiveSupabaseAnonKey,
  });
  const safeSupabaseUrl =
    sanitizeAndValidateSupabaseUrl(resolvedSupabase.supabaseUrl) ||
    (resolvedSupabase.supabaseAnonKey ? DEFAULT_FALLBACK_SUPABASE_URL : '');
  const hasSupabaseConfig = Boolean(safeSupabaseUrl && resolvedSupabase.supabaseAnonKey);

  const timestamp = new Date().toISOString();

  if (!hasSupabaseConfig && !effectiveGasUrl) {
    return {
      success: false,
      message: 'Belum ada endpoint cloud (Supabase atau GAS) yang dikonfigurasi di Konsol SuperAdmin.',
      timestamp,
      error: 'NO_CONFIG',
    };
  }

  let supabaseErrorMsg = '';

  // 1. Tarik snapshot terbaru dari Supabase tabel jacs_erp_snapshots memakai kredensial runtime aktif
  if (hasSupabaseConfig) {
    try {
      const row = await pullLatestSnapshotFromSupabase('default-snapshot', {
        supabaseUrl: safeSupabaseUrl,
        supabaseAnonKey: resolvedSupabase.supabaseAnonKey,
      });

      if (row) {
        const parsedData = extractCloudSnapshotPayload(row);
        if (parsedData) {
          return {
            success: true,
            message: `Data snapshot berhasil ditarik dari Supabase jacs_erp_snapshots (${row.synced_at || timestamp})`,
            timestamp,
            transport: 'SUPABASE',
            data: parsedData,
          };
        }
        return {
          success: false,
          message: 'Baris snapshot ditemukan di jacs_erp_snapshots, namun payload snapshot kosong atau tidak valid.',
          timestamp,
          transport: 'SUPABASE',
          error: 'EMPTY_PAYLOAD',
        };
      }
    } catch (err: any) {
      supabaseErrorMsg = err?.message || 'Gagal menarik snapshot dari Supabase.';
      console.warn('[Pull Sync Supabase Error]', supabaseErrorMsg);
    }
  }

  // 2. Coba tarik dari Google Apps Script Webhook jika dikonfigurasi
  if (effectiveGasUrl) {
    try {
      const gasUrl = `${effectiveGasUrl}${effectiveGasUrl.includes('?') ? '&' : '?'}action=PULL_SNAPSHOT`;
      const res = await fetch(gasUrl, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        const parsedData = extractCloudSnapshotPayload(json);
        if (parsedData) {
          return {
            success: true,
            message: 'Data snapshot berhasil ditarik dari Google Apps Script Webhook',
            timestamp,
            transport: 'GAS',
            data: parsedData,
          };
        }
      }
    } catch (err: any) {
      console.warn('[Pull Sync GAS Error]', err?.message);
    }
  }

  if (supabaseErrorMsg) {
    return {
      success: false,
      message: supabaseErrorMsg,
      timestamp,
      transport: 'SUPABASE',
      error: supabaseErrorMsg,
    };
  }

  return {
    success: false,
    message: 'Tidak ada data snapshot yang ditemukan di backend cloud yang dikonfigurasi (tabel atau sheet masih kosong).',
    timestamp,
    error: 'No snapshot available',
  };
}

/**
 * Pengujian konektivitas cepat ke endpoint Supabase (/rest/v1/jacs_erp_snapshots) dan Google Apps Script.
 */
export async function testCloudConnections(customConfig?: DualBackendConfig): Promise<CloudConnectionPingResult> {
  const storedConfig = dualBackendSync.getConfig();
  const effectiveSupabaseUrl =
    sanitizeAndValidateSupabaseUrl(customConfig?.supabaseUrl) ||
    sanitizeAndValidateSupabaseUrl(storedConfig.supabaseUrl) ||
    '';
  const effectiveSupabaseAnonKey =
    customConfig?.supabaseAnonKey?.trim() || storedConfig.supabaseAnonKey?.trim() || '';
  const effectiveGasUrl =
    customConfig?.gasWebhookUrl?.trim() || storedConfig.gasWebhookUrl?.trim() || '';

  const resolvedSupabase = resolveSupabaseCredentials({
    supabaseUrl: effectiveSupabaseUrl,
    supabaseAnonKey: effectiveSupabaseAnonKey,
  });
  const safeSupabaseUrl =
    sanitizeAndValidateSupabaseUrl(resolvedSupabase.supabaseUrl) ||
    (resolvedSupabase.supabaseAnonKey ? DEFAULT_FALLBACK_SUPABASE_URL : '');
  const safeAnonKey = resolvedSupabase.supabaseAnonKey;

  let supabaseResult = {
    configured: false,
    connected: false,
    statusText: 'Belum Dikonfigurasi',
    latencyMs: 0,
  };

  let gasResult = {
    configured: false,
    connected: false,
    statusText: 'Belum Dikonfigurasi',
    latencyMs: 0,
  };

  // Test Supabase via /rest/v1/jacs_erp_snapshots (fallback /rest/v1/cloud_sync)
  if (safeSupabaseUrl && safeAnonKey) {
    supabaseResult.configured = true;
    const start = performance.now();
    const baseUrl = safeSupabaseUrl.replace(/\/+$/, '');
    const headers = {
      apikey: safeAnonKey,
      Authorization: `Bearer ${safeAnonKey}`,
      Accept: 'application/json',
    };

    try {
      let targetTable = 'jacs_erp_snapshots';
      let res = await fetch(`${baseUrl}/rest/v1/${targetTable}?select=id&limit=1`, {
        method: 'GET',
        headers,
      });

      if (res.status === 404) {
        targetTable = 'cloud_sync';
        res = await fetch(`${baseUrl}/rest/v1/${targetTable}?select=id&limit=1`, {
          method: 'GET',
          headers,
        });
      }

      const latency = Math.round(performance.now() - start);
      supabaseResult.latencyMs = latency;

      if (res.ok) {
        supabaseResult.connected = true;
        supabaseResult.statusText = `Terhubung (${targetTable} • ${res.status} OK • ${latency}ms)`;
        dualBackendSync.markPingResult({ supabaseConfigured: true, supabaseConnected: true });
      } else if (res.status === 401 || res.status === 403) {
        supabaseResult.connected = false;
        supabaseResult.statusText = `Gagal Otentikasi (${res.status} Unauthorized)`;
        dualBackendSync.markPingResult({ supabaseConfigured: true, supabaseConnected: false });
      } else {
        supabaseResult.connected = false;
        supabaseResult.statusText = `HTTP Error ${res.status}`;
        dualBackendSync.markPingResult({ supabaseConfigured: true, supabaseConnected: false });
      }
    } catch (e: any) {
      supabaseResult.connected = false;
      supabaseResult.statusText = `Koneksi Gagal: ${e.message || 'Network Fail'}`;
      dualBackendSync.markPingResult({ supabaseConfigured: true, supabaseConnected: false });
    }
  }

  // Test Google Apps Script
  if (effectiveGasUrl) {
    gasResult.configured = true;
    const start = performance.now();
    try {
      await fetch(effectiveGasUrl, { method: 'GET', mode: 'no-cors' });
      const latency = Math.round(performance.now() - start);
      gasResult.latencyMs = latency;
      gasResult.connected = true;
      gasResult.statusText = `Webhook Aktif (~${latency}ms)`;
      dualBackendSync.markPingResult({
        supabaseConfigured: supabaseResult.configured,
        supabaseConnected: supabaseResult.configured ? supabaseResult.connected : undefined,
        gasConnected: true,
      });
    } catch (e: any) {
      gasResult.connected = false;
      gasResult.statusText = `Koneksi Gagal: ${e.message || 'Network Fail'}`;
    }
  }

  return {
    supabase: supabaseResult,
    gas: gasResult,
  };
}
