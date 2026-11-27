import {
  AttendanceRecord,
  BrandMaster,
  CanonicalBusinessSector,
  CartItem,
  CashierShift,
  CategoryMaster,
  CustomerMaster,
  Employee,
  FBMenuCosting,
  FinanceEntry,
  GoodsReceipt,
  GoodsReceiptItem,
  InvoiceDue,
  JournalEntry,
  LeaveRequest,
  PriceTier,
  Product,
  PurchaseOrder,
  PurchaseRequest,
  RecipeIngredient,
  Sale,
  StockMutation,
  SupplierMaster,
} from '../types';
import { resolveFnbMenuImageUrl } from '../utils/demoSandbox';

export interface IntegratedDemoPackageResult {
  products: Product[];
  suppliers: SupplierMaster[];
  customers: CustomerMaster[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  purchaseOrders: PurchaseOrder[];
  purchaseRequests: PurchaseRequest[];
  goodsReceipts: GoodsReceipt[];
  stockMutations: StockMutation[];
  sales: Sale[];
  cashierShifts: CashierShift[];
  financeEntries: FinanceEntry[];
  journalEntries: JournalEntry[];
  invoicesDue: InvoiceDue[];
  brands: BrandMaster[];
  categories: CategoryMaster[];
  summary: {
    productCount: number;
    bomProductCount: number;
    supplierCount: number;
    customerCount: number;
    employeeCount: number;
    attendanceCount: number;
    poCount: number;
    pendingApprovalPoCount: number;
    saleCount: number;
    journalCount: number;
    mutationCount: number;
    totalRevenue: number;
    totalHpp: number;
  };
}

export interface BuildIntegratedDemoParams {
  activeSector?: CanonicalBusinessSector | string;
  businessName?: string;
  now?: Date;
}

const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (base: Date, deltaDays: number): Date => {
  const next = new Date(base.getTime());
  next.setDate(next.getDate() + deltaDays);
  return next;
};

const makeIsoAtTime = (baseDate: Date, hours: number, minutes: number): string => {
  const d = new Date(baseDate.getTime());
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

const roundToFifty = (val: number): number => Math.round(val / 50) * 50;

const calcMultiTierPrices = (hpp: number) => ({
  retail: roundToFifty(hpp * 1.2), // +20%
  member: roundToFifty(hpp * 1.15), // +15%
  grosir: roundToFifty(hpp * 1.1), // +10%
});

interface RawProductSpec {
  id: string;
  barcode: string;
  name: string;
  category: string;
  categoryCode: number;
  brand: string;
  unit: string;
  hpp: number;
  minStock: number;
  rackLocation: string;
  supplierId: string;
  supplierName: string;
  itemType?: 'MENU_FB' | 'RETAIL' | 'RAW_MATERIAL' | 'SERVICE';
  recipe?: RecipeIngredient[];
  costing?: FBMenuCosting;
  batchNumber?: string;
  expiryDate?: string;
  description?: string;
  image?: string;
}

const getIndustryCatalog = (businessType: string): { suppliers: SupplierMaster[]; products: RawProductSpec[] } => {
  const bType = String(businessType || 'RETAIL').toUpperCase();

  const defaultSuppliers: SupplierMaster[] = [
    {
      id: 'SUP-DEMO-01',
      code: 'SUP-IDF-01',
      name: 'PT Indofood Distribusi Nusantara',
      contactPerson: 'Bpk. Gunawan Prasetyo',
      phone: '021-57958822',
      email: 'order@indofood-dist.co.id',
      address: 'Kawasan Industri Pulogadung Kav. 18, Jakarta Timur',
      paymentTerms: 'Transfer Bank / Lunas',
      activePoCount: 1,
      status: 'Active',
    },
    {
      id: 'SUP-DEMO-02',
      code: 'SUP-UNL-02',
      name: 'PT Unilever Niaga Sejahtera',
      contactPerson: 'Ibu Ratna Dewi',
      phone: '021-80827000',
      email: 'supply@unilever-niaga.co.id',
      address: 'BSD Green Office Park Kav. 3, Tangerang',
      paymentTerms: 'Tempo 30 Hari',
      activePoCount: 1,
      status: 'Active',
    },
    {
      id: 'SUP-DEMO-03',
      code: 'SUP-MYR-03',
      name: 'PT Mayora Prima Niaga',
      contactPerson: 'Bpk. Hendri Wijaya',
      phone: '021-5655320',
      email: 'b2b@mayora-prima.co.id',
      address: 'Jl. Daan Mogot KM 18, Jakarta Barat',
      paymentTerms: 'Tempo 14 Hari',
      activePoCount: 1,
      status: 'Active',
    },
    {
      id: 'SUP-DEMO-04',
      code: 'SUP-MBS-04',
      name: 'CV Mitra Bahan Segar Mandiri',
      contactPerson: 'Bpk. Fajar Nugroho',
      phone: '021-78841230',
      email: 'sales@mitrabahansegar.id',
      address: 'Jl. Raya Bogor KM 24, Jakarta Timur',
      paymentTerms: 'Tempo 14 Hari',
      activePoCount: 0,
      status: 'Active',
    },
  ];

  if (bType === 'FNB') {
    const rawMats: RawProductSpec[] = [
      { id: 'DEMO-SKU-FNB-R1', barcode: '8992001000011', name: 'Biji Kopi Arabika Gayo Premium 1Kg', category: 'Bahan Baku', categoryCode: 10, brand: 'Gayo Heritage', unit: 'Pack', hpp: 180000, minStock: 5, rackLocation: 'GUDANG-KAFE-01', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri', itemType: 'RAW_MATERIAL' },
      { id: 'DEMO-SKU-FNB-R2', barcode: '8992001000028', name: 'Susu UHT Full Cream Fresh Milk 1L', category: 'Bahan Baku', categoryCode: 11, brand: 'Greenfields', unit: 'Kotak', hpp: 22000, minStock: 15, rackLocation: 'CHILLER-FNB', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri', itemType: 'RAW_MATERIAL' },
      { id: 'DEMO-SKU-FNB-R3', barcode: '8992001000035', name: 'Sirup Gula Aren Organik 1L', category: 'Bahan Baku', categoryCode: 12, brand: 'Aren Jaya', unit: 'Botol', hpp: 60000, minStock: 6, rackLocation: 'RAK-BAR-01', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga', itemType: 'RAW_MATERIAL' },
    ];

    const bomRecipe: RecipeIngredient[] = [
      { ingredientId: 'DEMO-SKU-FNB-R1', name: 'Biji Kopi Arabika Gayo Premium 1Kg', ingredientName: 'Biji Kopi Arabika Gayo Premium 1Kg', qty: 20, portionQty: 20, unit: 'gram', costPerUnit: 180, subtotalCost: 3600 },
      { ingredientId: 'DEMO-SKU-FNB-R2', name: 'Susu UHT Full Cream Fresh Milk 1L', ingredientName: 'Susu UHT Full Cream Fresh Milk 1L', qty: 150, portionQty: 150, unit: 'ml', costPerUnit: 22, subtotalCost: 3300 },
      { ingredientId: 'DEMO-SKU-FNB-R3', name: 'Sirup Gula Aren Organik 1L', ingredientName: 'Sirup Gula Aren Organik 1L', qty: 35, portionQty: 35, unit: 'ml', costPerUnit: 60, subtotalCost: 2100 },
    ];
    const bomHpp = 12000;
    const bomPrices = calcMultiTierPrices(bomHpp);
    const bomCosting: FBMenuCosting = {
      recipe: bomRecipe.map((r) => ({ ingredientId: r.ingredientId, ingredientName: r.name, portionQty: r.qty, unit: r.unit, costPerUnit: r.costPerUnit, subtotalCost: r.subtotalCost, name: r.name, qty: r.qty })),
      wastePercentage: 0,
      rawMaterialHPP: 9000,
      rawMaterialCost: 9000,
      operationalCost: 3000,
      totalCost: bomHpp,
      targetMarginPercent: 20,
      calculatedSellingPrice: bomPrices.retail,
      recommendedPrice: bomPrices.retail,
      actualPrice: bomPrices.retail,
    };

    const fnbProducts: RawProductSpec[] = [
      ...rawMats,
      { id: 'DEMO-SKU-FNB-01', barcode: '8992001000103', name: 'Es Kopi Susu Gula Aren Signature', category: 'Minuman Kopi', categoryCode: 1, brand: 'Kafe Nusantara', unit: 'Cup', hpp: bomHpp, minStock: 20, rackLocation: 'BAR-01', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri', itemType: 'MENU_FB', recipe: bomRecipe, costing: bomCosting, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80' },
      { id: 'DEMO-SKU-FNB-02', barcode: '8992001000110', name: 'Nasi Goreng Spesial Seafood', category: 'Makanan Utama', categoryCode: 2, brand: 'Resto Rasa', unit: 'Porsi', hpp: 18000, minStock: 10, rackLocation: 'KITCHEN-01', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri', itemType: 'MENU_FB', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80' },
      { id: 'DEMO-SKU-FNB-03', barcode: '8992001000127', name: 'Ayam Bakar Madu Special', category: 'Makanan Utama', categoryCode: 2, brand: 'Resto Rasa', unit: 'Porsi', hpp: 21000, minStock: 10, rackLocation: 'KITCHEN-02', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri', itemType: 'MENU_FB', image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=400&q=80' },
      { id: 'DEMO-SKU-FNB-04', barcode: '8992001000134', name: 'Mie Ayam Jamur Bakso', category: 'Mi & Bakso', categoryCode: 3, brand: 'Resto Rasa', unit: 'Porsi', hpp: 14000, minStock: 15, rackLocation: 'KITCHEN-03', supplierId: 'SUP-DEMO-01', supplierName: 'PT Indofood Distribusi Nusantara', itemType: 'MENU_FB', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80' },
      { id: 'DEMO-SKU-FNB-05', barcode: '8992001000141', name: 'Es Teh Manis Melati', category: 'Minuman Segar', categoryCode: 1, brand: 'Kafe Nusantara', unit: 'Gelas', hpp: 3000, minStock: 30, rackLocation: 'BAR-02', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga', itemType: 'MENU_FB', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80' },
      { id: 'DEMO-SKU-FNB-06', barcode: '8992001000158', name: 'Juice Alpukat Alpukat Kerok', category: 'Juice Buah', categoryCode: 1, brand: 'Kafe Nusantara', unit: 'Glass', hpp: 10000, minStock: 15, rackLocation: 'BAR-03', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri', itemType: 'MENU_FB', image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=400&q=80' },
      { id: 'DEMO-SKU-FNB-07', barcode: '8992001000165', name: 'Pisang Goreng Crispy Keju Susu', category: 'Camilan', categoryCode: 4, brand: 'Resto Rasa', unit: 'Porsi', hpp: 8500, minStock: 15, rackLocation: 'KITCHEN-04', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri', itemType: 'MENU_FB', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80' },
      { id: 'DEMO-SKU-FNB-08', barcode: '8992001000172', name: 'Soto Ayam Lamongan Koya', category: 'Sup & Soto', categoryCode: 2, brand: 'Resto Rasa', unit: 'Mangkok', hpp: 16000, minStock: 12, rackLocation: 'KITCHEN-05', supplierId: 'SUP-DEMO-01', supplierName: 'PT Indofood Distribusi Nusantara', itemType: 'MENU_FB', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=400&q=80' },
      { id: 'DEMO-SKU-FNB-09', barcode: '8992001000189', name: 'Lemon Tea Hangat / Dingin', category: 'Minuman Segar', categoryCode: 1, brand: 'Kafe Nusantara', unit: 'Cup', hpp: 5000, minStock: 20, rackLocation: 'BAR-04', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga', itemType: 'MENU_FB', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80' },
      { id: 'DEMO-SKU-FNB-10', barcode: '8992001000196', name: 'Kerupuk Udang Special (Toples)', category: 'Pelengkap', categoryCode: 4, brand: 'Resto Rasa', unit: 'Toples', hpp: 12000, minStock: 10, rackLocation: 'RAK-MEJA-01', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga', itemType: 'MENU_FB', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&q=80' },
    ];
    return { suppliers: defaultSuppliers, products: fnbProducts };
  }

  if (bType === 'PHARMACY') {
    const pharmaProducts: RawProductSpec[] = [
      { id: 'DEMO-SKU-PH-01', barcode: '8993001000015', name: 'Paracetamol 500mg Tablet (Strip 10)', category: 'Analgesik', categoryCode: 30, brand: 'Kimia Farma', unit: 'Strip', hpp: 4500, minStock: 30, rackLocation: 'ETALASE-A1', supplierId: 'SUP-DEMO-01', supplierName: 'PT Indofood Distribusi Nusantara', batchNumber: 'BATCH-PC-901', expiryDate: '2028-12-31' },
      { id: 'DEMO-SKU-PH-02', barcode: '8993001000022', name: 'Vitamin C 1000mg Effervescent (Tube 10)', category: 'Suplemen', categoryCode: 31, brand: 'Redoxon', unit: 'Tube', hpp: 38000, minStock: 15, rackLocation: 'ETALASE-A2', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', batchNumber: 'BATCH-VC-802', expiryDate: '2027-06-30' },
      { id: 'DEMO-SKU-PH-03', barcode: '8993001000039', name: 'Amoxicillin 500mg Kapsul (Box 100)', category: 'Antibiotik', categoryCode: 30, brand: 'Kalbe Farma', unit: 'Box', hpp: 125000, minStock: 10, rackLocation: 'RAK-OBAT-Keras', supplierId: 'SUP-DEMO-01', supplierName: 'PT Indofood Distribusi Nusantara', batchNumber: 'BATCH-AMX-441', expiryDate: '2027-10-15' },
      { id: 'DEMO-SKU-PH-04', barcode: '8993001000046', name: 'Ibuprofen 400mg Tablet (Strip 10)', category: 'Anti-Inflamasi', categoryCode: 30, brand: 'Sanbe Farma', unit: 'Strip', hpp: 6500, minStock: 25, rackLocation: 'ETALASE-A3', supplierId: 'SUP-DEMO-01', supplierName: 'PT Indofood Distribusi Nusantara', batchNumber: 'BATCH-IBU-332', expiryDate: '2028-04-20' },
      { id: 'DEMO-SKU-PH-05', barcode: '8993001000053', name: 'Antasida Doen Tablet Kunyah (Strip 10)', category: 'Lambung', categoryCode: 30, brand: 'Dexa Medica', unit: 'Strip', hpp: 3500, minStock: 30, rackLocation: 'ETALASE-A4', supplierId: 'SUP-DEMO-01', supplierName: 'PT Indofood Distribusi Nusantara', batchNumber: 'BATCH-ANT-119', expiryDate: '2028-09-10' },
      { id: 'DEMO-SKU-PH-06', barcode: '8993001000060', name: 'Minyak Kayu Putih Aromatherapy 60ml', category: 'P3K & Herbal', categoryCode: 32, brand: 'Cap Lang', unit: 'Botol', hpp: 22000, minStock: 20, rackLocation: 'ETALASE-B1', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', batchNumber: 'BATCH-MKP-772', expiryDate: '2029-01-01' },
      { id: 'DEMO-SKU-PH-07', barcode: '8993001000077', name: 'Betadine Antiseptik Luka 30ml', category: 'P3K', categoryCode: 32, brand: 'Mahakam Beta Farma', unit: 'Botol', hpp: 18500, minStock: 15, rackLocation: 'ETALASE-B2', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', batchNumber: 'BATCH-BET-554', expiryDate: '2028-11-30' },
      { id: 'DEMO-SKU-PH-08', barcode: '8993001000084', name: 'Sanmol Sirup Anak 60ml', category: 'Anak', categoryCode: 30, brand: 'Sanbe Farma', unit: 'Botol', hpp: 19000, minStock: 15, rackLocation: 'ETALASE-C1', supplierId: 'SUP-DEMO-01', supplierName: 'PT Indofood Distribusi Nusantara', batchNumber: 'BATCH-SAN-221', expiryDate: '2027-08-14' },
      { id: 'DEMO-SKU-PH-09', barcode: '8993001000091', name: 'Tolak Angin Cair Herbal Box (Isi 12 Sachet)', category: 'Herbal', categoryCode: 32, brand: 'Sido Muncul', unit: 'Box', hpp: 42000, minStock: 20, rackLocation: 'ETALASE-C2', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga', batchNumber: 'BATCH-TA-663', expiryDate: '2028-05-18' },
      { id: 'DEMO-SKU-PH-10', barcode: '8993001000107', name: 'Masker Medis 3Ply Earloop (Box 50pcs)', category: 'Alat Kesehatan', categoryCode: 33, brand: 'Sensi', unit: 'Box', hpp: 32000, minStock: 25, rackLocation: 'ALKES-01', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri', batchNumber: 'BATCH-MSK-990', expiryDate: '2030-01-01' },
      { id: 'DEMO-SKU-PH-11', barcode: '8993001000114', name: 'Termometer Digital LCD Clinical', category: 'Alat Kesehatan', categoryCode: 33, brand: 'Omron', unit: 'Pcs', hpp: 45000, minStock: 8, rackLocation: 'ALKES-02', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri', batchNumber: 'BATCH-TRM-012', expiryDate: '2032-12-31' },
      { id: 'DEMO-SKU-PH-12', barcode: '8993001000121', name: 'Perban Elastis Crepe Bandage 3 Inch', category: 'P3K', categoryCode: 32, brand: 'OneMed', unit: 'Roll', hpp: 8500, minStock: 20, rackLocation: 'ETALASE-B3', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri', batchNumber: 'BATCH-PRB-409', expiryDate: '2031-06-30' },
      { id: 'DEMO-SKU-PH-13', barcode: '8993001000138', name: 'Kasa Steril Kotak (Pack 16 lembar)', category: 'P3K', categoryCode: 32, brand: 'OneMed', unit: 'Pack', hpp: 5500, minStock: 25, rackLocation: 'ETALASE-B4', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri', batchNumber: 'BATCH-KSA-311', expiryDate: '2031-09-15' },
      { id: 'DEMO-SKU-PH-14', barcode: '8993001000145', name: 'Salep Kulit 88 Ganda 6g', category: 'Topikal', categoryCode: 30, brand: 'Meiji', unit: 'Pot', hpp: 11000, minStock: 15, rackLocation: 'ETALASE-A5', supplierId: 'SUP-DEMO-01', supplierName: 'PT Indofood Distribusi Nusantara', batchNumber: 'BATCH-SLP-882', expiryDate: '2028-10-30' },
      { id: 'DEMO-SKU-PH-15', barcode: '8993001000152', name: 'Oskadon Extra Analgesik (Strip 4)', category: 'Analgesik', categoryCode: 30, brand: 'Pyridam', unit: 'Strip', hpp: 3000, minStock: 40, rackLocation: 'ETALASE-A6', supplierId: 'SUP-DEMO-01', supplierName: 'PT Indofood Distribusi Nusantara', batchNumber: 'BATCH-OSK-123', expiryDate: '2028-12-01' },
    ];
    return { suppliers: defaultSuppliers, products: pharmaProducts };
  }

  if (bType === 'WORKSHOP') {
    const workshopProducts: RawProductSpec[] = [
      { id: 'DEMO-SKU-WK-01', barcode: '8994001000012', name: 'Jasa Servis Ringan / Tune Up Mesin', category: 'Jasa Servis', categoryCode: 40, brand: 'Bengkel Pro', unit: 'Paket', hpp: 50000, minStock: 99, rackLocation: 'WORKSHOP-BAY-1', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-WK-02', barcode: '8994001000029', name: 'Jasa Ganti Oli Mesin & Filter', category: 'Jasa Servis', categoryCode: 40, brand: 'Bengkel Pro', unit: 'Jasa', hpp: 20000, minStock: 99, rackLocation: 'WORKSHOP-BAY-2', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-WK-03', barcode: '8994001000036', name: 'Oli Mesin Shell Helix HX7 10W-40 1L', category: 'Oli & Pelumas', categoryCode: 41, brand: 'Shell', unit: 'Botol', hpp: 85000, minStock: 15, rackLocation: 'RAK-OLI-01', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri' },
      { id: 'DEMO-SKU-WK-04', barcode: '8994001000043', name: 'Filter Oli Mesin Avanza / Xenia / Rush', category: 'Sparepart', categoryCode: 42, brand: 'Sakura', unit: 'Pcs', hpp: 32000, minStock: 12, rackLocation: 'RAK-PART-01', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri' },
      { id: 'DEMO-SKU-WK-05', barcode: '8994001000050', name: 'Kampas Rem Depan Brio / Jazz', category: 'Sparepart', categoryCode: 42, brand: 'Bendix', unit: 'Set', hpp: 175000, minStock: 8, rackLocation: 'RAK-PART-02', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri' },
      { id: 'DEMO-SKU-WK-06', barcode: '8994001000067', name: 'Busi NGK Iridium IX Spark Plug', category: 'Sparepart', categoryCode: 42, brand: 'NGK', unit: 'Pcs', hpp: 45000, minStock: 20, rackLocation: 'RAK-PART-03', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri' },
      { id: 'DEMO-SKU-WK-07', barcode: '8994001000074', name: 'Bohlam Lampu Depan Halogen H4 12V', category: 'Aksesori', categoryCode: 43, brand: 'Philips', unit: 'Pcs', hpp: 38000, minStock: 10, rackLocation: 'RAK-PART-04', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri' },
      { id: 'DEMO-SKU-WK-08', barcode: '8994001000081', name: 'Cairan Coolant Radiator Premium 1L', category: 'Cairan', categoryCode: 41, brand: 'Prestone', unit: 'Botol', hpp: 42000, minStock: 10, rackLocation: 'RAK-OLI-02', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri' },
      { id: 'DEMO-SKU-WK-09', barcode: '8994001000098', name: 'Minyak Rem DOT 4 Brake Fluid 300ml', category: 'Cairan', categoryCode: 41, brand: 'Prestone', unit: 'Botol', hpp: 28000, minStock: 10, rackLocation: 'RAK-OLI-03', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri' },
      { id: 'DEMO-SKU-WK-10', barcode: '8994001000104', name: 'Jasa Balancing Ban & Spoor Roda', category: 'Jasa Servis', categoryCode: 40, brand: 'Bengkel Pro', unit: 'Paket', hpp: 75000, minStock: 99, rackLocation: 'WORKSHOP-BAY-3', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-WK-11', barcode: '8994001000111', name: 'V-Belt Fan Belt Matic Beat / Vario', category: 'Sparepart', categoryCode: 42, brand: 'Mitsuboshi', unit: 'Pcs', hpp: 65000, minStock: 8, rackLocation: 'RAK-PART-05', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri' },
      { id: 'DEMO-SKU-WK-12', barcode: '8994001000128', name: 'Aki Kering Maintenance Free GS Astra GTZ5S', category: 'Sparepart', categoryCode: 42, brand: 'GS Astra', unit: 'Pcs', hpp: 230000, minStock: 6, rackLocation: 'RAK-AKU-01', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri' },
      { id: 'DEMO-SKU-WK-13', barcode: '8994001000135', name: 'Kampas Rem Belakang Tromol', category: 'Sparepart', categoryCode: 42, brand: 'Bendix', unit: 'Set', hpp: 120000, minStock: 8, rackLocation: 'RAK-PART-06', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri' },
      { id: 'DEMO-SKU-WK-14', barcode: '8994001000142', name: 'Jasa Overhaul / Turun Mesin Ringan', category: 'Jasa Servis', categoryCode: 40, brand: 'Bengkel Pro', unit: 'Paket', hpp: 350000, minStock: 99, rackLocation: 'WORKSHOP-BAY-4', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-WK-15', barcode: '8994001000159', name: 'Pembersih Injektor Carbon Cleaner Spray', category: 'Cairan', categoryCode: 41, brand: '3M', unit: 'Kaleng', hpp: 55000, minStock: 12, rackLocation: 'RAK-OLI-04', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri' },
    ];
    return { suppliers: defaultSuppliers, products: workshopProducts };
  }

  if (bType === 'SALON') {
    const salonProducts: RawProductSpec[] = [
      { id: 'DEMO-SKU-SL-01', barcode: '8995001000019', name: 'Paket Gentlemen Haircut & Hairwash', category: 'Jasa Salon', categoryCode: 50, brand: 'Salon Pro', unit: 'Sesi', hpp: 30000, minStock: 99, rackLocation: 'KURSI-01', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-SL-02', barcode: '8995001000026', name: 'Layanan Pewarnaan Rambut (Hair Coloring)', category: 'Jasa Salon', categoryCode: 50, brand: 'Salon Pro', unit: 'Sesi', hpp: 95000, minStock: 99, rackLocation: 'KURSI-02', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-SL-03', barcode: '8995001000033', name: 'Smoothing / Rebonding Rambut Premium', category: 'Jasa Salon', categoryCode: 50, brand: 'Salon Pro', unit: 'Sesi', hpp: 150000, minStock: 99, rackLocation: 'KURSI-03', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-SL-04', barcode: '8995001000040', name: 'Creambath Ginseng Tradisional 60 Menit', category: 'Perawatan', categoryCode: 51, brand: 'Loreal', unit: 'Sesi', hpp: 40000, minStock: 99, rackLocation: 'KURSI-04', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-SL-05', barcode: '8995001000057', name: 'Hair Mask Keratin Treatment', category: 'Perawatan', categoryCode: 51, brand: 'Matrix', unit: 'Sesi', hpp: 65000, minStock: 99, rackLocation: 'KURSI-05', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-SL-06', barcode: '8995001000064', name: 'Pomade Rambut Waterbased Premium 100g', category: 'Produk Ritel', categoryCode: 52, brand: 'Suavecito', unit: 'Jar', hpp: 65000, minStock: 10, rackLocation: 'ETALASE-SL-1', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-SL-07', barcode: '8995001000071', name: 'Vitamin Rambut Spray Hair Serum 100ml', category: 'Produk Ritel', categoryCode: 52, brand: 'Ellips', unit: 'Botol', hpp: 28000, minStock: 15, rackLocation: 'ETALASE-SL-2', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-SL-08', barcode: '8995001000088', name: 'Minyak Kemiri Bakar Penumbuh Rambut 60ml', category: 'Produk Ritel', categoryCode: 52, brand: 'Ratu Kemiri', unit: 'Botol', hpp: 32000, minStock: 10, rackLocation: 'ETALASE-SL-3', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri' },
      { id: 'DEMO-SKU-SL-09', barcode: '8995001000095', name: 'Shampo Salon Profesional Anti Ketombe 500ml', category: 'Produk Ritel', categoryCode: 52, brand: 'Schwarzkopf', unit: 'Botol', hpp: 110000, minStock: 8, rackLocation: 'ETALASE-SL-4', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-SL-10', barcode: '8995001000101', name: 'Jasa Cukur Jenggot & Styling Mustache', category: 'Jasa Salon', categoryCode: 50, brand: 'Salon Pro', unit: 'Sesi', hpp: 15000, minStock: 99, rackLocation: 'KURSI-01', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-SL-11', barcode: '8995001000118', name: 'Paket Facial Wajah Glowing & Acnes Treatment', category: 'Perawatan', categoryCode: 51, brand: 'Salon Pro', unit: 'Sesi', hpp: 85000, minStock: 99, rackLocation: 'ROOM-FACIAL', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-SL-12', barcode: '8995001000125', name: 'Manicure & Pedicure Nail Care Set', category: 'Perawatan', categoryCode: 51, brand: 'Salon Pro', unit: 'Sesi', hpp: 75000, minStock: 99, rackLocation: 'ROOM-NAIL', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-SL-13', barcode: '8995001000132', name: 'Hair Tonic Anti Hair Fall 150ml', category: 'Produk Ritel', categoryCode: 52, brand: 'Natur', unit: 'Botol', hpp: 35000, minStock: 12, rackLocation: 'ETALASE-SL-5', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-SL-14', barcode: '8995001000149', name: 'Jasa Cukur Rambut Anak (Kids Haircut)', category: 'Jasa Salon', categoryCode: 50, brand: 'Salon Pro', unit: 'Sesi', hpp: 25000, minStock: 99, rackLocation: 'KURSI-KIDS', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-SL-15', barcode: '8995001000156', name: 'Hair Styling Wax Matte Finish 80g', category: 'Produk Ritel', categoryCode: 52, brand: 'Gatsby', unit: 'Jar', hpp: 22000, minStock: 15, rackLocation: 'ETALASE-SL-6', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
    ];
    return { suppliers: defaultSuppliers, products: salonProducts };
  }

  if (bType === 'FASHION') {
    const fashionProducts: RawProductSpec[] = [
      { id: 'DEMO-SKU-FS-01', barcode: '8996001000016', name: 'Kemeja Flanel Casual Pria (Navy - Size L)', category: 'Kemeja', categoryCode: 60, brand: 'Eiger / Arrow', unit: 'Pcs', hpp: 115000, minStock: 10, rackLocation: 'RAK-FS-01', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-FS-02', barcode: '8996001000023', name: 'Celana Chinos Slim Fit Pria (Khaki - Size 32)', category: 'Celana', categoryCode: 61, brand: 'The Executive', unit: 'Pcs', hpp: 145000, minStock: 8, rackLocation: 'RAK-FS-02', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-FS-03', barcode: '8996001000030', name: 'Dress Pesta Wanita Elegant (Maroon - Size M)', category: 'Dress', categoryCode: 62, brand: 'Zalora Collection', unit: 'Pcs', hpp: 195000, minStock: 6, rackLocation: 'RAK-FS-03', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-FS-04', barcode: '8996001000047', name: 'Kaos Polos Cotton Combed 30s (Black - Size L)', category: 'Kaos', categoryCode: 60, brand: 'Uniqlo Basic', unit: 'Pcs', hpp: 45000, minStock: 25, rackLocation: 'RAK-FS-04', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-FS-05', barcode: '8996001000054', name: 'Jaket Bomber Unisex Waterproof (Army Green)', category: 'Jaket', categoryCode: 63, brand: 'Erigo', unit: 'Pcs', hpp: 185000, minStock: 8, rackLocation: 'RAK-FS-05', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-FS-06', barcode: '8996001000061', name: 'Hijab Voal Premium Voile Lasercut (Nude)', category: 'Hijab', categoryCode: 64, brand: 'Zoya', unit: 'Pcs', hpp: 35000, minStock: 20, rackLocation: 'RAK-FS-06', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-FS-07', barcode: '8996001000078', name: 'Blouse Batik Modern Wanita (Motif Parang)', category: 'Batik', categoryCode: 62, brand: 'Batik Keris', unit: 'Pcs', hpp: 125000, minStock: 8, rackLocation: 'RAK-FS-07', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-FS-08', barcode: '8996001000085', name: 'Celana Jeans Denim Pria Regular (Blue - 32)', category: 'Celana', categoryCode: 61, brand: 'Levis 501', unit: 'Pcs', hpp: 220000, minStock: 6, rackLocation: 'RAK-FS-08', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-FS-09', barcode: '8996001000092', name: 'Rok Panjang Pleated Skirt Wanita (Cream)', category: 'Rok', categoryCode: 62, brand: 'H&M', unit: 'Pcs', hpp: 95000, minStock: 10, rackLocation: 'RAK-FS-09', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-FS-10', barcode: '8996001000108', name: 'Cardigan Rajut Oversized Wanita (Sage Green)', category: 'Outerwear', categoryCode: 63, brand: 'Stitch & Soul', unit: 'Pcs', hpp: 110000, minStock: 10, rackLocation: 'RAK-FS-10', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-FS-11', barcode: '8996001000115', name: 'Sweater Hoodie Fleece Cotton (Grey - L)', category: 'Hoodie', categoryCode: 63, brand: 'Erigo', unit: 'Pcs', hpp: 135000, minStock: 10, rackLocation: 'RAK-FS-11', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-FS-12', barcode: '8996001000122', name: 'Sepatu Sneakers Casual Pria (White - 41)', category: 'Alas Kaki', categoryCode: 65, brand: 'Compass', unit: 'Pasang', hpp: 250000, minStock: 6, rackLocation: 'RAK-SHOES-1', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-FS-13', barcode: '8996001000139', name: 'Tas Selempang Kulit Sapi Asli (Dark Brown)', category: 'Tas', categoryCode: 66, brand: 'Saddle Leather', unit: 'Pcs', hpp: 280000, minStock: 5, rackLocation: 'RAK-BAG-1', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-FS-14', barcode: '8996001000146', name: 'Sabuk Kulit Pria Formal Automatic Buckle', category: 'Aksesori', categoryCode: 67, brand: 'Bally Style', unit: 'Pcs', hpp: 65000, minStock: 12, rackLocation: 'RAK-ACC-1', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-FS-15', barcode: '8996001000153', name: 'Topi Baseball Cap Embroidered Logo', category: 'Aksesori', categoryCode: 67, brand: 'New Era', unit: 'Pcs', hpp: 45000, minStock: 15, rackLocation: 'RAK-ACC-2', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
    ];
    return { suppliers: defaultSuppliers, products: fashionProducts };
  }

  if (bType === 'CONSTRUCTION') {
    const constSuppliers: SupplierMaster[] = [
      { id: 'SUP-DEMO-01', code: 'SUP-SEM-01', name: 'PT Semen Indonesia (Persero) Tbk', contactPerson: 'Bpk. Hartono', phone: '021-5261122', email: 'order@semenindonesia.co.id', address: 'Gedung Menara Semen, Jakarta Selatan', paymentTerms: 'Tempo 30 Hari', activePoCount: 1, status: 'Active' },
      { id: 'SUP-DEMO-02', code: 'SUP-BSN-02', name: 'PT Krakatau Steel (Persero) Tbk', contactPerson: 'Ibu Siska Melati', phone: '0254-391020', email: 'b2b@krakatausteel.com', address: 'Kawasan Industri Cilegon, Banten', paymentTerms: 'Tempo 30 Hari', activePoCount: 1, status: 'Active' },
      { id: 'SUP-DEMO-03', code: 'SUP-DUL-03', name: 'PT ICI Paints Indonesia (Dulux)', contactPerson: 'Bpk. Yudi Santoso', phone: '021-88390000', email: 'sales@dulux.co.id', address: 'Kawasan Industri MM2100 Cikarang', paymentTerms: 'Tempo 14 Hari', activePoCount: 1, status: 'Active' },
      { id: 'SUP-DEMO-04', code: 'SUP-MAT-04', name: 'CV Sumber Alam Pasir & Batu', contactPerson: 'Bpk. Slamet Riyadi', phone: '021-87712345', email: 'alam@pasirbatu.id', address: 'Jl. Raya Parung KM 19, Bogor', paymentTerms: 'Lunas', activePoCount: 0, status: 'Active' },
    ];
    const constProducts: RawProductSpec[] = [
      { id: 'DEMO-SKU-CN-01', barcode: '8997001000013', name: 'Semen Gresik Portland 40kg', category: 'Semen & Mortar', categoryCode: 70, brand: 'Semen Gresik', unit: 'Sak', hpp: 58000, minStock: 50, rackLocation: 'YARD-01', supplierId: 'SUP-DEMO-01', supplierName: 'PT Semen Indonesia (Persero) Tbk' },
      { id: 'DEMO-SKU-CN-02', barcode: '8997001000020', name: 'Besi Beton Polos SNI 10mm x 12m', category: 'Besi & Baja', categoryCode: 71, brand: 'Krakatau Steel', unit: 'Batang', hpp: 68000, minStock: 40, rackLocation: 'YARD-02', supplierId: 'SUP-DEMO-02', supplierName: 'PT Krakatau Steel (Persero) Tbk' },
      { id: 'DEMO-SKU-CN-03', barcode: '8997001000037', name: 'Pasir Pasang Lumajang Berkualitas', category: 'Agregat', categoryCode: 72, brand: 'Lokal Premium', unit: 'm³', hpp: 280000, minStock: 10, rackLocation: 'YARD-PASIR', supplierId: 'SUP-DEMO-04', supplierName: 'CV Sumber Alam Pasir & Batu' },
      { id: 'DEMO-SKU-CN-04', barcode: '8997001000044', name: 'Batu Split Pecah Mesin 2/3', category: 'Agregat', categoryCode: 72, brand: 'Lokal Premium', unit: 'm³', hpp: 260000, minStock: 10, rackLocation: 'YARD-BATU', supplierId: 'SUP-DEMO-04', supplierName: 'CV Sumber Alam Pasir & Batu' },
      { id: 'DEMO-SKU-CN-05', barcode: '8997001000051', name: 'Bata Merah Bakar Oven Press (Pcs)', category: 'Batu Bata', categoryCode: 73, brand: 'Lokal Pres', unit: 'Pcs', hpp: 750, minStock: 1000, rackLocation: 'YARD-BATA', supplierId: 'SUP-DEMO-04', supplierName: 'CV Sumber Alam Pasir & Batu' },
      { id: 'DEMO-SKU-CN-06', barcode: '8997001000068', name: 'Pipa PVC Wavin D 3 Inch AW', category: 'Pipa & Fitting', categoryCode: 74, brand: 'Rucika / Wavin', unit: 'Batang', hpp: 95000, minStock: 15, rackLocation: 'RAK-PIPA-1', supplierId: 'SUP-DEMO-01', supplierName: 'PT Semen Indonesia (Persero) Tbk' },
      { id: 'DEMO-SKU-CN-07', barcode: '8997001000075', name: 'Paku Kayu Campur Berbagai Ukuran 5cm-12cm', category: 'Paku & Baut', categoryCode: 75, brand: 'Globe', unit: 'Kg', hpp: 18500, minStock: 25, rackLocation: 'RAK-PAKU-1', supplierId: 'SUP-DEMO-01', supplierName: 'PT Semen Indonesia (Persero) Tbk' },
      { id: 'DEMO-SKU-CN-08', barcode: '8997001000082', name: 'Cat Tembok Eksterior Dulux Weathershield 5Kg', category: 'Pengecatan', categoryCode: 76, brand: 'Dulux', unit: 'Pail', hpp: 245000, minStock: 8, rackLocation: 'RAK-CAT-01', supplierId: 'SUP-DEMO-03', supplierName: 'PT ICI Paints Indonesia (Dulux)' },
      { id: 'DEMO-SKU-CN-09', barcode: '8997001000099', name: 'Kayu Meranti Kaso 5x10 x 4m', category: 'Kayu & Bambu', categoryCode: 77, brand: 'Borneo Meranti', unit: 'Batang', hpp: 45000, minStock: 30, rackLocation: 'YARD-KAYU', supplierId: 'SUP-DEMO-04', supplierName: 'CV Sumber Alam Pasir & Batu' },
      { id: 'DEMO-SKU-CN-10', barcode: '8997001000105', name: 'Seng Gelombang Galvalum 0.3mm x 1.8m', category: 'Atap', categoryCode: 78, brand: 'Gajah Suria', unit: 'Lembar', hpp: 52000, minStock: 20, rackLocation: 'YARD-ATAP', supplierId: 'SUP-DEMO-02', supplierName: 'PT Krakatau Steel (Persero) Tbk' },
      { id: 'DEMO-SKU-CN-11', barcode: '8997001000112', name: 'Keramik Lantai Polos 40x40 White (Dus 1m²)', category: 'Keramik', categoryCode: 79, brand: 'Mulia Tiles', unit: 'Dus', hpp: 52000, minStock: 25, rackLocation: 'RAK-KER-01', supplierId: 'SUP-DEMO-03', supplierName: 'PT ICI Paints Indonesia (Dulux)' },
      { id: 'DEMO-SKU-CN-12', barcode: '8997001000129', name: 'Gypsum Board Jayaboard 9mm x 120x240', category: 'Plafond', categoryCode: 77, brand: 'Jayaboard', unit: 'Lembar', hpp: 68000, minStock: 15, rackLocation: 'RAK-GYP-01', supplierId: 'SUP-DEMO-03', supplierName: 'PT ICI Paints Indonesia (Dulux)' },
      { id: 'DEMO-SKU-CN-13', barcode: '8997001000136', name: 'Kawat Bendrat Beton (Bendrat Roll 20Kg)', category: 'Paku & Baut', categoryCode: 75, brand: 'Bandung', unit: 'Roll', hpp: 320000, minStock: 5, rackLocation: 'RAK-PAKU-2', supplierId: 'SUP-DEMO-02', supplierName: 'PT Krakatau Steel (Persero) Tbk' },
      { id: 'DEMO-SKU-CN-14', barcode: '8997001000143', name: 'Lem Pox Epoksi Resin & Hardener Set', category: 'Perekat', categoryCode: 76, brand: 'Pox Steel', unit: 'Set', hpp: 28000, minStock: 15, rackLocation: 'RAK-LEM-01', supplierId: 'SUP-DEMO-03', supplierName: 'PT ICI Paints Indonesia (Dulux)' },
      { id: 'DEMO-SKU-CN-15', barcode: '8997001000150', name: 'Kran Air Angsa Flexible Stainless Steel', category: 'Saniter', categoryCode: 74, brand: 'Wasser', unit: 'Pcs', hpp: 65000, minStock: 10, rackLocation: 'RAK-PIPE-2', supplierId: 'SUP-DEMO-01', supplierName: 'PT Semen Indonesia (Persero) Tbk' },
    ];
    return { suppliers: constSuppliers, products: constProducts };
  }

  if (bType === 'ELECTRONICS') {
    const elecProducts: RawProductSpec[] = [
      { id: 'DEMO-SKU-EL-01', barcode: '8998001000010', name: 'Kabel Data Type-C Fast Charging 3A 1m', category: 'Aksesori HP', categoryCode: 80, brand: 'Anker', unit: 'Pcs', hpp: 45000, minStock: 15, rackLocation: 'ETALASE-EL-1', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga', description: 'Garansi Resmi 18 Bulan' },
      { id: 'DEMO-SKU-EL-02', barcode: '8998001000027', name: 'TWS Wireless Earbuds Bluetooth 5.3 Pro', category: 'Audio', categoryCode: 81, brand: 'Baseus', unit: 'Pcs', hpp: 185000, minStock: 10, rackLocation: 'ETALASE-EL-2', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga', description: 'Garansi Resmi 1 Tahun' },
      { id: 'DEMO-SKU-EL-03', barcode: '8998001000034', name: 'Powerbank 10000mAh Slim PD 22.5W', category: 'Power', categoryCode: 80, brand: 'Xiaomi / Redmi', unit: 'Pcs', hpp: 160000, minStock: 10, rackLocation: 'ETALASE-EL-3', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga', description: 'Garansi Resmi 1 Tahun' },
      { id: 'DEMO-SKU-EL-04', barcode: '8998001000041', name: 'Charger Adapter 20W USB-C Power Delivery', category: 'Power', categoryCode: 80, brand: 'Anker', unit: 'Pcs', hpp: 95000, minStock: 12, rackLocation: 'ETALASE-EL-4', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga', description: 'Garansi Resmi 18 Bulan' },
      { id: 'DEMO-SKU-EL-05', barcode: '8998001000058', name: 'Tempered Glass Layar Full Cover 9H', category: 'Pelindung HP', categoryCode: 82, brand: 'Nillkin', unit: 'Pcs', hpp: 25000, minStock: 25, rackLocation: 'ETALASE-EL-5', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga' },
      { id: 'DEMO-SKU-EL-06', barcode: '8998001000065', name: 'Case Silikon Liquid Silicone MagSafe Case', category: 'Pelindung HP', categoryCode: 82, brand: 'Spigen', unit: 'Pcs', hpp: 55000, minStock: 15, rackLocation: 'ETALASE-EL-6', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga' },
      { id: 'DEMO-SKU-EL-07', barcode: '8998001000072', name: 'Flashdisk SanDisk Cruzer Blade 32GB USB 2.0', category: 'Storage', categoryCode: 83, brand: 'SanDisk', unit: 'Pcs', hpp: 52000, minStock: 20, rackLocation: 'ETALASE-EL-7', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga', description: 'Garansi 5 Tahun' },
      { id: 'DEMO-SKU-EL-08', barcode: '8998001000089', name: 'Mouse Wireless Ergonomis Silent Click', category: 'Komputer', categoryCode: 84, brand: 'Logitech M220', unit: 'Pcs', hpp: 125000, minStock: 10, rackLocation: 'ETALASE-EL-8', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga', description: 'Garansi Resmi 1 Tahun' },
      { id: 'DEMO-SKU-EL-09', barcode: '8998001000096', name: 'Keyboard Mechanical Gaming RGB Switch Red', category: 'Komputer', categoryCode: 84, brand: 'Keychron / Rexus', unit: 'Pcs', hpp: 380000, minStock: 6, rackLocation: 'RAK-GAMES-1', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga', description: 'Garansi Resmi 1 Tahun' },
      { id: 'DEMO-SKU-EL-10', barcode: '8998001000102', name: 'Headset Gaming Over-Ear 7.1 Surround Sound', category: 'Audio', categoryCode: 81, brand: 'Razer / Fantech', unit: 'Pcs', hpp: 240000, minStock: 8, rackLocation: 'RAK-GAMES-2', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga', description: 'Garansi Resmi 1 Tahun' },
      { id: 'DEMO-SKU-EL-11', barcode: '8998001000119', name: 'Speaker Bluetooth Portabel Waterproof IPX7', category: 'Audio', categoryCode: 81, brand: 'JBL Go 3', unit: 'Pcs', hpp: 340000, minStock: 6, rackLocation: 'ETALASE-EL-9', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga', description: 'Garansi Resmi 1 Tahun' },
      { id: 'DEMO-SKU-EL-12', barcode: '8998001000126', name: 'Kabel Konverter HDMI to VGA Adapter', category: 'Kabel', categoryCode: 80, brand: 'UGREEN', unit: 'Pcs', hpp: 48000, minStock: 12, rackLocation: 'RAK-KABEL-1', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga' },
      { id: 'DEMO-SKU-EL-13', barcode: '8998001000133', name: 'USB Hub 3.0 4-Port High Speed Data', category: 'Komputer', categoryCode: 84, brand: 'TP-Link', unit: 'Pcs', hpp: 68000, minStock: 10, rackLocation: 'RAK-KABEL-2', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga' },
      { id: 'DEMO-SKU-EL-14', barcode: '8998001000140', name: 'Baterai Alkalin AA Energizer (Pack 4pcs)', category: 'Power', categoryCode: 80, brand: 'Energizer', unit: 'Pack', hpp: 22000, minStock: 25, rackLocation: 'ETALASE-EL-10', supplierId: 'SUP-DEMO-01', supplierName: 'PT Indofood Distribusi Nusantara' },
      { id: 'DEMO-SKU-EL-15', barcode: '8998001000157', name: 'Kabel HDMI 2.0 4K Golden Plated 1.5m', category: 'Kabel', categoryCode: 80, brand: 'Vention', unit: 'Pcs', hpp: 35000, minStock: 15, rackLocation: 'RAK-KABEL-3', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga' },
    ];
    return { suppliers: defaultSuppliers, products: elecProducts };
  }

  if (bType === 'LAUNDRY') {
    const laundryProducts: RawProductSpec[] = [
      { id: 'DEMO-SKU-LD-01', barcode: '8999001000017', name: 'Cuci Kering Setrika Kiloan Reguler (2 Hari)', category: 'Jasa Kiloan', categoryCode: 90, brand: 'Laundry Express', unit: 'Kg', hpp: 4500, minStock: 99, rackLocation: 'COUNTER-01', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-LD-02', barcode: '8999001000024', name: 'Cuci Kering Setrika Express Kilat (1 Hari)', category: 'Jasa Kiloan', categoryCode: 90, brand: 'Laundry Express', unit: 'Kg', hpp: 7500, minStock: 99, rackLocation: 'COUNTER-01', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-LD-03', barcode: '8999001000031', name: 'Dry Cleaning Jas / Blazer / Jas Pesta', category: 'Jasa Satuan', categoryCode: 91, brand: 'Laundry Express', unit: 'Pcs', hpp: 18000, minStock: 99, rackLocation: 'RACK-DRY', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-LD-04', barcode: '8999001000048', name: 'Cuci Satuan Bed Cover King / Selimut Tebal', category: 'Jasa Satuan', categoryCode: 91, brand: 'Laundry Express', unit: 'Pcs', hpp: 22000, minStock: 99, rackLocation: 'RACK-BED', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-LD-05', barcode: '8999001000055', name: 'Cuci Sepatu Sneakers Deep Clean Per Pasang', category: 'Jasa Khusus', categoryCode: 92, brand: 'Shoes Care', unit: 'Pasang', hpp: 25000, minStock: 99, rackLocation: 'RACK-SHOE', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-LD-06', barcode: '8999001000062', name: 'Cuci Tas Ransel / Handbag Kulit & Kanvas', category: 'Jasa Khusus', categoryCode: 92, brand: 'Bag Spa', unit: 'Pcs', hpp: 30000, minStock: 99, rackLocation: 'RACK-BAG', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-LD-07', barcode: '8999001000079', name: 'Setrika Saja Pakaian Kiloan', category: 'Jasa Kiloan', categoryCode: 90, brand: 'Laundry Express', unit: 'Kg', hpp: 3500, minStock: 99, rackLocation: 'COUNTER-01', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-LD-08', barcode: '8999001000086', name: 'Cuci Karpet Lantai Permeter Persegi', category: 'Jasa Khusus', categoryCode: 92, brand: 'Carpet Clean', unit: 'm²', hpp: 12000, minStock: 99, rackLocation: 'WASH-BAY-2', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
      { id: 'DEMO-SKU-LD-09', barcode: '8999001000093', name: 'Parfum Laundry Refill Premium Aroma Molto 1L', category: 'Suplai', categoryCode: 93, brand: 'Molto Pro', unit: 'Botol', hpp: 45000, minStock: 10, rackLocation: 'GUDANG-SUP', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-LD-10', barcode: '8999001000109', name: 'Hanger Gantungan Baju Besi (Pack 10pcs)', category: 'Suplai', categoryCode: 93, brand: 'CleanCo', unit: 'Pack', hpp: 15000, minStock: 15, rackLocation: 'GUDANG-SUP', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri' },
      { id: 'DEMO-SKU-LD-11', barcode: '8999001000116', name: 'Plastik Packing Laundry Ukuran Besar (Pack 50)', category: 'Suplai', categoryCode: 93, brand: 'PackingPro', unit: 'Pack', hpp: 22000, minStock: 12, rackLocation: 'GUDANG-SUP', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri' },
      { id: 'DEMO-SKU-LD-12', barcode: '8999001000123', name: 'Deterjen Cair Laundry Professional 5L', category: 'Suplai', categoryCode: 93, brand: 'Rinso Pro', unit: 'Jerigen', hpp: 110000, minStock: 6, rackLocation: 'GUDANG-SUP', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-LD-13', barcode: '8999001000130', name: 'Softener Pelembut Pakaian Konsentrat 5L', category: 'Suplai', categoryCode: 93, brand: 'Downy Pro', unit: 'Jerigen', hpp: 125000, minStock: 6, rackLocation: 'GUDANG-SUP', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-LD-14', barcode: '8999001000147', name: 'Pelicin & Pewangi Setrika Pakaian 1L', category: 'Suplai', categoryCode: 93, brand: 'Rapika Pro', unit: 'Botol', hpp: 28000, minStock: 10, rackLocation: 'GUDANG-SUP', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
      { id: 'DEMO-SKU-LD-15', barcode: '8999001000154', name: 'Jasa Extra Kilat 6 Jam (Sameday Service)', category: 'Jasa Kilat', categoryCode: 90, brand: 'Laundry Express', unit: 'Layanan', hpp: 15000, minStock: 99, rackLocation: 'COUNTER-01', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera', itemType: 'SERVICE' },
    ];
    return { suppliers: defaultSuppliers, products: laundryProducts };
  }

  if (bType === 'WHOLESALE') {
    const wholesaleSuppliers: SupplierMaster[] = [
      { id: 'SUP-DEMO-01', code: 'SUP-WHS-01', name: 'PT Sembako Nusantara Utama Distributor', contactPerson: 'Bpk. Hendra Kusuma', phone: '021-55889911', email: 'b2b@sembakonusantara.id', address: 'Kawasan Pergudangan Pluit Blok C-8, Jakarta Utara', paymentTerms: 'Tempo 30 Hari B2B', activePoCount: 1, status: 'Active' },
      { id: 'SUP-DEMO-02', code: 'SUP-WHS-02', name: 'PT Surya Pangan Makmur Grosir', contactPerson: 'Ibu Anita Rahmawati', phone: '021-82219900', email: 'order@suryapangan.co.id', address: 'Jl. Raya Industri Cakung No. 12, Jakarta Timur', paymentTerms: 'Tempo 30 Hari B2B', activePoCount: 1, status: 'Active' },
      { id: 'SUP-DEMO-03', code: 'SUP-WHS-03', name: 'PT Mega FMCG Logistik Indonesia', contactPerson: 'Bpk. Rudi Hartono', phone: '021-54321100', email: 'logistik@megafmcg.id', address: 'Kawasan Industri Cikarang Utama Blok K-2', paymentTerms: 'Tempo 14 Hari', activePoCount: 1, status: 'Active' },
      { id: 'SUP-DEMO-04', code: 'SUP-WHS-04', name: 'CV Tirta Anugerah Distributor', contactPerson: 'Bpk. Dedi Kurniawan', phone: '021-78901122', email: 'tirta@anugerah.co.id', address: 'Jl. TB Simatupang No. 45, Jakarta Selatan', paymentTerms: 'Lunas / COD', activePoCount: 0, status: 'Active' },
    ];
    const wholesaleProducts: RawProductSpec[] = [
      { id: 'DEMO-SKU-WH-01', barcode: '8991002000015', name: 'Beras Ramos Super Setra 50Kg (Karung Grosir)', category: 'Beras Grosir', categoryCode: 100, brand: 'Topi Koki', unit: 'Karung', hpp: 650000, minStock: 25, rackLocation: 'WH-ZONE-A1', supplierId: 'SUP-DEMO-02', supplierName: 'PT Surya Pangan Makmur Grosir' },
      { id: 'DEMO-SKU-WH-02', barcode: '8991002000022', name: 'Gula Pasir Kristal Putih 50Kg (Karung Grosir)', category: 'Gula Grosir', categoryCode: 101, brand: 'Gulaku / Manis Kita', unit: 'Karung', hpp: 720000, minStock: 20, rackLocation: 'WH-ZONE-A2', supplierId: 'SUP-DEMO-02', supplierName: 'PT Surya Pangan Makmur Grosir' },
      { id: 'DEMO-SKU-WH-03', barcode: '8991002000039', name: 'Minyak Goreng Curah 16 Liter (Jerigen B2B)', category: 'Minyak Grosir', categoryCode: 102, brand: 'Bimoli Curah', unit: 'Jerigen', hpp: 245000, minStock: 15, rackLocation: 'WH-ZONE-B1', supplierId: 'SUP-DEMO-01', supplierName: 'PT Sembako Nusantara Utama Distributor' },
      { id: 'DEMO-SKU-WH-04', barcode: '8991002000046', name: 'Tepung Terigu Segitiga Biru 25Kg (Sak)', category: 'Tepung Grosir', categoryCode: 103, brand: 'Bogasari', unit: 'Sak', hpp: 230000, minStock: 15, rackLocation: 'WH-ZONE-B2', supplierId: 'SUP-DEMO-01', supplierName: 'PT Sembako Nusantara Utama Distributor' },
      { id: 'DEMO-SKU-WH-05', barcode: '8991002000053', name: 'Mie Instan Indomie Goreng 1 Dus (Isi 40 Pcs)', category: 'Mi Instan', categoryCode: 104, brand: 'Indomie', unit: 'Dus', hpp: 112000, minStock: 40, rackLocation: 'WH-ZONE-C1', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mega FMCG Logistik Indonesia' },
      { id: 'DEMO-SKU-WH-06', barcode: '8991002000060', name: 'Sarden Kaleng Abc Besar 1 Dus (Isi 24 Pcs)', category: 'Makanan Kaleng', categoryCode: 105, brand: 'ABC', unit: 'Dus', hpp: 240000, minStock: 15, rackLocation: 'WH-ZONE-C2', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mega FMCG Logistik Indonesia' },
      { id: 'DEMO-SKU-WH-07', barcode: '8991002000077', name: 'Susu Kental Manis Indomilk 1 Karton (48 Kaleng)', category: 'Susu Grosir', categoryCode: 106, brand: 'Indomilk', unit: 'Karton', hpp: 450000, minStock: 12, rackLocation: 'WH-ZONE-D1', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mega FMCG Logistik Indonesia' },
      { id: 'DEMO-SKU-WH-08', barcode: '8991002000084', name: 'Kecap Manis Bango Refill 600ml (Dus 12 Pcs)', category: 'Bumbu Grosir', categoryCode: 107, brand: 'Bango', unit: 'Dus', hpp: 235000, minStock: 15, rackLocation: 'WH-ZONE-D2', supplierId: 'SUP-DEMO-01', supplierName: 'PT Sembako Nusantara Utama Distributor' },
      { id: 'DEMO-SKU-WH-09', barcode: '8991002000091', name: 'Teh Celup Sosro Kotak Besar (Dus 25 Kotak)', category: 'Minuman Grosir', categoryCode: 108, brand: 'Sosro', unit: 'Dus', hpp: 145000, minStock: 20, rackLocation: 'WH-ZONE-E1', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mega FMCG Logistik Indonesia' },
      { id: 'DEMO-SKU-WH-10', barcode: '8991002000107', name: 'Kopi Bubuk Kapal Api Special 1 Dus (24 Sachet Besar)', category: 'Minuman Grosir', categoryCode: 108, brand: 'Kapal Api', unit: 'Dus', hpp: 185000, minStock: 20, rackLocation: 'WH-ZONE-E2', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mega FMCG Logistik Indonesia' },
      { id: 'DEMO-SKU-WH-11', barcode: '8991002000114', name: 'Sabun Colek Ekonomi Multi 1 Dus (24 Pcs)', category: 'Pembersih', categoryCode: 109, brand: 'Ekonomi', unit: 'Dus', hpp: 85000, minStock: 15, rackLocation: 'WH-ZONE-F1', supplierId: 'SUP-DEMO-01', supplierName: 'PT Sembako Nusantara Utama Distributor' },
      { id: 'DEMO-SKU-WH-12', barcode: '8991002000121', name: 'Deterjen Bubuk Rinso Anti Noda 10Kg (Karung)', category: 'Pembersih', categoryCode: 109, brand: 'Rinso', unit: 'Karung', hpp: 195000, minStock: 12, rackLocation: 'WH-ZONE-F2', supplierId: 'SUP-DEMO-01', supplierName: 'PT Sembako Nusantara Utama Distributor' },
      { id: 'DEMO-SKU-WH-13', barcode: '8991002000138', name: 'Pembersih Lantai Karbol Wangi 5L (Jerigen)', category: 'Pembersih', categoryCode: 109, brand: 'Wipol / SOS', unit: 'Jerigen', hpp: 75000, minStock: 15, rackLocation: 'WH-ZONE-F3', supplierId: 'SUP-DEMO-01', supplierName: 'PT Sembako Nusantara Utama Distributor' },
      { id: 'DEMO-SKU-WH-14', barcode: '8991002000145', name: 'Tissue Wajah Nice 2 Ply 1 Dus (20 Pack)', category: 'Paper Goods', categoryCode: 110, brand: 'Nice', unit: 'Dus', hpp: 165000, minStock: 15, rackLocation: 'WH-ZONE-G1', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mega FMCG Logistik Indonesia' },
      { id: 'DEMO-SKU-WH-15', barcode: '8991002000152', name: 'Air Mineral Galon Aqua 19L (Isi Ulang + Galon)', category: 'Minuman Grosir', categoryCode: 108, brand: 'Aqua', unit: 'Galon', hpp: 42000, minStock: 30, rackLocation: 'WH-ZONE-G2', supplierId: 'SUP-DEMO-04', supplierName: 'CV Tirta Anugerah Distributor' },
    ];
    return { suppliers: wholesaleSuppliers, products: wholesaleProducts };
  }

  // DEFAULT RETAIL
  const retailProducts: RawProductSpec[] = [
    { id: 'DEMO-SKU-001', barcode: '8991001000018', name: 'Beras Premium Pandan Wangi 5Kg', category: 'Rice', categoryCode: 21, brand: 'Topi Koki', unit: 'Karung', hpp: 65000, minStock: 12, rackLocation: 'RAK-A01', supplierId: 'SUP-DEMO-01', supplierName: 'PT Indofood Distribusi Nusantara' },
    { id: 'DEMO-SKU-002', barcode: '8991001000025', name: 'Minyak Goreng Bimoli Pouch 2L', category: 'Cooking Oil', categoryCode: 2, brand: 'Bimoli', unit: 'Pouch', hpp: 32000, minStock: 20, rackLocation: 'RAK-A02', supplierId: 'SUP-DEMO-01', supplierName: 'PT Indofood Distribusi Nusantara' },
    { id: 'DEMO-SKU-003', barcode: '8991001000032', name: 'Indomie Goreng Original 85g (Isi 5)', category: 'Instant Noodle', categoryCode: 8, brand: 'Indomie', unit: 'Pack', hpp: 14000, minStock: 30, rackLocation: 'RAK-B01', supplierId: 'SUP-DEMO-01', supplierName: 'PT Indofood Distribusi Nusantara' },
    { id: 'DEMO-SKU-004', barcode: '8991001000049', name: 'Kecap Manis Bango Refill 520ml', category: 'Sweet Soy Sauce', categoryCode: 20, brand: 'Bango', unit: 'Pouch', hpp: 21000, minStock: 15, rackLocation: 'RAK-B02', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
    { id: 'DEMO-SKU-005', barcode: '8991001000056', name: 'Air Mineral Le Minerale 600ml (Dus 24)', category: 'Mineral Water', categoryCode: 9, brand: 'Le Minerale', unit: 'Dus', hpp: 45000, minStock: 15, rackLocation: 'RAK-C01', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga' },
    { id: 'DEMO-SKU-006', barcode: '8991001000063', name: 'Teh Pucuk Harum Melati 350ml', category: 'Tea', categoryCode: 5, brand: 'Mayora', unit: 'Botol', hpp: 3000, minStock: 48, rackLocation: 'CHILLER-02', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga' },
    { id: 'DEMO-SKU-007', barcode: '8991001000070', name: 'Roma Malkist Crackers 135g', category: 'Biscuit', categoryCode: 7, brand: 'Roma', unit: 'Pack', hpp: 7500, minStock: 25, rackLocation: 'RAK-D01', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga' },
    { id: 'DEMO-SKU-008', barcode: '8991001000087', name: 'Chitato Sapi Panggang 68g', category: 'Snack', categoryCode: 6, brand: 'Chitato', unit: 'Pcs', hpp: 9500, minStock: 25, rackLocation: 'RAK-D02', supplierId: 'SUP-DEMO-01', supplierName: 'PT Indofood Distribusi Nusantara' },
    { id: 'DEMO-SKU-009', barcode: '8991001000094', name: 'Rinso Anti Noda Deterjen Cair 750ml', category: 'Detergent', categoryCode: 13, brand: 'Rinso', unit: 'Pouch', hpp: 20000, minStock: 15, rackLocation: 'RAK-E01', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
    { id: 'DEMO-SKU-010', barcode: '8991001000100', name: 'Sunlight Jeruk Nipis Refill 650ml', category: 'Dishwashing Liquid', categoryCode: 25, brand: 'Sunlight', unit: 'Pouch', hpp: 12500, minStock: 20, rackLocation: 'RAK-E02', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
    { id: 'DEMO-SKU-011', barcode: '8991001000117', name: 'Susu Ultra Milk Cokelat 1L', category: 'Milk', categoryCode: 11, brand: 'Ultrajaya', unit: 'Kotak', hpp: 18000, minStock: 20, rackLocation: 'CHILLER-01', supplierId: 'SUP-DEMO-03', supplierName: 'PT Mayora Prima Niaga' },
    { id: 'DEMO-SKU-012', barcode: '8991001000124', name: 'Roti Tawar Kupas Sari Roti', category: 'Bread', categoryCode: 12, brand: 'Sari Roti', unit: 'Bungkus', hpp: 15000, minStock: 10, rackLocation: 'RAK-F01', supplierId: 'SUP-DEMO-04', supplierName: 'CV Mitra Bahan Segar Mandiri' },
    { id: 'DEMO-SKU-013', barcode: '8991001000131', name: 'Keju Kraft Cheddar 165g', category: 'Cheese', categoryCode: 14, brand: 'Kraft', unit: 'Kotak', hpp: 24000, minStock: 15, rackLocation: 'CHILLER-03', supplierId: 'SUP-DEMO-02', supplierName: 'PT Unilever Niaga Sejahtera' },
  ];
  return { suppliers: defaultSuppliers, products: retailProducts };
};

const buildProductSnapshot = (spec: RawProductSpec, stock: number, initialIn: number): Product => {
  const prices = calcMultiTierPrices(spec.hpp);
  return {
    id: spec.id,
    sku: spec.id,
    barcode: spec.barcode,
    name: spec.name,
    category: spec.category,
    categoryCode: spec.categoryCode,
    brand: spec.brand,
    unit: spec.unit,
    costPrice: spec.hpp,
    cost_price: spec.hpp,
    sellingPrice: prices.retail,
    sell_price: prices.retail,
    price_member: prices.member,
    price_wholesale: prices.grosir,
    priceSecondary: prices.member,
    stock: stock,
    minStock: spec.minStock,
    min_stock: spec.minStock,
    initialStock: initialIn,
    rackLocation: spec.rackLocation,
    supplier: spec.supplierName,
    status: 'Active',
    businessModel: spec.itemType === 'MENU_FB' ? 'fnb' : 'retail',
    itemType: spec.itemType || 'RETAIL',
    image:
      spec.image ||
      (spec.itemType === 'MENU_FB' || spec.id.toUpperCase().includes('-FNB-')
        ? resolveFnbMenuImageUrl(spec.name, spec.category)
        : undefined),
    recipe: spec.recipe,
    costing: spec.costing,
    batchNumber: spec.batchNumber,
    expiryDate: spec.expiryDate,
    description: spec.description,
  };
};

export const generateIntegratedDemoForBusiness = (
  businessType?: string | CanonicalBusinessSector,
  params: BuildIntegratedDemoParams = {}
): IntegratedDemoPackageResult => {
  const now = params.now ? new Date(params.now.getTime()) : new Date();
  const bKey = String(businessType || params.activeSector || 'RETAIL').toUpperCase();
  const activeBiz = params.businessName || 'INDONESIA MIDI';

  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayDate = addDays(todayDate, -1);
  const twoDaysAgoDate = addDays(todayDate, -2);
  const threeDaysAgoDate = addDays(todayDate, -3);

  const todayStr = formatLocalDate(todayDate);
  const yesterdayStr = formatLocalDate(yesterdayDate);
  const twoDaysAgoStr = formatLocalDate(twoDaysAgoDate);
  const threeDaysAgoStr = formatLocalDate(threeDaysAgoDate);
  const dueIn14DaysStr = formatLocalDate(addDays(todayDate, 14));

  const catalog = getIndustryCatalog(bKey);
  const suppliers = catalog.suppliers;
  const rawSpecs = catalog.products;

  const customers: CustomerMaster[] = [
    {
      id: 'CUST-DEMO-01',
      code: 'VIP-7781',
      name: 'Bapak Ir. Bambang Hermanto',
      customer_code: 'VIP-7781',
      memberTier: 'Platinum',
      tier_level: 'Platinum',
      phone: '0812-8899-0101',
      email: 'bambang.hermanto@gmail.com',
      points: 14250,
      totalSpent: 28500000,
      total_spending_current_period: 28500000,
      status: 'Active',
      has_store: true,
      store_name: 'Toko Sumber Rejeki Grosir',
      store_address: 'Jl. Ahmad Yani No. 45, Surabaya',
      allowed_tiers: ['RETAIL', 'MEMBER', 'WHOLESALE'],
    },
    {
      id: 'CUST-DEMO-02',
      code: 'VIP-7783',
      name: 'Bapak Richard Hartono',
      customer_code: 'VIP-7783',
      memberTier: 'Platinum',
      tier_level: 'Platinum',
      phone: '0811-9988-7711',
      email: 'richard.hartono@gmail.com',
      points: 18900,
      totalSpent: 36200000,
      total_spending_current_period: 36200000,
      status: 'Active',
      has_store: true,
      store_name: 'UD Maju Bersama Mart',
      store_address: 'Komp. Ruko Central Niaga Blok B-2, Semarang',
      allowed_tiers: ['RETAIL', 'MEMBER', 'WHOLESALE'],
    },
    {
      id: 'CUST-DEMO-03',
      code: 'GLD-5504',
      name: 'Bapak Dimas Arya Putra',
      customer_code: 'GLD-5504',
      memberTier: 'Gold',
      tier_level: 'Gold',
      phone: '0812-4455-6677',
      email: 'dimas.arya@telkomsel.co.id',
      points: 5900,
      totalSpent: 11800000,
      total_spending_current_period: 3800000,
      status: 'Active',
      has_store: true,
      store_name: 'Kios Pulsa & Sembako Dimas',
      store_address: 'Jl. Kaliurang KM 7, Yogyakarta',
      allowed_tiers: ['RETAIL', 'MEMBER', 'WHOLESALE'],
    },
    {
      id: 'CUST-DEMO-04',
      code: 'SLV-2201',
      name: 'Ibu Siti Aminah',
      customer_code: 'SLV-2201',
      memberTier: 'Silver',
      tier_level: 'Silver',
      phone: '0813-1122-3344',
      email: 'siti.aminah@gmail.com',
      points: 1250,
      totalSpent: 2450000,
      total_spending_current_period: 1200000,
      status: 'Active',
      has_store: false,
      allowed_tiers: ['RETAIL', 'MEMBER'],
    },
    {
      id: 'CUST-DEMO-05',
      code: 'REG-001',
      name: 'Pelanggan Umum (Walk-in)',
      customer_code: 'REG-001',
      memberTier: 'Regular',
      tier_level: 'Regular',
      phone: '0800-0000-0000',
      email: 'walkin@retailos.id',
      points: 120,
      totalSpent: 450000,
      total_spending_current_period: 450000,
      status: 'Active',
      has_store: false,
      allowed_tiers: ['RETAIL'],
    },
  ];

  const employees: Employee[] = [
    { id: 'EMP-DEMO-01', nip: 'EMP-001', name: 'Bpk. Hendra Wijaya', role: 'Store Manager', division: 'Executive', phone: '0812-1000-0001', email: 'hendra.wijaya@jacs.id', status: 'Active', shift: 'Pagi', baseSalary: 7500000, avatarUrl: null, avatar: null, department: 'Executive & Management', contractStatus: 'Tetap', joinDate: '2023-01-10', leaveQuota: { total: 12, used: 2, remaining: 10 }, pin: '1234' },
    { id: 'EMP-DEMO-02', nip: 'EMP-002', name: 'Ibu Rina Lestari', role: 'Finance Lead', division: 'Finance', phone: '0812-1000-0002', email: 'rina.lestari@jacs.id', status: 'Active', shift: 'Pagi', baseSalary: 6500000, avatarUrl: null, avatar: null, department: 'Finance & Accounting', contractStatus: 'Tetap', joinDate: '2023-02-15', leaveQuota: { total: 12, used: 1, remaining: 11 }, pin: '1234' },
    { id: 'EMP-DEMO-03', nip: 'EMP-003', name: 'Bpk. Agus Setiawan', role: 'Purchasing Officer', division: 'Purchasing', phone: '0812-1000-0003', email: 'agus.setiawan@jacs.id', status: 'Active', shift: 'Pagi', baseSalary: 5500000, avatarUrl: null, avatar: null, department: 'Purchasing', contractStatus: 'Tetap', joinDate: '2023-03-20', leaveQuota: { total: 12, used: 3, remaining: 9 }, pin: '1234' },
    { id: 'EMP-DEMO-04', nip: 'EMP-004', name: 'Bpk. Joko Susilo', role: 'Warehouse Supervisor', division: 'Warehouse', phone: '0812-1000-0004', email: 'joko.susilo@jacs.id', status: 'Active', shift: 'Pagi', baseSalary: 5000000, avatarUrl: null, avatar: null, department: 'Warehouse & Logistik', contractStatus: 'Tetap', joinDate: '2023-04-01', leaveQuota: { total: 12, used: 0, remaining: 12 }, pin: '1234' },
    { id: 'EMP-DEMO-05', nip: 'EMP-005', name: 'Ibu Dewi Anggraini', role: 'HR Officer', division: 'HR', phone: '0812-1000-0005', email: 'dewi.anggraini@jacs.id', status: 'Active', shift: 'Pagi', baseSalary: 5000000, avatarUrl: null, avatar: null, department: 'Human Resources & Personalia', contractStatus: 'Tetap', joinDate: '2023-05-12', leaveQuota: { total: 12, used: 2, remaining: 10 }, pin: '1234' },
    { id: 'EMP-DEMO-06', nip: 'EMP-006', name: 'Siska Wulandari', role: 'Senior Cashier', division: 'POS', phone: '0812-1000-0006', email: 'siska.wulandari@jacs.id', status: 'Active', shift: 'Pagi', baseSalary: 4200000, pin: '1101', avatarUrl: null, avatar: null, department: 'POS & Kasir', contractStatus: 'Tetap', joinDate: '2023-06-01', leaveQuota: { total: 12, used: 1, remaining: 11 } },
  ];

  const attendance: AttendanceRecord[] = employees.map((emp, idx) => ({
    id: `ATT-DEMO-${idx + 1}`,
    employeeId: emp.id,
    nip: emp.nip,
    employeeName: emp.name,
    avatar: null,
    department: emp.department,
    date: todayStr,
    shift: emp.shift,
    clockIn: '07:45:20',
    clockOut: null,
    status: 'Tepat Waktu',
    notes: 'Tepat waktu',
    location: 'Lokasi Utama Toko',
  }));

  const leaves: LeaveRequest[] = [
    {
      id: 'LEV-DEMO-01',
      ticketNumber: 'LEV-2026-001',
      employeeId: 'EMP-DEMO-06',
      nip: 'EMP-006',
      employeeName: 'Siska Wulandari',
      department: 'POS & Kasir',
      type: 'Cuti Tahunan',
      startDate: addDays(todayDate, 5).toISOString(),
      endDate: addDays(todayDate, 6).toISOString(),
      durationDays: 2,
      reason: 'Keperluan keluarga mendesak',
      status: 'Disetujui',
      submittedAt: threeDaysAgoStr,
    },
  ];

  const stockTracker: Record<string, number> = {};
  const initialInTracker: Record<string, number> = {};
  rawSpecs.forEach((spec) => {
    const defaultQty = spec.itemType === 'RAW_MATERIAL' || spec.itemType === 'MENU_FB' || spec.itemType === 'SERVICE' ? 50 : 85;
    stockTracker[spec.id] = defaultQty;
    initialInTracker[spec.id] = defaultQty;
  });

  const purchaseOrders: PurchaseOrder[] = [
    {
      po_number: 'PO-2026-001',
      date: threeDaysAgoStr,
      supplier_name: suppliers[0].name,
      supplier_id: suppliers[0].id,
      items: `${rawSpecs[0].name} (20), ${rawSpecs[1].name} (25)`,
      total_amount: rawSpecs[0].hpp * 20 + rawSpecs[1].hpp * 25,
      status: 'RECEIVED',
      notes: 'PO rutin mingguan diterima lengkap di gudang utama.',
      item_details: [
        { product_id: rawSpecs[0].id, product_name: rawSpecs[0].name, qty: 20, unit_cost: rawSpecs[0].hpp, subtotal: rawSpecs[0].hpp * 20 },
        { product_id: rawSpecs[1].id, product_name: rawSpecs[1].name, qty: 25, unit_cost: rawSpecs[1].hpp, subtotal: rawSpecs[1].hpp * 25 },
      ],
    },
    {
      po_number: 'PO-2026-002',
      date: yesterdayStr,
      supplier_name: suppliers[1].name,
      supplier_id: suppliers[1].id,
      items: `${rawSpecs[2].name} (30)`,
      total_amount: rawSpecs[2].hpp * 30,
      status: 'RECEIVED',
      notes: 'Restock harian diterima dan dicatat ke kartu stok.',
      item_details: [
        { product_id: rawSpecs[2].id, product_name: rawSpecs[2].name, qty: 30, unit_cost: rawSpecs[2].hpp, subtotal: rawSpecs[2].hpp * 30 },
      ],
    },
    {
      po_number: 'PO-2026-003',
      date: todayStr,
      supplier_name: suppliers[2].name,
      supplier_id: suppliers[2].id,
      items: `${rawSpecs[3].name} (50), ${rawSpecs[4].name} (40)`,
      total_amount: rawSpecs[3].hpp * 50 + rawSpecs[4].hpp * 40,
      status: 'PENDING_APPROVAL',
      notes: 'Pengajuan pembelian stok besar menunggu otorisasi Executive Manager.',
      item_details: [
        { product_id: rawSpecs[3].id, product_name: rawSpecs[3].name, qty: 50, unit_cost: rawSpecs[3].hpp, subtotal: rawSpecs[3].hpp * 50 },
        { product_id: rawSpecs[4].id, product_name: rawSpecs[4].name, qty: 40, unit_cost: rawSpecs[4].hpp, subtotal: rawSpecs[4].hpp * 40 },
      ],
    },
  ];

  const purchaseRequests: PurchaseRequest[] = [
    {
      id: 'PR-DEMO-001',
      pr_number: 'PR-2026-001',
      date: todayStr,
      department: 'Purchasing',
      requester_name: 'Bpk. Agus Setiawan',
      item_name: purchaseOrders[2].items,
      qty: 90,
      estimated_cost: purchaseOrders[2].total_amount,
      status: 'Approved',
      urgency: 'Medium',
    },
  ];

  const goodsReceipts: GoodsReceipt[] = [
    {
      id: 'GRN-DEMO-001',
      poId: 'PO-DEMO-001',
      poNumber: 'PO-2026-001',
      vendorId: suppliers[0].id,
      vendorName: suppliers[0].name,
      warehouseId: 'WH-01',
      deliveryOrderNumber: 'DO-99210',
      receivedDate: twoDaysAgoStr,
      receivedByUserId: 'EMP-DEMO-04',
      status: 'VERIFIED',
      idempotencyKey: 'GRN-KEY-001',
      notes: 'Diterima dalam kondisi baik tanpa cacat.',
      items: [
        { id: 'GRI-1', poItemId: 'POI-1', productId: rawSpecs[0].id, productName: rawSpecs[0].name, orderedQty: 20, receivedQty: 20, acceptedQty: 20, rejectedQty: 0, unit: rawSpecs[0].unit, unitCost: rawSpecs[0].hpp, totalCost: rawSpecs[0].hpp * 20 },
        { id: 'GRI-2', poItemId: 'POI-2', productId: rawSpecs[1].id, productName: rawSpecs[1].name, orderedQty: 25, receivedQty: 25, acceptedQty: 25, rejectedQty: 0, unit: rawSpecs[1].unit, unitCost: rawSpecs[1].hpp, totalCost: rawSpecs[1].hpp * 25 },
      ],
    },
  ];

  const stockMutations: StockMutation[] = [
    {
      id: 'MUT-DEMO-001',
      timestamp: makeIsoAtTime(twoDaysAgoDate, 11, 0),
      product_id: rawSpecs[0].id,
      sku: rawSpecs[0].id,
      product_name: rawSpecs[0].name,
      type: 'IN / GOODS_RECEIPT',
      qty: 20,
      previous_stock: 30,
      final_stock: 50,
      reference_no: 'PO-2026-001',
      notes: 'Penerimaan PO-2026-001 dari supplier',
      operator: 'Bpk. Joko Susilo',
    },
    {
      id: 'MUT-DEMO-002',
      timestamp: makeIsoAtTime(twoDaysAgoDate, 11, 5),
      product_id: rawSpecs[1].id,
      sku: rawSpecs[1].id,
      product_name: rawSpecs[1].name,
      type: 'IN / GOODS_RECEIPT',
      qty: 25,
      previous_stock: 25,
      final_stock: 50,
      reference_no: 'PO-2026-001',
      notes: 'Penerimaan PO-2026-001 dari supplier',
      operator: 'Bpk. Joko Susilo',
    },
  ];

  const sales: Sale[] = [];
  const journalEntries: JournalEntry[] = [];
  const financeEntries: FinanceEntry[] = [];
  const invoicesDue: InvoiceDue[] = [];

  let totalRevenue = 0;
  let totalHpp = 0;
  let todayCashSales = 0;
  let todayNonCashSales = 0;
  let yesterdayCashSales = 0;
  let yesterdayNonCashSales = 0;
  let todayTxCount = 0;
  let yesterdayTxCount = 0;

  const saleBlueprintList = [
    { seq: 1, dayOffset: -1, hour: 9, minute: 15, customerIdx: 0, paymentMethod: 'CASH', priceTier: 'WHOLESALE' as PriceTier, items: [{ idx: 0, qty: 3 }, { idx: 1, qty: 2 }] },
    { seq: 2, dayOffset: -1, hour: 10, minute: 30, customerIdx: 1, paymentMethod: 'TRANSFER', priceTier: 'WHOLESALE' as PriceTier, items: [{ idx: 2, qty: 5 }, { idx: 3, qty: 3 }] },
    { seq: 3, dayOffset: -1, hour: 11, minute: 45, customerIdx: 2, paymentMethod: 'QRIS', priceTier: 'MEMBER' as PriceTier, items: [{ idx: 4, qty: 2 }, { idx: 5, qty: 4 }] },
    { seq: 4, dayOffset: -1, hour: 13, minute: 20, customerIdx: 3, paymentMethod: 'CASH', priceTier: 'RETAIL' as PriceTier, items: [{ idx: 6, qty: 2 }, { idx: 7, qty: 1 }] },
    { seq: 5, dayOffset: -1, hour: 15, minute: 10, customerIdx: 4, paymentMethod: 'QRIS', priceTier: 'RETAIL' as PriceTier, items: [{ idx: 8, qty: 1 }, { idx: 9, qty: 2 }] },
    { seq: 6, dayOffset: -1, hour: 16, minute: 50, customerIdx: 0, paymentMethod: 'TRANSFER', priceTier: 'WHOLESALE' as PriceTier, items: [{ idx: 10, qty: 2 }, { idx: 11, qty: 2 }] },
    { seq: 7, dayOffset: 0, hour: 8, minute: 30, customerIdx: 2, paymentMethod: 'CASH', priceTier: 'MEMBER' as PriceTier, items: [{ idx: 0, qty: 1 }, { idx: 2, qty: 2 }] },
    { seq: 8, dayOffset: 0, hour: 9, minute: 40, customerIdx: 1, paymentMethod: 'QRIS', priceTier: 'WHOLESALE' as PriceTier, items: [{ idx: 1, qty: 3 }, { idx: 4, qty: 2 }] },
    { seq: 9, dayOffset: 0, hour: 11, minute: 15, customerIdx: 3, paymentMethod: 'CASH', priceTier: 'RETAIL' as PriceTier, items: [{ idx: 3, qty: 2 }, { idx: 6, qty: 2 }] },
    { seq: 10, dayOffset: 0, hour: 13, minute: 0, customerIdx: 4, paymentMethod: 'TRANSFER', priceTier: 'RETAIL' as PriceTier, items: [{ idx: 5, qty: 3 }, { idx: 7, qty: 2 }] },
    { seq: 11, dayOffset: 0, hour: 14, minute: 30, customerIdx: 0, paymentMethod: 'QRIS', priceTier: 'WHOLESALE' as PriceTier, items: [{ idx: 8, qty: 2 }, { idx: 10, qty: 1 }] },
    { seq: 12, dayOffset: 0, hour: 16, minute: 0, customerIdx: 2, paymentMethod: 'CASH', priceTier: 'MEMBER' as PriceTier, items: [{ idx: 9, qty: 2 }, { idx: 11, qty: 1 }] },
  ];

  saleBlueprintList.forEach((bp) => {
    const targetDate = bp.dayOffset === -1 ? yesterdayDate : todayDate;
    const dateStr = formatLocalDate(targetDate);
    const txIso = makeIsoAtTime(targetDate, bp.hour, bp.minute);
    const txId = `TRX-2026-${String(bp.seq).padStart(3, '0')}`;
    const customer = customers[bp.customerIdx];

    let saleTotal = 0;
    let saleHpp = 0;
    const cartItems: CartItem[] = [];
    const itemsSummaryArr: string[] = [];

    bp.items.forEach((it) => {
      const spec = rawSpecs[it.idx % rawSpecs.length];
      const prices = calcMultiTierPrices(spec.hpp);
      const unitPrice = bp.priceTier === 'WHOLESALE' ? prices.grosir : bp.priceTier === 'MEMBER' ? prices.member : prices.retail;
      const subtotal = unitPrice * it.qty;
      const hppSub = spec.hpp * it.qty;

      saleTotal += subtotal;
      saleHpp += hppSub;

      cartItems.push({
        product: buildProductSnapshot(spec, stockTracker[spec.id] || 10, initialInTracker[spec.id] || 10),
        quantity: it.qty,
        selectedPriceTier: bp.priceTier,
        originalUnitPrice: unitPrice,
        subtotal,
      });

      itemsSummaryArr.push(`${it.qty}x ${spec.name}`);
      const prevStock = stockTracker[spec.id] || 10;
      const nextStock = Math.max(0, prevStock - it.qty);
      stockTracker[spec.id] = nextStock;

      stockMutations.push({
        id: `MUT-TRX-${bp.seq}-${it.idx}`,
        timestamp: txIso,
        product_id: spec.id,
        sku: spec.id,
        product_name: spec.name,
        type: 'OUT / KASIR',
        qty: it.qty,
        previous_stock: prevStock,
        final_stock: nextStock,
        reference_no: txId,
        notes: `Penjualan POS ${txId}`,
        operator: 'Siska Wulandari',
      });
    });

    const itemsSummary = itemsSummaryArr.join(', ');
    const pointsEarned = Math.floor(saleTotal / 10000);

    totalRevenue += saleTotal;
    totalHpp += saleHpp;

    if (bp.dayOffset === 0) {
      todayTxCount++;
      if (bp.paymentMethod === 'CASH') todayCashSales += saleTotal;
      else todayNonCashSales += saleTotal;
    } else {
      yesterdayTxCount++;
      if (bp.paymentMethod === 'CASH') yesterdayCashSales += saleTotal;
      else yesterdayNonCashSales += saleTotal;
    }

    const saleObj: Sale = {
      transaction_id: txId,
      receipt_number: txId,
      date: dateStr,
      created_at: txIso,
      cashier_id: 'EMP-DEMO-06',
      cashier_name: 'Siska Wulandari',
      terminal_name: 'Kasir Utama POS-01',
      terminalId: 'POS-01',
      terminal_id: 'POS-01',
      stationCode: 'POS-01',
      customer_id: customer?.id,
      customer_name: customer?.name || 'Pelanggan Umum (Walk-in)',
      customer_phone: customer?.phone,
      price_tier: bp.priceTier,
      items_summary: itemsSummary,
      items: cartItems,
      subtotal: saleTotal,
      discount: 0,
      total_amount: saleTotal,
      payment_method: bp.paymentMethod as any,
      amount_paid: saleTotal,
      change_amount: 0,
      points_earned: pointsEarned,
      status: 'COMPLETED',
      shift_id: bp.dayOffset === -1 ? 'SHIFT-DEMO-YESTERDAY' : 'SHIFT-DEMO-TODAY',
      syncStatus: 'SYNCED',
      businessSector: 'RETAIL',
      businessName: activeBiz,
      isDemoSeed: false,
    };
    sales.push(saleObj);

    const debitAccount =
      bp.paymentMethod === 'CASH'
        ? { code: '1-10001', name: 'Kas Kasir (Laci POS)' }
        : bp.paymentMethod === 'QRIS'
        ? { code: '1-10003', name: 'Bank QRIS & E-Wallet' }
        : { code: '1-10002', name: 'Bank Operasional Utama' };

    journalEntries.push({
      id: `JV-DEMO-POS-${String(bp.seq).padStart(3, '0')}`,
      date: dateStr,
      reference: txId,
      description: `Penjualan POS ${txId} (${bp.paymentMethod} · ${customer ? customer.name : 'Walk-in'})`,
      type: 'POS_SALES',
      amount: saleTotal,
      totalDebit: saleTotal + saleHpp,
      totalCredit: saleTotal + saleHpp,
      created_at: txIso,
      businessSector: 'RETAIL',
      businessName: activeBiz,
      isDemoSeed: false,
      lines: [
        { accountCode: debitAccount.code, accountName: debitAccount.name, debit: saleTotal, credit: 0 },
        { accountCode: '4-10101', accountName: 'Pendapatan Penjualan', debit: 0, credit: saleTotal },
        { accountCode: '5-10101', accountName: 'Harga Pokok Penjualan (HPP)', debit: saleHpp, credit: 0 },
        { accountCode: '1-10201', accountName: 'Persediaan Barang Dagang', debit: 0, credit: saleHpp },
      ],
    });

    financeEntries.push({
      id: `FIN-DEMO-POS-${String(bp.seq).padStart(3, '0')}`,
      date: dateStr,
      type: 'INCOME',
      category: 'Penjualan POS',
      description: `Penjualan ${txId} (${bp.paymentMethod} · ${bp.priceTier})`,
      amount: saleTotal,
      payment_method: bp.paymentMethod,
      reference: txId,
      account_target: '4-10101 · Pendapatan Penjualan',
      created_at: txIso,
      businessSector: 'RETAIL',
      businessName: activeBiz,
      isDemoSeed: false,
    });
  });

  const initialCashDrawer = 1000000;
  const todayShiftStart = makeIsoAtTime(todayDate, 7, 0);
  const yesterdayShiftStart = makeIsoAtTime(yesterdayDate, 7, 0);
  const yesterdayShiftEnd = makeIsoAtTime(yesterdayDate, 17, 15);

  const cashierShifts: CashierShift[] = [
    {
      id: 'SHIFT-DEMO-TODAY',
      cashierId: 'EMP-DEMO-06',
      cashierName: 'Siska Wulandari',
      terminalId: 'POS-01',
      terminalName: 'Kasir Utama POS-01',
      stationCode: 'POS-01',
      shiftName: 'Shift Pagi (Aktif)',
      startTime: todayShiftStart,
      openedAt: todayShiftStart,
      status: 'OPEN',
      initialCash: initialCashDrawer,
      startingCash: initialCashDrawer,
      totalCashSales: todayCashSales,
      totalNonCashSales: todayNonCashSales,
      totalExpenses: 0,
      expenses: [],
      totalTransactionsCount: todayTxCount,
      expectedCashInDrawer: initialCashDrawer + todayCashSales,
      expectedCash: initialCashDrawer + todayCashSales,
      notes: 'Shift aktif berjalan hari ini — laci kasir sinkron otomatis.',
    },
    {
      id: 'SHIFT-DEMO-YESTERDAY',
      cashierId: 'EMP-DEMO-06',
      cashierName: 'Siska Wulandari',
      terminalId: 'POS-01',
      terminalName: 'Kasir Utama POS-01',
      stationCode: 'POS-01',
      shiftName: 'Shift Kemarin (Z-Report)',
      startTime: yesterdayShiftStart,
      openedAt: yesterdayShiftStart,
      endTime: yesterdayShiftEnd,
      closedAt: yesterdayShiftEnd,
      closedBy: 'Siska Wulandari',
      status: 'CLOSED',
      initialCash: initialCashDrawer,
      startingCash: initialCashDrawer,
      totalCashSales: yesterdayCashSales,
      totalNonCashSales: yesterdayNonCashSales,
      totalExpenses: 0,
      expenses: [],
      totalTransactionsCount: yesterdayTxCount,
      expectedCashInDrawer: initialCashDrawer + yesterdayCashSales,
      expectedCash: initialCashDrawer + yesterdayCashSales,
      actualCashInDrawer: initialCashDrawer + yesterdayCashSales,
      actualCash: initialCashDrawer + yesterdayCashSales,
      difference: 0,
      reconciliationStatus: 'MATCH',
      notes: 'Z-Report tutup shift kemarin — fisik uang laci cocok 100%.',
    },
  ];

  const products: Product[] = rawSpecs.map((spec) =>
    buildProductSnapshot(
      spec,
      stockTracker[spec.id] ?? 50,
      initialInTracker[spec.id] ?? 50
    )
  );

  const uniqueBrands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean) as string[]));
  const brands: BrandMaster[] = uniqueBrands.map((b, idx) => {
    const sample = products.find((p) => p.brand === b);
    return {
      id: `BRD-DEMO-${String(idx + 1).padStart(2, '0')}`,
      code: `BRD-${String(idx + 1).padStart(3, '0')}`,
      name: b,
      manufacturer: sample?.supplier || 'Principal Resmi Indonesia',
      country: 'Indonesia',
      productCount: products.filter((p) => p.brand === b).length,
      status: 'Active',
      categoryCode: Number(sample?.categoryCode || 10),
      categoryName: sample?.category,
    };
  });

  const catMap = new Map<number, { name: string; count: number }>();
  products.forEach((p) => {
    const code = Number(p.categoryCode || 10);
    const existing = catMap.get(code);
    if (existing) existing.count += 1;
    else catMap.set(code, { name: p.category || 'General', count: 1 });
  });
  const categories: CategoryMaster[] = Array.from(catMap.entries()).map(([code, info]) => ({
    id: `CAT-${code}`,
    code: String(code),
    name: info.name,
    department: 'Retail & Enterprise Division',
    taxRate: 11,
    marginTarget: 20,
    productCount: info.count,
    status: 'Active',
  }));

  const salesSorted = [...sales].reverse();
  const mutationsSorted = [...stockMutations].reverse();
  const journalsSorted = [...journalEntries].reverse();
  const financeSorted = [...financeEntries].reverse();

  return {
    products,
    suppliers,
    customers,
    employees,
    attendance,
    leaves,
    purchaseOrders,
    purchaseRequests,
    goodsReceipts,
    stockMutations: mutationsSorted,
    sales: salesSorted,
    cashierShifts,
    financeEntries: financeSorted,
    journalEntries: journalsSorted,
    invoicesDue,
    brands,
    categories,
    summary: {
      productCount: products.length,
      bomProductCount: products.filter((p) => Boolean(p.recipe && p.recipe.length > 0)).length,
      supplierCount: suppliers.length,
      customerCount: customers.length,
      employeeCount: employees.length,
      attendanceCount: attendance.length,
      poCount: purchaseOrders.length,
      pendingApprovalPoCount: purchaseOrders.filter((po) => po.status === 'PENDING_APPROVAL').length,
      saleCount: salesSorted.length,
      journalCount: journalsSorted.length,
      mutationCount: mutationsSorted.length,
      totalRevenue,
      totalHpp,
    },
  };
};

export const buildIntegratedDemoPackage = (
  params: BuildIntegratedDemoParams = {}
): IntegratedDemoPackageResult => {
  return generateIntegratedDemoForBusiness(params.activeSector || 'RETAIL', params);
};
