import React, { useState } from 'react';
import { Terminal } from '../../types';
import { X, Plus, Sparkles, Building2, Layers } from 'lucide-react';

interface AddTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (terminal: Omit<Terminal, 'id'>) => void;
  nextIndex: number;
}

const NEON_PRESETS = [
  { label: 'Neon Cyan', colorHex: '#00f2fe' },
  { label: 'Neon Emerald', colorHex: '#10B981' },
  { label: 'Neon Amber', colorHex: '#f59e0b' },
  { label: 'Neon Rose', colorHex: '#f43f5e' },
  { label: 'Neon Violet', colorHex: '#8b5cf6' },
  { label: 'Neon Orange', colorHex: '#ff7a00' },
  { label: 'Neon Sky Blue', colorHex: '#38bdf8' },
  { label: 'Neon Lime', colorHex: '#84cc16' },
  { label: 'Neon Indigo', colorHex: '#6366f1' },
  { label: 'Neon Fuchsia', colorHex: '#d946ef' },
];

const BUSINESS_MODELS = [
  'Ritel & Toko Modern',
  'F&B Resto & Cafe',
  'Swalayan / Supermarket Besar',
  'Apotek & Toko Obat',
  'Fashion & Butik',
  'UMKM & Warung Kelontong',
  'Toko Elektronik & Gadget',
  'Bengkel & Sparepart',
  'Toko Bangunan & Material',
  'Jasa, Laundry & Barbershop',
];

export const AddTerminalModal: React.FC<AddTerminalModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  nextIndex,
}) => {
  const [name, setName] = useState(`KASIR ${String(nextIndex).padStart(2, '0')}`);
  const [code, setCode] = useState(`POS-${String(nextIndex).padStart(2, '0')}`);
  const [terminalType, setTerminalType] = useState<'FRONT_END' | 'BACK_END'>('FRONT_END');
  const [businessModel, setBusinessModel] = useState('Ritel & Toko Modern');
  const [location, setLocation] = useState('Area Kasir Baru');
  const [subLabel, setSubLabel] = useState('Terminal Kasir Tambahan');
  const [selectedColor, setSelectedColor] = useState(NEON_PRESETS[0].colorHex);
  const [isLocked, setIsLocked] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: name.trim() || (terminalType === 'BACK_END' ? `TERMINAL ${nextIndex}` : `KASIR ${nextIndex}`),
      code: code.trim() || `POS-${nextIndex}`,
      terminalType,
      businessModel: terminalType === 'BACK_END' && businessModel === 'Ritel & Toko Modern' ? 'Input Produk & Katalog Master' : businessModel,
      subLabel: subLabel.trim() || (terminalType === 'BACK_END' ? 'Panel Input Produk Back-End' : businessModel),
      location: location.trim() || (terminalType === 'BACK_END' ? 'Admin / Back-Office' : 'Kasir'),
      colorHex: selectedColor,
      neonBorderClass: `border-[${selectedColor}]`,
      neonBgClass: `bg-[${selectedColor}]/10`,
      neonTextClass: `text-[${selectedColor}]`,
      isActive: false,
      isLocked,
      activeOrdersToday: 0,
    });
    onClose();
  };

  return (
    <div
      id="modal-add-terminal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
    >
      <div className="w-full max-w-lg bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-2xl text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#21262d] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: `${selectedColor}20`,
              borderColor: `${selectedColor}60`,
              color: selectedColor,
            }}
          >
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Tambah Terminal Kasir Baru</h3>
            <p className="text-xs text-[#8b949e]">
              Daftarkan pos kasir baru dengan tema neon dan profil model bisnis JacS ERP
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Nama Terminal</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#0052FF] px-3 py-2 rounded-xl text-white outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Kode Register POS</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#0052FF] px-3 py-2 rounded-xl text-white outline-none font-mono"
              />
            </div>
          </div>

          {/* 1. Field Pilihan Tipe Terminal (Kasir Front-End / Input Produk Back-End) */}
          <div>
            <label className="block text-gray-300 font-semibold mb-1.5">
              Tipe Terminal <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                  terminalType === 'FRONT_END'
                    ? 'border-[#0052FF] bg-[#0052FF]/15 text-white shadow-sm'
                    : 'border-[#30363d] bg-[#0d1117] text-gray-400 hover:text-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="terminalType"
                  value="FRONT_END"
                  checked={terminalType === 'FRONT_END'}
                  onChange={() => {
                    setTerminalType('FRONT_END');
                    if (name.includes('TERMINAL') || name.includes('INPUT')) {
                      setName(`KASIR ${String(nextIndex).padStart(2, '0')}`);
                    }
                  }}
                  className="accent-[#0052FF]"
                />
                <div>
                  <span className="font-bold block text-xs">Kasir (Front-End)</span>
                  <span className="text-[10px] text-gray-400 block">Transaksi &amp; cetak struk</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                  terminalType === 'BACK_END'
                    ? 'border-amber-500 bg-amber-500/15 text-white shadow-sm'
                    : 'border-[#30363d] bg-[#0d1117] text-gray-400 hover:text-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="terminalType"
                  value="BACK_END"
                  checked={terminalType === 'BACK_END'}
                  onChange={() => {
                    setTerminalType('BACK_END');
                    if (name.startsWith('KASIR')) {
                      setName(`TERMINAL ${String(nextIndex).padStart(2, '0')} (BACK-END)`);
                    }
                    setSelectedColor('#f59e0b');
                  }}
                  className="accent-amber-500"
                />
                <div>
                  <span className="font-bold block text-xs">Input Produk (Back-End)</span>
                  <span className="text-[10px] text-gray-400 block">Katalog master &amp; stok</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1">Model Bisnis & Spesialisasi</label>
            <select
              value={businessModel}
              onChange={(e) => setBusinessModel(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#0052FF] px-3 py-2 rounded-xl text-white outline-none"
            >
              {BUSINESS_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Lokasi Kasir / Pos</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                placeholder="cth. Lantai 1 / Lobby Barat"
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#0052FF] px-3 py-2 rounded-xl text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Sub-Keterangan Singkat</label>
              <input
                type="text"
                value={subLabel}
                onChange={(e) => setSubLabel(e.target.value)}
                placeholder="cth. Fast Track / Barcode"
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#0052FF] px-3 py-2 rounded-xl text-white outline-none"
              />
            </div>
          </div>

          {/* Neon Palette Color Selector */}
          <div>
            <label className="block text-gray-300 font-semibold mb-2">
              Pilihan Pendaran Warna Neon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {NEON_PRESETS.map((p) => {
                const isSelected = selectedColor === p.colorHex;
                return (
                  <button
                    key={p.colorHex}
                    type="button"
                    onClick={() => setSelectedColor(p.colorHex)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                      isSelected
                        ? 'border-white bg-[#21262d] shadow-md scale-105'
                        : 'border-[#30363d] bg-[#0d1117] hover:border-gray-500'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: p.colorHex,
                        boxShadow: `0 0 10px ${p.colorHex}`,
                      }}
                    />
                    <span className="text-[9px] text-gray-400 truncate w-full text-center">
                      {p.label.replace('Neon ', '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initial Lock state */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div>
              <span className="font-semibold text-gray-200 block">Kunci Terminal saat Dibuat</span>
              <span className="text-[11px] text-gray-400">
                Membutuhkan otorisasi Super Admin sebelum digunakan
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsLocked(!isLocked)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                isLocked
                  ? 'bg-rose-500 text-white'
                  : 'bg-[#21262d] text-gray-400 hover:text-white'
              }`}
            >
              {isLocked ? 'TERKUNCI' : 'BUKA'}
            </button>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl font-bold bg-[#21262d] hover:bg-[#30363d] text-gray-300 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 rounded-xl font-bold bg-[#0052FF] hover:bg-[#0043d1] text-white shadow-[0_0_15px_rgba(0,82,255,0.4)] transition cursor-pointer"
            >
              Simpan Terminal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
