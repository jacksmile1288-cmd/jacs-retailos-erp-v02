import React, { useState } from 'react';
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
  const { activeShift, shiftsHistory, activeUser, showToast } = useApp();

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedShiftForReceipt, setSelectedShiftForReceipt] = useState<CashierShift | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MATCH' | 'SURPLUS' | 'SHORTAGE'>('ALL');

  // Summary statistics from shiftsHistory
  const totalSettledCash = shiftsHistory.reduce(
    (acc, s) => acc + (s.actualCashInDrawer ?? s.expectedCashInDrawer ?? 0),
    0
  );
  const totalNetDifference = shiftsHistory.reduce(
    (acc, s) => acc + (s.difference ?? 0),
    0
  );
  const balancedShiftsCount = shiftsHistory.filter(
    (s) => (s.difference ?? 0) === 0
  ).length;

  const filteredHistory = shiftsHistory.filter((s) => {
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

  return (
    <div id="tab-cash-reconciliation" className="space-y-6">
      {/* Header Banner */}
      <div
        className={`p-5 rounded-2xl border transition duration-200 ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold mb-2">
              <Scale className="w-3.5 h-3.5" />
              <span>Cash Drawer Settlement • Rekonsiliasi Kasir & Tutup Shift</span>
            </div>
            <h3
              className={`text-lg sm:text-xl font-black tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Rekonsiliasi Kas Akhir Shift (Cash Drawer Closing)
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#8b949e]">
              Bandingkan fisik uang laci (kertas & koin) dengan Kas Awal + Penjualan Tunai Sistem, cetak Z-Report, dan audit otomatis Finance.
            </p>
          </div>

          {/* Quick Action Button for Active Shift */}
          {activeShift ? (
            <button
              type="button"
              id="btn-finance-open-close-shift"
              onClick={() => setIsCloseModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-blue-500/25 transition cursor-pointer active:scale-95"
            >
              <Clock className="w-4 h-4" />
              <span>Tutup Shift & Rekonsiliasi Kasir ({activeShift.terminalName})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0d1117] border border-slate-300 dark:border-[#30363d] text-xs text-slate-600 dark:text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold">Semua shift kasir saat ini tertutup (Status: CLOSED)</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Active Cash Drawer Status */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
              Shift Kasir Aktif
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeShift
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40'
                  : 'bg-slate-200 text-slate-700 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {activeShift ? 'SEDANG BUKA' : 'SEMUA CLOSED'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {activeShift
                ? `Rp ${activeShift.expectedCashInDrawer.toLocaleString('id-ID')}`
                : 'Rp 0'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5 truncate">
              {activeShift
                ? `${activeShift.terminalName} • Kasir: ${activeShift.cashierName}`
                : 'Tidak ada kas laci yang belum disetor'}
            </div>
          </div>
        </div>

        {/* Total Setoran Kas CLOSED */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
              Total Kas Disetor (CLOSED)
            </span>
            <Wallet className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              Rp {totalSettledCash.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
              Dari {shiftsHistory.length} sesi shift kasir tertutup
            </div>
          </div>
        </div>

        {/* Akumulasi Selisih Kasir */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
              Net Selisih Rekonsiliasi
            </span>
            <Scale className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-3">
            <div
              className={`text-xl font-black font-mono ${
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
                ? 'Rp 0 (Seimbang)'
                : `-Rp ${Math.abs(totalNetDifference).toLocaleString('id-ID')}`}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
              {totalNetDifference === 0
                ? 'Keseimbangan kasir 100% sempurna'
                : totalNetDifference > 0
                ? 'Akumulasi kasir lebih (surplus)'
                : 'Akumulasi kasir kurang (shortage)'}
            </div>
          </div>
        </div>

        {/* Tingkat Akurasi Shift Seimbang */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
              Akurasi Shift Seimbang
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {shiftsHistory.length > 0
                ? `${Math.round((balancedShiftsCount / shiftsHistory.length) * 100)}%`
                : '100%'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
              {balancedShiftsCount} dari {shiftsHistory.length} shift berstatus Seimbang
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE SHIFT LIVE PANEL (IF CURRENTLY ACTIVE) */}
      {activeShift && (
        <div
          className={`p-5 rounded-2xl border relative overflow-hidden transition ${
            isLight
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
              : 'bg-[#161b22] border-blue-500/40 shadow-lg'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Shift Kasir Sedang Berjalan (Memerlukan Rekonsiliasi Tutup Shift)
                </span>
              </div>
              <h4
                className={`text-base font-black ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {activeShift.terminalName} • Operator Kasir: {activeShift.cashierName}
              </h4>
              <p className="text-xs text-slate-600 dark:text-gray-400">
                Waktu Buka: <span className="font-mono font-semibold">{activeShift.startTime}</span> • Transaksi Terproses:{' '}
                <span className="font-bold">{activeShift.totalTransactionsCount} struk</span>
              </p>
            </div>

            {/* Formula Breakdown Pill */}
            <div
              className={`p-3 rounded-xl border flex flex-wrap items-center gap-3 text-xs ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-[#0d1117] border-[#30363d] text-gray-200'
              }`}
            >
              <div>
                <span className="text-[10px] text-slate-500 dark:text-gray-400 block font-semibold">
                  Kas Awal (Float)
                </span>
                <span className="font-mono font-bold">
                  Rp {activeShift.initialCash.toLocaleString('id-ID')}
                </span>
              </div>
              <span className="text-slate-400 font-bold">+</span>
              <div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                  Penjualan Tunai
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Rp {activeShift.totalCashSales.toLocaleString('id-ID')}
                </span>
              </div>
              {activeShift.totalExpenses > 0 && (
                <>
                  <span className="text-slate-400 font-bold">-</span>
                  <div>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-semibold">
                      Kas Keluar
                    </span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      Rp {activeShift.totalExpenses.toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              )}
              <span className="text-slate-400 font-bold">=</span>
              <div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-bold">
                  Estimasi Kas Sistem
                </span>
                <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                  Rp {activeShift.expectedCashInDrawer.toLocaleString('id-ID')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsCloseModalOpen(true)}
                className="ml-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Input Uang Fisik & Tutup Shift</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHIFTS RECONCILIATION HISTORY TABLE */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-lg transition duration-200 ${
          isLight
            ? 'bg-white border-slate-200'
            : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        {/* Table Toolbar */}
        <div
          className={`p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
          }`}
        >
          <div>
            <h4
              className={`font-black text-sm ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Riwayat Rekonsiliasi Kas Akhir Shift (Shift Settlement Ledger)
            </h4>
            <p className="text-xs text-slate-600 dark:text-[#8b949e]">
              Daftar sesi kasir berstatus CLOSED lengkap dengan perbandingan kas awal, sistem, kas fisik, dan audit selisih.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search
                className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                  isLight ? 'text-slate-400' : 'text-gray-400'
                }`}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kasir / terminal / catatan..."
                className={`pl-8 pr-3 py-1.5 rounded-xl text-xs font-semibold border outline-none transition ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                    : 'bg-[#161b22] border-[#30363d] text-white placeholder-slate-500 focus:border-blue-500'
                }`}
              />
            </div>

            {/* Filter Status Selisih */}
            <div className="flex items-center gap-1 bg-slate-200 dark:bg-[#161b22] p-0.5 rounded-xl border border-slate-300 dark:border-[#30363d] text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua ({shiftsHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('MATCH')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  statusFilter === 'MATCH'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-gray-400 hover:text-emerald-500'
                }`}
              >
                Seimbang ({balancedShiftsCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('SURPLUS')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  statusFilter === 'SURPLUS'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-gray-400 hover:text-sky-500'
                }`}
              >
                Lebih (Surplus)
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('SHORTAGE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  statusFilter === 'SHORTAGE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-gray-400 hover:text-rose-500'
                }`}
              >
                Kurang (Shortage)
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-[#0d1117] text-gray-400 border-[#30363d]'
                }`}
              >
                <th className="p-3">ID Shift & Waktu Tutup</th>
                <th className="p-3">Kasir & Terminal</th>
                <th className="p-3 text-right">Kas Awal (Float)</th>
                <th className="p-3 text-right">Penjualan Tunai</th>
                <th className="p-3 text-right">Estimasi Sistem</th>
                <th className="p-3 text-right">Kas Fisik Terhitung</th>
                <th className="p-3 text-right">Selisih</th>
                <th className="p-3 text-center">Status Rekonsiliasi</th>
                <th className="p-3 text-center">Status Shift</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isLight ? 'divide-slate-200' : 'divide-[#30363d]'
              }`}
            >
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-500 dark:text-gray-400">
                    <Scale className="w-10 h-10 mx-auto opacity-30 mb-2" />
                    <p className="font-bold text-sm">Belum ada data rekonsiliasi tutup shift yang cocok</p>
                    <p className="text-xs">
                      Saat kasir melakukan tutup shift (Cash Drawer Closing), data rekonsiliasi otomatis tercatat di sini.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((shift) => {
                  const diff = shift.difference ?? 0;
                  const isMatch = diff === 0;
                  const isSurplus = diff > 0;

                  const statusText: 'Seimbang' | 'Lebih (Surplus)' | 'Kurang (Shortage)' =
                    diff === 0 ? 'Seimbang' : diff > 0 ? 'Lebih (Surplus)' : 'Kurang (Shortage)';

                  return (
                    <tr
                      key={shift.id}
                      className={`transition ${
                        isLight
                          ? 'hover:bg-slate-50 text-slate-900'
                          : 'hover:bg-[#21262d] text-gray-200'
                      }`}
                    >
                      {/* ID Shift & Waktu Tutup */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          #{shift.id}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-gray-400 font-mono mt-0.5">
                          {shift.endTime || shift.startTime}
                        </div>
                      </td>

                      {/* Kasir & Terminal */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{shift.cashierName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 font-mono">
                          <Monitor className="w-3 h-3 shrink-0" />
                          <span>{shift.terminalName}</span>
                        </div>
                      </td>

                      {/* Kas Awal (Opening Float) */}
                      <td className="p-3 text-right font-mono font-medium">
                        Rp {shift.initialCash.toLocaleString('id-ID')}
                      </td>

                      {/* Penjualan Tunai Sistem */}
                      <td className="p-3 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        Rp {shift.totalCashSales.toLocaleString('id-ID')}
                      </td>

                      {/* Estimasi Kas Sistem */}
                      <td className="p-3 text-right font-mono font-bold">
                        Rp {shift.expectedCashInDrawer.toLocaleString('id-ID')}
                      </td>

                      {/* Kas Fisik Terhitung */}
                      <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white">
                        Rp {(shift.actualCashInDrawer ?? shift.expectedCashInDrawer).toLocaleString('id-ID')}
                      </td>

                      {/* Selisih */}
                      <td className="p-3 text-right font-mono font-black">
                        <span
                          className={
                            isMatch
                              ? 'text-slate-600 dark:text-gray-400'
                              : isSurplus
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {diff > 0
                            ? `+Rp ${diff.toLocaleString('id-ID')}`
                            : isMatch
                            ? 'Rp 0'
                            : `-Rp ${Math.abs(diff).toLocaleString('id-ID')}`}
                        </span>
                      </td>

                      {/* Status Rekonsiliasi ('Seimbang', 'Lebih (Surplus)', atau 'Kurang (Shortage)') */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono ${
                            isMatch
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                              : isSurplus
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40'
                          }`}
                        >
                          {statusText}
                        </span>
                      </td>

                      {/* Status Shift: CLOSED */}
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
                          {shift.status}
                        </span>
                      </td>

                      {/* Action: View & Print Receipt */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedShiftForReceipt(shift)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer inline-flex items-center gap-1 text-xs font-bold ${
                            isLight
                              ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                              : 'bg-[#0d1117] hover:bg-[#21262d] text-gray-300 border-[#30363d]'
                          }`}
                          title="Lihat / Cetak Struk Rekonsiliasi Z-Report"
                        >
                          <Receipt className="w-3.5 h-3.5 text-blue-500" />
                          <span className="hidden sm:inline">Struk</span>
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
          showToast(`Shift #${closedShift.id} berhasil ditutup & status rekonsiliasi tersimpan!`);
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
