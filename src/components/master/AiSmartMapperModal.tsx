import React, { useState, useMemo, useRef } from 'react';
import {
  Sparkles,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Layers,
  Building2,
  Package,
  Boxes,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Product } from '../../types';

interface AiSmartMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProducts: (
    newProducts: Array<Partial<Product> & { manufacturer?: string; rackLocation?: string }>,
    newBrands: Array<{ name: string; manufacturer?: string }>,
    newCategories: string[]
  ) => void;
  isLight: boolean;
  isEn: boolean;
}

// Canonical target fields for mapping
type CanonicalField =
  | 'barcode'
  | 'name'
  | 'category'
  | 'brand'
  | 'cost_price'
  | 'sell_price'
  | 'stock'
  | 'unit'
  | 'ignore';

const FIELD_DEFINITIONS: Record<
  CanonicalField,
  { labelId: string; labelEn: string; aliases: string[] }
> = {
  barcode: {
    labelId: 'Kode Barcode / SKU',
    labelEn: 'Barcode / SKU Code',
    aliases: ['barcode', 'kode barcode', 'sku', 'kode barang', 'kode', 'upc', 'ean', 'kd', 'item code', 'plu', 'kode menu', 'kode obat', 'kode tipe', 'kode jasa', 'sku induk', 'barcode varian'],
  },
  name: {
    labelId: 'Nama Barang Lengkap',
    labelEn: 'Full Product Name',
    aliases: ['nama brg', 'nama barang', 'item name', 'item', 'nama produk', 'deskripsi', 'produk', 'product', 'uraian', 'nama', 'nama menu/minuman', 'nama menu', 'nama obat', 'nama unit', 'nama gadget', 'nama servis', 'nama layanan', 'nama layanan / jasa'],
  },
  category: {
    labelId: 'Kategori Produk',
    labelEn: 'Category',
    aliases: ['ktg', 'kategori', 'category', 'dept', 'kelompok', 'group', 'kat', 'golongan', 'departemen', 'kategori (food/beverage)'],
  },
  brand: {
    labelId: 'Merek / Brand',
    labelEn: 'Brand',
    aliases: ['mrk', 'merek', 'brand', 'merk', 'principal', 'pabrikan', 'vendor', 'manufaktur'],
  },
  cost_price: {
    labelId: 'Harga Beli (HPP Modal)',
    labelEn: 'Cost Price (HPP)',
    aliases: ['hrg beli', 'harga modal', 'cost', 'hpp', 'buy price', 'harga beli', 'modal', 'beli', 'cogs', 'cost price', 'biaya jasa', 'harga part / bahan'],
  },
  sell_price: {
    labelId: 'Harga Jual (Retail)',
    labelEn: 'Selling Price (Retail)',
    aliases: ['hrg jual', 'harga', 'price', 'sell price', 'retail', 'harga jual', 'tarif', 'jual', 'price retail', 'harga tag', 'total tarif'],
  },
  stock: {
    labelId: 'Stok / Kuantitas',
    labelEn: 'Stock Quantity',
    aliases: ['qty', 'stok', 'stock', 'stk', 'jumlah', 'saldo', 'qty akhir', 'kuantitas', 'quantity', 'balance', 'stok awal', 'stok varian', 'min stok', 'min alert'],
  },
  unit: {
    labelId: 'Satuan / UoM',
    labelEn: 'Unit of Measure',
    aliases: ['sat', 'satuan', 'uom', 'unit', 'kemasan', 'packaging', 'satuan dasar', 'satuan dosis'],
  },
  ignore: {
    labelId: '(Abaikan Kolom Ini)',
    labelEn: '(Ignore Column)',
    aliases: [],
  },
};

/**
 * Currency & Number Normalizer
 * Cleans "Rp 15.000,00", "Rp15,000", "25.000", "4,500.50" into valid number
 */
export function normalizeCurrency(val: string | number): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;

  // Clean strings
  let clean = val
    .toString()
    .replace(/[RrpP\sIDRidr$]/g, '')
    .trim();

  // If format is like "15.000,00" (Indonesian standard)
  if (clean.includes('.') && clean.includes(',')) {
    if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
      // 15.000,50 -> 15000.50
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // 15,000.50 -> 15000.50
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes('.')) {
    // Check if dot is thousands separator e.g. "15.000" or decimal "15.5"
    const parts = clean.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      clean = clean.replace(/\./g, '');
    }
  } else if (clean.includes(',')) {
    const parts = clean.split(',');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      clean = clean.replace(/,/g, '');
    } else {
      clean = clean.replace(',', '.');
    }
  }

  const result = parseFloat(clean);
  return isNaN(result) ? 0 : result;
}

const SAMPLE_EXTERNAL_STORE_CSV = `No,Kode Barcode,Nama Brg/Item,Ktg/Cat,Mrk/Brand,Hrg Beli/Cost,Hrg Jual/Price,Qty/Stk,Sat/UoM
1,899275321001,SilverQueen Almond Chocolate 58g,Makanan Ringan,SilverQueen,Rp 12.500,Rp 16.500,75,PCS
2,899275321002,Pocari Sweat Isotonik 500ml,Minuman,Pocari Sweat,Rp 6.200,Rp 8.500,120,BTL
3,899275321003,Sensodyne Pasta Gigi Cool Gel 100g,Pembersih & Toiletries,Sensodyne,Rp 24.500,Rp 31.000,40,TUBE
4,899275321004,Minyak Kayu Putih Cap Lang 60ml,Obat & Medis,Cap Lang,Rp 19.800,Rp 24.500,60,BOTOL
5,899275321005,Tango Wafer Cokelat Kaleng 300g,Biskuit & Kue,Tango,Rp 32.000,Rp 39.500,30,KALENG`;

export const AiSmartMapperModal: React.FC<AiSmartMapperModalProps> = ({
  isOpen,
  onClose,
  onImportProducts,
  isLight,
  isEn,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawText, setRawText] = useState(SAMPLE_EXTERNAL_STORE_CSV);
  const [fileName, setFileName] = useState('contoh_toko_lain.csv');
  const [customMappings, setCustomMappings] = useState<Record<string, CanonicalField>>({});

  if (!isOpen) return null;

  // Handle Raw CSV parsing into headers and rows
  const parsedData = useMemo(() => {
    if (!rawText.trim()) return { headers: [], rows: [] };
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return { headers: [], rows: [] };

    // Delimiter detection (comma vs semicolon)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

    const headers = firstLine.split(delimiter).map((h) => h.replace(/^["'\s]+|["'\s]+$/g, ''));
    const rows: string[][] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map((c) => c.replace(/^["'\s]+|["'\s]+$/g, ''));
      if (cols.length > 1) {
        rows.push(cols);
      }
    }

    return { headers, rows };
  }, [rawText]);

  // AI Auto Matching algorithm
  const autoFieldMappings = useMemo(() => {
    const mappings: Record<string, CanonicalField> = {};

    parsedData.headers.forEach((header) => {
      // Check if user manually overrode this column
      if (customMappings[header]) {
        mappings[header] = customMappings[header];
        return;
      }

      const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');

      let matchedField: CanonicalField = 'ignore';
      let maxScore = 0;

      (Object.keys(FIELD_DEFINITIONS) as CanonicalField[]).forEach((fieldKey) => {
        if (fieldKey === 'ignore') return;
        const def = FIELD_DEFINITIONS[fieldKey];

        def.aliases.forEach((alias) => {
          const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanHeader === cleanAlias) {
            maxScore = 100;
            matchedField = fieldKey;
          } else if (cleanHeader.includes(cleanAlias) || cleanAlias.includes(cleanHeader)) {
            if (maxScore < 50) {
              maxScore = 50;
              matchedField = fieldKey;
            }
          }
        });
      });

      mappings[header] = matchedField;
    });

    return mappings;
  }, [parsedData.headers, customMappings]);

  // Handle Mapping Override
  const handleSetMapping = (header: string, field: CanonicalField) => {
    setCustomMappings((prev) => ({
      ...prev,
      [header]: field,
    }));
  };

  // Upload File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      setCustomMappings({});
    };
    reader.readAsText(file);
  };

  // AI Normalized Preview Rows (First 4 rows)
  const normalizedPreview = useMemo(() => {
    const { headers, rows } = parsedData;
    const previewCount = Math.min(rows.length, 4);
    const result: Array<Record<string, any>> = [];

    for (let i = 0; i < previewCount; i++) {
      const row = rows[i];
      const item: Record<string, any> = {};

      headers.forEach((header, idx) => {
        const canonical = autoFieldMappings[header] || 'ignore';
        const val = row[idx] || '';

        if (canonical === 'cost_price' || canonical === 'sell_price' || canonical === 'stock') {
          item[canonical] = normalizeCurrency(val);
        } else if (canonical !== 'ignore') {
          item[canonical] = val;
        }
      });
      result.push(item);
    }
    return result;
  }, [parsedData, autoFieldMappings]);

  // Process & Confirm Import
  const handleConfirmImport = () => {
    const { headers, rows } = parsedData;
    if (rows.length === 0) return;

    const newProducts: Array<Partial<Product> & { manufacturer?: string; rackLocation?: string }> = [];
    const newBrandSet = new Set<string>();
    const newCategorySet = new Set<string>();

    rows.forEach((row, rowIdx) => {
      let barcode = '';
      let name = '';
      let category = 'Kategori Umum';
      let brand = 'Merek Mandiri';
      let cost_price = 0;
      let sell_price = 0;
      let stock = 10;
      let unit = 'PCS';

      headers.forEach((header, colIdx) => {
        const canonical = autoFieldMappings[header];
        const val = row[colIdx] || '';

        if (canonical === 'barcode') barcode = val.trim();
        else if (canonical === 'name') name = val.trim();
        else if (canonical === 'category') category = val.trim() || category;
        else if (canonical === 'brand') brand = val.trim() || brand;
        else if (canonical === 'cost_price') cost_price = normalizeCurrency(val);
        else if (canonical === 'sell_price') sell_price = normalizeCurrency(val);
        else if (canonical === 'stock') stock = Math.round(normalizeCurrency(val));
        else if (canonical === 'unit') unit = val.trim() || unit;
      });

      if (!barcode) {
        barcode = `899${Math.floor(100000000 + Math.random() * 900000000)}`;
      }
      if (!name) {
        name = `Produk Impor #${rowIdx + 1}`;
      }
      if (sell_price <= 0 && cost_price > 0) {
        sell_price = Math.round(cost_price * 1.3);
      }

      newBrandSet.add(brand);
      newCategorySet.add(category);

      newProducts.push({
        barcode,
        name,
        category,
        brand,
        cost_price,
        sell_price,
        price_retail: sell_price,
        price_wholesale: Math.round(sell_price * 0.92),
        price_distributor: Math.round(sell_price * 0.85),
        stock,
        initialStock: stock,
        min_stock: 5,
        unit,
        rackLocation: 'Gudang Utama',
        status: stock > 0 ? 'Active' : 'Out of Stock',
        taxable: true,
      });
    });

    const brandList = Array.from(newBrandSet).map((b) => ({ name: b, manufacturer: 'Pabrikan Mitra' }));
    const categoryList = Array.from(newCategorySet);

    onImportProducts(newProducts, brandList, categoryList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div
        className={`w-full max-w-4xl rounded-2xl border flex flex-col shadow-2xl overflow-hidden my-auto transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-400/40'
            : 'bg-[#161b22] border-[#30363d] text-[#e6edf3] shadow-black/80'
        }`}
        style={{
          boxShadow: isLight
            ? '0 20px 40px rgba(0,0,0,0.15)'
            : '0 0 40px rgba(0,242,254,0.15)',
        }}
      >
        {/* Modal Top Header with Neon Cyan */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between gap-3 ${
            isLight
              ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border-slate-200'
              : 'bg-[#0d1117] border-[#30363d]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${
              isLight
                ? 'bg-cyan-100 text-cyan-700 border-cyan-300'
                : 'bg-cyan-500/20 text-[#00f2fe] border-cyan-500/40 shadow-[0_0_15px_rgba(0,242,254,0.3)]'
            }`}>
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-base tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isEn ? 'AI Smart Column Mapper (Other Stores)' : 'Unggah & AI Smart Map (Impor Format Toko Lain)'}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                  isLight
                    ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                    : 'bg-cyan-500/15 text-[#00f2fe] border border-cyan-500/30'
                }`}>
                  ADAPTIVE PARSER
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                {isEn
                  ? 'Intelligently parses external POS/ERP CSV headers, normalizes currencies & distributes to 5 canonical cards.'
                  : 'Deteksi otomatis nama kolom toko lain (ID/EN/singkatan), bersihkan Rp/titik, & distribusikan ke 5 kartu.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-lg cursor-pointer transition ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* File Upload Zone / Sample Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 p-3.5 rounded-xl border border-dashed flex items-center gap-3 cursor-pointer transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 hover:border-cyan-600 hover:bg-cyan-50/30'
                  : 'bg-[#0d1117] border-[#30363d] hover:border-cyan-500'
              }`}
            >
              <FileSpreadsheet className={`w-6 h-6 shrink-0 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
              <div className="min-w-0 flex-1">
                <div className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                  {fileName ? `File: ${fileName}` : 'Pilih File .CSV / .XLSX Toko Lain'}
                </div>
                <div className={`text-[11px] ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                  {parsedData.rows.length > 0
                    ? `${parsedData.rows.length} baris data produk siap dipetakan`
                    : 'Klik untuk memilih file spreadsheet'}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setRawText(SAMPLE_EXTERNAL_STORE_CSV);
                setFileName('contoh_toko_lain.csv');
                setCustomMappings({});
              }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition shrink-0 ${
                isLight
                  ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-400 shadow-xs'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-[#00f2fe] border-cyan-500/30'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{isEn ? 'Load Other Store Sample' : 'Muat Contoh Format Toko Lain'}</span>
            </button>
          </div>

          {/* AI Column Mapping Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-cyan-800' : 'text-[#00f2fe]'
              }`}>
                <Sparkles className="w-4 h-4" />
                <span>
                  {isEn
                    ? 'AI Smart Detection & Canonical Mapping'
                    : 'Hasil Pemetaan Kolom Otomatis oleh AI'}
                </span>
              </span>
              <span className={`text-[11px] font-mono ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>
                {parsedData.headers.length} Kolom Terbaca
              </span>
            </div>

            <div
              className={`rounded-xl border overflow-x-auto ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#0d1117] border-[#30363d]'
              }`}
            >
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-bold ${
                      isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#161b22] text-slate-300 border-[#30363d]'
                    }`}
                  >
                    <th className="px-3 py-2">Kolom File Sumber</th>
                    <th className="px-3 py-2">Contoh Data Baris 1</th>
                    <th className="px-3 py-2">Terpetakan ke Entitas Master</th>
                    <th className="px-3 py-2 text-center">Status AI</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-mono ${
                  isLight ? 'divide-slate-200 text-slate-800' : 'divide-gray-700/30 text-gray-300'
                }`}>
                  {parsedData.headers.map((header) => {
                    const mappedField = autoFieldMappings[header] || 'ignore';
                    const sampleVal = parsedData.rows[0]?.[parsedData.headers.indexOf(header)] || '-';
                    const isMatched = mappedField !== 'ignore';

                    return (
                      <tr key={header} className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                        <td className={`px-3 py-2 font-bold whitespace-nowrap ${
                          isLight ? 'text-slate-900' : 'text-slate-200'
                        }`}>
                          {header}
                        </td>
                        <td className={`px-3 py-2 truncate max-w-[200px] ${
                          isLight ? 'text-slate-600 font-medium' : 'text-slate-400'
                        }`}>
                          {sampleVal}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={mappedField}
                            onChange={(e) => handleSetMapping(header, e.target.value as CanonicalField)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-sans transition focus:outline-none cursor-pointer ${
                              isMatched
                                ? isLight
                                  ? 'bg-cyan-50 border-cyan-400 text-cyan-800 font-bold'
                                  : 'bg-cyan-500/10 border-cyan-500/40 text-[#00f2fe] font-semibold'
                                : isLight
                                ? 'bg-slate-50 border-slate-300 text-slate-600'
                                : 'bg-transparent border-gray-700 text-slate-400'
                            }`}
                          >
                            {(Object.keys(FIELD_DEFINITIONS) as CanonicalField[]).map((f) => (
                              <option key={f} value={f} className={isLight ? 'bg-white text-slate-900' : 'bg-[#161b22] text-white'}>
                                {isEn ? FIELD_DEFINITIONS[f].labelEn : FIELD_DEFINITIONS[f].labelId}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {isMatched ? (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isLight
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            }`}>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>COCOK</span>
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                              isLight ? 'bg-slate-100 text-slate-600' : 'bg-gray-700/30 text-slate-400'
                            }`}>
                              DILEWATI
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cleaned Data Preview Table */}
          {normalizedPreview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-800' : 'text-slate-300'
                }`}>
                  {isEn ? 'Normalized Data Preview (Currency & Numbers Cleaned)' : 'Pratinjau Data Ternormalisasi (Rp & Angka Bersih)'}
                </span>
                <span className={`text-[10px] font-mono font-bold ${
                  isLight ? 'text-emerald-700' : 'text-emerald-400'
                }`}>
                  {parsedData.rows.length} Total Produk Siap Distribusi
                </span>
              </div>

              <div
                className={`rounded-xl border overflow-x-auto p-3 ${
                  isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] font-bold uppercase ${
                      isLight ? 'border-slate-200 text-slate-600' : 'border-gray-700/40 text-slate-400'
                    }`}>
                      <th className="pb-1.5 pr-3">Barcode</th>
                      <th className="pb-1.5 pr-3">Nama Produk</th>
                      <th className="pb-1.5 pr-3">Kategori</th>
                      <th className="pb-1.5 pr-3">Merek</th>
                      <th className="pb-1.5 pr-3">HPP</th>
                      <th className="pb-1.5 pr-3">Harga Jual</th>
                      <th className="pb-1.5 pr-3">Stok</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-mono text-[11px] ${
                    isLight ? 'divide-slate-200' : 'divide-gray-800/40'
                  }`}>
                    {normalizedPreview.map((item, idx) => (
                      <tr key={idx} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}>
                        <td className={`py-1.5 pr-3 font-bold ${isLight ? 'text-cyan-800' : 'text-cyan-400'}`}>
                          {item.barcode || '-'}
                        </td>
                        <td className={`py-1.5 pr-3 font-sans font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {item.name || '-'}
                        </td>
                        <td className={`py-1.5 pr-3 font-sans ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          {item.category || '-'}
                        </td>
                        <td className={`py-1.5 pr-3 font-sans ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          {item.brand || '-'}
                        </td>
                        <td className={`py-1.5 pr-3 ${isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400'}`}>
                          {item.cost_price ? `Rp ${item.cost_price.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className={`py-1.5 pr-3 font-bold ${isLight ? 'text-blue-700' : 'text-[#00f2fe]'}`}>
                          {item.sell_price ? `Rp ${item.sell_price.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className={`py-1.5 pr-3 font-bold ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                          {item.stock !== undefined ? `${item.stock} ${item.unit || 'PCS'}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Auto Distribution Explainer */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            isLight
              ? 'bg-cyan-50 border-cyan-300 text-slate-800'
              : 'bg-cyan-500/10 border-cyan-500/30 text-slate-300'
          }`}>
            <Boxes className={`w-5 h-5 shrink-0 mt-0.5 ${isLight ? 'text-cyan-700' : 'text-[#00f2fe]'}`} />
            <div>
              <span className={`font-bold block mb-0.5 ${isLight ? 'text-cyan-900' : 'text-[#00f2fe]'}`}>
                {isEn ? 'Automatic 5-Entity Canonical Distribution:' : 'Distribusi Otomatis ke 5 Entitas Canonical:'}
              </span>
              <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                {isEn
                  ? 'All rows will be converted to Products & SKUs, brand names will be registered into the Brand Master, categories will be registered into Category Master, and inventory will be synced to Warehouse and Cashier POS.'
                  : 'Seluruh data otomatis masuk ke Produk & SKU, nama merek baru masuk ke Master Merek, kategori baru masuk ke Master Kategori, serta stok tercatat di Gudang dan POS Kasir.'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`px-5 py-4 border-t flex items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#161b22] border-gray-700/40'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
              isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isEn ? 'Cancel' : 'Batal'}
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={parsedData.rows.length === 0}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0052FF] hover:bg-[#0040cc] text-white flex items-center gap-2 shadow-[0_0_20px_rgba(0,82,255,0.4)] cursor-pointer transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isEn
                ? `Konfirmasi & Terapkan (${parsedData.rows.length} Items)`
                : `Konfirmasi & Terapkan (${parsedData.rows.length} Item)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
