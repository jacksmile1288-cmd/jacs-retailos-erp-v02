import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAudit } from '../../audit';
import { PurchaseOrder, StockMutation, BuildingDeliveryStatus } from '../../types';
import { BUILDING_HARDWARE_PRODUCTS } from '../../data/industryTerminalProducts';
import {
  filterProductsByBusinessDomain,
  filterInventoryByBusinessDomain,
  filterMutationsByBusinessDomain,
  filterPurchaseOrdersByBusinessDomain,
  filterPurchaseRequestsByBusinessDomain,
} from '../../utils/buildingDomainIsolation';
import { AutoPoSummaryModal } from '../purchasing/AutoPoSummaryModal';
import { GoodsReceiptModal } from '../purchasing/GoodsReceiptModal';
import { StockAlertTab } from './StockAlertTab';
import { StockOpnameModal } from './StockOpnameModal';
import { SearchableProductCombobox } from '../common/SearchableProductCombobox';
import {
  Boxes,
  AlertTriangle,
  ArrowUpDown,
  Search,
  Plus,
  X,
  Layers,
  ShoppingBag,
  ExternalLink,
  History,
  ClipboardList,
  ClipboardCheck,
  Zap,
  PackageCheck,
  CheckCircle2,
  Truck,
  Scale,
} from 'lucide-react';

export const WarehouseModule: React.FC = () => {
  const {
    inventory,
    setInventory,
    stockMutations,
    setStockMutations,
    products,
    setProducts,
    adjustStock,
    setActiveNav,
    purchasing,
    purchaseRequests,
    getProductAlertThreshold,
    createAutoReorderPO,
    reorderAllLowStock,
    theme,
    language,
    activeNeonCards,
    setActiveNeonCard,
    badStockItems,
    activeUser,
    showToast,
    businessDomainConfig,
    activeSector,
    isFnb,
    isFashion,
    isBuilding,
    isService,
    isRetail,
    buildingDeliveryOrders,
    updateBuildingDeliveryStatus,
    bulkShrinkageLogs,
    recordBulkShrinkage,
    goodsReceipts,
  } = useApp();

  const { recordAudit } = useAudit();

  const isLight = theme === 'light';
  const isEn = language === 'en';
  const isBuildingBulkActive = isBuilding;

  const [activeWarehouseTab, setActiveWarehouseTab] = useState<'inventory' | 'stock_alert' | 'mutations' | 'bad_stock' | 'grn' | 'stock_opname' | 'fleet_do'>('inventory');

  useEffect(() => {
    if (!isBuilding && activeWarehouseTab === 'fleet_do') {
      setActiveWarehouseTab('inventory');
    }
  }, [isBuilding, activeSector, activeWarehouseTab]);
  void isFnb;
  void isFashion;
  void isService;
  void isRetail;
  const [doStatusFilter, setDoStatusFilter] = useState<'ALL' | BuildingDeliveryStatus>('ALL');
  const [shrinkProductId, setShrinkProductId] = useState<string>('MAT-PASIR-01');
  const [shrinkQtyInput, setShrinkQtyInput] = useState<string>('0.5');
  const [shrinkReason, setShrinkReason] = useState<string>('Susut penguapan air & tercecer saat pemuatan curah');

  const buildingBulkMaterials = useMemo(() => {
    const map = new Map<string, any>();
    BUILDING_HARDWARE_PRODUCTS.forEach((p) => map.set(p.id, p));
    (products || []).forEach((p) => {
      if (p.businessModel === 'building' || (p.id || '').startsWith('MAT-') || Boolean(p.materialNature)) {
        map.set(p.id, p);
      }
    });
    return Array.from(map.values());
  }, [products]);

  const activeDoCount = useMemo(
    () => (buildingDeliveryOrders || []).filter((d) => d.status !== 'TERKIRIM_PROYEK').length,
    [buildingDeliveryOrders]
  );
  const domainProducts = useMemo(
    () => filterProductsByBusinessDomain(products || [], businessDomainConfig),
    [products, businessDomainConfig]
  );

  const domainInventory = useMemo(
    () => filterInventoryByBusinessDomain(inventory || [], products || [], businessDomainConfig),
    [inventory, products, businessDomainConfig]
  );

  const domainMutations = useMemo(
    () => filterMutationsByBusinessDomain(stockMutations || [], products || [], businessDomainConfig),
    [stockMutations, products, businessDomainConfig]
  );

  const domainPurchasing = useMemo(
    () => filterPurchaseOrdersByBusinessDomain(purchasing || [], businessDomainConfig),
    [purchasing, businessDomainConfig]
  );

  const domainPurchaseRequests = useMemo(
    () => filterPurchaseRequestsByBusinessDomain(purchaseRequests || [], businessDomainConfig),
    [purchaseRequests, businessDomainConfig]
  );

  const [opnamePhysicalStocks, setOpnamePhysicalStocks] = useState<Record<string, number>>({});
  const [opnameReasons, setOpnameReasons] = useState<Record<string, string>>({});
  const [isStockOpnameOpen, setIsStockOpnameOpen] = useState(false);
  const [selectedProductForOpname, setSelectedProductForOpname] = useState<typeof products[0] | null>(null);
  const [mutationTypeFilter, setMutationTypeFilter] = useState<'ALL' | 'SALE-POS' | 'RESTOCK-PO' | 'ADJ-LOSS' | 'ADJ-GAIN' | 'IN_GR' | 'OUT_KASIR' | 'IN_RETURN' | 'OPENING_STOCK_MIGRATION' | 'IN' | 'OUT'>('ALL');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(
    domainProducts[0]?.id || products[0]?.id || ''
  );

  useEffect(() => {
    if (domainProducts.length > 0 && !domainProducts.some((p) => p.id === selectedProductId)) {
      setSelectedProductId(domainProducts[0].id);
    }
  }, [domainProducts, selectedProductId]);

  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustQty, setAdjustQty] = useState(5);
  const [adjustReason, setAdjustReason] = useState(
    'Stock Opname Koreksi Fisik'
  );
  const [summaryModalPOs, setSummaryModalPOs] = useState<PurchaseOrder[] | null>(null);
  const [isGrModalOpen, setIsGrModalOpen] = useState(false);
  const [selectedPoForGr, setSelectedPoForGr] = useState<PurchaseOrder | null>(null);

  const approvedPOs = useMemo(() => {
    return (domainPurchasing || []).filter((po) => {
      const s = (po.status || '').toLowerCase();
      const isPaid = po.payment_status === 'Lunas' || po.payment_status === 'PAID';
      const isFinished =
        s.includes('receiv') ||
        s.includes('diterima penuh') ||
        s.includes('selesai') ||
        s.includes('completed') ||
        s.includes('closed') ||
        s.includes('cancel') ||
        s.includes('reject');

      if (isFinished || isPaid) return false;

      // Cek apakah seluruh item_details sudah 100% diterima
      const details = po.item_details || [];
      if (details.length > 0) {
        const allReceivedFromDetails = details.every(
          (d) => (Number(d.received_qty) || 0) >= (Number(d.qty) || 0) && (Number(d.qty) || 0) > 0
        );
        if (allReceivedFromDetails) return false;

        // Sinkronisasi tambahan terhadap daftar GRN terverifikasi untuk PO ini
        const totalOrdered = details.reduce((sum, d) => sum + (Number(d.qty) || 0), 0);
        const totalGrAccepted = (goodsReceipts || [])
          .filter(
            (gr) =>
              gr.status !== 'CANCELLED' &&
              (gr.poNumber === po.po_number || gr.poId === po.po_number)
          )
          .reduce(
            (sum, gr) =>
              sum + (gr.items || []).reduce((s, it) => s + (Number(it.acceptedQty) || 0), 0),
            0
          );
        if (totalOrdered > 0 && totalGrAccepted >= totalOrdered) return false;
      }

      return (
        s.includes('approv') ||
        s.includes('disetujui') ||
        s.includes('dipesan') ||
        s.includes('sent') ||
        s.includes('partial')
      );
    });
  }, [domainPurchasing, goodsReceipts]);

  const handleReorderAll = () => {
    const res = reorderAllLowStock();
    if (res.pos && res.pos.length > 0) {
      setSummaryModalPOs(res.pos);
    }
  };

  const handleSaveStockOpnameBatch = () => {
    const timeStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const dateStr = new Date().toISOString().slice(0, 10);
    let updatedCount = 0;
    const newMutations: StockMutation[] = [];

    domainProducts.forEach((p) => {
      const physical = opnamePhysicalStocks[p.id] !== undefined ? opnamePhysicalStocks[p.id] : p.stock;
      const systemStock = p.stock;
      const difference = physical - systemStock;

      if (difference !== 0) {
        updatedCount++;
        const mutationType = difference < 0 ? 'ADJ-LOSS' : 'ADJ-GAIN';
        const reasonNote = opnameReasons[p.id] || (difference < 0 ? 'rusak / hilang' : 'salah hitung / surplus');

        const newStock = Math.max(0, physical);
        const thresholdInfo = getProductAlertThreshold(p);
        const effectiveMinStock = p.minStock ?? p.min_stock ?? thresholdInfo.minStock ?? 10;
        let newStatus = p.status;
        if (newStock <= 0) newStatus = 'Out of Stock';
        else if (newStock <= effectiveMinStock || thresholdInfo.isLowStock) newStatus = 'Low Stock';
        else newStatus = 'Active';

        setProducts((prev) =>
          prev.map((prod) => (prod.id === p.id ? { ...prod, stock: newStock, status: newStatus } : prod))
        );

        setInventory((prev) =>
          prev.map((inv) => {
            if (inv.product_id === p.id) {
              const inQty = difference > 0 ? inv.in_qty + difference : inv.in_qty;
              const outQty = difference < 0 ? inv.out_qty + Math.abs(difference) : inv.out_qty;
              return {
                ...inv,
                in_qty: inQty,
                out_qty: outQty,
                final_stock: newStock,
                last_update: timeStr,
              };
            }
            return inv;
          })
        );

        newMutations.push({
          id: `MUT-OPN-${Date.now()}-${p.id}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: timeStr,
          date: dateStr,
          product_id: p.id,
          sku: p.sku || p.barcode || p.id,
          product_name: p.name,
          type: mutationType,
          qty: Math.abs(difference),
          previous_stock: systemStock,
          final_stock: newStock,
          balanceAfter: newStock,
          reference_no: `OPN-${dateStr.replace(/-/g, '')}`,
          referenceId: `OPN-${p.id}`,
          notes: reasonNote,
          operator: `${activeUser?.name || 'Staf Gudang'} (${activeUser?.role || 'Inventory Staff'})`,
          warehouse: p.rackLocation || 'GD001 - Gudang Utama',
        });

        // Audit Trail Entry untuk Tiap Perubahan Opname
        recordAudit({
          traceId: `OPN-${dateStr.replace(/-/g, '')}`,
          userId: activeUser?.id || 'warehouse-opname',
          userName: activeUser?.name || 'Staf Gudang',
          userRole: activeUser?.role || 'Inventory Staff',
          module: 'WAREHOUSE',
          action: 'STOCK_ADJUSTMENT',
          severity: Math.abs(difference) > 20 ? 'CRITICAL' : 'WARN',
          entityId: p.sku || p.id,
          payloadBefore: {
            stock: systemStock,
            productName: p.name,
          },
          payloadAfter: {
            stock: newStock,
            difference: difference,
            reason: reasonNote,
          },
        });
      }
    });

    if (newMutations.length > 0) {
      setStockMutations((prev) => [...newMutations, ...prev]);
    }

    showToast(isEn ? `Stock Opname saved: ${updatedCount} items adjusted successfully!` : `Stock Opname berhasil disimpan: ${updatedCount} item disesuaikan!`);
  };

  const lowStockProducts = useMemo(() => {
    return domainProducts.filter((p) => {
      const thresholdInfo = getProductAlertThreshold(p);
      const minStock = p.minStock ?? p.min_stock ?? thresholdInfo.minStock ?? 10;
      return (
        p.stock <= minStock ||
        p.status === 'Low Stock' ||
        p.status === 'Out of Stock' ||
        thresholdInfo.isLowStock
      );
    });
  }, [domainProducts, getProductAlertThreshold]);

  const totalPhysicalUnits = useMemo(() => {
    return Number(domainProducts.reduce((acc, p) => acc + (Number(p.stock) || 0), 0).toFixed(2));
  }, [domainProducts]);

  const activePendingPOs = useMemo(() => {
    return (domainPurchasing || []).filter((po) => {
      const s = (po.status || '').toLowerCase();
      const isFinished =
        s.includes('receiv') ||
        s.includes('diterima penuh') ||
        s.includes('selesai') ||
        s.includes('completed') ||
        s.includes('closed') ||
        s.includes('cancel') ||
        s.includes('reject');
      if (isFinished) return false;

      const details = po.item_details || [];
      if (details.length > 0) {
        const allReceivedFromDetails = details.every(
          (d) => (Number(d.received_qty) || 0) >= (Number(d.qty) || 0) && (Number(d.qty) || 0) > 0
        );
        if (allReceivedFromDetails) return false;

        const totalOrdered = details.reduce((sum, d) => sum + (Number(d.qty) || 0), 0);
        const totalGrAccepted = (goodsReceipts || [])
          .filter(
            (gr) =>
              gr.status !== 'CANCELLED' &&
              (gr.poNumber === po.po_number || gr.poId === po.po_number)
          )
          .reduce(
            (sum, gr) =>
              sum + (gr.items || []).reduce((s, it) => s + (Number(it.acceptedQty) || 0), 0),
            0
          );
        if (totalOrdered > 0 && totalGrAccepted >= totalOrdered) return false;
      }

      return true;
    });
  }, [domainPurchasing, goodsReceipts]);

  const totalPoValue = useMemo(() => {
    return activePendingPOs.reduce((acc, po) => {
      const poTotal = Number(po.total_amount) || 0;
      const receivedVal = (goodsReceipts || [])
        .filter(
          (gr) =>
            gr.status !== 'CANCELLED' &&
            (gr.poNumber === po.po_number || gr.poId === po.po_number)
        )
        .reduce((sum, gr) => {
          if (typeof gr.totalAmount === 'number' && gr.totalAmount > 0) return sum + gr.totalAmount;
          return (
            sum +
            (gr.items || []).reduce(
              (s, it) =>
                s + (Number(it.totalCost) || (Number(it.acceptedQty) || 0) * (Number(it.unitCost) || 0)),
              0
            )
          );
        }, 0);
      return acc + Math.max(0, poTotal - receivedVal);
    }, 0);
  }, [activePendingPOs, goodsReceipts]);

  const activePRCount = domainPurchaseRequests.filter((pr) => {
    const st = String(pr.status || '').toUpperCase();
    return st === 'PENDING APPROVAL' || st === 'PENDING' || st === 'PENDING_APPROVAL';
  }).length;

  const filteredInventory = domainInventory.filter((inv) => {
    const q = searchQuery.toLowerCase();
    const p = domainProducts.find((prod) => prod.id === inv.product_id);
    const pName = p?.name || inv.product_name || '';
    return (
      inv.product_id.toLowerCase().includes(q) ||
      pName.toLowerCase().includes(q)
    );
  });

  const isSalePosMutation = (m: StockMutation) => {
    const t = String(m.type || '').toUpperCase().trim();
    return (
      t === 'SALE-POS' ||
      t === 'OUT / KASIR' ||
      t === 'OUT_SALES' ||
      t === 'OUT / RESEP BOM' ||
      t === 'OUT / TOPPING BOM' ||
      t.includes('RESEP BOM') ||
      t.includes('TOPPING BOM')
    );
  };

  const isRestockPoMutation = (m: StockMutation) => {
    const t = String(m.type || '').toUpperCase().trim();
    return (
      t === 'RESTOCK-PO' ||
      t === 'IN / GOODS_RECEIPT' ||
      t === 'IN / RECEIVING PO' ||
      t === 'IN_PURCHASE' ||
      t === 'IN / PO DAPUR' ||
      t.includes('PURCHASE') ||
      t.includes('GOODS_RECEIPT') ||
      t.includes('RECEIVING PO') ||
      t.includes('PO DAPUR')
    );
  };

  const isAdjLossMutation = (m: StockMutation) => {
    const t = String(m.type || '').toUpperCase().trim();
    return t === 'ADJ-LOSS' || t === 'OUT';
  };

  const isAdjGainMutation = (m: StockMutation) => {
    const t = String(m.type || '').toUpperCase().trim();
    return t === 'ADJ-GAIN' || t === 'IN';
  };

  const isInboundMutation = (m: StockMutation) => {
    const t = String(m.type || '').toUpperCase().trim();
    return (
      t === 'IN' ||
      t.startsWith('IN ') ||
      t.startsWith('IN/') ||
      t.startsWith('IN_') ||
      t === 'RESTOCK-PO' ||
      t === 'ADJ-GAIN' ||
      t.includes('PO DAPUR') ||
      t.includes('GOODS_RECEIPT') ||
      t.includes('RECEIVING PO') ||
      t.includes('PURCHASE') ||
      t.includes('IN_RETURN') ||
      t === 'OPENING_STOCK_MIGRATION'
    );
  };

  const filteredMutations = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return (domainMutations || []).filter((m) => {
      const mutDate = (m.timestamp || m.date || '').slice(0, 10);
      if (startDateFilter && mutDate && mutDate < startDateFilter) return false;
      if (endDateFilter && mutDate && mutDate > endDateFilter) return false;

      const matchSearch =
        m.product_id.toLowerCase().includes(q) ||
        m.product_name.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q) ||
        m.reference_no.toLowerCase().includes(q) ||
        (m.referenceId || '').toLowerCase().includes(q) ||
        (m.warehouse || '').toLowerCase().includes(q) ||
        (m.notes || '').toLowerCase().includes(q) ||
        (m.operator || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (mutationTypeFilter === 'SALE-POS') {
        return isSalePosMutation(m);
      }
      if (mutationTypeFilter === 'RESTOCK-PO') {
        return isRestockPoMutation(m);
      }
      if (mutationTypeFilter === 'ADJ-LOSS') {
        return isAdjLossMutation(m);
      }
      if (mutationTypeFilter === 'ADJ-GAIN') {
        return isAdjGainMutation(m);
      }
      if (mutationTypeFilter === 'OPENING_STOCK_MIGRATION') {
        return m.type === 'OPENING_STOCK_MIGRATION' || m.type === 'ROLLBACK_MIGRATION';
      }
      if (mutationTypeFilter === 'IN_GR') {
        return isRestockPoMutation(m) || m.type.toUpperCase().includes('RESTOCK');
      }
      if (mutationTypeFilter === 'OUT_KASIR') {
        return isSalePosMutation(m);
      }
      if (mutationTypeFilter === 'IN_RETURN') {
        return m.type.toUpperCase().includes('IN_RETURN');
      }
      if (mutationTypeFilter === 'IN') {
        return isInboundMutation(m);
      }
      if (mutationTypeFilter === 'OUT') {
        return !isInboundMutation(m);
      }
      return true;
    });
  }, [domainMutations, searchQuery, mutationTypeFilter, startDateFilter, endDateFilter]);

  const filteredBadStock = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (badStockItems || []).filter((item) => {
      if (!q) return true;
      return (
        item.id.toLowerCase().includes(q) ||
        item.productId.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.conditionReason.toLowerCase().includes(q) ||
        item.sourceReference.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
      );
    });
  }, [badStockItems, searchQuery]);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProd = domainProducts.find((p) => p.id === selectedProductId) || products.find((p) => p.id === selectedProductId);
    const prevStock = targetProd ? targetProd.stock : 0;
    const delta = adjustType === 'IN' ? Math.abs(adjustQty) : -Math.abs(adjustQty);

    adjustStock(selectedProductId, delta, adjustReason);

    // Audit Trail Rekaman Penyesuaian Manual
    recordAudit({
      traceId: `MAN-ADJ-${Date.now()}`,
      userId: activeUser?.id || 'warehouse-adjust',
      userName: activeUser?.name || 'Staf Gudang',
      userRole: activeUser?.role || 'Inventory Staff',
      module: 'WAREHOUSE',
      action: 'STOCK_ADJUSTMENT',
      severity: adjustType === 'OUT' ? 'WARN' : 'INFO',
      entityId: selectedProductId,
      payloadBefore: {
        stock: prevStock,
        productName: targetProd?.name || selectedProductId,
      },
      payloadAfter: {
        stock: Math.max(0, prevStock + delta),
        delta: delta,
        adjustType: adjustType,
        reason: adjustReason,
      },
    });

    setIsAdjustModalOpen(false);
  };

  const warehouseCards = [
    {
      id: 'sku-stock',
      title: isEn ? 'Total SKU & Stock' : 'Total SKU & Stok',
      shortTitle: isEn ? 'Total SKU' : 'Total SKU',
      value: `${domainProducts.length} SKU (${totalPhysicalUnits.toLocaleString('id-ID')} ${isBuildingBulkActive ? 'Unit/m³' : 'Pcs'})`,
      sub: isBuildingBulkActive
        ? 'Katalog Material Bangunan & Yard Curah Aktif'
        : isEn
        ? 'Warehouse Capacity 88% Optimal'
        : 'Kapasitas Gudang 88% Optimal',
      colorHex: '#38bdf8',
      icon: Boxes,
    },
    {
      id: 'low-stock',
      title: isEn ? 'Low Stock Alert' : 'Peringatan Stok Rendah',
      shortTitle: isEn ? 'Low Stock' : 'Stok Rendah',
      value: `${lowStockProducts.length} SKU ${isEn ? 'Critical' : 'Kritis'}`,
      sub: isBuildingBulkActive
        ? 'Batas Minimum Safety Stock Material Depo'
        : isEn
        ? 'Safety stock threshold <= 10 units'
        : 'Batas Minimum <= 10 Unit Gudang',
      colorHex: '#f59e0b',
      icon: AlertTriangle,
    },
    {
      id: 'po-value',
      title: isEn ? 'PO & Active PR Value' : 'Nilai PO & PR Berjalan',
      shortTitle: isEn ? 'PO & PR' : 'Nilai PO & PR',
      value: `Rp ${totalPoValue.toLocaleString('id-ID')}`,
      sub: `${activePendingPOs.length} PO Terbit • ${activePRCount} PR Pending`,
      colorHex: '#8b5cf6',
      icon: ShoppingBag,
    },
  ];

  const selectedCardId = activeNeonCards['warehouse'] || 'sku-stock';
  const selectedWarehouseCard =
    warehouseCards.find((c) => c.id === selectedCardId) || warehouseCards[0];

  return (
    <div id="warehouse-module" className="space-y-5 max-w-7xl mx-auto pb-6 font-sans">
      {/* Header */}
      <div
        className={`p-5 rounded-2xl border transition-all duration-200 ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest uppercase border ${
                isLight
                  ? 'bg-cyan-50 border-cyan-500/60 text-cyan-800'
                  : 'bg-cyan-500/10 border-cyan-500/35 text-cyan-300'
              }`}>
                <Layers className="w-3.5 h-3.5" />
                <span>{isEn ? 'Warehouse & Inventory Control' : 'Manajemen Gudang & Kontrol Stok'}</span>
              </div>

              <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest uppercase border ${
                isLight
                  ? 'bg-emerald-50 border-emerald-500/60 text-emerald-700'
                  : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>ONLINE — SYNCED</span>
              </div>
            </div>

            <h2
              className={`text-xl font-medium tracking-tight ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}
            >
              {isEn ? 'Warehouse & Realtime Inventory' : 'Warehouse & Manajemen Stok Realtime'}
            </h2>
            <p className={`text-sm font-normal truncate mt-0.5 ${isLight ? 'text-slate-600' : 'text-[#8b949e]'}`}>
              {isEn
                ? 'Monitoring inbound/outbound goods movements, stock ledger, and inventory sync.'
                : 'Monitoring pergerakan barang masuk/keluar, kartu stok, dan sinkronisasi DB_Inventory.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-normal shrink-0 ${
                isLight
                  ? 'bg-white border-cyan-500/50 text-slate-800'
                  : 'bg-[#0d1117] border-cyan-500/30 text-slate-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: selectedWarehouseCard.colorHex }}
              />
              <span className={`text-[11px] font-mono font-normal tracking-widest uppercase shrink-0 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Fokus:
              </span>
              <span className={`font-medium text-sm truncate max-w-[130px] sm:max-w-[200px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {selectedWarehouseCard.shortTitle || selectedWarehouseCard.title}
              </span>
            </div>

            <button
              id="btn-open-stock-opname"
              type="button"
              onClick={() => {
                setSelectedProductForOpname(null);
                setIsStockOpnameOpen(true);
              }}
              className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.99] border ${
                isLight
                  ? 'bg-white hover:bg-cyan-50 border-cyan-500/60 text-slate-800 shadow-[0_0_12px_rgba(6,182,212,0.12)]'
                  : 'bg-teal-600 hover:bg-teal-500 text-white border-teal-500/40'
              }`}
            >
              <ClipboardCheck className={`w-4 h-4 ${isLight ? 'text-cyan-600' : 'text-white'}`} />
              <span>Stock Opname</span>
            </button>

            <button
              onClick={() => setIsAdjustModalOpen(true)}
              className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                isLight
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-[0_0_14px_rgba(6,182,212,0.28)]'
                  : 'bg-[#0052FF] hover:bg-[#0043d1] text-white border border-blue-500/40'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>Mutasi Stok</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouseCards.map((card) => {
          const Icon = card.icon;
          const isSelected = selectedCardId === card.id;
          const isWarningCard = card.id === 'low-stock';
          const isCriticalActive = isWarningCard && lowStockProducts.length > 0;

          const cardThemeClass = isWarningCard
            ? isCriticalActive
              ? isLight
                ? 'border-rose-500/80 bg-rose-500/5 shadow-[0_0_18px_rgba(244,63,94,0.24)] hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(244,63,94,0.34)]'
                : 'border-rose-500/75 bg-rose-500/10 shadow-[0_0_18px_rgba(244,63,94,0.22)] hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(244,63,94,0.32)]'
              : isLight
              ? 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.22)] hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(245,158,11,0.32)]'
              : 'border-amber-500/70 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.18)] hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(245,158,11,0.28)]'
            : isLight
            ? `${isSelected ? 'bg-white border-cyan-500 ring-1 ring-cyan-500/40' : 'bg-white border-cyan-500/70'} shadow-[0_0_16px_rgba(6,182,212,0.16)] hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(6,182,212,0.28)]`
            : `${isSelected ? 'bg-[#161b22] border-cyan-400/70 ring-1 ring-cyan-400/30' : 'bg-[#161b22] border-cyan-500/35'} shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(6,182,212,0.28)]`;

          return (
            <button
              key={card.id}
              id={`warehouse-card-${card.id}`}
              type="button"
              onClick={() => {
                setActiveNeonCard('warehouse', card.id);
                if (card.id === 'low-stock') {
                  setActiveWarehouseTab('stock_alert');
                } else if (card.id === 'sku-stock') {
                  setActiveWarehouseTab('inventory');
                }
              }}
              className={`p-4 rounded-2xl border text-left cursor-pointer flex flex-col justify-between h-full transition-all duration-200 ${cardThemeClass}`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  {isCriticalActive && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  )}
                  <span
                    className={`text-[11px] font-mono font-normal uppercase tracking-widest truncate ${
                      isWarningCard
                        ? isCriticalActive
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-600 dark:text-amber-400'
                        : isLight
                        ? 'text-slate-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {card.title}
                  </span>
                </div>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    isWarningCard
                      ? isCriticalActive
                        ? isLight
                          ? 'bg-rose-50 text-rose-600 border-rose-300'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/35'
                        : isLight
                        ? 'bg-amber-50 text-amber-600 border-amber-300'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/35'
                      : isLight
                      ? 'bg-cyan-50 text-cyan-600 border-cyan-300'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-auto">
                <div
                  className={`text-lg font-mono font-medium tracking-tight ${
                    isWarningCard
                      ? isCriticalActive
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-amber-600 dark:text-amber-400'
                      : isLight
                      ? 'text-slate-950'
                      : 'text-white'
                  }`}
                >
                  {card.value}
                </div>
                <div className={`text-sm font-normal mt-1 truncate ${
                  isWarningCard
                    ? isCriticalActive
                      ? 'text-rose-600/90 dark:text-rose-300/90'
                      : 'text-amber-700/90 dark:text-amber-300/80'
                    : isLight
                    ? 'text-slate-600'
                    : 'text-slate-400'
                }`}>
                  {card.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Alert Banner: Low Stock */}
      {lowStockProducts.length > 0 && (
        <div
          id="warehouse-low-stock-alert-banner"
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-normal transition-all duration-200 ${
            isLight
              ? 'bg-rose-500/5 border-rose-500/80 text-rose-900 shadow-[0_0_18px_rgba(244,63,94,0.22)]'
              : 'bg-rose-500/10 border-rose-500/70 text-rose-200 shadow-[0_0_18px_rgba(244,63,94,0.18)]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`p-1.5 rounded-lg shrink-0 border ${
              isLight ? 'bg-rose-50 text-rose-600 border-rose-300' : 'bg-rose-500/15 text-rose-400 border-rose-500/35'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="font-medium shrink-0 text-rose-600 dark:text-rose-400">
                {isEn ? 'Low Stock Warning:' : 'Peringatan Stok Rendah:'}
              </span>
              <span className="font-mono font-medium text-sm shrink-0">
                {lowStockProducts.length} SKU {isEn ? 'below safety stock limit' : 'di bawah batas minimum'}
              </span>
              <span className={`text-sm font-normal truncate max-w-xs sm:max-w-md hidden md:inline ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                ({lowStockProducts.map((p) => p.name).slice(0, 3).join(', ')}
                {lowStockProducts.length > 3 ? `, +${lowStockProducts.length - 3} lainnya` : ''})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleReorderAll}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer active:scale-[0.99] shadow-xs ${
                isLight
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
              title="Buat draf PO otomatis dikelompokkan per Supplier"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isEn ? `Reorder (${lowStockProducts.length})` : `Reorder Semua (${lowStockProducts.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWarehouseTab('stock_alert')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-sm font-normal transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                isLight
                  ? 'bg-white hover:bg-rose-50 border-rose-300 text-rose-700'
                  : 'border-rose-500/40 hover:bg-rose-500/15 text-rose-300'
              }`}
            >
              <span>{isEn ? 'Detail Alert' : 'Detail Alert'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Banner Goods Receipt */}
      {approvedPOs.length > 0 && (
        <div
          id="warehouse-gr-ready-banner"
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-normal transition-all duration-200 ${
            isLight
              ? 'bg-emerald-50/70 border-emerald-500/75 text-emerald-950 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
              : 'bg-emerald-950/20 border-emerald-500/75 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`p-1.5 rounded-lg shrink-0 border ${
              isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35'
            }`}>
              <PackageCheck className="w-4 h-4" />
            </span>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-base font-medium ${isLight ? 'text-emerald-900' : 'text-emerald-400'}`}>
                  {isEn ? 'Goods Receipt Ready (PO Approved):' : 'Konfirmasi Penerimaan Barang (Goods Receipt PO):'}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono font-normal text-[11px] tracking-widest border ${
                  isLight
                    ? 'bg-white border-emerald-500/60 text-emerald-800'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>{approvedPOs.length} PO Siap Diterima Fisik</span>
                </span>
              </div>
              <p className={`text-sm font-normal truncate max-w-xl font-mono ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                {approvedPOs.map((p) => `${p.po_number} (${p.supplier_name})`).join(' • ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id={`btn-wh-open-gr-${approvedPOs[0].po_number}`}
              onClick={() => {
                setSelectedPoForGr(approvedPOs[0]);
                setIsGrModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all duration-200 cursor-pointer active:scale-[0.99] shadow-[0_0_14px_rgba(16,185,129,0.28)]"
              title="Konfirmasi fisik barang datang (Goods Receipt) ke stok gudang"
            >
              <PackageCheck className="w-4 h-4" />
              <span>{isEn ? `Receive Goods (${approvedPOs[0].po_number})` : `Terima Barang (${approvedPOs[0].po_number})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
        <input
          type="text"
          placeholder={isEn ? "Search warehouse items (SKU, Product Name, Ref No)..." : "Cari item gudang (SKU, Nama Produk, No Ref)..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-normal outline-none border transition-all duration-200 ${
            isLight
              ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] text-slate-900 focus:border-cyan-500'
              : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] text-white focus:border-cyan-400'
          }`}
        />
      </div>

      {/* Inventory Container */}
      <div
        className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
        }`}
      >
        {/* Navigation Tabs Header */}
        <div className={`p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLight ? 'border-cyan-500/30 bg-white' : 'border-cyan-500/20 bg-[#161b22]'
        }`}>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveWarehouseTab('inventory')}
              className={`px-3.5 py-2 rounded-xl text-sm font-normal flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] active:scale-[0.99] cursor-pointer border ${
                activeWarehouseTab === 'inventory'
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-[0_0_16px_rgba(6,182,212,0.28)]'
                  : isLight
                  ? 'bg-white border-cyan-500/50 text-slate-800 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                  : 'bg-[#0d1117] text-gray-300 border-cyan-500/30 hover:text-white'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>{isEn ? 'Realtime Stock Ledger (DB_Inventory)' : 'Kartu Stok Realtime (DB_Inventory)'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest ${
                activeWarehouseTab === 'inventory'
                  ? 'bg-white/20 text-white'
                  : isLight
                  ? 'bg-cyan-50 text-cyan-800 border border-cyan-300'
                  : 'bg-cyan-500/15 text-cyan-300'
              }`}>
                {filteredInventory.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWarehouseTab('mutations')}
              className={`px-3.5 py-2 rounded-xl text-sm font-normal flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] active:scale-[0.99] cursor-pointer border ${
                activeWarehouseTab === 'mutations'
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-[0_0_16px_rgba(6,182,212,0.28)]'
                  : isLight
                  ? 'bg-white border-cyan-500/50 text-slate-800 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                  : 'bg-[#0d1117] text-gray-300 border-cyan-500/30 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{isEn ? 'Stock Mutation History (Stock Card Audit)' : 'Riwayat Mutasi Barang (Stock Card Audit)'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest ${
                activeWarehouseTab === 'mutations'
                  ? 'bg-white/20 text-white'
                  : isLight
                  ? 'bg-cyan-50 text-cyan-800 border border-cyan-300'
                  : 'bg-cyan-500/15 text-cyan-300'
              }`}>
                {filteredMutations.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-btn-stock-alert"
              onClick={() => setActiveWarehouseTab('stock_alert')}
              className={`px-3.5 py-2 rounded-xl text-sm font-normal flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer border ${
                activeWarehouseTab === 'stock_alert'
                  ? lowStockProducts.length > 0
                    ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.32)] hover:shadow-[0_0_24px_rgba(244,63,94,0.42)]'
                    : 'bg-amber-600 text-white border-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.32)] hover:shadow-[0_0_24px_rgba(245,158,11,0.42)]'
                  : lowStockProducts.length > 0
                  ? 'border-rose-500/80 bg-rose-500/5 text-rose-600 dark:text-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.22)] hover:shadow-[0_0_24px_rgba(244,63,94,0.32)]'
                  : 'border-amber-500/80 bg-amber-500/5 text-amber-600 dark:text-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.22)] hover:shadow-[0_0_24px_rgba(245,158,11,0.32)]'
              }`}
            >
              {lowStockProducts.length > 0 ? (
                <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${activeWarehouseTab === 'stock_alert' ? 'bg-white' : 'bg-rose-500'}`} />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{isEn ? 'Critical Stock Alerts' : 'Peringatan Stok Kritis'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest ${
                activeWarehouseTab === 'stock_alert'
                  ? 'bg-white/20 text-white'
                  : lowStockProducts.length > 0
                  ? isLight
                    ? 'bg-rose-50 border border-rose-300 text-rose-700'
                    : 'bg-rose-500/15 border border-rose-500/35 text-rose-300'
                  : isLight
                  ? 'bg-amber-50 border border-amber-300 text-amber-700'
                  : 'bg-amber-500/15 border border-amber-500/35 text-amber-300'
              }`}>
                {lowStockProducts.length} Alert
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWarehouseTab('bad_stock')}
              className={`px-3.5 py-2 rounded-xl text-sm font-normal flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer border ${
                activeWarehouseTab === 'bad_stock'
                  ? (badStockItems || []).length > 0
                    ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.32)] hover:shadow-[0_0_24px_rgba(244,63,94,0.42)]'
                    : 'bg-amber-600 text-white border-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.32)] hover:shadow-[0_0_24px_rgba(245,158,11,0.42)]'
                  : (badStockItems || []).length > 0
                  ? 'border-rose-500/80 bg-rose-500/5 text-rose-600 dark:text-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.22)] hover:shadow-[0_0_24px_rgba(244,63,94,0.32)]'
                  : 'border-amber-500/80 bg-amber-500/5 text-amber-600 dark:text-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.22)] hover:shadow-[0_0_24px_rgba(245,158,11,0.32)]'
              }`}
            >
              {(badStockItems || []).length > 0 ? (
                <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${activeWarehouseTab === 'bad_stock' ? 'bg-white' : 'bg-rose-500'}`} />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{isEn ? 'Quarantine & Bad Stock' : 'Karantina & Bad Stock'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest ${
                activeWarehouseTab === 'bad_stock'
                  ? 'bg-white/20 text-white'
                  : (badStockItems || []).length > 0
                  ? isLight
                    ? 'bg-rose-50 border border-rose-300 text-rose-700'
                    : 'bg-rose-500/15 border border-rose-500/35 text-rose-300'
                  : isLight
                  ? 'bg-amber-50 border border-amber-300 text-amber-700'
                  : 'bg-amber-500/15 border border-amber-500/35 text-amber-300'
              }`}>
                {(badStockItems || []).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWarehouseTab('grn')}
              className={`px-3.5 py-2 rounded-xl text-sm font-normal flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] active:scale-[0.99] cursor-pointer border ${
                activeWarehouseTab === 'grn'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.28)]'
                  : isLight
                  ? 'bg-white border-cyan-500/50 text-slate-800 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                  : 'bg-[#0d1117] text-gray-300 border-cyan-500/30 hover:text-white'
              }`}
            >
              <PackageCheck className={`w-3.5 h-3.5 ${activeWarehouseTab === 'grn' ? 'text-white' : 'text-emerald-500'}`} />
              <span>{isEn ? 'Goods Receipt (GRN & PO)' : 'Penerimaan Barang (GRN)'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest inline-flex items-center gap-1 ${
                activeWarehouseTab === 'grn'
                  ? 'bg-white/20 text-white'
                  : isLight
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              }`}>
                {approvedPOs.length > 0 && activeWarehouseTab !== 'grn' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <span>{approvedPOs.length}</span>
              </span>
            </button>

            {isBuildingBulkActive && (
              <button
                type="button"
                onClick={() => setActiveWarehouseTab('fleet_do')}
                className={`px-3.5 py-2 rounded-xl text-sm font-normal flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(245,158,11,0.28)] active:scale-[0.99] cursor-pointer border ${
                  activeWarehouseTab === 'fleet_do'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.32)]'
                    : isLight
                    ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-[0_0_10px_rgba(245,158,11,0.12)]'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/35 hover:text-white'
                }`}
              >
                <Truck className={`w-3.5 h-3.5 ${activeWarehouseTab === 'fleet_do' ? 'text-white' : 'text-amber-500'}`} />
                <span>Logistik Armada, DO &amp; Susut Curah</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest ${
                  activeWarehouseTab === 'fleet_do'
                    ? 'bg-white/20 text-white'
                    : isLight
                    ? 'bg-white text-amber-800 border border-amber-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {activeDoCount} DO Aktif
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedProductForOpname(null);
                setIsStockOpnameOpen(true);
              }}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-[0.99] border ${
                isLight
                  ? 'bg-white hover:bg-cyan-50 border-cyan-500/60 text-slate-800 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                  : 'bg-teal-500/15 text-teal-300 border-teal-500/35 hover:bg-teal-500/25'
              }`}
            >
              <ClipboardCheck className={`w-4 h-4 ${isLight ? 'text-cyan-600' : 'text-teal-400'}`} />
              <span>{isEn ? 'Stock Opname' : 'Stock Opname'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(true)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-[0.99] ml-auto border ${
                isLight
                  ? 'bg-cyan-600 hover:bg-cyan-700 border-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.24)]'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35 hover:bg-emerald-500/25'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{isEn ? 'Manual Adjustment' : 'Penyesuaian Manual'}</span>
            </button>
          </div>
        </div>

        {/* Tab Logistik Armada, DO & Susut Curah (Khusus BUILDING_BULK) */}
        {activeWarehouseTab === 'fleet_do' && isBuildingBulkActive && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Bagian 1: Monitor Surat Jalan (DO) & Status Muat Armada */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className={`font-semibold text-base flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Truck className="w-4 h-4 text-amber-500" />
                    Kontrol Muat Armada &amp; Surat Jalan (DO) Proyek
                  </h3>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                    Terintegrasi real-time dari transaksi Kasir Depo (Frangko / Armada). Perbarui status muat hingga terkirim ke lokasi proyek.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {([
                    { id: 'ALL', label: 'Semua DO' },
                    { id: 'MENUNGGU_MUAT', label: 'Menunggu Muat' },
                    { id: 'DALAM_PENGIRIMAN', label: 'Dalam Pengiriman' },
                    { id: 'TERKIRIM_PROYEK', label: 'Terkirim ke Proyek' },
                  ] as const).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setDoStatusFilter(st.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer transition ${
                        doStatusFilter === st.id
                          ? 'bg-amber-600 text-white border-amber-500'
                          : isLight
                          ? 'bg-white border-slate-300 text-slate-700'
                          : 'bg-[#0d1117] border-slate-700 text-slate-300'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-amber-50/70 border-amber-300' : 'bg-amber-950/20 border-amber-500/30'}`}>
                  <span className="text-[11px] font-mono uppercase text-slate-500 block">Menunggu Muat di Yard</span>
                  <span className={`text-xl font-bold font-mono ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                    {(buildingDeliveryOrders || []).filter((d) => d.status === 'MENUNGGU_MUAT').length} Armada
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-cyan-50/70 border-cyan-300' : 'bg-cyan-950/20 border-cyan-500/30'}`}>
                  <span className="text-[11px] font-mono uppercase text-slate-500 block">Dalam Pengiriman ke Proyek</span>
                  <span className={`text-xl font-bold font-mono ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>
                    {(buildingDeliveryOrders || []).filter((d) => d.status === 'DALAM_PENGIRIMAN').length} Armada
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-emerald-50/70 border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/30'}`}>
                  <span className="text-[11px] font-mono uppercase text-slate-500 block">Terkirim &amp; Diterima Proyek</span>
                  <span className={`text-xl font-bold font-mono ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
                    {(buildingDeliveryOrders || []).filter((d) => d.status === 'TERKIRIM_PROYEK').length} Armada
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[11px] font-mono uppercase tracking-wider ${
                      isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-[#0d1117] text-slate-400 border-slate-800'
                    }`}>
                      <th className="py-2.5 px-3">No. Surat Jalan</th>
                      <th className="py-2.5 px-3">Pelanggan / Tujuan Proyek</th>
                      <th className="py-2.5 px-3">Armada &amp; Kubikasi</th>
                      <th className="py-2.5 px-3">Muatan Material</th>
                      <th className="py-2.5 px-3 text-center">Status Muat</th>
                      <th className="py-2.5 px-3 text-right">Kontrol Armada</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200 text-slate-800' : 'divide-slate-800 text-slate-200'}`}>
                    {(buildingDeliveryOrders || [])
                      .filter((d) => doStatusFilter === 'ALL' || d.status === doStatusFilter)
                      .map((doItem) => (
                        <tr key={doItem.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'}>
                          <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                            <div className="font-bold text-cyan-600 dark:text-cyan-400">{doItem.doNumber}</div>
                            <div className="text-[10px] text-slate-500">{doItem.deliveryPolicy} • {new Date(doItem.date).toLocaleDateString('id-ID')}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold">{doItem.customerName}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[220px]">{doItem.destination}</div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-medium">{doItem.fleetVehicleName || doItem.fleetType}</div>
                            <div className="text-[10px] font-mono text-slate-500">Est. {doItem.estimatedVolumeM3} m³</div>
                          </td>
                          <td className="py-2.5 px-3 max-w-[240px]">
                            <div className="truncate">{doItem.itemsSummary}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                              doItem.status === 'TERKIRIM_PROYEK'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                                : doItem.status === 'DALAM_PENGIRIMAN'
                                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            }`}>
                              {doItem.status === 'MENUNGGU_MUAT'
                                ? 'MENUNGGU MUAT'
                                : doItem.status === 'DALAM_PENGIRIMAN'
                                ? 'DALAM PENGIRIMAN'
                                : 'TERKIRIM KE PROYEK'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                            {doItem.status === 'MENUNGGU_MUAT' && (
                              <button
                                type="button"
                                onClick={() => updateBuildingDeliveryStatus(doItem.id, 'DALAM_PENGIRIMAN')}
                                className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-medium cursor-pointer"
                              >
                                Berangkat Kirim
                              </button>
                            )}
                            {doItem.status === 'DALAM_PENGIRIMAN' && (
                              <button
                                type="button"
                                onClick={() => updateBuildingDeliveryStatus(doItem.id, 'TERKIRIM_PROYEK')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium cursor-pointer"
                              >
                                Tandai Terkirim
                              </button>
                            )}
                            {doItem.status === 'TERKIRIM_PROYEK' && (
                              <span className="text-[11px] text-emerald-500 font-mono">✓ Selesai</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bagian 2: Pencatatan Selisih Susut Material Curah (Pasir / Batu Pecah / Kayu) */}
            <div className={`p-4 rounded-xl border space-y-4 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-slate-800'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className={`font-semibold text-sm flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Scale className="w-4 h-4 text-rose-500" />
                    Pencatatan Selisih Susut Material Curah (Pasir / Batu Pecah / Kayu)
                  </h4>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Catat kehilangan volume kubikasi atau berat saat penyimpanan yard, muat curah, atau pemotongan kayu agar kartu stok &amp; beban HPP tetap akurat.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className="text-[11px] font-mono uppercase text-slate-500 block mb-1">Material Curah / Kayu</label>
                  <select
                    value={shrinkProductId}
                    onChange={(e) => setShrinkProductId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-slate-700 text-white'
                    }`}
                  >
                    {buildingBulkMaterials.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Stok: {m.stock} {m.unit || 'm³'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[11px] font-mono uppercase text-slate-500 block mb-1">Selisih Susut</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={shrinkQtyInput}
                    onChange={(e) => setShrinkQtyInput(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs font-mono outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="text-[11px] font-mono uppercase text-slate-500 block mb-1">Penyebab Susut Curah</label>
                  <input
                    type="text"
                    value={shrinkReason}
                    onChange={(e) => setShrinkReason(e.target.value)}
                    placeholder="Contoh: Susut pasir basah / tercecer di bak..."
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => {
                      const mat = buildingBulkMaterials.find((m: any) => m.id === shrinkProductId);
                      const qty = Number(shrinkQtyInput) || 0;
                      if (!mat || qty <= 0) {
                        showToast('Masukkan jumlah susut yang valid (> 0)', 'warning');
                        return;
                      }
                      const res = recordBulkShrinkage({
                        productId: mat.id,
                        productName: mat.name,
                        unit: mat.unit || 'm³',
                        costPrice: Number(mat.costPrice ?? mat.cost_price ?? mat.buy_price) || 0,
                        currentStock: Number(mat.stock) || 0,
                        shrinkageQty: qty,
                        reason: shrinkReason || 'Susut fisik material curah yard',
                      });
                      if (res.success) {
                        recordAudit({
                          traceId: `WH-SHRINK-${Date.now()}`,
                          userId: activeUser?.id || 'warehouse-staff',
                          userName: activeUser?.name || 'Petugas Gudang Material',
                          userRole: activeUser?.role || 'Warehouse',
                          module: 'WAREHOUSE',
                          action: 'STOCK_ADJUSTMENT',
                          severity: 'WARN',
                          entityId: mat.id,
                          payloadAfter: { shrinkageQty: qty, reason: shrinkReason },
                        });
                      }
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Catat Susut
                  </button>
                </div>
              </div>

              {(bulkShrinkageLogs || []).length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b text-[10px] font-mono uppercase ${
                        isLight ? 'bg-white text-slate-600 border-slate-200' : 'bg-[#161b22] text-slate-400 border-slate-800'
                      }`}>
                        <th className="py-2 px-3">Tanggal</th>
                        <th className="py-2 px-3">Material Curah</th>
                        <th className="py-2 px-3 text-right">Sistem → Fisik</th>
                        <th className="py-2 px-3 text-right">Susut</th>
                        <th className="py-2 px-3 text-right">Nilai HPP Loss</th>
                        <th className="py-2 px-3">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLight ? 'divide-slate-200 bg-white' : 'divide-slate-800'}`}>
                      {bulkShrinkageLogs.slice(0, 6).map((log) => (
                        <tr key={log.id}>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                            {new Date(log.date).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-2 px-3 font-medium">{log.productName}</td>
                          <td className="py-2 px-3 text-right font-mono">
                            {log.systemQty} → {log.physicalQty} {log.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-500">
                            -{log.shrinkageQty} {log.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-amber-600 dark:text-amber-400">
                            Rp {log.costValueLoss.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-slate-500 truncate max-w-[220px]">{log.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab GRN */}
        {activeWarehouseTab === 'grn' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-medium text-base tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isEn ? 'Pending & Approved Purchase Orders (Ready for GRN)' : 'Daftar Purchase Order (PO) Siap Diterima (GRN)'}
                </h3>
                <p className={`text-sm font-normal mt-0.5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  {isEn
                    ? 'Select an approved or pending PO to verify physical items, accept partial shipments, and update inventory.'
                    : 'Pilih PO yang disetujui atau pending untuk melakukan verifikasi fisik barang datang, penerimaan bertahap (partial), dan sinkronisasi stok.'}
                </p>
              </div>
            </div>

            {approvedPOs.length === 0 ? (
              <div className={`py-12 text-center ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                <PackageCheck className="w-10 h-10 mx-auto mb-2 text-gray-500 opacity-60" />
                <p className="font-medium text-base">
                  {isEn ? 'No pending or approved POs awaiting goods receipt.' : 'Tidak ada PO pending atau disetujui yang menunggu penerimaan.'}
                </p>
                <p className="text-sm font-normal text-gray-500 mt-1">
                  {isEn ? 'Create or approve POs in the Purchasing module first.' : 'Buat atau setujui PO terlebih dahulu di modul Purchasing.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {approvedPOs.map((po) => (
                  <div
                    key={po.po_number || po.po_id}
                    className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                      isLight
                        ? 'bg-white border-cyan-500/55 shadow-[0_0_12px_rgba(6,182,212,0.12)]'
                        : 'bg-[#0f141c] border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.06)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-[11px] font-normal tracking-widest px-2 py-0.5 rounded-lg border ${
                            isLight
                              ? 'bg-cyan-50 border-cyan-300 text-cyan-800'
                              : 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30'
                          }`}>
                            {po.po_number}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest border ${
                            isLight
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}>
                            {po.status}
                          </span>
                        </div>
                        <div className={`font-medium text-base mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {po.supplier_name}
                        </div>
                      </div>
                      <div className={`text-right font-mono font-medium text-lg ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                        Rp {po.total_amount.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className={`text-sm font-normal space-y-1 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                      <div>
                        <span className="text-gray-500">{isEn ? 'Items:' : 'Item:'}</span>{' '}
                        <span className={isLight ? 'text-slate-800' : 'text-gray-300'}>
                          {typeof po.items === 'string'
                            ? po.items
                            : (po.item_details || []).map((d) => `${d.product_name} (${d.qty} ${d.unit})`).join(', ')}
                        </span>
                      </div>
                      <div className="font-mono">
                        <span className="text-gray-500 font-sans">{isEn ? 'Date:' : 'Tanggal PO:'}</span> {po.date}
                      </div>
                    </div>

                    <div className={`pt-3 border-t flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-gray-800/60'}`}>
                      <span className="text-sm font-normal text-gray-500">
                        {isEn ? 'Supports partial receipt' : 'Mendukung penerimaan bertahap'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPoForGr(po);
                          setIsGrModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer transition-all duration-200 active:scale-[0.99]"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>{isEn ? 'Confirm Receipt (GRN)' : 'Konfirmasi Penerimaan (GRN)'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Stock Alert */}
        {activeWarehouseTab === 'stock_alert' && (
          <div className="p-4 sm:p-5">
            <StockAlertTab isLight={isLight} />
          </div>
        )}

        {/* Tab Realtime Inventory */}
        {activeWarehouseTab === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-normal">
              <thead
                className={`font-mono font-normal border-b uppercase tracking-widest text-[11px] ${
                  isLight
                    ? 'bg-slate-50 text-slate-600 border-cyan-500/30'
                    : 'bg-[#0d1117] text-[#8b949e] border-cyan-500/20'
                }`}
              >
                <tr>
                  <th className="py-3 px-4 font-normal">{isEn ? 'Product ID' : 'Product ID'}</th>
                  <th className="py-3 px-4 font-normal">{isEn ? 'Product Name' : 'Nama Produk'}</th>
                  <th className="py-3 px-4 text-center font-normal">{isEn ? 'Initial Stock' : 'Stok Awal'}</th>
                  <th className={`py-3 px-4 text-center font-normal ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    {isEn ? 'Inbound (In)' : 'Masuk (In)'}
                  </th>
                  <th className={`py-3 px-4 text-center font-normal ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                    {isEn ? 'Outbound / POS (Out)' : 'Keluar / POS (Out)'}
                  </th>
                  <th className="py-3 px-4 text-center font-normal">{isEn ? 'Final Stock' : 'Stok Akhir'}</th>
                  <th className="py-3 px-4 text-center font-normal">{isEn ? 'Restock Action (PO)' : 'Aksi Restock (PO)'}</th>
                  <th className="py-3 px-4 font-normal">{isEn ? 'Last Updated' : 'Pembaruan Terakhir'}</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y text-sm font-normal ${
                  isLight
                    ? 'divide-slate-200 text-slate-800'
                    : 'divide-[#30363d] text-gray-300'
                }`}
              >
                {filteredInventory.map((inv, idx) => {
                  const prod = products.find(
                    (p) =>
                      p.id === inv.product_id ||
                      (p.sku && p.sku.toLowerCase() === inv.product_id.toLowerCase()) ||
                      (p.barcode && p.barcode.toLowerCase() === inv.product_id.toLowerCase()) ||
                      (p.name && inv.product_name && p.name.toLowerCase() === inv.product_name.toLowerCase())
                  );
                  return (
                    <tr
                      key={`inv-row-${inv.product_id}-${idx}`}
                      className={`transition ${
                        isLight ? 'hover:bg-cyan-50/40' : 'hover:bg-[#21262d]/50'
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`font-mono text-[11px] font-normal tracking-widest px-2 py-0.5 rounded inline-block border ${
                          isLight
                            ? 'bg-cyan-50 border-cyan-300 text-cyan-900'
                            : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                        }`}>
                          {inv.product_id}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-sm font-normal ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        <div>{prod?.name || inv.product_name}</div>
                        {Array.isArray(prod?.variantMatrix) && prod.variantMatrix.length > 0 && (
                          <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px]">
                            <span className={`px-1.5 py-0.5 rounded font-mono border ${
                              isLight
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            }`}>
                              Matriks {prod.variantMatrix.length} Varian ({prod.variantSize || 'S-XXL'} × {prod.variantColor || '4 Warna'})
                            </span>
                            {prod.fashionPromo?.clearanceActive && (
                              <span className="px-1.5 py-0.5 rounded font-mono bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                                Clearance {prod.fashionPromo.clearanceType === 'PERCENT' ? `-${prod.fashionPromo.clearanceValue}%` : `-Rp ${prod.fashionPromo.clearanceValue.toLocaleString('id-ID')}`}
                              </span>
                            )}
                            {prod.fashionPromo?.bundleActive && (
                              <span className="px-1.5 py-0.5 rounded font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                {prod.fashionPromo.bundleScope === 'MIX_MATCH_FASHION' ? 'Mix & Match' : 'Bundle'} {prod.fashionPromo.bundleMinQty}+
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-center font-mono text-sm font-normal ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        {inv.initial_stock}
                      </td>
                      <td className={`py-3 px-4 text-center font-mono text-sm font-normal ${isLight ? 'text-emerald-700' : 'text-[#10B981]'}`}>
                        +{inv.in_qty}
                      </td>
                      <td className={`py-3 px-4 text-center font-mono text-sm font-normal ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                        -{inv.out_qty}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-sm font-normal">
                        {(() => {
                          const alertInfo = prod
                            ? getProductAlertThreshold(prod)
                            : { minStock: 10, isLowStock: inv.final_stock <= 10 };
                          const minStock = prod?.minStock ?? prod?.min_stock ?? alertInfo.minStock ?? 10;
                          const isLowStock = inv.final_stock <= minStock || inv.final_stock <= 10 || alertInfo.isLowStock || prod?.status === 'Low Stock' || prod?.status === 'Out of Stock';
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-normal tracking-widest px-2.5 py-0.5 rounded-full border ${
                                isLight
                                  ? inv.final_stock <= 0
                                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                                    : isLowStock
                                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : inv.final_stock <= 0
                                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/35'
                                  : isLowStock
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/35'
                                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              }`}
                            >
                              {isLowStock && (
                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${inv.final_stock <= 0 ? 'bg-rose-500' : 'bg-amber-500'}`} />
                              )}
                              <span>{inv.final_stock}</span>
                              {isLowStock && (
                                <span className="text-[11px] font-mono font-normal tracking-widest">
                                  ALERT
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const alertInfo = prod
                            ? getProductAlertThreshold(prod)
                            : { minStock: 10, isLowStock: inv.final_stock <= 10 };
                          const minStock = prod?.minStock ?? prod?.min_stock ?? alertInfo.minStock ?? 10;
                          const isLowStock = inv.final_stock <= minStock || inv.final_stock <= 10 || alertInfo.isLowStock || prod?.status === 'Low Stock' || prod?.status === 'Out of Stock';
                          if (isLowStock) {
                            const targetProd = prod || {
                              id: inv.product_id,
                              name: inv.product_name || inv.product_id,
                              stock: inv.final_stock,
                              minStock: minStock,
                              price: 0,
                              cost_price: 15000,
                              category: 'General',
                              status: 'Low Stock',
                              unit: 'Pcs',
                            };
                            return (
                              <button
                                type="button"
                                onClick={() => createAutoReorderPO(targetProd as any)}
                                className={`px-2.5 py-1 rounded-lg font-medium text-sm inline-flex items-center gap-1 shadow-xs transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                                  isLight
                                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                }`}
                                title="Buat Draf PO Otomatis ke Purchasing"
                              >
                                <Zap className="w-3.5 h-3.5 fill-current" />
                                <span>{isEn ? 'Draft PO' : 'Draf PO'}</span>
                              </button>
                            );
                          }
                          return (
                            <span className={`text-[11px] font-mono font-normal tracking-widest px-2.5 py-0.5 rounded-full inline-block border ${
                              isLight
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            }`}>
                              {isEn ? 'STOCK SAFE' : 'STOCK SAFE'}
                            </span>
                          );
                        })()}
                      </td>
                      <td className={`py-3 px-4 font-mono text-sm font-normal ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        {inv.last_update}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Riwayat Mutasi */}
        {activeWarehouseTab === 'mutations' && (
          <div>
            <div className={`p-3 border-b flex flex-wrap items-center justify-between gap-3 text-sm font-normal ${
              isLight ? 'bg-slate-50 border-cyan-500/30' : 'bg-[#0d1117]/50 border-cyan-500/20'
            }`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-mono font-normal uppercase tracking-widest ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  {isEn ? 'Filter Type:' : 'Tipe Mutasi:'}
                </span>
                <button
                  type="button"
                  onClick={() => setMutationTypeFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-normal tracking-widest transition cursor-pointer border ${
                    mutationTypeFilter === 'ALL'
                      ? 'bg-cyan-600 text-white border-cyan-500'
                      : isLight
                      ? 'bg-white hover:bg-cyan-50 border-cyan-500/40 text-slate-700'
                      : 'bg-slate-800 border-slate-700 text-gray-300 hover:text-white'
                  }`}
                >
                  {isEn ? 'All' : 'Semua'} ({(domainMutations || []).length})
                </button>
                <button
                  type="button"
                  onClick={() => setMutationTypeFilter('SALE-POS')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-normal tracking-widest transition cursor-pointer border ${
                    mutationTypeFilter === 'SALE-POS'
                      ? 'bg-cyan-600 text-white border-cyan-500'
                      : isLight
                      ? 'bg-white hover:bg-cyan-50 border-cyan-500/40 text-slate-700'
                      : 'bg-slate-800 border-slate-700 text-blue-300 hover:bg-slate-700'
                  }`}
                >
                  SALE-POS ({(domainMutations || []).filter(isSalePosMutation).length})
                </button>
                <button
                  type="button"
                  onClick={() => setMutationTypeFilter('RESTOCK-PO')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-normal tracking-widest transition cursor-pointer border ${
                    mutationTypeFilter === 'RESTOCK-PO'
                      ? 'bg-cyan-600 text-white border-cyan-500'
                      : isLight
                      ? 'bg-white hover:bg-cyan-50 border-cyan-500/40 text-slate-700'
                      : 'bg-slate-800 border-slate-700 text-teal-300 hover:bg-slate-700'
                  }`}
                >
                  RESTOCK-PO ({(domainMutations || []).filter(isRestockPoMutation).length})
                </button>
                <button
                  type="button"
                  onClick={() => setMutationTypeFilter('ADJ-LOSS')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-normal tracking-widest transition cursor-pointer border ${
                    mutationTypeFilter === 'ADJ-LOSS'
                      ? 'bg-cyan-600 text-white border-cyan-500'
                      : isLight
                      ? 'bg-white hover:bg-cyan-50 border-cyan-500/40 text-slate-700'
                      : 'bg-slate-800 border-slate-700 text-rose-300 hover:bg-slate-700'
                  }`}
                >
                  ADJ-LOSS ({(domainMutations || []).filter(isAdjLossMutation).length})
                </button>
                <button
                  type="button"
                  onClick={() => setMutationTypeFilter('ADJ-GAIN')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-normal tracking-widest transition cursor-pointer border ${
                    mutationTypeFilter === 'ADJ-GAIN'
                      ? 'bg-cyan-600 text-white border-cyan-500'
                      : isLight
                      ? 'bg-white hover:bg-cyan-50 border-cyan-500/40 text-slate-700'
                      : 'bg-slate-800 border-slate-700 text-emerald-300 hover:bg-slate-700'
                  }`}
                >
                  ADJ-GAIN ({(domainMutations || []).filter(isAdjGainMutation).length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono font-normal uppercase tracking-widest ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  {isEn ? 'Date:' : 'Periode:'}
                </span>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className={`px-2.5 py-1 rounded-lg border text-sm font-normal outline-none font-mono ${
                    isLight ? 'bg-white border-cyan-500/50 text-slate-900' : 'bg-[#0d1117] border-cyan-500/30 text-white'
                  }`}
                  title="Tanggal Mulai"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className={`px-2.5 py-1 rounded-lg border text-sm font-normal outline-none font-mono ${
                    isLight ? 'bg-white border-cyan-500/50 text-slate-900' : 'bg-[#0d1117] border-cyan-500/30 text-white'
                  }`}
                  title="Tanggal Akhir"
                />
                {(startDateFilter || endDateFilter) && (
                  <button
                    type="button"
                    onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }}
                    className="text-sm text-rose-500 hover:underline font-normal ml-1 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-normal">
                <thead
                  className={`font-mono font-normal border-b uppercase tracking-widest text-[11px] ${
                    isLight
                      ? 'bg-slate-50 text-slate-600 border-cyan-500/30'
                      : 'bg-[#0d1117] text-[#8b949e] border-cyan-500/20'
                  }`}
                >
                  <tr>
                    <th className="py-3 px-4 font-normal">{isEn ? 'Timestamp' : 'Tanggal / Jam'}</th>
                    <th className="py-3 px-4 font-normal">{isEn ? 'Barcode / Product' : 'Barcode / Nama'}</th>
                    <th className="py-3 px-4 font-normal">{isEn ? 'Mutation Type' : 'Tipe Mutasi'}</th>
                    <th className="py-3 px-4 text-center font-normal">{isEn ? 'Inbound (Masuk)' : 'Masuk'}</th>
                    <th className="py-3 px-4 text-center font-normal">{isEn ? 'Outbound (Keluar)' : 'Keluar'}</th>
                    <th className="py-3 px-4 text-center font-normal">{isEn ? 'Final Stock' : 'Saldo Akhir'}</th>
                    <th className="py-3 px-4 font-normal">{isEn ? 'Ref / Notes' : 'Ref / Keterangan'}</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y text-sm font-normal ${
                    isLight
                      ? 'divide-slate-200 text-slate-800'
                      : 'divide-[#30363d] text-gray-300'
                  }`}
                >
                  {filteredMutations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 text-sm font-normal">
                        {isEn
                          ? 'No stock ledger mutation records found for this filter'
                          : 'Belum ada catatan kartu stok mutasi untuk filter ini'}
                      </td>
                    </tr>
                  ) : (
                    filteredMutations.map((mut, idx) => {
                      const isIn = isInboundMutation(mut);
                      const absQty = Math.abs(Number(mut.qty) || 0);

                      const formatMutationTimestamp = (raw?: string) => {
                        if (!raw) return '-';
                        const trimmed = String(raw).trim();
                        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
                        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
                        const parsed = new Date(trimmed);
                        if (!isNaN(parsed.getTime())) {
                          const p2 = (n: number) => String(n).padStart(2, '0');
                          return `${parsed.getFullYear()}-${p2(parsed.getMonth() + 1)}-${p2(parsed.getDate())} ${p2(parsed.getHours())}:${p2(parsed.getMinutes())}:${p2(parsed.getSeconds())}`;
                        }
                        return trimmed.replace('T', ' ').replace(/\.\d+Z?$/, '').replace(/Z$/, '');
                      };

                      const prod = products.find(
                        (p) => p.id === mut.product_id || (p.sku && p.sku === mut.product_id)
                      );
                      const isNumericBarcodeOnly = (val?: string) =>
                        Boolean(val && /^\d{8,}$/.test(String(val).trim()));
                      const primarySku =
                        (prod?.sku && !isNumericBarcodeOnly(prod.sku) ? prod.sku : undefined) ||
                        (mut.product_id && !isNumericBarcodeOnly(mut.product_id) ? mut.product_id : undefined) ||
                        (mut.sku && !isNumericBarcodeOnly(mut.sku) ? mut.sku : undefined) ||
                        prod?.id ||
                        mut.product_id ||
                        mut.sku ||
                        '-';

                      return (
                        <tr
                          key={`ledger-row-${mut.id}-${idx}`}
                          className={`transition ${
                            isLight ? 'hover:bg-cyan-50/40' : 'hover:bg-[#21262d]/50'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono tabular-nums text-sm font-normal whitespace-nowrap">
                            <div className={isLight ? 'text-slate-700' : 'text-gray-400'}>
                              {formatMutationTimestamp(mut.timestamp || mut.date)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className={`text-sm font-normal ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {mut.product_name}
                            </div>
                            <div className="mt-1">
                              <span className={`font-mono text-[11px] font-normal tracking-widest px-2 py-0.5 rounded inline-block border ${
                                isLight
                                  ? 'bg-cyan-50 border-cyan-300 text-cyan-900'
                                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                              }`}>
                                {primarySku}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 font-mono text-[11px] font-normal tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${
                                isSalePosMutation(mut)
                                  ? isLight
                                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                                    : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                  : isRestockPoMutation(mut)
                                  ? isLight
                                    ? 'bg-teal-50 text-teal-700 border-teal-300'
                                    : 'bg-teal-500/15 text-teal-300 border-teal-500/35'
                                  : isAdjLossMutation(mut)
                                  ? isLight
                                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                                    : 'bg-rose-500/15 text-rose-400 border-rose-500/35'
                                  : isAdjGainMutation(mut)
                                  ? isLight
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35'
                                  : isLight
                                  ? 'bg-purple-50 text-purple-700 border-purple-300'
                                  : 'bg-purple-500/15 text-purple-300 border-purple-500/35'
                              }`}
                            >
                              {mut.type}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-center font-mono tabular-nums text-sm font-normal ${isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                            {isIn ? `+${absQty}` : '-'}
                          </td>
                          <td className={`py-3 px-4 text-center font-mono tabular-nums text-sm font-normal ${!isIn ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400'}`}>
                            {!isIn ? `-${absQty}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-sm font-normal whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded inline-block font-mono text-[11px] font-normal tracking-widest border ${
                              isLight
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-slate-800 border-slate-700 text-slate-200'
                            }`}>
                              {mut.balanceAfter ?? mut.final_stock}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-normal">
                            <div className={`font-mono ${isLight ? 'text-slate-900' : 'text-cyan-400'}`}>
                              {mut.reference_no}
                            </div>
                            <div className={`mt-0.5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                              {mut.notes || '-'} {mut.operator ? `(${mut.operator})` : ''}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Bad Stock */}
        {activeWarehouseTab === 'bad_stock' && (
          <div className="space-y-4 p-4 sm:p-5">
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-all duration-200 ${
              (badStockItems || []).length > 0
                ? 'border-rose-500/80 bg-rose-500/5 shadow-[0_0_18px_rgba(244,63,94,0.22)] text-rose-600 dark:text-rose-400'
                : 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.22)] text-amber-600 dark:text-amber-400'
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <h3 className="text-base font-medium tracking-wide">
                    {isEn ? 'Quarantine & Damaged Stock Log' : 'Karantina & Log Barang Rusak (Bad Stock)'}
                  </h3>
                  <p className={`text-sm font-normal ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                    {isEn
                      ? 'Defective or expired goods isolated from sellable inventory.'
                      : 'Daftar barang rusak, kedaluwarsa, atau selisih karantina yang dipisahkan dari stok jual.'}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-normal tracking-widest border shrink-0 ${
                (badStockItems || []).length > 0
                  ? isLight
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                  : isLight
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
              }`}>
                {(badStockItems || []).length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
                <span>{(badStockItems || []).length} ITEM</span>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-amber-500/30">
              <table className="w-full text-left text-sm font-normal">
                <thead
                  className={`font-mono font-normal border-b uppercase tracking-widest text-[11px] ${
                    isLight
                      ? 'bg-slate-50 text-slate-600 border-amber-500/30'
                      : 'bg-[#0d1117] text-[#8b949e] border-amber-500/20'
                  }`}
                >
                  <tr>
                    <th className="py-3 px-4 font-normal">{isEn ? 'Date & Time' : 'Waktu / Tanggal'}</th>
                    <th className="py-3 px-4 font-normal">{isEn ? 'SKU & Product' : 'SKU & Nama Produk'}</th>
                    <th className="py-3 px-4 text-center font-normal">{isEn ? 'Defective Qty' : 'Qty Rusak'}</th>
                    <th className="py-3 px-4 font-normal">{isEn ? 'Damage Reason' : 'Kondisi / Alasan'}</th>
                    <th className="py-3 px-4 font-normal">{isEn ? 'Source Ref' : 'No. Referensi Asal'}</th>
                    <th className="py-3 px-4 text-center font-normal">{isEn ? 'Quarantine Status' : 'Status Karantina'}</th>
                    <th className="py-3 px-4 font-normal">{isEn ? 'Officer / PIC' : 'Petugas / PIC'}</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y text-sm font-normal ${
                    isLight
                      ? 'divide-slate-200 text-slate-800'
                      : 'divide-[#30363d] text-gray-300'
                  }`}
                >
                  {filteredBadStock.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 text-sm font-normal">
                        {isEn ? 'No defective / quarantine stock items recorded' : 'Tidak ada produk rusak atau dalam karantina'}
                      </td>
                    </tr>
                  ) : (
                    filteredBadStock.map((item, idx) => (
                      <tr
                        key={`bad-stock-${item.id}-${idx}`}
                        className={`transition ${isLight ? 'hover:bg-amber-50/40' : 'hover:bg-[#21262d]/50'}`}
                      >
                        <td className="py-3 px-4 font-mono text-sm font-normal whitespace-nowrap">
                          <span className={isLight ? 'text-slate-700' : 'text-gray-400'}>
                            {item.timestamp || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`text-sm font-normal ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {item.productName}
                          </div>
                          <div className="mt-1">
                            <span className={`font-mono text-[11px] font-normal tracking-widest px-2 py-0.5 rounded inline-block border ${
                              isLight
                                ? 'bg-cyan-50 border-cyan-300 text-cyan-900'
                                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                            }`}>
                              {item.productId}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-medium text-sm text-rose-600 dark:text-rose-400">
                          {item.qty} Unit
                        </td>
                        <td className={`py-3 px-4 text-sm font-normal ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                          {item.conditionReason || '-'}
                        </td>
                        <td className="py-3 px-4 font-mono text-sm font-normal whitespace-nowrap">
                          <span className={isLight ? 'text-slate-900' : 'text-cyan-400'}>
                            {item.sourceReference || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[11px] font-mono font-normal tracking-widest px-2.5 py-0.5 rounded-full inline-block border ${
                            isLight
                              ? 'bg-rose-50 border-rose-300 text-rose-800'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/35'
                          }`}>
                            {item.status || 'QUARANTINED'}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-sm font-normal font-mono ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                          {item.handledBy || 'Staf Gudang'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Stock Opname */}
        {activeWarehouseTab === 'stock_opname' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className={`font-medium text-base tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isEn ? 'Physical Stock Opname & Count Verification' : 'Stock Opname & Penghitungan Fisik Gudang'}
                </h3>
                <p className={`text-sm font-normal mt-0.5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  {isEn
                    ? 'Enter physical counts for products. Discrepancies automatically calculate difference and log ADJ-LOSS or ADJ-GAIN mutations upon saving.'
                    : 'Masukkan hitung fisik produk. Selisih akan dihitung otomatis dan dicatat sebagai mutasi ADJ-LOSS atau ADJ-GAIN saat disimpan.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveStockOpnameBatch}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-sm shadow-xs cursor-pointer flex items-center gap-1.5 transition-all duration-200 active:scale-[0.99]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEn ? 'Save Adjustments' : 'Simpan Penyesuaian Stock Opname'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-normal">
                <thead
                  className={`font-mono font-normal border-b uppercase tracking-widest text-[11px] ${
                    isLight
                      ? 'bg-slate-50 text-slate-600 border-cyan-500/30'
                      : 'bg-[#0d1117] text-[#8b949e] border-cyan-500/20'
                  }`}
                >
                  <tr>
                    <th className="py-3 px-4 font-normal">Barcode / SKU</th>
                    <th className="py-3 px-4 font-normal">{isEn ? 'Product Name' : 'Nama Produk'}</th>
                    <th className="py-3 px-4 text-center font-normal">{isEn ? 'System Stock' : 'Stok Sistem'}</th>
                    <th className="py-3 px-4 text-center font-normal">{isEn ? 'Physical Stock Input' : 'Input Stok Fisik'}</th>
                    <th className="py-3 px-4 text-center font-normal">{isEn ? 'Difference (Selisih)' : 'Selisih Otomatis'}</th>
                    <th className="py-3 px-4 font-normal">{isEn ? 'Reason Notes' : 'Alasan / Catatan'}</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y text-sm font-normal ${
                    isLight ? 'divide-slate-200 text-slate-800' : 'divide-[#30363d] text-gray-300'
                  }`}
                >
                  {domainProducts.map((p) => {
                    const physical = opnamePhysicalStocks[p.id] !== undefined ? opnamePhysicalStocks[p.id] : p.stock;
                    const diff = physical - p.stock;
                    const reason = opnameReasons[p.id] || (diff < 0 ? 'hilang / rusak' : diff > 0 ? 'salah hitung / surplus' : 'salah hitung');

                    return (
                      <tr key={`opname-row-${p.id}`} className={`transition ${isLight ? 'hover:bg-cyan-50/40' : 'hover:bg-[#21262d]/50'}`}>
                        <td className="py-3 px-4 font-mono whitespace-nowrap">
                          <span className={`font-mono text-[11px] font-normal tracking-widest px-2 py-0.5 rounded inline-block border ${
                            isLight
                              ? 'bg-cyan-50 border-cyan-300 text-cyan-900'
                              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                          }`}>
                            {p.barcode || p.sku || p.id}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-sm font-normal ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {p.name}
                        </td>
                        <td className={`py-3 px-4 text-center font-mono text-sm font-normal ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                          {p.stock} {p.unit || 'Pcs'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={physical}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value));
                              setOpnamePhysicalStocks((prev) => ({ ...prev, [p.id]: val }));
                            }}
                            className={`w-24 px-2.5 py-1.5 rounded-lg border text-center font-mono text-sm font-normal outline-none ${
                              isLight
                                ? 'bg-white border-cyan-500/50 text-slate-900 focus:border-cyan-500'
                                : 'bg-[#0d1117] border-cyan-500/30 text-white focus:border-cyan-400'
                            }`}
                          />
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-sm font-normal whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest border ${
                              diff < 0
                                ? isLight
                                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/35'
                                : diff > 0
                                ? isLight
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35'
                                : isLight
                                ? 'bg-slate-100 border-slate-300 text-slate-700'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={reason}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOpnameReasons((prev) => ({ ...prev, [p.id]: val }));
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-sm font-normal outline-none ${
                              isLight
                                ? 'bg-white border-cyan-500/50 text-slate-900 focus:border-cyan-500'
                                : 'bg-[#0d1117] border-cyan-500/30 text-white focus:border-cyan-400'
                            }`}
                          >
                            <option value="salah hitung">salah hitung</option>
                            <option value="rusak">rusak</option>
                            <option value="hilang">hilang</option>
                            <option value="koreksi fisik opname">koreksi fisik opname</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={handleSaveStockOpnameBatch}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-sm shadow-md cursor-pointer flex items-center gap-2 transition-all duration-200 active:scale-[0.99]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEn ? 'Save Adjustments' : 'Simpan Penyesuaian Stock Opname'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Adjust Stock */}
      {isAdjustModalOpen && (
        <div className="warehouse-modal fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div
            className={`w-full max-w-md rounded-2xl p-6 relative border transition-all duration-200 ${
              isLight
                ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-900'
                : 'bg-[#161b22] border-cyan-500/40 shadow-[0_0_24px_rgba(6,182,212,0.16)] text-white'
            }`}
          >
            <button
              onClick={() => setIsAdjustModalOpen(false)}
              className={`absolute top-4 right-4 cursor-pointer ${
                isLight ? 'text-slate-500 hover:text-slate-950' : 'text-gray-400 hover:text-white'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <h3
              className={`font-medium text-base mb-4 tracking-wide ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}
            >
              Mutasi / Penyesuaian Stok Gudang
            </h3>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-sm font-normal">
              <div>
                <label className={`block mb-1 text-sm font-normal ${
                  isLight ? 'text-slate-700' : 'text-gray-300'
                }`}>
                  Pilih Produk
                </label>
                <SearchableProductCombobox
                  products={domainProducts}
                  selectedId={selectedProductId}
                  onSelect={setSelectedProductId}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('IN')}
                  className={`py-2 rounded-xl font-medium text-sm border transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                    adjustType === 'IN'
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-500/70 text-emerald-800 shadow-[0_0_12px_rgba(16,185,129,0.18)]'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : isLight
                      ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                      : 'bg-[#0d1117] text-gray-400 border-[#30363d]'
                  }`}
                >
                  Tambah Stok (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('OUT')}
                  className={`py-2 rounded-xl font-medium text-sm border transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                    adjustType === 'OUT'
                      ? isLight
                        ? 'bg-rose-50 border-rose-500/70 text-rose-800 shadow-[0_0_12px_rgba(244,63,94,0.18)]'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                      : isLight
                      ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                      : 'bg-[#0d1117] text-gray-400 border-[#30363d]'
                  }`}
                >
                  Kurangi Stok (-)
                </button>
              </div>

              <div>
                <label className={`block mb-1 text-sm font-normal ${
                  isLight ? 'text-slate-700' : 'text-gray-300'
                }`}>
                  Jumlah Unit
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-mono text-sm font-normal ${
                    isLight
                      ? 'bg-white border-cyan-500/50 text-slate-950 focus:border-cyan-500'
                      : 'bg-[#0d1117] border-cyan-500/30 text-white focus:border-cyan-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 text-sm font-normal ${
                  isLight ? 'text-slate-700' : 'text-gray-300'
                }`}>
                  Alasan Penyesuaian
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none text-sm font-normal ${
                    isLight
                      ? 'bg-white border-cyan-500/50 text-slate-950 focus:border-cyan-500'
                      : 'bg-[#0d1117] border-cyan-500/30 text-white focus:border-cyan-400'
                  }`}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-normal cursor-pointer transition active:scale-[0.99] border ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                      : 'bg-[#21262d] border-gray-700 text-gray-300 hover:bg-[#30363d]'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-sm shadow-xs cursor-pointer transition-all duration-200 active:scale-[0.99]"
                >
                  Terapkan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ringkasan Draf PO Otomatis */}
      {summaryModalPOs && (
        <AutoPoSummaryModal
          generatedPOs={summaryModalPOs}
          onClose={() => setSummaryModalPOs(null)}
          onViewInPurchasing={() => {
            setSummaryModalPOs(null);
            setActiveNav('purchasing');
          }}
          isLight={isLight}
          sourceModule="Warehouse"
        />
      )}

      {/* Modal: Stock Opname Fisik */}
      {isStockOpnameOpen && (
        <StockOpnameModal
          isOpen={isStockOpnameOpen}
          preselectedProduct={selectedProductForOpname}
          onClose={() => {
            setIsStockOpnameOpen(false);
            setSelectedProductForOpname(null);
          }}
          isLight={isLight}
        />
      )}

      {/* Modal: Penerimaan Barang (Goods Receipt / GR) */}
      <GoodsReceiptModal
        isOpen={isGrModalOpen}
        po={selectedPoForGr}
        onClose={() => {
          setIsGrModalOpen(false);
          setSelectedPoForGr(null);
        }}
        isLight={isLight}
      />
    </div>
  );
};

export default WarehouseModule;