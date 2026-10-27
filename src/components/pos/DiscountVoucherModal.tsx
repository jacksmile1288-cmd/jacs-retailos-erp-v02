import React, { useState } from 'react';
import { Tag, X, Check, Percent, DollarSign, Gift, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DiscountVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  discountType: 'IDR' | 'PERCENT';
  discountAmount: number;
  discountPercent: number;
  subtotal: number;
  onApplyDiscount: (type: 'IDR' | 'PERCENT', val: number) => void;
  language?: 'ID' | 'EN';
}

export const DiscountVoucherModal: React.FC<DiscountVoucherModalProps> = ({
  isOpen,
  onClose,
  discountType: initialType,
  discountAmount: initialAmount,
  discountPercent: initialPercent,
  subtotal,
  onApplyDiscount,
  language = 'ID',
}) => {
  const { promotions } = useApp();
  const activePromos = promotions.filter((p) => p.status === 'ACTIVE' || p.isActive === true);

  const getPromoType = (p: { discountType?: 'PERCENT' | 'IDR'; discountValueType?: 'PERCENT' | 'NOMINAL' }): 'PERCENT' | 'IDR' => {
    if (p.discountType) return p.discountType;
    return p.discountValueType === 'PERCENT' ? 'PERCENT' : 'IDR';
  };

  const [type, setType] = useState<'IDR' | 'PERCENT'>(initialType);
  const [amount, setAmount] = useState<number>(initialAmount);
  const [percent, setPercent] = useState<number>(initialPercent);
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [voucherMsg, setVoucherMsg] = useState<{ text: string; success: boolean } | null>(null);

  if (!isOpen) return null;

  const handleApply = () => {
    if (type === 'IDR') {
      onApplyDiscount('IDR', Math.max(0, Math.min(subtotal, amount)));
    } else {
      onApplyDiscount('PERCENT', Math.max(0, Math.min(100, percent)));
    }
    onClose();
  };

  const handleCheckVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;

    // Check against live Executive Promotion Programs
    const foundPromo = promotions.find(
      (p) => p.code.toUpperCase() === code && (p.status === 'ACTIVE' || p.isActive === true)
    );
    if (foundPromo) {
      const pType = getPromoType(foundPromo);
      setType(pType);
      if (pType === 'PERCENT') {
        setPercent(foundPromo.discountValue);
      } else {
        setAmount(foundPromo.discountValue);
      }
      setVoucherMsg({
        text: `Voucher resmi aktif: "${foundPromo.name}" (${foundPromo.discountValue}${pType === 'PERCENT' ? '%' : ' Rp'}) berhasil dipasang!`,
        success: true,
      });
      return;
    }

    if (code === 'DISKON10' || code === 'HEMAT10') {
      setType('PERCENT');
      setPercent(10);
      setVoucherMsg({ text: 'Voucher valid: Diskon 10% berhasil dipasang!', success: true });
    } else if (code === 'DISKON50' || code === 'HEMAT50K') {
      setType('IDR');
      setAmount(50000);
      setVoucherMsg({ text: 'Voucher valid: Potongan Rp 50.000 berhasil dipasang!', success: true });
    } else if (code === 'SUPERDEAL' || code === 'VIP20') {
      setType('PERCENT');
      setPercent(20);
      setVoucherMsg({ text: 'Voucher VIP valid: Diskon 20% berhasil dipasang!', success: true });
    } else {
      setVoucherMsg({ text: 'Kode voucher tidak valid atau sudah kedaluwarsa.', success: false });
    }
  };

  return (
    <div
      id="modal-discount-voucher"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
    >
      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-2xl text-white space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {language === 'ID' ? 'Promo & Diskon Voucher' : 'Promos & Discount Voucher'}
              </h3>
              <p className="text-[11px] text-gray-400">
                {language === 'ID' ? 'Potongan nota per transaksi' : 'Apply order-wide discount'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#21262d] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voucher Code Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-300">
            {language === 'ID' ? 'Klaim Kode Voucher Promo' : 'Claim Voucher Code'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: DISKON10, HEMAT50K, VIP20"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              className="flex-1 bg-[#0d1117] border border-[#30363d] text-white px-3 py-2 rounded-xl text-xs uppercase outline-none focus:border-amber-400 font-mono"
            />
            <button
              onClick={handleCheckVoucher}
              className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {language === 'ID' ? 'Terapkan' : 'Apply'}
            </button>
          </div>
          {voucherMsg && (
            <p
              className={`text-[11px] font-semibold ${
                voucherMsg.success ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {voucherMsg.text}
            </p>
          )}
        </div>

        {/* Active Executive Promos (Live Sync) */}
        {activePromos.length > 0 && (
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-purple-300">
              <span className="flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-purple-400" />
                <span>{language === 'ID' ? 'Promo Otorisasi Eksekutif (1-Klik):' : 'Authorized Executive Promos (1-Click):'}</span>
              </span>
              <span className="text-[9px] text-purple-300 font-mono px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                LIVE SYNC
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {activePromos.map((pr, prIdx) => {
                const prType = getPromoType(pr);
                return (
                  <button
                    key={`promo-tag-${pr.id}-${prIdx}`}
                    type="button"
                    onClick={() => {
                      setType(prType);
                      if (prType === 'PERCENT') {
                        setPercent(pr.discountValue);
                      } else {
                        setAmount(pr.discountValue);
                      }
                      setVoucherCode(pr.code);
                      setVoucherMsg({
                        text: `Promo resmi terpilih: "${pr.name}" (${pr.code})`,
                        success: true,
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/15 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <span className="font-mono font-bold text-amber-300">{pr.code}</span>
                    <span className="text-purple-400">•</span>
                    <span>{prType === 'PERCENT' ? `${pr.discountValue}%` : `Rp ${pr.discountValue.toLocaleString('id-ID')}`}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Manual Discount Settings */}
        <div className="pt-2 border-t border-[#30363d] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300">
              {language === 'ID' ? 'Tipe Potongan Manual' : 'Manual Discount Type'}
            </span>
            <div className="flex bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d]">
              <button
                type="button"
                onClick={() => setType('IDR')}
                className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition ${
                  type === 'IDR'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Rupiah (Rp)
              </button>
              <button
                type="button"
                onClick={() => setType('PERCENT')}
                className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition ${
                  type === 'PERCENT'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Persentase (%)
              </button>
            </div>
          </div>

          {type === 'IDR' ? (
            <div className="space-y-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  Rp
                </span>
                <input
                  type="number"
                  placeholder="0"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white pl-9 pr-3 py-2 rounded-xl text-sm font-mono outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex gap-2">
                {[10000, 25000, 50000, 100000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className="flex-1 py-1 bg-[#21262d] hover:bg-[#30363d] text-gray-300 text-[11px] font-bold rounded-lg transition cursor-pointer"
                  >
                    Rp {(val / 1000).toLocaleString('id-ID')}k
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={percent || ''}
                  onChange={(e) => setPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white pl-3 pr-8 py-2 rounded-xl text-sm font-mono outline-none focus:border-amber-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  %
                </span>
              </div>
              <div className="flex gap-2">
                {[5, 10, 15, 20, 50].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPercent(val)}
                    className="flex-1 py-1 bg-[#21262d] hover:bg-[#30363d] text-gray-300 text-[11px] font-bold rounded-lg transition cursor-pointer"
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#30363d] grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              onApplyDiscount('IDR', 0);
              onClose();
            }}
            className="py-2.5 rounded-xl text-xs font-bold bg-[#21262d] hover:bg-[#30363d] text-gray-300 transition cursor-pointer"
          >
            {language === 'ID' ? 'Hapus Diskon' : 'Clear Discount'}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{language === 'ID' ? 'Simpan Diskon' : 'Apply Discount'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
