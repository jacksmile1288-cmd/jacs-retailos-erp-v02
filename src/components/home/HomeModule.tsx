import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveNavModule } from '../../types';
import { getReactiveNeonGlowStyle } from '../../utils/neonGlow';
import { getDivisionTranslation } from '../../utils/translations';
import {
  Users,
  Briefcase,
  CreditCard,
  ShoppingBag,
  Boxes,
  Store,
  X,
  Layers,
  CheckCircle2,
  ChevronRight,
  Info,
  Sparkles,
  ArrowRight,
  Database,
  BookOpen,
  Lock,
} from 'lucide-react';

interface RoleModuleData {
  id: string;
  order: string;
  title: string;
  subTitle: string;
  colorHex: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  summary: string;
  objectives: string[];
  sopSteps: { step: number; title: string; desc: string }[];
  dataIntegration: { target: string; desc: string }[];
}

const ROLE_MODULES: RoleModuleData[] = [
  {
    id: 'executive',
    order: '01',
    title: 'Eksekutif & Manajemen (Executive & Management)',
    subTitle: 'KPI, Analitik & Otorisasi',
    colorHex: '#10B981',
    icon: Briefcase,
    summary:
      'Pusat kendali operasional untuk konsolidasi omzet & laba bersih multi-cabang, otorisasi persetujuan belanja modal (PO bernilai tinggi), serta audit fisik kas laci kasir & deteksi anomali cabang.',
    objectives: [
      'Konsolidasi omzet & laba bersih multi-cabang realtime.',
      'Otorisasi persetujuan belanja modal (PO bernilai tinggi).',
      'Audit fisik kas laci kasir & deteksi anomali cabang.',
    ],
    sopSteps: [
      {
        step: 1,
        title: 'Monitoring Dashboard Strategis',
        desc: 'Menganalisis tren penjualan harian, pergerakan produk terlaris (Top Sellers), dan komposisi margin kotor setiap kategori.',
      },
      {
        step: 2,
        title: 'Tinjauan Antrean Approval (Queue)',
        desc: 'Memeriksa formulir Purchase Request (PR) yang diajukan departemen Purchasing. Melakukan persetujuan (Approve) atau penolakan dengan catatan resmi.',
      },
      {
        step: 3,
        title: 'Evaluasi KPI & Efisiensi Shift',
        desc: 'Memantau kecepatan transaksi kasir, rata-rata nilai belanja (Basket Size), dan akurasi rekonsiliasi kas tiap staf.',
      },
      {
        step: 4,
        title: 'Audit Keamanan & Hak Akses',
        desc: 'Mengontrol penerbitan kredensial dan hak wewenang akses akun pengguna di lingkungan JacS ERP.',
      },
    ],
    dataIntegration: [
      { target: 'DB_Sales', desc: 'Agregasi omzet kotor, laba bersih, dan metrik performa kasir harian.' },
      { target: 'DB_Purchasing', desc: 'Otorisasi dokumen pengadaan barang dan kontrol batas anggaran belanja.' },
    ],
  },
  {
    id: 'hr',
    order: '02',
    title: 'SDM & Personalia (Human Resources)',
    subTitle: 'Staf, Presensi & Cuti (Staff, Attendance & Leave)',
    colorHex: '#00f2fe',
    icon: Users,
    summary:
      'Pusat manajemen sumber daya manusia (SDM), direktori personil lintas divisi, log presensi shift kerja realtime, serta sistem pengajuan dan otorisasi tiket cuti, izin & sakit.',
    objectives: [
      'Mengelola direktori identitas personil & jabatan.',
      'Mencatat dan memonitor aktivitas presensi shift harian.',
      'Memproses pengajuan tiket cuti, izin, dan pelacak kuota cuti secara otomatis.',
    ],
    sopSteps: [
      {
        step: 1,
        title: 'Registrasi & Penugasan Shift Karyawan',
        desc: 'Mendaftarkan staf baru dengan NIP resmi, menetapkan departemen, shift kerja, dan jatah kuota cuti tahunan.',
      },
      {
        step: 2,
        title: 'Pencatatan Presensi Shift Operasional',
        desc: 'Karyawan melakukan Clock In pada awal shift dan Clock Out saat jam operasional selesai via terminal JacS.',
      },
      {
        step: 3,
        title: 'Pengajuan & Validasi Tiket Cuti/Izin',
        desc: 'Staf mengajukan permohonan izin/cuti dan atasan/HR menyetujui secara digital dengan pemotongan kuota instan.',
      },
      {
        step: 4,
        title: 'Rekapitulasi Kehadiran & Audit Kedisiplinan',
        desc: 'Mengevaluasi laporan presensi periodik sebagai dasar evaluasi kinerja dan kepatuhan jam kerja operasional.',
      },
    ],
    dataIntegration: [
      { target: 'DB_Employees', desc: 'Arsip identitas staf, jabatan divisi, status kontrak, dan saldo kuota cuti.' },
      { target: 'DB_Attendance', desc: 'Log presensi realtime, status tepat waktu / terlambat, dan stempel jam kerja.' },
    ],
  },
  {
    id: 'finance',
    order: '03',
    title: 'Keuangan & Akuntansi (Finance & Accounting)',
    subTitle: 'Kas, AP/AR & Arus Kas (Cash, AP/AR & Cash Flow)',
    colorHex: '#f59e0b',
    icon: CreditCard,
    summary:
      'Pengelolaan likuiditas keuangan komprehensif, mencakup rekonsiliasi kas & bank, penagihan piutang usaha (AR), penjadwalan hutang vendor (AP), neraca konsolidasi, dan arus kas.',
    objectives: [
      'Rekonsiliasi kas & bank realtime.',
      'Manajemen jatuh tempo hutang vendor.',
      'Laporan laba-rugi & neraca konsolidasi.',
    ],
    sopSteps: [
      {
        step: 1,
        title: 'Rekonsiliasi Kas Harian (Cash & Bank)',
        desc: 'Mencocokkan penerimaan tunai, QRIS dinamis, EDC debit/kredit, dan transfer bank dari transaksi kasir dengan mutasi bank riil.',
      },
      {
        step: 2,
        title: 'Manajemen Piutang Usaha (AR)',
        desc: 'Memantau umur piutang (Aging AR) dari pelanggan grosir/B2B dan menerbitkan reminder penagihan sebelum jatuh tempo.',
      },
      {
        step: 3,
        title: 'Jadwal Pelunasan Hutang Vendor (AP)',
        desc: 'Memvalidasi tagihan Purchase Order supplier yang telah berstatus diterima dan memproses pelunasan berdasarkan skala prioritas.',
      },
      {
        step: 4,
        title: 'Penutupan Jurnal & Cash Flow Analysis',
        desc: 'Memeriksa keseimbangan saldo debit/kredit pada buku besar (General Ledger) serta mengevaluasi arus kas 30 hari.',
      },
    ],
    dataIntegration: [
      { target: 'DB_Sales', desc: 'Sumber data penerimaan penjualan realtime dan perhitungan PPN 11%.' },
      { target: 'DB_Purchasing', desc: 'Pencatatan kewajiban hutang dagang (Accounts Payable) invoice supplier.' },
    ],
  },
  {
    id: 'purchasing',
    order: '04',
    title: 'Pengadaan Barang',
    subTitle: 'Pengajuan, Pesanan Pembelian & Penerimaan Barang',
    colorHex: '#f43f5e',
    icon: ShoppingBag,
    summary:
      'Tata kelola pengadaan barang dagangan, manajemen relasi vendor terdaftar, penerbitan Purchase Order resmi, evaluasi ketepatan suplai, dan pencatatan penerimaan fisik barang.',
    objectives: [
      'Pengadaan barang restock otomatis.',
      'Verifikasi PO & Persetujuan Direksi.',
      'Evaluasi kinerja & harga vendor.',
    ],
    sopSteps: [
      {
        step: 1,
        title: 'Pembuatan Purchase Request (PR)',
        desc: 'Menginput permohonan pengadaan barang restock berdasarkan rekomendasi stok minimum dari divisi gudang.',
      },
      {
        step: 2,
        title: 'Eskalasi Persetujuan Pimpinan',
        desc: 'Mengajukan dokumen PR ke antrean approval manajer untuk verifikasi kelayakan anggaran.',
      },
      {
        step: 3,
        title: 'Penerbitan Purchase Order (PO)',
        desc: 'Mengirimkan PO resmi kepada supplier terpilih dengan rincian kuantitas, harga neto, dan estimasi waktu kirim.',
      },
      {
        step: 4,
        title: 'Konfirmasi Penerimaan Barang (Receive)',
        desc: 'Memverifikasi kesesuaian fisik kiriman supplier dengan PO, lalu menekan tombol terima barang untuk memperbarui stok sistem.',
      },
    ],
    dataIntegration: [
      { target: 'DB_Purchasing', desc: 'Arsip nomor PO, tanggal terbit, nama supplier, item pesanan, dan total nilai.' },
      { target: 'DB_Products', desc: 'Pembaruan otomatis jumlah stok fisik barang saat pesanan tiba.' },
    ],
  },
  {
    id: 'warehouse',
    order: '05',
    title: 'Gudang & Inventori (Warehouse & Inventory)',
    subTitle: 'SKU, Mutasi & Stok Opname (SKU, Stock Movement & Stock Opname)',
    colorHex: '#8b5cf6',
    icon: Boxes,
    summary:
      'Manajemen fisik barang di gudang, penataan rak dan zonasi SKU, pemantauan status stok, pencatatan mutasi antar-lokasi, stock opname fisik, serta proses picking & packing.',
    objectives: [
      'Manajemen fisik barang & zonasi SKU.',
      'Audit stock opname fisik & selisih.',
      'Monitoring stok kritis & barang masuk.',
    ],
    sopSteps: [
      {
        step: 1,
        title: 'Pemeriksaan Barang Masuk (Inbound)',
        desc: 'Mencocokkan kondisi fisik kemasan dan label barcode kiriman dari supplier dengan surat jalan dan lembar PO.',
      },
      {
        step: 2,
        title: 'Penempatan & Mutasi Rak',
        desc: 'Menata barang pada rak gudang atau memindahkan ke display rak kasir dengan mencatat perpindahan di log mutasi.',
      },
      {
        step: 3,
        title: 'Pelaksanaan Stock Opname Berkala',
        desc: 'Menghitung fisik barang mingguan/bulanan. Bila terdapat selisih, buat laporan penyesuaian (Stock Adjustment).',
      },
      {
        step: 4,
        title: 'Picking & Packing Pesanan',
        desc: 'Mengambil barang pesanan sesuai daftar register dan memverifikasi barcode sebelum diserahterimakan.',
      },
    ],
    dataIntegration: [
      { target: 'DB_Products', desc: 'Master katalog barang, saldo stok terkini, dan status peringatan restock.' },
      { target: 'DB_Inventory', desc: 'Pencatatan riwayat kartu stok (Stock In, Stock Out, dan Saldo Akhir).' },
    ],
  },
  {
    id: 'pos',
    order: '06',
    title: 'Kasir & Penjualan (POS)',
    subTitle: 'Transaksi Kasir & Cetak Struk Penjualan',
    colorHex: '#ff7a00',
    icon: Store,
    summary:
      'Garda depan transaksi ritel berkecepatan tinggi dengan 6 Bar Neon Terminal independen, pemindaian barcode, PPN 11%, multi-metode pembayaran, dan cetak struk thermal.',
    objectives: [
      'Pemrosesan transaksi kasir cepat.',
      'Multi-metode pembayaran (QRIS/EDC).',
      'Cetak struk & pemotongan stok otomatis.',
    ],
    sopSteps: [
      {
        step: 1,
        title: 'Login PIN & Pemilihan Terminal',
        desc: 'Kasir memasukkan 4-digit PIN operator pribadi dan mengaktifkan salah satu dari 6 Bar Neon terminal kerja.',
      },
      {
        step: 2,
        title: 'Input Barang via Barcode Scanner',
        desc: 'Arahkan scanner ke label produk. Sistem otomatis mendeteksi buffer ketikan scanner dan menambah item ke keranjang dengan nada beep.',
      },
      {
        step: 3,
        title: 'Penerapan Diskon & Pajak (PPN 11%)',
        desc: 'Terapkan diskon nominal atau persentase bila ada promo, dan aktifkan toggle PPN 11% sesuai ketentuan transaksi.',
      },
      {
        step: 4,
        title: 'Pembayaran & Cetak Struk',
        desc: 'Pilih metode pembayaran (Tunai, QRIS, EDC, Transfer). Klik Proses Transaksi untuk mencetak struk thermal 80mm.',
      },
    ],
    dataIntegration: [
      { target: 'DB_Sales', desc: 'Pencatatan nomor nota, kasir penginput, terminal, rincian barang, dan total nominal.' },
      { target: 'DB_Products', desc: 'Pemotongan stok barang langsung secara instan saat transaksi selesai.' },
    ],
  },
];

interface HomeModuleProps {
  onLoginSuccess?: (user: any) => void;
}

// Array 6 kartu divisi operasional Beranda (modulesList)
export const modulesList = ROLE_MODULES;

const HomeModule: React.FC<HomeModuleProps> = ({ onLoginSuccess }) => {
  const {
    theme,
    language,
    activeNeonCards,
    setActiveNeonCard,
    setActiveNav,
    businessProfile,
    activeUser,
    isSuperAdminAuthenticated,
    setIsSuperAdminAuthenticated,
    isModuleUnlocked,
    unlockModule,
    setSuperAdminTab,
    showToast,
  } = useApp();
  const [hoveredRoleId, setHoveredRoleId] = useState<string | null>(null);

  const isLight = theme === 'light';
  const isEn = language === 'en';

  // Active role selected for interactive neon glow & detail modal dialog (persisted across modules)
  const activeRoleId = activeNeonCards['home'] || 'executive';
  const activeRole = ROLE_MODULES.find((r) => r.id === activeRoleId) || ROLE_MODULES[0];
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const isSuperAdmin = Boolean(
    isSuperAdminAuthenticated || activeUser?.role === 'Super Admin'
  );

  const isModuleLockedForUser = (modId: string) => {
    if (['home', 'dashboard', 'pos', 'executive', 'hr', 'finance', 'purchasing', 'warehouse'].includes(modId)) return false;
    return !isModuleUnlocked(modId);
  };

  const handleOpenModule = (targetId: string, targetName: string) => {
    if (onLoginSuccess) {
      const defaultUser = {
        id: targetId,
        name: targetName,
        role: targetId === 'executive' ? 'Manager' : targetId === 'pos' ? 'Kasir' : 'Staff',
        division: targetId,
      };
      onLoginSuccess(defaultUser);
      return;
    }

    setActiveNav(targetId as ActiveNavModule);
  };

  const activeDivisionInfo = getDivisionTranslation(language, activeRole.id, {
    name: activeRole.title,
    sub: activeRole.subTitle,
    desc: activeRole.summary,
  });

  // Handle clicking a neon card: activate neon glow AND open comprehensive detail modal
  const handleCardClick = (role: RoleModuleData) => {
    setActiveNeonCard('home', role.id);
    setIsDetailModalOpen(true);
  };

  
  const handleOpenDivisionModule = (division: any) => {
    const tabMap: Record<string, string> = {
      'executive': 'executive',
      'hr': 'hr',
      'finance': 'finance',
      'purchasing': 'purchasing',
      'warehouse': 'warehouse',
      'pos': 'pos'
    };
    const targetTab = tabMap[division.id] || division.id;
    setActiveNav(targetTab as any);
  };

  const handleEnterDivision = (division: any) => {
    handleOpenDivisionModule(division);
  };

  const handleDivisionAuthAccess = (division: any) => {
    handleOpenDivisionModule(division);
  };

  return (
    <div id="home-module-container" className="min-h-full bg-slate-100 dark:bg-slate-950 p-6 transition-colors w-full max-w-[1360px] mx-auto flex flex-col space-y-4 xl:space-y-5">
      {/* 1. DYNAMIC STORE BRANDING & OPERATIONAL HEADER */}
      <div
        className={`relative overflow-hidden transition duration-200 flex items-start sm:items-center justify-between gap-4 ${
          isLight
            ? 'bg-transparent border-0 shadow-none p-0'
            : 'rounded-2xl p-4 sm:p-5 bg-slate-900 border-2 border-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <img
            src="/logo-jacs-enterprise.png"
            alt="JacS Enterprise"
            className="w-8 h-8 object-contain"
          />
          <div className="flex flex-col min-w-0">
            <h1
              className={`font-bold text-xs tracking-wide ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              JacS Enterprise
            </h1>
            <p className="text-[9px] text-slate-600 dark:text-slate-400">Enterprise Software Solution &amp; Technology</p>
          </div>
        </div>
      </div>

      {/* 2. KARTU BAR NEON INTERAKTIF BERBEDA WARNA DENGAN HOVER GLOW REACTIVE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 xl:gap-4">
        {ROLE_MODULES.map((role) => {
          const Icon = role.icon;
          const isSelected = activeRole.id === role.id;
          const isHovered = hoveredRoleId === role.id;
          const activeStyle = getReactiveNeonGlowStyle(role.colorHex, isSelected, isHovered, isLight);
          const divisionInfo = getDivisionTranslation(language, role.id, {
            name: role.title,
            sub: role.subTitle,
            desc: role.summary,
          });

          const isLocked = isModuleLockedForUser(role.id);
          const mod = { description: divisionInfo.sub };

          return (
            <div
              key={role.id}
              id={`neon-card-role-${role.id}`}
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick(role)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(role);
                }
              }}
              onMouseEnter={() => setHoveredRoleId(role.id)}
              onMouseLeave={() => setHoveredRoleId(null)}
              style={activeStyle}
              className="group relative p-4 xl:p-5 rounded-2xl text-left transition-all duration-150 ease-out cursor-pointer overflow-hidden flex flex-col justify-between h-full min-h-[165px] xl:min-h-[185px] focus:outline-hidden bg-white dark:bg-slate-900 dark:border-slate-800"
            >
              {/* Top Accent Neon Bar Strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-150 ease-out"
                style={{
                  backgroundColor: role.colorHex,
                  boxShadow: !isLight && (isSelected || isHovered) ? `0 0 16px ${role.colorHex}` : 'none',
                }}
              />

              {/* Upper Content Group */}
              <div className="w-full space-y-2.5 xl:space-y-3">
                {/* Icon Solid Tanpa Border Box */}
                <div className="flex items-center justify-between w-full pt-0.5">
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className="w-7 h-7 xl:w-8 xl:h-8 shrink-0 transition-transform duration-200 group-hover:scale-110"
                      style={{ color: role.colorHex }}
                    />
                    {isLocked && (
                      <span
                        className="bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 dark:bg-amber-950 dark:text-amber-300"
                        title={isEn ? 'Requires Super Admin authorization' : 'Terkunci - Wajib Otorisasi Super Admin'}
                      >
                        <Lock className="w-3 h-3 text-amber-900 dark:text-amber-300 shrink-0 stroke-[2.5]" />
                        <span>{isEn ? 'LOCKED' : 'KUNCI'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Clean Role Title & Sub-judul */}
                <div className="space-y-1">
                  <h3 className="text-base xl:text-lg font-bold leading-snug line-clamp-1 text-slate-900 dark:text-white">
                    {divisionInfo.name}
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 font-medium text-xs mt-1 leading-snug">{mod.description}</p>
                </div>
              </div>

                {/* Bottom Action Info: Non-interactive Operational */}
                <div className="w-full pt-2.5 xl:pt-3 mt-2.5 xl:mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs xl:text-sm">
                </div>
            </div>
          );
        })}
      </div>

      {/* 3. MODAL DETAIL POP-UP (COMPREHENSIVE FUNGSI & SOP OPERASIONAL) */}
      {isDetailModalOpen && (
        <div
          id="role-detail-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div
            className={`relative w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900'
                : 'bg-[#161b22] border-[#30363d] text-[#e6edf3]'
            }`}
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: `0 0 40px ${activeRole.colorHex}30, 0 20px 40px rgba(0,0,0,0.6)`,
            }}
          >
            {/* Modal Neon Top Strip */}
            <div
              className="h-1.5 w-full"
              style={{
                backgroundColor: activeRole.colorHex,
                boxShadow: `0 0 16px ${activeRole.colorHex}`,
              }}
            />

            {/* Modal Header */}
            <div
              className={`p-5 sm:p-6 border-b flex items-start justify-between gap-4 ${
                isLight ? 'border-slate-200 bg-slate-50' : 'border-[#30363d] bg-[#12161c]'
              }`}
            >
              <div className="flex items-center gap-3.5">
                {React.createElement(activeRole.icon, {
                  className: 'w-8 h-8 shrink-0 drop-shadow-xs',
                  style: { color: activeRole.colorHex },
                })}
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${activeRole.colorHex}20`,
                        color: activeRole.colorHex,
                        border: `1px solid ${activeRole.colorHex}40`,
                      }}
                    >
                      {isEn ? 'DIVISION' : 'DIVISI'} {activeRole.order}
                    </span>
                    <span className="text-xs text-[#8b949e]">JacS ERP Ecosystem</span>
                  </div>
                  <h2
                    className="text-lg sm:text-xl font-black tracking-tight mt-0.5"
                    style={{ color: activeRole.colorHex }}
                  >
                    {activeDivisionInfo.name}
                  </h2>
                  <p className="text-slate-800 font-bold text-xs mt-1 dark:text-slate-200">{activeDivisionInfo.sub}</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                id="btn-close-role-modal"
                onClick={() => setIsDetailModalOpen(false)}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isLight
                    ? 'border-slate-300 hover:bg-slate-200 text-slate-600'
                    : 'border-[#30363d] hover:bg-[#21262d] text-gray-400 hover:text-white'
                }`}
                title={isEn ? 'Close Dialog' : 'Tutup Dialog'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>


            {/* Modal Body (Scrollable) */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm leading-relaxed">
              {/* Ringkasan Peran */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  borderColor: `${activeRole.colorHex}35`,
                  backgroundColor: `${activeRole.colorHex}10`,
                }}
              >
                <div className="flex items-center gap-2 font-bold mb-1 text-xs sm:text-sm" style={{ color: activeRole.colorHex }}>
                  <Info className="w-4 h-4" />
                  <span>Ikhtisar Fungsi & Tanggung Jawab Utama</span>
                </div>
                <p className={isLight ? 'text-slate-700' : 'text-[#e6edf3]'}>
                  {activeRole.summary}
                </p>
              </div>

              {/* 1. Target & Tujuan Divisi */}
              <div className="space-y-2.5">
                <h4
                  className={`text-xs uppercase font-bold tracking-wider flex items-center gap-1.5 ${
                    isLight ? 'text-slate-900' : 'text-gray-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Target Kinerja & Tujuan Operasional</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {activeRole.objectives.map((obj, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-start gap-2 ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-[#0d1117] border-[#30363d] text-[#8b949e]'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5"
                        style={{
                          backgroundColor: `${activeRole.colorHex}20`,
                          color: activeRole.colorHex,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <p className="text-xs leading-normal">{obj}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. SOP & Panduan Operasional */}
              <div className="space-y-4">
                <h4 className={`text-xs uppercase font-bold tracking-wider ${isLight ? 'text-slate-900' : 'text-gray-200'}`}>
                  Panduan Operasional & Prosedur
                </h4>
                <div className="space-y-4">
                   <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <h5 className="font-bold text-sm mb-2" style={{color: activeRole.colorHex}}>Prosedur Operasional Standar (SOP)</h5>
                    <ul className="text-xs list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                      {activeRole.sopSteps.map(step => <li key={step.step}><strong>{step.title}:</strong> {step.desc}</li>)}
                    </ul>
                   </div>
                   <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <h5 className="font-bold text-sm mb-2" style={{color: activeRole.colorHex}}>Panduan Teknis & Fitur</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Gunakan fitur utama melalui dashboard {activeRole.title}. Pastikan data diinput secara akurat pada setiap periode kerja untuk menjamin validitas pelaporan.</p>
                   </div>
                   <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
                    <h5 className="font-bold text-sm mb-2 text-rose-700 dark:text-rose-400">Keamanan & Kepatuhan</h5>
                    <p className="text-xs text-rose-800/70 dark:text-rose-200/70">Segera laporkan anomali sistem, selisih kas, atau ketidaksesuaian data ke pimpinan eksekutif. Hindari manipulasi data tanpa otorisasi sistem.</p>
                   </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div
              className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
                isLight ? 'border-slate-200 bg-slate-50' : 'border-[#30363d] bg-[#12161c]'
              }`}
            >
              <span className="text-[#8b949e]">
                JacS ERP Standard Operating Procedure • {isEn ? 'Division' : 'Divisi'} {activeRole.order} ({activeDivisionInfo.name})
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer shadow-sm"
                >
                  {isEn ? 'Close Guide' : 'Tutup Panduan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeModule;