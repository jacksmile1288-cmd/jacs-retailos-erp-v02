import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CashierShift } from '../../types';
import { resolveSynchronizedTerminalDisplayName } from '../../utils/terminalConfigUtils';
import {
  Wallet,
  Clock,
  User,
  Monitor,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: (shift: CashierShift) => void;
  isLight?: boolean;
}

const PRESET_AMOUNTS = [100000, 200000, 300000, 500000];

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isLight = false,
}) => {
  const {
    activeUser,
    activeTerminal,
    openCashierShift,
    showToast,
    openPinAuth,
    activeSector,
    businessDomainConfig,
    businessProfile,
  } = useApp();
  const [initialCash, setInitialCash] = useState<number>(200000);
  const [notes, setNotes] = useState<string>('Modal awal kasir operasional reguler');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const syncedTerminalLabel = resolveSynchronizedTerminalDisplayName(
    activeTerminal?.stationCode || activeTerminal?.id || activeTerminal?.name,
    activeSector,
    businessDomainConfig?.primaryBusinessModel || businessProfile?.businessType
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialCash < 0) {
      setError('Modal kas awal tidak boleh bernilai negatif.');
      return;
    }
    const newShift = openCashierShift(initialCash, notes);
    if (onSuccess) {
      onSuccess(newShift);
    } else if (onClose) {
      onClose();
    }
  };

  const nowStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl relative border overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-900'
            : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-white'
        }`}
      >
        {/* Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3.5 mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)] shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 uppercase tracking-wide">
                  APS POS4: 32_ShiftKasir
                </span>
                <span className="text-xs font-mono font-normal text-slate-500 dark:text-slate-400">
                  Buka Register POS
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-medium tracking-tight mt-1 text-slate-900 dark:text-white">
                Buka Shift Kasir Baru
              </h2>
              <p className="text-xs leading-5 font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                Verifikasi saldo modal kembalian di laci kasir sebelum memulai sesi penjualan.
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
                isLight
                  ? 'border-slate-300 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                  : 'border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Tutup Modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Info Petugas & Terminal */}
        <div
          className={`grid grid-cols-2 gap-3 p-3.5 rounded-2xl text-xs mb-5 ${
            isLight
              ? 'border border-slate-300 bg-slate-50'
              : 'bg-[#0d1117] border border-[#30363d]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              isLight ? 'bg-slate-200 text-slate-800 border border-slate-300' : 'bg-blue-500/15 text-[#0052FF] dark:text-[#58a6ff]'
            }`}>
              <User className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className={`block ${isLight ? 'text-slate-700 font-semibold text-xs' : 'text-[10px] text-gray-400 font-medium'}`}>Operator Kasir</span>
              {activeUser ? (
                <span className={`truncate block ${isLight ? 'text-slate-950 font-black text-sm' : 'font-bold text-slate-900 dark:text-white'}`}>
                  {activeUser.name}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => openPinAuth()}
                  className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline block cursor-pointer truncate"
                  title="Klik untuk autentikasi PIN kasir"
                >
                  Otorisasi PIN Kasir →
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              isLight ? 'bg-slate-200 text-slate-800 border border-slate-300' : 'bg-emerald-500/15 text-emerald-400'
            }`}>
              <Monitor className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className={`block ${isLight ? 'text-slate-700 font-semibold text-xs' : 'text-[10px] text-gray-400 font-medium'}`}>Terminal POS</span>
              <span className={`truncate block font-mono ${isLight ? 'text-slate-950 font-black text-sm' : 'font-bold text-slate-900 dark:text-white'}`}>
                {syncedTerminalLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Form Input Saldo Kas Awal */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700 font-semibold text-xs' : 'text-xs font-bold text-gray-300'}`}>
                <span>Saldo Kas Awal / Modal Kasir (Laci)</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <span className={`font-mono ${isLight ? 'text-slate-900 font-bold text-xs' : 'text-[11px] font-mono text-emerald-400 font-bold'}`}>
                Rp {initialCash.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="relative">
              <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-bold font-mono text-sm ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                Rp
              </span>
              <input
                id="input-initial-cash"
                type="number"
                min="0"
                step="1000"
                value={initialCash || ''}
                onChange={(e) => {
                  setInitialCash(Math.max(0, Number(e.target.value) || 0));
                  setError(null);
                }}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border text-base font-mono font-semibold outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500 focus:bg-white'
                    : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
                }`}
                placeholder="200000"
                required
                autoFocus
              />
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className={`mr-1 ${isLight ? 'text-slate-600 text-xs' : 'text-[11px] text-slate-400'}`}>Pilihan Cepat:</span>
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInitialCash(amt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-normal transition cursor-pointer border active:scale-[0.99] ${
                    initialCash === amt
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      : 'bg-slate-800/60 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  Rp {(amt / 1000).toLocaleString('id-ID')}k
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block mb-1 text-xs leading-5 font-normal ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Catatan Pembukaan Shift (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Shift Pagi, Uang kembalian pecahan 5rb, 10rb lengkap"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs leading-5 font-normal outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                  : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
              }`}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SOP Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-medium">SOP Kasir:</span> Saldo kas awal wajib dihitung fisik
              dari laci kasir (Cash Drawer). Setiap penjualan tunai, non-tunai, dan tarik kas akan
              terikat otomatis ke ID Shift ini hingga proses Tutup Shift (End of Day).
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={`py-3 px-4 rounded-xl border text-xs font-normal transition cursor-pointer active:scale-[0.99] ${
                  isLight
                    ? 'border-slate-300 hover:bg-slate-100 text-slate-700'
                    : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                Nanti Saja
              </button>
            )}
            <button
              id="btn-confirm-open-shift"
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition cursor-pointer active:scale-[0.99]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Buka Shift & Masuk Register Kasir</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
