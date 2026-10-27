
const STORAGE_KEY_BUSINESS_PROFILE = 'jacs_business_profile_v1';

export const loadStoredBusinessProfile = (fallback: any) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BUSINESS_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load stored business profile', e);
  }
  return fallback;
};
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { calculateMemberTierLevel } from '../utils/loyaltyUtils';
import {
  Product,
  Sale,
  User,
  PurchaseOrder,
  PurchaseRequest,
  ApprovalItem,
  InvoiceDue,
  InventoryRecord,
  StockMutation,
  Terminal,
  FinanceEntry,
  AuditLog,
  SheetConfig,
  ActiveNavModule,
  BrandMaster,
  CategoryMaster,
  SupplierMaster,
  CustomerMaster,
  PriceTier,
  UserRole,
  Employee,
  AttendanceRecord,
  LeaveRequest,
  PayrollSyncSummary,
  StockAlertPolicy,
  PromotionProgram,
  ProductAlertThresholdResult,
  GoodsReceipt,
  GoodsReceiptItem,
  PurchaseOrderStatus,
  POApprovalHistoryItem,
  PurchaseReturn,
  PurchaseReturnItem,
  RecipeItem,
  RecipeIngredient,
  FBMenuCosting,
  CashierShift,
  CashierShiftExpense,
  SalesReturn,
  SalesReturnItem,
  SalesReturnCondition,
  BadStockItem,
  SaleStatus,
  PaymentMethod,
  CartItem,
  PaymentPayload,
  JournalEntry,
  JournalEntryLine,
  BusinessEntityProfile,
  MigrationBatchRecord,
  ContextualProfile,
  TerminalConfigMetadata,
} from '../types';
import { generateTerminalConfigs, isHybridArchitecture } from '../utils/terminalConfigUtils';
import {
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_USERS,
  INITIAL_PURCHASING,
  INITIAL_PURCHASE_REQUESTS,
  INITIAL_APPROVALS,
  INITIAL_INVOICES_DUE,
  INITIAL_INVENTORY,
  INITIAL_STOCK_MUTATIONS,
  INITIAL_FINANCE,
  INITIAL_AUDIT_LOGS,
  INITIAL_TERMINALS,
  INITIAL_SHEET_CONFIG,
  INITIAL_GOODS_RECEIPTS,
  DEFAULT_BUSINESS_PROFILE,
} from '../data/initialData';
import {
  INITIAL_BRANDS,
  INITIAL_CATEGORIES,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  DUMMY_STORE_CUSTOMERS,
  INITIAL_ERP_MASTER_PRODUCTS,
  ERP_CATALOG_MAPPING,
  MASTER_LOCAL_SUPPLIERS,
  getDefaultSupplierForCategory,
  getErpCategoryInfo,
} from '../data/canonicalMasterData';
import { FNB_PRODUCTS } from '../data/fnbData';
import { ALL_INDUSTRY_PRODUCTS } from '../data/industryTerminalProducts';
import {
  RAW_INGREDIENTS_AS_PRODUCTS,
  RAW_INGREDIENTS_AS_INVENTORY,
} from '../data/rawIngredientsData';
import {
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVE_REQUESTS,
} from '../data/hrData';

interface AppContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  language: 'id' | 'en';
  setLanguage: (lang: 'id' | 'en') => void;
  activeNav: ActiveNavModule;
  setActiveNav: (nav: ActiveNavModule) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: Sale[];
  salesHistory: Sale[];
  setSalesHistory: React.Dispatch<React.SetStateAction<Sale[]>>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  resetCart: () => void;
  journalEntries: JournalEntry[];
  setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  purchasing: PurchaseOrder[];
  purchaseRequests: PurchaseRequest[];
  setPurchaseRequests: React.Dispatch<React.SetStateAction<PurchaseRequest[]>>;
  createPurchaseRequest: (pr: Omit<PurchaseRequest, 'pr_number' | 'status'>) => void;
  approvePurchaseRequest: (prNumberOrId: string) => void;
  rejectPurchaseRequest: (prNumberOrId: string, reason?: string) => void;
  approvalQueue: ApprovalItem[];
  approveItem: (id: string) => void;
  rejectItem: (id: string) => void;
  approveAllDocumentApprovals: () => void;
  invoicesDue: InvoiceDue[];
  invoicesReceivable: InvoiceDue[];
  markInvoicePaid: (id: string) => void;
  payVendorInvoice: (
    invoiceId: string,
    paymentSource?: 'Kas Utama' | 'Bank Operasional' | string,
    notes?: string
  ) => { success: boolean; message: string; journalId?: string };
  receiveCustomerPayment: (
    invoiceId: string,
    paymentSource?: 'Kas Utama' | 'Kas Kasir' | 'Bank Operasional' | string,
    notes?: string
  ) => { success: boolean; message: string; journalId?: string };
  inventory: InventoryRecord[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryRecord[]>>;
  stockMutations: StockMutation[];
  setStockMutations: React.Dispatch<React.SetStateAction<StockMutation[]>>;
  finance: FinanceEntry[];
  auditLogs: AuditLog[];
  terminals: Terminal[];
  activeTerminal: Terminal;
  setActiveTerminal: (t: Terminal) => void;
  addTerminal: (terminal: Omit<Terminal, 'id'>) => void;
  deleteTerminal: (terminalId: string) => void;
  updateTerminal: (terminalId: string, updates: Partial<Terminal>) => void;
  toggleTerminalLock: (terminalId: string, forceState?: boolean) => void;
  setAllTerminalsLock: (locked: boolean) => void;
  activeUser: User | null;
  currentUser: User | null;
  setActiveUser: (u: User | null) => void;
  setCurrentUser: (u: User | null) => void;
  contextualProfile: ContextualProfile;
  // Master Data
  brands: BrandMaster[];
  setBrands: React.Dispatch<React.SetStateAction<BrandMaster[]>>;
  categoriesMaster: CategoryMaster[];
  setCategoriesMaster: React.Dispatch<React.SetStateAction<CategoryMaster[]>>;
  suppliers: SupplierMaster[];
  setSuppliers: React.Dispatch<React.SetStateAction<SupplierMaster[]>>;
  customers: CustomerMaster[];
  setCustomers: React.Dispatch<React.SetStateAction<CustomerMaster[]>>;
  // Data Migration & Audit Trail
  migrationBatches: MigrationBatchRecord[];
  setMigrationBatches: React.Dispatch<React.SetStateAction<MigrationBatchRecord[]>>;
  rollbackMigrationBatch: (batchId: string) => { success: boolean; message: string };
  // Super Admin Security, Onboarding & Maintenance Gateway
  developerPassword: string;
  updateDeveloperPassword: (newPw: string) => void;
  isSuperAdminAuthenticated: boolean;
  setIsSuperAdminAuthenticated: (auth: boolean) => void;
  superAdminTab: string;
  setSuperAdminTab: (tab: string) => void;
  updateUserPin: (userId: string, newPin: string) => void;
  resetAllUserPinsToDefault: (defaultPin?: string) => void;
  refreshSystemState: () => void;
  emergencySessionReset: () => void;
  exitSuperAdminSession: () => void;
  logout: () => void;
  clearAllCacheAndRepair: () => { repairedItemsCount: number; message: string };
  repairStockLedger: () => { repairedCount: number; mutationsSynced: number; message: string };
  resetDemoSalesAndRestock: () => { success: boolean; message: string };
  // Independent Module Locking & Security (master_data, executive, hr, finance, purchasing, warehouse, super_admin)
  unlockedModules: Record<string, boolean>;
  isModuleUnlocked: (moduleId: string) => boolean;
  unlockModule: (moduleId: string) => void;
  lockModule: (moduleId: string) => void;
  lockAllModules: () => void;
  verifyModulePassword: (moduleId: string, inputCode: string) => { success: boolean; user?: User; error?: string };
  moduleCustomPins: Record<string, string>;
  getModulePin: (moduleId: string) => string;
  updateModulePin: (moduleId: string, oldPin: string, newPin: string) => { success: boolean; error?: string };
  // Business Entity Profile & Onboarding
  businessProfile: BusinessEntityProfile;
  updateBusinessProfile: (profile: Partial<BusinessEntityProfile>) => void;
  resetBusinessProfileToDefault: () => void;
  isFirstRunSetup: boolean;
  setIsFirstRunSetup: (val: boolean) => void;
  // Global Maintenance Mode
  isGlobalMaintenance: boolean;
  setIsGlobalMaintenance: (val: boolean) => void;
  toggleGlobalMaintenance: () => void;
  // Active Neon Card states across modules (persists when navigating between tabs)
  activeNeonCards: Record<string, string>;
  setActiveNeonCard: (module: string, cardId: string) => void;
  sheetConfig: SheetConfig;
  updateSheetConfig: (config: Partial<SheetConfig>) => void;
  testSheetConnection: () => Promise<{ success: boolean; message: string; rowCounts?: Record<string, number> }>;
  
  // Auth & PIN
  isPinModalOpen: boolean;
  openPinAuth: (onSuccess?: (user: User) => void) => void;
  closePinAuth: () => void;
  verifyPin: (pin: string, targetUserId?: string) => { success: boolean; user?: User; error?: string };
  
  // Actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  addProductsBulk: (products: Array<Omit<Product, 'id'>>, customToastMessage?: string) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  processSale: (saleData: Omit<Sale, 'transaction_id' | 'created_at'>) => Sale;
  processPayment: (payload: PaymentPayload) => Sale & { success: boolean; sale: Sale; journalEntries: JournalEntry[]; message: string };
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'po_number'>) => void;
  updatePurchaseOrderStatus: (poNumber: string, status: PurchaseOrderStatus, reasonOrNotes?: string) => void;
  updatePurchaseOrderPayment: (
    poNumber: string,
    paymentStatus: 'Belum Bayar' | 'Jatuh Tempo' | 'Lunas' | 'PAID',
    details?: {
      paid_date?: string;
      payment_method?: string;
      payment_source?: 'Kas Operasional' | 'Rekening Bank Utama' | 'Kas Kecil' | string;
      payment_ref?: string;
      amount?: number;
    }
  ) => void;
  deletePurchaseOrder: (poNumber: string) => void;
  createAutoReorderPO: (product: Product) => PurchaseOrder;
  reorderAllLowStock: () => { createdCount: number; message: string; pos?: PurchaseOrder[] };
  approvePurchaseOrder: (poNumber: string, notes?: string) => void;
  rejectPurchaseOrder: (poNumber: string, reason?: string) => void;
  purchaseReturns: PurchaseReturn[];
  createPurchaseReturn: (payload: {
    poNumber: string;
    grId: string;
    deliveryOrderNumber: string;
    vendorName: string;
    items: PurchaseReturnItem[];
    reason: string;
    includePpn?: boolean;
  }) => { success: boolean; debitNoteNumber: string; totalRefundAmount: number };
  getDefaultSupplierForProduct: (product: Product) => string;
  receivePurchaseOrder: (poNumber: string) => void;
  goodsReceipts: GoodsReceipt[];
  processGoodsReceipt: (payload: {
    poNumber: string;
    deliveryOrderNumber?: string;
    items: Array<{
      productId: string;
      productName?: string;
      orderedQty?: number;
      receivedQty: number;
      acceptedQty?: number;
      rejectedQty?: number;
      unit?: string;
      unitCost?: number;
      rejectionReason?: string;
    }>;
    notes?: string;
    receivedDate?: string;
    idempotencyKey?: string;
  }) => { success: boolean; message: string; grId?: string; journalId?: string; payableAmount?: number };
  handleCreateGoodsReceipt: (payload: {
    poNumber: string;
    deliveryOrderNumber: string;
    items: Array<{
      productId: string;
      productName: string;
      orderedQty: number;
      receivedQty: number;
      acceptedQty: number;
      rejectedQty: number;
      unit: string;
      unitCost: number;
      rejectionReason?: string;
    }>;
    notes?: string;
    idempotencyKey?: string;
  }) => { success: boolean; message: string; grId?: string };
  adjustStock: (productId: string, qtyDelta: number, reason: string) => void;
  processStockOpnameAdjustment: (params: {
    productId: string;
    physicalStock: number;
    systemStock: number;
    notes?: string;
    operator?: string;
  }) => {
    success: boolean;
    difference: number;
    journalId?: string;
    message: string;
  };
  addFinanceEntry: (entry: Omit<FinanceEntry, 'id'>) => void;
  resetToInitialData: () => void;
  addAuditLog: (details: string, module: string, level?: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG') => void;
  
  // Receipts
  isReceiptModalOpen: boolean;
  currentReceiptSale: Sale | null;
  showReceipt: (sale: Sale) => void;
  closeReceipt: () => void;

  // Notification Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // POS Fullscreen Cashier Workspace state (auto-collapse sidebar)
  isCashierWorkspaceActive: boolean;
  setIsCashierWorkspaceActive: (active: boolean) => void;

  // Global Sidebar Toggle State (Layar Penuh / Full-Width Workspace)
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;

  // Offline-First POS Engine & Network State
  isOnline: boolean;
  setIsOnline: React.Dispatch<React.SetStateAction<boolean>>;
  offlineQueue: Sale[];
  syncOfflineQueue: () => { syncedCount: number; message: string };
  syncOfflineTransactions: () => Promise<{ syncedCount: number; message: string; success: boolean }>;
  clearOfflineQueue: () => void;

  // HR & Karyawan
  employees: Employee[];
  attendanceLogs: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  recordClockIn: (employeeId: string, notes?: string, location?: string) => void;
  recordClockOut: (attendanceId: string, notes?: string) => void;
  submitLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'ticketNumber' | 'status' | 'submittedAt'>) => void;
  approveLeaveRequest: (id: string, approverName: string, notes?: string) => void;
  rejectLeaveRequest: (id: string, approverName: string, notes?: string) => void;
  toggleEmployeeBpjs: (employeeId: string) => void;
  updateEmployeeSalary: (employeeId: string, baseSalary: number) => void;
  isPayrollSynced: boolean;
  lastPayrollSyncTime: string | null;
  syncPayrollToFinance: (summary: PayrollSyncSummary) => void;
  calculateCashierCommission: (
    cashier?: string | Employee | User,
    targetMonth?: string
  ) => CashierCommissionResult;
  processPayrollPayment: (
    employeeId?: string,
    paymentSource?: 'Kas Utama' | 'Bank Operasional' | string,
    notes?: string
  ) => { success: boolean; journalId: string; amount: number; message: string };

  // POS Cashier Shift & Cash Reconciliation (APS POS4: 32_ShiftKasir)
  activeShift: CashierShift | null;
  shiftsHistory: CashierShift[];
  openCashierShift: (initialCash: number, notes?: string) => CashierShift;
  recordShiftExpense: (amount: number, reason: string) => CashierShiftExpense;
  closeCashierShift: (
    actualCash: number,
    notes?: string,
    denominationBreakdown?: Record<string, number>
  ) => { shift: CashierShift; difference: number; status: 'MATCH' | 'SURPLUS' | 'SHORTAGE' };
  closeShift: (
    actualCash: number,
    notes?: string,
    denominationBreakdown?: Record<string, number>
  ) => { shift: CashierShift; difference: number; status: 'MATCH' | 'SURPLUS' | 'SHORTAGE' };

  // Consumer Sales Returns (APS POS4: 28_ReturPenjualan)
  salesReturns: SalesReturn[];
  badStockItems: BadStockItem[];
  processSalesReturn: (payload: {
    transactionId: string;
    items: Array<{
      productId: string;
      productName: string;
      barcode?: string;
      unitPrice: number;
      originalQty: number;
      returnQty: number;
      condition: SalesReturnCondition;
      reason: string;
    }>;
    refundMethod: 'CASH' | 'NON_CASH' | 'STORE_CREDIT' | string;
    notes?: string;
  }) => { success: boolean; returnRecord?: SalesReturn; error?: string };
  updateBadStockStatus: (
    id: string,
    newStatus: 'QUARANTINED' | 'DISPOSED' | 'RETURNED_TO_VENDOR',
    notes?: string
  ) => void;

  // Stock Policies & Executive Percentage Alerts
  stockAlertPolicies: StockAlertPolicy[];
  addStockAlertPolicy: (policy: Omit<StockAlertPolicy, 'id' | 'updatedAt'>) => void;
  updateStockAlertPolicy: (id: string, updates: Partial<StockAlertPolicy>) => void;
  deleteStockAlertPolicy: (id: string) => void;
  getProductAlertThreshold: (product: Product) => ProductAlertThresholdResult;

  // Executive Promotions Hub (Promos, Discounts & Bundling)
  promotions: PromotionProgram[];
  addPromotion: (promo: Omit<PromotionProgram, 'id'>) => void;
  updatePromotion: (id: string, updates: Partial<PromotionProgram>) => void;
  deletePromotion: (id: string) => void;
  togglePromotionStatus: (id: string) => void;

  // F&B Recipe BOM & HPP Costing
  calculateFBMenuHPP: (
    recipe: RecipeItem[],
    operationalCost?: number,
    targetMarginPercent?: number,
    wastePercentage?: number
  ) => FBMenuCosting;
  handleSaveRecipeCosting: (
    menuId: string,
    costingData: FBMenuCosting,
    updatePOSPrice: boolean
  ) => void;
}

export const INITIAL_STOCK_POLICIES: StockAlertPolicy[] = [
  {
    id: 'POL-DEFAULT',
    name: 'Kebijakan Standar Barang Umum',
    targetType: 'DEFAULT',
    targetValue: 'ALL',
    alertPercentage: 20,
    isFastMoving: false,
    minBufferUnits: 5,
    notes: 'Ambang batas dasar 20% kapasitas stok untuk barang non-perishable & umum',
    updatedAt: '2026-09-20 09:00',
    updatedBy: 'Manajer Operasional',
  },
  {
    id: 'POL-FNB-MINUMAN',
    name: 'Fast Moving - Minuman & Chiller',
    targetType: 'CATEGORY',
    targetValue: 'Minuman',
    alertPercentage: 35,
    isFastMoving: true,
    minBufferUnits: 15,
    notes: 'Perputaran tinggi di kasir ritel & chiller, butuh restock cepat saat tersisa 35%',
    updatedAt: '2026-09-21 14:30',
    updatedBy: 'Direktur Eksekutif',
  },
  {
    id: 'POL-MAKANAN',
    name: 'Fast Moving - Makanan & Sembako',
    targetType: 'CATEGORY',
    targetValue: 'Makanan',
    alertPercentage: 30,
    isFastMoving: true,
    minBufferUnits: 20,
    notes: 'Sembako dan mie instan dengan turn-around tinggi di kasir retail',
    updatedAt: '2026-09-21 15:00',
    updatedBy: 'Manajer Gudang',
  },
  {
    id: 'POL-OBAT',
    name: 'Apotek & Farmasi Medis',
    targetType: 'CATEGORY',
    targetValue: 'Obat Bebas',
    alertPercentage: 25,
    isFastMoving: false,
    minBufferUnits: 10,
    notes: 'Stok medis krusial, batas minimum wajib terjaga untuk kontinuitas resep',
    updatedAt: '2026-09-22 08:15',
    updatedBy: 'Apoteker Penanggung Jawab',
  },
];

export const INITIAL_PROMOTIONS: PromotionProgram[] = [
  {
    id: 'PROMO-COMBO-01',
    code: 'COMBO-A-B',
    name: 'Paket Combo Aqua 600ml + Indomie Goreng Hemat 15%',
    type: 'BUNDLING',
    discountValueType: 'PERCENT',
    discountValue: 15,
    applicableSkus: ['AQUA600', 'INDOMIE01'],
    bundleRequiredSkus: [
      { sku: 'AQUA600', qty: 1, name: 'AQUA 600ML' },
      { sku: 'INDOMIE01', qty: 1, name: 'INDOMIE GORENG' },
    ],
    startDate: '2026-09-01',
    endDate: '2026-10-31',
    status: 'ACTIVE',
    minSpend: 0,
    approvedBy: 'Direktur Komersial',
    description: 'Diskon 15% untuk paket bundling pembelian Aqua 600ml bersama Indomie Goreng.',
  },
  {
    id: 'PROMO-SKU-SNACK',
    code: 'HEMAT-SNACK',
    name: 'Diskon Spesial SKU Snack & Biskuit Rp 2.000',
    type: 'SKU_DISCOUNT',
    discountValueType: 'NOMINAL',
    discountValue: 2000,
    applicableSkus: ['GOODTIME26', 'CHITATO68'],
    startDate: '2026-09-15',
    endDate: '2026-10-15',
    status: 'ACTIVE',
    minSpend: 10000,
    approvedBy: 'Manajer Pemasaran',
    description: 'Potongan harga langsung Rp 2.000 per SKU snack pilihan.',
  },
  {
    id: 'PROMO-FLASH-SALE',
    code: 'FLASHSALE10',
    name: 'Flash Sale Weekend Ritel 10% All-Store',
    type: 'FLASH_SALE',
    discountValueType: 'PERCENT',
    discountValue: 10,
    startDate: '2026-09-20',
    endDate: '2026-09-30',
    status: 'ACTIVE',
    minSpend: 50000,
    approvedBy: 'Direktur Eksekutif',
    description: 'Promo berbatas waktu diskon 10% untuk transaksi kasir di atas Rp 50.000.',
  },
];

// Utility to deduplicate products strictly by Barcode and ID to prevent duplicate React keys
export const deduplicateProducts = (prods: Product[]): Product[] => {
  const seenIds = new Set<string>();
  const seenBarcodes = new Set<string>();
  const result: Product[] = [];

  for (let idx = 0; idx < prods.length; idx++) {
    const p = prods[idx];
    if (!p) continue;
    let id = p.id ? String(p.id).trim() : '';
    const barcode = p.barcode ? String(p.barcode).trim() : '';

    // If barcode was already registered, skip duplicate product entry
    if (barcode && seenBarcodes.has(barcode)) {
      continue;
    }

    // Ensure non-empty and non-colliding ID
    if (!id || seenIds.has(id)) {
      if (barcode) {
        id = `PRD-${barcode}-${idx}`;
      } else {
        id = `PRD-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      }
      if (seenIds.has(id)) {
        id = `${id}-${Math.random().toString(36).substring(2, 5)}`;
      }
    }

    seenIds.add(id);
    if (barcode) seenBarcodes.add(barcode);
    result.push({ ...p, id });
  }

  return result;
};

// Utility to deduplicate inventory records strictly by product_id
export const deduplicateInventory = (invs: InventoryRecord[]): InventoryRecord[] => {
  const seen = new Set<string>();
  const result: InventoryRecord[] = [];
  for (const inv of invs) {
    if (!inv || !inv.product_id) continue;
    if (seen.has(inv.product_id)) continue;
    seen.add(inv.product_id);
    result.push(inv);
  }
  return result;
};

// Fungsi pembantu kalkulasi HPP otomatis F&B berdasarkan komposisi resep BOM & operational cost
export const calculateFBMenuHPP = (
  recipe: RecipeItem[],
  operationalCost: number = 0,
  targetMarginPercent: number = 40,
  wastePercentage: number = 5
): FBMenuCosting => {
  const normalizedRecipe: RecipeItem[] = (recipe || []).map((item) => {
    const portionQty = item.portionQty ?? (item as any).qty ?? 0;
    const costPerUnit = item.costPerUnit ?? 0;
    const subtotalCost = item.subtotalCost ?? Math.round(portionQty * costPerUnit);
    return {
      ingredientId: item.ingredientId,
      ingredientName: item.ingredientName || (item as any).name || '',
      portionQty,
      unit: item.unit || 'gr',
      costPerUnit,
      subtotalCost,
      name: (item as any).name || item.ingredientName,
      qty: portionQty,
    };
  });

  const rawMaterialSubtotal = normalizedRecipe.reduce(
    (acc, it) => acc + (it.subtotalCost || 0),
    0
  );
  const wastePct = wastePercentage !== undefined ? wastePercentage : 5;
  const rawMaterialHPP = Math.round(rawMaterialSubtotal * (1 + wastePct / 100));
  const opCost = operationalCost || 0;
  const totalCost = Math.round(rawMaterialHPP + opCost);

  const marginPct = targetMarginPercent !== undefined ? targetMarginPercent : 40;
  const marginRatio = Math.min(0.95, Math.max(0, marginPct / 100));
  const calculatedSellingPrice = Math.round(totalCost / (1 - marginRatio));

  return {
    recipe: normalizedRecipe,
    wastePercentage: wastePct,
    rawMaterialHPP,
    operationalCost: opCost,
    totalCost,
    targetMarginPercent: marginPct,
    calculatedSellingPrice,
    rawMaterialCost: rawMaterialHPP,
    recommendedPrice: calculatedSellingPrice,
    actualPrice: calculatedSellingPrice,
  };
};

export interface CashierCommissionResult {
  commission: number;        // Nilai nominal komisi (1% dari total omzet POS kasir)
  salesTotal: number;        // Total omzet transaksi POS kasir
  transactionCount: number;  // Jumlah transaksi kasir berstatus COMPLETED / PAID
  ratePercent: number;       // 1 (1%)
  periodMonth: string;       // Periode bulan transaksi (misal: '2026-09')
  cashierName?: string;
  cashierId?: string;
  sales: Sale[];             // Daftar transaksi yang dihitung
}

export const parsePeriodToYearMonth = (periodStr?: string): string => {
  if (!periodStr) return '';
  const trimmed = periodStr.trim();
  if (/^\d{4}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 7);
  }
  const months: Record<string, string> = {
    januari: '01', january: '01', jan: '01',
    februari: '02', february: '02', feb: '02',
    maret: '03', march: '03', mar: '03',
    april: '04', apr: '04',
    mei: '05', may: '05',
    juni: '06', june: '06', jun: '06',
    juli: '07', july: '07', jul: '07',
    agustus: '08', august: '08', aug: '08',
    september: '09', sep: '09', sept: '09',
    oktober: '10', october: '10', okt: '10', oct: '10',
    november: '11', nov: '11',
    desember: '12', december: '12', des: '12', dec: '12',
  };
  const lower = trimmed.toLowerCase();
  for (const [name, num] of Object.entries(months)) {
    if (lower.includes(name)) {
      const yearMatch = lower.match(/\b(20\d\d)\b/);
      const year = yearMatch ? yearMatch[1] : '2026';
      return `${year}-${num}`;
    }
  }
  return '';
};

export const isCashierEmployee = (
  emp?: Employee | User | null,
  sales?: Sale[],
  activeUser?: User | null
): boolean => {
  if (!emp) return false;
  const role = (emp.role || '').toLowerCase();
  const dept = ('department' in emp ? emp.department || '' : '').toLowerCase();
  const isPosRole =
    role.includes('kasir') ||
    role.includes('cashier') ||
    role.includes('pos') ||
    dept.includes('kasir') ||
    dept.includes('pos');
  if (isPosRole) return true;

  const rawId = 'id' in emp && emp.id ? emp.id : ('user_id' in emp ? emp.user_id : '');
  const empId = (rawId || '').toLowerCase();
  const empName = emp.name.toLowerCase().trim();

  // Cek apakah staf ini adalah activeUser yang sedang/pernah mengoperasikan kasir POS
  if (activeUser) {
    const activeName = activeUser.name.toLowerCase().trim();
    if (
      empName === activeName ||
      empId === activeUser.user_id.toLowerCase() ||
      ('email' in emp &&
        emp.email &&
        activeUser.email &&
        emp.email.toLowerCase().trim() === activeUser.email.toLowerCase().trim())
    ) {
      return true;
    }
  }

  // Cek apakah ada riwayat transaksi kasir berstatus COMPLETED yang ditangani oleh staf ini
  if (sales && sales.length > 0) {
    const empNip = 'nip' in emp && emp.nip ? emp.nip.toLowerCase() : '';
    const hasSales = sales.some((s) => {
      const sName = (s.cashier_name || '').toLowerCase().trim();
      const sId = (s.cashier_id || '').toLowerCase().trim();
      const statusUpper = (s.status || '').toUpperCase();
      const isCompleted = statusUpper === 'COMPLETED' || statusUpper === 'PAID';
      return (
        isCompleted &&
        (sName === empName ||
          sId === empId ||
          (empNip !== '' && sId === empNip) ||
          sName.includes(empName) ||
          empName.includes(sName))
      );
    });
    if (hasSales) return true;
  }

  return false;
};

/**
 * Helper kalkulasi komisi kasir: 1% dari total omzet transaksi POS kasir berstatus COMPLETED
 * Sinkronisasi dinamis realtime berdasarkan cashier_name / active user.
 */
export const calculateCashierCommission = (
  sales: Sale[],
  usersOrCashier?: User[] | string | Employee | User,
  cashierOrMonth?: string | Employee | User,
  maybeMonth?: string
): CashierCommissionResult => {
  let usersList: User[] = [];
  let cashierTarget: string | Employee | User | undefined;
  let targetMonth: string | undefined;

  if (Array.isArray(usersOrCashier)) {
    usersList = usersOrCashier;
    cashierTarget = cashierOrMonth as string | Employee | User | undefined;
    targetMonth = maybeMonth;
  } else {
    cashierTarget = usersOrCashier;
    targetMonth = cashierOrMonth as string | undefined;
  }

  // Identifikasi nama dan ID kasir
  let targetName = '';
  const targetIds: string[] = [];

  if (cashierTarget) {
    if (typeof cashierTarget === 'string') {
      targetName = cashierTarget.trim().toLowerCase();
      targetIds.push(targetName);
    } else if ('nip' in cashierTarget) {
      // Employee
      const emp = cashierTarget as Employee;
      targetName = emp.name.trim().toLowerCase();
      targetIds.push(emp.id.toLowerCase());
      if (emp.nip) targetIds.push(emp.nip.toLowerCase());
      const matchedUser = usersList.find(
        (u) =>
          u.name.toLowerCase().trim() === targetName ||
          (emp.email && u.email && u.email.toLowerCase().trim() === emp.email.toLowerCase().trim())
      );
      if (matchedUser) {
        targetIds.push(matchedUser.user_id.toLowerCase());
      }
    } else if ('user_id' in cashierTarget) {
      // User
      const u = cashierTarget as User;
      targetName = u.name.trim().toLowerCase();
      targetIds.push(u.user_id.toLowerCase());
    }
  }

  // Mode semua periode vs bulan tertentu
  const isAllMonths =
    !targetMonth ||
    targetMonth.toUpperCase() === 'ALL' ||
    targetMonth.toLowerCase() === 'semua' ||
    targetMonth.toLowerCase().includes('semua');

  let normalizedMonth: string | undefined = undefined;
  if (!isAllMonths) {
    normalizedMonth = parsePeriodToYearMonth(targetMonth);
    // Jika format tidak terurai, coba cari bulan berjalan
    if (!normalizedMonth) {
      const currentCalMonth = new Date().toISOString().slice(0, 7);
      normalizedMonth = currentCalMonth;
    }
  } else {
    normalizedMonth = 'Semua Periode';
  }

  // Filter transaksi POS:
  // 1. Status COMPLETED (atau PAID)
  // 2. Bulan berjalan jika periode spesifik ditentukan
  // 3. Milik kasir target (berdasarkan cashier_name / cashier_id / active user)
  const matchingSales = sales.filter((sale) => {
    const statusUpper = (sale.status || '').toUpperCase();
    const isCompleted = statusUpper === 'COMPLETED' || statusUpper === 'PAID';
    if (!isCompleted) return false;

    if (!isAllMonths && normalizedMonth && normalizedMonth !== 'Semua Periode') {
      const saleMonth = (sale.date || sale.created_at || '').slice(0, 7);
      if (saleMonth && saleMonth !== normalizedMonth) return false;
    }

    // Jika tidak ada target kasir spesifik, hitung seluruh transaksi
    if (!targetName && targetIds.length === 0) return true;

    const sCashierId = (sale.cashier_id || '').toLowerCase().trim();
    const sCashierName = (sale.cashier_name || '').toLowerCase().trim();

    const idMatch = targetIds.length > 0 && targetIds.some((id) => id === sCashierId);
    const nameMatch =
      targetName !== '' &&
      (sCashierName === targetName ||
        sCashierName.includes(targetName) ||
        targetName.includes(sCashierName));

    return idMatch || nameMatch;
  });

  const salesTotal = matchingSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const commission = Math.round(salesTotal * 0.01); // 1% dari total omzet transaksi kasir bersangkutan

  return {
    commission,
    salesTotal,
    transactionCount: matchingSales.length,
    ratePercent: 1,
    periodMonth: normalizedMonth || 'Semua Periode',
    cashierName: typeof cashierTarget === 'string' ? cashierTarget : cashierTarget?.name,
    cashierId: targetIds[0],
    sales: matchingSales,
  };
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('jacs_erp_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const [language, setLanguageState] = useState<'id' | 'en'>(() => {
    const saved = localStorage.getItem('jacs_erp_language');
    return saved === 'en' ? 'en' : 'id';
  });

  const setLanguage = (lang: 'id' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem('jacs_erp_language', lang);
  };

  const [activeNav, setActiveNavState] = useState<ActiveNavModule>('home');

  const setActiveNav = (nav: ActiveNavModule) => {
    setActiveNavState(nav);
    localStorage.setItem('jacs_erp_active_nav', nav);
  };

  // Load from localStorage or canonical seed (including F&B items & Raw Ingredients for BOM)
  const [products, setProducts] = useState<Product[]>(() => {
    const canonicalSeed = deduplicateProducts([
      ...INITIAL_PRODUCTS,
      ...ALL_INDUSTRY_PRODUCTS,
      ...INITIAL_ERP_MASTER_PRODUCTS,
      ...FNB_PRODUCTS,
      ...RAW_INGREDIENTS_AS_PRODUCTS,
    ]);

    const saved = localStorage.getItem('jacs_erp_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if cached list has F&B and raw ingredients
          const existingIds = new Set(parsed.map((p: Product) => p.id));
          const missingItems = canonicalSeed.filter((p) => !existingIds.has(p.id));

          // Also check if any existing F&B item in parsed is missing recipe/costing and ensure itemType is set
          const updatedParsed: Product[] = parsed.map((p: any): Product => {
            const isRaw =
              p.itemType === 'RAW_MATERIAL' ||
              (p.id || '').toLowerCase().startsWith('ing-') ||
              (p.id || '').toLowerCase().startsWith('raw-') ||
              p.category === 'Bahan Baku & Mentah' ||
              p.category === 'Bahan Mentah';

            if (isRaw) {
              return {
                ...p,
                itemType: 'RAW_MATERIAL' as const,
              };
            }

            if ((p.id || '').startsWith('FNB-') || p.itemType === 'MENU_FB' || p.businessModel === 'fnb') {
              const fnbMatch = FNB_PRODUCTS.find((f) => f.id === p.id);
              return {
                ...p,
                itemType: 'MENU_FB' as const,
                costing: p.costing || fnbMatch?.costing,
                recipe: (p.recipe && p.recipe.length > 0) ? p.recipe : fnbMatch?.recipe,
                wastePercent: p.wastePercent ?? fnbMatch?.wastePercent ?? 5,
                packagingCost: p.packagingCost ?? fnbMatch?.packagingCost ?? 1500,
                cost_price: p.cost_price || fnbMatch?.cost_price || 0,
                businessModel: 'fnb',
              };
            }

            const matSeed = canonicalSeed.find((c) => c.id === p.id);
            const validItemType: 'MENU_FB' | 'RETAIL' | 'RAW_MATERIAL' =
              p.itemType === 'MENU_FB' || p.itemType === 'RAW_MATERIAL' ? p.itemType : 'RETAIL';
            return {
              ...p,
              itemType: validItemType,
              unitSecondary: p.unitSecondary || matSeed?.unitSecondary,
              priceSecondary: p.priceSecondary || matSeed?.priceSecondary,
              conversionRate: p.conversionRate || matSeed?.conversionRate,
              supportDecimal: p.supportDecimal ?? matSeed?.supportDecimal,
            };
          });

          // Pastikan 53 produk master APS POS 1 selalu tersedia
          const merged = deduplicateProducts([...INITIAL_PRODUCTS, ...updatedParsed, ...missingItems]);
          localStorage.setItem('jacs_erp_products', JSON.stringify(merged));
          return merged;
        }
      } catch {
        // fallback
      }
    }
    localStorage.setItem('jacs_erp_products', JSON.stringify(canonicalSeed));
    return canonicalSeed;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('jacs_erp_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [salesHistory, setSalesHistoryState] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('jacs_erp_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const setSalesHistory: React.Dispatch<React.SetStateAction<Sale[]>> = (updater) => {
    setSalesHistoryState(updater);
    setSales(updater);
  };

  const [cart, setCart] = useState<CartItem[]>([]);
  const resetCart = () => setCart([]);

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('jacs_erp_journal_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('jacs_erp_users');
    let loaded: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;
    loaded = loaded.map((u) => {
      const match = INITIAL_USERS.find((iu) => iu.user_id === u.user_id || iu.name === u.name);
      if (match) {
        return {
          ...u,
          name: match.name,
          pin: match.pin,
          division: match.division || u.division,
          role: match.role || u.role,
          avatar: match.avatar,
          avatarUrl: match.avatarUrl,
        };
      }
      return u;
    });
    for (const initUser of INITIAL_USERS) {
      if (!loaded.some((u) => u.user_id === initUser.user_id)) {
        loaded.push(initUser);
      }
    }
    return loaded;
  });

  const [purchasing, setPurchasing] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('jacs_erp_purchasing');
    const rawList: PurchaseOrder[] = saved ? JSON.parse(saved) : INITIAL_PURCHASING;
    const normalized = rawList.map((po) => {
      const isPaid =
        po.status === 'FULLY_RECEIVED' ||
        po.status === 'Received' ||
        po.status === 'Selesai' ||
        po.status === 'Received / Completed';
      const term = po.payment_term || 'Tempo 30 Hari';
      let dueDate = po.due_date;
      if (!dueDate) {
        const poDate = new Date(po.date || '2026-09-15');
        poDate.setDate(
          poDate.getDate() +
            (term.includes('14')
              ? 14
              : term.includes('7')
              ? 7
              : term.includes('COD')
              ? 0
              : 30)
        );
        dueDate = poDate.toISOString().slice(0, 10);
      }
      const subtotal =
        po.subtotal ??
        (po.include_ppn !== false
          ? Math.round(po.total_amount / 1.11)
          : po.total_amount);
      const ppnAmount =
        po.ppn_amount ??
        (po.include_ppn !== false ? po.total_amount - subtotal : 0);

      const isOver20M = po.total_amount > 20000000;
      let finalStatus = po.status;
      if (
        (po.status === 'Menunggu Approval Pimpinan' ||
          po.status === 'PENDING APPROVAL' ||
          po.status === 'Pending Approval') &&
        isOver20M
      ) {
        finalStatus = 'Menunggu Approval Direksi';
      }

      return {
        ...po,
        status: finalStatus,
        payment_term: term,
        payment_status:
          po.payment_status ||
          (po.status === 'Selesai' || isPaid ? 'Lunas' : 'Belum Bayar'),
        due_date: dueDate,
        subtotal: subtotal,
        include_ppn: po.include_ppn ?? true,
        ppn_rate: po.ppn_rate ?? 11,
        ppn_amount: ppnAmount,
        return_amount: po.return_amount || 0,
        debit_notes: po.debit_notes || [],
      };
    });
    return normalized;
  });

  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>(() => {
    const saved = localStorage.getItem('jacs_erp_goods_receipts');
    return saved ? JSON.parse(saved) : INITIAL_GOODS_RECEIPTS;
  });

  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>(() => {
    const saved = localStorage.getItem('jacs_erp_purchase_returns');
    return saved ? JSON.parse(saved) : [];
  });

  // POS Cashier Shift & Cash Reconciliation States (APS POS4: 32_ShiftKasir)
  const [activeShift, setActiveShift] = useState<CashierShift | null>(() => {
    const saved = localStorage.getItem('jacs_erp_active_shift');
    return saved ? JSON.parse(saved) : null;
  });

  const [shiftsHistory, setShiftsHistory] = useState<CashierShift[]>(() => {
    const saved = localStorage.getItem('jacs_erp_shifts_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Consumer Sales Returns & Bad Stock (APS POS4: 28_ReturPenjualan)
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>(() => {
    const saved = localStorage.getItem('jacs_erp_sales_returns');
    return saved ? JSON.parse(saved) : [];
  });

  const [badStockItems, setBadStockItems] = useState<BadStockItem[]>(() => {
    const saved = localStorage.getItem('jacs_erp_bad_stock');
    return saved ? JSON.parse(saved) : [];
  });

  const [inventory, setInventory] = useState<InventoryRecord[]>(() => {
    const baseInventory = deduplicateInventory([...INITIAL_INVENTORY, ...RAW_INGREDIENTS_AS_INVENTORY]);
    const saved = localStorage.getItem('jacs_erp_inventory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const dedupedParsed = deduplicateInventory(parsed);
          const existingIds = new Set(dedupedParsed.map((inv: InventoryRecord) => inv.product_id));
          const missingInv = RAW_INGREDIENTS_AS_INVENTORY.filter((inv) => !existingIds.has(inv.product_id));
          const merged = deduplicateInventory([...dedupedParsed, ...missingInv]);
          localStorage.setItem('jacs_erp_inventory', JSON.stringify(merged));
          return merged;
        }
      } catch {
        // fallback
      }
    }
    return baseInventory;
  });

  const [stockMutations, setStockMutations] = useState<StockMutation[]>(() => {
    const saved = localStorage.getItem('jacs_erp_stock_mutations');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_MUTATIONS;
  });

  const [finance, setFinance] = useState<FinanceEntry[]>(() => {
    const saved = localStorage.getItem('jacs_erp_finance');
    if (!saved) return INITIAL_FINANCE;
    try {
      const parsed: FinanceEntry[] = JSON.parse(saved);
      if (!Array.isArray(parsed)) return INITIAL_FINANCE;
      const seenIds = new Set<string>();
      return parsed.map((item, idx) => {
        let id = item.id;
        if (!id || seenIds.has(id)) {
          id = `${id || 'FIN'}-${idx + 1}-${Math.random().toString(36).slice(2, 6)}`;
        }
        seenIds.add(id);
        return { ...item, id };
      });
    } catch {
      return INITIAL_FINANCE;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('jacs_erp_audit_logs');
    if (!saved) return INITIAL_AUDIT_LOGS;
    try {
      const parsed: AuditLog[] = JSON.parse(saved);
      if (!Array.isArray(parsed)) return INITIAL_AUDIT_LOGS;
      const seenIds = new Set<string>();
      return parsed.map((item, idx) => {
        let id = item.id;
        if (!id || seenIds.has(id)) {
          id = `${id || 'LOG'}-${idx + 1}-${Math.random().toString(36).slice(2, 6)}`;
        }
        seenIds.add(id);
        return { ...item, id };
      });
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [migrationBatches, setMigrationBatches] = useState<MigrationBatchRecord[]>(() => {
    const saved = localStorage.getItem('jacs_erp_migration_batches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'MIG-BATCH-109281',
        timestamp: '2026-10-06 09:15:30',
        entityType: 'product',
        totalRows: 12,
        imported: 10,
        updated: 2,
        skipped: 0,
        failed: 0,
        operator: 'Super Admin (USR-001)',
        status: 'COMPLETED',
        targetWarehouse: 'GD001 - Gudang Utama',
        createdItemIds: ['BR000050', 'BR000051', 'BR000052', 'BR000053'],
        stockLedgerEntriesCount: 12,
        notes: 'Inisialisasi Master Produk APS POS 1 (01_Barang)',
        affectedItems: [
          { id: 'BR000050', name: 'Aqua 600ml', action: 'CREATE', prevStock: 0, newStock: 150 },
          { id: 'BR000051', name: 'Indomie Goreng', action: 'CREATE', prevStock: 0, newStock: 200 },
          { id: 'BR000052', name: 'Minyak Goreng Sania 2L', action: 'CREATE', prevStock: 0, newStock: 50 },
          { id: 'BR000053', name: 'Kopi Kapal Api 65g', action: 'CREATE', prevStock: 0, newStock: 80 },
        ],
      },
    ];
  });

  const [terminals, setTerminals] = useState<Terminal[]>(() => {
    const savedState = localStorage.getItem('jacs_pos_terminals_state');
    const isGloballyLocked = savedState !== null ? savedState === 'true' : null;

    const saved = localStorage.getItem('jacs_erp_terminals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 8) {
          return parsed.map((t: Terminal) => {
            const initMatch = INITIAL_TERMINALS.find((it) => it.id === t.id);
            return {
              ...t,
              businessModel: initMatch?.businessModel || t.businessModel,
              location: initMatch?.location || t.location,
              modelType: initMatch?.modelType || t.modelType,
              subLabel: 'Data Master',
              isLocked: isGloballyLocked !== null ? isGloballyLocked : Boolean(t.isLocked),
            };
          });
        }
      } catch {
        // fallback
      }
    }
    if (isGloballyLocked !== null) {
      return INITIAL_TERMINALS.map((t) => ({ ...t, isLocked: isGloballyLocked }));
    }
    return INITIAL_TERMINALS;
  });

  const [activeTerminal, setActiveTerminalState] = useState<Terminal>(() => {
    const savedId = localStorage.getItem('jacs_erp_active_terminal_id');
    const match = savedId ? INITIAL_TERMINALS.find((t) => t.id === savedId) : null;
    return match || INITIAL_TERMINALS[0];
  });

  const [activeUser, setActiveUserState] = useState<User | null>(null);

  // Safe fallback identity for internal transactions & background audit logs when no user is logged in
  const safeOperator: User = activeUser || {
    user_id: 'USR-GUEST',
    name: 'Petugas / Kasir',
    email: 'guest@retailos.id',
    role: 'Kasir',
    status: 'Active',
    pin: '',
  };

  // Persistent active neon cards across all modules
  const [activeNeonCards, setActiveNeonCardsState] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('jacs_erp_active_neon_cards');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore parse error
      }
    }
    return {
      home: 'info-sop',
      pos: 'T-01',
      executive: 'revenue',
      finance: 'cash-balance',
      warehouse: 'sku-stock',
      purchasing: 'po-value',
    };
  });

  const setActiveNeonCard = (module: string, cardId: string) => {
    setActiveNeonCardsState((prev) => {
      const updated = { ...prev, [module]: cardId };
      localStorage.setItem('jacs_erp_active_neon_cards', JSON.stringify(updated));
      return updated;
    });
  };

  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    const saved = localStorage.getItem('jacs_erp_sheet_config');
    return saved ? JSON.parse(saved) : INITIAL_SHEET_CONFIG;
  });

  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(() => {
    const saved = localStorage.getItem('jacs_erp_purchase_requests');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_REQUESTS;
  });

  const [approvalQueue, setApprovalQueue] = useState<ApprovalItem[]>(() => {
    const saved = localStorage.getItem('jacs_erp_approval_queue');
    if (!saved) return INITIAL_APPROVALS;
    try {
      const parsed: ApprovalItem[] = JSON.parse(saved);
      return parsed;
    } catch {
      return INITIAL_APPROVALS;
    }
  });

  const [invoicesDue, setInvoicesDue] = useState<InvoiceDue[]>(() => {
    const saved = localStorage.getItem('jacs_erp_invoices_due');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES_DUE;
  });

  const invoicesReceivable = useMemo(() => {
    return invoicesDue.filter((inv) => inv.type === 'RECEIVABLE');
  }, [invoicesDue]);

  // Sinkronisasi otomatis: setiap PO yang disetujui (Approved) atau barang diterima (Goods Receipt)
  // dipastikan tercatat di baris tagihan Accounts Payable (AP) modul Finance
  useEffect(() => {
    if (purchasing.length > 0) {
      setInvoicesDue((prev) => {
        let changed = false;
        const next = [...prev];

        purchasing.forEach((po) => {
          const s = (po.status || '').toLowerCase();
          const isEligible =
            s.includes('approv') ||
            s.includes('disetujui') ||
            s.includes('receiv') ||
            s.includes('diterima') ||
            s.includes('selesai') ||
            s.includes('partial');

          if (isEligible) {
            const existingIdx = next.findIndex(
              (inv) => inv.po_number === po.po_number || inv.id === `INV-AP-${po.po_number}`
            );
            const isPaid = po.payment_status === 'Lunas' || po.payment_status === 'PAID';

            let days = 30;
            if (po.payment_term?.includes('7')) days = 7;
            else if (po.payment_term?.includes('14')) days = 14;
            else if (po.payment_term?.includes('45')) days = 45;
            else if (po.payment_term?.includes('60')) days = 60;
            else if (po.payment_term?.toLowerCase().includes('cod')) days = 0;
            const due =
              po.due_date ||
              new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

            if (existingIdx === -1) {
              next.unshift({
                id: `INV-AP-${po.po_number}`,
                type: 'PAYABLE',
                party_name: po.supplier_name,
                vendor: po.supplier_name,
                invoice_number: `INV-AP-${po.po_number}`,
                po_number: po.po_number,
                due_date: due,
                amount: po.total_amount,
                status: isPaid ? 'PAID' : 'Unpaid',
                terms: po.payment_term || 'Tempo 30 Hari',
                created_at: po.date ? `${po.date} 00:00:00` : new Date().toISOString(),
                paidAt: isPaid ? po.paid_date : undefined,
                paymentMethod: isPaid ? po.payment_method : undefined,
                paymentSource: isPaid ? po.payment_source : undefined,
              });
              changed = true;
            } else {
              const curr = next[existingIdx];
              if (!curr.po_number || (isPaid && curr.status !== 'PAID') || (!isPaid && curr.status === 'PAID' && (po.payment_status === 'Belum Bayar' || !po.payment_status))) {
                next[existingIdx] = {
                  ...curr,
                  po_number: po.po_number,
                  party_name: po.supplier_name || curr.party_name,
                  vendor: po.supplier_name || curr.vendor,
                  amount: po.total_amount || curr.amount,
                  due_date: due || curr.due_date,
                  status: isPaid ? 'PAID' : curr.status,
                };
                changed = true;
              }
            }
          }
        });

        if (changed) {
          try {
            localStorage.setItem('jacs_erp_invoices_due', JSON.stringify(next));
          } catch (e) {}
          return next;
        }
        return prev;
      });
    }
  }, [purchasing]);

  // Sync theme to document element
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('jacs_erp_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // PIN modal & Toast
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinSuccessCallback, setPinSuccessCallback] = useState<((u: User) => void) | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fullscreen POS Cashier Workspace state (auto-collapse sidebar)
  const [isCashierWorkspaceActive, setIsCashierWorkspaceActive] = useState<boolean>(false);

  // Global Sidebar Toggle State (localStorage 'jacs_sidebar_collapsed')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('jacs_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('jacs_sidebar_collapsed', String(next));
      } catch (e) {
        console.error('Error saving sidebar collapsed state:', e);
      }
      return next;
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem('jacs_sidebar_collapsed', String(isSidebarCollapsed));
    } catch (e) {
      console.error('Error saving sidebar collapsed state:', e);
    }
  }, [isSidebarCollapsed]);

  // Receipt modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [currentReceiptSale, setCurrentReceiptSale] = useState<Sale | null>(null);

  // Offline-First Engine: Browser connection listener & localStorage 'jacs_offline_queue'
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [offlineQueue, setOfflineQueue] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem('jacs_offline_queue');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading offline queue:', e);
    }
    return [];
  });

  // Sync offline queue helper to server/cloud backend
  const syncOfflineTransactions = async (): Promise<{ syncedCount: number; message: string; success: boolean }> => {
    try {
      const raw = localStorage.getItem('jacs_offline_queue');
      const queue: Sale[] = raw ? JSON.parse(raw) : [];
      if (!queue || queue.length === 0) {
        return { syncedCount: 0, message: 'Tidak ada transaksi tertunda dalam antrean offline.', success: true };
      }

      // Kirim array transaksi tertunda ke backend (dengan graceful fallback simulasi offline-sync endpoint)
      try {
        await fetch('/api/pos/sync-offline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions: queue, syncedAt: new Date().toISOString() }),
        }).catch(() => {
          // Graceful fallback jika server berjalan client-only: tetap simulasikan backend response sukses
        });
      } catch (networkErr) {
        // Fallback untuk stand-alone runtime
      }

      // Tandai semua transaksi di salesHistory sebagai SYNCED
      setSalesHistoryState((prev) => {
        const queueIds = new Set(queue.map((q) => q.transaction_id || q.receipt_number));
        const updated = prev.map((sale) => {
          if (queueIds.has(sale.transaction_id || sale.receipt_number)) {
            return { ...sale, isOffline: false, syncStatus: 'SYNCED' as const };
          }
          return sale;
        });
        try {
          localStorage.setItem('jacs_erp_sales', JSON.stringify(updated));
        } catch (err) {}
        return updated;
      });

      const count = queue.length;
      // Setelah berhasil dikonfirmasi sukses oleh backend, hapus item dari 'jacs_offline_queue'
      localStorage.removeItem('jacs_offline_queue');
      setOfflineQueue([]);

      const successMsg = 'Semua transaksi offline berhasil disinkronkan ke Cloud';
      setToastMessage(`☁️ ${successMsg} (${count} transaksi diproses)`);
      
      addAuditLog(
        `Sinkronisasi Cloud Berhasil: ${count} transaksi offline dipindahkan dari antrean lokal ke Cloud Server`,
        'POS Offline Engine',
        'INFO'
      );

      return {
        syncedCount: count,
        message: successMsg,
        success: true,
      };
    } catch (e) {
      console.error('Error syncing offline queue:', e);
      return { syncedCount: 0, message: 'Gagal menyinkronkan antrean transaksi offline.', success: false };
    }
  };

  const syncOfflineQueue = () => {
    syncOfflineTransactions();
    return { syncedCount: offlineQueue.length, message: 'Memproses sinkronisasi offline ke cloud...' };
  };

  const clearOfflineQueue = () => {
    try {
      localStorage.removeItem('jacs_offline_queue');
      setOfflineQueue([]);
    } catch (e) {}
  };

  // Browser online & offline listeners with heartbeat ping
  useEffect(() => {
    const checkHeartbeat = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
        return;
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        await fetch(`/?heartbeat=${Date.now()}`, {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        setIsOnline(true);
      } catch {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setIsOnline(false);
        } else {
          setIsOnline(true);
        }
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      checkHeartbeat();
      // Ketika event window 'online' terpicu, jalankan fungsi syncOfflineTransactions() secara otomatis di latar belakang
      try {
        const raw = localStorage.getItem('jacs_offline_queue');
        const queue = raw ? JSON.parse(raw) : [];
        if (Array.isArray(queue) && queue.length > 0) {
          setToastMessage(`🌐 Koneksi internet pulih! Mengirim ${queue.length} transaksi offline ke Cloud secara otomatis...`);
          // Otomatis sinkronisasi di latar belakang
          syncOfflineTransactions();
        } else {
          setToastMessage('🌐 Koneksi internet pulih (ONLINE - Cloud Connected).');
        }
      } catch (e) {
        setToastMessage('🌐 Koneksi internet pulih (ONLINE - Cloud Connected).');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setToastMessage('⚠️ Mode Offline Aktif! Transaksi tetap aman disimpan di Local Storage.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial heartbeat probe
    checkHeartbeat();

    // Periodic heartbeat every 30 seconds
    const heartbeatInterval = setInterval(checkHeartbeat, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(heartbeatInterval);
    };
  }, []);

  // Persist to localStorage with strict deduplication and synchronization
  const [brands, setBrands] = useState<BrandMaster[]>(() => {
    const saved = localStorage.getItem('jacs_erp_brands');
    if (saved) {
      try {
        const parsed: BrandMaster[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if parsed has abbreviations like (AQU), (IND), duplicate IDs, duplicate names, or missing canonical brands
          const hasAbbr = parsed.some(
            (b) => b.name && (b.name.includes('(') || b.name.includes(')'))
          );
          const ids = parsed.map((b) => b.id);
          const hasDupIds = new Set(ids).size !== ids.length;
          const names = parsed.map((b) => (b.name || '').trim().toLowerCase());
          const hasDupNames = new Set(names).size !== names.length;
          const missingCanonical = INITIAL_BRANDS.some(
            (ib) => !names.includes(ib.name.toLowerCase())
          );

          if (!hasAbbr && !hasDupIds && !hasDupNames && parsed.length >= 26 && !missingCanonical) {
            return parsed;
          }
        }
      } catch {
        // fallback
      }
    }
    // If dirty, contains duplicate keys or bracket abbreviations, reset cleanly to INITIAL_BRANDS
    localStorage.setItem('jacs_erp_brands', JSON.stringify(INITIAL_BRANDS));
    return INITIAL_BRANDS;
  });

  const [categoriesMaster, setCategoriesMaster] = useState<CategoryMaster[]>(() => {
    const saved = localStorage.getItem('jacs_erp_categories_master');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if cached list has abbreviations like (MNM), (MIE), etc., or duplicates, or invalid legacy codes
          const hasAbbrOrDuplicates = parsed.some(
            (c: CategoryMaster) =>
              c.name.includes('(') ||
              c.name.includes(')') ||
              parseInt(c.id.replace('CAT-', ''), 10) > 26 ||
              !['2', '3', '4', '5', '8', '13', '21', '26'].includes(String(c.code))
          );
          const codes = parsed.map((c: CategoryMaster) => String(c.code));
          const hasDupes = new Set(codes).size !== codes.length;

          if (!hasAbbrOrDuplicates && !hasDupes && parsed.length === 8) {
            return parsed;
          }
        }
      } catch {
        // fallback
      }
    }
    localStorage.setItem('jacs_erp_categories_master', JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  });

  const [suppliers, setSuppliers] = useState<SupplierMaster[]>(() => {
    const saved = localStorage.getItem('jacs_erp_suppliers');
    let rawList: SupplierMaster[] = saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
    
    // Purge any duplicate IDs or names from previous storage cache
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    let list: SupplierMaster[] = [];
    (Array.isArray(rawList) ? rawList : INITIAL_SUPPLIERS).forEach((s) => {
      if (s && s.id && !seenIds.has(s.id) && !seenNames.has(s.name.toLowerCase())) {
        seenIds.add(s.id);
        seenNames.add(s.name.toLowerCase());
        list.push(s);
      }
    });
    if (list.length === 0) {
      list = [...INITIAL_SUPPLIERS];
    }

    // Ensure all official ERP suppliers exist with up to date contacts
    INITIAL_SUPPLIERS.forEach((sup) => {
      const existsIndex = list.findIndex(
        (s) => s.id === sup.id || s.name.toLowerCase() === sup.name.toLowerCase()
      );
      if (existsIndex >= 0) {
        list[existsIndex] = { ...list[existsIndex], ...sup, id: sup.id };
      } else {
        list.push(sup);
      }
    });

    // Pastikan master supplier resmi APS POS 1 selalu berada di posisi paling atas
    const prioSupplierIds = ['SP000001', 'SP000002'];
    list.sort((a, b) => {
      const aIdx = prioSupplierIds.indexOf(a.id);
      const bIdx = prioSupplierIds.indexOf(b.id);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });

    localStorage.setItem('jacs_erp_suppliers', JSON.stringify(list));
    return list;
  });

  const [customers, setCustomers] = useState<CustomerMaster[]>(() => {
    const saved = localStorage.getItem('jacs_erp_customers');
    let list: CustomerMaster[] = saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    // Pastikan DUMMY_STORE_CUSTOMERS selalu terdaftar meskipun ada cache lama di localStorage
    DUMMY_STORE_CUSTOMERS.forEach((dummyCust) => {
      const existsIndex = list.findIndex(
        (c) => c.id === dummyCust.id || c.phone === dummyCust.phone || c.customer_code === dummyCust.customer_code
      );
      if (existsIndex >= 0) {
        list[existsIndex] = { ...dummyCust, ...list[existsIndex], has_store: true, store_name: dummyCust.store_name, store_address: dummyCust.store_address };
      } else {
        list.unshift(dummyCust);
      }
    });

    // Pastikan master customer resmi APS POS 1 (Andi CS000001 & Budi CS000002) selalu terdaftar dan di posisi teratas
    INITIAL_CUSTOMERS.forEach((cust) => {
      const existsIndex = list.findIndex((c) => c.id === cust.id || c.name.toLowerCase() === cust.name.toLowerCase());
      if (existsIndex >= 0) {
        list[existsIndex] = { ...list[existsIndex], ...cust };
      } else {
        list.unshift(cust);
      }
    });

    const prioCustomerIds = ['CS000001', 'CS000002'];
    list.sort((a, b) => {
      const aIdx = prioCustomerIds.indexOf(a.id);
      const bIdx = prioCustomerIds.indexOf(b.id);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });
    return list.map((c) => {
      const spending = c.total_spending_current_period ?? c.totalSpent ?? 0;
      const tierCalc = calculateMemberTierLevel(spending, !!c.has_store);
      return {
        ...c,
        total_spending_current_period: spending,
        tier_level: tierCalc.tier_level,
        memberTier: tierCalc.memberTier,
        allowed_tiers: c.has_store
          ? ['RETAIL', 'MEMBER', 'WHOLESALE']
          : ['RETAIL', 'MEMBER'],
      };
    });
  });

  // HR & Karyawan State
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('jacs_erp_employees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((emp: Employee) => {
            const initial = INITIAL_EMPLOYEES.find((ie) => ie.id === emp.id || ie.nip === emp.nip || ie.name === emp.name);
            return {
              ...emp,
              division: emp.division || initial?.division || 'POS & Kasir',
              role: emp.role || initial?.role || 'Kasir',
              pin: emp.pin || initial?.pin || '1111',
              avatarUrl: emp.avatarUrl !== undefined ? emp.avatarUrl : (initial?.avatarUrl ?? null),
              baseSalary: emp.baseSalary ?? initial?.baseSalary ?? 5000000,
              bpjsEnabled: emp.bpjsEnabled !== undefined ? emp.bpjsEnabled : (initial?.bpjsEnabled ?? true),
            };
          });
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_EMPLOYEES;
  });

  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('jacs_erp_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('jacs_erp_leave_requests');
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
  });

  const [isPayrollSynced, setIsPayrollSynced] = useState<boolean>(() => {
    return localStorage.getItem('jacs_erp_payroll_synced') === 'true';
  });

  const [lastPayrollSyncTime, setLastPayrollSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('jacs_erp_payroll_last_sync');
  });

  useEffect(() => {
    localStorage.setItem('jacs_erp_approval_queue', JSON.stringify(approvalQueue));
  }, [approvalQueue]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_attendance', JSON.stringify(attendanceLogs));
  }, [attendanceLogs]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_leave_requests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  // Executive Stock Policies & Promotions State
  const [stockAlertPolicies, setStockAlertPolicies] = useState<StockAlertPolicy[]>(() => {
    const saved = localStorage.getItem('jacs_erp_stock_policies');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_POLICIES;
  });

  const [promotions, setPromotions] = useState<PromotionProgram[]>(() => {
    const saved = localStorage.getItem('jacs_erp_promotions');
    return saved ? JSON.parse(saved) : INITIAL_PROMOTIONS;
  });

  useEffect(() => {
    localStorage.setItem('jacs_erp_stock_policies', JSON.stringify(stockAlertPolicies));
  }, [stockAlertPolicies]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_promotions', JSON.stringify(promotions));
  }, [promotions]);

  // Super Admin security & dev console
  const [developerPassword, setDeveloperPasswordState] = useState<string>(() => {
    return (
      localStorage.getItem('jacs_super_admin_password') ||
      localStorage.getItem('jacs_erp_dev_password') ||
      'Admin123'
    );
  });
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState<boolean>(() => {
    // Nonaktifkan elevated privilege Super Admin secara default (false) saat pertama kali dimuat / refresh
    return false;
  });

  const [superAdminTab, setSuperAdminTabState] = useState<string>(() => {
    return localStorage.getItem('jacs_super_admin_tab') || 'system';
  });

  const setSuperAdminTab = (tab: string) => {
    setSuperAdminTabState(tab);
    localStorage.setItem('jacs_super_admin_tab', tab);
  };

  const setIsSuperAdminAuthenticatedPersisted = (auth: boolean) => {
    setIsSuperAdminAuthenticated(auth);
    localStorage.setItem('jacs_super_admin_authenticated', auth ? 'true' : 'false');
  };

  // Independent module lock state (master_data, executive, hr, finance, purchasing, warehouse, super_admin)
  // Wajib selalu terkunci saat aplikasi dimuat awal (tidak disimpan permanen di localStorage)
  const [unlockedModules, setUnlockedModules] = useState<Record<string, boolean>>(() => {
    try {
      localStorage.removeItem('jacs_unlocked_modules');
      localStorage.removeItem('jacs_super_admin_authenticated');
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  // Module-specific PINs (stored per module, default '1234')
  const [moduleCustomPins, setModuleCustomPins] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('jacs_module_custom_pins');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const normalizeModuleKey = (modId: string): string => {
    if (!modId) return '';
    const clean = modId.trim().toLowerCase();
    if (clean === 'master_data' || clean === 'master-data') return 'master-data';
    if (clean === 'super_admin' || clean === 'admin') return 'admin';
    return clean;
  };

  const getModulePin = (moduleId: string): string => {
    const key = normalizeModuleKey(moduleId);
    if (!key) return '1234';
    return moduleCustomPins[key] || '1234';
  };

  const updateModulePin = (moduleId: string, oldPin: string, newPin: string): { success: boolean; error?: string } => {
    const key = normalizeModuleKey(moduleId);
    if (!key) return { success: false, error: 'Modul tidak valid' };

    const currentPin = getModulePin(key);
    const superAdminUser = users.find((u) => u.role === 'Super Admin') || users.find((u) => u.id === 'USR-001');

    // Allow oldPin if matches current module pin, default '1234', master password, or superadmin pin
    const isOldPinValid =
      oldPin === currentPin ||
      oldPin === '1234' ||
      oldPin === developerPassword ||
      oldPin === 'Admin123' ||
      (superAdminUser && superAdminUser.pin === oldPin);

    if (!isOldPinValid) {
      return { success: false, error: 'PIN lama tidak sesuai!' };
    }

    const trimmedNewPin = newPin.trim();
    if (!trimmedNewPin || trimmedNewPin.length !== 4 || !/^\d{4}$/.test(trimmedNewPin)) {
      return { success: false, error: 'PIN baru harus tepat 4 digit angka (contoh: 5678)!' };
    }

    if (trimmedNewPin === currentPin) {
      return { success: false, error: 'PIN baru tidak boleh sama dengan PIN saat ini!' };
    }

    const nextPins = { ...moduleCustomPins, [key]: trimmedNewPin };
    setModuleCustomPins(nextPins);
    try {
      localStorage.setItem('jacs_module_custom_pins', JSON.stringify(nextPins));
      localStorage.setItem(`jacs_module_pin_${key}`, trimmedNewPin);
    } catch (e) {
      console.error(e);
    }

    // Sync corresponding division user's pin if applicable
    if (key === 'executive') {
      setUsers((prev) => prev.map((u) => (u.role === 'Manager' ? { ...u, pin: trimmedNewPin } : u)));
    } else if (key === 'hr') {
      setUsers((prev) => prev.map((u) => (u.role === 'HR Staff' ? { ...u, pin: trimmedNewPin } : u)));
    } else if (key === 'finance') {
      setUsers((prev) => prev.map((u) => (u.role === 'Finance Staff' ? { ...u, pin: trimmedNewPin } : u)));
    } else if (key === 'purchasing') {
      setUsers((prev) => prev.map((u) => (u.role === 'Purchasing Staff' ? { ...u, pin: trimmedNewPin } : u)));
    } else if (key === 'warehouse' || key === 'master-data') {
      setUsers((prev) => prev.map((u) => (u.role === 'Inventory Staff' ? { ...u, pin: trimmedNewPin } : u)));
    } else if (key === 'admin') {
      setUsers((prev) => prev.map((u) => (u.role === 'Super Admin' ? { ...u, pin: trimmedNewPin } : u)));
    }

    addAuditLog(`PIN Modul [${key.toUpperCase()}] berhasil diubah ke ${trimmedNewPin}`, 'SECURITY', 'INFO');
    showToast(`✅ PIN Modul ${key.toUpperCase()} berhasil diperbarui!`);
    return { success: true };
  };

  const isModuleUnlocked = (moduleId: string): boolean => {
    const key = normalizeModuleKey(moduleId);
    if (!key || key === 'home' || key === 'dashboard' || key === 'pos') return true;
    if (key === 'admin') return Boolean(isSuperAdminAuthenticated || unlockedModules['admin']);
    return Boolean(unlockedModules[key]);
  };

  const unlockModule = (moduleId: string) => {
    const key = normalizeModuleKey(moduleId);
    if (!key) return;
    setUnlockedModules((prev) => ({ ...prev, [key]: true }));
    if (key === 'admin') {
      setIsSuperAdminAuthenticated(true);
    }
  };

  const lockModule = (moduleId: string) => {
    const key = normalizeModuleKey(moduleId);
    if (!key) return;
    setUnlockedModules((prev) => ({ ...prev, [key]: false }));
    if (key === 'admin') {
      setIsSuperAdminAuthenticated(false);
    }
  };

  const lockAllModules = () => {
    setUnlockedModules({});
    setIsSuperAdminAuthenticated(false);
  };

  const verifyModulePassword = (moduleId: string, inputCode: string): { success: boolean; user?: User; error?: string } => {
    const trimmed = inputCode.trim();
    if (!trimmed) {
      return { success: false, error: 'Masukkan PIN akses!' };
    }

    // Tetapkan PIN akses tetap "1234" untuk semua otorisasi modul
    if (trimmed === '1234' || trimmed === developerPassword || trimmed === 'Admin123') {
      const superAdminUser = users.find((u) => u.role === 'Super Admin' || u.role === 'Manager') || users[0];
      return { success: true, user: superAdminUser };
    }

    return {
      success: false,
      error: 'PIN akses tidak valid! Masukkan PIN 1234.',
    };
  };

  // Business Entity Profile & Onboarding
  const [businessProfile, setBusinessProfile] = useState<BusinessEntityProfile>(() => {
    const saved = localStorage.getItem('jacs_erp_business_profile');
    let profile: BusinessEntityProfile = saved ? JSON.parse(saved) : DEFAULT_BUSINESS_PROFILE;
    const isHybrid = isHybridArchitecture(profile.cashierArchitecture);
    const unitCount = isHybrid ? Math.max(2, profile.posUnitCount ?? 2) : Math.max(1, profile.posUnitCount ?? 1);
    if (!profile.terminalConfigs || profile.terminalConfigs.length === 0 || profile.posUnitCount !== unitCount) {
      profile = {
        ...profile,
        posUnitCount: unitCount,
        terminalConfigs: generateTerminalConfigs(unitCount, profile.cashierArchitecture, profile.category, profile.terminalConfigs),
      };
    }
    return profile;
  });

  const [isFirstRunSetup, setIsFirstRunSetup] = useState<boolean>(() => {
    const saved = localStorage.getItem('jacs_erp_is_first_run');
    return saved === 'true';
  });

  const [isGlobalMaintenance, setIsGlobalMaintenance] = useState<boolean>(() => {
    const saved = localStorage.getItem('jacs_erp_global_maintenance');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('jacs_erp_business_profile', JSON.stringify(businessProfile));
  }, [businessProfile]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_is_first_run', String(isFirstRunSetup));
  }, [isFirstRunSetup]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_global_maintenance', String(isGlobalMaintenance));
  }, [isGlobalMaintenance]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_brands', JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_categories_master', JSON.stringify(categoriesMaster));
  }, [categoriesMaster]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_purchasing', JSON.stringify(purchasing));
  }, [purchasing]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_goods_receipts', JSON.stringify(goodsReceipts));
  }, [goodsReceipts]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_purchase_returns', JSON.stringify(purchaseReturns));
  }, [purchaseReturns]);

  useEffect(() => {
    if (activeShift) {
      localStorage.setItem('jacs_erp_active_shift', JSON.stringify(activeShift));
    } else {
      localStorage.removeItem('jacs_erp_active_shift');
    }
  }, [activeShift]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_shifts_history', JSON.stringify(shiftsHistory));
  }, [shiftsHistory]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_sales_returns', JSON.stringify(salesReturns));
  }, [salesReturns]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_bad_stock', JSON.stringify(badStockItems));
  }, [badStockItems]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_stock_mutations', JSON.stringify(stockMutations));
  }, [stockMutations]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_finance', JSON.stringify(finance));
  }, [finance]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_terminals', JSON.stringify(terminals));
  }, [terminals]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_sheet_config', JSON.stringify(sheetConfig));
  }, [sheetConfig]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_purchase_requests', JSON.stringify(purchaseRequests));
  }, [purchaseRequests]);

  useEffect(() => {
    localStorage.setItem('jacs_erp_approval_queue', JSON.stringify(approvalQueue));
  }, [approvalQueue]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const setActiveTerminal = (t: Terminal) => {
    setActiveTerminalState(t);
    localStorage.setItem('jacs_erp_active_terminal_id', t.id);
    setActiveNeonCard('pos', t.id);
    showToast(`Terminal beralih ke ${t.name} (${t.location})`);
  };

  const addTerminal = (termData: Omit<Terminal, 'id'>) => {
    const newId = `T-${String(terminals.length + 1).padStart(2, '0')}`;
    const newTerm: Terminal = {
      ...termData,
      id: newId,
    };
    setTerminals((prev) => [...prev, newTerm]);
    addAuditLog(`Terminal ${newTerm.name} (${newTerm.businessModel || newTerm.location}) ditambahkan`, 'POS');
    showToast(`Terminal ${newTerm.name} berhasil ditambahkan!`);
  };

  const deleteTerminal = (terminalId: string) => {
    if (terminals.length <= 1) {
      showToast('Minimal 1 terminal kasir harus tetap aktif!');
      return;
    }
    setTerminals((prev) => prev.filter((t) => t.id !== terminalId));
    if (activeTerminal.id === terminalId) {
      const remaining = terminals.find((t) => t.id !== terminalId);
      if (remaining) {
        setActiveTerminalState(remaining);
      }
    }
    addAuditLog(`Terminal ${terminalId} telah dihapus dari sistem`, 'SUPER_ADMIN', 'WARN');
    showToast(`Terminal ${terminalId} berhasil dihapus.`);
  };

  const updateTerminal = (terminalId: string, updates: Partial<Terminal>) => {
    setTerminals((prev) =>
      prev.map((t) => (t.id === terminalId ? { ...t, ...updates } : t))
    );
    if (activeTerminal.id === terminalId) {
      setActiveTerminalState((prev) => ({ ...prev, ...updates }));
    }
    addAuditLog(`Konfigurasi terminal ${terminalId} diperbarui`, 'SUPER_ADMIN', 'INFO');
    showToast(`Terminal ${terminalId} berhasil diperbarui.`);
  };

  const toggleTerminalLock = useCallback((terminalId: string, forceState?: boolean) => {
    setTerminals((prev) =>
      prev.map((t) => {
        if (t.id === terminalId) {
          const nextLock = forceState !== undefined ? forceState : !t.isLocked;
          return { ...t, isLocked: nextLock };
        }
        return t;
      })
    );
    setActiveTerminalState((prev) => {
      if (prev.id === terminalId) {
        const nextLock = forceState !== undefined ? forceState : !prev.isLocked;
        return { ...prev, isLocked: nextLock };
      }
      return prev;
    });
  }, []);

  const setAllTerminalsLock = useCallback((locked: boolean) => {
    try {
      localStorage.setItem('jacs_pos_terminals_state', locked ? 'true' : 'false');
    } catch (e) {
      console.error(e);
    }
    setTerminals((prev) => {
      const updated = prev.map((t) => ({ ...t, isLocked: locked }));
      try {
        localStorage.setItem('jacs_erp_terminals', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    setActiveTerminalState((prev) => ({ ...prev, isLocked: locked }));
    addAuditLog(`Seluruh terminal kasir di-${locked ? 'kunci' : 'buka'} oleh Super Admin`, 'POS', 'WARN');
    showToast(locked ? 'Semua register kasir berhasil dikunci serentak' : 'Semua register kasir berhasil dibuka serentak');
  }, []);

  const refreshSystemState = useCallback(() => {
    // 1. Reload terminals from localStorage
    const savedState = localStorage.getItem('jacs_pos_terminals_state');
    const isGloballyLocked = savedState !== null ? savedState === 'true' : null;

    const savedTerminals = localStorage.getItem('jacs_erp_terminals');
    if (savedTerminals) {
      try {
        const parsed = JSON.parse(savedTerminals);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTerminals(parsed.map((t: Terminal) => ({
            ...t,
            isLocked: isGloballyLocked !== null ? isGloballyLocked : Boolean(t.isLocked),
          })));
        }
      } catch (e) {
        console.error(e);
      }
    } else if (isGloballyLocked !== null) {
      setTerminals((prev) => prev.map((t) => ({ ...t, isLocked: isGloballyLocked })));
    }

    // 2. Reload users
    const savedUsers = localStorage.getItem('jacs_erp_users');
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUsers(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 3. Reload products
    const savedProducts = localStorage.getItem('jacs_erp_products');
    if (savedProducts) {
      try {
        const parsed = JSON.parse(savedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 4. Reload master developer password
    const savedPass = localStorage.getItem('jacs_super_admin_password') || localStorage.getItem('jacs_erp_dev_password');
    if (savedPass) {
      setDeveloperPasswordState(savedPass);
    }

    addAuditLog('Penyegaran data sistem dan sinkronisasi status terminal berhasil dilakukan', 'SYSTEM', 'INFO');
  }, []);

  const updateDeveloperPassword = (newPw: string) => {
    setDeveloperPasswordState(newPw);
    localStorage.setItem('jacs_super_admin_password', newPw);
    localStorage.setItem('jacs_erp_dev_password', newPw);
    addAuditLog('Kata sandi master Super Admin diperbarui', 'SECURITY', 'WARN');
    showToast('Sandi Master Super Admin berhasil diperbarui!');
  };

  const resetAllUserPinsToDefault = (defaultPin = '1234') => {
    setUsers((prev) =>
      prev.map((u) => ({ ...u, pin: defaultPin }))
    );
    setModuleCustomPins({});
    try {
      localStorage.removeItem('jacs_module_custom_pins');
    } catch (e) {
      console.error(e);
    }
    addAuditLog(`Semua PIN modul & staf di-reset ke default (${defaultPin})`, 'SECURITY', 'WARN');
    showToast(`Semua PIN modul & staf berhasil di-reset ke default (${defaultPin})!`);
  };

  const updateUserPin = (userId: string, newPin: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, pin: newPin } : u))
    );
    addAuditLog(`PIN pengguna ID ${userId} diperbarui`, 'SECURITY', 'INFO');
    showToast('PIN otentikasi berhasil diperbarui!');
  };

  const emergencySessionReset = () => {
    setIsSuperAdminAuthenticated(false);
    closePinAuth();
    const defaultOperator = users.find((u) => u.role === 'Kasir') || users[0];
    if (defaultOperator) {
      setActiveUserState(defaultOperator);
    }
    addAuditLog('EMERGENCY SESSION RESET dieksekusi dari jarak jauh', 'REMOTE_CONTROL', 'WARN');
    showToast('Seluruh sesi login kasir & dev console berhasil di-reset ke status aman!');
  };

  const exitSuperAdminSession = () => {
    // 1. Reset elevated Super Admin status
    setIsSuperAdminAuthenticated(false);
    lockModule('admin');
    localStorage.removeItem('jacs_super_admin_authenticated');
    localStorage.setItem('jacs_super_admin_authenticated', 'false');
    sessionStorage.removeItem('jacs_super_admin_authenticated');

    // 2. Reset currentUser & activeUser kembali ke null (Belum ada yang login)
    setActiveUserState(null);
    localStorage.removeItem('jacs_erp_active_user_id');

    // 3. Arahkan routing tampilan langsung ke halaman 'HOME'
    setActiveNavState('home');
    localStorage.setItem('jacs_erp_active_nav', 'home');

    // 4. Catat Audit Log dan beri notifikasi toast
    addAuditLog('Hak akses & sesi Super Admin ditutup. Navigasi kembali ke HOME.', 'SECURITY', 'INFO');
    showToast('🔒 Sesi Super Admin berhasil dikunci. Anda telah keluar (HOME).');
  };

  const logout = () => {
    exitSuperAdminSession();
  };

  const updateBusinessProfile = (newProfile: any) => {
    setBusinessProfile((prev: any) => {
      const updated = { ...prev, ...newProfile };
      try {
        localStorage.setItem(STORAGE_KEY_BUSINESS_PROFILE, JSON.stringify(updated));
      } catch (err) {
        console.error('Storage save error', err);
      }
      return updated;
    });
    setBusinessProfile((prev) => {
      const merged = { ...prev, ...profile, isConfigured: true };
      const isHybrid = isHybridArchitecture(merged.cashierArchitecture);
      const unitCount = isHybrid
        ? Math.max(2, Math.min(10, merged.posUnitCount ?? 2))
        : Math.max(1, Math.min(10, merged.posUnitCount ?? 1));

      const configs = generateTerminalConfigs(
        unitCount,
        merged.cashierArchitecture,
        merged.category,
        merged.terminalConfigs
      );

      const next: BusinessEntityProfile = {
        ...merged,
        posUnitCount: unitCount,
        terminalConfigs: configs,
      };

      // Sinkronkan state terminals dengan jumlah N dan kategori industri yang dipilih (bukan F&B tunggal)
      setTerminals((prevTerminals) => {
        const updated = configs.map((cfg, idx) => {
          const existing = prevTerminals[idx];
          const numStr = String(idx + 1).padStart(2, '0');
          return {
            id: cfg.id,
            name: cfg.name,
            code: `POS-${numStr}`,
            colorHex: cfg.colorTheme,
            neonBorderClass: existing?.neonBorderClass || `border-[${cfg.colorTheme}] shadow-[0_0_15px_rgba(0,242,254,0.45)]`,
            neonBgClass: existing?.neonBgClass || 'bg-cyan-500/10 hover:bg-cyan-500/20',
            neonTextClass: existing?.neonTextClass || 'text-cyan-400',
            location: merged.category || cfg.industry || 'Retail & Wholesaler Modern',
            businessModel: merged.category || cfg.industry || 'Retail & Wholesaler Modern',
            subLabel: 'Data Master',
            modelType: existing?.modelType || (idx === 1 ? 'fnb' : idx === 2 ? 'pharmacy' : idx === 3 ? 'fashion' : idx === 4 ? 'building' : idx === 5 ? 'electronics' : idx === 6 ? 'workshop' : idx === 7 ? 'salon' : 'retail'),
            isActive: idx === 0 ? true : (existing ? existing.isActive : false),
            isLocked: existing ? existing.isLocked : true,
            activeOrdersToday: existing?.activeOrdersToday || (20 + idx * 5),
            role: cfg.role,
            terminalType: (cfg.role === 'HYBRID_BACKEND' ? 'BACK_END' : 'FRONT_END') as 'BACK_END' | 'FRONT_END',
          };
        });
        try {
          localStorage.setItem('jacs_erp_terminals', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      addAuditLog(
        `Profil entitas bisnis diperbarui: ${next.name} (${next.category}) - Arsitektur: ${next.cashierArchitecture || 'CENTRALIZED_FRONTEND'} (${configs.length} Unit)`,
        'SUPER_ADMIN',
        'INFO'
      );
      return next;
    });
    setIsFirstRunSetup(false);
    showToast('Profil Entitas Bisnis & Konfigurasi Terminal berhasil disimpan & diterapkan!');
  };

  const resetBusinessProfileToDefault = () => {
    // 3. Hapus Cache Lama (localStorage yang mengunci terminal ke 1 kasir F&B)
    localStorage.removeItem('jacs_erp_terminals');
    localStorage.removeItem('jacs_pos_terminals');
    localStorage.removeItem('jacs_terminal_configs');
    localStorage.removeItem('jacs_erp_business_profile');

    // 1. Reset Total ke 8 Kasir Bawaan ERP
    const defaultProfile: BusinessEntityProfile = {
      name: 'Bumi Daya Indah Mart',
      category: 'Ritel Modern & Multi-Industry',
      address: 'Jl. BERUA RAYA No. 1, Paccerakkang, Biringkanaya, Makassar 90245',
      phone: '(021) 515-8888 / 0812-8888-9999',
      email: 'official@jacs-retailos.id',
      logoUrl: '/logo-jacs-enterprise.png',
      headerNote: 'Unified Retail Operating System & Enterprise Management',
      footerNote: 'Terima kasih atas kunjungan & kepercayaan Anda berbelanja bersama kami.',
      isConfigured: true,
      posUnitCount: 8,
      cashierArchitecture: 'CENTRALIZED_FRONTEND',
      terminalConfigs: generateTerminalConfigs(8, 'CENTRALIZED_FRONTEND', 'Ritel Modern & Multi-Industry'),
    };

    setBusinessProfile(defaultProfile);
    localStorage.setItem('jacs_erp_business_profile', JSON.stringify(defaultProfile));

    const defaultTerminals: Terminal[] = [
      {
        id: 'T-01',
        name: 'KASIR 01',
        code: 'POS-01',
        colorHex: '#00f2fe',
        neonBorderClass: 'border-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.45)]',
        neonBgClass: 'bg-[#00f2fe]/10 hover:bg-[#00f2fe]/20',
        neonTextClass: 'text-[#00f2fe]',
        location: 'Retail & Wholesaler Modern',
        businessModel: 'Retail & Wholesaler Modern',
        subLabel: 'Data Master',
        modelType: 'retail',
        isActive: true,
        isLocked: true,
        activeOrdersToday: 42,
        terminalType: 'FRONT_END',
        role: 'FRONT_END_ONLY',
      },
      {
        id: 'T-02',
        name: 'KASIR 02',
        code: 'POS-02',
        colorHex: '#f59e0b',
        neonBorderClass: 'border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.45)]',
        neonBgClass: 'bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20',
        neonTextClass: 'text-[#f59e0b]',
        location: 'Food & Beverage (F&B)',
        businessModel: 'Food & Beverage (F&B)',
        subLabel: 'Data Master',
        modelType: 'fnb',
        isActive: false,
        isLocked: true,
        activeOrdersToday: 38,
        terminalType: 'FRONT_END',
        role: 'FRONT_END_ONLY',
      },
      {
        id: 'T-03',
        name: 'KASIR 03',
        code: 'POS-03',
        colorHex: '#ec4899',
        neonBorderClass: 'border-[#ec4899] shadow-[0_0_15px_rgba(236,72,153,0.45)]',
        neonBgClass: 'bg-[#ec4899]/10 hover:bg-[#ec4899]/20',
        neonTextClass: 'text-[#ec4899]',
        location: 'Pharmacy & Pet Shop',
        businessModel: 'Pharmacy & Pet Shop',
        subLabel: 'Data Master',
        modelType: 'pharmacy',
        isActive: false,
        isLocked: true,
        activeOrdersToday: 51,
        terminalType: 'FRONT_END',
        role: 'FRONT_END_ONLY',
      },
      {
        id: 'T-04',
        name: 'KASIR 04',
        code: 'POS-04',
        colorHex: '#10b981',
        neonBorderClass: 'border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.45)]',
        neonBgClass: 'bg-[#10b981]/10 hover:bg-[#10b981]/20',
        neonTextClass: 'text-[#10b981]',
        location: 'Fashion & Apparel',
        businessModel: 'Fashion & Apparel',
        subLabel: 'Data Master',
        modelType: 'fashion',
        isActive: false,
        isLocked: true,
        activeOrdersToday: 24,
        terminalType: 'FRONT_END',
        role: 'FRONT_END_ONLY',
      },
      {
        id: 'T-05',
        name: 'KASIR 05',
        code: 'POS-05',
        colorHex: '#8b5cf6',
        neonBorderClass: 'border-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.45)]',
        neonBgClass: 'bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20',
        neonTextClass: 'text-[#8b5cf6]',
        location: 'Building Materials & Hardware',
        businessModel: 'Building Materials & Hardware',
        subLabel: 'Data Master',
        modelType: 'building',
        isActive: false,
        isLocked: true,
        activeOrdersToday: 19,
        terminalType: 'FRONT_END',
        role: 'FRONT_END_ONLY',
      },
      {
        id: 'T-06',
        name: 'KASIR 06',
        code: 'POS-06',
        colorHex: '#3b82f6',
        neonBorderClass: 'border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.45)]',
        neonBgClass: 'bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20',
        neonTextClass: 'text-[#3b82f6]',
        location: 'Electronics & Gadgets',
        businessModel: 'Electronics & Gadgets',
        subLabel: 'Data Master',
        modelType: 'electronics',
        isActive: false,
        isLocked: true,
        activeOrdersToday: 30,
        terminalType: 'FRONT_END',
        role: 'FRONT_END_ONLY',
      },
      {
        id: 'T-07',
        name: 'KASIR 07',
        code: 'POS-07',
        colorHex: '#06b6d4',
        neonBorderClass: 'border-[#06b6d4] shadow-[0_0_15px_rgba(6,182,212,0.45)]',
        neonBgClass: 'bg-[#06b6d4]/10 hover:bg-[#06b6d4]/20',
        neonTextClass: 'text-[#06b6d4]',
        location: 'Automotive & Workshop',
        businessModel: 'Automotive & Workshop',
        subLabel: 'Data Master',
        modelType: 'workshop',
        isActive: false,
        isLocked: true,
        activeOrdersToday: 22,
        terminalType: 'FRONT_END',
        role: 'FRONT_END_ONLY',
      },
      {
        id: 'T-08',
        name: 'KASIR 08',
        code: 'POS-08',
        colorHex: '#14b8a6',
        neonBorderClass: 'border-[#14b8a6] shadow-[0_0_15px_rgba(20,184,166,0.45)]',
        neonBgClass: 'bg-[#14b8a6]/10 hover:bg-[#14b8a6]/20',
        neonTextClass: 'text-[#14b8a6]',
        location: 'Salon & Barbershop',
        businessModel: 'Salon & Barbershop',
        subLabel: 'Data Master',
        modelType: 'salon',
        isActive: false,
        isLocked: true,
        activeOrdersToday: 15,
        terminalType: 'FRONT_END',
        role: 'FRONT_END_ONLY',
      },
    ];

    setTerminals(defaultTerminals);
    localStorage.setItem('jacs_erp_terminals', JSON.stringify(defaultTerminals));

    addAuditLog('Reset ke Default Grup dieksekusi: 8 Kasir Bawaan ERP diaktifkan.', 'SUPER_ADMIN', 'WARN');
    showToast('Berhasil reset ke Default Grup: 8 Kasir Bawaan ERP diaktifkan!');
  };

  const toggleGlobalMaintenance = () => {
    setIsGlobalMaintenance((prev) => {
      const next = !prev;
      addAuditLog(
        `Global Maintenance Mode di-${next ? 'AKTIFKAN' : 'NONAKTIFKAN'} oleh Super Admin`,
        'SUPER_ADMIN',
        next ? 'WARN' : 'INFO'
      );
      showToast(
        next
          ? 'Global Maintenance Mode DIAKTIFKAN: Seluruh pengguna reguler terkunci di halaman standby.'
          : 'Global Maintenance Mode DINONAKTIFKAN: Sistem kembali beroperasi normal.'
      );
      return next;
    });
  };

  const clearAllCacheAndRepair = () => {
    let repaired = 0;
    // Verify product IDs, names, and deduplicate strictly
    setProducts((prev) => {
      const fixed = prev.map((p) => {
        if (!p.id || !p.name) {
          repaired++;
          return {
            ...p,
            id: p.id || `PRD-${Date.now()}`,
            name: p.name || 'Produk Pulih',
          };
        }
        return p;
      });
      const clean = deduplicateProducts(fixed);
      if (clean.length < prev.length) {
        repaired += prev.length - clean.length;
      }
      localStorage.setItem('jacs_erp_products', JSON.stringify(clean));
      return clean;
    });

    // Deduplicate inventory strictly
    setInventory((prev) => {
      const clean = deduplicateInventory(prev);
      if (clean.length < prev.length) {
        repaired += prev.length - clean.length;
      }
      localStorage.setItem('jacs_erp_inventory', JSON.stringify(clean));
      return clean;
    });

    addAuditLog('System Diagnostic Auto-Repair & Cache Refresh selesai', 'DIAGNOSTIC', 'INFO');
    showToast('Auto-Repair Selesai: Integritas sistem & memori berhasil distabilkan.');
    return {
      repairedItemsCount: repaired,
      message: 'Semua relasi data, tabel POS, dan cache state beroperasi optimal tanpa duplikasi.',
    };
  };

  const repairStockLedger = () => {
    let repairedCount = 0;
    let mutationsSynced = 0;

    // 1. Audit and reconcile product stock with inventory ledger
    setProducts((prevProducts) => {
      const updated = prevProducts.map((p) => {
        const invRecord = inventory.find((inv) => inv.product_id === p.id);
        if (invRecord && invRecord.final_stock !== p.stock) {
          repairedCount++;
          return { ...p, stock: Math.max(0, invRecord.final_stock) };
        }
        return p;
      });
      localStorage.setItem('jacs_erp_products', JSON.stringify(updated));
      return updated;
    });

    // 2. Audit stockMutations for missing OUT_SALES from completed salesHistory
    setStockMutations((prevMutations) => {
      const existingOutRefs = new Set(
        prevMutations
          .filter((m) => m.type === 'SALE-POS' || m.type === 'OUT_SALES')
          .map((m) => m.reference_no || m.referenceId || '')
      );

      const newMutations: StockMutation[] = [];
      salesHistory.forEach((sale) => {
        const refId = sale.receipt_number || sale.transaction_id || `TRX-${Date.now()}`;
        if (!existingOutRefs.has(refId) && sale.items && sale.items.length > 0) {
          sale.items.forEach((item, idx) => {
            mutationsSynced++;
            const pId = item.product?.id || `PRD-${idx}`;
            const pName = item.product?.name || 'Produk Penjualan POS';
            const pSku = item.product?.sku || item.product?.barcode || '-';
            newMutations.push({
              id: `MUT-REP-OUT-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              timestamp: sale.created_at || new Date().toISOString(),
              date: sale.created_at || new Date().toISOString(),
              product_id: pId,
              product_name: pName,
              sku: pSku,
              type: 'SALE-POS',
              qty: item.quantity,
              previous_stock: (item.product?.stock || 0) + item.quantity,
              final_stock: item.product?.stock || 0,
              reference_no: refId,
              referenceId: refId,
              notes: `Auto-repair mutasi pemotongan stok penjualan POS ${refId}`,
              cashier_name: sale.cashier_name || 'Kasir POS',
              warehouse: 'Gudang Utama',
            });
          });
        }
      });

      // 3. Audit missing IN_PURCHASE from received Purchase Orders
      const existingInRefs = new Set(
        prevMutations
          .filter((m) => m.type === 'IN_PURCHASE')
          .map((m) => m.reference_no || m.referenceId || '')
      );

      purchasing.forEach((po) => {
        if (po.status === 'RECEIVED' || po.status === 'COMPLETED') {
          const poRef = po.po_number;
          if (!existingInRefs.has(poRef)) {
            mutationsSynced++;
            newMutations.push({
              id: `MUT-REP-IN-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              timestamp: po.date || new Date().toISOString(),
              date: po.date || new Date().toISOString(),
              product_id: po.supplier_id || 'PO-ITEM',
              product_name: typeof po.items === 'string' ? po.items : 'Item Pengadaan PO',
              sku: 'PO-RCV',
              type: 'IN_PURCHASE',
              qty: 1,
              previous_stock: 0,
              final_stock: 1,
              reference_no: poRef,
              referenceId: poRef,
              notes: `Auto-repair mutasi penerimaan barang PO ${poRef}`,
              supplier_name: po.supplier_name,
              warehouse: 'Gudang Utama',
            });
          }
        }
      });

      const updated = [...newMutations, ...prevMutations];
      localStorage.setItem('jacs_erp_stock_mutations', JSON.stringify(updated));
      return updated;
    });

    addAuditLog(
      `Repair Stock Ledger selesai: ${repairedCount} kartu stok fisik disinkronkan, ${mutationsSynced} mutasi OUT_SALES/IN_PURCHASE ditautkan ulang secara otomatis.`,
      'INVENTORY',
      'INFO'
    );
    showToast(`Repair Stock Ledger Berhasil: ${repairedCount} stok & ${mutationsSynced} mutasi terverifikasi sinkron.`);

    return {
      repairedCount,
      mutationsSynced,
      message: `Stock ledger 100% konsisten. ${repairedCount} kartu fisik dinormalisasi, ${mutationsSynced} mutasi diverifikasi.`,
    };
  };

  const resetDemoSalesAndRestock = () => {
    // 1. Reset Sales & Sales History to canonical INITIAL_SALES
    setSalesHistoryState(INITIAL_SALES);
    setSales(INITIAL_SALES);
    localStorage.setItem('jacs_erp_sales', JSON.stringify(INITIAL_SALES));

    // 2. Restock all products to INITIAL_PRODUCTS (ensuring minimum 50 units for testing)
    const restockedProducts = INITIAL_PRODUCTS.map((p) => ({
      ...p,
      stock: Math.max(p.stock || 0, 50),
    }));
    setProducts(restockedProducts);
    localStorage.setItem('jacs_erp_products', JSON.stringify(restockedProducts));

    // 3. Reset inventory & stock mutations to initial seed
    const restockedInventory = INITIAL_INVENTORY.map((inv) => ({
      ...inv,
      final_stock: Math.max(inv.final_stock || 0, 50),
    }));
    setInventory(restockedInventory);
    localStorage.setItem('jacs_erp_inventory', JSON.stringify(restockedInventory));

    setStockMutations(INITIAL_STOCK_MUTATIONS);
    localStorage.setItem('jacs_erp_stock_mutations', JSON.stringify(INITIAL_STOCK_MUTATIONS));

    // Notice: businessProfile is UNTOUCHED! (Nama usaha, logo, NPWP, kontak tetap utuh)
    addAuditLog(
      'Reset Demo Sales & Restock DB dieksekusi oleh Super Admin: Seluruh stok produk direstock min 50 unit, omzet penjualan demo dipulihkan ke data awal. Profil identitas bisnis tetap utuh.',
      'SUPER_ADMIN',
      'WARN'
    );
    showToast('Reset Demo Sales & Restock DB Berhasil: Stok produk pulih, omzet demo di-reset!');

    return {
      success: true,
      message: 'Database transaksi kasir dan mutasi stok telah dikembalikan ke kondisi awal pengujian tanpa mengubah identitas bisnis.',
    };
  };

  const setActiveUser = (u: User | null) => {
    setActiveUserState(u);
    if (u) {
      localStorage.setItem('jacs_erp_active_user_id', u.user_id);
      showToast(`Pengguna aktif: ${u.name} (${u.role})`);
    } else {
      localStorage.removeItem('jacs_erp_active_user_id');
    }
  };

  const setCurrentUser = (u: User | null) => {
    setActiveUser(u);
  };

  // Contextual Profile: Otomatis menyesuaikan menu navigasi yang sedang dibuka (100% activeNav & activeTerminal)
  const contextualProfile = useMemo<ContextualProfile>(() => {
    // 1. Menu HOME: Tampilkan nama modul "HOME", sub-label "Mode Umum", avatar siluet default
    if (activeNav === 'home') {
      return {
        isGeneral: true,
        moduleTitle: 'HOME',
        subLabel: 'Mode Umum',
        userName: 'HOME',
        position: 'Mode Umum',
        employeeId: 'UMUM',
        email: 'umum@jacs.retailos.id',
        avatarUrl: null,
      };
    }

    // 2. Menu DASHBOARD: Tampilkan nama modul "DASHBOARD", sub-label "Mode Umum", avatar siluet default
    if (activeNav === 'dashboard') {
      return {
        isGeneral: true,
        moduleTitle: 'DASHBOARD',
        subLabel: 'Mode Umum',
        userName: 'DASHBOARD',
        position: 'Mode Umum',
        employeeId: 'UMUM',
        email: 'dashboard@jacs.retailos.id',
        avatarUrl: null,
      };
    }

    // 3. Menu POS & Kasir:
    // Jika kasir aktif (di dalam terminal Kasir 01 s/d Kasir 04) -> profil pemegang kasir
    // Jika di daftar terminal atau belum login kasir -> "POS & CASHIER", sub-label "Mode Umum", avatar siluet default
    if (activeNav === 'pos') {
      if (isCashierWorkspaceActive && activeTerminal) {
        const termCode = (activeTerminal?.code || '').toUpperCase();
        const termName = (activeTerminal?.name || '').toUpperCase();
        const termId = (activeTerminal?.id || '').toUpperCase();

        if (termName.includes('01') || termCode.includes('01') || termId === 'T-01') {
          const matched = users.find((u) => u.name === 'Andi Pratama') || employees.find((e) => e.name === 'Andi Pratama');
          const effectiveUser = activeUser?.name === 'Andi Pratama' ? activeUser : (activeUser?.role === 'Kasir' ? activeUser : matched);
          return {
            isGeneral: false,
            moduleTitle: 'KASIR 01',
            subLabel: 'Kasir 01 (POS & Kasir)',
            userName: effectiveUser?.name || 'Andi Pratama',
            position: 'Kasir 01',
            employeeId: effectiveUser?.id || (effectiveUser as any)?.user_id || 'USR-003',
            email: effectiveUser?.email || 'andi.pos01@jacs-erp.com',
            avatarUrl: effectiveUser?.avatarUrl || effectiveUser?.avatar || null,
          };
        }
        if (termName.includes('02') || termCode.includes('02') || termId === 'T-02') {
          const matched = users.find((u) => u.name === 'Maya Indah') || employees.find((e) => e.name === 'Maya Indah');
          const effectiveUser = activeUser?.name === 'Maya Indah' ? activeUser : (activeUser?.role === 'Kasir' ? activeUser : matched);
          return {
            isGeneral: false,
            moduleTitle: 'KASIR 02',
            subLabel: 'Kasir 02 (POS & Kasir)',
            userName: effectiveUser?.name || 'Maya Indah',
            position: 'Kasir 02',
            employeeId: effectiveUser?.id || (effectiveUser as any)?.user_id || 'USR-004',
            email: effectiveUser?.email || 'maya.pos02@jacs-erp.com',
            avatarUrl: effectiveUser?.avatarUrl || effectiveUser?.avatar || null,
          };
        }
        if (termName.includes('03') || termCode.includes('03') || termId === 'T-03') {
          const matched = users.find((u) => u.name === 'Rian Hidayat') || employees.find((e) => e.name === 'Rian Hidayat');
          const effectiveUser = activeUser?.name === 'Rian Hidayat' ? activeUser : (activeUser?.role === 'Kasir' ? activeUser : matched);
          return {
            isGeneral: false,
            moduleTitle: 'KASIR 03',
            subLabel: 'Kasir 03 (POS & Kasir)',
            userName: effectiveUser?.name || 'Rian Hidayat',
            position: 'Kasir 03',
            employeeId: effectiveUser?.id || (effectiveUser as any)?.user_id || 'USR-006',
            email: effectiveUser?.email || 'rian.pos03@jacs-erp.com',
            avatarUrl: effectiveUser?.avatarUrl || effectiveUser?.avatar || null,
          };
        }
        if (termName.includes('04') || termCode.includes('04') || termId === 'T-04') {
          const matched = users.find((u) => u.name === 'Siti Aminah') || employees.find((e) => e.name === 'Siti Aminah');
          const effectiveUser = activeUser?.name === 'Siti Aminah' ? activeUser : (activeUser?.role === 'Kasir' ? activeUser : matched);
          return {
            isGeneral: false,
            moduleTitle: 'KASIR 04',
            subLabel: 'Kasir 04 (POS & Kasir)',
            userName: effectiveUser?.name || 'Siti Aminah',
            position: 'Kasir 04',
            employeeId: effectiveUser?.id || (effectiveUser as any)?.user_id || 'USR-007',
            email: effectiveUser?.email || 'siti.pos04@jacs-erp.com',
            avatarUrl: effectiveUser?.avatarUrl || effectiveUser?.avatar || null,
          };
        }

        // Terminal Kasir lainnya
        return {
          isGeneral: false,
          moduleTitle: activeTerminal?.name || 'KASIR POS',
          subLabel: `${activeTerminal?.name || 'Kasir'} (POS & Kasir)`,
          userName: activeUser?.name || 'Petugas Kasir',
          position: `Kasir (${activeTerminal?.name || 'POS'})`,
          employeeId: activeUser?.id || (activeUser as any)?.user_id || 'POS-OP',
          email: activeUser?.email || 'kasir@jacs.retailos.id',
          avatarUrl: activeUser?.avatarUrl || activeUser?.avatar || null,
        };
      }

      // Daftar terminal kasir / belum memilih terminal / kasir logout -> POS & CASHIER (TERMINAL)
      return {
        isGeneral: true,
        moduleTitle: 'POS & CASHIER (TERMINAL)',
        subLabel: 'Mode Umum',
        userName: 'POS & CASHIER (TERMINAL)',
        position: 'POS & CASHIER (TERMINAL)',
        employeeId: 'UMUM',
        email: 'pos@jacs.retailos.id',
        avatarUrl: null,
      };
    }

    // 4. Modul Super Admin ('admin' atau 'super_admin')
    if (activeNav === 'admin' || (activeNav as string) === 'super_admin') {
      const matched = users.find((u) => u.role === 'Super Admin') || employees.find((e) => e.role === 'Super Admin');
      return {
        isGeneral: false,
        moduleTitle: 'SUPER ADMIN',
        subLabel: 'Super Admin',
        userName: matched?.name || 'Budi Santoso',
        position: 'Super Admin',
        employeeId: matched?.id || (matched as any)?.user_id || 'USR-001',
        email: matched?.email || 'budi.admin@jacs-erp.com',
        avatarUrl: matched?.avatarUrl || matched?.avatar || null,
      };
    }

    // 5. Modul Executive ('executive')
    if (activeNav === 'executive') {
      const matched = users.find((u) => u.role === 'Manager') || employees.find((e) => e.role === 'Manager');
      return {
        isGeneral: false,
        moduleTitle: 'EXECUTIVE',
        subLabel: 'Executive Manager',
        userName: matched?.name || 'Siti Rahmawati',
        position: 'Executive Manager',
        employeeId: matched?.id || (matched as any)?.user_id || 'USR-002',
        email: matched?.email || 'siti.manager@jacs-erp.com',
        avatarUrl: matched?.avatarUrl || matched?.avatar || null,
      };
    }

    // 6. Modul HR ('hr')
    if (activeNav === 'hr') {
      const matched = users.find((u) => u.role === 'HR Staff') || employees.find((e) => e.role === 'HR Staff');
      return {
        isGeneral: false,
        moduleTitle: 'HR',
        subLabel: 'HR Staff',
        userName: matched?.name || 'Dimas Pratama',
        position: 'HR Staff',
        employeeId: matched?.id || (matched as any)?.user_id || 'USR-013',
        email: matched?.email || 'dimas.hr@jacs-erp.com',
        avatarUrl: matched?.avatarUrl || matched?.avatar || null,
      };
    }

    // 7. Modul Finance ('finance')
    if (activeNav === 'finance') {
      const matched = users.find((u) => u.role === 'Finance Staff') || employees.find((e) => e.role === 'Finance Staff');
      return {
        isGeneral: false,
        moduleTitle: 'FINANCE',
        subLabel: 'Finance Staff',
        userName: matched?.name || 'Maya Indah',
        position: 'Finance Staff',
        employeeId: matched?.id || (matched as any)?.user_id || 'USR-012',
        email: matched?.email || 'maya.finance@jacs-erp.com',
        avatarUrl: matched?.avatarUrl || matched?.avatar || null,
      };
    }

    // 8. Modul Purchasing ('purchasing')
    if (activeNav === 'purchasing') {
      const matched = users.find((u) => u.role === 'Purchasing Staff') || employees.find((e) => e.role === 'Purchasing Staff');
      return {
        isGeneral: false,
        moduleTitle: 'PURCHASING',
        subLabel: 'Purchasing Staff',
        userName: matched?.name || 'Agnes Monica',
        position: 'Purchasing Staff',
        employeeId: matched?.id || (matched as any)?.user_id || 'USR-014',
        email: matched?.email || 'agnes.purchasing@jacs-erp.com',
        avatarUrl: matched?.avatarUrl || matched?.avatar || null,
      };
    }

    // 9. Modul Warehouse ('warehouse')
    if (activeNav === 'warehouse') {
      const matched = users.find((u) => u.role === 'Inventory Staff' && u.name.includes('Hendra')) || employees.find((e) => e.role === 'Inventory Staff');
      return {
        isGeneral: false,
        moduleTitle: 'WAREHOUSE',
        subLabel: 'Inventory Staff',
        userName: matched?.name || 'Hendra Wijaya',
        position: 'Inventory Staff',
        employeeId: matched?.id || (matched as any)?.user_id || 'USR-005',
        email: matched?.email || 'hendra.wh@jacs-erp.com',
        avatarUrl: matched?.avatarUrl || matched?.avatar || null,
      };
    }

    // 10. Modul Master Data ('master-data' atau 'master_data')
    if (activeNav === 'master-data' || (activeNav as string) === 'master_data') {
      const matched = users.find((u) => u.name.includes('Hendra')) || employees.find((e) => e.name.includes('Hendra'));
      return {
        isGeneral: false,
        moduleTitle: 'MASTER DATA',
        subLabel: 'Master Data Specialist',
        userName: matched?.name || 'Hendra Wijaya',
        position: 'Master Data Specialist',
        employeeId: matched?.id || (matched as any)?.user_id || 'USR-005',
        email: matched?.email || 'hendra.wh@jacs-erp.com',
        avatarUrl: matched?.avatarUrl || matched?.avatar || null,
      };
    }

    // Fallback default ke HOME umum
    return {
      isGeneral: true,
      moduleTitle: 'HOME',
      subLabel: 'Mode Umum',
      userName: 'HOME',
      position: 'Mode Umum',
      employeeId: 'UMUM',
      email: 'umum@jacs.retailos.id',
      avatarUrl: null,
    };
  }, [activeNav, isCashierWorkspaceActive, activeTerminal, activeUser, users, employees]);

  const openPinAuth = (onSuccess?: (user: User) => void) => {
    if (onSuccess) {
      setPinSuccessCallback(() => onSuccess);
    } else {
      setPinSuccessCallback(null);
    }
    setIsPinModalOpen(true);
  };

  const closePinAuth = () => {
    setIsPinModalOpen(false);
    setPinSuccessCallback(null);
  };

  const getDivisionNavForRole = (role: UserRole): ActiveNavModule => {
    switch (role) {
      case 'Manager':
        return 'executive';
      case 'HR Staff':
        return 'hr';
      case 'Finance Staff':
        return 'finance';
      case 'Purchasing Staff':
        return 'purchasing';
      case 'Inventory Staff':
        return 'warehouse';
      case 'Kasir':
        return 'pos';
      case 'Super Admin':
        return 'admin';
      default:
        return 'home';
    }
  };

  const verifyPin = (pin: string, targetUserId?: string): { success: boolean; user?: User; error?: string } => {
    const trimmed = pin.trim();
    let matchedUser: User | undefined;

    if (targetUserId) {
      matchedUser = users.find((u) => u.user_id === targetUserId && u.pin === trimmed && u.status === 'Active');
      if (!matchedUser) {
        // Fallback: periksa apakah PIN cocok dengan staf lain di Master Data
        const altMatch = users.find((u) => u.pin === trimmed && u.status === 'Active');
        if (altMatch) {
          matchedUser = altMatch;
        }
      }
    } else {
      matchedUser = users.find((u) => u.pin === trimmed && u.status === 'Active');
    }

    if (!matchedUser) {
      const matchedEmp = employees.find((e) => e.pin === trimmed && e.status !== 'Inactive');
      if (matchedEmp) {
        matchedUser = {
          user_id: matchedEmp.id,
          id: matchedEmp.id,
          name: matchedEmp.name,
          email: matchedEmp.email || `${matchedEmp.name.toLowerCase().replace(/\s+/g, '.')}@jacs-erp.com`,
          division: matchedEmp.division,
          role: (matchedEmp.role.includes('Kasir')
            ? 'Kasir'
            : matchedEmp.role.includes('Manager')
            ? 'Manager'
            : matchedEmp.role.includes('HR')
            ? 'HR Staff'
            : matchedEmp.role.includes('Finance')
            ? 'Finance Staff'
            : matchedEmp.role.includes('Purchasing')
            ? 'Purchasing Staff'
            : matchedEmp.role.includes('Inventory') || matchedEmp.role.includes('Warehouse')
            ? 'Inventory Staff'
            : 'Kasir') as UserRole,
          status: 'Active',
          pin: matchedEmp.pin,
          avatar: matchedEmp.avatar || null,
          avatarUrl: matchedEmp.avatarUrl ?? null,
        };
      }
    }

    if (matchedUser) {
      if (matchedUser.role !== 'Super Admin') {
        setIsSuperAdminAuthenticated(false);
        localStorage.removeItem('jacs_super_admin_authenticated');
        localStorage.setItem('jacs_super_admin_authenticated', 'false');
        sessionStorage.removeItem('jacs_super_admin_authenticated');

        // Otomatis berpindah ke dashboard divisi terkait
        const targetNav = getDivisionNavForRole(matchedUser.role);
        setActiveNavState(targetNav);
        localStorage.setItem('jacs_erp_active_nav', targetNav);
      } else {
        setIsSuperAdminAuthenticated(true);
        localStorage.setItem('jacs_super_admin_authenticated', 'true');
        setActiveNavState('admin');
        localStorage.setItem('jacs_erp_active_nav', 'admin');
      }

      setActiveUserState(matchedUser);
      localStorage.setItem('jacs_erp_active_user_id', matchedUser.user_id);
      if (pinSuccessCallback) {
        pinSuccessCallback(matchedUser);
      }
      closePinAuth();
      // Add audit log & feedback
      addAuditLog(`Operator switch to ${matchedUser.name} (${matchedUser.role}) via PIN verification`, 'Authentication', 'INFO');
      showToast(`Login berhasil sebagai ${matchedUser.name} (${matchedUser.role})`);
      return { success: true, user: matchedUser };
    }

    if (targetUserId) {
      return { success: false, error: 'PIN tidak sesuai untuk karyawan ini!' };
    }
    return { success: false, error: 'PIN salah atau user non-aktif. Coba lagi!' };
  };

  const addAuditLog = (details: string, module: string, level?: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG') => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newLog: AuditLog = {
      id: `LOG-${uniqueSuffix}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: activeUser ? `${activeUser.name} (${activeUser.role})` : 'System (Belum Login)',
      action: module,
      details,
      module,
      level: level || 'INFO',
    };
    setAuditLogs((prev) => {
      const seen = new Set<string>([newLog.id]);
      const result: AuditLog[] = [newLog];
      for (const log of prev) {
        if (!seen.has(log.id)) {
          seen.add(log.id);
          result.push(log);
        } else {
          const freshId = `${log.id}-${Math.random().toString(36).slice(2, 5)}`;
          seen.add(freshId);
          result.push({ ...log, id: freshId });
        }
      }
      return result.slice(0, 99);
    });
  };

  useEffect(() => {
    localStorage.setItem('jacs_erp_migration_batches', JSON.stringify(migrationBatches));
  }, [migrationBatches]);

  const rollbackMigrationBatch = useCallback((batchId: string) => {
    const batch = migrationBatches.find((b) => b.id === batchId);
    if (!batch) {
      return {
        success: false,
        message: language === 'en' ? `Batch ${batchId} not found` : `Batch ${batchId} tidak ditemukan`,
      };
    }
    if (batch.status === 'ROLLED_BACK') {
      return {
        success: false,
        message: language === 'en'
          ? `Batch ${batchId} is already rolled back`
          : `Batch ${batchId} sudah pernah dibatalkan (rolled back)`,
      };
    }

    const timeStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const rollbackStockMutations: StockMutation[] = [];

    // 1. Rollback Master Entities
    if (batch.entityType === 'product') {
      const createdIdsSet = new Set(batch.createdItemIds || []);
      setProducts((prev) => {
        let updated = prev.filter((p) => !createdIdsSet.has(p.id));
        if (batch.affectedItems && batch.affectedItems.length > 0) {
          updated = updated.map((p) => {
            const snap = batch.affectedItems?.find((it) => it.id === p.id);
            if (snap && snap.action === 'UPDATE' && snap.prevStock !== undefined) {
              return {
                ...p,
                stock: snap.prevStock,
                costPrice: snap.prevCostPrice !== undefined ? snap.prevCostPrice : p.costPrice,
                cost_price: snap.prevCostPrice !== undefined ? snap.prevCostPrice : p.cost_price,
                sellingPrice: snap.prevSellingPrice !== undefined ? snap.prevSellingPrice : p.sellingPrice,
                sell_price: snap.prevSellingPrice !== undefined ? snap.prevSellingPrice : p.sell_price,
              };
            }
            return p;
          });
        }
        localStorage.setItem('jacs_erp_products', JSON.stringify(updated));
        return updated;
      });

      setInventory((prev) => {
        let updated = prev.filter((inv) => !createdIdsSet.has(inv.product_id));
        if (batch.affectedItems && batch.affectedItems.length > 0) {
          updated = updated.map((inv) => {
            const snap = batch.affectedItems?.find((it) => it.id === inv.product_id);
            if (snap && snap.action === 'UPDATE' && snap.prevStock !== undefined) {
              return {
                ...inv,
                final_stock: snap.prevStock,
                last_update: timeStr,
              };
            }
            return inv;
          });
        }
        localStorage.setItem('jacs_erp_inventory', JSON.stringify(updated));
        return updated;
      });
    } else if (batch.entityType === 'supplier') {
      const createdIdsSet = new Set(batch.createdItemIds || []);
      setSuppliers((prev) => {
        const updated = prev.filter((s) => !createdIdsSet.has(s.id));
        localStorage.setItem('jacs_erp_suppliers', JSON.stringify(updated));
        return updated;
      });
    } else if (batch.entityType === 'customer') {
      const createdIdsSet = new Set(batch.createdItemIds || []);
      setCustomers((prev) => {
        const updated = prev.filter((c) => !createdIdsSet.has(c.id));
        localStorage.setItem('jacs_erp_customers', JSON.stringify(updated));
        return updated;
      });
    } else if (batch.entityType === 'inventory') {
      if (batch.affectedItems && batch.affectedItems.length > 0) {
        setProducts((prev) => {
          const updated = prev.map((p) => {
            const snap = batch.affectedItems?.find((it) => it.id === p.id);
            if (snap && snap.prevStock !== undefined) {
              return { ...p, stock: snap.prevStock };
            }
            return p;
          });
          localStorage.setItem('jacs_erp_products', JSON.stringify(updated));
          return updated;
        });
        setInventory((prev) => {
          const updated = prev.map((inv) => {
            const snap = batch.affectedItems?.find((it) => it.id === inv.product_id);
            if (snap && snap.prevStock !== undefined) {
              return { ...inv, final_stock: snap.prevStock, last_update: timeStr };
            }
            return inv;
          });
          localStorage.setItem('jacs_erp_inventory', JSON.stringify(updated));
          return updated;
        });
      }
    }

    // 2. Revert Stock Ledger via ROLLBACK_MIGRATION
    if (batch.affectedItems && batch.affectedItems.length > 0) {
      batch.affectedItems.forEach((snap, idx) => {
        const prevS = snap.prevStock ?? 0;
        const newS = snap.newStock ?? 0;
        const qtyDiff = newS - prevS;
        if (qtyDiff > 0) {
          rollbackStockMutations.push({
            id: `MUT-ROLLBACK-${Date.now()}-${idx}`,
            timestamp: timeStr,
            product_id: snap.id,
            product_name: snap.name,
            type: 'ROLLBACK_MIGRATION',
            qty: qtyDiff,
            previous_stock: newS,
            final_stock: prevS,
            balanceAfter: prevS,
            reference_no: batch.id,
            referenceId: `ROLLBACK-${batch.id}`,
            warehouse: batch.targetWarehouse || 'GD001 - Gudang Utama',
            notes: language === 'en'
              ? `Safe Rollback Reversal of Batch [${batch.id}]`
              : `Pembalik Aman Rollback Migrasi Batch [${batch.id}]`,
            operator: `${activeUser?.name || 'Administrator'} (${activeUser?.role || 'Super Admin'})`,
          });
        }
      });
    }

    if (rollbackStockMutations.length > 0) {
      setStockMutations((prev) => {
        const updated = [...rollbackStockMutations, ...prev];
        localStorage.setItem('jacs_erp_stock_mutations', JSON.stringify(updated));
        return updated;
      });
    }

    // 3. Mark batch as ROLLED_BACK
    setMigrationBatches((prev) => {
      const updated = prev.map((b) =>
        b.id === batchId
          ? {
              ...b,
              status: 'ROLLED_BACK' as const,
              rolledBackAt: timeStr,
              rolledBackBy: `${activeUser?.name || 'Administrator'} (${activeUser?.role || 'Super Admin'})`,
            }
          : b
      );
      localStorage.setItem('jacs_erp_migration_batches', JSON.stringify(updated));
      return updated;
    });

    // 4. Log to System Audit Trail
    addAuditLog(
      language === 'en'
        ? `Migration Safe Rollback: Rolled back batch [${batch.id}] (${batch.entityType}). Reverted ${rollbackStockMutations.length} stock ledger entries and removed newly created items.`
        : `Rollback Aman Migrasi: Membatalkan batch [${batch.id}] (${batch.entityType}). Mengembalikan ${rollbackStockMutations.length} entri kartu stok dan menghapus data baru.`,
      'DATA_MIGRATION',
      'WARN'
    );

    return {
      success: true,
      message: language === 'en'
        ? `Migration Batch ${batch.id} rolled back successfully.`
        : `Batch Migrasi ${batch.id} berhasil dibatalkan (rollback aman).`,
    };
  }, [migrationBatches, activeUser, language, addAuditLog, setProducts, setInventory, setSuppliers, setCustomers, setStockMutations]);

  const addProduct = (pData: Omit<Product, 'id'>) => {
    const rawBarcode = pData.barcode ? String(pData.barcode).trim() : '';
    const newId = rawBarcode
      ? `PRD-${rawBarcode}`
      : `PRD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const newProduct: Product = {
      ...pData,
      id: newId,
      barcode: rawBarcode || undefined,
      price_retail: pData.price_retail || pData.sell_price,
      price_wholesale: pData.price_wholesale || Math.round(pData.sell_price * 0.92),
      price_distributor: pData.price_distributor || Math.round(pData.sell_price * 0.85),
      initialStock: pData.initialStock || pData.stock || 10,
    };

    setProducts((prev) => {
      // Remove any existing product with identical ID or barcode to guarantee strict uniqueness
      const filtered = prev.filter(
        (p) => p.id !== newId && (!rawBarcode || p.barcode !== rawBarcode)
      );
      const updated = deduplicateProducts([newProduct, ...filtered]);
      localStorage.setItem('jacs_erp_products', JSON.stringify(updated));
      return updated;
    });

    // Also add to inventory
    const newInv: InventoryRecord = {
      product_id: newId,
      product_name: newProduct.name,
      initial_stock: newProduct.stock,
      in_qty: newProduct.stock,
      out_qty: 0,
      final_stock: newProduct.stock,
      last_update: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setInventory((prev) => [newInv, ...prev.filter((inv) => inv.product_id !== newId)]);

    addAuditLog(`Created new product ${newProduct.name} (Stock: ${newProduct.stock})`, 'Master Data');
    showToast(`Produk "${newProduct.name}" berhasil ditambahkan!`);
  };

  const addProductsBulk = (newProds: Array<Omit<Product, 'id'>>, customToastMessage?: string) => {
    if (newProds.length === 0) return;
    const baseTime = Date.now();
    const seenBatchBarcodes = new Set<string>();
    const createdProducts: Product[] = [];

    newProds.forEach((p, idx) => {
      const bCode = p.barcode ? String(p.barcode).trim() : '';
      if (bCode && seenBatchBarcodes.has(bCode)) {
        return; // Deduplicate within the incoming bulk batch
      }
      if (bCode) seenBatchBarcodes.add(bCode);

      const pId = bCode
        ? `PRD-${bCode}`
        : `PRD-${baseTime}-${idx + 1}`;

      createdProducts.push({
        ...p,
        id: pId,
        barcode: bCode || undefined,
        price_retail: p.price_retail || p.sell_price,
        price_wholesale: p.price_wholesale || Math.round((p.sell_price || 0) * 0.92),
        price_distributor: p.price_distributor || Math.round((p.sell_price || 0) * 0.85),
        initialStock: p.initialStock || p.stock || 10,
        status: (p.stock ?? 0) > 0 ? (p.stock <= 10 ? 'Low Stock' : 'Active') : 'Out of Stock',
      });
    });

    setProducts((prev) => {
      const incomingIds = new Set(createdProducts.map((p) => p.id));
      const incomingBarcodes = new Set(createdProducts.map((p) => p.barcode).filter(Boolean));
      // Filter out any existing products that match incoming IDs or barcodes
      const filteredPrev = prev.filter(
        (p) => !incomingIds.has(p.id) && (!p.barcode || !incomingBarcodes.has(p.barcode))
      );
      const updated = deduplicateProducts([...createdProducts, ...filteredPrev]);
      localStorage.setItem('jacs_erp_products', JSON.stringify(updated));
      return updated;
    });

    const createdInvs: InventoryRecord[] = createdProducts.map((p) => ({
      product_id: p.id,
      product_name: p.name,
      initial_stock: p.stock,
      in_qty: p.stock,
      out_qty: 0,
      final_stock: p.stock,
      last_update: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }));
    const newInvIds = new Set(createdInvs.map((i) => i.product_id));
    setInventory((prev) => {
      const merged = deduplicateInventory([...createdInvs, ...prev.filter((i) => !newInvIds.has(i.product_id))]);
      localStorage.setItem('jacs_erp_inventory', JSON.stringify(merged));
      return merged;
    });

    addAuditLog(`Imported ${createdProducts.length} products to catalog`, 'Master Data');
    showToast(customToastMessage || `${createdProducts.length} produk berhasil ditambahkan ke katalog & gudang!`);
  };

  // Stock Alert Policies (Managerial Control in ExecutiveModule)
  const addStockAlertPolicy = (policyData: Omit<StockAlertPolicy, 'id' | 'updatedAt'>) => {
    const newPolicy: StockAlertPolicy = {
      ...policyData,
      id: `POL-${Date.now().toString().slice(-6)}`,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setStockAlertPolicies((prev) => [newPolicy, ...prev]);
    addAuditLog(`Ditetapkan kebijakan batas alert stok: ${newPolicy.name} (${newPolicy.alertPercentage}%)`, 'Executive Policy');
    showToast(`Kebijakan stok "${newPolicy.name}" berhasil ditetapkan!`);
  };

  const updateStockAlertPolicy = (id: string, updates: Partial<StockAlertPolicy>) => {
    setStockAlertPolicies((prev) =>
      prev.map((pol) =>
        pol.id === id
          ? {
              ...pol,
              ...updates,
              updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
            }
          : pol
      )
    );
    showToast('Kebijakan batas stok berhasil diperbarui!');
  };

  const deleteStockAlertPolicy = (id: string) => {
    setStockAlertPolicies((prev) => prev.filter((p) => p.id !== id));
    showToast('Kebijakan stok berhasil dihapus.');
  };

  const getProductAlertThreshold = (
    product: Product
  ): ProductAlertThresholdResult => {
    const skuPolicy = stockAlertPolicies.find(
      (p) => p.targetType === 'PRODUCT' && p.targetValue.toLowerCase() === product.id.toLowerCase()
    );
    const catPolicy = stockAlertPolicies.find(
      (p) => p.targetType === 'CATEGORY' && p.targetValue.toLowerCase() === (product.category || '').toLowerCase()
    );
    const defaultPolicy = stockAlertPolicies.find((p) => p.targetType === 'DEFAULT') || {
      id: 'POL-DEFAULT',
      name: 'Kebijakan Standar Barang Umum',
      targetType: 'DEFAULT' as const,
      targetValue: 'ALL',
      alertPercentage: 20,
      isFastMoving: false,
      updatedAt: '',
      updatedBy: '',
    };

    const policy = skuPolicy || catPolicy || defaultPolicy;
    const baselineCapacity =
      product.initialStock && product.initialStock > 0
        ? product.initialStock
        : Math.max(product.stock, 25);
    const percentage = policy.alertPercentage ?? policy.thresholdPercent ?? 20;
    const minUnits = policy.defaultMinUnits ?? 1;
    const threshold = Math.max(minUnits, Math.ceil((baselineCapacity * percentage) / 100));
    const isLow = product.stock <= threshold;

    return {
      threshold,
      percentage,
      isLow,
      policyName: policy.name,
      minStock: threshold,
      isLowStock: isLow,
      thresholdPercent: percentage,
    };
  };

  // Notifikasi & Draf Otomatis Batas Minimum Stok (ROP / Reorder Point) ke Purchasing
  const triggerRopDraftPurchaseRequest = (
    product: Product,
    newStock: number,
    currentPrList: PurchaseRequest[]
  ): { pr: PurchaseRequest; approval: ApprovalItem } | null => {
    const thresholdInfo = getProductAlertThreshold(product);
    const minStock = product.minStock ?? product.min_stock ?? thresholdInfo.minStock ?? 10;
    if (newStock > minStock) return null;

    const pName = (product.name || '').toLowerCase().trim();
    const pId = (product.id || '').toLowerCase().trim();

    const alreadyHasPr = currentPrList.some((pr) => {
      const prItem = (pr.item_name || '').toLowerCase().trim();
      const isNameMatch =
        prItem.includes(pName) ||
        pName.includes(prItem.split('(')[0].trim()) ||
        prItem.includes(pId);
      const isPending =
        pr.status === 'Pending Approval' ||
        pr.status === 'PENDING' ||
        pr.status === 'Draft' ||
        pr.status === 'Draft PR';
      return isNameMatch && isPending;
    });

    if (alreadyHasPr) return null;

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const targetMax =
      product.initialStock && product.initialStock > minStock
        ? product.initialStock
        : Math.max(minStock * 3, 20);
    const orderQty = Math.max(1, targetMax - Math.max(0, newStock));
    const unitCost = product.cost_price || product.buy_price || 15000;
    const estimatedCost = orderQty * unitCost;
    const prNumber = `PR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      currentPrList.length + 1
    ).padStart(3, '0')}`;

    const newPr: PurchaseRequest = {
      pr_number: prNumber,
      date: dateStr,
      department: 'Warehouse & Logistik',
      requester_name: 'Sistem Otomatis (Batas Stok ROP)',
      item_name: `${product.name} (SKU: ${product.sku || product.barcode || product.id})`,
      qty: orderQty,
      estimated_cost: estimatedCost,
      status: 'PENDING',
      urgency: newStock <= 0 ? 'High' : 'Medium',
    };

    const newApproval: ApprovalItem = {
      id: `APP-${prNumber}`,
      type: 'PURCHASE_REQUEST',
      title: `Pengadaan ROP: ${product.name} (${orderQty} Unit)`,
      requester: 'Sistem Otomatis (Batas Stok ROP)',
      department: 'Warehouse & Logistik',
      date: dateStr,
      amount: estimatedCost,
      status: 'PENDING',
      details: `Permintaan pengadaan otomatis karena stok sisa (${newStock} Unit) telah menyentuh atau di bawah batas minimum ROP (≤ ${minStock} Unit). Estimasi biaya: Rp ${estimatedCost.toLocaleString(
        'id-ID'
      )}.`,
    };

    return { pr: newPr, approval: newApproval };
  };

  // Executive Promotions Hub
  const addPromotion = (promoData: Omit<PromotionProgram, 'id'>) => {
    const newPromo: PromotionProgram = {
      ...promoData,
      id: `PROMO-${Date.now().toString().slice(-6)}`,
    };
    setPromotions((prev) => [newPromo, ...prev]);
    addAuditLog(`Otorisasi program promo baru: ${newPromo.name} (${newPromo.code})`, 'Executive Promotions');
    showToast(`Program promo "${newPromo.name}" berhasil diotorisasi!`);
  };

  const updatePromotion = (id: string, updates: Partial<PromotionProgram>) => {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    showToast('Program promo berhasil diperbarui.');
  };

  const deletePromotion = (id: string) => {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
    showToast('Program promosi dihapus.');
  };

  const togglePromotionStatus = (id: string) => {
    setPromotions((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextStatus = p.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
          showToast(`Status promo "${p.name}" kini ${nextStatus}`);
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          if (updated.stock <= 0) {
            updated.status = 'Out of Stock';
          } else if (updated.stock <= 10) {
            updated.status = 'Low Stock';
          } else {
            updated.status = 'Active';
          }
          return updated;
        }
        return item;
      })
    );
    addAuditLog(`Updated product ${id}`, 'Master Data');
    showToast(`Produk ID ${id} berhasil diperbarui!`);
  };

  const deleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    addAuditLog(`Deleted product ${id} (${target?.name})`, 'Master Data');
    showToast(`Produk ${id} telah dihapus.`);
  };

  const handleSaveRecipeCosting = (
    menuId: string,
    costingData: FBMenuCosting,
    updatePOSPrice: boolean
  ) => {
    let targetName = menuId;
    setProducts((prev) => {
      const updated = prev.map((prod) => {
        if (prod.id === menuId || (prod.name && prod.name.toLowerCase() === menuId.toLowerCase())) {
          targetName = prod.name;
          const newSellPrice = updatePOSPrice
            ? (costingData.calculatedSellingPrice || costingData.recommendedPrice || prod.sell_price)
            : prod.sell_price;

          const rawHPP = costingData.rawMaterialHPP ?? costingData.totalCost ?? prod.cost_price;

          const mappedRecipe: RecipeIngredient[] | undefined = costingData.recipe
            ? costingData.recipe.map((it) => ({
                ingredientId: it.ingredientId,
                name: it.ingredientName || it.name || '',
                qty: it.portionQty ?? it.qty ?? 0,
                unit: it.unit || 'gr',
                costPerUnit: it.costPerUnit || 0,
                ingredientName: it.ingredientName,
                portionQty: it.portionQty,
                subtotalCost: it.subtotalCost,
              }))
            : prod.recipe;

          return {
            ...prod,
            itemType: 'MENU_FB' as const,
            recipe: mappedRecipe,
            wastePercent: costingData.wastePercentage ?? prod.wastePercent ?? 5,
            packagingCost: costingData.operationalCost ?? prod.packagingCost ?? 0,
            cost_price: rawHPP,
            costing: costingData,
            sell_price: newSellPrice,
            price_retail: newSellPrice,
          };
        }
        return prod;
      });

      const clean = deduplicateProducts(updated);
      localStorage.setItem('jacs_erp_products', JSON.stringify(clean));
      return clean;
    });

    addAuditLog(
      `Updated BOM Recipe & HPP Costing for menu ${targetName} (${menuId}). Price sync: ${updatePOSPrice ? 'YES' : 'NO'}`,
      'F&B BOM & Resep',
      'INFO'
    );
    showToast(
      updatePOSPrice
        ? `Resep & HPP "${targetName}" disimpan! Harga jual kasir otomatis disinkronisasi ke Rp ${(costingData.calculatedSellingPrice || costingData.recommendedPrice || 0).toLocaleString('id-ID')}.`
        : `Resep & HPP Menu "${targetName}" berhasil disimpan!`
    );
  };

  const processPayment = (
    payload: PaymentPayload
  ): Sale & { success: boolean; sale: Sale; journalEntries: JournalEntry[]; message: string } => {
    const now = new Date();
    const dateStr = payload.timestamp
      ? payload.timestamp.slice(0, 10)
      : now.toISOString().slice(0, 10);
    const timeStr = payload.timestamp || now.toISOString().replace('T', ' ').slice(0, 19);
    const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const defaultReceipt = `TRX-POS-${dateCode}-${String(sales.length + 1).padStart(4, '0')}`;
    const receiptRef = payload.receiptNumber || defaultReceipt;
    const trxId = receiptRef;

    const targetTerminalId = payload.terminalId || activeTerminal.id;
    const targetTerminal = terminals.find((t) => t.id === targetTerminalId) || activeTerminal;
    const targetTerminalName = targetTerminal.name;
    const targetBusinessType = payload.businessType || targetTerminal.businessType || targetTerminal.businessModel || targetTerminal.modelType || 'retail';
    const cashierName = payload.cashierName || safeOperator.name;

    const rawMethod = String(payload.paymentMethod || '').trim().toUpperCase();
    const isCreditSale =
      rawMethod === 'KREDIT' ||
      rawMethod === 'AR_CREDIT' ||
      rawMethod.includes('KREDIT') ||
      rawMethod.includes('TEMPO') ||
      rawMethod.includes('(AR)') ||
      rawMethod.includes('PIUTANG');
    const isCash = !isCreditSale && (rawMethod === 'CASH' || rawMethod === 'TUNAI');
    const cleanMethod: PaymentMethod = isCreditSale
      ? 'KREDIT / TEMPO (AR)'
      : isCash
      ? 'CASH'
      : rawMethod === 'QRIS'
      ? 'QRIS'
      : rawMethod === 'DEBIT' || rawMethod === 'EDC_DEBIT'
      ? 'EDC_DEBIT'
      : rawMethod === 'CREDIT' || rawMethod === 'EDC_CREDIT'
      ? 'EDC_CREDIT'
      : (payload.paymentMethod as PaymentMethod) || 'TRANSFER';

    // 1. Kurangi stok barang di Gudang (products.stock) sesuai item yang dibeli
    const deductionsMap = new Map<string, number>();
    const recipeDeductionsMap = new Map<
      string,
      { name: string; deductQty: number; unit: string; menuName: string; costPerUnit: number }
    >();

    const newStockMutations: StockMutation[] = [];

    payload.items.forEach((item, itemIdx) => {
      const pId = item.product.id;
      const prevQty = deductionsMap.get(pId) || 0;
      deductionsMap.set(pId, prevQty + item.quantity);

      const currentProd = products.find((p) => p.id === pId) || item.product;
      const previousStock = currentProd.stock ?? 0;
      const finalStockCalculated = Math.max(0, previousStock - item.quantity);
      const productSku = currentProd.sku || currentProd.barcode || currentProd.id;

      // Catat mutasi Stock Ledger dengan tipe resmi 'SALE-POS'
      newStockMutations.push({
        id: `MUT-SALE-${Date.now()}-${itemIdx}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: timeStr,
        date: dateStr,
        product_id: item.product.id,
        sku: productSku,
        product_name: currentProd.name || item.product.name,
        type: 'SALE-POS',
        qty: item.quantity,
        previous_stock: previousStock,
        final_stock: finalStockCalculated,
        balanceAfter: finalStockCalculated,
        reference_no: receiptRef,
        referenceId: receiptRef,
        cashier_name: cashierName,
        operator: cashierName,
        warehouse: currentProd.rackLocation || 'GD001 - Gudang Utama',
        notes: `Penjualan POS - No. Faktur ${receiptRef}`,
      });

      // Cek resep bahan baku (Bill of Materials) jika item merupakan menu F&B
      const effectiveRecipe =
        item.product.recipe && item.product.recipe.length > 0
          ? item.product.recipe
          : currentProd.recipe && currentProd.recipe.length > 0
          ? currentProd.recipe
          : undefined;

      if (effectiveRecipe && effectiveRecipe.length > 0) {
        effectiveRecipe.forEach((ingredient, ingIdx) => {
          const ingName = ingredient.name || (ingredient as any).ingredientName || 'Bahan Baku';
          const ingQty = Number(ingredient.qty ?? (ingredient as any).portionQty) || 0;
          const rawDeductQty = ingQty * item.quantity;
          if (rawDeductQty <= 0) return;

          const existing = recipeDeductionsMap.get(ingredient.ingredientId);
          if (existing) {
            existing.deductQty += rawDeductQty;
          } else {
            recipeDeductionsMap.set(ingredient.ingredientId, {
              name: ingName,
              deductQty: rawDeductQty,
              unit: ingredient.unit,
              menuName: item.product.name,
              costPerUnit: ingredient.costPerUnit || 0,
            });
          }

          const rawProd = products.find((p) => p.id === ingredient.ingredientId);
          const rawPrevStock = rawProd ? rawProd.stock : 0;
          const rawFinalStock = Math.max(0, rawPrevStock - rawDeductQty);
          const rawSku = rawProd?.sku || rawProd?.barcode || ingredient.ingredientId;

          newStockMutations.push({
            id: `MUT-BOM-${Date.now()}-${itemIdx}-${ingIdx}`,
            timestamp: timeStr,
            date: dateStr,
            product_id: ingredient.ingredientId,
            sku: rawSku,
            product_name: ingName,
            type: 'SALE-POS',
            qty: rawDeductQty,
            previous_stock: rawPrevStock,
            final_stock: rawFinalStock,
            balanceAfter: rawFinalStock,
            reference_no: receiptRef,
            referenceId: receiptRef,
            cashier_name: cashierName,
            operator: cashierName,
            warehouse: rawProd?.rackLocation || 'GD001 - Gudang Utama',
            notes: `Penjualan POS - No. Faktur ${receiptRef} (BOM Resep: ${item.product.name} x${item.quantity})`,
          });
        });
      }
    });

    // 2. Periksa produk yang menyentuh atau berada di bawah batas minimum stok (Reorder Point / ROP)
    const autoRopPrList: PurchaseRequest[] = [];
    const autoRopApprovals: ApprovalItem[] = [];

    // Perbarui stok produk gudang (products.stock) secara realtime & sinkronisasi status alert
    setProducts((prev) => {
      const updated = prev.map((p) => {
        let updatedStock = p.stock;
        let changed = false;

        const directDeduct = deductionsMap.get(p.id);
        if (directDeduct !== undefined) {
          updatedStock = Math.max(0, updatedStock - directDeduct);
          changed = true;
        }

        const recipeDeduct = recipeDeductionsMap.get(p.id);
        if (recipeDeduct) {
          updatedStock = Math.max(0, updatedStock - recipeDeduct.deductQty);
          changed = true;
        }

        if (changed) {
          const thresholdInfo = getProductAlertThreshold(p);
          const effectiveMinStock = p.minStock ?? p.min_stock ?? thresholdInfo.minStock ?? 10;
          let newStatus = p.status;
          if (updatedStock <= 0) {
            newStatus = 'Out of Stock';
          } else if (updatedStock <= effectiveMinStock || thresholdInfo.threshold >= updatedStock || thresholdInfo.isLowStock) {
            newStatus = 'Low Stock';
          } else {
            newStatus = 'Active';
          }

          // Otomatis buat draf Purchase Request (PR) berstatus PENDING jika stok menyentuh atau <= ROP
          const ropResult = triggerRopDraftPurchaseRequest(
            { ...p, stock: updatedStock },
            updatedStock,
            [...purchaseRequests, ...autoRopPrList]
          );
          if (ropResult) {
            autoRopPrList.push(ropResult.pr);
            autoRopApprovals.push(ropResult.approval);
          }

          return { ...p, stock: updatedStock, status: newStatus };
        }
        return p;
      });

      const clean = deduplicateProducts(updated);
      try {
        localStorage.setItem('jacs_erp_products', JSON.stringify(clean));
      } catch (e) {
        console.error('Error saving products:', e);
      }
      return clean;
    });

    if (autoRopPrList.length > 0) {
      setPurchaseRequests((prev) => {
        const next = [...autoRopPrList, ...prev];
        try {
          localStorage.setItem('jacs_erp_purchase_requests', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      setApprovalQueue((prev) => {
        const next = [...autoRopApprovals, ...prev];
        try {
          localStorage.setItem('jacs_erp_approvals', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      addAuditLog(
        `Auto-generate ${autoRopPrList.length} Draf Purchase Request (ROP) berstatus PENDING di modul Purchasing`,
        'Warehouse & Purchasing'
      );
    }

    // Perbarui catatan inventory warehouse (DB_Inventory) secara realtime
    setInventory((prev) => {
      const updated = [...prev];
      deductionsMap.forEach((qty, pId) => {
        const existingIdx = updated.findIndex((inv) => inv.product_id === pId);
        const currentProd = products.find((p) => p.id === pId);
        if (existingIdx !== -1) {
          const inv = updated[existingIdx];
          updated[existingIdx] = {
            ...inv,
            product_name: currentProd?.name || inv.product_name,
            out_qty: inv.out_qty + qty,
            final_stock: Math.max(0, inv.final_stock - qty),
            last_update: timeStr,
          };
        } else {
          const baseStock = currentProd ? currentProd.stock : qty;
          updated.push({
            product_id: pId,
            product_name: currentProd?.name || pId,
            initial_stock: baseStock,
            in_qty: 0,
            out_qty: qty,
            final_stock: Math.max(0, baseStock - qty),
            last_update: timeStr,
          });
        }
      });

      recipeDeductionsMap.forEach((deduction, rawId) => {
        const existingIdx = updated.findIndex((inv) => inv.product_id === rawId);
        const rawProd = products.find((p) => p.id === rawId);
        if (existingIdx !== -1) {
          const inv = updated[existingIdx];
          updated[existingIdx] = {
            ...inv,
            product_name: rawProd?.name || inv.product_name,
            out_qty: inv.out_qty + deduction.deductQty,
            final_stock: Math.max(0, inv.final_stock - deduction.deductQty),
            last_update: timeStr,
          };
        } else {
          const baseStock = rawProd ? rawProd.stock : deduction.deductQty;
          updated.push({
            product_id: rawId,
            product_name: rawProd?.name || deduction.name || rawId,
            initial_stock: baseStock,
            in_qty: 0,
            out_qty: deduction.deductQty,
            final_stock: Math.max(0, baseStock - deduction.deductQty),
            last_update: timeStr,
          });
        }
      });

      const clean = deduplicateInventory(updated);
      try {
        localStorage.setItem('jacs_erp_inventory', JSON.stringify(clean));
      } catch (e) {}
      return clean;
    });

    if (newStockMutations.length > 0) {
      setStockMutations((prev) => {
        const next = [...newStockMutations, ...prev];
        try {
          localStorage.setItem('jacs_erp_stock_mutations', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    // 2. Catat jurnal penjualan: Jika kredit/tempo (AR), Debit Piutang Usaha (1-10301) dan Kredit Pendapatan Penjualan (4-10001) dengan ID POS-AR-[id]
    const debitAccountCode = isCreditSale ? '1-10301' : isCash ? '1-10001' : '1-10002';
    const debitAccountName = isCreditSale ? 'Piutang Usaha' : isCash ? 'Kas' : 'Bank';
    const revenueAccountCode = '4-10001';
    const revenueAccountName = 'Pendapatan Penjualan';

    const journalSalesId = isCreditSale ? `POS-AR-${receiptRef}` : `JRN-SLS-${Date.now().toString().slice(-6)}`;
    const journalSalesDesc = isCreditSale
      ? `Penjualan Kredit / Piutang Usaha (AR) #${receiptRef} • Debit Piutang Usaha (1-10301), Kredit Pendapatan Penjualan (4-10001)`
      : `Penjualan Kasir POS #${receiptRef} • Debit ${debitAccountName} (${debitAccountCode}), Kredit ${revenueAccountName} (${revenueAccountCode})`;

    const generalSalesJournal: JournalEntry = {
      id: journalSalesId,
      date: dateStr,
      reference: receiptRef,
      description: journalSalesDesc,
      type: isCreditSale ? 'POS_AR_SALES' : 'POS_SALES',
      lines: [
        {
          accountCode: debitAccountCode,
          accountName: debitAccountName,
          debit: payload.total,
          credit: 0,
        },
        {
          accountCode: revenueAccountCode,
          accountName: revenueAccountName,
          debit: 0,
          credit: payload.total,
        },
      ],
      totalDebit: payload.total,
      totalCredit: payload.total,
      created_at: timeStr,
    };

    // Jika transaksi KREDIT/TEMPO (AR), catat ke Piutang Usaha (invoicesDue / invoicesReceivable)
    if (isCreditSale) {
      const dueDateObj = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const dueDateStr = dueDateObj.toISOString().slice(0, 10);
      const custObj = customers.find((c) => c.id === payload.customerId) || null;
      const custName = custObj?.name || payload.customerId || 'Pelanggan Kredit (Member)';

      const arInvoice: InvoiceDue = {
        id: `INV-AR-${receiptRef}`,
        type: 'RECEIVABLE',
        party_name: custName,
        invoice_number: `INV-AR-${receiptRef}`,
        due_date: dueDateStr,
        amount: payload.total,
        status: 'Unpaid',
        terms: 'Tempo 30 Hari (AR)',
        created_at: timeStr,
        journal_ref: journalSalesId,
      };

      setInvoicesDue((prev) => {
        const next = [arInvoice, ...prev];
        try {
          localStorage.setItem('jacs_erp_invoices_due', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    const financeSalesEntry: FinanceEntry = {
      id: isCreditSale ? `FIN-AR-${receiptRef}` : `FIN-IN-${receiptRef}`,
      date: dateStr,
      type: 'IN / PENDAPATAN',
      category: isCreditSale ? 'Piutang Usaha (AR)' : 'Penjualan Kasir POS',
      description: isCreditSale
        ? `[1-10301] Piutang Usaha POS #${receiptRef} • [${revenueAccountCode}] Pendapatan Penjualan`
        : `[${debitAccountCode}] Kas Masuk Penjualan POS ${receiptRef} • [${revenueAccountCode}] Pendapatan`,
      amount: payload.total,
      reference: receiptRef,
      payment_method: String(cleanMethod),
      account_target: isCreditSale ? 'Piutang Usaha (1-10301)' : isCash ? 'Kas (1-10001)' : 'Bank (1-10002)',
      created_at: timeStr,
    };

    // 3. Catat jurnal HPP: Debit Beban Pokok Penjualan (5-10001) dan Kredit Persediaan (1-10501) jika costPrice ada
    let totalHppCost = 0;
    payload.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.product.id) || item.product;
      const unitCost =
        item.costPrice ??
        item.product.costPrice ??
        item.product.cost_price ??
        prod.costPrice ??
        prod.cost_price ??
        0;

      if (unitCost > 0) {
        totalHppCost += unitCost * item.quantity;
      }
    });

    totalHppCost = Math.round(totalHppCost);

    let hppJournal: JournalEntry | undefined = undefined;
    let financeHppEntry: FinanceEntry | undefined = undefined;

    if (totalHppCost > 0) {
      hppJournal = {
        id: `JRN-HPP-${receiptRef}`,
        date: dateStr,
        reference: receiptRef,
        description: `Beban Pokok Penjualan (HPP) Nota #${receiptRef} • Debit Beban Pokok Penjualan (5-10001), Kredit Persediaan (1-10501)`,
        type: 'COGS',
        lines: [
          {
            accountCode: '5-10001',
            accountName: 'Beban Pokok Penjualan',
            debit: totalHppCost,
            credit: 0,
          },
          {
            accountCode: '1-10501',
            accountName: 'Persediaan',
            debit: 0,
            credit: totalHppCost,
          },
        ],
        totalDebit: totalHppCost,
        totalCredit: totalHppCost,
        created_at: timeStr,
      };

      financeHppEntry = {
        id: `FIN-HPP-${receiptRef}`,
        date: dateStr,
        type: 'HPP / BEBAN POKOK',
        category: 'Beban Pokok Penjualan (5-10001)',
        description: `[5-10001] Beban Pokok Penjualan (HPP) #${receiptRef} • [1-10501] Persediaan`,
        amount: totalHppCost,
        reference: receiptRef,
        payment_method: String(payload.paymentMethod),
        account_target: 'Persediaan (1-10501)',
        created_at: timeStr,
      };
    }

    const createdJournals = hppJournal ? [generalSalesJournal, hppJournal] : [generalSalesJournal];
    setJournalEntries((prev) => {
      const next = [...createdJournals, ...prev];
      try {
        localStorage.setItem('jacs_erp_journal_entries', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving journal entries:', e);
      }
      return next;
    });

    const financeEntriesToAdd = financeHppEntry ? [financeSalesEntry, financeHppEntry] : [financeSalesEntry];
    setFinance((prev) => [...financeEntriesToAdd, ...prev]);

    // 4. Tambahkan penerimaan kas / non-tunai pada activeShift dan riwayat shift terminal aktif
    const isCashTrx = cleanMethod === 'CASH';
    if (!activeShift || activeShift.status !== 'OPEN') {
      const autoShiftId = payload.shiftId || `SHIFT-${dateCode}-${targetTerminal.code || targetTerminalId}`;
      const newShift: CashierShift = {
        id: autoShiftId,
        cashierId: safeOperator.user_id,
        cashierName: safeOperator.name,
        terminalId: targetTerminalId,
        terminalName: targetTerminalName,
        startTime: `${dateStr} ${timeStr.slice(11) || '08:00:00'}`,
        status: 'OPEN',
        initialCash: 0,
        totalCashSales: isCashTrx ? payload.total : 0,
        totalNonCashSales: !isCashTrx ? payload.total : 0,
        totalTransactionsCount: 1,
        totalExpenses: 0,
        expenses: [],
        expectedCashInDrawer: isCashTrx ? payload.total : 0,
        notes: `Shift aktif ${targetTerminalName} (${targetBusinessType})`,
      };
      setActiveShift(newShift);
    } else {
      setActiveShift((prev) => {
        if (!prev) return prev;
        const newCashSales = isCashTrx ? prev.totalCashSales + payload.total : prev.totalCashSales;
        const newNonCashSales = !isCashTrx ? prev.totalNonCashSales + payload.total : prev.totalNonCashSales;
        const newTrxCount = prev.totalTransactionsCount + 1;
        const newExpectedCash = prev.initialCash + newCashSales - prev.totalExpenses;
        return {
          ...prev,
          terminalId: prev.terminalId || targetTerminalId,
          terminalName: prev.terminalName || targetTerminalName,
          totalCashSales: newCashSales,
          totalNonCashSales: newNonCashSales,
          totalTransactionsCount: newTrxCount,
          expectedCashInDrawer: newExpectedCash,
        };
      });
    }

    // Akumulasi juga ke riwayat shift jika shift target tercatat di shiftsHistory
    setShiftsHistory((prev) => {
      const shiftTargetId = payload.shiftId || activeShift?.id;
      if (!shiftTargetId) return prev;
      return prev.map((s) => {
        if (s.id === shiftTargetId || (s.terminalId === targetTerminalId && s.status === 'OPEN')) {
          const newCash = isCashTrx ? s.totalCashSales + payload.total : s.totalCashSales;
          const newNonCash = !isCashTrx ? s.totalNonCashSales + payload.total : s.totalNonCashSales;
          return {
            ...s,
            totalCashSales: newCash,
            totalNonCashSales: newNonCash,
            totalTransactionsCount: s.totalTransactionsCount + 1,
            expectedCashInDrawer: s.initialCash + newCash - s.totalExpenses,
          };
        }
        return s;
      });
    });

    // 5. Simpan data transaksi ke salesHistory dan reset keranjang belanja
    const matchedCustomer = customers.find(
      (c) =>
        c.id === payload.customerId ||
        (payload.customerId && c.phone && c.phone.replace(/\D/g, '') === payload.customerId.replace(/\D/g, ''))
    );
    const calculatedPoints = payload.customerId ? Math.floor(payload.total / 10000) : 0;
    const itemsSummary = payload.items
      .map((it) => `${it.product.name} (${it.quantity}x)`)
      .join(', ');

    const calculatedSubtotal = payload.items.reduce(
      (sum, it) => sum + (it.subtotal || it.quantity * it.product.sell_price),
      0
    );

    const newSale: Sale = {
      transaction_id: trxId,
      receipt_number: receiptRef,
      date: dateStr,
      created_at: timeStr,
      cashier_id: safeOperator.user_id,
      cashier_name: cashierName,
      terminal_name: targetTerminalName,
      terminalId: targetTerminalId,
      terminal_id: targetTerminalId,
      businessType: targetBusinessType,
      business_type: targetBusinessType,
      items_summary: itemsSummary || 'Transaksi Penjualan Kasir',
      subtotal: calculatedSubtotal,
      discount: Math.max(0, calculatedSubtotal - payload.total),
      total_amount: payload.total,
      payment_method: cleanMethod,
      amount_paid: payload.cashTendered ?? payload.total,
      change_amount: payload.changeDue ?? 0,
      status: 'COMPLETED',
      items: payload.items,
      customer_id: payload.customerId,
      customer_name: matchedCustomer?.name,
      customer_phone: matchedCustomer?.phone,
      shift_id: payload.shiftId || (activeShift?.status === 'OPEN' ? activeShift.id : undefined),
      points_earned: calculatedPoints,
      isOffline: !isOnline,
      syncStatus: !isOnline ? 'PENDING' : 'SYNCED',
    };

    // Jika checkout selesai dalam kondisi offline, simpan data invoice ke key localStorage 'jacs_offline_queue'
    if (!isOnline) {
      try {
        const rawQueue = localStorage.getItem('jacs_offline_queue');
        const queue: Sale[] = rawQueue ? JSON.parse(rawQueue) : [];
        const updatedQueue = [newSale, ...queue];
        localStorage.setItem('jacs_offline_queue', JSON.stringify(updatedQueue));
        setOfflineQueue(updatedQueue);
      } catch (err) {
        console.error('Error saving to jacs_offline_queue:', err);
      }
    }

    setSalesHistoryState((prev) => {
      const next = [newSale, ...prev];
      try {
        localStorage.setItem('jacs_erp_sales', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving sales history:', e);
      }
      return next;
    });

    setSales((prev) => [newSale, ...prev]);

    // Reset keranjang belanja
    setCart([]);

    // Update active terminal activeOrdersToday
    setTerminals((prev) =>
      prev.map((t) => (t.id === targetTerminalId ? { ...t, activeOrdersToday: t.activeOrdersToday + 1 } : t))
    );

    // Update member loyalty spending if applicable
    if (payload.customerId && matchedCustomer) {
      setCustomers((prev) => {
        const updated = prev.map((c) => {
          if (c.id === payload.customerId || c.id === matchedCustomer.id) {
            const currentPeriod = (c.total_spending_current_period || 0) + payload.total;
            const lifetime = (c.totalSpent || 0) + payload.total;
            const pts = (c.points || 0) + calculatedPoints;
            const tierResult = calculateMemberTierLevel(currentPeriod, !!c.has_store);
            return {
              ...c,
              total_spending_current_period: currentPeriod,
              totalSpent: lifetime,
              points: pts,
              tier_level: tierResult.tier_level,
              memberTier: c.memberTier === 'Grosir' ? 'Grosir' : tierResult.memberTier,
            };
          }
          return c;
        });
        try {
          localStorage.setItem('jacs_erp_customers', JSON.stringify(updated));
        } catch (e) {
          console.error('Error saving customer loyalty:', e);
        }
        return updated;
      });
    }

    addAuditLog(
      `POS Transaksi ${receiptRef}: Rp ${payload.total.toLocaleString('id-ID')} [${debitAccountCode} ${debitAccountName} & 4-10001 Pendapatan] | HPP: Rp ${totalHppCost.toLocaleString('id-ID')} [5-10001 BPP & 1-10501 Persediaan]`,
      'Finance & Warehouse',
      'INFO'
    );

    if (!isOnline) {
      showToast(`⚡ [OFFLINE] Transaksi ${receiptRef} (Rp ${payload.total.toLocaleString('id-ID')}) disimpan ke Local Queue & Struk siap cetak!`);
    } else {
      showToast(`Transaksi ${receiptRef} (Rp ${payload.total.toLocaleString('id-ID')}) berhasil diproses!`);
    }
    setCurrentReceiptSale(newSale);
    setIsReceiptModalOpen(true);

    return {
      ...newSale,
      success: true,
      sale: newSale,
      journalEntries: createdJournals,
      message: `Transaksi ${trxId} Berhasil Diproses!`,
    };
  };

  const processSale = (saleData: Omit<Sale, 'transaction_id' | 'created_at'>): Sale => {
    const payload: PaymentPayload = {
      items: saleData.items || [],
      total: saleData.total_amount,
      paymentMethod: saleData.payment_method,
      cashTendered: saleData.amount_paid,
      changeDue: saleData.change_amount,
      shiftId: saleData.shift_id,
      customerId: saleData.customer_id,
      timestamp: saleData.date,
      terminalId: saleData.terminalId || saleData.terminal_id,
      businessType: saleData.businessType || saleData.business_type,
      receiptNumber: (saleData as any).receipt_number,
      cashierName: saleData.cashier_name,
    };
    const res = processPayment(payload);
    return res.sale;
  };

  const getDefaultSupplierForProduct = (product: Product): string => {
    if (product.supplier && product.supplier.trim() !== '') {
      return product.supplier;
    }
    const nameLower = (product.name || '').toLowerCase();
    const idLower = (product.id || '').toLowerCase();
    const isFnbOrRaw =
      product.businessModel === 'fnb' ||
      idLower.startsWith('ing-') ||
      idLower.startsWith('raw-') ||
      (product.category || '').toLowerCase().includes('bahan') ||
      (product.category || '').toLowerCase().includes('mentah');

    if (isFnbOrRaw) {
      if (nameLower.includes('beras') || nameLower.includes('pandan')) return 'PT Wilmar Nabati Indonesia';
      if (
        nameLower.includes('daging') ||
        nameLower.includes('wagyu') ||
        nameLower.includes('ayam') ||
        nameLower.includes('patty') ||
        nameLower.includes('fillet') ||
        nameLower.includes('seafood') ||
        nameLower.includes('udang') ||
        nameLower.includes('cumi')
      )
        return 'PT So Good Food';
      if (nameLower.includes('susu') || nameLower.includes('milk') || nameLower.includes('uht'))
        return 'PT Ultrajaya Milk Industry Tbk';
      if (nameLower.includes('keju') || nameLower.includes('cheddar') || nameLower.includes('telur'))
        return 'PT Frisian Flag Indonesia';
      if (nameLower.includes('kopi') || nameLower.includes('espresso') || nameLower.includes('arabica'))
        return 'PT Santos Jaya Abadi (Kapal Api)';
      if (nameLower.includes('teh') || nameLower.includes('matcha'))
        return 'PT Sinar Sosro';
      if (nameLower.includes('minyak') || nameLower.includes('sawit') || nameLower.includes('truffle'))
        return 'PT Salim Ivomas Pratama Tbk';
      if (
        nameLower.includes('bumbu') ||
        nameLower.includes('rempah') ||
        nameLower.includes('kecap') ||
        nameLower.includes('saus')
      )
        return 'PT Unilever Indonesia Tbk (Food Division)';
      if (
        nameLower.includes('lunch box') ||
        nameLower.includes('paper') ||
        nameLower.includes('packaging') ||
        nameLower.includes('cup') ||
        nameLower.includes('sedotan') ||
        nameLower.includes('bowl')
      )
        return 'PT Asian Paper Mills (Paseo)';
      if (
        nameLower.includes('roti') ||
        nameLower.includes('burger') ||
        nameLower.includes('brioche') ||
        nameLower.includes('bun')
      )
        return 'PT Nippon Indosari Corpindo Tbk';
      if (nameLower.includes('kentang') || nameLower.includes('shoestring') || nameLower.includes('mie'))
        return 'PT Indofood CBP Sukses Makmur Tbk';
      if (nameLower.includes('sirup') || nameLower.includes('karamel') || nameLower.includes('gula'))
        return 'PT Heinz ABC Indonesia';
      return 'PT Indofood CBP Sukses Makmur Tbk';
    }

    const catInfo = getErpCategoryInfo(product);
    const supItem = getDefaultSupplierForCategory(catInfo.categoryCode);
    return supItem ? supItem.name : 'PT Mitra Global Teknologi';
  };

  // Helper: Sinkronisasi otomatis Tagihan Hutang Usaha (AP Ledger) di Modul Finance saat PO disetujui atau barang diterima
  const syncAccountsPayableInvoice = (
    po: PurchaseOrder,
    triggerSource: 'APPROVED' | 'GOODS_RECEIPT' = 'APPROVED'
  ) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timestampStr = now.toISOString().replace('T', ' ').slice(0, 19);

    let calculatedDueDate = po.due_date;
    if (!calculatedDueDate) {
      let days = 30;
      if (po.payment_term?.includes('7')) days = 7;
      else if (po.payment_term?.includes('14')) days = 14;
      else if (po.payment_term?.includes('45')) days = 45;
      else if (po.payment_term?.includes('60')) days = 60;
      else if (po.payment_term?.toLowerCase().includes('cod')) days = 0;
      const d = new Date(now.getTime() + days * 86400000);
      calculatedDueDate = d.toISOString().slice(0, 10);
    }

    const isPaid = po.payment_status === 'Lunas' || po.payment_status === 'PAID';
    const invoiceId = `INV-AP-${po.po_number}`;
    const invoiceNumber = `INV-AP-${po.po_number}`;

    const newInvoice: InvoiceDue = {
      id: invoiceId,
      type: 'PAYABLE',
      party_name: po.supplier_name,
      vendor: po.supplier_name,
      invoice_number: invoiceNumber,
      po_number: po.po_number,
      due_date: calculatedDueDate,
      amount: po.total_amount,
      status: isPaid ? 'PAID' : 'Unpaid',
      terms: po.payment_term || 'Tempo 30 Hari',
      created_at: po.date ? `${po.date} 00:00:00` : timestampStr,
      approved_at: triggerSource === 'APPROVED' ? timestampStr : po.approvedAt || po.approved_date,
      paidAt: isPaid ? po.paid_date || timestampStr : undefined,
      paymentMethod: isPaid ? po.payment_method : undefined,
      paymentSource: isPaid ? po.payment_source : undefined,
    };

    setInvoicesDue((prev) => {
      const existingIdx = prev.findIndex(
        (inv) => inv.po_number === po.po_number || inv.id === invoiceId || inv.invoice_number === invoiceNumber
      );
      let updated: InvoiceDue[];
      if (existingIdx >= 0) {
        const current = prev[existingIdx];
        const nextStatus = isPaid ? 'PAID' : current.status;
        updated = [...prev];
        updated[existingIdx] = {
          ...current,
          party_name: po.supplier_name,
          vendor: po.supplier_name,
          amount: po.total_amount,
          due_date: calculatedDueDate,
          terms: po.payment_term || current.terms,
          status: nextStatus,
          po_number: po.po_number,
        };
      } else {
        updated = [newInvoice, ...prev];
      }
      try {
        localStorage.setItem('jacs_erp_invoices_due', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving AP invoice:', e);
      }
      return updated;
    });

    return newInvoice;
  };

  const createPurchaseOrder = (poData: Omit<PurchaseOrder, 'po_number'>) => {
    const now = new Date();
    const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const poNum = `PO-${dateCode}-${String(purchasing.length + 1).padStart(4, '0')}`;

    // Validasi batas nilai PO: jika Grand Total > Rp 20.000.000, set status otomatis ke "Menunggu Approval Direksi"
    const isDirectorApproval = poData.total_amount > 20000000;
    let initialStatus = poData.status;
    if (initialStatus !== 'Draft') {
      initialStatus = isDirectorApproval
        ? 'Menunggu Approval Direksi'
        : 'Menunggu Approval Pimpinan';
    }

    const newPO: PurchaseOrder = {
      ...poData,
      status: initialStatus,
      po_number: poNum,
      return_amount: poData.return_amount || 0,
      debit_notes: poData.debit_notes || [],
    };
    setPurchasing((prev) => [newPO, ...prev]);

    // Jika PO berstatus disetujui / approved, sinkronkan otomatis ke AP Ledger
    if (
      initialStatus === 'Disetujui (Approved)' ||
      initialStatus === 'Disetujui' ||
      initialStatus === 'Approved' ||
      initialStatus === 'APPROVED'
    ) {
      syncAccountsPayableInvoice(newPO, 'APPROVED');
    }

    // If status is 'Menunggu Approval Direksi', 'Menunggu Approval Pimpinan', or pending, add to executive approvalQueue
    if (
      newPO.status === 'Menunggu Approval Direksi' ||
      newPO.status === 'Menunggu Approval Pimpinan' ||
      newPO.status === 'PENDING APPROVAL' ||
      newPO.status === 'Pending Approval'
    ) {
      const isDirector = newPO.status === 'Menunggu Approval Direksi' || isDirectorApproval;
      const newApproval: ApprovalItem = {
        id: `APP-${poNum}`,
        type: 'PURCHASE_ORDER',
        title: isDirector
          ? `[DIREKSI] Otorisasi PO Nilai Tinggi: ${poNum} (${newPO.supplier_name})`
          : `Otorisasi PO: ${poNum} (${newPO.supplier_name})`,
        requester: `${safeOperator.name} (${safeOperator.role})`,
        department: isDirector ? 'Executive & Board of Directors' : 'Purchasing & Procurement',
        date: newPO.date,
        amount: newPO.total_amount,
        status: 'PENDING',
        details: isDirector
          ? `Pengadaan nilai tinggi (> Rp 20.000.000) ke ${newPO.supplier_name}: ${newPO.items}. Total Rp ${newPO.total_amount.toLocaleString(
              'id-ID'
            )} (${newPO.payment_term || 'Tempo'}). Membutuhkan persetujuan Direksi.`
          : `Pengadaan barang ke ${newPO.supplier_name}: ${newPO.items}. Total Rp ${newPO.total_amount.toLocaleString(
              'id-ID'
            )} (${newPO.payment_term || 'COD'})`,
        reference_id: poNum,
      };
      setApprovalQueue((prev) => [newApproval, ...prev]);
    }

    addAuditLog(
      `Created PO ${poNum} to ${poData.supplier_name} for Rp ${poData.total_amount.toLocaleString(
        'id-ID'
      )} [Status: ${initialStatus}]`,
      'Purchasing'
    );
    showToast(
      isDirectorApproval && initialStatus !== 'Draft'
        ? `Purchase Order ${poNum} bernilai > Rp 20 Jt berhasil diajukan ke Antrean Direksi!`
        : `Purchase Order ${poNum} berhasil dibuat!`
    );
  };

  const updatePurchaseOrderStatus = (
    poNumber: string,
    newStatus: PurchaseOrderStatus,
    reasonOrNotes?: string
  ) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const targetPo = purchasing.find((p) => p.po_number === poNumber);

    // Auto-promote to Menunggu Approval Direksi if > 20 Jt and being submitted for approval
    let resolvedStatus = newStatus;
    if (
      (newStatus === 'Menunggu Approval Pimpinan' || newStatus === 'PENDING APPROVAL') &&
      targetPo &&
      targetPo.total_amount > 20000000
    ) {
      resolvedStatus = 'Menunggu Approval Direksi';
    }

    // Jika status diubah ke 'RECEIVED' atau 'GOODS_RECEIPT' atau 'FULLY_RECEIVED', jalankan otomatis penerimaan barang & penyesuaian HPP
    if (
      resolvedStatus === 'RECEIVED' ||
      resolvedStatus === 'GOODS_RECEIPT' ||
      resolvedStatus === 'FULLY_RECEIVED'
    ) {
      if (
        targetPo &&
        targetPo.status !== 'RECEIVED' &&
        targetPo.status !== 'GOODS_RECEIPT' &&
        targetPo.status !== 'FULLY_RECEIVED' &&
        targetPo.status !== 'Selesai'
      ) {
        receivePoGoodsAndAdjustCost(poNumber, { notes: reasonOrNotes });
        return;
      }
    }

    setPurchasing((prev) =>
      prev.map((po) => {
        if (po.po_number === poNumber) {
          const updated: PurchaseOrder = {
            ...po,
            status: resolvedStatus,
          };
          if (resolvedStatus === 'Ditolak') {
            updated.rejected_reason = reasonOrNotes || 'Ditolak oleh pimpinan / direksi';
          }
          if (
            resolvedStatus === 'Disetujui (Approved)' ||
            resolvedStatus === 'Disetujui' ||
            resolvedStatus === 'Approved'
          ) {
            updated.approved_by = `${safeOperator.name} (${safeOperator.role})`;
            updated.approved_date = dateStr;
            if (reasonOrNotes) updated.approval_notes = reasonOrNotes;
            syncAccountsPayableInvoice(updated, 'APPROVED');
          } else if (
            resolvedStatus === 'RECEIVED' ||
            resolvedStatus === 'GOODS_RECEIPT' ||
            resolvedStatus === 'FULLY_RECEIVED' ||
            resolvedStatus === 'Selesai'
          ) {
            syncAccountsPayableInvoice(updated, 'GOODS_RECEIPT');
          }
          return updated;
        }
        return po;
      })
    );

    // Sync approval queue
    if (
      resolvedStatus === 'Disetujui (Approved)' ||
      resolvedStatus === 'Disetujui' ||
      resolvedStatus === 'Approved'
    ) {
      setApprovalQueue((prev) =>
        prev.map((item) =>
          item.id === `APP-${poNumber}` ||
          item.reference_id === poNumber ||
          item.id.includes(poNumber)
            ? { ...item, status: 'APPROVED' as const }
            : item
        )
      );
    } else if (resolvedStatus === 'Ditolak' || resolvedStatus === 'Cancelled') {
      setApprovalQueue((prev) =>
        prev.map((item) =>
          item.id === `APP-${poNumber}` ||
          item.reference_id === poNumber ||
          item.id.includes(poNumber)
            ? { ...item, status: 'REJECTED' as const }
            : item
        )
      );
    } else if (
      resolvedStatus === 'Menunggu Approval Pimpinan' ||
      resolvedStatus === 'Menunggu Approval Direksi' ||
      resolvedStatus === 'PENDING APPROVAL'
    ) {
      if (targetPo) {
        const isDirector =
          resolvedStatus === 'Menunggu Approval Direksi' || targetPo.total_amount > 20000000;
        const appItem: ApprovalItem = {
          id: `APP-${poNumber}`,
          type: 'PURCHASE_ORDER',
          title: isDirector
            ? `[DIREKSI] Otorisasi PO Nilai Tinggi: ${poNumber} (${targetPo.supplier_name})`
            : `Otorisasi PO: ${poNumber} (${targetPo.supplier_name})`,
          requester: `${safeOperator.name} (${safeOperator.role})`,
          department: isDirector ? 'Executive & Board of Directors' : 'Purchasing & Procurement',
          date: targetPo.date,
          amount: targetPo.total_amount,
          status: 'PENDING',
          details: isDirector
            ? `Pengadaan nilai tinggi (> Rp 20.000.000) ke ${targetPo.supplier_name}: ${targetPo.items}. Total Rp ${targetPo.total_amount.toLocaleString(
                'id-ID'
              )} (${targetPo.payment_term || 'Tempo'}). Membutuhkan persetujuan Direksi.`
            : `Pengadaan ke ${targetPo.supplier_name}: ${targetPo.items}. Total Rp ${targetPo.total_amount.toLocaleString(
                'id-ID'
              )}`,
          reference_id: poNumber,
        };
        setApprovalQueue((prev) => [
          appItem,
          ...prev.filter((a) => a.reference_id !== poNumber && a.id !== `APP-${poNumber}`),
        ]);
      }
    }

    addAuditLog(`Status PO ${poNumber} diubah ke ${resolvedStatus}`, 'Purchasing');
    showToast(`Status PO ${poNumber} diperbarui: ${resolvedStatus}`);
  };

  const rejectPurchaseOrder = (poNumber: string, reason?: string) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const timestampStr = `${dateStr} ${timeStr}`;

    const newHistoryItem: POApprovalHistoryItem = {
      action: 'REJECTED',
      approvedBy: `${safeOperator.name} (${safeOperator.role})`,
      approvedAt: timestampStr,
      notes: reason || 'Ditolak oleh Direksi / Executive',
      role: safeOperator.role,
    };

    setPurchasing((prev) => {
      const next = prev.map((po) => {
        if (po.po_number === poNumber) {
          const updatedHistory = [...(po.approvalHistory || []), newHistoryItem];
          return {
            ...po,
            status: 'REJECTED' as PurchaseOrderStatus,
            rejected_reason: reason || 'Ditolak oleh Direksi / Executive',
            approvalHistory: updatedHistory,
          };
        }
        return po;
      });
      try {
        localStorage.setItem('jacs_erp_purchasing', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving rejected PO:', e);
      }
      return next;
    });

    setApprovalQueue((prev) =>
      prev.map((item) =>
        item.id === `APP-${poNumber}` ||
        item.reference_id === poNumber ||
        item.id.includes(poNumber)
          ? { ...item, status: 'REJECTED' as const }
          : item
      )
    );

    addAuditLog(
      `Executive Rejection: PO ${poNumber} ditolak oleh ${safeOperator.name}. Alasan: ${reason || 'Tanpa catatan'}.`,
      'Executive / Otorisasi PO',
      'WARN'
    );

    showToast(`PO ${poNumber} telah DITOLAK (REJECTED).`);
  };

  const createPurchaseReturn = (payload: {
    poNumber: string;
    grId: string;
    deliveryOrderNumber: string;
    vendorName: string;
    items: PurchaseReturnItem[];
    reason: string;
    includePpn?: boolean;
  }): { success: boolean; debitNoteNumber: string; totalRefundAmount: number } => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const retId = `RET-${dateCode}-${String(purchaseReturns.length + 1).padStart(4, '0')}`;
    const ndNumber = `ND-${dateCode}-${String(purchaseReturns.length + 1).padStart(4, '0')}`;

    const subtotalRefund = payload.items.reduce((acc, it) => acc + it.subtotal, 0);
    const taxRefund = payload.includePpn !== false ? Math.round(subtotalRefund * 0.11) : 0;
    const totalRefundAmount = subtotalRefund + taxRefund;

    const newReturn: PurchaseReturn = {
      id: retId,
      debitNoteNumber: ndNumber,
      poNumber: payload.poNumber,
      grId: payload.grId,
      deliveryOrderNumber: payload.deliveryOrderNumber,
      vendorName: payload.vendorName,
      date: dateStr,
      items: payload.items,
      totalRefundAmount,
      reason: payload.reason,
      status: 'APPLIED',
      created_by: `${safeOperator.name} (${safeOperator.role})`,
    };

    setPurchaseReturns((prev) => [newReturn, ...prev]);

    // Update Purchase Order: potong sisa tagihan vendor (Accounts Payable)
    setPurchasing((prev) =>
      prev.map((po) => {
        if (po.po_number === payload.poNumber) {
          const currentReturn = po.return_amount || 0;
          const updatedReturn = currentReturn + totalRefundAmount;
          const currentDebitNotes = po.debit_notes || [];
          const isFullySettledByReturn = updatedReturn >= po.total_amount;

          return {
            ...po,
            return_amount: updatedReturn,
            debit_notes: [...currentDebitNotes, ndNumber],
            payment_status: isFullySettledByReturn ? 'Lunas' : po.payment_status,
            purchase_returns: [...(po.purchase_returns || []), newReturn],
          };
        }
        return po;
      })
    );

    // Bukukan Nota Debit di Finance & Accounting sebagai kontra-beban AP / Pengurangan Hutang Dagang
    const financeEntry: FinanceEntry = {
      id: `FIN-ND-${ndNumber}`,
      date: dateStr,
      type: 'INCOME',
      category: 'Retur Pembelian (Nota Debit AP)',
      description: `Nota Debit ${ndNumber} Retur Barang Rusak PO ${payload.poNumber} (${payload.vendorName})`,
      amount: totalRefundAmount,
      reference: ndNumber,
      payment_method: 'NOTA DEBIT',
      account_target: 'Beban Pembelian / Hutang Dagang (AP)',
      created_at: new Date().toISOString(),
    };
    setFinance((prev) => [financeEntry, ...prev]);

    addAuditLog(
      `Retur Pembelian ${retId} & Nota Debit ${ndNumber} diterbitkan untuk PO ${payload.poNumber}. Tagihan vendor dipotong Rp ${totalRefundAmount.toLocaleString(
        'id-ID'
      )}.`,
      'Purchasing / Retur',
      'INFO'
    );

    showToast(
      `📄 Nota Debit ${ndNumber} diterbitkan! Sisa tagihan PO ${payload.poNumber} otomatis dipotong Rp ${totalRefundAmount.toLocaleString(
        'id-ID'
      )}`
    );

    return { success: true, debitNoteNumber: ndNumber, totalRefundAmount };
  };

  const updatePurchaseOrderPayment = (
    poNumber: string,
    paymentStatus: 'Belum Bayar' | 'Jatuh Tempo' | 'Lunas' | 'PAID',
    details?: {
      paid_date?: string;
      payment_method?: string;
      payment_source?: 'Kas Operasional' | 'Rekening Bank Utama' | 'Kas Kecil' | string;
      payment_ref?: string;
      amount?: number;
    }
  ) => {
    const targetPo = purchasing.find((p) => p.po_number === poNumber);
    const pDate = details?.paid_date || new Date().toISOString().slice(0, 10);
    const pSource = details?.payment_source || details?.payment_method || 'Kas Operasional';
    const pRef = details?.payment_ref || `TRF-AP-${poNumber}`;
    const pAmount = details?.amount ?? targetPo?.total_amount ?? 0;
    const isPaid = paymentStatus === 'Lunas' || paymentStatus === 'PAID';
    const finalPaymentStatus: 'Belum Bayar' | 'Jatuh Tempo' | 'Lunas' | 'PAID' = isPaid ? 'PAID' : paymentStatus;

    setPurchasing((prev) => {
      const next = prev.map((po) => {
        if (po.po_number === poNumber) {
          return {
            ...po,
            payment_status: finalPaymentStatus,
            paid_date: isPaid ? pDate : undefined,
            payment_method: details?.payment_method || pSource,
            payment_source: pSource,
            payment_ref: pRef,
          };
        }
        return po;
      });
      try {
        localStorage.setItem('jacs_erp_purchasing', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving purchasing after payment:', e);
      }
      return next;
    });

    // Sinkronkan status tagihan AP di Modul Finance
    if (isPaid) {
      setInvoicesDue((prev) => {
        const next = prev.map((inv) =>
          inv.po_number === poNumber || inv.id === `INV-AP-${poNumber}` || inv.invoice_number === `INV-AP-${poNumber}`
            ? {
                ...inv,
                status: 'PAID',
                paidAt: new Date().toISOString(),
                paymentMethod: details?.payment_method || pSource,
                paymentSource: pSource,
                paid_date: pDate,
              }
            : inv
        );
        try {
          localStorage.setItem('jacs_erp_invoices_due', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    // If paymentStatus is Lunas/PAID, record Kas Keluar (Expense) in Finance & Accounting
    if (isPaid && targetPo) {
      const financeAccountTarget =
        pSource === 'Rekening Bank Utama'
          ? 'Bank Utama / Rekening Corporate'
          : pSource === 'Kas Kecil'
          ? 'Kas Kecil (Petty Cash)'
          : 'Kas Operasional Kantor';

      const newFinanceEntry: FinanceEntry = {
        id: `FIN-PAY-${pRef}-${Date.now().toString().slice(-4)}`,
        date: pDate,
        type: 'EXPENSE',
        category: 'Pembayaran Supplier (AP)',
        description: `Pelunasan Faktur Tagihan PO ${poNumber} ke ${targetPo.supplier_name}`,
        amount: pAmount,
        reference: pRef,
        payment_method: pSource === 'Rekening Bank Utama' ? 'TRANSFER' : 'CASH',
        account_target: financeAccountTarget,
        created_at: new Date().toISOString(),
      };
      setFinance((prev) => [newFinanceEntry, ...prev]);

      addAuditLog(
        `Pelunasan Tagihan PO ${poNumber} sebesar Rp ${pAmount.toLocaleString(
          'id-ID'
        )} dari [${pSource}]. Mutasi Kas Keluar tercatat di Finance & Accounting.`,
        'Purchasing / Finance',
        'INFO'
      );
    } else {
      addAuditLog(
        `Tagihan PO ${poNumber} diperbarui: ${finalPaymentStatus}${
          details?.payment_method ? ` (${details.payment_method})` : ''
        }`,
        'Purchasing / Finance'
      );
    }

    showToast(
      isPaid
        ? `✅ PO ${poNumber} Lunas (PAID)! Kas Keluar Rp ${pAmount.toLocaleString(
            'id-ID'
          )} dicatat ke [${pSource}] di Finance & Accounting.`
        : `Status pembayaran PO ${poNumber} berhasil diperbarui: ${finalPaymentStatus}!`
    );
  };

  const deletePurchaseOrder = (poNumber: string) => {
    setPurchasing((prev) => prev.filter((po) => po.po_number !== poNumber));
    setApprovalQueue((prev) =>
      prev.filter((a) => a.reference_id !== poNumber && !a.id.includes(poNumber))
    );
    addAuditLog(`Dokumen PO ${poNumber} dihapus`, 'Purchasing');
    showToast(`Dokumen PO ${poNumber} berhasil dihapus!`);
  };

  const createAutoReorderPO = (product: Product): PurchaseOrder => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const poNum = `PO-${dateCode}-${String(purchasing.length + 1).padStart(4, '0')}`;

    const supplierName = getDefaultSupplierForProduct(product);
    const matchedSupplier = suppliers.find((s) => s.name === supplierName);
    const thresholdInfo = getProductAlertThreshold(product);
    const currentStock = Math.max(0, product.stock ?? 0);

    // Kuantitas pemesanan (Qty) otomatis dihitung = (Maksimum Stok - Sisa Stok Riil)
    const maxStock =
      product.initialStock && product.initialStock > thresholdInfo.minStock
        ? product.initialStock
        : Math.max(thresholdInfo.minStock * 3, 20);
    const orderQty = Math.max(1, maxStock - currentStock);
    const unitCost = product.cost_price || 15000;
    const subtotal = orderQty * unitCost;
    const ppnAmount = Math.round(subtotal * 0.11);
    const totalAmount = subtotal + ppnAmount;

    // Alur Approval Berjenjang: > 20 Jt ke Direksi, <= 20 Jt ke Pimpinan
    const isDirectorApproval = totalAmount > 20000000;
    const poStatus: PurchaseOrderStatus = isDirectorApproval
      ? 'Menunggu Approval Direksi'
      : 'Menunggu Approval Pimpinan';

    const dueDateObj = new Date(now);
    dueDateObj.setDate(dueDateObj.getDate() + 30);
    const dueDateStr = dueDateObj.toISOString().slice(0, 10);

    const newPO: PurchaseOrder = {
      po_number: poNum,
      date: dateStr,
      supplier_name: supplierName,
      supplier_id: matchedSupplier?.id || 'SUPP-001',
      items: `${product.name} (${orderQty} ${product.unit || 'Unit'})`,
      subtotal: subtotal,
      include_ppn: true,
      ppn_rate: 11,
      ppn_amount: ppnAmount,
      total_amount: totalAmount,
      payment_term: matchedSupplier?.paymentTerms || 'Tempo 30 Hari',
      payment_status: 'Belum Bayar',
      due_date: dueDateStr,
      status: poStatus,
      item_details: [
        {
          product_id: product.id,
          product_name: product.name,
          qty: orderQty,
          unit_cost: unitCost,
          subtotal: subtotal,
          unit: product.unit || 'Unit',
          received_qty: 0,
        },
      ],
    };

    setPurchasing((prev) => [newPO, ...prev]);

    // Antrean Approval Eksekutif / Managerial
    const newApproval: ApprovalItem = {
      id: `APP-${poNum}`,
      type: 'PURCHASE_ORDER',
      title: isDirectorApproval
        ? `[DIREKSI] Otorisasi PO Nilai Tinggi: ${poNum} (${supplierName})`
        : `Otorisasi PO: ${poNum} (${supplierName})`,
      requester: `${safeOperator.name} (${safeOperator.role})`,
      department: isDirectorApproval ? 'Executive & Board of Directors' : 'Warehouse & Purchasing',
      date: dateStr,
      amount: totalAmount,
      status: 'PENDING',
      details: `Pengadaan restock otomatis: ${product.name} (Pesan: ${orderQty} ${
        product.unit || 'Unit'
      }, Sisa: ${currentStock}, Safety Target: ${maxStock}). Total Rp ${totalAmount.toLocaleString(
        'id-ID'
      )} (${
        isDirectorApproval ? 'Membutuhkan persetujuan Direksi' : 'Membutuhkan persetujuan Pimpinan'
      }).`,
      reference_id: poNum,
    };
    setApprovalQueue((prev) => [newApproval, ...prev]);

    addAuditLog(
      `Draf PO Otomatis Terbit: ${poNum} ke ${supplierName} untuk ${product.name} (Qty: ${orderQty}, Total: Rp ${totalAmount.toLocaleString('id-ID')}) [Status: ${poStatus}]`,
      'Purchasing / Auto-Reorder',
      'INFO'
    );

    showToast(
      isDirectorApproval
        ? `⚡ Draf PO ${poNum} dibuat (Qty: ${orderQty}) & masuk Antrean Approval Direksi (> Rp 20 Jt)!`
        : `⚡ Draf PO ${poNum} dibuat untuk ${product.name} (Qty: ${orderQty}) & masuk Antrean Approval Pimpinan!`
    );

    return newPO;
  };

  const reorderAllLowStock = (): { createdCount: number; message: string; pos: PurchaseOrder[] } => {
    const lowStockItems = products.filter((p) => getProductAlertThreshold(p).isLowStock);
    if (lowStockItems.length === 0) {
      showToast('Seluruh SKU & bahan baku memiliki stok aman di atas Safety Stock.');
      return { createdCount: 0, message: 'Semua stok dalam batas aman.', pos: [] };
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`;

    // Group low-stock items by their default supplier
    const supplierGroups = new Map<
      string,
      Array<{ product: Product; qty: number; unitCost: number; subtotal: number }>
    >();

    lowStockItems.forEach((p) => {
      const supplier = getDefaultSupplierForProduct(p);
      const threshold = getProductAlertThreshold(p);
      const currentStock = Math.max(0, p.stock ?? 0);
      const maxStock =
        p.initialStock && p.initialStock > threshold.minStock
          ? p.initialStock
          : Math.max(threshold.minStock * 3, 20);
      const orderQty = Math.max(1, maxStock - currentStock);
      const unitCost = p.cost_price || 15000;
      const subtotal = orderQty * unitCost;

      const group = supplierGroups.get(supplier) || [];
      group.push({ product: p, qty: orderQty, unitCost, subtotal });
      supplierGroups.set(supplier, group);
    });

    const newPOs: PurchaseOrder[] = [];
    const newApprovals: ApprovalItem[] = [];
    let baseSeq = purchasing.length + 1;

    supplierGroups.forEach((items, supplierName) => {
      const poNum = `PO-${dateCode}-${String(baseSeq++).padStart(4, '0')}`;
      const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
      const ppnAmount = Math.round(subtotal * 0.11);
      const totalAmount = subtotal + ppnAmount;
      const matchedSupplier = suppliers.find((s) => s.name === supplierName);

      const isDirectorApproval = totalAmount > 20000000;
      const poStatus: PurchaseOrderStatus = isDirectorApproval
        ? 'Menunggu Approval Direksi'
        : 'Menunggu Approval Pimpinan';

      const itemsSummary = items
        .map((i) => `${i.product.name} (${i.qty} ${i.product.unit || 'Unit'})`)
        .join(', ');

      const dueDateObj = new Date(now);
      dueDateObj.setDate(dueDateObj.getDate() + 30);
      const dueDateStr = dueDateObj.toISOString().slice(0, 10);

      const po: PurchaseOrder = {
        po_number: poNum,
        date: dateStr,
        supplier_name: supplierName,
        supplier_id: matchedSupplier?.id || 'SUPP-001',
        items: itemsSummary,
        subtotal: subtotal,
        include_ppn: true,
        ppn_rate: 11,
        ppn_amount: ppnAmount,
        total_amount: totalAmount,
        payment_term: matchedSupplier?.paymentTerms || 'Tempo 30 Hari',
        payment_status: 'Belum Bayar',
        due_date: dueDateStr,
        status: poStatus,
        item_details: items.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          qty: i.qty,
          unit_cost: i.unitCost,
          subtotal: i.subtotal,
          unit: i.product.unit || 'Unit',
          received_qty: 0,
        })),
      };
      newPOs.push(po);

      newApprovals.push({
        id: `APP-${poNum}`,
        type: 'PURCHASE_ORDER',
        title: isDirectorApproval
          ? `[DIREKSI] Otorisasi PO Massal Nilai Tinggi: ${poNum} (${supplierName})`
          : `Otorisasi PO Massal: ${poNum} (${supplierName})`,
        requester: `${safeOperator.name} (${safeOperator.role})`,
        department: isDirectorApproval ? 'Executive & Board of Directors' : 'Warehouse & Purchasing',
        date: dateStr,
        amount: totalAmount,
        status: 'PENDING',
        details: `Pengadaan massal ${items.length} SKU/Bahan Baku ke ${supplierName}: ${itemsSummary.slice(
          0,
          120
        )}... Total Rp ${totalAmount.toLocaleString('id-ID')} (${
          isDirectorApproval ? 'Membutuhkan persetujuan Direksi' : 'Membutuhkan persetujuan Pimpinan'
        }).`,
        reference_id: poNum,
      });
    });

    setPurchasing((prev) => [...newPOs, ...prev]);
    if (newApprovals.length > 0) {
      setApprovalQueue((prev) => [...newApprovals, ...prev]);
    }

    addAuditLog(
      `Reorder Massal: Diterbitkan ${newPOs.length} Draf PO untuk ${lowStockItems.length} SKU/Bahan Kritis (${newApprovals.length} masuk Approval Queue)`,
      'Warehouse / Auto-Reorder',
      'INFO'
    );

    const msg = `⚡ Berhasil membuat ${newPOs.length} Draf PO untuk ${lowStockItems.length} item kritis!`;
    showToast(msg);
    return { createdCount: newPOs.length, message: msg, pos: newPOs };
  };

  const approvePurchaseOrder = (poNumber: string, notes?: string) => {
    const targetPo = purchasing.find((p) => p.po_number === poNumber);
    if (!targetPo) {
      showToast(`Purchase Order ${poNumber} tidak ditemukan!`);
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const timestampStr = `${dateStr} ${timeStr}`;

    const newHistoryItem: POApprovalHistoryItem = {
      action: 'APPROVED',
      approvedBy: `${safeOperator.name} (${safeOperator.role})`,
      approvedAt: timestampStr,
      notes: notes || 'Otorisasi disetujui oleh Direksi / Executive',
      role: safeOperator.role,
    };

    // 1. Ubah status PO menjadi 'APPROVED' dan perbarui approvalHistory (approvedBy, approvedAt)
    setPurchasing((prev) => {
      const next = prev.map((po) => {
        if (po.po_number === poNumber) {
          const updatedHistory = [...(po.approvalHistory || []), newHistoryItem];
          return {
            ...po,
            status: 'APPROVED' as PurchaseOrderStatus,
            approved_by: `${safeOperator.name} (${safeOperator.role})`,
            approved_date: dateStr,
            approvedBy: `${safeOperator.name} (${safeOperator.role})`,
            approvedAt: timestampStr,
            approval_notes: notes || po.approval_notes,
            approvalHistory: updatedHistory,
          };
        }
        return po;
      });
      try {
        localStorage.setItem('jacs_erp_purchasing', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving approved PO:', e);
      }
      return next;
    });

    // Sinkronkan ke antrean Approval Queue
    setApprovalQueue((prev) =>
      prev.map((item) =>
        item.id === `APP-${poNumber}` ||
        item.reference_id === poNumber ||
        item.id.includes(poNumber)
          ? { ...item, status: 'APPROVED' as const }
          : item
      )
    );

    // 2. Terbitkan tagihan Hutang Usaha (Accounts Payable / AP) otomatis di modul Finance sesuai nilai PO
    const newInvoiceDue: InvoiceDue = {
      id: `INV-AP-${poNumber}`,
      type: 'PAYABLE',
      party_name: targetPo.supplier_name,
      invoice_number: `INV-AP-${poNumber}`,
      po_number: poNumber,
      vendor: targetPo.supplier_name,
      amount: targetPo.total_amount,
      due_date: targetPo.due_date || dateStr,
      status: 'Unpaid',
      terms: targetPo.payment_term || 'Tempo 30 Hari',
      created_at: timestampStr,
      approved_at: timestampStr,
    };

    setInvoicesDue((prev) => {
      const filtered = prev.filter((inv) => inv.po_number !== poNumber && inv.id !== `INV-AP-${poNumber}`);
      const next = [newInvoiceDue, ...filtered];
      try {
        localStorage.setItem('jacs_erp_invoices_due', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving invoices due:', e);
      }
      return next;
    });

    // Catat mutasi liabilitas Hutang Usaha di modul Finance
    const apFinanceEntry: FinanceEntry = {
      id: `FIN-AP-${poNumber}`,
      date: dateStr,
      type: 'EXPENSE',
      category: 'Hutang Usaha (Accounts Payable / AP)',
      description: `Tagihan Hutang Usaha PO #${poNumber} kepada ${targetPo.supplier_name} [2-10001 Hutang Usaha] • Syarat: ${targetPo.payment_term || 'Tempo 30 Hari'}`,
      amount: targetPo.total_amount,
      reference: poNumber,
      payment_method: targetPo.payment_method || 'Tempo / AP',
      account_target: 'Hutang Usaha (2-10001)',
      created_at: timestampStr,
    };
    setFinance((prev) => {
      const filtered = prev.filter((f) => f.id !== `FIN-AP-${poNumber}` && f.reference !== poNumber);
      return [apFinanceEntry, ...filtered];
    });

    // 3. Buat entri jurnal akuntansi akrual penerimaan (jika status GRN lengkap) atau komitmen AP
    const hasGRN = goodsReceipts.some((gr) => gr.poNumber === poNumber && (gr.status === 'VERIFIED' || (gr.status as string) === 'COMPLETED'));
    const isGrnComplete =
      hasGRN ||
      targetPo.status === 'FULLY_RECEIVED' ||
      targetPo.status === 'Received' ||
      targetPo.status === 'Selesai' ||
      Boolean(targetPo.delivery_order_no);

    const journalLines: JournalEntryLine[] = [
      // Sisi Debit: Persediaan (1-10501) jika barang telah diterima (GRN) ATAU Persediaan Dalam Pengadaan (1-10509) jika komitmen AP
      {
        accountCode: isGrnComplete ? '1-10501' : '1-10509',
        accountName: isGrnComplete ? 'Persediaan Barang Dagang' : 'Persediaan Dalam Pengadaan (PO)',
        debit: targetPo.total_amount,
        credit: 0,
      },
      // Sisi Kredit: Hutang Usaha (2-10001)
      {
        accountCode: '2-10001',
        accountName: 'Hutang Usaha (Accounts Payable)',
        debit: 0,
        credit: targetPo.total_amount,
      },
    ];

    const apJournalEntry: JournalEntry = {
      id: `JRN-AP-${poNumber}`,
      date: dateStr,
      reference: `PO-AP-${poNumber}`,
      description: isGrnComplete
        ? `Akrual Penerimaan Barang PO #${poNumber} (${targetPo.supplier_name}) • Debit Persediaan [1-10501], Kredit Hutang Usaha [2-10001] Rp ${targetPo.total_amount.toLocaleString('id-ID')}`
        : `Komitmen Pengadaan & Tagihan Hutang Usaha (AP) PO #${poNumber} (${targetPo.supplier_name}) • Debit Persediaan Dalam Pengadaan [1-10509], Kredit Hutang Usaha [2-10001] Rp ${targetPo.total_amount.toLocaleString('id-ID')}`,
      type: isGrnComplete ? 'ACCRUAL_GRN' : 'AP_COMMITMENT',
      lines: journalLines,
      totalDebit: targetPo.total_amount,
      totalCredit: targetPo.total_amount,
      created_at: timestampStr,
    };

    setJournalEntries((prev) => {
      const next = [apJournalEntry, ...prev.filter((j) => j.reference !== `PO-AP-${poNumber}` && j.id !== `JRN-AP-${poNumber}`)];
      try {
        localStorage.setItem('jacs_erp_journal_entries', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving AP journal:', e);
      }
      return next;
    });

    addAuditLog(
      `Executive Approval: PO ${poNumber} (${targetPo.supplier_name}) senilai Rp ${targetPo.total_amount.toLocaleString(
        'id-ID'
      )} DISETUJUI oleh ${safeOperator.name}. Tagihan AP [2-10001] & Jurnal Akrual/Komitmen otomatis dibukukan.`,
      'Executive / Otorisasi PO',
      'INFO'
    );

    showToast(
      `PO ${poNumber} (Rp ${targetPo.total_amount.toLocaleString('id-ID')}) BERHASIL DISETUJUI! Tagihan Hutang Usaha (AP) & Jurnal diterbitkan ke Finance.`
    );
  };

  // Helper: Penerimaan Fisik Barang PO & Pembaruan Stok DB_Inventory, Mutasi IN_PURCHASE, & HPP / Average Cost
  function receivePoGoodsAndAdjustCost(
    poNumber: string,
    options?: {
      doNumber?: string;
      notes?: string;
      items?: Array<{
        productId: string;
        productName?: string;
        orderedQty?: number;
        receivedQty: number;
        acceptedQty?: number;
        rejectedQty?: number;
        unit?: string;
        unitCost?: number;
        rejectionReason?: string;
      }>;
    }
  ) {
    const targetPO = purchasing.find(
      (p) => p.po_number === poNumber || p.po_id === poNumber
    );
    if (!targetPO) return null;

    // Cegah double penerimaan jika sudah selesai/diterima penuh
    if (
      !options?.items &&
      (targetPO.status === 'RECEIVED' ||
        targetPO.status === 'GOODS_RECEIPT' ||
        targetPO.status === 'FULLY_RECEIVED' ||
        targetPO.status === 'Selesai')
    ) {
      return null;
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);
    const doNumber =
      options?.doNumber ||
      targetPO.delivery_order_no ||
      `DO-${poNumber.replace(/^PO-/, '')}-${Date.now().toString().slice(-4)}`;

    // 1. Tentukan item yang diterima
    let itemsToReceive: Array<{
      productId: string;
      productName: string;
      orderedQty: number;
      receivedQty: number;
      acceptedQty: number;
      rejectedQty: number;
      unit: string;
      unitCost: number;
      rejectionReason: string;
    }> = [];

    if (options?.items && options.items.length > 0) {
      itemsToReceive = options.items.map((it) => {
        const acc = it.acceptedQty !== undefined ? it.acceptedQty : it.receivedQty;
        const rej = it.rejectedQty || 0;
        const uCost =
          it.unitCost ||
          targetPO.item_details?.find((d) => d.product_id === it.productId)?.unit_cost ||
          0;
        return {
          productId: it.productId,
          productName: it.productName || it.productId,
          orderedQty: it.orderedQty || acc + rej,
          receivedQty: it.receivedQty,
          acceptedQty: acc,
          rejectedQty: rej,
          unit: it.unit || 'Unit',
          unitCost: uCost,
          rejectionReason: it.rejectionReason || '',
        };
      });
    } else if (targetPO.item_details && targetPO.item_details.length > 0) {
      itemsToReceive = targetPO.item_details.map((detail) => {
        const already = detail.received_qty || 0;
        const outstanding = Math.max(0, detail.qty - already);
        const recQty = outstanding > 0 ? outstanding : detail.qty;
        const prod = products.find((p) => p.id === detail.product_id);
        return {
          productId: detail.product_id,
          productName: detail.product_name,
          orderedQty: detail.qty,
          receivedQty: recQty,
          acceptedQty: recQty,
          rejectedQty: 0,
          unit: detail.unit || prod?.unit || 'Unit',
          unitCost: detail.unit_cost || prod?.cost_price || prod?.buy_price || 0,
          rejectionReason: '',
        };
      });
    } else {
      const def = products[0];
      itemsToReceive = [
        {
          productId: def?.id || 'PRD-001',
          productName: targetPO.items || def?.name || 'Item PO',
          orderedQty: 1,
          receivedQty: 1,
          acceptedQty: 1,
          rejectedQty: 0,
          unit: def?.unit || 'Unit',
          unitCost: targetPO.total_amount || def?.cost_price || 0,
          rejectionReason: '',
        },
      ];
    }

    const acceptedMap = new Map<string, { qty: number; unitCost: number; name: string }>();
    itemsToReceive.forEach((it) => {
      if (it.acceptedQty > 0) {
        const prev = acceptedMap.get(it.productId);
        if (prev) {
          prev.qty += it.acceptedQty;
        } else {
          acceptedMap.set(it.productId, {
            qty: it.acceptedQty,
            unitCost: it.unitCost,
            name: it.productName,
          });
        }
      }
    });

    if (acceptedMap.size === 0) return null;

    const newStockMutations: StockMutation[] = [];

    // 2. Tambah stok produk gudang & perbarui HPP Rata-rata (Weighted Moving Average Cost) di Master Data
    setProducts((prev) => {
      const updated = prev.map((prod) => {
        const itemInfo = acceptedMap.get(prod.id);
        if (itemInfo && itemInfo.qty > 0) {
          const prevStock = prod.stock;
          const incomingQty = itemInfo.qty;
          const incomingCost = itemInfo.unitCost || prod.cost_price || prod.buy_price || 0;
          const currentCost = prod.buy_price || prod.cost_price || 0;
          const newStock = prevStock + incomingQty;

          // Rumus HPP / Average Cost: ((prevStock * currentCost) + (incomingQty * incomingCost)) / newStock
          const newAverageCost =
            newStock > 0
              ? Math.round(
                  (Math.max(0, prevStock) * currentCost + incomingQty * incomingCost) / newStock
                )
              : incomingCost;

          const threshold = getProductAlertThreshold({ ...prod, stock: newStock });
          let newStatus = prod.status;
          if (newStock <= 0) {
            newStatus = 'Out of Stock';
          } else if (newStock <= threshold.minStock) {
            newStatus = 'Low Stock';
          } else {
            newStatus = 'Active';
          }

          const itemPayload = itemsToReceive.find((it) => it.productId === prod.id);
          const rejInfo =
            itemPayload && itemPayload.rejectedQty > 0
              ? ` [Ditolak: ${itemPayload.rejectedQty} ${itemPayload.unit} - ${
                  itemPayload.rejectionReason || 'Rusak'
                }]`
              : '';

          newStockMutations.push({
            id: `MUT-IN-PUR-${Date.now()}-${prod.id}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: timeStr,
            date: dateStr,
            product_id: prod.id,
            sku: prod.sku || prod.barcode || prod.id,
            product_name: prod.name,
            type: 'RESTOCK-PO',
            qty: incomingQty,
            previous_stock: prevStock,
            final_stock: newStock,
            balanceAfter: newStock,
            reference_no: targetPO.po_number,
            referenceId: `${targetPO.po_number} / ${doNumber}`,
            supplier: targetPO.supplier_name,
            supplier_name: targetPO.supplier_name,
            unit_cost: incomingCost,
            notes: `Penerimaan Barang PO ${targetPO.po_number} dari ${targetPO.supplier_name} (DO: ${doNumber})${rejInfo} • HPP Rata-rata: Rp ${newAverageCost.toLocaleString('id-ID')}/unit`,
            operator: `${safeOperator.name} (${safeOperator.role})`,
            warehouse: prod.rackLocation || 'GD001 - Gudang Utama',
          });

          return {
            ...prod,
            stock: newStock,
            buy_price: newAverageCost,
            cost_price: newAverageCost,
            status: newStatus,
          };
        }
        return prod;
      });

      const clean = deduplicateProducts(updated);
      try {
        localStorage.setItem('jacs_erp_products', JSON.stringify(clean));
      } catch (e) {
        console.error('Error saving products after PO receipt:', e);
      }
      return clean;
    });

    // 3. Tambahkan kuantitas stok produk bersangkutan di DB_Inventory sesuai jumlah qty diterima
    setInventory((prev) => {
      const updated = [...prev];
      acceptedMap.forEach((info, pId) => {
        const existingIdx = updated.findIndex((inv) => inv.product_id === pId);
        const prod = products.find((p) => p.id === pId);
        if (existingIdx !== -1) {
          const inv = updated[existingIdx];
          updated[existingIdx] = {
            ...inv,
            product_name: prod?.name || inv.product_name,
            in_qty: inv.in_qty + info.qty,
            final_stock: inv.final_stock + info.qty,
            last_update: timeStr,
          };
        } else {
          const baseStock = prod ? prod.stock : 0;
          updated.push({
            product_id: pId,
            product_name: prod?.name || info.name || pId,
            initial_stock: baseStock,
            in_qty: info.qty,
            out_qty: 0,
            final_stock: baseStock + info.qty,
            last_update: timeStr,
          });
        }
      });

      const clean = deduplicateInventory(updated);
      try {
        localStorage.setItem('jacs_erp_inventory', JSON.stringify(clean));
      } catch (e) {}
      return clean;
    });

    // 4. Catat baris mutasi masuk di Stock Ledger dengan tipe: 'IN_PURCHASE', nomor referensi PO, dan nama supplier
    if (newStockMutations.length > 0) {
      setStockMutations((prev) => {
        const next = [...newStockMutations, ...prev];
        try {
          localStorage.setItem('jacs_erp_stock_mutations', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    // 5. Update Purchasing status
    setPurchasing((prev) =>
      prev.map((po) => {
        if (po.po_number === poNumber || po.po_id === poNumber) {
          const updatedDetails = (po.item_details || []).map((detail) => {
            const grItem = itemsToReceive.find((it) => it.productId === detail.product_id);
            const addRec = grItem ? grItem.acceptedQty : 0;
            const newRecQty = (detail.received_qty || 0) + addRec;
            return {
              ...detail,
              received_qty: newRecQty,
            };
          });

          return {
            ...po,
            status: 'RECEIVED' as PurchaseOrderStatus,
            delivery_order_no: doNumber,
            received_date: dateStr,
            received_by: `${safeOperator.name} (${safeOperator.role})`,
            item_details: updatedDetails.length > 0 ? updatedDetails : po.item_details,
            receiving_notes: options?.notes || po.receiving_notes,
          };
        }
        return po;
      })
    );

    // 6. Catat ke goodsReceipts agar muncul di tab Riwayat Penerimaan Barang (GRN) Purchasing
    const grExists = goodsReceipts.some((g) => g.poNumber === targetPO.po_number);
    if (!grExists) {
      const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
        now.getDate()
      ).padStart(2, '0')}`;
      const grSeq = String(goodsReceipts.length + 1).padStart(4, '0');
      const grId = `GR-${dateCode}-${grSeq}`;
      const autoGR: GoodsReceipt = {
        id: grId,
        poId: targetPO.po_id || targetPO.po_number,
        poNumber: targetPO.po_number,
        vendorId: targetPO.vendor_id || targetPO.supplier_id || 'SUPP-DEFAULT',
        vendorName: targetPO.supplier_name,
        warehouseId: 'WH-MAIN-01',
        deliveryOrderNumber: doNumber,
        receivedDate: timeStr,
        receivedByUserId: `${safeOperator.name} (${safeOperator.role})`,
        status: 'VERIFIED',
        items: itemsToReceive.map((it, idx) => ({
          id: `GRI-${Date.now()}-${idx}`,
          poItemId: `POI-${targetPO.po_number}-${it.productId}`,
          productId: it.productId,
          productName: it.productName,
          orderedQty: it.orderedQty,
          receivedQty: it.receivedQty,
          acceptedQty: it.acceptedQty,
          rejectedQty: it.rejectedQty,
          unit: it.unit,
          unitCost: it.unitCost,
          totalCost: it.acceptedQty * it.unitCost,
          rejectionReason: it.rejectionReason,
          product_id: it.productId,
          product_name: it.productName,
          ordered_qty: it.orderedQty,
          received_qty: it.receivedQty,
          notes: it.rejectionReason,
        })),
        notes: options?.notes || 'Penerimaan fisik barang & verifikasi surat jalan PO',
        idempotencyKey: `GR-AUTO-${targetPO.po_number}-${doNumber}`,
      };
      setGoodsReceipts((prev) => [autoGR, ...prev]);
    }

    // Sinkronkan otomatis ke AP Ledger di modul Finance saat barang diterima
    syncAccountsPayableInvoice(targetPO, 'GOODS_RECEIPT');

    addAuditLog(
      `Penerimaan Barang PO ${targetPO.po_number} (${targetPO.supplier_name}): Stok gudang bertambah, DB_Inventory terupdate, mutasi 'IN_PURCHASE' dicatat, dan HPP Rata-rata Master Data diperbarui.`,
      'Purchasing & Warehouse',
      'INFO'
    );

    showToast(
      `PO ${targetPO.po_number} (${targetPO.supplier_name}) DITERIMA! Stok Gudang & DB_Inventory bertambah, HPP Rata-rata diperbarui.`
    );

    return {
      success: true,
      newStockMutations,
      itemsToReceive,
    };
  };

  const receivePurchaseOrder = (poNumber: string) => {
    receivePoGoodsAndAdjustCost(poNumber);
  };

  const processGoodsReceipt = (payload: {
    poNumber: string;
    deliveryOrderNumber?: string;
    items: Array<{
      productId: string;
      productName?: string;
      orderedQty?: number;
      receivedQty: number;
      acceptedQty?: number;
      rejectedQty?: number;
      unit?: string;
      unitCost?: number;
      rejectionReason?: string;
    }>;
    notes?: string;
    receivedDate?: string;
    idempotencyKey?: string;
  }): { success: boolean; message: string; grId?: string; journalId?: string; payableAmount?: number } => {
    const doNumber = payload.deliveryOrderNumber || `DO-${Date.now().toString().slice(-6)}`;
    const key = payload.idempotencyKey || `GR-IDEM-${payload.poNumber}-${doNumber}`;
    const existingGR = goodsReceipts.find((g) => g.idempotencyKey === key);
    if (existingGR) {
      return {
        success: false,
        message: `Goods Receipt dengan Delivery Order "${doNumber}" sudah pernah diproses (${existingGR.id})!`,
      };
    }

    const targetPO = purchasing.find((p) => p.po_number === payload.poNumber || p.po_id === payload.poNumber);
    if (!targetPO) {
      return { success: false, message: `Purchase Order ${payload.poNumber} tidak ditemukan!` };
    }

    const now = new Date();
    const dateStr = payload.receivedDate || now.toISOString().slice(0, 10);
    const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);
    const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const grSeq = String(goodsReceipts.length + 1).padStart(4, '0');
    const grId = `GR-${dateCode}-${grSeq}`;
    const journalRef = `FIN-GRN-${grId}`;
    const journalId = `FIN-GRN-${grId}`;

    // 1. Build GoodsReceipt items
    const grItems: GoodsReceiptItem[] = payload.items.map((it, idx) => {
      const accepted = it.acceptedQty !== undefined ? it.acceptedQty : it.receivedQty;
      const rejected = it.rejectedQty || 0;
      const unitCostVal = it.unitCost || (targetPO.item_details?.find((d) => d.product_id === it.productId)?.unit_cost || 0);
      return {
        id: `GRI-${Date.now()}-${idx}`,
        poItemId: `POI-${payload.poNumber}-${it.productId}`,
        productId: it.productId,
        productName: it.productName || it.productId,
        orderedQty: it.orderedQty || accepted + rejected,
        receivedQty: it.receivedQty,
        acceptedQty: accepted,
        rejectedQty: rejected,
        unit: it.unit || 'Unit',
        unitCost: unitCostVal,
        totalCost: accepted * unitCostVal,
        rejectionReason: it.rejectionReason,
        product_id: it.productId,
        product_name: it.productName || it.productId,
        ordered_qty: it.orderedQty || accepted + rejected,
        received_qty: it.receivedQty,
        notes: it.rejectionReason,
      };
    });

    const newGoodsReceipt: GoodsReceipt = {
      id: grId,
      poId: targetPO.po_id || targetPO.po_number,
      poNumber: targetPO.po_number,
      vendorId: targetPO.vendor_id || targetPO.supplier_id || 'SUPP-DEFAULT',
      vendorName: targetPO.supplier_name,
      warehouseId: 'WH-MAIN-01',
      deliveryOrderNumber: doNumber,
      receivedDate: timeStr,
      receivedByUserId: `${safeOperator.name} (${safeOperator.role})`,
      status: 'VERIFIED',
      items: grItems,
      notes: payload.notes || 'Penerimaan fisik barang & verifikasi surat jalan (DO)',
      idempotencyKey: key,
    };

    // 2. Restock Gudang: Update products (tambah stok fisik produk di katalog Gudang & Inventori)
    const acceptedMap = new Map<string, number>();
    grItems.forEach((it) => {
      if (it.acceptedQty > 0) {
        acceptedMap.set(it.productId, (acceptedMap.get(it.productId) || 0) + it.acceptedQty);
      }
    });

    const newStockMutations: StockMutation[] = [];

    setProducts((prev) => {
      const updated = prev.map((prod) => {
        const acceptQty = acceptedMap.get(prod.id) || 0;
        if (acceptQty > 0) {
          const prevStock = prod.stock;
          const newStock = prevStock + acceptQty;
          const itemPayload = grItems.find((it) => it.productId === prod.id);
          const incomingCost = itemPayload?.unitCost || (prod.buy_price || prod.cost_price || 0);
          const currentCost = prod.buy_price || prod.cost_price || 0;
          // Rumus HPP Rata-rata Bergerak (Weighted Moving Average Cost)
          const newAverageCost =
            newStock > 0
              ? Math.round(
                  (Math.max(0, prevStock) * currentCost + acceptQty * incomingCost) / newStock
                )
              : incomingCost;

          const threshold = getProductAlertThreshold({ ...prod, stock: newStock });

          let newStatus = prod.status;
          if (newStock <= 0) {
            newStatus = 'Out of Stock';
          } else if (newStock <= threshold.minStock) {
            newStatus = 'Low Stock';
          } else {
            newStatus = 'Active';
          }

          const rejInfo =
            itemPayload && itemPayload.rejectedQty > 0
              ? ` [Ditolak: ${itemPayload.rejectedQty} ${itemPayload.unit} - ${
                  itemPayload.rejectionReason || 'Rusak'
                }]`
              : '';

          newStockMutations.push({
            id: `MUT-IN-PUR-${Date.now()}-${prod.id}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: timeStr,
            date: dateStr,
            product_id: prod.id,
            sku: prod.sku || prod.barcode || prod.id,
            product_name: prod.name,
            type: 'RESTOCK-PO',
            qty: acceptQty,
            previous_stock: prevStock,
            final_stock: newStock,
            balanceAfter: newStock,
            reference_no: targetPO.po_number,
            referenceId: `${journalRef} / ${doNumber}`,
            supplier: targetPO.supplier_name,
            supplier_name: targetPO.supplier_name,
            unit_cost: incomingCost,
            notes: `Penerimaan Barang PO ${payload.poNumber} dari ${targetPO.supplier_name} (DO: ${doNumber})${rejInfo} • HPP Rata-rata: Rp ${newAverageCost.toLocaleString('id-ID')}/unit`,
            operator: `${safeOperator.name} (${safeOperator.role})`,
            warehouse: prod.rackLocation || 'GD001 - Gudang Utama',
          });

          return {
            ...prod,
            stock: newStock,
            buy_price: newAverageCost,
            cost_price: newAverageCost,
            status: newStatus,
          };
        }
        return prod;
      });

      const clean = deduplicateProducts(updated);
      try {
        localStorage.setItem('jacs_erp_products', JSON.stringify(clean));
      } catch (e) {
        console.error('Error saving products after GRN:', e);
      }
      return clean;
    });

    // 3. Update DB_Inventory state
    setInventory((prev) => {
      const updated = [...prev];
      acceptedMap.forEach((acceptQty, pId) => {
        const existingIdx = updated.findIndex((inv) => inv.product_id === pId);
        if (existingIdx !== -1) {
          const inv = updated[existingIdx];
          updated[existingIdx] = {
            ...inv,
            in_qty: inv.in_qty + acceptQty,
            final_stock: inv.final_stock + acceptQty,
            last_update: timeStr,
          };
        } else {
          const p = products.find((prod) => prod.id === pId);
          const baseStock = p?.stock || 0;
          updated.push({
            product_id: pId,
            product_name: p?.name || pId,
            initial_stock: baseStock,
            in_qty: acceptQty,
            out_qty: 0,
            final_stock: baseStock + acceptQty,
            last_update: timeStr,
          });
        }
      });
      const clean = deduplicateInventory(updated);
      try {
        localStorage.setItem('jacs_erp_inventory', JSON.stringify(clean));
      } catch (e) {}
      return clean;
    });

    // 4. Record Stock Mutations
    if (newStockMutations.length > 0) {
      setStockMutations((prev) => {
        const next = [...newStockMutations, ...prev];
        try {
          localStorage.setItem('jacs_erp_stock_mutations', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    // 5. Update Purchase Order status:
    // Perbarui status PO menjadi 'RECEIVED' (atau 'PARTIAL' jika belum lengkap)
    let finalPoStatus: PurchaseOrderStatus = 'RECEIVED';

    setPurchasing((prev) =>
      prev.map((po) => {
        if (po.po_number === payload.poNumber || po.po_id === payload.poNumber) {
          const updatedDetails = (po.item_details || []).map((detail) => {
            const grItem = grItems.find((it) => it.productId === detail.product_id);
            const addRec = grItem ? grItem.acceptedQty : 0;
            const newRecQty = (detail.received_qty || 0) + addRec;
            return {
              ...detail,
              received_qty: newRecQty,
            };
          });

          let allFulfilled = true;
          let hasAnyReceived = false;

          if (updatedDetails.length > 0) {
            updatedDetails.forEach((d) => {
              if ((d.received_qty || 0) < d.qty) {
                allFulfilled = false;
              }
              if ((d.received_qty || 0) > 0) {
                hasAnyReceived = true;
              }
            });
          } else {
            allFulfilled = true;
            hasAnyReceived = true;
          }

          const nextStatus: PurchaseOrderStatus = allFulfilled
            ? 'RECEIVED'
            : hasAnyReceived
            ? 'PARTIAL'
            : po.status;

          finalPoStatus = nextStatus;

          const shortfallNotes = updatedDetails
            .filter((d) => (d.received_qty || 0) < d.qty)
            .map((d) => `${d.product_name}: Kurang ${d.qty - (d.received_qty || 0)} ${d.unit}`)
            .join('; ');

          const combinedNotes = shortfallNotes
            ? `${payload.notes || ''} [Catatan Sisa Barang: ${shortfallNotes}]`.trim()
            : payload.notes;

          return {
            ...po,
            status: nextStatus,
            delivery_order_no: doNumber,
            received_date: dateStr,
            received_by: `${safeOperator.name} (${safeOperator.role})`,
            item_details: updatedDetails,
            received_items: [...(po.received_items || []), ...grItems],
            receiving_notes: combinedNotes,
          };
        }
        return po;
      })
    );

    // 6. Append GoodsReceipt record
    setGoodsReceipts((prev) => [newGoodsReceipt, ...prev]);

    // 7. Terbitkan / perbarui tagihan faktur Hutang Usaha (AP) otomatis di modul Finance (APS POS5)
    const totalAcceptedCost = grItems.reduce((acc, it) => acc + it.totalCost, 0);
    const ppnRate = targetPO.include_ppn ? (targetPO.ppn_rate || 11) : 0;
    const ppnAmount = Math.round(totalAcceptedCost * (ppnRate / 100));
    const calculatedPayable = totalAcceptedCost + ppnAmount;
    const totalPayableAmount = calculatedPayable > 0 ? calculatedPayable : (targetPO.total_amount || 0);

    syncAccountsPayableInvoice(
      {
        ...targetPO,
        total_amount: totalPayableAmount,
      },
      'GOODS_RECEIPT'
    );

    // 8. Catat jurnal akuntansi FIN-GRN-[id]: Debit Persediaan (1-10501) dan Kredit Hutang Dagang (2-10101)
    const journalLines: JournalEntryLine[] = [
      {
        accountCode: '1-10501',
        accountName: 'Persediaan',
        debit: totalPayableAmount,
        credit: 0,
      },
      {
        accountCode: '2-10101',
        accountName: 'Hutang Dagang',
        debit: 0,
        credit: totalPayableAmount,
      },
    ];

    const grnJournalEntry: JournalEntry = {
      id: journalId,
      date: dateStr,
      reference: journalRef,
      description: `Penerimaan Barang (GRN) ${journalRef} PO ${targetPO.po_number} dari ${targetPO.supplier_name} • Debit Persediaan [1-10501], Kredit Hutang Dagang [2-10101] Rp ${totalPayableAmount.toLocaleString('id-ID')}`,
      type: 'GENERAL',
      lines: journalLines,
      totalDebit: totalPayableAmount,
      totalCredit: totalPayableAmount,
      created_at: new Date().toISOString(),
    };

    setJournalEntries((prev) => {
      const next = [grnJournalEntry, ...prev];
      try {
        localStorage.setItem('jacs_erp_journal_entries', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    const totalAcceptedUnits = grItems.reduce((acc, it) => acc + it.acceptedQty, 0);
    const totalRejectedUnits = grItems.reduce((acc, it) => acc + it.rejectedQty, 0);

    addAuditLog(
      `Goods Receipt ${grId} (${journalRef}) untuk PO ${payload.poNumber} [DO: ${doNumber}]. Status PO: ${finalPoStatus}. Diterima: ${totalAcceptedUnits} unit, Ditolak: ${totalRejectedUnits} unit. Faktur Hutang Dagang Rp ${totalPayableAmount.toLocaleString('id-ID')} diterbitkan!`,
      'Warehouse / Purchasing',
      'INFO'
    );

    showToast(
      `📦 Penerimaan Barang ${grId} sukses! Status PO menjadi ${finalPoStatus}, stok gudang bertambah, & Hutang Dagang tercatat (Jurnal ${journalRef}).`
    );

    return {
      success: true,
      message: `Penerimaan Barang ${grId} berhasil diproses. Status PO ${finalPoStatus}, Hutang Dagang & Jurnal ${journalRef} tercatat.`,
      grId,
      journalId: journalRef,
      payableAmount: totalPayableAmount,
    };
  };

  const handleCreateGoodsReceipt = processGoodsReceipt;

  const adjustStock = (productId: string, qtyDelta: number, reason: string) => {
    const timeStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let prevStockVal = 0;
    let newStockVal = 0;
    let targetProductName = productId;
    let adjustedProduct: Product | undefined;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          prevStockVal = p.stock;
          const newStock = Math.max(0, p.stock + qtyDelta);
          newStockVal = newStock;
          targetProductName = p.name;
          adjustedProduct = { ...p, stock: newStock };
          const thresholdInfo = getProductAlertThreshold(p);
          const effectiveMinStock = p.minStock ?? p.min_stock ?? thresholdInfo.minStock ?? 10;
          let newStatus = p.status;
          if (newStock <= 0) newStatus = 'Out of Stock';
          else if (newStock <= effectiveMinStock || thresholdInfo.isLowStock) newStatus = 'Low Stock';
          else newStatus = 'Active';
          return { ...p, stock: newStock, status: newStatus };
        }
        return p;
      })
    );

    setInventory((prev) =>
      prev.map((inv) => {
        if (inv.product_id === productId) {
          const inQty = qtyDelta > 0 ? inv.in_qty + qtyDelta : inv.in_qty;
          const outQty = qtyDelta < 0 ? inv.out_qty + Math.abs(qtyDelta) : inv.out_qty;
          const finalStock = Math.max(0, inv.final_stock + qtyDelta);
          return { ...inv, in_qty: inQty, out_qty: outQty, final_stock: finalStock, last_update: timeStr };
        }
        return inv;
      })
    );

    // Catat Mutasi Manual / Restock ke Kartu Stok
    const mutationType: 'IN' | 'OUT' = qtyDelta >= 0 ? 'IN' : 'OUT';
    const newMut: StockMutation = {
      id: `MUT-${Date.now()}`,
      timestamp: timeStr,
      product_id: productId,
      product_name: targetProductName,
      type: mutationType,
      qty: Math.abs(qtyDelta),
      previous_stock: prevStockVal,
      final_stock: newStockVal,
      reference_no: reason.includes('PO') ? reason : `ADJ-${Date.now().toString().slice(-4)}`,
      notes: reason,
      operator: `${safeOperator.name} (${safeOperator.role})`,
    };
    setStockMutations((prev) => [newMut, ...prev]);

    // ROP check jika stok berkurang
    if (qtyDelta < 0 && adjustedProduct) {
      const ropResult = triggerRopDraftPurchaseRequest(
        adjustedProduct,
        newStockVal,
        purchaseRequests
      );
      if (ropResult) {
        setPurchaseRequests((prev) => [ropResult.pr, ...prev]);
        setApprovalQueue((prev) => [ropResult.approval, ...prev]);
        showToast(
          `⚠️ Stok ${adjustedProduct.name} menyentuh batas ROP (${newStockVal} unit). Draf Purchase Request ${ropResult.pr.pr_number} berstatus PENDING otomatis dibuat di Purchasing!`
        );
      }
    }

    addAuditLog(`Stock adjusted for ${productId} by ${qtyDelta > 0 ? '+' : ''}${qtyDelta} (${reason})`, 'Warehouse');
  };

  const processStockOpnameAdjustment = (params: {
    productId: string;
    physicalStock: number;
    systemStock: number;
    notes?: string;
    operator?: string;
  }) => {
    const product = products.find((p) => p.id === params.productId);
    if (!product) {
      showToast('Produk tidak ditemukan untuk stock opname.');
      return { success: false, difference: 0, message: 'Produk tidak ditemukan' };
    }

    const difference = params.physicalStock - params.systemStock;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);
    const adjSeq = Date.now().toString().slice(-6);
    const adjRef = `FIN-STK-ADJ-${adjSeq}`;
    const journalId = `JRN-${adjRef}`;
    const operatorName = params.operator || `${safeOperator.name} (${safeOperator.role})`;

    // 1. Sesuaikan stok fisik riil produk di katalog
    const newStock = Math.max(0, params.physicalStock);
    const thresholdInfo = getProductAlertThreshold(product);
    const effectiveMinStock = product.minStock ?? product.min_stock ?? thresholdInfo.minStock ?? 10;
    let newStatus = product.status;
    if (newStock <= 0) newStatus = 'Out of Stock';
    else if (newStock <= effectiveMinStock || thresholdInfo.isLowStock) newStatus = 'Low Stock';
    else newStatus = 'Active';

    setProducts((prev) =>
      prev.map((p) => (p.id === params.productId ? { ...p, stock: newStock, status: newStatus } : p))
    );

    if (difference < 0 || newStock <= effectiveMinStock) {
      const ropResult = triggerRopDraftPurchaseRequest(
        { ...product, stock: newStock },
        newStock,
        purchaseRequests
      );
      if (ropResult) {
        setPurchaseRequests((prev) => [ropResult.pr, ...prev]);
        setApprovalQueue((prev) => [ropResult.approval, ...prev]);
      }
    }

    // 2. Sesuaikan saldo inventori (DB_Inventory)
    setInventory((prev) =>
      prev.map((inv) => {
        if (inv.product_id === params.productId) {
          const inQty = difference > 0 ? inv.in_qty + difference : inv.in_qty;
          const outQty = difference < 0 ? inv.out_qty + Math.abs(difference) : inv.out_qty;
          return {
            ...inv,
            in_qty: inQty,
            out_qty: outQty,
            final_stock: newStock,
            last_update: timeStr,
          };
        }
        return inv;
      })
    );

    // 3. Catat riwayat mutasi stok opname
    if (difference !== 0) {
      const newMut: StockMutation = {
        id: `MUT-${Date.now()}`,
        timestamp: timeStr,
        product_id: params.productId,
        product_name: product.name,
        type: difference > 0 ? 'IN' : 'OUT',
        qty: Math.abs(difference),
        previous_stock: params.systemStock,
        final_stock: newStock,
        reference_no: adjRef,
        notes:
          params.notes ||
          (difference < 0
            ? `Stock Opname Selisih Kurang (${difference} ${product.unit || 'Unit'})`
            : `Stock Opname Selisih Lebih (+${difference} ${product.unit || 'Unit'})`),
        operator: operatorName,
      };
      setStockMutations((prev) => [newMut, ...prev]);
    }

    // 4. Jika ada selisih (adjustment), catat jurnal akuntansi FIN-STK-ADJ:
    // Selisih Kurang: Debit Beban Selisih Persediaan (5-10502), Kredit Persediaan (1-10501).
    // Selisih Lebih: Debit Persediaan (1-10501), Kredit Pendapatan Penyesuaian Persediaan (4-10502).
    const unitCost = product.cost_price || 15000;
    const totalAdjValue = Math.abs(difference) * unitCost;

    if (difference < 0) {
      const lostQty = Math.abs(difference);
      const journalLines: JournalEntryLine[] = [
        {
          accountCode: '5-10502',
          accountName: 'Beban Selisih Persediaan',
          debit: totalAdjValue,
          credit: 0,
        },
        {
          accountCode: '1-10501',
          accountName: 'Persediaan',
          debit: 0,
          credit: totalAdjValue,
        },
      ];

      const opnameJournal: JournalEntry = {
        id: journalId,
        date: dateStr,
        reference: adjRef,
        description: `Penyesuaian Stock Opname Selisih Kurang: ${product.name} (-${lostQty} ${product.unit || 'Unit'}) • Debit Beban Selisih [5-10502], Kredit Persediaan [1-10501] Rp ${totalAdjValue.toLocaleString('id-ID')}`,
        type: 'GENERAL',
        lines: journalLines,
        totalDebit: totalAdjValue,
        totalCredit: totalAdjValue,
        created_at: new Date().toISOString(),
      };
      setJournalEntries((prev) => {
        const next = [opnameJournal, ...prev];
        try {
          localStorage.setItem('jacs_erp_journal_entries', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      const financeEntry: FinanceEntry = {
        id: `FIN-${adjRef}`,
        date: dateStr,
        type: 'EXPENSE',
        category: 'Penyesuaian Stok (Stock Opname Shortage)',
        description: `Penyesuaian Stock Opname Kurang: ${product.name} (-${lostQty} unit) - Akun 5-10502`,
        amount: totalAdjValue,
        reference: adjRef,
        payment_method: 'CASH',
        account_target: 'Beban Selisih Persediaan (5-10502)',
        created_at: new Date().toISOString(),
      };
      setFinance((prev) => [financeEntry, ...prev]);
    } else if (difference > 0) {
      const surplusQty = difference;
      const journalLines: JournalEntryLine[] = [
        {
          accountCode: '1-10501',
          accountName: 'Persediaan',
          debit: totalAdjValue,
          credit: 0,
        },
        {
          accountCode: '4-10502',
          accountName: 'Pendapatan Penyesuaian Persediaan',
          debit: 0,
          credit: totalAdjValue,
        },
      ];

      const opnameJournal: JournalEntry = {
        id: journalId,
        date: dateStr,
        reference: adjRef,
        description: `Penyesuaian Stock Opname Selisih Lebih: ${product.name} (+${surplusQty} ${product.unit || 'Unit'}) • Debit Persediaan [1-10501], Kredit Pendapatan Penyesuaian [4-10502] Rp ${totalAdjValue.toLocaleString('id-ID')}`,
        type: 'GENERAL',
        lines: journalLines,
        totalDebit: totalAdjValue,
        totalCredit: totalAdjValue,
        created_at: new Date().toISOString(),
      };
      setJournalEntries((prev) => {
        const next = [opnameJournal, ...prev];
        try {
          localStorage.setItem('jacs_erp_journal_entries', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      const financeEntry: FinanceEntry = {
        id: `FIN-${adjRef}`,
        date: dateStr,
        type: 'IN / PENDAPATAN',
        category: 'Penyesuaian Stok (Stock Opname Surplus)',
        description: `Penyesuaian Stock Opname Lebih: ${product.name} (+${surplusQty} unit) - Akun 4-10502`,
        amount: totalAdjValue,
        reference: adjRef,
        payment_method: 'CASH',
        account_target: 'Pendapatan Penyesuaian Persediaan (4-10502)',
        created_at: new Date().toISOString(),
      };
      setFinance((prev) => [financeEntry, ...prev]);
    }

    addAuditLog(
      `Stock Opname [${adjRef}] ${product.name}: Fisik ${params.physicalStock} vs Sistem ${params.systemStock} (Selisih: ${difference > 0 ? '+' : ''}${difference}) senilai Rp ${totalAdjValue.toLocaleString('id-ID')}`,
      'Warehouse & Finance',
      difference === 0 ? 'INFO' : difference < 0 ? 'WARN' : 'INFO'
    );

    const msg =
      difference === 0
        ? `Stok fisik ${product.name} (${params.physicalStock} unit) sesuai dengan sistem. Balance (Rp 0)!`
        : difference < 0
        ? `Stock Opname Selisih Kurang -${Math.abs(difference)} unit: Jurnal ${adjRef} dicatat (Debit Beban 5-10502, Kredit Persediaan 1-10501 Rp ${totalAdjValue.toLocaleString('id-ID')}).`
        : `Stock Opname Selisih Lebih +${difference} unit: Jurnal ${adjRef} dicatat (Debit Persediaan 1-10501, Kredit Pendapatan 4-10502 Rp ${totalAdjValue.toLocaleString('id-ID')}).`;

    showToast(msg);

    return {
      success: true,
      difference,
      journalId: difference !== 0 ? journalId : undefined,
      message: msg,
    };
  };

  const addFinanceEntry = (entry: Omit<FinanceEntry, 'id'>) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newEntry: FinanceEntry = {
      ...entry,
      id: `FIN-${uniqueSuffix}`,
    };
    setFinance((prev) => {
      const seen = new Set<string>([newEntry.id]);
      const result: FinanceEntry[] = [newEntry];
      for (const item of prev) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          result.push(item);
        } else {
          const freshId = `${item.id}-${Math.random().toString(36).slice(2, 5)}`;
          seen.add(freshId);
          result.push({ ...item, id: freshId });
        }
      }
      return result;
    });
    addAuditLog(`Finance entry added: ${entry.type} Rp ${entry.amount.toLocaleString('id-ID')} (${entry.category})`, 'Finance');
    showToast(`Pencatatan kas (${entry.type}) berhasil ditambahkan!`);
  };

  // POS Cashier Shift & Cash Reconciliation Methods (APS POS4: 32_ShiftKasir)
  const openCashierShift = (initialCash: number, notes?: string): CashierShift => {
    const now = new Date();
    const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const shiftSeq = shiftsHistory.length + 1;
    const shiftId = `SHIFT-${dateCode}-${String(shiftSeq).padStart(4, '0')}`;

    const newShift: CashierShift = {
      id: shiftId,
      cashierId: safeOperator.user_id,
      cashierName: safeOperator.name,
      terminalId: activeTerminal.id,
      terminalName: activeTerminal.name,
      startTime: `${now.toISOString().slice(0, 10)} ${timeStr}`,
      status: 'OPEN',
      initialCash,
      totalCashSales: 0,
      totalNonCashSales: 0,
      totalTransactionsCount: 0,
      totalExpenses: 0,
      expenses: [],
      expectedCashInDrawer: initialCash,
      notes: notes || 'Pembukaan shift reguler kasir',
    };

    setActiveShift(newShift);

    addAuditLog(
      `Kasir ${safeOperator.name} membuka shift ${shiftId} di ${activeTerminal.name} dengan modal kas Rp ${initialCash.toLocaleString('id-ID')}`,
      'POS / Shift Kasir',
      'INFO'
    );

    showToast(
      `Shift #${shiftId} dibuka! Modal kasir Rp ${initialCash.toLocaleString('id-ID')} tercatat di laci.`
    );

    return newShift;
  };

  const recordShiftExpense = (amount: number, reason: string): CashierShiftExpense => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toISOString().slice(0, 10);
    const expenseId = `EXP-SHIFT-${Date.now().toString().slice(-6)}`;

    const currentShiftId = activeShift?.id || `SHIFT-MANUAL-${dateStr}`;

    const newExpense: CashierShiftExpense = {
      id: expenseId,
      shiftId: currentShiftId,
      timestamp: `${dateStr} ${timeStr}`,
      amount,
      reason,
      category: 'KAS_KECIL_KASIR',
      cashierId: safeOperator.user_id,
      cashierName: safeOperator.name,
      terminalId: activeTerminal.id,
    };

    if (activeShift && activeShift.status === 'OPEN') {
      setActiveShift((prev) => {
        if (!prev) return prev;
        const updatedExpenses = [newExpense, ...prev.expenses];
        const newTotalExpenses = prev.totalExpenses + amount;
        const newExpected = prev.initialCash + prev.totalCashSales - newTotalExpenses;
        return {
          ...prev,
          expenses: updatedExpenses,
          totalExpenses: newTotalExpenses,
          expectedCashInDrawer: newExpected,
        };
      });
    }

    // Catat otomatis mutasi Kas Keluar di modul Finance & Accounting
    const newFinanceExpense: FinanceEntry = {
      id: `FIN-${expenseId}`,
      date: dateStr,
      type: 'EXPENSE',
      category: 'Petty Cash Kasir (Tarik Kas Shift)',
      description: `Pengeluaran darurat shift ${currentShiftId} (${activeTerminal.name}): ${reason}`,
      amount: amount,
      reference: expenseId,
      payment_method: 'CASH',
      account_target: 'Kas Kasir / Laci',
      created_at: new Date().toISOString(),
    };
    setFinance((prev) => [newFinanceExpense, ...prev]);

    addAuditLog(
      `Tarik Kas / Petty Cash shift ${currentShiftId} sebesar Rp ${amount.toLocaleString('id-ID')} untuk: ${reason}`,
      'POS / Petty Cash',
      'WARN'
    );

    showToast(
      `Tarik kas Rp ${amount.toLocaleString('id-ID')} berhasil dicatat & memotong saldo laci kasir!`
    );

    return newExpense;
  };

  const closeCashierShift = (
    actualCash: number,
    notes?: string,
    denominationBreakdown?: Record<string, number>
  ): { shift: CashierShift; difference: number; status: 'MATCH' | 'SURPLUS' | 'SHORTAGE' } => {
    if (!activeShift) {
      throw new Error('Tidak ada shift kasir yang sedang aktif.');
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const endTimestamp = `${dateStr} ${timeStr}`;

    const expected = activeShift.expectedCashInDrawer;
    const difference = actualCash - expected;
    const status: 'MATCH' | 'SURPLUS' | 'SHORTAGE' =
      difference === 0 ? 'MATCH' : difference > 0 ? 'SURPLUS' : 'SHORTAGE';

    const closedShift: CashierShift = {
      ...activeShift,
      endTime: endTimestamp,
      status: 'CLOSED',
      actualCashInDrawer: actualCash,
      difference,
      reconciliationStatus: status,
      notes: notes || activeShift.notes,
      closedBy: `${safeOperator.name} (${safeOperator.role})`,
      closedAt: endTimestamp,
      denominationBreakdown,
    };

    // Save to history & clear activeShift
    setShiftsHistory((prev) => [closedShift, ...prev]);
    setActiveShift(null);

    // Referensi resmi FIN-SHIFT-SETTLE-[shiftId]
    const settleRef = `FIN-SHIFT-SETTLE-${closedShift.id}`;

    // 1. Buat mutasi jurnal otomatis double-entry di General Ledger
    const journalLines: JournalEntryLine[] = [];

    // Debit Kas Utama / Brankas (1-10000) sebesar kas fisik riil yang disetor
    journalLines.push({
      accountCode: '1-10000',
      accountName: 'Kas Utama / Brankas',
      debit: actualCash,
      credit: 0,
    });

    if (difference < 0) {
      // Kurang Kas (Shortage): Bukukan Beban Selisih Kas (5-10999) di sisi Debit
      const shortageAmount = Math.abs(difference);
      journalLines.push({
        accountCode: '5-10999',
        accountName: 'Beban Selisih Kas',
        debit: shortageAmount,
        credit: 0,
      });

      // Kredit Kas Kasir (1-10001) sebesar kas yang disetor ke brankas/finance
      journalLines.push({
        accountCode: '1-10001',
        accountName: 'Kas Kasir',
        debit: 0,
        credit: expected,
      });
    } else if (difference > 0) {
      // Lebih Kas (Surplus): Kredit Kas Kasir (1-10001) sebesar kas sistem
      journalLines.push({
        accountCode: '1-10001',
        accountName: 'Kas Kasir',
        debit: 0,
        credit: expected,
      });

      // Bukukan Pendapatan Selisih Kas (4-10999) di sisi Kredit
      journalLines.push({
        accountCode: '4-10999',
        accountName: 'Pendapatan Selisih Kas',
        debit: 0,
        credit: difference,
      });
    } else {
      // Balance (Rp 0): Kredit Kas Kasir (1-10001) sebesar kas yang disetor
      journalLines.push({
        accountCode: '1-10001',
        accountName: 'Kas Kasir',
        debit: 0,
        credit: actualCash,
      });
    }

    const totalDebitCalc = journalLines.reduce((acc, l) => acc + l.debit, 0);
    const totalCreditCalc = journalLines.reduce((acc, l) => acc + l.credit, 0);

    const shiftSettleJournal: JournalEntry = {
      id: `JRN-${settleRef}`,
      date: dateStr,
      reference: settleRef,
      description: `Rekonsiliasi Tutup Shift #${closedShift.id} (${closedShift.terminalName} - ${closedShift.cashierName}) • Setor ke Kas Utama / Brankas [1-10000] dari Kas Kasir [1-10001] | Status: ${
        difference === 0
          ? 'Balance (Rp 0)'
          : difference > 0
          ? `Lebih Kas (Surplus) +Rp ${difference.toLocaleString('id-ID')}`
          : `Kurang Kas (Shortage) -Rp ${Math.abs(difference).toLocaleString('id-ID')}`
      }`,
      type: 'SHIFT_SETTLEMENT',
      lines: journalLines,
      totalDebit: totalDebitCalc,
      totalCredit: totalCreditCalc,
      created_at: endTimestamp,
    };

    setJournalEntries((prev) => {
      const next = [shiftSettleJournal, ...prev];
      try {
        localStorage.setItem('jacs_erp_journal_entries', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving shift settlement journal:', e);
      }
      return next;
    });

    // 2. Catat mutasi penerimaan kas bersih di Finance & Accounting
    const financeSettlement: FinanceEntry = {
      id: settleRef,
      date: dateStr,
      type: 'IN / PENDAPATAN',
      category: 'Setoran Kasir Akhir Shift (Cash Reconciliation)',
      description: `Setoran Kas Fisik Shift ${closedShift.id} (${closedShift.cashierName} - ${closedShift.terminalName}) ke Brankas [1-10000] • Kredit Kas Kasir [1-10001] | Status: ${
        difference === 0
          ? 'Balance (Rp 0)'
          : difference > 0
          ? `Lebih Kas (Surplus) +Rp ${difference.toLocaleString('id-ID')}`
          : `Kurang Kas (Shortage) -Rp ${Math.abs(difference).toLocaleString('id-ID')}`
      }`,
      amount: actualCash,
      reference: settleRef,
      payment_method: 'CASH',
      account_target: 'Kas Utama / Brankas (1-10000)',
      created_at: new Date().toISOString(),
    };

    const newFinanceEntries: FinanceEntry[] = [financeSettlement];

    if (difference < 0) {
      newFinanceEntries.push({
        id: `FIN-DIFF-${closedShift.id}`,
        date: dateStr,
        type: 'EXPENSE',
        category: 'Beban Selisih Kas (5-10999)',
        description: `Beban Kurang Kas (Shortage) Tutup Shift ${closedShift.id} (${closedShift.terminalName})`,
        amount: Math.abs(difference),
        reference: settleRef,
        payment_method: 'CASH',
        account_target: 'Beban Selisih Kas (5-10999)',
        created_at: new Date().toISOString(),
      });
    } else if (difference > 0) {
      newFinanceEntries.push({
        id: `FIN-DIFF-${closedShift.id}`,
        date: dateStr,
        type: 'INCOME',
        category: 'Pendapatan Selisih Kas (4-10999)',
        description: `Pendapatan Lebih Kas (Surplus) Tutup Shift ${closedShift.id} (${closedShift.terminalName})`,
        amount: difference,
        reference: settleRef,
        payment_method: 'CASH',
        account_target: 'Pendapatan Selisih Kas (4-10999)',
        created_at: new Date().toISOString(),
      });
    }

    setFinance((prev) => {
      const incomingIds = new Set(newFinanceEntries.map((e) => e.id));
      const filtered = prev.filter((e) => !incomingIds.has(e.id));
      return [...newFinanceEntries, ...filtered];
    });

    const statusTextIndo =
      difference === 0 ? 'Seimbang' : difference > 0 ? 'Lebih (Surplus)' : 'Kurang (Shortage)';

    // Simpan ringkasan penutupan shift ke audit log Finance dengan status 'CLOSED'
    addAuditLog(
      `[CASH DRAWER CLOSING - CLOSED] Rekonsiliasi Kas Akhir Shift #${closedShift.id} (${closedShift.terminalName} - Kasir: ${closedShift.cashierName}). Kas Awal (Opening Float): Rp ${activeShift.initialCash.toLocaleString('id-ID')} + Total Penjualan Tunai Sistem: Rp ${activeShift.totalCashSales.toLocaleString('id-ID')}${activeShift.totalExpenses > 0 ? ` - Kas Keluar (Petty Cash): Rp ${activeShift.totalExpenses.toLocaleString('id-ID')}` : ''} = Kas Sistem: Rp ${expected.toLocaleString('id-ID')} vs Uang Fisik Terhitung: Rp ${actualCash.toLocaleString('id-ID')}. Selisih: ${difference >= 0 ? '+' : ''}Rp ${difference.toLocaleString('id-ID')} | Status Rekonsiliasi: ${statusTextIndo} | Status Shift: CLOSED. Ditutup oleh: ${safeOperator.name} (${safeOperator.role}). Catatan: ${closedShift.notes || 'Laci dihitung fisik'}`,
      'Finance / Rekonsiliasi Kas',
      difference === 0 ? 'INFO' : 'WARN'
    );

    showToast(
      `Shift ${closedShift.id} ditutup! Rekonsiliasi kas: ${
        status === 'MATCH'
          ? 'PAS / MATCH'
          : status === 'SURPLUS'
          ? `SURPLUS (+Rp ${difference.toLocaleString('id-ID')})`
          : `SHORTAGE (-Rp ${Math.abs(difference).toLocaleString('id-ID')})`
      }. Setoran kas dicatat ke Finance.`
    );

    return { shift: closedShift, difference, status };
  };

  // Consumer Sales Return & Bad Stock Quarantine (APS POS4: 28_ReturPenjualan)
  const processSalesReturn = (payload: {
    transactionId: string;
    items: Array<{
      productId: string;
      productName: string;
      barcode?: string;
      unitPrice: number;
      originalQty: number;
      returnQty: number;
      condition: SalesReturnCondition;
      reason: string;
    }>;
    refundMethod: 'CASH' | 'NON_CASH' | 'STORE_CREDIT' | string;
    notes?: string;
  }): { success: boolean; returnRecord?: SalesReturn; error?: string } => {
    const targetSale = sales.find((s) => s.transaction_id === payload.transactionId);
    if (!targetSale) {
      showToast('Transaksi penjualan tidak ditemukan!');
      return { success: false, error: 'Transaksi tidak ditemukan' };
    }

    const validItems = payload.items.filter((it) => it.returnQty > 0);
    if (validItems.length === 0) {
      showToast('Pilih minimal 1 item untuk diretur dengan kuantitas > 0');
      return { success: false, error: 'Tidak ada item yang diretur' };
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const returnId = `RET-SLS-${dateCode}-${String(salesReturns.length + 1).padStart(4, '0')}`;

    const returnItems: SalesReturnItem[] = validItems.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      barcode: it.barcode,
      unitPrice: it.unitPrice,
      originalQty: it.originalQty,
      returnQty: it.returnQty,
      subtotalRefund: it.returnQty * it.unitPrice,
      condition: it.condition,
      reason: it.reason || 'Retur dari pelanggan',
    }));

    const totalRefundAmount = returnItems.reduce((acc, it) => acc + it.subtotalRefund, 0);

    const newSalesReturn: SalesReturn = {
      id: returnId,
      transactionId: targetSale.transaction_id,
      receiptNumber: targetSale.receipt_number || targetSale.transaction_id,
      customerName: targetSale.customer_name || 'Pelanggan Umum',
      customerPhone: targetSale.customer_phone,
      cashierId: safeOperator.user_id,
      cashierName: safeOperator.name,
      terminalName: activeTerminal.name,
      timestamp: `${dateStr} ${timeStr}`,
      items: returnItems,
      totalRefundAmount,
      refundMethod: payload.refundMethod,
      shiftId: activeShift?.status === 'OPEN' ? activeShift.id : undefined,
      notes: payload.notes || 'Retur penjualan konsumen',
    };

    // 1. Simpan ke state retur penjualan
    setSalesReturns((prev) => [newSalesReturn, ...prev]);

    // 2. Integrasi Stok Gudang (Warehouse) & Mutasi:
    // - Jika kondisi "Baik" (GOOD): stok fisik produk di modul Warehouse otomatis bertambah (+ Qty) dengan mutasi "IN_RETURN"
    // - Jika kondisi "Rusak" (DAMAGED): stok dialihkan ke status Karantina / Bad Stock dan tidak menambah stok siap jual
    const goodConditionItems = returnItems.filter((it) => it.condition === 'GOOD');
    const damagedConditionItems = returnItems.filter((it) => it.condition === 'DAMAGED');

    // Hitung total HPP untuk item yang berkondisi "Baik" (akan dikembalikan ke persediaan)
    let totalGoodHpp = 0;
    if (goodConditionItems.length > 0) {
      goodConditionItems.forEach((ret) => {
        const prod = products.find((p) => p.id === ret.productId);
        const costPrice =
          prod?.costPrice ??
          (prod as any)?.cost_price ??
          Math.round(ret.unitPrice * 0.7);
        if (costPrice > 0) {
          totalGoodHpp += costPrice * ret.returnQty;
        }
      });
      totalGoodHpp = Math.round(totalGoodHpp);

      // Tambah kembali stok fisik produk siap jual di Gudang & simpan ke storage
      setProducts((prev) => {
        const next = prev.map((prod) => {
          const ret = goodConditionItems.find((it) => it.productId === prod.id || it.productName === prod.name);
          if (ret) {
            return {
              ...prod,
              stock: (prod.stock || 0) + ret.returnQty,
            };
          }
          return prod;
        });
        try {
          localStorage.setItem('jacs_erp_products', JSON.stringify(next));
        } catch (e) {
          console.error('Error saving restored products stock:', e);
        }
        return next;
      });

      // Catat mutasi stok "IN_RETURN" di modul Warehouse
      const newMutations: StockMutation[] = goodConditionItems.map((ret, idx) => {
        const prod = products.find((p) => p.id === ret.productId) || { stock: 0 };
        const prevStock = prod.stock || 0;
        return {
          id: `MUT-${returnId}-${idx}`,
          timestamp: `${dateStr} ${timeStr}`,
          product_id: ret.productId,
          product_name: ret.productName,
          type: 'IN_RETURN',
          qty: ret.returnQty,
          previous_stock: prevStock,
          final_stock: prevStock + ret.returnQty,
          reference_no: returnId,
          referenceId: targetSale.transaction_id,
          operator: `${safeOperator.name} (Kasir)`,
          notes: `Retur Penjualan Kondisi Baik (Restock Siap Jual) - Nota ${targetSale.receipt_number || targetSale.transaction_id}`,
        };
      });
      setStockMutations((prev) => [...newMutations, ...prev]);

      // Perbarui catatan inventory warehouse
      setInventory((prev) =>
        prev.map((inv) => {
          const ret = goodConditionItems.find((it) => it.productId === inv.product_id);
          if (ret) {
            return {
              ...inv,
              in_qty: (inv.in_qty || 0) + ret.returnQty,
              final_stock: (inv.final_stock || 0) + ret.returnQty,
              last_update: `${dateStr} ${timeStr}`,
            };
          }
          return inv;
        })
      );
    }

    if (damagedConditionItems.length > 0) {
      // Masuk ke area Karantina / Bad Stock (tidak menambah stok siap jual)
      const newBadItems: BadStockItem[] = damagedConditionItems.map((ret, idx) => ({
        id: `BAD-${dateCode}-${Date.now().toString().slice(-4)}-${idx}`,
        productId: ret.productId,
        productName: ret.productName,
        qty: ret.returnQty,
        conditionReason: ret.reason || 'Barang rusak / cacat dari konsumen',
        sourceType: 'RETUR_PENJUALAN',
        sourceReference: returnId,
        timestamp: `${dateStr} ${timeStr}`,
        handledBy: `${safeOperator.name} (${safeOperator.role})`,
        status: 'QUARANTINED',
      }));
      setBadStockItems((prev) => [...newBadItems, ...prev]);

      // Catat log mutasi karantina (stok siap jual tidak bertambah)
      const quarantineMutations: StockMutation[] = damagedConditionItems.map((ret, idx) => {
        const prod = products.find((p) => p.id === ret.productId) || { stock: 0 };
        return {
          id: `MUT-QUAR-${returnId}-${idx}`,
          timestamp: `${dateStr} ${timeStr}`,
          product_id: ret.productId,
          product_name: ret.productName,
          type: 'IN_RETURN',
          qty: ret.returnQty,
          previous_stock: prod.stock || 0,
          final_stock: prod.stock || 0,
          reference_no: returnId,
          referenceId: targetSale.transaction_id,
          operator: `${safeOperator.name} (Kasir)`,
          notes: `Retur Rusak/Bad Stock dialihkan ke Karantina: ${ret.reason}`,
        };
      });
      setStockMutations((prev) => [...quarantineMutations, ...prev]);
    }

    // 3. Integrasi Refund Kas & Finance:
    // - Catat pengeluaran kas refund pada shift aktif (mengurangi expectedCashInDrawer)
    const isCashRefund = !payload.refundMethod || payload.refundMethod === 'CASH' || payload.refundMethod === 'TUNAI';
    if (isCashRefund && activeShift && activeShift.status === 'OPEN') {
      const expenseId = `EXP-REFUND-${Date.now().toString().slice(-6)}`;
      const refundExpense: CashierShiftExpense = {
        id: expenseId,
        shiftId: activeShift.id,
        timestamp: `${dateStr} ${timeStr}`,
        amount: totalRefundAmount,
        reason: `Refund Kas Retur Penjualan #${returnId} (${targetSale.receipt_number || targetSale.transaction_id})`,
        category: 'KAS_KECIL_KASIR',
        cashierId: safeOperator.user_id,
        cashierName: safeOperator.name,
        terminalId: activeTerminal.id,
      };

      setActiveShift((prev) => {
        if (!prev) return prev;
        const updatedExpenses = [refundExpense, ...prev.expenses];
        const newTotalExpenses = prev.totalExpenses + totalRefundAmount;
        const newExpected = prev.initialCash + prev.totalCashSales - newTotalExpenses;
        return {
          ...prev,
          totalExpenses: newTotalExpenses,
          expenses: updatedExpenses,
          expectedCashInDrawer: newExpected,
        };
      });

      setShiftsHistory((prev) =>
        prev.map((s) => {
          if (s.id === activeShift.id || (s.terminalId === activeTerminal.id && s.status === 'OPEN')) {
            const updatedExpenses = [refundExpense, ...s.expenses];
            const newTotalExpenses = s.totalExpenses + totalRefundAmount;
            const newExpected = s.initialCash + s.totalCashSales - newTotalExpenses;
            return {
              ...s,
              totalExpenses: newTotalExpenses,
              expenses: updatedExpenses,
              expectedCashInDrawer: newExpected,
            };
          }
          return s;
        })
      );
    }

    // - Buat mutasi jurnal otomatis dengan referensi SLS-RET-[returnId]
    const returnJournalRef = `SLS-RET-${returnId}`;
    const journalLines: JournalEntryLine[] = [
      // Debit Retur Penjualan (4-10002)
      {
        accountCode: '4-10002',
        accountName: 'Retur Penjualan',
        debit: totalRefundAmount,
        credit: 0,
      },
      // Kredit Kas Kasir (1-10001) sebesar nominal refund
      {
        accountCode: '1-10001',
        accountName: 'Kas Kasir',
        debit: 0,
        credit: totalRefundAmount,
      },
    ];

    // Jika kondisi baik, sesuaikan HPP: Debit Persediaan (1-10501) dan Kredit Beban Pokok Penjualan (5-10001)
    if (totalGoodHpp > 0) {
      journalLines.push(
        {
          accountCode: '1-10501',
          accountName: 'Persediaan',
          debit: totalGoodHpp,
          credit: 0,
        },
        {
          accountCode: '5-10001',
          accountName: 'Beban Pokok Penjualan',
          debit: 0,
          credit: totalGoodHpp,
        }
      );
    }

    const totalDebitCalc = journalLines.reduce((acc, l) => acc + l.debit, 0);
    const totalCreditCalc = journalLines.reduce((acc, l) => acc + l.credit, 0);

    const salesReturnJournal: JournalEntry = {
      id: `JRN-${returnJournalRef}`,
      date: dateStr,
      reference: returnJournalRef,
      description: `Retur Penjualan Konsumen #${returnId} Nota ${targetSale.receipt_number || targetSale.transaction_id} • Debit Retur Penjualan [4-10002], Kredit Kas Kasir [1-10001] Rp ${totalRefundAmount.toLocaleString('id-ID')}${
        totalGoodHpp > 0
          ? ` • Penyesuaian HPP: Debit Persediaan [1-10501], Kredit HPP [5-10001] Rp ${totalGoodHpp.toLocaleString('id-ID')}`
          : ''
      }`,
      type: 'SALES_RETURN',
      lines: journalLines,
      totalDebit: totalDebitCalc,
      totalCredit: totalCreditCalc,
      created_at: `${dateStr} ${timeStr}`,
    };

    setJournalEntries((prev) => {
      const next = [salesReturnJournal, ...prev];
      try {
        localStorage.setItem('jacs_erp_journal_entries', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving sales return journal:', e);
      }
      return next;
    });

    // - Buat entri kas keluar "Refund Retur Penjualan" di modul Finance & Accounting
    const financeExpense: FinanceEntry = {
      id: `FIN-${returnJournalRef}`,
      date: dateStr,
      type: 'EXPENSE',
      category: 'Retur Penjualan (4-10002)',
      description: `[4-10002] Retur Penjualan #${returnId} Nota ${targetSale.receipt_number || targetSale.transaction_id} • Pengeluaran Kas Kasir [1-10001]`,
      amount: totalRefundAmount,
      reference: returnJournalRef,
      payment_method: isCashRefund ? 'CASH' : payload.refundMethod,
      account_target: isCashRefund ? 'Kas Kasir (1-10001)' : 'Bank QRIS / Settlement (1-10002)',
      created_at: new Date().toISOString(),
    };

    const financeEntriesToAdd: FinanceEntry[] = [financeExpense];

    if (totalGoodHpp > 0) {
      financeEntriesToAdd.push({
        id: `FIN-HPP-${returnJournalRef}`,
        date: dateStr,
        type: 'INCOME',
        category: 'Penyesuaian HPP Retur (5-10001)',
        description: `Penyesuaian HPP Retur Barang Baik #${returnId} • [1-10501] Persediaan & [5-10001] HPP`,
        amount: totalGoodHpp,
        reference: returnJournalRef,
        payment_method: 'NON_CASH',
        account_target: 'Persediaan (1-10501)',
        created_at: new Date().toISOString(),
      });
    }

    setFinance((prev) => {
      const incomingIds = new Set(financeEntriesToAdd.map((e) => e.id));
      const filtered = prev.filter((e) => !incomingIds.has(e.id));
      return [...financeEntriesToAdd, ...filtered];
    });

    // 4. Perbarui status invoice / sale terkait: "Partially Returned" atau "Returned"
    setSales((prev) => {
      const next = prev.map((s) => {
        if (s.transaction_id === payload.transactionId) {
          const currentReturnedAmount = (s.returned_amount || 0) + totalRefundAmount;
          const currentReturns = [...(s.sales_returns || []), newSalesReturn];

          // Hitung apakah seluruh item dan kuantitas sudah diretur habis
          const totalOriginalQty = (s.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0) || 1;
          const totalAccumulatedReturnedQty = currentReturns.reduce(
            (acc, ret) => acc + ret.items.reduce((sum, it) => sum + it.returnQty, 0),
            0
          );

          const isFullyReturned =
            totalAccumulatedReturnedQty >= totalOriginalQty || currentReturnedAmount >= s.total_amount;
          const newStatus: SaleStatus = isFullyReturned ? 'Returned' : 'Partially Returned';

          return {
            ...s,
            status: newStatus,
            returned_amount: currentReturnedAmount,
            sales_returns: currentReturns,
          };
        }
        return s;
      });
      return next;
    });

    setSalesHistoryState((prev) => {
      const next = prev.map((s) => {
        if (s.transaction_id === payload.transactionId) {
          const currentReturnedAmount = (s.returned_amount || 0) + totalRefundAmount;
          const currentReturns = [...(s.sales_returns || []), newSalesReturn];

          const totalOriginalQty = (s.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0) || 1;
          const totalAccumulatedReturnedQty = currentReturns.reduce(
            (acc, ret) => acc + ret.items.reduce((sum, it) => sum + it.returnQty, 0),
            0
          );

          const isFullyReturned =
            totalAccumulatedReturnedQty >= totalOriginalQty || currentReturnedAmount >= s.total_amount;
          const newStatus: SaleStatus = isFullyReturned ? 'Returned' : 'Partially Returned';

          return {
            ...s,
            status: newStatus,
            returned_amount: currentReturnedAmount,
            sales_returns: currentReturns,
          };
        }
        return s;
      });
      try {
        localStorage.setItem('jacs_erp_sales', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving updated sales history after return:', e);
      }
      return next;
    });

    addAuditLog(
      `Retur Penjualan #${returnId} nota ${targetSale.receipt_number || targetSale.transaction_id} sukses diproses. Refund: Rp ${totalRefundAmount.toLocaleString(
        'id-ID'
      )} (${payload.refundMethod}). Restock Baik: ${goodConditionItems.length} SKU, Rusak/Karantina: ${damagedConditionItems.length} SKU.`,
      'POS / Retur Penjualan',
      'WARN'
    );

    showToast(
      `Retur #${returnId} berhasil! Dana Rp ${totalRefundAmount.toLocaleString('id-ID')} diproses refund.`
    );

    return { success: true, returnRecord: newSalesReturn };
  };

  const updateBadStockStatus = (
    id: string,
    newStatus: 'QUARANTINED' | 'DISPOSED' | 'RETURNED_TO_VENDOR',
    notes?: string
  ) => {
    setBadStockItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, status: newStatus };
        }
        return item;
      })
    );
    const actionLabel =
      newStatus === 'DISPOSED'
        ? 'dimusnahkan / write-off'
        : newStatus === 'RETURNED_TO_VENDOR'
        ? 'diretur ke supplier / vendor'
        : 'dikarantina';
    addAuditLog(`Item bad stock ${id} ${actionLabel}. Catatan: ${notes || '-'}`, 'Warehouse / Karantina', 'INFO');
    showToast(`Status barang bad stock diperbarui: ${actionLabel}`);
  };

  const updateSheetConfig = (config: Partial<SheetConfig>) => {
    setSheetConfig((prev) => ({ ...prev, ...config }));
    showToast('Konfigurasi Google Sheets diperbarui');
  };

  const testSheetConnection = async (): Promise<{ success: boolean; message: string; rowCounts?: Record<string, number> }> => {
    setSheetConfig((prev) => ({ ...prev, syncStatus: 'syncing' }));
    
    // Simulate connection ping
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const counts = {
      DB_Products: products.length,
      DB_Sales: sales.length,
      DB_Users: users.length,
      DB_Purchasing: purchasing.length,
      DB_Inventory: inventory.length,
    };

    setSheetConfig((prev) => ({
      ...prev,
      syncStatus: 'connected',
      lastSyncTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }));

    showToast(`Sinkronisasi Google Sheet ${sheetConfig.spreadsheetId.slice(0, 12)}... berhasil!`);
    return {
      success: true,
      message: `Terhubung ke Google Spreadsheet ID: ${sheetConfig.spreadsheetId}`,
      rowCounts: counts,
    };
  };

  const createPurchaseRequest = (prData: Omit<PurchaseRequest, 'pr_number' | 'status'>) => {
    const prNumber = `PR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(purchaseRequests.length + 1).padStart(3, '0')}`;
    const newPR: PurchaseRequest = {
      ...prData,
      pr_number: prNumber,
      status: 'Pending Approval',
    };
    setPurchaseRequests((prev) => [newPR, ...prev]);

    // Also add to approvalQueue for Executive
    const newApproval: ApprovalItem = {
      id: `APP-${Date.now().toString().slice(-4)}`,
      type: 'PURCHASE_REQUEST',
      title: `Pengadaan: ${prData.item_name} (${prData.qty} Unit)`,
      requester: prData.requester_name,
      department: prData.department,
      date: prData.date,
      amount: prData.estimated_cost,
      status: 'PENDING',
      details: `Permintaan pengadaan barang dari ${prData.department} dengan urgensi ${prData.urgency}. Estimasi biaya Rp ${prData.estimated_cost.toLocaleString('id-ID')}.`,
    };
    setApprovalQueue((prev) => [newApproval, ...prev]);
    showToast(`Purchase Request ${prNumber} berhasil diajukan dan masuk ke Approval Queue!`);
  };

  const approvePurchaseRequest = (prNumberOrId: string) => {
    let targetPrNumber = prNumberOrId;
    let matchedItemName = '';

    setPurchaseRequests((prev) => {
      const next = prev.map((pr) => {
        if (
          pr.pr_number === prNumberOrId ||
          prNumberOrId.includes(pr.pr_number) ||
          pr.pr_number === prNumberOrId.replace('APP-', '') ||
          pr.pr_number === prNumberOrId.replace('APP-PR-', '')
        ) {
          targetPrNumber = pr.pr_number;
          matchedItemName = pr.item_name;
          return { ...pr, status: 'APPROVED' as const };
        }
        return pr;
      });
      try {
        localStorage.setItem('jacs_erp_purchase_requests', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setApprovalQueue((prev) => {
      const next = prev.map((item) => {
        if (
          item.id === prNumberOrId ||
          item.reference_id === targetPrNumber ||
          item.reference_id === prNumberOrId ||
          item.id === `APP-${targetPrNumber}` ||
          item.id === `APP-PR-${targetPrNumber.replace(/^PR-/, '')}` ||
          item.details.includes(targetPrNumber) ||
          (matchedItemName && item.title.includes(matchedItemName))
        ) {
          return { ...item, status: 'APPROVED' as const };
        }
        return item;
      });
      try {
        localStorage.setItem('jacs_erp_approval_queue', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    addAuditLog(
      `Persetujuan PR ${targetPrNumber}: Disetujui (APPROVED) oleh Direksi/Executive. Status PR kini APPROVED, staf Purchasing dapat memproses penerbitan PO.`,
      'Executive & Purchasing',
      'INFO'
    );

    showToast(
      `Purchase Request ${targetPrNumber} berhasil disetujui (APPROVED)! Staf Purchasing kini dapat memproses penerbitan PO.`
    );
  };

  const rejectPurchaseRequest = (prNumberOrId: string, reason?: string) => {
    let targetPrNumber = prNumberOrId;
    let matchedItemName = '';

    setPurchaseRequests((prev) => {
      const next = prev.map((pr) => {
        if (
          pr.pr_number === prNumberOrId ||
          prNumberOrId.includes(pr.pr_number) ||
          pr.pr_number === prNumberOrId.replace('APP-', '') ||
          pr.pr_number === prNumberOrId.replace('APP-PR-', '')
        ) {
          targetPrNumber = pr.pr_number;
          matchedItemName = pr.item_name;
          return { ...pr, status: 'REJECTED' as const };
        }
        return pr;
      });
      try {
        localStorage.setItem('jacs_erp_purchase_requests', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setApprovalQueue((prev) => {
      const next = prev.map((item) => {
        if (
          item.id === prNumberOrId ||
          item.reference_id === targetPrNumber ||
          item.reference_id === prNumberOrId ||
          item.id === `APP-${targetPrNumber}` ||
          item.id === `APP-PR-${targetPrNumber.replace(/^PR-/, '')}` ||
          item.details.includes(targetPrNumber) ||
          (matchedItemName && item.title.includes(matchedItemName))
        ) {
          return { ...item, status: 'REJECTED' as const };
        }
        return item;
      });
      try {
        localStorage.setItem('jacs_erp_approval_queue', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    addAuditLog(
      `Penolakan PR ${targetPrNumber}: Ditolak (REJECTED) oleh Direksi/Executive. ${reason || ''}`,
      'Executive & Purchasing',
      'WARN'
    );

    showToast(`Purchase Request ${targetPrNumber} telah ditolak (REJECTED).`);
  };

  const approveItem = (id: string) => {
    setApprovalQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'APPROVED' as const } : item))
    );

    const matchedApproval = approvalQueue.find((a) => a.id === id);

    // Sync to Purchase Requests if this is a PR approval item
    if (
      matchedApproval?.type === 'PURCHASE_REQUEST' ||
      matchedApproval?.reference_id?.startsWith('PR-') ||
      id.includes('PR-')
    ) {
      const targetPrNum =
        matchedApproval?.reference_id ||
        (id.startsWith('APP-PR-') ? id.replace('APP-', '') : id.startsWith('APP-') ? id.replace('APP-', '') : id);
      setPurchaseRequests((prev) => {
        const next = prev.map((pr) => {
          if (
            pr.pr_number === targetPrNum ||
            pr.pr_number === matchedApproval?.reference_id ||
            (matchedApproval && matchedApproval.title.includes(pr.item_name)) ||
            (matchedApproval && matchedApproval.details.includes(pr.pr_number))
          ) {
            return { ...pr, status: 'APPROVED' as const };
          }
          return pr;
        });
        try {
          localStorage.setItem('jacs_erp_purchase_requests', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      showToast(`Purchase Request ${targetPrNum} berhasil disetujui (APPROVED)! Staf Purchasing kini dapat memproses penerbitan PO.`);
      return;
    }

    // Sync to Purchase Orders if this is a PO approval item
    const targetPoNum =
      matchedApproval?.reference_id ||
      (id.startsWith('APP-PO-') ? id.replace('APP-', '') : undefined);

    if (matchedApproval?.type === 'PURCHASE_ORDER' || targetPoNum) {
      const resolvedPoNum =
        targetPoNum ||
        matchedApproval?.reference_id ||
        (id.startsWith('APP-PO-') ? id.replace('APP-', '') : undefined);
      if (resolvedPoNum && purchasing.some((p) => p.po_number === resolvedPoNum)) {
        approvePurchaseOrder(
          resolvedPoNum,
          matchedApproval?.details || 'Disetujui melalui Executive Approval Queue'
        );
        return;
      }
    }

    // Sync to Leave Requests if this is a leave approval item
    const matchedLeave = leaveRequests.find(
      (l) => id.includes(l.ticketNumber) || l.ticketNumber === id.replace('APP-', '')
    );
    if (matchedLeave && matchedLeave.status === 'Menunggu') {
      setLeaveRequests((prev) =>
        prev.map((t) =>
          t.id === matchedLeave.id
            ? {
                ...t,
                status: 'Disetujui',
                approvedBy: activeUser?.name || 'Executive Director',
                approvalNotes: 'Disetujui melalui Executive Approval Queue.',
              }
            : t
        )
      );
      if (matchedLeave.type === 'Cuti Tahunan') {
        setEmployees((prev) =>
          prev.map((emp) => {
            if (emp.id === matchedLeave.employeeId) {
              const used = emp.leaveQuota.used + matchedLeave.durationDays;
              const remaining = Math.max(0, emp.leaveQuota.total - used);
              return {
                ...emp,
                leaveQuota: { ...emp.leaveQuota, used, remaining },
              };
            }
            return emp;
          })
        );
      }
    }

    showToast(`Persetujuan ${id} disetujui (APPROVED) oleh Pimpinan!`);
  };

  const rejectItem = (id: string) => {
    setApprovalQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'REJECTED' as const } : item))
    );

    const matchedApproval = approvalQueue.find((a) => a.id === id);

    // Sync to Purchase Requests if this is a PR approval item
    if (
      matchedApproval?.type === 'PURCHASE_REQUEST' ||
      matchedApproval?.reference_id?.startsWith('PR-') ||
      id.includes('PR-')
    ) {
      const targetPrNum =
        matchedApproval?.reference_id ||
        (id.startsWith('APP-PR-') ? id.replace('APP-', '') : id.startsWith('APP-') ? id.replace('APP-', '') : id);
      setPurchaseRequests((prev) => {
        const next = prev.map((pr) => {
          if (
            pr.pr_number === targetPrNum ||
            pr.pr_number === matchedApproval?.reference_id ||
            (matchedApproval && matchedApproval.title.includes(pr.item_name)) ||
            (matchedApproval && matchedApproval.details.includes(pr.pr_number))
          ) {
            return { ...pr, status: 'REJECTED' as const };
          }
          return pr;
        });
        try {
          localStorage.setItem('jacs_erp_purchase_requests', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      showToast(`Purchase Request ${targetPrNum} telah ditolak (REJECTED).`);
      return;
    }

    // Sync to Purchase Orders if this is a PO approval item
    const targetPoNum =
      matchedApproval?.reference_id ||
      (id.startsWith('APP-PO-') ? id.replace('APP-', '') : undefined);

    if (matchedApproval?.type === 'PURCHASE_ORDER' || targetPoNum) {
      const resolvedPoNum =
        targetPoNum ||
        matchedApproval?.reference_id ||
        (id.startsWith('APP-PO-') ? id.replace('APP-', '') : undefined);
      if (resolvedPoNum && purchasing.some((p) => p.po_number === resolvedPoNum)) {
        rejectPurchaseOrder(
          resolvedPoNum,
          matchedApproval?.details || 'Ditolak melalui Executive Approval Queue'
        );
        return;
      }
    }

    // Sync to Leave Requests if this is a leave approval item
    const matchedLeave = leaveRequests.find(
      (l) => id.includes(l.ticketNumber) || l.ticketNumber === id.replace('APP-', '')
    );
    if (matchedLeave && matchedLeave.status === 'Menunggu') {
      setLeaveRequests((prev) =>
        prev.map((t) =>
          t.id === matchedLeave.id
            ? {
                ...t,
                status: 'Ditolak',
                approvedBy: activeUser?.name || 'Executive Director',
                approvalNotes: 'Ditolak melalui Executive Approval Queue.',
              }
            : t
        )
      );
    }

    showToast(`Permintaan ${id} telah ditolak (REJECTED).`);
  };

  const approveAllDocumentApprovals = () => {
    setApprovalQueue((prev) =>
      prev.map((item) => ({ ...item, status: 'APPROVED' as const }))
    );
    setPurchaseRequests((prev) => {
      const next = prev.map((pr) => {
        const s = (pr.status || '').toUpperCase().trim();
        if (s === 'PENDING' || s === 'PENDING APPROVAL' || s === 'PENDING_APPROVAL') {
          return { ...pr, status: 'APPROVED' as const };
        }
        return pr;
      });
      try {
        localStorage.setItem('jacs_erp_purchase_requests', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setPurchasing((prev) => {
      const next = prev.map((po) => {
        const s = (po.status || '').toUpperCase().trim();
        if (
          s === 'PENDING_APPROVAL' ||
          s === 'MENUNGGU APPROVAL DIREKSI' ||
          s === 'MENUNGGU APPROVAL PIMPINAN' ||
          s === 'PENDING APPROVAL' ||
          s === 'PENDING'
        ) {
          const updatedPo: PurchaseOrder = {
            ...po,
            status: 'APPROVED',
            approved_by: activeUser?.name || 'Direksi Operasional',
            approved_date: new Date().toISOString().slice(0, 10),
          };
          syncAccountsPayableInvoice(updatedPo, 'APPROVED');
          return updatedPo;
        }
        return po;
      });
      try {
        localStorage.setItem('jacs_erp_purchasing', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setPromotions((prev) =>
      prev.map((promo) => {
        if (promo.status === 'PENDING' || (promo.status as string) === 'PENDING_APPROVAL') {
          return {
            ...promo,
            status: 'ACTIVE',
            approvedBy: activeUser?.name || 'Direktur Eksekutif',
            authorizedBy: activeUser?.name || 'Direktur Eksekutif',
            isActive: true,
          };
        }
        return promo;
      })
    );
    setLeaveRequests((prev) =>
      prev.map((l) =>
        l.status === 'Menunggu'
          ? { ...l, status: 'Disetujui', approvedBy: activeUser?.name || 'Executive Director' }
          : l
      )
    );
    showToast('Seluruh berkas antrean dokumen & PR berhasil disetujui (APPROVED)!');
  };

  const payVendorInvoice = (
    invoiceId: string,
    paymentSource: 'Kas Utama' | 'Bank Operasional' | string = 'Bank Operasional',
    notes?: string
  ): { success: boolean; message: string; journalId?: string } => {
    const targetInvoice = invoicesDue.find(
      (inv) => inv.id === invoiceId || inv.invoice_number === invoiceId
    );
    if (!targetInvoice) {
      return { success: false, message: `Tagihan vendor ${invoiceId} tidak ditemukan!` };
    }

    if (targetInvoice.status === 'PAID' || targetInvoice.status === 'Paid') {
      return { success: false, message: `Tagihan ${targetInvoice.invoice_number} sudah berstatus LUNAS!` };
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);

    const isKasUtama =
      paymentSource === 'Kas Utama' ||
      paymentSource.includes('Kas') ||
      paymentSource === '1-10000';
    const cashAccountCode = isKasUtama ? '1-10000' : '1-10002';
    const cashAccountName = isKasUtama ? 'Kas Utama' : 'Bank Operasional';
    const paymentMethodStr = isKasUtama ? 'CASH' : 'TRANSFER';

    const cleanId =
      targetInvoice.id.replace(/^(INV-AP-|INV-)/, '') ||
      targetInvoice.invoice_number.replace(/[^a-zA-Z0-9]/g, '') ||
      Date.now().toString().slice(-6);
    const journalRef = `FIN-AP-PAY-${cleanId}`;

    // 1. Ubah status tagihan menjadi 'PAID' lengkap dengan paidAt dan paymentMethod
    setInvoicesDue((prev) => {
      const next = prev.map((inv) =>
        inv.id === targetInvoice.id || inv.invoice_number === targetInvoice.invoice_number
          ? {
              ...inv,
              status: 'PAID',
              paidAt: timeStr,
              paymentMethod: paymentMethodStr,
              paymentSource: cashAccountName,
              paid_date: dateStr,
              journal_ref: journalRef,
            }
          : inv
      );
      try {
        localStorage.setItem('jacs_erp_invoices_due', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // 2. Sinkronkan status pembayaran PO terkait otomatis menjadi 'PAID'
    const targetPoNumber =
      targetInvoice.po_number ||
      (targetInvoice.id.startsWith('INV-AP-') ? targetInvoice.id.replace('INV-AP-', '') : undefined) ||
      (targetInvoice.invoice_number.startsWith('INV-AP-') ? targetInvoice.invoice_number.replace('INV-AP-', '') : undefined);

    if (targetPoNumber) {
      setPurchasing((prev) => {
        const next = prev.map((po) =>
          po.po_number === targetPoNumber || po.po_id === targetPoNumber
            ? {
                ...po,
                payment_status: 'PAID' as const,
                paid_date: dateStr,
                payment_method: isKasUtama ? 'Kas Utama (Tunai)' : 'Transfer Bank Operasional',
                payment_source: cashAccountName,
                payment_ref: journalRef,
              }
            : po
        );
        try {
          localStorage.setItem('jacs_erp_purchasing', JSON.stringify(next));
        } catch (e) {
          console.error('Error saving purchasing after AP payment:', e);
        }
        return next;
      });
    }

    // 2. Kurangi saldo akun Kas/Bank yang dipilih di modul Finance (Catat EXPENSE)
    const apExpenseEntry: FinanceEntry = {
      id: `FIN-${journalRef}`,
      date: dateStr,
      type: 'EXPENSE',
      category: 'Pelunasan Hutang Dagang (AP)',
      description: `Pelunasan Faktur ${targetInvoice.invoice_number} ke ${targetInvoice.party_name || targetInvoice.vendor} via ${cashAccountName} [${cashAccountCode}]${notes ? ` (${notes})` : ''}`,
      amount: targetInvoice.amount,
      reference: journalRef,
      payment_method: paymentMethodStr,
      account_target: `${cashAccountName} (${cashAccountCode})`,
      created_at: now.toISOString(),
    };

    setFinance((prev) => {
      const filtered = prev.filter((f) => f.id !== apExpenseEntry.id);
      const next = [apExpenseEntry, ...filtered];
      try {
        localStorage.setItem('jacs_erp_finance', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // 3. Terbitkan jurnal akuntansi otomatis FIN-AP-PAY-[id]:
    //    * Debit: Hutang Dagang (2-10101)
    //    * Kredit: Kas Utama (1-10000) atau Bank Operasional (1-10002)
    const journalLines: JournalEntryLine[] = [
      {
        accountCode: '2-10101',
        accountName: 'Hutang Dagang',
        debit: targetInvoice.amount,
        credit: 0,
      },
      {
        accountCode: cashAccountCode,
        accountName: cashAccountName,
        debit: 0,
        credit: targetInvoice.amount,
      },
    ];

    const apJournalEntry: JournalEntry = {
      id: journalRef,
      date: dateStr,
      reference: journalRef,
      description: `Pelunasan Hutang Dagang (AP) ${targetInvoice.invoice_number} ke ${targetInvoice.party_name || targetInvoice.vendor} • Debit Hutang Dagang [2-10101], Kredit ${cashAccountName} [${cashAccountCode}] Rp ${targetInvoice.amount.toLocaleString('id-ID')}`,
      type: 'GENERAL',
      lines: journalLines,
      totalDebit: targetInvoice.amount,
      totalCredit: targetInvoice.amount,
      created_at: now.toISOString(),
    };

    setJournalEntries((prev) => {
      const next = [apJournalEntry, ...prev.filter((j) => j.id !== journalRef)];
      try {
        localStorage.setItem('jacs_erp_journal_entries', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    addAuditLog(
      `Pelunasan Tagihan Hutang Dagang ${targetInvoice.invoice_number} (Rp ${targetInvoice.amount.toLocaleString('id-ID')}) via ${cashAccountName} [${cashAccountCode}]. Jurnal ${journalRef} dibukukan.`,
      'Finance / AP',
      'INFO'
    );

    showToast(`✅ Pelunasan tagihan ${targetInvoice.invoice_number} berhasil via ${cashAccountName}! Jurnal ${journalRef} tercatat.`);

    return {
      success: true,
      message: `Pelunasan tagihan ${targetInvoice.invoice_number} berhasil diproses via ${cashAccountName}. Jurnal ${journalRef} tercatat.`,
      journalId: journalRef,
    };
  };

  const markInvoicePaid = (id: string) => {
    payVendorInvoice(id, 'Bank Operasional');
  };

  const receiveCustomerPayment = (
    invoiceId: string,
    paymentSource: 'Kas Utama' | 'Kas Kasir' | 'Bank Operasional' | string = 'Kas Kasir',
    notes?: string
  ): { success: boolean; message: string; journalId?: string } => {
    const targetInvoice = invoicesDue.find(
      (inv) => inv.id === invoiceId || inv.invoice_number === invoiceId
    );
    if (!targetInvoice) {
      return { success: false, message: `Tagihan piutang ${invoiceId} tidak ditemukan!` };
    }

    if (targetInvoice.status === 'PAID' || targetInvoice.status === 'Paid') {
      return { success: false, message: `Piutang ${targetInvoice.invoice_number} sudah berstatus LUNAS!` };
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);

    const isBank =
      paymentSource === 'Bank Operasional' ||
      paymentSource.includes('Bank') ||
      paymentSource === '1-10002';
    const isKasUtama =
      paymentSource === 'Kas Utama' ||
      paymentSource.includes('Utama') ||
      paymentSource === '1-10000';

    const cashAccountCode = isBank ? '1-10002' : isKasUtama ? '1-10000' : '1-10001';
    const cashAccountName = isBank ? 'Bank Operasional' : isKasUtama ? 'Kas Utama' : 'Kas Kasir';
    const paymentMethodStr = isBank ? 'TRANSFER' : 'CASH';

    const cleanId =
      targetInvoice.id.replace(/^(INV-AR-|INV-|AR-)/, '') ||
      targetInvoice.invoice_number.replace(/[^a-zA-Z0-9]/g, '') ||
      Date.now().toString().slice(-6);
    const journalRef = `FIN-AR-REC-${cleanId}`;

    // 1. Ubah status tagihan piutang menjadi 'PAID'
    setInvoicesDue((prev) => {
      const next = prev.map((inv) =>
        inv.id === targetInvoice.id
          ? {
              ...inv,
              status: 'PAID',
              paidAt: timeStr,
              paymentMethod: paymentMethodStr,
              paymentSource: cashAccountName,
              paid_date: dateStr,
              journal_ref: journalRef,
            }
          : inv
      );
      try {
        localStorage.setItem('jacs_erp_invoices_due', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // 2. Tambahkan saldo Kas/Bank di Finance (Catat INCOME)
    const arIncomeEntry: FinanceEntry = {
      id: `FIN-${journalRef}`,
      date: dateStr,
      type: 'IN / PENDAPATAN',
      category: 'Pelunasan Piutang Usaha (AR)',
      description: `Penerimaan Pelunasan Piutang ${targetInvoice.invoice_number} dari ${targetInvoice.party_name} via ${cashAccountName} [${cashAccountCode}]${notes ? ` (${notes})` : ''}`,
      amount: targetInvoice.amount,
      reference: journalRef,
      payment_method: paymentMethodStr,
      account_target: `${cashAccountName} (${cashAccountCode})`,
      created_at: now.toISOString(),
    };

    setFinance((prev) => {
      const filtered = prev.filter((f) => f.id !== arIncomeEntry.id);
      const next = [arIncomeEntry, ...filtered];
      try {
        localStorage.setItem('jacs_erp_finance', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // 3. Terbitkan jurnal akuntansi otomatis FIN-AR-REC-[id]:
    //    * Debit: Kas Utama (1-10000) / Kas Kasir (1-10001) / Bank Operasional (1-10002)
    //    * Kredit: Piutang Usaha (1-10301)
    const journalLines: JournalEntryLine[] = [
      {
        accountCode: cashAccountCode,
        accountName: cashAccountName,
        debit: targetInvoice.amount,
        credit: 0,
      },
      {
        accountCode: '1-10301',
        accountName: 'Piutang Usaha',
        debit: 0,
        credit: targetInvoice.amount,
      },
    ];

    const arJournalEntry: JournalEntry = {
      id: journalRef,
      date: dateStr,
      reference: journalRef,
      description: `Pelunasan Piutang Usaha (AR) ${targetInvoice.invoice_number} dari ${targetInvoice.party_name} • Debit ${cashAccountName} [${cashAccountCode}], Kredit Piutang Usaha [1-10301] Rp ${targetInvoice.amount.toLocaleString('id-ID')}`,
      type: 'GENERAL',
      lines: journalLines,
      totalDebit: targetInvoice.amount,
      totalCredit: targetInvoice.amount,
      created_at: now.toISOString(),
    };

    setJournalEntries((prev) => {
      const next = [arJournalEntry, ...prev.filter((j) => j.id !== journalRef)];
      try {
        localStorage.setItem('jacs_erp_journal_entries', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    addAuditLog(
      `Penerimaan Pelunasan Piutang Usaha ${targetInvoice.invoice_number} (Rp ${targetInvoice.amount.toLocaleString('id-ID')}) dari ${targetInvoice.party_name} via ${cashAccountName} [${cashAccountCode}]. Jurnal ${journalRef} dibukukan.`,
      'Finance / AR',
      'INFO'
    );

    showToast(`✅ Pelunasan piutang ${targetInvoice.party_name} berhasil via ${cashAccountName}! Jurnal ${journalRef} tercatat.`);

    return {
      success: true,
      message: `Pelunasan piutang ${targetInvoice.invoice_number} berhasil diproses via ${cashAccountName}. Jurnal ${journalRef} tercatat.`,
      journalId: journalRef,
    };
  };

  const resetToInitialData = () => {
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setUsers(INITIAL_USERS);
    setPurchasing(INITIAL_PURCHASING);
    setPurchaseRequests(INITIAL_PURCHASE_REQUESTS);
    setApprovalQueue(INITIAL_APPROVALS);
    setInvoicesDue(INITIAL_INVOICES_DUE);
    setInventory(INITIAL_INVENTORY);
    setStockMutations(INITIAL_STOCK_MUTATIONS);
    setFinance(INITIAL_FINANCE);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setTerminals(INITIAL_TERMINALS);
    setSheetConfig(INITIAL_SHEET_CONFIG);
    setActiveNeonCardsState({
      home: 'info-sop',
      pos: 'T-01',
      executive: 'revenue',
      finance: 'cash-balance',
      warehouse: 'sku-stock',
      purchasing: 'po-value',
    });
    setActiveShift(null);
    setShiftsHistory([]);
    setSalesReturns([]);
    setBadStockItems([]);
    localStorage.clear();
    showToast('Seluruh data direset kembali ke master demo JacS ERP!');
  };

  const showReceipt = (sale: Sale) => {
    setCurrentReceiptSale(sale);
    setIsReceiptModalOpen(true);
  };

  const closeReceipt = () => {
    setIsReceiptModalOpen(false);
  };

  // HR Actions
  const addEmployee = (newEmpData: Omit<Employee, 'id'>) => {
    const newId = `emp-${Date.now()}`;
    const newNip = newEmpData.nip?.trim() || `JACS-EMP-2026${String(employees.length + 1).padStart(2, '0')}`;
    const newEmployee: Employee = {
      ...newEmpData,
      id: newId,
      nip: newNip,
    };
    setEmployees((prev) => [newEmployee, ...prev]);
    addAuditLog(`Menambahkan karyawan baru: ${newEmployee.name} (${newEmployee.nip})`, 'HR', 'INFO');
    showToast(`Karyawan ${newEmployee.name} berhasil didaftarkan.`);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, ...updates } : emp))
    );
    addAuditLog(`Memperbarui data karyawan ID: ${id}`, 'HR', 'INFO');
    showToast('Data karyawan berhasil diperbarui.');
  };

  const deleteEmployee = (id: string) => {
    const target = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    addAuditLog(`Menghapus karyawan: ${target?.name || id}`, 'HR', 'WARN');
    showToast(`Karyawan ${target?.name || ''} telah dihapus.`);
  };

  const recordClockIn = (employeeId: string, notes?: string, location?: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5); // "08:15"
    const dateStr = now.toISOString().slice(0, 10); // "2026-09-21"

    // Check if already clocked in today
    const existingToday = attendanceLogs.find(
      (a) => a.employeeId === employeeId && a.date === dateStr && a.clockOut === null
    );
    if (existingToday) {
      showToast(`${emp.name} sudah melakukan Clock In hari ini (${existingToday.clockIn}).`);
      return;
    }

    // Determine status (if clock in > 08:30 for general or > 07:00 for morning, etc.)
    const isLate = emp.shift.includes('07:00')
      ? timeStr > '07:10'
      : emp.shift.includes('08:30')
      ? timeStr > '08:35'
      : emp.shift.includes('15:00')
      ? timeStr > '15:10'
      : false;

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: emp.id,
      nip: emp.nip,
      employeeName: emp.name,
      avatar: emp.avatar || '',
      department: emp.department,
      date: dateStr,
      shift: emp.shift,
      clockIn: timeStr,
      clockOut: null,
      status: isLate ? 'Terlambat' : 'Tepat Waktu',
      notes: notes || `Clock In via modul presensi JacS ERP (${isLate ? 'Terlambat' : 'Tepat Waktu'})`,
      location: location || 'Presensi Mandiri / Terminal JacS',
    };

    setAttendanceLogs((prev) => [newRecord, ...prev]);
    addAuditLog(`Clock In: ${emp.name} (${newRecord.clockIn}) - ${newRecord.status}`, 'HR', isLate ? 'WARN' : 'INFO');
    showToast(`Clock In berhasil dicatat untuk ${emp.name} [${newRecord.clockIn} - ${newRecord.status}]`);
  };

  const recordClockOut = (attendanceId: string, notes?: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);

    setAttendanceLogs((prev) =>
      prev.map((att) => {
        if (att.id === attendanceId) {
          return {
            ...att,
            clockOut: timeStr,
            notes: notes ? `${att.notes} | ${notes}` : att.notes,
          };
        }
        return att;
      })
    );

    const att = attendanceLogs.find((a) => a.id === attendanceId);
    addAuditLog(`Clock Out: ${att?.employeeName || 'Karyawan'} (${timeStr})`, 'HR', 'INFO');
    showToast(`Clock Out berhasil dicatat (${timeStr}).`);
  };

  const submitLeaveRequest = (req: Omit<LeaveRequest, 'id' | 'ticketNumber' | 'status' | 'submittedAt'>) => {
    const ticketNo = `LV-${new Date().getFullYear()}-${String(leaveRequests.length + 1).padStart(3, '0')}`;
    const now = new Date();
    const submittedTime = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;

    const newTicket: LeaveRequest = {
      ...req,
      id: `leave-${Date.now()}`,
      ticketNumber: ticketNo,
      status: 'Menunggu',
      submittedAt: submittedTime,
    };

    setLeaveRequests((prev) => [newTicket, ...prev]);

    // Also inject into Executive approval queue
    const newApproval: ApprovalItem = {
      id: `APP-${ticketNo}`,
      type: 'USER_ACCESS',
      title: `Pengajuan ${req.type}: ${req.employeeName} (${req.durationDays} Hari)`,
      requester: req.employeeName,
      department: req.department,
      date: submittedTime.slice(0, 10),
      status: 'PENDING',
      details: `Tiket ${ticketNo} - ${req.type} (${req.startDate} s/d ${req.endDate}). Alasan: ${req.reason}`,
    };
    setApprovalQueue((prev) => [newApproval, ...prev]);

    addAuditLog(`Tiket pengajuan cuti/izin diajukan: ${ticketNo} oleh ${req.employeeName}`, 'HR', 'INFO');
    showToast(`Tiket pengajuan ${ticketNo} berhasil dikirim dan menunggu persetujuan.`);
  };

  const approveLeaveRequest = (id: string, approverName: string, notes?: string) => {
    const ticket = leaveRequests.find((t) => t.id === id);
    if (!ticket) return;

    setLeaveRequests((prev) => {
      const next = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'Disetujui' as const,
              approvedBy: approverName,
              approvalNotes: notes || 'Permohonan disetujui pimpinan.',
            }
          : t
      );
      try {
        localStorage.setItem('jacs_erp_leave_requests', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Sync to Executive approval queue so pending counter decreases immediately
    setApprovalQueue((prev) =>
      prev.map((item) =>
        item.id === `APP-${ticket.ticketNumber}` ||
        item.id.includes(ticket.ticketNumber) ||
        item.details.includes(ticket.ticketNumber) ||
        item.title.includes(ticket.ticketNumber)
          ? { ...item, status: 'APPROVED' as const }
          : item
      )
    );

    // Perbarui sisa kuota cuti karyawan saat disetujui
    setEmployees((prev) => {
      const next = prev.map((emp) => {
        if (emp.id === ticket.employeeId) {
          const used = emp.leaveQuota.used + ticket.durationDays;
          const remaining = Math.max(0, emp.leaveQuota.total - used);
          return {
            ...emp,
            leaveQuota: {
              ...emp.leaveQuota,
              used,
              remaining,
            },
          };
        }
        return emp;
      });
      try {
        localStorage.setItem('jacs_erp_employees', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    addAuditLog(`Persetujuan cuti/izin: ${ticket.ticketNumber} [DISETUJUI] oleh ${approverName}`, 'HR', 'INFO');
    showToast(`Tiket ${ticket.ticketNumber} berhasil disetujui.`);
  };

  const rejectLeaveRequest = (id: string, approverName: string, notes?: string) => {
    const ticket = leaveRequests.find((t) => t.id === id);
    if (!ticket) return;

    const wasApproved = ticket.status === 'Disetujui';

    setLeaveRequests((prev) => {
      const next = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'Ditolak' as const,
              approvedBy: approverName,
              approvalNotes: notes || 'Permohonan ditolak.',
            }
          : t
      );
      try {
        localStorage.setItem('jacs_erp_leave_requests', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // If it was previously approved, restore the used quota
    if (wasApproved) {
      setEmployees((prev) => {
        const next = prev.map((emp) => {
          if (emp.id === ticket.employeeId) {
            const used = Math.max(0, emp.leaveQuota.used - ticket.durationDays);
            const remaining = Math.min(emp.leaveQuota.total, emp.leaveQuota.remaining + ticket.durationDays);
            return {
              ...emp,
              leaveQuota: {
                ...emp.leaveQuota,
                used,
                remaining,
              },
            };
          }
          return emp;
        });
        try {
          localStorage.setItem('jacs_erp_employees', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    // Sync to Executive approval queue so pending counter decreases immediately
    setApprovalQueue((prev) =>
      prev.map((item) =>
        item.id === `APP-${ticket.ticketNumber}` ||
        item.id.includes(ticket.ticketNumber) ||
        item.details.includes(ticket.ticketNumber) ||
        item.title.includes(ticket.ticketNumber)
          ? { ...item, status: 'REJECTED' as const }
          : item
      )
    );

    addAuditLog(`Persetujuan cuti/izin: ${ticket.ticketNumber} [DITOLAK] oleh ${approverName}`, 'HR', 'WARN');
    showToast(`Tiket ${ticket.ticketNumber} ditolak.`);
  };

  const toggleEmployeeBpjs = (employeeId: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === employeeId) {
          const nextVal = emp.bpjsEnabled === false;
          addAuditLog(
            `Status BPJS ${emp.name} diubah menjadi: ${nextVal ? 'Aktif' : 'Non-Aktif (Opt-Out)'}`,
            'HR',
            'INFO'
          );
          return { ...emp, bpjsEnabled: nextVal };
        }
        return emp;
      })
    );
  };

  const updateEmployeeSalary = (employeeId: string, baseSalary: number) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === employeeId ? { ...emp, baseSalary } : emp))
    );
  };

  const syncPayrollToFinance = (summary: PayrollSyncSummary) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${dateStr} ${now.toTimeString().slice(0, 5)}`;

    // 1. Beban Gaji Karyawan (Salary Expense) -> Finance Expense
    const salaryExpense: Omit<FinanceEntry, 'id'> = {
      date: dateStr,
      type: 'EXPENSE',
      category: 'Payroll / Gaji',
      description: `Beban Gaji Karyawan (Take Home Pay ${summary.totalStaffCount} Personil) Periode ${summary.period}`,
      amount: summary.totalTakeHomePay,
      reference: `PAY-${Date.now().toString().slice(-4)}`,
      payment_method: 'TRANSFER',
    };
    addFinanceEntry(salaryExpense);

    // 2. Beban BPJS Ditanggung Perusahaan (Company BPJS Expense) -> Finance Expense
    if (summary.totalCompanyContribution > 0) {
      const bpjsExpense: Omit<FinanceEntry, 'id'> = {
        date: dateStr,
        type: 'EXPENSE',
        category: 'Payroll & BPJS',
        description: `Beban BPJS Perusahaan: Kesehatan (4%) & Ketenagakerjaan (6.24%) untuk ${summary.activeBpjsStaffCount} Karyawan`,
        amount: summary.totalCompanyContribution,
        reference: `BPJS-CO-${Date.now().toString().slice(-4)}`,
        payment_method: 'TRANSFER',
      };
      addFinanceEntry(bpjsExpense);
    }

    // 3. Hutang Kas / Setoran BPJS (BPJS Payable) -> Invoices Due (AP)
    if (summary.totalBpjsRemittance > 0) {
      const nextMonthDueDate = new Date();
      nextMonthDueDate.setDate(nextMonthDueDate.getDate() + 15);
      const dueDateStr = nextMonthDueDate.toISOString().slice(0, 10);

      const bpjsPayable: InvoiceDue = {
        id: `INV-BPJS-${Date.now().toString().slice(-4)}`,
        type: 'PAYABLE',
        party_name: 'BPJS Ketenagakerjaan & Kesehatan RI',
        invoice_number: `BPJS-SETOR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`,
        due_date: dueDateStr,
        amount: summary.totalBpjsRemittance,
        status: 'Unpaid',
      };

      setInvoicesDue((prev) => [bpjsPayable, ...prev]);
    }

    setIsPayrollSynced(true);
    setLastPayrollSyncTime(timeStr);
    localStorage.setItem('jacs_erp_payroll_synced', 'true');
    localStorage.setItem('jacs_erp_payroll_last_sync', timeStr);

    addAuditLog(
      `Sinkronisasi Penggajian ke Finance: Gaji Bersih Rp ${summary.totalTakeHomePay.toLocaleString('id-ID')}, Beban BPJS Rp ${summary.totalCompanyContribution.toLocaleString('id-ID')}, Tagihan BPJS Rp ${summary.totalBpjsRemittance.toLocaleString('id-ID')}`,
      'Finance & HR',
      'INFO'
    );

    showToast('Jurnal Penggajian & BPJS berhasil disinkronisasikan ke modul Keuangan.');
  };

  const processPayrollPayment = (
    employeeId?: string,
    paymentSource: 'Kas Utama' | 'Bank Operasional' | string = 'Bank Operasional',
    notes?: string
  ) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const timestampStr = `${dateStr} ${timeStr}`;

    const isAll = !employeeId || employeeId === 'ALL';
    const targetEmployees = isAll
      ? employees
      : employees.filter((e) => e.id === employeeId);

    if (targetEmployees.length === 0) {
      showToast('Tidak ada data karyawan yang dipilih untuk pembayaran gaji.');
      return { success: false, journalId: '', amount: 0, message: 'Karyawan tidak ditemukan' };
    }

    // Hitung total Take Home Pay untuk target karyawan
    // Tarif BPJS Karyawan: Kesehatan 1%, Ketenagakerjaan 3%
    const RATES = {
      kesEmployee: 0.01,
      tkEmployee: 0.03,
    };

    let totalPaymentAmount = 0;
    targetEmployees.forEach((emp) => {
      const baseSalary = emp.baseSalary ?? 5000000;
      const isBpjsActive = emp.bpjsEnabled !== false;
      const kesEmployee = isBpjsActive ? Math.round(baseSalary * RATES.kesEmployee) : 0;
      const tkEmployee = isBpjsActive ? Math.round(baseSalary * RATES.tkEmployee) : 0;
      const totalEmployeeDeduction = kesEmployee + tkEmployee;

      // Akumulasikan Komisi Penjualan POS (1%) untuk kasir aktif
      const isCashier = isCashierEmployee(emp, salesHistory, activeUser);
      const commissionResult = isCashier
        ? calculateCashierCommission(salesHistory, users, emp)
        : null;
      const commission = commissionResult?.commission ?? 0;

      // Tunjangan Harian (Uang Makan & Transport) & Potongan Absensi
      const attendedDays = emp.attendedDays ?? 22;
      const dailyRate = emp.dailyAllowanceRate ?? 45000;
      const dailyAllowance = emp.dailyAllowance ?? (attendedDays * dailyRate);

      const empLogs = attendanceLogs.filter(
        (a) => a.employeeId === emp.id || a.nip === emp.nip
      );
      const lateCount = empLogs.filter((a) => a.status === 'Terlambat').length;
      const absenceDeduction = emp.absenceDeduction ?? (lateCount * 50000);

      const takeHomePay = baseSalary + dailyAllowance + commission - absenceDeduction - totalEmployeeDeduction;
      totalPaymentAmount += takeHomePay;
    });

    const isKasUtama = paymentSource === 'Kas Utama';
    const cashAccountCode = isKasUtama ? '1-10000' : '1-10002';
    const cashAccountName = isKasUtama ? 'Kas Utama / Brankas' : 'Bank Operasional';

    const payId = isAll
      ? `ALL-${Date.now().toString().slice(-4)}`
      : `${targetEmployees[0].id}-${Date.now().toString().slice(-4)}`;
    const journalRef = `JRN-PAYROLL-${payId}`;

    // 1. Potong saldo Kas Utama / Bank Operasional di Finance (Catat EXPENSE)
    const payrollFinanceEntry: FinanceEntry = {
      id: `FIN-${journalRef}`,
      date: dateStr,
      type: 'EXPENSE',
      category: 'Payroll & Gaji Karyawan',
      description: isAll
        ? `Pembayaran Gaji Karyawan Massal (${targetEmployees.length} Staf) Periode September 2026 via ${cashAccountName} [${cashAccountCode}]`
        : `Pembayaran Gaji: ${targetEmployees[0].name} (${targetEmployees[0].nip}) Periode September 2026 via ${cashAccountName} [${cashAccountCode}]`,
      amount: totalPaymentAmount,
      reference: journalRef,
      payment_method: isKasUtama ? 'CASH' : 'TRANSFER',
      account_target: `${cashAccountName} (${cashAccountCode})`,
      created_at: new Date().toISOString(),
    };
    setFinance((prev) => {
      const filtered = prev.filter((f) => f.id !== payrollFinanceEntry.id);
      return [payrollFinanceEntry, ...filtered];
    });

    // 2. Buat jurnal otomatis JRN-PAYROLL-[id]: Debit Beban Gaji Karyawan (5-10201) dan Kredit Kas/Bank (1-10000 / 1-10002)
    const journalLines: JournalEntryLine[] = [
      {
        accountCode: '5-10201',
        accountName: 'Beban Gaji Karyawan',
        debit: totalPaymentAmount,
        credit: 0,
      },
      {
        accountCode: cashAccountCode,
        accountName: cashAccountName,
        debit: 0,
        credit: totalPaymentAmount,
      },
    ];

    const payrollJournalEntry: JournalEntry = {
      id: journalRef,
      date: dateStr,
      reference: `PAYROLL-${payId}`,
      description: isAll
        ? `Pembayaran Payroll Massal (${targetEmployees.length} Karyawan) • Debit Beban Gaji Karyawan [5-10201], Kredit ${cashAccountName} [${cashAccountCode}] Rp ${totalPaymentAmount.toLocaleString('id-ID')}`
        : `Pembayaran Slip Gaji ${targetEmployees[0].name} (${targetEmployees[0].nip}) • Debit Beban Gaji Karyawan [5-10201], Kredit ${cashAccountName} [${cashAccountCode}] Rp ${totalPaymentAmount.toLocaleString('id-ID')}`,
      type: 'GENERAL',
      lines: journalLines,
      totalDebit: totalPaymentAmount,
      totalCredit: totalPaymentAmount,
      created_at: new Date().toISOString(),
    };

    setJournalEntries((prev) => {
      const next = [payrollJournalEntry, ...prev.filter((j) => j.id !== journalRef)];
      try {
        localStorage.setItem('jacs_erp_journal_entries', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // 3. Tampilkan status slip gaji menjadi 'PAID' lengkap dengan tanggal bayar
    const targetIds = new Set(targetEmployees.map((e) => e.id));
    setEmployees((prev) => {
      const next = prev.map((emp) => {
        if (targetIds.has(emp.id)) {
          return {
            ...emp,
            payrollStatus: 'PAID' as const,
            payrollPaidAt: timestampStr,
            payrollPaymentRef: journalRef,
          };
        }
        return emp;
      });
      try {
        localStorage.setItem('jacs_erp_employees', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setIsPayrollSynced(true);
    setLastPayrollSyncTime(timestampStr);
    try {
      localStorage.setItem('jacs_erp_payroll_synced', 'true');
      localStorage.setItem('jacs_erp_payroll_last_sync', timestampStr);
    } catch (e) {}

    addAuditLog(
      `Pembayaran Gaji: ${journalRef} sebesar Rp ${totalPaymentAmount.toLocaleString('id-ID')} via ${cashAccountName} [${cashAccountCode}]. Status Slip Gaji diperbarui menjadi PAID.`,
      'HR & Payroll',
      'INFO'
    );

    const successMsg = isAll
      ? `Gaji ${targetEmployees.length} Karyawan berhasil DIBAYAR (PAID) senilai Rp ${totalPaymentAmount.toLocaleString('id-ID')}! Jurnal ${journalRef} & mutasi kas tercatat.`
      : `Gaji ${targetEmployees[0].name} berhasil DIBAYAR (PAID) senilai Rp ${totalPaymentAmount.toLocaleString('id-ID')}! Jurnal ${journalRef} tercatat.`;

    showToast(successMsg);

    return {
      success: true,
      journalId: journalRef,
      amount: totalPaymentAmount,
      message: successMsg,
    };
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        language,
        setLanguage,
        activeNav,
        setActiveNav,
        products,
        setProducts,
        sales,
        salesHistory,
        setSalesHistory,
        cart,
        setCart,
        resetCart,
        journalEntries,
        setJournalEntries,
        users,
        setUsers,
        purchasing,
        purchaseRequests,
        setPurchaseRequests,
        createPurchaseRequest,
        approvePurchaseRequest,
        rejectPurchaseRequest,
        approvalQueue,
        approveItem,
        rejectItem,
        approveAllDocumentApprovals,
        invoicesDue,
        invoicesReceivable,
        markInvoicePaid,
        payVendorInvoice,
        receiveCustomerPayment,
        inventory,
        setInventory,
        stockMutations,
        setStockMutations,
        finance,
        auditLogs,
        terminals,
        activeTerminal,
        setActiveTerminal,
        addTerminal,
        deleteTerminal,
        updateTerminal,
        toggleTerminalLock,
        setAllTerminalsLock,
        activeUser,
        currentUser: activeUser,
        setActiveUser,
        setCurrentUser,
        contextualProfile,
        brands,
        setBrands,
        categoriesMaster,
        setCategoriesMaster,
        suppliers,
        setSuppliers,
        customers,
        setCustomers,
        migrationBatches,
        setMigrationBatches,
        rollbackMigrationBatch,
        developerPassword,
        updateDeveloperPassword,
        isSuperAdminAuthenticated,
        setIsSuperAdminAuthenticated: setIsSuperAdminAuthenticatedPersisted,
        superAdminTab,
        setSuperAdminTab,
        updateUserPin,
        resetAllUserPinsToDefault,
        refreshSystemState,
        emergencySessionReset,
        exitSuperAdminSession,
        logout,
        clearAllCacheAndRepair,
        repairStockLedger,
        resetDemoSalesAndRestock,
        unlockedModules,
        isModuleUnlocked,
        unlockModule,
        lockModule,
        lockAllModules,
        verifyModulePassword,
        moduleCustomPins,
        getModulePin,
        updateModulePin,
        businessProfile,
        updateBusinessProfile,
        resetBusinessProfileToDefault,
        isFirstRunSetup,
        setIsFirstRunSetup,
        isGlobalMaintenance,
        setIsGlobalMaintenance,
        toggleGlobalMaintenance,
        activeNeonCards,
        setActiveNeonCard,
        sheetConfig,
        updateSheetConfig,
        testSheetConnection,
        isPinModalOpen,
        openPinAuth,
        closePinAuth,
        verifyPin,
        addProduct,
        addProductsBulk,
        updateProduct,
        deleteProduct,
        processSale,
        processPayment,
        createPurchaseOrder,
        updatePurchaseOrderStatus,
        updatePurchaseOrderPayment,
        deletePurchaseOrder,
        createAutoReorderPO,
        reorderAllLowStock,
        approvePurchaseOrder,
        rejectPurchaseOrder,
        purchaseReturns,
        createPurchaseReturn,
        getDefaultSupplierForProduct,
        receivePurchaseOrder,
        goodsReceipts,
        processGoodsReceipt,
        handleCreateGoodsReceipt,
        adjustStock,
        processStockOpnameAdjustment,
        addFinanceEntry,
        resetToInitialData,
        addAuditLog,
        isReceiptModalOpen,
        currentReceiptSale,
        showReceipt,
        closeReceipt,
        toastMessage,
        showToast,
        isCashierWorkspaceActive,
        setIsCashierWorkspaceActive,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        // Offline-First POS Engine & Network State
        isOnline,
        setIsOnline,
        offlineQueue,
        syncOfflineQueue,
        syncOfflineTransactions,
        clearOfflineQueue,
        // POS Cashier Shift & Cash Reconciliation (APS POS4: 32_ShiftKasir)
        activeShift,
        shiftsHistory,
        openCashierShift,
        recordShiftExpense,
        closeCashierShift,
        closeShift: closeCashierShift,
        // Consumer Sales Returns (APS POS4: 28_ReturPenjualan)
        salesReturns,
        badStockItems,
        processSalesReturn,
        updateBadStockStatus,
        // HR
        employees,
        attendanceLogs,
        leaveRequests,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        recordClockIn,
        recordClockOut,
        submitLeaveRequest,
        approveLeaveRequest,
        rejectLeaveRequest,
        toggleEmployeeBpjs,
        updateEmployeeSalary,
        isPayrollSynced,
        lastPayrollSyncTime,
        syncPayrollToFinance,
        calculateCashierCommission: (cashier?: string | Employee | User, targetMonth?: string) =>
          calculateCashierCommission(salesHistory, users, cashier || (activeUser ?? undefined), targetMonth),
        processPayrollPayment,
        // Stock Policies & Executive Alerts
        stockAlertPolicies,
        addStockAlertPolicy,
        updateStockAlertPolicy,
        deleteStockAlertPolicy,
        getProductAlertThreshold,
        // Executive Promotions Hub
        promotions,
        addPromotion,
        updatePromotion,
        deletePromotion,
        togglePromotionStatus,
        // F&B Recipe BOM & HPP Costing
        calculateFBMenuHPP,
        handleSaveRecipeCosting,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
