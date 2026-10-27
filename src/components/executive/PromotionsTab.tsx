import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PromotionProgram } from '../../types';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
  Percent,
  DollarSign,
  Gift,
  Zap,
  Check,
  X,
  Layers,
  Calendar,
  AlertCircle,
  Smartphone,
} from 'lucide-react';

interface PromotionsTabProps {
  isLight: boolean;
  isEn: boolean;
}

export const PromotionsTab: React.FC<PromotionsTabProps> = ({ isLight, isEn }) => {
  const {
    promotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotionStatus,
    products,
    showToast,
    addAuditLog,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<PromotionProgram['type']>('SKU_DISCOUNT');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'IDR'>('PERCENT');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [targetProductSku, setTargetProductSku] = useState('');
  const [bundleProductSkus, setBundleProductSkus] = useState<string[]>([]);
  const [minPurchaseQty, setMinPurchaseQty] = useState<number>(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState('');

  const activeCount = promotions.filter((p) => p.isActive).length;

  const handleOpenCreate = () => {
    setEditingPromoId(null);
    setCode(`PROMO-${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setType('SKU_DISCOUNT');
    setDiscountType('PERCENT');
    setDiscountValue(10);
    setTargetProductSku(products[0]?.id || '');
    setBundleProductSkus([]);
    setMinPurchaseQty(1);
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setDescription('Program diskon resmi disetujui Manajemen JacS ERP');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promo: PromotionProgram) => {
    setEditingPromoId(promo.id);
    setCode(promo.code);
    setName(promo.name);
    setType(promo.type);
    setDiscountType(promo.discountType || (promo.discountValueType === 'PERCENT' ? 'PERCENT' : 'IDR'));
    setDiscountValue(promo.discountValue);
    setTargetProductSku(promo.targetProductSku || '');
    setBundleProductSkus(promo.bundleProductSkus || []);
    setMinPurchaseQty(promo.minPurchaseQty || 1);
    setStartDate(promo.startDate || new Date().toISOString().slice(0, 10));
    setEndDate(promo.endDate || new Date().toISOString().slice(0, 10));
    setDescription(promo.description || '');
    setIsModalOpen(true);
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert(isEn ? 'Name and code are required' : 'Nama promo dan kode kupon wajib diisi');
      return;
    }

    if (editingPromoId) {
      updatePromotion(editingPromoId, {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        type,
        discountType,
        discountValue: Number(discountValue) || 0,
        targetProductSku: targetProductSku || undefined,
        bundleProductSkus: type === 'BUNDLE' ? bundleProductSkus : undefined,
        minPurchaseQty: Number(minPurchaseQty) || 1,
        startDate,
        endDate,
        description: description.trim(),
      });
      showToast(isEn ? 'Promotion updated successfully' : 'Program promo berhasil diperbarui');
      addAuditLog('UPDATE', `Updated promo: ${name} (${code})`);
    } else {
      addPromotion({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        type,
        discountType,
        discountValueType: discountType === 'PERCENT' ? 'PERCENT' : 'NOMINAL',
        discountValue: Number(discountValue) || 0,
        targetProductSku: targetProductSku || undefined,
        bundleProductSkus: type === 'BUNDLE' ? bundleProductSkus : undefined,
        minPurchaseQty: Number(minPurchaseQty) || 1,
        startDate,
        endDate,
        status: 'ACTIVE',
        isActive: true,
        description: description.trim(),
        authorizedBy: 'General Manager (Executive)',
        approvedBy: 'General Manager (Executive)',
      });
      showToast(isEn ? 'New promotion authorized & published' : 'Program promo baru berhasil diotorisasi & disinkronkan ke POS');
      addAuditLog('CREATE', `Authorized new promo: ${name} (${code})`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, promoName: string) => {
    if (confirm(isEn ? `Delete promo "${promoName}"?` : `Hapus program promo "${promoName}"?`)) {
      deletePromotion(id);
      showToast(isEn ? 'Promotion program deleted' : 'Program promo dihapus');
      addAuditLog('DELETE', `Deleted promo: ${promoName}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Executive Authorization Banner */}
      <div
        className={`p-5 rounded-2xl border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isLight
            ? 'bg-gradient-to-r from-purple-50/80 via-white to-pink-50/80'
            : 'bg-gradient-to-r from-[#170f26] via-[#161b22] to-[#1d102a]'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isEn
                  ? 'Executive Promotion, Discounts & Bundling Hub'
                  : 'Otorisasi Promo, Diskon & Bundling (Promos & Packages)'}
              </h3>
              <span className="bg-purple-100 border border-purple-300 text-purple-900 font-bold text-xs px-2.5 py-0.5 rounded-full font-mono dark:bg-purple-950 dark:border-purple-700 dark:text-purple-300">
                SINKRON POS KASIR
              </span>
            </div>
            <p className="text-slate-800 font-medium text-xs mt-1 max-w-3xl leading-relaxed dark:text-slate-200">
              {isEn
                ? 'Managerial authorization for promotional campaigns: SKU percentage/amount discounts, combo bundling (Buy A + B get X% off), and limited-time flash sales. Active approved programs automatically propagate to POS Cashier registers (PosModule.tsx).'
                : 'Otorisasi eksekutif untuk program promosi: Diskon Khusus SKU (%) atau nominal (Rp), paket bundling hemat (Beli A + B diskon X%), serta promo berbatas waktu. Program promo yang disetujui otomatis tersinkronisasi ke register kasir (PosModule.tsx) agar kasir dapat menerapkan potongan resmi tanpa otorisasi manual berulang.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-500/10 text-right">
            <div className="text-slate-700 font-bold text-xs uppercase tracking-wider dark:text-slate-300">
              {isEn ? 'Active Programs' : 'Promo Aktif'}
            </div>
            <div className="text-lg font-black font-mono text-purple-400">
              {activeCount} <span className="text-xs font-normal text-slate-400">/ {promotions.length} Promo</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-slate-950 flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.35)] cursor-pointer transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? '+ Create Promotion' : '+ Buat Program Promo'}</span>
          </button>
        </div>
      </div>

      {/* POS Synchronization Alert Callout */}
      <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
        isLight ? 'bg-cyan-50/70 border-cyan-200 text-cyan-900' : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300'
      }`}>
        <div className="flex items-center gap-2.5">
          <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            {isEn
              ? 'Realtime Sync Active: Cashiers at all 10 POS Terminals can immediately redeem these approved vouchers & package deals.'
              : 'Sinkronisasi POS Kasir Aktif: Operator kasir di seluruh 10 Terminal POS dapat langsung menerapkan kupon voucher & bundling ini saat checkout transaksi.'}
          </span>
        </div>
        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
          DB_PROMOTIONS LIVE
        </span>
      </div>

      {/* Cards of Promotions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promotions.map((promo) => {
          const isBundle = promo.type === 'BUNDLE';
          const isFlash = promo.type === 'FLASH_SALE';
          const isCategory = promo.type === 'CATEGORY_DISCOUNT';

          const badgeColor = isBundle
            ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
            : isFlash
            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
            : isCategory
            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

          const targetProd = products.find((p) => p.id === promo.targetProductSku);

          return (
            <div
              key={promo.id}
              className={`p-5 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xs flex flex-col justify-between transition-all relative overflow-hidden ${
                isLight ? 'bg-white' : 'bg-[#161b22]'
              } ${!promo.isActive ? 'opacity-60' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase font-mono ${badgeColor}`}>
                    {promo.type.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => togglePromotionStatus(promo.id)}
                      className={`cursor-pointer transition ${
                        promo.isActive
                          ? 'bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200 border border-slate-400 text-slate-800 font-bold text-[10px] px-2 py-0.5 rounded-full dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200'
                      }`}
                    >
                      {promo.isActive ? 'AKTIF DI POS' : 'NON-AKTIF'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {promo.name}
                  </h4>
                  <div className="font-mono bg-purple-100 border border-purple-300 text-purple-900 font-black text-xs px-2 py-0.5 rounded dark:bg-purple-950 dark:border-purple-700 dark:text-purple-300">
                    {promo.discountType === 'PERCENT'
                      ? `${promo.discountValue}% OFF`
                      : `Rp ${promo.discountValue.toLocaleString('id-ID')} OFF`}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <Tag className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                    {promo.code}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {targetProd && (
                    <div className="flex justify-between text-slate-800 font-bold text-xs dark:text-slate-200">
                      <span>Target Item:</span>
                      <span className="truncate max-w-[180px]">
                        {targetProd.name}
                      </span>
                    </div>
                  )}

                  {isBundle && promo.bundleProductSkus && promo.bundleProductSkus.length > 0 && (
                    <div className="flex justify-between text-slate-700 font-semibold dark:text-slate-300">
                      <span>Produk Bundle (+):</span>
                      <span className="font-bold text-purple-700 dark:text-purple-300">
                        {promo.bundleProductSkus.length} Item Tambahan
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-700 font-medium dark:text-slate-400">
                    <span>Min. Pembelian:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {promo.minPurchaseQty || 1} Unit
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-700 font-medium dark:text-slate-400">
                    <span>Masa Berlaku:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-300 text-[11px]">
                      {promo.startDate} s/d {promo.endDate}
                    </span>
                  </div>
                </div>

                {promo.description && (
                  <p className="text-[11px] text-slate-700 dark:text-slate-400 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    {promo.description}
                  </p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-700/40 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 text-[10px]">
                  Otorisasi: {promo.authorizedBy || promo.approvedBy || 'General Manager'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(promo)}
                    className="p-1 rounded text-slate-400 hover:text-purple-400 cursor-pointer"
                    title={isEn ? 'Edit Promo' : 'Edit Promo'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(promo.id, promo.name)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                    title={isEn ? 'Delete Promo' : 'Hapus Promo'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Form: Add / Edit Promo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div
            className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base">
                  {editingPromoId
                    ? isEn
                      ? 'Edit Promotion Program'
                      : 'Edit Program Promo'
                    : isEn
                    ? 'New Promotion Authorization'
                    : 'Otorisasi Program Promo & Diskon Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">
                    {isEn ? 'Promotion Name' : 'Nama Program Promo'} *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Paket Kopi Hemat Sore"
                    required
                    className={`w-full px-3 py-2 rounded-xl border text-sm transition focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">
                    {isEn ? 'Voucher Code (POS)' : 'Kode Kupon / Voucher'} *
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: HEMATSORE15"
                    required
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-mono font-bold text-amber-400 uppercase transition focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">
                    {isEn ? 'Promo Scheme Type' : 'Skema Promosi'}
                  </label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs transition focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  >
                    <option value="SKU_DISCOUNT">Diskon Khusus SKU</option>
                    <option value="BUNDLE">Paket Bundling Hemat (Beli A + B)</option>
                    <option value="CATEGORY_DISCOUNT">Diskon Seluruh Kategori</option>
                    <option value="FLASH_SALE">Flash Sale / Berbatas Waktu</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">
                    {isEn ? 'Discount Method' : 'Tipe Potongan'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDiscountType('PERCENT')}
                      className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                        discountType === 'PERCENT'
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                          : isLight
                          ? 'bg-slate-100 border-slate-300 text-slate-600'
                          : 'bg-[#0d1117] border-[#30363d] text-slate-400'
                      }`}
                    >
                      Persentase (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('IDR')}
                      className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                        discountType === 'IDR'
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                          : isLight
                          ? 'bg-slate-100 border-slate-300 text-slate-600'
                          : 'bg-[#0d1117] border-[#30363d] text-slate-400'
                      }`}
                    >
                      Nominal (Rp)
                    </button>
                  </div>
                </div>
              </div>

              {/* Discount Value */}
              <div className="space-y-1 p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/10">
                <label className="font-bold text-purple-300 flex justify-between items-center">
                  <span>{isEn ? 'Discount Value' : 'Besaran Nilai Diskon'}</span>
                  <span className="font-mono text-base font-extrabold text-purple-400">
                    {discountType === 'PERCENT' ? `${discountValue}%` : `Rp ${discountValue.toLocaleString('id-ID')}`}
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  step={discountType === 'PERCENT' ? '1' : '1000'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-mono font-bold transition focus:outline-none ${
                    isLight ? 'bg-white border-slate-300 text-purple-900' : 'bg-[#0d1117] border-[#30363d] text-purple-400'
                  }`}
                />
              </div>

              {/* Target Item Selection */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">
                  {isEn ? 'Primary Product Target (SKU)' : 'Produk Sasaran Utama (SKU)'}
                </label>
                <select
                  value={targetProductSku}
                  onChange={(e) => setTargetProductSku(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs transition focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                >
                  <option value="">-- Semua Produk Transaksi --</option>
                  {products.map((p, pIdx) => (
                    <option key={`promo-prod-${p.id}-${pIdx}`} value={p.id}>
                      {p.name} ({p.barcode || p.id}) - Rp {p.sell_price.toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Qty & Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">
                    {isEn ? 'Min Purchase Qty' : 'Min. Jumlah Beli'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minPurchaseQty}
                    onChange={(e) => setMinPurchaseQty(parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-mono transition focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">
                    {isEn ? 'Start Date' : 'Tanggal Mulai'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs transition focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">
                    {isEn ? 'End Date' : 'Tanggal Berakhir'}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs transition focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">
                  {isEn ? 'Executive Description & Notes' : 'Deskripsi & Catatan Promo'}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan syarat dan ketentuan..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs transition focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div className="pt-3 border-t border-slate-700/40 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-purple-500 hover:bg-purple-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-purple-500/25 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isEn ? 'Authorize & Sync to POS' : 'Otorisasi & Sinkronkan ke POS'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
