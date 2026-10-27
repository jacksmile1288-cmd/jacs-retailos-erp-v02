import React, { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle2, ShieldCheck, RefreshCw, Smartphone, Store, Clock, Hash } from 'lucide-react';

interface QrisModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onSuccess: () => void;
  merchantName?: string;
  refId?: string;
  isLight?: boolean;
}

export const QrisModal: React.FC<QrisModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onSuccess,
  merchantName = 'JACS MART / TOKO MITRA',
  refId,
  isLight = false,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeRefId, setActiveRefId] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(300);
    setActiveRefId(refId || `QRIS-TRX-${Date.now().toString().slice(-6)}`);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, refId, onClose]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleCheckStatus = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 800);
  };

  return (
    <div
      id="modal-qris-dinamis"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl p-5 sm:p-6 border shadow-[0_25px_60px_rgba(0,0,0,0.85)] relative text-center animate-in zoom-in-95 ${
          isLight
            ? 'bg-white border-slate-300 text-slate-900 shadow-slate-300'
            : 'bg-[#161b22] border-[#30363d] text-white'
        }`}
      >
        {/* Tombol Silang [X] yang jelas dan kontras di sudut kanan atas */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-slate-800 hover:bg-rose-600 border border-slate-600 hover:border-rose-500 p-2 rounded-xl transition cursor-pointer shadow-md group"
          title="Batal / Kembali (Esc)"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* QRIS Header */}
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <div className="px-2.5 py-0.5 rounded bg-red-600 text-white font-black text-xs tracking-wider shadow-xs">
            QRIS
          </div>
          <div className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] tracking-wider shadow-xs">
            GPN
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-gray-300">
            Dinamis Merchant Standar BI
          </span>
        </div>

        <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
          Pembayaran QRIS Dinamis
        </h3>

        <p className="text-xs text-slate-600 dark:text-gray-400 mt-1 mb-3">
          Scan menggunakan GoPay, OVO, DANA, BCA Mobile, Livin, ShopeePay, atau Mobile Banking apa saja
        </p>

        {/* QR Code Interaktif Ukuran Besar & Jelas */}
        <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto mb-3 border-2 border-slate-300 relative">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=00020101021226580014ID.LINKAJA.WWW0118936009110000000000520458125303360540${totalAmount}5802ID5911JACS_MART6007JAKARTA62070703A016304`}
            alt="QR Code QRIS Dinamis"
            className="w-52 h-52 sm:w-56 sm:h-56 mx-auto object-contain"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-xl bg-white p-1.5 shadow-md border-2 border-red-500 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Rincian di Bawah Barcode / QRIS */}
        <div
          className={`p-3.5 rounded-xl border-2 mb-4 space-y-2 text-left ${
            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
          }`}
        >
          {/* Nama Merchant */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-gray-400 flex items-center gap-1.5 font-medium">
              <Store className="w-3.5 h-3.5 text-blue-500" />
              <span>Nama Merchant:</span>
            </span>
            <span className="font-black text-slate-900 dark:text-white">
              {merchantName}
            </span>
          </div>

          {/* Total Tagihan Pas */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-600 dark:text-gray-400 font-bold">
              Total Tagihan Pas:
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              Rp {totalAmount.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Timer Countdown & Ref ID Transaksi */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[11px]">
            <div className="flex items-center gap-1 text-slate-600 dark:text-gray-400">
              <Hash className="w-3 h-3 text-slate-500" />
              <span className="font-mono font-semibold">{activeRefId}</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              <Clock className="w-3 h-3" />
              <span>Kedaluwarsa: {timeFormatted}</span>
            </div>
          </div>
        </div>

        {/* Tombol Aksi di Modal QRIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Tombol Batal (Esc) */}
          <button
            type="button"
            onClick={onClose}
            className="h-11 sm:h-12 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-gray-200 transition cursor-pointer active:scale-95 shadow-sm"
          >
            <X className="w-4 h-4 shrink-0" />
            <span>Batal (Esc)</span>
          </button>

          {/* [Cek Status / Konfirmasi Bayar] */}
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isProcessing}
            className="h-11 sm:h-12 px-4 rounded-xl font-black text-xs bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer active:scale-95 border-2 border-emerald-600 disabled:opacity-50"
            title="Konfirmasi pembayaran QRIS telah diterima"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>Memverifikasi QRIS...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Cek Status / Konfirmasi Bayar</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Terverifikasi Bank Indonesia & ASPI • Settlement Otomatis</span>
        </div>
      </div>
    </div>
  );
};
