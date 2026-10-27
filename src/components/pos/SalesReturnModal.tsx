import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale, SalesReturnCondition } from '../../types';
import {
  RotateCcw,
  X,
  AlertTriangle,
  CheckCircle2,
  Package,
  Wallet,
  Building2,
  DollarSign,
  FileText,
  ShieldCheck,
  User,
  Clock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface SalesReturnModalProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isLight?: boolean;
}

interface ItemReturnState {
  productId: string;
  productName: string;
  barcode?: string;
  unitPrice: number;
  originalQty: number;
  alreadyReturnedQty: number;
  maxReturnableQty: number;
  returnQty: number;
  condition: SalesReturnCondition;
  reason: string;
  isSelected: boolean;
}

const COMMON_RETURN_REASONS = [
  'Barang Cacat / Rusak Pabrikasi',
  'Kemasan Rusak / Segel Terbuka',
  'Salah Varian / Salah Ukuran',
  'Produk Tidak Berfungsi Sesuai Ekspektasi',
  'Konsumen Berubah Pikiran (Bawa Nota)',
  'Salah Pembelian oleh Konsumen',
];

export const SalesReturnModal: React.FC<SalesReturnModalProps> = ({
  sale,
  isOpen,
  onClose,
  onSuccess,
  isLight = false,
}) => {
  const { activeShift, processSalesReturn, showToast } = useApp();

  // Hitung berapa kuantitas yang sudah pernah diretur pada nota ini
  const previouslyReturnedMap = useMemo(() => {
    const map = new Map<string, number>();
    if (sale.sales_returns) {
      sale.sales_returns.forEach((ret) => {
        ret.items.forEach((it) => {
          map.set(it.productId, (map.get(it.productId) || 0) + it.returnQty);
        });
      });
    }
    return map;
  }, [sale]);

  // Siapkan baris item untuk formulir retur
  const [returnItems, setReturnItems] = useState<ItemReturnState[]>(() => {
    if (!sale.items || sale.items.length === 0) return [];
    return sale.items.map((cartItem) => {
      const pId = cartItem.product.id;
      const originalQty = cartItem.quantity;
      const alreadyReturned = previouslyReturnedMap.get(pId) || 0;
      const maxReturnable = Math.max(0, originalQty - alreadyReturned);
      const unitPrice =
        cartItem.customPrice !== undefined ? cartItem.customPrice : cartItem.product.sell_price;

      return {
        productId: pId,
        productName: cartItem.product.name,
        barcode: cartItem.product.barcode || cartItem.product.plu,
        unitPrice,
        originalQty,
        alreadyReturnedQty: alreadyReturned,
        maxReturnableQty: maxReturnable,
        returnQty: maxReturnable > 0 ? 1 : 0,
        condition: 'GOOD' as SalesReturnCondition,
        reason: 'Salah Varian / Salah Ukuran',
        isSelected: maxReturnable > 0,
      };
    });
  });

  const [refundMethod, setRefundMethod] = useState<'CASH' | 'NON_CASH' | 'STORE_CREDIT'>('CASH');
  const [notes, setNotes] = useState<string>('Retur barang konsumen dengan nota resmi');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Toggle checklist item
  const handleToggleSelect = (pId: string) => {
    setReturnItems((prev) =>
      prev.map((it) => {
        if (it.productId === pId) {
          const nextSelected = !it.isSelected;
          return {
            ...it,
            isSelected: nextSelected,
            returnQty: nextSelected ? (it.returnQty > 0 ? it.returnQty : 1) : 0,
          };
        }
        return it;
      })
    );
  };

  // Update return quantity
  const handleQtyChange = (pId: string, qty: number) => {
    setReturnItems((prev) =>
      prev.map((it) => {
        if (it.productId === pId) {
          const clamped = Math.max(0, Math.min(qty, it.maxReturnableQty));
          return {
            ...it,
            returnQty: clamped,
            isSelected: clamped > 0,
          };
        }
        return it;
      })
    );
  };

  // Update condition
  const handleConditionChange = (pId: string, condition: SalesReturnCondition) => {
    setReturnItems((prev) =>
      prev.map((it) => {
        if (it.productId === pId) {
          return { ...it, condition };
        }
        return it;
      })
    );
  };

  // Update reason
  const handleReasonChange = (pId: string, reason: string) => {
    setReturnItems((prev) =>
      prev.map((it) => {
        if (it.productId === pId) {
          return { ...it, reason };
        }
        return it;
      })
    );
  };

  // Hitung total refund
  const selectedItems = returnItems.filter((it) => it.isSelected && it.returnQty > 0);
  const totalRefundAmount = selectedItems.reduce(
    (acc, it) => acc + it.returnQty * it.unitPrice,
    0
  );
  const totalReturnQty = selectedItems.reduce((acc, it) => acc + it.returnQty, 0);

  const goodCount = selectedItems.filter((it) => it.condition === 'GOOD').length;
  const damagedCount = selectedItems.filter((it) => it.condition === 'DAMAGED').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      showToast('Pilih minimal satu produk untuk diretur!');
      return;
    }

    if (totalRefundAmount <= 0) {
      showToast('Total nilai pengembalian dana harus lebih besar dari Rp 0!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = processSalesReturn({
        transactionId: sale.transaction_id,
        items: selectedItems.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          barcode: it.barcode,
          unitPrice: it.unitPrice,
          originalQty: it.originalQty,
          returnQty: it.returnQty,
          condition: it.condition,
          reason: it.reason,
        })),
        refundMethod,
        notes,
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses retur penjualan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl rounded-3xl p-5 sm:p-7 shadow-2xl relative border my-6 flex flex-col max-h-[92vh] ${
          isLight
            ? 'bg-white border-slate-300 text-slate-800'
            : 'bg-[#161b22] border-[#30363d] text-gray-100 shadow-[0_0_50px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-4 pb-3 border-b border-slate-700/40 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                APS POS4: 28_ReturPenjualan
              </span>
              <span className="text-xs text-gray-400 font-mono">
                Nota: {sale.receipt_number || sale.transaction_id}
              </span>
            </div>
            <h2
              className={`text-xl font-black tracking-tight mt-0.5 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Retur Penjualan Konsumen (Sales Return)
            </h2>
            <p className="text-xs text-gray-400">
              Verifikasi item retur, kondisi fisik barang (Masuk Stok vs Karantina), dan pengembalian dana (Refund).
            </p>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Metadata Nota Penjualan */}
          <div
            className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl border text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
            }`}
          >
            <div>
              <span className="text-[10px] text-gray-400 block font-medium">Tanggal Transaksi</span>
              <span className="font-mono text-gray-200 block">{sale.created_at || sale.date}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-medium">Terminal & Kasir</span>
              <span className="font-bold truncate text-slate-800 dark:text-white block font-mono">
                {sale.terminal_name} • {sale.cashier_name || sale.cashier_id}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-medium">Pelanggan</span>
              <span className="font-bold text-sky-400 block truncate">
                {sale.customer_name || 'Pelanggan Umum (Walk-in)'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-medium">Total Nilai Pembelian</span>
              <span className="font-mono font-black text-emerald-400 block">
                Rp {sale.total_amount.toLocaleString('id-ID')} ({sale.payment_method})
              </span>
            </div>
          </div>

          {/* Daftar Produk untuk Diretur */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Pilih Item yang Diretur & Tentukan Kondisi</span>
              </label>
              <span className="text-[11px] text-gray-400">
                Pilih checklist produk yang ingin dikembalikan oleh konsumen
              </span>
            </div>

            {returnItems.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-gray-600 text-center text-gray-400">
                Tidak ada rincian item produk yang dapat diretur pada transaksi ini.
              </div>
            ) : (
              <div className="space-y-3">
                {returnItems.map((item) => {
                  const isExhausted = item.maxReturnableQty <= 0;
                  return (
                    <div
                      key={item.productId}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        item.isSelected
                          ? isLight
                            ? 'bg-amber-50/60 border-amber-300 shadow-sm'
                            : 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 opacity-75'
                          : 'bg-[#0d1117] border-[#30363d] opacity-75'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {/* Checkbox & Info Produk */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            disabled={isExhausted}
                            checked={item.isSelected}
                            onChange={() => handleToggleSelect(item.productId)}
                            className="w-4 h-4 mt-1 rounded text-amber-500 focus:ring-amber-400 border-gray-600 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {item.productName}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                              <span className="font-mono">Barcode: {item.barcode || item.productId}</span>
                              <span>•</span>
                              <span>Harga Beli: Rp {item.unitPrice.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px]">
                              <span className="px-2 py-0.5 rounded bg-gray-500/15 border border-gray-500/30 text-gray-300 font-mono">
                                Qty Beli: {item.originalQty}
                              </span>
                              {item.alreadyReturnedQty > 0 && (
                                <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono">
                                  Pernah Diretur: {item.alreadyReturnedQty}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono font-bold">
                                Max Retur: {item.maxReturnableQty}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Input Qty Retur */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <div className="text-right mr-1">
                            <span className="text-[10px] text-gray-400 block">Qty Retur</span>
                            <div className="flex items-center border rounded-xl overflow-hidden bg-slate-900/60 border-slate-700">
                              <button
                                type="button"
                                disabled={!item.isSelected || item.returnQty <= 1}
                                onClick={() => handleQtyChange(item.productId, item.returnQty - 1)}
                                className="px-2.5 py-1 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={item.maxReturnableQty}
                                disabled={!item.isSelected || isExhausted}
                                value={item.returnQty}
                                onChange={(e) =>
                                  handleQtyChange(item.productId, Number(e.target.value) || 0)
                                }
                                className="w-12 text-center text-xs font-mono font-bold text-white bg-transparent outline-none py-1"
                              />
                              <button
                                type="button"
                                disabled={
                                  !item.isSelected || item.returnQty >= item.maxReturnableQty
                                }
                                onClick={() => handleQtyChange(item.productId, item.returnQty + 1)}
                                className="px-2.5 py-1 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Subtotal Refund Item */}
                          <div className="text-right min-w-[110px]">
                            <span className="text-[10px] text-gray-400 block">Refund Item</span>
                            <span className="font-mono font-bold text-sm text-emerald-400">
                              Rp {(item.returnQty * item.unitPrice).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detail Kondisi & Alasan Retur (Jika item dipilih) */}
                      {item.isSelected && item.returnQty > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Kondisi Fisik Barang */}
                          <div>
                            <label className="text-[11px] font-bold text-gray-300 block mb-1">
                              Pilihan Kondisi Barang Retur:
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleConditionChange(item.productId, 'GOOD')}
                                className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-start gap-2 transition cursor-pointer ${
                                  item.condition === 'GOOD'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/30'
                                    : 'border-slate-700 text-gray-400 hover:border-slate-500'
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <div className="text-left">
                                  <span className="block font-black text-xs text-emerald-400">Kondisi Baik</span>
                                  <span className="text-[10px] text-gray-400 block font-normal mt-0.5">
                                    (masuk kembali ke stok jual)
                                  </span>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleConditionChange(item.productId, 'DAMAGED')}
                                className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-start gap-2 transition cursor-pointer ${
                                  item.condition === 'DAMAGED'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm ring-1 ring-rose-500/30'
                                    : 'border-slate-700 text-gray-400 hover:border-slate-500'
                                }`}
                              >
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <div className="text-left">
                                  <span className="block font-black text-xs text-rose-400">Kondisi Rusak/BS</span>
                                  <span className="text-[10px] text-gray-400 block font-normal mt-0.5">
                                    (masuk ke karantina/retur supplier)
                                  </span>
                                </div>
                              </button>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1.5 block">
                              {item.condition === 'GOOD'
                                ? '✓ Kondisi Baik: Menambah kembali stok jual di gudang & otomatis menyesuaikan HPP.'
                                : '⚠️ Kondisi Rusak/BS: Masuk karantina/retur supplier (stok jual tidak bertambah).'}
                            </span>
                          </div>

                          {/* Alasan Retur */}
                          <div>
                            <label className="text-[11px] font-bold text-gray-300 block mb-1">
                              Alasan Pengembalian:
                            </label>
                            <select
                              value={item.reason}
                              onChange={(e) => handleReasonChange(item.productId, e.target.value)}
                              className={`w-full px-2.5 py-2 rounded-xl border text-xs outline-none transition font-medium ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-800'
                                  : 'bg-[#0d1117] border-[#30363d] text-white'
                              }`}
                            >
                              {COMMON_RETURN_REASONS.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Opsi Metode Refund & SOP Laci Kasir */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Metode Pengembalian Dana (Refund)</span>
              </label>
              <span className="text-[11px] text-gray-400">Pilih kanal pengeluaran kas refund</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Tunai / Kasir Laci */}
              <button
                type="button"
                onClick={() => setRefundMethod('CASH')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  refundMethod === 'CASH'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'border-slate-700 text-gray-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs mb-1">
                  <span>Tunai (Kas Laci)</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-[10px] text-gray-400">
                  Potong langsung dari laci kasir shift aktif (Petty Cash refund)
                </div>
              </button>

              {/* Transfer / QRIS */}
              <button
                type="button"
                onClick={() => setRefundMethod('NON_CASH')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  refundMethod === 'NON_CASH'
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-sm'
                    : 'border-slate-700 text-gray-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs mb-1">
                  <span>Transfer / Rekening</span>
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-[10px] text-gray-400">
                  Dikeluarkan dari rekening bank operasional / QRIS gateway
                </div>
              </button>

              {/* Voucher Belanja / Store Credit */}
              <button
                type="button"
                onClick={() => setRefundMethod('STORE_CREDIT')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  refundMethod === 'STORE_CREDIT'
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-sm'
                    : 'border-slate-700 text-gray-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs mb-1">
                  <span>Voucher / Store Credit</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-[10px] text-gray-400">
                  Kredit saldo belanja untuk transaksi berikutnya
                </div>
              </button>
            </div>

            {/* Shift Kasir Warning jika Tunai */}
            {refundMethod === 'CASH' && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  {activeShift ? (
                    <span>
                      <strong>Shift Kasir Terdeteksi (#{activeShift.id}):</strong> Estimasi kas laci
                      saat ini Rp {activeShift.expectedCashInDrawer.toLocaleString('id-ID')}. Total
                      kas laci akan otomatis berkurang sebesar nominal refund (Rp{' '}
                      {totalRefundAmount.toLocaleString('id-ID')}).
                    </span>
                  ) : (
                    <span>
                      <strong>Perhatian:</strong> Tidak ada shift kasir yang aktif saat ini.
                      Pengeluaran refund akan tetap dicatat ke modul Finance & Accounting sebagai
                      beban kas keluar.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Catatan Tambahan */}
            <div>
              <label className="text-[11px] font-bold text-gray-300 block mb-1">
                Catatan Petugas Kasir (Opsional):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Konsumen melampirkan struk asli, barang kondisi mulus"
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none font-medium transition ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800'
                    : 'bg-[#0d1117] border-[#30363d] text-white'
                }`}
              />
            </div>
          </div>

          {/* Card Kewajiban Pengeluaran Kasir (Refund Payout) */}
          <div
            className={`p-4 rounded-2xl border ${
              isLight
                ? 'bg-rose-50 border-rose-300 text-slate-900 shadow-sm'
                : 'bg-rose-950/20 border-rose-500/40 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">
                    Kewajiban Pengeluaran Kasir
                  </span>
                  <div className="font-black text-sm text-slate-900 dark:text-white mt-0.5">
                    Nominal Uang Pengembalian Dana (Refund) yang Wajib Dikeluarkan dari Kasir:
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {refundMethod === 'CASH'
                      ? 'Kasir wajib menyerahkan uang fisik laci kasir kepada konsumen (saldo kas laci shift aktif otomatis terpotong).'
                      : `Pengembalian dana diproses via kanal ${refundMethod}.`}
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0 bg-rose-500/15 border border-rose-500/30 px-4 py-2.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-rose-300 block tracking-wider">
                  Nominal Wajib Refund
                </span>
                <span className="text-2xl font-black font-mono text-rose-400 block">
                  Rp {totalRefundAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Ringkasan Rekapitulasi Refund */}
          <div
            className={`p-4 rounded-2xl border ${
              isLight
                ? 'bg-amber-50 border-amber-300 text-slate-900'
                : 'bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/40 text-white'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                  Total Nilai Pengembalian Dana (Refund) Wajib Keluar
                </span>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                  Rp {totalRefundAmount.toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-2">
                  <span>{totalReturnQty} item dipilih</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">{goodCount} Kondisi Baik (Masuk Stok Jual)</span>
                  <span>•</span>
                  <span className="text-rose-400 font-medium">{damagedCount} Kondisi Rusak/BS (Karantina)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-gray-600 hover:bg-gray-800 text-gray-300 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-confirm-sales-return"
                  type="submit"
                  disabled={isSubmitting || selectedItems.length === 0}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 disabled:opacity-40 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memproses...' : 'Konfirmasi Retur & Refund Dana'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
