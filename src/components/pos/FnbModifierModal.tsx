import React, { useState } from 'react';
import { Product } from '../../types';
import { FNB_TOPPING_OPTIONS } from '../../data/fnbData';
import { X, Flame, UtensilsCrossed, Plus, Minus, Check, Coffee, MessageSquare, Thermometer, Droplet } from 'lucide-react';

interface FnbModifierModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  defaultTableNumber?: string;
  onConfirm: (
    product: Product,
    quantity: number,
    modifiers: {
      tableNumber: string;
      orderType: 'Dine-In' | 'Take-Away';
      spicyLevel: number;
      toppings: string[];
      temperature?: string;
      sugarLevel?: string;
      notes: string;
      variant?: string;
    },
    extraPrice: number
  ) => void;
}

export const FnbModifierModal: React.FC<FnbModifierModalProps> = ({
  product,
  isOpen,
  onClose,
  defaultTableNumber = 'Meja 01',
  onConfirm,
}) => {
  const [tableNumber, setTableNumber] = useState(defaultTableNumber);
  const [orderType, setOrderType] = useState<'Dine-In' | 'Take-Away'>('Dine-In');
  const [spicyLevel, setSpicyLevel] = useState<number>(1);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [temperature, setTemperature] = useState<'Normal Ice' | 'Less Ice' | 'Hot'>('Normal Ice');
  const [sugarLevel, setSugarLevel] = useState<'Normal' | 'Less Sugar' | 'No Sugar'>('Normal');
  const [kitchenNotes, setKitchenNotes] = useState('');
  const [qty, setQty] = useState(1);

  if (!isOpen || !product) return null;

  // Detect menu types
  const catLower = (product.category || '').toLowerCase();
  const nameLower = (product.name || '').toLowerCase();

  const isCoffee =
    catLower.includes('kopi') ||
    ['coffee', 'kopi', 'espresso', 'latte', 'cappuccino', 'macchiato'].some(
      (c) => nameLower.includes(c) && !nameLower.includes('matcha')
    );

  const isTeaOrFresh =
    catLower.includes('non-kopi') ||
    catLower.includes('segar') ||
    catLower.includes('teh') ||
    catLower.includes('beverage') ||
    ['tea', 'teh', 'segar', 'juice', 'soda', 'squash', 'matcha', 'boba'].some(
      (c) => nameLower.includes(c) || catLower.includes(c)
    );

  const isPastryOrBakery =
    catLower.includes('pastry') ||
    catLower.includes('bakery') ||
    ['pastry', 'bakery', 'roti', 'kue', 'croissant', 'bread', 'cake', 'donut'].some(
      (c) => nameLower.includes(c) || catLower.includes(c)
    );

  const isDrink = isCoffee || isTeaOrFresh;
  const isFood = !isDrink && !isPastryOrBakery;

  const COFFEE_TOPPINGS = [
    { id: 'ct-1', name: 'Extra Shot Espresso', price: 5000 },
    { id: 'ct-2', name: 'Boba', price: 3000 },
    { id: 'ct-3', name: 'Cheese Foam', price: 4000 },
  ];

  const TEA_FRESH_TOPPINGS = [
    { id: 'tf-1', name: 'Cincau / Grass Jelly', price: 3000 },
    { id: 'tf-2', name: 'Nata de Coco', price: 3000 },
    { id: 'tf-3', name: 'Lemon Slice', price: 2000 },
    { id: 'tf-4', name: 'Boba', price: 3000 },
  ];

  const FOOD_TOPPINGS =
    product.toppings && product.toppings.length > 0
      ? product.toppings
      : FNB_TOPPING_OPTIONS;

  const activeToppingsList = isCoffee
    ? COFFEE_TOPPINGS
    : isTeaOrFresh
    ? TEA_FRESH_TOPPINGS
    : isPastryOrBakery
    ? []
    : FOOD_TOPPINGS;

  const toggleTopping = (toppingName: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingName)
        ? prev.filter((t) => t !== toppingName)
        : [...prev, toppingName]
    );
  };

  const toppingsPrice = selectedToppings.reduce((acc, name) => {
    const found = activeToppingsList.find((t) => t.name === name);
    return acc + (found ? found.price : 0);
  }, 0);

  const unitPriceWithModifiers = product.sell_price + toppingsPrice;
  const totalPrice = unitPriceWithModifiers * qty;

  const handleAdd = () => {
    onConfirm(
      product,
      qty,
      {
        tableNumber: orderType === 'Take-Away' ? '' : (tableNumber.trim() || 'Meja 01'),
        orderType,
        spicyLevel: isFood && product.spicyEnabled !== false ? spicyLevel : 0,
        toppings: selectedToppings,
        temperature: isDrink ? temperature : undefined,
        sugarLevel: isDrink ? sugarLevel : undefined,
        notes: kitchenNotes.trim(),
      },
      toppingsPrice
    );
    onClose();
  };

  const spicyLabels = [
    'Level 0: Tidak Pedas',
    'Level 1: Pedas Sedikit',
    'Level 2: Pedas Sedang',
    'Level 3: Pedas Nendang',
    'Level 4: Ekstra Pedas',
    'Level 5: Pedas Gila 🔥',
  ];

  return (
    <div
      id="modal-fnb-modifiers"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in"
    >
      <div className="w-full max-w-lg bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl text-white relative max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header with Product Preview */}
        <div className="p-4 sm:p-5 border-b border-[#30363d] flex items-center justify-between bg-[#1f242c]">
          <div className="flex items-center gap-3.5 min-w-0">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-xl object-cover border border-[#30363d] shadow-sm shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                {product.category} {isCoffee ? '• Kopi' : isTeaOrFresh ? '• Non-Kopi / Segar' : isPastryOrBakery ? '• Pastry & Bakery' : '• Makanan'}
              </span>
              <h3 className="text-base font-bold text-white truncate mt-1">{product.name}</h3>
              <div className="text-xs font-mono text-[#10B981] font-bold">
                Rp {product.sell_price.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-[#30363d] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Order Type & Table Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">Jenis Pesanan</label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setOrderType('Dine-In')}
                  className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    orderType === 'Dine-In'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Dine-In
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('Take-Away')}
                  className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    orderType === 'Take-Away'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Take-Away
                </button>
              </div>
            </div>

            {orderType === 'Dine-In' ? (
              <div>
                <label className="block text-gray-300 font-semibold mb-1.5">No. Meja / Pelanggan</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                  placeholder="cth. Meja 05 / Bar 02"
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 text-white px-3 py-2 rounded-xl outline-none font-semibold text-xs"
                />
              </div>
            ) : (
              <div>
                <label className="block text-gray-400 font-semibold mb-1.5">No. Meja</label>
                <div className="w-full bg-[#0d1117]/50 border border-[#30363d]/50 text-gray-500 px-3 py-2 rounded-xl font-semibold text-xs italic flex items-center">
                  Take-Away (Tanpa Meja)
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* JIKA MINUMAN (Kopi atau Teh/Segar)                                        */}
          {/* ========================================================================= */}
          {isDrink ? (
            <>
              {/* Suhu / Es (Hot, Normal Ice, Less Ice) */}
              <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d] space-y-2">
                <span className="text-gray-300 font-semibold flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-cyan-400" />
                  <span>Suhu / Es Minuman</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['Normal Ice', 'Less Ice', 'Hot'] as const).map((temp) => (
                    <button
                      key={temp}
                      type="button"
                      onClick={() => setTemperature(temp)}
                      className={`py-2 rounded-xl font-bold text-xs transition cursor-pointer border ${
                        temperature === temp
                          ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                          : 'bg-[#161b22] border-[#30363d] text-gray-300 hover:bg-[#21262d]'
                      }`}
                    >
                      {temp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level Gula (Normal, Less Sugar, No Sugar) */}
              <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d] space-y-2">
                <span className="text-gray-300 font-semibold flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-amber-400" />
                  <span>Level Gula (Sugar Level)</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['Normal', 'Less Sugar', 'No Sugar'] as const).map((sugar) => (
                    <button
                      key={sugar}
                      type="button"
                      onClick={() => setSugarLevel(sugar)}
                      className={`py-2 rounded-xl font-bold text-xs transition cursor-pointer border ${
                        sugarLevel === sugar
                          ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                          : 'bg-[#161b22] border-[#30363d] text-gray-300 hover:bg-[#21262d]'
                      }`}
                    >
                      {sugar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topping Minuman (Kopi vs Segar) */}
              <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-semibold">
                    {isCoffee ? 'Topping Kopi (Extra Shot, Boba, Cheese Foam)' : 'Topping Segar (Cincau, Nata de Coco, Lemon, Boba)'}
                  </span>
                  <span className="text-[10px] text-gray-400">Opsional</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {activeToppingsList.map((topping, topIdx) => {
                    const isChecked = selectedToppings.includes(topping.name);
                    return (
                      <button
                        key={`drink-top-${topping.id}-${topIdx}`}
                        type="button"
                        onClick={() => toggleTopping(topping.name)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                            : 'bg-[#161b22] border-[#30363d] text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <div className="font-semibold text-[11px] truncate">{topping.name}</div>
                          <div className="text-[10px] text-cyan-400 font-mono font-bold">
                            +Rp {topping.price.toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                            isChecked
                              ? 'bg-cyan-500 border-cyan-400 text-black'
                              : 'border-gray-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : isPastryOrBakery ? (
            /* ========================================================================= */
            /* JIKA PASTRY / BAKERY (Sembunyikan level pedas, es, gula, & topping lauk)  */
            /* ========================================================================= */
            <div className="bg-[#0d1117] p-4 rounded-xl border border-[#30363d] text-center text-gray-400 text-xs">
              <span className="text-emerald-400 font-semibold">Pastry & Bakery Ready.</span> Silakan tambahkan catatan khusus jika ingin dihangatkan atau dikemas dengan dus khusus.
            </div>
          ) : (
            <>
              {/* ========================================================================= */}
              {/* JIKA MAKANAN (Food / Snack)                                               */}
              {/* ========================================================================= */}
              {/* Tambahan Topping Makanan */}
              <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-semibold">Tambahan Topping Makanan</span>
                  <span className="text-[10px] text-gray-400">Bisa pilih lebih dari satu</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {FOOD_TOPPINGS.map((topping, topIdx) => {
                    const isChecked = selectedToppings.includes(topping.name);
                    return (
                      <button
                        key={`food-topping-${topping.id || topIdx}`}
                        type="button"
                        onClick={() => toggleTopping(topping.name)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-[#161b22] border-[#30363d] text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <div className="font-semibold text-[11px] truncate">{topping.name}</div>
                          <div className="text-[10px] text-emerald-400 font-mono font-bold">
                            +Rp {topping.price.toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-400 text-black'
                              : 'border-gray-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Level Pedas (Hanya render jika menu mengaktifkan opsi pedas / product.spicyEnabled !== false) */}
              {product.spicyEnabled !== false && (
                <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-semibold flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span>Level Kepedasan</span>
                    </span>
                    <span className="font-bold text-amber-400 text-[11px]">
                      {spicyLabels[spicyLevel]}
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-1.5 pt-1">
                    {[0, 1, 2, 3, 4, 5].map((lvl) => {
                      const isSelected = spicyLevel === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSpicyLevel(lvl)}
                          className={`h-9 rounded-lg font-bold text-xs transition cursor-pointer border ${
                            isSelected
                              ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                              : 'bg-[#161b22] border-[#30363d] text-gray-300 hover:bg-[#21262d]'
                          }`}
                        >
                          L{lvl}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Kitchen Special Notes */}
          <div className="space-y-1.5">
            <label className="block text-gray-300 font-semibold flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Catatan Khusus Koki / Dapur</span>
            </label>
            <textarea
              value={kitchenNotes}
              onChange={(e) => setKitchenNotes(e.target.value)}
              placeholder="cth. Jangan pakai daun bawang, es batu sedikit, kuah dipisah..."
              rows={2}
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 text-white p-2.5 rounded-xl outline-none text-xs"
            />
            {/* Quick Note Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(isDrink
                ? ['Less Ice', 'Normal Ice', 'Hot / Panas', 'Less Sugar', 'No Sugar', 'Extra Shot Espresso']
                : ['Tidak Pedas', 'Pedas Sedang', 'Pisah Sambal', 'Tanpa Daun Bawang', 'Extra Kuah']
              ).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setKitchenNotes((prev) => (prev ? `${prev}, ${preset}` : preset));
                  }}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#161b22] hover:bg-[#21262d] text-cyan-300 border border-cyan-500/30 transition cursor-pointer"
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Counter */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <span className="font-semibold text-gray-300">Jumlah Porsi</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                className="w-9 h-9 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-white flex items-center justify-center transition cursor-pointer font-bold text-lg"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-base font-black font-mono w-8 text-center">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((prev) => prev + 1)}
                className="w-9 h-9 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-white flex items-center justify-center transition cursor-pointer font-bold text-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Total and Add to Cart Button */}
        <div className="p-4 sm:p-5 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] text-gray-400">Total Harga Item ({qty} Porsi)</div>
            <div className="text-lg font-black text-[#10B981] font-mono">
              Rp {totalPrice.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl font-bold bg-[#21262d] hover:bg-[#30363d] text-gray-300 transition cursor-pointer text-xs"
            >
              Batal
            </button>
            <button
              id="btn-confirm-add-fnb-order"
              type="button"
              onClick={handleAdd}
              className="px-5 py-3 rounded-xl font-bold bg-[#10B981] hover:bg-[#0ea371] text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] transition cursor-pointer text-xs flex items-center gap-1.5"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Tambah ke Pesanan Meja</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
