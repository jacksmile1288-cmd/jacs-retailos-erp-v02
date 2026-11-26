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

interface BuildIntegratedDemoParams {
  activeSector?: CanonicalBusinessSector | string;
  businessName?: string;
  now?: Date;
}

const VALID_SECTORS: CanonicalBusinessSector[] = ['RETAIL', 'FNB', 'FASHION', 'BUILDING', 'SERVICE'];

const normalizeSector = (raw?: string): CanonicalBusinessSector => {
  const upper = String(raw || 'RETAIL').toUpperCase();
  if (VALID_SECTORS.includes(upper as CanonicalBusinessSector)) {
    return upper as CanonicalBusinessSector;
  }
  return 'RETAIL';
};

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

export const buildIntegratedDemoPackage = (
  params: BuildIntegratedDemoParams = {}
): IntegratedDemoPackageResult => {
  const now = params.now ? new Date(params.now.getTime()) : new Date();
  const activeSec: CanonicalBusinessSector = normalizeSector(params.activeSector);
  const activeBiz = params.businessName || 'INDONESIA MIDI';

  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayDate = addDays(todayDate, -1);
  const twoDaysAgoDate = addDays(todayDate, -2);
  const threeDaysAgoDate = addDays(todayDate, -3);

  const todayStr = formatLocalDate(todayDate);
  const yesterdayStr = formatLocalDate(yesterdayDate);
  const twoDaysAgoStr = formatLocalDate(twoDaysAgoDate);
  const threeDaysAgoStr = formatLocalDate(threeDaysAgoDate);
  const dueIn30DaysStr = formatLocalDate(addDays(todayDate, 28));
  const dueIn14DaysStr = formatLocalDate(addDays(todayDate, 14));

  // ============================================================================
  // 1. SUPPLIERS (4 Active Suppliers — clean retail distributor names)
  // ============================================================================
  const suppliers: SupplierMaster[] = [
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

  // ============================================================================
  // 2. MASTER PRODUCTS (18 SKUs: 13 Retail/FMCG + 3 Raw Ingredients + 2 BOM Menus)
  // Pricing strictly follows: Retail +20%, Member +15%, Grosir +10%
  // ============================================================================
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
    recipeSummary?: string;
  }

  // Raw Material SKUs referenced by the 2 BOM products
  const rawMaterialSpecs: RawProductSpec[] = [
    {
      id: 'DEMO-SKU-014',
      barcode: '8991001000148',
      name: 'Biji Kopi Arabika Gayo Premium 1Kg',
      category: 'Coffee',
      categoryCode: 10,
      brand: 'Gayo Heritage',
      unit: 'Pack',
      hpp: 180000,
      minStock: 6,
      rackLocation: 'RAK-CAFE-01',
      supplierId: 'SUP-DEMO-04',
      supplierName: 'CV Mitra Bahan Segar Mandiri',
      itemType: 'RETAIL',
    },
    {
      id: 'DEMO-SKU-015',
      barcode: '8991001000155',
      name: 'Susu UHT Full Cream Fresh Milk 1L',
      category: 'Milk',
      categoryCode: 11,
      brand: 'Greenfields',
      unit: 'Kotak',
      hpp: 22000,
      minStock: 18,
      rackLocation: 'CHILLER-01',
      supplierId: 'SUP-DEMO-04',
      supplierName: 'CV Mitra Bahan Segar Mandiri',
      itemType: 'RETAIL',
    },
    {
      id: 'DEMO-SKU-016',
      barcode: '8991001000162',
      name: 'Sirup Gula Aren Organik 1L',
      category: 'Sweetened Condensed Milk',
      categoryCode: 12,
      brand: 'Aren Jaya',
      unit: 'Botol',
      hpp: 60000,
      minStock: 8,
      rackLocation: 'RAK-CAFE-02',
      supplierId: 'SUP-DEMO-04',
      supplierName: 'CV Mitra Bahan Segar Mandiri',
      itemType: 'RETAIL',
    },
  ];

  // BOM Product 1: Es Kopi Susu Gula Aren Signature (HPP 12.000 -> Retail 14.400 / Member 13.800 / Grosir 13.200)
  const bom1Recipe: RecipeIngredient[] = [
    {
      ingredientId: 'DEMO-SKU-014',
      name: 'Biji Kopi Arabika Gayo Premium 1Kg',
      ingredientName: 'Biji Kopi Arabika Gayo Premium 1Kg',
      qty: 20,
      portionQty: 20,
      unit: 'gram',
      costPerUnit: 180,
      subtotalCost: 3600,
    },
    {
      ingredientId: 'DEMO-SKU-015',
      name: 'Susu UHT Full Cream Fresh Milk 1L',
      ingredientName: 'Susu UHT Full Cream Fresh Milk 1L',
      qty: 150,
      portionQty: 150,
      unit: 'ml',
      costPerUnit: 22,
      subtotalCost: 3300,
    },
    {
      ingredientId: 'DEMO-SKU-016',
      name: 'Sirup Gula Aren Organik 1L',
      ingredientName: 'Sirup Gula Aren Organik 1L',
      qty: 35,
      portionQty: 35,
      unit: 'ml',
      costPerUnit: 60,
      subtotalCost: 2100,
    },
  ];
  const bom1Hpp = 12000;
  const bom1Prices = calcMultiTierPrices(bom1Hpp);
  const bom1Costing: FBMenuCosting = {
    recipe: bom1Recipe.map((r) => ({
      ingredientId: r.ingredientId,
      ingredientName: r.name,
      portionQty: r.qty,
      unit: r.unit,
      costPerUnit: r.costPerUnit,
      subtotalCost: r.subtotalCost || r.qty * r.costPerUnit,
      name: r.name,
      qty: r.qty,
    })),
    wastePercentage: 0,
    rawMaterialHPP: 9000,
    rawMaterialCost: 9000,
    operationalCost: 3000,
    totalCost: bom1Hpp,
    targetMarginPercent: 20,
    calculatedSellingPrice: bom1Prices.retail,
    recommendedPrice: bom1Prices.retail,
    actualPrice: bom1Prices.retail,
  };

  // BOM Product 2: Iced Creamy Caffe Latte 350ml (HPP 13.000 -> Retail 15.600 / Member 14.950 / Grosir 14.300)
  const bom2Recipe: RecipeIngredient[] = [
    {
      ingredientId: 'DEMO-SKU-014',
      name: 'Biji Kopi Arabika Gayo Premium 1Kg',
      ingredientName: 'Biji Kopi Arabika Gayo Premium 1Kg',
      qty: 25,
      portionQty: 25,
      unit: 'gram',
      costPerUnit: 180,
      subtotalCost: 4500,
    },
    {
      ingredientId: 'DEMO-SKU-015',
      name: 'Susu UHT Full Cream Fresh Milk 1L',
      ingredientName: 'Susu UHT Full Cream Fresh Milk 1L',
      qty: 200,
      portionQty: 200,
      unit: 'ml',
      costPerUnit: 22,
      subtotalCost: 4400,
    },
    {
      ingredientId: 'DEMO-SKU-016',
      name: 'Sirup Gula Aren Organik 1L',
      ingredientName: 'Sirup Gula Aren Organik 1L',
      qty: 15,
      portionQty: 15,
      unit: 'ml',
      costPerUnit: 60,
      subtotalCost: 900,
    },
  ];
  const bom2Hpp = 13000;
  const bom2Prices = calcMultiTierPrices(bom2Hpp);
  const bom2Costing: FBMenuCosting = {
    recipe: bom2Recipe.map((r) => ({
      ingredientId: r.ingredientId,
      ingredientName: r.name,
      portionQty: r.qty,
      unit: r.unit,
      costPerUnit: r.costPerUnit,
      subtotalCost: r.subtotalCost || r.qty * r.costPerUnit,
      name: r.name,
      qty: r.qty,
    })),
    wastePercentage: 0,
    rawMaterialHPP: 9800,
    rawMaterialCost: 9800,
    operationalCost: 3200,
    totalCost: bom2Hpp,
    targetMarginPercent: 20,
    calculatedSellingPrice: bom2Prices.retail,
    recommendedPrice: bom2Prices.retail,
    actualPrice: bom2Prices.retail,
  };

  const productSpecs: RawProductSpec[] = [
    {
      id: 'DEMO-SKU-001',
      barcode: '8991001000018',
      name: 'Beras Premium Pandan Wangi 5Kg',
      category: 'Rice',
      categoryCode: 21,
      brand: 'Topi Koki',
      unit: 'Karung',
      hpp: 65000,
      minStock: 12,
      rackLocation: 'RAK-A01',
      supplierId: 'SUP-DEMO-01',
      supplierName: 'PT Indofood Distribusi Nusantara',
    },
    {
      id: 'DEMO-SKU-002',
      barcode: '8991001000025',
      name: 'Minyak Goreng Bimoli Pouch 2L',
      category: 'Cooking Oil',
      categoryCode: 2,
      brand: 'Bimoli',
      unit: 'Pouch',
      hpp: 32000,
      minStock: 20,
      rackLocation: 'RAK-A02',
      supplierId: 'SUP-DEMO-01',
      supplierName: 'PT Indofood Distribusi Nusantara',
    },
    {
      id: 'DEMO-SKU-003',
      barcode: '8991001000032',
      name: 'Indomie Goreng Original 85g (Isi 5)',
      category: 'Instant Noodle',
      categoryCode: 8,
      brand: 'Indomie',
      unit: 'Pack',
      hpp: 14000,
      minStock: 30,
      rackLocation: 'RAK-B01',
      supplierId: 'SUP-DEMO-01',
      supplierName: 'PT Indofood Distribusi Nusantara',
    },
    {
      id: 'DEMO-SKU-004',
      barcode: '8991001000049',
      name: 'Kecap Manis Bango Refill 520ml',
      category: 'Sweet Soy Sauce',
      categoryCode: 20,
      brand: 'Bango',
      unit: 'Pouch',
      hpp: 21000,
      minStock: 15,
      rackLocation: 'RAK-B02',
      supplierId: 'SUP-DEMO-02',
      supplierName: 'PT Unilever Niaga Sejahtera',
    },
    {
      id: 'DEMO-SKU-005',
      barcode: '8991001000056',
      name: 'Air Mineral Le Minerale 600ml (Dus 24)',
      category: 'Mineral Water',
      categoryCode: 9,
      brand: 'Le Minerale',
      unit: 'Dus',
      hpp: 45000,
      minStock: 15,
      rackLocation: 'RAK-C01',
      supplierId: 'SUP-DEMO-03',
      supplierName: 'PT Mayora Prima Niaga',
    },
    {
      id: 'DEMO-SKU-006',
      barcode: '8991001000063',
      name: 'Teh Pucuk Harum Melati 350ml',
      category: 'Tea',
      categoryCode: 5,
      brand: 'Mayora',
      unit: 'Botol',
      hpp: 3000,
      minStock: 48,
      rackLocation: 'CHILLER-02',
      supplierId: 'SUP-DEMO-03',
      supplierName: 'PT Mayora Prima Niaga',
    },
    {
      id: 'DEMO-SKU-007',
      barcode: '8991001000070',
      name: 'Roma Malkist Crackers 135g',
      category: 'Biscuit',
      categoryCode: 7,
      brand: 'Roma',
      unit: 'Pack',
      hpp: 7500,
      minStock: 25,
      rackLocation: 'RAK-D01',
      supplierId: 'SUP-DEMO-03',
      supplierName: 'PT Mayora Prima Niaga',
    },
    {
      id: 'DEMO-SKU-008',
      barcode: '8991001000087',
      name: 'Chitato Sapi Panggang 68g',
      category: 'Snack',
      categoryCode: 6,
      brand: 'Chitato',
      unit: 'Pcs',
      hpp: 9500,
      minStock: 25,
      rackLocation: 'RAK-D02',
      supplierId: 'SUP-DEMO-01',
      supplierName: 'PT Indofood Distribusi Nusantara',
    },
    {
      id: 'DEMO-SKU-009',
      barcode: '8991001000094',
      name: 'Rinso Anti Noda Deterjen Cair 750ml',
      category: 'Detergent',
      categoryCode: 13,
      brand: 'Rinso',
      unit: 'Pouch',
      hpp: 20000,
      minStock: 15,
      rackLocation: 'RAK-E01',
      supplierId: 'SUP-DEMO-02',
      supplierName: 'PT Unilever Niaga Sejahtera',
    },
    {
      id: 'DEMO-SKU-010',
      barcode: '8991001000100',
      name: 'Sunlight Jeruk Nipis Refill 650ml',
      category: 'Dishwashing Liquid',
      categoryCode: 25,
      brand: 'Sunlight',
      unit: 'Pouch',
      hpp: 12500,
      minStock: 20,
      rackLocation: 'RAK-E02',
      supplierId: 'SUP-DEMO-02',
      supplierName: 'PT Unilever Niaga Sejahtera',
    },
    {
      id: 'DEMO-SKU-011',
      barcode: '8991001000117',
      name: 'Lifebuoy Sabun Cair Total 10 400ml',
      category: 'Toilet Soap',
      categoryCode: 14,
      brand: 'Lifebuoy',
      unit: 'Pouch',
      hpp: 18500,
      minStock: 16,
      rackLocation: 'RAK-F01',
      supplierId: 'SUP-DEMO-02',
      supplierName: 'PT Unilever Niaga Sejahtera',
    },
    {
      id: 'DEMO-SKU-012',
      barcode: '8991001000124',
      name: 'Pepsodent Pasta Gigi Pencegah Berlubang 190g',
      category: 'Toothpaste',
      categoryCode: 16,
      brand: 'Pepsodent',
      unit: 'Pcs',
      hpp: 11000,
      minStock: 20,
      rackLocation: 'RAK-F02',
      supplierId: 'SUP-DEMO-02',
      supplierName: 'PT Unilever Niaga Sejahtera',
    },
    {
      id: 'DEMO-SKU-013',
      barcode: '8991001000131',
      name: 'Tisu Wajah Paseo Smart 250 Sheets',
      category: 'Tissue',
      categoryCode: 17,
      brand: 'Paseo',
      unit: 'Pack',
      hpp: 13000,
      minStock: 20,
      rackLocation: 'RAK-G01',
      supplierId: 'SUP-DEMO-01',
      supplierName: 'PT Indofood Distribusi Nusantara',
    },
    ...rawMaterialSpecs,
    {
      id: 'DEMO-SKU-017',
      barcode: '8991001000179',
      name: 'Es Kopi Susu Gula Aren Signature (BOM)',
      category: 'Coffee',
      categoryCode: 10,
      brand: 'JacS Cafe Bar',
      unit: 'Cup',
      hpp: bom1Hpp,
      minStock: 15,
      rackLocation: 'BAR-CAFE-01',
      supplierId: 'SUP-DEMO-04',
      supplierName: 'CV Mitra Bahan Segar Mandiri',
      itemType: 'MENU_FB',
      recipe: bom1Recipe,
      costing: bom1Costing,
      recipeSummary: '20g Arabika Gayo + 150ml UHT Full Cream + 35ml Sirup Aren',
    },
    {
      id: 'DEMO-SKU-018',
      barcode: '8991001000186',
      name: 'Iced Creamy Caffe Latte 350ml (BOM)',
      category: 'Coffee',
      categoryCode: 10,
      brand: 'JacS Cafe Bar',
      unit: 'Cup',
      hpp: bom2Hpp,
      minStock: 15,
      rackLocation: 'BAR-CAFE-02',
      supplierId: 'SUP-DEMO-04',
      supplierName: 'CV Mitra Bahan Segar Mandiri',
      itemType: 'MENU_FB',
      recipe: bom2Recipe,
      costing: bom2Costing,
      recipeSummary: '25g Arabika Gayo + 200ml UHT Full Cream + 15ml Sirup Aren',
    },
  ];

  const stockTracker: Record<string, number> = {};
  const initialInTracker: Record<string, number> = {};
  const specById = new Map<string, RawProductSpec>();

  productSpecs.forEach((p) => {
    stockTracker[p.id] = 0;
    initialInTracker[p.id] = 0;
    specById.set(p.id, p);
  });

  const buildProductSnapshot = (spec: RawProductSpec, stockQty: number, initialQty: number): Product => {
    const prices = calcMultiTierPrices(spec.hpp);
    return {
      id: spec.id,
      barcode: spec.barcode,
      sku: spec.id,
      name: spec.name,
      category: spec.category,
      categoryCode: spec.categoryCode,
      brand: spec.brand,
      unit: spec.unit,
      stock: stockQty,
      initialStock: initialQty,
      minStock: spec.minStock,
      min_stock: spec.minStock,
      costPrice: spec.hpp,
      cost_price: spec.hpp,
      hpp: spec.hpp,
      buy_price: spec.hpp,
      sellingPrice: prices.retail,
      sell_price: prices.retail,
      retailPrice: prices.retail,
      price: prices.retail,
      price_retail: prices.retail,
      memberPrice: prices.member,
      price_member: prices.member,
      wholesalePrice: prices.grosir,
      price_wholesale: prices.grosir,
      price_distributor: prices.grosir,
      rackLocation: spec.rackLocation,
      supplierId: spec.supplierId,
      supplier: spec.supplierName,
      status: 'Active',
      itemType: spec.itemType || 'RETAIL',
      recipe: spec.recipe,
      costing: spec.costing,
      recipeSummary: spec.recipeSummary,
      packagingCost: spec.costing?.operationalCost,
      businessModel: activeSec.toLowerCase(),
    };
  };

  const stockMutations: StockMutation[] = [];
  let mutSeq = 1;

  const recordMutation = (paramsMut: {
    dateIso: string;
    dateStr: string;
    productId: string;
    type: StockMutation['type'];
    qty: number;
    referenceNo: string;
    operator: string;
    notes: string;
    supplierName?: string;
  }) => {
    const spec = specById.get(paramsMut.productId);
    if (!spec) return;
    const prevStock = stockTracker[paramsMut.productId] || 0;
    const isOut =
      paramsMut.type === 'OUT' ||
      paramsMut.type === 'OUT_SALES' ||
      paramsMut.type === 'OUT / KASIR';
    const nextStock = isOut ? Math.max(0, prevStock - paramsMut.qty) : prevStock + paramsMut.qty;
    stockTracker[paramsMut.productId] = nextStock;
    if (!isOut) {
      initialInTracker[paramsMut.productId] = (initialInTracker[paramsMut.productId] || 0) + paramsMut.qty;
    }

    stockMutations.push({
      id: `MUT-DEMO-${String(mutSeq++).padStart(4, '0')}`,
      timestamp: paramsMut.dateIso,
      date: paramsMut.dateStr,
      product_id: spec.id,
      sku: spec.id,
      product_name: spec.name,
      type: paramsMut.type,
      qty: paramsMut.qty,
      previous_stock: prevStock,
      final_stock: nextStock,
      balanceAfter: nextStock,
      reference_no: paramsMut.referenceNo,
      referenceId: paramsMut.referenceNo,
      operator: paramsMut.operator,
      warehouse: 'Gudang Utama Toko',
      supplier_name: paramsMut.supplierName,
      unit_cost: spec.hpp,
      notes: paramsMut.notes,
    });
  };

  // ============================================================================
  // 3. PURCHASE ORDERS (3 POs: 2 RECEIVED + 1 High-Value PENDING_APPROVAL)
  // ============================================================================
  const po1ItemsRaw = [
    { product_id: 'DEMO-SKU-001', qty: 60 },
    { product_id: 'DEMO-SKU-002', qty: 80 },
    { product_id: 'DEMO-SKU-003', qty: 120 },
    { product_id: 'DEMO-SKU-005', qty: 50 },
    { product_id: 'DEMO-SKU-006', qty: 180 },
    { product_id: 'DEMO-SKU-007', qty: 90 },
    { product_id: 'DEMO-SKU-008', qty: 100 },
    { product_id: 'DEMO-SKU-013', qty: 75 },
  ];

  const po1ItemDetails = po1ItemsRaw.map((row) => {
    const p = specById.get(row.product_id)!;
    return {
      product_id: p.id,
      product_name: p.name,
      qty: row.qty,
      received_qty: row.qty,
      unit: p.unit,
      unit_cost: p.hpp,
      subtotal: row.qty * p.hpp,
    };
  });
  const po1Total = po1ItemDetails.reduce((s, it) => s + it.subtotal, 0);

  const po2ItemsRaw = [
    { product_id: 'DEMO-SKU-004', qty: 70 },
    { product_id: 'DEMO-SKU-009', qty: 65 },
    { product_id: 'DEMO-SKU-010', qty: 80 },
    { product_id: 'DEMO-SKU-011', qty: 60 },
    { product_id: 'DEMO-SKU-012', qty: 90 },
    { product_id: 'DEMO-SKU-014', qty: 18 },
    { product_id: 'DEMO-SKU-015', qty: 60 },
    { product_id: 'DEMO-SKU-016', qty: 24 },
  ];

  const po2ItemDetails = po2ItemsRaw.map((row) => {
    const p = specById.get(row.product_id)!;
    return {
      product_id: p.id,
      product_name: p.name,
      qty: row.qty,
      received_qty: row.qty,
      unit: p.unit,
      unit_cost: p.hpp,
      subtotal: row.qty * p.hpp,
    };
  });
  const po2Total = po2ItemDetails.reduce((s, it) => s + it.subtotal, 0);

  // PO-003: High-value PO waiting for Executive Director Approval (Rp 28.800.000)
  const po3ItemsRaw = [
    { product_id: 'DEMO-SKU-001', qty: 160 },
    { product_id: 'DEMO-SKU-002', qty: 200 },
    { product_id: 'DEMO-SKU-005', qty: 160 },
    { product_id: 'DEMO-SKU-003', qty: 200 },
    { product_id: 'DEMO-SKU-009', qty: 100 },
  ];
  const po3ItemDetails = po3ItemsRaw.map((row) => {
    const p = specById.get(row.product_id)!;
    return {
      product_id: p.id,
      product_name: p.name,
      qty: row.qty,
      received_qty: 0,
      unit: p.unit,
      unit_cost: p.hpp,
      subtotal: row.qty * p.hpp,
    };
  });
  const po3Total = po3ItemDetails.reduce((s, it) => s + it.subtotal, 0);

  const grn1Items: GoodsReceiptItem[] = po1ItemDetails.map((it, idx) => ({
    id: `GRI-DEMO-001-${idx + 1}`,
    poItemId: `POI-001-${idx + 1}`,
    productId: it.product_id,
    productName: it.product_name,
    orderedQty: it.qty,
    receivedQty: it.qty,
    acceptedQty: it.qty,
    rejectedQty: 0,
    unit: it.unit,
    unitCost: it.unit_cost,
    totalCost: it.subtotal,
    product_id: it.product_id,
    product_name: it.product_name,
    ordered_qty: it.qty,
    received_qty: it.qty,
  }));

  const grn2Items: GoodsReceiptItem[] = po2ItemDetails.map((it, idx) => ({
    id: `GRI-DEMO-002-${idx + 1}`,
    poItemId: `POI-002-${idx + 1}`,
    productId: it.product_id,
    productName: it.product_name,
    orderedQty: it.qty,
    receivedQty: it.qty,
    acceptedQty: it.qty,
    rejectedQty: 0,
    unit: it.unit,
    unitCost: it.unit_cost,
    totalCost: it.subtotal,
    product_id: it.product_id,
    product_name: it.product_name,
    ordered_qty: it.qty,
    received_qty: it.qty,
  }));

  const purchaseOrders: PurchaseOrder[] = [
    {
      po_number: 'PO-DEMO-2026-001',
      po_id: 'PO-DEMO-2026-001',
      date: threeDaysAgoStr,
      supplier_id: 'SUP-DEMO-01',
      vendor_id: 'SUP-DEMO-01',
      supplier_name: 'PT Indofood Distribusi Nusantara',
      items: `${po1ItemDetails.length} SKU Sembako, Mie Instan, Minuman & Snack`,
      total_amount: po1Total,
      subtotal: po1Total,
      status: 'RECEIVED',
      payment_term: 'COD',
      payment_status: 'Lunas',
      paid_date: twoDaysAgoStr,
      payment_method: 'TRANSFER',
      payment_source: 'Rekening Bank Utama',
      item_details: po1ItemDetails,
      received_items: grn1Items,
      delivery_order_no: 'SJ-IDF-2026081',
      condition: 'Kondisi Baik',
      received_date: twoDaysAgoStr,
      received_by: 'Dedi Kurniawan',
      created_by: 'Agus Setiawan',
      approved_by: 'Budi Santoso (Director)',
      approved_date: threeDaysAgoStr,
      approvedBy: 'Budi Santoso (Director)',
      approvedAt: makeIsoAtTime(threeDaysAgoDate, 10, 15),
      requiresDirectorApproval: false,
      notes: 'Restok perdana sembako, mie instan, minuman & snack — lunas via Bank Operasional.',
    },
    {
      po_number: 'PO-DEMO-2026-002',
      po_id: 'PO-DEMO-2026-002',
      date: twoDaysAgoStr,
      supplier_id: 'SUP-DEMO-02',
      vendor_id: 'SUP-DEMO-02',
      supplier_name: 'PT Unilever Niaga Sejahtera',
      items: `${po2ItemDetails.length} SKU Personal Care, Home Care & Bahan Cafe`,
      total_amount: po2Total,
      subtotal: po2Total,
      status: 'RECEIVED',
      payment_term: 'Tempo 30 Hari',
      payment_status: 'Belum Bayar',
      due_date: dueIn30DaysStr,
      item_details: po2ItemDetails,
      received_items: grn2Items,
      delivery_order_no: 'SJ-UNL-2026114',
      condition: 'Kondisi Baik',
      received_date: yesterdayStr,
      received_by: 'Dedi Kurniawan',
      created_by: 'Agus Setiawan',
      approved_by: 'Budi Santoso (Director)',
      approved_date: twoDaysAgoStr,
      approvedBy: 'Budi Santoso (Director)',
      approvedAt: makeIsoAtTime(twoDaysAgoDate, 11, 20),
      requiresDirectorApproval: false,
      notes: 'Pengadaan Personal Care, Home Care & bahan baku cafe — Tempo 30 Hari (Hutang AP).',
    },
    {
      po_number: 'PO-DEMO-2026-003',
      po_id: 'PO-DEMO-2026-003',
      date: todayStr,
      supplier_id: 'SUP-DEMO-03',
      vendor_id: 'SUP-DEMO-03',
      supplier_name: 'PT Mayora Prima Niaga',
      items: `${po3ItemDetails.length} SKU Paket Restok Besar Promo Akhir Bulan`,
      total_amount: po3Total,
      subtotal: po3Total,
      status: 'PENDING_APPROVAL',
      payment_term: 'Tempo 14 Hari',
      payment_status: 'Belum Bayar',
      due_date: dueIn14DaysStr,
      item_details: po3ItemDetails,
      created_by: 'Agus Setiawan',
      requiresDirectorApproval: true,
      notes: 'Pengadaan besar stok promo akhir bulan (> Rp 25 Juta) — menunggu persetujuan Direktur di Executive Approval Queue.',
    },
  ];

  const purchaseRequests: PurchaseRequest[] = [
    {
      id: 'PR-DEMO-2026-001',
      pr_number: 'PR-DEMO-2026-001',
      date: todayStr,
      requester_name: 'Dedi Kurniawan (Warehouse Head)',
      department: 'Warehouse & Logistik',
      item_name: 'Paket Restok Promo Akhir Bulan (5 SKU Fast-Moving)',
      qty: 820,
      estimated_cost: po3Total,
      urgency: 'High',
      status: 'Converted to PO',
    },
  ];

  const grn1Time = makeIsoAtTime(twoDaysAgoDate, 9, 30);
  const grn2Time = makeIsoAtTime(yesterdayDate, 8, 45);

  const goodsReceipts: GoodsReceipt[] = [
    {
      id: 'GRN-DEMO-2026-001',
      poId: 'PO-DEMO-2026-001',
      poNumber: 'PO-DEMO-2026-001',
      vendorId: 'SUP-DEMO-01',
      vendorName: 'PT Indofood Distribusi Nusantara',
      warehouseId: 'WH-MAIN-01',
      deliveryOrderNumber: 'SJ-IDF-2026081',
      receivedDate: twoDaysAgoStr,
      receivedByUserId: 'EMP-DEMO-04',
      status: 'VERIFIED',
      items: grn1Items,
      totalAmount: po1Total,
      notes: 'Penerimaan penuh 100% sesuai surat jalan SJ-IDF-2026081.',
      idempotencyKey: 'IDEMP-GRN-DEMO-2026-001',
    },
    {
      id: 'GRN-DEMO-2026-002',
      poId: 'PO-DEMO-2026-002',
      poNumber: 'PO-DEMO-2026-002',
      vendorId: 'SUP-DEMO-02',
      vendorName: 'PT Unilever Niaga Sejahtera',
      warehouseId: 'WH-MAIN-01',
      deliveryOrderNumber: 'SJ-UNL-2026114',
      receivedDate: yesterdayStr,
      receivedByUserId: 'EMP-DEMO-04',
      status: 'VERIFIED',
      items: grn2Items,
      totalAmount: po2Total,
      notes: 'Penerimaan penuh 100% — tercatat sebagai Hutang Dagang Tempo 30 Hari.',
      idempotencyKey: 'IDEMP-GRN-DEMO-2026-002',
    },
  ];

  // Record Stock Mutations IN from PO-001 & PO-002
  po1ItemDetails.forEach((it) => {
    recordMutation({
      dateIso: grn1Time,
      dateStr: twoDaysAgoStr,
      productId: it.product_id,
      type: 'IN_PURCHASE',
      qty: it.qty,
      referenceNo: 'GRN-DEMO-2026-001',
      operator: 'Dedi Kurniawan (Warehouse)',
      supplierName: 'PT Indofood Distribusi Nusantara',
      notes: 'Penerimaan barang PO-DEMO-2026-001 (PT Indofood Distribusi Nusantara)',
    });
  });

  po2ItemDetails.forEach((it) => {
    recordMutation({
      dateIso: grn2Time,
      dateStr: yesterdayStr,
      productId: it.product_id,
      type: 'IN_PURCHASE',
      qty: it.qty,
      referenceNo: 'GRN-DEMO-2026-002',
      operator: 'Dedi Kurniawan (Warehouse)',
      supplierName: 'PT Unilever Niaga Sejahtera',
      notes: 'Penerimaan barang PO-DEMO-2026-002 (PT Unilever Niaga Sejahtera)',
    });
  });

  // Initial production capacity for the 2 BOM products
  recordMutation({
    dateIso: makeIsoAtTime(yesterdayDate, 9, 0),
    dateStr: yesterdayStr,
    productId: 'DEMO-SKU-017',
    type: 'IN',
    qty: 60,
    referenceNo: 'PROD-BOM-2026-001',
    operator: 'Dedi Kurniawan (Warehouse)',
    notes: 'Alokasi kapasitas produksi menu BOM Es Kopi Susu Gula Aren dari stok bahan baku',
  });
  recordMutation({
    dateIso: makeIsoAtTime(yesterdayDate, 9, 5),
    dateStr: yesterdayStr,
    productId: 'DEMO-SKU-018',
    type: 'IN',
    qty: 50,
    referenceNo: 'PROD-BOM-2026-002',
    operator: 'Dedi Kurniawan (Warehouse)',
    notes: 'Alokasi kapasitas produksi menu BOM Iced Creamy Caffe Latte dari stok bahan baku',
  });

  // ============================================================================
  // 4. CUSTOMERS / MEMBERS (5 Customers including VIP Platinum)
  // ============================================================================
  const customers: CustomerMaster[] = [
    {
      id: 'CUST-DEMO-01',
      code: 'MBR-VIP-001',
      customer_code: 'MBR-VIP-001',
      name: 'dr. Nadia Kusuma Wardani',
      phone: '0812-8890-1122',
      email: 'nadia.kusuma@gmail.com',
      memberTier: 'Platinum',
      tier: 'MEMBER',
      tier_level: 'Platinum',
      points: 2450,
      totalSpent: 14850000,
      total_spending_current_period: 4850000,
      status: 'Active',
      is_active: true,
      allowed_tiers: ['RETAIL', 'MEMBER', 'WHOLESALE'],
      notes: 'Pelanggan VIP Platinum aktif — rutin belanja bulanan & kopi signature.',
    },
    {
      id: 'CUST-DEMO-02',
      code: 'MBR-GLD-002',
      customer_code: 'MBR-GLD-002',
      name: 'Hendra Gunawan',
      phone: '0813-7745-9901',
      email: 'hendra.gunawan@yahoo.com',
      memberTier: 'Gold',
      tier: 'MEMBER',
      tier_level: 'Gold',
      points: 1180,
      totalSpent: 6420000,
      total_spending_current_period: 2150000,
      status: 'Active',
      is_active: true,
      allowed_tiers: ['RETAIL', 'MEMBER'],
      notes: 'Member Gold setia — sering transaksi via EDC Debit & QRIS.',
    },
    {
      id: 'CUST-DEMO-03',
      code: 'MBR-VIP-003',
      customer_code: 'MBR-VIP-003',
      name: 'Toko Kelontong Berkah Jaya',
      phone: '0811-9920-3344',
      email: 'berkahjaya.mart@gmail.com',
      memberTier: 'Platinum',
      tier: 'WHOLESALE',
      tier_level: 'Platinum',
      points: 3820,
      totalSpent: 34200000,
      total_spending_current_period: 9600000,
      status: 'Active',
      is_active: true,
      allowed_tiers: ['RETAIL', 'MEMBER', 'WHOLESALE'],
      has_store: true,
      store_name: 'Toko Kelontong Berkah Jaya',
      store_address: 'Jl. Pasar Minggu Raya No. 108, Jakarta Selatan',
      notes: 'Mitra reseller VIP dengan harga Grosir (+10%) & transfer bank.',
    },
    {
      id: 'CUST-DEMO-04',
      code: 'MBR-SLV-004',
      customer_code: 'MBR-SLV-004',
      name: 'Siti Rahmawati',
      phone: '0856-9123-4480',
      email: 'siti.rahma@gmail.com',
      memberTier: 'Silver',
      tier: 'MEMBER',
      tier_level: 'Silver',
      points: 460,
      totalSpent: 2180000,
      total_spending_current_period: 780000,
      status: 'Active',
      is_active: true,
      allowed_tiers: ['RETAIL', 'MEMBER'],
      notes: 'Member Silver reguler.',
    },
    {
      id: 'CUST-DEMO-05',
      code: 'MBR-CORP-005',
      customer_code: 'MBR-CORP-005',
      name: 'CV Katering Nusantara Prima',
      phone: '021-79184455',
      email: 'procurement@kateringnusantara.co.id',
      memberTier: 'Gold',
      tier: 'WHOLESALE',
      tier_level: 'Gold',
      points: 910,
      totalSpent: 12600000,
      total_spending_current_period: 3420000,
      status: 'Active',
      is_active: true,
      allowed_tiers: ['RETAIL', 'MEMBER', 'WHOLESALE'],
      credit_limit: 25000000,
      outstanding_balance: 2420000,
      notes: 'Klien korporat B2B dengan fasilitas invoice tempo 14 hari.',
    },
  ];

  // ============================================================================
  // 5. HR EMPLOYEES (6 Active Employees) + TODAY'S ATTENDANCE + LEAVES
  // ============================================================================
  const employees: Employee[] = [
    {
      id: 'EMP-DEMO-01',
      nip: 'EMP-2026-001',
      name: 'Budi Santoso',
      division: 'executive',
      role: 'Store Director',
      pin: '111111',
      avatarUrl: null,
      avatar: null,
      department: 'Executive & Management',
      contractStatus: 'Tetap',
      status: 'Active',
      joinDate: '2024-01-10',
      baseSalary: 14500000,
      dailyAllowanceRate: 100000,
      attendedDays: 22,
      bpjsEnabled: true,
      payrollStatus: 'PENDING',
      phone: '0811-1001-2001',
      email: 'budi.santoso@indonesiamidi.id',
      shift: 'Full Day (08:00 - 17:00)',
      leaveQuota: { total: 12, used: 2, remaining: 10 },
    },
    {
      id: 'EMP-DEMO-02',
      nip: 'EMP-2026-002',
      name: 'Rina Melati',
      division: 'finance',
      role: 'Finance Manager',
      pin: '222222',
      avatarUrl: null,
      avatar: null,
      department: 'Finance & Accounting',
      contractStatus: 'Tetap',
      status: 'Active',
      joinDate: '2024-03-01',
      baseSalary: 9800000,
      dailyAllowanceRate: 75000,
      attendedDays: 22,
      bpjsEnabled: true,
      payrollStatus: 'PENDING',
      phone: '0812-1002-2002',
      email: 'rina.melati@indonesiamidi.id',
      shift: 'Shift Pagi (08:00 - 17:00)',
      leaveQuota: { total: 12, used: 3, remaining: 9 },
    },
    {
      id: 'EMP-DEMO-03',
      nip: 'EMP-2026-003',
      name: 'Agus Setiawan',
      division: 'purchasing',
      role: 'Purchasing Supervisor',
      pin: '333333',
      avatarUrl: null,
      avatar: null,
      department: 'Purchasing',
      contractStatus: 'Tetap',
      status: 'Active',
      joinDate: '2024-04-15',
      baseSalary: 8200000,
      dailyAllowanceRate: 65000,
      attendedDays: 21,
      bpjsEnabled: true,
      payrollStatus: 'PENDING',
      phone: '0813-1003-2003',
      email: 'agus.setiawan@indonesiamidi.id',
      shift: 'Shift Pagi (08:00 - 17:00)',
      leaveQuota: { total: 12, used: 4, remaining: 8 },
    },
    {
      id: 'EMP-DEMO-04',
      nip: 'EMP-2026-004',
      name: 'Dedi Kurniawan',
      division: 'warehouse',
      role: 'Warehouse Head',
      pin: '444444',
      avatarUrl: null,
      avatar: null,
      department: 'Warehouse & Logistik',
      contractStatus: 'Tetap',
      status: 'Active',
      joinDate: '2024-05-20',
      baseSalary: 7500000,
      dailyAllowanceRate: 60000,
      attendedDays: 22,
      bpjsEnabled: true,
      payrollStatus: 'PENDING',
      phone: '0815-1004-2004',
      email: 'dedi.kurniawan@indonesiamidi.id',
      shift: 'Shift Pagi (07:30 - 16:30)',
      leaveQuota: { total: 12, used: 2, remaining: 10 },
    },
    {
      id: 'EMP-DEMO-05',
      nip: 'EMP-2026-005',
      name: 'Maya Putri Lestari',
      division: 'hr',
      role: 'HR & Payroll Officer',
      pin: '555555',
      avatarUrl: null,
      avatar: null,
      department: 'Human Resources & Personalia',
      contractStatus: 'Tetap',
      status: 'Active',
      joinDate: '2024-07-01',
      baseSalary: 7800000,
      dailyAllowanceRate: 60000,
      attendedDays: 22,
      bpjsEnabled: true,
      payrollStatus: 'PENDING',
      phone: '0817-1005-2005',
      email: 'maya.putri@indonesiamidi.id',
      shift: 'Shift Pagi (08:30 - 17:30)',
      leaveQuota: { total: 12, used: 1, remaining: 11 },
    },
    {
      id: 'EMP-DEMO-06',
      nip: 'EMP-2026-006',
      name: 'Siska Wulandari',
      division: 'pos',
      role: 'Senior Kasir POS-01',
      pin: '666666',
      avatarUrl: null,
      avatar: null,
      department: 'POS & Kasir',
      contractStatus: 'Tetap',
      status: 'Active',
      joinDate: '2024-08-12',
      baseSalary: 5600000,
      dailyAllowanceRate: 50000,
      attendedDays: 22,
      cashierCommissionRate: 0.5,
      bpjsEnabled: true,
      payrollStatus: 'PENDING',
      phone: '0856-1006-2006',
      email: 'siska.wulandari@indonesiamidi.id',
      shift: 'Shift Pagi (07:00 - 15:00)',
      leaveQuota: { total: 12, used: 2, remaining: 10 },
    },
  ];

  const attendance: AttendanceRecord[] = [
    {
      id: `ATT-DEMO-${todayStr}-01`,
      employeeId: 'EMP-DEMO-01',
      nip: 'EMP-2026-001',
      employeeName: 'Budi Santoso',
      avatar: null,
      department: 'Executive & Management',
      date: todayStr,
      clockIn: '07:52',
      clockOut: null,
      status: 'Tepat Waktu',
      shift: 'Full Day (08:00 - 17:00)',
      notes: 'Hadir tepat waktu — review Executive Approval PO',
      location: `${activeBiz} HQ`,
    },
    {
      id: `ATT-DEMO-${todayStr}-02`,
      employeeId: 'EMP-DEMO-02',
      nip: 'EMP-2026-002',
      employeeName: 'Rina Melati',
      avatar: null,
      department: 'Finance & Accounting',
      date: todayStr,
      clockIn: '07:58',
      clockOut: null,
      status: 'Tepat Waktu',
      shift: 'Shift Pagi (08:00 - 17:00)',
      notes: 'Rekonsiliasi jurnal harian & AP/AR',
      location: `${activeBiz} HQ`,
    },
    {
      id: `ATT-DEMO-${todayStr}-03`,
      employeeId: 'EMP-DEMO-03',
      nip: 'EMP-2026-003',
      employeeName: 'Agus Setiawan',
      avatar: null,
      department: 'Purchasing',
      date: todayStr,
      clockIn: '08:11',
      clockOut: null,
      status: 'Terlambat',
      shift: 'Shift Pagi (08:00 - 17:00)',
      notes: 'Terlambat 11 menit (koordinasi supplier pagi)',
      location: `${activeBiz} HQ`,
    },
    {
      id: `ATT-DEMO-${todayStr}-04`,
      employeeId: 'EMP-DEMO-04',
      nip: 'EMP-2026-004',
      employeeName: 'Dedi Kurniawan',
      avatar: null,
      department: 'Warehouse & Logistik',
      date: todayStr,
      clockIn: '07:24',
      clockOut: null,
      status: 'Tepat Waktu',
      shift: 'Shift Pagi (07:30 - 16:30)',
      notes: 'Stock opname rak pagi & validasi kartu stok',
      location: 'Gudang Utama Toko',
    },
    {
      id: `ATT-DEMO-${todayStr}-05`,
      employeeId: 'EMP-DEMO-05',
      nip: 'EMP-2026-005',
      employeeName: 'Maya Putri Lestari',
      avatar: null,
      department: 'Human Resources & Personalia',
      date: todayStr,
      clockIn: '08:22',
      clockOut: null,
      status: 'Tepat Waktu',
      shift: 'Shift Pagi (08:30 - 17:30)',
      notes: 'Monitoring absensi & jadwal shift kasir',
      location: `${activeBiz} HQ`,
    },
    {
      id: `ATT-DEMO-${todayStr}-06`,
      employeeId: 'EMP-DEMO-06',
      nip: 'EMP-2026-006',
      employeeName: 'Siska Wulandari',
      avatar: null,
      department: 'POS & Kasir',
      date: todayStr,
      clockIn: '06:51',
      clockOut: null,
      status: 'Tepat Waktu',
      shift: 'Shift Pagi (07:00 - 15:00)',
      notes: 'Buka shift POS-01 aktif (Modal Laci Rp 1.000.000)',
      location: 'Loket Kasir POS-01',
    },
  ];

  const leaves: LeaveRequest[] = [
    {
      id: 'LV-DEMO-001',
      ticketNumber: 'CUTI-2026-001',
      employeeId: 'EMP-DEMO-04',
      nip: 'EMP-2026-004',
      employeeName: 'Dedi Kurniawan',
      department: 'Warehouse & Logistik',
      type: 'Cuti Tahunan',
      startDate: formatLocalDate(addDays(todayDate, 5)),
      endDate: formatLocalDate(addDays(todayDate, 6)),
      durationDays: 2,
      reason: 'Keperluan keluarga di luar kota',
      status: 'Menunggu',
      submittedAt: makeIsoAtTime(todayDate, 8, 15),
    },
    {
      id: 'LV-DEMO-002',
      ticketNumber: 'CUTI-2026-002',
      employeeId: 'EMP-DEMO-03',
      nip: 'EMP-2026-003',
      employeeName: 'Agus Setiawan',
      department: 'Purchasing',
      type: 'Cuti Tahunan',
      startDate: formatLocalDate(addDays(todayDate, -10)),
      endDate: formatLocalDate(addDays(todayDate, -9)),
      durationDays: 2,
      reason: 'Cuti tahunan terjadwal',
      status: 'Disetujui',
      submittedAt: makeIsoAtTime(addDays(todayDate, -14), 10, 0),
      approvedBy: 'Budi Santoso (Director)',
      approvalNotes: 'Disetujui sesuai kuota cuti tahunan.',
    },
  ];

  // ============================================================================
  // 6. 12 REALISTIC POS SALES (4 Yesterday Closed Shift + 8 Today Open Shift)
  // ============================================================================
  interface DemoSaleBlueprint {
    seq: number;
    dayOffset: -1 | 0;
    hour: number;
    minute: number;
    paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER' | 'EDC_DEBIT';
    priceTier: PriceTier;
    customerId?: string;
    items: Array<{ productId: string; qty: number }>;
  }

  const saleBlueprints: DemoSaleBlueprint[] = [
    // --- YESTERDAY (4 Sales — Closed Shift Z-Report) ---
    {
      seq: 1,
      dayOffset: -1,
      hour: 9,
      minute: 18,
      paymentMethod: 'CASH',
      priceTier: 'RETAIL',
      items: [
        { productId: 'DEMO-SKU-001', qty: 2 },
        { productId: 'DEMO-SKU-002', qty: 2 },
        { productId: 'DEMO-SKU-003', qty: 3 },
      ],
    },
    {
      seq: 2,
      dayOffset: -1,
      hour: 11,
      minute: 42,
      paymentMethod: 'QRIS',
      priceTier: 'MEMBER',
      customerId: 'CUST-DEMO-04',
      items: [
        { productId: 'DEMO-SKU-009', qty: 2 },
        { productId: 'DEMO-SKU-010', qty: 2 },
        { productId: 'DEMO-SKU-011', qty: 1 },
        { productId: 'DEMO-SKU-017', qty: 2 },
      ],
    },
    {
      seq: 3,
      dayOffset: -1,
      hour: 14,
      minute: 15,
      paymentMethod: 'TRANSFER',
      priceTier: 'WHOLESALE',
      customerId: 'CUST-DEMO-03',
      items: [
        { productId: 'DEMO-SKU-001', qty: 10 },
        { productId: 'DEMO-SKU-002', qty: 12 },
        { productId: 'DEMO-SKU-003', qty: 20 },
        { productId: 'DEMO-SKU-005', qty: 8 },
      ],
    },
    {
      seq: 4,
      dayOffset: -1,
      hour: 16,
      minute: 35,
      paymentMethod: 'CASH',
      priceTier: 'RETAIL',
      items: [
        { productId: 'DEMO-SKU-006', qty: 6 },
        { productId: 'DEMO-SKU-007', qty: 3 },
        { productId: 'DEMO-SKU-008', qty: 4 },
        { productId: 'DEMO-SKU-018', qty: 2 },
      ],
    },

    // --- TODAY (8 Sales — Active Open Shift POS-01) ---
    {
      seq: 5,
      dayOffset: 0,
      hour: 7,
      minute: 45,
      paymentMethod: 'CASH',
      priceTier: 'RETAIL',
      items: [
        { productId: 'DEMO-SKU-017', qty: 3 },
        { productId: 'DEMO-SKU-018', qty: 2 },
        { productId: 'DEMO-SKU-007', qty: 2 },
      ],
    },
    {
      seq: 6,
      dayOffset: 0,
      hour: 8,
      minute: 30,
      paymentMethod: 'QRIS',
      priceTier: 'MEMBER',
      customerId: 'CUST-DEMO-01',
      items: [
        { productId: 'DEMO-SKU-001', qty: 3 },
        { productId: 'DEMO-SKU-002', qty: 4 },
        { productId: 'DEMO-SKU-004', qty: 2 },
        { productId: 'DEMO-SKU-015', qty: 4 },
        { productId: 'DEMO-SKU-017', qty: 2 },
      ],
    },
    {
      seq: 7,
      dayOffset: 0,
      hour: 9,
      minute: 12,
      paymentMethod: 'CASH',
      priceTier: 'RETAIL',
      items: [
        { productId: 'DEMO-SKU-003', qty: 5 },
        { productId: 'DEMO-SKU-006', qty: 8 },
        { productId: 'DEMO-SKU-012', qty: 2 },
        { productId: 'DEMO-SKU-013', qty: 2 },
      ],
    },
    {
      seq: 8,
      dayOffset: 0,
      hour: 10,
      minute: 5,
      paymentMethod: 'EDC_DEBIT',
      priceTier: 'MEMBER',
      customerId: 'CUST-DEMO-02',
      items: [
        { productId: 'DEMO-SKU-009', qty: 3 },
        { productId: 'DEMO-SKU-010', qty: 3 },
        { productId: 'DEMO-SKU-011', qty: 2 },
        { productId: 'DEMO-SKU-013', qty: 3 },
        { productId: 'DEMO-SKU-014', qty: 1 },
      ],
    },
    {
      seq: 9,
      dayOffset: 0,
      hour: 10,
      minute: 48,
      paymentMethod: 'QRIS',
      priceTier: 'RETAIL',
      items: [
        { productId: 'DEMO-SKU-008', qty: 5 },
        { productId: 'DEMO-SKU-006', qty: 6 },
        { productId: 'DEMO-SKU-017', qty: 4 },
        { productId: 'DEMO-SKU-018', qty: 3 },
      ],
    },
    {
      seq: 10,
      dayOffset: 0,
      hour: 11,
      minute: 25,
      paymentMethod: 'TRANSFER',
      priceTier: 'WHOLESALE',
      customerId: 'CUST-DEMO-03',
      items: [
        { productId: 'DEMO-SKU-001', qty: 8 },
        { productId: 'DEMO-SKU-005', qty: 10 },
        { productId: 'DEMO-SKU-003', qty: 15 },
        { productId: 'DEMO-SKU-002', qty: 8 },
      ],
    },
    {
      seq: 11,
      dayOffset: 0,
      hour: 12,
      minute: 10,
      paymentMethod: 'CASH',
      priceTier: 'RETAIL',
      items: [
        { productId: 'DEMO-SKU-004', qty: 2 },
        { productId: 'DEMO-SKU-007', qty: 4 },
        { productId: 'DEMO-SKU-012', qty: 3 },
        { productId: 'DEMO-SKU-015', qty: 2 },
      ],
    },
    {
      seq: 12,
      dayOffset: 0,
      hour: 13,
      minute: 20,
      paymentMethod: 'QRIS',
      priceTier: 'MEMBER',
      customerId: 'CUST-DEMO-01',
      items: [
        { productId: 'DEMO-SKU-014', qty: 2 },
        { productId: 'DEMO-SKU-016', qty: 2 },
        { productId: 'DEMO-SKU-017', qty: 3 },
        { productId: 'DEMO-SKU-018', qty: 2 },
      ],
    },
  ];

  const customerById = new Map<string, CustomerMaster>();
  customers.forEach((c) => customerById.set(c.id, c));

  const sales: Sale[] = [];
  const financeEntries: FinanceEntry[] = [];
  const journalEntries: JournalEntry[] = [];

  // Opening Capital Journal (Balanced: Dr 201.000.000 === Cr 201.000.000)
  journalEntries.push({
    id: 'JV-DEMO-OPEN-001',
    date: threeDaysAgoStr,
    reference: 'OPENING-BALANCE-2026',
    description: `Modal Awal Operasional & Saldo Kas/Bank (${activeBiz})`,
    type: 'GENERAL_JOURNAL',
    amount: 201000000,
    totalDebit: 201000000,
    totalCredit: 201000000,
    businessSector: activeSec,
    businessName: activeBiz,
    isDemoSeed: false,
    lines: [
      { accountCode: '1-10000', accountName: 'Kas Utama / Brankas', debit: 50000000, credit: 0 },
      { accountCode: '1-10001', accountName: 'Kas Kasir (Laci POS)', debit: 1000000, credit: 0 },
      { accountCode: '1-10002', accountName: 'Bank Operasional Utama', debit: 150000000, credit: 0 },
      { accountCode: '3-10001', accountName: 'Modal Disetor Pemilik', debit: 0, credit: 201000000 },
    ],
  });

  // PO-001 Journal & Finance Entry (Received & Paid via Bank)
  journalEntries.push({
    id: 'JV-DEMO-PO-001',
    date: twoDaysAgoStr,
    reference: 'PO-DEMO-2026-001',
    description: 'Pembelian & Penerimaan Persediaan PO-DEMO-2026-001 (PT Indofood Distribusi Nusantara — Lunas)',
    type: 'PURCHASE',
    amount: po1Total,
    totalDebit: po1Total,
    totalCredit: po1Total,
    businessSector: activeSec,
    businessName: activeBiz,
    isDemoSeed: false,
    lines: [
      { accountCode: '1-10201', accountName: 'Persediaan Barang Dagang', debit: po1Total, credit: 0 },
      { accountCode: '1-10002', accountName: 'Bank Operasional Utama', debit: 0, credit: po1Total },
    ],
  });

  financeEntries.push({
    id: 'FIN-DEMO-PO-001',
    date: twoDaysAgoStr,
    type: 'EXPENSE',
    category: 'Pembelian Persediaan (PO)',
    description: 'Pelunasan PO-DEMO-2026-001 — PT Indofood Distribusi Nusantara',
    amount: po1Total,
    payment_method: 'TRANSFER',
    reference: 'PO-DEMO-2026-001',
    account_target: '1-10002 · Bank Operasional Utama',
    created_at: grn1Time,
    businessSector: activeSec,
    businessName: activeBiz,
    isDemoSeed: false,
  });

  // PO-002 Journal (Received on Credit -> AP 2-10101)
  journalEntries.push({
    id: 'JV-DEMO-PO-002',
    date: yesterdayStr,
    reference: 'PO-DEMO-2026-002',
    description: 'Penerimaan Persediaan Tempo 30 Hari PO-DEMO-2026-002 (PT Unilever Niaga Sejahtera)',
    type: 'PURCHASE',
    amount: po2Total,
    totalDebit: po2Total,
    totalCredit: po2Total,
    businessSector: activeSec,
    businessName: activeBiz,
    isDemoSeed: false,
    lines: [
      { accountCode: '1-10201', accountName: 'Persediaan Barang Dagang', debit: po2Total, credit: 0 },
      { accountCode: '2-10101', accountName: 'Hutang Dagang (AP)', debit: 0, credit: po2Total },
    ],
  });

  // Operational Expense (Electricity & Internet)
  const opexAmount = 1450000;
  journalEntries.push({
    id: 'JV-DEMO-OPEX-001',
    date: yesterdayStr,
    reference: 'OPEX-2026-UTIL-01',
    description: 'Pembayaran Tagihan Listrik, Air & Internet Operasional Toko',
    type: 'EXPENSE',
    amount: opexAmount,
    totalDebit: opexAmount,
    totalCredit: opexAmount,
    businessSector: activeSec,
    businessName: activeBiz,
    isDemoSeed: false,
    lines: [
      { accountCode: '5-10004', accountName: 'Beban Operasional', debit: opexAmount, credit: 0 },
      { accountCode: '1-10002', accountName: 'Bank Operasional Utama', debit: 0, credit: opexAmount },
    ],
  });

  financeEntries.push({
    id: 'FIN-DEMO-OPEX-001',
    date: yesterdayStr,
    type: 'EXPENSE',
    category: 'Beban Operasional',
    description: 'Tagihan Listrik, Air & Internet Operasional Toko',
    amount: opexAmount,
    payment_method: 'TRANSFER',
    reference: 'OPEX-2026-UTIL-01',
    account_target: '5-10004 · Beban Operasional',
    created_at: makeIsoAtTime(yesterdayDate, 10, 0),
    businessSector: activeSec,
    businessName: activeBiz,
    isDemoSeed: false,
  });

  // Corporate Receivable Invoice (B2B AR 1-10105)
  const arAmount = 2420000;
  const arHpp = 2200000;
  journalEntries.push({
    id: 'JV-DEMO-AR-001',
    date: yesterdayStr,
    reference: 'INV-B2B-2026-001',
    description: 'Penjualan Tempo 14 Hari — CV Katering Nusantara Prima (Piutang Usaha)',
    type: 'GENERAL_JOURNAL',
    amount: arAmount,
    totalDebit: arAmount + arHpp,
    totalCredit: arAmount + arHpp,
    businessSector: activeSec,
    businessName: activeBiz,
    isDemoSeed: false,
    lines: [
      { accountCode: '1-10105', accountName: 'Piutang Usaha / Pelanggan (AR)', debit: arAmount, credit: 0 },
      { accountCode: '4-10101', accountName: 'Pendapatan Penjualan', debit: 0, credit: arAmount },
      { accountCode: '5-10101', accountName: 'Harga Pokok Penjualan (HPP)', debit: arHpp, credit: 0 },
      { accountCode: '1-10201', accountName: 'Persediaan Barang Dagang', debit: 0, credit: arHpp },
    ],
  });

  const invoicesDue: InvoiceDue[] = [
    {
      id: 'AP-DEMO-2026-001',
      type: 'PAYABLE',
      party_name: 'PT Unilever Niaga Sejahtera',
      vendor: 'PT Unilever Niaga Sejahtera',
      invoice_number: 'INV-UNL-2026-002',
      po_number: 'PO-DEMO-2026-002',
      due_date: dueIn30DaysStr,
      amount: po2Total,
      status: 'Unpaid',
      terms: 'Tempo 30 Hari',
      created_at: grn2Time,
    },
    {
      id: 'AR-DEMO-2026-001',
      type: 'RECEIVABLE',
      party_name: 'CV Katering Nusantara Prima',
      invoice_number: 'INV-B2B-2026-001',
      due_date: dueIn14DaysStr,
      amount: arAmount,
      status: 'Unpaid',
      terms: 'Tempo 14 Hari',
      created_at: makeIsoAtTime(yesterdayDate, 13, 0),
    },
  ];

  // Shift accumulators
  let yesterdayCashSales = 0;
  let yesterdayNonCashSales = 0;
  let yesterdayTxCount = 0;

  let todayCashSales = 0;
  let todayNonCashSales = 0;
  let todayTxCount = 0;

  let totalRevenue = arAmount;
  let totalHpp = arHpp;

  saleBlueprints.forEach((bp) => {
    const baseDate = bp.dayOffset === -1 ? yesterdayDate : todayDate;
    const dateStr = bp.dayOffset === -1 ? yesterdayStr : todayStr;
    const txIso = makeIsoAtTime(baseDate, bp.hour, bp.minute);
    const txId = `INV-DEMO-${String(bp.seq).padStart(4, '0')}`;
    const customer = bp.customerId ? customerById.get(bp.customerId) : undefined;

    let saleHpp = 0;
    const cartItems: CartItem[] = bp.items.map((itemRow) => {
      const p = specById.get(itemRow.productId)!;
      const prices = calcMultiTierPrices(p.hpp);
      const unitPrice =
        bp.priceTier === 'WHOLESALE'
          ? prices.grosir
          : bp.priceTier === 'MEMBER'
          ? prices.member
          : prices.retail;
      const subtotal = unitPrice * itemRow.qty;
      saleHpp += p.hpp * itemRow.qty;

      // Record stock OUT mutation chronologically
      recordMutation({
        dateIso: txIso,
        dateStr,
        productId: p.id,
        type: 'OUT_SALES',
        qty: itemRow.qty,
        referenceNo: txId,
        operator: 'Siska Wulandari (POS-01)',
        notes: `Penjualan POS ${txId} (${bp.paymentMethod} · ${bp.priceTier})`,
      });

      const prodSnapshot = buildProductSnapshot(
        p,
        stockTracker[p.id] || 0,
        initialInTracker[p.id] || 0
      );

      return {
        product: prodSnapshot,
        quantity: itemRow.qty,
        subtotal,
        costPrice: p.hpp,
        selectedPriceTier: bp.priceTier,
        customPrice: unitPrice,
      };
    });

    const saleTotal = cartItems.reduce((s, it) => s + it.subtotal, 0);
    const pointsEarned = customer ? Math.floor(saleTotal / 10000) : 0;
    const itemsSummary = cartItems
      .map((ci) => `${ci.product.name} x${ci.quantity}`)
      .join(', ');

    totalRevenue += saleTotal;
    totalHpp += saleHpp;

    if (bp.dayOffset === -1) {
      yesterdayTxCount += 1;
      if (bp.paymentMethod === 'CASH') yesterdayCashSales += saleTotal;
      else yesterdayNonCashSales += saleTotal;
    } else {
      todayTxCount += 1;
      if (bp.paymentMethod === 'CASH') todayCashSales += saleTotal;
      else todayNonCashSales += saleTotal;
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
      payment_method: bp.paymentMethod,
      amount_paid: saleTotal,
      change_amount: 0,
      points_earned: pointsEarned,
      status: 'COMPLETED',
      shift_id: bp.dayOffset === -1 ? 'SHIFT-DEMO-YESTERDAY' : 'SHIFT-DEMO-TODAY',
      syncStatus: 'SYNCED',
      businessSector: activeSec,
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

    // Balanced Double-Entry Journal for each POS Sale (Revenue + COGS)
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
      businessSector: activeSec,
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
      businessSector: activeSec,
      businessName: activeBiz,
      isDemoSeed: false,
    });
  });

  // ============================================================================
  // 7. CASHIER SHIFTS (1 Active Open Shift Today + 1 Closed Z-Report Yesterday)
  // ============================================================================
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
      notes: 'Shift aktif berjalan hari ini — laci kasir sinkron otomatis dengan 8 transaksi POS.',
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
      notes: 'Z-Report tutup shift kemarin — fisik uang laci cocok 100% tanpa selisih.',
    },
  ];

  // ============================================================================
  // 8. FINALIZE PRODUCTS WITH RECONCILED STOCK & FULL MULTI-TIER ALIASES
  // ============================================================================
  const products: Product[] = productSpecs.map((spec) =>
    buildProductSnapshot(
      spec,
      stockTracker[spec.id] || 0,
      initialInTracker[spec.id] || 0
    )
  );

  // Build Brands & Categories Master aligned with the 18 SKUs
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
    department: code <= 12 || code === 20 || code === 21 ? 'Food & Beverage / Sembako' : 'Home & Personal Care',
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
