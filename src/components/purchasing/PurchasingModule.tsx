import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAudit } from '../../audit';
import { PurchaseOrder, PurchaseOrderStatus, GoodsReceipt } from '../../types';
import { getReactiveNeonGlowStyle } from '../../utils/neonGlow';
import { OfficialPoPrintModal } from './OfficialPoPrintModal';
import { PoDetailModal } from './PoDetailModal';
import { SupplierPaymentModal } from './SupplierPaymentModal';
import { AutoPoSummaryModal } from './AutoPoSummaryModal';
import { PurchaseReturnModal } from './PurchaseReturnModal';
import { GoodsReceiptModal } from './GoodsReceiptModal';
import { SearchableProductCombobox } from '../common/SearchableProductCombobox';
import {
  BUILDING_PURCHASE_UNIT_OPTIONS,
  filterGoodsReceiptsByBusinessDomain,
  filterInventoryByBusinessDomain,
  filterProductsByBusinessDomain,
  filterPurchaseOrdersByBusinessDomain,
  filterPurchaseRequestsByBusinessDomain,
  filterSuppliersByBusinessDomain,
} from '../../utils/buildingDomainIsolation';
import {
  Plus,
  ShoppingBag,
  CheckCircle,
  Clock,
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
  RotateCcw,
  Printer,
  Search,
  CreditCard,
  Eye,
  Trash2,
  Send,
  ShieldAlert,
} from 'lucide-react';

export const PurchasingModule: React.FC = () => {
  const {
    purchasing: rawPurchasing,
    purchaseRequests: rawPurchaseRequests,
    setPurchaseRequests,
    products: rawProducts,
    suppliers: rawSuppliers,
    inventory: rawInventory,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    updatePurchaseOrderPayment,
    createAutoReorderPO,
    reorderAllLowStock,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    purchaseReturns,
    createPurchaseReturn,
    goodsReceipts: rawGoodsReceipts,
    getProductAlertThreshold,
    showToast,
    theme,
    activeNeonCards,
    setActiveNeonCard,
    language,
    activeUser,
    businessDomainConfig,
    activeSector,
    isFnb,
    isFashion,
    isBuilding,
    isService,
    isRetail,
  } = useApp();

  void isFnb;
  void isFashion;
  void isBuilding;
  void isService;
  void isRetail;

  const products = useMemo(
    () => filterProductsByBusinessDomain(rawProducts, businessDomainConfig),
    [rawProducts, businessDomainConfig, activeSector]
  );
  const purchasing = useMemo(
    () => filterPurchaseOrdersByBusinessDomain(rawPurchasing, businessDomainConfig),
    [rawPurchasing, businessDomainConfig, activeSector]
  );
  const purchaseRequests = useMemo(
    () => filterPurchaseRequestsByBusinessDomain(rawPurchaseRequests, businessDomainConfig),
    [rawPurchaseRequests, businessDomainConfig, activeSector]
  );
  const suppliers = useMemo(
    () => filterSuppliersByBusinessDomain(rawSuppliers, businessDomainConfig),
    [rawSuppliers, businessDomainConfig, activeSector]
  );
  const inventory = useMemo(
    () => filterInventoryByBusinessDomain(rawInventory, rawProducts, businessDomainConfig),
    [rawInventory, rawProducts, businessDomainConfig, activeSector]
  );
  const goodsReceipts = useMemo(
    () => filterGoodsReceiptsByBusinessDomain(rawGoodsReceipts, businessDomainConfig),
    [rawGoodsReceipts, businessDomainConfig, activeSector]
  );

  const { recordAudit } = useAudit();

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

  const [tempProductId, setTempProductId] = useState<string>(products[0]?.id || '');
  const [tempQty, setTempQty] = useState<number>(10);
  const [tempUnitCost, setTempUnitCost] = useState<number>(products[0]?.cost_price || 500000);
  const [tempUnit, setTempUnit] = useState<string>(products[0]?.unit || 'Sak');

  React.useEffect(() => {
    if (suppliers.length > 0 && !suppliers.some((s) => s.id === createSupplierId)) {
      const firstSup = suppliers[0];
      setCreateSupplierId(firstSup.id);
      setCreateSupplierName(firstSup.name);
      setCreatePaymentTerm(firstSup.paymentTerms || 'Tempo 30 Hari');
    }
  }, [suppliers, createSupplierId]);

  React.useEffect(() => {
    if (products.length > 0 && !products.some((p) => p.id === tempProductId)) {
      const firstP = products[0];
      setTempProductId(firstP.id);
      setTempUnitCost(firstP.cost_price || 500000);
      setTempUnit(firstP.unit || 'Sak');
      setCreatePoItems([
        {
          productId: firstP.id,
          productName: firstP.name,
          qty: 10,
          unitCost: firstP.cost_price || 500000,
          subtotal: 10 * (firstP.cost_price || 500000),
          unit: firstP.unit || 'Sak',
        },
      ]);
    }
  }, [products, tempProductId]);

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

  const [processingPoNumber, setProcessingPoNumber] = useState<string | null>(null);

  const handleApprovePo = (poNumber: string) => {
    if (processingPoNumber) return;
    setProcessingPoNumber(poNumber);
    try {
      approvePurchaseOrder(poNumber);
    } finally {
      setTimeout(() => {
        setProcessingPoNumber(null);
      }, 500);
    }
  };

  const handleRejectPo = (poNumber: string) => {
    if (processingPoNumber) return;
    setProcessingPoNumber(poNumber);
    try {
      rejectPurchaseOrder(poNumber);
    } finally {
      setTimeout(() => {
        setProcessingPoNumber(null);
      }, 500);
    }
  };

  const lowStockProducts = useMemo(() => {
    const lowFromProducts = products.filter((p) => {
      const thresholdInfo = getProductAlertThreshold(p);
      const minStock = p.minStock ?? p.min_stock ?? thresholdInfo.minStock ?? 10;
      return (
        p.stock <= minStock ||
        p.stock <= 10 ||
        p.status === 'Low Stock' ||
        p.status === 'Out of Stock' ||
        p.status === 'ALERT' ||
        thresholdInfo.isLowStock
      );
    });

    const knownIds = new Set(lowFromProducts.map((p) => p.id.toLowerCase()));
    const extraLowFromInv: typeof products = [];

    (inventory || []).forEach((inv) => {
      const finalStock = inv.final_stock ?? 0;
      const safetyStock = inv.safety_stock ?? 10;
      const isCritical =
        finalStock <= safetyStock ||
        finalStock <= 10 ||
        inv.status === 'ALERT' ||
        inv.status === 'LOW' ||
        inv.status === 'Out of Stock';

      if (isCritical) {
        const matched = products.find(
          (p) =>
            p.id.toLowerCase() === inv.product_id.toLowerCase() ||
            (p.sku && p.sku.toLowerCase() === inv.product_id.toLowerCase()) ||
            (p.barcode && p.barcode.toLowerCase() === inv.product_id.toLowerCase()) ||
            (p.name && inv.product_name && p.name.toLowerCase() === inv.product_name.toLowerCase())
        );
        if (matched) {
          if (!knownIds.has(matched.id.toLowerCase())) {
            knownIds.add(matched.id.toLowerCase());
            extraLowFromInv.push(matched);
          }
        } else if (!knownIds.has(inv.product_id.toLowerCase())) {
          knownIds.add(inv.product_id.toLowerCase());
          extraLowFromInv.push({
            id: inv.product_id,
            name: inv.product_name || inv.product_id,
            sku: inv.product_id,
            category: 'Minuman',
            price: 5000,
            cost_price: 3500,
            stock: inv.final_stock,
            minStock: inv.safety_stock || 10,
            unit: inv.unit || 'Pcs',
            supplier: 'PT Tirta Investama (Danone Aqua)',
            supplier_id: 'SUP-009',
            status: 'Low Stock',
          } as any);
        }
      }
    });

    return [...lowFromProducts, ...extraLowFromInv];
  }, [products, inventory, getProductAlertThreshold]);

  const lowStockCount = lowStockProducts.length;

  const selectedSupplierObj = useMemo(() => {
    return suppliers.find((s) => s.id === createSupplierId || s.name === createSupplierName);
  }, [suppliers, createSupplierId, createSupplierName]);

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

    const chosenUnit = tempUnit || prod.unit || 'Unit';
    const existingIdx = createPoItems.findIndex(
      (it) => it.productId === tempProductId && it.unit === chosenUnit
    );
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
          unit: chosenUnit,
        },
      ]);
    }
    showToast(`Ditambahkan ke draf PO: ${prod.name} (${tempQty} ${chosenUnit})`);
  };

  const handleRemovePoLineItem = (idx: number) => {
    setCreatePoItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const createSubtotal = useMemo(() => {
    return createPoItems.reduce((acc, it) => acc + it.subtotal, 0);
  }, [createPoItems]);

  const createPpnAmount = useMemo(() => {
    return createIncludePpn ? Math.round(createSubtotal * 0.11) : 0;
  }, [createIncludePpn, createSubtotal]);

  const createGrandTotal = useMemo(() => {
    return createSubtotal + createPpnAmount;
  }, [createSubtotal, createPpnAmount]);

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

    const poPayload = {
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
      payment_status: 'Belum Bayar' as const,
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
    };

    createPurchaseOrder(poPayload);

    // Audit Trail Rekaman Penerbitan PO
    recordAudit({
      traceId: `PO-GEN-${Date.now()}`,
      userId: activeUser?.id || 'purchasing-staff',
      userName: activeUser?.name || 'Staff Purchasing',
      userRole: activeUser?.role || 'Purchasing',
      module: 'PURCHASING',
      action: 'PURCHASE_ORDER_CREATE',
      severity: createGrandTotal > 20000000 ? 'CRITICAL' : 'INFO',
      entityId: createSupplierId,
      payloadAfter: {
        supplier: createSupplierName,
        itemCount: createPoItems.length,
        totalAmount: createGrandTotal,
        paymentTerm: createPaymentTerm,
        status: finalStatus,
      },
    });

    setIsCreateModalOpen(false);
  };

  const openGoodsReceiptModal = (po: PurchaseOrder) => {
    setSelectedPoForGr(po);
    setIsGrModalOpen(true);
  };

  const filteredPurchasing = useMemo(() => {
    return purchasing.filter((po) => {
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
          po.status !== 'Approved' &&
          po.status !== 'APPROVED'
        )
          return false;
        if (
          statusFilter === 'Dipesan' &&
          po.status !== 'Dipesan' &&
          po.status !== 'SENT_TO_VENDOR' &&
          po.status !== 'Sent' &&
          po.status !== 'Ordered'
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

  const purchasingCards = [
    {
      id: 'po-value',
      title: 'Nilai PO & Draf (PO Value & Commitments)',
      value: `Rp ${totalPoValue.toLocaleString('id-ID')}`,
      sub: `${purchasing.length} Total PO • ${pendingApprovalCount} Butuh Approval`,
      colorHex: '#8b5cf6',
      icon: ShoppingBag,
    },
    {
      id: 'low-stock',
      title: 'Peringatan Stok Kritis (Low Stock Alert)',
      value: `${lowStockCount} SKU Kritis`,
      sub: 'Perlu Pengadaan Segera ke Supplier',
      colorHex: '#f59e0b',
      icon: AlertTriangle,
    },
    {
      id: 'sku-stock',
      title: 'Portofolio Vendor & Rekanan (Vendor Portfolio)',
      value: `${suppliers.length} Supplier Resmi`,
      sub: `${products.length} SKU Dalam Katalog Suplai`,
      colorHex: '#38bdf8',
      icon: Boxes,
    },
  ];

  const selectedCardId = activeNeonCards['purchasing'] || 'po-value';

  return (
    <div id="purchasing-module" className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div
        className={`p-5 rounded-2xl border transition-all duration-200 ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.1)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${
                isLight
                  ? 'bg-cyan-50 border border-cyan-300 text-cyan-900 font-medium text-xs'
                  : 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-medium text-[11px]'
              }`}>
                <Layers className="w-3.5 h-3.5" />
                <span>Purchasing &amp; Goods Receipt</span>
              </div>

              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono ${
                  isLight
                    ? 'bg-amber-100 border border-amber-300 text-amber-900 font-normal text-xs'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-normal text-[11px]'
                }`}
                title="Jumlah Purchase Order yang aktif atau membutuhkan tindakan"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{pendingPoCount} PO Pending</span>
              </div>
            </div>

            <h2
              className={`text-xl leading-7 font-medium tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Purchasing &amp; Pengadaan Barang
            </h2>
            <p className="text-xs font-normal text-[#8b949e] mt-0.5">
              Penerbitan PO multi-item, alur approval pimpinan, verifikasi surat jalan Goods Receipt (GR), dan monitoring tagihan supplier.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 rounded-xl transition-all cursor-pointer active:scale-[0.99] ${
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

      {/* 3 Neon Purchasing Metric Cards */}
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
              className="relative p-4 rounded-2xl text-left cursor-pointer overflow-hidden flex flex-col justify-between min-h-[135px] transition-all duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.99]"
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
                  className="text-xs font-medium uppercase tracking-wider"
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
                  className={`text-lg sm:text-xl font-semibold font-mono tracking-tight ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                  style={{ color: isSelected ? card.colorHex : undefined }}
                >
                  {card.value}
                </div>
                <div className="text-[11px] text-[#8b949e] font-normal mt-1 truncate">
                  {card.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* AP Monitoring Widget */}
      <div
        className={`p-4 rounded-2xl border transition-all duration-200 ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.1)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#30363d]/40 mb-3.5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <h3
              className={`font-medium text-base leading-6 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Monitoring Tagihan &amp; Invoice Supplier (Accounts Payable)
            </h3>
          </div>
          <span className="text-xs text-gray-400">
            Rekap status pembayaran kewajiban pembelian ke vendor rekanan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setPaymentFilter(paymentFilter === 'Belum Bayar' ? 'ALL' : 'Belum Bayar');
              setActivePurchasingTab('po');
            }}
            className={`p-3.5 rounded-xl border text-left transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer ${
              paymentFilter === 'Belum Bayar'
                ? isLight
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                  : 'bg-amber-500/20 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : isLight
                ? 'bg-white border-slate-200 hover:border-amber-400 shadow-sm'
                : 'bg-[#0d1117] border-[#30363d] hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`uppercase tracking-widest font-mono text-[11px] leading-4 font-normal ${
                isLight ? 'text-slate-900' : 'text-amber-400'
              }`}>
                BELUM BAYAR (UNPAID)
              </span>
              <span className={`font-mono px-2 py-0.5 rounded border text-[11px] font-normal ${
                isLight
                  ? 'bg-amber-100 border-amber-300 text-amber-950'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {invoiceMetrics.unpaidCount} Faktur
              </span>
            </div>
            <div className={`text-lg leading-7 font-semibold font-mono mt-1.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Rp {invoiceMetrics.unpaidTotal.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Dalam termin pembayaran COD / Tempo berjalan
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setPaymentFilter(paymentFilter === 'Jatuh Tempo' ? 'ALL' : 'Jatuh Tempo');
              setActivePurchasingTab('po');
            }}
            className={`p-3.5 rounded-xl border text-left transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer ${
              paymentFilter === 'Jatuh Tempo'
                ? isLight
                  ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm'
                  : 'bg-rose-500/20 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                : isLight
                ? 'bg-white border-slate-200 hover:border-rose-400 shadow-sm'
                : 'bg-[#0d1117] border-[#30363d] hover:border-rose-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`uppercase tracking-widest font-mono text-[11px] leading-4 font-normal ${
                isLight ? 'text-slate-900' : 'text-rose-400'
              }`}>
                TEMPO (OVERDUE)
              </span>
              <span className={`font-mono px-2 py-0.5 rounded border text-[11px] font-normal ${
                isLight
                  ? 'bg-rose-100 border-rose-300 text-rose-950'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                {invoiceMetrics.overdueCount} Faktur
              </span>
            </div>
            <div className={`text-lg leading-7 font-semibold font-mono mt-1.5 ${
              isLight ? 'text-rose-700' : 'text-rose-400'
            }`}>
              Rp {invoiceMetrics.overdueTotal.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Melebihi tanggal jatuh tempo, prioritaskan pelunasan
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setPaymentFilter(paymentFilter === 'Lunas' ? 'ALL' : 'Lunas');
              setActivePurchasingTab('po');
            }}
            className={`p-3.5 rounded-xl border text-left transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer ${
              paymentFilter === 'Lunas'
                ? isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm'
                  : 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : isLight
                ? 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm'
                : 'bg-[#0d1117] border-[#30363d] hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`uppercase tracking-widest font-mono text-[11px] leading-4 font-normal ${
                isLight ? 'text-slate-900' : 'text-emerald-400'
              }`}>
                LUNAS (PAID)
              </span>
              <span className={`font-mono px-2 py-0.5 rounded border text-[11px] font-normal ${
                isLight
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-950'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {invoiceMetrics.paidCount} Faktur
              </span>
            </div>
            <div className={`text-lg leading-7 font-semibold font-mono mt-1.5 ${
              isLight ? 'text-emerald-700' : 'text-emerald-400'
            }`}>
              Rp {invoiceMetrics.paidTotal.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Faktur telah lunas &amp; terkonfirmasi oleh finance
            </div>
          </button>
        </div>
      </div>

      {/* Focus Panel: Low Stock Alert */}
      {selectedCardId === 'low-stock' && (
        <div
          className={`p-5 rounded-2xl border transition-all duration-200 ${
            isLight
              ? 'bg-white border-amber-500/70 shadow-[0_0_16px_rgba(245,158,11,0.18)]'
              : 'bg-[#161b22] border-amber-500/40 shadow-[0_0_16px_rgba(245,158,11,0.12)]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>SKU &amp; Bahan Baku yang Butuh Restock Segera:</span>
              <span className="px-2 py-0.5 rounded-full font-normal bg-amber-500/20 text-amber-400 font-mono text-[11px] animate-pulse">
                {lowStockCount} Item Kritis
              </span>
            </div>

            {lowStockCount > 0 && (
              <button
                type="button"
                onClick={handleReorderAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-medium text-xs shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all cursor-pointer self-start sm:self-auto active:scale-[0.99]"
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
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all hover:-translate-y-0.5 ${
                      isLight
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-amber-500/10 border-amber-500/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono text-amber-500 font-normal">
                          {p.id}
                        </span>
                        <span className="text-xs font-mono font-semibold text-amber-500">
                          Stok: {p.stock} {p.unit || 'Unit'}
                        </span>
                      </div>
                      <div
                        className={`text-sm font-medium truncate ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {p.name}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 space-y-0.5">
                        <div>Safety Alert: ≤{policyInfo.minStock} {p.unit || 'Unit'} • Target: {maxStock}</div>
                        <div className="text-emerald-400 font-mono font-medium">
                          Kebutuhan PO: +{orderQty} {p.unit || 'Unit'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-amber-500/20">
                      <button
                        type="button"
                        onClick={() => handleAutoReorderSingle(p)}
                        className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium text-xs rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 shadow-sm active:scale-[0.99]"
                        title={`Auto-generate draf PO untuk ${p.name}`}
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
                        className="px-2.5 py-1.5 bg-black/20 hover:bg-black/30 text-gray-300 text-xs rounded-lg cursor-pointer transition-all active:scale-[0.99]"
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

      {/* Approved PO Queue */}
      {approvedPOs.length > 0 && (
        <div
          id="approved-po-queue"
          className={`p-5 rounded-2xl border transition-all duration-200 ${
            isLight
              ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-500/70 shadow-[0_0_16px_rgba(16,185,129,0.18)]'
              : 'bg-gradient-to-r from-emerald-950/20 via-[#161b22] to-teal-950/20 border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.12)]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#30363d]/40">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs' : 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}>
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium text-base leading-6 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Daftar Purchase Order Siap Diterima (Status APPROVED)
                  </h3>
                  <span
                    id="badge-approved-pos-count"
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-normal border ${
                      isLight
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {approvedPOs.length} PO Siap Terima
                  </span>
                </div>
                <p className="text-xs font-normal text-gray-400 mt-0.5">
                  Dokumen PO telah memperoleh otorisasi. Klik tombol <span className="font-medium text-emerald-500">Terima Barang (Create GRN)</span> untuk verifikasi fisik &amp; sinkronisasi otomatis ke Gudang.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActivePurchasingTab('gr')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer shrink-0 self-start sm:self-auto transition-all active:scale-[0.99]"
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
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3.5 transition-all duration-150 hover:-translate-y-0.5 ${
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
                            className="font-mono font-medium text-sm text-[#0052FF] hover:underline cursor-pointer flex items-center gap-1 active:scale-[0.99]"
                          >
                            <span>{po.po_number}</span>
                            <Eye className="w-3 h-3 opacity-60" />
                          </button>
                          <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                            APPROVED
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-1">
                          Tanggal PO: {po.date} • {po.approved_by || 'Disetujui Pimpinan'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-semibold text-emerald-400 text-sm sm:text-base">
                          Rp {po.total_amount.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                          {po.payment_term || 'Tempo 30 Hari'}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-black/20 border border-[#30363d]/50 space-y-1">
                      <div className={`font-medium text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
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
                      className={`px-3.5 py-2 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.99] ${
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

      {/* Main Purchasing Tabs */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-lg transition-all duration-200 ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.1)]'
        }`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-[#30363d] pb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex items-center rounded-xl p-0.5 border ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-800/80 border-slate-700'
            }`}>
              <button
                type="button"
                onClick={() => setActivePurchasingTab('po')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.99] ${
                  activePurchasingTab === 'po'
                    ? isLight
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-[#0052FF] text-white shadow-sm'
                    : isLight
                    ? 'text-slate-700 hover:bg-slate-200'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.99] ${
                  activePurchasingTab === 'pr'
                    ? isLight
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-600 text-slate-950 shadow-sm'
                    : isLight
                    ? 'text-slate-700 hover:bg-slate-200'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Draf Permintaan / PR ({purchaseRequests.length})</span>
                {purchaseRequests.filter((pr) => pr.status === 'PENDING' || pr.status === 'Pending Approval').length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full font-mono border ${
                    isLight ? 'bg-amber-200 border border-amber-400 text-amber-950 text-[10px] font-normal animate-pulse' : 'bg-amber-500/30 text-amber-300 border-amber-500/40 text-[10px] font-normal animate-pulse'
                  }`}>
                    {purchaseRequests.filter((pr) => pr.status === 'PENDING' || pr.status === 'Pending Approval').length} PENDING
                  </span>
                )}
              </button>

              <button
                type="button"
                id="tab-btn-purchasing-gr"
                onClick={() => setActivePurchasingTab('gr')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.99] ${
                  activePurchasingTab === 'gr'
                    ? isLight
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-600 text-white shadow-sm'
                    : isLight
                    ? 'text-slate-700 hover:bg-slate-200'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Penerimaan Barang / GR ({goodsReceipts.length})</span>
                {approvedPOs.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-normal border ${
                    isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-500/30 text-amber-300 border-amber-500/40'
                  }`}>
                    {approvedPOs.length} Siap Terima
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActivePurchasingTab('invoices')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.99] ${
                  activePurchasingTab === 'invoices'
                    ? isLight
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-purple-600 text-white shadow-sm'
                    : isLight
                    ? 'text-slate-700 hover:bg-slate-200'
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
                className={`border-b uppercase tracking-widest font-mono font-normal text-[11px] leading-4 ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">No. PO &amp; Tanggal</th>
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

                        <td className="py-3 px-4 max-w-xs truncate text-gray-300">
                          <div>{po.items}</div>
                          {po.item_details && po.item_details.length > 0 && (
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {po.item_details.length} item produk
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-mono">
                          <div className="font-bold text-[#10B981] text-xs">
                            Rp {po.total_amount.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {po.include_ppn !== false ? 'Termasuk PPN 11%' : 'Non-PPN'}
                          </div>
                        </td>

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
                            <span className="text-[10px] font-normal font-mono px-2.5 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>Disetujui (Approved)</span>
                            </span>
                          )}
                          {isPendingDireksi && (
                            <span className="text-[10px] font-normal font-mono px-2.5 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40 inline-flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <ShieldAlert className="w-3 h-3 text-amber-400" />
                              <span>Approval Direksi (&gt; 20 Jt)</span>
                            </span>
                          )}
                          {isPendingPimpinan && (
                            <span className="text-[10px] font-normal font-mono px-2.5 py-0.5 rounded-full border bg-amber-500/15 text-amber-400 border-amber-500/30 inline-flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <Clock className="w-3 h-3" />
                              <span>Menunggu Approval</span>
                            </span>
                          )}
                          {isDraft && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-normal font-mono px-2.5 py-0.5 rounded-full border bg-slate-500/15 text-slate-400 border-slate-500/30 inline-flex items-center gap-1">
                                <span>Draft PO</span>
                              </span>
                              {(po.po_number?.startsWith('PO-AUTO') || po.notes?.includes('AUTO-REORDER')) && (
                                <span className="text-[10px] font-normal font-mono px-2.5 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40 inline-flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.25)] animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                  <span>AUTO-REORDER</span>
                                </span>
                              )}
                            </div>
                          )}
                          {isRejected && (
                            <span className="text-[10px] font-normal font-mono px-2.5 py-0.5 rounded-full border bg-rose-500/15 text-rose-400 border-rose-500/30 inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              <span>Ditolak</span>
                            </span>
                          )}
                        </td>

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
                                  title="Faktur Lunas (PAID)"
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
                                className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition cursor-pointer active:scale-[0.99]"
                                title="Belum bayar. Klik untuk mencatat pelunasan."
                              >
                                Belum Bayar
                              </button>
                            );
                          })()}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedPoForPrint(po)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-slate-700 transition cursor-pointer active:scale-[0.99]"
                              title="Cetak Dokumen PO Resmi (A4)"
                            >
                              <Printer className="w-3.5 h-3.5 text-cyan-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedPoForDetail(po)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-slate-700 transition cursor-pointer active:scale-[0.99]"
                              title="Lihat Detail PO"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-400" />
                            </button>

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
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer active:scale-[0.99]"
                                title={po.total_amount > 20000000 ? "Ajukan Otorisasi Direksi (> Rp 20 Jt)" : "Ajukan ke pimpinan"}
                              >
                                <Send className="w-3 h-3" />
                                <span>Ajukan</span>
                              </button>
                            )}

                            {isPendingApproval && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={processingPoNumber === po.po_number}
                                  onClick={() => handleApprovePo(po.po_number)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                                    processingPoNumber === po.po_number
                                      ? 'bg-slate-700/60 text-slate-400 border border-slate-600 cursor-not-allowed shadow-none'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)] active:scale-[0.99]'
                                  }`}
                                  title={isPendingDireksi ? "Setujui Otorisasi Direksi (> Rp 20 Jt)" : "Setujui PO (Approve)"}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{processingPoNumber === po.po_number ? 'Memproses...' : 'Setujui (Approve)'}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={processingPoNumber === po.po_number}
                                  onClick={() => handleRejectPo(po.po_number)}
                                  className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition border ${
                                    processingPoNumber === po.po_number
                                      ? 'bg-slate-700/60 text-slate-400 border-slate-600 cursor-not-allowed'
                                      : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border-rose-500/30 cursor-pointer active:scale-[0.99]'
                                  }`}
                                  title="Tolak PO (Reject)"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>{processingPoNumber === po.po_number ? 'Memproses...' : 'Tolak'}</span>
                                </button>
                              </div>
                            )}

                            {isApproved && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  id={`btn-receive-po-${po.po_number}`}
                                  onClick={() => openGoodsReceiptModal(po)}
                                  className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition shadow-[0_0_10px_rgba(16,185,129,0.35)] cursor-pointer active:scale-[0.99]"
                                  title="Catat penerimaan barang (Create GRN)"
                                >
                                  <PackageCheck className="w-3.5 h-3.5" />
                                  <span>Terima Barang (Create GRN)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updatePurchaseOrderStatus(po.po_number, 'Dipesan')
                                  }
                                  className="px-2 py-1 bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer active:scale-[0.99]"
                                  title="Teruskan pesanan ke vendor"
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
                                className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition shadow-[0_0_10px_rgba(16,185,129,0.35)] cursor-pointer active:scale-[0.99]"
                                title="Catat barang masuk & verifikasi Surat Jalan vendor"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                <span>Terima Barang</span>
                              </button>
                            )}

                            {isReceived && (
                              po.payment_status === 'Lunas' || po.payment_status === 'PAID' ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPoForPayment(po)}
                                  className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer hover:bg-emerald-500/30 active:scale-[0.99]"
                                  title="Faktur Lunas (PAID)"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Faktur Selesai</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPoForPayment(po)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-[0.99]"
                                  title="Kelola status pembayaran vendor"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Bayar</span>
                                </button>
                              )
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

        {/* TAB PR: DRAF PURCHASE REQUEST */}
        {activePurchasingTab === 'pr' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`font-mono font-normal tracking-widest uppercase text-[11px] leading-4 border-b ${
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
                        <span className="font-medium text-sm">Tidak ada draf Purchase Request aktif</span>
                        <span className="text-xs text-gray-400 font-normal">Seluruh stok produk berada dalam batas aman ROP</span>
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
                        <td className="py-3 px-4 font-mono font-medium text-cyan-400">
                          <div>{pr.pr_number}</div>
                          <div className="text-[10px] text-gray-400 font-normal">{pr.date}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {pr.requester_name}
                          </div>
                          <div className="text-[10px] text-gray-400 font-normal">{pr.department}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`font-medium ${isLight ? 'text-slate-800' : 'text-[#e6edf3]'}`}>
                            {pr.item_name}
                          </div>
                          <div className="text-[11px] font-mono text-amber-500 font-normal">
                            Kebutuhan Pesan: {pr.qty} Unit
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-sm">
                          Rp {pr.estimated_cost.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-normal uppercase tracking-wider ${
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
                            className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-normal border inline-flex items-center gap-1 ${
                              isPending
                                ? isLight
                                  ? 'bg-amber-200 border border-amber-400 text-amber-950 text-[10px]'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {isPending && <Clock className="w-3 h-3 text-amber-400" />}
                            <span>{pr.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isPending ? (
                            <span
                              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1 cursor-default"
                              title="Menunggu persetujuan manajerial di modul Executive"
                            >
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Menunggu Approval</span>
                            </span>
                          ) : pr.status === 'REJECTED' || pr.status === 'Rejected' || pr.status === 'Ditolak' ? (
                            <span
                              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1 cursor-default"
                              title="Purchase Request telah ditolak"
                            >
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>Ditolak</span>
                            </span>
                          ) : pr.status === 'Converted to PO' ? (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-cyan-400 font-medium bg-cyan-500/10 border border-cyan-500/20 inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-cyan-400" />
                              <span>Sudah Jadi PO</span>
                            </span>
                          ) : (
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
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-md inline-flex items-center gap-1.5 active:scale-[0.99]"
                              title="Proses PO"
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

        {/* TAB 2: RIWAYAT GOODS RECEIPT */}
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
                    <span className={`font-medium text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Purchase Order Siap Diterima (Status APPROVED):
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-normal bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {approvedPOs.length} PO
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {approvedPOs.map((po) => (
                    <div
                      key={`gr-tab-po-${po.po_number}`}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all hover:-translate-y-0.5 ${
                        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#161b22] border-[#30363d]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-sky-400 text-xs">{po.po_number}</span>
                          <span className="text-[10px] font-normal text-gray-400">{po.supplier_name}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 truncate max-w-xs">{po.items}</div>
                        <div className="text-[10px] font-mono text-emerald-400 font-semibold mt-0.5">
                          Rp {po.total_amount.toLocaleString('id-ID')}
                        </div>
                      </div>

                      <button
                        type="button"
                        id={`btn-gr-tab-create-${po.po_number}`}
                        onClick={() => openGoodsReceiptModal(po)}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition shadow-sm cursor-pointer shrink-0 active:scale-[0.99]"
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
                className={`font-mono font-normal tracking-widest uppercase text-[11px] leading-4 border-b ${
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
                    <td colSpan={8} className="py-8 text-center text-gray-500 font-normal">
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
                      <td className="py-3 px-4 font-mono font-medium text-emerald-400">
                        {gr.id}
                      </td>
                      <td className="py-3 px-4 text-gray-400 font-mono text-[11px] font-normal">
                        {gr.receivedDate}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-medium text-sky-400">{gr.poNumber}</div>
                        <div className="text-[11px] text-amber-300 font-mono font-normal">
                          DO: {gr.deliveryOrderNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{gr.vendorName}</td>
                      <td className="py-3 px-4 text-gray-300 text-[11px] font-normal">
                        {gr.receivedByUserId}
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <div className="space-y-1">
                          {gr.items.map((item, itIdx) => (
                            <div key={itIdx} className="text-[11px] flex items-center justify-between gap-2">
                              <span className="truncate font-normal">{item.productName}:</span>
                              <span className="font-mono font-semibold text-emerald-400 shrink-0">
                                +{item.acceptedQty} {item.unit}
                              </span>
                              {item.rejectedQty > 0 && (
                                <span className="font-mono font-semibold text-rose-400 shrink-0">
                                  (Reject: {item.rejectedQty})
                                </span>
                              )}
                            </div>
                          ))}
                          {gr.notes && (
                            <div className="text-[10px] text-gray-400 italic font-normal">
                              Ket: {gr.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-mono font-normal px-2.5 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-400 border-emerald-500/30 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>TERVERIFIKASI</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const existingReturns = (purchaseReturns || []).filter(
                            (r) => r.grId === gr.id || r.poNumber === gr.poNumber
                          );
                          return (
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedGrForReturn(gr)}
                                className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 font-medium px-3 py-1.5 rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-[0.99]"
                                title="Buat Retur Pembelian & Terbitkan Nota Debit"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Buat Retur Pembelian</span>
                              </button>
                              {existingReturns.length > 0 && (
                                <span className="text-[9px] font-mono text-emerald-400 font-normal">
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

        {/* TAB 3: REKAP TAGIHAN VENDOR */}
        {activePurchasingTab === 'invoices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`font-mono font-normal tracking-widest uppercase text-[11px] leading-4 border-b ${
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
                          className="font-medium text-sky-400 hover:underline cursor-pointer flex items-center gap-1 active:scale-[0.99]"
                        >
                          <span>{po.po_number}</span>
                          <Eye className="w-3 h-3 opacity-60" />
                        </button>
                        <div className="text-[10px] text-gray-400 font-normal mt-0.5">{po.date}</div>
                        {po.debit_notes && po.debit_notes.length > 0 && (
                          <div className="text-[9px] font-mono text-rose-400 mt-0.5 font-normal">
                            ND: {po.debit_notes.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{po.supplier_name}</div>
                        <div className="text-[10px] text-gray-400 font-normal truncate max-w-xs">{po.items}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-amber-400 font-medium">{po.payment_term || 'Tempo 30 Hari'}</div>
                        <div className="text-[10px] font-mono mt-0.5">
                          <span className={isOverdue ? 'text-rose-400 font-medium' : 'text-gray-400 font-normal'}>
                            JT: {po.due_date || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-300 font-normal">
                        Rp {po.total_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {returnAmount > 0 ? (
                          <span className="font-semibold text-rose-400">
                            -Rp {returnAmount.toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-gray-500 font-normal">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400 text-xs">
                        Rp {netPayable.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-normal px-2.5 py-0.5 rounded-full text-[10px] ${
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
                              ? 'px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition cursor-pointer active:scale-[0.99]'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3 py-1 rounded inline-flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-[0.99]'
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

      {/* MODAL 1: FORM BUAT PURCHASE ORDER */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className={`w-full max-w-2xl rounded-2xl p-6 relative border my-8 flex flex-col max-h-[92vh] ${
              isLight
                ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-800'
                : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-gray-200'
            }`}
          >
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer active:scale-[0.99]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-[#30363d] shrink-0">
              <div className="w-10 h-10 rounded-xl bg-[#0052FF]/20 text-[#0052FF] flex items-center justify-center">
                <FilePlus2 className="w-5 h-5" />
              </div>
              <div>
                <h3
                  className={`font-medium text-base leading-6 ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Penerbitan Dokumen Purchase Order (PO)
                </h3>
                <p className="text-xs text-gray-400 font-normal">
                  Formulir pengadaan barang modal resmi ke supplier terdaftar.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 space-y-4 text-xs pr-1">
              <div>
                <label className="font-medium text-gray-300 block mb-1">
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-gray-400 block mb-1">
                      Pilih Produk Katalog
                    </label>
                    <SearchableProductCombobox
                      products={products}
                      selectedId={tempProductId}
                      onSelect={(id) => {
                        setTempProductId(id);
                        const p = products.find((prod) => prod.id === id);
                        if (p) {
                          setTempUnitCost(p.cost_price || 500000);
                          setTempUnit(p.unit || 'Sak');
                        }
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">
                      Satuan Beli
                    </label>
                    <select
                      value={tempUnit}
                      onChange={(e) => {
                        const nextUnit = e.target.value;
                        setTempUnit(nextUnit);
                        const p = products.find((prod) => prod.id === tempProductId);
                        if (p && p.cost_price) {
                          if (nextUnit === 'Ret Dump Truck') {
                            setTempUnitCost(Math.round(p.cost_price * 6.5));
                          } else if (nextUnit === 'Ret Truk Engkel') {
                            setTempUnitCost(Math.round(p.cost_price * 3.0));
                          } else if (nextUnit === 'Ret Pick-up') {
                            setTempUnitCost(Math.round(p.cost_price * 1.2));
                          } else {
                            setTempUnitCost(p.cost_price);
                          }
                        }
                      }}
                      className="w-full px-2 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-cyan-300 text-xs font-mono font-bold outline-none"
                    >
                      {Array.from(
                        new Set([
                          products.find((p) => p.id === tempProductId)?.unit || 'Sak',
                          ...BUILDING_PURCHASE_UNIT_OPTIONS,
                          'Unit',
                          'Pcs',
                          'Box',
                          'Karton',
                        ])
                      ).map((u) => (
                        <option key={u} value={u}>
                          {u}
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
                    className="px-3 py-1.5 rounded-lg bg-[#0052FF] hover:bg-[#0043d1] text-white font-medium text-xs flex items-center gap-1 transition cursor-pointer active:scale-[0.99]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Item ke PO</span>
                  </button>
                </div>

                <div className="mt-3 border rounded-lg overflow-hidden border-[#30363d]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/30 text-gray-400 text-[10px] uppercase font-mono font-normal tracking-wider border-b border-[#30363d]">
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
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-[10px] text-gray-400 font-mono font-normal">
                              {item.productId}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-normal">
                            {item.qty} {item.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-normal">
                            Rp {item.unitCost.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-400">
                            Rp {item.subtotal.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePoLineItem(idx)}
                              className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer active:scale-[0.99]"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-gray-300 block mb-1">
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
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-medium ${
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
                  <label className="font-medium text-gray-300 block mb-1">
                    Tanggal Jatuh Tempo Tagihan
                  </label>
                  <input
                    type="date"
                    value={createDueDate}
                    onChange={(e) => setCreateDueDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-mono font-normal ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF]'
                        : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                    }`}
                  />
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border space-y-2 ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-200">
                    <input
                      type="checkbox"
                      checked={createIncludePpn}
                      onChange={(e) => setCreateIncludePpn(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0052FF] focus:ring-0 cursor-pointer"
                    />
                    <span>Kenakan PPN 11% (Pajak Pertambahan Nilai)</span>
                  </label>
                  <span className="text-[11px] text-gray-400 font-normal">
                    Tarif resmi UU HPP 11%
                  </span>
                </div>

                <div className="pt-2 border-t border-[#30363d]/50 space-y-1 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal Barang:</span>
                    <span className="font-mono text-gray-200 font-normal">
                      Rp {createSubtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>PPN 11%:</span>
                    <span className="font-mono text-gray-200 font-normal">
                      Rp {createPpnAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-gray-700">
                    <span className="text-white font-medium">Total Nilai Purchase Order:</span>
                    <span className="font-mono text-emerald-400 font-semibold text-base">
                      Rp {createGrandTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-medium text-gray-300 block mb-1">
                  Catatan Tambahan / Instruksi Vendor (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Instruksi packing, kontak penerima gudang, dll..."
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-normal ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF]'
                      : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                  }`}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#30363d] flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#21262d] text-gray-300 hover:bg-[#30363d] transition font-medium cursor-pointer active:scale-[0.99]"
              >
                Batal
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCreatePOSubmit('Draft')}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer active:scale-[0.99]"
                >
                  Simpan sebagai Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleCreatePOSubmit('Menunggu Approval Pimpinan')}
                  className="px-4 py-2 rounded-xl bg-[#0052FF] hover:bg-[#0043d1] text-white font-medium shadow-[0_0_12px_rgba(0,82,255,0.4)] transition cursor-pointer active:scale-[0.99]"
                >
                  Terbitkan & Ajukan Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Goods Receipt */}
      <GoodsReceiptModal
        isOpen={isGrModalOpen}
        po={selectedPoForGr}
        onClose={() => {
          setIsGrModalOpen(false);
          setSelectedPoForGr(null);
        }}
        isLight={isLight}
      />

      {/* Modal Print PO */}
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

      {/* Modal Detail PO */}
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

      {/* Modal Pembayaran Supplier */}
      {selectedPoForPayment && (
        <SupplierPaymentModal
          po={selectedPoForPayment}
          onClose={() => setSelectedPoForPayment(null)}
          onConfirmPayment={(poNum, st, details) => {
            updatePurchaseOrderPayment(poNum, st, details);

            // Audit Trail Pencatatan Pelunasan Tagihan Supplier
            recordAudit({
              traceId: `PAY-PO-${Date.now()}`,
              userId: activeUser?.id || 'purchasing-finance',
              userName: activeUser?.name || 'Staff Purchasing/Finance',
              userRole: activeUser?.role || 'Finance/Purchasing',
              module: 'PURCHASING',
              action: 'PURCHASE_ORDER_PAYMENT',
              severity: 'CRITICAL',
              entityId: poNum,
              payloadAfter: {
                poNumber: poNum,
                paymentStatus: st,
                paymentDetails: details || null,
              },
            });
          }}
          isLight={isLight}
        />
      )}

      {/* Modal Retur Pembelian */}
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

      {/* Modal Ringkasan Auto PO */}
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