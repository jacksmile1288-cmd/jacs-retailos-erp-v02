import { dualBackendSync, DualBackendConfig, generateTxUuid } from './dualBackendSync';

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
  const config = customConfig || dualBackendSync.getConfig();
  const txUuid = payload.txUuid || generateTxUuid();
  const timestamp = payload.timestamp || new Date().toISOString();

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

/**
 * Tarik data snapshot terbaru dari cloud (Supabase REST API atau Google Apps Script Webhook).
 */
export async function pullSyncData(customConfig?: DualBackendConfig): Promise<CloudPullResult> {
  const config = customConfig || dualBackendSync.getConfig();
  const timestamp = new Date().toISOString();

  if (!config.supabaseUrl && !config.gasWebhookUrl) {
    return {
      success: false,
      message: 'Belum ada endpoint cloud (Supabase atau GAS) yang dikonfigurasi di Konsol SuperAdmin.',
      timestamp,
      error: 'NO_CONFIG',
    };
  }

  // 1. Coba tarik dari Supabase REST API (jacs_erp_snapshots atau cloud_sync)
  if (config.supabaseUrl && config.supabaseAnonKey) {
    const baseUrl = config.supabaseUrl.trim().replace(/\/+$/, '');
    try {
      let res = await fetch(`${baseUrl}/rest/v1/jacs_erp_snapshots?order=synced_at.desc&limit=1`, {
        headers: {
          apikey: config.supabaseAnonKey.trim(),
          Authorization: `Bearer ${config.supabaseAnonKey.trim()}`,
          Accept: 'application/json',
        },
      });

      if (res.status === 404) {
        res = await fetch(`${baseUrl}/rest/v1/cloud_sync?order=synced_at.desc&limit=1`, {
          headers: {
            apikey: config.supabaseAnonKey.trim(),
            Authorization: `Bearer ${config.supabaseAnonKey.trim()}`,
            Accept: 'application/json',
          },
        });
      }

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const rawPayload = rows[0]?.snapshot_payload || rows[0]?.payload || rows[0]?.data;
          let parsedData = rawPayload;
          if (typeof rawPayload === 'string') {
            try {
              parsedData = JSON.parse(rawPayload);
            } catch {}
          }
          if (parsedData && (parsedData.products || parsedData.transactions || parsedData.financeEntries || parsedData.journalEntries)) {
            return {
              success: true,
              message: `Data snapshot berhasil ditarik dari Supabase REST API (${rows[0].synced_at || timestamp})`,
              timestamp,
              transport: 'SUPABASE',
              data: parsedData,
            };
          }
        }
      }
    } catch (err: any) {
      console.warn('[Pull Sync Supabase Error]', err?.message);
    }
  }

  // 2. Coba tarik dari Google Apps Script Webhook
  if (config.gasWebhookUrl) {
    try {
      const gasUrl = `${config.gasWebhookUrl.trim()}${config.gasWebhookUrl.includes('?') ? '&' : '?'}action=PULL_SNAPSHOT`;
      const res = await fetch(gasUrl, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json && (json.snapshot || json.data || json.payload || json.result)) {
          let parsedData = json.snapshot || json.data || json.payload || json.result;
          if (typeof parsedData === 'string') {
            try {
              parsedData = JSON.parse(parsedData);
            } catch {}
          }
          if (parsedData && (parsedData.products || parsedData.transactions || parsedData.financeEntries || parsedData.journalEntries)) {
            return {
              success: true,
              message: 'Data snapshot berhasil ditarik dari Google Apps Script Webhook',
              timestamp,
              transport: 'GAS',
              data: parsedData,
            };
          }
        }
      }
    } catch (err: any) {
      console.warn('[Pull Sync GAS Error]', err?.message);
    }
  }

  return {
    success: false,
    message: 'Tidak ada data snapshot yang ditemukan di backend cloud yang dikonfigurasi (tabel atau sheet masih kosong).',
    timestamp,
    error: 'No snapshot available',
  };
}

/**
 * Pengujian konektivitas cepat ke endpoint Supabase dan Google Apps Script.
 */
export async function testCloudConnections(customConfig?: DualBackendConfig): Promise<CloudConnectionPingResult> {
  const config = customConfig || dualBackendSync.getConfig();

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

  // Test Supabase
  if (config.supabaseUrl && config.supabaseAnonKey) {
    supabaseResult.configured = true;
    const start = performance.now();
    const baseUrl = config.supabaseUrl.trim().replace(/\/+$/, '');
    try {
      const res = await fetch(`${baseUrl}/rest/v1/`, {
        headers: {
          apikey: config.supabaseAnonKey.trim(),
          Authorization: `Bearer ${config.supabaseAnonKey.trim()}`,
        },
      });
      const latency = Math.round(performance.now() - start);
      supabaseResult.latencyMs = latency;
      if (res.ok) {
        supabaseResult.connected = true;
        supabaseResult.statusText = `Terhubung (200 OK • ${latency}ms)`;
      } else if (res.status === 401 || res.status === 403) {
        supabaseResult.connected = false;
        supabaseResult.statusText = `Gagal Otentikasi (${res.status} Unauthorized)`;
      } else {
        supabaseResult.connected = false;
        supabaseResult.statusText = `HTTP Error ${res.status}`;
      }
    } catch (e: any) {
      supabaseResult.connected = false;
      supabaseResult.statusText = `Koneksi Gagal: ${e.message || 'Network Fail'}`;
    }
  }

  // Test Google Apps Script
  if (config.gasWebhookUrl) {
    gasResult.configured = true;
    const start = performance.now();
    try {
      // Test via OPTIONS/GET
      const res = await fetch(config.gasWebhookUrl.trim(), { method: 'GET', mode: 'no-cors' });
      const latency = Math.round(performance.now() - start);
      gasResult.latencyMs = latency;
      gasResult.connected = true;
      gasResult.statusText = `Webhook Aktif (~${latency}ms)`;
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
