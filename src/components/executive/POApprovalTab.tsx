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
    showToast,
  } = useApp();

  const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [poNotesMap, setPoNotesMap] = useState<Record<string, string>>({});
  const [processingPo, setProcessingPo] = useState<string | null>(null);

  const handleApproveAllQueue = () => {
    if (pendingHighValuePOs.length === 0) return;
    const count = pendingHighValuePOs.length;
    const approver = activeUser ? `${activeUser.name} (${activeUser.role})` : 'Executive Approver';
    pendingHighValuePOs.forEach((po) => {
      const note =
        poNotesMap[po.po_number] ||
        `Disetujui batch oleh ${approver} untuk pengadaan barang operasional Q4.`;
      approvePurchaseOrder(po.po_number, note);
    });
    showToast(
      isEn
        ? `Successfully approved all ${count} pending POs!`
        : `Berhasil menyetujui seluruh ${count} PO pending menjadi APPROVED sekaligus!`
    );
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
    setProcessingPo(poNumber);
    const approver = activeUser ? `${activeUser.name} (${activeUser.role})` : 'Executive Approver';
    const note =
      poNotesMap[poNumber] ||
      `Disetujui oleh ${approver} untuk pengadaan barang operasional/stok Q4.`;
    try {
      approvePurchaseOrder(poNumber, note);
    } finally {
      setProcessingPo(null);
    }
  };

  const handleReject = async (poNumber: string) => {
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
        className={`p-5 rounded-2xl border relative overflow-hidden ${
          isLight
            ? 'bg-gradient-to-r from-rose-50 via-slate-50 to-indigo-50 border-rose-200 text-slate-800'
            : 'bg-gradient-to-r from-rose-950/30 via-slate-900 to-indigo-950/20 border-rose-500/30 text-white shadow-[0_0_30px_rgba(244,63,94,0.15)]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.4)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-rose-100 border border-rose-300 text-rose-900 font-bold text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider dark:bg-rose-950 dark:border-rose-700 dark:text-rose-300">
                  Direksi & C-Level Gateway
                </span>
                <span className="text-slate-900 font-bold text-xs dark:text-white font-mono">
                  Batas Otorisasi: &gt; Rp 20.000.000
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                Otorisasi Purchase Order &amp; Sinkronisasi Hutang Usaha (AP)
              </h2>
              <p className="text-slate-800 font-medium text-xs max-w-2xl leading-relaxed mt-0.5 dark:text-slate-200">
                Otorisasi formal persetujuan pengadaan nilai tinggi. Setiap PO yang disetujui otomatis
                menerbitkan komitmen/tagihan Hutang Usaha (Accounts Payable) ke modul Finance serta
                pencatatan jurnal akuntansi akrual penerimaan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <div className={`p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-right ${
              isLight ? 'bg-slate-100' : 'bg-slate-900/60'
            }`}>
              <span className="text-[10px] text-slate-600 dark:text-gray-400 uppercase font-semibold block">
                Total Anggaran Pending
              </span>
              <span className="text-lg text-rose-600 font-extrabold font-mono dark:text-rose-400">
                Rp {totalPendingAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div>
            <span className="text-[11px] text-gray-400 font-medium block">
              PO Pending Otorisasi (&gt; 20 Jt)
            </span>
            <span className="text-2xl font-black font-mono text-rose-400 mt-1 block">
              {pendingHighValuePOs.length} Berkas
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5 block">
              Membutuhkan keputusan Direksi
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div>
            <span className="text-[11px] text-gray-400 font-medium block">
              PO Disetujui (Approved) &amp; Sinkron AP
            </span>
            <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
              {approvedHighValuePOs.length} Berkas
            </span>
            <span className="text-emerald-700 font-black text-sm font-mono mt-0.5 block dark:text-emerald-400">
              Rp {totalApprovedAmount.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div>
            <span className="text-[11px] text-gray-400 font-medium block">
              Tagihan Hutang Usaha Terdaftar (AP)
            </span>
            <span className="text-2xl font-black font-mono text-blue-400 mt-1 block">
              {invoicesDue.length} Tagihan
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5 block">
              Terkoneksi ke modul Finance (2-10001)
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <CreditCard className="w-5 h-5" />
          </div>
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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              filterTab === 'pending'
                ? 'bg-rose-600 text-white shadow-xs'
                : isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Menunggu Otorisasi</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              filterTab === 'pending'
                ? 'bg-rose-950 text-rose-300'
                : isLight
                ? 'bg-rose-100 text-rose-800'
                : 'bg-rose-950 text-rose-300'
            }`}>
              {pendingHighValuePOs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('approved')}
            className={`transition cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs font-bold text-xs px-3 py-1.5 rounded-lg'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-xs px-3 py-1.5 rounded-lg dark:bg-transparent dark:border-transparent dark:text-gray-400 dark:hover:text-white'
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
            className={`transition cursor-pointer ${
              filterTab === 'all'
                ? 'bg-slate-800 text-white shadow-xs font-bold text-xs px-3 py-1.5 rounded-lg'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-xs px-3 py-1.5 rounded-lg dark:bg-transparent dark:border-transparent dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <span>Semua PO (&gt; 20 Jt) ({allHighValuePOs.length})</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            id="btn-approve-all-queue-tab"
            type="button"
            disabled={pendingHighValuePOs.length === 0}
            onClick={handleApproveAllQueue}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.35)] transition cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
            title={
              pendingHighValuePOs.length === 0
                ? 'Antrean PO pending sudah kosong (0)'
                : `Setujui seluruh ${pendingHighValuePOs.length} PO pending sekaligus`
            }
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve All Queue</span>
            {pendingHighValuePOs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono font-bold">
                {pendingHighValuePOs.length}
              </span>
            )}
          </button>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. PO atau Supplier..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs bg-slate-900/60 border-slate-700 text-white outline-none focus:border-rose-500 transition"
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
          <p className="text-slate-700 font-semibold text-sm dark:text-slate-200">Tidak ada Purchase Order yang sesuai kriteria.</p>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
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
              'Disetujui untuk pemenuhan pengadaan barang Q4. Terbitkan tagihan AP ke modul Finance.';

            return (
              <div
                key={po.po_number}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isPending
                    ? isLight
                      ? 'bg-rose-50/50 border-rose-300 shadow-sm'
                      : 'bg-[#161b22] border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                    : isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#161b22] border-[#30363d]'
                }`}
              >
                {/* Top Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-700/40">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-black text-slate-800 dark:text-white">
                      {po.po_number}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                      OTORISASI DIREKSI (&gt; 20 JT)
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isPending
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                          : isApproved
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {po.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
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
                    <span className="text-[10px] text-gray-400 uppercase font-medium block">
                      Vendor / Pemasok
                    </span>
                    <div className="font-bold text-sm text-sky-400 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 shrink-0 text-sky-400" />
                      <span className="truncate">{po.supplier_name}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      ID: {po.supplier_id || po.vendor_id || 'SUPP-LOCAL'} • Jatuh Tempo: {po.due_date || '-'}
                    </div>
                  </div>

                  {/* Rincian Barang */}
                  <div className="space-y-1 md:col-span-1">
                    <span className="text-[10px] text-gray-400 uppercase font-medium block">
                      Rincian Barang &amp; Bahan
                    </span>
                    <p className="text-gray-300 text-xs line-clamp-2 leading-relaxed">
                      {po.items}
                    </p>
                    {po.item_details && po.item_details.length > 0 && (
                      <span className="text-[10px] text-purple-300 font-mono">
                        {po.item_details.length} item spesifik tercatat
                      </span>
                    )}
                  </div>

                  {/* Nominal Anggaran */}
                  <div className="space-y-1 text-left md:text-right bg-slate-900/40 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-gray-400 uppercase font-medium block">
                      Total Nilai Pengadaan (PO)
                    </span>
                    <div className="text-xl font-black font-mono text-emerald-400">
                      Rp {po.total_amount.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {po.include_ppn ? 'Termasuk PPN 11%' : 'Harga Netto'}
                    </div>
                  </div>
                </div>

                {/* Information Callout: AP & Journal Integration */}
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-[11px] text-blue-200/90 leading-relaxed mb-3.5 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-blue-300">Integrasi Otomatis Finance &amp; AP:</strong>{' '}
                    Persetujuan (Approve) PO ini akan otomatis: (1) Mengubah status menjadi{' '}
                    <code className="text-emerald-400 font-mono font-bold">APPROVED</code>, (2) Menerbitkan
                    tagihan Hutang Usaha (AP / 2-10001) senilai{' '}
                    <strong className="text-emerald-300">
                      Rp {po.total_amount.toLocaleString('id-ID')}
                    </strong>{' '}
                    di modul Finance, dan (3) Membukukan jurnal akuntansi akrual/komitmen ke General Ledger.
                  </div>
                </div>

                {/* Action Form for Pending POs */}
                {isPending && (
                  <div className="pt-3 border-t border-slate-700/40 space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-300 block mb-1">
                        Catatan Persetujuan / Otorisasi Direksi:
                      </label>
                      <input
                        type="text"
                        value={poNoteValue}
                        onChange={(e) =>
                          setPoNotesMap({ ...poNotesMap, [po.po_number]: e.target.value })
                        }
                        placeholder="Masukkan catatan otorisasi persetujuan anggaran..."
                        className="w-full px-3.5 py-2 rounded-xl text-xs border bg-slate-900/60 border-slate-700 text-white outline-none focus:border-rose-500 transition"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        id={`btn-reject-po-${po.po_number}`}
                        type="button"
                        disabled={processingPo === po.po_number}
                        onClick={() => handleReject(po.po_number)}
                        className="px-4 py-2 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>Reject PO</span>
                      </button>

                      <button
                        id={`btn-approve-po-${po.po_number}`}
                        type="button"
                        disabled={processingPo === po.po_number}
                        onClick={() => handleApprove(po.po_number)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-black text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.35)] transition cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{processingPo === po.po_number ? 'Memproses...' : 'Approve PO'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Audit & Approval History for Approved/Rejected POs */}
                {!isPending && (
                  <div className="pt-2.5 border-t border-slate-700/40 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-gray-400 gap-1.5">
                    <div>
                      {po.approved_by || po.approvedBy ? (
                        <span>
                          Disetujui oleh: <strong className="text-gray-300">{po.approved_by || po.approvedBy}</strong>{' '}
                          pada {po.approved_date || po.approvedAt || po.date}
                        </span>
                      ) : po.rejected_reason ? (
                        <span className="text-rose-400">
                          Alasan Penolakan: {po.rejected_reason}
                        </span>
                      ) : (
                        <span>Otorisasi selesai</span>
                      )}
                    </div>
                    {isApproved && (
                      <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
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
