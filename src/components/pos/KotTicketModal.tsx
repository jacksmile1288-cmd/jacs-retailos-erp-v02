import React from 'react';
import { CartItem, Terminal, User } from '../../types';
import { X, Printer, ChefHat, Check, Send } from 'lucide-react';

interface KotTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  terminal: Terminal;
  user?: User | null;
  onSentToKitchen: () => void;
}

export const KotTicketModal: React.FC<KotTicketModalProps> = ({
  isOpen,
  onClose,
  cart,
  terminal,
  user,
  onSentToKitchen,
}) => {
  if (!isOpen) return null;

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

  const tableNumber =
    cart.find((c) => c.modifiers?.tableNumber)?.modifiers?.tableNumber || 'Meja 01';
  const orderType =
    cart.find((c) => c.modifiers?.orderType)?.modifiers?.orderType || 'Dine-In';

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
      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-2xl text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-lg hover:bg-[#21262d] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Kitchen Order Ticket (KOT)</h3>
            <p className="text-xs text-[#8b949e]">
              Tiket Pesanan Dapur & Barista • JacS Food Engine
            </p>
          </div>
        </div>

        {/* Thermal Receipt Paper Look */}
        <div className="bg-white text-black p-5 rounded-xl font-mono text-xs shadow-inner space-y-3 border-2 border-dashed border-gray-400">
          <div className="text-center border-b border-black pb-2">
            <div className="text-sm font-black tracking-wider">*** KITCHEN ORDER TICKET ***</div>
            <div className="text-[11px] font-bold mt-0.5">
              {tableNumber.toUpperCase()} • [{orderType.toUpperCase()}]
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
              return (
                <div key={idx} className="border-b border-gray-200 pb-2">
                  <div className="flex items-start justify-between font-bold">
                    <span className="text-xs font-black">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                  </div>

                  {mods && (
                    <div className="pl-3 mt-1 text-[11px] text-gray-700 space-y-0.5 font-sans">
                      {mods.spicyLevel !== undefined && (
                        <div>
                          • <span className="font-bold text-red-600">Level Pedas {mods.spicyLevel}</span>
                        </div>
                      )}
                      {mods.toppings && mods.toppings.length > 0 && (
                        <div>
                          • Topping:{' '}
                          <span className="font-semibold text-gray-800">
                            {mods.toppings.join(', ')}
                          </span>
                        </div>
                      )}
                      {mods.notes && (
                        <div className="text-amber-800 font-bold bg-amber-50 p-1 rounded border border-amber-200">
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
            className="py-3 px-3 rounded-xl font-bold text-xs bg-[#21262d] hover:bg-[#30363d] text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Cetak Thermal KOT</span>
          </button>
          <button
            onClick={handleSend}
            className="py-3 px-3 rounded-xl font-bold text-xs bg-[#10B981] hover:bg-[#0ea371] text-black transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Kirim ke Dapur</span>
          </button>
        </div>
      </div>
    </div>
  );
};
