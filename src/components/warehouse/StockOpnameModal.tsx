import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  ClipboardCheck,
  X,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Boxes,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import { SearchableProductCombobox } from '../common/SearchableProductCombobox';
import { filterProductsByBusinessDomain } from '../../utils/buildingDomainIsolation';

interface StockOpnameModalProps {
  isOpen: boolean;
  preselectedProduct?: Product | null;
  onClose: () => void;
  isLight?: boolean;
  isEn?: boolean;
}

export const StockOpnameModal: React.FC<StockOpnameModalProps> = ({
  isOpen,
  preselectedProduct,
  onClose,
  isLight = false,
  isEn = false,
}) => {
  const { products: rawProducts, businessDomainConfig, activeUser, processStockOpnameAdjustment } = useApp();

  const products = useMemo(
    () => filterProductsByBusinessDomain(rawProducts || [], businessDomainConfig),
    [rawProducts, businessDomainConfig]
  );

  const [selectedProductId, setSelectedProductId] = useState<string>(
    preselectedProduct?.id || products[0]?.id || ''
  );

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0] || null;
  }, [products, selectedProductId]);

  const systemStock = selectedProduct ? selectedProduct.stock : 0;
  const [physicalStock, setPhysicalStock] = useState<number>(systemStock);
  const [opnameNotes, setOpnameNotes] = useState<string>('Stock Opname Koreksi Fisik vs Sistem');
  const [operator, setOperator] = useState<string>(
    activeUser ? `${activeUser.name} (${activeUser.role})` : 'Petugas Gudang'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state if preselectedProduct changes
  useEffect(() => {
    if (preselectedProduct) {
      setSelectedProductId(preselectedProduct.id);
      setPhysicalStock(preselectedProduct.stock);
    }
  }, [preselectedProduct]);

  // When changing selected product, reset physical stock to system stock
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setPhysicalStock(prod.stock);
    }
  };

  const difference = physicalStock - systemStock;
  const unitCost = selectedProduct?.cost_price || 15000;
  const totalAdjValue = Math.abs(difference) * unitCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      const res = processStockOpnameAdjustment({
        productId: selectedProduct.id,
        physicalStock: Math.max(0, Number(physicalStock)),
        systemStock,
        notes: opnameNotes,
        operator,
      });

      if (res.success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="warehouse-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div
        className={`w-full max-w-xl rounded-2xl border overflow-hidden flex flex-col max-h-[92vh] ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-900'
            : 'bg-[#161b22] border-cyan-500/40 shadow-[0_0_24px_rgba(6,182,212,0.16)] text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-cyan-500/35 text-slate-900' : 'bg-[#0d1117] border-cyan-500/25'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
              isLight ? 'bg-cyan-50 border-cyan-500/60 text-cyan-700' : 'bg-cyan-500/15 border-cyan-500/35 text-cyan-400'
            }`}>
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[11px] font-mono font-normal uppercase tracking-widest ${
                isLight ? 'text-cyan-700' : 'text-cyan-400'
              }`}>
                Warehouse • Inventory Audit Gateway
              </div>
              <h3 className={`text-base font-medium tracking-tight ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}>
                {isEn ? 'Stock Opname & Discrepancy Adjustment' : 'Stock Opname & Rekonsiliasi Fisik Inventori'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
              isLight ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200' : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-sm font-normal">
          {/* 1. Pilih Produk */}
          <div>
            <label className={`block mb-1.5 text-sm font-medium ${
              isLight ? 'text-slate-800' : 'text-gray-200'
            }`}>
              Pilih Produk untuk Di-Opname:
            </label>
            <SearchableProductCombobox
              products={products}
              selectedId={selectedProductId}
              onSelect={handleProductChange}
              placeholder="Cari produk..."
              className="w-full"
            />
          </div>

          {/* 2. Informasi Produk Terpilih */}
          {selectedProduct && (
            <div className={`p-3.5 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 border ${
              isLight
                ? 'bg-slate-50 border-cyan-500/45 text-slate-900'
                : 'bg-[#0d1117] border-cyan-500/25'
            }`}>
              <div>
                <span className={`block text-[11px] font-mono font-normal tracking-widest uppercase ${
                  isLight ? 'text-slate-600' : 'text-gray-400'
                }`}>
                  SKU / PLU
                </span>
                <span className={`mt-1 inline-block font-mono font-normal text-[11px] px-2 py-0.5 rounded border ${
                  isLight
                    ? 'bg-cyan-50 border-cyan-500/60 text-cyan-800'
                    : 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300'
                }`}>
                  {selectedProduct.id}
                </span>
              </div>
              <div>
                <span className={`block text-[11px] font-mono font-normal tracking-widest uppercase ${
                  isLight ? 'text-slate-600' : 'text-gray-400'
                }`}>
                  Kategori
                </span>
                <span className={`mt-1 block truncate text-sm font-normal ${
                  isLight ? 'text-slate-900' : 'text-gray-200'
                }`}>
                  {selectedProduct.category || 'Umum'}
                </span>
              </div>
              <div>
                <span className={`block text-[11px] font-mono font-normal tracking-widest uppercase ${
                  isLight ? 'text-slate-600' : 'text-gray-400'
                }`}>
                  HPP
                </span>
                <span className={`mt-1 block font-mono font-normal text-sm ${
                  isLight ? 'text-slate-900' : 'text-gray-200'
                }`}>
                  Rp {unitCost.toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className={`block text-[11px] font-mono font-normal tracking-widest uppercase ${
                  isLight ? 'text-slate-600' : 'text-gray-400'
                }`}>
                  Satuan
                </span>
                <span className={`mt-1 inline-block font-mono font-normal text-[11px] px-2 py-0.5 rounded border ${
                  isLight
                    ? 'bg-cyan-50 border-cyan-500/60 text-cyan-800'
                    : 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300'
                }`}>
                  {selectedProduct.unit || 'Pcs / Unit'}
                </span>
              </div>
            </div>
          )}

          {/* 3. Perbandingan Stok Fisik vs Sistem */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Stok Sistem (Tercatat) */}
            <div className={`p-4 rounded-xl border space-y-1 ${
              isLight
                ? 'bg-white border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.12)] text-slate-900'
                : 'bg-[#0d1117] border-cyan-500/35'
            }`}>
              <span className={`text-[11px] font-mono font-normal uppercase tracking-widest block ${
                isLight ? 'text-slate-600' : 'text-gray-400'
              }`}>
                Stok Sistem
              </span>
              <div className={`text-lg font-mono font-medium ${
                isLight ? 'text-slate-950' : 'text-cyan-400'
              }`}>
                {systemStock} <span className={`text-sm font-normal ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{selectedProduct?.unit || 'Unit'}</span>
              </div>
              <span className={`text-[11px] font-mono font-normal block ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
                Saldo tercatat saat ini
              </span>
            </div>

            {/* Input Stok Fisik Nyata */}
            <div className={`p-4 rounded-xl border space-y-1 ${
              isLight
                ? 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_16px_rgba(245,158,11,0.18)] text-slate-900'
                : 'border-amber-500/65 bg-amber-500/5 shadow-[0_0_16px_rgba(245,158,11,0.14)]'
            }`}>
              <label htmlFor="input-physical-stock" className={`text-[11px] font-mono font-normal uppercase tracking-widest block ${
                isLight ? 'text-amber-700' : 'text-amber-300'
              }`}>
                Hitungan Fisik *
              </label>
              <input
                id="input-physical-stock"
                type="number"
                min="0"
                value={physicalStock}
                onChange={(e) => setPhysicalStock(Math.max(0, parseInt(e.target.value) || 0))}
                className={`w-full text-lg font-mono font-medium rounded-lg px-2.5 py-1 outline-none border transition-all duration-200 ${
                  isLight
                    ? 'bg-white border-amber-500/70 text-slate-950 focus:border-amber-600'
                    : 'bg-slate-950 border-amber-500/50 text-white focus:border-amber-400'
                }`}
                required
              />
              <span className={`text-[11px] font-mono font-normal block ${isLight ? 'text-amber-700' : 'text-amber-300/80'}`}>
                Hasil cacah fisik
              </span>
            </div>

            {/* Selisih (Delta) */}
            <div
              className={`p-4 rounded-xl border space-y-1 ${
                difference === 0
                  ? isLight
                    ? 'border-emerald-500/70 bg-emerald-50 text-slate-900'
                    : 'border-emerald-500/40 bg-emerald-500/10'
                  : difference < 0
                  ? isLight
                    ? 'border-rose-500/75 bg-rose-50 text-slate-900'
                    : 'border-rose-500/50 bg-rose-500/10'
                  : isLight
                  ? 'border-emerald-500/70 bg-emerald-50 text-slate-900'
                  : 'border-emerald-500/40 bg-emerald-500/10'
              }`}
            >
              <span className={`text-[11px] font-mono font-normal uppercase tracking-widest block ${
                isLight ? 'text-slate-600' : 'text-gray-300'
              }`}>
                Selisih (Delta)
              </span>
              <div
                className={`text-lg font-mono font-medium ${
                  difference === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : difference < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {difference > 0 ? `+${difference}` : difference}{' '}
                <span className={`text-sm font-normal ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  {selectedProduct?.unit || 'Unit'}
                </span>
              </div>
              <div className="pt-0.5">
                <span
                  className={`text-[11px] font-mono font-normal px-2 py-0.5 rounded border inline-block ${
                    difference === 0
                      ? isLight
                        ? 'bg-white border-emerald-400 text-emerald-700'
                        : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                      : difference < 0
                      ? isLight
                        ? 'bg-white border-rose-400 text-rose-700'
                        : 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                      : isLight
                      ? 'bg-white border-emerald-400 text-emerald-700'
                      : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                  }`}
                >
                  {difference === 0
                    ? 'Balance (Sesuai)'
                    : difference < 0
                    ? 'Defisit Fisik'
                    : 'Surplus Fisik'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Rekonsiliasi Akuntansi Berimbang (FIN-STK-ADJ) Callout */}
          <div
            className={`p-4 rounded-xl border space-y-2 text-sm font-normal leading-relaxed ${
              difference === 0
                ? isLight
                  ? 'bg-emerald-50 border-emerald-500/60 text-slate-900'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : difference < 0
                ? isLight
                  ? 'bg-rose-50 border-rose-500/65 text-slate-900'
                  : 'bg-rose-500/10 border-rose-500/35 text-rose-200'
                : isLight
                ? 'bg-emerald-50 border-emerald-500/60 text-slate-900'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            }`}
          >
            <div className={`flex items-center gap-2 text-sm font-medium ${
              difference < 0
                ? isLight ? 'text-rose-700' : 'text-rose-300'
                : isLight ? 'text-emerald-700' : 'text-emerald-300'
            }`}>
              <Scale className="w-4 h-4 shrink-0" />
              <span>
                {difference === 0
                  ? 'Hasil Verifikasi: Stok Sesuai (Balance)'
                  : difference < 0
                  ? 'Jurnal Otomatis Selisih Kurang (FIN-STK-ADJ)'
                  : 'Jurnal Otomatis Selisih Lebih (FIN-STK-ADJ)'}
              </span>
            </div>

            {difference === 0 ? (
              <p className={`text-sm font-normal ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                Stok fisik riil sama persis dengan pencatatan sistem ({systemStock} unit). Tidak diperlukan jurnal penyesuaian nilai buku.
              </p>
            ) : difference < 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-sm font-normal">
                  <span className={isLight ? 'text-slate-700' : 'text-gray-300'}>Nominal Penyesuaian Beban:</span>
                  <span className={`font-mono font-medium ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>
                    -Rp {totalAdjValue.toLocaleString('id-ID')} ({Math.abs(difference)} x Rp {unitCost.toLocaleString('id-ID')})
                  </span>
                </div>
                <div className={`p-2.5 rounded-lg font-mono text-[11px] font-normal space-y-1 border ${
                  isLight ? 'bg-white border-rose-200 text-slate-800' : 'bg-black/30 border-rose-500/20'
                }`}>
                  <div className={`flex items-center justify-between ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>
                    <span>(Debit) 5-10502 Beban Selisih Persediaan:</span>
                    <span>Rp {totalAdjValue.toLocaleString('id-ID')}</span>
                  </div>
                  <div className={`flex items-center justify-between pl-4 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    <span>(Kredit) 1-10501 Persediaan:</span>
                    <span>Rp {totalAdjValue.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-sm font-normal">
                  <span className={isLight ? 'text-slate-700' : 'text-gray-300'}>Nominal Penambahan Nilai Inventori:</span>
                  <span className={`font-mono font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                    +Rp {totalAdjValue.toLocaleString('id-ID')} (+{difference} x Rp {unitCost.toLocaleString('id-ID')})
                  </span>
                </div>
                <div className={`p-2.5 rounded-lg font-mono text-[11px] font-normal space-y-1 border ${
                  isLight ? 'bg-white border-emerald-200 text-slate-800' : 'bg-black/30 border-emerald-500/20'
                }`}>
                  <div className={`flex items-center justify-between ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                    <span>(Debit) 1-10501 Persediaan:</span>
                    <span>Rp {totalAdjValue.toLocaleString('id-ID')}</span>
                  </div>
                  <div className={`flex items-center justify-between pl-4 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    <span>(Kredit) 4-10502 Pendapatan Penyesuaian Persediaan:</span>
                    <span>Rp {totalAdjValue.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. Petugas & Catatan Opname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block mb-1 text-sm font-normal ${
                isLight ? 'text-slate-700' : 'text-gray-300'
              }`}>
                Petugas Verifikasi Opname:
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border outline-none text-sm font-normal transition-all duration-200 ${
                  isLight
                    ? 'bg-white border-cyan-500/60 text-slate-950 focus:border-cyan-500'
                    : 'bg-[#0d1117] border-cyan-500/35 text-white focus:border-cyan-400'
                }`}
              />
            </div>

            <div>
              <label className={`block mb-1 text-sm font-normal ${
                isLight ? 'text-slate-700' : 'text-gray-300'
              }`}>
                Catatan / Berita Acara Opname:
              </label>
              <input
                type="text"
                value={opnameNotes}
                onChange={(e) => setOpnameNotes(e.target.value)}
                placeholder="Contoh: Stock Opname Kuartal III / Temuan Selisih Fisik"
                className={`w-full px-3 py-2 rounded-xl border outline-none text-sm font-normal transition-all duration-200 ${
                  isLight
                    ? 'bg-white border-cyan-500/60 text-slate-950 focus:border-cyan-500'
                    : 'bg-[#0d1117] border-cyan-500/35 text-white focus:border-cyan-400'
                }`}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className={`pt-3 border-t flex items-center justify-end gap-2.5 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-[#0d1117] border-slate-700 text-gray-300 hover:text-white'
              }`}
            >
              Batal
            </button>

            <button
              id="btn-confirm-stock-opname"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-sm flex items-center gap-2 border border-cyan-500/40 shadow-[0_0_14px_rgba(6,182,212,0.28)] transition-all duration-200 cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : difference === 0
                  ? 'Konfirmasi Opname (Balance)'
                  : 'Simpan & Sesuaikan Inventori (FIN-STK-ADJ)'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default StockOpnameModal;
