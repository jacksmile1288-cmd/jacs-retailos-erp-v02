import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CashierShift } from '../../types';
import { resolveSynchronizedTerminalDisplayName } from '../../utils/terminalConfigUtils';
import {
  Clock,
  X,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calculator,
  Coins,
  Banknote,
  ArrowRight,
  ShieldCheck,
  Building2,
  DollarSign,
  TrendingUp,
  Receipt,
  Scale,
  Sparkles,
} from 'lucide-react';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftClosed: (closedShift: CashierShift) => void;
  isLight?: boolean;
}

const BANKNOTE_DENOMINATIONS = [
  { label: 'Rp 100.000', value: 100000, desc: 'Pecahan Seratus Ribu' },
  { label: 'Rp 50.000', value: 50000, desc: 'Pecahan Lima Puluh Ribu' },
  { label: 'Rp 20.000', value: 20000, desc: 'Pecahan Dua Puluh Ribu' },
  { label: 'Rp 10.000', value: 10000, desc: 'Pecahan Sepuluh Ribu' },
  { label: 'Rp 5.000', value: 5000, desc: 'Pecahan Lima Ribu' },
  { label: 'Rp 2.000', value: 2000, desc: 'Pecahan Dua Ribu' },
  { label: 'Rp 1.000', value: 1000, desc: 'Pecahan Seribu Kertas' },
];

const COIN_DENOMINATIONS = [
  { label: 'Rp 1.000 (Koin)', value: 1000, desc: 'Koin Logam Seribu' },
  { label: 'Rp 500 (Koin)', value: 500, desc: 'Koin Logam Lima Ratus' },
  { label: 'Rp 200 (Koin)', value: 200, desc: 'Koin Logam Dua Ratus' },
  { label: 'Rp 100 (Koin)', value: 100, desc: 'Koin Logam Seratus' },
];

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  isOpen,
  onClose,
  onShiftClosed,
  isLight = false,
}) => {
  const {
    activeShift,
    closeCashierShift,
    activeUser,
    showToast,
    activeSector,
    businessDomainConfig,
    businessProfile,
  } = useApp();

  const [inputMode, setInputMode] = useState<'DENOMINATIONS' | 'DIRECT'>('DENOMINATIONS');
  const [denomTab, setDenomTab] = useState<'ALL' | 'BANKNOTES' | 'COINS'>('ALL');
  const [isClosingShift, setIsClosingShift] = useState(false);

  // Counts of banknotes
  const [banknoteCounts, setBanknoteCounts] = useState<Record<number, number>>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
  });

  // Counts of coins
  const [coinCounts, setCoinCounts] = useState<Record<number, number>>({
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
  });

  // Additional custom coin total sum
  const [otherCoinsAmount, setOtherCoinsAmount] = useState<number>(0);

  // Direct manual total cash
  const [manualActualCash, setManualActualCash] = useState<number>(0);

  const [notes, setNotes] = useState<string>(
    'Penutupan shift kasir reguler. Fisik kas laci telah dihitung teliti.'
  );
  const [isBlindSubmitted, setIsBlindSubmitted] = useState<boolean>(false);

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen && activeShift) {
      setManualActualCash(activeShift.expectedCashInDrawer || 0);
      setBanknoteCounts({
        100000: 0,
        50000: 0,
        20000: 0,
        10000: 0,
        5000: 0,
        2000: 0,
        1000: 0,
      });
      setCoinCounts({
        1000: 0,
        500: 0,
        200: 0,
        100: 0,
      });
      setOtherCoinsAmount(0);
      setNotes('Penutupan shift kasir reguler. Fisik kas laci telah dihitung teliti.');
      setIsBlindSubmitted(false);
    }
  }, [isOpen, activeShift]);

  // Banknotes sum and sheets count
  const { totalBanknotesAmount, totalBanknotesSheets } = useMemo(() => {
    let amount = 0;
    let sheets = 0;
    Object.entries(banknoteCounts).forEach(([valStr, count]) => {
      const v = Number(valStr);
      const c = Number(count) || 0;
      amount += v * c;
      sheets += c;
    });
    return { totalBanknotesAmount: amount, totalBanknotesSheets: sheets };
  }, [banknoteCounts]);

  // Coins sum and pieces count
  const { totalCoinsAmount, totalCoinsPieces } = useMemo(() => {
    let amount = Number(otherCoinsAmount) || 0;
    let pieces = 0;
    Object.entries(coinCounts).forEach(([valStr, count]) => {
      const v = Number(valStr);
      const c = Number(count) || 0;
      amount += v * c;
      pieces += c;
    });
    return { totalCoinsAmount: amount, totalCoinsPieces: pieces };
  }, [coinCounts, otherCoinsAmount]);

  const totalCalculatedFromDenom = totalBanknotesAmount + totalCoinsAmount;

  if (!isOpen || !activeShift) return null;

  // Expected Cash calculation: Opening Float + Total Cash Sales - Total Expenses
  const openingFloat = activeShift.initialCash || 0;
  const netCashSales = activeShift.totalCashSales || 0;
  const cashReturns = activeShift.totalSalesReturnCash || 0;
  const grossCashSales = netCashSales + cashReturns;
  const expenses = activeShift.totalExpenses || 0;
  const expectedCash = activeShift.expectedCashInDrawer;

  const actualCash =
    inputMode === 'DENOMINATIONS' ? totalCalculatedFromDenom : manualActualCash;

  const difference = actualCash - expectedCash;

  // Strict status matching user specification: 'Seimbang', 'Lebih (Surplus)', atau 'Kurang (Shortage)'
  const status: 'Seimbang' | 'Lebih (Surplus)' | 'Kurang (Shortage)' =
    difference === 0 ? 'Seimbang' : difference > 0 ? 'Lebih (Surplus)' : 'Kurang (Shortage)';

  const isBalance = difference === 0;
  const isSurplus = difference > 0;
  const isShortage = difference < 0;

  const handleBanknoteChange = (val: number, count: number) => {
    setBanknoteCounts((prev) => ({
      ...prev,
      [val]: Math.max(0, count || 0),
    }));
  };

  const handleCoinChange = (val: number, count: number) => {
    setCoinCounts((prev) => ({
      ...prev,
      [val]: Math.max(0, count || 0),
    }));
  };

  // Helper to auto-fill denominations to match expected cash (useful for testing & quick balancing)
  const handleAutoFillExpected = () => {
    let remaining = expectedCash;
    const newBanknotes: Record<number, number> = {
      100000: 0,
      50000: 0,
      20000: 0,
      10000: 0,
      5000: 0,
      2000: 0,
      1000: 0,
    };
    const newCoins: Record<number, number> = {
      1000: 0,
      500: 0,
      200: 0,
      100: 0,
    };

    [100000, 50000, 20000, 10000, 5000, 2000, 1000].forEach((v) => {
      if (remaining >= v) {
        const count = Math.floor(remaining / v);
        newBanknotes[v] = count;
        remaining -= count * v;
      }
    });

    [1000, 500, 200, 100].forEach((v) => {
      if (remaining >= v) {
        const count = Math.floor(remaining / v);
        newCoins[v] = count;
        remaining -= count * v;
      }
    });

    setBanknoteCounts(newBanknotes);
    setCoinCounts(newCoins);
    setOtherCoinsAmount(remaining);
    setManualActualCash(expectedCash);
    showToast('Hitungan pecahan fisik diisi otomatis sesuai ekspektasi kas sistem.');
  };

  const handleConfirmClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosingShift) return;
    setIsClosingShift(true);
    try {
      // Build denomination breakdown record
      const denominationBreakdown: Record<string, number> = {
        '100000_kertas': banknoteCounts[100000] || 0,
        '50000_kertas': banknoteCounts[50000] || 0,
        '20000_kertas': banknoteCounts[20000] || 0,
        '10000_kertas': banknoteCounts[10000] || 0,
        '5000_kertas': banknoteCounts[5000] || 0,
        '2000_kertas': banknoteCounts[2000] || 0,
        '1000_kertas': banknoteCounts[1000] || 0,
        '1000_koin': coinCounts[1000] || 0,
        '500_koin': coinCounts[500] || 0,
        '200_koin': coinCounts[200] || 0,
        '100_koin': coinCounts[100] || 0,
        koin_lainnya_total: otherCoinsAmount || 0,
      };

      const result = closeCashierShift(actualCash, notes, denominationBreakdown);
      onShiftClosed(result.shift);
      onClose();
    } catch (err: any) {
      setIsClosingShift(false);
      showToast(err.message || 'Gagal menutup shift kasir');
    }
  };

  return (
    <div
      id="modal-close-shift"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-3xl rounded-2xl p-5 sm:p-6 shadow-2xl relative border my-4 sm:my-8 flex flex-col max-h-[94vh] ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-900'
            : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-white'
        }`}
      >
        {/* Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500" />

        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-xl transition cursor-pointer ${
            isLight
              ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)] shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-normal tracking-wide px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 uppercase">
                Cash Drawer Closing
              </span>
              <span className="text-xs font-mono font-normal text-slate-500 dark:text-slate-400">
                Shift #{activeShift.id} •{' '}
                {resolveSynchronizedTerminalDisplayName(
                  activeShift.stationCode || activeShift.terminalId || activeShift.terminalName,
                  activeSector,
                  businessDomainConfig?.primaryBusinessModel || businessProfile?.businessType
                )}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-medium tracking-tight mt-0.5 text-slate-900 dark:text-white">
              Rekonsiliasi Kas Akhir Shift (Cash Drawer Closing)
            </h2>
            <p className="text-xs leading-5 font-normal text-slate-500 dark:text-slate-400">
              Form input uang fisik laci (kertas & koin), perbandingan otomatis dengan sistem, dan pembukuan Finance.
            </p>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Metadata Kasir & Waktu */}
          <div
            className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl border ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-[#0d1117] border-[#30363d] text-gray-200'
            }`}
          >
            <div>
              <span className="text-[10px] text-slate-500 dark:text-gray-400 block font-semibold">
                Kasir Bertugas
              </span>
              <span className="font-bold text-slate-900 dark:text-white truncate block">
                {activeShift.cashierName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-gray-400 block font-semibold">
                Terminal POS
              </span>
              <span className="font-bold text-slate-900 dark:text-white truncate block font-mono">
                {resolveSynchronizedTerminalDisplayName(
                  activeShift.stationCode || activeShift.terminalId || activeShift.terminalName,
                  activeSector,
                  businessDomainConfig?.primaryBusinessModel || businessProfile?.businessType
                )}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-gray-400 block font-semibold">
                Waktu Buka Shift
              </span>
              <span className="font-mono text-slate-700 dark:text-gray-300 block">
                {activeShift.startTime}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-gray-400 block font-semibold">
                Total Transaksi
              </span>
              <span className="font-bold text-blue-600 dark:text-cyan-400 block font-mono">
                {activeShift.totalTransactionsCount} Nota Penjualan
              </span>
            </div>
          </div>

          {/* 1. PERHITUNGAN SISTEM (Kas Awal + Penjualan Tunai - Retur Tunai - Kas Keluar) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Rekapitulasi Kas Sistem (Expected System Cash)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-gray-400">
                Formula: Kas Awal + Penjualan Tunai - Retur Tunai - Kas Keluar
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* Saldo Kas Awal (Opening Float) */}
              <div
                className={`p-3 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="text-[10px] text-slate-600 dark:text-gray-400 font-bold uppercase">
                  (+) Kas Awal
                </div>
                <div className={`text-sm font-black font-mono mt-1 ${isBlindSubmitted ? 'text-slate-900 dark:text-white' : 'text-amber-500'}`}>
                  {isBlindSubmitted ? `Rp ${openingFloat.toLocaleString('id-ID')}` : 'Terkunci'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-gray-500 mt-0.5">
                  Modal awal laci
                </div>
              </div>

              {/* Total Penjualan Tunai Sistem (Kotor / Gross) */}
              <div
                className={`p-3 rounded-2xl border ${
                  isLight ? 'bg-emerald-50/70 border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/40'
                }`}
              >
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">
                  (+) Penjualan Tunai (Gross)
                </div>
                <div className={`text-sm font-black font-mono mt-1 ${isBlindSubmitted ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-500'}`}>
                  {isBlindSubmitted ? `Rp ${grossCashSales.toLocaleString('id-ID')}` : 'Terkunci'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-gray-500 mt-0.5">
                  Penerimaan kotor
                </div>
              </div>

              {/* Total Retur Tunai */}
              <div
                className={`p-3 rounded-2xl border ${
                  isLight ? 'bg-amber-50/70 border-amber-300' : 'bg-amber-950/20 border-amber-500/40'
                }`}
              >
                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase">
                  (-) Retur Tunai
                </div>
                <div className={`text-sm font-black font-mono mt-1 ${isBlindSubmitted ? 'text-amber-700 dark:text-amber-400' : 'text-amber-500'}`}>
                  {isBlindSubmitted ? `-Rp ${cashReturns.toLocaleString('id-ID')}` : 'Terkunci'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-gray-500 mt-0.5">
                  Refund pelanggan
                </div>
              </div>

              {/* Kas Keluar / Petty Cash */}
              <div
                className={`p-3 rounded-2xl border ${
                  isLight ? 'bg-rose-50/70 border-rose-300' : 'bg-rose-950/20 border-rose-500/40'
                }`}
              >
                <div className="text-[10px] text-rose-700 dark:text-rose-400 font-bold uppercase">
                  (-) Kas Keluar
                </div>
                <div className={`text-sm font-black font-mono mt-1 ${isBlindSubmitted ? 'text-rose-700 dark:text-rose-400' : 'text-amber-500'}`}>
                  {isBlindSubmitted ? `-Rp ${expenses.toLocaleString('id-ID')}` : 'Terkunci'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-gray-500 mt-0.5">
                  {activeShift.expenses.length}x Petty cash
                </div>
              </div>

              {/* Estimasi Kas Sistem yang Diharapkan */}
              <div
                className={`p-3 rounded-2xl border shadow-sm ${
                  isBlindSubmitted
                    ? isLight ? 'bg-blue-50 border-blue-400 text-blue-950' : 'bg-blue-500/15 border-blue-500/50 text-white'
                    : isLight ? 'bg-amber-50 border-amber-400 text-amber-950' : 'bg-amber-500/15 border-amber-500/50 text-white'
                }`}
              >
                <div className={`text-[10px] font-black uppercase ${isBlindSubmitted ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'}`}>
                  (=) Estimasi Kas Sistem
                </div>
                <div className={`font-mono mt-0.5 ${isBlindSubmitted ? 'text-base font-black text-blue-800 dark:text-blue-300' : 'text-xs font-medium text-amber-800 dark:text-amber-300'}`}>
                  {isBlindSubmitted ? `Rp ${expectedCash.toLocaleString('id-ID')}` : 'Terkunci - Input Hitungan Fisik Terlebih Dahulu'}
                </div>
                <div className={`text-[10px] mt-0.5 font-medium ${isBlindSubmitted ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {isBlindSubmitted ? 'Kas wajib setor' : 'Blind Shift Closing Aktif'}
                </div>
              </div>
            </div>
          </div>

          {/* Non-Cash Information Banner */}
          {activeShift.totalNonCashSales > 0 && (
            <div
              className={`flex items-center justify-between p-2.5 rounded-xl border text-[11px] ${
                isLight
                  ? 'bg-purple-50 border-purple-200 text-purple-900'
                  : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
              }`}
            >
              <span className="font-semibold">
                Total Omzet Non-Tunai Shift Ini (QRIS Dinamis, Kartu Debit/Kredit, Transfer Bank):
              </span>
              <span className="font-mono font-black text-xs">
                Rp {activeShift.totalNonCashSales.toLocaleString('id-ID')}
              </span>
            </div>
          )}

          {/* 2. FORM INPUT UANG FISIK LACI (Pecahan Kertas & Koin) */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900'
                : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <label className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>2. Input Uang Fisik Laci (Actual Cash in Drawer)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-600 dark:text-gray-400">
                  Hitung fisik uang kertas dan koin yang ada di cash drawer saat penutupan shift.
                </p>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-200 dark:bg-[#0d1117] p-0.5 rounded-xl border border-slate-300 dark:border-[#30363d]">
                  <button
                    type="button"
                    onClick={() => setInputMode('DENOMINATIONS')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      inputMode === 'DENOMINATIONS'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Calculator className="w-3 h-3" />
                    <span>Pecahan Kertas & Koin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('DIRECT')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      inputMode === 'DIRECT'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Wallet className="w-3 h-3" />
                    <span>Total Langsung</span>
                  </button>
                </div>
              </div>
            </div>

            {inputMode === 'DENOMINATIONS' ? (
              <div className="space-y-3">
                {/* Denomination Sub-Tabs */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDenomTab('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      denomTab === 'ALL'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : isLight
                        ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        : 'bg-[#0d1117] text-gray-300 border-[#30363d] hover:bg-[#21262d]'
                    }`}
                  >
                    Semua Pecahan ({BANKNOTE_DENOMINATIONS.length + COIN_DENOMINATIONS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDenomTab('BANKNOTES')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                      denomTab === 'BANKNOTES'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : isLight
                        ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        : 'bg-[#0d1117] text-gray-300 border-[#30363d] hover:bg-[#21262d]'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Uang Kertas ({totalBanknotesSheets} lbr)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDenomTab('COINS')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                      denomTab === 'COINS'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : isLight
                        ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        : 'bg-[#0d1117] text-gray-300 border-[#30363d] hover:bg-[#21262d]'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Uang Logam / Koin ({totalCoinsPieces} kpg)</span>
                  </button>
                </div>

                {/* Banknotes Grid */}
                {(denomTab === 'ALL' || denomTab === 'BANKNOTES') && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-gray-300 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Pecahan Uang Kertas (Banknotes)</span>
                      </span>
                      <span className="font-mono text-slate-600 dark:text-gray-400">
                        Subtotal Kertas: Rp {totalBanknotesAmount.toLocaleString('id-ID')} ({totalBanknotesSheets} lembar)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {BANKNOTE_DENOMINATIONS.map((d) => (
                        <div
                          key={`banknote-${d.value}`}
                          className={`p-2 rounded-xl border transition ${
                            isLight
                              ? 'bg-white border-slate-200 hover:border-slate-300'
                              : 'bg-[#0d1117] border-[#30363d] hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 dark:text-white mb-1">
                            <span>{d.label}</span>
                            <span className="text-[10px] text-slate-500 dark:text-gray-400 font-normal">
                              lbr
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={banknoteCounts[d.value] || ''}
                              onChange={(e) =>
                                handleBanknoteChange(d.value, Number(e.target.value) || 0)
                              }
                              placeholder="0"
                              className={`w-full px-2.5 py-1 rounded-lg border font-mono font-bold text-xs text-center outline-none ${
                                isLight
                                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-500'
                                  : 'bg-black/30 border-gray-700 text-white focus:border-blue-500'
                              }`}
                            />
                          </div>
                          <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1 text-right">
                            = Rp {(d.value * (banknoteCounts[d.value] || 0)).toLocaleString('id-ID')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coins Grid */}
                {(denomTab === 'ALL' || denomTab === 'COINS') && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-gray-300 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Coins className="w-3.5 h-3.5" />
                        <span>Pecahan Uang Logam & Koin (Coins)</span>
                      </span>
                      <span className="font-mono text-slate-600 dark:text-gray-400">
                        Subtotal Koin: Rp {totalCoinsAmount.toLocaleString('id-ID')} ({totalCoinsPieces} keping)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {COIN_DENOMINATIONS.map((c) => (
                        <div
                          key={`coin-${c.value}`}
                          className={`p-2 rounded-xl border transition ${
                            isLight
                              ? 'bg-white border-slate-200 hover:border-slate-300'
                              : 'bg-[#0d1117] border-[#30363d] hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 dark:text-white mb-1">
                            <span>{c.label}</span>
                            <span className="text-[10px] text-slate-500 dark:text-gray-400 font-normal">
                              kpg
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={coinCounts[c.value] || ''}
                              onChange={(e) =>
                                handleCoinChange(c.value, Number(e.target.value) || 0)
                              }
                              placeholder="0"
                              className={`w-full px-2.5 py-1 rounded-lg border font-mono font-bold text-xs text-center outline-none ${
                                isLight
                                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-amber-500'
                                  : 'bg-black/30 border-gray-700 text-white focus:border-amber-500'
                              }`}
                            />
                          </div>
                          <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold mt-1 text-right">
                            = Rp {(c.value * (coinCounts[c.value] || 0)).toLocaleString('id-ID')}
                          </div>
                        </div>
                      ))}

                      {/* Custom other coins sum */}
                      <div
                        className={`p-2 rounded-xl border transition ${
                          isLight
                            ? 'bg-white border-slate-200 hover:border-slate-300'
                            : 'bg-[#0d1117] border-[#30363d] hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 dark:text-white mb-1">
                          <span>Koin Lainnya</span>
                          <span className="text-[10px] text-slate-500 dark:text-gray-400 font-normal">
                            Rp
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={otherCoinsAmount || ''}
                          onChange={(e) => setOtherCoinsAmount(Math.max(0, Number(e.target.value) || 0))}
                          placeholder="Nominal"
                          className={`w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs text-center outline-none ${
                            isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-amber-500'
                              : 'bg-black/30 border-gray-700 text-white focus:border-amber-500'
                          }`}
                        />
                        <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold mt-1 text-right">
                          = Rp {(otherCoinsAmount || 0).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Calculated from Denominations Bar */}
                <div
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isLight
                      ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                      : 'bg-blue-500/10 border-blue-500/30 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                      <span className="font-bold text-xs block">
                        Total Fisik Terhitung dari Pecahan Kertas & Koin:
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-gray-400">
                        {totalBanknotesSheets} lembar uang kertas + {totalCoinsPieces} keping koin
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-base text-blue-700 dark:text-blue-300">
                      Rp {totalCalculatedFromDenom.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Direct Input Mode */
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold font-mono text-slate-400 text-base">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={manualActualCash || ''}
                    onChange={(e) => setManualActualCash(Math.max(0, Number(e.target.value) || 0))}
                    className={`w-full pl-12 pr-4 py-3 rounded-2xl border text-lg font-black font-mono outline-none transition ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 shadow-sm'
                        : 'bg-[#0d1117] border-[#30363d] text-white focus:border-blue-500 shadow-inner'
                    }`}
                    placeholder="Masukkan total uang fisik di laci"
                    required
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-gray-400">
                  <span>Kasir menghitung total uang fisik laci tanpa kalkulator pecahan.</span>
                  <button
                    type="button"
                    onClick={() => setManualActualCash(expectedCash)}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                  >
                    Set Sesuai Ekspektasi: Rp {expectedCash.toLocaleString('id-ID')}
                  </button>
                </div>
              </div>
            )}

            {/* 3. PERHITUNGAN SELISIH OTOMATIS & STATUS REKONSILIASI */}
            {!isBlindSubmitted ? (
              <div className={`p-4 rounded-2xl border text-xs font-normal space-y-2 ${
                isLight ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-amber-950/30 border-amber-800/40 text-amber-200'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                  <span>Mode Blind Shift Closing Aktif (Kalkulasi Sistem Dikunci)</span>
                </div>
                <p className="leading-relaxed">
                  Silakan masukkan hitungan fisik uang kertas dan koin di laci kasir serta catatan kendala shift di atas. Nominal estimasi kas sistem dan perbandingan selisih kas baru akan terbuka setelah Anda menekan tombol <strong className="font-bold underline">Kirim Laporan Tutup Shift (Blind Submit)</strong>.
                </p>
              </div>
            ) : (
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isBalance
                    ? isLight
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs'
                      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    : isSurplus
                    ? isLight
                      ? 'bg-sky-50 border-sky-400 text-sky-950 shadow-xs'
                      : 'bg-sky-500/15 border-sky-500/40 text-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                    : isLight
                    ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-xs'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {isBalance ? (
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          isSurplus
                            ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/40'
                            : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40'
                        }`}
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-normal text-xs uppercase tracking-wider opacity-80">
                          Status Rekonsiliasi:
                        </span>
                        <span
                          id="reconciliation-status-badge"
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal uppercase tracking-wide shadow-xs ${
                            isBalance
                              ? 'bg-emerald-600 text-white'
                              : isSurplus
                              ? 'bg-sky-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="text-xs leading-5 font-normal mt-1">
                        {isBalance ? (
                          <span>
                            Kas fisik laci (Rp {actualCash.toLocaleString('id-ID')}) cocok 100% dengan ekspektasi kas sistem (Rp {expectedCash.toLocaleString('id-ID')}). Status: Seimbang.
                          </span>
                        ) : isSurplus ? (
                          <span>
                            Uang fisik di laci (Rp {actualCash.toLocaleString('id-ID')}) lebih besar{' '}
                            +Rp {difference.toLocaleString('id-ID')} dari hitungan sistem (Rp {expectedCash.toLocaleString('id-ID')}). Status: Lebih (Surplus).
                          </span>
                        ) : (
                          <span>
                            Uang fisik di laci (Rp {actualCash.toLocaleString('id-ID')}) kurang{' '}
                            -Rp {Math.abs(difference).toLocaleString('id-ID')} dari hitungan sistem (Rp {expectedCash.toLocaleString('id-ID')}). Status: Kurang (Shortage).
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-current/20">
                    <span className="text-[10px] block opacity-80 font-mono font-normal uppercase tracking-wider">
                      Nilai Selisih Kasir
                    </span>
                    <span className="text-base sm:text-lg font-mono font-semibold">
                      {difference > 0
                        ? `+Rp ${difference.toLocaleString('id-ID')}`
                        : isBalance
                        ? 'Rp 0'
                        : `-Rp ${Math.abs(difference).toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Catatan Penutupan Shift */}
          <div>
            <label className="text-xs font-normal text-slate-700 dark:text-slate-300 block mb-1">
              Catatan Penutupan Shift / Keterangan Selisih:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Selisih Rp 200 akibat koin kembalian, laci kasir terkunci aman"
              className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs leading-5 font-normal ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                  : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
              }`}
            />
          </div>

          {/* Finance Integration Notice */}
          <div
            className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-600'
                : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
            }`}
          >
            <span className="font-medium text-slate-900 dark:text-white">
              Integrasi Otomatis Finance & Accounting (Status CLOSED):
            </span>{' '}
            Saat dikonfirmasi, sistem otomatis membukukan setoran fisik (Rp {actualCash.toLocaleString('id-ID')}) ke kas brankas/utama Finance, membukukan selisih ke akun selisih kas, mengunci status shift menjadi CLOSED, dan mencatat ringkasan ke Audit Log Finance.
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl border font-normal text-xs transition cursor-pointer active:scale-[0.99] ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-800/60 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            Batal
          </button>

          {!isBlindSubmitted ? (
            <button
              type="button"
              onClick={() => {
                setIsBlindSubmitted(true);
                if (showToast) showToast('Laporan tutup shift berhasil dikirim (Blind Submit). Silakan tinjau perbandingan selisih kas.');
              }}
              className="px-5 py-2.5 rounded-xl font-medium text-xs bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-md transition cursor-pointer active:scale-[0.99] flex items-center gap-2"
            >
              <span>Kirim Laporan Tutup Shift (Blind Submit)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBlindSubmitted(false)}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  isLight ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Kembali / Edit
              </button>
              <button
                id="btn-confirm-close-shift"
                type="button"
                disabled={isClosingShift}
                onClick={handleConfirmClose}
                className={`px-5 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2 transition active:scale-[0.99] ${
                  isClosingShift
                    ? 'bg-slate-700/60 text-slate-400 border border-slate-600 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isClosingShift ? 'Menyimpan & Menutup Shift...' : 'Konfirmasi Tutup Shift (CLOSED) & Simpan Rekonsiliasi'}</span>
                {!isClosingShift && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
