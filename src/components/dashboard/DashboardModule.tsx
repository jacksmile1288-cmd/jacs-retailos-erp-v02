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
  ArrowRight,
  ShieldAlert,
  Archive,
  BarChart3,
  Calendar,
  Wallet,
  Building2,
  Lock,
  Layers,
  Sparkles,
  ArrowUpRight,
  Activity,
  ShoppingCart,
  Percent,
  Check,
  X,
} from 'lucide-react';

export const DashboardModule: React.FC<{ onNavigateToGovernance?: () => void }> = ({ onNavigateToGovernance }) => {
  const {
    sales,
    products,
    finance,
    purchasing,
    purchaseRequests,
    approvalQueue,
    employees,
    activeNeonCards,
    setActiveNeonCard,
    theme,
    language,
    approveItem,
    rejectItem,
    showToast,
    addPromotion,
    currentUser,
    addAuditLog,
    getLiquidCashBalance,
  } = useApp();

  const isLight = theme === 'light';
  const isEn = language === 'en';

  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [activeKpi, setActiveKpi] = useState<string>('revenue');
  const [showClearanceModal, setShowClearanceModal] = useState<string | null>(null);
  const [showTrafficModal, setShowTrafficModal] = useState(false);

  // Status Promo Cuci Gudang Idempotent
  const [activeClearanceMap, setActiveClearanceMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('jacs_active_clearance_promos');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [processingClearanceItem, setProcessingClearanceItem] = useState<string | null>(null);

  const handleCreateClearancePromo = (itemName: string, daysLeft: string) => {
    if (activeClearanceMap[itemName] || processingClearanceItem === itemName) return;
    setProcessingClearanceItem(itemName);

    try {
      const cleanSuffix = itemName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      const promoCode = `CUCI50-${cleanSuffix}`;

      // 1. Daftarkan diskon cuci gudang (diskon 50%) untuk batch produk terkait ke daftar promo aktif POS Kasir
      const nowStr = new Date().toISOString().split('T')[0];
      addPromotion({
        code: promoCode,
        name: `Diskon Cuci Gudang 50% (${itemName})`,
        type: 'SKU_DISCOUNT',
        discountValueType: 'PERCENT',
        discountValue: 50,
        status: 'ACTIVE',
        description: `Diskon cuci gudang 50% untuk batch mendekati expired (${daysLeft}): ${itemName}. Langsung aktif di terminal POS kasir.`,
        approvedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Direksi Eksekutif',
        startDate: nowStr,
      });

      // 2. Terapkan idempotency
      setActiveClearanceMap((prev) => {
        const next = { ...prev, [itemName]: true };
        try {
          localStorage.setItem('jacs_active_clearance_promos', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      // 3. Catat ke Log Audit Keputusan Manajerial
      const nowTimeStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const auditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        waktu: nowTimeStr,
        sektor: 'Inventory & POS Pricing',
        tindakan: `Otorisasi Diskon Cuci Gudang 50% (${promoCode}) untuk batch kedaluwarsa: ${itemName}`,
        eksekutor: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Direksi Eksekutif',
        status: 'APPLIED',
      };

      try {
        const raw = localStorage.getItem('jacs_managerial_decision_logs');
        const list = raw ? JSON.parse(raw) : [];
        const updatedList = [auditEntry, ...list];
        localStorage.setItem('jacs_managerial_decision_logs', JSON.stringify(updatedList));
        window.dispatchEvent(new Event('managerial_logs_updated'));
      } catch (e) {}

      addAuditLog(
        `Diskon Cuci Gudang 50% resmi diaktifkan untuk batch ${itemName} (Kode Promo: ${promoCode}). Promo otomatis aktif di terminal POS Kasir.`,
        'Governance & Pricing'
      );

      showToast(`Diskon Cuci Gudang 50% untuk ${itemName} aktif di terminal kasir POS!`);
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat promo cuci gudang');
    } finally {
      setProcessingClearanceItem(null);
    }
  };

  // Translations
  const t = {
    quickApprovalTitle: isEn ? 'Urgent Approval Queue' : 'Antrean Otorisasi Pimpinan',
    quickApprovalDesc: isEn
      ? 'Pending high-priority documents requiring executive authorization'
      : 'Dokumen prioritas tinggi menunggu otorisasi Direksi / Pimpinan',
    approve: isEn ? 'Approve' : 'Setujui',
    reject: isEn ? 'Reject' : 'Tolak',
    viewAll: isEn ? 'View All Governance' : 'Buka Semua Tata Kelola',
  };

  // Valid Sales & Financial Calculations
  const validSales = useMemo(() => {
    return (sales || []).filter((s) => s.status === 'COMPLETED' || s.status === 'PAID');
  }, [sales]);

  const grossRevenue = useMemo(() => {
    return validSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  }, [validSales]);

  const realHppFromFinance = useMemo(() => {
    return (finance || [])
      .filter((f) => f.type === 'HPP / BEBAN POKOK')
      .reduce((acc, f) => acc + (f.amount || 0), 0);
  }, [finance]);

  const estimatedCost = useMemo(() => {
    if (realHppFromFinance > 0) return realHppFromFinance;
    return Math.round(grossRevenue * 0.68);
  }, [grossRevenue, realHppFromFinance]);

  const grossProfit = Math.max(0, grossRevenue - estimatedCost);
  const profitMarginPercent =
    grossRevenue > 0 ? ((grossProfit / grossRevenue) * 100).toFixed(1) : '0.0';

  const totalCashIncome = useMemo(() => {
    return (finance || [])
      .filter((f) => f.type === 'INCOME' || f.type === 'IN / PENDAPATAN')
      .reduce((acc, f) => acc + (f.amount || 0), 0);
  }, [finance]);

  const totalCashExpense = useMemo(() => {
    return (finance || [])
      .filter((f) => f.type === 'EXPENSE')
      .reduce((acc, f) => acc + (f.amount || 0), 0);
  }, [finance]);

  const cashPosition = getLiquidCashBalance();

  // Pending Queues
  const pendingApprovals = useMemo(() => {
    return (approvalQueue || []).filter((a) => a.status === 'PENDING');
  }, [approvalQueue]);

  const pendingPRs = useMemo(() => {
    return (purchaseRequests || []).filter(
      (pr) => pr.status === 'PENDING' || pr.status === 'Pending Approval'
    );
  }, [purchaseRequests]);

  const isPendingPo = (po: any) => {
    const s = (po.status || '').toUpperCase().trim();
    return (
      s === 'PENDING_APPROVAL' ||
      s === 'MENUNGGU APPROVAL DIREKSI' ||
      s === 'MENUNGGU APPROVAL PIMPINAN' ||
      s === 'PENDING APPROVAL'
    );
  };

  const highValuePendingPOs = useMemo(() => {
    return (purchasing || []).filter(
      (po) => (po.total_amount || 0) > 20000000 && isPendingPo(po)
    );
  }, [purchasing]);

  const totalPendingQueueCount =
    pendingApprovals.length + pendingPRs.length + highValuePendingPOs.length;

  const totalPendingAmount = useMemo(() => {
    const poTotal = highValuePendingPOs.reduce((acc, p) => acc + (p.total_amount || 0), 0);
    const prTotal = pendingPRs.reduce((acc, p) => acc + (p.estimated_cost || 0), 0);
    const appTotal = pendingApprovals.reduce((acc, a) => acc + (a.amount || 0), 0);
    return poTotal + prTotal + appTotal;
  }, [highValuePendingPOs, pendingPRs, pendingApprovals]);

  // Combined Approval Items for Quick Action
  const approvalItems = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      requester: string;
      dept: string;
      amount: number;
      source: 'APPROVAL' | 'PR' | 'PO';
    }> = [];

    highValuePendingPOs.forEach((po) => {
      list.push({
        id: po.po_number,
        title: `PO Bernilai Tinggi: ${po.supplier_name || 'Vendor'}`,
        requester: po.created_by || 'Purchasing Staf',
        dept: 'Pengadaan / Purchasing',
        amount: po.total_amount || 0,
        source: 'PO',
      });
    });

    pendingPRs.forEach((pr) => {
      list.push({
        id: pr.pr_number,
        title: `Pengadaan: ${pr.item_name || 'Permohonan Barang'}`,
        requester: pr.requester_name || 'Staff',
        dept: pr.department || 'Operasional',
        amount: pr.estimated_cost || 0,
        source: 'PR',
      });
    });

    pendingApprovals.forEach((app) => {
      list.push({
        id: app.id,
        title: app.title || 'Dokumen Persetujuan',
        requester: app.requester || 'User',
        dept: app.department || 'Umum',
        amount: app.amount || 0,
        source: 'APPROVAL',
      });
    });

    return list;
  }, [highValuePendingPOs, pendingPRs, pendingApprovals]);

  const handleQuickApprove = (id: string, source: string) => {
    if (source === 'APPROVAL') {
      approveItem(id);
    }
    showToast(`Dokumen ${id} berhasil disetujui`);
  };

  const handleQuickReject = (id: string, source: string) => {
    if (source === 'APPROVAL') {
      rejectItem(id);
    }
    showToast(`Dokumen ${id} ditolak`);
  };

  // Weekly Trend Mock/Real Data for Chart
  const weeklyData = [
    { day: 'Sen', rev: 18500000, opex: 12200000 },
    { day: 'Sel', rev: 22400000, opex: 14100000 },
    { day: 'Rab', rev: 19800000, opex: 13500000 },
    { day: 'Kam', rev: 25100000, opex: 15800000 },
    { day: 'Jum', rev: 31200000, opex: 18900000 },
    { day: 'Sab', rev: 42500000, opex: 24200000 },
    { day: 'Min', rev: 38900000, opex: 21600000 },
  ];

  const maxVal = Math.max(...weeklyData.map((d) => d.rev));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-6 w-full min-w-0">
      {/* 1. TOP OPERATIONAL ALERT RADAR (EXPIRE & PEAK HOURS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Radar Kadaluwarsa */}
        <div
          className="p-4 rounded-2xl border transition duration-200 flex flex-col justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-amber-500/20 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-amber-200">
                  Radar Kedaluwarsa & Kritis Gudang
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  Batch stok mendekati masa simpan &lt; 30 hari
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-50 dark:bg-slate-950 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400">
              3 Batch Kritis
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            {/* Batch 1: Susu Segar UHT */}
            <div className="p-2.5 rounded-xl bg-black/5 dark:bg-black/20 border border-amber-500/20 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Susu Segar UHT</span>
                <strong className="text-rose-500 font-mono text-xs">H-5 Expired</strong>
              </div>
              {activeClearanceMap['Susu Segar UHT'] ? (
                <span className="mt-2 inline-flex items-center justify-center gap-1 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-1 rounded shadow-[0_0_8px_rgba(16,185,129,0.25)]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Promo Aktif</span>
                </span>
              ) : (
                <button
                  type="button"
                  disabled={processingClearanceItem === 'Susu Segar UHT'}
                  onClick={() => handleCreateClearancePromo('Susu Segar UHT', 'H-5')}
                  className={`mt-2 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors shadow-xs flex items-center justify-center gap-1 ${
                    processingClearanceItem === 'Susu Segar UHT'
                      ? 'opacity-50 cursor-not-allowed shadow-none'
                      : 'cursor-pointer'
                  }`}
                >
                  {processingClearanceItem === 'Susu Segar UHT' ? (
                    <>
                      <Clock className="w-3 h-3 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Buat Promo Cuci Gudang</span>
                  )}
                </button>
              )}
            </div>

            {/* Batch 2: Daging Ayam Fillet */}
            <div className="p-2.5 rounded-xl bg-black/5 dark:bg-black/20 border border-amber-500/20 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Daging Ayam Fillet</span>
                <strong className="text-rose-500 font-mono text-xs">H-8 Expired</strong>
              </div>
              {activeClearanceMap['Daging Ayam Fillet'] ? (
                <span className="mt-2 inline-flex items-center justify-center gap-1 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-1 rounded shadow-[0_0_8px_rgba(16,185,129,0.25)]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Promo Aktif</span>
                </span>
              ) : (
                <button
                  type="button"
                  disabled={processingClearanceItem === 'Daging Ayam Fillet'}
                  onClick={() => handleCreateClearancePromo('Daging Ayam Fillet', 'H-8')}
                  className={`mt-2 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors shadow-xs flex items-center justify-center gap-1 ${
                    processingClearanceItem === 'Daging Ayam Fillet'
                      ? 'opacity-50 cursor-not-allowed shadow-none'
                      : 'cursor-pointer'
                  }`}
                >
                  {processingClearanceItem === 'Daging Ayam Fillet' ? (
                    <>
                      <Clock className="w-3 h-3 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Buat Promo Cuci Gudang</span>
                  )}
                </button>
              )}
            </div>

            {/* Batch 3: Sirup Karamel F&B */}
            <div className="p-2.5 rounded-xl bg-black/5 dark:bg-black/20 border border-amber-500/20 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Sirup Karamel F&B</span>
                <strong className="text-amber-500 font-mono text-xs">H-18 Expired</strong>
              </div>
              {activeClearanceMap['Sirup Karamel F&B'] ? (
                <span className="mt-2 inline-flex items-center justify-center gap-1 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-1 rounded shadow-[0_0_8px_rgba(16,185,129,0.25)]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Promo Aktif</span>
                </span>
              ) : (
                <button
                  type="button"
                  disabled={processingClearanceItem === 'Sirup Karamel F&B'}
                  onClick={() => handleCreateClearancePromo('Sirup Karamel F&B', 'H-18')}
                  className={`mt-2 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors shadow-xs flex items-center justify-center gap-1 ${
                    processingClearanceItem === 'Sirup Karamel F&B'
                      ? 'opacity-50 cursor-not-allowed shadow-none'
                      : 'cursor-pointer'
                  }`}
                >
                  {processingClearanceItem === 'Sirup Karamel F&B' ? (
                    <>
                      <Clock className="w-3 h-3 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Buat Promo Cuci Gudang</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Radar Jam Sibuk Kasir */}
        <div
          className="p-4 rounded-2xl border transition duration-200 flex flex-col justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-cyan-500/20 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-500">
                <Clock className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-cyan-200">
                  Analisis Trafik Jam Sibuk Kasir POS
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  Peak-hours operasional toko & terminal kasir
                </p>
              </div>
            </div>
            <button onClick={() => setShowTrafficModal(true)} className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-50 dark:bg-slate-950 border border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 cursor-pointer transition">
              Peak: 12:00 & 19:30
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs px-2">
            <div className="text-left">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold block">Rata-rata Durasi Trx</span>
              <strong className="text-cyan-600 dark:text-cyan-400 font-mono text-sm">48 Detik / Nota</strong>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold block">Terminal Kasir Aktif</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">6 Terminal Siap</strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold block">Kasir Paling Produktif</span>
              <button onClick={() => setShowTrafficModal(true)} className="text-amber-600 dark:text-amber-400 font-mono text-sm font-bold hover:underline cursor-pointer transition-all">Kasir Utama 01</button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DUAL ANALYTICS & 6-DIVISION MONITORING SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT (7 COLS): FINANCIAL VELOCITY & PROFITABILITY TREND CHART */}
        <div
          className="lg:col-span-7 p-5 rounded-2xl border transition duration-200 flex flex-col justify-between bg-white dark:bg-[#161b22] border-slate-200 dark:border-[#30363d]"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <h3
                    className={`font-black text-sm uppercase tracking-wider ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    Financial Velocity & Profitability Trend
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Visualisasi performa Omzet Bruto vs Beban Operasional harian
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                  Gross Revenue
                </span>
                <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
                  OPEX
                </span>
              </div>
            </div>

            {/* Simulated Neon Curve / Bar Chart View */}
            <div className="h-48 w-full mt-4 flex items-end justify-between gap-3 px-2 pt-6 pb-2 border-b border-slate-700/40">
              {weeklyData.map((item, idx) => {
                const revHeight = Math.round((item.rev / maxVal) * 100);
                const opexHeight = Math.round((item.opex / maxVal) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${revHeight}%` }}
                        className="w-full max-w-[14px] rounded-t-md bg-cyan-500 hover:brightness-125 transition-all relative group/bar shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/bar:block bg-slate-900 text-cyan-300 font-mono text-[9px] px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap border border-cyan-500/40">
                          Rp {(item.rev / 1000000).toFixed(1)}M
                        </div>
                      </div>

                      {/* OPEX Bar */}
                      <div
                        style={{ height: `${opexHeight}%` }}
                        className="w-full max-w-[14px] rounded-t-md bg-rose-500 hover:brightness-125 transition-all relative group/bar shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/bar:block bg-slate-900 text-rose-300 font-mono text-[9px] px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap border border-rose-500/40">
                          Rp {(item.opex / 1000000).toFixed(1)}M
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 group-hover:text-cyan-400 mt-1 font-bold">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono">
            <span>Rata-rata Margin Mingguan: <strong className="text-emerald-400">32.4% Net Margin</strong></span>
            <span>Target Akhir Pekan: <strong className="text-cyan-400">On-Track (108%)</strong></span>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex justify-between text-xs font-bold text-amber-600 dark:text-amber-500">
              <span className="text-slate-900 dark:text-white font-bold">Plafon Anggaran Operasional (Monthly OPEX Ceiling)</span>
              <span className="font-mono">82.0%</span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
              <div className="h-full bg-amber-500 w-[82%]" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-medium font-mono font-medium">
              <span>Terpakai: Rp 98.400.000</span>
              <span>Sisa: Rp 21.600.000</span>
            </div>
            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">Peringatan Manajerial: Kuota anggaran bulanan menipis, batasi pengeluaran non-prioritas.</p>
          </div>
        </div>

        {/* RIGHT (5 COLS): 6-DIVISION PERFORMANCE EVALUATION */}
        <div
          className="lg:col-span-5 p-5 rounded-2xl border transition duration-200 flex flex-col justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-slate-900 dark:text-white font-bold text-sm tracking-wider uppercase">
                6-Division Performance Evaluation
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                ALL SYSTEMS NORMAL
              </span>
            </div>

            <div className="space-y-2.5">
              {/* 1. Executive Div */}
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="font-bold">Executive & Governance</span>
                </div>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">98.5% SLA</span>
              </div>

              {/* 2. HR Div */}
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="font-bold">HR & Kepegawaian</span>
                </div>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{(employees || []).length} Staf Aktif</span>
              </div>

              {/* 3. Finance Div */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">Finance & Akuntansi</span>
                      {cashPosition < 0 && (
                        <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[8px] px-1.5 py-0 rounded font-black uppercase animate-pulse">DEFISIT</span>
                      )}
                    </div>
                  </div>
                  <span className={`font-mono font-bold ${cashPosition < 0 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-cyan-700 dark:text-cyan-400'}`}>
                    Rp {cashPosition.toLocaleString('id-ID')}
                  </span>
                </div>
                {cashPosition < 0 && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold px-2">
                    Plafon kas terlewati, butuh verifikasi setoran fisik atau kas masuk.
                  </p>
                )}
              </div>

              {/* 4. Purchasing Div */}
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="font-bold">Procurement / PO</span>
                </div>
                <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">{(purchasing || []).length} PO Terbit</span>
              </div>

              {/* 5. Warehouse Div */}
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <Archive className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold">Logistik & Gudang</span>
                </div>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{(products || []).length} SKU Safe</span>
              </div>

              {/* 6. POS Terminal Div */}
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="font-bold">POS Retail & Kasir</span>
                </div>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">6 Terminal Online</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-medium flex items-center justify-between">
            <span>Audit Keseluruhan Divisi:</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">100% Terintegrasi</span>
          </div>
        </div>
      </div>

      {/* 3. URGENT APPROVAL BANNER (CLEAN & ERROR-FREE) */}
      {totalPendingQueueCount > 0 ? (
        <div className="w-full mb-6 mt-2 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold block truncate">
                Perhatian: {totalPendingQueueCount} Permintaan Otorisasi Tertahan
                {totalPendingAmount > 0 ? ` (Rp ${totalPendingAmount.toLocaleString('id-ID')})` : ''}
              </span>
              <p className="text-[11px] opacity-80 mt-0.5">
                Membutuhkan persetujuan manajerial segera untuk kelancaran arus barang dan pembayaran.
              </p>
            </div>
          </div>

          {onNavigateToGovernance && (
            <button
              type="button"
              onClick={onNavigateToGovernance}
              className="font-mono text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 shrink-0 px-4 py-2 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 cursor-pointer hover:bg-rose-500/20 transition active:scale-95 shadow-xs"
            >
              Segera Tinjau
            </button>
          )}
        </div>
      ) : (
        <div
          className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between gap-4 transition-all ${
            isLight
              ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-900 shadow-sm'
              : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-emerald-300">
              Tata Kelola Optimal: Seluruh dokumen dan pengadaan telah diotorisasi.
            </span>
          </div>
        </div>
      )}

      {/* 4. REMOVED OLD URGENT APPROVAL CARD */}

      {showClearanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-sm p-5 rounded-2xl border ${isLight ? 'bg-white' : 'bg-slate-900'} border-slate-700`}>
            <h3 className="font-bold mb-3 text-lg">Konfirmasi Clearance</h3>
            <p className="text-sm mb-4">Buat Diskon Cepat 30% untuk {showClearanceModal} di POS Kasir?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowClearanceModal(null)} className="flex-1 p-2 bg-slate-200 dark:bg-slate-800 rounded">Batal</button>
              <button onClick={() => {
                showToast("Promo Clearance aktif di terminal POS kasir");
                setShowClearanceModal(null);
              }} className="flex-1 p-2 bg-emerald-600 text-white rounded">Konfirmasi</button>
            </div>
          </div>
        </div>
      )}
      {showTrafficModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-sm p-5 rounded-2xl border ${isLight ? 'bg-white' : 'bg-slate-900'} border-slate-700`}>
            <h3 className="font-bold mb-3 text-lg">Insight Keranjang Belanja Jam Sibuk</h3>
            <div className="text-sm space-y-3 mb-4">
              <p><strong>Rekomendasi Cross-Selling:</strong> Bundling Minuman Dingin + Snack di meja kasir</p>
              <p><strong>AOV Saat Ini:</strong> Rp 45.000</p>
              <p><strong>Potensi Kenaikan:</strong> +Rp 15.000 (jika bundling aktif)</p>
            </div>
            <button onClick={() => setShowTrafficModal(false)} className="w-full p-2 bg-slate-600 text-white rounded">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardModule;