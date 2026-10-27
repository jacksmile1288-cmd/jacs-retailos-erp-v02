import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseOrder, LeaveRequest } from '../../types';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  PackageX,
  FileCheck2,
  CalendarClock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Percent,
  Check,
  XCircle,
  Building2,
  Calendar,
  User,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  Layers,
  Send,
  Info,
} from 'lucide-react';

export interface UrgentActionBannerProps {
  isLight?: boolean;
  isEn?: boolean;
  onNavigateTab?: (
    tab: 'overview' | 'product-trend' | 'cashier-sales' | 'promotions' | 'po-approval' | 'stock-policy'
  ) => void;
  className?: string;
}

export const UrgentActionBanner: React.FC<UrgentActionBannerProps> = ({
  isLight: propIsLight,
  isEn = false,
  onNavigateTab,
  className = '',
}) => {
  const {
    purchasing = [],
    products = [],
    leaveRequests = [],
    promotions = [],
    approvePurchaseOrder,
    rejectPurchaseOrder,
    approveLeaveRequest,
    rejectLeaveRequest,
    activeUser,
    currentUser,
    showToast,
    theme,
  } = useApp();

  const isLight = propIsLight !== undefined ? propIsLight : theme === 'light';

  // State untuk Quick Actions Accordion & Active Tab Filter
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'po' | 'leave'>('all');

  // State untuk Modal Rincian Item PO
  const [selectedPODetail, setSelectedPODetail] = useState<PurchaseOrder | null>(null);

  // Operator / Approver name
  const approverName =
    activeUser?.name ||
    currentUser?.name ||
    'Direksi Operasional / General Manager';

  // Format Mata Uang Rupiah
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // 1. PO Bernilai Tinggi / Pending Approval (>= Rp 20.000.000 atau status menunggu approval)
  const urgentPOs = useMemo(() => {
    return (purchasing as PurchaseOrder[]).filter((po) => {
      const status = (po.status || '').toUpperCase().trim();
      const isPendingStatus =
        status === 'PENDING' ||
        status === 'PENDING_APPROVAL' ||
        status === 'PENDING APPROVAL' ||
        status === 'MENUNGGU APPROVAL DIREKSI' ||
        status === 'MENUNGGU APPROVAL PIMPINAN' ||
        status.includes('MENUNGGU');

      const totalAmount = Number(po.total_amount || 0);
      const isHighValue = totalAmount >= 20000000;

      // Pending POs yang membutuhkan tindakan managerial / executive
      return isPendingStatus && (isHighValue || status.includes('APPROVAL') || status.includes('DIREKSI'));
    });
  }, [purchasing]);

  // 2. Stok Kosong / Habis pada barang katalog / Fast Moving (stok fisik = 0)
  const outOfStockProducts = useMemo(() => {
    return products.filter((p) => {
      const stock = Number(p.stock !== undefined ? p.stock : 0);
      if (stock > 0) return false;

      // Exclude raw material if not a retail catalog
      if (p.itemType === 'RAW_MATERIAL') return false;

      // Cek kategori fast moving atau barang retail utama
      const cat = (p.category || '').toLowerCase();
      const isFastMovingCategory =
        cat.includes('sembako') ||
        cat.includes('minuman') ||
        cat.includes('beverage') ||
        cat.includes('grocery') ||
        cat.includes('dairy') ||
        cat.includes('makanan') ||
        cat.includes('snack') ||
        cat.includes('mie') ||
        cat.includes('kopi') ||
        cat.includes('rokok') ||
        cat.includes('susu');

      return isFastMovingCategory || stock === 0;
    });
  }, [products]);

  // 3. Pengajuan Cuti Staf: Filter leaveRequests karyawan shift kasir/gudang yang masih berstatus 'Pending' / 'Menunggu'
  const urgentLeaves = useMemo(() => {
    return (leaveRequests as LeaveRequest[]).filter((leave) => {
      const s = (leave.status || '').toLowerCase().trim();
      const isPending = s === 'menunggu' || s === 'pending' || s === 'pending_approval';
      if (!isPending) return false;

      const dept = (leave.department || '').toLowerCase();
      const isShiftOps =
        dept.includes('kasir') ||
        dept.includes('frontliner') ||
        dept.includes('gudang') ||
        dept.includes('logistik') ||
        dept.includes('store') ||
        dept.includes('retail');

      return isShiftOps || true;
    });
  }, [leaveRequests]);

  // 4. Otorisasi Promo: Filter promosi yang membutuhkan persetujuan manajer
  const urgentPromos = useMemo(() => {
    return promotions.filter((promo: any) => {
      const s = (promo.status || '').toUpperCase().trim();
      const isPending =
        s === 'PENDING' ||
        s === 'PENDING_APPROVAL' ||
        s === 'DRAFT' ||
        !promo.approvedBy ||
        promo.approvedBy === '';

      return isPending;
    });
  }, [promotions]);

  // Total Item Operasional Terhambat
  const totalUrgentCount =
    urgentPOs.length +
    outOfStockProducts.length +
    urgentLeaves.length +
    urgentPromos.length;

  // Eksekusi 1-Klik: Setujui PO
  const handleApprovePO = (po: PurchaseOrder) => {
    if (approvePurchaseOrder) {
      approvePurchaseOrder(
        po.po_number,
        `Disetujui cepat via Urgent Action Banner oleh ${approverName}`
      );
    }
    showToast(
      `PO ${po.po_number} berhasil disetujui. Tim Purchasing dapat segera mengirim pesanan ke supplier.`
    );
    if (selectedPODetail?.po_number === po.po_number) {
      setSelectedPODetail(null);
    }
  };

  // Eksekusi 1-Klik: Tolak PO
  const handleRejectPO = (po: PurchaseOrder) => {
    if (rejectPurchaseOrder) {
      rejectPurchaseOrder(
        po.po_number,
        `Ditolak via Urgent Action Banner oleh ${approverName}`
      );
    }
    showToast(`PO ${po.po_number} telah ditolak.`);
    if (selectedPODetail?.po_number === po.po_number) {
      setSelectedPODetail(null);
    }
  };

  // Eksekusi 1-Klik: ACC Cuti Karyawan
  const handleApproveLeave = (leave: LeaveRequest) => {
    if (approveLeaveRequest) {
      approveLeaveRequest(
        leave.id,
        approverName,
        'Disetujui cepat via Executive Action Banner.'
      );
    } else {
      showToast(`Pengajuan cuti ${leave.employeeName} (${leave.ticketNumber}) berhasil disetujui.`);
    }
  };

  // Eksekusi 1-Klik: Tolak Cuti Karyawan
  const handleRejectLeave = (leave: LeaveRequest) => {
    if (rejectLeaveRequest) {
      rejectLeaveRequest(
        leave.id,
        approverName,
        'Permohonan cuti ditolak oleh Manager Operasional.'
      );
    } else {
      showToast(`Pengajuan cuti ${leave.employeeName} (${leave.ticketNumber}) telah ditolak.`);
    }
  };

  // Filter list tindakan cepat
  const showPOs = activeFilter === 'all' || activeFilter === 'po';
  const showLeaves = activeFilter === 'all' || activeFilter === 'leave';
  const totalActionableCount = urgentPOs.length + urgentLeaves.length;

  // Kasus 1: Ada antrean operasional terhambat (Total Urgent Items > 0)
  if (totalUrgentCount > 0) {
    return (
      <>
        <div
          id="urgent-action-banner"
          className={`w-full rounded-2xl p-4 sm:p-5 border transition-all duration-300 relative overflow-hidden shadow-sm ${
            isLight
              ? 'bg-gradient-to-r from-rose-50 via-amber-50/50 to-rose-50/80 border-rose-200/90 text-slate-900 shadow-rose-100/50'
              : 'bg-gradient-to-r from-rose-950/40 via-[#1c1417] to-amber-950/20 border-rose-500/40 text-slate-100 shadow-[0_0_20px_rgba(244,63,94,0.12)]'
          } ${className}`}
        >
          {/* Glow Accent Top Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 animate-pulse" />

          {/* Section Atas: Judul & Mini Badge Counters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Header & Deskripsi Masalah */}
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                </span>

                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                    isLight
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>Blocking Queue Detector</span>
                </div>

                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-md ${
                    isLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  Prioritas Tinggi
                </span>
              </div>

              <h3
                className={`text-base sm:text-lg font-black tracking-tight flex items-center gap-2 flex-wrap ${
                  isLight ? 'text-rose-950' : 'text-white'
                }`}
              >
                <span>⚠️ {totalUrgentCount} ANTRIAN OPERASIONAL MENDESAK MEMBUTUHKAN TINDAKAN MANAJER</span>
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isEn
                  ? 'Delays in managerial approvals will block supplier PO issuance, stall cashier checkout shelves, or cause staff shift shortages.'
                  : 'Penundaan persetujuan antrean ini akan menghambat penerbitan PO ke supplier, mengosongkan rak display kasir, atau mengganggu rotasi shift karyawan.'}
              </p>
            </div>

            {/* Mini Badge Counter Matrix */}
            <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
              {/* 1. PO Bernilai Tinggi */}
              <div
                onClick={() => onNavigateTab && onNavigateTab('po-approval')}
                role="button"
                tabIndex={0}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition cursor-pointer ${
                  urgentPOs.length > 0
                    ? isLight
                      ? 'bg-rose-100/90 border-rose-300 text-rose-900 hover:bg-rose-200 shadow-sm'
                      : 'bg-rose-950/60 border-rose-500/50 text-rose-200 hover:bg-rose-900/60 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                    : isLight
                    ? 'bg-white/80 border-slate-200 text-slate-500'
                    : 'bg-[#161b22]/60 border-[#30363d] text-slate-400'
                }`}
              >
                <FileCheck2 className={`w-4 h-4 ${urgentPOs.length > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">PO Pending</div>
                  <div className="text-xs font-black font-mono">
                    {urgentPOs.length > 0 ? `${urgentPOs.length} Dokumen` : '0'}
                  </div>
                </div>
              </div>

              {/* 2. Stok Kosong Fast-Moving */}
              <div
                onClick={() => onNavigateTab && onNavigateTab('product-trend')}
                role="button"
                tabIndex={0}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition cursor-pointer ${
                  outOfStockProducts.length > 0
                    ? isLight
                      ? 'bg-amber-100/90 border-amber-300 text-amber-900 hover:bg-amber-200 shadow-sm'
                      : 'bg-amber-950/60 border-amber-500/50 text-amber-200 hover:bg-amber-900/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : isLight
                    ? 'bg-white/80 border-slate-200 text-slate-500'
                    : 'bg-[#161b22]/60 border-[#30363d] text-slate-400'
                }`}
              >
                <PackageX className={`w-4 h-4 ${outOfStockProducts.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Stok Habis</div>
                  <div className="text-xs font-black font-mono">
                    {outOfStockProducts.length > 0 ? `${outOfStockProducts.length} Produk` : '0'}
                  </div>
                </div>
              </div>

              {/* 3. Cuti Staf Shift */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setIsExpanded(true);
                  setActiveFilter('leave');
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition cursor-pointer ${
                  urgentLeaves.length > 0
                    ? isLight
                      ? 'bg-indigo-100/90 border-indigo-300 text-indigo-900 hover:bg-indigo-200 shadow-sm'
                      : 'bg-indigo-950/60 border-indigo-500/50 text-indigo-200 hover:bg-indigo-900/60'
                    : isLight
                    ? 'bg-white/80 border-slate-200 text-slate-500'
                    : 'bg-[#161b22]/60 border-[#30363d] text-slate-400'
                }`}
              >
                <CalendarClock className={`w-4 h-4 ${urgentLeaves.length > 0 ? 'text-indigo-500' : 'text-slate-400'}`} />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Cuti Kritis</div>
                  <div className="text-xs font-black font-mono">
                    {urgentLeaves.length > 0 ? `${urgentLeaves.length} Pengajuan` : '0'}
                  </div>
                </div>
              </div>

              {/* 4. Otorisasi Promo */}
              <div
                onClick={() => onNavigateTab && onNavigateTab('promotions')}
                role="button"
                tabIndex={0}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition cursor-pointer ${
                  urgentPromos.length > 0
                    ? isLight
                      ? 'bg-purple-100/90 border-purple-300 text-purple-900 hover:bg-purple-200 shadow-sm'
                      : 'bg-purple-950/60 border-purple-500/50 text-purple-200 hover:bg-purple-900/60 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                    : isLight
                    ? 'bg-white/80 border-slate-200 text-slate-500'
                    : 'bg-[#161b22]/60 border-[#30363d] text-slate-400'
                }`}
              >
                <Percent className={`w-4 h-4 ${urgentPromos.length > 0 ? 'text-purple-500' : 'text-slate-400'}`} />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Promo Pending</div>
                  <div className="text-xs font-black font-mono">
                    {urgentPromos.length > 0 ? `${urgentPromos.length} Paket` : '0'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK ACTION CARDS ACCORDION SECTION */}
          {totalActionableCount > 0 && (
            <div className="mt-4 pt-4 border-t border-rose-300/40 dark:border-rose-500/20">
              {/* Accordion Header & Sub-Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border transition ${
                      isLight
                        ? 'bg-white/90 text-slate-800 border-rose-300 hover:bg-rose-100'
                        : 'bg-[#161b22] text-slate-200 border-rose-500/40 hover:bg-rose-950/50'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Kartu Tindakan Cepat (1-Klik Approval)</span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-rose-500 text-white font-bold">
                      {totalActionableCount}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 ml-1 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-400" />
                    )}
                  </button>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline">
                    Persetujuan instan tanpa berpindah tab
                  </span>
                </div>

                {/* Sub-Filters Tabs */}
                {isExpanded && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveFilter('all')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                        activeFilter === 'all'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : isLight
                          ? 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200'
                          : 'bg-[#161b22]/70 text-slate-400 hover:text-white border border-[#30363d]'
                      }`}
                    >
                      Semua ({totalActionableCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('po')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                        activeFilter === 'po'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : isLight
                          ? 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200'
                          : 'bg-[#161b22]/70 text-slate-400 hover:text-white border border-[#30363d]'
                      }`}
                    >
                      PO Nilai Tinggi ({urgentPOs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('leave')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                        activeFilter === 'leave'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : isLight
                          ? 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200'
                          : 'bg-[#161b22]/70 text-slate-400 hover:text-white border border-[#30363d]'
                      }`}
                    >
                      Cuti Staf ({urgentLeaves.length})
                    </button>
                  </div>
                )}
              </div>

              {/* Expandable Grid of Quick Action Cards */}
              {isExpanded && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 animate-fadeIn">
                  {/* ============================================================ */}
                  {/* SEKSI 1: KARTU APPROVAL PO (> Rp 20 Juta)                   */}
                  {/* ============================================================ */}
                  {showPOs &&
                    urgentPOs.map((po) => {
                      const totalAmount = Number(po.total_amount || 0);
                      const isHighValue = totalAmount >= 20000000;
                      const itemCount =
                        po.item_details && po.item_details.length > 0
                          ? po.item_details.length
                          : (po.items || '').split(',').filter(Boolean).length || 1;

                      return (
                        <div
                          key={`quick-po-${po.po_number}`}
                          className={`rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between gap-3 ${
                            isLight
                              ? 'bg-white/95 border-amber-200 shadow-sm hover:border-amber-300'
                              : 'bg-[#161b22]/90 border-amber-500/30 shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:border-amber-500/50'
                          }`}
                        >
                          {/* Baris Atas: Nomor PO, Badge Nilai Tinggi & Tanggal */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                  {po.po_number}
                                </span>
                                {isHighValue && (
                                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                                    Otorisasi Direksi &gt; Rp 20 Jt
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[240px] sm:max-w-xs">{po.supplier_name}</span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{po.date || 'Hari ini'}</span>
                              </div>
                              <div className="text-xs sm:text-sm font-black font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                                {formatRupiah(totalAmount)}
                              </div>
                            </div>
                          </div>

                          {/* Ringkasan Item Barang Singkat */}
                          <div
                            className={`p-2 rounded-lg text-xs border ${
                              isLight
                                ? 'bg-slate-50 border-slate-200/80 text-slate-700'
                                : 'bg-[#0d1117] border-slate-700/50 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Ringkasan Barang ({itemCount} Item):
                              </span>
                              <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                {po.payment_term || 'Tempo 30 Hari'}
                              </span>
                            </div>
                            <p className="line-clamp-1 font-medium text-[11px]">
                              {po.items ||
                                (po.item_details &&
                                  po.item_details.map((it) => `${it.product_name} (${it.qty} ${it.unit || 'unit'})`).join(', ')) ||
                                'Pesanan Pengadaan Retail'}
                            </p>
                          </div>

                          {/* Baris Tombol Aksi Langsung PO */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                            {/* Tombol Sekunder: Lihat Rincian Item PO */}
                            <button
                              type="button"
                              onClick={() => setSelectedPODetail(po)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                isLight
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                                  : 'bg-[#21262d] text-slate-200 hover:bg-[#30363d] border border-[#30363d]'
                              }`}
                              title="Buka rincian lengkap item PO"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-500" />
                              <span>Lihat Rincian Item PO</span>
                            </button>

                            {/* Tombol Utama: Tolak PO & Setujui & Terbitkan */}
                            <div className="flex items-center gap-1.5">
                              {/* Tombol Merah: Tolak PO */}
                              <button
                                type="button"
                                onClick={() => handleRejectPO(po)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                                  isLight
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300'
                                    : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-500/40'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                <span>Tolak PO</span>
                              </button>

                              {/* Tombol Hijau: Setujui & Terbitkan ke Supplier */}
                              <button
                                type="button"
                                onClick={() => handleApprovePO(po)}
                                className="px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow-emerald-500/20"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Setujui &amp; Terbitkan ke Supplier</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {/* ============================================================ */}
                  {/* SEKSI 2: KARTU APPROVAL CUTI STAF KASIR / OPERASIONAL        */}
                  {/* ============================================================ */}
                  {showLeaves &&
                    urgentLeaves.map((leave) => {
                      return (
                        <div
                          key={`quick-leave-${leave.id}`}
                          className={`rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between gap-3 ${
                            isLight
                              ? 'bg-white/95 border-indigo-200 shadow-sm hover:border-indigo-300'
                              : 'bg-[#161b22]/90 border-indigo-500/30 shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:border-indigo-500/50'
                          }`}
                        >
                          {/* Baris Atas: Nama Karyawan, Divisi/Shift & Durasi */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
                                  {leave.ticketNumber}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30">
                                  {leave.type || 'Pengajuan Cuti'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-100">
                                <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span>{leave.employeeName}</span>
                                {leave.nip && (
                                  <span className="text-[10px] text-slate-400 font-mono font-normal">
                                    ({leave.nip})
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                  isLight
                                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                    : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                                }`}
                              >
                                {leave.department}
                              </span>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                                Durasi: <span className="font-bold text-indigo-600 dark:text-indigo-400">{leave.durationDays} Hari</span>
                              </div>
                            </div>
                          </div>

                          {/* Rentang Tanggal Cuti & Alasan */}
                          <div
                            className={`p-2.5 rounded-lg text-xs border space-y-1.5 ${
                              isLight
                                ? 'bg-slate-50 border-slate-200/80 text-slate-700'
                                : 'bg-[#0d1117] border-slate-700/50 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              <CalendarClock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>
                                Rentang:{' '}
                                <strong className="font-mono">
                                  {leave.startDate} s/d {leave.endDate}
                                </strong>
                              </span>
                            </div>
                            <p className="text-[11px] italic text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-black/20 p-1.5 rounded border border-slate-200/50 dark:border-slate-800">
                              &ldquo;{leave.reason || 'Keperluan mendesak karyawan'}&rdquo;
                            </p>
                          </div>

                          {/* Baris Tombol Aksi Langsung Cuti */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                            {/* Tombol Merah: Tolak Cuti */}
                            <button
                              type="button"
                              onClick={() => handleRejectLeave(leave)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                                isLight
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300'
                                  : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-500/40'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              <span>Tolak</span>
                            </button>

                            {/* Tombol Hijau: ACC Cuti */}
                            <button
                              type="button"
                              onClick={() => handleApproveLeave(leave)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow-emerald-500/20"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>ACC Cuti</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* MODAL POPUP RINGKAS: RINCIAN ITEM PO                        */}
        {/* ============================================================ */}
        {selectedPODetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div
              className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-slate-100'
              }`}
            >
              {/* Header Modal */}
              <div
                className={`p-4 border-b flex items-center justify-between ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <span>Rincian Item Purchase Order</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold">
                        {selectedPODetail.po_number}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Otorisasi Pengadaan Nilai Tinggi &gt; Rp 20.000.000
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPODetail(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Modal: Detail Supplier & Tabel Item */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
                {/* Info Bar */}
                <div
                  className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl border text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-slate-800'
                  }`}
                >
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Supplier</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                      {selectedPODetail.supplier_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Tanggal Pengajuan</div>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedPODetail.date || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Term Pembayaran</div>
                    <div className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      {selectedPODetail.payment_term || 'Tempo 30 Hari'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Tagihan</div>
                    <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatRupiah(selectedPODetail.total_amount)}
                    </div>
                  </div>
                </div>

                {/* Catatan PO */}
                {selectedPODetail.notes && (
                  <div
                    className={`p-2.5 rounded-lg text-xs border flex items-start gap-2 ${
                      isLight ? 'bg-amber-50/80 border-amber-200 text-amber-900' : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    }`}
                  >
                    <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Catatan Pengadaan: </span>
                      <span>{selectedPODetail.notes}</span>
                    </div>
                  </div>
                )}

                {/* Tabel Item PO */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead
                      className={`font-bold border-b ${
                        isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#0d1117] border-slate-800 text-slate-300'
                      }`}
                    >
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Nama Produk / Item</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Harga Satuan (Cost)</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {selectedPODetail.item_details && selectedPODetail.item_details.length > 0 ? (
                        selectedPODetail.item_details.map((item, idx) => (
                          <tr
                            key={`item-detail-${item.product_id || idx}`}
                            className={
                              isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1f242c]'
                            }
                          >
                            <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {item.product_name}
                              </div>
                              {item.product_id && (
                                <div className="text-[10px] font-mono text-slate-400">
                                  SKU: {item.product_id}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold">
                              {item.qty} {item.unit || 'unit'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                              {formatRupiah(item.unit_cost)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {formatRupiah(item.subtotal || item.qty * item.unit_cost)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 px-3 text-center text-slate-500">
                            {selectedPODetail.items || 'Rincian item pengadaan tercantum pada draf resmi.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot
                      className={`font-bold border-t ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-slate-800'
                      }`}
                    >
                      {selectedPODetail.include_ppn && selectedPODetail.ppn_amount && (
                        <tr>
                          <td colSpan={4} className="py-2 px-3 text-right text-slate-500 text-[11px]">
                            PPN ({selectedPODetail.ppn_rate || 11}%):
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {formatRupiah(selectedPODetail.ppn_amount)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider text-xs font-black">
                          Grand Total PO:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(selectedPODetail.total_amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Footer Modal: Tombol Aksi */}
              <div
                className={`p-4 border-t flex items-center justify-between gap-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedPODetail(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isLight
                      ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'bg-[#21262d] border border-[#30363d] text-slate-300 hover:bg-[#30363d]'
                  }`}
                >
                  Tutup Rincian
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRejectPO(selectedPODetail)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Tolak PO</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApprovePO(selectedPODetail)}
                    className="px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm hover:shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Setujui &amp; Terbitkan ke Supplier</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Kasus 2: Semua antrean operasional aman / telah disetujui (Total Urgent Items === 0)
  return (
    <div
      id="urgent-action-banner"
      className={`w-full rounded-2xl p-4 sm:p-4.5 border border-emerald-300 dark:border-emerald-800 transition-all duration-300 relative overflow-hidden ${
        isLight
          ? 'bg-emerald-50/90 text-emerald-950 shadow-sm'
          : 'bg-emerald-950/25 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl border shrink-0 ${
              isLight
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>

          <div>
            <h4
              className={`text-sm sm:text-base font-black tracking-tight flex items-center gap-1.5 ${
                isLight ? 'text-emerald-900' : 'text-white'
              }`}
            >
              <span>✓ Semua Antrean Operasional Telah Disetujui (No Blocking Bottlenecks)</span>
            </h4>
            <p className="text-emerald-950 font-medium text-xs dark:text-emerald-200 mt-0.5">
              {isEn
                ? 'All purchase orders, cashier shelves, employee shift leaves, and promotion rules are in verified state without blockers.'
                : 'Seluruh pengajuan Purchase Order, stok etalase, jadwal shift staf, dan otorisasi promo dalam kondisi aman dan tersinkronisasi.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
              isLight
                ? 'bg-white border-emerald-200 text-emerald-800'
                : 'bg-[#0d1117] border-emerald-500/40 text-emerald-300'
            }`}
          >
            Sistem Lancar 100%
          </span>
        </div>
      </div>
    </div>
  );
};
