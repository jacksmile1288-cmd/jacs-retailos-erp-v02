import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseOrder } from '../../types';
import {
  X,
  PackageCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building2,
  Calendar,
  FileText,
  Boxes,
} from 'lucide-react';

interface GoodsReceiptModalProps {
  isOpen: boolean;
  po: PurchaseOrder | null;
  onClose: () => void;
  isLight?: boolean;
}

export const GoodsReceiptModal: React.FC<GoodsReceiptModalProps> = ({
  isOpen,
  po,
  onClose,
  isLight = false,
}) => {
  const { products, processGoodsReceipt } = useApp();

  const [deliveryOrderNo, setDeliveryOrderNo] = useState('');
  const [grReceivedDate, setGrReceivedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [grNotes, setGrNotes] = useState('');
  const [grValidationError, setGrValidationError] = useState<string | null>(null);
  const [grItemsForm, setGrItemsForm] = useState<
    Array<{
      productId: string;
      productName: string;
      orderedQty: number;
      alreadyReceivedQty: number;
      outstandingQty: number;
      receivedQty: number;
      acceptedQty: number;
      rejectedQty: number;
      unit: string;
      unitCost: number;
      rejectionReason: string;
    }>
  >([]);

  useEffect(() => {
    if (!po) return;

    setDeliveryOrderNo(
      po.delivery_order_no || `DO-${po.po_number.replace(/^PO-/, '')}-${Date.now().toString().slice(-4)}`
    );
    setGrReceivedDate(new Date().toISOString().slice(0, 10));
    setGrNotes('');
    setGrValidationError(null);

    if (po.item_details && po.item_details.length > 0) {
      const items = po.item_details.map((detail) => {
        const alreadyRec = detail.received_qty || 0;
        const outstanding = Math.max(0, detail.qty - alreadyRec);
        const prod = products.find((p) => p.id === detail.product_id);
        return {
          productId: detail.product_id,
          productName: detail.product_name,
          orderedQty: detail.qty,
          alreadyReceivedQty: alreadyRec,
          outstandingQty: outstanding,
          receivedQty: outstanding,
          acceptedQty: outstanding,
          rejectedQty: 0,
          unit: detail.unit || prod?.unit || 'Unit',
          unitCost: detail.unit_cost || prod?.cost_price || 0,
          rejectionReason: '',
        };
      });
      setGrItemsForm(items);
    } else {
      const def = products[0];
      setGrItemsForm([
        {
          productId: def?.id || 'PRD-001',
          productName: po.items.slice(0, 45) || def?.name || 'Item PO',
          orderedQty: 1,
          alreadyReceivedQty: 0,
          outstandingQty: 1,
          receivedQty: 1,
          acceptedQty: 1,
          rejectedQty: 0,
          unit: def?.unit || 'Unit',
          unitCost: po.total_amount || 0,
          rejectionReason: '',
        },
      ]);
    }
  }, [po, products]);

  if (!isOpen || !po) return null;

  const handleItemReceivedQtyChange = (idx: number, val: number) => {
    setGrItemsForm((prev) => {
      const updated = [...prev];
      const it = updated[idx];
      const newRec = Math.max(0, val);
      const newAccepted = Math.min(newRec, it.outstandingQty);
      const newRejected = Math.max(0, newRec - newAccepted);
      updated[idx] = {
        ...it,
        receivedQty: newRec,
        acceptedQty: newAccepted,
        rejectedQty: newRejected,
      };
      return updated;
    });
    setGrValidationError(null);
  };

  const handleItemAcceptedQtyChange = (idx: number, val: number) => {
    setGrItemsForm((prev) => {
      const updated = [...prev];
      const it = updated[idx];
      const newAcc = Math.max(0, val);
      const newRej = Math.max(0, it.receivedQty - newAcc);
      updated[idx] = {
        ...it,
        acceptedQty: newAcc,
        rejectedQty: newRej,
      };
      return updated;
    });
    setGrValidationError(null);
  };

  const handleItemRejectedQtyChange = (idx: number, val: number) => {
    setGrItemsForm((prev) => {
      const updated = [...prev];
      const it = updated[idx];
      const newRej = Math.max(0, val);
      const newAcc = Math.max(0, it.receivedQty - newRej);
      updated[idx] = {
        ...it,
        rejectedQty: newRej,
        acceptedQty: newAcc,
      };
      return updated;
    });
    setGrValidationError(null);
  };

  const handleItemRejectionReasonChange = (idx: number, reason: string) => {
    setGrItemsForm((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], rejectionReason: reason };
      return updated;
    });
  };

  const handleAcceptAllItems = () => {
    setGrItemsForm((prev) =>
      prev.map((it) => ({
        ...it,
        receivedQty: it.outstandingQty,
        acceptedQty: it.outstandingQty,
        rejectedQty: 0,
        rejectionReason: '',
      }))
    );
    setGrValidationError(null);
  };

  const handleSubmitGoodsReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryOrderNo.trim()) {
      setGrValidationError('Nomor Surat Jalan / Delivery Order (DO) dari vendor wajib diisi.');
      return;
    }

    let totalRec = 0;
    for (let i = 0; i < grItemsForm.length; i++) {
      const it = grItemsForm[i];
      totalRec += it.receivedQty;

      if (it.acceptedQty + it.rejectedQty !== it.receivedQty) {
        setGrValidationError(
          `Item "${it.productName}": Qty Diterima Baik (${it.acceptedQty}) + Ditolak (${it.rejectedQty}) harus sama persis dengan Qty Diterima Fisik (${it.receivedQty}).`
        );
        return;
      }

      if (it.acceptedQty > it.outstandingQty) {
        setGrValidationError(
          `Item "${it.productName}": Qty Diterima Baik (${it.acceptedQty}) tidak boleh melebihi sisa outstanding PO (${it.outstandingQty}).`
        );
        return;
      }

      if (it.rejectedQty > 0 && !it.rejectionReason.trim()) {
        setGrValidationError(
          `Item "${it.productName}": Wajib mencantumkan alasan penolakan/kerusakan barang.`
        );
        return;
      }
    }

    if (totalRec <= 0) {
      setGrValidationError('Setidaknya satu item harus memiliki Qty Diterima Fisik > 0.');
      return;
    }

    const res = processGoodsReceipt({
      poNumber: po.po_number,
      deliveryOrderNumber: deliveryOrderNo.trim(),
      items: grItemsForm.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        orderedQty: it.orderedQty,
        receivedQty: it.receivedQty,
        acceptedQty: it.acceptedQty,
        rejectedQty: it.rejectedQty,
        unit: it.unit,
        unitCost: it.unitCost,
        rejectionReason: it.rejectionReason,
      })),
      notes: `${grNotes.trim()} [Tanggal Terima: ${grReceivedDate}]`,
    });

    if (res.success) {
      onClose();
    } else {
      setGrValidationError(res.message);
    }
  };

  const totalAcceptedUnits = grItemsForm.reduce((acc, it) => acc + (it.acceptedQty || 0), 0);
  const totalRejectedUnits = grItemsForm.reduce((acc, it) => acc + (it.rejectedQty || 0), 0);
  const totalAcceptedCost = grItemsForm.reduce(
    (acc, it) => acc + (it.acceptedQty || 0) * (it.unitCost || 0),
    0
  );

  return (
    <div
      id="modal-goods-receipt"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        className={`w-full max-w-3xl rounded-2xl p-6 shadow-2xl relative border my-8 max-h-[90vh] flex flex-col ${
          isLight
            ? 'bg-white border-slate-300 text-slate-800'
            : 'bg-[#161b22] border-[#30363d] text-gray-200'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#30363d] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h3
                className={`font-bold text-base leading-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Penerimaan Barang (Goods Receipt / GRN) & Sinkronisasi
              </h3>
              <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-sky-400">{po.po_number}</span>
                <span>•</span>
                <span className="font-semibold text-gray-300">
                  Vendor: {po.supplier_name}
                </span>
                <span>•</span>
                <span className="font-mono text-emerald-400">
                  Total PO: Rp {po.total_amount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-gr-modal"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmitGoodsReceipt} className="flex-1 overflow-y-auto pt-4 space-y-4 text-xs pr-1">
          {/* Surat Jalan / Delivery Order Input & Quick Action */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="font-bold text-gray-300 block mb-1">
                Nomor Surat Jalan / Delivery Order (DO) Vendor <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                id="input-do-number"
                required
                placeholder="Contoh: DO-2026/09/8821 atau SJ-ANJ-098"
                value={deliveryOrderNo}
                onChange={(e) => {
                  setDeliveryOrderNo(e.target.value);
                  setGrValidationError(null);
                }}
                className={`w-full px-3 py-2 rounded-xl font-mono text-xs border outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    : 'bg-[#0d1117] border-[#30363d] text-white focus:border-emerald-500'
                }`}
              />
              <div className="text-[10px] text-gray-400 mt-1">
                Wajib diisi sesuai lembar Surat Jalan vendor.
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-300 block mb-1">
                Tanggal Terima Barang
              </label>
              <input
                type="date"
                id="input-received-date"
                required
                value={grReceivedDate}
                onChange={(e) => setGrReceivedDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl font-mono text-xs border outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    : 'bg-[#0d1117] border-[#30363d] text-white focus:border-emerald-500'
                }`}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                id="btn-accept-all-items"
                onClick={handleAcceptAllItems}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                title="Isi Qty Diterima Baik = Seluruh Sisa Outstanding PO"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terima Semua Sesuai PO</span>
              </button>
            </div>
          </div>

          {/* Integration Sync Highlights Info */}
          <div
            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-[11px] ${
              isLight ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-[#0052FF]/10 border-[#0052FF]/30 text-blue-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 shrink-0 text-[#0052FF]" />
              <span>
                <strong>Otomatisasi ERP:</strong> Menambah stok gudang, mengubah status PO ke <strong>RECEIVED</strong>, mencatat Hutang Usaha (AP) di Finance, & membukukan jurnal <strong>FIN-GRN</strong> (Debit Persediaan [1-10501], Kredit Hutang Dagang [2-10101]).
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {grValidationError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{grValidationError}</span>
            </div>
          )}

          {/* Table of Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-300 uppercase tracking-wider text-[11px]">
                Daftar Item & Verifikasi Fisik Barang Masuk
              </h4>
              <span className="text-[11px] text-gray-400 font-mono">
                {grItemsForm.length} Item Terdaftar
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
                    <th className="py-2.5 px-3">Item & Satuan</th>
                    <th className="py-2.5 px-3 text-center">Sisa PO</th>
                    <th className="py-2.5 px-3 text-center">Qty Fisik Datang</th>
                    <th className="py-2.5 px-3 text-center">Diterima Baik</th>
                    <th className="py-2.5 px-3 text-center">Ditolak / Rusak</th>
                    <th className="py-2.5 px-3">Alasan Penolakan</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isLight
                      ? 'divide-slate-200 text-slate-800'
                      : 'divide-[#30363d] text-gray-200'
                  }`}
                >
                  {grItemsForm.map((item, idx) => {
                    const isMismatch = item.acceptedQty + item.rejectedQty !== item.receivedQty;
                    const isOverOutstanding = item.acceptedQty > item.outstandingQty;

                    return (
                      <tr
                        key={item.productId || idx}
                        className={`transition ${
                          isMismatch || isOverOutstanding
                            ? 'bg-rose-500/10'
                            : isLight
                            ? 'hover:bg-slate-50'
                            : 'hover:bg-[#21262d]/40'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-bold">{item.productName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {item.productId} • Satuan: {item.unit}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className="font-bold text-sky-400">{item.outstandingQty}</span>
                          <span className="text-[10px] text-gray-400 block">
                            (Pesan: {item.orderedQty})
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            id={`input-received-qty-${item.productId}`}
                            min="0"
                            required
                            value={item.receivedQty}
                            onChange={(e) =>
                              handleItemReceivedQtyChange(idx, Number(e.target.value))
                            }
                            className={`w-20 px-2 py-1 text-center font-mono font-bold rounded-lg border outline-none text-xs ${
                              isLight
                                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                                : 'bg-[#0d1117] border-[#30363d] text-white focus:border-emerald-500'
                            }`}
                          />
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            id={`input-accepted-qty-${item.productId}`}
                            min="0"
                            max={item.outstandingQty}
                            required
                            value={item.acceptedQty}
                            onChange={(e) =>
                              handleItemAcceptedQtyChange(idx, Number(e.target.value))
                            }
                            className={`w-20 px-2 py-1 text-center font-mono font-bold rounded-lg border outline-none text-xs ${
                              isOverOutstanding
                                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                                : isLight
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 focus:border-emerald-500'
                                : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 focus:border-emerald-400'
                            }`}
                          />
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            id={`input-rejected-qty-${item.productId}`}
                            min="0"
                            value={item.rejectedQty}
                            onChange={(e) =>
                              handleItemRejectedQtyChange(idx, Number(e.target.value))
                            }
                            className={`w-20 px-2 py-1 text-center font-mono font-bold rounded-lg border outline-none text-xs ${
                              item.rejectedQty > 0
                                ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 focus:border-rose-400'
                                : isLight
                                ? 'bg-slate-50 border-slate-300 text-slate-700'
                                : 'bg-[#0d1117] border-[#30363d] text-gray-300'
                            }`}
                          />
                        </td>

                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            id={`input-reject-reason-${item.productId}`}
                            placeholder={
                              item.rejectedQty > 0
                                ? 'Wajib: Segel rusak / bocor / expired'
                                : 'Opsional catatan...'
                            }
                            value={item.rejectionReason}
                            onChange={(e) =>
                              handleItemRejectionReasonChange(idx, e.target.value)
                            }
                            className={`w-full px-2 py-1 rounded-lg border outline-none text-xs ${
                              item.rejectedQty > 0 && !item.rejectionReason
                                ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                                : isLight
                                ? 'bg-slate-50 border-slate-300 text-slate-800'
                                : 'bg-[#0d1117] border-[#30363d] text-gray-200'
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-gray-300 font-semibold block mb-1">
              Catatan Gudang / Berita Acara Penerimaan (Opsional)
            </label>
            <textarea
              id="input-gr-notes"
              rows={2}
              placeholder="Catatan kondisi paket, nama supir / ekspedisi, nomor polisi truk, dll..."
              value={grNotes}
              onChange={(e) => setGrNotes(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                  : 'bg-[#0d1117] border-[#30363d] text-white focus:border-emerald-500'
              }`}
            />
          </div>

          {/* Footer Summary & Submit */}
          <div
            className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
              isLight
                ? 'bg-slate-100 border-slate-200'
                : 'bg-[#0d1117] border-[#30363d]'
            }`}
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Total Diterima Baik:</span>
                <span className="font-mono font-bold text-sm text-emerald-400">
                  +{totalAcceptedUnits} Unit
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Total Ditolak:</span>
                <span className="font-mono font-bold text-sm text-rose-400">
                  {totalRejectedUnits} Unit
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Nilai Masuk:</span>
                <span className="font-mono font-bold text-xs text-sky-400">
                  Rp {totalAcceptedCost.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#21262d] text-gray-300 hover:bg-[#30363d] cursor-pointer transition font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                id="btn-submit-create-grn"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Terima Barang (Create GRN)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
