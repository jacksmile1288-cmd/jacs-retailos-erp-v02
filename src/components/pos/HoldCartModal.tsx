import React, { useState, useEffect } from 'react';
import { CartItem, CustomerMaster } from '../../types';
import { Clock, X, ShoppingBag, Pause, ArrowRight, UserCheck } from 'lucide-react';

interface HoldCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmHold: (holdName: string) => void;
  cart: CartItem[];
  selectedCustomer?: CustomerMaster | null;
  heldOrdersCount: number;
  isLight?: boolean;
  language?: 'ID' | 'EN';
}

export const HoldCartModal: React.FC<HoldCartModalProps> = ({
  isOpen,
  onClose,
  onConfirmHold,
  cart,
  selectedCustomer,
  heldOrdersCount,
  isLight = false,
  language = 'ID',
}) => {
  const isEn = language === 'EN';
  const [holdName, setHoldName] = useState('');

  // Default suggested name
  useEffect(() => {
    if (isOpen) {
      if (selectedCustomer) {
        setHoldName(selectedCustomer.name);
      } else {
        const tableNo = cart.find((c) => c.modifiers?.tableNumber)?.modifiers?.tableNumber;
        if (tableNo) {
          setHoldName(`Meja ${tableNo}`);
        } else {
          setHoldName(`${isEn ? 'Queue' : 'Antrean'} #${heldOrdersCount + 1}`);
        }
      }
    }
  }, [isOpen, selectedCustomer, heldOrdersCount, cart, isEn]);

  if (!isOpen) return null;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce(
    (sum, item) => sum + (item.subtotal || item.product.sell_price * item.quantity),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName =
      holdName.trim() || `${isEn ? 'Queue' : 'Antrean'} #${heldOrdersCount + 1}`;
    onConfirmHold(finalName);
    onClose();
  };

  const quickPresets = [
    `${isEn ? 'Queue' : 'Antrean'} #${heldOrdersCount + 1}`,
    'Meja 1',
    'Meja 2',
    'Meja 3',
    'Takeaway',
    'Pelanggan Antre',
  ];

  return (
    <div
      id="modal-hold-cart"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in"
    >
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 sm:p-6 relative overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
            : 'bg-[#161b22] border-[#30363d] text-white shadow-[0_25px_60px_rgba(0,0,0,0.9)]'
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-xl transition cursor-pointer ${
            isLight
              ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              : 'text-gray-400 hover:text-white hover:bg-[#21262d]'
          }`}
          title={isEn ? 'Close' : 'Tutup'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Pause className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isEn ? 'Hold Customer Cart' : 'Tahan Keranjang Antrean'}</span>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                HOLD
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
              {isEn
                ? 'Temporarily hold this cart to serve the next waiting customer'
                : 'Tahan belanja pelanggan ini untuk melayani antrean berikutnya'}
            </p>
          </div>
        </div>

        {/* Cart Summary Card */}
        <div
          className={`p-3.5 rounded-xl border mb-4 space-y-2 ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-900'
              : 'bg-[#0d1117] border-[#30363d] text-white'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-gray-400 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-blue-500" />
              <span>{isEn ? 'Cart Items:' : 'Item Keranjang:'}</span>
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {cart.length} SKU • {totalItems} Pcs
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-600 dark:text-gray-400">
              {isEn ? 'Total Order Value:' : 'Total Nilai Transaksi:'}
            </span>
            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
              Rp {totalAmount.toLocaleString('id-ID')}
            </span>
          </div>

          {selectedCustomer && (
            <div className="flex items-center gap-1.5 text-xs pt-1 border-t border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400">
              <UserCheck className="w-3.5 h-3.5" />
              <span className="font-bold">Member: {selectedCustomer.name}</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
              {isEn ? 'Queue / Table Note / Customer Name:' : 'Nama Antrean / Nomor Meja / Catatan:'} *
            </label>
            <input
              type="text"
              autoFocus
              value={holdName}
              onChange={(e) => setHoldName(e.target.value)}
              placeholder="Contoh: Meja 4 / Bpk. Rudi / Antrean #2"
              required
              className={`w-full p-2.5 rounded-xl border text-sm font-semibold transition outline-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                  : 'bg-[#0d1117] border-gray-700 text-white placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
              }`}
            />
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-gray-400">
              {isEn ? 'Quick presets:' : 'Pilihan Cepat:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setHoldName(preset)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    holdName === preset
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-[#21262d] hover:bg-[#30363d] text-gray-300 border-gray-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-[#21262d] border-gray-700 text-gray-300 hover:bg-[#30363d]'
              }`}
            >
              {isEn ? 'Cancel' : 'Batal'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-amber-500/25 transition cursor-pointer active:scale-95"
            >
              <Clock className="w-4 h-4" />
              <span>{isEn ? 'Hold Cart' : 'Tahan Keranjang (Hold)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
