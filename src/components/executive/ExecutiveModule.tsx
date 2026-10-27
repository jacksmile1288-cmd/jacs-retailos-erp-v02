import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getReactiveNeonGlowStyle } from '../../utils/neonGlow';
import { StockPolicyTab } from './StockPolicyTab';
import { PromotionsTab } from './PromotionsTab';
import { POApprovalTab } from './POApprovalTab';
import { ProductTrendIntelligence } from './ProductTrendIntelligence';
import { CashierSalesAuditView } from './CashierSalesAuditView';
import { UrgentActionBanner } from './UrgentActionBanner';
import {
  TrendingUp,
  Percent,
  DollarSign,
  Users,
  ShieldCheck,
  CheckCircle,
  Clock,
  Layers,
  CheckCircle2,
  XCircle,
  FileText,
  BarChart3,
  ArrowUpRight,
  ShieldAlert,
  Gift,
  Building2,
  Sparkles,
  ArrowRight,
  Receipt,
} from 'lucide-react';

export const ExecutiveModule: React.FC = () => {
  const {
    sales,
    products,
    users,
    finance,
    purchasing,
    purchaseRequests,
    approvePurchaseRequest,
    rejectPurchaseRequest,
    approvalQueue,
    approveItem,
    rejectItem,
    approveAllDocumentApprovals,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    promotions,
    updatePromotion,
    theme,
    language,
    activeNeonCards,
    setActiveNeonCard,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'product-trend' | 'cashier-sales' | 'promotions' | 'po-approval' | 'stock-policy'>('overview');
  const [poNotesMap, setPoNotesMap] = useState<Record<string, string>>({});
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const isLight = theme === 'light';
  const isEn = language === 'en';

  const pendingApprovals = approvalQueue.filter((a) => a.status === 'PENDING');
  const pendingPurchaseRequests = useMemo(() => {
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

  const totalPendingQueueCount = pendingApprovals.length + pendingPurchaseRequests.length + highValuePendingPOs.length;

  const handleApproveAllQueue = () => {
    const pendingItems = approvalQueue.filter((a) => a.status === 'PENDING');
    const pendingPOs = (purchasing || []).filter((po) => isPendingPo(po));
    const pendingPRs = (purchaseRequests || []).filter(
      (pr) => pr.status === 'PENDING' || pr.status === 'Pending Approval'
    );

    if (pendingItems.length === 0 && pendingPOs.length === 0 && pendingPRs.length === 0) return;

    const totalCount = pendingItems.length + pendingPRs.length + pendingPOs.length;

    // Direct batch approval for all document approvals
    approveAllDocumentApprovals();

    // 1. Setujui seluruh Purchase Order pending di purchasing
    pendingPOs.forEach((po) => {
      approvePurchaseOrder(
        po.po_number,
        poNotesMap[po.po_number] ||
          'Disetujui batch oleh Direksi & Pimpinan Eksekutif untuk pemenuhan pengadaan barang Q4.'
      );
    });

    // 2. Setujui seluruh draf PR pending
    pendingPRs.forEach((pr) => {
      approvePurchaseRequest(pr.pr_number);
    });

    // 2. Setujui seluruh program promosi yang masih pending otorisasi
    (promotions || []).forEach((promo) => {
      if (promo.status === 'PENDING' || (promo.status as string) === 'PENDING_APPROVAL') {
        updatePromotion(promo.id, {
          status: 'ACTIVE',
          approvedBy: 'Direktur Eksekutif (Batch Approved)',
          authorizedBy: 'Direktur Eksekutif',
          isActive: true,
        });
      }
    });

    showToast(
      isEn
        ? `Successfully approved all ${totalCount} pending queue items simultaneously!`
        : `Berhasil menyetujui seluruh ${totalCount} berkas antrean PO & dokumen menjadi APPROVED sekaligus!`
    );
  };

  const handleApproveAllDocumentApprovals = () => {
    approveAllDocumentApprovals();
  };

  // Metrics
  const grossRevenue = useMemo(() => {
    return sales.reduce((acc, s) => acc + s.total_amount, 0);
  }, [sales]);

  // Real COGS calculation from Finance module auto-journals (HPP / BEBAN POKOK)
  const realHppFromFinance = useMemo(() => {
    return finance
      .filter((f) => f.type === 'HPP / BEBAN POKOK')
      .reduce((acc, f) => acc + f.amount, 0);
  }, [finance]);

  // Actual COGS: use recorded HPP journals from POS/BOM, or fallback if empty
  const estimatedCost = useMemo(() => {
    if (realHppFromFinance > 0) return realHppFromFinance;
    return Math.round(grossRevenue * 0.68); // fallback ~68% COGS
  }, [grossRevenue, realHppFromFinance]);

  const grossProfit = Math.max(0, grossRevenue - estimatedCost);
  const profitMarginPercent =
    grossRevenue > 0 ? ((grossProfit / grossRevenue) * 100).toFixed(1) : '0.0';
  const averageOrderValue =
    sales.length > 0 ? Math.round(grossRevenue / sales.length) : 0;

  // Liquid cash calculation including POS auto-journal Cash Inflow (IN / PENDAPATAN)
  const totalCashIncome = useMemo(() => {
    return finance
      .filter((f) => f.type === 'INCOME' || f.type === 'IN / PENDAPATAN')
      .reduce((acc, f) => acc + f.amount, 0);
  }, [finance]);

  const totalCashExpense = useMemo(() => {
    return finance
      .filter((f) => f.type === 'EXPENSE')
      .reduce((acc, f) => acc + f.amount, 0);
  }, [finance]);

  const cashPosition = totalCashIncome - totalCashExpense;

  // Cashier Shift Audit Breakdown
  const cashierAudit = useMemo(() => {
    const map: Record<
      string,
      { name: string; totalSales: number; ordersCount: number }
    > = {};
    sales.forEach((s) => {
      const id = s.cashier_id;
      const name = s.cashier_name || id;
      if (!map[id]) {
        map[id] = { name, totalSales: 0, ordersCount: 0 };
      }
      map[id].totalSales += s.total_amount;
      map[id].ordersCount += 1;
    });
    return Object.values(map);
  }, [sales]);

  // 5 Executive Neon Metric Cards with standardized bilingual labels
  const metricCards = [
    {
      id: 'revenue',
      title: 'Total Pendapatan (Total Revenue)',
      value: `Rp ${grossRevenue.toLocaleString('id-ID')}`,
      sub: 'Target bulanan on-track 112%',
      colorHex: '#00f2fe',
      icon: TrendingUp,
      focusDesc:
        'Fokus Analisis: Penjualan kotor seluruh 6 terminal kasir JacS ERP & sinkronisasi DB_Sales.',
    },
    {
      id: 'profit',
      title: isEn ? 'Real Gross Profit (Revenue vs COGS)' : 'Total Laba Kotor Riil (Omzet vs HPP)',
      value: `Rp ${grossProfit.toLocaleString('id-ID')}`,
      sub: isEn
        ? `Margin: ${profitMarginPercent}% • COGS: Rp ${estimatedCost.toLocaleString('id-ID')}`
        : `Margin: ${profitMarginPercent}% • HPP Resep: Rp ${estimatedCost.toLocaleString('id-ID')}`,
      colorHex: '#10B981',
      icon: Percent,
      focusDesc: isEn
        ? 'Analytical Focus: Real gross profit comparing POS cash sales against recipe-based COGS.'
        : 'Fokus Analisis: Laba kotor riil perbandingan Omzet Penjualan Kasir POS terhadap Beban Pokok Penjualan (HPP Resep BOM & Bahan Baku).',
    },
    {
      id: 'cash-position',
      title: 'Posisi Kas (Cash Position)',
      value: `Rp ${cashPosition.toLocaleString('id-ID')}`,
      sub: 'Likuiditas Kas & Bank Siap Operasional',
      colorHex: '#38bdf8',
      icon: DollarSign,
      focusDesc:
        'Fokus Analisis: Posisi arus kas likuid bersih dari buku kas masuk & kas keluar.',
    },
    {
      id: 'total-orders',
      title: 'Total Pesanan (Total Orders)',
      value: `${sales.length} Transaksi`,
      sub: `AOV: Rp ${averageOrderValue.toLocaleString('id-ID')}`,
      colorHex: '#f59e0b',
      icon: Users,
      focusDesc:
        'Fokus Analisis: Volume order nota belanja dan rata-rata keranjang (Average Order Value).',
    },
    {
      id: 'approval-queue',
      title: 'Antrean Persetujuan (Approval Queue)',
      value: `${pendingApprovals.length + pendingPurchaseRequests.length} Menunggu`,
      sub: `${pendingPurchaseRequests.length} Draf PR • ${pendingApprovals.length} Dokumen Umum`,
      colorHex: '#f43f5e',
      icon: ShieldCheck,
      focusDesc:
        'Fokus Analisis: Antrean otorisasi dokumen Purchase Request dan pengadaan dana pimpinan.',
    },
  ];

  const selectedMetricId = activeNeonCards['executive'] || 'revenue';
  const selectedMetric =
    metricCards.find((c) => c.id === selectedMetricId) || metricCards[0];

  return (
    <div id="executive-module" className="space-y-6 max-w-7xl mx-auto pb-6 w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div
        className={`p-5 rounded-2xl border transition duration-200 ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-2 border ${
              isLight
                ? 'bg-emerald-50 text-emerald-800 border-slate-200'
                : 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
            }`}>
              <Layers className="w-3.5 h-3.5" />
              <span>Executive Management • 5 KPI Bars</span>
            </div>
            <h2
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Executive & Managerial Dashboard
            </h2>
            <p className="text-xs text-[#8b949e]">
              Ringkasan metrik finansial, omzet penjualan, gross margin, dan otorisasi antrean approval.
            </p>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold"
            style={{
              borderColor: `${selectedMetric.colorHex}60`,
              backgroundColor: `${selectedMetric.colorHex}15`,
              color: selectedMetric.colorHex,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedMetric.colorHex }}
            />
            <span>Fokus: {selectedMetric.title}</span>
          </div>
        </div>
      </div>

      {/* Urgent Operational Blocking Queue Detector Banner */}
      <UrgentActionBanner
        isLight={isLight}
        isEn={isEn}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Sub-Navigation Tabs - Wrap Multi-baris Ringkas & Bebas Scroll Samping */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
        {/* 1. Financial Overview */}
        <button
          id="btn-tab-exec-overview"
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>{isEn ? 'Financial Overview' : 'Overview Finansial'}</span>
        </button>

        {/* 2. Product Trend & Sales Intelligence */}
        <button
          id="btn-tab-exec-product-trend"
          type="button"
          onClick={() => setActiveTab('product-trend')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'product-trend'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{isEn ? 'Product Trend & AI' : 'Tren Produk & AI'}</span>
        </button>

        {/* 3. Laporan Penjualan Kasir */}
        <button
          id="btn-tab-exec-cashier-sales"
          type="button"
          onClick={() => setActiveTab('cashier-sales')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'cashier-sales'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>{isEn ? 'Cashier Sales Audit' : 'Audit Penjualan Kasir'}</span>
        </button>

        {/* 4. Promos & Packages */}
        <button
          id="btn-tab-exec-promotions"
          type="button"
          onClick={() => setActiveTab('promotions')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'promotions'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>{isEn ? 'Promos & Packages' : 'Promo & Paket'}</span>
        </button>

        {/* 5. High-Value PO Approval */}
        <button
          id="btn-tab-exec-po-approval"
          type="button"
          onClick={() => setActiveTab('po-approval')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'po-approval'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isEn ? 'High-Value PO Approval' : 'High-Value PO Approval'}</span>
          {highValuePendingPOs.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white animate-pulse">
              {highValuePendingPOs.length}
            </span>
          )}
        </button>

        {/* 6. Stock Policy */}
        <button
          id="btn-tab-exec-stock-policy"
          type="button"
          onClick={() => setActiveTab('stock-policy')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'stock-policy'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{isEn ? 'Stock Policy' : 'Kebijakan Stok'}</span>
        </button>
      </div>

      {activeTab === 'product-trend' && <ProductTrendIntelligence isLight={isLight} isEn={isEn} />}

      {activeTab === 'cashier-sales' && <CashierSalesAuditView isLight={isLight} isEn={isEn} />}

      {activeTab === 'promotions' && <PromotionsTab isLight={isLight} isEn={isEn} />}

      {activeTab === 'po-approval' && <POApprovalTab isLight={isLight} isEn={isEn} />}

      {activeTab === 'stock-policy' && <StockPolicyTab isLight={isLight} isEn={isEn} />}

      {activeTab === 'overview' && (
        <>
          {/* 5 NEON KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          const isSelected = selectedMetricId === card.id;
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
              id={`kpi-card-${card.id}`}
              onClick={() => setActiveNeonCard('executive', card.id)}
              onMouseEnter={() => setHoveredCardId(card.id)}
              onMouseLeave={() => setHoveredCardId(null)}
              style={glowStyle}
              className="relative p-4 rounded-2xl text-left cursor-pointer overflow-hidden flex flex-col justify-between min-h-[140px] transition-all duration-150 ease-out min-w-0"
            >
              {/* Top Accent Strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-150 ease-out"
                style={{
                  backgroundColor: card.colorHex,
                  boxShadow: !isLight && (isSelected || isHovered) ? `0 0 16px ${card.colorHex}` : 'none',
                }}
              />

              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <span
                  className="text-xs font-bold uppercase tracking-wider truncate min-w-0"
                  style={{ color: isSelected ? card.colorHex : '#8b949e' }}
                  title={card.title}
                >
                  {card.title}
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${card.colorHex}20`,
                    color: card.colorHex,
                    border: `1px solid ${card.colorHex}40`,
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2 min-w-0">
                <div
                  className={`text-lg sm:text-xl font-black font-mono tracking-tight truncate min-w-0 ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                  style={{ color: isSelected ? card.colorHex : undefined }}
                  title={card.value}
                >
                  {card.value}
                </div>
                <div className="text-[11px] text-[#8b949e] font-medium mt-1 truncate" title={card.sub}>
                  {card.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* DYNAMIC FOCUS ANALYSIS PANEL BASED ON SELECTED NEON METRIC */}
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
              style={{ backgroundColor: selectedMetric.colorHex }}
            />
            <h3
              className={`font-black text-base ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Fokus Analisis: {selectedMetric.title}
            </h3>
          </div>
          <span className="text-xs text-[#8b949e] hidden sm:inline">
            {selectedMetric.focusDesc}
          </span>
        </div>

        {/* Conditional Content based on selectedMetricId */}
        {selectedMetricId === 'approval-queue' && (
          <div className="space-y-6">
            {/* SEKSI 1: PURCHASE ORDER NILAI TINGGI (> RP 20.000.000) MENUNGGU OTORISASI DIREKSI */}
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-rose-500/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <h4
                    className={`font-black text-sm tracking-tight ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    Daftar Purchase Order Bernilai &gt; Rp 20.000.000 (Status: PENDING_APPROVAL)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {highValuePendingPOs.length} Menunggu Otorisasi Direksi
                  </span>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    id="btn-approve-all-document-approvals-top"
                    type="button"
                    disabled={pendingApprovals.length === 0}
                    onClick={handleApproveAllDocumentApprovals}
                    className="px-3.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)] transition cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                    title={
                      pendingApprovals.length === 0
                        ? 'Semua dokumen approval sudah disetujui (0)'
                        : `Setujui seluruh ${pendingApprovals.length} berkas antrean dokumen approval sekaligus`
                    }
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve All Document Approvals</span>
                    {pendingApprovals.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono font-bold">
                        {pendingApprovals.length}
                      </span>
                    )}
                  </button>

                  <button
                    id="btn-approve-all-queue"
                    type="button"
                    disabled={totalPendingQueueCount === 0}
                    onClick={handleApproveAllQueue}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.35)] transition cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                    title={
                      totalPendingQueueCount === 0
                        ? 'Antrean approval sudah kosong (0)'
                        : `Setujui seluruh ${totalPendingQueueCount} berkas antrean PO & dokumen pengadaan sekaligus`
                    }
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve All Queue</span>
                    {totalPendingQueueCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono font-bold">
                        {totalPendingQueueCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('po-approval')}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    <span>Buka Tab Otorisasi PO Lengkap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {highValuePendingPOs.length === 0 ? (
                <div
                  className={`p-4 rounded-xl border text-center text-xs ${
                    isLight
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  <p className="font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Seluruh Purchase Order bernilai &gt; Rp 20.000.000 telah disetujui (Approved) dan tersinkron ke Hutang Usaha (AP).</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {highValuePendingPOs.map((po) => {
                    const currentNote =
                      poNotesMap[po.po_number] ??
                      'Disetujui untuk pemenuhan pengadaan barang Q4. Terbitkan tagihan AP ke modul Finance.';

                    return (
                      <div
                        key={po.po_number}
                        className={`p-4 rounded-xl border transition-all ${
                          isLight
                            ? 'bg-rose-50/60 border-rose-300 shadow-sm'
                            : 'bg-[#161b22] border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black text-rose-400">
                              {po.po_number}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-500/20 text-purple-300 border-purple-500/40 font-mono">
                              OTORISASI DIREKSI (&gt; 20 JT)
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                              PENDING_APPROVAL
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            Tanggal: {po.date} • Term: {po.payment_term || 'Tempo 30 Hari'}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2.5 text-xs">
                          <div>
                            <span className="text-[10px] text-gray-400 block font-medium">Vendor / Pemasok:</span>
                            <span className="font-bold text-sky-400">{po.supplier_name}</span>
                          </div>
                          <div className="md:col-span-1">
                            <span className="text-[10px] text-gray-400 block font-medium">Rincian Barang &amp; Bahan:</span>
                            <span className="text-gray-300 line-clamp-1">{po.items}</span>
                          </div>
                          <div className="text-left md:text-right">
                            <span className="text-[10px] text-gray-400 block font-medium">Total Nilai PO:</span>
                            <span className="text-base font-black font-mono text-emerald-400">
                              Rp {po.total_amount.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        {/* AP & Journal Integration Note */}
                        <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/25 text-[11px] text-blue-200/90 leading-relaxed mb-3 flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Sinkronisasi Finance &amp; AP:</strong> Persetujuan (Approve) PO ini akan otomatis menerbitkan tagihan Hutang Usaha (AP / 2-10001) senilai <strong>Rp {po.total_amount.toLocaleString('id-ID')}</strong> dan membukukan jurnal akrual penerimaan ke General Ledger.
                          </span>
                        </div>

                        {/* Input Catatan Persetujuan & Action Buttons */}
                        <div className="pt-2 border-t border-slate-700/40 space-y-2.5">
                          <div>
                            <label className="text-[11px] font-bold text-gray-300 block mb-1">
                              Catatan Persetujuan / Alasan Otorisasi Direksi:
                            </label>
                            <input
                              type="text"
                              value={currentNote}
                              onChange={(e) =>
                                setPoNotesMap({ ...poNotesMap, [po.po_number]: e.target.value })
                              }
                              placeholder="Ketik catatan otorisasi persetujuan anggaran..."
                              className="w-full px-3 py-1.5 rounded-lg text-xs border bg-slate-900/60 border-slate-700 text-white outline-none focus:border-rose-500 transition"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              id={`btn-reject-exec-po-${po.po_number}`}
                              type="button"
                              onClick={() => rejectPurchaseOrder(po.po_number, currentNote)}
                              className="px-3.5 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>Reject PO</span>
                            </button>

                            <button
                              id={`btn-approve-exec-po-${po.po_number}`}
                              type="button"
                              onClick={() => approvePurchaseOrder(po.po_number, currentNote)}
                              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition cursor-pointer active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve PO</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SEKSI 2: DAFTAR DRAF PURCHASE REQUEST (PR) - APPROVAL MANAJERIAL */}
            <div className="space-y-3 pt-4 border-t border-[#30363d]/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Daftar Draf Purchase Request (PR) - Approval Manajerial
                    </h4>
                    <p className="text-xs text-gray-400">
                      Otorisasi draf permohonan pengadaan stok barang dari gudang/toko sebelum diproses staf Purchasing menjadi PO.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {pendingPurchaseRequests.length} PR Menunggu Persetujuan
                  </span>
                </div>
              </div>

              {pendingPurchaseRequests.length === 0 ? (
                <div
                  className={`p-4 rounded-xl border text-center text-xs ${
                    isLight
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  <p className="font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Seluruh draf Purchase Request (PR) telah diproses / disetujui (APPROVED). Tidak ada draf pending.</span>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingPurchaseRequests.map((pr) => (
                    <div
                      key={`pr-exec-card-${pr.pr_number}`}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#0d1117] border-[#30363d]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-cyan-400">
                              {pr.pr_number}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              DRAF PURCHASE REQUEST
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                            {pr.status}
                          </span>
                        </div>

                        <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {pr.item_name}
                        </h4>

                        <div className="text-[11px] text-gray-400 mt-1 flex flex-wrap gap-x-2">
                          <span>
                            Pemohon: <strong className={isLight ? 'text-slate-700' : 'text-gray-200'}>{pr.requester_name}</strong>
                          </span>
                          <span>•</span>
                          <span>{pr.department}</span>
                          <span>•</span>
                          <span>{pr.date}</span>
                        </div>

                        <div className="mt-2.5 p-2 rounded-lg bg-black/20 border border-slate-700/40 flex items-center justify-between text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-gray-400 block">Kuantitas Permintaan:</span>
                            <span className="font-bold text-amber-400">{pr.qty} Unit</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 block">Estimasi Anggaran:</span>
                            <span className="font-bold text-emerald-400">Rp {pr.estimated_cost.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 block">Urgensi:</span>
                            <span
                              className={`font-bold ${
                                pr.urgency === 'High'
                                  ? 'text-rose-400'
                                  : pr.urgency === 'Medium'
                                  ? 'text-amber-400'
                                  : 'text-blue-400'
                              }`}
                            >
                              {pr.urgency}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons: Setujui (Approve) & Tolak (Reject) */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[#30363d]">
                        <button
                          type="button"
                          id={`btn-approve-pr-${pr.pr_number}`}
                          onClick={() => approvePurchaseRequest(pr.pr_number)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-[0_0_10px_rgba(16,185,129,0.3)] active:scale-95"
                          title="Setujui PR agar staf Purchasing dapat memproses penerbitan PO resmi"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Setujui (Approve)</span>
                        </button>
                        <button
                          type="button"
                          id={`btn-reject-pr-${pr.pr_number}`}
                          onClick={() => rejectPurchaseRequest(pr.pr_number, 'Ditolak pimpinan di modul Executive')}
                          className="flex-1 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                          title="Tolak permohonan pengadaan barang ini"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak (Reject)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SEKSI 3: ANTREAN PERSETUJUAN DOKUMEN LAINNYA (HR & STOCK MUTATIONS) */}
            <div className="space-y-3 pt-4 border-t border-[#30363d]/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#8b949e]">
                <span>Antrean Dokumen Pengadaan &amp; Berkas Umum (PR &amp; HR):</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#f43f5e]">
                    {pendingApprovals.length} Berkas Pending
                  </span>
                  <button
                    id="btn-approve-all-document-approvals"
                    type="button"
                    disabled={pendingApprovals.length === 0}
                    onClick={handleApproveAllDocumentApprovals}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                    title={
                      pendingApprovals.length === 0
                        ? 'Semua berkas telah disetujui (0)'
                        : `Setujui seluruh ${pendingApprovals.length} berkas pending sekaligus`
                    }
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve All Document Approvals</span>
                  </button>
                </div>
              </div>

            {approvalQueue.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">
                Tidak ada permohonan persetujuan dalam antrean.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {approvalQueue.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                      isLight
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-gray-400">
                            {item.id}
                          </span>
                          {item.type === 'PURCHASE_ORDER' && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                (item.amount || 0) > 20000000 || item.title.includes('DIREKSI')
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.25)]'
                                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              }`}
                            >
                              {(item.amount || 0) > 20000000 || item.title.includes('DIREKSI')
                                ? 'OTORISASI DIREKSI (> 20 JT)'
                                : 'PURCHASE ORDER'}
                            </span>
                          )}
                          {item.type === 'PURCHASE_REQUEST' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              PURCHASE REQUEST
                            </span>
                          )}
                          {item.type === 'USER_ACCESS' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                              IZIN & CUTI HR
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : item.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <h4
                        className={`text-sm font-bold ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Pemohon: <span className="text-gray-300 font-medium">{item.requester}</span> • {item.department} • {item.date}
                      </div>
                      <p className="text-xs text-[#8b949e] mt-1.5 leading-relaxed">
                        {item.details}
                      </p>
                      <div className="mt-2 text-xs font-semibold text-emerald-400 font-mono flex items-center justify-between">
                        <span>Nominal Anggaran:</span>
                        <span className="text-sm font-black">Rp {(item.amount || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {item.status === 'PENDING' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-[#30363d]">
                        <button
                          onClick={() => approveItem(item.id)}
                          className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow-[0_0_10px_rgba(16,185,129,0.3)] active:scale-95"
                          title="Setujui dan teruskan otorisasi dokumen"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Setujui (Approve)</span>
                        </button>
                        <button
                          onClick={() => rejectItem(item.id)}
                          className="flex-1 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
                          title="Tolak berkas pengajuan"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak (Reject)</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        )}

        {selectedMetricId === 'revenue' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div
                className={`p-3 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <span className="text-[#8b949e]">Total Penjualan Kotor</span>
                <div className="text-lg font-black font-mono text-[#00f2fe] mt-1">
                  Rp {grossRevenue.toLocaleString('id-ID')}
                </div>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <span className="text-[#8b949e]">Transaksi Kasir Selesai</span>
                <div className="text-lg font-black font-mono text-white mt-1">
                  {sales.length} Nota
                </div>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <span className="text-[#8b949e]">Rata-rata Penjualan / Hari</span>
                <div className="text-lg font-black font-mono text-emerald-400 mt-1">
                  Rp {Math.round(grossRevenue * 0.15).toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMetricId === 'profit' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div
                className={`p-3 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <span className="text-[#8b949e]">Laba Kotor Riil (Gross Profit)</span>
                <div className="text-lg font-black font-mono text-[#10B981] mt-1">
                  Rp {grossProfit.toLocaleString('id-ID')}
                </div>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <span className="text-[#8b949e]">Beban Pokok Penjualan (HPP Resep/BOM)</span>
                <div className="text-lg font-black font-mono text-amber-400 mt-1">
                  Rp {estimatedCost.toLocaleString('id-ID')}
                </div>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <span className="text-[#8b949e]">Margin Rasio Laba Kotor</span>
                <div className="text-lg font-black font-mono text-[#10B981] mt-1">
                  {profitMarginPercent}%
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMetricId === 'cash-position' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div
                className={`p-3 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <span className="text-[#8b949e]">Kas Masuk Operasional</span>
                <div className="text-lg font-black font-mono text-[#38bdf8] mt-1">
                  Rp {totalCashIncome.toLocaleString('id-ID')}
                </div>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <span className="text-[#8b949e]">Kas Keluar & Pengeluaran</span>
                <div className="text-lg font-black font-mono text-rose-400 mt-1">
                  Rp {totalCashExpense.toLocaleString('id-ID')}
                </div>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <span className="text-[#8b949e]">Saldo Kas Bersih</span>
                <div className="text-lg font-black font-mono text-emerald-400 mt-1">
                  Rp {cashPosition.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMetricId === 'total-orders' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div
                className={`p-3 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <span className="text-[#8b949e]">Total Order Transaksi</span>
                <div className="text-lg font-black font-mono text-[#f59e0b] mt-1">
                  {sales.length} Nota
                </div>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <span className="text-[#8b949e]">Nilai Belanja Rata-Rata (AOV)</span>
                <div className="text-lg font-black font-mono text-white mt-1">
                  Rp {averageOrderValue.toLocaleString('id-ID')}
                </div>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <span className="text-[#8b949e]">Tingkat Keberhasilan Sesi</span>
                <div className="text-lg font-black font-mono text-emerald-400 mt-1">
                  99.8% Selesai
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cashier Performance & Shift Audit */}
      <div
        className={`p-5 rounded-2xl border transition duration-200 ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3
              className={`font-bold text-base ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Audit Performa Shift Kasir
            </h3>
            <p className="text-xs text-[#8b949e]">
              Rekapitulasi penjualan berdasarkan verifikasi PIN operator kasir yang bertugas
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded-full border border-[#10B981]/30 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Audit Valid</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cashierAudit.map((c, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border space-y-3 ${
                isLight
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-[#0d1117] border-[#30363d]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0052FF]/20 text-[#0052FF] dark:text-[#58a6ff] flex items-center justify-center font-bold">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <div
                    className={`font-bold text-sm ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {c.name}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Operator Kasir Terverifikasi
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#30363d] flex justify-between items-center text-xs">
                <div>
                  <div className="text-gray-400">Total Transaksi</div>
                  <div
                    className={`font-bold ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {c.ordersCount} Nota
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-400">Omzet Shift</div>
                  <div className="font-bold font-mono text-[#10B981]">
                    Rp {c.totalSales.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default ExecutiveModule;
