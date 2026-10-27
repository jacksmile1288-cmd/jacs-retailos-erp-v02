import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wallet,
  X,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Tag,
  Building2,
  Receipt,
  Sparkles,
} from 'lucide-react';

interface PettyCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
}

const COMMON_REASONS = [
  'Beli kantong plastik kresek & lakban',
  'Beli es batu kristal / air galon',
  'Kembalian receh / tukar koin darurat',
  'Kebutuhan pembersih kasir & tisu',
  'Operasional darurat toko',
];

export const PettyCashModal: React.FC<PettyCashModalProps> = ({
  isOpen,
  onClose,
  isLight = false,
}) => {
  const { activeShift, activeTerminal, activeUser, recordShiftExpense } = useApp();
  const [amount, setAmount] = useState<number>(25000);
  const [reason, setReason] = useState<string>('Beli kantong plastik kresek & lakban');
  const [customReason, setCustomReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !activeShift) return null;

  const currentDrawerCash = activeShift.expectedCashInDrawer;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Nominal pengeluaran kas harus lebih besar dari Rp 0.');
      return;
    }
    if (amount > currentDrawerCash) {
      setError(
        `Nominal penarikan (Rp ${amount.toLocaleString('id-ID')}) melebihi estimasi kas di laci (Rp ${currentDrawerCash.toLocaleString('id-ID')})!`
      );
      return;
    }

    const finalReason = reason === 'Lainnya' ? customReason.trim() : reason.trim();
    if (!finalReason) {
      setError('Alasan penarikan kas wajib diisi.');
      return;
    }

    recordShiftExpense(amount, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl relative border overflow-hidden ${
          isLight
            ? 'bg-white border-slate-300 text-slate-800'
            : 'bg-[#161b22] border-[#30363d] text-gray-100 shadow-[0_0_50px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-4 pb-3 border-b border-slate-700/40">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <h3
              className={`font-black text-lg ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Tarik Kas / Petty Cash Keluar
            </h3>
            <p className="text-xs text-gray-400">
              Pengeluaran darurat laci kasir shift #{activeShift.id}
            </p>
          </div>
        </div>

        {/* Status Saldo Laci Kasir */}
        <div
          className={`p-3.5 rounded-2xl border mb-4 flex items-center justify-between text-xs ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-[#0d1117] border-[#30363d]'
          }`}
        >
          <div>
            <span className="text-[11px] text-gray-400 block font-medium">Estimasi Kas di Laci</span>
            <span className="font-mono text-base font-black text-emerald-400">
              Rp {currentDrawerCash.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-gray-400 block font-medium">Shift Aktif</span>
            <span className="font-mono font-bold text-sky-400 text-xs">{activeShift.id}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Input Jumlah Uang */}
          <div>
            <label className="font-bold text-gray-300 block mb-1.5 flex items-center justify-between">
              <span>Nominal Kas Ditarik (Rp) <span className="text-rose-400">*</span></span>
              <span className="font-mono text-amber-400 font-bold text-xs">
                Rp {amount.toLocaleString('id-ID')}
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold font-mono text-gray-400 text-sm">
                Rp
              </span>
              <input
                type="number"
                min="1000"
                step="1000"
                max={currentDrawerCash}
                value={amount || ''}
                onChange={(e) => {
                  setAmount(Math.max(0, Number(e.target.value) || 0));
                  setError(null);
                }}
                className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-base font-black font-mono outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                    : 'bg-[#0d1117] border-[#30363d] text-white focus:border-amber-500'
                }`}
                placeholder="25000"
                required
                autoFocus
              />
            </div>

            {/* Chip preset amounts */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {[10000, 25000, 50000, 100000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold border transition cursor-pointer ${
                    amount === preset
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      : 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] text-gray-300'
                  }`}
                >
                  {(preset / 1000).toLocaleString('id-ID')}k
                </button>
              ))}
            </div>
          </div>

          {/* Alasan Pengeluaran */}
          <div>
            <label className="font-bold text-gray-300 block mb-1.5">
              Alasan Pengeluaran Kasir <span className="text-rose-400">*</span>
            </label>
            <div className="space-y-1.5 mb-2">
              {COMMON_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition ${
                    reason === r
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                      : isLight
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      : 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] text-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-amber-500"
                  />
                  <span className="truncate">{r}</span>
                </label>
              ))}

              <label
                className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition ${
                  reason === 'Lainnya'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                    : isLight
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] text-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  checked={reason === 'Lainnya'}
                  onChange={() => setReason('Lainnya')}
                  className="accent-amber-500"
                />
                <span>Alasan Lainnya (Ketik Manual)...</span>
              </label>
            </div>

            {reason === 'Lainnya' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Ketik rincian keperluan pengeluaran kasir..."
                className={`w-full px-3 py-2 rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                    : 'bg-[#0d1117] border-[#30363d] text-white focus:border-amber-500'
                }`}
                required
              />
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-[11px] text-gray-400">
            Penarikan ini otomatis membukukan kas keluar (Petty Cash) di buku kas Finance dan
            memotong ekspektasi kas akhir saat tutup shift.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl border font-bold transition cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] text-gray-300'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Catat Kas Keluar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
