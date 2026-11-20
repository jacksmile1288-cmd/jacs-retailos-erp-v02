import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { CashierShift } from '../../types';
import {
  normalizeStationCode,
  resolveSynchronizedTerminalDisplayName,
} from '../../utils/terminalConfigUtils';
import {
  X,
  FileSpreadsheet,
  Wallet,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Receipt,
  History,
  ShieldCheck,
} from 'lucide-react';

interface QuickZReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onZReportClosed: (closedShift: CashierShift) => void;
  activeStationCode: string;
  activeTerminalName: string;
  activeTerminalId: string;
  isLight?: boolean;
}

export const QuickZReportModal: React.FC<QuickZReportModalProps> = ({
  isOpen,
  onClose,
  onZReportClosed,
  activeStationCode,
  activeTerminalName,
  activeTerminalId,
  isLight = false,
}) => {
  const {
    activeShift,
    getOpenShiftForStation,
    cashierShifts,
    sales,
    activeUser,
    currentUser,
    closeCashierShift,
    showToast,
    activeSector,
    businessDomainConfig,
    businessProfile,
  } = useApp();

  const [physicalCashStr, setPhysicalCashStr] = useState<string>('0');
  const [notes, setNotes] = useState<string>('Tutup Shift Z-Report Harian');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const normalizedStation = normalizeStationCode(activeStationCode);
  const primaryModel =
    businessDomainConfig?.primaryBusinessModel || businessProfile?.businessType;
  const synchronizedTerminalName = useMemo(
    () =>
      resolveSynchronizedTerminalDisplayName(
        normalizedStation || activeTerminalName,
        activeSector,
        primaryModel
      ),
    [normalizedStation, activeTerminalName, activeSector, primaryModel]
  );

  const runningSummary = useMemo(() => {
    const stationOpenShift = getOpenShiftForStation(normalizedStation);
    const openShift =
      (stationOpenShift && stationOpenShift.status === 'OPEN' ? stationOpenShift : null) ||
      (activeShift && activeShift.status === 'OPEN' ? activeShift : null) ||
      (cashierShifts || []).find(
        (s) =>
          s.status === 'OPEN' &&
          normalizeStationCode(s.stationCode || s.terminalId || s.terminalName) === normalizedStation
      ) ||
      (cashierShifts || []).find((s) => s.status === 'OPEN') ||
      null;

    if (openShift) {
      const openingFloat = Number(openShift.initialCash || 0);
      const totalCashSales = Number(openShift.totalCashSales || 0);
      const totalNonCashSales = Number(openShift.totalNonCashSales || 0);
      const totalExpenses = Number(openShift.totalExpenses || 0);
      const totalSalesReturnCash = Number(openShift.totalSalesReturnCash || 0);
      const totalTransactions = Number(openShift.totalTransactionsCount || 0);
      const expectedCash = Number(
        openShift.expectedCashInDrawer ??
          openingFloat + totalCashSales - totalExpenses
      );

      const resolvedShiftStation = normalizeStationCode(
        openShift.stationCode || openShift.terminalId || openShift.terminalName || normalizedStation
      );

      return {
        hasExplicitOpenShift: true,
        shiftId: openShift.id,
        stationCode: resolvedShiftStation,
        terminalId: openShift.terminalId || activeTerminalId,
        terminalName: resolveSynchronizedTerminalDisplayName(
          resolvedShiftStation,
          activeSector,
          primaryModel
        ),
        cashierId: openShift.cashierId || activeUser?.id || currentUser?.id || 'USR-01',
        cashierName: openShift.cashierName || activeUser?.name || currentUser?.name || 'Kasir POS',
        startTime: openShift.startTime,
        openingFloat,
        totalCashSales,
        totalNonCashSales,
        totalExpenses,
        totalSalesReturnCash,
        totalTransactions,
        expectedCash,
      };
    }

    // Fallback jika kasir langsung bertransaksi tanpa modal Buka Shift:
    // Hitung transaksi hari ini pada loket aktif setelah Z-Report penutupan terakhir
    const todayYmd = new Date().toISOString().slice(0, 10);
    const latestClosedOnStation = cashierShifts
      .filter(
        (s) =>
          s.status === 'CLOSED' &&
          normalizeStationCode(s.stationCode || s.terminalId || s.terminalName) === normalizedStation
      )
      .sort((a, b) => {
        const ta = new Date(a.endTime || a.closedAt || a.startTime || 0).getTime();
        const tb = new Date(b.endTime || b.closedAt || b.startTime || 0).getTime();
        return tb - ta;
      })[0];

    const cutoffMs = latestClosedOnStation
      ? new Date(
          latestClosedOnStation.endTime ||
            latestClosedOnStation.closedAt ||
            latestClosedOnStation.startTime ||
            0
        ).getTime()
      : 0;

    let totalCashSales = 0;
    let totalNonCashSales = 0;
    let totalTransactions = 0;

    sales.forEach((sale) => {
      const statusUpper = String(sale.status || '').toUpperCase();
      if (statusUpper === 'VOID' || statusUpper === 'CANCELLED') return;

      const saleStation = sale.stationCode
        ? normalizeStationCode(sale.stationCode)
        : sale.terminalId
        ? normalizeStationCode(sale.terminalId)
        : normalizedStation;
      if (saleStation !== normalizedStation) return;

      const saleDateStr = (sale.date || sale.created_at || '').slice(0, 10);
      if (saleDateStr !== todayYmd) return;

      const saleTimeMs = new Date(sale.created_at || sale.date || 0).getTime();
      if (cutoffMs > 0 && saleTimeMs > 0 && saleTimeMs <= cutoffMs) return;

      totalTransactions += 1;
      const methodUpper = String(sale.payment_method || '').toUpperCase();
      const isSplitMethod =
        methodUpper.includes('SPLIT') ||
        ((Number(sale.splitCashAmount) || 0) > 0 && (Number(sale.splitNonCashAmount) || 0) > 0);
      const isCashMethod = methodUpper === 'CASH' || methodUpper === 'TUNAI';
      const isTempoMethod =
        methodUpper.includes('TEMPO') ||
        methodUpper.includes('KREDIT') ||
        methodUpper.includes('KASBON') ||
        methodUpper.includes('PIUTANG') ||
        methodUpper.includes('INVOICE') ||
        methodUpper.includes('BELUM_BAYAR');

      const totalAmt = Number(sale.total_amount || 0);
      const dpAmt = Number(sale.dpAmount || 0);
      const remainingBal = Number(sale.remainingBalance || 0);

      if (isSplitMethod) {
        totalCashSales += Math.max(0, Math.round(Number(sale.splitCashAmount) || 0));
        totalNonCashSales += Math.max(0, Math.round(Number(sale.splitNonCashAmount) || 0));
      } else if (isCashMethod) {
        const collectedCash =
          dpAmt > 0 && remainingBal > 0 ? dpAmt : Math.max(0, totalAmt - remainingBal);
        totalCashSales += collectedCash;
      } else if (isTempoMethod) {
        if (dpAmt > 0) {
          totalCashSales += dpAmt;
        }
      } else {
        const collectedNonCash =
          dpAmt > 0 && remainingBal > 0 ? dpAmt : Math.max(0, totalAmt - remainingBal);
        totalNonCashSales += collectedNonCash;
      }
    });

    return {
      hasExplicitOpenShift: false,
      shiftId: `ZREP-${normalizedStation.replace('-', '')}`,
      stationCode: normalizedStation,
      terminalId: activeTerminalId,
      terminalName: synchronizedTerminalName,
      cashierId: activeUser?.id || currentUser?.id || 'USR-01',
      cashierName: activeUser?.name || currentUser?.name || 'Kasir POS',
      startTime: new Date().toISOString(),
      openingFloat: 0,
      totalCashSales,
      totalNonCashSales,
      totalExpenses: 0,
      totalSalesReturnCash: 0,
      totalTransactions,
      expectedCash: totalCashSales,
    };
  }, [
    activeShift,
    getOpenShiftForStation,
    normalizedStation,
    activeTerminalId,
    activeTerminalName,
    synchronizedTerminalName,
    activeSector,
    primaryModel,
    cashierShifts,
    sales,
    activeUser,
    currentUser,
  ]);

  const recentClosedShifts = useMemo(() => {
    return cashierShifts
      .filter((s) => s.status === 'CLOSED')
      .slice(0, 3);
  }, [cashierShifts]);

  useEffect(() => {
    if (isOpen) {
      setPhysicalCashStr(String(runningSummary.expectedCash || 0));
      setNotes('Tutup Shift Z-Report Harian');
      setIsSubmitting(false);
    }
  }, [isOpen, runningSummary.expectedCash]);

  if (!isOpen) return null;

  const actualCash = Math.max(0, Number(physicalCashStr) || 0);
  const variance = actualCash - runningSummary.expectedCash;
  const isBalanced = variance === 0;
  const isOver = variance > 0;
  const isShort = variance < 0;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = closeCashierShift({
        shiftId: runningSummary.hasExplicitOpenShift ? runningSummary.shiftId : undefined,
        cashierId: runningSummary.cashierId,
        cashierName: runningSummary.cashierName,
        openingCash: runningSummary.openingFloat,
        expectedCash: runningSummary.expectedCash,
        actualCash,
        totalTransactions: runningSummary.totalTransactions,
        totalCashSales: runningSummary.totalCashSales,
        totalNonCashSales: runningSummary.totalNonCashSales,
        totalExpenses: runningSummary.totalExpenses,
        totalSalesReturnCash: runningSummary.totalSalesReturnCash,
        stationCode: runningSummary.stationCode,
        terminalId: runningSummary.terminalId,
        terminalName: runningSummary.terminalName,
        notes: notes.trim() || 'Tutup Shift Z-Report Harian',
      });

      const closedShift = (result as any).shift || result;

      if (variance === 0) {
        showToast(
          `Z-Report berhasil disimpan (${closedShift.id} • Status CLOSED). Kas fisik laci seimbang Rp ${actualCash.toLocaleString('id-ID')}.`,
          'success'
        );
      } else {
        showToast(
          `Z-Report tersimpan (Status CLOSED). Selisih ${isOver ? 'Over' : 'Short'} Rp ${Math.abs(variance).toLocaleString('id-ID')} dicatat ke 7-10002 · Selisih Kas Operasional.`,
          isOver ? 'info' : 'warning'
        );
      }

      onZReportClosed(closedShift);
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Gagal menyimpan Z-Report tutup shift.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      id="modal-quick-zreport"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden my-auto ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#111827] border-slate-700 text-slate-100'
        }`}
      >
        {/* Top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500" />

        {/* Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 ${
            isLight ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800 bg-slate-900/70'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold tracking-tight truncate">
                Tutup Shift (Z-Report)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {normalizedStation} • {runningSummary.cashierName} •{' '}
                {runningSummary.totalTransactions} transaksi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isLight
                ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-200/70'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            aria-label="Tutup modal Z-Report"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} noValidate className="p-5 space-y-4">
          {/* Ringkasan Sistem Shift Berjalan */}
          <div
            className={`rounded-xl border p-3.5 space-y-2.5 ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-cyan-500" />
                Ringkasan Shift Berjalan (Sistem)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
                {runningSummary.hasExplicitOpenShift ? 'Shift Aktif' : 'Sesi Berjalan'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div
                className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#0b1120] border-slate-800'
                }`}
              >
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Total Penjualan Tunai (Sistem)
                </div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                  Rp {runningSummary.totalCashSales.toLocaleString('id-ID')}
                </div>
              </div>

              <div
                className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#0b1120] border-slate-800'
                }`}
              >
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Penjualan Non-Tunai
                </div>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums mt-0.5">
                  Rp {runningSummary.totalNonCashSales.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Modal Kas Awal Laci</span>
                <span className="tabular-nums font-medium">
                  Rp {runningSummary.openingFloat.toLocaleString('id-ID')}
                </span>
              </div>
              {runningSummary.totalExpenses > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Tarik Kas / Petty Cash</span>
                  <span className="tabular-nums font-medium">
                    -Rp {runningSummary.totalExpenses.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 font-bold text-xs text-slate-900 dark:text-white">
                <span>Saldo Kas Sistem Seharusnya</span>
                <span className="text-sm tabular-nums text-cyan-600 dark:text-cyan-400">
                  Rp {runningSummary.expectedCash.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Input Uang Fisik di Laci Kasir */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="input-zreport-physical-cash"
                className="text-xs font-bold flex items-center gap-1.5"
              >
                <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                <span>Uang Fisik di Laci Kasir</span>
              </label>
              <button
                type="button"
                onClick={() => setPhysicalCashStr(String(runningSummary.expectedCash))}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Samakan Sistem (Rp {runningSummary.expectedCash.toLocaleString('id-ID')})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                id="input-zreport-physical-cash"
                type="number"
                min="0"
                step="any"
                value={physicalCashStr}
                onChange={(e) => setPhysicalCashStr(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-base font-bold tabular-nums outline-none transition ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                    : 'bg-[#0b1120] border-slate-700 text-white focus:border-cyan-400'
                }`}
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* Perhitungan Otomatis Selisih Kas (Over / Short) */}
          <div
            className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 ${
              isBalanced
                ? isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200'
                : isOver
                ? isLight
                  ? 'bg-sky-50 border-sky-300 text-sky-900'
                  : 'bg-sky-500/10 border-sky-500/35 text-sky-200'
                : isLight
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-rose-500/10 border-rose-500/35 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                {isBalanced ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                ) : isOver ? (
                  <TrendingUp className="w-4.5 h-4.5 text-sky-500" />
                ) : (
                  <TrendingDown className="w-4.5 h-4.5 text-rose-500" />
                )}
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span>Selisih Kas (Over / Short)</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isBalanced
                        ? 'bg-emerald-600 text-white'
                        : isOver
                        ? 'bg-sky-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {isBalanced ? 'SEIMBANG' : isOver ? 'OVER' : 'SHORT'}
                  </span>
                </div>
                <p className="text-[11px] opacity-85 mt-0.5 leading-snug">
                  {isBalanced
                    ? 'Kas fisik di laci cocok dengan catatan penjualan tunai sistem.'
                    : `Akan dicatat ke akun "7-10002 · Selisih Kas Operasional" di Finance.`}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-base font-extrabold tabular-nums">
                {isBalanced
                  ? 'Rp 0'
                  : `${isOver ? '+' : '-'}Rp ${Math.abs(variance).toLocaleString('id-ID')}`}
              </div>
            </div>
          </div>

          {/* Catatan Z-Report */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Catatan Z-Report (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Penutupan shift sore, uang pecahan kecil sesuai"
              className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                  : 'bg-[#0b1120] border-slate-700 text-white focus:border-cyan-400'
              }`}
            />
          </div>

          {/* Riwayat Z-Report Terakhir */}
          {recentClosedShifts.length > 0 && (
            <div
              className={`rounded-xl border p-2.5 space-y-1.5 ${
                isLight
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <History className="w-3 h-3" />
                <span>Riwayat Z-Report Terakhir</span>
              </div>
              <div className="space-y-1">
                {recentClosedShifts.map((sh) => {
                  const diff = Number(sh.difference || 0);
                  return (
                    <div
                      key={sh.id}
                      className="flex items-center justify-between text-[11px] py-0.5"
                    >
                      <span className="text-slate-600 dark:text-slate-300 truncate max-w-[230px]">
                        <span className="font-mono font-semibold">{sh.stationCode || sh.terminalId}</span> • {sh.cashierName}
                      </span>
                      <span
                        className={`font-semibold tabular-nums ${
                          diff === 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : diff > 0
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        Rp {(sh.actualCashInDrawer ?? sh.expectedCashInDrawer ?? 0).toLocaleString('id-ID')}{' '}
                        ({diff === 0 ? 'Klop' : `${diff > 0 ? '+' : '-'}Rp ${Math.abs(diff).toLocaleString('id-ID')}`})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              Batal
            </button>
            <button
              id="btn-confirm-quick-zreport"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Konfirmasi & Simpan Z-Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
