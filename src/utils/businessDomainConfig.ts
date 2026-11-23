import {
  ActivePosType,
  BusinessDomainConfig,
  BusinessDomainSubFeatures,
  BusinessEntityProfile,
  BusinessMechanismFamily,
  BusinessModelId,
  CanonicalBusinessSector,
  OperationalTopologyMode,
  Terminal,
} from '../types';

export interface CanonicalSectorMeta {
  id: CanonicalBusinessSector;
  label: string;
  shortLabel: string;
  enterpriseBadge: string;
  description: string;
}

export const CANONICAL_SECTOR_META: Record<CanonicalBusinessSector, CanonicalSectorMeta> = {
  FNB: {
    id: 'FNB',
    label: 'Kuliner F&B (Resto & Cafe)',
    shortLabel: 'F&B',
    enterpriseBadge: 'F&B CULINARY ENTERPRISE',
    description: 'Restoran, kafe & bakery berbasis menu jadi, KOT dapur, topping & pemotongan BOM bahan baku.',
  },
  FASHION: {
    id: 'FASHION',
    label: 'Fashion & Butik',
    shortLabel: 'FASHION',
    enterpriseBadge: 'FASHION & BOUTIQUE ENTERPRISE',
    description: 'Butik & ritel busana berbasis matriks ukuran × warna, pramuniaga & penukaran artikel.',
  },
  BUILDING: {
    id: 'BUILDING',
    label: 'Bahan Bangunan & Material',
    shortLabel: 'BUILDING',
    enterpriseBadge: 'BUILDING & DEPOT ENTERPRISE',
    description: 'Depo material bangunan & konstruksi berbasis curah m³/Ret, armada DO & proyek.',
  },
  SERVICE: {
    id: 'SERVICE',
    label: 'Jasa & Layanan (Laundry / Barbershop)',
    shortLabel: 'SERVICE',
    enterpriseBadge: 'SERVICE & HOSPITALITY ENTERPRISE',
    description: 'Usaha jasa layanan Laundry kiloan/satuan, Barbershop & Salon berbasis antrean & SLA.',
  },
  RETAIL: {
    id: 'RETAIL',
    label: 'Ritel Umum & Grosir',
    shortLabel: 'RETAIL',
    enterpriseBadge: 'RETAIL ENTERPRISE',
    description: 'Minimarket, supermarket, grosir, kelontong, ATK, kosmetik, pet shop, elektronik & suplai kesehatan.',
  },
};

const CANONICAL_SECTOR_SET = new Set<CanonicalBusinessSector>([
  'FNB',
  'FASHION',
  'BUILDING',
  'SERVICE',
  'RETAIL',
]);

export const mapBusinessModelToCanonicalSector = (
  modelId?: BusinessModelId | string | null
): CanonicalBusinessSector => {
  if (!modelId) return 'RETAIL';
  const raw = String(modelId).trim();
  const upper = raw.toUpperCase();

  // Direct canonical key match
  if (CANONICAL_SECTOR_SET.has(upper as CanonicalBusinessSector)) {
    return upper as CanonicalBusinessSector;
  }

  // Explicit mapping of SuperAdmin "Jenis Usaha Utama" IDs & labels
  if (
    upper === 'RESTO_CAFE' ||
    upper === 'FNB_CULINARY' ||
    upper === 'RESTO_KAFE_BAKERY'
  ) {
    return 'FNB';
  }
  if (upper === 'FASHION_BUTIK' || upper === 'FASHION_APPAREL') {
    return 'FASHION';
  }
  if (
    upper === 'BAHAN_BANGUNAN_MATERIAL' ||
    upper === 'BUILDING_BULK' ||
    upper === 'MATERIAL_BANGUNAN_PERTANIAN' ||
    upper === 'BUILDING_MATERIALS'
  ) {
    return 'BUILDING';
  }
  if (upper === 'LAUNDRY' || upper === 'BARBERSHOP_SALON' || upper === 'SALON_LAUNDRY') {
    return 'SERVICE';
  }

  const lower = raw.toLowerCase();

  // Explicit RETAIL overrides requested (Toko Elektronik, Bengkel Otomotif, & all general retail)
  if (
    lower.includes('elektronik') ||
    lower.includes('gadget') ||
    lower.includes('bengkel') ||
    lower.includes('otomotif') ||
    lower.includes('minimarket') ||
    lower.includes('supermarket') ||
    lower.includes('grosir') ||
    lower.includes('kelontong') ||
    lower.includes('warung') ||
    lower.includes('provision') ||
    lower.includes('pet shop') ||
    lower.includes('petshop') ||
    lower.includes('kosmetik') ||
    lower.includes('kecantikan') ||
    lower.includes('alat tulis') ||
    lower.includes('atk') ||
    lower.includes('obat') ||
    lower.includes('kesehatan') ||
    lower.includes('depo & distributor') ||
    lower.includes('distributor')
  ) {
    return 'RETAIL';
  }

  if (
    lower.includes('resto') ||
    lower.includes('cafe') ||
    lower.includes('kafe') ||
    lower.includes('f&b') ||
    lower.includes('fnb') ||
    lower.includes('bakery') ||
    lower.includes('kuliner')
  ) {
    return 'FNB';
  }

  if (
    lower.includes('fashion') ||
    lower.includes('butik') ||
    lower.includes('apparel') ||
    lower.includes('busana')
  ) {
    return 'FASHION';
  }

  if (
    lower.includes('bangunan') ||
    lower.includes('material') ||
    lower.includes('building') ||
    lower.includes('hardware')
  ) {
    return 'BUILDING';
  }

  if (
    lower.includes('laundry') ||
    lower.includes('binatu') ||
    lower.includes('barbershop') ||
    lower.includes('barber') ||
    lower.includes('salon') ||
    lower.includes('pangkas')
  ) {
    return 'SERVICE';
  }

  return 'RETAIL';
};

export const resolveCanonicalSector = (
  input?:
    | Partial<BusinessEntityProfile>
    | BusinessDomainConfig
    | BusinessModelId
    | string
    | null
): CanonicalBusinessSector => {
  if (!input) return 'RETAIL';
  if (typeof input === 'string') {
    return mapBusinessModelToCanonicalSector(input);
  }

  // Case 1: BusinessDomainConfig object
  if ('primaryBusinessModel' in input && input.primaryBusinessModel) {
    return mapBusinessModelToCanonicalSector(input.primaryBusinessModel);
  }

  // Case 2: BusinessEntityProfile object
  const prof = input as Partial<BusinessEntityProfile>;
  if (prof.domainConfig?.primaryBusinessModel) {
    return mapBusinessModelToCanonicalSector(prof.domainConfig.primaryBusinessModel);
  }
  if (prof.businessType) {
    return mapBusinessModelToCanonicalSector(prof.businessType);
  }
  if (prof.category) {
    return mapBusinessModelToCanonicalSector(prof.category);
  }
  if (prof.activeSector && CANONICAL_SECTOR_SET.has(prof.activeSector)) {
    return prof.activeSector;
  }
  if (prof.sector) {
    return mapBusinessModelToCanonicalSector(prof.sector);
  }
  return 'RETAIL';
};

export interface BusinessMechanismFamilyMeta {
  id: BusinessMechanismFamily;
  code: BusinessMechanismFamily;
  label: string;
  shortLabel: string;
  mechanismBasis: string;
  description: string;
}

export interface ActivePosTypeOption {
  id: ActivePosType;
  label: string;
  shortLabel: string;
  description: string;
  terminalId: string;
  code: string;
  modelType: Terminal['modelType'];
  emoji: string;
}

export const ACTIVE_POS_TYPE_OPTIONS: ActivePosTypeOption[] = [
  {
    id: 'POS_RETAIL',
    label: 'POS Retail',
    shortLabel: 'POS Retail',
    description: 'Kasir barcode ritel cepat, tier ecer/member, promo rak & stok unit.',
    terminalId: 'T-01',
    code: 'POS-RETAIL',
    modelType: 'retail',
    emoji: '🛒',
  },
  {
    id: 'POS_GROSIR_DISTRIBUSI',
    label: 'POS Grosir & Distribusi',
    shortLabel: 'POS Grosir & Distribusi',
    description: 'Multi-tier harga karton/dus, aturan MOQ & penjualan kredit/tempo.',
    terminalId: 'T-03',
    code: 'POS-GROSIR',
    modelType: 'retail',
    emoji: '📦',
  },
  {
    id: 'POS_FNB',
    label: 'POS F&B (Resto & Cafe)',
    shortLabel: 'POS F&B',
    description: 'Menu foto kuliner, Dine-In/Takeaway, meja & pemotongan BOM bahan baku.',
    terminalId: 'T-02',
    code: 'POS-FNB',
    modelType: 'fnb',
    emoji: '🍳',
  },
  {
    id: 'POS_BANGUNAN',
    label: 'POS Bahan Bangunan & Material',
    shortLabel: 'POS Bangunan',
    description: 'Material curah m³/Ret, armada DO Frangko/Loco & margin proyek.',
    terminalId: 'T-05',
    code: 'POS-BUILD',
    modelType: 'building',
    emoji: '🏗️',
  },
  {
    id: 'POS_JASA_LAYANAN',
    label: 'POS Jasa & Layanan',
    shortLabel: 'POS Jasa & Layanan',
    description: 'Order layanan barbershop, salon, laundry kiloan/satuan & stylist.',
    terminalId: 'T-08',
    code: 'POS-SERVICE',
    modelType: 'salon',
    emoji: '💈',
  },
];

export const getActivePosTypeOption = (posType: ActivePosType): ActivePosTypeOption => {
  return (
    ACTIVE_POS_TYPE_OPTIONS.find((opt) => opt.id === posType) ||
    ACTIVE_POS_TYPE_OPTIONS[0]
  );
};

export const getPosIdentityIdForPosType = (posType: ActivePosType): string => {
  return getActivePosTypeOption(posType).terminalId;
};

export interface BusinessModelDefinition {
  id: BusinessModelId;
  label: string;
  shortLabel: string;
  family: BusinessMechanismFamily;
  defaultPosType: ActivePosType;
  categoryValue: string;
  legacyCategoryMatches: string[];
  description: string;
  defaultSubFeatures: BusinessDomainSubFeatures;
  recommendedHeaderNote: string;
  recommendedFooterNote: string;
  recommendedPosUnitCount?: number;
}

export const BUSINESS_MECHANISM_FAMILIES: Record<BusinessMechanismFamily, BusinessMechanismFamilyMeta> = {
  RETAIL_GENERAL: {
    id: 'RETAIL_GENERAL',
    code: 'RETAIL_GENERAL',
    label: 'Ritel Umum & Grosir',
    shortLabel: 'RETAIL_GENERAL',
    mechanismBasis: 'Barcode SKU, Multi-Tier Harga, Stok Unit/Box (+ Sub-Fitur MOQ/Kredit Grosir)',
    description:
      'Mekanisme kasir cepat berbasis scan barcode & manajemen stok unit/pack, dengan flag opsional Grosir (MOQ/Kredit).',
  },
  FNB_CULINARY: {
    id: 'FNB_CULINARY',
    code: 'FNB_CULINARY',
    label: 'Kuliner F&B (Menu & BOM Bahan Baku)',
    shortLabel: 'FNB_CULINARY',
    mechanismBasis: 'Berbasis Menu Jadi, Resep BOM & Pemotongan Bahan Baku Otomatis',
    description:
      'Mekanisme restoran & kafe berbasis menu jadi, varian topping/level, serta pemotongan stok bahan baku (BOM) saat checkout.',
  },
  BUILDING_BULK: {
    id: 'BUILDING_BULK',
    code: 'BUILDING_BULK',
    label: 'Material Curah & Dimensi',
    shortLabel: 'BUILDING_BULK',
    mechanismBasis: 'Berbasis Curah m³/Ret, Konversi Armada & Dimensi PxLxT',
    description:
      'Mekanisme depo bahan bangunan & material dengan dukungan satuan curah (m³, Ret Pick-up/Truk), dimensi custom, serta fraksi timbang.',
  },
  SPECIALTY_SERVICE: {
    id: 'SPECIALTY_SERVICE',
    code: 'SPECIALTY_SERVICE',
    label: 'Spesialisasi Varian & Layanan Jasa',
    shortLabel: 'SPECIALTY_SERVICE',
    mechanismBasis: 'Berbasis Matriks Varian Ukuran/Warna & Order Jasa Layanan',
    description:
      'Mekanisme fashion & butik (ukuran/warna) serta barbershop, salon & laundry berbasis order layanan jasa.',
  },
};

export const EMPTY_SUB_FEATURES: BusinessDomainSubFeatures = {
  isWholesale: false,
  hasBomRecipe: false,
  hasBulkVolumeDimension: false,
  hasVariantMatrix: false,
  hasSerialImei: false,
  hasServiceOrder: false,
};

export const BUSINESS_MODEL_DEFINITIONS: BusinessModelDefinition[] = [
  {
    id: 'TOKO_OBAT_KESEHATAN',
    label: 'Toko Obat & Suplai Kesehatan Umum',
    shortLabel: 'Toko Obat & Kesehatan',
    family: 'RETAIL_GENERAL',
    defaultPosType: 'POS_RETAIL',
    categoryValue: 'Toko Obat & Suplai Kesehatan Umum',
    legacyCategoryMatches: [
      'TOKO_OBAT_KESEHATAN',
      'Toko Obat & Suplai Kesehatan Umum',
      'Toko Obat',
      'APOTEK_FARMASI',
      'Apotek / Farmasi',
      'Apotek',
      'Farmasi',
      'Pharmacy',
      'Pharmacy & Pet Shop',
      'Pharmacy & Pet Shop (Apotek & Kebutuhan Hewan)',
    ],
    description: 'Ritel obat bebas (OTC), suplemen kesehatan & perlengkapan medis umum dengan kontrol expired FEFO.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
      isWholesale: false,
    },
    recommendedHeaderNote: 'Toko Obat & Suplai Kesehatan Terpercaya',
    recommendedFooterNote: 'Periksa kembali tanggal kedaluwarsa & kemasan produk sebelum meninggalkan kasir.',
    recommendedPosUnitCount: 1,
  },
  {
    id: 'TOKO_PROVISION_LARGE',
    label: 'Toko Provision Large',
    shortLabel: 'Provision Large',
    family: 'RETAIL_GENERAL',
    defaultPosType: 'POS_RETAIL',
    categoryValue: 'Toko Provision Large',
    legacyCategoryMatches: ['TOKO_PROVISION_LARGE', 'Toko Provision Large', 'Provision Large'],
    description: 'Toko penyedia kebutuhan harian skala besar dengan multi-rak, barcode SKU & promo paket.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
    },
    recommendedHeaderNote: 'Lengkap, Hemat & Berkualitas Setiap Hari',
    recommendedFooterNote: 'Terima kasih atas kunjungan & kepercayaan Anda berbelanja bersama kami.',
    recommendedPosUnitCount: 2,
  },
  {
    id: 'TOKO_PROVISION_SMALL',
    label: 'Toko Provision Small',
    shortLabel: 'Provision Small',
    family: 'RETAIL_GENERAL',
    defaultPosType: 'POS_RETAIL',
    categoryValue: 'Toko Provision Small',
    legacyCategoryMatches: ['TOKO_PROVISION_SMALL', 'Toko Provision Small', 'Provision Small'],
    description: 'Toko kebutuhan harian skala kecil-menengah dengan transaksi kasir cepat & manajemen stok praktis.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
    },
    recommendedHeaderNote: 'Kebutuhan Harian Praktis & Bersahabat',
    recommendedFooterNote: 'Terima kasih telah berbelanja di toko kami.',
    recommendedPosUnitCount: 1,
  },
  {
    id: 'WARUNG_KELONTONG',
    label: 'Warung / Kelontong',
    shortLabel: 'Warung/Kelontong',
    family: 'RETAIL_GENERAL',
    defaultPosType: 'POS_RETAIL',
    categoryValue: 'Warung / Kelontong',
    legacyCategoryMatches: ['WARUNG_KELONTONG', 'Warung / Kelontong', 'Warung', 'Kelontong'],
    description: 'Warung sembako & kelontong lingkungan dengan input SKU cepat eceran maupun pak.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
    },
    recommendedHeaderNote: 'Warung Kelontong Lengkap & Terjangkau',
    recommendedFooterNote: 'Terima kasih sudah mampir & berbelanja bersama kami.',
    recommendedPosUnitCount: 1,
  },
  {
    id: 'MINIMARKET',
    label: 'Minimarket',
    shortLabel: 'Minimarket',
    family: 'RETAIL_GENERAL',
    defaultPosType: 'POS_RETAIL',
    categoryValue: 'Minimarket',
    legacyCategoryMatches: [
      'MINIMARKET',
      'Minimarket',
      'MINIMARKET_SWALAYAN',
      'Ritel Modern & Multi-Industry',
      'Ritel Modern',
      'Modern Retail',
      'RETAIL',
    ],
    description: 'Ritel harian cepat saji dengan scan barcode, promo rak/bundling & kontrol stok FEFO.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
    },
    recommendedHeaderNote: 'Best Price & Quality Retail',
    recommendedFooterNote: 'Terima kasih atas kunjungan & kepercayaan Anda berbelanja bersama kami.',
    recommendedPosUnitCount: 2,
  },
  {
    id: 'SUPERMARKET',
    label: 'Supermarket',
    shortLabel: 'Supermarket',
    family: 'RETAIL_GENERAL',
    defaultPosType: 'POS_RETAIL',
    categoryValue: 'Supermarket',
    legacyCategoryMatches: ['SUPERMARKET', 'Supermarket', 'Hypermarket'],
    description: 'Ritel skala besar multi-departemen (fresh, FMCG, rumah tangga) dengan multi-kasir.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
    },
    recommendedHeaderNote: 'Fresh, Complete & Everyday Value Supermarket',
    recommendedFooterNote: 'Barang yang sudah dibeli sesuai ketentuan struk tidak dapat ditukar.',
    recommendedPosUnitCount: 3,
  },
  {
    id: 'GROSIR_BESAR',
    label: 'Grosir Besar',
    shortLabel: 'Grosir Besar',
    family: 'RETAIL_GENERAL',
    defaultPosType: 'POS_GROSIR_DISTRIBUSI',
    categoryValue: 'Grosir Besar',
    legacyCategoryMatches: [
      'GROSIR_BESAR',
      'Grosir Besar',
      'GROSIR_SEMBAKO',
      'Grosir & Sembako',
      'Grosir',
      'Wholesaler',
      'Retail & Wholesaler Modern',
    ],
    description: 'Perdagangan grosir volume besar dengan MOQ, harga bertingkat (dus/karton) & piutang/kredit.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
      isWholesale: true,
    },
    recommendedHeaderNote: 'Pusat Grosir Besar Harga Terbaik',
    recommendedFooterNote: 'Periksa kembali jumlah dus/karton sebelum meninggalkan area muat.',
    recommendedPosUnitCount: 2,
  },
  {
    id: 'GROSIR_KECIL',
    label: 'Grosir Kecil / Semi-Grosir',
    shortLabel: 'Semi-Grosir',
    family: 'RETAIL_GENERAL',
    defaultPosType: 'POS_GROSIR_DISTRIBUSI',
    categoryValue: 'Grosir Kecil / Semi-Grosir',
    legacyCategoryMatches: [
      'GROSIR_KECIL',
      'Grosir Kecil / Semi-Grosir',
      'Semi-Grosir',
      'Grosir Kecil',
    ],
    description: 'Usaha semi-grosir melayani agen pengecer & pembeli ecer dengan tier harga bertingkat.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
      isWholesale: true,
    },
    recommendedHeaderNote: 'Grosir & Eceran Harga Bersahabat',
    recommendedFooterNote: 'Terima kasih atas kerja sama & kepercayaan Anda.',
    recommendedPosUnitCount: 2,
  },
  {
    id: 'DEPO_DISTRIBUTOR',
    label: 'Depo & Distributor',
    shortLabel: 'Depo & Distributor',
    family: 'RETAIL_GENERAL',
    defaultPosType: 'POS_GROSIR_DISTRIBUSI',
    categoryValue: 'Depo & Distributor',
    legacyCategoryMatches: [
      'DEPO_DISTRIBUTOR',
      'Depo & Distributor',
      'Distributor',
      'Depo',
    ],
    description: 'Distribusi B2B partai besar dengan manajemen MOQ, faktur tempo & rute pengiriman stok.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
      isWholesale: true,
    },
    recommendedHeaderNote: 'Depo & Mitra Distribusi Terpercaya',
    recommendedFooterNote: 'Harap verifikasi segel & jumlah barang saat serah terima armada.',
    recommendedPosUnitCount: 2,
  },
  {
    id: 'RESTO_CAFE',
    label: 'Resto & Cafe',
    shortLabel: 'Resto & Cafe',
    family: 'FNB_CULINARY',
    defaultPosType: 'POS_FNB',
    categoryValue: 'Resto & Cafe',
    legacyCategoryMatches: [
      'RESTO_CAFE',
      'Resto & Cafe',
      'RESTO_KAFE_BAKERY',
      'F&B',
      'FNB',
      'Food & Beverage (F&B)',
      'Food & Beverage (F&B Restoran & Cafe)',
      'Resto',
      'Kafe',
      'Cafe',
      'Bakery',
    ],
    description: 'Operasional restoran & kafe berbasis Menu Jadi serta resep BOM bahan baku dapur.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
      hasBomRecipe: true,
    },
    recommendedHeaderNote: 'Fresh Kitchen & Signature Coffee Experience',
    recommendedFooterNote: 'Selamat menikmati hidangan kami. Terima kasih atas kunjungannya!',
    recommendedPosUnitCount: 2,
  },
  {
    id: 'BAHAN_BANGUNAN_MATERIAL',
    label: 'Bahan Bangunan & Material',
    shortLabel: 'Bahan Bangunan',
    family: 'BUILDING_BULK',
    defaultPosType: 'POS_BANGUNAN',
    categoryValue: 'Bahan Bangunan & Material',
    legacyCategoryMatches: [
      'BAHAN_BANGUNAN_MATERIAL',
      'Bahan Bangunan & Material',
      'MATERIAL_BANGUNAN_PERTANIAN',
      'Building',
      'Building Materials & Hardware',
      'Building Materials & Hardware (Bahan Bangunan)',
      'Material Bangunan',
      'Besi/Kayu',
      'Pertanian',
      'BUILDING_MATERIALS',
    ],
    description: 'Depo material bangunan & konstruksi berbasis curah m³/Ret, armada DO & dimensi.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
      hasBulkVolumeDimension: true,
    },
    recommendedHeaderNote: 'Depo Bahan Bangunan & Material Konstruksi Terlengkap',
    recommendedFooterNote: 'Pengiriman armada & bongkar sesuai kesepakatan nota. Terima kasih.',
    recommendedPosUnitCount: 2,
  },
  {
    id: 'PET_SHOP',
    label: 'Pet Shop',
    shortLabel: 'Pet Shop',
    family: 'RETAIL_GENERAL',
    defaultPosType: 'POS_RETAIL',
    categoryValue: 'Pet Shop',
    legacyCategoryMatches: ['PET_SHOP', 'Pet Shop', 'Petshop', 'Kebutuhan Hewan'],
    description: 'Toko makanan hewan peliharaan, aksesoris & perlengkapan perawatan hewan kesayangan.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
    },
    recommendedHeaderNote: 'Pet Shop & Sahabat Hewan Kesayangan Anda',
    recommendedFooterNote: 'Terima kasih telah mempercayakan kebutuhan anabul bersama kami.',
    recommendedPosUnitCount: 1,
  },
  {
    id: 'BARBERSHOP_SALON',
    label: 'Barbershop & Salon',
    shortLabel: 'Barbershop & Salon',
    family: 'SPECIALTY_SERVICE',
    defaultPosType: 'POS_JASA_LAYANAN',
    categoryValue: 'Barbershop & Salon',
    legacyCategoryMatches: [
      'BARBERSHOP_SALON',
      'Barbershop & Salon',
      'Salon & Barbershop (Jasa & Grooming)',
      'Salon & Service',
      'Salon',
      'Barbershop',
      'SALON_LAUNDRY',
      'BENGKEL_SALON_LAUNDRY',
    ],
    description: 'Usaha jasa pangkas rambut, perawatan salon & grooming dengan pencatatan stylist dan komisi.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
      hasServiceOrder: true,
    },
    recommendedHeaderNote: 'Grooming & Hair Styling Profesional',
    recommendedFooterNote: 'Terima kasih atas kunjungannya, sampai jumpa di sesi perawatan berikutnya!',
    recommendedPosUnitCount: 1,
  },
  {
    id: 'LAUNDRY',
    label: 'Laundry',
    shortLabel: 'Laundry',
    family: 'SPECIALTY_SERVICE',
    defaultPosType: 'POS_JASA_LAYANAN',
    categoryValue: 'Laundry',
    legacyCategoryMatches: ['LAUNDRY', 'Laundry', 'Laundry Kiloan', 'Binatu'],
    description: 'Layanan cuci setrika kiloan & satuan dengan order jasa layanan dan status penyelesaian.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
      hasServiceOrder: true,
    },
    recommendedHeaderNote: 'Bersih, Wangi & Tepat Waktu',
    recommendedFooterNote: 'Simpan nota ini sebagai bukti pengambilan cucian Anda.',
    recommendedPosUnitCount: 1,
  },
  {
    id: 'TOKO_KOSMETIK_KECANTIKAN',
    label: 'Toko Kosmetik & Kecantikan',
    shortLabel: 'Kosmetik & Kecantikan',
    family: 'RETAIL_GENERAL',
    defaultPosType: 'POS_RETAIL',
    categoryValue: 'Toko Kosmetik & Kecantikan',
    legacyCategoryMatches: [
      'TOKO_KOSMETIK_KECANTIKAN',
      'Toko Kosmetik & Kecantikan',
      'Kosmetik',
      'Skincare',
      'Beauty Store',
    ],
    description: 'Ritel skincare, kosmetik & produk perawatan kecantikan dengan kontrol expired FEFO & bundling.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
    },
    recommendedHeaderNote: 'Authentic Skincare & Beauty Essentials',
    recommendedFooterNote: 'Produk yang sudah dibuka segelnya tidak dapat ditukar.',
    recommendedPosUnitCount: 1,
  },
  {
    id: 'TOKO_ATK',
    label: 'Toko Alat Tulis (ATK)',
    shortLabel: 'Toko ATK',
    family: 'RETAIL_GENERAL',
    defaultPosType: 'POS_RETAIL',
    categoryValue: 'Toko Alat Tulis (ATK)',
    legacyCategoryMatches: [
      'TOKO_ATK',
      'Toko Alat Tulis (ATK)',
      'ATK',
      'Alat Tulis',
      'Stationery',
    ],
    description: 'Toko alat tulis kantor, perlengkapan sekolah & cetak dokumen dengan harga satuan dan pak.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
    },
    recommendedHeaderNote: 'Pusat Alat Tulis Kantor & Sekolah Lengkap',
    recommendedFooterNote: 'Terima kasih telah berbelanja perlengkapan tulis bersama kami.',
    recommendedPosUnitCount: 1,
  },
  {
    id: 'FASHION_BUTIK',
    label: 'Fashion & Butik',
    shortLabel: 'Fashion & Butik',
    family: 'SPECIALTY_SERVICE',
    defaultPosType: 'POS_RETAIL',
    categoryValue: 'Fashion & Butik',
    legacyCategoryMatches: [
      'FASHION_BUTIK',
      'Fashion & Butik',
      'FASHION_APPAREL',
      'Fashion',
      'Fashion & Apparel',
      'Fashion & Apparel (Butik & Busana)',
      'Butik',
    ],
    description: 'Butik & ritel busana berbasis matriks varian ukuran (S-XXL), warna & koleksi musiman.',
    defaultSubFeatures: {
      ...EMPTY_SUB_FEATURES,
      hasVariantMatrix: true,
    },
    recommendedHeaderNote: 'Curated Fashion & Boutique Apparel',
    recommendedFooterNote: 'Penukaran ukuran maksimal 3 hari dengan hangtag masih terpasang.',
    recommendedPosUnitCount: 1,
  },
];

export const getBusinessModelDefinition = (modelId: BusinessModelId): BusinessModelDefinition => {
  return (
    BUSINESS_MODEL_DEFINITIONS.find((m) => m.id === modelId) ||
    BUSINESS_MODEL_DEFINITIONS.find((m) => m.id === 'MINIMARKET') ||
    BUSINESS_MODEL_DEFINITIONS[0]
  );
};

export const resolveBusinessModelId = (modelOrCategory?: string | null): BusinessModelId => {
  if (!modelOrCategory) return 'MINIMARKET';
  const raw = modelOrCategory.trim();
  const upper = raw.toUpperCase();

  // Direct ID match
  const exactIdMatch = BUSINESS_MODEL_DEFINITIONS.find((m) => m.id === upper);
  if (exactIdMatch) return exactIdMatch.id;

  // Exact legacy category match
  const exactLegacy = BUSINESS_MODEL_DEFINITIONS.find((m) =>
    m.legacyCategoryMatches.some((c) => c.toLowerCase() === raw.toLowerCase())
  );
  if (exactLegacy) return exactLegacy.id;

  // Fuzzy keyword fallback
  const lower = raw.toLowerCase();
  if (lower.includes('obat') || lower.includes('kesehatan') || lower.includes('apotek') || lower.includes('farmasi') || lower.includes('pharmacy')) {
    return 'TOKO_OBAT_KESEHATAN';
  }
  if (lower.includes('provision large')) return 'TOKO_PROVISION_LARGE';
  if (lower.includes('provision small') || lower.includes('provision')) return 'TOKO_PROVISION_SMALL';
  if (lower.includes('warung') || lower.includes('kelontong')) return 'WARUNG_KELONTONG';
  if (lower.includes('depo') || lower.includes('distributor')) return 'DEPO_DISTRIBUTOR';
  if (lower.includes('semi-grosir') || lower.includes('grosir kecil')) return 'GROSIR_KECIL';
  if (lower.includes('grosir') || lower.includes('sembako') || lower.includes('wholesale')) {
    return 'GROSIR_BESAR';
  }
  if (lower.includes('supermarket') || lower.includes('hypermarket')) {
    return 'SUPERMARKET';
  }
  if (
    lower.includes('f&b') ||
    lower.includes('fnb') ||
    lower.includes('resto') ||
    lower.includes('kafe') ||
    lower.includes('cafe') ||
    lower.includes('bakery')
  ) {
    return 'RESTO_CAFE';
  }
  if (
    lower.includes('bangunan') ||
    lower.includes('building') ||
    lower.includes('hardware') ||
    lower.includes('material')
  ) {
    return 'BAHAN_BANGUNAN_MATERIAL';
  }
  if (lower.includes('pet')) return 'PET_SHOP';
  if (lower.includes('laundry') || lower.includes('binatu')) return 'LAUNDRY';
  if (lower.includes('barber') || lower.includes('salon') || lower.includes('pangkas')) {
    return 'BARBERSHOP_SALON';
  }
  if (lower.includes('kosmetik') || lower.includes('kecantikan') || lower.includes('skincare') || lower.includes('beauty')) {
    return 'TOKO_KOSMETIK_KECANTIKAN';
  }
  if (lower.includes('atk') || lower.includes('alat tulis') || lower.includes('stationery')) {
    return 'TOKO_ATK';
  }
  if (lower.includes('fashion') || lower.includes('apparel') || lower.includes('butik') || lower.includes('busana')) {
    return 'FASHION_BUTIK';
  }

  return 'MINIMARKET';
};

export const ACTIVE_CASHIER_QUOTA_STORAGE_KEY = 'jacs_active_cashier_quota_v1';

export const getStoredActiveCashierQuota = (): number => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(ACTIVE_CASHIER_QUOTA_STORAGE_KEY);
      if (raw) {
        const parsed = parseInt(raw, 10);
        if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 10) {
          return parsed;
        }
      }
    } catch {}
  }
  return 2;
};

export const createBusinessDomainConfig = (
  modelOrCategory?: BusinessModelId | string,
  overrides?: {
    isHybridMultiUnit?: boolean;
    activePosTypes?: ActivePosType[];
    subFeatures?: Partial<BusinessDomainSubFeatures>;
    enabledHybridModels?: BusinessModelId[];
    operationalTopology?: OperationalTopologyMode;
    activeStationCount?: number;
  }
): BusinessDomainConfig => {
  const modelId = resolveBusinessModelId(modelOrCategory);
  const def = getBusinessModelDefinition(modelId);

  const resolvedPosTypes =
    overrides?.activePosTypes && overrides.activePosTypes.length > 0
      ? Array.from(new Set(overrides.activePosTypes))
      : [def.defaultPosType];
  const storedQuota = getStoredActiveCashierQuota();
  const resolvedStationCount = Math.max(
    1,
    Math.min(10, Number(overrides?.activeStationCount ?? storedQuota ?? 2) || 2)
  );

  return {
    primaryBusinessModel: def.id,
    mechanismFamily: def.family,
    activePosTypes: resolvedPosTypes,
    isHybridMultiUnit: overrides?.isHybridMultiUnit ?? false,
    subFeatures: {
      ...def.defaultSubFeatures,
      ...(overrides?.subFeatures || {}),
    },
    enabledHybridModels: overrides?.isHybridMultiUnit
      ? overrides?.enabledHybridModels || []
      : [],
    operationalTopology: 'NON_BLOCKING_ERP',
    activeStationCount: resolvedStationCount,
  };
};

export const getEffectiveBusinessDomainConfig = (
  profile?: Partial<BusinessEntityProfile> | null
): BusinessDomainConfig => {
  if (!profile) {
    return createBusinessDomainConfig('MINIMARKET');
  }

  const resolvedTopology: OperationalTopologyMode = 'NON_BLOCKING_ERP';
  const storedQuota = getStoredActiveCashierQuota();
  const enforcedQuotaCount = Math.max(1, Math.min(10, Number(storedQuota) || 2));

  if (profile.domainConfig?.primaryBusinessModel) {
    const resolvedModelId = resolveBusinessModelId(profile.domainConfig.primaryBusinessModel);
    const def = getBusinessModelDefinition(resolvedModelId);
    const isHybrid = Boolean(profile.domainConfig.isHybridMultiUnit);
    const storedPosTypes = Array.isArray(profile.domainConfig.activePosTypes)
      ? profile.domainConfig.activePosTypes.filter((t): t is ActivePosType =>
          ACTIVE_POS_TYPE_OPTIONS.some((opt) => opt.id === t)
        )
      : [];
    const effectivePosTypes: ActivePosType[] =
      isHybrid && storedPosTypes.length > 0
        ? Array.from(new Set([def.defaultPosType, ...storedPosTypes]))
        : [def.defaultPosType];

    const rawSub = (profile.domainConfig.subFeatures || {}) as Partial<BusinessDomainSubFeatures>;
    const activeStationCount = enforcedQuotaCount;

    return {
      primaryBusinessModel: def.id,
      mechanismFamily: def.family,
      activePosTypes: effectivePosTypes,
      isHybridMultiUnit: Boolean(profile.domainConfig.isHybridMultiUnit),
      subFeatures: {
        ...def.defaultSubFeatures,
        isWholesale: rawSub.isWholesale ?? def.defaultSubFeatures.isWholesale,
        hasBomRecipe: rawSub.hasBomRecipe ?? def.defaultSubFeatures.hasBomRecipe,
        hasBulkVolumeDimension: rawSub.hasBulkVolumeDimension ?? def.defaultSubFeatures.hasBulkVolumeDimension,
        hasVariantMatrix: rawSub.hasVariantMatrix ?? def.defaultSubFeatures.hasVariantMatrix,
        hasSerialImei: rawSub.hasSerialImei ?? def.defaultSubFeatures.hasSerialImei,
        hasServiceOrder: rawSub.hasServiceOrder ?? def.defaultSubFeatures.hasServiceOrder,
      },
      enabledHybridModels: profile.domainConfig.isHybridMultiUnit
        ? (profile.domainConfig.enabledHybridModels || []).map((id) => resolveBusinessModelId(id))
        : [],
      operationalTopology: resolvedTopology,
      activeStationCount,
    };
  }

  return createBusinessDomainConfig(profile.businessType || profile.category, {
    operationalTopology: resolvedTopology,
    activeStationCount: enforcedQuotaCount,
  });
};

export const ACTIVE_BUSINESS_PROFILE_STORAGE_KEY = 'jacs_active_business_profile_v1';

export const LEGACY_BUSINESS_PROFILE_KEYS = [
  'jacs_erp_business_profile',
  'jacs_company_profile',
  'jacs_retailos_erp_v2_2_business_profile',
] as const;

export const normalizeBusinessProfileDomain = <T extends BusinessEntityProfile>(
  profile: T
): T => {
  const domainConfig = getEffectiveBusinessDomainConfig(profile);
  const def = getBusinessModelDefinition(domainConfig.primaryBusinessModel);
  const canonicalSector = resolveCanonicalSector(domainConfig);
  const effectiveName = profile.name || profile.businessName || 'JacS Enterprise';
  const effectiveStations = domainConfig.activeStationCount ?? 2;
  return {
    ...profile,
    name: effectiveName,
    businessName: effectiveName,
    category: def.categoryValue,
    businessType: def.id,
    activeSector: canonicalSector,
    sector: canonicalSector,
    posMode: domainConfig.activePosTypes?.[0] || def.defaultPosType,
    cashiers: effectiveStations,
    operationalTopology: domainConfig.operationalTopology,
    posUnitCount: effectiveStations,
    domainConfig,
  };
};

export const saveActiveBusinessProfileToStorage = <T extends BusinessEntityProfile>(
  profile: T
): T => {
  const normalized = normalizeBusinessProfileDomain({
    ...profile,
    updatedAt: Date.now(),
  });
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return normalized;
  }

  const writeAllKeys = (payload: T) => {
    const serialized = JSON.stringify(payload);
    localStorage.setItem(ACTIVE_BUSINESS_PROFILE_STORAGE_KEY, serialized);
    LEGACY_BUSINESS_PROFILE_KEYS.forEach((legacyKey) => {
      try {
        localStorage.setItem(legacyKey, serialized);
      } catch {
        // Jangan biarkan kegagalan key legacy mengganggu kunci utama
      }
    });
  };

  try {
    writeAllKeys(normalized);
  } catch {
    // Bebaskan cache besar non-kritis agar profil & sektor aktif selalu tersimpan atomik
    try {
      localStorage.removeItem('jacs_retailos_erp_v2_2_audit_logs');
      localStorage.removeItem('jacs_retailos_erp_v2_2_journals');
      writeAllKeys(normalized);
    } catch {
      try {
        // Fallback terakhir: pangkas logo base64 super besar jika kuota penuh, pertahankan seluruh konfigurasi sektor
        const compactPayload: T = {
          ...normalized,
          logoUrl:
            normalized.logoUrl && normalized.logoUrl.startsWith('data:') && normalized.logoUrl.length > 50000
              ? ''
              : normalized.logoUrl,
        };
        writeAllKeys(compactPayload);
      } catch {}
    }
  }

  return normalized;
};

export const loadActiveBusinessProfileFromStorage = <T extends BusinessEntityProfile>(
  fallbackDefault: T
): T => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return normalizeBusinessProfileDomain(fallbackDefault);
  }

  const isValidProfileObj = (obj: any): obj is Partial<BusinessEntityProfile> =>
    Boolean(
      obj &&
        typeof obj === 'object' &&
        (obj.domainConfig?.primaryBusinessModel ||
          obj.businessType ||
          obj.sector ||
          obj.category ||
          obj.name ||
          obj.businessName)
    );

  // 1. Prioritas utama: Single Source of Truth key (jacs_active_business_profile_v1)
  try {
    const canonicalRaw = localStorage.getItem(ACTIVE_BUSINESS_PROFILE_STORAGE_KEY);
    if (canonicalRaw) {
      const parsed = JSON.parse(canonicalRaw);
      if (isValidProfileObj(parsed)) {
        return normalizeBusinessProfileDomain({
          ...fallbackDefault,
          ...parsed,
        } as T);
      }
    }
  } catch {}

  // 2. Migrasi satu kali dari legacy keys (pilih yang terbaru berdasarkan updatedAt, atau dahulukan key yang ditulis SuperAdmin)
  let bestCandidate: any = null;
  let bestUpdatedAt = -1;

  for (const key of LEGACY_BUSINESS_PROFILE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!isValidProfileObj(parsed)) continue;
      const ts = typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0;
      if (!bestCandidate || ts > bestUpdatedAt) {
        bestCandidate = parsed;
        bestUpdatedAt = ts;
      }
    } catch {}
  }

  if (bestCandidate) {
    const migrated = normalizeBusinessProfileDomain({
      ...fallbackDefault,
      ...bestCandidate,
    } as T);
    try {
      localStorage.setItem(ACTIVE_BUSINESS_PROFILE_STORAGE_KEY, JSON.stringify(migrated));
    } catch {}
    return migrated;
  }

  return normalizeBusinessProfileDomain(fallbackDefault);
};

export const deriveExecutiveVerticalFromProfile = (
  profile?: Partial<BusinessEntityProfile> | null
): CanonicalBusinessSector => {
  return resolveCanonicalSector(profile);
};

export const getPosIdentityIdForBusinessModel = (
  modelId: BusinessModelId,
  _categoryHint?: string | null
): string => {
  const def = getBusinessModelDefinition(modelId);
  return getPosIdentityIdForPosType(def.defaultPosType);
};

export const ALL_POS_IDENTITY_IDS = [
  'T-01',
  'T-03',
  'T-02',
  'T-05',
  'T-08',
] as const;

export const getAllowedPosIdentityIds = (
  config: BusinessDomainConfig,
  categoryHint?: string | null
): string[] => {
  const ids = new Set<string>();
  const posTypes =
    config.activePosTypes && config.activePosTypes.length > 0
      ? config.activePosTypes
      : [getBusinessModelDefinition(config.primaryBusinessModel).defaultPosType];

  posTypes.forEach((posType) => {
    ids.add(getPosIdentityIdForPosType(posType));
  });

  if (config.isHybridMultiUnit && config.enabledHybridModels && config.enabledHybridModels.length > 0) {
    config.enabledHybridModels.forEach((m) => {
      ids.add(getPosIdentityIdForBusinessModel(m, categoryHint));
    });
  }

  return Array.from(ids);
};

export const PETTY_CASH_MANUAL_REASON_OPTION = 'Alasan Lainnya (Ketik Manual)...';

export type PettyCashPresetProfileKey =
  | 'SERVICE_BARBERSHOP'
  | 'SERVICE_LAUNDRY'
  | 'FNB'
  | 'BUILDING'
  | 'RETAIL_FASHION';

export const PETTY_CASH_REASON_PRESETS_BY_SECTOR: Record<PettyCashPresetProfileKey, string[]> = {
  SERVICE_BARBERSHOP: [
    'Beli silet cukur, bedak leher & kapas',
    'Beli handuk kecil / tisu / pomade darurat',
    'Beli air galon & minuman pelanggan',
    'Token listrik / pulsa operasional',
    PETTY_CASH_MANUAL_REASON_OPTION,
  ],
  SERVICE_LAUNDRY: [
    'Beli deterjen / parfum laundry darurat',
    'Beli gas LPG setrika uap',
    'Beli plastik packing & hanger',
    'Biaya antar-jemput kurir',
    PETTY_CASH_MANUAL_REASON_OPTION,
  ],
  FNB: [
    'Beli es batu kristal & air galon',
    'Beli gas LPG & bahan segar darurat',
    'Beli kemasan take-away / sedotan',
    'Uang kebersihan & keamanan',
    PETTY_CASH_MANUAL_REASON_OPTION,
  ],
  BUILDING: [
    'Uang kuli bongkar muat barang',
    'Beli solar / bensin armada kirim',
    'Beli tali rafia / plastik terpal',
    'Biaya makan & air minum sopir',
    PETTY_CASH_MANUAL_REASON_OPTION,
  ],
  RETAIL_FASHION: [
    'Beli kantong plastik, lakban & kertas struk',
    'Beli air galon & perlengkapan kebersihan',
    'Biaya pengiriman / kurir lokal',
    'Token listrik / internet toko',
    PETTY_CASH_MANUAL_REASON_OPTION,
  ],
};

export const resolvePettyCashPresetProfileKey = (
  activeSector?: CanonicalBusinessSector | string | null,
  subProfileHint?: string | null
): PettyCashPresetProfileKey => {
  const sectorUpper = String(activeSector || '').trim().toUpperCase();
  const hintLower = String(subProfileHint || '').trim().toLowerCase();

  if (
    sectorUpper === 'FNB' ||
    hintLower.includes('resto') ||
    hintLower.includes('cafe') ||
    hintLower.includes('f&b') ||
    hintLower.includes('fnb')
  ) {
    return 'FNB';
  }

  if (
    sectorUpper === 'BUILDING' ||
    hintLower.includes('bangunan') ||
    hintLower.includes('material') ||
    hintLower.includes('building')
  ) {
    return 'BUILDING';
  }

  if (
    sectorUpper === 'SERVICE' ||
    hintLower.includes('barber') ||
    hintLower.includes('salon') ||
    hintLower.includes('laundry') ||
    hintLower.includes('binatu') ||
    hintLower.includes('jasa')
  ) {
    if (hintLower.includes('laundry') || hintLower.includes('binatu')) {
      return 'SERVICE_LAUNDRY';
    }
    return 'SERVICE_BARBERSHOP';
  }

  return 'RETAIL_FASHION';
};

export const getPettyCashReasonPresets = (
  activeSector?: CanonicalBusinessSector | string | null,
  subProfileHint?: string | null
): string[] => {
  const key = resolvePettyCashPresetProfileKey(activeSector, subProfileHint);
  return PETTY_CASH_REASON_PRESETS_BY_SECTOR[key];
};

