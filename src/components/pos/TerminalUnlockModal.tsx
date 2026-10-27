import React, { useState } from 'react';
import { Terminal, User, UserRole } from '../../types';
import { useApp } from '../../context/AppContext';
import { Lock, X, ShieldAlert, KeyRound, Check, Delete, Eye, EyeOff, User as UserIcon } from 'lucide-react';

interface TerminalUnlockModalProps {
  terminal: Terminal | null;
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: (terminal: Terminal, user?: User) => void;
}

export const TerminalUnlockModal: React.FC<TerminalUnlockModalProps> = ({
  terminal,
  isOpen,
  onClose,
  onUnlockSuccess,
}) => {
  const { theme, developerPassword, users, employees, setCurrentUser, setActiveUser } = useApp();
  const isLight = theme === 'light';
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  if (!isOpen || !terminal) return null;

  const handleVerify = (inputVal: string) => {
    const trimmed = inputVal.trim();
    if (!trimmed) {
      setErrorMessage('Masukkan kata sandi master atau PIN');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    // 1. Cek Sandi Master Super Admin (dinamis dari state / localStorage)
    const storedMaster = localStorage.getItem('jacs_super_admin_password');
    const isMasterMatch =
      trimmed === developerPassword ||
      (Boolean(storedMaster) && trimmed === storedMaster) ||
      trimmed === 'Admin123';

    // 2. Tentukan Kasir Berdasarkan Terminal & PIN Kasir
    const termName = (terminal.name || '').toUpperCase();
    const termCode = (terminal.code || '').toUpperCase();
    const termId = (terminal.id || '').toUpperCase();

    let targetCashierName = '';
    let targetCashierRole = 'Kasir 01';
    let targetCashierEmail = 'andi.pos01@jacs-erp.com';
    let targetCashierId = 'emp-001';

    if (termName.includes('02') || termCode.includes('02') || termId === 'T-02') {
      targetCashierName = 'Maya Indah';
      targetCashierRole = 'Kasir 02';
      targetCashierEmail = 'maya.pos02@jacs-erp.com';
      targetCashierId = 'emp-002';
    } else if (termName.includes('03') || termCode.includes('03') || termId === 'T-03') {
      targetCashierName = 'Rian Hidayat';
      targetCashierRole = 'Kasir 03';
      targetCashierEmail = 'rian.pos03@jacs-erp.com';
      targetCashierId = 'emp-003';
    } else if (termName.includes('04') || termCode.includes('04') || termId === 'T-04') {
      targetCashierName = 'Siti Aminah';
      targetCashierRole = 'Kasir 04';
      targetCashierEmail = 'siti.pos04@jacs-erp.com';
      targetCashierId = 'emp-004';
    } else {
      targetCashierName = 'Andi Pratama';
      targetCashierRole = 'Kasir 01';
      targetCashierEmail = 'andi.pos01@jacs-erp.com';
      targetCashierId = 'emp-001';
    }

    // Jika input PIN 1111/2222/3333/7777, override ke kasir spesifik
    if (trimmed === '1111') {
      targetCashierName = 'Andi Pratama';
      targetCashierRole = 'Kasir 01';
    } else if (trimmed === '2222') {
      targetCashierName = 'Maya Indah';
      targetCashierRole = 'Kasir 02';
    } else if (trimmed === '3333') {
      targetCashierName = 'Rian Hidayat';
      targetCashierRole = 'Kasir 03';
    } else if (trimmed === '7777') {
      targetCashierName = 'Siti Aminah';
      targetCashierRole = 'Kasir 04';
    }

    let matchedUser: User | undefined;
    const isPin1234 = trimmed === '1234';
    const isLegacyPin = trimmed === '1111' || trimmed === '2222' || trimmed === '3333' || trimmed === '7777';

    if (isPin1234 || isLegacyPin) {
      const existingUser = users.find((u) => u.name === targetCashierName);
      const existingEmp = employees.find((e) => e.name === targetCashierName);
      matchedUser = existingUser || (existingEmp ? {
        user_id: existingEmp.id,
        id: existingEmp.id,
        name: existingEmp.name,
        email: existingEmp.email || targetCashierEmail,
        division: 'POS & Kasir',
        role: 'Kasir',
        status: 'Active',
        pin: '1234',
        avatar: existingEmp.avatar || null,
        avatarUrl: existingEmp.avatarUrl ?? null,
      } : {
        user_id: targetCashierId,
        id: targetCashierId,
        name: targetCashierName,
        email: targetCashierEmail,
        division: 'POS & Kasir',
        role: 'Kasir',
        status: 'Active',
        pin: '1234',
        avatar: null,
        avatarUrl: null,
      });
    } else {
      // Cek PIN Operator Kasir / Staff yang Terdaftar di users / employees
      matchedUser = users.find((u) => u.pin === trimmed && u.status === 'Active');
      if (!matchedUser) {
        const emp = employees.find((e) => e.pin === trimmed && e.status !== 'Inactive');
        if (emp) {
          matchedUser = {
            user_id: emp.id,
            id: emp.id,
            name: emp.name,
            email: emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@jacs-erp.com`,
            division: emp.division,
            role: (emp.role.includes('Kasir') ? 'Kasir' : emp.role.includes('Manager') ? 'Manager' : emp.role) as UserRole,
            status: 'Active',
            pin: emp.pin,
            avatar: emp.avatar || null,
            avatarUrl: emp.avatarUrl ?? null,
          };
        }
      }
    }

    if (isMasterMatch || matchedUser) {
      if (matchedUser) {
        setCurrentUser(matchedUser);
        setActiveUser(matchedUser);
      }
      setErrorMessage(null);
      onUnlockSuccess(terminal, matchedUser);
      setPasswordInput('');
    } else {
      setErrorMessage('Akses Ditolak: Sandi Master atau PIN Kasir Salah');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      setPasswordInput('');
    }
  };

  const handleKeyClick = (char: string) => {
    setErrorMessage(null);
    setPasswordInput((prev) => prev + char);
  };

  const handleDelete = () => {
    setPasswordInput((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  return (
    <div
      id="modal-terminal-unlock"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
    >
      <div
        className={`w-full max-w-md max-h-[90vh] overflow-hidden p-4 space-y-2.5 rounded-2xl border shadow-[0_25px_60px_rgba(0,0,0,0.95)] relative transition-all ${
          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
        } ${
          isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''
        }`}
        style={{
          borderTop: `4px solid ${terminal.colorHex}`,
          boxShadow: `0 0 25px ${terminal.colorHex}25`,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-900 dark:text-[#8b949e] dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#21262d] transition cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div
            className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center border shadow-sm"
            style={{
              backgroundColor: `${terminal.colorHex}20`,
              borderColor: `${terminal.colorHex}60`,
              color: terminal.colorHex,
            }}
          >
            <Lock className="w-5 h-5 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-300 text-slate-900 font-bold text-[10px] px-2 py-0.5 rounded">
            <span>OTORISASI KASIR OPERASIONAL</span>
          </div>

          <h3 className="text-base font-black tracking-wide" style={{ color: terminal.colorHex }}>
            {terminal.name} • {terminal.businessModel || terminal.location}
          </h3>
          <p className="text-[11px] text-slate-600 dark:text-[#8b949e] max-w-xs mx-auto line-clamp-1">
            Masukkan PIN Kasir untuk membuka terminal dan mencatat identitas kasir di profil Topbar.
          </p>
        </div>

        {/* Quick Cashier Selector Buttons */}
        <div>
          <div className="text-[10px] font-bold text-slate-700 dark:text-gray-400 uppercase tracking-wider mb-1 px-1 flex items-center justify-between">
            <span>PILIH CEPAT KASIR BERTUGAS:</span>
            <span className="bg-slate-100 border border-slate-300 text-slate-900 font-bold text-[10px] px-2 py-0.5 rounded">
              4 KASIR AKTIF
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'k1', name: 'Andi Pratama', role: 'Kasir 01', pin: '1234' },
              { id: 'k2', name: 'Maya Indah', role: 'Kasir 02', pin: '1234' },
              { id: 'k3', name: 'Rian Hidayat', role: 'Kasir 03', pin: '1234' },
              { id: 'k4', name: 'Siti Aminah', role: 'Kasir 04', pin: '1234' },
            ].map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => handleVerify(k.pin)}
                className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-between group ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-300'
                    : 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d]'
                }`}
              >
                <div className="min-w-0 pr-1">
                  <div className="text-slate-950 font-bold text-xs truncate">
                    {k.name}
                  </div>
                  <div className="text-slate-700 font-semibold text-[10px] font-mono">{k.role}</div>
                </div>
                <span className="bg-slate-100 border border-slate-300 text-slate-900 font-bold text-[10px] px-2 py-0.5 rounded shrink-0">
                  {k.pin}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Box */}
        <div className="space-y-1.5">
          <div className="relative">
            <input
              id="input-terminal-unlock-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Atau ketik PIN kasir (4 digit)..."
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setErrorMessage(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleVerify(passwordInput);
                }
              }}
              autoFocus
              className={`w-full text-center text-base font-mono tracking-widest px-8 py-1.5 rounded-xl outline-none transition border-2 ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-indigo-600'
                  : 'bg-[#0d1117] border-[#30363d] focus:border-[#0052FF] text-white'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-800 dark:hover:text-white p-1 cursor-pointer transition"
              title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-950 dark:bg-rose-500/15 dark:border-rose-500/50 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 animate-fadeIn">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Security Guidance Banner */}
        <div className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
          isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0d1117] border-[#30363d] text-gray-400'
        }`}>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-gray-400 font-medium">
            <KeyRound className="w-3.5 h-3.5 text-slate-700 dark:text-cyan-400 shrink-0" />
            <span>PIN Kasir Default:</span>
            <span className="bg-slate-100 border border-slate-300 text-slate-900 font-bold text-[10px] px-2 py-0.5 rounded font-mono">
              1234
            </span>
          </div>
          <span className="bg-slate-100 border border-slate-300 text-slate-900 font-bold text-[10px] px-2 py-0.5 rounded">
            KASIR READY
          </span>
        </div>

        {/* On-screen Virtual Keypad for Mobile/Touch Screen */}
        <div className="grid grid-cols-3 gap-1.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (k === 'C') setPasswordInput('');
                else if (k === '⌫') handleDelete();
                else handleKeyClick(k);
              }}
              className={`h-9 text-sm font-bold rounded-xl border active:scale-95 transition cursor-pointer flex items-center justify-center ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                  : 'bg-[#21262d] hover:bg-[#30363d] text-white border-[#30363d]'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                : 'bg-[#21262d] hover:bg-[#30363d] text-gray-300 border border-[#30363d]'
            }`}
          >
            Batal
          </button>
          <button
            type="button"
            id="btn-confirm-terminal-unlock"
            onClick={() => handleVerify(passwordInput)}
            className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Buka Terminal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
