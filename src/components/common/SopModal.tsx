import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { getReactiveNeonGlowStyle } from '../../utils/neonGlow';
import { DIVISIONS_TRANSLATIONS } from '../../utils/translations';
import {
  BookOpen,
  X,
  Search,
  Users,
  Store,
  CreditCard,
  ShoppingBag,
  Boxes,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  PhoneCall,
  ArrowRightLeft,
  ShieldCheck,
} from 'lucide-react';
import { JacSLogo } from './JacSLogo';

interface SopItem {
  title: string;
  flow: string[];
  rules: string[];
  integrations: string[];
}

interface SopDivision {
  id: string;
  code: string;
  name: string;
  navKey: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  sopList: SopItem[];
}

const SOP_DATA: SopDivision[] = [
  {
    id: 'executive',
    code: '01',
    name: 'Eksekutif & Manajerial (Executive & Managerial)',
    navKey: 'executive',
    icon: Briefcase,
    color: '#10B981',
    sopList: [
      {
        title: 'SOP Monitoring KPI, Margin Profitabilitas & Antrean Otorisasi (Approval Queue)',
        flow: [
          'Monitoring Dashboard KPI Harian: Memantau metrik performa omset, gross revenue, net profit margin, dan efisiensi operasional harian secara realtime.',
          'Tinjauan Margin Kotor & Margin Bersih: Menganalisis rasio margin kotor (Gross Margin) dan margin bersih (Net Margin) per kategori barang serta efisiensi belanja lintas divisi.',
          'Otorisasi Antrean (Approval Queue) Lintas Divisi: Meninjau dan memproses permohonan bernilai besar atau berisiko tinggi (Purchase Order di atas limit, mutasi stok khusus, dan permohonan cuti manajerial).',
          'Audit Kepatuhan & Keputusan Strategis: Mengevaluasi log audit trail seluruh departemen guna memastikan akuntabilitas operasional dan tata kelola perusahaan.',
        ],
        rules: [
          'Kebijakan Penolakan (Reject Policy): Setiap tindakan penolakan (Reject) atas dokumen pengajuan wajib menyertakan audit memo tertulis dan alasan objektif pada sistem.',
          'Otorisasi Tertinggi Dokumen Bernilai Kritis: Pembelian barang bernilai di atas ambang batas (contoh: PO > Rp 10.000.000,-) wajib disetujui Direksi/Manager sebelum Purchase Order dapat dikirim ke vendor.',
        ],
        integrations: [
          'Otorisasi Purchase Order Bernilai Tinggi (Divisi 04 Purchasing): Memberikan persetujuan berjenjang atas dokumen PO pengadaan sebelum diproses ke rekanan vendor.',
          'Approval Mutasi Stok Khusus & Stock Adjustment (Divisi 05 Warehouse): Otorisasi penyesuaian selisih stok material hasil stock opname berkala.',
          'Sinkronisasi Target Finansial & Dividen (Divisi 03 Finance): Menyelaraskan target margin profitabilitas dengan realisasi laporan arus kas dan neraca keuangan.',
        ],
      },
    ],
  },
  {
    id: 'hr',
    code: '02',
    name: 'SDM & Personalia (Human Resources)',
    navKey: 'hr',
    icon: Users,
    color: '#00f2fe',
    sopList: [
      {
        title: 'SOP Siklus Data Karyawan, Presensi Shift & Pengajuan Cuti',
        flow: [
          'Onboarding Data Staf: Registrasi NIP resmi karyawan, kelengkapan biodata, penetapan jabatan departemen, status kontrak, dan penetapan jadwal shift kerja.',
          'Jadwal Shift & Presensi Harian: Karyawan wajib melakukan Clock-In paling lambat 10 menit sebelum jam shift dimulai dan Clock-Out saat serah terima/jam operasional selesai via terminal JacS.',
          'Pengajuan & Approval Tiket Cuti/Izin/Sakit: Pengajuan cuti tahunan, izin darurat, atau sakit diajukan via modul HR (melampirkan surat dokter jika >1 hari), diverifikasi dan disetujui berjenjang oleh atasan langsung.',
          'Rekapitulasi Presensi Bulanan: Sistem merekapitulasi akumulasi jam kerja, kedisiplinan, keterlambatan, dan pemotongan otomatis saldo kuota cuti tahunan untuk evaluasi berkala.',
          'Administrasi Penggajian & BPJS: Menghitung slip gaji, menerapkan skema potongan BPJS Kesehatan (1%) & Ketenagakerjaan (3%), serta mengalokasikan kontribusi perusahaan (Kesehatan 4% & Naker 6.24%) sebelum sinkronisasi jurnal ke modul Keuangan.',
        ],
        rules: [
          'Presensi mandiri bersifat mutlak (Single Identity & Anti-titip Absen Policy) menggunakan kredensial terotentikasi.',
          'Pengajuan cuti tahunan terencana wajib diajukan minimal H-3 sebelum tanggal cuti efektif.',
          'Maksimal kuota cuti tahunan aktif adalah 12 hari kerja per periode kalender berjalan.',
          'Kepatuhan Iuran Jaminan Sosial (BPJS): Perusahaan mengikutsertakan seluruh personil aktif dalam BPJS Kesehatan dan Ketenagakerjaan. Pegawai dengan status Opt-Out menerima Gaji Bersih utuh tanpa potongan jaminan sosial.',
        ],
        integrations: [
          'Validasi Kehadiran Kasir (Divisi 06 POS): Memverifikasi bahwa kasir telah Clock-In resmi pada shift aktif sebelum register pembukaan laci kasir kas POS dapat diakses.',
          'Transfer Rekapitulasi Presensi ke Payroll (Divisi 03 Finance): Mengirimkan data log kehadiran, total jam kerja, jam lembur, dan potongan keterlambatan ke Finance untuk kalkulasi penggajian bulanan.',
          'Sinkronisasi Jurnal Penggajian & BPJS (Divisi 03 Finance): Mengirimkan entri Beban Gaji Karyawan, Beban Iuran Perusahaan, dan Hutang Kas Iuran BPJS ke buku besar Keuangan secara terintegrasi.',
        ],
      },
    ],
  },
  {
    id: 'finance',
    code: '03',
    name: 'Keuangan & Akuntansi (Finance & Accounting)',
    navKey: 'finance',
    icon: CreditCard,
    color: '#0052FF',
    sopList: [
      {
        title: 'SOP Rekonsiliasi Kas Register, Manajemen AP/AR, Jurnal & Neraca',
        flow: [
          'Rekonsiliasi Kas Register Harian: Mencocokkan setoran uang fisik dari laci kasir POS dengan laporan Z-Report sistem, mutasi rekening bank, dan settlement transaksi digital QRIS/EDC.',
          'Pencatatan Account Payable (AP) & Account Receivable (AR): Menjadwalkan jatuh tempo hutang usaha supplier PO serta menagih piutang penjualan tempo pelanggan tepat waktu.',
          'Penjurnalan Kas & Bank Otomatis: Memposting jurnal transaksi operasional harian ke Buku Besar (General Ledger) dengan pemetaan akun debit/kredit yang presisi.',
          'Pembukuan Jurnal Penggajian & BPJS: Menerima sinkronisasi jurnal penggajian dari HR, membukukan Beban Gaji Karyawan, Beban BPJS Perusahaan, serta mencatat kewajiban setoran iuran pada Accounts Payable.',
          'Penyusunan Laporan Arus Kas & Neraca: Mengompilasi Laporan Arus Kas (Cash Flow Statement), Laba Rugi (Profit & Loss), serta Neraca Keuangan (Balance Sheet) berkala.',
        ],
        rules: [
          'Kepatuhan Verifikasi 3-Way Matching: Sebelum pembayaran tagihan supplier dicairkan, Finance wajib memvalidasi kecocokan data antara (1) Purchase Order dari Purchasing, (2) Surat Penerimaan Barang (Goods Receipt) dari Warehouse, dan (3) Faktur Tagihan Asli (Invoice) dari Supplier.',
          'Pengeluaran kas di atas Rp 5.000.000,- wajib melalui transfer rekening bank resmi perusahaan dan dilampiri dokumen Payment Voucher yang telah disetujui.',
          'Penyetoran Iuran BPJS Karyawan: Tagihan AP untuk BPJS Ketenagakerjaan & Kesehatan wajib disetorkan paling lambat tanggal 15 setiap bulan kalender berjalan.',
        ],
        integrations: [
          'Penerimaan Settlement Kasir POS (Divisi 06 POS): Menerima rekapitulasi setoran kas fisik harian dan audit selisih kas akhir shift.',
          'Verifikasi 3-Way Matching Tagihan (Divisi 04 Purchasing & 05 Warehouse): Validasi silang data PO dan bukti penerimaan fisik gudang untuk pembayaran faktur vendor.',
          'Penerimaan Rekap Kehadiran Payroll (Divisi 02 Human Resources): Menerima rekap kehadiran bulanan untuk pencairan gaji dan potongan absensi.',
          'Penerimaan Jurnal Payroll & BPJS (Divisi 02 Human Resources): Mengimpor otomatis Beban Gaji (Take Home Pay), Beban BPJS Perusahaan, dan Hutang Iuran ke Kas & Bank serta Invoices Due.',
        ],
      },
    ],
  },
  {
    id: 'purchasing',
    code: '04',
    name: 'Pengadaan & Pembelian (Purchasing)',
    navKey: 'purchasing',
    icon: ShoppingBag,
    color: '#F59E0B',
    sopList: [
      {
        title: 'SOP Purchase Requisition (PR), Penerbitan PO & Manajemen Vendor',
        flow: [
          'Purchase Requisition (PR): Menerima permohonan pembelian inventori berdasarkan analisis kebutuhan stok atau notifikasi restock otomatis dari gudang.',
          'Penerbitan Purchase Order (PO): Menyusun lembar PO resmi kepada supplier terverifikasi lengkap dengan rincian SKU, spesifikasi, dan kuantitas barang.',
          'Verifikasi Kesesuaian Harga & Termin Bayar (TOP): Menegosiasikan harga modal kompetitif, diskon kuantitas, dan Terms of Payment (Tempo / COD / CBD) dengan vendor.',
          'Pengiriman Dokumen PO ke Warehouse: Mendistribusikan tembusan lembar PO ke tim gudang untuk persiapan proses penerimaan fisik (Receiving).',
        ],
        rules: [
          'Ambang Batas Otorisasi Dokumen: Purchase Order dengan nilai nominal melebihi ambang batas tertentu wajib memperoleh approval Executive / Manager sebelum diterbitkan ke vendor.',
          'Vendor Terverifikasi: Transaksi pengadaan hanya boleh dilakukan dengan rekanan supplier yang berstatus aktif dan lolos evaluasi kepatuhan perusahaan.',
        ],
        integrations: [
          'Menerima Sinyal Restock Otomatis (Divisi 05 Warehouse): Mengubah notifikasi batas minimum inventori (Low Stock Alert) menjadi draft PO pengadaan.',
          'Sinkronisasi Dokumen Receiving (Divisi 05 Warehouse): Mengirimkan salinan PO agar tim gudang dapat mencocokkan surat jalan vendor saat tiba.',
          'Pencatatan Buku Hutang Dagang (Divisi 03 Finance): Meneruskan salinan PO dan jadwal termin jatuh tempo kepada Finance untuk pencatatan Account Payable (AP).',
        ],
      },
    ],
  },
  {
    id: 'warehouse',
    code: '05',
    name: 'Gudang & Logistik (Warehouse & Logistics)',
    navKey: 'warehouse',
    icon: Boxes,
    color: '#8B5CF6',
    sopList: [
      {
        title: 'SOP Penerimaan Barang Masuk, Penataan Rak, BOM & Stock Opname',
        flow: [
          'Penerimaan Barang Masuk (Goods Receipt): Mencocokkan kondisi fisik kiriman barang supplier dengan lembar Purchase Order resmi dan Surat Jalan pengiriman.',
          'Penempatan Lokasi Rak & Tagging: Menempatkan barang pada bin location rak gudang, melabeli barcode, nomor batch, dan mencatat tanggal kadaluwarsa (Exp Date / IMEI).',
          'Stock Opname Berkala & Adjustment: Menghitung stok fisik secara berkala, membekukan mutasi sementara, dan membuat laporan penyesuaian (Adjustment) jika ditemukan selisih.',
          'Penerbitan Barang Keluar (Dispatch/Transfer): Mengeluarkan barang untuk restock rak pajang kasir POS atau pengiriman transfer antar-cabang.',
        ],
        rules: [
          'Barang rusak, cacat kemasan, atau mendekati kedaluwarsa wajib langsung dibuatkan Berita Acara Retur (BAP) dan dipisahkan ke area karantina barang.',
          'Penyesuaian stok (Stock Adjustment) bernilai material wajib mendapatkan persetujuan Head Warehouse dan Executive sebelum di-posting.',
        ],
        integrations: [
          'Notifikasi Batas Minimum Stok / Low Stock Alert (Divisi 04 Purchasing): Memberikan notifikasi otomatis ke Purchasing saat saldo stok menyentuh titik pemesanan ulang (Reorder Point / ROP).',
          'Pencatatan Pemotongan Bahan Baku (BOM): Mengurangi otomatis saldo bahan baku per formula/resep saat modul perakitan atau kasir F&B menjual item paket/menu racikan.',
          'Pengurangan Stok Realtime POS (Divisi 06 POS): Saldo stok barang di gudang/etalase otomatis terpangkas seketika saat kasir menyelesaikan transaksi penjualan.',
          'Tembusan Goods Receipt untuk 3-Way Matching (Divisi 03 Finance): Mengirimkan bukti penerimaan fisik barang ke Finance sebagai syarat pencairan tagihan supplier.',
        ],
      },
    ],
  },
  {
    id: 'pos',
    code: '06',
    name: 'Penjualan & Kasir (Point of Sale - POS)',
    navKey: 'pos',
    icon: Store,
    color: '#ff7a00',
    sopList: [
      {
        title: 'SOP Buka/Tutup Kasir, Transaksi Ritel, Struk & Rekonsiliasi Kas',
        flow: [
          'Buka Kasir (Shift Opening): Kasir login menggunakan PIN otorisasi pribadi, menghitung fisik pecahan uang modal kembalian di laci, dan memasukkan nominal modal awal ke sistem sebelum melayani penjualan.',
          'Transaksi Penjualan Ritel/Grosir: Scan barcode produk, pilih opsi diskon/kupon, dan tanyakan metode pembayaran (Tunai, QRIS Dinamis, Kartu Debit/Kredit).',
          'Cetak Struk Pembayaran: Mencetak struk thermal 80mm resmi dan menyerahkan lembar struk beserta barang belanjaan yang telah diperiksa kepada pembeli.',
          'Tutup Kasir (Shift Closing / End of Shift): Melakukan penghitungan fisik seluruh uang tunai di laci (Cash Drawer Reconciliation) dan mencocokkan dengan laporan rekapitulasi penjualan sistem (Z-Report).',
        ],
        rules: [
          'Kebijakan Zero Variance: Toleransi selisih kas fisik laci kasir adalah Rp 0,-. Selisih kas wajib diinvestigasi langsung bersama Supervisor Toko.',
          'Otorisasi Pembatalan (Void): Pembatalan item struk transaksi yang telah di-scan atau retur barang wajib memerlukan otorisasi PIN Supervisor Toko.',
          'Validasi Pembayaran Non-Tunai: Transaksi QRIS atau kartu EDC wajib dipastikan berstatus "BERHASIL / APPROVED" di layar kasir sebelum barang diserahkan ke pelanggan.',
        ],
        integrations: [
          'Pengurangan Stok Realtime Gudang (Divisi 05 Warehouse): Setiap item yang sukses dibayar langsung memotong saldo stok gudang secara otomatis tanpa jeda waktu.',
          'Penyerahan Rekapitulasi Kas & Settlement (Divisi 03 Finance): Menyerahkan laporan Z-Report fisik dan setoran kas harian kepada Finance untuk rekonsiliasi kas operasional.',
          'Validasi Kehadiran Karyawan (Divisi 02 Human Resources): Memvalidasi bahwa kasir yang bertugas telah melakukan Clock-In resmi di sistem HR sebelum modul kasir dapat diaktifkan.',
        ],
      },
    ],
  },
];

interface SopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SopModal: React.FC<SopModalProps> = ({ isOpen, onClose }) => {
  const { theme, language, setActiveNav } = useApp();
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('executive');
  const [hoveredDivisionId, setHoveredDivisionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const isLight = theme === 'light';
  const isEn = language === 'en';
  const selectedDivision = SOP_DATA.find((d) => d.id === selectedDivisionId) || SOP_DATA[0];
  const selectedDivisionName =
    DIVISIONS_TRANSLATIONS[language][selectedDivision.id]?.name || selectedDivision.name;

  const filteredSopList = selectedDivision.sopList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.flow.some((f) => f.toLowerCase().includes(q)) ||
      item.rules.some((r) => r.toLowerCase().includes(q)) ||
      item.integrations.some((int) => int.toLowerCase().includes(q))
    );
  });

  const modalContent = (
    <div
      id="sop-modal-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="sop-modal-dialog"
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#161b22] border-[#30363d] text-[#e6edf3]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between gap-4 ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-[#30363d] bg-[#0d1117]'
          }`}
        >
          <div className="flex items-center gap-3">
            <JacSLogo size="sm" imgOnly={true} className="drop-shadow-[0_2px_10px_rgba(0,82,255,0.45)]" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg tracking-tight">
                  {isEn ? 'Enterprise Info Center & SOP' : 'Pusat Informasi & SOP Enterprise'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-bold hidden sm:inline-block">
                  JacS ERP v4.2
                </span>
              </div>
              <p className="text-xs text-[#8b949e]">
                {isEn
                  ? 'Standard Operating Procedures, Workflows, Compliance & Integrations across 6 Divisions'
                  : 'Pedoman Operasional Standar, Alur Kerja, Regulasi Kepatuhan & Integrasi Lintas 6 Divisi JacS ERP'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-sop-modal"
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isLight
                ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                : 'hover:bg-[#21262d] text-gray-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Search & Division Pills Bar */}
        <div
          className={`p-3 sm:px-5 border-b space-y-3 ${
            isLight ? 'border-slate-200 bg-slate-50/50' : 'border-[#30363d] bg-[#12161c]'
          }`}
        >
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isEn
                  ? 'Search SOP, workflow, regulation, integration (e.g. 3-way matching, payroll, BOM, low stock, void, leave)...'
                  : 'Cari SOP, workflow, regulasi, integrasi (contoh: 3-way matching, payroll, BOM, low stock, void, cuti)...'
              }
              className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-hidden transition ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'
                  : 'bg-[#0d1117] border-[#30363d] text-white focus:border-blue-400'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Division Selector Tabs (Single Clean Language & Reactive Hover Glow) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {SOP_DATA.map((division) => {
              const Icon = division.icon;
              const isSelected = selectedDivisionId === division.id;
              const isHovered = hoveredDivisionId === division.id;
              const divName =
                DIVISIONS_TRANSLATIONS[language][division.id]?.name || division.name;
              const reactiveStyle = getReactiveNeonGlowStyle(
                division.color,
                isSelected,
                isHovered,
                isLight
              );

              return (
                <button
                  key={division.id}
                  type="button"
                  onClick={() => setSelectedDivisionId(division.id)}
                  onMouseEnter={() => setHoveredDivisionId(division.id)}
                  onMouseLeave={() => setHoveredDivisionId(null)}
                  style={reactiveStyle}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ease-out cursor-pointer border ${
                    isSelected
                      ? isLight
                        ? 'bg-white text-slate-900 font-bold'
                        : 'bg-[#161b22] text-white font-bold'
                      : isLight
                      ? 'bg-white/80 border-slate-200 text-slate-600 hover:text-slate-900'
                      : 'bg-[#0d1117] border-[#30363d] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: division.color }} />
                  <span>
                    {division.code} {divName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Active Division Summary Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: selectedDivision.color }}
              >
                {React.createElement(selectedDivision.icon, { className: 'w-5 h-5 text-slate-950' })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#8b949e]">
                    {isEn ? 'DIVISION' : 'DIVISI'} {selectedDivision.code}
                  </span>
                  <h4 className="font-bold text-sm sm:text-base">
                    {selectedDivisionName}
                  </h4>
                </div>
                <p className="text-xs text-[#8b949e]">
                  {isEn
                    ? 'Standard operational guidelines integrated with other JacS ERP divisions.'
                    : 'Pedoman kerja standar terintegrasi dengan divisi JacS ERP lainnya.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                setActiveNav(selectedDivision.navKey as any);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto hover:brightness-110"
              style={{
                backgroundColor: `${selectedDivision.color}20`,
                borderColor: `${selectedDivision.color}60`,
                color: selectedDivision.color,
              }}
            >
              <span>{isEn ? 'Access Module' : 'Akses Modul'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* SOP Cards List */}
          {filteredSopList.length === 0 ? (
            <div className="p-8 text-center border rounded-xl border-dashed border-gray-700/50 text-gray-400 text-xs">
              Tidak ada SOP yang cocok dengan kata kunci pencarian "{searchQuery}".
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSopList.map((sop, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition space-y-4 ${
                    isLight
                      ? 'bg-white border-slate-200 shadow-xs'
                      : 'bg-[#12161c] border-[#30363d]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono text-slate-950 shrink-0"
                      style={{ backgroundColor: selectedDivision.color }}
                    >
                      {idx + 1}
                    </span>
                    <h5 className="font-bold text-sm tracking-tight">{sop.title}</h5>
                  </div>

                  {/* 1. Flow steps (Workflow) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: selectedDivision.color }} />
                      <span>Tahapan Alur Kerja (Workflow)</span>
                    </div>
                    <div className="space-y-2 pl-1">
                      {sop.flow.map((f, fIdx) => (
                        <div
                          key={fIdx}
                          className="flex items-start gap-2.5 text-xs text-gray-300"
                        >
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border"
                            style={{
                              borderColor: `${selectedDivision.color}80`,
                              color: selectedDivision.color,
                              backgroundColor: `${selectedDivision.color}15`,
                            }}
                          >
                            {fIdx + 1}
                          </span>
                          <span className={isLight ? 'text-slate-700' : 'text-gray-300'}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Rules / Compliance */}
                  {sop.rules.length > 0 && (
                    <div
                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        isLight
                          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                          : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Regulasi & Kepatuhan (Compliance Policy)</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90 pl-1">
                        {sop.rules.map((r, rIdx) => (
                          <li key={rIdx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 3. Inter-division Integration & Extension */}
                  {sop.integrations.length > 0 && (
                    <div
                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        isLight
                          ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                          : 'bg-blue-950/25 border-blue-800/40 text-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-blue-600 dark:text-blue-400">
                        <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
                        <span>Titik Integrasi Antar-Divisi & Ekstensi SOP</span>
                      </div>
                      <div className="space-y-1.5 pl-1">
                        {sop.integrations.map((integrationText, intIdx) => (
                          <div key={intIdx} className="flex items-start gap-2 text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                              {integrationText}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Helpdesk & Support Hotline */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
              isLight
                ? 'bg-blue-50/60 border-blue-200 text-blue-950'
                : 'bg-[#0d1117] border-[#30363d] text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                Butuh eskalasi atau klarifikasi kebijakan? Hubungi <strong>Helpdesk Internal JacS ERP</strong> di ext. <strong>#4401</strong> atau chat IT & Legal Officer.
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold whitespace-nowrap">
              SLA Respon: &lt;15 Menit
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`p-3.5 sm:px-5 border-t flex items-center justify-between text-xs ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-[#30363d] bg-[#0d1117]'
          }`}
        >
          <span className="text-[#8b949e] text-[11px]">
            Dokumen Resmi Prosedur Operasional • JacS RetailOS ERP v2.5
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
              isLight
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                : 'bg-[#21262d] hover:bg-[#30363d] text-white'
            }`}
          >
            Tutup Pedoman
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
