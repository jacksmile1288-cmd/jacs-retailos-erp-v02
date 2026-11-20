import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseOrder } from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  DollarSign,
  FileText,
  AlertTriangle,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  Calendar,
  CreditCard,
  Check,
  Search,
} from 'lucide-react';

interface POApprovalTabProps {
  isLight?: boolean;
  isEn?: boolean;
}

export const POApprovalTab: React.FC<POApprovalTabProps> = ({
  isLight = false,
  isEn = false,
}) => {
  const {
    purchasing,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    activeUser,
    invoicesDue,
    journalEntries,
    addFinanceEntry, // Tambahkan addFinanceEntry
    showToast,
  } = useApp();

  const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [poNotesMap, setPoNotesMap] = useState<Record<string, string>>({});
  const [processingPo, setProcessingPo] = useState<string | null>(null);
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  const handleApproveAllQueue = () => {
    if (pendingHighValuePOs.length === 0 || isProcessingAll) return;
    setIsProcessingAll(true);
    try {
      const count = pendingHighValuePOs.length;
      const approver = activeUser ? `${activeUser.name} (${activeUser.role})` : 'Executive Approver';
      pendingHighValuePOs.forEach((po) => {
        const note =
          poNotesMap[po.po_number] ||
          `Disetujui batch oleh ${approver} untuk pengadaan barang operasional Q4.`;
        approvePurchaseOrder(po.po_number, note);
        // Terbitkan komitmen Hutang Usaha (AP / 2-10001)
        addFinanceEntry({
          type: 'EXPENSE',
          amount: po.total_amount,
          description: `Komitmen Hutang Usaha (AP) - PO: ${po.po_number}`,
          date: new Date().toISOString().split('T')[0],
          category: 'ACCOUNTS_PAYABLE',
          reference: po.po_number,
          payment_method: 'PENDING',
        });
      });
      showToast(
        isEn
          ? `Successfully approved all ${count} pending POs!`
          : `Berhasil menyetujui seluruh ${count} PO pending menjadi APPROVED sekaligus!`
      );
    } finally {
      setIsProcessingAll(false);
    }
  };

  // Helper check status pending
  const isPendingPo = (po: PurchaseOrder) => {
    const s = (po.status || '').toUpperCase().trim();
    return (
      s === 'PENDING_APPROVAL' ||
      s === 'MENUNGGU APPROVAL DIREKSI' ||
      s === 'MENUNGGU APPROVAL PIMPINAN' ||
      s === 'PENDING APPROVAL'
    );
  };

  const isApprovedPo = (po: PurchaseOrder) => {
    const s = (po.status || '').toUpperCase().trim();
    return (
      s === 'APPROVED' ||
      s === 'DISETUJUI (APPROVED)' ||
      s === 'DISETUJUI' ||
      s === 'DIPESAN' ||
      s === 'FULLY_RECEIVED' ||
      s === 'RECEIVED' ||
      s === 'GOODS_RECEIPT' ||
      s === 'PARTIALLY_RECEIVED' ||
      s === 'SELESAI'
    );
  };

  // High Value POs (> Rp 20.000.000)
  const allHighValuePOs = useMemo(() => {
    return (purchasing || []).filter((po) => (po.total_amount || 0) > 20000000);
  }, [purchasing]);

  const pendingHighValuePOs = useMemo(() => {
    return allHighValuePOs.filter((po) => isPendingPo(po));
  }, [allHighValuePOs]);

  const approvedHighValuePOs = useMemo(() => {
    return allHighValuePOs.filter((po) => isApprovedPo(po));
  }, [allHighValuePOs]);

  // Total pending budget amount
  const totalPendingAmount = useMemo(() => {
    return pendingHighValuePOs.reduce((acc, po) => acc + (po.total_amount || 0), 0);
  }, [pendingHighValuePOs]);

  const totalApprovedAmount = useMemo(() => {
    return approvedHighValuePOs.reduce((acc, po) => acc + (po.total_amount || 0), 0);
  }, [approvedHighValuePOs]);

  // Filtered displayed POs
  const displayedPOs = useMemo(() => {
    let list = allHighValuePOs;
    if (filterTab === 'pending') {
      list = pendingHighValuePOs;
    } else if (filterTab === 'approved') {
      list = approvedHighValuePOs;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (po) =>
          po.po_number.toLowerCase().includes(q) ||
          po.supplier_name.toLowerCase().includes(q) ||
          (po.items && po.items.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allHighValuePOs, pendingHighValuePOs, approvedHighValuePOs, filterTab, searchQuery]);

  const handleApprove = async (poNumber: string) => {
    if (processingPo) return;
    setProcessingPo(poNumber);
    const approver = activeUser ? `${activeUser.name} (${activeUser.role})` : 'Executive Approver';
    const note =
      poNotesMap[poNumber] ||
      `Disetujui oleh ${approver} untuk pengadaan barang operasional/stok Q4.`;
    try {
      approvePurchaseOrder(poNumber, note);
      // Terbitkan komitmen Hutang Usaha (AP / 2-10001)
      const po = purchasing.find(p => p.po_number === poNumber);
      if (po) {
        addFinanceEntry({
          type: 'EXPENSE',
          amount: po.total_amount,
          description: `Komitmen Hutang Usaha (AP) - PO: ${poNumber}`,
          date: new Date().toISOString().split('T')[0],
          category: 'ACCOUNTS_PAYABLE',
          reference: poNumber,
          payment_method: 'PENDING',
        });
      }
    } finally {
      setProcessingPo(null);
    }
  };

  const handleReject = async (poNumber: string) => {
    if (processingPo) return;
    setProcessingPo(poNumber);
    const approver = activeUser ? `${activeUser.name} (${activeUser.role})` : 'Executive Approver';
    const reason =
      poNotesMap[poNumber] ||
      `Ditolak oleh ${approver}: evaluasi anggaran ulang diperlukan.`;
    try {
      rejectPurchaseOrder(poNumber, reason);
    } finally {
      setProcessingPo(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div
        className={`p-5 rounded-2xl border relative overflow-hidden transition-all ${
          isLight
            ? 'bg-gradient-to-r from-amber-50/80 via-slate-50 to-orange-50/50 border-amber-500/70 shadow-[0_0_16px_rgba(245,158,11,0.18)] text-slate-800'
            : 'bg-gradient-to-r from-amber-950/20 via-slate-900 to-orange-950/20 border-amber-500/40 shadow-[0_0_16px_rgba(245,158,11,0.12)] text-white'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.35)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-100 border border-amber-300 text-amber-900 font-mono font-normal text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider dark:bg-amber-950/80 dark:border-amber-700 dark:text-amber-300">
                  Direksi & C-Level Gateway
                </span>
                <span className="text-slate-800 font-medium text-xs dark:text-white font-mono">
                  Batas Otorisasi: &gt; Rp 20.000.000
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-medium tracking-tight mt-1 leading-6">
                Otorisasi Purchase Order &amp; Sinkronisasi Hutang Usaha (AP)
              </h2>
              <p className="text-slate-600 font-normal text-xs max-w-2xl leading-relaxed mt-0.5 dark:text-slate-300">
                Otorisasi formal persetujuan pengadaan nilai tinggi. Setiap PO yang disetujui otomatis
                menerbitkan komitmen/tagihan Hutang Usaha (Accounts Payable) ke modul Finance serta
                pencatatan jurnal akuntansi akrual penerimaan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <div className={`p-3 rounded-xl border text-right ${
              isLight
                ? 'bg-white/80 border-amber-300 shadow-xs'
                : 'bg-slate-900/80 border-amber-500/30'
            }`}>
              <span className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-mono font-normal tracking-widest block">
                Total Anggaran Pending
              </span>
              <span className="text-lg text-amber-600 font-semibold font-mono dark:text-amber-400">
                Rp {totalPendingAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`rounded-2xl p-4 transition-all hover:-translate-y-0.5 ${
          isLight
            ? 'bg-white border border-amber-500/70 shadow-[0_0_16px_rgba(245,158,11,0.18)]'
            : 'bg-slate-900 border border-amber-500/40 shadow-[0_0_16px_rgba(245,158,11,0.12)]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono font-normal text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
              PO Pending Otorisasi (&gt; 20 Jt)
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <span className="text-lg leading-7 font-semibold font-mono text-slate-900 dark:text-white">
            {pendingHighValuePOs.length} Berkas
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-1">
            Membutuhkan keputusan Direksi
          </p>
        </div>

        <div className={`rounded-2xl p-4 transition-all hover:-translate-y-0.5 ${
          isLight
            ? 'bg-white border border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-slate-900 border border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.1)]'
        }`}>
          <span className="text-[11px] font-mono font-normal text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">
            PO Disetujui (Approved)
          </span>
          <div className="flex flex-col">
            <span className="text-lg leading-7 font-semibold font-mono text-slate-900 dark:text-white">
              {approvedHighValuePOs.length} Berkas
            </span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              Rp {totalApprovedAmount.toLocaleString('id-ID')}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-1">
            Telah diterbitkan ke Ledger
          </p>
        </div>

        <div className={`rounded-2xl p-4 transition-all hover:-translate-y-0.5 ${
          isLight
            ? 'bg-white border border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-slate-900 border border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.1)]'
        }`}>
          <span className="text-[11px] font-mono font-normal text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">
            Hutang Usaha Terdaftar (AP)
          </span>
          <span className="text-lg leading-7 font-semibold font-mono text-slate-900 dark:text-white">
            {invoicesDue.length} Tagihan
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-1">
            Terkoneksi ke modul Finance
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
          isLight ? 'bg-white border-slate-300 shadow-xs' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer active:scale-[0.99] ${
              filterTab === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Menunggu Otorisasi</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              filterTab === 'pending'
                ? 'bg-amber-950 text-amber-300'
                : isLight
                ? 'bg-amber-100 text-amber-800'
                : 'bg-amber-950 text-amber-300'
            }`}>
              {pendingHighValuePOs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('approved')}
            className={`transition cursor-pointer flex items-center gap-1.5 active:scale-[0.99] ${
              filterTab === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs font-medium text-xs px-3 py-1.5 rounded-lg'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-medium text-xs px-3 py-1.5 rounded-lg dark:bg-transparent dark:border-transparent dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <span>Disetujui (Approved)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              filterTab === 'approved'
                ? 'bg-emerald-950 text-emerald-300'
                : isLight
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-emerald-950 text-emerald-300'
            }`}>
              {approvedHighValuePOs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`transition cursor-pointer active:scale-[0.99] ${
              filterTab === 'all'
                ? 'bg-cyan-600 text-white shadow-xs font-medium text-xs px-3 py-1.5 rounded-lg'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-medium text-xs px-3 py-1.5 rounded-lg dark:bg-transparent dark:border-transparent dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <span>Semua PO (&gt; 20 Jt) ({allHighValuePOs.length})</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            id="btn-approve-all-queue-tab"
            type="button"
            disabled={pendingHighValuePOs.length === 0 || isProcessingAll}
            onClick={handleApproveAllQueue}
            className={`px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.99] ${
              pendingHighValuePOs.length === 0 || isProcessingAll
                ? 'bg-slate-200 border border-slate-300 text-slate-500 font-medium cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium shadow-[0_0_15px_rgba(16,185,129,0.35)] cursor-pointer'
            }`}
            title={
              pendingHighValuePOs.length === 0
                ? 'Antrean PO pending sudah kosong (0)'
                : `Setujui seluruh ${pendingHighValuePOs.length} PO pending sekaligus`
            }
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isProcessingAll ? 'Memproses Semua...' : 'Approve All Queue'}</span>
            {!isProcessingAll && pendingHighValuePOs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono font-medium">
                {pendingHighValuePOs.length}
              </span>
            )}
          </button>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. PO atau Supplier..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition font-normal"
            />
          </div>
        </div>
      </div>

      {/* PO List */}
      {displayedPOs.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${
          isLight
            ? 'border-slate-300 bg-slate-50/50 text-slate-700'
            : 'border-slate-700/60 bg-slate-900/30 text-gray-400'
        }`}>
          <ShieldCheck className="w-12 h-12 text-slate-400 dark:text-gray-500 mb-2" />
          <p className="text-slate-900 font-bold text-sm dark:text-slate-100">Tidak ada Purchase Order yang sesuai kriteria.</p>
          <p className="text-xs text-slate-700 font-medium dark:text-gray-400 mt-1">
            {filterTab === 'pending'
              ? 'Seluruh Purchase Order bernilai > Rp 20.000.000 telah selesai diotorisasi.'
              : 'Ganti filter atau buat Purchase Order baru bernilai > Rp 20 Jt pada modul Purchasing.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {displayedPOs.map((po) => {
            const isPending = isPendingPo(po);
            const isApproved = isApprovedPo(po);
            const poNoteValue =
              poNotesMap[po.po_number] ??
              po.approval_notes ??
              'Disetujui untuk pemenuhan pengadaan barang Q4. Terbitkan tagihan AP ke modul Finance.';

            return (
              <div
                key={po.po_number}
                className={`p-4 sm:p-5 rounded-2xl transition-all ${
                  isPending
                    ? isLight
                      ? 'bg-amber-50/40 border border-amber-500/70 shadow-[0_0_16px_rgba(245,158,11,0.18)] hover:-translate-y-0.5'
                      : 'bg-[#161b22] border border-amber-500/40 shadow-[0_0_16px_rgba(245,158,11,0.12)] hover:-translate-y-0.5'
                    : isLight
                    ? 'bg-slate-50 border border-slate-200 hover:-translate-y-0.5'
                    : 'bg-[#161b22] border border-[#30363d] hover:-translate-y-0.5'
                }`}
              >
                {/* Top Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-700/40">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                      {po.po_number}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
                      OTORISASI DIREKSI (&gt; 20 JT)
                    </span>
                    {po.requiresDirectorApproval && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> SYSTEM_LOCKED
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal flex items-center gap-1.5 ${
                        isPending
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                          : isApproved
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                      <span>{isPending ? 'PENDING_APPROVAL' : po.status.toUpperCase()}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600 font-normal font-mono dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>{po.date}</span>
                    </span>
                    <span>•</span>
                    <span>Term: {po.payment_term || 'Tempo 30 Hari'}</span>
                  </div>
                </div>

                {/* Vendor, Items & Financials */}
                <div className="py-3.5 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  {/* Vendor Details */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono font-normal uppercase tracking-widest block dark:text-slate-400">
                      Vendor / Pemasok
                    </span>
                    <div className="font-medium text-sm text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 shrink-0 text-sky-700 dark:text-sky-400" />
                      <span className="truncate">{po.supplier_name}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-normal font-mono dark:text-slate-400">
                      ID: {po.supplier_id || po.vendor_id || 'SUPP-LOCAL'} • Jatuh Tempo: {po.due_date || '-'}
                    </div>
                  </div>

                  {/* Rincian Barang */}
                  <div className="space-y-1 md:col-span-1">
                    <span className="text-[10px] text-slate-500 font-mono font-normal uppercase tracking-widest block dark:text-slate-400">
                      Rincian Barang &amp; Bahan
                    </span>
                    <p className="text-slate-800 font-normal text-xs line-clamp-2 leading-relaxed dark:text-slate-200">
                      {po.items}
                    </p>
                    {po.item_details && po.item_details.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-normal font-mono dark:text-purple-300">
                        {po.item_details.length} item spesifik tercatat
                      </span>
                    )}
                  </div>

                  {/* Nominal Anggaran */}
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-right">
                    <span className="text-[10px] font-mono font-normal text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                      Total Nilai Pengadaan (PO)
                    </span>
                    <div className="text-lg font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Rp {po.total_amount.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      {po.include_ppn ? 'Termasuk PPN 11%' : 'Harga Netto'}
                    </div>
                  </div>
                </div>

                {/* Information Callout: AP & Journal Integration */}
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/25 text-[11px] text-blue-950 dark:text-blue-200 font-normal leading-relaxed mb-3.5 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-blue-950 dark:text-blue-300">Integrasi Otomatis Finance &amp; AP:</span>{' '}
                    Persetujuan (Approve) PO ini akan otomatis: (1) Mengubah status menjadi{' '}
                    <code className="text-emerald-800 dark:text-emerald-400 font-mono font-normal">APPROVED</code>, (2) Menerbitkan
                    tagihan Hutang Usaha (AP / 2-10001) senilai{' '}
                    <span className="text-emerald-800 dark:text-emerald-300 font-mono font-medium">
                      Rp {po.total_amount.toLocaleString('id-ID')}
                    </span>{' '}
                    di modul Finance, dan (3) Membukukan jurnal akuntansi akrual/komitmen ke General Ledger.
                  </div>
                </div>

                {/* Action Form for Pending POs */}
                {isPending && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700/40 space-y-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
                        Catatan Persetujuan / Otorisasi Direksi:
                      </label>
                      <input
                        type="text"
                        value={poNoteValue}
                        onChange={(e) =>
                          setPoNotesMap({ ...poNotesMap, [po.po_number]: e.target.value })
                        }
                        placeholder="Masukkan catatan otorisasi persetujuan anggaran..."
                        className="w-full px-3.5 py-2 rounded-xl text-xs border bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-amber-500 transition font-normal"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        id={`btn-reject-po-${po.po_number}`}
                        type="button"
                        disabled={processingPo === po.po_number}
                        onClick={() => handleReject(po.po_number)}
                        className={`px-4 py-2 rounded-xl font-medium text-xs flex items-center gap-1.5 transition active:scale-[0.99] ${
                          processingPo === po.po_number
                            ? 'bg-slate-200 border border-slate-300 text-slate-500 font-medium cursor-not-allowed shadow-none'
                            : 'border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 cursor-pointer'
                        }`}
                      >
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>{processingPo === po.po_number ? 'Memproses...' : 'Reject PO'}</span>
                      </button>

                      <button
                        id={`btn-approve-po-${po.po_number}`}
                        type="button"
                        disabled={processingPo === po.po_number}
                        onClick={() => handleApprove(po.po_number)}
                        className={`px-5 py-2 rounded-xl font-medium text-xs flex items-center gap-2 transition active:scale-[0.99] ${
                          processingPo === po.po_number
                            ? 'bg-slate-200 border border-slate-300 text-slate-500 font-medium cursor-not-allowed shadow-none'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{processingPo === po.po_number ? 'Memproses...' : 'Approve PO'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Audit & Approval History for Approved/Rejected POs */}
                {!isPending && (
                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700/40 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-normal gap-1.5">
                    <div>
                      {po.approved_by || po.approvedBy ? (
                        <span>
                          Disetujui oleh: <strong className="text-slate-900 font-medium dark:text-white">{po.approved_by || po.approvedBy}</strong>{' '}
                          pada {po.approved_date || po.approvedAt || po.date}
                        </span>
                      ) : po.rejected_reason ? (
                        <span className="text-rose-700 font-medium dark:text-rose-400">
                          Alasan Penolakan: {po.rejected_reason}
                        </span>
                      ) : (
                        <span>Otorisasi selesai</span>
                      )}
                    </div>
                    {isApproved && (
                      <span className="text-slate-700 font-normal font-mono flex items-center gap-1 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Tagihan AP Terbit (INV-AP-{po.po_number})</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
