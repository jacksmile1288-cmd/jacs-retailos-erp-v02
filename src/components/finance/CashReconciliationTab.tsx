import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CashierShift } from '../../types';
import { CloseShiftModal } from '../pos/CloseShiftModal';
import { ShiftSummaryReceiptModal } from '../pos/ShiftSummaryReceiptModal';
import {
  Scale,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Search,
  Filter,
  ArrowRight,
  Wallet,
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Printer,
  ShieldCheck,
  User,
  Monitor,
} from 'lucide-react';

interface CashReconciliationTabProps {
  isLight?: boolean;
}

export const CashReconciliationTab: React.FC<CashReconciliationTabProps> = ({
  isLight = false,
}) => {
  const { activeShift, shiftsHistory, cashierShifts, activeUser, showToast, language, openJournalVoucher } = useApp();
  const isEn = language === 'en';
  const allShifts = useMemo(
    () => (shiftsHistory && shiftsHistory.length > 0 ? shiftsHistory : cashierShifts || []),
    [shiftsHistory, cashierShifts]
  );

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedShiftForReceipt, setSelectedShiftForReceipt] = useState<CashierShift | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MATCH' | 'SURPLUS' | 'SHORTAGE'>('ALL');

  // Translation Dictionary
  const t = {
    badge: isEn ? "Cash Drawer Settlement • Cashier Reconciliation & Shift Closing" : "Cash Drawer Settlement • Rekonsiliasi Kasir & Tutup Shift",
    header: isEn ? "End of Shift Cash Reconciliation" : "Rekonsiliasi Kas Akhir Shift (Cash Drawer Closing)",
    subHeader: isEn ? "Physical drawer cash audit against system calculations (Z-Report)." : "Audit fisik uang laci terhadap kalkulasi sistem (Z-Report).",
    btnTutup: isEn ? "Close Shift & Reconcile" : "Tutup Shift & Rekonsiliasi Kasir",
    allClosed: isEn ? "All cashier shifts are currently closed (Status: CLOSED)" : "Semua shift kasir saat ini tertutup (Status: CLOSED)",
    statActiveShift: isEn ? "Active Cashier Shift" : "Shift Kasir Aktif",
    statusOpen: isEn ? "OPEN" : "SEDANG BUKA",
    statusClosed: isEn ? "ALL CLOSED" : "SEMUA CLOSED",
    noActiveShift: isEn ? "No active drawer sessions" : "Tidak ada kas laci yang belum disetor",
    statTotalCash: isEn ? "TOTAL CASH DEPOSITED (CLOSED)" : "Total Kas Disetor (CLOSED)",
    fromShifts: isEn ? "From" : "Dari",
    sessions: isEn ? "shift sessions" : "sesi shift kasir tertutup",
    statNetDiff: isEn ? "Net Reconciliation Difference" : "Net Selisih Rekonsiliasi",
    balanced: isEn ? "Balanced" : "Seimbang",
    surplus: isEn ? "Surplus" : "Lebih (Surplus)",
    shortage: isEn ? "Shortage" : "Kurang (Shortage)",
    accPerfect: isEn ? "100% perfect cashier balance" : "Keseimbangan kasir 100% sempurna",
    accSurplus: isEn ? "Accumulated surplus" : "Akumulasi kasir lebih (surplus)",
    accShortage: isEn ? "Accumulated shortage" : "Akumulasi kasir kurang (shortage)",
    statAccuracy: isEn ? "Balanced Shift Accuracy" : "Akurasi Shift Seimbang",
    outOf: isEn ? "out of" : "dari",
    balancedShifts: isEn ? "shifts are Balanced" : "shift berstatus Seimbang",
    livePanelTitle: isEn ? "Active Cashier Shift (Requires Closing Reconciliation)" : "Shift Kasir Sedang Berjalan (Memerlukan Rekonsiliasi Tutup Shift)",
    operator: isEn ? "Operator" : "Operator Kasir",
    startTime: isEn ? "Start Time" : "Waktu Buka",
    processed: isEn ? "Processed" : "Transaksi Terproses",
    receipts: isEn ? "receipts" : "struk",
    float: isEn ? "Opening Cash (Float)" : "Kas Awal (Float)",
    cashSales: isEn ? "Cash Sales" : "Penjualan Tunai",
    cashOut: isEn ? "Cash Out" : "Kas Keluar",
    systemEst: isEn ? "System Estimate" : "Estimasi Kas Sistem",
    btnInput: isEn ? "Input Physical Cash & Close Shift" : "Input Uang Fisik & Tutup Shift",
    historyTitle: isEn ? "Shift Settlement Ledger" : "Riwayat Rekonsiliasi Kas Akhir Shift (Shift Settlement Ledger)",
    historySub: isEn ? "List of CLOSED sessions with opening, system, and physical cash comparisons." : "Daftar sesi kasir berstatus CLOSED lengkap dengan perbandingan kas awal, sistem, kas fisik, dan audit selisih.",
    searchPlaceholder: isEn ? "Search cashier / terminal / notes..." : "Cari kasir / terminal / catatan...",
    filterAll: isEn ? "All" : "Semua",
    filterMatch: isEn ? "Balanced" : "Seimbang",
    filterSurplus: isEn ? "Surplus" : "Lebih (Surplus)",
    filterShortage: isEn ? "Shortage" : "Kurang (Shortage)",
    colId: "ID Shift",
    colCashier: isEn ? "Cashier & Terminal" : "Kasir & Terminal",
    colFloat: isEn ? "Opening Float" : "Kas Awal (Float)",
    colSales: isEn ? "Cash Sales" : "Penjualan Tunai",
    colSystem: isEn ? "System Est." : "Estimasi Sistem",
    colPhysical: isEn ? "Physical Cash" : "Kas Fisik Terhitung",
    colDiff: isEn ? "Difference" : "Selisih",
    colStatus: isEn ? "Status" : "Status Rekonsiliasi",
    colShiftStatus: isEn ? "Shift Status" : "Status Shift",
    colAction: isEn ? "Action" : "Aksi",
    noData: isEn ? "No matching reconciliation data found" : "Belum ada data rekonsiliasi tutup shift yang cocok",
    noDataSub: isEn ? "Data will appear here automatically after a cashier closes their shift." : "Saat kasir melakukan tutup shift (Cash Drawer Closing), data rekonsiliasi otomatis tercatat di sini.",
    toastSuccess: isEn ? "Shift successfully closed and reconciliation saved!" : "berhasil ditutup & status rekonsiliasi tersimpan!",
    btnReceipt: isEn ? "Receipt" : "Struk",
  };

  // Pisahkan sesi OPEN (aktif berjalan) dari riwayat sesi CLOSED (sudah tutup buku)
  const openShift = useMemo(() => {
    if (activeShift && activeShift.status === 'OPEN') return activeShift;
    return allShifts.find((s) => s.status === 'OPEN') || null;
  }, [activeShift, allShifts]);

  const closedShiftsHistory = useMemo(
    () => allShifts.filter((s) => s.status === 'CLOSED'),
    [allShifts]
  );

  // Summary statistics strictly from CLOSED shiftsHistory
  const totalSettledCash = closedShiftsHistory.reduce(
    (acc, s) => acc + (s.actualCashInDrawer ?? s.expectedCashInDrawer ?? 0),
    0
  );
  const totalNetDifference = closedShiftsHistory.reduce(
    (acc, s) => acc + (s.difference ?? ((s.actualCashInDrawer ?? s.expectedCashInDrawer ?? 0) - (s.expectedCashInDrawer ?? 0))),
    0
  );
  const balancedShiftsCount = closedShiftsHistory.filter(
    (s) => (s.difference ?? 0) === 0
  ).length;

  const filteredHistory = closedShiftsHistory.filter((s) => {
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        s.id.toLowerCase().includes(q) ||
        s.cashierName.toLowerCase().includes(q) ||
        s.terminalName.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Status filter
    if (statusFilter === 'MATCH') return (s.difference ?? 0) === 0;
    if (statusFilter === 'SURPLUS') return (s.difference ?? 0) > 0;
    if (statusFilter === 'SHORTAGE') return (s.difference ?? 0) < 0;

    return true;
  });

  // Nilai Non-Tunai & Selisih untuk sesi OPEN (jangan pernah hitung negatif dari modal awal sebelum shift ditutup)
  const openShiftNonCashSales = openShift
    ? Math.max(
        0,
        Number(
          (openShift as any).totalNonCashSales ??
            (openShift as any).nonCashSales ??
            0
        )
      )
    : 0;
  const isOpenShiftCounted =
    Boolean(openShift) &&
    openShift!.status === 'CLOSED' &&
    typeof openShift!.actualCashInDrawer === 'number';
  const openShiftDiff =
    openShift && isOpenShiftCounted
      ? (openShift.actualCashInDrawer ?? 0) - (openShift.expectedCashInDrawer ?? 0)
      : 0;

  return (
    <div id="tab-cash-reconciliation" className="space-y-6 text-slate-900 dark:text-slate-200 font-sans">
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
        isLight ? 'border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-mono font-normal mb-2">
              <Scale className="w-3.5 h-3.5" />
              <span>{t.badge}</span>
            </div>
            <h3 className="text-xl leading-7 font-medium tracking-tight text-slate-900 dark:text-white">
              {t.header}
            </h3>
            <p className="text-sm leading-5 font-normal text-slate-600 dark:text-slate-400 mt-0.5">
              {t.subHeader}
            </p>
          </div>

          {/* Quick Action Button for Active Shift */}
          {openShift ? (
            <button
              type="button"
              id="btn-finance-open-close-shift"
              onClick={() => setIsCloseModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer active:scale-[0.99]"
            >
              <Clock className="w-4 h-4" />
              <span>{t.btnTutup} ({openShift.terminalName})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-500 shadow-inner">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              <span className="font-normal">{t.allClosed}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Active Cash Drawer Status */}
        <div className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
          openShift
            ? 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.22)]'
            : isLight ? 'border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] leading-4 font-mono font-normal text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {t.statActiveShift}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-normal ${
                openShift
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 animate-pulse'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-500'
              }`}
            >
              {openShift ? t.statusOpen : t.statusClosed}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-lg leading-7 font-mono font-semibold text-slate-900 dark:text-white">
              {openShift
                ? `Rp ${(openShift.expectedCashInDrawer || 0).toLocaleString('id-ID')}`
                : 'Rp 0'}
            </div>
            <div className="text-sm leading-5 font-normal text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {openShift
                ? `${openShift.terminalName} • ${openShift.cashierName}`
                : t.noActiveShift}
            </div>
          </div>
        </div>

        {/* Total Setoran Kas CLOSED */}
        <div className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
          isLight ? 'border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] leading-4 font-mono font-normal text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {t.statTotalCash}
            </span>
            <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-lg leading-7 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              Rp {totalSettledCash.toLocaleString('id-ID')}
            </div>
            <div className="text-sm leading-5 font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              {t.fromShifts} {closedShiftsHistory.length} {t.sessions}
            </div>
          </div>
        </div>

        {/* Akumulasi Selisih Kasir */}
        <div className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
          totalNetDifference !== 0
            ? 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.22)]'
            : isLight ? 'border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] leading-4 font-mono font-normal text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {t.statNetDiff}
            </span>
            <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-3">
            <div
              className={`text-lg leading-7 font-mono font-semibold ${
                totalNetDifference === 0
                  ? 'text-slate-900 dark:text-white'
                  : totalNetDifference > 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {totalNetDifference > 0
                ? `+Rp ${totalNetDifference.toLocaleString('id-ID')}`
                : totalNetDifference === 0
                ? `Rp 0 (${t.balanced})`
                : `-Rp ${Math.abs(totalNetDifference).toLocaleString('id-ID')}`}
            </div>
            <div className="text-sm leading-5 font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              {totalNetDifference === 0
                ? t.accPerfect
                : totalNetDifference > 0
                ? t.accSurplus
                : t.accShortage}
            </div>
          </div>
        </div>

        {/* Tingkat Akurasi Shift Seimbang */}
        <div className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
          isLight ? 'border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] leading-4 font-mono font-normal text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {t.statAccuracy}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-lg leading-7 font-mono font-semibold text-slate-900 dark:text-white">
              {closedShiftsHistory.length > 0
                ? `${Math.round((balancedShiftsCount / closedShiftsHistory.length) * 100)}%`
                : '100%'}
            </div>
            <div className="text-sm leading-5 font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              {balancedShiftsCount} {t.outOf} {closedShiftsHistory.length} {t.balancedShifts}
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE SHIFT LIVE PANEL (IF CURRENTLY OPEN) */}
      {openShift && (
        <div className={`p-5 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden ${
          openShift
            ? 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.22)]'
            : isLight ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
        }`}>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] leading-4 font-mono font-normal uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                  {t.livePanelTitle}
                </span>
              </div>
              <h4 className="text-base leading-6 font-medium text-slate-900 dark:text-white">
                {openShift.terminalName} • {t.operator}: {openShift.cashierName}
              </h4>
              
              {/* 3-Pillar Comparison Table */}
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] leading-4 text-slate-500 dark:text-slate-400 uppercase font-mono font-normal">Penjualan Sistem</div>
                  <div className="font-mono font-semibold text-lg leading-7 text-emerald-600 dark:text-emerald-400 mt-1">Rp {(openShift.totalCashSales || 0).toLocaleString('id-ID')}</div>
                </div>
                <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] leading-4 text-slate-500 dark:text-slate-400 uppercase font-mono font-normal">Kas Fisik</div>
                  <div className="font-mono font-semibold text-lg leading-7 text-blue-600 dark:text-blue-400 mt-1">
                    {isOpenShiftCounted
                      ? `Rp ${(openShift.actualCashInDrawer ?? 0).toLocaleString('id-ID')}`
                      : `Rp ${(openShift.expectedCashInDrawer ?? 0).toLocaleString('id-ID')}`}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] leading-4 text-slate-500 dark:text-slate-400 uppercase font-mono font-normal">Non-Tunai</div>
                  <div className="font-mono font-semibold text-lg leading-7 text-purple-600 dark:text-purple-400 mt-1">Rp {openShiftNonCashSales.toLocaleString('id-ID')}</div>
                </div>
              </div>
            </div>

            {/* Formula Breakdown & Action */}
            <div className="lg:w-1/3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col justify-center gap-3 text-sm leading-5 font-normal text-slate-700 dark:text-slate-300 shadow-sm">
              <div className="flex justify-between items-center">
                <span>Estimasi Kas:</span>
                <span className="font-mono font-semibold text-base text-blue-600 dark:text-blue-400">Rp {(openShift.expectedCashInDrawer || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Selisih:</span>
                <span className={`font-mono font-semibold text-base ${openShiftDiff !== 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {isOpenShiftCounted
                    ? `Rp ${openShiftDiff.toLocaleString('id-ID')}`
                    : 'Rp 0 (Sesi Aktif)'}
                </span>
              </div>
              
              {isOpenShiftCounted && openShiftDiff !== 0 && (
                <button
                  type="button"
                  onClick={() => {
                     const diff = openShiftDiff;
                     const isShortage = diff < 0;
                     const absDiff = Math.abs(diff);

                     openJournalVoucher({
                       date: new Date().toISOString().slice(0, 10),
                       type: 'Adjustment',
                       memo: `Penyesuaian Selisih Kas Shift #${openShift.id} - ${isShortage ? 'Kurang' : 'Lebih'}`,
                       lines: [
                         { id: 1, coa: '5-10004', memo: `Selisih Kas ${isShortage ? 'Kurang' : 'Lebih'}`, debit: isShortage ? absDiff : 0, credit: isShortage ? 0 : absDiff },
                         { id: 2, coa: '1-10001', memo: `Penyesuaian Kas Kasir`, debit: isShortage ? 0 : absDiff, credit: isShortage ? absDiff : 0 }
                       ]
                     });
                  }}
                  className="w-full mt-2 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs uppercase flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99]"
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Posting Selisih</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCloseModalOpen(true)}
                className="w-full px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-xs uppercase flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-[0.99]"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{t.btnInput}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHIFTS RECONCILIATION HISTORY TABLE */}
      <div className={`rounded-xl shadow-sm overflow-hidden border transition-all duration-200 hover:-translate-y-0.5 ${
        isLight ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
      }`}>
        {/* Table Toolbar */}
        <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h4 className="font-medium text-base leading-6 text-slate-900 dark:text-white">
              {t.historyTitle}
            </h4>
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400 font-normal">
              {t.historySub}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-1.5 text-sm leading-5 font-normal pl-8 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10"
              />
            </div>

            {/* Filter Status Selisih */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs leading-5 transition cursor-pointer active:scale-[0.99] ${
                  statusFilter === 'ALL'
                    ? 'bg-cyan-600 text-white font-medium shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-normal'
                }`}
              >
                {t.filterAll} ({closedShiftsHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('MATCH')}
                className={`px-3 py-1.5 rounded-lg text-xs leading-5 transition cursor-pointer active:scale-[0.99] ${
                  statusFilter === 'MATCH'
                    ? 'bg-cyan-600 text-white font-medium shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-normal'
                }`}
              >
                {t.filterMatch}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('SURPLUS')}
                className={`px-3 py-1.5 rounded-lg text-xs leading-5 transition cursor-pointer active:scale-[0.99] ${
                  statusFilter === 'SURPLUS'
                    ? 'bg-cyan-600 text-white font-medium shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-normal'
                }`}
              >
                {t.filterSurplus}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('SHORTAGE')}
                className={`px-3 py-1.5 rounded-lg text-xs leading-5 transition cursor-pointer active:scale-[0.99] ${
                  statusFilter === 'SHORTAGE'
                    ? 'bg-cyan-600 text-white font-medium shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-normal'
                }`}
              >
                {t.filterShortage}
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 font-mono font-normal text-[11px] leading-4 uppercase tracking-widest">
              <tr>
                <th className="p-4">{t.colId}</th>
                <th className="p-4">{t.colCashier}</th>
                <th className="p-4 text-right">{t.colFloat}</th>
                <th className="p-4 text-right">{t.colSales}</th>
                <th className="p-4 text-right">{t.colSystem}</th>
                <th className="p-4 text-right">{t.colPhysical}</th>
                <th className="p-4 text-right">{t.colDiff}</th>
                <th className="p-4 text-center">{t.colStatus}</th>
                <th className="p-4 text-center">{t.colShiftStatus}</th>
                <th className="p-4 text-center">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-normal">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-16 text-center text-slate-400">
                    <Scale className="w-12 h-12 mx-auto opacity-10 mb-3" />
                    <p className="font-normal text-sm leading-5 uppercase tracking-widest">{t.noData}</p>
                    <p className="text-xs leading-5 mt-1 max-w-sm mx-auto opacity-60">
                      {t.noDataSub}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((shift, idx) => {
                  const diff = shift.difference ?? 0;
                  const isMatch = diff === 0;
                  const isSurplus = diff > 0;

                  const statusLabel = diff === 0 ? t.balanced : diff > 0 ? t.surplus : t.shortage;

                  return (
                    <tr
                      key={`${shift.id}-${idx}`}
                      className="bg-transparent text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* ID Shift & Waktu Tutup */}
                      <td className="p-4">
                        <div className="font-mono font-normal text-xs leading-5 text-cyan-600 group-hover:text-cyan-700 transition-colors">
                          #{shift.id}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {shift.endTime || shift.startTime}
                        </div>
                      </td>

                      {/* Kasir & Terminal */}
                      <td className="p-4">
                        <div className="font-normal text-sm leading-5 text-slate-900 dark:text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>{shift.cashierName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 font-mono uppercase">
                          <Monitor className="w-3 h-3 shrink-0" />
                          <span>{shift.terminalName}</span>
                        </div>
                      </td>

                      {/* Kas Awal (Opening Float) */}
                      <td className="p-4 text-right font-mono text-slate-500 dark:text-slate-400 text-xs leading-5 font-normal tabular-nums">
                        Rp {(shift.initialCash ?? 0).toLocaleString('id-ID')}
                      </td>

                      {/* Penjualan Tunai Sistem */}
                      <td className="p-4 text-right font-mono text-emerald-600 dark:text-emerald-400 text-xs leading-5 font-normal tabular-nums">
                        Rp {(shift.totalCashSales ?? 0).toLocaleString('id-ID')}
                      </td>

                      {/* Estimasi Kas Sistem */}
                      <td className="p-4 text-right font-mono text-slate-700 dark:text-slate-300 text-xs leading-5 font-normal tabular-nums">
                        Rp {(shift.expectedCashInDrawer ?? 0).toLocaleString('id-ID')}
                      </td>

                      {/* Kas Fisik Terhitung */}
                      <td className="p-4 text-right font-mono font-semibold text-lg leading-7 text-slate-900 dark:text-white tabular-nums">
                        Rp {(shift.actualCashInDrawer ?? shift.expectedCashInDrawer ?? 0).toLocaleString('id-ID')}
                      </td>

                      {/* Selisih */}
                      <td className="p-4 text-right font-mono font-semibold text-lg leading-7">
                        <span
                          className={
                            isMatch
                              ? 'text-slate-400'
                              : isSurplus
                              ? 'text-blue-600'
                              : 'text-rose-600 animate-pulse'
                          }
                        >
                          {diff > 0
                            ? `+Rp ${diff.toLocaleString('id-ID')}`
                            : isMatch
                            ? 'Rp 0'
                            : `-Rp ${Math.abs(diff).toLocaleString('id-ID')}`}
                        </span>
                      </td>

                      {/* Status Rekonsiliasi */}
                      <td className="p-4 text-center">
                        {diff === 0 ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-normal uppercase border bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                            KLOP
                          </span>
                        ) : Math.abs(diff) > 5000 ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-normal uppercase border bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse">
                              SELISIH KAS
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const isShortage = diff < 0;
                                const absDiff = Math.abs(diff);
                                openJournalVoucher({
                                  date: new Date().toISOString().slice(0, 10),
                                  type: 'Adjustment',
                                  memo: `Jurnal Selisih Kas Shift #${shift.id} - ${isShortage ? 'Kurang' : 'Lebih'}`,
                                  lines: [
                                    { id: 1, coa: '5-10004', memo: `Selisih Kas ${isShortage ? 'Kurang' : 'Lebih'}`, debit: isShortage ? absDiff : 0, credit: isShortage ? 0 : absDiff },
                                    { id: 2, coa: '1-10001', memo: `Penyesuaian Kas Kasir`, debit: isShortage ? 0 : absDiff, credit: isShortage ? absDiff : 0 }
                                  ]
                                });
                              }}
                              className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-medium transition cursor-pointer shadow-xs active:scale-[0.99]"
                            >
                              Buat Jurnal Selisih Kas
                            </button>
                          </div>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-normal uppercase border bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30">
                            SELISIH KAS
                          </span>
                        )}
                      </td>

                      {/* Status Shift: CLOSED */}
                      <td className="p-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-normal bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {shift.status}
                        </span>
                      </td>

                      {/* Action: View & Print Receipt */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedShiftForReceipt(shift)}
                          className="p-1.5 rounded-lg border bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 shadow-sm transition cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium group/btn active:scale-[0.99]"
                          title={isEn ? "View Receipt" : "Lihat Struk"}
                        >
                          <Receipt className="w-3.5 h-3.5 text-cyan-500 group-hover/btn:text-cyan-600 transition-colors" />
                          <span>{t.btnReceipt}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Penutupan Shift */}
      <CloseShiftModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onShiftClosed={(closedShift) => {
          setIsCloseModalOpen(false);
          setSelectedShiftForReceipt(closedShift);
          showToast(isEn ? `Shift #${closedShift.id} ${t.toastSuccess}` : `Shift #${closedShift.id} ${t.toastSuccess}`);
        }}
        isLight={isLight}
      />

      {/* Mini Summary Receipt Modal */}
      {selectedShiftForReceipt && (
        <ShiftSummaryReceiptModal
          shift={selectedShiftForReceipt}
          onClose={() => setSelectedShiftForReceipt(null)}
          isLight={isLight}
        />
      )}
    </div>
  );
};
