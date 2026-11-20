import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAudit } from '../../audit';
import {
  PieChart,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Gift,
  CheckCircle2,
  Package,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Layers,
  Database
} from 'lucide-react';

interface AbcMarginMatrixTabProps {
  isDark: boolean;
}

export const AbcMarginMatrixTab: React.FC<AbcMarginMatrixTabProps> = ({ isDark }) => {
  const {
    products = [],
    sales = [],
    salesHistory = [],
    addPromotion,
    showToast,
    businessVertical = 'RETAIL',
    currentUser,
    activeUser
  } = useApp() as any;

  const { recordAudit } = useAudit();
  const effectiveUser = currentUser || activeUser;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  // 1. Akumulasi Qty Terjual Riil (Menggabungkan sales & salesHistory seperti CashierSalesAuditView)
  const realSoldQtyMap: Record<string, number> = {};
  const orderMap = new Map<string, any>();
  [...(sales || []), ...(salesHistory || [])].forEach((sale) => {
    if (sale && (sale.transaction_id || sale.id)) {
      const id = sale.transaction_id || sale.id;
      orderMap.set(id, sale);
    }
  });

  const allCompletedOrders = Array.from(orderMap.values()).filter((t: any) =>
    t.status === 'COMPLETED' || t.status === 'PAID' || !t.status
  );

  allCompletedOrders.forEach((tx: any) => {
    const items = Array.isArray(tx.items) ? tx.items : [];
    items.forEach((it: any) => {
      const pId = it.productId || it.id || it.product?.id;
      const pSku = it.sku || it.product?.sku;
      const pName = it.name || it.product?.name;
      const qty = Number(it.quantity || it.qty) || 1;

      if (pId) realSoldQtyMap[pId] = (realSoldQtyMap[pId] || 0) + qty;
      if (pSku) realSoldQtyMap[pSku] = (realSoldQtyMap[pSku] || 0) + qty;
      if (pName) realSoldQtyMap[pName] = (realSoldQtyMap[pName] || 0) + qty;
    });
  });

  // 2. Klasifikasi Otomatis 3 Kuadran SKU (ABC Inventory & Margin Matrix)
  const evaluatedSkus = useMemo(() => {
    return (products || []).map((p: any) => {
      const cost = Number(p.costPrice ?? p.cost_price ?? p.buy_price) || 0;
      const price = Number(p.retailPrice ?? p.price ?? p.sellingPrice ?? p.sell_price) || 0;
      const marginPercent = price > 0 ? ((price - cost) / price) * 100 : 0;
      const soldQty = realSoldQtyMap[p.id] || realSoldQtyMap[p.sku] || realSoldQtyMap[p.name] || 0;
      const stock = Number(p.stock) || 0;

      // 1. Margin Alert (HPP mendekati atau melebihi harga jual / margin < 10%)
      const isMarginAlert = price <= 0 || cost >= price || marginPercent < 10;

      // 2. Fast-Moving High Margin (Perputaran cepat >= 5 dan margin >= 20%)
      const isFastHighMargin = !isMarginAlert && soldQty >= 5 && marginPercent >= 20;

      // 3. Slow-Moving / Dead Stock > 60 Hari (Penjualan rendah / 0, stok menumpuk)
      const isDeadStock = !isMarginAlert && !isFastHighMargin && (soldQty < 3 || stock > 20);

      let categoryType: 'fast' | 'deadstock' | 'margin_alert' = 'fast';
      if (isMarginAlert) categoryType = 'margin_alert';
      else if (isDeadStock) categoryType = 'deadstock';
      else categoryType = 'fast';

      return {
        product: p,
        costPrice: cost,
        sellingPrice: price,
        marginPercent,
        soldQty,
        stock,
        categoryType
      };
    });
  }, [products, realSoldQtyMap]);

  const fastMovingList = evaluatedSkus.filter(s => s.categoryType === 'fast');
  const deadStockList = evaluatedSkus.filter(s => s.categoryType === 'deadstock');
  const marginAlertList = evaluatedSkus.filter(s => s.categoryType === 'margin_alert');

  const handleCreateBundlePromo = (item: any) => {
    const promoCode = `BUNDLE-${Math.floor(1000 + Math.random() * 9000)}`;
    const promoName = `Bundling Clearance: ${item.product.name} (Cuci Gudang)`;

    if (addPromotion) {
      addPromotion({
        code: promoCode,
        name: promoName,
        type: 'BUNDLING',
        discountValueType: 'PERCENT',
        discountValue: 20,
        applicableSkus: [item.product.id, item.product.sku, item.product.barcode],
        status: 'ACTIVE',
        description: `Rekomendasi Analitik Margin & Deadstock: Diskon bundling untuk mempercepat perputaran stok mengendap (${item.stock} unit).`
      });
    }

    recordAudit({
      traceId: `EXEC-BUNDLE-${Date.now()}`,
      userId: effectiveUser?.id || 'executive-cockpit',
      userName: effectiveUser?.name || 'Direksi / Pimpinan',
      userRole: effectiveUser?.role || 'Executive',
      module: 'POS',
      action: 'CONFIG_CHANGE',
      severity: 'INFO',
      entityId: item.product.id,
      payloadAfter: {
        promoName,
        sku: item.product.sku,
        stock: item.stock
      }
    });

    if (showToast) {
      showToast(`Promo bundling "${promoName}" berhasil diterbitkan untuk mempercepat perputaran deadstock.`);
    }
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all space-y-6 ${
      isDark ? 'bg-slate-900/40 border-cyan-500/35 backdrop-blur-xl shadow-[0_0_16px_rgba(6,182,212,0.1)]' : 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
    }`}>
      <div className={`flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-2 ${
        isDark ? 'border-white/[0.06]' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-xl leading-7 font-medium tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Analitik Margin Riil &amp; Deteksi Dead Stock (ABC Inventory &amp; Margin Matrix)
            </h2>
            <span className={`text-[11px] font-mono font-normal uppercase px-2.5 py-0.5 rounded border ${
              isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 text-cyan-800 border-cyan-200'
            }`}>
              Real-Time AI Matrix
            </span>
          </div>
          <p className={`text-xs leading-5 font-normal mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Klasifikasi otomatis portofolio SKU berdasarkan perputaran penjualan POS, margin kotor, dan risiko dead stock (&gt; 60 hari)
          </p>
        </div>
      </div>

      {/* 3 Kuadran Kartu Ringkasan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Kuadran 1: Fast-Moving High Margin (Emerald) */}
        <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
          isDark
            ? 'bg-slate-900/60 border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.12)]'
            : 'bg-white border-emerald-500/70 shadow-[0_0_16px_rgba(16,185,129,0.18)]'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-medium tracking-wider uppercase ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              ★ Fast-Moving High Margin
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-normal ${
              isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {fastMovingList.length} SKU
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
            SKU dengan perputaran cepat dan margin kotor tinggi untuk prioritas stok &amp; pengamanan rantai pasok.
          </p>
          <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar pt-2">
            {fastMovingList.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Belum ada item terklasifikasi di kuadran ini.</p>
            ) : (
              fastMovingList.slice(0, 6).map((item, idx) => (
                <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className={`font-medium block ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.product.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">{item.soldQty} Terjual • Stok: {item.stock}</span>
                  </div>
                  <span className={`font-mono font-semibold text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    {item.marginPercent.toFixed(1)}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kuadran 2: Slow-Moving / Dead Stock > 60 Hari (Amber Glow) */}
        <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
          isDark
            ? 'bg-slate-900/60 border-amber-500/50 shadow-[0_0_16px_rgba(245,158,11,0.15)]'
            : 'bg-white border-amber-500/70 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-medium tracking-wider uppercase flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Slow-Moving / Dead Stock &gt; 60 Hari
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-normal ${
              isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-800'
            }`}>
              {deadStockList.length} SKU
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
            SKU tanpa penjualan atau perputaran lambat yang mengikat modal kerja. Aktifkan promo bundling instan.
          </p>
          <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar pt-2">
            {deadStockList.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Tidak ada deadstock terdeteksi saat ini.</p>
            ) : (
              deadStockList.slice(0, 5).map((item, idx) => (
                <div key={idx} className={`p-2.5 rounded-xl border space-y-2 text-xs ${
                  isDark ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50/60 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.product.name}</span>
                    <span className="font-mono text-[10px] text-amber-500 font-semibold">{item.stock} Unit</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCreateBundlePromo(item)}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium text-[11px] rounded-lg transition-all cursor-pointer shadow-xs active:scale-[0.99] flex items-center justify-center gap-1"
                  >
                    <Gift className="w-3.5 h-3.5" /> + Buat Promo Bundling
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kuadran 3: Margin Alert (Rose Glow) */}
        <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
          isDark
            ? 'bg-slate-900/60 border-rose-500/50 shadow-[0_0_16px_rgba(244,63,94,0.15)]'
            : 'bg-white border-rose-500/70 shadow-[0_0_16px_rgba(244,63,94,0.2)]'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-medium tracking-wider uppercase flex items-center gap-1.5 ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Margin Alert (HPP &ge; Harga Jual)
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-normal ${
              isDark ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-rose-100 text-rose-800'
            }`}>
              {marginAlertList.length} SKU
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
            SKU dengan harga beli HPP terbaru yang mendekati atau melampaui harga jual eceran. Wajib evaluasi harga.
          </p>
          <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar pt-2">
            {marginAlertList.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Tidak ada margin alert yang kritis.</p>
            ) : (
              marginAlertList.slice(0, 5).map((item, idx) => (
                <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-rose-950/20 border-rose-800/40' : 'bg-rose-50/60 border-rose-200'
                }`}>
                  <div>
                    <span className={`font-medium block ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.product.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">HPP: {formatRupiah(item.costPrice)} • Jual: {formatRupiah(item.sellingPrice)}</span>
                  </div>
                  <span className={`font-mono font-semibold text-xs ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                    {item.marginPercent.toFixed(1)}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
