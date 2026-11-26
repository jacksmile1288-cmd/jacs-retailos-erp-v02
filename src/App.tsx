import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import {
  LogOut,
  Sun,
  Moon,
  ShieldAlert,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  RefreshCw,
  Wrench,
  Store,
  Layers,
  ChevronDown,
  Briefcase,
  CreditCard,
  ShoppingBag,
  Boxes,
  Users,
  Database,
  ShieldCheck,
  Coffee,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles,
  FlaskConical,
} from 'lucide-react';
import { AuditProvider } from './AuditProvider';
import { AppProvider, useApp } from './context/AppContext';
import { isDemoSandboxMode } from './utils/demoSandbox';
import { DualBackendStatusWidget } from './components/DualBackendStatusWidget';
import { PublicGateway } from './components/auth/PublicGateway';
import { MasterDataModule } from './components/master/MasterDataModule';
import SuperAdminModule from './components/admin/SuperAdminModule';
import POSModule from './components/pos/PosModule';
import { ModuleErrorBoundary } from './components/common/ModuleErrorBoundary';
import { JacsAiAssistantDrawer } from './components/ai/JacsAiAssistantDrawer';
import SystemHealthNotificationBanner from './components/common/SystemHealthNotificationBanner';
import { ActiveNavModule, User } from './types';
import {
  generatePosStations,
  normalizeStationCode,
} from './utils/terminalConfigUtils';

function lazyWithRetry<T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await importer();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 350));
      return await importer();
    }
  });
}

const ExecutiveModule = lazyWithRetry(() => import('./components/executive/ExecutiveModule'));
const WarehouseModule = lazyWithRetry(() => import('./components/warehouse/WarehouseModule'));
const PurchasingModule = lazyWithRetry(() => import('./components/purchasing/PurchasingModule'));
const FinanceModule = lazyWithRetry(() => import('./components/finance/FinanceModule'));
const HRModule = lazyWithRetry(() => import('./components/hr/HrModule'));

const IS_CLIENT_TRIAL_MODE = import.meta.env.VITE_CLIENT_TRIAL_MODE === 'true';

function getAllowedModulesForUser(
  user: User | null,
  isSuperAdmin: boolean
): ActiveNavModule[] {
  if (!user) return [];
  if (IS_CLIENT_TRIAL_MODE) {
    return ['pos', 'admin'];
  }
  const roleStr = String(user.role || '').toUpperCase();
  const divStr = String(user.division || '').toUpperCase();
  const idStr = String(user.id || user.user_id || '').toUpperCase();

  // Mode Maintenance & Audit Developer (SuperAdmin - Jacs Enterprise): Bypass penuh 6 divisi manajemen
  if (
    isSuperAdmin ||
    roleStr.includes('SUPER') ||
    divStr.includes('SUPER') ||
    idStr.includes('SUPER') ||
    idStr === 'USR-001'
  ) {
    return ['admin', 'executive', 'finance', 'purchasing', 'pos', 'warehouse', 'hr', 'master-data', 'security'];
  }

  // Isolasi Akses Lintas Divisi untuk Staf & Manager (1 sesi login = 1 modul tugas)
  if (divStr.includes('EXEC') || roleStr.includes('EXEC') || roleStr === 'MANAGER' || roleStr === 'OWNER' || idStr.includes('EXECUTIVE')) {
    return ['executive'];
  }
  if (divStr.includes('FINANCE') || roleStr.includes('FINANCE') || idStr.includes('FINANCE')) {
    return ['finance'];
  }
  if (divStr.includes('PURCHAS') || roleStr.includes('PURCHAS') || idStr.includes('PURCHAS')) {
    return ['purchasing'];
  }
  if (divStr.includes('WAREHOUSE') || divStr.includes('GUDANG') || roleStr.includes('WAREHOUSE') || roleStr.includes('GUDANG') || idStr.includes('WAREHOUSE')) {
    return ['warehouse'];
  }
  if (divStr.includes('HR') || roleStr.includes('HR') || idStr.includes('HR')) {
    return ['hr'];
  }
  if (divStr.includes('POS') || divStr.includes('KASIR') || roleStr.includes('KASIR') || roleStr.includes('CASHIER') || idStr.includes('POS')) {
    return ['pos'];
  }

  return ['pos'];
}

const HYBRID_MANAGEMENT_PILLARS: Array<{
  id: ActiveNavModule;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'executive', label: 'Executive & Management', shortLabel: 'Executive', icon: Briefcase },
  { id: 'finance', label: 'Finance & Accounting', shortLabel: 'Finance', icon: CreditCard },
  { id: 'purchasing', label: 'Purchasing', shortLabel: 'Purchasing', icon: ShoppingBag },
  { id: 'pos', label: 'Point of Sale (Kasir)', shortLabel: 'Kasir POS', icon: Store },
  { id: 'warehouse', label: 'Warehouse & Inventory', shortLabel: 'Warehouse', icon: Boxes },
  { id: 'hr', label: 'Human Resources (HR)', shortLabel: 'HR', icon: Users },
  { id: 'master-data', label: 'Master Data Katalog', shortLabel: 'Master Data', icon: Database },
];

const ToastOverlay: React.FC = () => {
  const { toastMessage, toastType, clearToast } = useApp();
  if (!toastMessage) return null;

  const toneClass =
    toastType === 'error'
      ? 'bg-rose-950/95 border-rose-500/60 text-rose-100'
      : toastType === 'warning'
      ? 'bg-amber-950/95 border-amber-500/60 text-amber-100'
      : toastType === 'success'
      ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100'
      : 'bg-slate-900/95 border-cyan-500/60 text-cyan-100';

  const Icon =
    toastType === 'error' || toastType === 'warning'
      ? AlertTriangle
      : toastType === 'success'
      ? CheckCircle2
      : Info;

  return (
    <div className="fixed bottom-6 right-6 z-[70] max-w-sm animate-fadeIn">
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-semibold ${toneClass}`}>
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1">{toastMessage}</span>
        <button
          type="button"
          onClick={clearToast}
          className="opacity-70 hover:opacity-100 cursor-pointer p-0.5"
          aria-label="Tutup notifikasi"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const {
    currentUser,
    isSuperAdminAuthenticated,
    activeNav,
    setActiveNav,
    contextualProfile,
    logout,
    theme,
    toggleTheme,
    language,
    toggleLanguage,
    showToast,
    remoteMaintenanceLock,
    activeBranchId,
    triggerManualHeartbeatPoll,
    recordSystemError,
    businessDomainConfig,
    businessProfile,
    activeCashierQuota,
    boundStation,
    activeTerminal,
    cashierShifts,
    setIsCashierWorkspaceActive,
    verifyManagementAuthPin,
    addAuditLog,
    isIdleLocked,
    idleLockedAt,
    idleLockReason,
    idleAutoLockMinutes,
    unlockIdleScreen,
    openAiAssistant,
    isDemoSandbox,
    resetDemoSandboxSession,
    exitDemoSandboxSession,
  } = useApp();

  const [moduleResetCounter, setModuleResetCounter] = useState(0);
  const [posEntrySignal, setPosEntrySignal] = useState(0);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isCashierStatusMenuOpen, setIsCashierStatusMenuOpen] = useState(false);

  const [pendingAuthTarget, setPendingAuthTarget] = useState<{
    moduleId: ActiveNavModule;
    label: string;
  } | null>(null);
  const [mgmtPinInput, setMgmtPinInput] = useState('');
  const [mgmtPinError, setMgmtPinError] = useState<string | null>(null);
  const [showMgmtPin, setShowMgmtPin] = useState(false);

  const [idleUnlockPin, setIdleUnlockPin] = useState('');
  const [idleUnlockError, setIdleUnlockError] = useState<string | null>(null);
  const [isUnlockingIdle, setIsUnlockingIdle] = useState(false);

  const cashierStatusMenuRef = useRef<HTMLDivElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isCashierStatusMenuOpen &&
        cashierStatusMenuRef.current &&
        !cashierStatusMenuRef.current.contains(target)
      ) {
        setIsCashierStatusMenuOpen(false);
      }
      if (
        isWorkspaceMenuOpen &&
        workspaceMenuRef.current &&
        !workspaceMenuRef.current.contains(target)
      ) {
        setIsWorkspaceMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isCashierStatusMenuOpen, isWorkspaceMenuOpen]);

  const allowedModules = useMemo(
    () => getAllowedModulesForUser(currentUser, isSuperAdminAuthenticated),
    [currentUser, isSuperAdminAuthenticated]
  );

  const activeStationCount = Math.max(
    1,
    Math.min(
      10,
      Number(activeCashierQuota ?? businessDomainConfig?.activeStationCount ?? businessProfile?.posUnitCount ?? 2) || 2
    )
  );

  const registeredStations = useMemo(
    () =>
      generatePosStations(
        activeStationCount,
        businessDomainConfig?.activePosTypes,
        businessDomainConfig?.primaryBusinessModel
      ),
    [
      activeStationCount,
      businessDomainConfig?.activePosTypes,
      businessDomainConfig?.primaryBusinessModel,
    ]
  );

  const activeDeviceStationCode = useMemo(() => {
    const candidate = normalizeStationCode(
      boundStation?.stationCode ||
        activeTerminal?.stationCode ||
        activeTerminal?.id ||
        registeredStations[0]?.stationCode ||
        'POS-01'
    );
    return registeredStations.some((s) => s.stationCode === candidate)
      ? candidate
      : registeredStations[0]?.stationCode || 'POS-01';
  }, [boundStation?.stationCode, activeTerminal?.stationCode, activeTerminal?.id, registeredStations]);

  const stationStatusList = useMemo(() => {
    return registeredStations.map((st) => {
      const openShift = (cashierShifts || []).find(
        (s) =>
          s.status === 'OPEN' &&
          normalizeStationCode(s.stationCode || s.terminalId || s.terminalName) === st.stationCode
      );
      const status: 'ONLINE' | 'ISTIRAHAT' | 'BELUM_BUKA' = openShift
        ? openShift.isPaused
          ? 'ISTIRAHAT'
          : 'ONLINE'
        : 'BELUM_BUKA';
      return {
        stationCode: st.stationCode,
        displayName: st.displayName,
        posTypeLabel: st.posTypeLabel,
        status,
        cashierName: openShift?.cashierName || null,
        openedAt: openShift?.openedAt || null,
        pausedAt: openShift?.pausedAt || null,
      };
    });
  }, [registeredStations, cashierShifts]);

  const onlineCashierCount = useMemo(
    () => stationStatusList.filter((s) => s.status === 'ONLINE').length,
    [stationStatusList]
  );
  const pausedCashierCount = useMemo(
    () => stationStatusList.filter((s) => s.status === 'ISTIRAHAT').length,
    [stationStatusList]
  );
  const unopenedCashierCount = useMemo(
    () => stationStatusList.filter((s) => s.status === 'BELUM_BUKA').length,
    [stationStatusList]
  );
  const totalStationCount = stationStatusList.length;

  // Jika belum login, tampilkan PublicGateway (Tanpa Tanya AI di layar gerbang login publik)
  if (!currentUser) {
    return (
      <>
        <ToastOverlay />
        <PublicGateway onLoginSuccess={() => {}} />
      </>
    );
  }

  const isSuperAdminSession = Boolean(
    isSuperAdminAuthenticated ||
      String(currentUser.role || '').toUpperCase().includes('SUPER') ||
      String(currentUser.division || '').toUpperCase().includes('SUPER') ||
      String(currentUser.user_id || currentUser.id || '').toUpperCase().includes('SUPER')
  );

  const defaultAllowedModule: ActiveNavModule = allowedModules[0] || 'pos';
  const requestedModule: ActiveNavModule =
    activeNav === 'home' ? defaultAllowedModule : activeNav;
  const currentModule: ActiveNavModule = allowedModules.includes(requestedModule)
    ? requestedModule
    : defaultAllowedModule;
  const isAuthorized = allowedModules.includes(currentModule);
  const isLight = theme === 'light';
  // Jalur Bypass 6 Manajemen HANYA tampil eksklusif di Mode SuperAdmin (Maintenance & Audit Developer Jacs Enterprise)
  const isHybridWorkspaceSwitcherVisible = isSuperAdminSession;
  // Fitur Tanya AI & AI Executive Advisor HANYA aktif untuk Executive & Management serta SuperAdmin
  const isAiFeatureAuthorized = Boolean(
    isSuperAdminSession || currentModule === 'executive' || currentModule === 'admin'
  );
  const activePillarMeta = HYBRID_MANAGEMENT_PILLARS.find((p) => p.id === currentModule);

  const handleWorkspaceSwitch = (targetMod: ActiveNavModule) => {
    setIsWorkspaceMenuOpen(false);
    setIsCashierStatusMenuOpen(false);

    if (targetMod === 'pos') {
      setPendingAuthTarget(null);
      setIsCashierWorkspaceActive(false);
      setPosEntrySignal((prev) => prev + 1);
      setActiveNav('pos');
      return;
    }

    if (IS_CLIENT_TRIAL_MODE) {
      setPendingAuthTarget(null);
      setIsCashierWorkspaceActive(false);
      setActiveNav(targetMod);
      return;
    }

    if (currentModule === 'pos') {
      const targetMeta = HYBRID_MANAGEMENT_PILLARS.find((p) => p.id === targetMod);
      const targetLabel =
        targetMeta?.label || (targetMod === 'admin' ? 'Konsol SuperAdmin' : String(targetMod).toUpperCase());
      setMgmtPinInput('');
      setMgmtPinError(null);
      setShowMgmtPin(false);
      setPendingAuthTarget({ moduleId: targetMod, label: targetLabel });
      return;
    }

    setIsCashierWorkspaceActive(false);
    setActiveNav(targetMod);
  };

  const handleConfirmMgmtPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAuthTarget) return;
    if (!verifyManagementAuthPin(mgmtPinInput)) {
      setMgmtPinError('PIN Otorisasi Manajemen salah! Periksa kembali PIN 6 digit dari SuperAdmin.');
      addAuditLog(
        'MANAGEMENT_PIN_AUTH_FAILED',
        `Gagal verifikasi PIN Otorisasi Manajemen saat akses ke ${pendingAuthTarget.label} dari Kasir POS.`,
        'WARNING'
      );
      showToast('PIN Otorisasi Manajemen salah! Akses ditolak.', 'error');
      return;
    }

    const approvedMod = pendingAuthTarget.moduleId;
    const approvedLabel = pendingAuthTarget.label;
    setPendingAuthTarget(null);
    setMgmtPinInput('');
    setMgmtPinError(null);
    setIsCashierWorkspaceActive(false);
    setActiveNav(approvedMod);
    addAuditLog(
      'MANAGEMENT_PIN_AUTH_SUCCESS',
      `Verifikasi PIN Otorisasi Manajemen berhasil untuk membuka ${approvedLabel}.`,
      'INFO'
    );
    showToast(`Otorisasi berhasil. Membuka ${approvedLabel}...`, 'success');
  };

  return (
    <div
      className={`h-screen w-full flex flex-col overflow-hidden font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-200 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      <ToastOverlay />
      {isAiFeatureAuthorized && <JacsAiAssistantDrawer />}

      {/* Bar Tipis Indikator Mode Demo Interaktif (?demo=1) */}
      {isDemoSandbox && (
        <div
          id="demo-sandbox-top-banner"
          className="shrink-0 z-50 w-full px-3 sm:px-4 lg:px-5 py-1.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 text-white border-b border-indigo-400/40 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold shadow-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FlaskConical className="w-3.5 h-3.5 shrink-0 text-cyan-200" />
            <span className="truncate tracking-wide font-bold">
              MODE DEMO INTERAKTIF (Data Simulasi Terisolasi)
            </span>
          </div>
          <button
            type="button"
            id="btn-reset-demo-sandbox"
            onClick={() => resetDemoSandboxSession()}
            className="px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white text-[10.5px] font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 active:scale-95"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Simulasi Demo</span>
          </button>
        </div>
      )}

      {/* Top Header 3-Zona: Identitas (Kiri) · Navigasi & Status Inti (Tengah) · Utilitas & Profil (Kanan) */}
      <header
        id="app-topbar"
        className={`sticky top-0 z-40 shrink-0 h-[58px] w-full max-w-full px-3 sm:px-4 lg:px-5 border-b backdrop-blur-md flex flex-nowrap items-center justify-between gap-2 sm:gap-3 lg:gap-4 ${
          isLight
            ? 'bg-white/95 border-slate-200/90 text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
            : 'bg-slate-950/95 border-slate-800/90 text-slate-100'
        }`}
      >
        {/* ZONA KIRI: Identitas (Logo + Nama Toko + Sub-label Jacs Enterprise) */}
        {(() => {
          const storeName = businessProfile?.name || businessProfile?.businessName || 'TOKO UTAMA';
          const stationNumber = activeDeviceStationCode.replace(/^POS-/i, '').padStart(2, '0');
          const subIdentityLabel = isSuperAdminSession
            ? 'Jacs Enterprise'
            : currentModule === 'pos'
            ? `Kasir ${stationNumber} · Jacs Enterprise`
            : `${activePillarMeta?.shortLabel || currentUser.division || 'ERP'} · Jacs Enterprise`;

          return (
            <div
              id="navbar-brand-identity"
              className="flex items-center gap-2.5 min-w-0 flex-1 max-w-[165px] sm:max-w-[205px] lg:max-w-[235px] xl:max-w-[265px]"
              title={`${storeName} — ${subIdentityLabel}${currentUser?.name ? ` (${currentUser.name})` : ''}`}
            >
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200/90'
                    : 'bg-slate-900 border-cyan-500/35 shadow-sm shadow-cyan-500/10'
                }`}
              >
                <img
                  src={businessProfile?.logoUrl || '/logo-jacs-enterprise.png'}
                  alt={`${storeName} Logo`}
                  className="w-full h-full object-contain p-0.5"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.dataset.fallbackApplied && !img.src.endsWith('/logo-jacs-enterprise.png')) {
                      img.dataset.fallbackApplied = 'true';
                      img.src = '/logo-jacs-enterprise.png';
                      return;
                    }
                    img.style.display = 'none';
                    const parent = img.parentElement;
                    if (parent && !parent.querySelector('.fallback-text')) {
                      const span = document.createElement('span');
                      span.className = 'font-bold text-xs text-cyan-600 dark:text-cyan-400 fallback-text';
                      span.innerText = 'JE';
                      parent.appendChild(span);
                    }
                  }}
                />
              </div>

              <div className="min-w-0 flex flex-col justify-center leading-tight">
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-[13px] sm:text-sm tracking-tight truncate text-slate-900 dark:text-white">
                  {storeName}
                </span>
                <span className="text-[10.5px] font-medium tracking-wide truncate text-slate-500 dark:text-slate-400">
                  {subIdentityLabel}
                </span>
              </div>
            </div>
          );
        })()}

        {/* ZONA TENGAH: Navigasi & Status Inti (Dropdown Kasir · Pill Kasir POS & SuperAdmin · Cloud Sync) */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 shrink-0">
          {isDemoSandbox && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 animate-pulse">
                DEMO SANDBOX
              </span>
              <button
                type="button"
                onClick={exitDemoSandboxSession}
                className="h-[32px] px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border border-rose-500/45 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                title="Keluar dari sesi demo dan bersihkan sandbox"
              >
                Keluar Demo
              </button>
            </div>
          )}

          {/* 1. Dropdown Ringkas Status Kasir (1/2 Online) — Executive & SuperAdmin */}
          {(currentModule === 'executive' || isSuperAdminSession) && (
            <div className="relative shrink-0" ref={cashierStatusMenuRef}>
              <button
                type="button"
                id="navbar-cashier-status-trigger"
                onClick={() => {
                  setIsWorkspaceMenuOpen(false);
                  setIsCashierStatusMenuOpen((prev) => !prev);
                }}
                className={`h-[34px] px-2 sm:px-2.5 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  onlineCashierCount > 0
                    ? isLight
                      ? 'bg-emerald-50 hover:bg-emerald-100/90 border-emerald-200/90 text-emerald-800'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/35 text-emerald-300'
                    : isLight
                    ? 'bg-amber-50 hover:bg-amber-100/90 border-amber-200/90 text-amber-800'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/35 text-amber-300'
                }`}
                title={`${onlineCashierCount}/${totalStationCount} Kasir Online — Klik untuk rincian status loket`}
                aria-label={`${onlineCashierCount} dari ${totalStationCount} Kasir Online`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    onlineCashierCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span className="font-mono tabular-nums font-bold">
                  {onlineCashierCount}/{totalStationCount}
                </span>
                <span className="hidden lg:inline font-medium">Online</span>
                <ChevronDown
                  className={`w-3 h-3 shrink-0 opacity-75 transition-transform ${
                    isCashierStatusMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isCashierStatusMenuOpen && (
                <div
                  id="navbar-cashier-status-popover"
                  className={`absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-80 max-w-[90vw] rounded-xl border shadow-2xl p-3 z-50 space-y-2.5 ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="text-xs font-bold">Status Live Loket Kasir</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {onlineCashierCount} Online · {pausedCashierCount} Istirahat · {unopenedCashierCount} Belum Buka
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                      {totalStationCount} LOKET
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                    {stationStatusList.map((st) => {
                      const isCurrentDevice = st.stationCode === activeDeviceStationCode;
                      return (
                        <div
                          key={st.stationCode}
                          className={`px-2.5 py-2 rounded-lg border flex items-center justify-between gap-2 ${
                            isCurrentDevice
                              ? isLight
                                ? 'bg-cyan-50/70 border-cyan-300'
                                : 'bg-cyan-500/10 border-cyan-500/35'
                              : isLight
                              ? 'bg-slate-50 border-slate-200'
                              : 'bg-slate-950/70 border-slate-800'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold">{st.stationCode}</span>
                              {isCurrentDevice && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-300">
                                  PC INI
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {st.cashierName ? `Kasir: ${st.cashierName}` : st.posTypeLabel}
                            </div>
                          </div>

                          {st.status === 'ONLINE' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Online
                            </span>
                          ) : st.status === 'ISTIRAHAT' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                              <Coffee className="w-3 h-3" />
                              Istirahat
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30 shrink-0">
                              <Clock className="w-3 h-3" />
                              Belum Buka Shift
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Navigasi Utama Segmented Pill: Kasir POS & SuperAdmin (Eksklusif SuperAdmin) */}
          {isHybridWorkspaceSwitcherVisible && (
            <div
              id="workspace-switcher-bar"
              ref={workspaceMenuRef}
              className={`relative h-[34px] p-0.5 rounded-full border flex items-center gap-0.5 shrink-0 ${
                isLight
                  ? 'bg-slate-100 border-slate-200/90'
                  : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <button
                type="button"
                id="btn-workspace-switcher-pos"
                onClick={() => handleWorkspaceSwitch('pos')}
                title="Kasir POS"
                aria-label="Kasir POS"
                className={`h-[28px] px-2 sm:px-2.5 md:px-3 rounded-full text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                  currentModule === 'pos'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Store className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">Kasir POS</span>
              </button>

              <div className="relative shrink-0">
                <button
                  type="button"
                  id="btn-workspace-switcher-pillars"
                  onClick={() => {
                    setIsCashierStatusMenuOpen(false);
                    setIsWorkspaceMenuOpen((prev) => !prev);
                  }}
                  title={
                    currentModule === 'admin'
                      ? 'SuperAdmin — Klik untuk pindah 6 Pilar Manajemen'
                      : activePillarMeta && currentModule !== 'pos'
                      ? `${activePillarMeta.label} — Klik untuk pindah modul`
                      : 'SuperAdmin & 6 Pilar Manajemen'
                  }
                  aria-label="SuperAdmin & Navigasi Modul"
                  className={`h-[28px] px-2 sm:px-2.5 md:px-3 rounded-full text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                    currentModule !== 'pos'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {currentModule !== 'pos' && currentModule !== 'admin' ? (
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="hidden md:inline">
                    {currentModule === 'admin'
                      ? 'SuperAdmin'
                      : activePillarMeta && currentModule !== 'pos'
                      ? activePillarMeta.shortLabel
                      : 'SuperAdmin'}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 shrink-0 opacity-80 transition-transform ${
                      isWorkspaceMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isWorkspaceMenuOpen && (
                  <div
                    className={`absolute right-0 mt-2.5 w-72 max-w-[90vw] rounded-xl border shadow-2xl p-1.5 z-50 space-y-1 ${
                      isLight
                        ? 'bg-white border-slate-200 text-slate-900'
                        : 'bg-slate-900 border-slate-700 text-slate-100'
                    }`}
                  >
                    <div className="px-2.5 py-1.5 border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-500 flex items-center justify-between">
                      <span>Bypass 6 Manajemen • SuperAdmin</span>
                      <span
                        className={
                          isLight
                            ? 'bg-transparent border-0 text-[9px] font-bold text-slate-900'
                            : 'px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[9px] font-bold'
                        }
                      >
                        JACS
                      </span>
                    </div>
                    {HYBRID_MANAGEMENT_PILLARS.filter((p) => allowedModules.includes(p.id)).map((pillar) => {
                      const PIcon = pillar.icon;
                      const isActivePillar = currentModule === pillar.id;
                      return (
                        <button
                          key={pillar.id}
                          type="button"
                          onClick={() => handleWorkspaceSwitch(pillar.id)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between gap-2 cursor-pointer transition ${
                            isActivePillar
                              ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/40 font-semibold'
                              : isLight
                              ? 'hover:bg-slate-100 text-slate-800'
                              : 'hover:bg-slate-800 text-slate-200'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <PIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{pillar.label}</span>
                          </span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => handleWorkspaceSwitch('admin')}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 cursor-pointer transition border-t mt-1 pt-2 ${
                        currentModule === 'admin'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
                          : isLight
                          ? 'border-slate-200 hover:bg-slate-100 text-slate-800'
                          : 'border-slate-800 hover:bg-slate-800 text-amber-300'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>Konsol SuperAdmin (Maintenance)</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Lencana Status Cloud Ringkas (SYNCED + Tombol Refresh Kecil) */}
          <DualBackendStatusWidget />
        </div>

        {/* ZONA KANAN: Utilitas & Profil (Tanya AI · Bahasa ID · Tema · Keluar) */}
        <div className="flex items-center justify-end gap-1.5 shrink-0">
          {isAiFeatureAuthorized && (
            <button
              type="button"
              id="btn-app-topbar-ask-ai"
              onClick={openAiAssistant}
              className={`h-[34px] w-[34px] lg:w-auto lg:px-2.5 rounded-lg border text-[11.5px] font-semibold font-['Plus_Jakarta_Sans'] flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isLight
                  ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-800'
                  : 'bg-cyan-950/60 hover:bg-cyan-900/80 border-cyan-700/60 text-cyan-300'
              }`}
              title={
                language === 'en'
                  ? 'Ask JacS AI Assistant (Executive & SuperAdmin)'
                  : 'Tanya JacS AI Assistant (Executive & SuperAdmin)'
              }
              aria-label={language === 'en' ? 'Ask AI' : 'Tanya AI'}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <span className="hidden lg:inline">{language === 'en' ? 'Ask AI' : 'Tanya AI'}</span>
            </button>
          )}

          <div
            className={`hidden sm:block w-px h-5 mx-0.5 shrink-0 ${
              isLight ? 'bg-slate-200' : 'bg-slate-800'
            }`}
            aria-hidden="true"
          />

          <button
            type="button"
            id="btn-app-topbar-language-toggle"
            onClick={toggleLanguage}
            className={`w-[34px] h-[34px] rounded-lg border text-[11px] font-mono font-bold uppercase flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
            }`}
            title={language === 'id' ? 'Ganti Bahasa (ID / EN)' : 'Switch Language (EN / ID)'}
            aria-label={language === 'id' ? 'Ganti Bahasa' : 'Switch Language'}
          >
            {(language || 'id').toUpperCase()}
          </button>

          <button
            type="button"
            id="btn-app-topbar-theme-toggle"
            onClick={toggleTheme}
            className={`w-[34px] h-[34px] rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
            title={
              theme === 'dark'
                ? language === 'en'
                  ? 'Switch to Light Mode'
                  : 'Mode Terang'
                : language === 'en'
                ? 'Switch to Dark Mode'
                : 'Mode Gelap'
            }
            aria-label={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          <button
            type="button"
            id="btn-app-topbar-logout"
            onClick={logout}
            className={`h-[34px] w-[34px] lg:w-auto lg:px-2.5 rounded-lg border text-[11.5px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isLight
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                : 'bg-rose-950/50 hover:bg-rose-600 border-rose-800/60 text-rose-300 hover:text-white'
            }`}
            title={language === 'en' ? 'Logout & return to Login gateway' : 'Keluar & kembali ke halaman Login'}
            aria-label={language === 'en' ? 'Logout' : 'Keluar'}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden lg:inline">{language === 'en' ? 'Logout' : 'Keluar'}</span>
          </button>
        </div>
      </header>

      {/* Konten Modul Aktif */}
      <main className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 pt-3 pb-20">
        {remoteMaintenanceLock.locked &&
          (isSuperAdminAuthenticated || currentUser?.role === 'Super Admin' || currentModule === 'admin') && (
            <div className="mb-3 px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-500 dark:text-rose-300 text-xs font-bold flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 shrink-0" />
                <span>
                  Remote Maintenance Lock AKTIF untuk target ({remoteMaintenanceLock.targetBranchId || 'ALL_BRANCHES'}): &ldquo;{remoteMaintenanceLock.message}&rdquo;
                </span>
              </div>
              <span className="text-[10px] font-mono opacity-80">Konsol SuperAdmin tetap terbuka</span>
            </div>
          )}

        <SystemHealthNotificationBanner />

        {remoteMaintenanceLock.locked &&
        !isSuperAdminAuthenticated &&
        currentUser?.role !== 'Super Admin' &&
        currentModule !== 'admin' &&
        (!remoteMaintenanceLock.targetBranchId ||
          remoteMaintenanceLock.targetBranchId === 'ALL_BRANCHES' ||
          remoteMaintenanceLock.targetBranchId === activeBranchId) ? (
          <div className="min-h-[75vh] flex items-center justify-center p-6">
            <div
              className={`max-w-lg w-full p-7 rounded-3xl border text-center space-y-5 shadow-2xl ${
                isLight
                  ? 'bg-[#F6F8FB] border-rose-300 text-slate-900'
                  : 'bg-[#161b22] border-rose-500/40 text-slate-100'
              }`}
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center">
                <Lock className="w-7 h-7 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-[10px] font-mono font-bold text-rose-500 uppercase tracking-wider">
                  REMOTE_MAINTENANCE_LOCK • {activeBranchId}
                </div>
                <h2 className="text-lg font-black uppercase tracking-wide">
                  Terminal Sedang Dalam Pemeliharaan
                </h2>
                <p
                  className={`text-sm font-medium p-3.5 rounded-xl border ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-700'
                      : 'bg-[#0d1117] border-gray-800 text-slate-200'
                  }`}
                >
                  {remoteMaintenanceLock.message}
                </p>
                {remoteMaintenanceLock.lockedAt && (
                  <p className="text-[11px] font-mono text-slate-400">
                    Dikunci oleh {remoteMaintenanceLock.lockedBy || 'SuperAdmin Pusat'} pada{' '}
                    {new Date(remoteMaintenanceLock.lockedAt).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await triggerManualHeartbeatPoll();
                    showToast('Status pemeliharaan diperiksa ke server pusat.', 'info');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Periksa Status Pusat</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Kembali ke Gateway Login</span>
                </button>
              </div>
            </div>
          </div>
        ) : !isAuthorized ? (
          <div className="min-h-[70vh] flex items-center justify-center p-6">
            <div
              className={`max-w-md w-full p-6 rounded-2xl border text-center space-y-4 shadow-xl ${
                isLight ? 'bg-[#F6F8FB] border-rose-200 text-slate-900' : 'bg-slate-900 border-rose-500/30 text-slate-100'
              }`}
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-black uppercase tracking-wide flex items-center justify-center gap-1.5">
                  <Lock className="w-4 h-4 text-rose-400" />
                  Akses Divisi Dibatasi (RBAC)
                </h2>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Sesi Anda sebagai <span className="font-bold text-cyan-400">{contextualProfile.position}</span> tidak memiliki izin untuk membuka modul{' '}
                  <span className="font-mono font-bold uppercase">{currentModule}</span>.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveNav(defaultAllowedModule)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Divisi Saya</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Ganti Akun</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <ModuleErrorBoundary
            key={`${currentModule}-${moduleResetCounter}`}
            activeModule={currentModule}
            branchId={activeBranchId}
            isLight={isLight}
            onErrorCaptured={recordSystemError}
            onResetModule={() => setModuleResetCounter((c) => c + 1)}
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64 text-xs font-mono text-cyan-400">
                  Memuat modul JacS Enterprise...
                </div>
              }
            >
              {currentModule === 'executive' && <ExecutiveModule />}
              {currentModule === 'pos' && <POSModule returnToRegisterSignal={posEntrySignal} />}
              {currentModule === 'master-data' && <MasterDataModule />}
              {currentModule === 'warehouse' && <WarehouseModule />}
              {currentModule === 'purchasing' && <PurchasingModule />}
              {currentModule === 'finance' && <FinanceModule />}
              {currentModule === 'hr' && <HRModule />}
              {currentModule === 'admin' && <SuperAdminModule />}
            </Suspense>
          </ModuleErrorBoundary>
        )}
      </main>

      {/* Modal Verifikasi PIN Otorisasi Manajemen (6 Digit) saat keluar dari Kasir POS ke 6 Pilar Manajemen */}
      {pendingAuthTarget && (
        <div
          id="modal-mgmt-auth-pin-navbar"
          className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPendingAuthTarget(null)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
              isLight
                ? 'bg-white border-amber-400 text-slate-900'
                : 'bg-slate-900 border-amber-500/50 text-slate-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-500 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">PIN Otorisasi Manajemen</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tujuan: <strong className="text-amber-500">{pendingAuthTarget.label}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingAuthTarget(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Tutup modal PIN"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmMgmtPinSubmit} className="p-5 space-y-4">
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Masukkan <strong>PIN Otorisasi Manajemen (6 digit)</strong> yang diatur di Konsol SuperAdmin sebelum meninggalkan layar Kasir POS.
              </p>

              <div className="space-y-1.5">
                <label
                  htmlFor="input-verify-mgmt-pin-navbar"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  PIN 6 Digit
                </label>
                <div className="relative">
                  <input
                    id="input-verify-mgmt-pin-navbar"
                    type={showMgmtPin ? 'text' : 'password'}
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    value={mgmtPinInput}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setMgmtPinInput(digits);
                      setMgmtPinError(null);
                    }}
                    placeholder="••••••"
                    className={`w-full px-4 py-3 pr-11 rounded-xl border font-mono font-bold text-lg tracking-[0.4em] text-center outline-none transition ${
                      mgmtPinError
                        ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                        : isLight
                        ? 'bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900'
                        : 'bg-slate-950 border-slate-700 focus:border-amber-400 text-amber-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowMgmtPin((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 cursor-pointer"
                    aria-label="Tampilkan atau sembunyikan PIN"
                  >
                    {showMgmtPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mgmtPinError && (
                <div className="p-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-500 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{mgmtPinError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingAuthTarget(null)}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verifikasi &amp; Buka</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TERMINAL IDLE AUTO-LOCK FULL-SCREEN OVERLAY — KHUSUS MODUL KASIR POS */}
      {isIdleLocked && currentModule === 'pos' && (
        <div className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-amber-500/50 bg-[#0d1117] text-white p-6 shadow-[0_0_40px_rgba(245,158,11,0.22)] space-y-5">
            <div className="flex items-center gap-3.5 pb-4 border-b border-gray-800">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    TERMINAL IDLE AUTO-LOCK • POS
                  </span>
                </div>
                <h3 className="text-base font-black mt-1">
                  Layar Terminal Kasir POS Terkunci Otomatis
                </h3>
                <p className="text-[11px] text-gray-400">
                  {businessProfile?.name || 'JacS RetailOS'} • Modul KASIR POS
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#161b22] border border-gray-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-gray-400 text-[11px] font-mono">
                <span>Alasan Kunci:</span>
                <span className="text-amber-400 font-semibold">
                  {idleAutoLockMinutes > 0 ? `Auto-Lock (${idleAutoLockMinutes} Menit)` : 'Manual Lock'}
                </span>
              </div>
              <p className="text-gray-300 text-[11px]">{idleLockReason}</p>
              {idleLockedAt && (
                <p className="text-[10px] font-mono text-gray-500">
                  Waktu Terkunci: {new Date(idleLockedAt).toLocaleTimeString('id-ID')}
                </p>
              )}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIdleUnlockError(null);
                setIsUnlockingIdle(true);
                const res = await unlockIdleScreen(idleUnlockPin);
                setIsUnlockingIdle(false);
                if (res.success) {
                  setIdleUnlockPin('');
                  setIdleUnlockError(null);
                } else {
                  setIdleUnlockError(res.message);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Masukkan PIN Divisi / Operator (4 Digit) atau PIN Manajemen (6 Digit)
                </label>
                <input
                  type="password"
                  autoFocus
                  value={idleUnlockPin}
                  onChange={(e) => {
                    setIdleUnlockPin(e.target.value);
                    setIdleUnlockError(null);
                  }}
                  placeholder="•••• (Default: 1234 / 123456)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-[#090d13] text-amber-300 font-mono font-bold text-center text-lg tracking-[0.35em] focus:outline-none focus:border-amber-400"
                />
              </div>

              {idleUnlockError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{idleUnlockError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isUnlockingIdle || !idleUnlockPin.trim()}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isUnlockingIdle ? 'Memverifikasi PIN...' : 'Buka Kunci Layar Terminal'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <AuditProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </AuditProvider>
  );
}

export default App;