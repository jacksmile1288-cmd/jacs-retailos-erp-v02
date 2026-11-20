import React, { useState, useMemo } from 'react';
import { useApp, isCashierEmployee } from '../../context/AppContext';
import { Employee } from '../../types';
import { CashierCommissionSlipItem } from './PayrollModule';
import { hasValidProfileValue } from '../../utils/businessProfileUtils';
import { calculateLaundryStaffIncentives } from '../../utils/laundryCommission';
import { calculateFashionAdvisorCommissions } from '../../utils/fashionAnalytics';
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
    recordPayrollExpense,
    processPayrollPayment,
    showToast,
    calculateCashierCommission,
    businessProfile,
    laundryOrders,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
  const [selectedSlipEmployee, setSelectedSlipEmployee] = useState<Employee | null>(null);
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

  // Insentif Produksi Staf Laundry (per kg / per item / per pasang-karpet)
  const laundryIncentives = useMemo(
    () => calculateLaundryStaffIncentives(employees, laundryOrders || [], selectedPeriod),
    [employees, laundryOrders, selectedPeriod]
  );

  // Insentif Penjualan Bersih Fashion Advisor / Pramuniaga Butik
  const fashionAdvisorIncentives = useMemo(
    () => calculateFashionAdvisorCommissions(employees, salesHistory || [], selectedPeriod),
    [employees, salesHistory, selectedPeriod]
  );

  // Komputasi metrik gaji lengkap per karyawan (sinkronisasi realtime omzet kasir COMPLETED & produksi Laundry)
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

      // 3b. Komisi Produksi Laundry (per kg / satuan / teknisi)
      const laundrySummary = laundryIncentives.byEmployeeId[emp.id];
      const laundryCommission = laundrySummary?.totalIncentive || 0;
      const hasLaundryCommission =
        laundryCommission > 0 || (laundrySummary?.ordersHandledCount || 0) > 0;

      // 3c. Komisi Penjualan Bersih Fashion Advisor / Pramuniaga
      const fashionSummary = fashionAdvisorIncentives.byEmployeeId[emp.id];
      const fashionAdvisorCommission = fashionSummary?.totalCommission || 0;
      const hasFashionCommission =
        fashionAdvisorCommission > 0 || (fashionSummary?.trxCount || 0) > 0;

      // 4. Iuran BPJS (Kesehatan & Ketenagakerjaan)
      const kesCompany = isBpjsActive ? Math.round(baseSalary * RATES.kesCompany) : 0;
      const kesEmployee = isBpjsActive ? Math.round(baseSalary * RATES.kesEmployee) : 0;
      const tkCompany = isBpjsActive ? Math.round(baseSalary * RATES.tkCompany) : 0;
      const tkEmployee = isBpjsActive ? Math.round(baseSalary * RATES.tkEmployee) : 0;

      const totalCompanyBpjs = kesCompany + tkCompany;
      const totalBpjsEmployeeDeduction = kesEmployee + tkEmployee;
      const totalEmployeeDeduction = totalBpjsEmployeeDeduction + absenceDeduction;

      // 5. Total Penerimaan Kotor & Take-Home Pay
      const grossEarnings =
        baseSalary + dailyAllowance + cashierCommission + laundryCommission + fashionAdvisorCommission;
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
        laundryCommission,
        hasLaundryCommission,
        laundryOrdersCount: laundrySummary?.ordersHandledCount || 0,
        laundryKgProcessed: laundrySummary?.kiloanKgProcessed || 0,
        laundrySatuanPcs: laundrySummary?.satuanPcsProcessed || 0,
        laundrySpecialistUnits:
          (laundrySummary?.pasangProcessed || 0) + (laundrySummary?.areaM2Processed || 0),
        fashionAdvisorCommission,
        hasFashionCommission,
        fashionNetSalesTotal: fashionSummary?.netSalesTotal || 0,
        fashionTrxCount: fashionSummary?.trxCount || 0,
        fashionCommissionRate: fashionSummary?.commissionRatePercent ?? (emp.fashionCommissionRate ?? 2),
        commissionSalesTotal: commissionData.salesTotal,
        commissionTrxCount: commissionData.transactionCount,
        commissionRatePercent: commissionData.ratePercent,
        commissionPeriodMonth: commissionData.periodMonth,
        grossEarnings,
        takeHomePay,
        totalRemittance,
      };
    });
  }, [employees, attendanceLogs, salesHistory, activeUser, selectedPeriod, calculateCashierCommission, laundryIncentives, fashionAdvisorIncentives]);

  // Ringkasan Agregat Payroll
  const summary = useMemo(() => {
    const totalStaffCount = employees.length;
    const activeBpjsStaffCount = payrollItems.filter((i) => i.isBpjsActive).length;

    const totalBaseSalary = payrollItems.reduce((acc, i) => acc + i.baseSalary, 0);
    const totalDailyAllowances = payrollItems.reduce((acc, i) => acc + i.dailyAllowance, 0);
    const totalCashierCommissions = payrollItems.reduce((acc, i) => acc + i.cashierCommission, 0);
    const totalLaundryCommissions = payrollItems.reduce((acc, i) => acc + i.laundryCommission, 0);
    const totalFashionCommissions = payrollItems.reduce((acc, i) => acc + i.fashionAdvisorCommission, 0);
    const totalCommissionsCombined =
      totalCashierCommissions + totalLaundryCommissions + totalFashionCommissions;
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
      totalLaundryCommissions,
      totalFashionCommissions,
      totalCommissionsCombined,
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
    recordPayrollExpense(summary);
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
        const totalAmountToPay = filteredPayrollItems.reduce((acc, item) => acc + item.takeHomePay, 0);
        processPayrollPayment('ALL', selectedPaymentSource, payNotes, totalAmountToPay);
      } else {
        const found = payrollItems.find(item => item.employee.id === targetPayEmployee.id);
        const totalAmountToPay = found ? found.takeHomePay : 0;
        processPayrollPayment(targetPayEmployee.id, selectedPaymentSource, payNotes, totalAmountToPay);
      }
      setIsPayModalOpen(false);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const generateSlipPrintHtml = (item: (typeof payrollItems)[0]) => {
    const companyName = 'COBA MART';
    const companyAddress = 'Jl. Veteran Selatan No. 128, Mamajang, Kota Makassar, Sulawesi Selatan 90132';
    const companyContact = 'Telp: (0411) 876-5432 • Email: finance@cobamart.co.id';
    const slipNumber = `SLIP/2026/09/${item.employee.nip.split('-').pop() || item.employee.nip}`;

    return `
      <div class="slip-doc">
        <!-- Kop Surat Resmi COBA MART Makassar -->
        <div class="kop-header">
          <div class="kop-brand">
            <div class="brand-title">${companyName}</div>
            <div class="brand-sub">MINIMARKET & GROSIR MODERN</div>
            <div class="brand-info">${companyAddress}</div>
            <div class="brand-info">${companyContact}</div>
          </div>
          <div class="kop-badge">
            <div class="confidential-tag">CONFIDENTIAL</div>
            <div class="slip-no">${slipNumber}</div>
            <div class="slip-date">Makassar, 30 September 2026</div>
          </div>
        </div>

        <div class="kop-divider"></div>

        <!-- Judul Voucher Slip Gaji -->
        <div class="slip-title-bar">
          <div class="slip-title">SLIP GAJI KARYAWAN (PAYROLL VOUCHER)</div>
          <div class="slip-period">PERIODE: SEPTEMBER 2026</div>
        </div>

        <!-- Info Pegawai -->
        <table class="meta-table">
          <tr>
            <td class="meta-lbl">Nama Karyawan</td>
            <td class="meta-val">: <span style="font-weight:600">${item.employee.name}</span></td>
            <td class="meta-lbl">Jabatan / Role</td>
            <td class="meta-val">: ${item.employee.role}</td>
          </tr>
          <tr>
            <td class="meta-lbl">NIP</td>
            <td class="meta-val">: ${item.employee.nip}</td>
            <td class="meta-lbl">Departemen</td>
            <td class="meta-val">: ${item.employee.department}</td>
          </tr>
          <tr>
            <td class="meta-lbl">Status Kerja</td>
            <td class="meta-val">: ${item.employee.contractStatus || 'Karyawan Tetap'}</td>
            <td class="meta-lbl">Kehadiran Kerja</td>
            <td class="meta-val">: <span style="font-weight:600">${item.attendedDays} Hari</span> (Bulan Ini)</td>
          </tr>
        </table>

        <!-- Layout 2 Kolom Bersanding: Penerimaan vs Potongan -->
        <div class="columns-grid">
          <!-- Kolom Kiri: Penerimaan -->
          <div class="col-panel">
            <div class="col-head col-head-green">A. PENERIMAAN (EARNINGS)</div>
            <table class="item-table">
              <tr>
                <td>
                  <div class="item-title">Gaji Pokok</div>
                  <div class="item-desc">Gaji dasar bulanan terstandar</div>
                </td>
                <td class="item-amount">Rp ${item.baseSalary.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td>
                  <div class="item-title">Tunjangan Harian</div>
                  <div class="item-desc">${item.attendedDays} hari hadir &times; Rp ${item.dailyRate.toLocaleString('id-ID')} (makan & transport)</div>
                </td>
                <td class="item-amount">Rp ${item.dailyAllowance.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td>
                  <div class="item-title">Komisi Penjualan POS (1%)</div>
                  <div class="item-desc">
                    ${
                      item.isCashier
                        ? `1% dari omzet kasir Rp ${item.commissionSalesTotal.toLocaleString('id-ID')} (${item.commissionTrxCount} transaksi)`
                        : 'Non-Kasir (Bukan Operator Kasir POS)'
                    }
                  </div>
                </td>
                <td class="item-amount">${item.isCashier ? `Rp ${item.cashierCommission.toLocaleString('id-ID')}` : 'Rp 0'}</td>
              </tr>
              ${
                item.hasLaundryCommission
                  ? `<tr>
                <td>
                  <div class="item-title">Komisi Produksi Laundry (Per Kg / Item)</div>
                  <div class="item-desc">${item.laundryOrdersCount} order (${item.laundryKgProcessed} kg &bull; ${item.laundrySatuanPcs} pcs &bull; ${item.laundrySpecialistUnits} unit khusus)</div>
                </td>
                <td class="item-amount">Rp ${item.laundryCommission.toLocaleString('id-ID')}</td>
              </tr>`
                  : ''
              }
              ${
                item.hasFashionCommission
                  ? `<tr>
                <td>
                  <div class="item-title">Komisi Fashion Advisor (${item.fashionCommissionRate}%)</div>
                  <div class="item-desc">${item.fashionTrxCount} nota &bull; Penjualan Bersih Rp ${item.fashionNetSalesTotal.toLocaleString('id-ID')}</div>
                </td>
                <td class="item-amount">Rp ${item.fashionAdvisorCommission.toLocaleString('id-ID')}</td>
              </tr>`
                  : ''
              }
              <tr class="item-subtotal">
                <td><span style="font-weight:600">SUBTOTAL PENERIMAAN KOTOR</span></td>
                <td class="item-amount"><span style="font-weight:600">Rp ${item.grossEarnings.toLocaleString('id-ID')}</span></td>
              </tr>
            </table>
          </div>

          <!-- Kolom Kanan: Potongan -->
          <div class="col-panel">
            <div class="col-head col-head-red">B. POTONGAN (DEDUCTIONS)</div>
            <table class="item-table">
              <tr>
                <td>
                  <div class="item-title">Denda Keterlambatan</div>
                  <div class="item-desc">
                    ${
                      item.lateCount > 0
                        ? `${item.lateCount}x terlambat presensi @ Rp ${item.latePenaltyRate.toLocaleString('id-ID')}`
                        : 'Disiplin hadir tepat waktu (Tanpa Denda)'
                    }
                  </div>
                </td>
                <td class="item-amount">${item.absenceDeduction > 0 ? `Rp ${item.absenceDeduction.toLocaleString('id-ID')}` : 'Rp 0'}</td>
              </tr>
              <tr>
                <td>
                  <div class="item-title">BPJS Kesehatan (1%)</div>
                  <div class="item-desc">Iuran wajib pekerja 1% dari Gaji Pokok</div>
                </td>
                <td class="item-amount">${item.isBpjsActive ? `Rp ${item.kesEmployee.toLocaleString('id-ID')}` : 'Rp 0'}</td>
              </tr>
              <tr>
                <td>
                  <div class="item-title">BPJS Ketenagakerjaan (3%)</div>
                  <div class="item-desc">Jaminan Hari Tua (2%) + Jaminan Pensiun (1%)</div>
                </td>
                <td class="item-amount">${item.isBpjsActive ? `Rp ${item.tkEmployee.toLocaleString('id-ID')}` : 'Rp 0'}</td>
              </tr>
              <tr class="item-subtotal">
                <td><span style="font-weight:600">SUBTOTAL POTONGAN</span></td>
                <td class="item-amount text-danger"><span style="font-weight:600">Rp ${item.totalEmployeeDeduction.toLocaleString('id-ID')}</span></td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Banner Take Home Pay (THP) Bersih & Terbilang -->
        <div class="thp-container">
          <div class="thp-row">
            <div class="thp-title">TOTAL PENERIMAAN BERSIH (TAKE HOME PAY)</div>
            <div class="thp-val">Rp ${item.takeHomePay.toLocaleString('id-ID')}</div>
          </div>
          <div class="thp-spelling">
            Terbilang: <span style="font-weight:600"># ${formatTerbilang(item.takeHomePay)} #</span>
          </div>
        </div>

        <!-- Kolom Tanda Tangan 2 Kolom -->
        <div class="signature-section">
          <div class="sig-box">
            <div class="sig-title">Diterima Oleh (Karyawan),</div>
            <div class="sig-line-space"></div>
            <div class="sig-author">( ${item.employee.name} )</div>
            <div class="sig-nip">NIP. ${item.employee.nip}</div>
          </div>
          <div class="sig-box">
            <div class="sig-date">Makassar, 30 September 2026</div>
            <div class="sig-title">Disetujui Oleh (Finance / HRD),</div>
            <div class="sig-line-space"></div>
            <div class="sig-author">( Siti Rahma, S.E. )</div>
            <div class="sig-nip">Manager Finance & HRD</div>
          </div>
        </div>

        <!-- Footnote Dokumen Resmi -->
        <div class="doc-footnote">
          * Slip gaji ini merupakan dokumen rahasia dan bukti pembayaran resmi dari COBA MART Makassar. Dibuat dan dicetak melalui JacS RetailOS.
        </div>
      </div>
    `;
  };

  const handlePrintSlip = (item?: (typeof payrollItems)[0]) => {
    const targetItem = item || (selectedSlipEmployee ? payrollItems.find((p) => p.employee.id === selectedSlipEmployee.id) : null);
    showToast(isEn ? 'Opening pay slip print preview...' : 'Membuka dokumen cetak slip gaji A5...');

    if (targetItem) {
      try {
        const printWindow = window.open('', '_blank', 'width=1000,height=680');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8" />
              <title>Slip Gaji - ${targetItem.employee.name} (${targetItem.employee.nip})</title>
              <style>
                @page {
                  size: A5 landscape;
                  margin: 8mm;
                }
                * {
                  box-sizing: border-box;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  background: #ffffff;
                  color: #0f172a;
                  font-size: 10.5px;
                  line-height: 1.35;
                }
                .slip-doc {
                  width: 100%;
                  max-width: 196mm;
                  margin: 0 auto;
                  padding: 2mm;
                  background: #ffffff;
                }
                .kop-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                }
                .brand-title {
                  font-size: 18px;
                  font-weight: 900;
                  letter-spacing: -0.3px;
                  color: #0f172a;
                }
                .brand-sub {
                  font-size: 10px;
                  font-weight: 700;
                  color: #0369a1;
                  letter-spacing: 0.8px;
                  margin-top: 1px;
                }
                .brand-info {
                  font-size: 9.5px;
                  color: #475569;
                  margin-top: 1px;
                }
                .kop-badge {
                  text-align: right;
                }
                .confidential-tag {
                  display: inline-block;
                  padding: 2px 7px;
                  border: 1.5px solid #dc2626;
                  color: #dc2626;
                  background: #fef2f2;
                  font-weight: 900;
                  font-size: 9.5px;
                  letter-spacing: 0.8px;
                  border-radius: 3px;
                }
                .slip-no {
                  font-family: monospace;
                  font-size: 9.5px;
                  font-weight: 700;
                  color: #334155;
                  margin-top: 4px;
                }
                .slip-date {
                  font-size: 9px;
                  color: #64748b;
                  margin-top: 1px;
                }
                .kop-divider {
                  border-top: 2px solid #0f172a;
                  border-bottom: 1px solid #64748b;
                  height: 3px;
                  margin: 5px 0 7px 0;
                }
                .slip-title-bar {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  background: #f1f5f9;
                  border: 1px solid #cbd5e1;
                  padding: 4px 8px;
                  margin-bottom: 7px;
                  border-radius: 3px;
                }
                .slip-title {
                  font-weight: 900;
                  font-size: 11px;
                  letter-spacing: 0.5px;
                  color: #0f172a;
                }
                .slip-period {
                  font-weight: 700;
                  font-size: 10px;
                  color: #334155;
                }
                .meta-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 8px;
                  font-size: 9.5px;
                }
                .meta-table td {
                  padding: 2px 4px;
                }
                .meta-lbl {
                  width: 15%;
                  color: #475569;
                  font-weight: 600;
                }
                .meta-val {
                  width: 35%;
                  color: #0f172a;
                }
                .columns-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 10px;
                  margin-bottom: 8px;
                }
                .col-panel {
                  border: 1px solid #cbd5e1;
                  border-radius: 4px;
                  overflow: hidden;
                }
                .col-head {
                  padding: 4px 8px;
                  font-weight: 800;
                  font-size: 10px;
                  letter-spacing: 0.3px;
                  border-bottom: 1px solid #cbd5e1;
                }
                .col-head-green {
                  background: #f0fdf4;
                  color: #166534;
                }
                .col-head-red {
                  background: #fef2f2;
                  color: #991b1b;
                }
                .item-table {
                  width: 100%;
                  border-collapse: collapse;
                  font-size: 9.5px;
                }
                .item-table td {
                  padding: 3.5px 7px;
                  border-bottom: 1px dashed #e2e8f0;
                  vertical-align: top;
                }
                .item-title {
                  font-weight: 600;
                  color: #1e293b;
                }
                .item-desc {
                  font-size: 8px;
                  color: #64748b;
                  margin-top: 1px;
                }
                .item-amount {
                  text-align: right;
                  font-family: monospace;
                  font-weight: 700;
                  white-space: nowrap;
                  color: #0f172a;
                }
                .item-subtotal {
                  background: #f8fafc;
                }
                .item-subtotal td {
                  border-top: 1.5px solid #cbd5e1;
                  border-bottom: none;
                  padding: 5px 7px;
                }
                .text-danger {
                  color: #b91c1c;
                }
                .thp-container {
                  background: #f8fafc;
                  border: 1.5px solid #0f172a;
                  border-radius: 4px;
                  padding: 5px 10px;
                  margin-bottom: 8px;
                }
                .thp-row {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                }
                .thp-title {
                  font-weight: 900;
                  font-size: 10.5px;
                  letter-spacing: 0.5px;
                  color: #0f172a;
                }
                .thp-val {
                  font-family: monospace;
                  font-size: 15px;
                  font-weight: 900;
                  color: #0f172a;
                }
                .thp-spelling {
                  font-size: 9px;
                  color: #334155;
                  margin-top: 2px;
                }
                .signature-section {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 16px;
                  margin-top: 8px;
                  font-size: 9.5px;
                }
                .sig-box {
                  text-align: center;
                }
                .sig-date {
                  margin-bottom: 2px;
                  color: #475569;
                }
                .sig-title {
                  font-weight: 600;
                  color: #1e293b;
                }
                .sig-line-space {
                  height: 42px;
                }
                .sig-author {
                  font-weight: 800;
                  text-decoration: underline;
                  color: #0f172a;
                }
                .sig-nip {
                  font-size: 8.5px;
                  color: #64748b;
                  margin-top: 1px;
                }
                .doc-footnote {
                  text-align: center;
                  font-size: 7.5px;
                  color: #94a3b8;
                  font-style: italic;
                  margin-top: 8px;
                }
              </style>
            </head>
            <body>
              ${generateSlipPrintHtml(targetItem)}
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 250);
                };
              </script>
            </body>
            </html>
          `);
          printWindow.document.close();
          return;
        }
      } catch (err) {
        console.warn('Popup print blocked or failed, falling back to direct print:', err);
      }
    }

    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleCopySlipText = (item: (typeof payrollItems)[0]) => {
    const text = `=== SLIP GAJI RESMI KARYAWAN ===
Perusahaan : COBA MART Makassar
Alamat     : Jl. Veteran Selatan No. 128, Mamajang, Kota Makassar, Sulawesi Selatan
No. Slip   : SLIP/2026/09/${item.employee.nip.split('-').pop() || item.employee.nip}
Periode    : September 2026
Staf       : ${item.employee.name} (${item.employee.nip})
Jabatan    : ${item.employee.role} [${item.employee.department}]
Status     : ${item.employee.contractStatus || 'Karyawan Tetap'} - ${item.employee.payrollStatus || 'PAID'}
Kehadiran  : ${item.attendedDays} Hari Kerja Hadir

[A. PENERIMAAN]
- Gaji Pokok               : Rp ${item.baseSalary.toLocaleString('id-ID')}
- Tunjangan Harian (${item.attendedDays} hari): Rp ${item.dailyAllowance.toLocaleString('id-ID')}
${
  item.isCashier
    ? `- Komisi Penjualan POS (1%): Rp ${item.cashierCommission.toLocaleString(
        'id-ID'
      )} (Omzet: Rp ${item.commissionSalesTotal.toLocaleString('id-ID')} | ${item.commissionTrxCount} trx)\n`
    : ''
}${
  item.hasLaundryCommission
    ? `- Insentif Produksi Laundry: Rp ${item.laundryCommission.toLocaleString(
        'id-ID'
      )} (${item.laundryOrdersCount} order | ${item.laundryKgProcessed} kg)\n`
    : ''
}${
  item.hasFashionCommission
    ? `- Komisi Fashion Advisor (${item.fashionCommissionRate}%): Rp ${item.fashionAdvisorCommission.toLocaleString(
        'id-ID'
      )} (Net Sales: Rp ${item.fashionNetSalesTotal.toLocaleString('id-ID')} | ${item.fashionTrxCount} nota)\n`
    : ''
}- Total Penerimaan Kotor  : Rp ${item.grossEarnings.toLocaleString('id-ID')}

[B. POTONGAN]
- Denda Keterlambatan      : -Rp ${item.absenceDeduction.toLocaleString('id-ID')}${
      item.lateCount > 0 ? ` (${item.lateCount}x terlambat)` : ''
    }
- BPJS Kesehatan (1%)      : -Rp ${item.kesEmployee.toLocaleString('id-ID')}
- BPJS Ketenagakerjaan (3%): -Rp ${item.tkEmployee.toLocaleString('id-ID')}
- Total Potongan           : -Rp ${item.totalEmployeeDeduction.toLocaleString('id-ID')}

[C. TAKE-HOME PAY BERSIH]
TOTAL GAJI BERSIH (THP)    : Rp ${item.takeHomePay.toLocaleString('id-ID')}
Terbilang: # ${formatTerbilang(item.takeHomePay)} #
================================
Makassar, 30 September 2026
Diterima Oleh: ${item.employee.name}
Disetujui Oleh: Siti Rahma, S.E. (Manager Finance & HRD)`;
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
      {/* Inline Print Stylesheet for Pure Slip Printing in A5 Landscape */}
      <style>{`
        @page {
          size: A5 landscape;
          margin: 8mm;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-pay-slip, #printable-pay-slip * {
            visibility: visible !important;
          }
          #printable-pay-slip {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 6mm !important;
            background: #ffffff !important;
            color: #0f172a !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            z-index: 999999 !important;
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
        className={`p-5 rounded-2xl border transition-all duration-200 ${
          isLight
            ? 'bg-white border-cyan-500/70 text-slate-900 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-[#161b22] border-cyan-500/35 text-white shadow-[0_0_16px_rgba(6,182,212,0.08)]'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-mono font-normal tracking-widest uppercase mb-2 ${
                isLight
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-700'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {isEn
                  ? 'Payroll & Cashier Sales Commission Hub'
                  : 'Sistem Penggajian & Komisi Penjualan Kasir'}
              </span>
            </div>
            <h3
              className={`text-base font-medium tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {isEn ? 'Staff Payroll & Commission Management' : 'Rekapitulasi Gaji, Tunjangan & Komisi Kasir'}
            </h3>
            <p className="text-sm font-normal text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              {isEn
                ? 'Comprehensive staff salary computation with daily allowance, attendance late penalties, automated 1% cashier POS sales turnover commission, and BPJS social security sync to Finance Journal.'
                : 'Perhitungan gaji komprehensif mencakup Gaji Pokok, Tunjangan Harian, Potongan Absensi/Keterlambatan, Estimasi Komisi Penjualan Kasir (1% dari omzet POS), serta Iuran BPJS siap cetak slip gaji.'}
            </p>
          </div>

          {/* Sync Button, Pay All Button & Status Badge */}
          <div className="flex flex-wrap items-center gap-3">
            {isPayrollSynced ? (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono font-normal tracking-wider ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.16)]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="flex flex-col text-left">
                  <span>{isEn ? 'Synced to Finance' : 'Tersinkronisasi ke Keuangan'}</span>
                  {lastPayrollSyncTime && (
                    <span className="text-[11px] opacity-80 font-mono font-normal">
                      {lastPayrollSyncTime}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono font-normal tracking-wider ${
                  isLight
                    ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-[0_0_12px_rgba(245,158,11,0.18)]'
                    : 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.15)]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span>{isEn ? 'Unsynced Draft' : 'Draft Belum Disinkronkan'}</span>
              </div>
            )}

            <button
              id="btn-pay-all-salaries"
              type="button"
              onClick={() => handleOpenPayModal('ALL')}
              className={`flex items-center gap-1.5 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                isLight
                  ? 'bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 shadow-[0_0_16px_rgba(16,185,129,0.22)]'
                  : 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/50 shadow-[0_0_18px_rgba(16,185,129,0.3)]'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>{isEn ? 'Pay All Salaries' : 'Bayar Semua Gaji'}</span>
            </button>

            <button
              id="btn-sync-payroll-finance"
              type="button"
              onClick={handleSyncFinance}
              className={`flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                isLight
                  ? 'bg-cyan-600 hover:bg-cyan-700 border border-cyan-600 shadow-[0_0_16px_rgba(6,182,212,0.22)]'
                  : 'bg-cyan-600 hover:bg-cyan-500 border border-cyan-400/50 shadow-[0_0_18px_rgba(6,182,212,0.28)]'
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
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
            isLight
              ? 'bg-white border-cyan-500/70 text-slate-900 shadow-[0_0_16px_rgba(6,182,212,0.16)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)]'
              : 'bg-[#161b22] border-cyan-500/35 text-white shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:shadow-[0_0_24px_rgba(6,182,212,0.24)]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-normal uppercase tracking-widest text-cyan-700 dark:text-cyan-400">
              {isEn ? 'Base & Allowance' : 'Gaji Pokok & Tunjangan'}
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${
                isLight
                  ? 'bg-cyan-50 text-cyan-600 border-cyan-200'
                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg font-mono font-medium text-slate-900 dark:text-white">
              Rp {(summary.totalBaseSalary + summary.totalDailyAllowances).toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] font-mono font-normal text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between gap-1">
              <span>Pokok: Rp {summary.totalBaseSalary.toLocaleString('id-ID')}</span>
              <span className="text-sky-600 dark:text-sky-400">
                +{summary.totalDailyAllowances.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Estimasi Komisi Penjualan Kasir & Produksi Laundry */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
            isLight
              ? 'bg-white border-cyan-500/70 text-slate-900 shadow-[0_0_16px_rgba(6,182,212,0.16)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)]'
              : 'bg-[#161b22] border-cyan-500/35 text-white shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:shadow-[0_0_24px_rgba(6,182,212,0.24)]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-normal uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              {isEn ? 'POS, Laundry & Fashion Comm.' : 'Komisi POS, Laundry & Butik'}
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${
                isLight
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg font-mono font-medium text-emerald-600 dark:text-emerald-400">
              + Rp {summary.totalCommissionsCombined.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] font-mono font-normal text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between gap-1 flex-wrap">
              <span>Kasir: {(summary.totalCashierCommissions / 1000).toFixed(0)}rb</span>
              {summary.totalLaundryCommissions > 0 && (
                <span className="text-cyan-600 dark:text-cyan-300">
                  Lnd: {(summary.totalLaundryCommissions / 1000).toFixed(0)}rb
                </span>
              )}
              <span className="text-fuchsia-600 dark:text-fuchsia-300">
                Butik: +Rp {summary.totalFashionCommissions.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Potongan Absensi & Keterlambatan */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
            summary.totalAbsenceDeductions > 0
              ? 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.22)] hover:shadow-[0_0_24px_rgba(245,158,11,0.32)]'
              : isLight
              ? 'bg-white border-cyan-500/70 text-slate-900 shadow-[0_0_16px_rgba(6,182,212,0.16)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)]'
              : 'bg-[#161b22] border-cyan-500/35 text-white shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:shadow-[0_0_24px_rgba(6,182,212,0.24)]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[11px] font-mono font-normal uppercase tracking-widest ${
                summary.totalAbsenceDeductions > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isEn ? 'Attendance Penalty' : 'Potongan Absensi'}
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${
                isLight
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg font-mono font-medium text-rose-600 dark:text-rose-400">
              - Rp {summary.totalAbsenceDeductions.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] font-mono font-normal text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span>Denda terlambat</span>
              <span>Rp 50rb / insiden</span>
            </div>
          </div>
        </div>

        {/* Card 4: Beban BPJS Perusahaan */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
            isLight
              ? 'bg-white border-cyan-500/70 text-slate-900 shadow-[0_0_16px_rgba(6,182,212,0.16)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)]'
              : 'bg-[#161b22] border-cyan-500/35 text-white shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:shadow-[0_0_24px_rgba(6,182,212,0.24)]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-normal uppercase tracking-widest text-purple-600 dark:text-purple-400">
              {isEn ? 'Employer BPJS Cost' : 'Beban BPJS Co.'}
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${
                isLight
                  ? 'bg-purple-50 text-purple-600 border-purple-200'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg font-mono font-medium text-purple-600 dark:text-purple-400">
              Rp {summary.totalCompanyContribution.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] font-mono font-normal text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span>Beban 10.24%</span>
              <span className="text-purple-600 dark:text-purple-400">Non-potong THP</span>
            </div>
          </div>
        </div>

        {/* Card 5: Total Take-Home Pay (Siap Dicairkan) */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 border-emerald-500/80 shadow-[0_0_18px_rgba(16,185,129,0.22)] hover:shadow-[0_0_24px_rgba(16,185,129,0.34)] ${
            isLight
              ? 'bg-emerald-50/70 text-emerald-950'
              : 'bg-emerald-500/5 text-white'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-normal uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
              {isEn ? 'Total Take-Home Pay' : 'Total Gaji Bersih'}
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${
                isLight
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg font-mono font-medium text-emerald-700 dark:text-emerald-400">
              Rp {summary.totalTakeHomePay.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] font-mono font-normal text-slate-600 dark:text-slate-300 mt-1 flex items-center justify-between">
              <span>
                {summary.totalStaffCount} {isEn ? 'Staff' : 'Staf Aktif'}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-normal border ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-200 ${
          isLight
            ? 'bg-white border-cyan-500/70 text-slate-900 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-[#161b22] border-cyan-500/35 text-white shadow-[0_0_16px_rgba(6,182,212,0.08)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={isEn ? 'Search staff name, NIP, role...' : 'Cari nama staf, NIP, jabatan...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm font-normal border outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                  : 'bg-[#0d1117] border-[#30363d] text-white focus:border-cyan-500'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-mono font-normal uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {isEn ? 'Account:' : 'Rekening:'}
            </label>
            <select
              value={selectedPaymentSource}
              onChange={(e) =>
                setSelectedPaymentSource(e.target.value as 'Bank Operasional' | 'Kas Utama')
              }
              aria-label="Pilih Sumber Kas/Bank"
              className={`px-3 py-2 rounded-xl text-sm font-normal border outline-none cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                  : 'bg-[#0d1117] border-[#30363d] text-white focus:border-cyan-500'
              }`}
            >
              <option value="Bank Operasional">Bank Operasional (1-10002)</option>
              <option value="Kas Utama">Kas Utama / Brankas (1-10000)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-mono font-normal uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {isEn ? 'Period:' : 'Periode:'}
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              aria-label="Pilih Periode Komisi Kasir"
              className={`px-3 py-2 rounded-xl text-sm font-normal border outline-none cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                  : 'bg-[#0d1117] border-[#30363d] text-white focus:border-cyan-500'
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
            type="button"
            onClick={() => setSelectedDeptFilter('ALL')}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.99] whitespace-nowrap cursor-pointer ${
              selectedDeptFilter === 'ALL'
                ? 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.28)]'
                : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                : 'bg-[#0d1117] text-slate-300 border border-[#30363d] hover:border-cyan-500/40'
            }`}
          >
            {isEn ? 'All Divisions' : 'Semua Divisi'} ({employees.length})
          </button>
          {departmentsList.map((dept) => (
            <button
              type="button"
              key={dept}
              onClick={() => setSelectedDeptFilter(dept)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.99] whitespace-nowrap cursor-pointer ${
                selectedDeptFilter === dept
                  ? 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.28)]'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  : 'bg-[#0d1117] text-slate-300 border border-[#30363d] hover:border-cyan-500/40'
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
        className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1150px]">
            <thead>
              <tr
                className={`text-[11px] font-mono font-normal uppercase tracking-widest border-b ${
                  isLight
                    ? 'bg-slate-50 text-slate-600 border-slate-200'
                    : 'bg-[#0d1117] text-slate-400 border-[#30363d]'
                }`}
              >
                <th className="py-3 px-4 font-normal">{isEn ? 'Staff & NIP' : 'Nama & NIP'}</th>
                <th className="py-3 px-3 font-normal">{isEn ? 'Department & Role' : 'Jabatan & Divisi'}</th>
                <th className="py-3 px-3 font-normal text-right">{isEn ? 'Base Salary' : 'Gaji Pokok'}</th>
                <th className="py-3 px-3 font-normal text-right text-sky-600 dark:text-sky-400">
                  {isEn ? 'Daily Allowance' : 'Tunjangan Harian'}
                </th>
                <th className="py-3 px-3 font-normal text-right text-rose-600 dark:text-rose-400">
                  {isEn ? 'Attendance Penalty' : 'Potongan Absensi'}
                </th>
                <th className="py-3 px-3 font-normal text-right text-emerald-600 dark:text-emerald-400">
                  {isEn ? 'POS / Laundry / Advisor Comm.' : 'Komisi POS / Laundry / Butik'}
                </th>
                <th className="py-3 px-3 font-normal text-center">{isEn ? 'BPJS Toggle' : 'Status BPJS'}</th>
                <th className="py-3 px-3 font-normal text-right text-emerald-700 dark:text-emerald-400">
                  {isEn ? 'Take Home Pay' : 'Gaji Bersih (THP)'}
                </th>
                <th className="py-3 px-3 font-normal text-center">{isEn ? 'Status' : 'Status Gaji'}</th>
                <th className="py-3 px-4 font-normal text-center">{isEn ? 'Action' : 'Aksi'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#30363d]/40 text-sm font-normal">
              {filteredPayrollItems.map((item) => {
                const emp = item.employee;

                return (
                  <tr
                    key={emp.id}
                    className={`transition-colors duration-150 ${
                      isLight ? 'hover:bg-cyan-50/40' : 'hover:bg-[#1c2128]'
                    }`}
                  >
                    {/* 1. Staf & NIP */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {emp.avatarUrl || emp.avatar ? (
                          <img
                            src={emp.avatarUrl || emp.avatar || ''}
                            alt={emp.name}
                            className="w-9 h-9 rounded-full object-cover border border-cyan-500/40 shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center border border-cyan-500/40 shrink-0 ${
                              isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            <Users className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div
                            className={`text-sm font-normal truncate ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`}
                          >
                            {emp.name}
                          </div>
                          <div className="font-mono text-[11px] font-normal text-slate-500 dark:text-slate-400">
                            {emp.nip}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Department & Role */}
                    <td className="py-3.5 px-3">
                      <div className={`text-sm font-normal ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {emp.role}
                      </div>
                      <div className="text-[11px] font-mono font-normal text-slate-500 dark:text-slate-400">
                        {emp.department} &bull; {emp.contractStatus}
                      </div>
                    </td>

                    {/* 3. Gaji Pokok */}
                    <td className="py-3.5 px-3 text-right font-mono text-sm font-normal">
                      <span className={isLight ? 'text-slate-900' : 'text-white'}>
                        Rp {item.baseSalary.toLocaleString('id-ID')}
                      </span>
                    </td>

                    {/* 4. Tunjangan Harian */}
                    <td className="py-3.5 px-3 text-right font-mono font-normal">
                      <div className="text-sm font-normal text-sky-700 dark:text-sky-400">
                        + Rp {item.dailyAllowance.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[11px] font-mono font-normal text-slate-500 dark:text-slate-400">
                        {item.attendedDays} hari @ Rp {item.dailyRate.toLocaleString('id-ID')}
                      </div>
                    </td>

                    {/* 5. Potongan Absensi */}
                    <td className="py-3.5 px-3 text-right font-mono font-normal">
                      {item.absenceDeduction > 0 ? (
                        <div>
                          <div className="text-sm font-normal text-rose-600 dark:text-rose-400">
                            - Rp {item.absenceDeduction.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[11px] font-mono font-normal text-rose-500">
                            {item.lateCount}x terlambat
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 dark:text-slate-500 text-[11px] font-mono font-normal">
                          Rp 0 <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">Nihil</span>
                        </div>
                      )}
                    </td>

                    {/* 6. Estimasi Komisi Penjualan Kasir (1%), Produksi Laundry & Fashion Advisor */}
                    <td className="py-3.5 px-3 text-right font-mono font-normal">
                      {item.isCashier || item.hasLaundryCommission || item.hasFashionCommission ? (
                        <div className="space-y-1">
                          {item.isCashier && (
                            <div>
                              <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-500" />
                                <span>+ Rp {item.cashierCommission.toLocaleString('id-ID')}</span>
                              </div>
                              <div className="text-[11px] font-mono font-normal text-slate-500 dark:text-slate-400">
                                1% &times; Rp {item.commissionSalesTotal.toLocaleString('id-ID')} ({item.commissionTrxCount} trx)
                              </div>
                            </div>
                          )}
                          {item.hasLaundryCommission && (
                            <div>
                              <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 flex items-center justify-end gap-1">
                                <span>+ Rp {item.laundryCommission.toLocaleString('id-ID')}</span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                Laundry: {item.laundryOrdersCount} ord ({item.laundryKgProcessed}kg / {item.laundrySatuanPcs + item.laundrySpecialistUnits} item)
                              </div>
                            </div>
                          )}
                          {item.hasFashionCommission && (
                            <div>
                              <div className="text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-end gap-1">
                                <span>+ Rp {item.fashionAdvisorCommission.toLocaleString('id-ID')}</span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                Advisor {item.fashionCommissionRate}% &times; Rp {item.fashionNetSalesTotal.toLocaleString('id-ID')} ({item.fashionTrxCount} nota)
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-400 dark:text-slate-500 text-[11px] font-mono font-normal">
                          - <span className="text-[11px] block opacity-80">Non-Komisi</span>
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
                              : 'bg-slate-400 dark:bg-slate-600'
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
                          className={`text-[11px] font-mono font-normal tracking-tight px-1.5 py-0.5 rounded border ${
                            item.isBpjsActive
                              ? isLight
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
                              : isLight
                              ? 'text-slate-600 bg-slate-100 border-slate-200'
                              : 'text-slate-400 bg-slate-500/15 border-slate-500/30'
                          }`}
                        >
                          {item.isBpjsActive ? '-4% Deduct' : 'Opt-Out'}
                        </span>
                      </div>
                    </td>

                    {/* 8. Take Home Pay (THP) */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        Rp {item.takeHomePay.toLocaleString('id-ID')}
                      </span>
                      <div className="text-[11px] font-mono font-normal text-slate-500 dark:text-slate-400">
                        Bruto: Rp {item.grossEarnings.toLocaleString('id-ID')}
                      </div>
                    </td>

                    {/* 9. Status & Bayar */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {emp.payrollStatus === 'PAID' ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest border ${
                              isLight
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.16)]'
                                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>PAID</span>
                          </span>
                          {emp.payrollPaidAt && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-normal">
                              {emp.payrollPaidAt}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest border ${
                              isLight
                                ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.16)]'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.18)]'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>PENDING</span>
                          </span>
                          <button
                            type="button"
                            id={`btn-pay-salary-${emp.id}`}
                            onClick={() => handleOpenPayModal(emp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] font-mono shadow-sm transition-all duration-150 cursor-pointer active:scale-[0.99]"
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
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-medium text-xs cursor-pointer transition-all duration-150 active:scale-[0.99] ${
                          isLight
                            ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-300 shadow-xs'
                            : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/35'
                        }`}
                        title="Buka dan cetak rincian slip gaji resmi karyawan"
                      >
                        <FileText className="w-3.5 h-3.5" />
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
      {/* 5. MODAL: RINCIAN SLIP GAJI KARYAWAN STANDAR A5 LANDSCAPE (COBA MART) */}
      {/* ========================================================================= */}
      {selectedSlipEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-white text-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto border border-cyan-500/50">
            {/* Modal Top Bar (Toolbar Kasir / HRD - No Print) */}
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between no-print border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-base text-white flex items-center gap-2">
                    <span>Voucher Slip Gaji Karyawan (A5 Landscape)</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-normal uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      CONFIDENTIAL
                    </span>
                  </div>
                  <div className="text-[11px] font-mono font-normal text-slate-400">
                    {businessProfile?.name || 'JacS RetailOS ERP'} &bull; {businessProfile?.address || 'Jakarta, Indonesia'} &bull; Dokumen Resmi Payroll
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const item = payrollItems.find((p) => p.employee.id === selectedSlipEmployee.id)!;
                    handleCopySlipText(item);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all duration-150 active:scale-[0.99] cursor-pointer"
                  title="Salin rincian slip gaji ke clipboard"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Salin Teks</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const item = payrollItems.find((p) => p.employee.id === selectedSlipEmployee.id)!;
                    handlePrintSlip(item);
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all duration-150 cursor-pointer shadow-sm active:scale-[0.99]"
                  title="Cetak atau unduh slip gaji dalam format PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span>Cetak / Unduh PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSlipEmployee(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150 active:scale-[0.99] cursor-pointer ml-1"
                  title="Tutup Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* KERTAS PUTIH RESMI SLIP GAJI A5 LANDSCAPE (ID: printable-pay-slip) */}
            <div id="printable-pay-slip" className="p-6 sm:p-7 bg-white text-slate-800 font-sans text-sm font-normal">
              {(() => {
                const item = payrollItems.find((p) => p.employee.id === selectedSlipEmployee.id)!;
                return (
                  <div className="space-y-3">
                    {/* Kop Surat Resmi */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xl font-medium tracking-tight text-slate-900">COBA MART</div>
                        <div className="text-[11px] font-mono font-normal text-sky-700 tracking-widest uppercase">MINIMARKET &amp; GROSIR MODERN</div>
                        <div className="text-xs font-normal text-slate-600 mt-0.5">
                          Jl. Veteran Selatan No. 128, Mamajang, Kota Makassar, Sulawesi Selatan 90132
                        </div>
                        <div className="text-xs font-normal text-slate-600">
                          Telp: (0411) 876-5432 &bull; Email: finance@cobamart.co.id
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="inline-block px-2.5 py-0.5 border border-rose-500 text-rose-600 bg-rose-50 text-[11px] font-mono font-normal tracking-widest rounded uppercase">
                          CONFIDENTIAL
                        </div>
                        <div className="font-mono text-xs font-medium text-slate-800 mt-1">
                          SLIP/2026/09/{selectedSlipEmployee.nip.split('-').pop() || selectedSlipEmployee.nip}
                        </div>
                        <div className="text-[11px] font-mono font-normal text-slate-500 mt-0.5">
                          Makassar, 30 September 2026
                        </div>
                      </div>
                    </div>

                    {/* Garis Ganda Kop Surat Klasik */}
                    <div className="border-t-2 border-slate-900 border-b border-slate-400 py-[1px]" />

                    {/* Baris Judul Dokumen */}
                    <div className="flex items-center justify-between bg-slate-100 border border-slate-300 px-3 py-1.5 rounded">
                      <div className="font-medium text-xs text-slate-900 tracking-wider uppercase">
                        SLIP GAJI KARYAWAN (PAYROLL VOUCHER)
                      </div>
                      <div className="font-mono font-normal text-[11px] text-slate-700">
                        PERIODE: SEPTEMBER 2026
                      </div>
                    </div>

                    {/* Data Karyawan (Metadata) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs font-normal">
                      <div>
                        <div className="text-slate-500 font-mono font-normal text-[11px] uppercase tracking-wider">Nama Karyawan</div>
                        <div className="font-medium text-slate-900 mt-0.5">{selectedSlipEmployee.name}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 font-mono font-normal text-[11px] uppercase tracking-wider">NIP / ID Staf</div>
                        <div className="font-mono font-medium text-slate-800 mt-0.5">{selectedSlipEmployee.nip}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 font-mono font-normal text-[11px] uppercase tracking-wider">Jabatan &amp; Divisi</div>
                        <div className="font-normal text-slate-800 mt-0.5">
                          {selectedSlipEmployee.role} &bull; {selectedSlipEmployee.department}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 font-mono font-normal text-[11px] uppercase tracking-wider">Status &amp; Hadir</div>
                        <div className="font-normal text-slate-800 mt-0.5">
                          {selectedSlipEmployee.contractStatus || 'Karyawan Tetap'} &bull; <span className="font-mono font-medium">{item.attendedDays} Hari</span>
                        </div>
                      </div>
                    </div>

                    {/* 2 Kolom Bersanding: Penerimaan vs Potongan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Kolom Kiri: PENERIMAAN */}
                      <div className="border border-slate-300 rounded overflow-hidden">
                        <div className="bg-emerald-50 text-emerald-900 font-medium text-xs px-3 py-1.5 border-b border-slate-300 flex items-center justify-between">
                          <span>A. PENERIMAAN (EARNINGS)</span>
                          <span className="font-mono text-emerald-800">
                            Rp {item.grossEarnings.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <table className="w-full text-xs">
                          <tbody>
                            <tr className="border-b border-dashed border-slate-200">
                              <td className="p-2 text-slate-700">
                                <div className="font-medium text-slate-900">Gaji Pokok</div>
                                <div className="text-[11px] text-slate-500">Gaji dasar bulanan terstandar</div>
                              </td>
                              <td className="p-2 text-right font-mono font-normal text-slate-900 whitespace-nowrap">
                                Rp {item.baseSalary.toLocaleString('id-ID')}
                              </td>
                            </tr>
                            <tr className="border-b border-dashed border-slate-200">
                              <td className="p-2 text-slate-700">
                                <div className="font-medium text-slate-900">Tunjangan Harian</div>
                                <div className="text-[11px] text-slate-500">
                                  {item.attendedDays} hari hadir &times; Rp {item.dailyRate.toLocaleString('id-ID')} (makan &amp; transport)
                                </div>
                              </td>
                              <td className="p-2 text-right font-mono font-normal text-slate-900 whitespace-nowrap">
                                Rp {item.dailyAllowance.toLocaleString('id-ID')}
                              </td>
                            </tr>
                            <tr className="border-b border-dashed border-slate-200">
                              <td className="p-2 text-slate-700">
                                <div className="font-medium text-slate-900">Komisi Penjualan POS (1%)</div>
                                <div className="text-[11px] text-slate-500">
                                  {item.isCashier
                                    ? `1% dari omzet kasir Rp ${item.commissionSalesTotal.toLocaleString('id-ID')} (${item.commissionTrxCount} transaksi)`
                                    : 'Non-Kasir (Bukan Operator Kasir POS)'}
                                </div>
                              </td>
                              <td className="p-2 text-right font-mono font-normal text-slate-900 whitespace-nowrap">
                                {item.isCashier ? `Rp ${item.cashierCommission.toLocaleString('id-ID')}` : 'Rp 0'}
                              </td>
                            </tr>
                            {item.hasLaundryCommission && (
                              <tr className="border-b border-dashed border-slate-200">
                                <td className="p-2 text-slate-700">
                                  <div className="font-medium text-slate-900">Insentif Produksi Laundry</div>
                                  <div className="text-[11px] text-slate-500">
                                    {item.laundryOrdersCount} order ({item.laundryKgProcessed} kg &bull; {item.laundrySatuanPcs} pcs &bull; {item.laundrySpecialistUnits} unit khusus)
                                  </div>
                                </td>
                                <td className="p-2 text-right font-mono font-normal text-cyan-700 whitespace-nowrap">
                                  Rp {item.laundryCommission.toLocaleString('id-ID')}
                                </td>
                              </tr>
                            )}
                            <tr className="bg-slate-50 font-medium border-t border-slate-300">
                              <td className="p-2 text-slate-900">TOTAL PENERIMAAN KOTOR</td>
                              <td className="p-2 text-right font-mono font-medium text-emerald-700 whitespace-nowrap">
                                Rp {item.grossEarnings.toLocaleString('id-ID')}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Kolom Kanan: POTONGAN */}
                      <div className="border border-slate-300 rounded overflow-hidden">
                        <div className="bg-rose-50 text-rose-900 font-medium text-xs px-3 py-1.5 border-b border-slate-300 flex items-center justify-between">
                          <span>B. POTONGAN (DEDUCTIONS)</span>
                          <span className="font-mono text-rose-800">
                            - Rp {item.totalEmployeeDeduction.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <table className="w-full text-xs">
                          <tbody>
                            <tr className="border-b border-dashed border-slate-200">
                              <td className="p-2 text-slate-700">
                                <div className="font-medium text-slate-900">Denda Keterlambatan</div>
                                <div className="text-[11px] text-slate-500">
                                  {item.lateCount > 0
                                    ? `${item.lateCount}x terlambat presensi @ Rp ${item.latePenaltyRate.toLocaleString('id-ID')}`
                                    : 'Disiplin hadir tepat waktu (Tanpa Denda)'}
                                </div>
                              </td>
                              <td className="p-2 text-right font-mono font-normal text-slate-900 whitespace-nowrap">
                                {item.absenceDeduction > 0
                                  ? `- Rp ${item.absenceDeduction.toLocaleString('id-ID')}`
                                  : 'Rp 0'}
                              </td>
                            </tr>
                            <tr className="border-b border-dashed border-slate-200">
                              <td className="p-2 text-slate-700">
                                <div className="font-medium text-slate-900">BPJS Kesehatan (1%)</div>
                                <div className="text-[11px] text-slate-500">Iuran wajib pekerja 1% dari Gaji Pokok</div>
                              </td>
                              <td className="p-2 text-right font-mono font-normal text-slate-900 whitespace-nowrap">
                                {item.isBpjsActive
                                  ? `- Rp ${item.kesEmployee.toLocaleString('id-ID')}`
                                  : 'Rp 0'}
                              </td>
                            </tr>
                            <tr className="border-b border-dashed border-slate-200">
                              <td className="p-2 text-slate-700">
                                <div className="font-medium text-slate-900">BPJS Ketenagakerjaan (3%)</div>
                                <div className="text-[11px] text-slate-500">Jaminan Hari Tua (2%) + Jaminan Pensiun (1%)</div>
                              </td>
                              <td className="p-2 text-right font-mono font-normal text-slate-900 whitespace-nowrap">
                                {item.isBpjsActive
                                  ? `- Rp ${item.tkEmployee.toLocaleString('id-ID')}`
                                  : 'Rp 0'}
                              </td>
                            </tr>
                            <tr className="bg-slate-50 font-medium border-t border-slate-300">
                              <td className="p-2 text-slate-900">TOTAL POTONGAN</td>
                              <td className="p-2 text-right font-mono font-medium text-rose-700 whitespace-nowrap">
                                - Rp {item.totalEmployeeDeduction.toLocaleString('id-ID')}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Ringkasan: Take Home Pay & Terbilang */}
                    <div className="bg-slate-50 border border-slate-900 rounded p-2.5 sm:p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="font-medium text-xs font-mono uppercase tracking-widest text-slate-900">
                          TOTAL PENERIMAAN BERSIH (TAKE HOME PAY)
                        </div>
                        <div className="text-lg font-mono font-medium text-slate-900">
                          Rp {item.takeHomePay.toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="text-xs text-slate-700 italic mt-1 pt-1.5 border-t border-slate-300">
                        Terbilang: <span className="font-medium"># {formatTerbilang(item.takeHomePay)} #</span>
                      </div>
                    </div>

                    {/* Kolom Tanda Tangan: 2 Kolom Bersanding */}
                    <div className="grid grid-cols-2 gap-8 pt-2 text-center text-xs">
                      <div>
                        <div className="font-normal text-slate-700">Diterima Oleh (Karyawan),</div>
                        <div className="h-12 flex items-end justify-center pb-1">
                          {/* Signature line space */}
                        </div>
                        <div className="font-medium underline text-slate-900">( {selectedSlipEmployee.name} )</div>
                        <div className="text-[11px] font-mono text-slate-500">NIP. {selectedSlipEmployee.nip}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-mono text-slate-500">Makassar, 30 September 2026</div>
                        <div className="font-normal text-slate-700">Disetujui Oleh (Finance / HRD),</div>
                        <div className="h-12 flex items-end justify-center pb-1">
                          {/* Signature line space */}
                        </div>
                        <div className="font-medium underline text-slate-900">( Siti Rahma, S.E. )</div>
                        <div className="text-[11px] font-mono text-slate-500">Manager Finance &amp; HRD</div>
                      </div>
                    </div>

                    {/* Catatan Kaki */}
                    <div className="text-[11px] text-slate-400 text-center italic pt-1">
                      * Slip gaji ini merupakan dokumen rahasia dan bukti pembayaran resmi dari COBA MART Makassar. Dicetak secara otomatis oleh JacS RetailOS.
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Bottom Actions (No Print) */}
            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="text-xs font-normal text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Format Standar Voucher Payroll A5 Landscape &bull; Terverifikasi Sistem HRD</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const item = payrollItems.find((p) => p.employee.id === selectedSlipEmployee.id)!;
                    handlePrintSlip(item);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm flex items-center gap-2 transition-all duration-150 cursor-pointer shadow-sm active:scale-[0.99]"
                  title="Cetak atau unduh slip gaji dalam format PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span>Cetak / Unduh PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSlipEmployee(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium text-sm transition-all duration-150 active:scale-[0.99] cursor-pointer"
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
                ? 'bg-white border-cyan-500/70 text-slate-900 shadow-[0_0_24px_rgba(6,182,212,0.2)]'
                : 'bg-[#161b22] border-cyan-500/40 text-white shadow-[0_0_24px_rgba(6,182,212,0.16)]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/40">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-base">Konfirmasi Pembayaran Gaji</h4>
                  <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    Pencairan payroll &amp; penerbitan jurnal akuntansi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-150 active:scale-[0.99] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm font-normal">
              <div
                className={`p-3.5 rounded-xl border space-y-2 ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-slate-900/60 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Target Penerima:</span>
                  <span className="font-medium text-right">
                    {targetPayEmployee === 'ALL'
                      ? `Seluruh Karyawan (${employees.length} Orang)`
                      : `${targetPayEmployee?.name} (${targetPayEmployee?.nip})`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Periode Gaji:</span>
                  <span className="font-mono font-normal text-cyan-600 dark:text-cyan-400">
                    September 2026
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="font-medium">Total Pembayaran (THP):</span>
                  <span className="text-lg font-mono font-medium text-emerald-600 dark:text-emerald-400">
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
                <label className="text-[11px] font-mono font-normal uppercase tracking-widest text-slate-600 dark:text-slate-300 block mb-1.5">
                  Pilih Sumber Rekening / Kas Pengeluaran:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentSource('Bank Operasional')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 active:scale-[0.99] ${
                      selectedPaymentSource === 'Bank Operasional'
                        ? isLight
                          ? 'bg-cyan-50 border-cyan-500 text-cyan-700 shadow-[0_0_12px_rgba(6,182,212,0.18)]'
                          : 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-[#0d1117] border-[#30363d] text-slate-300'
                    }`}
                  >
                    <div className="text-sm font-medium">Bank Operasional</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Akun 1-10002</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentSource('Kas Utama')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 active:scale-[0.99] ${
                      selectedPaymentSource === 'Kas Utama'
                        ? isLight
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-[0_0_12px_rgba(16,185,129,0.18)]'
                          : 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-[#0d1117] border-[#30363d] text-slate-300'
                    }`}
                  >
                    <div className="text-sm font-medium">Kas Utama / Brankas</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Akun 1-10000</div>
                  </button>
                </div>
              </div>

              {/* Catatan Pembayaran */}
              <div>
                <label className="text-[11px] font-mono font-normal uppercase tracking-widest text-slate-600 dark:text-slate-300 block mb-1">
                  Catatan Memo Pembukuan:
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Catatan memo pembayaran..."
                  className={`w-full px-3 py-2 text-sm font-normal rounded-xl border outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                      : 'bg-[#0d1117] border-[#30363d] text-white focus:border-cyan-500'
                  }`}
                />
              </div>

              <div
                className={`p-3 rounded-xl border text-xs font-normal flex items-start gap-2 ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Sistem otomatis mendebit <span className="font-medium">Beban Gaji Karyawan (5-10201)</span> dan mengkredit akun{' '}
                  <span className="font-medium">{selectedPaymentSource}</span> di modul Keuangan &amp; Akuntansi.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.99] cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-payroll-payment"
                onClick={handleConfirmPayment}
                disabled={isProcessingPayment}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex items-center gap-1.5 shadow-[0_0_14px_rgba(16,185,129,0.28)] transition-all duration-150 cursor-pointer active:scale-[0.99] disabled:opacity-50"
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
