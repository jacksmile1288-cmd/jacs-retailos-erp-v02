import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  Filter,
  Download,
  Printer,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  PieChart,
  Layers,
  ArrowRight,
  Receipt,
  FileSpreadsheet,
  Search,
  Building,
} from 'lucide-react';
import { hasValidProfileValue } from '../../utils/businessProfileUtils';

interface FinancialReportsTabProps {
  isLight?: boolean;
}

export const FinancialReportsTab: React.FC<FinancialReportsTabProps> = ({ isLight = false }) => {
  const { journalEntries, finance, language, businessProfile } = useApp();
  const isEn = language === 'en';

  const [activeReport, setActiveReport] = useState<'income_statement' | 'trial_balance'>('income_statement');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'THIS_MONTH' | 'TODAY' | 'THIS_YEAR'>('ALL');
  const [trialBalanceSearch, setTrialBalanceSearch] = useState('');
  const [accountCategoryFilter, setAccountCategoryFilter] = useState<string>('ALL');

  // Account standard naming map
  const accountMasterNames: Record<string, { name: string; category: string; normalBalance: 'DEBIT' | 'CREDIT' }> = {
    '1-10000': { name: 'Kas Utama / Brankas', category: 'ASET LANCAR', normalBalance: 'DEBIT' },
    '1-10001': { name: 'Kas Kasir / Laci', category: 'ASET LANCAR', normalBalance: 'DEBIT' },
    '1-10002': { name: 'Bank Operasional / Settlement QRIS', category: 'ASET LANCAR', normalBalance: 'DEBIT' },
    '1-10301': { name: 'Piutang Usaha (AR)', category: 'ASET LANCAR', normalBalance: 'DEBIT' },
    '1-10501': { name: 'Persediaan Barang Dagang', category: 'ASET LANCAR', normalBalance: 'DEBIT' },
    '2-10101': { name: 'Hutang Dagang (AP)', category: 'KEWAJIBAN / HUTANG', normalBalance: 'CREDIT' },
    '2-10102': { name: 'Hutang Gaji & BPJS Karyawan', category: 'KEWAJIBAN / HUTANG', normalBalance: 'CREDIT' },
    '3-10001': { name: 'Modal Disetor Pemilik', category: 'EKUITAS / MODAL', normalBalance: 'CREDIT' },
    '3-10002': { name: 'Laba Ditahan', category: 'EKUITAS / MODAL', normalBalance: 'CREDIT' },
    '4-10001': { name: 'Pendapatan Penjualan POS', category: 'PENDAPATAN', normalBalance: 'CREDIT' },
    '4-10002': { name: 'Retur Penjualan Konsumen', category: 'PENDAPATAN', normalBalance: 'DEBIT' },
    '4-10999': { name: 'Pendapatan Lain-lain / Surplus Kas', category: 'PENDAPATAN', normalBalance: 'CREDIT' },
    '5-10001': { name: 'Beban Pokok Penjualan (HPP)', category: 'BEBAN POKOK (COGS)', normalBalance: 'DEBIT' },
    '5-10002': { name: 'Beban Operasional & Toko', category: 'BEBAN OPERASIONAL', normalBalance: 'DEBIT' },
    '5-10003': { name: 'Beban Gaji & Upah Karyawan', category: 'BEBAN OPERASIONAL', normalBalance: 'DEBIT' },
    '5-10004': { name: 'Beban BPJS Perusahaan', category: 'BEBAN OPERASIONAL', normalBalance: 'DEBIT' },
    '5-10005': { name: 'Beban Utilitas (Listrik, Air & Internet)', category: 'BEBAN OPERASIONAL', normalBalance: 'DEBIT' },
    '5-10999': { name: 'Beban Selisih Kas / Defisit Kasir', category: 'BEBAN OPERASIONAL', normalBalance: 'DEBIT' },
  };

  // Filter journals by date period
  const filteredJournals = useMemo(() => {
    if (periodFilter === 'ALL') return journalEntries;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const thisMonthPrefix = now.toISOString().slice(0, 7); // YYYY-MM
    const thisYearPrefix = String(now.getFullYear());

    return journalEntries.filter((j) => {
      const jDate = j.date || j.created_at?.slice(0, 10) || '';
      if (periodFilter === 'TODAY') return jDate === todayStr;
      if (periodFilter === 'THIS_MONTH') return jDate.startsWith(thisMonthPrefix);
      if (periodFilter === 'THIS_YEAR') return jDate.startsWith(thisYearPrefix);
      return true;
    });
  }, [journalEntries, periodFilter]);

  // =========================================================================
  // 1. LAPORAN LABA RUGI (INCOME STATEMENT)
  // Agregasi Pendapatan (4-xxxxx), HPP (5-10001), dan Beban Operasional (5-xxxxx)
  // =========================================================================
  const incomeStatementData = useMemo(() => {
    const revenueAccounts: Record<string, { code: string; name: string; amount: number }> = {};
    let totalRevenue = 0;

    let totalCogs = 0;
    const cogsAccounts: Record<string, { code: string; name: string; amount: number }> = {};

    const expenseAccounts: Record<string, { code: string; name: string; amount: number }> = {};
    let totalOperatingExpenses = 0;

    filteredJournals.forEach((j) => {
      if (!j.lines || !Array.isArray(j.lines)) return;

      j.lines.forEach((line) => {
        const code = line.accountCode;
        if (!code) return;

        // A. PENDAPATAN (Akun 4-xxxxx)
        if (code.startsWith('4-')) {
          // Pendapatan bertambah di KREDIT, berkurang di DEBIT
          const netCredit = (line.credit || 0) - (line.debit || 0);
          totalRevenue += netCredit;

          if (!revenueAccounts[code]) {
            const accInfo = accountMasterNames[code];
            revenueAccounts[code] = {
              code,
              name: accInfo?.name || line.accountName || `Akun ${code}`,
              amount: 0,
            };
          }
          revenueAccounts[code].amount += netCredit;
        }

        // B. BEBAN POKOK PENJUALAN / HPP (Akun 5-10001)
        else if (code === '5-10001') {
          // Beban bertambah di DEBIT, berkurang di KREDIT
          const netDebit = (line.debit || 0) - (line.credit || 0);
          totalCogs += netDebit;

          if (!cogsAccounts[code]) {
            cogsAccounts[code] = {
              code,
              name: 'Beban Pokok Penjualan (HPP)',
              amount: 0,
            };
          }
          cogsAccounts[code].amount += netDebit;
        }

        // C. BEBAN OPERASIONAL / GAJI / SELISIH STOK (Akun 5-xxxxx selain 5-10001)
        else if (code.startsWith('5-')) {
          const netDebit = (line.debit || 0) - (line.credit || 0);
          totalOperatingExpenses += netDebit;

          if (!expenseAccounts[code]) {
            const accInfo = accountMasterNames[code];
            expenseAccounts[code] = {
              code,
              name: accInfo?.name || line.accountName || `Beban ${code}`,
              amount: 0,
            };
          }
          expenseAccounts[code].amount += netDebit;
        }
      });
    });

    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit - totalOperatingExpenses;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      revenueList: Object.values(revenueAccounts).sort((a, b) => a.code.localeCompare(b.code)),
      totalRevenue,
      cogsList: Object.values(cogsAccounts),
      totalCogs,
      grossProfit,
      grossMarginPct,
      expenseList: Object.values(expenseAccounts).sort((a, b) => a.code.localeCompare(b.code)),
      totalOperatingExpenses,
      netProfit,
      netMarginPct,
    };
  }, [filteredJournals]);

  // =========================================================================
  // 2. NERACA SALDO (TRIAL BALANCE)
  // Agregasi seluruh akun Debit vs Kredit untuk memastikan posisi Balance
  // =========================================================================
  const trialBalanceData = useMemo(() => {
    const accountsMap: Record<
      string,
      {
        accountCode: string;
        accountName: string;
        category: string;
        totalDebit: number;
        totalCredit: number;
        endingDebit: number;
        endingCredit: number;
      }
    > = {};

    // Inisialisasi akun dari accountMasterNames agar akun baku tampil rapi
    Object.entries(accountMasterNames).forEach(([code, meta]) => {
      accountsMap[code] = {
        accountCode: code,
        accountName: meta.name,
        category: meta.category,
        totalDebit: 0,
        totalCredit: 0,
        endingDebit: 0,
        endingCredit: 0,
      };
    });

    // Akumulasi dari jurnal entries
    filteredJournals.forEach((j) => {
      if (!j.lines || !Array.isArray(j.lines)) return;

      j.lines.forEach((line) => {
        const code = line.accountCode;
        if (!code) return;

        if (!accountsMap[code]) {
          const firstDigit = code.charAt(0);
          let defaultCat = 'LAIN-LAIN';
          if (firstDigit === '1') defaultCat = 'ASET LANCAR';
          else if (firstDigit === '2') defaultCat = 'KEWAJIBAN / HUTANG';
          else if (firstDigit === '3') defaultCat = 'EKUITAS / MODAL';
          else if (firstDigit === '4') defaultCat = 'PENDAPATAN';
          else if (firstDigit === '5') defaultCat = 'BEBAN';

          accountsMap[code] = {
            accountCode: code,
            accountName: line.accountName || `Akun ${code}`,
            category: defaultCat,
            totalDebit: 0,
            totalCredit: 0,
            endingDebit: 0,
            endingCredit: 0,
          };
        }

        accountsMap[code].totalDebit += line.debit || 0;
        accountsMap[code].totalCredit += line.credit || 0;
      });
    });

    // Hitung Saldo Akhir Debit vs Kredit untuk masing-masing akun
    let grandTotalDebit = 0;
    let grandTotalCredit = 0;
    let grandEndingDebit = 0;
    let grandEndingCredit = 0;

    const list = Object.values(accountsMap)
      .map((acc) => {
        grandTotalDebit += acc.totalDebit;
        grandTotalCredit += acc.totalCredit;

        const net = acc.totalDebit - acc.totalCredit;
        let endingDebit = 0;
        let endingCredit = 0;

        if (net > 0) {
          endingDebit = net;
          grandEndingDebit += net;
        } else if (net < 0) {
          endingCredit = Math.abs(net);
          grandEndingCredit += Math.abs(net);
        }

        return {
          ...acc,
          endingDebit,
          endingCredit,
        };
      })
      // Tampilkan akun yang memiliki aktivitas atau mutasi
      .filter((acc) => acc.totalDebit > 0 || acc.totalCredit > 0)
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    const isBalanced = Math.abs(grandTotalDebit - grandTotalCredit) === 0;
    const isEndingBalanced = Math.abs(grandEndingDebit - grandEndingCredit) === 0;
    const diff = Math.abs(grandTotalDebit - grandTotalCredit);

    return {
      accountsList: list,
      grandTotalDebit,
      grandTotalCredit,
      grandEndingDebit,
      grandEndingCredit,
      isBalanced,
      isEndingBalanced,
      diff,
    };
  }, [filteredJournals]);

  // Filtered trial balance rows
  const displayedTrialBalanceRows = useMemo(() => {
    return trialBalanceData.accountsList.filter((row) => {
      if (accountCategoryFilter !== 'ALL' && row.category !== accountCategoryFilter) {
        return false;
      }
      if (trialBalanceSearch.trim()) {
        const q = trialBalanceSearch.toLowerCase();
        return (
          row.accountCode.toLowerCase().includes(q) ||
          row.accountName.toLowerCase().includes(q) ||
          row.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [trialBalanceData.accountsList, trialBalanceSearch, accountCategoryFilter]);

  // Export CSV Helper
  const handleExportCsv = () => {
    const compName = businessProfile?.name || 'JacS Retail & Enterprise';
    if (activeReport === 'income_statement') {
      const rows = [
        [`LAPORAN LABA RUGI (INCOME STATEMENT) - ${compName.toUpperCase()}`],
        ['Periode:', periodFilter],
        [''],
        ['KODE AKUN', 'NAMA AKUN', 'KATEGORI', 'JUMLAH (IDR)'],
        ['1. PENDAPATAN (REVENUE)'],
        ...incomeStatementData.revenueList.map((r) => [r.code, r.name, 'Pendapatan', r.amount]),
        ['TOTAL PENDAPATAN', '', '', incomeStatementData.totalRevenue],
        [''],
        ['2. BEBAN POKOK PENJUALAN (HPP)'],
        ...incomeStatementData.cogsList.map((c) => [c.code, c.name, 'HPP', c.amount]),
        ['TOTAL BEBAN POKOK PENJUALAN', '', '', incomeStatementData.totalCogs],
        ['LABA KOTOR (GROSS PROFIT)', '', '', incomeStatementData.grossProfit],
        [''],
        ['3. BEBAN OPERASIONAL'],
        ...incomeStatementData.expenseList.map((e) => [e.code, e.name, 'Beban Operasional', e.amount]),
        ['TOTAL BEBAN OPERASIONAL', '', '', incomeStatementData.totalOperatingExpenses],
        [''],
        ['LABA BERSIH (NET INCOME)', '', '', incomeStatementData.netProfit],
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Laba_Rugi_${periodFilter}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const rows = [
        [`NERACA SALDO (TRIAL BALANCE) - ${compName.toUpperCase()}`],
        ['Periode:', periodFilter],
        [''],
        ['KODE AKUN', 'NAMA AKUN', 'KATEGORI', 'TOTAL DEBIT (IDR)', 'TOTAL KREDIT (IDR)', 'SALDO AKHIR DEBIT (IDR)', 'SALDO AKHIR KREDIT (IDR)'],
        ...trialBalanceData.accountsList.map((a) => [
          a.accountCode,
          `"${a.accountName}"`,
          a.category,
          a.totalDebit,
          a.totalCredit,
          a.endingDebit,
          a.endingCredit,
        ]),
        ['TOTAL', '', '', trialBalanceData.grandTotalDebit, trialBalanceData.grandTotalCredit, trialBalanceData.grandEndingDebit, trialBalanceData.grandEndingCredit],
        ['STATUS SEIMBANG / BALANCE:', trialBalanceData.isBalanced ? 'BALANCE (SEIMBANG)' : `TIDAK BALANCE (Selisih: ${trialBalanceData.diff})`],
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Neraca_Saldo_${periodFilter}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION: TITLE & REPORT SUB-NAV */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-6 h-6 text-[#0052FF] dark:text-[#58a6ff]" />
            <span>{isEn ? 'Financial Reports & Accounting Analytics' : 'Laporan Keuangan & Neraca Saldo'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
            {isEn
              ? 'Real-time double-entry income statement (P&L) and trial balance from verified journal entries.'
              : 'Agregasi otomatis Laporan Laba Rugi real-time & Neraca Saldo (Trial Balance) seimbang dari buku jurnal.'}
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`p-1 rounded-xl border flex items-center gap-1 ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveReport('income_statement')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeReport === 'income_statement'
                  ? 'bg-[#0052FF] text-white shadow-sm'
                  : isLight
                  ? 'text-slate-700 hover:text-slate-900'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Laba Rugi (P&L)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveReport('trial_balance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeReport === 'trial_balance'
                  ? 'bg-[#0052FF] text-white shadow-sm'
                  : isLight
                  ? 'text-slate-700 hover:text-slate-900'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Neraca Saldo</span>
            </button>
          </div>

          {/* Period Filter Dropdown */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as any)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0052FF] ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            <option value="ALL">Semua Periode</option>
            <option value="THIS_MONTH">Bulan Ini</option>
            <option value="TODAY">Hari Ini</option>
            <option value="THIS_YEAR">Tahun 2026</option>
          </select>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                : 'bg-[#21262d] border-[#30363d] text-gray-200 hover:text-white hover:bg-[#30363d]'
            }`}
            title="Download CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Cetak / Print PDF Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm bg-[#0052FF] hover:bg-[#0043d1] text-white border-[#0052FF]"
            title="Cetak Laporan Keuangan"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. REPORT VIEW: LAPORAN LABA RUGI (INCOME STATEMENT)                      */}
      {/* ========================================================================= */}
      {activeReport === 'income_statement' && (
        <div className="space-y-6">
          {/* Master Corporate Header / Kop Laporan Keuangan */}
          <div className={`p-5 rounded-2xl border print:border-none print:p-0 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-3.5">
                {businessProfile?.logoUrl ? (
                  <img
                    src={businessProfile.logoUrl}
                    alt="Logo"
                    className="w-12 h-12 object-contain rounded-xl p-1 bg-white/5 border border-cyan-500/30 shadow-md"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black flex items-center justify-center text-lg shadow-md">
                    {businessProfile?.name?.charAt(0) || 'J'}
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-500">
                    {businessProfile?.category || 'ENTITAS BISNIS RESMI'}
                  </span>
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                    {businessProfile?.name || 'JacS Retail & Enterprise Group'}
                  </h2>
                  {(hasValidProfileValue(businessProfile?.address) || hasValidProfileValue(businessProfile?.phone) || hasValidProfileValue(businessProfile?.email)) && (
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      {[
                        hasValidProfileValue(businessProfile?.address) ? businessProfile!.address : null,
                        hasValidProfileValue(businessProfile?.phone) ? `Telp: ${businessProfile!.phone}` : null,
                        hasValidProfileValue(businessProfile?.email) ? businessProfile!.email : null,
                      ].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  {hasValidProfileValue(businessProfile?.licenseNumber) && (
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      {businessProfile!.licenseNumber}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  FINANCIAL STATEMENT
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                  LAPORAN LABA RUGI KOMPREHENSIF
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-mono">
                  Periode: {periodFilter === 'ALL' ? 'Semua Periode Transaksi' : periodFilter}
                </p>
              </div>
            </div>
          </div>

          {/* TOP KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Pendapatan */}
            <div
              className={`p-4 rounded-2xl border shadow-sm ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                  Total Pendapatan (4-xxxxx)
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                Rp {incomeStatementData.totalRevenue.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 block">
                {incomeStatementData.revenueList.length} Akun Pendapatan Aktif
              </span>
            </div>

            {/* Total HPP / COGS */}
            <div
              className={`p-4 rounded-2xl border shadow-sm ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                  Beban Pokok Penjualan (5-10001)
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                Rp {incomeStatementData.totalCogs.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 block">
                COGS dari Nota & Resep Penjualan
              </span>
            </div>

            {/* Laba Kotor (Gross Profit) */}
            <div
              className={`p-4 rounded-2xl border shadow-sm ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                  Laba Kotor (Gross Profit)
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black font-mono ${incomeStatementData.grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                Rp {incomeStatementData.grossProfit.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                Margin Kotor: {incomeStatementData.grossMarginPct.toFixed(1)}%
              </span>
            </div>

            {/* Laba Bersih (Net Profit) */}
            <div
              className={`p-4 rounded-2xl border shadow-sm relative overflow-hidden ${
                isLight
                  ? incomeStatementData.netProfit >= 0 ? 'bg-emerald-50/50 border-emerald-300' : 'bg-rose-50/50 border-rose-300'
                  : incomeStatementData.netProfit >= 0 ? 'bg-emerald-950/20 border-emerald-800' : 'bg-rose-950/20 border-rose-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300">
                  Laba Bersih (Net Income)
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black font-mono ${incomeStatementData.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                Rp {incomeStatementData.netProfit.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-gray-300 mt-1 block">
                Net Margin: {incomeStatementData.netMarginPct.toFixed(1)}% (Beban: Rp {incomeStatementData.totalOperatingExpenses.toLocaleString('id-ID')})
              </span>
            </div>
          </div>

          {/* DETAIL BREAKDOWN TABLE: INCOME STATEMENT */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-sm ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#30363d] flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#0052FF]" />
                  <span>Struktur Laporan Laba Rugi Komprehensif</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Sumber data: Mutasi riil buku besar jurnal APS POS5 General Ledger
                </p>
              </div>
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300">
                Filter: {periodFilter}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-gray-800/80">
              {/* 1. BAGIAN PENDAPATAN */}
              <div className="p-4 bg-slate-50/70 dark:bg-[#0d1117]/60">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                  <span>1. PENDAPATAN OPERASIONAL & PENJUALAN (4-XXXXX)</span>
                  <span>SUBTOTAL</span>
                </div>
                <div className="space-y-1.5 pl-3">
                  {incomeStatementData.revenueList.map((rev) => (
                    <div key={`rev-${rev.code}`} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-500 dark:text-gray-400 text-[11px] w-16">
                          {rev.code}
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {rev.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        Rp {rev.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                  {incomeStatementData.revenueList.length === 0 && (
                    <div className="text-xs text-gray-400 italic py-1">Belum ada mutasi pendapatan pada periode ini.</div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200 dark:border-gray-800 text-xs font-black text-slate-900 dark:text-white">
                  <span>TOTAL PENDAPATAN (A)</span>
                  <span className="text-blue-600 dark:text-blue-400 font-mono text-sm">
                    Rp {incomeStatementData.totalRevenue.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* 2. BAGIAN BEBAN POKOK PENJUALAN (HPP) */}
              <div className="p-4 bg-slate-50/40 dark:bg-[#0d1117]/40">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                  <span>2. BEBAN POKOK PENJUALAN / HPP (5-10001)</span>
                  <span>SUBTOTAL</span>
                </div>
                <div className="space-y-1.5 pl-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-500 dark:text-gray-400 text-[11px] w-16">
                        5-10001
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        Beban Pokok Penjualan (HPP Bahan Baku & Barang Retail)
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      (Rp {incomeStatementData.totalCogs.toLocaleString('id-ID')})
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200 dark:border-gray-800 text-xs font-black text-slate-900 dark:text-white">
                  <span>TOTAL BEBAN POKOK PENJUALAN (B)</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono text-sm">
                    Rp {incomeStatementData.totalCogs.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* BARIS LABA KOTOR */}
              <div className="p-4 bg-emerald-500/10 dark:bg-emerald-950/30 flex items-center justify-between text-sm font-black text-slate-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>LABA KOTOR / GROSS PROFIT (A - B)</span>
                </div>
                <span className="font-mono text-base text-emerald-600 dark:text-emerald-400">
                  Rp {incomeStatementData.grossProfit.toLocaleString('id-ID')}
                </span>
              </div>

              {/* 3. BAGIAN BEBAN OPERASIONAL */}
              <div className="p-4 bg-slate-50/70 dark:bg-[#0d1117]/60">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">
                  <span>3. BEBAN OPERASIONAL, GAJI, BPJS & LAINNYA (5-XXXXX)</span>
                  <span>SUBTOTAL</span>
                </div>
                <div className="space-y-1.5 pl-3">
                  {incomeStatementData.expenseList.map((exp) => (
                    <div key={`exp-${exp.code}`} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-500 dark:text-gray-400 text-[11px] w-16">
                          {exp.code}
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {exp.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        (Rp {exp.amount.toLocaleString('id-ID')})
                      </span>
                    </div>
                  ))}
                  {incomeStatementData.expenseList.length === 0 && (
                    <div className="text-xs text-gray-400 italic py-1">Belum ada beban operasional tercatat pada periode ini.</div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200 dark:border-gray-800 text-xs font-black text-slate-900 dark:text-white">
                  <span>TOTAL BEBAN OPERASIONAL (C)</span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono text-sm">
                    Rp {incomeStatementData.totalOperatingExpenses.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* BARIS FINAL: LABA BERSIH (NET INCOME) */}
              <div className="p-5 bg-[#0052FF]/10 dark:bg-[#0052FF]/20 flex items-center justify-between text-base font-black text-slate-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-[#0052FF] dark:text-[#58a6ff]" />
                  <div>
                    <span>LABA BERSIH TAHUN BERJALAN (NET INCOME)</span>
                    <span className="text-xs text-slate-500 dark:text-gray-400 block font-normal">
                      Laba Kotor (Gross Profit) dikurangi Total Beban Operasional
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-mono block ${incomeStatementData.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                    Rp {incomeStatementData.netProfit.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400">
                    Net Margin: {incomeStatementData.netMarginPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. REPORT VIEW: NERACA SALDO (TRIAL BALANCE)                              */}
      {/* ========================================================================= */}
      {activeReport === 'trial_balance' && (
        <div className="space-y-4">
          {/* Master Corporate Header / Kop Laporan Keuangan */}
          <div className={`p-5 rounded-2xl border print:border-none print:p-0 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-3.5">
                {businessProfile?.logoUrl ? (
                  <img
                    src={businessProfile.logoUrl}
                    alt="Logo"
                    className="w-12 h-12 object-contain rounded-xl p-1 bg-white/5 border border-cyan-500/30 shadow-md"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black flex items-center justify-center text-lg shadow-md">
                    {businessProfile?.name?.charAt(0) || 'J'}
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-500">
                    {businessProfile?.category || 'ENTITAS BISNIS RESMI'}
                  </span>
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                    {businessProfile?.name || 'JacS Retail & Enterprise Group'}
                  </h2>
                  {(hasValidProfileValue(businessProfile?.address) || hasValidProfileValue(businessProfile?.phone) || hasValidProfileValue(businessProfile?.email)) && (
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      {[
                        hasValidProfileValue(businessProfile?.address) ? businessProfile!.address : null,
                        hasValidProfileValue(businessProfile?.phone) ? `Telp: ${businessProfile!.phone}` : null,
                        hasValidProfileValue(businessProfile?.email) ? businessProfile!.email : null,
                      ].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  {hasValidProfileValue(businessProfile?.licenseNumber) && (
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      {businessProfile!.licenseNumber}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  GENERAL LEDGER AUDIT
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                  NERACA SALDO (TRIAL BALANCE)
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-mono">
                  Periode: {periodFilter === 'ALL' ? 'Semua Periode Transaksi' : periodFilter}
                </p>
              </div>
            </div>
          </div>

          {/* BALANCE STATUS INDICATOR BANNER */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              trialBalanceData.isBalanced
                ? isLight
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                  : 'bg-emerald-950/30 border-emerald-700/80 text-emerald-200'
                : isLight
                ? 'bg-rose-50 border-rose-400 text-rose-950'
                : 'bg-rose-950/30 border-rose-700/80 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  trialBalanceData.isBalanced
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                }`}
              >
                {trialBalanceData.isBalanced ? (
                  <ShieldCheck className="w-7 h-7" />
                ) : (
                  <AlertCircle className="w-7 h-7" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    {trialBalanceData.isBalanced
                      ? 'POSISI NERACA SALDO: SEIMBANG (BALANCED)'
                      : 'PERINGATAN: NERACA SALDO TIDAK SEIMBANG'}
                  </h3>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      trialBalanceData.isBalanced
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {trialBalanceData.isBalanced ? '100% OK' : 'SELISIH DETEKSI'}
                  </span>
                </div>
                <p className="text-xs opacity-90">
                  {trialBalanceData.isBalanced
                    ? 'Total seluruh sisi Debit sama persis dengan sisi Kredit (Prinsip Double-Entry terpenuhi sempurna).'
                    : `Terdapat deviasi pembukuan sebesar Rp ${trialBalanceData.diff.toLocaleString('id-ID')} antara Debit dan Kredit.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono font-bold shrink-0">
              <div className="text-right">
                <span className="block opacity-75 text-[10px] uppercase">Total Debit:</span>
                <span className="text-sm font-black">
                  Rp {trialBalanceData.grandTotalDebit.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="text-right">
                <span className="block opacity-75 text-[10px] uppercase">Total Kredit:</span>
                <span className="text-sm font-black">
                  Rp {trialBalanceData.grandTotalCredit.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* SEARCH & CATEGORY FILTER BAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={trialBalanceSearch}
                onChange={(e) => setTrialBalanceSearch(e.target.value)}
                placeholder="Cari kode akun, nama buku besar, atau kategori..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border font-medium transition focus:outline-none focus:ring-2 focus:ring-[#0052FF] ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-[#161b22] border-[#30363d] text-white'
                }`}
              />
            </div>

            {/* Filter Kategori Akun */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'ASET LANCAR', 'KEWAJIBAN / HUTANG', 'EKUITAS / MODAL', 'PENDAPATAN', 'BEBAN'].map((cat) => (
                <button
                  key={`tb-cat-${cat}`}
                  type="button"
                  onClick={() => setAccountCategoryFilter(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    accountCategoryFilter === cat
                      ? 'bg-[#0052FF] text-white shadow-sm'
                      : isLight
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-[#21262d] text-gray-300 hover:bg-[#30363d]'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* TABLE NERACA SALDO */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-sm ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b font-black uppercase text-[11px] tracking-wider ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-[#0d1117] border-[#30363d] text-gray-300'
                    }`}
                  >
                    <th className="py-3 px-3.5 w-24">Kode Akun</th>
                    <th className="py-3 px-3.5">Nama Akun Buku Besar</th>
                    <th className="py-3 px-3.5 w-36">Kategori</th>
                    <th className="py-3 px-3.5 text-right font-mono w-36">Total Debit</th>
                    <th className="py-3 px-3.5 text-right font-mono w-36">Total Kredit</th>
                    <th className="py-3 px-3.5 text-right font-mono w-36 text-blue-600 dark:text-blue-400">
                      Saldo Akhir (Dr)
                    </th>
                    <th className="py-3 px-3.5 text-right font-mono w-36 text-emerald-600 dark:text-emerald-400">
                      Saldo Akhir (Cr)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800/80 font-medium">
                  {displayedTrialBalanceRows.map((row) => (
                    <tr
                      key={`tb-row-${row.accountCode}`}
                      className={`hover:bg-slate-50 dark:hover:bg-[#21262d]/50 transition ${
                        isLight ? 'text-slate-800' : 'text-slate-200'
                      }`}
                    >
                      <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {row.accountCode}
                      </td>
                      <td className="py-2.5 px-3.5 font-bold">
                        {row.accountName}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                            row.category.includes('ASET')
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : row.category.includes('HUTANG') || row.category.includes('KEWAJIBAN')
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : row.category.includes('PENDAPATAN')
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : row.category.includes('BEBAN')
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                          }`}
                        >
                          {row.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono">
                        {row.totalDebit > 0 ? `Rp ${row.totalDebit.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono">
                        {row.totalCredit > 0 ? `Rp ${row.totalCredit.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                        {row.endingDebit > 0 ? `Rp ${row.endingDebit.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {row.endingCredit > 0 ? `Rp ${row.endingCredit.toLocaleString('id-ID')}` : '-'}
                      </td>
                    </tr>
                  ))}

                  {displayedTrialBalanceRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-500 dark:text-gray-400">
                        Tidak ada akun pembukuan yang cocok dengan pencarian filter.
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* TOTAL FOOTER ROW */}
                <tfoot>
                  <tr
                    className={`border-t-2 font-black text-xs ${
                      isLight
                        ? 'bg-slate-100 border-slate-300 text-slate-900'
                        : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  >
                    <td colSpan={3} className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <span>TOTAL KESELURUHAN (GENERAL LEDGER TRIAL BALANCE)</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-black ${
                            trialBalanceData.isBalanced ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}
                        >
                          {trialBalanceData.isBalanced ? 'BALANCE' : 'SELISIH'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-sm">
                      Rp {trialBalanceData.grandTotalDebit.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-sm">
                      Rp {trialBalanceData.grandTotalCredit.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-sm text-blue-600 dark:text-blue-400">
                      Rp {trialBalanceData.grandEndingDebit.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      Rp {trialBalanceData.grandEndingCredit.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
