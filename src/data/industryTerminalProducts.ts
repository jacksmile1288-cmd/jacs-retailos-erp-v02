import { Product, CartItem, FashionVariantCell } from '../types';

export type TerminalIndustry =
  | 'retail'        // KASIR 01, 03 (Modern Retail & Wholesale)
  | 'fnb'           // KASIR 02 (Food & Beverage)
  | 'pharmacy'      // KASIR 04 (Pharmacy & Healthcare)
  | 'fashion'       // KASIR 05 (Fashion & Apparel)
  | 'building'      // KASIR 06 (Building Materials & Hardware) & KASIR 09 (Building & Hardware Depot)
  | 'electronics'   // KASIR 07 (Electronics & Gadgets)
  | 'workshop'      // KASIR 08 (Automotive & Workshop)
  | 'salon'         // KASIR 10 (Salon & Barbershop)
  | 'laundry';      // POS Laundry Multi-Satuan

/**
 * Mendeteksi jenis industri dari terminal kasir yang sedang aktif.
 */
export function getTerminalIndustry(terminal?: {
  id?: string;
  name?: string;
  code?: string;
  modelType?: string;
  businessModel?: string;
  location?: string;
} | null): TerminalIndustry {
  if (!terminal) return 'retail';
  const id = (terminal.id || '').toUpperCase();
  const name = (terminal.name || '').toUpperCase();
  const code = (terminal.code || '').toUpperCase();
  const modelType = (terminal.modelType || '').toLowerCase();
  const businessModel = (terminal.businessModel || '').toLowerCase();
  const location = (terminal.location || '').toLowerCase();

  // 0. Prioritaskan explicit modelType jika ada
  if (modelType === 'retail' || modelType === 'supermarket' || modelType === 'warung') return 'retail';
  if (modelType === 'fnb') return 'fnb';
  if (modelType === 'pharmacy') return 'pharmacy';
  if (modelType === 'fashion') return 'fashion';
  if (modelType === 'building') return 'building';
  if (modelType === 'electronics' || modelType === 'gadget') return 'electronics';
  if (modelType === 'workshop' || modelType === 'automotive') return 'workshop';
  if (modelType === 'laundry') return 'laundry';
  if (modelType === 'salon' || modelType === 'service' || modelType === 'services') return 'salon';

  // 0b. Prioritaskan businessModel jika secara eksplisit didefinisikan
  if (
    businessModel.includes('retail') ||
    businessModel.includes('ritel') ||
    businessModel.includes('wholesaler') ||
    businessModel.includes('grosir') ||
    businessModel.includes('minimarket') ||
    businessModel.includes('supermarket')
  ) {
    return 'retail';
  }
  if (
    businessModel.includes('resto') ||
    businessModel.includes('kuliner') ||
    businessModel.includes('f&b') ||
    businessModel.includes('food & beverage')
  ) {
    return 'fnb';
  }
  if (
    businessModel.includes('pharmacy') ||
    businessModel.includes('pet') ||
    businessModel.includes('apotek') ||
    businessModel.includes('hewan')
  ) {
    return 'pharmacy';
  }
  if (
    businessModel.includes('busana') ||
    businessModel.includes('butik') ||
    businessModel.includes('fashion') ||
    businessModel.includes('apparel')
  ) {
    return 'fashion';
  }
  if (
    businessModel.includes('bangunan') ||
    businessModel.includes('depo') ||
    businessModel.includes('hardware') ||
    businessModel.includes('building')
  ) {
    return 'building';
  }
  if (
    businessModel.includes('elektronik') ||
    businessModel.includes('gawai') ||
    businessModel.includes('electronics') ||
    businessModel.includes('gadget')
  ) {
    return 'electronics';
  }
  if (
    businessModel.includes('bengkel') ||
    businessModel.includes('otomotif') ||
    businessModel.includes('workshop') ||
    businessModel.includes('automotive')
  ) {
    return 'workshop';
  }
  if (
    businessModel.includes('laundry') ||
    businessModel.includes('binatu') ||
    businessModel.includes('kiloan')
  ) {
    return 'laundry';
  }
  if (
    businessModel.includes('salon') ||
    businessModel.includes('pangkas') ||
    businessModel.includes('barber')
  ) {
    return 'salon';
  }

  // 1. F&B (KASIR 02) Fallback
  if (
    id === 'T-02' ||
    name.includes('KASIR 02') ||
    code === 'POS-02' ||
    location.includes('f&b')
  ) {
    return 'fnb';
  }

  // 2. Pharmacy & Pet Shop (KASIR 03)
  if (
    id === 'T-03' ||
    name.includes('KASIR 03') ||
    code === 'POS-03' ||
    modelType === 'pharmacy' ||
    businessModel.includes('pharmacy') ||
    businessModel.includes('pet') ||
    businessModel.includes('apotek') ||
    businessModel.includes('hewan') ||
    location.includes('pharmacy') ||
    location.includes('pet') ||
    location.includes('apotek')
  ) {
    return 'pharmacy';
  }

  // 3. Fashion & Apparel (KASIR 04)
  if (
    id === 'T-04' ||
    name.includes('KASIR 04') ||
    code === 'POS-04' ||
    modelType === 'fashion' ||
    businessModel.includes('busana') ||
    businessModel.includes('butik') ||
    businessModel.includes('fashion') ||
    businessModel.includes('apparel') ||
    location.includes('fashion') ||
    location.includes('apparel')
  ) {
    return 'fashion';
  }

  // 4. Building Materials & Hardware (KASIR 05 & KASIR 09)
  if (
    id === 'T-05' ||
    id === 'T-09' ||
    name.includes('KASIR 05') ||
    name.includes('KASIR 09') ||
    code === 'POS-05' ||
    code === 'POS-09' ||
    modelType === 'building' ||
    businessModel.includes('bangunan') ||
    businessModel.includes('depo') ||
    businessModel.includes('hardware') ||
    businessModel.includes('building') ||
    location.includes('building') ||
    location.includes('hardware') ||
    location.includes('bangunan')
  ) {
    return 'building';
  }

  // 5. Electronics & Gadgets (KASIR 06)
  if (
    id === 'T-06' ||
    name.includes('KASIR 06') ||
    code === 'POS-06' ||
    modelType === 'electronics' ||
    modelType === 'gadget' ||
    businessModel.includes('elektronik') ||
    businessModel.includes('gawai') ||
    businessModel.includes('electronics') ||
    businessModel.includes('gadget') ||
    location.includes('electronics') ||
    location.includes('gadget')
  ) {
    return 'electronics';
  }

  // 6. Automotive & Workshop (KASIR 07)
  if (
    id === 'T-07' ||
    name.includes('KASIR 07') ||
    code === 'POS-07' ||
    modelType === 'workshop' ||
    modelType === 'automotive' ||
    businessModel.includes('bengkel') ||
    businessModel.includes('otomotif') ||
    businessModel.includes('workshop') ||
    businessModel.includes('automotive') ||
    location.includes('automotive') ||
    location.includes('workshop') ||
    location.includes('bengkel')
  ) {
    return 'workshop';
  }

  // 7. Salon & Barbershop (KASIR 08 & KASIR 10)
  if (
    id === 'T-08' ||
    id === 'T-10' ||
    name.includes('KASIR 08') ||
    name.includes('KASIR 10') ||
    code === 'POS-08' ||
    code === 'POS-10' ||
    modelType === 'service' ||
    modelType === 'salon' ||
    businessModel.includes('salon') ||
    businessModel.includes('pangkas') ||
    businessModel.includes('barber') ||
    location.includes('salon') ||
    location.includes('barbershop')
  ) {
    return 'salon';
  }

  // 8. Retail & Wholesaler Modern (KASIR 01 & Default)
  return 'retail';
}

// =========================================================================
// KATALOG DUMMY PRODUK RESMI SETIAP TERMINAL (MINIMAL 5 PER INDUSTRI)
// =========================================================================

// 1. KASIR 01, 03, 06 (Modern Retail & Wholesale)
export const RETAIL_WHOLESALE_PRODUCTS: Product[] = [
  {
    id: 'RET-MGO-2L',
    plu: 'MGO-2L-BIMOLI',
    barcode: '8992345000101',
    name: 'Minyak Goreng Sawit 2L Pouch',
    category: 'Cooking Oil',
    brand: 'Bimoli Spesial',
    sell_price: 38500,
    cost_price: 31000,
    price_retail: 38500,
    price_member: 36500,
    price_wholesale: 34000,
    stock: 120,
    unit: 'Pouch 2L',
    status: 'Active',
    businessModel: 'retail',
    itemType: 'RETAIL',
    description: 'Minyak goreng sawit murni kemasan pouch 2 liter, harga bertingkat grosir/dus.',
  },
  {
    id: 'RET-BRS-5KG',
    plu: 'BRS-5KG-SANIA',
    barcode: '8992345000102',
    name: 'Beras Premium 5kg Pulen Wangi',
    category: 'Rice',
    brand: 'Sania',
    sell_price: 74000,
    cost_price: 61500,
    price_retail: 74000,
    price_member: 70000,
    price_wholesale: 66000,
    stock: 85,
    unit: 'Sak 5kg',
    status: 'Active',
    businessModel: 'retail',
    itemType: 'RETAIL',
    description: 'Beras putih premium kualitas terjamin, butiran utuh dan pulen.',
  },
  {
    id: 'RET-DET-800G',
    plu: 'DET-800G-ATK',
    barcode: '8992345000103',
    name: 'Deterjen Bubuk Plus Softener 800g',
    category: 'Detergent',
    brand: 'Attack Plus Softener',
    sell_price: 23500,
    cost_price: 17800,
    price_retail: 23500,
    price_member: 22000,
    price_wholesale: 20000,
    stock: 95,
    unit: 'Bag 800g',
    status: 'Active',
    businessModel: 'retail',
    itemType: 'RETAIL',
    description: 'Deterjen bubuk konsentrat dengan keharuman tahan lama dan pelembut serat pakaian.',
  },
  {
    id: 'RET-AQU-600ML',
    plu: 'AQUA-600',
    barcode: '8992753211112',
    name: 'Air Mineral Aqua 600ml (Dus/Pcs)',
    category: 'Mineral Water',
    brand: 'Danone Aqua',
    sell_price: 4000,
    cost_price: 2800,
    price_retail: 4000,
    price_member: 3800,
    price_wholesale: 3200,
    stock: 250,
    unit: 'Botol',
    unitSecondary: 'Dus (24 Btl)',
    priceSecondary: 76800,
    conversionRate: 24,
    status: 'Active',
    businessModel: 'retail',
    itemType: 'RETAIL',
    description: 'Air mineral alami 600ml. Tersedia eceran per botol atau grosir per dus (24 pcs).',
  },
  {
    id: 'RET-KPI-BAG',
    plu: 'KPI-BAG-KPL',
    barcode: '8992345000105',
    name: 'Kopi Instan Spesial Mix Bag (20 Sachet)',
    category: 'Coffee',
    brand: 'Kapal Api',
    sell_price: 26500,
    cost_price: 19500,
    price_retail: 26500,
    price_member: 24500,
    price_wholesale: 22500,
    stock: 110,
    unit: 'Bag',
    status: 'Active',
    businessModel: 'retail',
    itemType: 'RETAIL',
    description: 'Kopi bubuk instan campur gula mantap dalam kemasan bag hemat isi 20 sachet.',
  },
];

// 2. KASIR 02 (Food & Beverage / F&B - 18 Menu Lengkap Resto, Kafe & Bakery)
export const FNB_RESTAURANT_PRODUCTS: Product[] = [
  {
    id: 'FNB-KOP-AREN',
    plu: 'FNB-KOP-AREN',
    barcode: '899200200001',
    name: 'Kopi Susu Gula Aren Signature',
    category: 'Kopi',
    brand: 'Resto Cafe',
    sell_price: 22000,
    cost_price: 8500,
    price_retail: 22000,
    price_member: 20000,
    price_wholesale: 18000,
    stock: 150,
    unit: 'Cup',
    status: 'Active',
    businessModel: 'fnb',
    itemType: 'MENU_FB',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&auto=format&fit=crop&q=80',
    description: 'Perpaduan espresso arabica, fresh milk cream, dan sirup gula aren murni.',
    recipeSummary: 'Biji Kopi Espresso Blend 18gr, Susu Fresh Milk UHT 150ml, Gula Aren Cair 25ml, Paper Cup 16oz 1pcs',
    costing: {
      rawMaterialCost: 8500,
      operationalCost: 0,
      targetMarginPercent: 61,
      recommendedPrice: 22000,
      actualPrice: 22000,
      totalCost: 8500,
    },
    recipe: [
      { ingredientId: 'RM-FNB-012', name: 'Biji Kopi Espresso Blend', qty: 18, unit: 'gr', costPerUnit: 200 },
      { ingredientId: 'RM-FNB-014', name: 'Susu Fresh Milk UHT', qty: 150, unit: 'ml', costPerUnit: 16 },
      { ingredientId: 'RM-FNB-013', name: 'Gula Aren Cair', qty: 25, unit: 'ml', costPerUnit: 52 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', qty: 1, unit: 'pcs', costPerUnit: 1200 },
    ],
  },
  {
    id: 'FNB-ESP-SHOT',
    plu: 'FNB-ESP-SHOT',
    barcode: '899200200002',
    name: 'Espresso Roast Single / Double Shot',
    category: 'Kopi',
    brand: 'Resto Cafe',
    sell_price: 18000,
    cost_price: 5000,
    price_retail: 18000,
    price_member: 16000,
    price_wholesale: 15000,
    stock: 200,
    unit: 'Cup',
    status: 'Active',
    businessModel: 'fnb',
    itemType: 'MENU_FB',
    image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&auto=format&fit=crop&q=80',
    description: 'Ekstraksi kopi murni dengan crema emas tebal, pilihan Single / Double Shot.',
    recipeSummary: 'Biji Kopi Espresso Blend 19gr, Paper Cup 16oz 1pcs',
    costing: {
      rawMaterialCost: 5000,
      operationalCost: 0,
      targetMarginPercent: 72,
      recommendedPrice: 18000,
      actualPrice: 18000,
      totalCost: 5000,
    },
    recipe: [
      { ingredientId: 'RM-FNB-012', name: 'Biji Kopi Espresso Blend', qty: 19, unit: 'gr', costPerUnit: 200 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', qty: 1, unit: 'pcs', costPerUnit: 1200 },
    ],
  },
  {
    id: 'FNB-NASGOR-SP',
    plu: 'FNB-NASGOR-SP',
    barcode: '8992001001',
    name: 'Nasi Goreng Spesial Telur & Ayam',
    category: 'Makanan Utama',
    brand: 'Resto Kitchen',
    sell_price: 32000,
    cost_price: 15000,
    price_retail: 32000,
    price_member: 29000,
    price_wholesale: 26000,
    stock: 80,
    unit: 'Porsi',
    status: 'Active',
    businessModel: 'fnb',
    itemType: 'MENU_FB',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&auto=format&fit=crop&q=80',
    spicyOption: true,
    toppingOption: true,
    description: 'Nasi goreng bumbu racik khas nusantara dengan suwiran ayam, acar, dan telur ceplok.',
    recipeSummary: 'Beras Pulen 160gr, Daging Ayam 100gr, Telur Ayam 1pcs, Bumbu Rempah 45gr',
    costing: {
      rawMaterialCost: 15000,
      operationalCost: 0,
      targetMarginPercent: 53,
      recommendedPrice: 32000,
      actualPrice: 32000,
      totalCost: 15000,
    },
    recipe: [
      { ingredientId: 'RM-FNB-001', name: 'Beras Putih Pandan Wangi', qty: 160, unit: 'gr', costPerUnit: 15 },
      { ingredientId: 'RM-FNB-003', name: 'Daging Ayam Fillet Segar', qty: 100, unit: 'gr', costPerUnit: 55 },
      { ingredientId: 'RM-FNB-004', name: 'Telur Ayam Negeri Pilihan', qty: 1, unit: 'pcs', costPerUnit: 2000 },
      { ingredientId: 'RM-FNB-005', name: 'Bumbu Racik Rempah Spesial', qty: 45, unit: 'gr', costPerUnit: 70 },
      { ingredientId: 'RM-FNB-006', name: 'Minyak Goreng Sawit Chef', qty: 25, unit: 'ml', costPerUnit: 18 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', qty: 1, unit: 'pcs', costPerUnit: 1500 },
    ],
  },
  {
    id: 'FNB-CRS-BTR',
    plu: 'FNB-CRS-BTR',
    barcode: '899200200004',
    name: 'French Croissant Butter Crispy',
    category: 'Pastry & Bakery',
    brand: 'Resto Bakery',
    sell_price: 25000,
    cost_price: 11000,
    price_retail: 25000,
    price_member: 23000,
    price_wholesale: 20000,
    stock: 45,
    unit: 'Pcs',
    status: 'Active',
    businessModel: 'fnb',
    itemType: 'MENU_FB',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80',
    description: 'Roti croissant renyah berlapis dengan aroma mentega Prancis yang gurih.',
    recipeSummary: 'Pastry Butter Dough 1pcs, Keju Cheddar 1pcs, Fresh Milk 95ml, Box Eco 1pcs',
    costing: {
      rawMaterialCost: 11000,
      operationalCost: 0,
      targetMarginPercent: 56,
      recommendedPrice: 25000,
      actualPrice: 25000,
      totalCost: 11000,
    },
    recipe: [
      { ingredientId: 'RM-FNB-010', name: 'Roti Burger & Pastry Butter Dough', qty: 1, unit: 'pcs', costPerUnit: 5000 },
      { ingredientId: 'RM-FNB-011', name: 'Keju Slice Melt Cheddar', qty: 1, unit: 'pcs', costPerUnit: 3000 },
      { ingredientId: 'RM-FNB-014', name: 'Susu Fresh Milk UHT', qty: 95, unit: 'ml', costPerUnit: 16 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', qty: 1, unit: 'pcs', costPerUnit: 1500 },
    ],
  },
  {
    id: 'FNB-TEA-JUMBO',
    plu: 'FNB-TEA-JUMBO',
    barcode: '899200200005',
    name: 'Es Teh Manis Jumbo Segar',
    category: 'Non-Kopi / Segar',
    brand: 'Resto Kitchen',
    sell_price: 8000,
    cost_price: 2200,
    price_retail: 8000,
    price_member: 7000,
    price_wholesale: 6000,
    stock: 300,
    unit: 'Cup 22oz',
    status: 'Active',
    businessModel: 'fnb',
    itemType: 'MENU_FB',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80',
    description: 'Es teh seduh melati segar porsi jumbo 22oz pelepas dahaga.',
    recipeSummary: 'Daun Teh Melati Pilihan 2gr, Gula Cair 8ml, Paper Cup 16oz 1pcs',
    costing: {
      rawMaterialCost: 2200,
      operationalCost: 0,
      targetMarginPercent: 72,
      recommendedPrice: 8000,
      actualPrice: 8000,
      totalCost: 2200,
    },
    recipe: [
      { ingredientId: 'RM-FNB-015', name: 'Bubuk Matcha Jepang & Teh Melati', qty: 2, unit: 'gr', costPerUnit: 300 },
      { ingredientId: 'RM-FNB-013', name: 'Gula Aren Cair', qty: 8, unit: 'ml', costPerUnit: 50 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', qty: 1, unit: 'pcs', costPerUnit: 1200 },
    ],
  },
  {
    id: 'FNB-001',
    plu: 'FNB-001',
    name: 'Nasi Goreng Spesial Wagyu',
    itemType: 'MENU_FB',
    category: 'Makanan Utama',
    brand: 'Resto Kitchen',
    sell_price: 45000,
    cost_price: 25230,
    unit: 'Porsi',
    spicyOption: true,
    toppingOption: true,
    costing: {
      rawMaterialCost: 24100,
      operationalCost: 1500,
      targetMarginPercent: 45,
      recommendedPrice: 46500,
      actualPrice: 45000,
      totalCost: 25230,
    },
    stock: 50,
    status: 'Active',
    barcode: '899200100101',
    businessModel: 'fnb',
    wastePercent: 5,
    packagingCost: 1500,
    recipeSummary: 'Beras Pandan Wangi 150gr, Wagyu Slice 80gr, Telur 1pcs, Bumbu Rempah 50gr',
    recipe: [
      { ingredientId: 'RM-FNB-001', name: 'Beras Putih Pandan Wangi', qty: 150, unit: 'gr', costPerUnit: 15 },
      { ingredientId: 'RM-FNB-002', name: 'Daging Sapi Wagyu Slice', qty: 80, unit: 'gr', costPerUnit: 180 },
      { ingredientId: 'RM-FNB-004', name: 'Telur Ayam Negeri Pilihan', qty: 1, unit: 'pcs', costPerUnit: 2000 },
      { ingredientId: 'RM-FNB-005', name: 'Bumbu Racik Rempah Spesial', qty: 50, unit: 'gr', costPerUnit: 70 },
      { ingredientId: 'RM-FNB-006', name: 'Minyak Goreng Sawit Chef', qty: 25, unit: 'ml', costPerUnit: 18 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', qty: 1, unit: 'pcs', costPerUnit: 1500 },
    ],
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-002',
    plu: 'FNB-002',
    name: 'Ayam Bakar Madu Pedas Manis',
    itemType: 'MENU_FB',
    category: 'Makanan Utama',
    brand: 'Resto Kitchen',
    sell_price: 38000,
    cost_price: 17148,
    unit: 'Porsi',
    spicyOption: true,
    toppingOption: true,
    costing: {
      rawMaterialCost: 16360,
      operationalCost: 1500,
      targetMarginPercent: 45,
      recommendedPrice: 36600,
      actualPrice: 38000,
      totalCost: 17148,
    },
    stock: 45,
    status: 'Active',
    barcode: '8992001002',
    businessModel: 'fnb',
    wastePercent: 5,
    packagingCost: 1500,
    recipeSummary: 'Ayam Fillet Segar 200gr, Bumbu Rempah Madu 50gr, Minyak 20ml',
    recipe: [
      { ingredientId: 'RM-FNB-003', name: 'Daging Ayam Fillet Segar', qty: 200, unit: 'gr', costPerUnit: 55 },
      { ingredientId: 'RM-FNB-005', name: 'Bumbu Racik Rempah Spesial', qty: 50, unit: 'gr', costPerUnit: 70 },
      { ingredientId: 'RM-FNB-006', name: 'Minyak Goreng Sawit Chef', qty: 20, unit: 'ml', costPerUnit: 18 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', qty: 1, unit: 'pcs', costPerUnit: 1500 },
    ],
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-003',
    plu: 'FNB-003',
    name: 'Mie Goreng Seafood Hokkien',
    itemType: 'MENU_FB',
    category: 'Makanan Utama',
    brand: 'Resto Kitchen',
    sell_price: 42000,
    cost_price: 19800,
    unit: 'Porsi',
    spicyOption: true,
    toppingOption: true,
    costing: {
      rawMaterialCost: 16850,
      operationalCost: 1500,
      targetMarginPercent: 45,
      recommendedPrice: 41800,
      actualPrice: 42000,
      totalCost: 19800,
    },
    stock: 40,
    status: 'Active',
    barcode: '8992001003',
    businessModel: 'fnb',
    wastePercent: 5,
    packagingCost: 1500,
    recipeSummary: 'Mie Hokkien 180gr, Udang & Cumi 90gr, Telur 1pcs, Paper Bowl 1pcs',
    recipe: [
      { ingredientId: 'RM-FNB-007', name: 'Mie Telur Hokkien Segar', qty: 180, unit: 'gr', costPerUnit: 25 },
      { ingredientId: 'RM-FNB-008', name: 'Udang & Cumi Seafood Segar', qty: 90, unit: 'gr', costPerUnit: 90 },
      { ingredientId: 'RM-FNB-004', name: 'Telur Ayam Negeri Pilihan', qty: 1, unit: 'pcs', costPerUnit: 2000 },
      { ingredientId: 'RM-FNB-006', name: 'Minyak Goreng Sawit Chef', qty: 25, unit: 'ml', costPerUnit: 18 },
      { ingredientId: 'RM-FNB-019', name: 'Paper Bowl & Tutup 650ml', qty: 1, unit: 'pcs', costPerUnit: 1800 },
    ],
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-004',
    plu: 'FNB-004',
    name: 'Beef Burger Deluxe Double Cheese',
    itemType: 'MENU_FB',
    category: 'Makanan Utama',
    brand: 'Cafe Kitchen',
    sell_price: 55000,
    cost_price: 28034,
    unit: 'Porsi',
    toppingOption: true,
    costing: {
      rawMaterialCost: 26770,
      operationalCost: 1500,
      targetMarginPercent: 40,
      recommendedPrice: 52500,
      actualPrice: 55000,
      totalCost: 28034,
    },
    stock: 35,
    status: 'Active',
    barcode: '8992001004',
    businessModel: 'fnb',
    wastePercent: 5,
    packagingCost: 1500,
    recipeSummary: 'Beef Patty 120g 1pcs, Brioche Bun 1pcs, Keju Cheddar 2pcs',
    recipe: [
      { ingredientId: 'RM-FNB-009', name: 'Beef Patty Gourmet 120g', qty: 1, unit: 'pcs', costPerUnit: 14000 },
      { ingredientId: 'RM-FNB-010', name: 'Roti Burger & Pastry Butter Dough', qty: 1, unit: 'pcs', costPerUnit: 5000 },
      { ingredientId: 'RM-FNB-011', name: 'Keju Slice Melt Cheddar', qty: 2, unit: 'pcs', costPerUnit: 3000 },
      { ingredientId: 'RM-FNB-006', name: 'Minyak Goreng Sawit Chef', qty: 15, unit: 'ml', costPerUnit: 18 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', qty: 1, unit: 'pcs', costPerUnit: 1500 },
    ],
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-005',
    plu: 'FNB-005',
    name: 'Iced Caramel Macchiato',
    itemType: 'MENU_FB',
    category: 'Kopi',
    brand: 'Barista Corner',
    sell_price: 28000,
    cost_price: 12068,
    unit: 'Cup',
    costing: {
      rawMaterialCost: 9240,
      operationalCost: 1200,
      targetMarginPercent: 45,
      recommendedPrice: 26500,
      actualPrice: 28000,
      totalCost: 12068,
    },
    stock: 80,
    status: 'Active',
    barcode: '8992001005',
    businessModel: 'fnb',
    wastePercent: 5,
    packagingCost: 1200,
    recipeSummary: 'Espresso Blend 18gr, Fresh Milk 180ml, Karamel & Gula Aren 30ml',
    recipe: [
      { ingredientId: 'RM-FNB-012', name: 'Biji Kopi Espresso Blend', qty: 18, unit: 'gr', costPerUnit: 200 },
      { ingredientId: 'RM-FNB-014', name: 'Susu Fresh Milk UHT', qty: 180, unit: 'ml', costPerUnit: 16 },
      { ingredientId: 'RM-FNB-013', name: 'Gula Aren Cair', qty: 30, unit: 'ml', costPerUnit: 52 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', qty: 1, unit: 'pcs', costPerUnit: 1200 },
    ],
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-006',
    plu: 'FNB-006',
    name: 'Signature Brown Sugar Boba Fresh Milk',
    itemType: 'MENU_FB',
    category: 'Non-Kopi / Segar',
    brand: 'Barista Corner',
    sell_price: 25000,
    cost_price: 9800,
    unit: 'Cup',
    costing: {
      rawMaterialCost: 6800,
      operationalCost: 1200,
      targetMarginPercent: 50,
      recommendedPrice: 24000,
      actualPrice: 25000,
      totalCost: 9800,
    },
    stock: 90,
    status: 'Active',
    barcode: '8992001006',
    businessModel: 'fnb',
    wastePercent: 5,
    packagingCost: 1200,
    recipeSummary: 'Fresh Milk UHT 220ml, Brown Sugar Aren 40ml, Paper Cup 16oz',
    recipe: [
      { ingredientId: 'RM-FNB-014', name: 'Susu Fresh Milk UHT', qty: 220, unit: 'ml', costPerUnit: 16 },
      { ingredientId: 'RM-FNB-013', name: 'Gula Aren Cair', qty: 40, unit: 'ml', costPerUnit: 52 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', qty: 1, unit: 'pcs', costPerUnit: 1200 },
    ],
    image: 'https://images.unsplash.com/photo-1558857563-b37fe84234d3?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-007',
    plu: 'FNB-007',
    name: 'Es Matcha Latte Cream Cheese',
    itemType: 'MENU_FB',
    category: 'Non-Kopi / Segar',
    brand: 'Barista Corner',
    sell_price: 30000,
    cost_price: 13065,
    unit: 'Cup',
    costing: {
      rawMaterialCost: 9940,
      operationalCost: 1200,
      targetMarginPercent: 45,
      recommendedPrice: 28300,
      actualPrice: 30000,
      totalCost: 13065,
    },
    stock: 60,
    status: 'Active',
    barcode: '8992001007',
    businessModel: 'fnb',
    wastePercent: 5,
    packagingCost: 1200,
    recipeSummary: 'Bubuk Matcha Jepang 15gr, Fresh Milk 200ml, Gula Cair 20ml',
    recipe: [
      { ingredientId: 'RM-FNB-015', name: 'Bubuk Matcha Jepang & Teh Melati', qty: 15, unit: 'gr', costPerUnit: 300 },
      { ingredientId: 'RM-FNB-014', name: 'Susu Fresh Milk UHT', qty: 200, unit: 'ml', costPerUnit: 16 },
      { ingredientId: 'RM-FNB-013', name: 'Gula Aren Cair', qty: 20, unit: 'ml', costPerUnit: 52 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', qty: 1, unit: 'pcs', costPerUnit: 1200 },
    ],
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-008',
    plu: 'FNB-008',
    name: 'Es Lemon Tea Mint Segar',
    itemType: 'MENU_FB',
    category: 'Non-Kopi / Segar',
    brand: 'Barista Corner',
    sell_price: 18000,
    cost_price: 5200,
    unit: 'Cup',
    costing: {
      rawMaterialCost: 4220,
      operationalCost: 1000,
      targetMarginPercent: 60,
      recommendedPrice: 17500,
      actualPrice: 18000,
      totalCost: 5200,
    },
    stock: 100,
    status: 'Active',
    barcode: '8992001008',
    businessModel: 'fnb',
    wastePercent: 5,
    packagingCost: 1200,
    recipeSummary: 'Daun Teh Melati 4gr, Sirup Gula Lemon 35ml, Paper Cup 16oz',
    recipe: [
      { ingredientId: 'RM-FNB-015', name: 'Bubuk Matcha Jepang & Teh Melati', qty: 4, unit: 'gr', costPerUnit: 300 },
      { ingredientId: 'RM-FNB-013', name: 'Gula Aren Cair', qty: 35, unit: 'ml', costPerUnit: 52 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', qty: 1, unit: 'pcs', costPerUnit: 1200 },
    ],
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-009',
    plu: 'FNB-009',
    name: 'Crispy French Fries Truffle Mayo',
    itemType: 'MENU_FB',
    category: 'Pastry & Bakery',
    brand: 'Cafe Kitchen',
    sell_price: 24000,
    cost_price: 12090,
    unit: 'Porsi',
    costing: {
      rawMaterialCost: 10300,
      operationalCost: 1200,
      targetMarginPercent: 40,
      recommendedPrice: 23500,
      actualPrice: 24000,
      totalCost: 12090,
    },
    stock: 70,
    status: 'Active',
    barcode: '8992001009',
    businessModel: 'fnb',
    wastePercent: 5,
    packagingCost: 1200,
    recipeSummary: 'Kentang Shoestring 160gr, Minyak Truffle & Mayo 10ml, Minyak 50ml',
    recipe: [
      { ingredientId: 'RM-FNB-016', name: 'Kentang Beku Shoestring', qty: 160, unit: 'gr', costPerUnit: 40 },
      { ingredientId: 'RM-FNB-006', name: 'Minyak Goreng Sawit Chef', qty: 50, unit: 'ml', costPerUnit: 18 },
      { ingredientId: 'RM-FNB-017', name: 'Minyak Truffle & Saus Mayo', qty: 10, unit: 'ml', costPerUnit: 150 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', qty: 1, unit: 'pcs', costPerUnit: 1500 },
    ],
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-010',
    plu: 'FNB-010',
    name: 'Dimsum Ayam Udang Kukus (4 pcs)',
    itemType: 'MENU_FB',
    category: 'Pastry & Bakery',
    brand: 'Resto Kitchen',
    sell_price: 26000,
    cost_price: 13000,
    unit: 'Porsi',
    businessModel: 'fnb',
    costing: {
      rawMaterialCost: 11800,
      operationalCost: 1200,
      targetMarginPercent: 40,
      recommendedPrice: 25000,
      actualPrice: 26000,
      totalCost: 13000,
    },
    stock: 55,
    status: 'Active',
    barcode: '8992001010',
    recipeSummary: 'Ayam Fillet 80gr, Udang Segar 50gr, Bumbu Rempah 20gr, Box Eco 1pcs',
    recipe: [
      { ingredientId: 'RM-FNB-003', name: 'Daging Ayam Fillet Segar', qty: 80, unit: 'gr', costPerUnit: 55 },
      { ingredientId: 'RM-FNB-008', name: 'Udang & Cumi Seafood Segar', qty: 50, unit: 'gr', costPerUnit: 90 },
      { ingredientId: 'RM-FNB-005', name: 'Bumbu Racik Rempah Spesial', qty: 20, unit: 'gr', costPerUnit: 70 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', qty: 1, unit: 'pcs', costPerUnit: 1500 },
    ],
    image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-011',
    plu: 'FNB-011',
    name: 'Tahu Cabe Garam Crispy Gurih',
    itemType: 'MENU_FB',
    category: 'Pastry & Bakery',
    brand: 'Resto Kitchen',
    sell_price: 20000,
    cost_price: 8000,
    unit: 'Porsi',
    businessModel: 'fnb',
    spicyOption: true,
    costing: {
      rawMaterialCost: 7200,
      operationalCost: 1000,
      targetMarginPercent: 50,
      recommendedPrice: 19600,
      actualPrice: 20000,
      totalCost: 8000,
    },
    stock: 65,
    status: 'Active',
    barcode: '8992001011',
    recipeSummary: 'Bumbu Cabe Garam 50gr, Minyak Sawit 50ml, Saus Mayo 8ml, Box Eco 1pcs',
    recipe: [
      { ingredientId: 'RM-FNB-005', name: 'Bumbu Racik Rempah Spesial', qty: 50, unit: 'gr', costPerUnit: 70 },
      { ingredientId: 'RM-FNB-006', name: 'Minyak Goreng Sawit Chef', qty: 50, unit: 'ml', costPerUnit: 18 },
      { ingredientId: 'RM-FNB-017', name: 'Minyak Truffle & Saus Mayo', qty: 8, unit: 'ml', costPerUnit: 150 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', qty: 1, unit: 'pcs', costPerUnit: 1500 },
    ],
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-012',
    plu: 'FNB-012',
    name: 'Paket Hemat: Nasi Ayam Bakar + Es Lemon Tea',
    itemType: 'MENU_FB',
    category: 'Paket Hemat',
    brand: 'Resto Kitchen',
    sell_price: 48000,
    cost_price: 24000,
    unit: 'Paket',
    businessModel: 'fnb',
    spicyOption: true,
    costing: {
      rawMaterialCost: 22350,
      operationalCost: 1500,
      targetMarginPercent: 40,
      recommendedPrice: 45800,
      actualPrice: 48000,
      totalCost: 24000,
    },
    stock: 30,
    status: 'Active',
    barcode: '8992001012',
    recipeSummary: 'Beras 150gr, Ayam Fillet 200gr, Bumbu 50gr, Teh Melati 4gr, Gula 30ml',
    recipe: [
      { ingredientId: 'RM-FNB-001', name: 'Beras Putih Pandan Wangi', qty: 150, unit: 'gr', costPerUnit: 15 },
      { ingredientId: 'RM-FNB-003', name: 'Daging Ayam Fillet Segar', qty: 200, unit: 'gr', costPerUnit: 55 },
      { ingredientId: 'RM-FNB-005', name: 'Bumbu Racik Rempah Spesial', qty: 50, unit: 'gr', costPerUnit: 70 },
      { ingredientId: 'RM-FNB-015', name: 'Bubuk Matcha Jepang & Teh Melati', qty: 4, unit: 'gr', costPerUnit: 300 },
      { ingredientId: 'RM-FNB-013', name: 'Gula Aren Cair', qty: 30, unit: 'ml', costPerUnit: 52 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', qty: 1, unit: 'pcs', costPerUnit: 1500 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', qty: 1, unit: 'pcs', costPerUnit: 1200 },
    ],
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-013',
    plu: 'FNB-013',
    name: 'Paket Komplit: Wagyu + Boba Milk + Fries',
    itemType: 'MENU_FB',
    category: 'Paket Hemat',
    brand: 'Resto Kitchen',
    sell_price: 82000,
    cost_price: 42000,
    unit: 'Paket',
    businessModel: 'fnb',
    spicyOption: true,
    costing: {
      rawMaterialCost: 39250,
      operationalCost: 2500,
      targetMarginPercent: 40,
      recommendedPrice: 78300,
      actualPrice: 82000,
      totalCost: 42000,
    },
    stock: 25,
    status: 'Active',
    barcode: '8992001013',
    recipeSummary: 'Beras 150gr, Wagyu 80gr, Kentang 150gr, Fresh Milk 200ml, Gula Aren 35ml',
    recipe: [
      { ingredientId: 'RM-FNB-001', name: 'Beras Putih Pandan Wangi', qty: 150, unit: 'gr', costPerUnit: 15 },
      { ingredientId: 'RM-FNB-002', name: 'Daging Sapi Wagyu Slice', qty: 80, unit: 'gr', costPerUnit: 180 },
      { ingredientId: 'RM-FNB-016', name: 'Kentang Beku Shoestring', qty: 150, unit: 'gr', costPerUnit: 40 },
      { ingredientId: 'RM-FNB-014', name: 'Susu Fresh Milk UHT', qty: 200, unit: 'ml', costPerUnit: 16 },
      { ingredientId: 'RM-FNB-013', name: 'Gula Aren Cair', qty: 35, unit: 'ml', costPerUnit: 52 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', qty: 1, unit: 'pcs', costPerUnit: 1500 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', qty: 1, unit: 'pcs', costPerUnit: 1200 },
    ],
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=80',
  },
];

// 3. KASIR 04 (Pharmacy & Healthcare)
export const PHARMACY_HEALTHCARE_PRODUCTS: Product[] = [
  {
    id: 'MED-PCT-500',
    plu: 'PCT-500-STP',
    barcode: '899100400001',
    name: 'Paracetamol 500mg (Strip 10 Kaplet)',
    category: 'Obat Bebas (OTC)',
    brand: 'Kimia Farma',
    sell_price: 6500,
    cost_price: 4000,
    price_retail: 6500,
    price_member: 6000,
    price_wholesale: 5000,
    stock: 200,
    unit: 'Strip',
    packagingUnit: 'Strip',
    drugClass: 'Obat Bebas',
    pharmacyClass: 'OBAT_BEBAS',
    signa: '3 x 1 Tablet sesudah makan bila demam/nyeri',
    status: 'Active',
    businessModel: 'pharmacy',
    itemType: 'RETAIL',
    description: 'Meredakan rasa sakit kepala, sakit gigi, dan menurunkan demam.',
  },
  {
    id: 'MED-VITC-BOT',
    plu: 'VITC-500-BOT',
    barcode: '899100400002',
    name: 'Vitamin C 500mg IPI (Botol 45 Tablet)',
    category: 'Vitamin & Suplemen',
    brand: 'IPI Vitamins',
    sell_price: 14500,
    cost_price: 9200,
    price_retail: 14500,
    price_member: 13500,
    price_wholesale: 11500,
    stock: 120,
    unit: 'Botol',
    packagingUnit: 'Botol',
    drugClass: 'Suplemen Kesehatan',
    pharmacyClass: 'OBAT_BEBAS',
    signa: '1 x 1 Tablet hisap per hari',
    status: 'Active',
    businessModel: 'pharmacy',
    itemType: 'RETAIL',
    description: 'Suplemen daya tahan tubuh harian untuk menjaga kekebalan keluarga.',
  },
  {
    id: 'MED-MSK-3PLY',
    plu: 'MSK-3PLY-BOX',
    barcode: '899100400003',
    name: 'Masker Medis Bedah 3-Ply Earloop (Box 50 Pcs)',
    category: 'Alat Kesehatan',
    brand: 'Sensi Mask',
    sell_price: 35000,
    cost_price: 22000,
    price_retail: 35000,
    price_member: 32000,
    price_wholesale: 28000,
    stock: 90,
    unit: 'Box',
    packagingUnit: 'Box',
    drugClass: 'Alkes Medis Non-Obat',
    pharmacyClass: 'OBAT_BEBAS',
    status: 'Active',
    businessModel: 'pharmacy',
    itemType: 'RETAIL',
    description: 'Masker bedah filtrasi BFE 99% nyaman dipakai dengan karet earloop lembut.',
  },
  {
    id: 'MED-MKP-60ML',
    plu: 'MKP-60ML-LNG',
    barcode: '899100400004',
    name: 'Minyak Kayu Putih Cap Lang 60ml',
    category: 'Minyak Gosok & Herbal',
    brand: 'Cap Lang',
    sell_price: 26500,
    cost_price: 19000,
    price_retail: 26500,
    price_member: 24500,
    price_wholesale: 22000,
    stock: 140,
    unit: 'Botol',
    packagingUnit: 'Botol',
    drugClass: 'Herbal & Obat Luar',
    pharmacyClass: 'OBAT_BEBAS',
    signa: 'Oleskan secukupnya pada bagian yang memerlukan',
    status: 'Active',
    businessModel: 'pharmacy',
    itemType: 'RETAIL',
    description: 'Membantu meredakan perut kembung, mual, masuk angin, dan gatal gigitan serangga.',
  },
  {
    id: 'MED-ANT-SUSP',
    plu: 'ANT-SUSP-BOT',
    barcode: '899100400005',
    name: 'Antasida Doen Suspensi Sirup Maag 60ml',
    category: 'Obat Saluran Cerna',
    brand: 'Dexa Medica',
    sell_price: 11000,
    cost_price: 7000,
    price_retail: 11000,
    price_member: 10000,
    price_wholesale: 8500,
    stock: 100,
    unit: 'Botol',
    packagingUnit: 'Botol',
    drugClass: 'Obat Bebas Terbatas (Resep/Bebas)',
    pharmacyClass: 'OBAT_BEBAS_TERBATAS',
    signa: '3 x 1 Sendok takar (5ml) 1 jam sebelum makan',
    status: 'Active',
    businessModel: 'pharmacy',
    itemType: 'RETAIL',
    description: 'Suspensi cair penetral asam lambung untuk mengatasi gejala tukak lambung dan maag.',
  },
  {
    id: 'PET-CAT-WHK1KG',
    plu: 'CAT-WHK-1KG',
    barcode: '899300400001',
    name: 'Whiskas Dry Cat Food Ocean Fish 1.2kg',
    category: 'Pakan & Kebutuhan Hewan',
    brand: 'Whiskas',
    sell_price: 68000,
    cost_price: 48000,
    price_retail: 68000,
    price_member: 62000,
    price_wholesale: 55000,
    stock: 75,
    unit: 'Zak 1.2kg',
    status: 'Active',
    businessModel: 'pharmacy',
    itemType: 'RETAIL',
    description: 'Pakan kering nutrisi lengkap untuk kucing dewasa dengan rasa ikan laut segar.',
  },
  {
    id: 'PET-DOG-PDG1KG',
    plu: 'DOG-PDG-1KG',
    barcode: '899300400002',
    name: 'Pedigree Adult Beef & Vegetable 1.5kg',
    category: 'Pakan & Kebutuhan Hewan',
    brand: 'Pedigree',
    sell_price: 76000,
    cost_price: 54000,
    price_retail: 76000,
    price_member: 70000,
    price_wholesale: 62000,
    stock: 50,
    unit: 'Zak 1.5kg',
    status: 'Active',
    businessModel: 'pharmacy',
    itemType: 'RETAIL',
    description: 'Makanan anjing dewasa kaya protein daging sapi, serat sayuran, dan omega 6.',
  },
  {
    id: 'PET-VIT-GEL',
    plu: 'VIT-PET-GEL',
    barcode: '899300400003',
    name: 'Nutri-Plus Gel Suplemen Energi & Bulu Hewan 120g',
    category: 'Vitamin Hewan',
    brand: 'Virbac',
    sell_price: 135000,
    cost_price: 95000,
    price_retail: 135000,
    price_member: 125000,
    price_wholesale: 110000,
    stock: 45,
    unit: 'Tube 120g',
    status: 'Active',
    businessModel: 'pharmacy',
    itemType: 'RETAIL',
    description: 'Suplemen multivitamin gel penambah nafsu makan dan kilau bulu anjing & kucing.',
  },
  {
    id: 'PET-OBT-DETICK',
    plu: 'OBT-PET-TETES',
    barcode: '899300400004',
    name: 'Detick Obat Kutu Tetes Kucing & Anjing (1-10kg)',
    category: 'Obat Hewan',
    brand: 'Detick Albeve',
    sell_price: 28000,
    cost_price: 15000,
    price_retail: 28000,
    price_member: 25000,
    price_wholesale: 20000,
    stock: 120,
    unit: 'Botol 1ml',
    drugClass: 'Obat Bebas Hewan',
    signa: 'Teteskan 1 botol pada tengkuk kulit leher hewan',
    status: 'Active',
    businessModel: 'pharmacy',
    itemType: 'RETAIL',
    description: 'Obat tetes pembasmi kutu dan caplak pada kucing dan anjing ampuh.',
  },
  {
    id: 'PET-SHP-FLEA',
    plu: 'SHP-PET-FLEA',
    barcode: '899300400005',
    name: 'Shampoo Hewan Anti Kutu & Jamur 250ml',
    category: 'Pet Care & Perawatan Hewan',
    brand: 'Bioline',
    sell_price: 42000,
    cost_price: 24000,
    price_retail: 42000,
    price_member: 38000,
    price_wholesale: 32000,
    stock: 60,
    unit: 'Botol 250ml',
    status: 'Active',
    businessModel: 'pharmacy',
    itemType: 'RETAIL',
    description: 'Sampo mandi hewan formula lembut dengan ekstrak tea tree oil anti parasit & jamur.',
  },
];

// 4. KASIR 05 (Fashion & Apparel / Butik)
export const FASHION_STANDARD_SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;
export const FASHION_STANDARD_COLORS = ['Sage', 'Maroon', 'Hitam', 'Cream'] as const;

export const FASHION_CATEGORY_SEEDS = [
  { id: 'CAT-FASH-01', code: 'FASH-GMS', name: 'Gamis & Dress', department: 'Butik Muslimah' },
  { id: 'CAT-FASH-02', code: 'FASH-KML', name: 'Kemeja & Atasan', department: 'Apparel Pria & Wanita' },
  { id: 'CAT-FASH-03', code: 'FASH-HJB', name: 'Hijab & Scarf', department: 'Aksesori Muslimah' },
  { id: 'CAT-FASH-04', code: 'FASH-KLT', name: 'Celana & Kulot', department: 'Bawahan & Tailoring' },
  { id: 'CAT-FASH-05', code: 'FASH-OUT', name: 'Jaket & Outerwear', department: 'Outerwear & Koleksi' },
];

export function buildFashionVariantMatrix(
  sizes: readonly string[] = FASHION_STANDARD_SIZES,
  colors: readonly string[] = FASHION_STANDARD_COLORS,
  skuPrefix: string = 'FASH',
  stockPattern: number[] = [4, 6, 5, 4, 3]
): FashionVariantCell[] {
  const cells: FashionVariantCell[] = [];
  sizes.forEach((size, sIdx) => {
    colors.forEach((color, cIdx) => {
      const baseQty = stockPattern[(sIdx + cIdx) % stockPattern.length] ?? 4;
      const cleanSize = size.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const cleanColor = color.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
      cells.push({
        size,
        color,
        stock: baseQty,
        skuVariant: `${skuPrefix}-${cleanSize}-${cleanColor}`,
      });
    });
  });
  return cells;
}

export function sumVariantMatrixStock(matrix?: FashionVariantCell[] | null): number {
  if (!Array.isArray(matrix) || matrix.length === 0) return 0;
  return matrix.reduce((acc, cell) => acc + Math.max(0, Number(cell.stock) || 0), 0);
}

const GAMIS_HUMAIRA_MATRIX = buildFashionVariantMatrix(
  FASHION_STANDARD_SIZES,
  FASHION_STANDARD_COLORS,
  'GMS-HUM',
  [5, 8, 7, 4, 3]
);
const KEMEJA_LINEN_MATRIX = buildFashionVariantMatrix(
  FASHION_STANDARD_SIZES,
  FASHION_STANDARD_COLORS,
  'KML-PRI',
  [4, 7, 8, 5, 3]
);
const HIJAB_VOAL_MATRIX = buildFashionVariantMatrix(
  FASHION_STANDARD_SIZES,
  FASHION_STANDARD_COLORS,
  'HJB-VOAL',
  [8, 12, 10, 8, 6]
);
const KULOT_HIGHWAIST_MATRIX = buildFashionVariantMatrix(
  FASHION_STANDARD_SIZES,
  FASHION_STANDARD_COLORS,
  'KLT-HW',
  [5, 7, 6, 4, 2]
);
const KAOS_COMBED_MATRIX = buildFashionVariantMatrix(
  FASHION_STANDARD_SIZES,
  FASHION_STANDARD_COLORS,
  'TSH-C30',
  [7, 9, 10, 8, 5]
);
const KEMEJA_OXFORD_MATRIX = buildFashionVariantMatrix(
  FASHION_STANDARD_SIZES,
  FASHION_STANDARD_COLORS,
  'KEM-OXF',
  [3, 5, 6, 4, 2]
);
const DENIM_JACKET_MATRIX = buildFashionVariantMatrix(
  FASHION_STANDARD_SIZES,
  FASHION_STANDARD_COLORS,
  'DNM-JKT',
  [2, 3, 4, 3, 2]
);

export const FASHION_APPAREL_PRODUCTS: Product[] = [
  {
    id: 'FASH-GMS-HUM',
    plu: 'GMS-SILK-HUM',
    sku: 'FASH-GMS-HUM',
    barcode: '899500100101',
    name: 'Gamis Silk Humaira',
    category: 'Gamis & Dress',
    brand: 'Humaira Atelier',
    sell_price: 289000,
    cost_price: 165000,
    price_retail: 289000,
    price_member: 265000,
    price_wholesale: 235000,
    stock: sumVariantMatrixStock(GAMIS_HUMAIRA_MATRIX),
    minStock: 15,
    min_stock: 15,
    unit: 'Pcs',
    variantSize: 'S, M, L, XL, XXL',
    variantColor: 'Sage, Maroon, Hitam, Cream',
    variantMatrix: GAMIS_HUMAIRA_MATRIX,
    sizeUpcharges: { S: 0, M: 0, L: 0, XL: 10000, XXL: 15000 },
    fashionPromo: {
      clearanceActive: true,
      clearanceType: 'PERCENT',
      clearanceValue: 15,
      clearanceLabel: 'Clearance Sale Koleksi Silk 15%',
      bundleActive: false,
      bundleMinQty: 2,
      bundleDiscountType: 'NOMINAL',
      bundleDiscountValue: 30000,
      bundleScope: 'MIX_MATCH_FASHION',
      bundleLabel: 'Beli 2 Koleksi Hemat Rp 30rb',
    },
    status: 'Active',
    businessModel: 'fashion',
    itemType: 'RETAIL',
    description: 'Gamis Silk premium berpotongan A-line flowy, ramah wudhu & busui friendly.',
  },
  {
    id: 'FASH-KML-PR',
    plu: 'KML-LINEN-PR',
    sku: 'FASH-KML-PR',
    barcode: '899500100102',
    name: 'Kemeja Linen Pria',
    category: 'Kemeja & Atasan',
    brand: 'Nusa Linen Studio',
    sell_price: 195000,
    cost_price: 110000,
    price_retail: 195000,
    price_member: 179000,
    price_wholesale: 155000,
    stock: sumVariantMatrixStock(KEMEJA_LINEN_MATRIX),
    minStock: 15,
    min_stock: 15,
    unit: 'Pcs',
    variantSize: 'S, M, L, XL, XXL',
    variantColor: 'Sage, Maroon, Hitam, Cream',
    variantMatrix: KEMEJA_LINEN_MATRIX,
    sizeUpcharges: { S: 0, M: 0, L: 0, XL: 10000, XXL: 15000 },
    fashionPromo: {
      clearanceActive: false,
      clearanceType: 'PERCENT',
      clearanceValue: 10,
      clearanceLabel: 'Clearance Linen 10%',
      bundleActive: true,
      bundleMinQty: 2,
      bundleDiscountType: 'NOMINAL',
      bundleDiscountValue: 20000,
      bundleScope: 'MIX_MATCH_FASHION',
      bundleLabel: 'Beli 2 Lebih Hemat Rp 20rb/pcs',
    },
    status: 'Active',
    businessModel: 'fashion',
    itemType: 'RETAIL',
    description: 'Kemeja Linen Rami adem breathable cutting relaxed-fit dengan kerah mandarin/classic.',
  },
  {
    id: 'FASH-HJB-VOAL',
    plu: 'HJB-VOAL-PRM',
    sku: 'FASH-HJB-VOAL',
    barcode: '899500100103',
    name: 'Hijab Voal Premium',
    category: 'Hijab & Scarf',
    brand: 'Humaira Atelier',
    sell_price: 75000,
    cost_price: 38000,
    price_retail: 75000,
    price_member: 68000,
    price_wholesale: 58000,
    stock: sumVariantMatrixStock(HIJAB_VOAL_MATRIX),
    minStock: 25,
    min_stock: 25,
    unit: 'Pcs',
    variantSize: 'S, M, L, XL, XXL',
    variantColor: 'Sage, Maroon, Hitam, Cream',
    variantMatrix: HIJAB_VOAL_MATRIX,
    sizeUpcharges: { S: 0, M: 0, L: 0, XL: 10000, XXL: 15000 },
    fashionPromo: {
      clearanceActive: false,
      clearanceType: 'NOMINAL',
      clearanceValue: 10000,
      clearanceLabel: 'Clearance Hijab Rp 10rb',
      bundleActive: true,
      bundleMinQty: 2,
      bundleDiscountType: 'NOMINAL',
      bundleDiscountValue: 10000,
      bundleScope: 'MIX_MATCH_FASHION',
      bundleLabel: 'Mix & Match Hijab Hemat Rp 10rb/pcs',
    },
    status: 'Active',
    businessModel: 'fashion',
    itemType: 'RETAIL',
    description: 'Hijab Voal Ultrafine lasercut tegak di dahi, lembut tidak mudah kusut.',
  },
  {
    id: 'FASH-KLT-HW',
    plu: 'KLT-HIGH-CRK',
    sku: 'FASH-KLT-HW',
    barcode: '899500100104',
    name: 'Kulot Highwaist',
    category: 'Celana & Kulot',
    brand: 'Studio Linea',
    sell_price: 159000,
    cost_price: 88000,
    price_retail: 159000,
    price_member: 145000,
    price_wholesale: 125000,
    stock: sumVariantMatrixStock(KULOT_HIGHWAIST_MATRIX),
    minStock: 15,
    min_stock: 15,
    unit: 'Pcs',
    variantSize: 'S, M, L, XL, XXL',
    variantColor: 'Sage, Maroon, Hitam, Cream',
    variantMatrix: KULOT_HIGHWAIST_MATRIX,
    sizeUpcharges: { S: 0, M: 0, L: 0, XL: 10000, XXL: 15000 },
    fashionPromo: {
      clearanceActive: false,
      clearanceType: 'PERCENT',
      clearanceValue: 10,
      clearanceLabel: 'Clearance Kulot 10%',
      bundleActive: true,
      bundleMinQty: 2,
      bundleDiscountType: 'PERCENT',
      bundleDiscountValue: 10,
      bundleScope: 'MIX_MATCH_FASHION',
      bundleLabel: 'Potongan Paket Koleksi 10% (Min. 2)',
    },
    status: 'Active',
    businessModel: 'fashion',
    itemType: 'RETAIL',
    description: 'Celana kulot highwaist bahan crinkle airflow jatuh, pinggang elastis & saku samping.',
  },
  {
    id: 'FASH-TSHIRT-C30',
    plu: 'TSHIRT-C30S',
    sku: 'FASH-TSHIRT-C30',
    barcode: '899500100001',
    name: 'Kaos Polos Cotton Combed 30s',
    category: 'Kemeja & Atasan',
    brand: 'JacS Apparel',
    sell_price: 55000,
    cost_price: 32000,
    price_retail: 55000,
    price_member: 50000,
    price_wholesale: 42000,
    stock: sumVariantMatrixStock(KAOS_COMBED_MATRIX),
    minStock: 20,
    min_stock: 20,
    unit: 'Pcs',
    variantSize: 'S, M, L, XL, XXL',
    variantColor: 'Sage, Maroon, Hitam, Cream',
    variantMatrix: KAOS_COMBED_MATRIX,
    sizeUpcharges: { S: 0, M: 0, L: 0, XL: 10000, XXL: 15000 },
    fashionPromo: {
      clearanceActive: false,
      clearanceType: 'PERCENT',
      clearanceValue: 10,
      clearanceLabel: 'Clearance Kaos 10%',
      bundleActive: true,
      bundleMinQty: 3,
      bundleDiscountType: 'NOMINAL',
      bundleDiscountValue: 8000,
      bundleScope: 'SAME_SKU',
      bundleLabel: 'Beli 3 Hemat Rp 8rb/pcs',
    },
    status: 'Active',
    businessModel: 'fashion',
    itemType: 'RETAIL',
    description: 'Bahan 100% Cotton Combed 30s reaktif, adem, jahitan rantai rapi berstandar distro.',
  },
  {
    id: 'FASH-KEM-OXF',
    plu: 'KEM-OXF-SLIM',
    sku: 'FASH-KEM-OXF',
    barcode: '899500100002',
    name: 'Kemeja Oxford Slim Fit Lengan Panjang',
    category: 'Kemeja & Atasan',
    brand: 'JacS Tailor',
    sell_price: 165000,
    cost_price: 95000,
    price_retail: 165000,
    price_member: 150000,
    price_wholesale: 130000,
    stock: sumVariantMatrixStock(KEMEJA_OXFORD_MATRIX),
    minStock: 12,
    min_stock: 12,
    unit: 'Pcs',
    variantSize: 'S, M, L, XL, XXL',
    variantColor: 'Sage, Maroon, Hitam, Cream',
    variantMatrix: KEMEJA_OXFORD_MATRIX,
    sizeUpcharges: { S: 0, M: 0, L: 0, XL: 10000, XXL: 15000 },
    status: 'Active',
    businessModel: 'fashion',
    itemType: 'RETAIL',
    description: 'Kemeja kerja kasual bahan Oxford tebal nyaman dengan kerah button-down berkelas.',
  },
  {
    id: 'FASH-DNM-JKT',
    plu: 'DNM-JKT-14OZ',
    sku: 'FASH-DNM-JKT',
    barcode: '899500100004',
    name: 'Denim Jacket Casual Vintage Wash 14oz',
    category: 'Jaket & Outerwear',
    brand: 'JacS Denim & Co',
    sell_price: 280000,
    cost_price: 165000,
    price_retail: 280000,
    price_member: 255000,
    price_wholesale: 220000,
    stock: sumVariantMatrixStock(DENIM_JACKET_MATRIX),
    minStock: 10,
    min_stock: 10,
    unit: 'Pcs',
    variantSize: 'S, M, L, XL, XXL',
    variantColor: 'Sage, Maroon, Hitam, Cream',
    variantMatrix: DENIM_JACKET_MATRIX,
    sizeUpcharges: { S: 0, M: 0, L: 0, XL: 12000, XXL: 20000 },
    fashionPromo: {
      clearanceActive: true,
      clearanceType: 'NOMINAL',
      clearanceValue: 35000,
      clearanceLabel: 'Clearance Outerwear -Rp 35rb',
      bundleActive: false,
      bundleMinQty: 2,
      bundleDiscountType: 'PERCENT',
      bundleDiscountValue: 10,
      bundleScope: 'MIX_MATCH_FASHION',
    },
    status: 'Active',
    businessModel: 'fashion',
    itemType: 'RETAIL',
    description: 'Jaket jeans tebal 14oz non-stretch dengan efek washing vintage klasik dan kancing tembaga.',
  },
];

// 5. KASIR 07 (Electronics & Gadgets)
export const ELECTRONICS_GADGETS_PRODUCTS: Product[] = [
  {
    id: 'GAD-KBL-CC60',
    plu: 'KBL-CC-60W',
    barcode: '899700100001',
    name: 'Kabel Fast Charging Type-C to Type-C 60W (1m Braided)',
    category: 'Kabel & Aksesori',
    brand: 'Aukey / Anker',
    sell_price: 45000,
    cost_price: 22000,
    price_retail: 45000,
    price_member: 40000,
    price_wholesale: 32000,
    stock: 120,
    unit: 'Pcs',
    warrantyPeriod: '6 Bulan Garansi Resmi Toko',
    warrantyMonths: 6,
    status: 'Active',
    businessModel: 'electronics',
    itemType: 'RETAIL',
    description: 'Kabel data nilon kepang anti-kusut mendukung pengisian cepat PD 60W dan transfer data 480Mbps.',
  },
  {
    id: 'GAD-TWS-BT53',
    plu: 'TWS-BT-5.3',
    barcode: '899700100002',
    name: 'TWS Bluetooth Earbuds ANC Low-Latency',
    category: 'Audio & Earphone',
    brand: 'Baseus TrueSound',
    sell_price: 249000,
    cost_price: 150000,
    price_retail: 249000,
    price_member: 225000,
    price_wholesale: 195000,
    stock: 45,
    unit: 'Unit',
    warrantyPeriod: '12 Bulan Garansi Toko Resmi',
    warrantyMonths: 12,
    status: 'Active',
    businessModel: 'electronics',
    itemType: 'RETAIL',
    description: 'Earbuds nirkabel Bluetooth 5.3 dengan fitur peredam bising aktif (ANC) dan bass bertenaga.',
  },
  {
    id: 'GAD-PWB-10K',
    plu: 'PWB-10K-PD',
    barcode: '899700100003',
    name: 'Powerbank 10.000mAh PD 22.5W Fast Charge',
    category: 'Powerbank & Baterai',
    brand: 'RoboPower PD',
    sell_price: 189000,
    cost_price: 115000,
    price_retail: 189000,
    price_member: 175000,
    price_wholesale: 148000,
    stock: 50,
    unit: 'Unit',
    warrantyPeriod: '12 Bulan Garansi Toko Resmi',
    warrantyMonths: 12,
    status: 'Active',
    businessModel: 'electronics',
    itemType: 'RETAIL',
    description: 'Powerbank ramping berkapasitas 10.000mAh dengan layar LED indikator baterai akurat.',
  },
  {
    id: 'GAD-CHG-30W',
    plu: 'CHG-GAN-30W',
    barcode: '899700100004',
    name: 'Fast Wall Charger GaN 30W USB-C PD/QC4.0',
    category: 'Kepala Charger & Adapter',
    brand: 'Ugreen GaN Fast',
    sell_price: 125000,
    cost_price: 72000,
    price_retail: 125000,
    price_member: 115000,
    price_wholesale: 95000,
    stock: 70,
    unit: 'Pcs',
    warrantyPeriod: '12 Bulan Garansi Toko Resmi',
    warrantyMonths: 12,
    status: 'Active',
    businessModel: 'electronics',
    itemType: 'RETAIL',
    description: 'Adaptor charger ringkas teknologi Gallium Nitride (GaN) aman dan dingin saat mengecas cepat.',
  },
  {
    id: 'GAD-HLD-ALU',
    plu: 'HLD-ALU-DESK',
    barcode: '899700100005',
    name: 'Stand Holder Handphone & Tablet Aluminium Foldable',
    category: 'Holder & Stand',
    brand: 'Orico Metal Desk',
    sell_price: 69000,
    cost_price: 38000,
    price_retail: 69000,
    price_member: 62000,
    price_wholesale: 50000,
    stock: 85,
    unit: 'Pcs',
    warrantyPeriod: '1 Bulan Garansi Fisik Toko',
    warrantyMonths: 1,
    status: 'Active',
    businessModel: 'electronics',
    itemType: 'RETAIL',
    description: 'Dudukan smartphone & tablet full aluminium kokoh bisa dilipat dengan alas karet anti-slip.',
  },
];

// 6. KASIR 08 (Automotive & Workshop)
export const AUTOMOTIVE_WORKSHOP_PRODUCTS: Product[] = [
  {
    id: 'OTO-OIL-10W40',
    plu: 'OIL-10W40-1L',
    barcode: '899800100001',
    name: 'Oli Mesin Sintetik 10W-40 1L',
    category: 'Oli & Pelumas Mesin',
    brand: 'Shell Helix HX7',
    sell_price: 115000,
    cost_price: 78000,
    price_retail: 115000,
    price_member: 105000,
    price_wholesale: 92000,
    stock: 90,
    unit: 'Botol 1L',
    description: 'Kategori Sparepart / Suku Cadang Fisik',
    status: 'Active',
    businessModel: 'workshop',
    itemType: 'RETAIL',
  },
  {
    id: 'OTO-BRK-DAP',
    plu: 'BRK-DAP-NONASB',
    barcode: '899800100002',
    name: 'Kampas Rem Cakram Depan (Brake Pad Set)',
    category: 'Pengereman & Suku Cadang',
    brand: 'Bendix General CT',
    sell_price: 85000,
    cost_price: 52000,
    price_retail: 85000,
    price_member: 78000,
    price_wholesale: 65000,
    stock: 40,
    unit: 'Set',
    description: 'Kategori Sparepart / Suku Cadang Fisik',
    status: 'Active',
    businessModel: 'workshop',
    itemType: 'RETAIL',
  },
  {
    id: 'OTO-SPK-IRID',
    plu: 'SPK-IRID-STD',
    barcode: '899800100003',
    name: 'Busi Iridium Standard Power Long-Life',
    category: 'Pengapian & Kelistrikan',
    brand: 'NGK Iridium IX',
    sell_price: 45000,
    cost_price: 25000,
    price_retail: 45000,
    price_member: 40000,
    price_wholesale: 33000,
    stock: 110,
    unit: 'Pcs',
    description: 'Kategori Sparepart / Suku Cadang Fisik',
    status: 'Active',
    businessModel: 'workshop',
    itemType: 'RETAIL',
  },
  {
    id: 'OTO-FLT-OIL',
    plu: 'FLT-OIL-SPIN',
    barcode: '899800100004',
    name: 'Filter Oli Mesin Spin-On High-Flow',
    category: 'Filter & Penyaring Suku Cadang',
    brand: 'Denso Original',
    sell_price: 38000,
    cost_price: 20000,
    price_retail: 38000,
    price_member: 35000,
    price_wholesale: 28000,
    stock: 75,
    unit: 'Pcs',
    description: 'Kategori Sparepart / Suku Cadang Fisik',
    status: 'Active',
    businessModel: 'workshop',
    itemType: 'RETAIL',
  },
  {
    id: 'OTO-CLN-CRB',
    plu: 'CLN-CRB-500ML',
    barcode: '899800100005',
    name: 'Cairan Pembersih Karburator & Injector Spray 500ml',
    category: 'Chemical & Perawatan Otomotif',
    brand: 'Zone Carb Cleaner',
    sell_price: 42000,
    cost_price: 24000,
    price_retail: 42000,
    price_member: 38000,
    price_wholesale: 32000,
    stock: 60,
    unit: 'Kaleng 500ml',
    description: 'Kategori Sparepart & Kimia Perawatan',
    status: 'Active',
    businessModel: 'workshop',
    itemType: 'RETAIL',
  },
  {
    id: 'OTO-SRV-TUNE',
    plu: 'SRV-TUNE-01',
    barcode: 'SRV-TUNEUP-01',
    name: 'Paket Jasa Servis Ringan & Ganti Oli',
    category: 'Paket Jasa Servis',
    brand: 'JacS Bengkel Servis',
    sell_price: 60000,
    cost_price: 0,
    price_retail: 60000,
    price_member: 50000,
    price_wholesale: 45000,
    stock: 999,
    unit: 'Layanan',
    serviceDuration: '30 Menit',
    description: 'Paket Jasa Servis Mekanik Profesional',
    status: 'Active',
    businessModel: 'workshop',
    itemType: 'SERVICE',
  },
];

// 7. KASIR 09 (Building & Hardware Depot)
export const BUILDING_HARDWARE_PRODUCTS: Product[] = [
  {
    id: 'MAT-SMN-50KG',
    plu: 'SMN-50KG-PCC',
    barcode: '899900100001',
    name: 'Semen Portland 50kg SNI',
    category: 'PASIR_BATU_SEMEN',
    brand: 'Semen Tonasa / Gresik',
    supplier: 'PT Semen Tonasa / Tiga Roda',
    supplierId: 'SUP-BLD-01',
    sell_price: 68000,
    cost_price: 56000,
    price_retail: 68000,
    price_member: 65000,
    price_wholesale: 61000,
    tier2Price: 65000,
    tier2MinQty: 10,
    tier3Price: 61000,
    tier3MinQty: 40,
    stock: 250,
    minStock: 100,
    min_stock: 100,
    unit: 'Zak',
    materialNature: 'MANUFACTURED',
    deliveryPricingPolicy: 'INCLUDE_ONGKIR',
    defaultLoadingFee: 1000,
    supportDecimal: false,
    status: 'Active',
    businessModel: 'building',
    itemType: 'RETAIL',
    description: 'Semen Portland PCC berkualitas tinggi untuk plesteran, acian, dan cor beton kokoh.',
  },
  {
    id: 'MAT-PSR-1M3',
    plu: 'PSR-PSG-1M3',
    barcode: '899900100006',
    name: 'Pasir Pasang Curah (Quarry Merapi)',
    category: 'PASIR_BATU_SEMEN',
    brand: 'Merapi Quarry',
    supplier: 'CV Quarry Merapi & Alam',
    supplierId: 'SUP-BLD-02',
    sell_price: 280000,
    cost_price: 220000,
    price_retail: 280000,
    price_member: 265000,
    price_wholesale: 245000,
    tier2Price: 265000,
    tier2MinQty: 3,
    tier3Price: 245000,
    tier3MinQty: 6,
    stock: 100,
    minStock: 35,
    min_stock: 35,
    unit: 'm³',
    materialNature: 'BULK_CURAH',
    bulkUnitType: 'KUBIK_M3',
    deliveryPricingPolicy: 'INCLUDE_ONGKIR',
    defaultLoadingFee: 25000,
    bulkFleetTiers: [
      { id: 'PICKUP_RET', name: 'Ret Pick-up (±1.2 m³)', volumeM3: 1.2, suffix: '-PKP', price: 340000, costPrice: 264000, isActive: true },
      { id: 'TRUCK_ENGKEL', name: 'Ret Truk Engkel (±3.0 m³)', volumeM3: 3.0, suffix: '-ENG', price: 820000, costPrice: 660000, isActive: true },
      { id: 'DUMP_TRUCK', name: 'Ret Dump Truck Besar (±6.5 m³)', volumeM3: 6.5, suffix: '-TRK', price: 1680000, costPrice: 1380000, isActive: true },
      { id: 'SAK_KARUNG', name: 'Eceran Karung / Sak (±0.03 m³)', volumeM3: 0.03, suffix: '-SAK', price: 18000, costPrice: 12000, isActive: true },
    ],
    supportDecimal: true,
    status: 'Active',
    businessModel: 'building',
    itemType: 'RETAIL',
    description: 'Pasir pasang halus curah m³/ret berkualitas untuk adukan beton dan pondasi.',
  },
  {
    id: 'MAT-BSI-10MM',
    plu: 'BSI-POL-10MM',
    barcode: '899900100007',
    name: 'Besi Beton Polos 10mm SNI (12m)',
    category: 'BESI_BAJA',
    brand: 'KS Krakatau Steel',
    supplier: 'PT Krakatau Steel / Distributor Besi',
    supplierId: 'SUP-BLD-03',
    sell_price: 85000,
    cost_price: 72000,
    price_retail: 85000,
    price_member: 81000,
    price_wholesale: 77000,
    tier2Price: 81000,
    tier2MinQty: 15,
    tier3Price: 77000,
    tier3MinQty: 50,
    stock: 150,
    minStock: 60,
    min_stock: 60,
    unit: 'Batang',
    unitSecondary: 'Lonjor',
    materialNature: 'MANUFACTURED',
    deliveryPricingPolicy: 'INCLUDE_ONGKIR',
    defaultLoadingFee: 1500,
    status: 'Active',
    businessModel: 'building',
    itemType: 'RETAIL',
    description: 'Besi beton polos SNI diameter 10mm panjang 12 meter standar konstruksi tahan gempa.',
  },
  {
    id: 'MAT-PIP-PVC4',
    plu: 'PIP-PVC-4AW',
    barcode: '899900100008',
    name: 'Pipa PVC AW 4 Inch Saluran Air',
    category: 'PERPIPAAN',
    brand: 'Wavin / Rucika',
    supplier: 'PT Dulux / Jotun Paint Indonesia',
    supplierId: 'SUP-BLD-04',
    sell_price: 145000,
    cost_price: 110000,
    price_retail: 145000,
    price_member: 138000,
    price_wholesale: 128000,
    tier2Price: 138000,
    tier2MinQty: 10,
    tier3Price: 128000,
    tier3MinQty: 30,
    stock: 80,
    minStock: 40,
    min_stock: 40,
    unit: 'Batang (4m)',
    unitSecondary: 'Meter',
    priceSecondary: 39000,
    conversionRate: 4,
    materialNature: 'MANUFACTURED',
    deliveryPricingPolicy: 'EXCLUDE_ONGKIR',
    status: 'Active',
    businessModel: 'building',
    itemType: 'RETAIL',
    description: 'Pipa PVC tipe AW tebal ukuran 4 inch untuk saluran air bersih dan pembuangan.',
  },
  {
    id: 'MAT-PKU-3INC',
    plu: 'PKU-BAJA-3IN',
    barcode: '899900100003',
    name: 'Paku Baja 3 Inch (Kg)',
    category: 'PAKU_KAWAT_BAUT',
    brand: 'Baja SNI',
    supplier: 'PT Krakatau Steel / Distributor Besi',
    supplierId: 'SUP-BLD-03',
    sell_price: 22000,
    cost_price: 14000,
    price_retail: 22000,
    price_member: 20000,
    price_wholesale: 17500,
    tier2Price: 20000,
    tier2MinQty: 10,
    tier3Price: 17500,
    tier3MinQty: 25,
    stock: 180,
    minStock: 40,
    min_stock: 40,
    unit: 'Kg',
    materialNature: 'MANUFACTURED',
    isWeightFraction: true,
    deliveryPricingPolicy: 'EXCLUDE_ONGKIR',
    supportDecimal: true,
    status: 'Active',
    businessModel: 'building',
    itemType: 'RETAIL',
    description: 'Paku beton & kayu baja 3 inch ekstra kuat. Dijual eceran per Kg atau dus isi 10kg.',
  },
  {
    id: 'MAT-KYU-MRNT',
    plu: 'KYU-KSO-57',
    barcode: '899900100009',
    name: 'Kayu Balok & Kaso Meranti 5x7 x 4 Meter',
    category: 'KAYU_PAPAN',
    brand: 'Borneo Kayu Asli',
    supplier: 'CV Quarry Merapi & Alam',
    supplierId: 'SUP-BLD-02',
    sell_price: 45000,
    cost_price: 35000,
    price_retail: 45000,
    price_member: 42000,
    price_wholesale: 38000,
    tier2Price: 42000,
    tier2MinQty: 20,
    tier3Price: 38000,
    tier3MinQty: 60,
    stock: 120,
    minStock: 50,
    min_stock: 50,
    unit: 'Batang',
    materialNature: 'DIMENSION_CUSTOM',
    customDimension: { lengthCm: 400, widthCm: 7, thicknessMm: 50 },
    deliveryPricingPolicy: 'EXCLUDE_ONGKIR',
    status: 'Active',
    businessModel: 'building',
    itemType: 'RETAIL',
    description: 'Kayu balok & kaso meranti keras ukuran 5x7 panjang 4 meter untuk bekisting dan atap.',
  },
  {
    id: 'MAT-CAT-INT5',
    plu: 'CAT-INT-5KG',
    barcode: '899900100002',
    name: 'Cat Tembok Interior 5kg Anti-Jamur',
    category: 'CAT_FINISHING',
    brand: 'Dulux Catylac',
    supplier: 'PT Dulux / Jotun Paint Indonesia',
    supplierId: 'SUP-BLD-04',
    sell_price: 135000,
    cost_price: 94000,
    price_retail: 135000,
    price_member: 125000,
    price_wholesale: 115000,
    tier2Price: 125000,
    tier2MinQty: 5,
    tier3Price: 115000,
    tier3MinQty: 15,
    stock: 65,
    minStock: 80,
    min_stock: 80,
    unit: 'Pail',
    materialNature: 'MANUFACTURED',
    deliveryPricingPolicy: 'EXCLUDE_ONGKIR',
    status: 'Low Stock',
    businessModel: 'building',
    itemType: 'RETAIL',
    description: 'Cat dinding interior formula khusus anti-bakteri dan jamur dengan daya tutup luas.',
  },
  {
    id: 'MAT-TOL-KPS',
    plu: 'TOL-KPS-8-24',
    barcode: '899900100005',
    name: 'Kunci Pas Set 8-24mm Chrome Vanadium',
    category: 'ALAT_PERTUKANGAN',
    brand: 'Tekiro SNI',
    supplier: 'PT Krakatau Steel / Distributor Besi',
    supplierId: 'SUP-BLD-03',
    sell_price: 165000,
    cost_price: 105000,
    price_retail: 165000,
    price_member: 152000,
    price_wholesale: 138000,
    tier2Price: 152000,
    tier2MinQty: 3,
    tier3Price: 138000,
    tier3MinQty: 10,
    stock: 40,
    minStock: 50,
    min_stock: 50,
    unit: 'Set',
    materialNature: 'MANUFACTURED',
    deliveryPricingPolicy: 'EXCLUDE_ONGKIR',
    status: 'Low Stock',
    businessModel: 'building',
    itemType: 'RETAIL',
    description: 'Set kunci pas ring kombinasi 14 pcs ukuran 8mm sampai 24mm material baja CR-V tahan karat.',
  },
  {
    id: 'MAT-SPL-1M3',
    plu: 'BTM-SPL-1M3',
    barcode: '899900100010',
    name: 'Batu Split 1/2 Cor Beton Curah',
    category: 'PASIR_BATU_SEMEN',
    brand: 'Quarry Andalas',
    supplier: 'CV Quarry Merapi & Alam',
    supplierId: 'SUP-BLD-02',
    sell_price: 310000,
    cost_price: 245000,
    price_retail: 310000,
    price_member: 295000,
    price_wholesale: 275000,
    tier2Price: 295000,
    tier2MinQty: 3,
    tier3Price: 275000,
    tier3MinQty: 6,
    stock: 85,
    minStock: 30,
    min_stock: 30,
    unit: 'm³',
    materialNature: 'BULK_CURAH',
    bulkUnitType: 'KUBIK_M3',
    deliveryPricingPolicy: 'INCLUDE_ONGKIR',
    defaultLoadingFee: 30000,
    bulkFleetTiers: [
      { id: 'PICKUP_RET', name: 'Ret Pick-up (±1.2 m³)', volumeM3: 1.2, suffix: '-PKP', price: 375000, costPrice: 295000, isActive: true },
      { id: 'TRUCK_ENGKEL', name: 'Ret Truk Engkel (±3.0 m³)', volumeM3: 3.0, suffix: '-ENG', price: 910000, costPrice: 735000, isActive: true },
      { id: 'DUMP_TRUCK', name: 'Ret Dump Truck Besar (±6.5 m³)', volumeM3: 6.5, suffix: '-TRK', price: 1850000, costPrice: 1520000, isActive: true },
      { id: 'SAK_KARUNG', name: 'Eceran Karung / Sak (±0.03 m³)', volumeM3: 0.03, suffix: '-SAK', price: 20000, costPrice: 14000, isActive: true },
    ],
    supportDecimal: true,
    status: 'Active',
    businessModel: 'building',
    itemType: 'RETAIL',
    description: 'Batu pecah split ukuran 1/2 cm bersih untuk pengecoran dak dan struktur pondasi.',
  },
  {
    id: 'MAT-BJR-C75',
    plu: 'BJR-KNL-C75',
    barcode: '899900100011',
    name: 'Baja Ringan Kanal C 75mm SNI (6m)',
    category: 'BESI_BAJA',
    brand: 'Taso / BlueScope',
    supplier: 'PT Krakatau Steel / Distributor Besi',
    supplierId: 'SUP-BLD-03',
    sell_price: 98000,
    cost_price: 80000,
    price_retail: 98000,
    price_member: 93000,
    price_wholesale: 87000,
    tier2Price: 93000,
    tier2MinQty: 15,
    tier3Price: 87000,
    tier3MinQty: 50,
    stock: 200,
    minStock: 75,
    min_stock: 75,
    unit: 'Batang',
    materialNature: 'MANUFACTURED',
    deliveryPricingPolicy: 'INCLUDE_ONGKIR',
    defaultLoadingFee: 1000,
    status: 'Active',
    businessModel: 'building',
    itemType: 'RETAIL',
    description: 'Rangka atap baja ringan profil Kanal C75 ketebalan 0.75mm panjang 6 meter standar SNI.',
  },
];

// 8. KASIR 10 (Salon & Barbershop)
export const SALON_BARBERSHOP_PRODUCTS: Product[] = [
  {
    id: 'SLN-POM-100G',
    plu: 'POM-100G-WTR',
    barcode: '899101000001',
    name: 'Hair Styling Pomade 100g',
    category: 'Produk Rambut & Grooming',
    brand: 'Chief Barbershop',
    sell_price: 65000,
    cost_price: 32000,
    price_retail: 65000,
    price_member: 58000,
    price_wholesale: 48000,
    stock: 65,
    unit: 'Pcs',
    description: 'Produk Fisik Penataan Rambut',
    status: 'Active',
    businessModel: 'salon',
    itemType: 'RETAIL',
  },
  {
    id: 'SLN-SRV-HCUT',
    plu: 'SRV-HCUT-WSH',
    barcode: '899101000002',
    name: 'Paket Gentlemen Haircut & Wash',
    category: 'Layanan Servis Potong Rambut',
    brand: 'JacS Barber Studio',
    sell_price: 50000,
    cost_price: 5000,
    price_retail: 50000,
    price_member: 45000,
    price_wholesale: 40000,
    stock: 999,
    unit: 'Layanan',
    serviceDuration: '45 Menit',
    description: 'Layanan Service Barbershop',
    status: 'Active',
    businessModel: 'salon',
    itemType: 'SERVICE',
  },
  {
    id: 'SLN-SRV-SHAV',
    plu: 'SRV-SHAV-TRM',
    barcode: '899101000003',
    name: 'Shaving & Beard Trim Treatment',
    category: 'Layanan Cukur & Beard',
    brand: 'JacS Barber Studio',
    sell_price: 35000,
    cost_price: 4000,
    price_retail: 35000,
    price_member: 30000,
    price_wholesale: 28000,
    stock: 999,
    unit: 'Layanan',
    serviceDuration: '25 Menit',
    description: 'Layanan Service Barbershop',
    status: 'Active',
    businessModel: 'salon',
    itemType: 'SERVICE',
  },
  {
    id: 'SLN-TNC-150M',
    plu: 'TNC-150ML-DND',
    barcode: '899101000004',
    name: 'Hair Tonic Anti-Dandruff 150ml',
    category: 'Produk Perawatan Rambut',
    brand: 'Makarizo Professional',
    sell_price: 55000,
    cost_price: 28000,
    price_retail: 55000,
    price_member: 49000,
    price_wholesale: 42000,
    stock: 50,
    unit: 'Botol',
    description: 'Produk Fisik Perawatan Rambut',
    status: 'Active',
    businessModel: 'salon',
    itemType: 'RETAIL',
  },
  {
    id: 'SLN-SRV-CRMB',
    plu: 'SRV-CRMB-TRT',
    barcode: '899101000005',
    name: 'Creambath Herbal Treatment 60m',
    category: 'Layanan Spa Rambut',
    brand: 'JacS Barber Studio',
    sell_price: 75000,
    cost_price: 12000,
    price_retail: 75000,
    price_member: 68000,
    price_wholesale: 60000,
    stock: 999,
    unit: 'Layanan',
    serviceDuration: '60 Menit',
    description: 'Layanan Service Salon',
    status: 'Active',
    businessModel: 'salon',
    itemType: 'SERVICE',
  },
];

// 9. LAUNDRY MULTI-SATUAN (Kiloan kg, Satuan pcs/stel, Pasang, Luas m2)
export const LAUNDRY_SLA_OPTIONS = [
  { label: 'Reguler 48 Jam', hours: 48 },
  { label: 'Kilat 24 Jam', hours: 24 },
  { label: 'Express 6 Jam', hours: 6 },
] as const;

export const LAUNDRY_SERVICE_CATEGORIES = [
  { id: 'LND-CAT-KILOAN', code: '901', name: 'Laundry Kiloan (kg)', department: 'Laundry Services' },
  { id: 'LND-CAT-SATUAN', code: '902', name: 'Laundry Satuan (Pcs/Stel)', department: 'Laundry Services' },
  { id: 'LND-CAT-PASANG', code: '903', name: 'Laundry Pasang (Sepatu/Tas)', department: 'Laundry Services' },
  { id: 'LND-CAT-LUAS', code: '904', name: 'Laundry Luas (Karpet/m2)', department: 'Laundry Services' },
] as const;

export const LAUNDRY_SERVICE_PRODUCTS: Product[] = [
  {
    id: 'LND-KG-REG',
    plu: 'LND-KG-REG',
    barcode: '899102000001',
    name: 'Cuci Komplit Reguler (Cuci + Kering + Setrika)',
    category: 'Laundry Kiloan (kg)',
    brand: 'JacS Laundry',
    sell_price: 8000,
    cost_price: 3200,
    price_retail: 8000,
    price_member: 7200,
    price_wholesale: 6500,
    stock: 999,
    unit: 'kg',
    laundryUnitType: 'KILOAN',
    supportDecimal: true,
    isWeighable: true,
    minOrderWeightKg: 2,
    minOrderQty: 2,
    slaDuration: 'Reguler 48 Jam',
    slaHours: 48,
    serviceDuration: 'Reguler 48 Jam',
    description: 'Layanan cuci komplit lipat & setrika uap kiloan standar (min. 2 kg).',
    status: 'Active',
    businessModel: 'laundry',
    itemType: 'SERVICE',
  },
  {
    id: 'LND-KG-KLT',
    plu: 'LND-KG-KLT',
    barcode: '899102000002',
    name: 'Cuci Komplit Kilat 24 Jam',
    category: 'Laundry Kiloan (kg)',
    brand: 'JacS Laundry',
    sell_price: 12000,
    cost_price: 4500,
    price_retail: 12000,
    price_member: 11000,
    price_wholesale: 10000,
    stock: 999,
    unit: 'kg',
    laundryUnitType: 'KILOAN',
    supportDecimal: true,
    isWeighable: true,
    minOrderWeightKg: 2,
    minOrderQty: 2,
    slaDuration: 'Kilat 24 Jam',
    slaHours: 24,
    serviceDuration: 'Kilat 24 Jam',
    description: 'Layanan cuci + pengering + setrika selesai maksimal 24 jam (min. 2 kg).',
    status: 'Active',
    businessModel: 'laundry',
    itemType: 'SERVICE',
  },
  {
    id: 'LND-KG-EXP',
    plu: 'LND-KG-EXP',
    barcode: '899102000003',
    name: 'Cuci Komplit Express 6 Jam',
    category: 'Laundry Kiloan (kg)',
    brand: 'JacS Laundry',
    sell_price: 18000,
    cost_price: 6500,
    price_retail: 18000,
    price_member: 16500,
    price_wholesale: 15000,
    stock: 999,
    unit: 'kg',
    laundryUnitType: 'KILOAN',
    supportDecimal: true,
    isWeighable: true,
    minOrderWeightKg: 2,
    minOrderQty: 2,
    slaDuration: 'Express 6 Jam',
    slaHours: 6,
    serviceDuration: 'Express 6 Jam',
    description: 'Layanan prioritas selesai dalam 6 jam siap pakai (min. 2 kg).',
    status: 'Active',
    businessModel: 'laundry',
    itemType: 'SERVICE',
  },
  {
    id: 'LND-KG-STR',
    plu: 'LND-KG-STR',
    barcode: '899102000004',
    name: 'Setrika Saja (Uap & Pewangi)',
    category: 'Laundry Kiloan (kg)',
    brand: 'JacS Laundry',
    sell_price: 5500,
    cost_price: 2000,
    price_retail: 5500,
    price_member: 5000,
    price_wholesale: 4500,
    stock: 999,
    unit: 'kg',
    laundryUnitType: 'KILOAN',
    supportDecimal: true,
    isWeighable: true,
    minOrderWeightKg: 2,
    minOrderQty: 2,
    slaDuration: 'Reguler 48 Jam',
    slaHours: 48,
    serviceDuration: 'Reguler 48 Jam',
    description: 'Jasa setrika uap rapi & parfum linen tahan lama per kg (min. 2 kg).',
    status: 'Active',
    businessModel: 'laundry',
    itemType: 'SERVICE',
  },
  {
    id: 'LND-PCS-JAS',
    plu: 'LND-PCS-JAS',
    barcode: '899102000005',
    name: 'Dry Clean Jas / Blazer Formal',
    category: 'Laundry Satuan (Pcs/Stel)',
    brand: 'JacS Laundry',
    sell_price: 35000,
    cost_price: 12000,
    price_retail: 35000,
    price_member: 32000,
    price_wholesale: 28000,
    stock: 999,
    unit: 'stel',
    laundryUnitType: 'SATUAN',
    supportDecimal: false,
    isWeighable: false,
    minOrderWeightKg: 1,
    minOrderQty: 1,
    slaDuration: 'Reguler 48 Jam',
    slaHours: 48,
    serviceDuration: 'Reguler 48 Jam',
    description: 'Cuci dry clean khusus jas / blazer formal lengkap dengan hanger & cover.',
    status: 'Active',
    businessModel: 'laundry',
    itemType: 'SERVICE',
  },
  {
    id: 'LND-PCS-KBY',
    plu: 'LND-PCS-KBY',
    barcode: '899102000006',
    name: 'Perawatan Kebaya / Gaun Pesta Payet',
    category: 'Laundry Satuan (Pcs/Stel)',
    brand: 'JacS Laundry',
    sell_price: 45000,
    cost_price: 15000,
    price_retail: 45000,
    price_member: 40000,
    price_wholesale: 36000,
    stock: 999,
    unit: 'pcs',
    laundryUnitType: 'SATUAN',
    supportDecimal: false,
    isWeighable: false,
    minOrderWeightKg: 1,
    minOrderQty: 1,
    slaDuration: 'Kilat 24 Jam',
    slaHours: 24,
    serviceDuration: 'Kilat 24 Jam',
    description: 'Pencucian manual lembut khusus kebaya berpayet & gaun pesta.',
    status: 'Active',
    businessModel: 'laundry',
    itemType: 'SERVICE',
  },
  {
    id: 'LND-PCS-BDC',
    plu: 'LND-PCS-BDC',
    barcode: '899102000007',
    name: 'Cuci Bedcover Tebal (King / Queen)',
    category: 'Laundry Satuan (Pcs/Stel)',
    brand: 'JacS Laundry',
    sell_price: 38000,
    cost_price: 13000,
    price_retail: 38000,
    price_member: 34000,
    price_wholesale: 30000,
    stock: 999,
    unit: 'pcs',
    laundryUnitType: 'SATUAN',
    supportDecimal: false,
    isWeighable: false,
    minOrderWeightKg: 1,
    minOrderQty: 1,
    slaDuration: 'Reguler 48 Jam',
    slaHours: 48,
    serviceDuration: 'Reguler 48 Jam',
    description: 'Cuci higienis anti-tungau + pengeringan optimal & vakum bedcover.',
    status: 'Active',
    businessModel: 'laundry',
    itemType: 'SERVICE',
  },
  {
    id: 'LND-PSG-SHOE',
    plu: 'LND-PSG-SHOE',
    barcode: '899102000008',
    name: 'Cuci Sepatu Deep Clean (Sneakers / Canvas)',
    category: 'Laundry Pasang (Sepatu/Tas)',
    brand: 'JacS Laundry',
    sell_price: 45000,
    cost_price: 14000,
    price_retail: 45000,
    price_member: 40000,
    price_wholesale: 35000,
    stock: 999,
    unit: 'pasang',
    laundryUnitType: 'PASANG',
    supportDecimal: false,
    isWeighable: false,
    minOrderWeightKg: 1,
    minOrderQty: 1,
    slaDuration: 'Reguler 48 Jam',
    slaHours: 48,
    serviceDuration: 'Reguler 48 Jam',
    description: 'Pembersihan menyeluruh upper, midsole, outsole & insole per pasang.',
    status: 'Active',
    businessModel: 'laundry',
    itemType: 'SERVICE',
  },
  {
    id: 'LND-PSG-WHT',
    plu: 'LND-PSG-WHT',
    barcode: '899102000009',
    name: 'Cuci Sepatu Express Whitening & Odor Care',
    category: 'Laundry Pasang (Sepatu/Tas)',
    brand: 'JacS Laundry',
    sell_price: 65000,
    cost_price: 20000,
    price_retail: 65000,
    price_member: 58000,
    price_wholesale: 52000,
    stock: 999,
    unit: 'pasang',
    laundryUnitType: 'PASANG',
    supportDecimal: false,
    isWeighable: false,
    minOrderWeightKg: 1,
    minOrderQty: 1,
    slaDuration: 'Express 6 Jam',
    slaHours: 6,
    serviceDuration: 'Express 6 Jam',
    description: 'Cuci sepatu kilat dengan anti-bacterial UV & unyellowing ringan.',
    status: 'Active',
    businessModel: 'laundry',
    itemType: 'SERVICE',
  },
  {
    id: 'LND-M2-KRP',
    plu: 'LND-M2-KRP',
    barcode: '899102000010',
    name: 'Cuci Karpet Tebal / Karpet Kantor (P × L)',
    category: 'Laundry Luas (Karpet/m2)',
    brand: 'JacS Laundry',
    sell_price: 25000,
    cost_price: 9000,
    price_retail: 25000,
    price_member: 22500,
    price_wholesale: 20000,
    stock: 999,
    unit: 'm2',
    laundryUnitType: 'LUAS',
    supportDecimal: true,
    isWeighable: false,
    minOrderWeightKg: 1,
    minOrderQty: 1,
    slaDuration: 'Reguler 48 Jam',
    slaHours: 48,
    serviceDuration: 'Reguler 48 Jam',
    description: 'Cuci bilas extractor karpet dihitung per meter persegi (Panjang × Lebar).',
    status: 'Active',
    businessModel: 'laundry',
    itemType: 'SERVICE',
  },
  {
    id: 'LND-M2-PRM',
    plu: 'LND-M2-PRM',
    barcode: '899102000011',
    name: 'Cuci Karpet Permadani / Wool Premium (P × L)',
    category: 'Laundry Luas (Karpet/m2)',
    brand: 'JacS Laundry',
    sell_price: 35000,
    cost_price: 13000,
    price_retail: 35000,
    price_member: 31500,
    price_wholesale: 28000,
    stock: 999,
    unit: 'm2',
    laundryUnitType: 'LUAS',
    supportDecimal: true,
    isWeighable: false,
    minOrderWeightKg: 1,
    minOrderQty: 1,
    slaDuration: 'Kilat 24 Jam',
    slaHours: 24,
    serviceDuration: 'Kilat 24 Jam',
    description: 'Treatment khusus serat permadani & wool premium per m2 (Panjang × Lebar).',
    status: 'Active',
    businessModel: 'laundry',
    itemType: 'SERVICE',
  },
];

// Gabungan seluruh produk dummy resmi seluruh industri
export const ALL_INDUSTRY_PRODUCTS: Product[] = [
  ...RETAIL_WHOLESALE_PRODUCTS,
  ...FNB_RESTAURANT_PRODUCTS,
  ...PHARMACY_HEALTHCARE_PRODUCTS,
  ...FASHION_APPAREL_PRODUCTS,
  ...ELECTRONICS_GADGETS_PRODUCTS,
  ...AUTOMOTIVE_WORKSHOP_PRODUCTS,
  ...BUILDING_HARDWARE_PRODUCTS,
  ...SALON_BARBERSHOP_PRODUCTS,
  ...LAUNDRY_SERVICE_PRODUCTS,
];

// =========================================================================
// DEMO CARTS RESMI SETIAP TERMINAL (REALISTIS PER INDUSTRI)
// =========================================================================

export const INDUSTRY_DEMO_CARTS: Record<TerminalIndustry, CartItem[]> = {
  retail: [
    {
      product: RETAIL_WHOLESALE_PRODUCTS[0], // Minyak Goreng 2L
      quantity: 2,
      subtotal: 77000,
      itemDiscount: 0,
    },
    {
      product: RETAIL_WHOLESALE_PRODUCTS[1], // Beras 5kg
      quantity: 1,
      subtotal: 74000,
      itemDiscount: 0,
    },
    {
      product: RETAIL_WHOLESALE_PRODUCTS[3], // Aqua 600ml
      quantity: 3,
      subtotal: 12000,
      itemDiscount: 0,
    },
  ],
  fnb: [
    {
      product: FNB_RESTAURANT_PRODUCTS[0], // Kopi Susu Gula Aren
      quantity: 2,
      subtotal: 44000,
      itemDiscount: 0,
      modifiers: {
        orderType: 'Dine-In',
        tableNumber: 'Meja 04',
        spicyLevel: 0,
        toppings: ['Less Ice'],
        notes: 'Less sugar manis pas',
      },
    },
    {
      product: FNB_RESTAURANT_PRODUCTS[2], // Nasi Goreng Spesial
      quantity: 1,
      subtotal: 32000,
      itemDiscount: 0,
      modifiers: {
        orderType: 'Dine-In',
        tableNumber: 'Meja 04',
        spicyLevel: 2,
        toppings: ['Telur Mata Sapi'],
        notes: 'Telur ceplok setengah matang',
      },
    },
    {
      product: FNB_RESTAURANT_PRODUCTS[3], // Croissant Butter
      quantity: 1,
      subtotal: 25000,
      itemDiscount: 0,
      modifiers: {
        orderType: 'Dine-In',
        tableNumber: 'Meja 04',
        spicyLevel: 0,
        toppings: [],
        notes: 'Hangatkan sebentar',
      },
    },
  ],
  pharmacy: [
    {
      product: PHARMACY_HEALTHCARE_PRODUCTS[0], // Paracetamol 500mg
      quantity: 2,
      subtotal: 13000,
      itemDiscount: 0,
      signa: '3 x 1 Tablet sesudah makan bila demam/nyeri',
    },
    {
      product: PHARMACY_HEALTHCARE_PRODUCTS[1], // Vitamin C Botol
      quantity: 1,
      subtotal: 14500,
      itemDiscount: 0,
      signa: '1 x 1 Tablet hisap per hari',
    },
    {
      product: PHARMACY_HEALTHCARE_PRODUCTS[3], // Minyak Kayu Putih 60ml
      quantity: 1,
      subtotal: 26500,
      itemDiscount: 0,
      signa: 'Oleskan secukupnya pada bagian yang memerlukan',
    },
  ],
  fashion: [
    {
      product: FASHION_APPAREL_PRODUCTS[0], // Gamis Silk Humaira (Clearance 15%)
      quantity: 1,
      subtotal: 245650,
      itemDiscount: 43350,
      promoSavings: 43350,
      promoName: 'Clearance Sale Koleksi Silk 15%',
      promoSourceType: 'STORE_DISC',
      selectedFashionSize: 'M',
      selectedFashionColor: 'Sage',
      modifiers: {
        variant: 'M • Sage',
      },
    },
    {
      product: FASHION_APPAREL_PRODUCTS[1], // Kemeja Linen Pria (Mix & Match)
      quantity: 1,
      subtotal: 195000,
      itemDiscount: 0,
      selectedFashionSize: 'L',
      selectedFashionColor: 'Hitam',
      modifiers: {
        variant: 'L • Hitam',
      },
    },
    {
      product: FASHION_APPAREL_PRODUCTS[2], // Hijab Voal Premium (Mix & Match)
      quantity: 1,
      subtotal: 75000,
      itemDiscount: 0,
      selectedFashionSize: 'M',
      selectedFashionColor: 'Cream',
      modifiers: {
        variant: 'M • Cream',
      },
    },
  ],
  electronics: [
    {
      product: ELECTRONICS_GADGETS_PRODUCTS[0], // Kabel Type-C
      quantity: 1,
      subtotal: 45000,
      itemDiscount: 0,
    },
    {
      product: ELECTRONICS_GADGETS_PRODUCTS[1], // TWS Earbuds
      quantity: 1,
      subtotal: 249000,
      itemDiscount: 0,
    },
  ],
  workshop: [
    {
      product: AUTOMOTIVE_WORKSHOP_PRODUCTS[0], // Oli Mesin 10W-40
      quantity: 1,
      subtotal: 115000,
      itemDiscount: 0,
    },
    {
      product: AUTOMOTIVE_WORKSHOP_PRODUCTS[3], // Filter Oli
      quantity: 1,
      subtotal: 38000,
      itemDiscount: 0,
    },
    {
      product: AUTOMOTIVE_WORKSHOP_PRODUCTS[5], // Jasa Servis Ringan
      quantity: 1,
      subtotal: 60000,
      itemDiscount: 0,
    },
  ],
  building: [
    {
      product: BUILDING_HARDWARE_PRODUCTS[0], // Semen Portland 50kg
      quantity: 5,
      subtotal: 340000,
      itemDiscount: 0,
      selectedUnit: 'Zak',
    },
    {
      product: BUILDING_HARDWARE_PRODUCTS[2], // Paku Baja 3 Inch
      quantity: 2,
      subtotal: 44000,
      itemDiscount: 0,
      selectedUnit: 'Kg',
    },
  ],
  salon: [
    {
      product: SALON_BARBERSHOP_PRODUCTS[0], // Pomade
      quantity: 1,
      subtotal: 65000,
      itemDiscount: 0,
    },
    {
      product: SALON_BARBERSHOP_PRODUCTS[1], // Paket Gentlemen Haircut
      quantity: 1,
      subtotal: 50000,
      itemDiscount: 0,
    },
  ],
  laundry: [
    {
      product: LAUNDRY_SERVICE_PRODUCTS[0], // Cuci Komplit Reguler (kg)
      quantity: 3.25,
      subtotal: 26000,
      itemDiscount: 0,
      selectedUnit: 'kg',
      grossWeightKg: 3.75,
      tareWeightKg: 0.5,
      actualNetWeightKg: 3.25,
      isMinWeightAdjusted: false,
      minWeightAppliedKg: 2,
    },
    {
      product: LAUNDRY_SERVICE_PRODUCTS[7], // Cuci Sepatu Deep Clean (pasang)
      quantity: 1,
      subtotal: 45000,
      itemDiscount: 0,
      selectedUnit: 'pasang',
    },
  ],
};

/**
 * Filter daftar produk agar sesuai dengan industri kasir yang sedang aktif.
 */
export function filterProductsByTerminal(
  allProducts: Product[],
  terminal?: {
    id?: string;
    name?: string;
    code?: string;
    modelType?: string;
    businessModel?: string;
    location?: string;
  } | null,
  showAllCategories?: boolean
): Product[] {
  if (showAllCategories) {
    return allProducts.filter((p) => {
      if (String(p.status).toUpperCase() === 'DISCONTINUED') return false;
      if (p.itemType === 'RAW_MATERIAL') return false;
      const idLower = (p.id || '').toLowerCase();
      if (idLower.startsWith('ing-') || idLower.startsWith('raw-')) return false;
      const catLower = (p.category || '').toLowerCase();
      if (catLower.includes('bahan baku') || catLower.includes('bahan mentah')) return false;
      return true;
    });
  }
  const industry = getTerminalIndustry(terminal);

  // Buat lookup ID produk yang secara eksplisit masuk ke industri ini
  const industryMap: Record<TerminalIndustry, Product[]> = {
    retail: RETAIL_WHOLESALE_PRODUCTS,
    fnb: FNB_RESTAURANT_PRODUCTS,
    pharmacy: PHARMACY_HEALTHCARE_PRODUCTS,
    fashion: FASHION_APPAREL_PRODUCTS,
    electronics: ELECTRONICS_GADGETS_PRODUCTS,
    workshop: AUTOMOTIVE_WORKSHOP_PRODUCTS,
    building: BUILDING_HARDWARE_PRODUCTS,
    salon: SALON_BARBERSHOP_PRODUCTS,
    laundry: LAUNDRY_SERVICE_PRODUCTS,
  };

  const specificIndustryProducts = industryMap[industry] || RETAIL_WHOLESALE_PRODUCTS;
  const specificIds = new Set(specificIndustryProducts.map((p) => p.id));
  const specificBarcodes = new Set(specificIndustryProducts.map((p) => p.barcode).filter(Boolean));

  return allProducts.filter((p) => {
    // 1. Abaikan mutlak item Discontinued & Bahan Baku mentah
    if (String(p.status).toUpperCase() === 'DISCONTINUED') return false;
    if (p.itemType === 'RAW_MATERIAL') return false;
    const idLower = (p.id || '').toLowerCase();
    const nameLower = (p.name || '').toLowerCase();
    if (idLower.startsWith('ing-') || idLower.startsWith('raw-')) return false;
    const catLower = (p.category || '').toLowerCase();
    if (catLower.includes('bahan baku') || catLower.includes('bahan mentah')) return false;

    // 2. Cocokkan ID atau Barcode spesifik industri jika ada di database template resmi
    if (specificIds.has(p.id) || (p.barcode && specificBarcodes.has(p.barcode))) {
      return true;
    }

    // 3. Cocokkan atribut kategori, itemType, dan model bisnis sesuai instruksi spesifik terminal
    const bm = (p.businessModel || '').toLowerCase();
    const it = (p.itemType || '').toUpperCase();

    switch (industry) {
      case 'fnb': {
        // KASIR 02 (F&B / Resto): default HANYA menampilkan produk kategori Makanan, Minuman, dan Snack
        const isMakanan =
          catLower.includes('makan') ||
          catLower.includes('food') ||
          catLower.includes('dish') ||
          catLower.includes('pastry') ||
          catLower.includes('bakery') ||
          catLower.includes('roti') ||
          catLower.includes('mie') ||
          catLower.includes('nasi') ||
          catLower.includes('ayam') ||
          catLower.includes('burger') ||
          catLower.includes('pasta');
        const isMinuman =
          catLower.includes('minum') ||
          catLower.includes('beverage') ||
          catLower.includes('drink') ||
          catLower.includes('kopi') ||
          catLower.includes('coffee') ||
          catLower.includes('tea') ||
          catLower.includes('teh') ||
          catLower.includes('jus') ||
          catLower.includes('juice') ||
          catLower.includes('boba');
        const isSnack =
          catLower.includes('snack') ||
          catLower.includes('camilan') ||
          catLower.includes('cemilan') ||
          catLower.includes('dessert') ||
          catLower.includes('kudapan') ||
          catLower.includes('gorengan');

        return (
          isMakanan ||
          isMinuman ||
          isSnack ||
          it === 'MENU_FB' ||
          bm === 'fnb' ||
          bm.includes('resto') ||
          bm.includes('kuliner')
        );
      }

      case 'pharmacy': {
        // KASIR 03 (Pharmacy & Pet Shop): menampilkan Obat, Vitamin, Alkes, Pakan Hewan, dan Obat/Vitamin Hewan
        const isObat =
          catLower.includes('obat') ||
          catLower.includes('medicine') ||
          catLower.includes('resep') ||
          Boolean(p.pharmacyClass);
        const isVitamin =
          catLower.includes('vitamin') ||
          catLower.includes('suplemen') ||
          catLower.includes('supplement');
        const isAlkes =
          catLower.includes('alkes') ||
          catLower.includes('alat kesehatan') ||
          catLower.includes('medical') ||
          catLower.includes('medis') ||
          catLower.includes('termometer') ||
          catLower.includes('tensimeter') ||
          catLower.includes('masker') ||
          catLower.includes('kassa') ||
          catLower.includes('perban');
        const isPet =
          catLower.includes('pet') ||
          catLower.includes('hewan') ||
          catLower.includes('pakan') ||
          catLower.includes('kucing') ||
          catLower.includes('anjing') ||
          nameLower.includes('pakan') ||
          nameLower.includes('kucing') ||
          nameLower.includes('anjing') ||
          nameLower.includes('whiskas') ||
          nameLower.includes('pedigree') ||
          nameLower.includes('royal canin') ||
          idLower.startsWith('pet-') ||
          bm === 'petshop' ||
          bm === 'pet_shop';

        return isObat || isVitamin || isAlkes || isPet || bm === 'pharmacy';
      }

      case 'building': {
        // KASIR 05 / T-05 (Building Materials & Hardware): kunci filter hanya untuk kategori material:
        // Semen, Pasir/Batu, Besi/Baja, Perpipaan, Paku/Kawat, Kayu, Cat/Thinner, Perkakas
        const allowedBuildingCategories = [
          'semen',
          'pasir/batu',
          'besi/baja',
          'perpipaan',
          'paku/kawat',
          'kayu',
          'cat/thinner',
          'perkakas',
        ];
        const matchCat = allowedBuildingCategories.some(
          (allowed) => catLower === allowed || catLower.includes(allowed)
        );
        const isMatId = idLower.startsWith('mat-');
        const isBuildingModel = bm === 'building' || (p.businessModel || '').toLowerCase() === 'building';
        return matchCat || isMatId || isBuildingModel;
      }

      case 'fashion':
        return (
          bm === 'fashion' ||
          catLower.includes('kaos') ||
          catLower.includes('kemeja') ||
          catLower.includes('celana') ||
          catLower.includes('jaket') ||
          catLower.includes('apparel') ||
          catLower.includes('fashion')
        );

      case 'electronics':
        return (
          bm === 'electronics' ||
          bm === 'gadget' ||
          catLower.includes('elektronik') ||
          catLower.includes('gadget') ||
          catLower.includes('audio') ||
          catLower.includes('charger') ||
          catLower.includes('kabel') ||
          catLower.includes('powerbank')
        );

      case 'workshop':
        return (
          bm === 'workshop' ||
          bm === 'automotive' ||
          catLower.includes('bengkel') ||
          catLower.includes('oli') ||
          catLower.includes('sparepart') ||
          catLower.includes('servis') ||
          catLower.includes('otomotif') ||
          it === 'SERVICE'
        );

      case 'laundry':
        if (String(p.status || 'Active').toUpperCase() === 'INACTIVE' || String(p.status || '').toUpperCase() === 'NONAKTIF') {
          return false;
        }
        return (
          bm === 'laundry' ||
          idLower.startsWith('lnd-') ||
          idLower.startsWith('svc-lnd-') ||
          Boolean(p.laundryUnitType) ||
          catLower.includes('laundry') ||
          catLower.includes('dry clean') ||
          catLower.includes('binatu') ||
          catLower.includes('kiloan') ||
          catLower.includes('karpet')
        );

      case 'salon':
        if (String(p.status || 'Active').toUpperCase() === 'INACTIVE' || String(p.status || '').toUpperCase() === 'NONAKTIF') {
          return false;
        }
        return (
          bm === 'salon' ||
          idLower.startsWith('svc-brb-') ||
          idLower.startsWith('prd-brb-') ||
          idLower.startsWith('sln-') ||
          catLower.includes('salon') ||
          catLower.includes('barber') ||
          catLower.includes('rambut') ||
          catLower.includes('grooming') ||
          catLower.includes('kapster') ||
          catLower.includes('pangkas') ||
          catLower.includes('hair care') ||
          catLower.includes('coloring') ||
          nameLower.includes('haircut') ||
          nameLower.includes('pomade') ||
          nameLower.includes('creambath') ||
          nameLower.includes('shampoo') ||
          nameLower.includes('potong')
        );

      case 'retail':
      default:
        // Terminal Ritel Umum (Kasir 01): menampilkan seluruh produk ritel umum (sembako/minimarket) tanpa item material bangunan / jasa laundry / barbershop
        return (
          it === 'RETAIL' &&
          bm !== 'building' &&
          bm !== 'electronics' &&
          bm !== 'workshop' &&
          bm !== 'fashion' &&
          bm !== 'salon' &&
          bm !== 'laundry' &&
          !Boolean(p.pharmacyClass) &&
          !Boolean(p.laundryUnitType) &&
          p.materialNature !== 'BULK_CURAH' &&
          p.materialNature !== 'DIMENSION_CUSTOM' &&
          !catLower.includes('bangunan') &&
          !catLower.includes('perkakas') &&
          !catLower.includes('material') &&
          !catLower.includes('laundry') &&
          !catLower.includes('salon') &&
          !catLower.includes('barber') &&
          !idLower.startsWith('mat-') &&
          !idLower.startsWith('gad-') &&
          !idLower.startsWith('oto-') &&
          !idLower.startsWith('fash-') &&
          !idLower.startsWith('sln-') &&
          !idLower.startsWith('lnd-') &&
          !idLower.startsWith('svc-') &&
          !idLower.startsWith('prd-brb-') &&
          !idLower.startsWith('pet-')
        );
    }
  });
}
