import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { Lock, X, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';

export interface QuickAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user?: User) => void;
  moduleTitle?: string;
  targetModule?: string;
  title?: string;
  subtitle?: string;
  requireMasterPassword?: boolean;
}

export const QuickAuthModal: React.FC<QuickAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduleTitle,
  targetModule,
  title,
  subtitle,
  requireMasterPassword = false,
}) => {
  const {
    developerPassword,
    setIsSuperAdminAuthenticated,
    verifyPin,
    users,
    setActiveUser,
    addAuditLog,
    showToast,
    theme,
    verifyModulePassword,
    unlockModule,
  } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isShake, setIsShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLight = theme === 'light';
  const displayTitle = moduleTitle || title || 'Otorisasi Akses Modul';

  const defaultSubtitle = 'Masukkan PIN otorisasi untuk melanjutkan';

  // Auto-focus and reset state when opened
  useEffect(() => {
    if (isOpen) {
      setInputCode('');
      setErrorMessage(null);
      setShowPassword(false);
      setIsShake(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setInputCode('');
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputCode.trim();

    if (!trimmed) {
      setErrorMessage('Masukkan sandi atau PIN modul');
      triggerShake();
      return;
    }

    const target = targetModule || (requireMasterPassword ? 'admin' : '');
    if (target) {
      const res = verifyModulePassword(target, trimmed);
      if (res.success) {
        unlockModule(target);
        if (res.user) {
          setActiveUser(res.user);
        }
        addAuditLog(
          `Otorisasi berhasil untuk modul: ${displayTitle}`,
          'Authentication',
          'INFO'
        );
        showToast(`Otorisasi Berhasil: ${displayTitle}`);

        if (onSuccess) {
          onSuccess(res.user);
        }
        handleClose();
        return;
      }

      setErrorMessage(res.error || 'Sandi atau PIN modul tidak cocok!');
      triggerShake();
      return;
    }

    // Fallback umum jika target modul tidak dispesifikasikan
    const pinResult = verifyPin(trimmed);
    if (pinResult.success && pinResult.user) {
      setActiveUser(pinResult.user);
      if (onSuccess) onSuccess(pinResult.user);
      handleClose();
      return;
    }

    setErrorMessage('Sandi master atau PIN divisi tidak cocok!');
    triggerShake();
  };

  const triggerShake = () => {
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  return (
    <div
      id="quick-auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        id="quick-auth-modal-card"
        className={`w-full max-w-sm rounded-2xl border p-5 sm:p-6 shadow-2xl relative transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/20'
            : 'bg-[#161b22] border-[#30363d] text-white shadow-black/80'
        } ${isShake ? 'animate-bounce' : 'animate-in zoom-in-95 duration-150'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Tutup Pojok Kanan Atas */}
        <button
          type="button"
          onClick={handleClose}
          className={`absolute top-4 right-4 p-1 rounded-lg transition cursor-pointer ${
            isLight
              ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              : 'text-gray-400 hover:text-white hover:bg-[#21262d]'
          }`}
          title="Tutup (Batal)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Compact: Icon & Judul Modul */}
        <div className="text-center space-y-1.5 mb-5">
          <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center bg-blue-500/10 border border-blue-500/30 text-[#0052FF] dark:text-[#58a6ff]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
              {displayTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              {subtitle || defaultSubtitle}
            </p>
          </div>
        </div>

        {/* Form Otorisasi Sederhana */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="••••••••"
              autoComplete="off"
              className={`w-full text-center font-mono text-lg sm:text-xl tracking-widest py-2.5 px-10 rounded-xl border outline-none transition ${
                errorMessage
                  ? 'border-rose-500 bg-rose-500/10 text-rose-500 focus:border-rose-600'
                  : isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF] focus:bg-white'
                  : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
              }`}
            />
            {/* Toggle intip password */}
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 cursor-pointer"
              title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Pesan Error Singkat Merah */}
          {errorMessage && (
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-500 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tombol Aksi: Batal dan Masuk */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isLight
                  ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-gray-300'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              className="py-2 px-3 rounded-xl text-xs font-black bg-[#0052FF] hover:bg-[#0043d1] text-white shadow-md shadow-blue-500/25 transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
