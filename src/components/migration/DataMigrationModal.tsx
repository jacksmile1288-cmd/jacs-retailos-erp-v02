import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Download,
  Package,
  Truck,
  Users,
  Warehouse,
  Check,
  Filter,
  Search,
  Zap,
  Database,
  Layers,
  HelpCircle,
  Wand2,
  Bot,
  ChevronDown,
  ChevronUp,
  History,
  Undo2,
  ShieldAlert,
  Eye,
  FileSpreadsheet,
  Building2,
  Clock,
} from 'lucide-react';
import {
  MigrationEntityType,
  MigrationFieldDefinition,
  MigrationRowPreview,
  MigrationRowStatus,
  MigrationRowAction,
  MigrationSummaryReport,
  MigrationBatchRecord,
  MigrationBatchItemSnapshot,
  Product,
  SupplierMaster,
  CustomerMaster,
  InventoryRecord,
  StockMutation,
} from '../../types';
import {
  normalizeUOM,
  cleanFinancialNumber,
  toTitleCase,
  findSemanticDuplicateCandidate,
  fuzzyMatch,
} from '../../utils/fuzzySearch';
import {
  normalizeMultiFormatFile,
  parseDelimitedText,
  ACCEPT_ATTRIBUTE_STRING,
  ParsedDataResult,
} from './multiFormatParser';
import {
  POS_SOFTWARE_PRESETS,
  matchPresetToHeaders,
  PosSoftwarePreset,
} from './presets';

interface DataMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEntity?: MigrationEntityType;
  initialTab?: 'wizard' | 'history';
}

// =========================================================================
// 1. DEFINISI FIELD STANDAR PER ENTITAS (TARGET FIELDS)
// =========================================================================
const ENTITY_CONFIG: Record<
  MigrationEntityType,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    fields: MigrationFieldDefinition[];
    idPrefix: string;
  }
> = {
  product: {
    label: 'Produk & SKU Barang',
    description: 'Master barang dagang, barcode EAN, harga beli/modal, harga jual, dan stok awal (APS POS 1: 01_Barang)',
    icon: Package,
    idPrefix: 'BR',
    fields: [
      { key: 'name', label: 'Nama Barang / Produk', required: true, type: 'string', synonyms: ['nama barang', 'nama_barang', 'namabarang', 'nama produk', 'nama item', 'nama_item', 'nama', 'product name', 'item name', 'item', 'deskripsi', 'description'], example: 'Aqua 600ml' },
      { key: 'barcode', label: 'Barcode / Kode Batang', required: false, type: 'string', synonyms: ['barcode', 'kode barcode', 'kode_barcode', 'kode batang', 'ean', 'upc', 'plu', 'kode ean'], example: '8992753211112' },
      { key: 'sku', label: 'Kode SKU Barang', required: false, type: 'string', synonyms: ['sku', 'kode sku', 'kode barang', 'kode_barang', 'kodebarang', 'kode item', 'kode_item', 'kode', 'part number', 'item code'], example: 'SKU-AQU-001' },
      { key: 'category', label: 'Kategori Produk', required: false, type: 'string', synonyms: ['kategori', 'category', 'kelompok', 'golongan', 'departemen', 'group', 'jenis'], example: 'Minuman' },
      { key: 'brand', label: 'Merek / Brand', required: false, type: 'string', synonyms: ['merek', 'merk', 'brand', 'pabrikan', 'produsen', 'manufaktur'], example: 'Aqua' },
      { key: 'unit', label: 'Satuan (UOM)', required: false, type: 'string', synonyms: ['satuan', 'satuan_dasar', 'satuandasar', 'unit', 'uom', 'kemasan', 'satuan dasar', 'satuan1'], example: 'Botol' },
      { key: 'costPrice', label: 'Harga Beli / Modal (HPP)', required: true, type: 'number', synonyms: ['harga beli', 'harga modal', 'hpp', 'modal', 'cost price', 'biaya beli', 'harga pokok', 'harga_pokok', 'hargapokok', 'cost', 'cost of goods sold', 'cogs'], example: '3000' },
      { key: 'sellingPrice', label: 'Harga Jual (Eceran)', required: true, type: 'number', synonyms: ['harga jual', 'harga_jual', 'hargajual', 'harga_jual_1', 'hargajual1', 'harga', 'jual', 'selling price', 'price retail', 'harga ecer', 'harga retail', 'price', 'price (idr)'], example: '4000' },
      { key: 'memberPrice', label: 'Harga Member', required: false, type: 'number', synonyms: ['harga member', 'harga_member', 'hargamember', 'member price', 'member', 'harga khusus member'], example: '3800' },
      { key: 'wholesalePrice', label: 'Harga Grosir', required: false, type: 'number', synonyms: ['harga grosir', 'harga_grosir', 'hargagrosir', 'wholesale price', 'wholesale', 'grosir', 'harga partai'], example: '3600' },
      { key: 'isTaxable', label: 'Status Pajak PPN', required: false, type: 'string', synonyms: ['pajak', 'ppn', 'tax', 'taxable', 'status pajak', 'is taxable', 'pajak on', 'pajak off', 'kena pajak'], example: 'ON' },
      { key: 'stock', label: 'Stok Awal Fisik', required: false, type: 'number', synonyms: ['stok', 'stock', 'sisa stok', 'jumlah', 'qty', 'stok awal', 'saldo', 'stok_akhir', 'stokakhir', 'in stock', 'stok toko', 'current stock', 'saldo_akhir', 'qty_akhir'], example: '150' },
      { key: 'minStock', label: 'Batas Minimal Stok', required: false, type: 'number', synonyms: ['min stok', 'stok minimal', 'minimum', 'safety stock', 'min alert', 'stok aman', 'min_stok', 'minstok', 'stok_min', 'stokmin', 'low stock alert'], example: '20' },
    ],
  },
  supplier: {
    label: 'Pemasok / Supplier',
    description: 'Master rekanan distributor resmi, kontak PIC, dan termin pembayaran (APS POS 1: 02_Supplier)',
    icon: Truck,
    idPrefix: 'SP',
    fields: [
      { key: 'name', label: 'Nama Supplier / Perusahaan', required: true, type: 'string', synonyms: ['nama supplier', 'nama pemasok', 'nama distributor', 'perusahaan', 'nama', 'supplier name'], example: 'PT Sumber Makmur' },
      { key: 'contactPerson', label: 'Kontak PIC / Person', required: false, type: 'string', synonyms: ['pic', 'kontak person', 'nama kontak', 'contact person', 'penanggung jawab'], example: 'Hendra Setiawan' },
      { key: 'phone', label: 'No. Telepon / WhatsApp', required: true, type: 'string', synonyms: ['telepon', 'no telp', 'no telepon', 'no hp', 'whatsapp', 'wa', 'phone', 'contact'], example: '0812-3456-7890' },
      { key: 'email', label: 'Alamat Email', required: false, type: 'string', synonyms: ['email', 'alamat email', 'surel', 'e-mail'], example: 'order@sumbermakmur.co.id' },
      { key: 'address', label: 'Alamat Kantor / Gudang', required: false, type: 'string', synonyms: ['alamat', 'alamat kantor', 'wilayah', 'kota', 'lokasi', 'address'], example: 'Jl. Industri Raya No. 10, Jakarta' },
      { key: 'paymentTerms', label: 'Termin Pembayaran (TOP)', required: false, type: 'string', synonyms: ['termin', 'top', 'syarat pembayaran', 'tempo', 'payment terms', 'syarat bayar'], example: 'TOP 30 Hari' },
    ],
  },
  customer: {
    label: 'Pelanggan / Member',
    description: 'Master pelanggan toko, nomor kontak, tier loyalty member, dan saldo poin (APS POS 1: 03_Customer)',
    icon: Users,
    idPrefix: 'CS',
    fields: [
      { key: 'name', label: 'Nama Pelanggan', required: true, type: 'string', synonyms: ['nama pelanggan', 'nama customer', 'nama pembeli', 'nama member', 'nama', 'customer name'], example: 'Andi' },
      { key: 'phone', label: 'Nomor WhatsApp / HP', required: true, type: 'string', synonyms: ['nomor hp', 'no hp', 'no telp', 'whatsapp', 'wa', 'telepon', 'phone'], example: '0812-1111-2222' },
      { key: 'email', label: 'Alamat Email', required: false, type: 'string', synonyms: ['email', 'surel', 'alamat email', 'e-mail'], example: 'andi@gmail.com' },
      { key: 'memberTier', label: 'Tier / Level Member', required: false, type: 'string', synonyms: ['tier', 'level', 'status member', 'keanggotaan', 'kategori', 'member tier'], example: 'Gold' },
      { key: 'points', label: 'Saldo Poin Loyalty', required: false, type: 'number', synonyms: ['poin', 'points', 'saldo poin', 'reward point'], example: '250' },
    ],
  },
  inventory: {
    label: 'Penyesuaian Stok Awal',
    description: 'Sinkronisasi saldo stok fisik aktual dan nilai HPP persediaan gudang',
    icon: Warehouse,
    idPrefix: 'INV',
    fields: [
      { key: 'barcode', label: 'Barcode / Kode Barang', required: true, type: 'string', synonyms: ['barcode', 'kode barang', 'sku', 'kode barcode', 'plu', 'kode'], example: '8992753211112' },
      { key: 'name', label: 'Nama Barang (Referensi)', required: false, type: 'string', synonyms: ['nama barang', 'nama produk', 'nama item', 'deskripsi'], example: 'Aqua 600ml' },
      { key: 'stock', label: 'Stok Fisik Aktual', required: true, type: 'number', synonyms: ['stok fisik', 'stok aktual', 'stok', 'jumlah', 'qty', 'saldo fisik'], example: '250' },
      { key: 'costPrice', label: 'Nilai HPP Satuan (Rp)', required: false, type: 'number', synonyms: ['hpp satuan', 'hpp', 'harga modal', 'harga beli', 'nilai modal'], example: '3000' },
    ],
  },
};

// =========================================================================
// 2. DATA SAMPEL DEMO (UNTUK PENGUJIAN 1-KLIK & AUTO-HARMONIZER)
// =========================================================================
const DEMO_CSV_DATA: Record<MigrationEntityType, string> = {
  product: `Nama Barang,Kode Barcode,Kode SKU,Kategori,Merk,Satuan,Harga Modal,Harga Jual,Stok,Min Stok
Aqua 600ml,8992753211112,SKU-AQU-001,Minuman,Aqua,Botol,3000,4000,250,30
Indomie Goreng,8998866200225,SKU-IND-002,Makanan Instan,Indomie,Bungkus,2800,3500,320,40
indomie kuah kari ayam,8998866200226,SKU-IND-003,Makanan Instan,indomie,buah,Rp 2.800,-,"3,500.00",100,20
AQUA AIR MINERAL 600ML,8992753211113,SKU-AQU-002,Minuman,AQUA,btl,Rp 3.000,-,4.000,150,20
Minyak Goreng Sania 2L,8991234567890,SKU-SAN-001,Minyak,sania,ctn,"Rp 35.000,-",40000,50,10
Indomi Goreng Spesial,8998866200999,SKU-IND-999,Makanan,Indomie,pcs,2800,3500,80,15
Kopi Kapal Api Special Mix,8991002101014,SKU-KAP-004,Kopi & Teh,Kapal Api,sachet,1500,2000,220,30
Biskuit Khong Guan Classic 650g,8992753990019,SKU-KHG-099,Snack & Biskuit,Khong Guan,kaleng,42000,52000,45,10
Beras Pandan Wangi Premium 5kg,8998866991012,SKU-BRS-099,Minyak & Sembako,Pandan Wangi,dus,68000,79000,60,10
Saus Tiram Saori Sachet 23ml,8991004993011,SKU-SAO-099,Bumbu Dapur,Saori,sch,2200,3000,180,30
Produk Cacat Tanpa Nama,,SKU-INV-000,Umum,Unknown,biji,0,0,0,0`,

  supplier: `Nama Supplier,PIC,Telepon,Email,Alamat,Termin Pembayaran
PT Sumber Makmur,Hendra Setiawan,0812-3456-7890,order@sumbermakmur.co.id,"Jl. Industri Raya No. 10, Jakarta",TOP 30 Hari
PT Maju Jaya,Bambang Sudiro,0812-9876-5432,sales@majujaya.co.id,"Jl. Raya Daan Mogot KM 14, Tangerang",TOP 14 Hari
CV Berkah Pangan Mandiri,Ibu Fatimah,0813-8899-7711,berkahpangan@gmail.com,"Komp. Pergudangan Marunda Blok C-5, Jakarta Utara",TOP 21 Hari
PT Sejahtera Abadi Logistik,Ko Rudi,0852-3344-5566,logistik@sejahtera.co.id,"Jl. Soekarno-Hatta No. 88, Bandung",Cash on Delivery`,

  customer: `Nama Pelanggan,Nomor HP,Email,Tier,Poin
Andi,0812-1111-2222,andi@gmail.com,Gold,250
Budi,0812-3333-4444,budi@gmail.com,Platinum,580
Dewi Sartika,0813-5555-6666,dewi.sartika@yahoo.com,Silver,120
Pak RT Hendra,0856-7777-8888,hendra.rt05@gmail.com,Reguler,50`,

  inventory: `Barcode,Nama Barang,Stok Fisik,HPP Satuan
8992753211112,Aqua Air Mineral 600ml,300,3000
8998866200225,Indomie Mi Goreng Spesial 85g,350,2800
8991002105401,Teh Botol Sosro Kotak 250ml,200,3200
8991002101014,Kopi Kapal Api Special Mix 24g,250,1500`,
};

// =========================================================================
// 3. PARSER CSV ROBUST DENGAN QUOTES & DELIMITER HANDLING
// =========================================================================
function parseCsvContent(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  // Helper tokenize row with double quote support
  const tokenizeLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === ';') && !inQuotes) {
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const headers = tokenizeLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const tokens = tokenizeLine(lines[i]);
    const rowObj: Record<string, string> = {};
    headers.forEach((h, hIdx) => {
      rowObj[h] = tokens[hIdx] !== undefined ? tokens[hIdx] : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

// Helper membersihkan angka rupiah / koma / titik menjadi integer finansial bersih
function cleanNumberValue(val: any): number {
  return cleanFinancialNumber(val);
}

// =========================================================================
// 4. KOMPONEN UTAMA WIZARD
// =========================================================================
export const DataMigrationModal: React.FC<DataMigrationModalProps> = ({
  isOpen,
  onClose,
  initialEntity = 'product',
  initialTab = 'wizard',
}) => {
  const {
    products,
    setProducts,
    suppliers,
    setSuppliers,
    customers,
    setCustomers,
    inventory,
    setInventory,
    stockMutations,
    setStockMutations,
    migrationBatches,
    setMigrationBatches,
    rollbackMigrationBatch,
    activeUser,
    showToast,
    addAuditLog,
    theme,
    language,
  } = useApp();

  const isEn = language === 'en';
  const isLight = theme === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View Mode: 'wizard' | 'history'
  const [activeModalTab, setActiveModalTab] = useState<'wizard' | 'history'>(initialTab);

  // Audit Trail & Safe Rollback Dialog State
  const [selectedAuditBatch, setSelectedAuditBatch] = useState<MigrationBatchRecord | null>(null);
  const [batchToRollback, setBatchToRollback] = useState<MigrationBatchRecord | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditEntityFilter, setAuditEntityFilter] = useState<'ALL' | MigrationEntityType>('ALL');
  const [auditStatusFilter, setAuditStatusFilter] = useState<'ALL' | 'COMPLETED' | 'ROLLED_BACK'>('ALL');

  // State Step Wizard: 1 | 2 | 3 | 4
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedEntity, setSelectedEntity] = useState<MigrationEntityType>(initialEntity);

  // File & Raw Data State
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [detectedFormatInfo, setDetectedFormatInfo] = useState<{
    format: string;
    label: string;
    notes?: string;
    tables?: string[];
    activeTable?: string;
  } | null>(null);

  // Step 2 Mapping State: Record<targetFieldKey, sourceHeaderName>
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // AI Smart Harmonizer & Normalizer State
  const [isHarmonizing, setIsHarmonizing] = useState(false);
  const [harmonizeStats, setHarmonizeStats] = useState<{
    uomCount: number;
    numbersCount: number;
    titlesCount: number;
    semanticMatches: {
      rowIdx: number;
      importName: string;
      matchedName: string;
      matchedId: string;
      similarity: number;
    }[];
  } | null>(null);
  const [showHarmonizeDetails, setShowHarmonizeDetails] = useState(false);

  // Step 3 Dry Run State
  const [dryRunRows, setDryRunRows] = useState<MigrationRowPreview[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | MigrationRowStatus>('ALL');
  const [searchPreviewQuery, setSearchPreviewQuery] = useState('');

  // Step 4 Commit & Result State
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSummary, setCommitSummary] = useState<MigrationSummaryReport | null>(null);

  // Filtered Migration History Batches
  const filteredAuditBatches = useMemo(() => {
    return migrationBatches.filter((b) => {
      if (auditStatusFilter !== 'ALL' && b.status !== auditStatusFilter) return false;
      if (auditEntityFilter !== 'ALL' && b.entityType !== auditEntityFilter) return false;
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.toLowerCase();
        const matchId = b.id.toLowerCase().includes(q);
        const matchOp = b.operator.toLowerCase().includes(q);
        const matchNotes = (b.notes || '').toLowerCase().includes(q);
        const matchEntity = b.entityType.toLowerCase().includes(q);
        if (!matchId && !matchOp && !matchNotes && !matchEntity) return false;
      }
      return true;
    });
  }, [migrationBatches, auditStatusFilter, auditEntityFilter, auditSearchQuery]);

  const entityConfig = ENTITY_CONFIG[selectedEntity];

  // =========================================================================
  // HANDLER: 🤖 AI AUTO-HARMONIZE & NORMALIZE DATA
  // Standardize UOM, Clean Currency/Numbers, Title Case, Detect Semantic Duplicates
  // =========================================================================
  const handleAutoHarmonizeData = () => {
    if (rawRows.length === 0) return;
    setIsHarmonizing(true);

    setTimeout(() => {
      let uomCount = 0;
      let numbersCount = 0;
      let titlesCount = 0;
      const semanticMatches: {
        rowIdx: number;
        importName: string;
        matchedName: string;
        matchedId: string;
        similarity: number;
      }[] = [];

      // 1. Identifikasi kolom UOM
      const uomCol = columnMapping['unit'] || rawHeaders.find((h) => /satuan|unit|uom/i.test(h)) || '';

      // 2. Identifikasi kolom Angka / Finansial
      const numCols = new Set<string>();
      ['costPrice', 'sellingPrice', 'stock', 'minStock', 'points'].forEach((k) => {
        if (columnMapping[k]) numCols.add(columnMapping[k]);
      });
      rawHeaders.forEach((h) => {
        if (/harga|price|modal|jual|beli|hpp|stok|stock|poin|point|rupiah|biaya|cost|nilai/i.test(h)) {
          numCols.add(h);
        }
      });

      // 3. Identifikasi kolom Teks Nama / Merek / Kategori
      const textCols = new Set<string>();
      ['name', 'brand', 'category', 'contactPerson', 'address'].forEach((k) => {
        if (columnMapping[k]) textCols.add(columnMapping[k]);
      });
      rawHeaders.forEach((h) => {
        if (/nama|name|merek|brand|pabrik|manuf|kategori|kontak|alamat|pic/i.test(h)) {
          textCols.add(h);
        }
      });

      const nameCol = columnMapping['name'] || rawHeaders.find((h) => /nama|name|deskripsi|item/i.test(h)) || '';

      // 4. Katalog untuk perbandingan semantic duplicate (>85%)
      let catalog: { id: string; name: string }[] = [];
      if (selectedEntity === 'product' || selectedEntity === 'inventory') {
        catalog = products.map((p) => ({ id: p.id, name: p.name }));
      } else if (selectedEntity === 'supplier') {
        catalog = suppliers.map((s) => ({ id: s.id, name: s.name }));
      } else if (selectedEntity === 'customer') {
        catalog = customers.map((c) => ({ id: c.id, name: c.name }));
      }

      const nextRows = rawRows.map((row, idx) => {
        const updatedRow = { ...row };

        // a. Standardisasi Satuan (UOM): pcs/buah/biji/bh -> PCS, btl/botol -> Botol, dus/karton/ctn -> Dus
        if (uomCol && updatedRow[uomCol]) {
          const originalUom = updatedRow[uomCol];
          const normalized = normalizeUOM(originalUom);
          if (normalized !== originalUom) {
            updatedRow[uomCol] = normalized;
            uomCount++;
          }
        }

        // b. Pembersihan Nilai Finansial/Angka: "Rp 15.000,-", "15,000.00" -> integer bersih 15000
        numCols.forEach((colKey) => {
          if (updatedRow[colKey] !== undefined && updatedRow[colKey] !== '') {
            const rawVal = updatedRow[colKey];
            const cleanVal = cleanFinancialNumber(rawVal);
            const cleanStr = String(cleanVal);
            if (cleanStr !== String(rawVal).trim() || /[rp.,\s-]/i.test(String(rawVal))) {
              updatedRow[colKey] = cleanStr;
              numbersCount++;
            }
          }
        });

        // c. Kapitalisasi Teks: Rapikan penulisan nama produk dan merek menjadi Title Case
        textCols.forEach((colKey) => {
          if (updatedRow[colKey]) {
            const originalText = updatedRow[colKey];
            const titleCased = toTitleCase(originalText);
            if (titleCased !== originalText) {
              updatedRow[colKey] = titleCased;
              titlesCount++;
            }
          }
        });

        // d. Deteksi Potensi Duplikasi Semantik (Tingkat kemiripan > 85%)
        const itemNameToTest = nameCol ? updatedRow[nameCol] : '';
        if (itemNameToTest && catalog.length > 0) {
          const semMatch = findSemanticDuplicateCandidate(itemNameToTest, catalog, 0.85);
          if (semMatch) {
            semanticMatches.push({
              rowIdx: idx + 1,
              importName: itemNameToTest,
              matchedName: semMatch.matchedName,
              matchedId: semMatch.matchedId,
              similarity: Math.round(semMatch.similarity * 100),
            });
          }
        }

        return updatedRow;
      });

      setRawRows(nextRows);
      setHarmonizeStats({
        uomCount,
        numbersCount,
        titlesCount,
        semanticMatches,
      });
      setShowHarmonizeDetails(true);
      setIsHarmonizing(false);

      showToast(
        isEn
          ? `AI Harmonization applied! ${uomCount} UOMs normalized, ${numbersCount} numerical fields cleaned, ${titlesCount} texts formatted, ${semanticMatches.length} semantic duplicate candidates detected.`
          : `Harmonisasi data AI berhasil! ${uomCount} satuan UOM distandardisasi, ${numbersCount} nilai angka/rupiah dibersihkan, ${titlesCount} teks dirapikan ke Title Case, dan ${semanticMatches.length} potensi duplikasi semantik terdeteksi.`
      );
    }, 350);
  };

  // =========================================================================
  // HANDLERS STEP 1: MULTI-FORMAT UPLOAD, PRESETS & DEMO DATA
  // =========================================================================
  const computeAutoMapping = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};
    entityConfig.fields.forEach((field) => {
      const exactMatch = headers.find((h) => {
        const lowerH = h.toLowerCase().trim();
        const lowerKey = field.key.toLowerCase();
        const lowerLabel = field.label.toLowerCase();
        if (field.key === 'sellingPrice' && /modal|beli|cost|hpp|pokok/i.test(lowerH)) return false;
        if (field.key === 'costPrice' && /jual|selling|retail/i.test(lowerH)) return false;
        return lowerH === lowerKey || lowerH === lowerLabel || lowerH.includes(lowerKey);
      });

      if (exactMatch) {
        mapping[field.key] = exactMatch;
        return;
      }

      const synonymMatch = headers.find((h) => {
        const lowerH = h.toLowerCase().trim();
        const cleanHeader = lowerH.replace(/[\s_\-]+/g, '');

        if (field.key === 'sellingPrice' && /modal|beli|cost|hpp|pokok/i.test(lowerH)) {
          return false;
        }
        if (field.key === 'costPrice' && /jual|selling|retail/i.test(lowerH)) {
          return false;
        }
        if (field.key === 'minStock' && !/min|safety|minimum|aman/i.test(lowerH)) {
          return false;
        }

        return field.synonyms.some((syn) => {
          const cleanSyn = syn.toLowerCase().replace(/[\s_\-]+/g, '');
          return cleanHeader === cleanSyn || cleanHeader.includes(cleanSyn) || cleanSyn.includes(cleanHeader);
        });
      });

      mapping[field.key] = synonymMatch || '';
    });
    return mapping;
  };

  const handleLoadDemoData = () => {
    const demoCsv = DEMO_CSV_DATA[selectedEntity];
    setUploadedFileName(`demo_migrasi_${selectedEntity}.csv`);
    const { headers, rows } = parseDelimitedText(demoCsv);
    setRawHeaders(headers);
    setRawRows(rows);
    setDetectedFormatInfo({
      format: 'csv',
      label: 'CSV Demo Terstruktur',
      notes: `Data sampel demo ${selectedEntity} (${rows.length} baris)`,
    });

    const initialMapping = computeAutoMapping(headers);
    setColumnMapping(initialMapping);
    setActivePresetId(null);
    setCurrentStep(2);
    showToast(`Data demo berhasil dimuat! Ditemukan ${rows.length} baris & ${headers.length} kolom.`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadedFile(file);
    e.target.value = '';
  };

  const processUploadedFile = async (file: File) => {
    setUploadedFileName(file.name);
    setIsProcessingFile(true);

    try {
      const result = await normalizeMultiFormatFile(file);
      if (result.headers.length === 0 || result.rows.length === 0) {
        showToast('Berkas tidak memiliki data atau baris kosong.');
        setIsProcessingFile(false);
        return;
      }

      setRawHeaders(result.headers);
      setRawRows(result.rows);
      setDetectedFormatInfo({
        format: result.format,
        label: result.formatLabel,
        notes: result.notes,
        tables: result.detectedTables,
        activeTable: result.activeTable,
      });

      // Lakukan auto-mapping kolom (Smart Column Mapping)
      // Coba periksa apakah cocok dengan salah satu preset software POS Indonesia
      const targetKeys = entityConfig.fields.map((f) => f.key);
      let bestPreset: PosSoftwarePreset | null = null;
      let maxPresetMatches = 0;
      let bestPresetMapping: Record<string, string> = {};

      for (const preset of POS_SOFTWARE_PRESETS) {
        const { mapping, matchCount } = matchPresetToHeaders(preset, result.headers, targetKeys);
        if (matchCount > maxPresetMatches) {
          maxPresetMatches = matchCount;
          bestPreset = preset;
          bestPresetMapping = mapping;
        }
      }

      if (bestPreset && maxPresetMatches >= 3) {
        // Otomatis terapkan preset yang paling cocok
        setActivePresetId(bestPreset.id);
        // Lengkapi field yang belum terpetakan dengan sinonim default
        entityConfig.fields.forEach((field) => {
          if (!bestPresetMapping[field.key]) {
            const synonymMatch = result.headers.find((h) => {
              const cleanH = h.toLowerCase().trim().replace(/[\s_\-]+/g, '');
              return field.synonyms.some((syn) => {
                const cleanSyn = syn.toLowerCase().replace(/[\s_\-]+/g, '');
                return cleanH === cleanSyn || cleanH.includes(cleanSyn) || cleanSyn.includes(cleanH);
              });
            });
            bestPresetMapping[field.key] = synonymMatch || '';
          }
        });
        setColumnMapping(bestPresetMapping);
        showToast(`Format ${result.formatLabel} terdeteksi! Preset '${bestPreset.name}' diterapkan (${maxPresetMatches} kolom cocok).`);
      } else {
        // Gunakan pencocokan standar (exact & synonyms) dengan exclusion rules
        setActivePresetId(null);
        const initialMapping = computeAutoMapping(result.headers);
        setColumnMapping(initialMapping);
        showToast(result.notes || `Berkas ${result.formatLabel} berhasil dimuat! (${result.rows.length} baris)`);
      }

      setCurrentStep(2);
    } catch (err: any) {
      showToast(`Gagal memproses berkas: ${err?.message || 'Format tidak didukung'}`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleApplyPreset = (preset: PosSoftwarePreset) => {
    const targetKeys = entityConfig.fields.map((f) => f.key);
    const { mapping, matchCount } = matchPresetToHeaders(preset, rawHeaders, targetKeys);
    const mergedMapping: Record<string, string> = { ...columnMapping, ...mapping };
    setColumnMapping(mergedMapping);
    setActivePresetId(preset.id);
    showToast(`Preset '${preset.name}' diterapkan: ${matchCount} kolom berhasil dipetakan.`);
  };

  const handleResetMapping = () => {
    const emptyMapping: Record<string, string> = {};
    entityConfig.fields.forEach((f) => {
      emptyMapping[f.key] = '';
    });
    setColumnMapping(emptyMapping);
    setActivePresetId(null);
    showToast('Pemetaan kolom dikosongkan.');
  };

  const handleAutoDetectMapping = () => {
    const autoMap = computeAutoMapping(rawHeaders);
    setColumnMapping(autoMap);
    setActivePresetId(null);
    showToast('Auto-Detect kolom cerdas dijalankan.');
  };

  const handleDownloadTemplate = () => {
    let filename = `template_aps_pos1_${selectedEntity}_${isEn ? 'en' : 'id'}.csv`;
    let headers: string[] = [];
    let sampleRows: string[][] = [];

    if (selectedEntity === 'product') {
      filename = `template_aps_pos1_barang_${isEn ? 'en' : 'id'}.csv`;
      headers = isEn
        ? ['Name', 'Barcode', 'SKU', 'Category', 'Brand', 'Unit', 'Cost Price', 'Selling Price', 'Member Price', 'Wholesale Price', 'Stock', 'Min Stock', 'Is Taxable']
        : ['Nama Barang', 'Barcode', 'SKU', 'Kategori', 'Merek', 'Satuan', 'Harga Modal', 'Harga Jual', 'Harga Member', 'Harga Grosir', 'Stok', 'Min Stok', 'Status Pajak'];
      sampleRows = [
        ['Aqua 600ml', '8992753211112', 'SKU-AQU-001', 'Minuman', 'Aqua', 'Botol', '3000', '4000', '3800', '3600', '150', '20', 'ON'],
        ['Indomie Goreng', '8998866200225', 'SKU-IND-002', 'Makanan Instan', 'Indomie', 'Bungkus', '2800', '3500', '3400', '3200', '200', '30', 'ON'],
      ];
    } else if (selectedEntity === 'supplier') {
      filename = `template_aps_pos1_supplier_${isEn ? 'en' : 'id'}.csv`;
      headers = isEn
        ? ['Supplier Code', 'Supplier Name', 'Contact Person', 'Phone / WhatsApp', 'Email', 'Address', 'Payment Terms']
        : ['Kode Supplier', 'Nama Supplier', 'Kontak Person', 'No Telepon / WhatsApp', 'Email', 'Alamat', 'Termin Pembayaran'];
      sampleRows = [
        ['SP000003', 'PT Sumber Makmur Sejahtera', 'Hendra Setiawan', '081234567890', 'order@sumbermakmur.co.id', 'Jl. Industri Raya No. 10, Jakarta', 'TOP 30 Hari'],
        ['SP000004', 'CV Pangan Jaya Sentosa', 'Dewi Lestari', '081398765432', 'sales@panganjaya.com', 'Jl. Rungkut Industri III No. 45, Surabaya', 'TOP 14 Hari'],
      ];
    } else if (selectedEntity === 'customer') {
      filename = `template_aps_pos1_pelanggan_${isEn ? 'en' : 'id'}.csv`;
      headers = isEn
        ? ['Customer Code', 'Customer Name', 'Phone / WhatsApp', 'Email', 'Member Tier', 'Loyalty Points']
        : ['Kode Pelanggan', 'Nama Pelanggan', 'Nomor WhatsApp / HP', 'Email', 'Tier Member', 'Saldo Poin'];
      sampleRows = [
        ['CS000003', 'Budi Santoso', '081211112222', 'budi.santoso@gmail.com', 'Gold', '250'],
        ['CS000004', 'Siti Rahmawati', '081344445555', 'siti.rahma@yahoo.com', 'Silver', '100'],
      ];
    } else {
      // inventory (penyesuaian stok awal)
      filename = `template_aps_pos1_penyesuaian_stok_${isEn ? 'en' : 'id'}.csv`;
      headers = isEn
        ? ['Barcode', 'Item Name', 'Actual Physical Stock', 'Unit Cost Price']
        : ['Kode Barcode', 'Nama Barang', 'Stok Fisik Aktual', 'Nilai HPP Satuan'];
      sampleRows = [
        ['8992753211112', 'Aqua 600ml', '250', '3000'],
        ['8998866200225', 'Indomie Goreng', '320', '2800'],
      ];
    }

    const escapeCsv = (val: string) => `"${String(val).replace(/"/g, '""')}"`;
    const headerLine = headers.map(escapeCsv).join(',');
    const sampleLines = sampleRows.map((r) => r.map(escapeCsv).join(',')).join('\n');
    const csvContent = '\uFEFF' + `${headerLine}\n${sampleLines}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(
      isEn
        ? `Canonical APS POS 1 template (${entityConfig.label}) downloaded!`
        : `Template baku APS POS 1 (${entityConfig.label}) siap pakai berhasil diunduh!`
    );
  };

  // =========================================================================
  // HANDLERS STEP 2 -> STEP 3: DRY RUN SIMULATION & MASTER MATCHING
  // =========================================================================
  const runDryRunSimulation = () => {
    // Validasi apakah kolom wajib sudah terpetakan
    const missingRequired = entityConfig.fields.filter((f) => f.required && !columnMapping[f.key]);
    if (missingRequired.length > 0) {
      showToast(`Kolom wajib belum dipetakan: ${missingRequired.map((f) => f.label).join(', ')}`);
      return;
    }

    const previews: MigrationRowPreview[] = [];
    const seenBarcodes = new Set<string>();
    const seenNames = new Set<string>();

    rawRows.forEach((raw, idx) => {
      const mapped: Record<string, any> = {};
      entityConfig.fields.forEach((field) => {
        const sourceCol = columnMapping[field.key];
        const rawVal = sourceCol ? raw[sourceCol] : '';
        if (field.type === 'number') {
          const num = cleanNumberValue(rawVal);
          if (field.key === 'minStock' && (!sourceCol || rawVal === undefined || rawVal === '' || isNaN(num) || num <= 0)) {
            mapped[field.key] = 5;
          } else {
            mapped[field.key] = num;
          }
        } else {
          mapped[field.key] = (rawVal || '').trim();
        }
      });

      let status: MigrationRowStatus = 'NEW';
      let action: MigrationRowAction = 'CREATE';
      const statusReasons: string[] = [];
      let matchedId: string | undefined = undefined;
      let matchedName: string | undefined = undefined;

      // 1. Validasi Keabsahan (INVALID)
      if (selectedEntity === 'product') {
        if (!mapped.name) {
          status = 'INVALID';
          action = 'SKIP';
          statusReasons.push('Nama barang kosong / tidak ada');
        } else if (mapped.sellingPrice <= 0 && mapped.costPrice <= 0) {
          status = 'INVALID';
          action = 'SKIP';
          statusReasons.push('Harga beli dan harga jual bernilai 0 / tidak valid');
        }
      } else if (selectedEntity === 'supplier') {
        if (!mapped.name) {
          status = 'INVALID';
          action = 'SKIP';
          statusReasons.push('Nama supplier tidak boleh kosong');
        }
      } else if (selectedEntity === 'customer') {
        if (!mapped.name) {
          status = 'INVALID';
          action = 'SKIP';
          statusReasons.push('Nama pelanggan tidak boleh kosong');
        }
      } else if (selectedEntity === 'inventory') {
        if (!mapped.barcode) {
          status = 'INVALID';
          action = 'SKIP';
          statusReasons.push('Barcode / kode barang tidak boleh kosong');
        }
      }

      // 2. Deteksi Duplikat di dalam Berkas (DUPLICATE)
      if (status !== 'INVALID') {
        const identifier = mapped.barcode || mapped.phone || mapped.name.toLowerCase();
        if (identifier) {
          if (seenBarcodes.has(identifier)) {
            status = 'DUPLICATE';
            action = 'SKIP';
            statusReasons.push('Data duplikat terdeteksi berulang di dalam berkas impor');
          } else {
            seenBarcodes.add(identifier);
          }
        }
      }

      // 3. Pencocokan ke Master Data Aktif (MATCHED / LINK EXISTING)
      if (status !== 'INVALID' && status !== 'DUPLICATE') {
        if (selectedEntity === 'product') {
          const matchedProd = products.find(
            (p) =>
              (mapped.barcode && p.barcode && p.barcode === mapped.barcode) ||
              (mapped.sku && p.sku && p.sku === mapped.sku) ||
              (p.name && p.name.toLowerCase() === mapped.name.toLowerCase())
          );
          if (matchedProd) {
            status = 'MATCHED';
            action = 'UPDATE';
            matchedId = matchedProd.id;
            matchedName = matchedProd.name;
            statusReasons.push(
              isEn
                ? `Matched with existing product ${matchedProd.id} (${matchedProd.name})`
                : `Cocok dengan produk ${matchedProd.id} (${matchedProd.name})`
            );
          } else {
            // Deteksi Potensi Duplikasi Semantik (>85%)
            const semMatch = findSemanticDuplicateCandidate(
              mapped.name,
              products.map((p) => ({ id: p.id, name: p.name })),
              0.85
            );
            if (semMatch) {
              statusReasons.push(
                isEn
                  ? `🤖 AI Suggestion: Potential semantic duplicate (${semMatch.similarity}% match with "${semMatch.matchedName}" [${semMatch.matchedId}])`
                  : `🤖 Saran AI: Terdeteksi potensi duplikasi semantik (${Math.round(semMatch.similarity * 100)}% mirip dengan "${semMatch.matchedName}" [${semMatch.matchedId}])`
              );
            }
            statusReasons.push(
              isEn ? 'New product ready for creation with ID BRxxxxxx' : 'Produk baru siap didaftarkan dengan ID BRxxxxxx'
            );
          }
        } else if (selectedEntity === 'supplier') {
          const matchedSup = suppliers.find(
            (s) =>
              (mapped.phone && s.phone && s.phone.replace(/\D/g, '') === mapped.phone.replace(/\D/g, '')) ||
              s.name.toLowerCase() === mapped.name.toLowerCase()
          );
          if (matchedSup) {
            status = 'MATCHED';
            action = 'UPDATE';
            matchedId = matchedSup.id;
            matchedName = matchedSup.name;
            statusReasons.push(
              isEn
                ? `Matched with supplier ${matchedSup.id} (${matchedSup.name})`
                : `Cocok dengan supplier ${matchedSup.id} (${matchedSup.name})`
            );
          } else {
            const semMatch = findSemanticDuplicateCandidate(
              mapped.name,
              suppliers.map((s) => ({ id: s.id, name: s.name })),
              0.85
            );
            if (semMatch) {
              statusReasons.push(
                isEn
                  ? `🤖 AI Suggestion: Potential semantic duplicate (${Math.round(semMatch.similarity * 100)}% match with "${semMatch.matchedName}" [${semMatch.matchedId}])`
                  : `🤖 Saran AI: Terdeteksi potensi duplikasi semantik (${Math.round(semMatch.similarity * 100)}% mirip dengan "${semMatch.matchedName}" [${semMatch.matchedId}])`
              );
            }
            statusReasons.push(
              isEn ? 'New supplier ready for creation with ID SPxxxxxx' : 'Supplier baru siap didaftarkan dengan ID SPxxxxxx'
            );
          }
        } else if (selectedEntity === 'customer') {
          const cleanPhone = (mapped.phone || '').replace(/\D/g, '');
          const matchedCust = customers.find(
            (c) =>
              (cleanPhone && c.phone && c.phone.replace(/\D/g, '') === cleanPhone) ||
              c.name.toLowerCase() === mapped.name.toLowerCase()
          );
          if (matchedCust) {
            status = 'MATCHED';
            action = 'UPDATE';
            matchedId = matchedCust.id;
            matchedName = matchedCust.name;
            statusReasons.push(
              isEn
                ? `Matched with customer ${matchedCust.id} (${matchedCust.name})`
                : `Cocok dengan pelanggan ${matchedCust.id} (${matchedCust.name})`
            );
          } else {
            const semMatch = findSemanticDuplicateCandidate(
              mapped.name,
              customers.map((c) => ({ id: c.id, name: c.name })),
              0.85
            );
            if (semMatch) {
              statusReasons.push(
                isEn
                  ? `🤖 AI Suggestion: Potential semantic duplicate (${Math.round(semMatch.similarity * 100)}% match with "${semMatch.matchedName}" [${semMatch.matchedId}])`
                  : `🤖 Saran AI: Terdeteksi potensi duplikasi semantik (${Math.round(semMatch.similarity * 100)}% mirip dengan "${semMatch.matchedName}" [${semMatch.matchedId}])`
              );
            }
            statusReasons.push(
              isEn ? 'New customer ready for creation with ID CSxxxxxx' : 'Pelanggan baru siap didaftarkan dengan ID CSxxxxxx'
            );
          }
        } else if (selectedEntity === 'inventory') {
          const matchedProd = products.find(
            (p) =>
              (p.barcode && p.barcode === mapped.barcode) ||
              (p.sku && p.sku === mapped.barcode) ||
              p.id === mapped.barcode
          );
          if (matchedProd) {
            status = 'MATCHED';
            action = 'UPDATE';
            matchedId = matchedProd.id;
            matchedName = matchedProd.name;
            statusReasons.push(
              isEn
                ? `Matched with master item ${matchedProd.id} (${matchedProd.name})`
                : `Cocok dengan master barang ${matchedProd.id} (${matchedProd.name})`
            );
          } else {
            status = 'INVALID';
            action = 'SKIP';
            statusReasons.push(
              isEn
                ? `Barcode "${mapped.barcode}" not found in product master database`
                : `Barcode "${mapped.barcode}" tidak ditemukan di database master produk`
            );
          }
        }
      }

      previews.push({
        rowIndex: idx + 1,
        raw,
        mapped,
        status,
        statusReasons,
        action,
        matchedId,
        matchedName,
      });
    });

    setDryRunRows(previews);
    setCurrentStep(3);
    showToast('Dry run simulasi selesai! Periksa status pencocokan baris.');
  };

  // Toggle Action Baris Individu
  const handleUpdateRowAction = (rowIndex: number, newAction: MigrationRowAction) => {
    setDryRunRows((prev) =>
      prev.map((r) => (r.rowIndex === rowIndex ? { ...r, action: newAction } : r))
    );
  };

  // Bulk Actions Step 3
  const handleBulkSetAction = (targetStatus: MigrationRowStatus, newAction: MigrationRowAction) => {
    setDryRunRows((prev) =>
      prev.map((r) => (r.status === targetStatus ? { ...r, action: newAction } : r))
    );
    showToast(`Seluruh baris berstatus ${targetStatus} diatur ke ${newAction}`);
  };

  // =========================================================================
  // HANDLERS STEP 4: COMMIT RECONCILIATION (IDEMPOTENT & REAKTIF)
  // =========================================================================
  const handleCommitMigration = () => {
    setIsCommitting(true);

    setTimeout(() => {
      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      const validRowsToProcess = dryRunRows.filter((r) => r.action !== 'SKIP');
      skippedCount = dryRunRows.filter((r) => r.action === 'SKIP').length;

      const migrationBatchNo = `MIG-BATCH-${Date.now().toString().slice(-6)}`;
      const timeStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const newStockMutations: StockMutation[] = [];
      const createdItemIds: string[] = [];
      const affectedItems: MigrationBatchItemSnapshot[] = [];

      // -------------------------------------------------------------------
      // 1. Commit Produk
      // -------------------------------------------------------------------
      if (selectedEntity === 'product') {
        const nextProducts = [...products];
        const nextInventory = [...inventory];

        // Cari sequence terakhir BRxxxxxx
        let maxBrSeq = 53;
        products.forEach((p) => {
          if (p.id.startsWith('BR')) {
            const num = parseInt(p.id.replace('BR', ''), 10);
            if (!isNaN(num) && num > maxBrSeq) maxBrSeq = num;
          }
        });

        validRowsToProcess.forEach((row, rowIdx) => {
          const m = row.mapped;
          const cost = m.costPrice || 0;
          const sell = m.sellingPrice || 0;
          const memberPr = (m.memberPrice !== undefined && m.memberPrice > 0) ? m.memberPrice : sell;
          const wholesalePr = (m.wholesalePrice !== undefined && m.wholesalePrice > 0) ? m.wholesalePrice : sell;
          const taxableVal = m.isTaxable !== undefined && m.isTaxable !== ''
            ? /on|yes|1|true|ya|aktif/i.test(String(m.isTaxable))
            : true;
          const stock = m.stock || 0;
          const minStk = m.minStock > 0 ? m.minStock : 5;

          if (row.action === 'UPDATE' && row.matchedId) {
            const idx = nextProducts.findIndex((p) => p.id === row.matchedId);
            if (idx >= 0) {
              const current = nextProducts[idx];
              const prevStock = current.stock ?? 0;
              nextProducts[idx] = {
                ...current,
                name: m.name || current.name,
                category: m.category || current.category,
                brand: m.brand || current.brand,
                unit: m.unit || current.unit,
                costPrice: cost > 0 ? cost : current.costPrice,
                cost_price: cost > 0 ? cost : current.cost_price,
                sellingPrice: sell > 0 ? sell : current.sellingPrice,
                sell_price: sell > 0 ? sell : current.sell_price,
                memberPrice: memberPr,
                price_member: memberPr,
                wholesalePrice: wholesalePr,
                price_wholesale: wholesalePr,
                taxable: taxableVal,
                isTaxable: taxableVal,
                stock: stock >= 0 ? stock : current.stock,
                minStock: minStk > 0 ? minStk : current.minStock,
                min_stock: minStk > 0 ? minStk : current.min_stock,
                status: 'ACTIVE',
              };

              // Sinkronisasi record inventory real-time
              const invIdx = nextInventory.findIndex((inv) => inv.product_id === row.matchedId);
              if (invIdx >= 0) {
                nextInventory[invIdx] = {
                  ...nextInventory[invIdx],
                  product_name: m.name || nextInventory[invIdx].product_name,
                  final_stock: stock >= 0 ? stock : current.stock,
                  last_update: timeStr,
                };
              } else {
                nextInventory.unshift({
                  product_id: row.matchedId,
                  product_name: m.name || current.name,
                  initial_stock: stock,
                  in_qty: stock,
                  out_qty: 0,
                  final_stock: stock,
                  last_update: timeStr,
                });
              }

              // Catat riwayat mutasi masuk ke Stock Ledger jika nilai stok > 0
              if (stock > 0) {
                newStockMutations.push({
                  id: `MUT-MIG-${Date.now()}-${rowIdx}`,
                  timestamp: timeStr,
                  product_id: row.matchedId,
                  product_name: m.name || current.name,
                  type: 'OPENING_STOCK_MIGRATION',
                  qty: stock,
                  previous_stock: prevStock,
                  final_stock: stock,
                  balanceAfter: stock,
                  reference_no: migrationBatchNo,
                  referenceId: migrationBatchNo,
                  warehouse: 'GD001 - Gudang Utama',
                  notes: isEn ? 'Legacy System Opening Stock Migration' : 'Migrasi Stok Awal Sistem Lama',
                  operator: `${activeUser?.name || 'Administrator'} (${activeUser?.role || 'Super Admin'})`,
                });
              }

              affectedItems.push({
                id: row.matchedId,
                name: m.name || current.name,
                action: 'UPDATE',
                prevStock: prevStock,
                newStock: stock >= 0 ? stock : current.stock,
                prevCostPrice: current.costPrice,
                newCostPrice: cost > 0 ? cost : current.costPrice,
                prevSellingPrice: current.sellingPrice,
                newSellingPrice: sell > 0 ? sell : current.sellingPrice,
              });

              updatedCount++;
            }
          } else if (row.action === 'CREATE') {
            maxBrSeq++;
            const newId = `BR${String(maxBrSeq).padStart(6, '0')}`;
            createdItemIds.push(newId);
            affectedItems.push({
              id: newId,
              name: m.name,
              action: 'CREATE',
              prevStock: 0,
              newStock: stock,
              prevCostPrice: cost,
              newCostPrice: cost,
              prevSellingPrice: sell,
              newSellingPrice: sell,
            });
            const newProduct: Product = {
              id: newId,
              barcode: m.barcode || `899${Math.floor(100000000 + Math.random() * 900000000)}`,
              sku: m.sku || `SKU-${newId}`,
              name: m.name,
              category: m.category || 'Ritel & Kelontong',
              brand: m.brand || 'Umum',
              unit: m.unit || 'Pcs',
              costPrice: cost,
              cost_price: cost,
              sellingPrice: sell,
              sell_price: sell,
              memberPrice: memberPr,
              price_member: memberPr,
              wholesalePrice: wholesalePr,
              price_wholesale: wholesalePr,
              taxable: taxableVal,
              isTaxable: taxableVal,
              stock: stock,
              minStock: minStk,
              min_stock: minStk,
              status: 'ACTIVE',
              itemType: 'RETAIL',
            };
            nextProducts.unshift(newProduct);

            // Tambahkan record inventory real-time
            nextInventory.unshift({
              product_id: newId,
              product_name: m.name,
              initial_stock: stock,
              in_qty: stock,
              out_qty: 0,
              final_stock: stock,
              last_update: timeStr,
            });

            // Catat riwayat mutasi masuk ke Stock Ledger jika nilai stok > 0
            if (stock > 0) {
              newStockMutations.push({
                id: `MUT-MIG-${Date.now()}-${rowIdx}`,
                timestamp: timeStr,
                product_id: newId,
                product_name: m.name,
                type: 'OPENING_STOCK_MIGRATION',
                qty: stock,
                previous_stock: 0,
                final_stock: stock,
                balanceAfter: stock,
                reference_no: migrationBatchNo,
                referenceId: migrationBatchNo,
                warehouse: 'GD001 - Gudang Utama',
                notes: isEn ? 'Legacy System Opening Stock Migration' : 'Migrasi Stok Awal Sistem Lama',
                operator: `${activeUser?.name || 'Administrator'} (${activeUser?.role || 'Super Admin'})`,
              });
            }

            importedCount++;
          }
        });

        setProducts(nextProducts);
        setInventory(nextInventory);
        localStorage.setItem('jacs_erp_products', JSON.stringify(nextProducts));
        localStorage.setItem('jacs_erp_inventory', JSON.stringify(nextInventory));
      }

      // -------------------------------------------------------------------
      // 2. Commit Supplier
      // -------------------------------------------------------------------
      else if (selectedEntity === 'supplier') {
        const nextSuppliers = [...suppliers];
        let maxSpSeq = 2;
        suppliers.forEach((s) => {
          if (s.id.startsWith('SP')) {
            const num = parseInt(s.id.replace('SP', ''), 10);
            if (!isNaN(num) && num > maxSpSeq) maxSpSeq = num;
          }
        });

        validRowsToProcess.forEach((row) => {
          const m = row.mapped;
          if (row.action === 'UPDATE' && row.matchedId) {
            const idx = nextSuppliers.findIndex((s) => s.id === row.matchedId);
            if (idx >= 0) {
              affectedItems.push({ id: row.matchedId, name: m.name || nextSuppliers[idx].name, action: 'UPDATE' });
              nextSuppliers[idx] = {
                ...nextSuppliers[idx],
                name: m.name || nextSuppliers[idx].name,
                contactPerson: m.contactPerson || nextSuppliers[idx].contactPerson,
                phone: m.phone || nextSuppliers[idx].phone,
                email: m.email || nextSuppliers[idx].email,
                address: m.address || nextSuppliers[idx].address,
                paymentTerms: m.paymentTerms || nextSuppliers[idx].paymentTerms,
              };
              updatedCount++;
            }
          } else if (row.action === 'CREATE') {
            maxSpSeq++;
            const newId = `SP${String(maxSpSeq).padStart(6, '0')}`;
            createdItemIds.push(newId);
            affectedItems.push({ id: newId, name: m.name, action: 'CREATE' });
            const newSupplier: SupplierMaster = {
              id: newId,
              code: newId,
              name: m.name,
              contactPerson: m.contactPerson || 'Account Executive',
              phone: m.phone || '0812-0000-0000',
              email: m.email || `contact@${m.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.id`,
              address: m.address || 'Alamat Belum Terdaftar',
              paymentTerms: m.paymentTerms || 'TOP 14 Hari',
              activePoCount: 0,
              status: 'Active',
            };
            nextSuppliers.unshift(newSupplier);
            importedCount++;
          }
        });

        setSuppliers(nextSuppliers);
        localStorage.setItem('jacs_erp_suppliers', JSON.stringify(nextSuppliers));
      }

      // -------------------------------------------------------------------
      // 3. Commit Customer
      // -------------------------------------------------------------------
      else if (selectedEntity === 'customer') {
        const nextCustomers = [...customers];
        let maxCsSeq = 2;
        customers.forEach((c) => {
          if (c.id.startsWith('CS')) {
            const num = parseInt(c.id.replace('CS', ''), 10);
            if (!isNaN(num) && num > maxCsSeq) maxCsSeq = num;
          }
        });

        validRowsToProcess.forEach((row) => {
          const m = row.mapped;
          if (row.action === 'UPDATE' && row.matchedId) {
            const idx = nextCustomers.findIndex((c) => c.id === row.matchedId);
            if (idx >= 0) {
              affectedItems.push({ id: row.matchedId, name: m.name || nextCustomers[idx].name, action: 'UPDATE' });
              nextCustomers[idx] = {
                ...nextCustomers[idx],
                name: m.name || nextCustomers[idx].name,
                phone: m.phone || nextCustomers[idx].phone,
                email: m.email || nextCustomers[idx].email,
                memberTier: m.memberTier || nextCustomers[idx].memberTier,
                points: m.points !== undefined ? m.points : nextCustomers[idx].points,
              };
              updatedCount++;
            }
          } else if (row.action === 'CREATE') {
            maxCsSeq++;
            const newId = `CS${String(maxCsSeq).padStart(6, '0')}`;
            createdItemIds.push(newId);
            affectedItems.push({ id: newId, name: m.name, action: 'CREATE' });
            const newCustomer: CustomerMaster = {
              id: newId,
              code: newId,
              customer_code: newId,
              name: m.name,
              phone: m.phone || '0812-0000-0000',
              email: m.email || '',
              memberTier: m.memberTier || 'Reguler',
              points: m.points || 0,
              totalSpent: 0,
              total_spending_current_period: 0,
              status: 'Active',
              allowed_tiers: ['RETAIL', 'MEMBER'],
              has_store: false,
            };
            nextCustomers.unshift(newCustomer);
            importedCount++;
          }
        });

        setCustomers(nextCustomers);
        localStorage.setItem('jacs_erp_customers', JSON.stringify(nextCustomers));
      }

      // -------------------------------------------------------------------
      // 4. Commit Inventory Penyesuaian Stok
      // -------------------------------------------------------------------
      else if (selectedEntity === 'inventory') {
        const nextProducts = [...products];
        const nextInventory = [...inventory];

        validRowsToProcess.forEach((row, rowIdx) => {
          const m = row.mapped;
          if (row.matchedId) {
            const pIdx = nextProducts.findIndex((p) => p.id === row.matchedId);
            if (pIdx >= 0) {
              const currentProd = nextProducts[pIdx];
              const prevStock = currentProd.stock ?? 0;
              const newStock = m.stock ?? 0;

              nextProducts[pIdx] = {
                ...currentProd,
                stock: newStock,
                costPrice: m.costPrice > 0 ? m.costPrice : currentProd.costPrice,
                cost_price: m.costPrice > 0 ? m.costPrice : currentProd.cost_price,
              };

              const invIdx = nextInventory.findIndex((inv) => inv.product_id === row.matchedId);
              if (invIdx >= 0) {
                nextInventory[invIdx] = {
                  ...nextInventory[invIdx],
                  product_name: currentProd.name,
                  final_stock: newStock,
                  last_update: timeStr,
                };
              } else {
                nextInventory.unshift({
                  product_id: row.matchedId,
                  product_name: currentProd.name,
                  initial_stock: newStock,
                  in_qty: newStock,
                  out_qty: 0,
                  final_stock: newStock,
                  last_update: timeStr,
                });
              }

              // Catat riwayat mutasi masuk ke Stock Ledger jika nilai stok > 0
              if (newStock > 0) {
                newStockMutations.push({
                  id: `MUT-MIG-${Date.now()}-${rowIdx}`,
                  timestamp: timeStr,
                  product_id: row.matchedId,
                  product_name: currentProd.name,
                  type: 'OPENING_STOCK_MIGRATION',
                  qty: newStock,
                  previous_stock: prevStock,
                  final_stock: newStock,
                  balanceAfter: newStock,
                  reference_no: migrationBatchNo,
                  referenceId: migrationBatchNo,
                  warehouse: 'GD001 - Gudang Utama',
                  notes: isEn ? 'Legacy System Opening Stock Migration' : 'Migrasi Stok Awal Sistem Lama',
                  operator: `${activeUser?.name || 'Administrator'} (${activeUser?.role || 'Super Admin'})`,
                });
              }

              affectedItems.push({
                id: row.matchedId,
                name: currentProd.name,
                action: 'UPDATE',
                prevStock: prevStock,
                newStock: newStock,
              });

              updatedCount++;
            }
          }
        });

        setProducts(nextProducts);
        setInventory(nextInventory);
        localStorage.setItem('jacs_erp_products', JSON.stringify(nextProducts));
        localStorage.setItem('jacs_erp_inventory', JSON.stringify(nextInventory));
      }

      // Sinkronisasi mutasi ke AppContext & LocalStorage jika ada
      if (newStockMutations.length > 0) {
        setStockMutations((prev) => [...newStockMutations, ...prev]);
        const currentSaved = localStorage.getItem('jacs_erp_stock_mutations');
        const parsedSaved = currentSaved ? JSON.parse(currentSaved) : [];
        localStorage.setItem(
          'jacs_erp_stock_mutations',
          JSON.stringify([...newStockMutations, ...(Array.isArray(parsedSaved) ? parsedSaved : [])])
        );
      }

      const summary: MigrationSummaryReport = {
        entityType: selectedEntity,
        totalRows: dryRunRows.length,
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        failed: failedCount,
        timestamp: new Date().toLocaleString(isEn ? 'en-US' : 'id-ID'),
        batchNumber: migrationBatchNo,
        stockLedgerEntriesCount: newStockMutations.length,
        targetWarehouse: 'GD001 - Gudang Utama',
      };

      const batchRecord: MigrationBatchRecord = {
        id: migrationBatchNo,
        timestamp: timeStr,
        entityType: selectedEntity,
        totalRows: dryRunRows.length,
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        failed: failedCount,
        operator: `${activeUser?.name || 'Administrator'} (${activeUser?.role || 'Super Admin'})`,
        status: 'COMPLETED',
        targetWarehouse: 'GD001 - Gudang Utama',
        createdItemIds,
        affectedItems,
        stockLedgerEntriesCount: newStockMutations.length,
        notes: isEn
          ? `Migration of ${entityConfig.label} (${dryRunRows.length} rows processed)`
          : `Migrasi data ${entityConfig.label} (${dryRunRows.length} baris diproses)`,
      };

      setMigrationBatches((prev) => [batchRecord, ...prev]);

      setCommitSummary(summary);
      setIsCommitting(false);
      setCurrentStep(4);

      // Audit Log ERP (Dukungan Bilingual)
      if (newStockMutations.length > 0) {
        addAuditLog(
          isEn
            ? `Opening Stock Migration: Recorded ${newStockMutations.length} stock ledger entries to GD001 - Gudang Utama under batch [${migrationBatchNo}]`
            : `Migrasi Stok Awal: Mencatat ${newStockMutations.length} entri kartu stok ke GD001 - Gudang Utama dengan nomor batch [${migrationBatchNo}]`,
          'WAREHOUSE',
          'INFO'
        );
      }

      addAuditLog(
        isEn
          ? `Data Migration Wizard: Imported ${importedCount} new, ${updatedCount} updated, ${skippedCount} skipped in entity ${entityConfig.label}. Batch: ${migrationBatchNo}`
          : `Data Migration Wizard: Diimpor ${importedCount} baru, ${updatedCount} diperbarui, ${skippedCount} dilewati pada entitas ${entityConfig.label}. Batch: ${migrationBatchNo}`,
        'DATA_MIGRATION',
        'INFO'
      );

      showToast(
        isEn
          ? `Migration completed! ${importedCount} created, ${updatedCount} updated. ${
              newStockMutations.length > 0
                ? `${newStockMutations.length} opening stock entries logged to Stock Ledger (${migrationBatchNo}).`
                : ''
            }`
          : `Migrasi data selesai! ${importedCount} data baru dibuat, ${updatedCount} diperbarui. ${
              newStockMutations.length > 0
                ? `${newStockMutations.length} stok awal dicatat ke Kartu Stok (${migrationBatchNo}).`
                : ''
            }`
      );
    }, 600);
  };

  // Reset wizard untuk migrasi ulang
  const handleResetWizard = () => {
    setCurrentStep(1);
    setUploadedFileName('');
    setRawHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setHarmonizeStats(null);
    setShowHarmonizeDetails(false);
    setDryRunRows([]);
    setCommitSummary(null);
    setStatusFilter('ALL');
  };

  // Filter Baris Preview di Step 3
  const filteredPreviewRows = useMemo(() => {
    return dryRunRows.filter((r) => {
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const q = searchPreviewQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (r.mapped.name && String(r.mapped.name).toLowerCase().includes(q)) ||
        (r.mapped.barcode && String(r.mapped.barcode).toLowerCase().includes(q)) ||
        (r.matchedId && r.matchedId.toLowerCase().includes(q)) ||
        (r.matchedName && r.matchedName.toLowerCase().includes(q));
      return matchStatus && matchQuery;
    });
  }, [dryRunRows, statusFilter, searchPreviewQuery]);

  // Statistik Profiling di Step 2
  const profilingStats = useMemo(() => {
    const totalFields = entityConfig.fields.length;
    const requiredFields = entityConfig.fields.filter((f) => f.required);
    const mappedRequiredCount = requiredFields.filter((f) => Boolean(columnMapping[f.key])).length;
    const isReady = mappedRequiredCount === requiredFields.length;
    return {
      totalRows: rawRows.length,
      totalCols: rawHeaders.length,
      isReady,
      mappedRequiredCount,
      totalRequiredCount: requiredFields.length,
    };
  }, [entityConfig, columnMapping, rawRows, rawHeaders]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-5xl rounded-3xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f141c] border-cyan-500/30 text-white'
        }`}
      >
        {/* =================================================================
            MODAL HEADER
            ================================================================= */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between gap-4 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#161d27] border-gray-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.45)] shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight">
                  Data Migration Wizard &amp; Smart Column Mapping
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  APS POS 1
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Alur cerdas migrasi data Excel lama ke struktur basis data baku JacS RetailOS ERP
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'hover:bg-slate-200 border-slate-300 text-slate-600'
                : 'hover:bg-white/10 border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =================================================================
            VIEW SWITCHER TABS: WIZARD vs MIGRATION AUDIT TRAIL CENTER
            ================================================================= */}
        <div
          className={`px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-[#0f141c] border-gray-800'
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveModalTab('wizard')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeModalTab === 'wizard'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                  : isLight
                  ? 'bg-slate-200/80 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isEn ? 'Data Migration Wizard' : 'Wizard Migrasi Data'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModalTab('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeModalTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-md font-extrabold'
                  : isLight
                  ? 'bg-slate-200/80 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{isEn ? 'Migration Audit Trail & Safe Rollback' : 'Riwayat & Audit Migrasi (Safe Rollback)'}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeModalTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-700 text-cyan-300'
                }`}
              >
                {migrationBatches.length}
              </span>
            </button>

            <div className="h-5 w-[1px] bg-gray-700 mx-1 hidden sm:block" />

            <button
              type="button"
              onClick={() => {
                setActiveModalTab('wizard');
                fileInputRef.current?.click();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 border border-cyan-500/40 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Pilih dan unggah file baru (.csv, .xlsx, .txt)"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>📥 {isEn ? 'Import File' : 'Import File'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Unduh template CSV baku JacS RetailOS"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>📤 {isEn ? 'Download Standard Template' : 'Unduh Template Standar'}</span>
            </button>
          </div>

          <div className="text-[11px] text-gray-400 font-mono hidden xl:block">
            {isEn ? 'Canonical APS POS 1 Engine • Safe Undo Safeguard' : 'Mesin APS POS 1 Kanonikal • Proteksi Safe Rollback'}
          </div>
        </div>

        {/* =================================================================
            TAB 1: WIZARD MIGRASI DATA
            ================================================================= */}
        {activeModalTab === 'wizard' && (
          <>
            {/* WIZARD STEPPER TRACKER (4 LANGKAH) */}
            <div
              className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between overflow-x-auto ${
                isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-[#121822] border-gray-800'
              }`}
            >
          {[
            { step: 1, title: isEn ? '1. Data Source' : '1. Sumber Data', desc: isEn ? 'Select & Upload' : 'Pilih & Unggah File' },
            { step: 2, title: isEn ? '2. Smart Mapping' : '2. Smart Mapping', desc: isEn ? 'Map & Harmonize' : 'Petakan & Harmonisasi' },
            { step: 3, title: isEn ? '3. Dry Run Preview' : '3. Dry Run Preview', desc: isEn ? 'Simulate & Decide' : 'Simulasi & Keputusan' },
            { step: 4, title: isEn ? '4. Commit Data' : '4. Commit Data', desc: isEn ? 'Reconciliation Finished' : 'Rekonsiliasi Selesai' },
          ].map((item) => {
            const isDone = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <div key={item.step} className="flex items-center gap-2.5 shrink-0 px-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs transition ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                      : isLight
                      ? 'bg-slate-200 text-slate-500'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : item.step}
                </div>
                <div className="hidden sm:block text-left">
                  <div
                    className={`text-xs font-bold ${
                      isCurrent
                        ? isLight
                          ? 'text-cyan-700'
                          : 'text-cyan-400'
                        : isDone
                        ? 'text-emerald-500'
                        : 'text-gray-400'
                    }`}
                  >
                    {item.title}
                  </div>
                  <div className="text-[10px] text-gray-500">{item.desc}</div>
                </div>
                {item.step < 4 && <div className="hidden md:block w-8 h-[2px] bg-gray-700 mx-1" />}
              </div>
            );
          })}
        </div>

        {/* =================================================================
            WIZARD BODY CONTAINER (BERDASARKAN STEP)
            ================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ===============================================================
              STEP 1: PILIH ENTITAS & UNGGAH BERKAS
              =============================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Pilihan Entitas */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  1. Pilih Jenis Data yang Ingin Dimigrasikan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(Object.keys(ENTITY_CONFIG) as MigrationEntityType[]).map((entKey) => {
                    const cfg = ENTITY_CONFIG[entKey];
                    const isSelected = selectedEntity === entKey;
                    const IconComp = cfg.icon;
                    return (
                      <button
                        key={entKey}
                        type="button"
                        onClick={() => setSelectedEntity(entKey)}
                        className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                            : isLight
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                            : 'bg-[#151c27] hover:bg-[#1a2332] border-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={`p-2.5 rounded-xl ${
                              isSelected
                                ? 'bg-cyan-500 text-slate-950 font-bold'
                                : isLight
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-gray-800 text-gray-300'
                            }`}
                          >
                            <IconComp className="w-5 h-5" />
                          </div>
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white mb-0.5">{cfg.label}</h4>
                          <p className="text-[11px] text-gray-400 leading-snug">{cfg.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Area Upload File & Download Template */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {isEn ? '2. Upload Source File (CSV / TXT / Formatted Excel):' : '2. Unggah Berkas Sumber (CSV / TXT / Excel Terformat):'}
                  </label>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60 bg-cyan-500/10 flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {isEn
                        ? `Download Standard Template (${entityConfig.label})`
                        : `Unduh Template Standar (${entityConfig.label})`}
                    </span>
                  </button>
                </div>

                {/* Dropzone Multi-Format */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_ATTRIBUTE_STRING}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processUploadedFile(file);
                  }}
                  className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3.5 group ${
                    isDragging
                      ? 'border-cyan-400 bg-cyan-950/40 ring-4 ring-cyan-500/20 scale-[1.01]'
                      : isLight
                      ? 'border-slate-300 hover:border-cyan-500 bg-slate-50 hover:bg-cyan-50/30'
                      : 'border-gray-700 hover:border-cyan-400 bg-[#121822] hover:bg-cyan-950/20'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                    {isProcessingFile ? (
                      <RefreshCw className="w-7 h-7 animate-spin" />
                    ) : (
                      <Upload className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <p className={`font-extrabold text-sm sm:text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {isEn ? 'Click to Select File or Drag & Drop File Here' : 'Klik untuk Pilih Berkas atau Seret (Drag & Drop) Berkas ke Sini'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xl mx-auto">
                      {isEn
                        ? 'Universal multi-format parser with automated normalization layer before Step 2 column mapping.'
                        : 'Layer normalisasi cerdas otomatis meratakan JSON, mengekstrak INSERT INTO SQL, dan adapter database SQLite / MS Access.'}
                    </p>
                  </div>

                  {/* Format Badges Grid */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1 max-w-2xl">
                    <div className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3 h-3 text-cyan-400" />
                      <span>Tabular / Teks: .csv, .tsv, .txt, .xlsx, .xls</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-purple-400" />
                      <span>Data &amp; Script: .json, .sql</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                      <Database className="w-3 h-3 text-amber-400" />
                      <span>Basis Data Lama: .mdb, .accdb, .sqlite, .db</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <span className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 group-hover:bg-cyan-400 transition shadow-[0_0_15px_rgba(6,182,212,0.35)]">
                      {isEn ? 'Select Multi-Format File' : 'Pilih Berkas Multi-Format'}
                    </span>
                    <span className="text-xs text-gray-500">atau</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadDemoData();
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition flex items-center gap-1.5 shadow-sm"
                      title="Uji coba langsung alur wizard dengan data dummy standar tanpa menyiapkan berkas"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>⚡ Coba dengan Data Sampel Demo</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
              STEP 2: SMART COLUMN MAPPING & PROFILING STATS
              =============================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Profiling Bar */}
              <div
                className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#151c27] border-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">Sumber Berkas:</span>
                      <span className="text-xs font-mono font-bold text-cyan-400">{uploadedFileName}</span>
                      {detectedFormatInfo && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          {detectedFormatInfo.label}
                        </span>
                      )}
                      {detectedFormatInfo?.activeTable && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          Tabel: {detectedFormatInfo.activeTable}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Entitas Target: <strong>{entityConfig.label}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-gray-400 block text-[10px]">TOTAL BARIS</span>
                    <span className="font-extrabold text-white text-sm">{profilingStats.totalRows} Baris</span>
                  </div>
                  <div className="h-7 w-[1px] bg-gray-700" />
                  <div className="text-right">
                    <span className="text-gray-400 block text-[10px]">KOLOM TERDETEKSI</span>
                    <span className="font-extrabold text-white text-sm">{profilingStats.totalCols} Kolom</span>
                  </div>
                  <div className="h-7 w-[1px] bg-gray-700" />
                  <div className="text-right">
                    <span className="text-gray-400 block text-[10px]">STATUS VALIDASI</span>
                    <span
                      className={`font-extrabold text-xs px-2 py-0.5 rounded-full ${
                        profilingStats.isReady
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {profilingStats.isReady
                        ? '100% Siap Diproses'
                        : `${profilingStats.mappedRequiredCount}/${profilingStats.totalRequiredCount} Kolom Wajib`}
                    </span>
                  </div>
                </div>
              </div>

              {/* TOOLBAR PRESET SOFTWARE POS INDONESIA */}
              <div
                className={`p-3.5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isLight
                    ? 'bg-cyan-50/60 border-cyan-200'
                    : 'bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-teal-950/30 border-cyan-500/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                    <Wand2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Preset Alias POS Indonesia</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        1-Klik Petakan Kolom
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Pilih format software POS asal data Anda untuk menerapkan alias pemetaan kolom secara instan
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {POS_SOFTWARE_PRESETS.map((preset) => {
                    const isActive = activePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          isActive
                            ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                            : isLight
                            ? 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                            : 'bg-slate-800 hover:bg-slate-700 text-gray-200 border border-gray-700'
                        }`}
                        title={`${preset.name}: ${preset.description}`}
                      >
                        <span>{preset.name}</span>
                        {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    );
                  })}

                  <div className="h-5 w-[1px] bg-gray-700 mx-1 hidden sm:block" />

                  <button
                    type="button"
                    onClick={handleAutoDetectMapping}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-teal-300 hover:text-teal-200 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 transition cursor-pointer flex items-center gap-1"
                    title="Jalankan pencocokan otomatis berdasarkan sinonim kata"
                  >
                    <Sparkles className="w-3 h-3 text-teal-400" />
                    <span>Auto-Detect</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetMapping}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-gray-400 hover:text-rose-400 bg-gray-800 hover:bg-rose-950/20 border border-gray-700 transition cursor-pointer flex items-center gap-1"
                    title="Kosongkan semua pemetaan kolom"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Tabel Pemetaan Kolom & Toolbar AI Smart Harmonizer */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>{isEn ? 'Map Source Columns to ERP Master Structure' : 'Pemetaan Kolom Sumber ke Struktur Master ERP'}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {isEn ? 'Smart Profiling' : 'Profiling Cerdas'}
                      </span>
                    </h4>
                    <p className="text-xs text-gray-400">
                      {isEn
                        ? 'Automated header matching applied. Click Auto-Harmonize to clean UOMs, format prices, fix casing, and spot duplicates.'
                        : 'Sistem mencocokkan header secara otomatis. Klik tombol Auto-Harmonize untuk standardisasi satuan, merapikan angka, dan mendeteksi duplikat.'}
                    </p>
                  </div>

                  {/* Tombol Aksi: 🤖 Auto-Harmonize & Normalize Data */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoHarmonizeData}
                      disabled={isHarmonizing || rawRows.length === 0}
                      className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 transition flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.45)] ring-1 ring-cyan-300/60 cursor-pointer disabled:opacity-50 shrink-0 select-none active:scale-95"
                      title={
                        isEn
                          ? 'Auto-Harmonize & Normalize Data: Standardize UOM units (PCS, Botol, Dus), clean financial numbers/Rp, convert to Title Case, and detect semantic duplicates (>85%)'
                          : 'Auto-Harmonisasi & Normalisasi Data: Standardisasi satuan UOM (PCS, Botol, Dus), bersihkan simbol Rp/angka, rapikan Title Case, dan deteksi duplikasi semantik (>85%)'
                      }
                    >
                      {isHarmonizing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                          <span>{isEn ? 'Harmonizing Data...' : 'Menyeragamkan Data...'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
                          <span>🤖 Auto-Harmonize &amp; Normalize Data</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI SMART DATA HARMONIZER REPORT CARD (JIKA SUDAH DIJALANKAN) */}
                {harmonizeStats && (
                  <div className="p-4 rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-emerald-950/40 shadow-lg space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{isEn ? 'AI Data Harmonization Report' : 'Laporan Penyeragaman Data AI'}</span>
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              ✓ {isEn ? 'Normalized' : 'Tersinkronisasi'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-300">
                            {isEn
                              ? 'Raw import data has been pre-processed and normalized before Dry Run simulation.'
                              : 'Data mentah impor telah diseragamkan secara otomatis sebelum tahap simulasi Dry Run.'}
                          </p>
                        </div>
                      </div>

                      {harmonizeStats.semanticMatches.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowHarmonizeDetails(!showHarmonizeDetails)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition cursor-pointer"
                        >
                          <span>{showHarmonizeDetails ? (isEn ? 'Hide Duplicates' : 'Sembunyikan Duplikat') : (isEn ? 'View Duplicates' : 'Lihat Rincian Duplikat')}</span>
                          {showHarmonizeDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    {/* 4 Kartu Metrik Hasil Harmonisasi */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">
                          {isEn ? 'Standardized UOM' : 'Satuan UOM Baku'}
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base font-black text-cyan-400">{harmonizeStats.uomCount}</span>
                          <span className="text-[10px] text-gray-400">{isEn ? 'rows (PCS, Dus, Botol)' : 'baris (PCS, Dus, Botol)'}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/20">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">
                          {isEn ? 'Cleaned Numbers' : 'Angka & Rupiah Bersih'}
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base font-black text-emerald-400">{harmonizeStats.numbersCount}</span>
                          <span className="text-[10px] text-gray-400">{isEn ? 'fields (Rp -> Integer)' : 'kolom (Rp -> Integer)'}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-teal-500/20">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">
                          {isEn ? 'Title Case Formatted' : 'Kapitalisasi Teks'}
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base font-black text-teal-400">{harmonizeStats.titlesCount}</span>
                          <span className="text-[10px] text-gray-400">{isEn ? 'names & brands' : 'nama produk & merek'}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/20">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">
                          {isEn ? 'Semantic Duplicates' : 'Duplikasi Semantik'}
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className={`text-base font-black ${harmonizeStats.semanticMatches.length > 0 ? 'text-amber-400' : 'text-gray-400'}`}>
                            {harmonizeStats.semanticMatches.length}
                          </span>
                          <span className="text-[10px] text-gray-400">{isEn ? 'flagged (>85% match)' : 'terdeteksi (>85% mirip)'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rincian Expandable Duplikasi Semantik */}
                    {showHarmonizeDetails && harmonizeStats.semanticMatches.length > 0 && (
                      <div className="mt-2 p-3 rounded-xl bg-[#0b1017] border border-amber-500/30 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>
                            {isEn
                              ? `Detected ${harmonizeStats.semanticMatches.length} potential duplicate candidates with existing catalog:`
                              : `Terdeteksi ${harmonizeStats.semanticMatches.length} potensi barang duplikat dengan katalog master:`}
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {harmonizeStats.semanticMatches.map((m, mIdx) => (
                            <div
                              key={mIdx}
                              className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs flex flex-wrap items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/20">
                                  #{m.rowIdx}
                                </span>
                                <span className="font-bold text-white">"{m.importName}"</span>
                                <span className="text-gray-400 text-[11px]">➔</span>
                                <span className="text-emerald-300 font-semibold">"{m.matchedName}"</span>
                                <span className="font-mono text-[10px] text-gray-400">({m.matchedId})</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {m.similarity}% {isEn ? 'Similarity' : 'Kemiripan'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="border border-gray-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#121822] text-gray-400 border-b border-gray-800 uppercase font-bold text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">{isEn ? 'ERP Target Column' : 'Kolom Target ERP'}</th>
                        <th className="py-3 px-4">{isEn ? 'Requirement' : 'Kebutuhan'}</th>
                        <th className="py-3 px-4">{isEn ? 'Source Column (Excel / CSV)' : 'Kolom Sumber Excel / CSV'}</th>
                        <th className="py-3 px-4">{isEn ? 'Sample Value (Row 1)' : 'Contoh Nilai (Baris 1)'}</th>
                        <th className="py-3 px-4 text-center">{isEn ? 'Status' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60 font-medium">
                      {entityConfig.fields.map((field) => {
                        const selectedSourceHeader = columnMapping[field.key] || '';
                        const sampleVal = selectedSourceHeader ? rawRows[0]?.[selectedSourceHeader] : '-';
                        const isMapped = Boolean(selectedSourceHeader);

                        return (
                          <tr key={field.key} className="hover:bg-cyan-500/5 transition">
                            <td className="py-3 px-4">
                              <span className="font-bold text-white block">{field.label}</span>
                              <span className="text-[10px] font-mono text-gray-400">field: {field.key}</span>
                            </td>
                            <td className="py-3 px-4">
                              {field.required ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  {isEn ? 'Required (*)' : 'Wajib (*)'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-400">
                                  {isEn ? 'Optional' : 'Opsional'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={selectedSourceHeader}
                                onChange={(e) =>
                                  setColumnMapping((prev) => ({ ...prev, [field.key]: e.target.value }))
                                }
                                className={`w-full max-w-xs p-2 rounded-xl text-xs border font-semibold outline-none cursor-pointer ${
                                  isMapped
                                    ? 'bg-[#151c27] border-cyan-500/50 text-cyan-300'
                                    : 'bg-[#151c27] border-gray-700 text-gray-400'
                                }`}
                              >
                                <option value="">{isEn ? '-- Skip / Do Not Map --' : '-- Lewati / Jangan Petakan --'}</option>
                                {rawHeaders.map((hdr) => (
                                  <option key={hdr} value={hdr}>
                                    {hdr}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4 text-gray-300 font-mono text-[11px] max-w-[200px] truncate" title={sampleVal}>
                              {sampleVal || <span className="text-gray-500 italic">{isEn ? '(Empty)' : '(Kosong)'}</span>}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isMapped ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isEn ? 'Mapped' : 'Terpetakan'}</span>
                                </span>
                              ) : field.required ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>{isEn ? 'Unmapped' : 'Belum Terpetakan'}</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-gray-500">{isEn ? 'Skipped' : 'Dilewati'}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
              STEP 3: DRY RUN PREVIEW & MASTER MATCHING
              =============================================================== */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Toolbar & Filter Status Baris */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'ALL' as const, label: isEn ? 'All' : 'Semua', count: dryRunRows.length, color: 'text-gray-300' },
                    { id: 'MATCHED' as const, label: isEn ? 'MATCHED (Linked)' : 'MATCHED (Terkait)', count: dryRunRows.filter((r) => r.status === 'MATCHED').length, color: 'text-emerald-400' },
                    { id: 'NEW' as const, label: isEn ? 'NEW (New Item)' : 'NEW (Data Baru)', count: dryRunRows.filter((r) => r.status === 'NEW').length, color: 'text-blue-400' },
                    { id: 'DUPLICATE' as const, label: isEn ? 'DUPLICATE (In-file)' : 'DUPLICATE (Ganda)', count: dryRunRows.filter((r) => r.status === 'DUPLICATE').length, color: 'text-amber-400' },
                    { id: 'INVALID' as const, label: isEn ? 'INVALID (Errors)' : 'INVALID (Tidak Valid)', count: dryRunRows.filter((r) => r.status === 'INVALID').length, color: 'text-rose-400' },
                  ].map((tab) => {
                    const isActive = statusFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStatusFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm font-black'
                            : 'bg-[#151c27] text-gray-400 hover:text-white border-gray-800'
                        }`}
                      >
                        <span className={isActive ? 'text-slate-950 font-bold' : tab.color}>{tab.label}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                            isActive ? 'bg-slate-950 text-cyan-300 font-bold' : 'bg-gray-800 text-gray-300'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleBulkSetAction('MATCHED', 'UPDATE')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-bold cursor-pointer transition text-[11px]"
                  >
                    {isEn ? 'Set All Matched → Update' : 'Set Semua Matched → Perbarui'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkSetAction('NEW', 'CREATE')}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 font-bold cursor-pointer transition text-[11px]"
                  >
                    {isEn ? 'Set All New → Create' : 'Set Semua New → Buat Baru'}
                  </button>
                </div>
              </div>

              {/* Search Bar Preview */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchPreviewQuery}
                  onChange={(e) => setSearchPreviewQuery(e.target.value)}
                  placeholder={isEn ? 'Search within dry run simulation results...' : 'Cari dalam hasil simulasi dry run...'}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#121822] border border-gray-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Tabel Preview Dry Run */}
              <div className="border border-gray-800 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#121822] text-gray-400 border-b border-gray-800 uppercase font-bold text-[10px] tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">No</th>
                      <th className="py-2.5 px-3">{isEn ? 'Matching Status' : 'Status Matching'}</th>
                      <th className="py-2.5 px-3">{isEn ? 'Identity & Name' : 'Identitas & Nama'}</th>
                      <th className="py-2.5 px-3">{isEn ? 'Data Details' : 'Rincian Data'}</th>
                      <th className="py-2.5 px-3">{isEn ? 'Validation Notes' : 'Catatan Validasi'}</th>
                      <th className="py-2.5 px-3 text-right">{isEn ? 'Action Decision' : 'Keputusan Aksi'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 font-medium">
                    {filteredPreviewRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          {isEn ? 'No data rows match this filter.' : 'Tidak ada baris data yang cocok dengan filter ini.'}
                        </td>
                      </tr>
                    ) : (
                      filteredPreviewRows.map((row) => {
                        const m = row.mapped;
                        let badgeBg = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                        if (row.status === 'MATCHED') badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                        if (row.status === 'DUPLICATE') badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                        if (row.status === 'INVALID') badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/30';

                        return (
                          <tr key={row.rowIndex} className="hover:bg-cyan-500/5 transition">
                            <td className="py-2.5 px-3 text-center font-mono text-gray-400">
                              {row.rowIndex}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono ${badgeBg}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-white text-xs">{m.name || <span className="text-rose-400 italic">{isEn ? '(No Name)' : '(Tanpa Nama)'}</span>}</div>
                              <div className="text-[10px] font-mono text-gray-400 flex items-center gap-2">
                                {m.barcode && <span>Barcode: {m.barcode}</span>}
                                {m.sku && <span>SKU: {m.sku}</span>}
                                {m.phone && <span>Telp: {m.phone}</span>}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-gray-300 text-[11px] whitespace-nowrap">
                              {selectedEntity === 'product' && (
                                <div className="space-y-0.5">
                                  <div>
                                    <span className="text-gray-400">{isEn ? 'Sell:' : 'Jual:'}</span> Rp {Number(m.sellingPrice || 0).toLocaleString('id-ID')}
                                    <span className="text-gray-400 ml-2">{isEn ? 'Cost:' : 'HPP:'}</span> Rp {Number(m.costPrice || 0).toLocaleString('id-ID')}
                                  </div>
                                  <div className="text-[10px] text-gray-400">
                                    {isEn ? 'Stock:' : 'Stok:'} <strong className="text-white">{m.stock || 0}</strong> {m.unit || 'PCS'}
                                  </div>
                                </div>
                              )}
                              {selectedEntity === 'supplier' && (
                                <div className="space-y-0.5">
                                  <div>PIC: {m.contactPerson || '-'}</div>
                                  <div className="text-[10px] text-gray-400">{m.paymentTerms || '-'}</div>
                                </div>
                              )}
                              {selectedEntity === 'customer' && (
                                <div className="space-y-0.5">
                                  <div>Tier: <span className="font-bold text-cyan-400">{m.memberTier || 'Reguler'}</span></div>
                                  <div className="text-[10px] text-gray-400">{isEn ? 'Points:' : 'Poin:'} {m.points || 0} Pts</div>
                                </div>
                              )}
                              {selectedEntity === 'inventory' && (
                                <div>
                                  {isEn ? 'Actual Stock:' : 'Stok Aktual:'} <strong className="text-emerald-400">{m.stock}</strong>
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] max-w-[220px]">
                              {row.statusReasons.map((rs, rIdx) => (
                                <div key={rIdx} className={row.status === 'INVALID' ? 'text-rose-400' : 'text-gray-400'}>
                                  • {rs}
                                </div>
                              ))}
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <select
                                value={row.action}
                                disabled={row.status === 'INVALID'}
                                onChange={(e) => handleUpdateRowAction(row.rowIndex, e.target.value as MigrationRowAction)}
                                className={`p-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                                  row.action === 'CREATE'
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                    : row.action === 'UPDATE'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-gray-800 text-gray-400 border-gray-700'
                                }`}
                              >
                                <option value="CREATE">{isEn ? 'Create New (Create)' : 'Buat Baru (Create)'}</option>
                                <option value="UPDATE">{isEn ? 'Update (Link Existing)' : 'Perbarui (Link Existing)'}</option>
                                <option value="SKIP">{isEn ? 'Skip (Do not import)' : 'Lewati (Skip)'}</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===============================================================
              STEP 4: COMMIT REKONSILIASI & SUMMARY REPORT
              =============================================================== */}
          {currentStep === 4 && commitSummary && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-slate-950 mx-auto flex items-center justify-center font-black shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="font-black text-xl text-white">
                  {isEn ? 'Data Migration Successfully Applied 100%!' : 'Migrasi Data Berhasil Diterapkan 100%!'}
                </h3>
                <p className="text-xs text-gray-300 max-w-lg mx-auto leading-relaxed">
                  {isEn
                    ? `Data has been safely and idempotently committed to internal database for ${entityConfig.label}. Changes are live across POS cashier terminals, warehouse inventory, and accounting.`
                    : `Data telah direkonsiliasi secara aman & idempoten ke basis data internal ${entityConfig.label}. Perubahan langsung aktif di seluruh terminal kasir POS, modul stok gudang, dan pembukuan finansial tanpa perlu refresh browser.`}
                </p>
              </div>

              {/* Kartu Metrik Hasil Rekonsiliasi */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-[#151c27] border border-gray-800 text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {isEn ? 'Total Rows' : 'Total Data'}
                  </span>
                  <span className="text-2xl font-black text-white font-mono">{commitSummary.totalRows}</span>
                </div>
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-center">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                    {isEn ? 'Created (New)' : 'Berhasil Dibuat (New)'}
                  </span>
                  <span className="text-2xl font-black text-blue-300 font-mono">+{commitSummary.imported}</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    {isEn ? 'Updated (Matched)' : 'Diperbarui (Matched)'}
                  </span>
                  <span className="text-2xl font-black text-emerald-300 font-mono">↻{commitSummary.updated}</span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    {isEn ? 'Skipped / Failed' : 'Dilewati / Gagal'}
                  </span>
                  <span className="text-2xl font-black text-amber-300 font-mono">{commitSummary.skipped + commitSummary.failed}</span>
                </div>
              </div>

              {/* Panel Audit Kartu Stok (Opening Stock Migration Ledger) */}
              {commitSummary.stockLedgerEntriesCount !== undefined && commitSummary.stockLedgerEntriesCount > 0 && (
                <div className="p-5 rounded-2xl bg-[#0f172a] border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                      <Sparkles className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex flex-wrap items-center gap-2">
                        <span>{isEn ? 'Stock Ledger Auto-Synchronized' : 'Pencatatan Otomatis ke Kartu Stok'}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 tracking-wider">
                          OPENING_STOCK_MIGRATION
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300 mt-1">
                        {isEn
                          ? `${commitSummary.stockLedgerEntriesCount} stock ledger movement entries safely recorded to ${commitSummary.targetWarehouse || 'GD001 - Gudang Utama'}. Real-time balance updated in Warehouse & Inventory module.`
                          : `Sebanyak ${commitSummary.stockLedgerEntriesCount} mutasi stok awal berhasil dibukukan ke ${commitSummary.targetWarehouse || 'GD001 - Gudang Utama'}. Saldo stok langsung aktif di modul Gudang & Inventori.`}
                      </p>
                    </div>
                  </div>
                  <div className="sm:border-l sm:border-slate-800 sm:pl-5 shrink-0 space-y-1 font-mono">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {isEn ? 'Batch Document Ref' : 'No. Batch Referensi'}
                    </div>
                    <div className="text-xs font-black text-cyan-300">
                      {commitSummary.batchNumber}
                    </div>
                    <div className="text-[10px] text-indigo-300 font-semibold">
                      {commitSummary.targetWarehouse || 'GD001 - Gudang Utama'}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('history')}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <History className="w-4 h-4 text-indigo-300" />
                  <span>{isEn ? 'Open Migration Audit Trail & Safe Rollback Center' : 'Buka Riwayat & Audit Trail Migrasi (Safe Rollback)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* =================================================================
            MODAL FOOTER ACTION BAR
            ================================================================= */}
        <div
          className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#161d27] border-gray-800'
          }`}
        >
          {/* Sisi Kiri: Tombol Kembali / Reset */}
          <div>
            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-700 hover:bg-white/5 text-gray-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{isEn ? 'Back to Upload' : 'Kembali ke Upload'}</span>
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-700 hover:bg-white/5 text-gray-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{isEn ? 'Modify Column Mapping' : 'Ubah Pemetaan Kolom'}</span>
              </button>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                onClick={handleResetWizard}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isEn ? 'Migrate Another File' : 'Migrasikan File Lain'}</span>
              </button>
            )}
          </div>

          {/* Sisi Kanan: Tombol Lanjut / Commit / Selesai */}
          <div className="flex items-center gap-2.5">
            {currentStep === 1 && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-700 hover:bg-white/5 text-gray-300 transition cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={runDryRunSimulation}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer transition"
              >
                <span>{isEn ? 'Run Dry Run Preview' : 'Jalankan Dry Run Preview'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                disabled={isCommitting}
                onClick={handleCommitMigration}
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer transition disabled:opacity-50"
              >
                {isCommitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isEn ? 'Executing Reconciliation...' : 'Mengeksekusi Rekonsiliasi...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isEn
                        ? `Commit Migration (${dryRunRows.filter((r) => r.action !== 'SKIP').length} Rows)`
                        : `Commit Migration (${dryRunRows.filter((r) => r.action !== 'SKIP').length} Data)`}
                    </span>
                  </>
                )}
              </button>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer transition"
              >
                <span>{isEn ? 'Finished & Open Master Data' : 'Selesai & Buka Data Master'}</span>
              </button>
            )}
          </div>
        </div>
          </>
        )}

        {/* =================================================================
            TAB 2: RIWAYAT & AUDIT MIGRASI (SAFE ROLLBACK CENTER)
            ================================================================= */}
        {activeModalTab === 'history' && (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-150">
            {/* Header Riwayat & Filter */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#151c27] border-gray-800'
                }`}>
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {isEn ? 'Total Batches' : 'Total Batch'}
                    </span>
                    <Layers className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {migrationBatches.length}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {isEn ? 'All recorded import runs' : 'Seluruh proses migrasi tercatat'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center justify-between text-emerald-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {isEn ? 'Completed Batches' : 'Batch Berhasil'}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-300">
                    {migrationBatches.filter((b) => b.status === 'COMPLETED').length}
                  </div>
                  <div className="text-[10px] text-emerald-400/80 mt-1">
                    {isEn ? 'Active & reconciled in ERP' : 'Aktif & terefleksi di basis data'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30">
                  <div className="flex items-center justify-between text-purple-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {isEn ? 'Rolled Back Batches' : 'Batch Dibatalkan'}
                    </span>
                    <Undo2 className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-purple-300">
                    {migrationBatches.filter((b) => b.status === 'ROLLED_BACK').length}
                  </div>
                  <div className="text-[10px] text-purple-400/80 mt-1">
                    {isEn ? 'Safely reversed & undone' : 'Berhasil dikembalikan via Safe Rollback'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
                  <div className="flex items-center justify-between text-indigo-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {isEn ? 'Stock Movements' : 'Mutasi Kartu Stok'}
                    </span>
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-indigo-300">
                    {migrationBatches.reduce((acc, b) => acc + (b.stockLedgerEntriesCount || 0), 0)}
                  </div>
                  <div className="text-[10px] text-indigo-300/80 mt-1">
                    {isEn ? 'Stock ledger entries' : 'Entri mutasi stok awal gudang'}
                  </div>
                </div>
              </div>

              {/* Toolbar: Search & Filter */}
              <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#151c27] border-gray-800'
              }`}>
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      placeholder={isEn ? 'Search batch ID, operator, notes...' : 'Cari nomor batch, operator, catatan...'}
                      className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border outline-none font-mono ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                          : 'bg-[#0f141c] border-gray-700 text-white focus:border-cyan-400'
                      }`}
                    />
                  </div>

                  {/* Filter Status */}
                  <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-gray-700/60 text-[11px]">
                    {(['ALL', 'COMPLETED', 'ROLLED_BACK'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setAuditStatusFilter(st)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                          auditStatusFilter === st
                            ? st === 'COMPLETED'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : st === 'ROLLED_BACK'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-cyan-600 text-white shadow-xs'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {st === 'ALL'
                          ? (isEn ? 'All' : 'Semua')
                          : st === 'COMPLETED'
                          ? (isEn ? 'Completed' : 'Berhasil')
                          : (isEn ? 'Rolled Back' : 'Dibatalkan')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Entitas */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-gray-400 font-semibold text-[11px]">
                    {isEn ? 'Entity:' : 'Entitas:'}
                  </span>
                  <select
                    value={auditEntityFilter}
                    onChange={(e) => setAuditEntityFilter(e.target.value as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs border font-bold cursor-pointer outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-800'
                        : 'bg-[#0f141c] border-gray-700 text-cyan-300'
                    }`}
                  >
                    <option value="ALL">{isEn ? 'All Entities' : 'Semua Entitas'}</option>
                    {(Object.keys(ENTITY_CONFIG) as MigrationEntityType[]).map((k) => (
                      <option key={k} value={k}>
                        {ENTITY_CONFIG[k].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabel Riwayat Batch */}
              <div className={`overflow-x-auto rounded-2xl border ${
                isLight ? 'border-slate-200 bg-white' : 'border-gray-800 bg-[#121822]'
              }`}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                      isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#161d27] text-gray-400 border-gray-800'
                    }`}>
                      <th className="py-3 px-3.5 whitespace-nowrap">{isEn ? 'Batch ID' : 'ID Batch'}</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">{isEn ? 'Import Time' : 'Waktu Impor'}</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">{isEn ? 'Entity Type' : 'Tipe Entitas'}</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap">{isEn ? 'Total Rows' : 'Total Baris'}</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap">{isEn ? 'Success' : 'Berhasil'}</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap">{isEn ? 'Skipped' : 'Dilewati'}</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap">{isEn ? 'Failed' : 'Gagal'}</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">{isEn ? 'Operator' : 'Operator'}</th>
                      <th className="py-3 px-3.5 text-center whitespace-nowrap">{isEn ? 'Status' : 'Status'}</th>
                      <th className="py-3 px-3.5 text-right whitespace-nowrap">{isEn ? 'Actions' : 'Aksi'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 font-mono text-[11px]">
                    {filteredAuditBatches.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-gray-400 font-sans">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <History className="w-8 h-8 text-gray-500" />
                            <p className="font-bold text-sm">
                              {isEn ? 'No migration batches found' : 'Tidak ada riwayat batch migrasi'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {isEn
                                ? 'Import data using the wizard to populate this audit trail.'
                                : 'Lakukan migrasi melalui wizard untuk melihat rekaman audit di sini.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAuditBatches.map((batch) => {
                        const entCfg = ENTITY_CONFIG[batch.entityType];
                        const IconComponent = entCfg ? entCfg.icon : Package;
                        const isRolledBack = batch.status === 'ROLLED_BACK';

                        return (
                          <tr
                            key={batch.id}
                            className={`transition ${
                              isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a2332]/50'
                            }`}
                          >
                            <td className="py-3.5 px-3.5 font-bold whitespace-nowrap">
                              <span className="font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                                {batch.id}
                              </span>
                            </td>
                            <td className="py-3.5 px-3.5 text-gray-300 font-sans whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span>{batch.timestamp}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3.5 font-sans whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                                  <IconComponent className="w-3.5 h-3.5" />
                                </div>
                                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                  {entCfg ? entCfg.label : batch.entityType}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center font-bold text-gray-300">
                              {batch.totalRows}
                            </td>
                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <span className="text-emerald-400 font-bold">
                                +{batch.imported}
                              </span>
                              {batch.updated > 0 && (
                                <span className="text-cyan-400 ml-1">
                                  ↻{batch.updated}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-center text-amber-400 font-bold">
                              {batch.skipped}
                            </td>
                            <td className="py-3.5 px-3 text-center text-rose-400 font-bold">
                              {batch.failed}
                            </td>
                            <td className="py-3.5 px-3.5 font-sans text-gray-300 whitespace-nowrap">
                              <span className="text-[11px] font-medium">{batch.operator}</span>
                            </td>
                            <td className="py-3.5 px-3.5 text-center whitespace-nowrap font-sans">
                              {isRolledBack ? (
                                <div className="inline-flex flex-col items-center">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 inline-flex items-center gap-1">
                                    <Undo2 className="w-2.5 h-2.5" />
                                    <span>{isEn ? 'ROLLED BACK' : 'DIBATALKAN'}</span>
                                  </span>
                                  {batch.rolledBackAt && (
                                    <span className="text-[9px] text-gray-500 font-mono mt-0.5">
                                      {batch.rolledBackAt.slice(0, 16)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>{isEn ? 'COMPLETED' : 'BERHASIL'}</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3.5 text-right font-sans whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedAuditBatch(batch)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition flex items-center gap-1 cursor-pointer"
                                  title={isEn ? 'View Reconciliation Details' : 'Lihat Ringkasan Rekonsiliasi'}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>{isEn ? 'Details' : 'Detail'}</span>
                                </button>

                                {!isRolledBack && (
                                  <button
                                    type="button"
                                    onClick={() => setBatchToRollback(batch)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition flex items-center gap-1 cursor-pointer"
                                    title={isEn ? 'Safe Rollback this batch' : 'Batalkan Migrasi (Safe Rollback)'}
                                  >
                                    <Undo2 className="w-3.5 h-3.5" />
                                    <span>{isEn ? 'Rollback' : 'Batalkan'}</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Tab Riwayat */}
            <div className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#161d27] border-gray-800'
            }`}>
              <div className="text-xs text-gray-400 font-mono">
                {isEn
                  ? `Displaying ${filteredAuditBatches.length} of ${migrationBatches.length} recorded migration batches`
                  : `Menampilkan ${filteredAuditBatches.length} dari ${migrationBatches.length} batch migrasi tercatat`}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('wizard')}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isEn ? 'Open Migration Wizard' : 'Buka Wizard Migrasi'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl text-xs font-bold border border-gray-700 hover:bg-white/5 text-gray-300 transition cursor-pointer"
                >
                  {isEn ? 'Close' : 'Tutup'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            MODAL SUB: DETAIL REKONSILIASI PER BATCH
            ================================================================= */}
        {selectedAuditBatch && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className={`w-full max-w-2xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161d27] border-gray-700 text-white'
            }`}>
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base">
                      {isEn ? 'Batch Reconciliation Summary' : 'Ringkasan Rekonsiliasi Batch'}
                    </h4>
                    <span className="font-mono text-xs text-cyan-400 font-bold">
                      {selectedAuditBatch.id}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAuditBatch(null)}
                  className="p-1.5 rounded-xl border border-gray-700 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase border ${
                    selectedAuditBatch.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  }`}>
                    {selectedAuditBatch.status}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-gray-300 border border-gray-700">
                    {ENTITY_CONFIG[selectedAuditBatch.entityType]?.label || selectedAuditBatch.entityType}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-cyan-400" />
                    <span>{selectedAuditBatch.targetWarehouse || 'GD001 - Gudang Utama'}</span>
                  </span>
                </div>

                {/* Grid 4 Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-gray-700/60 text-center">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">
                      {isEn ? 'Total Rows' : 'Total Baris'}
                    </span>
                    <span className="text-lg font-black text-white font-mono">{selectedAuditBatch.totalRows}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
                    <span className="text-[10px] text-blue-400 block font-bold uppercase">
                      {isEn ? 'Created (New)' : 'Dibuat Baru'}
                    </span>
                    <span className="text-lg font-black text-blue-300 font-mono">+{selectedAuditBatch.imported}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <span className="text-[10px] text-emerald-400 block font-bold uppercase">
                      {isEn ? 'Updated' : 'Diperbarui'}
                    </span>
                    <span className="text-lg font-black text-emerald-300 font-mono">↻{selectedAuditBatch.updated}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                    <span className="text-[10px] text-amber-400 block font-bold uppercase">
                      {isEn ? 'Skipped' : 'Dilewati'}
                    </span>
                    <span className="text-lg font-black text-amber-300 font-mono">{selectedAuditBatch.skipped}</span>
                  </div>
                </div>

                {/* Stock Ledger Notice */}
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-gray-300">
                      {isEn
                        ? `Recorded ${selectedAuditBatch.stockLedgerEntriesCount} stock ledger entries under type OPENING_STOCK_MIGRATION.`
                        : `Tercatat ${selectedAuditBatch.stockLedgerEntriesCount} mutasi kartu stok bertipe OPENING_STOCK_MIGRATION.`}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-indigo-300 text-xs shrink-0">
                    GD001
                  </span>
                </div>

                {/* Metadata Notes */}
                <div className="text-xs text-gray-400 space-y-1 font-mono bg-slate-900/60 p-3 rounded-xl border border-gray-800">
                  <div><strong>Operator:</strong> {selectedAuditBatch.operator}</div>
                  <div><strong>Timestamp:</strong> {selectedAuditBatch.timestamp}</div>
                  {selectedAuditBatch.notes && <div><strong>Notes:</strong> {selectedAuditBatch.notes}</div>}
                  {selectedAuditBatch.rolledBackAt && (
                    <div className="text-purple-300">
                      <strong>Rolled Back:</strong> {selectedAuditBatch.rolledBackAt} oleh {selectedAuditBatch.rolledBackBy || 'Operator'}
                    </div>
                  )}
                </div>

                {/* Affected Items Snapshot List */}
                {selectedAuditBatch.affectedItems && selectedAuditBatch.affectedItems.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      {isEn ? 'Affected Items & Stock Reconciliation:' : 'Rincian Rekonsiliasi & Perubahan Stok:'}
                    </h5>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-800 text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-[#121822] text-[10px] text-gray-400 font-bold uppercase sticky top-0">
                          <tr>
                            <th className="p-2">ID / SKU</th>
                            <th className="p-2">Nama</th>
                            <th className="p-2">Aksi</th>
                            <th className="p-2 text-right">Stok Sebelum</th>
                            <th className="p-2 text-right">Stok Sesudah</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-[11px] font-mono">
                          {selectedAuditBatch.affectedItems.map((item, idx) => (
                            <tr key={`${item.id}-${idx}`}>
                              <td className="p-2 text-cyan-400">{item.id}</td>
                              <td className="p-2 font-sans font-bold text-gray-200">{item.name}</td>
                              <td className="p-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                                  item.action === 'CREATE' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                  {item.action}
                                </span>
                              </td>
                              <td className="p-2 text-right text-gray-400">{item.prevStock ?? 0}</td>
                              <td className="p-2 text-right text-emerald-400 font-bold">{item.newStock ?? item.prevStock ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAuditBatch(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-700 hover:bg-white/10 text-white transition cursor-pointer"
                >
                  {isEn ? 'Close Summary' : 'Tutup Ringkasan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            MODAL SUB: SAFE ROLLBACK CONFIRMATION SAFEGUARD
            ================================================================= */}
        {batchToRollback && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className={`w-full max-w-lg rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161d27] border-rose-500/30 text-white'
            }`}>
              <div className="p-5 border-b border-rose-500/20 bg-rose-500/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-rose-300">
                      {isEn ? 'Safe Rollback Safeguard' : 'Konfirmasi Safe Rollback Migrasi'}
                    </h4>
                    <span className="font-mono text-xs text-gray-400">
                      Batch ID: {batchToRollback.id}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isRollingBack}
                  onClick={() => setBatchToRollback(null)}
                  className="p-1.5 rounded-xl border border-gray-700 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-300 leading-relaxed">
                  {isEn
                    ? `Are you sure you want to rollback batch [${batchToRollback.id}]? This safeguard ensures internal consistency by reversing all operations performed during this migration.`
                    : `Apakah Anda yakin ingin membatalkan migrasi batch [${batchToRollback.id}]? Pengaman ini menjamin integritas data dengan membalikkan seluruh mutasi yang dilakukan saat migrasi.`}
                </p>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-gray-800 space-y-2 text-xs">
                  <div className="font-bold text-gray-300 mb-1">
                    {isEn ? 'Reversal Checklist Safeguards:' : 'Daftar Eksekusi Rollback Otomatis:'}
                  </div>
                  <div className="flex items-center gap-2 text-rose-300">
                    <span>•</span>
                    <span>
                      {isEn
                        ? `Remove ${batchToRollback.createdItemIds.length} newly created records from master catalog.`
                        : `Hapus ${batchToRollback.createdItemIds.length} data baru yang dibuat oleh batch ini.`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-300">
                    <span>•</span>
                    <span>
                      {isEn
                        ? `Revert previous stock quantities for ${batchToRollback.affectedItems?.filter((i) => (i.newStock ?? 0) !== (i.prevStock ?? 0)).length || 0} modified items.`
                        : `Kembalikan saldo stok ke angka sebelum migrasi untuk ${batchToRollback.affectedItems?.filter((i) => (i.newStock ?? 0) !== (i.prevStock ?? 0)).length || 0} item.`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-300">
                    <span>•</span>
                    <span>
                      {isEn
                        ? `Record compensating ROLLBACK_MIGRATION entries to Stock Ledger in ${batchToRollback.targetWarehouse || 'GD001 - Gudang Utama'}.`
                        : `Catat mutasi pembalik bertipe ROLLBACK_MIGRATION pada Kartu Stok Gudang (${batchToRollback.targetWarehouse || 'GD001 - Gudang Utama'}).`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-cyan-300">
                    <span>•</span>
                    <span>
                      {isEn
                        ? 'Update batch status to ROLLED_BACK and log entry into System Audit Log.'
                        : 'Ubah status batch menjadi ROLLED_BACK dan catat ke Log Audit Sistem.'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t flex items-center justify-end gap-2.5 bg-slate-950/40">
                <button
                  type="button"
                  disabled={isRollingBack}
                  onClick={() => setBatchToRollback(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-700 hover:bg-white/10 text-gray-300 transition cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                </button>

                <button
                  type="button"
                  disabled={isRollingBack}
                  onClick={() => {
                    setIsRollingBack(true);
                    setTimeout(() => {
                      const res = rollbackMigrationBatch(batchToRollback.id);
                      setIsRollingBack(false);
                      showToast(res.message);
                      setBatchToRollback(null);
                    }, 300);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-[0_0_15px_rgba(225,29,72,0.4)] transition cursor-pointer disabled:opacity-50"
                >
                  {isRollingBack ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isEn ? 'Rolling back...' : 'Mengeksekusi Rollback...'}</span>
                    </>
                  ) : (
                    <>
                      <Undo2 className="w-4 h-4" />
                      <span>{isEn ? 'Confirm Safe Rollback' : 'Konfirmasi Rollback Aman'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
