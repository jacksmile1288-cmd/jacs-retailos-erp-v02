import '../../polyfills';
import { Buffer } from 'buffer';
import type MDBReaderType from 'mdb-reader';

export interface MdbTableSummary {
  allTableNames: string[];
  msBarangTable: string;
  otherUnitTable: string | null;
  itemGroupTable: string | null;
  itemMerkTable: string | null;
  posBarangTable: string | null;
  msBarangCount: number;
  otherUnitCount: number;
  itemGroupCount: number;
  itemMerkCount: number;
  posBarangCount: number;
  matchedUnits: number;
  matchedGroups: number;
  matchedBrands: number;
  matchedStocks: number;
}

export interface MdbParseResult {
  headers: string[];
  rows: Record<string, string>[];
  summary: MdbTableSummary;
}

type RawAccessRow = Record<string, unknown>;

function normalizeKey(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().toUpperCase();
}

function toCleanString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : '';
  }
  return String(val).trim();
}

function toSafeNumber(val: unknown): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (val === null || val === undefined) return 0;
  const raw = String(val).trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/[^0-9.,-]/g, '');
  if (!cleaned) return 0;
  // Deteksi pemisah ribuan vs desimal
  let normalized = cleaned;
  if (cleaned.includes('.') && cleaned.includes(',')) {
    normalized =
      cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
  } else if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    normalized =
      parts.length > 2 || (parts.length === 2 && parts[1].length === 3)
        ? cleaned.replace(/,/g, '')
        : cleaned.replace(',', '.');
  }
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Ambil nilai kolom dari baris Access secara case-insensitive
 */
function getFieldCI(row: RawAccessRow, candidates: string[]): unknown {
  const keys = Object.keys(row);
  if (keys.length === 0) return undefined;

  // 1. Exact case-insensitive match
  for (const cand of candidates) {
    const candLow = cand.toLowerCase();
    const matchedKey = keys.find((k) => k.toLowerCase() === candLow);
    if (matchedKey !== undefined) {
      const val = row[matchedKey];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return val;
      }
    }
  }

  // 2. Fallback: kembalikan nilai pertama yang ada (meski 0 atau string kosong)
  for (const cand of candidates) {
    const candLow = cand.toLowerCase();
    const matchedKey = keys.find((k) => k.toLowerCase() === candLow);
    if (matchedKey !== undefined) {
      return row[matchedKey];
    }
  }

  return undefined;
}

/**
 * Ambil kolom teks deskriptif pertama yang bukan kolom kunci ID
 */
function getFallbackLabelCI(row: RawAccessRow, excludeKeys: string[]): string {
  const excludeSet = new Set(excludeKeys.map((k) => k.toLowerCase()));
  for (const [k, v] of Object.entries(row)) {
    if (excludeSet.has(k.toLowerCase())) continue;
    if (typeof v === 'string' && v.trim().length > 0) {
      return v.trim();
    }
  }
  return '';
}

function findTableNameCI(allTables: string[], targetName: string): string | null {
  const targetLow = targetName.toLowerCase();
  const exact = allTables.find((t) => t.toLowerCase() === targetLow);
  if (exact) return exact;
  return allTables.find((t) => t.toLowerCase().replace(/[^a-z0-9]/g, '') === targetLow.replace(/[^a-z0-9]/g, '')) || null;
}

function readTableSafe(reader: MDBReaderType, tableName: string | null): RawAccessRow[] {
  if (!tableName) return [];
  try {
    const table = reader.getTable(tableName);
    return table.getData() as unknown as RawAccessRow[];
  } catch (err) {
    console.warn(`[MDB Parser] Gagal membaca tabel "${tableName}":`, err);
    return [];
  }
}

interface UnitPriceEntry {
  usat: string;
  isi1: number;
  hbel: number;
  har1: number;
  har2: number;
  har3: number;
  barcode: string;
}

/**
 * Memilih satuan utama (base unit) terbaik dari relasi OtherUnitOnStok untuk satu KBRG:
 * Prioritas: ISI1 === 1 -> ISI1 terkecil (> 0) -> memiliki harga beli/jual > 0 -> baris pertama
 */
function pickPrimaryUnitEntry(entries: UnitPriceEntry[]): UnitPriceEntry | null {
  if (entries.length === 0) return null;
  if (entries.length === 1) return entries[0];

  const sorted = [...entries].sort((a, b) => {
    const aIsBase = a.isi1 === 1 ? 0 : 1;
    const bIsBase = b.isi1 === 1 ? 0 : 1;
    if (aIsBase !== bIsBase) return aIsBase - bIsBase;

    const aHasPrice = a.hbel > 0 && a.har1 > 0 ? 0 : a.hbel > 0 || a.har1 > 0 ? 1 : 2;
    const bHasPrice = b.hbel > 0 && b.har1 > 0 ? 0 : b.hbel > 0 || b.har1 > 0 ? 1 : 2;
    if (aHasPrice !== bHasPrice) return aHasPrice - bHasPrice;

    const aIsi = a.isi1 > 0 ? a.isi1 : Number.MAX_SAFE_INTEGER;
    const bIsi = b.isi1 > 0 ? b.isi1 : Number.MAX_SAFE_INTEGER;
    return aIsi - bIsi;
  });

  return sorted[0];
}

export const MDB_STANDARD_HEADERS = [
  'BARCODE_ID',
  'NAMA_PRODUK',
  'NAMA_KATEGORI',
  'SATUAN',
  'ISI_KONVERSI',
  'HPP',
  'RETAIL',
  'MEMBER',
  'GROSIR',
  'BRAND',
  'STOK',
];

/**
 * Membaca file Microsoft Access (.mdb — Standard Jet DB 4.0) langsung di browser,
 * lalu menggabungkan relasi MsBarang + OtherUnitOnStok + MyItemGroup + MyItemMerk + PosBARANG
 * ke format tabel siap-migrasi JacS RetailOS ERP.
 */
export async function parseAccessMdbBuffer(
  arrayBuffer: ArrayBuffer,
  fileName = 'database.mdb'
): Promise<MdbParseResult> {
  const buf = Buffer.from(new Uint8Array(arrayBuffer));
  let reader: MDBReaderType;

  try {
    const mdbModule = await import('mdb-reader');
    const MDBReaderCtor = mdbModule.default;
    reader = new MDBReaderCtor(buf);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `File "${fileName}" tidak dapat dibaca sebagai database Microsoft Access (.mdb Jet DB 4.0): ${msg}`
    );
  }

  const allTableNames = reader.getTableNames();
  const msBarangTable = findTableNameCI(allTableNames, 'MsBarang');

  if (!msBarangTable) {
    throw new Error(
      `Tabel utama "MsBarang" tidak ditemukan di dalam "${fileName}". Tabel yang tersedia: ${
        allTableNames.slice(0, 15).join(', ') || '(kosong)'
      }`
    );
  }

  const otherUnitTable = findTableNameCI(allTableNames, 'OtherUnitOnStok');
  const itemGroupTable = findTableNameCI(allTableNames, 'MyItemGroup');
  const itemMerkTable = findTableNameCI(allTableNames, 'MyItemMerk');
  const posBarangTable = findTableNameCI(allTableNames, 'PosBARANG');

  const msBarangRows = readTableSafe(reader, msBarangTable);
  const otherUnitRows = readTableSafe(reader, otherUnitTable);
  const itemGroupRows = readTableSafe(reader, itemGroupTable);
  const itemMerkRows = readTableSafe(reader, itemMerkTable);
  const posBarangRows = readTableSafe(reader, posBarangTable);

  // 1. Indeks MyItemGroup berdasarkan GRID -> Nama Kategori
  const groupMap = new Map<string, string>();
  for (const row of itemGroupRows) {
    const grid = normalizeKey(getFieldCI(row, ['GRID', 'IDGROUP', 'KODEGROUP', 'GROUPID', 'ID']));
    if (!grid) continue;
    const groupName =
      toCleanString(
        getFieldCI(row, ['GRNM', 'NAMAGROUP', 'GROUPNAME', 'NAMA', 'KATEGORI', 'KET', 'KETERANGAN', 'DESKRIPSI', 'DESC'])
      ) || getFallbackLabelCI(row, ['GRID', 'IDGROUP', 'KODEGROUP', 'GROUPID', 'ID']);
    if (groupName) {
      groupMap.set(grid, groupName);
    }
  }

  // 2. Indeks MyItemMerk berdasarkan PRID -> Nama Merek
  const merkMap = new Map<string, string>();
  for (const row of itemMerkRows) {
    const prid = normalizeKey(getFieldCI(row, ['PRID', 'IDMERK', 'KODEMERK', 'MERKID', 'ID']));
    if (!prid) continue;
    const merkName =
      toCleanString(
        getFieldCI(row, ['PRNM', 'NAMAMERK', 'MERKNAME', 'NAMA', 'MERK', 'MEREK', 'BRAND', 'KET', 'KETERANGAN', 'DESC'])
      ) || getFallbackLabelCI(row, ['PRID', 'IDMERK', 'KODEMERK', 'MERKID', 'ID']);
    if (merkName) {
      merkMap.set(prid, merkName);
    }
  }

  // 3. Indeks PosBARANG berdasarkan KBRG -> Stok Awal
  const posStockMap = new Map<string, number>();
  for (const row of posBarangRows) {
    const kbrg = normalizeKey(getFieldCI(row, ['KBRG', 'KODEBRG', 'KODEBARANG', 'KODE']));
    if (!kbrg) continue;
    const stockVal = toSafeNumber(
      getFieldCI(row, [
        'STOK',
        'STOKAWAL',
        'STOK_AWAL',
        'STOCK',
        'SALDO',
        'QTY',
        'SAKHIR',
        'AKHIR',
        'QAKHIR',
        'SISA',
        'JML',
        'JUMLAH',
        'ONHAND',
      ])
    );
    posStockMap.set(kbrg, (posStockMap.get(kbrg) || 0) + stockVal);
  }

  // 4. Indeks OtherUnitOnStok berdasarkan KBRG -> USAT, ISI1, HBEL, HAR1, HAR2, HAR3
  const unitMap = new Map<string, UnitPriceEntry[]>();
  for (const row of otherUnitRows) {
    const kbrg = normalizeKey(getFieldCI(row, ['KBRG', 'KODEBRG', 'KODEBARANG', 'KODE']));
    if (!kbrg) continue;
    const entry: UnitPriceEntry = {
      usat: toCleanString(getFieldCI(row, ['USAT', 'SATUAN', 'SAT', 'UNIT'])),
      isi1: toSafeNumber(getFieldCI(row, ['ISI1', 'ISI', 'KONVERSI', 'QTYKONVERSI'])) || 1,
      hbel: toSafeNumber(getFieldCI(row, ['HBEL', 'HARGABELI', 'HPP', 'MODAL', 'COST'])),
      har1: toSafeNumber(getFieldCI(row, ['HAR1', 'HJUAL1', 'HARGAJUAL', 'HARGA1', 'RETAIL'])),
      har2: toSafeNumber(getFieldCI(row, ['HAR2', 'HJUAL2', 'HARGA2', 'MEMBER'])),
      har3: toSafeNumber(getFieldCI(row, ['HAR3', 'HJUAL3', 'HARGA3', 'GROSIR'])),
      barcode: toCleanString(getFieldCI(row, ['BARCODE', 'KBAR', 'KODEBARCODE', 'NO_BARCODE', 'EAN', 'PLU'])),
    };
    const list = unitMap.get(kbrg) || [];
    list.push(entry);
    unitMap.set(kbrg, list);
  }

  // 5. Gabungkan MsBarang dengan seluruh tabel relasi ke struktur baku Master Data JacS RetailOS ERP
  let matchedUnits = 0;
  let matchedGroups = 0;
  let matchedBrands = 0;
  let matchedStocks = 0;

  const mergedRows: Record<string, string>[] = msBarangRows.map((row) => {
    const kbrgRaw = toCleanString(getFieldCI(row, ['KBRG', 'KODEBRG', 'KODEBARANG', 'KODE']));
    const kbrgKey = normalizeKey(kbrgRaw);

    const unitEntries = kbrgKey ? unitMap.get(kbrgKey) || [] : [];
    const primaryUnit = pickPrimaryUnitEntry(unitEntries);
    if (primaryUnit) matchedUnits += 1;

    const gridKey = normalizeKey(getFieldCI(row, ['GRID', 'IDGROUP', 'KODEGROUP', 'GROUPID']));
    const groupName = (gridKey && groupMap.get(gridKey)) || '';
    if (groupName) matchedGroups += 1;

    const pridKey = normalizeKey(getFieldCI(row, ['PRID', 'IDMERK', 'KODEMERK', 'MERKID']));
    const merkName = (pridKey && merkMap.get(pridKey)) || '';
    if (merkName) matchedBrands += 1;

    const hasPosStock = Boolean(kbrgKey && posStockMap.has(kbrgKey));
    if (hasPosStock) matchedStocks += 1;

    // Barcode / ID: prioritas kolom barcode eksplisit -> barcode OtherUnitOnStok -> KBRG
    const explicitBarcode = toCleanString(
      getFieldCI(row, ['BARCODE', 'KBAR', 'KODEBARCODE', 'NO_BARCODE', 'EAN', 'UPC', 'PLU'])
    );
    const resolvedBarcode = explicitBarcode || primaryUnit?.barcode || kbrgRaw;

    // Nama Produk
    const productName = toCleanString(
      getFieldCI(row, [
        'NBRG',
        'NAMABRG',
        'NAMABARANG',
        'NAMA',
        'NAMAITEM',
        'ITEMNAME',
        'DESKRIPSI',
        'KET',
        'KETERANGAN',
        'LONGDESC',
      ])
    );

    // Satuan & Isi Konversi
    const fallbackUnit = toCleanString(getFieldCI(row, ['USAT', 'SATUAN', 'SAT', 'SAT1', 'UNIT']));
    const resolvedUnit = primaryUnit?.usat || fallbackUnit || 'Pcs';
    const resolvedIsi = primaryUnit?.isi1 || toSafeNumber(getFieldCI(row, ['ISI1', 'ISI'])) || 1;

    // Harga Beli (HPP) & Harga Jual Multi-Tier (HAR1=Retail, HAR2=Member, HAR3=Grosir)
    const fallbackHbel = toSafeNumber(getFieldCI(row, ['HBEL', 'HARGABELI', 'HPP', 'MODAL']));
    const fallbackHar1 = toSafeNumber(getFieldCI(row, ['HAR1', 'HJUAL', 'HJUAL1', 'HARGAJUAL', 'RETAIL']));
    const fallbackHar2 = toSafeNumber(getFieldCI(row, ['HAR2', 'HJUAL2', 'MEMBER']));
    const fallbackHar3 = toSafeNumber(getFieldCI(row, ['HAR3', 'HJUAL3', 'GROSIR']));

    const hpp = primaryUnit && primaryUnit.hbel > 0 ? primaryUnit.hbel : fallbackHbel;
    const retail = primaryUnit && primaryUnit.har1 > 0 ? primaryUnit.har1 : fallbackHar1;
    const member = primaryUnit && primaryUnit.har2 > 0 ? primaryUnit.har2 : fallbackHar2;
    const grosir = primaryUnit && primaryUnit.har3 > 0 ? primaryUnit.har3 : fallbackHar3;

    // Kategori & Merek (fallback ke kolom langsung di MsBarang jika ada)
    const resolvedCategory =
      groupName ||
      toCleanString(getFieldCI(row, ['KATEGORI', 'GRNM', 'GROUP', 'CATEGORY', 'GOLONGAN'])) ||
      (gridKey || '');
    const resolvedBrand =
      merkName ||
      toCleanString(getFieldCI(row, ['MEREK', 'MERK', 'PRNM', 'BRAND'])) ||
      '';

    // Stok Awal: prioritas PosBARANG -> kolom stok MsBarang -> 0
    const fallbackStock = toSafeNumber(
      getFieldCI(row, ['STOK', 'STOKAWAL', 'STOK_AWAL', 'STOCK', 'QTY', 'SALDO', 'SAKHIR', 'SISA'])
    );
    const resolvedStock = hasPosStock ? (posStockMap.get(kbrgKey) ?? 0) : fallbackStock;

    return {
      BARCODE_ID: resolvedBarcode,
      NAMA_PRODUK: productName,
      NAMA_KATEGORI: resolvedCategory,
      SATUAN: resolvedUnit,
      ISI_KONVERSI: String(resolvedIsi),
      HPP: String(Math.round(hpp)),
      RETAIL: String(Math.round(retail)),
      MEMBER: member > 0 ? String(Math.round(member)) : '',
      GROSIR: grosir > 0 ? String(Math.round(grosir)) : '',
      BRAND: resolvedBrand,
      STOK: String(Math.round(resolvedStock)),
    };
  });

  return {
    headers: [...MDB_STANDARD_HEADERS],
    rows: mergedRows,
    summary: {
      allTableNames,
      msBarangTable,
      otherUnitTable,
      itemGroupTable,
      itemMerkTable,
      posBarangTable,
      msBarangCount: msBarangRows.length,
      otherUnitCount: otherUnitRows.length,
      itemGroupCount: itemGroupRows.length,
      itemMerkCount: itemMerkRows.length,
      posBarangCount: posBarangRows.length,
      matchedUnits,
      matchedGroups,
      matchedBrands,
      matchedStocks,
    },
  };
}
