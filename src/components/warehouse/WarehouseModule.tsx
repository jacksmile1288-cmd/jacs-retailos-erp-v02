import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseOrder, StockMutation } from '../../types';
import { getReactiveNeonGlowStyle } from '../../utils/neonGlow';
import { AutoPoSummaryModal } from '../purchasing/AutoPoSummaryModal';
import { GoodsReceiptModal } from '../purchasing/GoodsReceiptModal';
import { StockAlertTab } from './StockAlertTab';
import { StockOpnameModal } from './StockOpnameModal';
import {
  Boxes,
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
  Search,
  Plus,
  Minus,
  CheckCircle,
  X,
  Layers,
  ShoppingBag,
  ExternalLink,
  ShieldAlert,
  History,
  ClipboardList,
  ClipboardCheck,
  Zap,
  FilePlus2,
  Building2,
  PackageCheck,
  Truck,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Sparkles,
  Undo2,
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
    goodsReceipts,
    getProductAlertThreshold,
    createAutoReorderPO,
    reorderAllLowStock,
    getDefaultSupplierForProduct,
    theme,
    language,
    activeNeonCards,
    setActiveNeonCard,
    // Consumer Sales Returns & Bad Stock (APS POS4: 28_ReturPenjualan)
    badStockItems,
    updateBadStockStatus,
    salesReturns,
    activeUser,
    showToast,
  } = useApp();

  const isLight = theme === 'light';
  const isEn = language === 'en';

  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [activeWarehouseTab, setActiveWarehouseTab] = useState<'inventory' | 'stock_alert' | 'mutations' | 'bad_stock' | 'grn' | 'stock_opname'>('inventory');
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
    products[0]?.id || ''
  );
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustQty, setAdjustQty] = useState(5);
  const [adjustReason, setAdjustReason] = useState(
    'Stock Opname Koreksi Fisik'
  );
  const [summaryModalPOs, setSummaryModalPOs] = useState<PurchaseOrder[] | null>(null);
  const [isGrModalOpen, setIsGrModalOpen] = useState(false);
  const [selectedPoForGr, setSelectedPoForGr] = useState<PurchaseOrder | null>(null);

  const approvedPOs = useMemo(() => {
    return (purchasing || []).filter((po) => {
      const s = (po.status || '').toLowerCase();
      return (
        s.includes('approv') ||
        s.includes('disetujui') ||
        s.includes('dipesan') ||
        s.includes('sent')
      ) && !s.includes('receiv') && !s.includes('selesai');
    });
  }, [purchasing]);

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

  const handleSaveStockOpnameBatch = () => {
    const timeStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const dateStr = new Date().toISOString().slice(0, 10);
    let updatedCount = 0;
    const newMutations: StockMutation[] = [];

    products.forEach((p) => {
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
      }
    });

    if (newMutations.length > 0) {
      setStockMutations((prev) => [...newMutations, ...prev]);
    }

    showToast(isEn ? `Stock Opname saved: ${updatedCount} items adjusted successfully!` : `Stock Opname berhasil disimpan: ${updatedCount} item disesuaikan!`);
  };

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => {
      const thresholdInfo = getProductAlertThreshold(p);
      const minStock = p.minStock ?? p.min_stock ?? thresholdInfo.minStock ?? 10;
      return (
        p.stock <= minStock ||
        p.status === 'Low Stock' ||
        p.status === 'Out of Stock' ||
        thresholdInfo.isLowStock
      );
    });
  }, [products, getProductAlertThreshold]);

  const totalPhysicalUnits = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock, 0);
  }, [products]);

  const totalPoValue = useMemo(() => {
    return purchasing.reduce((acc, p) => acc + p.total_amount, 0);
  }, [purchasing]);

  const activePRCount = purchaseRequests.filter(
    (pr) => pr.status === 'Pending Approval'
  ).length;

  const filteredInventory = inventory.filter((inv) => {
    const q = searchQuery.toLowerCase();
    const p = products.find((prod) => prod.id === inv.product_id);
    const pName = p?.name || inv.product_name || '';
    return (
      inv.product_id.toLowerCase().includes(q) ||
      pName.toLowerCase().includes(q)
    );
  });

  const filteredMutations = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return (stockMutations || []).filter((m) => {
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
        return m.type === 'SALE-POS' || m.type === 'OUT / KASIR' || m.type === 'OUT_SALES';
      }
      if (mutationTypeFilter === 'RESTOCK-PO') {
        return m.type === 'RESTOCK-PO' || m.type === 'IN / GOODS_RECEIPT' || m.type === 'IN / RECEIVING PO' || m.type === 'IN_PURCHASE' || m.type.includes('PURCHASE') || m.type.includes('GOODS_RECEIPT');
      }
      if (mutationTypeFilter === 'ADJ-LOSS') {
        return m.type === 'ADJ-LOSS' || m.type === 'OUT';
      }
      if (mutationTypeFilter === 'ADJ-GAIN') {
        return m.type === 'ADJ-GAIN' || m.type === 'IN';
      }
      if (mutationTypeFilter === 'OPENING_STOCK_MIGRATION') {
        return m.type === 'OPENING_STOCK_MIGRATION' || m.type === 'ROLLBACK_MIGRATION';
      }
      if (mutationTypeFilter === 'IN_GR') {
        return (
          m.type === 'RESTOCK-PO' ||
          m.type === 'IN / GOODS_RECEIPT' ||
          m.type === 'IN / RECEIVING PO' ||
          m.type === 'IN_PURCHASE' ||
          m.type.includes('PURCHASE') ||
          m.type.includes('GOODS_RECEIPT') ||
          m.type.includes('RESTOCK')
        );
      }
      if (mutationTypeFilter === 'OUT_KASIR') {
        return m.type === 'OUT / KASIR' || m.type === 'OUT_SALES' || m.type === 'SALE-POS';
      }
      if (mutationTypeFilter === 'IN_RETURN') {
        return m.type.includes('IN_RETURN');
      }
      if (mutationTypeFilter === 'IN') {
        return m.type === 'IN';
      }
      if (mutationTypeFilter === 'OUT') {
        return m.type === 'OUT' || m.type === 'OUT / KASIR' || m.type === 'OUT_SALES';
      }
      return true;
    });
  }, [stockMutations, searchQuery, mutationTypeFilter, startDateFilter, endDateFilter]);

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
    const delta =
      adjustType === 'IN' ? Math.abs(adjustQty) : -Math.abs(adjustQty);
    adjustStock(selectedProductId, delta, adjustReason);
    setIsAdjustModalOpen(false);
  };

  // 3 Warehouse Metric Cards with standardized labels
  const warehouseCards = [
    {
      id: 'sku-stock',
      title: isEn ? 'Total SKU & Stock' : 'Total SKU & Stok',
      shortTitle: isEn ? 'Total SKU' : 'Total SKU',
      value: `${products.length} SKU (${totalPhysicalUnits} Pcs)`,
      sub: isEn ? 'Warehouse Capacity 88% Optimal' : 'Kapasitas Gudang 88% Optimal',
      colorHex: '#38bdf8',
      icon: Boxes,
      focusDesc: isEn
        ? 'Catalog of all active SKUs, physical inventory, and DB sync.'
        : 'Katalog seluruh SKU, unit fisik riil, dan sinkronisasi DB_Inventory.',
    },
    {
      id: 'low-stock',
      title: isEn ? 'Low Stock Alert' : 'Peringatan Stok Rendah',
      shortTitle: isEn ? 'Low Stock' : 'Stok Rendah',
      value: `${lowStockProducts.length} SKU ${isEn ? 'Critical' : 'Kritis'}`,
      sub: isEn ? 'Safety stock threshold <= 10 units' : 'Batas Minimum <= 10 Unit Gudang',
      colorHex: '#f59e0b',
      icon: AlertTriangle,
      focusDesc: isEn
        ? 'Early warning system to prevent stockouts at cashier terminals.'
        : 'Peringatan dini ketersediaan barang untuk mencegah out-of-stock kasir.',
    },
    {
      id: 'po-value',
      title: isEn ? 'PO & Active PR Value' : 'Nilai PO & PR Berjalan',
      shortTitle: isEn ? 'PO & PR' : 'Nilai PO & PR',
      value: `Rp ${totalPoValue.toLocaleString('id-ID')}`,
      sub: `${purchasing.length} PO Terbit • ${activePRCount} PR Pending`,
      colorHex: '#8b5cf6',
      icon: ShoppingBag,
      focusDesc: isEn
        ? 'Ongoing purchase orders (PO) and restock requests (PR).'
        : 'Pengadaan barang berjalan (PO) dan permohonan restock barang (PR).',
    },
  ];

  const selectedCardId = activeNeonCards['warehouse'] || 'sku-stock';
  const selectedWarehouseCard =
    warehouseCards.find((c) => c.id === selectedCardId) || warehouseCards[0];

  return (
    <div id="warehouse-module" className="space-y-5 max-w-7xl mx-auto pb-6">
      {/* Header */}
      <div
        className={`p-5 rounded-2xl border transition duration-200 ${
          isLight
            ? 'bg-white border-slate-300 shadow-xs'
            : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-bold mb-2 ${
              isLight
                ? 'bg-blue-100 border border-blue-300 text-blue-950'
                : 'bg-[#8b5cf6]/15 border border-[#8b5cf6]/40 text-[#8b5cf6]'
            }`}>
              <Layers className="w-3.5 h-3.5" />
              <span>{isEn ? 'Warehouse & Inventory Control' : 'Manajemen Gudang & Kontrol Stok'}</span>
            </div>
            <h2
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}
            >
              {isEn ? 'Warehouse & Realtime Inventory' : 'Warehouse & Manajemen Stok Realtime'}
            </h2>
            <p className={`text-xs truncate mt-0.5 ${isLight ? 'text-slate-700 font-medium' : 'text-[#8b949e]'}`}>
              {isEn
                ? 'Monitoring inbound/outbound goods movements, stock ledger, and inventory sync.'
                : 'Monitoring pergerakan barang masuk/keluar, kartu stok, dan sinkronisasi DB_Inventory.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* Fokus Analisis Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 shadow-2xs'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: selectedWarehouseCard.colorHex }}
              />
              <span className={`text-[11px] font-bold shrink-0 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                Fokus Analisis:
              </span>
              <span className={`font-black text-xs truncate max-w-[130px] sm:max-w-[200px] ${isLight ? 'text-slate-950' : ''}`}>
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
              className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800'
                  : 'bg-teal-600 hover:bg-teal-500 text-white border border-teal-500/40'
              }`}
            >
              <ClipboardCheck className={`w-4 h-4 ${isLight ? 'text-slate-800' : ''}`} />
              <span>Stock Opname</span>
            </button>

            <button
              onClick={() => setIsAdjustModalOpen(true)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer ${
                isLight
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  : 'bg-[#0052FF] hover:bg-[#0043d1] text-white border border-blue-500/40'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>Mutasi Stok</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 KPI METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouseCards.map((card) => {
          const Icon = card.icon;
          const isSelected = selectedCardId === card.id;

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
              className={`p-4 rounded-xl text-left cursor-pointer flex flex-col justify-between h-full transition duration-150 ${
                isLight
                  ? isSelected
                    ? 'border-2 border-indigo-600 bg-white shadow-xs'
                    : 'border border-slate-300 bg-slate-50 shadow-xs hover:border-slate-400'
                  : isSelected
                  ? 'border-2 border-slate-400 bg-slate-900/90'
                  : 'border border-slate-700/60 bg-slate-900/60 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <span
                  className={`text-xs uppercase tracking-wider truncate ${
                    isLight
                      ? 'text-slate-700 font-bold'
                      : isSelected
                      ? 'text-white font-extrabold'
                      : 'text-slate-400'
                  }`}
                >
                  {card.title}
                </span>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    isLight
                      ? 'bg-slate-100 text-slate-900 border-slate-300'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-auto">
                <div
                  className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                    isLight ? 'text-slate-950' : 'text-white'
                  }`}
                >
                  {card.value}
                </div>
                <div className={`text-xs font-medium mt-1 truncate ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                  {card.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ALERT BANNER (LOW STOCK ALERT) */}
      {lowStockProducts.length > 0 && (
        <div
          id="warehouse-low-stock-alert-banner"
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs transition duration-150 ${
            isLight
              ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-xs'
              : 'border border-slate-700/60 bg-slate-900/60 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`p-1 rounded-lg shrink-0 ${isLight ? 'bg-rose-100 text-rose-950 border border-rose-300' : 'bg-amber-500/20 text-amber-400'}`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap sm:flex-nowrap">
              <span className={`font-bold shrink-0 ${isLight ? 'text-rose-950' : 'text-amber-500'}`}>
                {isEn ? 'Low Stock Warning:' : 'Peringatan Stok Rendah:'}
              </span>
              <span className="font-bold text-xs shrink-0">
                {lowStockProducts.length} SKU {isEn ? 'below safety stock limit' : 'di bawah batas minimum'}
              </span>
              <span className={`text-xs truncate max-w-xs sm:max-w-md hidden md:inline font-medium ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                ({lowStockProducts.map((p) => p.name).slice(0, 3).join(', ')}
                {lowStockProducts.length > 3 ? `, +${lowStockProducts.length - 3} lainnya` : ''})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleReorderAll}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer active:scale-95 shadow-xs ${
                isLight
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              }`}
              title="Buat draf PO otomatis dikelompokkan per Supplier"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isEn ? `Reorder (${lowStockProducts.length})` : `Reorder Semua (${lowStockProducts.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWarehouseTab('stock_alert')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'border-slate-700 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>{isEn ? 'Detail Alert' : 'Detail Alert'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* BANNER KONFIRMASI PENERIMAAN BARANG PO (GOODS RECEIPT) */}
      {approvedPOs.length > 0 && (
        <div
          id="warehouse-gr-ready-banner"
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs transition duration-150 ${
            isLight
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
              : 'border border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`p-1.5 rounded-lg shrink-0 ${isLight ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <PackageCheck className="w-4 h-4" />
            </span>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-bold ${isLight ? 'text-emerald-950' : 'text-emerald-400'}`}>
                  {isEn ? 'Goods Receipt Ready (PO Approved):' : 'Konfirmasi Penerimaan Barang (Goods Receipt PO):'}
                </span>
                <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                  isLight
                    ? 'bg-emerald-100 border border-emerald-300 text-emerald-950'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]'
                }`}>
                  {approvedPOs.length} PO Siap Diterima Fisik
                </span>
              </div>
              <p className={`text-xs truncate max-w-xl font-medium ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer active:scale-95 shadow-xs"
              title="Konfirmasi fisik barang datang (Goods Receipt) ke stok gudang"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>{isEn ? `Receive Goods (${approvedPOs[0].po_number})` : `Terima Barang (${approvedPOs[0].po_number})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={isEn ? "Search warehouse items (SKU, Product Name, Ref No)..." : "Cari item gudang (SKU, Nama Produk, No Ref)..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none border transition ${
            isLight
              ? 'bg-white border-slate-300 text-slate-900 focus:border-[#0052FF]'
              : 'bg-[#161b22] border-[#30363d] text-white focus:border-[#0052FF]'
          }`}
        />
      </div>

      {/* Inventory & Stock Mutation Card Container */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-lg transition duration-200 ${
          isLight
            ? 'bg-white border-slate-300'
            : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        {/* Navigation Tabs Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-[#30363d] pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveWarehouseTab('inventory')}
              className={`px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer border ${
                activeWarehouseTab === 'inventory'
                  ? 'bg-indigo-600 text-white font-bold text-xs border-indigo-600 shadow-xs'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold text-xs'
                  : 'bg-[#0d1117] text-gray-400 border-[#30363d] font-bold hover:text-white'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>{isEn ? 'Realtime Stock Ledger (DB_Inventory)' : 'Kartu Stok Realtime (DB_Inventory)'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeWarehouseTab === 'inventory'
                  ? 'bg-white/20 text-white font-bold'
                  : isLight
                  ? 'bg-slate-200 text-slate-800 font-bold'
                  : 'bg-black/20 text-white'
              }`}>
                {filteredInventory.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWarehouseTab('mutations')}
              className={`px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer border ${
                activeWarehouseTab === 'mutations'
                  ? 'bg-indigo-600 text-white font-bold text-xs border-indigo-600 shadow-xs'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold text-xs'
                  : 'bg-[#0d1117] text-gray-400 border-[#30363d] font-bold hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{isEn ? 'Stock Mutation History (Stock Card Audit)' : 'Riwayat Mutasi Barang (Stock Card Audit)'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeWarehouseTab === 'mutations'
                  ? 'bg-white/20 text-white font-bold'
                  : isLight
                  ? 'bg-slate-200 text-slate-800 font-bold'
                  : 'bg-black/20 text-white'
              }`}>
                {filteredMutations.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-btn-stock-alert"
              onClick={() => setActiveWarehouseTab('stock_alert')}
              className={`px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer border ${
                activeWarehouseTab === 'stock_alert'
                  ? 'bg-indigo-600 text-white font-bold text-xs border-indigo-600 shadow-xs'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold text-xs'
                  : 'bg-[#0d1117] text-gray-400 border-[#30363d] font-bold hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isEn ? 'Critical Stock Alerts (4 Alerts)' : 'Peringatan Stok Kritis (4 Alert)'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeWarehouseTab === 'stock_alert'
                  ? 'bg-white/20 text-white'
                  : isLight
                  ? 'bg-rose-100 border border-rose-300 text-rose-950 font-bold'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {lowStockProducts.length} Alert
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWarehouseTab('bad_stock')}
              className={`px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer border ${
                activeWarehouseTab === 'bad_stock'
                  ? 'bg-indigo-600 text-white font-bold text-xs border-indigo-600 shadow-xs'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold text-xs'
                  : 'bg-[#0d1117] text-gray-400 border-[#30363d] font-bold hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isEn ? 'Quarantine & Bad Stock' : 'Karantina & Bad Stock'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeWarehouseTab === 'bad_stock'
                  ? 'bg-white/20 text-white'
                  : isLight
                  ? 'bg-rose-100 border border-rose-300 text-rose-950'
                  : 'bg-black/20 text-white'
              }`}>
                {(badStockItems || []).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWarehouseTab('grn')}
              className={`px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer border ${
                activeWarehouseTab === 'grn'
                  ? 'bg-indigo-600 text-white font-bold text-xs border-indigo-600 shadow-xs'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold text-xs'
                  : 'bg-[#0d1117] text-gray-400 border-[#30363d] font-bold hover:text-white'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isEn ? 'Goods Receipt (GRN & PO)' : 'Penerimaan Barang (GRN)'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeWarehouseTab === 'grn'
                  ? 'bg-white/20 text-white font-bold'
                  : isLight
                  ? 'bg-slate-200 text-slate-800 font-bold'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {approvedPOs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWarehouseTab('stock_opname')}
              className={`px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer border ${
                activeWarehouseTab === 'stock_opname'
                  ? 'bg-indigo-600 text-white font-bold text-xs border-indigo-600 shadow-xs'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold text-xs'
                  : 'bg-[#0d1117] text-gray-400 border-[#30363d] font-bold hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>{isEn ? 'Stock Opname' : 'Stock Opname'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeWarehouseTab === 'stock_opname'
                  ? 'bg-white/20 text-white font-bold'
                  : isLight
                  ? 'bg-slate-200 text-slate-800 font-bold'
                  : 'bg-teal-500/20 text-teal-300'
              }`}>
                {products.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedProductForOpname(null);
                setIsStockOpnameOpen(true);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800'
                  : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25'
              }`}
            >
              <ClipboardCheck className={`w-3.5 h-3.5 ${isLight ? 'text-slate-800' : ''}`} />
              <span>{isEn ? 'Stock Opname' : 'Stock Opname'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-auto ${
                isLight
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isEn ? 'Manual Adjustment' : 'Penyesuaian Manual'}</span>
            </button>
          </div>
        </div>

        {/* TAB GRN: PENERIMAAN BARANG PO */}
        {activeWarehouseTab === 'grn' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isEn ? 'Pending & Approved Purchase Orders (Ready for GRN)' : 'Daftar Purchase Order (PO) Siap Diterima (GRN)'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isEn
                    ? 'Select an approved or pending PO to verify physical items, accept partial shipments, and update inventory.'
                    : 'Pilih PO yang disetujui atau pending untuk melakukan verifikasi fisik barang datang, penerimaan bertahap (partial), dan sinkronisasi stok.'}
                </p>
              </div>
            </div>

            {approvedPOs.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <PackageCheck className="w-10 h-10 mx-auto mb-2 text-gray-500 opacity-60" />
                <p className="font-bold text-sm">
                  {isEn ? 'No pending or approved POs awaiting goods receipt.' : 'Tidak ada PO pending atau disetujui yang menunggu penerimaan.'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {isEn ? 'Create or approve POs in the Purchasing module first.' : 'Buat atau setujui PO terlebih dahulu di modul Purchasing.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {approvedPOs.map((po) => (
                  <div
                    key={po.po_number || po.po_id}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f141c] border-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                            {po.po_number}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {po.status}
                          </span>
                        </div>
                        <div className={`font-bold text-sm mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {po.supplier_name}
                        </div>
                      </div>
                      <div className="text-right font-mono font-black text-emerald-400 text-sm">
                        Rp {po.total_amount.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="text-xs text-gray-400 space-y-1">
                      <div>
                        <span className="text-gray-500">{isEn ? 'Items:' : 'Item:'}</span>{' '}
                        <span className="text-gray-300 font-medium">
                          {typeof po.items === 'string'
                            ? po.items
                            : (po.item_details || []).map((d) => `${d.product_name} (${d.qty} ${d.unit})`).join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">{isEn ? 'Date:' : 'Tanggal PO:'}</span> {po.date}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">
                        {isEn ? 'Supports partial receipt' : 'Mendukung penerimaan bertahap'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPoForGr(po);
                          setIsGrModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer transition"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>{isEn ? 'Konfirmasi Penerimaan (GRN)' : 'Konfirmasi Penerimaan (GRN)'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 0: PERINGATAN STOK KRITIS (4 ALERT & AUTO GENERATE PR) */}
        {activeWarehouseTab === 'stock_alert' && (
          <div className="p-4 sm:p-5">
            <StockAlertTab isLight={isLight} />
          </div>
        )}

        {/* TAB 1: KARTU STOK REALTIME (DB_INVENTORY) */}
        {activeWarehouseTab === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`font-bold border-b uppercase tracking-wider text-[11px] ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">{isEn ? 'Product ID' : 'Product ID'}</th>
                  <th className="py-3 px-4">{isEn ? 'Product Name' : 'Nama Produk'}</th>
                  <th className="py-3 px-4 text-center">{isEn ? 'Initial Stock' : 'Stok Awal'}</th>
                  <th className={`py-3 px-4 text-center ${isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400'}`}>
                    {isEn ? 'Inbound (In)' : 'Masuk (In)'}
                  </th>
                  <th className={`py-3 px-4 text-center ${isLight ? 'text-rose-700 font-bold' : 'text-rose-400'}`}>
                    {isEn ? 'Outbound / POS (Out)' : 'Keluar / POS (Out)'}
                  </th>
                  <th className="py-3 px-4 text-center">{isEn ? 'Final Stock' : 'Stok Akhir'}</th>
                  <th className="py-3 px-4 text-center">{isEn ? 'Restock Action (PO)' : 'Aksi Restock (PO)'}</th>
                  <th className="py-3 px-4">{isEn ? 'Last Updated' : 'Pembaruan Terakhir'}</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight
                    ? 'divide-slate-200 text-slate-800'
                    : 'divide-[#30363d] text-gray-300'
                }`}
              >
                {filteredInventory.map((inv, idx) => {
                  const prod = products.find((p) => p.id === inv.product_id);
                  return (
                    <tr
                      key={`inv-row-${inv.product_id}-${idx}`}
                      className={`transition ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-[#21262d]/50'
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={
                          isLight
                            ? 'bg-blue-100 border border-blue-300 text-blue-950 font-bold text-xs px-2 py-0.5 rounded font-mono inline-block'
                            : 'font-mono font-bold text-white'
                        }>
                          {inv.product_id}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 font-bold ${
                          isLight ? 'text-slate-950' : 'text-white'
                        }`}
                      >
                        {prod?.name || inv.product_name}
                      </td>
                      <td className={`py-3 px-4 text-center font-mono ${isLight ? 'text-slate-800 font-medium text-xs' : 'text-gray-400'}`}>
                        {inv.initial_stock}
                      </td>
                      <td className={`py-3 px-4 text-center font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-[#10B981]'}`}>
                        +{inv.in_qty}
                      </td>
                      <td className={`py-3 px-4 text-center font-mono font-bold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                        -{inv.out_qty}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-sm">
                        {(() => {
                          const alertInfo = prod
                            ? getProductAlertThreshold(prod)
                            : { minStock: 10, isLowStock: inv.final_stock <= 10 };
                          const minStock = prod?.minStock ?? prod?.min_stock ?? alertInfo.minStock ?? 10;
                          const isLowStock = inv.final_stock <= minStock || alertInfo.isLowStock || prod?.status === 'Low Stock' || prod?.status === 'Out of Stock';
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 font-mono ${
                                isLight
                                  ? inv.final_stock <= 0 || isLowStock
                                    ? 'bg-rose-100 border border-rose-300 text-rose-950 font-bold text-xs px-2 py-0.5 rounded'
                                    : 'bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs px-2 py-0.5 rounded'
                                  : inv.final_stock <= 0
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full'
                                  : isLowStock
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-full'
                                  : 'bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full'
                              }`}
                            >
                              <span>{inv.final_stock}</span>
                              {isLowStock && (
                                <span className={`text-[9px] font-sans font-bold px-1 rounded ${
                                  isLight ? 'bg-rose-200 border border-rose-400 text-rose-950 font-black' : 'bg-amber-500/30 text-amber-300'
                                }`}>
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
                          const isLowStock = inv.final_stock <= minStock || alertInfo.isLowStock || prod?.status === 'Low Stock' || prod?.status === 'Out of Stock';
                          if (prod && isLowStock) {
                            return (
                              <button
                                type="button"
                                onClick={() => createAutoReorderPO(prod)}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 shadow-xs transition cursor-pointer ${
                                  isLight
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                                }`}
                                title="Buat Draf PO Otomatis ke Purchasing"
                              >
                                <Zap className="w-3 h-3 fill-current" />
                                <span>{isEn ? 'Draft PO' : 'Draf PO'}</span>
                              </button>
                            );
                          }
                          return (
                            <span className={
                              isLight
                                ? 'bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs px-2 py-0.5 rounded inline-block'
                                : 'text-[11px] text-emerald-500/80 font-medium'
                            }>
                              {isEn ? 'Stock Safe' : 'Stock Safe'}
                            </span>
                          );
                        })()}
                      </td>
                      <td className={`py-3 px-4 font-mono ${isLight ? 'text-slate-800 font-medium text-xs' : 'text-[11px] text-gray-400'}`}>
                        {inv.last_update}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: KARTU STOK / STOCK LEDGER (RIWAYAT MUTASI BARANG) */}
        {activeWarehouseTab === 'mutations' && (
          <div>
            {/* Filter Pills and Date Pickers for Stock Ledger */}
            <div className={`p-3 border-b border-slate-200 dark:border-[#30363d] flex flex-wrap items-center justify-between gap-3 text-xs ${
              isLight ? 'bg-slate-50' : 'bg-[#0d1117]/50'
            }`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-bold text-xs ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                  {isEn ? 'Filter Type:' : 'Tipe Mutasi:'}
                </span>
                <button
                  type="button"
                  onClick={() => setMutationTypeFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                    mutationTypeFilter === 'ALL'
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold'
                      : 'bg-slate-800 text-gray-400 font-bold hover:text-white'
                  }`}
                >
                  {isEn ? 'All' : 'Semua'} ({stockMutations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMutationTypeFilter('SALE-POS')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                    mutationTypeFilter === 'SALE-POS'
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold'
                      : 'bg-slate-800 text-blue-300 font-bold hover:bg-slate-700'
                  }`}
                >
                  SALE-POS ({stockMutations.filter((m) => m.type === 'SALE-POS' || m.type === 'OUT / KASIR' || m.type === 'OUT_SALES').length})
                </button>
                <button
                  type="button"
                  onClick={() => setMutationTypeFilter('RESTOCK-PO')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                    mutationTypeFilter === 'RESTOCK-PO'
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold'
                      : 'bg-slate-800 text-teal-300 font-bold hover:bg-slate-700'
                  }`}
                >
                  RESTOCK-PO ({stockMutations.filter((m) => m.type === 'RESTOCK-PO' || m.type.includes('PURCHASE') || m.type.includes('GOODS_RECEIPT')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setMutationTypeFilter('ADJ-LOSS')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                    mutationTypeFilter === 'ADJ-LOSS'
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold'
                      : 'bg-slate-800 text-rose-300 font-bold hover:bg-slate-700'
                  }`}
                >
                  ADJ-LOSS ({stockMutations.filter((m) => m.type === 'ADJ-LOSS' || m.type === 'OUT').length})
                </button>
                <button
                  type="button"
                  onClick={() => setMutationTypeFilter('ADJ-GAIN')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                    mutationTypeFilter === 'ADJ-GAIN'
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold'
                      : 'bg-slate-800 text-emerald-300 font-bold hover:bg-slate-700'
                  }`}
                >
                  ADJ-GAIN ({stockMutations.filter((m) => m.type === 'ADJ-GAIN' || m.type === 'IN').length})
                </button>
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isLight ? 'text-slate-700 font-semibold' : 'text-gray-400'}`}>
                  {isEn ? 'Date:' : 'Periode:'}
                </span>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className={`px-2.5 py-1 rounded-lg border text-xs outline-none font-mono ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                  title="Tanggal Mulai"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className={`px-2.5 py-1 rounded-lg border text-xs outline-none font-mono ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                  title="Tanggal Akhir"
                />
                {(startDateFilter || endDateFilter) && (
                  <button
                    type="button"
                    onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }}
                    className="text-xs text-rose-500 hover:underline font-bold ml-1 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={`font-bold border-b uppercase tracking-wider text-[11px] ${
                    isLight
                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                  }`}
                >
                  <tr>
                    <th className="py-3 px-4">{isEn ? 'Timestamp' : 'Tanggal / Jam'}</th>
                    <th className="py-3 px-4">{isEn ? 'Barcode / Product' : 'Barcode / Nama'}</th>
                    <th className="py-3 px-4">{isEn ? 'Mutation Type' : 'Tipe Mutasi'}</th>
                    <th className="py-3 px-4 text-center">{isEn ? 'Inbound (Masuk)' : 'Masuk'}</th>
                    <th className="py-3 px-4 text-center">{isEn ? 'Outbound (Keluar)' : 'Keluar'}</th>
                    <th className="py-3 px-4 text-center">{isEn ? 'Final Stock' : 'Saldo Akhir'}</th>
                    <th className="py-3 px-4">{isEn ? 'Ref / Notes' : 'Ref / Keterangan'}</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isLight
                      ? 'divide-slate-200 text-slate-800'
                      : 'divide-[#30363d] text-gray-300'
                  }`}
                >
                  {filteredMutations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                        {isEn
                          ? 'No stock ledger mutation records found for this filter'
                          : 'Belum ada catatan kartu stok mutasi untuk filter ini'}
                      </td>
                    </tr>
                  ) : (
                    filteredMutations.map((mut, idx) => {
                      const isIn =
                        mut.type === 'IN' ||
                        mut.type === 'RESTOCK-PO' ||
                        mut.type === 'ADJ-GAIN' ||
                        mut.type.includes('IN_') ||
                        mut.type.includes('PURCHASE') ||
                        mut.type.includes('GOODS_RECEIPT') ||
                        mut.type === 'OPENING_STOCK_MIGRATION';

                      const prod = products.find((p) => p.id === mut.product_id);
                      const barcodeSku = mut.sku || prod?.barcode || prod?.sku || mut.product_id;

                      return (
                        <tr
                          key={`ledger-row-${mut.id}-${idx}`}
                          className={`transition ${
                            isLight ? 'hover:bg-slate-50' : 'hover:bg-[#21262d]/50'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono whitespace-nowrap">
                            <div className={isLight ? 'text-slate-800 font-medium text-xs' : 'text-[11px] text-gray-400'}>
                              {mut.timestamp || mut.date}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className={isLight ? 'text-slate-950 font-bold text-xs' : 'font-semibold text-white'}>
                              {mut.product_name}
                            </div>
                            <div className="mt-0.5">
                              <span className={
                                isLight
                                  ? 'bg-blue-100 border border-blue-300 text-blue-950 font-bold text-xs px-2 py-0.5 rounded font-mono inline-block'
                                  : 'font-mono text-[10px] text-cyan-400 font-bold'
                              }>
                                {barcodeSku}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 font-mono text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                mut.type === 'SALE-POS' || mut.type.includes('OUT')
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : mut.type === 'RESTOCK-PO' || mut.type.includes('PURCHASE')
                                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                                  : mut.type === 'ADJ-LOSS'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  : mut.type === 'ADJ-GAIN'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              }`}
                            >
                              {mut.type}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-center font-mono font-black text-xs ${isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                            {isIn ? `+${mut.qty}` : '-'}
                          </td>
                          <td className={`py-3 px-4 text-center font-mono font-black text-xs ${!isIn ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400'}`}>
                            {!isIn ? `-${mut.qty}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold whitespace-nowrap">
                            <span className={
                              isLight
                                ? 'bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs px-2 py-0.5 rounded inline-block font-mono'
                                : 'px-2 py-0.5 rounded bg-slate-800 text-slate-200'
                            }>
                              {mut.balanceAfter ?? mut.final_stock}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <div className={isLight ? 'text-slate-950 font-bold text-xs font-mono' : 'text-cyan-400 font-bold'}>
                              {mut.reference_no}
                            </div>
                            <div className={isLight ? 'text-slate-700 font-medium mt-0.5' : 'text-gray-400 mt-0.5'}>
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

        {/* TAB 3: KARANTINA & BAD STOCK (RETUR BARANG RUSAK) */}
        {activeWarehouseTab === 'bad_stock' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`font-bold border-b uppercase tracking-wider text-[11px] ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">{isEn ? 'Date & Time' : 'Waktu / Tanggal'}</th>
                  <th className="py-3 px-4">{isEn ? 'SKU & Product' : 'SKU & Nama Produk'}</th>
                  <th className="py-3 px-4 text-center">{isEn ? 'Defective Qty' : 'Qty Rusak'}</th>
                  <th className="py-3 px-4">{isEn ? 'Damage Reason' : 'Kondisi / Alasan'}</th>
                  <th className="py-3 px-4">{isEn ? 'Source Ref' : 'No. Referensi Asal'}</th>
                  <th className="py-3 px-4 text-center">{isEn ? 'Quarantine Status' : 'Status Karantina'}</th>
                  <th className="py-3 px-4">{isEn ? 'Officer / PIC' : 'Petugas / PIC'}</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight
                    ? 'divide-slate-200 text-slate-800'
                    : 'divide-[#30363d] text-gray-300'
                }`}
              >
                {filteredBadStock.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                      {isEn ? 'No defective / quarantine stock items recorded' : 'Tidak ada produk rusak atau dalam karantina'}
                    </td>
                  </tr>
                ) : (
                  filteredBadStock.map((item, idx) => (
                    <tr
                      key={`bad-stock-${item.id}-${idx}`}
                      className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#21262d]/50'}`}
                    >
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <span className={isLight ? 'text-slate-800 font-medium text-xs' : 'text-gray-400'}>
                          {item.timestamp || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className={isLight ? 'text-slate-950 font-bold text-xs' : 'text-white font-bold'}>
                          {item.productName}
                        </div>
                        <div className="mt-0.5">
                          <span className={
                            isLight
                              ? 'bg-blue-100 border border-blue-300 text-blue-950 font-bold text-xs px-2 py-0.5 rounded font-mono inline-block'
                              : 'font-mono text-[10px] text-cyan-400'
                          }>
                            {item.productId}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-sm text-rose-700">
                        {item.qty} Unit
                      </td>
                      <td className={`py-3 px-4 ${isLight ? 'text-slate-800 font-medium text-xs' : 'text-gray-300'}`}>
                        {item.conditionReason || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <span className={isLight ? 'text-slate-950 font-bold text-xs' : 'text-cyan-400 font-bold'}>
                          {item.sourceReference || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={
                          isLight
                            ? 'bg-rose-100 border border-rose-300 text-rose-950 font-bold text-xs px-2 py-0.5 rounded inline-block'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full'
                        }>
                          {item.status || 'QUARANTINED'}
                        </span>
                      </td>
                      <td className={`py-3 px-4 ${isLight ? 'text-slate-950 font-bold text-xs font-mono' : 'text-gray-400 text-xs'}`}>
                        {item.handledBy || 'Staf Gudang'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: STOCK OPNAME (FISIK VS SISTEM & SIMPAN PENYESUAIAN) */}
        {activeWarehouseTab === 'stock_opname' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isEn ? 'Physical Stock Opname & Count Verification' : 'Stock Opname & Penghitungan Fisik Gudang'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isEn
                    ? 'Enter physical counts for products. Discrepancies automatically calculate difference and log ADJ-LOSS or ADJ-GAIN mutations upon saving.'
                    : 'Masukkan hitung fisik produk. Selisih akan dihitung otomatis dan dicatat sebagai mutasi ADJ-LOSS atau ADJ-GAIN saat disimpan.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveStockOpnameBatch}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEn ? 'Simpan Penyesuaian (Save Adjustments)' : 'Simpan Penyesuaian Stock Opname'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={`font-bold border-b uppercase tracking-wider text-[11px] ${
                    isLight
                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                  }`}
                >
                  <tr>
                    <th className="py-3 px-4">Barcode / SKU</th>
                    <th className="py-3 px-4">{isEn ? 'Product Name' : 'Nama Produk'}</th>
                    <th className="py-3 px-4 text-center">{isEn ? 'System Stock' : 'Stok Sistem'}</th>
                    <th className="py-3 px-4 text-center">{isEn ? 'Physical Stock Input' : 'Input Stok Fisik'}</th>
                    <th className="py-3 px-4 text-center">{isEn ? 'Difference (Selisih)' : 'Selisih Otomatis'}</th>
                    <th className="py-3 px-4">{isEn ? 'Reason Notes' : 'Alasan / Catatan (rusak/hilang/salah hitung)'}</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isLight ? 'divide-slate-200 text-slate-800' : 'divide-[#30363d] text-gray-300'
                  }`}
                >
                  {products.map((p) => {
                    const physical = opnamePhysicalStocks[p.id] !== undefined ? opnamePhysicalStocks[p.id] : p.stock;
                    const diff = physical - p.stock;
                    const reason = opnameReasons[p.id] || (diff < 0 ? 'hilang / rusak' : diff > 0 ? 'salah hitung / surplus' : 'salah hitung');

                    return (
                      <tr key={`opname-row-${p.id}`} className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#21262d]/50'}`}>
                        <td className="py-3 px-4 font-mono whitespace-nowrap">
                          <span className={isLight ? 'bg-blue-100 border border-blue-300 text-blue-950 font-bold text-xs px-2 py-0.5 rounded font-mono inline-block' : 'font-mono text-cyan-400 font-bold'}>
                            {p.barcode || p.sku || p.id}
                          </span>
                        </td>
                        <td className={`py-3 px-4 font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                          {p.name}
                        </td>
                        <td className={`py-3 px-4 text-center font-mono ${isLight ? 'text-slate-800 font-medium' : 'text-gray-400'}`}>
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
                            className={`w-24 px-2.5 py-1.5 rounded-lg border text-center font-mono font-bold outline-none ${
                              isLight
                                ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-indigo-600'
                                : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                            }`}
                          />
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-black text-xs whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full ${
                              diff < 0
                                ? isLight
                                  ? 'bg-rose-100 border border-rose-300 text-rose-950 font-bold'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : diff > 0
                                ? isLight
                                  ? 'bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : isLight
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-slate-800 text-slate-400'
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
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${
                              isLight
                                ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-indigo-600 font-medium'
                                : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
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
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md cursor-pointer flex items-center gap-2 transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEn ? 'Simpan Penyesuaian (Save Adjustments)' : 'Simpan Penyesuaian Stock Opname'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Adjust Stock */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl relative border ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900'
                : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            <button
              onClick={() => setIsAdjustModalOpen(false)}
              className={`absolute top-4 right-4 ${
                isLight ? 'text-slate-500 hover:text-slate-950' : 'text-gray-400 hover:text-white'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <h3
              className={`font-black text-base mb-4 ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}
            >
              Mutasi / Penyesuaian Stok Gudang
            </h3>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div>
                <label className={`block mb-1 ${
                  isLight ? 'text-slate-700 font-bold text-xs' : 'text-gray-300 font-semibold'
                }`}>
                  Pilih Produk
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-medium ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-indigo-600'
                      : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                  }`}
                >
                  {products.map((p, pIdx) => (
                    <option key={`wh-opt-${p.id}-${pIdx}`} value={p.id}>
                      {p.name} (Stok: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('IN')}
                  className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                    adjustType === 'IN'
                      ? isLight
                        ? 'bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold text-xs'
                      : 'bg-[#0d1117] text-gray-400 border-[#30363d]'
                  }`}
                >
                  Tambah Stok (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('OUT')}
                  className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                    adjustType === 'OUT'
                      ? isLight
                        ? 'bg-rose-100 border border-rose-300 text-rose-950 font-bold text-xs'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold text-xs'
                      : 'bg-[#0d1117] text-gray-400 border-[#30363d]'
                  }`}
                >
                  Kurangi Stok (-)
                </button>
              </div>

              <div>
                <label className={`block mb-1 ${
                  isLight ? 'text-slate-700 font-bold text-xs' : 'text-gray-300 font-semibold'
                }`}>
                  Jumlah Unit
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-indigo-600'
                      : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 ${
                  isLight ? 'text-slate-700 font-bold text-xs' : 'text-gray-300 font-semibold'
                }`}>
                  Alasan Penyesuaian
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-medium ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-indigo-600'
                      : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                  }`}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800'
                      : 'bg-[#21262d] text-gray-300 hover:bg-[#30363d]'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Terapkan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI RINGKASAN DRAF PO OTOMATIS */}
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

      {/* MODAL: STOCK OPNAME FISIK VS SISTEM */}
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

      {/* MODAL: VERIFIKASI PENERIMAAN BARANG (GOODS RECEIPT / GR) */}
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
