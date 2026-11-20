import React from 'react';
import { useApp } from '../../context/AppContext';
import { Terminal } from '../../types';
import {
  ShoppingCart,
  UtensilsCrossed,
  HardHat,
  Shirt,
  Pill,
  Smartphone,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Monitor,
} from 'lucide-react';

interface SuperAdminMaintenanceProps {
  onBackToOverview?: () => void;
}

export const SuperAdminMaintenance: React.FC<SuperAdminMaintenanceProps> = () => {
  const {
    terminals,
    setActiveTerminal,
    setActiveNav,
    setIsCashierWorkspaceActive,
    theme,
    showToast,
  } = useApp();

  const isLight = theme === 'light';

  const posHubItems = [
    {
      id: 'T-01',
      title: 'POS 01: Retail & Modern Wholesaler',
      subtitle: 'Minimarket, Toko Kelontong & Grosir',
      desc: 'Kasir retail modern lengkap dengan multi-tier pricing, barcode scanner & manajemen stok.',
      icon: ShoppingCart,
      color: 'from-cyan-500 to-blue-600',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      terminalId: 'T-01',
    },
    {
      id: 'T-02',
      title: 'POS 02: Food & Beverage (F&B Resto / Cafe)',
      subtitle: 'Restoran, Cafe, Kopi & Food Court',
      desc: 'Loket F&B dengan mode menu foto grid, cetak tiket dapur KOT, meja & modifikasi rasa.',
      icon: UtensilsCrossed,
      color: 'from-amber-500 to-orange-600',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      terminalId: 'T-02',
    },
    {
      id: 'T-03',
      title: 'POS 03: Pharmacy & Healthcare',
      subtitle: 'Apotek, Obat Resep & Klinik',
      desc: 'Pencatatan resep dokter (signa), nomor batch, tanggal expired & obat keras.',
      icon: Pill,
      color: 'from-rose-500 to-red-600',
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      terminalId: 'T-03',
    },
    {
      id: 'T-04',
      title: 'POS 04: Fashion & Boutiques',
      subtitle: 'Butik Pakaian, Sepatu & Aksesoris',
      desc: 'Varian ukuran (S/M/L/XL), pilihan warna, tag harga & barcode varian.',
      icon: Shirt,
      color: 'from-fuchsia-500 to-pink-600',
      badgeColor: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/40',
      terminalId: 'T-04',
    },
    {
      id: 'T-05',
      title: 'POS 05: Building & Hardware Depot',
      subtitle: 'Bahan Bangunan & Material Curah',
      desc: 'Penjualan semen, besi, pipa, cat, armada multi-ret & satuan fraksi berat/meteran.',
      icon: HardHat,
      color: 'from-emerald-500 to-teal-600',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      terminalId: 'T-05',
    },
    {
      id: 'T-06',
      title: 'POS 06: Electronics & Workshop',
      subtitle: 'Elektronik, Gawai & Servis Bengkel',
      desc: 'Scan nomor seri IMEI, kartu garansi elektronik & estimasi biaya servis bengkel.',
      icon: Smartphone,
      color: 'from-violet-500 to-purple-600',
      badgeColor: 'bg-violet-500/20 text-violet-400 border-violet-500/40',
      terminalId: 'T-06',
    },
  ];

  const handleLaunchTerminal = (terminalId: string, terminalName: string) => {
    const targetTerminal = terminals.find((t) => t.id === terminalId) || {
      id: terminalId,
      name: `KASIR ${terminalId.replace('T-', '')}`,
      code: `POS-${terminalId.replace('T-', '')}`,
      colorHex: '#0052FF',
      neonBorderClass: 'border-blue-500',
      neonBgClass: 'bg-blue-500/10',
      neonTextClass: 'text-blue-500',
      businessModel: terminalName,
      location: terminalName,
      isActive: true,
      activeOrdersToday: 0,
      isLocked: false,
    };
    setActiveTerminal({ ...targetTerminal, isLocked: false });
    localStorage.setItem('jacs_super_admin_preview', 'true');
    localStorage.setItem('jacs_preview_terminal_id', terminalId);
    setIsCashierWorkspaceActive(true);
    setActiveNav('pos');
    showToast(`Super Admin Preview Mode: Membuka ${terminalName} secara instan!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in font-sans">
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border relative overflow-hidden transition-all duration-200 ${
        isLight
          ? 'bg-gradient-to-r from-slate-900 to-blue-950 text-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.18)]'
          : 'bg-gradient-to-r from-[#161b22] to-[#0d1117] text-white border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
      }`}>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
          <Monitor className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-medium uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Super Admin Central Command Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-medium tracking-wide">
            POS Terminal Launcher (Direct Access)
          </h2>
          <p className="text-xs sm:text-sm font-normal tracking-wide text-gray-300 max-w-2xl leading-relaxed">
            Buka dan uji coba seluruh terminal kasir multi-industri secara instan langsung dari konsol Super Admin tanpa perlu proses logout atau ganti akun kasir.
          </p>
        </div>
      </div>

      {/* POS Multi-Module Launcher Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {posHubItems.map((item) => {
          const IconComp = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => handleLaunchTerminal(item.terminalId, item.title)}
              className={`rounded-2xl border p-5 transition-all duration-200 cursor-pointer group flex flex-col justify-between hover:scale-[1.01] ${
                isLight
                  ? 'bg-white border-cyan-500/65 shadow-[0_0_14px_rgba(6,182,212,0.14)] hover:border-cyan-500 hover:shadow-[0_0_22px_rgba(6,182,212,0.28)]'
                  : 'bg-[#161b22] border-cyan-500/30 shadow-[0_0_14px_rgba(6,182,212,0.08)] hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.18)]'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium uppercase tracking-widest border ${item.badgeColor}`}>
                    {item.id}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium text-sm sm:text-base tracking-wide group-hover:text-cyan-500 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] font-medium tracking-wide text-gray-400">
                    {item.subtitle}
                  </p>
                  <p className="text-xs font-normal tracking-wide text-gray-500 dark:text-gray-400 pt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-[#30363d] flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-wide text-cyan-600 dark:text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Luncurkan Terminal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
