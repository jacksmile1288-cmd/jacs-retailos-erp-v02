import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import {
  Lock,
  X,
  Delete,
  ShieldAlert,
  Users,
  Briefcase,
  CreditCard,
  ShoppingBag,
  Boxes,
  Store,
  Shield,
  KeyRound,
  UserCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { JacSLogo } from '../common/JacSLogo';

type DivisionFilter = 'ALL' | 'EXECUTIVE' | 'HR' | 'FINANCE' | 'PURCHASING' | 'WAREHOUSE' | 'POS';

interface DivisionMeta {
  id: DivisionFilter;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  roles: string[];
}

const DIVISION_TABS: DivisionMeta[] = [
  {
    id: 'ALL',
    label: 'Semua Divisi',
    shortLabel: 'Semua',
    icon: Users,
    color: '#00f2fe',
    roles: [],
  },
  {
    id: 'EXECUTIVE',
    label: 'Executive & Managerial',
    shortLabel: 'Eksekutif',
    icon: Briefcase,
    color: '#10B981',
    roles: ['Manager'],
  },
  {
    id: 'HR',
    label: 'Human Resources (HR)',
    shortLabel: 'HR & SDM',
    icon: Users,
    color: '#06b6d4',
    roles: ['HR Staff'],
  },
  {
    id: 'FINANCE',
    label: 'Finance & Accounting',
    shortLabel: 'Keuangan',
    icon: CreditCard,
    color: '#f59e0b',
    roles: ['Finance Staff'],
  },
  {
    id: 'PURCHASING',
    label: 'Purchasing & Procurement',
    shortLabel: 'Pengadaan',
    icon: ShoppingBag,
    color: '#f43f5e',
    roles: ['Purchasing Staff'],
  },
  {
    id: 'WAREHOUSE',
    label: 'Warehouse & Inventory',
    shortLabel: 'Gudang',
    icon: Boxes,
    color: '#8b5cf6',
    roles: ['Inventory Staff'],
  },
  {
    id: 'POS',
    label: 'POS & Cashier',
    shortLabel: 'Kasir',
    icon: Store,
    color: '#ff7a00',
    roles: ['Kasir'],
  },
];

export const PinAuthModal: React.FC = () => {
  const {
    isPinModalOpen,
    closePinAuth,
    verifyPin,
    users,
    employees,
    activeUser,
    theme,
  } = useApp();

  const [selectedDivision, setSelectedDivision] = useState<DivisionFilter>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShake, setIsShake] = useState(false);

  const isLight = theme === 'light';

  // Sinkronisasi data saat modal dibuka
  useEffect(() => {
    if (isPinModalOpen) {
      setPinInput('');
      setErrorMessage(null);
      setIsShake(false);
      // Default pilih user yang sedang aktif atau null
      setSelectedUser(activeUser || null);
    }
  }, [isPinModalOpen, activeUser]);

  // Listener keyboard untuk kenyamanan input PIN
  useEffect(() => {
    if (!isPinModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closePinAuth();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPinModalOpen, pinInput, selectedUser]);

  if (!isPinModalOpen) return null;

  // Filter daftar staf berdasarkan divisi
  const filteredUsers = users.filter((u) => {
    // Sembunyikan akun Super Admin dari daftar cepat divisi operasional
    // (Super Admin hanya bisa diakses via console terpisah dengan PIN 8888 atau password master)
    if (u.role === 'Super Admin') return false;

    if (selectedDivision === 'ALL') return true;
    const tabMeta = DIVISION_TABS.find((t) => t.id === selectedDivision);
    if (!tabMeta) return true;
    return tabMeta.roles.includes(u.role);
  });

  const handleKeyPress = (num: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + num;
      setPinInput(next);
      setErrorMessage(null);
      if (next.length === 4) {
        submitPin(next, selectedUser?.user_id);
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

  const submitPin = (val: string, targetUserId?: string) => {
    const result = verifyPin(val, targetUserId);
    if (!result.success) {
      setErrorMessage(result.error || 'PIN Tidak Cocok');
      triggerShake();
      setTimeout(() => {
        setPinInput('');
      }, 700);
    }
  };

  const triggerShake = () => {
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
  };

  // Helper untuk menghubungkan User dengan data NIP dari Employee Master Data
  const getEmployeeInfo = (user: User) => {
    const matchedEmp = employees.find(
      (e) =>
        e.email?.toLowerCase() === user.email?.toLowerCase() ||
        e.name?.toLowerCase().trim() === user.name?.toLowerCase().trim()
    );
    return {
      nip: matchedEmp?.nip || user.user_id,
      department:
        matchedEmp?.department ||
        (user.role === 'Manager'
          ? 'Executive & Management'
          : user.role === 'HR Staff'
          ? 'Human Resources'
          : user.role === 'Finance Staff'
          ? 'Finance & Accounting'
          : user.role === 'Purchasing Staff'
          ? 'Purchasing & Procurement'
          : user.role === 'Inventory Staff'
          ? 'Warehouse & Inventory'
          : 'POS & Cashier'),
    };
  };

  return (
    <div
      id="modal-division-auth-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        id="modal-division-auth-card"
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-[0_25px_60px_rgba(0,0,0,0.85)] relative overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#161b22] border-[#30363d] text-white'
        } ${isShake ? 'animate-bounce' : 'animate-in zoom-in-95 duration-150'}`}
      >
        {/* Tombol Tutup Pojok Kanan Atas */}
        <button
          type="button"
          onClick={closePinAuth}
          className={`absolute top-4 right-4 z-10 p-2 rounded-xl transition cursor-pointer ${
            isLight
              ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              : 'text-gray-400 hover:text-white hover:bg-[#21262d]'
          }`}
          title="Tutup (Batal)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div
          className={`p-4 sm:p-5 border-b shrink-0 flex items-center justify-between ${
            isLight ? 'border-slate-200 bg-slate-50/70' : 'border-[#30363d] bg-[#0d1117]/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <JacSLogo size="md" imgOnly={true} className="shrink-0 drop-shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                  Login &amp; Switch Akun Karyawan
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span>MASTER DATA SDM</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Validasi kata sandi &amp; PIN staf divisi terintegrasi langsung dengan Master Data Karyawan
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body: Split 2 Kolom (Kiri: Daftar Karyawan per Divisi, Kanan: Keypad PIN & Verifikasi) */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* KOLOM KIRI: Tab Filter Divisi & Kartu Karyawan */}
          <div
            className={`w-full md:w-7/12 flex flex-col min-h-0 border-b md:border-b-0 md:border-r ${
              isLight ? 'border-slate-200 bg-slate-50/40' : 'border-[#30363d] bg-[#0d1117]/40'
            }`}
          >
            {/* Filter Tab Kategori Divisi */}
            <div className="p-3 border-b border-gray-700/20 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {DIVISION_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isTabActive = selectedDivision === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedDivision(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                        isTabActive
                          ? isLight
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                          : isLight
                          ? 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                          : 'bg-[#161b22] text-gray-300 hover:bg-[#21262d] border border-[#30363d]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List Akun Karyawan Berdasarkan Divisi */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold px-1 mb-1">
                <span>PILIH AKUN STAF DIVISI ({filteredUsers.length}):</span>
                <span className="text-[10px] text-cyan-400">Klik untuk otentikasi</span>
              </div>

              {filteredUsers.map((user) => {
                const isSelected = selectedUser?.user_id === user.user_id;
                const isCurrentActive = activeUser?.user_id === user.user_id;
                const empInfo = getEmployeeInfo(user);

                return (
                  <div
                    key={user.user_id}
                    onClick={() => {
                      setSelectedUser(user);
                      setPinInput('');
                      setErrorMessage(null);
                    }}
                    className={`w-full p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                      isSelected
                        ? isLight
                          ? 'bg-cyan-50/90 border-cyan-500 shadow-md ring-2 ring-cyan-500/20'
                          : 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500/50'
                        : isLight
                        ? 'bg-white hover:bg-slate-100/80 border-slate-200 shadow-xs'
                        : 'bg-[#161b22] hover:bg-[#21262d] border-[#30363d]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {user.avatarUrl || user.avatar ? (
                          <img
                            src={user.avatarUrl || user.avatar || ''}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border border-cyan-500/40"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                            isLight
                              ? 'bg-slate-200 border-slate-300 text-slate-500'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}>
                            <Users className="w-5 h-5" />
                          </div>
                        )}
                        {isCurrentActive && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#161b22] rounded-full"
                            title="Akun Aktif Saat Ini"
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs sm:text-sm font-bold truncate">{user.name}</p>
                          {isCurrentActive && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              AKTIF
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 truncate">{empInfo.department}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                              user.role === 'Manager'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : user.role === 'HR Staff'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : user.role === 'Finance Staff'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : user.role === 'Purchasing Staff'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : user.role === 'Inventory Staff'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            }`}
                          >
                            {user.role}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {empInfo.nip}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                          submitPin(user.pin, user.user_id);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition cursor-pointer active:scale-95 ${
                          isLight
                            ? 'bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-800 border-slate-300'
                            : 'bg-[#0d1117] hover:bg-cyan-950/60 text-gray-300 hover:text-cyan-300 border-[#30363d]'
                        }`}
                        title={`Login cepat langsung sebagai ${user.name} (PIN: ${user.pin})`}
                      >
                        PIN: ••••
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KOLOM KANAN: Keypad PIN & Otentikasi Langsung */}
          <div className="w-full md:w-5/12 flex flex-col justify-between p-4 sm:p-5 overflow-y-auto">
            <div>
              {/* Target Profil Terpilih Banner */}
              <div
                className={`p-3 rounded-2xl border mb-4 flex items-center gap-3 transition-colors ${
                  isLight
                    ? 'bg-cyan-50/70 border-cyan-200 text-slate-900'
                    : 'bg-cyan-950/30 border-cyan-500/30 text-white'
                }`}
              >
                {selectedUser ? (
                  <>
                    {selectedUser.avatarUrl || selectedUser.avatar ? (
                      <img
                        src={selectedUser.avatarUrl || selectedUser.avatar || ''}
                        alt={selectedUser.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-cyan-500 shrink-0"
                      />
                    ) : (
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 border-cyan-500 shrink-0 ${
                        isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Users className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider">
                        Verifikasi Akun Karyawan
                      </p>
                      <h4 className="text-xs sm:text-sm font-black truncate">{selectedUser.name}</h4>
                      <p className="text-[10px] text-gray-400 font-medium">
                        Role: <strong>{selectedUser.role}</strong>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold">Autentikasi PIN Cepat</h4>
                      <p className="text-[10px] text-gray-400">
                        Ketik 4 digit PIN atau pilih akun di samping
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* PIN Dots Indicator */}
              <div className="flex justify-center gap-4 mb-4">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = idx < pinInput.length;
                  return (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full transition-all duration-150 ${
                        filled
                          ? 'bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.9)] scale-110'
                          : isLight
                          ? 'bg-slate-200 border border-slate-300'
                          : 'bg-[#21262d] border border-[#30363d]'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Error message badge */}
              {errorMessage && (
                <div className="mb-3 text-center text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/30 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 animate-fadeIn">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Numeric Keypad Grid */}
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(num)}
                    className={`h-12 sm:h-13 rounded-2xl font-black text-lg border transition cursor-pointer active:scale-95 ${
                      isLight
                        ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs'
                        : 'bg-[#21262d] hover:bg-[#30363d] text-white border-[#30363d] hover:border-cyan-400/50 shadow-xs'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className={`h-12 sm:h-13 rounded-2xl text-xs font-bold transition flex items-center justify-center border cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                      : 'bg-[#21262d]/50 hover:bg-[#21262d] text-gray-400 hover:text-white border-[#30363d]'
                  }`}
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  className={`h-12 sm:h-13 rounded-2xl font-black text-lg border transition cursor-pointer active:scale-95 ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs'
                      : 'bg-[#21262d] hover:bg-[#30363d] text-white border-[#30363d] hover:border-cyan-400/50 shadow-xs'
                  }`}
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className={`h-12 sm:h-13 rounded-2xl transition flex items-center justify-center border cursor-pointer active:scale-95 ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rose-600 border-slate-300'
                      : 'bg-[#21262d]/50 hover:bg-[#21262d] text-gray-400 hover:text-rose-400 border-[#30363d]'
                  }`}
                  title="Hapus Digit Terakhir"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Catatan Hak Akses & Kunci Super Admin */}
            <div
              className={`pt-3 border-t text-[11px] leading-relaxed flex items-start gap-2 ${
                isLight ? 'border-slate-200 text-slate-500' : 'border-gray-700/40 text-gray-400'
              }`}
            >
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Login menggunakan kredensial divisi otomatis menyesuaikan hak akses menu sidebar. Konsol <strong>Super Admin</strong> tetap terkunci dan memerlukan sandi master terpisah.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
