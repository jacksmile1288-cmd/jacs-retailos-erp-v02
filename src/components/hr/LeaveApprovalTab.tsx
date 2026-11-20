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
  const [isProcessingAllLeaves, setIsProcessingAllLeaves] = useState(false);

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
    if (processingId) return;
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
    if (processingId) return;
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
    if (pendingLeaves.length === 0 || isProcessingAllLeaves) return;
    setIsProcessingAllLeaves(true);
    try {
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
    } finally {
      setIsProcessingAllLeaves(false);
    }
  };

  const hasPending = pendingLeaves.length > 0;

  return (
    <div id="leave-approval-tab" className="space-y-6 animate-in fade-in duration-200 font-sans">
      {/* 1. Header Banner */}
      <div
        className={`p-5 rounded-2xl border transition-all duration-200 ${
          hasPending
            ? isLight
              ? 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.22)] text-slate-900'
              : 'border-amber-500/75 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.18)] text-white'
            : isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] text-slate-900'
            : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] text-white'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
                hasPending
                  ? isLight
                    ? 'bg-amber-50 border-amber-500/60 text-amber-600'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : isLight
                  ? 'bg-cyan-50 border-cyan-500/60 text-cyan-700'
                  : 'bg-cyan-500/15 border-cyan-500/35 text-cyan-400'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal uppercase tracking-widest border ${
                    hasPending
                      ? isLight
                        ? 'bg-amber-50 border-amber-500/60 text-amber-700'
                        : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : isLight
                      ? 'bg-cyan-50 border-cyan-500/60 text-cyan-800'
                      : 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300'
                  }`}
                >
                  {hasPending && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />}
                  <span>HR Gateway • Otorisasi Cuti &amp; Izin</span>
                </span>
                <span className={`text-[11px] font-mono font-normal tracking-widest uppercase ${
                  hasPending ? 'text-amber-600 dark:text-amber-400' : isLight ? 'text-slate-600' : 'text-gray-400'
                }`}>
                  {pendingLeaves.length} Permohonan Menunggu
                </span>
              </div>
              <h3 className={`text-base font-medium tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                {isEn ? 'Leave & Permission Authorization Queue' : 'Otorisasi Pengajuan Cuti, Izin & Sakit Karyawan'}
              </h3>
              <p className={`text-sm font-normal max-w-2xl leading-relaxed mt-0.5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                {isEn
                  ? 'Verify staff absence requests, coordinate shift coverage, and automatically update annual leave quotas upon approval.'
                  : 'Verifikasi pengajuan ketidakhadiran staf, koordinasi penggantian shift, dan perbarui sisa kuota cuti tahunan secara otomatis saat disetujui.'}
              </p>
            </div>
          </div>

          {/* Pending Counter Banner */}
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <div
              className={`p-3 rounded-xl border text-right ${
                hasPending
                  ? isLight
                    ? 'bg-white border-amber-500/75 text-slate-900 shadow-[0_0_12px_rgba(245,158,11,0.14)]'
                    : 'bg-[#0d1117] border-amber-500/50 text-white'
                  : isLight
                  ? 'bg-white border-cyan-500/60 text-slate-900'
                  : 'bg-[#0d1117] border-cyan-500/35 text-white'
              }`}
            >
              <span className={`text-[11px] font-mono font-normal tracking-widest uppercase block ${
                isLight ? 'text-slate-600' : 'text-gray-400'
              }`}>
                Status Antrean
              </span>
              <span className={`text-lg font-mono font-medium flex items-center gap-1.5 justify-end mt-0.5 ${
                hasPending ? 'text-amber-600 dark:text-amber-400' : isLight ? 'text-cyan-700' : 'text-cyan-400'
              }`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${hasPending ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span>{pendingLeaves.length} Leave Pending</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          className={`p-4 rounded-2xl border overflow-visible min-h-[90px] flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 ${
            hasPending
              ? isLight
                ? 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.22)] hover:shadow-[0_0_24px_rgba(245,158,11,0.32)] text-slate-900'
                : 'border-amber-500/75 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.18)] hover:shadow-[0_0_24px_rgba(245,158,11,0.28)] text-white'
              : isLight
              ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] text-slate-900'
              : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] text-white'
          }`}
        >
          <div>
            <span className={`flex items-center gap-1.5 text-[11px] font-mono font-normal tracking-widest uppercase ${
              hasPending ? 'text-amber-600 dark:text-amber-400' : isLight ? 'text-slate-600' : 'text-gray-400'
            }`}>
              {hasPending && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />}
              <span>{isEn ? 'Pending Approvals' : 'Antrean Otorisasi'}</span>
            </span>
            <span className={`text-lg font-mono font-medium mt-1 block ${
              hasPending ? 'text-amber-600 dark:text-amber-400' : isLight ? 'text-slate-950' : 'text-white'
            }`}>
              {pendingLeaves.length} Berkas
            </span>
            <span className={`text-sm font-normal mt-0.5 block ${
              hasPending ? 'text-amber-700 dark:text-amber-400/90' : isLight ? 'text-slate-600' : 'text-gray-400'
            }`}>
              {pendingLeaves.length > 0 ? `${pendingLeaves.length} Perlu Tindakan` : 'Antrean bersih'}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
            hasPending
              ? isLight
                ? 'bg-amber-50 text-amber-600 border-amber-300'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/35'
              : isLight
              ? 'bg-cyan-50 text-cyan-600 border-cyan-300'
              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border overflow-visible min-h-[90px] flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 ${
            isLight
              ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] text-slate-900'
              : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] text-white'
          }`}
        >
          <div>
            <span className={`text-[11px] font-mono font-normal tracking-widest uppercase block ${
              isLight ? 'text-slate-600' : 'text-gray-400'
            }`}>
              {isEn ? 'Approved Requests' : 'Pengajuan Disetujui'}
            </span>
            <span className="text-lg font-mono font-medium text-emerald-600 dark:text-emerald-400 mt-1 block">
              {approvedLeaves.length} Berkas
            </span>
            <span className={`text-sm font-normal mt-0.5 block ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Kuota cuti telah dipotong
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
            isLight
              ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          }`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border overflow-visible min-h-[90px] flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 ${
            isLight
              ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] text-slate-900'
              : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] text-white'
          }`}
        >
          <div>
            <span className={`text-[11px] font-mono font-normal tracking-widest uppercase block ${
              isLight ? 'text-slate-600' : 'text-gray-400'
            }`}>
              {isEn ? 'Rejected Requests' : 'Pengajuan Ditolak'}
            </span>
            <span className="text-lg font-mono font-medium text-rose-600 dark:text-rose-400 mt-1 block">
              {rejectedLeaves.length} Berkas
            </span>
            <span className={`text-sm font-normal mt-0.5 block ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Kuota cuti tidak berkurang
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
            isLight
              ? 'bg-rose-50 text-rose-600 border-rose-300'
              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
          }`}>
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border overflow-visible min-h-[90px] flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 ${
            isLight
              ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] text-slate-900'
              : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] text-white'
          }`}
        >
          <div>
            <span className={`text-[11px] font-mono font-normal tracking-widest uppercase block ${
              isLight ? 'text-slate-600' : 'text-gray-400'
            }`}>
              {isEn ? 'Total Staff Active' : 'Total Karyawan Aktif'}
            </span>
            <span className="text-lg font-mono font-medium text-cyan-700 dark:text-cyan-400 mt-1 block">
              {employees.length} Karyawan
            </span>
            <span className={`text-sm font-normal mt-0.5 block ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Plafon: 12 - 16 hr/thn
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
            isLight
              ? 'bg-cyan-50 text-cyan-600 border-cyan-300'
              : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
          }`}>
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Leave Quota Tracker Cards */}
      <div
        className={`p-5 rounded-2xl border transition-all duration-200 ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
        }`}
      >
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 pb-2.5 border-b ${
          isLight ? 'border-slate-200' : 'border-gray-700/40'
        }`}>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-500" />
            <h4 className={`text-base font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {isEn ? 'Live Employee Leave Quota Balances' : 'Saldo Sisa Kuota Cuti Tahunan Karyawan'}
            </h4>
          </div>
          <span className={`text-[11px] font-mono font-normal tracking-widest uppercase ${
            isLight ? 'text-slate-600' : 'text-gray-400'
          }`}>
            Kuota terpotong otomatis saat disetujui
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {employees.map((emp) => {
            const pct = Math.round((emp.leaveQuota.remaining / Math.max(emp.leaveQuota.total, 1)) * 100);
            return (
              <div
                key={emp.id}
                className={`p-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${
                  isLight
                    ? 'bg-slate-50 border-cyan-500/40 hover:border-cyan-500/70'
                    : 'bg-[#0d1117] border-cyan-500/25 hover:border-cyan-500/50'
                }`}
              >
                <div className="text-sm font-medium truncate text-slate-900 dark:text-gray-100">
                  {emp.name}
                </div>
                <div className="text-[11px] font-mono font-normal text-slate-500 dark:text-gray-400 truncate">
                  {emp.department}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono font-normal">
                  <span className="text-slate-500 dark:text-gray-400">Sisa:</span>
                  <span className="text-cyan-700 dark:text-cyan-400">
                    {emp.leaveQuota.remaining} / {emp.leaveQuota.total} Hr
                  </span>
                </div>
                <div className={`w-full h-1.5 rounded-full mt-1.5 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-gray-800'}`}>
                  <div
                    className={`h-full ${
                      pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-rose-500'
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
        <div
          className={`flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl border ${
            isLight
              ? 'bg-white border-cyan-500/70 shadow-[0_0_14px_rgba(6,182,212,0.14)]'
              : 'bg-[#161b22] border-cyan-500/35'
          }`}
        >
          <button
            type="button"
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-[0.99] ${
              filterStatus === 'PENDING'
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : isLight
                ? 'text-slate-700 hover:bg-amber-50'
                : 'text-gray-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Menunggu (Pending)</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono font-normal ${
                filterStatus === 'PENDING'
                  ? 'bg-amber-950 text-amber-200'
                  : isLight
                  ? 'bg-amber-50 text-amber-700 border border-amber-300'
                  : 'bg-amber-500/15 text-amber-300'
              }`}
            >
              {pendingLeaves.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('APPROVED')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-[0.99] ${
              filterStatus === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.28)]'
                : isLight
                ? 'text-slate-700 hover:bg-emerald-50'
                : 'text-gray-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Disetujui</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono font-normal ${
                filterStatus === 'APPROVED'
                  ? 'bg-emerald-950 text-emerald-200'
                  : isLight
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {approvedLeaves.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('REJECTED')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer active:scale-[0.99] ${
              filterStatus === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.28)]'
                : isLight
                ? 'text-slate-700 hover:bg-rose-50'
                : 'text-gray-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Ditolak ({rejectedLeaves.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer active:scale-[0.99] ${
              filterStatus === 'ALL'
                ? 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.28)]'
                : isLight
                ? 'text-slate-700 hover:bg-cyan-50'
                : 'text-gray-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Semua ({leaveRequests.length})</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            id="btn-approve-all-pending-leaves"
            type="button"
            disabled={pendingLeaves.length === 0 || isProcessingAllLeaves}
            onClick={handleApproveAllPendingLeaves}
            className={`px-4 py-2 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 transition-all duration-200 ${
              isProcessingAllLeaves
                ? 'bg-slate-700/60 text-slate-400 border border-slate-600 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.28)] cursor-pointer active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none'
            }`}
            title={
              pendingLeaves.length === 0
                ? 'Tidak ada antrean cuti pending (0)'
                : `Setujui seluruh ${pendingLeaves.length} pengajuan cuti pending sekaligus & potong kuota cuti`
            }
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isProcessingAllLeaves ? 'Memproses Semua...' : 'Approve All Pending Leaves'}</span>
            {!isProcessingAllLeaves && pendingLeaves.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-white/20 font-mono font-normal">
                {pendingLeaves.length}
              </span>
            )}
          </button>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tiket, staf, alasan..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm font-normal outline-none transition-all duration-200 ${
                isLight
                  ? 'bg-white border-cyan-500/70 text-slate-900 shadow-[0_0_12px_rgba(6,182,212,0.12)] focus:border-cyan-500'
                  : 'bg-[#161b22] border-cyan-500/35 text-white focus:border-cyan-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 5. Daftar Tiket Permohonan Cuti */}
      {displayedLeaves.length === 0 ? (
        <div
          className={`p-12 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center ${
            isLight
              ? 'bg-white border-cyan-500/60 text-slate-700'
              : 'bg-[#161b22] border-cyan-500/35 text-gray-400'
          }`}
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
          <p className={`font-medium text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Tidak ada permohonan cuti yang sesuai kriteria.
          </p>
          <p className="text-sm font-normal text-slate-500 dark:text-gray-400 mt-1">
            {filterStatus === 'PENDING'
              ? 'Seluruh permohonan cuti telah selesai diotorisasi.'
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
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${
                  isPending
                    ? isLight
                      ? 'bg-amber-500/5 border-amber-500/80 shadow-[0_0_18px_rgba(245,158,11,0.2)] hover:shadow-[0_0_24px_rgba(245,158,11,0.3)]'
                      : 'bg-[#161b22] border-amber-500/70 shadow-[0_0_18px_rgba(245,158,11,0.16)] hover:shadow-[0_0_24px_rgba(245,158,11,0.28)]'
                    : isLight
                    ? 'bg-white border-cyan-500/60 shadow-[0_0_14px_rgba(6,182,212,0.12)] hover:shadow-[0_0_22px_rgba(6,182,212,0.24)]'
                    : 'bg-[#161b22] border-cyan-500/35 hover:shadow-[0_0_22px_rgba(6,182,212,0.2)]'
                }`}
              >
                {/* Top Info Bar */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b ${
                  isLight ? 'border-slate-200' : 'border-slate-700/40'
                }`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-mono font-normal text-[11px] tracking-widest uppercase px-2.5 py-0.5 rounded border ${
                        isLight
                          ? 'bg-cyan-50 text-cyan-800 border-cyan-500/60'
                          : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35'
                      }`}
                    >
                      {ticket.ticketNumber}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-normal px-2.5 py-0.5 rounded border ${
                        ticket.type === 'Cuti Tahunan'
                          ? isLight
                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                            : 'bg-blue-500/15 text-blue-300 border-blue-500/35'
                          : ticket.type === 'Sakit (Surat Dokter)'
                          ? isLight
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                          : isLight
                          ? 'bg-purple-50 text-purple-700 border-purple-300'
                          : 'bg-purple-500/15 text-purple-300 border-purple-500/35'
                      }`}
                    >
                      {ticket.type}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal uppercase tracking-widest border ${
                        isPending
                          ? isLight
                            ? 'bg-amber-50 text-amber-700 border-amber-500/70'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/45'
                          : ticket.status === 'Disetujui'
                          ? isLight
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-500/60'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : isLight
                          ? 'bg-rose-50 text-rose-700 border-rose-500/60'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {isPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />}
                      <span>{ticket.status}</span>
                    </span>
                  </div>

                  <div className={`flex items-center gap-3 text-[11px] font-mono font-normal ${
                    isLight ? 'text-slate-600' : 'text-gray-400'
                  }`}>
                    <span>Diajukan: {ticket.submittedAt}</span>
                  </div>
                </div>

                {/* Staff Details & Leave Period */}
                <div className="py-3.5 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-sm font-normal">
                  {/* Staff Info */}
                  <div className="space-y-1">
                    <span className={`text-[11px] font-mono font-normal uppercase tracking-widest block ${
                      isLight ? 'text-slate-500' : 'text-gray-400'
                    }`}>
                      Karyawan Pemohon
                    </span>
                    <div className="font-medium text-base text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 shrink-0" />
                      <span>{ticket.employeeName}</span>
                    </div>
                    <div className={`text-[11px] font-mono font-normal ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                      NIP: {ticket.nip} • {ticket.department}
                    </div>
                    {emp && (
                      <div className="text-[11px] font-mono font-normal text-amber-600 dark:text-amber-400 pt-0.5">
                        Sisa Kuota: {emp.leaveQuota.remaining} / {emp.leaveQuota.total} hari
                      </div>
                    )}
                  </div>

                  {/* Periode & Durasi */}
                  <div className="space-y-1">
                    <span className={`text-[11px] font-mono font-normal uppercase tracking-widest block ${
                      isLight ? 'text-slate-500' : 'text-gray-400'
                    }`}>
                      Periode Cuti / Izin
                    </span>
                    <div className={`text-sm font-normal font-mono flex items-center gap-1.5 ${
                      isLight ? 'text-slate-900' : 'text-gray-200'
                    }`}>
                      <Calendar className="w-4 h-4 text-cyan-500 shrink-0" />
                      <span>{ticket.startDate} s/d {ticket.endDate}</span>
                    </div>
                    <div className="text-[11px] font-mono font-normal text-cyan-700 dark:text-cyan-300">
                      Durasi: {ticket.durationDays} Hari Kerja
                    </div>
                  </div>

                  {/* Alasan */}
                  <div className={`space-y-1 p-3 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-slate-800'
                  }`}>
                    <span className={`text-[11px] font-mono font-normal uppercase tracking-widest block ${
                      isLight ? 'text-slate-500' : 'text-gray-400'
                    }`}>
                      Alasan Pengajuan
                    </span>
                    <p className={`text-sm font-normal leading-relaxed ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                      {ticket.reason}
                    </p>
                  </div>
                </div>

                {/* Quota Deduction Callout */}
                {isPending && (
                  <div className={`p-3 rounded-xl border text-sm font-normal leading-relaxed mb-3 flex items-start gap-2 ${
                    isLight
                      ? 'bg-cyan-50 border-cyan-500/50 text-slate-800'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
                  }`}>
                    <Sparkles className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                    <div>
                      <span className={`font-medium ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>
                        Otomatisasi Saldo Kuota:
                      </span>{' '}
                      Persetujuan tiket ini akan otomatis memotong{' '}
                      <span className="font-mono font-medium text-amber-600 dark:text-amber-300">
                        {ticket.durationDays} hari
                      </span>{' '}
                      dari saldo kuota cuti tahunan {ticket.employeeName} (sisa saat ini:{' '}
                      <span className="font-mono">{emp?.leaveQuota.remaining ?? 12}</span> hari &rarr; menjadi{' '}
                      <span className="font-mono">
                        {Math.max(0, (emp?.leaveQuota.remaining ?? 12) - ticket.durationDays)}
                      </span>{' '}
                      hari).
                    </div>
                  </div>
                )}

                {/* Action Buttons & Note Input for Pending tickets */}
                {isPending && (
                  <div className={`pt-3 border-t space-y-3 ${isLight ? 'border-slate-200' : 'border-slate-700/40'}`}>
                    <div>
                      <label className={`text-sm font-normal block mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                        Catatan Persetujuan / Verifikasi Pimpinan:
                      </label>
                      <input
                        type="text"
                        value={currentNote}
                        onChange={(e) =>
                          setNotesMap({ ...notesMap, [ticket.id]: e.target.value })
                        }
                        placeholder="Masukkan catatan verifikasi permohonan cuti..."
                        className={`w-full px-3.5 py-2 rounded-xl text-sm font-normal border outline-none transition-all duration-200 ${
                          isLight
                            ? 'bg-white border-cyan-500/60 text-slate-900 focus:border-cyan-500'
                            : 'bg-[#0d1117] border-cyan-500/35 text-white focus:border-amber-500'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        id={`btn-reject-leave-${ticket.id}`}
                        type="button"
                        disabled={processingId === ticket.id}
                        onClick={() => handleReject(ticket)}
                        className={`px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-1.5 transition-all duration-200 ${
                          processingId === ticket.id
                            ? 'bg-slate-700/60 text-slate-400 border border-slate-600 cursor-not-allowed shadow-none'
                            : isLight
                            ? 'border border-rose-500/60 bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer active:scale-[0.99] disabled:opacity-50'
                            : 'border border-rose-500/45 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 cursor-pointer active:scale-[0.99] disabled:opacity-50'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{processingId === ticket.id ? 'Memproses...' : 'Tolak Cuti'}</span>
                      </button>

                      <button
                        id={`btn-approve-leave-${ticket.id}`}
                        type="button"
                        disabled={processingId === ticket.id}
                        onClick={() => handleApprove(ticket)}
                        className={`px-5 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-200 ${
                          processingId === ticket.id
                            ? 'bg-slate-700/60 text-slate-400 border border-slate-600 cursor-not-allowed shadow-none'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500/40 shadow-[0_0_14px_rgba(16,185,129,0.28)] cursor-pointer active:scale-[0.99] disabled:opacity-50'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{processingId === ticket.id ? 'Memproses...' : 'Setujui Cuti'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Audit for Approved / Rejected */}
                {!isPending && (
                  <div className={`pt-2.5 border-t flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono font-normal gap-1.5 ${
                    isLight ? 'border-slate-200 text-slate-600' : 'border-slate-700/40 text-gray-400'
                  }`}>
                    <div>
                      {ticket.approvedBy && (
                        <span>
                          Diverifikasi oleh: <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-gray-200'}`}>{ticket.approvedBy}</span>{' '}
                          {ticket.approvalNotes && `— "${ticket.approvalNotes}"`}
                        </span>
                      )}
                    </div>
                    {ticket.status === 'Disetujui' && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-normal flex items-center gap-1">
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
