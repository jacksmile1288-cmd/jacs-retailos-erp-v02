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
import { getBusinessModelDefinition } from '../../utils/businessDomainConfig';
import {
  belongsToActiveEntity,
  getAdaptiveCoaMeta,
  isSectorRelevantAccount,
  normalizeCanonicalAccountCode,
} from '../../utils/sectorCoaMap';

interface FinancialReportsTabProps {
  isLight?: boolean;
}

type FiscalPeriodFilter =
  | 'FULL_YEAR'
  | 'THIS_MONTH'
  | 'TODAY'
  | 'ALL'
  | 'MONTH_01'
  | 'MONTH_02'
  | 'MONTH_03'
  | 'MONTH_04'
  | 'MONTH_05'
  | 'MONTH_06'
  | 'MONTH_07'
  | 'MONTH_08'
  | 'MONTH_09'
  | 'MONTH_10'
  | 'MONTH_11'
  | 'MONTH_12';

const FISCAL_MONTHS: Array<{ key: FiscalPeriodFilter; num: string; label: string }> = [
  { key: 'MONTH_01', num: '01', label: 'Januari' },
  { key: 'MONTH_02', num: '02', label: 'Februari' },
  { key: 'MONTH_03', num: '03', label: 'Maret' },
  { key: 'MONTH_04', num: '04', label: 'April' },
  { key: 'MONTH_05', num: '05', label: 'Mei' },
  { key: 'MONTH_06', num: '06', label: 'Juni' },
  { key: 'MONTH_07', num: '07', label: 'Juli' },
  { key: 'MONTH_08', num: '08', label: 'Agustus' },
  { key: 'MONTH_09', num: '09', label: 'September' },
  { key: 'MONTH_10', num: '10', label: 'Oktober' },
  { key: 'MONTH_11', num: '11', label: 'November' },
  { key: 'MONTH_12', num: '12', label: 'Desember' },
];

export const FinancialReportsTab: React.FC<FinancialReportsTabProps> = ({ isLight = false }) => {
  const { journalEntries, finance, language, businessProfile, businessDomainConfig, activeSector, isBuilding, isFnb, isLedgerReset } = useApp();
  const isEn = language === 'en';
  const isBuildingBulkActive = isBuilding || businessDomainConfig?.mechanismFamily === 'BUILDING_BULK';
  const fiscalYear = String(new Date().getFullYear());
  const primaryBusinessModel = businessDomainConfig?.primaryBusinessModel || 'MINIMARKET';

  const activePrimaryBusinessSubtitle = useMemo(() => {
    const modelDef = getBusinessModelDefinition(primaryBusinessModel);
    return (
      modelDef?.label?.toUpperCase() ||
      businessProfile?.category?.toUpperCase() ||
      'MINIMARKET'
    );
  }, [primaryBusinessModel, businessProfile?.category]);

  const [activeReport, setActiveReport] = useState<'income_statement' | 'trial_balance'>('income_statement');
  const [periodFilter, setPeriodFilter] = useState<FiscalPeriodFilter>('FULL_YEAR');
  const [sectorFilter] = useState<string>('ALL');
  const [trialBalanceSearch, setTrialBalanceSearch] = useState('');
  const [accountCategoryFilter, setAccountCategoryFilter] = useState<string>('ALL');

  const isFnbCulinaryActive = isFnb || businessDomainConfig?.mechanismFamily === 'FNB_CULINARY';
  const adaptiveCoa = useMemo(() => getAdaptiveCoaMeta(activeSector), [activeSector]);
  const salesRevenueAccountLabel = adaptiveCoa.revenueName;

  const periodFilterLabel = useMemo(() => {
    if (periodFilter === 'FULL_YEAR') return `1 Tahun Penuh (Jan - Des ${fiscalYear})`;
    if (periodFilter === 'ALL') return 'Semua Periode Transaksi';
    if (periodFilter === 'TODAY') return `Hari Ini (${new Date().toISOString().slice(0, 10)})`;
    if (periodFilter === 'THIS_MONTH') {
      const m = FISCAL_MONTHS[new Date().getMonth()];
      return `Bulan Ini (${m ? m.label : ''} ${fiscalYear})`;
    }
    const matched = FISCAL_MONTHS.find((m) => m.key === periodFilter);
    return matched ? `${matched.label} ${fiscalYear}` : `Tahun ${fiscalYear}`;
  }, [periodFilter, fiscalYear]);

  // Account standard naming map (Kanonik & Adaptif per activeSector)
  const accountMasterNames = useMemo<Record<string, { name: string; category: string; normalBalance: 'DEBIT' | 'CREDIT' }>>(
    () => ({
      '1-10000': { name: 'Kas Utama / Brankas', category: 'ASET LANCAR', normalBalance: 'DEBIT' },
      '1-10001': { name: 'Kas Kasir', category: 'ASET LANCAR', normalBalance: 'DEBIT' },
      '1-10002': { name: 'Bank Operasional', category: 'ASET LANCAR', normalBalance: 'DEBIT' },
      '1-10003': { name: 'Bank QRIS', category: 'ASET LANCAR', normalBalance: 'DEBIT' },
      '1-10101': { name: 'Kas Tunai / Kas Kasir', category: 'ASET LANCAR', normalBalance: 'DEBIT' },
      '1-10102': { name: 'Bank / QRIS Operasional', category: 'ASET LANCAR', normalBalance: 'DEBIT' },
      '1-10105': { name: 'Piutang Usaha / Pelanggan (AR)', category: 'ASET LANCAR', normalBalance: 'DEBIT' },
      '1-10201': { name: adaptiveCoa.inventoryName, category: 'ASET LANCAR', normalBalance: 'DEBIT' },
      '1-10301': { name: 'Piutang Usaha', category: 'ASET LANCAR', normalBalance: 'DEBIT' },
      '1-10305': { name: 'Piutang Rebate Supplier (AP Rebate Claimable)', category: 'ASET LANCAR', normalBalance: 'DEBIT' },
      '2-10101': { name: 'Hutang Dagang (AP)', category: 'KEWAJIBAN / HUTANG', normalBalance: 'CREDIT' },
      '2-10002': { name: 'Hutang Gaji & BPJS', category: 'KEWAJIBAN / HUTANG', normalBalance: 'CREDIT' },
      '2-10102': { name: 'Hutang Gaji & BPJS Karyawan', category: 'KEWAJIBAN / HUTANG', normalBalance: 'CREDIT' },
      '2-10201': { name: adaptiveCoa.commissionPayableName, category: 'KEWAJIBAN / HUTANG', normalBalance: 'CREDIT' },
      '2-10301': { name: adaptiveCoa.taxName, category: 'KEWAJIBAN / HUTANG', normalBalance: 'CREDIT' },
      '2-10401': { name: 'Uang Muka (DP) Proyek Kontraktor', category: 'KEWAJIBAN / HUTANG', normalBalance: 'CREDIT' },
      '3-10001': { name: 'Modal Disetor', category: 'EKUITAS / MODAL', normalBalance: 'CREDIT' },
      '3-10002': { name: 'Laba Ditahan', category: 'EKUITAS / MODAL', normalBalance: 'CREDIT' },
      '4-10101': { name: adaptiveCoa.revenueName, category: 'PENDAPATAN', normalBalance: 'CREDIT' },
      '4-10002': { name: 'Retur Penjualan', category: 'PENDAPATAN', normalBalance: 'DEBIT' },
      '4-10004': { name: 'Potongan & Diskon Penjualan Fashion', category: 'PENDAPATAN', normalBalance: 'DEBIT' },
      '4-10102': { name: 'Pendapatan / Titipan Jasa Bongkar Kuli', category: 'PENDAPATAN', normalBalance: 'CREDIT' },
      '4-10105': { name: 'Pendapatan Jasa Laundry', category: 'PENDAPATAN', normalBalance: 'CREDIT' },
      '4-10999': { name: 'Pendapatan Lain-lain / Surplus Kas', category: 'PENDAPATAN', normalBalance: 'CREDIT' },
      '5-10101': { name: adaptiveCoa.cogsName, category: 'BEBAN POKOK (COGS)', normalBalance: 'DEBIT' },
      '5-10002': { name: 'Beban Selisih Kasir', category: 'BEBAN OPERASIONAL', normalBalance: 'DEBIT' },
      '5-10003': { name: 'Beban Kerusakan & Penyesuaian Stok', category: 'BEBAN OPERASIONAL', normalBalance: 'DEBIT' },
      '5-10004': { name: 'Beban Operasional Kasir', category: 'BEBAN OPERASIONAL', normalBalance: 'DEBIT' },
      '5-10005': { name: 'Beban Selisih Stok & Penyusutan Inventaris', category: 'BEBAN OPERASIONAL', normalBalance: 'DEBIT' },
      '5-10201': { name: 'Beban Clearance & Penyelamatan Kadaluarsa (FEFO)', category: 'BEBAN OPERASIONAL', normalBalance: 'DEBIT' },
      '5-10202': { name: 'Beban Promosi & Diskon Penjualan Toko', category: 'BEBAN OPERASIONAL', normalBalance: 'DEBIT' },
      '5-10205': { name: 'Beban Pengiriman Armada (Frangko)', category: 'BEBAN OPERASIONAL', normalBalance: 'DEBIT' },
      '5-10302': { name: 'Beban Selisih / Susut Material Curah', category: 'BEBAN OPERASIONAL', normalBalance: 'DEBIT' },
      '5-10999': { name: 'Beban Selisih Kas / Defisit Kasir', category: 'BEBAN OPERASIONAL', normalBalance: 'DEBIT' },
      '6-10101': { name: adaptiveCoa.commissionExpenseName, category: 'BEBAN OPERASIONAL', normalBalance: 'DEBIT' },
      '7-10002': { name: 'Selisih Kas Operasional', category: 'PENDAPATAN / BEBAN LAINNYA', normalBalance: 'DEBIT' },
    }),
    [adaptiveCoa]
  );

  // Isolasi ketat per entitas & sektor aktif (mencegah kebocoran seed/jurnal sektor lain)
  const entityJournals = useMemo(
    () => (journalEntries || []).filter((j) => belongsToActiveEntity(j, activeSector, businessProfile?.name)),
    [journalEntries, activeSector, businessProfile?.name]
  );

  const entityFinance = useMemo(
    () => (finance || []).filter((f) => belongsToActiveEntity(f, activeSector, businessProfile?.name)),
    [finance, activeSector, businessProfile?.name]
  );

  const matchesPeriodFilter = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const thisMonthPrefix = now.toISOString().slice(0, 7);
    const selectedMonthObj = FISCAL_MONTHS.find((m) => m.key === periodFilter);

    return (rawDate: string): boolean => {
      if (periodFilter === 'ALL') return true;
      const d = (rawDate || '').slice(0, 10);
      if (periodFilter === 'FULL_YEAR') return d.startsWith(fiscalYear);
      if (periodFilter === 'TODAY') return d === todayStr;
      if (periodFilter === 'THIS_MONTH') return d.startsWith(thisMonthPrefix);
      if (selectedMonthObj) return d.startsWith(`${fiscalYear}-${selectedMonthObj.num}`);
      return true;
    };
  }, [periodFilter, fiscalYear]);

  // Filter journals by date period
  const filteredJournals = useMemo(() => {
    return entityJournals.filter((j) => matchesPeriodFilter(j.date || j.created_at?.slice(0, 10) || ''));
  }, [entityJournals, matchesPeriodFilter]);

  // Filter finance entries by date period
  const filteredFinance = useMemo(() => {
    return entityFinance.filter((f) => matchesPeriodFilter((f as any).date?.slice(0, 10) || (f as any).created_at?.slice(0, 10) || ''));
  }, [entityFinance, matchesPeriodFilter]);

  // =========================================================================
  // 1. LAPORAN LABA RUGI (INCOME STATEMENT)
  // Agregasi Pendapatan (4-10101), HPP (5-10101), dan Beban Operasional & Komisi (5-xxxxx / 6-xxxxx)
  // =========================================================================
  const incomeStatementData = useMemo(() => {
    const revenueAccounts: Record<string, { code: string; name: string; amount: number }> = {
      '4-10101': { code: '4-10101', name: adaptiveCoa.revenueName, amount: 0 },
    };
    let totalRevenue = 0;

    let totalCogs = 0;
    const cogsAccounts: Record<string, { code: string; name: string; amount: number }> = {
      '5-10101': { code: '5-10101', name: adaptiveCoa.cogsName, amount: 0 },
    };

    // Initialize expenseAccounts hanya untuk akun beban yang relevan dengan sektor aktif
    const expenseAccounts: Record<string, { code: string; name: string; amount: number }> = {};
    Object.entries(accountMasterNames).forEach(([code, acc]) => {
      if ((code.startsWith('5-') && code !== '5-10101') || code.startsWith('6-')) {
        if (!isSectorRelevantAccount(code, activeSector, primaryBusinessModel)) {
          return;
        }
        expenseAccounts[code] = { code, name: acc.name, amount: 0 };
      }
    });
    let totalOperatingExpenses = 0;

    const getSector = (description: string, category: string) => {
      const text = (description + ' ' + category).toLowerCase();
      if (text.includes('resto') || text.includes('kafe') || text.includes('f&b')) return 'F&B';
      if (text.includes('grosir')) return 'Grosir';
      if (text.includes('jasa') || text.includes('grooming') || text.includes('barber') || text.includes('salon') || text.includes('laundry') || text.includes('stylist')) return 'Jasa';
      return 'Retail Modern';
    };

    const journalizedSalesRefs = new Set<string>();
    const journalizedCogsRefs = new Set<string>();

    filteredJournals.forEach((j) => {
      if (!j.lines || !Array.isArray(j.lines)) return;

      if (j.reference && (j.type === 'POS_SALES' || j.type === 'POS_SERVICE' || j.type === 'POS_LAUNDRY' || j.type === 'POS_FASHION')) {
        journalizedSalesRefs.add(j.reference);
      }
      if (j.reference && (j.type === 'COGS' || j.lines.some((l) => normalizeCanonicalAccountCode(l.accountCode) === '5-10101'))) {
        journalizedCogsRefs.add(j.reference);
      }

      const sector = getSector(j.description, '');
      if (sectorFilter !== 'ALL' && sector !== sectorFilter) return;

      j.lines.forEach((line) => {
        const code = normalizeCanonicalAccountCode(line.accountCode);
        if (!code) return;

        // A. PENDAPATAN (Akun 4-xxxxx -> dikonsolidasikan ke 4-10101 untuk pendapatan utama)
        if (code.startsWith('4-')) {
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

        // B. BEBAN POKOK PENJUALAN / HPP / BAHAN HABIS PAKAI JASA (Kanonik 5-10101)
        else if (code === '5-10101') {
          const netDebit = (line.debit || 0) - (line.credit || 0);
          totalCogs += netDebit;
          cogsAccounts['5-10101'].amount += netDebit;
        }

        // C. BEBAN OPERASIONAL & KOMISI (Akun 5-xxxxx selain HPP & 6-xxxxx)
        else if (code.startsWith('5-') || code.startsWith('6-')) {
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

        // D. PENDAPATAN / BEBAN LAINNYA (Akun 7-xxxxx)
        else if (code.startsWith('7-')) {
          const netCredit = (line.credit || 0) - (line.debit || 0);
          const accInfo = accountMasterNames[code];
          if (netCredit >= 0) {
            totalRevenue += netCredit;
            if (!revenueAccounts[code]) {
              revenueAccounts[code] = {
                code,
                name: accInfo?.name || line.accountName || `Akun ${code}`,
                amount: 0,
              };
            }
            revenueAccounts[code].amount += netCredit;
          } else {
            const absDebit = Math.abs(netCredit);
            totalOperatingExpenses += absDebit;
            if (!expenseAccounts[code]) {
              expenseAccounts[code] = {
                code,
                name: accInfo?.name || line.accountName || `Akun ${code}`,
                amount: 0,
              };
            }
            expenseAccounts[code].amount += absDebit;
          }
        }
      });
    });

    // Also include non-journal entries from the isolated finance array (tanpa double-counting)
    filteredFinance.forEach((f) => {
      const sector = getSector(f.description, f.category);
      if (sectorFilter !== 'ALL' && sector !== sectorFilter) return;

      const isAdjustment = f.reference?.startsWith('ADJ-') || f.category === 'Penyesuaian Stok / Rusak / Hilang';
      const isOperatingExpense = f.type === 'EXPENSE' || f.type === 'EXPENSE / BIAYA';
      const isDebtPayment = f.payment_method?.toLowerCase().includes('tempo') || f.payment_method === 'AP' || f.reference?.includes('AP-PAY');
      const idUpper = (f.id || '').toUpperCase();
      const refUpper = (f.reference || '').toUpperCase();
      const catUpper = (f.category || '').toUpperCase();
      const targetCode = normalizeCanonicalAccountCode((f.account_target || '').split('·')[0].trim());

      if (
        isDebtPayment ||
        idUpper === 'FIN-OPENING-001' ||
        idUpper.startsWith('FIN-OPENING') ||
        refUpper.startsWith('CAP-') ||
        catUpper.includes('MODAL KAS') ||
        catUpper.includes('SALDO AWAL') ||
        targetCode.startsWith('1-') ||
        targetCode.startsWith('2-') ||
        targetCode.startsWith('3-') ||
        f.id?.startsWith('FIN-JV-') ||
        f.id?.startsWith('FIN-PRM-') ||
        f.id?.startsWith('FIN-KULI-') ||
        f.id?.startsWith('FIN-FRANGKO-') ||
        f.id?.startsWith('FIN-LND-') ||
        f.id?.startsWith('FIN-SVC-REV-') ||
        f.id?.startsWith('FIN-COMM-') ||
        f.id?.startsWith('FIN-FASH-') ||
        f.id?.startsWith('FIN-EXCH-') ||
        f.id?.startsWith('FIN-VAR-') ||
        f.type === 'PROMO_AUTO' ||
        f.type === 'REBATE_CLAIM'
      ) return;

      if (
        catUpper === 'HPP' ||
        catUpper === 'BEBAN BAHAN HABIS PAKAI JASA' ||
        targetCode === '5-10101'
      ) {
        if (f.reference && journalizedCogsRefs.has(f.reference)) return;
        totalCogs += f.amount;
        cogsAccounts['5-10101'].amount += f.amount;
      } else if (isAdjustment) {
        totalOperatingExpenses += f.amount;
        const code = '5-10005';
        if (!expenseAccounts[code]) {
          expenseAccounts[code] = { code, name: 'Beban Selisih Stok & Penyusutan Inventaris', amount: 0 };
        }
        expenseAccounts[code].amount += f.amount;
      } else if (isOperatingExpense) {
        const code = targetCode || '5-10002';
        if (code.startsWith('5-') || code.startsWith('6-')) {
          totalOperatingExpenses += f.amount;
          if (!expenseAccounts[code]) {
            const accInfo = accountMasterNames[code];
            expenseAccounts[code] = { code, name: accInfo?.name || f.category || 'Beban Operasional', amount: 0 };
          }
          expenseAccounts[code].amount += f.amount;
        }
      } else if (f.type === 'INCOME' || f.type === 'IN / PENDAPATAN') {
        if (f.reference && journalizedSalesRefs.has(f.reference)) return;
        totalRevenue += f.amount;
        const code = targetCode.startsWith('4-') ? targetCode : '4-10101';
        const accInfo = accountMasterNames[code];
        if (!revenueAccounts[code]) {
          revenueAccounts[code] = { code, name: accInfo?.name || salesRevenueAccountLabel, amount: 0 };
        }
        revenueAccounts[code].amount += f.amount;
      }
    });

    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit - totalOperatingExpenses;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      revenueList: Object.values(revenueAccounts)
        .filter((rev) => rev.code === '4-10101' || rev.amount !== 0 || isSectorRelevantAccount(rev.code, activeSector, primaryBusinessModel))
        .sort((a, b) => a.code.localeCompare(b.code)),
      totalRevenue,
      cogsList: Object.values(cogsAccounts),
      totalCogs,
      grossProfit,
      grossMarginPct,
      expenseList: Object.values(expenseAccounts)
        .filter((exp) => exp.amount !== 0 || isSectorRelevantAccount(exp.code, activeSector, primaryBusinessModel))
        .sort((a, b) => a.code.localeCompare(b.code)),
      totalOperatingExpenses,
      netProfit,
      netMarginPct,
    };
  }, [filteredJournals, filteredFinance, isBuildingBulkActive, isFnbCulinaryActive, salesRevenueAccountLabel, sectorFilter, accountMasterNames, adaptiveCoa, activeSector, primaryBusinessModel]);

  // =========================================================================
  // 1B. IKHTISAR KINERJA AKUNTANSI 12 BULAN (JAN - DES) TAHUN FISKAL AKTIF
  // =========================================================================
  const monthlyOverviewData = useMemo(() => {
    const rows = FISCAL_MONTHS.map((m) => {
      const monthPrefix = `${fiscalYear}-${m.num}`;
      const mJournals = entityJournals.filter((j) =>
        (j.date || j.created_at?.slice(0, 10) || '').startsWith(monthPrefix)
      );
      const mFinance = entityFinance.filter((f) =>
        ((f as any).date?.slice(0, 10) || (f as any).created_at?.slice(0, 10) || '').startsWith(monthPrefix)
      );

      let revenue = 0;
      let cogs = 0;
      let operatingAndCommission = 0;

      const jSalesRefs = new Set<string>();
      const jCogsRefs = new Set<string>();

      mJournals.forEach((j) => {
        if (!j.lines || !Array.isArray(j.lines)) return;
        if (j.reference && (j.type === 'POS_SALES' || j.type === 'POS_SERVICE' || j.type === 'POS_LAUNDRY' || j.type === 'POS_FASHION')) {
          jSalesRefs.add(j.reference);
        }
        if (j.reference && (j.type === 'COGS' || j.lines.some((l) => normalizeCanonicalAccountCode(l.accountCode) === '5-10101'))) {
          jCogsRefs.add(j.reference);
        }
        j.lines.forEach((line) => {
          const code = normalizeCanonicalAccountCode(line.accountCode);
          if (!code) return;
          if (code.startsWith('4-')) {
            revenue += (line.credit || 0) - (line.debit || 0);
          } else if (code === '5-10101') {
            cogs += (line.debit || 0) - (line.credit || 0);
          } else if (code.startsWith('5-') || code.startsWith('6-')) {
            operatingAndCommission += (line.debit || 0) - (line.credit || 0);
          } else if (code.startsWith('7-')) {
            const netCredit = (line.credit || 0) - (line.debit || 0);
            if (netCredit >= 0) revenue += netCredit;
            else operatingAndCommission += Math.abs(netCredit);
          }
        });
      });

      mFinance.forEach((f) => {
        const isAdjustment = f.reference?.startsWith('ADJ-') || f.category === 'Penyesuaian Stok / Rusak / Hilang';
        const isOperatingExpense = f.type === 'EXPENSE' || f.type === 'EXPENSE / BIAYA';
        const isDebtPayment = f.payment_method?.toLowerCase().includes('tempo') || f.payment_method === 'AP' || f.reference?.includes('AP-PAY');
        const idUpper = (f.id || '').toUpperCase();
        const refUpper = (f.reference || '').toUpperCase();
        const catUpper = (f.category || '').toUpperCase();
        const targetCode = normalizeCanonicalAccountCode((f.account_target || '').split('·')[0].trim());

        if (
          isDebtPayment ||
          idUpper === 'FIN-OPENING-001' ||
          idUpper.startsWith('FIN-OPENING') ||
          refUpper.startsWith('CAP-') ||
          catUpper.includes('MODAL KAS') ||
          catUpper.includes('SALDO AWAL') ||
          targetCode.startsWith('1-') ||
          targetCode.startsWith('2-') ||
          targetCode.startsWith('3-') ||
          f.id?.startsWith('FIN-JV-') ||
          f.id?.startsWith('FIN-PRM-') ||
          f.id?.startsWith('FIN-KULI-') ||
          f.id?.startsWith('FIN-FRANGKO-') ||
          f.id?.startsWith('FIN-LND-') ||
          f.id?.startsWith('FIN-SVC-REV-') ||
          f.id?.startsWith('FIN-COMM-') ||
          f.id?.startsWith('FIN-FASH-') ||
          f.id?.startsWith('FIN-EXCH-') ||
          f.id?.startsWith('FIN-VAR-') ||
          f.type === 'PROMO_AUTO' ||
          f.type === 'REBATE_CLAIM'
        ) return;

        if (catUpper === 'HPP' || catUpper === 'BEBAN BAHAN HABIS PAKAI JASA' || targetCode === '5-10101') {
          if (f.reference && jCogsRefs.has(f.reference)) return;
          cogs += f.amount;
        } else if (isAdjustment) {
          operatingAndCommission += f.amount;
        } else if (isOperatingExpense) {
          const code = targetCode || '5-10002';
          if (code.startsWith('5-') || code.startsWith('6-')) {
            operatingAndCommission += f.amount;
          }
        } else if (f.type === 'INCOME' || f.type === 'IN / PENDAPATAN') {
          if (f.reference && jSalesRefs.has(f.reference)) return;
          revenue += f.amount;
        }
      });

      const netProfit = revenue - cogs - operatingAndCommission;
      return {
        monthKey: m.key,
        monthNum: m.num,
        monthName: m.label,
        revenue,
        cogs,
        operatingAndCommission,
        netProfit,
      };
    });

    const totals = rows.reduce(
      (acc, r) => ({
        revenue: acc.revenue + r.revenue,
        cogs: acc.cogs + r.cogs,
        operatingAndCommission: acc.operatingAndCommission + r.operatingAndCommission,
        netProfit: acc.netProfit + r.netProfit,
      }),
      { revenue: 0, cogs: 0, operatingAndCommission: 0, netProfit: 0 }
    );

    return { rows, totals };
  }, [entityJournals, entityFinance, fiscalYear]);

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

    // Injeksi saldo awal modal dan penyeimbang aset untuk neraca seimbang (hanya jika belum di-reset ke Rp 0)
    if (!isLedgerReset) {
      accountsMap['3-10001'].totalCredit += 500000000; // Modal Awal
      accountsMap['1-10002'].totalDebit += 500000000; // Penyeimbang Kas Bank
    }

    // Akumulasi dari jurnal entries
    filteredJournals.forEach((j) => {
      if (!j.lines || !Array.isArray(j.lines)) return;

      j.lines.forEach((line) => {
        const code = normalizeCanonicalAccountCode(line.accountCode);
        if (!code) return;

        if (!accountsMap[code]) {
          const firstDigit = code.charAt(0);
          let defaultCat = 'LAIN-LAIN';
          if (firstDigit === '1') defaultCat = 'ASET LANCAR';
          else if (firstDigit === '2') defaultCat = 'KEWAJIBAN / HUTANG';
          else if (firstDigit === '3') defaultCat = 'EKUITAS / MODAL';
          else if (firstDigit === '4') defaultCat = 'PENDAPATAN';
          else if (firstDigit === '5') defaultCat = 'BEBAN';
          else if (firstDigit === '6') defaultCat = 'BEBAN OPERASIONAL';
          else if (firstDigit === '7') defaultCat = 'PENDAPATAN / BEBAN LAINNYA';

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
      // Tampilkan akun yang memiliki aktivitas atau struktur COA sektor aktif saat buku besar direset ke Rp 0
      .filter(
        (acc) =>
          acc.totalDebit > 0 ||
          acc.totalCredit > 0 ||
          (isLedgerReset && isSectorRelevantAccount(acc.accountCode, activeSector, primaryBusinessModel))
      )
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
  }, [filteredJournals, accountMasterNames, isLedgerReset, activeSector, primaryBusinessModel]);

  // Filtered trial balance rows
  const displayedTrialBalanceRows = useMemo(() => {
    return trialBalanceData.accountsList.filter((row) => {
      if (accountCategoryFilter !== 'ALL') {
        if (accountCategoryFilter === 'BEBAN') {
          if (!row.category.includes('BEBAN')) return false;
        } else if (row.category !== accountCategoryFilter) {
          return false;
        }
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
        ['Periode:', periodFilterLabel],
        ['Sektor Usaha:', activeSector],
        [''],
        ['KODE AKUN', 'NAMA AKUN', 'KATEGORI', 'JUMLAH (IDR)'],
        ['1. PENDAPATAN (4-10101)'],
        ...incomeStatementData.revenueList.map((r) => [r.code, `"${r.name}"`, 'Pendapatan', r.amount]),
        ['TOTAL PENDAPATAN', '', '', incomeStatementData.totalRevenue],
        [''],
        ['2. HPP / BEBAN POKOK (5-10101)'],
        ...incomeStatementData.cogsList.map((c) => [c.code, `"${c.name}"`, 'HPP', c.amount]),
        ['TOTAL BEBAN POKOK PENJUALAN', '', '', incomeStatementData.totalCogs],
        ['LABA KOTOR (GROSS PROFIT)', '', '', incomeStatementData.grossProfit],
        [''],
        ['3. BEBAN OPERASIONAL & KOMISI (5-XXXXX / 6-XXXXX)'],
        ...incomeStatementData.expenseList.map((e) => [e.code, `"${e.name}"`, 'Beban Operasional', e.amount]),
        ['TOTAL BEBAN OPERASIONAL', '', '', incomeStatementData.totalOperatingExpenses],
        [''],
        ['LABA BERSIH (NET INCOME)', '', '', incomeStatementData.netProfit],
        [''],
        [`IKHTISAR KINERJA AKUNTANSI 12 BULAN (JAN - DES ${fiscalYear})`],
        ['BULAN', 'PENDAPATAN (4-10101)', 'HPP (5-10101)', 'BEBAN OPERASIONAL & KOMISI (6-XXXXX)', 'LABA BERSIH'],
        ...monthlyOverviewData.rows.map((m) => [
          `${m.monthName} ${fiscalYear}`,
          m.revenue,
          m.cogs,
          m.operatingAndCommission,
          m.netProfit,
        ]),
        [
          `TOTAL 1 TAHUN (${fiscalYear})`,
          monthlyOverviewData.totals.revenue,
          monthlyOverviewData.totals.cogs,
          monthlyOverviewData.totals.operatingAndCommission,
          monthlyOverviewData.totals.netProfit,
        ],
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Laba_Rugi_${periodFilter}_${fiscalYear}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const rows = [
        [`NERACA SALDO (TRIAL BALANCE) - ${compName.toUpperCase()}`],
        ['Periode:', periodFilterLabel],
        ['Sektor Usaha:', activeSector],
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
      link.setAttribute('download', `Neraca_Saldo_${periodFilter}_${fiscalYear}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER SECTION: TITLE & REPORT SUB-NAV */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 w-full">
        <div>
          <h2 className="text-xl leading-7 font-medium text-slate-900 dark:text-white truncate">
            {isEn ? 'Financial Reports & Accounting Analytics' : 'Laporan Keuangan & Neraca Saldo'}
          </h2>
          <p className="text-sm leading-5 font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            {isEn
              ? 'Real-time double-entry income statement (P&L) and trial balance from verified journal entries.'
              : 'Agregasi otomatis Laporan Laba Rugi real-time & Neraca Saldo (Trial Balance) seimbang dari buku jurnal.'}
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`p-1 rounded-xl border flex items-center gap-1 transition-all duration-200 ${
              isLight
                ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
                : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveReport('income_statement')}
              className={`px-3 py-1.5 rounded-lg text-sm leading-5 font-medium transition flex items-center gap-1.5 cursor-pointer active:scale-[0.99] ${
                activeReport === 'income_statement'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-gray-300 hover:text-cyan-700 dark:hover:text-cyan-300'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Laba Rugi (P&L)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveReport('trial_balance')}
              className={`px-3 py-1.5 rounded-lg text-sm leading-5 font-medium transition flex items-center gap-1.5 cursor-pointer active:scale-[0.99] ${
                activeReport === 'trial_balance'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-gray-300 hover:text-cyan-700 dark:hover:text-cyan-300'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Neraca Saldo</span>
            </button>
          </div>

          {/* Period Filter Dropdown (1 Tahun Penuh & Bulanan Jan - Des) */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as FiscalPeriodFilter)}
            className="px-3 py-2 rounded-xl text-sm leading-5 font-normal border transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white dark:bg-[#161b22] border-slate-300 dark:border-[#30363d] text-slate-900 dark:text-white"
          >
            <option value="FULL_YEAR">1 Tahun Penuh (Jan - Des {fiscalYear})</option>
            <option value="THIS_MONTH">Bulan Ini</option>
            <option value="TODAY">Hari Ini</option>
            <option value="ALL">Semua Periode</option>
            <optgroup label={`Per Bulan — Tahun Fiskal ${fiscalYear}`}>
              {FISCAL_MONTHS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label} {fiscalYear}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl text-xs leading-5 font-medium border flex items-center gap-1.5 transition cursor-pointer active:scale-[0.99] shadow-sm bg-slate-50 dark:bg-[#21262d] border-slate-300 dark:border-[#30363d] text-slate-800 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-[#30363d]"
            title="Download CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Cetak / Print PDF Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl text-xs leading-5 font-medium border flex items-center gap-1.5 transition cursor-pointer active:scale-[0.99] shadow-sm bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600"
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
          <div className={`p-5 rounded-2xl border print:border-none print:p-0 transition-all duration-200 ${
            isLight
              ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
              : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-medium flex items-center justify-center text-lg shadow-md">
                    {businessProfile?.name?.charAt(0) || 'J'}
                  </div>
                )}
                <div>
                  <span className="text-[11px] leading-4 font-mono font-normal uppercase tracking-widest text-cyan-500">
                    {activePrimaryBusinessSubtitle}
                  </span>
                  <h2 className="text-base leading-6 font-medium tracking-tight text-slate-900 dark:text-white uppercase">
                    {businessProfile?.name || 'JacS Retail & Enterprise Group'}
                  </h2>
                  {(hasValidProfileValue(businessProfile?.address) || hasValidProfileValue(businessProfile?.phone) || hasValidProfileValue(businessProfile?.email)) && (
                    <p className="text-sm leading-5 font-normal text-slate-500 dark:text-gray-400">
                      {[
                        hasValidProfileValue(businessProfile?.address) ? businessProfile!.address : null,
                        hasValidProfileValue(businessProfile?.phone) ? `Telp: ${businessProfile!.phone}` : null,
                        hasValidProfileValue(businessProfile?.email) ? businessProfile!.email : null,
                      ].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  {hasValidProfileValue(businessProfile?.licenseNumber) && (
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {businessProfile!.licenseNumber}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-normal bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  FINANCIAL STATEMENT
                </span>
                <h3 className="font-medium text-sm leading-5 text-slate-900 dark:text-white mt-1">
                  LAPORAN LABA RUGI KOMPREHENSIF
                </h3>
                <p className="text-xs leading-5 text-slate-500 dark:text-gray-400 font-mono font-normal">
                  Periode: {periodFilterLabel}
                </p>
              </div>
            </div>
          </div>

          {/* TOP KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Pendapatan */}
            <div
              className={`p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${
                isLight ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] leading-4 font-mono font-normal uppercase tracking-widest text-slate-500 dark:text-gray-400">
                  Total Pendapatan (4-10101)
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg leading-7 font-mono font-semibold text-slate-900 dark:text-white">
                Rp {incomeStatementData.totalRevenue.toLocaleString('id-ID')}
              </div>
              <span className="text-sm leading-5 font-normal text-slate-500 dark:text-gray-400 mt-1 block truncate">
                {adaptiveCoa.revenueName}
              </span>
            </div>

            {/* Total HPP / COGS */}
            <div
              className={`p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${
                isLight ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] leading-4 font-mono font-normal uppercase tracking-widest text-slate-500 dark:text-gray-400">
                  HPP / Beban Pokok (5-10101)
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg leading-7 font-mono font-semibold text-slate-900 dark:text-white">
                Rp {incomeStatementData.totalCogs.toLocaleString('id-ID')}
              </div>
              <span className="text-sm leading-5 font-normal text-slate-500 dark:text-gray-400 mt-1 block truncate">
                {adaptiveCoa.cogsName}
              </span>
            </div>

            {/* Laba Kotor (Gross Profit) */}
            <div
              className={`p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${
                isLight ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] leading-4 font-mono font-normal uppercase tracking-widest text-slate-500 dark:text-gray-400">
                  Laba Kotor (Gross Profit)
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-lg leading-7 font-mono font-semibold ${incomeStatementData.grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                Rp {incomeStatementData.grossProfit.toLocaleString('id-ID')}
              </div>
              <span className="text-sm leading-5 font-normal text-emerald-600 dark:text-emerald-400 mt-1 block">
                Margin Kotor: {incomeStatementData.grossMarginPct.toFixed(1)}%
              </span>
            </div>

            {/* Laba Bersih (Net Profit) */}
            <div
              className={`p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${
                isLight ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] leading-4 font-mono font-normal uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Laba Bersih (Net Income)
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-lg leading-7 font-mono font-semibold text-emerald-600 dark:text-emerald-400`}>
                Rp {incomeStatementData.netProfit.toLocaleString('id-ID')}
              </div>
              <span className="text-sm leading-5 font-normal text-slate-500 dark:text-gray-400 mt-1 block">
                Net Margin: {incomeStatementData.netMarginPct.toFixed(1)}% (Beban: Rp {incomeStatementData.totalOperatingExpenses.toLocaleString('id-ID')})
              </span>
            </div>
          </div>

          {/* DETAIL BREAKDOWN TABLE: INCOME STATEMENT */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
              isLight ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
            }`}
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#30363d] flex items-center justify-between">
              <div>
                <h3 className="text-base leading-6 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  <span>Struktur Laporan Laba Rugi Komprehensif</span>
                </h3>
                <p className="text-sm leading-5 font-normal text-slate-500 dark:text-gray-400">
                  Sumber data: Mutasi riil buku besar jurnal General Ledger
                </p>
              </div>
              <span className="text-[11px] leading-4 font-mono font-normal px-2.5 py-1 rounded bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300">
                Periode: {periodFilterLabel}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-gray-800/80">
              {/* 1. BAGIAN PENDAPATAN */}
              <div className="p-4 bg-slate-50/70 dark:bg-[#0d1117]/60">
                <div className="flex items-center justify-between text-[11px] leading-4 font-mono font-normal uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-2">
                  <span>1. PENDAPATAN OPERASIONAL & PENJUALAN (4-10101)</span>
                  <span>SUBTOTAL</span>
                </div>
                <div className="space-y-1.5 pl-3">
                  {incomeStatementData.revenueList.map((rev) => (
                    <div key={`rev-${rev.code}`} className="flex items-center justify-between text-sm leading-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 dark:text-gray-400 text-xs w-16 font-normal">
                          {rev.code}
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 font-normal">
                          {rev.name}
                        </span>
                      </div>
                      <span className="font-mono text-slate-900 dark:text-white font-normal">
                        Rp {rev.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                  {incomeStatementData.revenueList.length === 0 && (
                    <div className="text-sm leading-5 text-gray-400 italic py-1 font-normal">Belum ada mutasi pendapatan pada periode ini.</div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200 dark:border-gray-800 text-sm leading-5 font-medium text-slate-900 dark:text-white">
                  <span>TOTAL PENDAPATAN (A)</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-mono text-base font-semibold">
                    Rp {incomeStatementData.totalRevenue.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* 2. BAGIAN BEBAN POKOK PENJUALAN (HPP) */}
              <div className="p-4 bg-slate-50/40 dark:bg-[#0d1117]/40">
                <div className="flex items-center justify-between text-[11px] leading-4 font-mono font-normal uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">
                  <span>2. {adaptiveCoa.cogsName.toUpperCase()} (5-10101)</span>
                  <span>SUBTOTAL</span>
                </div>
                <div className="space-y-1.5 pl-3">
                  <div className="flex items-center justify-between text-sm leading-5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 dark:text-gray-400 text-xs w-16 font-normal">
                        5-10101
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-normal">
                        {adaptiveCoa.cogsName}
                      </span>
                    </div>
                    <span className="font-mono text-slate-900 dark:text-white font-normal">
                      (Rp {incomeStatementData.totalCogs.toLocaleString('id-ID')})
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200 dark:border-gray-800 text-sm leading-5 font-medium text-slate-900 dark:text-white">
                  <span>TOTAL BEBAN POKOK / HPP (B)</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono text-base font-semibold">
                    Rp {incomeStatementData.totalCogs.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* BARIS LABA KOTOR */}
              <div className="p-4 bg-emerald-500/10 dark:bg-emerald-950/30 flex items-center justify-between text-base leading-6 font-medium text-slate-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>LABA KOTOR / GROSS PROFIT (A - B)</span>
                </div>
                <span className="font-mono text-lg leading-7 font-semibold text-emerald-600 dark:text-emerald-400">
                  Rp {incomeStatementData.grossProfit.toLocaleString('id-ID')}
                </span>
              </div>

              {/* 3. BAGIAN BEBAN OPERASIONAL */}
              <div className="p-4 bg-slate-50/70 dark:bg-[#0d1117]/60">
                <div className="flex items-center justify-between text-[11px] leading-4 font-mono font-normal uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-2">
                  <span>3. BEBAN OPERASIONAL, KOMISI & LAINNYA (5-XXXXX / 6-XXXXX)</span>
                  <span>SUBTOTAL</span>
                </div>
                <div className="space-y-1.5 pl-3">
                  {incomeStatementData.expenseList.map((exp) => (
                    <div key={`exp-${exp.code}`} className="flex items-center justify-between text-sm leading-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 dark:text-gray-400 text-xs w-16 font-normal">
                          {exp.code}
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 font-normal">
                          {exp.name}
                        </span>
                      </div>
                      <span className="font-mono text-slate-900 dark:text-white font-normal">
                        (Rp {exp.amount.toLocaleString('id-ID')})
                      </span>
                    </div>
                  ))}
                  {incomeStatementData.expenseList.length === 0 && (
                    <div className="text-sm leading-5 text-gray-400 italic py-1 font-normal">Belum ada beban operasional tercatat pada periode ini.</div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200 dark:border-gray-800 text-sm leading-5 font-medium text-slate-900 dark:text-white">
                  <span>TOTAL BEBAN OPERASIONAL & KOMISI (C)</span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono text-base font-semibold">
                    Rp {incomeStatementData.totalOperatingExpenses.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* BARIS FINAL: LABA BERSIH (NET INCOME) */}
              <div className="p-5 bg-cyan-500/10 dark:bg-cyan-950/30 flex items-center justify-between text-base leading-6 font-medium text-slate-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  <div>
                    <span>LABA BERSIH PERIODE BERJALAN (NET INCOME)</span>
                    <span className="text-xs leading-5 text-slate-500 dark:text-gray-400 block font-normal">
                      Laba Kotor (Gross Profit) dikurangi Total Beban Operasional & Komisi
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-lg leading-7 font-mono font-semibold block ${incomeStatementData.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                    Rp {incomeStatementData.netProfit.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs leading-5 font-mono text-slate-500 dark:text-gray-400">
                    Net Margin: {incomeStatementData.netMarginPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TABEL RINGKAS: IKHTISAR KINERJA AKUNTANSI 12 BULAN (JAN - DES) */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-200 ${
              isLight ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
            }`}
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#30363d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base leading-6 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  <span>Ikhtisar Kinerja Akuntansi 12 Bulan (Jan - Des {fiscalYear})</span>
                </h3>
                <p className="text-xs leading-5 font-normal text-slate-500 dark:text-gray-400 mt-0.5">
                  Rekapitulasi 1 tahun fiskal terisolasi untuk entitas <strong className="font-medium text-slate-700 dark:text-slate-200">{businessProfile?.name || 'Entitas Aktif'}</strong> ({activeSector}). Klik baris bulan untuk melihat detail bulan tersebut.
                </p>
              </div>
              {periodFilter !== 'FULL_YEAR' && (
                <button
                  type="button"
                  onClick={() => setPeriodFilter('FULL_YEAR')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border border-cyan-500/35 transition cursor-pointer shrink-0"
                >
                  Tampilkan 1 Tahun Penuh ({fiscalYear})
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs leading-5 border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[11px] leading-4 font-mono font-normal tracking-wider uppercase ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-600'
                        : 'bg-[#0d1117] border-slate-800 text-slate-400'
                    }`}
                  >
                    <th className="py-2.5 px-4">Bulan ({fiscalYear})</th>
                    <th className="py-2.5 px-4 text-right">Pendapatan (4-10101)</th>
                    <th className="py-2.5 px-4 text-right">HPP (5-10101)</th>
                    <th className="py-2.5 px-4 text-right">Beban Operasional &amp; Komisi (6-XXXXX)</th>
                    <th className="py-2.5 px-4 text-right">Laba Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800/70">
                  {monthlyOverviewData.rows.map((m) => {
                    const isSelectedMonth = periodFilter === m.monthKey;
                    const hasActivity = m.revenue !== 0 || m.cogs !== 0 || m.operatingAndCommission !== 0;
                    return (
                      <tr
                        key={m.monthKey}
                        onClick={() => setPeriodFilter(isSelectedMonth ? 'FULL_YEAR' : m.monthKey)}
                        className={`cursor-pointer transition-colors ${
                          isSelectedMonth
                            ? isLight
                              ? 'bg-cyan-50/90 text-slate-900'
                              : 'bg-cyan-950/40 text-white'
                            : isLight
                            ? 'hover:bg-slate-50 text-slate-700'
                            : 'hover:bg-slate-800/50 text-slate-200'
                        }`}
                      >
                        <td className="py-2.5 px-4 font-medium flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-400 w-6">{m.monthNum}</span>
                          <span>{m.monthName}</span>
                          {isSelectedMonth && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-600 text-white">
                              AKTIF
                            </span>
                          )}
                        </td>
                        <td className={`py-2.5 px-4 text-right font-mono ${hasActivity ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-600'}`}>
                          Rp {m.revenue.toLocaleString('id-ID')}
                        </td>
                        <td className={`py-2.5 px-4 text-right font-mono ${m.cogs > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-600'}`}>
                          Rp {m.cogs.toLocaleString('id-ID')}
                        </td>
                        <td className={`py-2.5 px-4 text-right font-mono ${m.operatingAndCommission > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-600'}`}>
                          Rp {m.operatingAndCommission.toLocaleString('id-ID')}
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right font-mono font-semibold ${
                            m.netProfit > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : m.netProfit < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-400 dark:text-slate-600'
                          }`}
                        >
                          Rp {m.netProfit.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr
                    className={`border-t-2 font-semibold text-xs ${
                      isLight
                        ? 'bg-slate-100/90 border-slate-300 text-slate-900'
                        : 'bg-[#0d1117] border-slate-700 text-white'
                    }`}
                  >
                    <td className="py-3 px-4 uppercase tracking-wide">
                      Total 1 Tahun (Jan - Des {fiscalYear})
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-cyan-600 dark:text-cyan-400">
                      Rp {monthlyOverviewData.totals.revenue.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400">
                      Rp {monthlyOverviewData.totals.cogs.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                      Rp {monthlyOverviewData.totals.operatingAndCommission.toLocaleString('id-ID')}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono text-sm ${
                        monthlyOverviewData.totals.netProfit >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      Rp {monthlyOverviewData.totals.netProfit.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
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
          <div className={`p-5 rounded-xl border transition-all duration-200 print:border-none print:p-0 ${
            isLight
              ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] text-slate-900'
              : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] text-white'
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-medium flex items-center justify-center text-lg shadow-md">
                    {businessProfile?.name?.charAt(0) || 'J'}
                  </div>
                )}
                <div>
                  <span className="text-[11px] leading-4 font-mono font-normal tracking-widest text-cyan-500 uppercase block">
                    {activePrimaryBusinessSubtitle}
                  </span>
                  <h2 className="text-base leading-6 font-medium tracking-tight text-slate-900 dark:text-white uppercase">
                    {businessProfile?.name || 'JacS Retail & Enterprise Group'}
                  </h2>
                  {(hasValidProfileValue(businessProfile?.address) || hasValidProfileValue(businessProfile?.phone) || hasValidProfileValue(businessProfile?.email)) && (
                    <p className="text-xs leading-5 text-slate-500 dark:text-gray-400 font-normal">
                      {[
                        hasValidProfileValue(businessProfile?.address) ? businessProfile!.address : null,
                        hasValidProfileValue(businessProfile?.phone) ? `Telp: ${businessProfile!.phone}` : null,
                        hasValidProfileValue(businessProfile?.email) ? businessProfile!.email : null,
                      ].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  {hasValidProfileValue(businessProfile?.licenseNumber) && (
                    <p className="text-[11px] leading-4 text-slate-400 font-mono font-normal mt-0.5">
                      {businessProfile!.licenseNumber}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] leading-4 font-mono font-normal tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 inline-block">
                  GENERAL LEDGER AUDIT
                </span>
                <h3 className="text-base leading-6 font-medium text-slate-900 dark:text-white mt-1">
                  Neraca Saldo (Trial Balance)
                </h3>
                <p className="text-xs leading-5 text-slate-500 dark:text-gray-400 font-mono font-normal">
                  Periode: {periodFilterLabel}
                </p>
              </div>
            </div>
          </div>

          {/* BALANCE STATUS INDICATOR BANNER */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 ${
              trialBalanceData.isBalanced
                ? isLight
                  ? 'bg-emerald-500/5 border-emerald-500/70 text-emerald-950 shadow-[0_0_16px_rgba(16,185,129,0.16)]'
                  : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.08)]'
                : isLight
                ? 'bg-amber-500/5 border-amber-500/80 text-amber-950 shadow-[0_0_18px_rgba(245,158,11,0.22)]'
                : 'bg-amber-950/20 border-amber-500/50 text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.12)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  trialBalanceData.isBalanced
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                }`}
              >
                {trialBalanceData.isBalanced ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base leading-6 font-medium tracking-tight">
                    {trialBalanceData.isBalanced
                      ? 'Posisi Neraca Saldo: Seimbang (Balanced)'
                      : 'Peringatan: Neraca Saldo Tidak Seimbang'}
                  </h3>
                  <span
                    className={`text-[10px] leading-4 font-mono font-normal tracking-wider px-2 py-0.5 rounded-md uppercase ${
                      trialBalanceData.isBalanced
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {trialBalanceData.isBalanced ? '100% OK' : 'Selisih Deteksi'}
                  </span>
                </div>
                <p className="text-xs leading-5 font-normal opacity-90">
                  {trialBalanceData.isBalanced
                    ? 'Total seluruh sisi Debit sama persis dengan sisi Kredit (Prinsip Double-Entry terpenuhi sempurna).'
                    : `Terdapat deviasi pembukuan sebesar Rp ${trialBalanceData.diff.toLocaleString('id-ID')} antara Debit dan Kredit.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono font-normal shrink-0">
              <div className="text-right">
                <span className="block opacity-75 text-[11px] leading-4 font-mono font-normal tracking-widest uppercase">Total Debit:</span>
                <span className="text-base leading-6 font-mono font-semibold text-slate-900 dark:text-white">
                  Rp {trialBalanceData.grandTotalDebit.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="text-right">
                <span className="block opacity-75 text-[11px] leading-4 font-mono font-normal tracking-widest uppercase">Total Kredit:</span>
                <span className="text-base leading-6 font-mono font-semibold text-slate-900 dark:text-white">
                  Rp {trialBalanceData.grandTotalCredit.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* SEARCH & CATEGORY FILTER BAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={trialBalanceSearch}
                onChange={(e) => setTrialBalanceSearch(e.target.value)}
                placeholder="Cari kode akun, nama buku besar, atau kategori..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs leading-5 border font-normal transition focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400/80 placeholder:italic'
                    : 'bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500 placeholder:italic'
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
                  className={`px-3 py-1.5 rounded-lg text-xs leading-5 font-normal transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                    accountCategoryFilter === cat
                      ? 'bg-cyan-600 text-white shadow-sm border border-cyan-500'
                      : isLight
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`rounded-xl border overflow-hidden transition-all duration-200 ${
              isLight
                ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
                : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs leading-5 border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[11px] leading-4 font-mono font-normal tracking-widest uppercase ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-600'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <th className="py-2.5 px-3.5 w-24">Kode Akun</th>
                    <th className="py-2.5 px-3.5">Nama Akun Buku Besar</th>
                    <th className="py-2.5 px-3.5 w-36">Kategori</th>
                    <th className="py-2.5 px-3.5 text-right font-mono w-36">Total Debit</th>
                    <th className="py-2.5 px-3.5 text-right font-mono w-36">Total Kredit</th>
                    <th className="py-2.5 px-3.5 text-right font-mono w-36 text-cyan-600 dark:text-cyan-400">
                      Saldo Akhir (Dr)
                    </th>
                    <th className="py-2.5 px-3.5 text-right font-mono w-36 text-emerald-600 dark:text-emerald-400">
                      Saldo Akhir (Cr)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800/80 font-normal">
                  {displayedTrialBalanceRows.map((row) => (
                    <tr
                      key={`tb-row-${row.accountCode}`}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-100 dark:border-slate-800/60 ${
                        isLight ? 'text-slate-800' : 'text-slate-200'
                      }`}
                    >
                      <td className="py-2.5 px-3.5 font-mono text-slate-900 dark:text-white">
                        {row.accountCode}
                      </td>
                      <td className="py-2.5 px-3.5 font-normal">
                        {row.accountName}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`text-[10px] leading-4 font-mono font-normal tracking-wider px-2 py-0.5 rounded-md uppercase ${
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
                      <td className="py-2.5 px-3.5 text-right font-mono text-cyan-600 dark:text-cyan-400">
                        {row.endingDebit > 0 ? `Rp ${row.endingDebit.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {row.endingCredit > 0 ? `Rp ${row.endingCredit.toLocaleString('id-ID')}` : '-'}
                      </td>
                    </tr>
                  ))}

                  {displayedTrialBalanceRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs leading-5 text-slate-500 dark:text-gray-400 font-normal">
                        Tidak ada akun pembukuan yang cocok dengan pencarian filter.
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* TOTAL FOOTER ROW */}
                <tfoot>
                  <tr
                    className={`border-t-2 font-normal text-xs leading-5 ${
                      isLight
                        ? 'bg-slate-50/90 border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  >
                    <td colSpan={3} className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs leading-5 font-medium">TOTAL KESELURUHAN (GENERAL LEDGER TRIAL BALANCE)</span>
                        <span
                          className={`text-[10px] leading-4 font-mono font-normal tracking-widest px-2 py-0.5 rounded-md ${
                            trialBalanceData.isBalanced ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}
                        >
                          {trialBalanceData.isBalanced ? 'BALANCE' : 'SELISIH'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-lg leading-7 font-semibold">
                      Rp {trialBalanceData.grandTotalDebit.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-lg leading-7 font-semibold">
                      Rp {trialBalanceData.grandTotalCredit.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-lg leading-7 font-semibold text-cyan-600 dark:text-cyan-400">
                      Rp {trialBalanceData.grandEndingDebit.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-lg leading-7 font-semibold text-emerald-600 dark:text-emerald-400">
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
