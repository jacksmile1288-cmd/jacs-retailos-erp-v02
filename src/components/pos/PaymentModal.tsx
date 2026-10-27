import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Receipt,
  UserCheck,
  CreditCard,
  QrCode,
  Banknote,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Printer,
  PauseCircle,
  Search,
  ShieldCheck,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { CartItem, Customer, PaymentMethod, Terminal } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  grandTotal: number;
  rawGrandTotal: number;
  cashRoundingDiff: number;
  receiptNumber: string;
  paymentMethod: PaymentMethod | string;
  setPaymentMethod: (method: any) => void;
  cashGiven: number;
  setCashGiven: (amount: number) => void;
  changeAmount: number;
  selectedCustomer: Customer | null;
  onSelectCustomer?: (customer: Customer | null) => void;
  customers?: Customer[];
  onConfirmPayment: (overrideMethod?: string) => void;
  isLight?: boolean;
  language?: string;
  activeTerminal: Terminal;
  onHoldOrder?: () => void;
  onOpenQris?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  cart,
  grandTotal,
  rawGrandTotal,
  cashRoundingDiff,
  receiptNumber,
  paymentMethod,
  setPaymentMethod,
  cashGiven,
  setCashGiven,
  changeAmount,
  selectedCustomer,
  onSelectCustomer,
  customers = [],
  onConfirmPayment,
  isLight = false,
  language = 'ID',
  activeTerminal,
  onHoldOrder,
  onOpenQris,
}) => {
  const isEn = language === 'en';
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [tempoDays, setTempoDays] = useState(30);

  const isCreditAr =
    paymentMethod === 'KREDIT / TEMPO (AR)' ||
    paymentMethod === 'KREDIT' ||
    paymentMethod === 'AR_CREDIT';

  // Calculate Due Date preview for AR
  const dueDateStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + tempoDays);
    return d.toISOString().slice(0, 10);
  }, [tempoDays]);

  const filteredCustomers = React.useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 8);
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.memberTier && c.memberTier.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [customers, customerSearch]);

  const totalCartItemCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  // Quick cash buttons
  const quickCashPresets = [
    grandTotal,
    Math.ceil(grandTotal / 10000) * 10000,
    Math.ceil(grandTotal / 20000) * 20000,
    Math.ceil(grandTotal / 50000) * 50000,
    Math.ceil(grandTotal / 100000) * 100000,
  ].filter((val, idx, self) => val >= grandTotal && self.indexOf(val) === idx);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' || e.key === 'F10') {
        // Prevent enter if searching customer
        if (document.activeElement?.id === 'ar-customer-search-input') return;
        e.preventDefault();
        if (isCreditAr && !selectedCustomer) {
          setIsCustomerPickerOpen(true);
          return;
        }
        onConfirmPayment();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCreditAr, selectedCustomer, onClose, onConfirmPayment]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-payment-confirm"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl p-4 sm:p-6 border shadow-[0_20px_60px_rgba(0,0,0,0.9)] relative animate-in zoom-in-95 space-y-4 ${
          isLight
            ? 'bg-white border-slate-300 text-slate-900 shadow-slate-300'
            : 'bg-[#161b22] border-[#30363d] text-white'
        }`}
      >
        {/* Tombol Tutup [X] */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-slate-800 hover:bg-rose-600 border border-slate-600 hover:border-rose-500 p-2 rounded-xl transition cursor-pointer shadow-md group"
          title="Tutup / Batal [Esc]"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Header Modal */}
        <div className="flex items-center gap-3 pr-10">
          <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-[#0052FF] dark:text-[#58a6ff] border border-blue-500/30 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
              {isEn ? 'Confirm Payment & Receipt' : 'Konfirmasi Pembayaran Kasir POS'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-gray-400">
              <span className="font-mono font-bold text-[#0052FF] dark:text-[#58a6ff]">{receiptNumber}</span> • Terminal:{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{activeTerminal.name}</span>
            </p>
          </div>
        </div>

        {/* METODE PEMBAYARAN SELECTOR */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-gray-400 mb-1.5">
            {isEn ? 'Select Payment Method' : 'Pilihan Metode Pembayaran'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Tunai */}
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                paymentMethod === 'CASH'
                  ? 'border-[#0052FF] bg-[#0052FF]/10 text-[#0052FF] dark:text-[#58a6ff] shadow-sm font-black'
                  : isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold'
                  : 'border-[#30363d] bg-[#0d1117] text-gray-300 hover:bg-[#21262d] font-semibold'
              }`}
            >
              <Banknote className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-bold leading-tight">💵 Tunai</span>
              <span className="text-[10px] text-gray-400">Cash / Laci</span>
            </button>

            {/* 2. QRIS */}
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('QRIS');
                if (onOpenQris) onOpenQris();
              }}
              className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                paymentMethod === 'QRIS'
                  ? 'border-[#0052FF] bg-[#0052FF]/10 text-[#0052FF] dark:text-[#58a6ff] shadow-sm font-black'
                  : isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold'
                  : 'border-[#30363d] bg-[#0d1117] text-gray-300 hover:bg-[#21262d] font-semibold'
              }`}
            >
              <QrCode className="w-5 h-5 text-rose-500" />
              <span className="text-xs font-bold leading-tight">📱 QRIS</span>
              <span className="text-[10px] text-gray-400">Dinamis Bank</span>
            </button>

            {/* 3. Debit EDC */}
            <button
              type="button"
              onClick={() => setPaymentMethod('EDC_DEBIT')}
              className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                paymentMethod === 'EDC_DEBIT'
                  ? 'border-[#0052FF] bg-[#0052FF]/10 text-[#0052FF] dark:text-[#58a6ff] shadow-sm font-black'
                  : isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold'
                  : 'border-[#30363d] bg-[#0d1117] text-gray-300 hover:bg-[#21262d] font-semibold'
              }`}
            >
              <CreditCard className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-bold leading-tight">💳 EDC Debit</span>
              <span className="text-[10px] text-gray-400">Transfer Bank</span>
            </button>

            {/* 4. KREDIT / TEMPO (AR) */}
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('KREDIT / TEMPO (AR)');
                if (!selectedCustomer) {
                  setIsCustomerPickerOpen(true);
                }
              }}
              className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center relative ${
                isCreditAr
                  ? 'border-purple-600 bg-purple-500/15 text-purple-600 dark:text-purple-400 shadow-sm font-black ring-2 ring-purple-500/20'
                  : isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-purple-50 font-semibold'
                  : 'border-[#30363d] bg-[#0d1117] text-gray-300 hover:bg-[#21262d] font-semibold'
              }`}
            >
              <span className="absolute -top-1.5 -right-1 text-[8px] font-black px-1.5 py-0.2 rounded-full bg-purple-600 text-white uppercase tracking-tight shadow">
                AR
              </span>
              <BookOpen className="w-5 h-5 text-purple-500" />
              <span className="text-xs font-bold leading-tight">📋 Kredit / Tempo</span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Piutang (AR)</span>
            </button>
          </div>
        </div>

        {/* DETAIL KHUSUS METODE PEMBAYARAN KREDIT / TEMPO (AR) */}
        {isCreditAr && (
          <div className="p-3.5 sm:p-4 rounded-xl border-2 border-purple-500/40 bg-purple-500/5 dark:bg-purple-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-purple-600 dark:text-purple-300">
                    Transaksi Piutang Usaha (AR) Member
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-gray-400">
                    Otomatis catat tagihan AR dan terbitkan jurnal <span className="font-mono font-bold text-purple-600 dark:text-purple-300">POS-AR-[id]</span>
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                TEMPO 30 HARI
              </span>
            </div>

            {/* Customer Check & Selector */}
            {selectedCustomer ? (
              <div className="p-2.5 rounded-lg border border-purple-300 dark:border-purple-800/60 bg-white/70 dark:bg-[#161b22] flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <UserCheck className="w-4 h-4 text-purple-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-xs block text-slate-900 dark:text-white truncate">
                      {selectedCustomer.name}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-mono">
                      {selectedCustomer.phone || selectedCustomer.id} • Tier: {selectedCustomer.memberTier || 'Member'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {onSelectCustomer && (
                    <button
                      type="button"
                      onClick={() => setIsCustomerPickerOpen(!isCustomerPickerOpen)}
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-700 underline cursor-pointer"
                    >
                      Ganti
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 space-y-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Metode KREDIT / TEMPO (AR) wajib memilih Member / Customer terdaftar!</span>
                </div>
                {onSelectCustomer && (
                  <button
                    type="button"
                    onClick={() => setIsCustomerPickerOpen(true)}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Pilih Member / Pelanggan Sekarang
                  </button>
                )}
              </div>
            )}

            {/* Quick Customer Picker Dropdown / Box */}
            {isCustomerPickerOpen && onSelectCustomer && (
              <div className="p-3 rounded-xl border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800 dark:text-gray-200">Cari Data Member:</span>
                  <button
                    type="button"
                    onClick={() => setIsCustomerPickerOpen(false)}
                    className="text-gray-400 hover:text-gray-600 text-[11px]"
                  >
                    Tutup
                  </button>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                  <input
                    id="ar-customer-search-input"
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Ketik nama atau nomor telepon member..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-[#30363d] bg-slate-50 dark:bg-[#161b22] focus:outline-none focus:ring-1 focus:ring-purple-500"
                    autoFocus
                  />
                </div>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-gray-800">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((cust) => (
                      <div
                        key={`ar-cust-${cust.id}`}
                        onClick={() => {
                          onSelectCustomer(cust);
                          setIsCustomerPickerOpen(false);
                        }}
                        className="py-1.5 px-2 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded flex items-center justify-between cursor-pointer transition text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{cust.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{cust.phone || cust.id}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300">
                          {cust.memberTier || 'Member'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-center text-xs text-gray-400">Tidak ada member ditemukan.</div>
                  )}
                </div>
              </div>
            )}

            {/* Jurnal Akuntansi POS-AR Preview */}
            <div className="p-2.5 rounded-lg border border-purple-200 dark:border-purple-900/40 bg-purple-100/40 dark:bg-purple-950/30 text-[11px] space-y-1">
              <span className="font-bold text-purple-700 dark:text-purple-300 block">
                📋 Pratinjau Jurnal Akuntansi Otomatis:
              </span>
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                <div className="p-1 rounded bg-white/60 dark:bg-black/30 border border-purple-200/60 dark:border-purple-900/50">
                  <span className="text-blue-600 dark:text-blue-400 font-bold block">[DEBIT] 1-10301</span>
                  <span className="text-gray-700 dark:text-gray-300">Piutang Usaha (AR):</span>
                  <span className="block font-bold text-slate-900 dark:text-white">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-1 rounded bg-white/60 dark:bg-black/30 border border-purple-200/60 dark:border-purple-900/50">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold block">[KREDIT] 4-10001</span>
                  <span className="text-gray-700 dark:text-gray-300">Pendapatan Penjualan:</span>
                  <span className="block font-bold text-slate-900 dark:text-white">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-gray-400 flex items-center justify-between pt-1">
                <span>Jatuh Tempo: <strong>{dueDateStr}</strong></span>
                <span>Tagihan Otomatis masuk ke <strong>invoicesReceivable</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* INPUT UANG DITERIMA UNTUK TUNAI (CASH) */}
        {paymentMethod === 'CASH' && (
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#30363d] bg-slate-50/70 dark:bg-[#0d1117] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-gray-300">
              <span>Nominal Uang Diterima:</span>
              <span className="text-[11px] text-gray-500 font-mono">
                Kurang: {cashGiven < grandTotal ? `Rp ${(grandTotal - cashGiven).toLocaleString('id-ID')}` : 'Rp 0'}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-black text-slate-500">Rp</span>
              <input
                id="modal-cash-given-input"
                type="number"
                value={cashGiven || ''}
                onChange={(e) => setCashGiven(Number(e.target.value))}
                placeholder={grandTotal.toString()}
                className="w-full pl-9 pr-3 py-2 text-base font-black font-mono rounded-xl border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#161b22] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
              />
            </div>

            {/* Quick cash denomination chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {quickCashPresets.map((preset, idx) => (
                <button
                  key={`preset-${idx}`}
                  type="button"
                  onClick={() => setCashGiven(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    cashGiven === preset
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-[#161b22] border-slate-300 dark:border-[#30363d] text-slate-700 dark:text-gray-300 hover:bg-slate-100'
                  }`}
                >
                  {preset === grandTotal ? 'Uang Pas' : `Rp ${preset.toLocaleString('id-ID')}`}
                </button>
              ))}
            </div>

            {/* Kembalian */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-gray-800 text-xs">
              <span className="font-bold text-slate-600 dark:text-gray-400">Kembalian:</span>
              <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                Rp {changeAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        )}

        {/* RINGKASAN FINANSIAL TRANSAKSI */}
        <div
          className={`p-4 rounded-xl border-2 space-y-2.5 ${
            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-gray-400">
                {isEn ? 'Bill Amount (Exact)' : 'Total Tagihan (Murni)'}:
              </span>
              <span className="font-bold font-mono text-slate-700 dark:text-gray-300">
                Rp {rawGrandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {paymentMethod === 'CASH' && cashRoundingDiff !== 0 && (
              <div className="flex items-center justify-between text-xs text-amber-500 font-semibold">
                <span>Cash Rounding (Ke Rp 100):</span>
                <span className="font-mono">
                  {cashRoundingDiff > 0 ? `+Rp ${cashRoundingDiff}` : `-Rp ${Math.abs(cashRoundingDiff)}`}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-gray-800">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {isCreditAr
                  ? 'Total Piutang Usaha (AR)'
                  : paymentMethod === 'CASH'
                  ? 'Total Bayar Tunai'
                  : 'Total Pembayaran'}
                :
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-300 dark:border-gray-800">
            <span className="font-bold text-slate-700 dark:text-gray-400">Status Pembayaran:</span>
            <span className="font-black px-2.5 py-1 rounded-lg bg-blue-500/10 text-[#0052FF] dark:text-[#58a6ff] border border-blue-500/20">
              {isCreditAr
                ? '📋 TEMPO (PIUTANG USAHA)'
                : paymentMethod === 'CASH'
                ? '💵 TUNAI / CASH'
                : paymentMethod === 'QRIS'
                ? '📱 QRIS DINAMIS'
                : '💳 KARTU DEBIT EDC'}
            </span>
          </div>

          {/* Rincian Singkat Pelanggan */}
          <div className="pt-2 border-t border-slate-300 dark:border-gray-800 text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <UserCheck className="w-4 h-4 text-[#0052FF] dark:text-[#58a6ff] shrink-0" />
              <div className="min-w-0">
                <span className="font-bold block truncate">
                  {selectedCustomer ? selectedCustomer.name : 'Pelanggan Umum / Walk-in'}
                </span>
                <span className="text-[10px] text-gray-400 block font-mono">
                  {selectedCustomer ? `${selectedCustomer.phone} • Tier: ${selectedCustomer.memberTier || 'Member'}` : 'Non-Member • Retail'}
                </span>
              </div>
            </div>

            {selectedCustomer && (
              <div className="text-right font-mono shrink-0">
                <span className="text-[10px] text-amber-500 block font-bold">
                  ★ {(selectedCustomer.points ?? 0).toLocaleString('id-ID')} Pts
                </span>
                {grandTotal > 0 && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold block">
                    Reward: +{Math.floor(grandTotal / 10000)} Pts
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ringkasan Item Keranjang */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-[#30363d] bg-slate-50/50 dark:bg-[#0d1117]/50 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-gray-400 mb-1.5">
            <span>{cart.length} SKU • {totalCartItemCount} Item Terdaftar</span>
            <span className="font-mono text-[10px] font-bold">{paymentMethod}</span>
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono text-slate-700 dark:text-gray-300 text-[11px]">
            {cart.map((item, i) => (
              <div
                key={`modal-cart-item-${item.product?.id || i}`}
                className="flex justify-between items-center"
              >
                <span className="truncate max-w-[260px] font-sans font-medium text-slate-900 dark:text-slate-100">
                  {item.product?.name}
                </span>
                <span className="shrink-0 font-bold">
                  {item.quantity}x @ Rp {(item.product?.sell_price || 0).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-300 dark:border-gray-800">
          {/* Batal */}
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-300 dark:border-gray-700 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Batal [Esc]</span>
          </button>

          {/* Tunda Pesanan */}
          {onHoldOrder && (
            <button
              type="button"
              onClick={onHoldOrder}
              className="h-11 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
            >
              <PauseCircle className="w-4 h-4" />
              <span>Tunda (Hold)</span>
            </button>
          )}

          {/* Tombol Utama Konfirmasi & Cetak Struk */}
          <button
            type="button"
            disabled={isCreditAr && !selectedCustomer}
            onClick={() => onConfirmPayment(paymentMethod)}
            className={`h-11 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-95 ${
              isCreditAr && !selectedCustomer
                ? 'opacity-50 cursor-not-allowed bg-gray-600 text-white'
                : isCreditAr
                ? 'bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-500 sm:col-span-1 col-span-2'
                : 'bg-[#0052FF] hover:bg-[#0043d1] text-white border-2 border-blue-600 sm:col-span-1 col-span-2'
            }`}
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>
              {isCreditAr
                ? !selectedCustomer
                  ? 'Pilih Member Dulu'
                  : 'Proses AR & Cetak [F10]'
                : 'Bayar & Struk [F10]'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
