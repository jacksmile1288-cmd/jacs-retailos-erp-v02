export type UserRole =
  | 'Super Admin'
  | 'Manager'
  | 'Kasir'
  | 'Inventory Staff'
  | 'Finance Staff'
  | 'HR Staff'
  | 'Purchasing Staff';

export interface User {
  user_id: string;
  id?: string;
  name: string;
  email: string;
  division?: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  pin: string;
  avatar?: string | null;
  avatarUrl?: string | null;
}

export type ProductItemType = 'MENU_FB' | 'RETAIL' | 'RAW_MATERIAL';

// Resep Bahan Mentah Penyusun BOM (Bill of Materials) F&B
export interface RecipeItem {
  ingredientId: string;
  ingredientName: string;
  portionQty: number;      // Jumlah takaran porsi (contoh: 150)
  unit: string;            // gram / ml / pcs
  costPerUnit: number;     // Harga modal per gram/ml
  subtotalCost: number;    // portionQty * costPerUnit
  // Compatibility fields
  name?: string;
  qty?: number;
}

// Model Kalkulasi HPP & Penetapan Harga Jual Menu F&B
export interface FBMenuCosting {
  recipe?: RecipeItem[];         // Skema bahan mentah penyusun
  wastePercentage?: number;      // Default 5%
  rawMaterialHPP?: number;       // Total subtotalCost * (1 + wastePercentage / 100)
  operationalCost: number;       // Biaya gas, listrik, kemasan per porsi
  totalCost?: number;            // rawMaterialHPP + operationalCost
  targetMarginPercent: number;   // Target persentase margin keuntungan
  calculatedSellingPrice?: number; // totalCost / (1 - (targetMarginPercent / 100))
  // Compatibility fields
  rawMaterialCost?: number;     // Total HPP bahan baku (BOM + 5% waste)
  recommendedPrice?: number;    // Harga jual kalkulasi otomatis
  actualPrice?: number;         // Harga jual yang aktif di POS
}

export type FBRecipeCosting = FBMenuCosting;

// Multi-Armada Material Curah (Pick-up, Truk Engkel, Dump Truck, Sak)
export interface BulkFleetTier {
  id: 'PICKUP_RET' | 'TRUCK_ENGKEL' | 'DUMP_TRUCK' | 'SAK_KARUNG';
  name: string; // 'Ret Pick-up' | 'Ret Truk Engkel' | 'Ret Dump Truck Besar' | 'Eceran Karung / Sak'
  volumeM3: number; // 1.2, 3.0, 6.5, 0.03
  suffix: string; // '-PKP', '-ENG', '-TRK', '-SAK'
  price: number;
  costPrice?: number;
  isActive: boolean;
}

// Fraksi Berat Paku & Barang Eceran Timbang
export interface WeightFractionTier {
  id: string; // 'FRAC_1KG' | 'FRAC_050' | 'FRAC_025' | 'FRAC_010'
  name: string; // '1 Kg' | '1/2 Kg (500g)' | '1/4 Kg (250g)' | '1 Ons (100g)'
  fractionKg: number; // 1.0, 0.5, 0.25, 0.1
  price: number;
  isActive: boolean;
}

export interface WeightFractionConfig {
  enabled: boolean;
  baseUnit: 'Kg' | 'Dus';
  dusWeightKg?: number;
  packagingFee?: number;
  fractions: WeightFractionTier[];
}

export interface Product {
  id: string; // Format standar APS POS 1: BRxxxxxx (contoh: BR000001)
  barcode?: string;
  sku?: string; // Kode SKU stok barang resmi APS POS 1
  name: string;
  category?: string;
  brand?: string;
  unit?: string;
  costPrice?: number; // Standar APS POS 1 untuk Harga Modal
  cost_price: number;
  buy_price?: number; // Alias kompatibilitas Harga Beli / Modal (HPP)
  sellingPrice?: number; // Standar APS POS 1 untuk Harga Jual
  sell_price: number;
  stock: number;
  minStock?: number; // Standar APS POS 1 untuk Batas Min Stok
  min_stock?: number;
  status: 'Active' | 'Low Stock' | 'Out of Stock' | 'Discontinued' | 'ACTIVE' | 'DISCONTINUED' | string;
  itemType?: 'MENU_FB' | 'RETAIL' | 'RAW_MATERIAL' | 'SERVICE';
  costing?: FBMenuCosting; // Rincian kalkulasi biaya & HPP Menu F&B
  description?: string; // Deskripsi varian & kemasan produk ERP
  categoryCode?: string | number; // Kode Kategori resmi ERP: 2, 3, 4, 5, 8, 13, 21, 26, dst.
  manufacturer?: string; // Vendor pemasok / Principal
  supplier?: string; // Nama Supplier / Distributor Lokal
  supplierId?: string; // ID Supplier Lokal
  supplierPhone?: string; // Kontak Telepon / WhatsApp Distributor
  supplierWa?: string; // Nomor WhatsApp Distributor resmi
  supplierAddress?: string; // Alamat / Wilayah Distribusi Lokal
  supplierNotes?: string; // Keterangan Tambahan / Term of Payment (TOP / Catatan pengiriman)
  // Multi-Tier Pricing Matrix (Eceran/Retail, Member, Grosir/Wholesale)
  price_retail?: number; // Tier 1: Harga Eceran (Standar Konsumen)
  price_member?: number; // Tier 2: Harga Khusus Member / Pelanggan Terdaftar
  memberPrice?: number;
  price_wholesale?: number; // Tier 3: Harga Grosir / Toko Mitra
  wholesalePrice?: number;
  price_distributor?: number; // Tier Distributor / Agen Partai Besar
  initialStock?: number; // Kapasitas awal tercatat untuk kalkulasi ambang batas alert %
  plu?: string; // Kode unik PLU produk internal
  image?: string;
  size?: string;
  minAlert?: number;
  taxable?: boolean;
  isTaxable?: boolean;
  taxRate?: number;
  taxType?: 'INCLUDE' | 'EXCLUDE';
  rackLocation?: string;
  // F&B specific
  kitchenStation?: string; // Posisi Dapur (KOT)
  spicyOption?: boolean; // Opsi Pedas
  toppingOption?: boolean; // Opsi Topping
  menuStatus?: string; // Status Menu
  orderType?: string; // Tipe Order (Dine-in/Takeaway)
  recipeSummary?: string; // Resep / Bahan Baku Ringkas
  recipe?: RecipeIngredient[]; // Bill of Materials (BOM) Resep Bahan Baku F&B
  wastePercent?: number; // Persentase Waste / Susut bahan baku (default 5%)
  packagingCost?: number; // Biaya Kemasan (Packaging)
  menuType?: 'Makanan' | 'Minuman' | string;
  toppingEnabled?: boolean;
  toppings?: Array<{ id: string; name: string; price: number }>;
  spicyEnabled?: boolean;
  temperatureSugarEnabled?: boolean;
  // Apotek / Farmasi specific
  drugClass?: string; // Golongan
  batchNo?: string; // No Batch
  expDate?: string; // Exp Date
  dosageUnit?: string; // Satuan Dosis
  pharmacyClass?: 'OBAT_BEBAS' | 'OBAT_BEBAS_TERBATAS' | 'OBAT_KERAS' | 'RACIKAN';
  batchNumber?: string;
  expiryDate?: string;
  packagingUnit?: 'Box' | 'Strip' | 'Tablet' | 'Botol' | 'Tube' | string;
  pharmacyFormula?: PharmacyFormulaCosting;
  signa?: string; // Aturan Pakai Obat (e.g. 3 x 1 Kapsul sesudah makan)
  compositionDetails?: string; // Detail Komposisi Etiket Racikan
  // Fashion specific
  parentSku?: string; // SKU Induk
  variantBarcode?: string; // Barcode Varian
  color?: string; // Warna
  variantSize?: string; // Varian Ukuran (S/M/L/XL)
  variantColor?: string; // Pilihan Warna
  tagPrice?: number; // Harga Tag
  // Gadget specific
  deviceType?: string; // Kode Tipe
  imeiSerial?: string; // No IMEI/Serial
  specs?: string; // Spek
  warrantyPeriod?: string; // Masa Garansi
  warrantyMonths?: number | string; // Masa Garansi (Bulan)
  // Services specific
  serviceCode?: string; // Kode Jasa
  serviceDuration?: string | number; // Durasi Layanan (Menit)
  staffCommission?: number; // Komisi Staf
  // Building Materials Depot specific (KASIR 09 & Master Data)
  supportDecimal?: boolean;
  unitSecondary?: string; // Satuan Eceran (e.g. Meter)
  priceSecondary?: number; // Harga Eceran per unitSecondary
  conversionRate?: number; // Nilai konversi (e.g. 1 Batang = 4 Meter)
  materialNature?: 'BULK_CURAH' | 'DIMENSION_CUSTOM' | 'MANUFACTURED';
  customDimension?: { lengthCm?: number; widthCm?: number; thicknessMm?: number };
  bulkUnitType?: 'PICKUP_RET' | 'TRUCK_RET' | 'KUBIK_M3' | 'PIECES' | string;
  deliveryPricingPolicy?: 'INCLUDE_ONGKIR' | 'EXCLUDE_ONGKIR' | 'TIER_DISTANCE';
  defaultLoadingFee?: number; // Upah bongkar kuli
  minOrderQty?: number;
  bulkFleetTiers?: BulkFleetTier[]; // Skema Multi-Armada Material Curah (Pick-up, Engkel, Dump Truck, Sak)
  isWeightFraction?: boolean; // Produk Satuan Timbang / Fraksi Berat (Paku, Kawat, Baut)
  weightFractionConfig?: WeightFractionConfig;
  businessModel?: 'retail' | 'fnb' | 'pharmacy' | 'fashion' | 'gadget' | 'services' | 'building' | string;
}

// Model Menu F&B dengan costing BOM terintegrasi
export interface FBMenuItem extends Product {
  itemType?: 'MENU_FB';
  costing?: FBMenuCosting;
  recipe?: RecipeIngredient[];
}

export interface RecipeIngredient {
  ingredientId: string;
  name: string;
  qty: number;
  unit: string;
  costPerUnit: number;
  ingredientName?: string;
  portionQty?: number;
  subtotalCost?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
  costPrice?: number; // Modal satuan barang (HPP unit cost)
  selectedPriceTier?: PriceTier | string; // Tier harga aktif saat item dimasukkan (RETAIL/MEMBER/WHOLESALE)
  customPrice?: number;
  itemDiscount?: number;
  signa?: string; // Signa / Aturan pakai khusus baris obat di kasir
  selectedUnit?: string; // Satuan aktif (e.g. Sak, Batang, Meter, Roll)
  isRetailUnit?: boolean; // Mode eceran (e.g. Meteran vs Batangan/Roll)
  deliveryMethod?: 'DIRECT' | 'FLEET_DELIVERY'; // Bawa Langsung vs Armada Toko
  modifiers?: {
    tableNumber?: string;
    orderType?: 'Dine-In' | 'Take-Away';
    spicyLevel?: number;
    toppings?: string[];
    temperature?: string;
    sugarLevel?: string;
    notes?: string;
    variant?: string;
  };
}

// POS Payment Integration Payload (APS POS5)
export interface PaymentPayload {
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod | string;
  cashTendered?: number;
  changeDue?: number;
  shiftId?: string;
  customerId?: string;
  timestamp?: string;
  terminalId?: string;
  businessType?: string;
  receiptNumber?: string;
  cashierName?: string;
}

// Double-Entry Bookkeeping Journal Line & Entry (APS POS5 General Ledger & COGS)
export interface JournalEntryLine {
  accountCode: string; // 1-10001 (Kas), 1-10002 (Bank), 4-10001 (Pendapatan), 5-10001 (HPP), 1-10501 (Persediaan)
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  accountCode?: string;
  accountName?: string;
  debit?: number;
  credit?: number;
  type?: 'GENERAL_JOURNAL' | 'POS_SALES' | 'COGS' | 'HPP' | string;
  lines: JournalEntryLine[];
  totalDebit?: number;
  totalCredit?: number;
  created_at?: string;
}

export type PaymentMethod =
  | 'CASH'
  | 'QRIS'
  | 'EDC_DEBIT'
  | 'EDC_CREDIT'
  | 'TRANSFER'
  | 'KREDIT'
  | 'AR_CREDIT'
  | 'KREDIT / TEMPO (AR)';

export type PriceTier = 'RETAIL' | 'MEMBER' | 'WHOLESALE';

export type SaleStatus =
  | 'PAID'
  | 'COMPLETED'
  | 'REFUNDED'
  | 'PENDING'
  | 'Partially Returned'
  | 'Returned'
  | 'PARTIALLY_RETURNED'
  | 'RETURNED';

export type SalesReturnCondition = 'GOOD' | 'DAMAGED';

export interface SalesReturnItem {
  productId: string;
  productName: string;
  barcode?: string;
  unitPrice: number;
  originalQty: number;
  returnQty: number;
  subtotalRefund: number;
  condition: SalesReturnCondition; // 'GOOD': Masuk stok lagi (+ stok, IN_RETURN), 'DAMAGED': Karantina / Bad Stock
  reason: string;
}

export interface SalesReturn {
  id: string; // RET-YYYYMM-XXXX
  transactionId: string;
  receiptNumber?: string;
  customerName?: string;
  customerPhone?: string;
  cashierId: string;
  cashierName: string;
  terminalName: string;
  timestamp: string;
  items: SalesReturnItem[];
  totalRefundAmount: number;
  refundMethod: 'CASH' | 'NON_CASH' | 'STORE_CREDIT' | string;
  shiftId?: string;
  notes?: string;
}

export interface BadStockItem {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  conditionReason: string;
  sourceType: 'RETUR_PENJUALAN' | 'KEDALUWARSA' | 'KERUSAKAN_GUDANG' | string;
  sourceReference: string; // e.g. RET-202610-0001
  timestamp: string;
  handledBy: string;
  status: 'QUARANTINED' | 'DISPOSED' | 'RETURNED_TO_VENDOR';
}

export interface Sale {
  transaction_id: string;
  date: string;
  cashier_id: string;
  cashier_name?: string;
  terminal_name: string;
  terminalId?: string;
  terminal_id?: string;
  businessType?: string;
  business_type?: string;
  items_summary: string;
  subtotal: number;
  discount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  amount_paid?: number;
  change_amount?: number;
  status: SaleStatus;
  created_at: string;
  items?: CartItem[];
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  price_tier?: string;
  receipt_number?: string;
  points_earned?: number;
  shift_id?: string;
  returned_amount?: number;
  sales_returns?: SalesReturn[];
  isOffline?: boolean;
  syncStatus?: 'PENDING' | 'SYNCED' | 'FAILED';
}

export type SalesHistory = Sale;

export interface CashierShiftExpense {
  id: string;
  shiftId: string;
  timestamp: string;
  amount: number;
  reason: string;
  category?: 'KAS_KECIL_KASIR' | 'OPERASIONAL_DARURAT' | string;
  cashierId: string;
  cashierName: string;
  terminalId: string;
}

export interface CashierShift {
  id: string;
  cashierId: string;
  cashierName: string;
  terminalId: string;
  terminalName: string;
  startTime: string;
  endTime?: string;
  status: 'OPEN' | 'CLOSED';
  initialCash: number; // Saldo Kas Awal / Modal Kasir
  totalCashSales: number; // Total Penjualan Tunai Sistem
  totalNonCashSales: number; // Total Non-Tunai (QRIS/EDC)
  totalTransactionsCount: number;
  totalExpenses: number; // Total Kas Keluar (Petty Cash)
  expenses: CashierShiftExpense[];
  expectedCashInDrawer: number; // Modal Awal + Penjualan Tunai - Kas Keluar
  actualCashInDrawer?: number; // Hitungan Kas Fisik Riil
  difference?: number; // actual - expected
  notes?: string;
  closedBy?: string;
  closedAt?: string;
  reconciliationStatus?: 'MATCH' | 'SURPLUS' | 'SHORTAGE';
  denominationBreakdown?: Record<string, number>;
}

export type PurchaseOrderStatus =
  | 'Draft'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'RECEIVED'
  | 'GOODS_RECEIPT'
  | 'PARTIAL'
  | 'Menunggu Approval Pimpinan'
  | 'Menunggu Approval Direksi'
  | 'Disetujui (Approved)'
  | 'Disetujui'
  | 'Dipesan'
  | 'Selesai'
  | 'Ditolak'
  | 'SENT_TO_VENDOR'
  | 'PARTIALLY_RECEIVED'
  | 'FULLY_RECEIVED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'Cancelled'
  | 'Sent'
  | 'Received'
  | 'PENDING APPROVAL'
  | 'Pending Approval'
  | 'Approved'
  | 'Received / Completed'
  | string;

export interface PurchaseReturnItem {
  productId: string;
  productName: string;
  orderedQty?: number;
  receivedQty?: number;
  rejectedQty: number;
  returnQty: number;
  unit: string;
  unitCost: number;
  subtotal: number;
  reason: string;
}

export interface PurchaseReturn {
  id: string; // e.g. RET-202610-0001
  debitNoteNumber: string; // e.g. ND-202610-0001
  poNumber: string;
  grId: string;
  deliveryOrderNumber: string;
  vendorName: string;
  vendorId?: string;
  date: string;
  items: PurchaseReturnItem[];
  totalRefundAmount: number;
  reason: string;
  status: 'ISSUED' | 'APPLIED';
  created_by: string;
}

export interface GoodsReceiptItem {
  id: string;
  poItemId: string;
  productId: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  rejectionReason?: string;
  // legacy compatibility fields
  product_id?: string;
  product_name?: string;
  ordered_qty?: number;
  received_qty?: number;
  notes?: string;
}

export interface GoodsReceipt {
  id: string;
  poId: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  warehouseId: string;
  deliveryOrderNumber: string;
  receivedDate: string;
  receivedByUserId: string;
  status: 'VERIFIED' | 'CANCELLED';
  items: GoodsReceiptItem[];
  notes?: string;
  idempotencyKey: string;
}

export interface GoodsReceiptPayload {
  poNumber: string;
  deliveryOrderNo: string;
  condition?: 'Kondisi Baik' | 'Rusak' | 'Sebagian' | string;
  notes?: string;
  receivedItems: {
    productId: string;
    productName: string;
    orderedQty: number;
    receivedQty: number;
    acceptedQty?: number;
    rejectedQty?: number;
    unit?: string;
    unitCost?: number;
    rejectionReason?: string;
    notes?: string;
  }[];
}

export interface POApprovalHistoryItem {
  action: 'APPROVED' | 'REJECTED' | 'PENDING';
  approvedBy: string;
  approvedAt: string;
  notes?: string;
  role?: string;
}

export interface PurchaseOrder {
  po_number: string;
  po_id?: string;
  date: string;
  supplier_name: string;
  supplier_id?: string;
  vendor_id?: string;
  items: string;
  total_amount: number;
  subtotal?: number;
  include_ppn?: boolean;
  ppn_rate?: number;
  ppn_amount?: number;
  payment_term?: string; // 'COD' | 'Tempo 7 Hari' | 'Tempo 14 Hari' | 'Tempo 30 Hari' | 'Tempo 45 Hari' | 'Tempo 60 Hari' | string
  payment_status?: 'Belum Bayar' | 'Jatuh Tempo' | 'Lunas' | 'PAID' | string;
  due_date?: string;
  paid_date?: string;
  payment_method?: string;
  payment_source?: 'Kas Operasional' | 'Rekening Bank Utama' | 'Kas Kecil' | string;
  payment_ref?: string;
  return_amount?: number;
  debit_notes?: string[];
  purchase_returns?: PurchaseReturn[];
  approved_by?: string;
  approved_date?: string;
  approvedBy?: string;
  approvedAt?: string;
  approval_notes?: string;
  approvalHistory?: POApprovalHistoryItem[];
  rejected_reason?: string;
  notes?: string;
  status: PurchaseOrderStatus;
  item_details?: {
    product_id: string;
    product_name: string;
    qty: number;
    unit_cost: number;
    subtotal: number;
    unit?: string;
    received_qty?: number;
  }[];
  delivery_order_no?: string;
  condition?: 'Kondisi Baik' | 'Rusak' | 'Sebagian' | string;
  received_date?: string;
  received_by?: string;
  received_items?: GoodsReceiptItem[];
  receiving_notes?: string;
}

export interface InventoryRecord {
  product_id: string;
  product_name?: string;
  initial_stock: number;
  in_qty: number;
  out_qty: number;
  final_stock: number;
  last_update: string;
}

export interface StockMutation {
  id: string;
  timestamp: string;
  date?: string;
  product_id: string;
  sku?: string;
  product_name: string;
  type: 'IN' | 'OUT' | 'OUT / KASIR' | 'OUT_SALES' | 'IN_PURCHASE' | 'IN / RECEIVING PO' | 'IN / GOODS_RECEIPT' | 'IN_RETURN' | 'ADJUSTMENT' | 'OPENING_STOCK_MIGRATION' | 'ROLLBACK_MIGRATION' | string;
  qty: number;
  previous_stock: number;
  final_stock: number;
  reference_no: string;
  referenceId?: string;
  balanceAfter?: number;
  notes?: string;
  operator?: string;
  cashier_name?: string;
  warehouse?: string;
  supplier_name?: string;
  supplier?: string;
  unit_cost?: number;
}

export interface Terminal {
  id: string;
  name: string;
  code: string;
  colorHex: string;
  neonBorderClass: string;
  neonBgClass: string;
  neonTextClass: string;
  location: string;
  isActive: boolean;
  activeOrdersToday: number;
  businessModel?: string;
  businessType?: string;
  subLabel?: string;
  isLocked?: boolean;
  modelType?: 'retail' | 'fnb' | 'supermarket' | 'pharmacy' | 'fashion' | 'warung' | 'electronics' | 'workshop' | 'building' | 'service' | 'salon' | 'services';
  allowAllCategories?: boolean;
  terminalType?: 'FRONT_END' | 'BACK_END';
  role?: 'FRONT_END_ONLY' | 'HYBRID_BACKEND';
}

export interface FinanceEntry {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'IN / PENDAPATAN' | 'HPP / BEBAN POKOK' | string;
  category: string;
  description: string;
  amount: number;
  reference: string;
  payment_method: string;
  account_target?: string;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  module: string;
  level?: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
}

export interface BrandMaster {
  id: string;
  code: string;
  name: string;
  manufacturer: string;
  country: string;
  productCount: number;
  status: 'Active' | 'Inactive';
  categoryCode?: number;
  categoryName?: string;
}

export interface CategoryMaster {
  id: string;
  code: string;
  name: string;
  department: string;
  taxRate: number;
  marginTarget: number;
  productCount: number;
  status: 'Active' | 'Inactive';
}

export interface SupplierMaster {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
  activePoCount: number;
  status: 'Active' | 'Inactive';
}

export interface CustomerMaster {
  id: string;
  code?: string;
  customer_code?: string;
  name: string;
  memberTier?: 'Platinum' | 'Gold' | 'Silver' | 'Reguler' | string;
  phone: string;
  email?: string;
  points?: number;
  totalSpent?: number;
  status?: 'Active' | 'Inactive';
  is_active?: boolean;
  allowed_tiers?: (PriceTier | string)[];
  total_spending_current_period?: number;
  tier_level?: 'Silver' | 'Gold' | 'Platinum' | string;
  notes?: string;
  has_store?: boolean;
  store_name?: string;
  store_address?: string;
  credit_limit?: number;
  outstanding_balance?: number;
}

export type Customer = CustomerMaster;

export interface SheetConfig {
  spreadsheetId: string;
  apiKey: string;
  appsScriptUrl: string;
  autoSync: boolean;
  lastSyncTime: string;
  syncStatus: 'idle' | 'syncing' | 'connected' | 'error';
}

// ====================================================
// DATA MIGRATION WIZARD & SMART COLUMN MAPPING (APS POS 1)
// ====================================================
export type MigrationEntityType = 'product' | 'supplier' | 'customer' | 'inventory';
export type MigrationRowStatus = 'MATCHED' | 'NEW' | 'DUPLICATE' | 'INVALID';
export type MigrationRowAction = 'CREATE' | 'UPDATE' | 'SKIP';

export interface MigrationFieldDefinition {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'number';
  synonyms: string[];
  example: string;
}

export interface MigrationRowPreview {
  rowIndex: number;
  raw: Record<string, string>;
  mapped: Record<string, any>;
  status: MigrationRowStatus;
  statusReasons: string[];
  action: MigrationRowAction;
  matchedId?: string;
  matchedName?: string;
}

export interface MigrationSummaryReport {
  entityType: MigrationEntityType;
  totalRows: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  timestamp: string;
  batchNumber?: string;
  stockLedgerEntriesCount?: number;
  targetWarehouse?: string;
}

export interface MigrationBatchItemSnapshot {
  id: string;
  name: string;
  action: 'CREATE' | 'UPDATE';
  prevStock?: number;
  newStock?: number;
  prevCostPrice?: number;
  newCostPrice?: number;
  prevSellingPrice?: number;
  newSellingPrice?: number;
}

export interface MigrationBatchRecord {
  id: string; // e.g. MIG-BATCH-xxxxxx
  timestamp: string;
  entityType: MigrationEntityType;
  totalRows: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  operator: string;
  status: 'COMPLETED' | 'ROLLED_BACK';
  rolledBackAt?: string;
  rolledBackBy?: string;
  targetWarehouse?: string;
  createdItemIds: string[];
  affectedItems?: MigrationBatchItemSnapshot[];
  stockLedgerEntriesCount: number;
  notes?: string;
}

export interface PurchaseRequest {
  pr_number: string;
  date: string;
  department: string;
  requester_name: string;
  item_name: string;
  qty: number;
  estimated_cost: number;
  status:
    | 'Pending Approval'
    | 'PENDING'
    | 'Approved'
    | 'APPROVED'
    | 'Rejected'
    | 'REJECTED'
    | 'Converted to PO'
    | 'Draft'
    | 'Draft PR'
    | 'Ditolak'
    | 'Cancelled';
  urgency: 'Low' | 'Medium' | 'High';
}

export interface ApprovalItem {
  id: string;
  type: 'PURCHASE_REQUEST' | 'USER_ACCESS' | 'STOCK_ADJUSTMENT' | 'PRICE_CHANGE' | 'PURCHASE_ORDER';
  title: string;
  requester: string;
  department: string;
  date: string;
  amount?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  details: string;
  reference_id?: string;
}

export interface InvoiceDue {
  id: string;
  type: 'PAYABLE' | 'RECEIVABLE';
  party_name: string;
  invoice_number: string;
  due_date: string;
  amount: number;
  status: 'Unpaid' | 'Paid' | 'Overdue' | 'PAID' | string;
  po_number?: string;
  vendor?: string;
  terms?: string;
  created_at?: string;
  approved_at?: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentSource?: string;
  paid_date?: string;
  journal_ref?: string;
}

export interface ContextualProfile {
  isGeneral: boolean;
  moduleTitle: string;
  subLabel: string;
  userName: string;
  position: string;
  employeeId?: string;
  email?: string;
  avatarUrl?: string | null;
}

export type ActiveNavModule =
  | 'home'
  | 'dashboard'
  | 'executive'
  | 'finance'
  | 'purchasing'
  | 'warehouse'
  | 'hr'
  | 'pos'
  | 'master-data'
  | 'admin';

export type HrDepartment =
  | 'POS & Kasir'
  | 'Warehouse & Logistik'
  | 'Purchasing'
  | 'Pengadaan & Purchasing'
  | 'Finance & Accounting'
  | 'Executive & Management'
  | 'Human Resources & Personalia'
  | 'Master Data & Katalog'
  | 'IT & Security'
  | 'IT & Super Admin';

export type ContractStatus = 'Tetap' | 'Kontrak (PKWT)' | 'Magang' | 'Probation';

export interface Employee {
  id: string;
  name: string;
  division: string;
  role: string;
  pin: string;
  avatarUrl: string | null;
  nip: string;
  avatar: string | null;
  department: HrDepartment;
  contractStatus: ContractStatus;
  phone: string;
  email: string;
  joinDate: string;
  shift: string;
  leaveQuota: {
    total: number;
    used: number;
    remaining: number;
  };
  status: 'Active' | 'On Leave' | 'Inactive';
  baseSalary?: number;
  dailyAllowanceRate?: number;
  attendedDays?: number;
  dailyAllowance?: number;
  absenceDeduction?: number;
  cashierCommissionRate?: number;
  bpjsEnabled?: boolean;
  payrollStatus?: 'PENDING' | 'PAID';
  payrollPaidAt?: string;
  payrollPaymentRef?: string;
}

export interface PayrollSyncSummary {
  period: string;
  totalBaseSalary: number;
  totalDailyAllowances?: number;
  totalCashierCommissions?: number;
  totalAbsenceDeductions?: number;
  totalEmployeeDeductions: number;
  totalCompanyContribution: number;
  totalTakeHomePay: number;
  totalBpjsRemittance: number;
  activeBpjsStaffCount: number;
  totalStaffCount: number;
  syncedAt?: string;
}

export type AttendanceStatus = 'Tepat Waktu' | 'Terlambat' | 'Izin' | 'Cuti' | 'Sakit';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  nip: string;
  employeeName: string;
  avatar: string | null;
  department: HrDepartment;
  date: string;
  shift: string;
  clockIn: string;
  clockOut: string | null;
  status: AttendanceStatus;
  notes: string;
  location: string;
}

export type LeaveType =
  | 'Cuti Tahunan'
  | 'Izin Keperluan Mendesak'
  | 'Sakit (Surat Dokter)'
  | 'Cuti Khusus / Melahirkan';

export type LeaveStatus = 'Menunggu' | 'Disetujui' | 'Ditolak';

export interface LeaveRequest {
  id: string;
  ticketNumber: string;
  employeeId: string;
  nip: string;
  employeeName: string;
  department: HrDepartment;
  type: LeaveType;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  status: LeaveStatus;
  submittedAt: string;
  approvedBy?: string;
  approvalNotes?: string;
}

// Executive Stock Policy: Dynamic Percentage Alert Thresholds
export interface StockAlertPolicy {
  id: string;
  name: string;
  targetType: 'DEFAULT' | 'CATEGORY' | 'PRODUCT';
  targetValue: string; // 'ALL' or Category Name or Product SKU / ID
  alertPercentage: number; // e.g., 20 for 20%, 35 for 35%
  isFastMoving: boolean;
  minBufferUnits?: number;
  notes?: string;
  updatedAt: string;
  updatedBy: string;
  // Compatibility & extended UI fields
  category?: string;
  thresholdPercent?: number;
  defaultMinUnits?: number;
  velocityGroup?: 'FAST_MOVING' | 'REGULAR' | 'SLOW_MOVING' | 'CRITICAL';
  isActive?: boolean;
  appliedBy?: string;
}

// Result of product alert threshold calculation
export interface ProductAlertThresholdResult {
  threshold: number;
  percentage: number;
  isLow: boolean;
  policyName: string;
  minStock: number;
  isLowStock: boolean;
  thresholdPercent: number;
}

// Executive Promotions Hub: Promos, Discounts & Bundling Programs
export interface PromotionProgram {
  id: string;
  code: string; // e.g. 'COMBO-A-B', 'HEMAT-SNACK', 'FLASHSALE'
  name: string;
  type: 'SKU_DISCOUNT' | 'BUNDLING' | 'BUNDLE' | 'FLASH_SALE' | 'CART_DISCOUNT' | 'CATEGORY_DISCOUNT';
  discountValueType: 'PERCENT' | 'NOMINAL';
  discountValue: number; // e.g. 15 for 15% or 5000 for Rp 5.000
  applicableSkus?: string[]; // Array of product IDs or barcodes
  bundleRequiredSkus?: { sku: string; qty: number; name?: string }[];
  startDate?: string;
  endDate?: string;
  status: 'ACTIVE' | 'DRAFT' | 'EXPIRED' | 'PENDING' | 'PENDING_APPROVAL';
  minSpend?: number;
  approvedBy?: string;
  description?: string;
  // Compatibility & UI fields
  isActive?: boolean;
  discountType?: 'PERCENT' | 'IDR';
  targetProductSku?: string;
  bundleProductSkus?: string[];
  minPurchaseQty?: number;
  authorizedBy?: string;
}

// Pharmacy & Obat Racikan Types & Costing Model
export type PharmacyClass = 'OBAT_BEBAS' | 'OBAT_BEBAS_TERBATAS' | 'OBAT_KERAS' | 'RACIKAN';

export type PharmacyPackagingUnit = 'Box' | 'Strip' | 'Tablet' | 'Botol' | 'Tube';

export interface PharmacyFormulaComponent {
  medicineId: string;
  medicineName: string;
  dosageQty: number;
  unit: string;
  costPerUnit: number;
  subtotal: number;
}

export interface PharmacyFormulaCosting {
  components: {
    medicineId: string;
    medicineName: string;
    dosageQty: number;
    unit: string;
    costPerUnit: number;
    subtotal: number;
  }[];
  embalaseCost: number;       // Wadah/cangkang kapsul/pot/plastik klip (Rp)
  tuslahFee: number;          // Jasa racik apoteker (Rp)
  medicineCost: number;       // Subtotal bahan obat
  totalCost: number;          // medicineCost + embalaseCost + tuslahFee
  targetMarginPercent: number;
  recommendedPrice: number;
}

export type TerminalRole = 'FRONT_END_ONLY' | 'HYBRID_BACKEND';

export interface TerminalConfigMetadata {
  id: string;
  name: string;
  industry: string;
  role: TerminalRole;
  colorTheme: string;
  pinRequired: boolean;
}

export interface BusinessEntityProfile {
  name: string;
  category: string; // 'Ritel Modern' | 'F&B & Restoran' | 'Farmasi & Apotek' | 'Jasa & Servis' | 'Bahan Bangunan & Perkakas' | 'Fashion & Tekstil' | string
  address: string;
  licenseNumber?: string; // NIB / Izin Usaha / NPWP (Opsional)
  nib?: string; // Nomor Induk Berusaha (NIB)
  npwp?: string; // Nomor Pokok Wajib Pajak (NPWP)
  phone?: string;
  email?: string;
  logoUrl?: string;
  website?: string;
  headerNote?: string;
  footerNote?: string;
  isConfigured: boolean;
  // POS & Architecture Settings
  posUnitCount?: number; // Jumlah Unit Kasir Aktif (default 10 atau disesuaikan)
  cashierArchitecture?: 'CENTRALIZED_FRONTEND' | 'HYBRID_FRONT_BACKEND' | 'HYBRID_FRONT_BACK'; // 'Kasir Terpusat (Front-End Only)' | 'Hybrid (Front-End Kasir + Back-End Admin/Gudang)'
  terminalConfigs?: TerminalConfigMetadata[];
}


