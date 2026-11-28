import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { dualBackendSync } from '../services/dualBackendSync';

export const DEFAULT_FALLBACK_SUPABASE_URL = 'https://cdjjidkzesscwlibhbng.supabase.co';

export interface RuntimeSupabaseCredentials {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

const stripInvisibleAndQuotes = (raw?: unknown): string =>
  typeof raw === 'string'
    ? raw
        .replace(/[\u200B-\u200D\uFEFF\u0000-\u001F\u007F]/g, '')
        .trim()
        .replace(/^['"]+|['"]+$/g, '')
        .trim()
    : '';

export const sanitizeAndValidateSupabaseUrl = (raw?: unknown): string => {
  const cleaned = stripInvisibleAndQuotes(raw)
    .replace(/\s+/g, '')
    .replace(/\/+$/, '');
  if (!cleaned) return '';

  let candidate = cleaned;
  if (/^https?:\/\//i.test(candidate)) {
    candidate = candidate.replace(/^https?:\/\//i, (m) => m.toLowerCase());
  } else if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?(\/.*)?$/i.test(candidate)) {
    candidate = `https://${candidate}`;
  } else {
    return '';
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return '';
    }
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return '';
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return '';
  }
};

const normalizeSupabaseKey = (raw?: unknown): string =>
  stripInvisibleAndQuotes(raw).replace(/\s+/g, '');

const envSupabaseUrl = sanitizeAndValidateSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || '');
const envSupabaseAnonKey = normalizeSupabaseKey(import.meta.env.VITE_SUPABASE_ANON_KEY || '');

const isValidSupabaseUrl = (url: string): boolean => Boolean(sanitizeAndValidateSupabaseUrl(url));

const isValidSupabaseKey = (key: string): boolean => Boolean(key && key.length > 0);

export const isSupabaseConfigured = Boolean(
  isValidSupabaseUrl(envSupabaseUrl) && isValidSupabaseKey(envSupabaseAnonKey)
);

const readStoredDualBackendSupabase = (): RuntimeSupabaseCredentials => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    const raw = window.localStorage.getItem('jacs_dual_backend_config');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const storedUrl =
      typeof parsed?.supabaseUrl === 'string'
        ? parsed.supabaseUrl
        : typeof parsed?.supabase_url === 'string'
        ? parsed.supabase_url
        : typeof parsed?.url === 'string'
        ? parsed.url
        : '';
    const storedKey =
      typeof parsed?.supabaseAnonKey === 'string'
        ? parsed.supabaseAnonKey
        : typeof parsed?.supabase_anon_key === 'string'
        ? parsed.supabase_anon_key
        : typeof parsed?.anonKey === 'string'
        ? parsed.anonKey
        : '';
    return {
      supabaseUrl: sanitizeAndValidateSupabaseUrl(storedUrl),
      supabaseAnonKey: normalizeSupabaseKey(storedKey),
    };
  } catch {
    return {};
  }
};

const readLiveDualBackendSupabase = (): RuntimeSupabaseCredentials => {
  try {
    const live = dualBackendSync.getConfig();
    return {
      supabaseUrl: sanitizeAndValidateSupabaseUrl(live?.supabaseUrl),
      supabaseAnonKey: normalizeSupabaseKey(live?.supabaseAnonKey),
    };
  } catch {
    return {};
  }
};

export const resolveSupabaseCredentials = (
  override?: RuntimeSupabaseCredentials
): { supabaseUrl: string; supabaseAnonKey: string; configured: boolean } => {
  const overrideUrl = sanitizeAndValidateSupabaseUrl(override?.supabaseUrl);
  const overrideKey = normalizeSupabaseKey(override?.supabaseAnonKey);
  const live = readLiveDualBackendSupabase();
  const stored = readStoredDualBackendSupabase();

  const resolvedKey =
    overrideKey || live.supabaseAnonKey || stored.supabaseAnonKey || envSupabaseAnonKey || '';

  const urlCandidates = [overrideUrl, live.supabaseUrl, stored.supabaseUrl, envSupabaseUrl];
  let resolvedUrl = '';
  for (const candidate of urlCandidates) {
    const valid = sanitizeAndValidateSupabaseUrl(candidate);
    if (valid) {
      resolvedUrl = valid;
      break;
    }
  }

  // Fallback aman ke URL Supabase valid jika URL runtime kosong/malformed namun Anon Key sudah tersedia
  if (!resolvedUrl && resolvedKey) {
    resolvedUrl = DEFAULT_FALLBACK_SUPABASE_URL;
  }

  return {
    supabaseUrl: resolvedUrl,
    supabaseAnonKey: resolvedKey,
    configured: isValidSupabaseUrl(resolvedUrl) && isValidSupabaseKey(resolvedKey),
  };
};

// Fallback safe mock client if not configured so application does not crash
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(envSupabaseUrl, envSupabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : (({
      from: () => ({
        select: () => Promise.resolve({ data: [], error: { message: 'Supabase not configured' } }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      }),
      rpc: () => Promise.resolve({ data: { success: false, message: 'Supabase not configured' }, error: { message: 'Supabase not configured' } }),
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} }),
      }),
      removeChannel: () => {},
    }) as unknown as SupabaseClient);

const runtimeClientCache = new Map<string, SupabaseClient>();

export const getRuntimeSupabaseClient = (
  override?: RuntimeSupabaseCredentials
): SupabaseClient | null => {
  const { supabaseUrl: resolvedUrl, supabaseAnonKey: resolvedKey, configured } =
    resolveSupabaseCredentials(override);

  if (!configured || !resolvedKey) return null;

  const safeUrl = sanitizeAndValidateSupabaseUrl(resolvedUrl) || DEFAULT_FALLBACK_SUPABASE_URL;

  if (
    isSupabaseConfigured &&
    safeUrl === envSupabaseUrl &&
    resolvedKey === envSupabaseAnonKey
  ) {
    return supabase;
  }

  const cacheKey = `${safeUrl}::${resolvedKey}`;
  const cached = runtimeClientCache.get(cacheKey);
  if (cached) return cached;

  try {
    const client = createClient(safeUrl, resolvedKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
    runtimeClientCache.set(cacheKey, client);
    return client;
  } catch {
    const fallbackClient = createClient(DEFAULT_FALLBACK_SUPABASE_URL, resolvedKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
    runtimeClientCache.set(`${DEFAULT_FALLBACK_SUPABASE_URL}::${resolvedKey}`, fallbackClient);
    return fallbackClient;
  }
};

export const SUPABASE_SETUP_SQL_SCRIPT = `-- =========================================================================
-- JAC-S RETAILOS ERP: SUPABASE PRODUCTION DATABASE SCHEMA & RLS SETUP
-- =========================================================================

-- 1. TABEL PRODUCTS (Master Produk, Harga, Stok & Multi-UOM)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    tenant_id TEXT DEFAULT 'default-tenant',
    sku TEXT,
    barcode TEXT,
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT DEFAULT 'Pcs',
    cost_price NUMERIC DEFAULT 0,
    sell_price NUMERIC DEFAULT 0,
    stock NUMERIC DEFAULT 0,
    min_stock NUMERIC DEFAULT 5,
    status TEXT DEFAULT 'Active',
    business_model TEXT DEFAULT 'retail',
    unit_secondary TEXT,
    price_secondary NUMERIC,
    conversion_rate NUMERIC DEFAULT 1,
    price_wholesale NUMERIC,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default-tenant';
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at DESC);

-- 2. TABEL POS_TRANSACTIONS (Transaksi Append-Only Multi-Kasir Berbasis UUID)
CREATE TABLE IF NOT EXISTS pos_transactions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT DEFAULT 'default-tenant',
    receipt_number TEXT,
    shift_id TEXT,
    terminal_id TEXT NOT NULL DEFAULT 'POS-01',
    station_code TEXT,
    cashier_name TEXT,
    customer_id TEXT,
    customer_name TEXT,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    cash_tendered NUMERIC,
    change_due NUMERIC,
    status TEXT DEFAULT 'COMPLETED',
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pos_transactions ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE pos_transactions ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default-tenant';
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON pos_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_terminal ON pos_transactions(terminal_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON pos_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_station ON pos_transactions(station_code);

-- 3. TABEL STOCK_MOVEMENTS (Mutasi Stok Delta & Audit Inventory)
CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    tenant_id TEXT DEFAULT 'default-tenant',
    terminal_id TEXT DEFAULT 'POS-01',
    product_id TEXT NOT NULL,
    sku TEXT,
    product_name TEXT,
    qty_delta NUMERIC NOT NULL,
    delta_qty NUMERIC,
    movement_type TEXT NOT NULL, -- 'SALE', 'RESTOCK', 'ADJUSTMENT', 'RETURN'
    reference_id TEXT,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default-tenant';
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS terminal_id TEXT DEFAULT 'POS-01';
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS qty_delta NUMERIC;
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant ON stock_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);

-- 4. ROW LEVEL SECURITY (RLS) & PUBLIK ACCESS POLICIES
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Products" ON products;
CREATE POLICY "Public Read Products" ON products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public Upsert Products" ON products;
CREATE POLICY "Public Upsert Products" ON products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Transactions" ON pos_transactions;
CREATE POLICY "Public Read Transactions" ON pos_transactions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public Upsert Transactions" ON pos_transactions;
CREATE POLICY "Public Upsert Transactions" ON pos_transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Stock Movements" ON stock_movements;
CREATE POLICY "Public Read Stock Movements" ON stock_movements FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public Insert Stock Movements" ON stock_movements;
CREATE POLICY "Public Insert Stock Movements" ON stock_movements FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 5. REALTIME PUBLICATION SETUP
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE pos_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_movements;

-- 6. POSTGRESQL ATOMIC STOCK ADJUSTMENT RPC (ANTI RACE-CONDITION MULTI-KASIR)
CREATE OR REPLACE FUNCTION adjust_product_stock(
    p_product_id TEXT,
    p_delta NUMERIC
)
RETURNS TABLE(product_id TEXT, new_stock NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_stock NUMERIC;
BEGIN
    UPDATE products
    SET stock = GREATEST(0, COALESCE(stock, 0) + COALESCE(p_delta, 0)),
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING stock INTO v_new_stock;

    RETURN QUERY SELECT p_product_id, COALESCE(v_new_stock, 0);
END;
$$;

-- 7. POSTGRESQL ATOMIC & IDEMPOTENT POS TRANSACTION RPC FUNCTION
CREATE OR REPLACE FUNCTION process_pos_transaction_atomic(
    p_receipt_number TEXT,
    p_shift_id TEXT,
    p_terminal_id TEXT,
    p_station_code TEXT,
    p_cashier_name TEXT,
    p_customer_id TEXT,
    p_customer_name TEXT,
    p_items JSONB,
    p_total NUMERIC,
    p_payment_method TEXT,
    p_cash_tendered NUMERIC,
    p_change_due NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item JSONB;
    v_product_id TEXT;
    v_qty NUMERIC;
    v_conversion NUMERIC;
    v_base_qty NUMERIC;
    v_product_name TEXT;
    v_sku TEXT;
    v_existing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_existing_count FROM pos_transactions WHERE receipt_number = p_receipt_number;
    IF v_existing_count > 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'idempotent', true,
            'message', 'Transaksi dengan nomor nota ' || p_receipt_number || ' sudah pernah diproses sebelumnya.',
            'receipt_number', p_receipt_number
        );
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := COALESCE(v_item->>'productId', v_item->>'product_id');
        v_qty := COALESCE((v_item->>'quantity')::NUMERIC, 1);
        v_conversion := COALESCE((v_item->>'conversionFactor')::NUMERIC, (v_item->>'conversion_rate')::NUMERIC, 1);
        v_base_qty := v_qty * v_conversion;
        v_product_name := COALESCE(v_item->>'productName', v_item->>'product_name', 'Item POS');
        v_sku := COALESCE(v_item->>'sku', v_product_id);

        PERFORM adjust_product_stock(v_product_id, -v_base_qty);

        INSERT INTO stock_movements (
            id,
            terminal_id,
            product_id,
            sku,
            product_name,
            qty_delta,
            delta_qty,
            movement_type,
            reference_id,
            notes,
            created_by,
            created_at
        ) VALUES (
            gen_random_uuid()::text,
            p_terminal_id,
            v_product_id,
            v_sku,
            v_product_name,
            -v_base_qty,
            -v_base_qty,
            'SALE',
            p_receipt_number,
            'Penjualan POS Atomic RPC (' || p_station_code || ')',
            p_cashier_name,
            NOW()
        );
    END LOOP;

    INSERT INTO pos_transactions (
        id,
        receipt_number,
        shift_id,
        terminal_id,
        station_code,
        cashier_name,
        customer_id,
        customer_name,
        items,
        total,
        payment_method,
        cash_tendered,
        change_due,
        status,
        synced_at,
        created_at
    ) VALUES (
        gen_random_uuid()::text,
        p_receipt_number,
        p_shift_id,
        p_terminal_id,
        p_station_code,
        p_cashier_name,
        p_customer_id,
        p_customer_name,
        p_items,
        p_total,
        p_payment_method,
        p_cash_tendered,
        p_change_due,
        'COMPLETED',
        NOW(),
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'message', 'Transaksi POS berhasil diproses secara atomik via PostgreSQL RPC.',
        'receipt_number', p_receipt_number
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Atomic POS Transaction Error: %', SQLERRM;
END;
$$;
`;
