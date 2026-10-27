import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale, SalesReturn } from '../../types';
import {
  FileText,
  Search,
  Filter,
  X,
  Receipt,
  RotateCcw,
  CheckCircle2,
  Clock,
  User,
  Monitor,
  AlertTriangle,
  ArrowRight,
  Package,
  Calendar,
  Sparkles,
  TrendingUp,
  Printer,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface SalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReturnModal: (sale: Sale) => void;
  isLight?: boolean;
}

export const SalesHistoryModal: React.FC<SalesHistoryModalProps> = ({
  isOpen,
  onClose,
  onOpenReturnModal,
  isLight = false,
}) => {
  const { sales, salesReturns, showReceipt, language } = useApp();
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState<'invoices' | 'returns'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'Partially Returned' | 'Returned'>('ALL');
  const [selectedReturnDetail, setSelectedReturnDetail] = useState<SalesReturn | null>(null);

  if (!isOpen) return null;

  // Filter Sales Invoices
  const filteredSales = useMemo(() => {
    return (sales || []).filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.transaction_id.toLowerCase().includes(q) ||
        (s.receipt_number && s.receipt_number.toLowerCase().includes(q)) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
        (s.customer_phone && s.customer_phone.includes(q)) ||
        s.terminal_name.toLowerCase().includes(q) ||
        (s.cashier_name && s.cashier_name.toLowerCase().includes(q)) ||
        (s.items_summary && s.items_summary.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PAID') {
          if (s.status !== 'PAID' && s.status !== 'COMPLETED') return false;
        } else if (s.status !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [sales, searchQuery, statusFilter]);

  // Filter Sales Returns
  const filteredReturns = useMemo(() => {
    return (salesReturns || []).filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.transactionId.toLowerCase().includes(q) ||
        (r.receiptNumber && r.receiptNumber.toLowerCase().includes(q)) ||
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        r.cashierName.toLowerCase().includes(q) ||
        r.terminalName.toLowerCase().includes(q)
      );
    });
  }, [salesReturns, searchQuery]);

  // Statistics
  const totalSalesCount = (sales || []).length;
  const returnedSalesCount = (sales || []).filter(
    (s) => s.status === 'Partially Returned' || s.status === 'Returned'
  ).length;
  const totalRefundAccumulated = (salesReturns || []).reduce(
    (acc, r) => acc + r.totalRefundAmount,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`w-full max-w-5xl rounded-3xl p-5 sm:p-7 shadow-2xl relative border my-6 flex flex-col max-h-[92vh] ${
          isLight
            ? 'bg-white border-slate-300 text-slate-800'
            : 'bg-[#161b22] border-[#30363d] text-gray-100 shadow-[0_0_50px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-700/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-[#0052FF] dark:text-[#58a6ff] flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(0,82,255,0.3)]">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-[#0052FF] dark:text-[#58a6ff] border border-blue-500/30 uppercase tracking-wider">
                  {isEn ? 'POS & Return History' : 'Riwayat POS & Retur'}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {totalSalesCount} {isEn ? 'Recorded Transactions' : 'Transaksi Terdata'}
                </span>
              </div>
              <h2
                className={`text-xl font-black tracking-tight mt-0.5 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {isEn ? 'Transaction & Sales Return History (APS POS4: 28_SalesReturn)' : 'Riwayat Transaksi & Retur Penjualan (APS POS4: 28_ReturPenjualan)'}
              </h2>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <div>
                <span className="text-[10px] text-gray-400 block">{isEn ? 'Returned Invoices:' : 'Nota Diretur:'}</span>
                <span className="font-bold font-mono text-amber-400">
                  {returnedSalesCount} {isEn ? 'Transactions' : 'Transaksi'}
                </span>
              </div>
            </div>

            <div
              className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <div>
                <span className="text-[10px] text-gray-400 block">{isEn ? 'Total Refund:' : 'Total Refund:'}</span>
                <span className="font-bold font-mono text-rose-400">
                  Rp {totalRefundAccumulated.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 shrink-0">
          {/* Tab Invoices vs Returns */}
          <div
            className={`flex items-center p-1 rounded-xl border self-start ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'invoices'
                  ? 'bg-[#0052FF] text-white shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isEn ? `Sales Invoices List (${filteredSales.length})` : `Daftar Nota Penjualan (${filteredSales.length})`}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('returns')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'returns'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isEn ? `Customer Return History (${salesReturns?.length || 0})` : `Riwayat Retur Pelanggan (${salesReturns?.length || 0})`}</span>
            </button>
          </div>

          {/* Search Input & Status Filter */}
          <div className="flex items-center gap-2 flex-1 max-w-lg justify-end">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  activeTab === 'invoices'
                    ? (isEn ? 'Search Invoice No, Customer, Cashier, SKU...' : 'Cari No. Nota, Pelanggan, Kasir, SKU...')
                    : (isEn ? 'Search Return ID, Invoice, Cashier...' : 'Cari ID Retur, Nota, Kasir...')
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs pl-8 pr-7 py-2 rounded-xl outline-none font-medium border transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF]'
                    : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {activeTab === 'invoices' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition shrink-0 ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800'
                    : 'bg-[#0d1117] border-[#30363d] text-gray-200'
                }`}
              >
                <option value="ALL">{isEn ? 'All Status' : 'Semua Status'}</option>
                <option value="PAID">{isEn ? 'Paid' : 'Lunas (Paid)'}</option>
                <option value="Partially Returned">{isEn ? 'Partially Returned' : 'Sebagian Diretur'}</option>
                <option value="Returned">{isEn ? 'Fully Returned' : 'Diretur Penuh'}</option>
              </select>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'invoices' ? (
            /* TAB 1: DAFTAR NOTA PENJUALAN */
            filteredSales.length === 0 ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center">
                <Receipt className="w-12 h-12 text-gray-600 mb-2" />
                <p className="font-bold text-sm">{isEn ? 'No sales transactions found matching criteria' : 'Tidak ada transaksi penjualan yang sesuai'}</p>
                <p className="text-xs text-gray-500 mt-1">{isEn ? 'Try changing the search keyword or status filter.' : 'Coba ubah kata kunci pencarian atau filter status.'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr
                      className={`border-b text-[11px] uppercase tracking-wider ${
                        isLight
                          ? 'border-slate-200 text-slate-500 bg-slate-50'
                          : 'border-slate-800 text-gray-400 bg-[#0d1117]'
                      }`}
                    >
                      <th className="py-3 px-3">{isEn ? 'Invoice No & Time' : 'No. Nota & Waktu'}</th>
                      <th className="py-3 px-3">{isEn ? 'Terminal / Cashier' : 'Terminal / Kasir'}</th>
                      <th className="py-3 px-3">{isEn ? 'Customer' : 'Pelanggan'}</th>
                      <th className="py-3 px-3">{isEn ? 'Items Summary' : 'Ringkasan Item'}</th>
                      <th className="py-3 px-3 text-right">{isEn ? 'Total Amount' : 'Total Transaksi'}</th>
                      <th className="py-3 px-3 text-center">{isEn ? 'Status' : 'Status'}</th>
                      <th className="py-3 px-3 text-center">{isEn ? 'Action' : 'Aksi'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredSales.map((sale) => {
                      const isReturnedFull = sale.status === 'Returned';
                      const isPartiallyReturned = sale.status === 'Partially Returned';
                      const hasItems = sale.items && sale.items.length > 0;

                      return (
                        <tr
                          key={sale.transaction_id}
                          className={`transition ${
                            isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1f242c]'
                          }`}
                        >
                          {/* Nota & Waktu */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-slate-800 dark:text-white block">
                              {sale.receipt_number || sale.transaction_id}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-gray-500" />
                              {sale.created_at || sale.date}
                            </span>
                          </td>

                          {/* Terminal & Kasir */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 dark:text-white block">
                                {sale.terminal_name}
                              </span>
                              {(sale.businessType || sale.business_type) && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase">
                                  {sale.businessType || sale.business_type}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 block">
                              {isEn ? 'Cashier:' : 'Kasir:'} {sale.cashier_name || sale.cashier_id} {sale.terminalId || sale.terminal_id ? `• ${sale.terminalId || sale.terminal_id}` : ''}
                            </span>
                          </td>

                          {/* Pelanggan */}
                          <td className="py-3 px-3">
                            <span className="font-bold text-sky-400 block truncate max-w-[150px]">
                              {sale.customer_name || (isEn ? 'General Customer' : 'Pelanggan Umum')}
                            </span>
                            {sale.customer_phone && (
                              <span className="text-[10px] text-gray-400 font-mono block">
                                {sale.customer_phone}
                              </span>
                            )}
                          </td>

                          {/* Ringkasan Item */}
                          <td className="py-3 px-3 max-w-[200px]">
                            <span className="line-clamp-2 text-gray-300 text-[11px]">
                              {sale.items_summary ||
                                (sale.items || [])
                                  .map((it) => `${it.product.name} (${it.quantity})`)
                                  .join(', ')}
                            </span>
                            {sale.sales_returns && sale.sales_returns.length > 0 && (
                              <span className="text-[10px] text-amber-400 font-mono font-semibold block mt-0.5">
                                • {sale.sales_returns.length}x {isEn ? 'Return Processed' : 'Retur Diproses'} (Refund Rp{' '}
                                {(sale.returned_amount || 0).toLocaleString('id-ID')})
                              </span>
                            )}
                          </td>

                          {/* Total Belanja */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span className="font-mono font-black text-slate-900 dark:text-white block">
                              Rp {sale.total_amount.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {sale.payment_method}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {isReturnedFull ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-rose-500/15 text-rose-300 border-rose-500/30">
                                {isEn ? 'Fully Returned' : 'Diretur Penuh'}
                              </span>
                            ) : isPartiallyReturned ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-amber-500/15 text-amber-300 border-amber-500/30">
                                {isEn ? 'Partially Returned' : 'Sebagian Diretur'}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                                {isEn ? (sale.status === 'COMPLETED' ? 'Completed' : 'Paid') : (sale.status === 'COMPLETED' ? 'Selesai (Completed)' : 'Lunas (Paid)')}
                              </span>
                            )}
                          </td>

                          {/* Tombol Aksi */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Cetak Struk */}
                              <button
                                type="button"
                                onClick={() => showReceipt(sale)}
                                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                  isLight
                                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                                    : 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] text-gray-300'
                                }`}
                                title={isEn ? 'View Receipt / Invoice Copy' : 'Lihat Struk / Salinan Nota'}
                              >
                                <Printer className="w-3.5 h-3.5 text-blue-400" />
                                <span className="hidden sm:inline">{isEn ? 'Receipt' : 'Struk'}</span>
                              </button>

                              {/* [Retur Barang] Button */}
                              <button
                                id={`btn-retur-sale-${sale.transaction_id}`}
                                type="button"
                                disabled={isReturnedFull || !hasItems}
                                onClick={() => onOpenReturnModal(sale)}
                                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                  isReturnedFull
                                    ? 'opacity-40 cursor-not-allowed border-gray-700 text-gray-500'
                                    : isLight
                                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                                    : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                                }`}
                                title={
                                  isReturnedFull
                                    ? (isEn ? 'This transaction is already fully returned' : 'Transaksi ini sudah diretur habis')
                                    : (isEn ? 'Process Customer Return (APS POS4: 28_SalesReturn)' : 'Proses Retur Barang Konsumen (APS POS4: 28_ReturPenjualan)')
                                }
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                                <span>{isEn ? 'Return Items' : 'Retur Barang'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* TAB 2: RIWAYAT RETUR PENJUALAN */
            filteredReturns.length === 0 ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center">
                <RotateCcw className="w-12 h-12 text-gray-600 mb-2" />
                <p className="font-bold text-sm">{isEn ? 'No customer return history yet' : 'Belum ada riwayat retur penjualan'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {isEn ? 'Items returned through the cashier will be logged in detail here.' : 'Retur barang yang diproses oleh kasir akan tercatat secara detail di sini.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReturns.map((ret) => (
                  <div
                    key={ret.id}
                    className={`p-4 rounded-2xl border transition ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-700/40">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400 text-sm">{ret.id}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono">
                            {isEn ? 'Invoice Ref:' : 'Ref Nota:'} {ret.receiptNumber || ret.transactionId}
                          </span>
                          <span className="text-[10px] text-gray-400">• {ret.timestamp}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                          <span>
                            {isEn ? 'Staff:' : 'Petugas:'} <strong className="text-gray-200">{ret.cashierName}</strong> (
                            {ret.terminalName})
                          </span>
                          <span>•</span>
                          <span>
                            {isEn ? 'Customer:' : 'Pelanggan:'} <strong className="text-sky-400">{ret.customerName}</strong>
                          </span>
                          {ret.shiftId && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-emerald-400">Shift: #{ret.shiftId}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block font-medium">
                          {isEn ? 'Refund Value' : 'Nilai Refund'} ({ret.refundMethod})
                        </span>
                        <span className="font-mono font-black text-rose-400 text-base">
                          -Rp {ret.totalRefundAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Rincian Item yang Diretur */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-gray-400 block">
                        {isEn ? 'Returned Items Breakdown:' : 'Rincian Item yang Dikembalikan:'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ret.items.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-slate-800 dark:text-white truncate">
                                {item.productName}
                              </div>
                              <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                                <span>Qty: {item.returnQty} Unit</span>
                                <span>•</span>
                                <span>{isEn ? 'Reason:' : 'Alasan:'} {item.reason}</span>
                              </div>
                            </div>

                            <div className="text-right shrink-0 ml-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border block mb-0.5 ${
                                  item.condition === 'GOOD'
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                }`}
                              >
                                {item.condition === 'GOOD' ? (isEn ? 'Warehouse Restock' : 'Restock Gudang') : (isEn ? 'Bad Stock (Quarantine)' : 'Bad Stock (Karantina)')}
                              </span>
                              <span className="font-mono font-bold text-emerald-400 text-[11px]">
                                Rp {item.subtotalRefund.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {ret.notes && (
                      <div className="mt-2.5 text-[11px] text-gray-400 italic">
                        {isEn ? 'Notes:' : 'Catatan:'} "{ret.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
