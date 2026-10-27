import React from 'react';
import { PurchaseOrder } from '../../types';
import {
  X,
  Zap,
  CheckCircle2,
  Building2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Printer,
  Eye,
} from 'lucide-react';

interface AutoReorderSummaryModalProps {
  pos: PurchaseOrder[];
  onClose: () => void;
  onOpenPoDetail: (po: PurchaseOrder) => void;
  onOpenPrint: (po: PurchaseOrder) => void;
  onGoToExecutive?: () => void;
  isLight?: boolean;
}

export const AutoReorderSummaryModal: React.FC<AutoReorderSummaryModalProps> = ({
  pos,
  onClose,
  onOpenPoDetail,
  onOpenPrint,
  onGoToExecutive,
  isLight = false,
}) => {
  const totalAmountAllPos = pos.reduce((acc, p) => acc + p.total_amount, 0);
  const totalItemsCount = pos.reduce(
    (acc, p) => acc + (p.item_details ? p.item_details.length : 1),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className={`w-full max-w-3xl rounded-2xl p-6 shadow-2xl relative border my-8 max-h-[92vh] flex flex-col ${
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
        <div className="flex items-center gap-3 pb-4 border-b border-[#30363d] shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.35)]">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3
                className={`font-black text-lg ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Auto-Generate Purchase Order Berhasil
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/30">
                {pos.length} Draf PO Diterbitkan
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Integrasi Gudang (Warehouse) $\rightarrow$ Pengadaan (Purchasing): Produk kritis otomatis dikelompokkan berdasarkan supplier utama.
            </p>
          </div>
        </div>

        {/* Summary Metric Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 shrink-0">
          <div
            className={`p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
            }`}
          >
            <div className="text-[11px] text-gray-400">Total Draf PO Diterbitkan</div>
            <div className="text-lg font-black font-mono text-amber-400 mt-0.5">
              {pos.length} Berkas PO
            </div>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
            }`}
          >
            <div className="text-[11px] text-gray-400">Jumlah SKU Di-restock</div>
            <div className="text-lg font-black font-mono text-sky-400 mt-0.5">
              {totalItemsCount} SKU Kritis
            </div>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
            }`}
          >
            <div className="text-[11px] text-gray-400">Estimasi Nilai Pengadaan</div>
            <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
              Rp {totalAmountAllPos.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* List of Generated POs */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
          <div className="font-bold text-gray-300 uppercase tracking-wider text-[11px]">
            Rincian Dokumen PO Berdasarkan Rekanan Vendor:
          </div>

          {pos.map((po, idx) => {
            const isDirectorApproval =
              po.status === 'Menunggu Approval Direksi' || po.total_amount > 20000000;

            return (
              <div
                key={po.po_number || idx}
                className={`p-4 rounded-xl border transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    : 'bg-[#0d1117] border-[#30363d] hover:border-gray-600'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-400 text-sm">
                      {po.po_number}
                    </span>
                    <span className="font-semibold text-white">
                      • {po.supplier_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isDirectorApproval ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-purple-400" />
                        <span>Approval Direksi (&gt; Rp 20 Jt)</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {po.status}
                      </span>
                    )}

                    <span className="font-mono font-bold text-emerald-400 text-sm ml-2">
                      Rp {po.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Items in this PO */}
                <div className="space-y-1 pt-2 border-t border-gray-800">
                  {po.item_details && po.item_details.length > 0 ? (
                    po.item_details.map((it, itIdx) => (
                      <div
                        key={itIdx}
                        className="flex items-center justify-between text-gray-300 text-[11px]"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-mono text-cyan-400 font-bold text-[10px]">
                            {it.product_id}
                          </span>
                          <span className="truncate">{it.product_name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 font-mono">
                          <span className="text-amber-400 font-bold">
                            +{it.qty} {it.unit || 'Unit'}
                          </span>
                          <span className="text-gray-400">
                            @ Rp {it.unit_cost.toLocaleString('id-ID')}
                          </span>
                          <span className="text-white font-bold w-24 text-right">
                            Rp {it.subtotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400">{po.items}</div>
                  )}
                </div>

                {/* Action Buttons for this PO */}
                <div className="mt-3 pt-2.5 border-t border-gray-800 flex items-center justify-between text-gray-400 text-[11px]">
                  <span>
                    Termin: {po.payment_term || 'Tempo 30 Hari'} • Due Date: {po.due_date || '-'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenPrint(po)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Cetak PO</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenPoDetail(po)}
                      className="px-2.5 py-1 rounded-lg bg-[#0052FF]/20 hover:bg-[#0052FF]/30 text-[#0052FF] border border-[#0052FF]/40 flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Buka Detail PO</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-[#30363d] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-gray-400">
            Draf PO telah disimpan ke database Purchasing dan disinkronkan ke Antrean Persetujuan Pimpinan.
          </div>

          <div className="flex items-center gap-2">
            {onGoToExecutive && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToExecutive();
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Lihat Antrean Approval Eksekutif</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#0052FF] hover:bg-[#0043d1] text-white font-bold text-xs transition cursor-pointer shadow-sm"
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
