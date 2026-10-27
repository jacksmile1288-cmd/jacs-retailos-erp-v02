import React, { useState, useMemo } from 'react';
import { useApp, isCashierEmployee } from '../../context/AppContext';
import { Employee } from '../../types';
import { CashierCommissionSlipItem } from './PayrollModule';
import { getReactiveNeonGlowStyle } from '../../utils/neonGlow';
import { hasValidProfileValue } from '../../utils/businessProfileUtils';
import {
  DollarSign,
  ShieldCheck,
  Building,
  Users,
  Send,
  CheckCircle2,
  FileText,
  Printer,
  X,
  Search,
  Check,
  AlertTriangle,
  Info,
  Calendar,
  Briefcase,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  CreditCard,
  Copy,
  Coffee,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

interface PayrollTabProps {
  isLight: boolean;
  isEn: boolean;
}

/**
 * Helper konversi nominal angka rupiah ke teks terbilang formal Indonesia
 */
export const formatTerbilang = (nominal: number): string => {
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];
  const n = Math.floor(Math.abs(nominal));
  if (n === 0) return 'Nol Rupiah';

  const convert = (num: number): string => {
    if (num < 12) return bilangan[num];
    if (num < 20) return convert(num - 10) + ' Belas';
    if (num < 100) return convert(Math.floor(num / 10)) + ' Puluh ' + convert(num % 10);
    if (num < 200) return 'Seratus ' + convert(num - 100);
    if (num < 1000) return convert(Math.floor(num / 100)) + ' Ratus ' + convert(num % 100);
    if (num < 2000) return 'Seribu ' + convert(num - 1000);
    if (num < 1000000) return convert(Math.floor(num / 1000)) + ' Ribu ' + convert(num % 1000);
    if (num < 1000000000) return convert(Math.floor(num / 1000000)) + ' Juta ' + convert(num % 1000000);
    if (num < 1000000000000)
      return convert(Math.floor(num / 1000000000)) + ' Miliar ' + convert(num % 1000000000);
    return convert(Math.floor(num / 1000000000000)) + ' Triliun ' + convert(num % 1000000000000);
  };

  return convert(n).replace(/\s+/g, ' ').trim() + ' Rupiah';
};

export const PayrollTab: React.FC<PayrollTabProps> = ({ isLight, isEn }) => {
  const {
    employees,
    attendanceLogs,
    salesHistory,
    activeUser,
    toggleEmployeeBpjs,
    isPayrollSynced,
    lastPayrollSyncTime,
    syncPayrollToFinance,
    processPayrollPayment,
    showToast,
    calculateCashierCommission,
    businessProfile,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
  const [selectedSlipEmployee, setSelectedSlipEmployee] = useState<Employee | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [selectedPaymentSource, setSelectedPaymentSource] = useState<'Bank Operasional' | 'Kas Utama'>(
    'Bank Operasional'
  );
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [targetPayEmployee, setTargetPayEmployee] = useState<Employee | 'ALL' | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [payNotes, setPayNotes] = useState('');

  // Tarif standar BPJS Ketenagakerjaan & Kesehatan
  const RATES = {
    kesCompany: 0.04, // 4% Perusahaan
    kesEmployee: 0.01, // 1% Karyawan
    tkCompany: 0.0624, // ~6.24% Perusahaan
    tkEmployee: 0.03, // 3% Karyawan
  };

  // Komputasi metrik gaji lengkap per karyawan (sinkronisasi realtime omzet kasir COMPLETED)
  const payrollItems = useMemo(() => {
    return employees.map((emp) => {
      const baseSalary = emp.baseSalary ?? 5000000;
      const isBpjsActive = emp.bpjsEnabled !== false;

      // 1. Tunjangan Harian (Uang Makan & Transportasi Harian)
      const attendedDays = emp.attendedDays ?? 22;
      const dailyRate = emp.dailyAllowanceRate ?? 45000;
      const dailyAllowance = emp.dailyAllowance ?? attendedDays * dailyRate;

      // 2. Potongan Absensi & Keterlambatan (Berdasarkan log presensi harian)
      const empLogs = attendanceLogs.filter(
        (a) => a.employeeId === emp.id || a.nip === emp.nip
      );
      const lateCount = empLogs.filter((a) => a.status === 'Terlambat').length;
      const latePenaltyRate = 50000; // Rp 50.000 per kejadian terlambat
      const calculatedLatePenalty = lateCount * latePenaltyRate;
      const absenceDeduction = emp.absenceDeduction ?? calculatedLatePenalty;

      // 3. Estimasi Komisi Penjualan Kasir (1% dari omzet transaksi status COMPLETED secara realtime)
      const isCashier = isCashierEmployee(emp, salesHistory, activeUser);
      const commissionData = isCashier
        ? calculateCashierCommission(emp, selectedPeriod)
        : {
            commission: 0,
            salesTotal: 0,
            transactionCount: 0,
            ratePercent: emp.cashierCommissionRate ?? 1,
            periodMonth: selectedPeriod === 'ALL' ? 'Semua Periode' : selectedPeriod,
            sales: [],
          };

      const cashierCommission = commissionData.commission;

      // 4. Iuran BPJS (Kesehatan & Ketenagakerjaan)
      const kesCompany = isBpjsActive ? Math.round(baseSalary * RATES.kesCompany) : 0;
      const kesEmployee = isBpjsActive ? Math.round(baseSalary * RATES.kesEmployee) : 0;
      const tkCompany = isBpjsActive ? Math.round(baseSalary * RATES.tkCompany) : 0;
      const tkEmployee = isBpjsActive ? Math.round(baseSalary * RATES.tkEmployee) : 0;

      const totalCompanyBpjs = kesCompany + tkCompany;
      const totalBpjsEmployeeDeduction = kesEmployee + tkEmployee;
      const totalEmployeeDeduction = totalBpjsEmployeeDeduction + absenceDeduction;

      // 5. Total Penerimaan Kotor & Take-Home Pay
      const grossEarnings = baseSalary + dailyAllowance + cashierCommission;
      const takeHomePay = grossEarnings - totalEmployeeDeduction;
      const totalRemittance = totalCompanyBpjs + totalBpjsEmployeeDeduction;

      return {
        employee: emp,
        baseSalary,
        attendedDays,
        dailyRate,
        dailyAllowance,
        lateCount,
        latePenaltyRate,
        absenceDeduction,
        isBpjsActive,
        kesCompany,
        kesEmployee,
        tkCompany,
        tkEmployee,
        totalCompanyBpjs,
        totalBpjsEmployeeDeduction,
        totalEmployeeDeduction,
        isCashier,
        cashierCommission,
        commissionSalesTotal: commissionData.salesTotal,
        commissionTrxCount: commissionData.transactionCount,
        commissionRatePercent: commissionData.ratePercent,
        commissionPeriodMonth: commissionData.periodMonth,
        grossEarnings,
        takeHomePay,
        totalRemittance,
      };
    });
  }, [employees, attendanceLogs, salesHistory, activeUser, selectedPeriod, calculateCashierCommission]);

  // Ringkasan Agregat Payroll
  const summary = useMemo(() => {
    const totalStaffCount = employees.length;
    const activeBpjsStaffCount = payrollItems.filter((i) => i.isBpjsActive).length;

    const totalBaseSalary = payrollItems.reduce((acc, i) => acc + i.baseSalary, 0);
    const totalDailyAllowances = payrollItems.reduce((acc, i) => acc + i.dailyAllowance, 0);
    const totalCashierCommissions = payrollItems.reduce((acc, i) => acc + i.cashierCommission, 0);
    const totalAbsenceDeductions = payrollItems.reduce((acc, i) => acc + i.absenceDeduction, 0);
    const totalCompanyContribution = payrollItems.reduce((acc, i) => acc + i.totalCompanyBpjs, 0);
    const totalEmployeeDeductions = payrollItems.reduce((acc, i) => acc + i.totalEmployeeDeduction, 0);
    const totalTakeHomePay = payrollItems.reduce((acc, i) => acc + i.takeHomePay, 0);
    const totalBpjsRemittance = payrollItems.reduce((acc, i) => acc + i.totalRemittance, 0);

    return {
      totalStaffCount,
      activeBpjsStaffCount,
      totalBaseSalary,
      totalDailyAllowances,
      totalCashierCommissions,
      totalAbsenceDeductions,
      totalCompanyContribution,
      totalEmployeeDeductions,
      totalTakeHomePay,
      totalBpjsRemittance,
      period: 'September 2026',
    };
  }, [employees, payrollItems]);

  // Filter Staf untuk Tabel
  const filteredPayrollItems = useMemo(() => {
    return payrollItems.filter((item) => {
      const emp = item.employee;
      const matchesSearch =
        searchQuery === '' ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDeptFilter === 'ALL' || emp.department === selectedDeptFilter;
      return matchesSearch && matchesDept;
    });
  }, [payrollItems, searchQuery, selectedDeptFilter]);

  const handleSyncFinance = () => {
    syncPayrollToFinance(summary);
  };

  const handleOpenPayModal = (target: Employee | 'ALL') => {
    setTargetPayEmployee(target);
    setPayNotes(
      target === 'ALL'
        ? `Pembayaran payroll seluruh karyawan (${employees.length} staf) periode September 2026 via ${selectedPaymentSource}`
        : `Pembayaran gaji staf ${target.name} (${target.nip}) periode September 2026 via ${selectedPaymentSource}`
    );
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!targetPayEmployee) return;
    setIsProcessingPayment(true);
    try {
      if (targetPayEmployee === 'ALL') {
        processPayrollPayment('ALL', selectedPaymentSource, payNotes);
      } else {
        processPayrollPayment(targetPayEmployee.id, selectedPaymentSource, payNotes);
      }
      setIsPayModalOpen(false);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePrintSlip = () => {
    showToast(isEn ? 'Opening pay slip print preview...' : 'Membuka pratinjau cetak slip gaji...');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleCopySlipText = (item: (typeof payrollItems)[0]) => {
    const text = `=== SLIP GAJI RESMI KARYAWAN ===
Perusahaan : ${businessProfile?.name || 'JacS RetailOS ERP'}
No. Slip   : SLIP/2026/09/${item.employee.nip}
Periode    : September 2026
Staf       : ${item.employee.name} (${item.employee.nip})
Jabatan    : ${item.employee.role} [${item.employee.department}]
Status     : ${item.employee.payrollStatus || 'PENDING'}

[A. PENERIMAAN]
- Gaji Pokok               : Rp ${item.baseSalary.toLocaleString('id-ID')}
- Tunjangan Harian (${item.attendedDays} hari): Rp ${item.dailyAllowance.toLocaleString('id-ID')}
${
  item.isCashier
    ? `- Komisi Penjualan POS (1%): Rp ${item.cashierCommission.toLocaleString(
        'id-ID'
      )} (Omzet: Rp ${item.commissionSalesTotal.toLocaleString('id-ID')} | ${item.commissionTrxCount} trx)\n`
    : ''
}- Total Penerimaan Kotor  : Rp ${item.grossEarnings.toLocaleString('id-ID')}

[B. POTONGAN]
- Potongan Absensi         : -Rp ${item.absenceDeduction.toLocaleString('id-ID')}${
      item.lateCount > 0 ? ` (${item.lateCount}x terlambat)` : ''
    }
- BPJS Kesehatan Karyawan  : -Rp ${item.kesEmployee.toLocaleString('id-ID')}
- BPJS Ketenagakerjaan     : -Rp ${item.tkEmployee.toLocaleString('id-ID')}
- Total Potongan           : -Rp ${item.totalEmployeeDeduction.toLocaleString('id-ID')}

[C. TAKE-HOME PAY BERSIH]
TOTAL GAJI BERSIH (THP)    : Rp ${item.takeHomePay.toLocaleString('id-ID')}
Terbilang: ${formatTerbilang(item.takeHomePay)}
================================`;
    navigator.clipboard.writeText(text);
    showToast(isEn ? 'Pay slip text copied to clipboard!' : 'Rincian slip gaji disalin ke clipboard!');
  };

  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => set.add(e.department));
    return Array.from(set);
  }, [employees]);

  return (
    <div id="payroll-commission-tab" className="space-y-6">
      {/* Inline Print Stylesheet for Pure Slip Printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-pay-slip, #printable-pay-slip * {
            visibility: visible !important;
          }
          #printable-pay-slip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. TOP BAR: TITLE, ACTIONS & FINANCE JOURNAL SYNC */}
      {/* ========================================================================= */}
      <div
        className={`p-5 rounded-2xl border transition duration-200 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#161b22] border-[#30363d] text-white'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[#0052FF] dark:text-[#58a6ff] text-[11px] font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0052FF] dark:text-[#58a6ff]" />
              <span>
                {isEn
                  ? 'Payroll & Cashier Sales Commission Hub'
                  : 'Sistem Penggajian & Komisi Penjualan Kasir Terintegrasi'}
              </span>
            </div>
            <h3
              className={`text-xl font-black tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {isEn ? 'Staff Payroll & Commission Management' : 'Rekapitulasi Gaji, Tunjangan & Komisi Kasir'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-3xl leading-relaxed">
              {isEn
                ? 'Comprehensive staff salary computation with daily allowance, attendance late penalties, automated 1% cashier POS sales turnover commission, and BPJS social security sync to Finance Journal.'
                : 'Perhitungan gaji komprehensif mencakup Gaji Pokok, Tunjangan Harian, Potongan Absensi/Keterlambatan, Estimasi Komisi Penjualan Kasir (1% dari omzet POS), serta Iuran BPJS siap cetak slip gaji.'}
            </p>
          </div>

          {/* Sync Button, Pay All Button & Status Badge */}
          <div className="flex flex-wrap items-center gap-3">
            {isPayrollSynced ? (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div className="flex flex-col text-left">
                  <span>{isEn ? 'Synced to Finance' : 'Tersinkronisasi ke Keuangan'}</span>
                  {lastPayrollSyncTime && (
                    <span className="text-[10px] opacity-80 font-normal">
                      {lastPayrollSyncTime}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                  isLight
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>{isEn ? 'Unsynced Draft' : 'Draft Belum Disinkronkan'}</span>
              </div>
            )}

            <button
              id="btn-pay-all-salaries"
              type="button"
              onClick={() => handleOpenPayModal('ALL')}
              className={`flex items-center gap-1.5 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 shadow-sm'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-[0_0_18px_rgba(16,185,129,0.35)]'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>{isEn ? 'Pay All Salaries' : 'Bayar Semua Gaji'}</span>
            </button>

            <button
              id="btn-sync-payroll-finance"
              type="button"
              onClick={handleSyncFinance}
              className={`flex items-center gap-2 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-blue-600 hover:bg-blue-700 border border-blue-600 shadow-sm'
                  : 'bg-gradient-to-r from-[#0052FF] to-[#0043d1] hover:from-[#0043d1] hover:to-[#0038b3] shadow-[0_0_18px_rgba(0,82,255,0.4)]'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {isPayrollSynced
                  ? isEn
                    ? 'Re-Sync to Finance'
                    : 'Kirim Ulang Jurnal'
                  : isEn
                  ? 'Sync to Finance'
                  : 'Kirim Jurnal Penggajian'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FIVE DYNAMIC METRIC CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Gaji Pokok & Tunjangan */}
        <div
          onMouseEnter={() => setHoveredCardId('metric-base')}
          onMouseLeave={() => setHoveredCardId(null)}
          style={getReactiveNeonGlowStyle(
            '#0052FF',
            false,
            hoveredCardId === 'metric-base',
            isLight
          )}
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-150 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
              : 'bg-[#161b22] border-[#30363d] text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-[#58a6ff]">
              {isEn ? 'Base & Daily Allowance' : 'Gaji Pokok & Tunjangan'}
            </span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-[#58a6ff] border border-blue-500/20">
              <Building className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
              Rp {(summary.totalBaseSalary + summary.totalDailyAllowances).toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-between">
              <span>Pokok: Rp {summary.totalBaseSalary.toLocaleString('id-ID')}</span>
              <span className="text-sky-600 dark:text-sky-400 font-semibold">
                +Tunjangan: Rp {summary.totalDailyAllowances.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Estimasi Komisi Penjualan Kasir */}
        <div
          onMouseEnter={() => setHoveredCardId('metric-comm')}
          onMouseLeave={() => setHoveredCardId(null)}
          style={getReactiveNeonGlowStyle(
            '#10b981',
            false,
            hoveredCardId === 'metric-comm',
            isLight
          )}
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-150 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
              : 'bg-[#161b22] border-[#30363d] text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {isEn ? 'Cashier Commission (1%)' : 'Estimasi Komisi Kasir'}
            </span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
              + Rp {summary.totalCashierCommissions.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-between">
              <span>1% dari omzet kasir</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-300">
                {payrollItems.filter((p) => p.isCashier).length} Kasir POS
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Potongan Absensi & Keterlambatan */}
        <div
          onMouseEnter={() => setHoveredCardId('metric-deduct')}
          onMouseLeave={() => setHoveredCardId(null)}
          style={getReactiveNeonGlowStyle(
            '#ef4444',
            false,
            hoveredCardId === 'metric-deduct',
            isLight
          )}
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-150 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
              : 'bg-[#161b22] border-[#30363d] text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              {isEn ? 'Attendance Penalty' : 'Potongan Absensi'}
            </span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg font-black font-mono text-rose-600 dark:text-rose-400">
              - Rp {summary.totalAbsenceDeductions.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-between">
              <span>Denda terlambat shift</span>
              <span className="text-gray-400">Rp 50.000 / insiden</span>
            </div>
          </div>
        </div>

        {/* Card 4: Beban BPJS Perusahaan */}
        <div
          onMouseEnter={() => setHoveredCardId('metric-company')}
          onMouseLeave={() => setHoveredCardId(null)}
          style={getReactiveNeonGlowStyle(
            '#8b5cf6',
            false,
            hoveredCardId === 'metric-company',
            isLight
          )}
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-150 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
              : 'bg-[#161b22] border-[#30363d] text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              {isEn ? 'Employer BPJS Cost' : 'Beban BPJS Perusahaan'}
            </span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg font-black font-mono text-purple-600 dark:text-purple-400">
              Rp {summary.totalCompanyContribution.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-between">
              <span>Beban 10.24% Co.</span>
              <span className="text-purple-500 font-bold">Tidak potong THP</span>
            </div>
          </div>
        </div>

        {/* Card 5: Total Take-Home Pay (Siap Dicairkan) */}
        <div
          onMouseEnter={() => setHoveredCardId('metric-thp')}
          onMouseLeave={() => setHoveredCardId(null)}
          style={getReactiveNeonGlowStyle(
            '#059669',
            true,
            hoveredCardId === 'metric-thp',
            isLight
          )}
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-150 ${
            isLight
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-xs'
              : 'bg-emerald-950/20 border-emerald-500/40 text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              {isEn ? 'Total Take-Home Pay' : 'Total Gaji Bersih (THP)'}
            </span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
              Rp {summary.totalTakeHomePay.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-gray-600 dark:text-gray-300 mt-1 flex items-center justify-between">
              <span className="font-bold">
                {summary.totalStaffCount} {isEn ? 'Staff Active' : 'Staf Aktif'}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                Siap Cair
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOOLBAR: SEARCH, ACCOUNT SOURCE & DIVISION FILTER */}
      {/* ========================================================================= */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
            : 'bg-[#161b22] border-[#30363d] text-white'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={isEn ? 'Search staff name, NIP, role...' : 'Cari nama staf, NIP, jabatan...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {isEn ? 'Disbursement Account:' : 'Rekening Pencairan:'}
            </label>
            <select
              value={selectedPaymentSource}
              onChange={(e) =>
                setSelectedPaymentSource(e.target.value as 'Bank Operasional' | 'Kas Utama')
              }
              aria-label="Pilih Sumber Kas/Bank"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border outline-none cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-[#0d1117] border-[#30363d] text-white'
              }`}
            >
              <option value="Bank Operasional">Bank Operasional (1-10002)</option>
              <option value="Kas Utama">Kas Utama / Brankas (1-10000)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {isEn ? 'Commission Period:' : 'Periode Komisi Kasir:'}
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              aria-label="Pilih Periode Komisi Kasir"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border outline-none cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-[#0d1117] border-[#30363d] text-white'
              }`}
            >
              <option value="ALL">
                {isEn ? 'All Periods (Realtime POS)' : 'Semua Periode (Realtime Transaksi)'}
              </option>
              <option value="2026-10">Oktober 2026 (Bulan Berjalan)</option>
              <option value="2026-09">September 2026</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedDeptFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedDeptFilter === 'ALL'
                ? 'bg-[#0052FF] text-white shadow-sm'
                : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-[#0d1117] text-gray-300 border border-[#30363d] hover:border-gray-500'
            }`}
          >
            {isEn ? 'All Divisions' : 'Semua Divisi'} ({employees.length})
          </button>
          {departmentsList.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDeptFilter(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedDeptFilter === dept
                  ? 'bg-[#0052FF] text-white shadow-sm'
                  : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-[#0d1117] text-gray-300 border border-[#30363d] hover:border-gray-500'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TABEL RINGKASAN GAJI PER STAF */}
      {/* ========================================================================= */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-sm transition ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1150px]">
            <thead>
              <tr
                className={`text-[11px] uppercase tracking-wider border-b ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 font-bold border-slate-300'
                    : 'bg-[#0d1117] text-[#8b949e] font-bold border-[#30363d]'
                }`}
              >
                <th className="py-3 px-4 font-bold">{isEn ? 'Staff & NIP' : 'Nama & NIP'}</th>
                <th className="py-3 px-3 font-bold">{isEn ? 'Department & Role' : 'Jabatan & Divisi'}</th>
                <th className="py-3 px-3 font-bold text-right">{isEn ? 'Base Salary' : 'Gaji Pokok'}</th>
                <th className="py-3 px-3 font-bold text-right text-sky-600 dark:text-sky-400">
                  {isEn ? 'Daily Allowance' : 'Tunjangan Harian'}
                </th>
                <th className="py-3 px-3 font-bold text-right text-rose-600 dark:text-rose-400">
                  {isEn ? 'Attendance Penalty' : 'Potongan Absensi'}
                </th>
                <th className="py-3 px-3 font-bold text-right text-emerald-600 dark:text-emerald-400">
                  {isEn ? 'Cashier Commission (1%)' : 'Estimasi Komisi Kasir (1%)'}
                </th>
                <th className="py-3 px-3 font-bold text-center">{isEn ? 'BPJS Toggle' : 'Status BPJS'}</th>
                <th className="py-3 px-3 font-bold text-right text-emerald-700 dark:text-emerald-400">
                  {isEn ? 'Take Home Pay' : 'Gaji Bersih (THP)'}
                </th>
                <th className="py-3 px-3 font-bold text-center">{isEn ? 'Status' : 'Status Gaji'}</th>
                <th className="py-3 px-4 font-bold text-center">{isEn ? 'Action' : 'Aksi'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#30363d]/40 text-xs">
              {filteredPayrollItems.map((item) => {
                const emp = item.employee;
                const isHovered = hoveredRowId === emp.id;

                return (
                  <tr
                    key={emp.id}
                    onMouseEnter={() => setHoveredRowId(emp.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                    className={`transition-colors duration-100 ${
                      isHovered
                        ? isLight
                          ? 'bg-blue-50/50'
                          : 'bg-[#1c2128]'
                        : isLight
                        ? 'hover:bg-slate-50'
                        : 'hover:bg-[#13171f]'
                    }`}
                  >
                    {/* 1. Staf & NIP */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {emp.avatarUrl || emp.avatar ? (
                          <img
                            src={emp.avatarUrl || emp.avatar || ''}
                            alt={emp.name}
                            className="w-9 h-9 rounded-full object-cover border border-[#0052FF]/30 shrink-0"
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center border border-[#0052FF]/30 shrink-0 ${
                            isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-400'
                          }`}>
                            <Users className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div
                            className={`font-bold truncate ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`}
                          >
                            {emp.name}
                          </div>
                          <div className="font-mono text-[10px] text-gray-500 dark:text-gray-400">
                            {emp.nip}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Department & Role */}
                    <td className="py-3.5 px-3">
                      <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>
                        {emp.role}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-[#8b949e]">
                        {emp.department} • <span className="opacity-90">{emp.contractStatus}</span>
                      </div>
                    </td>

                    {/* 3. Gaji Pokok */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold">
                      <span className={isLight ? 'text-slate-900' : 'text-white'}>
                        Rp {item.baseSalary.toLocaleString('id-ID')}
                      </span>
                    </td>

                    {/* 4. Tunjangan Harian */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      <div className="font-bold text-sky-700 dark:text-sky-400">
                        + Rp {item.dailyAllowance.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">
                        {item.attendedDays} hari @ Rp {item.dailyRate.toLocaleString('id-ID')}
                      </div>
                    </td>

                    {/* 5. Potongan Absensi */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      {item.absenceDeduction > 0 ? (
                        <div>
                          <div className="font-bold text-rose-600 dark:text-rose-400">
                            - Rp {item.absenceDeduction.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] text-rose-500 font-semibold">
                            {item.lateCount}x terlambat
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 dark:text-gray-500 text-[11px] font-medium">
                          Rp 0 <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">Nihil</span>
                        </div>
                      )}
                    </td>

                    {/* 6. Estimasi Komisi Penjualan Kasir (1%) */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      {item.isCashier ? (
                        <div>
                          <div className="font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            <span>+ Rp {item.cashierCommission.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            1% &times; Rp {item.commissionSalesTotal.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[9px] text-emerald-600 dark:text-emerald-400/90">
                            ({item.commissionTrxCount} transaksi POS)
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 dark:text-gray-500 text-[11px]">
                          - <span className="text-[10px] block opacity-80">Non-Kasir</span>
                        </div>
                      )}
                    </td>

                    {/* 7. BPJS Toggle */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          id={`toggle-bpjs-${emp.id}`}
                          onClick={() => toggleEmployeeBpjs(emp.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            item.isBpjsActive
                              ? 'bg-emerald-500 shadow-sm'
                              : 'bg-gray-400 dark:bg-gray-600'
                          }`}
                          role="switch"
                          aria-checked={item.isBpjsActive}
                          title={
                            item.isBpjsActive
                              ? isEn
                                ? 'BPJS Active - Click to Opt Out'
                                : 'BPJS Aktif - Klik untuk Nonaktifkan'
                              : isEn
                              ? 'BPJS Inactive - Click to Activate'
                              : 'Non-BPJS - Klik untuk Aktifkan'
                          }
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              item.isBpjsActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-[9px] font-bold tracking-tight px-1.5 py-0.2 rounded ${
                            item.isBpjsActive
                              ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/20'
                              : 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-500/20'
                          }`}
                        >
                          {item.isBpjsActive ? '-4% Deduct' : 'Opt-Out'}
                        </span>
                      </div>
                    </td>

                    {/* 8. Take Home Pay (THP) */}
                    <td className="py-3.5 px-3 text-right font-mono font-black text-sm">
                      <span className="text-emerald-700 dark:text-emerald-400">
                        Rp {item.takeHomePay.toLocaleString('id-ID')}
                      </span>
                      <div className="text-[9px] text-gray-500 dark:text-gray-400 font-normal">
                        Bruto: Rp {item.grossEarnings.toLocaleString('id-ID')}
                      </div>
                    </td>

                    {/* 9. Status & Bayar */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {emp.payrollStatus === 'PAID' ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>PAID</span>
                          </span>
                          {emp.payrollPaidAt && (
                            <span className="text-[9px] text-gray-500 dark:text-gray-400 font-mono">
                              {emp.payrollPaidAt}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                            <span>PENDING</span>
                          </span>
                          <button
                            type="button"
                            id={`btn-pay-salary-${emp.id}`}
                            onClick={() => handleOpenPayModal(emp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shadow-sm transition cursor-pointer active:scale-95"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Bayar</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* 10. Aksi: "Generate Slip Gaji" */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        id={`btn-generate-slip-${emp.id}`}
                        onClick={() => setSelectedSlipEmployee(emp)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs cursor-pointer transition hover:scale-105 active:scale-95 ${
                          isLight
                            ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 shadow-xs'
                            : 'bg-[#0052FF]/15 hover:bg-[#0052FF]/25 text-[#0052FF] dark:text-[#58a6ff] border-[#0052FF]/30'
                        }`}
                        title="Buka dan cetak rincian slip gaji resmi karyawan"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-[#58a6ff]" />
                        <span>Generate Slip Gaji</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: RINCIAN SLIP GAJI KARYAWAN SIAP CETAK / UNDUH */}
      {/* ========================================================================= */}
      {selectedSlipEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            id="printable-pay-slip"
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900'
                : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            {/* Slip Header (Kop Surat Resmi) */}
            <div
              className={`p-5 border-b flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
              }`}
            >
              <div className="flex items-center gap-3.5">
                {businessProfile?.logoUrl ? (
                  <img
                    src={businessProfile.logoUrl}
                    alt="Logo"
                    className="w-12 h-12 object-contain rounded-xl bg-white/5 p-1 border border-cyan-500/30 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0052FF] to-[#00b4d8] flex items-center justify-center text-white font-black text-xl shadow-md">
                    {businessProfile?.name?.charAt(0) || 'J'}
                  </div>
                )}
                <div>
                  <div className="text-[11px] font-black tracking-widest text-[#0052FF] dark:text-[#58a6ff] uppercase">
                    {businessProfile?.name || 'JacS RetailOS ERP'} • HUMAN RESOURCES
                  </div>
                  <h4 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                    {isEn ? 'OFFICIAL EMPLOYEE PAYSLIP' : 'SLIP GAJI RESMI KARYAWAN'}
                  </h4>
                  {(hasValidProfileValue(businessProfile?.address) ||
                    hasValidProfileValue(businessProfile?.phone) ||
                    hasValidProfileValue(businessProfile?.licenseNumber)) && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {[
                        hasValidProfileValue(businessProfile?.address) ? businessProfile!.address : null,
                        hasValidProfileValue(businessProfile?.phone) ? `Telp: ${businessProfile!.phone}` : null,
                        hasValidProfileValue(businessProfile?.licenseNumber)
                          ? businessProfile!.licenseNumber
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 no-print">
                <button
                  type="button"
                  onClick={() => setSelectedSlipEmployee(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-gray-800 transition cursor-pointer"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slip Body Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {(() => {
                const item = payrollItems.find((p) => p.employee.id === selectedSlipEmployee.id)!;
                return (
                  <>
                    {/* Status Slip & Jurnal Akuntansi */}
                    {item.employee.payrollStatus === 'PAID' ? (
                      <div
                        className={`p-4 rounded-xl border flex items-center justify-between ${
                          isLight
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2">
                              <span>STATUS SLIP: PAID (LUNAS)</span>
                              <span className="px-2 py-0.2 rounded-full text-[10px] bg-emerald-800 text-white dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/40">
                                TERVERIFIKASI FINANCE
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5">
                              Dibayarkan pada:{' '}
                              <strong className="font-mono text-slate-900 dark:text-white">
                                {item.employee.payrollPaidAt || 'September 2026'}
                              </strong>
                              {item.employee.payrollPaymentRef && (
                                <span>
                                  {' '}
                                  • Ref Jurnal:{' '}
                                  <code className="text-cyan-700 dark:text-cyan-300 font-mono font-bold">
                                    {item.employee.payrollPaymentRef}
                                  </code>
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] opacity-80 mt-0.5 font-medium">
                              Entri Buku Besar: Debit Beban Gaji Karyawan (5-10201) &bull; Kredit Kas/Bank
                              (1-10000 / 1-10002)
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isLight
                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                            : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-400">
                              STATUS SLIP: PENDING (BELUM DICAIRKAN)
                            </div>
                            <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5">
                              Gaji bersih THP siap dicairkan melalui Kas Utama atau Rekening Bank Operasional.
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          id="btn-pay-slip-modal"
                          onClick={() => handleOpenPayModal(item.employee)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95 no-print"
                        >
                          <DollarSign className="w-4 h-4" />
                          <span>Bayar Gaji Sekarang</span>
                        </button>
                      </div>
                    )}

                    {/* Metadata Staf */}
                    <div
                      className={`p-4 rounded-xl border grid grid-cols-2 sm:grid-cols-4 gap-3.5 ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-800'
                          : 'bg-[#0d1117] border-[#30363d] text-gray-200'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] text-gray-500 dark:text-[#8b949e] uppercase font-bold">
                          {isEn ? 'Staff Name' : 'Nama Lengkap'}
                        </div>
                        <div className="font-bold text-sm text-[#0052FF] dark:text-[#58a6ff] mt-0.5">
                          {selectedSlipEmployee.name}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 dark:text-[#8b949e] uppercase font-bold">
                          NIP &amp; Nomor Slip
                        </div>
                        <div className="font-mono font-bold mt-0.5">
                          {selectedSlipEmployee.nip}
                        </div>
                        <div className="text-[9px] text-gray-400 font-mono">
                          SLIP/2026/09/{selectedSlipEmployee.nip.split('-').pop()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 dark:text-[#8b949e] uppercase font-bold">
                          {isEn ? 'Period' : 'Periode Gaji'}
                        </div>
                        <div className="font-bold mt-0.5">September 2026</div>
                        <div className="text-[9px] text-gray-400">
                          {item.attendedDays} Hari Kerja Hadir
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 dark:text-[#8b949e] uppercase font-bold">
                          {isEn ? 'Department & Role' : 'Jabatan / Divisi'}
                        </div>
                        <div className="font-medium mt-0.5">{selectedSlipEmployee.role}</div>
                        <div className="text-[9px] text-gray-500 dark:text-gray-400">
                          {selectedSlipEmployee.department} ({selectedSlipEmployee.contractStatus})
                        </div>
                      </div>
                    </div>

                    {/* Rincian Penghasilan & Potongan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 1. Penghasilan / Earnings */}
                      <div
                        className={`rounded-xl border overflow-hidden ${
                          isLight ? 'border-slate-200 bg-white' : 'border-[#30363d] bg-[#0d1117]'
                        }`}
                      >
                        <div
                          className={`px-3.5 py-2 font-bold uppercase text-[11px] flex items-center justify-between border-b ${
                            isLight
                              ? 'bg-slate-100 text-slate-800 border-slate-200'
                              : 'bg-slate-900 text-gray-200 border-[#30363d]'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{isEn ? 'A. Earnings & Allowances' : 'A. Penerimaan (Penerimaan Kotor)'}</span>
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                            Rp {item.grossEarnings.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              {isEn ? 'Basic Salary' : 'Gaji Pokok'}
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              Rp {item.baseSalary.toLocaleString('id-ID')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">
                                {isEn ? 'Daily Allowance' : 'Tunjangan Harian (Makan & Transport)'}
                              </div>
                              <div className="text-[10px] text-sky-600 dark:text-sky-400">
                                {item.attendedDays} hari hadir &times; Rp{' '}
                                {item.dailyRate.toLocaleString('id-ID')}
                              </div>
                            </div>
                            <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                              + Rp {item.dailyAllowance.toLocaleString('id-ID')}
                            </span>
                          </div>

                          {/* Komisi Penjualan Kasir (1%) */}
                          {item.isCashier ? (
                            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-emerald-500" />
                                  <span>Komisi Penjualan POS (1%)</span>
                                </span>
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                  + Rp {item.cashierCommission.toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-between">
                                <span>Basis Omzet Kasir:</span>
                                <span className="font-mono font-semibold text-slate-800 dark:text-gray-200">
                                  Rp {item.commissionSalesTotal.toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div className="text-[9px] text-emerald-600 dark:text-emerald-400/90 flex items-center justify-between">
                                <span>Total Transaksi Selesai:</span>
                                <span>{item.commissionTrxCount} transaksi shift</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-gray-400 dark:text-gray-500">
                              <span>{isEn ? 'Cashier Commission' : 'Komisi Penjualan Kasir'}</span>
                              <span className="text-[11px] font-mono">- (Non-Kasir)</span>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold">
                            <span>Subtotal Penerimaan Kotor:</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400">
                              Rp {item.grossEarnings.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Potongan / Deductions */}
                      <div
                        className={`rounded-xl border overflow-hidden ${
                          isLight ? 'border-slate-200 bg-white' : 'border-[#30363d] bg-[#0d1117]'
                        }`}
                      >
                        <div
                          className={`px-3.5 py-2 font-bold uppercase text-[11px] flex items-center justify-between border-b ${
                            isLight
                              ? 'bg-slate-100 text-slate-800 border-slate-200'
                              : 'bg-slate-900 text-gray-200 border-[#30363d]'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span>{isEn ? 'B. Deductions' : 'B. Rincian Potongan Gaji'}</span>
                          </span>
                          <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">
                            - Rp {item.totalEmployeeDeduction.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="p-3.5 space-y-2.5">
                          {/* Potongan Absensi */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">
                                {isEn ? 'Attendance Penalty' : 'Potongan Absensi / Keterlambatan'}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {item.lateCount > 0
                                  ? `${item.lateCount}x terlambat @ Rp ${item.latePenaltyRate.toLocaleString('id-ID')}`
                                  : 'Presensi tertib tanpa sanksi'}
                              </div>
                            </div>
                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                              {item.absenceDeduction > 0
                                ? `- Rp ${item.absenceDeduction.toLocaleString('id-ID')}`
                                : 'Rp 0'}
                            </span>
                          </div>

                          {/* BPJS Kesehatan Karyawan (1%) */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">
                                {isEn ? 'BPJS Health (1%)' : 'BPJS Kesehatan Karyawan (1%)'}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {item.isBpjsActive ? '1% dari Gaji Pokok' : 'Non-Aktif (Opt-Out)'}
                              </div>
                            </div>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              {item.isBpjsActive
                                ? `- Rp ${item.kesEmployee.toLocaleString('id-ID')}`
                                : 'Rp 0'}
                            </span>
                          </div>

                          {/* BPJS Ketenagakerjaan Karyawan (3%) */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">
                                {isEn ? 'BPJS Employment (3%)' : 'BPJS Ketenagakerjaan Karyawan (3%)'}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {item.isBpjsActive ? 'JHT (2%) + JP (1%)' : 'Non-Aktif (Opt-Out)'}
                              </div>
                            </div>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              {item.isBpjsActive
                                ? `- Rp ${item.tkEmployee.toLocaleString('id-ID')}`
                                : 'Rp 0'}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold">
                            <span>Subtotal Potongan:</span>
                            <span className="font-mono text-rose-600 dark:text-rose-400">
                              - Rp {item.totalEmployeeDeduction.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Beban Perusahaan (Informasional - Tidak Memotong Gaji) */}
                    {item.isBpjsActive && (
                      <div
                        className={`p-3.5 rounded-xl border text-[11px] space-y-1.5 ${
                          isLight
                            ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                            : 'bg-[#0052FF]/10 border-[#0052FF]/30 text-gray-300'
                        }`}
                      >
                        <div className="font-bold text-[#0052FF] dark:text-[#58a6ff] flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5" />
                          <span>
                            {isEn
                              ? 'Company Contribution (Borne by Employer - Not Deducted from Salary):'
                              : 'Beban Iuran BPJS Ditanggung Perusahaan (Tidak Memotong Gaji):'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-[10px] text-gray-600 dark:text-gray-400 pt-1">
                          <div className="flex items-center justify-between">
                            <span>BPJS Kesehatan Perusahaan (4%):</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-white">
                              Rp {item.kesCompany.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>BPJS Ketenagakerjaan (6.24%):</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-white">
                              Rp {item.tkCompany.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* BANNER UTAMA TAKE-HOME PAY (THP) BERSIH */}
                    <div
                      className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isLight
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                          : 'bg-emerald-950/40 border-emerald-500/50 text-white'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          {isEn ? 'NET TAKE-HOME PAY (READY FOR DISBURSEMENT)' : 'TOTAL GAJI BERSIH DITERIMA (TAKE-HOME PAY)'}
                        </div>
                        <div className="text-[11px] text-gray-600 dark:text-gray-300">
                          Perhitungan:{' '}
                          <span className="font-mono font-bold">
                            Rp {item.grossEarnings.toLocaleString('id-ID')} (Bruto) - Rp{' '}
                            {item.totalEmployeeDeduction.toLocaleString('id-ID')} (Potongan)
                          </span>
                        </div>
                        <div className="text-[10px] italic text-emerald-800 dark:text-emerald-300/90 font-medium">
                          &ldquo;{formatTerbilang(item.takeHomePay)}&rdquo;
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                          Rp {item.takeHomePay.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                          Penyaluran via: <strong>{selectedPaymentSource}</strong>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Slip Footer Actions */}
            <div
              className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 no-print ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
              }`}
            >
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                Dokumen resmi HRD JacS RetailOS ERP &bull; Sah tanpa tanda tangan basah
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const item = payrollItems.find(
                      (p) => p.employee.id === selectedSlipEmployee.id
                    )!;
                    handleCopySlipText(item);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-[#1c2128] hover:bg-[#252c37] text-gray-200 border-[#30363d]'
                  }`}
                  title="Salin rincian slip gaji ke clipboard"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Slip</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer transition shadow-sm"
                  title="Cetak atau unduh slip gaji dalam format PDF"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>Cetak / Unduh PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSlipEmployee(null)}
                  className="px-4 py-2 rounded-xl bg-[#0052FF] hover:bg-[#0043d1] text-white font-bold text-xs cursor-pointer transition shadow-sm"
                >
                  {isEn ? 'Close' : 'Tutup'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL KONFIRMASI BAYAR GAJI */}
      {/* ========================================================================= */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4 ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900'
                : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700/40">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-base">Konfirmasi Pembayaran Gaji</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pencairan payroll &amp; penerbitan jurnal akuntansi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="text-gray-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div
                className={`p-3.5 rounded-xl border space-y-2 ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-slate-900/60 border-slate-800 text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Target Penerima:</span>
                  <span className="font-bold">
                    {targetPayEmployee === 'ALL'
                      ? `Seluruh Karyawan (${employees.length} Orang)`
                      : `${targetPayEmployee?.name} (${targetPayEmployee?.nip})`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Periode Gaji:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-cyan-400">
                    September 2026
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="font-bold">Total Pembayaran (THP):</span>
                  <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    Rp{' '}
                    {(targetPayEmployee === 'ALL'
                      ? summary.totalTakeHomePay
                      : payrollItems.find((p) => p.employee.id === targetPayEmployee?.id)?.takeHomePay ??
                        0
                    ).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Pilihan Sumber Dana */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block mb-1.5">
                  Pilih Sumber Rekening / Kas Pengeluaran:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentSource('Bank Operasional')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      selectedPaymentSource === 'Bank Operasional'
                        ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-300 shadow-sm'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-[#0d1117] border-[#30363d] text-gray-300'
                    }`}
                  >
                    <div className="font-bold">Bank Operasional</div>
                    <div className="text-[10px] text-gray-400 font-mono">Akun 1-10002</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentSource('Kas Utama')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      selectedPaymentSource === 'Kas Utama'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-300 shadow-sm'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-[#0d1117] border-[#30363d] text-gray-300'
                    }`}
                  >
                    <div className="font-bold">Kas Utama / Brankas</div>
                    <div className="text-[10px] text-gray-400 font-mono">Akun 1-10000</div>
                  </button>
                </div>
              </div>

              {/* Catatan Pembayaran */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block mb-1">
                  Catatan Memo Pembukuan:
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Catatan memo pembayaran..."
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                      : 'bg-[#0d1117] border-[#30363d] text-white focus:border-blue-500'
                  }`}
                />
              </div>

              <div
                className={`p-3 rounded-xl border text-[11px] flex items-start gap-2 ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Sistem otomatis mendebit <strong>Beban Gaji Karyawan (5-10201)</strong> dan mengkredit akun{' '}
                  <strong>{selectedPaymentSource}</strong> di modul Keuangan &amp; Akuntansi.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-payroll-payment"
                onClick={handleConfirmPayment}
                disabled={isProcessingPayment}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <DollarSign className="w-4 h-4" />
                <span>{isProcessingPayment ? 'Memproses...' : 'Konfirmasi Pencairan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
