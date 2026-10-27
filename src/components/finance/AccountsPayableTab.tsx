import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { InvoiceDue } from '../../types';
import {
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Wallet,
  ArrowRight,
  FileText,
  DollarSign,
  X,
  ShieldCheck,
  Receipt,
  Layers,
} from 'lucide-react';

interface AccountsPayableTabProps {
  isLight?: boolean;
}

export const AccountsPayableTab: React.FC<AccountsPayableTabProps> = ({ isLight = false }) => {
  const { invoicesDue, finance, payVendorInvoice } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'UNPAID' | 'ALL' | 'PAID'>('UNPAID');
  const [selectedPaymentSourceMap, setSelectedPaymentSourceMap] = useState<Record<string, string>>({});

  // Modal State for Payment
  const [activeInvoiceToPay, setActiveInvoiceToPay] = useState<InvoiceDue | null>(null);
  const [modalPaymentSource, setModalPaymentSource] = useState<'Kas Utama' | 'Bank Operasional'>('Bank Operasional');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate Cash & Bank Balances
  const cashDrawerBalance = useMemo(() => {
    return finance
      .filter(
        (f) =>
          f.account_target === 'Kas Kasir / Laci' ||
          f.account_target?.includes('Kas') ||
          (f.payment_method === 'CASH' && f.type !== 'HPP / BEBAN POKOK') ||
          (f.payment_method?.includes('Kas') && f.type !== 'HPP / BEBAN POKOK')
      )
      .reduce((acc, f) => {
        if (f.type === 'INCOME' || f.type === 'IN / PENDAPATAN') return acc + f.amount;
        if (f.type === 'EXPENSE') return acc - f.amount;
        return acc;
      }, 0);
  }, [finance]);

  const qrisBankBalance = useMemo(() => {
    return finance
      .filter(
        (f) =>
          f.account_target === 'Bank QRIS / Settlement' ||
          f.account_target?.includes('Bank') ||
          ((f.payment_method === 'QRIS' ||
            f.payment_method === 'EDC_DEBIT' ||
            f.payment_method === 'EDC_CREDIT' ||
            f.payment_method === 'TRANSFER' ||
            f.payment_method?.includes('Bank')) &&
            f.type !== 'HPP / BEBAN POKOK')
      )
      .reduce((acc, f) => {
        if (f.type === 'INCOME' || f.type === 'IN / PENDAPATAN') return acc + f.amount;
        if (f.type === 'EXPENSE') return acc - f.amount;
        return acc;
      }, 0);
  }, [finance]);

  // Unpaid invoices
  const unpaidInvoices = useMemo(() => {
    return invoicesDue.filter(
      (inv) => inv.status === 'Unpaid' || inv.status === 'Overdue'
    );
  }, [invoicesDue]);

  const totalUnpaidAmount = useMemo(() => {
    return unpaidInvoices.reduce((acc, inv) => acc + inv.amount, 0);
  }, [unpaidInvoices]);

  const paidInvoices = useMemo(() => {
    return invoicesDue.filter((inv) => inv.status === 'PAID' || inv.status === 'Paid');
  }, [invoicesDue]);

  // Filtered list
  const filteredInvoices = useMemo(() => {
    return invoicesDue.filter((inv) => {
      const isPaid = inv.status === 'PAID' || inv.status === 'Paid';
      if (statusFilter === 'UNPAID' && isPaid) return false;
      if (statusFilter === 'PAID' && !isPaid) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (inv.party_name || inv.vendor || '').toLowerCase().includes(q);
        const matchNo = (inv.invoice_number || '').toLowerCase().includes(q);
        const matchPo = (inv.po_number || '').toLowerCase().includes(q);
        const matchId = (inv.id || '').toLowerCase().includes(q);
        if (!matchName && !matchNo && !matchPo && !matchId) return false;
      }

      return true;
    });
  }, [invoicesDue, statusFilter, searchQuery]);

  const handleOpenPayModal = (inv: InvoiceDue) => {
    const defaultSource = (selectedPaymentSourceMap[inv.id] as any) || 'Bank Operasional';
    setModalPaymentSource(defaultSource);
    setPaymentNotes('');
    setActiveInvoiceToPay(inv);
  };

  const handleExecutePayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeInvoiceToPay) return;

    setIsProcessing(true);
    const res = payVendorInvoice(activeInvoiceToPay.id, modalPaymentSource, paymentNotes);
    setIsProcessing(false);

    if (res.success) {
      setActiveInvoiceToPay(null);
    }
  };

  const handleDirectPay = (inv: InvoiceDue, source: 'Kas Utama' | 'Bank Operasional') => {
    payVendorInvoice(inv.id, source);
  };

  return (
    <div id="accounts-payable-tab" className="space-y-5">
      {/* Top Banner & Liquid Balance Overview */}
      <div
        className={`p-4 rounded-2xl border transition duration-200 ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-[#30363d]/40 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-black text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Pelunasan Hutang Dagang & Tagihan Supplier (AP Settlement)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Pengelolaan faktur tagihan vendor terverifikasi dari modul Purchasing/Goods Receipt & BPJS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
              isLight
                ? 'bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs'
                : 'border border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{unpaidInvoices.length} Tagihan Belum Lunas</span>
            </div>
          </div>
        </div>

        {/* 3 Liquidity & Liability Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Total AP Belum Lunas */}
          <div
            className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-rose-50/60 border-rose-200' : 'bg-rose-950/20 border-rose-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                Total Hutang Belum Bayar
              </span>
              <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
                isLight
                  ? 'bg-amber-100 border-amber-300 text-amber-950 font-bold text-xs'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {unpaidInvoices.length} Faktur
              </span>
            </div>
            <div className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 mt-1.5">
              Rp {totalUnpaidAmount.toLocaleString('id-ID')}
            </div>
            <div className="mt-1">
              <span className="font-bold text-xs px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 inline-block">
                Akun Hutang Dagang (2-10101)
              </span>
            </div>
          </div>

          {/* Card 2: Saldo Kas Utama (1-10000) */}
          <div
            className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-white border-slate-300 shadow-xs' : 'bg-[#0d1117] border-[#30363d]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                <span>Kas Utama (1-10000)</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Likuid
              </span>
            </div>
            <div className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1.5">
              Rp {cashDrawerBalance.toLocaleString('id-ID')}
            </div>
            <div className="mt-1">
              <span className="font-bold text-xs px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 inline-block">
                Kas fisik / brankas operasional
              </span>
            </div>
          </div>

          {/* Card 3: Saldo Bank Operasional (1-10002) */}
          <div
            className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-white border-slate-300 shadow-xs' : 'bg-[#0d1117] border-[#30363d]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wide flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span>Bank Operasional (1-10002)</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                Transfer
              </span>
            </div>
            <div className="text-lg font-black font-mono text-sky-700 dark:text-sky-400 mt-1.5">
              Rp {qrisBankBalance.toLocaleString('id-ID')}
            </div>
            <div className="mt-1">
              <span className="font-bold text-xs px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 inline-block">
                Rekening giro / settlement operasional
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            id="search-ap-invoices"
            placeholder="Cari Nama Supplier, No. Invoice, atau No. PO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-xl border outline-none text-xs transition ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF]'
                : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl bg-slate-800/80 p-0.5 border border-slate-700">
            <button
              type="button"
              id="filter-ap-unpaid"
              onClick={() => setStatusFilter('UNPAID')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'UNPAID'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Belum Lunas ({unpaidInvoices.length})</span>
            </button>
            <button
              type="button"
              id="filter-ap-paid"
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'PAID'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Lunas ({paidInvoices.length})</span>
            </button>
            <button
              type="button"
              id="filter-ap-all"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'ALL'
                  ? 'bg-[#0052FF] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Semua ({invoicesDue.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Daftar Tagihan Supplier Table */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-lg transition duration-200 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`font-semibold border-b uppercase tracking-wider text-[11px] ${
                isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
              }`}
            >
              <tr>
                <th className="py-3 px-4">No. Invoice & Ref</th>
                <th className="py-3 px-4">Supplier / Rekanan</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4 text-right">Nominal Tagihan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Sumber Rekening Dana</th>
                <th className="py-3 px-4 text-center">Aksi Pelunasan</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isLight ? 'divide-slate-200 text-slate-800' : 'divide-[#30363d] text-gray-300'
              }`}
            >
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500 font-medium">
                    Tidak ada tagihan supplier yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => {
                  const isPaid = inv.status === 'PAID' || inv.status === 'Paid';
                  const currentSource = selectedPaymentSourceMap[inv.id] || 'Bank Operasional';

                  return (
                    <tr
                      key={`${inv.id || 'AP'}-${idx}`}
                      className={`transition ${
                        isPaid
                          ? isLight
                            ? 'bg-slate-50/50'
                            : 'bg-black/20 text-gray-400'
                          : isLight
                          ? 'hover:bg-slate-50'
                          : 'hover:bg-[#21262d]/50'
                      }`}
                    >
                      {/* Invoice ID & PO */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>
                            {inv.invoice_number}
                          </span>
                          {inv.po_number && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isLight
                                  ? 'bg-sky-50 text-sky-700 border-sky-300'
                                  : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                              }`}
                            >
                              PO: {inv.po_number}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2">
                          <span>Ref: {inv.id}</span>
                          {inv.created_at && (
                            <span>• Dibuat: {inv.created_at.slice(0, 10)}</span>
                          )}
                        </div>
                      </td>

                      {/* Vendor / Rekanan */}
                      <td className="py-3 px-4">
                        <div className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {inv.party_name || inv.vendor}
                        </div>
                        {inv.terms && (
                          <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                            Termin: {inv.terms}
                          </div>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4 font-mono">
                        <div className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700 font-semibold' : 'text-gray-300'}`}>
                          <Calendar className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`} />
                          <span>{inv.due_date || '-'}</span>
                        </div>
                      </td>

                      {/* Nominal Tagihan */}
                      <td className="py-3 px-4 text-right font-mono font-black text-sm">
                        <span
                          className={
                            isPaid
                              ? isLight
                                ? 'text-slate-400 line-through'
                                : 'text-gray-500 line-through'
                              : isLight
                              ? 'text-rose-600'
                              : 'text-rose-400'
                          }
                        >
                          Rp {inv.amount.toLocaleString('id-ID')}
                        </span>
                      </td>

                      {/* Status Tagihan */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isPaid ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>PAID</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>UNPAID</span>
                          </span>
                        )}
                      </td>

                      {/* Pilihan Sumber Rekening Dana */}
                      <td className="py-3 px-4">
                        {!isPaid ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              id={`select-source-${inv.id}`}
                              value={currentSource}
                              onChange={(e) =>
                                setSelectedPaymentSourceMap((prev) => ({
                                  ...prev,
                                  [inv.id]: e.target.value,
                                }))
                              }
                              className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-semibold outline-none transition cursor-pointer ${
                                isLight
                                  ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-[#0052FF]'
                                  : 'bg-[#0d1117] border-[#30363d] text-gray-200 focus:border-[#0052FF]'
                              }`}
                            >
                              <option value="Bank Operasional">
                                Bank Operasional (1-10002)
                              </option>
                              <option value="Kas Utama">
                                Kas Utama (1-10000)
                              </option>
                            </select>
                          </div>
                        ) : (
                          <div className="text-[11px] font-mono text-gray-400">
                            <div>Via: {inv.paymentSource || 'Bank Operasional'}</div>
                            {inv.paidAt && (
                              <div className="text-[10px] text-gray-500">
                                {inv.paidAt.slice(0, 16)}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Tombol Bayar Tagihan Vendor */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {!isPaid ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              id={`btn-pay-vendor-invoice-${inv.id}`}
                              onClick={() => handleOpenPayModal(inv)}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(16,185,129,0.35)] cursor-pointer active:scale-95"
                              title="Bayar tagihan vendor & catat jurnal pelunasan AP"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Bayar Tagihan Vendor</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="text-[10px] font-mono text-emerald-400 font-bold">
                              {inv.journal_ref || 'FIN-AP-PAY'}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PELUNASAN HUTANG DAGANG (AP SETTLEMENT MODAL) */}
      {activeInvoiceToPay && (
        <div
          id="modal-pay-vendor-invoice"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <div
            className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl relative border my-8 flex flex-col ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800'
                : 'bg-[#161b22] border-[#30363d] text-gray-200'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-[#30363d] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Pelunasan Tagihan Hutang Vendor (AP)
                  </h3>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {activeInvoiceToPay.invoice_number} • {activeInvoiceToPay.party_name || activeInvoiceToPay.vendor}
                  </div>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-pay-modal"
                onClick={() => setActiveInvoiceToPay(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleExecutePayment} className="pt-4 space-y-4 text-xs">
              {/* Detail Tagihan Box */}
              <div
                className={`p-3.5 rounded-xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={isLight ? 'text-slate-600' : 'text-gray-400'}>Supplier / Vendor:</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {activeInvoiceToPay.party_name || activeInvoiceToPay.vendor}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isLight ? 'text-slate-600' : 'text-gray-400'}>Nomor Invoice:</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>
                    {activeInvoiceToPay.invoice_number}
                  </span>
                </div>
                {activeInvoiceToPay.po_number && (
                  <div className="flex justify-between items-center">
                    <span className={isLight ? 'text-slate-600' : 'text-gray-400'}>No. Purchase Order:</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${isLight ? 'bg-sky-100 text-sky-800' : 'bg-sky-500/20 text-sky-300'}`}>
                      {activeInvoiceToPay.po_number}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className={isLight ? 'text-slate-600' : 'text-gray-400'}>Tanggal Jatuh Tempo:</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                    {activeInvoiceToPay.due_date || '-'}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#30363d]/40 flex justify-between items-center">
                  <span className="font-bold text-gray-300">Total Nominal Pelunasan:</span>
                  <span className="font-mono font-black text-lg text-emerald-400">
                    Rp {activeInvoiceToPay.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Pilihan Sumber Dana */}
              <div>
                <label className="font-bold text-gray-300 block mb-1.5">
                  Pilih Sumber Rekening Pembayaran <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Option 1: Bank Operasional */}
                  <label
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                      modalPaymentSource === 'Bank Operasional'
                        ? 'bg-sky-500/15 border-sky-500 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                        : isLight
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-sky-400">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Bank Operasional</span>
                      </div>
                      <input
                        type="radio"
                        name="paymentSource"
                        value="Bank Operasional"
                        checked={modalPaymentSource === 'Bank Operasional'}
                        onChange={() => setModalPaymentSource('Bank Operasional')}
                        className="text-sky-500"
                      />
                    </div>
                    <div className="font-mono text-[11px] text-gray-400 mt-1">
                      Akun: 1-10002
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400 font-bold mt-0.5">
                      Saldo: Rp {qrisBankBalance.toLocaleString('id-ID')}
                    </div>
                  </label>

                  {/* Option 2: Kas Utama */}
                  <label
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                      modalPaymentSource === 'Kas Utama'
                        ? 'bg-emerald-500/15 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                        : isLight
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Kas Utama</span>
                      </div>
                      <input
                        type="radio"
                        name="paymentSource"
                        value="Kas Utama"
                        checked={modalPaymentSource === 'Kas Utama'}
                        onChange={() => setModalPaymentSource('Kas Utama')}
                        className="text-emerald-500"
                      />
                    </div>
                    <div className="font-mono text-[11px] text-gray-400 mt-1">
                      Akun: 1-10000
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400 font-bold mt-0.5">
                      Saldo: Rp {cashDrawerBalance.toLocaleString('id-ID')}
                    </div>
                  </label>
                </div>
              </div>

              {/* Jurnal Preview Box */}
              <div
                className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${
                  isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Otomatisasi Jurnal Akuntansi Pelunasan (FIN-AP-PAY):</span>
                </div>
                <div className="font-mono text-[10px] space-y-0.5 pl-5">
                  <div>• Debit: <strong>Hutang Dagang (2-10101)</strong>: Rp {activeInvoiceToPay.amount.toLocaleString('id-ID')}</div>
                  <div>
                    • Kredit:{' '}
                    <strong>
                      {modalPaymentSource === 'Kas Utama'
                        ? 'Kas Utama (1-10000)'
                        : 'Bank Operasional (1-10002)'}
                    </strong>
                    : Rp {activeInvoiceToPay.amount.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Catatan Pelunasan */}
              <div>
                <label className="text-gray-300 font-semibold block mb-1">
                  Catatan Transaksi Pelunasan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="No. referensi transfer, nama pengirim, berita acara..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                      : 'bg-[#0d1117] border-[#30363d] text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#30363d]/40">
                <button
                  type="button"
                  onClick={() => setActiveInvoiceToPay(null)}
                  className="px-4 py-2 rounded-xl bg-[#21262d] text-gray-300 hover:bg-[#30363d] cursor-pointer transition font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-confirm-pay-vendor-invoice"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Bayar Tagihan Vendor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
