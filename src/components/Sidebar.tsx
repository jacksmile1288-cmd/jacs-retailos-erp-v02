import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveNavModule } from '../types';
import { getReactiveNeonGlowStyle } from '../utils/neonGlow';
import { JacSLogo } from './common/JacSLogo';
import { AboutSystemModal } from './common/AboutSystemModal';
import { QuickAuthModal } from './auth/QuickAuthModal';
import {
  Home,
  LayoutDashboard,
  Database,
  Briefcase,
  CreditCard,
  ShoppingBag,
  Boxes,
  Users,
  Store,
  ShieldAlert,
  X,
  Info,
  Sparkles,
  Lock,
  ArrowLeft,
  Activity,
  Building2,
  KeyRound,
  Cpu,
  ClipboardList,
  DoorOpen,
  BookOpen,
} from 'lucide-react';

interface NavItem {
  id: ActiveNavModule;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  neonColor: string;
  badge?: string | number;
  badgeColor?: string;
}

// 7 Modul dengan proteksi akses (membutuhkan Super Admin atau sandi/PIN)
const PROTECTED_NAV_MODULES: ActiveNavModule[] = [
  'master-data',
  'executive',
  'hr',
  'finance',
  'warehouse',
  'purchasing',
  'admin',
];

const PROTECTED_MODULE_NAMES: Record<string, { id: string; en: string }> = {
  'master-data': { id: 'Master Data', en: 'Master Data' },
  'executive': { id: 'Eksekutif & Manajerial', en: 'Executive & Managerial' },
  'hr': { id: 'SDM & Personalia', en: 'Human Resources' },
  'finance': { id: 'Keuangan & Akuntansi', en: 'Finance & Accounting' },
  'warehouse': { id: 'Gudang & Inventori', en: 'Warehouse & Inventory' },
  'purchasing': { id: 'Pengadaan & Pembelian', en: 'Purchasing' },
  'admin': { id: 'Super Admin', en: 'Super Admin' },
};

export const Sidebar: React.FC<{ isOpenMobile: boolean; onCloseMobile: () => void }> = ({
  isOpenMobile,
  onCloseMobile,
}) => {
  const {
    activeNav,
    setActiveNav,
    activeUser,
    isSuperAdminAuthenticated,
    setIsSuperAdminAuthenticated,
    exitSuperAdminSession,
    superAdminTab,
    setSuperAdminTab,
    showToast,
    isGlobalMaintenance,
    businessProfile,
    products,
    purchasing,
    purchaseRequests,
    promotions,
    approvalQueue,
    employees,
    leaveRequests,
    theme,
    language,
    isModuleUnlocked,
    unlockModule,
    lockModule,
    getModulePin,
    isSidebarCollapsed,
  } = useApp();
  const [hoveredNavId, setHoveredNavId] = useState<string | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // State untuk Proteksi Akses Modul (QuickAuthModal)
  const [pendingNavModule, setPendingNavModule] = useState<ActiveNavModule | null>(null);
  const [pendingNavTitle, setPendingNavTitle] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isLight = theme === 'light';
  const isEn = language === 'en';

  // 1. Executive Pending Approvals & Authorizations (status === 'PENDING' / 'PENDING_APPROVAL')
  const totalExecutivePending = useMemo(() => {
    // a. Dokumen dalam antrean persetujuan eksekutif
    const pendingInQueue = (approvalQueue || []).filter(
      (a) => a.status === 'PENDING' || (a.status as string) === 'PENDING_APPROVAL'
    );

    // b. Berkas PO bernilai tinggi/direksi yang masih pending persetujuan
    const pendingExecutivePOs = (purchasing || []).filter((po) => {
      const s = (po.status || '').toUpperCase().trim();
      const isPending =
        s === 'PENDING_APPROVAL' ||
        s === 'MENUNGGU APPROVAL DIREKSI' ||
        s === 'MENUNGGU APPROVAL PIMPINAN' ||
        s === 'PENDING APPROVAL' ||
        s === 'PENDING';
      if (!isPending) return false;
      const inQueue = pendingInQueue.some(
        (a) =>
          a.reference_id === po.po_number ||
          a.id.includes(po.po_number)
      );
      return !inQueue;
    });

    // c. Berkas promosi yang berstatus pending otorisasi
    const pendingPromos = (promotions || []).filter((p) => {
      const s = (p.status || '').toUpperCase().trim();
      return s === 'PENDING' || s === 'PENDING_APPROVAL';
    });

    return pendingInQueue.length + pendingExecutivePOs.length + pendingPromos.length;
  }, [approvalQueue, purchasing, promotions]);

  // 2. Warehouse Stock Alerts: Filter out items with active draft PRs or in-process restock POs
  const lowStockProducts = (products || []).filter((p) => {
    const minStock = p.min_stock || 10;
    return (
      p.stock <= minStock ||
      p.status === 'Low Stock' ||
      p.status === 'Out of Stock'
    );
  });

  const unhandledStockAlerts = lowStockProducts.filter((p) => {
    const pName = p.name.toLowerCase().trim();
    const pId = p.id.toLowerCase().trim();

    // Check if item has draft PR / active PR in purchaseRequests
    const hasActivePR = (purchaseRequests || []).some((pr) => {
      const prItem = (pr.item_name || '').toLowerCase().trim();
      const isNameMatch =
        prItem.includes(pName) ||
        pName.includes(prItem.split('(')[0].trim()) ||
        prItem.includes(pId);
      const isStatusActive =
        pr.status !== 'Rejected' &&
        pr.status !== 'Ditolak' &&
        pr.status !== 'Cancelled';
      return isNameMatch && isStatusActive;
    });

    if (hasActivePR) return false;

    // Check if item is already in an active restock PO (in process of ordering / restock)
    const hasActivePO = (purchasing || []).some((po) => {
      const isStatusActive =
        po.status !== 'Cancelled' &&
        po.status !== 'Dibatalkan' &&
        po.status !== 'Selesai' &&
        po.status !== 'Completed';
      if (!isStatusActive) return false;

      const poItemsStr = typeof po.items === 'string' ? po.items.toLowerCase() : '';
      if (poItemsStr.includes(pName) || poItemsStr.includes(pId)) return true;

      if (po.item_details && Array.isArray(po.item_details)) {
        return po.item_details.some(
          (d) =>
            d.product_id?.toLowerCase() === pId ||
            (d.product_name && d.product_name.toLowerCase().includes(pName))
        );
      }
      return false;
    });

    if (hasActivePO) return false;

    return true;
  });

  const activeAlertCount = unhandledStockAlerts.length;

  const pendingPoCount = (purchasing || []).filter(
    (po) =>
      po.status === 'Draft' ||
      po.status === 'Menunggu Approval Pimpinan' ||
      po.status === 'PENDING APPROVAL' ||
      po.status === 'Pending Approval' ||
      po.status === 'Disetujui (Approved)' ||
      po.status === 'Disetujui' ||
      po.status === 'Approved' ||
      po.status === 'Dipesan' ||
      po.status === 'SENT_TO_VENDOR' ||
      po.status === 'Sent' ||
      po.status === 'PARTIALLY_RECEIVED'
  ).length;

  const pendingLeavesCount = (leaveRequests || []).filter((l) => l.status === 'Menunggu').length;

  // PRIMARY MENU ITEMS (Clean Single-Language Based on Active Language)
  const primaryNavItems: NavItem[] = [
    {
      id: 'home',
      label: isEn ? 'HOME' : 'BERANDA',
      icon: Home,
      neonColor: '#00f2fe',
    },
    {
      id: 'dashboard',
      label: isEn ? 'DASHBOARD' : 'DASHBOARD UTAMA',
      icon: LayoutDashboard,
      neonColor: '#0052FF',
    },
    {
      id: 'master-data',
      label: isEn ? 'MASTER DATA' : 'DATA MASTER',
      icon: Database,
      neonColor: '#00f2fe',
      badge: 'KATALOG',
      badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/40',
    },
    {
      id: 'executive',
      label: isEn ? 'EXECUTIVE & MANAGERIAL' : 'EKSEKUTIF & MANAJERIAL',
      icon: Briefcase,
      neonColor: '#10B981',
      badge:
        totalExecutivePending > 0
          ? `${totalExecutivePending} ${isEn ? 'Queue' : 'Antrean'}`
          : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40',
    },
    {
      id: 'hr',
      label: isEn ? 'HUMAN RESOURCES' : 'SDM & PERSONALIA',
      icon: Users,
      neonColor: '#06b6d4',
      badge: pendingLeavesCount > 0 
        ? `${pendingLeavesCount} ${isEn ? 'Leave' : 'Cuti'}` 
        : `${employees.length} ${isEn ? 'Staff' : 'Staf'}`,
      badgeColor: pendingLeavesCount > 0 ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40' : 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/40',
    },
    {
      id: 'finance',
      label: isEn ? 'FINANCE & ACCOUNTING' : 'KEUANGAN & AKUNTANSI',
      icon: CreditCard,
      neonColor: '#f59e0b',
    },
    {
      id: 'purchasing',
      label: isEn ? 'PURCHASING' : 'PENGADAAN & PEMBELIAN',
      icon: ShoppingBag,
      neonColor: '#f43f5e',
      badge: pendingPoCount > 0 ? `${pendingPoCount} PO` : undefined,
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40',
    },
    {
      id: 'warehouse',
      label: isEn ? 'WAREHOUSE & INVENTORY' : 'GUDANG & INVENTORI',
      icon: Boxes,
      neonColor: '#8b5cf6',
      badge: activeAlertCount > 0 ? `${activeAlertCount} Alert` : undefined,
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/40',
    },
    {
      id: 'pos',
      label: isEn ? 'POS & CASHIER' : 'KASIR & PENJUALAN',
      icon: Store,
      neonColor: '#ff7a00',
    },
  ];

  const isSuperAdmin = Boolean(
    isSuperAdminAuthenticated
  );

  // Helper cek status kunci modul independen (berdiri sendiri)
  const isModuleLockedForUser = (modId: ActiveNavModule) => {
    // 1. Modul Bebas: HOME, DASHBOARD, POS (Terbuka untuk umum/kasir tanpa sandi)
    if (modId === 'home' || modId === 'dashboard' || modId === 'pos') return false;
    // 2. Setiap modul ber-password berdiri sendiri berdasarkan status unlock masing-masing
    return !isModuleUnlocked(modId);
  };

  // Handler Klik Menu Navigasi dengan Proteksi Otorisasi Independen
  const handleNavClick = (itemId: ActiveNavModule, itemLabel: string) => {
    // 1. Jika mengklik modul yang sedang aktif dan sudah terbuka, tidak perlu proses ulang
    if (itemId === activeNav && isModuleUnlocked(itemId)) {
      onCloseMobile();
      return;
    }

    // 2. Setiap kali pengguna berpindah ke modul lain di Sidebar, otomatis kunci kembali modul sebelumnya jika modul tersebut adalah modul ber-password
    if (activeNav !== itemId && activeNav !== 'home' && activeNav !== 'dashboard' && activeNav !== 'pos') {
      lockModule(activeNav);
    }

    // 3. Modul Bebas: HOME, DASHBOARD, POS & CASHIER (Tanpa proteksi sandi)
    if (itemId === 'home' || itemId === 'dashboard' || itemId === 'pos') {
      setActiveNav(itemId);
      onCloseMobile();
      return;
    }

    // 4. Modul Ber-Password (master-data, executive, hr, finance, purchasing, warehouse, admin):
    // Selalu wajibkan input PIN / sandi otorisasi saat berpindah masuk ke modul divisi
    const modInfo = PROTECTED_MODULE_NAMES[itemId];
    const targetTitle = modInfo ? (isEn ? modInfo.en : modInfo.id) : itemLabel;
    setPendingNavModule(itemId);
    setPendingNavTitle(targetTitle);
    setIsAuthModalOpen(true);
  };

  // Navigasi Internal Khusus Konsol Super Admin (System Settings, Legalitas, Credentials, AI, Diagnostics, Audit Logs, Database)
  const superAdminNavItems = [
    {
      id: 'system',
      label: isEn ? 'SYSTEM & MAINTENANCE' : 'STATUS SISTEM & MAINTENANCE',
      icon: Activity,
      neonColor: '#00f2fe',
      badge: isGlobalMaintenance ? 'LOCK' : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      id: 'profile',
      label: isEn ? 'LEGALITY & PROFILE' : 'LEGALITAS & PROFIL BISNIS',
      icon: Building2,
      neonColor: '#10b981',
      badge: businessProfile?.isConfigured ? 'OK' : 'SETUP',
      badgeColor: businessProfile?.isConfigured
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        : 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'credentials',
      label: isEn ? 'CREDENTIALS & PINS' : 'KREDENSIAL & RESET PIN',
      icon: KeyRound,
      neonColor: '#ec4899',
    },
    {
      id: 'ai',
      label: isEn ? 'AI SMART TOOLS' : 'AI INTELLIGENCE & TOOLS',
      icon: Sparkles,
      neonColor: '#a855f7',
      badge: 'AI Smart',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },
    {
      id: 'sop',
      label: isEn ? 'INFO CENTER & SOP' : 'INFO CENTER & PANDUAN SOP',
      icon: BookOpen,
      neonColor: '#38bdf8',
      badge: '6 Divisi',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    },
    {
      id: 'diagnostics',
      label: isEn ? 'DIAGNOSTICS & TERMINALS' : 'DIAGNOSA & TERMINAL KASIR',
      icon: Cpu,
      neonColor: '#38bdf8',
    },
    {
      id: 'logs',
      label: isEn ? 'AUDIT TRAIL & LOGS' : 'AUDIT TRAIL & LOG KEAMANAN',
      icon: ClipboardList,
      neonColor: '#f59e0b',
    },
    {
      id: 'migration',
      label: isEn ? 'DATABASE & INGESTION' : 'DATABASE & INGESTION DATA',
      icon: Database,
      neonColor: '#06b6d4',
    },
  ];

  return (
    <>
      {/* Mobile backdrop - tertutup total di resolusi desktop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        id="app-sidebar"
        className={`flex flex-col transition-all duration-300 ease-in-out ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-slate-900 border-slate-800 dark:border-slate-800 dark:bg-slate-900 text-[#e6edf3]'
        } ${
          /* Mobile Drawer: Fixed Overlay */
          isOpenMobile
            ? 'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] translate-x-0 opacity-100 pointer-events-auto shadow-2xl'
            : 'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] -translate-x-full opacity-0 pointer-events-none'
        } ${
          /* Desktop Side-by-side (lg:): Static flex child, berdampingan tanpa menimpa konten utama */
          isSidebarCollapsed
            ? 'lg:static lg:inset-auto lg:h-full lg:w-0 lg:overflow-hidden lg:opacity-0 lg:pointer-events-none lg:border-r-0 lg:shadow-none'
            : 'lg:static lg:inset-auto lg:h-full lg:w-72 xl:w-80 lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto lg:border-r lg:shadow-none lg:shrink-0'
        }`}
      >
        {/* 2. Brand Header: JacS RetailOS ERP (Sidebar Kiri Atas) */}
        <div
          className={`h-16 px-3.5 xl:px-4 flex items-center justify-between border-b transition-colors shrink-0 ${
            isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex-1 min-w-0 pr-2">
            <JacSLogo />
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className={`p-1.5 rounded-lg transition cursor-pointer lg:hidden shrink-0 ${
              isLight ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
            }`}
            title="Tutup Menu"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Navigation Menu List: Clean Primary Modules or Super Admin Console */}
        <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-1.5">
          {activeNav === 'admin' ? (
            /* ========================================================
               SUPER ADMIN CONSOLE NAVIGATION FOCUS
               ======================================================== */
            <div className="space-y-1 animate-fadeIn">
              {/* Tombol Utama yang Menonjol: ← Kembali ke Menu Utama ERP */}
              <div className="pb-2 border-b border-gray-700/30 mb-2">
                <button
                  type="button"
                  id="btn-sidebar-back-to-erp-top"
                  onClick={() => {
                    exitSuperAdminSession();
                    onCloseMobile();
                  }}
                  className={`w-full group flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer border shadow-sm active:scale-95 ${
                    isLight
                      ? 'bg-cyan-50 border-cyan-300 text-cyan-800 hover:bg-cyan-100 hover:border-cyan-400'
                      : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  }`}
                  title="Kembali ke Menu Utama / Dashboard Reguler"
                >
                  <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
                  <span>← Kembali ke Menu Utama ERP</span>
                </button>
              </div>

              {/* Header Kategori Super Admin Internal */}
              <div className={`px-2.5 pt-1 pb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider select-none font-mono ${
                isLight ? 'text-slate-900' : 'text-pink-400'
              }`}>
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>{isEn ? 'SUPER ADMIN CONSOLE' : 'KONSOL SUPER ADMIN'}</span>
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  isLight ? 'bg-slate-100 border border-slate-300 text-slate-900' : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                }`}>
                  ROOT
                </span>
              </div>

              {/* List Navigasi Internal Super Admin */}
              {superAdminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = superAdminTab === item.id;
                const isHovered = hoveredNavId === item.id;
                const navStyle = getReactiveNeonGlowStyle(item.neonColor, isActive, isHovered, isLight);

                return (
                  <button
                    key={item.id}
                    id={`sidebar-super-admin-nav-${item.id}`}
                    onClick={() => {
                      setSuperAdminTab(item.id);
                      localStorage.setItem('jacs_super_admin_tab', item.id);
                      onCloseMobile();
                    }}
                    onMouseEnter={() => setHoveredNavId(item.id)}
                    onMouseLeave={() => setHoveredNavId(null)}
                    style={isLight || isActive ? undefined : navStyle}
                    className={`w-full group flex items-center justify-between py-2.5 px-3.5 rounded-lg text-left transition-all duration-150 ease-out cursor-pointer gap-3 ${
                      isActive
                        ? isLight
                          ? 'border-l-4 border-pink-600 bg-pink-100 text-pink-900 shadow-sm font-bold'
                          : 'border-l-4 border-pink-400 bg-pink-950/70 shadow-[inset_0_0_15px_rgba(236,72,153,0.35)] text-pink-300 font-extrabold'
                        : isLight
                        ? 'text-slate-800 font-bold text-xs hover:bg-slate-100 hover:text-slate-950'
                        : 'text-slate-300 dark:text-slate-300 hover:bg-slate-800 hover:text-white dark:hover:text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 xl:gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-6 h-6 xl:w-6.5 xl:h-6.5 rounded-lg flex items-center justify-center transition shrink-0 ${
                          isActive
                            ? isLight
                              ? 'bg-pink-600 text-white shadow-sm'
                              : 'bg-pink-500/20 text-pink-300 border border-pink-400/50 drop-shadow-[0_0_6px_rgba(236,72,153,0.8)]'
                            : isLight
                            ? 'bg-slate-100 text-slate-800 border border-slate-300 group-hover:text-slate-950 group-hover:bg-slate-200'
                            : 'bg-[#0d1117] text-slate-300 border border-[#30363d] dark:text-slate-300'
                        }`}
                        style={
                          !isActive && !isLight && isHovered
                            ? {
                                backgroundColor: `${item.neonColor}25`,
                                color: item.neonColor,
                                boxShadow: `0 0 10px ${item.neonColor}50`,
                              }
                            : {}
                        }
                      >
                        <Icon
                          className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                            isActive
                              ? isLight
                                ? 'text-white'
                                : 'text-pink-300 drop-shadow-[0_0_6px_rgba(236,72,153,0.8)]'
                              : isLight
                              ? 'text-slate-800 group-hover:text-slate-950'
                              : 'text-slate-300 dark:text-slate-300'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-xs xl:text-[13px] tracking-tight leading-snug whitespace-normal break-words flex-1 ${
                          isActive
                            ? isLight
                              ? 'text-pink-900 font-bold'
                              : 'text-pink-300 drop-shadow-[0_0_6px_rgba(236,72,153,0.8)] font-bold'
                          : isLight
                          ? 'text-slate-800 font-bold text-xs group-hover:text-slate-950'
                          : 'text-slate-300 dark:text-slate-300 group-hover:text-white dark:group-hover:text-white font-medium'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {Boolean(item.badge) && (
                      <span
                        className={`ml-auto text-xs font-bold px-2 py-0.5 rounded shrink-0 whitespace-nowrap ${
                          isActive
                            ? isLight
                              ? 'bg-pink-200 text-pink-900 border border-pink-400'
                              : 'bg-pink-500/25 border-pink-400/50 text-pink-200 drop-shadow-[0_0_6px_rgba(236,72,153,0.8)]'
                            : isLight
                            ? 'bg-slate-100 border border-slate-300 text-slate-900'
                            : item.badgeColor || 'bg-gray-800 text-gray-400 border-gray-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Tombol Kunci Sesi di Bagian Bawah Navigasi Super Admin */}
              <div className="pt-3 border-t border-gray-700/30 mt-2">
                <button
                  type="button"
                  id="btn-sidebar-lock-super-admin-bottom"
                  onClick={() => {
                    exitSuperAdminSession();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer active:scale-95"
                  title="Logout / Kunci Sesi Super Admin"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kunci Sesi Super Admin</span>
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================
               REGULAR ERP NAVIGATION MENU LIST
               ======================================================== */
            <div className="space-y-1">
              <div className="px-2.5 pb-1 text-[9px] xl:text-[10px] font-bold text-[#8b949e] uppercase tracking-wider select-none">
                {isEn ? 'NAVIGATION MENU' : 'MENU NAVIGASI'}
              </div>

              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                const isHovered = hoveredNavId === item.id;

                // Thick multi-layer neon glow with specific module color and instant reactive hover
                const navStyle = getReactiveNeonGlowStyle(item.neonColor, isActive, isHovered, isLight);

                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => handleNavClick(item.id, item.label)}
                    onMouseEnter={() => setHoveredNavId(item.id)}
                    onMouseLeave={() => setHoveredNavId(null)}
                    style={isLight || isActive ? undefined : navStyle}
                    className={`w-full group flex items-center justify-between py-2 px-2.5 xl:px-3 rounded-lg text-left transition-all duration-150 ease-out cursor-pointer gap-2.5 ${
                      isActive
                        ? isLight
                          ? 'border-l-4 border-cyan-600 bg-cyan-100 text-cyan-900 shadow-sm font-bold'
                          : 'border-l-4 border-cyan-400 bg-cyan-950/70 shadow-[inset_0_0_15px_rgba(6,182,212,0.35)] text-cyan-300 font-extrabold'
                        : isLight
                        ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
                        : 'text-slate-300 dark:text-slate-300 hover:bg-slate-800 hover:text-white dark:hover:text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 xl:gap-2.5 min-w-0 flex-1">
                      {/* Icon with Individual Glow */}
                      <div
                        className={`w-6 h-6 xl:w-6.5 xl:h-6.5 rounded-lg flex items-center justify-center transition shrink-0 ${
                          isActive
                            ? isLight
                              ? 'bg-cyan-600 text-white shadow-sm'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                            : isLight
                            ? 'bg-slate-100 text-slate-700 border border-slate-300 group-hover:text-slate-900 group-hover:bg-slate-200'
                            : 'bg-[#0d1117] text-slate-300 border border-[#30363d] dark:text-slate-300'
                        }`}
                        style={
                          !isActive && !isLight && isHovered
                            ? {
                                backgroundColor: `${item.neonColor}25`,
                                color: item.neonColor,
                                boxShadow: `0 0 10px ${item.neonColor}50`,
                              }
                            : {}
                        }
                      >
                        <Icon
                          className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                            isActive
                              ? isLight
                                ? 'text-white'
                                : 'text-cyan-300 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                              : isLight
                              ? 'text-slate-700 group-hover:text-slate-900'
                              : 'text-slate-300 dark:text-slate-300'
                          }`}
                        />
                      </div>

                      {/* Clean Menu Label Only - No rigid truncation */}
                      <span
                        className={`text-xs xl:text-[13px] tracking-tight leading-snug whitespace-normal break-words flex-1 ${
                          isActive
                            ? isLight
                              ? 'text-cyan-900 font-bold'
                              : 'text-cyan-300 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)] font-bold'
                            : isLight
                            ? 'text-slate-700 group-hover:text-slate-900 font-medium'
                            : 'text-slate-300 dark:text-slate-300 group-hover:text-white dark:group-hover:text-white font-medium'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      {/* Optional Badge */}

                      {/* Optional Badge */}
                      {item.id === 'executive' ? (
                        totalExecutivePending > 0 && Boolean(item.badge) ? (
                          <span
                            className={`text-[10px] xl:text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${
                              isActive
                                ? isLight
                                  ? 'bg-cyan-200/80 border-cyan-400 text-cyan-900'
                                  : 'bg-cyan-500/25 border-cyan-400/50 text-cyan-200 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                                : isLight
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : item.badgeColor || 'bg-gray-800 text-gray-400 border-gray-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : null
                      ) : (
                        Boolean(item.badge) && item.badge !== 0 && item.badge !== '0' && (
                          <span
                            className={`text-[10px] xl:text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${
                              isActive
                                ? isLight
                                  ? 'bg-cyan-200/80 border-cyan-400 text-cyan-900'
                                  : 'bg-cyan-500/25 border-cyan-400/50 text-cyan-200 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                                : isLight
                                ? item.badgeColor?.split('dark:')[0] || 'bg-slate-200 text-slate-800 border-slate-300'
                                : item.badgeColor || 'bg-gray-800 text-gray-400 border-gray-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Footer Brand & Tentang Sistem Trigger */}
        <div
          className={`p-2.5 border-t shrink-0 ${
            isLight ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800 bg-slate-900 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <button
            type="button"
            id="btn-sidebar-about-system"
            onClick={() => setIsAboutModalOpen(true)}
            className={`w-full p-2.5 rounded-xl flex items-center justify-between transition cursor-pointer text-xs group shadow-xs ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900'
                : 'bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200'
            }`}
            title={isEn ? 'About JacS RetailOS ERP & Developer' : 'Tentang Sistem JacS ERP & Pengembang'}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/logo-jacs-enterprise.png"
                alt="JacS Enterprise Logo"
                className="w-5 h-5 object-contain shrink-0 rounded-sm dark:bg-white/10 dark:p-0.5"
              />
              <div className="flex flex-col text-left min-w-0">
                <span style={{ color: '#0f172a' }} className="font-bold text-xs dark:!text-white truncate">JacS Architecture</span>
                <span style={{ color: '#475569' }} className="font-medium text-[10px] dark:!text-slate-300 truncate">JacS Developer</span>
              </div>
            </div>
            <div className="w-5 h-5 rounded-md bg-slate-200/90 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 shadow-xs">
              <Info className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
            </div>
          </button>
        </div>
      </aside>

      {/* Modal Tentang Sistem & Pengembang */}
      <AboutSystemModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        isLight={isLight}
        language={language}
        onOpenSuperAdmin={() => handleNavClick('admin', 'Super Admin')}
      />

      {/* Modal Otorisasi Ringkas Akses Modul */}
      <QuickAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingNavModule(null);
        }}
        onSuccess={() => {
          if (pendingNavModule) {
            setActiveNav(pendingNavModule);
            setPendingNavModule(null);
          }
          setIsAuthModalOpen(false);
          onCloseMobile();
        }}
        moduleTitle={pendingNavTitle}
        targetModule={pendingNavModule || undefined}
        requireMasterPassword={pendingNavModule === 'admin'}
        subtitle={
          isEn
            ? `Enter authorization PIN to access ${pendingNavTitle}`
            : `Masukkan PIN otorisasi untuk mengakses ${pendingNavTitle}`
        }
      />
    </>
  );
};
