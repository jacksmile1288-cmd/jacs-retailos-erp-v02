import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { InvoiceDue } from '../../types';
import { filterArInvoicesByBusinessDomain } from '../../utils/buildingDomainIsolation';
import {
  BookOpen,
  UserCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Wallet,
  ArrowRight,
  DollarSign,
  X,
  ShieldCheck,
  Receipt,
  Layers,
  Building2,
  CreditCard,
  QrCode,
} from 'lucide-react';

interface AccountsReceivableTabProps {
  isLight?: boolean;
}

export const AccountsReceivableTab: React.FC<AccountsReceivableTabProps> = ({ isLight = false }) => {
  const { invoicesReceivable, receiveCustomerPayment, language, businessDomainConfig } = useApp();
  const isEn = language === 'en';

  const domainInvoicesReceivable = useMemo(
    () => filterArInvoicesByBusinessDomain(invoicesReceivable || [], businessDomainConfig),
    [invoicesReceivable, businessDomainConfig]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'UNPAID' | 'ALL' | 'PAID'>('UNPAID');

  // Modal State for Receiving Payment
  const [activeInvoiceToReceive, setActiveInvoiceToReceive] = useState<InvoiceDue | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<string>('');
  const [modalPaymentSource, setModalPaymentSource] = useState<'Kas Kasir' | 'Bank Operasional' | 'Bank QRIS'>('Kas Kasir');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenReceiveModal = (inv: InvoiceDue) => {
    setActiveInvoiceToReceive(inv);
    setPayAmountInput(String(inv.amount || 0));
    setModalPaymentSource('Kas Kasir');
    setPaymentNotes('');
  };

  const currentPayAmount = useMemo(() => {
    if (!activeInvoiceToReceive) return 0;
    const num = Number(payAmountInput.replace(/\D/g, '')) || 0;
    return Math.max(0, Math.min(activeInvoiceToReceive.amount, num));
  }, [activeInvoiceToReceive, payAmountInput]);

  const remainingAfterPayment = useMemo(() => {
    if (!activeInvoiceToReceive) return 0;
    return Math.max(0, activeInvoiceToReceive.amount - currentPayAmount);
  }, [activeInvoiceToReceive, currentPayAmount]);

  // Unpaid receivable invoices
  const unpaidInvoices = useMemo(() => {
    return domainInvoicesReceivable.filter(
      (inv) =>
        inv.status === 'Unpaid' ||
        inv.status === 'UNPAID' ||
        inv.status === 'Overdue' ||
        inv.status === 'OVERDUE'
    );
  }, [domainInvoicesReceivable]);

  const totalUnpaidAmount = useMemo(() => {
    return unpaidInvoices.reduce((acc, inv) => acc + inv.amount, 0);
  }, [unpaidInvoices]);

  const paidInvoices = useMemo(() => {
    return domainInvoicesReceivable.filter((inv) => inv.status === 'PAID' || inv.status === 'Paid');
  }, [domainInvoicesReceivable]);

  const totalPaidAmount = useMemo(() => {
    return paidInvoices.reduce((acc, inv) => acc + inv.amount, 0);
  }, [paidInvoices]);

  const overdueInvoices = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return domainInvoicesReceivable.filter(
      (inv) =>
        inv.status === 'Overdue' ||
        inv.status === 'OVERDUE' ||
        ((inv.status === 'Unpaid' || inv.status === 'UNPAID') && inv.due_date && inv.due_date < today)
    );
  }, [domainInvoicesReceivable]);

  // Filtered list
  const filteredInvoices = useMemo(() => {
    return domainInvoicesReceivable.filter((inv) => {
      const isPaid = inv.status === 'PAID' || inv.status === 'Paid';
      if (statusFilter === 'UNPAID' && isPaid) return false;
      if (statusFilter === 'PAID' && !isPaid) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (inv.party_name || '').toLowerCase().includes(q);
        const matchNumber = (inv.invoice_number || inv.id || '').toLowerCase().includes(q);
        return matchName || matchNumber;
      }
      return true;
    });
  }, [domainInvoicesReceivable, statusFilter, searchQuery]);

  // Handle Receive Payment Modal Submit
  const handleConfirmReceivePayment = () => {
    if (!activeInvoiceToReceive || currentPayAmount <= 0) return;
    setIsProcessing(true);

    try {
      receiveCustomerPayment(
        activeInvoiceToReceive.id,
        currentPayAmount,
        modalPaymentSource,
        paymentNotes || 'Pelunasan piutang customer POS'
      );
      setActiveInvoiceToReceive(null);
      setPaymentNotes('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding AR */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${
            unpaidInvoices.length > 0
              ? 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.22)]'
              : isLight ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] leading-4 font-mono font-normal uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Total Piutang Belum Lunas
            </span>
          </div>
          <div className="text-lg leading-7 font-mono font-semibold text-purple-600 dark:text-purple-400">
            Rp {totalUnpaidAmount.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Piutang Lewat Tempo (Overdue) */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${
            overdueInvoices.length > 0
              ? 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.22)]'
              : isLight ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] leading-4 font-mono font-normal uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Jatuh Tempo (Overdue)
            </span>
          </div>
          <div className="text-lg leading-7 font-mono font-semibold text-rose-600 dark:text-rose-400">
            Rp {overdueInvoices.reduce((a, b) => a + b.amount, 0).toLocaleString('id-ID')}
          </div>
        </div>

        {/* Total Piutang Terbayar */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${
            isLight ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] leading-4 font-mono font-normal uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Piutang Lunas (Terbayar)
            </span>
          </div>
          <div className="text-lg leading-7 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            Rp {totalPaidAmount.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Total Faktur AR */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${
            isLight ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] leading-4 font-mono font-normal uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Total Berkas Piutang (AR)
            </span>
          </div>
          <div className="text-lg leading-7 font-mono font-semibold text-slate-900 dark:text-white">
            {domainInvoicesReceivable.length}
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div
        className={`bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-sm`}
      >
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama member/pelanggan, nomor faktur AR..."
            className={`w-full pl-9 pr-4 py-2 rounded-lg border outline-none text-sm leading-5 font-normal transition shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
            }`}
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['UNPAID', 'ALL', 'PAID'] as const).map((st) => (
            <button
              key={`ar-st-${st}`}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs leading-5 font-medium transition cursor-pointer active:scale-[0.99] ${
                statusFilter === st
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : isLight
                  ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  : 'bg-slate-950 text-gray-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              {st === 'UNPAID'
                ? `Belum Lunas (${unpaidInvoices.length})`
                : st === 'PAID'
                ? `Lunas (${paidInvoices.length})`
                : `Semua (${invoicesReceivable.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE DAFTAR PIUTANG USAHA */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
          isLight ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
        }`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-base leading-6 font-medium text-slate-900 dark:text-white">
              Buku Pembantu Piutang Usaha (Accounts Receivable Ledger)
            </h3>
          </div>
          <span className="text-[11px] leading-4 font-mono font-normal text-cyan-600 dark:text-cyan-400">
            Akun 1-10301
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr
                className={`border-b font-mono font-normal uppercase text-[11px] leading-4 tracking-widest ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-[#0d1117] border-[#30363d] text-gray-300'
                }`}
              >
                <th className="py-3 px-3.5 w-32">No. Faktur AR</th>
                <th className="py-3 px-3.5">Pelanggan / Member</th>
                <th className="py-3 px-3.5 w-32">Jatuh Tempo</th>
                <th className="py-3 px-3.5 text-right font-mono w-36">Nominal Piutang</th>
                <th className="py-3 px-3.5 w-28 text-center">Status</th>
                <th className="py-3 px-3.5 text-center w-52">Aksi / Informasi Pelunasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800/80 font-normal">
              {filteredInvoices.map((inv) => {
                const isPaid = inv.status === 'PAID' || inv.status === 'Paid';
                const today = new Date().toISOString().slice(0, 10);
                const isOverdue = !isPaid && inv.due_date && inv.due_date < today;

                return (
                  <tr
                    key={`ar-inv-${inv.id}`}
                    className={`hover:bg-slate-50 dark:hover:bg-[#21262d]/50 transition-colors ${
                      isLight ? 'text-slate-800' : 'text-slate-200'
                    }`}
                  >
                    {/* No. Faktur */}
                    <td className="py-3 px-3.5">
                      <span className="font-mono text-xs leading-5 text-cyan-600 dark:text-cyan-400 font-normal block">
                        {inv.invoice_number || inv.id}
                      </span>
                    </td>

                    {/* Pelanggan */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-cyan-500 shrink-0" />
                        <div>
                          <span className="text-sm leading-5 font-normal text-slate-900 dark:text-white block">
                            {inv.party_name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Jatuh Tempo & Aging */}
                    <td className="py-3 px-3.5">
                      <div className="flex flex-col text-xs leading-5 font-mono font-normal">
                        <span className="flex items-center gap-1.5">
                           <Calendar className="w-3.5 h-3.5 text-gray-400" />
                           {inv.due_date || '-'}
                        </span>
                        {!isPaid && inv.due_date && (
                          <span className={`text-[10px] font-mono font-normal mt-0.5 ${
                            isOverdue ? 'text-rose-500 font-medium' : 'text-slate-500'
                          }`}>
                            Aging: {(() => {
                               const todayDate = new Date();
                               const due = new Date(inv.due_date);
                               const diffTime = Math.abs(todayDate.getTime() - due.getTime());
                               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                               if (diffDays <= 30) return '1-30 Hari';
                               if (diffDays <= 60) return '31-60 Hari';
                               return '>90 Hari';
                            })()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Nominal */}
                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-lg leading-7 text-slate-900 dark:text-white">
                      Rp {inv.amount.toLocaleString('id-ID')}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3.5 text-center">
                      <span
                        className={`text-[11px] leading-4 font-mono font-normal px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          isPaid
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : isOverdue
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {isPaid ? 'Lunas (PAID)' : isOverdue ? 'Jatuh Tempo' : 'Belum Bayar'}
                      </span>
                    </td>

                    {/* Aksi: Terima Pembayaran Piutang */}
                    <td className="py-3 px-3.5 text-center">
                      {!isPaid ? (
                        <button
                          type="button"
                          onClick={() => handleOpenReceiveModal(inv)}
                          className="px-3 py-1.5 rounded-xl font-medium text-xs leading-5 bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer active:scale-[0.99]"
                          title="Terima Pelunasan / Cicilan Piutang"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Terima Pelunasan / Cicilan</span>
                        </button>
                      ) : (
                        <div className="text-[11px] leading-4 text-gray-400 font-mono font-normal text-center">
                          <span className="text-emerald-600 dark:text-emerald-400 block">
                            ✓ Lunas via {inv.paymentSource || 'Kas/Bank'}
                          </span>
                          {inv.paid_date && <span>Tgl: {inv.paid_date}</span>}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm leading-5 font-normal text-slate-500 dark:text-gray-400">
                    Tidak ada faktur piutang yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TERIMA PEMBAYARAN PIUTANG */}
      {activeInvoiceToReceive && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setActiveInvoiceToReceive(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg rounded-2xl p-5 sm:p-6 border relative animate-in zoom-in-95 space-y-4 transition-all ${
              isLight
                ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-900'
                : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-white'
            }`}
          >
            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={() => setActiveInvoiceToReceive(null)}
              className="absolute top-4 right-4 text-white bg-slate-800 hover:bg-rose-600 border border-slate-600 p-2 rounded-xl transition cursor-pointer active:scale-[0.99]"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Modal */}
            <div className="flex items-center gap-3 pr-10">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base leading-6 font-medium tracking-tight text-slate-900 dark:text-white">
                  Penerimaan Pembayaran Piutang Usaha
                </h3>
                <p className="text-xs leading-5 font-normal text-slate-600 dark:text-gray-400">
                  Faktur #{activeInvoiceToReceive.invoice_number || activeInvoiceToReceive.id} • {activeInvoiceToReceive.party_name}
                </p>
              </div>
            </div>

            {/* Detail Nominal Tagihan */}
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                isLight ? 'bg-cyan-50/40 border-cyan-200' : 'bg-cyan-950/20 border-cyan-900/50'
              }`}
            >
              <div className="flex items-center justify-between text-sm leading-5">
                <span className="font-normal text-slate-600 dark:text-gray-400">Total Piutang Berjalan:</span>
                <span className="font-mono text-lg leading-7 font-semibold text-cyan-600 dark:text-cyan-400">
                  Rp {activeInvoiceToReceive.amount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs leading-5 text-slate-500 dark:text-gray-400 pt-1 border-t border-cyan-200/60 dark:border-cyan-900/40">
                <span>Pelanggan: {activeInvoiceToReceive.party_name}</span>
                <span>Jatuh Tempo: {activeInvoiceToReceive.due_date || '-'}</span>
              </div>
            </div>

            {/* Input Nominal Bayar / Cicilan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-slate-700 dark:text-gray-300">
                  Nominal Diterima (Cicilan / Pelunasan):
                </label>
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                  Rp {currentPayAmount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-400">
                  Rp
                </span>
                <input
                  type="text"
                  value={payAmountInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setPayAmountInput(raw);
                  }}
                  placeholder="0"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm font-mono font-semibold border transition focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              {/* Quick Presets (25%, 50%, 100%) */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPayAmountInput(String(Math.round(activeInvoiceToReceive.amount * 0.25)))}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-300 dark:border-gray-700 hover:bg-cyan-500/10 hover:border-cyan-500/40 text-slate-700 dark:text-gray-300 transition cursor-pointer"
                >
                  25% (Cicilan)
                </button>
                <button
                  type="button"
                  onClick={() => setPayAmountInput(String(Math.round(activeInvoiceToReceive.amount * 0.5)))}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-300 dark:border-gray-700 hover:bg-cyan-500/10 hover:border-cyan-500/40 text-slate-700 dark:text-gray-300 transition cursor-pointer"
                >
                  50% (Separuh)
                </button>
                <button
                  type="button"
                  onClick={() => setPayAmountInput(String(activeInvoiceToReceive.amount))}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-600/15 border border-cyan-500/40 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-600/25 transition cursor-pointer"
                >
                  100% (Pelunasan)
                </button>
              </div>

              {/* Kalkulasi Sisa Piutang Setelah Bayar */}
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  remainingAfterPayment === 0
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                }`}
              >
                <span>Sisa Piutang Setelah Bayar:</span>
                <span className="font-mono font-semibold">
                  Rp {remainingAfterPayment.toLocaleString('id-ID')}{' '}
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ml-1 bg-white/20 dark:bg-black/20">
                    {remainingAfterPayment === 0 ? '✓ Lunas' : 'Cicilan'}
                  </span>
                </span>
              </div>
            </div>

            {/* Pilihan Sumber Rekening Penerima (Kas / Bank / QRIS) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-gray-300">
                Pilih Rekening Tujuan Penerimaan Dana:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* 1. Kas Kasir (1-10001) */}
                <button
                  type="button"
                  onClick={() => setModalPaymentSource('Kas Kasir')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center active:scale-[0.99] ${
                    modalPaymentSource === 'Kas Kasir'
                      ? 'border-cyan-600 bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-semibold shadow-sm'
                      : isLight
                      ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-normal'
                      : 'border-[#30363d] bg-[#0d1117] text-gray-300 hover:bg-[#21262d] font-normal'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium">Tunai Kas</span>
                  <span className="text-[10px] text-gray-400 font-mono">1-10001 (Kasir)</span>
                </button>

                {/* 2. Bank Operasional (1-10002) */}
                <button
                  type="button"
                  onClick={() => setModalPaymentSource('Bank Operasional')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center active:scale-[0.99] ${
                    modalPaymentSource === 'Bank Operasional'
                      ? 'border-cyan-600 bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-semibold shadow-sm'
                      : isLight
                      ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-normal'
                      : 'border-[#30363d] bg-[#0d1117] text-gray-300 hover:bg-[#21262d] font-normal'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-medium">Transfer Bank</span>
                  <span className="text-[10px] text-gray-400 font-mono">1-10002 (Bank)</span>
                </button>

                {/* 3. Bank QRIS (1-10003) */}
                <button
                  type="button"
                  onClick={() => setModalPaymentSource('Bank QRIS')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center active:scale-[0.99] ${
                    modalPaymentSource === 'Bank QRIS'
                      ? 'border-cyan-600 bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-semibold shadow-sm'
                      : isLight
                      ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-normal'
                      : 'border-[#30363d] bg-[#0d1117] text-gray-300 hover:bg-[#21262d] font-normal'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-medium">Bank QRIS</span>
                  <span className="text-[10px] text-gray-400 font-mono">1-10003 (QRIS)</span>
                </button>
              </div>
            </div>

            {/* Catatan / Keterangan Penerimaan */}
            <div>
              <label className="block text-xs font-normal text-slate-700 dark:text-gray-300 mb-1">
                Catatan / Bukti Referensi:
              </label>
              <input
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Contoh: Transfer Bank BCA ref 983210 atau Setor Tunai Kasir"
                className={`w-full px-3 py-2 rounded-xl text-sm leading-5 font-normal border transition focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-[#0d1117] border-[#30363d] text-white'
                }`}
              />
            </div>

            {/* Pratinjau Jurnal Otomatis */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#30363d] bg-slate-50/80 dark:bg-[#0d1117] text-[11px] leading-4 space-y-1.5 font-normal">
              <span className="text-slate-800 dark:text-slate-200 block font-medium">
                📋 Jurnal Akuntansi Otomatis Diterbitkan:
              </span>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] leading-4">
                <div className="p-2 rounded bg-white dark:bg-black/30 border border-slate-200 dark:border-gray-800">
                  <span className="text-blue-600 dark:text-blue-400 block font-normal">
                    [DEBIT] {modalPaymentSource === 'Bank Operasional' ? '1-10002 Bank Operasional' : modalPaymentSource === 'Bank QRIS' ? '1-10003 Bank QRIS' : '1-10001 Kas Kasir'}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Rp {currentPayAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-2 rounded bg-white dark:bg-black/30 border border-slate-200 dark:border-gray-800">
                  <span className="text-purple-600 dark:text-purple-400 block font-normal">
                    [KREDIT] 1-10105 Piutang Usaha
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Rp {currentPayAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Aksi Modal */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setActiveInvoiceToReceive(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-300 dark:border-gray-700 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 transition active:scale-[0.99]"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing || currentPayAmount <= 0}
                onClick={handleConfirmReceivePayment}
                className={`px-5 py-2 rounded-xl text-xs leading-5 font-medium transition cursor-pointer flex items-center gap-1.5 active:scale-[0.99] ${
                  isProcessing || currentPayAmount <= 0
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/30'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? 'Memproses...'
                    : `Terima & Catat Pelunasan [Rp ${currentPayAmount.toLocaleString('id-ID')}]`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
