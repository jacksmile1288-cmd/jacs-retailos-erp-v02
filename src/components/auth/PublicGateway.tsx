import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Briefcase,
  Users,
  CreditCard,
  ShoppingBag,
  Boxes,
  Store,
  Lock,
  LogIn,
  User as UserIcon,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Loader2,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  MonitorPlay,
  Download,
  FlaskConical,
  RefreshCw,
  KeyRound,
} from 'lucide-react';
import { User } from '../../types';
import { signSessionPayload } from '../../utils/securityUtils';
import {
  DEMO_DIVISION_QUICK_PINS,
  DEMO_SANDBOX_ACTIVE_USER_KEY,
  DEMO_SANDBOX_SESSION_SIG_KEY,
  DemoDivisionQuickPin,
} from '../../utils/demoSandbox';

interface PublicGatewayProps {
  onLoginSuccess: (user: any) => void;
}

interface ModuleCardConfig {
  id: string;
  title: string;
  subTitle: string;
  colorHex: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  defaultUsername: string;
}

const GATEWAY_MODULES: ModuleCardConfig[] = [
  {
    id: 'executive',
    title: 'Executive & Management',
    subTitle: 'KPI, Analitik & Otorisasi',
    colorHex: '#3B82F6',
    icon: Briefcase,
    defaultUsername: 'Executive',
  },
  {
    id: 'finance',
    title: 'Finance & Accounting',
    subTitle: 'Kas, Bank, AP/AR & Ledger',
    colorHex: '#22C55E',
    icon: CreditCard,
    defaultUsername: 'Finance',
  },
  {
    id: 'purchasing',
    title: 'Purchasing',
    subTitle: 'Purchase Request & Order',
    colorHex: '#F97316',
    icon: ShoppingBag,
    defaultUsername: 'Purchasing',
  },
  {
    id: 'pos',
    title: 'Point of Sale (POS)',
    subTitle: 'Kasir & Transaksi 80mm',
    colorHex: '#F43F5E',
    icon: Store,
    defaultUsername: 'Kasir',
  },
  {
    id: 'warehouse',
    title: 'Warehouse & Inventory',
    subTitle: 'SKU, Mutasi & Stock Opname',
    colorHex: '#06B6D4',
    icon: Boxes,
    defaultUsername: 'Gudang',
  },
  {
    id: 'hr',
    title: 'Human Resources (HR)',
    subTitle: 'Direktori Staf, Presensi & Cuti',
    colorHex: '#A855F7',
    icon: Users,
    defaultUsername: 'HR',
  },
];

// Default latar lorong swalayan modern (dapat ditimpa foto toko sendiri dari SuperAdmin)
const DEFAULT_SUPERMARKET_BG =
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1920&q=80';

export const PublicGateway: React.FC<PublicGatewayProps> = ({ onLoginSuccess }) => {
  const {
    showToast,
    setCurrentUser,
    setActiveUser,
    setIsSuperAdminAuthenticated,
    setActiveNav,
    verifyDivisionPin,
    verifySuperAdminAuthorityCode,
    addAuditLog,
    theme,
    toggleTheme,
    openAiAssistant,
    businessProfile,
    pwaInstallPrompt,
    triggerPwaInstall,
    isDemoSandbox,
    resetDemoSandboxSession,
    launchInteractiveDemoSession,
  } = useApp();

  const [showDemoModal, setShowDemoModal] = useState(false);
  const [selectedDemoBusinessType, setSelectedDemoBusinessType] = useState('RETAIL');

  const DEMO_BUSINESS_TYPES = [
    { id: 'RETAIL', label: 'RETAIL — Retail & Minimarket' },
    { id: 'FNB', label: 'FNB — F&B / Restoran & Kafe (Meja & BOM)' },
    { id: 'PHARMACY', label: 'PHARMACY — Apotek & Klinik (Batch & Kedaluwarsa)' },
    { id: 'WORKSHOP', label: 'WORKSHOP — Bengkel & Otomotif (Jasa & Sparepart)' },
    { id: 'SALON', label: 'SALON — Salon & Barbershop (Stylist & Paket)' },
    { id: 'FASHION', label: 'FASHION — Fashion & Butik (Ukuran & Warna)' },
    { id: 'CONSTRUCTION', label: 'CONSTRUCTION — Toko Bangunan & Material' },
    { id: 'ELECTRONICS', label: 'ELECTRONICS — Elektronik & Gadget (IMEI & Garansi)' },
    { id: 'LAUNDRY', label: 'LAUNDRY — Laundry & Jasa (Kiloan & Status)' },
    { id: 'WHOLESALE', label: 'WHOLESALE — Grosir & Distributor (B2B & Kredit)' },
  ];

  const handleLaunchDemoDivision = (divId: string) => {
    launchInteractiveDemoSession(selectedDemoBusinessType, divId as any);
    setShowDemoModal(false);
  };

  // State Interactive 3D Brand Cover (triggered by 30s idle timer)
  const [isCoverVisible, setIsCoverVisible] = useState<boolean>(false);
  const [tiltCoords, setTiltCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const coverPointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const IDLE_TIMEOUT_MS = 30000; // 30 seconds idle timer

  const [showSuperAdminModal, setShowSuperAdminModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('pos');
  const [hoveredModuleId, setHoveredModuleId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('Kasir');
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shakePhase, setShakePhase] = useState<'none' | 'left' | 'right'>('none');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [failedPinAttempts, setFailedPinAttempts] = useState<number>(0);
  const [pinLockoutUntil, setPinLockoutUntil] = useState<number>(0);
  const [superAdminCode, setSuperAdminCode] = useState<string>('');
  const [superAdminError, setSuperAdminError] = useState<string | null>(null);
  const [isVerifyingSuperAdmin, setIsVerifyingSuperAdmin] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<'username' | 'pin' | null>(null);

  const pinInputRef = useRef<HTMLInputElement>(null);

  // Judul Utama Bersih: KHANSA SWALAYAN
 const rawStoreName = (
  (businessProfile as any)?.storeName ||
  (businessProfile as any)?.businessName ||
  (businessProfile as any)?.name ||
  (businessProfile as any)?.companyName ||
  'KHANSA SWALAYAN'
)
  .toString()
  .trim();

const storeWords = rawStoreName.split(/\s+/).filter(Boolean);
const primaryStoreTitle =
  storeWords.length > 1 ? storeWords.slice(0, -1).join(' ') : storeWords[0] || 'KHANSA';
const secondaryStoreTitle =
  storeWords.length > 1 ? storeWords[storeWords.length - 1] : 'SWALAYAN';
const displayStoreLabel = rawStoreName || 'KHANSA SWALAYAN';

  const customCoverBgUrl =
    (businessProfile as any)?.welcomeCoverImageUrl ||
    (businessProfile as any)?.storePhotoUrl ||
    DEFAULT_SUPERMARKET_BG;

  const dismissWelcomeCover = useCallback(() => {
    if (!isCoverVisible) return;
    setIsCoverVisible(false);
    coverPointerStartRef.current = null;
    setTimeout(() => {
      pinInputRef.current?.focus();
    }, 320);
  }, [isCoverVisible]);

  const resetIdleTimer = useCallback(() => {
    if (isCoverVisible) {
      setIsCoverVisible(false);
    }
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setIsCoverVisible(true);
    }, IDLE_TIMEOUT_MS);
  }, [isCoverVisible]);

  useEffect(() => {
    // Start initial idle timer
    idleTimerRef.current = setTimeout(() => {
      setIsCoverVisible(true);
    }, IDLE_TIMEOUT_MS);

    const handleUserActivity = () => {
      resetIdleTimer();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, [resetIdleTimer]);

  const handleCoverMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { innerWidth, innerHeight } = window;
    const normX = (e.clientX / innerWidth - 0.5) * 2;
    const normY = (e.clientY / innerHeight - 0.5) * 2;
    setTiltCoords({ x: normX * 6, y: -normY * 6 });

    if (!coverPointerStartRef.current) {
      coverPointerStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const deltaX = Math.abs(e.clientX - coverPointerStartRef.current.x);
    const deltaY = Math.abs(e.clientY - coverPointerStartRef.current.y);
    if (deltaX + deltaY > 38) {
      dismissWelcomeCover();
    }
  };

  const selectedModule =
    GATEWAY_MODULES.find((m) => m.id === selectedModuleId) || GATEWAY_MODULES[3];

  const triggerErrorShake = () => {
    setShakePhase('left');
    setTimeout(() => setShakePhase('right'), 70);
    setTimeout(() => setShakePhase('left'), 140);
    setTimeout(() => setShakePhase('right'), 210);
    setTimeout(() => setShakePhase('none'), 280);
  };

  const handleCardClick = (mod: ModuleCardConfig) => {
    setSelectedModuleId(mod.id);
    setUsername(mod.defaultUsername);
    setPin('');
    setShowPin(false);
    setErrorMsg(null);
    setTimeout(() => {
      pinInputRef.current?.focus();
    }, 20);
  };

  const getDivisionDetails = (modId: string, inputUsername: string, enteredPin?: string): User => {
    const roleMap: Record<string, User['role']> = {
      executive: 'EXECUTIVE',
      finance: 'FINANCE_MANAGER',
      purchasing: 'PURCHASING_OFFICER',
      pos: 'Kasir',
      warehouse: 'WAREHOUSE_HEAD',
      hr: 'HR_MANAGER',
    };

    if (modId === 'pos') {
      const cleanedName = (inputUsername || 'Kasir 01').trim();
      const cleanedPin = (enteredPin || '').trim();
      const pinMatch = cleanedPin.match(/^110(\d)$/);
      const nameMatch =
        cleanedName.match(/(?:kasir|pos|loket)\s*[-#]?\s*0?(\d+)/i) || cleanedName.match(/0?(\d+)$/);
      const slotNum = pinMatch
        ? Math.max(1, Math.min(10, parseInt(pinMatch[1], 10)))
        : nameMatch
        ? Math.max(1, Math.min(10, parseInt(nameMatch[1], 10)))
        : 1;
      const stationCode = `POS-${String(slotNum).padStart(2, '0')}`;
      const normalizedCashierName = nameMatch
        ? `Kasir ${String(slotNum).padStart(2, '0')}`
        : pinMatch
        ? `Kasir ${String(slotNum).padStart(2, '0')}`
        : cleanedName;

      return {
        id: `kasir-${String(slotNum).padStart(2, '0')}`,
        user_id: slotNum === 1 ? 'USR-003' : slotNum === 2 ? 'USR-004' : `USR-KASIR-${String(slotNum).padStart(2, '0')}`,
        name: normalizedCashierName,
        role: 'Kasir',
        division: 'POS',
        assignedTerminalId: stationCode,
        email: `kasir${String(slotNum).padStart(2, '0')}@jacs.retailos.id`,
        status: 'Active',
        pin: '',
      };
    }

    return {
      id: modId,
      user_id: `USR-${modId.toUpperCase()}`,
      name: inputUsername || 'Staff',
      role: roleMap[modId] || 'Manager',
      division: modId.toUpperCase(),
      email: `${modId}@jacs.retailos.id`,
      status: 'Active',
      pin: '',
    };
  };

  const executeLogin = async () => {
    if (isVerifying) return;
    setErrorMsg(null);

    const now = Date.now();
    if (now < pinLockoutUntil) {
      const remainingSec = Math.ceil((pinLockoutUntil - now) / 1000);
      setErrorMsg(`Terlalu banyak percobaan salah. Terminal terkunci ${remainingSec} detik.`);
      triggerErrorShake();
      return;
    }

    if (!username.trim()) {
      setErrorMsg('Username wajib diisi!');
      triggerErrorShake();
      return;
    }

    if (!pin.trim()) {
      setErrorMsg('PIN / Passcode wajib diisi!');
      triggerErrorShake();
      pinInputRef.current?.focus();
      return;
    }

    setIsVerifying(true);
    const isValidPin = await verifyDivisionPin(selectedModuleId, pin.trim());
    if (!isValidPin) {
      const nextAttempts = failedPinAttempts + 1;
      setFailedPinAttempts(nextAttempts);
      setIsVerifying(false);

      if (nextAttempts >= 5) {
        const lockUntil = Date.now() + 30000;
        setPinLockoutUntil(lockUntil);
        setFailedPinAttempts(0);
        setErrorMsg('5x salah PIN berturut-turut! Login dikunci 30 detik.');
        addAuditLog(
          'GATEWAY_BRUTE_FORCE_LOCKOUT',
          `5x gagal login pada divisi ${selectedModuleId.toUpperCase()} (user: ${username.trim()}). Dikunci 30 detik.`,
          'ERROR'
        );
        showToast('Keamanan: Terlalu banyak percobaan gagal. Dikunci 30 detik.', 'error');
      } else {
        setErrorMsg(`PIN / Passcode divisi salah! (${nextAttempts}/5 percobaan)`);
        addAuditLog(
          'GATEWAY_LOGIN_FAILED',
          `Gagal verifikasi PIN SHA-256 pada divisi ${selectedModuleId.toUpperCase()} (percobaan ${nextAttempts}/5).`,
          'WARNING'
        );
      }

      triggerErrorShake();
      pinInputRef.current?.focus();
      pinInputRef.current?.select();
      return;
    }

    setFailedPinAttempts(0);
    setPinLockoutUntil(0);
    const userObj = getDivisionDetails(selectedModuleId, username.trim(), pin.trim());
    const signedToken = await signSessionPayload(userObj);

    const targetNavModule = selectedModuleId;

    setTimeout(() => {
      setCurrentUser(userObj);
      setActiveUser(userObj);
      setActiveNav(targetNavModule);

      try {
        const authStore = isDemoSandbox ? sessionStorage : localStorage;
        const userKey = isDemoSandbox ? DEMO_SANDBOX_ACTIVE_USER_KEY : 'jacs_active_user';
        const sigKey = isDemoSandbox ? DEMO_SANDBOX_SESSION_SIG_KEY : 'jacs_session_sig';
        authStore.setItem(userKey, signedToken);
        const parsed = JSON.parse(atob(signedToken));
        if (parsed?.sig) {
          authStore.setItem(sigKey, parsed.sig);
        }
      } catch {}

      addAuditLog(
        'GATEWAY_LOGIN_SUCCESS',
        `Login terverifikasi SHA-256 ke divisi ${selectedModuleId.toUpperCase()} oleh ${userObj.name}.`,
        'INFO'
      );
      setIsVerifying(false);
      showToast(`Berhasil masuk sebagai ${userObj.name} (${userObj.division})`, 'success');
      onLoginSuccess(userObj);
    }, 260);
  };

  const handleSuperAdminVerify = async () => {
    if (isVerifyingSuperAdmin) return;
    setSuperAdminError(null);

    if (!superAdminCode.trim()) {
      setSuperAdminError('Kode otoritas wajib diisi!');
      return;
    }

    setIsVerifyingSuperAdmin(true);
    const isAuthValid = await verifySuperAdminAuthorityCode(superAdminCode.trim());

    if (isAuthValid) {
      const superAdminUser: User = {
        id: 'superadmin',
        user_id: 'USR-SUPER-ADMIN',
        name: 'Super Administrator',
        role: 'Super Admin',
        division: 'SUPER ADMIN',
        email: 'superadmin@jacs.retailos.id',
        status: 'Active',
        pin: '',
      };
      const signedToken = await signSessionPayload(superAdminUser);

      setTimeout(() => {
        setShowSuperAdminModal(false);
        setSuperAdminCode('');
        setIsVerifyingSuperAdmin(false);
        setIsSuperAdminAuthenticated(true);
        setActiveNav('admin');
        setCurrentUser(superAdminUser);
        setActiveUser(superAdminUser);
        try {
          const authStore = isDemoSandbox ? sessionStorage : localStorage;
          const userKey = isDemoSandbox ? DEMO_SANDBOX_ACTIVE_USER_KEY : 'jacs_active_user';
          const sigKey = isDemoSandbox ? DEMO_SANDBOX_SESSION_SIG_KEY : 'jacs_session_sig';
          authStore.setItem(userKey, signedToken);
          const parsed = JSON.parse(atob(signedToken));
          if (parsed?.sig) {
            authStore.setItem(sigKey, parsed.sig);
          }
        } catch {}
        addAuditLog('SUPERADMIN_GATEWAY_LOGIN', 'Akses SuperAdmin diverifikasi via SHA-256.', 'SECURITY');
        onLoginSuccess(superAdminUser);
        showToast('Akses SuperAdmin Diterima', 'success');
      }, 240);
    } else {
      setIsVerifyingSuperAdmin(false);
      setSuperAdminError('Kode otoritas salah!');
      addAuditLog('SUPERADMIN_GATEWAY_FAILED', 'Kode otoritas SuperAdmin ditolak (verifikasi SHA-256 gagal).', 'WARNING');
      showToast('Kode otoritas ditolak', 'error');
      setSuperAdminCode('');
    }
  };

  const handleDemoQuickPinClick = (item: DemoDivisionQuickPin) => {
    setSelectedModuleId(item.id);
    setUsername(item.username);
    setPin(item.pin);
    setErrorMsg(null);
    setTimeout(() => {
      pinInputRef.current?.focus();
    }, 30);
  };

  const shakeTransformClass =
    shakePhase === 'left'
      ? '-translate-x-1.5'
      : shakePhase === 'right'
      ? 'translate-x-1.5'
      : 'translate-x-0';

  return (
    <div
      className={`relative h-screen w-screen overflow-hidden text-slate-900 dark:text-white transition-colors duration-300 flex flex-col justify-between font-sans select-none ${
        theme === 'light'
          ? 'bg-gradient-to-br from-[#F8FBFF] via-[#EDF6FF] to-[#F0FDFA]'
          : 'bg-slate-100 dark:bg-[#070d1e]'
      }`}
    >
      {/* ========================================================================
          INTERACTIVE 3D BRAND COVER — KHANSA SWALAYAN
      ======================================================================== */}
      <div
        id="welcome-3d-brand-cover"
        onClick={dismissWelcomeCover}
        onMouseMove={handleCoverMouseMove}
        onTouchStart={dismissWelcomeCover}
        className={`fixed inset-0 z-[90] flex flex-col justify-between p-5 sm:p-8 cursor-pointer transition-all duration-1000 ease-in-out overflow-hidden bg-[#030b1a] ${
          isCoverVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        {/* 1. Foto Latar Lorong Swalayan Samar (Blur + Vignette) */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center scale-105 blur-[6px] opacity-45 transition-transform duration-700"
          style={{ backgroundImage: `url(${customCoverBgUrl})` }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 48%, rgba(6, 40, 75, 0.55) 0%, rgba(3, 14, 34, 0.85) 65%, rgba(2, 8, 20, 0.96) 100%)',
          }}
        />

        {/* Lantai Grid Digital Cyber-Cyan di Bagian Bawah */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-56 opacity-45"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(34,211,238,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,211,238,0.22) 1px, transparent 1px)',
            backgroundSize: '44px 28px',
            transform: 'perspective(500px) rotateX(62deg)',
            transformOrigin: 'bottom',
            maskImage: 'linear-gradient(to top, black 25%, transparent 95%)',
          }}
        />

        {/* Partikel Cahaya & Bintang Berpendar */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[22%] left-[18%] w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee] animate-ping" />
          <div className="absolute top-[28%] right-[22%] w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#34d399] animate-pulse" />
          <div className="absolute bottom-[32%] left-[26%] w-1.5 h-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_#38bdf8] animate-pulse" />
          <div className="absolute bottom-[28%] right-[28%] w-2 h-2 rounded-full bg-teal-300 shadow-[0_0_12px_#2dd4bf] animate-ping" />
        </div>

        {/* 2. SUDUT KIRI ATAS: Watermark Tunggal Logo + Nama Developer */}
        <div className="relative z-20 flex items-center justify-between">
          <div
            className={`flex items-center gap-2.5 ${
              theme === 'light'
                ? 'bg-transparent border-0 shadow-none p-0'
                : 'px-3 py-1.5 rounded-xl bg-slate-950/50 border border-cyan-400/25 backdrop-blur-md shadow-lg'
            }`}
          >
            <img
              src="/logo-jacs-enterprise.png"
              alt="JacS Enterprise"
              className="h-7 w-7 object-contain shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-['Plus_Jakarta_Sans'] font-semibold text-sm tracking-wider text-white drop-shadow-sm">
              JacS Enterprise
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 text-[11px] font-mono backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>POS READY</span>
          </div>
        </div>

        {/* 3. TENGAH: Kartu Kaca 3D + Keranjang Belanja (Kiri) + Troli Belanja (Kanan) + Cincin Orbital */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-2">
          <div
            className="relative w-full max-w-4xl flex items-center justify-center transition-transform duration-200 ease-out"
            style={{
              transform: `perspective(1200px) rotateY(${tiltCoords.x}deg) rotateX(${tiltCoords.y}deg)`,
            }}
          >
            {/* Cincin Orbital Hologram Cyber-Cyan & Emerald Mengelilingi Dasar Kartu */}
            <div
              className="pointer-events-none absolute -bottom-7 w-[104%] max-w-[920px] h-28 rounded-[100%] border-2 border-cyan-300/70"
              style={{
                boxShadow:
                  '0 0 35px rgba(34,211,238,0.65), inset 0 0 25px rgba(16,185,129,0.55)',
              }}
            />
            <div
              className="pointer-events-none absolute -bottom-9 w-[96%] max-w-[850px] h-24 rounded-[100%] border border-emerald-400/60"
              style={{
                boxShadow: '0 0 30px rgba(16,185,129,0.55)',
              }}
            />

            {/* Bingkai Utama Glassmorphism 3D */}
            <div
              className="relative w-full max-w-3xl rounded-[2rem] border-2 border-cyan-300/75 bg-gradient-to-b from-sky-950/65 via-slate-900/70 to-emerald-950/65 backdrop-blur-xl px-6 py-12 sm:px-14 sm:py-16 text-center"
              style={{
                boxShadow:
                  '0 25px 70px -10px rgba(0, 0, 0, 0.85), 0 0 45px rgba(56, 189, 248, 0.45), inset 0 0 30px rgba(34, 211, 238, 0.22)',
              }}
            >
              {/* Kilau Lens Flare di Puncak Bingkai */}
              <div className="pointer-events-none absolute -top-1.5 left-1/2 -translate-x-1/2 w-56 h-3 rounded-full bg-cyan-200 blur-md opacity-90" />
              <div className="pointer-events-none absolute -top-[2px] left-1/2 -translate-x-1/2 w-72 h-[3px] bg-gradient-to-r from-transparent via-white to-transparent" />

              {/* VISUAL 3D KIRI: Keranjang Belanja Biru Berisi Bahan Pokok */}
              <div className="hidden md:flex flex-col items-center justify-center absolute -left-24 bottom-2 w-44 h-44 pointer-events-none drop-shadow-[0_18px_24px_rgba(0,0,0,0.85)]">
                <svg viewBox="0 0 200 180" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="basketBlue" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#0284c7" />
                      <stop offset="100%" stopColor="#1e3a8a" />
                    </linearGradient>
                    <linearGradient id="breadGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>
                    <linearGradient id="milkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#cbd5e1" />
                    </linearGradient>
                  </defs>
                  {/* Roti Baguette */}
                  <ellipse cx="62" cy="68" rx="16" ry="36" transform="rotate(-24 62 68)" fill="url(#breadGrad)" stroke="#fde68a" strokeWidth="1.5" />
                  {/* Sayuran Hijau */}
                  <circle cx="95" cy="64" r="22" fill="#22c55e" />
                  <circle cx="84" cy="58" r="14" fill="#4ade80" />
                  <circle cx="106" cy="60" r="15" fill="#16a34a" />
                  {/* Botol Susu */}
                  <rect x="116" y="42" width="26" height="52" rx="8" fill="url(#milkGrad)" />
                  <rect x="121" y="34" width="16" height="10" rx="3" fill="#2563eb" />
                  {/* Tomat Merah */}
                  <circle cx="96" cy="84" r="15" fill="#ef4444" />
                  <circle cx="91" cy="79" r="4" fill="#fca5a5" opacity="0.7" />
                  {/* Badan Keranjang Belanja 3D */}
                  <polygon points="32,84 168,84 152,148 48,148" fill="url(#basketBlue)" stroke="#7dd3fc" strokeWidth="2.5" strokeLinejoin="round" />
                  <rect x="26" y="78" width="148" height="10" rx="5" fill="#0ea5e9" stroke="#bae6fd" strokeWidth="1.5" />
                  {/* Kisi-kisi Keranjang */}
                  <line x1="60" y1="96" x2="66" y2="138" stroke="#0c4a6e" strokeWidth="5" strokeLinecap="round" />
                  <line x1="82" y1="96" x2="85" y2="138" stroke="#0c4a6e" strokeWidth="5" strokeLinecap="round" />
                  <line x1="104" y1="96" x2="104" y2="138" stroke="#0c4a6e" strokeWidth="5" strokeLinecap="round" />
                  <line x1="126" y1="96" x2="123" y2="138" stroke="#0c4a6e" strokeWidth="5" strokeLinecap="round" />
                  <line x1="146" y1="96" x2="140" y2="138" stroke="#0c4a6e" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </div>

              {/* VISUAL 3D KANAN: Troli Belanja Krom Perak Berkilau */}
              <div className="hidden md:flex flex-col items-center justify-center absolute -right-24 bottom-2 w-44 h-44 pointer-events-none drop-shadow-[0_18px_24px_rgba(0,0,0,0.85)]">
                <svg viewBox="0 0 200 180" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="chromeMetal" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="45%" stopColor="#bae6fd" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                  </defs>
                  {/* Gagang Dorong Troli */}
                  <path d="M148 42 L172 34 L160 72" fill="none" stroke="url(#chromeMetal)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="166" y="30" width="16" height="8" rx="4" fill="#0284c7" />
                  {/* Keranjang Troli */}
                  <polygon points="36,64 156,56 142,114 52,114" fill="rgba(56,189,248,0.14)" stroke="url(#chromeMetal)" strokeWidth="4.5" strokeLinejoin="round" />
                  <line x1="42" y1="82" x2="151" y2="76" stroke="url(#chromeMetal)" strokeWidth="2.5" />
                  <line x1="47" y1="98" x2="146" y2="94" stroke="url(#chromeMetal)" strokeWidth="2.5" />
                  <line x1="68" y1="62" x2="74" y2="114" stroke="url(#chromeMetal)" strokeWidth="2.5" />
                  <line x1="98" y1="60" x2="100" y2="114" stroke="url(#chromeMetal)" strokeWidth="2.5" />
                  <line x1="128" y1="58" x2="124" y2="114" stroke="url(#chromeMetal)" strokeWidth="2.5" />
                  {/* Rangka Bawah & Roda */}
                  <path d="M56 114 L48 134 L144 134" fill="none" stroke="url(#chromeMetal)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="62" cy="146" r="10" fill="#0f172a" stroke="#7dd3fc" strokeWidth="3.5" />
                  <circle cx="132" cy="146" r="10" fill="#0f172a" stroke="#7dd3fc" strokeWidth="3.5" />
                </svg>
              </div>

              {/* JUDUL UTAMA 3D BERSIH: KHANSA SWALAYAN */}
              <div className="space-y-1 sm:space-y-2">
                <h1
                  className="font-['Plus_Jakarta_Sans'] font-black text-5xl sm:text-7xl md:text-8xl tracking-tight uppercase leading-none bg-gradient-to-b from-white via-slate-100 to-sky-300 bg-clip-text text-transparent"
                  style={{
                    filter:
                      'drop-shadow(0 3px 0 #475569) drop-shadow(0 6px 0 #1e293b) drop-shadow(0 14px 22px rgba(0,0,0,0.85))',
                  }}
                >
                  {primaryStoreTitle}
                </h1>

                <div
                  className="font-['Plus_Jakarta_Sans'] font-black text-4xl sm:text-6xl md:text-7xl tracking-tight uppercase leading-none bg-gradient-to-b from-lime-200 via-emerald-400 to-emerald-600 bg-clip-text text-transparent"
                  style={{
                    filter:
                      'drop-shadow(0 3px 0 #065f46) drop-shadow(0 6px 0 #022c22) drop-shadow(0 14px 22px rgba(0,0,0,0.85))',
                  }}
                >
                  {secondaryStoreTitle}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. BAWAH: Panah Ganda & Pil Tombol Masuk Interaktif */}
        <div className="relative z-20 flex flex-col items-center gap-1.5 pb-1">
          <div className="flex flex-col items-center -space-y-3 text-cyan-300 animate-bounce">
            <ChevronDown className="w-6 h-6 stroke-[3]" />
            <ChevronDown className="w-6 h-6 stroke-[3] text-white" />
          </div>

          <div
            className="px-7 py-2.5 rounded-full bg-gradient-to-r from-sky-900/90 via-cyan-800/90 to-sky-900/90 border-2 border-cyan-300/80 backdrop-blur-md"
            style={{
              boxShadow:
                '0 0 28px rgba(56, 189, 248, 0.65), inset 0 1px 4px rgba(255,255,255,0.4)',
            }}
          >
            <span className="font-['Plus_Jakarta_Sans'] font-semibold text-xs sm:text-sm text-white tracking-wide">
              Gerakkan kursor atau ketuk layar untuk masuk ke sistem kasir
            </span>
          </div>
        </div>
      </div>

      {/* Bioluminescent Glass Aquarium Visual Background (Light Mode Only) */}
      {theme === 'light' && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(14,116,144,0.16)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(circle_at_center,black_25%,transparent_85%)] opacity-70" />
          <div className="absolute top-[18%] left-[20%] w-[520px] h-[520px] rounded-full bg-cyan-300/22 blur-[110px] animate-[pulse_20s_infinite]" />
          <div className="absolute top-[32%] right-[18%] w-[580px] h-[580px] rounded-full bg-blue-300/18 blur-[120px] animate-[pulse_24s_infinite]" />
          <div className="absolute bottom-[20%] left-[30%] w-[500px] h-[500px] rounded-full bg-emerald-300/16 blur-[130px] animate-[pulse_28s_infinite]" />
          <div className="absolute inset-x-0 bottom-0 max-h-[46vh] overflow-hidden">
            <div className="absolute left-[12%] bottom-0 w-2.5 h-2.5 rounded-full bg-white/90 border border-cyan-300/70 shadow-[0_0_8px_rgba(34,211,238,0.55)] animate-[bounce_6s_infinite_0.5s]" />
            <div className="absolute left-[28%] bottom-0 w-1.5 h-1.5 rounded-full bg-white/90 border border-cyan-300/70 shadow-[0_0_6px_rgba(34,211,238,0.55)] animate-[bounce_8s_infinite_1.8s]" />
            <div className="absolute left-[45%] bottom-0 w-3.5 h-3.5 rounded-full bg-white/90 border border-cyan-300/70 shadow-[0_0_10px_rgba(34,211,238,0.55)] animate-[bounce_7s_infinite_1.2s]" />
            <div className="absolute left-[64%] bottom-0 w-2 h-2 rounded-full bg-white/90 border border-cyan-300/70 shadow-[0_0_7px_rgba(34,211,238,0.55)] animate-[bounce_9s_infinite_2.4s]" />
            <div className="absolute left-[82%] bottom-0 w-3 h-3 rounded-full bg-white/90 border border-cyan-300/70 shadow-[0_0_9px_rgba(34,211,238,0.55)] animate-[bounce_6.5s_infinite_0.8s]" />
          </div>
          <div className="absolute bottom-0 inset-x-0 opacity-25 pointer-events-none">
            <svg className="w-full h-12 text-cyan-500/20" viewBox="0 0 1440 120" fill="currentColor" preserveAspectRatio="none">
              <path d="M0,32L48,42.7C96,53,192,75,288,80C384,85,480,75,576,64C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" />
            </svg>
          </div>
        </div>
      )}

      {/* Ambient Radial Glow Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[780px] h-[420px] rounded-full blur-[120px] opacity-25 dark:opacity-35 transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${selectedModule.colorHex}55 0%, rgba(6,182,212,0.22) 45%, transparent 75%)`,
          }}
        />
        <div
          className="absolute -bottom-32 -left-24 w-[460px] h-[460px] rounded-full blur-[130px] opacity-20 dark:opacity-25 transition-all duration-700"
          style={{
            background: `radial-gradient(circle, #06b6d466 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute -bottom-32 -right-24 w-[460px] h-[460px] rounded-full blur-[130px] opacity-20 dark:opacity-25 transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${selectedModule.colorHex}66 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Bar Indikator Mode Demo Interaktif (?demo=1) */}
      {isDemoSandbox && (
        <div
          id="demo-sandbox-top-banner-login"
          className="relative z-20 shrink-0 w-full px-3 sm:px-5 py-1.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 text-white border-b border-indigo-400/40 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold shadow-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FlaskConical className="w-3.5 h-3.5 shrink-0 text-cyan-200" />
            <span className="truncate tracking-wide font-bold">
              MODE DEMO INTERAKTIF (Data Simulasi Terisolasi)
            </span>
          </div>
          <button
            type="button"
            onClick={() => resetDemoSandboxSession()}
            className="px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white text-[10.5px] font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 active:scale-95"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Simulasi Demo</span>
          </button>
        </div>
      )}

      {/* 1. Header Atas */}
      <header
        className={`relative z-10 h-14 px-6 flex items-center justify-between shrink-0 ${
          theme === 'light'
            ? 'bg-transparent border-b-0'
            : 'border-b border-slate-800/60 bg-slate-900/55 backdrop-blur-xl'
        }`}
      >
        <div className="flex items-center gap-3 select-none group bg-transparent border-0 shadow-none p-0">
          <img
            src="/logo-jacs-enterprise.png"
            alt="JacS Enterprise Logo"
            className="h-7 w-7 object-contain shrink-0 transition duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <span className="font-['Plus_Jakarta_Sans'] font-semibold text-sm tracking-wider block leading-tight text-slate-900 dark:text-white">
              JacS Enterprise
            </span>
            <p className="text-[10px] text-cyan-700 dark:text-cyan-400 font-['JetBrains_Mono'] font-medium leading-tight">
              {displayStoreLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pwaInstallPrompt && (
            <button
              type="button"
              onClick={triggerPwaInstall}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm animate-pulse"
              title="Install Aplikasi ke Desktop PC (PWA Standalone)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install Desktop</span>
            </button>
          )}

          <button
            type="button"
            id="btn-gateway-show-cover"
            onClick={() => {
              coverPointerStartRef.current = null;
              setIsCoverVisible(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-[#F6F8FB]/90 dark:bg-slate-900/70 backdrop-blur-md border border-slate-300/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-400/50 transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-medium font-['Plus_Jakarta_Sans']"
            title="Tampilkan Jeda Layar Toko (Welcome Cover 3D)"
          >
            <MonitorPlay className="w-3.5 h-3.5 text-cyan-500" />
            <span className="hidden sm:inline">Cover 3D</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#F6F8FB]/90 dark:bg-slate-900/70 backdrop-blur-md border border-slate-300/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-cyan-400/50 transition-all duration-300 active:scale-95 cursor-pointer"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F6F8FB]/90 dark:bg-slate-900/70 backdrop-blur-md border border-slate-300/80 dark:border-slate-800 text-xs font-['JetBrains_Mono'] shadow-sm">
            <Lock className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span className="text-rose-600 dark:text-rose-400 font-semibold">Terkunci</span>
          </div>
        </div>
      </header>

      {/* 2. Konten Utama */}
      <main
        className={`relative z-10 max-w-4xl mx-auto w-full px-4 flex-1 flex flex-col justify-center gap-3.5 ${
          isDemoSandbox ? 'overflow-y-auto py-3' : 'overflow-hidden'
        }`}
      >
        <div className="text-center">
          <h1 className="text-slate-900 dark:text-white font-['Plus_Jakarta_Sans'] font-extrabold uppercase tracking-wide text-base sm:text-lg">
            Selamat datang di RetailOS ERP
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
            {displayStoreLabel} • Pilih Divisi Operasional &amp; Masukkan Kredensial Sesi
          </p>
        </div>

        {/* Grid 6 Divisi */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full">
          {GATEWAY_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isSelected = selectedModuleId === mod.id;
            const isHovered = hoveredModuleId === mod.id;
            const isLit = isSelected || isHovered;

            return (
              <div
                key={mod.id}
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick(mod)}
                onMouseEnter={() => setHoveredModuleId(mod.id)}
                onMouseLeave={() => setHoveredModuleId((prev) => (prev === mod.id ? null : prev))}
                onFocus={() => setHoveredModuleId(mod.id)}
                onBlur={() => setHoveredModuleId((prev) => (prev === mod.id ? null : prev))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(mod);
                  }
                }}
                className={`group relative p-3 px-3.5 rounded-xl text-left transition-all duration-300 cursor-pointer overflow-hidden flex items-center justify-between min-h-[68px] border-2 backdrop-blur-md bg-white/80 dark:bg-slate-900/70 text-slate-900 dark:text-white hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.99] ring-1 ring-white/90 dark:ring-0 ${
                  isSelected
                    ? 'ring-2 ring-cyan-500/80 dark:ring-cyan-400/50 -translate-y-0.5 scale-[1.02]'
                    : ''
                }`}
                style={{
                  borderColor: isLit ? mod.colorHex : `${mod.colorHex}80`,
                  boxShadow: isSelected
                    ? `0 10px 26px -6px ${mod.colorHex}75, 0 0 22px ${mod.colorHex}65, inset 0 0 14px ${mod.colorHex}28`
                    : isHovered
                    ? `0 12px 24px -6px ${mod.colorHex}55, 0 0 16px ${mod.colorHex}45, inset 0 0 10px ${mod.colorHex}18`
                    : `0 4px 14px -4px rgba(0,0,0,0.25), 0 0 8px ${mod.colorHex}1f`,
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1 transition-all duration-300"
                  style={{
                    backgroundColor: mod.colorHex,
                    boxShadow: isLit ? `0 0 10px ${mod.colorHex}` : 'none',
                  }}
                />

                <div
                  className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                  style={{
                    opacity: isSelected ? 0.16 : isHovered ? 0.1 : 0,
                    background: `radial-gradient(circle at top left, ${mod.colorHex}, transparent 75%)`,
                  }}
                />

                <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: `${mod.colorHex}18`,
                      border: `1px solid ${mod.colorHex}45`,
                      boxShadow: isLit ? `0 0 12px ${mod.colorHex}40` : 'none',
                    }}
                  >
                    <Icon className="w-5 h-5 shrink-0 transition-transform duration-300" style={{ color: mod.colorHex }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-['Plus_Jakarta_Sans'] font-bold text-xs sm:text-sm tracking-tight leading-snug text-slate-900 dark:text-white truncate">
                      {mod.title}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[10px] sm:text-[11px] leading-snug truncate">
                      {mod.subTitle}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <span
                    className="relative z-10 text-[9px] font-['JetBrains_Mono'] font-black px-2 py-0.5 rounded-full text-white shrink-0 ml-1.5 tracking-wider transition-all duration-300"
                    style={{
                      backgroundColor: mod.colorHex,
                      boxShadow: `0 0 12px ${mod.colorHex}90`,
                    }}
                  >
                    AKTIF
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Kartu Info PIN Cepat Demo (Hanya tampil saat ?demo=1 aktif) */}
        {isDemoSandbox && (
          <div
            id="demo-quick-pins-card"
            className={`mx-auto w-full max-w-3xl rounded-xl border px-3 py-2.5 backdrop-blur-md transition-colors ${
              theme === 'light'
                ? 'bg-indigo-50/90 border-indigo-200/90 text-indigo-950'
                : 'bg-indigo-950/55 border-indigo-500/35 text-indigo-100'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                <KeyRound className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-300 shrink-0" />
                <span>PIN Cepat Divisi Demo</span>
                <span className="text-[10px] font-normal opacity-75">
                  — Klik divisi untuk mengisi otomatis Username &amp; PIN
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30">
                DEMO SANDBOX
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {DEMO_DIVISION_QUICK_PINS.map((item) => {
                const isActiveChip = selectedModuleId === item.id && pin === item.pin;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleDemoQuickPinClick(item)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      isActiveChip
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : theme === 'light'
                        ? 'bg-white/95 hover:bg-indigo-100/80 text-slate-800 border-indigo-200/80'
                        : 'bg-slate-900/80 hover:bg-indigo-500/20 text-slate-200 border-indigo-500/30'
                    }`}
                    title={`Klik untuk isi otomatis ${item.label} (PIN: ${item.pin})`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.accentHex }}
                    />
                    <span>{item.label}</span>
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                        isActiveChip
                          ? 'bg-white/20 text-white'
                          : theme === 'light'
                          ? 'bg-slate-100 text-indigo-700'
                          : 'bg-slate-800 text-cyan-300'
                      }`}
                    >
                      {item.pin}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Floating Pill Inputs & Actions */}
        <div
          className={`mx-auto w-full max-w-sm flex flex-col gap-3 mt-1 transition-transform duration-75 ${shakeTransformClass}`}
        >
          <div
            className="relative flex items-center h-11 rounded-full border-2 backdrop-blur-xl bg-[#F6F8FB]/90 dark:bg-slate-900/75 transition-all duration-300"
            style={{
              borderColor:
                focusedField === 'username'
                  ? selectedModule.colorHex
                  : theme === 'light'
                  ? 'rgba(203,213,225,0.9)'
                  : 'rgba(51,65,85,0.8)',
              boxShadow:
                focusedField === 'username'
                  ? `0 0 22px ${selectedModule.colorHex}55, 0 8px 20px -6px rgba(0,0,0,0.35)`
                  : '0 6px 18px -6px rgba(0,0,0,0.22)',
            }}
          >
            <span className="pl-4 pr-2.5 flex items-center pointer-events-none transition-colors duration-300">
              <UserIcon
                className="w-4 h-4 transition-colors duration-300"
                style={{ color: focusedField === 'username' ? selectedModule.colorHex : '#22d3ee' }}
              />
            </span>
            <input
              id="gateway_operator_id"
              name="gateway_operator_id"
              type="text"
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              value={username}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField((prev) => (prev === 'username' ? null : prev))}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeLogin()}
              placeholder="Username Operator..."
              className="flex-1 h-full !bg-transparent !border-0 focus:!shadow-none text-slate-900 dark:text-white placeholder:text-slate-400 text-xs font-bold pr-5 rounded-r-full outline-none"
            />
          </div>

          <div
            className="relative flex items-center h-11 rounded-full border-2 backdrop-blur-xl bg-[#F6F8FB]/90 dark:bg-slate-900/75 transition-all duration-300"
            style={{
              borderColor: errorMsg
                ? '#f43f5e'
                : focusedField === 'pin'
                ? selectedModule.colorHex
                : theme === 'light'
                ? 'rgba(203,213,225,0.9)'
                : 'rgba(51,65,85,0.8)',
              boxShadow: errorMsg
                ? '0 0 20px rgba(244,63,94,0.4), 0 8px 20px -6px rgba(0,0,0,0.35)'
                : focusedField === 'pin'
                ? `0 0 22px ${selectedModule.colorHex}55, 0 8px 20px -6px rgba(0,0,0,0.35)`
                : '0 6px 18px -6px rgba(0,0,0,0.22)',
            }}
          >
            <span className="pl-4 pr-2.5 flex items-center pointer-events-none transition-colors duration-300">
              <Lock
                className="w-4 h-4 transition-colors duration-300"
                style={{
                  color: errorMsg
                    ? '#f43f5e'
                    : focusedField === 'pin'
                    ? selectedModule.colorHex
                    : '#10b981',
                }}
              />
            </span>
            <input
              ref={pinInputRef}
              id="gateway_access_code"
              name="gateway_access_code"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              style={!showPin ? ({ WebkitTextSecurity: 'disc' } as React.CSSProperties) : undefined}
              value={pin}
              onFocus={() => setFocusedField('pin')}
              onBlur={() => setFocusedField((prev) => (prev === 'pin' ? null : prev))}
              onChange={(e) => {
                setPin(e.target.value);
                setErrorMsg(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && executeLogin()}
              placeholder="Masukkan PIN Divisi..."
              className="flex-1 h-full !bg-transparent !border-0 focus:!shadow-none text-slate-900 dark:text-white placeholder:text-slate-400 text-xs font-mono tracking-widest pr-2 rounded-none outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="pr-4 pl-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {errorMsg && (
            <div className="py-1.5 px-4 rounded-full bg-rose-500/15 backdrop-blur-md border border-rose-500/40 text-rose-500 dark:text-rose-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-[0_0_14px_rgba(244,63,94,0.22)] transition-all duration-200">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="button"
            id="btn-public-gateway-login"
            disabled={isVerifying}
            onClick={executeLogin}
            className="w-full h-11 rounded-full font-black text-xs bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:via-teal-400 hover:to-emerald-400 text-white hover:-translate-y-0.5 flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer active:scale-95 disabled:opacity-75 disabled:cursor-wait uppercase tracking-wider"
            style={{
              boxShadow: `0 10px 26px -6px ${selectedModule.colorHex}70, 0 0 18px rgba(6,182,212,0.35)`,
            }}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>MEMVERIFIKASI...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>MASUK</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setSuperAdminError(null);
              setShowSuperAdminModal(true);
            }}
            className="mx-auto text-[11px] text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 bg-[#F6F8FB]/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-300/80 dark:border-slate-700/70 hover:border-cyan-400/60 hover:bg-cyan-500/10 hover:shadow-[0_0_16px_rgba(6,182,212,0.25)] rounded-full py-1.5 px-5 transition-all duration-300 active:scale-95 cursor-pointer text-center font-['JetBrains_Mono'] flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SuperAdmin Access</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDemoModal(true)}
            className="mx-auto mt-2 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 bg-indigo-50/80 dark:bg-indigo-500/15 backdrop-blur-md border border-indigo-300/80 dark:border-indigo-500/40 hover:border-indigo-400 hover:bg-indigo-500/25 rounded-full py-1.5 px-5 transition-all duration-300 active:scale-95 cursor-pointer text-center font-['JetBrains_Mono'] flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Coba Simulasi Demo (Pilih Tipe Bisnis — Tanpa PIN)</span>
          </button>
        </div>

        {/* Super Admin Auth Modal */}
        {showSuperAdminModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-5 rounded-2xl w-full max-w-xs shadow-[0_0_35px_rgba(6,182,212,0.25)] space-y-3 transition-all duration-300">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Masukkan Kode Otoritas</span>
              </h3>
              <input
                type="text"
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                value={superAdminCode}
                onChange={(e) => {
                  setSuperAdminCode(e.target.value);
                  setSuperAdminError(null);
                }}
                placeholder="Kode Otoritas..."
                className={`w-full h-10 bg-slate-950/80 border text-white px-3 rounded-xl text-sm outline-none transition-all duration-200 ${
                  superAdminError
                    ? 'border-rose-500 ring-2 ring-rose-500/30'
                    : 'border-slate-700 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/25'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSuperAdminVerify();
                }}
              />
              {superAdminError && (
                <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{superAdminError}</span>
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuperAdminModal(false);
                    setSuperAdminCode('');
                    setSuperAdminError(null);
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isVerifyingSuperAdmin}
                  onClick={handleSuperAdminVerify}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all duration-300 active:scale-95 disabled:opacity-75 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isVerifyingSuperAdmin ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Proses...</span>
                    </>
                  ) : (
                    <span>Verifikasi</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Demo Mode Selection Modal */}
        {showDemoModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
            <div className="bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/50 p-6 rounded-2xl w-full max-w-md shadow-[0_0_60px_rgba(99,102,241,0.35)] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">Simulasi Demo Interaktif</h3>
                    <p className="text-[11px] text-slate-400">Pilih model industri & masuk divisi dalam 1 klik (Tanpa PIN)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDemoModal(false)}
                  className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">1. Pilih Tipe Bisnis / Model Industri:</label>
                  <select
                    value={selectedDemoBusinessType}
                    onChange={(e) => setSelectedDemoBusinessType(e.target.value)}
                    className="w-full h-11 bg-slate-950 border border-slate-700 focus:border-indigo-400 text-white text-xs px-3 rounded-xl outline-none font-semibold cursor-pointer"
                  >
                    {DEMO_BUSINESS_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">2. Pilih Divisi Tujuan (Masuk Instan Tanpa PIN):</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'pos', label: 'Kasir POS', icon: Store, color: 'from-rose-500 to-pink-500' },
                      { id: 'executive', label: 'Executive', icon: Briefcase, color: 'from-blue-500 to-cyan-500' },
                      { id: 'finance', label: 'Finance', icon: CreditCard, color: 'from-emerald-500 to-teal-500' },
                      { id: 'purchasing', label: 'Purchasing', icon: ShoppingBag, color: 'from-orange-500 to-amber-500' },
                      { id: 'warehouse', label: 'Warehouse', icon: Boxes, color: 'from-cyan-500 to-blue-500' },
                      { id: 'hr', label: 'HR / Staf', icon: Users, color: 'from-purple-500 to-indigo-500' },
                    ].map((div) => {
                      const DIcon = div.icon;
                      return (
                        <button
                          key={div.id}
                          type="button"
                          onClick={() => handleLaunchDemoDivision(div.id)}
                          className={`p-3 rounded-xl bg-gradient-to-r ${div.color} text-slate-950 font-black text-xs flex items-center gap-2.5 shadow-md hover:opacity-95 transition-all active:scale-95 cursor-pointer`}
                        >
                          <DIcon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{div.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Sesi berjalan di sandbox lokal terisolasi (<code className="text-indigo-400 font-mono">jacs_demo_sandbox_*</code>). Tidak pernah menyentuh database Supabase produksi.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-2 px-6 border-t border-slate-300/80 dark:border-slate-800/60 text-center text-[10px] text-slate-600 dark:text-slate-500 font-['Plus_Jakarta_Sans'] font-normal tracking-wider shrink-0 bg-[#F6F8FB]/80 dark:bg-slate-900/50 backdrop-blur-md">
        JacS Enterprise • RetailOS ERP Ecosystem
      </footer>
    </div>
  );
};

export default PublicGateway;