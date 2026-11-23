import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Menu,
  Sun,
  Moon,
  Globe,
  LogOut,
  Shield,
  Terminal,
  X,
  Home,
  Sparkles,
} from 'lucide-react';

export interface TopbarProps {
  onOpenMobileMenu?: () => void;
  onLockPublicGateway?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileMenu,
  onLockPublicGateway,
}) => {
  const {
    theme,
    toggleTheme,
    language,
    toggleLanguage,
    activeNav,
    setActiveNav,
    currentUser,
    activeUser,
    isSuperAdminAuthenticated,
    contextualProfile,
    businessProfile,
    boundStation,
    activeTerminal,
    logout,
    openAiAssistant,
  } = useApp();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const isLight = theme === 'light';
  const isEn = language === 'en';
  const user = currentUser || activeUser;
  const isHomeActive = activeNav === 'home';

  const isSuperAdminSession = Boolean(
    isSuperAdminAuthenticated ||
      String(user?.role || '').toUpperCase().includes('SUPER') ||
      String(user?.division || '').toUpperCase().includes('SUPER') ||
      String(user?.user_id || user?.id || '').toUpperCase().includes('SUPER')
  );

  const isAiFeatureAuthorized = Boolean(
    user &&
      (isSuperAdminSession ||
        activeNav === 'executive' ||
        activeNav === 'admin' ||
        String(user.role || '').toUpperCase().includes('EXEC') ||
        String(user.division || '').toUpperCase().includes('EXEC'))
  );

  const activeStoreName = (
    businessProfile?.name ||
    businessProfile?.businessName ||
    businessProfile?.companyName ||
    'TOKO UTAMA'
  ).trim();

  const divisionShortName =
    activeNav === 'executive'
      ? 'Executive'
      : activeNav === 'finance'
      ? 'Finance'
      : activeNav === 'purchasing'
      ? 'Purchasing'
      : activeNav === 'warehouse'
      ? 'Warehouse'
      : activeNav === 'hr'
      ? 'HR'
      : activeNav === 'admin'
      ? 'SuperAdmin'
      : activeNav === 'pos'
      ? 'POS'
      : user?.division || 'POS';

  const activePosStationNum = (
    user?.assignedTerminalId ||
    boundStation?.stationCode ||
    activeTerminal?.stationCode ||
    activeTerminal?.id ||
    'POS-01'
  )
    .replace(/^POS-/i, '')
    .padStart(2, '0');

  const divisionProfileLabel =
    activeNav === 'pos'
      ? `Kasir ${activePosStationNum} (POS)`
      : activeNav === 'admin' || isSuperAdminSession
      ? 'SuperAdmin (Jacs Enterprise)'
      : activeNav === 'executive'
      ? 'Executive Manager (Executive)'
      : activeNav === 'finance'
      ? 'Finance Staff (Finance)'
      : activeNav === 'purchasing'
      ? 'Purchasing Staff (Purchasing)'
      : activeNav === 'warehouse'
      ? 'Warehouse Staff (Warehouse)'
      : activeNav === 'hr'
      ? 'HR Staff (HR)'
      : `${user?.name || contextualProfile?.position || 'Staff'} (${divisionShortName})`;

  const handleLogout = () => {
    logout();
    if (onLockPublicGateway) {
      onLockPublicGateway();
    }
  };

  return (
    <>
      <header
        className={`h-14 px-4 md:px-6 flex items-center justify-between gap-3 border-b transition-colors duration-200 z-30 shrink-0 select-none ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#161b22] border-slate-800 text-slate-200'
        }`}
      >
        {/* Kiri: Identitas Toko / Usaha Aktif + Label Jabatan Divisi + Tombol Beranda Terpadu */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className={`p-2 rounded-xl lg:hidden transition cursor-pointer shrink-0 ${
              isLight
                ? 'hover:bg-slate-100 text-slate-600'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => {
              if (isSuperAdminSession) setActiveNav('home');
            }}
            className={`flex items-center gap-3 shrink-0 bg-transparent border-0 shadow-none p-0 ${
              isSuperAdminSession ? 'cursor-pointer' : 'cursor-default'
            } group`}
            title={`${activeStoreName} • ${divisionProfileLabel}`}
          >
            <div
              className={`w-8 h-8 flex items-center justify-center font-mono font-normal text-xs transition-transform group-hover:scale-105 shrink-0 ${
                isLight
                  ? 'bg-transparent border-0 shadow-none rounded-none p-0 text-cyan-700'
                  : 'rounded-xl bg-black text-cyan-400 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
              }`}
            >
              <img
                src={businessProfile?.logoUrl || '/logo-jacs-enterprise.png'}
                alt="JacS Enterprise Logo"
                className="w-7 h-7 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="font-['Plus_Jakarta_Sans'] font-semibold text-sm md:text-[15px] tracking-wider text-slate-900 dark:text-white max-w-[180px] sm:max-w-[240px] truncate">
                {activeStoreName}
              </span>
              <span
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold tracking-wide border whitespace-nowrap shrink-0 ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-800'
                    : 'bg-slate-900 border-slate-800 text-slate-100'
                }`}
                title={`Profil Jabatan Aktif: ${divisionProfileLabel}`}
              >
                {divisionProfileLabel}
              </span>
            </div>
          </div>

          {/* Pemisah Vertikal & Tombol Beranda Langsung di Navbar (Hanya untuk Mode SuperAdmin) */}
          {isSuperAdminSession && (
            <>
              <div className={`h-6 w-[1px] mx-0.5 shrink-0 ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />

              <button
                type="button"
                id="btn-topbar-home-portal"
                onClick={() => setActiveNav('home')}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition cursor-pointer shrink-0 ${
                  isHomeActive
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : isLight
                    ? 'bg-slate-100 hover:bg-cyan-50 border-slate-300 text-slate-700 hover:text-cyan-800'
                    : 'bg-slate-800/80 hover:bg-cyan-950/60 border-slate-700 text-slate-200 hover:text-cyan-300 hover:border-cyan-500/50'
                }`}
                title={isEn ? 'Back to Home Portal' : 'Kembali ke Beranda Utama'}
              >
                <Home className="w-3.5 h-3.5 shrink-0" />
                <span>{isEn ? 'Home' : 'Beranda'}</span>
              </button>
            </>
          )}
        </div>

        {/* Kanan: Tanya AI, Bahasa, Tema, Profil & Logout */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Tombol Tanya AI (Khusus Executive Manager & SuperAdmin) */}
          {isAiFeatureAuthorized && (
            <button
              type="button"
              id="btn-topbar-ask-ai"
              onClick={openAiAssistant}
              className={`h-8 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-medium font-['Plus_Jakarta_Sans'] transition cursor-pointer active:scale-95 shrink-0 ${
                isLight
                  ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-800'
                  : 'bg-cyan-950/40 hover:bg-cyan-900/60 border-cyan-700/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              }`}
              title={
                isEn
                  ? 'Ask AI Assistant (Executive Manager & SuperAdmin Only)'
                  : 'Tanya AI Assistant (Khusus Executive Manager & SuperAdmin)'
              }
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
              <span className="hidden sm:inline">{isEn ? 'Ask AI' : 'Tanya AI'}</span>
            </button>
          )}

          <button
            type="button"
            id="btn-topbar-language-toggle"
            onClick={toggleLanguage}
            className={`h-8 px-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold font-mono uppercase transition cursor-pointer shrink-0 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title={isEn ? 'Ganti ke Bahasa Indonesia (ID)' : 'Switch to English (EN)'}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span>{(language || 'id').toUpperCase()}</span>
          </button>

          <button
            type="button"
            id="btn-topbar-theme-toggle"
            onClick={toggleTheme}
            className={`h-8 w-8 rounded-xl border flex items-center justify-center transition cursor-pointer shrink-0 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-amber-600'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-400'
            }`}
            title={isLight ? (isEn ? 'Enable Dark Mode' : 'Aktifkan Mode Gelap') : (isEn ? 'Enable Light Mode' : 'Aktifkan Mode Terang')}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className={`flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl border transition cursor-pointer shrink-0 ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
              {user?.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col text-left leading-tight hidden md:flex font-mono">
              <span className="text-xs font-bold max-w-[140px] truncate">
                {divisionProfileLabel}
              </span>
              <span className="text-[10px] text-cyan-500 font-medium">
                {user?.name || contextualProfile?.position || 'User'}
              </span>
            </div>
          </button>

          <button
            type="button"
            id="btn-topbar-global-logout"
            onClick={handleLogout}
            className={`h-8 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-bold transition cursor-pointer shrink-0 ${
              isLight
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                : 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-800/80 text-rose-300'
            }`}
            title={isEn ? 'Logout / Switch Division' : 'Keluar / Ganti Divisi'}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{isEn ? 'Logout' : 'Keluar'}</span>
          </button>
        </div>
      </header>

      {/* Modal Detail Profil Sesi */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-mono">
          <div
            className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl transition-all ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-xs">
                  {isEn ? 'OPERATOR_SESSION_DETAILS' : 'DETAIL_SESI_OPERATOR'}
                </h3>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">ENTITAS</span>
                <span className="font-bold text-right truncate max-w-[180px]">{activeStoreName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">OPERATOR</span>
                <span className="font-bold">{user?.name || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">ROLE</span>
                <span className="font-bold text-cyan-400">{user?.role || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">DIVISI</span>
                <span>{user?.division || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">STATUS</span>
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <Shield className="w-3.5 h-3.5" />
                  TEROTORISASI
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                {isEn ? 'CLOSE' : 'TUTUP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};