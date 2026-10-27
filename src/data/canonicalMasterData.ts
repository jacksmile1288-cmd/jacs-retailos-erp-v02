import { BrandMaster, CategoryMaster, SupplierMaster, CustomerMaster, Product } from '../types';
import { DUMMY_STORE_CUSTOMERS } from './customerData';

export { DUMMY_STORE_CUSTOMERS };

// Master Category baku resmi ERP (30 Kategori Ritel Standar)
export interface ErpCategoryItem {
  code: number;
  name: string;
  department: string;
}

export const ERP_CATEGORIES: ErpCategoryItem[] = [
  { code: 1, name: 'Energy Drink', department: 'Beverages' },
  { code: 2, name: 'Cooking Oil', department: 'Basic Foods' },
  { code: 3, name: 'Condiments & Seasonings', department: 'Condiments & Seasonings' },
  { code: 4, name: 'Margarine', department: 'Dairy & Baking' },
  { code: 5, name: 'Tea', department: 'Beverages' },
  { code: 6, name: 'Snack', department: 'Snacks & Confectionery' },
  { code: 7, name: 'Biscuit', department: 'Snacks & Confectionery' },
  { code: 8, name: 'Instant Noodle', department: 'Instant Foods' },
  { code: 9, name: 'Mineral Water', department: 'Beverages' },
  { code: 10, name: 'Coffee', department: 'Beverages' },
  { code: 11, name: 'Milk', department: 'Dairy & Nutrition' },
  { code: 12, name: 'Sweetened Condensed Milk', department: 'Dairy & Canned Milk' },
  { code: 13, name: 'Detergent', department: 'Home Care' },
  { code: 14, name: 'Toilet Soap', department: 'Personal Care' },
  { code: 15, name: 'Shampoo', department: 'Hair Care' },
  { code: 16, name: 'Toothpaste', department: 'Oral Care' },
  { code: 17, name: 'Tissue', department: 'Paper Goods' },
  { code: 18, name: 'Soft Drink', department: 'Beverages' },
  { code: 19, name: 'Canned Food', department: 'Canned Foods' },
  { code: 20, name: 'Sweet Soy Sauce', department: 'Condiments & Seasonings' },
  { code: 21, name: 'Rice & Sembako', department: 'Basic Foods' },
  { code: 22, name: 'Confectionery', department: 'Snacks & Confectionery' },
  { code: 23, name: 'Baby Care', department: 'Baby Care' },
  { code: 24, name: 'Personal Care', department: 'Personal Care & Grooming' },
  { code: 25, name: 'Dishwashing Liquid', department: 'Home Care' },
  { code: 26, name: 'Pharmacy & OTC', department: 'Health & Pharmacy' },
  { code: 27, name: 'Battery & Electronics', department: 'Hardware & Electronics' },
  { code: 28, name: 'Ice Cream', department: 'Frozen & Dairy' },
  { code: 29, name: 'Frozen Food', department: 'Frozen & Ready to Cook' },
  { code: 30, name: 'Bread & Bakery', department: 'Bakery & Fresh' },
];

export interface CategoryLocalization {
  en: string;
  id: string;
  deptEn: string;
  deptId: string;
}

export const CATEGORY_LOCALIZATIONS: Record<number, CategoryLocalization> = {
  1: { en: 'Energy Drink', id: 'Minuman Energi', deptEn: 'Beverages', deptId: 'Minuman' },
  2: { en: 'Cooking Oil', id: 'Minyak Goreng', deptEn: 'Basic Foods', deptId: 'Kebutuhan Pokok' },
  3: { en: 'Condiments & Seasonings', id: 'Saus & Kecap', deptEn: 'Condiments & Seasonings', deptId: 'Bumbu & Saus' },
  4: { en: 'Margarine', id: 'Margarin', deptEn: 'Dairy & Baking', deptId: 'Produk Susu & Bahan Roti' },
  5: { en: 'Tea', id: 'Teh', deptEn: 'Beverages', deptId: 'Minuman' },
  6: { en: 'Snack', id: 'Makanan Ringan', deptEn: 'Snacks & Confectionery', deptId: 'Makanan Ringan' },
  7: { en: 'Biscuit', id: 'Biskuit', deptEn: 'Snacks & Confectionery', deptId: 'Makanan Ringan' },
  8: { en: 'Instant Noodle', id: 'Mi Instan', deptEn: 'Instant Foods', deptId: 'Makanan Instan' },
  9: { en: 'Mineral Water', id: 'Air Mineral', deptEn: 'Beverages', deptId: 'Minuman' },
  10: { en: 'Coffee', id: 'Kopi', deptEn: 'Beverages', deptId: 'Minuman' },
  11: { en: 'Milk', id: 'Susu', deptEn: 'Dairy & Nutrition', deptId: 'Susu & Nutrisi' },
  12: { en: 'Sweetened Condensed Milk', id: 'Susu Kental Manis', deptEn: 'Dairy & Canned Milk', deptId: 'Susu Olahan' },
  13: { en: 'Detergent', id: 'Deterjen', deptEn: 'Home Care', deptId: 'Pembersih Rumah Tangga' },
  14: { en: 'Toilet Soap', id: 'Sabun Mandi', deptEn: 'Personal Care', deptId: 'Perawatan Tubuh' },
  15: { en: 'Shampoo', id: 'Sampo', deptEn: 'Hair Care', deptId: 'Perawatan Rambut' },
  16: { en: 'Toothpaste', id: 'Pasta Gigi', deptEn: 'Oral Care', deptId: 'Perawatan Gigi' },
  17: { en: 'Tissue', id: 'Tisu', deptEn: 'Paper Goods', deptId: 'Kertas & Tisu' },
  18: { en: 'Soft Drink', id: 'Minuman Bersoda', deptEn: 'Beverages', deptId: 'Minuman' },
  19: { en: 'Canned Food', id: 'Makanan Kaleng', deptEn: 'Canned Foods', deptId: 'Makanan Kaleng' },
  20: { en: 'Sweet Soy Sauce', id: 'Kecap Manis', deptEn: 'Condiments & Seasonings', deptId: 'Bumbu & Saus' },
  21: { en: 'Rice & Sembako', id: 'Beras & Sembako', deptEn: 'Basic Foods', deptId: 'Kebutuhan Pokok' },
  22: { en: 'Confectionery', id: 'Permen & Cokelat', deptEn: 'Snacks & Confectionery', deptId: 'Makanan Ringan' },
  23: { en: 'Baby Care', id: 'Perlengkapan Bayi', deptEn: 'Baby Care', deptId: 'Produk Bayi' },
  24: { en: 'Personal Care', id: 'Perawatan Diri', deptEn: 'Personal Care', deptId: 'Perawatan Diri' },
  25: { en: 'Dishwashing Liquid', id: 'Pencuci Piring', deptEn: 'Home Care', deptId: 'Pembersih Rumah Tangga' },
  26: { en: 'Pharmacy & OTC', id: 'Farmasi & Obat Bebas', deptEn: 'Health & Pharmacy', deptId: 'Kesehatan & Obat' },
  27: { en: 'Battery & Electronics', id: 'Baterai & Elektronik', deptEn: 'Hardware & Electronics', deptId: 'Perkakas & Elektronik' },
  28: { en: 'Ice Cream', id: 'Es Krim', deptEn: 'Frozen & Dairy', deptId: 'Produk Beku & Es' },
  29: { en: 'Frozen Food', id: 'Makanan Beku', deptEn: 'Frozen Foods', deptId: 'Makanan Beku' },
  30: { en: 'Bread & Bakery', id: 'Roti & Kue', deptEn: 'Bakery & Fresh', deptId: 'Roti & Makanan Segar' },
};

export const getCleanCategoryName = (catCodeOrName: number | string | undefined | null, lang: 'id' | 'en' = 'en'): string => {
  if (!catCodeOrName) return lang === 'en' ? 'General Category' : 'Kategori Umum';
  const codeNum = typeof catCodeOrName === 'number' ? catCodeOrName : parseInt(String(catCodeOrName), 10);
  if (!isNaN(codeNum) && CATEGORY_LOCALIZATIONS[codeNum]) {
    return lang === 'en' ? CATEGORY_LOCALIZATIONS[codeNum].en : CATEGORY_LOCALIZATIONS[codeNum].id;
  }
  const str = String(catCodeOrName).trim();
  if (str.includes('/')) {
    const parts = str.split('/').map((s) => s.trim());
    if (lang === 'en') {
      return parts[0].replace(/\(.*\)/g, '').trim() || parts[0];
    } else {
      const cleanSecond = (parts[1] || parts[0]).replace(/\(.*\)/g, '').trim();
      return cleanSecond || parts[0];
    }
  }
  const lower = str.toLowerCase();
  for (const item of Object.values(CATEGORY_LOCALIZATIONS)) {
    if (item.en.toLowerCase() === lower || item.id.toLowerCase() === lower) {
      return lang === 'en' ? item.en : item.id;
    }
  }
  return str;
};

export const getCleanDepartmentName = (catCodeOrDept: number | string | undefined | null, lang: 'id' | 'en' = 'en'): string => {
  if (!catCodeOrDept) return lang === 'en' ? 'General' : 'Umum';
  const codeNum = typeof catCodeOrDept === 'number' ? catCodeOrDept : parseInt(String(catCodeOrDept), 10);
  if (!isNaN(codeNum) && CATEGORY_LOCALIZATIONS[codeNum]) {
    return lang === 'en' ? CATEGORY_LOCALIZATIONS[codeNum].deptEn : CATEGORY_LOCALIZATIONS[codeNum].deptId;
  }
  const str = String(catCodeOrDept).trim();
  if (str.includes('/')) {
    const parts = str.split('/').map((s) => s.trim());
    return lang === 'en' ? parts[0] : parts[1] || parts[0];
  }
  const lower = str.toLowerCase();
  for (const item of Object.values(CATEGORY_LOCALIZATIONS)) {
    if (item.deptEn.toLowerCase() === lower || item.deptId.toLowerCase() === lower) {
      return lang === 'en' ? item.deptEn : item.deptId;
    }
  }
  return str;
};

export const ERP_CATEGORY_MAPPING: Record<number, { name: string; department: string }> = Object.fromEntries(
  ERP_CATEGORIES.map((c) => [c.code, { name: c.name, department: c.department }])
);

// Robust helper to guarantee an absolute category code and name with ZERO "Unknown" values
export const getErpCategoryInfo = (p: Partial<Product>): { categoryCode: number; categoryName: string } => {
  if (p.categoryCode && ERP_CATEGORY_MAPPING[Number(p.categoryCode)]) {
    const code = Number(p.categoryCode);
    return { categoryCode: code, categoryName: ERP_CATEGORY_MAPPING[code].name };
  }
  const rawCat = (p.category || '').toLowerCase();
  for (const [codeStr, info] of Object.entries(ERP_CATEGORY_MAPPING)) {
    const catLower = info.name.toLowerCase();
    if (rawCat === catLower || (rawCat && catLower.includes(rawCat))) {
      return { categoryCode: Number(codeStr), categoryName: info.name };
    }
  }

  const name = (p.name || '').toLowerCase();
  const brand = (p.brand || '').toLowerCase();

  // 1. High-priority specific brand & product heuristics
  if (name.includes('kopi') || brand.includes('kapal api') || brand.includes('good day') || brand.includes('nescafe')) {
    return { categoryCode: 10, categoryName: 'Coffee' };
  }
  if (name.includes('teh') || brand.includes('sosro') || brand.includes('teh pucuk') || brand.includes('sariwangi')) {
    return { categoryCode: 5, categoryName: 'Tea' };
  }
  if (name.includes('kratingdaeng') || brand.includes('kratingdaeng') || rawCat.includes('energy')) {
    return { categoryCode: 1, categoryName: 'Energy Drink' };
  }
  if (name.includes('margarin') || brand.includes('blue band')) {
    return { categoryCode: 4, categoryName: 'Margarine' };
  }
  if (name.includes('beras') || name.includes('gula') || name.includes('terigu') || brand.includes('gulaku') || brand.includes('ramos') || brand.includes('bogasari') || brand.includes('segitiga biru')) {
    return { categoryCode: 21, categoryName: 'Rice' };
  }
  if (name.includes('minyak') || brand.includes('bimoli') || brand.includes('filma') || brand.includes('sania')) {
    return { categoryCode: 2, categoryName: 'Cooking Oil' };
  }
  if (name.includes('sambal') || name.includes('royco') || name.includes('masako') || (brand.includes('abc') && (name.includes('sambal') || name.includes('saus')))) {
    return { categoryCode: 3, categoryName: 'Chilli Sauce' };
  }
  if (name.includes('kecap') || brand.includes('bango') || (brand.includes('abc') && name.includes('kecap'))) {
    return { categoryCode: 20, categoryName: 'Sweet Soy Sauce' };
  }
  if (name.includes('mie') || brand.includes('indomie') || brand.includes('sedaap')) {
    return { categoryCode: 8, categoryName: 'Instant Noodle' };
  }
  if (name.includes('aqua') || name.includes('le minerale') || name.includes('air mineral')) {
    return { categoryCode: 9, categoryName: 'Mineral Water' };
  }
  if (name.includes('kental manis') || brand.includes('frisian flag')) {
    return { categoryCode: 12, categoryName: 'Sweetened Condensed Milk' };
  }
  if (name.includes('susu') || brand.includes('ultra milk') || brand.includes('bear brand')) {
    return { categoryCode: 11, categoryName: 'Milk' };
  }
  if (name.includes('chitato') || brand.includes('lays') || brand.includes('taro')) {
    return { categoryCode: 6, categoryName: 'Snack' };
  }
  if (name.includes('good time') || name.includes('oreo') || name.includes('roma') || name.includes('beng-beng')) {
    return { categoryCode: 7, categoryName: 'Biscuit' };
  }
  if (name.includes('silverqueen') || name.includes('choki-choki') || name.includes('cokelat') || name.includes('permen') || brand.includes('kopiko')) {
    return { categoryCode: 22, categoryName: 'Confectionery' };
  }
  if (name.includes('deterjen') || brand.includes('rinso') || brand.includes('attack') || brand.includes('daia') || brand.includes('molto')) {
    return { categoryCode: 13, categoryName: 'Detergent' };
  }
  if (name.includes('pencuci piring') || brand.includes('sunlight') || brand.includes('mama lemon')) {
    return { categoryCode: 25, categoryName: 'Dishwashing Liquid' };
  }
  if (name.includes('sabun') || brand.includes('lifebuoy') || brand.includes('biore') || name.includes('facial foam')) {
    return { categoryCode: 14, categoryName: 'Toilet Soap' };
  }
  if (name.includes('shampoo') || name.includes('shampo') || brand.includes('clear') || brand.includes('pantene') || brand.includes('sunsilk')) {
    return { categoryCode: 15, categoryName: 'Shampoo' };
  }
  if (name.includes('gigi') || brand.includes('pepsodent') || brand.includes('close up')) {
    return { categoryCode: 16, categoryName: 'Toothpaste' };
  }
  if (name.includes('tisu') || brand.includes('paseo')) {
    return { categoryCode: 17, categoryName: 'Tissue' };
  }
  if (name.includes('coca-cola') || name.includes('sprite') || name.includes('fanta') || name.includes('pocari') || name.includes('you c1000')) {
    return { categoryCode: 18, categoryName: 'Soft Drink' };
  }
  if (name.includes('baterai') || brand.includes('battery') || name.includes('battery')) {
    return { categoryCode: 27, categoryName: 'Battery' };
  }
  if (name.includes('sarden') || brand.includes('botan')) {
    return { categoryCode: 19, categoryName: 'Canned Food' };
  }
  if (name.includes('popok') || brand.includes('mamypoko')) {
    return { categoryCode: 23, categoryName: 'Baby Care' };
  }
  if (name.includes('es krim') || brand.includes('walls')) {
    return { categoryCode: 28, categoryName: 'Ice Cream' };
  }
  if (name.includes('nugget') || brand.includes('so good')) {
    return { categoryCode: 29, categoryName: 'Frozen Food' };
  }
  if (name.includes('roti') || brand.includes('sari roti')) {
    return { categoryCode: 30, categoryName: 'Bread & Bakery' };
  }
  if (brand.includes('bodrex') || name.includes('obat') || name.includes('paracetamol')) {
    return { categoryCode: 26, categoryName: 'Pharmacy & OTC' };
  }
  if (brand.includes('vitalis')) {
    return { categoryCode: 24, categoryName: 'Personal Care' };
  }

  // 2. Keyword fallback on raw category string
  if (rawCat.includes('energy')) return { categoryCode: 1, categoryName: 'Energy Drink' };
  if (rawCat.includes('minyak') || rawCat.includes('oil')) return { categoryCode: 2, categoryName: 'Cooking Oil' };
  if (rawCat.includes('sambal') || rawCat.includes('chilli') || rawCat.includes('saus')) return { categoryCode: 3, categoryName: 'Chilli Sauce' };
  if (rawCat.includes('margarin') || rawCat.includes('margarine')) return { categoryCode: 4, categoryName: 'Margarine' };
  if (rawCat.includes('teh') || rawCat.includes('tea')) return { categoryCode: 5, categoryName: 'Tea' };
  if (rawCat.includes('snack') || rawCat.includes('camilan')) return { categoryCode: 6, categoryName: 'Snack' };
  if (rawCat.includes('biscuit') || rawCat.includes('biskuit') || rawCat.includes('cookies')) return { categoryCode: 7, categoryName: 'Biscuit' };
  if (rawCat.includes('mie') || rawCat.includes('noodle')) return { categoryCode: 8, categoryName: 'Instant Noodle' };
  if (rawCat.includes('air') || rawCat.includes('water') || rawCat.includes('mineral')) return { categoryCode: 9, categoryName: 'Mineral Water' };
  if (rawCat.includes('kopi') || rawCat.includes('coffee')) return { categoryCode: 10, categoryName: 'Coffee' };
  if (rawCat.includes('susu') || rawCat.includes('milk')) return { categoryCode: 11, categoryName: 'Milk' };
  if (rawCat.includes('kental')) return { categoryCode: 12, categoryName: 'Sweetened Condensed Milk' };
  if (rawCat.includes('detergen') || rawCat.includes('detergent')) return { categoryCode: 13, categoryName: 'Detergent' };
  if (rawCat.includes('sabun') || rawCat.includes('soap')) return { categoryCode: 14, categoryName: 'Toilet Soap' };
  if (rawCat.includes('shampoo') || rawCat.includes('shampo')) return { categoryCode: 15, categoryName: 'Shampoo' };
  if (rawCat.includes('gigi') || rawCat.includes('toothpaste')) return { categoryCode: 16, categoryName: 'Toothpaste' };
  if (rawCat.includes('tissue') || rawCat.includes('tisu')) return { categoryCode: 17, categoryName: 'Tissue' };
  if (rawCat.includes('soda') || rawCat.includes('soft drink')) return { categoryCode: 18, categoryName: 'Soft Drink' };
  if (rawCat.includes('kaleng') || rawCat.includes('canned')) return { categoryCode: 19, categoryName: 'Canned Food' };
  if (rawCat.includes('kecap')) return { categoryCode: 20, categoryName: 'Sweet Soy Sauce' };
  if (rawCat.includes('beras') || rawCat.includes('rice') || rawCat.includes('sembako')) return { categoryCode: 21, categoryName: 'Rice' };
  if (rawCat.includes('permen') || rawCat.includes('candy') || rawCat.includes('confectionery')) return { categoryCode: 22, categoryName: 'Confectionery' };
  if (rawCat.includes('bayi') || rawCat.includes('baby')) return { categoryCode: 23, categoryName: 'Baby Care' };
  if (rawCat.includes('parfum') || rawCat.includes('cologne') || rawCat.includes('perawatan tubuh')) return { categoryCode: 24, categoryName: 'Personal Care' };
  if (rawCat.includes('piring') || rawCat.includes('dish')) return { categoryCode: 25, categoryName: 'Dishwashing Liquid' };
  if (rawCat.includes('obat') || rawCat.includes('pharmacy')) return { categoryCode: 26, categoryName: 'Pharmacy & OTC' };
  if (rawCat.includes('baterai') || rawCat.includes('battery')) return { categoryCode: 27, categoryName: 'Battery' };
  if (rawCat.includes('es krim') || rawCat.includes('ice cream')) return { categoryCode: 28, categoryName: 'Ice Cream' };
  if (rawCat.includes('nugget') || rawCat.includes('frozen')) return { categoryCode: 29, categoryName: 'Frozen Food' };
  if (rawCat.includes('roti') || rawCat.includes('bakery')) return { categoryCode: 30, categoryName: 'Bread & Bakery' };

  return { categoryCode: 9, categoryName: 'Mineral Water' };
};

export const INITIAL_CATEGORIES: CategoryMaster[] = ERP_CATEGORIES.map((c) => ({
  id: `CAT-${String(c.code).padStart(3, '0')}`,
  code: String(c.code),
  name: c.name,
  department: c.department,
  taxRate: 11,
  marginTarget: 20,
  productCount: 1,
  status: 'Active',
}));

export interface ErpCatalogItem {
  brand: string;
  manufacturer: string;
}

// Master Catalog Mapping Baku (CategoryCode -> Brand -> Manufacturer)
export const ERP_CATALOG_MAPPING: Record<number, ErpCatalogItem[]> = {
  1: [{ brand: 'Kratingdaeng', manufacturer: 'PT Asia Sejahtera Perdana' }],
  2: [{ brand: 'Bimoli', manufacturer: 'PT Salim Ivomas Pratama Tbk' }],
  3: [{ brand: 'ABC', manufacturer: 'PT Heinz ABC Indonesia' }],
  4: [{ brand: 'Blue Band', manufacturer: 'PT Upfield Indonesia' }],
  5: [{ brand: 'Sosro', manufacturer: 'PT Sinar Sosro' }],
  6: [{ brand: 'Chitato', manufacturer: 'PT Indofood Fortuna Makmur' }],
  7: [{ brand: 'Good Time', manufacturer: 'PT Arnott Indonesia' }],
  8: [{ brand: 'Indomie', manufacturer: 'PT Indofood CBP Sukses Makmur Tbk' }],
  9: [{ brand: 'Aqua', manufacturer: 'PT Tirta Investama' }, { brand: 'Le Minerale', manufacturer: 'PT Mayora Indah Tbk' }],
  10: [{ brand: 'Kapal Api', manufacturer: 'PT Santos Jaya Abadi' }],
  11: [{ brand: 'Ultra Milk', manufacturer: 'PT Ultrajaya Milk Industry Tbk' }],
  12: [{ brand: 'Frisian Flag', manufacturer: 'PT Frisian Flag Indonesia' }],
  13: [{ brand: 'Attack', manufacturer: 'PT Kao Indonesia' }, { brand: 'Rinso', manufacturer: 'PT Unilever Indonesia Tbk' }],
  14: [{ brand: 'Lifebuoy', manufacturer: 'PT Unilever Indonesia Tbk' }],
  15: [{ brand: 'Clear', manufacturer: 'PT Unilever Indonesia Tbk' }],
  16: [{ brand: 'Pepsodent', manufacturer: 'PT Unilever Indonesia Tbk' }],
  17: [{ brand: 'Paseo', manufacturer: 'PT Asian Paper Mills' }],
  18: [{ brand: 'Coca-Cola', manufacturer: 'PT Coca-Cola Europacific Partners Indonesia' }],
  19: [{ brand: 'Botan', manufacturer: 'PT Maya Muncar' }],
  20: [{ brand: 'Bango', manufacturer: 'PT Unilever Indonesia Tbk' }],
  21: [{ brand: 'Sania', manufacturer: 'PT Wilmar Nabati Indonesia' }],
  22: [{ brand: 'Kopiko', manufacturer: 'PT Mayora Indah Tbk' }],
  23: [{ brand: 'MamyPoko', manufacturer: 'PT Uni-Charm Indonesia Tbk' }],
  24: [{ brand: 'Vitalis', manufacturer: 'PT Unza Vitalis' }],
  25: [{ brand: 'Sunlight', manufacturer: 'PT Unilever Indonesia Tbk' }],
  26: [{ brand: 'Bodrex', manufacturer: 'PT Tempo Scan Pacific Tbk' }],
  27: [{ brand: 'ABC Battery', manufacturer: 'PT International Chemical Industry' }],
  28: [{ brand: 'Walls', manufacturer: 'PT Unilever Indonesia Tbk' }],
  29: [{ brand: 'So Good', manufacturer: 'PT So Good Food' }],
  30: [{ brand: 'Sari Roti', manufacturer: 'PT Nippon Indosari Corpindo Tbk' }],
};

// Data Master Supplier / Distributor Lokal Resmi ERP
export interface LocalSupplierItem {
  id: string;
  code?: string;
  name: string;
  contactPerson?: string;
  region?: string;
  phone: string;
  waNumber: string;
  address: string;
  paymentTerms: string;
  notes: string;
}

const RAW_SUPPLIER_LIST: LocalSupplierItem[] = [
  { id: 'SP000001', code: 'SP000001', name: 'PT Sumber Makmur', contactPerson: 'Hendra Setiawan', region: 'DKI Jakarta', phone: '0812-3456-7890', waNumber: '6281234567890', address: 'Jl. Industri Raya No. 10, Kawasan Industri Pulogadung, Jakarta Timur', paymentTerms: 'TOP 30 Hari', notes: 'Supplier Utama Distribusi Sembako & Ritel (APS POS 1)' },
  { id: 'SP000002', code: 'SP000002', name: 'PT Maju Jaya', contactPerson: 'Bambang Sudiro', region: 'Banten', phone: '0812-9876-5432', waNumber: '6281298765432', address: 'Jl. Raya Daan Mogot KM 14 No. 25, Tangerang, Banten', paymentTerms: 'TOP 14 Hari', notes: 'Supplier Utama Bahan Makanan & Minuman Kemasan (APS POS 1)' },
  { id: 'SUP-001', name: 'PT Asia Sejahtera Perdana', contactPerson: 'Budi Santoso', region: 'DKI Jakarta', phone: '0812-1000-0001', waNumber: '6281210000001', address: 'Jl. Rawa Gelam IV No. 2, Kawasan Industri Pulogadung, Jakarta Timur', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Resmi Minuman Berenergi' },
  { id: 'SUP-002', name: 'PT Salim Ivomas Pratama Tbk', contactPerson: 'Hendro Wijaya', region: 'DKI Jakarta', phone: '0812-1000-0002', waNumber: '6281210000002', address: 'Sudirman Plaza Indofood Tower Lt. 11, Jl. Jend. Sudirman Kav. 76-78, Jakarta Selatan', paymentTerms: 'TOP 14 Hari', notes: 'Distributor Minyak Goreng & Margarin' },
  { id: 'SUP-003', name: 'PT Heinz ABC Indonesia', contactPerson: 'Dewi Lestari', region: 'Jawa Barat', phone: '0812-1000-0003', waNumber: '6281210000003', address: 'Jl. Daan Mogot KM 12 No. 9, Cengkareng, Jakarta Barat', paymentTerms: 'TOP 30 Hari', notes: 'Principal Sambal, Saus, & Sirup' },
  { id: 'SUP-004', name: 'PT Upfield Manufacturing Indonesia', contactPerson: 'Fajar Nugraha', region: 'Jawa Barat', phone: '0812-1000-0004', waNumber: '6281210000004', address: 'Kawasan Industri Jababeka Tahap II Blok J No. 1, Cikarang, Bekasi', paymentTerms: 'TOP 21 Hari', notes: 'Distributor Margarin & Olahan Mentega' },
  { id: 'SUP-005', name: 'PT Sinar Sosro', contactPerson: 'Rudi Hartono', region: 'Jawa Barat', phone: '0812-1000-0005', waNumber: '6281210000005', address: 'Jl. Raya Sultan Agung KM 28, Medan Satria, Kota Bekasi', paymentTerms: 'TOP 14 Hari', notes: 'Distributor Teh Kemasan & RTD' },
  { id: 'SUP-006', name: 'PT Indofood Fortuna Makmur', contactPerson: 'Agus Priyono', region: 'Jawa Barat', phone: '0812-1000-0006', waNumber: '6281210000006', address: 'Jl. Kemang Raya No. 12, Sukmajaya, Depok, Jawa Barat', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Aneka Makanan Ringan' },
  { id: 'SUP-007', name: 'PT Arnott Indonesia', contactPerson: 'Siti Rahma', region: 'Jawa Barat', phone: '0812-1000-0007', waNumber: '6281210000007', address: 'Jl. Wahab Affan No. 8, Medan Satria, Pondok Ungu, Bekasi', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Biskuit & Cookies' },
  { id: 'SUP-008', name: 'PT Indofood CBP Sukses Makmur Tbk', contactPerson: 'Bambang Irawan', region: 'DKI Jakarta', phone: '0812-1000-0008', waNumber: '6281210000008', address: 'Kawasan Industri Ancol, Jl. Ancol Barat I No. 5-7, Jakarta Utara', paymentTerms: 'TOP 14 Hari', notes: 'Distributor Mi Instan & Makanan Cepat Saji' },
  { id: 'SUP-009', name: 'PT Tirta Investama (Danone Aqua)', contactPerson: 'Michael Tan', region: 'DKI Jakarta', phone: '0812-1000-0009', waNumber: '6281210000009', address: 'Cyber 2 Tower Lt. 10, Jl. HR Rasuna Said Blok X-5 No. 13, Jakarta Selatan', paymentTerms: 'TOP 14 Hari', notes: 'Distributor Resmi Air Minum Dalam Kemasan' },
  { id: 'SUP-010', name: 'PT Santos Jaya Abadi (Kapal Api)', contactPerson: 'Andreas Setiawan', region: 'Jawa Timur', phone: '0812-1000-0010', waNumber: '6281210000010', address: 'Jl. Raya Gilang No. 159, Taman, Sidoarjo, Jawa Timur', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Kopi Bubuk & Kopi Siap Minum' },
  { id: 'SUP-011', name: 'PT Ultrajaya Milk Industry Tbk', contactPerson: 'Dian Permata', region: 'Jawa Barat', phone: '0812-1000-0011', waNumber: '6281210000011', address: 'Jl. Raya Cimareme No. 131, Padalarang, Kabupaten Bandung Barat', paymentTerms: 'TOP 14 Hari', notes: 'Distributor Susu Segar & Susu UHT' },
  { id: 'SUP-012', name: 'PT Frisian Flag Indonesia', contactPerson: 'Eko Prasetyo', region: 'DKI Jakarta', phone: '0812-1000-0012', waNumber: '6281210000012', address: 'Jl. Raya Bogor KM 5, Pasar Rebo, Jakarta Timur', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Susu Kental Manis & Bubuk' },
  { id: 'SUP-013', name: 'PT Kao Indonesia', contactPerson: 'Yuni Astuti', region: 'Jawa Barat', phone: '0812-1000-0013', waNumber: '6281210000013', address: 'Kawasan Industri Jababeka Blok C-1 No. 4-10, Cikarang, Bekasi', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Deterjen & Pembersih Rumah Tangga' },
  { id: 'SUP-014', name: 'PT Unilever Indonesia Tbk (Personal Care)', contactPerson: 'Irfan Maulana', region: 'Banten', phone: '0812-1000-0014', waNumber: '6281210000014', address: 'Grha Unilever, Green Office Park Kav. 3, BSD City, Tangerang', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Sabun Mandi & Perawatan Diri' },
  { id: 'SUP-015', name: 'PT Unilever Indonesia Tbk (Hair Care)', contactPerson: 'Maya Kartika', region: 'Banten', phone: '0812-1000-0015', waNumber: '6281210000015', address: 'Grha Unilever, Green Office Park Kav. 3, BSD City, Tangerang', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Sampo & Perawatan Rambut' },
  { id: 'SUP-016', name: 'PT Unilever Indonesia Tbk (Oral Care)', contactPerson: 'Wahyu Hidayat', region: 'Banten', phone: '0812-1000-0016', waNumber: '6281210000016', address: 'Grha Unilever, Green Office Park Kav. 3, BSD City, Tangerang', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Pasta Gigi & Perawatan Mulut' },
  { id: 'SUP-017', name: 'PT Asian Paper Mills (Paseo)', contactPerson: 'Lina Marlina', region: 'Jawa Barat', phone: '0812-1000-0017', waNumber: '6281210000017', address: 'Kawasan Industri MM2100 Blok KK-8, Cikarang Barat, Bekasi', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Tisu Wajah & Kertas Rumah Tangga' },
  { id: 'SUP-018', name: 'PT Coca-Cola Europacific Partners Indonesia', contactPerson: 'Denny Kurniawan', region: 'DKI Jakarta', phone: '0812-1000-0018', waNumber: '6281210000018', address: 'South Quarter Tower C Lt. 18, Jl. RA Kartini Kav. 8, Cilandak, Jakarta Selatan', paymentTerms: 'TOP 14 Hari', notes: 'Distributor Minuman Karbonasi / Soda' },
  { id: 'SUP-019', name: 'PT Maya Muncar', contactPerson: 'Hadi Suwito', region: 'Jawa Timur', phone: '0812-1000-0019', waNumber: '6281210000019', address: 'Jl. Sampangan No. 34, Muncar, Banyuwangi, Jawa Timur', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Sarden & Makanan Kaleng' },
  { id: 'SUP-020', name: 'PT Unilever Indonesia Tbk (Food Division)', contactPerson: 'Anita Syafitri', region: 'Banten', phone: '0812-1000-0020', waNumber: '6281210000020', address: 'Grha Unilever, Green Office Park Kav. 3, BSD City, Tangerang', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Kecap & Bumbu Masak' },
  { id: 'SUP-021', name: 'PT Wilmar Nabati Indonesia', contactPerson: 'Surya Pratama', region: 'DKI Jakarta', phone: '0812-1000-0021', waNumber: '6281210000021', address: 'Multivision Tower Lt. 12, Jl. Kuningan Mulia Kav. 9B, Jakarta Selatan', paymentTerms: 'TOP 14 Hari', notes: 'Distributor Beras & Pangan Pokok' },
  { id: 'SUP-022', name: 'PT Mayora Indah Tbk', contactPerson: 'Ricky Gunawan', region: 'DKI Jakarta', phone: '0812-1000-0022', waNumber: '6281210000022', address: 'Gedung Mayora Lt. 8, Jl. Tomang Raya No. 21-23, Jakarta Barat', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Permen, Biskuit, & Kembang Gula' },
  { id: 'SUP-023', name: 'PT Uni-Charm Indonesia Tbk', contactPerson: 'Nurul Aini', region: 'DKI Jakarta', phone: '0812-1000-0023', waNumber: '6281210000023', address: 'Sinarmas MSIG Tower Lt. 42, Jl. Jend. Sudirman Kav. 21, Jakarta Selatan', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Popok Bayi & Perlengkapan Ibu/Anak' },
  { id: 'SUP-024', name: 'PT Unza Vitalis', contactPerson: 'Tri Wahyudi', region: 'Jawa Tengah', phone: '0812-1000-0024', waNumber: '6281210000024', address: 'Jl. Soekarno-Hatta KM 32, Bergas, Ungaran, Kabupaten Semarang', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Wewangian & Perawatan Tubuh' },
  { id: 'SUP-025', name: 'PT Unilever Indonesia Tbk (Home Care)', contactPerson: 'Rina Kusuma', region: 'Banten', phone: '0812-1000-0025', waNumber: '6281210000025', address: 'Grha Unilever, Green Office Park Kav. 3, BSD City, Tangerang', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Cairan Pencuci Piring & Kebersihan' },
  { id: 'SUP-026', name: 'PT Tempo Scan Pacific Tbk', contactPerson: 'David Christian', region: 'DKI Jakarta', phone: '0812-1000-0026', waNumber: '6281210000026', address: 'Tempo Scan Tower Lt. 16, Jl. HR Rasuna Said Kav. 3-4, Jakarta Selatan', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Obat Bebas & Produk Farmasi' },
  { id: 'SUP-027', name: 'PT International Chemical Industry', contactPerson: 'Sony Kusnadi', region: 'DKI Jakarta', phone: '0812-1000-0027', waNumber: '6281210000027', address: 'Jl. Daan Mogot KM 11 No. 1, Cengkareng, Jakarta Barat', paymentTerms: 'TOP 30 Hari', notes: 'Distributor Baterai & Perkakas Ringan' },
  { id: 'SUP-028', name: 'PT Unilever Indonesia Tbk (Ice Cream)', contactPerson: 'Gilang Ramadhan', region: 'Banten', phone: '0812-1000-0028', waNumber: '6281210000028', address: 'Grha Unilever, Green Office Park Kav. 3, BSD City, Tangerang', paymentTerms: 'TOP 7 Hari', notes: 'Distributor Es Krim & Rantai Dingin' },
  { id: 'SUP-029', name: 'PT So Good Food', contactPerson: 'Farhan Maulana', region: 'DKI Jakarta', phone: '0812-1000-0029', waNumber: '6281210000029', address: 'Jl. Rawa Terate I No. 2, Kawasan Industri Pulogadung, Jakarta Timur', paymentTerms: 'TOP 14 Hari', notes: 'Distributor Olahan Daging & Makanan Beku' },
  { id: 'SUP-030', name: 'PT Nippon Indosari Corpindo Tbk', contactPerson: 'Kevin Anggoro', region: 'Jawa Barat', phone: '0812-1000-0030', waNumber: '6281210000030', address: 'Kawasan Industri MM2100 Blok W-40/41, Cikarang Barat, Bekasi', paymentTerms: 'TOP 7 Hari', notes: 'Distributor Roti Segar Harian' },
];

export const MASTER_LOCAL_SUPPLIERS: LocalSupplierItem[] = [...RAW_SUPPLIER_LIST];

export const getDefaultSupplierForCategory = (catCode: number): LocalSupplierItem => {
  return (
    RAW_SUPPLIER_LIST[(catCode - 1) % RAW_SUPPLIER_LIST.length] ||
    RAW_SUPPLIER_LIST[0]
  );
};

export const formatWhatsAppLink = (
  phoneOrWa: string,
  productName?: string,
  currentStock?: string | number,
  supplierName?: string
): string => {
  const cleanNum = phoneOrWa.replace(/\D/g, '');
  const targetNum = cleanNum.startsWith('0') ? '62' + cleanNum.slice(1) : cleanNum.startsWith('62') ? cleanNum : '62' + cleanNum;
  const greeting = supplierName ? `Halo ${supplierName}` : 'Halo Distributor JacS RetailOS';
  const stockInfo = currentStock !== undefined ? ` (Stok saat ini: ${currentStock})` : '';
  const msg = productName
    ? `${greeting}, kami ingin konfirmasi pemesanan ulang untuk produk: ${productName}${stockInfo}. Mohon info ketersediaan stok.`
    : `${greeting}, kami ingin koordinasi ketersediaan stok dan jadwal pengiriman PO. Terima kasih.`;
  return `https://wa.me/${targetNum}?text=${encodeURIComponent(msg)}`;
};

export const INITIAL_BRANDS: BrandMaster[] = [
  { id: 'BRD-001', code: 'KRD', name: 'Kratingdaeng', manufacturer: 'PT Asia Sejahtera Perdana', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 1, categoryName: 'Energy Drink' },
  { id: 'BRD-002', code: 'BML', name: 'Bimoli', manufacturer: 'PT Salim Ivomas Pratama Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 2, categoryName: 'Cooking Oil' },
  { id: 'BRD-003', code: 'FLM', name: 'Filma', manufacturer: 'PT SMART Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 2, categoryName: 'Cooking Oil' },
  { id: 'BRD-004', code: 'ABC', name: 'ABC', manufacturer: 'PT Heinz ABC Indonesia', country: 'Indonesia', productCount: 2, status: 'Active', categoryCode: 3, categoryName: 'Condiments & Seasonings' },
  { id: 'BRD-005', code: 'ABCS', name: 'ABC Sarden', manufacturer: 'PT Heinz ABC Indonesia', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 19, categoryName: 'Canned Food' },
  { id: 'BRD-006', code: 'ACB', name: 'ABC Battery', manufacturer: 'PT International Chemical Industry', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 27, categoryName: 'Battery & Electronics' },
  { id: 'BRD-007', code: 'BLB', name: 'Blue Band', manufacturer: 'PT Upfield Indonesia', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 4, categoryName: 'Margarine' },
  { id: 'BRD-008', code: 'SSR', name: 'Sosro', manufacturer: 'PT Sinar Sosro', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 5, categoryName: 'Tea' },
  { id: 'BRD-009', code: 'TPH', name: 'Teh Pucuk Harum', manufacturer: 'PT Mayora Indah Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 5, categoryName: 'Tea' },
  { id: 'BRD-010', code: 'CHT', name: 'Chitato', manufacturer: 'PT Indofood Fortuna Makmur', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 6, categoryName: 'Snack' },
  { id: 'BRD-011', code: 'LAYS', name: 'Lays', manufacturer: 'PT Indofood Fortuna Makmur', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 6, categoryName: 'Snack' },
  { id: 'BRD-012', code: 'TARO', name: 'Taro', manufacturer: 'PT FKS Food Sejahtera Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 6, categoryName: 'Snack' },
  { id: 'BRD-013', code: 'GDT', name: 'Good Time', manufacturer: 'PT Arnott Indonesia', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 7, categoryName: 'Biscuit' },
  { id: 'BRD-014', code: 'OREO', name: 'Oreo', manufacturer: 'PT Mondelez Indonesia', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 7, categoryName: 'Biscuit' },
  { id: 'BRD-015', code: 'ROMA', name: 'Roma', manufacturer: 'PT Mayora Indah Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 7, categoryName: 'Biscuit' },
  { id: 'BRD-016', code: 'IND', name: 'Indomie', manufacturer: 'PT Indofood CBP Sukses Makmur Tbk', country: 'Indonesia', productCount: 3, status: 'Active', categoryCode: 8, categoryName: 'Instant Noodle' },
  { id: 'BRD-017', code: 'SDP', name: 'Sedaap', manufacturer: 'PT Sayap Mas Utama (Wings Food)', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 8, categoryName: 'Instant Noodle' },
  { id: 'BRD-018', code: 'AQU', name: 'Aqua', manufacturer: 'PT Tirta Investama (Danone)', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 9, categoryName: 'Mineral Water' },
  { id: 'BRD-019', code: 'LMN', name: 'Le Minerale', manufacturer: 'PT Mayora Indah Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 9, categoryName: 'Mineral Water' },
  { id: 'BRD-020', code: 'KAP', name: 'Kapal Api', manufacturer: 'PT Santos Jaya Abadi', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 10, categoryName: 'Coffee' },
  { id: 'BRD-021', code: 'GDD', name: 'Good Day', manufacturer: 'PT Santos Jaya Abadi', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 10, categoryName: 'Coffee' },
  { id: 'BRD-022', code: 'NSC', name: 'Nescafe', manufacturer: 'PT Nestle Indonesia', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 10, categoryName: 'Coffee' },
  { id: 'BRD-023', code: 'ULT', name: 'Ultra Milk', manufacturer: 'PT Ultrajaya Milk Industry Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 11, categoryName: 'Milk' },
  { id: 'BRD-024', code: 'BBR', name: 'Bear Brand', manufacturer: 'PT Nestle Indonesia', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 11, categoryName: 'Milk' },
  { id: 'BRD-025', code: 'FSF', name: 'Frisian Flag', manufacturer: 'PT Frisian Flag Indonesia', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 12, categoryName: 'Sweetened Condensed Milk' },
  { id: 'BRD-026', code: 'ATK', name: 'Attack', manufacturer: 'PT Kao Indonesia', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 13, categoryName: 'Detergent' },
  { id: 'BRD-027', code: 'RNS', name: 'Rinso', manufacturer: 'PT Unilever Indonesia Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 13, categoryName: 'Detergent' },
  { id: 'BRD-028', code: 'DAIA', name: 'Daia', manufacturer: 'PT Sayap Mas Utama (Wings)', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 13, categoryName: 'Detergent' },
  { id: 'BRD-029', code: 'MLT', name: 'Molto', manufacturer: 'PT Unilever Indonesia Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 13, categoryName: 'Detergent' },
  { id: 'BRD-030', code: 'LFB', name: 'Lifebuoy', manufacturer: 'PT Unilever Indonesia Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 14, categoryName: 'Toilet Soap' },
  { id: 'BRD-031', code: 'BIO', name: 'Biore', manufacturer: 'PT Kao Indonesia', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 14, categoryName: 'Toilet Soap' },
  { id: 'BRD-032', code: 'CLR', name: 'Clear', manufacturer: 'PT Unilever Indonesia Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 15, categoryName: 'Shampoo' },
  { id: 'BRD-033', code: 'PNT', name: 'Pantene', manufacturer: 'PT Procter & Gamble Indonesia', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 15, categoryName: 'Shampoo' },
  { id: 'BRD-034', code: 'SSL', name: 'Sunsilk', manufacturer: 'PT Unilever Indonesia Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 15, categoryName: 'Shampoo' },
  { id: 'BRD-035', code: 'PEP', name: 'Pepsodent', manufacturer: 'PT Unilever Indonesia Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 16, categoryName: 'Toothpaste' },
  { id: 'BRD-036', code: 'CLU', name: 'Close Up', manufacturer: 'PT Unilever Indonesia Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 16, categoryName: 'Toothpaste' },
  { id: 'BRD-037', code: 'PAS', name: 'Paseo', manufacturer: 'PT Asian Paper Mills', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 17, categoryName: 'Tissue' },
  { id: 'BRD-038', code: 'CCL', name: 'Coca-Cola', manufacturer: 'PT Coca-Cola Europacific Partners Indonesia', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 18, categoryName: 'Soft Drink' },
  { id: 'BRD-039', code: 'SPR', name: 'Sprite', manufacturer: 'PT Coca-Cola Europacific Partners Indonesia', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 18, categoryName: 'Soft Drink' },
  { id: 'BRD-040', code: 'FNT', name: 'Fanta', manufacturer: 'PT Coca-Cola Europacific Partners Indonesia', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 18, categoryName: 'Soft Drink' },
  { id: 'BRD-041', code: 'PCS', name: 'Pocari Sweat', manufacturer: 'PT Amerta Indah Otsuka', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 18, categoryName: 'Soft Drink' },
  { id: 'BRD-042', code: 'YOU', name: 'You C1000', manufacturer: 'PT Djojonegoro C-1000', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 18, categoryName: 'Soft Drink' },
  { id: 'BRD-043', code: 'BTN', name: 'Botan', manufacturer: 'PT Maya Muncar', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 19, categoryName: 'Canned Food' },
  { id: 'BRD-044', code: 'BNG', name: 'Bango', manufacturer: 'PT Unilever Indonesia Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 20, categoryName: 'Sweet Soy Sauce' },
  { id: 'BRD-045', code: 'SNA', name: 'Sania', manufacturer: 'PT Wilmar Nabati Indonesia', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 2, categoryName: 'Cooking Oil' },
  { id: 'BRD-046', code: 'GLK', name: 'Gulaku', manufacturer: 'PT Sugar Group Companies', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 21, categoryName: 'Rice & Sembako' },
  { id: 'BRD-047', code: 'BGS', name: 'Bogasari', manufacturer: 'PT Indofood Sukses Makmur Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 21, categoryName: 'Rice & Sembako' },
  { id: 'BRD-048', code: 'RMS', name: 'Ramos', manufacturer: 'PT Wilmar Padi Indonesia', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 21, categoryName: 'Rice & Sembako' },
  { id: 'BRD-049', code: 'KPK', name: 'Kopiko', manufacturer: 'PT Mayora Indah Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 22, categoryName: 'Confectionery' },
  { id: 'BRD-050', code: 'SLV', name: 'SilverQueen', manufacturer: 'PT Petra Foods (Delfi Tbk)', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 22, categoryName: 'Confectionery' },
  { id: 'BRD-051', code: 'MMP', name: 'MamyPoko', manufacturer: 'PT Uni-Charm Indonesia Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 23, categoryName: 'Baby Care' },
  { id: 'BRD-052', code: 'VTL', name: 'Vitalis', manufacturer: 'PT Unza Vitalis', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 24, categoryName: 'Personal Care' },
  { id: 'BRD-053', code: 'SNL', name: 'Sunlight', manufacturer: 'PT Unilever Indonesia Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 25, categoryName: 'Dishwashing Liquid' },
  { id: 'BRD-054', code: 'MML', name: 'Mama Lemon', manufacturer: 'PT Lion Wings Indonesia', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 25, categoryName: 'Dishwashing Liquid' },
  { id: 'BRD-055', code: 'BDX', name: 'Bodrex', manufacturer: 'PT Tempo Scan Pacific Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 26, categoryName: 'Pharmacy & OTC' },
  { id: 'BRD-056', code: 'WLS', name: 'Walls', manufacturer: 'PT Unilever Indonesia Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 28, categoryName: 'Ice Cream' },
  { id: 'BRD-057', code: 'SGD', name: 'So Good', manufacturer: 'PT So Good Food', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 29, categoryName: 'Frozen Food' },
  { id: 'BRD-058', code: 'SRR', name: 'Sari Roti', manufacturer: 'PT Nippon Indosari Corpindo Tbk', country: 'Indonesia', productCount: 1, status: 'Active', categoryCode: 30, categoryName: 'Bread & Bakery' },
];

/**
 * Mapping Resmi Baku Relasi Merek vs Kategori & Principal (APS POS 1)
 * Menjamin integritas relasi tanpa anomali kategori tertukar
 * Bersih tanpa garis miring (slash), mendukung mode EN dan ID murni
 */
export const getBrandCategoryMapping = (
  brandName: string,
  brandObj?: Partial<BrandMaster>,
  lang: 'id' | 'en' = 'en'
): { categoryCode: number; categoryName: string; categoryNameEn: string; categoryNameId: string; manufacturer: string } => {
  const norm = (brandName || '').toLowerCase().trim();

  let code = 9;
  let mfr = 'Principal Resmi';

  // 1. Kasus Spesifik Multikategori Merek ABC
  if (norm === 'abc battery' || norm.includes('baterai') || norm.includes('battery')) {
    code = 27;
    mfr = 'PT International Chemical Industry';
  } else if (norm === 'abc sarden' || norm.includes('sarden') || norm.includes('sardines')) {
    code = 19;
    mfr = 'PT Heinz ABC Indonesia';
  } else if (norm === 'abc' || norm.includes('abc kecap') || norm.includes('abc saus') || norm.includes('abc sambal')) {
    code = 3;
    mfr = 'PT Heinz ABC Indonesia';
  } else if (norm.includes('kratingdaeng')) {
    code = 1;
    mfr = 'PT Asia Sejahtera Perdana';
  } else if (norm.includes('bimoli')) {
    code = 2;
    mfr = 'PT Salim Ivomas Pratama Tbk';
  } else if (norm.includes('filma')) {
    code = 2;
    mfr = 'PT SMART Tbk';
  } else if (norm.includes('sania')) {
    code = 2;
    mfr = 'PT Wilmar Nabati Indonesia';
  } else if (norm.includes('blue band')) {
    code = 4;
    mfr = 'PT Upfield Indonesia';
  } else if (norm.includes('sosro') || norm.includes('teh pucuk')) {
    code = 5;
    mfr = 'PT Sinar Sosro';
  } else if (norm.includes('chitato') || norm.includes('lays') || norm.includes('taro')) {
    code = 6;
    mfr = 'PT Indofood Fortuna Makmur';
  } else if (norm.includes('good time') || norm.includes('oreo') || norm.includes('roma')) {
    code = 7;
    mfr = 'PT Arnott Indonesia';
  } else if (norm.includes('indomie')) {
    code = 8;
    mfr = 'PT Indofood CBP Sukses Makmur Tbk';
  } else if (norm.includes('sedaap')) {
    code = 8;
    mfr = 'PT Sayap Mas Utama (Wings Food)';
  } else if (norm.includes('aqua')) {
    code = 9;
    mfr = 'PT Tirta Investama (Danone)';
  } else if (norm.includes('le minerale')) {
    code = 9;
    mfr = 'PT Mayora Indah Tbk';
  } else if (norm.includes('kapal api') || norm.includes('good day') || norm.includes('nescafe')) {
    code = 10;
    mfr = 'PT Santos Jaya Abadi';
  } else if (norm.includes('ultra milk') || norm.includes('bear brand')) {
    code = 11;
    mfr = 'PT Ultrajaya Milk Industry Tbk';
  } else if (norm.includes('frisian flag')) {
    code = 12;
    mfr = 'PT Frisian Flag Indonesia';
  } else if (norm.includes('attack')) {
    code = 13;
    mfr = 'PT Kao Indonesia';
  } else if (norm.includes('rinso') || norm.includes('daia') || norm.includes('molto')) {
    code = 13;
    mfr = 'PT Unilever Indonesia Tbk';
  } else if (norm.includes('lifebuoy') || norm.includes('biore')) {
    code = 14;
    mfr = 'PT Unilever Indonesia Tbk';
  } else if (norm.includes('clear')) {
    code = 15;
    mfr = 'PT Unilever Indonesia Tbk';
  } else if (norm.includes('pantene')) {
    code = 15;
    mfr = 'PT Procter & Gamble Indonesia';
  } else if (norm.includes('sunsilk')) {
    code = 15;
    mfr = 'PT Unilever Indonesia Tbk';
  } else if (norm.includes('pepsodent') || norm.includes('close up')) {
    code = 16;
    mfr = 'PT Unilever Indonesia Tbk';
  } else if (norm.includes('paseo')) {
    code = 17;
    mfr = 'PT Asian Paper Mills';
  } else if (norm.includes('coca-cola') || norm.includes('sprite') || norm.includes('fanta') || norm.includes('pocari') || norm.includes('you c1000')) {
    code = 18;
    mfr = 'PT Coca-Cola Europacific Partners Indonesia';
  } else if (norm.includes('botan')) {
    code = 19;
    mfr = 'PT Maya Muncar';
  } else if (norm.includes('bango')) {
    code = 20;
    mfr = 'PT Unilever Indonesia Tbk';
  } else if (norm.includes('gulaku') || norm.includes('bogasari') || norm.includes('ramos')) {
    code = 21;
    mfr = 'PT Sugar Group Companies';
  } else if (norm.includes('kopiko') || norm.includes('silverqueen')) {
    code = 22;
    mfr = 'PT Mayora Indah Tbk';
  } else if (norm.includes('mamypoko')) {
    code = 23;
    mfr = 'PT Uni-Charm Indonesia Tbk';
  } else if (norm.includes('vitalis')) {
    code = 24;
    mfr = 'PT Unza Vitalis';
  } else if (norm.includes('sunlight') || norm.includes('mama lemon')) {
    code = 25;
    mfr = 'PT Unilever Indonesia Tbk';
  } else if (norm.includes('bodrex')) {
    code = 26;
    mfr = 'PT Tempo Scan Pacific Tbk';
  } else if (norm.includes('walls')) {
    code = 28;
    mfr = 'PT Unilever Indonesia Tbk';
  } else if (norm.includes('so good')) {
    code = 29;
    mfr = 'PT So Good Food';
  } else if (norm.includes('sari roti')) {
    code = 30;
    mfr = 'PT Nippon Indosari Corpindo Tbk';
  } else {
    // 3. Pencocokan dari Dataset Baku INITIAL_BRANDS
    const canonBrand = INITIAL_BRANDS.find(
      (ib) => ib.name.toLowerCase() === norm || norm.includes(ib.name.toLowerCase())
    );
    if (canonBrand && canonBrand.categoryCode) {
      code = canonBrand.categoryCode;
      mfr = canonBrand.manufacturer || 'Principal Resmi';
    } else if (brandObj?.categoryCode) {
      code = brandObj.categoryCode;
      mfr = brandObj.manufacturer || 'Principal Resmi';
    }
  }

  const nameEn = CATEGORY_LOCALIZATIONS[code]?.en || 'General Category';
  const nameId = CATEGORY_LOCALIZATIONS[code]?.id || 'Kategori Umum';
  const catName = lang === 'en' ? nameEn : nameId;

  return {
    categoryCode: code,
    categoryName: catName,
    categoryNameEn: nameEn,
    categoryNameId: nameId,
    manufacturer: mfr,
  };
};

export const INITIAL_SUPPLIERS: SupplierMaster[] = RAW_SUPPLIER_LIST.map((s) => ({
  id: s.id,
  code: s.id,
  name: s.name,
  contactPerson: 'Account Manager Distrik',
  phone: s.phone,
  email: `order@${s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.id`,
  address: s.address,
  paymentTerms: s.paymentTerms,
  activePoCount: 1,
  status: 'Active',
}));

// 30 MASTER PRODUK RESMI (PLU-001 s/d PLU-030 DARI 30 KATEGORI BERBEDA)
export const RAW_CANONICAL_ERP_PRODUCTS: Product[] = [
  // 1. CategoryCode 1: Energy Drink
  {
    id: 'PRD-8992753001018',
    plu: 'PLU-001',
    barcode: '8992753001018',
    name: 'Kratingdaeng Energy Drink Botol 150ml',
    description: 'Kratingdaeng Minuman Energi Suplemen Kesehatan Botol Kaca 150ml',
    categoryCode: 1,
    category: 'Energy Drink',
    brand: 'Kratingdaeng',
    manufacturer: 'PT Asia Sejahtera Perdana',
    unit: 'Btl',
    price_retail: 7500,
    price_member: 7000,
    price_wholesale: 6500,
    sell_price: 7500,
    cost_price: 5500,
    stock: 120,
    initialStock: 120,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 2. CategoryCode 2: Cooking Oil
  {
    id: 'PRD-8998866100125',
    plu: 'PLU-002',
    barcode: '8998866100125',
    name: 'Bimoli Minyak Goreng Klasik Pouch 2L',
    description: 'Bimoli Minyak Goreng Kelapa Sawit Murni Pouch 2 Liter',
    categoryCode: 2,
    category: 'Cooking Oil',
    brand: 'Bimoli',
    manufacturer: 'PT Salim Ivomas Pratama Tbk',
    unit: 'Pcs',
    price_retail: 38500,
    price_member: 37000,
    price_wholesale: 35500,
    sell_price: 38500,
    cost_price: 32000,
    stock: 95,
    initialStock: 95,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 3. CategoryCode 3: Chilli Sauce
  {
    id: 'PRD-8993175110010',
    plu: 'PLU-003',
    barcode: '8993175110010',
    name: 'ABC Sambal Asli Botol Kaca 335ml',
    description: 'ABC Sambal Asli Pedas Alami Botol Kaca 335ml',
    categoryCode: 3,
    category: 'Chilli Sauce',
    brand: 'ABC',
    manufacturer: 'PT Heinz ABC Indonesia',
    unit: 'Btl',
    price_retail: 16500,
    price_member: 15500,
    price_wholesale: 14200,
    sell_price: 16500,
    cost_price: 12500,
    stock: 110,
    initialStock: 110,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 4. CategoryCode 4: Margarine
  {
    id: 'PRD-8992762001013',
    plu: 'PLU-004',
    barcode: '8992762001013',
    name: 'Blue Band Margarin Serbaguna Sachet 200g',
    description: 'Blue Band Margarin Serbaguna Kaya Vitamin Sachet 200g',
    categoryCode: 4,
    category: 'Margarine',
    brand: 'Blue Band',
    manufacturer: 'PT Upfield Indonesia',
    unit: 'Sachet',
    price_retail: 11000,
    price_member: 10200,
    price_wholesale: 9500,
    sell_price: 11000,
    cost_price: 8200,
    stock: 140,
    initialStock: 140,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 5. CategoryCode 5: Tea
  {
    id: 'PRD-8991002105401',
    plu: 'PLU-005',
    barcode: '8991002105401',
    name: 'Teh Botol Sosro Kotak Tetra 250ml',
    description: 'Teh Botol Sosro Minuman Teh Asli Kotak Tetra Pak 250ml',
    categoryCode: 5,
    category: 'Tea',
    brand: 'Sosro',
    manufacturer: 'PT Sinar Sosro',
    unit: 'Box',
    price_retail: 4000,
    price_member: 3600,
    price_wholesale: 3200,
    sell_price: 4000,
    cost_price: 2700,
    stock: 180,
    initialStock: 180,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 6. CategoryCode 6: Snack
  {
    id: 'PRD-8996001301019',
    plu: 'PLU-006',
    barcode: '8996001301019',
    name: 'Chitato Keripik Kentang Sapi Panggang 68g',
    description: 'Chitato Potato Chips Rasa Sapi Panggang Gurih Renyah 68g',
    categoryCode: 6,
    category: 'Snack',
    brand: 'Chitato',
    manufacturer: 'PT Indofood Fortuna Makmur',
    unit: 'Pcs',
    price_retail: 11500,
    price_member: 10800,
    price_wholesale: 10000,
    sell_price: 11500,
    cost_price: 8800,
    stock: 130,
    initialStock: 130,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 7. CategoryCode 7: Biscuit
  {
    id: 'PRD-8992741982103',
    plu: 'PLU-007',
    barcode: '8992741982103',
    name: 'Good Time Cookies Double Choc 72g',
    description: 'Good Time Cookies Choco Chip Cokelat Nikmat Renyah 72g',
    categoryCode: 7,
    category: 'Biscuit',
    brand: 'Good Time',
    manufacturer: 'PT Arnott Indonesia',
    unit: 'Box',
    price_retail: 8500,
    price_member: 7900,
    price_wholesale: 7300,
    sell_price: 8500,
    cost_price: 6200,
    stock: 115,
    initialStock: 115,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 8. CategoryCode 8: Instant Noodle
  {
    id: 'PRD-8998866200214',
    plu: 'PLU-008',
    barcode: '8998866200214',
    name: 'Indomie Mi Goreng Spesial 85g',
    description: 'Indomie Mi Goreng Instan Bumbu Spesial & Bawang Goreng 85g',
    categoryCode: 8,
    category: 'Instant Noodle',
    brand: 'Indomie',
    manufacturer: 'PT Indofood CBP Sukses Makmur Tbk',
    unit: 'Pcs',
    price_retail: 3500,
    price_member: 3300,
    price_wholesale: 3000,
    sell_price: 3500,
    cost_price: 2600,
    stock: 350,
    initialStock: 350,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 9. CategoryCode 9: Mineral Water
  {
    id: 'PRD-8992760300013',
    plu: 'PLU-009',
    barcode: '8992760300013',
    name: 'Aqua Air Mineral Alami Pegunungan 600ml',
    description: 'Aqua Danone Air Mineral Murni Alami Pegunungan Botol 600ml',
    categoryCode: 9,
    category: 'Mineral Water',
    brand: 'Aqua',
    manufacturer: 'PT Tirta Investama',
    unit: 'Btl',
    price_retail: 3500,
    price_member: 3200,
    price_wholesale: 2900,
    sell_price: 3500,
    cost_price: 2400,
    stock: 240,
    initialStock: 240,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 10. CategoryCode 10: Coffee
  {
    id: 'PRD-8991102220119',
    plu: 'PLU-010',
    barcode: '8991102220119',
    name: 'Kapal Api Kopi Special Mix Bag 10x24g',
    description: 'Kapal Api Kopi Bubuk Hitam Mantap plus Gula 10 Sachet x 24g',
    categoryCode: 10,
    category: 'Coffee',
    brand: 'Kapal Api',
    manufacturer: 'PT Santos Jaya Abadi',
    unit: 'Box',
    price_retail: 15500,
    price_member: 14500,
    price_wholesale: 13500,
    sell_price: 15500,
    cost_price: 11800,
    stock: 125,
    initialStock: 125,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 11. CategoryCode 11: Milk
  {
    id: 'PRD-8992753210045',
    plu: 'PLU-011',
    barcode: '8992753210045',
    name: 'Ultra Milk Susu UHT Cokelat 250ml',
    description: 'Ultra Milk Susu Cair UHT Rasa Cokelat Segar Alami Kotak 250ml',
    categoryCode: 11,
    category: 'Milk',
    brand: 'Ultra Milk',
    manufacturer: 'PT Ultrajaya Milk Industry Tbk',
    unit: 'Box',
    price_retail: 6500,
    price_member: 6000,
    price_wholesale: 5500,
    sell_price: 6500,
    cost_price: 4900,
    stock: 160,
    initialStock: 160,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 12. CategoryCode 12: Sweetened Condensed Milk
  {
    id: 'PRD-8992775110028',
    plu: 'PLU-012',
    barcode: '8992775110028',
    name: 'Frisian Flag Bendera Kental Manis Putih 370g',
    description: 'Frisian Flag Susu Kental Manis Full Cream Kaleng 370g',
    categoryCode: 12,
    category: 'Sweetened Condensed Milk',
    brand: 'Frisian Flag',
    manufacturer: 'PT Frisian Flag Indonesia',
    unit: 'Can',
    price_retail: 13000,
    price_member: 12200,
    price_wholesale: 11500,
    sell_price: 13000,
    cost_price: 9800,
    stock: 100,
    initialStock: 100,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 13. CategoryCode 13: Detergent
  {
    id: 'PRD-8992727001012',
    plu: 'PLU-013',
    barcode: '8992727001012',
    name: 'Attack Clean Maximizer Deterjen Bubuk 800g',
    description: 'Kao Attack Clean Maximizer Deterjen Anti Bau & Noda Membandel 800g',
    categoryCode: 13,
    category: 'Detergent',
    brand: 'Attack',
    manufacturer: 'PT Kao Indonesia',
    unit: 'Pcs',
    price_retail: 18500,
    price_member: 17500,
    price_wholesale: 16200,
    sell_price: 18500,
    cost_price: 14500,
    stock: 90,
    initialStock: 90,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 14. CategoryCode 14: Toilet Soap
  {
    id: 'PRD-8999999710317',
    plu: 'PLU-014',
    barcode: '8999999710317',
    name: 'Lifebuoy Sabun Mandi Bar Total 10 110g',
    description: 'Lifebuoy Total 10 Sabun Batang Anti Bakteri Perlindungan Kuman 110g',
    categoryCode: 14,
    category: 'Toilet Soap',
    brand: 'Lifebuoy',
    manufacturer: 'PT Unilever Indonesia Tbk',
    unit: 'Pcs',
    price_retail: 5500,
    price_member: 5000,
    price_wholesale: 4600,
    sell_price: 5500,
    cost_price: 3900,
    stock: 150,
    initialStock: 150,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 15. CategoryCode 15: Shampoo
  {
    id: 'PRD-8999999014118',
    plu: 'PLU-015',
    barcode: '8999999014118',
    name: 'Clear Men Anti Dandruff Cool Sport Menthol 160ml',
    description: 'Clear Men Shampoo Anti Ketombe Sensasi Dingin Menthol Segar 160ml',
    categoryCode: 15,
    category: 'Shampoo',
    brand: 'Clear',
    manufacturer: 'PT Unilever Indonesia Tbk',
    unit: 'Btl',
    price_retail: 28500,
    price_member: 26800,
    price_wholesale: 24900,
    sell_price: 28500,
    cost_price: 21500,
    stock: 85,
    initialStock: 85,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 16. CategoryCode 16: Toothpaste
  {
    id: 'PRD-8993175538012',
    plu: 'PLU-016',
    barcode: '8993175538012',
    name: 'Pepsodent Pasta Gigi Pencegah Gigi Berlubang 190g',
    description: 'Pepsodent Pencegah Gigi Berlubang Perlindungan Mikro Kalsium Aktif 190g',
    categoryCode: 16,
    category: 'Toothpaste',
    brand: 'Pepsodent',
    manufacturer: 'PT Unilever Indonesia Tbk',
    unit: 'Pcs',
    price_retail: 14500,
    price_member: 13500,
    price_wholesale: 12400,
    sell_price: 14500,
    cost_price: 10800,
    stock: 110,
    initialStock: 110,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 17. CategoryCode 17: Tissue
  {
    id: 'PRD-8992388110052',
    plu: 'PLU-017',
    barcode: '8992388110052',
    name: 'Paseo Facial Tissue Soft Pack 250 Sheets',
    description: 'Paseo Tisu Wajah Halus Lembut Higienis 250 Lembar 2 Ply',
    categoryCode: 17,
    category: 'Tissue',
    brand: 'Paseo',
    manufacturer: 'PT Asian Paper Mills',
    unit: 'Pcs',
    price_retail: 16500,
    price_member: 15200,
    price_wholesale: 14000,
    sell_price: 16500,
    cost_price: 12200,
    stock: 95,
    initialStock: 95,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 18. CategoryCode 18: Soft Drink
  {
    id: 'PRD-8999999052028',
    plu: 'PLU-018',
    barcode: '8999999052028',
    name: 'Coca-Cola Rasa Asli Botol PET 390ml',
    description: 'Coca-Cola Minuman Berkarbonasi Segar Dingin Botol PET 390ml',
    categoryCode: 18,
    category: 'Soft Drink',
    brand: 'Coca-Cola',
    manufacturer: 'PT Coca-Cola Europacific Partners Indonesia',
    unit: 'Btl',
    price_retail: 6000,
    price_member: 5500,
    price_wholesale: 5000,
    sell_price: 6000,
    cost_price: 4300,
    stock: 140,
    initialStock: 140,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 19. CategoryCode 19: Canned Food
  {
    id: 'PRD-8992695120015',
    plu: 'PLU-019',
    barcode: '8992695120015',
    name: 'Botan Ikan Sarden Saus Tomat Kaleng 155g',
    description: 'Botan Sarden Saus Tomat Gurih Siap Saji Kaleng 155g',
    categoryCode: 19,
    category: 'Canned Food',
    brand: 'Botan',
    manufacturer: 'PT Maya Muncar',
    unit: 'Can',
    price_retail: 12500,
    price_member: 11800,
    price_wholesale: 10900,
    sell_price: 12500,
    cost_price: 9400,
    stock: 105,
    initialStock: 105,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 20. CategoryCode 20: Sweet Soy Sauce
  {
    id: 'PRD-8999999551019',
    plu: 'PLU-020',
    barcode: '8999999551019',
    name: 'Bango Kecap Manis Kedelai Hitam Pouch 550ml',
    description: 'Bango Kecap Manis Alami dari Kedelai Hitam Malika Pouch Refill 550ml',
    categoryCode: 20,
    category: 'Sweet Soy Sauce',
    brand: 'Bango',
    manufacturer: 'PT Unilever Indonesia Tbk',
    unit: 'Pcs',
    price_retail: 24500,
    price_member: 23000,
    price_wholesale: 21500,
    sell_price: 24500,
    cost_price: 19200,
    stock: 115,
    initialStock: 115,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 21. CategoryCode 21: Rice
  {
    id: 'PRD-8991001100213',
    plu: 'PLU-021',
    barcode: '8991001100213',
    name: 'Sania Beras Premium Pulen Alami 5kg',
    description: 'Sania Beras Premium Pilihan Pulen Putih Bersih Karung 5kg',
    categoryCode: 21,
    category: 'Rice',
    brand: 'Sania',
    manufacturer: 'PT Wilmar Nabati Indonesia',
    unit: 'Box',
    price_retail: 74500,
    price_member: 72000,
    price_wholesale: 69000,
    sell_price: 74500,
    cost_price: 63000,
    stock: 70,
    initialStock: 70,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 22. CategoryCode 22: Confectionery
  {
    id: 'PRD-8992761001021',
    plu: 'PLU-022',
    barcode: '8992761001021',
    name: 'Kopiko Permen Kopi Asli Blister 32g',
    description: 'Kopiko Permen Kopi Rasa Kopi Asli Nikmat Praktis Blister 32g',
    categoryCode: 22,
    category: 'Confectionery',
    brand: 'Kopiko',
    manufacturer: 'PT Mayora Indah Tbk',
    unit: 'Sachet',
    price_retail: 4500,
    price_member: 4100,
    price_wholesale: 3700,
    sell_price: 4500,
    cost_price: 3200,
    stock: 160,
    initialStock: 160,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 23. CategoryCode 23: Baby Care
  {
    id: 'PRD-8992735002145',
    plu: 'PLU-023',
    barcode: '8992735002145',
    name: 'MamyPoko Pants Standar M 20 Pcs',
    description: 'MamyPoko Popok Celana Bayi Standar Ukuran M Isi 20 Lembar',
    categoryCode: 23,
    category: 'Baby Care',
    brand: 'MamyPoko',
    manufacturer: 'PT Uni-Charm Indonesia Tbk',
    unit: 'Pcs',
    price_retail: 38000,
    price_member: 36000,
    price_wholesale: 34000,
    sell_price: 38000,
    cost_price: 30500,
    stock: 80,
    initialStock: 80,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 24. CategoryCode 24: Personal Care
  {
    id: 'PRD-8992781002010',
    plu: 'PLU-024',
    barcode: '8992781002010',
    name: 'Vitalis Eau De Cologne Femme Botol 100ml',
    description: 'Vitalis Parfum Wangi Segar Tahan Lama Eau De Cologne Botol 100ml',
    categoryCode: 24,
    category: 'Personal Care',
    brand: 'Vitalis',
    manufacturer: 'PT Unza Vitalis',
    unit: 'Btl',
    price_retail: 23500,
    price_member: 22000,
    price_wholesale: 20500,
    sell_price: 23500,
    cost_price: 18000,
    stock: 75,
    initialStock: 75,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 25. CategoryCode 25: Dishwashing Liquid
  {
    id: 'PRD-8992727001036',
    plu: 'PLU-025',
    barcode: '8992727001036',
    name: 'Sunlight Pencuci Piring Jeruk Nipis Refill 650ml',
    description: 'Sunlight Sabun Cuci Piring Ekstrak Jeruk Nipis Asli Anti Lemak 650ml',
    categoryCode: 25,
    category: 'Dishwashing Liquid',
    brand: 'Sunlight',
    manufacturer: 'PT Unilever Indonesia Tbk',
    unit: 'Pcs',
    price_retail: 14000,
    price_member: 13000,
    price_wholesale: 12000,
    sell_price: 14000,
    cost_price: 10500,
    stock: 120,
    initialStock: 120,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 26. CategoryCode 26: Pharmacy & OTC
  {
    id: 'PRD-8999999021017',
    plu: 'PLU-026',
    barcode: '8999999021017',
    name: 'Bodrex Obat Sakit Kepala Strip 20 Tablet',
    description: 'Bodrex Obat Meredakan Sakit Kepala & Demam Strip 20 Kaplet/Tablet',
    categoryCode: 26,
    category: 'Pharmacy & OTC',
    brand: 'Bodrex',
    manufacturer: 'PT Tempo Scan Pacific Tbk',
    unit: 'Box',
    price_retail: 11000,
    price_member: 10000,
    price_wholesale: 9200,
    sell_price: 11000,
    cost_price: 8100,
    stock: 135,
    initialStock: 135,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 27. CategoryCode 27: Battery
  {
    id: 'PRD-8992775110035',
    plu: 'PLU-027',
    barcode: '8992775110035',
    name: 'ABC Baterai Alkaline Millennium Power AA 4 Pcs',
    description: 'ABC Baterai Alkaline Tahan Lama Ukuran AA Pack Isi 4 Buah',
    categoryCode: 27,
    category: 'Battery',
    brand: 'ABC Battery',
    manufacturer: 'PT International Chemical Industry',
    unit: 'Box',
    price_retail: 24000,
    price_member: 22500,
    price_wholesale: 21000,
    sell_price: 24000,
    cost_price: 18500,
    stock: 90,
    initialStock: 90,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 28. CategoryCode 28: Ice Cream
  {
    id: 'PRD-8992760100026',
    plu: 'PLU-028',
    barcode: '8992760100026',
    name: 'Walls Feast Cokelat Es Krim Stik 65ml',
    description: 'Walls Feast Es Krim Rasa Cokelat Berlapis Cokelat Renyah & Kacang 65ml',
    categoryCode: 28,
    category: 'Ice Cream',
    brand: 'Walls',
    manufacturer: 'PT Unilever Indonesia Tbk',
    unit: 'Pcs',
    price_retail: 6000,
    price_member: 5500,
    price_wholesale: 5000,
    sell_price: 6000,
    cost_price: 4400,
    stock: 110,
    initialStock: 110,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 29. CategoryCode 29: Frozen Food
  {
    id: 'PRD-8992760100033',
    plu: 'PLU-029',
    barcode: '8992760100033',
    name: 'So Good Chicken Nugget Original Box 400g',
    description: 'So Good Nugget Ayam Olahan Daging Segar Original Gurih 400g',
    categoryCode: 29,
    category: 'Frozen Food',
    brand: 'So Good',
    manufacturer: 'PT So Good Food',
    unit: 'Box',
    price_retail: 42000,
    price_member: 40000,
    price_wholesale: 37500,
    sell_price: 42000,
    cost_price: 34000,
    stock: 85,
    initialStock: 85,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
  // 30. CategoryCode 30: Bread & Bakery
  {
    id: 'PRD-8992762002010',
    plu: 'PLU-030',
    barcode: '8992762002010',
    name: 'Sari Roti Roti Tawar Spesial Kupas 10 Slices',
    description: 'Sari Roti Roti Tawar Gandum Lembut Tanpa Kulit Isi 10 Lembar',
    categoryCode: 30,
    category: 'Bread & Bakery',
    brand: 'Sari Roti',
    manufacturer: 'PT Nippon Indosari Corpindo Tbk',
    unit: 'Box',
    price_retail: 16000,
    price_member: 15000,
    price_wholesale: 14000,
    sell_price: 16000,
    cost_price: 12500,
    stock: 65,
    initialStock: 65,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  },
];

// Enrich official ERP products with standard local distributor information
export const INITIAL_ERP_MASTER_PRODUCTS: Product[] = RAW_CANONICAL_ERP_PRODUCTS.map((p) => {
  const catCode = Number(p.categoryCode) || 9;
  const defSup = getDefaultSupplierForCategory(catCode);
  return {
    ...p,
    itemType: 'RETAIL',
    supplier: p.supplier || defSup.name,
    supplierPhone: p.supplierPhone || defSup.phone,
    supplierAddress: p.supplierAddress || defSup.address,
    supplierNotes: p.supplierNotes || `${defSup.paymentTerms} (${defSup.notes})`,
  };
});

export const INITIAL_CUSTOMERS: CustomerMaster[] = [
  { id: 'CS000001', code: 'CS000001', customer_code: 'CS000001', name: 'Andi', memberTier: 'Gold', tier_level: 'Gold', phone: '0812-1111-2222', email: 'andi@gmail.com', points: 250, totalSpent: 1250000, total_spending_current_period: 1250000, status: 'Active', has_store: false, allowed_tiers: ['RETAIL', 'MEMBER'] },
  { id: 'CS000002', code: 'CS000002', customer_code: 'CS000002', name: 'Budi', memberTier: 'Platinum', tier_level: 'Platinum', phone: '0812-3333-4444', email: 'budi@gmail.com', points: 580, totalSpent: 3500000, total_spending_current_period: 3500000, status: 'Active', has_store: true, store_name: 'Toko Budi Berkah', store_address: 'Jl. Kenanga No. 8, Jakarta Selatan', allowed_tiers: ['RETAIL', 'MEMBER', 'WHOLESALE'] },
  ...DUMMY_STORE_CUSTOMERS,
  { id: 'MBR-001', code: 'VIP-7781', name: 'Bapak Ir. Bambang Hermanto', memberTier: 'Platinum', tier_level: 'Platinum', phone: '0812-8899-0101', email: 'bambang.hermanto@gmail.com', points: 14250, totalSpent: 28500000, total_spending_current_period: 28500000, status: 'Active', has_store: true, store_name: 'Toko Sumber Rejeki Grosir', store_address: 'Jl. Ahmad Yani No. 45, Surabaya', allowed_tiers: ['RETAIL', 'MEMBER', 'WHOLESALE'] },
  { id: 'MBR-002', code: 'VIP-7782', name: 'Ibu Dr. Hj. Nurul Hidayah', memberTier: 'Platinum', tier_level: 'Platinum', phone: '0813-1122-3344', email: 'nurul.hidayah@rskencana.org', points: 12800, totalSpent: 24350000, total_spending_current_period: 24350000, status: 'Active', has_store: false, allowed_tiers: ['RETAIL', 'MEMBER'] },
  { id: 'MBR-003', code: 'VIP-7783', name: 'Bapak Richard Hartono', memberTier: 'Platinum', tier_level: 'Platinum', phone: '0811-9988-7711', email: 'richard.hartono@djarum.com', points: 18900, totalSpent: 36200000, total_spending_current_period: 36200000, status: 'Active', has_store: true, store_name: 'UD Maju Bersama Mart', store_address: 'Komp. Ruko Central Niaga Blok B-2, Semarang', allowed_tiers: ['RETAIL', 'MEMBER', 'WHOLESALE'] },
  { id: 'MBR-004', code: 'GLD-5501', name: 'Ibu Cindy Claudia Anggraeni', memberTier: 'Gold', tier_level: 'Gold', phone: '0818-0808-9922', email: 'cindy.anggraeni@gmail.com', points: 7420, totalSpent: 14840000, total_spending_current_period: 5840000, status: 'Active', has_store: false, allowed_tiers: ['RETAIL', 'MEMBER'] },
  { id: 'MBR-005', code: 'GLD-5502', name: 'Bapak Ahmad Fauzi Rahman', memberTier: 'Gold', tier_level: 'Gold', phone: '0857-1234-5678', email: 'fauzi.rahman@bca.co.id', points: 6850, totalSpent: 13700000, total_spending_current_period: 4700000, status: 'Active', has_store: false, allowed_tiers: ['RETAIL', 'MEMBER'] },
  { id: 'MBR-006', code: 'GLD-5503', name: 'Ibu Sylvia Novita', memberTier: 'Gold', tier_level: 'Gold', phone: '0878-8787-1123', email: 'sylvia.novita@yahoo.com', points: 8100, totalSpent: 16200000, total_spending_current_period: 6200000, status: 'Active', has_store: false, allowed_tiers: ['RETAIL', 'MEMBER'] },
  { id: 'MBR-007', code: 'GLD-5504', name: 'Bapak Dimas Arya Putra', memberTier: 'Gold', tier_level: 'Gold', phone: '0812-4455-6677', email: 'dimas.arya@telkomsel.co.id', points: 5900, totalSpent: 11800000, total_spending_current_period: 3800000, status: 'Active', has_store: true, store_name: 'Kios Pulsa & Sembako Dimas', store_address: 'Jl. Kaliurang KM 7, Yogyakarta', allowed_tiers: ['RETAIL', 'MEMBER', 'WHOLESALE'] },
  { id: 'MBR-008', code: 'SLV-3301', name: 'Ibu Maya Septiani', memberTier: 'Silver', tier_level: 'Silver', phone: '0813-9090-1234', email: 'maya.septiani@gmail.com', points: 3400, totalSpent: 6800000, total_spending_current_period: 1800000, status: 'Active', has_store: false, allowed_tiers: ['RETAIL', 'MEMBER'] },
  { id: 'MBR-009', code: 'SLV-3302', name: 'Bapak Rian Hidayatullah', memberTier: 'Silver', tier_level: 'Silver', phone: '0856-7890-1234', email: 'rian.hidayat@pertamina.com', points: 2950, totalSpent: 5900000, total_spending_current_period: 1400000, status: 'Active', has_store: false, allowed_tiers: ['RETAIL', 'MEMBER'] },
  { id: 'MBR-010', code: 'SLV-3303', name: 'Ibu Kartika Sari Wulandari', memberTier: 'Silver', tier_level: 'Silver', phone: '0812-3333-8899', email: 'kartika.sari@outlook.com', points: 4120, totalSpent: 8240000, total_spending_current_period: 2100000, status: 'Active', has_store: false, allowed_tiers: ['RETAIL', 'MEMBER'] },
];

export const generateInternalProductCode = (
  name?: string,
  category?: string,
  existingProducts: Product[] = []
): string => {
  let prefix = 'PR';
  if (name && name.trim().length >= 2) {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      prefix = (words[0][0] + words[1][0]).toUpperCase();
    } else {
      prefix = name.trim().slice(0, 2).toUpperCase();
    }
  } else if (category && category.trim().length >= 2) {
    prefix = category.trim().slice(0, 2).toUpperCase();
  }

  const nextNum = existingProducts.length + 1;
  const numStr = String(nextNum).padStart(5, '0');
  return `${prefix}${numStr}`;
};
