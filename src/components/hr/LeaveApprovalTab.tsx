import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { LeaveRequest } from '../../types';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  FileText,
  Search,
  Building2,
  Sparkles,
  ShieldCheck,
  Check,
  AlertCircle,
} from 'lucide-react';

interface LeaveApprovalTabProps {
  isLight?: boolean;
  isEn?: boolean;
}

export const LeaveApprovalTab: React.FC<LeaveApprovalTabProps> = ({
  isLight = false,
  isEn = false,
}) => {
  const {
    leaveRequests,
    employees,
    approveLeaveRequest,
    rejectLeaveRequest,
    activeUser,
    showToast,
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Employees map for quick lookup
  const employeeMap = useMemo(() => {
    const map = new Map<string, typeof employees[0]>();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employees]);

  // Statistics
  const pendingLeaves = useMemo(() => {
    return leaveRequests.filter((l) => l.status === 'Menunggu');
  }, [leaveRequests]);

  const approvedLeaves = useMemo(() => {
    return leaveRequests.filter((l) => l.status === 'Disetujui');
  }, [leaveRequests]);

  const rejectedLeaves = useMemo(() => {
    return leaveRequests.filter((l) => l.status === 'Ditolak');
  }, [leaveRequests]);

  // Filtered requests
  const displayedLeaves = useMemo(() => {
    let list = leaveRequests;
    if (filterStatus === 'PENDING') {
      list = pendingLeaves;
    } else if (filterStatus === 'APPROVED') {
      list = approvedLeaves;
    } else if (filterStatus === 'REJECTED') {
      list = rejectedLeaves;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.ticketNumber.toLowerCase().includes(q) ||
          l.employeeName.toLowerCase().includes(q) ||
          l.department.toLowerCase().includes(q) ||
          l.reason.toLowerCase().includes(q)
      );
    }

    return list;
  }, [leaveRequests, pendingLeaves, approvedLeaves, rejectedLeaves, filterStatus, searchQuery]);

  const handleApprove = (ticket: LeaveRequest) => {
    setProcessingId(ticket.id);
    const approver = activeUser ? `${activeUser.name} (${activeUser.role})` : 'HR Approver';
    const note =
      notesMap[ticket.id] ||
      (isEn
        ? `Approved by ${approver}. Shift adjustments coordinated.`
        : `Disetujui oleh ${approver}. Kuota cuti disesuaikan & koordinasi shift selesai.`);
    try {
      approveLeaveRequest(ticket.id, approver, note);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (ticket: LeaveRequest) => {
    setProcessingId(ticket.id);
    const approver = activeUser ? `${activeUser.name} (${activeUser.role})` : 'HR Approver';
    const note =
      notesMap[ticket.id] ||
      (isEn
        ? `Rejected by ${approver}: operational peak coverage required.`
        : `Ditolak oleh ${approver}: kebutuhan operasional padat & jadwal bentrok.`);
    try {
      rejectLeaveRequest(ticket.id, approver, note);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAllPendingLeaves = () => {
    if (pendingLeaves.length === 0) return;

    const approverName = activeUser ? `${activeUser.name} (${activeUser.role})` : 'HR Approver';
    const count = pendingLeaves.length;

    // Setujui seluruh pengajuan cuti pending sekaligus dan kurangi kuota cuti karyawan terkait
    pendingLeaves.forEach((ticket) => {
      const note =
        notesMap[ticket.id] ||
        (ticket.type === 'Sakit (Surat Dokter)'
          ? 'Disetujui batch. Surat keterangan medis terverifikasi.'
          : 'Disetujui batch oleh HR & Pimpinan. Kuota cuti tahunan dipotong & jadwal shift diselaraskan.');
      approveLeaveRequest(ticket.id, approverName, note);
    });

    showToast(
      isEn
        ? `Successfully approved all ${count} pending leave requests simultaneously & deducted quotas!`
        : `Berhasil menyetujui seluruh ${count} pengajuan cuti pending sekaligus & kuota cuti karyawan terpotong!`
    );
  };

  return (
    <div id="leave-approval-tab" className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div
        className={`p-5 rounded-2xl border transition duration-200 ${
          isLight
            ? 'bg-gradient-to-r from-amber-50 via-slate-50 to-cyan-50 border-amber-200 text-slate-800'
            : 'bg-gradient-to-r from-amber-950/25 via-slate-900 to-cyan-950/20 border-amber-500/30 text-white shadow-[0_0_25px_rgba(245,158,11,0.12)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isLight
                    ? 'bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs'
                    : 'text-[10px] font-black font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  HR Gateway • Otorisasi Cuti &amp; Izin
                </span>
                <span className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-800' : 'text-gray-400'}`}>
                  {pendingLeaves.length} Permohonan Menunggu
                </span>
              </div>
              <h3 className={`text-lg sm:text-xl font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                {isEn ? 'Leave & Permission Authorization Queue' : 'Otorisasi Pengajuan Cuti, Izin & Sakit Karyawan'}
              </h3>
              <p className={`text-xs max-w-2xl leading-relaxed mt-0.5 ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
                {isEn
                  ? 'Verify staff absence requests, coordinate shift coverage, and automatically update annual leave quotas upon approval.'
                  : 'Verifikasi pengajuan ketidakhadiran staf, koordinasi penggantian shift, dan perbarui sisa kuota cuti tahunan secara otomatis saat disetujui.'}
              </p>
            </div>
          </div>

          {/* Pending Counter Banner */}
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <div className={`p-3 rounded-xl border text-right ${
              isLight
                ? 'bg-slate-100 border border-slate-300 text-slate-900 shadow-xs'
                : 'bg-slate-900/60 border-amber-500/40 text-white'
            }`}>
              <span className={`text-[10px] uppercase font-bold block ${
                isLight ? 'text-slate-700' : 'text-gray-400'
              }`}>
                Status Antrean
              </span>
              <span className={`text-lg font-mono flex items-center gap-1.5 justify-end ${
                isLight ? 'text-amber-800 font-black' : 'text-amber-400 font-black'
              }`}>
                <Clock className={`w-4 h-4 animate-pulse ${isLight ? 'text-amber-800' : 'text-amber-400'}`} />
                <span>{pendingLeaves.length} Leave Pending</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          className={`p-4 rounded-2xl border border-slate-300 overflow-visible min-h-[90px] flex items-center justify-between ${
            isLight ? 'bg-white shadow-xs' : 'bg-[#161b22] dark:border-[#30363d]'
          }`}
        >
          <div>
            <span className="text-[11px] text-slate-700 dark:text-gray-400 font-bold block">
              {isEn ? 'Pending Approvals' : 'Menunggu Otorisasi (Pending)'}
            </span>
            <span className="text-2xl font-black font-mono text-amber-800 dark:text-amber-400 mt-1 block">
              {pendingLeaves.length} Berkas
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400/80 mt-0.5 block font-mono font-medium">
              {pendingLeaves.length === 2 ? '2 Leave Pending' : `${pendingLeaves.length} Perlu Tindakan`}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border border-slate-300 overflow-visible min-h-[90px] flex items-center justify-between ${
            isLight ? 'bg-white shadow-xs' : 'bg-[#161b22] dark:border-[#30363d]'
          }`}
        >
          <div>
            <span className="text-[11px] text-slate-700 dark:text-gray-400 font-bold block">
              {isEn ? 'Approved Requests' : 'Pengajuan Disetujui'}
            </span>
            <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1 block">
              {approvedLeaves.length} Berkas
            </span>
            <span className="text-[10px] text-slate-600 dark:text-gray-500 mt-0.5 block font-medium">
              Kuota cuti telah dipotong
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border border-slate-300 overflow-visible min-h-[90px] flex items-center justify-between ${
            isLight ? 'bg-white shadow-xs' : 'bg-[#161b22] dark:border-[#30363d]'
          }`}
        >
          <div>
            <span className="text-[11px] text-slate-700 dark:text-gray-400 font-bold block">
              {isEn ? 'Rejected Requests' : 'Pengajuan Ditolak'}
            </span>
            <span className="text-2xl font-black font-mono text-rose-700 dark:text-rose-400 mt-1 block">
              {rejectedLeaves.length} Berkas
            </span>
            <span className="text-[10px] text-slate-600 dark:text-gray-500 mt-0.5 block font-medium">
              Kuota cuti tidak berkurang
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border border-slate-300 overflow-visible min-h-[90px] flex items-center justify-between ${
            isLight ? 'bg-white shadow-xs' : 'bg-[#161b22] dark:border-[#30363d]'
          }`}
        >
          <div>
            <span className="text-[11px] text-slate-700 dark:text-gray-400 font-bold block">
              {isEn ? 'Total Staff Active' : 'Total Karyawan Aktif'}
            </span>
            <span className="text-2xl font-black font-mono text-cyan-700 dark:text-cyan-400 mt-1 block">
              {employees.length} Karyawan
            </span>
            <span className="text-[10px] text-slate-600 dark:text-gray-500 mt-0.5 block font-medium">
              Plafon cuti: 12 - 16 hari/thn
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Leave Quota Tracker Cards */}
      <div
        className={`p-5 rounded-2xl border ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-gray-700/30">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300">
              {isEn ? 'Live Employee Leave Quota Balances' : 'Saldo Sisa Kuota Cuti Tahunan Karyawan (Terkini)'}
            </h4>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">
            Kuota terpotong otomatis saat disetujui
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {employees.map((emp) => {
            const pct = Math.round((emp.leaveQuota.remaining / Math.max(emp.leaveQuota.total, 1)) * 100);
            return (
              <div
                key={emp.id}
                className={`p-3 rounded-xl border text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="font-bold truncate text-slate-800 dark:text-gray-200">
                  {emp.name}
                </div>
                <div className="text-[10px] text-gray-400 truncate">{emp.department}</div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">Sisa:</span>
                  <span className="font-mono font-black text-cyan-400">
                    {emp.leaveQuota.remaining} / {emp.leaveQuota.total} Hr
                  </span>
                </div>
                <div className="w-full h-1 bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full ${
                      pct > 50 ? 'bg-emerald-400' : pct > 25 ? 'bg-amber-400' : 'bg-rose-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Filter Toolbar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <button
            type="button"
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              filterStatus === 'PENDING'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Menunggu (Pending)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              filterStatus === 'PENDING'
                ? 'bg-amber-950 text-amber-300'
                : isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-300'
            }`}>
              {pendingLeaves.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('APPROVED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              filterStatus === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Disetujui</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              filterStatus === 'APPROVED'
                ? 'bg-emerald-950 text-emerald-300'
                : isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-300'
            }`}>
              {approvedLeaves.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('REJECTED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterStatus === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-xs'
                : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Ditolak ({rejectedLeaves.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterStatus === 'ALL'
                ? isLight ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-700 text-white shadow-xs'
                : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Semua ({leaveRequests.length})</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            id="btn-approve-all-pending-leaves"
            type="button"
            disabled={pendingLeaves.length === 0}
            onClick={handleApproveAllPendingLeaves}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.35)] transition cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
            title={
              pendingLeaves.length === 0
                ? 'Tidak ada antrean cuti pending (0)'
                : `Setujui seluruh ${pendingLeaves.length} pengajuan cuti pending sekaligus & potong kuota cuti`
            }
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve All Pending Leaves</span>
            {pendingLeaves.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono font-bold">
                {pendingLeaves.length}
              </span>
            )}
          </button>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tiket, staf, alasan..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs bg-slate-900/60 border-slate-700 text-white outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>
      </div>

      {/* 5. Daftar Tiket Permohonan Cuti */}
      {displayedLeaves.length === 0 ? (
        <div className="p-12 text-center text-gray-400 rounded-2xl border border-dashed border-slate-700/60 flex flex-col items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-gray-600 mb-2" />
          <p className="font-bold text-sm">Tidak ada permohonan cuti yang sesuai kriteria.</p>
          <p className="text-xs text-gray-500 mt-1">
            {filterStatus === 'PENDING'
              ? 'Seluruh permohonan cuti (termasuk 2 Leave Pending) telah selesai diotorisasi.'
              : 'Ganti filter untuk melihat riwayat tiket cuti lainnya.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {displayedLeaves.map((ticket) => {
            const isPending = ticket.status === 'Menunggu';
            const emp = employeeMap.get(ticket.employeeId);
            const currentNote =
              notesMap[ticket.id] ??
              (ticket.type === 'Sakit (Surat Dokter)'
                ? 'Disetujui. Surat dokter terverifikasi, istirahat lekas sembuh.'
                : 'Disetujui. Kuota cuti tahunan dipotong & penggantian shift diatur.');

            return (
              <div
                key={ticket.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isPending
                    ? isLight
                      ? 'bg-amber-50/50 border-amber-300 shadow-sm'
                      : 'bg-[#161b22] border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                    : isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#161b22] border-[#30363d]'
                }`}
              >
                {/* Top Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-700/40">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {ticket.ticketNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        ticket.type === 'Cuti Tahunan'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : ticket.type === 'Sakit (Surat Dokter)'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      }`}
                    >
                      {ticket.type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isPending
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                          : ticket.status === 'Disetujui'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                    <span>Diajukan: {ticket.submittedAt}</span>
                  </div>
                </div>

                {/* Staff Details & Leave Period */}
                <div className="py-3.5 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  {/* Staff Info */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 uppercase font-medium block">
                      Karyawan Pemohon
                    </span>
                    <div className="font-bold text-sm text-cyan-400 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{ticket.employeeName}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      NIP: {ticket.nip} • {ticket.department}
                    </div>
                    {emp && (
                      <div className="text-[11px] text-amber-400/90 font-semibold pt-0.5">
                        Sisa Kuota Cuti: <strong>{emp.leaveQuota.remaining}</strong> dari {emp.leaveQuota.total} hari
                      </div>
                    )}
                  </div>

                  {/* Periode & Durasi */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 uppercase font-medium block">
                      Periode Cuti / Izin
                    </span>
                    <div className="text-gray-200 text-xs font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{ticket.startDate} s/d {ticket.endDate}</span>
                    </div>
                    <div className="text-[11px] text-cyan-300 font-mono font-bold">
                      Durasi: {ticket.durationDays} Hari Kerja
                    </div>
                  </div>

                  {/* Alasan */}
                  <div className="space-y-1 bg-slate-900/40 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-gray-400 uppercase font-medium block">
                      Alasan Pengajuan
                    </span>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      {ticket.reason}
                    </p>
                  </div>
                </div>

                {/* Quota Deduction Callout */}
                {isPending && (
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-[11px] text-cyan-200/90 leading-relaxed mb-3 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-cyan-300">Otomatisasi Saldo Kuota:</strong> Persetujuan (Setujui Cuti) tiket ini akan otomatis memotong{' '}
                      <strong className="text-amber-300">{ticket.durationDays} hari</strong> dari saldo kuota cuti tahunan {ticket.employeeName}{' '}
                      (sisa saat ini: {emp?.leaveQuota.remaining ?? 12} hari &rarr; menjadi{' '}
                      {Math.max(0, (emp?.leaveQuota.remaining ?? 12) - ticket.durationDays)} hari).
                    </div>
                  </div>
                )}

                {/* Action Buttons & Note Input for Pending tickets */}
                {isPending && (
                  <div className="pt-3 border-t border-slate-700/40 space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-300 block mb-1">
                        Catatan Persetujuan / Verifikasi Pimpinan:
                      </label>
                      <input
                        type="text"
                        value={currentNote}
                        onChange={(e) =>
                          setNotesMap({ ...notesMap, [ticket.id]: e.target.value })
                        }
                        placeholder="Masukkan catatan verifikasi permohonan cuti..."
                        className="w-full px-3.5 py-2 rounded-xl text-xs border bg-slate-900/60 border-slate-700 text-white outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        id={`btn-reject-leave-${ticket.id}`}
                        type="button"
                        disabled={processingId === ticket.id}
                        onClick={() => handleReject(ticket)}
                        className="px-4 py-2 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>Tolak Cuti</span>
                      </button>

                      <button
                        id={`btn-approve-leave-${ticket.id}`}
                        type="button"
                        disabled={processingId === ticket.id}
                        onClick={() => handleApprove(ticket)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.35)] transition cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Setujui Cuti</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Audit for Approved / Rejected */}
                {!isPending && (
                  <div className="pt-2.5 border-t border-slate-700/40 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-gray-400 gap-1.5">
                    <div>
                      {ticket.approvedBy && (
                        <span>
                          Diverifikasi oleh: <strong className="text-gray-300">{ticket.approvedBy}</strong>{' '}
                          {ticket.approvalNotes && `— "${ticket.approvalNotes}"`}
                        </span>
                      )}
                    </div>
                    {ticket.status === 'Disetujui' && (
                      <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Kuota Cuti Terpotong Otomatis</span>
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
