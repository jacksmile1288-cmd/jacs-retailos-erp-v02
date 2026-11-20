import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CartItem, FnbToppingCategory, FnbToppingMaster } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Check,
  Flame,
  Coffee,
  UtensilsCrossed,
  Cookie,
  MessageSquare,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export interface FnbQuickToppingResult {
  toppings: string[];
  toppingDetails: Array<{
    id?: string;
    sku?: string;
    name: string;
    price: number;
    rawMaterialId?: string;
    rawMaterialQty?: number;
    rawMaterialUnit?: string;
    hppCost?: number;
  }>;
  toppingExtraPrice: number;
  spicyLabel?: string;
  spicyLevel?: number;
  sugarIceLabel?: string;
  sugarLevel?: string;
  temperature?: string;
  notes: string;
  summaryText: string;
}

interface FnbQuickToppingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CartItem | null;
  onConfirm: (result: FnbQuickToppingResult) => void;
  isLight?: boolean;
  requiresSupervisorPin?: boolean;
}

export type FnbMenuCategoryGroup = FnbToppingCategory;

export const MAIN_FOOD_SPICY_OPTIONS = [
  { label: 'Tidak Pedas', level: 0 },
  { label: 'Sedang', level: 1 },
  { label: 'Pedas', level: 2 },
  { label: 'Extra Pedas', level: 3 },
] as const;

export const DRINK_SUGAR_ICE_OPTIONS = ['Normal', 'Less Sugar', 'Less Ice'] as const;

export function detectFnbCategoryGroup(category?: string, name?: string): FnbMenuCategoryGroup {
  const cat = (category || '').toLowerCase();
  const nm = (name || '').toLowerCase();

  const isDrink =
    cat.includes('kopi') ||
    cat.includes('non-kopi') ||
    cat.includes('minuman') ||
    cat.includes('segar') ||
    cat.includes('beverage') ||
    cat.includes('drink') ||
    cat.includes('teh') ||
    cat.includes('tea') ||
    cat.includes('coffee') ||
    [
      'kopi',
      'coffee',
      'espresso',
      'latte',
      'cappuccino',
      'americano',
      'macchiato',
      'mocha',
      'matcha',
      'teh ',
      'tea',
      'boba',
      'milk',
      'susu',
      'coklat',
      'chocolate',
      'jus',
      'juice',
      'squash',
      'soda',
      'mojito',
      'lemonade',
      'taro',
      'es ',
      'iced ',
      'cold brew',
      'air mineral',
    ].some((kw) => nm.includes(kw));

  if (isDrink) return 'DRINK';

  const isPastryOrSnack =
    cat.includes('pastry') ||
    cat.includes('bakery') ||
    cat.includes('snack') ||
    cat.includes('cemilan') ||
    cat.includes('camilan') ||
    cat.includes('dessert') ||
    cat.includes('kue') ||
    cat.includes('roti') ||
    [
      'croissant',
      'pastry',
      'bakery',
      'donut',
      'donat',
      'waffle',
      'toast',
      'roti',
      'cake',
      'kue',
      'brownies',
      'muffin',
      'cookies',
      'kentang',
      'fries',
      'pisang goreng',
      'singkong',
      'dimsum',
      'risol',
      'onion ring',
      'nugget',
      'platter',
      'snack',
      'pudding',
      'tiramisu',
      'churros',
    ].some((kw) => nm.includes(kw));

  if (isPastryOrSnack) return 'PASTRY_SNACK';

  return 'MAIN_FOOD';
}

export const FnbQuickToppingModal: React.FC<FnbQuickToppingModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirm,
  isLight = false,
  requiresSupervisorPin = false,
}) => {
  const { fnbToppings } = useApp();
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [spicyLabel, setSpicyLabel] = useState<string>('');
  const [sugarIceSelected, setSugarIceSelected] = useState<string[]>(['Normal']);
  const [notes, setNotes] = useState<string>('');

  const categoryGroup: FnbMenuCategoryGroup = useMemo(() => {
    if (!item?.product) return 'MAIN_FOOD';
    return detectFnbCategoryGroup(item.product.category, item.product.name);
  }, [item?.product?.category, item?.product?.name]);

  // Baca daftar topping berstatus "Aktif" secara real-time dari Master Data F&B (AppContext)
  const activeToppingsList: FnbToppingMaster[] = useMemo(() => {
    return (fnbToppings || []).filter(
      (t) => t.category === categoryGroup && t.isActive
    );
  }, [fnbToppings, categoryGroup]);

  useEffect(() => {
    if (!isOpen || !item) return;
    const mods = item.modifiers;
    setSelectedToppings(Array.isArray(mods?.toppings) ? [...mods.toppings] : []);
    if (categoryGroup === 'MAIN_FOOD') {
      if (mods?.spicyLabel) {
        setSpicyLabel(mods.spicyLabel);
      } else if (typeof mods?.spicyLevel === 'number' && mods.spicyLevel > 0) {
        const matched = MAIN_FOOD_SPICY_OPTIONS.find((o) => o.level === mods.spicyLevel);
        setSpicyLabel(matched ? matched.label : 'Sedang');
      } else {
        setSpicyLabel('');
      }
    } else {
      setSpicyLabel('');
    }

    if (categoryGroup === 'DRINK') {
      if (mods?.sugarIceLabel) {
        const parts = mods.sugarIceLabel
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        setSugarIceSelected(parts.length > 0 ? parts : ['Normal']);
      } else {
        const derived: string[] = [];
        if (mods?.sugarLevel === 'Less Sugar') derived.push('Less Sugar');
        if (mods?.temperature === 'Less Ice') derived.push('Less Ice');
        setSugarIceSelected(derived.length > 0 ? derived : ['Normal']);
      }
    } else {
      setSugarIceSelected(['Normal']);
    }

    setNotes(mods?.notes || '');
  }, [isOpen, item, categoryGroup]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const baseUnitPrice =
    item.originalUnitPrice ??
    Math.max(0, item.product.sell_price - (item.modifiers?.toppingExtraPrice || 0));

  const toggleTopping = (name: string) => {
    setSelectedToppings((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const toggleSugarIce = (opt: 'Normal' | 'Less Sugar' | 'Less Ice') => {
    if (opt === 'Normal') {
      setSugarIceSelected(['Normal']);
      return;
    }
    setSugarIceSelected((prev) => {
      const withoutNormal = prev.filter((v) => v !== 'Normal');
      const exists = withoutNormal.includes(opt);
      const next = exists
        ? withoutNormal.filter((v) => v !== opt)
        : [...withoutNormal, opt];
      return next.length === 0 ? ['Normal'] : next;
    });
  };

  const selectedToppingDetails = selectedToppings.map((name) => {
    const masterMatch =
      activeToppingsList.find((t) => t.name === name) ||
      (fnbToppings || []).find((t) => t.name === name);
    const prevDetail = item.modifiers?.toppingDetails?.find((t) => t.name === name);
    if (masterMatch) {
      return {
        id: masterMatch.id,
        sku: masterMatch.sku || masterMatch.id,
        name: masterMatch.name,
        price: masterMatch.price,
        rawMaterialId: masterMatch.rawMaterialId,
        rawMaterialQty: masterMatch.rawMaterialQty,
        rawMaterialUnit: masterMatch.rawMaterialUnit,
        hppCost: masterMatch.hppCost,
      };
    }
    return {
      id: prevDetail?.id,
      sku: prevDetail?.sku || prevDetail?.id,
      name,
      price: prevDetail ? prevDetail.price : 0,
      rawMaterialId: prevDetail?.rawMaterialId,
      rawMaterialQty: prevDetail?.rawMaterialQty,
      rawMaterialUnit: prevDetail?.rawMaterialUnit,
      hppCost: prevDetail?.hppCost,
    };
  });

  const toppingExtraPrice = selectedToppingDetails.reduce((sum, t) => sum + t.price, 0);
  const newUnitPrice = baseUnitPrice + toppingExtraPrice;
  const newSubtotal = Math.max(0, (newUnitPrice - (item.itemDiscount || 0)) * item.quantity);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedNotes = notes.trim();
    const effectiveSpicyLabel = categoryGroup === 'MAIN_FOOD' ? spicyLabel || undefined : undefined;
    const effectiveSpicyLevel =
      categoryGroup === 'MAIN_FOOD'
        ? MAIN_FOOD_SPICY_OPTIONS.find((o) => o.label === spicyLabel)?.level ?? 0
        : 0;
    const effectiveSugarIce =
      categoryGroup === 'DRINK'
        ? sugarIceSelected.join(', ')
        : undefined;

    const summaryParts: string[] = [];
    if (selectedToppings.length > 0) summaryParts.push(selectedToppings.join(', '));
    if (effectiveSpicyLabel) summaryParts.push(`Pedas: ${effectiveSpicyLabel}`);
    if (effectiveSugarIce && effectiveSugarIce !== 'Normal') summaryParts.push(effectiveSugarIce);
    if (cleanedNotes) summaryParts.push(`"${cleanedNotes}"`);

    onConfirm({
      toppings: selectedToppings,
      toppingDetails: selectedToppingDetails,
      toppingExtraPrice,
      spicyLabel: effectiveSpicyLabel,
      spicyLevel: effectiveSpicyLevel,
      sugarIceLabel: effectiveSugarIce,
      sugarLevel:
        categoryGroup === 'DRINK'
          ? sugarIceSelected.includes('Less Sugar')
            ? 'Less Sugar'
            : 'Normal'
          : undefined,
      temperature:
        categoryGroup === 'DRINK'
          ? sugarIceSelected.includes('Less Ice')
            ? 'Less Ice'
            : 'Normal Ice'
          : undefined,
      notes: cleanedNotes,
      summaryText: summaryParts.length > 0 ? summaryParts.join(' • ') : 'Standar (Tanpa Topping)',
    });
  };

  const categoryMeta =
    categoryGroup === 'DRINK'
      ? { label: 'Kopi & Non-Kopi', Icon: Coffee, accent: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' }
      : categoryGroup === 'PASTRY_SNACK'
      ? { label: 'Pastry & Snack', Icon: Cookie, accent: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
      : { label: 'Makanan Utama', Icon: UtensilsCrossed, accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };

  const CategoryIcon = categoryMeta.Icon;

  return createPortal(
    <div
      id="modal-fnb-quick-topping"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isLight
            ? 'bg-white border-cyan-500/60 text-slate-900'
            : 'bg-[#161b22] border-cyan-500/35 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`px-4 py-3.5 border-b flex items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${categoryMeta.accent}`}>
              <CategoryIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  {categoryMeta.label}
                </span>
                <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                  {item.quantity}x • Dasar Rp {baseUnitPrice.toLocaleString('id-ID')}
                </span>
              </div>
              <h3 className="text-sm font-semibold truncate mt-0.5">{item.product.name}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isLight
                ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'
                : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
            }`}
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
            {requiresSupervisorPin && (
              <div
                className={`p-2.5 rounded-xl border flex items-start gap-2 text-[11px] leading-snug ${
                  isLight
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                }`}
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  Item sudah dikirim ke <strong>KOT Dapur</strong> (masih ≤ 5 menit). Penyimpanan revisi topping/catatan memerlukan <strong>PIN Supervisor (1234 / 8888)</strong> &amp; otomatis memicu penanda <strong>[REVISI KOT]</strong>.
                </span>
              </div>
            )}

            {/* Toppings Checkboxes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    {categoryGroup === 'PASTRY_SNACK'
                      ? 'Pilihan Saus & Penyajian'
                      : 'Pilihan Topping Tambahan'}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400">Klik untuk pilih</span>
              </div>

              {activeToppingsList.length === 0 ? (
                <div
                  className={`p-3 rounded-xl border text-center text-[11px] italic ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-500'
                      : 'bg-[#0d1117] border-[#30363d] text-slate-400'
                  }`}
                >
                  Belum ada topping aktif untuk kategori ini. Kelola di Master Data F&amp;B → Master Topping &amp; Add-on.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {activeToppingsList.map((opt) => {
                    const isChecked = selectedToppings.includes(opt.name);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleTopping(opt.name)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 active:scale-[0.99] ${
                          isChecked
                            ? isLight
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                              : 'bg-emerald-500/15 border-emerald-500 text-emerald-200'
                            : isLight
                            ? 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-800'
                            : 'bg-[#0d1117] border-[#30363d] hover:border-slate-500 text-slate-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 flex-wrap mb-0.5">
                            <span
                              className={`px-1.5 py-0.5 rounded font-mono text-[9px] leading-none font-semibold border ${
                                isChecked
                                  ? isLight
                                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                                    : 'bg-emerald-500/20 border-emerald-500/45 text-emerald-300'
                                  : isLight
                                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                                  : 'bg-amber-500/10 border-amber-500/35 text-amber-300'
                              }`}
                            >
                              {opt.sku || opt.id}
                            </span>
                          </div>
                          <div className="font-semibold text-[11px] leading-tight">{opt.name}</div>
                          <div className="text-[10px] font-mono tabular-nums text-emerald-500 mt-0.5">
                            {opt.price > 0 ? `+Rp ${opt.price.toLocaleString('id-ID')}` : '+Rp 0 (Gratis)'}
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-400 text-black'
                              : isLight
                              ? 'border-slate-300 bg-white'
                              : 'border-slate-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Level Pedas (Makanan Utama) */}
            {categoryGroup === 'MAIN_FOOD' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Level Pedas</span>
                  </span>
                  {spicyLabel && (
                    <button
                      type="button"
                      onClick={() => setSpicyLabel('')}
                      className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {MAIN_FOOD_SPICY_OPTIONS.map((opt) => {
                    const isSelected = spicyLabel === opt.label;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSpicyLabel(isSelected ? '' : opt.label)}
                        className={`py-2 px-1.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer active:scale-[0.99] ${
                          isSelected
                            ? 'bg-amber-500 border-amber-400 text-black shadow-xs'
                            : isLight
                            ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                            : 'bg-[#0d1117] border-[#30363d] hover:bg-[#21262d] text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Takaran Gula & Es (Kopi & Non-Kopi) */}
            {categoryGroup === 'DRINK' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Takaran Gula &amp; Es</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Bisa kombinasi Less Sugar + Less Ice</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {DRINK_SUGAR_ICE_OPTIONS.map((opt) => {
                    const isSelected = sugarIceSelected.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleSugarIce(opt)}
                        className={`py-2 px-2 rounded-xl border text-[11px] font-semibold transition cursor-pointer active:scale-[0.99] ${
                          isSelected
                            ? 'bg-cyan-500 border-cyan-400 text-black shadow-xs'
                            : isLight
                            ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                            : 'bg-[#0d1117] border-[#30363d] hover:bg-[#21262d] text-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Catatan Pesanan Kasir */}
            <div className="space-y-1.5">
              <label className="font-semibold text-xs flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-500" />
                <span>Catatan Pesanan / Dapur</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={
                  categoryGroup === 'DRINK'
                    ? 'cth. Es dipisah, tambah sedotan, cup dibungkus...'
                    : categoryGroup === 'PASTRY_SNACK'
                    ? 'cth. Potong jadi 2, saus dipisah, dus khusus...'
                    : 'cth. Tanpa daun bawang, sambal dipisah, nasi setengah...'
                }
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                    : 'bg-[#0d1117] border-[#30363d] text-white placeholder-slate-500 focus:border-emerald-500'
                }`}
              />
            </div>
          </div>

          {/* Footer Price Summary & Save */}
          <div
            className={`px-4 py-3 border-t flex items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
            }`}
          >
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                Satuan: Rp {baseUnitPrice.toLocaleString('id-ID')}
                {toppingExtraPrice > 0 && (
                  <span className="text-emerald-500"> + Rp {toppingExtraPrice.toLocaleString('id-ID')}</span>
                )}
              </div>
              <div className="text-sm font-bold font-mono text-emerald-500 tabular-nums">
                Rp {newUnitPrice.toLocaleString('id-ID')}
                {item.quantity > 1 && (
                  <span className="text-[10px] font-normal text-slate-400 ml-1.5">
                    (Total {item.quantity}x: Rp {newSubtotal.toLocaleString('id-ID')})
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-[#21262d] border-[#30363d] text-slate-300 hover:bg-[#30363d]'
                }`}
              >
                Batal
              </button>
              <button
                id="btn-save-fnb-topping"
                type="submit"
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs active:scale-[0.99] ${
                  requiresSupervisorPin
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {requiresSupervisorPin ? 'Verifikasi PIN & Simpan' : 'Simpan Topping'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
