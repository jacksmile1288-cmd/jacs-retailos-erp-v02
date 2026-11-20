import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  ArrowRight,
  Table2,
  ShieldAlert,
  Play,
  Trash2,
} from 'lucide-react';
import { Product } from '../../types';
import { parseExcelBuffer, parseDelimitedText } from '../migration/multiFormatParser';
import {
  RETAIL_CATEGORY_DICTIONARY,
  toTitleCase,
  runAISmartMapper,
  parseProductAttributes,
  calculateTierPrices,
} from './MasterDataModule';

export type RetailOsTargetField =
  | 'ignore'
  | 'barcode'
  | 'categoryCode'
  | 'categoryName'
  | 'name'
  | 'brand'
  | 'costPrice'
  | 'retailPrice'
  | 'memberPrice'
  | 'wholesalePrice'
  | 'stock'
  | 'unit';

interface FieldSchemaOption {
  key: RetailOsTargetField;
  label: string;
  required?: boolean;
  hint: string;
  aliases: string[];
}

const RETAIL_OS_SCHEMA_FIELDS: FieldSchemaOption[] = [
  {
    key: 'ignore',
    label: '-- Abaikan Kolom --',
    hint: 'Tidak diimpor',
    aliases: [],
  },
  {
    key: 'barcode',
    label: 'BARCODE_ID (Barcode / ID Non-Barcode)',
    hint: 'Auto-generate INT-XXXX jika non-barcode',
    aliases: ['barcode_id', 'barcode id', 'barcode', 'kode/plu', 'kode plu', 'plu', 'kode', 'sku', 'kode barang', 'kode item', 'kd', 'ean', 'upc', 'item code', 'kode_barcode', 'id'],
  },
  {
    key: 'categoryCode',
    label: 'NO_KATEGORI (2 - 471)',
    hint: 'Auto-klasifikasi angka kategori (PC.2 -> 2)',
    aliases: ['no_kategori', 'no kategori', 'kode_kategori', 'kode kategori', 'kode_kategori_resmi', 'categorycode', 'pc', 'ktg', 'kode ktg'],
  },
  {
    key: 'categoryName',
    label: 'NAMA_KATEGORI',
    hint: 'Otomatis disinkronkan dari No Kategori',
    aliases: ['nama_kategori', 'nama kategori', 'kategori', 'category', 'category name', 'dept', 'departemen', 'kelompok', 'group', 'golongan'],
  },
  {
    key: 'name',
    label: 'NAMA_PRODUK (Long Desc)',
    required: true,
    hint: 'Wajib terisi',
    aliases: ['nama_produk', 'nama produk', 'nama_produk_long_desc', 'long desc', 'longdesc', 'nama item', 'nama barang', 'nama brg', 'item name', 'product name', 'deskripsi', 'uraian', 'produk', 'item', 'nama'],
  },
  {
    key: 'brand',
    label: 'BRAND',
    hint: 'Auto-ekstrak kata pertama jika kosong',
    aliases: ['brand', 'merek', 'merk', 'mrk', 'pabrikan', 'principal', 'produsen', 'vendor'],
  },
  {
    key: 'costPrice',
    label: 'HPP',
    required: true,
    hint: 'Wajib > Rp 0 (bersihkan Rp/titik/koma)',
    aliases: ['hpp', 'modal/beli', 'modal', 'beli', 'harga beli', 'harga modal', 'hrg beli', 'cost', 'cost price', 'cogs', 'harga pokok', 'pokok'],
  },
  {
    key: 'retailPrice',
    label: 'RETAIL (+20%)',
    hint: 'Otomatis HPP + 20% jika kosong',
    aliases: ['retail', 'harga_retail', 'harga retail', 'harga jual', 'hrg jual', 'jual', 'selling price', 'sell price', 'price retail', 'harga ecer', 'harga'],
  },
  {
    key: 'memberPrice',
    label: 'MEMBER (+15%)',
    hint: 'Otomatis HPP + 15% jika kosong',
    aliases: ['member', 'harga_member', 'harga member', 'member price', 'hrg member', 'price member'],
  },
  {
    key: 'wholesalePrice',
    label: 'GROSIR (+10%)',
    hint: 'Otomatis HPP + 10% jika kosong',
    aliases: ['grosir', 'harga_grosir', 'harga grosir', 'wholesale', 'wholesale price', 'hrg grosir', 'harga partai', 'partai'],
  },
  {
    key: 'stock',
    label: 'STOK',
    hint: 'Qty / Sisa stok fisik',
    aliases: ['stok', 'stok_awal', 'stok awal', 'qty/sisa', 'qty', 'sisa', 'stock', 'stk', 'saldo', 'jumlah', 'kuantitas', 'quantity', 'sisa stok'],
  },
  {
    key: 'unit',
    label: 'SATUAN',
    hint: 'Auto-deteksi dari nama jika kosong',
    aliases: ['satuan', 'sat', 'uom', 'unit', 'kemasan', 'packaging'],
  },
];

const OFFLINE_MIGRATION_STORAGE_KEY = 'jacs_retailos_offline_migration_draft';

const SAMPLE_LEGACY_POS_CSV = `Kode/PLU,Nama Item,Modal/Beli,Harga Jual,Qty/Sisa,Sat
899275321901,Indomie Goreng Spesial 85gr,Rp 2.800,"Rp 3.500,-",120,Bungkus
899275321902,Bimoli Minyak Goreng Botol 2 Lt,"31.000,00",,45,Btl
899275321903,Kapal Api Special Mix 10x24gr,Rp 14.200,Rp 18.000,60,Pack
899275321904,Dancow Fortigro Cokelat Box 400gr,Rp 38.500,Rp 34.000,20,Box
899275321905,,Rp 9.500,Rp 12.000,15,Pcs
899275321906,Aqua Air Mineral 600ml,Rp 2.400,Rp 3.500,200,Botol`;

/**
 * Membersihkan format angka kotor ("Rp 15.000,-", "Rp15,000.00", "2.500", " 12 000 ")
 */
export function cleanDirtyNumber(val: string | number | undefined | null): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (val === undefined || val === null) return 0;

  let raw = String(val).trim();
  if (!raw) return 0;

  const isNegative = raw.startsWith('-') || /\(\s*[\d.,]+\s*\)/.test(raw);
  // Hapus Rp, IDR, $, strip akhir ",-" atau "/-", spasi
  raw = raw
    .replace(/,-$/g, '')
    .replace(/\/-$/g, '')
    .replace(/(rp|idr|\$)/gi, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, '')
    .replace(/^-/, '')
    .trim();

  if (!raw || !/\d/.test(raw)) return 0;

  if (raw.includes('.') && raw.includes(',')) {
    if (raw.lastIndexOf(',') > raw.lastIndexOf('.')) {
      // Format Indonesia: 15.000,50 -> 15000.50
      raw = raw.replace(/\./g, '').replace(',', '.');
    } else {
      // Format US: 15,000.50 -> 15000.50
      raw = raw.replace(/,/g, '');
    }
  } else if (raw.includes('.')) {
    const parts = raw.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      raw = raw.replace(/\./g, '');
    }
  } else if (raw.includes(',')) {
    const parts = raw.split(',');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      raw = raw.replace(/,/g, '');
    } else {
      raw = raw.replace(',', '.');
    }
  }

  const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(parsed)) return 0;
  return isNegative ? -parsed : parsed;
}

function normalizeUnitValue(rawUnit: string, fallbackUnit: string): string {
  const clean = (rawUnit || '').trim();
  if (!clean) return fallbackUnit;
  const low = clean.toLowerCase();
  if (/^(pcs|pc|buah|bh|biji|bj|unit)$/i.test(low)) return 'Pcs';
  if (/^(btl|botol|bottle)$/i.test(low)) return 'Botol';
  if (/^(box|dus|dos|karton|ctn|crt)$/i.test(low)) return 'Box';
  if (/^(pack|pak|pck|renteng|rtg|bungkus|bks)$/i.test(low)) return 'Pack';
  if (/^(sch|sachet|sac)$/i.test(low)) return 'Sachet';
  if (/^(kg|kilogram|sak|karung)$/i.test(low)) return 'Kg';
  if (/^(lt|l|liter)$/i.test(low)) return 'Liter';
  if (/^(klg|kaleng|can)$/i.test(low)) return 'Kaleng';
  return toTitleCase(clean);
}

function resolveCategoryFromSource(
  rawCategory: string,
  barcode: string,
  formattedName: string,
  existingProducts: Product[]
): { categoryCode: number; categoryName: string; matchedBy: 'SOURCE_CODE' | 'BARCODE' | 'AI_TOKEN' | 'DEFAULT' } {
  const cleanSrc = (rawCategory || '').trim();
  if (cleanSrc) {
    // 1. Cek pola "PC.24" atau angka kategori murni "24"
    const pcMatch = cleanSrc.match(/(?:pc\.?\s*)?(\d{1,3})/i);
    if (pcMatch) {
      const codeNum = Number(pcMatch[1]);
      const foundCode = RETAIL_CATEGORY_DICTIONARY.find((c) => c.code === codeNum);
      if (foundCode) {
        return { categoryCode: foundCode.code, categoryName: foundCode.name, matchedBy: 'SOURCE_CODE' };
      }
    }
    // 2. Cek kecocokan nama kategori atau kata kunci
    const lowSrc = cleanSrc.toLowerCase();
    const byName = RETAIL_CATEGORY_DICTIONARY.find(
      (c) => c.name.toLowerCase().includes(lowSrc) || lowSrc.includes(c.name.toLowerCase()) || c.keywords.some((kw) => lowSrc.includes(kw))
    );
    if (byName) {
      return { categoryCode: byName.code, categoryName: byName.name, matchedBy: 'SOURCE_CODE' };
    }
  }

  const ai = runAISmartMapper(barcode, formattedName, existingProducts);
  return {
    categoryCode: ai.categoryCode,
    categoryName: ai.categoryName,
    matchedBy: ai.matchedBy,
  };
}

function escapeCsvCell(val: string | number | undefined | null): string {
  const s = val === undefined || val === null ? '' : String(val);
  if (/[",\n\r;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsvFile(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const csvLines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r) => r.map(escapeCsvCell).join(',')),
  ];
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function autoDetectColumnTarget(header: string): RetailOsTargetField {
  const rawLower = header.toLowerCase().trim();
  const cleanHeader = rawLower.replace(/[^a-z0-9]/g, '');
  const headerTokens = rawLower.split(/[^a-z0-9]+/).filter(Boolean);

  if (!cleanHeader) return 'ignore';

  let bestField: RetailOsTargetField = 'ignore';
  let bestScore = 0;

  for (const field of RETAIL_OS_SCHEMA_FIELDS) {
    if (field.key === 'ignore') continue;

    // Guard agar kolom tidak saling tertukar
    if (field.key === 'retailPrice' && /(modal|beli|cost|hpp|pokok|member|grosir|wholesale)/i.test(rawLower)) continue;
    if (field.key === 'costPrice' && /(jual|retail|selling|member|grosir|wholesale)/i.test(rawLower)) continue;
    if (field.key === 'memberPrice' && !/member/i.test(rawLower)) continue;
    if (field.key === 'wholesalePrice' && !/(grosir|wholesale|partai)/i.test(rawLower)) continue;
    if (field.key === 'name' && /kategori|category/i.test(rawLower)) continue;
    if (field.key === 'categoryName' && /(no|kode|code|pc)/i.test(rawLower)) continue;
    if (field.key === 'barcode' && /kategori|category/i.test(rawLower)) continue;

    for (const alias of field.aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      const aliasTokens = alias.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

      if (cleanHeader === cleanAlias) {
        if (100 > bestScore) {
          bestScore = 100;
          bestField = field.key;
        }
      } else if (aliasTokens.every((t) => headerTokens.includes(t)) && aliasTokens.length > 0) {
        const score = 85 + aliasTokens.length;
        if (score > bestScore) {
          bestScore = score;
          bestField = field.key;
        }
      } else if (cleanHeader.includes(cleanAlias) || (cleanHeader.length >= 3 && cleanAlias.includes(cleanHeader))) {
        const score = 55;
        if (score > bestScore) {
          bestScore = score;
          bestField = field.key;
        }
      }
    }
  }

  return bestField;
}

export interface EvaluatedMigrationRow {
  rowNumber: number;
  rawRow: Record<string, string>;
  barcode: string;
  brand: string;
  name: string;
  categoryCode: number;
  categoryName: string;
  categorySource: string;
  costPrice: number;
  retailPrice: number;
  retailAutoCalculated: boolean;
  memberPrice: number;
  wholesalePrice: number;
  stock: number;
  unit: string;
  isValid: boolean;
  errorReason: string | null;
}

export interface MigrationExecutionReport {
  executedAt: string;
  fileName: string;
  sourceHeaders: string[];
  totalRows: number;
  successCount: number;
  failedCount: number;
  totalAssetHppValue: number;
  totalUnitHppSum: number;
  successRows: EvaluatedMigrationRow[];
  failedRows: EvaluatedMigrationRow[];
}

interface SmartMigrationPanelProps {
  products: Product[];
  addProductsBulk: (
    pList: (Omit<Product, 'id'> & { id?: string })[],
    customMessage?: string
  ) => void;
  addAuditLog?: (action: string, module: string, details?: string) => void;
  showToast?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  isLight: boolean;
  onGoToCatalog: () => void;
}

export const SmartMigrationPanel: React.FC<SmartMigrationPanelProps> = ({
  products,
  addProductsBulk,
  addAuditLog,
  showToast,
  isLight,
  onGoToCatalog,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importText, setImportText] = useState<string>(() => {
    try {
      return localStorage.getItem(OFFLINE_MIGRATION_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [sourceFileName, setSourceFileName] = useState<string>('Tempel Teks / CSV');
  const [firstRowIsHeader, setFirstRowIsHeader] = useState<boolean>(true);
  const [excelParsedTable, setExcelParsedTable] = useState<{
    headers: string[];
    rows: Record<string, string>[];
    sheetName: string;
  } | null>(null);

  const [columnOverrides, setColumnOverrides] = useState<Record<string, RetailOsTargetField>>({});
  const [categoryOverrides, setCategoryOverrides] = useState<Record<number, number>>({});
  const [migrationReport, setMigrationReport] = useState<MigrationExecutionReport | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(OFFLINE_MIGRATION_STORAGE_KEY, importText);
    } catch {}
  }, [importText]);

  const sortedCategories = useMemo(
    () => [...RETAIL_CATEGORY_DICTIONARY].sort((a, b) => a.code - b.code),
    []
  );

  // Parse active source (Excel workbook OR delimited text)
  const parsedSource = useMemo<{ headers: string[]; rows: Record<string, string>[] }>(() => {
    if (excelParsedTable) {
      return { headers: excelParsedTable.headers, rows: excelParsedTable.rows };
    }
    const clean = importText.trim();
    if (!clean) return { headers: [], rows: [] };

    if (firstRowIsHeader) {
      return parseDelimitedText(clean);
    }

    // Jika baris pertama bukan header, parse sebagai baris biasa lalu beri label Kolom_1..N
    const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const first = lines[0];
    const delim = first.includes('|') ? '|' : first.includes(';') ? ';' : first.includes('\t') ? '\t' : ',';
    const rawMatrix = lines.map((line) =>
      line.split(delim).map((cell) => cell.trim().replace(/^["']|["']$/g, ''))
    );
    const maxCols = Math.max(...rawMatrix.map((r) => r.length), 1);
    const headers = Array.from({ length: maxCols }, (_, i) => `Kolom_${i + 1}`);
    const rows = rawMatrix.map((cols) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] ?? '';
      });
      return obj;
    });
    return { headers, rows };
  }, [excelParsedTable, importText, firstRowIsHeader]);

  // Resolved mapping: sourceHeader -> RetailOsTargetField
  const resolvedColumnMapping = useMemo(() => {
    const map: Record<string, RetailOsTargetField> = {};
    const claimedTargets = new Set<RetailOsTargetField>();

    // First apply manual overrides
    parsedSource.headers.forEach((h) => {
      const ov = columnOverrides[h];
      if (ov) {
        map[h] = ov;
        if (ov !== 'ignore') claimedTargets.add(ov);
      }
    });

    // Then auto-detect remaining headers cleanly
    parsedSource.headers.forEach((h) => {
      if (map[h]) return;
      const detected = autoDetectColumnTarget(h);
      if (detected !== 'ignore' && !claimedTargets.has(detected)) {
        map[h] = detected;
        claimedTargets.add(detected);
      } else {
        map[h] = 'ignore';
      }
    });

    return map;
  }, [parsedSource.headers, columnOverrides]);

  // Reverse lookup: RetailOsTargetField -> sourceHeader
  const targetToSourceHeader = useMemo(() => {
    const rev: Partial<Record<RetailOsTargetField, string>> = {};
    for (const [srcHeader, target] of Object.entries(resolvedColumnMapping)) {
      if (target !== 'ignore' && !rev[target]) {
        rev[target] = srcHeader;
      }
    }
    return rev;
  }, [resolvedColumnMapping]);

  // Evaluate every row (dry-run preview & validation)
  const evaluatedRows = useMemo<EvaluatedMigrationRow[]>(() => {
    if (parsedSource.rows.length === 0) return [];

    const catalogBarcodes = new Set(
      products.map((p) => (p.barcode || '').trim()).filter(Boolean)
    );
    const batchSeenBarcodes = new Set<string>();

    return parsedSource.rows.map((rawRow, idx) => {
      const rowNumber = firstRowIsHeader ? idx + 2 : idx + 1;
      const getVal = (field: RetailOsTargetField): string => {
        const srcHeader = targetToSourceHeader[field];
        return srcHeader ? String(rawRow[srcHeader] ?? '').trim() : '';
      };

      const rawBarcode = getVal('barcode');
      const rawName = getVal('name');
      const rawBrand = getVal('brand');
      const rawCategoryCode = getVal('categoryCode');
      const rawCategoryName = getVal('categoryName');
      const rawCategory = rawCategoryCode || rawCategoryName;
      const rawCost = getVal('costPrice');
      const rawRetail = getVal('retailPrice');
      const rawMember = getVal('memberPrice');
      const rawWholesale = getVal('wholesalePrice');
      const rawStock = getVal('stock');
      const rawUnit = getVal('unit');

      const formattedName = toTitleCase(rawName);
      const attrs = parseProductAttributes(formattedName || 'Produk');
      const brand = rawBrand ? toTitleCase(rawBrand) : formattedName ? attrs.brand : '';

      // Generate ID Internal otomatis (INT-XXXX) bila item tidak memiliki barcode pabrikan
      const barcode =
        rawBarcode || `INT-${String(1001 + idx).padStart(4, '0')}`;

      const costPrice = cleanDirtyNumber(rawCost);
      const tiers = calculateTierPrices(Math.max(costPrice, 0));

      const parsedRetail = rawRetail ? cleanDirtyNumber(rawRetail) : 0;
      const retailAutoCalculated = !rawRetail || parsedRetail <= 0;
      const retailPrice = !retailAutoCalculated ? parsedRetail : tiers.retailPrice;

      const parsedMember = rawMember ? cleanDirtyNumber(rawMember) : 0;
      const memberPrice = parsedMember > 0 ? parsedMember : tiers.memberPrice;

      const parsedWholesale = rawWholesale ? cleanDirtyNumber(rawWholesale) : 0;
      const wholesalePrice = parsedWholesale > 0 ? parsedWholesale : tiers.wholesalePrice;

      const stock = rawStock ? Math.round(cleanDirtyNumber(rawStock)) : 0;
      const unit = normalizeUnitValue(rawUnit, attrs.unit);

      const overrideCatCode = categoryOverrides[idx];
      let categoryCode: number;
      let categoryName: string;
      let categorySource: string;

      if (overrideCatCode !== undefined) {
        const found = sortedCategories.find((c) => c.code === overrideCatCode);
        categoryCode = overrideCatCode;
        categoryName = found ? found.name : 'Umum';
        categorySource = 'MANUAL';
      } else {
        const catRes = resolveCategoryFromSource(rawCategory, barcode, formattedName, products);
        categoryCode = catRes.categoryCode;
        categoryName = catRes.categoryName;
        categorySource = catRes.matchedBy;
      }

      // Row-by-row validation rules
      const reasons: string[] = [];
      if (!formattedName || formattedName.length < 2) {
        reasons.push('Nama produk (Long Desc) kosong');
      }
      if (!rawCost || costPrice <= 0) {
        reasons.push('HPP / Harga Modal kosong atau <= Rp 0');
      } else if (!retailAutoCalculated && retailPrice < costPrice) {
        reasons.push(
          `Harga jual retail (Rp ${retailPrice.toLocaleString('id-ID')}) di bawah HPP (Rp ${costPrice.toLocaleString('id-ID')})`
        );
      }
      if (stock < 0) {
        reasons.push(`Stok awal negatif (${stock})`);
      }
      if (rawBarcode && catalogBarcodes.has(barcode)) {
        reasons.push(`Duplikasi barcode (${barcode}) dengan katalog aktif`);
      } else if (rawBarcode && batchSeenBarcodes.has(barcode)) {
        reasons.push(`Duplikasi barcode (${barcode}) di dalam file impor`);
      }

      const isValid = reasons.length === 0;
      if (isValid && rawBarcode) {
        batchSeenBarcodes.add(barcode);
      }

      return {
        rowNumber,
        rawRow,
        barcode,
        brand: brand || 'GENERIC',
        name: formattedName,
        categoryCode,
        categoryName,
        categorySource,
        costPrice,
        retailPrice,
        retailAutoCalculated,
        memberPrice,
        wholesalePrice,
        stock,
        unit,
        isValid,
        errorReason: isValid ? null : reasons.join('; '),
      };
    });
  }, [parsedSource.rows, targetToSourceHeader, firstRowIsHeader, products, categoryOverrides, sortedCategories]);

  // Upload File (.CSV / .XLSX / .XLS / .TSV / .TXT)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setSourceFileName(file.name);
    setColumnOverrides({});
    setCategoryOverrides({});
    setMigrationReport(null);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'xlsx' || ext === 'xls') {
      try {
        const buffer = await file.arrayBuffer();
        const excelRes = parseExcelBuffer(buffer, file.name);
        if (excelRes.headers.length === 0 || excelRes.rows.length === 0) {
          showToast?.('File Excel kosong atau tidak memiliki baris data.', 'warning');
          return;
        }
        setExcelParsedTable({
          headers: excelRes.headers,
          rows: excelRes.rows,
          sheetName: excelRes.activeSheet,
        });
        // Tampilkan representasi CSV di textarea agar transparan & bisa diedit bila perlu
        const previewText = [
          excelRes.headers.join(','),
          ...excelRes.rows.map((r) => excelRes.headers.map((h) => escapeCsvCell(r[h])).join(',')),
        ].join('\n');
        setImportText(previewText);
        setFirstRowIsHeader(true);
        showToast?.(
          `Excel "${file.name}" (Sheet: ${excelRes.activeSheet}) berhasil dibaca (${excelRes.rows.length} baris).`,
          'success'
        );
      } catch (err: any) {
        showToast?.(`Gagal membaca file Excel: ${err?.message || 'Format tidak didukung'}`, 'error');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setExcelParsedTable(null);
      setImportText(content);
      setFirstRowIsHeader(true);
      showToast?.(`File "${file.name}" berhasil dimuat ke editor migrasi.`, 'success');
    };
    reader.readAsText(file);
  };

  const handleLoadSampleLegacyPos = () => {
    setExcelParsedTable(null);
    setSourceFileName('contoh_pos_lama.csv');
    setFirstRowIsHeader(true);
    setColumnOverrides({});
    setCategoryOverrides({});
    setMigrationReport(null);
    setImportText(SAMPLE_LEGACY_POS_CSV);
    showToast?.('Contoh tabel POS lama (6 baris termasuk simulasi baris valid & gagal) dimuat.', 'info');
  };

  const handleDownloadStandardTemplate = () => {
    downloadCsvFile(
      'JacS_RetailOS_Template_Migrasi.csv',
      [
        'BARCODE_ID',
        'NO_KATEGORI',
        'NAMA_KATEGORI',
        'NAMA_PRODUK',
        'BRAND',
        'HPP',
        'RETAIL',
        'MEMBER',
        'GROSIR',
        'STOK',
        'SATUAN',
      ],
      [
        ['8992727123456', '2', 'Powder Detergent', 'Kao Attack Clean Maximizer Powder Sachet 6x40 Gr', 'KAO ATTACK', '8000', '9600', '9200', '8800', '50', 'Pack'],
        ['8992696654321', '90', 'Instant Noodle', 'Indomie Goreng Spesial 85gr', 'INDOMIE', '2800', '3500', '3300', '3100', '120', 'Pack'],
        ['INT-1001', '342', 'Rice', 'Beras Pandan Wangi Premium Curah 5 Kg', 'PANDAN WANGI', '68000', '81600', '78200', '74800', '30', 'Kg'],
      ]
    );
  };

  // Partial-Commit Row-by-Row Execution
  const handleExecuteMigration = () => {
    if (evaluatedRows.length === 0) {
      showToast?.('Belum ada baris data yang siap dimigrasi.', 'warning');
      return;
    }

    const successRows = evaluatedRows.filter((r) => r.isValid);
    const failedRows = evaluatedRows.filter((r) => !r.isValid);

    const payloadsToCommit: (Omit<Product, 'id'> & { id?: string })[] = successRows.map((row, idx) => ({
      id: `SKU-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      barcode: row.barcode,
      name: row.name,
      brand: row.brand,
      category: row.categoryName,
      categoryCode: row.categoryCode,
      costPrice: row.costPrice,
      cost_price: row.costPrice,
      sellingPrice: row.retailPrice,
      sell_price: row.retailPrice,
      price_retail: row.retailPrice,
      retailPrice: row.retailPrice,
      price: row.retailPrice,
      memberPrice: row.memberPrice,
      price_member: row.memberPrice,
      wholesalePrice: row.wholesalePrice,
      price_wholesale: row.wholesalePrice,
      price_distributor: row.wholesalePrice,
      stock: row.stock,
      initialStock: row.stock,
      minStock: 10,
      min_stock: 10,
      unit: row.unit,
      status: row.stock > 0 ? 'Active' : 'Out of Stock',
      taxable: true,
    }));

    if (payloadsToCommit.length > 0) {
      addProductsBulk(
        payloadsToCommit,
        `Migrasi selesai: ${successRows.length} SKU berhasil masuk Katalog, ${failedRows.length} baris dikarantina.`
      );
      addAuditLog?.(
        'AI_SMART_MIGRATION_COMMIT',
        'MASTER_DATA',
        `Partial-commit migrasi (${sourceFileName}): ${successRows.length} sukses, ${failedRows.length} gagal dari ${evaluatedRows.length} baris.`
      );
    } else {
      showToast?.(
        `Tidak ada baris yang lolos validasi (${failedRows.length} baris dikarantina). Periksa laporan gagal.`,
        'error'
      );
    }

    const totalAssetHppValue = successRows.reduce(
      (sum, r) => sum + r.costPrice * Math.max(r.stock, 0),
      0
    );
    const totalUnitHppSum = successRows.reduce((sum, r) => sum + r.costPrice, 0);

    setMigrationReport({
      executedAt: new Date().toISOString(),
      fileName: sourceFileName,
      sourceHeaders: parsedSource.headers,
      totalRows: evaluatedRows.length,
      successCount: successRows.length,
      failedCount: failedRows.length,
      totalAssetHppValue,
      totalUnitHppSum,
      successRows,
      failedRows,
    });
  };

  const handleDownloadFailedCsv = () => {
    if (!migrationReport || migrationReport.failedRows.length === 0) return;
    const headers = ['No_Baris', ...migrationReport.sourceHeaders, 'Alasan_Error'];
    const rows = migrationReport.failedRows.map((f) => [
      f.rowNumber,
      ...migrationReport.sourceHeaders.map((h) => f.rawRow[h] ?? ''),
      f.errorReason || 'Error Validasi',
    ]);
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadCsvFile(`laporan-baris-gagal-migrasi-${dateStamp}.csv`, headers, rows);
  };

  const handleDownloadRetailOsCsv = () => {
    if (!migrationReport || migrationReport.successRows.length === 0) return;
    const headers = [
      'BARCODE_ID',
      'NO_KATEGORI',
      'NAMA_KATEGORI',
      'NAMA_PRODUK',
      'BRAND',
      'HPP',
      'RETAIL',
      'MEMBER',
      'GROSIR',
      'STOK',
      'SATUAN',
    ];
    const rows = migrationReport.successRows.map((s) => [
      s.barcode,
      String(s.categoryCode),
      s.categoryName,
      s.name,
      s.brand,
      s.costPrice,
      s.retailPrice,
      s.memberPrice,
      s.wholesalePrice,
      s.stock,
      s.unit,
    ]);
    downloadCsvFile('Hasil_Migrasi_RetailOS.csv', headers, rows);
  };

  const validPreviewCount = evaluatedRows.filter((r) => r.isValid).length;
  const invalidPreviewCount = evaluatedRows.length - validPreviewCount;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. KARTU INPUT SUMBER DATA + COLUMN MAPPER INTERAKTIF */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Panel Kiri: Upload / Paste Teks Bebas POS Lama */}
        <div
          className={`xl:col-span-5 rounded-2xl border p-5 flex flex-col space-y-4 transition-all duration-200 ${
            isLight
              ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.18)] hover:border-cyan-500 hover:shadow-[0_0_22px_rgba(6,182,212,0.32)] text-slate-900'
              : 'bg-slate-900/90 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.16)] text-slate-100'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium tracking-wide text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>1. Sumber Data POS Lama (CSV / Excel / Teks)</span>
              </h2>
              <p className={`text-[11px] font-normal mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Nama kolom bebas seperti <code className="font-mono">Kode/PLU</code>,{' '}
                <code className="font-mono">Nama Item</code>, <code className="font-mono">Modal/Beli</code>,{' '}
                <code className="font-mono">Harga Jual</code>, <code className="font-mono">Qty/Sisa</code>.
              </p>
            </div>
          </div>

          {/* Dropzone Upload File */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`p-3.5 rounded-xl border border-dashed flex items-center gap-3 cursor-pointer transition ${
              isLight
                ? 'bg-slate-50/70 border-cyan-500/50 hover:border-cyan-500 hover:bg-cyan-50/40'
                : 'bg-slate-950 border-slate-700 hover:border-cyan-500'
            }`}
          >
            <FileSpreadsheet className="w-6 h-6 text-cyan-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate">
                Unggah File .CSV / .XLSX / .XLS / .TXT
              </div>
              <div className={`text-[11px] font-normal truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Aktif: <span className="font-mono font-medium text-cyan-600 dark:text-cyan-400">{sourceFileName}</span> ({parsedSource.rows.length} baris terbaca)
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.tsv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Toolbar Aksi Cepat */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleLoadSampleLegacyPos}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 cursor-pointer transition ${
                  isLight
                    ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-400/70 text-cyan-800'
                    : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40 text-cyan-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Muat Contoh POS Lama</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadStandardTemplate}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 cursor-pointer transition ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Template RetailOS (.csv)</span>
              </button>
            </div>

            {importText && (
              <button
                type="button"
                onClick={() => {
                  setImportText('');
                  setExcelParsedTable(null);
                  setColumnOverrides({});
                  setCategoryOverrides({});
                  setMigrationReport(null);
                  setSourceFileName('Kosong');
                }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-rose-500 hover:bg-rose-500/10 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan</span>
              </button>
            )}
          </div>

          <textarea
            rows={8}
            value={importText}
            onChange={(e) => {
              setExcelParsedTable(null);
              setSourceFileName('Tempel Teks Manual');
              setImportText(e.target.value);
              setMigrationReport(null);
            }}
            placeholder={`Tempel tabel CSV / Excel / Tab di sini, contoh:\nKode/PLU,Nama Item,Modal/Beli,Harga Jual,Qty/Sisa\n899275321901,Indomie Goreng 85gr,Rp 2.800,Rp 3.500,120`}
            className={`w-full rounded-xl border p-3 text-xs font-mono font-normal focus:outline-none focus:border-cyan-500 flex-1 ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900'
                : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}
          />

          <label className={`flex items-center gap-2 text-xs font-normal cursor-pointer ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            <input
              type="checkbox"
              checked={firstRowIsHeader}
              onChange={(e) => setFirstRowIsHeader(e.target.checked)}
              className="rounded border-slate-500 text-cyan-500"
            />
            <span>Baris pertama adalah Nama Kolom (Header)</span>
          </label>
        </div>

        {/* Panel Kanan: Smart Column Mapper Interaktif */}
        <div
          className={`xl:col-span-7 rounded-2xl border p-5 flex flex-col space-y-4 transition-all duration-200 ${
            isLight
              ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.18)] hover:border-cyan-500 hover:shadow-[0_0_22px_rgba(6,182,212,0.32)] text-slate-900'
              : 'bg-slate-900/90 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.16)] text-slate-100'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium tracking-wide text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Table2 className="w-4 h-4" />
                <span>2. Smart Column Mapper (Format Baku JacS RetailOS ERP)</span>
              </h2>
              <p className={`text-[11px] font-normal mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Auto-ekstrak Brand kata pertama, auto-klasifikasi No Kategori (2–471), pembersihan angka kotor, dan auto-kalkulasi tier harga (+20% / +15% / +10%).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setColumnOverrides({})}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              <span>Deteksi Ulang</span>
            </button>
          </div>

          {parsedSource.headers.length === 0 ? (
            <div
              className={`flex-1 min-h-[240px] rounded-xl border flex flex-col items-center justify-center p-6 text-center ${
                isLight ? 'bg-slate-50/70 border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <Sparkles className="w-8 h-8 text-cyan-500/60 mb-2" />
              <p className="text-xs font-medium">
                Unggah file CSV/Excel atau tempel teks tabel di panel kiri untuk mengaktifkan Smart Column Mapper.
              </p>
            </div>
          ) : (
            <div
              className={`rounded-xl border overflow-x-auto flex-1 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <table className="w-full text-left text-xs">
                <thead className={isLight ? 'bg-slate-100 text-slate-700 border-b border-slate-200' : 'bg-slate-900 text-slate-400 border-b border-slate-800'}>
                  <tr>
                    <th className="py-2.5 px-3 font-medium">Kolom Sumber</th>
                    <th className="py-2.5 px-3 font-medium">Contoh Nilai</th>
                    <th className="py-2.5 px-3 font-medium">Petakan ke Skema RetailOS</th>
                    <th className="py-2.5 px-3 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/70'}`}>
                  {parsedSource.headers.map((header) => {
                    const mappedTarget = resolvedColumnMapping[header] || 'ignore';
                    const sampleVal = parsedSource.rows[0]?.[header] || '-';
                    const isMapped = mappedTarget !== 'ignore';
                    const schemaInfo = RETAIL_OS_SCHEMA_FIELDS.find((f) => f.key === mappedTarget);

                    return (
                      <tr key={header} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/60'}>
                        <td className="py-2 px-3 font-mono font-medium whitespace-nowrap">{header}</td>
                        <td className={`py-2 px-3 font-mono font-normal text-[11px] truncate max-w-[170px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`} title={sampleVal}>
                          {sampleVal}
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={mappedTarget}
                            onChange={(e) => {
                              const nextField = e.target.value as RetailOsTargetField;
                              setColumnOverrides((prev) => ({ ...prev, [header]: nextField }));
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium outline-none cursor-pointer ${
                              isMapped
                                ? isLight
                                  ? 'bg-cyan-50 border-cyan-400 text-cyan-900'
                                  : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                                : isLight
                                ? 'bg-slate-50 border-slate-300 text-slate-600'
                                : 'bg-slate-900 border-slate-700 text-slate-400'
                            }`}
                          >
                            {RETAIL_OS_SCHEMA_FIELDS.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                          {schemaInfo && isMapped && (
                            <span className={`block text-[10px] font-normal mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              {schemaInfo.hint}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          {isMapped ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase tracking-widest border ${
                              isLight
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-400/70'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            }`}>
                              <CheckCircle2 className="w-3 h-3" />
                              TERPETAKAN
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase tracking-widest bg-slate-500/15 text-slate-400 border border-slate-500/20">
                              DIABAIKAN
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Ringkasan Auto-Enrichment & Tombol Eksekusi Migrasi */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className={`px-2.5 py-1 rounded-lg border font-medium ${
                isLight
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-400/70'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}>
                Siap Commit: {validPreviewCount}
              </span>
              <span className={`px-2.5 py-1 rounded-lg border font-medium ${
                invalidPreviewCount > 0
                  ? isLight
                    ? 'bg-rose-50 text-rose-700 border-rose-400/70'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
                Potensi Karantina: {invalidPreviewCount}
              </span>
            </div>

            <button
              type="button"
              disabled={evaluatedRows.length === 0}
              onClick={handleExecuteMigration}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white font-medium tracking-wide text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Eksekusi Migrasi ke Format RetailOS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. KARTU LAPORAN HASIL MIGRASI OTOMATIS (SUKSES VS GAGAL) */}
      {migrationReport && (
        <div
          className={`rounded-2xl border p-5 space-y-5 animate-fadeIn transition-all duration-200 ${
            isLight
              ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.18)] text-slate-900'
              : 'bg-[#161b22] border-cyan-500/50 shadow-[0_0_18px_rgba(6,182,212,0.14)] text-slate-100'
          }`}
        >
          <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b ${
            isLight ? 'border-cyan-500/20' : 'border-slate-800'
          }`}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-medium tracking-wide flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Kartu Laporan Hasil Migrasi</span>
                </h3>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase tracking-widest border ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-700 border-cyan-400/70'
                    : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                }`}>
                  PARTIAL-COMMIT ISOLATED
                </span>
              </div>
              <p className={`text-xs font-normal mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Sumber: <span className="font-mono font-medium">{migrationReport.fileName}</span> • Dieksekusi pada{' '}
                {new Date(migrationReport.executedAt).toLocaleString('id-ID')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={migrationReport.failedCount === 0}
                onClick={handleDownloadFailedCsv}
                className="px-3.5 py-2 rounded-xl text-xs font-medium tracking-wide bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Laporan Baris Gagal (.csv)</span>
              </button>

              <button
                type="button"
                disabled={migrationReport.successCount === 0}
                onClick={handleDownloadRetailOsCsv}
                className="px-3.5 py-2 rounded-xl text-xs font-medium tracking-wide bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Hasil Migrasi Format RetailOS (.csv)</span>
              </button>

              {migrationReport.successCount > 0 && (
                <button
                  type="button"
                  onClick={onGoToCatalog}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium tracking-wide border flex items-center gap-1.5 cursor-pointer transition ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300'
                  }`}
                >
                  <span>Buka Katalog SKU</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* (a) 3 Kartu Ringkasan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-cyan-500/40' : 'bg-slate-950 border-slate-800'}`}>
              <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-slate-400 block">Total Baris Diproses</span>
              <span className="text-2xl font-mono font-medium mt-1 block">{migrationReport.totalRows} Baris</span>
              <span className={`text-[11px] font-normal ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Pemrosesan baris-per-baris terisolasi
              </span>
            </div>

            <div className={`p-4 rounded-xl border ${isLight ? 'bg-emerald-50/70 border-emerald-400/70' : 'bg-emerald-950/20 border-emerald-500/40'}`}>
              <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">Berhasil Dimigrasi ke Katalog</span>
              <span className="text-2xl font-mono font-medium text-emerald-600 dark:text-emerald-400 mt-1 block">
                {migrationReport.successCount} SKU
              </span>
              <span className={`text-[11px] font-mono font-normal block mt-0.5 ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
                Total Nilai Aset HPP: Rp {migrationReport.totalAssetHppValue.toLocaleString('id-ID')}
              </span>
            </div>

            <div className={`p-4 rounded-xl border ${
              migrationReport.failedCount > 0
                ? isLight
                  ? 'bg-rose-50/80 border-rose-400/70'
                  : 'bg-rose-950/25 border-rose-500/40'
                : isLight
                ? 'bg-slate-50/70 border-slate-300/80'
                : 'bg-slate-950 border-slate-800'
            }`}>
              <span className={`text-[10px] font-mono font-medium uppercase tracking-widest block ${
                migrationReport.failedCount > 0 ? 'text-rose-500' : 'text-slate-400'
              }`}>
                Gagal / Dikarantina
              </span>
              <span className={`text-2xl font-mono font-medium mt-1 block ${
                migrationReport.failedCount > 0 ? 'text-rose-500' : 'text-slate-400'
              }`}>
                {migrationReport.failedCount} Baris
              </span>
              <span className={`text-[11px] font-normal ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {migrationReport.failedCount > 0
                  ? 'Tidak masuk katalog agar data tetap bersih'
                  : 'Seluruh baris lolos validasi 100%'}
              </span>
            </div>
          </div>

          {/* (b) Daftar Rincian Baris Gagal */}
          {migrationReport.failedRows.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium tracking-wide text-rose-500 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Rincian Baris Gagal &amp; Alasan Karantina ({migrationReport.failedRows.length})</span>
              </h4>
              <div
                className={`rounded-xl border overflow-x-auto max-h-64 overflow-y-auto ${
                  isLight ? 'bg-white border-rose-300' : 'bg-slate-950 border-rose-500/30'
                }`}
              >
                <table className="w-full text-left text-xs">
                  <thead className={isLight ? 'bg-rose-50 text-rose-900 border-b border-rose-200' : 'bg-rose-950/40 text-rose-300 border-b border-rose-500/20'}>
                    <tr>
                      <th className="py-2 px-3 font-medium">No. Baris</th>
                      <th className="py-2 px-3 font-medium">BARCODE / ID</th>
                      <th className="py-2 px-3 font-medium">NO KATEGORI</th>
                      <th className="py-2 px-3 font-medium">NAMA KATEGORI</th>
                      <th className="py-2 px-3 font-medium">NAMA PRODUK</th>
                      <th className="py-2 px-3 font-medium">BRAND</th>
                      <th className="py-2 px-3 text-right font-medium">HPP</th>
                      <th className="py-2 px-3 text-right font-medium">RETAIL</th>
                      <th className="py-2 px-3 font-medium">Alasan Gagal Spesifik</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/70'}`}>
                    {migrationReport.failedRows.map((fail) => (
                      <tr key={fail.rowNumber} className={isLight ? 'hover:bg-rose-50/40' : 'hover:bg-rose-950/20'}>
                        <td className="py-2 px-3 font-mono font-medium text-rose-500 whitespace-nowrap">
                          Baris #{fail.rowNumber}
                        </td>
                        <td className="py-2 px-3 font-mono font-normal text-[11px] whitespace-nowrap">{fail.barcode || '-'}</td>
                        <td className="py-2 px-3 font-mono font-normal text-[11px] whitespace-nowrap">{fail.categoryCode}</td>
                        <td className="py-2 px-3 font-normal whitespace-nowrap">{fail.categoryName}</td>
                        <td className="py-2 px-3 font-medium">{fail.name || <span className="italic text-rose-400">(Kosong)</span>}</td>
                        <td className="py-2 px-3 font-normal whitespace-nowrap">{fail.brand || '-'}</td>
                        <td className="py-2 px-3 font-mono font-normal text-right whitespace-nowrap">Rp {fail.costPrice.toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 font-mono font-normal text-right whitespace-nowrap">Rp {fail.retailPrice.toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 text-rose-500 font-normal">{fail.errorReason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. PRATINJAU KONVERSI KE FORMAT BAKU JACS RETAILOS ERP SEBELUM EKSEKUSI */}
      <div
        className={`rounded-2xl border p-5 space-y-3 transition-all duration-200 ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.18)] hover:border-cyan-500 hover:shadow-[0_0_22px_rgba(6,182,212,0.32)] text-slate-900'
            : 'bg-slate-900/90 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.16)] text-slate-100'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span>3. Pratinjau Transformasi Skema Baku RetailOS ERP ({evaluatedRows.length} Baris)</span>
            </h3>
            <p className={`text-[11px] font-normal mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Anda dapat menyesuaikan nomor kategori (2–471) langsung di tabel ini sebelum menekan tombol Eksekusi Migrasi.
            </p>
          </div>
        </div>

        <div
          className={`rounded-xl border overflow-x-auto max-h-[380px] overflow-y-auto ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <table className="w-full text-left text-xs">
            <thead className={isLight ? 'bg-slate-100 text-slate-700 border-b border-slate-200 sticky top-0' : 'bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0'}>
              <tr>
                <th className="py-2.5 px-3 whitespace-nowrap font-medium">Baris</th>
                <th className="py-2.5 px-3 whitespace-nowrap font-medium">Status</th>
                <th className="py-2.5 px-3 whitespace-nowrap font-medium">BARCODE / ID</th>
                <th className="py-2.5 px-3 whitespace-nowrap font-medium">NO KATEGORI</th>
                <th className="py-2.5 px-3 whitespace-nowrap font-medium">NAMA KATEGORI</th>
                <th className="py-2.5 px-3 min-w-[200px] font-medium">NAMA PRODUK</th>
                <th className="py-2.5 px-3 whitespace-nowrap font-medium">BRAND</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap font-medium">HPP</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap font-medium">RETAIL (+20%)</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap font-medium">MEMBER (+15%)</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap font-medium">GROSIR (+10%)</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap font-medium">STOK</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/70'}`}>
              {evaluatedRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 px-4 text-center text-slate-500 font-normal">
                    Belum ada data yang diunggah atau ditempel. Klik &ldquo;Muat Contoh POS Lama&rdquo; untuk langsung mencoba simulasi konversi &amp; karantina error.
                  </td>
                </tr>
              ) : (
                evaluatedRows.map((row, idx) => (
                  <tr
                    key={`${row.rowNumber}-${idx}`}
                    className={
                      row.isValid
                        ? isLight
                          ? 'hover:bg-slate-50'
                          : 'hover:bg-slate-900/60'
                        : isLight
                        ? 'bg-rose-50/70 hover:bg-rose-50'
                        : 'bg-rose-950/20 hover:bg-rose-950/30'
                    }
                  >
                    <td className="py-2 px-3 font-mono font-normal text-[11px] text-slate-400">#{row.rowNumber}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {row.isValid ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase tracking-widest border ${
                          isLight
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-400/70'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          VALID
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase tracking-widest border ${
                            isLight
                              ? 'bg-rose-50 text-rose-700 border-rose-400/70'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}
                          title={row.errorReason || ''}
                        >
                          <XCircle className="w-3 h-3" />
                          KARANTINA
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono font-normal text-[11px] whitespace-nowrap">
                      <span
                        className={
                          row.barcode.startsWith('INT-')
                            ? 'px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30 font-medium'
                            : isLight
                            ? 'text-cyan-700 font-medium'
                            : 'text-cyan-400'
                        }
                      >
                        {row.barcode}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <select
                        value={row.categoryCode}
                        title={`${row.categoryCode} — ${row.categoryName}`}
                        onChange={(e) =>
                          setCategoryOverrides((prev) => ({
                            ...prev,
                            [idx]: Number(e.target.value),
                          }))
                        }
                        className={`w-20 truncate px-2 py-1 rounded-md border font-mono text-[10px] font-medium outline-none cursor-pointer ${
                          isLight
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        {sortedCategories.map((c) => (
                          <option key={c.code} value={c.code} className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>
                            {c.code} — {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-normal">
                      {row.categoryName}
                    </td>
                    <td className="py-2 px-3 min-w-[200px]">
                      <div className="font-medium">
                        {row.name || <span className="text-rose-500 italic">(Nama kosong)</span>}
                      </div>
                      {!row.isValid && row.errorReason && (
                        <div className="text-[10px] text-rose-500 font-normal flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{row.errorReason}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 font-normal whitespace-nowrap">{row.brand}</td>
                    <td className="py-2 px-3 font-mono font-normal text-right whitespace-nowrap">
                      Rp {row.costPrice.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 font-mono font-medium text-right whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                      Rp {row.retailPrice.toLocaleString('id-ID')}
                      {row.retailAutoCalculated && (
                        <span className="block text-[9px] font-normal text-slate-400">auto +20%</span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono font-normal text-right whitespace-nowrap text-cyan-600 dark:text-cyan-400">
                      Rp {row.memberPrice.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 font-mono font-normal text-right whitespace-nowrap text-purple-600 dark:text-purple-400">
                      Rp {row.wholesalePrice.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 font-mono font-normal text-center whitespace-nowrap">
                      {row.stock} {row.unit}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SmartMigrationPanel;
