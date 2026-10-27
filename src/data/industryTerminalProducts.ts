import { Product, CartItem } from '../types';

export type TerminalIndustry =
  | 'retail'        // KASIR 01, 03 (Modern Retail & Wholesale)
  | 'fnb'           // KASIR 02 (Food & Beverage)
  | 'pharmacy'      // KASIR 04 (Pharmacy & Healthcare)
  | 'fashion'       // KASIR 05 (Fashion & Apparel)
  | 'building'      // KASIR 06 (Building Materials & Hardware) & KASIR 09 (Building & Hardware Depot)
  | 'electronics'   // KASIR 07 (Electronics & Gadgets)
  | 'workshop'      // KASIR 08 (Automotive & Workshop)
  | 'salon';        // KASIR 10 (Salon & Barbershop)

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

// 2. KASIR 02 (Food & Beverage / F&B)
export const FNB_RESTAURANT_PRODUCTS: Product[] = [
  {
    id: 'FNB-KOP-AREN',
    plu: 'FNB-KOP-AREN',
    barcode: '899200200001',
    name: 'Kopi Susu Gula Aren Signature',
    category: 'Minuman Kopi',
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
    recipeSummary: 'Espresso Blend, Susu Segar Pasteurisasi, Sirup Gula Aren Asli',
  },
  {
    id: 'FNB-ESP-SHOT',
    plu: 'FNB-ESP-SHOT',
    barcode: '899200200002',
    name: 'Espresso Roast Single / Double Shot',
    category: 'Minuman Kopi',
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
    recipeSummary: 'Biji Kopi Arabica Gayo & Robusta 30g',
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
    recipeSummary: 'Beras Pulen, Telur Ayam, Daging Ayam Suwir, Bumbu Rempah Spesial',
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
    recipeSummary: 'Tepung Terigu Import, French Butter 82%, Ragi & Gula',
  },
  {
    id: 'FNB-TEA-JUMBO',
    plu: 'FNB-TEA-JUMBO',
    barcode: '899200200005',
    name: 'Es Teh Manis Jumbo Segar',
    category: 'Minuman Segar',
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
    recipeSummary: 'Daun Teh Melati Pilihan, Gula Tebu Alami, Es Kristal Higienis',
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

// 4. KASIR 05 (Fashion & Apparel)
export const FASHION_APPAREL_PRODUCTS: Product[] = [
  {
    id: 'FASH-TSHIRT-C30',
    plu: 'TSHIRT-C30S',
    barcode: '899500100001',
    name: 'Kaos Polos Cotton Combed 30s (S/M/L/XL)',
    category: 'Atasan & T-Shirt',
    brand: 'JacS Apparel',
    sell_price: 55000,
    cost_price: 32000,
    price_retail: 55000,
    price_member: 50000,
    price_wholesale: 42000,
    stock: 150,
    unit: 'Pcs',
    variantSize: 'S, M, L, XL',
    variantColor: 'Hitam, Putih, Navy, Sage',
    status: 'Active',
    businessModel: 'fashion',
    itemType: 'RETAIL',
    description: 'Bahan 100% Cotton Combed 30s reaktif, adem, jahitan rantai rapi berstandar distro.',
  },
  {
    id: 'FASH-KEM-OXF',
    plu: 'KEM-OXF-SLIM',
    barcode: '899500100002',
    name: 'Kemeja Oxford Slim Fit Lengan Panjang',
    category: 'Kemeja Formal & Casual',
    brand: 'JacS Tailor',
    sell_price: 165000,
    cost_price: 95000,
    price_retail: 165000,
    price_member: 150000,
    price_wholesale: 130000,
    stock: 65,
    unit: 'Pcs',
    variantSize: 'M, L, XL',
    variantColor: 'Putih Bersih, Biru Muda, Abu Misty',
    status: 'Active',
    businessModel: 'fashion',
    itemType: 'RETAIL',
    description: 'Kemeja kerja kasual bahan Oxford tebal nyaman dengan kerah button-down berkelas.',
  },
  {
    id: 'FASH-CHN-PNT',
    plu: 'CHN-PNT-STR',
    barcode: '899500100003',
    name: 'Celana Panjang Chino Stretch Pria',
    category: 'Celana Pria',
    brand: 'JacS Denim & Co',
    sell_price: 185000,
    cost_price: 110000,
    price_retail: 185000,
    price_member: 170000,
    price_wholesale: 145000,
    stock: 50,
    unit: 'Pcs',
    variantSize: '28, 30, 32, 34',
    variantColor: 'Khaki, Hitam, Dark Grey, Mocca',
    status: 'Active',
    businessModel: 'fashion',
    itemType: 'RETAIL',
    description: 'Celana chino katun twill stretch elastis, potongan slim-fit modern cocok untuk kerja & santai.',
  },
  {
    id: 'FASH-DNM-JKT',
    plu: 'DNM-JKT-14OZ',
    barcode: '899500100004',
    name: 'Denim Jacket Casual Vintage Wash 14oz',
    category: 'Jaket & Outerwear',
    brand: 'JacS Denim & Co',
    sell_price: 280000,
    cost_price: 165000,
    price_retail: 280000,
    price_member: 255000,
    price_wholesale: 220000,
    stock: 35,
    unit: 'Pcs',
    variantSize: 'M, L, XL, XXL',
    variantColor: 'Biowash Blue, Black Indigo',
    status: 'Active',
    businessModel: 'fashion',
    itemType: 'RETAIL',
    description: 'Jaket jeans tebal 14oz non-stretch dengan efek washing vintage klasik dan kancing tembaga.',
  },
  {
    id: 'FASH-BAG-KNV',
    plu: 'BAG-KNV-ZIP',
    barcode: '899500100005',
    name: 'Totebag Kanvas Heavy Canvas Resleting',
    category: 'Tas & Aksesori Fashion',
    brand: 'JacS Goods',
    sell_price: 65000,
    cost_price: 35000,
    price_retail: 65000,
    price_member: 58000,
    price_wholesale: 48000,
    stock: 80,
    unit: 'Pcs',
    variantSize: 'All Size (40x35cm)',
    variantColor: 'Broken White, Hitam, Army Green',
    status: 'Active',
    businessModel: 'fashion',
    itemType: 'RETAIL',
    description: 'Tas totebag bahan kanvas tebal dengan kantong laptop dan penutup ritsleting kuat.',
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
    category: 'Semen & Pengikat',
    brand: 'Semen Tonasa / Gresik',
    sell_price: 68000,
    cost_price: 56000,
    price_retail: 68000,
    price_member: 65000,
    price_wholesale: 61000,
    stock: 250,
    unit: 'Zak',
    supportDecimal: false,
    status: 'Active',
    businessModel: 'building',
    itemType: 'RETAIL',
    description: 'Semen Portland PCC berkualitas tinggi untuk plesteran, acian, dan cor beton kokoh.',
  },
  {
    id: 'MAT-CAT-INT5',
    plu: 'CAT-INT-5KG',
    barcode: '899900100002',
    name: 'Cat Tembok Interior 5kg Anti-Jamur',
    category: 'Cat & Pelapis Tembok',
    brand: 'Dulux Catylac',
    sell_price: 135000,
    cost_price: 94000,
    price_retail: 135000,
    price_member: 125000,
    price_wholesale: 112000,
    stock: 65,
    unit: 'Galon 5kg',
    status: 'Active',
    businessModel: 'building',
    itemType: 'RETAIL',
    description: 'Cat dinding interior formula khusus anti-bakteri dan jamur dengan daya tutup luas.',
  },
  {
    id: 'MAT-PKU-3INC',
    plu: 'PKU-BAJA-3IN',
    barcode: '899900100003',
    name: 'Paku Baja 3 Inch (Kg)',
    category: 'Paku, Baut & Kawat',
    brand: 'Baja SNI',
    sell_price: 22000,
    cost_price: 14000,
    price_retail: 22000,
    price_member: 20000,
    price_wholesale: 17500,
    stock: 180,
    unit: 'Kg',
    unitSecondary: 'Dus (10kg)',
    priceSecondary: 175000,
    conversionRate: 10,
    supportDecimal: true,
    status: 'Active',
    businessModel: 'building',
    itemType: 'RETAIL',
    description: 'Paku beton & kayu baja 3 inch ekstra kuat. Dijual eceran per Kg atau dus isi 10kg.',
  },
  {
    id: 'MAT-THN-SUP1',
    plu: 'THN-SUP-1L',
    barcode: '899900100004',
    name: 'Thinner Super 1L High-Gloss',
    category: 'Pelarut & Thinner',
    brand: 'Cobra High Gloss',
    sell_price: 28000,
    cost_price: 19500,
    price_retail: 28000,
    price_member: 26000,
    price_wholesale: 23000,
    stock: 90,
    unit: 'Kaleng 1L',
    status: 'Active',
    businessModel: 'building',
    itemType: 'RETAIL',
    description: 'Thinner pengencer cat minyak dan pernis kayu menghasilkan kilap maksimal dan cepat kering.',
  },
  {
    id: 'MAT-TOL-KPS',
    plu: 'TOL-KPS-8-24',
    barcode: '899900100005',
    name: 'Kunci Pas Set 8-24mm Chrome Vanadium',
    category: 'Perkakas & Alat Tukang',
    brand: 'Tekiro SNI',
    sell_price: 165000,
    cost_price: 105000,
    price_retail: 165000,
    price_member: 150000,
    price_wholesale: 132000,
    stock: 40,
    unit: 'Set',
    status: 'Active',
    businessModel: 'building',
    itemType: 'RETAIL',
    description: 'Set kunci pas ring kombinasi 14 pcs ukuran 8mm sampai 24mm material baja CR-V tahan karat.',
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
      product: FASHION_APPAREL_PRODUCTS[0], // Kaos Polos Combed 30s
      quantity: 2,
      subtotal: 110000,
      itemDiscount: 0,
      modifiers: {
        variant: 'Ukuran L • Hitam',
      },
    },
    {
      product: FASHION_APPAREL_PRODUCTS[1], // Kemeja Oxford
      quantity: 1,
      subtotal: 165000,
      itemDiscount: 0,
      modifiers: {
        variant: 'Ukuran M • Biru Muda',
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
  showAllCategories = false
): Product[] {
  // Jika toggle 'Semua Kategori' aktif, tampilkan seluruh produk ritel/katalog aktif (kecuali bahan mentah & discontinued)
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
        // KASIR 05 (Building Materials & Hardware): menampilkan Material, Cat, dan Perkakas Bangunan
        const isMaterial =
          catLower.includes('material') ||
          catLower.includes('bangunan') ||
          catLower.includes('semen') ||
          catLower.includes('pasir') ||
          catLower.includes('batu') ||
          catLower.includes('bata') ||
          catLower.includes('besi') ||
          catLower.includes('pipa') ||
          catLower.includes('kayu') ||
          (p.id || '').startsWith('MAT-');
        const isCat =
          catLower.includes('cat') ||
          catLower.includes('paint') ||
          catLower.includes('thinner') ||
          catLower.includes('pelapis') ||
          catLower.includes('pernis');
        const isPerkakas =
          catLower.includes('perkakas') ||
          catLower.includes('alat tukang') ||
          catLower.includes('tools') ||
          catLower.includes('hardware') ||
          catLower.includes('paku') ||
          catLower.includes('baut') ||
          catLower.includes('kuas') ||
          catLower.includes('palu') ||
          catLower.includes('meteran');

        return isMaterial || isCat || isPerkakas || bm === 'building';
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

      case 'salon':
        return (
          bm === 'salon' ||
          bm === 'service' ||
          catLower.includes('salon') ||
          catLower.includes('barber') ||
          catLower.includes('rambut') ||
          catLower.includes('grooming') ||
          catLower.includes('kapster') ||
          catLower.includes('pangkas') ||
          nameLower.includes('haircut') ||
          nameLower.includes('pomade') ||
          nameLower.includes('creambath') ||
          nameLower.includes('shampoo') ||
          nameLower.includes('potong') ||
          (it === 'SERVICE' && (idLower.startsWith('sln-') || idLower.startsWith('brb-'))) ||
          idLower.startsWith('sln-')
        );

      case 'retail':
      default:
        // Terminal Ritel Umum (Kasir 01): menampilkan seluruh produk ritel umum
        return (
          it === 'RETAIL' &&
          bm !== 'building' &&
          bm !== 'electronics' &&
          bm !== 'workshop' &&
          bm !== 'fashion' &&
          bm !== 'salon' &&
          !Boolean(p.pharmacyClass) &&
          !idLower.startsWith('mat-') &&
          !idLower.startsWith('gad-') &&
          !idLower.startsWith('oto-') &&
          !idLower.startsWith('fash-') &&
          !idLower.startsWith('sln-') &&
          !idLower.startsWith('pet-')
        );
    }
  });
}
