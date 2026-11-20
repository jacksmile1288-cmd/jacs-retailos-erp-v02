import React, { useState } from 'react';
import { CartItem, CustomerMaster, PriceTier } from '../../types';
import { X, Clock, Play, Trash2, ShoppingBag, Search, Plus, RotateCcw } from 'lucide-react';

export interface HeldOrder {
  id: string;
  name: string;
  timestamp: string;
  items: CartItem[];
  total: number;
  customer?: CustomerMaster | null;
  priceTier?: PriceTier;
  discountType?: 'IDR' | 'PERCENT';
  discountVal?: number;
  isFittingRoomHold?: boolean;
  fittingRoomLabel?: string;
  fashionAdvisorId?: string;
  fashionAdvisorName?: string;
  stationCode?: string;
  isFnbHold?: boolean;
  fnbTableNo?: string;
  fnbOrderMode?: 'Dine-In' | 'Takeaway' | 'Delivery';
  kotSent?: boolean;
  kotSentAt?: number | null;
  kotVoidedItems?: string[];
  kotRevisedItems?: string[];
}

interface HeldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldOrders: HeldOrder[];
  onRecall: (order: HeldOrder) => void;
  onDelete: (id: string) => void;
  isLight?: boolean;
  language?: 'ID' | 'EN';
  onOpenHoldModal?: () => void;
}

export const HeldOrdersModal: React.FC<HeldOrdersModalProps> = ({
  isOpen,
  onClose,
  heldOrders,
  onRecall,
  onDelete,
  isLight = false,
  language = 'ID',
  onOpenHoldModal,
}) => {
  const [search, setSearch] = useState('');
  const isEn = language === 'EN';

  if (!isOpen) return null;

  const filteredOrders = heldOrders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      (o.customer?.name || '').toLowerCase().includes(q) ||
      (o.fnbTableNo || '').toLowerCase().includes(q) ||
      (o.fnbOrderMode || '').toLowerCase().includes(q) ||
      o.items.some((i) => i.product.name.toLowerCase().includes(q))
    );
  });

  return (
    <div
      id="modal-held-orders"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in"
    >
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl p-5 sm:p-6 relative overflow-hidden transition-all ${
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
        <div className="flex items-center justify-between mb-4 pr-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base leading-6 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isEn ? 'Held Orders Queue (Recall)' : 'Daftar Antrean Tertunda (Recall Cart)'}</span>
                <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {heldOrders.length} {isEn ? 'Held' : 'Antrean'}
                </span>
              </h3>
              <p className="text-xs leading-5 font-normal text-slate-500 dark:text-slate-400">
                {isEn
                  ? 'Resume customer cart orders that were paused in queue'
                  : 'Panggil kembali keranjang belanja pelanggan yang sedang antre'}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar: Search + Quick Hold New */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search
              className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isEn ? 'Search held queue by name / customer...' : 'Cari nama antrean / pelanggan...'}
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm leading-5 font-normal placeholder:italic border transition outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-amber-500'
                  : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-amber-400'
              }`}
            />
          </div>

          {onOpenHoldModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHoldModal();
              }}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs active:scale-[0.99]"
              title="Tahan keranjang yang sedang aktif"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isEn ? '+ Hold Current Cart' : '+ Tahan Keranjang Saat Ini'}</span>
            </button>
          )}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div
            className={`text-center py-12 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
            } space-y-2`}
          >
            <ShoppingBag className="w-10 h-10 mx-auto opacity-30 text-amber-500" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {heldOrders.length === 0
                ? isEn
                  ? 'No held transaction queues at the moment.'
                  : 'Tidak ada antrean transaksi yang tertahan saat ini.'
                : isEn
                ? 'No matching held order found.'
                : 'Tidak ada antrean yang cocok dengan pencarian.'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-gray-400">
              {isEn
                ? 'Use the "Hold Cart" button to park current cart items.'
                : 'Gunakan tombol "Hold Cart" untuk menahan transaksi pelanggan yang tertunda.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-84 overflow-y-auto pr-1">
            {filteredOrders.map((order, orderIdx) => {
              const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
              return (
                <div
                  key={`held-order-${order.id}-${orderIdx}`}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                    isLight
                      ? 'bg-slate-50 hover:bg-white border-slate-200 hover:border-amber-400/70 hover:shadow-xs'
                      : 'bg-slate-800/40 border-slate-700/60 hover:border-amber-500/50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-normal text-sm leading-5 text-slate-900 dark:text-white truncate">
                        {order.name}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-mono font-normal ${
                          isLight
                            ? 'bg-amber-100/70 text-amber-900 border border-amber-300'
                            : 'bg-slate-800 text-amber-400 border border-slate-700'
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5 inline mr-1" />
                        {order.timestamp}
                      </span>
                      {order.customer && (
                        <span className="text-[11px] bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono font-normal truncate max-w-[140px]">
                          {order.customer.name}
                        </span>
                      )}
                      {order.isFittingRoomHold && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/35 font-semibold">
                          👗 {order.fittingRoomLabel || 'FITTING ROOM'}
                        </span>
                      )}
                      {order.fashionAdvisorName && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                          Advisor: {order.fashionAdvisorName}
                        </span>
                      )}
                      {order.isFnbHold && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 font-semibold">
                          {order.fnbOrderMode === 'Dine-In'
                            ? `${order.fnbTableNo || 'Meja 01'} • Dine-In`
                            : order.fnbOrderMode === 'Delivery'
                            ? 'Delivery • Tanpa Meja (Kurir)'
                            : 'Takeaway • Tanpa Meja (Bungkus)'}
                        </span>
                      )}
                      {order.kotSent && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/35 font-semibold">
                          KOT Terkirim
                        </span>
                      )}
                      {order.priceTier && order.priceTier !== 'RETAIL' && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-normal">
                          {order.priceTier}
                        </span>
                      )}
                    </div>

                    <div className="text-xs leading-5 text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="font-normal">{totalItems} item ({order.items.length} SKU)</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                        Rp {order.total.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="text-[11px] leading-4 text-slate-500 dark:text-slate-400 truncate max-w-sm mt-0.5">
                      {order.items.map((i) => `${i.product.name} (${i.quantity})`).join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDelete(order.id)}
                      className={`px-3 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-normal active:scale-[0.99] ${
                        isLight
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                          : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                      title={isEn ? 'Delete Held Queue' : 'Hapus Antrean'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Delete' : 'Hapus'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRecall(order)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-[0.99]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Restore Cart' : 'Pulihkan'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div
          className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
            isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
          }`}
        >
          <span className="text-[11px] font-normal">
            {isEn
              ? 'Tip: Recalling an order restores items and customer details to the cashier.'
              : 'Tip: Panggil (Recall) untuk memuat item & data pelanggan kembali ke kasir.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl text-xs font-normal border transition cursor-pointer active:scale-[0.99] ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isEn ? 'Close' : 'Tutup'}
          </button>
        </div>
      </div>
    </div>
  );
};
