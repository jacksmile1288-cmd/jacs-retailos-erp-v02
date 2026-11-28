import {
  supabase,
  isSupabaseConfigured,
  getRuntimeSupabaseClient,
  resolveSupabaseCredentials,
  sanitizeAndValidateSupabaseUrl,
  DEFAULT_FALLBACK_SUPABASE_URL,
  RuntimeSupabaseCredentials,
} from '../lib/supabaseClient';
import { Product, CartItem, Sale } from '../types';
import { isDemoSandboxMode } from '../utils/demoSandbox';

const OFFLINE_QUEUE_KEY = 'jacs_supabase_offline_queue_v1';
export const OFFLINE_TX_QUEUE_KEY = 'jacs_offline_tx_queue';
const FAILED_OFFLINE_QUEUE_KEY = 'jacs_supabase_failed_queue_v1';
const MAX_OFFLINE_RETRIES = 3;

export interface QueuedSyncPayload {
  id: string;
  table: 'products' | 'pos_transactions' | 'stock_movements';
  action: 'UPSERT' | 'INSERT' | 'RPC_TRANSACTION' | 'ATOMIC_STOCK';
  payload: any;
  timestamp: string;
  retryCount?: number;
  lastError?: string;
}

export interface FailedQueuedSyncPayload extends QueuedSyncPayload {
  failedAt: string;
  reason: string;
}

export interface PosTransactionItemPayload {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  selectedUnit?: string;
  conversionFactor?: number;
}

export interface PosTransactionRowPayload {
  id: string;
  tenant_id: string;
  receipt_number: string;
  shift_id?: string;
  terminal_id: string;
  station_code?: string;
  cashier_name?: string;
  customer_id?: string | null;
  customer_name?: string | null;
  items: PosTransactionItemPayload[];
  total: number;
  payment_method: string;
  cash_tendered?: number;
  change_due?: number;
  status: string;
  created_at: string;
  synced_at?: string;
}

export interface StockDeltaMovementInput {
  id?: string;
  tenantId?: string;
  terminalId?: string;
  productId: string;
  sku?: string;
  productName?: string;
  qtyDelta: number;
  movementType: 'SALE' | 'RESTOCK' | 'ADJUSTMENT' | 'RETURN';
  referenceId?: string;
  notes?: string;
  createdBy?: string;
}

export interface OfflineTxQueueEntry {
  id: string;
  tenantId: string;
  terminalId: string;
  transaction: PosTransactionRowPayload;
  stockDeltas: StockDeltaMovementInput[];
  queuedAt: string;
  retryCount: number;
  lastError?: string;
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

export interface ErpRealtimeCallbacks {
  tenantId: string;
  terminalId?: string;
  onProductChange?: (payload: {
    eventType: string;
    product: Partial<Product> & { id: string; stock?: number; tenant_id?: string };
    raw: any;
  }) => void;
  onTransactionChange?: (payload: {
    eventType: string;
    transaction: PosTransactionRowPayload;
    sale: Sale;
    raw: any;
  }) => void;
  onStatusChange?: (status: string) => void;
}

export const generateTransactionUUID = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {}
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const resolveActiveTenantId = (
  businessProfile?: { id?: string; tenantId?: string; tenant_id?: string; companyName?: string; name?: string } | null
): string => {
  const raw =
    businessProfile?.tenantId ||
    businessProfile?.tenant_id ||
    businessProfile?.id ||
    businessProfile?.companyName ||
    businessProfile?.name ||
    'default-tenant';
  return (
    String(raw)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'default-tenant'
  );
};

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

const isUndefinedColumnError = (error: any): boolean => {
  const code = String(error?.code || '').trim().toUpperCase();
  const msg = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return (
    code === '42703' ||
    code === 'PGRST204' ||
    msg.includes('column') && (msg.includes('does not exist') || msg.includes('could not find'))
  );
};

const isMissingRpcError = (error: any): boolean => {
  const code = String(error?.code || '').trim().toUpperCase();
  const msg = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return (
    code === '42883' ||
    code === 'PGRST202' ||
    msg.includes('could not find the function') ||
    msg.includes('function') && msg.includes('does not exist')
  );
};

const resolveActiveClient = (runtimeConfig?: RuntimeSupabaseCredentials) => {
  const runtimeClient = getRuntimeSupabaseClient(runtimeConfig);
  if (runtimeClient) return runtimeClient;
  return isSupabaseConfigured ? supabase : null;
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

// =========================================================================
// 1. OFFLINE QUEUE STORAGE (jacs_offline_tx_queue + general queue)
// =========================================================================

export const getOfflineTxQueue = (): OfflineTxQueueEntry[] => {
  if (isDemoSandboxMode()) return [];
  try {
    const raw = localStorage.getItem(OFFLINE_TX_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveOfflineTxQueue = (queue: OfflineTxQueueEntry[]) => {
  if (isDemoSandboxMode()) return;
  try {
    localStorage.setItem(OFFLINE_TX_QUEUE_KEY, JSON.stringify(queue));
    notifyOfflineQueueChanged();
  } catch (err) {
    console.error('Failed to save jacs_offline_tx_queue:', err);
  }
};

export const enqueueOfflineTx = (entry: OfflineTxQueueEntry) => {
  if (isDemoSandboxMode()) return;
  const queue = getOfflineTxQueue();
  const existingIdx = queue.findIndex((q) => q.id === entry.id);
  if (existingIdx >= 0) {
    queue[existingIdx] = { ...queue[existingIdx], ...entry };
  } else {
    queue.push(entry);
  }
  saveOfflineTxQueue(queue);
};

export const clearOfflineTxQueue = (): number => {
  if (isDemoSandboxMode()) return 0;
  const count = getOfflineTxQueue().length;
  try {
    localStorage.removeItem(OFFLINE_TX_QUEUE_KEY);
  } catch {}
  notifyOfflineQueueChanged();
  return count;
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

export const getTotalSupabaseOfflineQueueCount = (): number => {
  if (isDemoSandboxMode()) return 0;
  return getOfflineTxQueue().length + getOfflineQueue().length;
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
  const count = getOfflineQueue().length + getOfflineTxQueue().length;
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    localStorage.removeItem(OFFLINE_TX_QUEUE_KEY);
    localStorage.removeItem(FAILED_OFFLINE_QUEUE_KEY);
  } catch {}
  notifyOfflineQueueChanged();
  return count;
};

export const enqueueOfflineAction = (
  table: 'products' | 'pos_transactions' | 'stock_movements',
  action: 'UPSERT' | 'INSERT' | 'RPC_TRANSACTION' | 'ATOMIC_STOCK',
  payload: any
) => {
  if (isDemoSandboxMode()) return;
  const queue = getOfflineQueue();
  const entry: QueuedSyncPayload = {
    id: generateTransactionUUID(),
    table,
    action,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };
  queue.push(entry);
  saveOfflineQueue(queue);
};

// =========================================================================
// 2. ATOMIC STOCK ADJUSTMENT RPC & STOCK MOVEMENTS (qty_delta)
// =========================================================================

export const adjustProductStockAtomic = async (
  productId: string,
  delta: number,
  runtimeConfig?: RuntimeSupabaseCredentials
): Promise<{ success: boolean; newStock?: number; usedFallback?: boolean }> => {
  if (isDemoSandboxMode() || !productId || !Number.isFinite(delta) || delta === 0) {
    return { success: true };
  }

  const client = resolveActiveClient(runtimeConfig);
  if (!client || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return { success: false };
  }

  try {
    // 1. Primary path: PostgreSQL RPC adjust_product_stock(p_product_id, p_delta)
    const { data, error } = await client.rpc('adjust_product_stock', {
      p_product_id: productId,
      p_delta: delta,
    });

    if (!error) {
      const resolvedNewStock = Array.isArray(data)
        ? Number(data[0]?.new_stock)
        : typeof data === 'object' && data !== null && 'new_stock' in data
        ? Number((data as any).new_stock)
        : typeof data === 'number'
        ? data
        : undefined;
      return {
        success: true,
        newStock: Number.isFinite(resolvedNewStock as number) ? resolvedNewStock : undefined,
        usedFallback: false,
      };
    }

    // 2. Safe fallback if adjust_product_stock RPC has not been created yet (or fails)
    if (!isMissingRpcError(error)) {
      console.warn('[SupabaseSync] RPC adjust_product_stock error, beralih ke fallback aman:', error.message);
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      const { data: currentRow, error: fetchErr } = await client
        .from('products')
        .select('id, stock')
        .eq('id', productId)
        .maybeSingle();

      if (fetchErr || !currentRow) {
        return { success: false, usedFallback: true };
      }

      const currentStock = Number(currentRow.stock ?? 0);
      const nextStock = Math.max(0, Number((currentStock + delta).toFixed(4)));

      // Optimistic concurrency guard: update only if stock hasn't changed between read and write
      const { data: updatedRows, error: updateErr } = await client
        .from('products')
        .update({
          stock: nextStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .eq('stock', currentStock)
        .select('stock');

      if (!updateErr && Array.isArray(updatedRows) && updatedRows.length > 0) {
        return { success: true, newStock: nextStock, usedFallback: true };
      }

      // On final attempt, apply direct update if optimistic lock contended
      if (attempt === 1) {
        const { error: directErr } = await client
          .from('products')
          .update({
            stock: nextStock,
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId);
        return { success: !directErr, newStock: !directErr ? nextStock : undefined, usedFallback: true };
      }
    }

    return { success: false, usedFallback: true };
  } catch (err) {
    console.warn('[SupabaseSync] Exception saat adjustProductStockAtomic:', err);
    return { success: false, usedFallback: true };
  }
};

export const recordAtomicStockMovement = async (
  movement: StockDeltaMovementInput,
  runtimeConfig?: RuntimeSupabaseCredentials,
  options: { applyStockRpc?: boolean; queueOnFailure?: boolean } = {}
): Promise<boolean> => {
  if (isDemoSandboxMode()) return true;
  const applyStockRpc = options.applyStockRpc !== false;
  const queueOnFailure = options.queueOnFailure !== false;

  const movementId = movement.id || generateTransactionUUID();
  const qtyDelta = Number(movement.qtyDelta || 0);
  const createdAt = new Date().toISOString();

  const fullRow: Record<string, any> = {
    id: movementId,
    tenant_id: movement.tenantId || 'default-tenant',
    terminal_id: movement.terminalId || 'POS-01',
    product_id: movement.productId,
    sku: movement.sku || movement.productId,
    product_name: movement.productName || movement.productId,
    qty_delta: qtyDelta,
    delta_qty: qtyDelta,
    movement_type: movement.movementType,
    reference_id: movement.referenceId || null,
    notes: movement.notes || null,
    created_by: movement.createdBy || 'System',
    created_at: createdAt,
  };

  const client = resolveActiveClient(runtimeConfig);
  if (!client || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    if (queueOnFailure) {
      enqueueOfflineAction('stock_movements', 'ATOMIC_STOCK', {
        movementRow: fullRow,
        productId: movement.productId,
        qtyDelta,
        applyStockRpc,
      });
    }
    return false;
  }

  try {
    let insertResult = await client
      .from('stock_movements')
      .upsert(fullRow, { onConflict: 'id' });

    // Schema compatibility retry if table only has qty_delta or only has delta_qty / no tenant_id
    if (insertResult.error && isUndefinedColumnError(insertResult.error)) {
      const minimalQtyDeltaRow = {
        id: movementId,
        product_id: movement.productId,
        sku: movement.sku || movement.productId,
        product_name: movement.productName || movement.productId,
        qty_delta: qtyDelta,
        movement_type: movement.movementType,
        reference_id: movement.referenceId || null,
        notes: movement.notes || null,
        created_by: movement.createdBy || 'System',
        created_at: createdAt,
      };
      insertResult = await client
        .from('stock_movements')
        .upsert(minimalQtyDeltaRow, { onConflict: 'id' });

      if (insertResult.error && isUndefinedColumnError(insertResult.error)) {
        const legacyDeltaRow = {
          id: movementId,
          product_id: movement.productId,
          sku: movement.sku || movement.productId,
          product_name: movement.productName || movement.productId,
          delta_qty: qtyDelta,
          movement_type: movement.movementType,
          reference_id: movement.referenceId || null,
          notes: movement.notes || null,
          created_by: movement.createdBy || 'System',
          created_at: createdAt,
        };
        insertResult = await client
          .from('stock_movements')
          .upsert(legacyDeltaRow, { onConflict: 'id' });
      }
    }

    let stockAdjusted = true;
    if (applyStockRpc && qtyDelta !== 0) {
      const rpcRes = await adjustProductStockAtomic(movement.productId, qtyDelta, runtimeConfig);
      stockAdjusted = rpcRes.success;
    }

    if (insertResult.error) {
      if (isNonRetriableSupabaseError(insertResult.error, insertResult.status)) {
        console.warn('[SupabaseSync] Insert stock_movements ditolak (non-retriable):', insertResult.error.message);
        return stockAdjusted;
      }
      if (queueOnFailure) {
        enqueueOfflineAction('stock_movements', 'ATOMIC_STOCK', {
          movementRow: fullRow,
          productId: movement.productId,
          qtyDelta,
          applyStockRpc,
        });
      }
      return false;
    }

    return stockAdjusted;
  } catch {
    if (queueOnFailure) {
      enqueueOfflineAction('stock_movements', 'ATOMIC_STOCK', {
        movementRow: fullRow,
        productId: movement.productId,
        qtyDelta,
        applyStockRpc,
      });
    }
    return false;
  }
};

// =========================================================================
// 3. APPEND-ONLY UUID POS TRANSACTIONS (pos_transactions + jacs_offline_tx_queue)
// =========================================================================

const upsertPosTransactionRow = async (
  client: ReturnType<typeof resolveActiveClient>,
  row: PosTransactionRowPayload
): Promise<{ error: any; status?: number }> => {
  if (!client) return { error: { message: 'Supabase client unavailable' }, status: 0 };

  // Primary path: append-only upsert with UUID primary key (onConflict: 'id')
  const firstRes = await client
    .from('pos_transactions')
    .upsert(row, { onConflict: 'id' });

  if (!firstRes.error) {
    return { error: null, status: firstRes.status };
  }

  // Backward-compatible schema fallback if older database lacks tenant_id column
  if (isUndefinedColumnError(firstRes.error)) {
    const { tenant_id: _omitTenant, ...withoutTenant } = row;
    const retryNoTenant = await client
      .from('pos_transactions')
      .upsert(withoutTenant, { onConflict: 'id' });

    if (!retryNoTenant.error) {
      return { error: null, status: retryNoTenant.status };
    }

    // Legacy fallback if older table uses receipt_number as PK without id column
    if (isUndefinedColumnError(retryNoTenant.error)) {
      const { id: _omitId, ...legacyRow } = withoutTenant;
      const legacyRes = await client
        .from('pos_transactions')
        .upsert(legacyRow, { onConflict: 'receipt_number' });
      return { error: legacyRes.error, status: legacyRes.status };
    }

    return { error: retryNoTenant.error, status: retryNoTenant.status };
  }

  return { error: firstRes.error, status: firstRes.status };
};

export const pushPosTransactionAppendOnly = async (
  tx: {
    id?: string;
    tenantId?: string;
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
    createdAt?: string;
  },
  runtimeConfig?: RuntimeSupabaseCredentials
): Promise<{ success: boolean; id: string; queued: boolean }> => {
  const txId = tx.id || generateTransactionUUID();
  if (isDemoSandboxMode()) {
    return { success: true, id: txId, queued: false };
  }

  const nowIso = tx.createdAt || new Date().toISOString();
  const tenantId = tx.tenantId || 'default-tenant';
  const terminalId = tx.terminalId || tx.stationCode || 'POS-01';

  const mappedItems: PosTransactionItemPayload[] = (tx.items || []).map((i) => ({
    productId: i.product.id,
    productName: i.product.name,
    sku: i.product.sku || i.product.id,
    quantity: Number(i.quantity || 0),
    unitPrice: Number(i.originalUnitPrice || i.product.sell_price || 0),
    subtotal: Number(i.subtotal || 0),
    selectedUnit: i.selectedUnit || i.product.unit || 'Pcs',
    conversionFactor: Number(i.conversionFactor || 1),
  }));

  const row: PosTransactionRowPayload = {
    id: txId,
    tenant_id: tenantId,
    receipt_number: tx.receiptNumber,
    shift_id: tx.shiftId || 'DEFAULT-SHIFT',
    terminal_id: terminalId,
    station_code: tx.stationCode || terminalId,
    cashier_name: tx.cashierName || 'Kasir',
    customer_id: tx.customerId || null,
    customer_name: tx.customerName || null,
    items: mappedItems,
    total: Number(tx.total || 0),
    payment_method: tx.paymentMethod,
    cash_tendered: Number(tx.cashTendered || 0),
    change_due: Number(tx.changeDue || 0),
    status: 'COMPLETED',
    created_at: nowIso,
    synced_at: new Date().toISOString(),
  };

  const stockDeltas: StockDeltaMovementInput[] = mappedItems
    .filter((item) => item.productId && item.quantity > 0)
    .map((item) => ({
      id: generateTransactionUUID(),
      tenantId,
      terminalId,
      productId: item.productId,
      sku: item.sku,
      productName: item.productName,
      qtyDelta: -Number((item.quantity * (item.conversionFactor || 1)).toFixed(4)),
      movementType: 'SALE',
      referenceId: tx.receiptNumber,
      notes: `POS Sale (${terminalId})`,
      createdBy: tx.cashierName || 'Kasir',
    }));

  const queueEntry: OfflineTxQueueEntry = {
    id: txId,
    tenantId,
    terminalId,
    transaction: row,
    stockDeltas,
    queuedAt: nowIso,
    retryCount: 0,
  };

  const client = resolveActiveClient(runtimeConfig);
  if (!client || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    enqueueOfflineTx(queueEntry);
    return { success: false, id: txId, queued: true };
  }

  try {
    const { error, status } = await upsertPosTransactionRow(client, row);
    if (error) {
      if (isNonRetriableSupabaseError(error, status)) {
        console.warn('[SupabaseSync] Push pos_transactions ditolak (non-retriable):', error.message);
        return { success: false, id: txId, queued: false };
      }
      enqueueOfflineTx({ ...queueEntry, lastError: error.message });
      return { success: false, id: txId, queued: true };
    }

    // Catat mutasi stok (qty_delta) + kurangi stok secara atomik via RPC adjust_product_stock
    for (const deltaItem of stockDeltas) {
      await recordAtomicStockMovement(deltaItem, runtimeConfig, {
        applyStockRpc: true,
        queueOnFailure: true,
      });
    }

    return { success: true, id: txId, queued: false };
  } catch (err: any) {
    enqueueOfflineTx({ ...queueEntry, lastError: err?.message || 'Network error' });
    return { success: false, id: txId, queued: true };
  }
};

export const syncOfflineTxQueueToSupabase = async (
  runtimeConfig?: RuntimeSupabaseCredentials
): Promise<{ syncedCount: number; syncedTxIds: string[]; syncedReceiptNumbers: string[] }> => {
  if (isDemoSandboxMode()) {
    return { syncedCount: 0, syncedTxIds: [], syncedReceiptNumbers: [] };
  }
  const client = resolveActiveClient(runtimeConfig);
  if (!client || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return { syncedCount: 0, syncedTxIds: [], syncedReceiptNumbers: [] };
  }

  const queue = getOfflineTxQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, syncedTxIds: [], syncedReceiptNumbers: [] };
  }

  let syncedCount = 0;
  const syncedTxIds: string[] = [];
  const syncedReceiptNumbers: string[] = [];
  const remainingQueue: OfflineTxQueueEntry[] = [];

  for (const entry of queue) {
    try {
      const txPayload: PosTransactionRowPayload = {
        ...entry.transaction,
        id: entry.transaction.id || entry.id || generateTransactionUUID(),
        synced_at: new Date().toISOString(),
      };

      const { error, status } = await upsertPosTransactionRow(client, txPayload);
      if (!error) {
        for (const deltaItem of entry.stockDeltas || []) {
          await recordAtomicStockMovement(deltaItem, runtimeConfig, {
            applyStockRpc: true,
            queueOnFailure: true,
          });
        }
        syncedCount++;
        syncedTxIds.push(txPayload.id);
        if (txPayload.receipt_number) {
          syncedReceiptNumbers.push(txPayload.receipt_number);
        }
      } else if (isNonRetriableSupabaseError(error, status)) {
        const reason = `HTTP ${status || error?.status || '-'} (${error?.code || 'SCHEMA/CONFLICT'}): ${error?.message || 'Ditolak oleh Supabase'}`;
        recordFailedOfflineItem(
          {
            id: entry.id,
            table: 'pos_transactions',
            action: 'UPSERT',
            payload: txPayload,
            timestamp: entry.queuedAt,
            retryCount: entry.retryCount,
          },
          reason
        );
      } else {
        const nextRetry = (entry.retryCount || 0) + 1;
        if (nextRetry >= MAX_OFFLINE_RETRIES) {
          recordFailedOfflineItem(
            {
              id: entry.id,
              table: 'pos_transactions',
              action: 'UPSERT',
              payload: txPayload,
              timestamp: entry.queuedAt,
              retryCount: nextRetry,
            },
            `Melewati batas retry (${MAX_OFFLINE_RETRIES}x): ${error?.message || 'Error sinkronisasi'}`
          );
        } else {
          remainingQueue.push({
            ...entry,
            retryCount: nextRetry,
            lastError: error?.message || String(error),
          });
        }
      }
    } catch (err: any) {
      const nextRetry = (entry.retryCount || 0) + 1;
      if (nextRetry >= MAX_OFFLINE_RETRIES) {
        recordFailedOfflineItem(
          {
            id: entry.id,
            table: 'pos_transactions',
            action: 'UPSERT',
            payload: entry.transaction,
            timestamp: entry.queuedAt,
            retryCount: nextRetry,
          },
          `Exception setelah ${MAX_OFFLINE_RETRIES}x percobaan: ${err?.message || 'Network error'}`
        );
      } else {
        remainingQueue.push({
          ...entry,
          retryCount: nextRetry,
          lastError: err?.message || 'Network error',
        });
      }
    }
  }

  saveOfflineTxQueue(remainingQueue);
  return { syncedCount, syncedTxIds, syncedReceiptNumbers };
};

export const syncOfflineQueueToSupabase = async (
  runtimeConfig?: RuntimeSupabaseCredentials,
  options?: { skipTxQueue?: boolean }
): Promise<number> => {
  if (isDemoSandboxMode()) return 0;
  const client = resolveActiveClient(runtimeConfig);
  if (!client || (typeof navigator !== 'undefined' && !navigator.onLine)) return 0;

  // 1. Flush jacs_offline_tx_queue (UUID append-only POS transactions)
  let syncedCount = 0;
  if (!options?.skipTxQueue) {
    const txRes = await syncOfflineTxQueueToSupabase(runtimeConfig);
    syncedCount += txRes.syncedCount;
  }

  // 2. Flush general offline actions queue (products / stock_movements / legacy entries)
  const queue = getOfflineQueue();
  if (queue.length === 0) return syncedCount;

  const remainingQueue: QueuedSyncPayload[] = [];

  for (const item of queue) {
    try {
      let error: any = null;
      let status: number | undefined;

      if (item.action === 'ATOMIC_STOCK') {
        const row = item.payload?.movementRow;
        const ok = await recordAtomicStockMovement(
          {
            id: row?.id || item.id,
            tenantId: row?.tenant_id,
            terminalId: row?.terminal_id,
            productId: item.payload?.productId || row?.product_id,
            sku: row?.sku,
            productName: row?.product_name,
            qtyDelta: Number(item.payload?.qtyDelta ?? row?.qty_delta ?? row?.delta_qty ?? 0),
            movementType: row?.movement_type || 'ADJUSTMENT',
            referenceId: row?.reference_id,
            notes: row?.notes,
            createdBy: row?.created_by,
          },
          runtimeConfig,
          { applyStockRpc: item.payload?.applyStockRpc !== false, queueOnFailure: false }
        );
        if (!ok) {
          error = { message: 'Gagal menyinkronkan mutasi stok atomik' };
        }
      } else if (item.action === 'RPC_TRANSACTION') {
        const res = await client.rpc('process_pos_transaction_atomic', item.payload);
        error = res.error;
        status = res.status;
      } else if (item.action === 'UPSERT') {
        const conflictKey = item.table === 'pos_transactions' ? 'id' : undefined;
        const res = conflictKey
          ? await client.from(item.table).upsert(item.payload, { onConflict: conflictKey })
          : await client.from(item.table).upsert(item.payload);
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

// =========================================================================
// 4. PRODUCT PULL & UPSERT
// =========================================================================

export const mapSupabaseProductRow = (row: any): Product => ({
  id: String(row.id),
  sku: row.sku || String(row.id),
  barcode: row.barcode,
  name: row.name || 'Produk',
  category: row.category || 'General',
  unit: row.unit || 'Pcs',
  costPrice: Number(row.cost_price ?? 0),
  cost_price: Number(row.cost_price ?? 0),
  sellingPrice: Number(row.sell_price ?? 0),
  sell_price: Number(row.sell_price ?? 0),
  stock: Number(row.stock ?? 0),
  minStock: Number(row.min_stock ?? 5),
  min_stock: Number(row.min_stock ?? 5),
  status: row.status || 'Active',
  businessModel: row.business_model || 'retail',
  unitSecondary: row.unit_secondary,
  priceSecondary: row.price_secondary ? Number(row.price_secondary) : undefined,
  conversionRate: row.conversion_rate ? Number(row.conversion_rate) : 1,
  price_wholesale: row.price_wholesale ? Number(row.price_wholesale) : undefined,
});

export const mapSupabaseTransactionRowToSale = (row: any): Sale => {
  const rawItems: any[] = Array.isArray(row?.items) ? row.items : [];
  const mappedItems: CartItem[] = rawItems.map((it: any) => {
    const qty = Number(it.quantity ?? 1);
    const unitPrice = Number(it.unitPrice ?? it.unit_price ?? 0);
    const subtotal = Number(it.subtotal ?? unitPrice * qty);
    return {
      product: {
        id: String(it.productId || it.product_id || 'UNKNOWN'),
        sku: String(it.sku || it.productId || 'SKU'),
        name: String(it.productName || it.product_name || 'Item POS'),
        category: 'General',
        unit: it.selectedUnit || 'Pcs',
        costPrice: 0,
        cost_price: 0,
        sellingPrice: unitPrice,
        sell_price: unitPrice,
        stock: 0,
        minStock: 0,
        min_stock: 0,
        status: 'Active',
      },
      quantity: qty,
      subtotal,
      originalUnitPrice: unitPrice,
      selectedUnit: it.selectedUnit || 'Pcs',
      conversionFactor: Number(it.conversionFactor ?? 1),
    };
  });

  const createdAt = row?.created_at || new Date().toISOString();
  const txId = String(row?.id || row?.receipt_number || generateTransactionUUID());
  const receiptNo = String(row?.receipt_number || txId);
  const terminalId = String(row?.terminal_id || row?.station_code || 'POS-01');
  const totalAmount = Number(row?.total ?? 0);
  const itemsSummary =
    mappedItems.length > 0
      ? mappedItems.map((i) => `${i.product.name} x${i.quantity}`).join(', ')
      : `Transaksi ${receiptNo}`;

  return {
    transaction_id: txId,
    receipt_number: receiptNo,
    date: createdAt,
    created_at: createdAt,
    cashier_id: String(row?.cashier_name || 'CASHIER'),
    cashier_name: row?.cashier_name || 'Kasir POS',
    terminal_name: terminalId,
    terminalId,
    terminal_id: terminalId,
    stationCode: row?.station_code || terminalId,
    items_summary: itemsSummary,
    subtotal: totalAmount,
    discount: 0,
    total_amount: totalAmount,
    payment_method: (row?.payment_method as any) || 'CASH',
    amount_paid: Number(row?.cash_tendered ?? totalAmount),
    change_amount: Number(row?.change_due ?? 0),
    status: (row?.status as any) || 'COMPLETED',
    items: mappedItems,
    customer_id: row?.customer_id || undefined,
    customer_name: row?.customer_name || undefined,
    shift_id: row?.shift_id || undefined,
    syncStatus: 'SYNCED',
  };
};

export const pullProductsFromSupabase = async (
  tenantId?: string,
  runtimeConfig?: RuntimeSupabaseCredentials
): Promise<Product[]> => {
  if (isDemoSandboxMode()) return [];
  const client = resolveActiveClient(runtimeConfig);
  if (!client) return [];
  try {
    let query = client.from('products').select('*');
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    let { data, error } = await query;
    if (error && tenantId && isUndefinedColumnError(error)) {
      const fallback = await client.from('products').select('*');
      data = fallback.data;
      error = fallback.error;
    }
    if (error || !data) return [];
    return data.map(mapSupabaseProductRow);
  } catch (err) {
    console.error('Failed to pull products from Supabase:', err);
    return [];
  }
};

export const upsertProductToSupabase = async (
  product: Product,
  tenantId?: string,
  runtimeConfig?: RuntimeSupabaseCredentials
): Promise<boolean> => {
  if (isDemoSandboxMode()) return true;
  const payload: Record<string, any> = {
    id: product.id,
    tenant_id: tenantId || 'default-tenant',
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

  const client = resolveActiveClient(runtimeConfig);
  if (!client || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    enqueueOfflineAction('products', 'UPSERT', payload);
    return false;
  }

  try {
    let { error, status } = await client.from('products').upsert(payload, { onConflict: 'id' });
    if (error && isUndefinedColumnError(error)) {
      const { tenant_id: _omit, ...withoutTenant } = payload;
      const retry = await client.from('products').upsert(withoutTenant, { onConflict: 'id' });
      error = retry.error;
      status = retry.status;
    }
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

// Backwards-compatible wrappers delegating to UUID append-only + atomic stock architecture
export const pushTransactionAtomicRpc = async (
  tx: {
    id?: string;
    tenantId?: string;
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
  },
  runtimeConfig?: RuntimeSupabaseCredentials
): Promise<boolean> => {
  const res = await pushPosTransactionAppendOnly(tx, runtimeConfig);
  return res.success;
};

export const pushTransactionToSupabase = async (
  tx: {
    id?: string;
    tenantId?: string;
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
  },
  runtimeConfig?: RuntimeSupabaseCredentials
): Promise<boolean> => {
  const res = await pushPosTransactionAppendOnly(tx, runtimeConfig);
  return res.success;
};

export const pushStockMovementToSupabase = async (
  movement: {
    id?: string;
    tenantId?: string;
    terminalId?: string;
    productId: string;
    sku?: string;
    productName?: string;
    deltaQty: number;
    movementType: 'SALE' | 'RESTOCK' | 'ADJUSTMENT' | 'RETURN';
    referenceId?: string;
    notes?: string;
    createdBy?: string;
  },
  runtimeConfig?: RuntimeSupabaseCredentials
): Promise<boolean> => {
  return recordAtomicStockMovement(
    {
      id: movement.id || generateTransactionUUID(),
      tenantId: movement.tenantId,
      terminalId: movement.terminalId,
      productId: movement.productId,
      sku: movement.sku,
      productName: movement.productName,
      qtyDelta: movement.deltaQty,
      movementType: movement.movementType,
      referenceId: movement.referenceId,
      notes: movement.notes,
      createdBy: movement.createdBy,
    },
    runtimeConfig,
    { applyStockRpc: true, queueOnFailure: true }
  );
};

// =========================================================================
// 5. SNAPSHOT SYNC (jacs_erp_snapshots - untuk konfigurasi/backup penuh)
// =========================================================================

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

  const { data: latestRows, error: latestError } = await client
    .from('jacs_erp_snapshots')
    .select('*')
    .order('synced_at', { ascending: false })
    .limit(1);

  if (latestError) {
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

// =========================================================================
// 6. SUPABASE REALTIME LISTENER (supabase.channel('erp-realtime'))
// =========================================================================

export const subscribeToErpRealtime = (
  callbacks: ErpRealtimeCallbacks,
  runtimeConfig?: RuntimeSupabaseCredentials
): (() => void) => {
  if (isDemoSandboxMode()) return () => {};

  const client = resolveActiveClient(runtimeConfig);
  if (!client) return () => {};

  const safeTenantId = String(callbacks.tenantId || 'default-tenant').trim() || 'default-tenant';

  const handleProductEvent = (payload: any) => {
    const row = payload?.new;
    if (!row || !row.id) return;
    if (row.tenant_id && String(row.tenant_id) !== safeTenantId) return;
    callbacks.onProductChange?.({
      eventType: payload.eventType || 'UPDATE',
      product: {
        ...mapSupabaseProductRow(row),
        tenant_id: row.tenant_id,
      },
      raw: payload,
    });
  };

  const handleTransactionEvent = (payload: any) => {
    const row = payload?.new;
    if (!row || (!row.id && !row.receipt_number)) return;
    if (row.tenant_id && String(row.tenant_id) !== safeTenantId) return;
    callbacks.onTransactionChange?.({
      eventType: payload.eventType || 'INSERT',
      transaction: row as PosTransactionRowPayload,
      sale: mapSupabaseTransactionRowToSale(row),
      raw: payload,
    });
  };

  try {
    const channel = client
      .channel('erp-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'products',
          filter: `tenant_id=eq.${safeTenantId}`,
        },
        handleProductEvent
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `tenant_id=eq.${safeTenantId}`,
        },
        handleProductEvent
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pos_transactions',
          filter: `tenant_id=eq.${safeTenantId}`,
        },
        handleTransactionEvent
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pos_transactions',
          filter: `tenant_id=eq.${safeTenantId}`,
        },
        handleTransactionEvent
      )
      .subscribe((status) => {
        callbacks.onStatusChange?.(status);
      });

    return () => {
      try {
        client.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.error('Failed to subscribe to Supabase erp-realtime channel:', err);
    return () => {};
  }
};

export const subscribeToSupabaseChanges = (
  onProductChange: (payload: any) => void,
  tenantId = 'default-tenant',
  runtimeConfig?: RuntimeSupabaseCredentials
) => {
  return subscribeToErpRealtime(
    {
      tenantId,
      onProductChange: ({ raw }) => onProductChange(raw),
    },
    runtimeConfig
  );
};