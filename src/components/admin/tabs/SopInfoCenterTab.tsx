import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  BookOpen,
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
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  ExternalLink,
  ChevronDown,
  Layers,
  Database,
  ArrowRightLeft,
  Check,
  Copy,
  Printer,
  Sparkles,
  Lock,
} from 'lucide-react';
import { ActiveNavModule } from '../../../types';

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
  navKey: ActiveNavModule;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  bgGlow: string;
  roleHolder: string;
  defaultPin: string;
  accessLevel: string;
  keyResponsibilities: string[];
  sopList: SopItem[];
}

const SOP_DIVISIONS: SopDivision[] = [
  {
    id: 'executive',
    code: '01',
    name: 'Eksekutif & Manajerial (Executive & Managerial)',
    navKey: 'executive',
    icon: Briefcase,
    color: '#10B981',
    bgGlow: 'rgba(16,185,129,0.15)',
    roleHolder: 'Siti Rahmawati (Executive Manager)',
    defaultPin: '1234',
    accessLevel: 'Level 3 - Direksi / Manajerial Strategis',
    keyResponsibilities: [
      'Otorisasi dokumen bernilai tinggi (PO > Rp 20.000.000,-)',
      'Monitoring KPI realtime, Gross Profit Margin & Cash Flow',
      'Persetujuan Stock Adjustment selisih inventori material',
      'Evaluasi kepatuhan SLA operasional 6 divisi perusahaan',
    ],
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
          'Otorisasi Tertinggi Dokumen Bernilai Kritis: Pembelian barang bernilai di atas ambang batas (Purchase Order > Rp 20.000.000,-) wajib disetujui Direksi/Manager sebelum PO dapat dikirim ke vendor.',
          'Toleransi Margin Minimum: Margin kotor produk retail ditetapkan minimum 15% kecuali produk kategori promosi khusus yang telah diapprove.',
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
    bgGlow: 'rgba(0,242,254,0.15)',
    roleHolder: 'Dimas Pratama (HR Staff)',
    defaultPin: '1234',
    accessLevel: 'Level 2 - Staf Fungsional Personalia & Payroll',
    keyResponsibilities: [
      'Master data karyawan, penetapan jadwal shift kerja & NIP',
      'Rekapitulasi presensi mandiri (Clock-In / Clock-Out)',
      'Manajemen kuota cuti tahunan (maksimal 12 hari/tahun)',
      'Kalkulasi payroll & iuran jaminan sosial BPJS Kesehatan/Ketenagakerjaan',
    ],
    sopList: [
      {
        title: 'SOP Siklus Data Karyawan, Presensi Shift, Pengajuan Cuti & Administrasi BPJS',
        flow: [
          'Onboarding Data Staf: Registrasi NIP resmi karyawan, kelengkapan biodata, penetapan jabatan departemen, status kontrak, dan penetapan jadwal shift kerja.',
          'Jadwal Shift & Presensi Harian: Karyawan wajib melakukan Clock-In paling lambat 10 menit sebelum jam shift dimulai dan Clock-Out saat serah terima/jam operasional selesai via terminal JacS.',
          'Pengajuan & Approval Tiket Cuti/Izin/Sakit: Pengajuan cuti tahunan, izin darurat, atau sakit diajukan via modul HR (melampirkan surat dokter jika >1 hari), diverifikasi dan disetujui berjenjang oleh atasan langsung.',
          'Rekapitulasi Presensi Bulanan: Sistem merekapitulasi akumulasi jam kerja, kedisiplinan, keterlambatan, dan pemotongan otomatis saldo kuota cuti tahunan untuk evaluasi berkala.',
          'Administrasi Penggajian & BPJS: Menghitung slip gaji, menerapkan skema potongan BPJS Kesehatan (1%) & Ketenagakerjaan (3%), serta mengalokasikan kontribusi perusahaan (Kesehatan 4% & Naker 6.24%) sebelum sinkronisasi jurnal ke modul Keuangan.',
        ],
        rules: [
          'Presensi mandiri bersifat mutlak (Single Identity & Anti-titip Absen Policy) menggunakan kredensial PIN terotentikasi.',
          'Pengajuan cuti tahunan terencana wajib diajukan minimal H-3 sebelum tanggal cuti efektif.',
          'Maksimal kuota cuti tahunan aktif adalah 12 hari kerja per periode kalender berjalan.',
          'Kepatuhan Iuran Jaminan Sosial (BPJS): Perusahaan mengikutsertakan seluruh personil aktif dalam BPJS Kesehatan dan Ketenagakerjaan. Pegawai dengan status Opt-Out menerima Gaji Bersih utuh tanpa potongan jaminan sosial.',
        ],
        integrations: [
          'Validasi Kehadiran Kasir (Divisi 06 POS): Memverifikasi bahwa kasir telah Clock-In resmi pada shift aktif sebelum register pembukaan laci kasir POS dapat diakses.',
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
    bgGlow: 'rgba(0,82,255,0.15)',
    roleHolder: 'Maya Indah (Finance Staff)',
    defaultPin: '1234',
    accessLevel: 'Level 2 - Staf Keuangan & Pembukuan Akuntansi',
    keyResponsibilities: [
      'Rekonsiliasi setoran kas register kasir POS harian & Z-Report',
      'Pencatatan Account Payable (AP) supplier & Account Receivable (AR)',
      'Verifikasi 3-Way Matching dokumen sebelum pencairan dana',
      'Penyusunan Jurnal Umum, Buku Besar, Neraca, dan Arus Kas',
    ],
    sopList: [
      {
        title: 'SOP Rekonsiliasi Kas Register, Manajemen AP/AR, Jurnal 3-Way Matching & Neraca',
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
    name: 'Pengadaan & Pembelian (Purchasing & Procurement)',
    navKey: 'purchasing',
    icon: ShoppingBag,
    color: '#F59E0B',
    bgGlow: 'rgba(245,158,11,0.15)',
    roleHolder: 'Agnes Monica (Purchasing Staff)',
    defaultPin: '1234',
    accessLevel: 'Level 2 - Staf Pengadaan & Manajemen Supplier',
    keyResponsibilities: [
      'Proses Purchase Requisition (PR) dari kebutuhan stok gudang',
      'Penerbitan Purchase Order (PO) resmi & negosiasi harga modal',
      'Eskalasi persetujuan PO > Rp 20.000.000,- ke level Eksekutif',
      'Pencatatan Terms of Payment (TOP: Tempo, COD, CBD) ke Finance',
    ],
    sopList: [
      {
        title: 'SOP Purchase Requisition (PR), Penerbitan PO & Manajemen Vendor Rekanan',
        flow: [
          'Purchase Requisition (PR): Menerima permohonan pembelian inventori berdasarkan analisis kebutuhan stok atau notifikasi restock otomatis dari gudang.',
          'Penerbitan Purchase Order (PO): Menyusun lembar PO resmi kepada supplier terverifikasi lengkap dengan rincian SKU, spesifikasi, dan kuantitas barang.',
          'Verifikasi Kesesuaian Harga & Termin Bayar (TOP): Menegosiasikan harga modal kompetitif, diskon kuantitas, dan Terms of Payment (Tempo / COD / CBD) dengan vendor.',
          'Pengiriman Dokumen PO ke Warehouse: Mendistribusikan tembusan lembar PO ke tim gudang untuk persiapan proses penerimaan fisik (Receiving).',
        ],
        rules: [
          'Ambang Batas Otorisasi Dokumen: Purchase Order dengan nilai nominal melebihi ambang batas (PO > Rp 20.000.000,-) wajib memperoleh approval Executive / Manager sebelum diterbitkan ke vendor.',
          'Vendor Terverifikasi: Transaksi pengadaan hanya boleh dilakukan dengan rekanan supplier yang berstatus aktif dan lolos evaluasi kepatuhan perusahaan.',
          'Pencatatan TOP Transparan: Jatuh tempo pembayaran wajib tercantum jelas di lembar PO agar tidak menimbulkan pinalti keterlambatan.',
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
    bgGlow: 'rgba(139,92,246,0.15)',
    roleHolder: 'Hendra Wijaya (Inventory Staff)',
    defaultPin: '1234',
    accessLevel: 'Level 2 - Staf Logistik, Rak Bin & Pergudangan',
    keyResponsibilities: [
      'Penerimaan barang fisik (Goods Receipt) & pengecekan kondisi kemasan',
      'Penataan lokasi rak (Bin Location), pelabelan barcode & tanggal kedaluwarsa',
      'Stock Opname berkala & pelaporan Stock Adjustment',
      'Pengurangan bahan baku resep otomatis (Bill of Materials - BOM)',
    ],
    sopList: [
      {
        title: 'SOP Penerimaan Barang Masuk (Goods Receipt), Penataan Rak, BOM & Stock Opname',
        flow: [
          'Penerimaan Barang Masuk (Goods Receipt): Mencocokkan kondisi fisik kiriman barang supplier dengan lembar Purchase Order resmi dan Surat Jalan pengiriman.',
          'Penempatan Lokasi Rak & Tagging: Menempatkan barang pada bin location rak gudang, melabeli barcode, nomor batch, dan mencatat tanggal kadaluwarsa (Exp Date / IMEI).',
          'Stock Opname Berkala & Adjustment: Menghitung stok fisik secara berkala, membekukan mutasi sementara, dan membuat laporan penyesuaian (Adjustment) jika ditemukan selisih.',
          'Penerbitan Barang Keluar (Dispatch/Transfer): Mengeluarkan barang untuk restock rak pajang kasir POS atau pengiriman transfer antar-cabang.',
        ],
        rules: [
          'Barang rusak, cacat kemasan, atau mendekati kedaluwarsa wajib langsung dibuatkan Berita Acara Retur (BAP) dan dipisahkan ke area karantina barang.',
          'Penyesuaian stok (Stock Adjustment) bernilai material wajib mendapatkan persetujuan Head Warehouse dan Executive sebelum di-posting.',
          'Stock Opname Terjadwal: Setiap kategori wajib dihitung minimal 1 kali setiap bulan tanpa mengganggu operasional penjualan.',
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
    bgGlow: 'rgba(255,122,0,0.15)',
    roleHolder: 'Andi Pratama, Dewi Lestari, Rian, Siti (Kasir Operasional)',
    defaultPin: '1111 / 2222 / 3333 / 7777 (atau PIN Sesi Kasir)',
    accessLevel: 'Level 1 - Frontliner Kasir & Layanan Pelanggan',
    keyResponsibilities: [
      'Buka register shift kasir & validasi modal kembalian awal laci kas',
      'Scan barcode produk, verifikasi diskon & pemrosesan pembayaran',
      'Pencetakan struk transaksi resmi & packing pesanan pelanggan',
      'Tutup shift kasir, hitung fisik uang kas & pencetakan laporan Z-Report',
    ],
    sopList: [
      {
        title: 'SOP Buka/Tutup Kasir, Transaksi Ritel, Struk Pembayaran & Rekonsiliasi Kas Zero-Variance',
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

const SECURITY_MATRIX = [
  {
    module: 'Master Data Management',
    key: 'master-data',
    code: 'MD-01',
    holder: 'Hendra Wijaya',
    role: 'Inventory & Master Admin',
    pin: '1234',
    level: 'Level 2 - Fungsional',
    privileges: 'Kelola SKU, barcode, kategori, satuan UOM, harga bertingkat, master vendor & customer.',
    status: 'Terkunci (PIN Mandiri)',
  },
  {
    module: 'Eksekutif & Manajerial',
    key: 'executive',
    code: 'EXEC-01',
    holder: 'Siti Rahmawati',
    role: 'Executive Manager',
    pin: '1234',
    level: 'Level 3 - Manajerial',
    privileges: 'Approval PO > 20 Jt, kebijakan batas stok, live telemetry margin laba kotor & bersih.',
    status: 'Terkunci (PIN Mandiri)',
  },
  {
    module: 'SDM & Personalia',
    key: 'hr',
    code: 'HR-01',
    holder: 'Dimas Pratama',
    role: 'HR Staff',
    pin: '1234',
    level: 'Level 2 - Fungsional',
    privileges: 'Presensi shift, cuti tahunan, payroll, perhitungan BPJS Kesehatan & Ketenagakerjaan.',
    status: 'Terkunci (PIN Mandiri)',
  },
  {
    module: 'Keuangan & Akuntansi',
    key: 'finance',
    code: 'FIN-01',
    holder: 'Maya Indah',
    role: 'Finance Staff',
    pin: '1234',
    level: 'Level 2 - Fungsional',
    privileges: 'Buku besar COA, jurnal umum, rekonsiliasi Z-Report kasir, hutang AP, piutang AR, neraca.',
    status: 'Terkunci (PIN Mandiri)',
  },
  {
    module: 'Pengadaan & Pembelian',
    key: 'purchasing',
    code: 'PURCH-01',
    holder: 'Agnes Monica',
    role: 'Purchasing Staff',
    pin: '1234',
    level: 'Level 2 - Fungsional',
    privileges: 'Draft PR, penerbitan PO vendor, negosiasi harga modal, pencatatan termin TOP.',
    status: 'Terkunci (PIN Mandiri)',
  },
  {
    module: 'Gudang & Logistik',
    key: 'warehouse',
    code: 'WH-01',
    holder: 'Hendra Wijaya',
    role: 'Inventory Staff',
    pin: '1234',
    level: 'Level 2 - Fungsional',
    privileges: 'Goods receipt surat jalan, penataan rak bin, kartu stok, BOM formula resep, stock opname.',
    status: 'Terkunci (PIN Mandiri)',
  },
  {
    module: 'Super Admin Developer',
    key: 'admin',
    code: 'ROOT-00',
    holder: 'Budi Santoso',
    role: 'Super Admin / Developer',
    pin: '1234 / Admin123',
    level: 'Level 4 - Root Privileges',
    privileges: 'Reset PIN seluruh staf, sakelar maintenance global, profiling badan usaha, database repair.',
    status: 'Terkunci (Password Master / PIN)',
  },
  {
    module: 'Point of Sale (POS)',
    key: 'pos',
    code: 'POS-06',
    holder: 'Staf Kasir Terdaftar',
    role: 'Kasir Operasional',
    pin: '1111 / 2222 / 3333 / 7777',
    level: 'Level 1 - Frontliner',
    privileges: 'Transaksi penjualan ritel/grosir, scan barcode, cetak struk, tutup kasir Z-Report.',
    status: 'Bebas / PIN Sesi Kasir',
  },
];

const INTEGRATION_FLOWS = [
  {
    id: 'flow-pos-accounting',
    title: 'Siklus 1: Penjualan Kasir POS ➔ Gudang ➔ Keuangan ➔ Eksekutif',
    badge: 'REALTIME OMNICHANNEL',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    steps: [
      {
        node: '01. Verifikasi Presensi',
        owner: 'HR (SDM)',
        desc: 'Kasir Clock-In via terminal JacS untuk memvalidasi jadwal shift aktif.',
      },
      {
        node: '02. Buka Register & Modal',
        owner: 'POS (Kasir)',
        desc: 'Menghitung uang modal kembalian laci kas dan membuka sesi kasir.',
      },
      {
        node: '03. Scan Barcode & Bayar',
        owner: 'POS (Kasir)',
        desc: 'Pembayaran diterima tunai / QRIS dinamis / kartu debit/kredit.',
      },
      {
        node: '04. Auto Potong Stok',
        owner: 'Warehouse (Gudang)',
        desc: 'Saldo stok SKU langsung dipotong seketika di database inventori (FIFO/BOM).',
      },
      {
        node: '05. Auto Jurnal Akuntansi',
        owner: 'Finance (Keuangan)',
        desc: 'Sistem membukukan Debit: Kas Register dan Kredit: Pendapatan Penjualan.',
      },
      {
        node: '06. Live Telemetry Margin',
        owner: 'Executive (Manajerial)',
        desc: 'Dashboard memantau omset, AOV, dan margin profitabilitas secara seketika.',
      },
    ],
  },
  {
    id: 'flow-procurement',
    title: 'Siklus 2: Sinyal Stok Habis (ROP) ➔ Pengadaan PO ➔ Otorisasi ➔ 3-Way Matching AP',
    badge: '3-WAY MATCHING COMPLIANCE',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    steps: [
      {
        node: '01. Reorder Point (ROP)',
        owner: 'Warehouse (Gudang)',
        desc: 'Stok menyentuh batas minimum aman, memicu draft permohonan pembelian (PR).',
      },
      {
        node: '02. Penerbitan PO Vendor',
        owner: 'Purchasing (Pengadaan)',
        desc: 'Menyusun lembar Purchase Order resmi, kuantitas, harga modal, dan termin TOP.',
      },
      {
        node: '03. Otorisasi Direksi (> 20 Jt)',
        owner: 'Executive (Eksekutif)',
        desc: 'PO bernilai kritis wajib disetujui Manajer sebelum dikirimkan ke supplier.',
      },
      {
        node: '04. Penerimaan Fisik (GRN)',
        owner: 'Warehouse (Gudang)',
        desc: 'Pengecekan fisik barang, surat jalan vendor, pelabelan rak, dan pencatatan expired.',
      },
      {
        node: '05. Validasi 3-Way Matching',
        owner: 'Finance (Keuangan)',
        desc: 'Mencocokkan PO Purchasing vs Goods Receipt Gudang vs Faktur Tagihan Vendor.',
      },
      {
        node: '06. Pencairan Hutang AP',
        owner: 'Finance (Keuangan)',
        desc: 'Menjadwalkan pembayaran jatuh tempo via transfer bank resmi perusahaan.',
      },
    ],
  },
  {
    id: 'flow-payroll',
    title: 'Siklus 3: Presensi Karyawan ➔ Cuti/Lembur ➔ BPJS ➔ Jurnal Penggajian',
    badge: 'PAYROLL & SOCIAL SECURITY',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    steps: [
      {
        node: '01. Presensi Harian',
        owner: 'HR (Personalia)',
        desc: 'Karyawan merekam jam kerja Clock-In/Out mandiri menggunakan PIN otentikasi.',
      },
      {
        node: '02. Rekapitulasi Jam Kerja',
        owner: 'HR (Personalia)',
        desc: 'Kalkulasi total kehadiran, akumulasi lembur, pemotongan telat, dan cuti tahunan.',
      },
      {
        node: '03. Komputasi BPJS',
        owner: 'HR (Personalia)',
        desc: 'Penerapan potongan BPJS Kesehatan 1% & Ketenagakerjaan 3% serta kontribusi perusahaan.',
      },
      {
        node: '04. Sinkronisasi Buku Besar',
        owner: 'Finance (Keuangan)',
        desc: 'Jurnal otomatis mencatat Beban Gaji, Beban BPJS, dan Hutang Kas Iuran.',
      },
      {
        node: '05. Pembayaran Payroll',
        owner: 'Finance (Keuangan)',
        desc: 'Pencairan gaji bersih (Take Home Pay) via transfer rekening bank karyawan.',
      },
    ],
  },
];

export const SopInfoCenterTab: React.FC<{ isLight: boolean }> = ({ isLight }) => {
  const { setActiveNav, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivisionTab, setSelectedDivisionTab] = useState<string>(() => {
    const saved = localStorage.getItem('jacs_sop_active_division');
    return saved && saved !== 'all' ? saved : 'all';
  });
  const [activeAccordion, setActiveAccordion] = useState<string | null>(() => {
    const saved = localStorage.getItem('jacs_sop_active_division');
    return saved && saved !== 'all' ? saved : 'executive';
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    showToast(`Disalin ke clipboard: ${label}`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const filteredDivisions = SOP_DIVISIONS.filter((div) => {
    if (selectedDivisionTab !== 'all' && selectedDivisionTab !== 'matrix' && selectedDivisionTab !== 'integration') {
      if (div.id !== selectedDivisionTab) return false;
    }
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchName = div.name.toLowerCase().includes(query);
    const matchRole = div.roleHolder.toLowerCase().includes(query);
    const matchSopTitle = div.sopList.some((s) => s.title.toLowerCase().includes(query));
    const matchFlow = div.sopList.some((s) => s.flow.some((f) => f.toLowerCase().includes(query)));
    const matchRules = div.sopList.some((s) => s.rules.some((r) => r.toLowerCase().includes(query)));
    const matchIntegration = div.sopList.some((s) => s.integrations.some((i) => i.toLowerCase().includes(query)));
    return matchName || matchRole || matchSopTitle || matchFlow || matchRules || matchIntegration;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. HERO HEADER CARD */}
      <div
        className={`p-6 sm:p-7 rounded-2xl border relative overflow-hidden transition-all ${
          isLight
            ? 'bg-gradient-to-br from-white via-slate-50 to-cyan-50/40 border-slate-200 shadow-sm'
            : 'bg-gradient-to-br from-[#161b22] via-[#0d1117] to-cyan-950/20 border-[#30363d]'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center gap-1.5 shadow-xs">
                <BookOpen className="w-3.5 h-3.5" />
                PANDUAN &amp; SOP RESMI JACS ERP
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                6 DIVISI TERINTEGRASI
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                AUDIT-READY COMPLIANCE
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Pusat Informasi &amp; Standar Operasional Prosedur (SOP)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
              Dokumentasi komprehensif alur kerja operasional, matriks wewenang &amp; PIN kredensial modul,
              aturan kepatuhan audit (compliance), serta peta integrasi data lintas divisi JacS RetailOS ERP.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-slate-600"
              title="Cetak panduan SOP ini untuk arsip offline"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Cetak / PDF</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopyText(window.location.href, 'Tautan Modul SOP')}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 cursor-pointer transition shadow-md shadow-cyan-600/20 active:scale-95"
            >
              {copiedKey === 'Tautan Modul SOP' ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <Copy className="w-4 h-4 text-white" />
              )}
              <span>{copiedKey === 'Tautan Modul SOP' ? 'Tersalin!' : 'Salin Info SOP'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & NAVIGATION FILTER BAR */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari SOP, aturan kepatuhan, kata kunci (misal: 3-Way Matching, BPJS, Void, ROP, Stock Opname)..."
            className={`w-full pl-10 pr-4 py-3 rounded-xl border text-xs sm:text-sm transition outline-none ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 shadow-sm'
                : 'bg-[#161b22] border-[#30363d] text-white focus:border-cyan-500 shadow-inner'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Division Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {[
            { id: 'all', label: 'Semua SOP', count: '6 Divisi' },
            { id: 'matrix', label: 'Matriks Hak Akses & PIN', count: 'Kredensial' },
            { id: 'integration', label: 'Alur Integrasi Data', count: 'Lintas Divisi' },
            { id: 'executive', label: '01 Eksekutif', color: '#10B981' },
            { id: 'hr', label: '02 HR & BPJS', color: '#00f2fe' },
            { id: 'finance', label: '03 Keuangan (AP/AR)', color: '#0052FF' },
            { id: 'purchasing', label: '04 Pengadaan (PO)', color: '#F59E0B' },
            { id: 'warehouse', label: '05 Gudang & BOM', color: '#8B5CF6' },
            { id: 'pos', label: '06 Kasir (POS)', color: '#ff7a00' },
          ].map((item) => {
            const isSelected = selectedDivisionTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedDivisionTab(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition cursor-pointer select-none ${
                  isSelected
                    ? isLight
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : isLight
                    ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    : 'bg-[#161b22] text-gray-400 hover:text-white border border-[#30363d]'
                }`}
              >
                <span>{item.label}</span>
                {item.count && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? isLight
                          ? 'bg-white/20 text-white'
                          : 'bg-black/30 text-slate-950 font-black'
                        : 'bg-slate-500/15 text-gray-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MATRIKS HAK AKSES & PIN MODUL (JIKA TAB ALL ATAU MATRIX TERPILIH) */}
      {(selectedDivisionTab === 'all' || selectedDivisionTab === 'matrix') && !searchQuery && (
        <div
          className={`p-6 rounded-2xl border space-y-4 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight">
                  Matriks Hak Akses &amp; Konfigurasi PIN Modul
                </h3>
                <p className="text-xs text-gray-400">
                  Seluruh modul berdiri sendiri (independen). PIN default sementara diseragamkan ke <strong>1234</strong>.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 self-start sm:self-auto">
              SECURITY GOVERNANCE
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={isLight ? 'bg-slate-100 text-slate-900 font-black text-xs border-b border-slate-300' : 'bg-slate-800/60 text-gray-300'}>
                  <th className="p-3 font-bold rounded-l-xl">Modul / Divisi</th>
                  <th className="p-3 font-bold">Pemegang Utama</th>
                  <th className="p-3 font-bold">PIN Default</th>
                  <th className="p-3 font-bold">Level Akses</th>
                  <th className="p-3 font-bold">Cakupan Wewenang</th>
                  <th className="p-3 font-bold text-center rounded-r-xl">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-gray-700/20 dark:divide-gray-800'}`}>
                {SECURITY_MATRIX.map((sec) => (
                  <tr
                    key={sec.key}
                    className={`transition ${
                      isLight
                        ? sec.key === 'admin' ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50'
                        : sec.key === 'admin' ? 'bg-pink-500/5 hover:bg-slate-800/30' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="p-3">
                      <div className={`font-black flex items-center gap-1.5 ${isLight ? 'text-slate-950' : 'text-slate-900 dark:text-white'}`}>
                        <Lock className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span>{sec.module}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-indigo-950' : 'text-cyan-500'}`}>{sec.code}</span>
                    </td>
                    <td className="p-3">
                      <div className={`font-black text-xs ${isLight ? 'text-slate-950' : 'font-semibold'}`}>{sec.holder}</div>
                      <div className={`text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-[10px] text-gray-400'}`}>{sec.role}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md font-mono font-bold ${
                        isLight
                          ? 'bg-slate-100 border border-slate-300 text-slate-950 font-black text-xs'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {sec.pin}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs ${isLight ? 'text-slate-800 font-bold' : 'text-[11px] font-medium text-slate-600 dark:text-gray-300'}`}>
                        {sec.level}
                      </span>
                    </td>
                    <td className={`p-3 text-xs max-w-xs ${isLight ? 'text-slate-700 font-medium' : 'text-[11px] text-gray-400'}`}>
                      {sec.privileges}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => setActiveNav(sec.key as ActiveNavModule)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 mx-auto ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                            : 'hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                        }`}
                        title={`Buka modul ${sec.module}`}
                      >
                        <span>Buka</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ALUR KERJA INTEGRASI DATA LINTAS DIVISI (JIKA TAB ALL ATAU INTEGRATION TERPILIH) */}
      {(selectedDivisionTab === 'all' || selectedDivisionTab === 'integration') && !searchQuery && (
        <div
          className={`p-6 rounded-2xl border space-y-5 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                Peta Alur Kerja &amp; Integrasi Data Otomatis Antar Divisi
              </h3>
              <p className="text-xs text-gray-400">
                Bagaimana data mengalir secara otomatis tanpa input berulang (single-source of truth).
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {INTEGRATION_FLOWS.map((flow) => (
              <div
                key={flow.id}
                className={`p-4 sm:p-5 rounded-xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className={`text-sm flex items-center gap-2 ${isLight ? 'text-slate-950 font-black' : 'font-extrabold text-cyan-400'}`}>
                    <Sparkles className="w-4 h-4 shrink-0 text-cyan-500" />
                    <span>{flow.title}</span>
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border self-start sm:self-auto ${
                    isLight ? 'bg-slate-100 text-slate-900 border-slate-300' : flow.badgeColor
                  }`}>
                    {flow.badge}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {flow.steps.map((st, sIdx) => (
                    <div
                      key={sIdx}
                      className={`p-3 rounded-lg border text-xs space-y-1 relative ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono font-bold">
                        <span className={isLight ? 'text-slate-950 font-black' : 'text-cyan-400'}>{st.node}</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold ${
                          isLight ? 'bg-slate-100 text-slate-900 border border-slate-300' : 'bg-cyan-500/15 text-cyan-300'
                        }`}>
                          {st.owner}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-[11px] text-gray-400'}`}>{st.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. DOKUMENTASI LENGKAP SOP 6 DIVISI */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-base tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-950 font-black' : 'font-extrabold'}`}>
            <BookOpen className="w-4 h-4 text-cyan-500" />
            <span>Dokumentasi Standar Operasional Prosedur (SOP) Lengkap</span>
          </h3>
          <span className={`text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
            Menampilkan {filteredDivisions.length} Divisi
          </span>
        </div>

        {filteredDivisions.map((div) => {
          const Icon = div.icon;
          const isExpanded = activeAccordion === div.id || selectedDivisionTab === div.id;

          return (
            <div
              key={div.id}
              id={`sop-division-card-${div.id}`}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              {/* Accordion Trigger Header */}
              <div
                onClick={() => setActiveAccordion(isExpanded ? null : div.id)}
                className={`p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none transition ${
                  isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: div.bgGlow,
                      borderColor: `${div.color}50`,
                      color: div.color,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                        isLight
                          ? 'bg-slate-100 border border-slate-300 text-slate-900 text-xs'
                          : 'text-[10px] font-mono bg-slate-500/15 border border-slate-500/30 text-gray-300'
                      }`}>
                        DIVISI {div.code}
                      </span>
                      <h4 className={`text-sm sm:text-base tracking-tight truncate ${
                        isLight ? 'text-slate-950 font-black' : 'font-extrabold'
                      }`}>
                        {div.name}
                      </h4>
                    </div>
                    <div className={`flex items-center gap-3 mt-1 text-xs flex-wrap ${
                      isLight ? 'text-slate-800 font-bold' : 'text-gray-400'
                    }`}>
                      <span>
                        Penanggung Jawab: <strong className={isLight ? 'text-slate-950 font-black' : 'text-slate-300'}>{div.roleHolder}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        PIN Akses: <strong className={`font-mono ${isLight ? 'text-slate-950 font-black' : 'text-amber-400'}`}>{div.defaultPin}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveNav(div.navKey);
                    }}
                    className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                        : 'hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                    }`}
                    title={`Buka Modul ${div.name}`}
                  >
                    <span>Buka Modul</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-cyan-500' : isLight ? 'text-slate-600' : 'text-gray-400'
                    }`}
                  />
                </div>
              </div>

              {/* Accordion Expanded Content */}
              {isExpanded && (
                <div className={`p-4 sm:p-6 border-t space-y-6 animate-fadeIn ${
                  isLight ? 'border-slate-200' : 'border-gray-700/20 dark:border-gray-800'
                }`}>
                  {/* Responsibilities Bento */}
                  <div
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className={`flex items-center gap-2 ${isLight ? 'text-slate-950 font-black' : 'font-extrabold text-slate-800 dark:text-slate-200'}`}>
                      <Layers className="w-4 h-4 text-cyan-600" />
                      <span>Tanggung Jawab Utama Divisi</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {div.keyResponsibilities.map((resp, rIdx) => (
                        <div key={rIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className={isLight ? 'text-slate-800 font-medium' : 'text-gray-400 text-[11px]'}>{resp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SOP Lists */}
                  {div.sopList.map((sop, sIdx) => (
                    <div key={sIdx} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-500" />
                        <h5 className={`text-sm ${isLight ? 'text-slate-950 font-black' : 'font-extrabold text-cyan-400'}`}>{sop.title}</h5>
                      </div>

                      {/* 1. Alur Operasional */}
                      <div className="space-y-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-400'}`}>
                          1. Alur Kerja Langkah Demi Langkah (Operational Step-by-Step Flow):
                        </span>
                        <div className="space-y-2">
                          {sop.flow.map((step, stepIdx) => (
                            <div
                              key={stepIdx}
                              className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-800 font-medium'
                                  : 'bg-slate-950/40 border-slate-800 text-gray-300'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full border flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5 ${
                                isLight
                                  ? 'bg-slate-100 border-slate-300 text-slate-950 font-black'
                                  : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                              }`}>
                                {stepIdx + 1}
                              </span>
                              <p className="leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 2. Regulasi & Aturan Kepatuhan */}
                      <div className="space-y-2">
                        <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                          isLight ? 'text-rose-950' : 'text-rose-400 font-bold'
                        }`}>
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>2. Regulasi &amp; Aturan Kepatuhan Ketat (Strict Policies &amp; Compliance):</span>
                        </span>
                        <div className="space-y-2">
                          {sop.rules.map((rule, ruleIdx) => (
                            <div
                              key={ruleIdx}
                              className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                                isLight
                                  ? 'bg-rose-50 border-rose-300 text-rose-950 font-medium'
                                  : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                              }`}
                            >
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <p className="leading-relaxed">{rule}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 3. Alur Integrasi Lintas Divisi */}
                      <div className="space-y-2">
                        <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                          isLight ? 'text-emerald-950' : 'text-emerald-400 font-bold'
                        }`}>
                          <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
                          <span>3. Alur Integrasi Data Lintas Divisi (Cross-Department Integration):</span>
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {sop.integrations.map((integ, integIdx) => (
                            <div
                              key={integIdx}
                              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                                isLight
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                                  : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <p className="leading-relaxed">{integ}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Footer Action to Jump to Module */}
                  <div className={`pt-2 flex items-center justify-between border-t ${
                    isLight ? 'border-slate-200' : 'border-gray-700/20 dark:border-gray-800'
                  }`}>
                    <span className={`text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-[11px] text-gray-400'}`}>
                      Modul terotentikasi mandiri. Butuh PIN untuk mengakses fitur di luar Super Admin.
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveNav(div.navKey)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                    >
                      <span>Masuk ke Modul {div.name.split('(')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
