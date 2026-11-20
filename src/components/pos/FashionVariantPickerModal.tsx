import React, { useState, useMemo, useEffect } from 'react';
import { Product, FashionVariantCell } from '../../types';
import {
  X,
  Shirt,
  Sparkles,
  Tag,
  Check,
  Plus,
  Minus,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';
import {
  FASHION_STANDARD_COLORS,
  FASHION_STANDARD_SIZES,
} from '../../data/industryTerminalProducts';

export interface FashionVariantSelection {
  size: string;
  color: string;
  qty: number;
}

interface FashionVariantPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  isLight?: boolean;
  mode?: 'ADD' | 'CHANGE';
  initialSize?: string;
  initialColor?: string;
  onConfirm: (selections: FashionVariantSelection[]) => void;
}

export const FashionVariantPickerModal: React.FC<FashionVariantPickerModalProps> = ({
  isOpen,
  onClose,
  product,
  isLight = false,
  mode = 'ADD',
  initialSize,
  initialColor,
  onConfirm,
}) => {
  const [selectedMap, setSelectedMap] = useState<Record<string, number>>({});
  const [activeKey, setActiveKey] = useState<string>('');

  const { sizes, colors, cellLookup } = useMemo(() => {
    const matrix: FashionVariantCell[] = product?.variantMatrix || [];
    const lookup = new Map<string, FashionVariantCell>();
    matrix.forEach((cell) => {
      lookup.set(`${cell.size}__${cell.color}`, cell);
    });

    const parsedSizes =
      matrix.length > 0
        ? Array.from(new Set(matrix.map((c) => c.size)))
        : (product?.variantSize || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    const parsedColors =
      matrix.length > 0
        ? Array.from(new Set(matrix.map((c) => c.color)))
        : (product?.variantColor || '')
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);

    return {
      sizes: parsedSizes.length > 0 ? parsedSizes : FASHION_STANDARD_SIZES,
      colors: parsedColors.length > 0 ? parsedColors : FASHION_STANDARD_COLORS,
      cellLookup: lookup,
    };
  }, [product]);

  useEffect(() => {
    if (!isOpen || !product) return;
    const firstAvailable =
      product.variantMatrix?.find((c) => c.stock > 0) ||
      product.variantMatrix?.[0];
    const defSize = initialSize || firstAvailable?.size || sizes[0] || 'M';
    const defColor = initialColor || firstAvailable?.color || colors[0] || 'Sage';
    const key = `${defSize}__${defColor}`;
    setActiveKey(key);
    setSelectedMap(mode === 'CHANGE' ? { [key]: 1 } : { [key]: 1 });
  }, [isOpen, product, mode, initialSize, initialColor, sizes, colors]);

  if (!isOpen || !product) return null;

  const basePrice = Number(product.sell_price ?? product.price_retail ?? 0);
  const promo = product.fashionPromo;
  const hasClearance = Boolean(promo?.clearanceActive && (promo.clearanceValue || 0) > 0);
  const clearanceSavings = hasClearance
    ? promo!.clearanceType === 'NOMINAL'
      ? Math.min(basePrice, Number(promo!.clearanceValue) || 0)
      : Math.round((basePrice * Math.min(100, Number(promo!.clearanceValue) || 0)) / 100)
    : 0;
  const clearancePrice = Math.max(0, basePrice - clearanceSavings);

  const getSizeEffectivePrice = (sz: string) => {
    const up = Number(product?.sizeUpcharges?.[sz] || product?.sizeUpcharges?.[sz.toUpperCase()] || product?.sizeUpcharges?.[sz.toLowerCase()] || 0);
    const raw = basePrice + up;
    if (hasClearance) {
      const sav =
        promo!.clearanceType === 'NOMINAL'
          ? Math.min(raw, Number(promo!.clearanceValue) || 0)
          : Math.round((raw * Math.min(100, Number(promo!.clearanceValue) || 0)) / 100);
      return Math.max(0, raw - sav);
    }
    return raw;
  };

  const selectedEntries = Object.entries(selectedMap)
    .filter(([, q]) => q > 0)
    .map(([key, qty]) => {
      const [size, color] = key.split('__');
      return { size, color, qty };
    });

  const totalPickedQty = selectedEntries.reduce((s, e) => s + e.qty, 0);

  const handleCellClick = (size: string, color: string) => {
    const key = `${size}__${color}`;
    setActiveKey(key);
    if (mode === 'CHANGE') {
      setSelectedMap({ [key]: 1 });
      return;
    }
    setSelectedMap((prev) => {
      const current = prev[key] || 0;
      return {
        ...prev,
        [key]: current + 1,
      };
    });
  };

  const handleQtyAdjust = (key: string, delta: number) => {
    setSelectedMap((prev) => {
      const nextQty = Math.max(0, (prev[key] || 0) + delta);
      if (nextQty === 0) {
        const clone = { ...prev };
        delete clone[key];
        return clone;
      }
      return { ...prev, [key]: nextQty };
    });
  };

  const handleConfirmSubmit = () => {
    if (selectedEntries.length === 0 && activeKey) {
      const [size, color] = activeKey.split('__');
      onConfirm([{ size, color, qty: 1 }]);
    } else if (selectedEntries.length > 0) {
      onConfirm(selectedEntries);
    }
    onClose();
  };

  const totalMatrixStock = product.variantMatrix
    ? product.variantMatrix.reduce((s, c) => s + Math.max(0, Number(c.stock) || 0), 0)
    : Number(product.stock) || 0;

  return (
    <div
      id="modal-fashion-variant-picker"
      onClick={onClose}
      className="fixed inset-0 z-55 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isLight
            ? 'bg-white border-purple-400/70 text-slate-900'
            : 'bg-slate-900 border-purple-500/40 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-start justify-between gap-3 ${
            isLight ? 'bg-purple-50/70 border-slate-200' : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/35 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Shirt className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold truncate">{product.name}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  {product.sku || product.barcode || product.id}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20">
                  Total Stok Matriks: {totalMatrixStock} Pcs
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                {hasClearance ? (
                  <>
                    <span className="line-through text-slate-400 font-mono">
                      Rp {basePrice.toLocaleString('id-ID')}
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      Rp {clearancePrice.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/35 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {promo?.clearanceLabel ||
                        `CLEARANCE ${
                          promo?.clearanceType === 'NOMINAL'
                            ? `Rp ${Number(promo.clearanceValue).toLocaleString('id-ID')}`
                            : `${promo?.clearanceValue}%`
                        }`}
                    </span>
                  </>
                ) : (
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    Rp {basePrice.toLocaleString('id-ID')}
                  </span>
                )}
                {promo?.bundleActive && (
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/35 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {promo.bundleLabel ||
                      `${
                        promo.bundleScope === 'MIX_MATCH_FASHION' ? 'Mix & Match' : 'Bundle'
                      } Min. ${promo.bundleMinQty || 2} Pcs → Diskon ${
                        promo.bundleDiscountType === 'NOMINAL'
                          ? `Rp ${Number(promo.bundleDiscountValue || 0).toLocaleString('id-ID')}`
                          : `${promo.bundleDiscountValue || 0}%`
                      }`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'border-slate-200 text-slate-500 hover:bg-slate-100'
                : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Size x Color Matrix */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {mode === 'CHANGE'
                ? 'Klik sel Ukuran × Warna pengganti untuk baris ini:'
                : 'Klik sel Ukuran × Warna untuk memilih (klik ulang untuk menambah Qty):'}
            </span>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                Tersedia
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Stok Tipis (≤3)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                Stok 0 (Non-Blocking)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr
                  className={
                    isLight
                      ? 'bg-slate-100 text-slate-700 border-b border-slate-200'
                      : 'bg-slate-950 text-slate-300 border-b border-slate-800'
                  }
                >
                  <th className="py-2 px-3 text-left font-mono uppercase tracking-wider text-[11px]">
                    Ukuran \ Warna
                  </th>
                  {colors.map((cl) => (
                    <th
                      key={cl}
                      className="py-2 px-2.5 text-center font-semibold text-xs min-w-[100px]"
                    >
                      {cl}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {sizes.map((sz) => (
                  <tr key={sz}>
                    <td
                      className={`py-2 px-3 font-mono text-xs ${
                        isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950/50 text-slate-200'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">Size {sz}</span>
                        {Number(product?.sizeUpcharges?.[sz] || product?.sizeUpcharges?.[sz.toUpperCase()] || 0) > 0 && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400">
                            +Rp {Number(product.sizeUpcharges?.[sz] || product.sizeUpcharges?.[sz.toUpperCase()]).toLocaleString('id-ID')}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Rp {getSizeEffectivePrice(sz).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </td>
                    {colors.map((cl) => {
                      const key = `${sz}__${cl}`;
                      const cell = cellLookup.get(key);
                      const cellStock = cell ? Number(cell.stock) || 0 : Number(product.stock) || 0;
                      const pickedQty = selectedMap[key] || 0;
                      const isPicked = pickedQty > 0;
                      const isOut = cellStock <= 0;
                      const isLow = cellStock > 0 && cellStock <= 3;

                      return (
                        <td key={key} className="p-1.5 text-center">
                          <div
                            onClick={() => handleCellClick(sz, cl)}
                            className={`rounded-xl p-2 border cursor-pointer transition-all select-none flex flex-col items-center justify-center gap-1 ${
                              isPicked
                                ? 'bg-purple-600 text-white border-purple-400 shadow-md ring-2 ring-purple-400/50'
                                : isOut
                                ? isLight
                                  ? 'bg-rose-50/70 hover:bg-rose-100 border-rose-200 text-rose-700'
                                  : 'bg-rose-950/20 hover:bg-rose-950/40 border-rose-500/30 text-rose-300'
                                : isLow
                                ? isLight
                                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                                  : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/35 text-amber-200'
                                : isLight
                                ? 'bg-emerald-50/60 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
                            }`}
                          >
                            <div className="font-mono font-bold text-xs">
                              {isOut ? 'Stok 0' : `Stok ${cellStock}`}
                            </div>
                            {isPicked ? (
                              mode === 'ADD' ? (
                                <div
                                  className="inline-flex items-center gap-1 bg-black/25 rounded-lg px-1.5 py-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleQtyAdjust(key, -1)}
                                    className="w-4 h-4 rounded hover:bg-white/20 flex items-center justify-center cursor-pointer"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                  <span className="font-mono text-[11px] font-bold min-w-[16px]">
                                    {pickedQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleQtyAdjust(key, 1)}
                                    className="w-4 h-4 rounded hover:bg-white/20 flex items-center justify-center cursor-pointer"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] font-semibold flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Terpilih
                                </span>
                              )
                            ) : (
                              <span className="text-[10px] opacity-75">
                                {isOut ? 'Non-Blocking' : 'Pilih'}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedEntries.some((entry) => {
            const c = cellLookup.get(`${entry.size}__${entry.color}`);
            return c && c.stock < entry.qty;
          }) && (
            <div className="p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Mode Non-Blocking aktif: beberapa varian yang dipilih memiliki stok sistem 0 / kurang, transaksi tetap dapat dilanjutkan (stok minus sementara).
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="text-xs">
            {selectedEntries.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400">Dipilih:</span>
                {selectedEntries.map((e) => (
                  <span
                    key={`${e.size}-${e.color}`}
                    className="px-2 py-0.5 rounded-lg font-mono text-[11px] bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/35"
                  >
                    {e.size} • {e.color} ({e.qty}x)
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-slate-400">Belum ada varian dipilih</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl border text-xs cursor-pointer transition ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmSubmit}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-[0.99]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {mode === 'CHANGE'
                  ? 'Ganti Varian Baris Ini'
                  : `Tambah ke Keranjang (${totalPickedQty} Pcs)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
