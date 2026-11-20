import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAudit } from '../../audit';
import {
  Employee,
  HrDepartment,
  ContractStatus,
  LeaveType,
} from '../../types';
import {
  Users,
  Clock,
  Calendar,
  Search,
  Filter,
  Edit2,
  Trash2,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  LogIn,
  Building2,
  X,
  Send,
  UserX,
  ShieldCheck,
  Shirt,
  Sparkles,
  Wrench,
  Tag,
} from 'lucide-react';
import { PayrollTab } from './PayrollTab';
import { LeaveApprovalTab } from './LeaveApprovalTab';
import {
  calculateLaundryStaffIncentives,
  extractLaundryOrderMetrics,
} from '../../utils/laundryCommission';
import { calculateFashionAdvisorCommissions } from '../../utils/fashionAnalytics';
import { getEffectiveBusinessDomainConfig } from '../../utils/businessDomainConfig';

type HrTab = 'directory' | 'attendance' | 'leave' | 'laundry_performance' | 'fashion_performance' | 'payroll';

// Daftar Departemen Murni Operasional
const DEPARTMENTS: HrDepartment[] = [
  'POS & Kasir',
  'Produksi & Operator Laundry',
  'Warehouse & Logistik',
  'Purchasing',
  'Finance & Accounting',
  'Human Resources & Personalia',
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
  'Produksi & Operator Laundry': { id: 'Produksi & Operator Laundry', en: 'Laundry Production & Operators' },
  'Warehouse & Logistik': { id: 'Warehouse & Logistik', en: 'Warehouse & Logistics' },
  'Purchasing': { id: 'Purchasing', en: 'Purchasing & Procurement' },
  'Finance & Accounting': { id: 'Finance & Accounting', en: 'Finance & Accounting' },
  'Human Resources & Personalia': { id: 'SDM & Personalia', en: 'Human Resources' },
  'IT & Security': { id: 'IT & Keamanan', en: 'IT & Security' },
  'IT & Super Admin': { id: 'IT & Administrator', en: 'IT & Super Admin' },
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
    isPayrollSynced,
    showToast,
    activeUser,
    currentUser,
    laundryOrders,
    salesHistory,
    businessDomainConfig,
    businessProfile,
  } = useApp();

  const effectiveDomainConfig = useMemo(
    () => businessDomainConfig || getEffectiveBusinessDomainConfig(businessProfile),
    [businessDomainConfig, businessProfile]
  );
  const isLaundryActive = effectiveDomainConfig.primaryBusinessModel === 'LAUNDRY';
  const isFashionActive = effectiveDomainConfig.primaryBusinessModel === 'FASHION_BUTIK';

  const laundryPerformance = useMemo(
    () => calculateLaundryStaffIncentives(employees, laundryOrders || []),
    [employees, laundryOrders]
  );

  const fashionAdvisorPerformance = useMemo(
    () => calculateFashionAdvisorCommissions(employees, salesHistory || []),
    [employees, salesHistory]
  );

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<HrTab>('directory');

  React.useEffect(() => {
    if (activeTab === 'laundry_performance' && !isLaundryActive) {
      setActiveTab('directory');
    } else if (activeTab === 'fashion_performance' && !isFashionActive) {
      setActiveTab('directory');
    }
  }, [activeTab, isLaundryActive, isFashionActive]);

  const { recordAudit } = useAudit();
  const effectiveUser = currentUser || activeUser;

  const isLight = theme === 'light';
  const isEn = language === 'en';

  const handleToggleEmployeeStatus = (emp: Employee) => {
    const nextStatus = emp.status === 'Active' || !emp.status ? 'Inactive' : 'Active';
    updateEmployee(emp.id, { status: nextStatus });

    recordAudit({
      traceId: `HR-STATUS-${emp.id}-${Date.now()}`,
      userId: effectiveUser?.id || 'hr-officer',
      userName: effectiveUser?.name || 'HR Officer',
      userRole: effectiveUser?.role || 'Human Resources',
      module: 'HR',
      action: 'CONFIG_CHANGE',
      severity: 'WARN',
      entityId: emp.id,
      payloadBefore: { name: emp.name, status: emp.status || 'Active' },
      payloadAfter: { name: emp.name, status: nextStatus },
    });

    if (showToast) {
      showToast(
        isEn
          ? `Status for ${emp.name} updated to [${nextStatus}]`
          : `Status penugasan ${emp.name} diperbarui menjadi [${nextStatus === 'Active' ? 'Aktif' : 'Non-Aktif'}]`
      );
    }
  };

  const formatDept = (dept: string) =>
    DEPT_TRANSLATION[dept] ? (isEn ? DEPT_TRANSLATION[dept].en : DEPT_TRANSLATION[dept].id) : dept;
  const formatContract = (st: string) =>
    CONTRACT_TRANSLATION[st] ? (isEn ? CONTRACT_TRANSLATION[st].en : CONTRACT_TRANSLATION[st].id) : st;
  const formatLeaveType = (lt: string) =>
    LEAVE_TYPE_TRANSLATION[lt] ? (isEn ? LEAVE_TYPE_TRANSLATION[lt].en : LEAVE_TYPE_TRANSLATION[lt].id) : lt;
  const formatAttStatus = (st: string) =>
    ATTENDANCE_STATUS_TRANSLATION[st] ? (isEn ? ATTENDANCE_STATUS_TRANSLATION[st].en : ATTENDANCE_STATUS_TRANSLATION[st].id) : st;

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
  const [isNewLeaveModalOpen, setIsNewLeaveModalOpen] = useState(false);

  // New Leave Form State
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    type: 'Cuti Tahunan' as LeaveType,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    durationDays: 1,
    reason: '',
  });

  // Metrics Summary
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

      recordAudit({
        traceId: `HR-EDIT-${editingEmployee.id}`,
        userId: effectiveUser?.id || 'hr-officer',
        userName: effectiveUser?.name || 'HR Officer',
        userRole: effectiveUser?.role || 'Human Resources',
        module: 'HR',
        action: 'CONFIG_CHANGE',
        severity: 'INFO',
        entityId: editingEmployee.nip,
        payloadBefore: editingEmployee,
        payloadAfter: empForm,
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

      recordAudit({
        traceId: `HR-ADD-${empForm.nip}`,
        userId: effectiveUser?.id || 'hr-officer',
        userName: effectiveUser?.name || 'HR Officer',
        userRole: effectiveUser?.role || 'Human Resources',
        module: 'HR',
        action: 'CONFIG_CHANGE',
        severity: 'INFO',
        entityId: empForm.nip,
        payloadAfter: empForm,
      });
    }
    setIsEmployeeModalOpen(false);
  };

  const handleSaveClockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clockInEmpId) return;
    const emp = employees.find((x) => x.id === clockInEmpId);
    recordClockIn(clockInEmpId, clockInNotes, clockInLocation);

    recordAudit({
      traceId: `CLOCK-IN-${clockInEmpId}-${Date.now()}`,
      userId: emp?.id || clockInEmpId,
      userName: emp?.name || 'Staff',
      userRole: emp?.role || 'Staff',
      module: 'HR',
      action: 'AUTH_LOGIN',
      severity: 'INFO',
      entityId: emp?.nip,
      payloadAfter: {
        location: clockInLocation,
        notes: clockInNotes,
      },
    });

    setIsClockInModalOpen(false);
    setClockInEmpId('');
    setClockInNotes('');
  };

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

    recordAudit({
      traceId: `LEAVE-REQ-${emp.id}-${Date.now()}`,
      userId: emp.id,
      userName: emp.name,
      userRole: emp.role,
      module: 'HR',
      action: 'CONFIG_CHANGE',
      severity: 'INFO',
      entityId: emp.nip,
      payloadAfter: leaveForm,
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

  const hasPendingLeaves = pendingLeavesCount > 0;

  return (
    <div id="hr-module-container" className="w-full min-w-0 overflow-x-hidden space-y-5 max-w-7xl mx-auto pb-8 font-sans">
      {/* 1. TOP HEADER & KPI OVERVIEW */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] text-slate-900'
            : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] text-white'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest uppercase border ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-500/60'
                    : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/35'
                }`}
              >
                {isEn ? 'HUMAN RESOURCE & WORKFORCE MANAGEMENT' : 'SDM & MANAJEMEN KARYAWAN'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest uppercase border ${
                  isLight
                    ? 'bg-slate-50 text-slate-700 border-slate-300'
                    : 'bg-[#0d1117] text-slate-300 border-slate-700'
                }`}
              >
                JacS ERP HR
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest uppercase border ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-500/60 text-emerald-700'
                    : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>ONLINE — SYNCED</span>
              </span>
            </div>
            <h2 className={`text-xl font-medium tracking-tight flex items-center gap-2.5 ${isLight ? 'text-slate-950' : 'text-white'}`}>
              <Users className={`w-5 h-5 shrink-0 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
              <span>{isEn ? 'Human Resources & Workforce Management' : 'HR & Manajemen Karyawan'}</span>
            </h2>
            <p className={`text-sm font-normal max-w-2xl ${isLight ? 'text-slate-600' : 'text-[#8b949e]'}`}>
              {isEn
                ? 'Comprehensive personnel directory across operational divisions, shift attendance logs, leave verification, and integrated payroll.'
                : 'Direktori personil operasional, pencatatan log presensi shift harian, verifikasi izin & cuti, serta pengelolaan slip gaji terpadu.'}
            </p>
          </div>

          {/* 3 Header KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-3 rounded-2xl border text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] ${
                isLight
                  ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
                  : 'bg-[#0d1117] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
              }`}
            >
              <span className={`text-[11px] font-mono font-normal tracking-widest uppercase block ${
                isLight ? 'text-slate-600' : 'text-gray-400'
              }`}>
                {isEn ? 'Total Personnel' : 'Total Personil'}
              </span>
              <span className={`text-lg font-mono font-medium mt-1 block ${isLight ? 'text-slate-950' : 'text-cyan-400'}`}>
                {employees.length} {isEn ? 'Staff' : 'Orang'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-3 rounded-2xl border text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] ${
                isLight
                  ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
                  : 'bg-[#0d1117] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
              }`}
            >
              <span className={`text-[11px] font-mono font-normal tracking-widest uppercase block ${
                isLight ? 'text-slate-600' : 'text-gray-400'
              }`}>
                {isEn ? "Today's Attendance" : 'Presensi Hari Ini'}
              </span>
              <span className={`text-lg font-mono font-medium mt-1 block ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                {presentTodayCount} {isEn ? 'Present' : 'Hadir'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('leave')}
              className={`px-4 py-3 rounded-2xl border text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                hasPendingLeaves
                  ? 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.22)] hover:shadow-[0_0_24px_rgba(245,158,11,0.34)]'
                  : isLight
                  ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)]'
                  : 'bg-[#0d1117] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)]'
              }`}
            >
              <span className={`flex items-center gap-1.5 text-[11px] font-mono font-normal tracking-widest uppercase ${
                hasPendingLeaves ? 'text-amber-600 dark:text-amber-400' : isLight ? 'text-slate-600' : 'text-gray-400'
              }`}>
                {hasPendingLeaves && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />}
                <span>{isEn ? 'Leave Queue' : 'Antrean Cuti'}</span>
              </span>
              <span className={`text-lg font-mono font-medium mt-1 block ${
                hasPendingLeaves
                  ? 'text-amber-600 dark:text-amber-400'
                  : isLight
                  ? 'text-slate-900'
                  : 'text-white'
              }`}>
                {pendingLeavesCount} Cuti
              </span>
            </button>
          </div>
        </div>

        {/* 2. NAVIGATION SUB-TABS */}
        <div className={`mt-5 pt-4 border-t flex flex-wrap items-center gap-2.5 pb-1 ${
          isLight ? 'border-slate-200' : 'border-gray-700/40'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border flex items-center gap-2 cursor-pointer shrink-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] ${
              activeTab === 'directory'
                ? isLight
                  ? 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-[0_0_16px_rgba(6,182,212,0.22)]'
                  : 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.2)]'
                : isLight
                ? 'bg-white border-cyan-500/50 text-slate-700 hover:border-cyan-500'
                : 'bg-[#0d1117] border-cyan-500/25 text-slate-300 hover:border-cyan-500/60'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>{isEn ? 'Employee Directory' : 'Direktori Karyawan'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-normal border ${
              isLight
                ? 'bg-white border-cyan-500/50 text-cyan-700'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
            }`}>
              {employees.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border flex items-center gap-2 cursor-pointer shrink-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] ${
              activeTab === 'attendance'
                ? isLight
                  ? 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-[0_0_16px_rgba(6,182,212,0.22)]'
                  : 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.2)]'
                : isLight
                ? 'bg-white border-cyan-500/50 text-slate-700 hover:border-cyan-500'
                : 'bg-[#0d1117] border-cyan-500/25 text-slate-300 hover:border-cyan-500/60'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{isEn ? 'Attendance & Shifts' : 'Aktivitas & Kehadiran'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-normal border ${
              isLight
                ? 'bg-white border-cyan-500/50 text-cyan-700'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
            }`}>
              {todayAttendance.length} {isEn ? 'Today' : 'Hari Ini'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leave')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border flex items-center gap-2 cursor-pointer shrink-0 transition-all duration-200 hover:-translate-y-0.5 ${
              hasPendingLeaves
                ? activeTab === 'leave'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.28)] hover:shadow-[0_0_24px_rgba(245,158,11,0.36)]'
                  : 'border-amber-500/80 bg-amber-500/5 text-amber-600 dark:text-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.2)] hover:shadow-[0_0_24px_rgba(245,158,11,0.32)]'
                : activeTab === 'leave'
                ? isLight
                  ? 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-[0_0_16px_rgba(6,182,212,0.22)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)]'
                  : 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.2)] hover:shadow-[0_0_24px_rgba(6,182,212,0.28)]'
                : isLight
                ? 'bg-white border-cyan-500/50 text-slate-700 hover:shadow-[0_0_24px_rgba(6,182,212,0.28)]'
                : 'bg-[#0d1117] border-cyan-500/25 text-slate-300 hover:shadow-[0_0_24px_rgba(6,182,212,0.28)]'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{isEn ? 'Leave & Requests' : 'Cuti & Perizinan'}</span>
            {hasPendingLeaves && (
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-normal border ${
                isLight
                  ? 'bg-amber-50 text-amber-700 border-amber-500/60'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span>{pendingLeavesCount} Cuti</span>
              </span>
            )}
          </button>

          {isLaundryActive && (
            <button
              type="button"
              onClick={() => setActiveTab('laundry_performance')}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border flex items-center gap-2 cursor-pointer shrink-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] ${
                activeTab === 'laundry_performance'
                  ? isLight
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-[0_0_16px_rgba(6,182,212,0.22)]'
                    : 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.2)]'
                  : isLight
                  ? 'bg-white border-cyan-500/50 text-slate-700 hover:border-cyan-500'
                  : 'bg-[#0d1117] border-cyan-500/25 text-slate-300 hover:border-cyan-500/60'
              }`}
            >
              <Shirt className="w-4 h-4 shrink-0 text-cyan-500" />
              <span>{isEn ? 'Laundry Staff Commission' : 'Kinerja & Komisi Laundry'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-normal border ${
                isLight
                  ? 'bg-white border-cyan-500/50 text-cyan-700'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              }`}>
                {laundryPerformance.totalKgProcessed} kg
              </span>
            </button>
          )}

          {isFashionActive && (
            <button
              type="button"
              onClick={() => setActiveTab('fashion_performance')}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border flex items-center gap-2 cursor-pointer shrink-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(217,70,239,0.28)] ${
                activeTab === 'fashion_performance'
                  ? isLight
                    ? 'bg-fuchsia-50 border-fuchsia-500 text-fuchsia-800 shadow-[0_0_16px_rgba(217,70,239,0.22)]'
                    : 'bg-fuchsia-500/15 border-fuchsia-400 text-fuchsia-300 shadow-[0_0_16px_rgba(217,70,239,0.2)]'
                  : isLight
                  ? 'bg-white border-fuchsia-500/40 text-slate-700 hover:border-fuchsia-500'
                  : 'bg-[#0d1117] border-fuchsia-500/25 text-slate-300 hover:border-fuchsia-500/60'
              }`}
            >
              <Tag className="w-4 h-4 shrink-0 text-fuchsia-500" />
              <span>{isEn ? 'Fashion Advisor Comm.' : 'Komisi Fashion Advisor'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-normal border ${
                isLight
                  ? 'bg-white border-fuchsia-500/50 text-fuchsia-700'
                  : 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300'
              }`}>
                Rp {Math.round(fashionAdvisorPerformance.totalCommission / 1000)}rb
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border flex items-center gap-2 cursor-pointer shrink-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(16,185,129,0.28)] ${
              activeTab === 'payroll'
                ? isLight
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-[0_0_18px_rgba(16,185,129,0.24)]'
                  : 'bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.22)]'
                : isLight
                ? 'bg-white border-emerald-500/60 text-slate-700 shadow-[0_0_14px_rgba(16,185,129,0.12)]'
                : 'bg-[#0d1117] border-emerald-500/35 text-slate-300 shadow-[0_0_14px_rgba(16,185,129,0.08)]'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
            <span>{isEn ? 'Payroll & Compensation' : 'Payroll & Penggajian Otomatis'}</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-normal border ${
                isLight
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-500/60'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{isPayrollSynced ? (isEn ? 'Synced' : 'Sinkron') : (isEn ? 'Active' : 'Aktif')}</span>
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: IDENTITAS KARYAWAN */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 transition-all duration-200 ${
              isLight
                ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] text-slate-900'
                : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] text-white'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <div className="relative min-w-[240px] flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500" />
                <input
                  type="text"
                  placeholder={isEn ? 'Search name, NIP, role, contact...' : 'Cari nama, NIP, jabatan, no kontak...'}
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-sm font-normal rounded-xl border outline-none transition-all duration-200 ${
                    isLight
                      ? 'bg-white border-cyan-500/60 text-slate-900 focus:border-cyan-500'
                      : 'bg-[#0d1117] border-cyan-500/35 text-white focus:border-cyan-400'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-cyan-500 shrink-0" />
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  aria-label="Filter Departemen"
                  className={`px-3 py-2 rounded-xl text-sm font-normal border outline-none transition-all duration-200 ${
                    isLight
                      ? 'bg-white border-cyan-500/60 text-slate-900 focus:border-cyan-500'
                      : 'bg-[#0d1117] border-cyan-500/35 text-white focus:border-cyan-400'
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

              <select
                value={selectedContractFilter}
                onChange={(e) => setSelectedContractFilter(e.target.value)}
                aria-label="Filter Status Kontrak"
                className={`px-3 py-2 rounded-xl text-sm font-normal border outline-none transition-all duration-200 ${
                  isLight
                    ? 'bg-white border-cyan-500/60 text-slate-900 focus:border-cyan-500'
                    : 'bg-[#0d1117] border-cyan-500/35 text-white focus:border-cyan-400'
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

            <button
              type="button"
              onClick={handleOpenAddEmployee}
              className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer transition-all duration-200 active:scale-[0.99] shrink-0 ${
                isLight
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white border border-cyan-500 shadow-[0_0_14px_rgba(6,182,212,0.28)]'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.28)]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{isEn ? 'Add Employee' : 'Tambah Karyawan'}</span>
            </button>
          </div>

          <div
            className={`w-full min-w-0 rounded-2xl border overflow-hidden transition-all duration-200 ${
              isLight
                ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
                : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
            }`}
          >
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm font-normal border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-mono font-normal uppercase tracking-widest ${
                      isLight
                        ? 'bg-slate-50 border-cyan-500/30 text-slate-600'
                        : 'bg-[#0d1117] border-gray-800 text-gray-400'
                    }`}
                  >
                    <th className="py-3 px-4 font-normal">{isEn ? 'Employee & NIP' : 'NIP & Karyawan'}</th>
                    <th className="py-3 px-4 font-normal">{isEn ? 'Department / Division' : 'Departemen / Divisi'}</th>
                    <th className="py-3 px-4 font-normal">{isEn ? 'Role / Position' : 'Role / Jabatan'}</th>
                    <th className="py-3 px-4 font-normal">{isEn ? 'Contract Status' : 'Status Kontrak'}</th>
                    <th className="py-3 px-4 font-normal">{isEn ? 'Shift & Leave Quota' : 'Shift & Kuota Cuti'}</th>
                    <th className="py-3 px-4 font-normal">{isEn ? 'Contact (Phone / Email)' : 'Kontak (Telp / Email)'}</th>
                    <th className="py-3 px-4 font-normal text-center">{isEn ? 'Actions' : 'Aksi'}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-sans ${isLight ? 'divide-slate-200' : 'divide-gray-800/40'}`}>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <UserX className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                        <p className="font-medium text-base">
                          {isEn ? 'No employee data matching the filters.' : 'Tidak ada data karyawan yang cocok.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr
                        key={emp.id}
                        className={`transition-colors duration-150 ${
                          isLight
                            ? 'hover:bg-cyan-50/40 text-slate-800'
                            : 'hover:bg-white/[0.02] text-gray-200'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {emp.avatarUrl || emp.avatar ? (
                              <img
                                src={emp.avatarUrl || emp.avatar || ''}
                                alt={emp.name}
                                className={`w-10 h-10 rounded-full object-cover border shrink-0 ${
                                  isLight ? 'border-cyan-500/40' : 'border-cyan-500/35'
                                }`}
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${
                                isLight ? 'bg-cyan-50 border-cyan-500/40 text-cyan-700' : 'bg-slate-800 border-cyan-500/30 text-cyan-400'
                              }`}>
                                <Users className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <span className="font-normal text-sm block text-slate-900 dark:text-white">
                                {emp.name}
                              </span>
                              <span className={`text-[11px] font-mono font-normal tracking-widest ${
                                isLight ? 'text-cyan-700' : 'text-cyan-400'
                              }`}>
                                {emp.nip}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-normal border ${
                              emp.department === 'POS & Kasir'
                                ? isLight ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : emp.department === 'Warehouse & Logistik'
                                ? isLight ? 'bg-purple-50 text-purple-700 border-purple-300' : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                                : emp.department === 'Finance & Accounting'
                                ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : emp.department === 'Purchasing'
                                ? isLight ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                : isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-300' : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                            }`}
                          >
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{formatDept(emp.department)}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-normal text-sm block text-slate-900 dark:text-gray-200">{emp.role}</span>
                          <span className="text-[11px] font-mono font-normal text-slate-500 dark:text-gray-400">
                            {isEn ? 'Joined:' : 'Bergabung:'} {emp.joinDate}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest border ${
                              emp.contractStatus === 'Tetap'
                                ? isLight
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : emp.contractStatus === 'Kontrak (PKWT)'
                                ? isLight
                                  ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                : emp.contractStatus === 'Probation'
                                ? isLight
                                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : isLight
                                ? 'bg-purple-50 text-purple-700 border-purple-300'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            }`}
                          >
                            {formatContract(emp.contractStatus)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-sm font-normal text-slate-600 dark:text-gray-400 block">{emp.shift}</span>
                          <span className="text-[11px] font-mono font-normal text-cyan-700 dark:text-cyan-300">
                            {isEn ? 'Remaining:' : 'Sisa Cuti:'} {emp.leaveQuota.remaining} / {emp.leaveQuota.total} {isEn ? 'days' : 'hari'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <a
                              href={`tel:${emp.phone}`}
                              className="text-sm font-normal text-slate-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1.5 transition"
                            >
                              <Phone className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                              <span className="font-mono">{emp.phone}</span>
                            </a>
                            <span className="text-[11px] font-mono font-normal text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{emp.email}</span>
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 flex-wrap justify-center">
                            <button
                              type="button"
                              onClick={() => handleOpenEditEmployee(emp)}
                              className={`px-2.5 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-1 transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                                isLight
                                  ? 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border-cyan-500/50'
                                  : 'bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border-cyan-500/35'
                              }`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Detail / Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleEmployeeStatus(emp)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-normal tracking-widest uppercase border flex items-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                                emp.status === 'Active' || !emp.status
                                  ? isLight
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-500/70 shadow-[0_0_10px_rgba(16,185,129,0.16)] hover:bg-emerald-100'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/45 shadow-[0_0_10px_rgba(16,185,129,0.15)] hover:bg-emerald-500/25'
                                  : isLight
                                  ? 'bg-rose-50 text-rose-700 border-rose-400 hover:bg-rose-100'
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/35 hover:bg-rose-500/25'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  emp.status === 'Active' || !emp.status ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                }`}
                              />
                              <span>{emp.status === 'Active' || !emp.status ? 'Active' : 'Non-Aktif'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus data karyawan ${emp.name}?`)) {
                                  deleteEmployee(emp.id);
                                  recordAudit({
                                    traceId: `HR-DEL-${emp.id}`,
                                    userId: effectiveUser?.id || 'hr-officer',
                                    userName: effectiveUser?.name || 'HR Officer',
                                    userRole: effectiveUser?.role || 'Human Resources',
                                    module: 'HR',
                                    action: 'CONFIG_CHANGE',
                                    severity: 'CRITICAL',
                                    entityId: emp.nip,
                                    payloadBefore: emp,
                                  });
                                }
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer active:scale-[0.99]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div
              className={`p-3 border-t text-sm font-normal flex items-center justify-between ${
                isLight
                  ? 'bg-slate-50 border-cyan-500/30 text-slate-600'
                  : 'bg-[#0d1117] border-[#30363d] text-gray-400'
              }`}
            >
              <span>
                {isEn ? 'Showing' : 'Menampilkan'}{' '}
                <span className="font-mono font-medium text-cyan-600 dark:text-cyan-400">{filteredEmployees.length}</span>{' '}
                {isEn ? 'of' : 'dari'} <span className="font-mono">{employees.length}</span>{' '}
                {isEn ? 'registered personnel' : 'personil terdaftar'}
              </span>
              <span className="text-[11px] font-mono font-normal tracking-widest uppercase text-gray-500">
                JacS ERP HR Module
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AKTIVITAS & KEHADIRAN */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] ${
                isLight
                  ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
                  : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-normal tracking-widest uppercase text-slate-600 dark:text-gray-400">
                  Presensi Hari Ini
                </span>
                <Clock className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-lg font-mono font-medium tracking-tight text-cyan-700 dark:text-cyan-400">
                {presentTodayCount} / {employees.length}
              </div>
              <p className="text-sm font-normal text-slate-500 dark:text-gray-400 mt-1">
                {Math.round((presentTodayCount / Math.max(employees.length, 1)) * 100)}% kehadiran aktif
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] ${
                isLight
                  ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
                  : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-normal tracking-widest uppercase text-slate-600 dark:text-gray-400">
                  Tepat Waktu
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-lg font-mono font-medium tracking-tight text-emerald-600 dark:text-emerald-400">
                {onTimeCount} Orang
              </div>
              <p className="text-sm font-normal text-emerald-600 dark:text-emerald-400/80 mt-1">Sesuai jadwal shift</p>
            </div>

            <div
              className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(6,182,212,0.28)] ${
                isLight
                  ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
                  : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-normal tracking-widest uppercase text-slate-600 dark:text-gray-400">
                  Terlambat
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-lg font-mono font-medium tracking-tight text-rose-600 dark:text-rose-400">
                {lateCount} Orang
              </div>
              <p className="text-sm font-normal text-rose-600 dark:text-rose-400/80 mt-1">Deviasi toleransi</p>
            </div>

            <div
              className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${
                isLight
                  ? 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.22)] hover:shadow-[0_0_24px_rgba(245,158,11,0.32)]'
                  : 'border-amber-500/70 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.18)] hover:shadow-[0_0_24px_rgba(245,158,11,0.28)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-normal tracking-widest uppercase text-amber-600 dark:text-amber-400">
                  Izin &amp; Sakit Aktif
                </span>
                <Calendar className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-lg font-mono font-medium tracking-tight text-amber-600 dark:text-amber-400">
                {leaveRequests.filter((l) => l.status === 'Disetujui' && l.startDate <= todayStr && l.endDate >= todayStr).length} Orang
              </div>
              <p className="text-sm font-normal text-amber-600 dark:text-amber-400/80 mt-1">Status terverifikasi</p>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all duration-200 ${
              isLight
                ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] text-slate-900'
                : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] text-white'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative min-w-[220px] flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500" />
                <input
                  type="text"
                  placeholder="Cari log nama, NIP, terminal..."
                  value={searchAttendance}
                  onChange={(e) => setSearchAttendance(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-sm font-normal rounded-xl border outline-none transition-all duration-200 ${
                    isLight ? 'bg-white border-cyan-500/60 text-slate-900 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 text-white focus:border-cyan-400'
                  }`}
                />
              </div>

              <select
                value={attendanceDeptFilter}
                onChange={(e) => setAttendanceDeptFilter(e.target.value)}
                aria-label="Filter Departemen Presensi"
                className={`px-3 py-2 rounded-xl text-sm font-normal border outline-none transition-all duration-200 ${
                  isLight ? 'bg-white border-cyan-500/60 text-slate-900 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 text-white focus:border-cyan-400'
                }`}
              >
                <option value="ALL">Semua Departemen</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {formatDept(d)}
                  </option>
                ))}
              </select>

              <select
                value={attendanceStatusFilter}
                onChange={(e) => setAttendanceStatusFilter(e.target.value)}
                aria-label="Filter Status Presensi"
                className={`px-3 py-2 rounded-xl text-sm font-normal border outline-none transition-all duration-200 ${
                  isLight ? 'bg-white border-cyan-500/60 text-slate-900 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 text-white focus:border-cyan-400'
                }`}
              >
                <option value="ALL">Semua Status Kehadiran</option>
                <option value="Tepat Waktu">Tepat Waktu</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Izin">Izin</option>
                <option value="Cuti">Cuti</option>
                <option value="Sakit">Sakit</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsClockInModalOpen(true)}
              className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer transition-all duration-200 active:scale-[0.99] shrink-0 ${
                isLight
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white border border-cyan-500 shadow-[0_0_14px_rgba(6,182,212,0.28)]'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.28)]'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Input Clock-In Shift</span>
            </button>
          </div>

          <div
            className={`w-full min-w-0 rounded-2xl border overflow-hidden transition-all duration-200 ${
              isLight
                ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
                : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
            }`}
          >
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm font-normal border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-mono font-normal uppercase tracking-widest ${
                      isLight
                        ? 'bg-slate-50 border-cyan-500/30 text-slate-600'
                        : 'bg-[#0d1117] border-gray-800 text-gray-400'
                    }`}
                  >
                    <th className="py-3 px-4 font-normal">Karyawan &amp; NIP</th>
                    <th className="py-3 px-4 font-normal">Departemen</th>
                    <th className="py-3 px-4 font-normal">Tanggal &amp; Shift</th>
                    <th className="py-3 px-4 font-normal">Clock In / Out</th>
                    <th className="py-3 px-4 font-normal">Status Kehadiran</th>
                    <th className="py-3 px-4 font-normal">Lokasi / Terminal</th>
                    <th className="py-3 px-4 font-normal">Catatan Operasional</th>
                    <th className="py-3 px-4 font-normal text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-gray-800/40'}`}>
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                        <p className="font-medium text-base">Belum ada riwayat presensi yang sesuai filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((att, idx) => (
                      <tr
                        key={`${att.id}-${att.date || ''}-${idx}`}
                        className={`transition-colors duration-150 ${
                          isLight
                            ? 'hover:bg-cyan-50/40 text-slate-800'
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
                                  isLight ? 'border-cyan-500/40' : 'border-cyan-500/35'
                                }`}
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
                                isLight ? 'bg-cyan-50 border-cyan-500/40 text-cyan-700' : 'bg-slate-800 border-cyan-500/30 text-cyan-400'
                              }`}>
                                <Users className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <span className="font-normal text-sm block text-slate-900 dark:text-white">{att.employeeName}</span>
                              <span className={`text-[11px] font-mono font-normal ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>{att.nip}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-sm font-normal text-slate-700 dark:text-gray-300">{formatDept(att.department)}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono font-normal text-sm block text-slate-900 dark:text-gray-200">{att.date}</span>
                          <span className="text-[11px] font-mono font-normal text-slate-500 dark:text-gray-400">{att.shift}</span>
                        </td>

                        <td className="py-3 px-4 font-mono">
                          <div className="flex items-center gap-1.5 text-sm font-normal">
                            <span className="text-cyan-700 dark:text-cyan-400">{att.clockIn}</span>
                            <span className="text-gray-500">→</span>
                            {att.clockOut ? (
                              <span className="text-emerald-700 dark:text-emerald-400">{att.clockOut}</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-normal text-amber-600 dark:text-amber-400">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                <span>Aktif</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest border ${
                              att.status === 'Tepat Waktu'
                                ? isLight
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : att.status === 'Terlambat'
                                ? isLight
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : isLight
                                ? 'bg-amber-50 text-amber-700 border-amber-300'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {formatAttStatus(att.status)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-sm font-normal text-slate-600 dark:text-gray-400 block">{att.location}</span>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-sm font-normal text-slate-700 dark:text-gray-300 line-clamp-2" title={att.notes}>
                            {att.notes || '-'}
                          </p>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {!att.clockOut ? (
                            <button
                              type="button"
                              onClick={() => {
                                recordClockOut(att.id, 'Selesai shift kerja');
                                recordAudit({
                                  traceId: `CLOCK-OUT-${att.id}-${Date.now()}`,
                                  userId: att.employeeId || 'staff',
                                  userName: att.employeeName,
                                  userRole: 'Staff',
                                  module: 'HR',
                                  action: 'AUTH_LOGOUT',
                                  severity: 'INFO',
                                  entityId: att.nip,
                                  payloadAfter: { clockOutNotes: 'Selesai shift kerja' },
                                });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-normal border transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                                isLight
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                                  : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              Clock Out
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-500 font-mono font-normal">
                              Tuntas
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUTI, IZIN & SAKIT */}
      {activeTab === 'leave' && (
        <LeaveApprovalTab isLight={isLight} isEn={isEn} />
      )}

      {/* TAB 4: KINERJA & KOMISI STAF PRODUKSI LAUNDRY */}
      {activeTab === 'laundry_performance' && (
        <div className="space-y-5">
          {/* 4 KPI Kinerja Produksi Laundry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                isLight
                  ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
                  : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-600 dark:text-gray-400">
                  Total Beban Kiloan
                </span>
                <Shirt className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-lg font-mono font-semibold text-cyan-700 dark:text-cyan-400">
                {laundryPerformance.totalKgProcessed.toFixed(2)} kg
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Akumulasi produksi cuci &amp; setrika kiloan
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                isLight
                  ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
                  : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-600 dark:text-gray-400">
                  Satuan, Sepatu &amp; Karpet
                </span>
                <Wrench className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-lg font-mono font-semibold text-amber-600 dark:text-amber-400">
                {laundryPerformance.totalItemsProcessed} Item / Unit
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Jas, bedcover, pasang sepatu &amp; m² karpet
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                isLight
                  ? 'bg-white border-emerald-500/70 shadow-[0_0_16px_rgba(16,185,129,0.16)]'
                  : 'bg-[#161b22] border-emerald-500/35 shadow-[0_0_16px_rgba(16,185,129,0.08)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  Total Insentif Staf Laundry
                </span>
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-lg font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                Rp {laundryPerformance.totalIncentive.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Otomatis masuk ke komponen Payroll &amp; Slip Gaji
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                isLight
                  ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
                  : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-600 dark:text-gray-400">
                  Petugas Produksi Tercatat
                </span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-lg font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                {laundryPerformance.list.length} Staf
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('payroll')}
                className="text-xs text-cyan-600 dark:text-cyan-400 underline mt-1 cursor-pointer"
              >
                Lihat Gabungan di Slip Gaji Payroll →
              </button>
            </div>
          </div>

          {/* Tabel Rekap Kinerja & Komisi per Operator */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              isLight
                ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
                : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
            }`}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-cyan-500" />
                  <span>Laporan Kinerja &amp; Pembagian Komisi Operator Laundry</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dihitung otomatis dari penugasan Operator Cuci, Setrika, dan Teknisi Sepatu/Karpet di POS Tracking Cucian.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('payroll')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer transition"
              >
                Proses Pencairan di Payroll →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left border-collapse text-sm">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-mono uppercase tracking-widest ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-600'
                        : 'bg-[#0d1117] border-slate-800 text-slate-400'
                    }`}
                  >
                    <th className="py-3 px-4 font-normal">Operator &amp; NIP</th>
                    <th className="py-3 px-3 font-normal">Peran Produksi</th>
                    <th className="py-3 px-3 font-normal text-center">Order (Cuci / Setrika / Khusus)</th>
                    <th className="py-3 px-3 font-normal text-right">Kiloan (kg)</th>
                    <th className="py-3 px-3 font-normal text-right">Satuan / Sepatu / Karpet</th>
                    <th className="py-3 px-3 font-normal text-right">Tarif Komisi</th>
                    <th className="py-3 px-4 font-normal text-right text-emerald-600 dark:text-emerald-400">
                      Akumulasi Insentif
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                  {laundryPerformance.list.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500">
                        Belum ada operator produksi Laundry yang tercatat menangani order.
                      </td>
                    </tr>
                  ) : (
                    laundryPerformance.list.map((row) => (
                      <tr
                        key={row.employeeId}
                        className={isLight ? 'hover:bg-cyan-50/40' : 'hover:bg-white/[0.02]'}
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {row.employeeName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {row.nip}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            {row.role}
                          </div>
                          <div className="text-[11px] text-slate-500">{row.department}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-xs">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {row.ordersHandledCount} order
                          </span>
                          <div className="text-[10px] text-slate-500">
                            {row.washCount} cuci &bull; {row.ironCount} setrika &bull; {row.specialistCount} khusus
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-cyan-700 dark:text-cyan-300 font-semibold">
                          {row.kiloanKgProcessed.toFixed(2)} kg
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs">
                          <div>{row.satuanPcsProcessed} pcs satuan</div>
                          {(row.pasangProcessed > 0 || row.areaM2Processed > 0) && (
                            <div className="text-[11px] text-amber-600 dark:text-amber-400">
                              {row.pasangProcessed} psg &bull; {row.areaM2Processed} m²
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          <div>Rp {row.ratePerKg.toLocaleString('id-ID')}/kg</div>
                          <div>Rp {row.ratePerItem.toLocaleString('id-ID')}/pcs &bull; Rp {row.rateSpecialist.toLocaleString('id-ID')}/khusus</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          + Rp {row.totalIncentive.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Log Order & Petugas Terkait */}
          <div
            className={`p-4 rounded-2xl border ${
              isLight
                ? 'bg-white border-slate-200'
                : 'bg-[#161b22] border-slate-800'
            }`}
          >
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
              Jejak Penugasan Staf per Order Cucian ({(laundryOrders || []).length} Order)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(laundryOrders || []).slice(0, 9).map((ord) => {
                const m = extractLaundryOrderMetrics(ord);
                return (
                  <div
                    key={ord.id}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {ord.tagCode} &bull; {ord.orderNumber}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {ord.productionStatus}
                      </span>
                    </div>
                    <div className="font-medium text-slate-900 dark:text-white truncate">
                      {ord.customerName} ({ord.totalPieces} Pcs)
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {m.kiloanKg > 0 ? `${m.kiloanKg} kg ` : ''}
                      {m.satuanPcs > 0 ? `${m.satuanPcs} pcs ` : ''}
                      {m.pasangCount > 0 ? `${m.pasangCount} pasang ` : ''}
                      {m.areaM2 > 0 ? `${m.areaM2} m²` : ''}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25">
                        Cuci: {ord.washerEmployeeName || '-'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
                        Setrika: {ord.ironerEmployeeName || '-'}
                      </span>
                      {(m.hasSpecialistItems || ord.specialistEmployeeName) && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                          Teknisi: {ord.specialistEmployeeName || '-'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4B: KINERJA & KOMISI FASHION ADVISOR / PRAMUNIAGA BUTIK */}
      {activeTab === 'fashion_performance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                isLight
                  ? 'bg-white border-fuchsia-500/60 shadow-[0_0_16px_rgba(217,70,239,0.14)]'
                  : 'bg-[#161b22] border-fuchsia-500/35 shadow-[0_0_16px_rgba(217,70,239,0.08)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-600 dark:text-gray-400">
                  Penjualan Bersih Advisor
                </span>
                <Tag className="w-4 h-4 text-fuchsia-500" />
              </div>
              <div className="text-lg font-mono font-semibold text-fuchsia-700 dark:text-fuchsia-300">
                Rp {fashionAdvisorPerformance.totalNetSales.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Total omzet bersih setelah diskon promo/manual
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                isLight
                  ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
                  : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-600 dark:text-gray-400">
                  Nota Fashion Tercatat
                </span>
                <CheckCircle2 className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-lg font-mono font-semibold text-cyan-700 dark:text-cyan-400">
                {fashionAdvisorPerformance.totalTrxCount} Transaksi
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Tukar ukuran selisih Rp 0 tidak menggandakan komisi
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                isLight
                  ? 'bg-white border-emerald-500/70 shadow-[0_0_16px_rgba(16,185,129,0.16)]'
                  : 'bg-[#161b22] border-emerald-500/35 shadow-[0_0_16px_rgba(16,185,129,0.08)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  Akumulasi Komisi Pramuniaga
                </span>
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-lg font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                Rp {fashionAdvisorPerformance.totalCommission.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Otomatis masuk komponen Payroll &amp; Slip Gaji
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                isLight
                  ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
                  : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-600 dark:text-gray-400">
                  Pramuniaga / Advisor
                </span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-lg font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                {fashionAdvisorPerformance.list.length} Staf
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('payroll')}
                className="text-xs text-fuchsia-600 dark:text-fuchsia-400 underline mt-1 cursor-pointer"
              >
                Lihat Gabungan di Slip Gaji Payroll →
              </button>
            </div>
          </div>

          {/* Tabel Akumulasi Penjualan Bersih & Komisi per Fashion Advisor */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              isLight
                ? 'bg-white border-fuchsia-500/60 shadow-[0_0_16px_rgba(217,70,239,0.14)]'
                : 'bg-[#161b22] border-fuchsia-500/35 shadow-[0_0_16px_rgba(217,70,239,0.08)]'
            }`}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-fuchsia-500" />
                  <span>Rekap Penjualan Bersih &amp; Insentif Pramuniaga / Fashion Advisor</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dihitung real-time dari penjualan bersih POS Fashion &amp; Butik yang dilayani masing-masing Pramuniaga.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('payroll')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer transition"
              >
                Proses Pencairan di Payroll →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] text-left border-collapse text-sm">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-mono uppercase tracking-widest ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-600'
                        : 'bg-[#0d1117] border-slate-800 text-slate-400'
                    }`}
                  >
                    <th className="py-3 px-4 font-normal">Pramuniaga &amp; NIP</th>
                    <th className="py-3 px-3 font-normal">Jabatan</th>
                    <th className="py-3 px-3 font-normal text-center">Nota &amp; Pcs</th>
                    <th className="py-3 px-3 font-normal text-right">Penjualan Kotor</th>
                    <th className="py-3 px-3 font-normal text-right">Potongan Promo</th>
                    <th className="py-3 px-3 font-normal text-right text-fuchsia-700 dark:text-fuchsia-300">Penjualan Bersih</th>
                    <th className="py-3 px-3 font-normal text-center">Tarif</th>
                    <th className="py-3 px-4 font-normal text-right text-emerald-600 dark:text-emerald-400">
                      Komisi Advisor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                  {fashionAdvisorPerformance.list.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        Belum ada Pramuniaga / Fashion Advisor yang tercatat melayani transaksi POS Butik.
                      </td>
                    </tr>
                  ) : (
                    fashionAdvisorPerformance.list.map((row) => (
                      <tr
                        key={row.employeeId}
                        className={isLight ? 'hover:bg-fuchsia-50/40' : 'hover:bg-white/[0.02]'}
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {row.employeeName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">{row.nip}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            {row.role}
                          </div>
                          <div className="text-[11px] text-slate-500">{row.department}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-xs">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {row.trxCount} nota
                          </span>
                          <div className="text-[10px] text-slate-500">{row.itemsSoldQty} pcs terjual</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs text-slate-600 dark:text-slate-300">
                          Rp {row.grossSalesTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs text-rose-600 dark:text-rose-400">
                          -Rp {row.discountGivenTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-fuchsia-700 dark:text-fuchsia-300">
                          Rp {row.netSalesTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-xs text-slate-500 dark:text-slate-400">
                          {row.commissionRatePercent}%
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          + Rp {row.totalCommission.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Log Transaksi Fashion per Pramuniaga */}
          <div
            className={`p-4 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-slate-800'
            }`}
          >
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
              Jejak Penjualan Fashion Advisor Terbaru ({fashionAdvisorPerformance.recentAdvisorSales.length} Nota)
            </h4>
            {fashionAdvisorPerformance.recentAdvisorSales.length === 0 ? (
              <p className="text-xs text-slate-500">
                Belum ada transaksi POS Fashion dengan pilihan Fashion Advisor. Pilih nama Pramuniaga saat checkout di POS Butik untuk mencatat komisi secara otomatis.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {fashionAdvisorPerformance.recentAdvisorSales.map((s) => (
                  <div
                    key={s.transaction_id}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-fuchsia-600 dark:text-fuchsia-400">
                        {s.receipt_number || s.transaction_id}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        Net Rp {(Number(s.total_amount) || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="font-medium text-slate-900 dark:text-white truncate">
                      {s.customer_name || 'Pelanggan Butik'} &bull; {s.items_summary}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono">
                      <span className="text-fuchsia-700 dark:text-fuchsia-300">
                        Advisor: {s.fashionAdvisorName}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        +Rp {(Number(s.fashionAdvisorCommission) || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PENGGAJIAN & PAYROLL */}
      {activeTab === 'payroll' && (
        <PayrollTab isLight={isLight} isEn={isEn} />
      )}

      {/* MODAL 1: TAMBAH / EDIT KARYAWAN */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl p-6 border animate-in fade-in zoom-in-95 duration-150 ${
              isLight
                ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-900'
                : 'bg-[#161b22] border-cyan-500/40 shadow-[0_0_24px_rgba(6,182,212,0.16)] text-white'
            }`}
          >
            <div className={`flex items-center justify-between pb-4 border-b shrink-0 ${
              isLight ? 'border-cyan-500/30' : 'border-gray-700/40'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  isLight ? 'bg-cyan-50 text-cyan-700 border-cyan-500/50' : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/35'
                }`}>
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-medium text-base tracking-[-0.01em] ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    {editingEmployee ? 'Detail & Edit Data Karyawan' : 'Tambah Karyawan Baru'}
                  </h3>
                  <p className="text-[11px] font-mono font-normal tracking-widest uppercase text-slate-500 dark:text-gray-400">
                    Direktori Personil JacS ERP
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="text-gray-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="py-4 space-y-4 overflow-y-auto flex-1 pr-1 text-sm font-normal">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                    NIP Karyawan
                  </label>
                  <input
                    type="text"
                    required
                    value={empForm.nip}
                    onChange={(e) => setEmpForm({ ...empForm, nip: e.target.value })}
                    className={`w-full text-sm font-mono font-normal p-2.5 rounded-xl border outline-none transition-all duration-200 ${
                      isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Andi Pratama"
                    value={empForm.name}
                    onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                    className={`w-full text-sm font-normal p-2.5 rounded-xl border outline-none transition-all duration-200 ${
                      isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                    Departemen / Divisi
                  </label>
                  <select
                    value={empForm.department}
                    onChange={(e) => setEmpForm({ ...empForm, department: e.target.value as HrDepartment })}
                    className={`w-full text-sm font-normal p-2.5 rounded-xl border outline-none transition-all duration-200 ${
                      isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
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
                  <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                    Role / Jabatan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Senior Cashier & POS Operator"
                    value={empForm.role}
                    onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                    className={`w-full text-sm font-normal p-2.5 rounded-xl border outline-none transition-all duration-200 ${
                      isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                    Status Kontrak
                  </label>
                  <select
                    value={empForm.contractStatus}
                    onChange={(e) => setEmpForm({ ...empForm, contractStatus: e.target.value as ContractStatus })}
                    className={`w-full text-sm font-normal p-2.5 rounded-xl border outline-none transition-all duration-200 ${
                      isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
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
                  <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                    No Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0812-xxxx-xxxx"
                    value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    className={`w-full text-sm font-mono font-normal p-2.5 rounded-xl border outline-none transition-all duration-200 ${
                      isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                    Email Perusahaan
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@jacs-erp.com"
                    value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    className={`w-full text-sm font-normal p-2.5 rounded-xl border outline-none transition-all duration-200 ${
                      isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                    Shift Kerja
                  </label>
                  <select
                    value={empForm.shift}
                    onChange={(e) => setEmpForm({ ...empForm, shift: e.target.value })}
                    className={`w-full text-sm font-normal p-2.5 rounded-xl border outline-none transition-all duration-200 ${
                      isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
                    }`}
                  >
                    <option value="Pagi (07:00 - 15:30)">Pagi (07:00 - 15:30)</option>
                    <option value="Siang (15:00 - 23:00)">Siang (15:00 - 23:00)</option>
                    <option value="General (08:30 - 17:30)">General (08:30 - 17:30)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                    Plafon Cuti Tahunan (Hari)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={empForm.leaveTotal}
                    onChange={(e) => setEmpForm({ ...empForm, leaveTotal: Number(e.target.value) })}
                    className={`w-full text-sm font-mono font-normal p-2.5 rounded-xl border outline-none transition-all duration-200 ${
                      isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                    URL Foto Profil
                  </label>
                  <input
                    type="url"
                    value={empForm.avatar}
                    onChange={(e) => setEmpForm({ ...empForm, avatar: e.target.value })}
                    className={`w-full text-sm font-normal p-2.5 rounded-xl border outline-none transition-all duration-200 ${
                      isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
                    }`}
                  />
                </div>
              </div>

              <div className={`flex items-center justify-end gap-3 pt-3 border-t shrink-0 ${
                isLight ? 'border-slate-200' : 'border-gray-700/40'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'bg-[#0d1117] border-slate-700 text-gray-300 hover:text-white'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer transition-all duration-200 active:scale-[0.99] ${
                    isLight
                      ? 'bg-cyan-600 hover:bg-cyan-700 text-white border border-cyan-500 shadow-[0_0_14px_rgba(6,182,212,0.28)]'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.28)]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Karyawan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK CLOCK-IN */}
      {isClockInModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl p-6 border animate-in fade-in zoom-in-95 duration-150 ${
              isLight
                ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-900'
                : 'bg-[#161b22] border-cyan-500/40 shadow-[0_0_24px_rgba(6,182,212,0.16)] text-white'
            }`}
          >
            <div className={`flex items-center justify-between pb-4 border-b ${
              isLight ? 'border-cyan-500/30' : 'border-gray-700/40'
            }`}>
              <div className="flex items-center gap-2.5">
                <LogIn className="w-5 h-5 text-cyan-500" />
                <h3 className={`font-medium text-base tracking-[-0.01em] ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  Input Clock In Shift
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClockInModalOpen(false)}
                className="text-gray-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClockIn} className="py-4 space-y-4 text-sm font-normal">
              <div>
                <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                  Pilih Karyawan
                </label>
                <select
                  required
                  value={clockInEmpId}
                  onChange={(e) => setClockInEmpId(e.target.value)}
                  className={`w-full text-sm font-normal p-2.5 rounded-xl border outline-none transition-all duration-200 ${
                    isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
                  }`}
                >
                  <option value="">-- Pilih Nama Karyawan --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.nip}) - {formatDept(emp.department)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                  Lokasi / Terminal
                </label>
                <input
                  type="text"
                  required
                  value={clockInLocation}
                  onChange={(e) => setClockInLocation(e.target.value)}
                  className={`w-full text-sm font-normal p-2.5 rounded-xl border outline-none transition-all duration-200 ${
                    isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                  Catatan Aktivitas Operasional
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Buka sesi register POS 1, modal awal terhitung."
                  value={clockInNotes}
                  onChange={(e) => setClockInNotes(e.target.value)}
                  className={`w-full text-sm font-normal p-2.5 rounded-xl border outline-none transition-all duration-200 ${
                    isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
                  }`}
                />
              </div>

              <div className={`flex items-center justify-end gap-3 pt-3 border-t ${
                isLight ? 'border-slate-200' : 'border-gray-700/40'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsClockInModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'bg-[#0d1117] border-slate-700 text-gray-300 hover:text-white'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer transition-all duration-200 active:scale-[0.99] ${
                    isLight
                      ? 'bg-cyan-600 hover:bg-cyan-700 text-white border border-cyan-500 shadow-[0_0_14px_rgba(6,182,212,0.28)]'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.28)]'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Simpan Presensi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PENGAJUAN CUTI / IZIN BARU */}
      {isNewLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-2xl p-6 border animate-in fade-in zoom-in-95 duration-150 ${
              isLight
                ? 'bg-white border-amber-500/80 shadow-[0_0_24px_rgba(245,158,11,0.22)] text-slate-900'
                : 'bg-[#161b22] border-amber-500/50 shadow-[0_0_24px_rgba(245,158,11,0.18)] text-white'
            }`}
          >
            <div className={`flex items-center justify-between pb-4 border-b ${
              isLight ? 'border-amber-500/30' : 'border-gray-700/40'
            }`}>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-amber-500" />
                <h3 className={`font-medium text-base tracking-[-0.01em] ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  Formulir Pengajuan Cuti / Izin
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewLeaveModalOpen(false)}
                className="text-gray-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeaveRequest} className="py-4 space-y-4 text-sm font-normal">
              <div>
                <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                  Pilih Karyawan Pemohon
                </label>
                <select
                  required
                  value={leaveForm.employeeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                  className={`w-full text-sm font-normal p-2.5 rounded-xl border outline-none transition-all duration-200 ${
                    isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
                  }`}
                >
                  <option value="">-- Pilih Nama Karyawan --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.nip}) - Sisa Cuti: {emp.leaveQuota.remaining} hari
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                  Jenis Permohonan
                </label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value as LeaveType })}
                  className={`w-full text-sm font-normal p-2.5 rounded-xl border outline-none transition-all duration-200 ${
                    isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
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
                  <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                    Tgl Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className={`w-full text-sm font-mono font-normal p-2 rounded-xl border outline-none transition-all duration-200 ${
                      isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                    Tgl Selesai
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className={`w-full text-sm font-mono font-normal p-2 rounded-xl border outline-none transition-all duration-200 ${
                      isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                    Durasi (Hari)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={leaveForm.durationDays}
                    onChange={(e) => setLeaveForm({ ...leaveForm, durationDays: Number(e.target.value) })}
                    className={`w-full text-sm font-mono font-normal p-2 rounded-xl border outline-none transition-all duration-200 ${
                      isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-normal mb-1 text-slate-700 dark:text-gray-300">
                  Alasan Permohonan
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan alasan atau keperluan pengajuan izin/cuti..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className={`w-full text-sm font-normal p-2.5 rounded-xl border outline-none transition-all duration-200 ${
                    isLight ? 'bg-white border-cyan-500/60 focus:border-cyan-500' : 'bg-[#0d1117] border-cyan-500/35 focus:border-cyan-400'
                  }`}
                />
              </div>

              <div className={`flex items-center justify-end gap-3 pt-3 border-t ${
                isLight ? 'border-slate-200' : 'border-gray-700/40'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsNewLeaveModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'bg-[#0d1117] border-slate-700 text-gray-300 hover:text-white'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer transition-all duration-200 active:scale-[0.99] bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-400/50 shadow-[0_0_14px_rgba(245,158,11,0.28)]"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Pengajuan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrModule;