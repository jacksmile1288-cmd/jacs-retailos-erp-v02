import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Product, CartItem } from '../types';

const OFFLINE_QUEUE_KEY = 'jacs_supabase_offline_queue_v1';

export interface QueuedSyncPayload {
  id: string;
  table: 'products' | 'pos_transactions' | 'stock_movements';
  action: 'UPSERT' | 'INSERT' | 'RPC_TRANSACTION';
  payload: any;
  timestamp: string;
}

export const getOfflineQueue = (): QueuedSyncPayload[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveOfflineQueue = (queue: QueuedSyncPayload[]) => {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to save offline queue:', err);
  }
};

export const enqueueOfflineAction = (
  table: 'products' | 'pos_transactions' | 'stock_movements',
  action: 'UPSERT' | 'INSERT' | 'RPC_TRANSACTION',
  payload: any
) => {
  const queue = getOfflineQueue();
  const entry: QueuedSyncPayload = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    table,
    action,
    payload,
    timestamp: new Date().toISOString(),
  };
  queue.push(entry);
  saveOfflineQueue(queue);
};

export const syncOfflineQueueToSupabase = async (): Promise<number> => {
  if (!isSupabaseConfigured || !navigator.onLine) return 0;
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  let syncedCount = 0;
  const remainingQueue: QueuedSyncPayload[] = [];

  for (const item of queue) {
    try {
      let error = null;
      if (item.action === 'RPC_TRANSACTION') {
        const { error: rpcError } = await supabase.rpc('process_pos_transaction_atomic', item.payload);
        error = rpcError;
      } else if (item.action === 'UPSERT') {
        const res = await supabase.from(item.table).upsert(item.payload);
        error = res.error;
      } else {
        const res = await supabase.from(item.table).insert(item.payload);
        error = res.error;
      }

      if (error) {
        remainingQueue.push(item);
      } else {
        syncedCount++;
      }
    } catch {
      remainingQueue.push(item);
    }
  }

  saveOfflineQueue(remainingQueue);
  return syncedCount;
};

// 1. PULL DATA FROM SUPABASE
export const pullProductsFromSupabase = async (): Promise<Product[]> => {
  if (!isSupabaseConfigured) return [];
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
    const { error } = await supabase.from('products').upsert(payload);
    if (error) {
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
      // Fallback to standard push transaction if RPC encounters any issue
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
    const { error } = await supabase.from('pos_transactions').upsert(payload);
    if (error) {
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
    const { error } = await supabase.from('stock_movements').insert(payload);
    if (error) {
      enqueueOfflineAction('stock_movements', 'INSERT', payload);
      return false;
    }
    return true;
  } catch {
    enqueueOfflineAction('stock_movements', 'INSERT', payload);
    return false;
  }
};

// 5. REALTIME SUBSCRIPTION
export const subscribeToSupabaseChanges = (onProductChange: (payload: any) => void) => {
  if (!isSupabaseConfigured) return () => {};

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
