import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Terminal,
  Activity,
  Award,
  Lock,
  Cloud,
  Database,
  Store,
  Boxes,
  CreditCard,
  ShoppingBag,
  Users,
  Briefcase,
  LayoutDashboard,
  KeyRound,
  FileText,
  BadgeCheck,
  ShieldAlert,
} from 'lucide-react';

interface AboutSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
  language?: 'id' | 'en';
  onOpenSop?: () => void;
  onOpenSuperAdmin?: () => void;
}

export const AboutSystemModal: React.FC<AboutSystemModalProps> = ({
  isOpen,
  onClose,
  isLight = false,
  language = 'id',
  onOpenSop,
  onOpenSuperAdmin,
}) => {
  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isEn = language === 'en';

  const modalContent = (
    <div
      id="modal-about-system-portal"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl relative my-auto animate-in zoom-in-95 duration-200 overflow-hidden ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
            : 'bg-[#161b22] border-[#30363d] text-[#e6edf3] shadow-[0_20px_60px_rgba(0,0,0,0.9)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Background Glow */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-cyan-600/20 via-blue-600/10 to-transparent pointer-events-none" />

        {/* Modal Header & Close Button (Top Right) */}
        <div className="flex items-center justify-between p-6 sm:p-7 border-b border-gray-700/20 dark:border-gray-800 relative z-10 shrink-0">
          <div className="flex items-center gap-4">
            {/* 3D High-Res Brand Logo */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 rounded-2xl blur-md opacity-50 group-hover:opacity-80 transition duration-300" />
              <div
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center p-2 border shadow-lg ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-slate-200'
                    : 'bg-[#0d1117] border-cyan-500/40 shadow-[0_0_20px_rgba(0,82,255,0.3)]'
                }`}
              >
                <img
                  src="/logo-jacs-enterprise.png"
                  alt="JacS Enterprise Logo"
                  className="w-full h-full object-contain aspect-square select-none drop-shadow-[0_2px_8px_rgba(0,82,255,0.5)]"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith('logo-jacs-enterprise.png')) {
                      target.src = '/logo-jacs-enterprise.png';
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>OFFICIAL DEVELOPER EDITION</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  v4.2 ENTERPRISE
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300">
                  KHANSA SWALAYAN
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight leading-tight">
                <span className="text-[#0052FF] dark:text-[#38BDF8]">Jac</span>
                <span className="text-[#FF7A00]">S</span>{' '}
                <span>RetailOS ERP Enterprise</span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${
              isLight
                ? 'hover:bg-slate-100 border-slate-300 text-slate-500 hover:text-slate-900'
                : 'hover:bg-[#21262d] border-slate-700 text-gray-400 hover:text-white'
            }`}
            title={isEn ? 'Close Modal (Esc)' : 'Tutup Modal (Esc)'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-7 text-xs relative z-10 scrollbar-thin">
          {/* 1. NARASI & PENJELASAN APLIKASI */}
          <div
            className={`p-5 rounded-2xl border leading-relaxed space-y-2.5 ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-[#0d1117] border-cyan-500/20 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-cyan-400 shrink-0" />
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                JacS RetailOS ERP Enterprise — Sistem Manajemen Ritel Terpadu (Khansa Swalayan)
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
              <strong>JacS RetailOS ERP Enterprise</strong> adalah sistem operasi manajemen ritel terpadu generasi mutakhir yang dikonfigurasikan khusus untuk mendukung ekosistem operasional <strong>Khansa Swalayan</strong>. Sistem ini mengintegrasikan seluruh lini bisnis—mulai dari terminal kasir ritel berkecepatan tinggi, tata kelola stok gudang dan resep (BOM), pengadaan terstandarisasi, rekonsiliasi keuangan akuntansi berbasis <em>3-Way Matching</em>, pengelolaan SDM &amp; jaminan sosial BPJS, hingga telemetri eksekutif analitik dalam satu arsitektur terdesentralisasi yang aman, modular, dan handal.
            </p>
          </div>

          {/* 2. PENJELASAN FUNGSI 8 MODUL UTAMA YANG BERJALAN */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Penjelasan Fungsi 8 Modul Utama Sistem
                </h4>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/25 font-bold">
                8 MODUL TERINTEGRASI
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Modul 1: Dashboard */}
              <div
                className={`p-4 rounded-2xl border space-y-1.5 transition ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d1117] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-cyan-500 text-xs">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>1. Executive Dashboard</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Pusat telemetri realtime yang menyajikan KPI pendapatan kotor (Gross Revenue), perolehan laba bersih (Net Profit Margin), rasio likuiditas arus kas (Cash Inflow), grafik kecepatan finansial (OPEX vs Omset), dan komposisi kesehatan stok gudang.
                </p>
              </div>

              {/* Modul 2: Master Data Canonical */}
              <div
                className={`p-4 rounded-2xl border space-y-1.5 transition ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d1117] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-amber-500 text-xs">
                  <Database className="w-4 h-4 shrink-0" />
                  <span>2. Master Data Management</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Basis data kanonikal terpusat untuk katalog SKU produk, multi-barcode unik, manajemen kategori departemen ritel, satuan UOM, penetapan harga bertingkat (grosir/ritel), serta pendaftaran rekanan supplier dan pelanggan resmi.
                </p>
              </div>

              {/* Modul 3: Executive */}
              <div
                className={`p-4 rounded-2xl border space-y-1.5 transition ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d1117] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-emerald-500 text-xs">
                  <Briefcase className="w-4 h-4 shrink-0" />
                  <span>3. Eksekutif &amp; Manajerial</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Modul otorisasi pengambil keputusan untuk memvalidasi Purchase Order bernilai tinggi (&gt; Rp 20.000.000,-), menetapkan ambang batas stok darurat, persetujuan diskon/promosi khusus, dan pemantauan audit trail tata kelola perusahaan.
                </p>
              </div>

              {/* Modul 4: HR & Personalia */}
              <div
                className={`p-4 rounded-2xl border space-y-1.5 transition ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d1117] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-cyan-400 text-xs">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>4. SDM &amp; Personalia (HR &amp; Payroll)</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Pengelolaan biodata staf dan jadwal shift, presensi mandiri (Clock-In/Clock-Out), pengajuan cuti tahunan (12 hari), perhitungan BPJS Kesehatan (1%+4%) &amp; Ketenagakerjaan (3%+6.24%), serta penerbitan slip gaji payroll bulanan.
                </p>
              </div>

              {/* Modul 5: Finance & Accounting */}
              <div
                className={`p-4 rounded-2xl border space-y-1.5 transition ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d1117] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-blue-500 text-xs">
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>5. Keuangan &amp; Akuntansi (Finance)</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Pencatatan Jurnal Umum otomatis, Buku Besar (General Ledger), neraca saldo, rekonsiliasi kas register kasir (Z-Report), audit kepatuhan 3-Way Matching, penagihan piutang (AR), dan jadwal pembayaran hutang supplier (AP).
                </p>
              </div>

              {/* Modul 6: Purchasing */}
              <div
                className={`p-4 rounded-2xl border space-y-1.5 transition ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d1117] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-amber-400 text-xs">
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>6. Pengadaan &amp; Pembelian (Purchasing)</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Otomatisasi pengadaan mulai dari Purchase Requisition (PR) berdasarkan sinyal Reorder Point gudang, penerbitan Purchase Order (PO) resmi vendor, negosiasi harga pokok, dan penetapan termin pembayaran (Tempo, COD, CBD).
                </p>
              </div>

              {/* Modul 7: Warehouse & Logistics */}
              <div
                className={`p-4 rounded-2xl border space-y-1.5 transition ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d1117] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-purple-400 text-xs">
                  <Boxes className="w-4 h-4 shrink-0" />
                  <span>7. Gudang &amp; Inventori (Warehouse)</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Penerimaan fisik barang (Goods Receipt), penataan rak (Bin Location), pelabelan barcode &amp; expired, pemotongan otomatis bahan baku resep (Bill of Materials - BOM), dan pelaporan penyesuaian berkala (Stock Opname).
                </p>
              </div>

              {/* Modul 8: Point of Sale (POS) */}
              <div
                className={`p-4 rounded-2xl border space-y-1.5 transition ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d1117] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-orange-400 text-xs">
                  <Store className="w-4 h-4 shrink-0" />
                  <span>8. Penjualan &amp; Kasir Multi-Terminal (POS)</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Mesin kasir ritel multi-terminal dengan verifikasi buka register modal awal, pemindaian barcode cepat, perhitungan diskon/kupon, cetak struk thermal 80mm, multi-pembayaran (Tunai, QRIS dinamis, Kartu EDC), dan komisi kasir 1%.
                </p>
              </div>

              {/* Modul Tambahan: Super Admin Developer */}
              <div
                className={`p-4 rounded-2xl border space-y-1.5 transition md:col-span-2 ${
                  isLight ? 'bg-pink-50/50 border-pink-200' : 'bg-pink-950/20 border-pink-500/30'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-pink-400 text-xs">
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span>Konsol Pusat: Super Admin &amp; Developer Gateway</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Konsol kendali keamanan tertinggi untuk reset kredensial PIN seluruh karyawan, aktivasi Global Maintenance Mode, profiling badan usaha, monitoring terminal kasir aktif, migrasi data CSV/Excel, dan diagnosis integritas database.
                </p>
              </div>
            </div>
          </div>

          {/* 3. SPESIFIKASI TEKNIS & ARSITEKTUR SISTEM */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Spesifikasi Teknis &amp; Arsitektur Sistem
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Pillar 1 */}
              <div
                className={`p-4 rounded-2xl border space-y-2 transition ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                  Real-time Telemetry
                </h5>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Pipa transaksi nol-latensi berbasis arsitektur reaktif lokal (local-first) dengan pembaruan otomatis status stok, buku kas, dan telemetri KPI tanpa perlu refresh manual.
                </p>
              </div>

              {/* Pillar 2 */}
              <div
                className={`p-4 rounded-2xl border space-y-2 transition ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                  Independent Module Lock
                </h5>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Setiap modul ber-password memiliki status penguncian mandiri dan validasi PIN terpisah (PIN default: 1234), menjamin pemisahan wewenang (Segregation of Duties).
                </p>
              </div>

              {/* Pillar 3 */}
              <div
                className={`p-4 rounded-2xl border space-y-2 transition ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <Cloud className="w-4 h-4" />
                </div>
                <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                  Cloud Sync &amp; Resilience
                </h5>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Dukungan integrasi webhook Cloud Spreadsheet, persistensi aman browser localStorage, pencadangan otomatis berkala, dan perekaman audit trail komprehensif.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Clear Close Button */}
        <div className="p-4 sm:p-6 border-t border-gray-700/20 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <span>&copy; {new Date().getFullYear()} JacS Studio &amp; Enterprise Solutions. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onOpenSuperAdmin && (
              <button
                type="button"
                id="btn-about-open-super-admin"
                onClick={() => {
                  onClose();
                  onOpenSuperAdmin();
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                title={isEn ? 'Open Super Admin & System Config' : 'Buka Konsol Super Admin & Konfigurasi Sistem'}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-pink-400" />
                <span>{isEn ? 'Super Admin & Config' : 'Konsol Super Admin'}</span>
              </button>
            )}

            {onOpenSop && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSop();
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Lihat Panduan SOP</span>
              </button>
            )}

            {/* Tombol Tutup Utama */}
            <button
              type="button"
              id="btn-close-about-modal"
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/25 transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Tutup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
