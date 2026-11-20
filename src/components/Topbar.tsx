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
    contextualProfile,
    logout,
  } = useApp();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const isLight = theme === 'light';
  const isEn = language === 'en';
  const user = currentUser || activeUser;
  const isHomeActive = activeNav === 'home';

  const handleLogout = () => {
    logout();
    if (onLockPublicGateway) {
      onLockPublicGateway();
    }
  };

  return (
    <>
      <header
        className={`h-14 px-4 md:px-6 flex items-center justify-between border-b transition-colors duration-200 z-30 shrink-0 select-none ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#161b22] border-slate-800 text-slate-200'
        }`}
      >
        {/* Kiri: Brand JacS Enterprise + Tombol Beranda Terpadu */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className={`p-2 rounded-xl lg:hidden transition cursor-pointer ${
              isLight
                ? 'hover:bg-slate-100 text-slate-600'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => setActiveNav('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
            title="JacS Enterprise • RetailOS ERP"
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs transition-transform group-hover:scale-105 ${
                isLight
                  ? 'bg-transparent text-cyan-600'
                  : 'bg-black text-cyan-400 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
              }`}
            >
              <span>&gt;_</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs md:text-sm tracking-tight bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  JacS Enterprise
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider border hidden sm:inline-block ${ isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-800' : 'bg-cyan-950/60 border-cyan-800/80 text-cyan-400' }`} > {contextualProfile?.moduleTitle || 'RETAILOS ERP'} </span> </div> </div> </div>  {/* Pemisah Vertikal & Tombol Beranda Langsung di Navbar */} <div className={`h-6 w-[1px] mx-0.5 ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />

          <button
            type="button"
            id="btn-topbar-home-portal"
            onClick={() => setActiveNav('home')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
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
        </div>

        {/* Kanan: Bahasa, Tema, Profil & Logout */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            id="btn-topbar-language-toggle"
            onClick={toggleLanguage}
            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold font-mono transition cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title={isEn ? 'Ganti ke Bahasa Indonesia' : 'Switch to English'}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-500" />
            <span>{language.toUpperCase()}</span>
          </button>

          <button
            type="button"
            id="btn-topbar-theme-toggle"
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-amber-600'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-400'
            }`}
            title={isLight ? 'Aktifkan Mode Gelap' : 'Aktifkan Mode Terang'}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className={`flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
              {user?.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col text-left leading-tight hidden md:flex font-mono">
              <span className="text-xs font-bold max-w-[110px] truncate">
                {user?.name || (isEn ? 'Staff Active' : 'User Aktif')}
              </span>
              <span className="text-[10px] text-cyan-500 font-medium">
                {contextualProfile?.position || user?.role || 'User'}
              </span>
            </div>
          </button>

          <button
            type="button"
            id="btn-topbar-global-logout"
            onClick={handleLogout}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-bold transition cursor-pointer ${
              isLight
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                : 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-800/80 text-rose-300'
            }`}
            title="Keluar / Ganti Divisi"
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