import React from 'react';
import { CartItem, Terminal, User } from '../../types';
import { X, Printer, ChefHat, Check, Send } from 'lucide-react';

interface KotTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  terminal: Terminal;
  user?: User | null;
  orderType?: string;
  tableNumber?: string;
  voidedKotItems?: string[];
  revisedKotItems?: string[];
  onSentToKitchen: () => void;
}

export const KotTicketModal: React.FC<KotTicketModalProps> = ({
  isOpen,
  onClose,
  cart,
  terminal,
  user,
  orderType: propOrderType,
  tableNumber: propTableNumber,
  voidedKotItems = [],
  revisedKotItems = [],
  onSentToKitchen,
}) => {
  if (!isOpen) return null;

  const hasVoidedRevision = voidedKotItems.length > 0;
  const hasToppingRevision = revisedKotItems.length > 0;
  const hasAnyRevision = hasVoidedRevision || hasToppingRevision;

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const rawOrderType =
    propOrderType ||
    cart.find((c) => c.modifiers?.orderType)?.modifiers?.orderType ||
    'Dine-In';
  const normalizedOrderUpper = rawOrderType.toUpperCase();
  const isDineIn = normalizedOrderUpper === 'DINE-IN';
  const isDelivery = normalizedOrderUpper === 'DELIVERY';
  const orderTypeDisplay = isDineIn ? 'DINE-IN' : isDelivery ? 'DELIVERY' : 'TAKEAWAY';

  const rawTable = isDineIn
    ? propTableNumber ||
      cart.find((c) => c.modifiers?.tableNumber)?.modifiers?.tableNumber ||
      'Meja 01'
    : '';
  const tableNumber = rawTable
    ? rawTable.toLowerCase().includes('meja')
      ? rawTable
      : `Meja ${rawTable}`
    : '';

  const handlePrint = () => {
    window.print();
  };

  const handleSend = () => {
    onSentToKitchen();
    onClose();
  };

  return (
    <div
      id="modal-kot-ticket"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
    >
      <div className="w-full max-w-md bg-[#161b22] border border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] rounded-2xl p-6 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-lg hover:bg-[#21262d] transition cursor-pointer active:scale-[0.99]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-medium text-white flex items-center gap-2 flex-wrap">
              <span>Kitchen Order Ticket (KOT)</span>
              {hasAnyRevision && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  REVISI KOT
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-400 font-normal">
              Tiket Pesanan Dapur & Barista • JacS Food Engine
            </p>
          </div>
        </div>

        {/* Thermal Receipt Paper Look */}
        <div className="bg-white text-black p-5 rounded-xl font-mono text-xs shadow-inner space-y-3 border-2 border-dashed border-gray-400">
          <div className="text-center border-b border-black pb-2">
            <div className="text-sm font-semibold tracking-wider">*** KITCHEN ORDER TICKET ***</div>
            {hasVoidedRevision && (
              <div
                id="kot-revision-void-banner"
                className="mt-1.5 px-2.5 py-1.5 rounded bg-rose-100 border border-rose-600 text-rose-800 text-[11px] font-bold leading-snug text-center"
              >
                [REVISI KOT - BATAL: {voidedKotItems.join(', ')}]
              </div>
            )}
            {hasToppingRevision && (
              <div
                id="kot-revision-topping-banner"
                className="mt-1.5 px-2.5 py-1.5 rounded bg-amber-100 border border-amber-600 text-amber-900 text-[11px] font-bold leading-snug text-center"
              >
                [REVISI KOT - UBAH TOPPING/CATATAN: {revisedKotItems.join(' | ')}]
              </div>
            )}
            <div className="text-[11px] font-medium mt-1">
              {isDineIn
                ? `${tableNumber.toUpperCase()} • [DINE-IN]`
                : isDelivery
                ? `[${orderTypeDisplay}] • TANPA MEJA (KURIR)`
                : `[${orderTypeDisplay}] • TANPA MEJA (BUNGKUS)`}
            </div>
            <div className="text-[10px] text-gray-600">
              {dateStr} - {timeStr} | {terminal.name}
            </div>
            <div className="text-[10px] text-gray-600">Server: {user?.name || 'Kasir'}</div>
          </div>

          {/* Items to Cook */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {cart.map((item, idx) => {
              const mods = item.modifiers;
              const catLower = (item.product.category || '').toLowerCase();
              const isBeverageOrPastry =
                catLower.includes('kopi') ||
                catLower.includes('minuman') ||
                catLower.includes('segar') ||
                catLower.includes('pastry') ||
                catLower.includes('bakery') ||
                catLower.includes('snack');
              const spicyVal = Number(mods?.spicyLevel ?? 0);
              const showSpicyLabel = Boolean(mods?.spicyLabel);
              const showNumericSpicyLevel =
                !showSpicyLabel &&
                mods?.spicyLevel !== undefined &&
                (spicyVal > 0 || (!isBeverageOrPastry && catLower.includes('makanan utama')));
              const sugarIceDisplay =
                mods?.sugarIceLabel ||
                [
                  mods?.sugarLevel && mods.sugarLevel !== 'Normal' ? mods.sugarLevel : null,
                  mods?.temperature && mods.temperature !== 'Normal Ice' ? mods.temperature : null,
                ]
                  .filter(Boolean)
                  .join(', ');

              return (
                <div key={idx} className="border-b border-gray-200 pb-2">
                  <div className="flex items-start justify-between font-normal">
                    <span className="text-xs font-medium">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-mono">
                      #{idx + 1}
                    </span>
                  </div>

                  {mods && (
                    <div className="pl-3 mt-1 text-[11px] text-gray-700 space-y-0.5 font-sans">
                      {mods.toppings && mods.toppings.length > 0 && (
                        <div>
                          • Topping:{' '}
                          <span className="font-semibold text-gray-900">
                            {mods.toppings.join(', ')}
                          </span>
                        </div>
                      )}
                      {showSpicyLabel && (
                        <div>
                          • <span className="font-semibold text-red-600">Level Pedas: {mods.spicyLabel}</span>
                        </div>
                      )}
                      {showNumericSpicyLevel && (
                        <div>
                          • <span className="font-medium text-red-600">Level Pedas {mods.spicyLevel}</span>
                        </div>
                      )}
                      {sugarIceDisplay && (
                        <div>
                          • <span className="font-medium text-cyan-800">Gula &amp; Es: {sugarIceDisplay}</span>
                        </div>
                      )}
                      {mods.notes && (
                        <div className="text-amber-800 font-normal bg-amber-50 p-1 rounded border border-amber-200">
                          Catatan: "{mods.notes}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center border-t border-black pt-2 text-[10px] text-gray-600">
            [ MOHON DIPROSES SESUAI URUTAN TIKET ]
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mt-5">
          <button
            onClick={handlePrint}
            className="py-3 px-3 rounded-xl font-medium text-xs bg-[#21262d] hover:bg-[#30363d] text-white transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Cetak Thermal KOT</span>
          </button>
          <button
            onClick={handleSend}
            className="py-3 px-3 rounded-xl font-medium text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer active:scale-[0.99]"
          >
            <Send className="w-4 h-4" />
            <span>Kirim ke Dapur</span>
          </button>
        </div>
      </div>
    </div>
  );
};
