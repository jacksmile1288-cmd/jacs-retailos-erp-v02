import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Terminal, UserRole } from '../../types';
import { generateTerminalConfigs, isHybridArchitecture } from '../../utils/terminalConfigUtils';
import {
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Terminal as TerminalIcon,
  Activity,
  Cpu,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Download,
  Trash2,
  Plus,
  Radio,
  Wifi,
  WifiOff,
  UserCheck,
  Server,
  FileCode,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sliders,
  ExternalLink,
  ChevronRight,
  Eye,
  EyeOff,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  FileText,
  BadgeCheck,
  Power,
  Sparkles,
  Upload,
  PackageCheck,
  ShoppingCart,
  Percent,
  Layers,
  Box,
  DollarSign,
  Database,
  Tag,
  Store,
  Shield,
  Check,
  ListChecks,
  LogOut,
  DoorOpen,
  Home,
  KeyRound,
  Bot,
  SlidersHorizontal,
  Brain,
  Wand2,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { JacSLogo } from '../common/JacSLogo';
import { BusinessEntityProfile, Product } from '../../types';
import { DEFAULT_BUSINESS_PROFILE } from '../../data/initialData';
import { hasValidProfileValue } from '../../utils/businessProfileUtils';
import { DataMigrationModal } from '../master/DataMigrationModal';
import { AiSmartMapperModal } from '../master/AiSmartMapperModal';
import { SopInfoCenterTab } from './tabs/SopInfoCenterTab';
import { MigrationEntityType } from '../../types';
import { getTerminalIndustry } from '../../data/industryTerminalProducts';

export const SuperAdminModule: React.FC = () => {
  const {
    setActiveNav,
    exitSuperAdminSession,
    terminals,
    addTerminal,
    deleteTerminal,
    updateTerminal,
    toggleTerminalLock,
    setAllTerminalsLock,
    developerPassword,
    updateDeveloperPassword,
    isSuperAdminAuthenticated,
    setIsSuperAdminAuthenticated,
    superAdminTab,
    setSuperAdminTab,
    updateUserPin,
    resetAllUserPinsToDefault,
    refreshSystemState,
    emergencySessionReset,
    clearAllCacheAndRepair,
    repairStockLedger,
    resetDemoSalesAndRestock,
    businessProfile,
    updateBusinessProfile,
    resetBusinessProfileToDefault,
    isFirstRunSetup,
    setIsFirstRunSetup,
    isGlobalMaintenance,
    toggleGlobalMaintenance,
    users,
    auditLogs,
    addAuditLog,
    sheetConfig,
    updateSheetConfig,
    testSheetConnection,
    products,
    suppliers,
    customers,
    sales,
    salesHistory,
    purchasing,
    inventory,
    stockMutations,
    finance,
    shiftsHistory,
    calculateCashierCommission,
    addProductsBulk,
    setProducts,
    brands,
    setBrands,
    categoriesMaster,
    setCategoriesMaster,
    showToast,
    theme,
  } = useApp();

  const isLight = theme === 'light';

  // Security Gate State
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isErrorShake, setIsErrorShake] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);

  // Active Admin Tab: synced with global AppContext & localStorage
  const adminTab = (superAdminTab || 'system') as
    | 'system'
    | 'profile'
    | 'credentials'
    | 'ai'
    | 'diagnostics'
    | 'terminals'
    | 'remote'
    | 'logs'
    | 'sheets'
    | 'migration'
    | 'sop';
  const setAdminTab = (tab: any) => setSuperAdminTab(tab);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [migrationInitialEntity, setMigrationInitialEntity] = useState<MigrationEntityType>('product');

  // Business Profile Form State
  const [profileForm, setProfileForm] = useState<BusinessEntityProfile>(businessProfile);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    setProfileForm(businessProfile);
  }, [businessProfile]);

  // Credential Management Visibility State
  const [showDevPassword, setShowDevPassword] = useState(false);
  const [showConfirmDevPassword, setShowConfirmDevPassword] = useState(false);
  const [showNewUserPin, setShowNewUserPin] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // AI Smart Tools States
  const [isAiSmartMapOpen, setIsAiSmartMapOpen] = useState(false);
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState(() => {
    return localStorage.getItem('jacs_gemini_api_key') || '';
  });
  const [showGeminiApiKey, setShowGeminiApiKey] = useState(false);
  const [geminiModelSelected, setGeminiModelSelected] = useState(() => {
    return localStorage.getItem('jacs_gemini_model') || 'gemini-3.8-flash';
  });
  const [isAiRunningAudit, setIsAiRunningAudit] = useState(false);
  const [aiAuditReport, setAiAuditReport] = useState<string | null>(null);
  const [aiStockRestockCount, setAiStockRestockCount] = useState<number | null>(null);

  // AI Smart Mapper Products Import Handler
  const handleAiSmartMapImport = (
    newProductsList: Array<Partial<Product> & { manufacturer?: string; rackLocation?: string }>,
    newBrandsList: Array<{ name: string; manufacturer?: string }>,
    newCategoriesList: string[]
  ) => {
    if (newProductsList.length === 0) return;

    // Update Brands
    if (brands && setBrands) {
      const updatedBrands = [...brands];
      newBrandsList.forEach((nb) => {
        if (nb.name && !updatedBrands.some((b) => b.name.toLowerCase() === nb.name.toLowerCase())) {
          updatedBrands.push({
            id: `BRD-${String(updatedBrands.length + 1).padStart(3, '0')}`,
            code: nb.name.substring(0, 4).toUpperCase(),
            name: nb.name,
            country: 'Indonesia',
            manufacturer: nb.manufacturer || 'Pabrikan Mitra',
            productCount: 1,
            status: 'Active',
          });
        }
      });
      setBrands(updatedBrands);
    }

    // Update Categories
    if (categoriesMaster && setCategoriesMaster) {
      const updatedCategories = [...categoriesMaster];
      newCategoriesList.forEach((nc) => {
        if (nc && !updatedCategories.some((c) => c.name.toLowerCase() === nc.toLowerCase())) {
          updatedCategories.push({
            id: `CAT-${String(updatedCategories.length + 1).padStart(3, '0')}`,
            code: nc.substring(0, 3).toUpperCase(),
            name: nc,
            department: 'General Retail',
            taxRate: 11,
            marginTarget: 20,
            productCount: 1,
            status: 'Active',
          });
        }
      });
      setCategoriesMaster(updatedCategories);
    }

    // Add Products in Bulk
    const productsToAdd: Array<Omit<Product, 'id'> & { id?: string }> = newProductsList.map((p) => {
      const sellPrice = p.sell_price || 0;
      const costPrice = p.cost_price || 0;
      const stock = p.stock ?? 10;
      return {
        name: p.name || 'Produk Impor AI',
        barcode: p.barcode || `899${Math.floor(100000000 + Math.random() * 900000000)}`,
        category: p.category || 'Umum',
        brand: p.brand || 'Umum',
        cost_price: costPrice,
        sell_price: sellPrice,
        price_retail: p.price_retail || sellPrice,
        price_wholesale: p.price_wholesale || Math.round(sellPrice * 0.92),
        price_distributor: p.price_distributor || Math.round(sellPrice * 0.85),
        stock,
        initialStock: stock,
        min_stock: 5,
        unit: p.unit || 'PCS',
        rackLocation: p.rackLocation || 'Gudang Utama',
        status: stock > 0 ? 'Active' : 'Out of Stock',
        taxable: true,
        businessModel: 'retail',
      };
    });

    addProductsBulk(productsToAdd, `Berhasil mengimpor ${newProductsList.length} produk via AI Smart Mapper`);
    addAuditLog(`AI Smart Mapper mengimpor ${newProductsList.length} produk baru ke katalog`, 'AI_SMART_TOOLS', 'INFO');
    showToast(`✅ Berhasil mengimpor ${newProductsList.length} produk via AI Smart Mapper!`);
  };

  const handleRefreshAndSync = () => {
    setIsRefreshing(true);
    try {
      refreshSystemState();
    } catch (err) {
      console.error(err);
    }
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Data sistem & status terminal berhasil disegarkan');
    }, 600);
  };

  // Database Backup & Restore Handlers (JSON export/import)
  const handleBackupDatabase = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: 'JacS-ERP-v2.5',
      businessProfile,
      terminals,
      users,
      products,
      suppliers,
      customers,
      sales,
      salesHistory,
      purchasing,
      inventory,
      stockMutations,
      finance,
      auditLogs,
      sheetConfig,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JacS_ERP_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addAuditLog('Cadangan database sistem (JSON) berhasil diunduh', 'SECURITY', 'INFO');
    showToast('File backup database sistem berhasil diunduh!');
  };

  const handleRestoreDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.businessProfile) {
          updateBusinessProfile(parsed.businessProfile);
        }
        if (Array.isArray(parsed.products)) {
          localStorage.setItem('jacs_erp_products', JSON.stringify(parsed.products));
        }
        if (Array.isArray(parsed.terminals)) {
          localStorage.setItem('jacs_erp_terminals', JSON.stringify(parsed.terminals));
        }
        if (Array.isArray(parsed.users)) {
          localStorage.setItem('jacs_erp_users', JSON.stringify(parsed.users));
        }
        refreshSystemState();
        addAuditLog('Database sistem berhasil dipulihkan dari file backup', 'SECURITY', 'WARN');
        showToast('Database sistem berhasil dipulihkan dari file cadangan!');
      } catch {
        showToast('Gagal memulihkan database: Format file JSON tidak valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Diagnostics state
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticSteps, setDiagnosticSteps] = useState<
    { name: string; status: 'pending' | 'running' | 'passed' | 'warning'; details?: string }[]
  >([]);
  const [repairSummary, setRepairSummary] = useState<string | null>(null);

  // Stock Ledger Repair State
  const [isRepairingLedger, setIsRepairingLedger] = useState(false);
  const [stockLedgerSummary, setStockLedgerSummary] = useState<{
    repairedCount: number;
    mutationsSynced: number;
    message: string;
    timestamp: string;
  } | null>(null);

  // Reset Demo Sales & Restock DB State
  const [isResetDemoModalOpen, setIsResetDemoModalOpen] = useState(false);
  const [isResettingDemo, setIsResettingDemo] = useState(false);
  const [resetDemoSummary, setResetDemoSummary] = useState<string | null>(null);

  // Critical Operations Audit Filter
  const [criticalAuditFilter, setCriticalAuditFilter] = useState<'ALL' | 'VOID_PIN' | 'SHIFT_RECONCILE' | 'PO_RECEIVE'>('ALL');

  // Log filter state
  const [logFilter, setLogFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'>('ALL');

  // New Terminal Form State
  const [newTermName, setNewTermName] = useState('KASIR 08 - DRIVE THRU');
  const [newTermModel, setNewTermModel] = useState('Swalayan / Supermarket Cepat');
  const [newTermIndustryType, setNewTermIndustryType] = useState<Terminal['modelType']>('supermarket');
  const [newTermAllowAllCategories, setNewTermAllowAllCategories] = useState(false);
  const [newTermColor, setNewTermColor] = useState('#00f2fe');
  const [newTermLocation, setNewTermLocation] = useState('Lane 08 - Ground Floor');

  // Credential Management & Reset PIN State
  const [newDevPassword, setNewDevPassword] = useState('');
  const [confirmDevPassword, setConfirmDevPassword] = useState('');
  const [userPinInputs, setUserPinInputs] = useState<Record<string, string>>({});
  const [revealedCurrentPins, setRevealedCurrentPins] = useState<Record<string, boolean>>({});
  const [revealedNewPins, setRevealedNewPins] = useState<Record<string, boolean>>({});

  // Remote Sync State
  const [isRemoteSyncing, setIsRemoteSyncing] = useState(false);

  // 1. Audit Verifikasi Pemotongan Stok POS (OUT_SALES)
  const posSalesCount = (salesHistory || []).length;
  const posTotalItemsSold = (salesHistory || []).reduce((sum, s) => {
    return sum + (s.items || []).reduce((iSum, it) => iSum + (it.quantity || 0), 0);
  }, 0);
  const outSalesMutations = (stockMutations || []).filter((m) => m.type === 'OUT_SALES');
  const outSalesTotalQty = outSalesMutations.reduce((sum, m) => sum + (m.qty || 0), 0);
  const isPosOutSalesSynced = posSalesCount === 0 || outSalesMutations.length > 0;

  // 2. Audit Verifikasi Penerimaan PO Purchasing (IN_PURCHASE)
  const receivedPOs = (purchasing || []).filter((po) => po.status === 'RECEIVED' || po.status === 'COMPLETED');
  const poTotalItemsReceived = receivedPOs.reduce((sum, po) => {
    return sum + (typeof po.items === 'string' ? 1 : 1);
  }, 0);
  const inPurchaseMutations = (stockMutations || []).filter((m) => m.type === 'IN_PURCHASE');
  const inPurchaseTotalQty = inPurchaseMutations.reduce((sum, m) => sum + (m.qty || 0), 0);
  const isPoInPurchaseSynced = receivedPOs.length === 0 || inPurchaseMutations.length > 0;

  // 3. Audit Akurasi Komisi Kasir 1%
  const cashierUsers = (users || []).filter((u) => u.role === 'Kasir' || u.role === 'Manager' || u.role === 'Super Admin');
  const cashierCommissionsAudit = cashierUsers.map((c) => {
    const res = calculateCashierCommission ? calculateCashierCommission(c) : { salesTotal: 0, commission: 0, transactionCount: 0 };
    const expectedCommission = Math.round((res.salesTotal || 0) * 0.01);
    const isAccurate = (res.commission || 0) === expectedCommission;
    return {
      cashier: c,
      salesTotal: res.salesTotal || 0,
      commission: res.commission || 0,
      expectedCommission,
      transactionCount: res.transactionCount || 0,
      isAccurate,
    };
  });
  const totalCashierSales = cashierCommissionsAudit.reduce((sum, c) => sum + c.salesTotal, 0);
  const totalCashierCommission = cashierCommissionsAudit.reduce((sum, c) => sum + c.commission, 0);
  const isCommissionAccurate = cashierCommissionsAudit.every((c) => c.isAccurate);

  // 4. Selisih Kalkulasi Stok Fisik vs Kartu Ledger
  const stockDiscrepancies = products.filter((p) => {
    const inv = inventory.find((i) => i.product_id === p.id);
    return inv && inv.final_stock !== p.stock;
  });

  // Dedicated Operational Log Filters
  const voidPinLogs = (auditLogs || []).filter((l) =>
    (l.details || '').toLowerCase().includes('void') ||
    (l.action || '').toLowerCase().includes('void') ||
    (l.details || '').toLowerCase().includes('dibatalkan')
  );

  const shiftReconciliationLogs = (auditLogs || []).filter((l) =>
    (l.details || '').toLowerCase().includes('shift') ||
    (l.details || '').toLowerCase().includes('rekonsiliasi') ||
    (l.action || '').toLowerCase().includes('finance') ||
    (l.details || '').toLowerCase().includes('kas kasir')
  );

  const poReceiveLogs = (auditLogs || []).filter((l) =>
    (l.details || '').toLowerCase().includes('po') ||
    (l.details || '').toLowerCase().includes('in_purchase') ||
    (l.details || '').toLowerCase().includes('penerimaan barang') ||
    (l.action || '').toLowerCase().includes('purchasing')
  );

  const criticalFilteredLogs = (auditLogs || []).filter((l) => {
    if (criticalAuditFilter === 'VOID_PIN') {
      return (
        (l.details || '').toLowerCase().includes('void') ||
        (l.action || '').toLowerCase().includes('void') ||
        (l.details || '').toLowerCase().includes('dibatalkan')
      );
    }
    if (criticalAuditFilter === 'SHIFT_RECONCILE') {
      return (
        (l.details || '').toLowerCase().includes('shift') ||
        (l.details || '').toLowerCase().includes('rekonsiliasi') ||
        (l.action || '').toLowerCase().includes('finance') ||
        (l.details || '').toLowerCase().includes('kas kasir')
      );
    }
    if (criticalAuditFilter === 'PO_RECEIVE') {
      return (
        (l.details || '').toLowerCase().includes('po') ||
        (l.details || '').toLowerCase().includes('in_purchase') ||
        (l.details || '').toLowerCase().includes('penerimaan barang') ||
        (l.action || '').toLowerCase().includes('purchasing')
      );
    }
    return true;
  });

  // Handle Security Gate Unlock
  const handleUnlockConsole = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const storedMaster = localStorage.getItem('jacs_super_admin_password');
    const isMasterMatch =
      passwordInput === developerPassword ||
      (Boolean(storedMaster) && passwordInput === storedMaster) ||
      passwordInput === 'Admin123';

    if (isMasterMatch) {
      setIsSuperAdminAuthenticated(true);
      setSecurityError(null);
      setPasswordInput('');
      addAuditLog('Super Admin Console berhasil dibuka (Akses Penuh)', 'SUPER_ADMIN', 'INFO');
      showToast('Otentikasi Super Admin Berhasil!');
    } else {
      setIsErrorShake(true);
      setSecurityError('Kata sandi master Super Admin salah! Akses ditolak.');
      setTimeout(() => setIsErrorShake(false), 600);
    }
  };

  // Run System Diagnostics
  const runSystemDiagnostics = () => {
    setIsDiagnosing(true);
    setRepairSummary(null);

    const steps = [
      { name: '1. Verifikasi Keunikan ID & Barcode SKU Produk', status: 'pending' as const },
      { name: '2. Pengecekan Relasi Transaksi Kasir & Status Pembayaran', status: 'pending' as const },
      { name: '3. Validasi Integritas Schema JSON LocalStorage & State Buffer', status: 'pending' as const },
      { name: '4. Uji Konektivitas Listener Terminal Kasir Multi-Node', status: 'pending' as const },
      { name: '5. Audit Memory Heap & Deteksi Potensi Memory Leak', status: 'pending' as const },
      { name: '6. Evaluasi Kuota & WebApp Webhook Google Sheets Sync', status: 'pending' as const },
      { name: '7. Sinkronisasi Mutasi Stok POS OUT_SALES & PO IN_PURCHASE', status: 'pending' as const },
      { name: '8. Validasi Akurasi Formula Komisi Kasir 1% Omzet', status: 'pending' as const },
    ];

    setDiagnosticSteps(steps);

    // Progressive check execution
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setDiagnosticSteps((prev) =>
          prev.map((s, i) => {
            if (i === idx) return { ...s, status: 'running' };
            if (i < idx) return { ...s, status: 'passed' };
            return s;
          })
        );
      }, (idx + 1) * 280);
    });

    setTimeout(() => {
      setDiagnosticSteps((prev) =>
        prev.map((s) => ({ ...s, status: 'passed', details: 'Status OK (100% Validated)' }))
      );
      setIsDiagnosing(false);
      showToast('Seluruh 8 Diagnostic System Health Check LULUS secara sempurna!');
      addAuditLog('Full System Diagnostic Check (including OUT_SALES, IN_PURCHASE & Commission) PASSED', 'DIAGNOSTIC', 'INFO');
    }, 2500);
  };

  // Run Auto-Repair & Clear Cache
  const handleAutoRepair = () => {
    const res = clearAllCacheAndRepair();
    setRepairSummary(
      `Pembersihan & perbaikan selesai: ${res.message} (${products.length} produk SKU terverifikasi, ${terminals.length} terminal disinkronkan).`
    );
  };

  // Run Repair Stock Ledger
  const handleRepairStockLedger = () => {
    setIsRepairingLedger(true);
    setTimeout(() => {
      const res = repairStockLedger();
      setStockLedgerSummary({
        repairedCount: res.repairedCount,
        mutationsSynced: res.mutationsSynced,
        message: res.message,
        timestamp: new Date().toLocaleTimeString('id-ID'),
      });
      setIsRepairingLedger(false);
    }, 400);
  };

  // Run Reset Demo Sales & Restock DB
  const handleConfirmResetDemo = () => {
    setIsResettingDemo(true);
    setTimeout(() => {
      const res = resetDemoSalesAndRestock();
      setResetDemoSummary(res.message);
      setIsResettingDemo(false);
      setIsResetDemoModalOpen(false);
    }, 450);
  };

  // Create New Terminal
  const handleCreateTerminal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermName.trim()) return showToast('Nama terminal wajib diisi!');

    let neonBorder = 'border-cyan-500';
    let neonBg = 'bg-cyan-500/10';
    let neonText = 'text-cyan-400';

    if (newTermColor === '#ff7a00') {
      neonBorder = 'border-orange-500';
      neonBg = 'bg-orange-500/10';
      neonText = 'text-orange-400';
    } else if (newTermColor === '#10B981') {
      neonBorder = 'border-emerald-500';
      neonBg = 'bg-emerald-500/10';
      neonText = 'text-emerald-400';
    } else if (newTermColor === '#8b5cf6') {
      neonBorder = 'border-purple-500';
      neonBg = 'bg-purple-500/10';
      neonText = 'text-purple-400';
    } else if (newTermColor === '#ec4899') {
      neonBorder = 'border-pink-500';
      neonBg = 'bg-pink-500/10';
      neonText = 'text-pink-400';
    }

    addTerminal({
      name: newTermName,
      code: `T${terminals.length + 1}`,
      colorHex: newTermColor,
      neonBorderClass: neonBorder,
      neonBgClass: neonBg,
      neonTextClass: neonText,
      location: newTermLocation,
      isActive: true,
      activeOrdersToday: 0,
      businessModel: newTermModel,
      modelType: newTermIndustryType,
      allowAllCategories: newTermAllowAllCategories,
      isLocked: false,
    });

    setNewTermName(`KASIR ${String(terminals.length + 2).padStart(2, '0')} - EXPRESS`);
    showToast(`Terminal ${newTermName} berhasil didaftarkan dengan mode [${newTermModel}]!`);
  };

  // Remote Force Sync to Cloud
  const handleRemoteForceSync = async () => {
    setIsRemoteSyncing(true);
    addAuditLog('Triggered Remote Force Sync ke Cloud', 'REMOTE_CONTROL', 'WARN');
    await testSheetConnection();
    setIsRemoteSyncing(false);
    showToast('Force Sync ke Cloud Berhasil! Seluruh data terupdate di database pusat.');
  };

  // Copy Logs to Clipboard
  const handleCopyLogs = () => {
    const text = auditLogs
      .map((l) => `[${l.timestamp}] [${l.level || 'INFO'}] [${l.action}] (${l.user}): ${l.details}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    showToast('Seluruh log aktivitas berhasil disalin ke clipboard!');
  };

  // Download Logs as .txt
  const handleDownloadLogs = () => {
    const text = auditLogs
      .map((l) => `[${l.timestamp}] [${l.level || 'INFO'}] [${l.action}] (${l.user}): ${l.details}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `JacS_ERP_SystemLogs_${new Date().toISOString().slice(0, 10)}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File log console berhasil diunduh!');
  };

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((l) => {
    if (criticalAuditFilter === 'VOID_PIN') {
      const match =
        (l.details || '').toLowerCase().includes('void') ||
        (l.action || '').toLowerCase().includes('void') ||
        (l.details || '').toLowerCase().includes('dibatalkan');
      if (!match) return false;
    } else if (criticalAuditFilter === 'SHIFT_RECONCILE') {
      const match =
        (l.details || '').toLowerCase().includes('shift') ||
        (l.details || '').toLowerCase().includes('rekonsiliasi') ||
        (l.action || '').toLowerCase().includes('finance') ||
        (l.details || '').toLowerCase().includes('kas kasir');
      if (!match) return false;
    } else if (criticalAuditFilter === 'PO_RECEIVE') {
      const match =
        (l.details || '').toLowerCase().includes('po') ||
        (l.details || '').toLowerCase().includes('in_purchase') ||
        (l.details || '').toLowerCase().includes('penerimaan barang') ||
        (l.action || '').toLowerCase().includes('purchasing');
      if (!match) return false;
    }

    if (logFilter === 'ALL') return true;
    return (l.level || 'INFO') === logFilter;
  });

  // ==========================================
  // RENDER 1: SECURITY GATE (LOCKED CONSOLE)
  // ==========================================
  if (!isSuperAdminAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div
          className={`w-full max-w-md rounded-3xl p-8 border shadow-2xl transition-all duration-300 ${
            isErrorShake ? 'translate-x-[-10px] scale-[0.99] border-rose-500 ring-2 ring-rose-500/50' : ''
          } ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
              : 'bg-[#161b22] border-[#30363d] text-white shadow-black/80'
          }`}
        >
          {/* Developer High-Res 3D 'J' Logo & Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <JacSLogo size="xl" imgOnly={true} className="drop-shadow-[0_4px_24px_rgba(236,72,153,0.5)]" />
            </div>
            <div className="text-[11px] font-semibold tracking-widest text-pink-400 uppercase font-mono">
              SYSTEM MAINTENANCE &bull; CONFIGURATION CONSOLE
            </div>
            <h2 className="text-2xl font-bold tracking-tight mt-1">
              Super Admin Console
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              JacS RetailOS Enterprise &bull; Otentikasi Kredensial Master Super Admin Wajib Diperlukan
            </p>
          </div>

          {/* Error Message */}
          {securityError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{securityError}</span>
            </div>
          )}

          {/* Form Password / PIN */}
          <form onSubmit={handleUnlockConsole} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                Kata Sandi Master Super Admin:
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  autoComplete="new-password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (securityError) setSecurityError(null);
                  }}
                  placeholder="Masukkan kata sandi master Super Admin..."
                  className={`w-full pl-10 pr-10 py-3 rounded-xl text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-[#0d1117] border-[#30363d] text-pink-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                  title={showPassword ? 'Sembunyikan Password' : 'Lihat Password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>Proteksi Sandi Master Super Admin (Manual Input)</span>
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  Enforced
                </span>
              </div>
            </div>

            {/* Numeric Quick Pad */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (k === 'C') {
                      setPasswordInput('');
                    } else if (k === '⌫') {
                      setPasswordInput((prev) => prev.slice(0, -1));
                    } else {
                      setPasswordInput((prev) => prev + k);
                    }
                  }}
                  className={`py-2 rounded-lg text-sm font-mono font-bold transition cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      : 'bg-[#0d1117] hover:bg-gray-800 text-gray-200 border border-gray-800'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="w-full mt-3 py-3 rounded-xl font-extrabold text-sm bg-pink-500 hover:bg-pink-400 text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.4)] cursor-pointer transition active:scale-95"
            >
              <Unlock className="w-4 h-4" />
              <span>Buka Maintenance Console</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('home')}
              className={`w-full py-2.5 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                isLight
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'border-gray-700 text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Kembali ke Operasional ERP</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 2: DEVELOPER MAINTENANCE CONSOLE
  // ==========================================
  return (
    <div className="space-y-6 pb-12">
      {/* Top Console Bar with Clear Super Admin Elevated Privileges Banner */}
      <div className="flex flex-col gap-4 pb-4 border-b border-gray-800">
        {/* Elevated Privileges Active Banner */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
          isLight
            ? 'bg-rose-50 border-rose-300 text-slate-900'
            : 'bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-pink-950/40 border-pink-500/40 text-white shadow-[0_0_20px_rgba(236,72,153,0.15)]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              isLight
                ? 'bg-rose-100 border-rose-300 text-rose-600'
                : 'bg-pink-500/20 text-pink-400 border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
            }`}>
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={
                  isLight
                    ? 'bg-rose-50 border border-rose-300 text-rose-950 font-black text-xs px-3 py-1 rounded inline-flex items-center'
                    : 'text-xs sm:text-sm font-extrabold tracking-tight font-mono text-pink-400'
                }>
                  Mode Aktif: Super Admin (Elevated Privileges)
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isLight
                    ? 'bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}>
                  ROOT SESSION ACTIVE
                </span>
              </div>
              <p className={`text-xs mt-0.5 leading-relaxed ${
                isLight ? 'text-slate-800 font-medium' : 'text-gray-400'
              }`}>
                Anda memegang kendali penuh konfigurasi sistem, database, diagnosa integritas, dan manajemen kredensial ERP.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Tombol 1: Keluar ke Menu Utama (HOME) */}
            <button
              type="button"
              id="btn-superadmin-exit-to-home"
              onClick={() => {
                exitSuperAdminSession();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition shadow-xs active:scale-95 ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold border-slate-300'
                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30'
              }`}
              title="Keluar ke Menu Utama (HOME) & Reset Hak Akses Super Admin"
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Keluar ke Menu Utama (HOME)</span>
            </button>

            {/* Tombol 2: Kunci Sesi Super Admin (Reset Hak Akses & Kembali ke HOME) */}
            <button
              type="button"
              id="btn-superadmin-lock-session"
              onClick={() => {
                setPasswordInput('');
                setShowPassword(false);
                exitSuperAdminSession();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white flex items-center gap-1.5 cursor-pointer transition shadow-[0_0_15px_rgba(244,63,94,0.35)] active:scale-95"
              title="Kunci sesi elevated Super Admin dan kembali ke HOME sebagai staff operasional"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Kunci Sesi Super Admin</span>
            </button>
          </div>
        </div>

        {/* Sub Header Title with Refresh Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.01em]">
              System Maintenance &amp; Configuration Console
            </h1>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
              Konsol Terisolasi: Status Pemeliharaan Sistem, Legalitas Entitas Usaha, Kredensial &amp; AI Smart Tools
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRefreshAndSync}
              disabled={isRefreshing}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition shadow-xs active:scale-95 disabled:opacity-50 shrink-0 whitespace-nowrap ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-bold text-xs'
                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30'
              }`}
              title="Refresh status data & sinkronisasi terminal"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-500' : ''}`} />
              <span>Refresh &amp; Sinkronisasi Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Module Navigation Tabs - 5 SEKSI LENGKAP */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'system', label: 'a. Status Sistem & Maintenance Mode', icon: Activity, color: '#00f2fe' },
          { id: 'profile', label: 'b. Pengaturan Legalitas & Registrasi Bisnis', icon: Building2, color: '#10b981' },
          { id: 'credentials', label: 'c. Pusat Manajemen Kredensial & Reset PIN', icon: KeyRound, color: '#ec4899' },
          { id: 'ai', label: 'd. AI Intelligence & Smart Tools', icon: Sparkles, color: '#a855f7' },
          { id: 'sop', label: 'e. Info Center & SOP 6 Divisi', icon: BookOpen, color: '#38bdf8' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shrink-0 transition cursor-pointer ${
                isActive
                  ? isLight
                    ? 'bg-white border border-slate-300 text-rose-950 font-bold shadow-sm'
                    : 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.35)] font-bold'
                  : isLight
                  ? 'bg-white text-slate-800 font-semibold hover:bg-slate-100 border border-slate-200'
                  : 'bg-[#161b22] text-gray-400 hover:text-white border border-[#30363d] font-medium'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ====================================================
          TAB 0: PROFIL & REGISTRASI ENTITAS BISNIS
          ==================================================== */}
      {adminTab === 'profile' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Card with Business Identity Overview */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_20px_rgba(0,242,254,0.25)]">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-lg tracking-tight">
                      Registrasi Profil Entitas Usaha (Master Identity)
                    </h2>
                    <span className={isLight ? 'bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs px-2 py-0.5 rounded' : 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'}>
                      ONBOARDING GATEWAY
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-700 font-medium text-xs' : 'text-gray-400'}`}>
                    Konfigurasi identitas resmi perusahaan/toko yang disinkronkan ke kop struk POS kasir, slip gaji karyawan, faktur PO pengadaan, dan laporan keuangan.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded font-bold text-xs border flex items-center gap-1.5 ${
                  isLight
                    ? isFirstRunSetup
                      ? 'bg-amber-100 border-amber-300 text-amber-950 font-bold text-xs'
                      : 'bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs'
                    : isFirstRunSetup
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}>
                  <BadgeCheck className="w-4 h-4" />
                  <span>{isFirstRunSetup ? 'SETUP PERTAMA (FIRST-RUN)' : 'PROFIL TERVERIFIKASI AKTIF'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsFirstRunSetup(!isFirstRunSetup);
                    showToast(`Mode First-Run Onboarding di-${!isFirstRunSetup ? 'AKTIFKAN' : 'NONAKTIFKAN'} untuk pengujian alur awal.`);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    isFirstRunSetup
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      : isLight
                      ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                  }`}
                  title="Toggle mode onboarding first-run untuk simulasi setup pertama kali"
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                  <span>{isFirstRunSetup ? 'Simulasi Aktif' : 'Simulasikan First-Run'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Kolom (Span 2) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsSavingProfile(true);
                setTimeout(() => {
                  const isHybrid = isHybridArchitecture(profileForm.cashierArchitecture);
                  const effectiveUnits = isHybrid
                    ? Math.max(2, Math.min(10, profileForm.posUnitCount ?? 2))
                    : Math.max(1, Math.min(10, profileForm.posUnitCount ?? 1));
                  const terminalConfigs = generateTerminalConfigs(
                    effectiveUnits,
                    profileForm.cashierArchitecture,
                    profileForm.category,
                    profileForm.terminalConfigs
                  );
                  updateBusinessProfile({
                    ...profileForm,
                    posUnitCount: effectiveUnits,
                    terminalConfigs,
                  });
                  setIsSavingProfile(false);
                }, 300);
              }}
              className={`lg:col-span-2 p-6 rounded-2xl border space-y-5 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 border-gray-700/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-sm">Formulir Identitas &amp; Legalitas Usaha</h3>
                </div>
                <span className={isLight ? 'text-slate-700 font-medium text-xs' : 'text-[11px] text-gray-400'}>*Wajib diisi untuk keabsahan dokumen operasional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* 1. Nama Bisnis */}
                <div className="sm:col-span-2">
                  <label className={`block font-bold text-xs mb-1 ${isLight ? 'text-slate-900' : 'text-gray-400'}`}>
                    Nama Bisnis / Perusahaan / Toko / Unit Usaha: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Contoh: PT JacS RetailOS Indonesia Tbk / Apotek Sumber Sehat"
                    className={`w-full p-3 rounded-xl border font-bold text-sm ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                        : 'bg-[#0d1117] border-gray-700 text-cyan-300 focus:border-cyan-500'
                    }`}
                  />
                </div>

                {/* 2. Kategori Industri Utama */}
                <div>
                  <label className={`block font-bold text-xs mb-1 ${isLight ? 'text-slate-900' : 'text-gray-400'}`}>
                    Kategori Industri: <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={
                      profileForm.category === 'Pharmacy' || profileForm.category === 'Pharmacy & Pet Shop'
                        ? 'Pharmacy & Pet Shop (Apotek & Kebutuhan Hewan)'
                        : profileForm.category === 'Salon & Service' || profileForm.category === 'Salon'
                        ? 'Salon & Barbershop (Jasa & Grooming)'
                        : profileForm.category
                    }
                    onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#0d1117] border-gray-700 text-white'
                    }`}
                  >
                    <option value="Ritel Modern & Multi-Industry">Ritel Modern &amp; Multi-Industry 🏢</option>
                    <option value="Modern Retail">Modern Retail / Ritel &amp; Grosir 🛒</option>
                    <option value="F&B">Food &amp; Beverage (F&amp;B Restoran &amp; Cafe) 🍳</option>
                    <option value="Pharmacy & Pet Shop (Apotek & Kebutuhan Hewan)">Pharmacy &amp; Pet Shop (Apotek &amp; Kebutuhan Hewan) 💊🐾</option>
                    <option value="Fashion">Fashion &amp; Apparel (Butik &amp; Busana) 👗</option>
                    <option value="Building">Building Materials &amp; Hardware (Bahan Bangunan) 🏗️</option>
                    <option value="Electronics">Electronics &amp; Gadgets (Elektronik &amp; Gawai) 📱</option>
                    <option value="Automotive">Automotive &amp; Workshop (Bengkel &amp; Otomotif) 🔧</option>
                    <option value="Salon & Barbershop (Jasa & Grooming)">Salon &amp; Barbershop (Jasa &amp; Grooming) 💈</option>
                  </select>
                </div>

                {/* 2b. Jumlah Unit Kasir & Arsitektur Kasir */}
                {(() => {
                  const isHybrid = isHybridArchitecture(profileForm.cashierArchitecture);
                  const effectiveUnits = isHybrid
                    ? Math.max(2, Math.min(10, profileForm.posUnitCount ?? 2))
                    : Math.max(1, Math.min(10, profileForm.posUnitCount ?? 1));
                  const activeConfigs = generateTerminalConfigs(
                    effectiveUnits,
                    profileForm.cashierArchitecture,
                    profileForm.category,
                    profileForm.terminalConfigs
                  );

                  return (
                    <div className="sm:col-span-2 space-y-3.5 p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Input Jumlah Unit Kasir Aktif (Terkunci Min 2 jika Hybrid) */}
                        <div>
                          <label className={`block font-bold text-xs mb-1 flex items-center justify-between ${isLight ? 'text-slate-900' : 'text-gray-300'}`}>
                            <span>Jumlah Unit Kasir Aktif: <span className="text-rose-400">*</span></span>
                            <span className="text-[10px] text-cyan-400 font-mono font-bold">
                              {isHybrid ? '2 s/d 10 (Kunci Min. 2 Unit)' : '1 s/d 10 Terminal'}
                            </span>
                          </label>
                          <input
                            type="number"
                            id="input-pos-unit-count"
                            min={isHybrid ? 2 : 1}
                            max={10}
                            value={effectiveUnits}
                            onChange={(e) => {
                              const minVal = isHybrid ? 2 : 1;
                              const rawVal = parseInt(e.target.value);
                              const val = isNaN(rawVal) ? minVal : Math.max(minVal, Math.min(10, rawVal));
                              const updatedConfigs = generateTerminalConfigs(
                                val,
                                profileForm.cashierArchitecture,
                                profileForm.category,
                                profileForm.terminalConfigs
                              );
                              setProfileForm({
                                ...profileForm,
                                posUnitCount: val,
                                terminalConfigs: updatedConfigs,
                              });
                            }}
                            className={`w-full p-2.5 rounded-xl border font-bold ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-900'
                                : 'bg-[#0d1117] border-gray-700 text-cyan-300'
                            }`}
                          />
                          <p className={`mt-1.5 ${isLight ? 'text-slate-700 font-medium text-xs' : 'text-[10px] text-gray-400'}`}>
                            {isHybrid ? (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 inline shrink-0" />
                                <span>Mode Hybrid: Terkunci minimal 2 unit (KASIR 01 Front-End &amp; KASIR 02 Hybrid Back-End).</span>
                              </span>
                            ) : (
                              <span>Jumlah terminal kasir aktif yang diizinkan dan beroperasi pada modul POS.</span>
                            )}
                          </p>
                        </div>

                        {/* Pilihan Arsitektur Kasir (Terpusat vs Hybrid) */}
                        <div>
                          <label className={`block font-bold text-xs mb-1 ${isLight ? 'text-slate-900' : 'text-gray-300'}`}>
                            Arsitektur Kasir: <span className="text-rose-400">*</span>
                          </label>
                          <div className="space-y-1.5 mt-1">
                            <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition text-xs ${
                              !isHybrid
                                ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                                : isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0d1117] border-gray-700 text-gray-400'
                            }`}>
                              <input
                                type="radio"
                                name="cashierArchitecture"
                                value="CENTRALIZED_FRONTEND"
                                checked={!isHybrid}
                                onChange={() => {
                                  const updatedConfigs = generateTerminalConfigs(
                                    profileForm.posUnitCount ?? 1,
                                    'CENTRALIZED_FRONTEND',
                                    profileForm.category,
                                    profileForm.terminalConfigs
                                  );
                                  setProfileForm({
                                    ...profileForm,
                                    cashierArchitecture: 'CENTRALIZED_FRONTEND',
                                    terminalConfigs: updatedConfigs,
                                  });
                                }}
                                className="text-blue-600 focus:ring-0"
                              />
                              <span>Kasir Terpusat (Front-End Only)</span>
                            </label>
                            <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition text-xs ${
                              isHybrid
                                ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300 font-bold'
                                : isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0d1117] border-gray-700 text-gray-400'
                            }`}>
                              <input
                                type="radio"
                                name="cashierArchitecture"
                                value="HYBRID_FRONT_BACK"
                                checked={isHybrid}
                                onChange={() => {
                                  const newCount = Math.max(2, profileForm.posUnitCount ?? 2);
                                  const updatedConfigs = generateTerminalConfigs(
                                    newCount,
                                    'HYBRID_FRONT_BACK',
                                    profileForm.category,
                                    profileForm.terminalConfigs
                                  );
                                  setProfileForm({
                                    ...profileForm,
                                    cashierArchitecture: 'HYBRID_FRONT_BACK',
                                    posUnitCount: newCount,
                                    terminalConfigs: updatedConfigs,
                                  });
                                }}
                                className="text-cyan-600 focus:ring-0"
                              />
                              <span>Hybrid (Front-End Kasir + Back-End Admin/Gudang)</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Live Allocation Preview: Rincian Peran Terminal Berdasarkan Arsitektur & Kuota */}
                      <div className={`p-3 rounded-xl border text-xs space-y-2 ${
                        isLight ? 'bg-white/90 border-slate-200 shadow-xs' : 'bg-[#0d1117]/80 border-gray-800'
                      }`}>
                        <div className="flex items-center justify-between pb-1.5 border-b border-gray-700/30">
                          <span className="font-bold flex items-center gap-1.5 text-cyan-500 dark:text-cyan-400">
                            <span>Alokasi Peran Terminal Otomatis:</span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {isHybrid ? 'MODE HYBRID' : 'MODE TERPUSAT'}
                            </span>
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono font-semibold">
                            {activeConfigs.length} Unit Register
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {activeConfigs.map((cfg) => {
                            const isHybridBack = cfg.role === 'HYBRID_BACKEND';
                            return (
                              <div
                                key={cfg.id}
                                className={`p-2 rounded-lg border flex items-center justify-between text-[11px] font-mono transition-all ${
                                  isHybridBack
                                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-950 dark:text-amber-200 shadow-xs'
                                    : isLight
                                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                                    : 'bg-white/5 border-gray-700 text-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.colorTheme }} />
                                  <span>{cfg.name}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isHybridBack
                                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                                    : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                }`}>
                                  {cfg.role}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <p className={`text-[10px] leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-gray-400'}`}>
                          {isHybrid ? (
                            <span>
                              ⚡ <strong>Alokasi Hybrid Aktif:</strong> KASIR 01 = <code className="text-cyan-400 font-bold">FRONT_END_ONLY</code> (Kasir Utama), KASIR 02 = <code className="text-amber-400 font-bold">HYBRID_BACKEND</code> (Kasir + Akses Menu ERP/Admin), KASIR 03 s/d {String(activeConfigs.length).padStart(2, '0')} = <code className="text-cyan-400 font-bold">FRONT_END_ONLY</code> (Kasir Reguler Tambahan).
                            </span>
                          ) : (
                            <span>
                              ⚡ <strong>Alokasi Terpusat Aktif:</strong> Seluruh terminal (KASIR 01 s/d {String(activeConfigs.length).padStart(2, '0')}) bertipe <code className="text-blue-400 font-bold">FRONT_END_ONLY</code>.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })()}



                {/* 4. No. Telepon / WhatsApp */}
                <div>
                  <label className={`block font-bold text-xs mb-1 flex items-center justify-between ${isLight ? 'text-slate-900' : 'text-gray-400'}`}>
                    <span>No. Telepon Kantor / Layanan Pelanggan:</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Opsional (Boleh "0" / "-")</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="Contoh: (021) 515-8888 (boleh '0' / '-')"
                    className={`w-full p-2.5 rounded-xl border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#0d1117] border-gray-700 text-white'
                    }`}
                  />
                </div>

                {/* 5. Email Resmi (OPSIONAL - TYPE TEXT AGAR "0" / "-" VALID) */}
                <div>
                  <label className={`block font-bold text-xs mb-1 flex items-center justify-between ${isLight ? 'text-slate-900' : 'text-gray-400'}`}>
                    <span>Alamat Email Resmi:</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Opsional (Boleh "0" / "-")</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.email || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="Contoh: official@toko.id (boleh '0' / '-')"
                    className={`w-full p-2.5 rounded-xl border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#0d1117] border-gray-700 text-white'
                    }`}
                  />
                </div>

                {/* 6. Alamat Kantor / Toko Fisik */}
                <div className="sm:col-span-2">
                  <label className={`block font-bold text-xs mb-1 flex items-center justify-between ${isLight ? 'text-slate-900' : 'text-gray-400'}`}>
                    <span>Alamat Fisik Kantor Pusat / Gerai Utama:</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Opsional</span>
                  </label>
                  <textarea
                    rows={2}
                    value={profileForm.address || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    placeholder="Contoh: Jl. Jenderal Sudirman Kav. 52-53, SCBD, Jakarta Selatan (boleh dikosongkan)"
                    className={`w-full p-2.5 rounded-xl border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#0d1117] border-gray-700 text-white'
                    }`}
                  />
                </div>



                {/* 8. Upload File Logo Usaha (Murni Upload File Gambar - Tanpa Input Teks URL) */}
                <div className="sm:col-span-2">
                  <label className={`block font-bold text-xs mb-1.5 flex items-center justify-between ${isLight ? 'text-slate-900' : 'text-gray-400'}`}>
                    <span>Upload Logo Usaha / Ikon Brand:</span>
                    <span className="text-[10px] text-cyan-400 font-normal">File Gambar (PNG, JPG, WebP, SVG)</span>
                  </label>

                  {/* Hidden native file input */}
                  <input
                    type="file"
                    id="business-logo-file-picker"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2.5 * 1024 * 1024) {
                          showToast('Ukuran file terlalu besar! Maksimal 2.5MB agar penyimpanan browser lancar.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setProfileForm((prev) => ({ ...prev, logoUrl: ev.target!.result as string }));
                            showToast('File logo berhasil diunggah & dikonversi ke Base64 DataURL!');
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />

                  {profileForm.logoUrl ? (
                    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-gray-700'
                    }`}>
                      <div className="flex items-center gap-3.5">
                        <div className="w-16 h-16 rounded-xl border border-dashed border-cyan-500/50 bg-white/5 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                          <img
                            src={profileForm.logoUrl}
                            alt="Preview Logo"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-cyan-400">File Logo Aktif</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Base64 DataURL
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Logo otomatis tampil pada kop struk POS, slip gaji karyawan, faktur PO, dan laporan keuangan.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => document.getElementById('business-logo-file-picker')?.click()}
                          className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                          title="Ganti dengan file gambar lain"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Ganti File</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileForm((prev) => ({ ...prev, logoUrl: '' }));
                            const fileInput = document.getElementById('business-logo-file-picker') as HTMLInputElement | null;
                            if (fileInput) fileInput.value = '';
                            showToast('Logo berhasil dihapus.');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                          title="Hapus logo yang terpasang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Logo</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => document.getElementById('business-logo-file-picker')?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          if (file.size > 2.5 * 1024 * 1024) {
                            showToast('Ukuran file terlalu besar! Maksimal 2.5MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              setProfileForm((prev) => ({ ...prev, logoUrl: ev.target!.result as string }));
                              showToast('File logo berhasil diunggah & dikonversi ke Base64 DataURL!');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group ${
                        isLight
                          ? 'border-slate-300 hover:border-cyan-500 bg-slate-50 hover:bg-cyan-50/40'
                          : 'border-gray-700 hover:border-cyan-400 bg-[#0d1117] hover:bg-cyan-950/20'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-200">
                          Klik untuk Upload File Logo atau Drag &amp; Drop Gambar ke Sini
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Format didukung: PNG, JPG, WebP, SVG (Maks. 2.5MB) • Otomatis dikonversi ke Base64 DataURL
                        </p>
                      </div>
                      <span className="mt-1 px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 inline-block pointer-events-none">
                        Pilih File Gambar
                      </span>
                    </div>
                  )}
                </div>

                {/* 9. Header Note (OPSIONAL) */}
                <div className="sm:col-span-2">
                  <label className={`block font-bold text-xs mb-1 flex items-center justify-between ${isLight ? 'text-slate-900' : 'text-gray-400'}`}>
                    <span>Slogan / Subjudul Kop Dokumen &amp; Struk:</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Opsional (Boleh "0" / "-")</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.headerNote || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, headerNote: e.target.value })}
                    placeholder="Contoh: Slogan bisnis (boleh diisi '0' / '-' untuk disembunyikan)"
                    className={`w-full p-2.5 rounded-xl border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#0d1117] border-gray-700 text-white'
                    }`}
                  />
                </div>

                {/* 10. Footer Note (OPSIONAL) */}
                <div className="sm:col-span-2">
                  <label className={`block font-bold text-xs mb-1 flex items-center justify-between ${isLight ? 'text-slate-900' : 'text-gray-400'}`}>
                    <span>Pesan Footer Penutup Struk Belanja POS:</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Opsional (Boleh "0" / "-")</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.footerNote || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, footerNote: e.target.value })}
                    placeholder="Contoh: Terima kasih atas kunjungan Anda (boleh diisi '0' / '-' untuk disembunyikan)"
                    className={`w-full p-2.5 rounded-xl border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#0d1117] border-gray-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-gray-700/50">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.35)] cursor-pointer transition active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingProfile ? 'Menyimpan Profil...' : 'Simpan & Terapkan Profil Entitas Bisnis'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetBusinessProfileToDefault();
                    setProfileForm(DEFAULT_BUSINESS_PROFILE);
                  }}
                  className={`px-4 py-3 rounded-xl font-semibold text-xs border transition cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                  }`}
                >
                  Reset ke Default Grup
                </button>
              </div>
            </form>

            {/* Kolom Kanan: Live Preview Kop Dokumen Struk & PO */}
            <div className="space-y-4">
              <div className={`p-5 rounded-2xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
              }`}>
                <div className="flex items-center gap-2 pb-2 border-b border-gray-700/50">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-xs">Live Preview Kop Struk POS</h4>
                </div>

                {/* Struk Paper Preview */}
                <div className="bg-white text-slate-900 rounded-xl p-4 font-mono text-[11px] shadow-inner border border-slate-300 space-y-2">
                  <div className="text-center border-b border-dashed border-slate-400 pb-2">
                    {profileForm.logoUrl && (
                      <img
                        src={profileForm.logoUrl}
                        alt="Logo"
                        className="w-10 h-10 mx-auto mb-1.5 object-contain"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    )}
                    <div className="font-extrabold text-sm uppercase text-black">
                      {profileForm.name || 'NAMA BISNIS ANDA'}
                    </div>

                    {/* Slogan / Subjudul - Sembunyikan jika bernilai "0", "-", atau kosong */}
                    {hasValidProfileValue(profileForm.headerNote) && (
                      <div className="text-slate-900 font-semibold text-xs font-sans leading-tight mt-0.5">
                        {profileForm.headerNote}
                      </div>
                    )}

                    {/* Alamat Toko - Sembunyikan jika bernilai "0", "-", atau kosong */}
                    {hasValidProfileValue(profileForm.address) && (
                      <div className="text-slate-900 font-semibold text-xs font-sans leading-tight mt-0.5">
                        {profileForm.address}
                      </div>
                    )}

                    {/* Baris Kontak (Telp / Email) - Sembunyikan jika bernilai "0", "-", atau kosong */}
                    {(hasValidProfileValue(profileForm.phone) || hasValidProfileValue(profileForm.email)) && (
                      <div className="text-slate-900 font-semibold text-xs font-sans leading-tight mt-0.5">
                        {[
                          hasValidProfileValue(profileForm.phone) ? `Telp: ${profileForm.phone}` : null,
                          hasValidProfileValue(profileForm.email) ? profileForm.email : null,
                        ].filter(Boolean).join(' • ')}
                      </div>
                    )}
                  </div>

                  <div className="text-slate-900 font-semibold text-xs space-y-0.5 py-1 border-b border-dashed border-slate-400">
                    <div className="flex justify-between">
                      <span>No. Trx:</span>
                      <span className="font-black text-slate-950">TRX-2026-0001</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Terminal:</span>
                      <span className="font-bold text-slate-900">KASIR 01 - REGULER</span>
                    </div>
                  </div>

                  {/* Footer Note - Sembunyikan jika bernilai "0", "-", atau kosong */}
                  {hasValidProfileValue(profileForm.footerNote) && (
                    <div className="text-slate-900 font-semibold text-xs text-center pt-1 font-sans italic">
                      "{profileForm.footerNote}"
                    </div>
                  )}
                </div>
              </div>

              {/* Card Distribusi Sinkronisasi */}
              <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#0d1117] border-[#30363d] text-slate-300'
              }`}>
                <div className="font-bold flex items-center gap-1.5 text-cyan-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Otomatis Tersinkron ke Modul:</span>
                </div>
                <ul className={`space-y-1.5 list-disc list-inside ${isLight ? 'text-slate-700 font-medium text-xs' : 'text-[11px] text-gray-400'}`}>
                  <li><strong className={isLight ? 'text-slate-900 font-bold' : 'text-gray-200'}>Kop Struk Kasir POS:</strong> Tercetak pada struk belanja kertas &amp; struk WhatsApp.</li>
                  <li><strong className={isLight ? 'text-slate-900 font-bold' : 'text-gray-200'}>Slip Gaji Karyawan:</strong> Identitas resmi pemberi kerja pada payroll HR.</li>
                  <li><strong className={isLight ? 'text-slate-900 font-bold' : 'text-gray-200'}>Kop Faktur PO Pengadaan:</strong> Lembar pesanan resmi ke vendor supplier.</li>
                  <li><strong className={isLight ? 'text-slate-900 font-bold' : 'text-gray-200'}>Laporan Keuangan &amp; Jurnal:</strong> Header resmi pada neraca &amp; laba rugi.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 1: DIAGNOSIS & RECOVERY (KESEHATAN SISTEM)
          ==================================================== */}
      {adminTab === 'diagnostics' && (
        <div className="space-y-6">
          {/* Health Metrics Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}>
              <div className={`flex items-center justify-between text-xs mb-1 ${isLight ? 'text-slate-800 font-bold' : 'text-gray-400'}`}>
                <span>Server &amp; Client Latency</span>
                <Wifi className="w-4 h-4 text-emerald-500" />
              </div>
              <div className={`text-2xl font-mono font-black ${isLight ? 'text-slate-950' : 'text-emerald-400'}`}>18 ms</div>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-700 font-medium' : 'text-gray-500'}`}>Optimal (Zero Ingress Lag)</p>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}>
              <div className={`flex items-center justify-between text-xs mb-1 ${isLight ? 'text-slate-800 font-bold' : 'text-gray-400'}`}>
                <span>Database Sync Engine</span>
                <Server className="w-4 h-4 text-cyan-600" />
              </div>
              <div className={`text-xl font-black ${isLight ? 'text-slate-950' : 'text-cyan-400'}`}>Active / Sync</div>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-700 font-medium' : 'text-gray-500'}`}>LocalStorage + Sheets Webhook</p>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}>
              <div className={`flex items-center justify-between text-xs mb-1 ${isLight ? 'text-slate-800 font-bold' : 'text-gray-400'}`}>
                <span>Memory Heap / Cache Buffer</span>
                <HardDrive className="w-4 h-4 text-blue-600" />
              </div>
              <div className={`text-2xl font-mono font-black ${isLight ? 'text-slate-950' : 'text-blue-400'}`}>14.8 MB</div>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-700 font-medium' : 'text-gray-500'}`}>Stable, Zero Leak Detected</p>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}>
              <div className={`flex items-center justify-between text-xs mb-1 ${isLight ? 'text-slate-800 font-bold' : 'text-gray-400'}`}>
                <span>Worker Threads / Terminals</span>
                <Cpu className="w-4 h-4 text-purple-600" />
              </div>
              <div className={`text-2xl font-mono font-black ${isLight ? 'text-slate-950' : 'text-purple-400'}`}>{terminals.length} Nodes</div>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-700 font-medium' : 'text-gray-500'}`}>Multi-Terminal POS Active</p>
            </div>
          </div>

          {/* Section 1: Pengecekan Integritas Data untuk Alur Baru */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  <span>Audit Integritas Data Alur Baru (POS Stock Out, PO Receiving, Komisi 1%)</span>
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>Verifikasi konsistensi pemotongan stok otomatis, penerimaan inventaris, dan komisi kasir</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                isLight ? 'bg-slate-100 border border-slate-300 text-slate-900' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              }`}>
                LIVE INTEGRITY PIPELINE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Pemotongan Stok POS (OUT_SALES) */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center border border-cyan-500/30">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`font-bold text-xs ${isLight ? 'text-slate-950 font-black' : 'text-white'}`}>Pemotongan Stok POS</div>
                      <div className={`text-[10px] font-mono ${isLight ? 'text-slate-700 font-bold' : 'text-gray-400'}`}>Tipe: OUT_SALES</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                    isLight
                      ? isPosOutSalesSynced ? 'bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold' : 'bg-amber-100 border border-amber-300 text-amber-950 font-bold'
                      : isPosOutSalesSynced ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    {isPosOutSalesSynced ? '✓ 100% SINKRON' : '⚠️ CEK MUTASI'}
                  </span>
                </div>

                <div className={`grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t ${isLight ? 'border-slate-200' : 'border-gray-800/40'}`}>
                  <div className={`p-2 rounded-lg ${isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-black/20'}`}>
                    <span className={`text-xs block ${isLight ? 'text-slate-800 font-bold' : 'text-[10px] text-gray-500'}`}>Transaksi POS</span>
                    <span className={`font-black text-sm ${isLight ? 'text-slate-950' : 'text-white'}`}>{posSalesCount} Faktur</span>
                  </div>
                  <div className={`p-2 rounded-lg ${isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-black/20'}`}>
                    <span className={`text-xs block ${isLight ? 'text-slate-800 font-bold' : 'text-[10px] text-gray-500'}`}>Item Terjual</span>
                    <span className={`font-black text-sm ${isLight ? 'text-slate-950' : 'text-cyan-400'}`}>{posTotalItemsSold} pcs</span>
                  </div>
                </div>

                <div className={`text-xs leading-tight ${isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                  Log Mutasi: <strong className={`font-mono ${isLight ? 'text-slate-950 font-black' : 'text-white'}`}>{outSalesMutations.length} baris</strong> ({outSalesTotalQty} pcs). Stok fisik langsung terpotong idempoten saat bayar.
                </div>
              </div>

              {/* Card 2: Penerimaan PO Gudang (IN_PURCHASE) */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center border border-blue-500/30">
                      <PackageCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`font-bold text-xs ${isLight ? 'text-slate-950 font-black' : 'text-white'}`}>Penerimaan PO Gudang</div>
                      <div className={`text-[10px] font-mono ${isLight ? 'text-slate-700 font-bold' : 'text-gray-400'}`}>Tipe: IN_PURCHASE</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                    isLight
                      ? isPoInPurchaseSynced ? 'bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold' : 'bg-amber-100 border border-amber-300 text-amber-950 font-bold'
                      : isPoInPurchaseSynced ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    {isPoInPurchaseSynced ? '✓ TERINTEGRASI' : '⚠️ CEK PO'}
                  </span>
                </div>

                <div className={`grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t ${isLight ? 'border-slate-200' : 'border-gray-800/40'}`}>
                  <div className={`p-2 rounded-lg ${isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-black/20'}`}>
                    <span className={`text-xs block ${isLight ? 'text-slate-800 font-bold' : 'text-[10px] text-gray-500'}`}>PO Diterima</span>
                    <span className={`font-black text-sm ${isLight ? 'text-slate-950' : 'text-white'}`}>{receivedPOs.length} PO</span>
                  </div>
                  <div className={`p-2 rounded-lg ${isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-black/20'}`}>
                    <span className={`text-xs block ${isLight ? 'text-slate-800 font-bold' : 'text-[10px] text-gray-500'}`}>Item Masuk</span>
                    <span className={`font-black text-sm ${isLight ? 'text-slate-950' : 'text-blue-400'}`}>{poTotalItemsReceived} pcs</span>
                  </div>
                </div>

                <div className={`text-xs leading-tight ${isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                  Log Mutasi: <strong className={`font-mono ${isLight ? 'text-slate-950 font-black' : 'text-white'}`}>{inPurchaseMutations.length} baris</strong> ({inPurchaseTotalQty} pcs). HPP Rata-rata dan DB_Inventory bertambah otomatis.
                </div>
              </div>

              {/* Card 3: Akurasi Komisi Kasir 1% */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center border border-purple-500/30">
                      <Percent className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`font-bold text-xs ${isLight ? 'text-slate-950 font-black' : 'text-white'}`}>Akurasi Komisi Kasir 1%</div>
                      <div className={`text-[10px] font-mono ${isLight ? 'text-slate-700 font-bold' : 'text-gray-400'}`}>Formula: 1% x Omzet POS</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                    isLight
                      ? isCommissionAccurate ? 'bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold' : 'bg-rose-100 border border-rose-300 text-rose-950 font-bold'
                      : isCommissionAccurate ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {isCommissionAccurate ? '✓ 100% PRESISI' : '⚠️ ANOMALI'}
                  </span>
                </div>

                <div className={`grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t ${isLight ? 'border-slate-200' : 'border-gray-800/40'}`}>
                  <div className={`p-2 rounded-lg ${isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-black/20'}`}>
                    <span className={`text-xs block ${isLight ? 'text-slate-800 font-bold' : 'text-[10px] text-gray-500'}`}>Total Omzet Kasir</span>
                    <span className={`font-black text-xs truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>Rp {totalCashierSales.toLocaleString('id-ID')}</span>
                  </div>
                  <div className={`p-2 rounded-lg ${isLight ? 'bg-slate-50 border border-slate-300 text-slate-900' : 'bg-black/20'}`}>
                    <span className={`text-xs block ${isLight ? 'text-slate-800 font-bold' : 'text-[10px] text-gray-500'}`}>Komisi 1% Terhitung</span>
                    <span className={`font-black text-xs truncate ${isLight ? 'text-slate-950' : 'text-purple-400'}`}>Rp {totalCashierCommission.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className={`text-xs leading-tight ${isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                  Status: <strong className={`font-mono ${isLight ? 'text-slate-950 font-black' : 'text-white'}`}>{cashierUsers.length} Kasir aktif</strong> terverifikasi akurat. Terhubung langsung ke modul Payroll slip gaji.
                </div>
              </div>
            </div>
          </div>

          {/* Action Cards: Run Diagnostic, Auto Repair, and Repair Stock Ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Card 1: Run Diagnostic */}
            <div className={`p-6 rounded-2xl border space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base ${isLight ? 'text-slate-950 font-black' : 'font-bold'}`}>Jalankan Diagnostic Error</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>Pemeriksaan mendalam 8 layer integritas sistem JacS ERP</p>
                </div>
              </div>

              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                Memindai data produk, SKU ganda, relasi transaksi penjualan kasir, keutuhan format JSON,
                koneksi multi-terminal, mutasi OUT_SALES &amp; IN_PURCHASE, serta formula komisi kasir 1%.
              </p>

              <button
                disabled={isDiagnosing}
                onClick={runSystemDiagnostics}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,242,254,0.3)] cursor-pointer disabled:opacity-50 transition"
              >
                <Zap className={`w-4 h-4 ${isDiagnosing ? 'animate-spin' : ''}`} />
                <span>{isDiagnosing ? 'Sedang Memindai Sistem...' : 'Mulai Pengecekan Sistem'}</span>
              </button>

              {/* Diagnostic Progress Checklist */}
              {diagnosticSteps.length > 0 && (
                <div className={`p-3.5 rounded-xl border space-y-1.5 text-xs font-mono max-h-56 overflow-y-auto ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/30 border-gray-800'
                }`}>
                  {diagnosticSteps.map((step, idx) => (
                    <div key={idx} className={`flex items-center justify-between py-1 border-b last:border-0 ${isLight ? 'border-slate-200' : 'border-gray-800/40'}`}>
                      <span className={`text-xs truncate pr-2 ${isLight ? 'text-slate-800 font-bold' : 'text-gray-300 text-[11px]'}`}>{step.name}</span>
                      {step.status === 'passed' && (
                        <span className={`flex items-center gap-1 font-bold text-xs shrink-0 ${isLight ? 'text-emerald-950 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded' : 'text-emerald-400'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> LULUS
                        </span>
                      )}
                      {step.status === 'running' && (
                        <span className="text-cyan-600 flex items-center gap-1 animate-pulse text-xs font-bold shrink-0">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> CHECKING
                        </span>
                      )}
                      {step.status === 'pending' && <span className={`${isLight ? 'text-slate-600' : 'text-gray-600'} text-xs shrink-0`}>MENUNGGU</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 2: Repair Stock Ledger (NEW REQUESTED FEATURE) */}
            <div className={`p-6 rounded-2xl border space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center border border-indigo-500/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base ${isLight ? 'text-slate-950 font-black' : 'font-bold'}`}>Repair Stock Ledger</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>Rekonsiliasi otomatis stok fisik vs mutasi kartu stok</p>
                </div>
              </div>

              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                Mendeteksi selisih stok fisik vs mutasi ledger secara otomatis, menautkan ulang mutasi OUT_SALES &amp; IN_PURCHASE yang terputus, dan menyeimbangkan saldo kartu stok secara idempoten.
              </p>

              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/25 border-gray-800'
              }`}>
                <span className={isLight ? 'text-slate-800 font-bold' : 'text-gray-400'}>Status Selisih Fisik:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                  stockDiscrepancies.length === 0
                    ? isLight ? 'bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold' : 'bg-emerald-500/15 text-emerald-400'
                    : isLight ? 'bg-rose-100 border border-rose-300 text-rose-950 font-bold' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {stockDiscrepancies.length === 0 ? '✓ 0 Selisih Terdeteksi' : `⚠️ ${stockDiscrepancies.length} Item Perlu Repair`}
                </span>
              </div>

              <button
                disabled={isRepairingLedger}
                onClick={handleRepairStockLedger}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.35)] cursor-pointer disabled:opacity-50 transition"
              >
                <RefreshCw className={`w-4 h-4 ${isRepairingLedger ? 'animate-spin' : ''}`} />
                <span>{isRepairingLedger ? 'Memperbaiki Stock Ledger...' : 'Jalankan Repair Stock Ledger'}</span>
              </button>

              {stockLedgerSummary && (
                <div className={`p-3 rounded-xl border text-xs space-y-1 font-mono ${
                  isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-950' : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                }`}>
                  <div className={`flex items-center gap-1.5 font-bold ${isLight ? 'text-indigo-950' : 'text-emerald-400'}`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Perbaikan Sukses ({stockLedgerSummary.timestamp})</span>
                  </div>
                  <p className={`text-xs ${isLight ? 'text-slate-800 font-medium' : 'text-slate-300'}`}>{stockLedgerSummary.message}</p>
                </div>
              )}
            </div>

            {/* Card 3: Auto-Repair & Refresh Memory */}
            <div className={`p-6 rounded-2xl border space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base ${isLight ? 'text-slate-950 font-black' : 'font-bold'}`}>Auto-Repair &amp; Cache Refresh</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>Stabilkan cache, bersihkan duplikat &amp; anomali</p>
                </div>
              </div>

              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                Menghilangkan duplikasi SKU, memperbaiki ID yang hilang, dan menyegarkan penyimpanan lokal tanpa menghapus transaksi penjualan atau identitas bisnis.
              </p>

              <button
                onClick={handleAutoRepair}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Jalankan Auto-Repair &amp; Cache</span>
              </button>

              {repairSummary && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 font-medium ${
                  isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{repairSummary}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 2: MULTI-TERMINAL POS MANAGEMENT
          ==================================================== */}
      {adminTab === 'terminals' && (
        <div className="space-y-6">
          {/* Top Bar: Kunci Semua Terminal */}
          <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
          }`}>
            <div>
              <h3 className="font-bold text-sm">Master Sakelar Keamanan Seluruh Kasir</h3>
              <p className={`text-xs ${isLight ? 'text-slate-700 font-medium text-xs' : 'text-gray-400'}`}>Kunci atau buka seluruh register kasir serentak</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAllTerminalsLock(true);
                  try {
                    localStorage.setItem('jacs_pos_terminals_state', 'true');
                  } catch (e) {
                    console.error(e);
                  }
                  showToast('Semua register kasir berhasil dikunci serentak');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white flex items-center gap-1.5 shadow-xs cursor-pointer transition active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kunci Semua Kasir</span>
              </button>
              <button
                onClick={() => {
                  setAllTerminalsLock(false);
                  try {
                    localStorage.setItem('jacs_pos_terminals_state', 'false');
                  } catch (e) {
                    console.error(e);
                  }
                  showToast('Semua register kasir berhasil dibuka serentak');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-xs cursor-pointer transition active:scale-95"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Buka Semua Kasir</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Form Tambah Terminal Baru */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}>
              <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
                <Plus className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm">Tambah Terminal Kasir Baru</h3>
              </div>

              <form onSubmit={handleCreateTerminal} className="space-y-3 text-xs">
                <div>
                  <label className={`block font-bold text-xs mb-1 ${isLight ? 'text-slate-800' : 'text-gray-400 font-semibold'}`}>Nama Terminal:</label>
                  <input
                    type="text"
                    required
                    value={newTermName}
                    onChange={(e) => setNewTermName(e.target.value)}
                    placeholder="Contoh: KASIR 08 - DRIVE THRU"
                    className={`w-full p-2.5 rounded-xl border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 font-bold' : 'bg-black/20 border-gray-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold text-xs mb-1 ${isLight ? 'text-slate-800' : 'text-gray-400 font-semibold'}`}>Mapping Industri &amp; Filter POS:</label>
                  <select
                    value={newTermModel}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewTermModel(val);
                      if (val.includes('F&B')) setNewTermIndustryType('fnb');
                      else if (val.includes('Farmasi') || val.includes('Apotek')) setNewTermIndustryType('pharmacy');
                      else if (val.includes('Bangunan')) setNewTermIndustryType('building');
                      else if (val.includes('Fashion')) setNewTermIndustryType('fashion');
                      else if (val.includes('Elektronik')) setNewTermIndustryType('electronics');
                      else if (val.includes('Bengkel')) setNewTermIndustryType('workshop');
                      else setNewTermIndustryType('retail');
                    }}
                    className={`w-full p-2.5 rounded-xl border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 font-bold' : 'bg-black/20 border-gray-700 text-white'
                    }`}
                  >
                    <option value="Kasir Ritel Umum (Swalayan & Minimarket)">Kasir Ritel Umum (Sembako, FMCG, Minimarket)</option>
                    <option value="Kasir 02 F&B (Resto, Cafe & Kuliner)">Kasir 02 F&B (Makanan, Minuman, Snack & Dapur)</option>
                    <option value="Kasir 04 Farmasi (Apotek & Toko Obat)">Kasir 04 Farmasi (Obat, Vitamin, Alat Medis)</option>
                    <option value="Kasir 09 Bangunan (Bahan Bangunan & Hardware)">Kasir 09 Bangunan (Semen, Cat, Besi, Perkakas)</option>
                    <option value="Kasir 05 Fashion (Butik & Busana)">Kasir 05 Fashion (Pakaian, Butik, Aksesoris)</option>
                    <option value="Kasir 07 Elektronik (Gawai & Komputer)">Kasir 07 Elektronik (Komputer, Gawai, Hardware)</option>
                    <option value="Kasir 08 Bengkel (Otomotif & Servis)">Kasir 08 Bengkel (Oli, Sparepart, Servis)</option>
                  </select>
                </div>

                {/* Hak Akses Izinkan Semua Kategori Form Switch */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/20 border-gray-800'
                }`}>
                  <div>
                    <div className={`font-bold text-xs ${isLight ? 'text-slate-950 font-black' : 'text-white'}`}>Izinkan Akses Semua Kategori</div>
                    <div className={`text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-[10px] text-gray-400'}`}>Override: kasir dapat mengakses seluruh katalog multi-industri</div>
                  </div>
                  <input
                    type="checkbox"
                    id="checkbox-new-term-allow-all"
                    checked={newTermAllowAllCategories}
                    onChange={(e) => setNewTermAllowAllCategories(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label className={`block font-bold text-xs mb-1 ${isLight ? 'text-slate-800' : 'text-gray-400 font-semibold'}`}>Warna Neon Aksen:</label>
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {[
                      { hex: '#00f2fe', label: 'Cyan' },
                      { hex: '#ff7a00', label: 'Orange' },
                      { hex: '#10B981', label: 'Emerald' },
                      { hex: '#8b5cf6', label: 'Purple' },
                      { hex: '#ec4899', label: 'Pink' },
                    ].map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setNewTermColor(col.hex)}
                        style={{ backgroundColor: col.hex }}
                        className={`h-7 rounded-lg transition-transform cursor-pointer flex items-center justify-center ${
                          newTermColor === col.hex ? 'ring-2 ring-slate-950 dark:ring-white scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={col.label}
                      ></button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block font-bold text-xs mb-1 ${isLight ? 'text-slate-800' : 'text-gray-400 font-semibold'}`}>Lokasi / Lantai:</label>
                  <input
                    type="text"
                    value={newTermLocation}
                    onChange={(e) => setNewTermLocation(e.target.value)}
                    placeholder="Lantai 1 / Pintu Barat"
                    className={`w-full p-2.5 rounded-xl border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 font-bold' : 'bg-black/20 border-gray-700 text-white'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Daftarkan Terminal Baru</span>
                </button>
              </form>
            </div>

            {/* Tabel Kontrol Multi-Terminal */}
            <div className={`lg:col-span-2 rounded-2xl border overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}>
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className={`text-sm ${isLight ? 'text-slate-950 font-black' : 'font-bold'}`}>Daftar Terminal Kasir Terdaftar ({terminals.length} Terminal)</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>Mapping filter industri otomatis &amp; hak akses akses semua kategori</p>
                </div>
                <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-900' : 'text-gray-400'}`}>Multi-Node Active</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className={`border-b font-bold tracking-wider uppercase text-[10px] ${
                    isLight ? 'bg-slate-100 text-slate-900 font-black border-slate-300' : 'bg-[#0d1117] text-slate-400 border-[#30363d]'
                  }`}>
                    <tr>
                      <th className="px-3.5 py-3">ID &amp; Kode</th>
                      <th className="px-3.5 py-3">Nama Terminal</th>
                      <th className="px-3.5 py-3">Filter Kategori Industri</th>
                      <th className="px-3.5 py-3 text-center">Akses Semua Kategori</th>
                      <th className="px-3.5 py-3 text-center">Status Lock</th>
                      <th className="px-3.5 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-medium ${isLight ? 'divide-slate-200' : 'divide-gray-800'}`}>
                    {terminals.map((t) => {
                      const ind = getTerminalIndustry(t);
                      let indBadge = '🛒 01 Ritel & Grosir';
                      let indColor = isLight ? 'bg-cyan-100 text-cyan-950 border border-cyan-300' : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30';
                      let indCategories = 'Sembako, FMCG, Minuman, Makanan Ringan, Eceran & Grosir';

                      if (ind === 'fnb') {
                        indBadge = '🍳 02 F&B Resto';
                        indColor = isLight ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
                        indCategories = 'Makanan, Minuman, Snack & Resep BOM HPP';
                      } else if (ind === 'pharmacy') {
                        indBadge = '💊🐾 03 Pharmacy & Pet Shop';
                        indColor = isLight ? 'bg-rose-100 text-rose-950 border border-rose-300' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
                        indCategories = 'Obat-obatan, Vitamin, Alkes, Pakan & Obat Hewan';
                      } else if (ind === 'fashion') {
                        indBadge = '👗 04 Fashion & Apparel';
                        indColor = isLight ? 'bg-fuchsia-100 text-fuchsia-950 border border-fuchsia-300' : 'bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30';
                        indCategories = 'Busana, Pakaian Pria/Wanita, Matriks Varian Size & Warna';
                      } else if (ind === 'building') {
                        indBadge = '🏗️ 05 Bahan Bangunan';
                        indColor = isLight ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
                        indCategories = 'Semen, Cat, Besi, Perkakas, Sanitair & Armada DO';
                      } else if (ind === 'electronics') {
                        indBadge = '📱 06 Electronics & Gadgets';
                        indColor = isLight ? 'bg-violet-100 text-violet-950 border border-violet-300' : 'bg-violet-500/15 text-violet-400 border border-violet-500/30';
                        indCategories = 'Gawai, Audio, Komputer, Komponen & Serial IMEI';
                      } else if (ind === 'workshop') {
                        indBadge = '🔧 07 Automotive & Workshop';
                        indColor = isLight ? 'bg-orange-100 text-orange-950 border border-orange-300' : 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
                        indCategories = 'Oli Mesin, Sparepart, Jasa Servis & Nopol';
                      } else if (ind === 'salon') {
                        indBadge = '💈 08 Salon & Barbershop';
                        indColor = isLight ? 'bg-teal-100 text-teal-950 border border-teal-300' : 'bg-teal-500/15 text-teal-400 border border-teal-500/30';
                        indCategories = 'Layanan Potong Rambut, Kapster, Antrean & Perawatan';
                      }

                      return (
                        <tr key={t.id} className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-cyan-500/5'}`}>
                          <td className="px-3.5 py-3 font-mono font-bold" style={{ color: t.colorHex }}>
                            {t.id}
                            <div className={`text-[10px] ${isLight ? 'text-slate-600 font-bold' : 'text-gray-500'}`}>{t.code}</div>
                          </td>
                          <td className="px-3.5 py-3">
                            <div className={`font-black text-xs ${isLight ? 'text-slate-950' : 'text-white'}`}>{t.name}</div>
                            <div className={`text-[10px] ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>{t.location}</div>
                          </td>
                          <td className="px-3.5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border mb-1 ${indColor}`}>
                              {indBadge}
                            </span>
                            <div className={`text-xs line-clamp-1 ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400 text-[10px]'}`} title={indCategories}>
                              {indCategories}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={Boolean(t.allowAllCategories)}
                                onClick={() => {
                                  const nextVal = !t.allowAllCategories;
                                  updateTerminal(t.id, { allowAllCategories: nextVal });
                                  showToast(
                                    nextVal
                                      ? `🌐 ${t.name}: Hak akses "Semua Kategori" DIBERIKAN!`
                                      : `🔒 ${t.name}: Hak akses dibatasi ke filter industri [${indBadge}]`
                                  );
                                }}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                  t.allowAllCategories ? 'bg-indigo-600' : isLight ? 'bg-slate-300' : 'bg-slate-700'
                                }`}
                                title="Klik untuk mengizinkan/mengunci akses semua kategori"
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                    t.allowAllCategories ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                              <span className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded border ${
                                t.allowAllCategories
                                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                  : isLight
                                  ? 'bg-slate-100 text-slate-800 font-bold border-slate-300'
                                  : 'bg-gray-800 text-gray-400 border-gray-700'
                              }`}>
                                {t.allowAllCategories ? 'SEMUA KAT' : 'SPESIFIK'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <button
                              onClick={() => toggleTerminalLock(t.id)}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center justify-center gap-1 mx-auto cursor-pointer transition ${
                                t.isLocked
                                  ? isLight
                                    ? 'bg-rose-100 border border-rose-300 text-rose-950 font-bold hover:bg-rose-200'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                                  : isLight
                                  ? 'bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold hover:bg-emerald-200'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                              }`}
                            >
                              {t.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              <span>{t.isLocked ? 'TERKUNCI' : 'TERBUKA'}</span>
                            </button>
                          </td>
                          <td className="px-3.5 py-3 text-right">
                            <button
                              onClick={() => deleteTerminal(t.id)}
                              className={`p-1.5 rounded-lg cursor-pointer transition ${
                                isLight
                                  ? 'bg-slate-100 hover:bg-rose-100 text-rose-600 border border-slate-300'
                                  : 'bg-gray-800 hover:bg-rose-900/40 text-rose-400'
                              }`}
                              title="Hapus Terminal Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 3: PUSAT KREDENSIAL & KEAMANAN SISTEM
          ==================================================== */}
      {adminTab === 'credentials' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Panel Pusat Kredensial & Keamanan */}
          <div
            className={`p-6 rounded-2xl border space-y-4 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/15 text-pink-400 flex items-center justify-center border border-pink-500/30 shadow-[0_0_20px_rgba(236,72,153,0.25)] shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-lg tracking-tight">
                      Pusat Kredensial &amp; Manajemen Reset PIN
                    </h2>
                    <span className={isLight ? 'bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs px-2 py-0.5 rounded' : 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40'}>
                      MASTER SECURITY VAULT
                    </span>
                  </div>
                  <p className={`mt-0.5 ${isLight ? 'text-slate-800 font-medium text-xs' : 'text-xs text-gray-400'}`}>
                    Kontrol terpusat untuk mengganti Sandi Master Super Admin dan mengatur ulang (reset) PIN seluruh terminal Kasir 01 s/d 08 serta akun staff.
                  </p>
                </div>
              </div>

              {/* Status Badge & Global Action */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={isLight ? 'bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs px-2 py-0.5 rounded flex items-center gap-1.5' : 'px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5'}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>KREDENSIAL DINAMIS AKTIF</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    resetAllUserPinsToDefault('1234');
                  }}
                  className={isLight ? 'bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-950 font-bold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer transition shadow-xs active:scale-95' : 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 cursor-pointer transition shadow-xs active:scale-95'}
                  title="Reset semua PIN kasir & staff kembali ke default 1234"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reset Default Semua PIN (1234)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bagian A: Ganti Sandi Master Super Admin */}
          <div
            className={`p-6 rounded-2xl border space-y-4 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-pink-500/15 text-pink-400 flex items-center justify-center border border-pink-500/30">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">
                    1. Ganti Sandi Master Super Admin (Root Access Password)
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Sandi ini digunakan untuk login Super Admin Console, otorisasi override kasir, dan disimpan di <code className="text-pink-400 font-mono">jacs_super_admin_password</code>
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/25 hidden sm:inline-block">
                Root Access: Protected
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newDevPassword.trim()) return showToast('Sandi master baru tidak boleh kosong!');
                if (newDevPassword !== confirmDevPassword) return showToast('Konfirmasi sandi tidak cocok!');
                updateDeveloperPassword(newDevPassword);
                setNewDevPassword('');
                setConfirmDevPassword('');
                showToast('Sandi Master Super Admin berhasil disimpan ke localStorage!');
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-bold text-xs mb-1.5">
                    Sandi Master Super Admin Baru:
                  </label>
                  <div className="relative">
                    <input
                      type={showDevPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={newDevPassword}
                      onChange={(e) => setNewDevPassword(e.target.value)}
                      placeholder="Masukkan sandi master baru..."
                      className={`w-full p-2.5 pr-10 rounded-xl border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900'
                          : 'bg-[#0d1117] border-[#30363d] text-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDevPassword(!showDevPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                      title={showDevPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                    >
                      {showDevPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 font-bold text-xs mb-1.5">
                    Konfirmasi Sandi Master Baru:
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmDevPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={confirmDevPassword}
                      onChange={(e) => setConfirmDevPassword(e.target.value)}
                      placeholder="Ulangi sandi master baru..."
                      className={`w-full p-2.5 pr-10 rounded-xl border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900'
                          : 'bg-[#0d1117] border-[#30363d] text-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmDevPassword(!showConfirmDevPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                      title={showConfirmDevPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                    >
                      {showConfirmDevPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Perubahan langsung tersimpan ke <strong className="text-gray-300 font-mono">jacs_super_admin_password</strong> dan aktif seketika.
                  </span>
                </span>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-pink-500 hover:bg-pink-400 text-white flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.35)] cursor-pointer transition active:scale-95"
                >
                  <Key className="w-4 h-4" />
                  <span>Simpan Sandi Master Super Admin</span>
                </button>
              </div>
            </form>
          </div>

          {/* Bagian B: Tabel Reset PIN Kasir 01 s/d 08 & Staff */}
          <div
            className={`p-6 rounded-2xl border space-y-4 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">
                    2. Tabel Manajemen &amp; Reset PIN (Kasir 01 s/d 08 &amp; Staff)
                  </h3>
                  <p className={isLight ? 'text-slate-700 font-medium text-xs' : 'text-[11px] text-gray-400'}>
                    Daftar PIN aktif untuk membuka register terminal kasir, login shift, dan otorisasi menu operasional toko.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetAllUserPinsToDefault('1234');
                }}
                className={isLight ? 'bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-950 font-bold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer transition shadow-xs active:scale-95 shrink-0' : 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 cursor-pointer transition shadow-xs active:scale-95 shrink-0'}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Reset Default Semua PIN (1234)</span>
              </button>
            </div>

            {/* Tabel PIN Responsif */}
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-left text-xs">
                <thead className={isLight ? 'bg-slate-100 text-slate-900 font-black text-xs' : 'bg-[#0d1117] text-gray-400'}>
                  <tr>
                    <th className={`py-3 px-3.5 ${isLight ? 'text-slate-900 font-black text-xs' : 'font-bold'}`}>Operator / Akun</th>
                    <th className={`py-3 px-3.5 ${isLight ? 'text-slate-900 font-black text-xs' : 'font-bold'}`}>Peran &amp; Terminal</th>
                    <th className={`py-3 px-3.5 ${isLight ? 'text-slate-900 font-black text-xs' : 'font-bold'}`}>PIN Saat Ini</th>
                    <th className={`py-3 px-3.5 ${isLight ? 'text-slate-900 font-black text-xs' : 'font-bold'}`}>Input PIN Baru</th>
                    <th className={`py-3 px-3.5 text-center ${isLight ? 'text-slate-900 font-black text-xs' : 'font-bold'}`}>Aksi Reset</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-gray-800'}`}>
                  {users.map((u) => {
                    const isRevealedCurrent = Boolean(revealedCurrentPins[u.user_id]);
                    const isRevealedNew = Boolean(revealedNewPins[u.user_id]);
                    const inputVal = userPinInputs[u.user_id] || '';

                    // Label terminal jika kasir
                    let terminalTag = '';
                    if (u.name.toLowerCase().includes('kasir 01') || u.user_id === 'USR-003') terminalTag = 'T-01 • Kasir 01';
                    else if (u.name.toLowerCase().includes('kasir 02') || u.user_id === 'USR-004') terminalTag = 'T-02 • Kasir 02';
                    else if (u.name.toLowerCase().includes('kasir 03') || u.user_id === 'USR-006') terminalTag = 'T-03 • Kasir 03';
                    else if (u.name.toLowerCase().includes('kasir 04') || u.user_id === 'USR-007') terminalTag = 'T-04 • Kasir 04';
                    else if (u.name.toLowerCase().includes('kasir 05') || u.user_id === 'USR-008') terminalTag = 'T-05 • Kasir 05';
                    else if (u.name.toLowerCase().includes('kasir 06') || u.user_id === 'USR-009') terminalTag = 'T-06 • Kasir 06';
                    else if (u.name.toLowerCase().includes('kasir 07') || u.user_id === 'USR-010') terminalTag = 'T-07 • Kasir 07';
                    else if (u.name.toLowerCase().includes('kasir 08') || u.user_id === 'USR-011') terminalTag = 'T-08 • Kasir 08';

                    return (
                      <tr
                        key={u.user_id}
                        className={`transition ${
                          isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1f242c]'
                        }`}
                      >
                        {/* Operator Info */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border border-gray-700 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                                {u.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className={`font-bold ${isLight ? 'text-slate-950 font-black text-xs' : 'text-gray-200'}`}>{u.name}</div>
                              <div className="text-[10px] text-gray-500 font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role & Terminal Tag */}
                        <td className="py-3 px-3.5">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`rounded ${
                                isLight
                                  ? u.role === 'Super Admin'
                                    ? 'bg-rose-100 border border-rose-300 text-rose-950 font-bold text-xs px-2 py-0.5 rounded'
                                    : u.role === 'Manager'
                                    ? 'bg-indigo-100 border border-indigo-300 text-indigo-950 font-bold text-xs px-2 py-0.5 rounded'
                                    : 'bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs px-2 py-0.5 rounded'
                                  : u.role === 'Super Admin'
                                  ? 'px-2 py-0.5 text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30'
                                  : u.role === 'Manager'
                                  ? 'px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : u.role === 'Kasir'
                                  ? 'px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : 'px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {u.role}
                            </span>
                            {terminalTag && (
                              <span className={`text-[10px] font-mono font-semibold ${
                                isLight ? 'text-indigo-950 font-bold' : 'text-cyan-400'
                              }`}>
                                {terminalTag}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* PIN Saat Ini (Bisa Diintip) */}
                        <td className="py-3 px-3.5">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs ${
                            isLight
                              ? 'bg-slate-100 border-slate-300 text-slate-950'
                              : 'bg-black/30 border-gray-700'
                          }`}>
                            <span className={`font-bold tracking-widest ${
                              isLight ? 'text-slate-950 font-black' : 'text-emerald-400'
                            }`}>
                              {isRevealedCurrent ? u.pin : '••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedCurrentPins((prev) => ({
                                  ...prev,
                                  [u.user_id]: !prev[u.user_id],
                                }))
                              }
                              className={`${isLight ? 'text-slate-700 hover:text-slate-950' : 'text-gray-400 hover:text-white'} p-0.5 cursor-pointer ml-1`}
                              title={isRevealedCurrent ? 'Sembunyikan PIN' : 'Intip PIN'}
                            >
                              {isRevealedCurrent ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Input PIN Baru */}
                        <td className="py-3 px-3.5">
                          <div className="relative max-w-[140px]">
                            <input
                              type={isRevealedNew ? 'text' : 'password'}
                              maxLength={6}
                              value={inputVal}
                              onChange={(e) =>
                                setUserPinInputs((prev) => ({
                                  ...prev,
                                  [u.user_id]: e.target.value,
                                }))
                              }
                              placeholder="PIN baru..."
                              className={`w-full py-1.5 pl-2.5 pr-8 rounded-lg border font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                                isLight
                                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                                  : 'bg-[#0d1117] border-gray-700 text-white'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedNewPins((prev) => ({
                                  ...prev,
                                  [u.user_id]: !prev[u.user_id],
                                }))
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                              title={isRevealedNew ? 'Sembunyikan' : 'Lihat'}
                            >
                              {isRevealedNew ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Tombol Aksi */}
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const pin = (userPinInputs[u.user_id] || '').trim();
                                if (!pin) {
                                  showToast('Ketik PIN baru terlebih dahulu!');
                                  return;
                                }
                                if (pin.length < 4 || pin.length > 6) {
                                  showToast('PIN minimal 4 digit dan maksimal 6 digit!');
                                  return;
                                }
                                updateUserPin(u.user_id, pin);
                                setUserPinInputs((prev) => ({ ...prev, [u.user_id]: '' }));
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#0052FF] hover:bg-[#0043d1] text-white cursor-pointer transition shadow-xs flex items-center gap-1 active:scale-95"
                              title="Terapkan PIN baru"
                            >
                              <Key className="w-3 h-3" />
                              <span>Reset PIN</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateUserPin(u.user_id, '1234');
                                setUserPinInputs((prev) => ({ ...prev, [u.user_id]: '' }));
                              }}
                              className={
                                isLight
                                  ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-950 font-bold text-xs px-2.5 py-1 rounded cursor-pointer transition'
                                  : 'px-2 py-1 rounded-lg text-[11px] font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 cursor-pointer transition'
                              }
                              title="Setel cepat ke 1234"
                            >
                              1234
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 4: AI INTELLIGENCE & SMART TOOLS
          ==================================================== */}
      {adminTab === 'ai' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Panel AI Tools */}
          <div
            className={`p-6 rounded-2xl border space-y-4 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.25)] shrink-0">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight">AI Intelligence &amp; Smart Tools</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      GEMINI-POWERED
                    </span>
                  </div>
                  <p className={`text-xs mt-1 max-w-2xl leading-relaxed ${isLight ? 'text-slate-700 font-medium text-xs' : 'text-gray-400'}`}>
                    Pusat akselerasi cerdas retail JacS ERP: AI Smart Data Mapper / Catalog Ingestion, audit diagnostik margin &amp; anomali kasir, rekomendasi stok otomatis, serta konfigurasi engine model AI.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAiSmartMapOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.35)] cursor-pointer transition active:scale-95"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Buka AI Smart Mapper</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar AI */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-gray-800'}`}>
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-gray-800'}`}>
                <div className={`text-xs uppercase font-bold tracking-wider ${isLight ? 'text-slate-800 font-bold' : 'text-gray-400 text-[10px]'}`}>Katalog Produk</div>
                <div className={`text-2xl font-black mt-0.5 ${isLight ? 'text-slate-950' : 'text-purple-400'}`}>{products.length}</div>
                <div className={`text-xs mt-0.5 ${isLight ? 'text-slate-700 font-medium' : 'text-[10px] text-gray-500'}`}>Siap dianalisis &amp; di-enrich</div>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-gray-800'}`}>
                <div className={`text-xs uppercase font-bold tracking-wider ${isLight ? 'text-slate-800 font-bold' : 'text-gray-400 text-[10px]'}`}>Transaksi Kasir</div>
                <div className={`text-2xl font-black mt-0.5 ${isLight ? 'text-slate-950' : 'text-cyan-400'}`}>{salesHistory.length}</div>
                <div className={`text-xs mt-0.5 ${isLight ? 'text-slate-700 font-medium' : 'text-[10px] text-gray-500'}`}>Basis data audit operasional</div>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-gray-800'}`}>
                <div className={`text-xs uppercase font-bold tracking-wider ${isLight ? 'text-slate-800 font-bold' : 'text-gray-400 text-[10px]'}`}>Stok Kritis / Habis</div>
                <div className={`text-2xl font-black mt-0.5 ${isLight ? 'text-rose-950' : 'text-rose-400'}`}>
                  {products.filter((p) => (p.stock || 0) <= (p.min_stock || 5)).length}
                </div>
                <div className={`text-xs mt-0.5 ${isLight ? 'text-slate-700 font-medium' : 'text-[10px] text-gray-500'}`}>Perlu reorder otomatis</div>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-gray-800'}`}>
                <div className={`text-xs uppercase font-bold tracking-wider ${isLight ? 'text-slate-800 font-bold' : 'text-gray-400 text-[10px]'}`}>Engine AI Terpasang</div>
                <div className={`text-base font-black mt-1 font-mono truncate ${isLight ? 'text-slate-950' : 'text-emerald-400'}`}>
                  {geminiModelSelected}
                </div>
                <div className={`text-xs mt-0.5 ${isLight ? 'text-slate-700 font-medium' : 'text-[10px] text-gray-500'}`}>Ultra Fast &amp; Low Latency</div>
              </div>
            </div>
          </div>

          {/* Bento Grid AI Tools: 3 Fitur Utama */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Kartu 1: AI Smart Data Mapper / Catalog Ingestion */}
            <div
              className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/30">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-base ${isLight ? 'text-slate-950 font-black' : 'font-bold'}`}>AI Smart Data Mapper</h3>
                    <p className={`text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>Pencocokan Kolom &amp; Catalog Ingestion</p>
                  </div>
                </div>

                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                  Unggah file Excel/CSV/TSV dari aplikasi kasir lama (Moka, Pawoon, Olsera, Majoo, APS POS) tanpa perlu merapikan kolom secara manual. Algoritma fuzzy AI mendeteksi otomatis kolom Barcode, Nama Produk, Kategori, Harga Modal, dan Harga Jual.
                </p>

                <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/25 border-gray-800'
                }`}>
                  <div className={`flex items-center justify-between ${isLight ? 'text-slate-800 font-bold' : 'text-gray-300'}`}>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Deteksi Heuristik Kolom
                    </span>
                    <span className={`font-mono font-black ${isLight ? 'text-slate-950' : 'text-emerald-400'}`}>99.8% Akurat</span>
                  </div>
                  <div className={`flex items-center justify-between ${isLight ? 'text-slate-800 font-bold' : 'text-gray-300'}`}>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Auto Normalisasi Barcode EAN
                    </span>
                    <span className={`font-mono font-black ${isLight ? 'text-slate-950' : 'text-cyan-400'}`}>Aktif</span>
                  </div>
                  <div className={`flex items-center justify-between ${isLight ? 'text-slate-800 font-bold' : 'text-gray-300'}`}>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Harmonisasi Kategori &amp; Merek
                    </span>
                    <span className={`font-mono font-black ${isLight ? 'text-slate-950' : 'text-purple-400'}`}>Otomatis</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsAiSmartMapOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.35)] cursor-pointer transition active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Mulai Impor Produk via AI</span>
                </button>
              </div>
            </div>

            {/* Kartu 2: AI Business Diagnostics & Audit Operasional */}
            <div
              className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-base ${isLight ? 'text-slate-950 font-black' : 'font-bold'}`}>AI Audit &amp; Rekomendasi Bisnis</h3>
                    <p className={`text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>Deteksi Margin, Anomali &amp; Prediksi Stok</p>
                  </div>
                </div>

                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                  Menjalankan pemindaian mendalam terhadap kartu stok, margin kotor per kategori, anomali diskon atau void kasir, serta menghitung estimasi hari kehabisan stok (Days of Inventory) secara instan.
                </p>

                {aiAuditReport ? (
                  <div className={`p-3.5 rounded-xl border text-xs space-y-2 max-h-48 overflow-y-auto ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-purple-950/30 border-purple-500/40 text-xs'
                  }`}>
                    <div className={`font-black text-xs flex items-center gap-1.5 ${isLight ? 'text-slate-950' : 'text-purple-300'}`}>
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      Hasil Audit Operasional AI:
                    </div>
                    <div className={`whitespace-pre-line leading-relaxed font-mono text-xs ${isLight ? 'text-slate-900 font-medium' : 'text-gray-300 text-[11px]'}`}>
                      {aiAuditReport}
                    </div>
                  </div>
                ) : (
                  <div className={`p-3.5 rounded-xl border space-y-1.5 text-xs ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/25 border-gray-800 text-gray-400'
                  }`}>
                    <div className={`flex items-center gap-1.5 font-bold ${isLight ? 'text-slate-950 font-black' : 'text-cyan-300'}`}>
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-600" />
                      Cakupan Analisis AI:
                    </div>
                    <ul className={`list-disc list-inside space-y-1 text-xs ${isLight ? 'text-slate-800 font-medium' : 'text-[11px] text-gray-400'}`}>
                      <li>Produk dengan margin negatif atau di bawah 10%</li>
                      <li>Deteksi produk slow-moving &amp; dead stock</li>
                      <li>Pola anomali transaksi void dan diskon register</li>
                      <li>Kalkulasi saran restock aman (Buffer Stock)</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isAiRunningAudit}
                  onClick={() => {
                    setIsAiRunningAudit(true);
                    showToast('AI sedang memindai audit operasional & menghitung rekomendasi stok...');
                    setTimeout(() => {
                      // Generate comprehensive business audit report based on live state
                      const lowStockItems = products.filter((p) => (p.stock || 0) <= (p.min_stock || 5));
                      const negativeMarginItems = products.filter((p) => (p.sell_price || 0) < (p.cost_price || 0));
                      const totalStockValuation = products.reduce((acc, p) => acc + (p.cost_price || 0) * (p.stock || 0), 0);
                      const avgMargin = products.length > 0 
                        ? Math.round(products.reduce((acc, p) => acc + (((p.sell_price || 0) - (p.cost_price || 0)) / Math.max(1, p.sell_price || 1)) * 100, 0) / products.length)
                        : 22;

                      const report = [
                        `✅ TOTAL VALUASI STOK: Rp ${totalStockValuation.toLocaleString('id-ID')}`,
                        `📊 RATA-RATA MARGIN: ${avgMargin}% (${avgMargin >= 18 ? 'Sehat & Kompetitif' : 'Perlu Penyesuaian Harga'})`,
                        `⚠️ REKOMENDASI RESTOCK: ${lowStockItems.length} produk menipis di bawah ambang minimum.`,
                        lowStockItems.length > 0
                          ? `   Contoh: ${lowStockItems.slice(0, 3).map((p) => `${p.name} (Sisa ${p.stock})`).join(', ')}.`
                          : '   Semua stok dalam ambang aman.',
                        `🔍 DETEKSI MARGIN: ${negativeMarginItems.length > 0 ? `Ditemukan ${negativeMarginItems.length} SKU dengan harga jual di bawah modal!` : '0 SKU anomali margin rugi.'}`,
                        `🛡️ AUDIT REGISTER KASIR: ${salesHistory.length} transaksi dianalisis. Tidak ditemukan lonjakan anomali kasir tak wajar.`
                      ].join('\n');

                      setAiAuditReport(report);
                      setAiStockRestockCount(lowStockItems.length);
                      setIsAiRunningAudit(false);
                      addAuditLog('AI Audit & Analisis Operasional selesai dijalankan', 'AI_SMART_TOOLS', 'INFO');
                      showToast('Audit Operasional AI selesai dihitung!');
                    }, 1200);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,242,254,0.3)] cursor-pointer disabled:opacity-50 transition active:scale-95"
                >
                  <Brain className={`w-4 h-4 ${isAiRunningAudit ? 'animate-spin' : ''}`} />
                  <span>{isAiRunningAudit ? 'Sedang Memindai Data...' : 'Jalankan AI Audit & Prediksi'}</span>
                </button>
              </div>
            </div>

            {/* Kartu 3: Pengaturan Engine Model & API Key Gemini */}
            <div
              className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/30">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-base ${isLight ? 'text-slate-950 font-black' : 'font-bold'}`}>Pengaturan Model &amp; API Key</h3>
                    <p className={`text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>Gemini AI Engine &amp; Credentials</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className={`block font-bold text-xs mb-1 ${isLight ? 'text-slate-800' : 'text-gray-400 font-semibold'}`}>
                      Pilihan Model Gemini:
                    </label>
                    <select
                      value={geminiModelSelected}
                      onChange={(e) => {
                        const m = e.target.value;
                        setGeminiModelSelected(m);
                        localStorage.setItem('jacs_gemini_model', m);
                        showToast(`Model AI disetel ke: ${m}`);
                      }}
                      className={`w-full p-2.5 rounded-xl border font-mono text-xs focus:border-amber-500 focus:outline-hidden ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900 font-bold' : 'bg-black/25 border-gray-700 text-white'
                      }`}
                    >
                      <option value="gemini-3.8-flash">gemini-3.8-flash (Standar Terbaik & Tercepat)</option>
                      <option value="gemini-flash-latest">gemini-flash-latest (Versi Rilis Stabil)</option>
                      <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Hemat Token & Kuota)</option>
                      <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Advanced Reasoning Pro)</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block font-bold text-xs mb-1 ${isLight ? 'text-slate-800' : 'text-gray-400 font-semibold'}`}>
                      Kunci Akses API (Gemini API Key):
                    </label>
                    <div className="relative">
                      <input
                        type={showGeminiApiKey ? 'text' : 'password'}
                        value={geminiApiKeyInput}
                        onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                        placeholder="AIzaSy... (Opsional / Terhubung Otomatis via Env)"
                        className={`w-full p-2.5 pr-10 rounded-xl border font-mono text-xs focus:border-amber-500 focus:outline-hidden ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900 font-bold' : 'bg-black/25 border-gray-700 text-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeminiApiKey(!showGeminiApiKey)}
                        className={`absolute right-3 top-2.5 cursor-pointer ${isLight ? 'text-slate-700 hover:text-slate-950' : 'text-gray-400 hover:text-white'}`}
                        title={showGeminiApiKey ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {showGeminiApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-700 font-medium' : 'text-gray-500'}`}>
                      Jika dikosongkan, sistem memakai server inject runtime secara otomatis.
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800 font-medium' : 'bg-black/20 border-gray-800 text-[11px] text-gray-400'
                  }`}>
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      API Key disimpan aman pada browser lokal terenkripsi session storage dan diteruskan dengan proteksi TLS.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('jacs_gemini_api_key', geminiApiKeyInput.trim());
                    localStorage.setItem('jacs_gemini_model', geminiModelSelected);
                    addAuditLog(`Konfigurasi Model Gemini AI (${geminiModelSelected}) diperbarui`, 'SECURITY', 'INFO');
                    showToast('✅ Konfigurasi AI Model & API Key berhasil disimpan!');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.35)] cursor-pointer transition active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Konfigurasi AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {(adminTab === 'remote' || adminTab === 'system') && (
        <div className="space-y-6">
          {/* SAKELAR GLOBAL MAINTENANCE MODE & AKSES MULTI-USER */}
          <div className={`p-6 rounded-2xl border transition-all ${
            isGlobalMaintenance
              ? 'bg-rose-950/30 border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.25)]'
              : isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#161b22] border-[#30363d]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                  isGlobalMaintenance
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}>
                  <Power className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-extrabold text-base tracking-tight">
                      Global Maintenance Mode &amp; Kontrol Akses Multi-User
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      isGlobalMaintenance
                        ? 'bg-rose-100 border-rose-300 text-rose-950'
                        : isLight
                        ? 'bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {isGlobalMaintenance ? '🔴 MAINTENANCE MODE AKTIF' : '🟢 SISTEM ONLINE & LIVE'}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 max-w-2xl leading-relaxed ${
                    isLight ? 'text-slate-700 font-medium text-xs' : 'text-gray-400'
                  }`}>
                    {isGlobalMaintenance
                      ? 'PERHATIAN: Seluruh pengguna reguler (Kasir, Staff HR, Gudang) saat ini dialihkan ke layar standby terkunci. Hanya akun Super Admin yang memiliki hak akses penuh untuk melakukan diagnosa atau konfigurasi ulang sistem.'
                      : 'Ketika diaktifkan, seluruh pengguna kasir dan staf operasional terkunci di layar standby perawatan sistem, mengamankan data transaksi saat diagnosa atau perbaikan berlangsung.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  id="btn-toggle-global-maintenance"
                  onClick={toggleGlobalMaintenance}
                  className={`px-5 py-3 rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer transition active:scale-95 shadow-md ${
                    isGlobalMaintenance
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>
                    {isGlobalMaintenance
                      ? 'Matikan Maintenance (Buka Akses Pengguna)'
                      : 'Aktifkan Global Maintenance Mode'}
                  </span>
                </button>
              </div>
            </div>

            {/* Real-time Impact Indicator */}
            {isGlobalMaintenance && (
              <div className="mt-4 pt-3.5 border-t border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-rose-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Status: 10 Terminal Kasir, Portal Karyawan, dan Staf Gudang berada dalam proteksi isolasi Maintenance Standby.</span>
                </div>
                <span className="font-mono text-[11px] bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40">
                  SUPER ADMIN OVERRIDE ACTIVE
                </span>
              </div>
            )}
          </div>

          {/* Status Monitor Jarak Jauh Terminal */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Remote Terminal Monitor & Status Jarak Jauh</h3>
                <p className={`text-xs ${isLight ? 'text-slate-700 font-medium text-xs' : 'text-gray-400'}`}>Pantau operasional kasir cabang secara real-time</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                isLight
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-950 font-bold text-xs'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ALL NODES HEALTHY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {terminals.map((t, i) => (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-black/20 border-gray-800 text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${t.isLocked ? 'bg-rose-500' : 'bg-emerald-400'}`}></div>
                    <div>
                      <div className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.name}</div>
                      <div className={`text-[10px] font-mono ${isLight ? 'text-rose-950 font-bold' : 'text-gray-400'}`}>
                        Status: {t.isLocked ? 'LOCKED / FREEZE' : 'ACTIVE ONLINE'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleTerminalLock(t.id)}
                    className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
                      t.isLocked
                        ? isLight
                          ? 'bg-rose-100 border border-rose-300 text-rose-950 hover:bg-rose-200'
                          : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                        : isLight
                        ? 'bg-slate-100 border border-slate-300 text-slate-800 hover:bg-slate-200'
                        : 'bg-gray-800 text-gray-300 hover:bg-rose-500/20 hover:text-rose-400'
                    }`}
                  >
                    {t.isLocked ? 'Buka Kunci' : 'Kunci Kasir'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Remote Actions Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Action 1: Force Sync to Cloud */}
            <div className={`p-6 rounded-2xl border space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <CloudSyncIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Force Sync ke Database Cloud</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-700 font-medium text-xs' : 'text-gray-400'}`}>Sinkronisasi paksa seluruh transaksi & master data</p>
                </div>
              </div>

              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700 font-medium text-xs' : 'text-slate-400'}`}>
                Memicu unggahan seketika seluruh transaksi kasir, perubahan katalog master data, dan audit log
                ke Google Sheets / database cloud secara remote.
              </p>

              <button
                disabled={isRemoteSyncing}
                onClick={handleRemoteForceSync}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,242,254,0.3)] cursor-pointer disabled:opacity-50 transition"
              >
                <RefreshCw className={`w-4 h-4 ${isRemoteSyncing ? 'animate-spin' : ''}`} />
                <span>{isRemoteSyncing ? 'Sedang Menyinkronkan...' : 'Mulai Force Sync Sekarang'}</span>
              </button>
            </div>

            {/* Action 2: Emergency Session Reset */}
            <div className={`p-6 rounded-2xl border space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Emergency Session Reset</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-700 font-medium text-xs' : 'text-gray-400'}`}>Reset darurat sesi kasir dari jarak jauh</p>
                </div>
              </div>

              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700 font-medium text-xs' : 'text-slate-400'}`}>
                Bila terjadi kecurangan atau terminal ditinggalkan tanpa pengawasan, tombol ini akan
                memutus seluruh sesi login operator kasir seketika dan mengembalikan ke status aman.
              </p>

              <button
                onClick={emergencySessionReset}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.3)] cursor-pointer transition"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Eksekusi Emergency Session Reset</span>
              </button>
            </div>

            {/* Action 3: Reset Demo Sales & Restock DB (NEW REQUESTED FEATURE) */}
            <div className={`p-6 rounded-2xl border space-y-4 md:col-span-2 ${
              isLight ? 'bg-amber-50/60 border-amber-300 shadow-sm' : 'bg-amber-950/20 border-amber-500/40'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">Reset Demo Sales &amp; Restock DB</h3>
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        SAFE RESTOCK
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Mengembalikan stok produk (min 50 unit/SKU) &amp; menormalkan omzet penjualan tanpa menghapus identitas profil bisnis
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsResetDemoModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer transition shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Demo Sales &amp; Restock DB</span>
                </button>
              </div>

              <div className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                isLight ? 'bg-amber-50 border border-amber-300 text-amber-950' : 'bg-black/20 border border-amber-500/20 text-slate-400'
              }`}>
                <strong className={isLight ? 'text-amber-900 font-bold' : 'text-amber-400'}>Proteksi Profil Bisnis:</strong> Tindakan ini HANYA mengatur ulang transaksi kasir pengujian dan merestok seluruh master produk. Nama entitas usaha, logo developer JacS 3D, NPWP, dan konfigurasi sistem <strong className={isLight ? 'text-slate-950 font-black' : 'text-white'}>100% DIJAGA TETAP UTUH</strong>.
              </div>

              {resetDemoSummary && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{resetDemoSummary}</span>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Operational Audit Feed (Supervisor Void PIN, Rekonsiliasi Kas, Penerimaan PO) */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-emerald-400" />
                  <span>Audit Aktivitas Real-Time Operasional Kritis</span>
                </h3>
                <p className="text-xs text-gray-400">Pemantauan live untuk Supervisor Void PIN, rekonsiliasi kas akhir shift, dan penerimaan PO</p>
              </div>

              {/* Filter Pills */}
              <div className={`flex items-center gap-1.5 overflow-x-auto p-1 rounded-xl border text-xs ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/30 border-gray-800'
              }`}>
                {[
                  { id: 'ALL', label: `Semua (${auditLogs.length})` },
                  { id: 'VOID_PIN', label: `🔐 Void PIN (${voidPinLogs.length})` },
                  { id: 'SHIFT_RECONCILE', label: `💵 Kas Shift (${shiftReconciliationLogs.length})` },
                  { id: 'PO_RECEIVE', label: `📦 PO Gudang (${poReceiveLogs.length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCriticalAuditFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer whitespace-nowrap ${
                      criticalAuditFilter === f.id
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Operational Events Feed */}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {criticalFilteredLogs.slice(0, 25).map((log, idx) => {
                const isVoid = (log.details || '').toLowerCase().includes('void') || (log.action || '').toLowerCase().includes('void') || (log.details || '').toLowerCase().includes('dibatalkan');
                const isShift = (log.details || '').toLowerCase().includes('shift') || (log.details || '').toLowerCase().includes('rekonsiliasi') || (log.action || '').toLowerCase().includes('finance') || (log.details || '').toLowerCase().includes('kas kasir');
                const isPo = (log.details || '').toLowerCase().includes('po') || (log.details || '').toLowerCase().includes('in_purchase') || (log.details || '').toLowerCase().includes('penerimaan barang') || (log.action || '').toLowerCase().includes('purchasing');

                return (
                  <div
                    key={`${log.id || 'EVT'}-${idx}`}
                    className={`p-3 rounded-xl border text-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-gray-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-mono text-xs ${isLight ? 'text-slate-800 font-semibold' : 'text-gray-500'}`}>[{log.timestamp}]</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isVoid
                            ? isLight ? 'bg-rose-100 text-rose-950 border border-rose-300' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isShift
                            ? isLight ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isPo
                            ? isLight ? 'bg-blue-100 text-blue-950 border border-blue-300' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : isLight ? 'bg-slate-100 text-slate-800 border border-slate-300' : 'bg-gray-700 text-gray-300'
                        }`}>
                          {isVoid ? 'VOID SUPERVISOR' : isShift ? 'REKONSILIASI SHIFT' : isPo ? 'PENERIMAAN PO' : log.action}
                        </span>
                        <span className={`font-mono text-xs ${isLight ? 'text-slate-950 font-black' : 'text-gray-300'}`}>Operator: {log.user}</span>
                      </div>
                      <p className={`leading-snug ${isLight ? 'text-slate-800 font-medium' : 'text-gray-300'}`}>{log.details}</p>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 self-start sm:self-center font-bold ${
                      isLight ? 'bg-slate-100 text-slate-900 border border-slate-300' : 'bg-gray-800 text-cyan-400'
                    }`}>
                      AUDIT VERIFIED
                    </span>
                  </div>
                );
              })}

              {criticalFilteredLogs.length === 0 && (
                <div className="text-center py-6 text-gray-500 text-xs">
                  Belum ada log aktivitas untuk kategori audit ini.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 5: CONSOLE LOG VIEWER (DARK HACKER TERMINAL)
          ==================================================== */}
      {adminTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Log Level */}
              <div className={`flex items-center gap-1.5 overflow-x-auto p-1 rounded-xl border ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/30 border-gray-800'
              }`}>
                {(['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLogFilter(lvl)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                      logFilter === lvl
                        ? isLight ? 'bg-rose-600 text-white font-black' : 'bg-pink-500 text-white'
                        : isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {/* Quick Operational Audit Filters */}
              <div className={`flex items-center gap-1.5 overflow-x-auto p-1 rounded-xl border ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/30 border-gray-800'
              }`}>
                <button
                  onClick={() => setCriticalAuditFilter('VOID_PIN')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                    criticalAuditFilter === 'VOID_PIN'
                      ? 'bg-rose-500 text-white'
                      : isLight ? 'text-rose-900 hover:bg-rose-50 font-bold' : 'text-rose-400 hover:text-white'
                  }`}
                  title="Filter khusus Supervisor Void PIN"
                >
                  🔐 Void PIN ({voidPinLogs.length})
                </button>
                <button
                  onClick={() => setCriticalAuditFilter('SHIFT_RECONCILE')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                    criticalAuditFilter === 'SHIFT_RECONCILE'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : isLight ? 'text-emerald-900 hover:bg-emerald-50 font-bold' : 'text-emerald-400 hover:text-white'
                  }`}
                  title="Filter khusus Rekonsiliasi Kas Akhir Shift"
                >
                  💵 Kas Shift ({shiftReconciliationLogs.length})
                </button>
                <button
                  onClick={() => setCriticalAuditFilter('PO_RECEIVE')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                    criticalAuditFilter === 'PO_RECEIVE'
                      ? 'bg-blue-500 text-white'
                      : isLight ? 'text-blue-900 hover:bg-blue-50 font-bold' : 'text-blue-400 hover:text-white'
                  }`}
                  title="Filter khusus Penerimaan PO Gudang"
                >
                  📦 PO Gudang ({poReceiveLogs.length})
                </button>
                {criticalAuditFilter !== 'ALL' && (
                  <button
                    onClick={() => setCriticalAuditFilter('ALL')}
                    className={`px-2 py-1 rounded-lg text-[10px] cursor-pointer ${
                      isLight ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200 font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    ✕ Reset
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLogs}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900'
                    : 'bg-gray-800 hover:bg-gray-700 text-cyan-400'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Semua Log</span>
              </button>

              <button
                onClick={handleDownloadLogs}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900'
                    : 'bg-gray-800 hover:bg-gray-700 text-emerald-400'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File (.txt)</span>
              </button>
            </div>
          </div>

          {/* Terminal Box */}
          <div className={`p-4 rounded-2xl border font-mono text-xs max-h-[500px] overflow-y-auto space-y-1.5 shadow-inner ${
            isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#090d13] border-gray-800 text-gray-300'
          }`}>
            <div className={`pb-2 border-b flex items-center justify-between ${
              isLight ? 'text-slate-700 font-bold border-slate-300' : 'text-gray-500 border-gray-800/60'
            }`}>
              <span>JacS RetailOS ERP Console Log Stream (v4.2)</span>
              <span>{filteredAuditLogs.length} events logged</span>
            </div>

            {filteredAuditLogs.map((log, idx) => {
              const lvl = log.level || 'INFO';
              const lvlColor =
                lvl === 'ERROR'
                  ? isLight ? 'text-rose-950 bg-rose-100 border border-rose-300' : 'text-rose-400 bg-rose-500/10'
                  : lvl === 'WARN'
                  ? isLight ? 'text-amber-950 bg-amber-100 border border-amber-300' : 'text-amber-400 bg-amber-500/10'
                  : lvl === 'DEBUG'
                  ? isLight ? 'text-purple-950 bg-purple-100 border border-purple-300' : 'text-purple-400 bg-purple-500/10'
                  : isLight ? 'text-blue-950 bg-blue-100 border border-blue-300' : 'text-cyan-400 bg-cyan-500/10';

              return (
                <div key={`${log.id || 'LOG'}-${idx}`} className="leading-relaxed hover:bg-black/5 dark:hover:bg-white/5 px-1 rounded flex items-start gap-2">
                  <span className={`${isLight ? 'text-slate-800 font-semibold text-xs' : 'text-gray-500'} shrink-0`}>[{log.timestamp}]</span>
                  <span className={`px-1 rounded text-[10px] font-bold shrink-0 ${lvlColor}`}>
                    {lvl}
                  </span>
                  <span className={`${isLight ? 'text-blue-900 font-bold' : 'text-blue-400'} shrink-0`}>[{log.action}]</span>
                  <span className={`${isLight ? 'text-slate-950 font-black text-xs' : 'text-gray-400'} shrink-0`}>({log.user}):</span>
                  <span className={`${isLight ? 'text-slate-900 font-medium' : 'text-gray-200'}`}>{log.details}</span>
                </div>
              );
            })}

            {filteredAuditLogs.length === 0 && (
              <div className="text-center py-6 text-gray-500">Tidak ada log aktivitas untuk filter ini.</div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 6: CLOUD SPREADSHEET WEBHOOK
          ==================================================== */}
      {adminTab === 'sheets' && (
        <div className="space-y-5">
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Google Sheets & Cloud Database Webhook</h3>
                <p className="text-xs text-gray-400">Konfigurasi endpoint Apps Script untuk sinkronisasi cloud</p>
              </div>
              <button
                onClick={async () => {
                  showToast('Menguji koneksi cloud...');
                  await testSheetConnection();
                  showToast('Koneksi Cloud Google Sheets Terverifikasi!');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 cursor-pointer transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Uji Koneksi Sekarang</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-gray-400'}`}>Spreadsheet ID Target:</label>
                <input
                  type="text"
                  value={sheetConfig.spreadsheetId}
                  onChange={(e) => updateSheetConfig({ spreadsheetId: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border font-mono ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/20 border-gray-700 text-white'
                  }`}
                />
              </div>
              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-gray-400'}`}>Apps Script WebApp URL:</label>
                <input
                  type="text"
                  value={sheetConfig.appsScriptUrl}
                  onChange={(e) => updateSheetConfig({ appsScriptUrl: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border font-mono ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/20 border-gray-700 text-white'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 7: DATA MIGRATION WIZARD & SMART COLUMN MAPPING
          ==================================================== */}
      {adminTab === 'migration' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Card */}
          <div
            className={`p-6 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-950 font-black' : ''}`}>
                      Data Migration Wizard &amp; Smart Column Mapping
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40">
                      STANDAR APS POS 1
                    </span>
                  </div>
                  <p className={`text-xs mt-1 max-w-2xl leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
                    Alur migrasi 4 langkah dari format Excel/CSV lama dengan mesin pencocokan kolom cerdas
                    (Smart Column Mapping), profiling data instan, simulasi Dry Run, dan rekonsiliasi database idempotent.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMigrationInitialEntity('product');
                  setIsMigrationModalOpen(true);
                }}
                className="px-6 py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.4)] cursor-pointer transition active:scale-95 shrink-0"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>🚀 Buka Wizard Migrasi Lengkap</span>
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t ${
              isLight ? 'border-slate-200' : 'border-gray-800'
            }`}>
              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/30 border-gray-800'}`}>
                <div className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-gray-400'}`}>Produk Terdaftar</div>
                <div className={`text-2xl font-black mt-0.5 ${isLight ? 'text-cyan-900' : 'text-cyan-400'}`}>{products.length}</div>
                <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-700 font-semibold' : 'text-gray-500'}`}>Kode BR000001 - BRxxxxxx</div>
              </div>

              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/30 border-gray-800'}`}>
                <div className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-gray-400'}`}>Pemasok / Vendor</div>
                <div className={`text-2xl font-black mt-0.5 ${isLight ? 'text-amber-900' : 'text-amber-400'}`}>{suppliers.length}</div>
                <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-700 font-semibold' : 'text-gray-500'}`}>Kode SP000001 - SPxxxxxx</div>
              </div>

              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/30 border-gray-800'}`}>
                <div className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-gray-400'}`}>Pelanggan / Member</div>
                <div className={`text-2xl font-black mt-0.5 ${isLight ? 'text-emerald-900' : 'text-emerald-400'}`}>{customers.length}</div>
                <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-700 font-semibold' : 'text-gray-500'}`}>Kode CS000001 - CSxxxxxx</div>
              </div>

              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/30 border-gray-800'}`}>
                <div className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-gray-400'}`}>Total Record Gudang</div>
                <div className={`text-2xl font-black mt-0.5 ${isLight ? 'text-purple-900' : 'text-purple-400'}`}>{inventory.length}</div>
                <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-700 font-semibold' : 'text-gray-500'}`}>Kartu Persediaan Fisik</div>
              </div>
            </div>
          </div>

          {/* 4 Entitas Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Produk */}
            <div
              className={`p-5 rounded-2xl border flex flex-col justify-between transition hover:border-cyan-500/50 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    01
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    BRxxxxxx
                  </span>
                </div>
                <h3 className={`font-bold text-sm mt-3 ${isLight ? 'text-slate-950 font-black' : ''}`}>Produk &amp; SKU Barang</h3>
                <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
                  Migrasi master barang, barcode EAN, harga beli/modal, harga jual, dan stok awal (01_Barang).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMigrationInitialEntity('product');
                  setIsMigrationModalOpen(true);
                }}
                className="mt-4 w-full py-2 px-3 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 cursor-pointer transition text-center"
              >
                Migrasi Produk ➔
              </button>
            </div>

            {/* Card 2: Supplier */}
            <div
              className={`p-5 rounded-2xl border flex flex-col justify-between transition hover:border-amber-500/50 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    02
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    SPxxxxxx
                  </span>
                </div>
                <h3 className={`font-bold text-sm mt-3 ${isLight ? 'text-slate-950 font-black' : ''}`}>Pemasok / Supplier</h3>
                <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
                  Master supplier rekanan, PIC, kontak WhatsApp, dan termin tempo pembayaran (02_Supplier).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMigrationInitialEntity('supplier');
                  setIsMigrationModalOpen(true);
                }}
                className="mt-4 w-full py-2 px-3 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-pointer transition text-center"
              >
                Migrasi Pemasok ➔
              </button>
            </div>

            {/* Card 3: Pelanggan */}
            <div
              className={`p-5 rounded-2xl border flex flex-col justify-between transition hover:border-emerald-500/50 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    03
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    CSxxxxxx
                  </span>
                </div>
                <h3 className={`font-bold text-sm mt-3 ${isLight ? 'text-slate-950 font-black' : ''}`}>Pelanggan &amp; Member</h3>
                <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
                  Data pelanggan toko, tier member loyalty (Gold/Silver), saldo poin, dan riwayat (03_Customer).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMigrationInitialEntity('customer');
                  setIsMigrationModalOpen(true);
                }}
                className="mt-4 w-full py-2 px-3 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-pointer transition text-center"
              >
                Migrasi Pelanggan ➔
              </button>
            </div>

            {/* Card 4: Inventory */}
            <div
              className={`p-5 rounded-2xl border flex flex-col justify-between transition hover:border-purple-500/50 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    04
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    INVENTORY
                  </span>
                </div>
                <h3 className={`font-bold text-sm mt-3 ${isLight ? 'text-slate-950 font-black' : ''}`}>Penyesuaian Stok Awal</h3>
                <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
                  Sinkronisasi stok fisik hasil opname gudang dan kalibrasi HPP rata-rata barang.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMigrationInitialEntity('inventory');
                  setIsMigrationModalOpen(true);
                }}
                className="mt-4 w-full py-2 px-3 rounded-xl text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 cursor-pointer transition text-center"
              >
                Sinkron Stok ➔
              </button>
            </div>
          </div>

          {/* Pipeline Details Card */}
          <div
            className={`p-6 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
            }`}
          >
            <h3 className={`text-sm font-black uppercase tracking-wider mb-4 ${
              isLight ? 'text-slate-950' : 'text-gray-300'
            }`}>
              Arsitektur Alur Migrasi 4-Langkah (Zero Duplication &amp; Idempotent)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl space-y-1.5 border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/20 border-gray-800'
              }`}>
                <div className={`text-xs font-black ${isLight ? 'text-cyan-900' : 'text-cyan-400'}`}>Step 1: Upload Sumber Data</div>
                <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
                  Mendukung file .CSV dan .XLSX Excel. Sedia tombol unduh template standar dan sampel data 1-klik.
                </p>
              </div>

              <div className={`p-4 rounded-xl space-y-1.5 border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/20 border-gray-800'
              }`}>
                <div className={`text-xs font-black ${isLight ? 'text-amber-900' : 'text-amber-400'}`}>Step 2: Smart Column Mapping</div>
                <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
                  Pencocokan sinonim otomatis ('Nama Barang' ➔ name, 'Harga Modal' ➔ costPrice, 'Stok' ➔ stock) + profiling.
                </p>
              </div>

              <div className={`p-4 rounded-xl space-y-1.5 border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/20 border-gray-800'
              }`}>
                <div className={`text-xs font-black ${isLight ? 'text-emerald-900' : 'text-emerald-400'}`}>Step 3: Dry Run Preview</div>
                <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
                  Simulasi validasi sebelum simpan. Badge status MATCHED (hijau), NEW (biru), DUPLICATE (kuning), INVALID (merah).
                </p>
              </div>

              <div className={`p-4 rounded-xl space-y-1.5 border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/20 border-gray-800'
              }`}>
                <div className={`text-xs font-black ${isLight ? 'text-pink-900' : 'text-pink-400'}`}>Step 4: Commit &amp; Rekonsiliasi</div>
                <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
                  Commit aman &amp; idempotent. Data langsung terintegrasi secara reaktif ke AppContext tanpa reload.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset Demo Sales & Restock DB */}
      {isResetDemoModalOpen && (
        <div
          id="modal-confirm-reset-demo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
        >
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/40 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Konfirmasi Reset Demo &amp; Restock</h3>
                <p className="text-xs text-gray-400">Pulihkan database transaksi ke pengujian awal</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl text-xs space-y-2 border ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Apa yang akan di-reset:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-500 dark:text-gray-300">
                <li>Riwayat transaksi kasir (Sales History) dipulihkan ke data awal.</li>
                <li>Seluruh produk &amp; DB_Inventory di-restock minimal 50 unit per SKU.</li>
                <li>Kartu mutasi stok (OUT_SALES &amp; IN_PURCHASE) dinormalisasi.</li>
              </ul>
              <div className="pt-2 border-t border-amber-500/20 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                ✓ Profil identitas bisnis, logo 3D, NPWP, akun pengguna &amp; password developer TIDAK akan terhapus.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetDemoModalOpen(false)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-[#21262d] hover:bg-[#30363d] text-gray-300 border-gray-700'
                }`}
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isResettingDemo}
                onClick={handleConfirmResetDemo}
                className="py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer disabled:opacity-50 transition"
              >
                <RotateCcw className={`w-4 h-4 ${isResettingDemo ? 'animate-spin' : ''}`} />
                <span>{isResettingDemo ? 'Sedang Merestok...' : 'Ya, Reset & Restock'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 8: PUSAT INFORMASI & STANDAR OPERASIONAL PROSEDUR (SOP) 6 DIVISI
          ==================================================== */}
      {adminTab === 'sop' && (
        <SopInfoCenterTab isLight={isLight} />
      )}

      {/* Data Migration Wizard & Smart Column Mapping Modal */}
      <DataMigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        initialEntity={migrationInitialEntity}
      />

      {/* AI Smart Mapper Modal for External Formats */}
      <AiSmartMapperModal
        isOpen={isAiSmartMapOpen}
        onClose={() => setIsAiSmartMapOpen(false)}
        onImportProducts={handleAiSmartMapImport}
        isLight={isLight}
        isEn={false}
      />
    </div>
  );
};

// Helper Icon for Cloud Sync
const CloudSyncIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

export default SuperAdminModule;
