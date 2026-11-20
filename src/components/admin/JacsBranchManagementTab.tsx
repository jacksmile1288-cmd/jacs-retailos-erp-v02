import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BusinessBranch } from '../../types';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Phone, 
  Store, 
  Trash2, 
  Edit3, 
  BadgeCheck, 
  Network,
  ArrowRight,
  X,
  Check,
  Lock,
  Unlock
} from 'lucide-react';

export const JacsBranchManagementTab: React.FC = () => {
  const { 
    branches, 
    addBranch, 
    updateBranch, 
    deleteBranch, 
    showToast,
    theme 
  } = useApp();

  const isLight = theme === 'light';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BusinessBranch | null>(null);
  
  const [form, setForm] = useState<Omit<BusinessBranch, 'id'>>({
    branchCode: '',
    name: '',
    industryCategory: 'RETAIL',
    isHeadquarters: false,
    address: '',
    phone: '',
    whatsapp: '',
    activeCashierCount: 1,
    slogan: 'Best Price & Quality Retail',
    footerNote: 'Terima kasih atas kunjungan Anda!',
    status: 'ACTIVE'
  });

  const industryPresets: Record<string, Partial<Omit<BusinessBranch, 'id'>>> = {
    'RETAIL': {
      slogan: 'Best Price & Quality Retail',
      footerNote: 'Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.',
      activeCashierCount: 1
    },
    'FNB': {
      slogan: 'Kitchen & Coffee Experience',
      footerNote: 'Selamat menikmati hidangan kami. Terima kasih atas kunjungannya!',
      activeCashierCount: 2
    },
    'PHARMACY': {
      slogan: 'Apotek & Perawatan Terpercaya',
      footerNote: 'Semoga lekas sembuh. Obat yang dibeli tidak dapat ditukar kecuali perjanjian awal.',
      activeCashierCount: 1
    },
    'WORKSHOP': {
      slogan: 'Servis Kendaraan Terpercaya & Suku Cadang Asli',
      footerNote: 'Garansi servis berlaku 7 hari. Simpan struk ini sebagai bukti resmi.',
      activeCashierCount: 1
    }
  };

  const handleIndustryChange = (industry: string) => {
    const preset = industryPresets[industry] || industryPresets['RETAIL'];
    setForm(prev => ({
      ...prev,
      industryCategory: industry,
      ...preset
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch) {
      updateBranch(editingBranch.id, form);
      showToast('Cabang berhasil diperbarui');
    } else {
      addBranch(form);
      showToast('Cabang baru berhasil didaftarkan');
    }
    closeModal();
  };

  const openModal = (branch?: BusinessBranch) => {
    if (branch) {
      setEditingBranch(branch);
      setForm({ ...branch });
    } else {
      setEditingBranch(null);
      setForm({
        branchCode: `BR-${String(branches.length + 1).padStart(3, '0')}`,
        name: '',
        industryCategory: 'RETAIL',
        isHeadquarters: branches.length === 0,
        address: '',
        phone: '',
        whatsapp: '',
        activeCashierCount: 1,
        slogan: 'Best Price & Quality Retail',
        footerNote: 'Terima kasih atas kunjungan Anda!',
        status: 'ACTIVE'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Header Section */}
      <div className={`p-6 rounded-2xl border space-y-4 transition-all duration-200 ${
        isLight
          ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.18)] hover:border-cyan-500 hover:shadow-[0_0_22px_rgba(6,182,212,0.32)]'
          : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.16)]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-medium text-lg tracking-wide">
                  Manajemen Jaringan Cabang &amp; Outlet
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-widest border ${
                  isLight ? 'bg-cyan-50 text-cyan-700 border-cyan-400/70' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                }`}>
                  MULTI-LOCATION ENGINE
                </span>
              </div>
              <p className={`text-xs font-normal tracking-wide mt-0.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                Daftarkan dan kelola seluruh lokasi fisik bisnis Anda. Setiap cabang dapat memiliki profil industri dan kapasitas kasir yang berbeda.
              </p>
            </div>
          </div>

          <button
            onClick={() => openModal()}
            className={`px-4 py-2 rounded-xl text-[11px] uppercase tracking-widest font-medium flex items-center gap-2 transition active:scale-95 cursor-pointer shrink-0 ${
              isLight 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Cabang Baru</span>
          </button>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {branches.length === 0 ? (
          <div className={`col-span-full p-12 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center ${
            isLight ? 'bg-white border-cyan-500/50 shadow-[0_0_14px_rgba(6,182,212,0.12)]' : 'bg-[#0d1117] border-cyan-500/30'
          }`}>
            <Store className="w-12 h-12 text-gray-600 mb-4 opacity-20" />
            <p className="text-gray-500 text-sm font-medium tracking-wide">Belum ada cabang terdaftar.</p>
            <p className="text-gray-500 text-xs font-normal mt-1">Gunakan tombol di atas untuk mendaftarkan lokasi pertama Anda.</p>
          </div>
        ) : (
          branches.map((branch) => (
            <div 
              key={branch.id}
              className={`group relative p-5 rounded-2xl border transition-all duration-200 ${
                isLight 
                  ? 'bg-white border-cyan-500/65 shadow-[0_0_14px_rgba(6,182,212,0.14)] hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.28)]' 
                  : 'bg-[#161b22] border-cyan-500/30 shadow-[0_0_14px_rgba(6,182,212,0.06)] hover:border-cyan-400/60 hover:shadow-[0_0_18px_rgba(6,182,212,0.16)]'
              }`}
            >
              {branch.isHeadquarters && (
                <div className="absolute -top-3 left-4 px-2 py-0.5 rounded bg-rose-600 text-[10px] font-mono font-medium uppercase tracking-widest text-white shadow-lg flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" />
                  KANTOR PUSAT
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isLight ? 'bg-cyan-50/70 border-cyan-500/30 text-cyan-600' : 'bg-[#0d1117] border-cyan-500/25 text-emerald-400'
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm tracking-wide">{branch.name}</h3>
                    <p className="text-[10px] font-mono font-normal text-gray-500">{branch.branchCode} • {branch.industryCategory}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => updateBranch(branch.id, { status: branch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      branch.status === 'ACTIVE' 
                        ? 'bg-amber-500/10 text-amber-500 hover:text-amber-400' 
                        : 'bg-emerald-500/10 text-emerald-500 hover:text-emerald-400'
                    }`}
                    title={branch.status === 'ACTIVE' ? 'Nonaktifkan Cabang' : 'Aktifkan Cabang'}
                  >
                    {branch.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => openModal(branch)}
                    className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400 transition cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Hapus cabang ${branch.name}?`)) {
                        deleteBranch(branch.id);
                        showToast('Cabang berhasil dihapus');
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 mb-4">
                <div className="flex items-start gap-2 text-xs font-normal">
                  <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                  <span className="text-gray-400 line-clamp-2">{branch.address}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-normal">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-gray-400 font-mono">{branch.phone}</span>
                </div>
              </div>

              <div className={`pt-4 border-t flex items-center justify-between ${
                isLight ? 'border-slate-100' : 'border-gray-800/50'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-widest border ${
                    branch.status === 'ACTIVE' 
                      ? isLight
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-400/70'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : isLight
                      ? 'bg-rose-50 text-rose-700 border-rose-400/70'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    {branch.status}
                  </div>
                  <div className="text-[10px] font-mono font-normal text-gray-500">
                    {branch.activeCashierCount} Kasir Aktif
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => openModal(branch)}
                  className={`text-[11px] font-medium flex items-center gap-1 transition cursor-pointer ${
                    isLight ? 'text-emerald-600 hover:text-emerald-700' : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  Kelola Detail
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add/Edit Branch */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-zoomIn ${
            isLight
              ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)]'
              : 'bg-[#161b22] border-cyan-500/40 shadow-[0_0_24px_rgba(6,182,212,0.14)]'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-gray-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-medium text-sm tracking-wide">{editingBranch ? 'Perbarui Cabang' : 'Daftarkan Cabang Baru'}</h3>
              </div>
              <button onClick={closeModal} className="text-gray-500 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Nama & Kode */}
                <div className="sm:col-span-2 grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-mono font-medium text-gray-500 mb-1.5 uppercase tracking-widest">Nama Cabang / Outlet</label>
                    <input 
                      type="text" 
                      required
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="e.g. Cabang Bandung Utara"
                      className={`w-full p-2.5 rounded-xl border text-sm font-normal focus:outline-none transition ${
                        isLight ? 'bg-slate-50 border-slate-200 focus:border-emerald-500' : 'bg-[#0d1117] border-gray-800 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-medium text-gray-500 mb-1.5 uppercase tracking-widest">Kode Cabang</label>
                    <input 
                      type="text" 
                      required
                      value={form.branchCode}
                      onChange={e => setForm({...form, branchCode: e.target.value})}
                      placeholder="e.g. BR-002"
                      className={`w-full p-2.5 rounded-xl border text-sm font-mono font-normal focus:outline-none transition ${
                        isLight ? 'bg-slate-50 border-slate-200 focus:border-emerald-500' : 'bg-[#0d1117] border-gray-800 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Industri & Headquarter */}
                <div>
                  <label className="block text-[10px] font-mono font-medium text-gray-500 mb-1.5 uppercase tracking-widest">Kategori Industri</label>
                  <select 
                    value={form.industryCategory}
                    onChange={e => handleIndustryChange(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-sm font-normal focus:outline-none transition ${
                      isLight ? 'bg-slate-50 border-slate-200 focus:border-emerald-500' : 'bg-[#0d1117] border-gray-800 focus:border-emerald-500'
                    }`}
                  >
                    <option value="RETAIL">Ritel Modern</option>
                    <option value="FNB">F&amp;B / Restoran</option>
                    <option value="PHARMACY">Apotek / Farmasi</option>
                    <option value="WORKSHOP">Bengkel / Servis</option>
                    <option value="BUILDING_MATERIALS">Bahan Bangunan</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setForm({...form, isHeadquarters: !form.isHeadquarters})}
                    className={`w-10 h-5 rounded-full relative transition cursor-pointer ${
                      form.isHeadquarters ? 'bg-emerald-500' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${
                      form.isHeadquarters ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                  <span className="text-xs font-medium">Kantor Pusat (HQ)</span>
                </div>

                {/* Kontak */}
                <div>
                  <label className="block text-[10px] font-mono font-medium text-gray-500 mb-1.5 uppercase tracking-widest">Nomor Telepon</label>
                  <input 
                    type="text" 
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="e.g. 022-1234567"
                    className={`w-full p-2.5 rounded-xl border text-sm font-mono font-normal focus:outline-none transition ${
                      isLight ? 'bg-slate-50 border-slate-200 focus:border-emerald-500' : 'bg-[#0d1117] border-gray-800 focus:border-emerald-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-medium text-gray-500 mb-1.5 uppercase tracking-widest">WhatsApp (Sales)</label>
                  <input 
                    type="text" 
                    value={form.whatsapp}
                    onChange={e => setForm({...form, whatsapp: e.target.value})}
                    placeholder="e.g. 0812-xxxx-xxxx"
                    className={`w-full p-2.5 rounded-xl border text-sm font-mono font-normal focus:outline-none transition ${
                      isLight ? 'bg-slate-50 border-slate-200 focus:border-emerald-500' : 'bg-[#0d1117] border-gray-800 focus:border-emerald-500'
                    }`}
                  />
                </div>

                {/* Alamat */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono font-medium text-gray-500 mb-1.5 uppercase tracking-widest">Alamat Lengkap</label>
                  <textarea 
                    value={form.address}
                    onChange={e => setForm({...form, address: e.target.value})}
                    rows={2}
                    className={`w-full p-2.5 rounded-xl border text-sm font-normal focus:outline-none transition resize-none ${
                      isLight ? 'bg-slate-50 border-slate-200 focus:border-emerald-500' : 'bg-[#0d1117] border-gray-800 focus:border-emerald-500'
                    }`}
                  />
                </div>

                {/* Preset Information */}
                <div className={`sm:col-span-2 p-4 rounded-xl border ${
                  isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-500/5 border-emerald-500/25 text-emerald-300'
                }`}>
                  <h4 className="text-[10px] font-mono font-medium mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                    <ArrowRight className="w-3 h-3" />
                    Preset Konfigurasi untuk {form.industryCategory}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] font-mono opacity-70 uppercase tracking-wider font-medium mb-1">Slogan Struk</p>
                      <p className="font-normal italic">&quot;{form.slogan}&quot;</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono opacity-70 uppercase tracking-wider font-medium mb-1">Footer Struk</p>
                      <p className="font-normal italic">&quot;{form.footerNote}&quot;</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={closeModal}
                  className={`px-5 py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                    isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className={`px-6 py-2.5 rounded-xl text-xs font-medium tracking-wide transition flex items-center gap-2 cursor-pointer ${
                    isLight 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg' 
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {editingBranch ? 'Simpan Perubahan' : 'Daftarkan Cabang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
