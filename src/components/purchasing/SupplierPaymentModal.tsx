import React, { useState } from 'react';
import { PurchaseOrder } from '../../types';
import {
  X,
  CreditCard,
  Calendar,
  CheckCircle2,
  Building2,
  Wallet,
  Landmark,
  Coins,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface SupplierPaymentModalProps {
  po: PurchaseOrder;
  onClose: () => void;
  onConfirmPayment: (
    poNumber: string,
    status: 'Belum Bayar' | 'Jatuh Tempo' | 'Lunas',
    details: {
      paid_date: string;
      payment_method: string;
      payment_source: 'Kas Operasional' | 'Rekening Bank Utama' | 'Kas Kecil';
      payment_ref: string;
      amount?: number;
    }
  ) => void;
  isLight?: boolean;
}

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  po,
  onClose,
  onConfirmPayment,
  isLight = false,
}) => {
  const [paymentStatus, setPaymentStatus] = useState<'Belum Bayar' | 'Jatuh Tempo' | 'Lunas'>('Lunas');
  const [paymentSource, setPaymentSource] = useState<'Kas Operasional' | 'Rekening Bank Utama' | 'Kas Kecil'>('Kas Operasional');
  const [paidDate, setPaidDate] = useState(
    po.paid_date || new Date().toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState(
    po.payment_method || 'Transfer Bank'
  );
  const netDueAmount = Math.max(0, po.total_amount - (po.return_amount || 0));
  const [paymentAmount, setPaymentAmount] = useState<number>(netDueAmount);
  const [paymentRef, setPaymentRef] = useState(
    po.payment_ref || `TRF-SUPP-${Date.now().toString().slice(-6)}`
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmPayment(po.po_number, paymentStatus, {
      paid_date: paidDate,
      payment_method: paymentMethod,
      payment_source: paymentSource,
      payment_ref: paymentRef.trim(),
      amount: paymentAmount,
    });
    onClose();
  };

  const fundSources = [
    {
      id: 'Kas Operasional' as const,
      name: 'Kas Operasional',
      sub: 'Kas tunai operasional kantor',
      icon: Wallet,
      badge: 'Cash / Tunai',
      color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    },
    {
      id: 'Rekening Bank Utama' as const,
      name: 'Rekening Bank Utama',
      sub: 'BCA / Mandiri Corporate',
      icon: Landmark,
      badge: 'Bank Transfer',
      color: 'text-sky-400 border-sky-500/40 bg-sky-500/10',
    },
    {
      id: 'Kas Kecil' as const,
      name: 'Kas Kecil',
      sub: 'Dana kas kecil (Petty Cash)',
      icon: Coins,
      badge: 'Petty Cash',
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl relative border my-8 max-h-[92vh] flex flex-col ${
          isLight
            ? 'bg-white border-slate-300 text-slate-800'
            : 'bg-[#161b22] border-[#30363d] text-gray-200'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#30363d]">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3
              className={`font-bold text-base leading-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Pelunasan Tagihan Vendor & Mutasi Kas Finance
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Integrasi langsung modul Purchasing $\rightarrow$ Finance & Accounting
            </p>
          </div>
        </div>

        {/* PO Info Card */}
        <div
          className={`p-3.5 rounded-xl border mb-4 space-y-1.5 text-xs ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-[#0d1117] border-[#30363d]'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Nomor PO:</span>
            <span className="font-mono font-bold text-sky-400 text-sm">
              {po.po_number}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Vendor / Supplier:</span>
            <span className="font-semibold text-white">{po.supplier_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Termin & Jatuh Tempo:</span>
            <span className="font-medium text-amber-400">
              {po.payment_term || 'Tempo 30 Hari'} {po.due_date ? `(Due: ${po.due_date})` : ''}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
            <span className="font-bold text-gray-300">Total Nilai PO Awal:</span>
            <span className="font-mono font-bold text-white">
              Rp {po.total_amount.toLocaleString('id-ID')}
            </span>
          </div>
          {po.return_amount && po.return_amount > 0 && (
            <>
              <div className="flex justify-between items-center text-rose-400">
                <span>Potongan Nota Debit (Retur):</span>
                <span className="font-mono font-bold">
                  - Rp {po.return_amount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-rose-500/30">
                <span className="font-bold text-emerald-300">Sisa Tagihan Bersih (Net AP):</span>
                <span className="font-mono font-black text-base text-emerald-400">
                  Rp {netDueAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
          {/* Pilihan Sumber Dana Kas (Finance Integration) */}
          <div>
            <label className="font-bold text-gray-200 block mb-1.5 flex items-center justify-between">
              <span>Sumber Dana Kas (Finance & Accounting)</span>
              <span className="text-[10px] text-emerald-400 font-semibold">Otomatis Catat Kas Keluar</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {fundSources.map((source) => {
                const Icon = source.icon;
                const isSelected = paymentSource === source.id;
                return (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => setPaymentSource(source.id)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? `${source.color} ring-1 ring-emerald-500 shadow-md`
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        : 'bg-[#0d1117] border-[#30363d] text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-black/30 font-mono">
                        {source.badge}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-[11px] text-white leading-tight">
                        {source.name}
                      </div>
                      <div className="text-[9px] text-gray-400 mt-0.5 truncate">
                        {source.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Pembayaran */}
          <div>
            <label className="font-bold text-gray-300 block mb-1">
              Status Faktur Setelah Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('Lunas')}
                className={`py-2 px-2 rounded-xl font-bold border transition text-center cursor-pointer ${
                  paymentStatus === 'Lunas'
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-400 shadow-sm'
                    : 'bg-black/20 border-slate-700 text-gray-400 hover:text-white'
                }`}
              >
                Lunas (Paid)
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('Belum Bayar')}
                className={`py-2 px-2 rounded-xl font-bold border transition text-center cursor-pointer ${
                  paymentStatus === 'Belum Bayar'
                    ? 'bg-amber-600/30 border-amber-500 text-amber-400 shadow-sm'
                    : 'bg-black/20 border-slate-700 text-gray-400 hover:text-white'
                }`}
              >
                Belum Bayar
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('Jatuh Tempo')}
                className={`py-2 px-2 rounded-xl font-bold border transition text-center cursor-pointer ${
                  paymentStatus === 'Jatuh Tempo'
                    ? 'bg-rose-600/30 border-rose-500 text-rose-400 shadow-sm'
                    : 'bg-black/20 border-slate-700 text-gray-400 hover:text-white'
                }`}
              >
                Jatuh Tempo
              </button>
            </div>
          </div>

          {/* Nominal Bayar & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-300 block mb-1">
                Nominal Pembayaran (Rp)
              </label>
              <input
                type="number"
                min="1"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border outline-none font-mono font-bold text-emerald-400 ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF]'
                    : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                }`}
              />
            </div>

            <div>
              <label className="font-bold text-gray-300 block mb-1">
                Tanggal Pembayaran / Realisasi Kas
              </label>
              <input
                type="date"
                required
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border outline-none font-mono ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF]'
                    : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                }`}
              />
            </div>
          </div>

          {/* Metode Pembayaran & No Referensi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-300 block mb-1">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF]'
                    : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                }`}
              >
                <option value="Transfer Bank">Transfer Bank (BCA / Mandiri / BRI)</option>
                <option value="Kas Tunai">Kas Tunai / Cash on Delivery</option>
                <option value="Bilyet Giro / Cek">Bilyet Giro / Cek Bank</option>
                <option value="Kartu Debit Perusahaan">Kartu Debit Perusahaan</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-300 block mb-1">
                No. Referensi / Bukti Bayar
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: TRF-BCA-9812401"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border outline-none font-mono ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF]'
                    : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                }`}
              />
            </div>
          </div>

          {/* Integration Confirmation Info Banner */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Otomatisasi Jurnal Finance:</span> Mengonfirmasi pelunasan ini akan otomatis membukukan transaksi Kas Keluar bertipe <strong>EXPENSE (Pembayaran Supplier AP)</strong> dari akun <strong>{paymentSource}</strong> sebesar <strong>Rp {paymentAmount.toLocaleString('id-ID')}</strong>.
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-[#30363d] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#21262d] text-gray-300 hover:bg-[#30363d] transition font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition shadow-[0_0_15px_rgba(16,185,129,0.35)] flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Konfirmasi Pelunasan & Catat Kas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
