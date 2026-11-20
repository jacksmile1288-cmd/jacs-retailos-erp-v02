import React, { useState, useEffect } from 'react';
import { CartItem, CustomerMaster } from '../../types';
import { Clock, X, ShoppingBag, Pause, ArrowRight, UserCheck } from 'lucide-react';

interface HoldCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmHold: (
    holdName: string,
    fnbMeta?: { tableNo?: string; orderMode?: 'Dine-In' | 'Takeaway' | 'Delivery' }
  ) => void;
  cart: CartItem[];
  selectedCustomer?: CustomerMaster | null;
  heldOrdersCount: number;
  isLight?: boolean;
  language?: 'ID' | 'EN';
  isFashionMode?: boolean;
  isFnbMode?: boolean;
  isServiceMode?: boolean;
  serviceStylistName?: string;
  fnbTableNo?: string;
  fnbOrderMode?: 'Dine-In' | 'Takeaway' | 'Delivery';
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
  isFashionMode = false,
  isFnbMode = false,
  isServiceMode = false,
  serviceStylistName = '',
  fnbTableNo = 'Meja 01',
  fnbOrderMode = 'Dine-In',
}) => {
  const isEn = language === 'EN';
  const [holdName, setHoldName] = useState('');
  const [selectedFnbTable, setSelectedFnbTable] = useState<string>(fnbTableNo);
  const [selectedFnbOrderMode, setSelectedFnbOrderMode] = useState<'Dine-In' | 'Takeaway' | 'Delivery'>(fnbOrderMode);

  const buildDefaultFnbHoldName = (
    tableNo: string,
    orderMode: 'Dine-In' | 'Takeaway' | 'Delivery'
  ) => {
    if (orderMode === 'Dine-In') {
      const normalizedTable = tableNo?.trim() || 'Meja 01';
      return `${normalizedTable} (Dine-In)`;
    }
    return orderMode === 'Delivery'
      ? 'Delivery • Tanpa Meja (Kurir)'
      : 'Takeaway • Tanpa Meja (Bungkus)';
  };

  const buildServiceHoldLabel = (chairLabel: string) => {
    const custPart = selectedCustomer?.name ? ` — ${selectedCustomer.name}` : '';
    const stylistPart = serviceStylistName?.trim()
      ? custPart
        ? ` (${serviceStylistName.trim()})`
        : ` — ${serviceStylistName.trim()}`
      : '';
    return `${chairLabel}${custPart}${stylistPart}`;
  };

  // Default suggested name
  useEffect(() => {
    if (isOpen) {
      if (isFnbMode) {
        const defaultName = buildDefaultFnbHoldName(fnbTableNo, fnbOrderMode);
        setSelectedFnbTable(fnbOrderMode === 'Dine-In' ? (fnbTableNo || 'Meja 01') : '');
        setSelectedFnbOrderMode(fnbOrderMode);
        setHoldName(
          selectedCustomer ? `${defaultName} — ${selectedCustomer.name}` : defaultName
        );
      } else if (isServiceMode) {
        const defaultChair = `Kursi 0${(heldOrdersCount % 3) + 1}`;
        setHoldName(buildServiceHoldLabel(defaultChair));
      } else if (selectedCustomer) {
        setHoldName(
          isFashionMode
            ? `Fitting Room 1 — ${selectedCustomer.name}`
            : selectedCustomer.name
        );
      } else if (isFashionMode) {
        setHoldName(`Fitting Room ${(heldOrdersCount % 3) + 1}`);
      } else {
        setHoldName(`${isEn ? 'Queue' : 'Antrean'} #${heldOrdersCount + 1}`);
      }
    }
  }, [isOpen, selectedCustomer, heldOrdersCount, isEn, isFashionMode, isFnbMode, isServiceMode, serviceStylistName, fnbTableNo, fnbOrderMode]);

  if (!isOpen) return null;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce(
    (sum, item) => sum + (item.subtotal || item.product.sell_price * item.quantity),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fallbackName = isFnbMode
      ? buildDefaultFnbHoldName(selectedFnbTable, selectedFnbOrderMode)
      : isServiceMode
      ? buildServiceHoldLabel(`Kursi 0${(heldOrdersCount % 3) + 1}`)
      : isFashionMode
      ? `Fitting Room ${(heldOrdersCount % 3) + 1}`
      : `${isEn ? 'Queue' : 'Antrean'} #${heldOrdersCount + 1}`;
    const finalName = holdName.trim() || fallbackName;
    if (isFnbMode) {
      onConfirmHold(finalName, {
        tableNo: selectedFnbOrderMode === 'Dine-In' ? (selectedFnbTable || 'Meja 01') : '',
        orderMode: selectedFnbOrderMode,
      });
    } else {
      onConfirmHold(finalName);
    }
    onClose();
  };

  const fnbQuickPresets: Array<{
    label: string;
    value: string;
    tableNo: string;
    orderMode: 'Dine-In' | 'Takeaway' | 'Delivery';
  }> = [
    { label: 'Meja 01', value: 'Meja 01 (Dine-In)', tableNo: 'Meja 01', orderMode: 'Dine-In' },
    { label: 'Meja 02', value: 'Meja 02 (Dine-In)', tableNo: 'Meja 02', orderMode: 'Dine-In' },
    { label: 'Meja 03', value: 'Meja 03 (Dine-In)', tableNo: 'Meja 03', orderMode: 'Dine-In' },
    { label: 'Meja 04', value: 'Meja 04 (Dine-In)', tableNo: 'Meja 04', orderMode: 'Dine-In' },
    { label: 'Meja 05', value: 'Meja 05 (Dine-In)', tableNo: 'Meja 05', orderMode: 'Dine-In' },
    { label: 'Takeaway', value: 'Takeaway • Tanpa Meja (Bungkus)', tableNo: '', orderMode: 'Takeaway' },
    { label: 'Delivery', value: 'Delivery • Tanpa Meja (Kurir)', tableNo: '', orderMode: 'Delivery' },
  ];

  const serviceChairPresets = ['Kursi 01', 'Kursi 02', 'Kursi 03', 'Waiting List'];

  const quickPresets = isFashionMode
    ? [
        'Fitting Room 1',
        'Fitting Room 2',
        'Fitting Room 3',
        'Titip Ambil Sore (VIP)',
      ]
    : [
        `${isEn ? 'Queue' : 'Antrean'} #${heldOrdersCount + 1}`,
        'Antrean Prioritas',
        'Customer Antre',
        'Belanja Tambahan',
      ];

  return (
    <div
      id="modal-hold-cart"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in"
    >
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 sm:p-6 relative overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-900'
            : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-white'
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-xl transition cursor-pointer ${
            isLight
              ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={isEn ? 'Close' : 'Tutup'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Pause className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base leading-6 font-medium text-slate-900 dark:text-white flex items-center gap-2">
              <span>
                {isFnbMode
                  ? 'Tahan Pesanan Meja / Resto'
                  : isServiceMode
                  ? 'Hold Antrean Kursi / Layanan'
                  : isFashionMode
                  ? 'Hold / Titip Fitting Room'
                  : isEn
                  ? 'Hold Customer Cart'
                  : 'Tahan Keranjang Antrean'}
              </span>
              <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase">
                {isFnbMode ? selectedFnbOrderMode : isServiceMode ? 'KURSI / ANTREAN' : isFashionMode ? 'FITTING ROOM' : 'HOLD'}
              </span>
            </h3>
            <p className="text-xs leading-5 font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              {isFnbMode
                ? 'Simpan pesanan meja aktif sementara agar kasir bisa melayani meja atau antrean lain'
                : isServiceMode
                ? 'Tahan nota pelanggan yang sedang dilayani di kursi barbershop/salon atau masih menunggu'
                : isFashionMode
                ? 'Titip sementara baju yang masih dicoba pelanggan tanpa mengunci antrean kasir'
                : isEn
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
              : 'bg-slate-800/40 border-slate-700/60 text-white'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-normal text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-cyan-500" />
              <span>{isEn ? 'Cart Items:' : 'Item Keranjang:'}</span>
            </span>
            <span className="font-mono font-normal text-slate-900 dark:text-white text-xs">
              {cart.length} SKU • {totalItems} {isFnbMode ? 'Porsi' : isServiceMode ? 'Layanan/Item' : 'Pcs'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700/50">
            <span className="font-normal text-slate-500 dark:text-slate-400">
              {isEn ? 'Total Order Value:' : 'Total Nilai Transaksi:'}
            </span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
              Rp {totalAmount.toLocaleString('id-ID')}
            </span>
          </div>

          {selectedCustomer && (
            <div className="flex items-center gap-1.5 text-xs pt-1 border-t border-slate-200 dark:border-slate-700/50 text-cyan-600 dark:text-cyan-400">
              <UserCheck className="w-3.5 h-3.5" />
              <span className="font-normal">Pelanggan: {selectedCustomer.name}</span>
            </div>
          )}

          {isServiceMode && serviceStylistName?.trim() && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700/50 text-purple-600 dark:text-purple-300">
              <span className="font-normal">Stylist / Petugas:</span>
              <span className="font-semibold">{serviceStylistName.trim()}</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs leading-5 font-normal text-slate-700 dark:text-slate-300">
              {isFnbMode
                ? 'Label Meja / Pesanan Resto:'
                : isServiceMode
                ? 'Kursi Layanan / Nama Pelanggan / Stylist:'
                : isEn
                ? 'Queue / Customer Name / Note:'
                : 'Nama Antrean / Pelanggan / Catatan:'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={holdName}
              onChange={(e) => setHoldName(e.target.value)}
              placeholder={
                isFnbMode
                  ? 'Contoh: Meja 01 (Dine-In) atau Takeaway'
                  : isServiceMode
                  ? 'Contoh: Kursi 01 — Bpk. Rudi (Andi Barber)'
                  : 'Contoh: Bpk. Rudi / Antrean #2'
              }
              required
              className={`w-full px-3 py-2 rounded-xl border text-sm leading-5 font-normal transition outline-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                  : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-amber-400'
              }`}
            />
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-normal text-slate-500 dark:text-slate-400">
              {isFnbMode
                ? 'Pilihan Cepat Meja / Mode:'
                : isServiceMode
                ? 'Pilihan Cepat Kursi / Antrean Layanan:'
                : isEn
                ? 'Quick presets:'
                : 'Pilihan Cepat:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {isFnbMode
                ? fnbQuickPresets.map((preset) => {
                    const isActivePreset = holdName === preset.value;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setHoldName(preset.value);
                          setSelectedFnbTable(preset.tableNo);
                          setSelectedFnbOrderMode(preset.orderMode);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-normal border transition cursor-pointer active:scale-[0.99] ${
                          isActivePreset
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-medium shadow-xs'
                            : isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            : 'bg-slate-800/60 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })
                : isServiceMode
                ? serviceChairPresets.map((chair) => {
                    const formatted = buildServiceHoldLabel(chair);
                    const isActiveChair = holdName.startsWith(chair);
                    return (
                      <button
                        key={chair}
                        type="button"
                        onClick={() => setHoldName(formatted)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-normal border transition cursor-pointer active:scale-[0.99] ${
                          isActiveChair
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold shadow-xs'
                            : isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            : 'bg-slate-800/60 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        {chair}
                      </button>
                    );
                  })
                : quickPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setHoldName(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-normal border transition cursor-pointer active:scale-[0.99] ${
                        holdName === preset
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-medium shadow-xs'
                          : isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                          : 'bg-slate-800/60 hover:bg-slate-700 text-slate-300 border-slate-700'
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
              className={`px-4 py-2 rounded-xl text-xs font-normal border transition cursor-pointer active:scale-[0.99] ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isEn ? 'Cancel' : 'Batal'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)] transition cursor-pointer active:scale-[0.99]"
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
