import { BusinessDomainConfig, CartItem, Product, PromotionProgram } from '../types';

export type PromoSourceType = 'SEASONAL' | 'FEFO_EXP' | 'SUPPLIER_TPR' | 'STORE_BND' | 'STORE_DISC';
export type PromoMechanic = 'STANDARD' | 'PWP_TEBUS_MURAH' | 'BUY_X_GET_Y' | 'BUNDLE';
export type PromoStatus = 'DRAFT' | 'AKTIF' | 'BERAKHIR';
export type DiscountType = 'PERCENT' | 'NOMINAL';
export type TargetType = 'CATEGORY' | 'SKU';

export interface PromoComponentSku {
  skuId: string;
  skuName: string;
  qty: number;
  unitCost: number;
}

export interface PromoCampaign {
  id: string;
  code: string; // e.g. 200-BND-... or 200-EXP-... or PROMO-SEA-...
  name: string;
  sourceType: PromoSourceType;
  mechanic?: PromoMechanic; // STANDARD (default), PWP_TEBUS_MURAH, BUY_X_GET_Y
  startDate: string;
  endDate: string;
  targetType: TargetType;
  targetValue: string; // Category code (PC.2 - PC.471) or SKU ID / Name
  discountType: DiscountType;
  discountValue: number; // e.g. 15 (%) or 10000 (Rp)
  status: PromoStatus;
  supplierName?: string;
  rebateClaimValue?: number;
  componentSkus?: PromoComponentSku[];
  generatedBarcode?: string;
  // Aturan Promo Swalayan
  pwpMinCartSubtotal?: number; // Syarat minimal subtotal keranjang untuk Tebus Murah
  pwpSpecialPrice?: number; // Harga tebus spesial per unit
  buyQty?: number; // Beli X unit (BUY_X_GET_Y)
  getFreeQty?: number; // Gratis Y unit (BUY_X_GET_Y)
  maxQtyPerReceipt?: number | null; // null/undefined = Unlimited (otomatis null bila sourceType === 'FEFO_EXP')
  domainFamily?: 'RETAIL_GENERAL' | 'FNB_CULINARY' | 'BUILDING_BULK' | 'SPECIALTY_SERVICE';
  promoTag?: string; // e.g. 'VOLUME_BORONGAN'
  createdAt: string;
}

export interface ResolvedPromoResult {
  campaignId: string;
  campaignCode: string;
  promoName: string;
  sourceType: PromoSourceType;
  mechanic: PromoMechanic;
  badgeLabel: string;
  originalUnitPrice: number;
  finalUnitPrice: number;
  savingsPerUnit: number;
  totalLineSavings: number;
  lineSubtotal: number;
  promoQtyCapped: number;
  maxQtyPerReceipt: number | null;
  isUnlimitedFefo: boolean;
  freeBonusQty: number;
  freeBonusLabel?: string;
  pwpMinCartSubtotal?: number;
  pwpQualified?: boolean;
  promoHint?: string;
  supplierName?: string;
  overriddenPromosCount: number;
}

export interface ResolvedPackageScanResult {
  campaign: PromoCampaign;
  product: Product;
  promo: ResolvedPromoResult;
  componentSkus: PromoComponentSku[];
  insufficientStockComponents: string[];
}

export interface PwpOfferStatus {
  campaign: PromoCampaign;
  product: Product;
  regularPrice: number;
  specialPrice: number;
  minCartSubtotal: number;
  currentEligibleSubtotal: number;
  shortfallAmount: number;
  isQualified: boolean;
  maxQtyPerReceipt: number | null;
  alreadyInCartQty: number;
}

export const PROMO_STORAGE_KEY = 'jacs_promo_campaigns';

/**
 * Resolusi prioritas anti-tumpuk resmi:
 * FEFO_EXP (4) > SUPPLIER_TPR (3) > SEASONAL (2) > STORE_DISC / STORE_BND (1)
 */
export const PROMO_PRIORITY: Record<PromoSourceType, number> = {
  FEFO_EXP: 4,
  SUPPLIER_TPR: 3,
  SEASONAL: 2,
  STORE_DISC: 1,
  STORE_BND: 1,
};

/**
 * Normalisasi batas maxQtyPerReceipt:
 * Wajib null (Unlimited) jika sumbernya FEFO_EXP agar stok mendekati kadaluarsa cepat habis.
 */
export function normalizeMaxQtyPerReceipt(
  sourceType: PromoSourceType,
  rawMax?: number | null
): number | null {
  if (sourceType === 'FEFO_EXP') return null;
  if (rawMax === undefined || rawMax === null || Number(rawMax) <= 0 || Number.isNaN(Number(rawMax))) {
    return null;
  }
  return Math.floor(Number(rawMax));
}

export function getPromoBadgeLabel(
  sourceType: PromoSourceType,
  mechanic: PromoMechanic = 'STANDARD',
  buyQty?: number,
  getFreeQty?: number
): string {
  const baseTag =
    sourceType === 'FEFO_EXP'
      ? 'FEFO EXP'
      : sourceType === 'SUPPLIER_TPR'
      ? 'SUPPLIER'
      : sourceType === 'SEASONAL'
      ? 'SEASONAL'
      : sourceType === 'STORE_BND'
      ? 'BUNDLING'
      : 'STORE DISC';

  if (mechanic === 'PWP_TEBUS_MURAH') {
    return sourceType === 'FEFO_EXP' ? '[FEFO EXP • TEBUS MURAH]' : '[PWP TEBUS MURAH]';
  }
  if (mechanic === 'BUY_X_GET_Y') {
    const x = Math.max(1, buyQty || 2);
    const y = Math.max(1, getFreeQty || 1);
    return sourceType === 'FEFO_EXP'
      ? `[FEFO EXP • BELI ${x} GRATIS ${y}]`
      : `[BELI ${x} GRATIS ${y}]`;
  }
  return `[${baseTag}]`;
}

export const DEFAULT_PROMO_CAMPAIGNS: PromoCampaign[] = [
  {
    id: 'promo-1',
    code: 'PROMO-RAMADHAN-01',
    name: 'Festival Berkah Musiman & Sembako',
    sourceType: 'SEASONAL',
    mechanic: 'STANDARD',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetType: 'CATEGORY',
    targetValue: 'PC.2 (Powder Detergent) & PC.5 (Cooking Oil)',
    discountType: 'PERCENT',
    discountValue: 12,
    maxQtyPerReceipt: 3,
    domainFamily: 'RETAIL_GENERAL',
    status: 'AKTIF',
    createdAt: '2026-02-25',
  },
  {
    id: 'promo-2',
    code: '200-EXP-20260315-9921',
    name: 'Clearance Bertingkat FEFO H-14 Indomie',
    sourceType: 'FEFO_EXP',
    mechanic: 'STANDARD',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetType: 'SKU',
    targetValue: 'SKU-004 (Indomie Goreng Spesial Pack 5x85 Gr)',
    discountType: 'PERCENT',
    discountValue: 25,
    maxQtyPerReceipt: null, // Otomatis Unlimited untuk FEFO_EXP
    domainFamily: 'RETAIL_GENERAL',
    status: 'AKTIF',
    generatedBarcode: '200-EXP-20260315-9921',
    componentSkus: [
      { skuId: 'SKU-004', skuName: 'Indomie Goreng Spesial Pack 5x85 Gr', qty: 1, unitCost: 13000 },
    ],
    createdAt: '2026-03-01',
  },
  {
    id: 'promo-3',
    code: 'TPR-VEND-NESTLE-04',
    name: 'Rebate & TPR PT Nestle Indonesia (Susu & Nutrisi)',
    sourceType: 'SUPPLIER_TPR',
    mechanic: 'STANDARD',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetType: 'CATEGORY',
    targetValue: 'PC.3 (Powder Milk) & PC.14 (Susu & Nutrisi)',
    discountType: 'PERCENT',
    discountValue: 10,
    maxQtyPerReceipt: 5,
    domainFamily: 'RETAIL_GENERAL',
    status: 'AKTIF',
    supplierName: 'PT Nestle Indonesia',
    rebateClaimValue: 15000000,
    createdAt: '2026-01-05',
  },
  {
    id: 'promo-4',
    code: '200-BND-20260312-4410',
    name: 'Bundling Super Hemat Sembako Dapur',
    sourceType: 'STORE_BND',
    mechanic: 'STANDARD',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetType: 'SKU',
    targetValue: 'Paket Bundling Sembako 2in1',
    discountType: 'NOMINAL',
    discountValue: 15000,
    maxQtyPerReceipt: 2,
    domainFamily: 'RETAIL_GENERAL',
    status: 'AKTIF',
    generatedBarcode: '200-BND-20260312-4410',
    componentSkus: [
      { skuId: 'SKU-005', skuName: 'Beras Ramos Kepala Super Karung 5 Kg', qty: 1, unitCost: 62000 },
      { skuId: 'SKU-003', skuName: 'Bimoli Minyak Goreng Botol 2 Lt', qty: 1, unitCost: 31000 },
    ],
    createdAt: '2026-03-10',
  },
  {
    id: 'promo-5',
    code: 'PWP-TEBUS-BIMOLI-2L',
    name: 'Tebus Murah Bimoli 2L (Belanja Min. Rp 75.000)',
    sourceType: 'SEASONAL',
    mechanic: 'PWP_TEBUS_MURAH',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetType: 'SKU',
    targetValue: 'SKU-003 (Bimoli Minyak Goreng Botol 2 Lt)',
    discountType: 'NOMINAL',
    discountValue: 5700,
    pwpMinCartSubtotal: 75000,
    pwpSpecialPrice: 31500,
    maxQtyPerReceipt: 1,
    domainFamily: 'RETAIL_GENERAL',
    status: 'AKTIF',
    createdAt: '2026-03-11',
  },
  {
    id: 'promo-6',
    code: 'BXGY-KAO-2G1',
    name: 'Beli 2 Gratis 1 Kao Attack Powder 6x40 Gr',
    sourceType: 'SUPPLIER_TPR',
    mechanic: 'BUY_X_GET_Y',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetType: 'SKU',
    targetValue: 'SKU-001 (Kao Attack Clean Maximizer Powder Sachet 6x40 Gr)',
    discountType: 'PERCENT',
    discountValue: 0,
    buyQty: 2,
    getFreeQty: 1,
    maxQtyPerReceipt: 2,
    supplierName: 'PT Kao Indonesia',
    rebateClaimValue: 6500000,
    domainFamily: 'RETAIL_GENERAL',
    status: 'AKTIF',
    createdAt: '2026-03-12',
  },
];

export const DEFAULT_BUILDING_PROMO_CAMPAIGNS: PromoCampaign[] = [
  {
    id: 'promo-mat-1',
    code: 'TPR-SMN-TONASA-01',
    name: 'Rebate Semen Tonasa / Tiga Roda (Minimal 25 Sak)',
    sourceType: 'SUPPLIER_TPR',
    mechanic: 'STANDARD',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetType: 'SKU',
    targetValue: 'MAT-SMN-50KG (Semen Portland 50kg SNI)',
    discountType: 'NOMINAL',
    discountValue: 5000,
    maxQtyPerReceipt: null,
    supplierName: 'PT Semen Tonasa / Indocement Tiga Roda',
    rebateClaimValue: 18500000,
    domainFamily: 'BUILDING_BULK',
    status: 'AKTIF',
    componentSkus: [
      { skuId: 'MAT-SMN-50KG', skuName: 'Semen Portland 50kg SNI', qty: 1, unitCost: 56000 },
    ],
    createdAt: '2026-03-01',
  },
  {
    id: 'promo-mat-2',
    code: '200-BND-MAT-CAT01',
    name: 'Bundling Paket Pengecatan Rumah (Cat Tembok + Perkakas)',
    sourceType: 'STORE_BND',
    mechanic: 'STANDARD',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetType: 'SKU',
    targetValue: 'Paket Bundling Pengecatan Rumah 2in1',
    discountType: 'NOMINAL',
    discountValue: 35000,
    maxQtyPerReceipt: 10,
    generatedBarcode: '200-BND-MAT-CAT01',
    domainFamily: 'BUILDING_BULK',
    status: 'AKTIF',
    componentSkus: [
      { skuId: 'MAT-CAT-INT5', skuName: 'Cat Tembok Interior 5kg Anti-Jamur', qty: 2, unitCost: 94000 },
      { skuId: 'MAT-TOL-KPS', skuName: 'Kunci Pas Set 8-24mm Chrome Vanadium', qty: 1, unitCost: 105000 },
    ],
    createdAt: '2026-03-05',
  },
  {
    id: 'promo-mat-3',
    code: 'VOL-BESI-BAJA-03',
    name: 'Diskon Volume Besi Beton & Baja Ringan Kontraktor',
    sourceType: 'STORE_DISC',
    mechanic: 'STANDARD',
    promoTag: 'VOLUME_BORONGAN',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetType: 'SKU',
    targetValue: 'MAT-BSI-10MM (Besi Beton Polos 10mm SNI (12m))',
    discountType: 'PERCENT',
    discountValue: 8,
    maxQtyPerReceipt: null,
    domainFamily: 'BUILDING_BULK',
    status: 'AKTIF',
    componentSkus: [
      { skuId: 'MAT-BSI-10MM', skuName: 'Besi Beton Polos 10mm SNI (12m)', qty: 1, unitCost: 72000 },
    ],
    createdAt: '2026-03-08',
  },
  {
    id: 'promo-mat-4',
    code: 'PWP-TEBUS-PERKAKAS',
    name: 'Tebus Murah Perkakas Tukang (Belanja Material Min. Rp 1.500.000)',
    sourceType: 'SEASONAL',
    mechanic: 'PWP_TEBUS_MURAH',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetType: 'SKU',
    targetValue: 'MAT-TOL-KPS (Kunci Pas Set 8-24mm Chrome Vanadium)',
    discountType: 'NOMINAL',
    discountValue: 55000,
    pwpMinCartSubtotal: 1500000,
    pwpSpecialPrice: 110000,
    maxQtyPerReceipt: 2,
    domainFamily: 'BUILDING_BULK',
    status: 'AKTIF',
    componentSkus: [
      { skuId: 'MAT-TOL-KPS', skuName: 'Kunci Pas Set 8-24mm Chrome Vanadium', qty: 1, unitCost: 105000 },
    ],
    createdAt: '2026-03-10',
  },
  {
    id: 'promo-mat-5',
    code: 'PROMO-RENOV-05',
    name: 'Paket Renovasi & Bangun Rumah (Pipa PVC & Kayu Meranti)',
    sourceType: 'SEASONAL',
    mechanic: 'STANDARD',
    promoTag: 'VOLUME_BORONGAN',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetType: 'CATEGORY',
    targetValue: 'Perpipaan & Kayu',
    discountType: 'PERCENT',
    discountValue: 10,
    maxQtyPerReceipt: null,
    domainFamily: 'BUILDING_BULK',
    status: 'AKTIF',
    createdAt: '2026-03-12',
  },
];

export const DEFAULT_FNB_PROMO_CAMPAIGNS: PromoCampaign[] = [
  {
    id: 'promo-fnb-1',
    code: 'BND-FNB-LUNCH-01',
    name: 'Paket Makan Siang Puas (Nasi Goreng Wagyu + Kopi Susu Gula Aren)',
    sourceType: 'STORE_BND',
    mechanic: 'BUNDLE',
    promoTag: 'PAKET_HEMAT',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetType: 'CATEGORY',
    targetValue: 'PC.200 (Paket Bundling Menu F&B)',
    discountType: 'NOMINAL',
    discountValue: 11000,
    maxQtyPerReceipt: 4,
    domainFamily: 'FNB_CULINARY',
    status: 'AKTIF',
    componentSkus: [
      { skuId: 'FNB-MAK-NASGOR', skuName: 'Nasi Goreng Spesial Wagyu', qty: 1, unitCost: 13300 },
      { skuId: 'FNB-KOP-AREN', skuName: 'Kopi Susu Gula Aren Signature', qty: 1, unitCost: 7700 },
    ],
    createdAt: '2026-03-01',
  },
  {
    id: 'promo-fnb-2',
    code: 'BXGY-FNB-CROIS-2G1',
    name: 'Beli 2 Gratis 1 Butter Croissant Artisan (Teman Ngopi Pagi)',
    sourceType: 'STORE_DISC',
    mechanic: 'BUY_X_GET_Y',
    promoTag: 'BELI_X_GRATIS_Y',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetType: 'SKU',
    targetValue: 'FNB-PAS-CROIS (Butter Croissant Artisan)',
    discountType: 'PERCENT',
    discountValue: 100,
    buyQty: 2,
    getFreeQty: 1,
    maxQtyPerReceipt: 2,
    domainFamily: 'FNB_CULINARY',
    status: 'AKTIF',
    componentSkus: [
      { skuId: 'FNB-PAS-CROIS', skuName: 'Butter Croissant Artisan', qty: 1, unitCost: 7700 },
    ],
    createdAt: '2026-03-02',
  },
  {
    id: 'promo-fnb-3',
    code: 'PWP-FNB-MATCHA-15K',
    name: 'Tebus Murah Matcha Latte Uji Kyoto Rp 15.000 (Min. Pesanan Rp 65.000)',
    sourceType: 'STORE_DISC',
    mechanic: 'PWP_TEBUS_MURAH',
    promoTag: 'TEBUS_MURAH',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetType: 'SKU',
    targetValue: 'FNB-NON-MATCHA (Matcha Latte Uji Kyoto)',
    discountType: 'NOMINAL',
    discountValue: 13000,
    pwpMinCartSubtotal: 65000,
    pwpSpecialPrice: 15000,
    maxQtyPerReceipt: 2,
    domainFamily: 'FNB_CULINARY',
    status: 'AKTIF',
    componentSkus: [
      { skuId: 'FNB-NON-MATCHA', skuName: 'Matcha Latte Uji Kyoto', qty: 1, unitCost: 9800 },
    ],
    createdAt: '2026-03-04',
  },
  {
    id: 'promo-fnb-4',
    code: 'PROMO-FNB-HEMAT-15',
    name: 'Promo Jam Makan Siang — Diskon 15% Semua Menu Makanan Utama',
    sourceType: 'SEASONAL',
    mechanic: 'STANDARD',
    promoTag: 'REGULER',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetType: 'CATEGORY',
    targetValue: 'Makanan Utama',
    discountType: 'PERCENT',
    discountValue: 15,
    maxQtyPerReceipt: 4,
    domainFamily: 'FNB_CULINARY',
    status: 'AKTIF',
    createdAt: '2026-03-06',
  },
  {
    id: 'promo-fnb-5',
    code: 'TPR-FNB-KOPI-ROAST',
    name: 'Potongan Spesial Kopi Susu Gula Aren (Subsidi Roastery Nusantara)',
    sourceType: 'SUPPLIER_TPR',
    mechanic: 'STANDARD',
    promoTag: 'REGULER',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetType: 'SKU',
    targetValue: 'FNB-KOP-AREN (Kopi Susu Gula Aren Signature)',
    discountType: 'NOMINAL',
    discountValue: 4000,
    supplierName: 'PT Kopi Nusantara Roastery',
    maxQtyPerReceipt: 4,
    domainFamily: 'FNB_CULINARY',
    status: 'AKTIF',
    componentSkus: [
      { skuId: 'FNB-KOP-AREN', skuName: 'Kopi Susu Gula Aren Signature', qty: 1, unitCost: 7700 },
    ],
    createdAt: '2026-03-08',
  },
];

export function isBuildingMaterialCampaign(camp: PromoCampaign): boolean {
  if (!camp) return false;
  if (camp.sourceType === 'FEFO_EXP') return false;
  if (camp.domainFamily === 'BUILDING_BULK') return true;
  if (camp.domainFamily === 'RETAIL_GENERAL' || camp.domainFamily === 'FNB_CULINARY' || camp.domainFamily === 'SPECIALTY_SERVICE') {
    return false;
  }
  const idLower = String(camp.id || '').toLowerCase();
  if (idLower.startsWith('promo-mat-')) return true;
  if (idLower.startsWith('promo-fnb-')) return false;
  if (['promo-1', 'promo-2', 'promo-3', 'promo-4', 'promo-5', 'promo-6'].includes(idLower)) return false;

  const haystack = `${camp.code || ''} ${camp.name || ''} ${camp.targetValue || ''} ${camp.supplierName || ''}`.toLowerCase();
  if (
    haystack.includes('mat-') ||
    [
      'semen',
      'tonasa',
      'tiga roda',
      'gresik',
      'besi beton',
      'baja ringan',
      'perkakas',
      'renovasi',
      'bangun rumah',
      'borongan',
      'kontraktor',
      'pengecatan',
      'cat tembok',
      'dulux',
      'pipa pvc',
      'pasir',
      'batu split',
      'kayu meranti',
      'paku baja',
      'tekiro',
      'wavin',
      'rucika',
      'kunci pas',
      'chrome vanadium',
      'perkakas',
      'cat-int',
      'tol-kps',
      'mat-',
    ].some((kw) => haystack.includes(kw))
  ) {
    return true;
  }
  if (
    Array.isArray(camp.componentSkus) &&
    camp.componentSkus.some((s) => String(s.skuId || '').toUpperCase().startsWith('MAT-'))
  ) {
    return true;
  }
  return false;
}

export function isFnbCulinaryCampaign(camp: PromoCampaign): boolean {
  if (!camp) return false;
  if (camp.domainFamily === 'FNB_CULINARY') return true;
  if (camp.domainFamily === 'RETAIL_GENERAL' || camp.domainFamily === 'BUILDING_BULK' || camp.domainFamily === 'SPECIALTY_SERVICE') {
    return false;
  }
  const idLower = String(camp.id || '').toLowerCase();
  if (idLower.startsWith('promo-fnb-')) return true;
  if (idLower.startsWith('promo-mat-')) return false;
  if (['promo-1', 'promo-2', 'promo-3', 'promo-4', 'promo-5', 'promo-6'].includes(idLower)) return false;

  const haystack = `${camp.code || ''} ${camp.name || ''} ${camp.targetValue || ''} ${camp.supplierName || ''}`.toLowerCase();
  if (
    haystack.includes('fnb-') ||
    [
      'kopi susu',
      'gula aren',
      'americano',
      'cappuccino',
      'caffe latte',
      'caramel macchiato',
      'matcha latte',
      'red velvet',
      'taro latte',
      'lemon tea',
      'lychee yakult',
      'nasi goreng',
      'nasi padang',
      'rice bowl',
      'mie goreng',
      'spaghetti',
      'croissant',
      'pain au chocolat',
      'cinnamon roll',
      'cheesecake',
      'ayam bakar',
      'makanan utama',
      'pastry & bakery',
      'non-kopi',
      'paket makan siang',
      'roastery',
    ].some((kw) => haystack.includes(kw))
  ) {
    return true;
  }
  if (
    Array.isArray(camp.componentSkus) &&
    camp.componentSkus.some((s) => String(s.skuId || '').toUpperCase().startsWith('FNB-'))
  ) {
    return true;
  }
  return false;
}

export function isBuildingMaterialPromotionProgram(promo: PromotionProgram): boolean {
  if (!promo) return false;
  const haystack = `${promo.id || ''} ${promo.code || ''} ${promo.name || ''} ${promo.description || ''} ${promo.targetProductSku || ''}`.toLowerCase();
  return [
    'semen',
    'tonasa',
    'tiga roda',
    'gersik',
    'besi',
    'baja ringan',
    'renovasi',
    'bangun rumah',
    'borongan',
    'kontraktor',
    'pengecatan',
    'cat tembok',
    'dulux',
    'pipa pvc',
    'pasir',
    'batu split',
    'kayu meranti',
    'paku baja',
    'tekiro',
    'wavin',
    'rucika',
    'kunci pas',
    'chrome vanadium',
    'perkakas',
    'material bangunan',
    'depo bangunan',
    'mat-',
  ].some((kw) => haystack.includes(kw));
}

export function isFnbCulinaryPromotionProgram(promo: PromotionProgram): boolean {
  if (!promo) return false;
  const haystack = `${promo.id || ''} ${promo.code || ''} ${promo.name || ''} ${promo.description || ''} ${promo.targetProductSku || ''}`.toLowerCase();
  return [
    'fnb-',
    'kopi',
    'croissant',
    'matcha',
    'nasi goreng',
    'nasi padang',
    'makanan utama',
    'pastry',
    'resto',
    'kafe',
    'ayam bakar',
    'rice bowl',
  ].some((kw) => haystack.includes(kw));
}

export function filterPromoCampaignsByDomain(
  campaigns: PromoCampaign[],
  domainConfig?: BusinessDomainConfig | null,
  activeTerminalModelType?: string | null
): PromoCampaign[] {
  if (!Array.isArray(campaigns)) return [];
  if (!domainConfig) return campaigns;

  const isHybrid = Boolean(domainConfig.isHybridMultiUnit);
  const termType = (activeTerminalModelType || '').toLowerCase();

  if (!isHybrid) {
    if (domainConfig.mechanismFamily === 'BUILDING_BULK') {
      return campaigns.filter((c) => isBuildingMaterialCampaign(c));
    }
    if (domainConfig.mechanismFamily === 'FNB_CULINARY') {
      return campaigns.filter((c) => isFnbCulinaryCampaign(c));
    }
    // For RETAIL_GENERAL and other families when Hybrid Mode is OFF:
    // strictly exclude building material & F&B culinary campaigns
    return campaigns.filter((c) => !isBuildingMaterialCampaign(c) && !isFnbCulinaryCampaign(c));
  }

  // When Hybrid Mode is ON, isolate by active POS terminal modelType if provided
  if (termType === 'building') {
    return campaigns.filter((c) => isBuildingMaterialCampaign(c));
  }
  if (termType === 'fnb') {
    return campaigns.filter((c) => isFnbCulinaryCampaign(c));
  }
  if (termType === 'retail') {
    return campaigns.filter((c) => !isBuildingMaterialCampaign(c) && !isFnbCulinaryCampaign(c));
  }
  return campaigns;
}

export function loadPromoCampaignsForDomain(
  domainConfig?: BusinessDomainConfig | null,
  activeTerminalModelType?: string | null
): PromoCampaign[] {
  const all = loadPromoCampaigns();
  return filterPromoCampaignsByDomain(all, domainConfig, activeTerminalModelType);
}

export function filterPromotionProgramsByDomain(
  promotions: PromotionProgram[],
  domainConfig?: BusinessDomainConfig | null,
  activeTerminalModelType?: string | null
): PromotionProgram[] {
  if (!Array.isArray(promotions)) return [];
  if (!domainConfig) return promotions;

  const isHybrid = Boolean(domainConfig.isHybridMultiUnit);
  const termType = (activeTerminalModelType || '').toLowerCase();

  if (!isHybrid) {
    if (domainConfig.mechanismFamily === 'BUILDING_BULK') {
      return promotions.filter(
        (p) => isBuildingMaterialPromotionProgram(p) || (p.targetProductSku || '').toUpperCase() === 'ALL'
      );
    }
    if (domainConfig.mechanismFamily === 'FNB_CULINARY') {
      return promotions.filter(
        (p) => isFnbCulinaryPromotionProgram(p) || (p.targetProductSku || '').toUpperCase() === 'ALL'
      );
    }
    return promotions.filter(
      (p) => !isBuildingMaterialPromotionProgram(p) && !isFnbCulinaryPromotionProgram(p)
    );
  }

  if (termType === 'building') {
    return promotions.filter(
      (p) => isBuildingMaterialPromotionProgram(p) || (p.targetProductSku || '').toUpperCase() === 'ALL'
    );
  }
  if (termType === 'fnb') {
    return promotions.filter(
      (p) => isFnbCulinaryPromotionProgram(p) || (p.targetProductSku || '').toUpperCase() === 'ALL'
    );
  }
  if (termType === 'retail') {
    return promotions.filter(
      (p) => !isBuildingMaterialPromotionProgram(p) && !isFnbCulinaryPromotionProgram(p)
    );
  }
  return promotions;
}

export function isVolumeBoronganCampaign(camp: PromoCampaign): boolean {
  if (!camp) return false;
  if (camp.promoTag === 'VOLUME_BORONGAN' || camp.sourceType === 'STORE_DISC') return true;
  const text = `${camp.code || ''} ${camp.name || ''}`.toLowerCase();
  return text.includes('volume') || text.includes('borongan') || text.includes('kontraktor') || text.includes('besi') || text.includes('baja');
}

const DEFAULT_IDS = new Set([
  'promo-1',
  'promo-2',
  'promo-3',
  'promo-4',
  'promo-5',
  'promo-6',
  ...DEFAULT_BUILDING_PROMO_CAMPAIGNS.map((c) => c.id),
  ...DEFAULT_FNB_PROMO_CAMPAIGNS.map((c) => c.id),
]);
const ALL_SEED_CAMPAIGNS: PromoCampaign[] = [
  ...DEFAULT_PROMO_CAMPAIGNS,
  ...DEFAULT_BUILDING_PROMO_CAMPAIGNS,
  ...DEFAULT_FNB_PROMO_CAMPAIGNS,
];

export function loadPromoCampaigns(): PromoCampaign[] {
  try {
    const raw = localStorage.getItem(PROMO_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(ALL_SEED_CAMPAIGNS));
      return ALL_SEED_CAMPAIGNS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(ALL_SEED_CAMPAIGNS));
      return ALL_SEED_CAMPAIGNS;
    }

    let mutated = false;
    const upgraded: PromoCampaign[] = parsed.map((c: PromoCampaign) => {
      const normalizedMax = normalizeMaxQtyPerReceipt(c.sourceType, c.maxQtyPerReceipt);
      if (c.sourceType === 'FEFO_EXP' && c.maxQtyPerReceipt !== null && c.maxQtyPerReceipt !== undefined) {
        mutated = true;
      }
      if (DEFAULT_IDS.has(c.id)) {
        const def = ALL_SEED_CAMPAIGNS.find((d) => d.id === c.id);
        if (def && ((!c.componentSkus && def.componentSkus) || (c.endDate && c.endDate < '2026-06-01') || c.mechanic === undefined || !c.domainFamily)) {
          mutated = true;
          return {
            ...c,
            mechanic: c.mechanic || def.mechanic || 'STANDARD',
            domainFamily: c.domainFamily || def.domainFamily,
            promoTag: c.promoTag || def.promoTag,
            maxQtyPerReceipt: c.sourceType === 'FEFO_EXP' ? null : (c.maxQtyPerReceipt !== undefined ? c.maxQtyPerReceipt : def.maxQtyPerReceipt),
            pwpMinCartSubtotal: c.pwpMinCartSubtotal ?? def.pwpMinCartSubtotal,
            pwpSpecialPrice: c.pwpSpecialPrice ?? def.pwpSpecialPrice,
            buyQty: c.buyQty ?? def.buyQty,
            getFreeQty: c.getFreeQty ?? def.getFreeQty,
            endDate: c.endDate < '2026-06-01' ? def.endDate : c.endDate,
            targetValue: c.id === 'promo-2' || c.id === 'promo-1' || c.id === 'promo-3' ? def.targetValue : c.targetValue,
            componentSkus: c.componentSkus || def.componentSkus,
          };
        }
      }
      return {
        ...c,
        mechanic: c.mechanic || 'STANDARD',
        maxQtyPerReceipt: normalizedMax,
      };
    });

    // Inject missing retail (promo-5/6), building material, or F&B seed campaigns from older localStorage seed
    const existingIds = new Set(upgraded.map((u) => u.id));
    for (const def of ALL_SEED_CAMPAIGNS) {
      if (
        (def.id === 'promo-5' ||
          def.id === 'promo-6' ||
          def.domainFamily === 'BUILDING_BULK' ||
          def.domainFamily === 'FNB_CULINARY') &&
        !existingIds.has(def.id)
      ) {
        upgraded.push(def);
        mutated = true;
      }
    }

    if (mutated) {
      localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(upgraded));
    }
    return upgraded;
  } catch {
    return ALL_SEED_CAMPAIGNS;
  }
}

export function savePromoCampaigns(campaigns: PromoCampaign[]): void {
  try {
    const normalized = campaigns.map((c) => ({
      ...c,
      mechanic: c.mechanic || 'STANDARD',
      maxQtyPerReceipt: normalizeMaxQtyPerReceipt(c.sourceType, c.maxQtyPerReceipt),
    }));
    localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(normalized));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('jacs_promo_campaigns_updated'));
    }
  } catch {
    // ignore quota errors
  }
}

export function isCampaignActiveToday(camp: PromoCampaign, todayIso?: string): boolean {
  if (!camp || camp.status !== 'AKTIF') return false;
  const today = todayIso || new Date().toISOString().slice(0, 10);
  if (camp.startDate && today < camp.startDate) return false;
  if (camp.endDate && today > camp.endDate) return false;
  return true;
}

export function findMatchingProduct(
  ref: { skuId?: string; skuName?: string; targetValue?: string },
  products: Product[]
): Product | undefined {
  if (!Array.isArray(products) || products.length === 0) return undefined;
  const skuIdLower = (ref.skuId || '').trim().toLowerCase();
  const skuNameLower = (ref.skuName || '').trim().toLowerCase();
  const targetLower = (ref.targetValue || '').trim().toLowerCase();

  return products.find((p) => {
    const pid = (p.id || '').toLowerCase();
    const psku = (p.sku || '').toLowerCase();
    const pbc = (p.barcode || '').toLowerCase();
    const pplu = (p.plu || '').toLowerCase();
    const pname = (p.name || '').toLowerCase();

    if (skuIdLower && (pid === skuIdLower || psku === skuIdLower || pbc === skuIdLower || pplu === skuIdLower)) {
      return true;
    }
    if (skuNameLower && (pname === skuNameLower || pname.includes(skuNameLower) || skuNameLower.includes(pname))) {
      return true;
    }
    if (targetLower) {
      if (pid && (targetLower === pid || targetLower.startsWith(`${pid} `) || targetLower.includes(`(${pid})`))) return true;
      if (psku && (targetLower === psku || targetLower.startsWith(`${psku} `))) return true;
      if (pbc && targetLower.includes(pbc)) return true;
      if (pname && (targetLower === pname || targetLower.includes(pname))) return true;
    }
    return false;
  });
}

function matchesPromoTarget(product: Product, camp: PromoCampaign): boolean {
  if (!product || !camp) return false;
  const targetRaw = (camp.targetValue || '').trim();
  const targetLower = targetRaw.toLowerCase();

  if (camp.targetType === 'SKU') {
    const pid = (product.id || '').toLowerCase();
    const psku = (product.sku || '').toLowerCase();
    const pbc = (product.barcode || '').toLowerCase();
    const pplu = (product.plu || '').toLowerCase();
    const pname = (product.name || '').toLowerCase();

    if (pid && (targetLower === pid || targetLower.startsWith(`${pid} `) || targetLower.includes(pid))) return true;
    if (psku && (targetLower === psku || targetLower.startsWith(`${psku} `) || targetLower.includes(psku))) return true;
    if (pbc && targetLower.includes(pbc)) return true;
    if (pplu && targetLower.includes(pplu)) return true;
    if (pname && (targetLower === pname || targetLower.includes(pname) || pname.includes(targetLower))) return true;

    if (Array.isArray(camp.componentSkus) && camp.componentSkus.length === 1 && camp.sourceType === 'FEFO_EXP') {
      const comp = camp.componentSkus[0];
      if (comp.skuId && (comp.skuId.toLowerCase() === pid || comp.skuId.toLowerCase() === psku)) return true;
      if (comp.skuName && comp.skuName.toLowerCase() === pname) return true;
    }
    return false;
  }

  // CATEGORY matching (PC.code or category label)
  const catCode = product.categoryCode !== undefined && product.categoryCode !== null ? String(product.categoryCode).trim() : '';
  if (catCode) {
    const pcRegex = new RegExp(`\\bPC\\.${catCode}\\b`, 'i');
    if (pcRegex.test(targetRaw)) return true;
  }
  const prodCat = (product.category || '').trim().toLowerCase();
  if (prodCat && prodCat.length >= 3 && targetLower.includes(prodCat)) {
    return true;
  }
  return false;
}

function computeSavingsWithHppGuard(
  baseUnitPrice: number,
  costPrice: number,
  discountType: DiscountType,
  discountValue: number,
  sourceType: PromoSourceType
): number {
  if (baseUnitPrice <= 0 || discountValue <= 0) return 0;
  const rawDiscount =
    discountType === 'PERCENT'
      ? Math.round((baseUnitPrice * Math.min(100, discountValue)) / 100)
      : Math.round(discountValue);

  let maxAllowedDiscount = baseUnitPrice;
  // Lock HPP floor for all promos EXCEPT FEFO_EXP clearance
  if (sourceType !== 'FEFO_EXP' && costPrice > 0 && costPrice < baseUnitPrice) {
    maxAllowedDiscount = Math.max(0, baseUnitPrice - costPrice);
  }
  return Math.max(0, Math.min(rawDiscount, maxAllowedDiscount));
}

function evaluateCampaignOnLine(
  camp: {
    id: string;
    code: string;
    name: string;
    sourceType: PromoSourceType;
    mechanic: PromoMechanic;
    discountType: DiscountType;
    discountValue: number;
    pwpMinCartSubtotal?: number;
    pwpSpecialPrice?: number;
    buyQty?: number;
    getFreeQty?: number;
    maxQtyPerReceipt?: number | null;
    supplierName?: string;
  },
  baseUnitPrice: number,
  costPrice: number,
  qty: number,
  eligibleCartSubtotal: number
): Omit<ResolvedPromoResult, 'overriddenPromosCount'> | null {
  const safeQty = Math.max(0.01, qty || 1);
  const isUnlimitedFefo = camp.sourceType === 'FEFO_EXP';
  const maxCap = normalizeMaxQtyPerReceipt(camp.sourceType, camp.maxQtyPerReceipt);
  const badgeLabel = getPromoBadgeLabel(camp.sourceType, camp.mechanic, camp.buyQty, camp.getFreeQty);

  if (camp.mechanic === 'PWP_TEBUS_MURAH') {
    const minSub = Math.max(0, camp.pwpMinCartSubtotal || 0);
    const specialPrice = Math.max(0, camp.pwpSpecialPrice ?? Math.max(0, baseUnitPrice - camp.discountValue));
    const rawPerUnitDiff = Math.max(0, baseUnitPrice - specialPrice);
    let maxAllowedPerUnit = baseUnitPrice;
    if (camp.sourceType !== 'FEFO_EXP' && costPrice > 0 && costPrice < baseUnitPrice) {
      maxAllowedPerUnit = Math.max(0, baseUnitPrice - costPrice);
    }
    const perUnitSavings = Math.min(rawPerUnitDiff, maxAllowedPerUnit);
    if (perUnitSavings <= 0) return null;

    const qualified = eligibleCartSubtotal >= minSub;
    const cappedQty = qualified
      ? maxCap !== null
        ? Math.min(safeQty, maxCap)
        : safeQty
      : 0;
    const totalLineSavings = Math.round(perUnitSavings * cappedQty);
    const lineSubtotal = Math.max(0, Math.round(baseUnitPrice * safeQty) - totalLineSavings);
    const effectiveUnitAvg = safeQty > 0 ? Math.round((lineSubtotal / safeQty)) : baseUnitPrice;

    const shortfall = Math.max(0, minSub - eligibleCartSubtotal);
    const capHint =
      maxCap !== null && safeQty > maxCap
        ? `Promo maks ${maxCap}/struk (${Math.max(0, safeQty - maxCap)} unit harga normal)`
        : isUnlimitedFefo
        ? 'FEFO Unlimited (tanpa batas struk)'
        : maxCap !== null
        ? `Maks ${maxCap}/struk`
        : undefined;

    const promoHint = !qualified
      ? `Tambah belanja Rp ${shortfall.toLocaleString('id-ID')} lagi (min. Rp ${minSub.toLocaleString('id-ID')}) untuk aktifkan Tebus Murah`
      : capHint;

    return {
      campaignId: camp.id,
      campaignCode: camp.code,
      promoName: camp.name,
      sourceType: camp.sourceType,
      mechanic: 'PWP_TEBUS_MURAH',
      badgeLabel: qualified ? badgeLabel : `[PWP MIN. Rp ${minSub.toLocaleString('id-ID')}]`,
      originalUnitPrice: baseUnitPrice,
      finalUnitPrice: qualified && cappedQty > 0 ? Math.max(0, baseUnitPrice - perUnitSavings) : baseUnitPrice,
      savingsPerUnit: safeQty > 0 ? Math.round(totalLineSavings / safeQty) : 0,
      totalLineSavings,
      lineSubtotal,
      promoQtyCapped: cappedQty,
      maxQtyPerReceipt: maxCap,
      isUnlimitedFefo,
      freeBonusQty: 0,
      pwpMinCartSubtotal: minSub,
      pwpQualified: qualified,
      promoHint,
      supplierName: camp.supplierName,
    };
  }

  if (camp.mechanic === 'BUY_X_GET_Y') {
    const buyX = Math.max(1, Math.floor(camp.buyQty || 2));
    const getY = Math.max(1, Math.floor(camp.getFreeQty || 1));
    const sets = Math.floor(safeQty / buyX);
    const rawFree = sets * getY;
    const freeBonusQty = maxCap !== null ? Math.min(rawFree, maxCap) : rawFree;
    const totalLineSavings = Math.round(freeBonusQty * baseUnitPrice);
    const lineSubtotal = Math.round(baseUnitPrice * safeQty);

    let promoHint: string | undefined;
    if (freeBonusQty === 0) {
      const needMore = Math.max(1, buyX - Math.floor(safeQty));
      promoHint = `Tambah ${needMore} unit lagi untuk gratis ${getY} unit (Beli ${buyX} Gratis ${getY})`;
    } else if (maxCap !== null && rawFree > maxCap) {
      promoHint = `Gratis dibatasi maks ${maxCap} unit/struk (non-FEFO)`;
    } else if (isUnlimitedFefo) {
      promoHint = `FEFO Unlimited (tanpa batas gratis per struk)`;
    }

    return {
      campaignId: camp.id,
      campaignCode: camp.code,
      promoName: camp.name,
      sourceType: camp.sourceType,
      mechanic: 'BUY_X_GET_Y',
      badgeLabel,
      originalUnitPrice: baseUnitPrice,
      finalUnitPrice: baseUnitPrice,
      savingsPerUnit: 0,
      totalLineSavings,
      lineSubtotal,
      promoQtyCapped: freeBonusQty,
      maxQtyPerReceipt: maxCap,
      isUnlimitedFefo,
      freeBonusQty,
      freeBonusLabel: freeBonusQty > 0 ? `Gratis ${freeBonusQty} unit (Beli ${buyX} Gratis ${getY})` : undefined,
      promoHint,
      supplierName: camp.supplierName,
    };
  }

  // STANDARD discount
  const perUnitSavings = computeSavingsWithHppGuard(
    baseUnitPrice,
    costPrice,
    camp.discountType,
    camp.discountValue,
    camp.sourceType
  );
  if (perUnitSavings <= 0) return null;

  const cappedQty = maxCap !== null ? Math.min(safeQty, maxCap) : safeQty;
  const totalLineSavings = Math.round(perUnitSavings * cappedQty);
  const lineSubtotal = Math.max(0, Math.round(baseUnitPrice * safeQty) - totalLineSavings);

  let promoHint: string | undefined;
  if (maxCap !== null && safeQty > maxCap) {
    promoHint = `Promo berlaku u/ ${cappedQty} unit (Maks. ${maxCap}/struk) • ${Math.max(0, safeQty - maxCap)} unit harga normal`;
  } else if (isUnlimitedFefo) {
    promoHint = `FEFO Unlimited (tanpa batas qty/struk)`;
  } else if (maxCap !== null) {
    promoHint = `Maks. ${maxCap} unit/struk`;
  }

  return {
    campaignId: camp.id,
    campaignCode: camp.code,
    promoName: camp.name,
    sourceType: camp.sourceType,
    mechanic: 'STANDARD',
    badgeLabel,
    originalUnitPrice: baseUnitPrice,
    finalUnitPrice: Math.max(0, baseUnitPrice - perUnitSavings),
    savingsPerUnit: safeQty > 0 ? Math.round(totalLineSavings / safeQty) : perUnitSavings,
    totalLineSavings,
    lineSubtotal,
    promoQtyCapped: cappedQty,
    maxQtyPerReceipt: maxCap,
    isUnlimitedFefo,
    freeBonusQty: 0,
    promoHint,
    supplierName: camp.supplierName,
  };
}

/**
 * Resolves package barcode scan (e.g. `200-BND-...` or `200-EXP-...`).
 */
export function resolvePackageBarcodePromo(
  query: string,
  allProducts: Product[],
  campaigns?: PromoCampaign[],
  qty: number = 1,
  eligibleCartSubtotal: number = 0
): ResolvedPackageScanResult | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const sourceList = campaigns || loadPromoCampaigns();
  const matchedPkg = sourceList.find((c) => {
    if (!isCampaignActiveToday(c)) return false;
    const codeMatch = c.code && c.code.toLowerCase() === q;
    const genMatch = c.generatedBarcode && c.generatedBarcode.toLowerCase() === q;
    return Boolean(codeMatch || genMatch);
  });

  if (!matchedPkg) return null;

  let resolvedComponents: PromoComponentSku[] = [];
  if (Array.isArray(matchedPkg.componentSkus) && matchedPkg.componentSkus.length > 0) {
    resolvedComponents = matchedPkg.componentSkus.map((comp) => {
      const realProd = findMatchingProduct(
        { skuId: comp.skuId, skuName: comp.skuName },
        allProducts
      );
      return {
        skuId: realProd?.id || comp.skuId,
        skuName: realProd?.name || comp.skuName,
        qty: Math.max(1, Number(comp.qty) || 1),
        unitCost: Number(realProd?.costPrice ?? realProd?.cost_price ?? comp.unitCost) || 0,
      };
    });
  } else {
    const targetProd = findMatchingProduct(
      { targetValue: matchedPkg.targetValue },
      allProducts
    );
    if (targetProd) {
      resolvedComponents = [
        {
          skuId: targetProd.id,
          skuName: targetProd.name,
          qty: 1,
          unitCost: Number(targetProd.costPrice ?? targetProd.cost_price) || 0,
        },
      ];
    }
  }

  let basePkgPrice = 0;
  let totalPkgCost = 0;
  const insufficientStockComponents: string[] = [];

  for (const comp of resolvedComponents) {
    const realProd = findMatchingProduct({ skuId: comp.skuId, skuName: comp.skuName }, allProducts);
    const unitSell = realProd
      ? Number(realProd.price_retail ?? realProd.sell_price ?? realProd.sellingPrice) || Math.round(comp.unitCost * 1.25)
      : Math.round(comp.unitCost * 1.25);
    const unitCost = realProd
      ? Number(realProd.costPrice ?? realProd.cost_price) || comp.unitCost
      : comp.unitCost;

    basePkgPrice += unitSell * comp.qty;
    totalPkgCost += unitCost * comp.qty;

    if (realProd && (realProd.stock ?? 0) < comp.qty * Math.max(1, qty)) {
      insufficientStockComponents.push(`${realProd.name} (sisa ${realProd.stock})`);
    }
  }

  if (basePkgPrice <= 0) {
    basePkgPrice = 85000;
    totalPkgCost = 40000;
  }

  const evalRes = evaluateCampaignOnLine(
    {
      id: matchedPkg.id,
      code: matchedPkg.code,
      name: matchedPkg.name,
      sourceType: matchedPkg.sourceType,
      mechanic: matchedPkg.mechanic || 'STANDARD',
      discountType: matchedPkg.discountType,
      discountValue: matchedPkg.discountValue,
      pwpMinCartSubtotal: matchedPkg.pwpMinCartSubtotal,
      pwpSpecialPrice: matchedPkg.pwpSpecialPrice,
      buyQty: matchedPkg.buyQty,
      getFreeQty: matchedPkg.getFreeQty,
      maxQtyPerReceipt: matchedPkg.maxQtyPerReceipt,
      supplierName: matchedPkg.supplierName,
    },
    basePkgPrice,
    totalPkgCost,
    qty,
    eligibleCartSubtotal
  );

  const fallbackPromo: Omit<ResolvedPromoResult, 'overriddenPromosCount'> = evalRes || {
    campaignId: matchedPkg.id,
    campaignCode: matchedPkg.code,
    promoName: matchedPkg.name,
    sourceType: matchedPkg.sourceType,
    mechanic: matchedPkg.mechanic || 'STANDARD',
    badgeLabel: getPromoBadgeLabel(matchedPkg.sourceType, matchedPkg.mechanic, matchedPkg.buyQty, matchedPkg.getFreeQty),
    originalUnitPrice: basePkgPrice,
    finalUnitPrice: basePkgPrice,
    savingsPerUnit: 0,
    totalLineSavings: 0,
    lineSubtotal: basePkgPrice * Math.max(1, qty),
    promoQtyCapped: 0,
    maxQtyPerReceipt: normalizeMaxQtyPerReceipt(matchedPkg.sourceType, matchedPkg.maxQtyPerReceipt),
    isUnlimitedFefo: matchedPkg.sourceType === 'FEFO_EXP',
    freeBonusQty: 0,
  };

  const pkgProduct: Product = {
    id: matchedPkg.id,
    barcode: matchedPkg.generatedBarcode || matchedPkg.code,
    sku: matchedPkg.code,
    name: matchedPkg.name,
    category: matchedPkg.sourceType === 'FEFO_EXP' ? 'Clearance FEFO' : 'Paket Bundling',
    price: basePkgPrice,
    price_retail: fallbackPromo.finalUnitPrice,
    sell_price: basePkgPrice,
    sellingPrice: fallbackPromo.finalUnitPrice,
    costPrice: totalPkgCost,
    cost_price: totalPkgCost,
    stock: 999,
    minStock: 1,
    unit: matchedPkg.sourceType === 'FEFO_EXP' ? 'Pcs/Exp' : 'Paket',
    status: 'Active',
    itemType: 'RETAIL',
    isPackage: true,
    componentSkus: resolvedComponents,
  };

  return {
    campaign: matchedPkg,
    product: pkgProduct,
    componentSkus: resolvedComponents,
    insufficientStockComponents,
    promo: {
      ...fallbackPromo,
      overriddenPromosCount: 0,
    },
  };
}

function isFashionDomainProduct(p?: Product | null): boolean {
  if (!p) return false;
  return (
    p.businessModel === 'fashion' ||
    String(p.id || '').toUpperCase().startsWith('FASH-') ||
    Boolean((p.variantMatrix && p.variantMatrix.length > 0) || p.fashionPromo)
  );
}

function evaluateFashionArticlePromoCandidates(
  product: Product,
  baseUnitPrice: number,
  qty: number,
  sameArticleQty?: number,
  mixMatchFashionQty?: number
): Array<{
  priority: number;
  result: Omit<ResolvedPromoResult, 'overriddenPromosCount'>;
}> {
  const fp = product.fashionPromo;
  if (!fp || baseUnitPrice <= 0) return [];

  const safeQty = Math.max(0.01, qty || 1);
  const results: Array<{
    priority: number;
    result: Omit<ResolvedPromoResult, 'overriddenPromosCount'>;
  }> = [];

  if (fp.clearanceActive && Number(fp.clearanceValue) > 0) {
    const val = Number(fp.clearanceValue);
    const rawSavings =
      fp.clearanceType === 'PERCENT'
        ? Math.round((baseUnitPrice * Math.min(100, val)) / 100)
        : Math.round(val);
    const perUnitSavings = Math.max(0, Math.min(rawSavings, baseUnitPrice));
    if (perUnitSavings > 0) {
      const totalLineSavings = Math.round(perUnitSavings * safeQty);
      const lineSubtotal = Math.max(0, Math.round(baseUnitPrice * safeQty) - totalLineSavings);
      results.push({
        priority: PROMO_PRIORITY.SEASONAL,
        result: {
          campaignId: `FASH-CLR-${product.id}`,
          campaignCode: `CLEARANCE-${product.id}`,
          promoName: fp.clearanceLabel || 'Clearance Sale Fashion',
          sourceType: 'STORE_DISC',
          mechanic: 'STANDARD',
          badgeLabel:
            fp.clearanceType === 'PERCENT'
              ? `[CLEARANCE -${val}%]`
              : `[CLEARANCE -Rp ${val.toLocaleString('id-ID')}]`,
          originalUnitPrice: baseUnitPrice,
          finalUnitPrice: Math.max(0, baseUnitPrice - perUnitSavings),
          savingsPerUnit: perUnitSavings,
          totalLineSavings,
          lineSubtotal,
          promoQtyCapped: safeQty,
          maxQtyPerReceipt: null,
          isUnlimitedFefo: false,
          freeBonusQty: 0,
          promoHint: fp.clearanceLabel || 'Clearance Sale Artikel Fashion',
        },
      });
    }
  }

  if (fp.bundleActive && Number(fp.bundleDiscountValue) > 0) {
    const minQty = Math.max(2, Math.floor(Number(fp.bundleMinQty) || 2));
    const scope = fp.bundleScope === 'SAME_SKU' ? 'SAME_SKU' : 'MIX_MATCH_FASHION';
    const qualifyingQty =
      scope === 'SAME_SKU'
        ? Math.max(safeQty, Number(sameArticleQty ?? safeQty))
        : Math.max(safeQty, Number(mixMatchFashionQty ?? safeQty));
    const qualified = qualifyingQty >= minQty;
    const val = Number(fp.bundleDiscountValue);
    const rawSavings =
      fp.bundleDiscountType === 'PERCENT'
        ? Math.round((baseUnitPrice * Math.min(100, val)) / 100)
        : Math.round(val);
    const perUnitSavings = Math.max(0, Math.min(rawSavings, baseUnitPrice));
    if (perUnitSavings > 0) {
      const totalLineSavings = qualified ? Math.round(perUnitSavings * safeQty) : 0;
      const lineSubtotal = Math.max(0, Math.round(baseUnitPrice * safeQty) - totalLineSavings);
      const shortfall = Math.max(1, Math.ceil(minQty - qualifyingQty));
      results.push({
        priority: qualified ? PROMO_PRIORITY.SEASONAL : 0,
        result: {
          campaignId: `FASH-BND-${product.id}`,
          campaignCode: `BUNDLE-${product.id}`,
          promoName:
            fp.bundleLabel ||
            (scope === 'MIX_MATCH_FASHION' ? 'Promo Mix & Match Koleksi' : 'Promo Bundle Artikel'),
          sourceType: 'STORE_BND',
          mechanic: 'BUNDLE',
          badgeLabel: qualified
            ? scope === 'MIX_MATCH_FASHION'
              ? `[MIX & MATCH ${minQty}+]`
              : `[BUNDLE ${minQty}+]`
            : scope === 'MIX_MATCH_FASHION'
            ? `[MIX & MATCH MIN. ${minQty}]`
            : `[BUNDLE MIN. ${minQty}]`,
          originalUnitPrice: baseUnitPrice,
          finalUnitPrice: qualified ? Math.max(0, baseUnitPrice - perUnitSavings) : baseUnitPrice,
          savingsPerUnit: qualified ? perUnitSavings : 0,
          totalLineSavings,
          lineSubtotal,
          promoQtyCapped: qualified ? safeQty : 0,
          maxQtyPerReceipt: null,
          isUnlimitedFefo: false,
          freeBonusQty: 0,
          pwpQualified: qualified,
          promoHint: qualified
            ? `${fp.bundleLabel || 'Promo Paket Koleksi'} • Aktif (${qualifyingQty}/${minQty} pcs)`
            : scope === 'MIX_MATCH_FASHION'
            ? `Tambah ${shortfall} item Fashion lagi (Mix & Match) untuk ${fp.bundleLabel || 'diskon paket'}`
            : `Tambah ${shortfall} pcs SKU ini lagi untuk ${fp.bundleLabel || 'diskon bundle'}`,
        },
      });
    }
  }

  return results;
}

/**
 * Resolusi anti-tumpuk untuk produk reguler:
 * FEFO_EXP > SUPPLIER_TPR > SEASONAL > STORE_DISC
 * Mendukung STANDARD, PWP_TEBUS_MURAH, BUY_X_GET_Y, Promo Artikel Fashion, dan maxQtyPerReceipt.
 */
export function resolveBestProductPromo(
  product: Product,
  baseUnitPrice: number,
  campaigns?: PromoCampaign[],
  appPromotions?: PromotionProgram[],
  qty: number = 1,
  eligibleCartSubtotal: number = 0,
  sameArticleQty?: number,
  mixMatchFashionQty?: number
): ResolvedPromoResult | null {
  if (!product || baseUnitPrice <= 0) return null;
  const costPrice = Number(product.costPrice ?? product.cost_price ?? 0);
  const campaignList = campaigns || loadPromoCampaigns();

  const candidates: Array<{
    priority: number;
    result: Omit<ResolvedPromoResult, 'overriddenPromosCount'>;
  }> = [];

  if (product.fashionPromo) {
    candidates.push(
      ...evaluateFashionArticlePromoCandidates(
        product,
        baseUnitPrice,
        qty,
        sameArticleQty,
        mixMatchFashionQty
      )
    );
  }

  for (const camp of campaignList) {
    if (!isCampaignActiveToday(camp)) continue;
    if (camp.sourceType === 'STORE_BND') continue;
    // Note: 200-EXP-... FEFO stickers are separate physical batch stickers unless no other SKU match; still respect FEFO priority when target matches
    if (!matchesPromoTarget(product, camp)) continue;

    const evaluated = evaluateCampaignOnLine(
      {
        id: camp.id,
        code: camp.code,
        name: camp.name,
        sourceType: camp.sourceType,
        mechanic: camp.mechanic || 'STANDARD',
        discountType: camp.discountType,
        discountValue: camp.discountValue,
        pwpMinCartSubtotal: camp.pwpMinCartSubtotal,
        pwpSpecialPrice: camp.pwpSpecialPrice,
        buyQty: camp.buyQty,
        getFreeQty: camp.getFreeQty,
        maxQtyPerReceipt: camp.maxQtyPerReceipt,
        supplierName: camp.supplierName,
      },
      baseUnitPrice,
      costPrice,
      qty,
      eligibleCartSubtotal
    );
    if (!evaluated) continue;

    // Exclude unqualified PWP if another active promo exists? Actually keep PWP candidate if qualified OR as informational fallback when nothing else applies
    candidates.push({
      priority:
        evaluated.mechanic === 'PWP_TEBUS_MURAH' && evaluated.pwpQualified === false
          ? 0
          : PROMO_PRIORITY[camp.sourceType] ?? 1,
      result: evaluated,
    });
  }

  // Also include central STORE_DISC programs from AppContext.promotions if matching product SKU/category
  if (Array.isArray(appPromotions)) {
    const today = new Date().toISOString().slice(0, 10);
    for (const p of appPromotions) {
      const isActive = p.status === 'ACTIVE' || p.isActive === true;
      if (!isActive) continue;
      if (p.startDate && today < p.startDate) continue;
      if (p.endDate && today > p.endDate) continue;
      if (p.type === 'BUNDLE' || p.type === 'BUNDLING' || p.type === 'CART_DISCOUNT') continue;

      const pid = (product.id || '').toLowerCase();
      const psku = (product.sku || '').toLowerCase();
      const pbc = (product.barcode || '').toLowerCase();
      const skuMatch =
        (p.targetProductSku && (p.targetProductSku.toLowerCase() === pid || p.targetProductSku.toLowerCase() === psku)) ||
        (Array.isArray(p.applicableSkus) &&
          p.applicableSkus.some((s) => {
            const sl = s.toLowerCase();
            return sl === pid || sl === psku || sl === pbc;
          }));

      if (!skuMatch) continue;

      const dType: DiscountType =
        p.discountType === 'PERCENT' || p.discountValueType === 'PERCENT' ? 'PERCENT' : 'NOMINAL';
      const evaluated = evaluateCampaignOnLine(
        {
          id: p.id,
          code: p.code,
          name: p.name,
          sourceType: 'STORE_DISC',
          mechanic: 'STANDARD',
          discountType: dType,
          discountValue: p.discountValue,
          maxQtyPerReceipt: null,
        },
        baseUnitPrice,
        costPrice,
        qty,
        eligibleCartSubtotal
      );
      if (!evaluated) continue;

      candidates.push({
        priority: PROMO_PRIORITY.STORE_DISC,
        result: evaluated,
      });
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.result.totalLineSavings - a.result.totalLineSavings;
  });

  const winner = candidates[0];
  return {
    ...winner.result,
    overriddenPromosCount: Math.max(0, candidates.length - 1),
  };
}

/**
 * Mengembalikan daftar produk paket virtual aktif (200-BND-... / 200-EXP-...)
 * agar kasir dapat memilihnya lewat Pencarian Manual [F3] maupun scan barcode.
 */
export function getActivePackageProducts(
  allProducts: Product[],
  campaigns?: PromoCampaign[]
): Product[] {
  const sourceList = campaigns || loadPromoCampaigns();
  const results: Product[] = [];
  for (const camp of sourceList) {
    if (!isCampaignActiveToday(camp)) continue;
    const bc = (camp.generatedBarcode || camp.code || '').toUpperCase();
    const isPkgCampaign =
      camp.sourceType === 'STORE_BND' ||
      camp.sourceType === 'FEFO_EXP' ||
      bc.startsWith('200-BND-') ||
      bc.startsWith('200-EXP-');
    if (!isPkgCampaign) continue;

    const resolved = resolvePackageBarcodePromo(bc, allProducts, sourceList);
    if (resolved) {
      results.push(resolved.product);
    }
  }
  return results;
}

/**
 * Menghitung ulang seluruh baris keranjang agar aturan PWP_TEBUS_MURAH, BUY_X_GET_Y,
 * dan maxQtyPerReceipt selalu akurat setiap kali item/qty keranjang berubah.
 */
export function recalculateCartWithPromos(
  cart: CartItem[],
  allProducts: Product[],
  campaigns?: PromoCampaign[],
  appPromotions?: PromotionProgram[]
): CartItem[] {
  if (!Array.isArray(cart) || cart.length === 0) return cart;
  const campList = campaigns || loadPromoCampaigns();

  const sameSkuQtyMap = new Map<string, number>();
  let mixMatchFashionQty = 0;
  const enrichedCart = cart.map((item) => {
    if (!item?.product) return item;
    const latestProd = allProducts.find((p) => p.id === item.product.id);
    const mergedProd = latestProd
      ? {
          ...item.product,
          fashionPromo: latestProd.fashionPromo ?? item.product.fashionPromo,
          variantMatrix: latestProd.variantMatrix ?? item.product.variantMatrix,
        }
      : item.product;
    const lineQty = Math.max(0, Number(item.quantity) || 0);
    sameSkuQtyMap.set(mergedProd.id, (sameSkuQtyMap.get(mergedProd.id) || 0) + lineQty);
    if (isFashionDomainProduct(mergedProd)) {
      mixMatchFashionQty += lineQty;
    }
    return latestProd ? { ...item, product: mergedProd } : item;
  });

  // Pass 1: Identify items potentially matching a PWP_TEBUS_MURAH campaign
  const isPwpCandidateIndex = new Set<number>();
  enrichedCart.forEach((item, idx) => {
    if (!item?.product || item.modifiers || item.promoBadge === '[MANUAL DISC]') return;
    if (item.promoMechanic === 'PWP_TEBUS_MURAH') {
      isPwpCandidateIndex.add(idx);
      return;
    }
    const hasPwpMatch = campList.some(
      (c) =>
        isCampaignActiveToday(c) &&
        c.mechanic === 'PWP_TEBUS_MURAH' &&
        (item.isPackage ? c.code === item.promoCode : matchesPromoTarget(item.product, c))
    );
    if (hasPwpMatch) {
      isPwpCandidateIndex.add(idx);
    }
  });

  // Pass 2: Evaluate non-PWP items first to compute eligibleCartSubtotal cleanly (no circular ref)
  let eligibleNonPwpSubtotal = 0;
  const pass1Items = enrichedCart.map((item, idx) => {
    if (!item?.product || item.modifiers || item.promoBadge === '[MANUAL DISC]') {
      eligibleNonPwpSubtotal += item?.subtotal || 0;
      return item;
    }
    if (isPwpCandidateIndex.has(idx)) {
      return item;
    }

    const baseUnitPrice =
      item.originalUnitPrice ??
      (item.isRetailUnit && item.product.priceSecondary ? item.product.priceSecondary : item.product.sell_price);

    if (item.isPackage || item.product.isPackage) {
      const pkg = resolvePackageBarcodePromo(
        item.promoCode || item.product.barcode || item.product.sku || item.product.id,
        allProducts,
        campList,
        item.quantity,
        0
      );
      if (pkg) {
        eligibleNonPwpSubtotal += pkg.promo.lineSubtotal;
        return {
          ...item,
          product: { ...item.product, sell_price: pkg.promo.originalUnitPrice },
          originalUnitPrice: pkg.promo.originalUnitPrice,
          itemDiscount: pkg.promo.savingsPerUnit,
          promoCode: pkg.promo.campaignCode,
          promoName: pkg.promo.promoName,
          promoSourceType: pkg.promo.sourceType,
          promoBadge: pkg.promo.badgeLabel,
          promoMechanic: pkg.promo.mechanic,
          promoQtyCapped: pkg.promo.promoQtyCapped,
          maxQtyPerReceipt: pkg.promo.maxQtyPerReceipt,
          isUnlimitedFefo: pkg.promo.isUnlimitedFefo,
          freeBonusQty: pkg.promo.freeBonusQty,
          freeBonusLabel: pkg.promo.freeBonusLabel,
          pwpMinCartSubtotal: pkg.promo.pwpMinCartSubtotal,
          pwpQualified: pkg.promo.pwpQualified,
          promoHint: pkg.promo.promoHint,
          supplierName: pkg.promo.supplierName,
          promoSavings: pkg.promo.totalLineSavings,
          overriddenPromosCount: pkg.promo.overriddenPromosCount,
          subtotal: pkg.promo.lineSubtotal,
        };
      }
      eligibleNonPwpSubtotal += item.subtotal || 0;
      return item;
    }

    const sameSkuQty = sameSkuQtyMap.get(item.product.id) || item.quantity;
    const promo = resolveBestProductPromo(
      item.product,
      baseUnitPrice,
      campList,
      appPromotions,
      item.quantity,
      0,
      sameSkuQty,
      mixMatchFashionQty
    );
    if (promo) {
      eligibleNonPwpSubtotal += promo.lineSubtotal;
      return {
        ...item,
        product: { ...item.product, sell_price: baseUnitPrice },
        originalUnitPrice: baseUnitPrice,
        itemDiscount: promo.savingsPerUnit,
        promoCode: promo.campaignCode,
        promoName: promo.promoName,
        promoSourceType: promo.sourceType,
        promoBadge: promo.badgeLabel,
        promoMechanic: promo.mechanic,
        promoQtyCapped: promo.promoQtyCapped,
        maxQtyPerReceipt: promo.maxQtyPerReceipt,
        isUnlimitedFefo: promo.isUnlimitedFefo,
        freeBonusQty: promo.freeBonusQty,
        freeBonusLabel: promo.freeBonusLabel,
        pwpMinCartSubtotal: promo.pwpMinCartSubtotal,
        pwpQualified: promo.pwpQualified,
        promoHint: promo.promoHint,
        supplierName: promo.supplierName,
        promoSavings: promo.totalLineSavings,
        overriddenPromosCount: promo.overriddenPromosCount,
        subtotal: promo.lineSubtotal,
      };
    }

    // Preserve manual cashier discount if no promo active
    const manualUnitDisc = item.promoSourceType ? 0 : (item.itemDiscount || 0);
    const nextSub = Math.round(Math.max(0, baseUnitPrice - manualUnitDisc) * item.quantity);
    eligibleNonPwpSubtotal += nextSub;
    return {
      ...item,
      originalUnitPrice: baseUnitPrice,
      itemDiscount: manualUnitDisc,
      promoSavings: Math.round(manualUnitDisc * item.quantity),
      promoCode: item.promoSourceType ? null : item.promoCode,
      promoName: item.promoSourceType ? undefined : item.promoName,
      promoSourceType: item.promoSourceType ? undefined : item.promoSourceType,
      promoBadge: item.promoSourceType ? undefined : item.promoBadge,
      promoMechanic: undefined,
      freeBonusQty: 0,
      freeBonusLabel: undefined,
      promoHint: undefined,
      subtotal: nextSub,
    };
  });

  // Pass 3: Re-evaluate PWP_TEBUS_MURAH items using eligibleNonPwpSubtotal
  return pass1Items.map((item, idx) => {
    if (!isPwpCandidateIndex.has(idx) || !item?.product) return item;
    const baseUnitPrice =
      item.originalUnitPrice ??
      (item.isRetailUnit && item.product.priceSecondary ? item.product.priceSecondary : item.product.sell_price);

    if (item.isPackage || item.product.isPackage) {
      const pkg = resolvePackageBarcodePromo(
        item.promoCode || item.product.barcode || item.product.sku || item.product.id,
        allProducts,
        campList,
        item.quantity,
        eligibleNonPwpSubtotal
      );
      if (!pkg) return item;
      return {
        ...item,
        product: { ...item.product, sell_price: pkg.promo.originalUnitPrice },
        originalUnitPrice: pkg.promo.originalUnitPrice,
        itemDiscount: pkg.promo.savingsPerUnit,
        promoCode: pkg.promo.campaignCode,
        promoName: pkg.promo.promoName,
        promoSourceType: pkg.promo.sourceType,
        promoBadge: pkg.promo.badgeLabel,
        promoMechanic: pkg.promo.mechanic,
        promoQtyCapped: pkg.promo.promoQtyCapped,
        maxQtyPerReceipt: pkg.promo.maxQtyPerReceipt,
        isUnlimitedFefo: pkg.promo.isUnlimitedFefo,
        freeBonusQty: pkg.promo.freeBonusQty,
        freeBonusLabel: pkg.promo.freeBonusLabel,
        pwpMinCartSubtotal: pkg.promo.pwpMinCartSubtotal,
        pwpQualified: pkg.promo.pwpQualified,
        promoHint: pkg.promo.promoHint,
        supplierName: pkg.promo.supplierName,
        promoSavings: pkg.promo.totalLineSavings,
        overriddenPromosCount: pkg.promo.overriddenPromosCount,
        subtotal: pkg.promo.lineSubtotal,
      };
    }

    const sameSkuQty = sameSkuQtyMap.get(item.product.id) || item.quantity;
    const promo = resolveBestProductPromo(
      item.product,
      baseUnitPrice,
      campList,
      appPromotions,
      item.quantity,
      eligibleNonPwpSubtotal,
      sameSkuQty,
      mixMatchFashionQty
    );
    if (!promo) return item;

    return {
      ...item,
      product: { ...item.product, sell_price: baseUnitPrice },
      originalUnitPrice: baseUnitPrice,
      itemDiscount: promo.savingsPerUnit,
      promoCode: promo.campaignCode,
      promoName: promo.promoName,
      promoSourceType: promo.sourceType,
      promoBadge: promo.badgeLabel,
      promoMechanic: promo.mechanic,
      promoQtyCapped: promo.promoQtyCapped,
      maxQtyPerReceipt: promo.maxQtyPerReceipt,
      isUnlimitedFefo: promo.isUnlimitedFefo,
      freeBonusQty: promo.freeBonusQty,
      freeBonusLabel: promo.freeBonusLabel,
      pwpMinCartSubtotal: promo.pwpMinCartSubtotal,
      pwpQualified: promo.pwpQualified,
      promoHint: promo.promoHint,
      supplierName: promo.supplierName,
      promoSavings: promo.totalLineSavings,
      overriddenPromosCount: promo.overriddenPromosCount,
      subtotal: promo.lineSubtotal,
    };
  });
}

/**
 * Mengembalikan daftar penawaran PWP_TEBUS_MURAH aktif beserta status pemenuhan syarat belanja keranjang.
 */
export function getAvailablePwpOffers(
  cart: CartItem[],
  allProducts: Product[],
  campaigns?: PromoCampaign[]
): PwpOfferStatus[] {
  const campList = campaigns || loadPromoCampaigns();
  const pwpCampaigns = campList.filter(
    (c) => isCampaignActiveToday(c) && c.mechanic === 'PWP_TEBUS_MURAH'
  );
  if (pwpCampaigns.length === 0) return [];

  const nonPwpSubtotal = cart.reduce((acc, item) => {
    if (!item?.product) return acc;
    if (item.promoMechanic === 'PWP_TEBUS_MURAH') return acc;
    return acc + (item.subtotal || 0);
  }, 0);

  const offers: PwpOfferStatus[] = [];
  for (const camp of pwpCampaigns) {
    const prod =
      findMatchingProduct({ targetValue: camp.targetValue }, allProducts) ||
      (Array.isArray(camp.componentSkus) && camp.componentSkus[0]
        ? findMatchingProduct({ skuId: camp.componentSkus[0].skuId, skuName: camp.componentSkus[0].skuName }, allProducts)
        : undefined);
    if (!prod || (prod.stock ?? 0) <= 0) continue;

    const regPrice = Number(prod.price_retail ?? prod.sell_price ?? prod.sellingPrice) || 0;
    const specPrice = Math.max(0, camp.pwpSpecialPrice ?? Math.max(0, regPrice - camp.discountValue));
    const minSub = Math.max(0, camp.pwpMinCartSubtotal || 0);
    const existingCartQty = cart
      .filter((it) => it.product.id === prod.id)
      .reduce((s, it) => s + (it.quantity || 0), 0);

    offers.push({
      campaign: camp,
      product: prod,
      regularPrice: regPrice,
      specialPrice: specPrice,
      minCartSubtotal: minSub,
      currentEligibleSubtotal: nonPwpSubtotal,
      shortfallAmount: Math.max(0, minSub - nonPwpSubtotal),
      isQualified: nonPwpSubtotal >= minSub,
      maxQtyPerReceipt: normalizeMaxQtyPerReceipt(camp.sourceType, camp.maxQtyPerReceipt),
      alreadyInCartQty: existingCartQty,
    });
  }
  return offers;
}

export interface SupplierTprAccountingGroup {
  supplierName: string;
  promoCode: string;
  promoName: string;
  amount: number;
  qtyUnits: number;
  productNames: string[];
}

export interface SalePromoAccountingBreakdown {
  supplierTprGroups: SupplierTprAccountingGroup[];
  fefoExp: {
    amount: number;
    qtySaved: number;
    salvageRevenue: number;
    promoCodes: string[];
    productNames: string[];
  };
  seasonalAndStore: {
    seasonalAmount: number;
    storeBndAmount: number;
    storeDiscAmount: number;
    voucherAmount: number;
    totalAmount: number;
    primarySource: 'SEASONAL' | 'STORE_BND' | 'STORE_DISC';
    promoCodes: string[];
  };
  totalPromoValue: number;
}

export function resolvePromoSupplierName(
  item: CartItem,
  campaigns?: PromoCampaign[]
): string {
  if (item.supplierName && item.supplierName.trim()) {
    return item.supplierName.trim();
  }
  const campList = campaigns || loadPromoCampaigns();
  const matchedCamp = campList.find(
    (c) =>
      (item.promoCode && c.code.toLowerCase() === String(item.promoCode).toLowerCase()) ||
      (item.promoName && c.name.toLowerCase() === String(item.promoName).toLowerCase())
  );
  if (matchedCamp?.supplierName && matchedCamp.supplierName.trim()) {
    return matchedCamp.supplierName.trim();
  }
  const pAny = item.product as any;
  const prodSupplier = pAny?.supplierName || pAny?.supplier || pAny?.manufacturer;
  if (prodSupplier && String(prodSupplier).trim()) {
    return String(prodSupplier).trim();
  }
  return 'Supplier Prinsipal Vendor';
}

/**
 * Klasifikasi nilai promo per sumber transaksi POS untuk otomasi jurnal Finance:
 * - SUPPLIER_TPR -> Piutang Rebate / Pengurang AP Supplier (1-10305)
 * - FEFO_EXP -> Beban Clearance & Penyelamatan Kadaluarsa (5-10201)
 * - SEASONAL & STORE_BND (+ STORE_DISC/voucher) -> Beban Promosi & Diskon Penjualan Toko (5-10202)
 */
export function buildSalePromoAccountingBreakdown(
  items: CartItem[] = [],
  cartVoucherDiscount: number = 0,
  campaigns?: PromoCampaign[]
): SalePromoAccountingBreakdown {
  const campList = campaigns || loadPromoCampaigns();
  const tprMap = new Map<string, SupplierTprAccountingGroup>();

  let fefoAmount = 0;
  let fefoQtySaved = 0;
  let fefoSalvageRevenue = 0;
  const fefoCodes = new Set<string>();
  const fefoProducts = new Set<string>();

  let seasonalAmount = 0;
  let storeBndAmount = 0;
  let storeDiscAmount = 0;
  const storePromoCodes = new Set<string>();

  for (const item of items) {
    if (!item?.product) continue;
    const qty = Number(item.quantity) || 0;
    const freeQty = Number(item.freeBonusQty) || 0;
    const totalUnits = qty + freeQty;
    const lineSavings = Math.round(
      item.promoSavings ?? ((item.itemDiscount || 0) * qty)
    );
    const src = item.promoSourceType;

    if (lineSavings <= 0 && src !== 'FEFO_EXP') continue;

    if (src === 'SUPPLIER_TPR') {
      const supplierName = resolvePromoSupplierName(item, campList);
      const promoCode = item.promoCode || 'TPR-VENDOR';
      const promoName = item.promoName || 'Promo Supplier TPR';
      const mapKey = `${supplierName}__${promoCode}`;
      const existing = tprMap.get(mapKey) || {
        supplierName,
        promoCode,
        promoName,
        amount: 0,
        qtyUnits: 0,
        productNames: [],
      };
      existing.amount += lineSavings;
      existing.qtyUnits += totalUnits;
      if (!existing.productNames.includes(item.product.name)) {
        existing.productNames.push(item.product.name);
      }
      tprMap.set(mapKey, existing);
    } else if (src === 'FEFO_EXP') {
      fefoAmount += lineSavings;
      fefoQtySaved += totalUnits;
      fefoSalvageRevenue += Math.max(0, Math.round(item.subtotal || 0));
      if (item.promoCode) fefoCodes.add(item.promoCode);
      fefoProducts.add(item.product.name);
    } else if (src === 'SEASONAL') {
      seasonalAmount += lineSavings;
      if (item.promoCode) storePromoCodes.add(item.promoCode);
    } else if (src === 'STORE_BND') {
      storeBndAmount += lineSavings;
      if (item.promoCode) storePromoCodes.add(item.promoCode);
    } else if (lineSavings > 0) {
      storeDiscAmount += lineSavings;
      if (item.promoCode) storePromoCodes.add(item.promoCode);
    }
  }

  const voucherAmount = Math.max(0, Math.round(cartVoucherDiscount || 0));
  const totalStorePromo = seasonalAmount + storeBndAmount + storeDiscAmount + voucherAmount;
  const primarySource: 'SEASONAL' | 'STORE_BND' | 'STORE_DISC' =
    seasonalAmount >= storeBndAmount && seasonalAmount >= storeDiscAmount + voucherAmount
      ? 'SEASONAL'
      : storeBndAmount >= storeDiscAmount + voucherAmount
      ? 'STORE_BND'
      : 'STORE_DISC';

  const supplierTprGroups = Array.from(tprMap.values()).filter((g) => g.amount > 0);
  const tprTotal = supplierTprGroups.reduce((s, g) => s + g.amount, 0);

  return {
    supplierTprGroups,
    fefoExp: {
      amount: fefoAmount,
      qtySaved: fefoQtySaved,
      salvageRevenue: fefoSalvageRevenue,
      promoCodes: Array.from(fefoCodes),
      productNames: Array.from(fefoProducts),
    },
    seasonalAndStore: {
      seasonalAmount,
      storeBndAmount,
      storeDiscAmount,
      voucherAmount,
      totalAmount: totalStorePromo,
      primarySource,
      promoCodes: Array.from(storePromoCodes),
    },
    totalPromoValue: tprTotal + fefoAmount + totalStorePromo,
  };
}

