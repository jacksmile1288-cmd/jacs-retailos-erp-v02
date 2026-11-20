import { Product, ServiceItemFormat, ServiceStylistMaster } from '../types';

export interface ServiceFormatOption {
  value: ServiceItemFormat;
  label: string;
  shortLabel: string;
  isRetail: boolean;
  isPackage: boolean;
  badgeClass: string;
}

export const SERVICE_FORMAT_OPTIONS: ServiceFormatOption[] = [
  {
    value: 'LAYANAN_SATUAN',
    label: 'Layanan Satuan',
    shortLabel: 'SATUAN',
    isRetail: false,
    isPackage: false,
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/35',
  },
  {
    value: 'PAKET_BUNDLING',
    label: 'Paket Bundling',
    shortLabel: 'PAKET BUNDLING',
    isRetail: false,
    isPackage: true,
    badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40',
  },
  {
    value: 'LAYANAN_ADDON',
    label: 'Layanan Tambahan (Add-on)',
    shortLabel: 'ADD-ON',
    isRetail: false,
    isPackage: false,
    badgeClass: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/35',
  },
  {
    value: 'PRODUK_RETAIL_SALON',
    label: 'Produk Retail Salon',
    shortLabel: 'RETAIL SALON',
    isRetail: true,
    isPackage: false,
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35',
  },
];

export function resolveServiceItemFormat(product: Partial<Product>): ServiceItemFormat {
  if (product.serviceFormat) {
    return product.serviceFormat;
  }
  const itemTypeUpper = String(product.itemType || '').toUpperCase();
  const idUpper = String(product.id || '').toUpperCase();
  if (itemTypeUpper === 'RETAIL' || idUpper.startsWith('PRD-BRB-')) {
    return 'PRODUK_RETAIL_SALON';
  }
  if (product.isPackage || String(product.name || '').toLowerCase().includes('paket')) {
    return 'PAKET_BUNDLING';
  }
  return 'LAYANAN_SATUAN';
}

export function getServiceFormatMeta(product: Partial<Product>): ServiceFormatOption {
  const fmt = resolveServiceItemFormat(product);
  return (
    SERVICE_FORMAT_OPTIONS.find((opt) => opt.value === fmt) || SERVICE_FORMAT_OPTIONS[0]
  );
}

/**
 * Katalog Bawaan (Seed) Sektor SERVICE — Sub-sektor Barbershop & Salon
 * Mendukung format Layanan Satuan, Paket Bundling, Layanan Tambahan (Add-on), dan Produk Retail Salon
 * SKU Jasa: SVC-BRB-001 s/d SVC-BRB-006 (itemType: 'SERVICE')
 * SKU Produk Retail Salon: PRD-BRB-007 (itemType: 'RETAIL', berstok fisik, non-komisi default)
 */
export const BARBERSHOP_SERVICE_SEEDS: Product[] = [
  {
    id: 'SVC-BRB-001',
    sku: 'SVC-BRB-001',
    barcode: 'SVC-BRB-001',
    serviceCode: 'SVC-BRB-001',
    name: 'Cukur Reguler / Standar',
    category: 'Barbershop & Haircut',
    brand: 'Barbershop Signature',
    unit: 'Sesi',
    cost_price: 2000,
    costPrice: 2000,
    hpp: 2000,
    sell_price: 30000,
    sellingPrice: 30000,
    price: 30000,
    price_retail: 30000,
    stock: 999,
    minStock: 0,
    min_stock: 0,
    status: 'Active',
    itemType: 'SERVICE',
    serviceFormat: 'LAYANAN_SATUAN',
    isPackage: false,
    businessModel: 'salon',
    serviceDuration: '25 mnt',
    staffCommission: 20,
    description: 'Potong rambut pria reguler / standar presisi oleh kapster profesional.',
  },
  {
    id: 'SVC-BRB-002',
    sku: 'SVC-BRB-002',
    barcode: 'SVC-BRB-002',
    serviceCode: 'SVC-BRB-002',
    name: 'Paket Lengkap (Cukur + Cuci Rambut + Tonic)',
    category: 'Paket Bundling Barbershop',
    brand: 'Barbershop Signature',
    unit: 'Paket',
    cost_price: 3500,
    costPrice: 3500,
    hpp: 3500,
    sell_price: 35000,
    sellingPrice: 35000,
    price: 35000,
    price_retail: 35000,
    stock: 999,
    minStock: 0,
    min_stock: 0,
    status: 'Active',
    itemType: 'SERVICE',
    serviceFormat: 'PAKET_BUNDLING',
    isPackage: true,
    packageDetails: 'Cukur Reguler + Cuci Rambut + Tonic',
    businessModel: 'salon',
    serviceDuration: '35 mnt',
    staffCommission: 20,
    description: 'Paket hemat bundling: Cukur Reguler + Cuci Rambut menyegarkan + Scalp Tonic.',
  },
  {
    id: 'SVC-BRB-003',
    sku: 'SVC-BRB-003',
    barcode: 'SVC-BRB-003',
    serviceCode: 'SVC-BRB-003',
    name: 'Cukur Anak & Pelajar',
    category: 'Barbershop & Haircut',
    brand: 'Barbershop Signature',
    unit: 'Sesi',
    cost_price: 1500,
    costPrice: 1500,
    hpp: 1500,
    sell_price: 25000,
    sellingPrice: 25000,
    price: 25000,
    price_retail: 25000,
    stock: 999,
    minStock: 0,
    min_stock: 0,
    status: 'Active',
    itemType: 'SERVICE',
    serviceFormat: 'LAYANAN_SATUAN',
    isPackage: false,
    businessModel: 'salon',
    serviceDuration: '20 mnt',
    staffCommission: 20,
    description: 'Potong rambut rapi khusus anak-anak & pelajar.',
  },
  {
    id: 'SVC-BRB-004',
    sku: 'SVC-BRB-004',
    barcode: 'SVC-BRB-004',
    serviceCode: 'SVC-BRB-004',
    name: 'Cuci Rambut & Scalp Tonic',
    category: 'Layanan Tambahan (Add-on)',
    brand: 'Salon Care',
    unit: 'Sesi',
    cost_price: 2000,
    costPrice: 2000,
    hpp: 2000,
    sell_price: 10000,
    sellingPrice: 10000,
    price: 10000,
    price_retail: 10000,
    stock: 999,
    minStock: 0,
    min_stock: 0,
    status: 'Active',
    itemType: 'SERVICE',
    serviceFormat: 'LAYANAN_ADDON',
    isPackage: false,
    businessModel: 'salon',
    serviceDuration: '10 mnt',
    staffCommission: 20,
    description: 'Keramas menyegarkan + pijat ringan kepala dan hair tonic kulit kepala.',
  },
  {
    id: 'SVC-BRB-005',
    sku: 'SVC-BRB-005',
    barcode: 'SVC-BRB-005',
    serviceCode: 'SVC-BRB-005',
    name: 'Rapikan Kumis & Jenggot (Beard Trim)',
    category: 'Layanan Tambahan (Add-on)',
    brand: 'Barbershop Signature',
    unit: 'Sesi',
    cost_price: 1500,
    costPrice: 1500,
    hpp: 1500,
    sell_price: 15000,
    sellingPrice: 15000,
    price: 15000,
    price_retail: 15000,
    stock: 999,
    minStock: 0,
    min_stock: 0,
    status: 'Active',
    itemType: 'SERVICE',
    serviceFormat: 'LAYANAN_ADDON',
    isPackage: false,
    businessModel: 'salon',
    serviceDuration: '15 mnt',
    staffCommission: 20,
    description: 'Rapikan kumis & jenggot presisi dengan trimmer & pisau cukur higienis.',
  },
  {
    id: 'SVC-BRB-006',
    sku: 'SVC-BRB-006',
    barcode: 'SVC-BRB-006',
    serviceCode: 'SVC-BRB-006',
    name: 'Creambath / Hair Spa',
    category: 'Hair Care & Treatment',
    brand: 'Salon Care',
    unit: 'Sesi',
    cost_price: 12000,
    costPrice: 12000,
    hpp: 12000,
    sell_price: 65000,
    sellingPrice: 65000,
    price: 65000,
    price_retail: 65000,
    stock: 999,
    minStock: 0,
    min_stock: 0,
    status: 'Active',
    itemType: 'SERVICE',
    serviceFormat: 'LAYANAN_SATUAN',
    isPackage: false,
    businessModel: 'salon',
    serviceDuration: '45 mnt',
    staffCommission: 20,
    description: 'Perawatan nutrisi rambut creambath / hair spa dengan steam hangat & pijat relaksasi.',
  },
  {
    id: 'PRD-BRB-007',
    sku: 'PRD-BRB-007',
    barcode: 'PRD-BRB-007',
    name: 'Clay Pomade Waterbased 100gr',
    category: 'Produk Retail Salon',
    brand: 'Gentleman Craft',
    unit: 'Pcs',
    cost_price: 42000,
    costPrice: 42000,
    hpp: 42000,
    sell_price: 85000,
    sellingPrice: 85000,
    price: 85000,
    price_retail: 85000,
    stock: 24,
    minStock: 5,
    min_stock: 5,
    status: 'Active',
    itemType: 'RETAIL',
    serviceFormat: 'PRODUK_RETAIL_SALON',
    isPackage: false,
    businessModel: 'salon',
    staffCommission: 0,
    description: 'Produk retail salon berstok fisik — waterbased matte clay hold tinggi mudah dibilas.',
  },
];

const LEGACY_V1_BARBERSHOP_NAMES = new Set<string>([
  'gentleman haircut & styling',
  'kids & student haircut',
  'beard trim & hot towel shave',
  'hair wash, massage & scalp tonic',
  'premium creambath & hair spa',
  'full hair coloring / bleaching',
]);

/**
 * Sinkronisasi otomatis seed Barbershop lama (v1) di localStorage ke format terbaru (Satuan & Paket Bundling)
 * tanpa menimpa layanan kustom buatan pemilik usaha.
 */
export function upgradeLegacyBarbershopSeed(existing: Product): Product {
  const idUpper = String(existing.id || '').toUpperCase();
  const matchedSeed = BARBERSHOP_SERVICE_SEEDS.find(
    (s) => String(s.id).toUpperCase() === idUpper
  );
  if (!matchedSeed) return existing;

  const currentNameLower = String(existing.name || '').trim().toLowerCase();
  if (LEGACY_V1_BARBERSHOP_NAMES.has(currentNameLower)) {
    return {
      ...matchedSeed,
      status: existing.status || matchedSeed.status,
    };
  }

  // Untuk PRD-BRB-007 atau item yang belum punya serviceFormat, lengkapi field baru tanpa mengubah harga/stok user
  if (!existing.serviceFormat) {
    return {
      ...existing,
      serviceFormat: matchedSeed.serviceFormat,
      isPackage: existing.isPackage ?? matchedSeed.isPackage,
      packageDetails: existing.packageDetails ?? matchedSeed.packageDetails,
    };
  }

  return existing;
}

export function generateNextServiceSku(
  existingProducts: Product[],
  prefix: 'SVC-BRB' | 'PRD-BRB' | 'SVC-LND'
): string {
  const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  let maxNum = 0;
  for (const p of existingProducts) {
    for (const candidate of [p.id, p.sku, p.serviceCode]) {
      const m = String(candidate || '').trim().match(regex);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n) && n > maxNum) maxNum = n;
      }
    }
  }
  return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * Katalog Bawaan (Seed) Sektor SERVICE — Sub-sektor Laundry
 * SKU Jasa Laundry: SVC-LND-001 s/d SVC-LND-005
 */
export const LAUNDRY_SERVICE_SEEDS: Product[] = [
  {
    id: 'SVC-LND-001',
    sku: 'SVC-LND-001',
    barcode: 'SVC-LND-001',
    serviceCode: 'SVC-LND-001',
    name: 'Cuci Kering Lipat Reguler / Kg',
    category: 'Laundry Kiloan',
    brand: 'Laundry Express',
    unit: 'kg',
    cost_price: 1500,
    costPrice: 1500,
    hpp: 1500,
    sell_price: 7000,
    sellingPrice: 7000,
    price: 7000,
    price_retail: 7000,
    stock: 999,
    minStock: 0,
    min_stock: 0,
    status: 'Active',
    itemType: 'SERVICE',
    businessModel: 'laundry',
    laundryUnitType: 'KILOAN',
    supportDecimal: true,
    isWeighable: true,
    minOrderWeightKg: 2,
    slaDuration: 'Reguler 48 Jam',
    slaHours: 48,
    serviceDuration: '48 Jam',
    description: 'Cuci bersih, pengeringan mesin, dan lipat rapi per kilogram (Reguler 48 Jam).',
  },
  {
    id: 'SVC-LND-002',
    sku: 'SVC-LND-002',
    barcode: 'SVC-LND-002',
    serviceCode: 'SVC-LND-002',
    name: 'Cuci Setrika Wangi Reguler / Kg',
    category: 'Laundry Kiloan',
    brand: 'Laundry Express',
    unit: 'kg',
    cost_price: 2000,
    costPrice: 2000,
    hpp: 2000,
    sell_price: 9000,
    sellingPrice: 9000,
    price: 9000,
    price_retail: 9000,
    stock: 999,
    minStock: 0,
    min_stock: 0,
    status: 'Active',
    itemType: 'SERVICE',
    businessModel: 'laundry',
    laundryUnitType: 'KILOAN',
    supportDecimal: true,
    isWeighable: true,
    minOrderWeightKg: 2,
    slaDuration: 'Reguler 48 Jam',
    slaHours: 48,
    serviceDuration: '48 Jam',
    description: 'Cuci, setrika uap, dan parfum laundry premium per kilogram (Reguler 48 Jam).',
  },
  {
    id: 'SVC-LND-003',
    sku: 'SVC-LND-003',
    barcode: 'SVC-LND-003',
    serviceCode: 'SVC-LND-003',
    name: 'Cuci Setrika Express 6 Jam / Kg',
    category: 'Laundry Express',
    brand: 'Laundry Express',
    unit: 'kg',
    cost_price: 2800,
    costPrice: 2800,
    hpp: 2800,
    sell_price: 15000,
    sellingPrice: 15000,
    price: 15000,
    price_retail: 15000,
    stock: 999,
    minStock: 0,
    min_stock: 0,
    status: 'Active',
    itemType: 'SERVICE',
    businessModel: 'laundry',
    laundryUnitType: 'KILOAN',
    supportDecimal: true,
    isWeighable: true,
    minOrderWeightKg: 2,
    slaDuration: 'Express 6 Jam',
    slaHours: 6,
    serviceDuration: '6 Jam',
    description: 'Layanan prioritas cuci + setrika selesai dalam 6 jam per kilogram.',
  },
  {
    id: 'SVC-LND-004',
    sku: 'SVC-LND-004',
    barcode: 'SVC-LND-004',
    serviceCode: 'SVC-LND-004',
    name: 'Dry Clean Jas / Kebaya / Gaun',
    category: 'Dry Clean & Satuan',
    brand: 'Laundry Care',
    unit: 'pcs',
    cost_price: 6500,
    costPrice: 6500,
    hpp: 6500,
    sell_price: 35000,
    sellingPrice: 35000,
    price: 35000,
    price_retail: 35000,
    stock: 999,
    minStock: 0,
    min_stock: 0,
    status: 'Active',
    itemType: 'SERVICE',
    businessModel: 'laundry',
    laundryUnitType: 'SATUAN',
    slaDuration: 'Reguler 48 Jam',
    slaHours: 48,
    serviceDuration: '48 Jam',
    description: 'Perawatan khusus dry cleaning untuk jas, kebaya, dan gaun pesta per potong.',
  },
  {
    id: 'SVC-LND-005',
    sku: 'SVC-LND-005',
    barcode: 'SVC-LND-005',
    serviceCode: 'SVC-LND-005',
    name: 'Cuci Bedcover Besar / Selimut Tebal',
    category: 'Laundry Satuan & Bedcover',
    brand: 'Laundry Care',
    unit: 'pcs',
    cost_price: 5500,
    costPrice: 5500,
    hpp: 5500,
    sell_price: 30000,
    sellingPrice: 30000,
    price: 30000,
    price_retail: 30000,
    stock: 999,
    minStock: 0,
    min_stock: 0,
    status: 'Active',
    itemType: 'SERVICE',
    businessModel: 'laundry',
    laundryUnitType: 'SATUAN',
    slaDuration: 'Reguler 48 Jam',
    slaHours: 48,
    serviceDuration: '48 Jam',
    description: 'Cuci sanitasi & pengeringan higienis untuk bedcover ukuran King/Queen atau selimut tebal.',
  },
];

export const ALL_SERVICE_SECTOR_SEEDS: Product[] = [
  ...BARBERSHOP_SERVICE_SEEDS,
  ...LAUNDRY_SERVICE_SEEDS,
];

/**
 * Master Stylist / Kapster / Petugas Layanan (Seed Default)
 */
export const DEFAULT_SERVICE_STYLISTS: ServiceStylistMaster[] = [
  {
    id: 'STL-001',
    name: 'Andi Barber',
    role: 'Senior Barber',
    specialty: 'Gentleman Haircut, Fade & Hot Towel Shave',
    commissionRate: 20,
    retailCommissionRate: 0,
    isActive: true,
    phone: '0812-4100-2101',
    notes: 'Kapster senior spesialis fade & grooming',
  },
  {
    id: 'STL-002',
    name: 'Reza Stylist',
    role: 'Junior Barber',
    specialty: 'Classic Haircut, Kids Cut & Hair Wash',
    commissionRate: 15,
    retailCommissionRate: 0,
    isActive: true,
    phone: '0812-4100-2102',
    notes: 'Stylist junior spesialis potongan klasik & pelajar',
  },
  {
    id: 'STL-003',
    name: 'Dina Capster',
    role: 'Hair Spa & Coloring',
    specialty: 'Creambath, Hair Spa, Coloring & Bleaching',
    commissionRate: 20,
    retailCommissionRate: 0,
    isActive: true,
    phone: '0812-4100-2103',
    notes: 'Capster spesialis treatment rambut & coloring',
  },
];

export function generateNextStylistId(existing: ServiceStylistMaster[]): string {
  let maxNum = 0;
  for (const s of existing) {
    const match = String(s.id || '').match(/STL-(\d+)/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!Number.isNaN(n) && n > maxNum) maxNum = n;
    }
  }
  return `STL-${String(maxNum + 1).padStart(3, '0')}`;
}

export function isBarbershopSalonProduct(p: Product): boolean {
  const idUpper = String(p.id || '').toUpperCase();
  const skuUpper = String(p.sku || '').toUpperCase();
  const bm = String(p.businessModel || '').toLowerCase();
  const cat = String(p.category || '').toLowerCase();
  return (
    idUpper.startsWith('SVC-BRB-') ||
    idUpper.startsWith('PRD-BRB-') ||
    idUpper.startsWith('SLN-') ||
    skuUpper.startsWith('SVC-BRB-') ||
    skuUpper.startsWith('PRD-BRB-') ||
    bm === 'salon' ||
    cat.includes('barber') ||
    cat.includes('salon') ||
    cat.includes('grooming') ||
    cat.includes('hair care') ||
    cat.includes('coloring')
  );
}

export function isLaundryCatalogProduct(p: Product): boolean {
  const idUpper = String(p.id || '').toUpperCase();
  const skuUpper = String(p.sku || '').toUpperCase();
  const bm = String(p.businessModel || '').toLowerCase();
  const cat = String(p.category || '').toLowerCase();
  return (
    idUpper.startsWith('SVC-LND-') ||
    idUpper.startsWith('LND-') ||
    skuUpper.startsWith('SVC-LND-') ||
    bm === 'laundry' ||
    Boolean(p.laundryUnitType) ||
    cat.includes('laundry') ||
    cat.includes('dry clean') ||
    cat.includes('binatu')
  );
}

export function isServiceProductActive(p: Product): boolean {
  const st = String(p.status || 'Active').trim().toUpperCase();
  return st !== 'INACTIVE' && st !== 'NONAKTIF' && st !== 'DISCONTINUED';
}
