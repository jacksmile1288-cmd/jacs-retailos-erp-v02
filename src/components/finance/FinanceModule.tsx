import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getReactiveNeonGlowStyle } from '../../utils/neonGlow';
import { AccountsPayableTab } from './AccountsPayableTab';
import { AccountsReceivableTab } from './AccountsReceivableTab';
import { FinancialReportsTab } from './FinancialReportsTab';
import { CashReconciliationTab } from './CashReconciliationTab';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  X,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Building,
  ShieldCheck,
  Send,
  Wallet,
  Receipt,
  Calculator,
  Scale,
  ArrowRight,
  Check,
  Filter,
  Clock,
} from 'lucide-react';

export const FinanceModule: React.FC = () => {
  const {
    finance,
    journalEntries,
    addFinanceEntry,
    sales,
    invoicesDue,
    invoicesReceivable,
    markInvoicePaid,
    theme,
    language,
    activeNeonCards,
    setActiveNeonCard,
    employees,
    isPayrollSynced,
    lastPayrollSyncTime,
    syncPayrollToFinance,
    activeShift,
  } = useApp();

  const isLight = theme === 'light';
  const isEn = language === 'en';

  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [category, setCategory] = useState('Operational');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [accountTarget, setAccountTarget] = useState('Kas Kasir / Laci');
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'INCOME' | 'HPP' | 'EXPENSE' | 'CASH_DRAWER' | 'BANK_QRIS' | 'DOUBLE_ENTRY'>('ALL');
  const [financeMainTab, setFinanceMainTab] = useState<'ledger' | 'ap' | 'ar' | 'reports' | 'cash_reconciliation'>('ledger');

  // Compute live payroll summary from employee roster
  const payrollSummary = useMemo(() => {
    const RATES = {
      kesCompany: 0.04,
      kesEmployee: 0.01,
      tkCompany: 0.0624,
      tkEmployee: 0.03,
    };

    let totalBaseSalary = 0;
    let totalCompanyContribution = 0;
    let totalEmployeeDeductions = 0;
    let totalTakeHomePay = 0;
    let totalBpjsRemittance = 0;
    let activeBpjsStaffCount = 0;

    employees.forEach((emp) => {
      const baseSalary = emp.baseSalary ?? 5000000;
      const isBpjsActive = emp.bpjsEnabled !== false;
      if (isBpjsActive) activeBpjsStaffCount += 1;

      const kesCompany = isBpjsActive ? Math.round(baseSalary * RATES.kesCompany) : 0;
      const kesEmployee = isBpjsActive ? Math.round(baseSalary * RATES.kesEmployee) : 0;
      const tkCompany = isBpjsActive ? Math.round(baseSalary * RATES.tkCompany) : 0;
      const tkEmployee = isBpjsActive ? Math.round(baseSalary * RATES.tkEmployee) : 0;

      const companyBpjs = kesCompany + tkCompany;
      const empDeduct = kesEmployee + tkEmployee;

      totalBaseSalary += baseSalary;
      totalCompanyContribution += companyBpjs;
      totalEmployeeDeductions += empDeduct;
      totalTakeHomePay += (baseSalary - empDeduct);
      totalBpjsRemittance += (companyBpjs + empDeduct);
    });

    return {
      totalStaffCount: employees.length,
      activeBpjsStaffCount,
      totalBaseSalary,
      totalCompanyContribution,
      totalEmployeeDeductions,
      totalTakeHomePay,
      totalBpjsRemittance,
      period: isEn ? 'September 2026' : 'September 2026',
    };
  }, [employees, isEn]);

  const handleSyncPayroll = () => {
    syncPayrollToFinance(payrollSummary);
  };

  // =========================================================================
  // KALKULASI KEUANGAN REALTIME: KAS MASUK, HPP RESEP, & LABA KOTOR RIIL
  // =========================================================================

  // 1. Total Kas Masuk / Pendapatan (INCOME + IN / PENDAPATAN)
  const totalIncome = useMemo(() => {
    return finance
      .filter((f) => f.type === 'INCOME' || f.type === 'IN / PENDAPATAN')
      .reduce((acc, f) => acc + f.amount, 0);
  }, [finance]);

  // 2. Total Akumulasi Modal HPP Resep Bahan Baku / Barang Keluar
  const totalHpp = useMemo(() => {
    return finance
      .filter((f) => f.type === 'HPP / BEBAN POKOK')
      .reduce((acc, f) => acc + f.amount, 0);
  }, [finance]);

  // 3. Total Beban Kas Operasional
  const totalOperationalExpense = useMemo(() => {
    return finance
      .filter((f) => f.type === 'EXPENSE')
      .reduce((acc, f) => acc + f.amount, 0);
  }, [finance]);

  const totalExpense = totalOperationalExpense + totalHpp;

  // 4. Perhitungan Laba Kotor Riil (Omzet Penjualan vs Total HPP Resep)
  const grossProfitReal = Math.max(0, totalIncome - totalHpp);
  const grossProfitMargin = totalIncome > 0
    ? Math.round((grossProfitReal / totalIncome) * 1000) / 10
    : 0;

  // 5. Saldo Kas Kasir & Bank QRIS Realtime
  const cashDrawerBalance = useMemo(() => {
    return finance
      .filter(
        (f) =>
          f.account_target === 'Kas Kasir / Laci' ||
          f.account_target?.includes('Kas') ||
          (f.payment_method === 'CASH' && f.type !== 'HPP / BEBAN POKOK') ||
          (f.payment_method?.includes('Kas') && f.type !== 'HPP / BEBAN POKOK')
      )
      .reduce((acc, f) => {
        if (f.type === 'INCOME' || f.type === 'IN / PENDAPATAN') return acc + f.amount;
        if (f.type === 'EXPENSE') return acc - f.amount;
        return acc;
      }, 0);
  }, [finance]);

  const qrisBankBalance = useMemo(() => {
    return finance
      .filter(
        (f) =>
          f.account_target === 'Bank QRIS / Settlement' ||
          f.account_target?.includes('Bank') ||
          ((f.payment_method === 'QRIS' ||
            f.payment_method === 'EDC_DEBIT' ||
            f.payment_method === 'EDC_CREDIT' ||
            f.payment_method === 'TRANSFER' ||
            f.payment_method?.includes('Bank')) &&
            f.type !== 'HPP / BEBAN POKOK')
      )
      .reduce((acc, f) => {
        if (f.type === 'INCOME' || f.type === 'IN / PENDAPATAN') return acc + f.amount;
        if (f.type === 'EXPENSE') return acc - f.amount;
        return acc;
      }, 0);
  }, [finance]);

  const liquidCashBalance = cashDrawerBalance + qrisBankBalance;
  const netCashFlow = totalIncome - totalOperationalExpense;

  // 6. Arus Kas Harian secara realtime (Live Today atau Tanggal Terakhir Aktif)
  const dailyCashFlow = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const hasTodayEntries = finance.some((f) => f.date === today);
    const activeDate = hasTodayEntries ? today : (finance[0]?.date || today);

    const todayInflow = finance
      .filter((f) => f.date === activeDate && (f.type === 'INCOME' || f.type === 'IN / PENDAPATAN'))
      .reduce((acc, f) => acc + f.amount, 0);
    const todayHpp = finance
      .filter((f) => f.date === activeDate && f.type === 'HPP / BEBAN POKOK')
      .reduce((acc, f) => acc + f.amount, 0);
    const todayExpense = finance
      .filter((f) => f.date === activeDate && f.type === 'EXPENSE')
      .reduce((acc, f) => acc + f.amount, 0);
    const todayNet = todayInflow - todayExpense;
    return {
      activeDate,
      isLiveToday: activeDate === today,
      inflow: todayInflow,
      hpp: todayHpp,
      expense: todayExpense,
      net: todayNet,
      grossProfit: Math.max(0, todayInflow - todayHpp),
    };
  }, [finance]);

  // Total AP (Utang Usaha dari Supplier Invoices + BPJS Payable)
  const totalAP = useMemo(() => {
    return invoicesDue
      .filter((inv) => inv.status === 'Unpaid')
      .reduce((acc, inv) => acc + inv.amount, 0);
  }, [invoicesDue]);

  // Payment methods recap from sales
  const paymentRecap = useMemo(() => {
    const map: Record<string, number> = {
      CASH: 0,
      QRIS: 0,
      EDC_DEBIT: 0,
      EDC_CREDIT: 0,
      TRANSFER: 0,
    };
    sales.forEach((s) => {
      if (map[s.payment_method] !== undefined) {
        map[s.payment_method] += s.total_amount;
      }
    });
    return map;
  }, [sales]);

  // 4 Financial Neon Metric Cards with standardized bilingual labels
  const financialCards = [
    {
      id: 'cash-balance',
      title: isEn ? 'Liquid Cash Balance' : 'Saldo Kas & Bank Likuid',
      value: `Rp ${liquidCashBalance.toLocaleString('id-ID')}`,
      sub: isEn
        ? `Drawer: Rp ${cashDrawerBalance.toLocaleString('id-ID')} • QRIS/Bank: Rp ${qrisBankBalance.toLocaleString('id-ID')}`
        : `Laci: Rp ${cashDrawerBalance.toLocaleString('id-ID')} • Bank QRIS: Rp ${qrisBankBalance.toLocaleString('id-ID')}`,
      colorHex: '#10B981',
      icon: Wallet,
      focusDesc: isEn
        ? 'Real liquid cash from cash drawer and bank QRIS settlement accounts.'
        : 'Fokus Analisis: Saldo likuid kasir fisik (Cash Drawer) dan settlement bank/QRIS secara realtime.',
    },
    {
      id: 'gross-profit',
      title: isEn ? 'Real Gross Profit (Revenue vs COGS)' : 'Laba Kotor Riil (Omzet vs HPP)',
      value: `Rp ${grossProfitReal.toLocaleString('id-ID')}`,
      sub: isEn
        ? `Gross Margin ${grossProfitMargin}% • Total HPP: Rp ${totalHpp.toLocaleString('id-ID')}`
        : `Margin ${grossProfitMargin}% • Total HPP: Rp ${totalHpp.toLocaleString('id-ID')}`,
      colorHex: '#00f2fe',
      icon: TrendingUp,
      focusDesc: isEn
        ? 'Real profit margin comparing cash register revenue against recipe-based COGS.'
        : 'Fokus Analisis: Selisih riil Omzet Penjualan Kasir terhadap Beban Pokok Penjualan (HPP Resep BOM F&B).',
    },
    {
      id: 'ap',
      title: isEn ? 'Accounts Payable (AP)' : 'Hutang Usaha (AP)',
      value: `Rp ${totalAP.toLocaleString('id-ID')}`,
      sub: isEn
        ? `${invoicesDue.filter((i) => i.status === 'Unpaid').length} Outstanding Due Invoices / Remittances`
        : `${invoicesDue.filter((i) => i.status === 'Unpaid').length} Invoice Jatuh Tempo Supplier & BPJS`,
      colorHex: '#f43f5e',
      icon: ArrowDownRight,
      focusDesc: isEn
        ? 'Analytical Focus: Obligations for verified procurement suppliers & BPJS remittance payable.'
        : 'Fokus Analisis: Rekapitulasi kewajiban utang dagang pengadaan barang & setoran BPJS.',
    },
    {
      id: 'cash-flow',
      title: isEn ? 'Daily Flow & General Ledger' : 'Arus Kas Harian & Jurnal',
      value: `+Rp ${dailyCashFlow.inflow.toLocaleString('id-ID')}`,
      sub: isEn
        ? `Today Net: Rp ${dailyCashFlow.net.toLocaleString('id-ID')} (${finance.length} Transactions)`
        : `Net Hari Ini: Rp ${dailyCashFlow.net.toLocaleString('id-ID')} (${finance.length} Jurnal)`,
      colorHex: '#8b5cf6',
      icon: CreditCard,
      focusDesc: isEn
        ? 'Analytical Focus: General Ledger bookkeeping, auto-journal cash in, and daily cash flow.'
        : 'Fokus Analisis: Pembukuan arus kas harian realtime, mutasi otomatis kasir dan buku besar.',
    },
  ];

  const selectedCardId = activeNeonCards['finance'] || 'cash-balance';
  const selectedFinancialCard =
    financialCards.find((c) => c.id === selectedCardId) || financialCards[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    addFinanceEntry({
      date: new Date().toISOString().slice(0, 10),
      type: entryType,
      category,
      description,
      amount,
      reference: `MAN-${Date.now().toString().slice(-4)}`,
      payment_method: paymentMethod,
      account_target: accountTarget,
    });

    setDescription('');
    setAmount(0);
    setIsModalOpen(false);
  };

  // Filtered General Ledger Entries
  const filteredFinance = useMemo(() => {
    return finance.filter((f) => {
      if (ledgerFilter === 'INCOME') return f.type === 'INCOME' || f.type === 'IN / PENDAPATAN';
      if (ledgerFilter === 'HPP') return f.type === 'HPP / BEBAN POKOK';
      if (ledgerFilter === 'EXPENSE') return f.type === 'EXPENSE';
      if (ledgerFilter === 'CASH_DRAWER')
        return (
          f.account_target === 'Kas Kasir / Laci' ||
          f.account_target?.includes('Kas') ||
          f.payment_method === 'CASH' ||
          f.payment_method?.includes('Kas')
        );
      if (ledgerFilter === 'BANK_QRIS')
        return (
          f.account_target === 'Bank QRIS / Settlement' ||
          f.account_target?.includes('Bank') ||
          f.payment_method === 'QRIS' ||
          f.payment_method === 'EDC_DEBIT' ||
          f.payment_method === 'TRANSFER' ||
          f.payment_method?.includes('Bank')
        );
      return true;
    });
  }, [finance, ledgerFilter]);

  const inCount = useMemo(() => finance.filter((f) => f.type === 'INCOME' || f.type === 'IN / PENDAPATAN').length, [finance]);
  const hppCount = useMemo(() => finance.filter((f) => f.type === 'HPP / BEBAN POKOK').length, [finance]);
  const expCount = useMemo(() => finance.filter((f) => f.type === 'EXPENSE').length, [finance]);

  return (
    <div id="finance-module" className="space-y-6 max-w-7xl mx-auto pb-6">
      {/* Header */}
      <div
        className={`p-5 rounded-2xl border transition duration-200 ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#f59e0b]/15 border border-[#f59e0b]/40 text-[#f59e0b] text-[11px] font-bold mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>{isEn ? 'Finance & Accounting • Integrated ERP Ledger' : 'Finance & Accounting • Tata Kelola Keuangan Terpadu'}</span>
            </div>
            <h2
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {isEn ? 'Finance & Accounting Management' : 'Pusat Keuangan & Akuntansi Enterprise'}
            </h2>
            <p className="text-xs text-[#8b949e]">
              {isEn
                ? 'Automated Cash In, Recipe COGS auto-journal, real gross profit KPI, and live liquid cash drawer tracking.'
                : 'Otomatisasi kasir masuk (Cash In), jurnal HPP resep BOM F&B, analisis laba kotor riil, dan mutasi saldo laci kasir realtime.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sync Payroll to Finance Button */}
            <div className="flex items-center gap-2">
              {isPayrollSynced && (
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-800 border-slate-200'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Payroll Synced' : 'Gaji Disinkronkan'}</span>
                </div>
              )}
              <button
                type="button"
                id="btn-sync-payroll-finance-page"
                onClick={handleSyncPayroll}
                className={`flex items-center gap-1.5 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer active:scale-95 ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 shadow-sm'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                }`}
                title={
                  isEn
                    ? 'Book Salary Expense, Company BPJS Expense, and BPJS Payable'
                    : 'Bukukan Beban Gaji, Beban BPJS Perusahaan, dan Hutang Iuran BPJS'
                }
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isPayrollSynced
                    ? isEn
                      ? 'Re-Sync Payroll Journal'
                      : 'Kirim Ulang Jurnal Penggajian'
                    : isEn
                    ? 'Sync Payroll to Finance'
                    : 'Kirim Jurnal Penggajian ke Keuangan'}
                </span>
              </button>
            </div>

            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                isLight ? 'bg-slate-50 border-slate-200' : ''
              }`}
              style={{
                borderColor: isLight ? undefined : `${selectedFinancialCard.colorHex}60`,
                backgroundColor: isLight ? undefined : `${selectedFinancialCard.colorHex}15`,
                color: isLight ? '#0f172a' : selectedFinancialCard.colorHex,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedFinancialCard.colorHex }}
              />
              <span>{isEn ? 'Focus' : 'Fokus'}: {selectedFinancialCard.title}</span>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-sm'
                  : 'bg-[#0052FF] hover:bg-[#0043d1] text-white shadow-[0_0_15px_rgba(0,82,255,0.4)]'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{isEn ? 'Add Cash Entry' : 'Tambah Transaksi Kas'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 NEON FINANCIAL METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {financialCards.map((card) => {
          const Icon = card.icon;
          const isSelected = selectedCardId === card.id;
          const isHovered = hoveredCardId === card.id;
          const glowStyle = getReactiveNeonGlowStyle(
            card.colorHex,
            isSelected,
            isHovered,
            isLight
          );

          return (
            <button
              key={card.id}
              id={`finance-card-${card.id}`}
              onClick={() => {
                setActiveNeonCard('finance', card.id);
                if (card.id === 'ap') setFinanceMainTab('ap');
              }}
              onMouseEnter={() => setHoveredCardId(card.id)}
              onMouseLeave={() => setHoveredCardId(null)}
              style={glowStyle}
              className="relative p-4 rounded-2xl text-left cursor-pointer overflow-hidden flex flex-col justify-between min-h-[140px] transition-all duration-150 ease-out"
            >
              {/* Top Accent Strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-150 ease-out"
                style={{
                  backgroundColor: card.colorHex,
                  boxShadow: !isLight && (isSelected || isHovered) ? `0 0 16px ${card.colorHex}` : 'none',
                }}
              />

              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: isSelected ? card.colorHex : '#8b949e' }}
                >
                  {card.title}
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: isLight ? '#f1f5f9' : `${card.colorHex}20`,
                    color: isLight ? '#0f172a' : card.colorHex,
                    border: isLight ? '1px solid #e2e8f0' : `1px solid ${card.colorHex}40`,
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2">
                <div
                  className={`text-lg sm:text-xl font-black font-mono tracking-tight ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                  style={{ color: isSelected ? card.colorHex : undefined }}
                >
                  {card.value}
                </div>
                <div className="text-[11px] text-[#8b949e] font-medium mt-1 truncate">
                  {card.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* DYNAMIC FINANCIAL FOCUS ANALYSIS PANEL */}
      <div
        className={`p-5 rounded-2xl border transition duration-200 ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#30363d]/50 mb-4">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedFinancialCard.colorHex }}
            />
            <h3
              className={`font-black text-base ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Fokus Analisis: {selectedFinancialCard.title}
            </h3>
          </div>
          <span className="text-xs text-[#8b949e] hidden sm:inline">
            {selectedFinancialCard.focusDesc}
          </span>
        </div>

        {/* 1. Cash Balance Focus */}
        {selectedCardId === 'cash-balance' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  isLight ? 'bg-white border-slate-300 shadow-xs' : 'bg-[#0d1117] border-emerald-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-gray-400'}`}>Kas Kasir / Laci (Drawer)</span>
                  <span className="bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs px-2 py-0.5 rounded-full uppercase dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                    Tunai Kasir
                  </span>
                </div>
                <div className={`text-lg font-black font-mono mt-2 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  Rp {cashDrawerBalance.toLocaleString('id-ID')}
                </div>
                <div className="text-slate-800 font-medium text-xs mt-1 dark:text-slate-300">
                  Uang tunai fisik siap setor / register drawer
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  isLight ? 'bg-white border-slate-300 shadow-xs' : 'bg-[#0d1117] border-cyan-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-gray-400'}`}>Bank QRIS / Settlement</span>
                  <span className="bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs px-2 py-0.5 rounded-full uppercase dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                    Non-Tunai
                  </span>
                </div>
                <div className={`text-lg font-black font-mono mt-2 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  Rp {qrisBankBalance.toLocaleString('id-ID')}
                </div>
                <div className="text-slate-800 font-medium text-xs mt-1 dark:text-slate-300">
                  Penerimaan QRIS &amp; EDC EDC merchant
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  isLight ? 'bg-white border-slate-300 shadow-xs' : 'bg-[#0d1117] border-amber-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-gray-400'}`}>Total Kas Masuk Hari Ini</span>
                  <span className="bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs px-2 py-0.5 rounded-full uppercase dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                    Hari Ini
                  </span>
                </div>
                <div className={`text-lg font-black font-mono mt-2 ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                  Rp {dailyCashFlow.inflow.toLocaleString('id-ID')}
                </div>
                <div className="text-slate-800 font-medium text-xs mt-1 dark:text-slate-300">
                  Akumulasi penjualan kasir tanggal hari ini
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  isLight ? 'bg-white border-slate-300 shadow-xs' : 'bg-[#0d1117] border-purple-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-gray-400'}`}>Arus Kas Bersih (Net)</span>
                  <span className="bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs px-2 py-0.5 rounded-full uppercase dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                    Likuid Net
                  </span>
                </div>
                <div className={`text-lg font-black font-mono mt-2 ${isLight ? 'text-purple-800' : 'text-purple-400'}`}>
                  Rp {dailyCashFlow.net.toLocaleString('id-ID')}
                </div>
                <div className="text-slate-800 font-medium text-xs mt-1 dark:text-slate-300">
                  Inflow hari ini dikurangi pengeluaran operasional
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Real Gross Profit Focus (Omzet vs HPP) */}
        {selectedCardId === 'gross-profit' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div
                className={`p-3.5 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-emerald-500/30'
                }`}
              >
                <div className="text-xs text-gray-400">Total Omzet Penjualan (Revenue)</div>
                <div className="text-base sm:text-lg font-black font-mono text-emerald-400 mt-1">
                  Rp {totalIncome.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Kasir masuk dari struk penjualan resmi
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-amber-500/30'
                }`}
              >
                <div className="text-xs text-gray-400">Akumulasi Beban Pokok (HPP Resep)</div>
                <div className="text-base sm:text-lg font-black font-mono text-amber-400 mt-1">
                  Rp {totalHpp.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  BOM Bahan Baku + Susut (5%) + Kemasan
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-cyan-500/30'
                }`}
              >
                <div className="text-xs text-gray-400">Laba Kotor Riil (Gross Profit)</div>
                <div className="text-base sm:text-lg font-black font-mono text-cyan-400 mt-1">
                  Rp {grossProfitReal.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-cyan-400 mt-1">
                  Selisih Bersih (Omzet dikurangi HPP)
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-purple-500/30'
                }`}
              >
                <div className="text-xs text-gray-400">Margin Laba Kotor (Gross Margin)</div>
                <div className="text-base sm:text-lg font-black font-mono text-purple-400 mt-1">
                  {grossProfitMargin}%
                </div>
                <div className="text-[10px] text-emerald-400 mt-1">
                  {grossProfitMargin >= 50
                    ? '✓ Performa Margin Sangat Sehat'
                    : grossProfitMargin >= 35
                    ? '✓ Margin Moderat Sesuai Target'
                    : '⚠ Perlu Evaluasi Biaya Resep'}
                </div>
              </div>
            </div>

            {/* Visual Comparative Bar */}
            <div className="p-3.5 rounded-xl border bg-black/20 border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-300">
                  Komparasi Proporsi: HPP ({totalIncome > 0 ? Math.round((totalHpp / totalIncome) * 100) : 0}%) vs Laba Kotor ({grossProfitMargin}%)
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  Basis Omzet Rp {totalIncome.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-gray-800 overflow-hidden flex">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${totalIncome > 0 ? Math.min(100, Math.round((totalHpp / totalIncome) * 100)) : 0}%` }}
                  title={`HPP Resep: Rp ${totalHpp.toLocaleString('id-ID')}`}
                />
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, 100 - (totalIncome > 0 ? Math.round((totalHpp / totalIncome) * 100) : 0))}%` }}
                  title={`Laba Kotor: Rp ${grossProfitReal.toLocaleString('id-ID')}`}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Beban Pokok Resep (HPP Bahan, Susut, Kemasan)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                  Laba Kotor Riil (Gross Profit Kasir)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Total AP (Utang) Focus & Settlement */}
        {selectedCardId === 'ap' && (
          <AccountsPayableTab isLight={isLight} />
        )}

        {/* 4. Cash Flow Focus */}
        {selectedCardId === 'cash-flow' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div
                className={`p-3 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <span className="text-[#8b949e]">Total Pemasukan (Debit)</span>
                <div className="text-lg font-black font-mono text-[#10B981] mt-1">
                  Rp {totalIncome.toLocaleString('id-ID')}
                </div>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <span className="text-[#8b949e]">Total Beban Pokok (HPP)</span>
                <div className="text-lg font-black font-mono text-amber-400 mt-1">
                  Rp {totalHpp.toLocaleString('id-ID')}
                </div>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <span className="text-[#8b949e]">Saldo Bersih Buku Kas</span>
                <div className="text-lg font-black font-mono text-[#8b5cf6] mt-1">
                  Rp {netCashFlow.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FINANCE MAIN NAVIGATION TABS */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-[#30363d]/50 pb-2`}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="tab-btn-finance-ledger"
            onClick={() => setFinanceMainTab('ledger')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              financeMainTab === 'ledger'
                ? isLight
                  ? 'bg-white border border-slate-200 text-blue-600 shadow-sm'
                  : 'bg-[#0052FF] text-white shadow-[0_0_12px_rgba(0,82,255,0.4)]'
                : isLight
                ? 'border border-slate-300 bg-slate-50 text-slate-800 font-semibold text-xs hover:bg-slate-100'
                : 'text-gray-400 hover:text-white bg-slate-800/40 border border-slate-700/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Buku Besar & Kas ({finance.length})</span>
          </button>

          <button
            type="button"
            id="tab-btn-finance-ap"
            onClick={() => setFinanceMainTab('ap')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              financeMainTab === 'ap'
                ? isLight
                  ? 'bg-white border border-slate-200 text-rose-600 shadow-sm'
                  : 'bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                : isLight
                ? 'border border-slate-300 bg-slate-50 text-slate-800 font-semibold text-xs hover:bg-slate-100'
                : 'text-gray-400 hover:text-white bg-slate-800/40 border border-slate-700/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Hutang Dagang (AP)</span>
            {invoicesDue.filter((i) => (i.type === 'PAYABLE' || !i.type) && (i.status === 'Unpaid' || i.status === 'Overdue')).length > 0 && (
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold border ${
                isLight ? 'bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {invoicesDue.filter((i) => (i.type === 'PAYABLE' || !i.type) && (i.status === 'Unpaid' || i.status === 'Overdue')).length} Belum Bayar
              </span>
            )}
          </button>

          <button
            type="button"
            id="tab-btn-finance-ar"
            onClick={() => setFinanceMainTab('ar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              financeMainTab === 'ar'
                ? isLight
                  ? 'bg-white border border-slate-200 text-purple-600 shadow-sm'
                  : 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : isLight
                ? 'border border-slate-300 bg-slate-50 text-slate-800 font-semibold text-xs hover:bg-slate-100'
                : 'text-gray-400 hover:text-white bg-slate-800/40 border border-slate-700/60'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Piutang Usaha (AR)</span>
            {invoicesReceivable.filter((i) => i.status === 'Unpaid' || i.status === 'Overdue').length > 0 && (
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold border ${
                isLight ? 'bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs' : 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
              }`}>
                {invoicesReceivable.filter((i) => i.status === 'Unpaid' || i.status === 'Overdue').length} Belum Lunas
              </span>
            )}
          </button>

          <button
            type="button"
            id="tab-btn-finance-reports"
            onClick={() => setFinanceMainTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              financeMainTab === 'reports'
                ? isLight
                  ? 'bg-white border border-slate-200 text-emerald-600 shadow-sm'
                  : 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : isLight
                ? 'border border-slate-300 bg-slate-50 text-slate-800 font-semibold text-xs hover:bg-slate-100'
                : 'text-gray-400 hover:text-white bg-slate-800/40 border border-slate-700/60'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Laporan Keuangan &amp; Neraca Saldo</span>
          </button>

          <button
            type="button"
            id="tab-btn-finance-cash-reconciliation"
            onClick={() => setFinanceMainTab('cash_reconciliation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              financeMainTab === 'cash_reconciliation'
                ? isLight
                  ? 'bg-white border border-slate-200 text-teal-600 shadow-sm'
                  : 'bg-teal-600 text-white shadow-[0_0_12px_rgba(20,184,166,0.4)]'
                : isLight
                ? 'border border-slate-300 bg-slate-50 text-slate-800 font-semibold text-xs hover:bg-slate-100'
                : 'text-gray-400 hover:text-white bg-slate-800/40 border border-slate-700/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Rekonsiliasi Kas &amp; Tutup Shift</span>
            {activeShift && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Shift Kasir Aktif" />
            )}
          </button>
        </div>
      </div>

      {financeMainTab === 'ap' && (
        <AccountsPayableTab isLight={isLight} />
      )}

      {financeMainTab === 'ar' && (
        <AccountsReceivableTab isLight={isLight} />
      )}

      {financeMainTab === 'reports' && (
        <FinancialReportsTab isLight={isLight} />
      )}

      {financeMainTab === 'cash_reconciliation' && (
        <CashReconciliationTab isLight={isLight} />
      )}

      {/* Journal Table (General Ledger) */}
      {financeMainTab === 'ledger' && (
      <div
        className={`rounded-2xl border overflow-hidden shadow-lg transition duration-200 ${
          isLight
            ? 'bg-white border-slate-200'
            : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="p-4 border-b border-[#30363d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3
              className={`font-bold text-sm ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Jurnal Transaksi Kas Masuk, HPP & Beban (General Ledger)
            </h3>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Pencatatan otomatis penerimaan kasir, mutasi HPP bahan baku, dan pengeluaran operasional
            </p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLedgerFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                ledgerFilter === 'ALL'
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-transparent text-gray-400 border-gray-800 hover:text-white'
              }`}
            >
              Semua ({finance.length})
            </button>
            <button
              type="button"
              onClick={() => setLedgerFilter('INCOME')}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1 ${
                ledgerFilter === 'INCOME'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-transparent text-gray-400 border-gray-800 hover:text-emerald-400'
              }`}
            >
              <span>Kas Masuk</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/30 text-emerald-300 font-bold">
                {inCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setLedgerFilter('HPP')}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1 ${
                ledgerFilter === 'HPP'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                  : 'bg-transparent text-gray-400 border-gray-800 hover:text-amber-400'
              }`}
            >
              <span>HPP Resep</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/30 text-amber-300 font-bold">
                {hppCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setLedgerFilter('EXPENSE')}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1 ${
                ledgerFilter === 'EXPENSE'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                  : 'bg-transparent text-gray-400 border-gray-800 hover:text-rose-400'
              }`}
            >
              <span>Biaya Operasional</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500/30 text-rose-300 font-bold">
                {expCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setLedgerFilter('CASH_DRAWER')}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                ledgerFilter === 'CASH_DRAWER'
                  ? 'bg-teal-500/20 text-teal-400 border-teal-500/50'
                  : 'bg-transparent text-gray-400 border-gray-800 hover:text-teal-400'
              }`}
            >
              Laci Kasir
            </button>
            <button
              type="button"
              onClick={() => setLedgerFilter('BANK_QRIS')}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                ledgerFilter === 'BANK_QRIS'
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                  : 'bg-transparent text-gray-400 border-gray-800 hover:text-cyan-400'
              }`}
            >
              Bank QRIS
            </button>
            <button
              type="button"
              onClick={() => setLedgerFilter('DOUBLE_ENTRY')}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                ledgerFilter === 'DOUBLE_ENTRY'
                  ? 'bg-purple-500/25 text-purple-300 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : 'bg-transparent text-gray-400 border-gray-800 hover:text-purple-300'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-purple-400" />
              <span>Jurnal Umum Ganda (APS POS5)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-purple-500/30 text-purple-200 font-bold">
                {journalEntries.length}
              </span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {ledgerFilter === 'DOUBLE_ENTRY' ? (
            <table className="w-full text-left text-xs">
              <thead
                className={`font-semibold border-b uppercase tracking-wider text-[11px] ${
                  isLight
                    ? 'bg-purple-50 text-purple-900 border-purple-200'
                    : 'bg-[#12161c] text-purple-300 border-[#30363d]'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">Ref Nota / Transaksi</th>
                  <th className="py-3 px-4">Tanggal & Jam</th>
                  <th className="py-3 px-4">Kode Akun</th>
                  <th className="py-3 px-4">Nama Akun Buku Besar</th>
                  <th className="py-3 px-4">Deskripsi / Keterangan</th>
                  <th className="py-3 px-4 text-right">Debit (Rp)</th>
                  <th className="py-3 px-4 text-right">Kredit (Rp)</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight
                    ? 'divide-slate-200 text-slate-800'
                    : 'divide-[#30363d] text-gray-300'
                }`}
              >
                {journalEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      Belum ada Jurnal Umum Ganda POS tercatat. Lakukan transaksi kasir untuk membukukan otomatis.
                    </td>
                  </tr>
                ) : (
                  journalEntries.map((jrn, jIdx) =>
                    jrn.lines.map((line, lIdx) => (
                      <tr
                        key={`${jrn.id || 'JRN'}-${jIdx}-${lIdx}`}
                        className={`transition ${
                          isLight
                            ? lIdx === 0
                              ? 'bg-slate-50/60 hover:bg-slate-100'
                              : 'hover:bg-slate-50'
                            : lIdx === 0
                            ? 'bg-[#1c2128]/40 hover:bg-[#21262d]/60'
                            : 'hover:bg-[#161b22]'
                        }`}
                      >
                        <td className="py-2.5 px-4 font-mono font-semibold">
                          {lIdx === 0 ? (
                            <span className={isLight ? 'text-slate-900' : 'text-white'}>
                              {jrn.reference || jrn.id}
                            </span>
                          ) : (
                            <span className="text-gray-500 pl-4">↳</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-gray-400 whitespace-nowrap">
                          {lIdx === 0 ? jrn.date : ''}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              line.accountCode === '1-10000'
                                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                                : line.accountCode === '1-10001'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : line.accountCode === '1-10002'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                                : line.accountCode === '4-10001'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                : line.accountCode === '4-10002'
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                                : line.accountCode === '5-10001'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : line.accountCode === '1-10501'
                                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                                : line.accountCode === '1-10509'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                                : line.accountCode === '2-10001'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : line.accountCode === '5-10999'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : line.accountCode === '4-10999'
                                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                                : 'bg-gray-700 text-gray-200'
                            }`}
                          >
                            {line.accountCode}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold whitespace-nowrap">
                          <span className={line.debit > 0 ? 'text-emerald-400' : 'text-blue-400 pl-3'}>
                            {line.accountName}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-400 max-w-xs truncate" title={jrn.description}>
                          {lIdx === 0 ? jrn.description : ''}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                          {line.debit > 0 ? `Rp ${line.debit.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-400 whitespace-nowrap">
                          {line.credit > 0 ? `Rp ${line.credit.toLocaleString('id-ID')}` : '-'}
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead
                className={`font-semibold border-b uppercase tracking-wider text-[11px] ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">Ref ID / No Nota</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Tipe Jurnal</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Akun Tujuan (COA)</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4">Metode</th>
                  <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight
                    ? 'divide-slate-200 text-slate-800'
                    : 'divide-[#30363d] text-gray-300'
                }`}
              >
                {filteredFinance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      Tidak ada transaksi jurnal pada filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredFinance.map((entry, idx) => {
                    const isInflow = entry.type === 'INCOME' || entry.type === 'IN / PENDAPATAN';
                    const isHpp = entry.type === 'HPP / BEBAN POKOK';
                    const isExpense = entry.type === 'EXPENSE';

                    return (
                      <tr
                        key={`${entry.id || 'FIN'}-${idx}`}
                        className={`transition ${
                          isLight ? 'hover:bg-slate-50' : 'hover:bg-[#21262d]/50'
                        }`}
                      >
                        <td
                          className={`py-3 px-4 font-mono font-semibold ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          {entry.reference || entry.id}
                        </td>
                        <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                          {entry.date}
                          {entry.created_at && (
                            <div className="text-[10px] text-gray-500 font-mono">
                              {entry.created_at.slice(11, 19)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                              isInflow
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : isHpp
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {isInflow
                              ? 'IN / PENDAPATAN'
                              : isHpp
                              ? 'HPP / BEBAN POKOK'
                              : 'EXPENSE / BIAYA'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-xs px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                            {entry.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                          {entry.account_target ? (
                            <span
                              className={`font-bold text-xs px-2 py-0.5 rounded border ${
                                isLight
                                  ? 'border-slate-300 bg-slate-50 text-slate-900'
                                  : entry.account_target.includes('Laci') || entry.account_target.includes('1-10001')
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                  : entry.account_target.includes('QRIS') || entry.account_target.includes('Bank') || entry.account_target.includes('1-10002')
                                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                                  : entry.account_target.includes('1-10501') || entry.account_target.includes('Persediaan')
                                  ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {entry.account_target}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td
                          className={`py-3 px-4 font-medium max-w-xs truncate ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                          title={entry.description}
                        >
                          {entry.description}
                        </td>
                        <td className="py-3 px-4 text-gray-400 whitespace-nowrap font-mono">
                          {entry.payment_method}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                            isInflow
                              ? 'text-[#10B981]'
                              : isHpp
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {isInflow ? '+Rp ' : isHpp ? 'Rp ' : '-Rp '}
                          {entry.amount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      )}

      {/* Modal Add Finance */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl relative border ${
              isLight
                ? 'bg-white border-slate-300'
                : 'bg-[#161b22] border-[#30363d]'
            }`}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3
              className={`font-bold text-base mb-4 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Catat Transaksi Kas
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEntryType('INCOME')}
                  className={`py-2 rounded-xl font-bold border transition ${
                    entryType === 'INCOME'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-[#0d1117] text-gray-400 border-[#30363d]'
                  }`}
                >
                  Pemasukan (Income)
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('EXPENSE')}
                  className={`py-2 rounded-xl font-bold border transition ${
                    entryType === 'EXPENSE'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : 'bg-[#0d1117] text-gray-400 border-[#30363d]'
                  }`}
                >
                  Pengeluaran (Expense)
                </button>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">
                  Kategori
                </label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white px-3 py-2 rounded-xl outline-none focus:border-[#0052FF]"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">
                  Akun Tujuan / Sumber
                </label>
                <select
                  value={accountTarget}
                  onChange={(e) => setAccountTarget(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white px-3 py-2 rounded-xl outline-none focus:border-[#0052FF]"
                >
                  <option value="Kas Kasir / Laci">Kas Kasir / Laci (Cash Drawer)</option>
                  <option value="Bank QRIS / Settlement">Bank QRIS / Settlement</option>
                  <option value="Bank BCA Giro">Bank BCA Giro</option>
                  <option value="Bank Mandiri Giro">Bank Mandiri Giro</option>
                  <option value="Persediaan Bahan Baku / Gudang">Persediaan Bahan Baku / Gudang</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">
                  Keterangan / Deskripsi
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Pembayaran ATK dan Kertas Struk"
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white px-3 py-2 rounded-xl outline-none focus:border-[#0052FF]"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white px-3 py-2 rounded-xl outline-none focus:border-[#0052FF]"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">
                  Metode Bayar
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white px-3 py-2 rounded-xl outline-none focus:border-[#0052FF]"
                >
                  <option value="CASH">CASH (Tunai)</option>
                  <option value="QRIS">QRIS</option>
                  <option value="EDC_DEBIT">EDC / Debit Bank</option>
                  <option value="TRANSFER">Transfer Bank</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-[#0052FF] hover:bg-[#0043d1] text-white font-bold py-2.5 rounded-xl shadow-lg transition cursor-pointer"
              >
                Simpan Entri Jurnal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceModule;
