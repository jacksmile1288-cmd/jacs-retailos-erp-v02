import React from 'react';
import { PurchaseOrder, SupplierMaster } from '../../types';
import {
  X,
  Printer,
  PackageCheck,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  ShieldCheck,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface PoDetailModalProps {
  po: PurchaseOrder;
  supplier?: SupplierMaster;
  onClose: () => void;
  onOpenPrint: () => void;
  onOpenGr?: () => void;
  onOpenPayment?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isLight?: boolean;
}

export const PoDetailModal: React.FC<PoDetailModalProps> = ({
  po,
  supplier,
  onClose,
  onOpenPrint,
  onOpenGr,
  onOpenPayment,
  onApprove,
  onReject,
  isLight = false,
}) => {
  const subtotal =
    po.subtotal ??
    (po.item_details && po.item_details.length > 0
      ? po.item_details.reduce((acc, it) => acc + it.subtotal, 0)
      : po.include_ppn !== false
      ? Math.round(po.total_amount / 1.11)
      : po.total_amount);

  const ppnRate = po.ppn_rate ?? 11;
  const ppnAmount =
    po.ppn_amount ??
    (po.include_ppn !== false ? Math.round(subtotal * (ppnRate / 100)) : 0);

  const grandTotal = po.total_amount || subtotal + ppnAmount;

  // Lifecycle steps: Draft -> Menunggu Approval -> Disetujui -> Dipesan -> Selesai
  const getLifecycleIndex = (st: string) => {
    if (st === 'Draft') return 0;
    if (st === 'Menunggu Approval Pimpinan' || st === 'PENDING APPROVAL' || st === 'Pending Approval') return 1;
    if (st === 'Disetujui (Approved)' || st === 'Disetujui' || st === 'Approved') return 2;
    if (st === 'Dipesan' || st === 'SENT_TO_VENDOR' || st === 'Sent') return 3;
    if (st === 'PARTIALLY_RECEIVED') return 3.5;
    if (st === 'Selesai' || st === 'FULLY_RECEIVED' || st === 'RECEIVED' || st === 'GOODS_RECEIPT' || st === 'Received' || st === 'Received / Completed') return 4;
    if (st === 'Ditolak' || st === 'Cancelled') return -1;
    return 1;
  };

  const currentStep = getLifecycleIndex(po.status);
  const isRejected = po.status === 'Ditolak' || po.status === 'Cancelled';

  const steps = [
    { title: 'Draft PO', desc: 'Pembuatan form order' },
    { title: 'Approval Pimpinan', desc: 'Otorisasi eksekutif' },
    { title: 'Disetujui (Approved)', desc: 'Siap dikirim ke vendor' },
    { title: 'Dipesan (Sent)', desc: 'Menunggu pengiriman barang' },
    { title: 'Selesai (Received)', desc: 'Barang diterima gudang' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className={`w-full max-w-3xl rounded-2xl p-6 shadow-2xl relative border my-8 flex flex-col max-h-[92vh] ${
          isLight
            ? 'bg-white border-slate-300 text-slate-800'
            : 'bg-[#161b22] border-[#30363d] text-gray-200'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#30363d] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0052FF]/20 text-[#0052FF] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`font-bold text-base ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Detail Dokumen Purchase Order
                </h3>
                <span className="font-mono font-bold text-sky-400 text-sm">
                  {po.po_number}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Penerbitan: {po.date} • Vendor: {po.supplier_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cetak PO</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 text-xs pr-1">
          {/* Lifecycle Status Timeline Bar */}
          <div
            className={`p-4 rounded-xl border ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-[#0d1117] border-[#30363d]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                Status Siklus Hidup Dokumen (Document Lifecycle)
              </span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                  isRejected
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : currentStep === 4
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                }`}
              >
                {po.status}
              </span>
            </div>

            {isRejected ? (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <div>
                  <span className="font-bold">Dokumen Ditolak / Dibatalkan:</span>{' '}
                  <span>{po.rejected_reason || 'Tidak disetujui oleh pimpinan perusahaan.'}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {steps.map((st, idx) => {
                  const isDone = currentStep >= idx;
                  const isCurrent = Math.floor(currentStep) === idx;

                  return (
                    <div key={idx} className="flex flex-col items-center text-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition ${
                          isDone
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                            : isLight
                            ? 'bg-slate-200 text-slate-500'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div
                        className={`font-bold text-[10px] leading-tight ${
                          isCurrent
                            ? 'text-sky-400'
                            : isDone
                            ? isLight ? 'text-slate-800' : 'text-gray-200'
                            : 'text-gray-500'
                        }`}
                      >
                        {st.title}
                      </div>
                      <div className="text-[9px] text-gray-500 mt-0.5 hidden sm:block">
                        {st.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Supplier & Invoice Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Vendor Details */}
            <div
              className={`p-3.5 rounded-xl border ${
                isLight
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-[#0d1117] border-[#30363d]'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-gray-400 text-[10px] uppercase mb-2">
                <Building2 className="w-3.5 h-3.5 text-[#0052FF]" />
                <span>Informasi Vendor Rekanan</span>
              </div>
              <div className="font-bold text-sm text-white mb-1">
                {po.supplier_name}
              </div>
              {supplier ? (
                <div className="space-y-1 text-gray-400 text-[11px]">
                  <div>Kode Supplier: <span className="font-mono text-gray-200">{supplier.code}</span></div>
                  <div>Kontak Person: <span className="text-gray-200">{supplier.contactPerson}</span></div>
                  <div>Telepon: <span className="text-gray-200">{supplier.phone}</span></div>
                  <div>Email: <span className="text-gray-200">{supplier.email}</span></div>
                  <div className="truncate">Alamat: <span className="text-gray-200">{supplier.address}</span></div>
                </div>
              ) : (
                <div className="text-gray-400 text-[11px]">
                  Supplier resmi terdaftar dalam direktori purchasing.
                </div>
              )}
            </div>

            {/* Invoicing & Payment Info */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                isLight
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-[#0d1117] border-[#30363d]'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 font-bold text-gray-400 text-[10px] uppercase mb-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Status Pembayaran & Tagihan (Invoice AP)</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Termin Pembayaran:</span>
                    <span className="font-semibold text-amber-400">
                      {po.payment_term || 'Tempo 30 Hari'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tanggal Jatuh Tempo:</span>
                    <span className="font-mono text-gray-200">
                      {po.due_date || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status Tagihan:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] font-mono ${
                        po.payment_status === 'Lunas' || po.payment_status === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : po.payment_status === 'Jatuh Tempo'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {po.payment_status === 'Lunas' || po.payment_status === 'PAID' ? 'PAID' : (po.payment_status || 'Belum Bayar')}
                    </span>
                  </div>
                  {po.paid_date && (
                    <div className="flex justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-800">
                      <span>Lunas Pada: {po.paid_date}</span>
                      <span className="truncate">{po.payment_method}</span>
                    </div>
                  )}
                </div>
              </div>

              {onOpenPayment && (
                <div className="pt-2 mt-2 border-t border-[#30363d]/50">
                  <button
                    type="button"
                    onClick={onOpenPayment}
                    className="w-full py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold transition text-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>
                      {po.payment_status === 'Lunas' || po.payment_status === 'PAID'
                        ? 'Edit Data Pembayaran'
                        : 'Catat / Lunasi Pembayaran Tagihan'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Ordered Products Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-300 uppercase tracking-wider text-[11px]">
                Rincian Barang yang Dipesan (Purchase Order Items)
              </h4>
              <span className="text-gray-400 text-[11px]">
                {po.item_details?.length || 1} Item
              </span>
            </div>

            <div
              className={`border rounded-xl overflow-hidden ${
                isLight ? 'border-slate-200' : 'border-[#30363d]'
              }`}
            >
              <table className="w-full text-left text-xs">
                <thead
                  className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                    isLight
                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                  }`}
                >
                  <tr>
                    <th className="py-2.5 px-3">Produk & SKU</th>
                    <th className="py-2.5 px-3 text-center">Qty Pesan</th>
                    <th className="py-2.5 px-3 text-center">Diterima Fisik</th>
                    <th className="py-2.5 px-3 text-right">Harga Beli / HPP</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isLight
                      ? 'divide-slate-200 text-slate-800'
                      : 'divide-[#30363d] text-gray-200'
                  }`}
                >
                  {po.item_details && po.item_details.length > 0 ? (
                    po.item_details.map((item, idx) => {
                      const rec = item.received_qty || 0;
                      const isFulfilled = rec >= item.qty;

                      return (
                        <tr key={idx}>
                          <td className="py-2.5 px-3">
                            <div className="font-bold">{item.product_name}</div>
                            <div className="text-[10px] font-mono text-gray-400">
                              {item.product_id} • {item.unit || 'Unit'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            {item.qty}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">
                            <span
                              className={`font-bold ${
                                isFulfilled
                                  ? 'text-emerald-400'
                                  : rec > 0
                                  ? 'text-sky-400'
                                  : 'text-gray-400'
                              }`}
                            >
                              {rec}
                            </span>
                            <span className="text-[10px] text-gray-500 block">
                              {isFulfilled ? 'Lengkap' : `Sisa ${item.qty - rec}`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-gray-300">
                            Rp {item.unit_cost.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                            Rp {item.subtotal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="py-2.5 px-3 font-semibold">{po.items}</td>
                      <td className="py-2.5 px-3 text-center font-mono">1</td>
                      <td className="py-2.5 px-3 text-center font-mono text-gray-400">-</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        Rp {subtotal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        Rp {subtotal.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery & Goods Receipt Records If Any */}
          {po.delivery_order_no && (
            <div
              className={`p-3.5 rounded-xl border ${
                isLight
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-emerald-400 text-xs mb-1">
                <PackageCheck className="w-4 h-4" />
                <span>Penerimaan Fisik Terverifikasi (Goods Receipt)</span>
              </div>
              <div className="text-[11px] text-gray-300 space-y-0.5">
                <div>No. Surat Jalan Vendor: <span className="font-mono font-bold text-white">{po.delivery_order_no}</span></div>
                <div>Tanggal Terima: <span className="font-mono text-white">{po.received_date || '-'}</span></div>
                <div>Diterima Oleh: <span className="text-white">{po.received_by || '-'}</span></div>
                {po.receiving_notes && (
                  <div className="text-[10px] text-gray-400 italic">Catatan: {po.receiving_notes}</div>
                )}
              </div>
            </div>
          )}

          {/* Financial Calculation Breakdown */}
          <div
            className={`p-4 rounded-xl border flex flex-col items-end gap-1.5 ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-[#0d1117] border-[#30363d]'
            }`}
          >
            <div className="flex justify-between w-64 text-gray-400">
              <span>Subtotal Item:</span>
              <span className="font-mono text-gray-200">
                Rp {subtotal.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between w-64 text-gray-400">
              <span>
                PPN {ppnRate}% {po.include_ppn === false ? '(Non-PPN)' : ''}:
              </span>
              <span className="font-mono text-gray-200">
                Rp {ppnAmount.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between w-64 pt-2 border-t border-gray-700 font-bold text-sm">
              <span className="text-white">Total Nilai PO:</span>
              <span className="font-mono text-emerald-400">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
            {po.return_amount && po.return_amount > 0 && (
              <>
                <div className="flex justify-between w-64 text-xs font-semibold text-rose-400">
                  <span>Nota Debit (Retur):</span>
                  <span className="font-mono">
                    - Rp {po.return_amount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between w-64 pt-1 border-t border-rose-500/30 font-black text-sm">
                  <span className="text-emerald-300">Sisa Tagihan Bersih (AP):</span>
                  <span className="font-mono text-emerald-400">
                    Rp {Math.max(0, grandTotal - po.return_amount).toLocaleString('id-ID')}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal Footer Quick Actions */}
        <div className="pt-3 border-t border-[#30363d] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {(po.status === 'Draft' ||
              po.status === 'Menunggu Approval Pimpinan' ||
              po.status === 'Menunggu Approval Direksi' ||
              po.status === 'PENDING APPROVAL' ||
              po.status === 'Pending Approval') && (
              <>
                {onApprove && (
                  <button
                    type="button"
                    onClick={onApprove}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)] active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Setujui (Approve)</span>
                  </button>
                )}
                {onReject && (
                  <button
                    type="button"
                    onClick={onReject}
                    className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Tolak</span>
                  </button>
                )}
              </>
            )}

            {onOpenGr &&
              (po.status === 'Disetujui (Approved)' ||
                po.status === 'Disetujui' ||
                po.status === 'Approved' ||
                po.status === 'Dipesan' ||
                po.status === 'SENT_TO_VENDOR' ||
                po.status === 'Sent' ||
                po.status === 'PARTIALLY_RECEIVED') && (
                <button
                  type="button"
                  onClick={onOpenGr}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Terima Barang (Goods Receipt)</span>
                </button>
              )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#21262d] text-gray-300 hover:bg-[#30363d] transition font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
