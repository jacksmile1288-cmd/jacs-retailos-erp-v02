import React, { useState } from 'react';
import { GoodsReceipt, PurchaseReturnItem } from '../../types';
import {
  X,
  RotateCcw,
  Building2,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface PurchaseReturnModalProps {
  gr: GoodsReceipt;
  onClose: () => void;
  onSubmitReturn: (payload: {
    poNumber: string;
    grId: string;
    deliveryOrderNumber: string;
    vendorName: string;
    items: PurchaseReturnItem[];
    reason: string;
    includePpn: boolean;
  }) => void;
  isLight?: boolean;
}

export const PurchaseReturnModal: React.FC<PurchaseReturnModalProps> = ({
  gr,
  onClose,
  onSubmitReturn,
  isLight = false,
}) => {
  // Initialize items from GR: prioritize rejected items if any, otherwise allow returning any item
  const [returnItems, setReturnItems] = useState<
    Array<{
      selected: boolean;
      productId: string;
      productName: string;
      orderedQty: number;
      acceptedQty: number;
      rejectedQty: number;
      returnQty: number;
      unit: string;
      unitCost: number;
      reason: string;
    }>
  >(() => {
    return gr.items.map((it) => {
      const defaultReturnQty = it.rejectedQty > 0 ? it.rejectedQty : 0;
      return {
        selected: it.rejectedQty > 0,
        productId: it.productId,
        productName: it.productName,
        orderedQty: it.orderedQty,
        acceptedQty: it.acceptedQty,
        rejectedQty: it.rejectedQty,
        returnQty: defaultReturnQty,
        unit: it.unit || 'Unit',
        unitCost: it.unitCost || 0,
        reason: it.rejectionReason || 'Barang rusak / cacat fisik dalam pengiriman vendor',
      };
    });
  });

  const [generalReason, setGeneralReason] = useState<string>(
    'Retur barang rusak / reject saat verifikasi penerimaan barang (Goods Receipt)'
  );
  const [includePpn, setIncludePpn] = useState<boolean>(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Calculations
  const selectedItems = returnItems.filter((it) => it.selected && it.returnQty > 0);
  const subtotal = selectedItems.reduce((acc, it) => acc + it.returnQty * it.unitCost, 0);
  const ppnAmount = includePpn ? Math.round(subtotal * 0.11) : 0;
  const totalDebitNoteAmount = subtotal + ppnAmount;

  const handleToggleSelect = (index: number) => {
    setReturnItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const nextSelected = !item.selected;
          const nextQty = nextSelected
            ? item.returnQty > 0
              ? item.returnQty
              : item.rejectedQty > 0
              ? item.rejectedQty
              : 1
            : item.returnQty;
          return { ...item, selected: nextSelected, returnQty: nextQty };
        }
        return item;
      })
    );
    setValidationError(null);
  };

  const handleQtyChange = (index: number, val: number) => {
    setReturnItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const maxAllowed = Math.max(item.rejectedQty, item.orderedQty);
          const safeQty = Math.max(0, Math.min(val, maxAllowed));
          return {
            ...item,
            returnQty: safeQty,
            selected: safeQty > 0 ? true : item.selected,
          };
        }
        return item;
      })
    );
    setValidationError(null);
  };

  const handleItemReasonChange = (index: number, val: string) => {
    setReturnItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, reason: val } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      setValidationError('Pilih setidaknya 1 produk dengan kuantitas retur > 0 untuk membuat Nota Debit.');
      return;
    }

    if (totalDebitNoteAmount <= 0) {
      setValidationError('Nilai total retur harus lebih besar dari Rp 0.');
      return;
    }

    const payloadItems: PurchaseReturnItem[] = selectedItems.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      orderedQty: it.orderedQty,
      receivedQty: it.acceptedQty + it.rejectedQty,
      rejectedQty: it.rejectedQty,
      returnQty: it.returnQty,
      unit: it.unit,
      unitCost: it.unitCost,
      subtotal: it.returnQty * it.unitCost,
      reason: it.reason.trim() || generalReason,
    }));

    onSubmitReturn({
      poNumber: gr.poNumber,
      grId: gr.id,
      deliveryOrderNumber: gr.deliveryOrderNumber,
      vendorName: gr.vendorName,
      items: payloadItems,
      reason: generalReason.trim(),
      includePpn,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className={`w-full max-w-3xl rounded-2xl p-6 shadow-2xl relative border my-8 flex flex-col max-h-[92vh] ${
          isLight
            ? 'bg-white border-slate-300 text-slate-800'
            : 'bg-[#161b22] border-[#30363d] text-gray-200'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#30363d]">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.3)]">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3
              className={`font-bold text-base leading-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Buat Retur Pembelian (Purchase Return) & Terbitkan Nota Debit
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Pengembalian fisik barang rusak ke vendor rekanan & pemotongan otomatis tagihan Accounts Payable (AP).
            </p>
          </div>
        </div>

        {/* GR Reference Card */}
        <div
          className={`p-3.5 rounded-xl border mb-4 text-xs ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-800'
              : 'bg-[#0d1117] border-[#30363d]'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            <div>
              <span className="text-gray-400 block text-[10px]">No. Goods Receipt:</span>
              <span className="font-mono font-bold text-emerald-400">{gr.id}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">No. Purchase Order:</span>
              <span className="font-mono font-bold text-sky-400">{gr.poNumber}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">No. Surat Jalan (DO):</span>
              <span className="font-mono font-bold text-amber-300">{gr.deliveryOrderNumber}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Vendor Rekanan:</span>
              <span className="font-bold text-white truncate block">{gr.vendorName}</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Items Selection Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-gray-300 uppercase tracking-wider text-[11px]">
                Pilih Item yang Akan Diretur
              </label>
              <span className="text-[10px] text-gray-400">
                Centang item dan masukkan kuantitas barang yang ditolak / rusak
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
                    <th className="py-2.5 px-3 w-10 text-center">Pilih</th>
                    <th className="py-2.5 px-3">Item Produk</th>
                    <th className="py-2.5 px-3 text-center">Qty Ditolak GR</th>
                    <th className="py-2.5 px-3 text-center">Qty Retur</th>
                    <th className="py-2.5 px-3 text-right">Harga HPP</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-3">Alasan Kerusakan</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isLight ? 'divide-slate-200 text-slate-800' : 'divide-[#30363d] text-gray-200'
                  }`}
                >
                  {returnItems.map((item, idx) => {
                    const itemSubtotal = item.returnQty * item.unitCost;
                    return (
                      <tr
                        key={item.productId || idx}
                        className={`transition ${
                          item.selected
                            ? isLight
                              ? 'bg-rose-50/50'
                              : 'bg-rose-950/20'
                            : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => handleToggleSelect(idx)}
                            className="w-4 h-4 rounded text-rose-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-white">{item.productName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {item.productId}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {item.rejectedQty > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                              {item.rejectedQty} {item.unit}
                            </span>
                          ) : (
                            <span className="text-gray-500">0 {item.unit}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={Math.max(item.rejectedQty, item.orderedQty)}
                            value={item.returnQty}
                            disabled={!item.selected}
                            onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                            className={`w-20 px-2 py-1 text-center font-mono font-bold rounded-lg border outline-none text-xs ${
                              item.selected
                                ? 'bg-[#0d1117] border-rose-500/50 text-rose-400'
                                : 'bg-black/30 border-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-300">
                          Rp {item.unitCost.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                          Rp {itemSubtotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={item.reason}
                            disabled={!item.selected}
                            onChange={(e) => handleItemReasonChange(idx, e.target.value)}
                            placeholder="Alasan retur..."
                            className={`w-full px-2 py-1 text-[11px] rounded-lg border outline-none ${
                              item.selected
                                ? 'bg-[#0d1117] border-[#30363d] text-gray-200'
                                : 'bg-black/30 border-gray-700 text-gray-500 cursor-not-allowed'
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

          {/* General Reason & PPN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="font-bold text-gray-300 block mb-1">
                Catatan Memo / Alasan Utama Retur
              </label>
              <input
                type="text"
                required
                value={generalReason}
                onChange={(e) => setGeneralReason(e.target.value)}
                placeholder="Contoh: Barang cacat pabrik / pecah saat pengiriman vendor"
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                    : 'bg-[#0d1117] border-[#30363d] text-white focus:border-rose-500'
                }`}
              />
            </div>

            <div className="p-3 rounded-xl border border-gray-700/50 bg-[#0d1117] flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-200 block text-xs">Penyesuaian PPN 11%</span>
                <span className="text-[10px] text-gray-400">Retur memotong PPN masukan</span>
              </div>
              <input
                type="checkbox"
                checked={includePpn}
                onChange={(e) => setIncludePpn(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Summary Box & Financial Integration Notice */}
          <div
            className={`p-4 rounded-xl border space-y-2 ${
              isLight
                ? 'bg-rose-50/50 border-rose-200 text-slate-800'
                : 'bg-rose-950/20 border-rose-500/30 text-gray-200'
            }`}
          >
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Subtotal Nilai Retur:</span>
              <span className="font-mono font-bold text-white">
                Rp {subtotal.toLocaleString('id-ID')}
              </span>
            </div>
            {includePpn && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Koreksi PPN 11%:</span>
                <span className="font-mono font-bold text-amber-400">
                  Rp {ppnAmount.toLocaleString('id-ID')}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-rose-500/30">
              <span className="font-bold text-white text-sm">
                Total Nilai Nota Debit (Pemotong Hutang AP):
              </span>
              <span className="font-mono font-black text-lg text-rose-400">
                - Rp {totalDebitNoteAmount.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="pt-2 border-t border-rose-500/20 text-[11px] text-rose-300 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong>Otomatisasi ERP Accounts Payable:</strong> Menerbitkan Nota Debit ini akan <strong>secara otomatis memotong sisa tagihan vendor</strong> pada PO <strong className="text-white font-mono">{gr.poNumber}</strong> di tabel Monitoring Tagihan Supplier, serta mencatat mutasi pengurangan hutang di modul Finance & Accounting.
              </div>
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
              disabled={selectedItems.length === 0 || totalDebitNoteAmount <= 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold transition shadow-[0_0_15px_rgba(244,63,94,0.35)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Terbitkan Nota Debit & Proses Retur</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
