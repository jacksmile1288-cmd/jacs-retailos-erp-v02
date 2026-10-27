import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Lock,
  User,
  UserCheck,
  CheckCircle2,
  Clock,
  Sun,
  Moon,
  BookOpen,
  Globe,
  ChevronDown,
  Check,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  LogOut,
  Sparkles,
  Info,
  Users,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Settings,
  DoorOpen,
  Camera,
  Upload,
  Trash2,
  X,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { SopModal } from './common/SopModal';
import { AboutSystemModal } from './common/AboutSystemModal';
import { ProfileSettingsModal } from './common/ProfileSettingsModal';
import { TelemetryBar } from './TelemetryBar';

// Icon SVG Siluet Avatar Kosong / Blank (tanpa foto, tanpa inisial sembarangan)
const BlankAvatarSilhouette: React.FC<{
  className?: string;
  iconSize?: string;
  style?: React.CSSProperties;
}> = ({
  className = 'w-7 h-7 rounded-full',
  iconSize = 'w-4 h-4',
  style,
}) => (
  <div
    style={style}
    className={`flex items-center justify-center border shrink-0 bg-slate-200 dark:bg-slate-700/80 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 ${className}`}
    aria-label="Siluet avatar kosong"
  >
    <User className={iconSize} />
  </div>
);

interface TopbarProps {
  onOpenMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu }) => {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    activeUser,
    currentUser: contextCurrentUser,
    contextualProfile,
    openPinAuth,
    toastMessage,
    isOnline,
    offlineQueue,
    syncOfflineQueue,
    syncOfflineTransactions,
    showToast,
    activeNav,
    setActiveNav,
    isSuperAdminAuthenticated,
    setIsSuperAdminAuthenticated,
    exitSuperAdminSession,
    logout,
    employees,
    setActiveUser,
    setCurrentUser,
    lockModule,
    getModulePin,
    updateModulePin,
    isSidebarCollapsed,
    toggleSidebar,
  } = useApp();

  const currentUser = contextCurrentUser !== undefined ? contextCurrentUser : activeUser;

  const employeeMatch = currentUser
    ? employees.find(
        (e) =>
          e.id === currentUser.id ||
          e.id === currentUser.user_id ||
          e.name.toLowerCase().trim() === currentUser.name.toLowerCase().trim()
      )
    : null;

  const currentDivision =
    currentUser?.division ||
    employeeMatch?.division ||
    employeeMatch?.department ||
    (currentUser?.role === 'Manager'
      ? 'Executive Manager'
      : currentUser?.role === 'HR Staff'
      ? 'HR'
      : currentUser?.role === 'Finance Staff'
      ? 'Finance'
      : currentUser?.role === 'Purchasing Staff'
      ? 'Purchasing'
      : currentUser?.role === 'Inventory Staff'
      ? 'Warehouse'
      : currentUser?.role === 'Super Admin'
      ? 'Super Admin'
      : 'POS & Kasir');

  const currentEmpId = currentUser?.id || employeeMatch?.nip || currentUser?.user_id || '-';

  // Key unik untuk profil/karyawan/modul yang sedang aktif
  const currentProfileKey = contextualProfile.isGeneral
    ? `general_${contextualProfile.moduleTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    : `profile_${(contextualProfile.employeeId || contextualProfile.userName).toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  // Custom Profile Photos map in state & localStorage
  const [customPhotos, setCustomPhotos] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('jacs_custom_profile_photos');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Foto aktif khusus untuk profil modul/karyawan yang sedang dibuka (null jika belum di-upload)
  const activePhoto =
    customPhotos[currentProfileKey] ||
    (typeof window !== 'undefined' ? localStorage.getItem(`jacs_custom_photo_${currentProfileKey}`) : null) ||
    null;

  // Handler Upload / Ganti Foto dengan validasi maks 1MB & resize otomatis ke 1:1 base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi ukuran maks 1MB (1,048,576 bytes)
    if (file.size > 1024 * 1024) {
      showToast('⚠️ Ukuran foto melebihi 1MB! Silakan pilih file maksimal 1MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      if (!rawBase64) return;

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const targetDim = 256;
          canvas.width = targetDim;
          canvas.height = targetDim;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const minSide = Math.min(img.width, img.height);
            const sx = (img.width - minSide) / 2;
            const sy = (img.height - minSide) / 2;
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetDim, targetDim);
            const resizedBase64 = canvas.toDataURL('image/jpeg', 0.9);
            savePhoto(currentProfileKey, resizedBase64);
          } else {
            savePhoto(currentProfileKey, rawBase64);
          }
        } catch {
          savePhoto(currentProfileKey, rawBase64);
        }
      };
      img.onerror = () => {
        savePhoto(currentProfileKey, rawBase64);
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const savePhoto = (key: string, base64: string) => {
    setCustomPhotos((prev) => {
      const updated = { ...prev, [key]: base64 };
      try {
        localStorage.setItem('jacs_custom_profile_photos', JSON.stringify(updated));
        localStorage.setItem(`jacs_custom_photo_${key}`, base64);
      } catch (err) {
        console.error('Failed to save profile photo to localStorage', err);
      }
      return updated;
    });
    showToast('📸 Foto profil berhasil diperbarui!');
  };

  // Handler Hapus Foto (kembali ke siluet avatar standar)
  const handleDeletePhoto = () => {
    setCustomPhotos((prev) => {
      const updated = { ...prev };
      delete updated[currentProfileKey];
      try {
        localStorage.setItem('jacs_custom_profile_photos', JSON.stringify(updated));
        localStorage.removeItem(`jacs_custom_photo_${currentProfileKey}`);
      } catch (err) {
        console.error('Failed to remove photo from localStorage', err);
      }
      return updated;
    });
    showToast('🗑️ Foto profil dihapus. Kembali ke siluet avatar standar.');
  };

  // Handler Kunci Modul Ini (mengunci modul saat ini tanpa melempar jauh ke HOME/Dashboard)
  const handleLockCurrentModule = () => {
    setIsDetailModalOpen(false);
    lockModule(activeNav);
    if (activeNav === 'admin') {
      setIsSuperAdminAuthenticated(false);
    }
    showToast(`🔒 Modul ${contextualProfile.moduleTitle} telah dikunci.`);
  };

  // Modul yang dilindungi password (semua modul kecuali home, dashboard, pos)
  const isPasswordProtectedModule =
    activeNav !== 'home' &&
    activeNav !== 'dashboard' &&
    activeNav !== 'pos';

  // State untuk Ubah PIN Modul Mandiri di Modal Profil
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);

  const handleUpdateModulePin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinMessage(null);
    if (!oldPinInput.trim()) {
      setPinMessage({ text: 'Masukkan PIN lama modul ini!', type: 'error' });
      return;
    }
    if (!newPinInput.trim() || newPinInput.trim().length !== 4 || !/^\d{4}$/.test(newPinInput.trim())) {
      setPinMessage({ text: 'PIN baru harus tepat 4 digit angka (contoh: 5678)!', type: 'error' });
      return;
    }

    const res = updateModulePin(activeNav, oldPinInput.trim(), newPinInput.trim());
    if (res.success) {
      setPinMessage({
        text: `PIN modul berhasil diubah ke ${newPinInput.trim()}!`,
        type: 'success',
      });
      setOldPinInput('');
      setNewPinInput('');
      setTimeout(() => {
        setPinMessage(null);
      }, 4000);
    } else {
      setPinMessage({
        text: res.error || 'Gagal mengubah PIN modul!',
        type: 'error',
      });
    }
  };

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isSopModalOpen, setIsSopModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState<boolean>(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState<boolean>(false);
  const [isLockConfirmOpen, setIsLockConfirmOpen] = useState<boolean>(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(target)
      ) {
        setIsLangDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDetailModalOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isLight = theme === 'light';

  return (
    <header
      id="app-topbar"
      className={`h-14 w-full flex items-center justify-between px-3 sm:px-4 lg:px-6 sticky top-0 z-40 select-none backdrop-blur-md transition-colors duration-200 shadow-sm shrink-0 ${
        isLight
          ? 'bg-white/95 border-b border-slate-200 text-slate-800'
          : 'bg-slate-900 border-b border-slate-800 dark:border-slate-800 dark:bg-slate-900 text-[#e6edf3]'
      }`}
    >
      {/* 1. Sisi Kiri: Mobile trigger, Jam Operasional Realtime, Status System Online, & Tombol Info Center & SOP */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {onOpenMobileMenu && (
          <button
            id="btn-topbar-mobile-menu"
            type="button"
            onClick={onOpenMobileMenu}
            className={`lg:hidden p-2 -ml-1 rounded-xl transition cursor-pointer flex items-center justify-center border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                : 'bg-slate-800/70 hover:bg-slate-700 text-gray-300 hover:text-cyan-400 border-slate-700'
            }`}
            title="Buka Navigasi"
            aria-label="Buka Navigasi"
          >
            <Menu className="w-5 h-5 shrink-0" />
          </button>
        )}

        {/* Global Sidebar Toggle Button (Desktop & Tablet) */}
        <button
          type="button"
          id="btn-global-sidebar-toggle"
          onClick={toggleSidebar}
          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs ${
            isSidebarCollapsed
              ? isLight
                ? 'bg-cyan-50 text-cyan-800 border-cyan-300 hover:bg-cyan-100 shadow-sm'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              : isLight
              ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              : 'bg-slate-800/80 text-gray-300 border-slate-700 hover:text-white hover:bg-slate-700'
          }`}
          title={isSidebarCollapsed ? 'Buka Menu Sidebar (Ctrl + B)' : 'Tutup Sidebar / Layar Penuh (Ctrl + B)'}
          aria-label="Toggle Sidebar"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-cyan-500 shrink-0" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-400 hover:text-cyan-400 shrink-0" />
          )}
          <span className="font-mono text-[11px] whitespace-nowrap">
            {isSidebarCollapsed ? 'Buka Menu' : 'Layar Penuh'}
          </span>
          <kbd className="hidden xl:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono bg-black/10 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            Ctrl+B
          </kbd>
        </button>

        {/* Jam Digital Realtime */}
        <div
          id="topbar-digital-clock"
          className={`font-mono text-xs px-2.5 sm:px-3 py-1 rounded-md border flex items-center gap-1.5 whitespace-nowrap shadow-xs ${
            isLight
              ? 'text-cyan-700 bg-cyan-50/80 border-cyan-200'
              : 'text-cyan-400 bg-slate-800/60 border-cyan-500/30'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />
          <span className="whitespace-nowrap font-medium">{currentTime || '00:00:00'}</span>
        </div>

        {/* Indikator Status Koneksi & Cache (Online / Offline Mode via TelemetryBar) */}
        <TelemetryBar isLight={isLight} />

        {/* Indikator Status Mode Super Admin (Elevated Privileges) */}
        {activeNav === 'admin' && (
          <div
            id="topbar-super-admin-status-badge"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold border font-mono select-none transition shadow-sm shrink-0 ${
              isLight
                ? 'bg-pink-100 border-pink-300 text-pink-700'
                : 'bg-pink-500/20 border-pink-500/50 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.35)] animate-pulse'
            }`}
            title="Mode Aktif: Super Admin (Elevated Privileges)"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400 shrink-0" />
            <span className="hidden md:inline font-bold">Mode Aktif: Super Admin (Elevated Privileges)</span>
            <span className="md:hidden font-bold">Super Admin (Elevated)</span>
          </div>
        )}
      </div>

      {/* 2. Sisi Kanan: Action Controls & User Profile (Toggle Bahasa, Toggle Dark Mode, Profil) */}
      <div className="flex items-center gap-2 shrink-0 flex-shrink-0">

        {/* Dropdown Pemilih Bahasa (Language Switcher) */}
        <div className="relative shrink-0" ref={langDropdownRef}>
          <button
            id="btn-language-switcher"
            type="button"
            onClick={() => {
              const nextLang = language === 'id' ? 'en' : 'id';
              setLanguage(nextLang);
              showToast(nextLang === 'id' ? 'Bahasa diubah ke Indonesia baku' : 'Language switched to English');
            }}
            style={{ color: '#0f172a', borderColor: '#94a3b8', backgroundColor: '#ffffff' }}
            className="dark:!text-white dark:!bg-slate-800 border text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer hover:opacity-90 transition font-mono"
            title="Klik untuk beralih bahasa (ID / EN)"
          >
            <span>{language === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}</span>
          </button>

          {/* Dropdown Menu */}
          {isLangDropdownOpen && (
            <div
              id="language-dropdown-menu"
              className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-xl py-1.5 z-[60] backdrop-blur-md animate-fadeIn ${
                isLight
                  ? 'bg-white/95 border-slate-200 text-slate-800'
                  : 'bg-slate-900/95 border-slate-700 text-gray-200'
              }`}
            >
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8b949e] whitespace-nowrap">
                {language === 'en' ? 'Select Language' : 'Pilih Bahasa'}
              </div>

              {/* ID Option */}
              <button
                type="button"
                id="btn-lang-id"
                onClick={() => {
                  setLanguage('id');
                  setIsLangDropdownOpen(false);
                }}
                className={`w-full px-3 py-2 flex items-center justify-between text-xs transition cursor-pointer whitespace-nowrap ${
                  language === 'id'
                    ? isLight
                      ? 'bg-cyan-50 text-cyan-700 font-bold'
                      : 'bg-cyan-500/15 text-cyan-400 font-bold'
                    : isLight
                    ? 'hover:bg-slate-100 text-slate-700'
                    : 'hover:bg-slate-800 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-sm">🇮🇩</span>
                  <span className="whitespace-nowrap">ID - Bahasa Indonesia</span>
                </div>
                {language === 'id' && <Check className="w-3.5 h-3.5 text-cyan-500 shrink-0" />}
              </button>

              {/* EN Option */}
              <button
                type="button"
                id="btn-lang-en"
                onClick={() => {
                  setLanguage('en');
                  setIsLangDropdownOpen(false);
                }}
                className={`w-full px-3 py-2 flex items-center justify-between text-xs transition cursor-pointer whitespace-nowrap ${
                  language === 'en'
                    ? isLight
                      ? 'bg-cyan-50 text-cyan-700 font-bold'
                      : 'bg-cyan-500/15 text-cyan-400 font-bold'
                    : isLight
                    ? 'hover:bg-slate-100 text-slate-700'
                    : 'hover:bg-slate-800 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-sm">🇬🇧</span>
                  <span className="whitespace-nowrap">EN - English</span>
                </div>
                {language === 'en' && <Check className="w-3.5 h-3.5 text-cyan-500 shrink-0" />}
              </button>
            </div>
          )}
        </div>

        {/* Tombol Toggle Dark / Light Mode */}
        <div className="flex items-center shrink-0">
          <button
            id="btn-theme-toggle"
            type="button"
            onClick={toggleTheme}
            className={`group relative flex items-center p-1 rounded-full border transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 ${
              isLight
                ? 'bg-amber-50 border-amber-300 hover:border-amber-400 text-amber-900 shadow-xs'
                : 'bg-slate-800/80 border-slate-700 hover:border-indigo-500/50 text-[#e6edf3]'
            }`}
            title={`Mode saat ini: ${isLight ? 'Terang (Light Mode)' : 'Gelap (Dark Mode)'} - Klik untuk beralih`}
          >
            <div className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap">
              {/* Sun Icon */}
              <div
                className={`p-1 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isLight
                    ? 'bg-amber-400 text-white shadow-[0_0_10px_rgba(245,158,11,0.6)] scale-110'
                    : 'text-gray-400 hover:text-amber-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </div>

              {/* Moon Icon */}
              <div
                className={`p-1 rounded-full transition-all duration-300 flex items-center justify-center ${
                  !isLight
                    ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.6)] scale-110'
                    : 'text-gray-400 hover:text-indigo-600'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </div>
            </div>
          </button>
        </div>

        {/* 1. KONDISI DALAM MODE SUPER ADMIN (activeNav === 'admin'): Tombol Keluar ke Menu Utama (HOME) & Kunci Sesi */}
        {activeNav === 'admin' && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Tombol Eksplisit: Keluar ke Menu Utama (HOME) */}
            <button
              type="button"
              id="btn-topbar-exit-super-admin"
              onClick={() => setIsExitConfirmOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer active:scale-95 shrink-0 shadow-xs ${
                isLight
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-800 hover:bg-cyan-100 hover:border-cyan-400'
                  : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              }`}
              title="Keluar ke Menu Utama (HOME) & Reset Status Super Admin ke Staff Operasional"
            >
              <DoorOpen className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />
              <span className="hidden lg:inline">Keluar ke Menu Utama</span>
              <span className="lg:hidden">Menu Utama</span>
            </button>

            {/* Opsi Terpisah: Logout / Kunci Sesi */}
            <button
              type="button"
              id="btn-topbar-lock-super-admin"
              onClick={() => setIsLockConfirmOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 transition cursor-pointer active:scale-95 shrink-0 shadow-xs"
              title="Logout / Kunci Sesi Super Admin & Kembali ke HOME"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="hidden sm:inline">Logout / Kunci Sesi</span>
              <span className="sm:hidden">Kunci</span>
            </button>
          </div>
        )}

        {/* Contextual Profile Topbar (Otomatis menyesuaikan menu navigasi activeNav & Kasir) */}
        <div className="relative shrink-0">
          <div
            id="topbar-user-profile"
            onClick={() => setIsDetailModalOpen(true)}
            className={`flex items-center gap-2 rounded-full p-1 pl-2.5 pr-2 border whitespace-nowrap shrink-0 cursor-pointer transition select-none ${
              isLight
                ? 'bg-slate-100 border-slate-200 hover:bg-slate-200/80 hover:border-cyan-400/50'
                : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700/80 hover:border-cyan-500/50'
            }`}
            title={
              contextualProfile.isGeneral
                ? `${contextualProfile.moduleTitle} • Mode Umum (Klik untuk Detail Profil)`
                : `${contextualProfile.userName} • ${contextualProfile.position} (Klik untuk Detail Profil)`
            }
          >
            {/* Label Utama (Nama Modul / Nama Karyawan) & Sub-label (Mode Umum / Jabatan Divisi) */}
            <div className="flex flex-col text-right leading-none whitespace-nowrap">
              <span
                className={`text-xs font-bold leading-tight flex items-center gap-1 justify-end whitespace-nowrap ${
                  isLight ? 'text-slate-900' : 'text-[#e6edf3]'
                }`}
              >
                {!contextualProfile.isGeneral && (
                  <UserCheck className="w-3 h-3 text-[#10B981] shrink-0" />
                )}
                <span>{contextualProfile.userName}</span>
              </span>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                    contextualProfile.isGeneral
                      ? 'text-cyan-500 bg-cyan-500/10 border border-cyan-500/20'
                      : contextualProfile.position === 'Super Admin'
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30 font-mono'
                      : contextualProfile.position === 'Executive Manager'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : contextualProfile.position === 'HR Staff'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : contextualProfile.position === 'Finance Staff'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : contextualProfile.position === 'Purchasing Staff'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : contextualProfile.position === 'Inventory Staff'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  }`}
                >
                  {contextualProfile.subLabel}
                </span>
              </div>
            </div>

            {/* Avatar: Siluet SVG standar jika belum di-upload; atau render foto custom jika ada */}
            {activePhoto ? (
              <img
                src={activePhoto}
                alt={contextualProfile.userName}
                className={`w-7 h-7 rounded-full object-cover border shrink-0 ${
                  isLight ? 'border-slate-300' : 'border-slate-700'
                }`}
              />
            ) : (
              <BlankAvatarSilhouette className="w-7 h-7 rounded-full" iconSize="w-3.5 h-3.5" />
            )}

            {/* Dropdown Chevron Toggle (Membuka Modal Detail Profil Aktif) */}
            <div
              className={`p-1 rounded-full transition shrink-0 ${
                isLight ? 'text-slate-500' : 'text-gray-400'
              }`}
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDetailModalOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Popover / Modal Ringkas: Detail Profil Aktif via React Portal */}
      {isDetailModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          id="modal-detail-profil-aktif"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDetailModalOpen(false);
          }}
        >
          <div
            className={`relative w-full max-w-sm rounded-3xl p-6 border shadow-2xl transition-all max-h-[90vh] overflow-y-auto ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-[#161b22] border-slate-700 text-[#e6edf3]'
            }`}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-700/20 dark:border-gray-700/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <User className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">Detail Profil Aktif</h3>
                  <p className="text-[10px] text-gray-400">
                    {contextualProfile.isGeneral ? 'Mode Akses Umum' : 'Sesi Divisi / Kasir Terotorisasi'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className={`p-1.5 rounded-xl border transition cursor-pointer ${
                  isLight
                    ? 'hover:bg-slate-100 border-slate-200 text-slate-500'
                    : 'hover:bg-slate-800 border-slate-700 text-gray-400 hover:text-white'
                }`}
                title="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Avatar Besar (Ukuran standar 1:1, 128x128px, object-cover) */}
            <div className="pt-5 pb-3 flex flex-col items-center">
              <div className="relative group">
                <div
                  className={`w-32 h-32 rounded-full overflow-hidden border-2 shadow-xl shrink-0 flex items-center justify-center ${
                    activePhoto
                      ? 'border-cyan-500/70 ring-4 ring-cyan-500/20'
                      : isLight
                      ? 'border-slate-300 bg-slate-100 ring-4 ring-slate-200/50'
                      : 'border-slate-700 bg-slate-800 ring-4 ring-slate-800/50'
                  }`}
                  style={{ width: '128px', height: '128px' }}
                >
                  {activePhoto ? (
                    <img
                      src={activePhoto}
                      alt={contextualProfile.userName}
                      className="w-full h-full object-cover"
                      style={{ width: '128px', height: '128px' }}
                    />
                  ) : (
                    <BlankAvatarSilhouette
                      className="w-full h-full rounded-full"
                      iconSize="w-14 h-14"
                      style={{ width: '128px', height: '128px' }}
                    />
                  )}
                </div>

                {/* Floating camera trigger shortcut */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg border border-cyan-400/40 transition cursor-pointer active:scale-95"
                  title="Upload / Ganti Foto"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Nama Profil/Modul aktif & Jabatan */}
              <div className="mt-3.5 text-center w-full px-2">
                <div className="flex items-center justify-center gap-1.5">
                  {!contextualProfile.isGeneral && (
                    <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <h4 className="font-extrabold text-base leading-snug">
                    {contextualProfile.userName}
                  </h4>
                </div>

                <p className="text-xs font-bold text-cyan-500 dark:text-cyan-400 mt-0.5">
                  {contextualProfile.position}
                </p>

                <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      contextualProfile.isGeneral
                        ? 'text-cyan-500 bg-cyan-500/10 border border-cyan-500/20'
                        : contextualProfile.position === 'Super Admin'
                        ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30 font-mono'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {contextualProfile.subLabel}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-500/15 border border-slate-500/30 text-gray-400">
                    ID: {contextualProfile.employeeId || 'UMUM'}
                  </span>
                </div>

                {contextualProfile.email && (
                  <p className="text-[11px] font-mono text-gray-400 mt-1 truncate">
                    {contextualProfile.email}
                  </p>
                )}
              </div>
            </div>

            {/* Hidden Input File untuk Upload Foto */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {/* 2 & 3. Tombol Aksi: Upload/Ganti Foto, Hapus Foto, Keluar/Kunci Modul */}
            <div className="space-y-2 pt-3 border-t border-gray-700/20 dark:border-gray-700/40">
              <div className="flex items-center gap-2">
                {/* 2. Tombol Upload / Ganti Foto */}
                <button
                  type="button"
                  id="btn-upload-profile-photo"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>{activePhoto ? 'Ganti Foto' : 'Upload Foto'}</span>
                </button>

                {/* 3a. Tombol Hapus Foto */}
                <button
                  type="button"
                  id="btn-delete-profile-photo"
                  onClick={handleDeletePhoto}
                  disabled={!activePhoto}
                  className={`px-3 py-2.5 rounded-xl font-semibold text-xs border flex items-center justify-center gap-1.5 transition ${
                    activePhoto
                      ? 'border-rose-500/40 text-rose-500 hover:bg-rose-500/10 cursor-pointer active:scale-95'
                      : 'border-gray-700/30 text-gray-500 cursor-not-allowed opacity-50'
                  }`}
                  title={activePhoto ? 'Hapus Foto (Kembali ke siluet avatar standar)' : 'Belum ada foto khusus'}
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span>Hapus</span>
                </button>
              </div>

              <p className="text-[10px] text-gray-400 text-center">
                Maksimal 1MB • Otomatis resize 1:1 ke base64 (tersimpan di browser)
              </p>

              {/* Bagian Ringkas: Ubah PIN Modul Ini (Khusus modul ber-password) */}
              {isPasswordProtectedModule && (
                <div
                  id="section-change-module-pin"
                  className={`p-3.5 rounded-2xl border ${
                    isLight
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-[#0d1117]/90 border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <KeyRound className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-extrabold text-xs">Ubah PIN Modul Ini</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                      PIN: {getModulePin(activeNav)}
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-400 mb-2.5 leading-relaxed">
                    Ubah password akses untuk divisi <span className="font-semibold text-cyan-400">{contextualProfile.moduleTitle || activeNav}</span> secara mandiri (default: 1234).
                  </p>

                  <form onSubmit={handleUpdateModulePin} className="space-y-2">
                    {/* Input PIN Lama */}
                    <div className="relative">
                      <input
                        type={showOldPin ? 'text' : 'password'}
                        value={oldPinInput}
                        onChange={(e) => setOldPinInput(e.target.value)}
                        placeholder="PIN Lama (cth: 1234)"
                        maxLength={8}
                        className={`w-full text-xs font-mono py-2 pl-3 pr-8 rounded-xl border outline-none transition ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-800 focus:border-cyan-500'
                            : 'bg-[#161b22] border-slate-700 text-white focus:border-cyan-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPin(!showOldPin)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-0.5 cursor-pointer"
                        title={showOldPin ? 'Sembunyikan' : 'Lihat'}
                      >
                        {showOldPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Input PIN Baru */}
                    <div className="relative">
                      <input
                        type={showNewPin ? 'text' : 'password'}
                        value={newPinInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setNewPinInput(val);
                        }}
                        placeholder="PIN Baru 4 Digit (cth: 5678)"
                        maxLength={4}
                        className={`w-full text-xs font-mono py-2 pl-3 pr-8 rounded-xl border outline-none transition ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-800 focus:border-cyan-500'
                            : 'bg-[#161b22] border-slate-700 text-white focus:border-cyan-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPin(!showNewPin)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-0.5 cursor-pointer"
                        title={showNewPin ? 'Sembunyikan' : 'Lihat'}
                      >
                        {showNewPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Feedback Pesan */}
                    {pinMessage && (
                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-medium p-2 rounded-xl ${
                          pinMessage.type === 'error'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {pinMessage.type === 'error' ? (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{pinMessage.text}</span>
                      </div>
                    )}

                    {/* Tombol Simpan PIN Baru */}
                    <button
                      type="submit"
                      id="btn-save-module-pin"
                      className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/25 flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                      <KeyRound className="w-3.5 h-3.5 shrink-0" />
                      <span>Simpan PIN Baru</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Tombol Aksi Navigasi & Kunci */}
              <div className="pt-2 flex flex-col gap-2">
                {/* 3a. Tombol Utama: Kembali / Tutup Profil (Hanya menutup modal dan tetap di halaman aktif) */}
                <button
                  type="button"
                  id="btn-close-profile-modal"
                  onClick={() => setIsDetailModalOpen(false)}
                  className={`w-full px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95 ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>Kembali / Tutup Profil</span>
                </button>

                {/* 3b. Tombol Sekunder: Kunci Modul Ini (Mengunci modul tanpa melempar ke HOME) */}
                <button
                  type="button"
                  id="btn-lock-current-module"
                  onClick={handleLockCurrentModule}
                  className="w-full px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                  title="Kunci kembali modul saat ini tanpa melempar ke Home/Dashboard"
                >
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>Kunci Modul Ini</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Global Notification Toast */}
      {toastMessage && (
        <div
          id="global-toast"
          className="fixed bottom-6 right-6 z-[70] flex items-center gap-3 bg-[#161b22] border border-[#10B981] text-[#e6edf3] px-4 py-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] animate-bounce"
        >
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
          <div className="text-sm font-medium">{toastMessage}</div>
        </div>
      )}

      {/* Pop-up Modal Pusat Informasi & SOP */}
      <SopModal
        isOpen={isSopModalOpen}
        onClose={() => setIsSopModalOpen(false)}
      />

      {/* Pop-up Modal Tentang Sistem & Pengembang */}
      <AboutSystemModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        isLight={isLight}
        language={language}
        onOpenSop={() => setIsSopModalOpen(true)}
      />
      {/* Pop-up Modal Pengaturan Profil Pengguna */}
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        isLight={isLight}
      />

      {/* Modal 1: Konfirmasi Keluar ke Menu Utama (HOME) via Portal */}
      {isExitConfirmOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#161b22] border-slate-700 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                <DoorOpen className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">Keluar ke Menu Utama (HOME)?</h3>
                <p className="text-xs text-gray-400 mt-0.5">Reset hak akses Super Admin ke Staff Operasional</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Hak akses elevated <strong>Super Admin</strong> akan dinonaktifkan, profil akun diubah kembali menjadi Staff Operasional, dan tampilan dialihkan langsung ke halaman <strong>HOME</strong>.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsExitConfirmOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-700' : 'border-slate-700 hover:bg-slate-800 text-gray-300'
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExitConfirmOpen(false);
                  exitSuperAdminSession();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
              >
                <DoorOpen className="w-3.5 h-3.5" />
                <span>Ya, Keluar ke HOME</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 2: Konfirmasi Logout / Kunci Sesi Super Admin via Portal */}
      {isLockConfirmOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#161b22] border-slate-700 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-rose-400">Logout / Kunci Sesi Super Admin?</h3>
                <p className="text-xs text-gray-400 mt-0.5">Kunci kembali hak akses elevated &amp; kembali ke HOME</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Hak akses istimewa akan dikunci total, profil akun diubah kembali menjadi Staff Operasional, dan tampilan dialihkan langsung ke halaman <strong>HOME</strong>.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsLockConfirmOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-700' : 'border-slate-700 hover:bg-slate-800 text-gray-300'
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLockConfirmOpen(false);
                  exitSuperAdminSession();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kunci Sesi &amp; Keluar ke HOME</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
