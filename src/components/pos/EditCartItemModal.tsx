import React, { useState, useEffect } from 'react';
import { CartItem } from '../../types';
import { X, Check, Minus, Plus, Tag, FileText } from 'lucide-react';

interface EditCartItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CartItem | null;
  onSave: (quantity: number, itemDiscount: number, variant: string) => void;
  language: 'ID' | 'EN';
}

export const EditCartItemModal: React.FC<EditCartItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  language,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [itemDiscount, setItemDiscount] = useState<number>(0);
  const [variant, setVariant] = useState<string>('');

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity);
      setItemDiscount(item.itemDiscount || 0);
      setVariant(item.modifiers?.variant || '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(Math.max(1, quantity), Math.max(0, itemDiscount), variant);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#161b22] border border-[#30363d] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
          <div>
            <h3 className="font-bold text-sm text-white">
              {language === 'ID' ? 'Edit Item Belanja' : 'Edit Cart Item'}
            </h3>
            <p className="text-xs text-gray-400 truncate max-w-xs">{item.product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#21262d] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Price & SKU Info */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs">
            <div>
              <span className="text-gray-400">Barcode / SKU:</span>
              <p className="font-mono font-bold text-blue-400">
                {item.product.barcode || item.product.id}
              </p>
            </div>
            <div className="text-right">
              <span className="text-gray-400">Harga Satuan:</span>
              <p className="font-mono font-bold text-emerald-400">
                Rp {item.product.sell_price.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">
              {language === 'ID' ? 'Jumlah / Qty' : 'Quantity'}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-white flex items-center justify-center border border-[#30363d] font-bold"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-[#0d1117] border border-[#30363d] text-white text-center font-mono font-bold text-base py-2 rounded-xl outline-none focus:border-[#0052FF]"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-white flex items-center justify-center border border-[#30363d] font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Size / Variant */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>{language === 'ID' ? 'Detail Size / Varian' : 'Size / Variant Detail'}</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: 600ML / ORIGINAL, 85G, XL..."
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] text-white text-xs px-3 py-2.5 rounded-xl outline-none focus:border-[#0052FF]"
            />
          </div>

          {/* Item Discount */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'ID' ? 'Potongan / Diskon Satuan (Rp)' : 'Item Discount (Rp)'}</span>
            </label>
            <input
              type="number"
              min={0}
              step={500}
              value={itemDiscount}
              onChange={(e) => setItemDiscount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-[#0d1117] border border-[#30363d] text-white text-xs px-3 py-2.5 rounded-xl outline-none focus:border-[#0052FF] font-mono"
            />
          </div>

          {/* Subtotal Preview */}
          <div className="pt-2 border-t border-[#30363d] flex items-center justify-between text-xs">
            <span className="text-gray-400">Total Baris Baru:</span>
            <span className="font-mono font-black text-sm text-[#10B981]">
              Rp {((item.product.sell_price - itemDiscount) * quantity).toLocaleString('id-ID')}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#30363d] text-xs font-semibold text-gray-300 hover:bg-[#21262d] transition"
            >
              {language === 'ID' ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#0052FF] hover:bg-[#0043d1] text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md transition"
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
