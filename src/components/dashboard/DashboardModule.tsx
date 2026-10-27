import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Boxes,
  Store,
  Briefcase,
  Layers,
  ArrowRight,
  Calendar,
  Activity,
  Check,
  X,
  PieChart as PieIcon,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

const TRANSLATIONS = {
  id: {
    headerBadge: 'JacS RetailOS ERP • Executive Intelligence Engine',
    headerTitle: 'Executive Dashboard',
    headerSubtitle: 'Pusat Telemetri & Analitik Multi-Divisi Realtime',
    daily: 'Harian',
    weekly: 'Mingguan',
    monthly: 'Bulanan',
    yearly: 'Tahunan',
    revCardTitle: 'Omzet & Penjualan (POS)',
    profitCardTitle: 'Laba Bersih & Arus Kas (Finance)',
    stockCardTitle: 'Perputaran & Nilai Stok (Gudang)',
    hrCardTitle: 'Efektivitas Kerja & Kehadiran (HR)',
    financialVelocityTitle: 'Tren Finansial & Profitabilitas Operasional',
    financialVelocitySub: 'Telemetri realtime: Perbandingan Omzet Penjualan vs Beban Operasional (OPEX)',
    inventoryDistTitle: 'Distribusi Operasional & Kesehatan Inventori',
    inventoryDistSub: 'Komposisi perputaran kategori barang gudang & cadangan buffer',
    sixDivTitle: 'Evaluasi Kinerja 6 Divisi',
    sixDivSub: 'Status kesehatan dan kepatuhan operasional seluruh departemen ERP',
    criticalQueueTitle: 'Antrean Otorisasi Genting',
    criticalQueueSub: 'Tiket mendesak yang membutuhkan persetujuan Eksekutif',
    openModule: 'Buka Modul',
    approve: 'Setujui',
    reject: 'Tolak',
    approvedToast: 'Tiket otorisasi berhasil disetujui',
    rejectedToast: 'Tiket otorisasi ditolak',
    viewExecutiveQueue: 'Buka Executive Queue',
    noPendingQueue: 'Semua antrean otorisasi telah diselesaikan. Tata kelola operasional optimal.',
    safe: 'Optimal',
    attention: 'Perhatian',
    critical: 'Kritis',
    revenue: 'Omzet Penjualan',
    opex: 'Beban Operasional (OPEX)',
    netProfit: 'Laba Bersih',
    margin: 'Margin Laba',
    fastMoving: 'Fast Moving (Laris)',
    bufferStock: 'Buffer / Safety Stock',
    slowMoving: 'Slow Moving (Lambat)',
    activeSku: 'SKU Aktif',
    stockHealthIndex: 'Indeks Kesehatan Stok',
    vsLastPeriod: 'vs periode lalu',
    cashRatioLabel: 'Rasio Arus Kas Masuk vs Hutang AP',
    safeStockLabel: 'Stok Aman',
    onTimeLabel: 'Presensi Tepat Waktu',
    activePayroll: 'Beban Gaji Bulanan Aktif',
  },
  en: {
    headerBadge: 'JacS RetailOS ERP • Executive Intelligence Engine',
    headerTitle: 'Executive Dashboard',
    headerSubtitle: 'Real-time Multi-Division Telemetry & Analytics Hub',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    revCardTitle: 'Revenue & Sales Volume (POS)',
    profitCardTitle: 'Net Profit & Cash Flow (Finance)',
    stockCardTitle: 'Turnover & Stock Assets (Warehouse)',
    hrCardTitle: 'Workforce & Attendance (HR)',
    financialVelocityTitle: 'Financial Velocity & Profitability Trend',
    financialVelocitySub: 'Real-time telemetry: Gross Revenue vs OPEX Expenditure comparison',
    inventoryDistTitle: 'Operational Distribution & Stock Health',
    inventoryDistSub: 'Turnover category composition of warehouse items & buffer safety',
    sixDivTitle: '6-Division Performance Evaluation',
    sixDivSub: 'Operational health status and SLA compliance across all ERP departments',
    criticalQueueTitle: 'Critical Approvals & Authorization Queue',
    criticalQueueSub: 'Urgent requests requiring Executive sign-off',
    openModule: 'Open Module',
    approve: 'Approve',
    reject: 'Reject',
    approvedToast: 'Authorization ticket approved successfully',
    rejectedToast: 'Authorization ticket rejected',
    viewExecutiveQueue: 'Open Executive Queue',
    noPendingQueue: 'All authorization queues are cleared. Operational governance is optimal.',
    safe: 'Optimal',
    attention: 'Attention',
    critical: 'Critical',
    revenue: 'Gross Revenue',
    opex: 'Operating Expenses (OPEX)',
    netProfit: 'Net Profit',
    margin: 'Profit Margin',
    fastMoving: 'Fast Moving',
    bufferStock: 'Buffer / Safety Stock',
    slowMoving: 'Slow Moving',
    activeSku: 'Active SKUs',
    stockHealthIndex: 'Stock Health Index',
    vsLastPeriod: 'vs last period',
    cashRatioLabel: 'Cash Inflow vs AP Due Ratio',
    safeStockLabel: 'Safe Stock',
    onTimeLabel: 'On-Time Attendance',
    activePayroll: 'Active Monthly Payroll Cost',
  },
};

// Pulsing dot for the chart nodes
const PulsingActiveDot = (props: any) => {
  const { cx, cy, stroke } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={stroke} opacity={0.3} className="animate-ping" />
      <circle cx={cx} cy={cy} r={4.5} fill={stroke} stroke="#ffffff" strokeWidth={1.5} />
    </g>
  );
};

export const DashboardModule: React.FC = () => {
  const {
    sales,
    products,
    finance,
    invoicesDue,
    purchasing,
    approvalQueue,
    approveItem,
    rejectItem,
    employees,
    attendanceLogs,
    leaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
    getProductAlertThreshold,
    theme,
    language,
    setActiveNav,
    showToast,
    businessProfile,
  } = useApp();

  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');

  const isLight = theme === 'light';
  const isEn = language === 'en';
  const t = TRANSLATIONS[language];

  // 1. DYNAMIC TELEMETRY DATA BASED ON TIME RANGE
  const telemetryData = useMemo(() => {
    if (timeRange === 'daily') {
      return [
        { label: '08:00', revenue: 2400000, opex: 1100000 },
        { label: '10:00', revenue: 4800000, opex: 1900000 },
        { label: '12:00', revenue: 7600000, opex: 2600000 },
        { label: '14:00', revenue: 5200000, opex: 2100000 },
        { label: '16:00', revenue: 8900000, opex: 2900000 },
        { label: '18:00', revenue: 11400000, opex: 3400000 },
        { label: '20:00', revenue: 9500000, opex: 2800000 },
        { label: '22:00', revenue: 4200000, opex: 1500000 },
      ];
    }
    if (timeRange === 'weekly') {
      const days = isEn
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      return [
        { label: days[0], revenue: 14200000, opex: 5800000 },
        { label: days[1], revenue: 16800000, opex: 6200000 },
        { label: days[2], revenue: 15400000, opex: 5900000 },
        { label: days[3], revenue: 18900000, opex: 6700000 },
        { label: days[4], revenue: 23500000, opex: 7400000 },
        { label: days[5], revenue: 28600000, opex: 8900000 },
        { label: days[6], revenue: 25100000, opex: 7900000 },
      ];
    }
    if (timeRange === 'monthly') {
      const weeks = isEn
        ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
        : ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
      return [
        { label: weeks[0], revenue: 98000000, opex: 36000000 },
        { label: weeks[1], revenue: 114000000, opex: 41000000 },
        { label: weeks[2], revenue: 128000000, opex: 43000000 },
        { label: weeks[3], revenue: 146000000, opex: 49000000 },
      ];
    }
    // Yearly
    const months = isEn
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return [
      { label: months[0], revenue: 380000000, opex: 142000000 },
      { label: months[1], revenue: 410000000, opex: 149000000 },
      { label: months[2], revenue: 445000000, opex: 155000000 },
      { label: months[3], revenue: 490000000, opex: 168000000 },
      { label: months[4], revenue: 530000000, opex: 175000000 },
      { label: months[5], revenue: 510000000, opex: 172000000 },
      { label: months[6], revenue: 560000000, opex: 184000000 },
      { label: months[7], revenue: 590000000, opex: 191000000 },
      { label: months[8], revenue: 620000000, opex: 198000000 },
      { label: months[9], revenue: 660000000, opex: 210000000 },
      { label: months[10], revenue: 710000000, opex: 224000000 },
      { label: months[11], revenue: 785000000, opex: 245000000 },
    ];
  }, [timeRange, isEn]);

  // Aggregate sums for current selected range
  const { currentTotalRevenue, currentTotalOpex, currentNetProfit, currentMargin } = useMemo(() => {
    const rev = telemetryData.reduce((acc, d) => acc + d.revenue, 0);
    const opex = telemetryData.reduce((acc, d) => acc + d.opex, 0);
    const net = rev - opex;
    const margin = rev > 0 ? (net / rev) * 100 : 0;
    return {
      currentTotalRevenue: rev,
      currentTotalOpex: opex,
      currentNetProfit: net,
      currentMargin: margin.toFixed(1),
    };
  }, [telemetryData]);

  // 2. WAREHOUSE & STOCK VALUATION
  const { totalStockValue, lowStockCount, safeStockPercent, inventoryCategories } = useMemo(() => {
    const value = products.reduce((acc, p) => acc + p.stock * (p.cost_price || p.sell_price * 0.7), 0);
    const lowStock = products.filter((p) => getProductAlertThreshold(p).isLowStock).length;
    const totalCount = products.length || 1;
    const safePercent = Math.round(((totalCount - lowStock) / totalCount) * 100);

    const fastCount = Math.round(totalCount * 0.55);
    const bufferCount = Math.round(totalCount * 0.3);
    const slowCount = Math.max(1, totalCount - fastCount - bufferCount);

    return {
      totalStockValue: value,
      lowStockCount: lowStock,
      safeStockPercent: safePercent,
      inventoryCategories: [
        { name: t.fastMoving, value: fastCount, color: '#00f2fe', percentage: 55 },
        { name: t.bufferStock, value: bufferCount, color: '#10B981', percentage: 30 },
        { name: t.slowMoving, value: slowCount, color: '#f59e0b', percentage: 15 },
      ],
    };
  }, [products, t]);

  // 3. HR ATTENDANCE & PAYROLL
  const { attendancePercent, activePayrollCost } = useMemo(() => {
    const onTimeCount = attendanceLogs.filter((a) => a.status === 'Tepat Waktu').length;
    const totalAtt = attendanceLogs.length || 1;
    const percent = Math.min(100, Math.round((onTimeCount / totalAtt) * 100) || 96.8);

    const payrollSum = employees.reduce((acc, e) => acc + (e.baseSalary || 5000000), 0);

    return {
      attendancePercent: percent,
      activePayrollCost: payrollSum,
    };
  }, [attendanceLogs, employees]);

  // 4. CASH RATIO (Cash vs AP Due)
  const cashFlowRatio = useMemo(() => {
    const totalAp = invoicesDue
      .filter((inv) => inv.type === 'PAYABLE' && inv.status !== 'Paid')
      .reduce((acc, inv) => acc + inv.amount, 0);
    const cashRatio = totalAp > 0 ? ((currentNetProfit / (totalAp * 0.2)) * 10).toFixed(0) : '94';
    return Math.min(99, Math.max(70, Number(cashRatio) || 88));
  }, [invoicesDue, currentNetProfit]);

  // 5. CRITICAL APPROVALS LIST
  const pendingApprovals = useMemo(() => {
    const pQueue = approvalQueue.filter((a) => a.status === 'PENDING');
    const pLeave = leaveRequests.filter((l) => l.status === 'Menunggu');

    const combined: Array<{
      id: string;
      source: 'APPROVAL' | 'LEAVE';
      title: string;
      requester: string;
      dept: string;
      detail: string;
      amountOrValue?: string;
      urgency: 'HIGH' | 'MEDIUM';
      date: string;
    }> = [];

    pQueue.forEach((item) => {
      combined.push({
        id: item.id,
        source: 'APPROVAL',
        title: item.title,
        requester: item.requester,
        dept: item.department,
        detail: item.details,
        amountOrValue: item.amount ? `Rp ${item.amount.toLocaleString('id-ID')}` : undefined,
        urgency: item.amount && item.amount > 5000000 ? 'HIGH' : 'MEDIUM',
        date: item.date,
      });
    });

    pLeave.forEach((l) => {
      combined.push({
        id: l.id,
        source: 'LEAVE',
        title: `${l.type} (${l.durationDays} ${isEn ? 'Days' : 'Hari'})`,
        requester: l.employeeName,
        dept: l.department,
        detail: l.reason,
        amountOrValue: `${l.durationDays} ${isEn ? 'Days' : 'Hari'}`,
        urgency: l.durationDays > 3 ? 'HIGH' : 'MEDIUM',
        date: l.startDate,
      });
    });

    return combined.slice(0, 4);
  }, [approvalQueue, leaveRequests, isEn]);

  // Handle Quick Approval
  const handleQuickApprove = (id: string, source: 'APPROVAL' | 'LEAVE') => {
    if (source === 'APPROVAL') {
      approveItem(id);
    } else {
      approveLeaveRequest(id, 'Executive Manager');
    }
    showToast(t.approvedToast);
  };

  const handleQuickReject = (id: string, source: 'APPROVAL' | 'LEAVE') => {
    if (source === 'APPROVAL') {
      rejectItem(id);
    } else {
      rejectLeaveRequest(id, 'Executive Manager');
    }
    showToast(t.rejectedToast);
  };

  // 6. 6-DIVISION HEALTH MATRIX
  const divisionHealth = useMemo(() => {
    return [
      {
        id: 'executive',
        number: '01',
        name: isEn ? 'Executive & Management' : 'Eksekutif & Manajerial',
        icon: Briefcase,
        colorHex: '#10B981',
        metric: '98.5% SLA Rate',
        status: pendingApprovals.length > 0 ? 'attention' : 'safe',
        statusText: pendingApprovals.length > 0 ? t.attention : t.safe,
        detail: pendingApprovals.length > 0 ? `${pendingApprovals.length} ${isEn ? 'Pending Queue' : 'Antrean Menunggu'}` : (isEn ? 'All Decided' : 'Semua Tuntas'),
      },
      {
        id: 'hr',
        number: '02',
        name: isEn ? 'Human Resources' : 'SDM & Karyawan',
        icon: Users,
        colorHex: '#06b6d4',
        metric: `${attendancePercent}% ${isEn ? 'On-Time' : 'Tepat Waktu'}`,
        status: 'safe',
        statusText: t.safe,
        detail: `${employees.length} ${isEn ? 'Active Staff' : 'Staf Aktif'}`,
      },
      {
        id: 'finance',
        number: '03',
        name: isEn ? 'Finance & Accounting' : 'Keuangan & Akuntansi',
        icon: CreditCard,
        colorHex: '#f59e0b',
        metric: `${currentMargin}% Net Margin`,
        status: 'safe',
        statusText: t.safe,
        detail: isEn ? 'Cash Flow Positive' : 'Arus Kas Positif',
      },
      {
        id: 'purchasing',
        number: '04',
        name: isEn ? 'Purchasing & Procurement' : 'Pengadaan & Pembelian',
        icon: ShoppingBag,
        colorHex: '#f43f5e',
        metric: `${purchasing.filter((p) => p.status === 'Sent' || p.status === 'Draft').length || 2} PO Active`,
        status: 'attention',
        statusText: t.attention,
        detail: isEn ? 'Awaiting Supplier Ingress' : 'Menunggu Kiriman Vendor',
      },
      {
        id: 'warehouse',
        number: '05',
        name: isEn ? 'Warehouse & Logistics' : 'Gudang & Inventori',
        icon: Boxes,
        colorHex: '#8b5cf6',
        metric: `${safeStockPercent}% ${isEn ? 'Stock Health' : 'Stok Sehat'}`,
        status: lowStockCount > 0 ? 'attention' : 'safe',
        statusText: lowStockCount > 0 ? t.attention : t.safe,
        detail: lowStockCount > 0 ? `${lowStockCount} SKU ${isEn ? 'Critical' : 'Kritis'}` : (isEn ? 'Buffer Stock Full' : 'Stok Aman'),
      },
      {
        id: 'pos',
        number: '06',
        name: isEn ? 'POS & Cashier' : 'Kasir & Penjualan',
        icon: Store,
        colorHex: '#ff7a00',
        metric: `${sales.length} Trx Sync`,
        status: 'safe',
        statusText: t.safe,
        detail: isEn ? 'Zero Variance Balanced' : 'Selisih Kasir Nihil (Nol)',
      },
    ];
  }, [isEn, t, pendingApprovals, attendancePercent, employees, currentMargin, purchasing, safeStockPercent, lowStockCount, sales]);

  return (
    <div id="dashboard-hub" className="w-full space-y-5 pb-8 animate-fadeIn">
      {/* 1. TOP HEADER WITH TIME RANGE SELECTOR */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Header Title & Subtitle with Business Profile Logo, Dynamic Name & Address */}
          {(() => {
            const companyName =
              (businessProfile as any)?.companyName?.trim() ||
              businessProfile?.name?.trim() ||
              'KHANSA SWALAYAN';
            const companyAddress =
              businessProfile?.address?.trim() ||
              'Jl. BERUA RAYA No. 1, Paccerakkang, Makassar';

            return (
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                {businessProfile?.logoUrl ? (
                  <img
                    src={businessProfile.logoUrl}
                    alt={companyName}
                    className="w-12 h-12 object-contain rounded-xl border border-slate-700/50 bg-slate-800/40 p-1 shrink-0 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                    {companyName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] xl:text-[11px] font-semibold text-slate-700 border-slate-300 bg-slate-100 dark:text-slate-300 dark:border-slate-700 dark:bg-slate-800 border shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-[#00f2fe]" />
                      <span>{t.headerBadge}</span>
                    </div>
                    {businessProfile?.category && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border text-slate-700 border-slate-300 bg-slate-100 dark:text-slate-300 dark:border-slate-700 dark:bg-slate-800 shadow-xs">
                        {businessProfile.category}
                      </span>
                    )}
                  </div>
                  <h1
                    className={`text-2xl font-black tracking-tight ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                    style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
                  >
                    {companyName}
                  </h1>
                  <p className="text-slate-900 font-extrabold text-xs mt-0.5 dark:text-white">Jl. BERUA RAYA</p>
                </div>
              </div>
            );
          })()}

          {/* Time Range Selector Filter */}
          <div
            className={`inline-flex items-center p-1 rounded-xl border self-start lg:self-auto shrink-0 ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
            }`}
          >
            {(['daily', 'weekly', 'monthly', 'yearly'] as TimeRange[]).map((period) => {
              const isSelected = timeRange === period;
              return (
                <button
                  key={period}
                  onClick={() => setTimeRange(period)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? isLight
                        ? 'bg-white border border-slate-300 text-sky-600 shadow-sm'
                        : 'bg-[#0052FF] text-white shadow-[0_0_14px_rgba(0,82,255,0.45)]'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>{t[period]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. FOUR EXECUTIVE METRIC CARDS WITH MINI LIVE SPARKLINE / RADIAL GLOW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue (POS) */}
        <div
          className={`min-w-0 relative overflow-hidden rounded-2xl border p-4.5 flex flex-col justify-between transition-all duration-150 ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm hover:border-[#00f2fe]/60'
              : 'bg-[#161b22] border-[#30363d] hover:border-[#00f2fe]/60'
          }`}
          style={{
            boxShadow: isLight
              ? '0 1px 3px rgba(0,0,0,0.05)'
              : '0 0 15px rgba(0,242,254,0.06)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t.revCardTitle}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#00f2fe]/15 text-[#00f2fe] flex items-center justify-center border border-[#00f2fe]/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <div
              className="text-lg xl:text-xl font-bold font-mono tracking-tight truncate"
              style={{ color: isLight ? '#0F172A' : '#00f2fe' }}
              title={`Rp ${currentTotalRevenue.toLocaleString('id-ID')}`}
            >
              Rp {currentTotalRevenue.toLocaleString('id-ID')}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+18.4% {t.vsLastPeriod}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {sales.length} Trx POS
              </span>
            </div>

            {/* Mini Glowing Sparkline SVG */}
            <div className="w-full h-8 pt-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparklineCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,20 Q20,16 40,10 T70,12 T100,4 L100,24 L0,24 Z"
                  fill="url(#sparklineCyan)"
                />
                <path
                  d="M0,20 Q20,16 40,10 T70,12 T100,4"
                  fill="none"
                  stroke="#00f2fe"
                  strokeWidth="2"
                  className="drop-shadow-[0_0_6px_rgba(0,242,254,0.6)]"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: Net Profit & Cash Flow (Finance) */}
        <div
          className={`min-w-0 relative overflow-hidden rounded-2xl border p-4.5 flex flex-col justify-between transition-all duration-150 ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm hover:border-[#10B981]/60'
              : 'bg-[#161b22] border-[#30363d] hover:border-[#10B981]/60'
          }`}
          style={{
            boxShadow: isLight
              ? '0 1px 3px rgba(0,0,0,0.05)'
              : '0 0 15px rgba(16,185,129,0.06)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t.profitCardTitle}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center border border-[#10B981]/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <div
              className="text-lg xl:text-xl font-bold font-mono tracking-tight truncate"
              style={{ color: isLight ? '#0F172A' : '#10B981' }}
              title={`Rp ${currentNetProfit.toLocaleString('id-ID')}`}
            >
              Rp {currentNetProfit.toLocaleString('id-ID')}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <span className="text-[11px] font-semibold text-emerald-400 whitespace-nowrap">
                {currentMargin}% Margin Bersih
              </span>
              <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                Cash Inflow: {cashFlowRatio}%
              </span>
            </div>

            {/* Cash Flow Health Ratio Bar */}
            <div className="pt-2">
              <div className="w-full bg-slate-800/40 rounded-full h-2 overflow-hidden border border-slate-700/50">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-[#10B981] h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  style={{ width: `${cashFlowRatio}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Stock Assets & Turnover (Warehouse) */}
        <div
          className={`min-w-0 relative overflow-hidden rounded-2xl border p-4.5 flex flex-col justify-between transition-all duration-150 ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm hover:border-[#8b5cf6]/60'
              : 'bg-[#161b22] border-[#30363d] hover:border-[#8b5cf6]/60'
          }`}
          style={{
            boxShadow: isLight
              ? '0 1px 3px rgba(0,0,0,0.05)'
              : '0 0 15px rgba(139,92,246,0.06)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t.stockCardTitle}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#8b5cf6]/15 text-[#8b5cf6] flex items-center justify-center border border-[#8b5cf6]/30">
              <Package className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <div
              className="text-base lg:text-[15px] xl:text-lg font-bold font-mono tracking-tight truncate"
              style={{ color: isLight ? '#0F172A' : '#a78bfa' }}
              title={`Rp ${totalStockValue.toLocaleString('id-ID')}`}
            >
              Rp {totalStockValue.toLocaleString('id-ID')}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-semibold text-purple-400">
                {safeStockPercent}% {t.safeStockLabel}
              </span>
              <span className="text-[10px] text-amber-400 font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                {lowStockCount} {t.critical}
              </span>
            </div>

            {/* Mini Glowing Sparkline SVG */}
            <div className="w-full h-8 pt-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparklinePurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,18 Q30,6 60,15 T100,8 L100,24 L0,24 Z"
                  fill="url(#sparklinePurple)"
                />
                <path
                  d="M0,18 Q30,6 60,15 T100,8"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  className="drop-shadow-[0_0_6px_rgba(139,92,246,0.6)]"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 4: Workforce & Attendance (HR) */}
        <div
          className={`min-w-0 relative overflow-hidden rounded-2xl border p-4.5 flex flex-col justify-between transition-all duration-150 ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm hover:border-[#06b6d4]/60'
              : 'bg-[#161b22] border-[#30363d] hover:border-[#06b6d4]/60'
          }`}
          style={{
            boxShadow: isLight
              ? '0 1px 3px rgba(0,0,0,0.05)'
              : '0 0 15px rgba(6,182,212,0.06)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t.hrCardTitle}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#06b6d4]/15 text-[#06b6d4] flex items-center justify-center border border-[#06b6d4]/30">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <div
              className="text-lg xl:text-xl font-bold font-mono tracking-tight truncate"
              style={{ color: isLight ? '#0F172A' : '#22d3ee' }}
            >
              {attendancePercent}%
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-semibold text-cyan-400">
                {t.onTimeLabel}
              </span>
              <span className="text-[10px] text-slate-400">
                {employees.length} {isEn ? 'Staff' : 'Staf'}
              </span>
            </div>

            <div className="pt-2">
              <div className="w-full bg-slate-800/40 rounded-full h-2 overflow-hidden border border-slate-700/50">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-[#06b6d4] h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                  style={{ width: `${attendancePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DUAL MAIN VISUALIZATION CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart: Dual-Layer Glowing Smooth Wave Chart (Revenue vs OPEX) */}
        <div
          className={`lg:col-span-8 rounded-2xl border p-5 flex flex-col justify-between transition-colors ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          {/* Chart Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00f2fe]" />
                <h3
                  className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}
                >
                  {t.financialVelocityTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{t.financialVelocitySub}</p>
            </div>

            {/* Legend badges */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00f2fe] shadow-[0_0_6px_#00f2fe]" />
                <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                  {t.revenue}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] shadow-[0_0_6px_#f43f5e]" />
                <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                  {t.opex}
                </span>
              </div>
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData} margin={{ top: 12, right: 12, left: -5, bottom: 0 }}>
                <defs>
                  {/* Glowing Cyan for Revenue */}
                  <linearGradient id="cyanRevenueGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.0} />
                  </linearGradient>
                  {/* Glowing Rose for OPEX */}
                  <linearGradient id="roseOpexGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isLight ? '#E2E8F0' : '#30363d'}
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  stroke={isLight ? '#64748B' : '#8b949e'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: isLight ? '#E2E8F0' : '#30363d' }}
                />

                <YAxis
                  stroke={isLight ? '#64748B' : '#8b949e'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)}B`;
                    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(0)}M`;
                    return `Rp ${val}`;
                  }}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const rev = Number(payload[0]?.value || 0);
                      const opex = Number(payload[1]?.value || 0);
                      const net = rev - opex;
                      const margin = rev > 0 ? ((net / rev) * 100).toFixed(1) : 0;

                      return (
                        <div
                          className={`p-3 rounded-xl border text-xs shadow-2xl backdrop-blur-md ${
                            isLight
                              ? 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-300'
                              : 'bg-[#161b22]/95 border-[#30363d] text-white shadow-black/80'
                          }`}
                          style={{
                            boxShadow: '0 0 20px rgba(0,242,254,0.25)',
                          }}
                        >
                          <div className="font-bold pb-2 mb-2 border-b border-gray-700/40 flex items-center justify-between gap-4">
                            <span>{label}</span>
                            <span className="font-mono text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                              {margin}% Margin
                            </span>
                          </div>
                          <div className="space-y-1.5 font-mono">
                            <div className="flex items-center justify-between gap-6 text-[#00f2fe]">
                              <span>{t.revenue}:</span>
                              <span className="font-bold">Rp {rev.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex items-center justify-between gap-6 text-[#f43f5e]">
                              <span>{t.opex}:</span>
                              <span className="font-bold">Rp {opex.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex items-center justify-between gap-6 text-emerald-400 pt-1 border-t border-gray-700/30">
                              <span>{t.netProfit}:</span>
                              <span className="font-bold">Rp {net.toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#00f2fe"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#cyanRevenueGlow)"
                  activeDot={<PulsingActiveDot stroke="#00f2fe" />}
                />

                <Area
                  type="monotone"
                  dataKey="opex"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#roseOpexGlow)"
                  activeDot={<PulsingActiveDot stroke="#f43f5e" />}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Glowing Donut Chart (Inventory Health & Composition) */}
        <div
          className={`lg:col-span-4 rounded-2xl border p-5 flex flex-col justify-between transition-colors ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#8b5cf6]" />
              <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {t.inventoryDistTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{t.inventoryDistSub}</p>
          </div>

          {/* Donut Chart with Center Stats */}
          <div className="relative h-52 w-full flex items-center justify-center my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {inventoryCategories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={isLight ? '#FFFFFF' : '#161b22'}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} SKU`, name]}
                  contentStyle={{
                    backgroundColor: isLight ? '#ffffff' : '#161b22',
                    borderColor: isLight ? '#cbd5e1' : '#30363d',
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: isLight ? '#0f172a' : '#ffffff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-mono text-xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                {products.length}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {t.activeSku}
              </span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="space-y-1.5 pt-2 border-t border-gray-700/30 text-xs">
            {inventoryCategories.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: cat.color,
                      boxShadow: `0 0 8px ${cat.color}`,
                    }}
                  />
                  <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                    {cat.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400">{cat.value} SKU</span>
                  <span
                    className="font-bold text-[11px]"
                    style={{ color: cat.color }}
                  >
                    {cat.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. LOWER MANAGEMENT MONITORING & EVALUATION PANELS (2 BALANCED COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Evaluasi Kinerja 6 Divisi */}
        <div
          className={`lg:col-span-7 rounded-2xl border p-5 space-y-4 transition-colors ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0052FF]" />
                <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {t.sixDivTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{t.sixDivSub}</p>
            </div>
            <button
              onClick={() => setActiveNav('home')}
              className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>{t.openModule}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Division Performance Rows */}
          <div className="space-y-2">
            {divisionHealth.map((div) => {
              const Icon = div.icon;
              return (
                <div
                  key={div.id}
                  onClick={() => setActiveNav(div.id as any)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all duration-150 ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      : 'bg-[#0d1117] border-[#30363d] hover:bg-[#161b22] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${div.colorHex}20`,
                        border: `1px solid ${div.colorHex}45`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: div.colorHex }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400 font-bold">
                          {div.number}
                        </span>
                        <span
                          className={`text-xs font-semibold truncate ${
                            isLight ? 'text-slate-800' : 'text-slate-200'
                          }`}
                        >
                          {div.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {div.detail}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-300">
                        {div.metric}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                          div.status === 'safe'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {div.statusText}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Antrean Otorisasi Genting / Critical Approvals */}
        <div
          className={`lg:col-span-5 rounded-2xl border p-5 space-y-4 flex flex-col justify-between transition-colors ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#f43f5e]" />
                  <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {t.criticalQueueTitle}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{t.criticalQueueSub}</p>
              </div>

              {pendingApprovals.length > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  {pendingApprovals.length} {isEn ? 'Pending' : 'Menunggu'}
                </span>
              )}
            </div>

            {/* List of critical queue items */}
            <div className="space-y-2.5 mt-4">
              {pendingApprovals.length === 0 ? (
                <div
                  className={`p-6 rounded-xl border text-center space-y-2 ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-500'
                      : 'bg-[#0d1117] border-[#30363d] text-slate-400'
                  }`}
                >
                  <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                  <p className="text-xs">{t.noPendingQueue}</p>
                </div>
              ) : (
                pendingApprovals.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                              item.urgency === 'HIGH'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            }`}
                          >
                            {item.urgency}
                          </span>
                          <span className="font-semibold text-xs text-slate-200 truncate">
                            {item.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 truncate">
                          {item.requester} • {item.dept}
                        </div>
                      </div>

                      {item.amountOrValue && (
                        <div className="text-right shrink-0">
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            {item.amountOrValue}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2.5 mt-2 border-t border-gray-700/30">
                      <button
                        onClick={() => handleQuickReject(item.id, item.source)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-pointer transition flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        <span>{t.reject}</span>
                      </button>
                      <button
                        onClick={() => handleQuickApprove(item.id, item.source)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 cursor-pointer transition flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                      >
                        <Check className="w-3 h-3" />
                        <span>{t.approve}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Action to open full Executive queue */}
          <div className="pt-2">
            <button
              onClick={() => setActiveNav('executive')}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-[#21262d] hover:bg-[#30363d] text-white border-[#30363d] hover:border-gray-600'
              }`}
            >
              <span>{t.viewExecutiveQueue}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#00f2fe]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardModule;
