import React, { useState, useEffect } from 'react';
import { CartItem } from '../../types';
import { X, Check, Minus, Plus, Tag, FileText, ShieldCheck, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ITEM_MANUAL_DISCOUNT_REASONS = [
  'Promo Butik / Pelanggan VIP',
  'Cacat Minor / Display Sample',
  'Clearance Koleksi Lama',
  'Kompensasi Pelayanan',
  'Kebijakan Diskon Manajemen',
];

const SPV_AUTH_PINS: Record<string, string> = {
  '1234': 'Spv. Hendra',
  '8888': 'Spv. Bambang',
};

const MAX_SELF_AUTH_PERCENT = 15;

interface EditCartItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CartItem | null;
  onSave: (
    quantity: number,
    itemDiscount: number,
    variant: string,
    discountMeta?: { reason?: string; authorizedBy?: string }
  ) => void;
  language: 'ID' | 'EN';
}

export const EditCartItemModal: React.FC<EditCartItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  language,
}) => {
  const { theme } = useApp();
  const isLight = theme === 'light';
  const [quantity, setQuantity] = useState<number>(1);
  const [itemDiscount, setItemDiscount] = useState<number>(0);
  const [discMode, setDiscMode] = useState<'IDR' | 'PERCENT'>('PERCENT');
  const [discPercent, setDiscPercent] = useState<number>(0);
  const [discReason, setDiscReason] = useState<string>(ITEM_MANUAL_DISCOUNT_REASONS[0]);
  const [spvPin, setSpvPin] = useState<string>('');
  const [spvAuthorizedBy, setSpvAuthorizedBy] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [variant, setVariant] = useState<string>('');

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity);
      const existingDisc = item.itemDiscount || 0;
      const baseP = Number(item.product.sell_price) || 0;
      setItemDiscount(existingDisc);
      setDiscPercent(baseP > 0 ? Math.round((existingDisc / baseP) * 100) : 0);
      setDiscReason(item.manualDiscountReason || ITEM_MANUAL_DISCOUNT_REASONS[0]);
      setSpvAuthorizedBy(item.manualDiscountAuthorizedBy || '');
      setSpvPin('');
      setPinError(null);
      setVariant(
        item.selectedFashionSize || item.selectedFashionColor
          ? `${item.selectedFashionSize || 'M'} • ${item.selectedFashionColor || 'Sage'}`
          : item.modifiers?.variant || ''
      );
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const baseUnitPrice = Number(item.product.sell_price) || 0;
  const effectivePercent =
    baseUnitPrice > 0 ? Math.round((itemDiscount / baseUnitPrice) * 100) : 0;
  const requiresSpvAuth =
    itemDiscount > 0 && effectivePercent > MAX_SELF_AUTH_PERCENT && !spvAuthorizedBy;

  const allowsDecimal = Boolean(
    item?.product?.isWeighable ||
      item?.product?.supportDecimal ||
      item?.product?.laundryUnitType === 'KILOAN' ||
      item?.product?.laundryUnitType === 'LUAS'
  );

  const handleSetPercentDiscount = (pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct));
    setDiscPercent(clamped);
    setItemDiscount(Math.round((baseUnitPrice * clamped) / 100));
    setPinError(null);
  };

  const handleSetNominalDiscount = (rp: number) => {
    const clamped = Math.max(0, Math.min(baseUnitPrice, rp));
    setItemDiscount(clamped);
    setDiscPercent(baseUnitPrice > 0 ? Math.round((clamped / baseUnitPrice) * 100) : 0);
    setPinError(null);
  };

  const handleVerifySpvPin = (pinVal?: string) => {
    const pin = (pinVal ?? spvPin).trim();
    const spv = SPV_AUTH_PINS[pin];
    if (spv) {
      setSpvAuthorizedBy(spv);
      setPinError(null);
      setSpvPin('');
    } else {
      setPinError('PIN Supervisor salah! (Gunakan 1234 / 8888)');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requiresSpvAuth) {
      setPinError(
        `Diskon > ${MAX_SELF_AUTH_PERCENT}% wajib otorisasi PIN Supervisor!`
      );
      return;
    }
    const minQty = allowsDecimal ? 0.01 : 1;
    const validQty = allowsDecimal
      ? Math.max(minQty, Number(quantity.toFixed(2)))
      : Math.max(1, Math.floor(quantity));
    onSave(validQty, Math.max(0, itemDiscount), variant, {
      reason: itemDiscount > 0 ? discReason : undefined,
      authorizedBy:
        itemDiscount > 0
          ? spvAuthorizedBy || `Kasir Mandiri (≤${MAX_SELF_AUTH_PERCENT}%)`
          : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className={`w-full max-w-md rounded-2xl overflow-hidden border shadow-2xl max-h-[92vh] flex flex-col ${
        isLight
          ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-900'
          : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-white'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/60'
        }`}>
          <div>
            <h3 className="text-base leading-6 font-medium text-slate-900 dark:text-white">
              {language === 'ID' ? 'Edit Item & Diskon Manual' : 'Edit Cart Item'}
            </h3>
            <p className="text-xs leading-5 font-normal text-slate-500 dark:text-slate-400 truncate max-w-xs">{item.product.name}</p>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1">
          {/* Price & SKU Info */}
          <div className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono font-normal">Barcode / SKU:</span>
              <p className="font-mono font-normal text-cyan-600 dark:text-cyan-400 text-xs">
                {item.product.barcode || item.product.id}
              </p>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono font-normal">Harga Satuan:</span>
              <p className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                Rp {item.product.sell_price.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs leading-5 font-normal text-slate-700 dark:text-slate-300">
                {language === 'ID' ? (item.product.isWeighable ? 'Berat Timbang (Kg / Qty)' : 'Jumlah / Qty') : 'Quantity'}
              </label>
              {item.product.isWeighable && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-normal">
                  ⚖️ BARANG TIMBANG
                </span>
              )}
            </div>

            {item.product.isWeighable && (
              <div className={`p-2 rounded-xl border space-y-1.5 ${
                isLight ? 'bg-slate-50 border-emerald-300/60' : 'bg-slate-950/60 border-emerald-500/30'
              }`}>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  ⚡ Kalkulator Cepat Timbang:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0.1, 0.25, 0.5, 1.0].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => setQuantity((q) => Number((Number(q) + inc).toFixed(3)))}
                      className={`py-1 px-2 rounded-lg border text-[11px] font-mono cursor-pointer ${
                        isLight
                          ? 'bg-white hover:bg-slate-100 text-emerald-700 border-slate-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700'
                      }`}
                    >
                      +{inc < 1 ? `${inc * 1000}g` : '1 Kg'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(allowsDecimal ? 0.01 : 1, Number((q - (allowsDecimal ? 0.1 : 1)).toFixed(2))))}
                className={`w-9 h-9 rounded-xl flex items-center justify-center border font-mono transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                }`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={allowsDecimal ? 0.01 : 1}
                step={allowsDecimal ? 0.01 : 1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`flex-1 border text-center font-mono font-semibold text-base py-1.5 rounded-xl outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                    : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => Number((q + (allowsDecimal ? 0.1 : 1)).toFixed(2)))}
                className={`w-9 h-9 rounded-xl flex items-center justify-center border font-mono transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Size / Variant */}
          <div className="space-y-1">
            <label className="text-xs leading-5 font-normal text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-cyan-500" />
              <span>{language === 'ID' ? 'Detail Size / Varian' : 'Size / Variant Detail'}</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: M • Sage, XL • Hitam..."
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              className={`w-full text-xs leading-5 font-normal px-3 py-2 rounded-xl border outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                  : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
              }`}
            />
          </div>

          {/* Quick Item Manual Discount with Reason & Authorization Threshold */}
          <div
            className={`p-3 rounded-xl border space-y-2.5 ${
              isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/15 border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Diskon Manual Item (Batas Kasir ≤ {MAX_SELF_AUTH_PERCENT}%)</span>
              </label>
              <div className="flex rounded-lg border border-amber-500/30 p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setDiscMode('PERCENT')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    discMode === 'PERCENT' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-500'
                  }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setDiscMode('IDR')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    discMode === 'IDR' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-500'
                  }`}
                >
                  Rp
                </button>
              </div>
            </div>

            {discMode === 'PERCENT' ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discPercent}
                    onChange={(e) => handleSetPercentDiscount(Number(e.target.value) || 0)}
                    className={`w-24 text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg border outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                  <span className="text-xs font-mono text-slate-500">% (= -Rp {itemDiscount.toLocaleString('id-ID')}/pcs)</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[0, 5, 10, 15, 20, 30].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleSetPercentDiscount(pct)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                        discPercent === pct
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : isLight
                          ? 'bg-white border-slate-300 text-slate-700'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {pct === 0 ? 'Reset 0%' : `${pct}%${pct > MAX_SELF_AUTH_PERCENT ? ' 🔒' : ''}`}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <input
                type="number"
                min={0}
                step={500}
                value={itemDiscount}
                onChange={(e) => handleSetNominalDiscount(parseInt(e.target.value, 10) || 0)}
                className={`w-full text-xs font-mono font-normal px-3 py-2 rounded-xl border outline-none transition ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                    : 'bg-slate-950 border-slate-700 text-white focus:border-amber-400'
                }`}
              />
            )}

            {itemDiscount > 0 && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block">
                  Alasan Diskon / Promo Item:
                </label>
                <select
                  value={discReason}
                  onChange={(e) => setDiscReason(e.target.value)}
                  className={`w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                >
                  {ITEM_MANUAL_DISCOUNT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {requiresSpvAuth && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/35 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-300">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Potongan {effectivePercent}% melebihi batas kasir ({MAX_SELF_AUTH_PERCENT}%). Masukkan PIN Supervisor (1234 / 8888):
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    maxLength={6}
                    value={spvPin}
                    onChange={(e) => {
                      setSpvPin(e.target.value);
                      setPinError(null);
                    }}
                    placeholder="PIN SPV..."
                    className={`flex-1 px-2.5 py-1 rounded-lg border text-xs font-mono outline-none ${
                      isLight
                        ? 'bg-white border-rose-300 text-slate-900'
                        : 'bg-slate-950 border-rose-500/40 text-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifySpvPin()}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Otorisasi
                  </button>
                </div>
                {pinError && <p className="text-[10px] text-rose-500 font-semibold">{pinError}</p>}
              </div>
            )}

            {spvAuthorizedBy && itemDiscount > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Otorisasi disetujui oleh: {spvAuthorizedBy}</span>
              </div>
            )}
          </div>

          {/* Subtotal Preview */}
          <div className={`pt-2 border-t flex items-center justify-between text-xs ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <span className="text-slate-500 dark:text-slate-400">Total Baris Baru:</span>
            <span className="font-mono font-semibold text-sm text-emerald-600 dark:text-emerald-400">
              Rp {Math.round(Math.max(0, item.product.sell_price - itemDiscount) * quantity).toLocaleString('id-ID')}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-normal transition cursor-pointer active:scale-[0.99] ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-800/60 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              {language === 'ID' ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer active:scale-[0.99]"
            >
              <Check className="w-4 h-4" />
              <span>{language === 'ID' ? 'Simpan Perubahan' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

