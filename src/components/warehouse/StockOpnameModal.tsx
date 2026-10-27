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
  const { products, activeUser, processStockOpnameAdjustment } = useApp();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[10px] font-black font-mono uppercase tracking-wider ${
                isLight ? 'text-indigo-700' : 'text-cyan-400'
              }`}>
                Warehouse • Inventory Audit Gateway
              </div>
              <h3 className={`text-base sm:text-lg font-black tracking-tight ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}>
                {isEn ? 'Stock Opname & Discrepancy Adjustment' : 'Stock Opname & Rekonsiliasi Fisik Inventori'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
              isLight ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200' : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* 1. Pilih Produk */}
          <div>
            <label className={`block mb-1.5 ${
              isLight ? 'text-slate-700 font-bold text-xs' : 'text-[11px] font-bold text-gray-300'
            }`}>
              Pilih Produk untuk Di-Opname:
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition cursor-pointer font-medium ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-indigo-600'
                  : 'bg-[#0d1117] border-[#30363d] text-white focus:border-cyan-500'
              }`}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.name} (Stok Sistem: {p.stock} {p.unit || 'Unit'})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Informasi Produk Terpilih */}
          {selectedProduct && (
            <div className={`p-3.5 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900'
                : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div>
                <span className={`block ${
                  isLight ? 'text-slate-700 font-bold text-xs' : 'text-[10px] text-gray-400 font-medium'
                }`}>
                  SKU / PLU
                </span>
                <span className={`mt-1 inline-block ${
                  isLight
                    ? 'bg-blue-100 border border-blue-300 text-blue-950 font-bold text-xs px-2 py-0.5 rounded font-mono'
                    : 'font-mono font-bold text-cyan-400'
                }`}>
                  {selectedProduct.id}
                </span>
              </div>
              <div>
                <span className={`block ${
                  isLight ? 'text-slate-700 font-bold text-xs' : 'text-[10px] text-gray-400 font-medium'
                }`}>
                  Kategori
                </span>
                <span className={`mt-1 block truncate ${
                  isLight ? 'text-slate-950 font-black text-xs' : 'font-semibold text-gray-300'
                }`}>
                  {selectedProduct.category || 'Umum'}
                </span>
              </div>
              <div>
                <span className={`block ${
                  isLight ? 'text-slate-700 font-bold text-xs' : 'text-[10px] text-gray-400 font-medium'
                }`}>
                  Harga Modal (HPP)
                </span>
                <span className={`mt-1 block font-mono ${
                  isLight ? 'text-slate-950 font-black text-xs' : 'font-bold text-gray-200'
                }`}>
                  Rp {unitCost.toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className={`block ${
                  isLight ? 'text-slate-700 font-bold text-xs' : 'text-[10px] text-gray-400 font-medium'
                }`}>
                  Satuan Barang
                </span>
                <span className={`mt-1 inline-block ${
                  isLight
                    ? 'bg-blue-100 border border-blue-300 text-blue-950 font-bold text-xs px-2 py-0.5 rounded'
                    : 'font-semibold text-gray-300'
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
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'border-slate-700 bg-slate-900/50'
            }`}>
              <span className={`uppercase tracking-wider block ${
                isLight ? 'text-slate-700 font-bold text-xs' : 'text-[10px] text-gray-400 font-bold'
              }`}>
                Stok Sistem (Tercatat)
              </span>
              <div className={`text-2xl font-black font-mono ${
                isLight ? 'text-slate-950' : 'text-cyan-400'
              }`}>
                {systemStock} <span className={`text-xs font-normal ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{selectedProduct?.unit || 'Unit'}</span>
              </div>
              <span className={`text-[10px] block ${isLight ? 'text-slate-600 font-medium' : 'text-gray-500'}`}>
                Saldo inventori saat ini
              </span>
            </div>

            {/* Input Stok Fisik Nyata */}
            <div className={`p-4 rounded-xl border space-y-1 ${
              isLight ? 'border-amber-300 bg-amber-50/70 text-slate-900' : 'border-amber-500/40 bg-amber-500/10'
            }`}>
              <label htmlFor="input-physical-stock" className={`uppercase tracking-wider block ${
                isLight ? 'text-amber-950 font-black text-xs' : 'text-[10px] text-amber-300 font-black'
              }`}>
                Hitungan Fisik Riil *
              </label>
              <input
                id="input-physical-stock"
                type="number"
                min="0"
                value={physicalStock}
                onChange={(e) => setPhysicalStock(Math.max(0, parseInt(e.target.value) || 0))}
                className={`w-full text-2xl font-black font-mono rounded-lg px-2.5 py-1 outline-none border ${
                  isLight
                    ? 'bg-white border-amber-400 text-slate-950 focus:ring-1 focus:ring-amber-500'
                    : 'bg-slate-950 border-amber-500/50 text-white focus:ring-1 focus:ring-amber-400'
                }`}
                required
              />
              <span className={`text-[10px] block ${isLight ? 'text-amber-900 font-semibold' : 'text-amber-300/80'}`}>
                Masukkan hasil cacah fisik
              </span>
            </div>

            {/* Selisih (Delta) */}
            <div
              className={`p-4 rounded-xl border space-y-1 ${
                isLight
                  ? difference === 0
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                    : difference < 0
                    ? 'border-rose-300 bg-rose-50 text-rose-950'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-950'
                  : difference === 0
                  ? 'border-blue-500/40 bg-blue-500/10'
                  : difference < 0
                  ? 'border-rose-500/40 bg-rose-500/10'
                  : 'border-emerald-500/40 bg-emerald-500/10'
              }`}
            >
              <span className={`uppercase tracking-wider block ${
                isLight ? 'text-slate-800 font-bold text-xs' : 'text-[10px] font-bold text-gray-300'
              }`}>
                Selisih (Adjustment)
              </span>
              <div
                className={`text-2xl font-black font-mono ${
                  isLight
                    ? difference === 0
                      ? 'text-emerald-950'
                      : difference < 0
                      ? 'text-rose-950'
                      : 'text-emerald-950'
                    : difference === 0
                    ? 'text-blue-400'
                    : difference < 0
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}
              >
                {difference > 0 ? `+${difference}` : difference}{' '}
                <span className={`text-xs font-normal ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  {selectedProduct?.unit || 'Unit'}
                </span>
              </div>
              <div className="pt-0.5">
                {isLight ? (
                  <span
                    className={
                      difference === 0
                        ? 'bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs px-2 py-0.5 rounded inline-block'
                        : difference < 0
                        ? 'bg-rose-100 border border-rose-300 text-rose-950 font-bold text-xs px-2 py-0.5 rounded inline-block'
                        : 'bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs px-2 py-0.5 rounded inline-block'
                    }
                  >
                    {difference === 0
                      ? 'Balance (Sesuai)'
                      : difference < 0
                      ? 'Defisit Fisik (Shortage)'
                      : 'Surplus Fisik'}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 block">
                    {difference === 0
                      ? 'Balance (Sesuai)'
                      : difference < 0
                      ? 'Kurang Fisik (Shortage)'
                      : 'Lebih Fisik (Surplus)'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4. Rekonsiliasi Akuntansi Berimbang (FIN-STK-ADJ) Callout */}
          <div
            className={`p-4 rounded-xl border space-y-2 text-xs leading-relaxed ${
              isLight
                ? difference === 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : difference < 0
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : difference === 0
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                : difference < 0
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
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
              <p className={`text-[11px] ${isLight ? 'text-slate-700 font-medium' : 'text-gray-300'}`}>
                Stok fisik riil sama persis dengan pencatatan sistem ({systemStock} unit). Tidak diperlukan jurnal penyesuaian nilai buku.
              </p>
            ) : difference < 0 ? (
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between font-mono">
                  <span className={isLight ? 'text-slate-700 font-bold' : ''}>Nominal Penyesuaian Beban:</span>
                  <strong className={isLight ? 'text-rose-950 font-black' : 'text-rose-300 font-bold'}>
                    -Rp {totalAdjValue.toLocaleString('id-ID')} ({Math.abs(difference)} x Rp {unitCost.toLocaleString('id-ID')})
                  </strong>
                </div>
                <div className={`p-2.5 rounded-lg font-mono text-[10.5px] space-y-1 ${
                  isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-black/30'
                }`}>
                  <div className={`flex items-center justify-between ${isLight ? 'text-rose-950 font-bold' : 'text-rose-300'}`}>
                    <span>(Debit) 5-10502 Beban Selisih Persediaan:</span>
                    <span>Rp {totalAdjValue.toLocaleString('id-ID')}</span>
                  </div>
                  <div className={`flex items-center justify-between pl-4 ${isLight ? 'text-slate-800 font-semibold' : 'text-gray-300'}`}>
                    <span>(Kredit) 1-10501 Persediaan:</span>
                    <span>Rp {totalAdjValue.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between font-mono">
                  <span className={isLight ? 'text-slate-700 font-bold' : ''}>Nominal Penambahan Nilai Inventori:</span>
                  <strong className={isLight ? 'text-emerald-950 font-black' : 'text-emerald-300 font-bold'}>
                    +Rp {totalAdjValue.toLocaleString('id-ID')} (+{difference} x Rp {unitCost.toLocaleString('id-ID')})
                  </strong>
                </div>
                <div className={`p-2.5 rounded-lg font-mono text-[10.5px] space-y-1 ${
                  isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-black/30'
                }`}>
                  <div className={`flex items-center justify-between ${isLight ? 'text-emerald-950 font-bold' : 'text-emerald-300'}`}>
                    <span>(Debit) 1-10501 Persediaan:</span>
                    <span>Rp {totalAdjValue.toLocaleString('id-ID')}</span>
                  </div>
                  <div className={`flex items-center justify-between pl-4 ${isLight ? 'text-slate-800 font-semibold' : 'text-gray-300'}`}>
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
              <label className={`block mb-1 ${
                isLight ? 'text-slate-700 font-bold text-xs' : 'text-[11px] font-bold text-gray-300'
              }`}>
                Petugas Verifikasi Opname:
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border outline-none text-xs font-semibold ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-indigo-600'
                    : 'bg-slate-900/60 border-slate-700 text-white focus:border-cyan-500'
                }`}
              />
            </div>

            <div>
              <label className={`block mb-1 ${
                isLight ? 'text-slate-700 font-bold text-xs' : 'text-[11px] font-bold text-gray-300'
              }`}>
                Catatan / Berita Acara Opname:
              </label>
              <input
                type="text"
                value={opnameNotes}
                onChange={(e) => setOpnameNotes(e.target.value)}
                placeholder="Contoh: Stock Opname Kuartal III / Temuan Selisih Fisik"
                className={`w-full px-3 py-2 rounded-xl border outline-none text-xs font-medium ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-indigo-600'
                    : 'bg-slate-900/60 border-slate-700 text-white focus:border-cyan-500'
                }`}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className={`pt-3 border-t flex items-center justify-end gap-2.5 ${
            isLight ? 'border-slate-300' : 'border-slate-800'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' : 'text-gray-400 hover:text-white'
              }`}
            >
              Batal
            </button>

            <button
              id="btn-confirm-stock-opname"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-2 shadow-sm transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : difference === 0
                  ? 'Konfirmasi Opname (Balance)'
                  : `Simpan & Sesuaikan Inventori (FIN-STK-ADJ)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default StockOpnameModal;
