import React, { useMemo, useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Tag,
  MapPin,
  Printer,
  ArrowRight,
  Copy,
  MessageCircle,
  Wallet,
  CreditCard,
  QrCode,
  Banknote,
  Shirt,
  Sparkles,
  PackageCheck,
  AlertTriangle,
  Plus,
  X,
  RotateCcw,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  LaundryOrderRecord,
  LaundryProductionStatus,
  Sale,
} from '../../types';
import {
  extractLaundryOrderMetrics,
  isLaundryProductionEmployee,
} from '../../utils/laundryCommission';

interface LaundryTrackingBoardProps {
  onBackToOrder: () => void;
}

type StageFilter = 'ALL' | LaundryProductionStatus | 'UNPAID';

const STAGES: {
  id: LaundryProductionStatus;
  label: string;
  shortLabel: string;
  accentLight: string;
  accentDark: string;
  badgeClass: string;
}[] = [
  {
    id: 'DITERIMA',
    label: '1. Diterima',
    shortLabel: 'Diterima',
    accentLight: 'border-sky-300 bg-sky-50/70',
    accentDark: 'border-sky-500/35 bg-sky-950/20',
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/35',
  },
  {
    id: 'CUCI',
    label: '2. Proses Cuci',
    shortLabel: 'Cuci',
    accentLight: 'border-cyan-300 bg-cyan-50/70',
    accentDark: 'border-cyan-500/35 bg-cyan-950/20',
    badgeClass: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/35',
  },
  {
    id: 'SETRIKA',
    label: '3. Setrika & Lipat',
    shortLabel: 'Setrika',
    accentLight: 'border-indigo-300 bg-indigo-50/70',
    accentDark: 'border-indigo-500/35 bg-indigo-950/20',
    badgeClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/35',
  },
  {
    id: 'SIAP_AMBIL',
    label: '4. Siap Ambil (Rak)',
    shortLabel: 'Siap Ambil',
    accentLight: 'border-amber-300 bg-amber-50/70',
    accentDark: 'border-amber-500/35 bg-amber-950/20',
    badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/35',
  },
  {
    id: 'DIAMBIL',
    label: '5. Selesai / Diambil',
    shortLabel: 'Diambil',
    accentLight: 'border-emerald-300 bg-emerald-50/70',
    accentDark: 'border-emerald-500/35 bg-emerald-950/20',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35',
  },
];

const QUICK_RACK_PRESETS = ['RAK-A1', 'RAK-A2', 'RAK-B1', 'RAK-B2', 'RAK-C1', 'GANTUNG-01'];

const formatDateShortId = (isoStr?: string): string => {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} ${hours}:${mins}`;
  } catch {
    return isoStr;
  }
};

const normalizeWaPhone = (phone?: string): string => {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits || digits.length < 8) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
};

export const LaundryTrackingBoard: React.FC<LaundryTrackingBoardProps> = ({
  onBackToOrder,
}) => {
  const {
    laundryOrders,
    updateLaundryOrderStatus,
    settleLaundryOrderPayment,
    showReceipt,
    sales,
    employees,
    showToast,
    businessProfile,
    activeTerminal,
    theme,
  } = useApp();

  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('ALL');
  const [rackDrafts, setRackDrafts] = useState<Record<string, string>>({});
  const [editingRackOrderId, setEditingRackOrderId] = useState<string | null>(null);
  const [settleTargetOrder, setSettleTargetOrder] = useState<LaundryOrderRecord | null>(null);
  const [settleMethod, setSettleMethod] = useState<'Tunai' | 'QRIS' | 'Debit'>('Tunai');
  const [settleCashGiven, setSettleCashGiven] = useState<number>(0);

  const laundryStaffOptions = useMemo(() => {
    const activeStaff = (employees || []).filter((e) => e.status !== 'Inactive');
    return [...activeStaff].sort((a, b) => {
      const aLnd = isLaundryProductionEmployee(a) ? 0 : 1;
      const bLnd = isLaundryProductionEmployee(b) ? 0 : 1;
      if (aLnd !== bLnd) return aLnd - bLnd;
      return a.name.localeCompare(b.name);
    });
  }, [employees]);

  const summaryCounts = useMemo(() => {
    const counts = {
      totalActive: 0,
      DITERIMA: 0,
      CUCI: 0,
      SETRIKA: 0,
      SIAP_AMBIL: 0,
      DIAMBIL: 0,
      unpaidCount: 0,
      unpaidAmount: 0,
    };
    for (const o of laundryOrders) {
      counts[o.productionStatus] = (counts[o.productionStatus] || 0) + 1;
      if (o.productionStatus !== 'DIAMBIL') counts.totalActive += 1;
      if ((o.remainingAmount || 0) > 0) {
        counts.unpaidCount += 1;
        counts.unpaidAmount += Number(o.remainingAmount) || 0;
      }
    }
    return counts;
  }, [laundryOrders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return laundryOrders.filter((o) => {
      if (stageFilter === 'UNPAID' && (o.remainingAmount || 0) <= 0) return false;
      if (
        stageFilter !== 'ALL' &&
        stageFilter !== 'UNPAID' &&
        o.productionStatus !== stageFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.tagCode.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerPhone || '').toLowerCase().includes(q) ||
        (o.rackNumber || '').toLowerCase().includes(q) ||
        o.itemsSummary.toLowerCase().includes(q)
      );
    });
  }, [laundryOrders, stageFilter, searchQuery]);

  const visibleStages = useMemo(() => {
    if (stageFilter === 'ALL' || stageFilter === 'UNPAID') return STAGES;
    return STAGES.filter((s) => s.id === stageFilter);
  }, [stageFilter]);

  const handleOpenReceiptAndTag = (order: LaundryOrderRecord) => {
    const matchedSale = sales.find(
      (s) =>
        (order.transactionId && s.transaction_id === order.transactionId) ||
        s.receipt_number === order.orderNumber
    );
    if (matchedSale) {
      showReceipt({
        ...matchedSale,
        isLaundryOrder: true,
        laundryTotalPieces: matchedSale.laundryTotalPieces ?? order.totalPieces,
        laundryConditionNotes: matchedSale.laundryConditionNotes ?? order.conditionNotes,
        laundryEstimatedDoneAt: matchedSale.laundryEstimatedDoneAt ?? order.estimatedDoneAt,
        laundrySlaLabel: matchedSale.laundrySlaLabel ?? order.slaLabel,
        laundrySlaHours: matchedSale.laundrySlaHours ?? order.slaHours,
        laundryPaymentStatus: matchedSale.laundryPaymentStatus ?? order.paymentStatus,
        laundryBagTagCode: matchedSale.laundryBagTagCode ?? order.tagCode,
        laundryRackNumber: matchedSale.laundryRackNumber ?? order.rackNumber,
        amount_paid: order.paidAmount,
        remainingBalance: order.remainingAmount,
      });
      return;
    }

    const fallbackSale: Sale = {
      transaction_id: order.transactionId || order.orderNumber,
      receipt_number: order.orderNumber,
      date: order.createdAt,
      created_at: order.createdAt,
      cashier_id: 'CASHIER-LAUNDRY',
      cashier_name: order.handledBy || 'Kasir Laundry',
      terminal_name: activeTerminal?.name || order.stationCode || 'POS-01 Laundry',
      stationCode: order.stationCode || 'POS-01',
      items_summary: order.itemsSummary,
      subtotal: order.totalAmount,
      discount: 0,
      total_amount: order.totalAmount,
      payment_method: (order.paymentMethod as any) || 'CASH',
      amount_paid: order.paidAmount,
      change_amount: 0,
      status: 'COMPLETED',
      items: order.items || [],
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      dpAmount: order.paymentStatus === 'DP' ? order.paidAmount : undefined,
      remainingBalance: order.remainingAmount,
      isLaundryOrder: true,
      laundryTotalPieces: order.totalPieces,
      laundryConditionNotes: order.conditionNotes,
      laundryEstimatedDoneAt: order.estimatedDoneAt,
      laundrySlaLabel: order.slaLabel,
      laundrySlaHours: order.slaHours,
      laundryPaymentStatus: order.paymentStatus,
      laundryBagTagCode: order.tagCode,
      laundryRackNumber: order.rackNumber,
    };
    showReceipt(fallbackSale);
  };

  const buildLaundryWaText = (order: LaundryOrderRecord): string => {
    const storeName =
      businessProfile?.name || businessProfile?.companyName || 'Outlet Laundry';
    const estDoneLabel = formatDateShortId(order.estimatedDoneAt);

    let stageStatusText = '';
    switch (order.productionStatus) {
      case 'DITERIMA':
        stageStatusText = `Sudah kami terima & masuk antrean proses (Est. selesai ${estDoneLabel})`;
        break;
      case 'CUCI':
        stageStatusText = `Sedang dalam proses pencucian (Est. selesai ${estDoneLabel})`;
        break;
      case 'SETRIKA':
        stageStatusText = `Sedang dalam tahap setrika & packing (Est. selesai ${estDoneLabel})`;
        break;
      case 'SIAP_AMBIL':
        stageStatusText = order.rackNumber
          ? `Sudah selesai dipacking & siap diambil di *${order.rackNumber}*`
          : 'Sudah selesai dipacking & siap diambil di konter';
        break;
      case 'DIAMBIL':
        stageStatusText = `Sudah selesai & telah diambil (${formatDateShortId(
          order.pickedUpAt || order.updatedAt
        )})`;
        break;
      default:
        stageStatusText = order.productionStatus;
    }

    const itemLines =
      order.items && order.items.length > 0
        ? order.items
            .map((it) => {
              const unit = it.selectedUnit || it.product?.unit || 'unit';
              const dimText =
                it.laundryLengthM && it.laundryWidthM
                  ? ` [${it.laundryLengthM}×${it.laundryWidthM}m]`
                  : '';
              return `  - ${it.product?.name || 'Layanan'} (${it.quantity} ${unit}${dimText}) • Rp ${(
                it.subtotal || 0
              ).toLocaleString('id-ID')}`;
            })
            .join('\n')
        : `  - ${order.itemsSummary}`;

    const paymentLines =
      order.remainingAmount > 0
        ? `• *Status Pembayaran:* ${
            order.paymentStatus === 'DP'
              ? `DP (Terbayar Rp ${order.paidAmount.toLocaleString('id-ID')})`
              : 'Bayar Saat Ambil'
          }\n• *Sisa Tagihan (Dilunasi Saat Ambil):* *Rp ${order.remainingAmount.toLocaleString(
            'id-ID'
          )}*`
        : `• *Status Pembayaran:* *LUNAS* (Rp ${order.totalAmount.toLocaleString(
            'id-ID'
          )})`;

    return (
      `Halo Kak *${order.customerName}*,\n` +
      `Berikut konfirmasi cucian Anda di *${storeName}*:\n\n` +
      `• *No. Tag & Invoice:* ${order.tagCode} / ${order.orderNumber}\n` +
      `• *Status Cucian:* ${stageStatusText}\n` +
      `• *Jumlah Fisik:* ${order.totalPieces} Pcs\n` +
      `• *Estimasi Selesai:* ${estDoneLabel}\n\n` +
      `*Rincian Item:*\n${itemLines}\n\n` +
      `• *Total Order:* Rp ${order.totalAmount.toLocaleString('id-ID')}\n` +
      `${paymentLines}\n\n` +
      `Terima kasih telah mempercayakan cucian Anda di *${storeName}*.`
    );
  };

  const handleCopyWaMessage = (order: LaundryOrderRecord) => {
    const msg = buildLaundryWaText(order);
    navigator.clipboard.writeText(msg);
    showToast(`Pesan konfirmasi WA untuk ${order.customerName} disalin!`);
  };

  const handleAdvanceToSiapAmbil = (order: LaundryOrderRecord) => {
    const draftRack = (rackDrafts[order.id] ?? order.rackNumber ?? '').trim().toUpperCase();
    const resolvedRack = draftRack || 'RAK-A1';
    updateLaundryOrderStatus(order.id, 'SIAP_AMBIL', { rackNumber: resolvedRack });
    setRackDrafts((prev) => ({ ...prev, [order.id]: resolvedRack }));
  };

  const handleSaveRackEdit = (order: LaundryOrderRecord) => {
    const nextRack = (rackDrafts[order.id] ?? order.rackNumber ?? '').trim().toUpperCase();
    if (!nextRack) {
      showToast('Masukkan nomor rak terlebih dahulu, misal RAK-A1.', 'warning');
      return;
    }
    updateLaundryOrderStatus(order.id, order.productionStatus, { rackNumber: nextRack });
    setEditingRackOrderId(null);
  };

  const handleOpenSettleModal = (order: LaundryOrderRecord) => {
    setSettleTargetOrder(order);
    setSettleMethod('Tunai');
    setSettleCashGiven(order.remainingAmount);
  };

  const handleConfirmSettlement = () => {
    if (!settleTargetOrder) return;
    if (settleMethod === 'Tunai' && settleCashGiven < settleTargetOrder.remainingAmount) {
      showToast('Nominal tunai diterima masih kurang dari sisa tagihan!', 'warning');
      return;
    }
    settleLaundryOrderPayment(
      settleTargetOrder.id,
      settleMethod,
      settleTargetOrder.rackNumber,
      true
    );
    setSettleTargetOrder(null);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
      {/* KPI & Filter Strip */}
      <div
        className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 shrink-0 ${
          isLight
            ? 'bg-white border-cyan-500/40 text-slate-900 shadow-xs'
            : 'bg-slate-900 border-cyan-500/30 text-white'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBackToOrder}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Order Baru</span>
          </button>

          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                { id: 'ALL' as StageFilter, label: `Semua (${laundryOrders.length})` },
                { id: 'DITERIMA' as StageFilter, label: `Diterima (${summaryCounts.DITERIMA})` },
                { id: 'CUCI' as StageFilter, label: `Cuci (${summaryCounts.CUCI})` },
                { id: 'SETRIKA' as StageFilter, label: `Setrika (${summaryCounts.SETRIKA})` },
                { id: 'SIAP_AMBIL' as StageFilter, label: `Siap Ambil (${summaryCounts.SIAP_AMBIL})` },
                { id: 'DIAMBIL' as StageFilter, label: `Diambil (${summaryCounts.DIAMBIL})` },
                {
                  id: 'UNPAID' as StageFilter,
                  label: `Belum Lunas (${summaryCounts.unpaidCount})`,
                },
              ]
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStageFilter(pill.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition ${
                  stageFilter === pill.id
                    ? pill.id === 'UNPAID'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-cyan-600 text-white border-cyan-500'
                    : isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {summaryCounts.unpaidAmount > 0 && (
            <div className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-700 dark:text-amber-300 text-[11px] font-mono font-semibold">
              Piutang Cucian: Rp {summaryCounts.unpaidAmount.toLocaleString('id-ID')}
            </div>
          )}
          <div className="relative w-56 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Tag / Nama / No. WA / Rak..."
              className={`w-full pl-8 pr-7 py-1.5 rounded-lg border text-xs outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                  : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Production Kanban Board */}
      <div className="flex-1 min-h-0 overflow-auto pb-1">
        <div
          className={`grid gap-2.5 h-full min-h-[420px] ${
            visibleStages.length === 1
              ? 'grid-cols-1 max-w-2xl'
              : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-5'
          }`}
        >
          {visibleStages.map((stage) => {
            const stageOrders = filteredOrders.filter(
              (o) => o.productionStatus === stage.id
            );
            return (
              <div
                key={stage.id}
                className={`rounded-xl border flex flex-col min-h-[360px] max-h-full overflow-hidden ${
                  isLight ? stage.accentLight : stage.accentDark
                }`}
              >
                {/* Column Header */}
                <div
                  className={`px-3 py-2 border-b flex items-center justify-between gap-2 shrink-0 ${
                    isLight
                      ? 'bg-white/80 border-slate-200'
                      : 'bg-slate-950/75 border-slate-800'
                  }`}
                >
                  <span className="text-xs font-bold tracking-tight">
                    {stage.label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${stage.badgeClass}`}
                  >
                    {stageOrders.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {stageOrders.length === 0 ? (
                    <div className="h-28 flex flex-col items-center justify-center text-center text-[11px] text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3">
                      <Shirt className="w-5 h-5 opacity-40 mb-1" />
                      <span>Belum ada cucian di tahap {stage.shortLabel}</span>
                    </div>
                  ) : (
                    stageOrders.map((order) => {
                      const isOverdue =
                        order.productionStatus !== 'DIAMBIL' &&
                        new Date(order.estimatedDoneAt).getTime() < Date.now();
                      const waPhoneClean = normalizeWaPhone(order.customerPhone);
                      const waHref = waPhoneClean
                        ? `https://wa.me/${waPhoneClean}?text=${encodeURIComponent(
                            buildLaundryWaText(order)
                          )}`
                        : '';
                      const rackDraftVal =
                        rackDrafts[order.id] ?? order.rackNumber ?? '';
                      const orderVol = extractLaundryOrderMetrics(order);
                      const showSpecialistPicker =
                        orderVol.hasSpecialistItems || Boolean(order.specialistEmployeeId);

                      return (
                        <div
                          key={order.id}
                          className={`p-2.5 rounded-xl border space-y-2 transition-all ${
                            isLight
                              ? 'bg-white border-slate-200 shadow-xs hover:border-cyan-400'
                              : 'bg-slate-900/95 border-slate-800 hover:border-cyan-500/40'
                          }`}
                        >
                          {/* Top Row: Tag Code & Payment Pill */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="px-1.5 py-0.5 rounded bg-cyan-600 text-white font-mono text-[10px] font-bold flex items-center gap-1">
                                  <Tag className="w-2.5 h-2.5" />
                                  {order.tagCode}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 truncate">
                                  {order.orderNumber}
                                </span>
                              </div>
                              <div className="text-xs font-bold mt-1 truncate">
                                {order.customerName}
                              </div>
                              {order.customerPhone && (
                                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                  📱 {order.customerPhone}
                                </div>
                              )}
                            </div>

                            <div className="text-right shrink-0 space-y-1">
                              {order.remainingAmount <= 0 ? (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35">
                                  LUNAS
                                </span>
                              ) : order.paymentStatus === 'DP' ? (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/40">
                                  DP • Sisa {(order.remainingAmount / 1000).toFixed(0)}rb
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/40">
                                  BAYAR AMBIL
                                </span>
                              )}
                              <div className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                Rp {order.totalAmount.toLocaleString('id-ID')}
                              </div>
                            </div>
                          </div>

                          {/* Mix-up Prevention Meta: Total Pcs, Condition Notes & SLA */}
                          <div
                            className={`p-2 rounded-lg border text-[10px] space-y-1 ${
                              isLight
                                ? 'bg-slate-50 border-slate-200 text-slate-700'
                                : 'bg-slate-950/70 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                                👕 {order.totalPieces} Pcs Fisik
                              </span>
                              <span
                                className={`font-mono px-1.5 py-0.5 rounded border text-[9px] flex items-center gap-1 ${
                                  isOverdue
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/40 font-bold'
                                    : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                                }`}
                              >
                                <Clock className="w-2.5 h-2.5" />
                                {formatDateShortId(order.estimatedDoneAt)}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-2">
                              {order.itemsSummary}
                            </div>
                            {order.conditionNotes && order.conditionNotes !== '-' && (
                              <div className="px-1.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[10px] flex items-start gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                <span className="leading-tight">{order.conditionNotes}</span>
                              </div>
                            )}
                            {order.remainingAmount > 0 && (
                              <div className="flex items-center justify-between pt-0.5 border-t border-slate-200/80 dark:border-slate-800 text-[10px] font-mono">
                                <span>DP: Rp {order.paidAmount.toLocaleString('id-ID')}</span>
                                <span className="font-bold text-rose-600 dark:text-rose-400">
                                  Sisa: Rp {order.remainingAmount.toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Operator Produksi & Komisi Staf (Non-Blocking) */}
                          <div
                            className={`p-2 rounded-lg border text-[10px] space-y-1.5 ${
                              isLight
                                ? 'bg-indigo-50/40 border-indigo-200/80 text-slate-700'
                                : 'bg-slate-950/60 border-indigo-500/25 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 text-[9px] font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-300 font-semibold">
                              <span className="flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                <span>Petugas Produksi (Komisi HR)</span>
                              </span>
                              {orderVol.kiloanKg > 0 && (
                                <span className="text-cyan-700 dark:text-cyan-300">
                                  {orderVol.kiloanKg} kg
                                </span>
                              )}
                            </div>

                            {order.productionStatus === 'DIAMBIL' ? (
                              <div className="flex flex-wrap gap-1 text-[9px] font-mono">
                                <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-700 dark:text-cyan-300">
                                  Cuci: {order.washerEmployeeName || '-'}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300">
                                  Setrika: {order.ironerEmployeeName || '-'}
                                </span>
                                {showSpecialistPicker && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300">
                                    Teknisi: {order.specialistEmployeeName || '-'}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <span className="block text-[9px] text-slate-500 dark:text-slate-400 mb-0.5">
                                    Op. Cuci
                                  </span>
                                  <select
                                    value={order.washerEmployeeId || ''}
                                    onChange={(e) => {
                                      const emp = laundryStaffOptions.find(
                                        (x) => x.id === e.target.value
                                      );
                                      updateLaundryOrderStatus(order.id, order.productionStatus, {
                                        washerEmployeeId: emp?.id || '',
                                        washerEmployeeName: emp?.name || '',
                                      });
                                    }}
                                    aria-label="Pilih Operator Cuci"
                                    className={`w-full px-1.5 py-1 rounded border text-[10px] outline-none cursor-pointer ${
                                      isLight
                                        ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                                        : 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500'
                                    }`}
                                  >
                                    <option value="">-- Belum Pilih --</option>
                                    {laundryStaffOptions.map((emp) => (
                                      <option key={emp.id} value={emp.id}>
                                        {emp.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <span className="block text-[9px] text-slate-500 dark:text-slate-400 mb-0.5">
                                    Op. Setrika
                                  </span>
                                  <select
                                    value={order.ironerEmployeeId || ''}
                                    onChange={(e) => {
                                      const emp = laundryStaffOptions.find(
                                        (x) => x.id === e.target.value
                                      );
                                      updateLaundryOrderStatus(order.id, order.productionStatus, {
                                        ironerEmployeeId: emp?.id || '',
                                        ironerEmployeeName: emp?.name || '',
                                      });
                                    }}
                                    aria-label="Pilih Operator Setrika"
                                    className={`w-full px-1.5 py-1 rounded border text-[10px] outline-none cursor-pointer ${
                                      isLight
                                        ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                                        : 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500'
                                    }`}
                                  >
                                    <option value="">-- Belum Pilih --</option>
                                    {laundryStaffOptions.map((emp) => (
                                      <option key={emp.id} value={emp.id}>
                                        {emp.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {showSpecialistPicker && (
                                  <div className="col-span-2">
                                    <span className="flex items-center gap-1 text-[9px] text-amber-700 dark:text-amber-300 mb-0.5">
                                      <Wrench className="w-2.5 h-2.5" />
                                      <span>Teknisi Sepatu / Karpet</span>
                                    </span>
                                    <select
                                      value={order.specialistEmployeeId || ''}
                                      onChange={(e) => {
                                        const emp = laundryStaffOptions.find(
                                          (x) => x.id === e.target.value
                                        );
                                        updateLaundryOrderStatus(order.id, order.productionStatus, {
                                          specialistEmployeeId: emp?.id || '',
                                          specialistEmployeeName: emp?.name || '',
                                        });
                                      }}
                                      aria-label="Pilih Teknisi Sepatu atau Karpet"
                                      className={`w-full px-1.5 py-1 rounded border text-[10px] outline-none cursor-pointer ${
                                        isLight
                                          ? 'bg-white border-amber-300 text-slate-900 focus:border-amber-500'
                                          : 'bg-slate-900 border-amber-500/40 text-white focus:border-amber-400'
                                      }`}
                                    >
                                      <option value="">-- Belum Pilih Teknisi --</option>
                                      {laundryStaffOptions.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                          {emp.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Rack Input / Badge */}
                          {(order.productionStatus === 'SETRIKA' ||
                            order.rackNumber ||
                            editingRackOrderId === order.id) && (
                            <div className="space-y-1">
                              {order.productionStatus === 'SETRIKA' ||
                              editingRackOrderId === order.id ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <input
                                      type="text"
                                      value={rackDraftVal}
                                      onChange={(e) =>
                                        setRackDrafts((prev) => ({
                                          ...prev,
                                          [order.id]: e.target.value.toUpperCase(),
                                        }))
                                      }
                                      placeholder="Nomor Rak (mis. RAK-A1)"
                                      className={`flex-1 min-w-0 px-2 py-1 rounded-md border text-[11px] font-mono font-semibold uppercase outline-none ${
                                        isLight
                                          ? 'bg-white border-amber-300 text-slate-900 focus:border-amber-500'
                                          : 'bg-slate-950 border-amber-500/40 text-white focus:border-amber-400'
                                      }`}
                                    />
                                    {editingRackOrderId === order.id && (
                                      <button
                                        type="button"
                                        onClick={() => handleSaveRackEdit(order)}
                                        className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold cursor-pointer"
                                      >
                                        Simpan
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {QUICK_RACK_PRESETS.slice(0, 4).map((preset) => (
                                      <button
                                        key={preset}
                                        type="button"
                                        onClick={() =>
                                          setRackDrafts((prev) => ({
                                            ...prev,
                                            [order.id]: preset,
                                          }))
                                        }
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono border cursor-pointer ${
                                          rackDraftVal === preset
                                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                                            : isLight
                                            ? 'bg-slate-100 border-slate-300 text-slate-700'
                                            : 'bg-slate-800 border-slate-700 text-slate-300'
                                        }`}
                                      >
                                        {preset}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-[11px] font-mono font-bold">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>Lokasi: {order.rackNumber}</span>
                                  </span>
                                  {order.productionStatus !== 'DIAMBIL' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRackDrafts((prev) => ({
                                          ...prev,
                                          [order.id]: order.rackNumber || '',
                                        }));
                                        setEditingRackOrderId(order.id);
                                      }}
                                      className="text-[10px] underline font-sans font-normal cursor-pointer"
                                    >
                                      Ubah Rak
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Stage Actions Footer */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/70 dark:border-slate-800">
                            {order.productionStatus === 'DITERIMA' && (
                              <button
                                type="button"
                                onClick={() => updateLaundryOrderStatus(order.id, 'CUCI')}
                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Mulai Cuci →</span>
                              </button>
                            )}

                            {order.productionStatus === 'CUCI' && (
                              <button
                                type="button"
                                onClick={() => updateLaundryOrderStatus(order.id, 'SETRIKA')}
                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition"
                              >
                                <ArrowRight className="w-3 h-3" />
                                <span>Lanjut Setrika →</span>
                              </button>
                            )}

                            {order.productionStatus === 'SETRIKA' && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceToSiapAmbil(order)}
                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                <span>Siap Ambil + Rak →</span>
                              </button>
                            )}

                            {order.productionStatus === 'SIAP_AMBIL' && (
                              <>
                                {order.remainingAmount > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSettleModal(order)}
                                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                                  >
                                    <Wallet className="w-3.5 h-3.5" />
                                    <span>Pelunasan &amp; Ambil</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => updateLaundryOrderStatus(order.id, 'DIAMBIL')}
                                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Serahkan (Diambil)</span>
                                  </button>
                                )}
                              </>
                            )}

                            {order.productionStatus === 'DIAMBIL' && (
                              <div className="flex-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Diambil {formatDateShortId(order.pickedUpAt || order.updatedAt)}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenReceiptAndTag(order)}
                                className={`py-1.5 px-2 rounded-lg border text-[10px] font-medium flex items-center gap-1 cursor-pointer transition ${
                                  isLight
                                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                                }`}
                                title="Cetak Ulang Struk & Tag Kantong Cucian"
                              >
                                <Printer className="w-3.5 h-3.5 text-cyan-500" />
                                <span>Tag</span>
                              </button>

                              {waHref ? (
                                <a
                                  href={waHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() =>
                                    showToast(
                                      `Membuka WhatsApp untuk ${order.customerName} (+${waPhoneClean})`,
                                      'success'
                                    )
                                  }
                                  className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-xs transition active:scale-[0.98]"
                                  title={`Kirim konfirmasi WA ke +${waPhoneClean}`}
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>Kirim WA</span>
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="py-1.5 px-2 rounded-lg bg-emerald-600/20 text-emerald-700/60 dark:text-emerald-300/50 border border-emerald-500/25 text-[10px] font-semibold flex items-center gap-1 opacity-55 cursor-not-allowed"
                                  title="No. WhatsApp pelanggan belum diisi"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>Kirim WA</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleCopyWaMessage(order)}
                                className={`p-1.5 rounded-lg border cursor-pointer transition ${
                                  isLight
                                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600'
                                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                                }`}
                                title="Salin teks konfirmasi WA"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>

                            {order.productionStatus !== 'DITERIMA' &&
                              order.productionStatus !== 'DIAMBIL' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const prevMap: Record<LaundryProductionStatus, LaundryProductionStatus> = {
                                      DITERIMA: 'DITERIMA',
                                      CUCI: 'DITERIMA',
                                      SETRIKA: 'CUCI',
                                      SIAP_AMBIL: 'SETRIKA',
                                      DIAMBIL: 'SIAP_AMBIL',
                                    };
                                    updateLaundryOrderStatus(order.id, prevMap[order.productionStatus]);
                                  }}
                                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-amber-500 cursor-pointer"
                                  title="Kembalikan ke tahap sebelumnya"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Pelunasan Sisa Tagihan saat Pengambilan Cucian */}
      {settleTargetOrder && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setSettleTargetOrder(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border p-5 space-y-4 shadow-2xl ${
              isLight
                ? 'bg-white border-cyan-500/60 text-slate-900'
                : 'bg-slate-900 border-cyan-500/40 text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  <span>Pelunasan &amp; Pengambilan Cucian</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {settleTargetOrder.tagCode} • {settleTargetOrder.orderNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettleTargetOrder(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className={`p-3 rounded-xl border space-y-1.5 text-xs ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan</span>
                <span className="font-bold">
                  {settleTargetOrder.customerName}
                  {settleTargetOrder.rackNumber ? ` • ${settleTargetOrder.rackNumber}` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Tagihan Order</span>
                <span className="font-mono">
                  Rp {settleTargetOrder.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sudah Dibayar (DP)</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  -Rp {settleTargetOrder.paidAmount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-800 text-sm font-bold">
                <span>Sisa Pelunasan</span>
                <span className="font-mono text-rose-600 dark:text-rose-400">
                  Rp {settleTargetOrder.remainingAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block">
                Metode Pelunasan
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'Tunai', label: 'Tunai', icon: Banknote },
                    { id: 'QRIS', label: 'QRIS', icon: QrCode },
                    { id: 'Debit', label: 'Debit / EDC', icon: CreditCard },
                  ] as const
                ).map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSettleMethod(m.id)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                        settleMethod === m.id
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-700'
                          : 'bg-slate-950 border-slate-700 text-slate-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {settleMethod === 'Tunai' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Uang Diterima (Rp)</span>
                  <button
                    type="button"
                    onClick={() => setSettleCashGiven(settleTargetOrder.remainingAmount)}
                    className="text-[11px] text-cyan-600 dark:text-cyan-400 underline cursor-pointer"
                  >
                    Uang Pas
                  </button>
                </div>
                <input
                  type="number"
                  min={0}
                  value={settleCashGiven || ''}
                  onChange={(e) => setSettleCashGiven(Number(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-xl border font-mono font-bold text-sm outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                      : 'bg-slate-950 border-slate-700 text-white focus:border-emerald-500'
                  }`}
                />
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500">Kembalian:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Rp {Math.max(0, settleCashGiven - settleTargetOrder.remainingAmount).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSettleTargetOrder(null)}
                className={`py-2.5 rounded-xl border text-xs font-medium cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSettlement}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lunas &amp; Serahkan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
