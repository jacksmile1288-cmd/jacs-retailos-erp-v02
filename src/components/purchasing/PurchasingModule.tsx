import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseOrder, SupplierMaster, PurchaseOrderStatus, GoodsReceipt } from '../../types';
import { getReactiveNeonGlowStyle } from '../../utils/neonGlow';
import { OfficialPoPrintModal } from './OfficialPoPrintModal';
import { PoDetailModal } from './PoDetailModal';
import { SupplierPaymentModal } from './SupplierPaymentModal';
import { AutoPoSummaryModal } from './AutoPoSummaryModal';
import { PurchaseReturnModal } from './PurchaseReturnModal';
import { GoodsReceiptModal } from './GoodsReceiptModal';
import {
  Plus,
  ShoppingBag,
  CheckCircle,
  Clock,
  Building2,
  PackageCheck,
  X,
  FileText,
  AlertTriangle,
  Boxes,
  Layers,
  ArrowRight,
  Zap,
  CheckCircle2,
  XCircle,
  FilePlus2,
  Truck,
  ClipboardCheck,
  AlertCircle,
  Inbox,
  RotateCcw,
  Printer,
  Search,
  Filter,
  CreditCard,
  DollarSign,
  Calendar,
  Check,
  Eye,
  Trash2,
  Send,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';

export const PurchasingModule: React.FC = () => {
  const {
    purchasing,
    purchaseRequests,
    setPurchaseRequests,
    products,
    suppliers,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    updatePurchaseOrderPayment,
    deletePurchaseOrder,
    createAutoReorderPO,
    reorderAllLowStock,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    purchaseReturns,
    createPurchaseReturn,
    goodsReceipts,
    handleCreateGoodsReceipt,
    getProductAlertThreshold,
    setActiveNav,
    showToast,
    theme,
    activeNeonCards,
    setActiveNeonCard,
    language,
  } = useApp();

  const isLight = theme === 'light';
  const isEn = language === 'en';

  // Navigation & Tab States
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [activePurchasingTab, setActivePurchasingTab] = useState<'po' | 'pr' | 'gr' | 'invoices'>('po');

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGrModalOpen, setIsGrModalOpen] = useState(false);
  const [selectedPoForGr, setSelectedPoForGr] = useState<PurchaseOrder | null>(null);
  const [selectedPoForDetail, setSelectedPoForDetail] = useState<PurchaseOrder | null>(null);
  const [selectedPoForPrint, setSelectedPoForPrint] = useState<PurchaseOrder | null>(null);
  const [selectedPoForPayment, setSelectedPoForPayment] = useState<PurchaseOrder | null>(null);
  const [selectedGrForReturn, setSelectedGrForReturn] = useState<GoodsReceipt | null>(null);
  const [summaryModalPOs, setSummaryModalPOs] = useState<PurchaseOrder[] | null>(null);

  const handleReorderAll = () => {
    const res = reorderAllLowStock();
    if (res.pos && res.pos.length > 0) {
      setSummaryModalPOs(res.pos);
    }
  };

  const handleAutoReorderSingle = (p: typeof products[0]) => {
    const newPo = createAutoReorderPO(p);
    if (newPo) {
      setSummaryModalPOs([newPo]);
    }
  };

  // 2 Purchase Orders dengan status 'APPROVED' / siap diterima
  const approvedPOs = useMemo(() => {
    return purchasing.filter(
      (po) =>
        po.status === 'APPROVED' ||
        po.status === 'Approved' ||
        po.status === 'Disetujui'
    );
  }, [purchasing]);

  // Create PO Form State
  const [createSupplierId, setCreateSupplierId] = useState<string>(
    suppliers[0]?.id || 'SUPP-001'
  );
  const [createSupplierName, setCreateSupplierName] = useState<string>(
    suppliers[0]?.name || 'PT Mitra Global Teknologi'
  );
  const [createPaymentTerm, setCreatePaymentTerm] = useState<string>(
    suppliers[0]?.paymentTerms || 'Tempo 30 Hari'
  );
  const [createDueDate, setCreateDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [createIncludePpn, setCreateIncludePpn] = useState<boolean>(true);
  const [createNotes, setCreateNotes] = useState<string>('');

  // Multi-item PO line items
  const [createPoItems, setCreatePoItems] = useState<
    Array<{
      productId: string;
      productName: string;
      qty: number;
      unitCost: number;
      subtotal: number;
      unit: string;
    }>
  >(() => {
    const firstP = products[0];
    return [
      {
        productId: firstP?.id || 'PRD-001',
        productName: firstP?.name || 'Sample Product',
        qty: 10,
        unitCost: firstP?.cost_price || 500000,
        subtotal: 10 * (firstP?.cost_price || 500000),
        unit: firstP?.unit || 'Unit',
      },
    ];
  });

  // Adding product line item temporary selection
  const [tempProductId, setTempProductId] = useState<string>(products[0]?.id || '');
  const [tempQty, setTempQty] = useState<number>(10);
  const [tempUnitCost, setTempUnitCost] = useState<number>(products[0]?.cost_price || 500000);

  // Dynamic PO Pending Count for Header Badge
  const pendingPoCount = useMemo(() => {
    return purchasing.filter(
      (p) =>
        p.status === 'Draft' ||
        p.status === 'Menunggu Approval Direksi' ||
        p.status === 'Menunggu Approval Pimpinan' ||
        p.status === 'PENDING APPROVAL' ||
        p.status === 'Pending Approval' ||
        p.status === 'Disetujui (Approved)' ||
        p.status === 'Disetujui' ||
        p.status === 'Approved' ||
        p.status === 'Dipesan' ||
        p.status === 'SENT_TO_VENDOR' ||
        p.status === 'Sent' ||
        p.status === 'PARTIALLY_RECEIVED'
    ).length;
  }, [purchasing]);

  // Invoice AP Monitoring Metrics
  const invoiceMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    let unpaidTotal = 0;
    let unpaidCount = 0;
    let overdueTotal = 0;
    let overdueCount = 0;
    let paidTotal = 0;
    let paidCount = 0;

    purchasing.forEach((po) => {
      const isPaid = po.payment_status === 'Lunas' || po.payment_status === 'PAID';
      const isOverdue =
        po.payment_status === 'Jatuh Tempo' ||
        (!isPaid && po.due_date && po.due_date < todayStr);
      const returnAmount = po.return_amount || 0;
      const netPayable = Math.max(0, po.total_amount - returnAmount);

      if (isPaid) {
        paidTotal += netPayable;
        paidCount += 1;
      } else if (isOverdue) {
        overdueTotal += netPayable;
        overdueCount += 1;
      } else {
        unpaidTotal += netPayable;
        unpaidCount += 1;
      }
    });

    return {
      unpaidTotal,
      unpaidCount,
      overdueTotal,
      overdueCount,
      paidTotal,
      paidCount,
    };
  }, [purchasing]);

  // Total PO Value & Pending Approval
  const totalPoValue = useMemo(() => {
    return purchasing.reduce((acc, p) => acc + p.total_amount, 0);
  }, [purchasing]);

  const pendingApprovalCount = useMemo(() => {
    return purchasing.filter(
      (p) =>
        p.status === 'PENDING APPROVAL' ||
        p.status === 'Pending Approval' ||
        p.status === 'Menunggu Approval Pimpinan'
    ).length;
  }, [purchasing]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => getProductAlertThreshold(p).isLowStock);
  }, [products, getProductAlertThreshold]);

  const lowStockCount = lowStockProducts.length;

  // Selected Supplier details for PO Creation
  const selectedSupplierObj = useMemo(() => {
    return suppliers.find((s) => s.id === createSupplierId || s.name === createSupplierName);
  }, [suppliers, createSupplierId, createSupplierName]);

  // Handle supplier change in Create PO form
  const handleSupplierChange = (supId: string) => {
    setCreateSupplierId(supId);
    const sup = suppliers.find((s) => s.id === supId);
    if (sup) {
      setCreateSupplierName(sup.name);
      if (sup.paymentTerms) {
        setCreatePaymentTerm(sup.paymentTerms);
        const days = sup.paymentTerms.includes('14')
          ? 14
          : sup.paymentTerms.includes('7')
          ? 7
          : sup.paymentTerms.includes('COD')
          ? 0
          : 30;
        const d = new Date();
        d.setDate(d.getDate() + days);
        setCreateDueDate(d.toISOString().slice(0, 10));
      }
    }
  };

  // Add line item to Create PO
  const handleAddPoLineItem = () => {
    const prod = products.find((p) => p.id === tempProductId);
    if (!prod) {
      showToast('Pilih produk yang valid.');
      return;
    }
    if (tempQty <= 0) {
      showToast('Kuantitas order harus lebih dari 0.');
      return;
    }

    const existingIdx = createPoItems.findIndex((it) => it.productId === tempProductId);
    if (existingIdx >= 0) {
      setCreatePoItems((prev) => {
        const copy = [...prev];
        const updatedQty = copy[existingIdx].qty + tempQty;
        copy[existingIdx] = {
          ...copy[existingIdx],
          qty: updatedQty,
          unitCost: tempUnitCost,
          subtotal: updatedQty * tempUnitCost,
        };
        return copy;
      });
    } else {
      setCreatePoItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          qty: tempQty,
          unitCost: tempUnitCost,
          subtotal: tempQty * tempUnitCost,
          unit: prod.unit || 'Unit',
        },
      ]);
    }
    showToast(`Ditambahkan ke draf PO: ${prod.name} (${tempQty})`);
  };

  const handleRemovePoLineItem = (idx: number) => {
    setCreatePoItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Calculations for Create PO
  const createSubtotal = useMemo(() => {
    return createPoItems.reduce((acc, it) => acc + it.subtotal, 0);
  }, [createPoItems]);

  const createPpnAmount = useMemo(() => {
    return createIncludePpn ? Math.round(createSubtotal * 0.11) : 0;
  }, [createIncludePpn, createSubtotal]);

  const createGrandTotal = useMemo(() => {
    return createSubtotal + createPpnAmount;
  }, [createSubtotal, createPpnAmount]);

  // Handle Create PO Submission
  const handleCreatePOSubmit = (status: 'Draft' | 'Menunggu Approval Pimpinan' | 'Menunggu Approval Direksi') => {
    if (createPoItems.length === 0) {
      showToast('Wajib memasukkan setidaknya satu produk ke dalam PO.');
      return;
    }

    const itemsSummary = createPoItems
      .map((it) => `${it.productName} (${it.qty} ${it.unit})`)
      .join(', ');

    const finalStatus: PurchaseOrderStatus =
      status === 'Draft'
        ? 'Draft'
        : createGrandTotal > 20000000
        ? 'Menunggu Approval Direksi'
        : 'Menunggu Approval Pimpinan';

    createPurchaseOrder({
      date: new Date().toISOString().slice(0, 10),
      supplier_name: createSupplierName,
      supplier_id: createSupplierId,
      items: itemsSummary,
      subtotal: createSubtotal,
      include_ppn: createIncludePpn,
      ppn_rate: 11,
      ppn_amount: createPpnAmount,
      total_amount: createGrandTotal,
      payment_term: createPaymentTerm,
      payment_status: 'Belum Bayar',
      due_date: createDueDate,
      notes: createNotes.trim() || undefined,
      status: finalStatus,
      item_details: createPoItems.map((it) => ({
        product_id: it.productId,
        product_name: it.productName,
        qty: it.qty,
        unit_cost: it.unitCost,
        subtotal: it.subtotal,
        unit: it.unit,
        received_qty: 0,
      })),
    });

    setIsCreateModalOpen(false);
  };

  // Goods Receipt Modal Opening
  const openGoodsReceiptModal = (po: PurchaseOrder) => {
    setSelectedPoForGr(po);
    setIsGrModalOpen(true);
  };

  // Filtered Purchasing Table
  const filteredPurchasing = useMemo(() => {
    return purchasing.filter((po) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Draft' && po.status !== 'Draft') return false;
        if (
          statusFilter === 'Menunggu Approval' &&
          po.status !== 'Menunggu Approval Pimpinan' &&
          po.status !== 'Menunggu Approval Direksi' &&
          po.status !== 'PENDING APPROVAL' &&
          po.status !== 'Pending Approval'
        )
          return false;
        if (
          statusFilter === 'Menunggu Approval Direksi' &&
          po.status !== 'Menunggu Approval Direksi'
        )
          return false;
        if (
          statusFilter === 'Disetujui' &&
          po.status !== 'Disetujui (Approved)' &&
          po.status !== 'Disetujui' &&
          po.status !== 'Approved'
        )
          return false;
        if (
          statusFilter === 'Dipesan' &&
          po.status !== 'Dipesan' &&
          po.status !== 'SENT_TO_VENDOR' &&
          po.status !== 'Sent'
        )
          return false;
        if (
          statusFilter === 'Selesai' &&
          po.status !== 'Selesai' &&
          po.status !== 'FULLY_RECEIVED' &&
          po.status !== 'RECEIVED' &&
          po.status !== 'GOODS_RECEIPT' &&
          po.status !== 'Received' &&
          po.status !== 'Received / Completed'
        )
          return false;
        if (
          statusFilter === 'Ditolak' &&
          po.status !== 'Ditolak' &&
          po.status !== 'Cancelled'
        )
          return false;
      }

      // Payment Filter
      if (paymentFilter !== 'ALL') {
        const todayStr = new Date().toISOString().slice(0, 10);
        const isPaid = po.payment_status === 'Lunas' || po.payment_status === 'PAID';
        const isOverdue =
          po.payment_status === 'Jatuh Tempo' ||
          (!isPaid && po.due_date && po.due_date < todayStr);

        if (paymentFilter === 'Belum Bayar' && (isPaid || isOverdue)) return false;
        if (paymentFilter === 'Jatuh Tempo' && !isOverdue) return false;
        if ((paymentFilter === 'Lunas' || paymentFilter === 'PAID') && !isPaid) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPo = po.po_number.toLowerCase().includes(q);
        const matchSup = po.supplier_name.toLowerCase().includes(q);
        const matchItem = po.items.toLowerCase().includes(q);
        const matchDo = (po.delivery_order_no || '').toLowerCase().includes(q);
        if (!matchPo && !matchSup && !matchItem && !matchDo) return false;
      }

      return true;
    });
  }, [purchasing, statusFilter, paymentFilter, searchQuery]);

  // 3 Neon Purchasing Metric Cards
  const purchasingCards = [
    {
      id: 'po-value',
      title: 'Nilai PO & Draf (PO Value & Commitments)',
      value: `Rp ${totalPoValue.toLocaleString('id-ID')}`,
      sub: `${purchasing.length} Total PO • ${pendingApprovalCount} Butuh Approval`,
      colorHex: '#8b5cf6',
      icon: ShoppingBag,
      focusDesc:
        'Fokus Analisis: Total komitmen belanja pengadaan barang modal, status approval, dan alokasi anggaran.',
    },
    {
      id: 'low-stock',
      title: 'Peringatan Stok Kritis (Low Stock Alert)',
      value: `${lowStockCount} SKU Kritis`,
      sub: 'Perlu Pengadaan Segera ke Supplier',
      colorHex: '#f59e0b',
      icon: AlertTriangle,
      focusDesc:
        'Fokus Analisis: Daftar SKU yang butuh restock mendesak untuk menjaga suplai operasional.',
    },
    {
      id: 'sku-stock',
      title: 'Portofolio Vendor & Rekanan (Vendor Portfolio)',
      value: `${suppliers.length} Supplier Resmi`,
      sub: `${products.length} SKU Dalam Katalog Suplai`,
      colorHex: '#38bdf8',
      icon: Boxes,
      focusDesc:
        'Fokus Analisis: Portofolio mitra rekanan vendor terdaftar dan monitoring SLA pengiriman.',
    },
  ];

  const selectedCardId = activeNeonCards['purchasing'] || 'po-value';
  const selectedPurchasingCard =
    purchasingCards.find((c) => c.id === selectedCardId) || purchasingCards[0];

  return (
    <div id="purchasing-module" className="space-y-6 max-w-7xl mx-auto pb-8">
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
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${
                isLight
                  ? 'bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs'
                  : 'bg-[#f43f5e]/15 border border-[#f43f5e]/40 text-[#f43f5e] font-bold text-[11px]'
              }`}>
                <Layers className="w-3.5 h-3.5" />
                <span>Purchasing & Goods Receipt</span>
              </div>

              {/* Dynamic Badge Jumlah PO Pending */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono ${
                  isLight
                    ? 'bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold text-[11px]'
                }`}
                title="Jumlah Purchase Order yang aktif atau membutuhkan tindakan (Draft, Approval, Pengiriman, atau Penerimaan)"
              >
                <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-amber-600' : 'bg-rose-400 animate-pulse'}`} />
                <span>{pendingPoCount} PO Pending</span>
              </div>
            </div>

            <h2
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Purchasing & Pengadaan Barang
            </h2>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Penerbitan PO multi-item, alur approval pimpinan, verifikasi surat jalan Goods Receipt (GR), dan monitoring tagihan supplier.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-sm'
                  : 'bg-[#0052FF] hover:bg-[#0043d1] text-white shadow-[0_0_15px_rgba(0,82,255,0.4)]'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Buat Purchase Order (PO)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 NEON PURCHASING METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {purchasingCards.map((card) => {
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
              id={`purchasing-card-${card.id}`}
              onClick={() => setActiveNeonCard('purchasing', card.id)}
              onMouseEnter={() => setHoveredCardId(card.id)}
              onMouseLeave={() => setHoveredCardId(null)}
              style={glowStyle}
              className="relative p-4 rounded-2xl text-left cursor-pointer overflow-hidden flex flex-col justify-between min-h-[135px] transition-all duration-150 ease-out"
            >
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

      {/* MONITORING INVOICE & TAGIHAN SUPPLIER (AP MONITORING WIDGET) */}
      <div
        className={`p-4 rounded-2xl border transition duration-200 ${
          isLight
            ? 'bg-slate-50 border-slate-200'
            : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#30363d]/40 mb-3.5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <h3
              className={`font-black text-sm ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Monitoring Tagihan & Invoice Supplier (Accounts Payable)
            </h3>
          </div>
          <span className="text-xs text-gray-400">
            Rekap status pembayaran kewajiban pembelian ke vendor rekanan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Belum Bayar */}
          <button
            type="button"
            onClick={() => {
              setPaymentFilter(paymentFilter === 'Belum Bayar' ? 'ALL' : 'Belum Bayar');
              setActivePurchasingTab('po');
            }}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              paymentFilter === 'Belum Bayar'
                ? isLight
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                  : 'bg-amber-500/20 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : isLight
                ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                : 'bg-[#0d1117] border-[#30363d] hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`uppercase tracking-wide ${
                isLight ? 'text-slate-900 font-bold text-xs' : 'text-amber-400 text-[11px] font-bold'
              }`}>
                BELUM BAYAR (UNPAID)
              </span>
              <span className={`font-mono px-2 py-0.5 rounded border ${
                isLight
                  ? 'bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-bold'
              }`}>
                {invoiceMetrics.unpaidCount} Faktur
              </span>
            </div>
            <div className={`text-base sm:text-lg font-black font-mono mt-1.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Rp {invoiceMetrics.unpaidTotal.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Dalam termin pembayaran COD / Tempo berjalan
            </div>
          </button>

          {/* Card 2: Jatuh Tempo */}
          <button
            type="button"
            onClick={() => {
              setPaymentFilter(paymentFilter === 'Jatuh Tempo' ? 'ALL' : 'Jatuh Tempo');
              setActivePurchasingTab('po');
            }}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              paymentFilter === 'Jatuh Tempo'
                ? isLight
                  ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm'
                  : 'bg-rose-500/20 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                : isLight
                ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                : 'bg-[#0d1117] border-[#30363d] hover:border-rose-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`uppercase tracking-wide ${
                isLight ? 'text-slate-900 font-bold text-xs' : 'text-rose-400 text-[11px] font-bold'
              }`}>
                TEMPO (OVERDUE)
              </span>
              <span className={`font-mono px-2 py-0.5 rounded border ${
                isLight
                  ? 'bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30 text-xs font-bold'
              }`}>
                {invoiceMetrics.overdueCount} Faktur
              </span>
            </div>
            <div className={`text-base sm:text-lg font-black font-mono mt-1.5 ${
              isLight ? 'text-rose-700' : 'text-rose-400'
            }`}>
              Rp {invoiceMetrics.overdueTotal.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Melebihi tanggal jatuh tempo, prioritaskan pelunasan
            </div>
          </button>

          {/* Card 3: Lunas */}
          <button
            type="button"
            onClick={() => {
              setPaymentFilter(paymentFilter === 'Lunas' ? 'ALL' : 'Lunas');
              setActivePurchasingTab('po');
            }}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              paymentFilter === 'Lunas'
                ? isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm'
                  : 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : isLight
                ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                : 'bg-[#0d1117] border-[#30363d] hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`uppercase tracking-wide ${
                isLight ? 'text-slate-900 font-bold text-xs' : 'text-emerald-400 text-[11px] font-bold'
              }`}>
                LUNAS (PAID)
              </span>
              <span className={`font-mono px-2 py-0.5 rounded border ${
                isLight
                  ? 'bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-bold'
              }`}>
                {invoiceMetrics.paidCount} Faktur
              </span>
            </div>
            <div className={`text-base sm:text-lg font-black font-mono mt-1.5 ${
              isLight ? 'text-emerald-700' : 'text-emerald-400'
            }`}>
              Rp {invoiceMetrics.paidTotal.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Faktur telah lunas & terkonfirmasi oleh finance
            </div>
          </button>
        </div>
      </div>

      {/* DYNAMIC FOCUS PANEL FOR CARD (LOW STOCK QUICK REORDER TRIGGER) */}
      {selectedCardId === 'low-stock' && (
        <div
          className={`p-5 rounded-2xl border transition duration-200 ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">SKU & Bahan Baku yang Butuh Restock Segera:</span>
              <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 font-mono text-[11px]">
                {lowStockCount} Item Kritis
              </span>
            </div>

            {lowStockCount > 0 && (
              <button
                type="button"
                onClick={handleReorderAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(245,158,11,0.35)] transition cursor-pointer self-start sm:self-auto active:scale-95"
                title="Buat draf PO otomatis dikelompokkan per Supplier Rekanan"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Reorder All Low Stock ({lowStockCount})</span>
              </button>
            )}
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Seluruh produk dan bahan baku berada dalam batas stok aman (di atas Safety Stock).</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {lowStockProducts.map((p, pIdx) => {
                const policyInfo = getProductAlertThreshold(p);
                const maxStock =
                  p.initialStock && p.initialStock > policyInfo.minStock
                    ? p.initialStock
                    : Math.max(policyInfo.minStock * 3, 20);
                const orderQty = Math.max(1, maxStock - Math.max(0, p.stock));

                return (
                  <div
                    key={`po-lowstock-${p.id}-${pIdx}`}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                      isLight
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-amber-500/10 border-amber-500/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono text-amber-500 font-bold">
                          {p.id}
                        </span>
                        <span className="text-xs font-mono font-black text-amber-500">
                          Stok: {p.stock} {p.unit || 'Unit'}
                        </span>
                      </div>
                      <div
                        className={`text-sm font-bold truncate ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {p.name}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 space-y-0.5">
                        <div>Safety Alert: ≤{policyInfo.minStock} {p.unit || 'Unit'} • Target: {maxStock}</div>
                        <div className="text-emerald-400 font-mono font-bold">
                          Kebutuhan PO: +{orderQty} {p.unit || 'Unit'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-amber-500/20">
                      <button
                        type="button"
                        onClick={() => handleAutoReorderSingle(p)}
                        className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg cursor-pointer transition flex items-center justify-center gap-1 shadow-sm active:scale-95"
                        title={`Auto-generate draf PO untuk ${p.name} (+${orderQty} ${p.unit || 'Unit'})`}
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        <span>Auto PO (+{orderQty})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTempProductId(p.id);
                          setTempUnitCost(p.cost_price || 500000);
                          setTempQty(orderQty);
                          setIsCreateModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-black/20 hover:bg-black/30 text-gray-300 text-xs rounded-lg cursor-pointer transition"
                        title="Buka form PO manual"
                      >
                        Manual
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DAFTAR 2 PURCHASE ORDER BERSTATUS APPROVED / SIAP DITERIMA (GOODS RECEIPT QUEUE) */}
      {approvedPOs.length > 0 && (
        <div
          id="approved-po-queue"
          className={`p-5 rounded-2xl border transition duration-200 ${
            isLight
              ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200 shadow-sm'
              : 'bg-gradient-to-r from-emerald-950/20 via-[#161b22] to-teal-950/20 border-emerald-500/30'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#30363d]/40">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isLight ? 'bg-emerald-100 text-emerald-800 border border-slate-200 shadow-xs' : 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}>
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold text-sm sm:text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Daftar Purchase Order Siap Diterima (Status APPROVED)
                  </h3>
                  <span
                    id="badge-approved-pos-count"
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                      isLight
                        ? 'bg-amber-50 text-amber-800 border-slate-200'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {approvedPOs.length} PO Siap Terima
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Dokumen PO telah memperoleh otorisasi pimpinan/direksi. Klik tombol <strong>Terima Barang (Create GRN)</strong> untuk verifikasi fisik & sinkronisasi otomatis ke Gudang dan Hutang Dagang.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActivePurchasingTab('gr')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <span>Riwayat Goods Receipt ({goodsReceipts.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {approvedPOs.map((po) => {
              const totalItemsCount = po.item_details
                ? po.item_details.reduce((acc, it) => acc + it.qty, 0)
                : 0;

              return (
                <div
                  key={`approved-card-${po.po_number}`}
                  id={`approved-po-card-${po.po_number}`}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3.5 transition duration-150 ${
                    isLight
                      ? 'bg-white border-slate-200 hover:border-emerald-500 shadow-sm'
                      : 'bg-[#0d1117] border-[#30363d] hover:border-emerald-500/50'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPoForDetail(po)}
                            className="font-mono font-bold text-sm text-[#0052FF] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>{po.po_number}</span>
                            <Eye className="w-3 h-3 opacity-60" />
                          </button>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                            APPROVED
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-1">
                          Tanggal PO: {po.date} • {po.approved_by || 'Disetujui Pimpinan'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-black text-emerald-400 text-sm sm:text-base">
                          Rp {po.total_amount.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                          {po.payment_term || 'Tempo 30 Hari'}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-black/20 border border-[#30363d]/50 space-y-1">
                      <div className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {po.supplier_name}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate" title={po.items}>
                        {po.items}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#30363d]/40 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400 font-mono">
                      {po.item_details?.length || 1} SKU • {totalItemsCount} Unit
                    </span>

                    <button
                      type="button"
                      id={`btn-create-grn-${po.po_number}`}
                      onClick={() => openGoodsReceiptModal(po)}
                      className={`px-3.5 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                        isLight
                          ? 'bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 shadow-sm'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                      }`}
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>Terima Barang (Create GRN)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN PURCHASING TABS & DATA TABLE */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-lg transition duration-200 ${
          isLight
            ? 'bg-white border-slate-200'
            : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        {/* Navigation Tabs Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-[#30363d] pb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex items-center rounded-xl p-0.5 border ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/80 border-slate-700'
            }`}>
              <button
                type="button"
                onClick={() => setActivePurchasingTab('po')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activePurchasingTab === 'po'
                    ? isLight
                      ? 'bg-white text-blue-600 border border-slate-200 shadow-sm'
                      : 'bg-[#0052FF] text-white shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Dokumen PO ({purchasing.length})</span>
              </button>

              <button
                type="button"
                id="tab-btn-purchasing-pr"
                onClick={() => setActivePurchasingTab('pr')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  activePurchasingTab === 'pr'
                    ? isLight
                      ? 'bg-white text-amber-600 border border-slate-200 shadow-sm'
                      : 'bg-amber-600 text-slate-950 font-bold shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Draf Permintaan / PR ({purchaseRequests.length})</span>
                {purchaseRequests.filter((pr) => pr.status === 'PENDING' || pr.status === 'Pending Approval').length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full font-mono border ${
                    isLight ? 'bg-amber-200 border border-amber-400 text-amber-950 font-black text-[10px]' : 'bg-amber-500/30 text-amber-300 border-amber-500/40 text-[10px] font-bold'
                  }`}>
                    {purchaseRequests.filter((pr) => pr.status === 'PENDING' || pr.status === 'Pending Approval').length} PENDING
                  </span>
                )}
              </button>

              <button
                type="button"
                id="tab-btn-purchasing-gr"
                onClick={() => setActivePurchasingTab('gr')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  activePurchasingTab === 'gr'
                    ? isLight
                      ? 'bg-white text-emerald-600 border border-slate-200 shadow-sm'
                      : 'bg-emerald-600 text-white shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Penerimaan Barang / GR ({goodsReceipts.length})</span>
                {approvedPOs.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold border ${
                    isLight ? 'bg-amber-50 text-amber-800 border-slate-200' : 'bg-amber-500/30 text-amber-300 border-amber-500/40'
                  }`}>
                    {approvedPOs.length} Siap Terima
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActivePurchasingTab('invoices')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  activePurchasingTab === 'invoices'
                    ? isLight
                      ? 'bg-white text-purple-600 border border-slate-200 shadow-sm'
                      : 'bg-purple-600 text-white shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Rekap Tagihan Vendor</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-[#8b949e]">
            {activePurchasingTab === 'po' && `${filteredPurchasing.length} dari ${purchasing.length} Dokumen PO`}
            {activePurchasingTab === 'pr' && `${purchaseRequests.length} Draf Permintaan Pembelian (PR)`}
            {activePurchasingTab === 'gr' && `${goodsReceipts.length} Penerimaan Terverifikasi`}
            {activePurchasingTab === 'invoices' && `${purchasing.length} Faktur Tagihan`}
          </div>
        </div>

        {/* Filters and Search Bar for PO Tab */}
        {activePurchasingTab === 'po' && (
          <div
            className={`p-3.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
            }`}
          >
            {/* Search Box */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari No. PO, Supplier, Produk, atau No. Surat Jalan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl border outline-none text-xs transition ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-[#0052FF]'
                    : 'bg-[#161b22] border-[#30363d] text-white focus:border-[#0052FF]'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">{isEn ? 'PO Status:' : 'Status PO:'}</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`px-2.5 py-1.5 rounded-xl border outline-none text-xs font-semibold ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800'
                      : 'bg-[#161b22] border-[#30363d] text-gray-200'
                  }`}
                >
                  <option value="ALL">{isEn ? 'All Status' : 'Semua Status'}</option>
                  <option value="Draft">{isEn ? 'Draft' : 'Draft'}</option>
                  <option value="Menunggu Approval">{isEn ? 'All Awaiting Approval' : 'Semua Menunggu Approval'}</option>
                  <option value="Menunggu Approval Direksi">{isEn ? 'Awaiting Board Approval (> 20M)' : 'Menunggu Approval Direksi (> 20 Jt)'}</option>
                  <option value="Disetujui">{isEn ? 'Approved' : 'Disetujui (Approved)'}</option>
                  <option value="Dipesan">{isEn ? 'Ordered (Sent)' : 'Dipesan (Sent)'}</option>
                  <option value="Selesai">{isEn ? 'Completed (Received)' : 'Selesai (Received)'}</option>
                  <option value="Ditolak">{isEn ? 'Rejected' : 'Ditolak'}</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">{isEn ? 'Payment Status:' : 'Status Tagihan:'}</span>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className={`px-2.5 py-1.5 rounded-xl border outline-none text-xs font-semibold ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800'
                      : 'bg-[#161b22] border-[#30363d] text-gray-200'
                  }`}
                >
                  <option value="ALL">{isEn ? 'All Invoices' : 'Semua Tagihan'}</option>
                  <option value="Belum Bayar">{isEn ? 'Unpaid' : 'Belum Bayar'}</option>
                  <option value="Jatuh Tempo">{isEn ? 'Overdue' : 'Jatuh Tempo'}</option>
                  <option value="Lunas">{isEn ? 'Paid' : 'Lunas'}</option>
                </select>
              </div>

              {(statusFilter !== 'ALL' || paymentFilter !== 'ALL' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setPaymentFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-xs transition"
                >
                  {isEn ? 'Reset Filter' : 'Reset Filter'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: DOKUMEN PO TABLE */}
        {activePurchasingTab === 'po' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`font-semibold border-b uppercase tracking-wider text-[11px] ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">No. PO & Tanggal</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Rincian Barang</th>
                  <th className="py-3 px-4 text-right">Total Nilai (PPN 11%)</th>
                  <th className="py-3 px-4 text-center">Status Dokumen</th>
                  <th className="py-3 px-4 text-center">Status Tagihan</th>
                  <th className="py-3 px-4 text-center">Aksi / Goods Receipt</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight
                    ? 'divide-slate-200 text-slate-800'
                    : 'divide-[#30363d] text-gray-300'
                }`}
              >
                {filteredPurchasing.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-500">
                      Tidak ada dokumen Purchase Order yang sesuai kriteria pencarian/filter.
                    </td>
                  </tr>
                ) : (
                  filteredPurchasing.map((po) => {
                    const st = po.status;
                    const isDraft = st === 'Draft';
                    const isPendingDireksi = st === 'Menunggu Approval Direksi';
                    const isPendingPimpinan =
                      st === 'Menunggu Approval Pimpinan' ||
                      st === 'PENDING APPROVAL' ||
                      st === 'Pending Approval';
                    const isPendingApproval = isPendingDireksi || isPendingPimpinan;
                    const isApproved =
                      st === 'Disetujui (Approved)' || st === 'Disetujui' || st === 'Approved';
                    const isSent =
                      st === 'Dipesan' || st === 'SENT_TO_VENDOR' || st === 'Sent';
                    const isPartial = st === 'PARTIALLY_RECEIVED';
                    const isReceived =
                      st === 'Selesai' ||
                      st === 'FULLY_RECEIVED' ||
                      st === 'RECEIVED' ||
                      st === 'GOODS_RECEIPT' ||
                      st === 'Received' ||
                      st === 'Received / Completed';
                    const isRejected = st === 'Ditolak' || st === 'Cancelled';

                    const supplierObj = suppliers.find(
                      (s) => s.id === po.supplier_id || s.name === po.supplier_name
                    );

                    return (
                      <tr
                        key={po.po_number}
                        className={`transition ${
                          isLight ? 'hover:bg-slate-50' : 'hover:bg-[#21262d]/50'
                        }`}
                      >
                        {/* No PO & Date */}
                        <td className="py-3 px-4 font-mono">
                          <button
                            type="button"
                            onClick={() => setSelectedPoForDetail(po)}
                            className="font-bold text-[#0052FF] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>{po.po_number}</span>
                            <Eye className="w-3 h-3 opacity-60" />
                          </button>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {po.date}
                          </div>
                        </td>

                        {/* Supplier */}
                        <td className="py-3 px-4">
                          <div
                            className={`font-semibold ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`}
                          >
                            {po.supplier_name}
                          </div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-cyan-400">
                              {supplierObj?.code || 'SUPP'}
                            </span>
                            <span>•</span>
                            <span className="text-amber-400">
                              {po.payment_term || supplierObj?.paymentTerms || 'Tempo 30 Hari'}
                            </span>
                          </div>
                          {po.delivery_order_no && (
                            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                              SJ: {po.delivery_order_no}
                            </div>
                          )}
                        </td>

                        {/* Items */}
                        <td className="py-3 px-4 max-w-xs truncate text-gray-300">
                          <div>{po.items}</div>
                          {po.item_details && po.item_details.length > 0 && (
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {po.item_details.length} item produk
                            </div>
                          )}
                        </td>

                        {/* Total Amount & PPN */}
                        <td className="py-3 px-4 text-right font-mono">
                          <div className="font-bold text-[#10B981] text-xs">
                            Rp {po.total_amount.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {po.include_ppn !== false ? 'Termasuk PPN 11%' : 'Non-PPN'}
                          </div>
                        </td>

                        {/* Status Lifecycle Dokumen */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isReceived && (
                            <span className={`px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                              isLight
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-950 font-bold text-xs'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold'
                            }`}>
                              <CheckCircle2 className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                              <span>Selesai (Received)</span>
                            </span>
                          )}
                          {isPartial && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-sky-500/15 text-sky-400 border-sky-500/30 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-sky-400" />
                              <span>Sebagian Diterima</span>
                            </span>
                          )}
                          {isSent && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-sky-500/15 text-sky-400 border-sky-500/30 inline-flex items-center gap-1">
                              <Truck className="w-3 h-3 text-sky-400" />
                              <span>Dipesan (Sent)</span>
                            </span>
                          )}
                          {isApproved && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>Disetujui (Approved)</span>
                            </span>
                          )}
                          {isPendingDireksi && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/40 inline-flex items-center gap-1 shadow-[0_0_8px_rgba(168,85,247,0.25)]">
                              <ShieldAlert className="w-3 h-3 text-purple-400" />
                              <span>Approval Direksi (&gt; 20 Jt)</span>
                            </span>
                          )}
                          {isPendingPimpinan && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-500/15 text-amber-400 border-amber-500/30 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Menunggu Approval</span>
                            </span>
                          )}
                          {isDraft && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-slate-500/15 text-slate-400 border-slate-500/30 inline-flex items-center gap-1">
                              <span>Draft PO</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-rose-500/15 text-rose-400 border-rose-500/30 inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              <span>Ditolak</span>
                            </span>
                          )}
                        </td>

                        {/* Status Tagihan Supplier */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {(() => {
                            const isPaid = po.payment_status === 'Lunas' || po.payment_status === 'PAID';
                            const todayStr = new Date().toISOString().slice(0, 10);
                            const isOverdue =
                              po.payment_status === 'Jatuh Tempo' ||
                              (!isPaid && po.due_date && po.due_date < todayStr);

                            if (isPaid) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPoForPayment(po)}
                                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition cursor-pointer font-mono"
                                  title="Faktur Lunas (PAID). Klik untuk melihat/edit data pembayaran."
                                >
                                  PAID
                                </button>
                              );
                            }
                            if (isOverdue) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPoForPayment(po)}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition cursor-pointer"
                                  title="Jatuh tempo! Klik untuk mencatat pelunasan."
                                >
                                  Jatuh Tempo
                                </button>
                              );
                            }
                            return (
                              <button
                                type="button"
                                onClick={() => setSelectedPoForPayment(po)}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition cursor-pointer"
                                title="Belum bayar. Klik untuk mencatat pelunasan."
                              >
                                Belum Bayar
                              </button>
                            );
                          })()}
                        </td>

                        {/* Aksi Baris */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Tombol Cetak Dokumen PO Resmi */}
                            <button
                              type="button"
                              onClick={() => setSelectedPoForPrint(po)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-slate-700 transition cursor-pointer"
                              title="Cetak Dokumen PO Resmi (A4)"
                            >
                              <Printer className="w-3.5 h-3.5 text-cyan-400" />
                            </button>

                            {/* Tombol Detail PO */}
                            <button
                              type="button"
                              onClick={() => setSelectedPoForDetail(po)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-slate-700 transition cursor-pointer"
                              title="Lihat Detail PO"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-400" />
                            </button>

                            {/* Lifecycle Action Button */}
                            {isDraft && (
                              <button
                                type="button"
                                onClick={() =>
                                  updatePurchaseOrderStatus(
                                    po.po_number,
                                    po.total_amount > 20000000
                                      ? 'Menunggu Approval Direksi'
                                      : 'Menunggu Approval Pimpinan'
                                  )
                                }
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                title={po.total_amount > 20000000 ? "Ajukan Otorisasi Direksi (> Rp 20 Jt)" : "Ajukan ke pimpinan untuk persetujuan"}
                              >
                                <Send className="w-3 h-3" />
                                <span>Ajukan</span>
                              </button>
                            )}

                            {isPendingApproval && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => approvePurchaseOrder(po.po_number)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)] active:scale-95"
                                  title={isPendingDireksi ? "Setujui Otorisasi Direksi (> Rp 20 Jt)" : "Setujui PO (Approve)"}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Setujui (Approve)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => rejectPurchaseOrder(po.po_number)}
                                  className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
                                  title="Tolak PO (Reject)"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Tolak</span>
                                </button>
                              </div>
                            )}

                            {isApproved && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  id={`btn-receive-po-${po.po_number}`}
                                  onClick={() => openGoodsReceiptModal(po)}
                                  className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-[0_0_10px_rgba(16,185,129,0.35)] cursor-pointer active:scale-95"
                                  title="Barang sudah tiba? Catat penerimaan barang (Create GRN)"
                                >
                                  <PackageCheck className="w-3.5 h-3.5" />
                                  <span>Terima Barang (Create GRN)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updatePurchaseOrderStatus(po.po_number, 'Dipesan')
                                  }
                                  className="px-2 py-1 bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/30 rounded-lg text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
                                  title="Teruskan pesanan ke vendor (Dipesan)"
                                >
                                  <Truck className="w-3 h-3" />
                                  <span>Kirim</span>
                                </button>
                              </div>
                            )}

                            {(isSent || isPartial) && (
                              <button
                                type="button"
                                onClick={() => openGoodsReceiptModal(po)}
                                className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-[0_0_10px_rgba(16,185,129,0.35)] cursor-pointer active:scale-95"
                                title="Catat barang masuk & verifikasi Surat Jalan vendor"
                              >
                                <PackageCheck className="w-3 h-3" />
                                <span>Terima Barang</span>
                              </button>
                            )}

                            {isReceived && (
                              <button
                                type="button"
                                onClick={() => setSelectedPoForPayment(po)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1 rounded flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
                                title="Kelola status pembayaran vendor"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Bayar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB PR: DRAF PURCHASE REQUEST (ROP NOTIFICATIONS & PERMINTAAN PEMBELIAN) */}
        {activePurchasingTab === 'pr' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`font-semibold border-b uppercase tracking-wider text-[11px] ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">No. PR & Tanggal</th>
                  <th className="py-3 px-4">Pemohon & Departemen</th>
                  <th className="py-3 px-4">Barang & Kuantitas</th>
                  <th className="py-3 px-4 text-right">Estimasi Biaya</th>
                  <th className="py-3 px-4 text-center">Urgensi</th>
                  <th className="py-3 px-4 text-center">Status PR</th>
                  <th className="py-3 px-4 text-center">Aksi / Otorisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/20">
                {purchaseRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle className="w-8 h-8 text-emerald-400 opacity-60" />
                        <span className="font-semibold text-sm">Tidak ada draf Purchase Request aktif</span>
                        <span className="text-xs text-gray-400">Seluruh stok produk berada dalam batas aman ROP</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  purchaseRequests.map((pr, prIdx) => {
                    const isPending = pr.status === 'PENDING' || pr.status === 'Pending Approval';
                    const matchedProd = products.find(
                      (p) =>
                        p.name.toLowerCase() === pr.item_name.toLowerCase() ||
                        pr.item_name.toLowerCase().includes(p.name.toLowerCase()) ||
                        pr.item_name.includes(p.id)
                    );

                    return (
                      <tr
                        key={`pr-row-${pr.pr_number}-${prIdx}`}
                        className={`transition hover:bg-slate-500/5 ${
                          isPending ? (isLight ? 'bg-amber-50/30' : 'bg-amber-950/10') : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                          <div>{pr.pr_number}</div>
                          <div className="text-[10px] text-gray-400 font-normal">{pr.date}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {pr.requester_name}
                          </div>
                          <div className="text-[10px] text-gray-400">{pr.department}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`font-bold ${isLight ? 'text-slate-800' : 'text-[#e6edf3]'}`}>
                            {pr.item_name}
                          </div>
                          <div className="text-[11px] font-mono text-amber-500 font-semibold">
                            Kebutuhan Pesan: {pr.qty} Unit
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          Rp {pr.estimated_cost.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              pr.urgency === 'High'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : pr.urgency === 'Medium'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {pr.urgency}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-mono border inline-flex items-center gap-1 ${
                              isPending
                                ? isLight
                                  ? 'bg-amber-200 border border-amber-400 text-amber-950 font-black text-[10px]'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse font-bold'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                            }`}
                          >
                            {isPending && <Clock className="w-3 h-3 text-amber-400" />}
                            <span>{pr.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isPending ? (
                            <span
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1 cursor-default"
                              title="Menunggu persetujuan manajerial di modul Executive sebelum dapat diproses menjadi PO"
                            >
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Menunggu Approval</span>
                            </span>
                          ) : pr.status === 'REJECTED' || pr.status === 'Rejected' || pr.status === 'Ditolak' ? (
                            <span
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1 cursor-default"
                              title="Purchase Request telah ditolak oleh Direksi/Executive"
                            >
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>Ditolak</span>
                            </span>
                          ) : pr.status === 'Converted to PO' ? (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/20 inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-cyan-400" />
                              <span>Sudah Jadi PO</span>
                            </span>
                          ) : (
                            /* PR berstatus APPROVED: Staf Purchasing dapat memproses PO */
                            <button
                              type="button"
                              id={`btn-process-pr-to-po-${pr.pr_number}`}
                              onClick={() => {
                                if (matchedProd) {
                                  createAutoReorderPO(matchedProd);
                                } else {
                                  setIsCreateModalOpen(true);
                                }
                                setPurchaseRequests((prev) =>
                                  prev.map((item) =>
                                    item.pr_number === pr.pr_number
                                      ? { ...item, status: 'Converted to PO' as const }
                                      : item
                                  )
                                );
                                showToast(`Purchase Request ${pr.pr_number} berhasil diproses menjadi Purchase Order (PO)!`);
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-md inline-flex items-center gap-1.5 active:scale-95"
                              title="Purchase Request telah disetujui (APPROVED). Klik untuk memproses dokumen PO resmi ke Supplier"
                            >
                              <Zap className="w-3.5 h-3.5 fill-current" />
                              <span>Proses PO (APPROVED)</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: RIWAYAT GOODS RECEIPT (GR HISTORY) */}
        {activePurchasingTab === 'gr' && (
          <div>
            {approvedPOs.length > 0 && (
              <div
                id="gr-tab-approved-pos"
                className={`p-4 border-b flex flex-col gap-3 ${
                  isLight ? 'bg-emerald-50/50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-emerald-400" />
                    <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Purchase Order Siap Diterima (Status APPROVED):
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {approvedPOs.length} PO
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {approvedPOs.map((po) => (
                    <div
                      key={`gr-tab-po-${po.po_number}`}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sky-400 text-xs">{po.po_number}</span>
                          <span className="text-[10px] font-semibold text-gray-400">{po.supplier_name}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 truncate max-w-xs">{po.items}</div>
                        <div className="text-[10px] font-mono text-emerald-400 font-bold mt-0.5">
                          Rp {po.total_amount.toLocaleString('id-ID')}
                        </div>
                      </div>

                      <button
                        type="button"
                        id={`btn-gr-tab-create-${po.po_number}`}
                        onClick={() => openGoodsReceiptModal(po)}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-sm cursor-pointer shrink-0 active:scale-95"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Terima Barang (Create GRN)</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`font-semibold border-b uppercase tracking-wider text-[11px] ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">No. Goods Receipt</th>
                  <th className="py-3 px-4">Waktu Penerimaan</th>
                  <th className="py-3 px-4">No. PO & Surat Jalan (DO)</th>
                  <th className="py-3 px-4">Vendor / Supplier</th>
                  <th className="py-3 px-4">Petugas Gudang</th>
                  <th className="py-3 px-4">Item Diterima & Restock</th>
                  <th className="py-3 px-4 text-center">Status GR</th>
                  <th className="py-3 px-4 text-center">Aksi Retur & Nota Debit</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight
                    ? 'divide-slate-200 text-slate-800'
                    : 'divide-[#30363d] text-gray-300'
                }`}
              >
                {goodsReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500 font-medium">
                      Belum ada dokumen Goods Receipt tercatat
                    </td>
                  </tr>
                ) : (
                  goodsReceipts.map((gr) => (
                    <tr
                      key={gr.id}
                      className={`transition ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-[#21262d]/50'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {gr.id}
                      </td>
                      <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                        {gr.receivedDate}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-sky-400">{gr.poNumber}</div>
                        <div className="text-[11px] text-amber-300 font-mono">
                          DO: {gr.deliveryOrderNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">{gr.vendorName}</td>
                      <td className="py-3 px-4 text-gray-300 text-[11px]">
                        {gr.receivedByUserId}
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <div className="space-y-1">
                          {gr.items.map((item, itIdx) => (
                            <div key={itIdx} className="text-[11px] flex items-center justify-between gap-2">
                              <span className="truncate">{item.productName}:</span>
                              <span className="font-mono font-bold text-emerald-400 shrink-0">
                                +{item.acceptedQty} {item.unit}
                              </span>
                              {item.rejectedQty > 0 && (
                                <span className="font-mono font-bold text-rose-400 shrink-0">
                                  (Reject: {item.rejectedQty})
                                </span>
                              )}
                            </div>
                          ))}
                          {gr.notes && (
                            <div className="text-[10px] text-gray-400 italic">
                              Ket: {gr.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-400 border-emerald-500/30 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>TERVERIFIKASI</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const hasRejected = gr.items.some((it) => it.rejectedQty > 0);
                          const existingReturns = (purchaseReturns || []).filter(
                            (r) => r.grId === gr.id || r.poNumber === gr.poNumber
                          );
                          return (
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedGrForReturn(gr)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                                  hasRejected
                                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.25)]'
                                    : 'bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700'
                                }`}
                                title="Buat Retur Pembelian & Terbitkan Nota Debit untuk memotong tagihan vendor"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                                <span>Buat Retur Pembelian</span>
                              </button>
                              {existingReturns.length > 0 && (
                                <span className="text-[9px] font-mono text-emerald-400 font-semibold">
                                  {existingReturns.length} Nota Debit Terbit
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

        {/* TAB 3: REKAP TAGIHAN VENDOR (INVOICE AP TABLE) */}
        {activePurchasingTab === 'invoices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`font-semibold border-b uppercase tracking-wider text-[11px] ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">No. PO & Dokumen</th>
                  <th className="py-3 px-4">Vendor Rekanan</th>
                  <th className="py-3 px-4">Termin & Jatuh Tempo</th>
                  <th className="py-3 px-4 text-right">Nilai PO Awal</th>
                  <th className="py-3 px-4 text-right">Potongan Retur (ND)</th>
                  <th className="py-3 px-4 text-right">Sisa Tagihan (Net AP)</th>
                  <th className="py-3 px-4 text-center">Status Pembayaran</th>
                  <th className="py-3 px-4 text-center">Aksi Pelunasan</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight
                    ? 'divide-slate-200 text-slate-800'
                    : 'divide-[#30363d] text-gray-300'
                }`}
              >
                {purchasing.map((po) => {
                  const returnAmount = po.return_amount || 0;
                  const netPayable = Math.max(0, po.total_amount - returnAmount);
                  const isPaid = po.payment_status === 'Lunas' || po.payment_status === 'PAID';
                  const todayStr = new Date().toISOString().slice(0, 10);
                  const isOverdue =
                    po.payment_status === 'Jatuh Tempo' ||
                    (!isPaid && po.due_date && po.due_date < todayStr);

                  return (
                    <tr
                      key={`inv-${po.po_number}`}
                      className={`transition ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-[#21262d]/50'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono">
                        <button
                          type="button"
                          onClick={() => setSelectedPoForDetail(po)}
                          className="font-bold text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>{po.po_number}</span>
                          <Eye className="w-3 h-3 opacity-60" />
                        </button>
                        <div className="text-[10px] text-gray-400 mt-0.5">{po.date}</div>
                        {po.debit_notes && po.debit_notes.length > 0 && (
                          <div className="text-[9px] font-mono text-rose-400 mt-0.5 font-bold">
                            ND: {po.debit_notes.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{po.supplier_name}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-xs">{po.items}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-amber-400 font-medium">{po.payment_term || 'Tempo 30 Hari'}</div>
                        <div className="text-[10px] font-mono mt-0.5">
                          <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-gray-400'}>
                            JT: {po.due_date || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-300">
                        Rp {po.total_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {returnAmount > 0 ? (
                          <span className="font-bold text-rose-400">
                            -Rp {returnAmount.toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-xs">
                        Rp {netPayable.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] font-mono ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isOverdue
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isPaid ? 'PAID' : (po.payment_status || 'Belum Bayar')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedPoForPayment(po)}
                          className={
                            isPaid
                              ? 'px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition cursor-pointer'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1 rounded inline-flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95'
                          }
                        >
                          {isPaid ? 'Detail Pembayaran' : 'Bayar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: FORM BUAT PURCHASE ORDER (MULTI-ITEM, REGISTERED SUPPLIER, PPN 11%, COD/TEMPO) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className={`w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative border my-8 flex flex-col max-h-[92vh] ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800'
                : 'bg-[#161b22] border-[#30363d] text-gray-200'
            }`}
          >
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-[#30363d] shrink-0">
              <div className="w-10 h-10 rounded-xl bg-[#0052FF]/20 text-[#0052FF] flex items-center justify-center">
                <FilePlus2 className="w-5 h-5" />
              </div>
              <div>
                <h3
                  className={`font-bold text-base ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Penerbitan Dokumen Purchase Order (PO)
                </h3>
                <p className="text-xs text-gray-400">
                  Formulir pengadaan barang modal resmi ke supplier terdaftar.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 space-y-4 text-xs pr-1">
              {/* Supplier Selection */}
              <div>
                <label className="font-bold text-gray-300 block mb-1">
                  Pilih Supplier Terdaftar <span className="text-rose-400">*</span>
                </label>
                <select
                  value={createSupplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border outline-none font-semibold ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF]'
                      : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                  }`}
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) • Termin: {s.paymentTerms || 'Tempo 30 Hari'}
                    </option>
                  ))}
                </select>

                {/* Selected Supplier Info Card */}
                {selectedSupplierObj && (
                  <div
                    className={`mt-2 p-3 rounded-xl border text-[11px] space-y-1 ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-[#0d1117] border-[#30363d] text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        {selectedSupplierObj.name}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {selectedSupplierObj.code}
                      </span>
                    </div>
                    <div className="text-gray-400">
                      Kontak: {selectedSupplierObj.contactPerson} • Telp: {selectedSupplierObj.phone}
                    </div>
                    <div className="text-gray-400 truncate">
                      Alamat: {selectedSupplierObj.address}
                    </div>
                  </div>
                )}
              </div>

              {/* Add Product Items to PO */}
              <div
                className={`p-3.5 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="font-bold text-gray-300 uppercase tracking-wide text-[11px] mb-2">
                  Tambah Produk yang Dipesan
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-gray-400 block mb-1">
                      Pilih Produk Katalog
                    </label>
                    <select
                      value={tempProductId}
                      onChange={(e) => {
                        setTempProductId(e.target.value);
                        const p = products.find((prod) => prod.id === e.target.value);
                        if (p) setTempUnitCost(p.cost_price || 500000);
                      }}
                      className="w-full px-2.5 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-white text-xs outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">
                      Kuantitas Order
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={tempQty}
                      onChange={(e) => setTempQty(Math.max(1, Number(e.target.value)))}
                      className="w-full px-2.5 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-white text-xs font-mono font-bold outline-none text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">
                      HPP Satuan (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={tempUnitCost}
                      onChange={(e) => setTempUnitCost(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-white text-xs font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="mt-2.5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddPoLineItem}
                    className="px-3 py-1.5 rounded-lg bg-[#0052FF] hover:bg-[#0043d1] text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Item ke PO</span>
                  </button>
                </div>

                {/* Line Items Table */}
                <div className="mt-3 border rounded-lg overflow-hidden border-[#30363d]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/30 text-gray-400 text-[10px] uppercase font-bold border-b border-[#30363d]">
                      <tr>
                        <th className="py-2 px-3">Item Produk</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Harga Satuan</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                        <th className="py-2 px-3 text-center w-10">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#30363d] text-gray-200">
                      {createPoItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3">
                            <div className="font-semibold">{item.productName}</div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {item.productId}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold">
                            {item.qty} {item.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            Rp {item.unitCost.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                            Rp {item.subtotal.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePoLineItem(idx)}
                              className="text-rose-400 hover:text-rose-300 p-1"
                              title="Hapus baris"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Terms & Due Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">
                    Termin Pembayaran (Payment Terms)
                  </label>
                  <select
                    value={createPaymentTerm}
                    onChange={(e) => {
                      const term = e.target.value;
                      setCreatePaymentTerm(term);
                      const days = term.includes('14')
                        ? 14
                        : term.includes('7')
                        ? 7
                        : term.includes('COD')
                        ? 0
                        : term.includes('45')
                        ? 45
                        : term.includes('60')
                        ? 60
                        : 30;
                      const d = new Date();
                      d.setDate(d.getDate() + days);
                      setCreateDueDate(d.toISOString().slice(0, 10));
                    }}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF]'
                        : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                    }`}
                  >
                    <option value="COD (Cash on Delivery)">COD (Cash on Delivery / Bayar Saat Tiba)</option>
                    <option value="Tempo 7 Hari">Tempo 7 Hari</option>
                    <option value="Tempo 14 Hari">Tempo 14 Hari</option>
                    <option value="Tempo 30 Hari">Tempo 30 Hari (Net 30)</option>
                    <option value="Tempo 45 Hari">Tempo 45 Hari</option>
                    <option value="Tempo 60 Hari">Tempo 60 Hari</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">
                    Tanggal Jatuh Tempo Tagihan
                  </label>
                  <input
                    type="date"
                    value={createDueDate}
                    onChange={(e) => setCreateDueDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-mono ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF]'
                        : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                    }`}
                  />
                </div>
              </div>

              {/* Tax PPN 11% Toggle & Calculations */}
              <div
                className={`p-3.5 rounded-xl border space-y-2 ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-200">
                    <input
                      type="checkbox"
                      checked={createIncludePpn}
                      onChange={(e) => setCreateIncludePpn(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0052FF] focus:ring-0 cursor-pointer"
                    />
                    <span>Kenakan PPN 11% (Pajak Pertambahan Nilai)</span>
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Tarif resmi UU HPP 11%
                  </span>
                </div>

                <div className="pt-2 border-t border-[#30363d]/50 space-y-1 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal Barang:</span>
                    <span className="font-mono text-gray-200">
                      Rp {createSubtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>PPN 11%:</span>
                    <span className="font-mono text-gray-200">
                      Rp {createPpnAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-700">
                    <span className="text-white">Total Nilai Purchase Order:</span>
                    <span className="font-mono text-emerald-400">
                      Rp {createGrandTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-gray-300 block mb-1">
                  Catatan Tambahan / Instruksi Vendor (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Instruksi packing, kontak penerima gudang, dll..."
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF]'
                      : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                  }`}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[#30363d] flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#21262d] text-gray-300 hover:bg-[#30363d] transition font-medium"
              >
                Batal
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCreatePOSubmit('Draft')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold border border-slate-700 transition cursor-pointer"
                >
                  Simpan sebagai Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleCreatePOSubmit('Menunggu Approval Pimpinan')}
                  className="px-4 py-2 rounded-xl bg-[#0052FF] hover:bg-[#0043d1] text-white font-bold shadow-[0_0_12px_rgba(0,82,255,0.4)] transition cursor-pointer"
                >
                  Terbitkan & Ajukan Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VERIFIKASI PENERIMAAN BARANG (GOODS RECEIPT / GR) */}
      <GoodsReceiptModal
        isOpen={isGrModalOpen}
        po={selectedPoForGr}
        onClose={() => {
          setIsGrModalOpen(false);
          setSelectedPoForGr(null);
        }}
        isLight={isLight}
      />

      {/* MODAL 3: PRATINJAU CETAK DOKUMEN PO RESMI */}
      {selectedPoForPrint && (
        <OfficialPoPrintModal
          po={selectedPoForPrint}
          supplier={suppliers.find(
            (s) =>
              s.id === selectedPoForPrint.supplier_id ||
              s.name === selectedPoForPrint.supplier_name
          )}
          onClose={() => setSelectedPoForPrint(null)}
          isLight={isLight}
        />
      )}

      {/* MODAL 4: DETAIL PO LENGKAP */}
      {selectedPoForDetail && (
        <PoDetailModal
          po={selectedPoForDetail}
          supplier={suppliers.find(
            (s) =>
              s.id === selectedPoForDetail.supplier_id ||
              s.name === selectedPoForDetail.supplier_name
          )}
          onClose={() => setSelectedPoForDetail(null)}
          onOpenPrint={() => {
            const target = selectedPoForDetail;
            setSelectedPoForDetail(null);
            setSelectedPoForPrint(target);
          }}
          onOpenGr={() => {
            const target = selectedPoForDetail;
            setSelectedPoForDetail(null);
            openGoodsReceiptModal(target);
          }}
          onOpenPayment={() => {
            const target = selectedPoForDetail;
            setSelectedPoForDetail(null);
            setSelectedPoForPayment(target);
          }}
          onApprove={() => {
            approvePurchaseOrder(selectedPoForDetail.po_number);
            setSelectedPoForDetail(null);
          }}
          onReject={() => {
            rejectPurchaseOrder(selectedPoForDetail.po_number);
            setSelectedPoForDetail(null);
          }}
          isLight={isLight}
        />
      )}

      {/* MODAL 5: PENCATATAN PEMBAYARAN TAGIHAN VENDOR */}
      {selectedPoForPayment && (
        <SupplierPaymentModal
          po={selectedPoForPayment}
          onClose={() => setSelectedPoForPayment(null)}
          onConfirmPayment={(poNum, st, details) => {
            updatePurchaseOrderPayment(poNum, st, details);
          }}
          isLight={isLight}
        />
      )}

      {/* MODAL 6: RETUR PEMBELIAN (PURCHASE RETURN) & NOTA DEBIT */}
      {selectedGrForReturn && (
        <PurchaseReturnModal
          gr={selectedGrForReturn}
          onClose={() => setSelectedGrForReturn(null)}
          onSubmitReturn={(payload) => {
            createPurchaseReturn(payload);
            setSelectedGrForReturn(null);
          }}
          isLight={isLight}
        />
      )}

      {/* MODAL 7: KONFIRMASI RINGKASAN DRAF PO OTOMATIS */}
      {summaryModalPOs && (
        <AutoPoSummaryModal
          generatedPOs={summaryModalPOs}
          onClose={() => setSummaryModalPOs(null)}
          isLight={isLight}
          sourceModule="Purchasing"
        />
      )}
    </div>
  );
};

export default PurchasingModule;
