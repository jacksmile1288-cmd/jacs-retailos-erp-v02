import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveNavModule } from '../../types';
import { QuickAuthModal } from '../auth/QuickAuthModal';
import { getReactiveNeonGlowStyle } from '../../utils/neonGlow';
import { DIVISIONS_TRANSLATIONS } from '../../utils/translations';
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
    title: 'Eksekutif & Manajerial (Executive & Managerial)',
    subTitle: 'KPI, Margin & Antrean Persetujuan (KPI, Margin & Approval Queue)',
    colorHex: '#10B981',
    icon: Briefcase,
    summary:
      'Pusat kendali manajerial untuk pemantauan metrik pendapatan, analisis profitabilitas produk, KPI & performa kerja karyawan, serta antrean persetujuan (Approval Queue) pengadaan bernilai besar.',
    objectives: [
      'Memantau Gross Profit Margin perusahaan secara realtime berdasarkan perbandingan harga jual dan HPP modal.',
      'Meninjau performa dan kontribusi pendapatan masing-masing kasir dan terminal kerja.',
      'Mengotorisasi permohonan pengadaan barang (PR) dan pembukaan akses pengguna baru.',
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
      'Pusat manajemen sumber daya manusia (SDM), direktori personil lengkap lintas departemen ERP, log presensi shift kerja realtime, serta sistem pengajuan dan otorisasi tiket cuti, izin & sakit.',
    objectives: [
      'Mengelola direktori identitas personil (NIP, foto/avatar, jabatan, kontak, status kontrak).',
      'Mencatat dan memonitor aktivitas presensi shift harian (Clock In / Out) serta ketepatan waktu.',
      'Memproses pengajuan tiket cuti tahunan, izin sakit, dan pelacak kuota sisa cuti secara otomatis.',
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
      'Pengelolaan likuiditas keuangan komprehensif mencakup rekonsiliasi Kas & Bank, penagihan Piutang Usaha (AR), penjadwalan Hutang Vendor (AP), General Ledger otomatis, dan proyeksi arus kas operasional.',
    objectives: [
      'Memastikan rekonsiliasi penerimaan kas dari seluruh terminal POS cocok dengan rekening koran bank.',
      'Mengelola jatuh tempo invoice supplier agar terbayar tepat waktu tanpa mengganggu likuiditas kas.',
      'Menjaga kepatuhan pajak (PPN 11%) dan akurasi pencatatan jurnal debit/kredit General Ledger.',
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
      'Mencegah kekosongan persediaan (Out of Stock) dengan pengadaan tepat waktu berbasis data stok kritis.',
      'Mendapatkan harga pokok pembelian (Cost Price) terbaik melalui evaluasi berkala terhadap kinerja supplier.',
      'Mencatat dokumen Purchase Order yang terhubung langsung ke pencatatan stok dan hutang usaha.',
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
      'Manajemen fisik barang di gudang, penataan rak dan zonasi SKU, pemantauan status stok (Good, Warning, Critical), pencatatan mutasi antar-lokasi, stock opname fisik, serta proses picking & packing.',
    objectives: [
      'Menjamin akurasi 100% antara jumlah fisik barang di rak penyimpanan dengan angka stok pada sistem database.',
      'Mendeteksi dan memperingatkan stok yang mendekati batas minimum (Warning Restock < 10 unit).',
      'Mengatur alur barang masuk (Inbound) dan barang keluar (Outbound) secara rapi dan terdokumentasi.',
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
      'Garda depan transaksi ritel berkecepatan tinggi dengan 6 Bar Neon Terminal independen, pemindaian barcode hardware USB/Bluetooth, diskon & PPN 11%, multi-metode pembayaran, dan cetak struk thermal 80mm.',
    objectives: [
      'Menyajikan proses transaksi checkout yang cepat, responsif, dan akurat kepada pelanggan.',
      'Mendukung operasional multi-kasir secara simultan melalui 6 terminal neon berstatus realtime.',
      'Secara otomatis memotong saldo stok produk dan mencatat riwayat transaksi ke database DB_Sales.',
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

// Array 6 kartu divisi operasional Beranda (modulesList)
export const modulesList = ROLE_MODULES;

export 
  const handleDivisionClick = (division: any) => {
    // 1. Belum login -> Minta PIN
      if (typeof openAuthModal === 'function') openAuthModal(division.tabKey || division.id);
      return;
    }
    // 2. Owner & Superadmin -> Bebas akses
    const isSuper = currentUser.role === 'owner' || currentUser.role === 'superadmin';
    if (isSuper || currentUser.role === division.roleKey || currentUser.role === division.id) {
      if (typeof setActiveTab === 'function') setActiveTab(division.tabKey || division.id);
    } else {
      alert('Akses Terkunci: Akun Anda tidak memiliki wewenang untuk membuka divisi ini.');
    }
  };
const HomeModule: React.FC = () => {
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

  // QuickAuthModal state untuk proteksi pembukaan modul divisi
  const [pendingNav, setPendingNav] = useState<ActiveNavModule | null>(null);
  const [pendingNavTitle, setPendingNavTitle] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isSuperAdmin = Boolean(
    isSuperAdminAuthenticated || activeUser?.role === 'Super Admin'
  );

  const isModuleLockedForUser = (modId: string) => {
    if (['home', 'dashboard', 'pos', 'executive', 'hr', 'finance', 'purchasing', 'warehouse'].includes(modId)) return false;
    return !isModuleUnlocked(modId);
  };

  const handleOpenModule = (targetId: string, targetName: string) => {
    // Seluruh modul utama (Executive, HR, Finance, Purchasing, Warehouse, POS, Home, Dashboard) terbuka langsung tanpa gembok
    if (['home', 'dashboard', 'pos', 'executive', 'hr', 'finance', 'purchasing', 'warehouse', 'admin', 'master_data'].includes(targetId)) {
      setActiveNav(targetId as ActiveNavModule);
      return;
    }

    setPendingNav(targetId as ActiveNavModule);
    setPendingNavTitle(targetName);
    setIsAuthModalOpen(true);
  };

  const activeDivisionInfo =
    DIVISIONS_TRANSLATIONS[language][activeRole.id] || {
      name: activeRole.title,
      sub: activeRole.subTitle,
      desc: activeRole.summary,
    };

  // Handle clicking a neon card: activate neon glow AND open comprehensive detail modal
  const handleCardClick = (role: RoleModuleData) => {
    setActiveNeonCard('home', role.id);
    setIsDetailModalOpen(true);
  };

  return (
    <div id="home-module-container" className="w-full max-w-[1360px] mx-auto flex flex-col space-y-4 xl:space-y-5">
      {/* 1. DYNAMIC STORE BRANDING & OPERATIONAL HEADER */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition duration-200 flex items-start sm:items-center justify-between gap-4 ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        {(() => {
          const companyName =
            (businessProfile as any)?.companyName?.trim() ||
            businessProfile?.name?.trim() ||
            'KHANSA SWALAYAN';
          const companyAddress =
            businessProfile?.address?.trim() ||
            'Jl. BERUA RAYA No. 1, Paccerakkang, Makassar';

          return (
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              {businessProfile?.logoUrl ? (
                <img
                  src={businessProfile.logoUrl}
                  alt={companyName}
                  className="w-12 h-12 object-contain rounded-xl border border-slate-700/50 bg-slate-800/40 p-1 shrink-0 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                  {companyName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mt-0.5 mb-2">
                  <div className="bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>
                      {isEn
                        ? '6 Core Operational Divisions'
                        : '6 Divisi Operasional Terpadu'}
                    </span>
                  </div>
                  <span className="bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs px-2.5 py-1 rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                    {businessProfile?.category || (isEn ? 'Modern Retail & Multi-Industry' : 'Ritel Modern & Multi-Industry')}
                  </span>
                </div>
                <h1
                  className={`text-xl sm:text-2xl font-black tracking-tight ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                  style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
                >
                  {companyName}
                </h1>
                <p className="text-slate-900 font-extrabold text-xs mt-0.5 dark:text-white">Jl. BERUA RAYA</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 2. KARTU BAR NEON INTERAKTIF BERBEDA WARNA DENGAN HOVER GLOW REACTIVE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 xl:gap-4">
        {ROLE_MODULES.map((role) => {
          const Icon = role.icon;
          const isSelected = activeRole.id === role.id;
          const isHovered = hoveredRoleId === role.id;
          const activeStyle = getReactiveNeonGlowStyle(role.colorHex, isSelected, isHovered, isLight);
          const divisionInfo =
            DIVISIONS_TRANSLATIONS[language][role.id] || {
              name: role.title,
              sub: role.subTitle,
              desc: role.summary,
            };

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
              className="group relative p-4 xl:p-5 rounded-2xl text-left transition-all duration-150 ease-out cursor-pointer overflow-hidden flex flex-col justify-between h-full min-h-[165px] xl:min-h-[185px] focus:outline-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
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
                {/* Icon & Gembok Terkunci (Tanpa Badge Angka 01-06) */}
                <div className="flex items-center justify-between w-full pt-0.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shrink-0"
                      style={{
                        backgroundColor: `${role.colorHex}20`,
                        border: `1px solid ${role.colorHex}45`,
                      }}
                    >
                      <Icon
                        className="w-4 h-4 xl:w-5 xl:h-5"
                        style={{ color: role.colorHex }}
                      />
                    </div>
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
                  <h3
                    className="text-base xl:text-lg font-semibold leading-snug transition-colors line-clamp-1"
                    style={{
                      color: isSelected ? role.colorHex : isLight ? '#0F172A' : '#e6edf3',
                    }}
                  >
                    {divisionInfo.name}
                  </h3>
                  <p className="text-slate-900 font-bold text-xs mt-1 dark:text-slate-200">{mod.description}</p>
                </div>
              </div>

              {/* Bottom Action Links: Selalu rata di dasar kartu */}
              <div className="w-full pt-2.5 xl:pt-3 mt-2.5 xl:mt-3 border-t border-slate-200 dark:border-gray-700/30 flex items-center justify-between text-xs xl:text-sm">
                <span className="text-slate-500 font-mono text-[11px] dark:text-slate-400">
                  {isEn ? 'Operational Juklak & SOP' : 'Juklak & SOP Operasional'}
                </span>
                <button
                  type="button"
                  id={`btn-home-view-sop-${role.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(role);
                  }}
                  className="text-cyan-600 hover:text-cyan-700 font-bold dark:text-cyan-400 dark:hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer py-0.5"
                  title={isEn ? 'View Juklak & SOP Guidelines' : 'Lihat Juklak & SOP Operasional'}
                >
                  <span className="hover:underline">{isEn ? 'Open Module' : 'Buka Modul'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
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
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${activeRole.colorHex}25`,
                    border: `1.5px solid ${activeRole.colorHex}60`,
                    boxShadow: `0 0 16px ${activeRole.colorHex}40`,
                  }}
                >
                  {React.createElement(activeRole.icon, {
                    className: 'w-6 h-6',
                    style: { color: activeRole.colorHex },
                  })}
                </div>
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

            {/* Quick Switch Pills between the 6 Roles inside modal */}
            <div
              className={`px-4 sm:px-6 py-2 border-b flex gap-1.5 overflow-x-auto text-xs ${
                isLight ? 'border-slate-200 bg-white' : 'border-[#30363d] bg-[#0d1117]'
              }`}
            >
              {ROLE_MODULES.map((r) => {
                const active = r.id === activeRole.id;
                const rInfo = DIVISIONS_TRANSLATIONS[language][r.id] || { name: r.title };
                return (
                  <button
                    key={r.id}
                    onClick={() => setActiveNeonCard('home', r.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                      active
                        ? 'text-white font-bold shadow-sm'
                        : isLight
                        ? 'text-slate-600 hover:bg-slate-100'
                        : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]'
                    }`}
                    style={{
                      backgroundColor: active ? r.colorHex : 'transparent',
                    }}
                  >
                    <span className="font-mono text-[10px]">{r.order}</span>
                    <span>{rInfo.name}</span>
                  </button>
                );
              })}
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

              {/* 2. SOP Alur Kerja Terstruktur */}
              <div className="space-y-2.5">
                <h4
                  className={`text-xs uppercase font-bold tracking-wider flex items-center gap-1.5 ${
                    isLight ? 'text-slate-900' : 'text-gray-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4" style={{ color: activeRole.colorHex }} />
                  <span>Standard Operating Procedure (SOP) Langkah Kerja</span>
                </h4>
                <div className="space-y-2">
                  {activeRole.sopSteps.map((step) => (
                    <div
                      key={step.step}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 transition ${
                        isLight
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-[#0d1117] border-[#30363d]'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-xs"
                        style={{
                          backgroundColor: `${activeRole.colorHex}25`,
                          color: activeRole.colorHex,
                          border: `1px solid ${activeRole.colorHex}45`,
                        }}
                      >
                        {step.step}
                      </div>
                      <div>
                        <h5
                          className="font-bold text-xs sm:text-sm"
                          style={{ color: activeRole.colorHex }}
                        >
                          {step.title}
                        </h5>
                        <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#8b949e]'}`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Relasi Sinkronisasi Database */}
              <div className="space-y-2">
                <h4
                  className={`text-xs uppercase font-bold tracking-wider flex items-center gap-1.5 ${
                    isLight ? 'text-slate-900' : 'text-gray-200'
                  }`}
                >
                  <Database className="w-4 h-4 text-[#00f2fe]" />
                  <span>Integrasi Data Google Sheets & Modul Lain</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeRole.dataIntegration.map((integ, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border ${
                        isLight
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-[#0d1117] border-[#30363d]'
                      }`}
                    >
                      <div className="font-mono font-bold text-xs text-cyan-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        {integ.target}
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#8b949e]'}`}>
                        {integ.desc}
                      </p>
                    </div>
                  ))}
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
                  className="px-3.5 py-2 rounded-xl text-gray-400 hover:text-white transition cursor-pointer"
                >
                  {isEn ? 'Close' : 'Tutup'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenModule(activeRole.id, activeDivisionInfo.name);
                    if (isSuperAdmin) {
                      setIsDetailModalOpen(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-slate-950 font-bold cursor-pointer shadow-md transition hover:brightness-110 flex items-center gap-1.5"
                  style={{ backgroundColor: activeRole.colorHex }}
                >
                  {['executive', 'hr', 'finance', 'warehouse', 'purchasing'].includes(activeRole.id) && !isSuperAdmin && (
                    <Lock className="w-4 h-4 text-slate-950 shrink-0" />
                  )}
                  <span>{isEn ? `Open ${activeDivisionInfo.name}` : `Buka Modul ${activeDivisionInfo.name}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Otorisasi Ringkas Akses Modul */}
      <QuickAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingNav(null);
        }}
        onSuccess={() => {
          if (pendingNav) {
            unlockModule(pendingNav);
            setActiveNav(pendingNav);
            setPendingNav(null);
          }
          setIsAuthModalOpen(false);
          setIsDetailModalOpen(false);
        }}
        moduleTitle={pendingNavTitle}
        targetModule={pendingNav || undefined}
        requireMasterPassword={pendingNav === 'admin'}
        subtitle={
          pendingNav === 'admin'
            ? (isEn
                ? 'PIN (1234) or Master Password to access Super Admin'
                : 'Masukkan PIN (1234) atau Sandi Master Super Admin')
            : isEn
            ? `Enter PIN (1234) to access ${pendingNavTitle}`
            : `Masukkan PIN (1234) untuk mengakses ${pendingNavTitle}`
        }
      />
    </div>
  );
};

export default HomeModule;
