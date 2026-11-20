import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale, SalesReturn } from '../../types';
import { SalesReturnModal } from './SalesReturnModal';
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
  Trash2,
  Ban,
} from 'lucide-react';

interface SalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
}

export const SalesHistoryModal: React.FC<SalesHistoryModalProps> = ({
  isOpen,
  onClose,
  isLight = false,
}) => {
  const { sales, salesReturns, showReceipt, language, handleSalesReturn, voidItemLogs, clearVoidItemLogs } = useApp();
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState<'invoices' | 'returns' | 'void-logs'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'Partially Returned' | 'Returned'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'CUSTOM'>('TODAY');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedReturnDetail, setSelectedReturnDetail] = useState<SalesReturn | null>(null);

  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<any | null>(null);

  const formatTimeShort = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const getDayBadge = (dateStr: string) => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleDateString('en-CA');
    
    const targetDate = new Date(dateStr);
    const targetDateStr = targetDate.toLocaleDateString('en-CA');
    
    if (targetDateStr === todayStr) {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-tighter">HARI INI</span>;
    }
    if (targetDateStr === yesterdayStr) {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase tracking-tighter">KEMARIN</span>;
    }
    
    const dayName = targetDate.toLocaleDateString('id-ID', { weekday: 'short' }).toUpperCase();
    const formattedDate = targetDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
    return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-500/15 text-gray-400 border border-slate-500/30 uppercase tracking-tighter">{dayName}, {formattedDate}</span>;
  };

  const getFilteredLogs = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleDateString('en-CA');

    return (voidItemLogs || []).filter((log) => {
      // Normalisasi tanggal log ke YYYY-MM-DD lokal
      const logDateStr = new Date(log.timestamp).toLocaleDateString('en-CA');
      
      let matchesDate = true;
      if (dateFilter === 'TODAY') {
        matchesDate = logDateStr === todayStr;
      } else if (dateFilter === 'YESTERDAY') {
        matchesDate = logDateStr === yesterdayStr;
      } else if (dateFilter === 'CUSTOM') {
        matchesDate = logDateStr === customDate;
      } else if (dateFilter === 'ALL') {
        matchesDate = true;
      }

      if (!matchesDate) return false;

      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        log.sku.toLowerCase().includes(q) ||
        log.productName.toLowerCase().includes(q) ||
        log.cashierId.toLowerCase().includes(q)
      );
    });
  }, [voidItemLogs, dateFilter, customDate, searchQuery]);

  // Filter Sales Invoices
  const filteredSales = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleDateString('en-CA');

    return (sales || []).filter((s) => {
      // Date Filter
      const saleDateStr = new Date(s.created_at || s.date).toLocaleDateString('en-CA');
      let matchesDate = true;
      if (dateFilter === 'TODAY') matchesDate = saleDateStr === todayStr;
      else if (dateFilter === 'YESTERDAY') matchesDate = saleDateStr === yesterdayStr;
      else if (dateFilter === 'CUSTOM') matchesDate = saleDateStr === customDate;
      else if (dateFilter === 'ALL') matchesDate = true;
      
      if (!matchesDate) return false;

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
  }, [sales, searchQuery, statusFilter, dateFilter, customDate]);

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
  const returnedInvoicesCount = salesReturns?.length || 0;
  const totalRefundAccumulated = (salesReturns || []).reduce(
    (acc, r) => acc + r.totalRefundAmount,
    0
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`w-full max-w-7xl rounded-3xl p-5 sm:p-7 relative border my-6 flex flex-col max-h-[92vh] transition-all ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-800'
            : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-gray-100'
        }`}
      >
        {/* Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-700/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                  {isEn ? 'POS & Return History' : 'Riwayat POS & Retur'}
                </span>
                <span className="text-xs text-gray-400 font-mono font-normal">
                  {totalSalesCount} {isEn ? 'Recorded Transactions' : 'Transaksi Terdata'}
                </span>
              </div>
              <h2
                className={`text-base sm:text-lg font-medium tracking-tight mt-0.5 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {isEn ? 'Sales & Return History' : 'Riwayat Transaksi & Retur Penjualan'}
              </h2>
            </div>
          </div>

          {/* Quick Metrics & Close Button */}
          <div className="flex items-center gap-4 self-stretch sm:self-auto">
            <div className="flex items-center gap-2">
              <div
                className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 transition-colors ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div>
                  <span className="text-[10px] text-gray-400 block font-normal">{isEn ? 'Returned Invoices:' : 'Nota Diretur:'}</span>
                  <span className="font-semibold font-mono text-amber-500 dark:text-amber-400">
                    {returnedInvoicesCount} {isEn ? 'Transactions' : 'Transaksi'}
                  </span>
                </div>
              </div>

              <div
                className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 transition-colors ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div>
                  <span className="text-[10px] text-gray-400 block font-normal">{isEn ? 'Total Refund:' : 'Total Refund:'}</span>
                  <span className="font-semibold font-mono text-rose-500 dark:text-rose-400">
                    Rp {totalRefundAccumulated.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Close Button (X) */}
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition cursor-pointer shrink-0 active:scale-[0.99] ${
                isLight 
                  ? 'bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-200' 
                  : 'bg-[#0d1117] text-gray-400 hover:text-white hover:bg-[#21262d] border border-[#30363d]'
              }`}
              title={isEn ? 'Close' : 'Tutup'}
            >
              <X className="w-5 h-5" />
            </button>
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-normal transition cursor-pointer flex items-center gap-2 active:scale-[0.99] ${
                activeTab === 'invoices'
                  ? 'bg-[#0052FF] text-white shadow-xs font-medium'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Daftar Faktur Penjualan ({filteredSales.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('returns')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-normal transition cursor-pointer flex items-center gap-2 active:scale-[0.99] ${
                activeTab === 'returns'
                  ? 'bg-amber-500 text-slate-950 font-medium shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Riwayat Retur Pelanggan ({salesReturns?.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('void-logs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-normal transition cursor-pointer flex items-center gap-2 active:scale-[0.99] ${
                activeTab === 'void-logs'
                  ? 'bg-rose-600 text-white font-medium shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Log Batal Item ({voidItemLogs?.length || 0})</span>
            </button>
          </div>

          {/* Quick Filter Hari & Search Input & Status Filter */}
          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl justify-end">
            <div className="flex items-center bg-black/30 rounded-lg p-0.5 border border-slate-700 shrink-0">
              <button
                onClick={() => setDateFilter('ALL')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-normal transition cursor-pointer active:scale-[0.99] ${
                  dateFilter === 'ALL' ? 'bg-[#0052FF] text-white shadow-sm font-medium' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setDateFilter('TODAY')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-normal transition cursor-pointer active:scale-[0.99] ${
                  dateFilter === 'TODAY' ? 'bg-[#0052FF] text-white shadow-sm font-medium' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setDateFilter('YESTERDAY')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-normal transition cursor-pointer active:scale-[0.99] ${
                  dateFilter === 'YESTERDAY' ? 'bg-[#0052FF] text-white shadow-sm font-medium' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Kemarin
              </button>
              <button
                onClick={() => setDateFilter('CUSTOM')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-normal transition cursor-pointer active:scale-[0.99] ${
                  dateFilter === 'CUSTOM' ? 'bg-[#0052FF] text-white shadow-sm font-medium' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Pilih Tanggal
              </button>
            </div>
            {dateFilter === 'CUSTOM' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className={`bg-[#0d1117] border border-[#30363d] text-white text-[10px] px-2 py-1.5 rounded-lg outline-none shrink-0 ${isLight ? 'bg-white border-slate-300 text-slate-800' : ''}`}
              />
            )}
            <div className="relative flex-1 min-w-[150px]">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  activeTab === 'invoices'
                    ? (isEn ? 'Search Invoice No, Customer, Cashier, SKU...' : 'Cari No. Nota, Pelanggan, Kasir, SKU...')
                    : activeTab === 'returns'
                    ? (isEn ? 'Search Return ID, Invoice, Cashier...' : 'Cari ID Retur, Nota, Kasir...')
                    : (isEn ? 'Search SKU, Product Name, Cashier...' : 'Cari SKU, Nama Barang, Kasir...')
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs pl-8 pr-7 py-2 rounded-xl outline-none font-normal placeholder:italic border transition ${
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
                className={`px-3 py-2 rounded-xl border text-xs font-normal outline-none transition shrink-0 ${
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
                      className={`border-b text-[11px] uppercase tracking-widest font-mono font-normal ${
                        isLight
                          ? 'border-slate-200 text-slate-500 bg-slate-50'
                          : 'border-slate-800 text-gray-400 bg-[#0d1117]'
                      }`}
                    >
                      <th className="py-2.5 px-3">{isEn ? 'Invoice No & Time' : 'NO FAKTUR & WAKTU'}</th>
                      <th className="py-2.5 px-3">{isEn ? 'Terminal / Cashier' : 'TERMINAL / KASIR'}</th>
                      <th className="py-2.5 px-3">{isEn ? 'Customer' : 'PELANGGAN'}</th>
                      <th className="py-2.5 px-3">{isEn ? 'Items Summary' : 'RINGKASAN BARANG'}</th>
                      <th className="py-2.5 px-3 text-right">{isEn ? 'Total' : 'TOTAL'}</th>
                      <th className="py-2.5 px-3 text-center">{isEn ? 'Status' : 'STATUS'}</th>
                      <th className="py-2.5 px-3 text-center w-32">{isEn ? 'Action' : 'AKSI'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredSales.map((sale, idx) => {
                      const isVoided = sale.status === 'VOID' || sale.status === 'VOIDED' || sale.status === 'CANCELLED' || (sale as any).is_void === true;
                      const isReturnedFull = sale.status === 'Returned';
                      const isPartiallyReturned = sale.status === 'Partially Returned';
                      const hasItems = sale.items && sale.items.length > 0;

                      return (
                        <tr
                          key={`${sale.transaction_id}-${idx}`}
                          className={`transition border-l-2 ${
                            isVoided
                              ? 'border-l-rose-500 bg-rose-500/5 opacity-80'
                              : isReturnedFull 
                              ? 'border-l-rose-500 bg-rose-500/5' 
                              : isPartiallyReturned 
                              ? 'border-l-amber-500 bg-amber-500/5' 
                              : 'border-l-emerald-500/40 bg-emerald-500/[0.02]'
                          } ${
                            isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1f242c]'
                          }`}
                        >
                          {/* Nota & Waktu */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`font-mono font-normal block text-xs ${
                              isVoided 
                                ? 'line-through text-rose-400' 
                                : isLight ? 'text-slate-800' : 'text-white'
                            }`}>
                              {sale.receipt_number || sale.transaction_id}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1 font-normal">
                                <Clock className="w-3 h-3 text-gray-500" />
                                {formatTimeShort(sale.created_at || sale.date)}
                              </span>
                              {getDayBadge(sale.created_at || sale.date)}
                            </div>
                            {isVoided && sale.void_approved_by && (
                              <div className="mt-1.5 p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-[9px] leading-tight">
                                <div className="text-rose-400 font-normal uppercase tracking-tighter">Void Approved By:</div>
                                <div className="text-gray-300 font-normal">{sale.void_approved_by}</div>
                                {sale.void_reason && (
                                  <div className="text-gray-400 italic mt-0.5">"{sale.void_reason}"</div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Terminal & Kasir */}
                          <td className="py-2 px-2 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-medium block text-xs ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                {sale.terminal_name}
                              </span>
                              {(sale.businessType || sale.business_type) && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-normal bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 uppercase">
                                  {sale.businessType || sale.business_type}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 block font-normal">
                              {isEn ? 'Cashier:' : 'Kasir:'} {sale.cashier_name || sale.cashier_id} {sale.terminalId || sale.terminal_id ? `• ${sale.terminalId || sale.terminal_id}` : ''}
                            </span>
                          </td>

                          {/* Pelanggan */}
                          <td className="py-2 px-2">
                            <span className="font-normal text-sky-400 block truncate max-w-[150px] text-xs">
                              {sale.customer_name || (isEn ? 'General Customer' : 'Pelanggan Umum')}
                            </span>
                            {sale.customer_phone && (
                              <span className="text-[10px] text-gray-400 font-mono block font-normal">
                                {sale.customer_phone}
                              </span>
                            )}
                          </td>

                          {/* Ringkasan Item */}
                          <td className="py-2 px-2 max-w-[180px]">
                            <span className="line-clamp-2 text-gray-300 text-xs truncate font-normal">
                              {sale.items_summary ||
                                (sale.items || [])
                                  .map((it) => `${it.product.name} (${it.quantity})`)
                                  .join(', ')}
                            </span>
                            {sale.sales_returns && sale.sales_returns.length > 0 && (
                              <span className="text-[10px] text-amber-400 font-mono font-normal block mt-0.5">
                                • {sale.sales_returns.length}x {isEn ? 'Return Processed' : 'Retur Diproses'} (Refund Rp{' '}
                                {(sale.returned_amount || 0).toLocaleString('id-ID')})
                              </span>
                            )}
                          </td>

                          {/* Total Belanja */}
                          <td className="py-2 px-2 text-right whitespace-nowrap">
                            <span className={`font-mono font-semibold block text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              Rp {sale.total_amount.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono font-normal">
                              {sale.payment_method}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-2 px-2 text-center whitespace-nowrap">
                            {isVoided ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-normal border bg-rose-600 text-white border-rose-400 shadow-sm shadow-rose-900/50">
                                {isEn ? 'VOIDED' : 'DIBATALKAN / VOID'}
                              </span>
                            ) : isReturnedFull ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-normal border bg-rose-500/15 text-rose-400 border-rose-500/30">
                                {isEn ? 'Returned' : 'Retur Penuh'}
                              </span>
                            ) : isPartiallyReturned ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-normal border bg-amber-500/15 text-amber-400 border-amber-500/30">
                                {isEn ? 'Partial' : 'Retur Sebagian'}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-normal border bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm">
                                {isEn ? 'Completed' : 'Selesai'}
                              </span>
                            )}
                          </td>

                          {/* Tombol Aksi */}
                          <td className="py-2 px-2 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Cetak Struk */}
                              <button
                                type="button"
                                onClick={() => showReceipt(sale)}
                                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-normal flex items-center gap-1 transition cursor-pointer active:scale-[0.99] ${
                                  isLight
                                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                                    : 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] text-gray-300'
                                }`}
                                title={isEn ? 'View Receipt / Invoice Copy' : 'Lihat Struk / Salinan Nota'}
                              >
                                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="hidden sm:inline">{isEn ? 'Receipt' : 'Struk'}</span>
                              </button>

                              {/* [Retur Barang] Button */}
                              <button
                                id={`btn-retur-sale-${sale.transaction_id}`}
                                type="button"
                                disabled={isReturnedFull || !hasItems || isVoided}
                                onClick={() => setSelectedOrderForReturn(sale)}
                                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-normal flex items-center gap-1 transition cursor-pointer active:scale-[0.99] ${
                                  isReturnedFull || isVoided
                                    ? 'opacity-40 cursor-not-allowed border-gray-700 text-gray-500'
                                    : isLight
                                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                                    : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                                }`}
                                title={
                                  isVoided
                                    ? (isEn ? 'Voided transaction cannot be returned' : 'Transaksi yang dibatalkan tidak dapat diretur')
                                    : isReturnedFull
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
          ) : activeTab === 'returns' ? (
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
              <div className="space-y-2">
                {filteredReturns.map((ret, idx) => (
                  <div
                    key={`${ret.id}-${idx}`}
                    className={`p-3 rounded-xl border transition ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-normal text-amber-500 text-xs">{ret.id}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-normal">
                          {ret.receiptNumber || ret.transactionId}
                        </span>
                        <span className="text-[10px] text-gray-500 font-normal tracking-tighter">• {ret.timestamp}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-normal">
                        <span className="text-gray-400">Kasir: <span className="text-gray-200 font-medium">{ret.cashierName}</span></span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-400">Pelanggan: <span className="text-sky-400 font-medium">{ret.customerName}</span></span>
                        <span className="ml-4 font-mono font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          -Rp {ret.totalRefundAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-800/40">
                      {ret.items.map((item, idx) => (
                        <div key={idx} className="py-1.5 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-200">{item.productName}</span>
                            <span className="text-gray-500 font-mono font-normal">x {item.returnQty} Unit</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-500 italic">Alasan: {item.reason}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-normal border ${
                              item.condition === 'GOOD'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {item.condition === 'GOOD' ? 'Restock Gudang' : 'Bad Stock (Karantina)'}
                            </span>
                            <span className="font-mono font-semibold text-emerald-400">
                              Rp {item.subtotalRefund.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              </div>
            )
          ) : (
            /* TAB 3: LOG BATAL ITEM (VOID LOGS) */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#0d1117] border border-[#30363d]">
                <div className="flex items-center gap-3">
                  <div className="text-[10px] text-gray-400 font-mono font-normal uppercase italic">
                    Filter sinkron dengan tab penjualan
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm('Bersihkan seluruh log pembatalan item harian? Data yang dihapus tidak dapat dikembalikan.')) {
                      clearVoidItemLogs();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer text-[10px] font-normal active:scale-[0.99]"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Bersihkan Log</span>
                </button>
              </div>

              {getFilteredLogs.length === 0 ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl">
                  <Trash2 className="w-12 h-12 opacity-20 mb-3" />
                  <p className="font-medium text-sm">Tidak ada log pembatalan item</p>
                  <p className="text-[11px] mt-1 font-normal">Belum ada item yang dihapus dari keranjang pada periode terpilih.</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-[#30363d] rounded-2xl">
                  <table className="w-full text-[11px] text-left border-collapse bg-[#161b22]">
                    <thead>
                      <tr className="border-b border-[#30363d] bg-[#0d1117] text-gray-400 uppercase tracking-widest font-mono font-normal">
                        <th className="py-3 px-4 w-10 text-center">No</th>
                        <th className="py-3 px-4 w-32">Jam/Tanggal</th>
                        <th className="py-3 px-4 w-28">Kasir</th>
                        <th className="py-3 px-4">Barcode & Nama Produk</th>
                        <th className="py-3 px-4 text-center w-20">Qty</th>
                        <th className="py-3 px-4 text-right w-28">Harga</th>
                        <th className="py-3 px-4 text-right w-32">Total Nominal</th>
                        <th className="py-3 px-4 w-40">Alasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#30363d]">
                      {getFilteredLogs.map((log, index) => (
                        <tr key={log.id || `void-log-${index}`} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 text-center text-gray-500 font-mono font-normal">{index + 1}</td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-gray-300">
                            <div className="font-medium">
                              {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-[9px] opacity-60 font-normal">
                              {new Date(log.timestamp).toLocaleDateString('id-ID')}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-normal text-emerald-400">{log.cashierId}</td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-white">{log.productName}</div>
                            <div className="text-[9px] font-mono text-gray-400 uppercase font-normal">{log.sku}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-normal text-cyan-400">{log.qty}</td>
                          <td className="py-3 px-4 text-right font-mono text-gray-400 font-normal">
                            Rp {log.unitPrice.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="font-mono font-semibold text-rose-400">Rp {(log.qty * log.unitPrice).toLocaleString('id-ID')}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-400 italic text-[10px] leading-tight font-normal">{log.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedOrderForReturn && (
          <SalesReturnModal
            isOpen={!!selectedOrderForReturn}
            onClose={() => setSelectedOrderForReturn(null)}
            sale={selectedOrderForReturn}
            language={language === 'en' ? 'EN' : 'ID'}
          />
        )}
      </div>
    </div>
  );
};
