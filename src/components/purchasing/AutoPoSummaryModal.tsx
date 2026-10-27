import React from 'react';
import { PurchaseOrder } from '../../types';
import {
  X,
  FileCheck2,
  Building2,
  Calendar,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Zap,
  ArrowRight,
  Package,
} from 'lucide-react';

interface AutoPoSummaryModalProps {
  generatedPOs: PurchaseOrder[];
  onClose: () => void;
  onViewInPurchasing?: () => void;
  isLight?: boolean;
  title?: string;
  sourceModule?: 'Warehouse' | 'Purchasing';
}

export const AutoPoSummaryModal: React.FC<AutoPoSummaryModalProps> = ({
  generatedPOs,
  onClose,
  onViewInPurchasing,
  isLight = false,
  title = 'Konfirmasi Draf Purchase Order Otomatis (Auto-Reorder)',
  sourceModule = 'Warehouse',
}) => {
  if (!generatedPOs || generatedPOs.length === 0) return null;

  const totalAmountAll = generatedPOs.reduce((acc, po) => acc + po.total_amount, 0);
  const totalItemsCount = generatedPOs.reduce((acc, po) => {
    if (po.item_details && po.item_details.length > 0) {
      return acc + po.item_details.length;
    }
    return acc + 1;
  }, 0);

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
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3
                className={`font-bold text-base leading-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {title}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Integrasi {sourceModule} ➔ Purchasing
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Draf PO berhasil digenerate otomatis berdasarkan Safety Stock, dikelompokkan per Supplier Utama.
            </p>
          </div>
        </div>

        {/* Top Summary Banner */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border mb-4 text-xs ${
            isLight
              ? 'bg-amber-500/5 border-amber-500/20 text-slate-800'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          }`}
        >
          <div>
            <div className="text-[10px] text-gray-400">Total Draf PO Diterbitkan</div>
            <div className="font-mono font-black text-lg text-amber-400">
              {generatedPOs.length} Dokumen PO
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400">Total Item / SKU Direstock</div>
            <div className="font-mono font-black text-lg text-sky-400">
              {totalItemsCount} SKU / Bahan
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400">Estimasi Total Nilai Pengadaan</div>
            <div className="font-mono font-black text-lg text-emerald-400">
              Rp {totalAmountAll.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* List of Generated POs */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {generatedPOs.map((po, index) => {
            const isDirectorApproval =
              po.status === 'Menunggu Approval Direksi' || po.total_amount > 20000000;

            return (
              <div
                key={po.po_number || index}
                className={`p-4 rounded-xl border transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 shadow-sm'
                    : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                {/* PO Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-700/40">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-sky-400">
                      {po.po_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isDirectorApproval
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {isDirectorApproval
                        ? 'Menunggu Approval Direksi (> Rp 20 Jt)'
                        : 'Menunggu Approval Pimpinan'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{po.date}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-emerald-400 font-semibold">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{po.payment_term || 'Tempo 30 Hari'}</span>
                    </span>
                  </div>
                </div>

                {/* Vendor / Supplier */}
                <div className="mt-2.5 flex items-center gap-2 text-xs">
                  <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="text-gray-400">Vendor Rekanan:</span>
                  <span className="font-bold text-white">{po.supplier_name}</span>
                  {po.supplier_id && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-gray-300">
                      {po.supplier_id}
                    </span>
                  )}
                </div>

                {/* Items Table / List */}
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs border border-gray-700/30 rounded-lg overflow-hidden">
                    <thead
                      className={`text-[10px] uppercase font-semibold ${
                        isLight ? 'bg-slate-200 text-slate-700' : 'bg-black/30 text-gray-400'
                      }`}
                    >
                      <tr>
                        <th className="py-2 px-3">Produk / Bahan</th>
                        <th className="py-2 px-3 text-center">Kuantitas Order (Qty)</th>
                        <th className="py-2 px-3 text-right">Harga Beli / HPP</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${
                        isLight ? 'divide-slate-200' : 'divide-gray-800'
                      }`}
                    >
                      {po.item_details && po.item_details.length > 0 ? (
                        po.item_details.map((item, iIdx) => (
                          <tr key={`item-${po.po_number}-${iIdx}`}>
                            <td className="py-2 px-3">
                              <div className="font-medium text-white">{item.product_name}</div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                ID: {item.product_id}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                +{item.qty} {item.unit || 'Unit'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-gray-300">
                              Rp {item.unit_cost.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-white">
                              Rp {item.subtotal.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-2.5 px-3 text-gray-300">
                            {po.items}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal, PPN, and Total */}
                <div className="mt-3 pt-2.5 border-t border-gray-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tersinkron otomatis ke antrean Executive Approval Queue</span>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-gray-400 text-[10px] mr-1.5">PPN 11%:</span>
                      <span className="font-mono text-gray-300">
                        Rp {(po.ppn_amount || Math.round(po.total_amount * 0.11 / 1.11)).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] mr-1.5">Total PO:</span>
                      <span className="font-mono font-black text-sm text-emerald-400">
                        Rp {po.total_amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[#30363d] flex flex-col sm:flex-row items-center justify-between gap-2 mt-2">
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Dokumen tersimpan ke database purchasing & siap diproses lebih lanjut.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#21262d] text-gray-300 hover:bg-[#30363d] transition font-medium text-xs cursor-pointer"
            >
              Tutup Ringkasan
            </button>
            {onViewInPurchasing && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewInPurchasing();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.35)] flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <span>Buka di Modul Purchasing</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
