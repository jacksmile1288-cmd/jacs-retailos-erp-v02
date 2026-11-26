import { Product, CartItem } from '../types';
import { isDemoSandboxMode } from '../utils/demoSandbox';

const OFFLINE_QUEUE_KEY = 'jacs_gas_offline_queue_v1';
const FAILED_GAS_QUEUE_KEY = 'jacs_gas_failed_queue_v1';
const MAX_GAS_RETRIES = 3;

export interface QueuedGasSyncPayload {
  id: string;
  table: 'products' | 'pos_transactions' | 'stock_movements';
  action: 'UPSERT' | 'INSERT';
  payload: any;
  timestamp: string;
  idempotencyKey?: string;
  retryCount?: number;
  lastError?: string;
}

const notifyGasQueueChanged = () => {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('jacs_offline_queue_updated'));
    }
  } catch {}
};

const isNonRetriableGasFailure = (status: number, bodyText = ''): boolean => {
  if (status === 400 || status === 404 || status === 409 || status === 422) return true;
  if (/23505|duplicate|already exists|invalid|schema|conflict|bad request/i.test(bodyText)) return true;
  return false;
};

const recordFailedGasItem = (item: QueuedGasSyncPayload, reason: string) => {
  try {
    const raw = localStorage.getItem(FAILED_GAS_QUEUE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const next = [
      { ...item, failedAt: new Date().toISOString(), reason },
      ...(Array.isArray(existing) ? existing : []),
    ].slice(0, 50);
    localStorage.setItem(FAILED_GAS_QUEUE_KEY, JSON.stringify(next));
  } catch {}
};

export const getGasWebhookUrl = (): string => {
  if (typeof window === 'undefined') return '';
  // 1. Check environment variable VITE_GAS_WEB_APP_URL
  const envUrl = (import.meta.env.VITE_GAS_WEB_APP_URL as string) || '';
  if (envUrl.trim()) return envUrl.trim();

  // 2. Check dual backend config in localStorage
  try {
    const dualCfg = localStorage.getItem('jacs_dual_backend_config');
    if (dualCfg) {
      const parsed = JSON.parse(dualCfg);
      if (parsed?.gasWebhookUrl && typeof parsed.gasWebhookUrl === 'string' && parsed.gasWebhookUrl.trim()) {
        return parsed.gasWebhookUrl.trim();
      }
    }
  } catch {}

  // 3. Check legacy gas web app url
  try {
    const legacy = localStorage.getItem('jacs_gas_web_app_url');
    if (legacy && legacy.trim()) return legacy.trim();
  } catch {}

  return '';
};

export const isGasConfigured = (): boolean => {
  if (isDemoSandboxMode()) return false;
  return Boolean(getGasWebhookUrl());
};

export const getGasOfflineQueue = (): QueuedGasSyncPayload[] => {
  if (isDemoSandboxMode()) return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveGasOfflineQueue = (queue: QueuedGasSyncPayload[]) => {
  if (isDemoSandboxMode()) return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    notifyGasQueueChanged();
  } catch (err) {
    console.error('Failed to save GAS offline queue:', err);
  }
};

export const clearGasOfflineQueue = (): number => {
  if (isDemoSandboxMode()) return 0;
  const count = getGasOfflineQueue().length;
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    localStorage.removeItem(FAILED_GAS_QUEUE_KEY);
  } catch {}
  notifyGasQueueChanged();
  return count;
};

export const enqueueGasOfflineAction = (
  table: 'products' | 'pos_transactions' | 'stock_movements',
  action: 'UPSERT' | 'INSERT',
  payload: any,
  idempotencyKey?: string
) => {
  if (isDemoSandboxMode()) return;
  // Jangan menumpuk antrean GAS jika webhook GAS belum dikonfigurasi
  if (!getGasWebhookUrl()) return;

  const queue = getGasOfflineQueue();
  const key = idempotencyKey || payload?.receiptNumber || payload?.tx_uuid || payload?.id;

  // Check duplicate in queue
  if (key && queue.some((q) => q.idempotencyKey === key || q.payload?.receiptNumber === key || q.payload?.tx_uuid === key || q.payload?.id === key)) {
    return; // Prevent duplicate queuing
  }

  const entry: QueuedGasSyncPayload = {
    id: `GAS-Q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    table,
    action,
    payload,
    timestamp: new Date().toISOString(),
    idempotencyKey: key,
    retryCount: 0,
  };
  queue.push(entry);
  saveGasOfflineQueue(queue);
};

export const syncOfflineQueueToGAS = async (): Promise<number> => {
  if (isDemoSandboxMode()) return 0;
  const url = getGasWebhookUrl();
  if (!url || !navigator.onLine) return 0;
  const queue = getGasOfflineQueue();
  if (queue.length === 0) return 0;

  let syncedCount = 0;
  const remainingQueue: QueuedGasSyncPayload[] = [];

  for (const item of queue) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: `SYNC_${item.table.toUpperCase()}_${item.action}`,
          table: item.table,
          sync_action: item.action,
          idempotency_key: item.idempotencyKey || item.payload?.receiptNumber || item.payload?.tx_uuid || item.payload?.id,
          payload: item.payload,
          timestamp: item.timestamp,
        }),
      });

      const responseText = await res.text().catch(() => '');
      let success = res.ok;
      let errMsg = responseText;

      if (res.ok && responseText) {
        try {
          const json = JSON.parse(responseText);
          if (json.status === 'error' || json.success === false) {
            success = false;
            errMsg = json.message || json.error || responseText;
          }
        } catch {}
      }

      if (success) {
        syncedCount++;
      } else if (isNonRetriableGasFailure(res.status, errMsg)) {
        const reason = `GAS HTTP ${res.status}: ${String(errMsg).slice(0, 140) || 'Validation/Duplicate'}`;
        console.warn('[GASSync] Item non-retriable dikeluarkan dari antrean aktif:', item.table, reason);
        recordFailedGasItem(item, reason);
      } else {
        const nextRetry = (item.retryCount || 0) + 1;
        if (nextRetry >= MAX_GAS_RETRIES) {
          recordFailedGasItem(item, `Melewati batas retry (${MAX_GAS_RETRIES}x): HTTP ${res.status}`);
        } else {
          remainingQueue.push({
            ...item,
            retryCount: nextRetry,
            lastError: `HTTP ${res.status}`,
          });
        }
      }
    } catch (err: any) {
      const nextRetry = (item.retryCount || 0) + 1;
      if (nextRetry >= MAX_GAS_RETRIES) {
        recordFailedGasItem(item, `Network exception setelah ${MAX_GAS_RETRIES}x percobaan`);
      } else {
        remainingQueue.push({
          ...item,
          retryCount: nextRetry,
          lastError: err?.message || 'Network error',
        });
      }
    }
  }

  saveGasOfflineQueue(remainingQueue);
  return syncedCount;
};

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncOfflineQueueToGAS().catch(() => {});
  });
}

// 1. PULL PRODUCTS FROM GAS
export const pullProductsFromGAS = async (): Promise<Product[]> => {
  if (isDemoSandboxMode()) return [];
  const url = getGasWebhookUrl();
  if (!url) return [];
  try {
    const pullUrl = `${url}${url.includes('?') ? '&' : '?'}action=PULL_PRODUCTS`;
    const res = await fetch(pullUrl, { method: 'GET' });
    if (!res.ok) return [];
    const json = await res.json();
    const rows = json?.products || json?.data || json?.result || (Array.isArray(json) ? json : []);
    if (!Array.isArray(rows)) return [];

    return rows.map((row: any) => ({
      id: row.id || row.sku || `BR-${Math.random().toString(36).substring(2, 8)}`,
      sku: row.sku || row.id,
      barcode: row.barcode,
      name: row.name || row.productName || 'Tanpa Nama',
      category: row.category || 'General',
      unit: row.unit || 'Pcs',
      costPrice: Number(row.cost_price || row.costPrice || 0),
      cost_price: Number(row.cost_price || row.costPrice || 0),
      sellingPrice: Number(row.sell_price || row.sellingPrice || 0),
      sell_price: Number(row.sell_price || row.sellingPrice || 0),
      stock: Number(row.stock || row.qty || 0),
      minStock: Number(row.min_stock || row.minStock || 5),
      min_stock: Number(row.min_stock || row.minStock || 5),
      status: row.status || 'Active',
      businessModel: row.business_model || row.businessModel || 'retail',
      unitSecondary: row.unit_secondary || row.unitSecondary,
      priceSecondary: row.price_secondary !== undefined ? Number(row.price_secondary) : undefined,
      conversionRate: row.conversion_rate !== undefined ? Number(row.conversion_rate) : 1,
      price_wholesale: row.price_wholesale !== undefined ? Number(row.price_wholesale) : undefined,
    }));
  } catch (err) {
    console.error('Failed to pull products from GAS:', err);
    return [];
  }
};

// 2. UPSERT PRODUCT TO GAS (IDEMPOTENT)
export const upsertProductToGAS = async (product: Product): Promise<boolean> => {
  if (isDemoSandboxMode()) return true;
  const url = getGasWebhookUrl();
  const payload = {
    id: product.id,
    sku: product.sku || product.id,
    barcode: product.barcode,
    name: product.name,
    category: product.category || 'General',
    unit: product.unit || 'Pcs',
    cost_price: product.cost_price ?? product.costPrice ?? 0,
    sell_price: product.sell_price ?? product.sellingPrice ?? 0,
    stock: product.stock ?? 0,
    min_stock: product.min_stock ?? product.minStock ?? 5,
    status: product.status || 'Active',
    business_model: product.businessModel || 'retail',
    unit_secondary: product.unitSecondary,
    price_secondary: product.priceSecondary,
    conversion_rate: product.conversionRate ?? 1,
    price_wholesale: product.price_wholesale,
    updated_at: new Date().toISOString(),
  };

  const idempotencyKey = `PROD-${product.id}`;

  if (!url) {
    return false;
  }

  if (!navigator.onLine) {
    enqueueGasOfflineAction('products', 'UPSERT', payload, idempotencyKey);
    return false;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'UPSERT_PRODUCT',
        idempotency_key: idempotencyKey,
        payload,
      }),
    });
    if (!res.ok) {
      if (!isNonRetriableGasFailure(res.status)) {
        enqueueGasOfflineAction('products', 'UPSERT', payload, idempotencyKey);
      }
      return false;
    }
    return true;
  } catch {
    enqueueGasOfflineAction('products', 'UPSERT', payload, idempotencyKey);
    return false;
  }
};

// 3. PUSH POS TRANSACTION TO GAS (IDEMPOTENT VIA RECEIPT NUMBER / TX_UUID)
export const pushTransactionToGAS = async (tx: {
  receiptNumber: string;
  shiftId?: string;
  terminalId?: string;
  stationCode?: string;
  cashierName?: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  cashTendered?: number;
  changeDue?: number;
  tx_uuid?: string;
}): Promise<boolean> => {
  if (isDemoSandboxMode()) return true;
  const url = getGasWebhookUrl();
  const idempotencyKey = tx.receiptNumber || tx.tx_uuid || `TX-${Date.now()}`;

  const payload = {
    receipt_number: tx.receiptNumber,
    shift_id: tx.shiftId || 'DEFAULT-SHIFT',
    terminal_id: tx.terminalId || 'POS-01',
    station_code: tx.stationCode || 'LOKET-01',
    cashier_name: tx.cashierName || 'Kasir',
    customer_id: tx.customerId,
    customer_name: tx.customerName,
    items: tx.items.map((i) => ({
      productId: i.product.id,
      productName: i.product.name,
      sku: i.product.sku || i.product.id,
      quantity: i.quantity,
      unitPrice: i.originalUnitPrice || i.product.sell_price,
      subtotal: i.subtotal,
      selectedUnit: i.selectedUnit || i.product.unit || 'Pcs',
    })),
    total: tx.total,
    payment_method: tx.paymentMethod,
    cash_tendered: tx.cashTendered || 0,
    change_due: tx.changeDue || 0,
    status: 'COMPLETED',
    created_at: new Date().toISOString(),
    tx_uuid: tx.tx_uuid || idempotencyKey,
  };

  if (!url) {
    return false;
  }

  if (!navigator.onLine) {
    enqueueGasOfflineAction('pos_transactions', 'INSERT', payload, idempotencyKey);
    return false;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'RECORD_POS_TRANSACTION',
        idempotency_key: idempotencyKey,
        payload,
      }),
    });
    if (!res.ok) {
      if (!isNonRetriableGasFailure(res.status)) {
        enqueueGasOfflineAction('pos_transactions', 'INSERT', payload, idempotencyKey);
      }
      return false;
    }
    return true;
  } catch {
    enqueueGasOfflineAction('pos_transactions', 'INSERT', payload, idempotencyKey);
    return false;
  }
};

// 4. PUSH STOCK MOVEMENT TO GAS
export const pushStockMovementToGAS = async (movement: {
  id: string;
  productId: string;
  sku?: string;
  productName?: string;
  deltaQty: number;
  movementType: 'SALE' | 'RESTOCK' | 'ADJUSTMENT' | 'RETURN';
  referenceId?: string;
  notes?: string;
  createdBy?: string;
}): Promise<boolean> => {
  if (isDemoSandboxMode()) return true;
  const url = getGasWebhookUrl();
  const idempotencyKey = movement.id || `MOV-${Date.now()}`;

  const payload = {
    id: movement.id,
    product_id: movement.productId,
    sku: movement.sku || movement.productId,
    product_name: movement.productName,
    delta_qty: movement.deltaQty,
    movement_type: movement.movementType,
    reference_id: movement.referenceId,
    notes: movement.notes,
    created_by: movement.createdBy || 'System',
    created_at: new Date().toISOString(),
  };

  if (!url) {
    return false;
  }

  if (!navigator.onLine) {
    enqueueGasOfflineAction('stock_movements', 'INSERT', payload, idempotencyKey);
    return false;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'RECORD_STOCK_MOVEMENT',
        idempotency_key: idempotencyKey,
        payload,
      }),
    });
    if (!res.ok) {
      if (!isNonRetriableGasFailure(res.status)) {
        enqueueGasOfflineAction('stock_movements', 'INSERT', payload, idempotencyKey);
      }
      return false;
    }
    return true;
  } catch {
    enqueueGasOfflineAction('stock_movements', 'INSERT', payload, idempotencyKey);
    return false;
  }
};

// 5. TEST GAS CONNECTION
export const testGasConnection = async (): Promise<{ ok: boolean; message: string; status: number }> => {
  const url = getGasWebhookUrl();
  if (!url) {
    return { ok: false, message: 'URL Web App GAS belum dikonfigurasi.', status: 0 };
  }

  const start = performance.now();
  try {
    const pingUrl = `${url}${url.includes('?') ? '&' : '?'}action=PING`;
    const res = await fetch(pingUrl, { method: 'GET' });
    const duration = Math.round(performance.now() - start);

    if (res.ok || res.type === 'opaque') {
      return {
        ok: true,
        message: `Google Apps Script Webhook aktif terhubung (${duration}ms)`,
        status: res.status || 200,
      };
    }
    return {
      ok: false,
      message: `GAS Webhook merespons HTTP ${res.status}`,
      status: res.status,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Koneksi GAS gagal: ${err?.message || 'Network Error'}`,
      status: 0,
    };
  }
};
