import React, { useState, useMemo } from 'react';
import { Search, Filter, RotateCcw, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FinanceEntry } from '../../types';

interface LedgerTableProps {
  finance: FinanceEntry[];
  isLight?: boolean;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({ finance, isLight }) => {
  const { language } = useApp();
  const isEn = language === 'en';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState('ALL');

  const t = {
    searchPlaceholder: isEn ? "Search Ref, COA, Memo..." : "Cari Ref ID, COA, Keterangan...",
    filterCat: isEn ? "All Categories" : "Semua Kategori",
    filterMethod: isEn ? "All Methods" : "Semua Metode",
    filterPeriod: isEn ? "All Dates" : "Semua Tanggal",
    today: isEn ? "Today" : "Hari Ini",
    last7: isEn ? "Last 7 Days" : "7 Hari Terakhir",
    thisMonth: isEn ? "This Month" : "Bulan Ini",
    showing: isEn ? "Showing" : "Menampilkan",
    of: isEn ? "of" : "dari",
    transactions: isEn ? "Transactions" : "Transaksi",
    reset: isEn ? "Reset Filter" : "Reset Filter",
    colRef: "Ref ID",
    colDate: isEn ? "Date" : "Tanggal",
    colCat: isEn ? "Category" : "Kategori",
    colTarget: isEn ? "Target COA" : "Akun Tujuan (COA)",
    colMemo: isEn ? "Description" : "Keterangan",
    colMethod: isEn ? "Method" : "Metode",
    colAmount: "Nominal (Rp)",
  };

  const filteredData = useMemo(() => {
    return finance.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        (item.reference || '').toLowerCase().includes(q) ||
        (item.id || '').toLowerCase().includes(q) ||
        (item.account_target || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q);
      
      if (!matchesSearch) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (methodFilter !== 'ALL' && item.payment_method !== methodFilter) return false;

      if (periodFilter !== 'ALL') {
        const itemDate = new Date(item.date);
        const now = new Date();
        if (periodFilter === 'TODAY') {
          if (item.date !== now.toISOString().slice(0, 10)) return false;
        } else if (periodFilter === 'LAST_7') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          if (itemDate < sevenDaysAgo) return false;
        } else if (periodFilter === 'THIS_MONTH') {
          if (item.date.slice(0, 7) !== now.toISOString().slice(0, 7)) return false;
        }
      }

      return true;
    });
  }, [finance, searchQuery, categoryFilter, methodFilter, periodFilter]);

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setMethodFilter('ALL');
    setPeriodFilter('ALL');
  };

  const getMetodeStyle = (method: string) => {
    const base = "px-2.5 py-0.5 rounded text-[11px] font-mono font-normal border inline-block ";
    if (method === 'CASH') return base + "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800";
    if (method === 'QRIS') return base + "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-800";
    if (method === 'TRANSFER') return base + "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800";
    if (method === 'EDC_DEBIT') return base + "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-800";
    if (method === 'PROMO_TPR' || method === 'REBATE_OFFSET') return base + "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800";
    if (method === 'PROMO_FEFO') return base + "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800";
    if (method === 'PROMO_TOKO') return base + "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800";
    if (method === 'OPERASIONAL_ARMADA') return base + "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800";
    return base + "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700";
  };

  const categories = useMemo(() => {
    const cats = new Set(finance.map(f => f.category));
    return Array.from(cats).filter(Boolean);
  }, [finance]);

  const methods = ['CASH', 'QRIS', 'TRANSFER', 'EDC_DEBIT', 'FIFO', 'OPERASIONAL_ARMADA', 'PROMO_TPR', 'PROMO_FEFO', 'PROMO_TOKO', 'REBATE_OFFSET'];

  return (
    <div className="space-y-4 font-sans">
      {/* TOOLBAR FILTER CEPAT */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
        isLight 
          ? 'border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' 
          : 'border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
      }`}>
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm leading-5 font-normal text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="text-slate-500 dark:text-slate-400 w-3.5 h-3.5" />
            <select 
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm leading-5 font-normal text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="ALL">{t.filterCat}</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Method Filter */}
          <select 
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm leading-5 font-normal text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer shadow-sm"
          >
            <option value="ALL">{t.filterMethod}</option>
            {methods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="text-slate-500 dark:text-slate-400 w-3.5 h-3.5" />
            <select 
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm leading-5 font-normal text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="ALL">{t.filterPeriod}</option>
              <option value="TODAY">{t.today}</option>
              <option value="LAST_7">{t.last7}</option>
              <option value="THIS_MONTH">{t.thisMonth}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs leading-5 text-slate-600 dark:text-slate-400 font-normal">
            {t.showing} <span className="text-cyan-600 dark:text-cyan-400 font-mono font-normal">{filteredData.length}</span> {t.of} <span className="text-slate-900 dark:text-slate-200 font-mono font-normal">{finance.length}</span> {t.transactions}
          </span>
          <button 
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-mono font-normal uppercase tracking-widest transition-all active:scale-[0.99] border border-slate-300 dark:border-slate-700 shadow-sm cursor-pointer"
          >
            <RotateCcw size={12}/>
            {t.reset}
          </button>
        </div>
      </div>

      {/* TATA LETAK TABEL */}
      <div className={`w-full overflow-x-auto rounded-xl border bg-white dark:bg-slate-900 shadow-sm scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent transition-all duration-200 hover:-translate-y-0.5 ${
        isLight 
          ? 'border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' 
          : 'border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
      }`}>
        <table className="table-fixed w-full min-w-[1200px] text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 text-[11px] leading-4 font-mono font-normal uppercase tracking-widest text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="py-4 px-4 w-40 pl-6">{t.colRef}</th>
              <th className="py-4 px-4 w-28">{t.colDate}</th>
              <th className="py-4 px-4 w-52 shrink-0">{t.colCat}</th>
              <th className="py-4 px-4 w-56 shrink-0">{t.colTarget}</th>
              <th className="py-4 px-4 w-[280px]">{t.colMemo}</th>
              <th className="py-4 px-4 w-28 text-center shrink-0">{t.colMethod}</th>
              <th className="py-4 px-4 w-44 text-right pr-6 shrink-0">{t.colAmount}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                    <Filter size={32} className="opacity-40" />
                    <p className="text-sm leading-5 font-normal">No transactions match your filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((entry, idx) => (
                <tr key={idx} className="bg-white dark:bg-transparent text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="py-3.5 px-4 pl-6 font-mono text-xs leading-5 text-cyan-600 dark:text-cyan-400 font-normal group-hover:underline transition-colors">
                    {entry.reference || entry.id}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs leading-5 font-mono font-normal">
                    {entry.date}
                  </td>
                  <td className="py-3.5 px-4 w-52 shrink-0">
                    <span className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] leading-4 px-2.5 py-1 rounded-md whitespace-nowrap font-mono font-normal uppercase tracking-wider max-w-[200px] truncate block shadow-xs">
                      {entry.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 w-56 shrink-0 truncate text-xs leading-5 font-mono font-normal">
                    {entry.account_target}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-[280px] truncate text-sm leading-5 font-normal group-hover:text-slate-900 dark:group-hover:text-white transition-colors" title={entry.description}>
                    {entry.description}
                  </td>
                  <td className="py-3.5 px-4 text-center shrink-0 w-28">
                    <span className={getMetodeStyle(entry.payment_method)}>
                      {entry.payment_method}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 pr-6 text-right shrink-0 w-44 font-mono font-normal text-lg leading-7 tabular-nums">
                    <span className={
                      entry.type === 'INCOME' || entry.type === 'IN / PENDAPATAN'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : entry.type === 'REBATE_CLAIM'
                        ? 'text-cyan-600 dark:text-cyan-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }>
                      {entry.type === 'INCOME' || entry.type === 'IN / PENDAPATAN' || entry.type === 'REBATE_CLAIM' ? '+' : '-'}
                      Rp {entry.amount.toLocaleString('id-ID')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LedgerTable;