import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { InvoiceDue } from '../../types';
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
} from 'lucide-react';

interface AccountsReceivableTabProps {
  isLight?: boolean;
}

export const AccountsReceivableTab: React.FC<AccountsReceivableTabProps> = ({ isLight = false }) => {
  const { invoicesReceivable, finance, receiveCustomerPayment, language } = useApp();
  const isEn = language === 'en';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'UNPAID' | 'ALL' | 'PAID'>('UNPAID');

  // Modal State for Receiving Payment
  const [activeInvoiceToReceive, setActiveInvoiceToReceive] = useState<InvoiceDue | null>(null);
  const [modalPaymentSource, setModalPaymentSource] = useState<'Kas Utama' | 'Kas Kasir' | 'Bank Operasional'>('Kas Kasir');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Unpaid receivable invoices
  const unpaidInvoices = useMemo(() => {
    return invoicesReceivable.filter(
      (inv) => inv.status === 'Unpaid' || inv.status === 'Overdue'
    );
  }, [invoicesReceivable]);

  const totalUnpaidAmount = useMemo(() => {
    return unpaidInvoices.reduce((acc, inv) => acc + inv.amount, 0);
  }, [unpaidInvoices]);

  const paidInvoices = useMemo(() => {
    return invoicesReceivable.filter((inv) => inv.status === 'PAID' || inv.status === 'Paid');
  }, [invoicesReceivable]);

  const totalPaidAmount = useMemo(() => {
    return paidInvoices.reduce((acc, inv) => acc + inv.amount, 0);
  }, [paidInvoices]);

  const overdueInvoices = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return invoicesReceivable.filter(
      (inv) =>
        (inv.status === 'Overdue' || (inv.status === 'Unpaid' && inv.due_date && inv.due_date < today))
    );
  }, [invoicesReceivable]);

  // Filtered list
  const filteredInvoices = useMemo(() => {
    return invoicesReceivable.filter((inv) => {
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
  }, [invoicesReceivable, statusFilter, searchQuery]);

  // Handle Receive Payment Modal Submit
  const handleConfirmReceivePayment = () => {
    if (!activeInvoiceToReceive) return;
    setIsProcessing(true);

    try {
      receiveCustomerPayment(
        activeInvoiceToReceive.id,
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
    <div className="space-y-6">
      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding AR */}
        <div
          className={`p-4 rounded-2xl border shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Total Piutang Belum Lunas
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
            Rp {totalUnpaidAmount.toLocaleString('id-ID')}
          </div>
          <div className="mt-1">
            <span className="bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs px-2 py-0.5 rounded inline-flex items-center gap-1 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
              {unpaidInvoices.length} Faktur Menunggu Pembayaran
            </span>
          </div>
        </div>

        {/* Piutang Lewat Tempo (Overdue) */}
        <div
          className={`p-4 rounded-2xl border shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Jatuh Tempo (Overdue)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
            Rp {overdueInvoices.reduce((a, b) => a + b.amount, 0).toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 block">
            {overdueInvoices.length} Tagihan Melewati Batas Tempo
          </span>
        </div>

        {/* Total Piutang Terbayar */}
        <div
          className={`p-4 rounded-2xl border shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Piutang Lunas (Terbayar)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            Rp {totalPaidAmount.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 block">
            {paidInvoices.length} Faktur Berhasil Dilunasi
          </span>
        </div>

        {/* Total Faktur AR */}
        <div
          className={`p-4 rounded-2xl border shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Total Berkas Piutang (AR)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white flex items-center gap-2">
            <span>{invoicesReceivable.length}</span>
            <span className="bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs px-2 py-0.5 rounded dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
              {invoicesReceivable.length} Faktur
            </span>
          </div>
          <div className="mt-1">
            <span className="font-bold text-xs px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 inline-block">
              Akun Buku Besar: [1-10301] Piutang Usaha
            </span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama member/pelanggan, nomor faktur AR..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900'
                : 'bg-[#161b22] border-[#30363d] text-white'
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-sm'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-[#21262d] text-gray-300 hover:bg-[#30363d]'
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
        className={`rounded-2xl border overflow-hidden shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              Buku Pembantu Piutang Usaha (Accounts Receivable Ledger)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
            Akun 1-10301
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className={`border-b font-black uppercase text-[11px] tracking-wider ${
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
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800/80 font-medium">
              {filteredInvoices.map((inv) => {
                const isPaid = inv.status === 'PAID' || inv.status === 'Paid';
                const today = new Date().toISOString().slice(0, 10);
                const isOverdue = !isPaid && inv.due_date && inv.due_date < today;

                return (
                  <tr
                    key={`ar-inv-${inv.id}`}
                    className={`hover:bg-slate-50 dark:hover:bg-[#21262d]/50 transition ${
                      isLight ? 'text-slate-800' : 'text-slate-200'
                    }`}
                  >
                    {/* No. Faktur */}
                    <td className="py-3 px-3.5">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400 block">
                        {inv.invoice_number || inv.id}
                      </span>
                      {inv.journal_ref && (
                        <span className="text-[10px] text-gray-400 font-mono block">
                          {inv.journal_ref}
                        </span>
                      )}
                    </td>

                    {/* Pelanggan */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-purple-500 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {inv.party_name}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {inv.terms || 'Tempo 30 Hari'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Jatuh Tempo */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{inv.due_date || '-'}</span>
                      </div>
                      {isOverdue && (
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-tight block">
                          Lewat Jatuh Tempo
                        </span>
                      )}
                    </td>

                    {/* Nominal */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-sm text-slate-900 dark:text-white">
                      Rp {inv.amount.toLocaleString('id-ID')}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3.5 text-center">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
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
                          onClick={() => setActiveInvoiceToReceive(inv)}
                          className="px-3 py-1.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer active:scale-95"
                          title="Terima Pembayaran Piutang ke Kas/Bank"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Terima Pembayaran Piutang</span>
                        </button>
                      ) : (
                        <div className="text-[10px] text-gray-400 font-mono text-center">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold block">
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
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-500 dark:text-gray-400">
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
            className={`w-full max-w-lg rounded-2xl p-5 sm:p-6 border shadow-[0_20px_60px_rgba(0,0,0,0.9)] relative animate-in zoom-in-95 space-y-4 ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 shadow-slate-300'
                : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={() => setActiveInvoiceToReceive(null)}
              className="absolute top-4 right-4 text-white bg-slate-800 hover:bg-rose-600 border border-slate-600 p-2 rounded-xl transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Modal */}
            <div className="flex items-center gap-3 pr-10">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                  Penerimaan Pembayaran Piutang Usaha
                </h3>
                <p className="text-xs text-slate-600 dark:text-gray-400">
                  Faktur #{activeInvoiceToReceive.invoice_number || activeInvoiceToReceive.id} • {activeInvoiceToReceive.party_name}
                </p>
              </div>
            </div>

            {/* Detail Nominal Tagihan */}
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                isLight ? 'bg-purple-50/50 border-purple-200' : 'border-2 bg-purple-950/20 border-purple-900/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 dark:text-gray-400">Total Piutang Dilunasi:</span>
                <span className="font-mono text-xl font-black text-purple-600 dark:text-purple-400">
                  Rp {activeInvoiceToReceive.amount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-gray-400 pt-1 border-t border-purple-200/60 dark:border-purple-900/40">
                <span>Pelanggan: <strong>{activeInvoiceToReceive.party_name}</strong></span>
                <span>Jatuh Tempo: <strong>{activeInvoiceToReceive.due_date || '-'}</strong></span>
              </div>
            </div>

            {/* Pilihan Sumber Rekening Penerima (Kas / Bank) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300">
                Pilih Rekening Tujuan Penerimaan Dana:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 1. Kas Kasir (1-10001) */}
                <button
                  type="button"
                  onClick={() => setModalPaymentSource('Kas Kasir')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                    modalPaymentSource === 'Kas Kasir'
                      ? 'border-purple-600 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black shadow-sm'
                      : isLight
                      ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold'
                      : 'border-[#30363d] bg-[#0d1117] text-gray-300 hover:bg-[#21262d] font-semibold'
                  }`}
                >
                  <Wallet className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-bold">Kas Kasir</span>
                  <span className="text-[10px] text-gray-400 font-mono">1-10001 (Tunai)</span>
                </button>

                {/* 2. Kas Utama / Brankas (1-10000) */}
                <button
                  type="button"
                  onClick={() => setModalPaymentSource('Kas Utama')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                    modalPaymentSource === 'Kas Utama'
                      ? 'border-purple-600 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black shadow-sm'
                      : isLight
                      ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold'
                      : 'border-[#30363d] bg-[#0d1117] text-gray-300 hover:bg-[#21262d] font-semibold'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-bold">Kas Utama</span>
                  <span className="text-[10px] text-gray-400 font-mono">1-10000 (Brankas)</span>
                </button>

                {/* 3. Bank Operasional (1-10002) */}
                <button
                  type="button"
                  onClick={() => setModalPaymentSource('Bank Operasional')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                    modalPaymentSource === 'Bank Operasional'
                      ? 'border-purple-600 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black shadow-sm'
                      : isLight
                      ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold'
                      : 'border-[#30363d] bg-[#0d1117] text-gray-300 hover:bg-[#21262d] font-semibold'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-indigo-500" />
                  <span className="text-xs font-bold">Bank Operasional</span>
                  <span className="text-[10px] text-gray-400 font-mono">1-10002 (Transfer)</span>
                </button>
              </div>
            </div>

            {/* Catatan / Keterangan Penerimaan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">
                Catatan / Bukti Referensi:
              </label>
              <input
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Contoh: Transfer Bank BCA ref 983210 atau Setor Tunai Kasir"
                className={`w-full px-3 py-2 rounded-xl text-xs border font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-[#0d1117] border-[#30363d] text-white'
                }`}
              />
            </div>

            {/* Pratinjau Jurnal Otomatis */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#30363d] bg-slate-50/80 dark:bg-[#0d1117] text-[11px] space-y-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                📋 Jurnal Akuntansi Otomatis Diterbitkan:
              </span>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                <div className="p-1.5 rounded bg-white dark:bg-black/30 border border-slate-200 dark:border-gray-800">
                  <span className="text-blue-600 dark:text-blue-400 font-bold block">
                    [DEBIT] {modalPaymentSource === 'Bank Operasional' ? '1-10002 Bank Operasional' : modalPaymentSource === 'Kas Utama' ? '1-10000 Kas Utama' : '1-10001 Kas Kasir'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    Rp {activeInvoiceToReceive.amount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-black/30 border border-slate-200 dark:border-gray-800">
                  <span className="text-purple-600 dark:text-purple-400 font-bold block">
                    [KREDIT] 1-10301 Piutang Usaha
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    Rp {activeInvoiceToReceive.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Aksi Modal */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setActiveInvoiceToReceive(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-gray-700 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmReceivePayment}
                className="px-5 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isProcessing ? 'Memproses...' : 'Terima & Catat Pelunasan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
