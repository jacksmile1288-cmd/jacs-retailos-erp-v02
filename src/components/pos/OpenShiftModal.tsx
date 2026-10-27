import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CashierShift } from '../../types';
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
  const { activeUser, activeTerminal, openCashierShift, showToast, openPinAuth } = useApp();
  const [initialCash, setInitialCash] = useState<number>(200000);
  const [notes, setNotes] = useState<string>('Modal awal kasir operasional reguler');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl relative border overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-slate-300 text-slate-800'
            : 'bg-[#161b22] border-[#30363d] text-gray-100 shadow-[0_0_50px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />

        {/* Header */}
        <div className={`flex items-start justify-between gap-3.5 mb-5 pb-4 border-b ${
          isLight ? 'border-slate-200' : 'border-slate-700/40'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-mono uppercase tracking-wider ${
                  isLight
                    ? 'bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs px-2.5 py-0.5 rounded-full'
                    : 'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}>
                  APS POS4: 32_ShiftKasir
                </span>
                <span className={
                  isLight
                    ? 'bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs px-2.5 py-0.5 rounded-full'
                    : 'text-xs text-gray-400 font-medium'
                }>
                  Buka Register POS
                </span>
              </div>
              <h2
                className={`text-xl font-black tracking-tight mt-1 ${
                  isLight ? 'text-slate-950' : 'text-white'
                }`}
              >
                Buka Shift Kasir Baru
              </h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600 font-medium' : 'text-gray-400'}`}>
                Verifikasi saldo modal kembalian di laci kasir sebelum memulai sesi penjualan.
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${
                isLight
                  ? 'border-slate-300 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                  : 'border-[#30363d] hover:bg-[#21262d] text-gray-400 hover:text-white'
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
                {activeTerminal.name}
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
                className={`w-full pl-11 pr-4 py-3 rounded-2xl border text-base font-black font-mono outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-emerald-500 focus:bg-white'
                    : 'bg-[#0d1117] border-[#30363d] text-white focus:border-emerald-500 shadow-inner'
                }`}
                placeholder="200000"
                required
                autoFocus
              />
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className={`mr-1 ${isLight ? 'text-slate-700 font-semibold text-xs' : 'text-[11px] text-gray-400'}`}>Pilihan Cepat:</span>
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInitialCash(amt)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
                    initialCash === amt
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs'
                      : 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] text-gray-300'
                  }`}
                >
                  Rp {(amt / 1000).toLocaleString('id-ID')}k
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block mb-1 ${isLight ? 'text-slate-700 font-semibold text-xs' : 'text-xs font-bold text-gray-300'}`}>
              Catatan Pembukaan Shift (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Shift Pagi, Uang kembalian pecahan 5rb, 10rb lengkap"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none font-medium transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF]'
                  : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
              }`}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SOP Notice */}
          <div className={
            isLight
              ? 'bg-amber-50 border border-amber-300 text-amber-950 font-medium text-xs p-3 rounded-lg leading-relaxed flex items-start gap-2.5'
              : 'p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2.5'
          }>
            <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-amber-900' : 'text-amber-400'}`} />
            <div>
              <span className={`font-bold ${isLight ? 'text-amber-900' : ''}`}>SOP Kasir JacS:</span> Saldo kas awal wajib dihitung fisik
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
                className={`py-3.5 px-4 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  isLight
                    ? 'border-slate-300 hover:bg-slate-100 text-slate-700'
                    : 'border-[#30363d] hover:bg-[#21262d] text-gray-300'
                }`}
              >
                Nanti Saja
              </button>
            )}
            <button
              id="btn-confirm-open-shift"
              type="submit"
              className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition cursor-pointer active:scale-[0.99]"
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
