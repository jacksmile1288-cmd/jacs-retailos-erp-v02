import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import {
  X,
  UserCheck,
  Shield,
  KeyRound,
  Mail,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
} from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  isLight,
}) => {
  const { activeUser, setActiveUser, users, setUsers, updateUserPin, showToast, addAuditLog } = useApp();

  const [name, setName] = useState(activeUser?.name || '');
  const [email, setEmail] = useState(activeUser?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(activeUser?.avatar || '');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    if (activeUser) {
      setName(activeUser.name || '');
      setEmail(activeUser.email || '');
      setAvatarUrl(activeUser.avatar || '');
    }
  }, [activeUser]);

  if (!isOpen || !activeUser) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPinInput.trim()) {
      if (newPinInput.length < 4) {
        showToast('⚠️ PIN baru minimal harus 4 digit angka.');
        return;
      }
      if (newPinInput !== confirmPinInput) {
        showToast('⚠️ Konfirmasi PIN baru tidak cocok.');
        return;
      }
      if (activeUser.pin && currentPinInput !== activeUser.pin) {
        showToast('⚠️ PIN lama yang dimasukkan salah.');
        return;
      }
      updateUserPin(activeUser.user_id, newPinInput.trim());
    }

    const updatedUser: User = {
      ...activeUser,
      name: name.trim() || activeUser.name,
      email: email.trim() || activeUser.email,
      avatar: avatarUrl.trim() || activeUser.avatar,
      pin: newPinInput.trim() || activeUser.pin,
    };

    setUsers((prev: User[]) =>
      prev.map((u: User) =>
        u.user_id === activeUser.user_id ? updatedUser : u
      )
    );
    setActiveUser(updatedUser);

    addAuditLog(`Profil pengguna ${name} diperbarui`, 'PROFILE_SETTINGS', 'INFO');
    showToast('✅ Informasi profil & akun berhasil disimpan!');
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-gray-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Pengaturan Profil Pengguna</h3>
              <p className="text-[11px] text-gray-400">Kelola identitas, kontak &amp; PIN keamanan akun</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveProfile} className="p-5 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
          {/* Avatar Preview & Role Badge */}
          <div className="flex items-center gap-3.5 pb-3 border-b border-gray-800/40">
            {avatarUrl || activeUser.avatar ? (
              <img
                src={avatarUrl || activeUser.avatar || ''}
                alt={activeUser.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-500/50 shadow-md shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-800 border-2 border-cyan-500/30 text-slate-400 shrink-0 shadow-md">
                <UserIcon className="w-7 h-7" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm truncate">{activeUser.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  {activeUser.role}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">{activeUser.user_id}</p>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-1">Nama Lengkap:</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-2.5 rounded-xl border font-medium ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/30 border-gray-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-1">Email Resmi ERP:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-2.5 rounded-xl border font-mono ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/30 border-gray-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-1">URL Avatar Foto Profil:</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className={`w-full p-2.5 rounded-xl border font-mono text-[11px] ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/30 border-gray-700 text-white'
              }`}
            />
          </div>

          {/* Section: Ubah PIN Keamanan */}
          <div className="pt-2 border-t border-gray-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Ubah PIN Keamanan (Opsional)
              </span>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPin ? 'Sembunyikan' : 'Intip'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-400 text-[11px] mb-1">PIN Lama (Verifikasi):</label>
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  placeholder="PIN lama..."
                  className={`w-full p-2 rounded-xl border font-mono text-center tracking-widest ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/30 border-gray-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] mb-1">PIN Baru (4-6 Digit):</label>
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="PIN baru..."
                  className={`w-full p-2 rounded-xl border font-mono text-center tracking-widest ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/30 border-gray-700 text-white'
                  }`}
                />
              </div>
            </div>

            {newPinInput && (
              <div>
                <label className="block text-gray-400 text-[11px] mb-1">Konfirmasi PIN Baru:</label>
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="Ulangi PIN baru..."
                  className={`w-full p-2 rounded-xl border font-mono text-center tracking-widest ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/30 border-gray-700 text-white'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl font-semibold cursor-pointer transition ${
                isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-gray-300'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md cursor-pointer transition active:scale-95"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
