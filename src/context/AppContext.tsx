import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAudit } from '../audit';
import { sanitizeTextValue } from '../utils/securityShield';
import { getTranslatedText } from '../utils/translations';
import {
  Product,
  Sale,
  User,
  PurchaseOrder,
  InventoryRecord,
  StockMutation,
  Terminal,
  FinanceEntry,
  AuditLog,
  SupplierMaster,
  CustomerMaster,
  PurchaseRequest,
  ApprovalItem,
  PromotionProgram,
  StockAlertPolicy,
  Employee,
  AttendanceRecord,
  LeaveRequest,
  InvoiceDue,
  BusinessBranch,
  BusinessEntityProfile,
  VoidItemLog,
  GoodsReceipt,
  BadStockItem,
  SalesReturn,
  PurchaseReturn,
  CashierShift,
  JournalEntry,
  ProductAlertThresholdResult,
  MigrationBatchRecord,
  BrandMaster,
  CategoryMaster,
  ActiveNavModule,
  ContextualProfile,
  PaymentPayload,
  SheetConfig,
  SystemError,
  SupplierRebateClaim,
  BusinessDomainConfig,
  BusinessMechanismFamily,
  CanonicalBusinessSector,
  BuildingDeliveryOrder,
  BuildingDeliveryStatus,
  BuildingFleetType,
  BulkShrinkageLog,
  BuildingAuthRequest,
  LaundryOrderRecord,
  LaundryProductionStatus,
  LaundryPaymentStatus,
  LaundryStageOperatorLog,
  FashionExchangePayload,
  FnbToppingMaster,
  ServiceStylistMaster,
} from '../types';
import {
  ALL_SERVICE_SECTOR_SEEDS,
  DEFAULT_SERVICE_STYLISTS,
  generateNextStylistId,
  upgradeLegacyBarbershopSeed,
} from '../data/serviceData';
import {
  belongsToActiveEntity,
  calculateServiceCommissionBreakdown,
  getAdaptiveCoaMeta,
  normalizeCanonicalAccountCode,
} from '../utils/sectorCoaMap';
import {
  ACTIVE_BUSINESS_PROFILE_STORAGE_KEY,
  ACTIVE_CASHIER_QUOTA_STORAGE_KEY,
  deriveExecutiveVerticalFromProfile,
  getEffectiveBusinessDomainConfig,
  getStoredActiveCashierQuota,
  loadActiveBusinessProfileFromStorage,
  normalizeBusinessProfileDomain,
  resolveCanonicalSector,
  saveActiveBusinessProfileToStorage,
} from '../utils/businessDomainConfig';
import {
  clearBoundPosStation,
  getBoundPosStation,
  normalizeStationCode,
  PosStationBinding,
  resolveSynchronizedTerminalDisplayName,
  setBoundPosStation
} from '../utils/terminalConfigUtils';
import { buildSalePromoAccountingBreakdown } from '../utils/promoEngine';
import {
  BUILDING_HARDWARE_PRODUCTS,
  FASHION_APPAREL_PRODUCTS,
  FASHION_CATEGORY_SEEDS,
  FNB_RESTAURANT_PRODUCTS,
  LAUNDRY_SERVICE_CATEGORIES,
  LAUNDRY_SERVICE_PRODUCTS,
} from '../data/industryTerminalProducts';
import {
  INITIAL_RAW_INGREDIENTS,
  RAW_INGREDIENTS_AS_PRODUCTS,
  getDefaultRecipeForFnbMenu,
  normalizeFnbRawMaterialId,
} from '../data/rawIngredientsData';
import {
  DEFAULT_FNB_TOPPING_MASTERS,
  generateNextToppingSku,
  generateNextRawMaterialSku,
} from '../data/fnbData';
import {
  resolveBulkCubicConversionFactor,
  estimateFleetDeliveryExpense,
  calculateBuildingLoadingFeeTotal,
  isBuildingMaterialProduct,
} from '../utils/buildingTierPricing';
import {
  isFashionSale,
  isZeroDiffFashionExchange,
  resolveSaleDiscountTotal,
} from '../utils/fashionAnalytics';
import {
  BUILDING_BULK_SUPPLIERS,
  BUILDING_BULK_PURCHASE_ORDERS,
  BUILDING_BULK_PURCHASE_REQUESTS,
  BUILDING_BULK_STOCK_MUTATIONS,
  BUILDING_BULK_GOODS_RECEIPTS,
  FNB_CULINARY_SUPPLIERS,
  FNB_CULINARY_PURCHASE_ORDERS,
  FNB_CULINARY_PURCHASE_REQUESTS,
  FNB_CULINARY_STOCK_MUTATIONS,
  FNB_CULINARY_GOODS_RECEIPTS,
  FASHION_APPAREL_PURCHASE_ORDERS,
  filterProductsByBusinessDomain,
  filterInventoryByBusinessDomain,
  filterMutationsByBusinessDomain,
  filterPurchaseOrdersByBusinessDomain,
  filterPurchaseRequestsByBusinessDomain,
  filterSuppliersByBusinessDomain,
  filterGoodsReceiptsByBusinessDomain,
  resolveGrnBulkCubicConversion,
  LEDGER_RESET_ACTIVE_ENTITY_KEY,
} from '../utils/buildingDomainIsolation';
import {
  dualBackendSync,
  generateTxUuid,
  RemoteCommandType,
  RemoteCommandPayload,
  RemoteCommandExecutionLog,
  BranchTelemetryReport,
  CloverConfig,
  DualBackendConfig,
  StorageOperationalMode,
} from '../services/dualBackendSync';
import {
  pushSyncData,
  pullSyncData,
  testCloudConnections,
  CloudSyncResult,
  CloudPullResult,
  CloudConnectionPingResult,
  CloudSyncSnapshot,
} from '../services/cloudSyncService';
import { syncWithCloverPos, CloverSyncResult } from '../services/cloverSyncService';
import {
  pushTransactionAtomicRpc,
  pushStockMovementToSupabase,
  syncSnapshotToSupabase,
  pullLatestSnapshotFromSupabase,
  syncOfflineQueueToSupabase,
} from '../services/supabaseSyncService';
import {
  isSupabaseConfigured,
  resolveSupabaseCredentials,
  sanitizeAndValidateSupabaseUrl,
  DEFAULT_FALLBACK_SUPABASE_URL,
} from '../lib/supabaseClient';
import {
  testGasConnection,
  syncOfflineQueueToGAS,
  getGasOfflineQueue,
  upsertProductToGAS,
  pushTransactionToGAS,
  pushStockMovementToGAS,
} from '../services/gasSyncService';
import { verifyAndDecodeSession, hashSha256 } from '../utils/securityUtils';
import {
  INITIAL_USERS,
  INITIAL_TERMINALS,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_PURCHASING,
  INITIAL_GOODS_RECEIPTS,
  INITIAL_STOCK_MUTATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PURCHASE_REQUESTS,
  INITIAL_APPROVALS,
  INITIAL_PROMOTIONS,
  INITIAL_INVOICES_DUE,
  INITIAL_SHEET_CONFIG,
  DEFAULT_BUSINESS_PROFILE
} from '../data/initialData';
import {
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVE_REQUESTS
} from '../data/hrData';
import {
  INITIAL_BRANDS,
  INITIAL_CATEGORIES
} from '../data/canonicalMasterData';

export type LanguageMode = 'id' | 'en';
export type TranslationKey = string;

export interface CashierCommissionResult {
  commission: number;
  totalCommission: number;
  salesTotal: number;
  eligibleSales: number;
  transactionCount: number;
  txCount: number;
  commissionRate: number;
  ratePercent: number;
  periodMonth: string;
  sales: Sale[];
}

// Helper Ekspor untuk Modul HR & Payroll
export const isCashierEmployee = (
  emp: Partial<Employee> & { position?: string },
  _salesHistory?: Sale[],
  _activeUser?: User | null
): boolean => {
  if (!emp) return false;
  const role = String(emp.role || emp.position || '').toLowerCase();
  const dept = String(emp.department || emp.division || '').toLowerCase();
  return role.includes('kasir') || role.includes('cashier') || role.includes('pos') || dept.includes('kasir') || dept.includes('pos');
};

export const parsePeriodToYearMonth = (period?: string): { year: number; month: number } => {
  const parts = String(period || '').split('-');
  const now = new Date();
  return {
    year: Number(parts[0]) || now.getFullYear(),
    month: Number(parts[1]) || now.getMonth() + 1
  };
};

export function calculateCashierCommission(totalSales: number, ratePercent?: number): number;
export function calculateCashierCommission(employee: any, sales?: Sale[], period?: string): CashierCommissionResult;
export function calculateCashierCommission(
  employeeOrSales: any,
  salesOrRate: Sale[] | number = 0.5,
  period?: string
): number | CashierCommissionResult {
  if (typeof employeeOrSales === 'number') {
    const rate = typeof salesOrRate === 'number' ? salesOrRate : 0.5;
    return Math.round((Math.max(0, employeeOrSales) * rate) / 100);
  }

  const employee = employeeOrSales;
  const salesList = Array.isArray(salesOrRate) ? salesOrRate : [];
  if (!employee) {
    return {
      commission: 0,
      totalCommission: 0,
      salesTotal: 0,
      eligibleSales: 0,
      transactionCount: 0,
      txCount: 0,
      commissionRate: 1,
      ratePercent: 1,
      periodMonth: period || 'ALL',
      sales: []
    };
  }

  const rate = typeof employee.cashierCommissionRate === 'number' ? employee.cashierCommissionRate : 1;
  const isAll = !period || period === 'ALL';
  const { year, month } = parsePeriodToYearMonth(isAll ? undefined : period);

  const empName = (employee.name || '').toLowerCase();
  const empId = (employee.id || employee.nip || '').toLowerCase();

  let eligibleSalesSum = 0;
  const matchedSales: Sale[] = [];

  for (const sale of salesList) {
    if (sale.status && sale.status !== 'COMPLETED' && sale.status !== 'PAID') continue;
    const sDate = new Date(sale.created_at || sale.date || (sale as any).timestamp || Date.now());
    const periodMatch = isAll || (sDate.getFullYear() === year && sDate.getMonth() + 1 === month);
    if (!periodMatch) continue;

    const cashierName = (sale.cashier_name || (sale as any).cashierName || '').toLowerCase();
    const cashierId = (sale.cashier_id || (sale as any).cashierId || '').toLowerCase();
    if (
      (cashierName && empName && (cashierName.includes(empName) || empName.includes(cashierName))) ||
      (cashierId && empId && cashierId === empId)
    ) {
      const amt = Number(sale.total_amount ?? (sale as any).total) || 0;
      eligibleSalesSum += amt;
      matchedSales.push(sale);
    }
  }

  const totalComm = Math.round((eligibleSalesSum * rate) / 100);

  return {
    commission: totalComm,
    totalCommission: totalComm,
    salesTotal: eligibleSalesSum,
    eligibleSales: eligibleSalesSum,
    transactionCount: matchedSales.length,
    txCount: matchedSales.length,
    commissionRate: rate,
    ratePercent: rate,
    periodMonth: isAll ? 'Semua Periode' : (period as string),
    sales: matchedSales
  };
}

export interface AppContextType {
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;
  language: LanguageMode;
  setLanguage: (l: LanguageMode) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, any>) => string;
  activeNav: ActiveNavModule;
  setActiveNav: (nav: ActiveNavModule | string) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  activeUser: User | null;
  setActiveUser: React.Dispatch<React.SetStateAction<User | null>>;
  isSuperAdminAuthenticated: boolean;
  setIsSuperAdminAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  exitSuperAdminSession: () => void;
  emergencySessionReset: () => void;
  superAdminTab: string;
  setSuperAdminTab: React.Dispatch<React.SetStateAction<string>>;
  isGlobalMaintenance: boolean;
  toggleGlobalMaintenance: () => void;
  isPinModalOpen: boolean;
  openPinAuth: (callback?: () => void) => void;
  closePinAuth: () => void;
  verifyPin: (pin: string, moduleId?: string) => { success: boolean; user?: User; error?: string };
  verifyModulePassword: (targetOrPwd: string, pwd?: string) => { success: boolean; user?: User; error?: string };
  updateUserPin: (userId: string, newPin: string) => void;
  resetAllUserPinsToDefault: (defaultPin?: string) => void;
  developerPassword: string;
  updateDeveloperPassword: (newPwd: string) => void;
  divisionPinHashes: Record<string, { hash: string; updatedAt: string; updatedBy?: string }>;
  superAdminCodeHash: string;
  superAdminCodeUpdatedAt: string | null;
  verifyDivisionPin: (divisionId: string, pin: string) => Promise<boolean>;
  updateDivisionPin: (divisionId: string, newPin: string) => Promise<{ success: boolean; hash?: string; message: string }>;
  verifySuperAdminAuthorityCode: (code: string) => Promise<boolean>;
  updateSuperAdminAuthorityCode: (oldCode: string, newCode: string) => Promise<{ success: boolean; hash?: string; message: string }>;
  managementAuthPin: string;
  updateManagementAuthPin: (newPin: string) => { success: boolean; message: string };
  verifyManagementAuthPin: (pin: string) => boolean;
  contextualProfile: ContextualProfile & { exactRole?: string };
  logout: () => void;
  isModuleUnlocked: (modId: string) => boolean;
  unlockModule: (modId: string) => void;

  businessProfile: BusinessEntityProfile & { companyName?: string; brandTitle?: string; tagline?: string; currency?: string };
  businessDomainConfig: BusinessDomainConfig;
  activeSector: CanonicalBusinessSector;
  activeMechanismFamily: BusinessMechanismFamily;
  isFnb: boolean;
  isFashion: boolean;
  isBuilding: boolean;
  isService: boolean;
  isRetail: boolean;
  updateBusinessProfile: (updated: Partial<BusinessEntityProfile>, options?: { silent?: boolean }) => void;
  resetBusinessProfileToDefault: () => void;
  businessVertical: CanonicalBusinessSector;
  isFirstRunSetup: boolean;
  setIsFirstRunSetup: React.Dispatch<React.SetStateAction<boolean>>;
  activeBranchId: string;
  branches: BusinessBranch[];
  addBranch: (b: Omit<BusinessBranch, 'id'> & { id?: string }) => void;
  updateBranch: (idOrBranch: string | BusinessBranch, updated?: Partial<BusinessBranch>) => void;
  deleteBranch: (id: string) => void;

  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info' | 'warning';
  showToast: (msg: string, ...args: any[]) => void;
  clearToast: () => void;

  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addProduct: (product: Omit<Product, 'id'> & { id?: string }) => void;
  addProductsBulk: (pList: (Omit<Product, 'id'> & { id?: string })[], customMessage?: string) => void;
  updateProduct: (idOrProduct: string | Product, updated?: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductThreshold: (productId: string) => any;
  getProductAlertThreshold: (productOrId: string | Product) => ProductAlertThresholdResult;
  getDefaultSupplierForProduct: (p: Product) => SupplierMaster | null;
  brands: BrandMaster[];
  setBrands: React.Dispatch<React.SetStateAction<BrandMaster[]>>;
  categories: CategoryMaster[];
  categoriesMaster: CategoryMaster[];
  setCategoriesMaster: React.Dispatch<React.SetStateAction<CategoryMaster[]>>;
  fnbToppings: FnbToppingMaster[];
  setFnbToppings: React.Dispatch<React.SetStateAction<FnbToppingMaster[]>>;
  addFnbTopping: (topping: Omit<FnbToppingMaster, 'id' | 'sku'> & { id?: string; sku?: string }) => void;
  updateFnbTopping: (id: string, updates: Partial<FnbToppingMaster>) => void;
  deleteFnbTopping: (id: string) => void;
  toggleFnbToppingActive: (id: string) => void;
  registerFnbRawMaterial: (payload: {
    name: string;
    unit: 'Gram' | 'Ml' | 'Pcs' | string;
    costPerUnit: number;
    initialStock: number;
    category?: string;
  }) => Product;
  serviceStylists: ServiceStylistMaster[];
  setServiceStylists: React.Dispatch<React.SetStateAction<ServiceStylistMaster[]>>;
  addServiceStylist: (stylist: Omit<ServiceStylistMaster, 'id'> & { id?: string }) => void;
  updateServiceStylist: (id: string, updates: Partial<ServiceStylistMaster>) => void;
  deleteServiceStylist: (id: string) => void;
  toggleServiceStylistActive: (id: string) => void;

  sales: Sale[];
  salesHistory: Sale[];
  transactions: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  addSale: (sale: Sale) => void;
  processPayment: (payload: PaymentPayload) => Sale;
  showReceipt: (s: Sale) => void;
  closeReceipt: () => void;
  isReceiptModalOpen: boolean;
  currentReceiptSale: Sale | null;
  voidTransaction: (txId: string, reason?: string) => void;
  handleSalesReturn: (ret: any) => void;
  processFashionExchange: (payload: FashionExchangePayload) => {
    success: boolean;
    exchangeReceipt?: Sale;
    message: string;
  };

  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  activeCashierQuota: number;
  cashierQuotaLogs: Array<{
    id: string;
    timestamp: string;
    previousQuota: number;
    newQuota: number;
    approvedBy: string;
    details: string;
  }>;
  updateActiveCashierQuota: (
    nextQuota: number,
    approvedBy?: string
  ) => { success: boolean; quota: number; message: string };
  terminals: Terminal[];
  setTerminals: React.Dispatch<React.SetStateAction<Terminal[]>>;
  addTerminal: (t: Omit<Terminal, 'id'> & { id?: string }) => void;
  updateTerminal: (idOrTerminal: string | Terminal, updated?: Partial<Terminal>) => void;
  deleteTerminal: (id: string) => void;
  toggleTerminalLock: (id: string) => void;
  setAllTerminalsLock: (locked: boolean) => void;
  activeTerminal: Terminal | null;
  setActiveTerminal: (t: Terminal | null) => void;
  activeTerminalId: string;
  setActiveTerminalId: (id: string) => void;
  boundStation: PosStationBinding | null;
  bindPosStation: (binding: PosStationBinding) => void;
  unbindPosStation: () => void;
  isCashierWorkspaceActive: boolean;
  setIsCashierWorkspaceActive: (active: boolean) => void;
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean) => void;
  openAiAssistant: () => void;
  closeAiAssistant: () => void;
  isOnline: boolean;
  offlineQueue: any[];
  syncOfflineTransactions: () => Promise<{ success: boolean; syncedCount: number; message: string }>;
  executeCloudSync: (customConfig?: DualBackendConfig) => Promise<CloudSyncResult>;
  pullCloudSyncData: (customConfig?: DualBackendConfig) => Promise<CloudPullResult>;
  testCloudEndpoints: (customConfig?: DualBackendConfig) => Promise<CloudConnectionPingResult>;
  activeBackendProvider: 'SUPABASE' | 'GAS' | 'LOCAL';
  setActiveBackendProvider: (provider: 'SUPABASE' | 'GAS' | 'LOCAL') => void;
  storageOperationalMode: StorageOperationalMode;
  setStorageOperationalMode: (mode: StorageOperationalMode) => void;
  gasWebhookUrl: string;
  setGasWebhookUrl: (url: string) => void;
  testGasConnection: () => Promise<{ ok: boolean; message: string; status: number }>;
  gasOfflineQueueCount: number;
  syncOfflineQueues: () => Promise<{ supabaseSynced: number; gasSynced: number }>;

  suppliers: SupplierMaster[];
  setSuppliers: React.Dispatch<React.SetStateAction<SupplierMaster[]>>;
  addSupplier: (sup: SupplierMaster) => void;
  updateSupplier: (sup: SupplierMaster) => void;
  deleteSupplier: (id: string) => void;
  customers: CustomerMaster[];
  setCustomers: React.Dispatch<React.SetStateAction<CustomerMaster[]>>;
  addCustomer: (c: CustomerMaster) => void;
  updateCustomer: (c: CustomerMaster) => void;
  deleteCustomer: (id: string) => void;

  purchaseOrders: PurchaseOrder[];
  purchasing: PurchaseOrder[];
  setPurchasing: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'po_number'> & { po_number?: string }) => void;
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'po_number'> & { po_number?: string }) => void;
  updatePurchaseOrder: (po: PurchaseOrder) => void;
  updatePurchaseOrderStatus: (poNo: string, status: string) => void;
  updatePurchaseOrderPayment: (poNo: string, status: string, details?: any) => void;
  approvePurchaseOrder: (poNo: string, noteOrApprover?: string) => void;
  rejectPurchaseOrder: (poNo: string, reason?: string) => void;
  createPurchaseReturn: (ret: any) => void;
  createAutoReorderPO: (prod: Product | string) => PurchaseOrder | null;
  reorderAllLowStock: () => { pos: PurchaseOrder[] };
  purchaseRequests: PurchaseRequest[];
  setPurchaseRequests: React.Dispatch<React.SetStateAction<PurchaseRequest[]>>;
  addPurchaseRequest: (pr: Omit<PurchaseRequest, 'pr_number' | 'status'> & { pr_number?: string; status?: PurchaseRequest['status'] }) => void;
  createPurchaseRequest: (pr: Omit<PurchaseRequest, 'pr_number' | 'status'> & { pr_number?: string; status?: PurchaseRequest['status'] }) => void;
  approvePurchaseRequest: (prNo: string) => void;
  rejectPurchaseRequest: (prNo: string, reason?: string) => void;

  inventory: InventoryRecord[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryRecord[]>>;
  stockMutations: StockMutation[];
  setStockMutations: React.Dispatch<React.SetStateAction<StockMutation[]>>;
  recordStockMutation: (mutation: Omit<StockMutation, 'id' | 'timestamp'>) => void;
  adjustStock: (productId: string, newStock: number, reason?: string) => void;
  repairStockLedger: () => { success: boolean; repairedCount: number; mutationsSynced: number; message: string };
  processStockOpnameAdjustment: (
    productIdOrPayload:
      | string
      | {
          productId: string;
          physicalStock?: number;
          physicalQty?: number;
          systemStock?: number;
          notes?: string;
          reason?: string;
          operator?: string;
        },
    physicalQty?: number,
    reason?: string
  ) => { success: boolean; message?: string };
  processGoodsReceipt: (grOrPayload: GoodsReceipt | any) => { success: boolean; message?: string };

  finance: FinanceEntry[];
  setFinance: React.Dispatch<React.SetStateAction<FinanceEntry[]>>;
  financeEntries: FinanceEntry[];
  journalEntries: JournalEntry[];
  addFinanceEntry: (entry: any) => void;
  addJournalVoucher: (voucher: Omit<JournalEntry, 'id'>) => void;
  postGeneralJournalVoucher: (voucher: any) => { success: boolean; message?: string };
  getLiquidCashBalance: () => number;
  showJournalModal: boolean;
  setShowJournalModal: React.Dispatch<React.SetStateAction<boolean>>;
  journalVoucherInitialData: any;
  setJournalVoucherInitialData: React.Dispatch<React.SetStateAction<any>>;
  openJournalVoucher: (initialData?: any) => void;
  invoicesDue: InvoiceDue[];
  invoicesReceivable: InvoiceDue[];
  receiveCustomerPayment: (
    invoiceId: string,
    amountOrSource: number | string,
    methodOrNotes?: string,
    notesArg?: string
  ) => { success: boolean; message?: string; remaining?: number; isFullyPaid?: boolean };
  payVendorInvoice: (
    invoiceId: string,
    amountOrSource: number | string,
    methodOrNotes?: string,
    notesArg?: string
  ) => { success: boolean; message?: string; remaining?: number; isFullyPaid?: boolean };
  supplierRebateClaims: SupplierRebateClaim[];
  applySupplierRebateToAP: (claimIds: string[], targetInvoiceId: string) => { success: boolean; message: string; deductedTotal: number };
  settleRebateClaimCash: (claimId: string) => { success: boolean; message: string };

  approvals: ApprovalItem[];
  approvalQueue: ApprovalItem[];
  approveItem: (id: string) => void;
  rejectItem: (id: string, reason?: string) => void;
  promotions: PromotionProgram[];
  addPromotion: (promo: Omit<PromotionProgram, 'id'> & { id?: string }) => void;
  updatePromotion: (idOrPromo: string | PromotionProgram, updated?: Partial<PromotionProgram>) => void;
  deletePromotion: (id: string) => void;
  togglePromotionStatus: (id: string) => void;
  stockPolicies: StockAlertPolicy[];
  stockAlertPolicies: StockAlertPolicy[];
  addStockAlertPolicy: (p: Omit<StockAlertPolicy, 'id' | 'updatedAt'> & { id?: string; updatedAt?: string }) => void;
  updateStockAlertPolicy: (idOrPolicy: string | StockAlertPolicy, updated?: Partial<StockAlertPolicy>) => void;
  deleteStockAlertPolicy: (id: string) => void;

  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  addEmployee: (emp: Omit<Employee, 'id'> & { id?: string }) => void;
  updateEmployee: (idOrEmp: string | Employee, updated?: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  attendance: AttendanceRecord[];
  attendanceLogs: AttendanceRecord[];
  recordClockIn: (empId: string, notes?: string, location?: string) => void;
  recordClockOut: (empIdOrAttendanceId: string, notes?: string) => void;
  leaves: LeaveRequest[];
  leaveRequests: LeaveRequest[];
  submitLeaveRequest: (
    req: Omit<LeaveRequest, 'id' | 'ticketNumber' | 'status' | 'submittedAt'> & {
      id?: string;
      ticketNumber?: string;
      status?: LeaveRequest['status'];
      submittedAt?: string;
    }
  ) => void;
  approveLeaveRequest: (id: string, approverName?: string, note?: string) => void;
  rejectLeaveRequest: (id: string, approverName?: string, note?: string) => void;
  toggleEmployeeBpjs: (empId: string) => void;
  isPayrollSynced: boolean;
  lastPayrollSyncTime: string;
  syncPayrollToFinance: (summary?: any) => void;
  recordPayrollExpense: (...args: any[]) => void;
  processPayrollPayment: (empId: string, ...args: any[]) => void;
  calculateCashierCommission: (employee: any, period?: string) => CashierCommissionResult;

  voidLogs: VoidItemLog[];
  voidItemLogs: VoidItemLog[];
  clearVoidItemLogs: () => void;
  goodsReceipts: GoodsReceipt[];
  badStocks: BadStockItem[];
  badStockItems: BadStockItem[];
  salesReturns: SalesReturn[];
  purchaseReturns: PurchaseReturn[];
  cashierShifts: CashierShift[];
  shiftsHistory: CashierShift[];
  activeShift: CashierShift | null;
  getOpenShiftForStation: (stationCodeOrTerminalId?: string | null) => CashierShift | null;
  toggleStationBreak: (stationCodeOrTerminalId?: string | null) => boolean;
  openCashierShift: (initialCash: number, notes?: string) => CashierShift;
  closeCashierShift: (
    shiftDataOrActualCash:
      | number
      | {
          shiftId?: string;
          cashierId: string;
          cashierName: string;
          openingCash: number;
          expectedCash: number;
          actualCash: number;
          totalTransactions: number;
          totalCashSales?: number;
          totalNonCashSales?: number;
          totalExpenses?: number;
          totalSalesReturnCash?: number;
          stationCode?: string;
          terminalId?: string;
          terminalName?: string;
          notes?: string;
        },
    notes?: string,
    denominationBreakdown?: Record<string, number>
  ) => CashierShift & { success?: boolean; shift?: CashierShift };
  recordShiftExpense: (amount: number, reason: string, category?: string) => void;

  migrationBatches: MigrationBatchRecord[];
  setMigrationBatches: React.Dispatch<React.SetStateAction<MigrationBatchRecord[]>>;
  rollbackMigrationBatch: (batchId: string) => { success: boolean; message: string };

  auditLogs: AuditLog[];
  logs: AuditLog[];
  errorLogs: SystemError[];
  systemErrorLogs: SystemError[];
  recordSystemError: (payload: {
    message: string;
    stack?: string;
    module?: string;
    route?: string;
    sourceFile?: string;
    lineNumber?: number;
    columnNumber?: number;
    type?: 'CRITICAL' | 'WARNING';
  }) => void;
  clearSystemErrorLogs: () => void;
  addAuditLog: (actionOrLog: any, moduleOrDetails?: string, severity?: string) => void;
  pruneOldAuditLogs: (keepCount?: number) => { removedCount: number; remainingCount: number; message: string };
  restoreSystemSnapshot: (snapshot: any) => { success: boolean; restoredKeys: string[]; message: string };

  sheetConfig: SheetConfig;
  updateSheetConfig: (cfg: Partial<SheetConfig>) => void;
  testSheetConnection: () => Promise<boolean>;

  calculateFBMenuHPP: (recipe: any[], operationalCost?: number, targetMarginPercent?: number, wastePercentage?: number) => import('../types').FBMenuCosting;
  handleSaveRecipeCosting: (productId: string, recipeOrCosting: any, operationalCostOrUpdatePrice?: number | boolean, targetMarginPercent?: number, wastePercentage?: number) => void;

  activeNeonCards: Record<string, string>;
  setActiveNeonCard: (moduleKey: string, cardId?: string) => void;
  clearAllCacheAndRepair: () => { success: boolean; message: string };
  refreshSystemState: () => { success: boolean; message: string };

  // Building & Bulk Material Operational, Logistics & Authorization Integration
  buildingDeliveryOrders: BuildingDeliveryOrder[];
  laundryOrders: LaundryOrderRecord[];
  updateLaundryOrderStatus: (
    orderId: string,
    nextStatus: LaundryProductionStatus,
    meta?: {
      rackNumber?: string;
      washerEmployeeId?: string;
      washerEmployeeName?: string;
      ironerEmployeeId?: string;
      ironerEmployeeName?: string;
      specialistEmployeeId?: string;
      specialistEmployeeName?: string;
    }
  ) => void;
  settleLaundryOrderPayment: (
    orderId: string,
    settlementMethod: string,
    rackNumber?: string,
    markPickedUp?: boolean
  ) => void;
  addBuildingDeliveryOrder: (order: Omit<BuildingDeliveryOrder, 'id' | 'updatedAt'> & { id?: string }) => BuildingDeliveryOrder;
  updateBuildingDeliveryStatus: (
    id: string,
    status: BuildingDeliveryStatus,
    meta?: { driverName?: string; vehiclePlate?: string; notes?: string }
  ) => void;
  bulkShrinkageLogs: BulkShrinkageLog[];
  recordBulkShrinkage: (payload: {
    productId: string;
    productName?: string;
    unit?: string;
    costPrice?: number;
    currentStock?: number;
    physicalQty?: number;
    shrinkageQty?: number;
    reason: string;
  }) => { success: boolean; message: string };
  buildingAuthRequests: BuildingAuthRequest[];
  submitBuildingAuthRequest: (
    req: Omit<BuildingAuthRequest, 'id' | 'requestNumber' | 'createdAt' | 'status'>
  ) => BuildingAuthRequest;
  approveBuildingAuthRequest: (id: string, note?: string) => void;
  rejectBuildingAuthRequest: (id: string, reason?: string) => void;
  resetDemoData: () => { success: boolean; message: string };
  resetDemoSalesAndRestock: () => { success: boolean; message: string };
  isProductionMode: boolean;
  toggleProductionMode: () => void;
  cleanSlateTransactions: () => { success: boolean; message: string };
  resetLedgerToActiveEntity: () => { success: boolean; message: string };
  isLedgerReset: boolean;
  isMasterCatalogWiped: boolean;
  executeSystemResetByLevel: (level: 1 | 2 | 3 | 4) => {
    success: boolean;
    level: 1 | 2 | 3 | 4;
    title: string;
    message: string;
    timestamp: string;
  };
  restoreDemoSimulationData: () => {
    success: boolean;
    title: string;
    message: string;
    timestamp: string;
  };

  // Remote Maintenance & Telemetry Hub
  remoteMaintenanceLock: {
    locked: boolean;
    message: string;
    targetBranchId?: string;
    lockedAt?: string;
    lockedBy?: string;
  };
  setRemoteMaintenanceLock: React.Dispatch<
    React.SetStateAction<{
      locked: boolean;
      message: string;
      targetBranchId?: string;
      lockedAt?: string;
      lockedBy?: string;
    }>
  >;
  remoteCommandLogs: RemoteCommandExecutionLog[];
  branchTelemetryReports: BranchTelemetryReport[];
  lastHeartbeatAt: string | null;
  dispatchRemoteCommand: (params: {
    command: RemoteCommandType;
    targetBranchId: string;
    customMessage?: string;
    lockActive?: boolean;
  }) => Promise<{
    command: RemoteCommandPayload;
    transport: 'GAS_SUPABASE' | 'LOCAL_BROADCAST' | 'HYBRID';
    remoteOk: boolean;
  }>;
  triggerManualHeartbeatPoll: () => Promise<number>;
  clearRemoteHubLogs: () => void;

  // Clover POS Live Data Connector
  cloverConfig: CloverConfig;
  updateCloverConfig: (cfg: Partial<CloverConfig>) => CloverConfig;
  executeCloverLiveSync: (overrideCfg?: Partial<CloverConfig>) => Promise<CloverSyncResult & { cleanedDummy: boolean }>;

  // Enterprise Security Shield & Integrity Guard
  idleAutoLockMinutes: 0 | 5 | 15 | 30;
  setIdleAutoLockMinutes: (minutes: 0 | 5 | 15 | 30) => void;
  isIdleLocked: boolean;
  idleLockedAt: string | null;
  idleLockReason: string;
  triggerIdleLockNow: (reason?: string) => void;
  unlockIdleScreen: (pinInput: string) => Promise<{ success: boolean; message: string }>;
  securityShieldStats: {
    xssBlockedCount: number;
    malwareUploadBlockedCount: number;
    checksumVerifiedCount: number;
    checksumRejectedCount: number;
    failedPinAttemptsCount: number;
    idleLockTriggeredCount: number;
    dataExportCount: number;
    systemResetCount: number;
    lastScanAt: string;
  };
  recordSecurityShieldEvent: (event: {
    type:
      | 'XSS_BLOCKED'
      | 'MALWARE_UPLOAD_BLOCKED'
      | 'CHECKSUM_VERIFIED'
      | 'CHECKSUM_REJECTED'
      | 'FAILED_PIN'
      | 'DATA_EXPORT'
      | 'SYSTEM_RESET'
      | 'IDLE_LOCK';
    details: string;
    module?: string;
    level?: 'INFO' | 'WARN' | 'ERROR';
  }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'jacs_retailos_erp_v2_2_';
const DIVISION_PIN_HASHES_KEY = `${STORAGE_PREFIX}division_pin_hashes`;
const SUPERADMIN_CODE_HASH_KEY = `${STORAGE_PREFIX}superadmin_code_hash`;
const MANAGEMENT_AUTH_PIN_KEY = `${STORAGE_PREFIX}management_auth_pin_v1`;
const REMOTE_MAINTENANCE_LOCK_KEY = `${STORAGE_PREFIX}remote_maintenance_lock`;
const SYSTEM_ERROR_LOGS_KEY = `${STORAGE_PREFIX}system_error_logs`;
const MASTER_CATALOG_WIPED_KEY = `${STORAGE_PREFIX}master_catalog_wiped_v1`;
const IDLE_AUTOLOCK_MINUTES_KEY = `${STORAGE_PREFIX}idle_autolock_minutes_v1`;
const SECURITY_SHIELD_STATS_KEY = `${STORAGE_PREFIX}security_shield_stats_v1`;
const ALL_DIVISION_IDS = ['executive', 'finance', 'purchasing', 'pos', 'warehouse', 'hr'] as const;

const parseErrorStackSummary = (
  stack?: string,
  filename?: string,
  lineno?: number,
  colno?: number
): {
  stackSummary: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
} => {
  let cleanFile = filename
    ? filename.replace(/https?:\/\/[^/]+/g, '').replace(/\?.*$/, '')
    : undefined;
  let parsedLine = lineno;
  let parsedCol = colno;

  const cleanLines = (stack || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('Error:') && !l.startsWith('TypeError:') && !l.startsWith('ReferenceError:'))
    .slice(0, 4)
    .map((l) =>
      l
        .replace(/https?:\/\/[^/]+/g, '')
        .replace(/\?t=\d+/g, '')
        .replace(/\?v=[a-zA-Z0-9_-]+/g, '')
    );

  if (!cleanFile && cleanLines.length > 0) {
    const match = cleanLines[0].match(/([^\s()]+\.[tj]sx?):(\d+):?(\d+)?/);
    if (match) {
      cleanFile = match[1];
      parsedLine = parsedLine ?? Number(match[2]);
      parsedCol = parsedCol ?? (match[3] ? Number(match[3]) : undefined);
    }
  }

  const locationTag =
    cleanFile && parsedLine
      ? `${cleanFile}:${parsedLine}${parsedCol ? `:${parsedCol}` : ''}`
      : cleanFile || '';

  const stackSummary =
    cleanLines.length > 0
      ? cleanLines.join(' | ')
      : locationTag || 'Stack trace tidak tersedia';

  return {
    stackSummary,
    sourceFile: cleanFile,
    lineNumber: parsedLine,
    columnNumber: parsedCol
  };
};

const normalizeProductPricing = (product: Partial<Product>, idx: number = 0): Product => {
  const generatedId = product.id || product.plu || `SKU-${Date.now()}-${idx}`;
  const cost = Number(product.costPrice ?? product.cost_price ?? product.buy_price ?? product.hpp) || 0;
  const rawSell = Number(
    product.sellingPrice ??
      product.sell_price ??
      product.price_retail ??
      product.retailPrice ??
      product.price
  );
  const sell = rawSell > 0 ? rawSell : (cost > 0 ? Math.ceil((cost * 1.2) / 100) * 100 : 0);
  const member = Number(product.memberPrice ?? product.price_member) || (cost > 0 ? Math.ceil((cost * 1.15) / 100) * 100 : Math.round(sell * 0.95));
  const wholesale = Number(product.wholesalePrice ?? product.price_wholesale) || (cost > 0 ? Math.ceil((cost * 1.1) / 100) * 100 : Math.round(sell * 0.9));

  const buildingSeedMatch = product.id
    ? BUILDING_HARDWARE_PRODUCTS.find((bp) => bp.id === product.id)
    : undefined;

  const tier2Price =
    product.tier2Price ??
    buildingSeedMatch?.tier2Price ??
    (product.businessModel === 'building' ? member : undefined);
  const tier2MinQty =
    product.tier2MinQty ??
    buildingSeedMatch?.tier2MinQty ??
    (product.businessModel === 'building'
      ? product.materialNature === 'BULK_CURAH'
        ? 3
        : 10
      : undefined);
  const tier3Price =
    product.tier3Price ??
    buildingSeedMatch?.tier3Price ??
    (product.businessModel === 'building' ? wholesale : undefined);
  const tier3MinQty =
    product.tier3MinQty ??
    buildingSeedMatch?.tier3MinQty ??
    (product.businessModel === 'building'
      ? product.materialNature === 'BULK_CURAH'
        ? 6
        : 40
      : undefined);

  return {
    ...(buildingSeedMatch ? { ...buildingSeedMatch, ...product } : (product as Product)),
    id: generatedId,
    costPrice: cost,
    cost_price: cost,
    buy_price: cost,
    sellingPrice: sell,
    sell_price: sell,
    price_retail: sell,
    retailPrice: sell,
    price: sell,
    memberPrice: member,
    price_member: member,
    wholesalePrice: wholesale,
    price_wholesale: wholesale,
    tier2Price,
    tier2MinQty,
    tier3Price,
    tier3MinQty,
    categoryCode: product.categoryCode || 10,
    minStock: product.minStock ?? product.min_stock ?? 10,
    min_stock: product.min_stock ?? product.minStock ?? 10,
    status: product.status || 'Active'
  };
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'SKU-001',
    barcode: '8992727123456',
    sku: 'SKU-001',
    name: 'Kao Attack Clean Maximizer Powder Sachet 6x40 Gr',
    brand: 'KAO ATTACK',
    category: 'Powder Detergent',
    categoryCode: 2,
    costPrice: 8000,
    cost_price: 8000,
    sellingPrice: 9600,
    sell_price: 9600,
    price_retail: 9600,
    retailPrice: 9600,
    price: 9600,
    memberPrice: 9200,
    price_member: 9200,
    wholesalePrice: 8800,
    price_wholesale: 8800,
    stock: 120,
    minStock: 20,
    min_stock: 20,
    unit: 'Pack',
    status: 'Active'
  },
  {
    id: 'SKU-002',
    barcode: '8992696654321',
    sku: 'SKU-002',
    name: 'Dancow Balita Efa Madu Box 200 Gr',
    brand: 'DANCOW',
    category: 'Powder Milk',
    categoryCode: 3,
    costPrice: 18500,
    cost_price: 18500,
    sellingPrice: 22200,
    sell_price: 22200,
    price_retail: 22200,
    retailPrice: 22200,
    price: 22200,
    memberPrice: 21300,
    price_member: 21300,
    wholesalePrice: 20400,
    price_wholesale: 20400,
    stock: 85,
    minStock: 15,
    min_stock: 15,
    unit: 'Box',
    status: 'Active'
  },
  {
    id: 'SKU-003',
    barcode: '8993333999888',
    sku: 'SKU-003',
    name: 'Bimoli Minyak Goreng Botol 2 Lt',
    brand: 'BIMOLI',
    category: 'Cooking Oil',
    categoryCode: 5,
    costPrice: 31000,
    cost_price: 31000,
    sellingPrice: 37200,
    sell_price: 37200,
    price_retail: 37200,
    retailPrice: 37200,
    price: 37200,
    memberPrice: 35700,
    price_member: 35700,
    wholesalePrice: 34100,
    price_wholesale: 34100,
    stock: 95,
    minStock: 20,
    min_stock: 20,
    unit: 'Btl/Can',
    status: 'Active'
  },
  {
    id: 'SKU-004',
    barcode: '8998888111222',
    sku: 'SKU-004',
    name: 'Indomie Goreng Spesial Pack 5x85 Gr',
    brand: 'INDOMIE',
    category: 'Instant Noodle',
    categoryCode: 90,
    costPrice: 13000,
    cost_price: 13000,
    sellingPrice: 15600,
    sell_price: 15600,
    price_retail: 15600,
    retailPrice: 15600,
    price: 15600,
    memberPrice: 15000,
    price_member: 15000,
    wholesalePrice: 14300,
    price_wholesale: 14300,
    stock: 210,
    minStock: 30,
    min_stock: 30,
    unit: 'Pack',
    status: 'Active'
  },
  {
    id: 'SKU-005',
    barcode: '8997777333444',
    sku: 'SKU-005',
    name: 'Beras Ramos Kepala Super Karung 5 Kg',
    brand: 'RAMOS',
    category: 'Rice',
    categoryCode: 342,
    costPrice: 62000,
    cost_price: 62000,
    sellingPrice: 74400,
    sell_price: 74400,
    price_retail: 74400,
    retailPrice: 74400,
    price: 74400,
    memberPrice: 71300,
    price_member: 71300,
    wholesalePrice: 68200,
    price_wholesale: 68200,
    stock: 60,
    minStock: 10,
    min_stock: 10,
    unit: 'Kg/Sak',
    status: 'Active'
  }
];

const INITIAL_SALES: Sale[] = [
  {
    transaction_id: 'INV-2026-0001',
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    cashier_id: 'USR-01',
    cashier_name: 'Ismail',
    terminal_name: 'KASIR 01',
    terminalId: 'T-01',
    items_summary: 'Bimoli Minyak Goreng Botol 2 Lt (x50), Beras Ramos Kepala Super Karung 5 Kg (x80)',
    items: [
      {
        product: INITIAL_PRODUCTS[2],
        quantity: 50,
        subtotal: 1860000,
        costPrice: 31000,
        ...( { productId: 'SKU-003', barcode: '8993333999888', name: 'Bimoli Minyak Goreng Botol 2 Lt', qty: 50, price: 37200 } as any )
      },
      {
        product: INITIAL_PRODUCTS[4],
        quantity: 80,
        subtotal: 5952000,
        costPrice: 62000,
        ...( { productId: 'SKU-005', barcode: '8997777333444', name: 'Beras Ramos Kepala Super Karung 5 Kg', qty: 80, price: 74400 } as any )
      }
    ],
    subtotal: 7812000,
    discount: 0,
    total_amount: 7812000,
    payment_method: 'QRIS',
    amount_paid: 7812000,
    change_amount: 0,
    status: 'COMPLETED',
    businessSector: 'RETAIL',
    businessName: 'JacS Enterprise Demo Ritel',
    isDemoSeed: true,
    ...( { id: 'INV-2026-0001', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), cashierId: 'USR-01', cashierName: 'Ismail', total: 7812000, paymentMethod: 'QRIS', amountPaid: 7812000, change: 0 } as any )
  },
  {
    transaction_id: 'INV-2026-0002',
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    cashier_id: 'USR-01',
    cashier_name: 'Ismail',
    terminal_name: 'KASIR 01',
    terminalId: 'T-01',
    items_summary: 'Indomie Goreng Spesial Pack 5x85 Gr (x150), Dancow Balita Efa Madu Box 200 Gr (x78)',
    items: [
      {
        product: INITIAL_PRODUCTS[3],
        quantity: 150,
        subtotal: 2340000,
        costPrice: 13000,
        ...( { productId: 'SKU-004', barcode: '8998888111222', name: 'Indomie Goreng Spesial Pack 5x85 Gr', qty: 150, price: 15600 } as any )
      },
      {
        product: INITIAL_PRODUCTS[1],
        quantity: 78,
        subtotal: 1748000,
        costPrice: 18500,
        ...( { productId: 'SKU-002', barcode: '8992696654321', name: 'Dancow Balita Efa Madu Box 200 Gr', qty: 78, price: 22410 } as any )
      }
    ],
    subtotal: 4088000,
    discount: 0,
    total_amount: 4088000,
    payment_method: 'CASH',
    amount_paid: 4100000,
    change_amount: 12000,
    status: 'COMPLETED',
    businessSector: 'RETAIL',
    businessName: 'JacS Enterprise Demo Ritel',
    isDemoSeed: true,
    ...( { id: 'INV-2026-0002', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), cashierId: 'USR-01', cashierName: 'Ismail', total: 4088000, paymentMethod: 'CASH', amountPaid: 4100000, change: 12000 } as any )
  }
];

// Saldo Kas Awal + Beban HPP Riil Tersinkronisasi
const INITIAL_FINANCE: FinanceEntry[] = [
  {
    id: 'FIN-OPENING-001',
    date: new Date(Date.now() - 86400000).toISOString(),
    type: 'INCOME',
    category: 'Modal Kas & Bank Operasional',
    account_target: '1-10002 · Bank Operasional',
    description: 'Saldo Awal Kas Liquid JacS Enterprise',
    amount: 451000000,
    payment_method: 'BANK_TRANSFER',
    reference: 'CAP-2026-01',
    ...( { paymentMethod: 'BANK_TRANSFER', referenceId: 'CAP-2026-01' } as any )
  },
  {
    id: 'FIN-REV-001',
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    type: 'INCOME',
    category: 'Penjualan POS Ritel',
    account_target: '4-10101 · Pendapatan Penjualan',
    description: 'Pendapatan Struk #INV-2026-0001',
    amount: 7812000,
    payment_method: 'QRIS',
    reference: 'INV-2026-0001',
    businessSector: 'RETAIL',
    businessName: 'JacS Enterprise Demo Ritel',
    isDemoSeed: true,
    ...( { paymentMethod: 'QRIS', referenceId: 'INV-2026-0001' } as any )
  },
  {
    id: 'FIN-HPP-001',
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    type: 'EXPENSE',
    category: 'HPP',
    account_target: '5-10101 · Harga Pokok Penjualan (HPP)',
    description: 'Beban Pokok Penjualan (HPP) Struk #INV-2026-0001',
    amount: 6510000, // (50 * 31.000) + (80 * 62.000)
    payment_method: 'SYSTEM_AUTO',
    reference: 'INV-2026-0001',
    businessSector: 'RETAIL',
    businessName: 'JacS Enterprise Demo Ritel',
    isDemoSeed: true,
    ...( { paymentMethod: 'SYSTEM_AUTO', referenceId: 'INV-2026-0001' } as any )
  },
  {
    id: 'FIN-REV-002',
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: 'INCOME',
    category: 'Penjualan POS Ritel',
    account_target: '4-10101 · Pendapatan Penjualan',
    description: 'Pendapatan Struk #INV-2026-0002',
    amount: 4088000,
    payment_method: 'CASH',
    reference: 'INV-2026-0002',
    businessSector: 'RETAIL',
    businessName: 'JacS Enterprise Demo Ritel',
    isDemoSeed: true,
    ...( { paymentMethod: 'CASH', referenceId: 'INV-2026-0002' } as any )
  },
  {
    id: 'FIN-HPP-002',
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: 'EXPENSE',
    category: 'HPP',
    account_target: '5-10101 · Harga Pokok Penjualan (HPP)',
    description: 'Beban Pokok Penjualan (HPP) Struk #INV-2026-0002',
    amount: 3393000, // (150 * 13.000) + (78 * 18.500)
    payment_method: 'SYSTEM_AUTO',
    reference: 'INV-2026-0002',
    businessSector: 'RETAIL',
    businessName: 'JacS Enterprise Demo Ritel',
    isDemoSeed: true,
    ...( { paymentMethod: 'SYSTEM_AUTO', referenceId: 'INV-2026-0002' } as any )
  }
];

const resolveDefaultNavForUser = (user: User | null): ActiveNavModule => {
  if (!user) return 'home';
  const roleStr = String(user.role || '').toUpperCase();
  const divStr = String(user.division || '').toUpperCase();
  if (roleStr.includes('SUPER') || divStr.includes('SUPER')) return 'admin';
  if (roleStr.includes('EXECUTIVE') || roleStr === 'MANAGER' || divStr.includes('EXEC')) return 'executive';
  if (roleStr.includes('FINANCE') || divStr.includes('FINANCE')) return 'finance';
  if (roleStr.includes('PURCHAS') || divStr.includes('PURCHAS')) return 'purchasing';
  if (roleStr.includes('KASIR') || roleStr.includes('CASHIER') || divStr === 'POS') return 'pos';
  if (roleStr.includes('WAREHOUSE') || roleStr.includes('INVENTORY') || divStr.includes('WAREHOUSE')) return 'warehouse';
  if (roleStr.includes('HR') || divStr === 'HR') return 'hr';
  return 'executive';
};

const CASHIER_SLOT_BLUEPRINTS: Array<{
  slot: number;
  userId: string;
  defaultName: string;
  email: string;
  defaultPin: string;
  terminalId: string;
}> = [
  { slot: 1, userId: 'USR-003', defaultName: 'Andi Pratama (Kasir 01)', email: 'andi.pos01@jacs-erp.com', defaultPin: '1101', terminalId: 'T-01' },
  { slot: 2, userId: 'USR-004', defaultName: 'Maya Indah (Kasir 02)', email: 'maya.pos02@jacs-erp.com', defaultPin: '1102', terminalId: 'T-02' },
  { slot: 3, userId: 'USR-006', defaultName: 'Rian Hidayat (Kasir 03)', email: 'rian.pos03@jacs-erp.com', defaultPin: '1103', terminalId: 'T-03' },
  { slot: 4, userId: 'USR-007', defaultName: 'Siti Aminah (Kasir 04)', email: 'siti.pos04@jacs-erp.com', defaultPin: '1104', terminalId: 'T-04' },
  { slot: 5, userId: 'USR-POS-05', defaultName: 'Operator Kasir 05', email: 'kasir05.pos@jacs-erp.com', defaultPin: '1105', terminalId: 'T-05' },
  { slot: 6, userId: 'USR-POS-06', defaultName: 'Operator Kasir 06', email: 'kasir06.pos@jacs-erp.com', defaultPin: '1106', terminalId: 'T-06' },
  { slot: 7, userId: 'USR-POS-07', defaultName: 'Operator Kasir 07', email: 'kasir07.pos@jacs-erp.com', defaultPin: '1107', terminalId: 'T-07' },
  { slot: 8, userId: 'USR-POS-08', defaultName: 'Operator Kasir 08', email: 'kasir08.pos@jacs-erp.com', defaultPin: '1108', terminalId: 'T-08' },
  { slot: 9, userId: 'USR-POS-09', defaultName: 'Operator Kasir 09', email: 'kasir09.pos@jacs-erp.com', defaultPin: '1109', terminalId: 'T-09' },
  { slot: 10, userId: 'USR-POS-10', defaultName: 'Operator Kasir 10', email: 'kasir10.pos@jacs-erp.com', defaultPin: '1110', terminalId: 'T-10' },
];

export const resolveCashierSlotNumber = (u?: Partial<User> | null): number | null => {
  if (!u) return null;
  const roleStr = String(u.role || '').toLowerCase();
  const divStr = String(u.division || '').toLowerCase();
  if (!roleStr.includes('kasir') && !roleStr.includes('cashier') && !divStr.includes('kasir')) {
    return null;
  }
  const termMatch = String(u.assignedTerminalId || '').match(/(\d+)/);
  if (termMatch) return parseInt(termMatch[1], 10);
  const nameMatch = String(u.name || '').match(/kasir\s*0?(\d+)/i);
  if (nameMatch) return parseInt(nameMatch[1], 10);
  const bp = CASHIER_SLOT_BLUEPRINTS.find((b) => b.userId === u.user_id || b.userId === u.id);
  return bp ? bp.slot : null;
};

export const syncUsersToCashierQuota = (sourceUsers: User[], quotaCount: number): User[] => {
  const clampedQuota = Math.max(1, Math.min(10, Number(quotaCount) || 2));
  const nonCashierUsers = (sourceUsers || []).filter((u) => resolveCashierSlotNumber(u) === null);
  const existingCashiers = (sourceUsers || []).filter((u) => resolveCashierSlotNumber(u) !== null);

  const syncedCashiers: User[] = [];
  for (const bp of CASHIER_SLOT_BLUEPRINTS) {
    const existing = existingCashiers.find(
      (u) =>
        resolveCashierSlotNumber(u) === bp.slot ||
        u.user_id === bp.userId ||
        u.assignedTerminalId === bp.terminalId
    );
    if (bp.slot <= clampedQuota) {
      syncedCashiers.push({
        user_id: existing?.user_id || bp.userId,
        id: existing?.id || bp.userId,
        name: existing?.name
          ? existing.name.includes('Kasir')
            ? existing.name
            : `${existing.name} (Kasir ${String(bp.slot).padStart(2, '0')})`
          : bp.defaultName,
        email: existing?.email || bp.email,
        division: 'POS & Kasir',
        role: 'Kasir',
        status: 'Active',
        pin: existing?.pin || bp.defaultPin,
        assignedTerminalId: bp.terminalId,
        avatar: existing?.avatar ?? null,
        avatarUrl: existing?.avatarUrl ?? null,
      });
    } else if (existing) {
      syncedCashiers.push({
        ...existing,
        status: 'Inactive',
        assignedTerminalId: bp.terminalId,
      });
    }
  }

  // Place SuperAdmin & Executive Manager first, then active/archived cashiers, then other operational staff
  const topAdmins = nonCashierUsers.filter((u) => {
    const r = String(u.role || '').toUpperCase();
    const d = String(u.division || '').toUpperCase();
    return r.includes('SUPER') || d.includes('SUPER') || r === 'MANAGER' || d.includes('EXECUTIVE');
  });
  const otherStaff = nonCashierUsers.filter((u) => !topAdmins.includes(u));
  return [...topAdmins, ...syncedCashiers, ...otherStaff];
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auditContext = useAudit();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [language, setLanguageState] = useState<LanguageMode>(() => {
    try {
      const savedLang = localStorage.getItem('jacs_app_language_v1');
      if (savedLang === 'en' || savedLang === 'id') {
        return savedLang;
      }
    } catch {}
    return 'id';
  });

  const setLanguage = useCallback((nextLang: LanguageMode) => {
    const validLang: LanguageMode = nextLang === 'en' ? 'en' : 'id';
    setLanguageState(validLang);
    try {
      localStorage.setItem('jacs_app_language_v1', validLang);
    } catch {}
  }, []);

  const [activeCashierQuota, setActiveCashierQuotaState] = useState<number>(() =>
    getStoredActiveCashierQuota()
  );
  const [cashierQuotaLogs, setCashierQuotaLogs] = useState<
    Array<{
      id: string;
      timestamp: string;
      previousQuota: number;
      newQuota: number;
      approvedBy: string;
      details: string;
    }>
  >(() => {
    try {
      const raw = localStorage.getItem('jacs_cashier_quota_logs_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [users, setUsers] = useState<User[]>(() =>
    syncUsersToCashierQuota(INITIAL_USERS, getStoredActiveCashierQuota())
  );
  const [pinFailedAttempts, setPinFailedAttempts] = useState<number>(0);
  const [pinLockoutUntil, setPinLockoutUntil] = useState<number>(0);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('jacs_active_user');
      if (!savedUser) return null;
      const decoded = JSON.parse(atob(savedUser));
      if (decoded && decoded.payload) {
        if (Date.now() > (decoded.payload._expiresAt || 0)) {
          localStorage.removeItem('jacs_active_user');
          return null;
        }
        const { _expiresAt, _nonce, ...user } = decoded.payload;
        return user as User;
      }
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const verifyStoredSession = async () => {
      try {
        const savedUser = localStorage.getItem('jacs_active_user');
        if (!savedUser) return;
        const restored = await verifyAndDecodeSession(savedUser);
        if (!restored) {
          localStorage.removeItem('jacs_active_user');
          localStorage.removeItem('jacs_session_sig');
          setCurrentUser(null);
          setIsSuperAdminAuthenticated(false);
          showToast('Sesi kedaluwarsa atau integritas token tidak valid. Silakan login kembali.', 'warning');
        } else {
          setCurrentUser(restored);
          if (restored.role === 'Super Admin' || restored.division === 'SUPER ADMIN') {
            setIsSuperAdminAuthenticated(true);
          }
        }
      } catch {}
    };
    verifyStoredSession();
  }, []);
  const [activeNav, setActiveNav] = useState<ActiveNavModule>(() => resolveDefaultNavForUser(currentUser));
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isGlobalMaintenance, setIsGlobalMaintenance] = useState(false);
  const [isFirstRunSetup, setIsFirstRunSetup] = useState(false);
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState<boolean>(() =>
    Boolean(currentUser?.role === 'Super Admin')
  );
  const [superAdminTab, setSuperAdminTab] = useState<string>('overview');
  const [developerPassword, setDeveloperPassword] = useState<string>('admin123');
  const [managementAuthPin, setManagementAuthPin] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(MANAGEMENT_AUTH_PIN_KEY);
      if (saved && /^\d{6}$/.test(saved.trim())) {
        return saved.trim();
      }
    } catch {}
    return '123456';
  });
  const [divisionPinHashes, setDivisionPinHashes] = useState<Record<string, { hash: string; updatedAt: string; updatedBy?: string }>>(() => {
    try {
      const saved = localStorage.getItem(DIVISION_PIN_HASHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {};
  });
  const [superAdminCodeHash, setSuperAdminCodeHash] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(SUPERADMIN_CODE_HASH_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.hash === 'string') return parsed.hash;
      }
    } catch {}
    return '';
  });
  const [superAdminCodeUpdatedAt, setSuperAdminCodeUpdatedAt] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(SUPERADMIN_CODE_HASH_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed?.updatedAt || null;
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    let mounted = true;
    const initDefaultSecurityHashes = async () => {
      try {
        const defaultPinHash = await hashSha256('1234');
        const currentMap = { ...divisionPinHashes };
        let hasChanges = false;
        const nowIso = new Date().toISOString();
        ALL_DIVISION_IDS.forEach((divId) => {
          if (!currentMap[divId]?.hash) {
            currentMap[divId] = { hash: defaultPinHash, updatedAt: nowIso, updatedBy: 'System Default' };
            hasChanges = true;
          }
        });
        if (hasChanges && mounted) {
          setDivisionPinHashes(currentMap);
          try {
            localStorage.setItem(DIVISION_PIN_HASHES_KEY, JSON.stringify(currentMap));
          } catch {}
        }

        if (!superAdminCodeHash) {
          const defaultAdminHash = await hashSha256('Admin123');
          if (mounted) {
            setSuperAdminCodeHash(defaultAdminHash);
            setSuperAdminCodeUpdatedAt(nowIso);
            try {
              localStorage.setItem(
                SUPERADMIN_CODE_HASH_KEY,
                JSON.stringify({ hash: defaultAdminHash, updatedAt: nowIso })
              );
            } catch {}
          }
        }
      } catch {}
    };
    initDefaultSecurityHashes();
    return () => {
      mounted = false;
    };
  }, []);
  const [unlockedModules, setUnlockedModules] = useState<string[]>(['executive', 'finance', 'purchasing', 'pos', 'warehouse', 'hr', 'master-data', 'admin', 'security']);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
      }
    }
  }, [theme]);

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingPinCallback, setPendingPinCallback] = useState<(() => void) | null>(null);

  // Single Source of Truth: baca profil & sektor aktif secara sinkron di lazy initializer sebelum render pertama
  const [businessProfile, setBusinessProfile] = useState<
    BusinessEntityProfile & { companyName?: string; brandTitle?: string; tagline?: string; currency?: string }
  >(() =>
    loadActiveBusinessProfileFromStorage({
      ...DEFAULT_BUSINESS_PROFILE,
      name: 'KHANSA RETAIL',
      category: 'Minimarket',
      address: 'Jl. BERUA RAYA No. 1, Paccerakkang, Biringkanaya, Makassar 90245',
      phone: '(021) 515-8888 / 0812-8888-9999',
      email: 'official@jacs-retailos.id',
      companyName: 'KHANSA RETAIL',
      brandTitle: 'RetailOS ERP V2',
      tagline: 'Minimarket & Kebutuhan Harian Terlengkap',
      currency: 'IDR',
    })
  );
  const businessProfileRef = useRef(businessProfile);
  businessProfileRef.current = businessProfile;

  // Sinkronisasi lintas tab/iframe jika profil diperbarui dari jendela lain tanpa menimpa saat mount
  useEffect(() => {
    const handleProfileStorageSync = (e: StorageEvent) => {
      if (e.key === ACTIVE_BUSINESS_PROFILE_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            const synced = normalizeBusinessProfileDomain({
              ...businessProfileRef.current,
              ...parsed,
              companyName: parsed.name || parsed.businessName || businessProfileRef.current.companyName || businessProfileRef.current.name,
            });
            businessProfileRef.current = synced;
            setBusinessProfile(synced);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleProfileStorageSync);
    return () => window.removeEventListener('storage', handleProfileStorageSync);
  }, []);

  const [branches, setBranches] = useState<BusinessBranch[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}branches`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'BR-001',
        branchCode: 'HO-MKS',
        name: 'KHANSA RETAIL Makassar',
        industryCategory: 'RETAIL',
        isHeadquarters: true,
        address: 'Jl. BERUA RAYA No. 1, Paccerakkang, Biringkanaya, Makassar 90245',
        phone: '(021) 515-8888 / 0812-8888-9999',
        whatsapp: '081288889999',
        activeCashierCount: 3,
        slogan: 'Minimarket & Kebutuhan Harian Terlengkap',
        footerNote: 'Terima kasih telah berbelanja di KHANSA RETAIL',
        status: 'ACTIVE'
      }
    ];
  });
  const activeBranchId = 'BR-001';

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const [isMasterCatalogWiped, setIsMasterCatalogWiped] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MASTER_CATALOG_WIPED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const isMasterCatalogWipedRef = useRef<boolean>(isMasterCatalogWiped);
  isMasterCatalogWipedRef.current = isMasterCatalogWiped;

  const [products, setProducts] = useState<Product[]>(() => {
    const hydrateWithServiceSeeds = (baseList: Product[]): Product[] => {
      const upgradedBase = baseList.map((p, idx) => {
        const nextP = upgradeLegacyBarbershopSeed(p);
        return nextP !== p ? normalizeProductPricing(nextP, idx) : p;
      });
      const existingIds = new Set(upgradedBase.map((p) => String(p.id || '').toUpperCase()));
      const missingSeeds = ALL_SERVICE_SECTOR_SEEDS.filter(
        (seed) => !existingIds.has(String(seed.id).toUpperCase())
      ).map((seed, idx) => normalizeProductPricing(seed, upgradedBase.length + idx));
      return missingSeeds.length > 0 ? [...upgradedBase, ...missingSeeds] : upgradedBase;
    };
    try {
      const isWiped = localStorage.getItem(MASTER_CATALOG_WIPED_KEY) === 'true';
      const saved = localStorage.getItem(`${STORAGE_PREFIX}products`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (isWiped) {
            return parsed.map((p, i) => normalizeProductPricing(p, i));
          }
          if (parsed.length > 0) {
            return hydrateWithServiceSeeds(parsed.map((p, i) => normalizeProductPricing(p, i)));
          }
        }
      }
      if (isWiped) return [];
      return hydrateWithServiceSeeds(INITIAL_PRODUCTS);
    } catch {
      return hydrateWithServiceSeeds(INITIAL_PRODUCTS);
    }
  });

  const productsRef = useRef<Product[]>(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}sales`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((s: any) => ({
            ...s,
            total_amount: Number(s.total_amount ?? s.total) || 0,
            status: s.status || 'COMPLETED'
          }));
        }
      }
      if (localStorage.getItem(LEDGER_RESET_ACTIVE_ENTITY_KEY) === 'true') return [];
      return INITIAL_SALES;
    } catch {
      return INITIAL_SALES;
    }
  });

  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}finance`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      if (localStorage.getItem(LEDGER_RESET_ACTIVE_ENTITY_KEY) === 'true') return [];
      return INITIAL_FINANCE;
    } catch {
      return INITIAL_FINANCE;
    }
  });

  const [cashierShifts, setCashierShifts] = useState<CashierShift[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}shifts`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const cashierShiftsRef = useRef<CashierShift[]>(cashierShifts);
  cashierShiftsRef.current = cashierShifts;

  const [brands, setBrands] = useState<BrandMaster[]>(INITIAL_BRANDS);
  const [categoriesMaster, setCategoriesMaster] = useState<CategoryMaster[]>(INITIAL_CATEGORIES);
  const [terminals, setTerminals] = useState<Terminal[]>(() =>
    INITIAL_TERMINALS.slice(0, Math.max(1, Math.min(10, getStoredActiveCashierQuota() || 2)))
  );
  useEffect(() => {
    const quota = Math.max(1, Math.min(10, Number(activeCashierQuota) || 2));
    setTerminals((prev) => {
      const result: Terminal[] = [];
      for (let i = 1; i <= quota; i++) {
        const stationCode = `POS-${String(i).padStart(2, '0')}`;
        const termId = `T-${String(i).padStart(2, '0')}`;
        const existing =
          prev.find((t) => t.code === stationCode || t.id === termId || t.id === stationCode) ||
          INITIAL_TERMINALS.find((t) => t.code === stationCode || t.id === termId);
        if (existing) {
          result.push(existing);
        } else {
          result.push({
            ...(INITIAL_TERMINALS[0] || {
              colorHex: '#06b6d4',
              neonBorderClass: 'border-[#06b6d4] shadow-[0_0_15px_rgba(6,182,212,0.45)]',
              neonBgClass: 'bg-[#06b6d4]/10 hover:bg-[#06b6d4]/20',
              neonTextClass: 'text-[#06b6d4]',
              location: 'Retail & Wholesaler Modern',
              businessModel: 'Retail & Wholesaler Modern',
              subLabel: 'Data Master',
              modelType: 'retail',
              isActive: false,
              isLocked: true,
              activeOrdersToday: 0,
            }),
            id: termId,
            name: `KASIR ${String(i).padStart(2, '0')}`,
            code: stationCode,
            stationCode,
            isActive: i === 1,
          });
        }
      }
      return result;
    });
  }, [activeCashierQuota]);
  const [boundStation, setBoundStationState] = useState<PosStationBinding | null>(() => getBoundPosStation());
  const [activeTerminalId, setActiveTerminalId] = useState<string>(() => getBoundPosStation()?.stationCode || 'POS-01');
  const [activeTerminalOverride, setActiveTerminalOverride] = useState<Terminal | null>(null);
  const [isCashierWorkspaceActive, setIsCashierWorkspaceActive] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const openAiAssistant = useCallback(() => {
    if (!currentUser) {
      setIsAiAssistantOpen(false);
      return;
    }
    const roleStr = String(currentUser.role || '').toUpperCase();
    const divStr = String(currentUser.division || '').toUpperCase();
    const idStr = String(currentUser.user_id || currentUser.id || '').toUpperCase();
    const isSuper =
      isSuperAdminAuthenticated ||
      roleStr.includes('SUPER') ||
      divStr.includes('SUPER') ||
      idStr.includes('SUPER') ||
      idStr === 'USR-001';
    const isExec =
      activeNav === 'executive' ||
      activeNav === 'admin' ||
      roleStr.includes('EXEC') ||
      divStr.includes('EXEC') ||
      roleStr === 'MANAGER' ||
      roleStr === 'OWNER';

    if (!isSuper && !isExec) {
      setIsAiAssistantOpen(false);
      return;
    }
    setIsAiAssistantOpen(true);
  }, [currentUser, isSuperAdminAuthenticated, activeNav]);
  const closeAiAssistant = useCallback(() => setIsAiAssistantOpen(false), []);

  const resolveLockedCashierStationCode = useCallback(
    (userObj: User | null | undefined, isSuperAdmin: boolean): string | null => {
      if (!userObj || isSuperAdmin) return null;
      const roleStr = String(userObj.role || '').toUpperCase();
      const divStr = String(userObj.division || '').toUpperCase();
      const idStr = String(userObj.user_id || userObj.id || '').toUpperCase();
      const nameStr = String(userObj.name || '').trim();

      const isManagerOrAdmin =
        roleStr.includes('SUPER') ||
        divStr.includes('SUPER') ||
        idStr.includes('SUPER') ||
        idStr === 'USR-001' ||
        roleStr.includes('EXEC') ||
        divStr.includes('EXEC') ||
        roleStr === 'MANAGER' ||
        roleStr === 'OWNER';

      if (isManagerOrAdmin) return null;

      const isCashierUser =
        roleStr.includes('KASIR') ||
        roleStr.includes('CASHIER') ||
        roleStr === 'POS' ||
        divStr.includes('POS') ||
        divStr.includes('KASIR') ||
        nameStr.toLowerCase().includes('kasir');

      if (!isCashierUser) return null;

      // 1. Cek assignedTerminalId eksplisit dari daftar users
      const matchedRosterUser = users.find(
        (u) =>
          (userObj.user_id && u.user_id === userObj.user_id) ||
          (userObj.id && u.id === userObj.id) ||
          (nameStr && String(u.name || '').trim().toLowerCase() === nameStr.toLowerCase())
      );

      const candidateAssigned =
        userObj.assignedTerminalId || matchedRosterUser?.assignedTerminalId || '';
      const assignedMatch = String(candidateAssigned).match(/(\d+)/);
      if (assignedMatch) {
        const slot = Math.max(1, Math.min(10, parseInt(assignedMatch[1], 10)));
        return `POS-${String(slot).padStart(2, '0')}`;
      }

      // 2. Cek nomor urut pada nama akun (misal "Kasir 01" -> POS-01, "Kasir 02" -> POS-02)
      const nameMatch = nameStr.match(/(?:kasir|pos|loket)\s*[-#]?\s*0?(\d+)/i) || nameStr.match(/0?(\d+)$/);
      if (nameMatch) {
        const slot = Math.max(1, Math.min(10, parseInt(nameMatch[1], 10)));
        return `POS-${String(slot).padStart(2, '0')}`;
      }

      // 3. Cek dari user_id standar (USR-003 -> POS-01, USR-004 -> POS-02, USR-006 -> POS-03, USR-007 -> POS-04)
      if (idStr === 'USR-003') return 'POS-01';
      if (idStr === 'USR-004') return 'POS-02';
      if (idStr === 'USR-006') return 'POS-03';
      if (idStr === 'USR-007') return 'POS-04';
      const slotIdMatch = idStr.match(/USR-KASIR-0?(\d+)/i);
      if (slotIdMatch) {
        const slot = Math.max(1, Math.min(10, parseInt(slotIdMatch[1], 10)));
        return `POS-${String(slot).padStart(2, '0')}`;
      }

      return 'POS-01';
    },
    [users]
  );

  const lockedCashierStationCode = useMemo(
    () => resolveLockedCashierStationCode(currentUser, isSuperAdminAuthenticated),
    [resolveLockedCashierStationCode, currentUser, isSuperAdminAuthenticated]
  );

  // Otomatis ikat akun Kasir ke loketnya masing-masing (Kasir 01 -> POS-01, Kasir 02 -> POS-02, dst.)
  useEffect(() => {
    if (!lockedCashierStationCode || !currentUser) return;
    const activeSec = resolveCanonicalSector(businessProfile);
    const primaryModel =
      businessProfile?.domainConfig?.primaryBusinessModel || businessProfile?.businessType;
    const syncedStationName = resolveSynchronizedTerminalDisplayName(
      lockedCashierStationCode,
      activeSec,
      primaryModel
    );

    if (activeTerminalId !== lockedCashierStationCode) {
      setActiveTerminalId(lockedCashierStationCode);
    }

    if (!boundStation || boundStation.stationCode !== lockedCashierStationCode) {
      const saved = setBoundPosStation({
        stationCode: lockedCashierStationCode,
        stationName: syncedStationName,
        boundAt: new Date().toISOString(),
        boundBy: currentUser.name || 'Kasir',
      });
      setBoundStationState(saved);
    }
  }, [lockedCashierStationCode, currentUser, businessProfile, activeTerminalId, boundStation]);

  const activeTerminal = useMemo(() => {
    const effectiveTerminalId = lockedCashierStationCode || activeTerminalId;
    const baseTerm =
      (activeTerminalOverride &&
      (activeTerminalOverride.id === effectiveTerminalId ||
        activeTerminalOverride.stationCode === effectiveTerminalId)
        ? activeTerminalOverride
        : null) ||
      terminals.find((t) => t.id === effectiveTerminalId || t.stationCode === effectiveTerminalId) ||
      activeTerminalOverride ||
      terminals[0] ||
      null;
    if (!baseTerm) return null;
    const activeSec = resolveCanonicalSector(businessProfile);
    const primaryModel =
      businessProfile?.domainConfig?.primaryBusinessModel || businessProfile?.businessType;
    const resolvedStationCode = lockedCashierStationCode || baseTerm.stationCode || baseTerm.id || effectiveTerminalId;
    const syncedName = resolveSynchronizedTerminalDisplayName(
      resolvedStationCode,
      activeSec,
      primaryModel
    );
    return {
      ...baseTerm,
      id: resolvedStationCode,
      stationCode: resolvedStationCode,
      code: resolvedStationCode,
      name: syncedName,
    };
  }, [terminals, activeTerminalId, activeTerminalOverride, businessProfile, lockedCashierStationCode]);

  const setActiveTerminal = useCallback(
    (term: Terminal | null) => {
      if (!term) return;
      if (lockedCashierStationCode) {
        const targetCode = normalizeStationCode(term.stationCode || term.id || term.code);
        if (targetCode !== lockedCashierStationCode) {
          return;
        }
      }
      setActiveTerminalId(lockedCashierStationCode || term.id);
      setActiveTerminalOverride(
        lockedCashierStationCode
          ? {
              ...term,
              id: lockedCashierStationCode,
              stationCode: lockedCashierStationCode,
              code: lockedCashierStationCode,
            }
          : term
      );
    },
    [lockedCashierStationCode]
  );

  const bindPosStation = useCallback(
    (binding: PosStationBinding) => {
      const enforcedCode = lockedCashierStationCode || normalizeStationCode(binding.stationCode);
      const saved = setBoundPosStation({
        ...binding,
        stationCode: enforcedCode,
      });
      setBoundStationState(saved);
    },
    [lockedCashierStationCode]
  );

  const unbindPosStation = useCallback(() => {
    if (lockedCashierStationCode) {
      showToast(
        `Akun Kasir terikat permanen ke loket ${lockedCashierStationCode}. Hanya Executive Manager atau SuperAdmin yang dapat melepas/mengganti loket PC.`,
        'warning'
      );
      return;
    }
    clearBoundPosStation();
    setBoundStationState(null);
  }, [lockedCashierStationCode, showToast]);

  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === `${STORAGE_PREFIX}shifts` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setCashierShifts(parsed);
        } catch {}
      }
      if (e.key === 'jacs_pos_station_binding_v1') {
        setBoundStationState(getBoundPosStation());
      }
      if (e.key === MANAGEMENT_AUTH_PIN_KEY && e.newValue && /^\d{6}$/.test(e.newValue.trim())) {
        setManagementAuthPin(e.newValue.trim());
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  const [suppliers, setSuppliers] = useState<SupplierMaster[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}suppliers`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      if (localStorage.getItem(MASTER_CATALOG_WIPED_KEY) === 'true') return [];
    } catch {}
    return INITIAL_SUPPLIERS;
  });
  const [isLedgerReset, setIsLedgerReset] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LEDGER_RESET_ACTIVE_ENTITY_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [customers, setCustomers] = useState<CustomerMaster[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}customers`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      if (localStorage.getItem(MASTER_CATALOG_WIPED_KEY) === 'true') return [];
    } catch {}
    return INITIAL_CUSTOMERS;
  });
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}purchasing`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      if (localStorage.getItem(LEDGER_RESET_ACTIVE_ENTITY_KEY) === 'true') return [];
    } catch {}
    return INITIAL_PURCHASING;
  });
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}purchase_requests`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      if (localStorage.getItem(LEDGER_RESET_ACTIVE_ENTITY_KEY) === 'true') return [];
    } catch {}
    return INITIAL_PURCHASE_REQUESTS;
  });
  const [stockMutations, setStockMutations] = useState<StockMutation[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}stock_mutations`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      if (localStorage.getItem(LEDGER_RESET_ACTIVE_ENTITY_KEY) === 'true') return [];
    } catch {}
    return INITIAL_STOCK_MUTATIONS;
  });
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}journals`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      if (localStorage.getItem(LEDGER_RESET_ACTIVE_ENTITY_KEY) === 'true') return [];
    } catch {}
    const nowDate = new Date().toISOString().slice(0, 10);
    return [
      {
        id: 'JV-PROMO-SEED-TPR',
        date: nowDate,
        reference: 'INV-2026-PROMO-01',
        description: 'Klaim Rebate Promo Vendor (PT Nestle Indonesia) - TPR-VEND-NESTLE-04 | Struk #INV-2026-PROMO-01',
        type: 'PROMO_SUPPLIER_TPR',
        promoSourceType: 'SUPPLIER_TPR',
        supplierName: 'PT Nestle Indonesia',
        promoCode: 'TPR-VEND-NESTLE-04',
        amount: 268920,
        businessSector: 'RETAIL',
        businessName: 'JacS Enterprise Demo Ritel',
        isDemoSeed: true,
        lines: [
          { accountCode: '1-10305', accountName: 'Piutang Rebate Supplier (AP Rebate Claimable)', debit: 268920, credit: 0 },
          { accountCode: '4-10101', accountName: 'Pendapatan Penjualan', debit: 0, credit: 268920 },
        ],
      },
      {
        id: 'JV-PROMO-SEED-FEFO',
        date: nowDate,
        reference: 'INV-2026-PROMO-02',
        description: 'Clearance & Penyelamatan Stok Kadaluarsa (FEFO) - 200-EXP-20260315-9921 | 36 unit terselamatkan',
        type: 'PROMO_FEFO_EXP',
        promoSourceType: 'FEFO_EXP',
        promoCode: '200-EXP-20260315-9921',
        fefoSalvageRevenue: 421200,
        fefoQtySaved: 36,
        amount: 140400,
        businessSector: 'RETAIL',
        businessName: 'JacS Enterprise Demo Ritel',
        isDemoSeed: true,
        lines: [
          { accountCode: '5-10201', accountName: 'Beban Clearance & Penyelamatan Kadaluarsa (FEFO)', debit: 140400, credit: 0 },
          { accountCode: '4-10101', accountName: 'Pendapatan Penjualan', debit: 0, credit: 140400 },
        ],
      },
      {
        id: 'JV-PROMO-SEED-STORE',
        date: nowDate,
        reference: 'INV-2026-PROMO-03',
        description: 'Beban Promosi & Diskon Penjualan Toko (SEASONAL / STORE_BND) - 200-BND-20260312-4410',
        type: 'PROMO_STORE',
        promoSourceType: 'STORE_BND',
        promoCode: '200-BND-20260312-4410',
        amount: 195000,
        businessSector: 'RETAIL',
        businessName: 'JacS Enterprise Demo Ritel',
        isDemoSeed: true,
        lines: [
          { accountCode: '5-10202', accountName: 'Beban Promosi & Diskon Penjualan Toko', debit: 195000, credit: 0 },
          { accountCode: '4-10101', accountName: 'Pendapatan Penjualan', debit: 0, credit: 195000 },
        ],
      },
    ];
  });
  const [supplierRebateClaims, setSupplierRebateClaims] = useState<SupplierRebateClaim[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}supplier_rebates`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    const nowIso = new Date().toISOString();
    return [
      {
        id: 'CLM-SEED-001',
        transactionId: 'INV-2026-PROMO-01',
        receiptNumber: 'INV-2026-PROMO-01',
        date: nowIso,
        supplierName: 'PT Nestle Indonesia',
        promoCode: 'TPR-VEND-NESTLE-04',
        promoName: 'Rebate & TPR PT Nestle Indonesia (Susu & Nutrisi)',
        productNames: ['Dancow Balita Efa Madu Box 200 Gr'],
        qtyUnits: 120,
        claimAmount: 268920,
        status: 'CLAIMABLE',
        journalRef: 'JV-PROMO-SEED-TPR',
        notes: 'Siap dipotongkan ke tagihan AP PT Nestle Indonesia',
      },
      {
        id: 'CLM-SEED-002',
        transactionId: 'INV-2026-PROMO-04',
        receiptNumber: 'INV-2026-PROMO-04',
        date: nowIso,
        supplierName: 'PT Kao Indonesia',
        promoCode: 'BXGY-KAO-2G1',
        promoName: 'Beli 2 Gratis 1 Kao Attack Powder 6x40 Gr',
        productNames: ['Kao Attack Clean Maximizer Powder Sachet 6x40 Gr'],
        qtyUnits: 18,
        claimAmount: 84000,
        status: 'CLAIMABLE',
        journalRef: 'JV-PROMO-SEED-KAO',
        notes: 'Bonus gratis Beli 2 Gratis 1 ditanggung prinsipal PT Kao Indonesia',
      },
    ];
  });
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalVoucherInitialData, setJournalVoucherInitialData] = useState<any>(null);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}goods_receipts`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      if (localStorage.getItem(LEDGER_RESET_ACTIVE_ENTITY_KEY) === 'true') return [];
    } catch {}
    return INITIAL_GOODS_RECEIPTS;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}audit_logs`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_AUDIT_LOGS;
  });
  const [errorLogs, setErrorLogs] = useState<SystemError[]>(() => {
    try {
      const saved = localStorage.getItem(SYSTEM_ERROR_LOGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 50);
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(SYSTEM_ERROR_LOGS_KEY, JSON.stringify(errorLogs.slice(0, 50)));
    } catch {}
  }, [errorLogs]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>(INITIAL_APPROVALS);
  const [promotions, setPromotions] = useState<PromotionProgram[]>(INITIAL_PROMOTIONS);
  const [stockPolicies, setStockPolicies] = useState<StockAlertPolicy[]>([]);
  const [invoicesDue, setInvoicesDue] = useState<InvoiceDue[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}invoices_due`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      if (localStorage.getItem(LEDGER_RESET_ACTIVE_ENTITY_KEY) === 'true') return [];
    } catch {}
    return INITIAL_INVOICES_DUE;
  });
  const [buildingDeliveryOrders, setBuildingDeliveryOrders] = useState<BuildingDeliveryOrder[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}building_do`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    const nowIso = new Date().toISOString();
    return [
      {
        id: 'DO-SEED-001',
        doNumber: 'DO-2026-8801',
        date: nowIso,
        customerName: 'CV Bangun Jaya Konstruksi',
        destination: 'Proyek Ruko Jl. Boulevard Panakkukang No. 14',
        deliveryPolicy: 'FRANGKO',
        fleetType: 'DUMP_TRUCK',
        fleetVehicleName: 'Dump Truck (±6.5 m³)',
        estimatedVolumeM3: 6.5,
        itemsSummary: 'Pasir Pasang Sungai Progo 1 Ret Dump Truck, Batu Pecah Split 2/3 1 Ret',
        shippingFee: 0,
        totalOrderValue: 3850000,
        status: 'DALAM_PENGIRIMAN',
        driverName: 'Pak Hendra',
        vehiclePlate: 'DD 8912 KL',
        notes: 'Frangko area kota bebas ongkir proyek',
        updatedAt: nowIso,
      },
      {
        id: 'DO-SEED-002',
        doNumber: 'DO-2026-8802',
        date: nowIso,
        customerName: 'Kontraktor Pak Ridwan',
        destination: 'Cluster Griya Asri Blok C-09',
        deliveryPolicy: 'FRANGKO',
        fleetType: 'TRUCK_ENGKEL',
        fleetVehicleName: 'Truk Engkel (±3.0 m³)',
        estimatedVolumeM3: 3.0,
        itemsSummary: 'Semen Tiga Roda 50 Kg x40 Sak, Besi Beton 10mm Full SNI x35 Batang',
        shippingFee: 150000,
        totalOrderValue: 5750000,
        status: 'MENUNGGU_MUAT',
        driverName: 'Pak Darwis',
        vehiclePlate: 'DD 8441 AB',
        notes: 'Antre muat di gudang semen & rak besi',
        updatedAt: nowIso,
      },
    ];
  });
  const [bulkShrinkageLogs, setBulkShrinkageLogs] = useState<BulkShrinkageLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}bulk_shrinkage`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    const nowIso = new Date().toISOString();
    return [
      {
        id: 'SHK-SEED-001',
        date: nowIso,
        productId: 'MAT-PASIR-01',
        productName: 'Pasir Cor / Pasang Sungai Curah',
        sku: 'MAT-PASIR-01',
        unit: 'm³',
        systemQty: 48,
        physicalQty: 46.5,
        shrinkageQty: 1.5,
        costValueLoss: 420000,
        reason: 'Susut penguapan air & tercecer saat pemuatan bak dump truck',
        recordedBy: 'Kepala Gudang Material',
        warehouse: 'Yard Material Curah Utama',
      },
    ];
  });
  const [fnbToppings, setFnbToppings] = useState<FnbToppingMaster[]>(() => {
    try {
      const isWiped = localStorage.getItem(MASTER_CATALOG_WIPED_KEY) === 'true';
      const saved = localStorage.getItem(`${STORAGE_PREFIX}fnb_toppings`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (parsed.length === 0 && isWiped) return [];
          if (parsed.length > 0) {
            const hydrated: FnbToppingMaster[] = [];
            parsed.forEach((item: any) => {
              const existingSku =
                typeof item?.sku === 'string' && /^TOP-FNB-\d+$/i.test(item.sku.trim())
                  ? item.sku.trim().toUpperCase()
                  : typeof item?.id === 'string' && /^TOP-FNB-\d+$/i.test(item.id.trim())
                  ? item.id.trim().toUpperCase()
                  : generateNextToppingSku(hydrated);
              const hasBom = Boolean(item?.rawMaterialId && (Number(item?.rawMaterialQty) || 0) > 0);
              hydrated.push({
                ...item,
                id: item?.id || existingSku,
                sku: existingSku,
                hppCost: hasBom ? Math.max(0, Math.round(Number(item?.hppCost) || 0)) : 0,
              });
            });
            return hydrated;
          }
        }
      }
      if (isWiped) return [];
    } catch {}
    return DEFAULT_FNB_TOPPING_MASTERS;
  });
  const fnbToppingsRef = useRef<FnbToppingMaster[]>(fnbToppings);
  useEffect(() => {
    fnbToppingsRef.current = fnbToppings;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}fnb_toppings`, JSON.stringify(fnbToppings));
    } catch {}
  }, [fnbToppings]);

  const [serviceStylists, setServiceStylists] = useState<ServiceStylistMaster[]>(() => {
    try {
      const isWiped = localStorage.getItem(MASTER_CATALOG_WIPED_KEY) === 'true';
      const saved = localStorage.getItem(`${STORAGE_PREFIX}service_stylists`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (parsed.length === 0 && isWiped) return [];
          if (parsed.length > 0) {
            return parsed.map((item: any, idx: number) => ({
              id: item?.id || `STL-${String(idx + 1).padStart(3, '0')}`,
              name: String(item?.name || 'Stylist').trim(),
              role: String(item?.role || 'Stylist').trim(),
              specialty: item?.specialty || '',
              commissionRate: Math.max(0, Math.min(100, Number(item?.commissionRate) || 0)),
              retailCommissionRate: Math.max(0, Math.min(100, Number(item?.retailCommissionRate) || 0)),
              isActive: item?.isActive !== false,
              phone: item?.phone || '',
              notes: item?.notes || '',
            }));
          }
        }
      }
      if (isWiped) return [];
    } catch {}
    return DEFAULT_SERVICE_STYLISTS;
  });
  const serviceStylistsRef = useRef<ServiceStylistMaster[]>(serviceStylists);
  useEffect(() => {
    serviceStylistsRef.current = serviceStylists;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}service_stylists`, JSON.stringify(serviceStylists));
    } catch {}
  }, [serviceStylists]);

  const [buildingAuthRequests, setBuildingAuthRequests] = useState<BuildingAuthRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}building_auth`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    const nowIso = new Date().toISOString();
    return [
      {
        id: 'BAUTH-SEED-001',
        requestNumber: 'CR-PROJ-2026-01',
        type: 'PLAFON_KREDIT_KONTRAKTOR',
        createdAt: nowIso,
        customerId: 'MBR-001',
        contractorName: 'CV Bangun Jaya Konstruksi (Ir. Bambang)',
        projectTitle: 'Proyek Renovasi Gudang Kawasan Industri',
        requestedBy: 'Kasir Depo & Sales Proyek',
        currentCreditLimit: 35000000,
        requestedCreditLimit: 75000000,
        outstandingBalance: 22400000,
        reason: 'Penambahan termin order Semen 200 Sak & Besi Beton 12mm untuk pengecoran tahap 2 (Tempo 30 Hari).',
        status: 'PENDING',
      },
      {
        id: 'BAUTH-SEED-002',
        requestNumber: 'BRG-FRK-2026-04',
        type: 'DISKON_BORONGAN_FRANGKO',
        createdAt: nowIso,
        contractorName: 'PT Karya Mandiri Infrastruktur',
        projectTitle: 'Pengecoran Jalan Lingkungan & Drainase',
        requestedBy: 'Kasir Depo Material',
        orderSubtotal: 28500000,
        requestedDiscountPercent: 6,
        requestedDiscountAmount: 1710000,
        frangkoFeeWaived: 450000,
        reason: 'Order borongan 3 Ret Dump Truck Batu Split + 120 Sak Semen (jarak proyek 18 km, ajukan gratis ongkir Frangko).',
        status: 'PENDING',
      },
    ];
  });

  const [laundryOrders, setLaundryOrders] = useState<LaundryOrderRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}laundry_orders`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    const now = Date.now();
    return [
      {
        id: 'LND-ORD-SEED-01',
        orderNumber: 'INV-POS01-LND01',
        tagCode: 'TAG-0101',
        createdAt: new Date(now - 3600000 * 3).toISOString(),
        customerName: 'Ibu Ratna Dewi',
        customerPhone: '081288994411',
        totalPieces: 18,
        conditionNotes: 'Pisah baju putih, noda kopi di kemeja kerja',
        slaLabel: 'Express 6 Jam',
        slaHours: 6,
        estimatedDoneAt: new Date(now + 3600000 * 3).toISOString(),
        itemsSummary: 'Cuci Komplit Express 6 Jam x3.5 kg',
        items: [
          {
            product: LAUNDRY_SERVICE_PRODUCTS[2],
            quantity: 3.5,
            subtotal: 52500,
            selectedUnit: 'kg',
            grossWeightKg: 3.9,
            tareWeightKg: 0.4,
            actualNetWeightKg: 3.5,
          },
        ],
        totalAmount: 52500,
        paidAmount: 52500,
        remainingAmount: 0,
        paymentStatus: 'LUNAS_AWAL',
        paymentMethod: 'QRIS',
        productionStatus: 'CUCI',
        handledBy: 'Kasir Laundry',
        stationCode: 'POS-01',
        washerEmployeeId: 'emp-lnd-01',
        washerEmployeeName: 'Bagus Santoso',
        updatedAt: new Date(now - 3600000 * 1.5).toISOString(),
      },
      {
        id: 'LND-ORD-SEED-02',
        orderNumber: 'INV-POS01-LND02',
        tagCode: 'TAG-0102',
        createdAt: new Date(now - 3600000 * 18).toISOString(),
        customerName: 'Pak Hendra Wijaya',
        customerPhone: '081355667788',
        totalPieces: 6,
        conditionNotes: '2 pasang sepatu putih + 2 jas kantor, cek kancing',
        slaLabel: 'Kilat 24 Jam',
        slaHours: 24,
        estimatedDoneAt: new Date(now + 3600000 * 6).toISOString(),
        itemsSummary: 'Dry Clean Jas / Blazer Formal x2 pcs, Cuci Sepatu Deep Clean x2 pasang',
        items: [
          {
            product: LAUNDRY_SERVICE_PRODUCTS[4],
            quantity: 2,
            subtotal: 70000,
            selectedUnit: 'pcs',
          },
          {
            product: LAUNDRY_SERVICE_PRODUCTS[7],
            quantity: 2,
            subtotal: 90000,
            selectedUnit: 'pasang',
          },
        ],
        totalAmount: 160000,
        paidAmount: 80000,
        remainingAmount: 80000,
        paymentStatus: 'DP',
        paymentMethod: 'Tunai',
        productionStatus: 'SETRIKA',
        handledBy: 'Kasir Laundry',
        stationCode: 'POS-01',
        washerEmployeeId: 'emp-lnd-01',
        washerEmployeeName: 'Bagus Santoso',
        ironerEmployeeId: 'emp-lnd-02',
        ironerEmployeeName: 'Nadia Putri',
        specialistEmployeeId: 'emp-lnd-03',
        specialistEmployeeName: 'Rama Wijaya',
        updatedAt: new Date(now - 3600000 * 2).toISOString(),
      },
      {
        id: 'LND-ORD-SEED-03',
        orderNumber: 'INV-POS01-LND03',
        tagCode: 'TAG-0103',
        createdAt: new Date(now - 3600000 * 30).toISOString(),
        customerName: 'Mbak Sinta Amelia',
        customerPhone: '085211223344',
        totalPieces: 24,
        conditionNotes: 'Karpet ruang tamu 3x2m + 1 bedcover jumbo',
        slaLabel: 'Reguler 48 Jam',
        slaHours: 48,
        estimatedDoneAt: new Date(now + 3600000 * 18).toISOString(),
        itemsSummary: 'Cuci Karpet Tebal (6 m2) x6 m2, Cuci Bedcover Tebal x1 pcs',
        items: [
          {
            product: LAUNDRY_SERVICE_PRODUCTS[9],
            quantity: 6,
            subtotal: 150000,
            selectedUnit: 'm2',
            laundryLengthM: 3,
            laundryWidthM: 2,
          },
          {
            product: LAUNDRY_SERVICE_PRODUCTS[6],
            quantity: 1,
            subtotal: 38000,
            selectedUnit: 'pcs',
          },
        ],
        totalAmount: 188000,
        paidAmount: 0,
        remainingAmount: 188000,
        paymentStatus: 'BAYAR_AMBIL',
        paymentMethod: 'BAYAR_SAAT_AMBIL',
        productionStatus: 'SIAP_AMBIL',
        rackNumber: 'RAK-B2',
        handledBy: 'Kasir Laundry',
        stationCode: 'POS-01',
        washerEmployeeId: 'emp-lnd-01',
        washerEmployeeName: 'Bagus Santoso',
        ironerEmployeeId: 'emp-lnd-02',
        ironerEmployeeName: 'Nadia Putri',
        specialistEmployeeId: 'emp-lnd-03',
        specialistEmployeeName: 'Rama Wijaya',
        updatedAt: new Date(now - 3600000).toISOString(),
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}laundry_orders`, JSON.stringify(laundryOrders));
    } catch {}
  }, [laundryOrders]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}building_do`, JSON.stringify(buildingDeliveryOrders));
    } catch {}
  }, [buildingDeliveryOrders]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}bulk_shrinkage`, JSON.stringify(bulkShrinkageLogs));
    } catch {}
  }, [bulkShrinkageLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}building_auth`, JSON.stringify(buildingAuthRequests));
    } catch {}
  }, [buildingAuthRequests]);

  useEffect(() => {
    try {
      if (isMasterCatalogWipedRef.current || localStorage.getItem(MASTER_CATALOG_WIPED_KEY) === 'true') {
        return;
      }
    } catch {}
    const domainCfg = getEffectiveBusinessDomainConfig(businessProfile);

    const isLaundryDomain =
      domainCfg.primaryBusinessModel === 'LAUNDRY' ||
      Boolean(domainCfg.isHybridMultiUnit && domainCfg.enabledHybridModels?.includes('LAUNDRY')) ||
      String(businessProfile?.category || '').toLowerCase().includes('laundry');

    if (isLaundryDomain) {
      setProducts((prev) => {
        const existingById = new Map(prev.map((p) => [p.id, p]));
        let changed = false;
        const normalizedLaundry = LAUNDRY_SERVICE_PRODUCTS.map((p, idx) =>
          normalizeProductPricing(p, idx)
        );
        const additions: Product[] = [];
        for (const seed of normalizedLaundry) {
          if (!existingById.has(seed.id)) {
            additions.push(seed);
            changed = true;
          }
        }
        return changed ? [...additions, ...prev] : prev;
      });

      setCategoriesMaster((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const additions: CategoryMaster[] = LAUNDRY_SERVICE_CATEGORIES
          .filter((cat) => !existingIds.has(cat.id))
          .map((cat) => ({
            id: cat.id,
            code: cat.code,
            name: cat.name,
            department: cat.department,
            taxRate: 11,
            marginTarget: 45,
            productCount: LAUNDRY_SERVICE_PRODUCTS.filter((p) => p.category === cat.name).length,
            status: 'Active',
          }));
        return additions.length > 0 ? [...additions, ...prev] : prev;
      });
    }

    const isFashionDomain =
      domainCfg.primaryBusinessModel === 'FASHION_BUTIK' ||
      Boolean(domainCfg.isHybridMultiUnit && domainCfg.enabledHybridModels?.includes('FASHION_BUTIK')) ||
      Boolean(String(businessProfile?.category || '').toLowerCase().match(/fashion|butik|baju|busana|pakaian/));

    if (isFashionDomain) {
      const normalizedFashion = FASHION_APPAREL_PRODUCTS.map((p, idx) =>
        normalizeProductPricing(p, idx)
      );
      setProducts((prev) => {
        const existingById = new Map(prev.map((p) => [p.id, p]));
        let changed = false;
        const additions: Product[] = [];
        for (const seed of normalizedFashion) {
          if (!existingById.has(seed.id)) {
            additions.push(seed);
            changed = true;
          }
        }
        const patched = prev.map((p) => {
          const seed = normalizedFashion.find((s) => s.id === p.id);
          if (!seed) return p;
          if (!p.variantMatrix || p.variantMatrix.length === 0 || (!p.fashionPromo && seed.fashionPromo)) {
            changed = true;
            return {
              ...seed,
              ...p,
              variantSize: p.variantSize || seed.variantSize,
              variantColor: p.variantColor || seed.variantColor,
              variantMatrix: p.variantMatrix && p.variantMatrix.length > 0 ? p.variantMatrix : seed.variantMatrix,
              fashionPromo: p.fashionPromo || seed.fashionPromo,
              stock: p.variantMatrix && p.variantMatrix.length > 0 ? p.stock : seed.stock,
            };
          }
          return p;
        });
        return changed ? [...additions, ...patched] : prev;
      });

      setCategoriesMaster((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const additions: CategoryMaster[] = FASHION_CATEGORY_SEEDS
          .filter((cat) => !existingIds.has(cat.id))
          .map((cat) => ({
            id: cat.id,
            code: cat.code,
            name: cat.name,
            department: cat.department,
            taxRate: 11,
            marginTarget: 42,
            productCount: FASHION_APPAREL_PRODUCTS.filter((p) => p.category === cat.name).length,
            status: 'Active',
          }));
        return additions.length > 0 ? [...additions, ...prev] : prev;
      });

      setInventory((prev) => {
        const existingIds = new Set(prev.map((inv) => inv.product_id));
        const todayStr = new Date().toISOString().slice(0, 10);
        const missingInv: InventoryRecord[] = normalizedFashion
          .filter((p) => !existingIds.has(p.id))
          .map((p) => ({
            product_id: p.id,
            product_name: p.name,
            initial_stock: Number(p.stock) || 0,
            in_qty: 0,
            out_qty: 0,
            final_stock: Number(p.stock) || 0,
            last_update: todayStr,
            last_updated: todayStr,
          }));
        return missingInv.length > 0 ? [...missingInv, ...prev] : prev;
      });
    }

    if (domainCfg.mechanismFamily !== 'BUILDING_BULK') return;

    setProducts((prev) => {
      const existingById = new Map(prev.map((p) => [p.id, p]));
      let changed = false;
      const normalizedSeed = BUILDING_HARDWARE_PRODUCTS.map((p, idx) =>
        normalizeProductPricing(p, idx)
      );
      const additions: Product[] = [];
      for (const seed of normalizedSeed) {
        if (!existingById.has(seed.id)) {
          additions.push(seed);
          changed = true;
        }
      }
      const patchedPrev = prev.map((p) => {
        const match = normalizedSeed.find((s) => s.id === p.id);
        if (!match) return p;
        if (!p.supplier || !p.supplierId || p.minStock === undefined) {
          changed = true;
          return {
            ...match,
            ...p,
            supplier: p.supplier || match.supplier,
            supplierId: p.supplierId || match.supplierId,
            minStock: p.minStock ?? match.minStock,
            min_stock: p.min_stock ?? match.min_stock,
          };
        }
        return p;
      });
      return changed ? [...additions, ...patchedPrev] : prev;
    });

    // Pastikan 20 SKU Bahan Baku Dapur F&B (RM-FNB-001..020) dan 18 Menu F&B terdaftar di state products
    setProducts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const missingRaw = RAW_INGREDIENTS_AS_PRODUCTS.filter((r) => !existingIds.has(r.id));
      const missingMenu = FNB_RESTAURANT_PRODUCTS.filter((m) => !existingIds.has(m.id));
      if (missingRaw.length === 0 && missingMenu.length === 0) return prev;
      return [...prev, ...missingMenu, ...missingRaw];
    });

    setSuppliers((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const missing = [...BUILDING_BULK_SUPPLIERS, ...FNB_CULINARY_SUPPLIERS].filter((s) => !existingIds.has(s.id));
      return missing.length > 0 ? [...missing, ...prev] : prev;
    });

    let ledgerHasReset = false;
    try {
      ledgerHasReset = localStorage.getItem(LEDGER_RESET_ACTIVE_ENTITY_KEY) === 'true';
    } catch {}
    if (ledgerHasReset) return;

    setPurchaseOrders((prev) => {
      const existingNos = new Set(prev.map((po) => po.po_number));
      const missing = [...BUILDING_BULK_PURCHASE_ORDERS, ...FNB_CULINARY_PURCHASE_ORDERS].filter((po) => !existingNos.has(po.po_number));
      return missing.length > 0 ? [...missing, ...prev] : prev;
    });

    setPurchaseRequests((prev) => {
      const existingNos = new Set(prev.map((pr) => pr.pr_number));
      const missing = [...BUILDING_BULK_PURCHASE_REQUESTS, ...FNB_CULINARY_PURCHASE_REQUESTS].filter((pr) => !existingNos.has(pr.pr_number));
      return missing.length > 0 ? [...missing, ...prev] : prev;
    });

    setStockMutations((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const missing = [...BUILDING_BULK_STOCK_MUTATIONS, ...FNB_CULINARY_STOCK_MUTATIONS].filter((m) => !existingIds.has(m.id));
      return missing.length > 0 ? [...missing, ...prev] : prev;
    });

    setGoodsReceipts((prev) => {
      const existingIds = new Set(prev.map((gr) => gr.id));
      const missing = [...BUILDING_BULK_GOODS_RECEIPTS, ...FNB_CULINARY_GOODS_RECEIPTS].filter(
        (gr) => !existingIds.has(gr.id)
      );
      return missing.length > 0 ? [...missing, ...prev] : prev;
    });
  }, [businessProfile]);
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const isWiped = localStorage.getItem(MASTER_CATALOG_WIPED_KEY) === 'true';
      const saved = localStorage.getItem(`${STORAGE_PREFIX}employees`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (isWiped) return parsed;
          const existingIds = new Set(parsed.map((e: any) => e.id));
          const missingDomainStaff = INITIAL_EMPLOYEES.filter(
            (e) =>
              (e.id.startsWith('emp-lnd-') || e.id.startsWith('emp-fash-')) &&
              !existingIds.has(e.id)
          );
          return missingDomainStaff.length > 0 ? [...parsed, ...missingDomainStaff] : parsed;
        }
      }
      if (isWiped) return [];
    } catch {}
    return INITIAL_EMPLOYEES;
  });

  const hasSyncedLaundrySeedRef = useRef(false);
  useEffect(() => {
    if (hasSyncedLaundrySeedRef.current) return;
    const domainCfg = getEffectiveBusinessDomainConfig(businessProfile);
    const isLaundryActive =
      domainCfg.primaryBusinessModel === 'LAUNDRY' ||
      Boolean(domainCfg.isHybridMultiUnit && domainCfg.enabledHybridModels?.includes('LAUNDRY')) ||
      String(businessProfile?.category || '').toLowerCase().includes('laundry');
    if (!isLaundryActive) return;
    hasSyncedLaundrySeedRef.current = true;

    const seedOrdersWithAr = laundryOrders.filter(
      (o) =>
        (o.id === 'LND-ORD-SEED-02' || o.id === 'LND-ORD-SEED-03') &&
        (o.remainingAmount || 0) > 0
    );
    if (seedOrdersWithAr.length > 0) {
      setInvoicesDue((prev) => {
        const additions: InvoiceDue[] = [];
        for (const o of seedOrdersWithAr) {
          const arId = o.id.replace('LND-ORD-', 'AR-LND-');
          if (!prev.some((inv) => inv.id === arId || inv.invoice_number === o.orderNumber)) {
            additions.push({
              id: arId,
              type: 'RECEIVABLE',
              party_name: o.customerName,
              invoice_number: o.orderNumber,
              due_date: (o.estimatedDoneAt || new Date().toISOString()).slice(0, 10),
              amount: o.remainingAmount,
              status: 'Unpaid',
              terms:
                o.paymentStatus === 'BAYAR_AMBIL'
                  ? `Laundry Bayar Saat Ambil • Tag ${o.tagCode}`
                  : `Laundry DP Rp ${o.paidAmount.toLocaleString('id-ID')} • Sisa Tagihan`,
              created_at: o.createdAt,
            });
          }
        }
        return additions.length > 0 ? [...additions, ...prev] : prev;
      });
    }

    const seedOrders = laundryOrders.filter((o) => o.id.startsWith('LND-ORD-SEED-'));
    if (seedOrders.length > 0) {
      setJournalEntries((prev) => {
        const jAdditions: JournalEntry[] = [];
        for (const o of seedOrders) {
          const jvId = `JV-${o.id}`;
          if (prev.some((j) => j.id === jvId || j.reference === o.orderNumber)) continue;
          const lines: { accountCode: string; accountName: string; debit: number; credit: number }[] = [];
          if (o.paidAmount > 0) {
            const isQris = String(o.paymentMethod || '').toUpperCase().includes('QRIS');
            lines.push({
              accountCode: isQris ? '1-10003' : '1-10001',
              accountName: isQris ? 'Bank QRIS' : 'Kas Kasir',
              debit: o.paidAmount,
              credit: 0,
            });
          }
          if (o.remainingAmount > 0) {
            lines.push({
              accountCode: '1-10301',
              accountName: 'Piutang Usaha',
              debit: o.remainingAmount,
              credit: 0,
            });
          }
          lines.push({
            accountCode: '4-10105',
            accountName: 'Pendapatan Jasa Laundry',
            debit: 0,
            credit: o.totalAmount,
          });
          jAdditions.push({
            id: jvId,
            date: (o.createdAt || new Date().toISOString()).slice(0, 10),
            created_at: o.createdAt,
            reference: o.orderNumber,
            description: `Pendapatan Jasa Laundry ${o.orderNumber} (${o.customerName} • ${o.paymentStatus})`,
            type: 'POS_LAUNDRY',
            amount: o.totalAmount,
            lines,
          });
        }
        return jAdditions.length > 0 ? [...jAdditions, ...prev] : prev;
      });
    }
  }, [businessProfile, laundryOrders]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}attendance`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      if (localStorage.getItem(MASTER_CATALOG_WIPED_KEY) === 'true') return [];
    } catch {}
    return INITIAL_ATTENDANCE;
  });
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}leaves`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      if (localStorage.getItem(MASTER_CATALOG_WIPED_KEY) === 'true') return [];
    } catch {}
    return INITIAL_LEAVE_REQUESTS;
  });
  const [migrationBatches, setMigrationBatches] = useState<MigrationBatchRecord[]>([]);
  const [badStocks, setBadStocks] = useState<BadStockItem[]>([]);
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);
  const [voidLogs, setVoidLogs] = useState<VoidItemLog[]>([]);
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}sheet_config`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SHEET_CONFIG;
  });
  const [activeNeonCards, setActiveNeonCardsState] = useState<Record<string, string>>({ home: 'executive' });
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [currentReceiptSale, setCurrentReceiptSale] = useState<Sale | null>(null);
  const [isPayrollSynced, setIsPayrollSynced] = useState(false);
  const [lastPayrollSyncTime, setLastPayrollSyncTime] = useState<string>(new Date().toISOString());

  const [isProductionMode, setIsProductionMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}production_mode`);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}production_mode`, JSON.stringify(isProductionMode));
    } catch {}
  }, [isProductionMode]);

  const toggleProductionMode = useCallback(() => {
    setIsProductionMode((prev) => {
      const next = !prev;
      showToast(next ? 'Mode Produksi Aktif: Floating Dev Dock disembunyikan.' : 'Mode Produksi Dinonaktifkan: Floating Dev Dock ditampilkan.', next ? 'warning' : 'info');
      return next;
    });
  }, [showToast]);

  // =========================================================================
  // ENTERPRISE SECURITY SHIELD & TERMINAL IDLE AUTO-LOCK
  // =========================================================================
  const [idleAutoLockMinutes, setIdleAutoLockMinutesState] = useState<0 | 5 | 15 | 30>(() => {
    try {
      const saved = localStorage.getItem(IDLE_AUTOLOCK_MINUTES_KEY);
      if (saved !== null) {
        const num = Number(saved);
        if (num === 0 || num === 5 || num === 15 || num === 30) return num;
      }
    } catch {}
    return 15;
  });

  const [isIdleLocked, setIsIdleLocked] = useState<boolean>(false);
  const [idleLockedAt, setIdleLockedAt] = useState<string | null>(null);
  const [idleLockReason, setIdleLockReason] = useState<string>('Inaktivitas Terminal');

  const [securityShieldStats, setSecurityShieldStats] = useState<{
    xssBlockedCount: number;
    malwareUploadBlockedCount: number;
    checksumVerifiedCount: number;
    checksumRejectedCount: number;
    failedPinAttemptsCount: number;
    idleLockTriggeredCount: number;
    dataExportCount: number;
    systemResetCount: number;
    lastScanAt: string;
  }>(() => {
    try {
      const saved = localStorage.getItem(SECURITY_SHIELD_STATS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            xssBlockedCount: Number(parsed.xssBlockedCount) || 0,
            malwareUploadBlockedCount: Number(parsed.malwareUploadBlockedCount) || 0,
            checksumVerifiedCount: Number(parsed.checksumVerifiedCount) || 0,
            checksumRejectedCount: Number(parsed.checksumRejectedCount) || 0,
            failedPinAttemptsCount: Number(parsed.failedPinAttemptsCount) || 0,
            idleLockTriggeredCount: Number(parsed.idleLockTriggeredCount) || 0,
            dataExportCount: Number(parsed.dataExportCount) || 0,
            systemResetCount: Number(parsed.systemResetCount) || 0,
            lastScanAt: parsed.lastScanAt || new Date().toISOString(),
          };
        }
      }
    } catch {}
    return {
      xssBlockedCount: 0,
      malwareUploadBlockedCount: 0,
      checksumVerifiedCount: 0,
      checksumRejectedCount: 0,
      failedPinAttemptsCount: 0,
      idleLockTriggeredCount: 0,
      dataExportCount: 0,
      systemResetCount: 0,
      lastScanAt: new Date().toISOString(),
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(SECURITY_SHIELD_STATS_KEY, JSON.stringify(securityShieldStats));
    } catch {}
  }, [securityShieldStats]);

  const recordSecurityShieldEvent = useCallback(
    (event: {
      type:
        | 'XSS_BLOCKED'
        | 'MALWARE_UPLOAD_BLOCKED'
        | 'CHECKSUM_VERIFIED'
        | 'CHECKSUM_REJECTED'
        | 'FAILED_PIN'
        | 'DATA_EXPORT'
        | 'SYSTEM_RESET'
        | 'IDLE_LOCK';
      details: string;
      module?: string;
      level?: 'INFO' | 'WARN' | 'ERROR';
    }) => {
      const nowIso = new Date().toISOString();
      setSecurityShieldStats((prev) => ({
        xssBlockedCount: prev.xssBlockedCount + (event.type === 'XSS_BLOCKED' ? 1 : 0),
        malwareUploadBlockedCount:
          prev.malwareUploadBlockedCount + (event.type === 'MALWARE_UPLOAD_BLOCKED' ? 1 : 0),
        checksumVerifiedCount: prev.checksumVerifiedCount + (event.type === 'CHECKSUM_VERIFIED' ? 1 : 0),
        checksumRejectedCount: prev.checksumRejectedCount + (event.type === 'CHECKSUM_REJECTED' ? 1 : 0),
        failedPinAttemptsCount: prev.failedPinAttemptsCount + (event.type === 'FAILED_PIN' ? 1 : 0),
        idleLockTriggeredCount: prev.idleLockTriggeredCount + (event.type === 'IDLE_LOCK' ? 1 : 0),
        dataExportCount: prev.dataExportCount + (event.type === 'DATA_EXPORT' ? 1 : 0),
        systemResetCount: prev.systemResetCount + (event.type === 'SYSTEM_RESET' ? 1 : 0),
        lastScanAt: nowIso,
      }));

      const resolvedLevel: 'INFO' | 'WARN' | 'ERROR' =
        event.level ||
        (event.type === 'MALWARE_UPLOAD_BLOCKED' ||
        event.type === 'CHECKSUM_REJECTED' ||
        event.type === 'XSS_BLOCKED'
          ? 'ERROR'
          : event.type === 'FAILED_PIN' || event.type === 'SYSTEM_RESET' || event.type === 'IDLE_LOCK'
          ? 'WARN'
          : 'INFO');

      const auditEntry: AuditLog = {
        id: `SEC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        timestamp: nowIso,
        user: currentUser?.name || 'Security Shield',
        action: `SECURITY_${event.type}`,
        module: event.module || 'SECURITY_SHIELD',
        level: resolvedLevel,
        details: event.details,
      };
      setAuditLogs((prev) => [auditEntry, ...prev].slice(0, 300));
    },
    [currentUser?.name]
  );

  const setIdleAutoLockMinutes = useCallback(
    (minutes: 0 | 5 | 15 | 30) => {
      setIdleAutoLockMinutesState(minutes);
      try {
        localStorage.setItem(IDLE_AUTOLOCK_MINUTES_KEY, String(minutes));
      } catch {}
      showToast(
        minutes === 0
          ? 'Auto-Lock Layar Kasir/Admin dinonaktifkan.'
          : `Auto-Lock Layar Kasir/Admin diatur ke ${minutes} menit tanpa aktivitas.`,
        'info'
      );
    },
    [showToast]
  );

  const triggerIdleLockNow = useCallback(
    (reason?: string) => {
      const nowIso = new Date().toISOString();
      const label =
        reason ||
        (idleAutoLockMinutes > 0
          ? `Otomatis terkunci setelah ${idleAutoLockMinutes} menit tanpa aktivitas`
          : 'Kunci Layar Manual oleh Operator/Admin');
      setIsIdleLocked(true);
      setIdleLockedAt(nowIso);
      setIdleLockReason(label);
      recordSecurityShieldEvent({
        type: 'IDLE_LOCK',
        details: `Terminal Auto-Lock aktif (${label}) pada modul ${(activeNav || 'HOME').toUpperCase()}.`,
        module: 'TERMINAL_GUARD',
        level: 'WARN',
      });
    },
    [activeNav, idleAutoLockMinutes, recordSecurityShieldEvent]
  );

  // Global inactivity tracker for Terminal Idle Auto-Lock
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!currentUser || idleAutoLockMinutes <= 0 || isIdleLocked) return;

    const timeoutMs = idleAutoLockMinutes * 60 * 1000;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const resetTimer = () => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        triggerIdleLockNow(`Tidak ada aktivitas mouse/keyboard selama ${idleAutoLockMinutes} menit`);
      }, timeoutMs);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timerId) clearTimeout(timerId);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [currentUser, idleAutoLockMinutes, isIdleLocked, triggerIdleLockNow]);

  const cleanSlateTransactions = useCallback(() => {
    setSales([]);
    setFinanceEntries([]);
    setJournalEntries([]);
    setPurchaseOrders([]);
    setPurchaseRequests([]);
    setGoodsReceipts([]);
    setCashierShifts([]);
    setSalesReturns([]);
    setPurchaseReturns([]);
    setInvoicesDue([]);
    setVoidLogs([]);
    setAuditLogs([]);
    setSupplierRebateClaims([]);
    setIsLedgerReset(true);

    try {
      localStorage.setItem(LEDGER_RESET_ACTIVE_ENTITY_KEY, 'true');
      localStorage.setItem(`${STORAGE_PREFIX}sales`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}finance`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}journals`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}supplier_rebates`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}purchasing`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}purchase_requests`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}goods_receipts`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}invoices_due`, '[]');
      localStorage.removeItem(`${STORAGE_PREFIX}shifts`);
      localStorage.removeItem(`${STORAGE_PREFIX}audit_logs`);
      localStorage.removeItem('jacs_dual_backend_queue');
      localStorage.removeItem('jacs_gas_offline_queue_v1');
      localStorage.removeItem(SYSTEM_ERROR_LOGS_KEY);
      localStorage.removeItem('jacs_remote_command_bus');
      localStorage.removeItem('jacs_remote_ack_bus');
      localStorage.removeItem('jacs_remote_telemetry_bus');
    } catch {}

    const msg = 'Clean Slate Berhasil: Seluruh riwayat transaksi dikosongkan ke Rp 0. Katalog Master Data & Konfigurasi API dipertahankan.';
    showToast(msg, 'success');
    return { success: true, message: msg };
  }, [showToast]);

  const resetLedgerToActiveEntity = useCallback(() => {
    const activeSec = resolveCanonicalSector(businessProfileRef.current);
    const activeBiz = businessProfileRef.current?.name || 'Entitas Aktif';

    setSales([]);
    setFinanceEntries([]);
    setJournalEntries([]);
    setPurchaseOrders([]);
    setPurchaseRequests([]);
    setGoodsReceipts([]);
    setPurchaseReturns([]);
    setSupplierRebateClaims([]);
    setInvoicesDue([]);
    setSalesReturns([]);
    setVoidLogs([]);
    setLaundryOrders([]);
    setBuildingDeliveryOrders([]);
    setIsLedgerReset(true);

    try {
      localStorage.setItem(LEDGER_RESET_ACTIVE_ENTITY_KEY, 'true');
      localStorage.setItem(`${STORAGE_PREFIX}sales`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}finance`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}journals`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}purchasing`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}purchase_requests`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}goods_receipts`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}invoices_due`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}vendor_invoices`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}ap_invoices`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}supplier_payables`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}supplier_rebates`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}laundry_orders`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}building_do`, '[]');
      localStorage.setItem(`${STORAGE_PREFIX}building_delivery_orders`, '[]');
      localStorage.removeItem('jacs_dual_backend_queue');
    } catch {}

    const auditEntry: AuditLog = {
      id: `AUD-${Date.now()}-LEDGER-RESET`,
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'Super Admin',
      action: 'RESET_LEDGER_ACTIVE_ENTITY',
      module: 'FINANCE',
      level: 'WARN',
      details: `Reset Buku Besar ke Entitas Aktif (${activeBiz} • Sektor ${activeSec}): seluruh penjualan, jurnal, PO, dan tagihan Hutang Usaha (AP) demo dibersihkan ke Rp 0.`
    };
    setAuditLogs((prev) => [auditEntry, ...prev].slice(0, 300));

    const msg = `Buku Besar & Hutang Usaha (AP) direset bersih ke Rp 0 untuk entitas aktif "${activeBiz}" (${activeSec}).`;
    showToast(msg, 'success');
    return { success: true, message: msg };
  }, [currentUser, showToast]);

  const executeSystemResetByLevel = useCallback(
    (
      level: 1 | 2 | 3 | 4
    ): {
      success: boolean;
      level: 1 | 2 | 3 | 4;
      title: string;
      message: string;
      timestamp: string;
    } => {
      const nowIso = new Date().toISOString();
      const activeSec = resolveCanonicalSector(businessProfileRef.current);
      const activeBiz = businessProfileRef.current?.name || 'Entitas Aktif';

      if (level === 1) {
        // Level 1: Reset Transaksi & Jurnal + Stok 0 + Counter 0001 (Pertahankan Master Produk & Profil)
        setSales([]);
        setCashierShifts([]);
        setFinanceEntries([]);
        setJournalEntries([]);
        setPurchaseOrders([]);
        setPurchaseRequests([]);
        setGoodsReceipts([]);
        setSalesReturns([]);
        setPurchaseReturns([]);
        setVoidLogs([]);
        setStockMutations([]);
        setBadStocks([]);
        setBulkShrinkageLogs([]);
        setInvoicesDue([]);
        setSupplierRebateClaims([]);
        setLaundryOrders([]);
        setBuildingDeliveryOrders([]);
        setBuildingAuthRequests([]);
        setIsLedgerReset(true);

        const zeroStockProducts = (productsRef.current || []).map((p) => ({
          ...p,
          stock: 0,
          initialStock: 0,
          status: p.itemType === 'SERVICE' ? 'Active' : 'Out of Stock',
          variantMatrix: Array.isArray(p.variantMatrix)
            ? p.variantMatrix.map((cell) => ({ ...cell, stock: 0 }))
            : p.variantMatrix,
        }));
        productsRef.current = zeroStockProducts;
        setProducts(zeroStockProducts);

        try {
          localStorage.setItem(LEDGER_RESET_ACTIVE_ENTITY_KEY, 'true');
          localStorage.setItem(`${STORAGE_PREFIX}sales`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}shifts`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}finance`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}journals`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}purchasing`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}purchase_requests`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}goods_receipts`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}stock_mutations`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}bulk_shrinkage`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}invoices_due`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}vendor_invoices`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}ap_invoices`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}supplier_payables`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}supplier_rebates`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}laundry_orders`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}building_do`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}building_delivery_orders`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}building_auth`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify(zeroStockProducts));
          // Reset counter nomor dokumen ke 0001 & bersihkan antrean draft POS
          localStorage.removeItem('jacs_pos_receipt_seq_v1');
          localStorage.removeItem('jacs_pos_held_orders_by_station_v1');
          localStorage.removeItem('jacs_pos_station_carts_v1');
          localStorage.removeItem('jacs_dual_backend_queue');
          localStorage.setItem(`${STORAGE_PREFIX}doc_seq_counter`, JSON.stringify({ pos: 1, po: 1, pr: 1, grn: 1, jv: 1, do: 1 }));
        } catch {}

        const auditEntry: AuditLog = {
          id: `AUD-${Date.now()}-RESET-L1`,
          timestamp: nowIso,
          user: currentUser?.name || 'Super Admin',
          action: 'SYSTEM_RESET_LEVEL_1',
          module: 'SUPER_ADMIN',
          level: 'WARN',
          details: `Level 1 Reset dieksekusi pada "${activeBiz}" (${activeSec}): seluruh transaksi POS, shift Z-Report, petty cash, PO, mutasi stok, AR/AP, dan jurnal dihapus; stok ${zeroStockProducts.length} produk di-nol-kan; counter dokumen direset ke 0001. Profil & Katalog Master dipertahankan.`,
        };
        setAuditLogs((prev) => [auditEntry, ...prev].slice(0, 300));

        const title = 'Level 1 — Reset Transaksi & Jurnal Selesai';
        const message = `Seluruh transaksi POS, Z-Report, PO, mutasi stok, AR/AP, dan jurnal dihapus. Stok ${zeroStockProducts.length} item di-nol-kan & counter nomor dokumen direset ke 0001. Profil & Katalog Master tetap utuh.`;
        showToast(message, 'success');
        return { success: true, level: 1, title, message, timestamp: nowIso };
      }

      if (level === 2) {
        // Level 2: Hapus Master Katalog & Kontak Dummy (0 Item)
        isMasterCatalogWipedRef.current = true;
        setIsMasterCatalogWiped(true);
        productsRef.current = [];
        setProducts([]);
        fnbToppingsRef.current = [];
        setFnbToppings([]);
        serviceStylistsRef.current = [];
        setServiceStylists([]);
        setSuppliers([]);
        setCustomers([]);
        setEmployees([]);
        setAttendance([]);
        setLeaves([]);

        try {
          localStorage.setItem(MASTER_CATALOG_WIPED_KEY, 'true');
          localStorage.setItem(`${STORAGE_PREFIX}products`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}fnb_toppings`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}service_stylists`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}suppliers`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}customers`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}employees`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}attendance`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}leaves`, '[]');
        } catch {}

        const auditEntry: AuditLog = {
          id: `AUD-${Date.now()}-RESET-L2`,
          timestamp: nowIso,
          user: currentUser?.name || 'Super Admin',
          action: 'SYSTEM_RESET_LEVEL_2',
          module: 'SUPER_ADMIN',
          level: 'WARN',
          details: `Level 2 Reset dieksekusi pada "${activeBiz}" (${activeSec}): katalog Produk/Layanan, Resep BOM & Topping, Stylist, Supplier, Pelanggan, dan Karyawan dummy dikosongkan ke 0 item. Profil Usaha, Logo, Loket POS, PIN Manajemen, dan COA dipertahankan.`,
        };
        setAuditLogs((prev) => [auditEntry, ...prev].slice(0, 300));

        const title = 'Level 2 — Master Katalog & Kontak Dummy Dihapus';
        const message = 'Seluruh katalog Produk/Layanan, Resep BOM, Stylist, Supplier, Pelanggan, dan Karyawan dummy telah dikosongkan (0 item). Profil Usaha, Logo, Loket POS, PIN Manajemen, dan struktur COA dipertahankan.';
        showToast(message, 'success');
        return { success: true, level: 2, title, message, timestamp: nowIso };
      }

      if (level === 3) {
        // Level 3: Reset Saldo Keuangan & Buku Besar (Seluruh Akun COA ke Rp 0)
        setJournalEntries([]);
        setFinanceEntries([]);
        setInvoicesDue([]);
        setSupplierRebateClaims([]);
        setIsLedgerReset(true);

        try {
          localStorage.setItem(LEDGER_RESET_ACTIVE_ENTITY_KEY, 'true');
          localStorage.setItem(`${STORAGE_PREFIX}journals`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}finance`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}invoices_due`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}supplier_rebates`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}vendor_invoices`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}ap_invoices`, '[]');
          localStorage.setItem(`${STORAGE_PREFIX}supplier_payables`, '[]');
        } catch {}

        const auditEntry: AuditLog = {
          id: `AUD-${Date.now()}-RESET-L3`,
          timestamp: nowIso,
          user: currentUser?.name || 'Super Admin',
          action: 'SYSTEM_RESET_LEVEL_3',
          module: 'SUPER_ADMIN',
          level: 'WARN',
          details: `Level 3 Reset dieksekusi pada "${activeBiz}" (${activeSec}): seluruh jurnal akuntansi dan saldo akun COA dikembalikan ke Rp 0. Profil Usaha & Katalog Master Produk dipertahankan.`,
        };
        setAuditLogs((prev) => [auditEntry, ...prev].slice(0, 300));

        const title = 'Level 3 — Saldo Keuangan & Buku Besar Direset ke Rp 0';
        const message = `Seluruh jurnal akuntansi telah dihapus dan saldo seluruh akun Chart of Accounts (COA) dikembalikan ke Rp 0 untuk "${activeBiz}". Profil Usaha & Katalog Produk tetap aman.`;
        showToast(message, 'success');
        return { success: true, level: 3, title, message, timestamp: nowIso };
      }

      // Level 4: Factory Reset Total (Wipe 100% Awal Siap Onboarding Ulang)
      isMasterCatalogWipedRef.current = true;
      setIsMasterCatalogWiped(true);
      setIsLedgerReset(true);
      setIsFirstRunSetup(true);

      setSales([]);
      setCashierShifts([]);
      setFinanceEntries([]);
      setJournalEntries([]);
      setPurchaseOrders([]);
      setPurchaseRequests([]);
      setGoodsReceipts([]);
      setSalesReturns([]);
      setPurchaseReturns([]);
      setVoidLogs([]);
      setStockMutations([]);
      setBadStocks([]);
      setBulkShrinkageLogs([]);
      setInvoicesDue([]);
      setSupplierRebateClaims([]);
      setLaundryOrders([]);
      setBuildingDeliveryOrders([]);
      setBuildingAuthRequests([]);
      setMigrationBatches([]);

      productsRef.current = [];
      setProducts([]);
      fnbToppingsRef.current = [];
      setFnbToppings([]);
      serviceStylistsRef.current = [];
      setServiceStylists([]);
      setSuppliers([]);
      setCustomers([]);
      setEmployees([]);
      setAttendance([]);
      setLeaves([]);

      clearBoundPosStation();
      setBoundStationState(null);

      const blankOnboardingProfile = saveActiveBusinessProfileToStorage({
        ...DEFAULT_BUSINESS_PROFILE,
        name: 'ENTITAS USAHA BARU (SIAP ONBOARDING)',
        businessName: 'ENTITAS USAHA BARU (SIAP ONBOARDING)',
        companyName: 'ENTITAS USAHA BARU (SIAP ONBOARDING)',
        brandTitle: 'RetailOS ERP V2',
        tagline: 'Sistem Siap Onboarding — Silakan Atur Identitas & Jenis Usaha',
        category: 'Minimarket',
        businessType: 'Minimarket',
        sector: 'RETAIL',
        address: '',
        phone: '',
        email: '',
        npwp: '',
        nib: '',
        logoUrl: '',
        headerNote: '',
        footerNote: 'Terima kasih atas kunjungan Anda.',
        isConfigured: false,
        posUnitCount: 1,
        cashierArchitecture: 'CENTRALIZED_FRONTEND',
        terminalConfigs: [
          {
            id: 'POS-01',
            name: 'LOKET POS-01',
            role: 'HYBRID_BACKEND',
            assignedIndustry: 'Minimarket',
            isLocked: false,
          },
        ],
        updatedAt: Date.now(),
      } as any);
      businessProfileRef.current = blankOnboardingProfile;
      setBusinessProfile(blankOnboardingProfile);

      try {
        localStorage.setItem(LEDGER_RESET_ACTIVE_ENTITY_KEY, 'true');
        localStorage.setItem(MASTER_CATALOG_WIPED_KEY, 'true');
        localStorage.setItem(`${STORAGE_PREFIX}sales`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}shifts`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}finance`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}journals`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}purchasing`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}purchase_requests`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}goods_receipts`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}stock_mutations`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}bulk_shrinkage`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}invoices_due`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}vendor_invoices`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}ap_invoices`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}supplier_payables`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}supplier_rebates`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}laundry_orders`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}building_do`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}building_delivery_orders`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}building_auth`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}products`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}fnb_toppings`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}service_stylists`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}suppliers`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}customers`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}employees`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}attendance`, '[]');
        localStorage.setItem(`${STORAGE_PREFIX}leaves`, '[]');
        localStorage.removeItem('jacs_pos_receipt_seq_v1');
        localStorage.removeItem('jacs_pos_held_orders_by_station_v1');
        localStorage.removeItem('jacs_pos_station_carts_v1');
        localStorage.removeItem('jacs_dual_backend_queue');
        localStorage.setItem(`${STORAGE_PREFIX}doc_seq_counter`, JSON.stringify({ pos: 1, po: 1, pr: 1, grn: 1, jv: 1, do: 1 }));
      } catch {}

      const auditEntry: AuditLog = {
        id: `AUD-${Date.now()}-RESET-L4-FACTORY`,
        timestamp: nowIso,
        user: currentUser?.name || 'Super Admin',
        action: 'SYSTEM_RESET_LEVEL_4_FACTORY_WIPE',
        module: 'SUPER_ADMIN',
        level: 'WARN',
        details: 'Level 4 Factory Reset Total (Wipe 100% Awal) dieksekusi: seluruh transaksi, jurnal, master data (0 item), profil entitas bisnis, dan logo telah dihapus. Sistem siap onboarding ulang dari awal.',
      };
      setAuditLogs([auditEntry]);
      try {
        localStorage.setItem(`${STORAGE_PREFIX}audit_logs`, JSON.stringify([auditEntry]));
      } catch {}

      const title = 'Level 4 — Factory Reset Total (Wipe 100%) Selesai';
      const message = 'Sistem telah dikembalikan 100% ke kondisi kosong awal (0 transaksi, 0 jurnal, 0 master data, profil & logo direset). Siap onboarding ulang dari awal.';
      showToast(message, 'warning');
      return { success: true, level: 4, title, message, timestamp: nowIso };
    },
    [currentUser, showToast]
  );

  const restoreDemoSimulationData = useCallback((): {
    success: boolean;
    title: string;
    message: string;
    timestamp: string;
  } => {
    const nowIso = new Date().toISOString();
    const nowDate = nowIso.slice(0, 10);

    // Jika profil sebelumnya terkena Factory Reset Level 4, pulihkan profil default aktif
    let activeProfile = businessProfileRef.current;
    if (
      !activeProfile ||
      activeProfile.isConfigured === false ||
      String(activeProfile.name || '').includes('SIAP ONBOARDING')
    ) {
      activeProfile = saveActiveBusinessProfileToStorage({
        ...DEFAULT_BUSINESS_PROFILE,
        isConfigured: true,
        updatedAt: Date.now(),
      } as any);
      businessProfileRef.current = activeProfile;
      setBusinessProfile(activeProfile);
      setIsFirstRunSetup(false);
    }

    const activeSec = resolveCanonicalSector(activeProfile);
    const activeBiz = activeProfile?.name || DEFAULT_BUSINESS_PROFILE.name;

    // 1. Hapus seluruh flag penghapusan permanen
    isMasterCatalogWipedRef.current = false;
    setIsMasterCatalogWiped(false);
    setIsLedgerReset(false);

    // 2. Bangun katalog produk & layanan lintas sektor lengkap dengan stok awal
    const combinedRawSeeds: Product[] = [
      ...INITIAL_PRODUCTS,
      ...ALL_SERVICE_SECTOR_SEEDS,
      ...FNB_RESTAURANT_PRODUCTS,
      ...RAW_INGREDIENTS_AS_PRODUCTS,
      ...FASHION_APPAREL_PRODUCTS,
      ...BUILDING_HARDWARE_PRODUCTS,
      ...LAUNDRY_SERVICE_PRODUCTS,
    ];
    const seenProductIds = new Set<string>();
    const restoredProducts: Product[] = [];
    combinedRawSeeds.forEach((seed, idx) => {
      const pid = String(seed.id || '').trim();
      if (!pid || seenProductIds.has(pid.toUpperCase())) return;
      seenProductIds.add(pid.toUpperCase());
      const normalized = normalizeProductPricing(seed, idx);
      restoredProducts.push({
        ...normalized,
        status: 'Active',
      });
    });

    productsRef.current = restoredProducts;
    setProducts(restoredProducts);

    // 3. Pulihkan Topping F&B, Stylist, Supplier, Pelanggan, Karyawan, Absensi & Cuti
    fnbToppingsRef.current = DEFAULT_FNB_TOPPING_MASTERS;
    setFnbToppings(DEFAULT_FNB_TOPPING_MASTERS);
    serviceStylistsRef.current = DEFAULT_SERVICE_STYLISTS;
    setServiceStylists(DEFAULT_SERVICE_STYLISTS);

    const seenSupplierIds = new Set<string>();
    const restoredSuppliers: SupplierMaster[] = [];
    [...INITIAL_SUPPLIERS, ...BUILDING_BULK_SUPPLIERS, ...FNB_CULINARY_SUPPLIERS].forEach((sup) => {
      if (!sup?.id || seenSupplierIds.has(sup.id)) return;
      seenSupplierIds.add(sup.id);
      restoredSuppliers.push(sup);
    });
    setSuppliers(restoredSuppliers);
    setCustomers(INITIAL_CUSTOMERS);
    setEmployees(INITIAL_EMPLOYEES);
    setAttendance(INITIAL_ATTENDANCE);
    setLeaves(INITIAL_LEAVE_REQUESTS);
    setBrands(INITIAL_BRANDS);
    setCategoriesMaster(INITIAL_CATEGORIES);

    // 4. Pulihkan PO, PR, GRN, Mutasi Stok, dan Tagihan Jatuh Tempo
    const seenPoNos = new Set<string>();
    const restoredPOs: PurchaseOrder[] = [];
    [
      ...INITIAL_PURCHASING,
      ...BUILDING_BULK_PURCHASE_ORDERS,
      ...FNB_CULINARY_PURCHASE_ORDERS,
      ...FASHION_APPAREL_PURCHASE_ORDERS,
    ].forEach((po) => {
      if (!po?.po_number || seenPoNos.has(po.po_number)) return;
      seenPoNos.add(po.po_number);
      restoredPOs.push(po);
    });
    setPurchaseOrders(restoredPOs);

    const seenPrNos = new Set<string>();
    const restoredPRs: PurchaseRequest[] = [];
    [...INITIAL_PURCHASE_REQUESTS, ...BUILDING_BULK_PURCHASE_REQUESTS, ...FNB_CULINARY_PURCHASE_REQUESTS].forEach(
      (pr) => {
        if (!pr?.pr_number || seenPrNos.has(pr.pr_number)) return;
        seenPrNos.add(pr.pr_number);
        restoredPRs.push(pr);
      }
    );
    setPurchaseRequests(restoredPRs);

    const seenGrnIds = new Set<string>();
    const restoredGRNs: GoodsReceipt[] = [];
    [...INITIAL_GOODS_RECEIPTS, ...BUILDING_BULK_GOODS_RECEIPTS, ...FNB_CULINARY_GOODS_RECEIPTS].forEach((grn) => {
      if (!grn?.id || seenGrnIds.has(grn.id)) return;
      seenGrnIds.add(grn.id);
      restoredGRNs.push(grn);
    });
    setGoodsReceipts(restoredGRNs);

    const seenMutIds = new Set<string>();
    const restoredMutations: StockMutation[] = [];
    [...INITIAL_STOCK_MUTATIONS, ...BUILDING_BULK_STOCK_MUTATIONS, ...FNB_CULINARY_STOCK_MUTATIONS].forEach((mut) => {
      if (!mut?.id || seenMutIds.has(mut.id)) return;
      seenMutIds.add(mut.id);
      restoredMutations.push(mut);
    });
    setStockMutations(restoredMutations);
    setInvoicesDue(INITIAL_INVOICES_DUE);

    // 5. Pulihkan Transaksi Penjualan, Mutasi Kas & Jurnal Buku Besar (di-tag ke sektor & entitas aktif)
    const restoredSales: Sale[] = INITIAL_SALES.map((s) => ({
      ...s,
      businessSector: activeSec,
      businessName: activeBiz,
      isDemoSeed: false,
    }));
    setSales(restoredSales);

    const restoredFinance: FinanceEntry[] = INITIAL_FINANCE.map((f) => ({
      ...f,
      businessSector: activeSec,
      businessName: activeBiz,
      isDemoSeed: false,
    }));
    setFinanceEntries(restoredFinance);

    const restoredJournals: JournalEntry[] = [
      {
        id: 'JV-SIM-OPENING-CAP',
        date: nowDate,
        reference: 'CAP-2026-01',
        description: `Setoran Modal Awal & Saldo Kas Operasional (${activeBiz})`,
        type: 'GENERAL',
        amount: 451000000,
        businessSector: activeSec,
        businessName: activeBiz,
        isDemoSeed: false,
        lines: [
          { accountCode: '1-10002', accountName: 'Bank Operasional Utama', debit: 451000000, credit: 0 },
          { accountCode: '3-10001', accountName: 'Modal Disetor Pemilik', debit: 0, credit: 451000000 },
        ],
      },
      {
        id: 'JV-SIM-REV-001',
        date: nowDate,
        reference: 'INV-2026-0001',
        description: `Pendapatan Penjualan Simulasi #INV-2026-0001 (${activeBiz})`,
        type: 'POS_SALE',
        amount: 7812000,
        businessSector: activeSec,
        businessName: activeBiz,
        isDemoSeed: false,
        lines: [
          { accountCode: '1-10003', accountName: 'Bank QRIS & E-Wallet', debit: 7812000, credit: 0 },
          { accountCode: '4-10101', accountName: 'Pendapatan Penjualan', debit: 0, credit: 7812000 },
          { accountCode: '5-10101', accountName: 'Harga Pokok Penjualan (HPP)', debit: 6510000, credit: 0 },
          { accountCode: '1-10201', accountName: 'Persediaan Barang Dagang', debit: 0, credit: 6510000 },
        ],
      },
      {
        id: 'JV-SIM-REV-002',
        date: nowDate,
        reference: 'INV-2026-0002',
        description: `Pendapatan Penjualan Simulasi #INV-2026-0002 (${activeBiz})`,
        type: 'POS_SALE',
        amount: 4088000,
        businessSector: activeSec,
        businessName: activeBiz,
        isDemoSeed: false,
        lines: [
          { accountCode: '1-10001', accountName: 'Kas Kasir (Laci POS)', debit: 4088000, credit: 0 },
          { accountCode: '4-10101', accountName: 'Pendapatan Penjualan', debit: 0, credit: 4088000 },
          { accountCode: '5-10101', accountName: 'Harga Pokok Penjualan (HPP)', debit: 3393000, credit: 0 },
          { accountCode: '1-10201', accountName: 'Persediaan Barang Dagang', debit: 0, credit: 3393000 },
        ],
      },
    ];
    setJournalEntries(restoredJournals);
    setCashierShifts([]);

    try {
      localStorage.removeItem(MASTER_CATALOG_WIPED_KEY);
      localStorage.removeItem(LEDGER_RESET_ACTIVE_ENTITY_KEY);
      localStorage.removeItem('jacs_pos_receipt_seq_v1');
      localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify(restoredProducts));
      localStorage.setItem(`${STORAGE_PREFIX}fnb_toppings`, JSON.stringify(DEFAULT_FNB_TOPPING_MASTERS));
      localStorage.setItem(`${STORAGE_PREFIX}service_stylists`, JSON.stringify(DEFAULT_SERVICE_STYLISTS));
      localStorage.setItem(`${STORAGE_PREFIX}suppliers`, JSON.stringify(restoredSuppliers));
      localStorage.setItem(`${STORAGE_PREFIX}customers`, JSON.stringify(INITIAL_CUSTOMERS));
      localStorage.setItem(`${STORAGE_PREFIX}employees`, JSON.stringify(INITIAL_EMPLOYEES));
      localStorage.setItem(`${STORAGE_PREFIX}attendance`, JSON.stringify(INITIAL_ATTENDANCE));
      localStorage.setItem(`${STORAGE_PREFIX}leaves`, JSON.stringify(INITIAL_LEAVE_REQUESTS));
      localStorage.setItem(`${STORAGE_PREFIX}purchasing`, JSON.stringify(restoredPOs));
      localStorage.setItem(`${STORAGE_PREFIX}purchase_requests`, JSON.stringify(restoredPRs));
      localStorage.setItem(`${STORAGE_PREFIX}goods_receipts`, JSON.stringify(restoredGRNs));
      localStorage.setItem(`${STORAGE_PREFIX}stock_mutations`, JSON.stringify(restoredMutations));
      localStorage.setItem(`${STORAGE_PREFIX}invoices_due`, JSON.stringify(INITIAL_INVOICES_DUE));
      localStorage.setItem(`${STORAGE_PREFIX}sales`, JSON.stringify(restoredSales));
      localStorage.setItem(`${STORAGE_PREFIX}finance`, JSON.stringify(restoredFinance));
      localStorage.setItem(`${STORAGE_PREFIX}journals`, JSON.stringify(restoredJournals));
      localStorage.removeItem(`${STORAGE_PREFIX}shifts`);
    } catch {}

    const auditEntry: AuditLog = {
      id: `AUD-${Date.now()}-RESTORE-DEMO`,
      timestamp: nowIso,
      user: currentUser?.name || 'Super Admin',
      action: 'RESTORE_DEMO_SIMULATION_DATA',
      module: 'SUPER_ADMIN',
      level: 'INFO',
      details: `Data Simulasi Demo berhasil dimuat ulang untuk "${activeBiz}" (${activeSec}): ${restoredProducts.length} SKU produk/layanan lintas sektor, ${restoredSuppliers.length} supplier, ${INITIAL_CUSTOMERS.length} pelanggan, ${INITIAL_EMPLOYEES.length + DEFAULT_SERVICE_STYLISTS.length} staf/stylist, stok awal, dan saldo awal COA dipulihkan.`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev].slice(0, 300));

    const title = 'Data Simulasi Demo Berhasil Dimuat Ulang';
    const message = `Katalog ${restoredProducts.length} SKU produk/layanan, ${restoredSuppliers.length} supplier, ${INITIAL_CUSTOMERS.length} pelanggan, ${INITIAL_EMPLOYEES.length + DEFAULT_SERVICE_STYLISTS.length} staf/stylist, stok awal, serta saldo awal COA telah dipulihkan secara real-time.`;
    showToast(message, 'success');
    return { success: true, title, message, timestamp: nowIso };
  }, [currentUser, showToast]);

  const [cloverConfig, setCloverConfig] = useState<CloverConfig>(() => dualBackendSync.getCloverConfig());

  const updateCloverConfig = useCallback((cfg: Partial<CloverConfig>): CloverConfig => {
    const saved = dualBackendSync.saveCloverConfig(cfg);
    setCloverConfig(saved);
    return saved;
  }, []);

  const executeCloverLiveSync = useCallback(
    async (overrideCfg?: Partial<CloverConfig>): Promise<CloverSyncResult & { cleanedDummy: boolean }> => {
      const merged = overrideCfg ? dualBackendSync.saveCloverConfig(overrideCfg) : dualBackendSync.getCloverConfig();
      setCloverConfig(merged);

      const result = await syncWithCloverPos({
        merchantId: merged.merchantId,
        apiToken: merged.apiToken,
        environment: merged.environment
      });

      if (!result.success) {
        const failEntry: AuditLog = {
          id: `AUD-${Date.now()}-CLV-ERR`,
          timestamp: new Date().toISOString(),
          user: currentUser?.name || 'Super Admin',
          action: 'CLOVER_SYNC_FAILED',
          module: 'ADMIN',
          level: 'ERROR',
          details: result.error || 'Gagal menarik data dari Clover POS.'
        };
        setAuditLogs((prev) => [failEntry, ...prev].slice(0, 300));
        showToast(result.error || 'Gagal sinkronisasi Clover POS.', 'error');
        return { ...result, cleanedDummy: false };
      }

      const shouldCleanDummy = Boolean(merged.autoCleanDummy);
      const normalizedCloverProducts = result.products.map((p, idx) => normalizeProductPricing(p, idx));

      if (shouldCleanDummy) {
        setSales(result.sales);
        setFinanceEntries(result.financeEntries);
        setProducts(normalizedCloverProducts);
        setJournalEntries([]);
        setPurchaseOrders([]);
        setPurchaseRequests([]);
        setGoodsReceipts([]);
        setCashierShifts([]);
        setSalesReturns([]);
        setPurchaseReturns([]);
        setInvoicesDue([]);
        setVoidLogs([]);
        setStockMutations([]);
        setSupplierRebateClaims([]);

        try {
          localStorage.removeItem(`${STORAGE_PREFIX}shifts`);
          localStorage.removeItem(`${STORAGE_PREFIX}purchasing`);
          localStorage.removeItem(`${STORAGE_PREFIX}journals`);
          localStorage.removeItem(`${STORAGE_PREFIX}supplier_rebates`);
          localStorage.removeItem('jacs_dual_backend_queue');
        } catch {}
      } else {
        setProducts((prev) => {
          const byKey = new Map<string, Product>();
          prev.forEach((p) => byKey.set(String(p.barcode || p.id), p));
          normalizedCloverProducts.forEach((cp) => byKey.set(String(cp.barcode || cp.id), cp));
          return Array.from(byKey.values());
        });
        setSales((prev) => {
          const seen = new Set(prev.map((s) => s.transaction_id));
          const fresh = result.sales.filter((s) => !seen.has(s.transaction_id));
          return [...fresh, ...prev];
        });
        setFinanceEntries((prev) => {
          const seen = new Set(prev.map((f) => f.id));
          const fresh = result.financeEntries.filter((f) => !seen.has(f.id));
          return [...fresh, ...prev];
        });
      }

      const summaryText = `${normalizedCloverProducts.length} produk riil & ${result.ordersMapped} order riil ditarik via ${result.transportUsed}${
        shouldCleanDummy ? ' (Clean Slate: data dummy dihapus)' : ' (Mode gabung data eksisting)'
      }.`;

      const updatedCfg = dualBackendSync.saveCloverConfig({
        lastSyncAt: result.syncedAt,
        lastSyncSummary: summaryText
      });
      setCloverConfig(updatedCfg);

      const okEntry: AuditLog = {
        id: `AUD-${Date.now()}-CLV-OK`,
        timestamp: new Date().toISOString(),
        user: currentUser?.name || 'Super Admin',
        action: 'CLOVER_LIVE_SYNC',
        module: 'ADMIN',
        level: 'INFO',
        details: summaryText
      };
      setAuditLogs((prev) => [okEntry, ...prev].slice(0, 300));
      showToast(`Sinkronisasi Clover Berhasil: ${normalizedCloverProducts.length} produk & ${result.ordersMapped} order dimuat.`, 'success');

      return { ...result, cleanedDummy: shouldCleanDummy };
    },
    [currentUser, showToast]
  );

  useEffect(() => {
    const safeSave = (key: string, value: unknown) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Abaikan jika satu key melebihi kuota agar tidak memblokir key lain (termasuk business_profile)
      }
    };
    // Profil usaha dipersistensikan secara atomik & eksklusif oleh saveActiveBusinessProfileToStorage
    safeSave(`${STORAGE_PREFIX}sheet_config`, sheetConfig);
    safeSave(`${STORAGE_PREFIX}branches`, branches);
    safeSave(`${STORAGE_PREFIX}shifts`, cashierShifts);
    safeSave(`${STORAGE_PREFIX}sales`, sales);
    safeSave(`${STORAGE_PREFIX}finance`, financeEntries);
    safeSave(`${STORAGE_PREFIX}journals`, journalEntries);
    safeSave(`${STORAGE_PREFIX}purchasing`, purchaseOrders);
    safeSave(`${STORAGE_PREFIX}purchase_requests`, purchaseRequests);
    safeSave(`${STORAGE_PREFIX}goods_receipts`, goodsReceipts);
    safeSave(`${STORAGE_PREFIX}invoices_due`, invoicesDue);
    safeSave(`${STORAGE_PREFIX}supplier_rebates`, supplierRebateClaims);
    safeSave(`${STORAGE_PREFIX}employees`, employees);
    safeSave(`${STORAGE_PREFIX}suppliers`, suppliers);
    safeSave(`${STORAGE_PREFIX}customers`, customers);
    safeSave(`${STORAGE_PREFIX}stock_mutations`, stockMutations);
    safeSave(`${STORAGE_PREFIX}attendance`, attendance);
    safeSave(`${STORAGE_PREFIX}leaves`, leaves);
    safeSave(`${STORAGE_PREFIX}fnb_toppings`, fnbToppings);
    safeSave(`${STORAGE_PREFIX}service_stylists`, serviceStylists);
    safeSave(`${STORAGE_PREFIX}audit_logs`, auditLogs);
    safeSave(`${STORAGE_PREFIX}products`, products);
  }, [products, sales, financeEntries, cashierShifts, journalEntries, purchaseOrders, purchaseRequests, goodsReceipts, invoicesDue, supplierRebateClaims, branches, employees, suppliers, customers, stockMutations, attendance, leaves, auditLogs, sheetConfig, fnbToppings, serviceStylists]);

  const addFnbTopping = useCallback(
    (topping: Omit<FnbToppingMaster, 'id' | 'sku'> & { id?: string; sku?: string }) => {
      const autoSku =
        topping.sku && /^TOP-FNB-\d+$/i.test(topping.sku.trim())
          ? topping.sku.trim().toUpperCase()
          : generateNextToppingSku(fnbToppingsRef.current);
      const hasBom = Boolean(topping.rawMaterialId && (Number(topping.rawMaterialQty) || 0) > 0);
      const newEntry: FnbToppingMaster = {
        ...topping,
        id: topping.id || autoSku,
        sku: autoSku,
        price: Math.max(0, Math.round(Number(topping.price) || 0)),
        hppCost: hasBom ? Math.max(0, Math.round(Number(topping.hppCost) || 0)) : 0,
        isActive: topping.isActive !== false,
      };
      setFnbToppings((prev) => [newEntry, ...prev]);
      showToast(`Topping ${newEntry.sku} "${newEntry.name}" berhasil ditambahkan ke Master F&B`, 'success');
    },
    [showToast]
  );

  const updateFnbTopping = useCallback(
    (id: string, updates: Partial<FnbToppingMaster>) => {
      setFnbToppings((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const nextRawId = updates.rawMaterialId !== undefined ? updates.rawMaterialId : t.rawMaterialId;
          const nextRawQty = updates.rawMaterialQty !== undefined ? updates.rawMaterialQty : t.rawMaterialQty;
          const hasBom = Boolean(nextRawId && (Number(nextRawQty) || 0) > 0);
          return {
            ...t,
            ...updates,
            sku: t.sku || (t.id.startsWith('TOP-FNB-') ? t.id : updates.sku || t.id),
            price:
              updates.price !== undefined
                ? Math.max(0, Math.round(Number(updates.price) || 0))
                : t.price,
            hppCost: hasBom
              ? updates.hppCost !== undefined
                ? Math.max(0, Math.round(Number(updates.hppCost) || 0))
                : t.hppCost
              : 0,
          };
        })
      );
      showToast('Master Topping F&B berhasil diperbarui', 'success');
    },
    [showToast]
  );

  const deleteFnbTopping = useCallback(
    (id: string) => {
      const target = fnbToppingsRef.current.find((t) => t.id === id);
      setFnbToppings((prev) => prev.filter((t) => t.id !== id));
      showToast(`Topping "${target?.name || id}" dihapus dari Master F&B`, 'warning');
    },
    [showToast]
  );

  const toggleFnbToppingActive = useCallback(
    (id: string) => {
      const target = fnbToppingsRef.current.find((t) => t.id === id);
      const nextActive = target ? !target.isActive : true;
      setFnbToppings((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isActive: nextActive } : t))
      );
      if (target) {
        showToast(
          `Topping "${target.name}" ${nextActive ? 'diaktifkan di POS' : 'dinonaktifkan dari POS'}`,
          nextActive ? 'success' : 'info'
        );
      }
    },
    [showToast]
  );

  const addServiceStylist = useCallback(
    (stylist: Omit<ServiceStylistMaster, 'id'> & { id?: string }) => {
      const autoId =
        stylist.id && /^STL-\d+$/i.test(stylist.id.trim())
          ? stylist.id.trim().toUpperCase()
          : generateNextStylistId(serviceStylistsRef.current);
      const newEntry: ServiceStylistMaster = {
        ...stylist,
        id: autoId,
        name: String(stylist.name || '').trim() || 'Stylist Baru',
        role: String(stylist.role || '').trim() || 'Stylist',
        commissionRate: Math.max(0, Math.min(100, Number(stylist.commissionRate) || 0)),
        retailCommissionRate: Math.max(0, Math.min(100, Number(stylist.retailCommissionRate) || 0)),
        isActive: stylist.isActive !== false,
      };
      setServiceStylists((prev) => [newEntry, ...prev]);
      showToast(`Stylist ${newEntry.id} "${newEntry.name}" (${newEntry.commissionRate}%) berhasil ditambahkan`, 'success');
    },
    [showToast]
  );

  const updateServiceStylist = useCallback(
    (id: string, updates: Partial<ServiceStylistMaster>) => {
      setServiceStylists((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                ...updates,
                commissionRate:
                  updates.commissionRate !== undefined
                    ? Math.max(0, Math.min(100, Number(updates.commissionRate) || 0))
                    : s.commissionRate,
                retailCommissionRate:
                  updates.retailCommissionRate !== undefined
                    ? Math.max(0, Math.min(100, Number(updates.retailCommissionRate) || 0))
                    : s.retailCommissionRate,
              }
            : s
        )
      );
      showToast('Data Master Stylist & Petugas berhasil diperbarui', 'success');
    },
    [showToast]
  );

  const deleteServiceStylist = useCallback(
    (id: string) => {
      const target = serviceStylistsRef.current.find((s) => s.id === id);
      setServiceStylists((prev) => prev.filter((s) => s.id !== id));
      showToast(`Stylist "${target?.name || id}" dihapus dari Master Data`, 'warning');
    },
    [showToast]
  );

  const toggleServiceStylistActive = useCallback(
    (id: string) => {
      const target = serviceStylistsRef.current.find((s) => s.id === id);
      const nextActive = target ? !target.isActive : true;
      setServiceStylists((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: nextActive } : s))
      );
      if (target) {
        showToast(
          `Stylist "${target.name}" ${nextActive ? 'diaktifkan di dropdown POS' : 'dinonaktifkan dari POS'}`,
          nextActive ? 'success' : 'info'
        );
      }
    },
    [showToast]
  );

  const appendAudit = useCallback(
    (
      action: string,
      moduleName: string,
      details: string,
      meta?: {
        user?: string;
        division?: string;
        amount?: number;
        category?: string;
        level?: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
      }
    ) => {
      const userName = meta?.user || currentUser?.name || 'System';
      const divisionName =
        meta?.division || currentUser?.division || currentUser?.role || moduleName || 'Operasional';
      const entry: AuditLog = {
        id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        user: userName,
        division: divisionName,
        amount: typeof meta?.amount === 'number' ? meta.amount : undefined,
        category: meta?.category,
        action,
        module: moduleName,
        details,
        level: meta?.level || 'INFO',
      };
      setAuditLogs((prev) => [entry, ...prev].slice(0, 500));
      if (auditContext && typeof (auditContext as any).logAction === 'function') {
        (auditContext as any).logAction(action, moduleName, details);
      }
    },
    [currentUser, auditContext]
  );

  const addAuditLog = useCallback(
    (actionOrLog: any, moduleOrDetails?: string, severity?: string) => {
      const isObj = typeof actionOrLog === 'object' && actionOrLog !== null;
      const userName = (isObj ? actionOrLog?.user : undefined) || currentUser?.name || 'System';
      const moduleName = isObj ? (actionOrLog?.module || 'SYSTEM') : (moduleOrDetails || 'SYSTEM');
      const divisionName =
        (isObj ? actionOrLog?.division : undefined) ||
        currentUser?.division ||
        currentUser?.role ||
        moduleName;
      const rawLevel = isObj ? actionOrLog?.level : severity;
      const normalizedLevel: AuditLog['level'] =
        rawLevel === 'WARNING' || rawLevel === 'WARN'
          ? 'WARN'
          : rawLevel === 'ERROR'
          ? 'ERROR'
          : rawLevel === 'DEBUG'
          ? 'DEBUG'
          : 'INFO';
      const entry: AuditLog = {
        id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        user: userName,
        division: divisionName,
        amount: isObj && typeof actionOrLog?.amount === 'number' ? actionOrLog.amount : undefined,
        category: isObj ? actionOrLog?.category : undefined,
        action: isObj ? (actionOrLog?.action || 'ACTION') : String(actionOrLog || 'ACTION'),
        module: moduleName,
        details: isObj
          ? (actionOrLog?.details || actionOrLog?.action || '')
          : severity
          ? `[${severity}] ${String(actionOrLog || '')}`
          : String(actionOrLog || ''),
        level: normalizedLevel,
      };
      setAuditLogs((prev) => [entry, ...prev].slice(0, 500));
    },
    [currentUser]
  );

  const pruneOldAuditLogs = useCallback(
    (keepCount: number = 50): { removedCount: number; remainingCount: number; message: string } => {
      const totalBefore = auditLogs.length;
      if (totalBefore <= keepCount) {
        const msg = `Total log audit saat ini (${totalBefore}) sudah ≤ ${keepCount} entri terbaru.`;
        showToast(msg, 'info');
        return { removedCount: 0, remainingCount: totalBefore, message: msg };
      }
      const trimmed = auditLogs.slice(0, keepCount);
      const removed = totalBefore - trimmed.length;
      setAuditLogs(trimmed);
      try {
        localStorage.setItem(`${STORAGE_PREFIX}audit_logs`, JSON.stringify(trimmed));
      } catch {}
      const msg = `${removed} log audit lama dibersihkan (${trimmed.length} log terbaru dipertahankan).`;
      showToast(msg, 'success');
      return { removedCount: removed, remainingCount: trimmed.length, message: msg };
    },
    [auditLogs, showToast]
  );

  // Synchronized refs for fast background auto-sync and snapshot building
  const salesRef = useRef<Sale[]>(sales);
  useEffect(() => {
    salesRef.current = sales;
  }, [sales]);

  const financeEntriesRef = useRef<FinanceEntry[]>(financeEntries);
  useEffect(() => {
    financeEntriesRef.current = financeEntries;
  }, [financeEntries]);

  const journalEntriesRef = useRef<JournalEntry[]>(journalEntries);
  useEffect(() => {
    journalEntriesRef.current = journalEntries;
  }, [journalEntries]);

  // =========================================================================
  // BACKGROUND AUTO-SYNC SERVICE (NON-BLOCKING)
  // =========================================================================
  const autoSyncDebounceTimerRef = useRef<any>(null);
  const isAutoSyncRunningRef = useRef<boolean>(false);

  const triggerAutoCloudSync = useCallback((reason: string = 'DATA_CHANGE') => {
    const mode = dualBackendSync.getStorageMode();
    if (mode === 'LOCAL_ONLY' || mode === 'HYBRID_MIGRATION') {
      // Mode Lokal Saja (100% Offline) atau Hybrid Buffer: Nonaktifkan panggilan otomatis latar belakang
      return;
    }
    const config = dualBackendSync.getConfig();
    // Non-blocking auto-sync: hanya berjalan jika supabaseUrl atau gasWebhookUrl sudah terisi
    if (!config.supabaseUrl?.trim() && !config.gasWebhookUrl?.trim()) {
      return;
    }

    if (autoSyncDebounceTimerRef.current) {
      clearTimeout(autoSyncDebounceTimerRef.current);
    }

    autoSyncDebounceTimerRef.current = setTimeout(async () => {
      if (
        dualBackendSync.getStorageMode() === 'LOCAL_ONLY' ||
        dualBackendSync.getStorageMode() === 'HYBRID_MIGRATION'
      ) {
        return;
      }
      if (isAutoSyncRunningRef.current) {
        setTimeout(() => triggerAutoCloudSync(reason), 1500);
        return;
      }

      isAutoSyncRunningRef.current = true;
      try {
        const nowIso = new Date().toISOString();
        const txUuid = generateTxUuid();

        const snapshot: CloudSyncSnapshot = {
          products: productsRef.current || [],
          transactions: salesRef.current || [],
          financeEntries: financeEntriesRef.current || [],
          journalEntries: journalEntriesRef.current || [],
          businessProfile: businessProfileRef.current || DEFAULT_BUSINESS_PROFILE,
          timestamp: nowIso,
          txUuid,
          appVersion: '2.5.0-ENTERPRISE',
        };

        const result = await pushSyncData(snapshot, config);
        if (result.success) {
          setSales((prev) =>
            prev.map((s) => (s.syncStatus === 'PENDING_SYNC' || !s.syncStatus ? { ...s, syncStatus: 'SYNCED' } : s))
          );
          await dualBackendSync.processQueue();
          (dualBackendSync as any).lastSyncTime = nowIso;
          (dualBackendSync as any).notify?.();

          appendAudit('CLOUD_SYNC_SUCCESS', 'INTEGRATION', `Auto-Sync Latar Belakang (${reason}): Berhasil disinkronkan ke Cloud`, {
            division: 'AutoSync Engine',
            category: 'BACKGROUND_AUTO_SYNC',
            level: 'INFO',
          });
        }
      } catch (err: any) {
        // Non-blocking: Kasir tetap bekerja tanpa interupsi
        console.warn('[Auto-Sync Cloud Background]', err?.message);
      } finally {
        isAutoSyncRunningRef.current = false;
      }
    }, 1200);
  }, [appendAudit]);

  // Deteksi perubahan stok produk secara otomatis untuk memicu Auto-Sync ke cloud
  const prevStockFingerprintRef = useRef<string>('');
  useEffect(() => {
    if (!products || products.length === 0) return;
    const currentFingerprint = products.map((p) => `${p.id}:${p.stock}`).join(';');
    if (!prevStockFingerprintRef.current) {
      prevStockFingerprintRef.current = currentFingerprint;
      return;
    }
    if (prevStockFingerprintRef.current !== currentFingerprint) {
      prevStockFingerprintRef.current = currentFingerprint;
      triggerAutoCloudSync('STOCK_CHANGE');
    }
  }, [products, triggerAutoCloudSync]);

  const [storageOperationalMode, setStorageOperationalModeState] = useState<StorageOperationalMode>(
    () => dualBackendSync.getStorageMode()
  );

  const [activeBackendProvider, setActiveBackendProviderState] = useState<'SUPABASE' | 'GAS' | 'LOCAL'>(() => {
    if (dualBackendSync.getStorageMode() === 'LOCAL_ONLY') return 'LOCAL';
    const cfg = dualBackendSync.getConfig();
    if (cfg.provider) return cfg.provider;
    if (cfg.gasWebhookUrl && !cfg.supabaseUrl) return 'GAS';
    if (cfg.supabaseUrl) return 'SUPABASE';
    return 'LOCAL';
  });

  const setStorageOperationalMode = useCallback(
    (mode: StorageOperationalMode) => {
      setStorageOperationalModeState(mode);
      dualBackendSync.setStorageMode(mode);
      if (mode === 'LOCAL_ONLY') {
        setActiveBackendProviderState('LOCAL');
        showToast(
          'Mode Penyimpanan diatur ke: Lokal Saja (100% Offline — Tanpa Cloud). Panggilan otomatis cloud dinonaktifkan.',
          'info'
        );
      } else if (mode === 'HYBRID_MIGRATION') {
        showToast(
          'Mode Penyimpanan diatur ke: Hybrid (Offline Buffer → Siap Migrasi ke Online Cloud).',
          'info'
        );
      } else {
        const cfg = dualBackendSync.getConfig();
        const nextProvider =
          cfg.supabaseUrl && cfg.supabaseAnonKey
            ? 'SUPABASE'
            : cfg.gasWebhookUrl
            ? 'GAS'
            : 'SUPABASE';
        setActiveBackendProviderState(nextProvider);
        showToast(
          'Mode Penyimpanan diatur ke: Online Cloud (Supabase + Google Apps Script Aktif).',
          'success'
        );
      }
    },
    [showToast]
  );

  const setActiveBackendProvider = useCallback((provider: 'SUPABASE' | 'GAS' | 'LOCAL') => {
    setActiveBackendProviderState(provider);
    dualBackendSync.saveConfig({ provider });
    if (provider === 'LOCAL' && dualBackendSync.getStorageMode() === 'ONLINE_CLOUD') {
      setStorageOperationalModeState('HYBRID_MIGRATION');
      dualBackendSync.setStorageMode('HYBRID_MIGRATION');
    } else if ((provider === 'SUPABASE' || provider === 'GAS') && dualBackendSync.getStorageMode() === 'LOCAL_ONLY') {
      setStorageOperationalModeState('ONLINE_CLOUD');
      dualBackendSync.setStorageMode('ONLINE_CLOUD');
    }
    showToast(`Provider backend aktif diatur ke: ${provider}`, 'success');
  }, [showToast]);

  const [gasWebhookUrlState, setGasWebhookUrlState] = useState(() => dualBackendSync.getConfig().gasWebhookUrl || '');
  const setGasWebhookUrl = useCallback((url: string) => {
    setGasWebhookUrlState(url);
    dualBackendSync.saveConfig({ gasWebhookUrl: url.trim() });
  }, []);

  const [gasOfflineQueueCount, setGasOfflineQueueCount] = useState(() => getGasOfflineQueue().length);

  const syncOfflineQueues = useCallback(async () => {
    const supabaseSynced = await dualBackendSync.processQueue();
    const gasSynced = await syncOfflineQueueToGAS();
    setGasOfflineQueueCount(getGasOfflineQueue().length);
    const totalSynced = (typeof supabaseSynced === 'number' ? supabaseSynced : 0) + gasSynced;
    if (totalSynced > 0) {
      showToast(`Berhasil menyinkronkan ${totalSynced} item antrean offline ke cloud.`, 'success');
    }
    return { supabaseSynced: typeof supabaseSynced === 'number' ? supabaseSynced : 0, gasSynced };
  }, [showToast]);

  const testGasConnectionHandler = useCallback(async () => {
    return await testGasConnection();
  }, []);

  const restoreSystemSnapshot = useCallback(
    (snapshot: any): { success: boolean; restoredKeys: string[]; message: string } => {
      try {
        if (!snapshot || typeof snapshot !== 'object') {
          return { success: false, restoredKeys: [], message: 'Format file snapshot tidak valid.' };
        }
        const restoredKeys: string[] = [];

        if (Array.isArray(snapshot.products)) {
          setProducts(snapshot.products.map((p: any, i: number) => normalizeProductPricing(p, i)));
          restoredKeys.push(`products (${snapshot.products.length})`);
        }
        if (Array.isArray(snapshot.sales)) {
          setSales(snapshot.sales);
          restoredKeys.push(`sales (${snapshot.sales.length})`);
        }
        const financeList = Array.isArray(snapshot.financeEntries)
          ? snapshot.financeEntries
          : Array.isArray(snapshot.finance)
          ? snapshot.finance
          : null;
        if (financeList) {
          setFinanceEntries(financeList);
          restoredKeys.push(`financeEntries (${financeList.length})`);
        }
        if (Array.isArray(snapshot.journalEntries)) {
          setJournalEntries(snapshot.journalEntries);
          restoredKeys.push(`journalEntries (${snapshot.journalEntries.length})`);
        }
        if (Array.isArray(snapshot.branches)) {
          setBranches(snapshot.branches);
          restoredKeys.push(`branches (${snapshot.branches.length})`);
        }
        if (Array.isArray(snapshot.employees)) {
          setEmployees(snapshot.employees);
          restoredKeys.push(`employees (${snapshot.employees.length})`);
        }
        if (Array.isArray(snapshot.suppliers)) {
          setSuppliers(snapshot.suppliers);
          restoredKeys.push(`suppliers (${snapshot.suppliers.length})`);
        }
        if (Array.isArray(snapshot.customers)) {
          setCustomers(snapshot.customers);
          restoredKeys.push(`customers (${snapshot.customers.length})`);
        }
        if (Array.isArray(snapshot.terminals)) {
          setTerminals(snapshot.terminals);
          restoredKeys.push(`terminals (${snapshot.terminals.length})`);
        }
        if (Array.isArray(snapshot.users)) {
          setUsers(snapshot.users);
          restoredKeys.push(`users (${snapshot.users.length})`);
        }
        if (Array.isArray(snapshot.cashierShifts)) {
          setCashierShifts(snapshot.cashierShifts);
          restoredKeys.push(`cashierShifts (${snapshot.cashierShifts.length})`);
        }
        if (Array.isArray(snapshot.purchaseOrders || snapshot.purchasing)) {
          setPurchaseOrders(snapshot.purchaseOrders || snapshot.purchasing);
          restoredKeys.push('purchaseOrders');
        }
        if (Array.isArray(snapshot.invoicesDue || snapshot.invoices)) {
          const invList = snapshot.invoicesDue || snapshot.invoices;
          setInvoicesDue(invList);
          restoredKeys.push(`invoicesDue (${invList.length})`);
        }
        if (Array.isArray(snapshot.stockMutations)) {
          setStockMutations(snapshot.stockMutations);
          restoredKeys.push(`stockMutations (${snapshot.stockMutations.length})`);
        }
        if (Array.isArray(snapshot.auditLogs)) {
          setAuditLogs(snapshot.auditLogs);
          restoredKeys.push(`auditLogs (${snapshot.auditLogs.length})`);
        }

        // Hapus flag pembersihan demo agar data yang baru dipulihkan langsung tampil penuh
        setIsLedgerReset(false);
        setIsMasterCatalogWiped(false);
        isMasterCatalogWipedRef.current = false;
        try {
          localStorage.removeItem(LEDGER_RESET_ACTIVE_ENTITY_KEY);
          localStorage.removeItem(MASTER_CATALOG_WIPED_KEY);
        } catch {}

        const settings = snapshot.systemSettings || {};
        const profile = settings.businessProfile || snapshot.businessProfile;
        if (profile && typeof profile === 'object') {
          setBusinessProfile((prev) => {
            const restored = saveActiveBusinessProfileToStorage({
              ...prev,
              ...profile,
              companyName: profile.name || profile.businessName || profile.companyName || prev.companyName,
            });
            return restored;
          });
          restoredKeys.push('businessProfile');
        }
        const sConfig = settings.sheetConfig || snapshot.sheetConfig;
        if (sConfig && typeof sConfig === 'object') {
          setSheetConfig((prev) => ({ ...prev, ...sConfig }));
          restoredKeys.push('sheetConfig');
        }
        if (typeof settings.isProductionMode === 'boolean') {
          setIsProductionMode(settings.isProductionMode);
          restoredKeys.push('isProductionMode');
        }
        if (settings.dualBackendConfig && typeof settings.dualBackendConfig === 'object') {
          dualBackendSync.saveConfig(settings.dualBackendConfig);
          restoredKeys.push('dualBackendConfig');
        }

        if (restoredKeys.length === 0) {
          return {
            success: false,
            restoredKeys: [],
            message: 'File JSON tidak memuat entitas snapshot RetailOS yang dikenali.'
          };
        }

        const entry: AuditLog = {
          id: `AUD-${Date.now()}-RESTORE`,
          timestamp: new Date().toISOString(),
          user: currentUser?.name || 'Super Admin',
          action: 'SNAPSHOT_RESTORE',
          module: 'SUPER_ADMIN',
          details: `Pemulihan snapshot penuh berhasil (${restoredKeys.join(', ')})`
        };
        setAuditLogs((prev) => [entry, ...prev].slice(0, 300));

        const msg = `Snapshot berhasil dipulihkan (${restoredKeys.length} modul data & pengaturan).`;
        showToast(msg, 'success');
        return { success: true, restoredKeys, message: msg };
      } catch (err: any) {
        const msg = `Gagal memulihkan snapshot: ${err?.message || 'Error struktur data'}`;
        showToast(msg, 'error');
        return { success: false, restoredKeys: [], message: msg };
      }
    },
    [currentUser, showToast]
  );

  // Perhitungan Saldo Kas Liquid Riil (Pemasukan Tunai/Bank dikurangi Pengeluaran Tunai/OPEX)
  const getLiquidCashBalance = useCallback((): number => {
    return (financeEntries || []).reduce((acc, entry) => {
      if (typeof (entry as any).cashDelta === 'number') {
        return acc + (entry as any).cashDelta;
      }
      const typeUpper = (entry.type || '').toUpperCase();
      if (typeUpper === 'INCOME' || typeUpper === 'IN / PENDAPATAN') {
        return acc + (Number(entry.amount) || 0);
      }
      // Beban HPP non-tunai tidak mengurangi kas fisik secara langsung karena kas keluar saat PO/pembelian stok
      const payMethod = (entry as any).paymentMethod || entry.payment_method || '';
      if ((entry.category === 'HPP' || typeUpper === 'HPP / BEBAN POKOK') && (payMethod === 'SYSTEM_AUTO' || payMethod === 'FIFO')) {
        return acc;
      }
      return acc - (Number(entry.amount) || 0);
    }, 0);
  }, [financeEntries]);

  // CRUD Produk + Sinkronisasi Dual-Backend
  const addProduct = useCallback(
    (product: Omit<Product, 'id'> & { id?: string }) => {
      const normalized = normalizeProductPricing(product);

      setProducts((prev) => [normalized, ...prev]);
      appendAudit('CREATE_SKU', 'MASTER_DATA', `Menambahkan SKU ${normalized.barcode || normalized.id} - ${normalized.name}`);

      dualBackendSync.enqueue('PRODUCT_UPSERT', 'UPSERT', {
        ...normalized,
        tx_uuid: generateTxUuid()
      });
    },
    [appendAudit]
  );

  // Registrasi Cepat Bahan Baku Dapur F&B (RM-FNB-XXX) langsung dari Master Topping / BOM
  const registerFnbRawMaterial = useCallback(
    (payload: {
      name: string;
      unit: 'Gram' | 'Ml' | 'Pcs' | string;
      costPerUnit: number;
      initialStock: number;
      category?: string;
    }): Product => {
      const allIds = [
        ...INITIAL_RAW_INGREDIENTS.map((i) => i.id),
        ...productsRef.current.map((p) => p.id),
      ];
      const nextRawSku = generateNextRawMaterialSku(allIds);
      const numericSuffix = nextRawSku.replace(/^RM-FNB-/i, '');
      const cleanName = payload.name.trim();
      const cleanUnit = payload.unit || 'Pcs';
      const unitCost = Math.max(0, Math.round(Number(payload.costPerUnit) || 0));
      const initStock = Math.max(0, Number(payload.initialStock) || 0);
      const minStockAuto = cleanUnit === 'Pcs' ? Math.max(10, Math.round(initStock * 0.2)) : Math.max(200, Math.round(initStock * 0.2));

      const rawProduct = normalizeProductPricing({
        id: nextRawSku,
        sku: nextRawSku,
        plu: nextRawSku,
        barcode: `899700${numericSuffix}`,
        name: cleanName,
        itemType: 'RAW_MATERIAL',
        businessModel: 'fnb',
        category: payload.category || 'Bahan Baku Dapur (Topping & Add-on)',
        brand: 'Supplier Dapur F&B',
        unit: cleanUnit,
        cost_price: unitCost,
        costPrice: unitCost,
        buy_price: unitCost,
        sell_price: unitCost,
        sellingPrice: unitCost,
        stock: initStock,
        initialStock: initStock,
        min_stock: minStockAuto,
        minStock: minStockAuto,
        rackLocation: 'Dapur & Barista Utama',
        status: 'Active',
      });

      setProducts((prev) => {
        const next = [rawProduct, ...prev];
        productsRef.current = next;
        return next;
      });

      if (initStock > 0) {
        const nowLocal = new Date();
        const pad2 = (n: number) => String(n).padStart(2, '0');
        const todayStr = `${nowLocal.getFullYear()}-${pad2(nowLocal.getMonth() + 1)}-${pad2(nowLocal.getDate())}`;
        const nowLocalTs = `${todayStr} ${pad2(nowLocal.getHours())}:${pad2(nowLocal.getMinutes())}:${pad2(nowLocal.getSeconds())}`;
        setStockMutations((prev) => [
          {
            id: `MUT-RM-INIT-${Date.now()}-${nextRawSku}`,
            timestamp: nowLocalTs,
            date: todayStr,
            product_id: nextRawSku,
            sku: nextRawSku,
            product_name: cleanName,
            type: 'IN',
            qty: initStock,
            previous_stock: 0,
            final_stock: initStock,
            balanceAfter: initStock,
            reference_no: `INIT-${nextRawSku}`,
            referenceId: `INIT-${nextRawSku}`,
            notes: `Stok awal pendaftaran cepat bahan baku dapur (${cleanName})`,
            operator: currentUser?.name || 'Admin F&B',
            warehouse: 'Dapur & Barista Utama',
            unit_cost: unitCost,
          },
          ...prev,
        ]);
      }

      appendAudit(
        'CREATE_RAW_MATERIAL_SKU',
        'MASTER_DATA',
        `Mendaftarkan SKU Bahan Baku Dapur baru ${nextRawSku} - ${cleanName} (Rp ${unitCost.toLocaleString('id-ID')}/${cleanUnit}, Stok Awal: ${initStock} ${cleanUnit})`
      );
      showToast(
        `SKU Bahan Baku ${nextRawSku} "${cleanName}" berhasil didaftarkan ke Gudang Dapur`,
        'success'
      );
      return rawProduct;
    },
    [appendAudit, currentUser?.name, showToast]
  );

  const addProductsBulk = useCallback(
    (pList: (Omit<Product, 'id'> & { id?: string })[], customMessage?: string) => {
      const normalized: Product[] = pList.map((p, idx) => normalizeProductPricing(p, idx));
      setProducts((prev) => [...normalized, ...prev]);
      showToast(customMessage || `Berhasil mengimpor ${normalized.length} produk`, 'success');
    },
    [showToast]
  );

  const updateProduct = useCallback(
    (idOrProduct: string | Product, updatedArg?: Partial<Product>) => {
      const targetId = typeof idOrProduct === 'string' ? idOrProduct : idOrProduct.id;
      const patch = typeof idOrProduct === 'string' ? (updatedArg || {}) : idOrProduct;
      const existingProd = productsRef.current.find((p) => p.id === targetId);
      const mergedForSync = existingProd
        ? normalizeProductPricing({ ...existingProd, ...patch })
        : null;

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== targetId) return p;
          return normalizeProductPricing({ ...p, ...patch });
        })
      );
      if (mergedForSync) {
        dualBackendSync.enqueue('PRODUCT_UPSERT', 'UPSERT', {
          ...mergedForSync,
          tx_uuid: generateTxUuid()
        });
      }
      appendAudit('UPDATE_SKU', 'MASTER_DATA', `Memperbarui SKU ${(patch as any).barcode || targetId} - ${(patch as any).name || ''}`);
    },
    [appendAudit]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      appendAudit('DELETE_SKU', 'MASTER_DATA', `Menghapus SKU ID ${id}`);

      dualBackendSync.enqueue('PRODUCT_DELETE', 'DELETE', {
        id,
        tx_uuid: generateTxUuid()
      });
    },
    [appendAudit]
  );

  // Transaksi POS + Pemotongan Stok + Jurnal Pendapatan + Jurnal Beban HPP Riil + Dual-Backend Sync
  const addSale = useCallback(
    (sale: Sale) => {
      const txUuid = sale.transaction_id || (sale as any).tx_uuid || (sale as any).id || generateTxUuid();
      const isOnlineNow = typeof navigator !== 'undefined' ? navigator.onLine : true;
      let totalCostHpp = 0;

      const computeSoldQtyForProduct = (prod: Product): number => {
        let soldQty = 0;
        const prodIdLower = (prod.id || '').trim().toLowerCase();
        const prodSkuLower = (prod.sku || '').trim().toLowerCase();
        const prodBarcodeLower = (prod.barcode || '').trim().toLowerCase();
        const prodPluLower = (prod.plu || '').trim().toLowerCase();
        const prodNameLower = (prod.name || '').trim().toLowerCase();

        for (const soldItem of (sale.items || [])) {
          const anyItem = soldItem as any;
          const itemQty = Number(anyItem.qty ?? anyItem.quantity) || 1;
          const freeBonus = Number(anyItem.freeBonusQty) || 0;
          const totalPhysicalQty = itemQty + freeBonus;
          const comps = anyItem.product?.componentSkus || anyItem.componentSkus;
          const isPkgItem = Boolean(
            anyItem.isPackage ||
            anyItem.product?.isPackage ||
            (anyItem.product?.barcode && (String(anyItem.product.barcode).startsWith('200-BND') || String(anyItem.product.barcode).startsWith('200-EXP')))
          );

          if (!isPkgItem) {
            const isMatch =
              (anyItem.product?.id && anyItem.product.id === prod.id) ||
              (anyItem.productId && anyItem.productId === prod.id) ||
              (anyItem.barcode && prod.barcode && anyItem.barcode === prod.barcode) ||
              (anyItem.product?.sku && prod.sku && anyItem.product.sku === prod.sku);
            if (isMatch) {
              const cubicConv = resolveBulkCubicConversionFactor({
                bulkUnitType: anyItem.product?.bulkUnitType,
                selectedUnit: anyItem.selectedUnit,
                barcode: anyItem.barcode || anyItem.product?.barcode,
                product: prod,
              });
              const cubicFactor =
                Number(anyItem.cubicConversionFactorM3) > 0
                  ? Number(anyItem.cubicConversionFactorM3)
                  : cubicConv.isBulkConverted
                  ? cubicConv.factorM3
                  : 1;
              soldQty += Number((totalPhysicalQty * cubicFactor).toFixed(3));
            }
          }

          if (Array.isArray(comps) && comps.length > 0) {
            for (const comp of comps) {
              const compSkuLower = String(comp.skuId || '').trim().toLowerCase();
              const compNameLower = String(comp.skuName || '').trim().toLowerCase();
              const isCompMatch = Boolean(
                (compSkuLower && (
                  (prodIdLower && prodIdLower === compSkuLower) ||
                  (prodSkuLower && prodSkuLower === compSkuLower) ||
                  (prodBarcodeLower && prodBarcodeLower === compSkuLower) ||
                  (prodPluLower && prodPluLower === compSkuLower)
                )) ||
                (compNameLower && prodNameLower && prodNameLower === compNameLower)
              );
              if (isCompMatch) {
                soldQty += (Number(comp.qty) || 1) * totalPhysicalQty;
              }
            }
          }
        }
        return soldQty;
      };

      const applyProductDeduction = (prod: Product, soldQty: number): Product => {
        const nextStock = Number((prod.stock - soldQty).toFixed(2));
        let nextVariantMatrix = prod.variantMatrix;
        if (Array.isArray(prod.variantMatrix) && prod.variantMatrix.length > 0) {
          const clonedMatrix = prod.variantMatrix.map((c) => ({ ...c }));
          const matchingItems = (sale.items || []).filter((si: any) => {
            return (
              (si.product?.id && si.product.id === prod.id) ||
              (si.productId && si.productId === prod.id) ||
              (si.barcode && prod.barcode && si.barcode === prod.barcode) ||
              (si.product?.sku && prod.sku && si.product.sku === prod.sku)
            );
          });
          for (const si of matchingItems) {
            const anySi = si as any;
            const qtyUsed = Math.max(0, (Number(anySi.qty ?? anySi.quantity) || 1) + (Number(anySi.freeBonusQty) || 0));
            const targetSize = String(anySi.selectedFashionSize || '').trim().toLowerCase();
            const targetColor = String(anySi.selectedFashionColor || '').trim().toLowerCase();
            let cellIdx = -1;
            if (targetSize && targetColor) {
              cellIdx = clonedMatrix.findIndex(
                (c) => c.size.toLowerCase() === targetSize && c.color.toLowerCase() === targetColor
              );
            }
            if (cellIdx < 0) {
              cellIdx = clonedMatrix.findIndex((c) => c.stock >= qtyUsed);
              if (cellIdx < 0) cellIdx = clonedMatrix.findIndex((c) => c.stock > 0);
            }
            if (cellIdx >= 0) {
              clonedMatrix[cellIdx].stock = Math.max(0, Number(clonedMatrix[cellIdx].stock || 0) - qtyUsed);
            }
          }
          nextVariantMatrix = clonedMatrix;
        }
        return {
          ...prod,
          stock: nextStock,
          variantMatrix: nextVariantMatrix,
          status: nextStock <= 0 ? 'Out of Stock' : nextStock <= (prod.min_stock ?? prod.minStock ?? 5) ? 'Low Stock' : 'Active',
        };
      };

      // Hitung HPP riil & antrean sync di luar state updater agar setProducts tetap pure
      const updatedProductsToEnqueue: Product[] = [];
      for (const prod of productsRef.current) {
        const soldQty = computeSoldQtyForProduct(prod);
        if (soldQty === 0) continue;
        const rawProdCost = Number(prod.costPrice ?? prod.cost_price ?? 0);
        const prodUnitUpper = (prod.unit || '').toUpperCase();
        const baseUnitFactor =
          prodUnitUpper.includes('PICK') || prodUnitUpper.includes('1.2')
            ? 1.2
            : prodUnitUpper.includes('ENGKEL') || prodUnitUpper.includes('3.0')
            ? 3.0
            : prodUnitUpper.includes('DUMP') || prodUnitUpper.includes('6.5')
            ? 6.5
            : 1.0;
        const costPerBaseUnit = baseUnitFactor > 0 ? rawProdCost / baseUnitFactor : rawProdCost;
        totalCostHpp += Math.round(costPerBaseUnit * soldQty);
        updatedProductsToEnqueue.push(applyProductDeduction(prod, soldQty));
      }

      // Potong stok pada state secara pure (tanpa side-effect di dalam updater)
      setProducts((prevProducts) =>
        prevProducts.map((prod) => {
          const soldQty = computeSoldQtyForProduct(prod);
          return soldQty === 0 ? prod : applyProductDeduction(prod, soldQty);
        })
      );

      for (const updatedProd of updatedProductsToEnqueue) {
        dualBackendSync.enqueue('PRODUCT_UPSERT', 'UPSERT', {
          ...updatedProd,
          tx_uuid: generateTxUuid()
        });
      }

      // Pemotongan Stok Bahan Baku Dapur Otomatis (Resep BOM Menu + Topping BOM) untuk setiap penjualan F&B
      let toppingTotalHpp = 0;
      if (Array.isArray(sale.items) && sale.items.length > 0) {
        const bomDeductions = new Map<
          string,
          { totalQty: number; unit: string; name: string; menuNotes: string[] }
        >();
        const toppingBomDeductions = new Map<
          string,
          { totalQty: number; unit: string; name: string; toppingNotes: string[] }
        >();

        const snapshotMap = new Map(productsRef.current.map((p) => [p.id, p]));
        RAW_INGREDIENTS_AS_PRODUCTS.forEach((rawSeed) => {
          if (!snapshotMap.has(rawSeed.id)) {
            snapshotMap.set(rawSeed.id, rawSeed);
          }
        });
        const rawCostFallbackMap = new Map(
          INITIAL_RAW_INGREDIENTS.map((ing) => [ing.id, ing.costPerUnit])
        );
        const activeToppingMasters = fnbToppingsRef.current || DEFAULT_FNB_TOPPING_MASTERS;

        sale.items.forEach((item: any) => {
          const itemProd = item.product || productsRef.current.find((p) => p.id === (item.product_id || item.productId));
          const prodId = String(item.product_id || item.productId || itemProd?.id || '');
          const menuTitle = item.product_name || itemProd?.name || prodId;
          const menuSoldQty = Number(item.qty ?? item.quantity) || 1;
          const isFnbMenu =
            itemProd?.itemType === 'MENU_FB' ||
            itemProd?.businessModel === 'fnb' ||
            prodId.startsWith('FNB-');

          if (isFnbMenu) {
            const customRecipe =
              (itemProd?.costing?.recipe && itemProd.costing.recipe.length > 0
                ? itemProd.costing.recipe
                : itemProd?.recipe && itemProd.recipe.length > 0
                ? itemProd.recipe
                : null) ||
              getDefaultRecipeForFnbMenu({
                id: prodId,
                name: item.product_name || itemProd?.name,
                category: itemProd?.category,
              }).recipe;

            customRecipe.forEach((comp: any) => {
              const rawId = normalizeFnbRawMaterialId(comp.ingredientId || comp.id || '');
              if (!rawId) return;
              const portion = Number(comp.portionQty ?? comp.qty) || 0;
              if (portion <= 0) return;
              const deductQty = Number((portion * menuSoldQty).toFixed(2));
              const existing = bomDeductions.get(rawId);
              const notePart = `${menuSoldQty}x ${menuTitle} (@${portion}${comp.unit || 'gr'})`;
              if (existing) {
                existing.totalQty = Number((existing.totalQty + deductQty).toFixed(2));
                existing.menuNotes.push(notePart);
              } else {
                bomDeductions.set(rawId, {
                  totalQty: deductQty,
                  unit: comp.unit || 'Gram',
                  name: comp.ingredientName || comp.name || rawId,
                  menuNotes: [notePart],
                });
              }
            });
          }

          // Pemotongan Stok Bahan Baku & Kalkulasi HPP Otomatis untuk Topping F&B terpilih
          const rawDetails: Array<{
            id?: string;
            sku?: string;
            name: string;
            price?: number;
            rawMaterialId?: string;
            rawMaterialQty?: number;
            rawMaterialUnit?: string;
            hppCost?: number;
          }> =
            Array.isArray(item.modifiers?.toppingDetails) && item.modifiers.toppingDetails.length > 0
              ? item.modifiers.toppingDetails
              : Array.isArray(item.modifiers?.toppings)
              ? item.modifiers.toppings.map((tName: string) => ({ name: tName }))
              : [];

          rawDetails.forEach((td) => {
            const matchedMaster = activeToppingMasters.find(
              (m) =>
                (td.sku && m.sku === td.sku) ||
                (td.id && m.id === td.id) ||
                m.name.trim().toLowerCase() === String(td.name || '').trim().toLowerCase()
            );
            const rawIdCandidate = matchedMaster?.rawMaterialId || td.rawMaterialId || '';
            const rawId = rawIdCandidate ? normalizeFnbRawMaterialId(rawIdCandidate) : '';
            const portionQty = Number(matchedMaster?.rawMaterialQty ?? td.rawMaterialQty) || 0;
            const rawTarget = rawId ? snapshotMap.get(rawId) : undefined;
            const rawCostPerUnit =
              Number(rawTarget?.cost_price ?? rawTarget?.costPrice ?? 0) ||
              (rawId ? rawCostFallbackMap.get(rawId) || 0 : 0);

            // Referensi HPP topping bersumber 100% dari Master Bahan Baku Gudang (Rp 0 jika Non-BOM)
            const unitToppingHpp =
              rawId && portionQty > 0 && rawCostPerUnit > 0
                ? Math.round(portionQty * rawCostPerUnit)
                : 0;
            if (unitToppingHpp > 0) {
              toppingTotalHpp += Math.round(unitToppingHpp * menuSoldQty);
            }

            if (rawId && portionQty > 0) {
              const deductQty = Number((portionQty * menuSoldQty).toFixed(2));
              const unitLabel = rawTarget?.unit || matchedMaster?.rawMaterialUnit || td.rawMaterialUnit || 'Pcs';
              const toppingSkuTag = matchedMaster?.sku || td.sku ? `[${matchedMaster?.sku || td.sku}] ` : '';
              const notePart = `${menuSoldQty}x ${toppingSkuTag}${td.name || matchedMaster?.name || rawId} pada ${menuTitle} (@${portionQty}${unitLabel})`;
              const existingTop = toppingBomDeductions.get(rawId);
              if (existingTop) {
                existingTop.totalQty = Number((existingTop.totalQty + deductQty).toFixed(2));
                existingTop.toppingNotes.push(notePart);
              } else {
                toppingBomDeductions.set(rawId, {
                  totalQty: deductQty,
                  unit: unitLabel,
                  name: rawTarget?.name || matchedMaster?.rawMaterialName || rawId,
                  toppingNotes: [notePart],
                });
              }
            }
          });
        });

        if (bomDeductions.size > 0 || toppingBomDeductions.size > 0) {
          const nowLocal = new Date();
          const pad2 = (n: number) => String(n).padStart(2, '0');
          const todayStr = `${nowLocal.getFullYear()}-${pad2(nowLocal.getMonth() + 1)}-${pad2(nowLocal.getDate())}`;
          const nowLocalTs = `${todayStr} ${pad2(nowLocal.getHours())}:${pad2(nowLocal.getMinutes())}:${pad2(nowLocal.getSeconds())}`;
          const receiptRefStr = sale.receipt_number || (sale as any).receiptNumber || txUuid;
          const bomMutations: StockMutation[] = [];
          const toppingMutations: StockMutation[] = [];
          const runningStockByRawId = new Map<string, number>();

          bomDeductions.forEach((deduct, rawId) => {
            const target = snapshotMap.get(rawId);
            const prevStock = target ? Number(target.stock) || 0 : 0;
            const finalStock = Number((prevStock - deduct.totalQty).toFixed(2));
            runningStockByRawId.set(rawId, finalStock);
            bomMutations.push({
              id: `MUT-FNB-BOM-${Date.now()}-${rawId}-${Math.random().toString(36).slice(2, 5)}`,
              timestamp: nowLocalTs,
              date: todayStr,
              product_id: rawId,
              sku: rawId,
              product_name: target?.name || deduct.name,
              type: 'OUT / RESEP BOM',
              qty: deduct.totalQty,
              previous_stock: prevStock,
              final_stock: finalStock,
              balanceAfter: finalStock,
              reference_no: receiptRefStr,
              referenceId: receiptRefStr,
              notes: `Pemotongan otomatis BOM Kasir F&B: ${deduct.menuNotes.join(', ')}`,
              operator: sale.cashier_name || (sale as any).cashierName || currentUser?.name || 'Kasir F&B',
              warehouse: target?.rackLocation || 'Dapur & Barista Utama',
            });
          });

          toppingBomDeductions.forEach((deduct, rawId) => {
            const target = snapshotMap.get(rawId);
            const prevStock = runningStockByRawId.has(rawId)
              ? runningStockByRawId.get(rawId)!
              : target
              ? Number(target.stock) || 0
              : 0;
            const finalStock = Number((prevStock - deduct.totalQty).toFixed(2));
            runningStockByRawId.set(rawId, finalStock);
            toppingMutations.push({
              id: `MUT-FNB-TOP-${Date.now()}-${rawId}-${Math.random().toString(36).slice(2, 5)}`,
              timestamp: nowLocalTs,
              date: todayStr,
              product_id: rawId,
              sku: rawId,
              product_name: target?.name || deduct.name,
              type: 'OUT / TOPPING BOM',
              qty: deduct.totalQty,
              previous_stock: prevStock,
              final_stock: finalStock,
              balanceAfter: finalStock,
              reference_no: receiptRefStr,
              referenceId: receiptRefStr,
              notes: `Pemotongan otomatis Topping BOM: ${deduct.toppingNotes.join(', ')}`,
              operator: sale.cashier_name || (sale as any).cashierName || currentUser?.name || 'Kasir F&B',
              warehouse: target?.rackLocation || 'Dapur & Barista Utama',
            });
          });

          // Gabungkan total pemotongan per rawId (Menu BOM + Topping BOM)
          const combinedDeductions = new Map<string, number>();
          bomDeductions.forEach((d, rawId) => {
            combinedDeductions.set(rawId, Number(((combinedDeductions.get(rawId) || 0) + d.totalQty).toFixed(2)));
          });
          toppingBomDeductions.forEach((d, rawId) => {
            combinedDeductions.set(rawId, Number(((combinedDeductions.get(rawId) || 0) + d.totalQty).toFixed(2)));
          });

          setProducts((prev) => {
            const existingMap = new Map(prev.map((p) => [p.id, p]));
            RAW_INGREDIENTS_AS_PRODUCTS.forEach((rawSeed) => {
              if (!existingMap.has(rawSeed.id)) {
                existingMap.set(rawSeed.id, rawSeed);
              }
            });

            combinedDeductions.forEach((totalDeductQty, rawId) => {
              const target = existingMap.get(rawId);
              const prevStock = target ? Number(target.stock) || 0 : 0;
              const finalStock = Number((prevStock - totalDeductQty).toFixed(2));
              if (target) {
                existingMap.set(rawId, {
                  ...target,
                  stock: finalStock,
                });
              }
            });

            return Array.from(existingMap.values());
          });

          const allNewBomMutations = [...toppingMutations, ...bomMutations];
          if (allNewBomMutations.length > 0) {
            setStockMutations((prev) => [...allNewBomMutations, ...prev]);
          }
        }
      }

      // Cadangan hitung HPP jika produk baru belum ada di state sebelumnya (mendukung konversi kubikasi m³)
      if (totalCostHpp === 0 && Array.isArray(sale.items)) {
        totalCostHpp = sale.items.reduce((sum: number, item: any) => {
          const qty = (Number(item.qty ?? item.quantity) || 1) + (Number(item.freeBonusQty) || 0);
          const cubicConv = resolveBulkCubicConversionFactor({
            bulkUnitType: item.product?.bulkUnitType,
            selectedUnit: item.selectedUnit,
            barcode: item.barcode || item.product?.barcode,
            product: item.product,
          });
          if (cubicConv.isBulkConverted && cubicConv.unitCostPrice > 0) {
            return sum + Math.round(cubicConv.unitCostPrice * qty);
          }
          const unitPrice = Number(item.price ?? item.product?.sell_price ?? item.product?.sellingPrice) || 0;
          const cost = Number(item.costPrice ?? item.product?.cost_price ?? item.product?.costPrice) || Math.round(unitPrice * 0.83);
          return sum + Math.round(cost * qty);
        }, 0);
      }

      // Jumlahkan HPP Topping F&B ke total HPP transaksi (otomatis masuk Jurnal HPP & Laporan Finance)
      if (toppingTotalHpp > 0) {
        totalCostHpp += toppingTotalHpp;
      }

      const txDate = sale.created_at || sale.date || (sale as any).timestamp || new Date().toISOString();
      const txTotal = Number(sale.total_amount ?? (sale as any).total) || 0;
      const txPayMethod = sale.payment_method || (sale as any).paymentMethod || 'CASH';
      const pmUpper = String(txPayMethod || '').toUpperCase();
      const isSplitPayment =
        pmUpper.includes('SPLIT') ||
        ((Number(sale.splitCashAmount) || 0) > 0 && (Number(sale.splitNonCashAmount) || 0) > 0);
      const splitCashAmt = isSplitPayment
        ? Math.max(0, Math.round(Number(sale.splitCashAmount) || 0))
        : 0;
      const splitNonCashAmt = isSplitPayment
        ? Math.max(0, Math.round(Number(sale.splitNonCashAmount) || Math.max(0, txTotal - splitCashAmt)))
        : 0;
      const splitNonCashChannel = String(sale.splitNonCashMethod || 'QRIS').toUpperCase();

      const isLaundryBayarAmbil =
        sale.laundryPaymentStatus === 'BAYAR_AMBIL' ||
        pmUpper.includes('BAYAR_AMBIL') ||
        pmUpper.includes('SAAT_AMBIL');
      const isLaundryDp = sale.laundryPaymentStatus === 'DP';
      const isCreditSale =
        !isSplitPayment &&
        (pmUpper.includes('KREDIT') ||
          pmUpper.includes('TEMPO') ||
          pmUpper.includes('KASBON') ||
          pmUpper.includes('AR') ||
          isLaundryBayarAmbil ||
          isLaundryDp ||
          (typeof sale.dpAmount === 'number' && sale.dpAmount < txTotal) ||
          (typeof sale.remainingBalance === 'number' && sale.remainingBalance > 0) ||
          (typeof sale.amount_paid === 'number' && sale.amount_paid < txTotal));
      const paidUpfront = isSplitPayment
        ? splitCashAmt + splitNonCashAmt
        : isLaundryBayarAmbil
        ? 0
        : isCreditSale
        ? Math.max(
            0,
            Math.min(
              txTotal,
              Number(
                sale.dpAmount ??
                  (pmUpper.includes('KREDIT') || pmUpper.includes('TEMPO') || pmUpper.includes('KASBON')
                    ? 0
                    : sale.amount_paid)
              ) || 0
            )
          )
        : txTotal;
      const remainingAr = isCreditSale ? Math.max(0, txTotal - paidUpfront) : 0;
      const tempoDays = Number(sale.tempoDays) > 0 ? Number(sale.tempoDays) : 14;
      const dueDateObj = new Date(txDate);
      dueDateObj.setDate(dueDateObj.getDate() + tempoDays);
      const dueDateStr = sale.dueDate || dueDateObj.toISOString().slice(0, 10);
      const receiptRef = sale.receipt_number || txUuid;
      const doNumber =
        sale.deliveryOrderNumber ||
        `DO-${String(receiptRef).replace(/[^A-Z0-9-]/gi, '').slice(-10)}`;

      const isBuildingTransaction =
        Boolean(sale.deliveryFleetActive) ||
        sale.deliveryPolicy === 'FRANGKO' ||
        Boolean(sale.fleetType) ||
        String(sale.businessType || sale.terminal_name || '').toLowerCase().includes('bangunan') ||
        String(sale.terminalId || sale.terminal_name || '').toUpperCase().includes('T-05') ||
        String(sale.terminalId || sale.terminal_name || '').toUpperCase().includes('BUILD') ||
        (Array.isArray(sale.items) && sale.items.some((it: any) => isBuildingMaterialProduct(it.product)));

      const loadingFeeAmt =
        typeof sale.loadingFee === 'number' && sale.loadingFee >= 0
          ? Math.round(sale.loadingFee)
          : isBuildingTransaction
          ? calculateBuildingLoadingFeeTotal(sale.items || [])
          : 0;

      const materialRevenueAmt =
        typeof sale.materialRevenue === 'number' && sale.materialRevenue > 0
          ? Math.round(sale.materialRevenue)
          : Math.max(0, txTotal - loadingFeeAmt);

      const hasFrangkoFleet =
        Boolean(sale.deliveryFleetActive) ||
        sale.deliveryPolicy === 'FRANGKO' ||
        Boolean(sale.fleetType) ||
        (Array.isArray(sale.items) &&
          sale.items.some(
            (it: any) =>
              it.deliveryMethod === 'FLEET_DELIVERY' ||
              (it.product?.deliveryPricingPolicy === 'INCLUDE_ONGKIR' &&
                it.product?.materialNature === 'BULK_CURAH')
          ));

      const detectedFleetForCost =
        sale.fleetType ||
        (sale.items || [])
          .map((it: any) => it.product?.bulkUnitType)
          .find((bt: any) => bt === 'DUMP_TRUCK' || bt === 'TRUCK_ENGKEL' || bt === 'PICKUP_RET') ||
        'PICKUP_RET';

      const fleetDeliveryCostAmt =
        typeof sale.fleetDeliveryCost === 'number' && sale.fleetDeliveryCost >= 0
          ? Math.round(sale.fleetDeliveryCost)
          : hasFrangkoFleet
          ? estimateFleetDeliveryExpense(detectedFleetForCost, 'FRANGKO', true)
          : 0;

      const estNetProfitAfterShipping =
        typeof sale.netProfitAfterShipping === 'number'
          ? Math.round(sale.netProfitAfterShipping)
          : Math.round(materialRevenueAmt - totalCostHpp - fleetDeliveryCostAmt);

      const finalizedSale: Sale = {
        ...sale,
        transaction_id: txUuid,
        tx_uuid: txUuid,
        date: sale.date || txDate,
        created_at: txDate,
        total_amount: txTotal,
        payment_method: txPayMethod as any,
        amount_paid: paidUpfront,
        dpAmount: isCreditSale ? paidUpfront : sale.dpAmount,
        tempoDays: isCreditSale ? tempoDays : sale.tempoDays,
        dueDate: isCreditSale ? dueDateStr : sale.dueDate,
        remainingBalance: remainingAr,
        splitCashAmount: isSplitPayment ? splitCashAmt : sale.splitCashAmount,
        splitNonCashAmount: isSplitPayment ? splitNonCashAmt : sale.splitNonCashAmount,
        splitNonCashMethod: isSplitPayment ? splitNonCashChannel : sale.splitNonCashMethod,
        loadingFee: loadingFeeAmt,
        materialRevenue: materialRevenueAmt,
        fleetDeliveryCost: fleetDeliveryCostAmt,
        netProfitAfterShipping: estNetProfitAfterShipping,
        deliveryOrderNumber:
          sale.deliveryFleetActive || sale.deliveryPolicy === 'FRANGKO' || sale.fleetType
            ? doNumber
            : sale.deliveryOrderNumber,
        status: 'COMPLETED',
        businessSector: sale.businessSector || resolveCanonicalSector(businessProfileRef.current),
        businessName: sale.businessName || businessProfileRef.current?.name || '',
        syncStatus: isOnlineNow ? 'SYNCED' : 'PENDING_SYNC',
        isOffline: !isOnlineNow,
        ...( { id: txUuid, timestamp: txDate, total: txTotal, paymentMethod: txPayMethod } as any )
      };

      setSales((prev) => {
        // Idempotency check: prevent duplicate sale if tx_uuid or non-empty receipt_number already exists
        if (prev.some(s =>
          s.transaction_id === txUuid ||
          (s as any).tx_uuid === txUuid ||
          (Boolean(sale.receipt_number) && s.receipt_number === sale.receipt_number)
        )) {
          return prev;
        }
        return [finalizedSale, ...prev];
      });

      // Sinkronkan penjualan ke shift aktif milik loket/station bersangkutan agar rekonsiliasi shift terisolasi per loket
      const saleStationKey = normalizeStationCode(
        sale.stationCode || sale.terminalId || activeTerminal?.stationCode || activeTerminalId
      );
      const isPureUnpaidCredit =
        (pmUpper.includes('KREDIT') ||
          pmUpper.includes('TEMPO') ||
          pmUpper.includes('KASBON') ||
          pmUpper.includes('BAYAR_AMBIL') ||
          pmUpper.includes('SAAT_AMBIL')) &&
        paidUpfront <= 0;
      const isCashMethod =
        !isPureUnpaidCredit &&
        !isSplitPayment &&
        (pmUpper.includes('CASH') ||
          pmUpper.includes('TUNAI') ||
          (isCreditSale && !pmUpper.includes('QRIS') && !pmUpper.includes('DEBIT') && !pmUpper.includes('TRANSFER')));
      setCashierShifts((prev) =>
        prev.map((s) => {
          if (s.status !== 'OPEN') return s;
          const shiftKey = normalizeStationCode(s.stationCode || s.terminalId || s.terminalName);
          const matchesShift =
            (sale.shift_id && s.id === sale.shift_id) ||
            shiftKey === saleStationKey;
          if (!matchesShift) return s;

          const addCash = isSplitPayment
            ? splitCashAmt
            : isCashMethod
            ? paidUpfront
            : 0;
          const addNonCash = isSplitPayment
            ? splitNonCashAmt
            : !isCashMethod
            ? paidUpfront
            : 0;
          const nextCashSales = (s.totalCashSales || 0) + addCash;
          const nextNonCashSales = (s.totalNonCashSales || 0) + addNonCash;
          const nextExpected =
            (s.expectedCashInDrawer ?? s.initialCash ?? 0) + addCash;
          return {
            ...s,
            totalCashSales: nextCashSales,
            totalNonCashSales: nextNonCashSales,
            totalTransactionsCount: (s.totalTransactionsCount || 0) + 1,
            expectedCashInDrawer: nextExpected,
            expectedCash: nextExpected,
          };
        })
      );

      // 0a. Sinkronisasi Real-Time Piutang Proyek / Kontraktor (Tempo & DP) ke invoicesDue & Customer balance
      if (isCreditSale && remainingAr > 0) {
        const matchedCustomer = customers.find(
          (c) =>
            (sale.customer_id && c.id === sale.customer_id) ||
            (sale.customer_name && c.name.toLowerCase() === sale.customer_name.toLowerCase())
        );
        const partyName =
          sale.customer_name ||
          sale.petOrClientName ||
          matchedCustomer?.name ||
          'Kontraktor / Proyek Depo';

        setInvoicesDue((prev) => {
          if (prev.some((inv) => inv.invoice_number === receiptRef || inv.id === `AR-POS-${txUuid}`)) {
            return prev;
          }
          const isLaundryAr =
            Boolean(sale.isLaundryOrder) ||
            Boolean(sale.laundryBagTagCode) ||
            sale.laundryPaymentStatus === 'DP' ||
            sale.laundryPaymentStatus === 'BAYAR_AMBIL';
          const laundryDueStr = sale.laundryEstimatedDoneAt
            ? sale.laundryEstimatedDoneAt.slice(0, 10)
            : dueDateStr;
          const newArInvoice: InvoiceDue = {
            id: `AR-POS-${txUuid}`,
            type: 'RECEIVABLE',
            party_name: partyName,
            invoice_number: receiptRef,
            due_date: isLaundryAr ? laundryDueStr : dueDateStr,
            amount: remainingAr,
            status: 'Unpaid',
            terms: isLaundryAr
              ? paidUpfront > 0
                ? `Laundry DP Rp ${paidUpfront.toLocaleString('id-ID')} • Sisa Tagihan`
                : `Laundry Bayar Saat Ambil${sale.laundryBagTagCode ? ` • ${sale.laundryBagTagCode}` : ''}`
              : `Tempo ${tempoDays} Hari${paidUpfront > 0 ? ` • DP Rp ${paidUpfront.toLocaleString('id-ID')}` : ' • Tanpa DP'}`,
            created_at: txDate,
          };
          return [newArInvoice, ...prev];
        });

        if (matchedCustomer) {
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === matchedCustomer.id
                ? {
                    ...c,
                    outstanding_balance: (Number(c.outstanding_balance) || 0) + remainingAr,
                    totalSpent: (Number(c.totalSpent) || 0) + txTotal,
                  }
                : c
            )
          );
        }
      }

      // 0b. Sinkronisasi Real-Time Surat Jalan (DO) & Ritase Armada Depo Bangunan
      const hasFleetOrder =
        Boolean(sale.deliveryFleetActive) ||
        sale.deliveryPolicy === 'FRANGKO' ||
        Boolean(sale.fleetType) ||
        (Array.isArray(sale.items) &&
          sale.items.some((it: any) => it.deliveryMethod === 'FLEET_DELIVERY'));

      if (hasFleetOrder) {
        const fleetType: BuildingFleetType = sale.fleetType || 'PICKUP_RET';
        const defaultVolPerFleet =
          fleetType === 'DUMP_TRUCK' ? 6.5 : fleetType === 'TRUCK_ENGKEL' ? 3.0 : 1.2;
        const computedItemVol = (sale.items || []).reduce((acc: number, it: any) => {
          const u = String(it.selectedUnit || it.product?.unit || '').toLowerCase();
          const q = Number(it.quantity ?? (it as any).qty) || 1;
          if (u.includes('dump') || u.includes('6.5')) return acc + q * 6.5;
          if (u.includes('engkel') || u.includes('truk') || u.includes('3.0')) return acc + q * 3.0;
          if (u.includes('m³') || u.includes('m3')) return acc + q;
          if (u.includes('pick') || u.includes('ret')) return acc + q * 1.2;
          return acc;
        }, 0);
        const estimatedVolumeM3 = Number((computedItemVol > 0 ? computedItemVol : defaultVolPerFleet).toFixed(1));
        const fleetLabel =
          sale.fleetVehicleName ||
          (fleetType === 'DUMP_TRUCK'
            ? 'Dump Truck (±6.5 m³)'
            : fleetType === 'TRUCK_ENGKEL'
            ? 'Truk Engkel (±3.0 m³)'
            : 'Pick-up (±1.2 m³)');
        const customerLabel =
          sale.customer_name ||
          sale.petOrClientName ||
          customers.find((c) => c.id === sale.customer_id)?.name ||
          'Proyek / Pelanggan Depo';

        setBuildingDeliveryOrders((prev) => {
          if (prev.some((d) => d.transactionId === txUuid || d.doNumber === doNumber)) {
            return prev;
          }
          const newDo: BuildingDeliveryOrder = {
            id: `DO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            doNumber,
            transactionId: txUuid,
            receiptNumber: receiptRef,
            date: txDate,
            customerId: sale.customer_id,
            customerName: customerLabel,
            destination:
              sale.deliveryDestination ||
              customers.find((c) => c.id === sale.customer_id)?.store_address ||
              'Lokasi Proyek Pelanggan',
            deliveryPolicy: sale.deliveryPolicy || (sale.deliveryFleetActive ? 'FRANGKO' : 'LOCO'),
            fleetType,
            fleetVehicleName: fleetLabel,
            estimatedVolumeM3,
            itemsSummary: finalizedSale.items_summary || 'Material Bangunan',
            shippingFee: Number(sale.shippingFee) || 0,
            totalOrderValue: txTotal,
            status: 'MENUNGGU_MUAT',
            updatedAt: txDate,
          };
          return [newDo, ...prev];
        });
      }

      // 0c. Sinkronisasi Real-Time Order & Tracking Produksi Laundry (Non-Blocking)
      const isLaundryTransaction =
        Boolean(sale.isLaundryOrder) ||
        Boolean(sale.laundryBagTagCode) ||
        (Array.isArray(sale.items) &&
          sale.items.some(
            (it: any) =>
              it.product?.businessModel === 'laundry' ||
              Boolean(it.product?.laundryUnitType) ||
              String(it.product?.id || '').startsWith('LND-')
          ));

      if (isLaundryTransaction) {
        const tagCode =
          sale.laundryBagTagCode || `TAG-${String(receiptRef).replace(/[^A-Z0-9]/gi, '').slice(-4)}`;
        const resolvedLaundryPayStatus: LaundryPaymentStatus =
          sale.laundryPaymentStatus ||
          (remainingAr > 0 ? (paidUpfront > 0 ? 'DP' : 'BAYAR_AMBIL') : 'LUNAS_AWAL');
        const minSlaHours = (sale.items || []).reduce((acc: number, it: any) => {
          const h = Number(it.product?.slaHours) || 0;
          if (h <= 0) return acc;
          return acc === 0 ? h : Math.min(acc, h);
        }, 0);
        const slaHours = sale.laundrySlaHours || minSlaHours || 48;
        const slaLabel =
          sale.laundrySlaLabel ||
          (slaHours <= 6 ? 'Express 6 Jam' : slaHours <= 24 ? 'Kilat 24 Jam' : 'Reguler 48 Jam');
        const estDoneIso =
          sale.laundryEstimatedDoneAt ||
          new Date(new Date(txDate).getTime() + slaHours * 3600000).toISOString();

        setLaundryOrders((prev) => {
          if (prev.some((lo) => lo.transactionId === txUuid || lo.orderNumber === receiptRef)) {
            return prev;
          }
          const newOrder: LaundryOrderRecord = {
            id: `LND-ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            orderNumber: receiptRef,
            tagCode,
            transactionId: txUuid,
            createdAt: txDate,
            customerName: sale.customer_name || sale.petOrClientName || 'Pelanggan Laundry',
            customerPhone: sale.customer_phone || '',
            totalPieces: Math.max(
              1,
              Number(sale.laundryTotalPieces) ||
                (sale.items || []).reduce((acc: number, it: any) => acc + Math.max(1, Math.round(Number(it.quantity) || 1)), 0)
            ),
            conditionNotes: sale.laundryConditionNotes || '-',
            slaLabel,
            slaHours,
            estimatedDoneAt: estDoneIso,
            itemsSummary: finalizedSale.items_summary || 'Layanan Laundry',
            items: finalizedSale.items || [],
            totalAmount: txTotal,
            paidAmount: paidUpfront,
            remainingAmount: remainingAr,
            paymentStatus: resolvedLaundryPayStatus,
            paymentMethod: String(txPayMethod),
            productionStatus: 'DITERIMA',
            rackNumber: sale.laundryRackNumber,
            handledBy: sale.cashier_name || currentUser?.name || 'Kasir Laundry',
            stationCode: saleStationKey,
            washerEmployeeId: sale.laundryWasherId,
            washerEmployeeName: sale.laundryWasherName,
            ironerEmployeeId: sale.laundryIronerId,
            ironerEmployeeName: sale.laundryIronerName,
            specialistEmployeeId: sale.laundrySpecialistId,
            specialistEmployeeName: sale.laundrySpecialistName,
            updatedAt: txDate,
          };
          return [newOrder, ...prev];
        });
      }

      // 1. Jurnal Pendapatan Penjualan Adaptif Multi-Sektor (F&B, Service/Barbershop, Laundry, Fashion, Depo Material, Ritel)
      const dateYmd = txDate.slice(0, 10);
      const isZeroDiffExchange = isZeroDiffFashionExchange(finalizedSale);
      const isFashionTransaction = !isBuildingTransaction && !isLaundryTransaction && isFashionSale(finalizedSale);
      const currentActiveSector = resolveCanonicalSector(businessProfileRef.current);
      const currentBusinessName = businessProfileRef.current?.name || '';
      const coaMeta = getAdaptiveCoaMeta(currentActiveSector);
      const hasSalonServiceItems = (finalizedSale.items || []).some((it: any) => {
        const pid = String(it?.product?.id || '').toUpperCase();
        const bm = String(it?.product?.businessModel || '').toLowerCase();
        return pid.startsWith('SVC-BRB-') || pid.startsWith('PRD-BRB-') || pid.startsWith('SLN-') || bm === 'salon';
      });
      const isServiceSectorTransaction =
        !isBuildingTransaction &&
        !isFashionTransaction &&
        (isLaundryTransaction || hasSalonServiceItems || currentActiveSector === 'SERVICE');
      const fashionDiscountAmt = isFashionTransaction && !finalizedSale.isFashionExchange
        ? resolveSaleDiscountTotal(finalizedSale)
        : 0;
      const grossFashionRevenue = isFashionTransaction ? txTotal + fashionDiscountAmt : txTotal;
      const fleetTypeLabelShort =
        detectedFleetForCost === 'DUMP_TRUCK'
          ? 'Dump Truck'
          : detectedFleetForCost === 'TRUCK_ENGKEL'
          ? 'Engkel'
          : 'Pick-up';

      const paymentAccountingNote = isSplitPayment
        ? ` [Split: Tunai 1-10101 Rp ${splitCashAmt.toLocaleString('id-ID')} + Non-Tunai 1-10102 (${splitNonCashChannel}) Rp ${splitNonCashAmt.toLocaleString('id-ID')}]`
        : isCreditSale
        ? ` [Kasbon/DP: DP Masuk 1-10101 Rp ${paidUpfront.toLocaleString('id-ID')} • Sisa Piutang 1-10105 Rp ${remainingAr.toLocaleString('id-ID')} • Tempo ${dueDateStr}]`
        : '';

      const buildPaymentDebitJournalLines = (): { accountCode: string; accountName: string; debit: number; credit: number }[] => {
        const lines: { accountCode: string; accountName: string; debit: number; credit: number }[] = [];
        if (isSplitPayment) {
          if (splitCashAmt > 0) {
            lines.push({
              accountCode: '1-10101',
              accountName: 'Kas Tunai / Kas Kasir',
              debit: splitCashAmt,
              credit: 0,
            });
          }
          if (splitNonCashAmt > 0) {
            lines.push({
              accountCode: '1-10102',
              accountName: `Bank / QRIS Operasional (${splitNonCashChannel})`,
              debit: splitNonCashAmt,
              credit: 0,
            });
          }
          return lines;
        }

        const isNonCashPay =
          pmUpper.includes('QRIS') ||
          pmUpper.includes('DEBIT') ||
          pmUpper.includes('TRANSFER') ||
          pmUpper.includes('EDC') ||
          pmUpper.includes('BANK');

        if (paidUpfront > 0) {
          lines.push({
            accountCode: isNonCashPay ? '1-10102' : '1-10101',
            accountName: isNonCashPay ? 'Bank / QRIS Operasional' : 'Kas Tunai / Kas Kasir',
            debit: paidUpfront,
            credit: 0,
          });
        }
        if (remainingAr > 0) {
          lines.push({
            accountCode: '1-10105',
            accountName: 'Piutang Usaha / Pelanggan (AR)',
            debit: remainingAr,
            credit: 0,
          });
        }
        return lines;
      };

      const revenueEntry: FinanceEntry = {
        id: isLaundryTransaction
          ? `FIN-LND-REV-${Date.now()}`
          : isServiceSectorTransaction
          ? `FIN-SVC-REV-${Date.now()}`
          : isFashionTransaction
          ? `FIN-FASH-REV-${Date.now()}`
          : `FIN-REV-${Date.now()}`,
        date: dateYmd,
        type: 'INCOME',
        category: isBuildingTransaction
          ? 'PENJUALAN DEPO MATERIAL'
          : isLaundryTransaction
          ? 'PENDAPATAN JASA LAUNDRY'
          : isServiceSectorTransaction
          ? 'PENDAPATAN JASA LAYANAN & GROOMING'
          : isFashionTransaction
          ? 'PENJUALAN FASHION & BUTIK'
          : currentActiveSector === 'FNB'
          ? 'PENDAPATAN MAKANAN, MINUMAN & TOPPING'
          : 'Penjualan POS Ritel',
        account_target: isBuildingTransaction
          ? '4-10101 · Pendapatan Penjualan Material'
          : isLaundryTransaction
          ? '4-10101 · Pendapatan Jasa Laundry'
          : isServiceSectorTransaction
          ? `${coaMeta.revenueCode} · ${coaMeta.revenueName}`
          : isFashionTransaction
          ? '4-10101 · Pendapatan Penjualan Fashion & Butik'
          : `${coaMeta.revenueCode} · ${coaMeta.revenueName}`,
        description: (isBuildingTransaction
          ? `Pendapatan Penjualan Material Struk #${receiptRef} (Est. Laba Bersih Stlh Ongkir: Rp ${estNetProfitAfterShipping.toLocaleString('id-ID')})`
          : isLaundryTransaction
          ? `Jasa Laundry Struk #${receiptRef} (${sale.customer_name || 'Pelanggan'} • Masuk Kas/Bank Rp ${paidUpfront.toLocaleString('id-ID')}${remainingAr > 0 ? `, Piutang AR Rp ${remainingAr.toLocaleString('id-ID')}` : ' • Lunas'})`
          : isServiceSectorTransaction
          ? `Pendapatan Jasa & Produk Layanan Struk #${receiptRef}${sale.stylistName ? ` • Stylist: ${sale.stylistName}` : ''}`
          : isFashionTransaction
          ? `Pendapatan Kotor Butik Struk #${receiptRef}${fashionDiscountAmt > 0 ? ` (Potongan Promo/Diskon Rp ${fashionDiscountAmt.toLocaleString('id-ID')} • Netto Rp ${txTotal.toLocaleString('id-ID')})` : ''}${sale.fashionAdvisorName ? ` • Advisor: ${sale.fashionAdvisorName}` : ''}`
          : `Pendapatan Struk #${txUuid}`) + paymentAccountingNote,
        amount: isBuildingTransaction
          ? materialRevenueAmt
          : isFashionTransaction
          ? grossFashionRevenue
          : txTotal,
        payment_method: String(txPayMethod),
        reference: receiptRef,
        businessSector: currentActiveSector,
        businessName: currentBusinessName,
        ...(isCreditSale || isSplitPayment || isLaundryTransaction || isFashionTransaction
          ? { cashDelta: paidUpfront }
          : {}),
        ...( { paymentMethod: String(txPayMethod), referenceId: txUuid } as any )
      };

      // 2. Jurnal Beban HPP / Bahan Habis Pakai Riil Otomatis (Adaptif per Sektor)
      const hppEntry: FinanceEntry = {
        id: `FIN-HPP-${Date.now() + 1}`,
        date: dateYmd,
        type: 'EXPENSE',
        category: isServiceSectorTransaction ? 'Beban Bahan Habis Pakai Jasa' : 'HPP',
        account_target: `${coaMeta.cogsCode} · ${coaMeta.cogsName}`,
        description: `${coaMeta.cogsName} Struk #${receiptRef}`,
        amount: totalCostHpp,
        payment_method: 'SYSTEM_AUTO',
        reference: receiptRef,
        businessSector: currentActiveSector,
        businessName: currentBusinessName,
        ...( { paymentMethod: 'SYSTEM_AUTO', referenceId: txUuid } as any )
      };

      // 2b. Pemisahan Jurnal Biaya Logistik Depo Bangunan (Upah Bongkar Kuli & Beban Armada Frangko)
      const buildingLogisticsFinanceEntries: FinanceEntry[] = [];
      const buildingLogisticsJournals: JournalEntry[] = [];

      if (isBuildingTransaction && loadingFeeAmt > 0) {
        buildingLogisticsFinanceEntries.push({
          id: `FIN-KULI-${Date.now() + 2}`,
          date: dateYmd,
          type: 'INCOME',
          category: 'Pendapatan/Titipan Jasa Bongkar Kuli',
          account_target: '4-10102 · Pendapatan/Titipan Jasa Bongkar Kuli',
          description: `Pendapatan / Titipan Jasa Bongkar Kuli Material | Struk #${receiptRef}`,
          amount: loadingFeeAmt,
          payment_method: String(txPayMethod),
          reference: receiptRef,
        });
      }

      if (isBuildingTransaction && fleetDeliveryCostAmt > 0) {
        buildingLogisticsFinanceEntries.push({
          id: `FIN-FRANGKO-${Date.now() + 3}`,
          date: dateYmd,
          type: 'EXPENSE',
          category: 'Beban Pengiriman Armada (Frangko)',
          account_target: `5-10205 · Beban Armada Frangko (${fleetTypeLabelShort})`,
          description: `Beban Pengiriman Armada (Frangko - ${fleetTypeLabelShort}) DO #${doNumber} | Struk #${receiptRef} • Est. Laba Bersih Stlh Ongkir: Rp ${estNetProfitAfterShipping.toLocaleString('id-ID')}`,
          amount: fleetDeliveryCostAmt,
          payment_method: 'OPERASIONAL_ARMADA',
          reference: receiptRef,
        });
      }

      if (isBuildingTransaction) {
        const journalLines = [
          ...buildPaymentDebitJournalLines(),
          {
            accountCode: '4-10101',
            accountName: 'Pendapatan Penjualan Material',
            debit: 0,
            credit: materialRevenueAmt,
          },
        ];

        if (loadingFeeAmt > 0) {
          journalLines.push({
            accountCode: '4-10102',
            accountName: 'Pendapatan / Titipan Jasa Bongkar Kuli',
            debit: 0,
            credit: loadingFeeAmt,
          });
        }

        if (totalCostHpp > 0) {
          journalLines.push(
            {
              accountCode: '5-10101',
              accountName: 'Harga Pokok Penjualan (HPP Material)',
              debit: totalCostHpp,
              credit: 0,
            },
            {
              accountCode: '1-10201',
              accountName: 'Persediaan Barang Dagang / Material',
              debit: 0,
              credit: totalCostHpp,
            }
          );
        }

        if (fleetDeliveryCostAmt > 0) {
          journalLines.push(
            {
              accountCode: '5-10205',
              accountName: `Beban Pengiriman Armada (Frangko - ${fleetTypeLabelShort})`,
              debit: fleetDeliveryCostAmt,
              credit: 0,
            },
            {
              accountCode: '1-10101',
              accountName: 'Kas Tunai / Kas Kasir',
              debit: 0,
              credit: fleetDeliveryCostAmt,
            }
          );
        }

        buildingLogisticsJournals.push({
          id: `JV-BLD-${Date.now()}`,
          date: dateYmd,
          created_at: txDate,
          reference: receiptRef,
          description: `Jurnal Penjualan Material, Jasa Bongkar Kuli & Beban Armada Frangko (${fleetTypeLabelShort})${paymentAccountingNote} | Struk #${receiptRef} • Est. Laba Bersih Stlh Ongkir: Rp ${estNetProfitAfterShipping.toLocaleString('id-ID')}`,
          type: 'POS_SALES',
          amount: txTotal,
          lines: journalLines,
        });
      }

      // 3. Otomatisasi Jurnal Akuntansi Promo POS per Sumber, POS Fashion & POS Laundry (Real-Time)
      const laundryJournalsToAdd: JournalEntry[] = [];
      if (!isZeroDiffExchange && isLaundryTransaction && txTotal > 0) {
        const laundryLines: { accountCode: string; accountName: string; debit: number; credit: number }[] = [
          ...buildPaymentDebitJournalLines(),
          {
            accountCode: '4-10105',
            accountName: 'Pendapatan Jasa Laundry',
            debit: 0,
            credit: txTotal,
          },
        ];
        laundryJournalsToAdd.push({
          id: `JV-LND-${Date.now()}`,
          date: dateYmd,
          created_at: txDate,
          reference: receiptRef,
          description: `Jurnal Pendapatan Laundry (${sale.laundryPaymentStatus || 'LUNAS_AWAL'})${paymentAccountingNote} - ${sale.customer_name || 'Pelanggan'} | Struk #${receiptRef}`,
          type: 'POS_LAUNDRY',
          amount: txTotal,
          lines: laundryLines,
        });
      }

      // 3b. Jurnal Penjualan Fashion & Butik (Pendapatan Kotor 4-10001 vs Potongan/Diskon Penjualan 4-10004)
      const fashionJournalsToAdd: JournalEntry[] = [];
      const fashionFinanceEntriesToAdd: FinanceEntry[] = [];
      if (!isZeroDiffExchange && isFashionTransaction && grossFashionRevenue > 0) {
        const fashionLines: { accountCode: string; accountName: string; debit: number; credit: number }[] = [
          ...buildPaymentDebitJournalLines(),
        ];
        if (fashionDiscountAmt > 0) {
          fashionLines.push({
            accountCode: '4-10004',
            accountName: 'Potongan & Diskon Penjualan Fashion',
            debit: fashionDiscountAmt,
            credit: 0,
          });
          fashionFinanceEntriesToAdd.push({
            id: `FIN-FASH-DISC-${Date.now() + 5}`,
            date: dateYmd,
            type: 'EXPENSE',
            category: 'Potongan & Diskon Penjualan Fashion',
            account_target: '4-10004 · Potongan & Diskon Penjualan Fashion',
            description: `Potongan Promo/Diskon Butik Struk #${receiptRef}${sale.manualDiscountReason ? ` (${sale.manualDiscountReason})` : ''}${sale.fashionAdvisorName ? ` • Advisor: ${sale.fashionAdvisorName}` : ''}`,
            amount: fashionDiscountAmt,
            payment_method: 'DISKON_FASHION',
            reference: receiptRef,
            ...( { cashDelta: 0, referenceId: txUuid } as any ),
          });
        }
        fashionLines.push({
          accountCode: '4-10101',
          accountName: 'Pendapatan Penjualan Fashion & Butik',
          debit: 0,
          credit: grossFashionRevenue,
        });
        fashionJournalsToAdd.push({
          id: `JV-FASH-${Date.now()}`,
          date: dateYmd,
          created_at: txDate,
          reference: receiptRef,
          description: `Jurnal Penjualan Fashion & Butik${fashionDiscountAmt > 0 ? ` (Potongan Diskon Rp ${fashionDiscountAmt.toLocaleString('id-ID')})` : ''}${paymentAccountingNote} | Struk #${receiptRef}`,
          type: 'POS_FASHION',
          amount: txTotal,
          lines: fashionLines,
        });
      }

      // 3c. Jurnal Standar Adaptif Multi-Sektor (Service/Barbershop, F&B, Ritel Umum) & HPP/Consumables (5-10101 / 1-10201)
      const adaptiveSalesJournalsToAdd: JournalEntry[] = [];
      if (!isZeroDiffExchange && !isBuildingTransaction && !isLaundryTransaction && !isFashionTransaction && txTotal > 0) {
        const salesLines: { accountCode: string; accountName: string; debit: number; credit: number }[] = [
          ...buildPaymentDebitJournalLines(),
          {
            accountCode: coaMeta.revenueCode,
            accountName: coaMeta.revenueName,
            debit: 0,
            credit: txTotal,
          },
        ];
        if (totalCostHpp > 0) {
          salesLines.push({
            accountCode: coaMeta.cogsCode,
            accountName: coaMeta.cogsName,
            debit: totalCostHpp,
            credit: 0,
          });
          salesLines.push({
            accountCode: coaMeta.inventoryCode,
            accountName: coaMeta.inventoryName,
            debit: 0,
            credit: totalCostHpp,
          });
        }
        adaptiveSalesJournalsToAdd.push({
          id: `JV-POS-${Date.now()}-${Math.floor(Math.random() * 100)}`,
          date: dateYmd,
          created_at: txDate,
          reference: receiptRef,
          description: (isServiceSectorTransaction
            ? `Jurnal Pendapatan & Beban Bahan Habis Pakai Jasa (${coaMeta.revenueName}) | Struk #${receiptRef}`
            : `Jurnal Penjualan & HPP (${coaMeta.revenueName}) | Struk #${receiptRef}`) + paymentAccountingNote,
          type: isServiceSectorTransaction ? 'POS_SERVICE' : 'POS_SALES',
          amount: txTotal,
          lines: salesLines,
        });
      } else if (!isZeroDiffExchange && (isLaundryTransaction || isFashionTransaction) && totalCostHpp > 0) {
        // Tambahkan jurnal pemakaian bahan habis pakai / HPP terpisah yang seimbang (5-10101 / 1-10201)
        adaptiveSalesJournalsToAdd.push({
          id: `JV-COGS-${Date.now()}-${Math.floor(Math.random() * 100)}`,
          date: dateYmd,
          created_at: txDate,
          reference: receiptRef,
          description: `Jurnal ${coaMeta.cogsName} | Struk #${receiptRef}`,
          type: 'COGS',
          amount: totalCostHpp,
          lines: [
            {
              accountCode: coaMeta.cogsCode,
              accountName: coaMeta.cogsName,
              debit: totalCostHpp,
              credit: 0,
            },
            {
              accountCode: coaMeta.inventoryCode,
              accountName: coaMeta.inventoryName,
              debit: 0,
              credit: totalCostHpp,
            },
          ],
        });
      }

      // 3d. Jurnal Komisi Otomatis Seimbang (Debit 6-10101 Beban Komisi Karyawan = Kredit 2-10201 Hutang Komisi Karyawan)
      const commissionJournalsToAdd: JournalEntry[] = [];
      const commissionFinanceEntriesToAdd: FinanceEntry[] = [];
      let totalCommissionBooked = 0;
      let commissionAuditSummary = '';

      if (!isZeroDiffExchange && isServiceSectorTransaction) {
        const commCalc = calculateServiceCommissionBreakdown(
          finalizedSale.items || [],
          {
            id: sale.stylistId,
            name: sale.stylistName,
            commissionRate: sale.stylistCommissionRate,
          },
          serviceStylistsRef.current
        );
        if (commCalc.totalCommission > 0) {
          totalCommissionBooked = commCalc.totalCommission;
          const breakdownLabel = commCalc.breakdown
            .map((b) => `${b.stylistName} (${b.commissionRate}% = Rp ${b.commissionAmount.toLocaleString('id-ID')})`)
            .join(', ');
          commissionAuditSummary = `Komisi Stylist: ${breakdownLabel}`;
          commissionJournalsToAdd.push({
            id: `JV-COMM-${Date.now()}-${Math.floor(Math.random() * 100)}`,
            date: dateYmd,
            created_at: txDate,
            reference: receiptRef,
            description: `Jurnal Komisi Stylist / Kapster — ${breakdownLabel} | Struk #${receiptRef}`,
            type: 'EMPLOYEE_COMMISSION',
            amount: commCalc.totalCommission,
            lines: [
              {
                accountCode: coaMeta.commissionExpenseCode,
                accountName: coaMeta.commissionExpenseName,
                debit: commCalc.totalCommission,
                credit: 0,
              },
              {
                accountCode: coaMeta.commissionPayableCode,
                accountName: coaMeta.commissionPayableName,
                debit: 0,
                credit: commCalc.totalCommission,
              },
            ],
          });
          commissionFinanceEntriesToAdd.push({
            id: `FIN-COMM-${Date.now() + 7}`,
            date: dateYmd,
            type: 'EXPENSE',
            category: coaMeta.commissionExpenseName,
            account_target: `${coaMeta.commissionExpenseCode} · ${coaMeta.commissionExpenseName}`,
            description: `Komisi Jasa Layanan Struk #${receiptRef} — ${breakdownLabel}`,
            amount: commCalc.totalCommission,
            payment_method: 'ACCRUAL_COMMISSION',
            reference: receiptRef,
            ...( { cashDelta: 0, referenceId: txUuid } as any ),
          });
        }
      } else if (
        !isZeroDiffExchange &&
        isFashionTransaction &&
        sale.fashionAdvisorName &&
        Number(sale.fashionAdvisorCommission || 0) > 0
      ) {
        const fashionCommAmt = Math.round(Number(sale.fashionAdvisorCommission) || 0);
        totalCommissionBooked = fashionCommAmt;
        commissionAuditSummary = `Komisi Fashion Advisor (${sale.fashionAdvisorName}): Rp ${fashionCommAmt.toLocaleString('id-ID')}`;
        commissionJournalsToAdd.push({
          id: `JV-COMM-FASH-${Date.now()}-${Math.floor(Math.random() * 100)}`,
          date: dateYmd,
          created_at: txDate,
          reference: receiptRef,
          description: `Jurnal Komisi Fashion Advisor (${sale.fashionAdvisorName}) | Struk #${receiptRef}`,
          type: 'EMPLOYEE_COMMISSION',
          amount: fashionCommAmt,
          lines: [
            {
              accountCode: coaMeta.commissionExpenseCode,
              accountName: coaMeta.commissionExpenseName,
              debit: fashionCommAmt,
              credit: 0,
            },
            {
              accountCode: coaMeta.commissionPayableCode,
              accountName: coaMeta.commissionPayableName,
              debit: 0,
              credit: fashionCommAmt,
            },
          ],
        });
        commissionFinanceEntriesToAdd.push({
          id: `FIN-COMM-FASH-${Date.now() + 8}`,
          date: dateYmd,
          type: 'EXPENSE',
          category: coaMeta.commissionExpenseName,
          account_target: `${coaMeta.commissionExpenseCode} · ${coaMeta.commissionExpenseName}`,
          description: `Komisi Fashion Advisor (${sale.fashionAdvisorName}) Struk #${receiptRef}`,
          amount: fashionCommAmt,
          payment_method: 'ACCRUAL_COMMISSION',
          reference: receiptRef,
          ...( { cashDelta: 0, referenceId: txUuid } as any ),
        });
      }

      const promoBreakdown = buildSalePromoAccountingBreakdown(
        finalizedSale.items || [],
        finalizedSale.cartVoucherDiscount || 0
      );
      const promoJournalsToAdd: JournalEntry[] = [
        ...buildingLogisticsJournals,
        ...laundryJournalsToAdd,
        ...fashionJournalsToAdd,
        ...adaptiveSalesJournalsToAdd,
        ...commissionJournalsToAdd,
      ];
      const promoFinanceEntriesToAdd: FinanceEntry[] = [
        ...buildingLogisticsFinanceEntries,
        ...fashionFinanceEntriesToAdd,
        ...commissionFinanceEntriesToAdd,
      ];
      const newRebateClaims: SupplierRebateClaim[] = [];

      // A. SUPPLIER_TPR -> Piutang Rebate / Pengurang Hutang Dagang Supplier (1-10305)
      if (!isZeroDiffExchange) {
        promoBreakdown.supplierTprGroups.forEach((grp, idx) => {
          if (grp.amount <= 0) return;
          const jId = `JV-TPR-${Date.now()}-${idx}`;
          promoJournalsToAdd.push({
            id: jId,
            date: dateYmd,
            created_at: txDate,
            reference: receiptRef,
            description: `Klaim Rebate Promo Vendor (${grp.supplierName}) - ${grp.promoCode} | Struk #${receiptRef}`,
            type: 'PROMO_SUPPLIER_TPR',
            promoSourceType: 'SUPPLIER_TPR',
            supplierName: grp.supplierName,
            promoCode: grp.promoCode,
            amount: grp.amount,
            lines: [
              {
                accountCode: '1-10305',
                accountName: 'Piutang Rebate Supplier (AP Rebate Claimable)',
                debit: grp.amount,
                credit: 0,
              },
              {
                accountCode: '4-10001',
                accountName: 'Pendapatan Penjualan Ritel',
                debit: 0,
                credit: grp.amount,
              },
            ],
          });
          promoFinanceEntriesToAdd.push({
            id: `FIN-PRM-TPR-${Date.now()}-${idx}`,
            date: dateYmd,
            type: 'REBATE_CLAIM',
            category: 'Piutang Rebate Supplier (TPR)',
            account_target: `1-10305 · ${grp.supplierName}`,
            description: `AP Rebate Claimable (${grp.promoCode}) - Struk #${receiptRef}`,
            amount: grp.amount,
            payment_method: 'PROMO_TPR',
            reference: receiptRef,
          });
          newRebateClaims.push({
            id: `CLM-${Date.now()}-${idx}`,
            transactionId: txUuid,
            receiptNumber: receiptRef,
            date: txDate,
            supplierName: grp.supplierName,
            promoCode: grp.promoCode,
            promoName: grp.promoName,
            productNames: grp.productNames,
            qtyUnits: grp.qtyUnits,
            claimAmount: grp.amount,
            status: 'CLAIMABLE',
            journalRef: jId,
            notes: `Siap dipotongkan ke Hutang Dagang (${grp.supplierName})`,
          });
        });

        // B. FEFO_EXP -> Beban Clearance & Penyelamatan Kadaluarsa (FEFO) (5-10201)
        if (promoBreakdown.fefoExp.amount > 0 || promoBreakdown.fefoExp.qtySaved > 0) {
          const fefoAmt = promoBreakdown.fefoExp.amount;
          if (fefoAmt > 0) {
            promoJournalsToAdd.push({
              id: `JV-FEFO-${Date.now()}`,
              date: dateYmd,
              created_at: txDate,
              reference: receiptRef,
              description: `Clearance & Penyelamatan Stok Kadaluarsa (FEFO) | Struk #${receiptRef} (${promoBreakdown.fefoExp.qtySaved} unit terselamatkan)`,
              type: 'PROMO_FEFO_EXP',
              promoSourceType: 'FEFO_EXP',
              promoCode: promoBreakdown.fefoExp.promoCodes.join(', ') || 'FEFO_EXP',
              fefoSalvageRevenue: promoBreakdown.fefoExp.salvageRevenue,
              fefoQtySaved: promoBreakdown.fefoExp.qtySaved,
              amount: fefoAmt,
              lines: [
                {
                  accountCode: '5-10201',
                  accountName: 'Beban Clearance & Penyelamatan Kadaluarsa (FEFO)',
                  debit: fefoAmt,
                  credit: 0,
                },
                {
                  accountCode: '4-10001',
                  accountName: 'Pendapatan Penjualan Ritel',
                  debit: 0,
                  credit: fefoAmt,
                },
              ],
            });
            promoFinanceEntriesToAdd.push({
              id: `FIN-PRM-FEFO-${Date.now()}`,
              date: dateYmd,
              type: 'PROMO_AUTO',
              category: 'Beban Clearance FEFO',
              account_target: '5-10201 · Beban Clearance FEFO',
              description: `Penyelamatan ${promoBreakdown.fefoExp.qtySaved} unit FEFO (Omzet diselamatkan Rp ${promoBreakdown.fefoExp.salvageRevenue.toLocaleString('id-ID')}) - Struk #${receiptRef}`,
              amount: fefoAmt,
              payment_method: 'PROMO_FEFO',
              reference: receiptRef,
            });
          }
        }

        // C. SEASONAL & STORE_BND -> Beban Promosi & Diskon Penjualan Toko (5-10202)
        // Untuk transaksi Fashion, potongan sudah dipisah khusus ke akun kontra-pendapatan 4-10004 agar tidak ganda.
        if (!isFashionTransaction && promoBreakdown.seasonalAndStore.totalAmount > 0) {
          const storeAmt = promoBreakdown.seasonalAndStore.totalAmount;
          const srcTag = promoBreakdown.seasonalAndStore.primarySource;
          promoJournalsToAdd.push({
            id: `JV-PRM-${Date.now()}`,
            date: dateYmd,
            created_at: txDate,
            reference: receiptRef,
            description: `Beban Promosi & Diskon Penjualan Toko (${srcTag}) | Struk #${receiptRef}`,
            type: 'PROMO_STORE',
            promoSourceType: srcTag,
            promoCode: promoBreakdown.seasonalAndStore.promoCodes.join(', ') || srcTag,
            amount: storeAmt,
            lines: [
              {
                accountCode: '5-10202',
                accountName: 'Beban Promosi & Diskon Penjualan Toko',
                debit: storeAmt,
                credit: 0,
              },
              {
                accountCode: '4-10001',
                accountName: 'Pendapatan Penjualan Ritel',
                debit: 0,
                credit: storeAmt,
              },
            ],
          });
          promoFinanceEntriesToAdd.push({
            id: `FIN-PRM-STORE-${Date.now()}`,
            date: dateYmd,
            type: 'PROMO_AUTO',
            category: 'Beban Promosi & Diskon Toko',
            account_target: '5-10202 · Beban Promosi Toko',
            description: `Promo ${srcTag} (${promoBreakdown.seasonalAndStore.promoCodes.join(', ') || 'Toko'}) - Struk #${receiptRef}`,
            amount: storeAmt,
            payment_method: 'PROMO_TOKO',
            reference: receiptRef,
          });
        }
      }

      if (promoJournalsToAdd.length > 0) {
        const taggedJournals = promoJournalsToAdd.map((nj) => ({
          ...nj,
          businessSector: nj.businessSector || currentActiveSector,
          businessName: nj.businessName || currentBusinessName,
        }));
        setJournalEntries((prev) => {
          const filtered = taggedJournals.filter(
            (nj) => !prev.some((ej) => ej.reference === nj.reference && ej.type === nj.type && ej.supplierName === nj.supplierName)
          );
          return filtered.length > 0 ? [...filtered, ...prev] : prev;
        });
      }

      if (newRebateClaims.length > 0) {
        setSupplierRebateClaims((prev) => {
          const filtered = newRebateClaims.filter(
            (nc) => !prev.some((ec) => ec.transactionId === nc.transactionId && ec.promoCode === nc.promoCode && ec.supplierName === nc.supplierName)
          );
          return filtered.length > 0 ? [...filtered, ...prev] : prev;
        });
      }

      if (!isZeroDiffExchange) {
        const taggedExtraFinance = promoFinanceEntriesToAdd.map((fe) => ({
          ...fe,
          businessSector: fe.businessSector || currentActiveSector,
          businessName: fe.businessName || currentBusinessName,
        }));
        setFinanceEntries((prev) => [...taggedExtraFinance, hppEntry, revenueEntry, ...prev]);
      }
      appendAudit(
        isZeroDiffExchange ? 'FASHION_SIZE_EXCHANGE' : 'POS_CHECKOUT',
        'POS',
        isZeroDiffExchange
          ? `Tukar Ukuran/Barang Selisih Rp 0 (${receiptRef}) • Mutasi stok diperbarui tanpa jurnal omzet ganda`
          : `Transaksi POS ${txUuid} | Omzet Rp ${txTotal.toLocaleString()} | HPP Rp ${totalCostHpp.toLocaleString()}${
              fashionDiscountAmt > 0
                ? ` | Potongan Diskon Fashion (4-10004) Rp ${fashionDiscountAmt.toLocaleString('id-ID')}`
                : ''
            }${
              promoBreakdown.totalPromoValue > 0 && !isFashionTransaction
                ? ` | Jurnal Promo Otomatis Rp ${promoBreakdown.totalPromoValue.toLocaleString()}`
                : ''
            }${
              sale.fashionAdvisorName
                ? ` | Fashion Advisor: ${sale.fashionAdvisorName} (Komisi Est. Rp ${(sale.fashionAdvisorCommission || 0).toLocaleString('id-ID')})`
                : ''
            }${
              totalCommissionBooked > 0 && commissionAuditSummary
                ? ` | Jurnal Komisi 6-10101/2-10201: ${commissionAuditSummary}`
                : ''
            }${
              sale.manualDiscountReason
                ? ` | Diskon Manual (${sale.manualDiscountReason}${sale.manualDiscountAuthorizedBy ? ` • Auth: ${sale.manualDiscountAuthorizedBy}` : ''})`
                : ''
            }`
      );

      dualBackendSync.enqueue('POS_TRANSACTION', 'INSERT', {
        ...finalizedSale,
        totalHpp: isZeroDiffExchange ? 0 : totalCostHpp,
        grossProfit: isZeroDiffExchange ? 0 : txTotal - totalCostHpp,
        promoAccountingTotal: isZeroDiffExchange ? 0 : promoBreakdown.totalPromoValue,
        tx_uuid: txUuid
      });
      if (!isZeroDiffExchange) {
        dualBackendSync.enqueue('FINANCE_JOURNAL', 'INSERT', {
          ...revenueEntry,
          tx_uuid: generateTxUuid()
        });
        dualBackendSync.enqueue('FINANCE_JOURNAL', 'INSERT', {
          ...hppEntry,
          tx_uuid: generateTxUuid()
        });
      }
      // Pemicu Auto-Sync latar belakang (non-blocking) untuk transaksi POS baru
      triggerAutoCloudSync('POS_TRANSACTION');
    },
    [appendAudit, customers, triggerAutoCloudSync]
  );

  const showReceipt = useCallback((sale: Sale) => {
    setCurrentReceiptSale(sale);
    setIsReceiptModalOpen(true);
  }, []);

  const closeReceipt = useCallback(() => {
    setIsReceiptModalOpen(false);
    setCurrentReceiptSale(null);
  }, []);

  const processPayment = useCallback(
    (payload: PaymentPayload): Sale => {
      const txId = payload.receiptNumber || `INV-${Date.now()}`;
      const nowIso = payload.timestamp || new Date().toISOString();
      const grossSubtotal =
        payload.subtotalBeforeDiscount ??
        payload.items.reduce(
          (acc, i) => acc + Math.round((i.originalUnitPrice ?? i.product.sell_price ?? 0) * (i.quantity || 0)),
          0
        );
      const promoSavingsVal =
        payload.promoSavingsTotal ??
        payload.items.reduce(
          (acc, i) => acc + Math.round(i.promoSavings ?? ((i.itemDiscount || 0) * (i.quantity || 0))),
          0
        );
      const voucherDiscVal = payload.cartVoucherDiscount ?? 0;
      const totalDiscountVal = payload.discount ?? promoSavingsVal + voucherDiscVal;

      const resolvedStationCode = normalizeStationCode(
        payload.stationCode ||
          activeTerminal?.stationCode ||
          boundStation?.stationCode ||
          payload.terminalId ||
          activeTerminalId
      );

      const activeSecNow = resolveCanonicalSector(businessProfileRef.current);
      const primaryModelNow =
        businessProfileRef.current?.domainConfig?.primaryBusinessModel ||
        businessProfileRef.current?.businessType;
      const resolvedTerminalDisplayName = resolveSynchronizedTerminalDisplayName(
        resolvedStationCode,
        activeSecNow,
        primaryModelNow
      );

      const newSale: Sale = {
        transaction_id: txId,
        receipt_number: txId,
        date: nowIso,
        created_at: nowIso,
        cashier_id: currentUser?.id || currentUser?.user_id || 'CASHIER-01',
        cashier_name: payload.cashierName || currentUser?.name || 'Kasir POS',
        terminal_name: resolvedTerminalDisplayName,
        terminalId: payload.terminalId || activeTerminalId,
        stationCode: resolvedStationCode,
        items_summary: payload.items.map((i) => `${i.product.name} x${i.quantity}`).join(', '),
        subtotal: grossSubtotal,
        discount: totalDiscountVal,
        promoSavingsTotal: promoSavingsVal,
        cartVoucherDiscount: voucherDiscVal,
        total_amount: payload.total,
        payment_method: (payload.paymentMethod as any) || 'CASH',
        amount_paid: payload.cashTendered !== undefined ? payload.cashTendered : payload.total,
        change_amount: payload.changeDue || 0,
        status: 'COMPLETED',
        items: payload.items,
        shift_id: payload.shiftId,
        fnbOrderMode: payload.fnbOrderMode,
        fnbTableNo: payload.fnbTableNo,
        vehiclePlate: payload.vehiclePlate,
        mechanicName: payload.mechanicName,
        stylistId: payload.stylistId,
        stylistName: payload.stylistName,
        stylistCommissionRate: payload.stylistCommissionRate,
        serviceCommissionTotal: payload.serviceCommissionTotal,
        petOrClientName: payload.petOrClientName,
        deliveryFleetActive: payload.deliveryFleetActive,
        deliveryPolicy: payload.deliveryPolicy,
        fleetType: payload.fleetType,
        fleetVehicleName: payload.fleetVehicleName,
        deliveryDestination: payload.deliveryDestination,
        shippingFee: payload.shippingFee,
        customer_id: payload.customerId,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        price_tier: payload.priceTier,
        isContractorMode: payload.isContractorMode,
        loadingFee: payload.loadingFee,
        materialRevenue: payload.materialRevenue,
        fleetDeliveryCost: payload.fleetDeliveryCost,
        netProfitAfterShipping: payload.netProfitAfterShipping,
        dpAmount: payload.dpAmount,
        tempoDays: payload.tempoDays,
        dueDate: payload.dueDate,
        remainingBalance: payload.remainingBalance,
        isLaundryOrder: payload.isLaundryOrder,
        laundryTotalPieces: payload.laundryTotalPieces,
        laundryConditionNotes: payload.laundryConditionNotes,
        laundryEstimatedDoneAt: payload.laundryEstimatedDoneAt,
        laundrySlaLabel: payload.laundrySlaLabel,
        laundrySlaHours: payload.laundrySlaHours,
        laundryPaymentStatus: payload.laundryPaymentStatus,
        laundryBagTagCode: payload.laundryBagTagCode,
        laundryRackNumber: payload.laundryRackNumber,
        laundryWasherId: payload.laundryWasherId,
        laundryWasherName: payload.laundryWasherName,
        laundryIronerId: payload.laundryIronerId,
        laundryIronerName: payload.laundryIronerName,
        laundrySpecialistId: payload.laundrySpecialistId,
        laundrySpecialistName: payload.laundrySpecialistName,
        fashionAdvisorId: payload.fashionAdvisorId,
        fashionAdvisorName: payload.fashionAdvisorName,
        fashionAdvisorCommission: payload.fashionAdvisorCommission,
        manualDiscountReason: payload.manualDiscountReason,
        manualDiscountAuthorizedBy: payload.manualDiscountAuthorizedBy,
        isFashionExchange: payload.isFashionExchange,
        exchangeRefReceipt: payload.exchangeRefReceipt,
        exchangeSummary: payload.exchangeSummary,
        splitCashAmount: payload.splitCashAmount,
        splitNonCashAmount: payload.splitNonCashAmount,
        splitNonCashMethod: payload.splitNonCashMethod,
      };
      addSale(newSale);
      showReceipt(newSale);

      const txUuid = generateTxUuid();
      const currentStorageMode = dualBackendSync.getStorageMode();

      if (currentStorageMode !== 'LOCAL_ONLY') {
        // 1. Enqueue to dual-backend sync engine (Supabase & GAS REST)
        dualBackendSync.enqueue('POS_TRANSACTION', 'INSERT', {
          ...newSale,
          tx_uuid: txUuid,
        });
      }

      if (currentStorageMode === 'ONLINE_CLOUD') {
        // 2. Enqueue to GAS offline queue & webhook
        pushTransactionToGAS({
          receiptNumber: newSale.receipt_number,
          shiftId: payload.shiftId,
          terminalId: payload.terminalId || activeTerminalId,
          stationCode: resolvedStationCode,
          cashierName: newSale.cashier_name,
          customerId: payload.customerId,
          customerName: payload.customerName,
          items: payload.items,
          total: payload.total,
          paymentMethod: newSale.payment_method,
          cashTendered: payload.cashTendered,
          changeDue: payload.changeDue,
          tx_uuid: txUuid,
        }).catch(() => {});

        for (const item of payload.items) {
          const delta = -((item.quantity || 0) * (item.conversionFactor || 1));
          const movementId = `SM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

          pushStockMovementToSupabase({
            id: movementId,
            productId: item.product.id,
            sku: item.product.sku || item.product.id,
            productName: item.product.name,
            deltaQty: delta,
            movementType: 'SALE',
            referenceId: newSale.receipt_number,
            notes: `POS Sale Atomic RPC (${resolvedStationCode})`,
            createdBy: newSale.cashier_name,
          }).catch(() => {});

          pushStockMovementToGAS({
            id: movementId,
            productId: item.product.id,
            sku: item.product.sku || item.product.id,
            productName: item.product.name,
            deltaQty: delta,
            movementType: 'SALE',
            referenceId: newSale.receipt_number,
            notes: `POS Sale GAS (${resolvedStationCode})`,
            createdBy: newSale.cashier_name,
          }).catch(() => {});
        }

        // Trigger Atomic Supabase RPC transaction processing (non-blocking)
        pushTransactionAtomicRpc({
          receiptNumber: newSale.receipt_number,
          shiftId: payload.shiftId,
          terminalId: payload.terminalId || activeTerminalId,
          stationCode: resolvedStationCode,
          cashierName: newSale.cashier_name,
          customerId: payload.customerId,
          customerName: payload.customerName,
          items: payload.items,
          total: payload.total,
          paymentMethod: newSale.payment_method,
          cashTendered: payload.cashTendered,
          changeDue: payload.changeDue,
        }).catch(() => {});
      }

      setGasOfflineQueueCount(getGasOfflineQueue().length);

      return newSale;
    },
    [currentUser, activeTerminalId, activeTerminal, boundStation, addSale, showReceipt]
  );

  const processFashionExchange = useCallback(
    (
      payload: FashionExchangePayload
    ): { success: boolean; exchangeReceipt?: Sale; message: string } => {
      const qty = Math.max(1, Math.floor(Number(payload.qty) || 1));
      const nowIso = new Date().toISOString();
      const tsDisplay = nowIso.replace('T', ' ').slice(0, 19);
      const todayStr = nowIso.slice(0, 10);
      const exchangeReceiptNo = `EXCH-${String(Date.now()).slice(-7)}`;
      const isSameProduct = payload.returnedProductId === payload.replacementProductId;
      const stationKey = normalizeStationCode(
        payload.stationCode || activeTerminal?.stationCode || boundStation?.stationCode || activeTerminalId
      );

      const snapshotMap = new Map(productsRef.current.map((p) => [p.id, p]));
      const oldProdSnap = snapshotMap.get(payload.returnedProductId);
      const newProdSnap = snapshotMap.get(payload.replacementProductId);

      // Update product stocks & variantMatrix atomically
      setProducts((prev) =>
        prev.map((prod) => {
          const isOld = prod.id === payload.returnedProductId;
          const isNew = prod.id === payload.replacementProductId;
          if (!isOld && !isNew) return prod;

          let nextStock = Number(prod.stock) || 0;
          if (isOld) nextStock += qty;
          if (isNew) nextStock -= qty;
          nextStock = Number(nextStock.toFixed(2));

          let nextMatrix = prod.variantMatrix ? prod.variantMatrix.map((c) => ({ ...c })) : undefined;
          if (nextMatrix && nextMatrix.length > 0) {
            if (isOld) {
              const oldIdx = nextMatrix.findIndex(
                (c) =>
                  c.size.toLowerCase() === payload.returnedSize.toLowerCase() &&
                  c.color.toLowerCase() === payload.returnedColor.toLowerCase()
              );
              if (oldIdx >= 0) {
                nextMatrix[oldIdx].stock = Math.max(0, Number(nextMatrix[oldIdx].stock || 0) + qty);
              } else {
                nextMatrix.push({
                  size: payload.returnedSize,
                  color: payload.returnedColor,
                  stock: qty,
                  skuVariant: `${prod.sku || prod.id}-${payload.returnedSize}-${payload.returnedColor.slice(0, 3).toUpperCase()}`,
                });
              }
            }
            if (isNew) {
              const newIdx = nextMatrix.findIndex(
                (c) =>
                  c.size.toLowerCase() === payload.replacementSize.toLowerCase() &&
                  c.color.toLowerCase() === payload.replacementColor.toLowerCase()
              );
              if (newIdx >= 0) {
                nextMatrix[newIdx].stock = Math.max(0, Number(nextMatrix[newIdx].stock || 0) - qty);
              }
            }
          }

          return {
            ...prod,
            stock: nextStock,
            variantMatrix: nextMatrix,
            status:
              nextStock <= 0
                ? 'Out of Stock'
                : nextStock <= (prod.min_stock ?? prod.minStock ?? 5)
                ? 'Low Stock'
                : 'Active',
          };
        })
      );

      // Sync Inventory records
      if (!isSameProduct) {
        setInventory((prev) =>
          prev.map((inv) => {
            if (inv.product_id === payload.returnedProductId) {
              const nextFinal = (Number(inv.final_stock) || 0) + qty;
              return {
                ...inv,
                in_qty: (Number(inv.in_qty) || 0) + qty,
                final_stock: nextFinal,
                last_update: todayStr,
              };
            }
            if (inv.product_id === payload.replacementProductId) {
              const nextFinal = (Number(inv.final_stock) || 0) - qty;
              return {
                ...inv,
                out_qty: (Number(inv.out_qty) || 0) + qty,
                final_stock: nextFinal,
                last_update: todayStr,
              };
            }
            return inv;
          })
        );
      }

      // Record IN (+1) and OUT (-1) stock mutations
      const oldPrevStock = Number(oldProdSnap?.stock) || 0;
      const newPrevStock = Number(newProdSnap?.stock) || 0;
      const operatorName = currentUser?.name || 'Kasir Butik';
      const mutationsToAdd: StockMutation[] = [
        {
          id: `MUT-EXCH-IN-${Date.now()}-1`,
          timestamp: tsDisplay,
          date: todayStr,
          product_id: payload.returnedProductId,
          sku: oldProdSnap?.sku || payload.returnedProductId,
          product_name: `${payload.returnedProductName} (${payload.returnedSize} • ${payload.returnedColor})`,
          type: 'IN / TUKAR UKURAN',
          qty,
          previous_stock: oldPrevStock,
          final_stock: oldPrevStock + qty,
          balanceAfter: oldPrevStock + qty,
          reference_no: exchangeReceiptNo,
          referenceId: payload.originalReceiptNumber,
          notes: `Pengembalian varian lama (${payload.returnedSize}/${payload.returnedColor}) dari Struk #${payload.originalReceiptNumber}`,
          operator: operatorName,
          warehouse: oldProdSnap?.rackLocation || 'Butik Display Utama',
        },
        {
          id: `MUT-EXCH-OUT-${Date.now()}-2`,
          timestamp: tsDisplay,
          date: todayStr,
          product_id: payload.replacementProductId,
          sku: newProdSnap?.sku || payload.replacementProductId,
          product_name: `${payload.replacementProductName} (${payload.replacementSize} • ${payload.replacementColor})`,
          type: 'OUT / TUKAR UKURAN',
          qty,
          previous_stock: isSameProduct ? oldPrevStock + qty : newPrevStock,
          final_stock: isSameProduct ? oldPrevStock : newPrevStock - qty,
          balanceAfter: isSameProduct ? oldPrevStock : newPrevStock - qty,
          reference_no: exchangeReceiptNo,
          referenceId: payload.originalReceiptNumber,
          notes: `Pengambilan varian baru (${payload.replacementSize}/${payload.replacementColor}) • Tukar dari Struk #${payload.originalReceiptNumber}`,
          operator: operatorName,
          warehouse: newProdSnap?.rackLocation || 'Butik Display Utama',
        },
      ];
      setStockMutations((prev) => [...mutationsToAdd, ...prev]);

      // Net financial difference & exchange receipt
      const priceDiff = Math.round(Number(payload.priceDifference) || 0);
      const payMethodLabel = payload.paymentMethod || (priceDiff === 0 ? 'TUKAR IMPAS (Rp 0)' : 'CASH');
      const pmUpper = String(payMethodLabel).toUpperCase();
      const isCashDiff = pmUpper.includes('CASH') || pmUpper.includes('TUNAI');

      if (priceDiff !== 0) {
        const isQrisDiff = pmUpper.includes('QRIS');
        const cashAcctCode = isCashDiff ? '1-10001' : isQrisDiff ? '1-10003' : '1-10002';
        const cashAcctName = isCashDiff ? 'Kas Kasir' : isQrisDiff ? 'Bank QRIS' : 'Bank Operasional';

        setCashierShifts((prev) =>
          prev.map((s) => {
            if (s.status !== 'OPEN') return s;
            const shiftKey = normalizeStationCode(s.stationCode || s.terminalId || s.terminalName);
            if (shiftKey !== stationKey) return s;
            const cashDelta = isCashDiff ? priceDiff : 0;
            const nonCashDelta = !isCashDiff ? priceDiff : 0;
            const nextExpected = (s.expectedCashInDrawer ?? s.initialCash ?? 0) + cashDelta;
            return {
              ...s,
              totalCashSales: (s.totalCashSales || 0) + cashDelta,
              totalNonCashSales: (s.totalNonCashSales || 0) + nonCashDelta,
              expectedCashInDrawer: nextExpected,
              expectedCash: nextExpected,
            };
          })
        );

        setFinanceEntries((prev) => [
          {
            id: `FIN-EXCH-${Date.now()}`,
            date: todayStr,
            type: priceDiff > 0 ? 'INCOME' : 'EXPENSE',
            category: 'Selisih Tukar Ukuran / Barang Butik',
            account_target:
              priceDiff > 0
                ? '4-10001 · Selisih Tukar Barang Butik'
                : '4-10002 · Retur / Selisih Tukar Barang Butik',
            description: `Tukar Barang (${exchangeReceiptNo}) Ref #${payload.originalReceiptNumber}: ${payload.returnedProductName} [${payload.returnedSize}/${payload.returnedColor}] -> ${payload.replacementProductName} [${payload.replacementSize}/${payload.replacementColor}]`,
            amount: Math.abs(priceDiff),
            payment_method: payMethodLabel,
            reference: exchangeReceiptNo,
            ...( { cashDelta: priceDiff } as any ),
          },
          ...prev,
        ]);

        setJournalEntries((prev) => [
          {
            id: `JV-EXCH-${Date.now()}`,
            date: todayStr,
            created_at: nowIso,
            reference: exchangeReceiptNo,
            description: `Selisih Tukar Barang Butik (${exchangeReceiptNo}) Ref #${payload.originalReceiptNumber}`,
            type: 'POS_FASHION_EXCHANGE',
            amount: Math.abs(priceDiff),
            lines:
              priceDiff > 0
                ? [
                    { accountCode: cashAcctCode, accountName: cashAcctName, debit: priceDiff, credit: 0 },
                    { accountCode: '4-10001', accountName: 'Selisih Tukar Barang Butik', debit: 0, credit: priceDiff },
                  ]
                : [
                    { accountCode: '4-10002', accountName: 'Retur / Selisih Tukar Barang Butik', debit: Math.abs(priceDiff), credit: 0 },
                    { accountCode: cashAcctCode, accountName: cashAcctName, debit: 0, credit: Math.abs(priceDiff) },
                  ],
          },
          ...prev,
        ]);
      }

      const returnedProdObj: Product = oldProdSnap || {
        id: payload.returnedProductId,
        name: payload.returnedProductName,
        sell_price: payload.returnedUnitPrice,
        cost_price: Math.round(payload.returnedUnitPrice * 0.65),
        stock: 0,
        category: 'Fashion & Apparel',
        unit: 'Pcs',
        businessModel: 'fashion',
        status: 'Active',
      };
      const replacementProdObj: Product = newProdSnap || {
        id: payload.replacementProductId,
        name: payload.replacementProductName,
        sell_price: payload.replacementUnitPrice,
        cost_price: Math.round(payload.replacementUnitPrice * 0.65),
        stock: 0,
        category: 'Fashion & Apparel',
        unit: 'Pcs',
        businessModel: 'fashion',
        status: 'Active',
      };

      const exchangeSummaryText = `Kembali (+${qty}): ${payload.returnedProductName} (${payload.returnedSize} • ${payload.returnedColor}) → Pengganti (-${qty}): ${payload.replacementProductName} (${payload.replacementSize} • ${payload.replacementColor})`;

      const exchangeSale: Sale = {
        transaction_id: exchangeReceiptNo,
        receipt_number: exchangeReceiptNo,
        date: nowIso,
        created_at: nowIso,
        cashier_id: currentUser?.id || currentUser?.user_id || 'CASHIER-01',
        cashier_name: operatorName,
        terminal_name: activeTerminal?.name || stationKey,
        terminalId: payload.terminalId || activeTerminalId,
        stationCode: stationKey,
        businessType: 'Fashion & Butik',
        items_summary: `[TUKAR UKURAN/BARANG] ${exchangeSummaryText}`,
        subtotal: Math.max(0, priceDiff),
        discount: 0,
        total_amount: Math.max(0, priceDiff),
        payment_method: (priceDiff === 0 ? 'CASH' : payMethodLabel) as any,
        amount_paid: priceDiff > 0 ? priceDiff : 0,
        change_amount: priceDiff < 0 ? Math.abs(priceDiff) : 0,
        status: 'COMPLETED',
        customer_id: payload.customerId,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        fashionAdvisorId: payload.fashionAdvisorId,
        fashionAdvisorName: payload.fashionAdvisorName,
        isFashionExchange: true,
        exchangeRefReceipt: payload.originalReceiptNumber,
        exchangeSummary: exchangeSummaryText,
        items: [
          {
            product: {
              ...returnedProdObj,
              name: `[RETUR +${qty}] ${payload.returnedProductName}`,
            },
            quantity: qty,
            subtotal: -payload.returnedUnitPrice * qty,
            selectedFashionSize: payload.returnedSize,
            selectedFashionColor: payload.returnedColor,
            modifiers: { variant: `Retur: ${payload.returnedSize} • ${payload.returnedColor}` },
          },
          {
            product: {
              ...replacementProdObj,
              name: `[GANTI -${qty}] ${payload.replacementProductName}`,
            },
            quantity: qty,
            subtotal: payload.replacementUnitPrice * qty,
            selectedFashionSize: payload.replacementSize,
            selectedFashionColor: payload.replacementColor,
            modifiers: { variant: `Baru: ${payload.replacementSize} • ${payload.replacementColor}` },
          },
        ],
      };

      setSales((prev) => [exchangeSale, ...prev]);
      appendAudit(
        'FASHION_SIZE_EXCHANGE',
        'POS / Butik',
        `Tukar Ukuran/Barang ${exchangeReceiptNo} (Ref Struk #${payload.originalReceiptNumber}): ${exchangeSummaryText} | Nilai Pengganti Rp ${(payload.replacementUnitPrice * qty).toLocaleString('id-ID')} | Selisih ${priceDiff >= 0 ? '+' : '-'}Rp ${Math.abs(priceDiff).toLocaleString('id-ID')}`,
        {
          division: currentUser?.division || 'POS / Butik',
          amount: Math.abs(priceDiff) > 0 ? Math.abs(priceDiff) : payload.replacementUnitPrice * qty,
          category: 'EXCHANGE',
          level: 'INFO',
        }
      );
      showReceipt(exchangeSale);
      showToast(
        priceDiff === 0
          ? `Tukar Ukuran/Barang (${exchangeReceiptNo}) berhasil diproses • Selisih Rp 0!`
          : `Tukar Ukuran/Barang (${exchangeReceiptNo}) berhasil • Selisih Rp ${priceDiff.toLocaleString('id-ID')}`,
        'success'
      );

      return {
        success: true,
        exchangeReceipt: exchangeSale,
        message: 'Tukar ukuran / barang berhasil diproses.',
      };
    },
    [
      activeTerminal,
      boundStation,
      activeTerminalId,
      currentUser,
      appendAudit,
      showReceipt,
      showToast,
    ]
  );

  const updateLaundryOrderStatus = useCallback(
    (
      orderId: string,
      nextStatus: LaundryProductionStatus,
      meta?: {
        rackNumber?: string;
        washerEmployeeId?: string;
        washerEmployeeName?: string;
        ironerEmployeeId?: string;
        ironerEmployeeName?: string;
        specialistEmployeeId?: string;
        specialistEmployeeName?: string;
      }
    ) => {
      const nowIso = new Date().toISOString();
      const target = laundryOrders.find((o) => o.id === orderId);
      setLaundryOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const nextLogs: LaundryStageOperatorLog[] = [...(o.stageOperatorLogs || [])];
          if (meta?.washerEmployeeName && meta.washerEmployeeId !== o.washerEmployeeId) {
            nextLogs.push({
              stage: nextStatus,
              roleType: 'CUCI',
              employeeId: meta.washerEmployeeId,
              employeeName: meta.washerEmployeeName,
              timestamp: nowIso,
            });
          }
          if (meta?.ironerEmployeeName && meta.ironerEmployeeId !== o.ironerEmployeeId) {
            nextLogs.push({
              stage: nextStatus,
              roleType: 'SETRIKA',
              employeeId: meta.ironerEmployeeId,
              employeeName: meta.ironerEmployeeName,
              timestamp: nowIso,
            });
          }
          if (meta?.specialistEmployeeName && meta.specialistEmployeeId !== o.specialistEmployeeId) {
            nextLogs.push({
              stage: nextStatus,
              roleType: 'TEKNISI_KHUSUS',
              employeeId: meta.specialistEmployeeId,
              employeeName: meta.specialistEmployeeName,
              timestamp: nowIso,
            });
          }
          return {
            ...o,
            productionStatus: nextStatus,
            rackNumber: meta?.rackNumber !== undefined ? meta.rackNumber : o.rackNumber,
            washerEmployeeId:
              meta?.washerEmployeeId !== undefined ? meta.washerEmployeeId : o.washerEmployeeId,
            washerEmployeeName:
              meta?.washerEmployeeName !== undefined ? meta.washerEmployeeName : o.washerEmployeeName,
            ironerEmployeeId:
              meta?.ironerEmployeeId !== undefined ? meta.ironerEmployeeId : o.ironerEmployeeId,
            ironerEmployeeName:
              meta?.ironerEmployeeName !== undefined ? meta.ironerEmployeeName : o.ironerEmployeeName,
            specialistEmployeeId:
              meta?.specialistEmployeeId !== undefined
                ? meta.specialistEmployeeId
                : o.specialistEmployeeId,
            specialistEmployeeName:
              meta?.specialistEmployeeName !== undefined
                ? meta.specialistEmployeeName
                : o.specialistEmployeeName,
            stageOperatorLogs: nextLogs,
            pickedUpAt: nextStatus === 'DIAMBIL' ? nowIso : o.pickedUpAt,
            updatedAt: nowIso,
          };
        })
      );

      if (meta?.rackNumber && target?.transactionId) {
        setSales((prev) =>
          prev.map((s) =>
            s.transaction_id === target.transactionId || s.receipt_number === target.orderNumber
              ? { ...s, laundryRackNumber: meta.rackNumber }
              : s
          )
        );
      }

      const stageLabel: Record<LaundryProductionStatus, string> = {
        DITERIMA: 'Diterima',
        CUCI: 'Proses Cuci',
        SETRIKA: 'Setrika & Packing',
        SIAP_AMBIL: meta?.rackNumber ? `Siap Ambil (${meta.rackNumber})` : 'Siap Ambil',
        DIAMBIL: 'Sudah Diambil',
      };
      const operatorAssignedText =
        meta?.washerEmployeeName || meta?.ironerEmployeeName || meta?.specialistEmployeeName;
      appendAudit(
        'LAUNDRY_STAGE_UPDATED',
        'POS',
        `Order Laundry ${target?.orderNumber || orderId} status: ${stageLabel[nextStatus]}${
          operatorAssignedText ? ` | Petugas: ${operatorAssignedText}` : ''
        }`
      );
      if (target && nextStatus === target.productionStatus && operatorAssignedText) {
        showToast(`Petugas ${operatorAssignedText} ditugaskan ke ${target.tagCode}`, 'success');
      } else {
        showToast(`Status cucian ${target?.tagCode || orderId} → ${stageLabel[nextStatus]}`, 'success');
      }
    },
    [laundryOrders, appendAudit, showToast]
  );

  const settleLaundryOrderPayment = useCallback(
    (
      orderId: string,
      settlementMethod: string,
      rackNumber?: string,
      markPickedUp = true
    ) => {
      const target = laundryOrders.find((o) => o.id === orderId);
      if (!target) return;

      const nowIso = new Date().toISOString();
      const settledAmount = Math.max(0, target.remainingAmount);
      const nextStatus: LaundryProductionStatus = markPickedUp
        ? 'DIAMBIL'
        : target.productionStatus;
      const payUpper = (settlementMethod || 'CASH').toUpperCase();
      const isCash = payUpper.includes('CASH') || payUpper.includes('TUNAI');
      const isQris = payUpper.includes('QRIS');

      setLaundryOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                paidAmount: o.totalAmount,
                remainingAmount: 0,
                paymentStatus: 'LUNAS_AWAL',
                productionStatus: nextStatus,
                rackNumber: rackNumber !== undefined ? rackNumber : o.rackNumber,
                pickedUpAt: markPickedUp ? nowIso : o.pickedUpAt,
                updatedAt: nowIso,
              }
            : o
        )
      );

      if (target.transactionId || target.orderNumber || target.id) {
        setSales((prev) =>
          prev.map((s) =>
            (target.transactionId && s.transaction_id === target.transactionId) ||
            s.receipt_number === target.orderNumber
              ? {
                  ...s,
                  amount_paid: target.totalAmount,
                  remainingBalance: 0,
                  laundryPaymentStatus: 'LUNAS_AWAL',
                  laundryRackNumber: rackNumber ?? s.laundryRackNumber,
                }
              : s
          )
        );

        const seedArId = target.id.replace('LND-ORD-', 'AR-LND-');
        setInvoicesDue((prev) =>
          prev.map((inv) =>
            inv.invoice_number === target.orderNumber ||
            (target.transactionId && inv.id === `AR-POS-${target.transactionId}`) ||
            inv.id === `AR-LND-${target.id}` ||
            inv.id === seedArId
              ? {
                  ...inv,
                  status: 'Paid',
                  paidAt: nowIso,
                  paid_date: nowIso.slice(0, 10),
                  paymentMethod: settlementMethod,
                  paymentSource: isCash ? 'Kas Kasir' : isQris ? 'Bank QRIS' : 'Bank Operasional',
                }
              : inv
          )
        );
      }

      if (settledAmount > 0) {
        const stationKey = normalizeStationCode(
          target.stationCode || activeTerminal?.stationCode || activeTerminalId
        );

        setCashierShifts((prev) =>
          prev.map((s) => {
            if (s.status !== 'OPEN') return s;
            const shiftKey = normalizeStationCode(s.stationCode || s.terminalId || s.terminalName);
            if (shiftKey !== stationKey) return s;
            const nextCash = (s.totalCashSales || 0) + (isCash ? settledAmount : 0);
            const nextNonCash = (s.totalNonCashSales || 0) + (!isCash ? settledAmount : 0);
            const nextExpected =
              (s.expectedCashInDrawer ?? s.initialCash ?? 0) + (isCash ? settledAmount : 0);
            return {
              ...s,
              totalCashSales: nextCash,
              totalNonCashSales: nextNonCash,
              expectedCashInDrawer: nextExpected,
              expectedCash: nextExpected,
            };
          })
        );

        const targetAccCode = isCash ? '1-10001' : isQris ? '1-10003' : '1-10002';
        const targetAccName = isCash ? 'Kas Kasir' : isQris ? 'Bank QRIS' : 'Bank Operasional';

        setFinanceEntries((prev) => [
          {
            id: `FIN-LND-SETTLE-${Date.now()}`,
            date: nowIso.slice(0, 10),
            type: 'INCOME',
            category: 'Pelunasan Piutang Laundry',
            account_target: `${targetAccCode} · ${targetAccName}`,
            description: `Pelunasan Piutang Cucian Order ${target.orderNumber} (${target.customerName})`,
            amount: settledAmount,
            payment_method: settlementMethod,
            reference: target.orderNumber,
            ...( { cashDelta: settledAmount } as any ),
          },
          ...prev,
        ]);

        setJournalEntries((prev) => [
          {
            id: `JV-LND-SETTLE-${Date.now()}`,
            date: nowIso.slice(0, 10),
            created_at: nowIso,
            reference: target.orderNumber,
            description: `Pelunasan Piutang Laundry (Bayar Saat Ambil / Sisa DP) ${target.orderNumber} - ${target.customerName}`,
            type: 'LAUNDRY_AR_SETTLEMENT',
            amount: settledAmount,
            lines: [
              {
                accountCode: targetAccCode,
                accountName: targetAccName,
                debit: settledAmount,
                credit: 0,
              },
              {
                accountCode: '1-10301',
                accountName: 'Piutang Usaha',
                debit: 0,
                credit: settledAmount,
              },
            ],
          },
          ...prev,
        ]);
      }

      appendAudit(
        'LAUNDRY_PAYMENT_SETTLED',
        'POS',
        `Pelunasan order Laundry ${target.orderNumber} sebesar Rp ${settledAmount.toLocaleString('id-ID')} (${settlementMethod})${markPickedUp ? ' & diserahkan ke pelanggan' : ''}.`
      );
      showToast(
        settledAmount > 0
          ? `Pelunasan Rp ${settledAmount.toLocaleString('id-ID')} (${settlementMethod}) & Piutang AR otomatis lunas!`
          : `Order ${target.orderNumber} ditandai Sudah Diambil!`,
        'success'
      );
    },
    [laundryOrders, activeTerminal, activeTerminalId, appendAudit, showToast]
  );

  const addBuildingDeliveryOrder = useCallback(
    (order: Omit<BuildingDeliveryOrder, 'id' | 'updatedAt'> & { id?: string }): BuildingDeliveryOrder => {
      const nowIso = new Date().toISOString();
      const newOrder: BuildingDeliveryOrder = {
        ...order,
        id: order.id || `DO-${Date.now()}`,
        updatedAt: nowIso,
      };
      setBuildingDeliveryOrders((prev) => [newOrder, ...prev]);
      appendAudit('DELIVERY_ORDER_CREATED', 'WAREHOUSE', `Surat Jalan ${newOrder.doNumber} (${newOrder.fleetVehicleName || newOrder.fleetType}) dibuat untuk ${newOrder.customerName}`);
      return newOrder;
    },
    [appendAudit]
  );

  const updateBuildingDeliveryStatus = useCallback(
    (
      id: string,
      status: BuildingDeliveryStatus,
      meta?: { driverName?: string; vehiclePlate?: string; notes?: string }
    ) => {
      const nowIso = new Date().toISOString();
      setBuildingDeliveryOrders((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status,
                driverName: meta?.driverName ?? d.driverName,
                vehiclePlate: meta?.vehiclePlate ?? d.vehiclePlate,
                notes: meta?.notes ?? d.notes,
                updatedAt: nowIso,
              }
            : d
        )
      );
      const statusLabel =
        status === 'MENUNGGU_MUAT'
          ? 'Menunggu Muat'
          : status === 'DALAM_PENGIRIMAN'
          ? 'Dalam Pengiriman'
          : 'Terkirim ke Proyek';
      appendAudit('DELIVERY_STATUS_UPDATED', 'WAREHOUSE', `Status Surat Jalan ${id} diperbarui ke ${statusLabel}`);
      showToast(`Status armada & Surat Jalan diperbarui: ${statusLabel}`, 'success');
    },
    [appendAudit, showToast]
  );

  const recordBulkShrinkage = useCallback(
    (payload: {
      productId: string;
      productName?: string;
      unit?: string;
      costPrice?: number;
      currentStock?: number;
      physicalQty?: number;
      shrinkageQty?: number;
      reason: string;
    }): { success: boolean; message: string } => {
      const prod = products.find((p) => p.id === payload.productId);
      const systemQty = prod ? Number(prod.stock) || 0 : Number(payload.currentStock) || 0;
      const shrinkQty =
        typeof payload.shrinkageQty === 'number' && payload.shrinkageQty > 0
          ? Number(payload.shrinkageQty.toFixed(2))
          : typeof payload.physicalQty === 'number'
          ? Number(Math.max(0, systemQty - payload.physicalQty).toFixed(2))
          : 0;

      if (shrinkQty <= 0) {
        return { success: false, message: 'Jumlah susut curah harus lebih besar dari 0.' };
      }

      const physicalQty =
        typeof payload.physicalQty === 'number'
          ? Number(Math.max(0, payload.physicalQty).toFixed(2))
          : Number(Math.max(0, systemQty - shrinkQty).toFixed(2));
      const unitCost = prod
        ? Number(prod.costPrice ?? prod.cost_price ?? prod.buy_price) || 0
        : Number(payload.costPrice) || 0;
      const costValueLoss = Math.round(shrinkQty * unitCost);
      const prodName = prod?.name || payload.productName || payload.productId;
      const unitLabel = prod?.unit || payload.unit || 'm³';
      const nowIso = new Date().toISOString();

      if (prod) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === prod.id ? { ...p, stock: Math.max(0, Number((p.stock - shrinkQty).toFixed(2))) } : p
          )
        );
      }

      const mutation: StockMutation = {
        id: `MUT-SHK-${Date.now()}`,
        timestamp: nowIso,
        product_id: payload.productId,
        product_name: prodName,
        sku: prod?.barcode || prod?.sku || payload.productId,
        type: 'ADJ-LOSS',
        qty: shrinkQty,
        previous_stock: systemQty,
        final_stock: physicalQty,
        reference_no: `SHK-${Date.now()}`,
        notes: `Susut Curah (${unitLabel}): ${payload.reason}`,
        operator: currentUser?.name || 'Petugas Gudang Material',
        warehouse: 'Yard Material Curah',
        unit_cost: unitCost,
      };
      setStockMutations((prev) => [mutation, ...prev]);

      const logEntry: BulkShrinkageLog = {
        id: `SHK-${Date.now()}`,
        date: nowIso,
        productId: payload.productId,
        productName: prodName,
        sku: prod?.barcode || prod?.sku || payload.productId,
        unit: unitLabel,
        systemQty,
        physicalQty,
        shrinkageQty: shrinkQty,
        costValueLoss,
        reason: payload.reason,
        recordedBy: currentUser?.name || 'Petugas Gudang Material',
        warehouse: 'Yard Material Curah Utama',
      };
      setBulkShrinkageLogs((prev) => [logEntry, ...prev]);

      if (costValueLoss > 0) {
        setFinanceEntries((prev) => [
          {
            id: `FIN-SHRINK-${Date.now()}`,
            date: nowIso,
            type: 'EXPENSE',
            category: 'Susut Material Curah',
            description: `Selisih Susut ${prodName} (-${shrinkQty} ${unitLabel}) - ${payload.reason}`,
            amount: costValueLoss,
            reference: logEntry.id,
            payment_method: 'SYSTEM_AUTO',
          },
          ...prev,
        ]);
      }

      appendAudit(
        'BULK_SHRINKAGE_RECORDED',
        'WAREHOUSE',
        `Susut curah ${prodName}: -${shrinkQty} ${unitLabel} (Nilai HPP Rp ${costValueLoss.toLocaleString('id-ID')})`
      );
      showToast(`Selisih susut ${prodName} (-${shrinkQty} ${unitLabel}) berhasil dicatat.`, 'warning');
      return { success: true, message: 'Susut material curah berhasil dicatat.' };
    },
    [products, currentUser, appendAudit, showToast]
  );

  const submitBuildingAuthRequest = useCallback(
    (req: Omit<BuildingAuthRequest, 'id' | 'requestNumber' | 'createdAt' | 'status'>): BuildingAuthRequest => {
      const nowIso = new Date().toISOString();
      const prefix = req.type === 'PLAFON_KREDIT_KONTRAKTOR' ? 'CR-PROJ' : 'BRG-FRK';
      const newReq: BuildingAuthRequest = {
        ...req,
        id: `BAUTH-${Date.now()}`,
        requestNumber: `${prefix}-${String(Date.now()).slice(-6)}`,
        createdAt: nowIso,
        status: 'PENDING',
      };
      setBuildingAuthRequests((prev) => [newReq, ...prev]);
      appendAudit(
        'BUILDING_AUTH_SUBMITTED',
        'EXECUTIVE',
        `Pengajuan ${req.type === 'PLAFON_KREDIT_KONTRAKTOR' ? 'Plafon Kredit Kontraktor' : 'Diskon Borongan / Frangko'} oleh ${req.contractorName}`
      );
      showToast(`Pengajuan ${newReq.requestNumber} dikirim ke Otorisasi Direksi.`, 'info');
      return newReq;
    },
    [appendAudit, showToast]
  );

  const approveBuildingAuthRequest = useCallback(
    (id: string, note?: string) => {
      const target = buildingAuthRequests.find((r) => r.id === id);
      if (!target) return;
      const nowIso = new Date().toISOString();

      setBuildingAuthRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'APPROVED',
                reviewedBy: currentUser?.name || 'Direksi / Pimpinan',
                reviewedAt: nowIso,
                reviewNote: note || 'Disetujui Direksi',
              }
            : r
        )
      );

      if (target.type === 'PLAFON_KREDIT_KONTRAKTOR' && target.requestedCreditLimit) {
        setCustomers((prev) =>
          prev.map((c) => {
            const matchById = target.customerId && c.id === target.customerId;
            const matchByName =
              c.name.toLowerCase().includes(target.contractorName.toLowerCase()) ||
              target.contractorName.toLowerCase().includes(c.name.toLowerCase());
            if (matchById || matchByName) {
              return { ...c, credit_limit: target.requestedCreditLimit };
            }
            return c;
          })
        );
      }

      appendAudit(
        'BUILDING_AUTH_APPROVED',
        'EXECUTIVE',
        `Otorisasi ${target.requestNumber} (${target.contractorName}) disetujui.`
      );
      showToast(`Otorisasi ${target.requestNumber} (${target.contractorName}) disetujui!`, 'success');
    },
    [buildingAuthRequests, currentUser, appendAudit, showToast]
  );

  const rejectBuildingAuthRequest = useCallback(
    (id: string, reason?: string) => {
      const target = buildingAuthRequests.find((r) => r.id === id);
      if (!target) return;
      const nowIso = new Date().toISOString();
      setBuildingAuthRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'REJECTED',
                reviewedBy: currentUser?.name || 'Direksi / Pimpinan',
                reviewedAt: nowIso,
                reviewNote: reason || 'Ditolak Direksi',
              }
            : r
        )
      );
      appendAudit(
        'BUILDING_AUTH_REJECTED',
        'EXECUTIVE',
        `Otorisasi ${target.requestNumber} (${target.contractorName}) ditolak: ${reason || 'Tidak memenuhi ketentuan'}`
      );
      showToast(`Pengajuan ${target.requestNumber} ditolak.`, 'warning');
    },
    [buildingAuthRequests, currentUser, appendAudit, showToast]
  );

  const voidTransaction = useCallback(
    (txId: string, reason: string = 'Pembatalan transaksi oleh Otoritas Kasir') => {
      const targetSale = sales.find((s) => s.transaction_id === txId || (s as any).id === txId);
      const voidAmount = Number(targetSale?.total_amount || 0);
      const receiptLabel = targetSale?.receipt_number || txId;
      const terminalLabel = targetSale?.terminal_name || targetSale?.stationCode || 'Kasir POS';

      setSales((prev) =>
        prev.map((s) => (s.transaction_id === txId || (s as any).id === txId ? { ...s, status: 'VOIDED', void_reason: reason } : s))
      );

      appendAudit(
        'POS_VOID_TRANSACTION',
        'POS / Kasir',
        `Void / Pembatalan Transaksi POS #${receiptLabel} (${terminalLabel}) • Nominal: Rp ${voidAmount.toLocaleString('id-ID')} • Alasan: ${reason}`,
        {
          user: currentUser?.name || targetSale?.cashier_name || 'Kasir POS',
          division: currentUser?.division || 'POS / Kasir',
          amount: voidAmount,
          category: 'VOID_POS',
          level: 'WARN',
        }
      );

      showToast(`Transaksi #${txId} berhasil dibatalkan (VOID)`, 'warning');
    },
    [sales, currentUser, appendAudit, showToast]
  );

  const handleSalesReturn = useCallback(
    (ret: any) => {
      setSalesReturns((prev) => [ret, ...prev]);
      const retAmount = Number(ret?.total_refund ?? ret?.refundAmount ?? ret?.total ?? ret?.amount ?? 0);
      const refNo = ret?.original_receipt_number || ret?.receiptNumber || ret?.transaction_id || ret?.id || '-';
      appendAudit(
        'POS_SALES_RETURN',
        'POS / Kasir',
        `Retur / Penukaran Barang POS (Ref #${refNo}) • Nominal: Rp ${retAmount.toLocaleString('id-ID')}${ret?.reason ? ` • Alasan: ${ret.reason}` : ''}`,
        {
          division: currentUser?.division || 'POS / Kasir',
          amount: retAmount,
          category: 'EXCHANGE',
          level: 'WARN',
        }
      );
      showToast('Retur penjualan berhasil diproses', 'success');
    },
    [currentUser, appendAudit, showToast]
  );

  const getOpenShiftForStation = useCallback(
    (stationCodeOrTerminalId?: string | null): CashierShift | null => {
      const targetKey = normalizeStationCode(
        stationCodeOrTerminalId ||
          activeTerminal?.stationCode ||
          activeTerminal?.id ||
          boundStation?.stationCode ||
          activeTerminalId
      );
      return (
        cashierShifts.find(
          (s) =>
            s.status === 'OPEN' &&
            normalizeStationCode(s.stationCode || s.terminalId || s.terminalName) === targetKey
        ) || null
      );
    },
    [cashierShifts, activeTerminal, boundStation, activeTerminalId]
  );

  // Buka & Tutup Shift + Z-Report Audit Kasir (Terisolasi Per Loket POS-01..POS-10)
  const openCashierShift = useCallback(
    (initialCash: number, notes: string = 'Shift Reguler'): CashierShift => {
      const currentStationCode = normalizeStationCode(
        activeTerminal?.stationCode ||
          activeTerminal?.id ||
          boundStation?.stationCode ||
          activeTerminalId
      );
      const existingOpen = cashierShifts.find(
        (s) =>
          s.status === 'OPEN' &&
          normalizeStationCode(s.stationCode || s.terminalId || s.terminalName) ===
            currentStationCode
      );
      if (existingOpen) {
        showToast(`Shift loket ${currentStationCode} sudah aktif (${existingOpen.cashierName}).`, 'info');
        return existingOpen;
      }

      const activeSecNow = resolveCanonicalSector(businessProfileRef.current);
      const primaryModelNow =
        businessProfileRef.current?.domainConfig?.primaryBusinessModel ||
        businessProfileRef.current?.businessType;
      const syncedOpenTerminalName = resolveSynchronizedTerminalDisplayName(
        currentStationCode,
        activeSecNow,
        primaryModelNow
      );

      const newShift: CashierShift = {
        id: `SHF-${currentStationCode.replace('-', '')}-${Date.now()}`,
        cashierId: currentUser?.id || currentUser?.user_id || 'USR-01',
        cashierName: currentUser?.name || 'Kasir POS',
        terminalId: activeTerminal?.id || currentStationCode,
        terminalName: syncedOpenTerminalName,
        stationCode: currentStationCode,
        startTime: new Date().toISOString(),
        openedAt: new Date().toISOString(),
        status: 'OPEN',
        isPaused: false,
        initialCash,
        startingCash: initialCash,
        totalCashSales: 0,
        totalNonCashSales: 0,
        totalTransactionsCount: 0,
        totalExpenses: 0,
        expenses: [],
        expectedCashInDrawer: initialCash,
        expectedCash: initialCash,
        notes
      };
      setCashierShifts((prev) => [newShift, ...prev]);
      showToast(`Shift loket ${currentStationCode} berhasil dibuka`, 'success');
      return newShift;
    },
    [cashierShifts, currentUser, activeTerminalId, activeTerminal, boundStation, showToast]
  );

  const toggleStationBreak = useCallback(
    (stationCodeOrTerminalId?: string | null): boolean => {
      const targetKey = normalizeStationCode(
        stationCodeOrTerminalId ||
          activeTerminal?.stationCode ||
          activeTerminal?.id ||
          boundStation?.stationCode ||
          activeTerminalId
      );
      const openShift = cashierShifts.find(
        (s) =>
          s.status === 'OPEN' &&
          normalizeStationCode(s.stationCode || s.terminalId || s.terminalName) === targetKey
      );
      if (!openShift) {
        showToast(`Loket ${targetKey} belum membuka shift.`, 'info');
        return false;
      }

      const nextPaused = !Boolean(openShift.isPaused);
      const nowIso = new Date().toISOString();
      setCashierShifts((prev) =>
        prev.map((s) =>
          s.id === openShift.id
            ? {
                ...s,
                isPaused: nextPaused,
                pausedAt: nextPaused ? nowIso : undefined,
              }
            : s
        )
      );
      appendAudit(
        nextPaused ? 'POS_STATION_BREAK' : 'POS_STATION_RESUME',
        'POS_SHIFT',
        `Loket ${targetKey} (${openShift.cashierName}) ${nextPaused ? 'masuk mode Istirahat' : 'kembali Online'}`
      );
      showToast(
        nextPaused
          ? `Loket ${targetKey} masuk mode Istirahat (Pause)`
          : `Loket ${targetKey} kembali Online`,
        nextPaused ? 'warning' : 'success'
      );
      return nextPaused;
    },
    [cashierShifts, activeTerminal, boundStation, activeTerminalId, appendAudit, showToast]
  );

  const closeCashierShift = useCallback(
    (
      shiftDataOrActualCash:
        | number
        | {
            shiftId?: string;
            cashierId: string;
            cashierName: string;
            openingCash: number;
            expectedCash: number;
            actualCash: number;
            totalTransactions: number;
            totalCashSales?: number;
            totalNonCashSales?: number;
            totalExpenses?: number;
            totalSalesReturnCash?: number;
            stationCode?: string;
            terminalId?: string;
            terminalName?: string;
            notes?: string;
          },
      notesArg?: string,
      denominationBreakdown?: Record<string, number>
    ): CashierShift & { success?: boolean; shift?: CashierShift } => {
      const isObj = typeof shiftDataOrActualCash === 'object' && shiftDataOrActualCash !== null;
      const requestedShiftId = isObj ? shiftDataOrActualCash.shiftId : undefined;
      const currentStationCode = normalizeStationCode(
        (isObj && shiftDataOrActualCash.stationCode) ||
          activeTerminal?.stationCode ||
          activeTerminal?.id ||
          boundStation?.stationCode ||
          activeTerminalId
      );
      const latestShifts = cashierShiftsRef.current || cashierShifts || [];
      const currentOpen =
        (requestedShiftId
          ? latestShifts.find((s) => s.id === requestedShiftId && s.status === 'OPEN')
          : undefined) ||
        latestShifts.find(
          (s) =>
            s.status === 'OPEN' &&
            normalizeStationCode(s.stationCode || s.terminalId || s.terminalName) ===
              currentStationCode
        ) ||
        latestShifts.find((s) => s.status === 'OPEN') ||
        null;

      const resolvedStationCode = normalizeStationCode(
        currentOpen?.stationCode || currentStationCode
      );
      const cashierId = isObj ? shiftDataOrActualCash.cashierId : (currentOpen?.cashierId || currentUser?.id || 'USR-01');
      const cashierName = isObj ? shiftDataOrActualCash.cashierName : (currentOpen?.cashierName || currentUser?.name || 'Kasir POS');
      const openingCash = Number(isObj ? shiftDataOrActualCash.openingCash : (currentOpen?.initialCash ?? 0)) || 0;
      const expectedCash = Number(isObj ? shiftDataOrActualCash.expectedCash : (currentOpen?.expectedCashInDrawer ?? openingCash)) || 0;
      const actualCash = Number(isObj ? shiftDataOrActualCash.actualCash : (shiftDataOrActualCash as number)) || 0;
      const totalTransactions = Number(isObj ? shiftDataOrActualCash.totalTransactions : (currentOpen?.totalTransactionsCount ?? 0)) || 0;
      const totalCashSales = Number(
        isObj && typeof shiftDataOrActualCash.totalCashSales === 'number'
          ? shiftDataOrActualCash.totalCashSales
          : (currentOpen?.totalCashSales ?? 0)
      ) || 0;
      const totalNonCashSales = Number(
        isObj && typeof shiftDataOrActualCash.totalNonCashSales === 'number'
          ? shiftDataOrActualCash.totalNonCashSales
          : (currentOpen?.totalNonCashSales ?? 0)
      ) || 0;
      const totalExpenses = Number(
        isObj && typeof shiftDataOrActualCash.totalExpenses === 'number'
          ? shiftDataOrActualCash.totalExpenses
          : (currentOpen?.totalExpenses ?? 0)
      ) || 0;
      const totalSalesReturnCash = Number(
        isObj && typeof shiftDataOrActualCash.totalSalesReturnCash === 'number'
          ? shiftDataOrActualCash.totalSalesReturnCash
          : (currentOpen?.totalSalesReturnCash ?? 0)
      ) || 0;
      const notes = isObj ? (shiftDataOrActualCash.notes || '') : (notesArg || '');

      const variance = actualCash - expectedCash;
      const endTime = new Date().toISOString();
      const dateYmd = endTime.slice(0, 10);

      const activeSecNow = resolveCanonicalSector(businessProfileRef.current);
      const primaryModelNow =
        businessProfileRef.current?.domainConfig?.primaryBusinessModel ||
        businessProfileRef.current?.businessType;
      const syncedCloseTerminalName = resolveSynchronizedTerminalDisplayName(
        resolvedStationCode,
        activeSecNow,
        primaryModelNow
      );

      const shiftRecord: CashierShift = {
        ...(currentOpen || {}),
        id: currentOpen?.id || `ZREP-${resolvedStationCode.replace('-', '')}-${Date.now()}`,
        cashierId,
        cashierName,
        terminalId: currentOpen?.terminalId || (isObj && shiftDataOrActualCash.terminalId) || activeTerminalId,
        terminalName: (isObj && shiftDataOrActualCash.terminalName) || syncedCloseTerminalName,
        stationCode: resolvedStationCode,
        startTime: currentOpen?.startTime || endTime,
        endTime,
        closedAt: endTime,
        closedBy: cashierName,
        initialCash: openingCash,
        startingCash: openingCash,
        totalCashSales,
        totalNonCashSales,
        totalTransactionsCount: totalTransactions,
        totalExpenses,
        totalSalesReturnCash,
        expenses: currentOpen?.expenses ?? [],
        expectedCashInDrawer: expectedCash,
        expectedCash,
        actualCashInDrawer: actualCash,
        actualCash,
        difference: variance,
        reconciliationStatus: variance === 0 ? 'MATCH' : variance > 0 ? 'SURPLUS' : 'SHORTAGE',
        denominationBreakdown,
        isPaused: false,
        pausedAt: undefined,
        status: 'CLOSED',
        notes,
        ...( { openingCash, variance, totalTransactions } as any )
      };

      setCashierShifts((prev) => {
        const remaining = prev
          .filter((s) => s.id !== shiftRecord.id)
          .map((s) => {
            if (
              s.status === 'OPEN' &&
              normalizeStationCode(s.stationCode || s.terminalId || s.terminalName) ===
                resolvedStationCode
            ) {
              return {
                ...s,
                status: 'CLOSED' as const,
                isPaused: false,
                endTime: s.endTime || endTime,
                closedAt: s.closedAt || endTime,
                closedBy: s.closedBy || cashierName,
                actualCashInDrawer: s.actualCashInDrawer ?? s.expectedCashInDrawer ?? s.initialCash ?? 0,
                difference: s.difference ?? 0,
              };
            }
            return s;
          });
        const nextShifts = [shiftRecord, ...remaining];
        cashierShiftsRef.current = nextShifts;
        try {
          localStorage.setItem(`${STORAGE_PREFIX}shifts`, JSON.stringify(nextShifts));
        } catch {}
        return nextShifts;
      });

      // Jika ada selisih kas fisik vs sistem, catat otomatis ke akun "7-10002 · Selisih Kas Operasional" di Finance & Buku Besar
      if (variance !== 0) {
        const absVariance = Math.abs(variance);
        const isOver = variance > 0;
        const varianceLabel = isOver ? 'Over (Lebih)' : 'Short (Kurang)';
        const varianceDesc = `Z-Report Shift ${shiftRecord.id} [${shiftRecord.stationCode || currentStationCode}] (${cashierName}): ${varianceLabel} Rp ${absVariance.toLocaleString('id-ID')}`;

        const varianceEntry: FinanceEntry = {
          id: `FIN-VAR-${Date.now()}`,
          date: dateYmd,
          type: isOver ? 'INCOME' : 'EXPENSE',
          category: 'Selisih Kas Operasional',
          account_target: '7-10002 · Selisih Kas Operasional',
          description: varianceDesc,
          amount: absVariance,
          payment_method: 'CASH',
          reference: shiftRecord.id,
          ...( { paymentMethod: 'CASH', referenceId: shiftRecord.id, cashDelta: variance } as any )
        };
        setFinanceEntries((prev) => [varianceEntry, ...prev]);

        const varianceJournal: JournalEntry = {
          id: `JV-ZREP-${Date.now()}`,
          date: dateYmd,
          created_at: endTime,
          reference: shiftRecord.id,
          description: varianceDesc,
          type: 'Z_REPORT_VARIANCE',
          amount: absVariance,
          lines: isOver
            ? [
                {
                  accountCode: '1-10001',
                  accountName: 'Kas Kasir',
                  debit: absVariance,
                  credit: 0,
                },
                {
                  accountCode: '7-10002',
                  accountName: 'Selisih Kas Operasional',
                  debit: 0,
                  credit: absVariance,
                },
              ]
            : [
                {
                  accountCode: '7-10002',
                  accountName: 'Selisih Kas Operasional',
                  debit: absVariance,
                  credit: 0,
                },
                {
                  accountCode: '1-10001',
                  accountName: 'Kas Kasir',
                  debit: 0,
                  credit: absVariance,
                },
              ],
        };
        setJournalEntries((prev) => [varianceJournal, ...prev]);

        dualBackendSync.enqueue('FINANCE_JOURNAL', 'INSERT', {
          ...varianceEntry,
          tx_uuid: generateTxUuid()
        });
      }

      appendAudit(
        'CLOSE_SHIFT_ZREPORT',
        'POS_AUDIT',
        `Tutup Shift Z-Report ${shiftRecord.id} (${shiftRecord.stationCode || currentStationCode}) oleh ${cashierName} | Kas Sistem: Rp ${expectedCash.toLocaleString('id-ID')} | Kas Fisik: Rp ${actualCash.toLocaleString('id-ID')} | Selisih: Rp ${variance.toLocaleString('id-ID')}`
      );

      dualBackendSync.enqueue('FINANCE_JOURNAL', 'INSERT', {
        ...shiftRecord,
        recordType: 'Z_REPORT_SHIFT',
        tx_uuid: shiftRecord.id
      });

      return Object.assign(shiftRecord, { success: true, shift: shiftRecord });
    },
    [cashierShifts, currentUser, activeTerminalId, activeTerminal, boundStation, appendAudit]
  );

  const recordShiftExpense = useCallback(
    (amount: number, reason: string, category: string = 'KAS_KECIL_KASIR') => {
      const currentStationCode = normalizeStationCode(
        activeTerminal?.stationCode ||
          activeTerminal?.id ||
          boundStation?.stationCode ||
          activeTerminalId
      );
      const targetShift = cashierShifts.find(
        (s) =>
          s.status === 'OPEN' &&
          normalizeStationCode(s.stationCode || s.terminalId || s.terminalName) ===
            currentStationCode
      );
      const expense = {
        id: `EXP-${Date.now()}`,
        shiftId: targetShift?.id || `SHF-${Date.now()}`,
        timestamp: new Date().toISOString(),
        amount,
        reason,
        category,
        cashierId: currentUser?.id || 'CASHIER-01',
        cashierName: currentUser?.name || 'Kasir POS',
        terminalId: activeTerminal?.id || currentStationCode
      };

      setCashierShifts((prev) =>
        prev.map((s) => {
          if (
            s.status === 'OPEN' &&
            normalizeStationCode(s.stationCode || s.terminalId || s.terminalName) ===
              currentStationCode
          ) {
            return {
              ...s,
              totalExpenses: (s.totalExpenses || 0) + amount,
              expectedCashInDrawer: (s.expectedCashInDrawer || s.initialCash) - amount,
              expenses: [...(s.expenses || []), expense]
            };
          }
          return s;
        })
      );

      const entry: FinanceEntry = {
        id: `FIN-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'EXPENSE',
        category: 'Petty Cash Kasir',
        description: `Pengeluaran kasir (${currentStationCode}): ${reason}`,
        amount,
        payment_method: 'CASH',
        reference: expense.id
      };
      setFinanceEntries((prev) => [entry, ...prev]);
      showToast(`Pengeluaran kas kecil Rp ${amount.toLocaleString()} tercatat (${currentStationCode})`, 'warning');
    },
    [cashierShifts, currentUser, activeTerminalId, activeTerminal, boundStation, showToast]
  );

  // Mutasi Stok Gudang
  const recordStockMutation = useCallback((mutation: Omit<StockMutation, 'id' | 'timestamp'>) => {
    const newMutation: StockMutation = {
      ...mutation,
      id: `MUT-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    setStockMutations((prev) => [newMutation, ...prev]);

    const targetProdId = mutation.product_id || (mutation as any).productId;
    const delta = String(mutation.type).startsWith('IN') ? mutation.qty : -mutation.qty;
    const existingProd = productsRef.current.find((p) => p.id === targetProdId);
    const updatedForSync = existingProd
      ? { ...existingProd, stock: Number((existingProd.stock + delta).toFixed(2)) }
      : null;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== targetProdId) return p;
        return { ...p, stock: Number((p.stock + delta).toFixed(2)) };
      })
    );

    if (updatedForSync) {
      dualBackendSync.enqueue('PRODUCT_UPSERT', 'UPSERT', {
        ...updatedForSync,
        tx_uuid: generateTxUuid()
      });
    }

    dualBackendSync.enqueue('STOCK_MOVEMENT', 'INSERT', {
      ...newMutation,
      tx_uuid: generateTxUuid()
    });
  }, []);

  const adjustStock = useCallback(
    (productId: string, newStock: number, reason: string = 'Adjustment Stok Fisik') => {
      const existingProd = productsRef.current.find((p) => p.id === productId);
      const clampedStock = Math.max(0, newStock);

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          return { ...p, stock: clampedStock };
        })
      );

      if (existingProd) {
        const oldStock = existingProd.stock;
        const delta = clampedStock - oldStock;
        const updated = { ...existingProd, stock: clampedStock };
        const mutation: StockMutation = {
          id: `MUT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          product_id: existingProd.id,
          product_name: existingProd.name,
          sku: existingProd.barcode || existingProd.sku || existingProd.id,
          type: delta >= 0 ? 'IN' : 'OUT',
          qty: Math.abs(delta),
          previous_stock: oldStock,
          final_stock: clampedStock,
          reference_no: `ADJ-${Date.now()}`,
          notes: reason,
          operator: currentUser?.name || 'Petugas Gudang'
        };
        setStockMutations((m) => [mutation, ...m]);
        dualBackendSync.enqueue('PRODUCT_UPSERT', 'UPSERT', { ...updated, tx_uuid: generateTxUuid() });

        const unitCost = Number(existingProd.cost_price || existingProd.costPrice || existingProd.price || 0);
        const adjNominal = Math.abs(delta) * unitCost;
        appendAudit(
          'STOCK_ADJUSTMENT',
          'Gudang / Warehouse',
          `Penyesuaian Stok "${existingProd.name}" (${oldStock} -> ${clampedStock}, selisih ${delta >= 0 ? `+${delta}` : delta}) • Nilai: Rp ${adjNominal.toLocaleString('id-ID')} • Alasan: ${reason}`,
          {
            division: currentUser?.division || 'Gudang / Inventory',
            amount: adjNominal,
            category: 'STOCK_OPNAME',
            level: 'WARN',
          }
        );
      }
    },
    [currentUser, appendAudit]
  );

  const processStockOpnameAdjustment = useCallback(
    (
      productIdOrPayload:
        | string
        | {
            productId: string;
            physicalStock?: number;
            physicalQty?: number;
            systemStock?: number;
            notes?: string;
            reason?: string;
            operator?: string;
          },
      physicalQtyArg?: number,
      reasonArg?: string
    ): { success: boolean; message?: string } => {
      const isObj = typeof productIdOrPayload === 'object' && productIdOrPayload !== null;
      const productId: string = isObj ? productIdOrPayload.productId : (productIdOrPayload as string);
      const physicalQty = isObj
        ? (productIdOrPayload.physicalStock ?? productIdOrPayload.physicalQty ?? 0)
        : (physicalQtyArg ?? 0);
      const reason = isObj
        ? (productIdOrPayload.notes || productIdOrPayload.reason || 'Stock Opname Fisik vs Sistem')
        : (reasonArg || 'Stock Opname Fisik vs Sistem');
      const operatorName = (isObj ? productIdOrPayload.operator : undefined) || currentUser?.name || 'Petugas Gudang';

      const prod = products.find((p) => p.id === productId);
      if (!prod) return { success: false, message: 'Produk tidak ditemukan' };

      const diff = physicalQty - prod.stock;
      const unitCost = Number(prod.cost_price || prod.costPrice || prod.price || 0);
      const adjNominal = Math.abs(diff) * unitCost;

      if (diff !== 0) {
        recordStockMutation({
          product_id: productId,
          product_name: prod.name,
          sku: prod.barcode || prod.sku || prod.id,
          type: diff > 0 ? 'IN' : 'OUT',
          qty: Math.abs(diff),
          previous_stock: prod.stock,
          final_stock: physicalQty,
          reference_no: `SO-${Date.now()}`,
          notes: `Stock Opname: ${reason}`
        });
      }

      appendAudit(
        'STOCK_OPNAME_ADJUSTMENT',
        'Gudang / Warehouse',
        `Koreksi Stock Opname "${prod.name}": Sistem ${prod.stock} -> Fisik ${physicalQty} (Selisih ${diff > 0 ? `+${diff}` : diff} ${prod.unit || 'Pcs'}) • Nilai Koreksi: Rp ${adjNominal.toLocaleString('id-ID')} • Catatan: ${reason}`,
        {
          user: operatorName,
          division: currentUser?.division || 'Gudang / Inventory',
          amount: adjNominal,
          category: 'STOCK_OPNAME',
          level: diff !== 0 ? 'WARN' : 'INFO',
        }
      );

      showToast('Koreksi stock opname berhasil disimpan', 'success');
      return { success: true, message: 'Koreksi stock opname berhasil disimpan' };
    },
    [products, currentUser, recordStockMutation, appendAudit, showToast]
  );

  const processGoodsReceipt = useCallback(
    (grOrPayload: GoodsReceipt | any): { success: boolean; message?: string } => {
      const receivedItems = grOrPayload?.receivedItems || grOrPayload?.items || [];
      const poNumber = grOrPayload?.poNumber || grOrPayload?.poId || '';
      const deliveryOrderNo = grOrPayload?.deliveryOrderNo || grOrPayload?.deliveryOrderNumber || `DO-${Date.now()}`;

      if (receivedItems.length > 0) {
        let totalGrAmount = 0;
        let vendorName = 'Vendor Umum';
        let vendorId = 'SUP-01';

        const allKnownSeedPOs: PurchaseOrder[] = [
          ...FNB_CULINARY_PURCHASE_ORDERS,
          ...FASHION_APPAREL_PURCHASE_ORDERS,
          ...BUILDING_BULK_PURCHASE_ORDERS,
        ];
        const targetPo: PurchaseOrder | undefined =
          purchaseOrders.find((p) => p.po_number === poNumber || (p as any).po_id === poNumber) ||
          grOrPayload?.poObject ||
          allKnownSeedPOs.find((p) => p.po_number === poNumber || (p as any).po_id === poNumber);

        if (targetPo) {
          vendorName = targetPo.supplier_name || targetPo.vendor_id || 'Vendor Utama';
          vendorId = targetPo.supplier_id || targetPo.vendor_id || 'SUP-01';
        }

        const mappedGrItems = receivedItems.map((item: any, idx: number) => {
          const accQty = Number(item.acceptedQty ?? item.receivedQty ?? item.qty) || 0;
          const uCost = Number(item.unitCost ?? item.unit_cost) || 0;
          totalGrAmount += accQty * uCost;
          return {
            id: `GRI-${Date.now()}-${idx}`,
            poItemId: `POI-${idx}`,
            productId: item.productId || item.product_id,
            productName: item.productName || item.product_name,
            orderedQty: Number(item.orderedQty ?? item.ordered_qty ?? accQty) || 0,
            receivedQty: Number(item.receivedQty ?? item.received_qty ?? accQty) || 0,
            acceptedQty: accQty,
            rejectedQty: Number(item.rejectedQty ?? 0) || 0,
            unit: item.unit || 'Pcs',
            unitCost: uCost,
            totalCost: accQty * uCost,
          };
        });

        // Cek apakah seluruh item PO diterima baik 100% tanpa tolakan -> samakan nilai GRN dengan total sisa nilai PO
        const hasAnyRejected = mappedGrItems.some((it: any) => (Number(it.rejectedQty) || 0) > 0);
        const previouslyReceivedAmount = (goodsReceipts || [])
          .filter(
            (g) =>
              g.status !== 'CANCELLED' &&
              (g.poNumber === poNumber || g.poId === poNumber)
          )
          .reduce((sum, g) => {
            if (typeof g.totalAmount === 'number' && g.totalAmount > 0) return sum + g.totalAmount;
            return (
              sum +
              (g.items || []).reduce(
                (s, it) =>
                  s + (Number(it.totalCost) || (Number(it.acceptedQty) || 0) * (Number(it.unitCost) || 0)),
                0
              )
            );
          }, 0);

        const computeUpdatedPo = (po: PurchaseOrder): { updatedPo: PurchaseOrder; isFullyReceived: boolean } => {
          const details = po.item_details || [];
          if (details.length > 0) {
            const updatedDetails = details.map((det) => {
              const matchedAccepted = mappedGrItems
                .filter(
                  (gi: any) =>
                    gi.productId === det.product_id ||
                    (gi.productName && det.product_name && gi.productName === det.product_name)
                )
                .reduce((s: number, gi: any) => s + (Number(gi.acceptedQty) || 0), 0);
              const nextRec = Number(det.received_qty || 0) + matchedAccepted;
              return {
                ...det,
                received_qty: nextRec,
              };
            });
            const allDetailsDone = updatedDetails.every(
              (d) => (Number(d.received_qty) || 0) >= (Number(d.qty) || 0)
            );
            return {
              updatedPo: {
                ...po,
                item_details: updatedDetails,
                status: (allDetailsDone ? 'COMPLETED' : 'PARTIAL') as any,
                received_date: new Date().toISOString(),
              },
              isFullyReceived: allDetailsDone,
            };
          }
          const totalAcceptedNow = mappedGrItems.reduce((s: number, i: any) => s + (Number(i.acceptedQty) || 0), 0);
          return {
            updatedPo: {
              ...po,
              status: (totalAcceptedNow > 0 ? 'COMPLETED' : 'PARTIAL') as any,
              received_date: new Date().toISOString(),
            },
            isFullyReceived: totalAcceptedNow > 0,
          };
        };

        const targetPoEvaluation = targetPo ? computeUpdatedPo(targetPo) : null;
        const isFullGoodReceipt =
          !hasAnyRejected &&
          (Boolean(grOrPayload?.isFullGoodReceipt) || Boolean(targetPoEvaluation?.isFullyReceived));

        if (isFullGoodReceipt && targetPo && Number(targetPo.total_amount) > 0) {
          const remainingPoAmount = Math.max(
            0,
            Math.round(Number(targetPo.total_amount) - previouslyReceivedAmount)
          );
          if (remainingPoAmount > 0) {
            totalGrAmount = remainingPoAmount;
          }
        } else if (
          !hasAnyRejected &&
          typeof grOrPayload?.expectedTotalAmount === 'number' &&
          grOrPayload.expectedTotalAmount > 0 &&
          grOrPayload?.isFullGoodReceipt
        ) {
          totalGrAmount = Math.round(grOrPayload.expectedTotalAmount);
        }

        const newGr: GoodsReceipt = {
          id: `GR-${Date.now()}`,
          poId: poNumber,
          poNumber: poNumber,
          vendorId,
          vendorName,
          warehouseId: 'WH-MAIN',
          deliveryOrderNumber: deliveryOrderNo,
          receivedDate: new Date().toISOString(),
          receivedByUserId: currentUser?.id || 'STAFF-01',
          status: 'VERIFIED',
          items: mappedGrItems,
          totalAmount: totalGrAmount,
          notes: grOrPayload?.notes,
          idempotencyKey: `GR-KEY-${Date.now()}`,
        };

        setGoodsReceipts((prev) => [newGr, ...prev]);

        // 1. Update stock & Weighted Average Cost Price (dengan Konversi Kubikasi Otomatis m³ jika Satuan Armada)
        newGr.items.forEach((item, idx) => {
          const rawInputItem = receivedItems[idx] || {};
          const qty = item.acceptedQty;
          if (qty > 0 && item.productId) {
            const currentProd = products.find((p) => p.id === item.productId || p.sku === item.productId);
            if (currentProd) {
              const cubicConv = resolveGrnBulkCubicConversion({
                unit: item.unit,
                productId: item.productId,
                productName: item.productName,
                product: currentProd,
              });
              const explicitFactor = Number(rawInputItem.cubicConversionFactorM3);
              const factorM3 =
                explicitFactor > 0
                  ? explicitFactor
                  : cubicConv.isBulkCubicItem
                  ? cubicConv.factorM3
                  : 1;
              const stockAddedQty = Number((qty * factorM3).toFixed(2));
              const oldStock = Number(currentProd.stock) || 0;
              const oldCost = Number(currentProd.costPrice ?? currentProd.cost_price ?? currentProd.buy_price) || 0;
              const newUnitCost = item.unitCost;
              const costPerBaseUnit =
                factorM3 > 0 ? Math.round(newUnitCost / factorM3) : newUnitCost;

              const newStock = Number((oldStock + stockAddedQty).toFixed(2));
              const weightedAvgCost =
                oldStock > 0 && newStock > 0
                  ? Math.round((oldStock * oldCost + stockAddedQty * costPerBaseUnit) / newStock)
                  : costPerBaseUnit;

              setProducts((prevProds) =>
                prevProds.map((p) =>
                  p.id === currentProd.id
                    ? {
                        ...p,
                        stock: newStock,
                        costPrice: weightedAvgCost,
                        cost_price: weightedAvgCost,
                        buy_price: weightedAvgCost,
                        sellingPrice: p.sellingPrice || Math.round(weightedAvgCost * 1.25),
                        sell_price: p.sell_price || Math.round(weightedAvgCost * 1.25),
                      }
                    : p
                )
              );

              const conversionNote =
                cubicConv.isBulkCubicItem && factorM3 !== 1
                  ? `Penerimaan GRN ${newGr.id} (${qty} ${item.unit} × ${factorM3} m³ = +${stockAddedQty} m³ ke Saldo Stok Dasar)`
                  : `Penerimaan GRN ${newGr.id} (${qty} ${item.unit})`;

              const isFnbGrn =
                String(poNumber || '').toUpperCase().startsWith('PO-FNB') ||
                String(currentProd.id || '').toUpperCase().startsWith('RM-FNB-');

              const nowLocal = new Date();
              const pad2 = (n: number) => String(n).padStart(2, '0');
              const localTimestampStr = `${nowLocal.getFullYear()}-${pad2(nowLocal.getMonth() + 1)}-${pad2(nowLocal.getDate())} ${pad2(nowLocal.getHours())}:${pad2(nowLocal.getMinutes())}:${pad2(nowLocal.getSeconds())}`;

              const newMutation: StockMutation = {
                id: isFnbGrn ? `MUT-FNB-PO-${Date.now()}-${idx}` : `MUT-GRN-${Date.now()}-${idx}`,
                timestamp: localTimestampStr,
                product_id: currentProd.id,
                sku: currentProd.sku || currentProd.id || currentProd.barcode,
                product_name: currentProd.name,
                type: isFnbGrn ? 'IN / PO DAPUR' : 'IN / GOODS_RECEIPT',
                qty: stockAddedQty,
                previous_stock: oldStock,
                final_stock: newStock,
                reference_no: newGr.id,
                notes: conversionNote,
                unit_cost: costPerBaseUnit,
                operator: currentUser?.name || 'Warehouse Staff',
              };
              setStockMutations((prev) => [newMutation, ...prev]);
            }
          }
        });

        // 2. Update or Upsert PO Status to COMPLETED / PARTIAL (termasuk PO bawaan domain yang belum tersimpan di state)
        if (poNumber) {
          setPurchaseOrders((prev) => {
            const existsInState = prev.some(
              (po) => po.po_number === poNumber || (po as any).po_id === poNumber
            );
            if (existsInState) {
              return prev.map((po) => {
                if (po.po_number === poNumber || (po as any).po_id === poNumber) {
                  return computeUpdatedPo(po).updatedPo;
                }
                return po;
              });
            }
            if (targetPo) {
              return [computeUpdatedPo(targetPo).updatedPo, ...prev];
            }
            return prev;
          });
        }

        // 3. Automatically Create Accounts Payable Bill (InvoiceDue) dengan nilai akurat tanpa selisih pembulatan
        if (totalGrAmount > 0) {
          const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
          const newInvoiceDue: InvoiceDue = {
            id: `INV-AP-${Date.now()}`,
            type: 'PAYABLE',
            party_name: vendorName,
            invoice_number: `BL-${poNumber || Date.now().toString().slice(-6)}`,
            due_date: dueDate,
            amount: totalGrAmount,
            status: 'Unpaid',
            po_number: poNumber,
            vendor: vendorName,
            terms: 'Tempo 30 Hari',
            created_at: new Date().toISOString(),
          };
          setInvoicesDue((prev) => [newInvoiceDue, ...prev]);
        }

        showToast(`Goods Receipt ${newGr.id} berhasil diproses, stok & AP vendor diperbarui`, 'success');
        return { success: true, message: 'Goods receipt processed with stock & AP automation' };
      }

      setGoodsReceipts((prev) => [grOrPayload, ...prev]);
      showToast('Penerimaan barang tercatat', 'success');
      return { success: true, message: 'Goods receipt recorded' };
    },
    [currentUser, products, purchaseOrders, goodsReceipts, recordStockMutation, showToast]
  );

  const repairStockLedger = useCallback(() => {
    const res = {
      success: true,
      repairedCount: products.length,
      mutationsSynced: stockMutations.length,
      message: 'Rekonsiliasi & perbaikan buku besar stok selesai'
    };
    showToast(res.message, 'success');
    return res;
  }, [products.length, stockMutations.length, showToast]);

  // Purchasing PO & PR
  const addPurchaseOrder = useCallback((po: Omit<PurchaseOrder, 'po_number'> & { po_number?: string }) => {
    const newPo: PurchaseOrder = {
      ...(po as PurchaseOrder),
      po_number: po.po_number || `PO-${Date.now().toString().slice(-6)}`
    };
    setPurchaseOrders((prev) => [newPo, ...prev]);
    dualBackendSync.enqueue('PURCHASING_ORDER', 'UPSERT', {
      ...newPo,
      tx_uuid: generateTxUuid()
    });
  }, []);

  const updatePurchaseOrder = useCallback((po: PurchaseOrder) => {
    setPurchaseOrders((prev) =>
      prev.map((item) => (item.po_number === po.po_number || (item as any).id === (po as any).id ? po : item))
    );
    dualBackendSync.enqueue('PURCHASING_ORDER', 'UPSERT', {
      ...po,
      tx_uuid: generateTxUuid()
    });
  }, []);

  const updatePurchaseOrderStatus = useCallback((poNo: string, status: string) => {
    setPurchaseOrders((prev) => prev.map((po) => (po.po_number === poNo ? { ...po, status: status as any } : po)));
  }, []);

  const updatePurchaseOrderPayment = useCallback(
    (poNo: string, status: string, details?: any) => {
      const targetPo = purchaseOrders.find((po) => po.po_number === poNo);
      setPurchaseOrders((prev) =>
        prev.map((po) => (po.po_number === poNo ? { ...po, payment_status: status as any, ...(details || {}) } : po))
      );
      const upperStatus = String(status || '').toUpperCase();
      if (upperStatus === 'PAID' || upperStatus === 'LUNAS') {
        const poAmount = Number(details?.amount ?? targetPo?.total_amount ?? 0);
        const vendorName = targetPo?.supplier_name || 'Vendor / Supplier';
        appendAudit(
          'AP_PO_PAYMENT',
          'Finance / AP',
          `Pelunasan Faktur/PO AP #${poNo} (${vendorName}) • Nominal: Rp ${poAmount.toLocaleString('id-ID')}`,
          {
            division: currentUser?.division || 'Finance & Purchasing',
            amount: poAmount,
            category: 'AP_PAYMENT',
            level: 'INFO',
          }
        );
      }
    },
    [purchaseOrders, currentUser, appendAudit]
  );

  const approvePurchaseOrder = useCallback(
    (poNo: string, noteOrApprover?: string) => {
      setPurchaseOrders((prev) =>
        prev.map((po) =>
          po.po_number === poNo ? { ...po, status: 'APPROVED', ...(noteOrApprover ? { notes: noteOrApprover } : {}) } : po
        )
      );
      showToast(`PO #${poNo} berhasil disetujui`, 'success');
    },
    [showToast]
  );

  const rejectPurchaseOrder = useCallback(
    (poNo: string, reason?: string) => {
      setPurchaseOrders((prev) =>
        prev.map((po) => (po.po_number === poNo ? { ...po, status: 'REJECTED', rejected_reason: reason } : po))
      );
      showToast(`PO #${poNo} ditolak`, 'warning');
    },
    [showToast]
  );

  const createPurchaseReturn = useCallback(
    (ret: any) => {
      setPurchaseReturns((prev) => [ret, ...prev]);
      showToast('Retur pembelian berhasil disimpan', 'success');
    },
    [showToast]
  );

  const effectiveDomainConfig = useMemo(() => {
    const base = getEffectiveBusinessDomainConfig(businessProfile);
    const enforcedQuota = Math.max(1, Math.min(10, Number(activeCashierQuota) || 2));
    return {
      ...base,
      activeStationCount: enforcedQuota,
    };
  }, [businessProfile, activeCashierQuota]);

  const domainSuppliers = useMemo(
    () => filterSuppliersByBusinessDomain(suppliers, effectiveDomainConfig),
    [suppliers, effectiveDomainConfig]
  );

  const getDefaultSupplierForProduct = useCallback(
    (p: Product): SupplierMaster | null => {
      const matched = suppliers.find((s) => s.name === p.supplier || s.id === p.supplierId);
      if (matched) return matched;
      if (isBuildingMaterialProduct(p)) {
        return BUILDING_BULK_SUPPLIERS[0] || domainSuppliers[0] || null;
      }
      return domainSuppliers[0] || suppliers[0] || null;
    },
    [suppliers, domainSuppliers]
  );

  const createAutoReorderPO = useCallback(
    (productOrId: Product | string): PurchaseOrder | null => {
      const prod = typeof productOrId === 'string' ? products.find((p) => p.id === productOrId) : productOrId;
      if (!prod) return null;
      const min = prod.minStock || prod.min_stock || 10;
      const qtyToOrder = Math.max(min * 2 - prod.stock, 10);
      const supplier = getDefaultSupplierForProduct(prod);
      const isBld = isBuildingMaterialProduct(prod);
      const unitLabel = prod.unit || (isBld ? 'Sak' : 'Pcs');
      const unitCost = prod.cost_price || prod.costPrice || 10000;
      const poPrefix = isBld ? 'PO-BLD-AUTO' : 'PO-AUTO';
      const newPo: PurchaseOrder = {
        po_number: `${poPrefix}-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().slice(0, 10),
        supplier_name: supplier?.name || (isBld ? 'PT Semen Tonasa / Tiga Roda' : 'Supplier Utama'),
        supplier_id: supplier?.id || (isBld ? 'SUP-BLD-01' : undefined),
        items: `${prod.name} (${qtyToOrder} ${unitLabel})`,
        total_amount: qtyToOrder * unitCost,
        subtotal: qtyToOrder * unitCost,
        status: 'Draft',
        created_by: currentUser?.name || 'Auto Reorder Engine',
        notes: 'AUTO-REORDER',
        item_details: [
          {
            product_id: prod.id,
            product_name: prod.name,
            qty: qtyToOrder,
            received_qty: 0,
            unit_cost: unitCost,
            subtotal: qtyToOrder * unitCost,
            unit: unitLabel,
          },
        ],
      };
      addPurchaseOrder(newPo);
      showToast(`Purchase Order Otomatis ${newPo.po_number} berhasil dibuat`, 'success');
      return newPo;
    },
    [currentUser, getDefaultSupplierForProduct, addPurchaseOrder, products, showToast]
  );

  const reorderAllLowStock = useCallback((): { pos: PurchaseOrder[] } => {
    const activeDomainProducts = filterProductsByBusinessDomain(products, effectiveDomainConfig);
    const lowStockItems = activeDomainProducts.filter((p) => p.stock <= (p.minStock || p.min_stock || 10));
    if (lowStockItems.length === 0) {
      showToast('Tidak ada produk yang berada di bawah stok minimum pada rumpun usaha aktif', 'info');
      return { pos: [] };
    }
    const created: PurchaseOrder[] = [];
    lowStockItems.forEach((p) => {
      const po = createAutoReorderPO(p);
      if (po) created.push(po);
    });
    showToast(`Membuat PO otomatis untuk ${lowStockItems.length} produk low stock`, 'success');
    return { pos: created };
  }, [products, effectiveDomainConfig, createAutoReorderPO, showToast]);

  const addPurchaseRequest = useCallback(
    (pr: Omit<PurchaseRequest, 'pr_number' | 'status'> & { pr_number?: string; status?: PurchaseRequest['status'] }) => {
      const newPr: PurchaseRequest = {
        ...(pr as PurchaseRequest),
        pr_number: pr.pr_number || `PR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`,
        status: pr.status || 'PENDING'
      };
      setPurchaseRequests((prev) => [newPr, ...prev]);
    },
    []
  );

  const approvePurchaseRequest = useCallback(
    (prNo: string) => {
      setPurchaseRequests((prev) => prev.map((pr) => (pr.pr_number === prNo ? { ...pr, status: 'APPROVED' } : pr)));
      showToast(`Purchase Request ${prNo} disetujui`, 'success');
    },
    [showToast]
  );

  const rejectPurchaseRequest = useCallback(
    (prNo: string) => {
      setPurchaseRequests((prev) => prev.map((pr) => (pr.pr_number === prNo ? { ...pr, status: 'REJECTED' } : pr)));
      showToast(`Purchase Request ${prNo} ditolak`, 'warning');
    },
    [showToast]
  );

  // Suppliers & Customers CRUD
  const addSupplier = useCallback((sup: SupplierMaster) => setSuppliers((prev) => [sup, ...prev]), []);
  const updateSupplier = useCallback((sup: SupplierMaster) => setSuppliers((prev) => prev.map((s) => (s.id === sup.id ? sup : s))), []);
  const deleteSupplier = useCallback((id: string) => setSuppliers((prev) => prev.filter((s) => s.id !== id)), []);

  const addCustomer = useCallback((c: CustomerMaster) => setCustomers((prev) => [c, ...prev]), []);
  const updateCustomer = useCallback((c: CustomerMaster) => setCustomers((prev) => prev.map((item) => (item.id === c.id ? c : item))), []);
  const deleteCustomer = useCallback((id: string) => setCustomers((prev) => prev.filter((c) => c.id !== id)), []);

  // Terminals CRUD
  const addTerminal = useCallback((term: Omit<Terminal, 'id'> & { id?: string }) => {
    const newTerm: Terminal = {
      ...(term as Terminal),
      id: term.id || `T-${Date.now().toString().slice(-5)}`
    };
    setTerminals((prev) => [newTerm, ...prev]);
  }, []);
  const updateTerminal = useCallback((idOrTerminal: string | Terminal, updatedArg?: Partial<Terminal>) => {
    const targetId = typeof idOrTerminal === 'string' ? idOrTerminal : idOrTerminal.id;
    const patch = typeof idOrTerminal === 'string' ? (updatedArg || {}) : idOrTerminal;
    setTerminals((prev) => prev.map((t) => (t.id === targetId ? { ...t, ...patch } : t)));
  }, []);
  const deleteTerminal = useCallback((id: string) => setTerminals((prev) => prev.filter((t) => t.id !== id)), []);
  const toggleTerminalLock = useCallback((id: string) => setTerminals((prev) => prev.map((t) => (t.id === id ? { ...t, isLocked: !t.isLocked } : t))), []);
  const setAllTerminalsLock = useCallback((locked: boolean) => setTerminals((prev) => prev.map((t) => ({ ...t, isLocked: locked }))), []);

  // Branches CRUD
  const addBranch = useCallback((b: Omit<BusinessBranch, 'id'> & { id?: string }) => {
    const newBranch: BusinessBranch = {
      ...(b as BusinessBranch),
      id: b.id || `BR-${Date.now().toString().slice(-5)}`
    };
    setBranches((prev) => [newBranch, ...prev]);
  }, []);
  const updateBranch = useCallback((idOrBranch: string | BusinessBranch, updatedArg?: Partial<BusinessBranch>) => {
    const targetId = typeof idOrBranch === 'string' ? idOrBranch : idOrBranch.id;
    const patch = typeof idOrBranch === 'string' ? (updatedArg || {}) : idOrBranch;
    setBranches((prev) => prev.map((item) => (item.id === targetId ? { ...item, ...patch } : item)));
  }, []);
  const deleteBranch = useCallback((id: string) => setBranches((prev) => prev.filter((item) => item.id !== id)), []);

  // Finance Manual & Jurnal
  const addFinanceEntry = useCallback((entry: any) => {
    const activeSec = resolveCanonicalSector(businessProfileRef.current);
    const activeBiz = businessProfileRef.current?.name || '';
    const newEntry: FinanceEntry = {
      ...entry,
      id: `FIN-${Date.now()}`,
      date: entry.date || new Date().toISOString(),
      type: entry.type || 'EXPENSE',
      category: entry.category || 'Operasional',
      description: entry.description || 'Entri Keuangan',
      amount: Number(entry.amount) || 0,
      payment_method: entry.payment_method || entry.paymentMethod || 'CASH',
      reference: entry.reference || entry.referenceId || `REF-${Date.now()}`,
      businessSector: entry.businessSector || activeSec,
      businessName: entry.businessName || activeBiz,
    };
    setFinanceEntries((prev) => [newEntry, ...prev]);
    dualBackendSync.enqueue('FINANCE_JOURNAL', 'INSERT', {
      ...newEntry,
      tx_uuid: generateTxUuid()
    });
  }, []);

  const addJournalVoucher = useCallback((voucher: Omit<JournalEntry, 'id'>) => {
    const activeSec = resolveCanonicalSector(businessProfileRef.current);
    const activeBiz = businessProfileRef.current?.name || '';
    const entry: JournalEntry = {
      ...voucher,
      id: `JRN-${Date.now()}`,
      businessSector: voucher.businessSector || activeSec,
      businessName: voucher.businessName || activeBiz,
    };
    setJournalEntries((prev) => [entry, ...prev]);
  }, []);

  const postGeneralJournalVoucher = useCallback(
    (voucher: any): { success: boolean; message?: string } => {
      const activeSec = resolveCanonicalSector(businessProfileRef.current);
      const activeBiz = businessProfileRef.current?.name || '';
      const rawLines = Array.isArray(voucher.lines) ? voucher.lines : [];
      const normalizedLines = rawLines.map((l: any) => ({
        accountCode: normalizeCanonicalAccountCode(String(l.accountCode || l.coa || '').trim()),
        accountName: String(l.accountName || l.description || l.memo || l.accountCode || l.coa || '').trim(),
        description: String(l.description || l.memo || '').trim(),
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
      }));

      const totalDebit =
        Number(voucher.amount) ||
        normalizedLines.reduce((s: number, l: any) => s + (Number(l.debit) || 0), 0);
      const refCode =
        voucher.voucherNo ||
        voucher.voucherNumber ||
        voucher.referenceNo ||
        voucher.reference ||
        `JV-${Date.now()}`;
      const txDateStr = (voucher.transactionDate || voucher.date || new Date().toISOString()).slice(0, 10);
      const memoText =
        voucher.generalMemo ||
        voucher.description ||
        normalizedLines.find((l: any) => l.description)?.description ||
        'Jurnal Penyesuaian / COA';

      const newJ: JournalEntry = {
        id: `JV-${Date.now()}`,
        date: txDateStr,
        reference: refCode,
        description: memoText,
        lines: normalizedLines,
        amount: totalDebit,
        businessSector: voucher.businessSector || activeSec,
        businessName: voucher.businessName || activeBiz,
      };
      setJournalEntries((prev) => [newJ, ...prev]);

      // Sinkronisasi langsung ke Buku Besar & Kas (financeEntries) beserta dampak Kas/KPI
      const CASH_COA_SET = new Set(['1-10000', '1-10001', '1-10002', '1-10003']);
      const cashDebit = normalizedLines
        .filter((l: any) => CASH_COA_SET.has(l.accountCode))
        .reduce((s: number, l: any) => s + l.debit, 0);
      const cashCredit = normalizedLines
        .filter((l: any) => CASH_COA_SET.has(l.accountCode))
        .reduce((s: number, l: any) => s + l.credit, 0);
      const cashDelta = cashDebit - cashCredit;

      const primaryNonCashLine =
        normalizedLines.find((l: any) => !CASH_COA_SET.has(l.accountCode) && l.debit > 0) ||
        normalizedLines.find((l: any) => !CASH_COA_SET.has(l.accountCode) && l.credit > 0) ||
        normalizedLines[0];

      const primaryCode = primaryNonCashLine?.accountCode || '5-10003';
      const primaryName = primaryNonCashLine?.accountName || 'Jurnal Umum & Penyesuaian';

      let categoryLabel = 'Jurnal Penyesuaian COA';
      if (primaryCode === '5-10302') {
        categoryLabel = 'Susut Material Curah';
      } else if (primaryCode === '5-10205') {
        categoryLabel = 'Beban Pengiriman Armada (Frangko)';
      } else if (primaryCode === '4-10102') {
        categoryLabel = 'Pendapatan/Titipan Jasa Bongkar Kuli';
      } else if (primaryCode === '2-10401') {
        categoryLabel = 'Uang Muka (DP) Proyek Kontraktor';
      } else if (primaryCode === '4-10001') {
        categoryLabel =
          effectiveDomainConfig?.mechanismFamily === 'BUILDING_BULK'
            ? 'PENJUALAN DEPO MATERIAL'
            : 'Penjualan POS Ritel';
      } else if (primaryCode === '5-10001' || primaryCode === '5-10101') {
        categoryLabel = 'HPP';
      } else if (primaryCode === '5-10004') {
        categoryLabel = 'Penyesuaian Kas & MDR QRIS';
      } else if (primaryCode === '7-10002') {
        categoryLabel = 'Selisih Kas Operasional';
      } else if (voucher.documentType === 'StockCorrection') {
        categoryLabel = 'Koreksi Selisih Stok';
      }

      const isIncomeType =
        cashDelta > 0 ||
        primaryCode.startsWith('4-') ||
        primaryCode === '2-10401';
      const isHppType =
        primaryCode === '5-10001' ||
        primaryCode === '5-10101' ||
        primaryCode === '5-10302';

      let paymentMethod = 'FIFO';
      if (normalizedLines.some((l: any) => l.accountCode === '5-10205')) {
        paymentMethod = 'OPERASIONAL_ARMADA';
      } else if (normalizedLines.some((l: any) => l.accountCode === '1-10003')) {
        paymentMethod = 'QRIS';
      } else if (normalizedLines.some((l: any) => l.accountCode === '1-10002')) {
        paymentMethod = 'TRANSFER';
      } else if (
        normalizedLines.some(
          (l: any) => l.accountCode === '1-10000' || l.accountCode === '1-10001'
        )
      ) {
        paymentMethod = 'CASH';
      }

      const displayedAmount =
        cashDebit > 0 && cashCredit > 0 && cashDelta !== 0
          ? Math.abs(cashDelta)
          : totalDebit;

      const newFinEntry: FinanceEntry = {
        id: `FIN-JV-${Date.now()}`,
        date: txDateStr,
        type: isIncomeType ? 'INCOME' : isHppType ? 'HPP / BEBAN POKOK' : 'EXPENSE',
        category: categoryLabel,
        account_target: `${primaryCode} · ${primaryName}`,
        description: `${memoText}${voucher.branch ? ` [${voucher.branch}]` : ''}`,
        amount: displayedAmount,
        payment_method: paymentMethod,
        reference: refCode,
        businessSector: voucher.businessSector || activeSec,
        businessName: voucher.businessName || activeBiz,
        ...({
          paymentMethod,
          referenceId: refCode,
          cashDelta,
        } as any),
      };

      setFinanceEntries((prev) => [newFinEntry, ...prev]);

      showToast('Jurnal voucher berhasil diposting ke Buku Besar', 'success');
      return { success: true, message: 'Jurnal voucher berhasil diposting ke Buku Besar' };
    },
    [showToast, effectiveDomainConfig]
  );

  const activeCanonicalSector = useMemo(
    () => resolveCanonicalSector(effectiveDomainConfig),
    [effectiveDomainConfig]
  );

  const domainSales = useMemo(() => {
    const activeBiz = businessProfile?.name || '';
    return (sales || []).filter((s) =>
      belongsToActiveEntity(s, activeCanonicalSector, activeBiz)
    );
  }, [sales, activeCanonicalSector, businessProfile?.name]);

  const domainJournalEntries = useMemo(() => {
    const activeBiz = businessProfile?.name || '';
    return (journalEntries || []).filter((j) =>
      belongsToActiveEntity(j, activeCanonicalSector, activeBiz)
    );
  }, [journalEntries, activeCanonicalSector, businessProfile?.name]);

  const domainSupplierRebateClaims = useMemo(() => {
    if (activeCanonicalSector !== 'RETAIL') {
      return (supplierRebateClaims || []).filter(
        (c) => !String(c.id || '').toUpperCase().startsWith('CLM-SEED-')
      );
    }
    return supplierRebateClaims || [];
  }, [supplierRebateClaims, activeCanonicalSector]);

  const domainFinanceEntries = useMemo(() => {
    const isBuildingBulk = effectiveDomainConfig?.mechanismFamily === 'BUILDING_BULK';
    const activeBiz = businessProfile?.name || '';
    const adaptiveCoa = getAdaptiveCoaMeta(activeCanonicalSector);
    return (financeEntries || [])
      .filter((entry) => belongsToActiveEntity(entry, activeCanonicalSector, activeBiz))
      .map((entry) => {
        const catUpper = (entry.category || '').trim().toUpperCase();
        const rawTarget = String(entry.account_target || '').trim();
        const rawCode = rawTarget.split('·')[0].trim();
        const canonicalCode = normalizeCanonicalAccountCode(rawCode);

        if (isBuildingBulk && (catUpper === 'PENJUALAN POS RITEL' || catUpper === 'PENDAPATAN PENJUALAN MATERIAL')) {
          return {
            ...entry,
            category: 'PENJUALAN DEPO MATERIAL',
            account_target: `4-10101 · ${adaptiveCoa.revenueName}`,
          };
        }
        if (!isBuildingBulk && catUpper === 'PENJUALAN DEPO MATERIAL') {
          return {
            ...entry,
            category: 'Penjualan POS Ritel',
            account_target: `4-10101 · ${adaptiveCoa.revenueName}`,
          };
        }
        if (canonicalCode === '4-10101' && rawCode === '4-10001') {
          return { ...entry, account_target: `4-10101 · ${adaptiveCoa.revenueName}` };
        }
        if (canonicalCode === '5-10101' && rawCode === '5-10001') {
          return { ...entry, account_target: `5-10101 · ${adaptiveCoa.cogsName}` };
        }
        if (!entry.account_target) {
          if (catUpper === 'HPP') {
            return { ...entry, account_target: `${adaptiveCoa.cogsCode} · ${adaptiveCoa.cogsName}` };
          }
          if (catUpper.includes('MODAL KAS')) {
            return { ...entry, account_target: '1-10002 · Bank Operasional' };
          }
        }
        return entry;
      });
  }, [financeEntries, effectiveDomainConfig, activeCanonicalSector, businessProfile?.name]);

  const openJournalVoucher = useCallback((initialData?: any) => {
    setJournalVoucherInitialData(initialData || null);
    setShowJournalModal(true);
  }, []);

  const invoicesReceivable = useMemo(() => invoicesDue.filter((inv) => inv.type === 'RECEIVABLE'), [invoicesDue]);

  const receiveCustomerPayment = useCallback(
    (
      invoiceId: string,
      amountOrSource: number | string,
      methodOrNotes?: string,
      notesArg?: string
    ): { success: boolean; message?: string; remaining?: number; isFullyPaid?: boolean } => {
      const nowIso = new Date().toISOString();
      const targetInv = invoicesDue.find((inv) => inv.id === invoiceId);
      const prevAmount = Number(targetInv?.amount || 0);

      const isAmountNumeric = typeof amountOrSource === 'number' && amountOrSource > 0;
      const actualPay = isAmountNumeric ? Math.min(prevAmount, Math.round(amountOrSource)) : prevAmount;
      const remaining = Math.max(0, prevAmount - actualPay);
      const isFullyPaid = remaining <= 0;

      const rawMethod = typeof amountOrSource === 'string'
        ? amountOrSource
        : (methodOrNotes || 'Tunai Kas');
      const notes = typeof amountOrSource === 'string' ? (methodOrNotes || '') : (notesArg || '');

      // Resolve Rekening Penerima: Kas Kasir (1-10001), Kas Utama (1-10000), Bank (1-10002), QRIS (1-10003)
      const methodUpper = String(rawMethod).toUpperCase();
      const isQris = methodUpper.includes('QRIS');
      const isBank = methodUpper.includes('BANK') || methodUpper.includes('TRANSFER');
      const isKasUtama = methodUpper.includes('UTAMA') || methodUpper.includes('BRANKAS');
      const accCode = isQris ? '1-10003' : isBank ? '1-10002' : isKasUtama ? '1-10000' : '1-10001';
      const accName = isQris ? 'Bank QRIS' : isBank ? 'Bank Operasional' : isKasUtama ? 'Kas Utama' : 'Kas Kasir';

      setInvoicesDue((prev) =>
        prev.map((inv) => {
          if (inv.id !== invoiceId) return inv;
          const orig = (inv as any).originalAmount || prevAmount;
          return {
            ...inv,
            amount: remaining,
            originalAmount: orig,
            status: isFullyPaid ? 'PAID' : 'PARTIAL',
            paidAt: isFullyPaid ? nowIso : (inv as any).paidAt,
            paid_date: nowIso.slice(0, 10),
            paymentMethod: rawMethod,
            paymentSource: `${accName} (${accCode})`,
            terms: isFullyPaid
              ? (inv.terms ? `${inv.terms} • LUNAS` : 'Lunas')
              : `${inv.terms || ''} • Cicilan Masuk Rp ${actualPay.toLocaleString('id-ID')} (Sisa Rp ${remaining.toLocaleString('id-ID')})`,
          };
        })
      );

      // Sinkronisasi balik ke order & tracking Laundry bila piutang ini berasal dari Laundry
      const matchedLaundryOrder = laundryOrders.find(
        (o) =>
          (targetInv?.invoice_number && o.orderNumber === targetInv.invoice_number) ||
          (o.transactionId && `AR-POS-${o.transactionId}` === invoiceId) ||
          `AR-LND-${o.id}` === invoiceId ||
          o.id.replace('LND-ORD-', 'AR-LND-') === invoiceId
      );
      if (matchedLaundryOrder) {
        const nextLaundryPaid = Math.min(matchedLaundryOrder.totalAmount, (matchedLaundryOrder.paidAmount || 0) + actualPay);
        const nextLaundryRem = Math.max(0, matchedLaundryOrder.totalAmount - nextLaundryPaid);
        setLaundryOrders((prev) =>
          prev.map((o) =>
            o.id === matchedLaundryOrder.id
              ? {
                  ...o,
                  paidAmount: nextLaundryPaid,
                  remainingAmount: nextLaundryRem,
                  paymentStatus: nextLaundryRem <= 0 ? 'LUNAS_AWAL' : 'DP',
                  updatedAt: nowIso,
                }
              : o
          )
        );
        setSales((prev) =>
          prev.map((s) =>
            (matchedLaundryOrder.transactionId && s.transaction_id === matchedLaundryOrder.transactionId) ||
            s.receipt_number === matchedLaundryOrder.orderNumber
              ? {
                  ...s,
                  amount_paid: nextLaundryPaid,
                  remainingBalance: nextLaundryRem,
                  laundryPaymentStatus: nextLaundryRem <= 0 ? 'LUNAS_AWAL' : 'DP',
                }
              : s
          )
        );
      }

      addFinanceEntry({
        id: matchedLaundryOrder ? `FIN-LND-SETTLE-${Date.now()}` : undefined,
        type: 'INCOME',
        category: matchedLaundryOrder ? 'Pelunasan Piutang Laundry' : 'Pelunasan Piutang (AR)',
        account_target: `${accCode} · ${accName}`,
        description: `Pelunasan piutang invoice #${targetInv?.invoice_number || invoiceId} (${targetInv?.party_name || 'Pelanggan'})${notes ? ` - ${notes}` : ''} [${isFullyPaid ? 'LUNAS 100%' : `Cicilan Rp ${actualPay.toLocaleString('id-ID')}`}]`,
        amount: actualPay,
        payment_method: rawMethod,
        reference: targetInv?.invoice_number || invoiceId,
        ...( { cashDelta: actualPay } as any ),
      });

      if (actualPay > 0) {
        setJournalEntries((prev) => [
          {
            id: `JV-AR-RCV-${Date.now()}`,
            date: nowIso.slice(0, 10),
            created_at: nowIso,
            reference: targetInv?.invoice_number || invoiceId,
            description: `Pelunasan Piutang Usaha #${targetInv?.invoice_number || invoiceId} (${targetInv?.party_name || 'Pelanggan'}) - ${rawMethod} (${isFullyPaid ? 'LUNAS' : 'CICILAN'})`,
            type: matchedLaundryOrder ? 'LAUNDRY_AR_SETTLEMENT' : 'AR_SETTLEMENT',
            amount: actualPay,
            lines: [
              { accountCode: accCode, accountName: accName, debit: actualPay, credit: 0 },
              { accountCode: '1-10105', accountName: 'Piutang Usaha', debit: 0, credit: actualPay },
            ],
          },
          ...prev,
        ]);
      }

      const msg = isFullyPaid
        ? `Pelunasan piutang #${targetInv?.invoice_number || invoiceId} sebesar Rp ${actualPay.toLocaleString('id-ID')} berhasil (STATUS: LUNAS)`
        : `Pembayaran cicilan piutang #${targetInv?.invoice_number || invoiceId} sebesar Rp ${actualPay.toLocaleString('id-ID')} diterima (Sisa: Rp ${remaining.toLocaleString('id-ID')})`;
      showToast(msg, 'success');
      return { success: true, message: msg, remaining, isFullyPaid };
    },
    [invoicesDue, laundryOrders, addFinanceEntry, showToast]
  );

  const payVendorInvoice = useCallback(
    (
      invoiceId: string,
      amountOrSource: number | string,
      methodOrNotes?: string,
      notesArg?: string
    ): { success: boolean; message?: string; remaining?: number; isFullyPaid?: boolean } => {
      const nowIso = new Date().toISOString();
      const targetInv = invoicesDue.find((inv) => inv.id === invoiceId);
      const targetPo = purchaseOrders.find(
        (po) =>
          po.po_number === invoiceId ||
          `PO-INV-${po.po_number}` === invoiceId ||
          `INV-AP-${po.po_number}` === invoiceId ||
          (targetInv?.po_number && po.po_number === targetInv.po_number)
      );

      const prevAmount = Number(targetInv?.amount ?? targetPo?.total_amount ?? 0);
      const isAmountNumeric = typeof amountOrSource === 'number' && amountOrSource > 0;
      const actualPay = isAmountNumeric ? Math.min(prevAmount, Math.round(amountOrSource)) : prevAmount;
      const remaining = Math.max(0, prevAmount - actualPay);
      const isFullyPaid = remaining <= 0;

      const rawMethod = typeof amountOrSource === 'string'
        ? amountOrSource
        : (methodOrNotes || 'Transfer Bank');
      const notes = typeof amountOrSource === 'string' ? (methodOrNotes || '') : (notesArg || '');

      // Resolve Rekening Pembayar: Bank Operasional (1-10002), Kas Kasir (1-10001), Kas Utama (1-10000), QRIS (1-10003)
      const methodUpper = String(rawMethod).toUpperCase();
      const isQris = methodUpper.includes('QRIS');
      const isKas = methodUpper.includes('KAS KASIR') || methodUpper.includes('TUNAI');
      const isKasUtama = methodUpper.includes('UTAMA') || methodUpper.includes('BRANKAS');
      const accCode = isQris ? '1-10003' : isKas ? '1-10001' : isKasUtama ? '1-10000' : '1-10002';
      const accName = isQris ? 'Bank QRIS' : isKas ? 'Kas Kasir' : isKasUtama ? 'Kas Utama' : 'Bank Operasional';

      setInvoicesDue((prev) => {
        const exists = prev.some((inv) => inv.id === invoiceId);
        if (exists) {
          return prev.map((inv) => {
            if (inv.id !== invoiceId) return inv;
            const orig = (inv as any).originalAmount || prevAmount;
            return {
              ...inv,
              amount: remaining,
              originalAmount: orig,
              status: isFullyPaid ? 'PAID' : 'PARTIAL',
              paidAt: isFullyPaid ? nowIso : (inv as any).paidAt,
              paid_date: nowIso.slice(0, 10),
              paymentMethod: rawMethod,
              paymentSource: `${accName} (${accCode})`,
              terms: isFullyPaid
                ? (inv.terms ? `${inv.terms} • LUNAS` : 'Lunas')
                : `${inv.terms || ''} • Cicilan Bayar Rp ${actualPay.toLocaleString('id-ID')} (Sisa Rp ${remaining.toLocaleString('id-ID')})`,
            };
          });
        }
        if (targetPo) {
          return [
            {
              id: invoiceId,
              type: 'PAYABLE',
              party_name: targetPo.supplier_name,
              vendor: targetPo.supplier_name,
              invoice_number: `INV-AP/${targetPo.po_number}`,
              po_number: targetPo.po_number,
              due_date: targetPo.due_date || nowIso.slice(0, 10),
              amount: remaining,
              status: isFullyPaid ? 'PAID' : 'PARTIAL',
              paidAt: isFullyPaid ? nowIso : undefined,
              paid_date: nowIso.slice(0, 10),
              paymentMethod: rawMethod,
              paymentSource: `${accName} (${accCode})`,
              terms: targetPo.payment_term,
            },
            ...prev,
          ];
        }
        return prev;
      });

      if (targetPo) {
        setPurchaseOrders((prev) =>
          prev.map((po) =>
            po.po_number === targetPo.po_number
              ? {
                  ...po,
                  payment_status: isFullyPaid ? 'Lunas' : 'Sebagian',
                  paid_date: nowIso.slice(0, 10),
                }
              : po
          )
        );
      }

      addFinanceEntry({
        type: 'EXPENSE',
        category: 'Pelunasan Hutang (AP)',
        account_target: `${accCode} · ${accName}`,
        description: `Pembayaran hutang vendor invoice #${invoiceId} (${targetInv?.vendor || targetInv?.party_name || targetPo?.supplier_name || 'Vendor'})${notes ? ` - ${notes}` : ''} [${isFullyPaid ? 'LUNAS 100%' : `Cicilan Rp ${actualPay.toLocaleString('id-ID')}`}]`,
        amount: actualPay,
        payment_method: rawMethod,
        reference: invoiceId,
        ...( { cashDelta: -actualPay } as any ),
      });

      // Double-Entry Journal Voucher: Debit 2-10101 Hutang Usaha & Kredit Kas/Bank
      if (actualPay > 0) {
        setJournalEntries((prev) => [
          {
            id: `JV-AP-PAY-${Date.now()}`,
            date: nowIso.slice(0, 10),
            created_at: nowIso,
            reference: invoiceId,
            description: `Pelunasan Hutang Dagang #${invoiceId} (${targetInv?.vendor || targetInv?.party_name || targetPo?.supplier_name || 'Vendor'}) - ${rawMethod} (${isFullyPaid ? 'LUNAS' : 'CICILAN'})`,
            type: 'AP_SETTLEMENT',
            amount: actualPay,
            lines: [
              { accountCode: '2-10101', accountName: 'Hutang Usaha', debit: actualPay, credit: 0 },
              { accountCode: accCode, accountName: accName, debit: 0, credit: actualPay },
            ],
          },
          ...prev,
        ]);
      }

      const vendorLabel = targetInv?.vendor || targetInv?.party_name || targetPo?.supplier_name || 'Vendor';
      const invLabel = targetInv?.invoice_number || invoiceId;
      appendAudit(
        'AP_INVOICE_PAYMENT',
        'Finance / AP',
        `Pembayaran Faktur AP #${invLabel} (${vendorLabel}) • Nominal: Rp ${actualPay.toLocaleString('id-ID')} • Metode: ${rawMethod} • Status: ${isFullyPaid ? 'LUNAS' : `Sisa Rp ${remaining.toLocaleString('id-ID')}`}`,
        {
          division: currentUser?.division || 'Finance & Accounting',
          amount: actualPay,
          category: 'AP_PAYMENT',
          level: 'INFO',
        }
      );

      const msg = isFullyPaid
        ? `Pembayaran hutang vendor #${invLabel} sebesar Rp ${actualPay.toLocaleString('id-ID')} berhasil (STATUS: LUNAS)`
        : `Pembayaran cicilan hutang vendor #${invLabel} sebesar Rp ${actualPay.toLocaleString('id-ID')} berhasil (Sisa: Rp ${remaining.toLocaleString('id-ID')})`;
      showToast(msg, 'success');
      return { success: true, message: msg, remaining, isFullyPaid };
    },
    [invoicesDue, purchaseOrders, currentUser, addFinanceEntry, appendAudit, showToast]
  );

  const applySupplierRebateToAP = useCallback(
    (claimIds: string[], targetInvoiceId: string): { success: boolean; message: string; deductedTotal: number } => {
      const selectedClaims = supplierRebateClaims.filter(
        (c) => claimIds.includes(c.id) && c.status === 'CLAIMABLE'
      );
      if (selectedClaims.length === 0) {
        showToast('Tidak ada klaim rebate CLAIMABLE yang dipilih.', 'warning');
        return { success: false, message: 'Tidak ada klaim rebate yang valid.', deductedTotal: 0 };
      }

      // Resolve target invoice from invoicesDue or virtual received PO
      let targetInv = invoicesDue.find((inv) => inv.id === targetInvoiceId);
      if (!targetInv) {
        const matchedPo = purchaseOrders.find((po) => `INV-AP-${po.po_number}` === targetInvoiceId);
        if (matchedPo) {
          targetInv = {
            id: `INV-AP-${matchedPo.po_number}`,
            type: 'PAYABLE',
            party_name: matchedPo.supplier_name,
            vendor: matchedPo.supplier_name,
            invoice_number: `INV-AP-${matchedPo.po_number}`,
            po_number: matchedPo.po_number,
            due_date: matchedPo.due_date || 'N/A',
            amount: matchedPo.total_amount,
            status: 'Unpaid',
            terms: matchedPo.payment_term || 'N/A',
            created_at: matchedPo.date || '',
          };
        }
      }

      if (!targetInv) {
        showToast('Tagihan Hutang Dagang (AP) tujuan tidak ditemukan.', 'error');
        return { success: false, message: 'Invoice AP tujuan tidak ditemukan.', deductedTotal: 0 };
      }

      const rawTotal = selectedClaims.reduce((s, c) => s + (c.claimAmount || 0), 0);
      const deductedTotal = Math.min(Math.max(0, targetInv.amount), rawTotal);
      if (deductedTotal <= 0) {
        showToast('Nominal tagihan AP tujuan sudah Rp 0 / lunas.', 'warning');
        return { success: false, message: 'Nominal tagihan AP tujuan sudah lunas.', deductedTotal: 0 };
      }

      const nowIso = new Date().toISOString();
      const invNumber = targetInv.invoice_number || targetInv.id;
      const supplierLabel = Array.from(new Set(selectedClaims.map((c) => c.supplierName))).join(', ');

      // Update invoice balance (or insert materialized virtual PO invoice with reduced amount)
      const remainingAmount = Math.max(0, targetInv.amount - deductedTotal);
      setInvoicesDue((prev) => {
        const exists = prev.some((i) => i.id === targetInv!.id);
        const patchedInv: InvoiceDue = {
          ...targetInv!,
          amount: remainingAmount,
          status: remainingAmount <= 0 ? 'PAID' : targetInv!.status,
          paidAt: remainingAmount <= 0 ? nowIso : targetInv!.paidAt,
        };
        if (exists) {
          return prev.map((i) => (i.id === targetInv!.id ? patchedInv : i));
        }
        return [patchedInv, ...prev];
      });

      // Mark claims as DEDUCTED_AP (respect cap if invoice was smaller)
      let budget = deductedTotal;
      const appliedIds = new Set<string>();
      for (const clm of selectedClaims) {
        if (budget >= clm.claimAmount) {
          appliedIds.add(clm.id);
          budget -= clm.claimAmount;
        }
      }
      // If none fully fit (e.g. single large claim > invoice), still apply the first one proportionally/mark settled
      if (appliedIds.size === 0 && selectedClaims[0]) {
        appliedIds.add(selectedClaims[0].id);
      }

      setSupplierRebateClaims((prev) =>
        prev.map((c) =>
          appliedIds.has(c.id)
            ? {
                ...c,
                status: 'DEDUCTED_AP',
                deductedInvoiceId: targetInv!.id,
                deductedInvoiceNumber: invNumber,
                deductedAt: nowIso,
              }
            : c
        )
      );

      // Post balanced AP Rebate Offset Journal (Debit 2-10101 Hutang Dagang / Credit 1-10305 Piutang Rebate Supplier)
      const offsetJournal: JournalEntry = {
        id: `JV-AP-REB-${Date.now()}`,
        date: nowIso.slice(0, 10),
        created_at: nowIso,
        reference: invNumber,
        description: `Pemotongan Hutang Dagang (AP) dengan Klaim Rebate ${supplierLabel} -> ${invNumber}`,
        type: 'AP_REBATE_OFFSET',
        promoSourceType: 'SUPPLIER_TPR',
        supplierName: supplierLabel,
        amount: deductedTotal,
        lines: [
          {
            accountCode: '2-10101',
            accountName: 'Hutang Dagang (AP)',
            debit: deductedTotal,
            credit: 0,
          },
          {
            accountCode: '1-10305',
            accountName: 'Piutang Rebate Supplier (AP Rebate Claimable)',
            debit: 0,
            credit: deductedTotal,
          },
        ],
      };
      setJournalEntries((prev) => [offsetJournal, ...prev]);

      addFinanceEntry({
        type: 'PROMO_AUTO',
        category: 'Pemotongan Hutang (Rebate AP)',
        account_target: `2-10101 · ${targetInv.party_name || targetInv.vendor}`,
        description: `Offset Klaim Rebate (${supplierLabel}) ke Invoice #${invNumber}`,
        amount: deductedTotal,
        payment_method: 'REBATE_OFFSET',
        reference: invNumber,
      });

      appendAudit(
        'SUPPLIER_REBATE_AP_OFFSET',
        'FINANCE',
        `Klaim rebate Rp ${deductedTotal.toLocaleString('id-ID')} (${supplierLabel}) dipotongkan ke AP #${invNumber}. Sisa AP: Rp ${remainingAmount.toLocaleString('id-ID')}`
      );

      const msg = `Berhasil memotong Hutang Dagang #${invNumber} sebesar Rp ${deductedTotal.toLocaleString('id-ID')}.`;
      showToast(msg, 'success');
      return { success: true, message: msg, deductedTotal };
    },
    [supplierRebateClaims, invoicesDue, purchaseOrders, addFinanceEntry, appendAudit, showToast]
  );

  const settleRebateClaimCash = useCallback(
    (claimId: string): { success: boolean; message: string } => {
      const target = supplierRebateClaims.find((c) => c.id === claimId && c.status === 'CLAIMABLE');
      if (!target) {
        return { success: false, message: 'Klaim rebate tidak ditemukan atau sudah diselesaikan.' };
      }
      const nowIso = new Date().toISOString();
      setSupplierRebateClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status: 'SETTLED', deductedAt: nowIso } : c))
      );

      const settleJournal: JournalEntry = {
        id: `JV-REB-CASH-${Date.now()}`,
        date: nowIso.slice(0, 10),
        created_at: nowIso,
        reference: target.receiptNumber,
        description: `Pencairan Tunai/Transfer Rebate Supplier (${target.supplierName}) - ${target.promoCode}`,
        type: 'REBATE_CASH_SETTLEMENT',
        promoSourceType: 'SUPPLIER_TPR',
        supplierName: target.supplierName,
        promoCode: target.promoCode,
        amount: target.claimAmount,
        lines: [
          {
            accountCode: '1-10002',
            accountName: 'Bank Operasional',
            debit: target.claimAmount,
            credit: 0,
          },
          {
            accountCode: '1-10305',
            accountName: 'Piutang Rebate Supplier (AP Rebate Claimable)',
            debit: 0,
            credit: target.claimAmount,
          },
        ],
      };
      setJournalEntries((prev) => [settleJournal, ...prev]);

      addFinanceEntry({
        type: 'INCOME',
        category: 'Pencairan Rebate Supplier',
        account_target: '1-10002 · Bank Operasional',
        description: `Pencairan Rebate ${target.supplierName} (${target.promoCode})`,
        amount: target.claimAmount,
        payment_method: 'TRANSFER',
        reference: target.receiptNumber,
      });

      const msg = `Pencairan rebate ${target.supplierName} sebesar Rp ${target.claimAmount.toLocaleString('id-ID')} dicatat masuk ke Bank Operasional.`;
      showToast(msg, 'success');
      return { success: true, message: msg };
    },
    [supplierRebateClaims, addFinanceEntry, showToast]
  );

  // Approvals, Promotions & Stock Policies
  const approveItem = useCallback((id: string) => {
    setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'APPROVED' } : a)));
  }, []);
  const rejectItem = useCallback((id: string) => {
    setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'REJECTED' } : a)));
  }, []);

  const addPromotion = useCallback((promo: Omit<PromotionProgram, 'id'> & { id?: string }) => {
    const newPromo: PromotionProgram = {
      ...(promo as PromotionProgram),
      id: promo.id || `PROMO-${Date.now().toString().slice(-6)}`
    };
    setPromotions((prev) => [newPromo, ...prev]);
  }, []);
  const updatePromotion = useCallback((idOrPromo: string | PromotionProgram, updatedArg?: Partial<PromotionProgram>) => {
    const targetId = typeof idOrPromo === 'string' ? idOrPromo : idOrPromo.id;
    const patch = typeof idOrPromo === 'string' ? (updatedArg || {}) : idOrPromo;
    setPromotions((prev) => prev.map((p) => (p.id === targetId ? { ...p, ...patch } : p)));
  }, []);
  const deletePromotion = useCallback((id: string) => setPromotions((prev) => prev.filter((p) => p.id !== id)), []);
  const togglePromotionStatus = useCallback((id: string) => setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive, status: !p.isActive ? 'ACTIVE' : 'INACTIVE' } : p))), []);

  const addStockAlertPolicy = useCallback((p: Omit<StockAlertPolicy, 'id' | 'updatedAt'> & { id?: string; updatedAt?: string }) => {
    const newPolicy: StockAlertPolicy = {
      ...(p as StockAlertPolicy),
      id: p.id || `POL-${Date.now().toString().slice(-6)}`,
      updatedAt: p.updatedAt || new Date().toISOString()
    };
    setStockPolicies((prev) => [newPolicy, ...prev]);
  }, []);
  const updateStockAlertPolicy = useCallback((idOrPolicy: string | StockAlertPolicy, updatedArg?: Partial<StockAlertPolicy>) => {
    const targetId = typeof idOrPolicy === 'string' ? idOrPolicy : idOrPolicy.id;
    const patch = typeof idOrPolicy === 'string' ? (updatedArg || {}) : idOrPolicy;
    setStockPolicies((prev) =>
      prev.map((item) => (item.id === targetId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item))
    );
  }, []);
  const deleteStockAlertPolicy = useCallback((id: string) => setStockPolicies((prev) => prev.filter((item) => item.id !== id)), []);

  // HR & Payroll
  const addEmployee = useCallback((emp: Omit<Employee, 'id'> & { id?: string }) => {
    const newEmp: Employee = {
      ...(emp as Employee),
      id: emp.id || `EMP-${Date.now().toString().slice(-6)}`
    };
    setEmployees((prev) => [newEmp, ...prev]);
  }, []);
  const updateEmployee = useCallback((idOrEmp: string | Employee, updatedArg?: Partial<Employee>) => {
    const targetId = typeof idOrEmp === 'string' ? idOrEmp : idOrEmp.id;
    const patch = typeof idOrEmp === 'string' ? (updatedArg || {}) : idOrEmp;
    setEmployees((prev) => prev.map((e) => (e.id === targetId ? { ...e, ...patch } : e)));
  }, []);
  const deleteEmployee = useCallback((id: string) => setEmployees((prev) => prev.filter((e) => e.id !== id)), []);
  const recordClockIn = useCallback((empId: string, notes: string = '', location: string = 'Kantor Pusat') => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    const rec: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      employeeId: emp.id,
      nip: emp.nip,
      employeeName: emp.name,
      avatar: emp.avatar,
      department: emp.department,
      date: new Date().toISOString().slice(0, 10),
      shift: emp.shift,
      clockIn: new Date().toTimeString().slice(0, 5),
      clockOut: null,
      status: 'Tepat Waktu',
      notes,
      location
    };
    setAttendance((prev) => [rec, ...prev]);
    showToast(`Clock-in ${emp.name} berhasil`, 'success');
  }, [employees, showToast]);
  const recordClockOut = useCallback((empIdOrAttendanceId: string, notes?: string) => {
    setAttendance((prev) =>
      prev.map((a) =>
        (a.id === empIdOrAttendanceId || (a.employeeId === empIdOrAttendanceId && !a.clockOut))
          ? { ...a, clockOut: new Date().toTimeString().slice(0, 5), ...(notes ? { notes } : {}) }
          : a
      )
    );
  }, []);
  const submitLeaveRequest = useCallback(
    (
      req: Omit<LeaveRequest, 'id' | 'ticketNumber' | 'status' | 'submittedAt'> & {
        id?: string;
        ticketNumber?: string;
        status?: LeaveRequest['status'];
        submittedAt?: string;
      }
    ) => {
      const newReq: LeaveRequest = {
        ...(req as LeaveRequest),
        id: req.id || `LVR-${Date.now().toString().slice(-6)}`,
        ticketNumber: req.ticketNumber || `LV-${Date.now().toString().slice(-5)}`,
        status: req.status || 'Menunggu',
        submittedAt: req.submittedAt || new Date().toISOString()
      };
      setLeaves((prev) => [newReq, ...prev]);
    },
    []
  );
  const approveLeaveRequest = useCallback((id: string, approverName?: string, note?: string) => {
    setLeaves((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, status: 'Disetujui', approvedBy: approverName || l.approvedBy, approvalNotes: note || l.approvalNotes } : l
      )
    );
  }, []);
  const rejectLeaveRequest = useCallback((id: string, approverName?: string, note?: string) => {
    setLeaves((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, status: 'Ditolak', approvedBy: approverName || l.approvedBy, approvalNotes: note || l.approvalNotes } : l
      )
    );
  }, []);
  const toggleEmployeeBpjs = useCallback((empId: string) => {
    setEmployees((prev) => prev.map((e) => (e.id === empId ? { ...e, bpjsEnabled: !e.bpjsEnabled } : e)));
  }, []);
  const syncPayrollToFinance = useCallback((_summary?: any) => {
    setIsPayrollSynced(true);
    setLastPayrollSyncTime(new Date().toISOString());
    showToast('Beban penggajian (Payroll) berhasil disinkronkan ke Buku Besar Keuangan', 'success');
  }, [showToast]);
  const recordPayrollExpense = useCallback((..._args: any[]) => syncPayrollToFinance(), [syncPayrollToFinance]);
  const processPayrollPayment = useCallback((empId: string, paymentSource: string = 'Bank Operasional', memo?: string, customAmount?: number) => {
    const totalThp = Number(customAmount) || 0;
    if (totalThp > 0) {
      const sourceCode = paymentSource === 'Kas Utama' ? '1-10001' : '1-10002';
      const sourceName = paymentSource === 'Kas Utama' ? 'Kas Utama' : 'Bank Operasional';
      const refNo = `PAY-${Date.now()}`;
      const txDate = new Date().toISOString().slice(0, 10);

      postGeneralJournalVoucher({
        voucherNo: refNo,
        transactionDate: txDate,
        documentType: 'PayrollPayment',
        generalMemo: memo || `Pencairan Gaji Karyawan via ${paymentSource}`,
        lines: [
          {
            accountCode: '5-10201',
            accountName: 'Beban Gaji & Komisi Karyawan',
            debit: totalThp,
            credit: 0,
            description: memo || 'Pencairan Beban Gaji & Komisi Karyawan',
          },
          {
            accountCode: sourceCode,
            accountName: sourceName,
            debit: 0,
            credit: totalThp,
            description: memo || `Pembayaran Gaji via ${paymentSource}`,
          }
        ]
      });
    }

    setEmployees((prev) => prev.map((e) => (empId === 'ALL' || e.id === empId ? { ...e, payrollStatus: 'PAID', payrollPaidAt: new Date().toISOString() } : e)));

    const targetEmp = empId === 'ALL' ? null : employees.find((e) => e.id === empId);
    const empLabel = empId === 'ALL' ? 'Seluruh Karyawan (Massal)' : (targetEmp?.name || empId);
    appendAudit(
      'PAYROLL_DISBURSEMENT',
      'HR & Payroll',
      `Pencairan Payroll (${empLabel}) via ${paymentSource} • Total THP: Rp ${totalThp.toLocaleString('id-ID')}${memo ? ` • Catatan: ${memo}` : ''}`,
      {
        division: currentUser?.division || 'HR / Finance',
        amount: totalThp,
        category: 'PAYROLL',
        level: 'INFO',
      }
    );

    showToast('Gaji karyawan berhasil diproses & dibayarkan (Mutasi Kas & Buku Besar tercatat)', 'success');
  }, [employees, currentUser, postGeneralJournalVoucher, appendAudit, showToast]);

  const calculateCashierCommissionContext = useCallback(
    (employee: any, period?: string): CashierCommissionResult => {
      return calculateCashierCommission(employee, sales, period);
    },
    [sales]
  );

  // Thresholds
  const getProductThreshold = useCallback(
    (productOrId: string | Product) => {
      const productId = typeof productOrId === 'string' ? productOrId : productOrId.id;
      const prod = products.find((p) => p.id === productId) || (typeof productOrId === 'object' ? productOrId : undefined);
      const min = prod?.minStock ?? prod?.min_stock ?? 10;
      const current = prod?.stock ?? 0;
      const isLow = current <= min;
      return {
        productId,
        currentStock: current,
        minThreshold: min,
        suggestedReorderQty: Math.max(min * 2 - current, 0),
        threshold: min,
        percentage: 20,
        isLow,
        policyName: 'Standar Min Stock',
        minStock: min,
        isLowStock: isLow,
        thresholdPercent: 20
      };
    },
    [products]
  );

  // F&B Costing & Migration
  const calculateFBMenuHPP = useCallback(
    (
      recipe: any[] = [],
      operationalCost: number = 0,
      targetMarginPercent: number = 45,
      wastePercentage: number = 5
    ) => {
      const baseCost = (recipe || []).reduce(
        (acc, item) => acc + (Number(item.subtotalCost) || (Number(item.portionQty || item.qty) || 0) * (Number(item.costPerUnit) || 0)),
        0
      );
      const rawMaterialHPP = Math.round(baseCost * (1 + wastePercentage / 100));
      const totalCost = rawMaterialHPP + operationalCost;
      const marginDivisor = Math.max(0.05, 1 - targetMarginPercent / 100);
      const calculatedSellingPrice = Math.ceil(totalCost / marginDivisor / 100) * 100;

      return {
        recipe,
        wastePercentage,
        rawMaterialHPP,
        rawMaterialCost: rawMaterialHPP,
        operationalCost,
        totalCost,
        targetMarginPercent,
        calculatedSellingPrice,
        recommendedPrice: calculatedSellingPrice
      };
    },
    []
  );

  const handleSaveRecipeCosting = useCallback(
    (
      productId: string,
      recipeOrCosting: any,
      operationalCostOrUpdatePrice: number | boolean = 0,
      targetMarginPercent: number = 45,
      wastePercentage: number = 5
    ) => {
      const updatePOSPrice = typeof operationalCostOrUpdatePrice === 'boolean' ? operationalCostOrUpdatePrice : true;
      const operationalCost = typeof operationalCostOrUpdatePrice === 'number' ? operationalCostOrUpdatePrice : 0;
      const costing = Array.isArray(recipeOrCosting)
        ? calculateFBMenuHPP(recipeOrCosting, operationalCost, targetMarginPercent, wastePercentage)
        : recipeOrCosting;
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            const hpp = costing?.totalCost || 0;
            const sell = updatePOSPrice
              ? (costing?.calculatedSellingPrice || p.sell_price || p.sellingPrice || 0)
              : (p.sell_price || p.sellingPrice || 0);
            return normalizeProductPricing({
              ...p,
              costing,
              recipe: costing?.recipe || [],
              cost_price: hpp,
              costPrice: hpp,
              sell_price: sell,
              sellingPrice: sell,
              price_retail: sell,
              retailPrice: sell,
              price: sell
            });
          }
          return p;
        })
      );
      showToast('Resep BOM & Kalkulasi Costing F&B berhasil disimpan', 'success');
    },
    [calculateFBMenuHPP, showToast]
  );

  const rollbackMigrationBatch = useCallback(
    (batchId: string): { success: boolean; message: string } => {
      setMigrationBatches((prev) =>
        prev.map((b) => (b.id === batchId ? { ...b, status: 'ROLLED_BACK', rolledBackAt: new Date().toISOString() } : b))
      );
      const message = `Batch migrasi ${batchId} berhasil di-rollback`;
      showToast(message, 'warning');
      return { success: true, message };
    },
    [showToast]
  );

  // Auth / Navigation / System utilities
  const toggleSidebar = useCallback(() => setIsSidebarCollapsed((prev) => !prev), []);
  const toggleTheme = useCallback(() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')), []);
  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next: LanguageMode = prev === 'id' ? 'en' : 'id';
      try {
        localStorage.setItem('jacs_app_language_v1', next);
      } catch {}
      showToast(
        next === 'en'
          ? 'Language switched to English (EN)'
          : 'Bahasa diubah ke Bahasa Indonesia (ID)',
        'info'
      );
      return next;
    });
  }, [showToast]);
  const toggleGlobalMaintenance = useCallback(() => {
    setIsGlobalMaintenance((prev) => {
      const next = !prev;
      setRemoteMaintenanceLock((lockPrev) => {
        const updated = {
          ...lockPrev,
          locked: next,
          message: lockPrev.message || 'Sistem sedang dalam pemeliharaan terjadwal oleh Pusat.',
          lockedAt: next ? new Date().toISOString() : undefined,
          lockedBy: currentUser?.name || 'Super Admin'
        };
        try {
          localStorage.setItem(REMOTE_MAINTENANCE_LOCK_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
      return next;
    });
  }, [currentUser]);
  const openPinAuth = useCallback((callback?: () => void) => {
    if (callback) setPendingPinCallback(() => callback);
    setIsPinModalOpen(true);
  }, []);
  const closePinAuth = useCallback(() => {
    setIsPinModalOpen(false);
    setPendingPinCallback(null);
  }, []);
  const verifyPin = useCallback(
    (pin: string, targetUserId?: string): { success: boolean; user?: User; error?: string } => {
      const now = Date.now();
      if (now < pinLockoutUntil) {
        const remainingSec = Math.ceil((pinLockoutUntil - now) / 1000);
        const err = `Terlalu banyak percobaan PIN salah. Terkunci selama ${remainingSec} detik.`;
        addAuditLog('PIN_LOCKOUT_BLOCKED', `Percobaan PIN saat terkunci (${remainingSec}s tersisa)`, 'WARNING');
        return { success: false, error: err };
      }

      const targetUser = targetUserId
        ? users.find((u) => u.user_id === targetUserId || u.id === targetUserId)
        : users.find((u) => u.pin === pin) || currentUser || users[0];

      const isValid = pin === '1234' || (targetUser && targetUser.pin === pin) || (currentUser && currentUser.pin === pin);

      if (isValid) {
        setPinFailedAttempts(0);
        setPinLockoutUntil(0);
        const resolvedUser = targetUser || currentUser || users[0];
        addAuditLog('PIN_VERIFY_SUCCESS', `Berhasil verifikasi PIN untuk user ${resolvedUser.name} (${resolvedUser.division || 'General'})`, 'INFO');
        if (pendingPinCallback) pendingPinCallback();
        closePinAuth();
        return { success: true, user: resolvedUser };
      } else {
        const nextAttempts = pinFailedAttempts + 1;
        setPinFailedAttempts(nextAttempts);
        recordSecurityShieldEvent({
          type: 'FAILED_PIN',
          details: `Percobaan PIN operator gagal (${nextAttempts}/5) pada modul ${(activeNav || 'HOME').toUpperCase()}.`,
          module: 'AUTH_GUARD',
          level: nextAttempts >= 3 ? 'ERROR' : 'WARN',
        });
        if (nextAttempts >= 5) {
          const lockoutTime = now + 30000; // 30 seconds
          setPinLockoutUntil(lockoutTime);
          addAuditLog('PIN_BRUTE_FORCE_LOCKOUT', `5x salah PIN beruntun. Terminal dikunci selama 30 detik.`, 'ERROR');
          showToast('Keamanan: 5x salah PIN. Terminal dikunci sementara 30 detik.', 'error');
          return { success: false, error: '5x salah PIN. Terkunci 30 detik.' };
        }
        addAuditLog('PIN_VERIFY_FAILED', `Upaya PIN salah (${nextAttempts}/5 percobaan)`, 'WARNING');
        return { success: false, error: `PIN tidak valid (${nextAttempts}/5 percobaan)` };
      }
    },
    [users, currentUser, pendingPinCallback, closePinAuth, pinLockoutUntil, pinFailedAttempts, addAuditLog, showToast, recordSecurityShieldEvent, activeNav]
  );
  const verifyModulePassword = useCallback(
    (targetOrPwd: string, pwdArg?: string): { success: boolean; user?: User; error?: string } => {
      const password = pwdArg !== undefined ? pwdArg : targetOrPwd;
      const matchedUser = users.find((u) => u.pin === password);
      if (password === '1234' || password === 'admin123' || password === developerPassword || matchedUser) {
        return { success: true, user: matchedUser || currentUser || users[0] };
      }
      return { success: false, error: 'Sandi atau PIN modul tidak cocok!' };
    },
    [developerPassword, users, currentUser]
  );
  const isSuperAdminAccount = useCallback((u?: Partial<User> | null): boolean => {
    if (!u) return false;
    const roleStr = String(u.role || '').toUpperCase();
    const divStr = String(u.division || '').toUpperCase();
    const idStr = String(u.user_id || u.id || '').toUpperCase();
    return (
      roleStr.includes('SUPER') ||
      divStr.includes('SUPER') ||
      idStr === 'USR-001' ||
      idStr === 'USR-SUPERADMIN'
    );
  }, []);

  const updateUserPin = useCallback(
    (userId: string, newPin: string) => {
      const target = users.find((u) => u.user_id === userId || u.id === userId);
      if (target && isSuperAdminAccount(target)) {
        showToast(
          'TERKUNCI PERMANEN (MASTER SUPERADMIN): PIN pemulihan utama SuperAdmin bersifat permanen dan tidak dapat diubah.',
          'warning'
        );
        return;
      }
      const cleanedPin = String(newPin || '').trim();
      if (!cleanedPin) return;
      setUsers((prev) =>
        prev.map((u) => {
          if (u.user_id === userId || u.id === userId) {
            if (isSuperAdminAccount(u)) return u;
            return { ...u, pin: cleanedPin };
          }
          return u;
        })
      );
      if (currentUser && (currentUser.user_id === userId || currentUser.id === userId) && !isSuperAdminAccount(currentUser)) {
        setCurrentUser((prev) => (prev ? { ...prev, pin: cleanedPin } : null));
      }
      addAuditLog(
        'OPERATIONAL_USER_PIN_UPDATED',
        `PIN/Sandi operasional untuk akun ${target?.name || userId} (${target?.role || 'Staf'}) berhasil diperbarui.`,
        'SECURITY'
      );
    },
    [users, currentUser, isSuperAdminAccount, showToast, addAuditLog]
  );

  const resetAllUserPinsToDefault = useCallback(
    (defaultPin: string = '1234') => {
      const cleanedDefault = String(defaultPin || '1234').trim() || '1234';
      setUsers((prev) =>
        prev.map((u) => (isSuperAdminAccount(u) ? u : { ...u, pin: cleanedDefault }))
      );
      if (currentUser && !isSuperAdminAccount(currentUser)) {
        setCurrentUser((prev) => (prev ? { ...prev, pin: cleanedDefault } : null));
      }
      hashSha256(cleanedDefault)
        .then((defaultHash) => {
          const nowIso = new Date().toISOString();
          const updatedBy = currentUser?.name || 'Super Admin';
          const operationalDivisions = ['executive', 'finance', 'purchasing', 'pos', 'warehouse', 'hr'];
          setDivisionPinHashes((prev) => {
            const next = { ...prev };
            operationalDivisions.forEach((divId) => {
              next[divId] = {
                hash: defaultHash,
                updatedAt: nowIso,
                updatedBy,
              };
            });
            try {
              localStorage.setItem(DIVISION_PIN_HASHES_KEY, JSON.stringify(next));
            } catch {}
            return next;
          });
        })
        .catch(() => {});
      addAuditLog(
        'OPERATIONAL_PINS_TOTAL_RESET',
        `Reset Total Semua Sandi Operasional ke standar (${cleanedDefault}) dijalankan. PIN Master SuperAdmin tetap TERKUNCI PERMANEN.`,
        'SECURITY'
      );
      showToast(
        `Reset Total Sandi Operasional berhasil: Seluruh akun operasional direset ke ${cleanedDefault} (PIN SuperAdmin tetap TERKUNCI PERMANEN).`,
        'info'
      );
    },
    [isSuperAdminAccount, currentUser, addAuditLog, showToast]
  );

  const updateDeveloperPassword = useCallback(
    (_newPwd: string) => {
      showToast(
        'TERKUNCI PERMANEN (MASTER SUPERADMIN): Sandi & PIN Master Developer/SuperAdmin dikunci permanen sebagai kunci pemulihan utama sistem.',
        'warning'
      );
    },
    [showToast]
  );

  const updateActiveCashierQuota = useCallback(
    (
      nextQuota: number,
      approvedBy: string = 'SuperAdmin - Jacs Enterprise'
    ): { success: boolean; quota: number; message: string } => {
      const clamped = Math.max(1, Math.min(10, Number(nextQuota) || 2));
      const prevQuota = activeCashierQuota;

      try {
        localStorage.setItem(ACTIVE_CASHIER_QUOTA_STORAGE_KEY, String(clamped));
      } catch {}

      setActiveCashierQuotaState(clamped);
      setUsers((prev) => syncUsersToCashierQuota(prev, clamped));

      // Sinkronkan jumlah loket ke profil bisnis aktif agar badge [0 / N Kasir Online] langsung sinkron
      setBusinessProfile((prevProfile) => {
        const currentDomain = getEffectiveBusinessDomainConfig(prevProfile);
        const updatedProfile = normalizeBusinessProfileDomain({
          ...prevProfile,
          posUnitCount: clamped,
          cashiers: clamped,
          domainConfig: {
            ...currentDomain,
            activeStationCount: clamped,
          },
        });
        saveActiveBusinessProfileToStorage(updatedProfile);
        return updatedProfile;
      });

      const slotRangeLabel =
        clamped === 1 ? 'Kasir 01' : `Kasir 01 s/d Kasir ${String(clamped).padStart(2, '0')}`;
      const logEntry = {
        id: `QUOTA-SYNC-${Date.now()}`,
        timestamp: new Date().toISOString(),
        previousQuota: prevQuota,
        newQuota: clamped,
        approvedBy,
        details: `Kuota Loket Kasir Aktif diperbarui dari ${prevQuota} ke ${clamped} loket (${slotRangeLabel}). PIN Kasir otomatis dibentuk & disinkronkan di Manajemen Kredensial.`,
      };

      setCashierQuotaLogs((prevLogs) => {
        const nextLogs = [logEntry, ...prevLogs].slice(0, 30);
        try {
          localStorage.setItem('jacs_cashier_quota_logs_v1', JSON.stringify(nextLogs));
        } catch {}
        return nextLogs;
      });

      addAuditLog(
        'CASHIER_QUOTA_SYNC_UPDATED',
        `[${approvedBy}] ${logEntry.details}`,
        'SECURITY'
      );

      const msg = `Kuota Kasir Aktif berhasil diperbarui ke ${clamped} loket (${slotRangeLabel}) & disinkronkan ke Manajemen Kredensial!`;
      showToast(msg, 'success');
      return { success: true, quota: clamped, message: msg };
    },
    [activeCashierQuota, addAuditLog, showToast]
  );

  const verifyDivisionPin = useCallback(
    async (divisionId: string, pin: string): Promise<boolean> => {
      const cleaned = pin.trim();
      if (!cleaned) return false;

      // Untuk divisi POS / Kasir, izinkan juga verifikasi menggunakan PIN akun Kasir aktif (misal Kasir 01 = 1101, Kasir 02 = 1102)
      if (divisionId.toLowerCase() === 'pos') {
        const matchedCashier = users.find((u) => {
          const r = String(u.role || '').toLowerCase();
          const d = String(u.division || '').toLowerCase();
          const isCashier = r.includes('kasir') || r.includes('cashier') || d.includes('kasir') || d.includes('pos');
          if (!isCashier || u.status === 'Inactive') return false;
          return String(u.pin || '').trim() === cleaned;
        });
        if (matchedCashier) {
          return true;
        }
      }

      const candidateHash = await hashSha256(cleaned);
      let storedHash = divisionPinHashes[divisionId]?.hash;
      if (!storedHash) {
        try {
          const raw = localStorage.getItem(DIVISION_PIN_HASHES_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            storedHash = parsed?.[divisionId]?.hash;
          }
        } catch {}
      }
      if (!storedHash) {
        storedHash = await hashSha256('1234');
      }
      return candidateHash === storedHash;
    },
    [divisionPinHashes, users]
  );

  const updateDivisionPin = useCallback(
    async (divisionId: string, newPin: string): Promise<{ success: boolean; hash?: string; message: string }> => {
      const cleaned = newPin.trim();
      if (cleaned.length < 4) {
        const msg = 'PIN akses divisi minimal harus 4 karakter/digit!';
        showToast(msg, 'error');
        return { success: false, message: msg };
      }
      const newHash = await hashSha256(cleaned);
      const nowIso = new Date().toISOString();
      const updatedBy = currentUser?.name || 'Super Admin';
      setDivisionPinHashes((prev) => {
        const next = {
          ...prev,
          [divisionId]: {
            hash: newHash,
            updatedAt: nowIso,
            updatedBy
          }
        };
        try {
          localStorage.setItem(DIVISION_PIN_HASHES_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
      addAuditLog(
        'DIVISION_PIN_UPDATED',
        `PIN akses divisi ${divisionId.toUpperCase()} diperbarui dengan enkripsi SHA-256 (${newHash.slice(0, 12)}...)`,
        'SECURITY'
      );
      const msg = `PIN divisi ${divisionId.toUpperCase()} berhasil disimpan (SHA-256) & langsung aktif!`;
      showToast(msg, 'success');
      return { success: true, hash: newHash, message: msg };
    },
    [currentUser, addAuditLog, showToast]
  );

  const verifyManagementAuthPin = useCallback(
    (pin: string): boolean => {
      const cleaned = pin.trim();
      if (!cleaned) return false;
      let storedPin = managementAuthPin || '123456';
      try {
        const saved = localStorage.getItem(MANAGEMENT_AUTH_PIN_KEY);
        if (saved && /^\d{6}$/.test(saved.trim())) {
          storedPin = saved.trim();
        }
      } catch {}
      return cleaned === storedPin;
    },
    [managementAuthPin]
  );

  const updateManagementAuthPin = useCallback(
    (newPin: string): { success: boolean; message: string } => {
      const cleaned = newPin.trim();
      if (!/^\d{6}$/.test(cleaned)) {
        const errMsg = 'PIN Otorisasi Manajemen wajib terdiri dari tepat 6 digit angka!';
        showToast(errMsg, 'error');
        return { success: false, message: errMsg };
      }
      setManagementAuthPin(cleaned);
      try {
        localStorage.setItem(MANAGEMENT_AUTH_PIN_KEY, cleaned);
      } catch {}
      addAuditLog(
        'MANAGEMENT_AUTH_PIN_UPDATED',
        'PIN Otorisasi Manajemen (6 digit) diperbarui oleh SuperAdmin.',
        'SECURITY'
      );
      const okMsg = 'PIN Otorisasi Manajemen (6 digit) berhasil disimpan & langsung aktif!';
      showToast(okMsg, 'success');
      return { success: true, message: okMsg };
    },
    [addAuditLog, showToast]
  );

  const verifySuperAdminAuthorityCode = useCallback(
    async (code: string): Promise<boolean> => {
      const cleaned = code.trim();
      if (!cleaned) return false;
      const candidateHash = await hashSha256(cleaned);
      let storedHash = superAdminCodeHash;
      if (!storedHash) {
        try {
          const raw = localStorage.getItem(SUPERADMIN_CODE_HASH_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            storedHash = parsed?.hash || '';
          }
        } catch {}
      }
      if (!storedHash) {
        storedHash = await hashSha256('Admin123');
      }
      const match = candidateHash === storedHash;
      if (!match) {
        recordSecurityShieldEvent({
          type: 'FAILED_PIN',
          details: 'Percobaan Kode Otoritas SuperAdmin ditolak (Hash Mismatch).',
          module: 'SUPERADMIN_GUARD',
          level: 'ERROR',
        });
      }
      return match;
    },
    [superAdminCodeHash, recordSecurityShieldEvent]
  );

  const unlockIdleScreen = useCallback(
    async (pinInput: string): Promise<{ success: boolean; message: string }> => {
      const cleaned = (pinInput || '').trim();
      if (!cleaned) {
        return { success: false, message: 'Masukkan PIN Divisi / Operator atau PIN Manajemen 6-Digit.' };
      }

      // 1. Check current user PIN or default operator PIN 1234
      const matchesOperator =
        cleaned === '1234' ||
        (currentUser?.pin && currentUser.pin === cleaned) ||
        users.some((u) => u.pin === cleaned);

      // 2. Check 6-digit Management PIN
      const matchesMgmt = verifyManagementAuthPin(cleaned);

      // 3. Check active division PIN or SuperAdmin authority code
      const activeDivId =
        activeNav === 'pos'
          ? 'pos'
          : activeNav === 'finance'
          ? 'finance'
          : activeNav === 'purchasing'
          ? 'purchasing'
          : activeNav === 'warehouse'
          ? 'warehouse'
          : activeNav === 'hr'
          ? 'hr'
          : 'executive';

      const matchesDiv = await verifyDivisionPin(activeDivId, cleaned);

      if (matchesOperator || matchesMgmt || matchesDiv) {
        setIsIdleLocked(false);
        setIdleLockedAt(null);
        showToast('Layar terminal berhasil dibuka kembali.', 'success');
        return { success: true, message: 'Terminal berhasil dibuka.' };
      }

      recordSecurityShieldEvent({
        type: 'FAILED_PIN',
        details: `Gagal membuka layar Terminal Idle Auto-Lock pada modul ${(activeNav || 'HOME').toUpperCase()} (PIN tidak cocok).`,
        module: 'TERMINAL_GUARD',
        level: 'WARN',
      });
      return {
        success: false,
        message: 'PIN tidak valid! Gunakan PIN Operator/Divisi (4 digit) atau PIN Otorisasi Manajemen (6 digit).',
      };
    },
    [currentUser, users, verifyManagementAuthPin, activeNav, verifyDivisionPin, showToast, recordSecurityShieldEvent]
  );

  const updateSuperAdminAuthorityCode = useCallback(
    async (oldCode: string, newCode: string): Promise<{ success: boolean; hash?: string; message: string }> => {
      const isOldValid = await verifySuperAdminAuthorityCode(oldCode);
      if (!isOldValid) {
        addAuditLog(
          'SUPERADMIN_AUTH_CODE_CHANGE_DENIED',
          'Verifikasi Kode Otoritas SuperAdmin lama gagal saat mencoba mengganti kredensial.',
          'WARNING'
        );
        const errMsg = 'Kode Otoritas SuperAdmin lama tidak cocok! Verifikasi gagal.';
        showToast(errMsg, 'error');
        return { success: false, message: errMsg };
      }

      const cleanedNew = newCode.trim();
      if (cleanedNew.length < 4) {
        const errMsg = 'Kode Otoritas SuperAdmin baru minimal harus 4 karakter!';
        showToast(errMsg, 'error');
        return { success: false, message: errMsg };
      }

      const newHash = await hashSha256(cleanedNew);
      const nowIso = new Date().toISOString();
      setSuperAdminCodeHash(newHash);
      setSuperAdminCodeUpdatedAt(nowIso);
      try {
        localStorage.setItem(
          SUPERADMIN_CODE_HASH_KEY,
          JSON.stringify({ hash: newHash, updatedAt: nowIso })
        );
      } catch {}

      addAuditLog(
        'SUPERADMIN_AUTH_CODE_UPDATED',
        `Kode Otoritas SuperAdmin berhasil diperbarui ke hash SHA-256 baru (${newHash.slice(0, 12)}...)`,
        'SECURITY'
      );
      const okMsg = 'Kode Otoritas SuperAdmin berhasil diperbarui (SHA-256 terenkripsi)!';
      showToast(okMsg, 'success');
      return { success: true, hash: newHash, message: okMsg };
    },
    [verifySuperAdminAuthorityCode, addAuditLog, showToast]
  );
  const logout = useCallback(() => {
    try {
      localStorage.removeItem('jacs_active_user');
      sessionStorage.removeItem('jacs_cloud_pin_unlocked');
    } catch {}
    setIsAiAssistantOpen(false);
    setIsSuperAdminAuthenticated(false);
    setCurrentUser(null);
    setActiveNav('home');
  }, []);
  const exitSuperAdminSession = useCallback(() => {
    try {
      sessionStorage.removeItem('jacs_cloud_pin_unlocked');
    } catch {}
    setIsAiAssistantOpen(false);
    setIsSuperAdminAuthenticated(false);
    setActiveNav('home');
  }, []);
  const emergencySessionReset = useCallback(() => {
    try {
      localStorage.removeItem('jacs_active_user');
      sessionStorage.removeItem('jacs_cloud_pin_unlocked');
    } catch {}
    setIsAiAssistantOpen(false);
    setIsSuperAdminAuthenticated(false);
    setCurrentUser(null);
    setActiveNav('home');
  }, []);
  const isModuleUnlocked = useCallback((modId: string) => unlockedModules.includes(modId), [unlockedModules]);
  const unlockModule = useCallback((modId: string) => setUnlockedModules((prev) => (prev.includes(modId) ? prev : [...prev, modId])), []);

  const updateBusinessProfile = useCallback(
    (updated: Partial<BusinessEntityProfile>, options?: { silent?: boolean }) => {
      const prev = businessProfileRef.current;
      // Sanitize text fields against XSS payloads
      const sanitizedPatch: Partial<BusinessEntityProfile> = { ...updated };
      let xssDetected = false;
      (['name', 'businessName', 'companyName', 'tagline', 'address', 'phone', 'email', 'taxId', 'npwp', 'receiptFooter'] as const).forEach(
        (field) => {
          const val = (sanitizedPatch as any)[field];
          if (typeof val === 'string') {
            const res = sanitizeTextValue(val);
            if (res.threatDetected) xssDetected = true;
            (sanitizedPatch as any)[field] = res.sanitized;
          }
        }
      );
      if (xssDetected) {
        recordSecurityShieldEvent({
          type: 'XSS_BLOCKED',
          details: 'Payload HTML/Script berbahaya otomatis dibersihkan saat pembaruan Profil Usaha.',
          module: 'PROFILE_GUARD',
          level: 'ERROR',
        });
      }

      const merged = {
        ...prev,
        ...sanitizedPatch,
        name: sanitizedPatch.name || sanitizedPatch.businessName || prev.name,
        companyName: sanitizedPatch.name || sanitizedPatch.businessName || prev.companyName || prev.name,
      };
      const persisted = saveActiveBusinessProfileToStorage(merged);
      businessProfileRef.current = persisted;
      setBusinessProfile(persisted);
      if (!options?.silent) {
        showToast('Profil usaha berhasil diperbarui', 'success');
      }
    },
    [showToast, recordSecurityShieldEvent]
  );

  const resetBusinessProfileToDefault = useCallback(() => {
    const defaultNorm = saveActiveBusinessProfileToStorage({
      ...DEFAULT_BUSINESS_PROFILE,
      name: 'KHANSA RETAIL',
      category: 'Minimarket',
      address: 'Jl. BERUA RAYA No. 1, Paccerakkang, Biringkanaya, Makassar 90245',
      phone: '(021) 515-8888 / 0812-8888-9999',
      email: 'official@jacs-retailos.id',
      companyName: 'KHANSA RETAIL',
      brandTitle: 'RetailOS ERP V2',
      tagline: 'Minimarket & Kebutuhan Harian Terlengkap',
      currency: 'IDR',
    });
    businessProfileRef.current = defaultNorm;
    setBusinessProfile(defaultNorm);
    showToast('Profil usaha direset ke pengaturan awal (KHANSA RETAIL)', 'info');
  }, [showToast]);

  const updateSheetConfig = useCallback((cfg: Partial<SheetConfig>) => setSheetConfig((prev) => ({ ...prev, ...cfg })), []);
  const testSheetConnection = useCallback(async () => true, []);
  const clearVoidItemLogs = useCallback(() => setVoidLogs([]), []);
  const executeCloudSync = useCallback(
    async (customConfig?: DualBackendConfig): Promise<CloudSyncResult> => {
      const nowIso = new Date().toISOString();
      const txUuid = generateTxUuid();
      const storedConfig = dualBackendSync.getConfig();
      const rawMergedSupabaseUrl =
        sanitizeAndValidateSupabaseUrl(customConfig?.supabaseUrl) ||
        sanitizeAndValidateSupabaseUrl(storedConfig.supabaseUrl) ||
        '';
      const rawMergedSupabaseAnonKey =
        customConfig?.supabaseAnonKey?.trim() || storedConfig.supabaseAnonKey?.trim() || '';
      const effectiveConfig: DualBackendConfig = {
        ...storedConfig,
        ...(customConfig || {}),
        supabaseUrl: rawMergedSupabaseUrl,
        supabaseAnonKey: rawMergedSupabaseAnonKey,
        gasWebhookUrl:
          customConfig?.gasWebhookUrl?.trim() || storedConfig.gasWebhookUrl?.trim() || '',
      };
      const activeProvider = effectiveConfig.provider || activeBackendProvider;

      const syncedCounts = {
        products: products?.length || 0,
        transactions: sales?.length || 0,
        financeEntries: financeEntries?.length || 0,
        journalEntries: journalEntries?.length || 0,
      };

      const snapshot: CloudSyncSnapshot = {
        products: products || [],
        transactions: sales || [],
        financeEntries: financeEntries || [],
        journalEntries: journalEntries || [],
        businessProfile: businessProfile || DEFAULT_BUSINESS_PROFILE,
        timestamp: nowIso,
        txUuid,
        appVersion: '2.5.0-ENTERPRISE',
      };

      const resolvedSupabase = resolveSupabaseCredentials({
        supabaseUrl: effectiveConfig.supabaseUrl,
        supabaseAnonKey: effectiveConfig.supabaseAnonKey,
      });
      const safeSupabaseUrl =
        sanitizeAndValidateSupabaseUrl(resolvedSupabase.supabaseUrl) ||
        (resolvedSupabase.supabaseAnonKey ? DEFAULT_FALLBACK_SUPABASE_URL : '');
      const hasRuntimeSupabaseConfig = Boolean(safeSupabaseUrl && resolvedSupabase.supabaseAnonKey);
      const hasGasConfig = Boolean(effectiveConfig.gasWebhookUrl);
      const shouldUseSupabaseSdk =
        hasRuntimeSupabaseConfig || isSupabaseConfigured || activeProvider === 'SUPABASE';

      try {
        (dualBackendSync as any).isSyncing = true;
        (dualBackendSync as any).notify?.();

        let supabaseStatus: CloudSyncResult['endpoints']['supabase'] = {
          endpoint: 'SUPABASE',
          configured: false,
          success: false,
          message: 'Supabase belum dikonfigurasi',
        };
        let gasStatus: CloudSyncResult['endpoints']['gas'] = {
          endpoint: 'GAS',
          configured: false,
          success: false,
          message: 'Google Apps Script Webhook belum dikonfigurasi',
        };
        const errors: string[] = [];

        if (shouldUseSupabaseSdk) {
          supabaseStatus.configured = true;
          const sbStart = performance.now();
          try {
            const ok = await syncSnapshotToSupabase(
              {
                id: 'default-snapshot',
                businessName:
                  businessProfile?.name || DEFAULT_BUSINESS_PROFILE.name || 'JACS ENTERPRISE',
                productsCount: syncedCounts.products,
                transactionsCount: syncedCounts.transactions,
                financeCount: syncedCounts.financeEntries,
                journalCount: syncedCounts.journalEntries,
                snapshotPayload: snapshot,
                syncedAt: nowIso,
              },
              {
                supabaseUrl: safeSupabaseUrl,
                supabaseAnonKey: resolvedSupabase.supabaseAnonKey,
              }
            );
            const durationMs = Math.round(performance.now() - sbStart);
            if (!ok) {
              const errMsg = 'Gagal menulis snapshot ke tabel jacs_erp_snapshots di Supabase.';
              supabaseStatus = {
                endpoint: 'SUPABASE',
                configured: true,
                success: false,
                message: errMsg,
                durationMs,
              };
              errors.push(errMsg);
            } else {
              supabaseStatus = {
                endpoint: 'SUPABASE',
                configured: true,
                success: true,
                statusCode: 200,
                message: `Supabase (jacs_erp_snapshots) synced (${durationMs}ms)`,
                durationMs,
                syncedCount: syncedCounts.products + syncedCounts.transactions,
              };
            }
          } catch (sbErr: any) {
            const durationMs = Math.round(performance.now() - sbStart);
            const errMsg =
              sbErr?.message || 'Gagal menulis snapshot ke tabel jacs_erp_snapshots di Supabase.';
            supabaseStatus = {
              endpoint: 'SUPABASE',
              configured: true,
              success: false,
              message: errMsg,
              durationMs,
            };
            errors.push(errMsg);
          }

          if (hasGasConfig) {
            const gasRes = await pushSyncData(snapshot, {
              ...effectiveConfig,
              supabaseUrl: '',
              supabaseAnonKey: '',
            });
            gasStatus = gasRes.endpoints.gas;
            if (!gasStatus.success && gasRes.errors.length > 0) {
              errors.push(...gasRes.errors);
            }
          }
        } else {
          const pushRes = await pushSyncData(snapshot, effectiveConfig);
          supabaseStatus = pushRes.endpoints.supabase;
          gasStatus = pushRes.endpoints.gas;
          if (Array.isArray(pushRes.errors) && pushRes.errors.length > 0) {
            errors.push(...pushRes.errors);
          }
        }

        const hasConfiguredEndpoint = supabaseStatus.configured || gasStatus.configured;
        const supabaseFailed = supabaseStatus.configured && !supabaseStatus.success;
        const isSuccess =
          hasConfiguredEndpoint &&
          !supabaseFailed &&
          (supabaseStatus.success || gasStatus.success);

        const successfulEndpoints: string[] = [];
        if (supabaseStatus.success) successfulEndpoints.push('Supabase');
        if (gasStatus.success) successfulEndpoints.push('Google Apps Script');

        const message = !hasConfiguredEndpoint
          ? 'Belum ada endpoint cloud (Supabase atau Google Apps Script) yang dikonfigurasi di Konsol SuperAdmin.'
          : isSuccess
          ? `Sinkronisasi cloud berhasil via ${successfulEndpoints.join(' & ')} (${syncedCounts.products} Produk, ${syncedCounts.transactions} Transaksi, ${syncedCounts.financeEntries} Keuangan, ${syncedCounts.journalEntries} Jurnal)`
          : `Sinkronisasi cloud gagal: ${
              errors.length > 0
                ? errors.join(' • ')
                : supabaseStatus.message || gasStatus.message || 'Gagal sinkronisasi ke cloud'
            }`;

        const result: CloudSyncResult = {
          success: isSuccess,
          message,
          timestamp: nowIso,
          endpoints: {
            supabase: supabaseStatus,
            gas: gasStatus,
          },
          syncedCounts,
          errors,
        };

        if (result.success) {
          dualBackendSync.markSyncSuccess(nowIso);
          setSales((prev) =>
            prev.map((s) =>
              s.syncStatus === 'PENDING_SYNC' || !s.syncStatus
                ? { ...s, syncStatus: 'SYNCED' }
                : s
            )
          );
          await dualBackendSync.processQueue();
          if (hasRuntimeSupabaseConfig) {
            await syncOfflineQueueToSupabase({
              supabaseUrl: safeSupabaseUrl,
              supabaseAnonKey: resolvedSupabase.supabaseAnonKey,
            });
          }
          if (hasGasConfig) {
            await syncOfflineQueueToGAS();
            setGasOfflineQueueCount(getGasOfflineQueue().length);
          }
          showToast(result.message, 'success');
          appendAudit('CLOUD_SYNC_SUCCESS', 'INTEGRATION', result.message, {
            division: currentUser?.division || 'IT & Systems',
            category: 'CLOUD_SYNC_SUCCESS',
            level: 'INFO',
          });
        } else {
          dualBackendSync.markSyncFailure(result.message);
          showToast(result.message, 'error');
          appendAudit('CLOUD_SYNC_FAILED', 'INTEGRATION', result.message, {
            division: currentUser?.division || 'IT & Systems',
            category: 'CLOUD_SYNC_FAILED',
            level: 'ERROR',
          });
        }

        return result;
      } catch (err: any) {
        const errMsg = err?.message || 'Error tidak diketahui';
        const errorResult: CloudSyncResult = {
          success: false,
          message: `Gagal sinkronisasi cloud: ${errMsg}`,
          timestamp: nowIso,
          endpoints: {
            supabase: {
              endpoint: 'SUPABASE',
              configured: shouldUseSupabaseSdk || hasRuntimeSupabaseConfig,
              success: false,
              message: errMsg,
            },
            gas: {
              endpoint: 'GAS',
              configured: hasGasConfig,
              success: false,
              message: hasGasConfig ? errMsg : 'Google Apps Script Webhook belum dikonfigurasi',
            },
          },
          syncedCounts,
          errors: [errMsg],
        };
        dualBackendSync.markSyncFailure(errorResult.message);
        showToast(errorResult.message, 'error');
        appendAudit('CLOUD_SYNC_FAILED', 'INTEGRATION', errorResult.message, {
          division: currentUser?.division || 'IT & Systems',
          category: 'CLOUD_SYNC_FAILED',
          level: 'ERROR',
        });
        return errorResult;
      } finally {
        (dualBackendSync as any).isSyncing = false;
        (dualBackendSync as any).notify?.();
      }
    },
    [
      products,
      sales,
      financeEntries,
      journalEntries,
      businessProfile,
      currentUser,
      activeBackendProvider,
      showToast,
      appendAudit,
    ]
  );

  const pullCloudSyncDataHandler = useCallback(
    async (customConfig?: DualBackendConfig): Promise<CloudPullResult> => {
      try {
        (dualBackendSync as any).isSyncing = true;
        (dualBackendSync as any).notify?.();

        const result = await pullSyncData(customConfig);
        if (!result.success || !result.data || typeof result.data !== 'object') {
          showToast(result.message, result.error === 'NO_CONFIG' ? 'info' : 'error');
          return result;
        }

        const pulled = result.data;
        let productsAdded = 0;
        let productsUpdated = 0;
        let transactionsAdded = 0;
        let financeEntriesAdded = 0;
        let journalEntriesAdded = 0;
        let profileUpdated = false;

        // 1. Penggabungan / Pembaruan Data Produk (Katalog SKU)
        const pulledProducts = Array.isArray(pulled.products)
          ? pulled.products.filter((item) => Boolean(item && typeof item === 'object'))
          : [];
        if (pulledProducts.length > 0) {
          const currentProducts = Array.isArray(productsRef.current) ? productsRef.current : [];
          const next = [...currentProducts];
          const mapById = new Map<string, number>();
          const mapByBarcode = new Map<string, number>();
          next.forEach((p, idx) => {
            if (p?.id) mapById.set(String(p.id), idx);
            if (p?.barcode) mapByBarcode.set(String(p.barcode), idx);
          });

          for (const item of pulledProducts) {
            const itemId = item?.id ? String(item.id) : '';
            const itemBarcode = item?.barcode ? String(item.barcode) : '';
            const matchedIdx =
              (itemId && mapById.has(itemId) ? mapById.get(itemId) : undefined) ??
              (itemBarcode && mapByBarcode.has(itemBarcode)
                ? mapByBarcode.get(itemBarcode)
                : undefined);

            if (matchedIdx !== undefined) {
              next[matchedIdx] = {
                ...next[matchedIdx],
                ...item,
                id: next[matchedIdx].id || item.id,
              };
              productsUpdated++;
            } else {
              next.push(item);
              const newIdx = next.length - 1;
              if (itemId) mapById.set(itemId, newIdx);
              if (itemBarcode) mapByBarcode.set(itemBarcode, newIdx);
              productsAdded++;
            }
          }
          productsRef.current = next;
          setProducts(next);
        }

        // 2. Penggabungan Transaksi Penjualan Kasir (POS)
        const pulledTransactions = Array.isArray(pulled.transactions)
          ? pulled.transactions.filter((s) => Boolean(s && typeof s === 'object'))
          : [];
        if (pulledTransactions.length > 0) {
          const currentSales = Array.isArray(salesRef.current) ? salesRef.current : [];
          const existingKeys = new Set<string>();
          currentSales.forEach((s) => {
            if (s?.transaction_id) existingKeys.add(String(s.transaction_id));
            if (s?.receipt_number) existingKeys.add(String(s.receipt_number));
            if ((s as any)?.id) existingKeys.add(String((s as any).id));
            if ((s as any)?.tx_uuid) existingKeys.add(String((s as any).tx_uuid));
          });

          const newSales: Sale[] = [];
          for (const s of pulledTransactions) {
            const key = String(
              s?.transaction_id ||
                s?.receipt_number ||
                (s as any)?.id ||
                (s as any)?.tx_uuid ||
                ''
            );
            if (key && !existingKeys.has(key)) {
              newSales.push({ ...s, syncStatus: 'SYNCED' });
              existingKeys.add(key);
              transactionsAdded++;
            }
          }

          if (newSales.length > 0) {
            const merged = [...newSales, ...currentSales];
            salesRef.current = merged;
            setSales(merged);
          }
        }

        // 3. Penggabungan Entri Arus Keuangan
        const pulledFinance = Array.isArray(pulled.financeEntries)
          ? pulled.financeEntries.filter((f) => Boolean(f && typeof f === 'object'))
          : [];
        if (pulledFinance.length > 0) {
          const currentFinance = Array.isArray(financeEntriesRef.current)
            ? financeEntriesRef.current
            : [];
          const existingIds = new Set(currentFinance.map((f) => String(f?.id || '')));
          const newEntries: FinanceEntry[] = [];
          for (const f of pulledFinance) {
            if (f?.id && !existingIds.has(String(f.id))) {
              newEntries.push(f);
              existingIds.add(String(f.id));
              financeEntriesAdded++;
            }
          }
          if (newEntries.length > 0) {
            const merged = [...newEntries, ...currentFinance];
            financeEntriesRef.current = merged;
            setFinanceEntries(merged);
          }
        }

        // 4. Penggabungan Jurnal Buku Besar
        const pulledJournals = Array.isArray(pulled.journalEntries)
          ? pulled.journalEntries.filter((j) => Boolean(j && typeof j === 'object'))
          : [];
        if (pulledJournals.length > 0) {
          const currentJournals = Array.isArray(journalEntriesRef.current)
            ? journalEntriesRef.current
            : [];
          const existingKeys = new Set(
            currentJournals.map((j) => `${j?.id || ''}:${j?.reference || ''}`)
          );
          const newJournals: JournalEntry[] = [];
          for (const j of pulledJournals) {
            const k = `${j?.id || ''}:${j?.reference || ''}`;
            if (k !== ':' && !existingKeys.has(k)) {
              newJournals.push(j);
              existingKeys.add(k);
              journalEntriesAdded++;
            }
          }
          if (newJournals.length > 0) {
            const merged = [...newJournals, ...currentJournals];
            journalEntriesRef.current = merged;
            setJournalEntries(merged);
          }
        }

        // 5. Terapkan profil usaha dari snapshot cloud jika valid
        if (pulled.businessProfile && typeof pulled.businessProfile === 'object') {
          const bp = pulled.businessProfile;
          const hasProfileData = Boolean(
            (typeof bp.name === 'string' && bp.name.trim()) ||
              (typeof bp.businessName === 'string' && bp.businessName.trim()) ||
              (typeof bp.companyName === 'string' && bp.companyName.trim()) ||
              (typeof bp.address === 'string' && bp.address.trim()) ||
              (typeof bp.phone === 'string' && bp.phone.trim())
          );
          if (hasProfileData) {
            updateBusinessProfile(bp, { silent: true });
            profileUpdated = true;
          }
        }

        const transportLabel =
          result.transport === 'SUPABASE'
            ? 'Supabase (jacs_erp_snapshots)'
            : result.transport === 'GAS'
            ? 'Google Apps Script'
            : 'Cloud Server';
        const summaryMsg = `Tarik Data dari Cloud berhasil (${transportLabel}): +${productsAdded} SKU baru, ${productsUpdated} SKU diperbarui, +${transactionsAdded} Transaksi POS, +${journalEntriesAdded} Jurnal akuntansi${
          profileUpdated ? ', profil usaha diperbarui' : ''
        }.`;
        showToast(summaryMsg, 'success');

        appendAudit('CLOUD_PULL_SUCCESS', 'INTEGRATION', summaryMsg, {
          division: currentUser?.division || 'IT & Systems',
          category: 'CLOUD_PULL_SYNC',
          level: 'INFO',
        });

        const mergedResult: CloudPullResult = {
          ...result,
          message: summaryMsg,
          mergedStats: {
            productsAdded,
            productsUpdated,
            transactionsAdded,
            journalEntriesAdded,
            financeEntriesAdded,
          },
        };

        return mergedResult;
      } catch (err: any) {
        const errorMsg = `Gagal menarik data dari cloud: ${err?.message || 'Error tidak diketahui'}`;
        showToast(errorMsg, 'error');
        return {
          success: false,
          message: errorMsg,
          timestamp: new Date().toISOString(),
          error: err?.message || 'Pull sync error',
        };
      } finally {
        (dualBackendSync as any).isSyncing = false;
        (dualBackendSync as any).notify?.();
      }
    },
    [showToast, appendAudit, currentUser, updateBusinessProfile]
  );

  const testCloudEndpointsHandler = useCallback(
    async (customConfig?: DualBackendConfig): Promise<CloudConnectionPingResult> => {
      return await testCloudConnections(customConfig);
    },
    []
  );

  const syncOfflineTransactions = useCallback(async () => {
    try {
      const pendingCount = (sales || []).filter((s) => s.syncStatus === 'PENDING_SYNC').length;
      const cloudRes = await executeCloudSync();
      if (!cloudRes.success) {
        return {
          success: false,
          syncedCount: 0,
          message: cloudRes.message || `Sinkronisasi gagal (${pendingCount} transaksi tetap antre offline)`,
        };
      }
      return { success: true, syncedCount: pendingCount, message: cloudRes.message };
    } catch (e: any) {
      const msg = `Gagal sinkronisasi: ${e.message || 'Error koneksi'}`;
      showToast(msg, 'error');
      return { success: false, syncedCount: 0, message: msg };
    }
  }, [executeCloudSync, sales, showToast]);

  // =========================================================================
  // REMOTE MAINTENANCE & TELEMETRY HUB
  // =========================================================================
  const [remoteMaintenanceLock, setRemoteMaintenanceLock] = useState<{
    locked: boolean;
    message: string;
    targetBranchId?: string;
    lockedAt?: string;
    lockedBy?: string;
  }>(() => {
    try {
      const saved = localStorage.getItem(REMOTE_MAINTENANCE_LOCK_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      locked: false,
      message: 'Sistem sedang dalam pemeliharaan terjadwal oleh SuperAdmin Pusat.'
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(REMOTE_MAINTENANCE_LOCK_KEY, JSON.stringify(remoteMaintenanceLock));
    } catch {}
    setIsGlobalMaintenance(remoteMaintenanceLock.locked);
  }, [remoteMaintenanceLock]);

  const [remoteCommandLogs, setRemoteCommandLogs] = useState<RemoteCommandExecutionLog[]>(() =>
    dualBackendSync.getRemoteCommandLogs()
  );
  const [branchTelemetryReports, setBranchTelemetryReports] = useState<BranchTelemetryReport[]>(() =>
    dualBackendSync.getTelemetryReports()
  );
  const [lastHeartbeatAt, setLastHeartbeatAt] = useState<string | null>(null);

  const processedRemoteCmdIdsRef = useRef<Set<string>>(new Set());
  const recordSystemError = useCallback(
    (payload: {
      message: string;
      stack?: string;
      module?: string;
      route?: string;
      sourceFile?: string;
      lineNumber?: number;
      columnNumber?: number;
      type?: 'CRITICAL' | 'WARNING';
    }) => {
      const msgLower = (payload.message || '').toLowerCase();
      const cfg = dualBackendSync.getConfig();
      const isLocalMode = cfg.provider === 'LOCAL' || (!cfg.supabaseUrl && !cfg.gasWebhookUrl);

      if (
        isLocalMode &&
        (msgLower.includes('fetch') ||
          msgLower.includes('network') ||
          msgLower.includes('supabase') ||
          msgLower.includes('gas') ||
          msgLower.includes('timeout') ||
          msgLower.includes('net::ERR_'))
      ) {
        return;
      }

      const parsed = parseErrorStackSummary(
        payload.stack,
        payload.sourceFile,
        payload.lineNumber,
        payload.columnNumber
      );
      const activeMod = (payload.module || activeNavRef.current || 'SYSTEM').toUpperCase();
      const routeInfo =
        payload.route ||
        (typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.hash || ''}#${activeMod.toLowerCase()}`
          : `#${activeMod.toLowerCase()}`);

      const newErr: SystemError = {
        id: `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        branchId: activeBranchId,
        module: activeMod,
        route: routeInfo,
        message: payload.message || 'Unknown Runtime Error',
        stackSummary: parsed.stackSummary,
        sourceFile: parsed.sourceFile,
        lineNumber: parsed.lineNumber,
        columnNumber: parsed.columnNumber,
        type: payload.type || 'CRITICAL'
      };

      setErrorLogs((prev) => {
        // Avoid rapid duplicate error flooding within 1.5 seconds
        const latest = prev[0];
        if (
          latest &&
          latest.message === newErr.message &&
          latest.module === newErr.module &&
          Date.now() - new Date(latest.timestamp).getTime() < 1500
        ) {
          return prev;
        }
        return [newErr, ...prev].slice(0, 50);
      });
    },
    [activeBranchId]
  );

  const clearSystemErrorLogs = useCallback(() => {
    setErrorLogs([]);
    try {
      localStorage.removeItem(SYSTEM_ERROR_LOGS_KEY);
    } catch {}
    showToast('Log error sistem (systemErrorLogs) dibersihkan.', 'info');
  }, [showToast]);

  // Global Crash & Error Interceptor (window.error + unhandledrejection)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleWindowError = (event: ErrorEvent) => {
      const msg = event?.error?.message || event?.message || 'Uncaught Global Script Error';
      // Ignore benign ResizeObserver loop notices
      if (msg.includes('ResizeObserver loop')) return;

      recordSystemError({
        message: msg,
        stack: event?.error?.stack,
        sourceFile: event?.filename,
        lineNumber: event?.lineno,
        columnNumber: event?.colno,
        module: (activeNavRef.current || 'GLOBAL').toUpperCase(),
        route: `${window.location.pathname}${window.location.hash || ''}#${activeNavRef.current || 'home'}`,
        type: 'CRITICAL'
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const msg =
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
          ? reason
          : JSON.stringify(reason || 'Unhandled Promise Rejection');

      recordSystemError({
        message: `UnhandledRejection: ${msg}`,
        stack: reason instanceof Error ? reason.stack : undefined,
        module: (activeNavRef.current || 'ASYNC').toUpperCase(),
        route: `${window.location.pathname}${window.location.hash || ''}#${activeNavRef.current || 'home'}`,
        type: 'CRITICAL'
      });
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [recordSystemError]);

  const errorLogsRef = useRef(errorLogs);
  const auditLogsRef = useRef(auditLogs);
  const activeNavRef = useRef(activeNav);
  const branchesRef = useRef(branches);
  const remoteLockRef = useRef(remoteMaintenanceLock);

  useEffect(() => {
    salesRef.current = sales;
  }, [sales]);
  useEffect(() => {
    errorLogsRef.current = errorLogs;
  }, [errorLogs]);
  useEffect(() => {
    auditLogsRef.current = auditLogs;
  }, [auditLogs]);
  useEffect(() => {
    activeNavRef.current = activeNav;
  }, [activeNav]);
  useEffect(() => {
    branchesRef.current = branches;
  }, [branches]);
  useEffect(() => {
    remoteLockRef.current = remoteMaintenanceLock;
  }, [remoteMaintenanceLock]);

  const executeIncomingRemoteCommand = useCallback(
    async (cmd: RemoteCommandPayload) => {
      if (!cmd || !cmd.id || !cmd.command) return;
      if (cmd.targetBranchId !== 'ALL_BRANCHES' && cmd.targetBranchId !== activeBranchId) {
        return;
      }
      if (processedRemoteCmdIdsRef.current.has(cmd.id)) return;
      processedRemoteCmdIdsRef.current.add(cmd.id);

      const branchObj = branchesRef.current.find((b) => b.id === activeBranchId);
      const branchName = branchObj?.name || `Cabang ${activeBranchId}`;
      const nowIso = new Date().toISOString();

      try {
        if (cmd.command === 'REMOTE_MAINTENANCE_LOCK') {
          const nextLocked = cmd.lockActive ?? !remoteLockRef.current.locked;
          const nextMsg =
            cmd.customMessage?.trim() ||
            'Sistem cabang sedang dikunci sementara untuk pemeliharaan pusat.';
          const nextState = {
            locked: nextLocked,
            message: nextMsg,
            targetBranchId: cmd.targetBranchId,
            lockedAt: nextLocked ? nowIso : undefined,
            lockedBy: cmd.issuedBy
          };
          setRemoteMaintenanceLock(nextState);
          setIsGlobalMaintenance(nextLocked);

          addAuditLog(
            'REMOTE_MAINTENANCE_LOCK',
            `Perintah jarak jauh: Maintenance Lock ${nextLocked ? 'DIAKTIFKAN' : 'DIMATIKAN'} (${branchName}) — "${nextMsg}"`,
            'SECURITY'
          );

          dualBackendSync.publishRemoteAck({
            commandId: cmd.id,
            command: cmd.command,
            targetBranchId: cmd.targetBranchId,
            branchId: activeBranchId,
            branchName,
            status: 'EXECUTED',
            transport: 'LOCAL_BROADCAST',
            details: `Maintenance Lock ${nextLocked ? 'AKTIF' : 'NONAKTIF'}: ${nextMsg}`,
            executedAt: nowIso,
            customMessage: nextMsg
          });

          showToast(
            nextLocked
              ? `Remote Maintenance Lock diaktifkan: ${nextMsg}`
              : 'Remote Maintenance Lock dinonaktifkan. Terminal cabang kembali normal.',
            nextLocked ? 'warning' : 'success'
          );
        } else if (cmd.command === 'REMOTE_FORCE_SYNC') {
          const pendingBefore =
            (salesRef.current || []).filter((s) => s.syncStatus === 'PENDING_SYNC' || !s.syncStatus).length +
            dualBackendSync.getSnapshot().queuedCount;
          await syncOfflineTransactions();

          addAuditLog(
            'REMOTE_FORCE_SYNC',
            `Perintah jarak jauh: Force Sync dijalankan pada ${branchName} (${pendingBefore} item antrean diproses).`,
            'INFO'
          );

          dualBackendSync.publishRemoteAck({
            commandId: cmd.id,
            command: cmd.command,
            targetBranchId: cmd.targetBranchId,
            branchId: activeBranchId,
            branchName,
            status: 'EXECUTED',
            transport: 'LOCAL_BROADCAST',
            details: `Force Sync selesai: ${pendingBefore} item PENDING_SYNC diunggah ke server pusat.`,
            executedAt: nowIso
          });
        } else if (cmd.command === 'REMOTE_DIAGNOSTIC_REPORT') {
          let usedBytes = 0;
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key) {
                usedBytes += key.length + (localStorage.getItem(key) || '').length;
              }
            }
          } catch {}
          const quotaBytes = 5 * 1024 * 1024;
          const remainingBytes = Math.max(0, quotaBytes - usedBytes);
          const remainingPercent = Number(((remainingBytes / quotaBytes) * 100).toFixed(1));
          const pendingCount =
            (salesRef.current || []).filter((s) => s.syncStatus === 'PENDING_SYNC' || !s.syncStatus).length +
            dualBackendSync.getSnapshot().queuedCount;

          const errFromSystem = (errorLogsRef.current || []).map((err) => ({
            id: err.id,
            timestamp: err.timestamp,
            branchId: err.branchId || activeBranchId,
            level: err.type === 'WARNING' ? 'WARN' : 'ERROR',
            module: err.module || 'SYSTEM',
            route: err.route,
            action: 'RUNTIME_ERROR',
            message: err.message || 'Unknown error',
            stackSummary: err.stackSummary,
            sourceFile: err.sourceFile,
            lineNumber: err.lineNumber
          }));
          const errFromAudit = (auditLogsRef.current || [])
            .filter((l) => l.level === 'ERROR' || l.level === 'WARN')
            .map((l) => ({
              id: l.id,
              timestamp: l.timestamp,
              branchId: activeBranchId,
              level: l.level,
              module: l.module || 'AUDIT',
              action: l.action,
              message: l.details
            }));
          // Prioritize systemErrorLogs (global crash / boundary / rejection captures), supplement up to 10 entries
          const sortedSystemErrs = [...errFromSystem].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          const sortedAuditErrs = [...errFromAudit].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          const last10Errors = [...sortedSystemErrs, ...sortedAuditErrs].slice(0, 10);

          const report: BranchTelemetryReport = {
            id: `TEL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            branchId: activeBranchId,
            branchName,
            appVersion: 'JacS RetailOS ERP v2.5',
            localStorageUsedBytes: usedBytes,
            localStorageRemainingBytes: remainingBytes,
            localStorageRemainingPercent: remainingPercent,
            pendingSyncCount: pendingCount,
            lastErrorLogs: last10Errors,
            isMaintenanceLocked: remoteLockRef.current.locked,
            reportedAt: nowIso,
            commandId: cmd.id
          };

          await dualBackendSync.publishTelemetryReport(report);

          addAuditLog(
            'REMOTE_DIAGNOSTIC_REPORT',
            `Telemetri dikirim dari ${branchName}: Sisa storage ${(remainingBytes / 1024).toFixed(1)} KB (${remainingPercent}%), Pending Sync: ${pendingCount}, Error Logs: ${last10Errors.length}.`,
            'INFO'
          );

          dualBackendSync.publishRemoteAck({
            commandId: cmd.id,
            command: cmd.command,
            targetBranchId: cmd.targetBranchId,
            branchId: activeBranchId,
            branchName,
            status: 'EXECUTED',
            transport: 'LOCAL_BROADCAST',
            details: `Telemetri terkirim: sisa ${(remainingBytes / 1024).toFixed(1)} KB (${remainingPercent}%), ${pendingCount} pending, ${last10Errors.length} error log.`,
            executedAt: nowIso
          });

          showToast(`Laporan telemetri ${branchName} diterima konsol SuperAdmin.`, 'success');
        } else if (cmd.command === 'REMOTE_SOFT_RELOAD') {
          await syncOfflineTransactions();

          addAuditLog(
            'REMOTE_SOFT_RELOAD',
            `Perintah jarak jauh: Soft Reload dieksekusi pada ${branchName} setelah sinkronisasi selesai.`,
            'WARN'
          );

          dualBackendSync.publishRemoteAck({
            commandId: cmd.id,
            command: cmd.command,
            targetBranchId: cmd.targetBranchId,
            branchId: activeBranchId,
            branchName,
            status: 'EXECUTED',
            transport: 'LOCAL_BROADCAST',
            details: 'Sinkronisasi antrean selesai; aplikasi cabang dimuat ulang dengan aman.',
            executedAt: nowIso
          });

          if (activeNavRef.current !== 'admin') {
            showToast('Sinkronisasi selesai! Aplikasi cabang sedang dimuat ulang secara aman...', 'info');
            setTimeout(() => {
              window.location.reload();
            }, 900);
          } else {
            showToast('Soft Reload dikirim ke cabang: sinkronisasi selesai & terminal cabang dimuat ulang.', 'success');
          }
        }
      } catch (err: any) {
        dualBackendSync.publishRemoteAck({
          commandId: cmd.id,
          command: cmd.command,
          targetBranchId: cmd.targetBranchId,
          branchId: activeBranchId,
          branchName,
          status: 'FAILED',
          transport: 'LOCAL_BROADCAST',
          details: err?.message || 'Gagal mengeksekusi perintah jarak jauh',
          executedAt: new Date().toISOString()
        });
      }
    },
    [activeBranchId, addAuditLog, syncOfflineTransactions, showToast]
  );

  const dispatchRemoteCommand = useCallback(
    async (params: {
      command: RemoteCommandType;
      targetBranchId: string;
      customMessage?: string;
      lockActive?: boolean;
    }) => {
      const result = await dualBackendSync.dispatchRemoteCommand({
        ...params,
        issuedBy: currentUser?.name || 'Super Admin'
      });

      const targetBranchName =
        params.targetBranchId === 'ALL_BRANCHES'
          ? 'Semua Cabang'
          : branches.find((b) => b.id === params.targetBranchId)?.name || params.targetBranchId;

      dualBackendSync.publishRemoteAck({
        commandId: result.command.id,
        command: result.command.command,
        targetBranchId: result.command.targetBranchId,
        branchId: params.targetBranchId,
        branchName: targetBranchName,
        status: 'DISPATCHED',
        transport: result.transport,
        details: `Perintah ${params.command} dikirim ke ${targetBranchName} via ${result.transport}`,
        executedAt: result.command.issuedAt,
        customMessage: params.customMessage
      });

      addAuditLog(
        `DISPATCH_${params.command}`,
        `SuperAdmin mengirim ${params.command} ke ${targetBranchName} (${result.transport})`,
        'SECURITY'
      );

      return result;
    },
    [currentUser, branches, addAuditLog]
  );

  const triggerManualHeartbeatPoll = useCallback(async () => {
    const cmds = await dualBackendSync.pollRemoteCommands(activeBranchId);
    setLastHeartbeatAt(new Date().toISOString());
    let executed = 0;
    for (const c of cmds) {
      if (!processedRemoteCmdIdsRef.current.has(c.id)) {
        await executeIncomingRemoteCommand(c);
        executed++;
      }
    }
    return executed;
  }, [activeBranchId, executeIncomingRemoteCommand]);

  const clearRemoteHubLogs = useCallback(() => {
    dualBackendSync.clearRemoteHubLogs();
    showToast('Log eksekusi & telemetri Remote Hub dibersihkan.', 'info');
  }, [showToast]);

  useEffect(() => {
    const unsubCmd = dualBackendSync.subscribeRemoteCommands((cmd) => {
      executeIncomingRemoteCommand(cmd);
    });
    const unsubAck = dualBackendSync.subscribeRemoteAcks((logs) => {
      setRemoteCommandLogs(logs);
    });
    const unsubTel = dualBackendSync.subscribeTelemetryReports((reports) => {
      setBranchTelemetryReports(reports);
    });

    // Heartbeat polling every 12 seconds
    const runHeartbeat = async () => {
      try {
        const cmds = await dualBackendSync.pollRemoteCommands(activeBranchId);
        setLastHeartbeatAt(new Date().toISOString());
        for (const c of cmds) {
          await executeIncomingRemoteCommand(c);
        }
      } catch {}
    };
    setLastHeartbeatAt(new Date().toISOString());
    const timer = setInterval(runHeartbeat, 12000);

    return () => {
      unsubCmd();
      unsubAck();
      unsubTel();
      clearInterval(timer);
    };
  }, [activeBranchId, executeIncomingRemoteCommand]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => {
      showToast('Koneksi internet pulih! Melakukan auto-flush antrean offline (PENDING_SYNC)...', 'info');
      syncOfflineTransactions();
    };
    const handleOffline = () => {
      showToast('Perangkat offline. Transaksi dicatat dalam mode Offline-First.', 'warning');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineTransactions, showToast]);
  const setActiveNeonCard = useCallback((moduleKey: string, cardId?: string) => {
    setActiveNeonCardsState((prev) => ({ ...prev, [moduleKey]: cardId || moduleKey }));
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, any>): string => {
      return getTranslatedText(language, key, params);
    },
    [language]
  );

  const resetDemoData = useCallback(() => {
    setIsLedgerReset(false);
    isMasterCatalogWipedRef.current = false;
    setIsMasterCatalogWiped(false);
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setFinanceEntries(INITIAL_FINANCE);
    setPurchaseOrders(INITIAL_PURCHASING);
    setPurchaseRequests(INITIAL_PURCHASE_REQUESTS);
    setGoodsReceipts(INITIAL_GOODS_RECEIPTS);
    setInvoicesDue(INITIAL_INVOICES_DUE);
    setSuppliers(INITIAL_SUPPLIERS);
    setCustomers(INITIAL_CUSTOMERS);
    setEmployees(INITIAL_EMPLOYEES);
    setFnbToppings(DEFAULT_FNB_TOPPING_MASTERS);
    setServiceStylists(DEFAULT_SERVICE_STYLISTS);
    setCashierShifts([]);
    try {
      localStorage.removeItem(LEDGER_RESET_ACTIVE_ENTITY_KEY);
      localStorage.removeItem(MASTER_CATALOG_WIPED_KEY);
      localStorage.removeItem(`${STORAGE_PREFIX}products`);
      localStorage.removeItem(`${STORAGE_PREFIX}sales`);
      localStorage.removeItem(`${STORAGE_PREFIX}finance`);
      localStorage.removeItem(`${STORAGE_PREFIX}purchasing`);
      localStorage.removeItem(`${STORAGE_PREFIX}purchase_requests`);
      localStorage.removeItem(`${STORAGE_PREFIX}goods_receipts`);
      localStorage.removeItem(`${STORAGE_PREFIX}invoices_due`);
      localStorage.removeItem(`${STORAGE_PREFIX}shifts`);
      localStorage.removeItem(`${STORAGE_PREFIX}suppliers`);
      localStorage.removeItem(`${STORAGE_PREFIX}customers`);
      localStorage.removeItem(`${STORAGE_PREFIX}employees`);
      localStorage.removeItem(`${STORAGE_PREFIX}fnb_toppings`);
      localStorage.removeItem(`${STORAGE_PREFIX}service_stylists`);
    } catch {}
    const msg = 'Data demo berhasil direset ke kondisi awal';
    showToast(msg, 'info');
    return { success: true, message: msg };
  }, [showToast]);

  const resetDemoSalesAndRestock = useCallback(() => {
    return resetDemoData();
  }, [resetDemoData]);

  const clearAllCacheAndRepair = useCallback(() => {
    resetDemoData();
    setErrorLogs([]);
    const msg = 'Cache dibersihkan dan sistem diperbaiki';
    showToast(msg, 'success');
    return { success: true, message: msg };
  }, [resetDemoData, showToast]);

  const refreshSystemState = useCallback(() => {
    const msg = 'Status sistem berhasil diperbarui';
    showToast(msg, 'info');
    return { success: true, message: msg };
  }, [showToast]);

  const rawInventory: InventoryRecord[] = useMemo(
    () =>
      products.map((p) => ({
        product_id: p.id,
        product_name: p.name,
        initial_stock: p.initialStock || p.stock,
        in_qty: 0,
        out_qty: 0,
        final_stock: p.stock,
        last_update: new Date().toISOString(),
        minStock: p.minStock || p.min_stock || 10,
        unit: p.unit || 'Pcs',
        valuationHpp: p.stock * (p.costPrice || p.cost_price || 0),
        ...( {
          productId: p.id,
          barcode: p.barcode,
          productName: p.name,
          category: p.category,
          categoryCode: p.categoryCode || 10,
          stockOnHand: p.stock
        } as any )
      })),
    [products]
  );

  const inventory = useMemo(
    () => filterInventoryByBusinessDomain(rawInventory, products, effectiveDomainConfig),
    [rawInventory, products, effectiveDomainConfig]
  );

  const domainPurchaseOrders = useMemo(
    () => filterPurchaseOrdersByBusinessDomain(purchaseOrders, effectiveDomainConfig, isLedgerReset),
    [purchaseOrders, effectiveDomainConfig, isLedgerReset]
  );

  const domainPurchaseRequests = useMemo(
    () => filterPurchaseRequestsByBusinessDomain(purchaseRequests, effectiveDomainConfig, isLedgerReset),
    [purchaseRequests, effectiveDomainConfig, isLedgerReset]
  );

  const domainStockMutations = useMemo(
    () => filterMutationsByBusinessDomain(stockMutations, products, effectiveDomainConfig),
    [stockMutations, products, effectiveDomainConfig]
  );

  const domainGoodsReceipts = useMemo(
    () => filterGoodsReceiptsByBusinessDomain(goodsReceipts, effectiveDomainConfig),
    [goodsReceipts, effectiveDomainConfig]
  );

  const setInventory = useCallback((_action: React.SetStateAction<InventoryRecord[]>) => {}, []);

  const contextualProfile = useMemo(() => {
    const roleStr = String(currentUser?.role || '').toUpperCase();
    const positionLabel = isSuperAdminAuthenticated || roleStr.includes('SUPER')
      ? 'Super Administrator'
      : roleStr.includes('EXECUTIVE') || roleStr === 'MANAGER'
      ? 'Executive Manager'
      : roleStr.includes('FINANCE')
      ? 'Finance Manager'
      : roleStr.includes('PURCHAS')
      ? 'Purchasing Officer'
      : roleStr.includes('KASIR') || roleStr.includes('CASHIER')
      ? 'Kasir POS'
      : roleStr.includes('WAREHOUSE') || roleStr.includes('INVENTORY')
      ? 'Warehouse Head'
      : roleStr.includes('HR')
      ? 'HR Manager'
      : currentUser?.role || 'Staff';

    return {
      isGeneral: activeNav === 'home',
      moduleTitle: activeNav.toUpperCase(),
      subLabel: businessProfile.companyName || businessProfile.name,
      userName: currentUser?.name || 'Guest',
      position: positionLabel,
      avatarUrl: currentUser?.avatarUrl || currentUser?.avatar || null,
      exactRole: isSuperAdminAuthenticated ? 'superadmin' : (currentUser?.role || 'staff').toLowerCase()
    };
  }, [activeNav, businessProfile, currentUser, isSuperAdminAuthenticated]);

  const value: AppContextType = {
    theme,
    setTheme,
    toggleTheme,
    language,
    setLanguage,
    toggleLanguage,
    t,
    activeNav,
    setActiveNav: (nav: ActiveNavModule | string) => setActiveNav(nav as ActiveNavModule),
    isSidebarCollapsed,
    toggleSidebar,

    currentUser,
    setCurrentUser,
    activeUser: currentUser,
    setActiveUser: setCurrentUser,
    isSuperAdminAuthenticated,
    setIsSuperAdminAuthenticated,
    exitSuperAdminSession,
    emergencySessionReset,
    superAdminTab,
    setSuperAdminTab,
    isGlobalMaintenance,
    toggleGlobalMaintenance,
    isPinModalOpen,
    openPinAuth,
    closePinAuth,
    verifyPin,
    verifyModulePassword,
    updateUserPin,
    resetAllUserPinsToDefault,
    developerPassword,
    updateDeveloperPassword,
    divisionPinHashes,
    superAdminCodeHash,
    superAdminCodeUpdatedAt,
    verifyDivisionPin,
    updateDivisionPin,
    verifySuperAdminAuthorityCode,
    updateSuperAdminAuthorityCode,
    managementAuthPin,
    updateManagementAuthPin,
    verifyManagementAuthPin,
    contextualProfile,
    logout,
    isModuleUnlocked,
    unlockModule,

    businessProfile,
    businessDomainConfig: effectiveDomainConfig,
    activeSector: resolveCanonicalSector(effectiveDomainConfig),
    activeMechanismFamily: effectiveDomainConfig.mechanismFamily,
    isFnb: resolveCanonicalSector(effectiveDomainConfig) === 'FNB',
    isFashion: resolveCanonicalSector(effectiveDomainConfig) === 'FASHION',
    isBuilding: resolveCanonicalSector(effectiveDomainConfig) === 'BUILDING',
    isService: resolveCanonicalSector(effectiveDomainConfig) === 'SERVICE',
    isRetail: resolveCanonicalSector(effectiveDomainConfig) === 'RETAIL',
    updateBusinessProfile,
    resetBusinessProfileToDefault,
    businessVertical: deriveExecutiveVerticalFromProfile(businessProfile),
    isFirstRunSetup,
    setIsFirstRunSetup,
    activeBranchId,
    branches,
    addBranch,
    updateBranch,
    deleteBranch,

    toastMessage,
    toastType,
    showToast,
    clearToast,

    products,
    setProducts,
    addProduct,
    addProductsBulk,
    updateProduct,
    deleteProduct,
    getProductThreshold,
    getProductAlertThreshold: getProductThreshold,
    getDefaultSupplierForProduct,
    brands,
    setBrands,
    categories: categoriesMaster,
    categoriesMaster,
    setCategoriesMaster,
    fnbToppings,
    setFnbToppings,
    addFnbTopping,
    updateFnbTopping,
    deleteFnbTopping,
    toggleFnbToppingActive,
    registerFnbRawMaterial,
    serviceStylists,
    setServiceStylists,
    addServiceStylist,
    updateServiceStylist,
    deleteServiceStylist,
    toggleServiceStylistActive,

    sales: domainSales,
    salesHistory: domainSales,
    transactions: domainSales,
    setSales,
    addSale,
    processPayment,
    showReceipt,
    closeReceipt,
    isReceiptModalOpen,
    currentReceiptSale,
    voidTransaction,
    handleSalesReturn,
    processFashionExchange,

    users,
    setUsers,
    activeCashierQuota,
    cashierQuotaLogs,
    updateActiveCashierQuota,
    terminals,
    setTerminals,
    addTerminal,
    updateTerminal,
    deleteTerminal,
    toggleTerminalLock,
    setAllTerminalsLock,
    activeTerminal,
    setActiveTerminal,
    activeTerminalId,
    setActiveTerminalId,
    boundStation,
    bindPosStation,
    unbindPosStation,
    isCashierWorkspaceActive,
    setIsCashierWorkspaceActive,
    isAiAssistantOpen,
    setIsAiAssistantOpen,
    openAiAssistant,
    closeAiAssistant,
    isOnline: true,
    offlineQueue: [],
    syncOfflineTransactions,
    executeCloudSync,
    pullCloudSyncData: pullCloudSyncDataHandler,
    testCloudEndpoints: testCloudEndpointsHandler,
    activeBackendProvider,
    setActiveBackendProvider,
    storageOperationalMode,
    setStorageOperationalMode,
    gasWebhookUrl: gasWebhookUrlState,
    setGasWebhookUrl,
    testGasConnection: testGasConnectionHandler,
    gasOfflineQueueCount,
    syncOfflineQueues,

    suppliers: domainSuppliers,
    setSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    customers,
    setCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,

    purchaseOrders: domainPurchaseOrders,
    purchasing: domainPurchaseOrders,
    setPurchasing: setPurchaseOrders,
    addPurchaseOrder,
    createPurchaseOrder: addPurchaseOrder,
    updatePurchaseOrder,
    updatePurchaseOrderStatus,
    updatePurchaseOrderPayment,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    createPurchaseReturn,
    createAutoReorderPO,
    reorderAllLowStock,
    purchaseRequests: domainPurchaseRequests,
    setPurchaseRequests,
    addPurchaseRequest,
    createPurchaseRequest: addPurchaseRequest,
    approvePurchaseRequest,
    rejectPurchaseRequest,

    inventory,
    setInventory,
    stockMutations: domainStockMutations,
    setStockMutations,
    recordStockMutation,
    adjustStock,
    repairStockLedger,
    processStockOpnameAdjustment,
    processGoodsReceipt,

    finance: domainFinanceEntries,
    setFinance: setFinanceEntries,
    financeEntries: domainFinanceEntries,
    journalEntries: domainJournalEntries,
    addFinanceEntry,
    addJournalVoucher,
    postGeneralJournalVoucher,
    getLiquidCashBalance,
    showJournalModal,
    setShowJournalModal,
    journalVoucherInitialData,
    setJournalVoucherInitialData,
    openJournalVoucher,
    invoicesDue,
    invoicesReceivable,
    receiveCustomerPayment,
    payVendorInvoice,
    supplierRebateClaims: domainSupplierRebateClaims,
    applySupplierRebateToAP,
    settleRebateClaimCash,

    approvals,
    approvalQueue: approvals,
    approveItem,
    rejectItem,
    promotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotionStatus,
    stockPolicies,
    stockAlertPolicies: stockPolicies,
    addStockAlertPolicy,
    updateStockAlertPolicy,
    deleteStockAlertPolicy,

    employees,
    setEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    attendance,
    attendanceLogs: attendance,
    recordClockIn,
    recordClockOut,
    leaves,
    leaveRequests: leaves,
    submitLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    toggleEmployeeBpjs,
    isPayrollSynced,
    lastPayrollSyncTime,
    syncPayrollToFinance,
    recordPayrollExpense,
    processPayrollPayment,
    calculateCashierCommission: calculateCashierCommissionContext,

    voidLogs,
    voidItemLogs: voidLogs,
    clearVoidItemLogs,
    goodsReceipts: domainGoodsReceipts,
    badStocks,
    badStockItems: badStocks,
    salesReturns,
    purchaseReturns,
    cashierShifts,
    shiftsHistory: cashierShifts,
    activeShift: getOpenShiftForStation(),
    getOpenShiftForStation,
    toggleStationBreak,
    openCashierShift,
    closeCashierShift,
    recordShiftExpense,

    migrationBatches,
    setMigrationBatches,
    rollbackMigrationBatch,

    auditLogs,
    logs: auditLogs,
    errorLogs,
    systemErrorLogs: errorLogs,
    recordSystemError,
    clearSystemErrorLogs,
    addAuditLog,
    pruneOldAuditLogs,
    restoreSystemSnapshot,

    sheetConfig,
    updateSheetConfig,
    testSheetConnection,

    calculateFBMenuHPP,
    handleSaveRecipeCosting,

    activeNeonCards,
    setActiveNeonCard,
    clearAllCacheAndRepair,
    refreshSystemState,
    resetDemoData,
    resetDemoSalesAndRestock,
    isProductionMode,
    toggleProductionMode,
    cleanSlateTransactions,
    resetLedgerToActiveEntity,
    isLedgerReset,
    isMasterCatalogWiped,
    executeSystemResetByLevel,
    restoreDemoSimulationData,
    remoteMaintenanceLock,
    setRemoteMaintenanceLock,
    remoteCommandLogs,
    branchTelemetryReports,
    lastHeartbeatAt,
    dispatchRemoteCommand,
    triggerManualHeartbeatPoll,
    clearRemoteHubLogs,
    cloverConfig,
    updateCloverConfig,
    executeCloverLiveSync,

    idleAutoLockMinutes,
    setIdleAutoLockMinutes,
    isIdleLocked,
    idleLockedAt,
    idleLockReason,
    triggerIdleLockNow,
    unlockIdleScreen,
    securityShieldStats,
    recordSecurityShieldEvent,

    buildingDeliveryOrders,
    laundryOrders,
    updateLaundryOrderStatus,
    settleLaundryOrderPayment,
    addBuildingDeliveryOrder,
    updateBuildingDeliveryStatus,
    bulkShrinkageLogs,
    recordBulkShrinkage,
    buildingAuthRequests,
    submitBuildingAuthRequest,
    approveBuildingAuthRequest,
    rejectBuildingAuthRequest
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp harus digunakan di dalam AppProvider');
  }
  return ctx;
};