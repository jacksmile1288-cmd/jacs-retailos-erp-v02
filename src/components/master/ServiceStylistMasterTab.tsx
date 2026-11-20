import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceStylistMaster } from '../../types';
import { generateNextStylistId } from '../../data/serviceData';

export const ServiceStylistMasterTab: React.FC = () => {
  const {
    theme,
    serviceStylists,
    addServiceStylist,
    updateServiceStylist,
    deleteServiceStylist,
    toggleServiceStylistActive,
    showToast,
  } = useApp();

  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('Senior Barber');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formCommissionRate, setFormCommissionRate] = useState<number>(20);
  const [formRetailCommissionRate, setFormRetailCommissionRate] = useState<number>(0);
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const nextAutoId = useMemo(() => generateNextStylistId(serviceStylists), [serviceStylists]);

  const filteredStylists = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return serviceStylists.filter((s) => {
      if (statusFilter === 'ACTIVE' && !s.isActive) return false;
      if (statusFilter === 'INACTIVE' && s.isActive) return false;
      if (!q) return true;
      return (
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        (s.specialty || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q)
      );
    });
  }, [serviceStylists, searchQuery, statusFilter]);

  const activeCount = useMemo(() => serviceStylists.filter((s) => s.isActive).length, [serviceStylists]);
  const avgCommission = useMemo(() => {
    if (serviceStylists.length === 0) return 0;
    const sum = serviceStylists.reduce((acc, s) => acc + (Number(s.commissionRate) || 0), 0);
    return Math.round((sum / serviceStylists.length) * 10) / 10;
  }, [serviceStylists]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormName('');
    setFormRole('Senior Barber');
    setFormSpecialty('');
    setFormCommissionRate(20);
    setFormRetailCommissionRate(0);
    setFormPhone('');
    setFormNotes('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (stylist: ServiceStylistMaster) => {
    setEditingId(stylist.id);
    setFormName(stylist.name);
    setFormRole(stylist.role);
    setFormSpecialty(stylist.specialty || '');
    setFormCommissionRate(stylist.commissionRate);
    setFormRetailCommissionRate(stylist.retailCommissionRate || 0);
    setFormPhone(stylist.phone || '');
    setFormNotes(stylist.notes || '');
    setFormIsActive(stylist.isActive);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Nama Stylist / Kapster / Petugas wajib diisi.', 'warning');
      return;
    }
    const payload = {
      name: formName.trim(),
      role: formRole.trim() || 'Stylist',
      specialty: formSpecialty.trim(),
      commissionRate: Math.max(0, Math.min(100, Number(formCommissionRate) || 0)),
      retailCommissionRate: Math.max(0, Math.min(100, Number(formRetailCommissionRate) || 0)),
      phone: formPhone.trim(),
      notes: formNotes.trim(),
      isActive: formIsActive,
    };

    if (editingId) {
      updateServiceStylist(editingId, payload);
    } else {
      addServiceStylist(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (stylist: ServiceStylistMaster) => {
    if (serviceStylists.length <= 1) {
      showToast('Minimal harus tersedia 1 data Stylist / Petugas di Master Data.', 'warning');
      return;
    }
    deleteServiceStylist(stylist.id);
  };

  return (
    <div className="space-y-4">
      {/* KPI Header Ringkas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-white border-purple-200' : 'bg-slate-900/90 border-purple-500/30'
          }`}
        >
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Stylist / Petugas Aktif di POS
          </p>
          <p className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
            {activeCount} <span className="text-xs font-normal text-slate-500">/ {serviceStylists.length} terdaftar</span>
          </p>
        </div>
        <div
          className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-white border-emerald-200' : 'bg-slate-900/90 border-emerald-500/30'
          }`}
        >
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Rata-Rata Komisi Jasa
          </p>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {avgCommission}%
            <span className="text-xs font-normal text-slate-500 ml-1.5">per layanan</span>
          </p>
        </div>
        <div
          className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-white border-cyan-200' : 'bg-slate-900/90 border-cyan-500/30'
          }`}
        >
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Jurnal Komisi Otomatis
          </p>
          <p className="text-xs font-mono font-semibold text-cyan-700 dark:text-cyan-300 mt-1.5">
            D: 6-10101 Beban Komisi • K: 2-10201 Hutang Komisi
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Sinkron real-time saat pembayaran POS Jasa diselesaikan
          </p>
        </div>
      </div>

      {/* Toolbar Pencarian & Tambah */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border ${
          isLight ? 'bg-slate-50 border-purple-200' : 'bg-slate-900/90 border-purple-500/30'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Kode STL, Nama Stylist, Role, atau Keahlian..."
            className={`px-3 py-1.5 rounded-lg border text-xs w-full sm:w-72 focus:outline-none focus:border-purple-500 ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900'
                : 'bg-slate-950 border-slate-700 text-slate-100'
            }`}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            className={`px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-purple-500 ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900'
                : 'bg-slate-950 border-slate-700 text-slate-200'
            }`}
          >
            <option value="ALL">Semua Status ({serviceStylists.length})</option>
            <option value="ACTIVE">Aktif di POS ({activeCount})</option>
            <option value="INACTIVE">Nonaktif ({serviceStylists.length - activeCount})</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg shadow-md shadow-purple-500/20 transition cursor-pointer"
        >
          + Tambah Stylist / Petugas
        </button>
      </div>

      {/* Tabel Master Stylist */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className={`border-b text-[11px] uppercase tracking-wider ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-600'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400'
                }`}
              >
                <th className="p-3 font-semibold">Kode ID</th>
                <th className="p-3 font-semibold">Nama Stylist / Petugas</th>
                <th className="p-3 font-semibold">Role / Jabatan</th>
                <th className="p-3 font-semibold">Keahlian / Catatan</th>
                <th className="p-3 font-semibold text-center">Komisi Jasa</th>
                <th className="p-3 font-semibold text-center">Komisi Produk Retail</th>
                <th className="p-3 font-semibold text-center">Status POS</th>
                <th className="p-3 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredStylists.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Tidak ada data Stylist / Petugas yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredStylists.map((st) => (
                  <tr
                    key={st.id}
                    className={`border-b transition ${
                      isLight
                        ? 'border-slate-200 hover:bg-purple-50/40'
                        : 'border-slate-800/60 hover:bg-slate-800/40'
                    } ${!st.isActive ? 'opacity-60' : ''}`}
                  >
                    <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-300 whitespace-nowrap">
                      {st.id}
                    </td>
                    <td className="p-3 font-semibold whitespace-nowrap">
                      <div className={isLight ? 'text-slate-900' : 'text-white'}>{st.name}</div>
                      {st.phone && <div className="text-[10px] font-mono text-slate-500">{st.phone}</div>}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          isLight
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                        }`}
                      >
                        {st.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 max-w-[260px]">
                      <div className="truncate">{st.specialty || '-'}</div>
                      {st.notes && <div className="text-[10px] text-slate-500 truncate">{st.notes}</div>}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {st.commissionRate}%
                    </td>
                    <td className="p-3 text-center font-mono whitespace-nowrap">
                      {Number(st.retailCommissionRate || 0) > 0 ? (
                        <span className="text-cyan-600 dark:text-cyan-300 font-semibold">
                          {st.retailCommissionRate}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">0% (Non-Komisi)</span>
                      )}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleServiceStylistActive(st.id)}
                        className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition cursor-pointer ${
                          st.isActive
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                            : 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/30 hover:bg-slate-500/25'
                        }`}
                      >
                        {st.isActive ? 'AKTIF' : 'NONAKTIF'}
                      </button>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(st)}
                          className={`px-2.5 py-1 rounded text-[10px] font-medium cursor-pointer ${
                            isLight
                              ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(st)}
                          className={`px-2.5 py-1 rounded text-[10px] font-medium border cursor-pointer ${
                            isLight
                              ? 'bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border-rose-300'
                              : 'bg-rose-950/50 hover:bg-rose-600 text-rose-300 hover:text-white border-rose-700/50'
                          }`}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Stylist */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-slate-900 border-purple-500/40 text-slate-100'
            }`}
          >
            <div
              className={`px-5 py-3.5 border-b flex items-center justify-between ${
                isLight ? 'bg-purple-50 border-purple-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div>
                <h3 className="text-sm font-bold">
                  {editingId ? `Edit Stylist / Petugas (${editingId})` : `Tambah Stylist / Petugas Baru (${nextAutoId})`}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Otomatis tampil di Dropdown POS Layanan & perhitungan jurnal komisi 6-10101 / 2-10201
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none px-2 cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Nama Stylist / Petugas *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Budi Senior Barber"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Role / Jabatan *</label>
                  <input
                    type="text"
                    required
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="Senior Barber / Junior Barber / Capster"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Komisi Jasa Layanan (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={formCommissionRate}
                    onChange={(e) => setFormCommissionRate(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-lg border font-mono ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Berlaku pada semua item paket jasa (SVC-*)</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Komisi Produk Retail Salon (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={formRetailCommissionRate}
                    onChange={(e) => setFormRetailCommissionRate(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-lg border font-mono ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Default 0% (Produk fisik PRD-BRB-* non-komisi)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Keahlian / Spesialisasi</label>
                  <input
                    type="text"
                    value={formSpecialty}
                    onChange={(e) => setFormSpecialty(e.target.value)}
                    placeholder="Fade, Hot Towel Shave, Hair Spa..."
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className={`w-full px-3 py-2 rounded-lg border font-mono ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">Catatan</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Jadwal shift atau keterangan tambahan..."
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                />
                <span className="text-xs font-medium">Aktifkan di dropdown Kasir POS Layanan</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-lg font-medium cursor-pointer ${
                    isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Stylist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
