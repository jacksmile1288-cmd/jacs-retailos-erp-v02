import {
  supabase,
  isSupabaseConfigured,
  getRuntimeSupabaseClient,
  resolveSupabaseCredentials,
  sanitizeAndValidateSupabaseUrl,
  DEFAULT_FALLBACK_SUPABASE_URL,
  RuntimeSupabaseCredentials,
} from '../lib/supabaseClient';
import { Product, CartItem } from '../types';
import { isDemoSandboxMode } from '../utils/demoSandbox';

const OFFLINE_QUEUE_KEY = 'jacs_supabase_offline_queue_v1';
const FAILED_OFFLINE_QUEUE_KEY = 'jacs_supabase_failed_queue_v1';
const MAX_OFFLINE_RETRIES = 3;

export interface QueuedSyncPayload {
  id: string;
  table: 'products' | 'pos_transactions' | 'stock_movements';
  action: 'UPSERT' | 'INSERT' | 'RPC_TRANSACTION';
  payload: any;
  timestamp: string;
  retryCount?: number;
  lastError?: string;
}

export interface FailedQueuedSyncPayload extends QueuedSyncPayload {
  failedAt: string;
  reason: string;
}

export interface ErpSnapshotPayload {
  id?: string;
  businessName?: string;
  productsCount?: number;
  transactionsCount?: number;
  financeCount?: number;
  journalCount?: number;
  snapshotPayload: Record<string, any>;
  syncedAt?: string;
}

const notifyOfflineQueueChanged = () => {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('jacs_offline_queue_updated'));
    }
  } catch {}
};

export const isNonRetriableSupabaseError = (error: any, httpStatus?: number): boolean => {
  const status = Number(httpStatus ?? error?.status ?? 0);
  if (status === 400 || status === 404 || status === 409 || status === 422) {
    return true;
  }

  const code = String(error?.code || '').trim().toUpperCase();
  if (
    code === '23505' ||
    code === '23503' ||
    code === '23502' ||
    code === '23514' ||
    code === '22P02' ||
    code === '42P01' ||
    code === '42703' ||
    code === '42883' ||
    code === '400' ||
    code === '404' ||
    code === '409' ||
    code === '422' ||
    code.startsWith('PGRST')
  ) {
    return true;
  }

  const combinedMsg = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  if (
    combinedMsg.includes('23505') ||
    combinedMsg.includes('duplicate key') ||
    combinedMsg.includes('already exists') ||
    combinedMsg.includes('unique constraint') ||
    combinedMsg.includes('violates') ||
    combinedMsg.includes('schema cache') ||
    combinedMsg.includes('could not find') ||
    combinedMsg.includes('does not exist') ||
    combinedMsg.includes('invalid input syntax') ||
    combinedMsg.includes('bad request') ||
    combinedMsg.includes('conflict') ||
    combinedMsg.includes('null value in column')
  ) {
    return true;
  }

  return false;
};

const recordFailedOfflineItem = (item: QueuedSyncPayload, reason: string) => {
  try {
    const raw = localStorage.getItem(FAILED_OFFLINE_QUEUE_KEY);
    const existing: FailedQueuedSyncPayload[] = raw ? JSON.parse(raw) : [];
    const failedEntry: FailedQueuedSyncPayload = {
      ...item,
      failedAt: new Date().toISOString(),
      reason,
    };
    const next = [failedEntry, ...(Array.isArray(existing) ? existing : [])].slice(0, 50);
    localStorage.setItem(FAILED_OFFLINE_QUEUE_KEY, JSON.stringify(next));
  } catch {}
};

export const getOfflineQueue = (): QueuedSyncPayload[] => {
  if (isDemoSandboxMode()) return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveOfflineQueue = (queue: QueuedSyncPayload[]) => {
  if (isDemoSandboxMode()) return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    notifyOfflineQueueChanged();
  } catch (err) {
    console.error('Failed to save offline queue:', err);
  }
};

export const clearOfflineQueue = (): number => {
  if (isDemoSandboxMode()) return 0;
  const count = getOfflineQueue().length;
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    localStorage.removeItem(FAILED_OFFLINE_QUEUE_KEY);
  } catch {}
  notifyOfflineQueueChanged();
  return count;
};

export const enqueueOfflineAction = (
  table: 'products' | 'pos_transactions' | 'stock_movements',
  action: 'UPSERT' | 'INSERT' | 'RPC_TRANSACTION',
  payload: any
) => {
  if (isDemoSandboxMode()) return;
  const queue = getOfflineQueue();
  const entry: QueuedSyncPayload = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    table,
    action,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };
  queue.push(entry);
  saveOfflineQueue(queue);
};

export const syncOfflineQueueToSupabase = async (
  runtimeConfig?: RuntimeSupabaseCredentials
): Promise<number> => {
  if (isDemoSandboxMode()) return 0;
  const client = getRuntimeSupabaseClient(runtimeConfig);
  if (!client || !navigator.onLine) return 0;
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  let syncedCount = 0;
  const remainingQueue: QueuedSyncPayload[] = [];

  for (const item of queue) {
    try {
      let error: any = null;
      let status: number | undefined;
      if (item.action === 'RPC_TRANSACTION') {
        const res = await client.rpc('process_pos_transaction_atomic', item.payload);
        error = res.error;
        status = res.status;
      } else if (item.action === 'UPSERT') {
        const res = await client.from(item.table).upsert(item.payload);
        error = res.error;
        status = res.status;
      } else {
        const res = await client.from(item.table).insert(item.payload);
        error = res.error;
        status = res.status;
      }

      if (!error) {
        syncedCount++;
      } else if (isNonRetriableSupabaseError(error, status)) {
        const reason = `HTTP ${status || error?.status || '-'} (${error?.code || 'SCHEMA/CONFLICT'}): ${error?.message || 'Ditolak oleh Supabase'}`;
        console.warn('[SupabaseSync] Mengeluarkan item antrean non-retriable agar tidak macet:', item.table, reason);
        recordFailedOfflineItem(item, reason);
      } else {
        const nextRetry = (item.retryCount || 0) + 1;
        if (nextRetry >= MAX_OFFLINE_RETRIES) {
          const reason = `Melewati batas retry (${MAX_OFFLINE_RETRIES}x): ${error?.message || 'Error sinkronisasi'}`;
          console.warn('[SupabaseSync] Item melewati batas retry, dikeluarkan dari antrean aktif:', item.table, reason);
          recordFailedOfflineItem(item, reason);
        } else {
          remainingQueue.push({
            ...item,
            retryCount: nextRetry,
            lastError: error?.message || String(error),
          });
        }
      }
    } catch (err: any) {
      const nextRetry = (item.retryCount || 0) + 1;
      if (nextRetry >= MAX_OFFLINE_RETRIES) {
        recordFailedOfflineItem(item, `Exception setelah ${MAX_OFFLINE_RETRIES}x percobaan: ${err?.message || 'Network error'}`);
      } else {
        remainingQueue.push({
          ...item,
          retryCount: nextRetry,
          lastError: err?.message || 'Network error',
        });
      }
    }
  }

  saveOfflineQueue(remainingQueue);
  return syncedCount;
};

// 1. PULL DATA FROM SUPABASE
export const pullProductsFromSupabase = async (): Promise<Product[]> => {
  if (isDemoSandboxMode() || !isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      sku: row.sku,
      barcode: row.barcode,
      name: row.name,
      category: row.category,
      unit: row.unit || 'Pcs',
      costPrice: Number(row.cost_price || 0),
      cost_price: Number(row.cost_price || 0),
      sellingPrice: Number(row.sell_price || 0),
      sell_price: Number(row.sell_price || 0),
      stock: Number(row.stock || 0),
      minStock: Number(row.min_stock || 5),
      min_stock: Number(row.min_stock || 5),
      status: row.status || 'Active',
      businessModel: row.business_model || 'retail',
      unitSecondary: row.unit_secondary,
      priceSecondary: row.price_secondary ? Number(row.price_secondary) : undefined,
      conversionRate: row.conversion_rate ? Number(row.conversion_rate) : 1,
      price_wholesale: row.price_wholesale ? Number(row.price_wholesale) : undefined,
    }));
  } catch (err) {
    console.error('Failed to pull products from Supabase:', err);
    return [];
  }
};

// 2. UPSERT PRODUCT (IDEMPOTENT)
export const upsertProductToSupabase = async (product: Product): Promise<boolean> => {
  if (isDemoSandboxMode()) return true;
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

  if (!isSupabaseConfigured || !navigator.onLine) {
    enqueueOfflineAction('products', 'UPSERT', payload);
    return false;
  }

  try {
    const { error, status } = await supabase.from('products').upsert(payload);
    if (error) {
      if (isNonRetriableSupabaseError(error, status)) {
        console.warn('[SupabaseSync] Upsert product ditolak (non-retriable), tidak dimasukkan antrean retry:', error.message);
        return false;
      }
      enqueueOfflineAction('products', 'UPSERT', payload);
      return false;
    }
    return true;
  } catch {
    enqueueOfflineAction('products', 'UPSERT', payload);
    return false;
  }
};

// 3. PUSH TRANSACTION VIA ATOMIC PostgreSQL RPC (Idempotent & Atomic inventory deduction)
export const pushTransactionAtomicRpc = async (tx: {
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
}): Promise<boolean> => {
  if (isDemoSandboxMode()) return true;
  const rpcPayload = {
    p_receipt_number: tx.receiptNumber,
    p_shift_id: tx.shiftId || 'DEFAULT-SHIFT',
    p_terminal_id: tx.terminalId || 'POS-01',
    p_station_code: tx.stationCode || 'LOKET-01',
    p_cashier_name: tx.cashierName || 'Kasir',
    p_customer_id: tx.customerId || null,
    p_customer_name: tx.customerName || null,
    p_items: tx.items.map((i) => ({
      productId: i.product.id,
      productName: i.product.name,
      sku: i.product.sku || i.product.id,
      quantity: i.quantity,
      unitPrice: i.originalUnitPrice || i.product.sell_price,
      subtotal: i.subtotal,
      selectedUnit: i.selectedUnit || i.product.unit || 'Pcs',
      conversionFactor: i.conversionFactor || 1,
    })),
    p_total: tx.total,
    p_payment_method: tx.paymentMethod,
    p_cash_tendered: tx.cashTendered || 0,
    p_change_due: tx.changeDue || 0,
  };

  if (!isSupabaseConfigured || !navigator.onLine) {
    enqueueOfflineAction('pos_transactions', 'RPC_TRANSACTION', rpcPayload);
    return false;
  }

  try {
    const { data, error } = await supabase.rpc('process_pos_transaction_atomic', rpcPayload);
    if (error || (data && data.success === false)) {
      return await pushTransactionToSupabase(tx);
    }
    return true;
  } catch {
    return await pushTransactionToSupabase(tx);
  }
};

// Standard fallback push transaction
export const pushTransactionToSupabase = async (tx: {
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
}): Promise<boolean> => {
  if (isDemoSandboxMode()) return true;
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
  };

  if (!isSupabaseConfigured || !navigator.onLine) {
    enqueueOfflineAction('pos_transactions', 'INSERT', payload);
    return false;
  }

  try {
    const { error, status } = await supabase.from('pos_transactions').upsert(payload);
    if (error) {
      if (isNonRetriableSupabaseError(error, status)) {
        console.warn('[SupabaseSync] Push transaksi ditolak (non-retriable), tidak dimasukkan antrean retry:', error.message);
        return false;
      }
      enqueueOfflineAction('pos_transactions', 'INSERT', payload);
      return false;
    }
    return true;
  } catch {
    enqueueOfflineAction('pos_transactions', 'INSERT', payload);
    return false;
  }
};

// 4. PUSH STOCK MOVEMENT
export const pushStockMovementToSupabase = async (movement: {
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

  if (!isSupabaseConfigured || !navigator.onLine) {
    enqueueOfflineAction('stock_movements', 'INSERT', payload);
    return false;
  }

  try {
    const { error, status } = await supabase.from('stock_movements').insert(payload);
    if (error) {
      if (isNonRetriableSupabaseError(error, status)) {
        console.warn('[SupabaseSync] Push stock movement ditolak (non-retriable), tidak dimasukkan antrean retry:', error.message);
        return false;
      }
      enqueueOfflineAction('stock_movements', 'INSERT', payload);
      return false;
    }
    return true;
  } catch {
    enqueueOfflineAction('stock_movements', 'INSERT', payload);
    return false;
  }
};

// 5. SNAPSHOT SYNC (jacs_erp_snapshots)
export const syncSnapshotToSupabase = async (
  snapshot: ErpSnapshotPayload,
  runtimeConfig?: RuntimeSupabaseCredentials
): Promise<boolean> => {
  if (isDemoSandboxMode()) return false;
  const creds = resolveSupabaseCredentials(runtimeConfig);
  const safeUrl =
    sanitizeAndValidateSupabaseUrl(creds.supabaseUrl) ||
    (creds.supabaseAnonKey ? DEFAULT_FALLBACK_SUPABASE_URL : '');

  if (!safeUrl || !creds.supabaseAnonKey) {
    const missingFields: string[] = [];
    if (!safeUrl) missingFields.push('URL Proyek Supabase');
    if (!creds.supabaseAnonKey) missingFields.push('Anon Key Supabase');
    throw new Error(
      `Supabase belum dikonfigurasi (${missingFields.join(' & ') || 'URL dan Anon Key'} belum diisi).`
    );
  }

  const client = getRuntimeSupabaseClient({
    supabaseUrl: safeUrl,
    supabaseAnonKey: creds.supabaseAnonKey,
  });

  if (!client) {
    throw new Error(
      `Gagal menginisialisasi koneksi Supabase untuk endpoint ${safeUrl}.`
    );
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Perangkat sedang offline.');
  }

  const row = {
    id: snapshot.id || 'default-snapshot',
    business_name: snapshot.businessName || 'JACS ENTERPRISE',
    products_count: Number(snapshot.productsCount ?? 0),
    transactions_count: Number(snapshot.transactionsCount ?? 0),
    finance_count: Number(snapshot.financeCount ?? 0),
    journal_count: Number(snapshot.journalCount ?? 0),
    snapshot_payload: snapshot.snapshotPayload,
    synced_at: snapshot.syncedAt || new Date().toISOString(),
  };

  const { error } = await client
    .from('jacs_erp_snapshots')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    throw new Error(`Gagal sync snapshot ke Supabase: ${error.message}`);
  }
  return true;
};

export const pullLatestSnapshotFromSupabase = async (
  id = 'default-snapshot',
  runtimeConfig?: RuntimeSupabaseCredentials
) => {
  if (isDemoSandboxMode()) return null;
  const creds = resolveSupabaseCredentials(runtimeConfig);
  const safeUrl =
    sanitizeAndValidateSupabaseUrl(creds.supabaseUrl) ||
    (creds.supabaseAnonKey ? DEFAULT_FALLBACK_SUPABASE_URL : '');

  if (!safeUrl || !creds.supabaseAnonKey) {
    return null;
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Perangkat sedang offline. Tidak dapat menarik snapshot dari Supabase.');
  }

  const client = getRuntimeSupabaseClient({
    supabaseUrl: safeUrl,
    supabaseAnonKey: creds.supabaseAnonKey,
  });
  if (!client) return null;

  // 1. Ambil baris snapshot terbaru berdasarkan synced_at DESC
  const { data: latestRows, error: latestError } = await client
    .from('jacs_erp_snapshots')
    .select('*')
    .order('synced_at', { ascending: false })
    .limit(1);

  if (latestError) {
    // Fallback langsung berdasarkan id jika order synced_at bermasalah
    const { data: fallbackRow, error: fallbackError } = await client
      .from('jacs_erp_snapshots')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fallbackError) {
      throw new Error(`Gagal menarik snapshot dari Supabase: ${fallbackError.message}`);
    }
    if (fallbackRow) return fallbackRow;
    throw new Error(`Gagal menarik snapshot dari Supabase: ${latestError.message}`);
  }

  if (Array.isArray(latestRows) && latestRows.length > 0 && latestRows[0]) {
    return latestRows[0];
  }

  // 2. Fallback eksplisit ke baris id = 'default-snapshot' (atau id yang diminta)
  const { data: defaultRow, error: defaultError } = await client
    .from('jacs_erp_snapshots')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (defaultError) {
    throw new Error(`Gagal menarik snapshot dari Supabase: ${defaultError.message}`);
  }

  return defaultRow || null;
};

// 6. REALTIME SUBSCRIPTION
export const subscribeToSupabaseChanges = (onProductChange: (payload: any) => void) => {
  if (isDemoSandboxMode() || !isSupabaseConfigured) return () => {};

  try {
    const channel = supabase
      .channel('public-realtime-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        onProductChange(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.error('Failed to subscribe to Supabase realtime:', err);
    return () => {};
  }
};