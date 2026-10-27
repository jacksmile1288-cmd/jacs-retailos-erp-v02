/**
 * Preset Alias Pemetaan Kolom untuk Software POS Populer di Indonesia
 * Mendukung:
 * - iPos (iPos 3, 4, 5 by Inspirasibiz)
 * - Armadillo POS (Armadillo Accounting & POS)
 * - Moka POS
 * - Pawoon POS
 * - Majoo POS
 * - Olsera / Kasir Pintar / Accurate
 */

export interface PosSoftwarePreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  iconName?: string;
  // Mapping dari target key ERP -> kemungkinan nama kolom di file export software tsb
  aliases: Record<string, string[]>;
}

export const POS_SOFTWARE_PRESETS: PosSoftwarePreset[] = [
  {
    id: 'ipos_armadillo',
    name: 'iPos / Armadillo',
    description: 'Format baku ekspor Inspirasibiz iPos 4/5 dan Armadillo POS Indonesia',
    badge: 'Desktop POS',
    aliases: {
      sku: ['Kode', 'Kode_Barang', 'KodeBarang', 'Kode_Item', 'KodeItem'],
      name: ['Nama_Barang', 'NamaBarang', 'Nama_Item', 'NamaItem', 'Keterangan'],
      unit: ['Satuan', 'Satuan_Dasar', 'SatuanDasar', 'UOM', 'Satuan1'],
      costPrice: ['Harga_Pokok', 'HargaPokok', 'HPP', 'Harga_Beli', 'HargaBeli', 'Nilai_Pokok'],
      sellingPrice: ['Harga_Jual', 'HargaJual', 'Harga_Jual_1', 'HargaJual1', 'Harga_Retail'],
      stock: ['Stok_Akhir', 'StokAkhir', 'Stok', 'Stock', 'Saldo_Akhir', 'SaldoAkhir', 'Qty_Akhir'],
      category: ['Jenis', 'Kategori', 'Kelompok', 'Golongan', 'Departemen'],
      brand: ['Merek', 'Merk', 'Brand', 'Produsen'],
      barcode: ['Barcode', 'Kode_Barcode', 'KodeBarcode', 'PLU', 'EAN'],
      minStock: ['Stok_Min', 'StokMin', 'Min_Stok', 'MinStok', 'Batas_Min', 'Batas_Minimal'],
    },
  },
  {
    id: 'moka_pawoon_majoo',
    name: 'Moka / Pawoon / Majoo',
    description: 'Format baku ekspor Cloud POS terpopuler di Indonesia (Moka, Pawoon, Majoo)',
    badge: 'Cloud POS',
    aliases: {
      name: ['Item Name', 'Nama Produk', 'Nama Item', 'Product Name', 'Item'],
      category: ['Category', 'Kategori', 'Kategori Produk', 'Category Name'],
      sellingPrice: ['Price', 'Harga', 'Harga Jual', 'Selling Price', 'Harga (IDR)', 'Price (IDR)'],
      costPrice: ['Cost', 'HPP', 'Harga Pokok', 'Harga Modal', 'Cost Price', 'Cost of Goods Sold', 'COGS'],
      stock: ['In Stock', 'Stok', 'Stok Toko', 'Current Stock', 'Stock', 'Sisa Stok', 'Jumlah'],
      sku: ['SKU', 'Kode SKU', 'Kode Produk', 'Item SKU', 'Variant SKU'],
      barcode: ['Barcode', 'Barcode / UPC', 'UPC', 'EAN', 'Kode Batang'],
      unit: ['Unit', 'Satuan', 'UOM', 'Unit of Measurement'],
      brand: ['Brand', 'Merek', 'Merk'],
      minStock: ['Low Stock Alert', 'Min Stock', 'Minimum Stock', 'Batas Stok Minimum'],
    },
  },
  {
    id: 'ipos',
    name: 'iPos 4 / 5 (Inspirasibiz)',
    description: 'Format ekspor tabel master item iPos database Access / SQLite / Excel',
    badge: 'iPos',
    aliases: {
      sku: ['Kode', 'Kode_Barang', 'KodeBarang'],
      name: ['Nama_Barang', 'NamaBarang'],
      unit: ['Satuan', 'Satuan_Dasar'],
      costPrice: ['Harga_Pokok', 'HargaPokok', 'Harga_Beli'],
      sellingPrice: ['Harga_Jual', 'HargaJual', 'Harga_Jual_1'],
      stock: ['Stok_Akhir', 'StokAkhir', 'Stok'],
      category: ['Jenis', 'Kategori'],
      brand: ['Merek', 'Merk'],
      barcode: ['Barcode', 'Kode_Barcode'],
      minStock: ['Stok_Min', 'Min_Stok'],
    },
  },
  {
    id: 'moka',
    name: 'Moka POS',
    description: 'Format ekspor Item Library CSV/Excel dari Moka Backoffice',
    badge: 'Moka',
    aliases: {
      name: ['Item Name', 'Product Name'],
      category: ['Category'],
      sellingPrice: ['Price', 'Selling Price'],
      costPrice: ['Cost', 'Cost of Goods Sold', 'COGS'],
      stock: ['In Stock', 'Current Stock'],
      sku: ['SKU', 'Variant SKU'],
      barcode: ['Barcode'],
      unit: ['Unit'],
    },
  },
  {
    id: 'pawoon',
    name: 'Pawoon POS',
    description: 'Format ekspor Master Produk dari Pawoon Backoffice',
    badge: 'Pawoon',
    aliases: {
      name: ['Nama Produk', 'Item Name'],
      category: ['Kategori', 'Category'],
      sellingPrice: ['Harga Jual', 'Price'],
      costPrice: ['Harga Modal', 'Cost'],
      stock: ['Stok', 'In Stock'],
      sku: ['SKU', 'Kode'],
      unit: ['Satuan', 'Unit'],
      barcode: ['Barcode'],
    },
  },
  {
    id: 'majoo',
    name: 'Majoo POS',
    description: 'Format ekspor Katalog Produk dari Majoo Backoffice',
    badge: 'Majoo',
    aliases: {
      name: ['Nama Produk', 'Nama Item', 'Item Name'],
      category: ['Kategori', 'Category'],
      sellingPrice: ['Harga', 'Harga Jual', 'Price'],
      costPrice: ['HPP', 'Harga Modal', 'Cost'],
      stock: ['Stok Toko', 'Stok', 'In Stock'],
      sku: ['SKU', 'Kode Produk'],
      unit: ['Satuan', 'Unit'],
      barcode: ['Barcode'],
    },
  },
];

/**
 * Menerapkan Preset POS ke daftar kolom sumber yang tersedia di file pengguna.
 * Menghasilkan objek pemetaan Record<targetFieldKey, sourceHeaderName>.
 */
export function matchPresetToHeaders(
  preset: PosSoftwarePreset,
  availableHeaders: string[],
  targetFieldKeys: string[]
): { mapping: Record<string, string>; matchCount: number } {
  const mapping: Record<string, string> = {};
  let matchCount = 0;

  // Normalisasi header sumber untuk perbandingan bebas case dan spasi/underscore
  const cleanSourceHeaders = availableHeaders.map((h) => ({
    original: h,
    normalized: h.trim().toLowerCase().replace(/[\s_\-]+/g, ''),
  }));

  for (const fieldKey of targetFieldKeys) {
    const aliasList = preset.aliases[fieldKey] || [];
    let matchedOriginal = '';

    for (const alias of aliasList) {
      const cleanAlias = alias.trim().toLowerCase().replace(/[\s_\-]+/g, '');

      // 1. Coba pencocokan exact normalized
      const exact = cleanSourceHeaders.find((sh) => {
        if (fieldKey === 'sellingPrice' && /modal|beli|cost|hpp|pokok/i.test(sh.original)) return false;
        if (fieldKey === 'costPrice' && /jual|selling|retail/i.test(sh.original)) return false;
        return sh.normalized === cleanAlias;
      });
      if (exact) {
        matchedOriginal = exact.original;
        break;
      }

      // 2. Coba pencocokan contains
      const contains = cleanSourceHeaders.find((sh) => {
        if (fieldKey === 'sellingPrice' && /modal|beli|cost|hpp|pokok/i.test(sh.original)) return false;
        if (fieldKey === 'costPrice' && /jual|selling|retail/i.test(sh.original)) return false;
        return sh.normalized.includes(cleanAlias) || cleanAlias.includes(sh.normalized);
      });
      if (contains) {
        matchedOriginal = contains.original;
        break;
      }
    }

    if (matchedOriginal) {
      mapping[fieldKey] = matchedOriginal;
      matchCount++;
    } else {
      mapping[fieldKey] = '';
    }
  }

  return { mapping, matchCount };
}
