import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getReactiveNeonGlowStyle } from '../../utils/neonGlow';
import {
  Employee,
  AttendanceRecord,
  LeaveRequest,
  HrDepartment,
  ContractStatus,
  LeaveType,
} from '../../types';
import {
  Users,
  UserCheck,
  Clock,
  Calendar,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserPlus,
  LogIn,
  LogOut,
  Sparkles,
  Building2,
  Briefcase,
  Layers,
  X,
  Send,
  UserX,
  ChevronRight,
  Shield,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { PayrollTab } from './PayrollTab';
import { LeaveApprovalTab } from './LeaveApprovalTab';

type HrTab = 'directory' | 'attendance' | 'leave' | 'payroll';

const DEPARTMENTS: HrDepartment[] = [
  'POS & Kasir',
  'Warehouse & Logistik',
  'Purchasing',
  'Finance & Accounting',
  'Human Resources & Personalia',
  'Master Data & Katalog',
  'Executive & Management',
  'IT & Security',
  'IT & Super Admin',
];

const CONTRACT_STATUSES: ContractStatus[] = [
  'Tetap',
  'Kontrak (PKWT)',
  'Probation',
  'Magang',
];

const LEAVE_TYPES: LeaveType[] = [
  'Cuti Tahunan',
  'Izin Keperluan Mendesak',
  'Sakit (Surat Dokter)',
  'Cuti Khusus / Melahirkan',
];

const DEPT_TRANSLATION: Record<string, { id: string; en: string }> = {
  'POS & Kasir': { id: 'POS & Kasir', en: 'POS & Cashier' },
  'Warehouse & Logistik': { id: 'Warehouse & Logistik', en: 'Warehouse & Logistics' },
  'Purchasing': { id: 'Purchasing', en: 'Purchasing & Procurement' },
  'Finance & Accounting': { id: 'Finance & Accounting', en: 'Finance & Accounting' },
  'Executive & Management': { id: 'Executive & Management', en: 'Executive & Management' },
  'IT & Security': { id: 'IT & Keamanan', en: 'IT & Security' },
};

const CONTRACT_TRANSLATION: Record<string, { id: string; en: string }> = {
  'Tetap': { id: 'Tetap', en: 'Permanent' },
  'Kontrak (PKWT)': { id: 'Kontrak (PKWT)', en: 'Contract (Fixed-Term)' },
  'Probation': { id: 'Probation', en: 'Probation' },
  'Magang': { id: 'Magang', en: 'Internship' },
};

const LEAVE_TYPE_TRANSLATION: Record<string, { id: string; en: string }> = {
  'Cuti Tahunan': { id: 'Cuti Tahunan', en: 'Annual Leave' },
  'Izin Keperluan Mendesak': { id: 'Izin Keperluan Mendesak', en: 'Urgent Personal Leave' },
  'Sakit (Surat Dokter)': { id: 'Sakit (Surat Dokter)', en: 'Sick Leave (Doctor Note)' },
  'Cuti Khusus / Melahirkan': { id: 'Cuti Khusus / Melahirkan', en: 'Special / Maternity Leave' },
};

const ATTENDANCE_STATUS_TRANSLATION: Record<string, { id: string; en: string }> = {
  'Tepat Waktu': { id: 'Tepat Waktu', en: 'On Time' },
  'Terlambat': { id: 'Terlambat', en: 'Late' },
  'Izin': { id: 'Izin', en: 'Permission' },
  'Cuti': { id: 'Cuti', en: 'On Leave' },
  'Sakit': { id: 'Sakit', en: 'Sick' },
};

const LEAVE_STATUS_TRANSLATION: Record<string, { id: string; en: string }> = {
  'Menunggu': { id: 'Menunggu', en: 'Pending' },
  'Disetujui': { id: 'Disetujui', en: 'Approved' },
  'Ditolak': { id: 'Ditolak', en: 'Rejected' },
};

export const HrModule: React.FC = () => {
  const {
    theme,
    language,
    employees,
    attendanceLogs,
    leaveRequests,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    recordClockIn,
    recordClockOut,
    submitLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    activeUser,
    isPayrollSynced,
  } = useApp();

  const isLight = theme === 'light';
  const isEn = language === 'en';

  const formatDept = (dept: string) =>
    DEPT_TRANSLATION[dept] ? (isEn ? DEPT_TRANSLATION[dept].en : DEPT_TRANSLATION[dept].id) : dept;
  const formatContract = (st: string) =>
    CONTRACT_TRANSLATION[st] ? (isEn ? CONTRACT_TRANSLATION[st].en : CONTRACT_TRANSLATION[st].id) : st;
  const formatLeaveType = (lt: string) =>
    LEAVE_TYPE_TRANSLATION[lt] ? (isEn ? LEAVE_TYPE_TRANSLATION[lt].en : LEAVE_TYPE_TRANSLATION[lt].id) : lt;
  const formatAttStatus = (st: string) =>
    ATTENDANCE_STATUS_TRANSLATION[st] ? (isEn ? ATTENDANCE_STATUS_TRANSLATION[st].en : ATTENDANCE_STATUS_TRANSLATION[st].id) : st;
  const formatLeaveStatus = (st: string) =>
    LEAVE_STATUS_TRANSLATION[st] ? (isEn ? LEAVE_STATUS_TRANSLATION[st].en : LEAVE_STATUS_TRANSLATION[st].id) : st;

  // Active Main Tab & Hover Reactive State
  const [activeTab, setActiveTab] = useState<HrTab>('directory');
  const [hoveredTab, setHoveredTab] = useState<HrTab | null>(null);

  // --- TAB 1: IDENTITAS KARYAWAN STATE ---
  const [searchEmployee, setSearchEmployee] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedContractFilter, setSelectedContractFilter] = useState<string>('ALL');
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Employee Form State
  const [empForm, setEmpForm] = useState({
    nip: '',
    name: '',
    department: 'POS & Kasir' as HrDepartment,
    role: '',
    contractStatus: 'Kontrak (PKWT)' as ContractStatus,
    phone: '',
    email: '',
    joinDate: new Date().toISOString().slice(0, 10),
    shift: 'Pagi (07:00 - 15:30)',
    leaveTotal: 12,
    avatar: '',
  });

  // --- TAB 2: AKTIVITAS & KEHADIRAN STATE ---
  const [searchAttendance, setSearchAttendance] = useState('');
  const [attendanceDeptFilter, setAttendanceDeptFilter] = useState<string>('ALL');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<string>('ALL');
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [clockInEmpId, setClockInEmpId] = useState('');
  const [clockInLocation, setClockInLocation] = useState('Terminal 1 - POS Reguler');
  const [clockInNotes, setClockInNotes] = useState('');

  // --- TAB 3: CUTI & IZIN STATE ---
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<string>('ALL');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('ALL');
  const [isNewLeaveModalOpen, setIsNewLeaveModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState<{
    request: LeaveRequest;
    action: 'approve' | 'reject';
  } | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  // New Leave Form State
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    type: 'Cuti Tahunan' as LeaveType,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    durationDays: 1,
    reason: '',
  });

  // --- METRICS SUMMARY COMPUTATION ---
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAttendance = useMemo(
    () => attendanceLogs.filter((a) => a.date === todayStr),
    [attendanceLogs, todayStr]
  );
  const presentTodayCount = todayAttendance.length;
  const onTimeCount = todayAttendance.filter((a) => a.status === 'Tepat Waktu').length;
  const lateCount = todayAttendance.filter((a) => a.status === 'Terlambat').length;
  const pendingLeavesCount = useMemo(
    () => leaveRequests.filter((l) => l.status === 'Menunggu').length,
    [leaveRequests]
  );

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        emp.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
        emp.nip.toLowerCase().includes(searchEmployee.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchEmployee.toLowerCase()) ||
        emp.phone.includes(searchEmployee);

      const matchDept =
        selectedDeptFilter === 'ALL' || emp.department === selectedDeptFilter;
      const matchContract =
        selectedContractFilter === 'ALL' || emp.contractStatus === selectedContractFilter;

      return matchSearch && matchDept && matchContract;
    });
  }, [employees, searchEmployee, selectedDeptFilter, selectedContractFilter]);

  // Filtered Attendance Records
  const filteredAttendance = useMemo(() => {
    return attendanceLogs.filter((att) => {
      const matchSearch =
        att.employeeName.toLowerCase().includes(searchAttendance.toLowerCase()) ||
        att.nip.toLowerCase().includes(searchAttendance.toLowerCase()) ||
        att.location.toLowerCase().includes(searchAttendance.toLowerCase());

      const matchDept =
        attendanceDeptFilter === 'ALL' || att.department === attendanceDeptFilter;
      const matchStatus =
        attendanceStatusFilter === 'ALL' || att.status === attendanceStatusFilter;

      return matchSearch && matchDept && matchStatus;
    });
  }, [attendanceLogs, searchAttendance, attendanceDeptFilter, attendanceStatusFilter]);

  // Filtered Leave Requests
  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter((req) => {
      const matchStatus =
        leaveStatusFilter === 'ALL' || req.status === leaveStatusFilter;
      const matchType =
        leaveTypeFilter === 'ALL' || req.type === leaveTypeFilter;

      return matchStatus && matchType;
    });
  }, [leaveRequests, leaveStatusFilter, leaveTypeFilter]);

  // Handle open Add/Edit Employee Modal
  const handleOpenAddEmployee = () => {
    setEditingEmployee(null);
    setEmpForm({
      nip: `JACS-EMP-${new Date().getFullYear()}${String(employees.length + 1).padStart(2, '0')}`,
      name: '',
      department: 'POS & Kasir',
      role: '',
      contractStatus: 'Kontrak (PKWT)',
      phone: '',
      email: '',
      joinDate: new Date().toISOString().slice(0, 10),
      shift: 'Pagi (07:00 - 15:30)',
      leaveTotal: 12,
      avatar: '',
    });
    setIsEmployeeModalOpen(true);
  };

  const handleOpenEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpForm({
      nip: emp.nip,
      name: emp.name,
      department: emp.department,
      role: emp.role,
      contractStatus: emp.contractStatus,
      phone: emp.phone,
      email: emp.email,
      joinDate: emp.joinDate,
      shift: emp.shift,
      leaveTotal: emp.leaveQuota.total,
      avatar: emp.avatar || '',
    });
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.name.trim()) return;

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, {
        name: empForm.name,
        department: empForm.department,
        division: empForm.department,
        role: empForm.role,
        contractStatus: empForm.contractStatus,
        phone: empForm.phone,
        email: empForm.email,
        joinDate: empForm.joinDate,
        shift: empForm.shift,
        avatar: empForm.avatar || null,
        avatarUrl: empForm.avatar || null,
        leaveQuota: {
          ...editingEmployee.leaveQuota,
          total: empForm.leaveTotal,
          remaining: Math.max(0, empForm.leaveTotal - editingEmployee.leaveQuota.used),
        },
      });
    } else {
      addEmployee({
        nip: empForm.nip,
        name: empForm.name,
        division: empForm.department || 'POS & Kasir',
        role: empForm.role,
        pin: '1111',
        avatarUrl: empForm.avatar ? empForm.avatar : null,
        department: empForm.department,
        contractStatus: empForm.contractStatus,
        phone: empForm.phone,
        email: empForm.email,
        joinDate: empForm.joinDate,
        shift: empForm.shift,
        avatar: empForm.avatar || null,
        leaveQuota: {
          total: empForm.leaveTotal,
          used: 0,
          remaining: empForm.leaveTotal,
        },
        status: 'Active',
      });
    }
    setIsEmployeeModalOpen(false);
  };

  // Handle Submit Clock In
  const handleSaveClockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clockInEmpId) return;
    recordClockIn(clockInEmpId, clockInNotes, clockInLocation);
    setIsClockInModalOpen(false);
    setClockInEmpId('');
    setClockInNotes('');
  };

  // Handle Submit Leave Request
  const handleSaveLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.employeeId) return;
    const emp = employees.find((x) => x.id === leaveForm.employeeId);
    if (!emp) return;

    submitLeaveRequest({
      employeeId: emp.id,
      nip: emp.nip,
      employeeName: emp.name,
      department: emp.department,
      type: leaveForm.type,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      durationDays: Number(leaveForm.durationDays) || 1,
      reason: leaveForm.reason || 'Keperluan pribadi / izin.',
    });

    setIsNewLeaveModalOpen(false);
    setLeaveForm({
      employeeId: '',
      type: 'Cuti Tahunan',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      durationDays: 1,
      reason: '',
    });
  };

  // Confirm Approval / Rejection
  const handleExecuteApproval = () => {
    if (!approvalTarget) return;
    const approver = activeUser ? `${activeUser.name} (${activeUser.role})` : 'HR / Store Manager';

    if (approvalTarget.action === 'approve') {
      approveLeaveRequest(approvalTarget.request.id, approver, approvalNotes);
    } else {
      rejectLeaveRequest(approvalTarget.request.id, approver, approvalNotes);
    }

    setIsApprovalModalOpen(false);
    setApprovalTarget(null);
    setApprovalNotes('');
  };

  return (
    <div id="hr-module-container" className="w-full min-w-0 overflow-x-hidden space-y-6 max-w-7xl mx-auto pb-8">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#161b22] border-[#30363d] text-white'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold tracking-widest uppercase ${
                isLight ? 'text-sky-600' : 'text-[#00f2fe]'
              }`}>
                {isEn ? 'HUMAN RESOURCE & WORKFORCE INTELLIGENCE' : 'SDM & INTELIJEN MANAJEMEN KARYAWAN'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                isLight
                  ? 'bg-sky-50 text-sky-700 border border-slate-200'
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              }`}>
                JacS ERP HR
              </span>
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.01em] flex items-center gap-2.5">
              <Users className={`w-6 h-6 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
              {isEn ? 'Human Resources & Workforce Management' : 'HR & Manajemen Karyawan'}
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl">
              {isEn
                ? 'Comprehensive personnel directory across ERP divisions, real-time daily shift attendance logs, and leave, permission & sick approval system.'
                : 'Direktori personil lengkap lintas divisi ERP, pencatatan log presensi shift harian realtime, dan sistem approval tiket cuti, izin, serta sakit.'}
            </p>
          </div>

          {/* Quick Header Metric Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={`px-3 py-2 rounded-xl border text-center ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
            }`}>
              <span className="text-[10px] text-gray-400 block font-medium">
                {isEn ? 'Total Personnel' : 'Total Personil'}
              </span>
              <span className={`text-sm font-semibold ${isLight ? 'text-sky-700 font-bold' : 'text-cyan-400'}`}>
                {employees.length} {isEn ? 'Staff' : 'Orang'}
              </span>
            </div>
            <div className={`px-3 py-2 rounded-xl border text-center ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
            }`}>
              <span className="text-[10px] text-gray-400 block font-medium">
                {isEn ? "Today's Attendance" : 'Presensi Hari Ini'}
              </span>
              <span className={`text-sm font-semibold ${isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400'}`}>
                {presentTodayCount} {isEn ? 'Present' : 'Hadir'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('leave')}
              className={`px-3 py-2 rounded-xl border text-center cursor-pointer transition hover:border-amber-500/50 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
              }`}
            >
              <span className="text-[10px] text-gray-400 block font-medium">
                {isEn ? 'Leave Queue' : 'Antrean Cuti'}
              </span>
              <span className={`text-sm font-semibold font-mono ${
                pendingLeavesCount > 0
                  ? isLight ? 'text-amber-700 font-bold' : 'text-amber-400 font-bold'
                  : isLight ? 'text-slate-500' : 'text-gray-400'
              }`}>
                {pendingLeavesCount} Leave
              </span>
            </button>
          </div>
        </div>

        {/* 2. THREE MAIN NAVIGATION TABS (Bilingual & Hover Glow Reactive) */}
        <div className="mt-6 pt-4 border-t border-gray-700/30 flex flex-wrap items-center gap-2 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            onMouseEnter={() => setHoveredTab('directory')}
            onMouseLeave={() => setHoveredTab(null)}
            style={getReactiveNeonGlowStyle(
              '#06b6d4',
              activeTab === 'directory',
              hoveredTab === 'directory',
              isLight
            )}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shrink-0 transition-all duration-150 ease-out"
          >
            <Users className={`w-4 h-4 ${activeTab === 'directory' ? (isLight ? 'text-sky-600' : 'text-cyan-400') : isLight ? 'text-slate-400' : 'text-gray-400'}`} />
            <span className={activeTab === 'directory' ? (isLight ? 'text-sky-700 font-bold' : 'text-cyan-400 font-bold') : isLight ? 'text-slate-700' : 'text-slate-300'}>
              {isEn ? 'Employee Directory' : 'Direktori Karyawan'}
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              isLight
                ? activeTab === 'directory'
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-slate-100 text-slate-600'
                : 'bg-cyan-500/10 text-cyan-300'
            }`}>
              {employees.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            onMouseEnter={() => setHoveredTab('attendance')}
            onMouseLeave={() => setHoveredTab(null)}
            style={getReactiveNeonGlowStyle(
              '#10b981',
              activeTab === 'attendance',
              hoveredTab === 'attendance',
              isLight
            )}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shrink-0 transition-all duration-150 ease-out"
          >
            <Clock className={`w-4 h-4 ${activeTab === 'attendance' ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : isLight ? 'text-slate-400' : 'text-gray-400'}`} />
            <span className={activeTab === 'attendance' ? (isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400 font-bold') : isLight ? 'text-slate-700' : 'text-slate-300'}>
              {isEn ? 'Attendance & Shifts' : 'Aktivitas & Kehadiran'}
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              isLight
                ? activeTab === 'attendance'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
                : 'bg-emerald-500/10 text-emerald-300'
            }`}>
              {todayAttendance.length} {isEn ? 'Today' : 'Hari Ini'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leave')}
            onMouseEnter={() => setHoveredTab('leave')}
            onMouseLeave={() => setHoveredTab(null)}
            style={getReactiveNeonGlowStyle(
              '#f59e0b',
              activeTab === 'leave',
              hoveredTab === 'leave',
              isLight
            )}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shrink-0 transition-all duration-150 ease-out"
          >
            <Calendar className={`w-4 h-4 ${activeTab === 'leave' ? (isLight ? 'text-amber-600' : 'text-amber-400') : isLight ? 'text-slate-400' : 'text-gray-400'}`} />
            <span className={activeTab === 'leave' ? (isLight ? 'text-amber-700 font-bold' : 'text-amber-400 font-bold') : isLight ? 'text-slate-700' : 'text-slate-300'}>
              {isEn ? 'Leave & Requests' : 'Cuti & Perizinan'}
            </span>
            {pendingLeavesCount > 0 && (
              <span id="badge-leave-pending" className={`px-1.5 py-0.2 rounded text-[10px] font-mono border font-bold ${
                isLight ? 'bg-amber-50 text-amber-800 border-slate-200' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {pendingLeavesCount} Leave
              </span>
            )}
          </button>

          <button
            type="button"
            id="tab-btn-payroll"
            onClick={() => setActiveTab('payroll')}
            onMouseEnter={() => setHoveredTab('payroll')}
            onMouseLeave={() => setHoveredTab(null)}
            style={getReactiveNeonGlowStyle(
              '#0052FF',
              activeTab === 'payroll',
              hoveredTab === 'payroll',
              isLight
            )}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shrink-0 transition-all duration-150 ease-out"
          >
            <ShieldCheck className={`w-4 h-4 ${activeTab === 'payroll' ? (isLight ? 'text-blue-600' : 'text-[#58a6ff]') : isLight ? 'text-slate-400' : 'text-gray-400'}`} />
            <span
              className={
                activeTab === 'payroll'
                  ? isLight
                    ? 'text-blue-700 font-bold'
                    : 'text-[#0052FF] dark:text-[#58a6ff] font-bold'
                  : isLight
                  ? 'text-slate-700'
                  : 'text-slate-300'
              }
            >
              {isEn ? 'Payroll & Commission' : 'Payroll & Komisi'}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                isPayrollSynced
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-800 border-slate-200'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : isLight
                  ? 'bg-blue-50 text-blue-800 border-slate-200'
                  : 'bg-[#0052FF]/20 text-[#0052FF] dark:text-[#58a6ff] border-[#0052FF]/30'
              }`}
            >
              {isPayrollSynced
                ? isEn
                  ? 'Synced'
                  : 'Sinkron'
                : isEn
                ? 'Active'
                : 'Otomatis'}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: IDENTITAS KARYAWAN */}
      {/* ========================================================================= */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Controls & Search Toolbar */}
          <div
            className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Search Bar */}
              <div className="relative min-w-[240px] flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={isEn ? 'Search name, NIP, role, contact...' : 'Cari nama, NIP, jabatan, no kontak...'}
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  aria-label="Filter Departemen"
                  className={`px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                >
                  <option value="ALL">{isEn ? 'All Departments' : 'Semua Departemen'}</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {formatDept(dept)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contract Status Filter */}
              <select
                value={selectedContractFilter}
                onChange={(e) => setSelectedContractFilter(e.target.value)}
                aria-label="Filter Status Kontrak"
                className={`px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-[#0d1117] border-[#30363d] text-white'
                }`}
              >
                <option value="ALL">{isEn ? 'All Contract Types' : 'Semua Status Kontrak'}</option>
                {CONTRACT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatContract(status)}
                  </option>
                ))}
              </select>
            </div>

            {/* Tambah Karyawan Button */}
            <button
              type="button"
              onClick={handleOpenAddEmployee}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition shrink-0 ${
                isLight
                  ? 'bg-sky-600 hover:bg-sky-700 text-white border border-sky-600 shadow-sm'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{isEn ? 'Add Employee' : 'Tambah Karyawan'}</span>
            </button>
          </div>

          {/* Employee Directory Table */}
          <div
            className={`w-full min-w-0 rounded-2xl border overflow-hidden ${
              isLight
                ? 'bg-white border-slate-200 shadow-sm'
                : 'bg-[#161b22] border-[#30363d]'
            }`}
          >
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-600'
                        : 'bg-[#0d1117] border-gray-800 text-gray-400'
                    }`}
                  >
                    <th className="py-3 px-4">{isEn ? 'Employee & NIP' : 'NIP & Karyawan'}</th>
                    <th className="py-3 px-4">{isEn ? 'Department / Division' : 'Departemen / Divisi'}</th>
                    <th className="py-3 px-4">{isEn ? 'Role / Position' : 'Role / Jabatan'}</th>
                    <th className="py-3 px-4">{isEn ? 'Contract Status' : 'Status Kontrak'}</th>
                    <th className="py-3 px-4">{isEn ? 'Shift & Leave Quota' : 'Shift & Kuota Cuti'}</th>
                    <th className="py-3 px-4">{isEn ? 'Contact (Phone / Email)' : 'Kontak (Telp / Email)'}</th>
                    <th className="py-3 px-4 text-center">{isEn ? 'Actions' : 'Aksi'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 font-sans">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <UserX className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        <p className="font-semibold">
                          {isEn ? 'No employee data matching the filters.' : 'Tidak ada data karyawan yang cocok.'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {isEn
                            ? 'Please change search keywords or department filter.'
                            : 'Silakan ubah kata kunci atau filter departemen.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      return (
                        <tr
                          key={emp.id}
                          className={`transition ${
                            isLight
                              ? 'hover:bg-slate-50/80 text-slate-800'
                              : 'hover:bg-white/[0.02] text-gray-200'
                          }`}
                        >
                          {/* NIP & Avatar & Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {emp.avatarUrl || emp.avatar ? (
                                <img
                                  src={emp.avatarUrl || emp.avatar || ''}
                                  alt={emp.name}
                                  className={`w-10 h-10 rounded-full object-cover border shrink-0 ${
                                    isLight ? 'border-slate-200' : 'border-cyan-500/30'
                                  }`}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${
                                  isLight ? 'bg-slate-200 border-slate-300 text-slate-500' : 'bg-slate-800 border-slate-700 text-slate-400'
                                }`}>
                                  <Users className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-sm tracking-[-0.01em] block">
                                  {emp.name}
                                </span>
                                <span className={`text-[11px] font-mono font-medium ${
                                  isLight ? 'text-sky-700' : 'text-cyan-400'
                                }`}>
                                  {emp.nip}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Departemen */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                emp.department === 'POS & Kasir'
                                  ? isLight ? 'bg-amber-50 text-amber-800 border-slate-200' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                  : emp.department === 'Warehouse & Logistik'
                                  ? isLight ? 'bg-purple-50 text-purple-800 border-slate-200' : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                                  : emp.department === 'Finance & Accounting'
                                  ? isLight ? 'bg-emerald-50 text-emerald-800 border-slate-200' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : emp.department === 'Executive & Management'
                                  ? isLight ? 'bg-sky-50 text-sky-800 border-slate-200' : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                                  : emp.department === 'Purchasing'
                                  ? isLight ? 'bg-rose-50 text-rose-800 border-slate-200' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                  : isLight ? 'bg-blue-50 text-blue-800 border-slate-200' : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              }`}
                            >
                              <Building2 className="w-3.5 h-3.5 shrink-0" />
                              {formatDept(emp.department)}
                            </span>
                          </td>

                          {/* Role / Jabatan */}
                          <td className="py-3 px-4">
                            <span className="font-medium text-xs block">{emp.role}</span>
                            <span className="text-[10px] text-gray-500">
                              {isEn ? 'Joined:' : 'Bergabung:'} {emp.joinDate}
                            </span>
                          </td>

                          {/* Status Kontrak */}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                emp.contractStatus === 'Tetap'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : emp.contractStatus === 'Kontrak (PKWT)'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  : emp.contractStatus === 'Probation'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              }`}
                            >
                              {formatContract(emp.contractStatus)}
                            </span>
                          </td>

                          {/* Shift & Kuota Cuti */}
                          <td className="py-3 px-4">
                            <span className="text-[11px] text-gray-400 block">{emp.shift}</span>
                            <span className="text-[11px] text-cyan-300 font-mono font-semibold">
                              {isEn ? 'Remaining Leave:' : 'Sisa Cuti:'} {emp.leaveQuota.remaining} / {emp.leaveQuota.total} {isEn ? 'days' : 'hari'}
                            </span>
                          </td>

                          {/* Kontak */}
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <a
                                href={`tel:${emp.phone}`}
                                className="text-xs text-gray-300 hover:text-cyan-400 flex items-center gap-1.5 transition"
                              >
                                <Phone className="w-3 h-3 text-cyan-400" />
                                <span>{emp.phone}</span>
                              </a>
                              <span className="text-[11px] text-gray-500 flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-gray-500" />
                                <span>{emp.email}</span>
                              </span>
                            </div>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditEmployee(emp)}
                                title={isEn ? 'Edit Employee' : 'Edit Karyawan'}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(isEn ? `Are you sure you want to delete employee ${emp.name}?` : `Yakin ingin menghapus data karyawan ${emp.name}?`)) {
                                    deleteEmployee(emp.id);
                                  }
                                }}
                                title={isEn ? 'Delete Employee' : 'Hapus Karyawan'}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Count */}
            <div
              className={`p-3 border-t text-xs flex items-center justify-between ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-600'
                  : 'bg-[#0d1117] border-[#30363d] text-gray-400'
              }`}
            >
              <span>
                {isEn ? 'Showing' : 'Menampilkan'}{' '}
                <strong className="text-cyan-400">{filteredEmployees.length}</strong>{' '}
                {isEn ? 'of' : 'dari'} {employees.length} {isEn ? 'registered personnel' : 'personil terdaftar'}
              </span>
              <span className="text-[11px] font-mono text-gray-500">
                {isEn ? 'JacS ERP synchronized encrypted data' : 'Data sinkron terenkripsi JacS ERP'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AKTIVITAS & KEHADIRAN */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {/* Activity Cards Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className={`p-4 rounded-2xl border ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium">
                  {isEn ? "Today's Attendance" : 'Presensi Hari Ini'}
                </span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-semibold tracking-tight text-cyan-400">
                {presentTodayCount} / {employees.length}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {Math.round((presentTodayCount / Math.max(employees.length, 1)) * 100)}%{' '}
                {isEn ? 'active attendance' : 'kehadiran aktif'}
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium">
                  {isEn ? 'On Time' : 'Tepat Waktu'}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-semibold tracking-tight text-emerald-400">
                {onTimeCount} {isEn ? 'Staff' : 'Orang'}
              </div>
              <p className="text-[11px] text-emerald-500/80 mt-1">
                {isEn ? 'According to shift schedule' : 'Sesuai jam operasional shift'}
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium">
                  {isEn ? 'Late' : 'Terlambat'}
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-semibold tracking-tight text-rose-400">
                {lateCount} {isEn ? 'Staff' : 'Orang'}
              </div>
              <p className="text-[11px] text-rose-500/80 mt-1">
                {isEn ? 'Tolerance deviation > 5-10 mins' : 'Deviasi waktu toleransi > 5-10 mnt'}
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium">
                  {isEn ? 'Active Leave & Sick' : 'Izin & Sakit Aktif'}
                </span>
                <Calendar className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-semibold tracking-tight text-amber-400">
                {leaveRequests.filter((l) => l.status === 'Disetujui' && l.startDate <= todayStr && l.endDate >= todayStr).length} {isEn ? 'Staff' : 'Orang'}
              </div>
              <p className="text-[11px] text-amber-500/80 mt-1">
                {isEn ? 'Legitimate verified absence' : 'Status sah terverifikasi pimpinan'}
              </p>
            </div>
          </div>

          {/* Attendance Toolbar */}
          <div
            className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search */}
              <div className="relative min-w-[220px] flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={isEn ? 'Search log name, NIP, terminal...' : 'Cari log nama, NIP, terminal...'}
                  value={searchAttendance}
                  onChange={(e) => setSearchAttendance(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              {/* Department Filter */}
              <select
                value={attendanceDeptFilter}
                onChange={(e) => setAttendanceDeptFilter(e.target.value)}
                aria-label="Filter Departemen Presensi"
                className={`px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-[#0d1117] border-[#30363d] text-white'
                }`}
              >
                <option value="ALL">{isEn ? 'All Departments' : 'Semua Departemen'}</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {formatDept(d)}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={attendanceStatusFilter}
                onChange={(e) => setAttendanceStatusFilter(e.target.value)}
                aria-label="Filter Status Presensi"
                className={`px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-[#0d1117] border-[#30363d] text-white'
                }`}
              >
                <option value="ALL">{isEn ? 'All Attendance Status' : 'Semua Status Kehadiran'}</option>
                <option value="Tepat Waktu">{isEn ? 'On Time' : 'Tepat Waktu'}</option>
                <option value="Terlambat">{isEn ? 'Late' : 'Terlambat'}</option>
                <option value="Izin">{isEn ? 'Permission' : 'Izin'}</option>
                <option value="Cuti">{isEn ? 'On Leave' : 'Cuti'}</option>
                <option value="Sakit">{isEn ? 'Sick' : 'Sakit'}</option>
              </select>
            </div>

            {/* Quick Clock-In Action */}
            <button
              type="button"
              onClick={() => setIsClockInModalOpen(true)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition shrink-0 ${
                isLight
                  ? 'bg-sky-600 hover:bg-sky-700 text-white border border-sky-600 shadow-sm'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>{isEn ? 'Record Shift Clock-In' : 'Input Clock-In Shift'}</span>
            </button>
          </div>

          {/* Attendance Log Table */}
          <div
            className={`w-full min-w-0 rounded-2xl border overflow-hidden ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
            }`}
          >
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-600'
                        : 'bg-[#0d1117] border-gray-800 text-gray-400'
                    }`}
                  >
                    <th className="py-3 px-4">{isEn ? 'Employee & NIP' : 'Karyawan & NIP'}</th>
                    <th className="py-3 px-4">{isEn ? 'Department' : 'Departemen'}</th>
                    <th className="py-3 px-4">{isEn ? 'Date & Shift' : 'Tanggal & Shift'}</th>
                    <th className="py-3 px-4">{isEn ? 'Clock In / Out' : 'Clock In / Out'}</th>
                    <th className="py-3 px-4">{isEn ? 'Attendance Status' : 'Status Kehadiran'}</th>
                    <th className="py-3 px-4">{isEn ? 'Location / Terminal' : 'Lokasi / Terminal'}</th>
                    <th className="py-3 px-4">{isEn ? 'Operational Notes' : 'Catatan Operasional'}</th>
                    <th className="py-3 px-4 text-center">{isEn ? 'Action' : 'Aksi'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        <p className="font-semibold">
                          {isEn ? 'No attendance records matching the filters.' : 'Belum ada riwayat presensi yang sesuai filter.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((att) => {
                      return (
                        <tr
                          key={att.id}
                          className={`transition ${
                            isLight
                              ? 'hover:bg-slate-50 text-slate-800'
                              : 'hover:bg-white/[0.02] text-gray-200'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {att.avatar ? (
                                <img
                                  src={att.avatar}
                                  alt={att.employeeName}
                                  className={`w-8 h-8 rounded-full object-cover border shrink-0 ${
                                    isLight ? 'border-slate-200' : 'border-cyan-500/30'
                                  }`}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
                                  isLight ? 'bg-slate-200 border-slate-300 text-slate-500' : 'bg-slate-800 border-slate-700 text-slate-400'
                                }`}>
                                  <Users className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-xs block">{att.employeeName}</span>
                                <span className={`text-[10px] font-mono ${isLight ? 'text-sky-700' : 'text-cyan-400'}`}>{att.nip}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-xs text-gray-300 font-medium">{formatDept(att.department)}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-medium text-xs block">{att.date}</span>
                            <span className="text-[10px] text-gray-400">{att.shift}</span>
                          </td>

                          <td className="py-3 px-4 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="text-cyan-400 font-semibold">{att.clockIn}</span>
                              <span className="text-gray-500">→</span>
                              {att.clockOut ? (
                                <span className="text-emerald-400 font-semibold">{att.clockOut}</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                  {isEn ? 'Active' : 'Aktif'}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                att.status === 'Tepat Waktu'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : att.status === 'Terlambat'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {formatAttStatus(att.status)}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-[11px] text-gray-400 block">{att.location}</span>
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            <p className="text-[11px] text-gray-300 line-clamp-2" title={att.notes}>
                              {att.notes || '-'}
                            </p>
                          </td>

                          <td className="py-3 px-4 text-center">
                            {!att.clockOut ? (
                              <button
                                type="button"
                                onClick={() => recordClockOut(att.id, isEn ? 'Finished work shift' : 'Selesai shift kerja')}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                              >
                                Clock Out
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-500 font-mono">
                                {isEn ? 'Completed' : 'Tuntas'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CUTI, IZIN & SAKIT (LEAVE APPROVAL QUEUE) */}
      {/* ========================================================================= */}
      {activeTab === 'leave' && (
        <LeaveApprovalTab isLight={isLight} isEn={isEn} />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PENGGAJIAN & BPJS (PAYROLL & BPJS) */}
      {/* ========================================================================= */}
      {activeTab === 'payroll' && (
        <PayrollTab isLight={isLight} isEn={isEn} />
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH / EDIT KARYAWAN */}
      {/* ========================================================================= */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl p-6 border shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-700/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  isLight ? 'bg-sky-50 text-sky-700 border-slate-200' : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                }`}>
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base tracking-[-0.01em]">
                    {editingEmployee
                      ? isEn
                        ? 'Edit Employee Data'
                        : 'Edit Data Karyawan'
                      : isEn
                      ? 'Add New Employee'
                      : 'Tambah Karyawan Baru'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {isEn ? 'JacS ERP Personnel Directory' : 'Direktori Personil JacS ERP'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-400">
                    {isEn ? 'Employee NIP' : 'NIP Karyawan'}
                  </label>
                  <input
                    type="text"
                    required
                    value={empForm.nip}
                    onChange={(e) => setEmpForm({ ...empForm, nip: e.target.value })}
                    className={`w-full text-xs font-mono p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-400">
                    {isEn ? 'Full Name' : 'Nama Lengkap'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isEn ? 'e.g. Andi Pratama' : 'Contoh: Andi Pratama'}
                    value={empForm.name}
                    onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-400">
                    {isEn ? 'Department / Division' : 'Departemen / Divisi'}
                  </label>
                  <select
                    value={empForm.department}
                    onChange={(e) => setEmpForm({ ...empForm, department: e.target.value as HrDepartment })}
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {formatDept(dept)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-400">
                    {isEn ? 'Role / Position' : 'Role / Jabatan'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isEn ? 'e.g. Senior Cashier & POS Operator' : 'Contoh: Senior Cashier & POS Operator'}
                    value={empForm.role}
                    onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-400">
                    {isEn ? 'Contract Status' : 'Status Kontrak'}
                  </label>
                  <select
                    value={empForm.contractStatus}
                    onChange={(e) => setEmpForm({ ...empForm, contractStatus: e.target.value as ContractStatus })}
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  >
                    {CONTRACT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {formatContract(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-400">
                    {isEn ? 'Phone / WhatsApp' : 'No Telepon / WA'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0812-xxxx-xxxx"
                    value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-400">
                    {isEn ? 'Company Email' : 'Email Perusahaan'}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@jacs-erp.com"
                    value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-400">
                    {isEn ? 'Work Shift' : 'Shift Kerja'}
                  </label>
                  <select
                    value={empForm.shift}
                    onChange={(e) => setEmpForm({ ...empForm, shift: e.target.value })}
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  >
                    <option value="Pagi (07:00 - 15:30)">
                      {isEn ? 'Morning (07:00 - 15:30)' : 'Pagi (07:00 - 15:30)'}
                    </option>
                    <option value="Siang (15:00 - 23:00)">
                      {isEn ? 'Afternoon (15:00 - 23:00)' : 'Siang (15:00 - 23:00)'}
                    </option>
                    <option value="General (08:30 - 17:30)">
                      {isEn ? 'General (08:30 - 17:30)' : 'General (08:30 - 17:30)'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-400">
                    {isEn ? 'Annual Leave Quota (Days)' : 'Plafon Cuti Tahunan (Hari)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={empForm.leaveTotal}
                    onChange={(e) => setEmpForm({ ...empForm, leaveTotal: Number(e.target.value) })}
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-400">
                    {isEn ? 'Avatar URL / Photo' : 'URL Avatar / Foto'}
                  </label>
                  <input
                    type="url"
                    value={empForm.avatar}
                    onChange={(e) => setEmpForm({ ...empForm, avatar: e.target.value })}
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-700/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition ${
                    isLight
                      ? 'bg-sky-600 hover:bg-sky-700 text-white border border-sky-600 shadow-sm'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isEn ? 'Save Employee' : 'Simpan Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: QUICK CLOCK-IN */}
      {/* ========================================================================= */}
      {isClockInModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-700/40">
              <div className="flex items-center gap-2.5">
                <LogIn className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-base tracking-[-0.01em]">
                  {isEn ? 'Record Shift Clock-In' : 'Input Clock In Shift'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClockInModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClockIn} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-400">
                  {isEn ? 'Select Employee' : 'Pilih Karyawan'}
                </label>
                <select
                  required
                  value={clockInEmpId}
                  onChange={(e) => setClockInEmpId(e.target.value)}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                  }`}
                >
                  <option value="">{isEn ? '-- Select Employee --' : '-- Pilih Nama Karyawan --'}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.nip}) - {formatDept(emp.department)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-400">
                  {isEn ? 'Location / Terminal' : 'Lokasi / Terminal'}
                </label>
                <input
                  type="text"
                  required
                  value={clockInLocation}
                  onChange={(e) => setClockInLocation(e.target.value)}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-400">
                  {isEn ? 'Operational Activity Notes' : 'Catatan Aktivitas Operasional'}
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    isEn
                      ? 'e.g. Opened POS register session 1, initial cash verified.'
                      : 'Contoh: Buka sesi register POS 1, modal awal terhitung.'
                  }
                  value={clockInNotes}
                  onChange={(e) => setClockInNotes(e.target.value)}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-700/40">
                <button
                  type="button"
                  onClick={() => setIsClockInModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition ${
                    isLight
                      ? 'bg-sky-600 hover:bg-sky-700 text-white border border-sky-600 shadow-sm'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  {isEn ? 'Record Attendance' : 'Simpan Presensi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: FORMULIR PENGAJUAN CUTI / IZIN BARU */}
      {/* ========================================================================= */}
      {isNewLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-2xl p-6 border shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-700/40">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-base tracking-[-0.01em]">
                  {isEn ? 'Leave / Permission Request Form' : 'Formulir Pengajuan Cuti / Izin'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewLeaveModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeaveRequest} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-400">
                  {isEn ? 'Select Requesting Employee' : 'Pilih Karyawan Pemohon'}
                </label>
                <select
                  required
                  value={leaveForm.employeeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                  }`}
                >
                  <option value="">{isEn ? '-- Select Employee --' : '-- Pilih Nama Karyawan --'}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.nip}) - {isEn ? 'Remaining Leave' : 'Sisa Cuti'}: {emp.leaveQuota.remaining}{' '}
                      {isEn ? 'days' : 'hari'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-400">
                  {isEn ? 'Request Type' : 'Jenis Permohonan'}
                </label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value as LeaveType })}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                  }`}
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {formatLeaveType(t)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-400">
                    {isEn ? 'Start Date' : 'Tgl Mulai'}
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className={`w-full text-xs p-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-400">
                    {isEn ? 'End Date' : 'Tgl Selesai'}
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className={`w-full text-xs p-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-400">
                    {isEn ? 'Duration (Days)' : 'Durasi (Hari)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={leaveForm.durationDays}
                    onChange={(e) => setLeaveForm({ ...leaveForm, durationDays: Number(e.target.value) })}
                    className={`w-full text-xs p-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-400">
                  {isEn ? 'Request Reason' : 'Alasan Permohonan'}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    isEn
                      ? 'Explain the reason or purpose of the leave/absence request...'
                      : 'Jelaskan alasan atau keperluan pengajuan izin/cuti...'
                  }
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-700/40">
                <button
                  type="button"
                  onClick={() => setIsNewLeaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition ${
                    isLight
                      ? 'bg-sky-600 hover:bg-sky-700 text-white border border-sky-600 shadow-sm'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  {isEn ? 'Submit Request' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: APPROVAL / REJECTION CONFIRMATION */}
      {/* ========================================================================= */}
      {isApprovalModalOpen && approvalTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-700/40">
              <div className="flex items-center gap-2.5">
                {approvalTarget.action === 'approve' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                <h3 className="font-semibold text-base tracking-[-0.01em]">
                  {approvalTarget.action === 'approve'
                    ? isEn
                      ? 'Approve Leave Request'
                      : 'Persetujuan Tiket Cuti / Izin'
                    : isEn
                    ? 'Reject Leave Request'
                    : 'Penolakan Tiket Cuti / Izin'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsApprovalModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div
                className={`p-3 rounded-xl border space-y-1 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{isEn ? 'Ticket Number:' : 'Nomor Tiket:'}</span>
                  <span className="font-mono font-semibold text-cyan-400">
                    {approvalTarget.request.ticketNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{isEn ? 'Applicant:' : 'Pemohon:'}</span>
                  <span className="font-semibold">{approvalTarget.request.employeeName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{isEn ? 'Type:' : 'Jenis:'}</span>
                  <span className="text-gray-200">{formatLeaveType(approvalTarget.request.type)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{isEn ? 'Duration:' : 'Durasi:'}</span>
                  <span className="text-gray-200">
                    {approvalTarget.request.durationDays} {isEn ? 'Days' : 'Hari'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-400">
                  {isEn ? 'Manager / HR Notes:' : 'Catatan Pimpinan / HR:'}
                </label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-700/40">
              <button
                type="button"
                onClick={() => setIsApprovalModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={handleExecuteApproval}
                className={`px-5 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 shadow-lg transition cursor-pointer ${
                  approvalTarget.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                }`}
              >
                {approvalTarget.action === 'approve'
                  ? isEn
                    ? 'Confirm Approval'
                    : 'Konfirmasi Setujui'
                  : isEn
                  ? 'Confirm Rejection'
                  : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrModule;
