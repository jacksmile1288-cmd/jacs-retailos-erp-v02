import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Printer,
  Copy,
  ShieldCheck,
  Database,
  TrendingUp,
  AlertTriangle,
  Wifi,
  Clock,
  LifeBuoy,
  Zap,
  CheckCircle2,
  Lock,
  ArrowRight,
  KeyRound,
  Layers,
  Store,
  Barcode,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const JacsSOPManualTab: React.FC = () => {
  const { theme, showToast } = useApp();
  const isLight = theme === 'light';
  const [openAccordion, setOpenAccordion] = useState<string | null>('modul-1');

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleCopySummary = async () => {
    const summary = `
JacS ERP Standard Operating Procedure V3.0 — Edisi November 2026

Modul 1: Panduan 5 Sensor Diagnosa Sistem & Self-Healing
1. Check Cash Liquidity: Memantau saldo kas likuid positif. Self-Healing: [Normalisasi Saldo Kas] (+Rp 5jt darurat).
2. Check Inventory Integrity: Memindai anomali stok negatif. Self-Healing: [Karantina Stok Minus] (reset buffer aman 5 unit).
3. Check Ledger Balance: Audit keseimbangan Debit vs Kredit (GL Sync).
4. Check PO Compliance: Purchase Order di atas Rp 20.000.000 wajib otorisasi Direksi (status SYSTEM_LOCKED hingga disetujui Executive).
5. Check Terminal Latency: Pastikan Gemini API Key aktif & latensi di bawah 2000ms.

Modul 2: Protokol Onboarding Data Riil & Migrasi Toko Lama
1. Clean Slate: Jalankan tombol Clean Slate pada tab Status Sistem sebelum mengimpor data toko riil.
2. Data Master & Smart Column Mapper: Buka tab Data Master & Migrasi di SuperAdmin untuk mengunggah file CSV/Excel POS lama ke skema baku (Barcode / ID, No Kategori angka 2-471 tanpa awalan PC., Nama Kategori, Nama Produk, Brand, HPP, Retail +20%, Member +15%, Grosir +10%, Stok). Tinjau laporan sukses/gagal & unduh CSV baris gagal bila diperlukan koreksi.
3. Input Cepat SKU & Label Rak: Gunakan + Quick Barcode SKU (barcode pabrikan atau ID otomatis INT-XXXX untuk non-barcode) serta cetak Label Rak Thermal/A4.

Modul 3: Manajemen Kredensial, Dual-Backend & Clover Live Connector
1. Dual-Backend Synchronization: Hubungkan URL & Anon Key Supabase serta Google Apps Script (GAS) Web App URL di tab Manajemen Kredensial / Status Sistem untuk sinkronisasi multi-cabang & fallback offline-first.
2. Clover POS Live Data Connector: Masukkan Clover Merchant ID & Clover Live API Token (clv_live_...), aktifkan Clean Slate, lalu jalankan penarikan katalog & riwayat order riil.
3. AI & Smart Tools: Pastikan Gemini API Key terpasang untuk klasifikasi otomatis migrasi SKU & analisis diagnostik.

Modul 4: Checklist Pemeliharaan Berkala & Emergency Action Guide
- Harian: Cek modal awal kasir, Pusat Uji Sistem (1x pagi), audit systemErrorLogs, & pastikan status ONLINE — SYNCED.
- Mingguan: Rekonsiliasi stok fisik vs sistem, review PO Pending/Locked, & kliring log audit DEBUG/INFO.
- Bulanan: Monthly Closing, ekspor Full Backup JSON, & rotasi berkala API Token/Kredensial.
- Darurat: Selisih kas (cek mutasi shift & GL), stok minus (Karantina Stok Minus / Opname), antrean offline tertahan (Offline-First POS + Refresh/Force Sync).

JacS ERP Standard Operating Procedure V3.0 — Updated November 2026
    `.trim();

    try {
      await navigator.clipboard.writeText(summary);
      showToast('Ringkasan SOP V3.0 berhasil disalin ke clipboard.', 'success');
    } catch {
      showToast('Gagal menyalin otomatis. Pastikan izin clipboard browser aktif.', 'warning');
    }
  };

  const handlePrintSOP = () => {
    window.print();
  };

  const AccordionItem = ({
    id,
    moduleLabel,
    title,
    badge,
    icon: Icon,
    children
  }: {
    id: string;
    moduleLabel: string;
    title: string;
    badge?: string;
    icon: any;
    children: React.ReactNode;
  }) => {
    const isOpen = openAccordion === id;
    return (
      <div
        className={`rounded-2xl border transition-all duration-200 overflow-hidden mb-4 ${
          isLight
            ? isOpen
              ? 'bg-white border-cyan-500 shadow-[0_0_22px_rgba(6,182,212,0.28)]'
              : 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.18)] hover:border-cyan-500 hover:shadow-[0_0_22px_rgba(6,182,212,0.32)]'
            : isOpen
            ? 'bg-slate-900 border-cyan-400/70 shadow-[0_0_20px_rgba(6,182,212,0.18)]'
            : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.16)]'
        }`}
      >
        <button
          type="button"
          onClick={() => toggleAccordion(id)}
          className={`w-full flex items-center justify-between p-5 text-left transition-colors cursor-pointer ${
            isLight ? 'hover:bg-cyan-50/40' : 'hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                isLight
                  ? 'bg-cyan-50/80 border-cyan-500/30 text-cyan-600'
                  : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[11px] uppercase tracking-widest font-mono font-medium ${
                    isLight ? 'text-cyan-700' : 'text-cyan-400'
                  }`}
                >
                  {moduleLabel}
                </span>
                {badge && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] uppercase tracking-widest font-mono font-medium border ${
                      isLight
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300/80'
                        : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <span
                className={`font-medium tracking-wide text-[15px] leading-snug ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}
              >
                {title}
              </span>
            </div>
          </div>
          <span className="print:hidden shrink-0 ml-3">
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-cyan-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </span>
        </button>

        <div
          className={`${
            isOpen ? 'block' : 'hidden print:block'
          } p-6 pt-0 border-t ${
            isLight ? 'border-cyan-500/20' : 'border-slate-800/70'
          } animate-in slide-in-from-top-2 duration-300`}
        >
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header & Export Tools */}
      <div
        className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-5 rounded-2xl border transition-all duration-200 ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.18)] hover:border-cyan-500 hover:shadow-[0_0_22px_rgba(6,182,212,0.32)]'
            : 'bg-slate-900/90 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.16)]'
        }`}
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2
              className={`text-xl font-medium tracking-wide flex items-center gap-2.5 ${
                isLight ? 'text-slate-900' : 'text-indigo-400'
              }`}
            >
              <BookOpen className="w-5 h-5 text-cyan-500 shrink-0" />
              <span>SOP &amp; Petunjuk Teknis SuperAdmin</span>
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-widest font-mono font-medium border ${
                isLight
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-400/70'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}
            >
              V3.0 — Edisi November 2026
            </span>
          </div>
          <p
            className={`text-xs font-normal tracking-wide leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            Panduan lengkap diagnostik sistem, protokol onboarding data toko riil, konektor Clover &amp; Dual-Backend, serta jadwal pemeliharaan berkala.
          </p>
        </div>

        <div className="flex items-center gap-2.5 print:hidden shrink-0">
          <button
            type="button"
            onClick={handleCopySummary}
            className={`px-4 py-2 rounded-xl text-[11px] uppercase tracking-widest font-medium flex items-center gap-2 transition cursor-pointer active:scale-95 border ${
              isLight
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Ringkasan SOP</span>
          </button>
          <button
            type="button"
            onClick={handlePrintSOP}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] uppercase tracking-widest font-medium flex items-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Dokumen SOP</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* MODUL 1: PANDUAN 5 SENSOR DIAGNOSA SISTEM */}
        <AccordionItem
          id="modul-1"
          moduleLabel="Modul 1"
          title="Panduan 5 Sensor Diagnosa Sistem"
          badge="Self-Healing"
          icon={Zap}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${
                  isLight ? 'bg-slate-50/90 border-slate-200/90' : 'bg-slate-800/30 border-slate-700/80'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className={`text-[13px] font-medium tracking-wide ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    1. Check Cash Liquidity
                  </span>
                </div>
                <p className={`text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Fungsi:</span> Memastikan saldo kas likuid (Physical Drawer + Ledger) tetap berada pada posisi positif.
                  <br />
                  <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Penyebab Defisit:</span> Biasanya terjadi saat pengeluaran (PO atau biaya operasional) diinput mendahului modal atau omzet masuk.
                  <br />
                  <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Self-Healing:</span> Gunakan tombol{' '}
                  <code className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[11px]">
                    [Normalisasi Saldo Kas]
                  </code>{' '}
                  untuk menyuntikkan modal darurat +Rp 5.000.000.
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  isLight ? 'bg-slate-50/90 border-slate-200/90' : 'bg-slate-800/30 border-slate-700/80'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className={`text-[13px] font-medium tracking-wide ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    2. Check Inventory Integrity
                  </span>
                </div>
                <p className={`text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Fungsi:</span> Memindai anomali stok bernilai negatif di seluruh katalog SKU aktif.
                  <br />
                  <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Masalah:</span> Kondisi balapan transaksi (race condition) di kasir POS saat checkout serentak pada SKU di titik nol.
                  <br />
                  <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Self-Healing:</span> Gunakan tombol{' '}
                  <code className="bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-mono text-[11px]">
                    [Karantina Stok Minus]
                  </code>{' '}
                  untuk mereset stok negatif ke 5 unit sebagai buffer aman.
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  isLight ? 'bg-slate-50/90 border-slate-200/90' : 'bg-slate-800/30 border-slate-700/80'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className={`text-[13px] font-medium tracking-wide ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    3. Check Ledger Balance
                  </span>
                </div>
                <p className={`text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Fungsi:</span> Audit pembukuan berpasangan (Debit vs Kredit) antara transaksi POS dan General Ledger.
                  <br />
                  <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Self-Healing / Tindakan:</span> Jika status{' '}
                  <span className="font-mono text-[11px] font-medium">GL Desync</span> muncul, tinjau Journal Entry terakhir di modul Finance atau jalankan sinkronisasi ulang antar modul sebelum tutup buku.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${
                  isLight ? 'bg-slate-50/90 border-slate-200/90' : 'bg-slate-800/30 border-slate-700/80'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className={`text-[13px] font-medium tracking-wide ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    4. Check PO Compliance (&gt; Rp 20.000.000)
                  </span>
                </div>
                <p className={`text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Aturan:</span> Setiap Purchase Order (PO) bernilai di atas{' '}
                  <span className="font-medium">Rp 20.000.000</span> wajib mendapatkan otorisasi Direksi / Executive.
                  <br />
                  <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Status Locked:</span> PO yang ditandai{' '}
                  <span className="font-mono text-[11px] font-medium">SYSTEM_LOCKED</span> tidak dapat dicairkan di modul Finance sebelum disetujui secara formal melalui tab Executive.
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  isLight ? 'bg-slate-50/90 border-slate-200/90' : 'bg-slate-800/30 border-slate-700/80'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span className={`text-[13px] font-medium tracking-wide ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    5. Check Terminal Latency
                  </span>
                </div>
                <p className={`text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Konfigurasi:</span> Pastikan Google Gemini API Key sudah terpasang dan aktif pada konfigurasi sistem.
                  <br />
                  <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Ambang Batas:</span> Latensi di atas{' '}
                  <span className="font-medium">2000ms</span> menandakan degradasi jaringan yang dapat memperlambat respon AI Intel maupun sinkronisasi terminal. Gunakan tombol uji ulang di Pusat Uji Sistem untuk verifikasi waktu nyata.
                </p>
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* MODUL 2: PROTOKOL ONBOARDING DATA RIIL & MIGRASI TOKO LAMA */}
        <AccordionItem
          id="modul-2"
          moduleLabel="Modul 2"
          title="Protokol Onboarding Data Riil & Migrasi Toko Lama"
          badge="Baru V3.0"
          icon={FileSpreadsheet}
        >
          <div className="space-y-4 mt-4">
            <div
              className={`p-4 rounded-xl border ${
                isLight ? 'bg-rose-50/60 border-rose-200/90' : 'bg-rose-500/5 border-rose-500/25'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <RefreshCw className="w-4 h-4 text-rose-500 shrink-0" />
                <span className={`text-[13px] font-medium tracking-wide ${isLight ? 'text-rose-900' : 'text-rose-300'}`}>
                  1. Pembersihan Data Simulasi (Clean Slate)
                </span>
              </div>
              <p className={`text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Sebelum mengimpor data toko riil, jalankan tombol{' '}
                <span className="font-mono text-[11px] font-medium">Clean Slate</span> pada tab{' '}
                <span className="font-medium">Status Sistem</span> (atau aktifkan opsi Clean Slate saat sinkronisasi Clover) agar seluruh saldo kas demo, stok awal simulasi, jurnal, dan riwayat transaksi dummy terhapus bersih ke Rp 0.
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                isLight ? 'bg-cyan-50/60 border-cyan-200/90' : 'bg-cyan-500/5 border-cyan-500/25'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span className={`text-[13px] font-medium tracking-wide ${isLight ? 'text-cyan-950' : 'text-cyan-300'}`}>
                  2. Data Master &amp; Smart Column Mapper (CSV / Excel POS Lama)
                </span>
              </div>
              <p className={`text-xs font-normal tracking-wide leading-relaxed mb-2.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Buka tab <span className="font-medium">Data Master &amp; Migrasi</span> langsung dari konsol SuperAdmin, lalu pilih sub-tab{' '}
                <span className="font-medium">AI Smart Migration</span> untuk mengunggah file CSV/Excel atau menempelkan teks tabel dari sistem POS lama dengan header kolom bebas seperti{' '}
                <span className="font-mono text-[11px]">Kode/PLU</span>, <span className="font-mono text-[11px]">Nama Item</span>,{' '}
                <span className="font-mono text-[11px]">Modal/Beli</span>, <span className="font-mono text-[11px]">Harga Jual</span>, dan{' '}
                <span className="font-mono text-[11px]">Qty/Sisa</span>.
              </p>
              <div
                className={`p-3 rounded-lg border font-mono text-[11px] leading-relaxed tracking-wide ${
                  isLight ? 'bg-white border-cyan-200 text-slate-800' : 'bg-slate-950/70 border-slate-700 text-slate-200'
                }`}
              >
                Skema Baku JacS RetailOS ERP: Barcode / ID → No Kategori (angka 2–471 tanpa awalan &quot;PC.&quot;) → Nama Kategori → Nama Produk → Brand → HPP → Retail (+20%) → Member (+15%) → Grosir (+10%) → Stok
              </div>
              <p className={`text-xs font-normal tracking-wide leading-relaxed mt-2.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Pemrosesan berjalan baris-per-baris (<span className="italic">partial-commit</span>): baris yang valid langsung masuk ke Katalog SKU, sedangkan baris bermasalah dikarantina secara terpisah. Periksa{' '}
                <span className="font-medium">Kartu Laporan Hasil Migrasi</span> (Total Baris, Sukses, Gagal) dan unduh file CSV baris gagal apabila diperlukan perbaikan manual.
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                isLight ? 'bg-indigo-50/60 border-indigo-200/90' : 'bg-indigo-500/5 border-indigo-500/25'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Barcode className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className={`text-[13px] font-medium tracking-wide ${isLight ? 'text-indigo-950' : 'text-indigo-300'}`}>
                  3. Input Cepat SKU (Barcode &amp; Non-Barcode) &amp; Label Rak
                </span>
              </div>
              <p className={`text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Gunakan tombol <span className="font-mono text-[11px] font-medium">+ Quick Barcode SKU</span> untuk pemindaian barcode pabrikan atau gunakan generator ID internal otomatis (
                <span className="font-mono text-[11px] font-medium">INT-XXXX</span>) bagi barang curah maupun non-barcode. Untuk pencetakan stiker harga &amp; barcode rak toko, gunakan studio{' '}
                <span className="font-medium">Label Rak</span> yang mendukung mode cetak Thermal maupun kertas A4.
              </p>
            </div>
          </div>
        </AccordionItem>

        {/* MODUL 3: MANAJEMEN KREDENSIAL, DUAL-BACKEND & CLOVER LIVE CONNECTOR */}
        <AccordionItem
          id="modul-3"
          moduleLabel="Modul 3"
          title="Manajemen Kredensial, Dual-Backend & Clover Live Connector"
          badge="Baru V3.0"
          icon={KeyRound}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                isLight ? 'bg-slate-50/90 border-slate-200/90' : 'bg-slate-800/30 border-slate-700/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-500 shrink-0" />
                <span className={`text-[13px] font-medium tracking-wide ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  1. Dual-Backend Synchronization
                </span>
              </div>
              <p className={`text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Hubungkan <span className="font-medium">Supabase URL &amp; Anon Key</span> serta{' '}
                <span className="font-medium">Google Apps Script (GAS) Web App URL</span> pada tab{' '}
                <span className="font-medium">Status Sistem</span> / <span className="font-medium">Manajemen Kredensial</span> untuk sinkronisasi cloud multi-cabang, antrean{' '}
                <span className="italic">offline-first</span>, dan penyediaan proxy CORS.
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border space-y-2 ${
                isLight ? 'bg-emerald-50/60 border-emerald-200/90' : 'bg-emerald-500/5 border-emerald-500/25'
              }`}
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className={`text-[13px] font-medium tracking-wide ${isLight ? 'text-emerald-950' : 'text-emerald-300'}`}>
                  2. Clover POS Live Data Connector
                </span>
              </div>
              <p className={`text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Khusus toko pengguna mesin kasir <span className="font-medium">Clover POS</span>: buka tab{' '}
                <span className="font-medium">Manajemen Kredensial</span>, masukkan{' '}
                <span className="font-mono text-[11px] font-medium">Clover Merchant ID</span> (13 karakter alfanumerik) dan{' '}
                <span className="font-mono text-[11px] font-medium">Clover Live API Token</span> (<span className="font-mono text-[11px]">clv_live_...</span>), pilih Environment (
                <span className="font-mono text-[11px]">Production</span> / <span className="font-mono text-[11px]">Sandbox</span>), centang opsi{' '}
                <span className="font-medium">Clean Slate</span>, lalu klik{' '}
                <span className="font-medium">[Uji Koneksi &amp; Tarik Data Riil Clover]</span> untuk menarik katalog, stok fisik, dan riwayat order otomatis.
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border space-y-2 ${
                isLight ? 'bg-purple-50/60 border-purple-200/90' : 'bg-purple-500/5 border-purple-500/25'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />
                <span className={`text-[13px] font-medium tracking-wide ${isLight ? 'text-purple-950' : 'text-purple-300'}`}>
                  3. AI &amp; Smart Tools
                </span>
              </div>
              <p className={`text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Pastikan <span className="font-medium">Gemini API Key</span> terpasang aktif untuk mendukung fitur klasifikasi kategori otomatis saat migrasi massal SKU, deteksi anomali transaksi, dan analisis diagnostik cerdas pada tab{' '}
                <span className="font-medium">AI &amp; Smart Tools</span>.
              </p>
            </div>
          </div>
        </AccordionItem>

        {/* MODUL 4: CHECKLIST PEMELIHARAAN BERKALA & EMERGENCY ACTION GUIDE */}
        <AccordionItem
          id="modul-4"
          moduleLabel="Modul 4"
          title="Checklist Pemeliharaan Berkala & Emergency Action Guide (FAQ)"
          badge="Terbaru"
          icon={Clock}
        >
          <div className="space-y-6 mt-4">
            {/* Checklist Harian / Mingguan / Bulanan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                <h4 className="text-[11px] uppercase tracking-widest font-mono font-medium text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Harian (Daily)
                </h4>
                <ul className={`space-y-2.5 text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <li className="flex gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-1" />
                    <span>Cek saldo laci awal kasir &amp; jalankan 5 sensor Pusat Uji Sistem (1x pagi).</span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-1" />
                    <span>
                      Audit log error global (<span className="font-mono text-[11px]">systemErrorLogs</span>) via tombol Lihat Log Error di Remote Maintenance.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-1" />
                    <span>
                      Verifikasi status konektivitas <span className="font-mono text-[11px] font-medium text-emerald-600 dark:text-emerald-400">ONLINE — SYNCED</span> tanpa antrean offline tertahan.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                <h4 className="text-[11px] uppercase tracking-widest font-mono font-medium text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Mingguan (Weekly)
                </h4>
                <ul className={`space-y-2.5 text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <li className="flex gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-1" />
                    <span>Rekonsiliasi stok fisik gudang vs saldo sistem &amp; cek mutasi barang retur.</span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-1" />
                    <span>
                      Review PO yang masih berstatus <span className="font-mono text-[11px]">Pending</span> atau <span className="font-mono text-[11px]">SYSTEM_LOCKED</span>.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-1" />
                    <span>Kliring log audit lama level DEBUG/INFO agar kapasitas penyimpanan browser tetap ringan.</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                <h4 className="text-[11px] uppercase tracking-widest font-mono font-medium text-cyan-600 dark:text-cyan-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Bulanan (Monthly)
                </h4>
                <ul className={`space-y-2.5 text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <li className="flex gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-1" />
                    <span>Tutup buku bulanan (Monthly Closing) &amp; audit General Ledger Finance.</span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-1" />
                    <span>Ekspor Full Snapshot Backup Database (format JSON) ke penyimpanan arsip aman.</span>
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-1" />
                    <span>
                      Lakukan <span className="font-medium">rotasi berkala API Token &amp; Kredensial</span> (Clover Token, Gemini Key, serta PIN Otoritas Divisi &amp; SuperAdmin).
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Emergency Action Guide (FAQ) */}
            <div className="space-y-3">
              <div className={`text-[11px] uppercase tracking-widest font-mono font-medium flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <LifeBuoy className="w-4 h-4 text-rose-500 shrink-0" /> Emergency Action Guide (FAQ)
              </div>

              <div className="p-4 rounded-xl border border-rose-500/25 bg-rose-500/5">
                <h5 className="text-[13px] font-medium tracking-wide text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Q: Terjadi selisih kas saat tutup shift atau defisit kas likuid?
                </h5>
                <p className={`text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Periksa rincian pengeluaran kas kecil (petty cash) dan retur tunai pada riwayat shift kasir, lalu cocokkan dengan General Ledger di modul Finance. Jika defisit dipicu input biaya/PO sebelum omzet masuk, jalankan protokol{' '}
                  <span className="font-mono text-[11px] font-medium">[Normalisasi Saldo Kas]</span> di Pusat Uji Sistem atau catat jurnal setoran modal tambahan.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5">
                <h5 className="text-[13px] font-medium tracking-wide text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Q: Ditemukan stok bernilai minus pada katalog SKU?
                </h5>
                <p className={`text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Jalankan sensor <span className="font-medium">Check Inventory Integrity</span> dan gunakan tombol Self-Healing{' '}
                  <span className="font-mono text-[11px] font-medium">[Karantina Stok Minus]</span> untuk menormalkan SKU terdampak, lalu lakukan Stock Opname penyesuaian resmi pada modul Warehouse agar kartu stok kembali sinkron.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-cyan-500/25 bg-cyan-500/5">
                <h5 className="text-[13px] font-medium tracking-wide text-cyan-700 dark:text-cyan-400 mb-1.5 flex items-center gap-2">
                  <Wifi className="w-3.5 h-3.5 shrink-0" /> Q: Antrean sinkronisasi offline tertahan atau Kasir POS offline di jam sibuk?
                </h5>
                <p className={`text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Tetap lanjutkan transaksi karena JacS ERP menggunakan arsitektur <span className="font-medium">Offline-First</span>. Jangan tutup paksa tab atau menghapus cache browser. Setelah internet kembali pulih, pastikan status berubah menjadi{' '}
                  <span className="font-mono text-[11px] font-medium">ONLINE — SYNCED</span>; bila antrean masih tertahan, periksa URL Supabase/GAS dan tekan{' '}
                  <span className="font-medium">Refresh &amp; Sinkronisasi Data</span> atau kirim perintah{' '}
                  <span className="font-mono text-[11px]">REMOTE_FORCE_SYNC</span> dari panel Remote Maintenance.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-blue-500/25 bg-blue-500/5">
                <h5 className="text-[13px] font-medium tracking-wide text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Q: API Token Clover / Gemini Key ditolak atau permintaan terblokir CORS?
                </h5>
                <p className={`text-xs font-normal tracking-wide leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Periksa kembali kecocokan <span className="font-medium">Merchant ID</span>, <span className="font-medium">API Token</span>, dan pilihan{' '}
                  <span className="font-medium">Environment (Production vs Sandbox)</span> di tab Manajemen Kredensial. Jika browser memblokir request langsung ke API Clover karena kebijakan CORS, pastikan URL{' '}
                  <span className="font-medium">Google Apps Script Webhook</span> atau <span className="font-medium">Supabase Edge Function (clover-proxy)</span> sudah terpasang aktif sebagai jalur proxy.
                </p>
              </div>
            </div>
          </div>
        </AccordionItem>
      </div>

      {/* Footer / Copyright SOP */}
      <div className={`text-center py-6 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0" />
          <span className="text-[11px] uppercase tracking-widest font-mono font-medium text-slate-500 dark:text-slate-400">
            JACS ERP STANDARD OPERATING PROCEDURE V3.0 — UPDATED NOVEMBER 2026
          </span>
        </div>
        <p className="text-[11px] font-normal tracking-wide text-slate-500 max-w-lg mx-auto leading-relaxed">
          Dokumen ini bersifat konfidensial dan hanya diperuntukkan bagi personil dengan hak akses SuperAdmin dan Manajemen Teknologi Informasi.
        </p>
      </div>
    </div>
  );
};
