import { callRouterAI } from './aiService';

export interface QuickQaItem {
  id: string;
  category: string;
  question: string;
  shortAnswer: string;
  detailedAnswer: string;
  tags: string[];
}

export interface AssistantChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  quickQaId?: string;
  isThinking?: boolean;
}

export const JACS_QUICK_QA_PRESETS: QuickQaItem[] = [
  {
    id: 'qa-login-pin',
    category: 'AKSES & KEAMANAN',
    question: 'Bagaimana cara login divisi & PIN akun?',
    shortAnswer: 'Pilih salah satu dari 6 kartu divisi di layar masuk, lalu ketik PIN 6-digit (Default: 123456, SuperAdmin: 999999).',
    detailedAnswer: 'JacS RetailOS menerapkan Role-Based Access Control (RBAC) presisi:\n\n1. Pilih salah satu dari 6 kartu divisi (Kasir POS, Gudang & Logistik, Pembelian & PO, Keuangan & Akuntansi, Karyawan & HR, atau Konsol SuperAdmin).\n2. Masukkan PIN keamanan divisi Anda.\n   • PIN Standar Divisi: 123456\n   • PIN Master SuperAdmin: 999999\n3. Layar Kasir POS terikat langsung ke Terminal aktif untuk mencegah selisih kas fisik.\n4. PIN divisi dapat diubah kapan saja di Konsol SuperAdmin pada tab "Otorisasi & Keamanan".',
    tags: ['login', 'pin', 'akses', 'superadmin', 'password'],
  },
  {
    id: 'qa-cloud-sync',
    category: 'DUAL-BACKEND CLOUD',
    question: 'Apa fungsi Dual-Backend Cloud Sync?',
    shortAnswer: 'Sinkronisasi real-time paralel ke Supabase (PostgreSQL) dan Google Apps Script (Spreadsheet) tanpa biaya server mahal.',
    detailedAnswer: 'Fitur Dual-Backend Cloud Sync memungkinkan koordinasi data antar-cabang dan multi-terminal:\n\n1. Jalur 1 (Supabase REST API): Menyimpan data relasional PostgreSQL berkecepatan tinggi dengan proteksi Row Level Security (RLS).\n2. Jalur 2 (Google Apps Script): Pencadangan instan dan pencatatan otomatis transaksi ke Google Sheets tanpa biaya langganan bulanan.\n3. Auto-Sync Latar Belakang: Sistem otomatis mengirim snapshot setiap ada transaksi kasir baru atau perubahan stok tanpa menghambat kasir.\n4. Tarik Data (Pull Sync): Menggabungkan data SKU dan mutasi antar terminal kasir secara cerdas.',
    tags: ['cloud', 'supabase', 'google sheets', 'sync', 'dual-backend'],
  },
  {
    id: 'qa-split-kasbon',
    category: 'KASIR & PEMBAYARAN',
    question: 'Bagaimana cara Split Payment & Kasbon DP?',
    shortAnswer: 'Tombol Split (Tunai + Non-Tunai) aktif di seluruh sektor. Tombol Kasbon/DP aktif khusus sektor Bahan Bangunan, Grosir, & Laundry.',
    detailedAnswer: 'Fleksibilitas metode bayar di modul Kasir POS:\n\n1. Split Payment (Aktif di Semua Sektor):\n   • Membagi total tagihan menjadi porsi Tunai dan Non-Tunai (QRIS / Transfer Bank / EDC Debit).\n   • Nominal sisa otomatis terhitung secara real-time hingga pas 100% sebelum tombol bayar aktif.\n2. Kasbon / DP (Aktif di Bahan Bangunan, Grosir B2B, & Laundry):\n   • Wajib memilih pelanggan terdaftar.\n   • Kasir dapat menginput Uang Muka (DP) mulai dari Rp 0.\n   • Sisa tagihan otomatis dibukukan ke Piutang Usaha (AR) dengan jatuh tempo termin 14 hari.',
    tags: ['split', 'kasbon', 'dp', 'piutang', 'pembayaran', 'qris'],
  },
  {
    id: 'qa-bom-fnb',
    category: 'F&B & KULINER',
    question: 'Bagaimana sistem BOM Resep di F&B?',
    shortAnswer: 'Penjualan menu atau topping otomatis memotong stok bahan baku mentah (biji kopi, susu, sirup) di gudang & mencatat HPP riil.',
    detailedAnswer: 'Bill of Materials (BOM) otomatis di JacS RetailOS:\n\n1. Setiap menu (misal Kopi Latte) memiliki resep bahan baku mentah (misal 18gr Biji Espresso + 150ml Susu Fresh Milk).\n2. Saat kasir mencatat transaksi penjualan, sistem otomatis membuat mutasi stok "OUT / RESEP BOM".\n3. Nilai HPP bahan baku dihitung presisi berdasarkan harga beli gudang dan otomatis dibukukan ke Jurnal Buku Besar (Debit Beban HPP, Kredit Persediaan Bahan Baku).',
    tags: ['bom', 'resep', 'fnb', 'bahan baku', 'hpp', 'dapur'],
  },
  {
    id: 'qa-backup-sha256',
    category: 'SECURITY SHIELD',
    question: 'Bagaimana backup data aman & SHA-256?',
    shortAnswer: 'Ekspor backup JSON bertanda tangan digital dengan verifikasi hash SHA-256 untuk mendeteksi file rusak atau modifikasi ilegal.',
    detailedAnswer: 'Fitur Enterprise Security Shield & Integrity Guard:\n\n1. Unduh backup bertanda tangan di Konsol SuperAdmin → tab Data Master & Migrasi.\n2. Setiap file backup menyertakan tanda tangan digital (SHA-256 hash checksum) dari seluruh payload data.\n3. Saat file diunggah untuk Restore, sistem memverifikasi keaslian hash secara kriptografis sebelum memperbarui memori dan database.\n4. Dilengkapi fitur Auto-Lock idle terminal untuk mengunci layar kasir setelah beberapa menit tanpa aktivitas.',
    tags: ['backup', 'restore', 'sha256', 'keamanan', 'enkripsi'],
  },
  {
    id: 'qa-reset-levels',
    category: 'MASTER DATA',
    question: 'Apa itu Reset Sistem Bertingkat 4 Level?',
    shortAnswer: 'Level 1: Hapus Transaksi & Jurnal; Level 2: Hapus Dummy Produk; Level 3: Reset Saldo Rp 0; Level 4: Factory Reset Total 100%.',
    detailedAnswer: 'Pusat Reset Bertingkat di Konsol SuperAdmin melindungi data sesuai kebutuhan:\n\n• Level 1 (Reset Transaksi & Jurnal): Menghapus penjualan, PO, kasir shifts, dan mutasi stok, namun mempertahankan profil usaha & katalog produk.\n• Level 2 (Kosongkan Master Produk & Kontak): Menghapus seluruh data demo produk/pelanggan/supplier dummy agar siap diisi barang riil klien.\n• Level 3 (Reset Saldo Keuangan Rp 0): Mengembalikan saldo seluruh akun COA buku besar ke Rp 0.\n• Level 4 (Factory Reset Total 100%): Menghapus seluruh memori sistem ke kondisi fresh onboarding awal.\n• Tombol "Muat Ulang Data Simulasi Demo" siap memulihkan dataset demo kapan saja.',
    tags: ['reset', 'factory reset', 'level', 'wipe', 'demo data'],
  },
];

/**
 * Intelligent local knowledge matching engine for instant, reliable answers
 * even when offline or before the user has authenticated.
 */
function findBestLocalAnswer(query: string): string | null {
  const q = query.toLowerCase().trim();

  // 1. Exact match with presets
  for (const preset of JACS_QUICK_QA_PRESETS) {
    if (preset.tags.some((t) => q.includes(t)) && (q.includes(preset.tags[0]) || q.length > 8)) {
      if (q.includes('pin') || q.includes('login') || q.includes('masuk')) return preset.detailedAnswer;
      if (q.includes('cloud') || q.includes('sync') || q.includes('supabase') || q.includes('sheet')) return preset.detailedAnswer;
      if (q.includes('split') || q.includes('kasbon') || q.includes('dp') || q.includes('tempo')) return preset.detailedAnswer;
      if (q.includes('bom') || q.includes('resep') || q.includes('fnb') || q.includes('makanan')) return preset.detailedAnswer;
      if (q.includes('backup') || q.includes('restore') || q.includes('sha') || q.includes('keamanan')) return preset.detailedAnswer;
      if (q.includes('reset') || q.includes('hapus') || q.includes('wipe') || q.includes('factory')) return preset.detailedAnswer;
    }
  }

  // 2. Specific domain knowledge
  if (q.includes('terminal') || q.includes('pc') || q.includes('loket') || q.includes('pos-01')) {
    return 'Pengaturan Terminal POS di JacS RetailOS:\n\nSetiap PC kasir dapat dikonfigurasikan sebagai terminal tertentu (misal POS-01 untuk Retail, POS-02 untuk Resto, T-05 untuk Depo Bahan Bangunan).\n• Pengaturan terminal dapat diatur di Konsol SuperAdmin → tab "Terminal & Loket Kasir".\n• Terminal yang terkunci ke perangkat ini akan otomatis mengenali transaksi shift dan mencegah bentrok kasir.';
  }

  if (q.includes('tutup shift') || q.includes('z-report') || q.includes('blind') || q.includes('selisih kas')) {
    return 'Prosedur Tutup Shift & Z-Report Kasir:\n\n1. Di modul Kasir POS, klik tombol "Tutup Shift [F9]" pada bar bawah.\n2. Sistem menerapkan Blind Close: Kasir wajib menginput hitungan fisik uang di laci kas terlebih dahulu sebelum sistem menampilkan data buku kasir.\n3. Sistem menghitung varians (selisih lebih / kurang) secara transparan dan mencetak struk Z-Report resmi dengan nama usaha dan sektor aktif Anda.';
  }

  if (q.includes('pelunasan') || q.includes('ar') || q.includes('ap') || q.includes('hutang') || q.includes('piutang')) {
    return 'Fitur Pelunasan 1-Klik Piutang (AR) & Hutang (AP):\n\nBuka modul Keuangan & Akuntansi → tab "Piutang Usaha (AR)" atau "Hutang Dagang (AP)".\n• Klik tombol "Terima Pelunasan" pada baris tagihan pelanggan, atau "Bayar Hutang" pada tagihan supplier.\n• Masukkan nominal pembayaran (bisa lunas 100% atau cicilan bertahap) dan metode bayar (Kas Tunai / Bank Transfer).\n• Jurnal akuntansi Double-Entry otomatis tercatat seketika tanpa perlu pembukuan manual.';
  }

  if (q.includes('sektor') || q.includes('ganti bisnis') || q.includes('barber') || q.includes('restoran') || q.includes('laundry')) {
    return 'Multi-Sektor Adaptif JacS RetailOS:\n\nSistem mendukung 5 model bisnis utama:\n1. RETAIL: Supermarket, minimarket, toko kelontong (barcode scanner, promo bundling, TPR supplier).\n2. F&B: Resto, kafe, coffee shop (resep BOM, cetak KOT dapur, split bill).\n3. FASHION: Butik pakaian (matriks ukuran/warna, advisor komisi, tukar ukuran selisih Rp 0).\n4. BUILDING: Depo bahan bangunan (konversi m³ pasir/batu, armada dump truck, DO surat jalan).\n5. SERVICE: Barbershop, salon & binatu laundry (komisi kapster, estimasi laundry kiloan & rak simpan).\n\nAnda dapat mengganti profil sektor usaha di Konsol SuperAdmin → tab Profil Entitas Usaha.';
  }

  return null;
}

/**
 * Ask JacS Assistant. Tries local AI router with automatic fallback
 * to rich local built-in ERP knowledge base.
 */
export async function askJacsAssistant(
  userQuestion: string,
  businessContext?: {
    businessName?: string;
    activeSector?: string;
    terminalName?: string;
  }
): Promise<string> {
  const trimmed = userQuestion.trim();
  if (!trimmed) {
    return 'Silakan ketik pertanyaan Anda mengenai sistem JacS RetailOS ERP.';
  }

  // 1. Cek jawaban cerdas lokal terlebih dahulu jika pertanyaan cocok dengan topik umum
  const localAnswer = findBestLocalAnswer(trimmed);

  // 2. Jika ada koneksi AI Router Clouvia/Gemini, coba hubungi AI untuk jawaban yang fleksibel
  try {
    const systemPrompt = `Anda adalah "JacS Assistant", asisten pintar dan konsultan teknis resmi untuk JacS RetailOS ERP & POS Architect.
Informasi sistem aktif:
- Nama Usaha: ${businessContext?.businessName || 'JacS Enterprise'}
- Sektor Aktif: ${businessContext?.activeSector || 'MULTI-SEKTOR'}
- Terminal Kasir: ${businessContext?.terminalName || 'POS-01'}

Tugas Anda:
1. Menjawab pertanyaan pengguna tentang cara penggunaan ERP, Kasir POS, Gudang, Akuntansi, Cloud Sync (Supabase/Google Sheets), Keamanan SHA-256, dan Setup.
2. Berikan jawaban yang ramah, sopan, ringkas, terstruktur (gunakan poin/langkah bernomor jika relevan), dan dalam Bahasa Indonesia.
3. Hindari asumsi fitur fiktif di luar sistem JacS RetailOS.`;

    const aiResponse = await callRouterAI({
      systemPrompt,
      userPrompt: trimmed,
      maxTokens: 450,
    });

    if (
      aiResponse &&
      !aiResponse.startsWith('[Error API') &&
      !aiResponse.startsWith('[Offline') &&
      aiResponse.length > 20
    ) {
      return aiResponse;
    }
  } catch {
    // Abaikan jika jaringan sibuk
  }

  // 3. Fallback ke jawaban lokal cerdas
  if (localAnswer) {
    return localAnswer;
  }

  return (
    `Terima kasih telah bertanya tentang "${trimmed}".\n\n` +
    `Sebagai asisten JacS RetailOS, saya dapat membantu Anda memahami:\n` +
    `• Cara Login & Pengaturan PIN Multi-Divisi (SuperAdmin, Kasir, Gudang, Keuangan)\n` +
    `• Transaksi POS (Split Payment, Kasbon/DP Tempo, Cetak Struk, Tutup Shift Z-Report)\n` +
    `• Gudang & Resep BOM (F&B Dapur, Bahan Bangunan m³, FIFO/FEFO)\n` +
    `• Integrasi Cloud (Setup Supabase REST API & Google Apps Script Spreadsheet)\n` +
    `• Keamanan Data (Backup bertanda tangan SHA-256 & Reset Bertingkat 4 Level)\n\n` +
    `Silakan pilih salah satu kartu pertanyaan di atas atau tanyakan langkah spesifik yang ingin Anda lakukan.`
  );
}
