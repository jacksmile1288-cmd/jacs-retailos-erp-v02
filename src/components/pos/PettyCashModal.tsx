import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CashierShift } from '../../types';
import {
  PETTY_CASH_MANUAL_REASON_OPTION,
  getPettyCashReasonPresets,
} from '../../utils/businessDomainConfig';
import {
  X,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';

interface PettyCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
  reasonPresets?: string[];
  activeShiftOverride?: CashierShift | null;
}

export const PettyCashModal: React.FC<PettyCashModalProps> = ({
  isOpen,
  onClose,
  isLight = false,
  reasonPresets,
  activeShiftOverride,
}) => {
  const {
    activeShift: contextActiveShift,
    recordShiftExpense,
    activeSector,
    businessDomainConfig,
    businessProfile,
  } = useApp();

  const activeShift = activeShiftOverride || contextActiveShift;

  const sectorReasonPresets = useMemo(() => {
    if (Array.isArray(reasonPresets) && reasonPresets.length > 0) {
      return reasonPresets;
    }
    const subProfileHint =
      businessDomainConfig?.primaryBusinessModel ||
      businessProfile?.businessType ||
      '';
    return getPettyCashReasonPresets(activeSector, subProfileHint);
  }, [
    reasonPresets,
    activeSector,
    businessDomainConfig?.primaryBusinessModel,
    businessProfile?.businessType,
  ]);

  const [amount, setAmount] = useState<number>(25000);
  const [reason, setReason] = useState<string>(() => sectorReasonPresets[0] || '');
  const [customReason, setCustomReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason((prev) =>
        sectorReasonPresets.includes(prev) ? prev : sectorReasonPresets[0] || ''
      );
      setError(null);
    }
  }, [isOpen, sectorReasonPresets]);

  useEffect(() => {
    setReason(sectorReasonPresets[0] || '');
    setCustomReason('');
    setError(null);
  }, [sectorReasonPresets]);

  if (!isOpen || !activeShift) return null;

  const currentDrawerCash = activeShift.expectedCashInDrawer;
  const isManualReasonSelected =
    reason === PETTY_CASH_MANUAL_REASON_OPTION || reason === 'Lainnya';

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

    const finalReason = isManualReasonSelected ? customReason.trim() : reason.trim();
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
        className={`w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl relative border overflow-hidden ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-900'
            : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-white'
        }`}
      >
        {/* Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-cyan-500" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)] shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base leading-6 font-medium text-slate-900 dark:text-white">
              Tarik Kas / Petty Cash Keluar
            </h3>
            <p className="text-xs leading-5 font-normal text-slate-500 dark:text-slate-400">
              Pengeluaran darurat laci kasir shift #{activeShift.id}
            </p>
          </div>
        </div>

        {/* Status Saldo Laci Kasir */}
        <div
          className={`p-3 rounded-xl border mb-4 flex items-center justify-between text-xs ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-800/40 border-slate-700/60'
          }`}
        >
          <div>
            <span className="text-[11px] leading-4 font-mono font-normal tracking-wide text-slate-500 dark:text-slate-400 block">
              Estimasi Kas di Laci
            </span>
            <span className="font-mono text-base font-semibold text-emerald-600 dark:text-emerald-400">
              Rp {currentDrawerCash.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] leading-4 font-mono font-normal tracking-wide text-slate-500 dark:text-slate-400 block">
              Shift Aktif
            </span>
            <span className="font-mono text-xs font-normal text-cyan-600 dark:text-cyan-400">
              #{activeShift.id}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Input Jumlah Uang */}
          <div>
            <label className="text-xs leading-5 font-normal text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>Nominal Kas Ditarik (Rp) <span className="text-rose-500">*</span></span>
              <span className="font-mono text-amber-500 dark:text-amber-400 font-semibold text-xs">
                Rp {amount.toLocaleString('id-ID')}
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-sm">
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
                className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-base font-mono font-semibold outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                    : 'bg-slate-950/70 border-slate-700 text-white focus:border-amber-500'
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
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-normal border transition cursor-pointer active:scale-[0.99] ${
                    amount === preset
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold shadow-xs'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      : 'bg-slate-800/60 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  {(preset / 1000).toLocaleString('id-ID')}k
                </button>
              ))}
            </div>
          </div>

          {/* Alasan Pengeluaran */}
          <div>
            <label className="text-xs leading-5 font-normal text-slate-700 dark:text-slate-300 block mb-1.5">
              Alasan Pengeluaran Kasir <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-1.5 mb-2">
              {sectorReasonPresets.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition ${
                    reason === r
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-300'
                      : isLight
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === r}
                    onChange={() => {
                      setReason(r);
                      setError(null);
                    }}
                    className="accent-amber-500"
                  />
                  <span className="truncate text-xs leading-5 font-normal">{r}</span>
                </label>
              ))}
            </div>

            {isManualReasonSelected && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  setError(null);
                }}
                placeholder="Ketik rincian keperluan pengeluaran kasir..."
                className={`w-full px-3 py-2 rounded-xl border outline-none text-xs leading-5 font-normal ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                    : 'bg-slate-950/70 border-slate-700 text-white focus:border-amber-500'
                }`}
                required
              />
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-xs leading-5 font-normal">{error}</span>
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 text-[11px] leading-4 font-normal text-slate-600 dark:text-slate-400">
            Penarikan ini otomatis membukukan kas keluar (Petty Cash) di buku kas Finance dan
            memotong ekspektasi kas akhir saat tutup shift.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-normal transition cursor-pointer active:scale-[0.99] ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-800/60 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)] transition cursor-pointer active:scale-[0.99]"
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
