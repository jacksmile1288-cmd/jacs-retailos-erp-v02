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
import { filterProductsByBusinessDomain } from '../../utils/buildingDomainIsolation';

interface StockAlertTabProps {
  isLight?: boolean;
  isEn?: boolean;
}

export const StockAlertTab: React.FC<StockAlertTabProps> = ({
  isLight = false,
  isEn = false,
}) => {
  const {
    products: rawProducts,
    businessDomainConfig,
    getProductAlertThreshold,
    createPurchaseRequest,
    getDefaultSupplierForProduct,
    createAutoReorderPO,
    setActiveNav,
    activeUser,
    showToast,
    purchaseRequests,
    purchasing,
  } = useApp();

  const products = useMemo(
    () => filterProductsByBusinessDomain(rawProducts || [], businessDomainConfig),
    [rawProducts, businessDomainConfig]
  );

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

  const hasAlerts = lowStockProducts.length > 0;
  const hasUnhandled = unhandledAlerts.length > 0;

  return (
    <div id="warehouse-stock-alert-tab" className="space-y-6 animate-in fade-in duration-200 font-sans">
      {/* 1. Header Banner */}
      <div
        className={`p-5 rounded-2xl border transition-all duration-200 ${
          hasAlerts
            ? isLight
              ? 'border-rose-500/80 bg-rose-500/5 shadow-[0_0_18px_rgba(244,63,94,0.22)] text-slate-900'
              : 'border-rose-500/75 bg-rose-500/10 shadow-[0_0_18px_rgba(244,63,94,0.2)] text-white'
            : isLight
            ? 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.22)] text-slate-900'
            : 'border-amber-500/70 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.18)] text-white'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
                hasAlerts
                  ? isLight
                    ? 'bg-rose-50 text-rose-600 border-rose-500/60'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                  : isLight
                  ? 'bg-amber-50 text-amber-600 border-amber-500/60'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal uppercase tracking-widest border ${
                    hasAlerts
                      ? isLight
                        ? 'bg-rose-50 border-rose-500/60 text-rose-700'
                        : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                      : isLight
                      ? 'bg-amber-50 border-amber-500/60 text-amber-700'
                      : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {hasAlerts && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />}
                  <span>Warehouse Stock Alert • Integrasi Purchasing</span>
                </span>
                <span className={`text-[11px] font-mono font-normal tracking-widest uppercase ${
                  hasUnhandled
                    ? 'text-rose-600 dark:text-rose-400'
                    : isLight
                    ? 'text-slate-600'
                    : 'text-slate-400'
                }`}>
                  {unhandledAlerts.length} Alert Aktif{' '}
                  {lowStockProducts.length - unhandledAlerts.length > 0
                    ? `(${lowStockProducts.length - unhandledAlerts.length} Dalam Proses Restock/PR)`
                    : ''}
                </span>
              </div>
              <h3 className={`text-base font-medium tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                {isEn
                  ? 'Warehouse Stock Alert & Purchasing Requisition Bridge'
                  : 'Peringatan Stok Minimum Gudang & Penghubung Pengadaan (PR)'}
              </h3>
              <p className={`text-sm font-normal max-w-2xl leading-relaxed mt-0.5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                hasAlerts
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500/50 shadow-[0_0_16px_rgba(244,63,94,0.28)]'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400/50 shadow-[0_0_16px_rgba(245,158,11,0.28)]'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Auto Generate All PR ({lowStockProducts.length} Alert)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('purchasing')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-medium text-sm border transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                isLight
                  ? 'bg-white hover:bg-cyan-50 text-slate-800 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.12)]'
                  : 'bg-[#161b22] hover:bg-slate-800 text-white border-cyan-500/35'
              }`}
            >
              <span>{isEn ? 'Open Purchasing Module' : 'Buka Modul Purchasing'}</span>
              <ExternalLink className={`w-4 h-4 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 ${
            hasAlerts
              ? isLight
                ? 'border-rose-500/80 bg-rose-500/5 shadow-[0_0_18px_rgba(244,63,94,0.22)] hover:shadow-[0_0_24px_rgba(244,63,94,0.32)] text-slate-900'
                : 'border-rose-500/75 bg-rose-500/10 shadow-[0_0_18px_rgba(244,63,94,0.2)] hover:shadow-[0_0_24px_rgba(244,63,94,0.3)] text-white'
              : isLight
              ? 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.22)] hover:shadow-[0_0_24px_rgba(245,158,11,0.32)] text-slate-900'
              : 'border-amber-500/70 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.18)] hover:shadow-[0_0_24px_rgba(245,158,11,0.28)] text-white'
          }`}
        >
          <div>
            <span className={`flex items-center gap-1.5 text-[11px] font-mono font-normal tracking-widest uppercase ${
              hasAlerts ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {hasAlerts && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />}
              <span>{isEn ? 'Stock Alert Items' : 'Total Produk Kritis'}</span>
            </span>
            <span className={`text-lg font-mono font-medium mt-1 block ${
              hasAlerts ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {lowStockProducts.length} Produk
            </span>
            <span className={`text-sm font-normal mt-0.5 block ${
              hasAlerts ? 'text-rose-600 dark:text-rose-300' : isLight ? 'text-amber-700' : 'text-amber-300/80'
            }`}>
              {lowStockProducts.length === 0 ? 'Aman (Tidak ada kritis)' : `${lowStockProducts.length} Perlu Restock`}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
            hasAlerts
              ? isLight
                ? 'bg-rose-50 text-rose-600 border-rose-300'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/35'
              : isLight
              ? 'bg-amber-50 text-amber-600 border-amber-300'
              : 'bg-amber-500/15 text-amber-400 border-amber-500/35'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 ${
            isLight
              ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] text-slate-900'
              : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] text-white'
          }`}
        >
          <div>
            <span className={`block text-[11px] font-mono font-normal tracking-widest uppercase ${
              isLight ? 'text-slate-600' : 'text-gray-400'
            }`}>
              {isEn ? 'Total Deficit Units' : 'Total Defisit Unit'}
            </span>
            <span className={`text-lg font-mono font-medium mt-1 block ${isLight ? 'text-slate-950' : 'text-cyan-400'}`}>
              {totalDeficitUnits} Unit
            </span>
            <span className={`text-sm font-normal mt-0.5 block ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Untuk kembali ke batas aman
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
            isLight ? 'bg-cyan-50 text-cyan-600 border-cyan-300' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
          }`}>
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 ${
            isLight
              ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] text-slate-900'
              : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] text-white'
          }`}
        >
          <div>
            <span className={`block text-[11px] font-mono font-normal tracking-widest uppercase ${
              isLight ? 'text-slate-600' : 'text-gray-400'
            }`}>
              {isEn ? 'Estimated Reorder Cost' : 'Estimasi Biaya Restock'}
            </span>
            <span className={`text-lg font-mono font-medium mt-1 block ${isLight ? 'text-slate-950' : 'text-emerald-400'}`}>
              Rp {totalEstimatedCost.toLocaleString('id-ID')}
            </span>
            <span className={`text-sm font-normal mt-0.5 block ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Berdasarkan HPP pemasok resmi
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
            isLight ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          }`}>
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 ${
            isLight
              ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] text-slate-900'
              : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] text-white'
          }`}
        >
          <div>
            <span className={`block text-[11px] font-mono font-normal tracking-widest uppercase ${
              isLight ? 'text-slate-600' : 'text-gray-400'
            }`}>
              {isEn ? 'Purchasing Integration' : 'Status Integrasi Purchasing'}
            </span>
            <span className={`text-lg font-mono font-medium mt-1 flex items-center gap-1.5 ${
              isLight ? 'text-slate-950' : 'text-white'
            }`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>Siap Terbitkan PR</span>
            </span>
            <span className={`text-sm font-normal mt-0.5 block ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              1-Klik kirim ke antrean approval
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
            isLight ? 'bg-cyan-50 text-cyan-600 border-cyan-300' : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
          }`}>
            <FilePlus2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Toolbar & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500" />
          <input
            type="text"
            placeholder={isEn ? 'Search low-stock products, SKU...' : 'Cari produk alert, SKU, kategori...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm font-normal border outline-none transition-all duration-200 ${
              isLight
                ? 'bg-white border-cyan-500/70 text-slate-900 shadow-[0_0_14px_rgba(6,182,212,0.14)] focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(6,182,212,0.28)]'
                : 'bg-[#161b22] border-cyan-500/35 text-white shadow-[0_0_14px_rgba(6,182,212,0.08)] focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.24)]'
            }`}
          />
        </div>

        <span className={`text-[11px] font-mono font-normal tracking-widest uppercase self-end sm:self-center ${
          isLight ? 'text-slate-600' : 'text-gray-400'
        }`}>
          Menampilkan {filteredProducts.length} dari {lowStockProducts.length} SKU Kritis
        </span>
      </div>

      {/* 4. Daftar Produk di Bawah Minimum Stock */}
      {filteredProducts.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center ${
          isLight
            ? 'bg-amber-500/5 border-amber-500/70 shadow-[0_0_16px_rgba(245,158,11,0.15)] text-slate-700'
            : 'bg-amber-500/5 border-amber-500/50 shadow-[0_0_16px_rgba(245,158,11,0.1)] text-gray-400'
        }`}>
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
          <p className={`font-medium text-base ${isLight ? 'text-slate-950' : 'text-white'}`}>
            Seluruh Produk Memiliki Stok Aman!
          </p>
          <p className={`text-sm font-normal mt-1 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
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
                className={`p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between ${
                  isOut
                    ? isLight
                      ? 'bg-white border-rose-500/80 shadow-[0_0_18px_rgba(244,63,94,0.2)] hover:shadow-[0_0_24px_rgba(244,63,94,0.3)]'
                      : 'bg-[#161b22] border-rose-500/70 shadow-[0_0_18px_rgba(244,63,94,0.16)] hover:shadow-[0_0_24px_rgba(244,63,94,0.28)]'
                    : isLight
                    ? 'bg-white border-amber-500/80 shadow-[0_0_18px_rgba(245,158,11,0.18)] hover:shadow-[0_0_24px_rgba(245,158,11,0.28)]'
                    : 'bg-[#161b22] border-amber-500/60 shadow-[0_0_18px_rgba(245,158,11,0.14)] hover:shadow-[0_0_24px_rgba(245,158,11,0.26)]'
                }`}
              >
                <div>
                  {/* Top Bar: SKU, Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-mono font-normal text-[11px] tracking-widest uppercase px-2.5 py-0.5 rounded border ${
                        isLight
                          ? 'bg-cyan-50 border-cyan-500/60 text-cyan-800'
                          : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                      }`}>
                        {p.id}
                      </span>
                      <span className={`text-[11px] font-mono font-normal ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                        Barcode: {p.barcode || '-'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {restockStatus && (
                        <span className={`font-mono font-normal text-[11px] px-2.5 py-0.5 rounded-full border ${
                          isLight
                            ? 'bg-cyan-50 border-cyan-500/60 text-cyan-800'
                            : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                        }`}>
                          ✓ {restockStatus.label}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1.5 font-mono font-normal text-[11px] uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                          isOut
                            ? isLight
                              ? 'bg-rose-50 border-rose-500/70 text-rose-700'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/45'
                            : isLight
                            ? 'bg-amber-50 border-amber-500/70 text-amber-700'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/45'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${isOut ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        <span>{isOut ? 'OUT OF STOCK (0)' : `LOW STOCK (${currentStock})`}</span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Brand */}
                  <h4 className={`font-medium text-base line-clamp-1 ${isLight ? 'text-slate-950' : 'text-white'}`}>{p.name}</h4>
                  <div className={`text-sm font-normal mt-0.5 flex items-center gap-2 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                    <span>{p.category || 'Barang Umum'}</span>
                    <span>•</span>
                    <span>
                      Brand: <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-gray-200'}`}>{p.brand || 'Original'}</span>
                    </span>
                  </div>

                  {/* Stock Metrics Grid */}
                  <div className={`grid grid-cols-3 gap-2.5 my-3.5 p-3 rounded-xl border ${
                    isLight
                      ? 'bg-slate-50 border-cyan-500/40 text-slate-900'
                      : 'bg-[#0d1117] border-cyan-500/25'
                  }`}>
                    <div>
                      <span className={`block text-[11px] font-mono font-normal tracking-widest uppercase ${
                        isLight ? 'text-slate-600' : 'text-gray-400'
                      }`}>
                        Stok Riil
                      </span>
                      <span
                        className={`text-lg font-mono font-medium mt-0.5 block ${
                          isOut
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {currentStock} <span className="text-sm font-normal">{p.unit || 'Unit'}</span>
                      </span>
                    </div>

                    <div>
                      <span className={`block text-[11px] font-mono font-normal tracking-widest uppercase ${
                        isLight ? 'text-slate-600' : 'text-gray-400'
                      }`}>
                        Minimum
                      </span>
                      <span className={`text-lg font-mono font-medium mt-0.5 block ${isLight ? 'text-slate-900' : 'text-gray-200'}`}>
                        {minStock} <span className="text-sm font-normal">{p.unit || 'Unit'}</span>
                      </span>
                    </div>

                    <div>
                      <span className={`block text-[11px] font-mono font-normal tracking-widest uppercase ${
                        isLight ? 'text-slate-600' : 'text-gray-400'
                      }`}>
                        Defisit
                      </span>
                      <span className={`text-lg font-mono font-medium mt-0.5 block ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                        +{deficitQty} <span className="text-sm font-normal">{p.unit || 'Unit'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Procurement & Supplier Info */}
                  <div className="space-y-1 text-sm font-normal mb-4">
                    <div className={`flex items-center justify-between ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                      <span>Estimasi Harga Modal (HPP):</span>
                      <span className={`font-mono font-normal ${isLight ? 'text-slate-900' : 'text-gray-200'}`}>
                        Rp {unitCost.toLocaleString('id-ID')} / {p.unit || 'Unit'}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                      <span>Total Estimasi Biaya PR:</span>
                      <span className={`font-mono font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                        Rp {estimatedCost.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between pt-1.5 border-t ${
                      isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-gray-400'
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <Building2 className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-gray-500'}`} />
                        <span>Supplier Rekanan:</span>
                      </span>
                      <span className={`truncate max-w-[180px] font-medium ${isLight ? 'text-slate-900' : 'text-gray-200'}`}>
                        {typeof supplier === 'string' ? supplier : (supplier?.name || 'Supplier Rekanan Lokal')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className={`pt-3 border-t flex items-center justify-between gap-2 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}>
                  <button
                    type="button"
                    id={`btn-opname-${p.id}`}
                    onClick={() => handleOpenOpname(p)}
                    className={`px-3.5 py-2 rounded-xl border flex items-center gap-1.5 text-sm font-medium transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                      isLight
                        ? 'bg-white hover:bg-cyan-50 border-cyan-500/60 text-slate-800 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                        : 'border-cyan-500/35 bg-[#0d1117] hover:bg-slate-800 text-gray-200'
                    }`}
                    title="Periksa fisik nyata vs stok sistem"
                  >
                    <ClipboardCheck className={`w-4 h-4 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
                    <span>Opname Fisik</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id={`btn-auto-po-${p.id}`}
                      onClick={() => createAutoReorderPO(p)}
                      className={`px-3 py-2 rounded-xl font-medium text-xs flex items-center gap-1.5 border transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                        isLight
                          ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      }`}
                      title="Buat Draft PO otomatis ke modul Purchasing dengan rekomendasi jumlah pesanan dan badge AUTO-REORDER"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>+ Buat Draft PO</span>
                    </button>

                    <button
                      type="button"
                      id={`btn-auto-pr-${p.id}`}
                      disabled={generatingPrId === p.id}
                      onClick={() => handleAutoGeneratePR(p)}
                      className={`px-3 py-2 rounded-xl font-medium text-xs flex items-center gap-1.5 border transition-all duration-200 cursor-pointer active:scale-[0.99] disabled:opacity-50 ${
                        isOut
                          ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                          : isLight
                          ? 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      <FilePlus2 className="w-3.5 h-3.5" />
                      <span>Auto PR</span>
                    </button>
                  </div>
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
