import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { User } from '../../types';
import { signSessionPayload } from '../../utils/securityUtils';

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
  } = useApp();

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

  const getDivisionDetails = (modId: string, inputUsername: string): User => {
    const roleMap: Record<string, User['role']> = {
      executive: 'EXECUTIVE',
      finance: 'FINANCE_MANAGER',
      purchasing: 'PURCHASING_OFFICER',
      pos: 'Kasir',
      warehouse: 'WAREHOUSE_HEAD',
      hr: 'HR_MANAGER',
    };

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
    const userObj = getDivisionDetails(selectedModuleId, username.trim());
    const signedToken = await signSessionPayload(userObj);

    const targetNavModule = selectedModuleId;

    setTimeout(() => {
      setCurrentUser(userObj);
      setActiveUser(userObj);
      setActiveNav(targetNavModule);

      try {
        localStorage.setItem('jacs_active_user', signedToken);
        const parsed = JSON.parse(atob(signedToken));
        if (parsed?.sig) {
          localStorage.setItem('jacs_session_sig', parsed.sig);
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
          localStorage.setItem('jacs_active_user', signedToken);
          const parsed = JSON.parse(atob(signedToken));
          if (parsed?.sig) {
            localStorage.setItem('jacs_session_sig', parsed.sig);
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

  const shakeTransformClass =
    shakePhase === 'left'
      ? '-translate-x-1.5'
      : shakePhase === 'right'
      ? 'translate-x-1.5'
      : 'translate-x-0';

  return (
    <div className={`relative h-screen w-screen overflow-hidden text-slate-900 dark:text-white transition-colors duration-300 flex flex-col justify-between font-sans select-none ${
      theme === 'light' ? 'bg-gradient-to-br from-[#F8FBFF] via-[#EDF6FF] to-[#F0FDFA]' : 'bg-slate-100 dark:bg-[#070d1e]'
    }`}>
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

      {/* 1. Header Atas */}
      <header className="relative z-10 h-14 px-6 border-b border-slate-300/80 dark:border-slate-800/60 flex items-center justify-between shrink-0 bg-[#F6F8FB]/90 dark:bg-slate-900/55 backdrop-blur-xl">
        <div className="flex items-center gap-3 select-none group">
          <img
            src="/logo-jacs-enterprise.png"
            alt="JacS Enterprise Logo"
            className="h-7 w-7 object-contain rounded shrink-0 transition duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <span className="font-['Plus_Jakarta_Sans'] font-normal text-sm tracking-wider block leading-tight text-slate-900 dark:text-white">
              JacS Enterprise
            </span>
            <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-['JetBrains_Mono'] leading-tight">
              RetailOS ERP Architect
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Tanya AI */}
          <button
            type="button"
            id="btn-gateway-ask-ai"
            onClick={openAiAssistant}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-emerald-500/10 hover:from-cyan-500/20 hover:via-teal-500/20 hover:to-emerald-500/20 border border-cyan-500/35 text-cyan-600 dark:text-cyan-400 hover:border-cyan-400 transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-medium font-['Plus_Jakarta_Sans'] shadow-sm"
            title="Tanya JacS AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
            <span>Tanya AI</span>
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

      {/* 2. Konten Utama: Zero-Scroll Viewport */}
      <main className="relative z-10 max-w-4xl mx-auto w-full px-4 flex-1 flex flex-col justify-center gap-4 overflow-hidden">
        <div className="text-center">
          <h1 className="text-slate-900 dark:text-white font-['Plus_Jakarta_Sans'] font-extrabold uppercase tracking-wide text-base sm:text-lg">
            Selamat datang di RetailOS ERP
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
            Pilih Divisi Operasional & Masukkan Kredensial Sesi
          </p>
        </div>

        {/* Grid 6 Divisi (3x2 Presisi) */}
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
                {/* Top Neon Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 transition-all duration-300"
                  style={{
                    backgroundColor: mod.colorHex,
                    boxShadow: isLit ? `0 0 10px ${mod.colorHex}` : 'none',
                  }}
                />

                {/* Subtle Radial Tint on Card */}
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

        {/* Floating Pill Inputs & Actions (Tanpa Kotak Pembungkus) */}
        <div
          className={`mx-auto w-full max-w-sm flex flex-col gap-3 mt-1 transition-transform duration-75 ${shakeTransformClass}`}
        >
          {/* Floating Pill: Username Operator */}
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

          {/* Floating Pill: PIN Divisi */}
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

          {/* Floating Pill: Tombol MASUK */}
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

          {/* Subtle Floating Pill: SuperAdmin Access */}
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
        </div>

        {/* Super Admin Auth Modal (Non-Password Input) */}
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
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-2 px-6 border-t border-slate-300/80 dark:border-slate-800/60 text-center text-[10px] text-slate-600 dark:text-slate-500 font-['Plus_Jakarta_Sans'] font-normal tracking-wider shrink-0 bg-[#F6F8FB]/80 dark:bg-slate-900/50 backdrop-blur-md">
        JacS Enterprise • RetailOS ERP Ecosystem
      </footer>
    </div>
  );
};

export default PublicGateway;