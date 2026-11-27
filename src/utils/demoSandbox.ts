export const DEMO_SANDBOX_PREFIX = 'jacs_demo_sandbox_';
export const DEMO_SANDBOX_INIT_FLAG = 'jacs_demo_sandbox_initialized_v1';
export const DEMO_SANDBOX_ACTIVE_FLAG = 'jacs_demo_sandbox_active_v1';
export const DEMO_SANDBOX_ACTIVE_USER_KEY = 'jacs_demo_sandbox_active_user';
export const DEMO_SANDBOX_SESSION_SIG_KEY = 'jacs_demo_sandbox_session_sig';

export interface DemoDivisionQuickPin {
  id: 'pos' | 'executive' | 'finance' | 'purchasing' | 'warehouse' | 'hr';
  label: string;
  username: string;
  pin: string;
  accentHex: string;
}

export const DEMO_DIVISION_QUICK_PINS: DemoDivisionQuickPin[] = [
  { id: 'pos', label: 'Kasir POS', username: 'Kasir 01', pin: '1101', accentHex: '#F43F5E' },
  { id: 'executive', label: 'Executive', username: 'Executive', pin: '1234', accentHex: '#3B82F6' },
  { id: 'finance', label: 'Finance', username: 'Finance', pin: '1234', accentHex: '#22C55E' },
  { id: 'purchasing', label: 'Purchasing', username: 'Purchasing', pin: '1234', accentHex: '#F97316' },
  { id: 'warehouse', label: 'Warehouse', username: 'Gudang', pin: '1234', accentHex: '#06B6D4' },
  { id: 'hr', label: 'HR', username: 'HR', pin: '1234', accentHex: '#A855F7' },
];

export interface DemoBusinessProfileMeta {
  businessType: string;
  unitName: string;
  tagline: string;
  modelHint: string;
}

export const DEMO_BUSINESS_PROFILE_META: Record<string, DemoBusinessProfileMeta> = {
  RETAIL: {
    businessType: 'RETAIL',
    unitName: 'JacS Minimarket Demo',
    tagline: 'Retail & Minimarket Modern Terpadu',
    modelHint: 'MINIMARKET',
  },
  FNB: {
    businessType: 'FNB',
    unitName: 'JacS Cafe & Resto Demo',
    tagline: 'Restoran, Kafe & Kitchen BOM Terpadu',
    modelHint: 'RESTO_CAFE',
  },
  PHARMACY: {
    businessType: 'PHARMACY',
    unitName: 'JacS Apotek & Klinik Demo',
    tagline: 'Apotek, Nomor Batch & Kontrol Kedaluwarsa',
    modelHint: 'TOKO_OBAT_KESEHATAN',
  },
  WORKSHOP: {
    businessType: 'WORKSHOP',
    unitName: 'JacS Bengkel & Otomotif Demo',
    tagline: 'Servis Kendaraan & Sparepart Otomotif',
    modelHint: 'MINIMARKET',
  },
  SALON: {
    businessType: 'SALON',
    unitName: 'JacS Salon & Barbershop Demo',
    tagline: 'Grooming, Stylist & Paket Perawatan',
    modelHint: 'BARBERSHOP_SALON',
  },
  FASHION: {
    businessType: 'FASHION',
    unitName: 'JacS Fashion & Butik Demo',
    tagline: 'Butik Busana Varian Ukuran & Warna',
    modelHint: 'FASHION_BUTIK',
  },
  CONSTRUCTION: {
    businessType: 'CONSTRUCTION',
    unitName: 'JacS Depo Bangunan Demo',
    tagline: 'Toko Bangunan, Material & Pengiriman Proyek',
    modelHint: 'BAHAN_BANGUNAN_MATERIAL',
  },
  ELECTRONICS: {
    businessType: 'ELECTRONICS',
    unitName: 'JacS Elektronik & Gadget Demo',
    tagline: 'Gadget, Serial Number / IMEI & Garansi',
    modelHint: 'MINIMARKET',
  },
  LAUNDRY: {
    businessType: 'LAUNDRY',
    unitName: 'JacS Laundry Express Demo',
    tagline: 'Laundry Kiloan, Satuan & Monitoring SLA',
    modelHint: 'LAUNDRY',
  },
  WHOLESALE: {
    businessType: 'WHOLESALE',
    unitName: 'JacS Grosir & Distributor Demo',
    tagline: 'Distribusi B2B, MOQ & Tempo Kredit',
    modelHint: 'GROSIR_BESAR',
  },
};

export const getDemoBusinessProfileMeta = (bType?: string | null): DemoBusinessProfileMeta => {
  const key = String(bType || 'RETAIL').trim().toUpperCase();
  return DEMO_BUSINESS_PROFILE_META[key] || DEMO_BUSINESS_PROFILE_META.RETAIL;
};

export const FNB_FALLBACK_CATEGORY_IMAGES = {
  coffee: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&q=80',
  beverage: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
  snack: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
} as const;

export const FNB_MENU_PHOTO_MAP: Array<{ keywords: string[]; url: string }> = [
  {
    keywords: ['kopi susu', 'gula aren', 'iced coffee', 'es kopi'],
    url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['espresso', 'americano', 'black coffee'],
    url: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['cappuccino', 'latte', 'kopi', 'coffee', 'mocha'],
    url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['nasi goreng', 'fried rice', 'wagyu'],
    url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['ayam bakar', 'ayam goreng', 'grilled chicken', 'ayam'],
    url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['mie ayam', 'mie goreng', 'bakso', 'noodle', 'ramen'],
    url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['soto', 'sup', 'soup', 'rawon'],
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['alpukat', 'avocado', 'smoothie', 'juice', 'jus'],
    url: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['lemon tea', 'lychee tea', 'mint', 'citrus'],
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['teh manis', 'es teh', 'melati', 'iced tea', 'tea'],
    url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['matcha', 'green tea'],
    url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['boba', 'brown sugar', 'milk tea'],
    url: 'https://images.unsplash.com/photo-1558857563-b37fe84234d3?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['pisang goreng', 'croissant', 'pastry', 'bakery', 'roti', 'toast'],
    url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['kerupuk', 'cracker', 'chips', 'emping'],
    url: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['kentang', 'fries', 'french fries'],
    url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['dimsum', 'siomay', 'gyoza', 'dumpling'],
    url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['burger', 'sandwich'],
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['tahu', 'tempe', 'cabe garam'],
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
  },
  {
    keywords: ['paket', 'combo', 'bento'],
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80',
  },
];

export const getFnbFallbackImageUrl = (category?: string | null): string => {
  const cat = String(category || '').toLowerCase();
  if (cat.includes('kopi') && !cat.includes('non-kopi')) {
    return FNB_FALLBACK_CATEGORY_IMAGES.coffee;
  }
  if (cat.includes('espresso') || cat.includes('coffee')) {
    return FNB_FALLBACK_CATEGORY_IMAGES.coffee;
  }
  if (
    cat.includes('non-kopi') ||
    cat.includes('segar') ||
    cat.includes('minuman') ||
    cat.includes('juice') ||
    cat.includes('jus') ||
    cat.includes('teh')
  ) {
    return FNB_FALLBACK_CATEGORY_IMAGES.beverage;
  }
  if (
    cat.includes('snack') ||
    cat.includes('camilan') ||
    cat.includes('pastry') ||
    cat.includes('bakery') ||
    cat.includes('pelengkap') ||
    cat.includes('dessert')
  ) {
    return FNB_FALLBACK_CATEGORY_IMAGES.snack;
  }
  return FNB_FALLBACK_CATEGORY_IMAGES.food;
};

export const resolveFnbMenuImageUrl = (
  name?: string | null,
  category?: string | null,
  existingImage?: string | null
): string => {
  const trimmedExisting = String(existingImage || '').trim();
  if (/^https?:\/\//i.test(trimmedExisting)) {
    return trimmedExisting;
  }
  const lowerName = String(name || '').toLowerCase();
  for (const entry of FNB_MENU_PHOTO_MAP) {
    if (entry.keywords.some((kw) => lowerName.includes(kw))) {
      return entry.url;
    }
  }
  return getFnbFallbackImageUrl(category);
};

export const setDemoSandboxBusinessType = (bType: string) => {
  try {
    if (typeof window === 'undefined') return;
    const normalized = String(bType || 'RETAIL').trim().toUpperCase();
    localStorage.setItem('jacs_demo_sandbox_business_type', normalized);
    localStorage.setItem('jacs_active_business_type', normalized);
    localStorage.setItem('jacs_active_demo_business_type', normalized);
    sessionStorage.setItem('jacs_demo_sandbox_business_type', normalized);
    sessionStorage.setItem('jacs_active_business_type', normalized);
  } catch {}
};

export const getDemoSandboxBusinessType = (): string => {
  try {
    if (typeof window === 'undefined') return 'RETAIL';
    return String(
      localStorage.getItem('jacs_demo_sandbox_business_type') ||
        localStorage.getItem('jacs_active_business_type') ||
        localStorage.getItem('jacs_active_demo_business_type') ||
        sessionStorage.getItem('jacs_demo_sandbox_business_type') ||
        sessionStorage.getItem('jacs_active_business_type') ||
        'RETAIL'
    )
      .trim()
      .toUpperCase();
  } catch {
    return 'RETAIL';
  }
};

export const isDemoSandboxActive = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DEMO_SANDBOX_ACTIVE_FLAG) === 'true' || sessionStorage.getItem(DEMO_SANDBOX_ACTIVE_FLAG) === 'true';
  } catch {
    return false;
  }
};

export const isDemoSandboxMode = (): boolean => isDemoSandboxActive();

export const activateDemoSandbox = (): void => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DEMO_SANDBOX_ACTIVE_FLAG, 'true');
    sessionStorage.setItem(DEMO_SANDBOX_ACTIVE_FLAG, 'true');
  } catch {}
};

export const deactivateDemoSandbox = (): void => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(DEMO_SANDBOX_ACTIVE_FLAG);
    sessionStorage.removeItem(DEMO_SANDBOX_ACTIVE_FLAG);
    localStorage.removeItem('jacs_demo_sandbox_business_type');
    localStorage.removeItem('jacs_active_business_type');
    localStorage.removeItem('jacs_active_demo_business_type');
    sessionStorage.removeItem('jacs_demo_sandbox_business_type');
    sessionStorage.removeItem('jacs_active_business_type');
    clearAllDemoSandboxStorage();
  } catch {}
};

export const getActiveStorageBackend = (): Storage | null => {
  try {
    if (typeof window === 'undefined') return null;
    return isDemoSandboxActive() ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
};

export const getScopedStoragePrefix = (productionPrefix = 'jacs_retailos_erp_v2_2_'): string =>
  isDemoSandboxActive() ? DEMO_SANDBOX_PREFIX : productionPrefix;

export const sandboxGetItem = (key: string): string | null => {
  try {
    const store = getActiveStorageBackend();
    return store ? store.getItem(key) : null;
  } catch {
    return null;
  }
};

export const sandboxSetItem = (key: string, value: string): void => {
  try {
    const store = getActiveStorageBackend();
    if (store) store.setItem(key, value);
  } catch {}
};

export const sandboxRemoveItem = (key: string): void => {
  try {
    const store = getActiveStorageBackend();
    if (store) store.removeItem(key);
  } catch {}
};

export const clearAllDemoSandboxStorage = (): void => {
  try {
    if (typeof window === 'undefined') return;
    const stores: Storage[] = [];
    if (window.sessionStorage) stores.push(window.sessionStorage);
    if (window.localStorage) stores.push(window.localStorage);

    stores.forEach((store) => {
      const keysToRemove: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k && k.startsWith(DEMO_SANDBOX_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => {
        try {
          store.removeItem(k);
        } catch {}
      });
    });
  } catch {}
};
