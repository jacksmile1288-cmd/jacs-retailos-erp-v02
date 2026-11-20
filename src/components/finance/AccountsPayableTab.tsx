import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { InvoiceDue } from '../../types';
import {
  buildDomainIsolatedApInvoices,
  isApInvoiceUnpaid,
} from '../../utils/buildingDomainIsolation';
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
  QrCode,
} from 'lucide-react';

interface AccountsPayableTabProps {
  isLight?: boolean;
}

export const AccountsPayableTab: React.FC<AccountsPayableTabProps> = ({ isLight = false }) => {
  const {
    invoicesDue,
    finance,
    payVendorInvoice,
    purchasing,
    supplierRebateClaims,
    applySupplierRebateToAP,
    businessDomainConfig,
    isLedgerReset,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'UNPAID' | 'ALL' | 'PAID'>('UNPAID');
  const [selectedPaymentSourceMap, setSelectedPaymentSourceMap] = useState<Record<string, string>>({});

  // Modal State for Payment
  const [activeInvoiceToPay, setActiveInvoiceToPay] = useState<InvoiceDue | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<string>('');
  const [modalPaymentSource, setModalPaymentSource] = useState<'Bank Operasional' | 'Kas Kasir' | 'Bank QRIS'>('Bank Operasional');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentPayAmount = useMemo(() => {
    if (!activeInvoiceToPay) return 0;
    const num = Number(payAmountInput.replace(/\D/g, '')) || 0;
    return Math.max(0, Math.min(activeInvoiceToPay.amount, num));
  }, [activeInvoiceToPay, payAmountInput]);

  const remainingAfterPayment = useMemo(() => {
    if (!activeInvoiceToPay) return 0;
    return Math.max(0, activeInvoiceToPay.amount - currentPayAmount);
  }, [activeInvoiceToPay, currentPayAmount]);

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

  const isUnpaid = useCallback((inv: InvoiceDue) => {
    return isApInvoiceUnpaid(inv.status, inv.amount);
  }, []);

  // Domain-isolated AP invoices (strictly PAYABLE / INV-AP*, hiding INV-AR-* and non-domain vendors)
  const allVirtualInvoices = useMemo(
    () => buildDomainIsolatedApInvoices(invoicesDue, purchasing, businessDomainConfig, isLedgerReset),
    [invoicesDue, purchasing, businessDomainConfig, isLedgerReset]
  );

  const unpaidInvoices = useMemo(() => {
    return allVirtualInvoices.filter(isUnpaid);
  }, [allVirtualInvoices, isUnpaid]);

  const totalUnpaidAmount = useMemo(() => {
    return unpaidInvoices.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
  }, [unpaidInvoices]);

  const paidInvoices = useMemo(() => {
    return allVirtualInvoices.filter((inv) => !isUnpaid(inv));
  }, [allVirtualInvoices, isUnpaid]);

  // Filtered list
  const filteredInvoices = useMemo(() => {
    return allVirtualInvoices.filter((inv) => {
      // Status filter logic
      if (statusFilter === 'UNPAID' && !isUnpaid(inv)) return false;
      if (statusFilter === 'PAID' && !['PAID', 'Paid', 'Lunas'].includes(inv.status)) return false;

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
  }, [allVirtualInvoices, statusFilter, searchQuery, isUnpaid]);

  const handleOpenPayModal = (inv: InvoiceDue) => {
    const defaultSource = (selectedPaymentSourceMap[inv.id] as any) || 'Bank Operasional';
    setModalPaymentSource(
      defaultSource === 'Kas Kasir' || defaultSource === 'Bank QRIS' ? defaultSource : 'Bank Operasional'
    );
    setPayAmountInput(String(inv.amount || 0));
    setPaymentNotes('');
    setActiveInvoiceToPay(inv);
  };

  const handleExecutePayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeInvoiceToPay || isProcessing || currentPayAmount <= 0) return;

    setIsProcessing(true);
    const res = payVendorInvoice(activeInvoiceToPay.id, currentPayAmount, modalPaymentSource, paymentNotes);
    setIsProcessing(false);

    if (res.success) {
      setActiveInvoiceToPay(null);
    }
  };

  const handleDirectPay = (inv: InvoiceDue, source: 'Kas Kasir' | 'Bank Operasional' | 'Bank QRIS') => {
    payVendorInvoice(inv.id, inv.amount, source);
  };

  const getMatchingClaimableRebates = useCallback(
    (vendorName?: string) => {
      if (!vendorName) return [];
      const vLower = vendorName.trim().toLowerCase();
      return (supplierRebateClaims || []).filter((c) => {
        if (c.status !== 'CLAIMABLE') return false;
        const cLower = (c.supplierName || '').trim().toLowerCase();
        return cLower === vLower || cLower.includes(vLower) || vLower.includes(cLower);
      });
    },
    [supplierRebateClaims]
  );

  const activeModalRebates = useMemo(
    () => (activeInvoiceToPay ? getMatchingClaimableRebates(activeInvoiceToPay.party_name || activeInvoiceToPay.vendor) : []),
    [activeInvoiceToPay, getMatchingClaimableRebates]
  );

  const activeModalRebateTotal = useMemo(
    () => activeModalRebates.reduce((s, c) => s + (c.claimAmount || 0), 0),
    [activeModalRebates]
  );

  const handleApplyRebateOffsetInModal = () => {
    if (!activeInvoiceToPay || activeModalRebates.length === 0) return;
    const res = applySupplierRebateToAP(
      activeModalRebates.map((c) => c.id),
      activeInvoiceToPay.id
    );
    if (res.success) {
      const nextAmt = Math.max(0, activeInvoiceToPay.amount - res.deductedTotal);
      if (nextAmt <= 0) {
        setActiveInvoiceToPay(null);
      } else {
        setActiveInvoiceToPay({ ...activeInvoiceToPay, amount: nextAmt });
      }
    }
  };

  return (
    <div id="accounts-payable-tab" className="space-y-5 font-sans">
      {/* Top Banner & Liquid Balance Overview */}
      <div
        className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${
          unpaidInvoices.length > 0
            ? 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.22)]'
            : isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-[#30363d]/40 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base leading-6 font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Pelunasan Hutang Dagang & Tagihan Supplier (AP Settlement)
              </h3>
              <p className="text-sm leading-5 font-normal text-slate-500 dark:text-gray-400 mt-0.5">
                Pengelolaan faktur tagihan vendor terverifikasi dari modul Purchasing/Goods Receipt & BPJS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-xl text-xs leading-5 font-mono font-normal flex items-center gap-1.5 ${
              unpaidInvoices.length > 0
                ? isLight
                  ? 'bg-amber-100 border border-amber-300 text-amber-950 font-medium animate-pulse'
                  : 'border border-amber-500/40 bg-amber-500/15 text-amber-300 animate-pulse'
                : isLight
                ? 'bg-slate-100 border border-slate-300 text-slate-700'
                : 'border border-slate-700 bg-slate-800 text-slate-300'
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
            className={`p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${
              unpaidInvoices.length > 0
                ? 'border-amber-500/60 bg-amber-500/5 shadow-[0_0_14px_rgba(245,158,11,0.15)]'
                : isLight ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] leading-4 font-mono font-normal text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                Total Hutang Belum Bayar
              </span>
            </div>
            <div className="text-lg leading-7 font-mono font-semibold text-rose-600 dark:text-rose-400 mt-1">
              Rp {totalUnpaidAmount.toLocaleString('id-ID')}
            </div>
          </div>

          {/* Card 2: Saldo Kas Utama (1-10000) */}
          <div
            className={`p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${
              isLight ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] leading-4 font-mono font-normal text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                Kas Utama (1-10000)
              </span>
            </div>
            <div className="text-lg leading-7 font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
              Rp {cashDrawerBalance.toLocaleString('id-ID')}
            </div>
          </div>

          {/* Card 3: Saldo Bank Operasional (1-10002) */}
          <div
            className={`p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${
              isLight ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] leading-4 font-mono font-normal text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                Bank Operasional (1-10002)
              </span>
            </div>
            <div className="text-lg leading-7 font-mono font-semibold text-blue-600 dark:text-blue-400 mt-1">
              Rp {qrisBankBalance.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-sm`}
      >
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            id="search-ap-invoices"
            placeholder="Cari Nama Supplier, No. Invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-lg border outline-none text-sm leading-5 font-normal transition shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center rounded-xl p-0.5 border ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-800/80 border-slate-700'
          }`}>
            <button
              type="button"
              id="filter-ap-unpaid"
              onClick={() => setStatusFilter('UNPAID')}
              className={`px-3 py-1.5 rounded-lg text-xs leading-5 font-medium transition cursor-pointer flex items-center gap-1.5 active:scale-[0.99] ${
                statusFilter === 'UNPAID'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : isLight
                  ? 'text-slate-700 hover:bg-slate-200'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Belum Lunas ({unpaidInvoices.length})</span>
            </button>
            <button
              type="button"
              id="filter-ap-paid"
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1.5 rounded-lg text-xs leading-5 font-medium transition cursor-pointer flex items-center gap-1.5 active:scale-[0.99] ${
                statusFilter === 'PAID'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : isLight
                  ? 'text-slate-700 hover:bg-slate-200'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Lunas ({paidInvoices.length})</span>
            </button>
            <button
              type="button"
              id="filter-ap-all"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs leading-5 font-medium transition cursor-pointer flex items-center gap-1.5 active:scale-[0.99] ${
                statusFilter === 'ALL'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : isLight
                  ? 'text-slate-700 hover:bg-slate-200'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Semua ({allVirtualInvoices.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Daftar Tagihan Supplier Table */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
          isLight 
            ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' 
            : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead
              className={`font-mono font-normal border-b uppercase tracking-widest text-[11px] leading-4 ${
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
                  <td colSpan={7} className="py-10 text-center text-gray-500 text-sm leading-5 font-normal">
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
                      className={`transition-colors ${
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
                      <td className="py-3 px-4 font-mono text-xs leading-5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-mono font-normal ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                            {inv.invoice_number}
                          </span>
                          {inv.po_number && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-normal border ${
                                isLight
                                  ? 'bg-sky-50 text-sky-700 border-sky-300'
                                  : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                              }`}
                            >
                              PO: {inv.po_number}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2 font-mono">
                          <span>Ref: {inv.id}</span>
                          {inv.created_at && (
                            <span>• Dibuat: {inv.created_at.slice(0, 10)}</span>
                          )}
                        </div>
                      </td>

                      {/* Vendor / Rekanan */}
                      <td className="py-3 px-4">
                        <div className={`text-sm leading-5 font-normal ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {inv.party_name || inv.vendor}
                        </div>
                        {inv.terms && (
                          <div className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                            Termin: {inv.terms}
                          </div>
                        )}
                        {!isPaid && (() => {
                          const claims = getMatchingClaimableRebates(inv.party_name || inv.vendor);
                          const claimSum = claims.reduce((s, c) => s + c.claimAmount, 0);
                          if (claimSum <= 0) return null;
                          return (
                            <div className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 mt-1">
                              Tersedia Klaim Rebate TPR: Rp {claimSum.toLocaleString('id-ID')} ({claims.length} transaksi)
                            </div>
                          );
                        })()}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4 font-mono text-xs leading-5 font-normal">
                        <div className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                          <Calendar className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`} />
                          <span>{inv.due_date || '-'}</span>
                        </div>
                      </td>

                      {/* Nominal Tagihan */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-lg leading-7">
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
                          <span className="text-[11px] leading-4 font-mono font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>PAID</span>
                          </span>
                        ) : (
                          <span className="text-[11px] leading-4 font-mono font-normal px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
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
                              className={`px-2.5 py-1.5 rounded-xl border text-sm leading-5 font-normal outline-none transition cursor-pointer ${
                                isLight
                                  ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-500'
                                  : 'bg-[#0d1117] border-[#30363d] text-gray-200 focus:border-cyan-500'
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
                          <div className="text-[11px] leading-4 font-mono font-normal text-gray-400">
                            <div>Via: {inv.paymentSource || 'Bank Operasional'}</div>
                            {inv.paidAt && (
                              <div className="text-[10px] text-gray-500">
                                {inv.paidAt.slice(0, 16)}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Tombol Bayar Hutang Vendor */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {!isPaid ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              id={`btn-pay-vendor-invoice-${inv.id}`}
                              onClick={() => handleOpenPayModal(inv)}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs leading-5 font-medium flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(16,185,129,0.35)] cursor-pointer active:scale-[0.99]"
                              title="Bayar hutang / cicilan ke vendor & catat jurnal pelunasan AP"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Bayar Hutang / Cicilan</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="text-[11px] font-mono text-emerald-400 font-normal">
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
            className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl relative border my-8 flex flex-col transition-all ${
              isLight
                ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-800'
                : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-gray-200'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-[#30363d] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`text-base leading-6 font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Pelunasan Tagihan Hutang Vendor (AP)
                  </h3>
                  <div className="text-xs leading-5 font-normal text-gray-400 mt-0.5">
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
            <form onSubmit={handleExecutePayment} className="pt-4 space-y-4 text-sm leading-5 font-normal">
              {/* Detail Tagihan Box */}
              <div
                className={`p-3.5 rounded-xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="flex justify-between items-center text-sm">
                  <span className={isLight ? 'text-slate-600' : 'text-gray-400'}>Supplier / Vendor:</span>
                  <span className={`font-normal ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {activeInvoiceToPay.party_name || activeInvoiceToPay.vendor}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className={isLight ? 'text-slate-600' : 'text-gray-400'}>Nomor Invoice:</span>
                  <span className={`font-mono font-normal ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                    {activeInvoiceToPay.invoice_number}
                  </span>
                </div>
                {activeInvoiceToPay.po_number && (
                  <div className="flex justify-between items-center text-sm">
                    <span className={isLight ? 'text-slate-600' : 'text-gray-400'}>No. Purchase Order:</span>
                    <span className={`font-mono font-normal px-2 py-0.5 rounded text-[11px] ${isLight ? 'bg-sky-100 text-sky-800' : 'bg-sky-500/20 text-sky-300'}`}>
                      {activeInvoiceToPay.po_number}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className={isLight ? 'text-slate-600' : 'text-gray-400'}>Tanggal Jatuh Tempo:</span>
                  <span className={`font-mono font-normal ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                    {activeInvoiceToPay.due_date || '-'}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#30363d]/40 flex justify-between items-center">
                  <span className="font-normal text-slate-600 dark:text-gray-300">Total Hutang Berjalan:</span>
                  <span className="font-mono font-semibold text-lg leading-7 text-emerald-500 dark:text-emerald-400 tabular-nums">
                    Rp {activeInvoiceToPay.amount.toLocaleString('id-ID')}
                  </span>
                </div>
                {activeModalRebateTotal > 0 && (
                  <div className="pt-2 border-t border-cyan-500/30 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-cyan-600 dark:text-cyan-300">
                      Klaim Rebate SUPPLIER_TPR tersedia: <span className="font-mono font-semibold">Rp {activeModalRebateTotal.toLocaleString('id-ID')}</span> ({activeModalRebates.length} transaksi)
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyRebateOffsetInModal}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition cursor-pointer whitespace-nowrap"
                    >
                      Potong Rebate ke AP (-Rp {Math.min(activeInvoiceToPay.amount, activeModalRebateTotal).toLocaleString('id-ID')})
                    </button>
                  </div>
                )}
              </div>

              {/* Input Nominal Bayar / Cicilan */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-slate-700 dark:text-gray-300">
                    Nominal Dibayar (Cicilan / Pelunasan):
                  </label>
                  <span className="font-mono text-emerald-500 dark:text-emerald-400 font-semibold">
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
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm font-mono font-semibold border transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
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
                    onClick={() => setPayAmountInput(String(Math.round(activeInvoiceToPay.amount * 0.25)))}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-300 dark:border-gray-700 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-slate-700 dark:text-gray-300 transition cursor-pointer"
                  >
                    25% (Cicilan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayAmountInput(String(Math.round(activeInvoiceToPay.amount * 0.5)))}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-300 dark:border-gray-700 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-slate-700 dark:text-gray-300 transition cursor-pointer"
                  >
                    50% (Separuh)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayAmountInput(String(activeInvoiceToPay.amount))}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-600/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-600/25 transition cursor-pointer"
                  >
                    100% (Pelunasan)
                  </button>
                </div>

                {/* Sisa Tagihan Setelah Bayar */}
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    remainingAfterPayment === 0
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <span>Sisa Hutang Setelah Bayar:</span>
                  <span className="font-mono font-semibold">
                    Rp {remainingAfterPayment.toLocaleString('id-ID')}{' '}
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ml-1 bg-white/20 dark:bg-black/20">
                      {remainingAfterPayment === 0 ? '✓ Lunas' : 'Cicilan'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Pilihan Sumber Rekening Pembayaran */}
              <div className="space-y-1.5">
                <label className="text-xs leading-5 font-medium text-slate-700 dark:text-gray-300 block">
                  Pilih Sumber Rekening Pembayaran <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Option 1: Transfer Bank (1-10002) */}
                  <button
                    type="button"
                    onClick={() => setModalPaymentSource('Bank Operasional')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center active:scale-[0.99] ${
                      modalPaymentSource === 'Bank Operasional'
                        ? 'border-sky-500 bg-sky-500/15 text-sky-400 font-semibold shadow-sm'
                        : isLight
                        ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        : 'border-[#30363d] bg-[#0d1117] text-gray-300 hover:bg-[#21262d]'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-medium">Transfer Bank</span>
                    <span className="text-[10px] text-gray-400 font-mono">1-10002</span>
                  </button>

                  {/* Option 2: Tunai Kas (1-10001) */}
                  <button
                    type="button"
                    onClick={() => setModalPaymentSource('Kas Kasir')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center active:scale-[0.99] ${
                      modalPaymentSource === 'Kas Kasir'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-semibold shadow-sm'
                        : isLight
                        ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        : 'border-[#30363d] bg-[#0d1117] text-gray-300 hover:bg-[#21262d]'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-medium">Tunai Kas</span>
                    <span className="text-[10px] text-gray-400 font-mono">1-10001</span>
                  </button>

                  {/* Option 3: Bank QRIS (1-10003) */}
                  <button
                    type="button"
                    onClick={() => setModalPaymentSource('Bank QRIS')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center active:scale-[0.99] ${
                      modalPaymentSource === 'Bank QRIS'
                        ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400 font-semibold shadow-sm'
                        : isLight
                        ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        : 'border-[#30363d] bg-[#0d1117] text-gray-300 hover:bg-[#21262d]'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-medium">Bank QRIS</span>
                    <span className="text-[10px] text-gray-400 font-mono">1-10003</span>
                  </button>
                </div>
              </div>

              {/* Jurnal Preview Box */}
              <div
                className={`p-3 rounded-xl border text-[11px] leading-4 space-y-1.5 ${
                  isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <div className="font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Otomatisasi Jurnal Akuntansi Pelunasan AP:</span>
                </div>
                <div className="font-mono text-[11px] leading-4 space-y-0.5 pl-5 font-normal">
                  <div>• [DEBIT] 2-10101 Hutang Usaha: Rp {currentPayAmount.toLocaleString('id-ID')}</div>
                  <div>
                    • [KREDIT]{' '}
                    {modalPaymentSource === 'Bank Operasional'
                      ? '1-10002 Bank Operasional'
                      : modalPaymentSource === 'Bank QRIS'
                      ? '1-10003 Bank QRIS'
                      : '1-10001 Kas Kasir'}
                    : Rp {currentPayAmount.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Catatan Pelunasan */}
              <div>
                <label className="text-slate-700 dark:text-gray-300 font-normal text-xs leading-5 block mb-1">
                  Catatan Transaksi Pelunasan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="No. referensi transfer, nama pengirim, berita acara..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none text-sm leading-5 font-normal ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                      : 'bg-[#0d1117] border-[#30363d] text-white focus:border-cyan-500'
                  }`}
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#30363d]/40">
                <button
                  type="button"
                  onClick={() => setActiveInvoiceToPay(null)}
                  className="px-4 py-2 rounded-xl bg-[#21262d] text-gray-300 hover:bg-[#30363d] cursor-pointer transition font-medium text-xs active:scale-[0.99]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-confirm-pay-vendor-invoice"
                  disabled={isProcessing || currentPayAmount <= 0}
                  className={`px-5 py-2 rounded-xl font-medium text-xs leading-5 transition flex items-center gap-1.5 active:scale-[0.99] ${
                    isProcessing || currentPayAmount <= 0
                      ? 'bg-slate-700/60 text-slate-400 border border-slate-600 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {isProcessing
                      ? 'Memproses Pelunasan...'
                      : `Bayar Hutang [Rp ${currentPayAmount.toLocaleString('id-ID')}]`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
