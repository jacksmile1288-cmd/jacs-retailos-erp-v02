export type UserRole =
  | 'Super Admin'
  | 'Manager'
  | 'Kasir'
  | 'Inventory Staff'
  | 'Finance Staff'
  | 'HR Staff'
  | 'Purchasing Staff'
  | 'Security Staff'
  | 'Security Guard'
  | 'Security'
  | 'EXECUTIVE'
  | 'FINANCE_MANAGER'
  | 'CASHIER_LEAD'
  | 'WAREHOUSE_HEAD'
  | 'PURCHASING_OFFICER'
  | 'HR_MANAGER';

export interface User {
  user_id: string;
  id?: string;
  name: string;
  email: string;
  division?: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  pin: string;
  assignedTerminalId?: string; // Terminal yang dikunci tetap untuk akun kasir ini
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

export type FnbToppingCategory = 'MAIN_FOOD' | 'DRINK' | 'PASTRY_SNACK';

export interface FnbToppingMaster {
  id: string;
  sku: string; // Kode SKU otomatis format TOP-FNB-XXX (misal: TOP-FNB-001)
  name: string;
  category: FnbToppingCategory;
  price: number;
  isActive: boolean;
  rawMaterialId?: string;
  rawMaterialName?: string;
  rawMaterialQty?: number;
  rawMaterialUnit?: string;
  hppCost?: number;
  notes?: string;
}

export type FnbToppingOption = FnbToppingMaster;

// Master Stylist / Kapster / Petugas Layanan (Sektor SERVICE: Barbershop & Salon / Laundry)
export interface ServiceStylistMaster {
  id: string; // Format: STL-001, STL-002, dst.
  name: string;
  role: string; // e.g. 'Senior Barber', 'Junior Barber', 'Hair Spa & Coloring'
  specialty?: string;
  commissionRate: number; // Persentase komisi jasa layanan (%)
  retailCommissionRate?: number; // Opsional komisi penjualan produk retail salon (default 0%)
  isActive: boolean;
  phone?: string;
  notes?: string;
}

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

export type ServiceItemFormat =
  | 'LAYANAN_SATUAN'
  | 'PAKET_BUNDLING'
  | 'LAYANAN_ADDON'
  | 'PRODUK_RETAIL_SALON';

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
  retailPrice?: number;
  price?: number;
  stock: number;
  minStock?: number; // Standar APS POS 1 untuk Batas Min Stok
  min_stock?: number;
  status: 'Active' | 'Low Stock' | 'Out of Stock' | 'Discontinued' | 'ACTIVE' | 'DISCONTINUED' | string;
  itemType?: 'MENU_FB' | 'RETAIL' | 'RAW_MATERIAL' | 'SERVICE';
  costing?: FBMenuCosting; // Rincian kalkulasi biaya & HPP Menu F&B
  hpp?: number; // Alias HPP / Modal
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
  pluShortcode?: string; // Quick PLU shortcode (3-4 digits)
  isWeighable?: boolean; // Status Barang Timbang / Item Timbangan (Fresh & Curah)
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
  ppnEnabled?: boolean;
  ppnRate?: number;
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
  variantMatrix?: FashionVariantCell[]; // Matriks stok kombinasi Ukuran x Warna
  sizeUpcharges?: Record<string, number>; // Konfigurasi tambahan harga per ukuran (misal S/M/L: +0, XL: +10000, XXL: +15000)
  fashionPromo?: FashionArticlePromo; // Promo per artikel Fashion (Clearance Sale & Bundle/Mix & Match)
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
  serviceFormat?: ServiceItemFormat; // Klasifikasi layanan: Satuan, Paket Bundling, Add-on, atau Produk Retail Salon
  packageDetails?: string; // Rincian isi paket (opsional, misal: "Cukur Reguler + Cuci Rambut + Tonic")
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
  // 3-Tier Harga Otomatis Material Bangunan (Eceran, Tukang, Kontraktor)
  tier2Price?: number;
  tier2MinQty?: number;
  tier3Price?: number;
  tier3MinQty?: number;
  businessModel?: 'retail' | 'fnb' | 'pharmacy' | 'fashion' | 'gadget' | 'services' | 'building' | 'laundry' | string;
  // Laundry Multi-Satuan & SLA
  laundryUnitType?: 'KILOAN' | 'SATUAN' | 'PASANG' | 'LUAS';
  minOrderWeightKg?: number;
  slaDuration?: string;
  slaHours?: number;
  branchId?: string;
  isPackage?: boolean;
  componentSkus?: Array<{ skuId: string; skuName: string; qty: number; unitCost: number }>;
}

export interface FashionVariantCell {
  size: string;
  color: string;
  stock: number;
  skuVariant?: string;
  barcodeVariant?: string;
}

export interface FashionArticlePromo {
  clearanceActive?: boolean;
  clearanceType?: 'PERCENT' | 'NOMINAL';
  clearanceValue?: number;
  clearanceLabel?: string;
  bundleActive?: boolean;
  bundleMinQty?: number;
  bundleDiscountType?: 'PERCENT' | 'NOMINAL';
  bundleDiscountValue?: number;
  bundleScope?: 'SAME_SKU' | 'MIX_MATCH_FASHION';
  bundleLabel?: string;
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
  promoCode?: string | null;
  promoName?: string;
  promoSourceType?: 'FEFO_EXP' | 'SUPPLIER_TPR' | 'SEASONAL' | 'STORE_DISC' | 'STORE_BND';
  promoBadge?: string;
  promoMechanic?: 'STANDARD' | 'PWP_TEBUS_MURAH' | 'BUY_X_GET_Y' | 'BUNDLE';
  promoQtyCapped?: number;
  maxQtyPerReceipt?: number | null;
  isUnlimitedFefo?: boolean;
  freeBonusQty?: number;
  freeBonusLabel?: string;
  pwpMinCartSubtotal?: number;
  pwpQualified?: boolean;
  promoHint?: string;
  originalUnitPrice?: number;
  promoSavings?: number;
  overriddenPromosCount?: number;
  selectedFashionSize?: string;
  selectedFashionColor?: string;
  manualDiscountReason?: string;
  manualDiscountAuthorizedBy?: string;
  supplierName?: string;
  isPackage?: boolean;
  componentSkus?: Array<{ skuId: string; skuName: string; qty: number; unitCost: number }>;
  signa?: string; // Opsional catatan aturan pakai
  selectedUnit?: string; // Satuan aktif (e.g. Sak, Batang, Meter, Roll)
  conversionFactor?: number;
  isRetailUnit?: boolean; // Mode eceran (e.g. Meteran vs Batangan/Roll)
  deliveryMethod?: 'DIRECT' | 'FLEET_DELIVERY'; // Bawa Langsung vs Armada Toko
  buildingTierName?: 'ECERAN' | 'TUKANG' | 'KONTRAKTOR' | string;
  buildingTierBadge?: string;
  buildingTierLabel?: string;
  buildingTierSavings?: number;
  cubicConversionFactorM3?: number;
  cubicDeductionM3?: number;
  grossMarginPercent?: number;
  isMarginBelowFloor?: boolean;
  // Laundry scale & area metadata
  laundryLengthM?: number;
  laundryWidthM?: number;
  grossWeightKg?: number;
  tareWeightKg?: number;
  actualNetWeightKg?: number;
  isMinWeightAdjusted?: boolean;
  minWeightAppliedKg?: number;
  modifiers?: {
    tableNumber?: string;
    orderType?: 'Dine-In' | 'Take-Away' | 'Takeaway' | 'Delivery';
    spicyLevel?: number;
    spicyLabel?: string;
    toppings?: string[];
    toppingDetails?: Array<{
      id?: string;
      sku?: string;
      name: string;
      price: number;
      rawMaterialId?: string;
      rawMaterialQty?: number;
      rawMaterialUnit?: string;
      hppCost?: number;
    }>;
    toppingExtraPrice?: number;
    temperature?: string;
    sugarLevel?: string;
    sugarIceLabel?: string;
    notes?: string;
    variant?: string;
    ticketNumber?: string;
    petName?: string;
    deliveryNotes?: string;
  };
  kotSent?: boolean;
  kotSentQty?: number;
  // Service sector per-item Stylist / Kapster assignment
  stylistId?: string;
  stylistName?: string;
  stylistCommissionRate?: number;
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
  customerName?: string;
  timestamp?: string;
  terminalId?: string;
  businessType?: string;
  receiptNumber?: string;
  stationCode?: string;
  cashierName?: string;
  discount?: number;
  promoSavingsTotal?: number;
  subtotalBeforeDiscount?: number;
  cartVoucherDiscount?: number;
  fnbOrderMode?: string;
  fnbTableNo?: string;
  vehiclePlate?: string;
  mechanicName?: string;
  stylistId?: string;
  stylistName?: string;
  stylistCommissionRate?: number;
  serviceCommissionTotal?: number;
  petOrClientName?: string;
  deliveryFleetActive?: boolean;
  deliveryPolicy?: 'FRANGKO' | 'LOCO';
  fleetType?: 'PICKUP_RET' | 'TRUCK_ENGKEL' | 'DUMP_TRUCK';
  fleetVehicleName?: string;
  deliveryDestination?: string;
  shippingFee?: number;
  dpAmount?: number;
  tempoDays?: number;
  dueDate?: string;
  remainingBalance?: number;
  priceTier?: string;
  isContractorMode?: boolean;
  loadingFee?: number;
  materialRevenue?: number;
  fleetDeliveryCost?: number;
  netProfitAfterShipping?: number;
  // Laundry Order, Bag Tag & Flexible Payment
  customerPhone?: string;
  isLaundryOrder?: boolean;
  laundryTotalPieces?: number;
  laundryConditionNotes?: string;
  laundryEstimatedDoneAt?: string;
  laundrySlaLabel?: string;
  laundrySlaHours?: number;
  laundryPaymentStatus?: LaundryPaymentStatus;
  laundryBagTagCode?: string;
  laundryRackNumber?: string;
  laundryWasherId?: string;
  laundryWasherName?: string;
  laundryIronerId?: string;
  laundryIronerName?: string;
  laundrySpecialistId?: string;
  laundrySpecialistName?: string;
  // Fashion & Butik POS (Pramuniaga/Advisor, Otorisasi Diskon & Tukar Ukuran)
  fashionAdvisorId?: string;
  fashionAdvisorName?: string;
  fashionAdvisorCommission?: number;
  manualDiscountReason?: string;
  manualDiscountAuthorizedBy?: string;
  isFashionExchange?: boolean;
  exchangeRefReceipt?: string;
  exchangeSummary?: string;
  splitCashAmount?: number;
  splitNonCashAmount?: number;
  splitNonCashMethod?: 'QRIS' | 'DEBIT' | 'TRANSFER' | string;
}

export interface FashionExchangePayload {
  originalSaleId?: string;
  originalReceiptNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  returnedProductId: string;
  returnedProductName: string;
  returnedSize: string;
  returnedColor: string;
  returnedUnitPrice: number;
  replacementProductId: string;
  replacementProductName: string;
  replacementSize: string;
  replacementColor: string;
  replacementUnitPrice: number;
  qty?: number;
  priceDifference: number;
  paymentMethod?: string;
  fashionAdvisorId?: string;
  fashionAdvisorName?: string;
  reason?: string;
  stationCode?: string;
  terminalId?: string;
  shiftId?: string;
}

export type BuildingDeliveryStatus = 'MENUNGGU_MUAT' | 'DALAM_PENGIRIMAN' | 'TERKIRIM_PROYEK';
export type BuildingFleetType = 'PICKUP_RET' | 'TRUCK_ENGKEL' | 'DUMP_TRUCK';

export interface BuildingDeliveryOrder {
  id: string;
  doNumber: string;
  transactionId?: string;
  receiptNumber?: string;
  date: string;
  customerId?: string;
  customerName: string;
  destination: string;
  deliveryPolicy: 'FRANGKO' | 'LOCO';
  fleetType: BuildingFleetType;
  fleetVehicleName?: string;
  estimatedVolumeM3: number;
  itemsSummary: string;
  shippingFee: number;
  totalOrderValue: number;
  status: BuildingDeliveryStatus;
  driverName?: string;
  vehiclePlate?: string;
  notes?: string;
  updatedAt: string;
}

export interface BulkShrinkageLog {
  id: string;
  date: string;
  productId: string;
  productName: string;
  sku?: string;
  unit: string;
  systemQty: number;
  physicalQty: number;
  shrinkageQty: number;
  costValueLoss: number;
  reason: string;
  recordedBy: string;
  warehouse?: string;
}

export interface BuildingAuthRequest {
  id: string;
  requestNumber: string;
  type: 'PLAFON_KREDIT_KONTRAKTOR' | 'DISKON_BORONGAN_FRANGKO';
  createdAt: string;
  customerId?: string;
  contractorName: string;
  projectTitle: string;
  requestedBy: string;
  currentCreditLimit?: number;
  requestedCreditLimit?: number;
  outstandingBalance?: number;
  orderSubtotal?: number;
  requestedDiscountPercent?: number;
  requestedDiscountAmount?: number;
  frangkoFeeWaived?: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
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
  voucherNumber?: string;
  debitAccount?: string;
  creditAccount?: string;
  status?: string;
  createdBy?: string;
  amount?: number;
  promoSourceType?: 'FEFO_EXP' | 'SUPPLIER_TPR' | 'SEASONAL' | 'STORE_BND' | 'STORE_DISC' | string;
  supplierName?: string;
  promoCode?: string;
  fefoSalvageRevenue?: number;
  fefoQtySaved?: number;
  businessSector?: CanonicalBusinessSector;
  businessName?: string;
  isDemoSeed?: boolean;
}

export interface SupplierRebateClaim {
  id: string;
  transactionId: string;
  receiptNumber: string;
  date: string;
  supplierName: string;
  promoCode: string;
  promoName: string;
  productNames: string[];
  qtyUnits: number;
  claimAmount: number;
  status: 'CLAIMABLE' | 'DEDUCTED_AP' | 'SETTLED';
  deductedInvoiceId?: string;
  deductedInvoiceNumber?: string;
  deductedAt?: string;
  journalRef: string;
  notes?: string;
}

export type PaymentMethod =
  | 'CASH'
  | 'QRIS'
  | 'EDC_DEBIT'
  | 'EDC_CREDIT'
  | 'TRANSFER'
  | 'KREDIT'
  | 'AR_CREDIT'
  | 'KREDIT / TEMPO (AR)'
  | 'SPLIT'
  | 'KASBON';

export type PriceTier = 'RETAIL' | 'MEMBER' | 'WHOLESALE';

export type SaleStatus =
  | 'PAID'
  | 'COMPLETED'
  | 'REFUNDED'
  | 'PENDING'
  | 'Partially Returned'
  | 'Returned'
  | 'PARTIALLY_RETURNED'
  | 'RETURNED'
  | 'VOIDED'
  | 'CANCELLED'
  | 'VOID';

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
  stationCode?: string;
  businessType?: string;
  business_type?: string;
  businessSector?: CanonicalBusinessSector;
  businessName?: string;
  isDemoSeed?: boolean;
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
  syncStatus?: 'PENDING' | 'SYNCED' | 'FAILED' | 'PENDING_SYNC';
  void_approved_by?: string;
  void_reason?: string;
  branchId?: string;
  fnbOrderMode?: string;
  fnbTableNo?: string;
  vehiclePlate?: string;
  mechanicName?: string;
  stylistId?: string;
  stylistName?: string;
  stylistCommissionRate?: number;
  serviceCommissionTotal?: number;
  petOrClientName?: string;
  deliveryFleetActive?: boolean;
  deliveryPolicy?: 'FRANGKO' | 'LOCO';
  fleetType?: BuildingFleetType;
  fleetVehicleName?: string;
  deliveryOrderNumber?: string;
  deliveryDestination?: string;
  shippingFee?: number;
  dpAmount?: number;
  tempoDays?: number;
  dueDate?: string;
  remainingBalance?: number;
  promoSavingsTotal?: number;
  cartVoucherDiscount?: number;
  isContractorMode?: boolean;
  loadingFee?: number;
  materialRevenue?: number;
  fleetDeliveryCost?: number;
  netProfitAfterShipping?: number;
  // Laundry Order, Bag Tag & Tracking metadata
  isLaundryOrder?: boolean;
  laundryTotalPieces?: number;
  laundryConditionNotes?: string;
  laundryEstimatedDoneAt?: string;
  laundrySlaLabel?: string;
  laundrySlaHours?: number;
  laundryPaymentStatus?: LaundryPaymentStatus;
  laundryBagTagCode?: string;
  laundryRackNumber?: string;
  laundryWasherId?: string;
  laundryWasherName?: string;
  laundryIronerId?: string;
  laundryIronerName?: string;
  laundrySpecialistId?: string;
  laundrySpecialistName?: string;
  // Fashion & Butik metadata
  fashionAdvisorId?: string;
  fashionAdvisorName?: string;
  fashionAdvisorCommission?: number;
  manualDiscountReason?: string;
  manualDiscountAuthorizedBy?: string;
  isFashionExchange?: boolean;
  exchangeRefReceipt?: string;
  exchangeSummary?: string;
  splitCashAmount?: number;
  splitNonCashAmount?: number;
  splitNonCashMethod?: 'QRIS' | 'DEBIT' | 'TRANSFER' | string;
}

export type LaundryProductionStatus = 'DITERIMA' | 'CUCI' | 'SETRIKA' | 'SIAP_AMBIL' | 'DIAMBIL';
export type LaundryPaymentStatus = 'LUNAS_AWAL' | 'DP' | 'BAYAR_AMBIL';

export interface LaundryStageOperatorLog {
  stage: LaundryProductionStatus;
  roleType: 'CUCI' | 'SETRIKA' | 'TEKNISI_KHUSUS';
  employeeId?: string;
  employeeName: string;
  timestamp: string;
}

export interface LaundryOrderRecord {
  id: string;
  orderNumber: string;
  tagCode: string;
  transactionId?: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  totalPieces: number;
  conditionNotes: string;
  slaLabel: string;
  slaHours: number;
  estimatedDoneAt: string;
  itemsSummary: string;
  items: CartItem[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: LaundryPaymentStatus;
  paymentMethod: string;
  productionStatus: LaundryProductionStatus;
  rackNumber?: string;
  handledBy?: string;
  stationCode?: string;
  washerEmployeeId?: string;
  washerEmployeeName?: string;
  ironerEmployeeId?: string;
  ironerEmployeeName?: string;
  specialistEmployeeId?: string;
  specialistEmployeeName?: string;
  stageOperatorLogs?: LaundryStageOperatorLog[];
  pickedUpAt?: string;
  updatedAt: string;
}

export interface LaundryStaffCommissionSummary {
  employeeId: string;
  employeeName: string;
  nip: string;
  role: string;
  department: string;
  ordersHandledCount: number;
  washCount: number;
  ironCount: number;
  specialistCount: number;
  kiloanKgProcessed: number;
  satuanPcsProcessed: number;
  pasangProcessed: number;
  areaM2Processed: number;
  ratePerKg: number;
  ratePerItem: number;
  rateSpecialist: number;
  totalIncentive: number;
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
  stationCode?: string;
  startTime: string;
  endTime?: string;
  status: 'OPEN' | 'CLOSED';
  isPaused?: boolean;
  pausedAt?: string;
  initialCash: number; // Saldo Kas Awal / Modal Kasir
  totalCashSales: number; // Total Penjualan Tunai Sistem
  totalNonCashSales: number; // Total Non-Tunai (QRIS/EDC)
  totalTransactionsCount: number;
  totalExpenses: number; // Total Kas Keluar (Petty Cash)
  totalSalesReturnCash?: number; // Total Retur Tunai
  expenses: CashierShiftExpense[];
  expectedCashInDrawer: number; // Modal Awal + Penjualan Tunai - Kas Keluar - Retur Tunai
  actualCashInDrawer?: number; // Hitungan Kas Fisik Riil
  difference?: number; // actual - expected
  notes?: string;
  closedBy?: string;
  closedAt?: string;
  reconciliationStatus?: 'MATCH' | 'SURPLUS' | 'SHORTAGE';
  denominationBreakdown?: Record<string, number>;
  shiftName?: string;
  openedAt?: string;
  startingCash?: number;
  expectedCash?: number;
  actualCash?: number;
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
  totalAmount?: number;
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
  created_by?: string;
  requiresDirectorApproval?: boolean;
}

export interface InventoryRecord {
  product_id: string;
  product_name?: string;
  initial_stock: number;
  in_qty: number;
  out_qty: number;
  final_stock: number;
  last_update: string;
  safety_stock?: number;
  status?: string;
  unit?: string;
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
  colorHex?: string;
  neonBorderClass?: string;
  neonBgClass?: string;
  neonTextClass?: string;
  location: string;
  isActive: boolean;
  activeOrdersToday: number;
  businessModel?: string;
  businessType?: string;
  subLabel?: string;
  isLocked?: boolean;
  modelType?: 'retail' | 'fnb' | 'supermarket' | 'pharmacy' | 'fashion' | 'warung' | 'electronics' | 'workshop' | 'building' | 'service' | 'salon' | 'services' | 'laundry';
  allowAllCategories?: boolean;
  terminalType?: 'FRONT_END' | 'BACK_END';
  role?: 'FRONT_END_ONLY' | 'HYBRID_BACKEND';
  stationCode?: string;
  posType?: ActivePosType;
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
  businessSector?: CanonicalBusinessSector;
  businessName?: string;
  isDemoSeed?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  division?: string;
  amount?: number;
  category?: string;
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
  tier?: PriceTier | string;
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
  id?: string;
  pr_number: string;
  date: string;
  department: string;
  requester_name: string;
  item_name: string;
  qty: number;
  estimated_cost: number;
  status:
    | 'Pending Approval'
    | 'PENDING_APPROVAL'
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
  branchId?: string;
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
  activeRoleLabel?: string;
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
  | 'admin'
  | 'security';

export type HrDepartment =
  | 'Executive & Management'
  | 'Operasional & Produksi'
  | 'POS & Kasir'
  | 'Warehouse & Logistik'
  | 'Purchasing'
  | 'Pengadaan & Purchasing'
  | 'Finance & Accounting'
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
  fashionCommissionRate?: number;
  laundryRatePerKg?: number;
  laundryRatePerItem?: number;
  laundryRateSpecialist?: number;
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
  status: 'ACTIVE' | 'DRAFT' | 'EXPIRED' | 'PENDING' | 'PENDING_APPROVAL' | 'INACTIVE';
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

export interface BusinessBranch {
  id: string; // 'BR-001', 'BR-002', dst.
  branchCode: string;
  name: string;
  industryCategory: string; // 'RETAIL' | 'FNB' | 'PHARMACY' | 'BUILDING_MATERIALS' | 'PETSHOP_CLINIC' | 'SALON_LAUNDRY' | 'WORKSHOP'
  isHeadquarters: boolean;
  address: string;
  phone: string;
  whatsapp: string;
  activeCashierCount: number; // 1, 2, atau 3
  slogan: string;
  footerNote: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export type CanonicalBusinessSector =
  | 'FNB'
  | 'FASHION'
  | 'BUILDING'
  | 'SERVICE'
  | 'RETAIL';

export type BusinessMechanismFamily =
  | 'RETAIL_GENERAL'
  | 'FNB_CULINARY'
  | 'BUILDING_BULK'
  | 'SPECIALTY_SERVICE';

export type ActivePosType =
  | 'POS_RETAIL'
  | 'POS_GROSIR_DISTRIBUSI'
  | 'POS_FNB'
  | 'POS_BANGUNAN'
  | 'POS_JASA_LAYANAN';

export type BusinessModelId =
  | 'TOKO_OBAT_KESEHATAN'
  | 'TOKO_PROVISION_LARGE'
  | 'TOKO_PROVISION_SMALL'
  | 'WARUNG_KELONTONG'
  | 'MINIMARKET'
  | 'SUPERMARKET'
  | 'GROSIR_BESAR'
  | 'GROSIR_KECIL'
  | 'DEPO_DISTRIBUTOR'
  | 'RESTO_CAFE'
  | 'BAHAN_BANGUNAN_MATERIAL'
  | 'PET_SHOP'
  | 'BARBERSHOP_SALON'
  | 'LAUNDRY'
  | 'TOKO_KOSMETIK_KECANTIKAN'
  | 'TOKO_ATK'
  | 'FASHION_BUTIK';

export interface BusinessDomainSubFeatures {
  isWholesale: boolean; // MOQ, Tier Grosir & Kredit/Piutang (RETAIL_GENERAL)
  hasBomRecipe: boolean; // Menu Jadi & BOM Bahan Baku (FNB_CULINARY)
  hasBulkVolumeDimension: boolean; // Curah m³/Ret & Dimensi PxLxT (BUILDING_BULK)
  hasVariantMatrix: boolean; // Varian Ukuran & Warna (SPECIALTY_SERVICE)
  hasSerialImei: boolean; // Serial Number & IMEI (SPECIALTY_SERVICE)
  hasServiceOrder: boolean; // Jasa Barbershop, Salon & Laundry (SPECIALTY_SERVICE)
}

export type OperationalTopologyMode =
  | 'NON_BLOCKING_ERP'
  | 'PURE_POS'
  | 'HYBRID_ALL_IN_ONE'
  | 'ENTERPRISE_MULTI_STATION';

export interface BusinessDomainConfig {
  primaryBusinessModel: BusinessModelId;
  mechanismFamily: BusinessMechanismFamily;
  activePosTypes: ActivePosType[]; // Tipe POS Aktif (checkbox cards di Legalitas Usaha)
  isHybridMultiUnit: boolean; // Mode Hybrid Multi-Unit (default: false / OFF)
  subFeatures: BusinessDomainSubFeatures;
  enabledHybridModels?: BusinessModelId[]; // Unit tambahan bila Mode Hybrid Multi-Unit aktif
  operationalTopology?: OperationalTopologyMode; // Skala & Mode Request User
  activeStationCount?: number; // Jumlah Loket / PC Kasir Aktif (1..10)
}

export interface BusinessEntityProfile {
  name: string;
  businessName?: string;
  category: string; // 'Minimarket' | 'Resto & Cafe' | 'Grosir Besar' | 'Bahan Bangunan & Material' | string
  businessType?: BusinessModelId | string;
  activeSector?: CanonicalBusinessSector;
  sector?: CanonicalBusinessSector | BusinessMechanismFamily | string;
  posMode?: ActivePosType | string;
  cashiers?: number;
  updatedAt?: number;
  address: string;
  licenseNumber?: string; // NIB / Izin Usaha / NPWP (Opsional)
  nib?: string; // Nomor Induk Berusaha (NIB)
  npwp?: string; // Nomor Pokok Wajib Pajak (NPWP)
  phone?: string;
  whatsapp?: string;
  email?: string;
  logoUrl?: string;
  website?: string;
  headerNote?: string;
  footerNote?: string;
  isConfigured: boolean;
  // Central Business Domain & Mechanism Configuration
  domainConfig?: BusinessDomainConfig;
  // POS & Architecture Settings
  posUnitCount?: number; // Jumlah Loket / PC Kasir Aktif (1..10)
  operationalTopology?: OperationalTopologyMode;
  cashierArchitecture?: 'CENTRALIZED_FRONTEND' | 'HYBRID_FRONT_BACKEND' | 'HYBRID_FRONT_BACK'; // 'Kasir Terpusat (Front-End Only)' | 'Hybrid (Front-End Kasir + Back-End Admin/Gudang)'
  terminalConfigs?: TerminalConfigMetadata[];
}

export type BusinessProfile = BusinessEntityProfile;


export type BusinessRole = 'retail' | 'fnb' | 'building' | 'service';

export interface InventoryBatch {
  id: string;
  productId: string;
  purchaseDate: string; // ISO string
  unitCost: number;     // Cost price of this batch
  remainingQty: number; // Current quantity in this batch
}

export interface VoidItemLog {
  id: string;
  timestamp: string;
  sku: string;
  productName: string;
  qty: number;
  unitPrice: number;
  cashierId: string;
  reason: string;
}

export interface SystemError {
  id: string;
  timestamp: string;
  branchId?: string;
  module: string;
  route?: string;
  message: string;
  stack?: string;
  stackSummary?: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
  type: 'CRITICAL' | 'WARNING';
}
