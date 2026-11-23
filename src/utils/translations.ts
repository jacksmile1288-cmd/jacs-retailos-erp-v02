export type Language = 'id' | 'en';

export interface DivisionText {
  id: string;
  code: string;
  name: string;
  sub: string;
  desc: string;
}

export const DIVISIONS_TRANSLATIONS: Record<Language, Record<string, DivisionText>> = {
  id: {
    'master-data': {
      id: 'master-data',
      code: '01',
      name: 'Master Data & Katalog',
      sub: 'Katalog Produk, Barcode, Kategori & Satuan',
      desc: 'Pusat canonical master data produk, barcode, multi-satuan UOM, kategori barang, penentuan HPP dan tier harga jual.',
    },
    executive: {
      id: 'executive',
      code: '02',
      name: 'Eksekutif & Manajemen',
      sub: 'KPI, Analitik & Otorisasi',
      desc: 'Pantau omset, margin profitabilitas, efisiensi operasional, dan persetujuan dokumen berisiko tinggi.',
    },
    hr: {
      id: 'hr',
      code: '02',
      name: 'SDM & Personalia',
      sub: 'Staf, Presensi & Cuti',
      desc: 'Kelola data karyawan, presensi shift kerja, pengajuan cuti, dan integrasi absensi kasir.',
    },
    finance: {
      id: 'finance',
      code: '03',
      name: 'Keuangan & Akuntansi',
      sub: 'Kas, AP/AR & Arus Kas',
      desc: 'Rekonsiliasi kas register, manajemen hutang/piutang (AP/AR), pembukuan kas bank & laporan neraca.',
    },
    purchasing: {
      id: 'purchasing',
      code: '04',
      name: 'Pengadaan Barang',
      sub: 'Pengajuan, Pesanan Pembelian & Penerimaan Barang',
      desc: 'Pengajuan kebutuhan (PR), pesanan pembelian (PO) vendor, verifikasi harga modal & penerimaan barang.',
    },
    warehouse: {
      id: 'warehouse',
      code: '05',
      name: 'Gudang & Inventori',
      sub: 'SKU, Mutasi & Stok Opname',
      desc: 'Penerimaan barang fisik, penataan rak (Bin), stok opname, reorder point & pemotongan BOM.',
    },
    pos: {
      id: 'pos',
      code: '06',
      name: 'Kasir & Penjualan (POS)',
      sub: 'Transaksi Kasir & Cetak Struk Penjualan',
      desc: 'Register multi-kasir, scan barcode ritel, cetak struk thermal, QRIS dinamis & laporan Z-Report.',
    },
  },
  en: {
    'master-data': {
      id: 'master-data',
      code: '01',
      name: 'Master Data & Catalog',
      sub: 'Product Catalog, Barcode, Categories & Units',
      desc: 'Canonical master data hub for product catalog, barcodes, multi-units of measure, categories, COGS, and price tiers.',
    },
    executive: {
      id: 'executive',
      code: '02',
      name: 'Executive & Managerial',
      sub: 'KPI, Margin & Approval Queue',
      desc: 'Monitor revenue, net profit margin, operational efficiency, and high-risk document approvals.',
    },
    hr: {
      id: 'hr',
      code: '02',
      name: 'Human Resources',
      sub: 'Staff, Attendance & Leave',
      desc: 'Manage employee directory, shift attendance, leave requests, and cashier clock-in integration.',
    },
    finance: {
      id: 'finance',
      code: '03',
      name: 'Finance & Accounting',
      sub: 'Cash, AP/AR & Cash Flow',
      desc: 'Cash drawer reconciliation, AP/AR ledger management, general journal & balance sheet reports.',
    },
    purchasing: {
      id: 'purchasing',
      code: '04',
      name: 'Purchasing & Procurement',
      sub: 'Purchase Requests, POs & Goods Receipt',
      desc: 'Purchase requisitions (PR), supplier purchase orders (PO), cost price audits & goods receipt.',
    },
    warehouse: {
      id: 'warehouse',
      code: '05',
      name: 'Warehouse & Inventory',
      sub: 'SKU, Stock Movement & Stock Opname',
      desc: 'Physical goods receipt, bin location tagging, stock opname audits, ROP & BOM deductions.',
    },
    pos: {
      id: 'pos',
      code: '06',
      name: 'Point of Sale (POS)',
      sub: 'Cashier Transactions & Receipt Printing',
      desc: 'Multi-terminal cash registers, barcode scanning, thermal receipts, dynamic QRIS & Z-Reports.',
    },
  },
};

export const COMMON_TRANSLATIONS: Record<Language, Record<string, string>> = {
  id: {
    home: 'Beranda',
    dashboard: 'Dasbor',
    masterData: 'Master Data',
    adminSettings: 'Pengaturan & Dev',
    informationCenter: 'Pusat Informasi & SOP',
    accessModule: 'Buka Modul',
    manageData: 'Kelola Data',
    activeTerminals: 'Terminal Kasir Aktif',
    openTerminal: 'Buka Register',
    locked: 'Terkunci',
    ready: 'Siap Operasi',
    inUse: 'Sedang Transaksi',
    quickAction: 'Aksi Cepat',
    brand: 'Merek',
    category: 'Kategori',
    product: 'Produk & SKU',
    supplier: 'Pemasok',
    customer: 'Pelanggan',
    brandDesc: 'Pengaturan merek & pabrikan.',
    categoryDesc: 'Klasifikasi hierarki produk.',
    productDesc: 'Master katalog barang & harga.',
    supplierDesc: 'Mitra pengadaan & syarat kredit.',
    customerDesc: 'Database pelanggan & poin loyalitas.',
    searchPlaceholder: 'Cari modul, transaksi, SKU...',
    helpdeskSLA: 'SLA Respon: <15 Menit',
    close: 'Tutup',
    save: 'Simpan',
    cancel: 'Batal',
    edit: 'Ubah',
    delete: 'Hapus',
    add: 'Tambah',
  },
  en: {
    home: 'Home',
    dashboard: 'Dashboard',
    masterData: 'Master Data',
    adminSettings: 'Settings & Dev',
    informationCenter: 'Info Center & SOP',
    accessModule: 'Access Module',
    manageData: 'Manage Data',
    activeTerminals: 'Active Cashier Terminals',
    openTerminal: 'Open Register',
    locked: 'Locked',
    ready: 'Ready',
    inUse: 'In Use',
    quickAction: 'Quick Action',
    brand: 'Brand',
    category: 'Category',
    product: 'Product & SKU',
    supplier: 'Supplier',
    customer: 'Customer',
    brandDesc: 'Brand & manufacturer settings.',
    categoryDesc: 'Product hierarchy classification.',
    productDesc: 'Catalog items & price master.',
    supplierDesc: 'Procurement partners & credit terms.',
    customerDesc: 'Customer directory & loyalty points.',
    searchPlaceholder: 'Search modules, transactions, SKU...',
    helpdeskSLA: 'SLA Response: <15 Mins',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
  },
};

export const APP_TRANSLATIONS: Record<Language, Record<string, string>> = {
  id: {
    ...COMMON_TRANSLATIONS.id,
    nav_home: 'Beranda Utama',
    nav_admin: 'Konsol SuperAdmin',
    nav_executive: 'Eksekutif & Manajemen',
    nav_finance: 'Keuangan & Akuntansi',
    nav_purchasing: 'Pengadaan Barang (Purchasing)',
    nav_pos: 'Kasir & Penjualan (POS)',
    nav_warehouse: 'Gudang & Inventori',
    nav_hr: 'SDM & Personalia (HR)',
    nav_master_data: 'Master Data & Katalog',
    nav_security: 'Keamanan & Audit',
    btn_logout: 'Keluar',
    btn_login: 'Masuk',
    btn_ask_ai: 'Tanya AI',
    pos_title: 'Terminal Point of Sale',
    pos_online_cashiers: 'Kasir Online',
    pos_open_shift: 'Buka Shift Kasir',
    pos_close_shift: 'Tutup Shift & Rekonsiliasi',
    division_label: 'Divisi',
    division_locked_tooltip: 'Divisi Terkunci • Klik Keluar untuk Pindah Divisi',
    lang_switched_id: 'Bahasa diubah ke Bahasa Indonesia (ID)',
    lang_switched_en: 'Language switched to English (EN)',
  },
  en: {
    ...COMMON_TRANSLATIONS.en,
    nav_home: 'Home Portal',
    nav_admin: 'SuperAdmin Console',
    nav_executive: 'Executive & Management',
    nav_finance: 'Finance & Accounting',
    nav_purchasing: 'Purchasing & Procurement',
    nav_pos: 'Point of Sale (POS)',
    nav_warehouse: 'Warehouse & Inventory',
    nav_hr: 'Human Resources (HR)',
    nav_master_data: 'Master Data & Catalog',
    nav_security: 'Security & Audit',
    btn_logout: 'Logout',
    btn_login: 'Sign In',
    btn_ask_ai: 'Ask AI',
    pos_title: 'Point of Sale Terminals',
    pos_online_cashiers: 'Cashiers Online',
    pos_open_shift: 'Open Cashier Shift',
    pos_close_shift: 'Close Shift & Reconcile',
    division_label: 'Division',
    division_locked_tooltip: 'Division Locked • Click Logout to Switch Division',
    lang_switched_id: 'Bahasa diubah ke Bahasa Indonesia (ID)',
    lang_switched_en: 'Language switched to English (EN)',
  },
};

const HUMANIZE_FALLBACK_MAP_ID: Record<string, string> = {
  'pos.title': 'Terminal Point of Sale',
  'executive.title': 'Eksekutif & Manajemen',
  'finance.title': 'Keuangan & Akuntansi',
  'purchasing.title': 'Pengadaan Barang',
  'warehouse.title': 'Gudang & Inventori',
  'hr.title': 'SDM & Personalia',
  'admin.title': 'Konsol SuperAdmin',
};

/**
 * Mengambil teks terjemahan sesuai bahasa aktif (ID / EN) dengan proteksi fallback otomatis:
 * 1. Kamus bahasa aktif (EN / ID)
 * 2. Fallback wajib ke kamus Bahasa Indonesia (ID) jika kunci EN belum terdaftar atau kosong
 * 3. Normalisasi human-readable jika kunci tidak ada di kamus agar tidak pernah menampilkan kode key mentah atau string kosong
 */
export function getTranslatedText(
  lang: Language | string | undefined,
  key: string,
  params?: Record<string, any>,
  defaultIdFallback?: string
): string {
  const safeKey = String(key || '').trim();
  if (!safeKey) return defaultIdFallback || 'Teks';

  const normalizedLang: Language = String(lang || 'id').toLowerCase() === 'en' ? 'en' : 'id';
  const normalizedUnderscoreKey = safeKey.replace(/\./g, '_');

  const candidateActive =
    APP_TRANSLATIONS[normalizedLang]?.[safeKey] ||
    APP_TRANSLATIONS[normalizedLang]?.[normalizedUnderscoreKey] ||
    COMMON_TRANSLATIONS[normalizedLang]?.[safeKey];

  const candidateIdFallback =
    APP_TRANSLATIONS.id?.[safeKey] ||
    APP_TRANSLATIONS.id?.[normalizedUnderscoreKey] ||
    COMMON_TRANSLATIONS.id?.[safeKey] ||
    HUMANIZE_FALLBACK_MAP_ID[safeKey] ||
    defaultIdFallback;

  let resolved =
    (typeof candidateActive === 'string' && candidateActive.trim().length > 0
      ? candidateActive
      : undefined) ||
    (typeof candidateIdFallback === 'string' && candidateIdFallback.trim().length > 0
      ? candidateIdFallback
      : undefined);

  if (!resolved) {
    // Jika input sudah berupa kalimat biasa (mengandung spasi), gunakan langsung; jika berupa kode key mentah (pos.title / nav_pos), ubah jadi teks rapi
    if (safeKey.includes(' ')) {
      resolved = safeKey;
    } else {
      resolved = safeKey
        .replace(/^(nav_|btn_|pos_|col_|tab_|stat_)/i, '')
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }
  }

  if (params && typeof params === 'object') {
    Object.keys(params).forEach((pKey) => {
      resolved = (resolved as string).replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(params[pKey] ?? ''));
    });
  }

  return resolved;
}

export function getDivisionTranslation(
  lang: Language | string | undefined,
  divisionId: string,
  fallback?: Partial<DivisionText>
): DivisionText {
  const normalizedLang: Language = String(lang || 'id').toLowerCase() === 'en' ? 'en' : 'id';
  const activeEntry = DIVISIONS_TRANSLATIONS[normalizedLang]?.[divisionId];
  const idFallbackEntry = DIVISIONS_TRANSLATIONS.id?.[divisionId];

  return {
    id: divisionId,
    code: activeEntry?.code || idFallbackEntry?.code || fallback?.code || '00',
    name:
      (activeEntry?.name && activeEntry.name.trim()) ||
      (idFallbackEntry?.name && idFallbackEntry.name.trim()) ||
      fallback?.name ||
      divisionId.toUpperCase(),
    sub:
      (activeEntry?.sub && activeEntry.sub.trim()) ||
      (idFallbackEntry?.sub && idFallbackEntry.sub.trim()) ||
      fallback?.sub ||
      'Modul Operasional ERP',
    desc:
      (activeEntry?.desc && activeEntry.desc.trim()) ||
      (idFallbackEntry?.desc && idFallbackEntry.desc.trim()) ||
      fallback?.desc ||
      'Modul operasional terintegrasi RetailOS ERP.',
  };
}

