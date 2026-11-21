import React from 'react';
import { CashierShift } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  getSectorTerminalSubtitle,
  resolveSynchronizedTerminalDisplayName,
} from '../../utils/terminalConfigUtils';
import {
  Printer,
  X,
  CheckCircle2,
  Receipt,
} from 'lucide-react';

interface ShiftSummaryReceiptModalProps {
  shift: CashierShift;
  onClose: () => void;
  isLight?: boolean;
}

const formatShiftDateTime = (raw?: string): string => {
  if (!raw) return '-';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ShiftSummaryReceiptModal: React.FC<ShiftSummaryReceiptModalProps> = ({
  shift,
  onClose,
  isLight = false,
}) => {
  const { businessProfile, activeSector, businessDomainConfig } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const activeBusinessName = (
    businessProfile?.name ||
    businessProfile?.businessName ||
    'TOKO UTAMA'
  ).trim();
  const primaryModel =
    businessDomainConfig?.primaryBusinessModel || businessProfile?.businessType;
  const sectorTerminalSubtitle = getSectorTerminalSubtitle(activeSector, primaryModel);
  const syncedTerminalName = resolveSynchronizedTerminalDisplayName(
    shift.stationCode || shift.terminalId || shift.terminalName,
    activeSector,
    primaryModel
  );

  const diff = shift.difference || 0;
  const isMatch = diff === 0;
  const isSurplus = diff > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl p-6 relative border my-8 flex flex-col max-h-[92vh] transition-all ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-800'
            : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-gray-100'
        }`}
      >
        {/* Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1 cursor-pointer active:scale-[0.99]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700/40 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3
              className={`font-medium text-base leading-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Mini Summary Rekonsiliasi Shift
            </h3>
            <p className="text-[11px] text-gray-400 font-normal">
              Struk penyelesaian kasir resmi (Z-Report Settlement)
            </p>
          </div>
        </div>

        {/* Scrollable Receipt Body (Thermal Receipt Appearance) */}
        <div className="flex-1 overflow-y-auto pr-1 pb-6">
          <div
            id="printable-shift-receipt"
            className="p-5 pb-6 rounded-2xl bg-white text-slate-900 font-mono text-[11px] leading-relaxed shadow-inner border border-slate-300 select-all"
          >
            {/* Header Struk */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <div className="font-black text-sm tracking-wider uppercase">
                {activeBusinessName}
              </div>
              <div className="text-[10px] text-slate-600 font-sans">
                {sectorTerminalSubtitle}
              </div>
              <div className="mt-1.5 font-bold uppercase tracking-wide text-xs bg-slate-100 py-1 rounded border border-slate-300">
                *** LAPORAN TUTUP SHIFT KASIR (Z-REPORT) ***
              </div>
            </div>

            {/* Info Shift */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">ID Shift:</span>
                <span className="font-bold text-right">{shift.id}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">Terminal:</span>
                <span className="font-bold text-right">{syncedTerminalName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">Operator Kasir:</span>
                <span className="font-bold text-right">{shift.cashierName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">Waktu Buka:</span>
                <span className="text-right">{formatShiftDateTime(shift.startTime)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">Waktu Tutup:</span>
                <span className="text-right">
                  {formatShiftDateTime(shift.endTime || new Date().toISOString())}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">Total Transaksi:</span>
                <span className="font-bold text-right">{shift.totalTransactionsCount} Transaksi</span>
              </div>
            </div>

            {/* Ringkasan Finansial Kasir */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1.5">
              <div className="flex justify-between text-slate-700">
                <span>(+) Modal Kas Awal:</span>
                <span className="font-bold">
                  Rp {shift.initialCash.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>(+) Penjualan Tunai:</span>
                <span className="font-bold">
                  Rp {shift.totalCashSales.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>(-) Total Retur Tunai:</span>
                <span className="font-bold">
                  -Rp {(shift.totalSalesReturnCash || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>(-) Kas Keluar (Petty):</span>
                <span className="font-bold">
                  -Rp {shift.totalExpenses.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-purple-700 pt-1 border-t border-dotted border-slate-300">
                <span>Omzet Non-Tunai:</span>
                <span>Rp {shift.totalNonCashSales.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-800 font-bold">
                <span>Total Omzet Shift:</span>
                <span>Rp {(shift.totalCashSales + shift.totalNonCashSales).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Rekonsiliasi Laci */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1.5 bg-slate-50 px-2 rounded-lg my-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Estimasi Kas Sistem:</span>
                <span>Rp {shift.expectedCashInDrawer.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-black text-slate-950 text-xs">
                <span>Fisik Kas Dihitung:</span>
                <span>
                  Rp {(shift.actualCashInDrawer ?? shift.expectedCashInDrawer).toLocaleString('id-ID')}
                </span>
              </div>
              <div
                className={`flex justify-between gap-2 font-black text-xs pt-1 border-t border-slate-300 ${
                  isMatch
                    ? 'text-emerald-700'
                    : isSurplus
                    ? 'text-blue-700'
                    : 'text-rose-700'
                }`}
              >
                <span>Selisih Rekonsiliasi:</span>
                <span className="text-right">
                  {diff > 0
                    ? `+Rp ${diff.toLocaleString('id-ID')} [Lebih (Surplus)]`
                    : isMatch
                    ? 'Rp 0 [Seimbang]'
                    : `-Rp ${Math.abs(diff).toLocaleString('id-ID')} [Kurang (Shortage)]`}
                </span>
              </div>
            </div>

            {/* Rincian Tarik Kas Jika Ada */}
            {shift.expenses && shift.expenses.length > 0 && (
              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-1">
                <div className="font-bold text-slate-700">Rincian Kas Keluar (Petty Cash):</div>
                {shift.expenses.map((exp, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <span className="truncate max-w-[200px]">• {exp.reason}</span>
                    <span>-Rp {exp.amount.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Catatan Shift */}
            {shift.notes && (
              <div className="py-2 text-[10px] text-slate-600 italic border-b border-dashed border-slate-400">
                Ket: {shift.notes}
              </div>
            )}

            {/* Kolom Tanda Tangan */}
            <div className="pt-3 text-center text-[10px] grid grid-cols-2 gap-4">
              <div>
                <div className="text-slate-500 mb-8">Kasir Bertugas,</div>
                <div className="font-bold border-t border-slate-400 pt-1">
                  ({shift.cashierName})
                </div>
              </div>
              <div>
                <div className="text-slate-500 mb-8">Head Cashier / SPV,</div>
                <div className="font-bold border-t border-slate-400 pt-1">
                  (......................)
                </div>
              </div>
            </div>

            <div className="text-center text-[9px] text-slate-500 mt-3 pt-2 border-t border-dotted border-slate-300 font-sans">
              Dicetak otomatis via JacS ERP Cloud • Terintegrasi ke Finance & Accounting
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-4 border-t border-slate-700/40 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk Rekonsiliasi (Print)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition cursor-pointer active:scale-[0.99]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Selesai & Selesai Shift</span>
          </button>
        </div>
      </div>
    </div>
  );
};