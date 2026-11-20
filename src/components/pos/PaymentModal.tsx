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
  FileSpreadsheet,
  Calculator,
  Shirt,
  Clock,
} from 'lucide-react';
import { CartItem, Customer, LaundryPaymentStatus, PaymentMethod, Terminal } from '../../types';

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
  onConfirmPayment: (
    overrideMethod?: string,
    creditMeta?: { dpAmount: number; tempoDays: number; dueDate: string; remainingBalance: number }
  ) => void;
  isLight?: boolean;
  language?: string;
  activeTerminal: Terminal;
  onHoldOrder?: () => void;
  onOpenQris?: () => void;
  activeBusinessRole?: string;
  promoSavingsTotal?: number;
  isBuildingBulkMode?: boolean;
  onRequestCreditLimitIncrease?: (payload: {
    contractorName: string;
    customerId?: string;
    currentCreditLimit?: number;
    requestedCreditLimit: number;
    outstandingBalance: number;
    projectTitle: string;
    reason: string;
  }) => void;
  isLaundryMode?: boolean;
  laundryPayStatus?: LaundryPaymentStatus;
  setLaundryPayStatus?: (status: LaundryPaymentStatus) => void;
  laundryDpAmount?: number;
  setLaundryDpAmount?: (amount: number) => void;
  laundryMetaSummary?: {
    customerName?: string;
    customerPhone?: string;
    totalPieces?: number;
    estimatedDoneStr?: string;
    slaLabel?: string;
  };
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
  activeBusinessRole,
  promoSavingsTotal = 0,
  isBuildingBulkMode = false,
  onRequestCreditLimitIncrease,
  isLaundryMode = false,
  laundryPayStatus,
  setLaundryPayStatus,
  laundryDpAmount,
  setLaundryDpAmount,
  laundryMetaSummary,
}) => {
  const isEn = language === 'en';
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [tempoDays, setTempoDays] = useState(30);
  const [dpAmount, setDpAmount] = useState(0);
  const [internalLaundryPayStatus, setInternalLaundryPayStatus] = useState<LaundryPaymentStatus>('LUNAS_AWAL');
  const cashInputRef = useRef<HTMLInputElement>(null);

  const activeLaundryPayStatus: LaundryPaymentStatus =
    laundryPayStatus ?? internalLaundryPayStatus;
  const handleSelectLaundryPayStatus = (st: LaundryPaymentStatus) => {
    if (setLaundryPayStatus) setLaundryPayStatus(st);
    else setInternalLaundryPayStatus(st);
  };
  const effectiveLaundryDpRaw =
    laundryDpAmount !== undefined ? laundryDpAmount : dpAmount;
  const handleChangeLaundryDp = (val: number) => {
    const clamped = Math.max(0, Math.min(grandTotal, val || 0));
    if (setLaundryDpAmount) setLaundryDpAmount(clamped);
    setDpAmount(clamped);
  };

  const isCreditAr =
    paymentMethod === 'KREDIT / TEMPO (AR)' ||
    paymentMethod === 'KREDIT' ||
    paymentMethod === 'AR_CREDIT';

  useEffect(() => {
    if (isOpen) {
      setDpAmount(0);
    }
  }, [isOpen, grandTotal]);

  const effectiveDp = Math.max(0, Math.min(grandTotal, Number(dpAmount) || 0));
  const remainingBalance = Math.max(0, grandTotal - effectiveDp);
  const contractorLimit = Number(selectedCustomer?.credit_limit) || 50000000;
  const contractorOutstanding = Number(selectedCustomer?.outstanding_balance) || 0;
  const projectedExposure = contractorOutstanding + remainingBalance;
  const isOverLimit = Boolean(selectedCustomer && projectedExposure > contractorLimit);

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

  // Auto focus input tunai
  useEffect(() => {
    if (isOpen && paymentMethod === 'CASH') {
      setTimeout(() => {
        cashInputRef.current?.focus();
        cashInputRef.current?.select();
      }, 100);
    }
  }, [isOpen, paymentMethod]);

  const isLaundryDeferredPay =
    isLaundryMode && activeLaundryPayStatus !== 'LUNAS_AWAL';
  const activeDpNominal = isLaundryMode
    ? activeLaundryPayStatus === 'BAYAR_AMBIL'
      ? 0
      : activeLaundryPayStatus === 'DP'
      ? Math.max(0, Math.min(grandTotal, Number(effectiveLaundryDpRaw) || 0))
      : grandTotal
    : effectiveDp;
  const activeRemainingNominal = isLaundryMode
    ? Math.max(0, grandTotal - activeDpNominal)
    : remainingBalance;
  const isSubmitDisabled = isLaundryMode
    ? activeLaundryPayStatus === 'LUNAS_AWAL' &&
      paymentMethod === 'CASH' &&
      cashGiven < grandTotal
    : (paymentMethod === 'CASH' && cashGiven < grandTotal) ||
      (isCreditAr && !selectedCustomer);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        // Prevent enter if searching customer
        if (document.activeElement?.id === 'ar-customer-search-input') return;
        e.preventDefault();
        if (isLaundryMode) {
          if (isSubmitDisabled) return;
          onConfirmPayment(
            undefined,
            isLaundryDeferredPay
              ? {
                  dpAmount: activeDpNominal,
                  tempoDays: 7,
                  dueDate: dueDateStr,
                  remainingBalance: activeRemainingNominal,
                }
              : undefined
          );
          return;
        }
        if (isCreditAr && !selectedCustomer) {
          setIsCustomerPickerOpen(true);
          return;
        }
        onConfirmPayment(
          isCreditAr ? 'KREDIT / TEMPO (AR)' : undefined,
          isCreditAr
            ? { dpAmount: effectiveDp, tempoDays, dueDate: dueDateStr, remainingBalance }
            : undefined
        );
      } else if (document.activeElement?.tagName !== 'INPUT') {
        if (e.key === '1') {
          setPaymentMethod('CASH');
        } else if (e.key === '2') {
          setPaymentMethod('QRIS');
        } else if (e.key === '3') {
          setPaymentMethod('EDC_DEBIT');
        } else if (e.key === '4' && !isLaundryMode) {
          setPaymentMethod('KREDIT / TEMPO (AR)');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    isCreditAr,
    isLaundryMode,
    isLaundryDeferredPay,
    isSubmitDisabled,
    activeDpNominal,
    activeRemainingNominal,
    selectedCustomer,
    onClose,
    onConfirmPayment,
    setPaymentMethod,
    effectiveDp,
    tempoDays,
    dueDateStr,
    remainingBalance,
  ]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-payment-checkout"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`max-w-xl w-full max-h-[85vh] p-5 flex flex-col justify-between overflow-hidden rounded-xl border relative animate-in zoom-in-95 transition-all duration-200 ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-900'
            : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-white'
        }`}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base leading-6 font-medium tracking-tight uppercase">Checkout Pembayaran</h2>
          </div>
          <p className="text-xs leading-5 text-slate-400 font-mono font-normal">
            Struk: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{receiptNumber}</span>
          </p>
        </div>

        {/* GRAND TOTAL DISPLAY (COMPACT) */}
        <div className={`border rounded-xl py-2 px-3 mb-2.5 text-center transition-all ${
          isLight 
            ? 'bg-emerald-500/5 border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.15)] text-slate-900' 
            : 'bg-slate-950 border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.15)] text-white'
        }`}>
          <span className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 uppercase block">Total Tagihan</span>
          <div className="text-2xl font-mono font-semibold text-emerald-600 dark:text-emerald-400 tracking-tight">
            Rp {grandTotal.toLocaleString('id-ID')}
          </div>
          {promoSavingsTotal > 0 && (
            <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 block mt-0.5">
              Hemat Promo Terpadu: -Rp {promoSavingsTotal.toLocaleString('id-ID')}
            </span>
          )}
          {isLaundryMode && laundryMetaSummary && (
            <div className="mt-1.5 pt-1 border-t border-emerald-500/20 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[10px] font-mono text-cyan-700 dark:text-cyan-300">
              <span>
                👤 {laundryMetaSummary.customerName || selectedCustomer?.name || 'Pelanggan Laundry'}
                {laundryMetaSummary.customerPhone ? ` (${laundryMetaSummary.customerPhone})` : ''}
              </span>
              <span>👕 {laundryMetaSummary.totalPieces || 1} Pcs</span>
              {laundryMetaSummary.estimatedDoneStr && (
                <span>⏱ Est. Selesai: {laundryMetaSummary.estimatedDoneStr}</span>
              )}
            </div>
          )}
        </div>

        {/* LAUNDRY FLEXIBLE PAYMENT STATUS CARDS */}
        {isLaundryMode && (
          <div className="mb-3 space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block pl-0.5">
              Skema Pembayaran Laundry
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'LUNAS_AWAL' as LaundryPaymentStatus, title: 'Lunas di Awal', desc: 'Bayar Penuh 100%' },
                  { id: 'DP' as LaundryPaymentStatus, title: 'DP (Uang Muka)', desc: 'Catat Sisa Tagihan' },
                  { id: 'BAYAR_AMBIL' as LaundryPaymentStatus, title: 'Bayar Saat Ambil', desc: 'Rp 0 Saat Masuk' },
                ]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    handleSelectLaundryPayStatus(opt.id);
                    if (opt.id === 'DP' && activeDpNominal === 0) {
                      handleChangeLaundryDp(Math.round(grandTotal * 0.5));
                    }
                  }}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                    activeLaundryPayStatus === opt.id
                      ? 'border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-200 ring-1 ring-cyan-500/40'
                      : isLight
                      ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="text-xs font-bold leading-tight">{opt.title}</div>
                  <div className="text-[10px] opacity-80">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-hidden">
          {/* SISI KIRI: METODE BAYAR */}
          <div className="space-y-2">
            <h3 className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 uppercase pl-0.5">
              {isLaundryMode && activeLaundryPayStatus === 'DP'
                ? 'Metode Bayar DP'
                : isLaundryMode && activeLaundryPayStatus === 'BAYAR_AMBIL'
                ? 'Status Nota'
                : 'Metode'}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'CASH', label: 'Tunai', icon: Banknote, color: 'text-emerald-500', key: '1' },
                { id: 'QRIS', label: 'QRIS', icon: QrCode, color: 'text-cyan-500', key: '2' },
                { id: 'EDC_DEBIT', label: 'Debit', icon: CreditCard, color: 'text-blue-500', key: '3' },
                ...(!isLaundryMode
                  ? [{ id: 'KREDIT / TEMPO (AR)', label: 'Kredit (AR)', icon: BookOpen, color: 'text-purple-500', key: '4' }]
                  : []),
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`h-10 rounded-xl border flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                    paymentMethod === m.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : isLight
                      ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                  <span className="text-xs leading-5 font-normal">{m.label}</span>
                </button>
              ))}
            </div>
            
            {/* INFO PELANGGAN / KONTRAKTOR */}
            <div className={`p-2 rounded-xl border space-y-1.5 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <UserCheck className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span className="text-xs leading-5 font-normal truncate">
                    {selectedCustomer
                      ? `${selectedCustomer.name}${selectedCustomer.store_name ? ` (${selectedCustomer.store_name})` : ''}`
                      : isBuildingBulkMode
                      ? 'Pilih Kontraktor / Proyek...'
                      : 'Pelanggan Umum'}
                  </span>
                </div>
                {onSelectCustomer && customers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCustomerPickerOpen((prev) => !prev)}
                    className="text-[10px] px-2 py-0.5 rounded bg-cyan-600/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 cursor-pointer shrink-0"
                  >
                    {selectedCustomer ? 'Ganti' : 'Pilih'}
                  </button>
                )}
              </div>
              {isCustomerPickerOpen && onSelectCustomer && (
                <div className="pt-1 border-t border-slate-200 dark:border-slate-800 space-y-1">
                  <input
                    id="ar-customer-search-input"
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Cari nama kontraktor / member..."
                    className={`w-full px-2 py-1 rounded border text-[11px] outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                  <div className="max-h-24 overflow-y-auto space-y-0.5">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          onSelectCustomer(c);
                          setIsCustomerPickerOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between cursor-pointer ${
                          isLight ? 'hover:bg-cyan-50 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <span className="truncate">{c.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">{c.memberTier || 'Member'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SISI KANAN: INPUT / QRIS / LAUNDRY DP & BAYAR AMBIL */}
          <div className="flex flex-col justify-center min-h-0 overflow-hidden">
            {isLaundryMode && activeLaundryPayStatus === 'DP' ? (
              <div className={`p-3 rounded-xl border space-y-2.5 ${
                isLight ? 'bg-amber-50/70 border-amber-300 text-slate-900' : 'bg-amber-950/20 border-amber-500/35 text-white'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1">
                    <Shirt className="w-3.5 h-3.5" />
                    <span>Input DP (Uang Muka)</span>
                  </span>
                  <div className="flex gap-1">
                    {[0.3, 0.5, 0.7].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleChangeLaundryDp(Math.round(grandTotal * pct))}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/35 cursor-pointer"
                      >
                        {Math.round(pct * 100)}%
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min={0}
                  max={grandTotal}
                  value={activeDpNominal || ''}
                  onChange={(e) => handleChangeLaundryDp(Number(e.target.value) || 0)}
                  placeholder="Nominal DP (Rp)"
                  className={`w-full px-3 py-2 rounded-xl border text-base font-mono font-bold outline-none ${
                    isLight ? 'bg-white border-amber-300 text-slate-900' : 'bg-slate-950 border-amber-500/40 text-white'
                  }`}
                />
                <div className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <span className="text-slate-500">Sisa Tagihan Saat Ambil:</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    Rp {activeRemainingNominal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ) : isLaundryMode && activeLaundryPayStatus === 'BAYAR_AMBIL' ? (
              <div className={`p-3.5 rounded-xl border space-y-2 ${
                isLight ? 'bg-cyan-50/70 border-cyan-300 text-slate-900' : 'bg-cyan-950/20 border-cyan-500/35 text-white'
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-700 dark:text-cyan-300">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Nota Bayar Saat Pengambilan</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Order langsung dicetak dengan tag kantong cucian &amp; masuk antrean produksi. Pelanggan melunasi tagihan penuh saat mengambil pakaian.
                </p>
                <div className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs ${
                  isLight ? 'bg-white border-cyan-200' : 'bg-slate-950 border-cyan-500/30'
                }`}>
                  <span className="text-slate-500">Sisa Tagihan Dicatat:</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ) : (
              <>
                {paymentMethod === 'CASH' && (
                  <div className="space-y-2">
                    <h3 className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 uppercase pl-0.5">Nominal Diterima</h3>
                    <div className="relative">
                      <input
                        ref={cashInputRef}
                        type="number"
                        value={cashGiven || ''}
                        onChange={(e) => setCashGiven(Number(e.target.value))}
                        placeholder={grandTotal.toString()}
                        className={`w-full pl-3 pr-4 py-2 text-base font-mono font-semibold rounded-xl border outline-none transition focus:ring-1 focus:ring-cyan-500 ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900'
                            : 'bg-slate-950 border-slate-800 text-white'
                        }`}
                      />
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      {quickCashPresets.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCashGiven(val)}
                          className={`px-2 py-0.5 rounded-lg border text-xs font-mono font-normal transition cursor-pointer active:scale-[0.99] ${
                            isLight
                              ? 'bg-slate-100 border-slate-200 text-slate-700 hover:border-cyan-500'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-cyan-500'
                          }`}
                        >
                          {val === grandTotal ? 'Pas' : val.toLocaleString('id-ID')}
                        </button>
                      ))}
                    </div>

                    <div className={`px-3 py-1.5 rounded-xl border flex items-center justify-between ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}>
                      <span className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-400">Kembalian:</span>
                      <span className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        Rp {changeAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                )}
                {paymentMethod === 'QRIS' && (
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-cyan-500/30 animate-in zoom-in-95 duration-200">
                    <span className="text-[10px] leading-4 font-mono font-normal tracking-widest text-cyan-700 uppercase mb-1">Scan QRIS Dinamis</span>
                    <div className="w-28 h-28 border border-slate-200 p-1 rounded-lg">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ASPI_QRIS_DUMMY_${receiptNumber}_${grandTotal}`}
                        alt="QRIS Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-normal text-slate-500 italic">Menunggu pembayaran...</span>
                    </div>
                  </div>
                )}

                {(paymentMethod === 'EDC_DEBIT' || isCreditAr) && (
                  <div className={`h-full flex flex-col justify-center p-3 rounded-xl border border-dashed animate-in fade-in duration-300 ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
              }`}>
                {paymentMethod === 'EDC_DEBIT' ? (
                  <div className="flex flex-col items-center justify-center">
                    <CreditCard className="w-8 h-8 text-cyan-500 mb-2 animate-pulse" />
                    <h4 className="text-xs leading-5 font-medium text-center">Menunggu Mesin EDC</h4>
                  </div>
                ) : (
                  <div className="space-y-2 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-purple-500 font-semibold flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        DP &amp; Tempo Kontraktor
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Tempo: {dueDateStr}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Durasi Tempo</span>
                      <div className="grid grid-cols-4 gap-1">
                        {[7, 14, 30, 45].map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setTempoDays(days)}
                            className={`py-1 rounded text-[11px] font-mono border cursor-pointer transition ${
                              tempoDays === days
                                ? 'bg-purple-600 text-white border-purple-500'
                                : isLight
                                ? 'bg-white border-slate-300 text-slate-700'
                                : 'bg-slate-900 border-slate-700 text-slate-300'
                            }`}
                          >
                            {days} Hr
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono uppercase text-slate-400">DP Dibayar (Rp)</span>
                        <div className="flex gap-1">
                          {[0, 0.3, 0.5].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setDpAmount(Math.round(grandTotal * pct))}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 cursor-pointer"
                            >
                              {pct === 0 ? '0%' : `${pct * 100}%`}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={grandTotal}
                        value={dpAmount || ''}
                        onChange={(e) => setDpAmount(Math.max(0, Math.min(grandTotal, Number(e.target.value) || 0)))}
                        placeholder="0 (Full Tempo)"
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-semibold outline-none ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      />
                    </div>

                    <div className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-[11px] ${
                      isLight ? 'bg-purple-50 border-purple-200' : 'bg-purple-950/30 border-purple-500/30'
                    }`}>
                      <span className="text-slate-500 dark:text-slate-300">Sisa Piutang (AR):</span>
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-300">
                        Rp {remainingBalance.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {isCreditAr && !selectedCustomer && (
                      <div className="text-rose-500 text-[10px] font-normal bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20 text-center">
                        WAJIB PILIH KONTRAKTOR / MEMBER!
                      </div>
                    )}

                    {selectedCustomer && isOverLimit && onRequestCreditLimitIncrease && (
                      <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] flex items-center justify-between gap-2">
                        <span className="text-amber-600 dark:text-amber-300">
                          Plafon Rp {(contractorLimit / 1000000).toFixed(1)}jt terlewati
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onRequestCreditLimitIncrease({
                              contractorName: selectedCustomer.name,
                              customerId: selectedCustomer.id,
                              currentCreditLimit: contractorLimit,
                              requestedCreditLimit: Math.ceil(projectedExposure / 5000000) * 5000000,
                              outstandingBalance: contractorOutstanding,
                              projectTitle: selectedCustomer.store_name || 'Order Proyek Material POS',
                              reason: `Tagihan baru Rp ${remainingBalance.toLocaleString('id-ID')} (Tempo ${tempoDays} hari) melebihi plafon.`,
                            })
                          }
                          className="px-2 py-0.5 rounded bg-amber-600 text-white font-semibold cursor-pointer shrink-0"
                        >
                          Ajukan Plafon
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
              </>
            )}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className={`h-10 rounded-xl font-normal text-xs leading-5 flex items-center justify-center gap-2 border transition-all duration-200 cursor-pointer active:scale-[0.99] ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <X className="w-4 h-4" />
            <span>Batal [Esc]</span>
          </button>

          <button
            type="button"
            disabled={isSubmitDisabled}
            onClick={() => {
              if (isLaundryMode) {
                onConfirmPayment(
                  undefined,
                  isLaundryDeferredPay
                    ? {
                        dpAmount: activeDpNominal,
                        tempoDays: 7,
                        dueDate: dueDateStr,
                        remainingBalance: activeRemainingNominal,
                      }
                    : undefined
                );
                return;
              }
              onConfirmPayment(
                isCreditAr ? 'KREDIT / TEMPO (AR)' : undefined,
                isCreditAr
                  ? { dpAmount: effectiveDp, tempoDays, dueDate: dueDateStr, remainingBalance }
                  : undefined
              );
            }}
            className={`h-10 rounded-xl font-medium text-xs leading-5 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.99] shadow-md ${
              isSubmitDisabled
                ? 'opacity-30 cursor-not-allowed bg-slate-400 dark:bg-slate-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-emerald-600/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isLaundryMode && activeLaundryPayStatus === 'BAYAR_AMBIL'
                ? 'Catat Order & Cetak Tag [Enter]'
                : isLaundryMode && activeLaundryPayStatus === 'DP'
                ? 'Catat DP & Cetak Tag [Enter]'
                : 'Selesaikan Bayar [Enter]'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
