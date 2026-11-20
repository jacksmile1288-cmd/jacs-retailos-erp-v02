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
      showToast(isEn ? 'Name and code are required' : 'Nama promo dan kode kupon wajib diisi', 'warning');
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
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isLight
            ? 'bg-gradient-to-r from-purple-50/80 via-white to-pink-50/80 border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-gradient-to-r from-[#170f26] via-[#161b22] to-[#1d102a] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.1)]'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-medium text-base leading-6 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isEn
                  ? 'Executive Promotion, Discounts & Bundling Hub'
                  : 'Otorisasi Promo, Diskon & Bundling (Promos & Packages)'}
              </h3>
              <span className="bg-purple-100 border border-purple-300 text-purple-900 font-mono font-normal tracking-wide text-[11px] px-2.5 py-0.5 rounded-full dark:bg-purple-950 dark:border-purple-700 dark:text-purple-300">
                SINKRON POS KASIR
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-normal text-xs leading-5 mt-1 max-w-3xl">
              {isEn
                ? 'Managerial authorization for promotional campaigns: SKU percentage/amount discounts, combo bundling (Buy A + B get X% off), and limited-time flash sales. Active approved programs automatically propagate to POS Cashier registers (PosModule.tsx).'
                : 'Otorisasi eksekutif untuk program promosi: Diskon Khusus SKU (%) atau nominal (Rp), paket bundling hemat (Beli A + B diskon X%), serta promo berbatas waktu. Program promo yang disetujui otomatis tersinkronisasi ke register kasir (PosModule.tsx) agar kasir dapat menerapkan potongan resmi tanpa otorisasi manual berulang.'}
            </p>
          </div>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`rounded-2xl p-4 border hover:-translate-y-0.5 active:scale-[0.99] transition-all ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.1)]'
        }`}>
          <span className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1 block">
            PROMO AKTIF DI POS
          </span>
          <span className="text-lg leading-7 font-mono font-semibold text-slate-900 dark:text-white">
            {activeCount} Program
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-1">
            Terhubung ke terminal kasir
          </p>
        </div>

        <div className={`rounded-2xl p-4 border hover:-translate-y-0.5 active:scale-[0.99] transition-all ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.1)]'
        }`}>
          <span className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1 block">
            TOTAL KATALOG PROMO
          </span>
          <span className="text-lg leading-7 font-mono font-semibold text-slate-900 dark:text-white">
            {promotions.length} Berkas
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-1">
            Katalog promo terdaftar
          </p>
        </div>

        <div className={`rounded-2xl p-4 border hover:-translate-y-0.5 active:scale-[0.99] transition-all flex flex-col justify-between ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.1)]'
        }`}>
          <div>
            <span className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1 block">
              OTORISASI BARU
            </span>
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              Buat Program Diskon
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-2 w-full py-2 rounded-xl text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white shadow-sm cursor-pointer active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isEn ? 'Create Promo' : 'Buat Promo'}</span>
          </button>
        </div>
      </div>
      </div>

      {/* POS Synchronization Alert Callout */}
      <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
        isLight ? 'bg-cyan-50/70 border-cyan-300 text-cyan-900' : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300'
      }`}>
        <div className="flex items-center gap-2.5">
          <Smartphone className="w-4 h-4 text-cyan-500 shrink-0" />
          <span className="font-normal text-xs leading-5">
            {isEn
              ? 'Realtime Sync Active: Cashiers at all 10 POS Terminals can immediately redeem these approved vouchers & package deals.'
              : 'Sinkronisasi POS Kasir Aktif: Operator kasir di seluruh 10 Terminal POS dapat langsung menerapkan kupon voucher & bundling ini saat checkout transaksi.'}
          </span>
        </div>
        <span className="font-mono font-normal text-[11px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/40">
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
              className={`p-5 rounded-2xl border hover:-translate-y-0.5 active:scale-[0.99] transition-all flex flex-col justify-between relative overflow-hidden ${
                isLight
                  ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
                  : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.1)]'
              } ${!promo.isActive ? 'opacity-60' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className={`text-[10px] font-mono font-normal tracking-wide px-2 py-0.5 rounded border uppercase ${badgeColor}`}>
                    {promo.type.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => togglePromotionStatus(promo.id)}
                      className={`cursor-pointer active:scale-[0.99] transition px-2.5 py-1 rounded-full text-xs font-medium border ${
                        promo.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {promo.isActive ? 'AKTIF' : 'NON-AKTIF'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-medium text-base leading-6 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {promo.name}
                  </h4>
                  <div className="font-mono bg-purple-100 border border-purple-300 text-purple-900 font-semibold text-xs px-2 py-0.5 rounded dark:bg-purple-950 dark:border-purple-700 dark:text-purple-300">
                    {promo.discountType === 'PERCENT'
                      ? `${promo.discountValue}% OFF`
                      : `Rp ${promo.discountValue.toLocaleString('id-ID')} OFF`}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <Tag className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span className="font-mono font-normal text-amber-600 dark:text-amber-400 tracking-wider">
                    {promo.code}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {targetProd && (
                    <div className="flex justify-between text-slate-700 dark:text-slate-300 font-normal text-xs">
                      <span>Target Item:</span>
                      <span className="truncate max-w-[180px] font-medium text-slate-900 dark:text-white">
                        {targetProd.name}
                      </span>
                    </div>
                  )}

                  {isBundle && promo.bundleProductSkus && promo.bundleProductSkus.length > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 font-normal">
                      <span>Produk Bundle (+):</span>
                      <span className="font-medium text-purple-700 dark:text-purple-300">
                        {promo.bundleProductSkus.length} Item Tambahan
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-normal">
                    <span>Min. Pembelian:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {promo.minPurchaseQty || 1} Unit
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-normal">
                    <span>Masa Berlaku:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-300 text-[11px]">
                      {promo.startDate} s/d {promo.endDate}
                    </span>
                  </div>
                </div>

                {promo.description && (
                  <p className="text-[11px] leading-4 font-normal text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
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
                    className="p-1 rounded text-slate-400 hover:text-purple-400 cursor-pointer active:scale-[0.99] transition-all"
                    title={isEn ? 'Edit Promo' : 'Edit Promo'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(promo.id, promo.name)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer active:scale-[0.99] transition-all"
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
          <div className={`w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
            isLight
              ? 'bg-white border border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
              : 'bg-[#161b22] border border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.1)]'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/40 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-medium text-base leading-6 text-slate-900 dark:text-white">
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
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold app-text-sub">
                    {isEn ? 'Promotion Name' : 'Nama Program Promo'} *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Paket Kopi Hemat Sore"
                    required
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-medium transition focus:outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold app-text-sub">
                    {isEn ? 'Voucher Code (POS)' : 'Kode Kupon / Voucher'} *
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: HEMATSORE15"
                    required
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-mono font-bold uppercase transition focus:outline-none ${
                      isLight ? 'bg-white border-slate-300 text-amber-700' : 'bg-[#0d1117] border-[#30363d] text-amber-400'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold app-text-sub">
                    {isEn ? 'Promo Scheme Type' : 'Skema Promosi'}
                  </label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition focus:outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  >
                    <option value="SKU_DISCOUNT">Diskon Khusus SKU</option>
                    <option value="BUNDLE">Paket Bundling Hemat (Beli A + B)</option>
                    <option value="CATEGORY_DISCOUNT">Diskon Seluruh Kategori</option>
                    <option value="FLASH_SALE">Flash Sale / Berbatas Waktu</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold app-text-sub">
                    {isEn ? 'Discount Method' : 'Tipe Potongan'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDiscountType('PERCENT')}
                      className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                        discountType === 'PERCENT'
                          ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/50'
                          : isLight
                          ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
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
                          ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/50'
                          : isLight
                          ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                          : 'bg-[#0d1117] border-[#30363d] text-slate-400'
                      }`}
                    >
                      Nominal (Rp)
                    </button>
                  </div>
                </div>
              </div>

              {/* Discount Value */}
              <div className="space-y-1 p-3.5 rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10">
                <label className="font-bold text-purple-900 dark:text-purple-300 flex justify-between items-center">
                  <span>{isEn ? 'Discount Value' : 'Besaran Nilai Diskon'}</span>
                  <span className="font-mono text-base font-extrabold text-purple-700 dark:text-purple-400">
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
                    isLight ? 'bg-white border-purple-300 text-purple-900' : 'bg-[#0d1117] border-[#30363d] text-purple-400'
                  }`}
                />
              </div>

              {/* Target Item Selection */}
              <div className="space-y-1">
                <label className="font-semibold app-text-sub">
                  {isEn ? 'Primary Product Target (SKU)' : 'Produk Sasaran Utama (SKU)'}
                </label>
                <select
                  value={targetProductSku}
                  onChange={(e) => setTargetProductSku(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition focus:outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
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
                  <label className="font-semibold app-text-sub">
                    {isEn ? 'Min Purchase Qty' : 'Min. Jumlah Beli'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minPurchaseQty}
                    onChange={(e) => setMinPurchaseQty(parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-mono font-medium transition focus:outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold app-text-sub">
                    {isEn ? 'Start Date' : 'Tanggal Mulai'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition focus:outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold app-text-sub">
                    {isEn ? 'End Date' : 'Tanggal Berakhir'}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition focus:outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold app-text-sub">
                  {isEn ? 'Executive Description & Notes' : 'Deskripsi & Catatan Promo'}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan syarat dan ketentuan..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition focus:outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700/40 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium active:scale-[0.99] transition-all cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-medium bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 shadow-md shadow-purple-500/25 active:scale-[0.99] transition-all cursor-pointer"
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
