import React, { useState, useEffect } from 'react';
import { CartItem, User } from '../../types';
import {
  ShieldAlert,
  X,
  Delete,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  ShoppingBag,
} from 'lucide-react';

interface SupervisorVoidModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CartItem | null;
  itemIndex: number | null;
  onApprove: (item: CartItem, index: number, supervisorName: string, reason: string) => void;
  isLight?: boolean;
  language?: 'ID' | 'EN';
  users?: User[];
}

const VOID_REASONS = [
  'Pelanggan Batal Beli',
  'Salah Scan / Item Ganda',
  'Kemasan / Barang Rusak',
  'Ganti Varian / Ukuran',
  'Salah Input Qty',
  'Lainnya',
];

export const SupervisorVoidModal: React.FC<SupervisorVoidModalProps> = ({
  isOpen,
  onClose,
  item,
  itemIndex,
  onApprove,
  isLight = false,
  language = 'ID',
  users = [],
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>(VOID_REASONS[0]);
  const [customNote, setCustomNote] = useState<string>('');

  const isEn = language === 'EN';

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMessage(null);
      setSelectedReason(VOID_REASONS[0]);
      setCustomNote('');
    }
  }, [isOpen]);

  // Keyboard shortcut listener for numeric input
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pinInput]);

  if (!isOpen || !item || itemIndex === null) return null;

  const handleKeyPress = (num: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + num;
      setPinInput(next);
      setErrorMessage(null);
      if (next.length === 4) {
        verifySupervisorPin(next);
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMessage(null);
  };

  const verifySupervisorPin = (pin: string) => {
    // 1. Check default dummy PINs
    let supervisorName: string | null = null;

    if (pin === '1234') {
      supervisorName = 'Supervisor Hendra (PIN 1234)';
    } else if (pin === '8888') {
      supervisorName = 'Supervisor Bambang (PIN 8888)';
    } else {
      // 2. Check registered users with Supervisor / Super Admin / Manager role
      const matchedUser = users.find(
        (u) =>
          u.pin === pin &&
          (u.role === 'Super Admin' ||
            u.role === 'Manager' ||
            (u.role as string) === 'Supervisor' ||
            (u.role as string) === 'Admin')
      );

      if (matchedUser) {
        supervisorName = `${matchedUser.name} (${matchedUser.role})`;
      }
    }

    if (supervisorName) {
      const fullReason =
        selectedReason === 'Lainnya' && customNote.trim()
          ? `Lainnya: ${customNote.trim()}`
          : customNote.trim()
          ? `${selectedReason} - ${customNote.trim()}`
          : selectedReason;

      onApprove(item, itemIndex, supervisorName, fullReason);
      onClose();
    } else {
      setErrorMessage(
        isEn
          ? 'Invalid Supervisor PIN. Use 1234 or 8888.'
          : 'PIN Supervisor tidak valid. Gunakan PIN 1234 atau 8888.'
      );
      setTimeout(() => {
        setPinInput('');
      }, 700);
    }
  };

  const lineSubtotal = item.subtotal || item.product.sell_price * item.quantity;

  return (
    <div
      id="modal-supervisor-void"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in"
    >
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 sm:p-6 relative overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
            : 'bg-[#161b22] border-[#30363d] text-white shadow-[0_25px_60px_rgba(0,0,0,0.9)]'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-xl transition cursor-pointer ${
            isLight
              ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              : 'text-gray-400 hover:text-white hover:bg-[#21262d]'
          }`}
          title={isEn ? 'Close' : 'Tutup'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isEn ? 'Supervisor Void Approval' : 'Otorisasi Void Supervisor'}</span>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40">
                Otoritas Khusus
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
              {isEn
                ? 'Item line cancellation requires supervisor PIN authorization'
                : 'Pembatalan item keranjang yang sudah di-scan memerlukan PIN Supervisor'}
            </p>
          </div>
        </div>

        {/* Item Details Card */}
        <div
          className={`p-3.5 rounded-xl border mb-4 space-y-1.5 ${
            isLight
              ? 'bg-rose-50/60 border-rose-200 text-slate-900'
              : 'bg-rose-950/20 border-rose-500/30 text-white'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] text-slate-500 dark:text-gray-400 font-bold">
              BARCODE / SKU: {item.product.barcode || item.product.plu || item.product.id}
            </span>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 font-mono">
              Item #{itemIndex + 1}
            </span>
          </div>

          <div className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
            {item.product.name}
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-rose-200/60 dark:border-rose-500/20 font-semibold">
            <span className="text-slate-600 dark:text-gray-300">
              {item.quantity} {item.product.unit || 'pcs'} × Rp{' '}
              {item.product.sell_price.toLocaleString('id-ID')}
            </span>
            <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
              Nilai Void: Rp {lineSubtotal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Reason Selection */}
        <div className="mb-4 space-y-1.5">
          <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>{isEn ? 'Void Reason:' : 'Alasan Pembatalan (Audit Log):'}</span>
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className={`w-full p-2 rounded-xl text-xs font-semibold border transition outline-none cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                : 'bg-[#0d1117] border-gray-700 text-white focus:border-cyan-400'
            }`}
          >
            {VOID_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* PIN Dots Indicator */}
        <div className="text-center mb-3">
          <div className="text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-2">
            {isEn ? 'ENTER 4-DIGIT SUPERVISOR PIN:' : 'MASUKKAN 4 DIGIT PIN SUPERVISOR:'}
          </div>
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((idx) => {
              const filled = idx < pinInput.length;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-150 ${
                    filled
                      ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)] scale-110'
                      : isLight
                      ? 'bg-slate-200 border border-slate-300'
                      : 'bg-[#21262d] border border-[#30363d]'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-3 text-center text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/30 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 animate-shake">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className={`h-11 rounded-xl font-bold text-lg border transition cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                  : 'bg-[#21262d] hover:bg-[#30363d] text-white border-[#30363d]'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className={`h-11 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                : 'bg-[#21262d]/60 hover:bg-[#21262d] text-gray-400 border-[#30363d]'
            }`}
          >
            CLEAR
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className={`h-11 rounded-xl font-bold text-lg border transition cursor-pointer active:scale-95 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                : 'bg-[#21262d] hover:bg-[#30363d] text-white border-[#30363d]'
            }`}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className={`h-11 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center ${
              isLight
                ? 'bg-slate-100 hover:bg-rose-100 text-rose-600 border-slate-300'
                : 'bg-[#21262d]/60 hover:bg-[#21262d] text-rose-400 border-[#30363d]'
            }`}
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Testing Dummy PIN Chips */}
        <div
          className={`pt-3 border-t text-[11px] ${
            isLight ? 'border-slate-200 text-slate-600' : 'border-[#30363d] text-gray-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-slate-800 dark:text-gray-300">
              {isEn ? 'Quick Supervisor Authorization:' : 'Otorisasi Cepat Supervisor (Demo):'}
            </span>
            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
              PIN: 1234 / 8888
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => verifySupervisorPin('1234')}
              className={`p-2 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-900'
                  : 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] text-white'
              }`}
            >
              <div>
                <div className="font-bold text-[11px] text-slate-900 dark:text-white">
                  Spv. Hendra
                </div>
                <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">PIN: 1234</div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => verifySupervisorPin('8888')}
              className={`p-2 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-900'
                  : 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] text-white'
              }`}
            >
              <div>
                <div className="font-bold text-[11px] text-slate-900 dark:text-white">
                  Spv. Bambang
                </div>
                <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">PIN: 8888</div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
