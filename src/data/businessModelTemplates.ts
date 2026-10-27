export type BusinessModelType = 'retail' | 'fnb' | 'pharmacy' | 'fashion' | 'gadget' | 'services';

export interface BusinessModelTemplate {
  id: BusinessModelType;
  label: string;
  subLabel: string;
  badge: string;
  headers: string[];
  requiredColumns: string[];
  sampleRows: string[][];
  sampleCsv: string;
}

export const BUSINESS_MODEL_TEMPLATES: Record<BusinessModelType, BusinessModelTemplate> = {
  retail: {
    id: 'retail',
    label: 'Ritel & Minimarket (ERP Standard)',
    subLabel: 'Data Contract Baku ERP Kasir & Minimarket Modern',
    badge: 'CANONICAL ERP STANDARD',
    headers: [
      'PLU',
      'BARCODE',
      'PRODUCT_NAME',
      'CATEGORY',
      'BRAND',
      'MANUFACTURER',
      'UOM',
      'PRICE_RETAIL',
      'PRICE_MEMBER',
      'PRICE_WHOLESALE',
      'VAT_INCLUDED',
    ],
    requiredColumns: ['PLU', 'PRODUCT_NAME', 'PRICE_RETAIL'],
    sampleRows: [
      ['PLU-001', '8992753001018', 'Kratingdaeng Energy Drink Botol 150ml', 'Energy Drink', 'Kratingdaeng', 'PT Asia Sejahtera Perdana', 'Btl', '7500', '7000', '6500', 'TRUE'],
      ['PLU-002', '8998866100125', 'Bimoli Minyak Goreng Klasik Pouch 2L', 'Cooking Oil', 'Bimoli', 'PT Salim Ivomas Pratama Tbk', 'Pcs', '38500', '37000', '35500', 'TRUE'],
      ['PLU-003', '8993175110010', 'ABC Sambal Asli Botol Kaca 335ml', 'Chilli Sauce', 'ABC', 'PT Heinz ABC Indonesia', 'Btl', '16500', '15500', '14200', 'TRUE'],
      ['PLU-004', '8992762001013', 'Blue Band Margarin Serbaguna Sachet 200g', 'Margarine', 'Blue Band', 'PT Upfield Indonesia', 'Sachet', '11000', '10200', '9500', 'TRUE'],
      ['PLU-005', '8991002105401', 'Teh Botol Sosro Kotak Tetra 250ml', 'Tea', 'Sosro', 'PT Sinar Sosro', 'Box', '4000', '3600', '3200', 'TRUE'],
    ],
    sampleCsv: `PLU,BARCODE,PRODUCT_NAME,CATEGORY,BRAND,MANUFACTURER,UOM,PRICE_RETAIL,PRICE_MEMBER,PRICE_WHOLESALE,VAT_INCLUDED
PLU-001,8992753001018,Kratingdaeng Energy Drink Botol 150ml,Energy Drink,Kratingdaeng,PT Asia Sejahtera Perdana,Btl,7500,7000,6500,TRUE
PLU-002,8998866100125,Bimoli Minyak Goreng Klasik Pouch 2L,Cooking Oil,Bimoli,PT Salim Ivomas Pratama Tbk,Pcs,38500,37000,35500,TRUE
PLU-003,8993175110010,ABC Sambal Asli Botol Kaca 335ml,Chilli Sauce,ABC,PT Heinz ABC Indonesia,Btl,16500,15500,14200,TRUE
PLU-004,8992762001013,Blue Band Margarin Serbaguna Sachet 200g,Margarine,Blue Band,PT Upfield Indonesia,Sachet,11000,10200,9500,TRUE
PLU-005,8991002105401,Teh Botol Sosro Kotak Tetra 250ml,Tea,Sosro,PT Sinar Sosro,Box,4000,3600,3200,TRUE`,
  },
  fnb: {
    id: 'fnb',
    label: 'F&B Resto & Kafe',
    subLabel: 'Restoran, Cafe, Coffee Shop, Fast Food',
    badge: 'F&B RESTO & KAFE',
    headers: ['Kode Menu', 'Nama Menu/Minuman', 'Kategori (Food/Beverage)', 'Harga Jual', 'Tipe Order (Dine-in/Takeaway)', 'Resep/Bahan Baku Ringkas'],
    requiredColumns: ['Kode Menu', 'Nama Menu/Minuman', 'Harga Jual'],
    sampleRows: [
      ['FNB-001', 'Nasi Goreng Wagyu Spesial', 'Food', '48000', 'Dine-In/Takeaway', 'Beras Ramos 150g, Wagyu Slice 80g, Telur Bebek, Bumbu Rempah'],
      ['FNB-002', 'Ayam Geprek Sambal Korek', 'Food', '28000', 'Dine-In/Takeaway', 'Ayam Fillet Crispy 120g, Sambal Korek Bawang, Nasi'],
      ['FNB-003', 'Kopi Susu Gula Aren JacS', 'Beverage', '22000', 'Dine-In/Takeaway', 'Espresso Double Shot, Fresh Milk 120ml, Gula Aren 25ml'],
      ['FNB-004', 'French Fries Truffle Mayo', 'Food', '25000', 'Dine-In/Takeaway', 'Kentang Beku 150g, Truffle Oil, Garlic Mayo, Parsley'],
      ['FNB-005', 'Matcha Latte Oatmilk', 'Beverage', '28000', 'Dine-In/Takeaway', 'Matcha Powder 8g, Barista Oatmilk 150ml, Simple Syrup'],
    ],
    sampleCsv: `Kode Menu,Nama Menu/Minuman,Kategori (Food/Beverage),Harga Jual,Tipe Order (Dine-in/Takeaway),Resep/Bahan Baku Ringkas
FNB-001,Nasi Goreng Wagyu Spesial,Food,48000,Dine-In/Takeaway,"Beras Ramos 150g, Wagyu Slice 80g, Telur Bebek, Bumbu Rempah"
FNB-002,Ayam Geprek Sambal Korek,Food,28000,Dine-In/Takeaway,"Ayam Fillet Crispy 120g, Sambal Korek Bawang, Nasi"
FNB-003,Kopi Susu Gula Aren JacS,Beverage,22000,Dine-In/Takeaway,"Espresso Double Shot, Fresh Milk 120ml, Gula Aren 25ml"
FNB-004,French Fries Truffle Mayo,Food,25000,Dine-In/Takeaway,"Kentang Beku 150g, Truffle Oil, Garlic Mayo, Parsley"
FNB-005,Matcha Latte Oatmilk,Beverage,28000,Dine-In/Takeaway,"Matcha Powder 8g, Barista Oatmilk 150ml, Simple Syrup"`,
  },
  pharmacy: {
    id: 'pharmacy',
    label: 'Apotek & Medis',
    subLabel: 'Apotek, Toko Obat, Alkes & Resep Dokter',
    badge: 'APOTEK & MEDIS',
    headers: ['Kode Obat', 'Nama Obat', 'Kategori', 'Satuan', 'Harga Jual', 'No Batch', 'Expired Date'],
    requiredColumns: ['Kode Obat', 'Nama Obat', 'Harga Jual'],
    sampleRows: [
      ['89920011001', 'Paracetamol 500mg Strip 10 Kaplet', 'Obat Bebas', 'Strip', '7000', 'BATCH-PCT2401', '2027-08-31'],
      ['89920011002', 'Amoxicillin 500mg Kapsul', 'Obat Keras (Resep)', 'Strip', '12500', 'BATCH-AMX2403', '2026-11-30'],
      ['89920011003', 'Betadine Antiseptic Solution 60ml', 'Obat Bebas Terbatas', 'Botol', '31000', 'BATCH-BTD2405', '2028-02-28'],
      ['89920011004', 'Vitamin C 1000mg Effervescent 10s', 'Suplemen & Vitamin', 'Tube', '49000', 'BATCH-VTC2402', '2027-05-31'],
      ['89920011005', 'Bodrex Sakit Kepala 20 Tablet', 'Obat Bebas', 'Blister', '13500', 'BATCH-BDX2408', '2027-10-15'],
    ],
    sampleCsv: `Kode Obat,Nama Obat,Kategori,Satuan,Harga Jual,No Batch,Expired Date
89920011001,Paracetamol 500mg Strip 10 Kaplet,Obat Bebas,Strip,7000,BATCH-PCT2401,2027-08-31
89920011002,Amoxicillin 500mg Kapsul,Obat Keras (Resep),Strip,12500,BATCH-AMX2403,2026-11-30
89920011003,Betadine Antiseptic Solution 60ml,Obat Bebas Terbatas,Botol,31000,BATCH-BTD2405,2028-02-28
89920011004,Vitamin C 1000mg Effervescent 10s,Suplemen & Vitamin,Tube,49000,BATCH-VTC2402,2027-05-31
89920011005,Bodrex Sakit Kepala 20 Tablet,Obat Bebas,Blister,13500,BATCH-BDX2408,2027-10-15`,
  },
  fashion: {
    id: 'fashion',
    label: 'Fashion & Butik',
    subLabel: 'Pakaian, Sepatu, Distro, Busana',
    badge: 'FASHION & BUTIK',
    headers: ['SKU', 'Nama Produk', 'Kategori', 'Varian Ukuran (S/M/L/XL)', 'Pilihan Warna', 'Harga Jual', 'Stok'],
    requiredColumns: ['SKU', 'Nama Produk', 'Harga Jual'],
    sampleRows: [
      ['FSH-OXF-M-NVY', 'Kemeja Slim Fit Oxford Pria', 'Pakaian Pria', 'M', 'Navy Blue', '159000', '30'],
      ['FSH-OXF-L-NVY', 'Kemeja Slim Fit Oxford Pria', 'Pakaian Pria', 'L', 'Navy Blue', '159000', '35'],
      ['FSH-OXF-XL-WHT', 'Kemeja Slim Fit Oxford Pria', 'Pakaian Pria', 'XL', 'Putih Bersih', '159000', '20'],
      ['FSH-DNM-32-IND', 'Celana Jeans Raw Denim 14oz', 'Celana & Denim', '32', 'Deep Indigo', '289000', '25'],
      ['FSH-HOD-L-GRY', 'Hoodie Oversized Fleece', 'Jaket & Outerwear', 'L', 'Charcoal Gray', '229000', '40'],
    ],
    sampleCsv: `SKU,Nama Produk,Kategori,Varian Ukuran (S/M/L/XL),Pilihan Warna,Harga Jual,Stok
FSH-OXF-M-NVY,Kemeja Slim Fit Oxford Pria,Pakaian Pria,M,Navy Blue,159000,30
FSH-OXF-L-NVY,Kemeja Slim Fit Oxford Pria,Pakaian Pria,L,Navy Blue,159000,35
FSH-OXF-XL-WHT,Kemeja Slim Fit Oxford Pria,Pakaian Pria,XL,Putih Bersih,159000,20
FSH-DNM-32-IND,Celana Jeans Raw Denim 14oz,Celana & Denim,32,Deep Indigo,289000,25
FSH-HOD-L-GRY,Hoodie Oversized Fleece,Jaket & Outerwear,L,Charcoal Gray,229000,40`,
  },
  gadget: {
    id: 'gadget',
    label: 'Gadget & Elektronik',
    subLabel: 'Smartphone, Laptop, Aksesoris & Garansi',
    badge: 'GADGET & ELEKTRONIK',
    headers: ['SKU', 'Nama Unit', 'Merek', 'Serial Number / IMEI', 'Masa Garansi (Bulan)', 'Harga Beli', 'Harga Jual'],
    requiredColumns: ['SKU', 'Nama Unit', 'Harga Jual'],
    sampleRows: [
      ['GDT-IP15P-128', 'Apple iPhone 15 Pro 128GB', 'Apple', '354890123456781', '12', '15200000', '18999000'],
      ['GDT-S24U-256', 'Samsung Galaxy S24 Ultra 256GB', 'Samsung', '358912345678902', '12', '16500000', '20499000'],
      ['GDT-M3PRO-512', 'MacBook Pro 14 M3 Pro 512GB', 'Apple', 'C02G1234MD6R', '12', '28000000', '33999000'],
      ['GDT-SNY-WH1000', 'Sony WH-1000XM5 Headphone', 'Sony', 'S01234567899', '12', '4100000', '5499000'],
      ['GDT-ANK-65W', 'Anker GaNPrime 65W Fast Charger', 'Anker', 'A2668G110023', '18', '420000', '650000'],
    ],
    sampleCsv: `SKU,Nama Unit,Merek,Serial Number / IMEI,Masa Garansi (Bulan),Harga Beli,Harga Jual
GDT-IP15P-128,Apple iPhone 15 Pro 128GB,Apple,354890123456781,12,15200000,18999000
GDT-S24U-256,Samsung Galaxy S24 Ultra 256GB,Samsung,358912345678902,12,16500000,20499000
GDT-M3PRO-512,MacBook Pro 14 M3 Pro 512GB,Apple,C02G1234MD6R,12,28000000,33999000
GDT-SNY-WH1000,Sony WH-1000XM5 Headphone,Sony,S01234567899,12,4100000,5499000
GDT-ANK-65W,Anker GaNPrime 65W Fast Charger,Anker,A2668G110023,18,420000,650000`,
  },
  services: {
    id: 'services',
    label: 'Jasa & Servis',
    subLabel: 'Bengkel, Salon, Laundry, Servis Elektronik',
    badge: 'JASA & SERVIS',
    headers: ['Kode Jasa', 'Nama Servis', 'Kategori', 'Tarif', 'Durasi Layanan', 'Komisi Staf'],
    requiredColumns: ['Kode Jasa', 'Nama Servis', 'Tarif'],
    sampleRows: [
      ['SRV-001', 'Ganti Oli & Tune Up Motor Matic', 'Servis Otomotif', '80000', '45 Menit', '20000'],
      ['SRV-002', 'Cuci & Cuci Kering Express 1 Hari', 'Laundry', '15000', '24 Jam', '3500'],
      ['SRV-003', 'Ganti LCD / Touchscreen iPhone', 'Servis HP', '450000', '60 Menit', '100000'],
      ['SRV-004', 'Potong Rambut Stylist Pria', 'Salon & Barbershop', '50000', '30 Menit', '15000'],
      ['SRV-005', 'Instalasi Ulang OS & Software Laptop', 'IT & Komputer', '75000', '90 Menit', '25000'],
    ],
    sampleCsv: `Kode Jasa,Nama Servis,Kategori,Tarif,Durasi Layanan,Komisi Staf
SRV-001,Ganti Oli & Tune Up Motor Matic,Servis Otomotif,80000,45 Menit,20000
SRV-002,Cuci & Cuci Kering Express 1 Hari,Laundry,15000,24 Jam,3500
SRV-003,Ganti LCD / Touchscreen iPhone,Servis HP,450000,60 Menit,100000
SRV-004,Potong Rambut Stylist Pria,Salon & Barbershop,50000,30 Menit,15000
SRV-005,Instalasi Ulang OS & Software Laptop,IT & Komputer,75000,90 Menit,25000`,
  },
};

export interface ColumnValidationReport {
  detectedModel: BusinessModelType | 'generic' | 'unknown';
  matchedHeaders: string[];
  missingRequired: string[];
  totalDataRows: number;
  isValid: boolean;
  message: string;
  previewRows: Record<string, string>[];
}

/**
 * Automatically inspects uploaded / pasted CSV text, validates header columns,
 * detects corresponding business model, and prepares preview rows without corrupting data.
 */
export function validateCsvContent(
  csvText: string,
  preferredModel?: BusinessModelType
): ColumnValidationReport {
  if (!csvText || !csvText.trim()) {
    return {
      detectedModel: 'unknown',
      matchedHeaders: [],
      missingRequired: [],
      totalDataRows: 0,
      isValid: false,
      message: 'Belum ada data CSV. Silakan unggah file atau tempel teks.',
      previewRows: [],
    };
  }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return {
      detectedModel: 'unknown',
      matchedHeaders: [],
      missingRequired: [],
      totalDataRows: 0,
      isValid: false,
      message: 'File CSV kosong.',
      previewRows: [],
    };
  }

  // Parse header
  const rawHeaderCols = lines[0].split(',').map((c) => c.replace(/^["'\s]+|["'\s]+$/g, ''));
  const normalizedHeaders = rawHeaderCols.map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Score match against all 5 models
  let bestModel: BusinessModelType = preferredModel || 'retail';
  let bestScore = -1;

  (Object.keys(BUSINESS_MODEL_TEMPLATES) as BusinessModelType[]).forEach((modelKey) => {
    const tmpl = BUSINESS_MODEL_TEMPLATES[modelKey];
    let score = 0;
    tmpl.headers.forEach((h) => {
      const norm = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalizedHeaders.some((nh) => nh.includes(norm) || norm.includes(nh))) {
        score++;
      }
    });
    // Extra boost if user explicitly preferred this model
    if (preferredModel === modelKey) {
      score += 0.5;
    }
    if (score > bestScore) {
      bestScore = score;
      bestModel = modelKey;
    }
  });

  const template = BUSINESS_MODEL_TEMPLATES[bestModel];

  // Check required columns
  const missingRequired: string[] = [];
  template.requiredColumns.forEach((req) => {
    const norm = req.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = normalizedHeaders.some((nh) => nh.includes(norm) || norm.includes(nh));
    if (!found) {
      missingRequired.push(req);
    }
  });

  const totalDataRows = Math.max(0, lines.length - 1);
  const isValid = totalDataRows > 0 && missingRequired.length === 0;

  // Build preview rows (up to 3)
  const previewRows: Record<string, string>[] = [];
  const previewLimit = Math.min(lines.length, 4);
  for (let i = 1; i < previewLimit; i++) {
    const cols = lines[i].split(',').map((c) => c.replace(/^["'\s]+|["'\s]+$/g, ''));
    const rowObj: Record<string, string> = {};
    rawHeaderCols.forEach((header, idx) => {
      rowObj[header] = cols[idx] !== undefined ? cols[idx] : '-';
    });
    previewRows.push(rowObj);
  }

  let message = '';
  if (totalDataRows === 0) {
    message = 'Hanya baris header ditemukan, tidak ada baris data produk.';
  } else if (missingRequired.length > 0) {
    message = `Peringatan: Kolom wajib hilang: [${missingRequired.join(', ')}]. Format disesuaikan otomatis dengan fallback.`;
  } else {
    message = `✓ Terverifikasi format ${template.label}: ${rawHeaderCols.length} kolom cocok, ${totalDataRows} baris siap diimpor.`;
  }

  return {
    detectedModel: bestModel,
    matchedHeaders: rawHeaderCols,
    missingRequired,
    totalDataRows,
    isValid,
    message,
    previewRows,
  };
}
