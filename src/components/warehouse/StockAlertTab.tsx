import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  AlertTriangle,
  FilePlus2,
  ExternalLink,
  Zap,
  Boxes,
  ShoppingBag,
  TrendingDown,
  Building2,
  CheckCircle2,
  Search,
  ArrowRight,
  ClipboardCheck,
  PackageX,
  ShieldAlert,
} from 'lucide-react';
import { StockOpnameModal } from './StockOpnameModal';

interface StockAlertTabProps {
  isLight?: boolean;
  isEn?: boolean;
}

export const StockAlertTab: React.FC<StockAlertTabProps> = ({
  isLight = false,
  isEn = false,
}) => {
  const {
    products,
    getProductAlertThreshold,
    createPurchaseRequest,
    getDefaultSupplierForProduct,
    setActiveNav,
    activeUser,
    showToast,
    purchaseRequests,
    purchasing,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductForOpname, setSelectedProductForOpname] = useState<Product | null>(null);
  const [isOpnameModalOpen, setIsOpnameModalOpen] = useState(false);
  const [generatingPrId, setGeneratingPrId] = useState<string | null>(null);

  // Helper to check if a product already has a draft/active PR or in-process restock PO
  const getProductRestockStatus = (p: Product) => {
    const pName = p.name.toLowerCase().trim();
    const pId = p.id.toLowerCase().trim();

    const matchedPR = (purchaseRequests || []).find((pr) => {
      const prItem = (pr.item_name || '').toLowerCase().trim();
      const isNameMatch =
        prItem.includes(pName) ||
        pName.includes(prItem.split('(')[0].trim()) ||
        prItem.includes(pId);
      const isStatusActive =
        pr.status !== 'Rejected' &&
        pr.status !== 'Ditolak' &&
        pr.status !== 'Cancelled';
      return isNameMatch && isStatusActive;
    });

    if (matchedPR) {
      return {
        type: 'PR' as const,
        label: `Draf PR: ${matchedPR.pr_number}`,
        statusText: matchedPR.status,
      };
    }

    const matchedPO = (purchasing || []).find((po) => {
      const isStatusActive =
        po.status !== 'Cancelled' &&
        po.status !== 'Dibatalkan' &&
        po.status !== 'Selesai' &&
        po.status !== 'Completed';
      if (!isStatusActive) return false;

      const poItemsStr = typeof po.items === 'string' ? po.items.toLowerCase() : '';
      if (poItemsStr.includes(pName) || poItemsStr.includes(pId)) return true;

      if (po.item_details && Array.isArray(po.item_details)) {
        return po.item_details.some(
          (d) =>
            d.product_id?.toLowerCase() === pId ||
            (d.product_name && d.product_name.toLowerCase().includes(pName))
        );
      }
      return false;
    });

    if (matchedPO) {
      return {
        type: 'PO' as const,
        label: `PO Restock: ${matchedPO.po_number}`,
        statusText: matchedPO.status,
      };
    }

    return null;
  };

  // Identify low-stock products
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => {
      const thresholdInfo = getProductAlertThreshold(p);
      const minStock = p.min_stock || thresholdInfo.minStock || 10;
      return (
        p.stock <= minStock ||
        p.status === 'Low Stock' ||
        p.status === 'Out of Stock' ||
        thresholdInfo.isLowStock
      );
    });
  }, [products, getProductAlertThreshold]);

  // Unhandled alerts: products without draft PR or restock PO
  const unhandledAlerts = useMemo(() => {
    return lowStockProducts.filter((p) => !getProductRestockStatus(p));
  }, [lowStockProducts, purchaseRequests, purchasing]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return lowStockProducts;
    const q = searchQuery.toLowerCase().trim();
    return lowStockProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.barcode || '').includes(q)
    );
  }, [lowStockProducts, searchQuery]);

  // Statistics calculation
  const totalDeficitUnits = useMemo(() => {
    return lowStockProducts.reduce((acc, p) => {
      const threshold = p.min_stock || getProductAlertThreshold(p).minStock || 10;
      const targetMax = p.initialStock && p.initialStock > threshold ? p.initialStock : Math.max(threshold * 3, 20);
      const deficit = Math.max(1, targetMax - Math.max(0, p.stock));
      return acc + deficit;
    }, 0);
  }, [lowStockProducts, getProductAlertThreshold]);

  const totalEstimatedCost = useMemo(() => {
    return lowStockProducts.reduce((acc, p) => {
      const threshold = p.min_stock || getProductAlertThreshold(p).minStock || 10;
      const targetMax = p.initialStock && p.initialStock > threshold ? p.initialStock : Math.max(threshold * 3, 20);
      const deficit = Math.max(1, targetMax - Math.max(0, p.stock));
      const unitCost = p.cost_price || 15000;
      return acc + deficit * unitCost;
    }, 0);
  }, [lowStockProducts, getProductAlertThreshold]);

  // Handle single Auto Generate PR
  const handleAutoGeneratePR = (p: Product) => {
    setGeneratingPrId(p.id);
    try {
      const threshold = p.min_stock || getProductAlertThreshold(p).minStock || 10;
      const targetMax = p.initialStock && p.initialStock > threshold ? p.initialStock : Math.max(threshold * 3, 20);
      const orderQty = Math.max(1, targetMax - Math.max(0, p.stock));
      const unitCost = p.cost_price || 15000;
      const estimatedCost = orderQty * unitCost;
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const isUrgent = p.stock === 0;

      createPurchaseRequest({
        date: dateStr,
        department: 'Warehouse & Logistik',
        requester_name: activeUser ? `${activeUser.name} (${activeUser.role})` : 'Staf Gudang (Sistem)',
        item_name: p.name,
        qty: orderQty,
        estimated_cost: estimatedCost,
        urgency: isUrgent ? 'High' : 'Medium',
      });

      showToast(
        isEn
          ? `Draft PR automatically generated for ${p.name} (${orderQty} units). Forwarded to Purchasing!`
          : `Draf PR untuk ${p.name} (${orderQty} unit) berhasil dibuat & dikirim ke Purchasing Module!`
      );
    } finally {
      setGeneratingPrId(null);
    }
  };

  // Handle Auto Generate All PR (4 Alert)
  const handleGenerateAllPR = () => {
    if (lowStockProducts.length === 0) {
      showToast('Tidak ada produk kritis di bawah batas stok minimum.');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    let count = 0;

    lowStockProducts.forEach((p) => {
      const threshold = p.min_stock || getProductAlertThreshold(p).minStock || 10;
      const targetMax = p.initialStock && p.initialStock > threshold ? p.initialStock : Math.max(threshold * 3, 20);
      const orderQty = Math.max(1, targetMax - Math.max(0, p.stock));
      const unitCost = p.cost_price || 15000;
      const estimatedCost = orderQty * unitCost;

      createPurchaseRequest({
        date: dateStr,
        department: 'Warehouse & Logistik',
        requester_name: activeUser ? `${activeUser.name} (${activeUser.role})` : 'Staf Gudang (Sistem)',
        item_name: p.name,
        qty: orderQty,
        estimated_cost: estimatedCost,
        urgency: p.stock === 0 ? 'High' : 'Medium',
      });
      count++;
    });

    showToast(
      isEn
        ? `Successfully generated ${count} Purchase Requests for all low-stock items!`
        : `Berhasil membuat ${count} Purchase Request sekaligus untuk seluruh produk kritis di Purchasing Module!`
    );
  };

  const handleOpenOpname = (p: Product) => {
    setSelectedProductForOpname(p);
    setIsOpnameModalOpen(true);
  };

  return (
    <div id="warehouse-stock-alert-tab" className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div
        className={`p-5 rounded-2xl border transition duration-200 ${
          isLight
            ? 'bg-gradient-to-r from-amber-50 via-slate-50 to-orange-50 border-amber-200 text-slate-800'
            : 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-orange-950/20 border-amber-500/30 text-white shadow-[0_0_25px_rgba(245,158,11,0.12)]'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider ${
                  isLight
                    ? 'bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black'
                }`}>
                  Warehouse Stock Alert • Integrasi Purchasing
                </span>
                <span className={`text-xs font-mono ${isLight ? 'text-slate-600 font-semibold' : 'text-gray-400'}`}>
                  {unhandledAlerts.length} Alert Aktif {lowStockProducts.length - unhandledAlerts.length > 0 ? `(${lowStockProducts.length - unhandledAlerts.length} Dalam Proses Restock/PR)` : ''}
                </span>
              </div>
              <h3 className={`text-lg sm:text-xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isEn
                  ? 'Warehouse Stock Alert & Purchasing Requisition Bridge'
                  : 'Peringatan Stok Minimum Gudang & Penghubung Pengadaan (PR)'}
              </h3>
              <p className={`text-xs max-w-2xl leading-relaxed mt-0.5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                {isEn
                  ? 'Identify SKUs below safety thresholds and instantly auto-generate Purchase Requisitions to prevent retail out-of-stock.'
                  : 'Deteksi produk yang berada di bawah batas minimum (Safety Stock) dan langsung buat draf Purchase Requisition ke modul Purchasing.'}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            <button
              id="btn-auto-generate-all-pr"
              type="button"
              onClick={handleGenerateAllPR}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-[0_0_18px_rgba(245,158,11,0.35)] transition cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Auto Generate All PR ({lowStockProducts.length} Alert)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('purchasing')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700'
              }`}
            >
              <span>{isEn ? 'Open Purchasing Module' : 'Buka Modul Purchasing'}</span>
              <ExternalLink className={`w-3.5 h-3.5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div>
            <span className={`block ${isLight ? 'text-slate-700 font-bold text-xs' : 'text-[11px] text-gray-400 font-medium'}`}>
              {isEn ? 'Stock Alert Items' : 'Total Produk Kritis'}
            </span>
            <span className={`text-2xl font-black font-mono mt-1 block ${isLight ? 'text-slate-950' : 'text-amber-400'}`}>
              {lowStockProducts.length} Produk
            </span>
            <span className={`text-xs mt-0.5 block font-mono ${isLight ? 'text-rose-950 font-bold' : 'text-amber-400/80 text-[10px]'}`}>
              {lowStockProducts.length === 4 ? '4 Alert (Di Bawah Minimum)' : `${lowStockProducts.length} Perlu Restock`}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            isLight ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div>
            <span className={`block ${isLight ? 'text-slate-700 font-bold text-xs' : 'text-[11px] text-gray-400 font-medium'}`}>
              {isEn ? 'Total Deficit Units' : 'Total Defisit Unit'}
            </span>
            <span className={`text-2xl font-black font-mono mt-1 block ${isLight ? 'text-slate-950' : 'text-cyan-400'}`}>
              {totalDeficitUnits} Unit
            </span>
            <span className={`text-xs mt-0.5 block font-medium ${isLight ? 'text-slate-700' : 'text-gray-400 text-[10px]'}`}>
              Untuk kembali ke batas aman
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            isLight ? 'bg-blue-100 text-blue-950 border-blue-300' : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
          }`}>
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div>
            <span className={`block ${isLight ? 'text-slate-700 font-bold text-xs' : 'text-[11px] text-gray-400 font-medium'}`}>
              {isEn ? 'Estimated Reorder Cost' : 'Estimasi Biaya Restock'}
            </span>
            <span className={`text-2xl font-black font-mono mt-1 block ${isLight ? 'text-slate-950' : 'text-emerald-400'}`}>
              Rp {totalEstimatedCost.toLocaleString('id-ID')}
            </span>
            <span className={`text-xs mt-0.5 block font-medium ${isLight ? 'text-slate-700' : 'text-gray-400 text-[10px]'}`}>
              Berdasarkan HPP pemasok resmi
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          }`}>
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div>
            <span className={`block ${isLight ? 'text-slate-700 font-bold text-xs' : 'text-[11px] text-gray-400 font-medium'}`}>
              {isEn ? 'Purchasing Integration' : 'Status Integrasi Purchasing'}
            </span>
            <span className={`text-sm font-black mt-1 block flex items-center gap-1.5 ${
              isLight ? 'text-slate-950' : 'text-white'
            }`}>
              <CheckCircle2 className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
              <span>Siap Terbitkan PR</span>
            </span>
            <span className={`text-xs mt-0.5 block font-semibold ${isLight ? 'text-emerald-800' : 'text-emerald-400 text-[10px]'}`}>
              1-Klik kirim ke antrean approval
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            isLight ? 'bg-purple-100 text-purple-950 border-purple-300' : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
          }`}>
            <FilePlus2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Toolbar & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={isEn ? 'Search low-stock products, SKU...' : 'Cari produk alert, SKU, kategori...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none transition ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                : 'bg-[#161b22] border-[#30363d] text-white focus:border-amber-500'
            }`}
          />
        </div>

        <span className={`text-xs font-mono self-end sm:self-center ${isLight ? 'text-slate-700 font-semibold' : 'text-gray-400'}`}>
          Menampilkan {filteredProducts.length} dari {lowStockProducts.length} SKU Kritis
        </span>
      </div>

      {/* 4. Daftar 4 Produk di Bawah Minimum Stock */}
      {filteredProducts.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center ${
          isLight ? 'bg-slate-50 border-slate-300 text-slate-700' : 'border-slate-700/60 text-gray-400'
        }`}>
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
          <p className={`font-bold text-sm ${isLight ? 'text-slate-950' : 'text-white'}`}>Seluruh Produk Memiliki Stok Aman!</p>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-gray-500'}`}>
            Tidak ada SKU yang berada di bawah ambang batas minimum saat ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((p) => {
            const thresholdInfo = getProductAlertThreshold(p);
            const minStock = p.min_stock || thresholdInfo.minStock || 10;
            const targetMax = p.initialStock && p.initialStock > minStock ? p.initialStock : Math.max(minStock * 3, 20);
            const currentStock = Math.max(0, p.stock);
            const deficitQty = Math.max(1, targetMax - currentStock);
            const unitCost = p.cost_price || 15000;
            const estimatedCost = deficitQty * unitCost;
            const supplier = getDefaultSupplierForProduct(p) || p.supplier || 'Supplier Rekanan Lokal';
            const isOut = currentStock === 0;
            const restockStatus = getProductRestockStatus(p);

            return (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isLight
                    ? 'bg-white border-slate-300 hover:border-slate-400 shadow-xs'
                    : 'bg-[#161b22] border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                }`}
              >
                <div>
                  {/* Top Bar: SKU, Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-mono ${
                        isLight
                          ? 'bg-blue-100 border border-blue-300 text-blue-950 font-bold text-xs px-2 py-0.5 rounded'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black px-2.5 py-0.5 rounded'
                      }`}>
                        {p.id}
                      </span>
                      <span className={`text-[10px] font-mono ${isLight ? 'text-slate-600 font-semibold' : 'text-gray-400'}`}>
                        Barcode: {p.barcode || '-'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {restockStatus && (
                        <span className={`font-mono ${
                          isLight
                            ? 'bg-blue-100 border border-blue-300 text-blue-950 font-bold text-xs px-2 py-0.5 rounded'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full'
                        }`}>
                          ✓ {restockStatus.label}
                        </span>
                      )}
                      <span
                        className={`font-mono uppercase tracking-wider ${
                          isLight
                            ? 'bg-rose-100 border border-rose-300 text-rose-950 font-bold text-xs px-2 py-0.5 rounded'
                            : isOut
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-black animate-pulse px-2.5 py-0.5 rounded-full'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full'
                        }`}
                      >
                        {isOut ? 'OUT OF STOCK (0)' : `LOW STOCK (${currentStock})`}
                      </span>
                    </div>
                  </div>

                  {/* Title & Brand */}
                  <h4 className={`font-black text-sm line-clamp-1 ${isLight ? 'text-slate-950' : 'text-white'}`}>{p.name}</h4>
                  <div className={`text-[11px] mt-0.5 flex items-center gap-2 ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
                    <span>{p.category || 'Barang Umum'}</span>
                    <span>•</span>
                    <span>Brand: <strong className={isLight ? 'text-slate-950 font-bold' : 'text-gray-300'}>{p.brand || 'Original'}</strong></span>
                  </div>

                  {/* Stock Metrics Grid */}
                  <div className={`grid grid-cols-3 gap-2.5 my-3.5 p-3 rounded-xl border text-xs ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 shadow-2xs'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}>
                    <div>
                      <span className={`block ${isLight ? 'text-slate-700 font-bold text-xs' : 'text-[10px] text-gray-400 font-medium'}`}>
                        Stok Riil Saat Ini
                      </span>
                      <span
                        className={`font-mono mt-0.5 block ${
                          isLight
                            ? 'text-slate-950 font-black text-sm'
                            : isOut
                            ? 'text-base font-black text-rose-400'
                            : 'text-base font-black text-amber-400'
                        }`}
                      >
                        {currentStock} {p.unit || 'Unit'}
                      </span>
                    </div>

                    <div>
                      <span className={`block ${isLight ? 'text-slate-700 font-bold text-xs' : 'text-[10px] text-gray-400 font-medium'}`}>
                        Batas Minimum (Safety)
                      </span>
                      <span className={`font-mono mt-0.5 block ${isLight ? 'text-slate-950 font-black text-sm' : 'text-base font-bold text-gray-300'}`}>
                        {minStock} {p.unit || 'Unit'}
                      </span>
                    </div>

                    <div>
                      <span className={`block ${isLight ? 'text-slate-700 font-bold text-xs' : 'text-[10px] text-gray-400 font-medium'}`}>
                        Defisit Pengadaan
                      </span>
                      <span className={`font-mono mt-0.5 block ${
                        isLight
                          ? 'text-slate-950 font-black text-sm'
                          : 'text-base font-black text-cyan-400'
                      }`}>
                        +{deficitQty} {p.unit || 'Unit'}
                      </span>
                    </div>
                  </div>

                  {/* Procurement & Supplier Info */}
                  <div className="space-y-1 text-xs mb-4">
                    <div className={`flex items-center justify-between ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
                      <span>Estimasi Harga Modal (HPP):</span>
                      <span className={`font-mono ${isLight ? 'text-slate-950 font-black' : 'text-gray-200 font-medium'}`}>
                        Rp {unitCost.toLocaleString('id-ID')} / {p.unit || 'Unit'}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
                      <span>Total Estimasi Biaya PR:</span>
                      <span className={`font-mono ${isLight ? 'text-slate-950 font-black' : 'text-emerald-400 font-bold'}`}>
                        Rp {estimatedCost.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between pt-1 border-t ${
                      isLight ? 'border-slate-300 text-slate-700 font-medium' : 'border-slate-800 text-gray-400'
                    }`}>
                      <span className="flex items-center gap-1">
                        <Building2 className={`w-3.5 h-3.5 ${isLight ? 'text-slate-600' : 'text-gray-500'}`} />
                        <span>Supplier Rekanan:</span>
                      </span>
                      <span className={`truncate max-w-[180px] ${isLight ? 'text-slate-950 font-bold' : 'text-gray-300 font-semibold'}`}>
                        {supplier}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className={`pt-3 border-t flex items-center justify-between gap-2 ${
                  isLight ? 'border-slate-300' : 'border-slate-800'
                }`}>
                  <button
                    type="button"
                    id={`btn-opname-${p.id}`}
                    onClick={() => handleOpenOpname(p)}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 font-semibold text-xs'
                        : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-gray-300 font-bold text-xs'
                    }`}
                    title="Periksa fisik nyata vs stok sistem"
                  >
                    <ClipboardCheck className={`w-3.5 h-3.5 ${isLight ? 'text-slate-800' : 'text-cyan-400'}`} />
                    <span>Opname Fisik</span>
                  </button>

                  <button
                    type="button"
                    id={`btn-auto-pr-${p.id}`}
                    disabled={generatingPrId === p.id}
                    onClick={() => handleAutoGeneratePR(p)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95 disabled:opacity-50 ${
                      isLight
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black'
                    }`}
                  >
                    <FilePlus2 className={`w-4 h-4 ${isLight ? 'text-white' : 'fill-slate-950'}`} />
                    <span>Auto Generate PR</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stock Opname Modal */}
      {isOpnameModalOpen && (
        <StockOpnameModal
          isOpen={isOpnameModalOpen}
          preselectedProduct={selectedProductForOpname}
          onClose={() => {
            setIsOpnameModalOpen(false);
            setSelectedProductForOpname(null);
          }}
          isLight={isLight}
          isEn={isEn}
        />
      )}
    </div>
  );
};
export default StockAlertTab;
