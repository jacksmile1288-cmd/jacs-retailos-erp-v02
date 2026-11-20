import { RecipeIngredient, Product, InventoryRecord } from '../types';

export interface RawIngredientMaster {
  id: string;
  legacyId?: string;
  name: string;
  category: string;
  unit: string;
  costPerUnit: number; // Harga modal per unit dasar
  currentStock: number;
  minStock: number;
  supplier: string;
  rackLocation: string;
}

export const INITIAL_RAW_INGREDIENTS: RawIngredientMaster[] = [
  { id: 'RM-FNB-001', legacyId: 'ING-001', name: 'Beras Putih Pandan Wangi', category: 'Sembako & Beras Dapur', unit: 'Gram', costPerUnit: 15, currentStock: 25000, minStock: 5000, supplier: 'CV Pangan Kuliner Nusantara', rackLocation: 'Dry Store Rak A-01' },
  { id: 'RM-FNB-002', legacyId: 'ING-002', name: 'Daging Sapi Wagyu Slice', category: 'Daging & Unggas Chill', unit: 'Gram', costPerUnit: 180, currentStock: 8000, minStock: 1500, supplier: 'PT Prime Meat Coldstorage', rackLocation: 'Chiller Dapur C-01' },
  { id: 'RM-FNB-003', legacyId: 'ING-003', name: 'Daging Ayam Fillet Segar', category: 'Daging & Unggas Chill', unit: 'Gram', costPerUnit: 55, currentStock: 12000, minStock: 2500, supplier: 'PT Prime Meat Coldstorage', rackLocation: 'Chiller Dapur C-02' },
  { id: 'RM-FNB-004', legacyId: 'ING-004', name: 'Telur Ayam Negeri Pilihan', category: 'Telur & Dairy', unit: 'Pcs', costPerUnit: 2000, currentStock: 300, minStock: 60, supplier: 'CV Pangan Kuliner Nusantara', rackLocation: 'Dry Store Rak A-02' },
  { id: 'RM-FNB-005', legacyId: 'ING-005', name: 'Bumbu Racik Rempah Spesial', category: 'Bumbu & Rempah Dapur', unit: 'Gram', costPerUnit: 70, currentStock: 5000, minStock: 1000, supplier: 'CV Pangan Kuliner Nusantara', rackLocation: 'Dry Store Rak B-01' },
  { id: 'RM-FNB-006', legacyId: 'ING-006', name: 'Minyak Goreng Sawit Chef', category: 'Minyak & Lemak', unit: 'Ml', costPerUnit: 18, currentStock: 30000, minStock: 5000, supplier: 'CV Pangan Kuliner Nusantara', rackLocation: 'Dry Store Rak A-03' },
  { id: 'RM-FNB-007', legacyId: 'ING-007', name: 'Mie Telur Hokkien Segar', category: 'Bahan Olahan Dapur', unit: 'Gram', costPerUnit: 25, currentStock: 10000, minStock: 2000, supplier: 'CV Pangan Kuliner Nusantara', rackLocation: 'Chiller Dapur C-03' },
  { id: 'RM-FNB-008', legacyId: 'ING-008', name: 'Udang & Cumi Seafood Segar', category: 'Seafood Frozen', unit: 'Gram', costPerUnit: 90, currentStock: 6000, minStock: 1200, supplier: 'PT Prime Meat Coldstorage', rackLocation: 'Freezer Dapur F-01' },
  { id: 'RM-FNB-009', legacyId: 'ING-009', name: 'Beef Patty Gourmet 120g', category: 'Daging & Unggas Chill', unit: 'Pcs', costPerUnit: 14000, currentStock: 150, minStock: 30, supplier: 'PT Prime Meat Coldstorage', rackLocation: 'Freezer Dapur F-02' },
  { id: 'RM-FNB-010', legacyId: 'ING-010', name: 'Roti Burger & Pastry Butter Dough', category: 'Bakery & Pastry Dough', unit: 'Pcs', costPerUnit: 5000, currentStock: 150, minStock: 30, supplier: 'PT Artisan Bakery & Dairy Supply', rackLocation: 'Bakery Rack R-01' },
  { id: 'RM-FNB-011', legacyId: 'ING-011', name: 'Keju Slice Melt Cheddar', category: 'Telur & Dairy', unit: 'Pcs', costPerUnit: 3000, currentStock: 200, minStock: 40, supplier: 'PT Artisan Bakery & Dairy Supply', rackLocation: 'Chiller Barista B-01' },
  { id: 'RM-FNB-012', legacyId: 'ING-012', name: 'Biji Kopi Espresso Blend', category: 'Kopi & Barista', unit: 'Gram', costPerUnit: 200, currentStock: 6000, minStock: 1000, supplier: 'PT Kopi Nusantara Roastery', rackLocation: 'Barista Station S-01' },
  { id: 'RM-FNB-013', legacyId: 'ING-013', name: 'Gula Aren Cair', category: 'Sirup & Pemanis Bar', unit: 'Ml', costPerUnit: 52, currentStock: 6000, minStock: 1000, supplier: 'PT Kopi Nusantara Roastery', rackLocation: 'Barista Station S-02' },
  { id: 'RM-FNB-014', legacyId: 'ING-014', name: 'Susu Fresh Milk UHT', category: 'Telur & Dairy', unit: 'Ml', costPerUnit: 16, currentStock: 20000, minStock: 4000, supplier: 'PT Artisan Bakery & Dairy Supply', rackLocation: 'Chiller Barista B-02' },
  { id: 'RM-FNB-015', legacyId: 'ING-015', name: 'Bubuk Matcha Jepang & Teh Melati', category: 'Kopi & Barista', unit: 'Gram', costPerUnit: 300, currentStock: 2500, minStock: 500, supplier: 'PT Kopi Nusantara Roastery', rackLocation: 'Barista Station S-03' },
  { id: 'RM-FNB-016', legacyId: 'ING-016', name: 'Kentang Beku Shoestring', category: 'Bahan Olahan Dapur', unit: 'Gram', costPerUnit: 40, currentStock: 15000, minStock: 3000, supplier: 'PT Prime Meat Coldstorage', rackLocation: 'Freezer Dapur F-03' },
  { id: 'RM-FNB-017', legacyId: 'ING-017', name: 'Minyak Truffle & Saus Mayo', category: 'Minyak & Lemak', unit: 'Ml', costPerUnit: 150, currentStock: 1500, minStock: 300, supplier: 'PT Artisan Bakery & Dairy Supply', rackLocation: 'Dry Store Rak B-02' },
  { id: 'RM-FNB-018', legacyId: 'ING-018', name: 'Lunch Box Food Grade Eco', category: 'Kemasan Dapur (Packaging)', unit: 'Pcs', costPerUnit: 1500, currentStock: 400, minStock: 100, supplier: 'CV Kemasan Eco Packindo', rackLocation: 'Packaging Rak P-01' },
  { id: 'RM-FNB-019', legacyId: 'ING-019', name: 'Paper Bowl & Tutup 650ml', category: 'Kemasan Dapur (Packaging)', unit: 'Pcs', costPerUnit: 1800, currentStock: 350, minStock: 100, supplier: 'CV Kemasan Eco Packindo', rackLocation: 'Packaging Rak P-02' },
  { id: 'RM-FNB-020', legacyId: 'ING-020', name: 'Paper Cup 16oz', category: 'Kemasan Barista (Packaging)', unit: 'Pcs', costPerUnit: 1200, currentStock: 500, minStock: 100, supplier: 'CV Kemasan Eco Packindo', rackLocation: 'Packaging Rak P-03' },
];

/**
 * Normalisasi ID bahan baku lama (ING-001..ING-020) ke SKU Gudang Dapur F&B (RM-FNB-001..RM-FNB-020)
 */
export function normalizeFnbRawMaterialId(id: string): string {
  const upper = (id || '').trim().toUpperCase();
  if (upper.startsWith('ING-')) {
    const num = upper.replace('ING-', '');
    return `RM-FNB-${num.padStart(3, '0')}`;
  }
  return upper || id;
}

/**
 * Konversi bahan baku ke format produk ERP (untuk sinkronisasi katalog gudang F&B)
 */
export const RAW_INGREDIENTS_AS_PRODUCTS: Product[] = INITIAL_RAW_INGREDIENTS.map((ing) => ({
  id: ing.id,
  name: ing.name,
  itemType: 'RAW_MATERIAL',
  category: `Bahan Baku Dapur (${ing.category})`,
  brand: ing.supplier,
  sell_price: ing.costPerUnit,
  cost_price: ing.costPerUnit,
  stock: ing.currentStock,
  min_stock: ing.minStock,
  unit: ing.unit,
  status: 'Active',
  businessModel: 'fnb',
  plu: ing.id,
  barcode: `899700${ing.id.replace('RM-FNB-', '')}`,
  rackLocation: ing.rackLocation,
}));

export const RAW_INGREDIENTS_AS_INVENTORY: InventoryRecord[] = INITIAL_RAW_INGREDIENTS.map((ing) => ({
  product_id: ing.id,
  product_name: ing.name,
  initial_stock: ing.currentStock + (ing.unit === 'Pcs' ? 25 : 1500),
  in_qty: ing.unit === 'Pcs' ? 50 : 3000,
  out_qty: ing.unit === 'Pcs' ? 75 : 4500,
  final_stock: ing.currentStock,
  last_update: '2026-09-27 09:15:00',
}));

export interface RecipePreset {
  id: string;
  name: string;
  category: string;
  recipe: RecipeIngredient[];
  wastePercent: number;
  packagingCost: number;
}

/**
 * Peta Resep BOM Default Spesifik untuk seluruh 18 Menu F&B
 */
export const DEFAULT_FNB_MENU_RECIPES: Record<
  string,
  {
    recipe: Array<{
      ingredientId: string;
      name: string;
      ingredientName: string;
      qty: number;
      portionQty: number;
      unit: string;
      costPerUnit: number;
      subtotalCost: number;
    }>;
    rawMaterialCost: number;
    operationalCost: number;
    wastePercent: number;
    targetMarginPercent: number;
  }
> = {
  'FNB-KOP-AREN': {
    rawMaterialCost: 8500,
    operationalCost: 0,
    wastePercent: 0,
    targetMarginPercent: 61,
    recipe: [
      { ingredientId: 'RM-FNB-012', name: 'Biji Kopi Espresso Blend', ingredientName: 'Biji Kopi Espresso Blend', qty: 18, portionQty: 18, unit: 'gr', costPerUnit: 200, subtotalCost: 3600 },
      { ingredientId: 'RM-FNB-014', name: 'Susu Fresh Milk UHT', ingredientName: 'Susu Fresh Milk UHT', qty: 150, portionQty: 150, unit: 'ml', costPerUnit: 16, subtotalCost: 2400 },
      { ingredientId: 'RM-FNB-013', name: 'Gula Aren Cair', ingredientName: 'Gula Aren Cair', qty: 25, portionQty: 25, unit: 'ml', costPerUnit: 52, subtotalCost: 1300 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', ingredientName: 'Paper Cup 16oz', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1200, subtotalCost: 1200 },
    ],
  },
  'FNB-ESP-SHOT': {
    rawMaterialCost: 5000,
    operationalCost: 0,
    wastePercent: 0,
    targetMarginPercent: 72,
    recipe: [
      { ingredientId: 'RM-FNB-012', name: 'Biji Kopi Espresso Blend', ingredientName: 'Biji Kopi Espresso Blend', qty: 19, portionQty: 19, unit: 'gr', costPerUnit: 200, subtotalCost: 3800 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', ingredientName: 'Paper Cup 16oz', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1200, subtotalCost: 1200 },
    ],
  },
  'FNB-NASGOR-SP': {
    rawMaterialCost: 15000,
    operationalCost: 0,
    wastePercent: 0,
    targetMarginPercent: 53,
    recipe: [
      { ingredientId: 'RM-FNB-001', name: 'Beras Putih Pandan Wangi', ingredientName: 'Beras Putih Pandan Wangi', qty: 160, portionQty: 160, unit: 'gr', costPerUnit: 15, subtotalCost: 2400 },
      { ingredientId: 'RM-FNB-003', name: 'Daging Ayam Fillet Segar', ingredientName: 'Daging Ayam Fillet Segar', qty: 100, portionQty: 100, unit: 'gr', costPerUnit: 55, subtotalCost: 5500 },
      { ingredientId: 'RM-FNB-004', name: 'Telur Ayam Negeri Pilihan', ingredientName: 'Telur Ayam Negeri Pilihan', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 2000, subtotalCost: 2000 },
      { ingredientId: 'RM-FNB-005', name: 'Bumbu Racik Rempah Spesial', ingredientName: 'Bumbu Racik Rempah Spesial', qty: 45, portionQty: 45, unit: 'gr', costPerUnit: 70, subtotalCost: 3150 },
      { ingredientId: 'RM-FNB-006', name: 'Minyak Goreng Sawit Chef', ingredientName: 'Minyak Goreng Sawit Chef', qty: 25, portionQty: 25, unit: 'ml', costPerUnit: 18, subtotalCost: 450 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', ingredientName: 'Lunch Box Food Grade Eco', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1500, subtotalCost: 1500 },
    ],
  },
  'FNB-CRS-BTR': {
    rawMaterialCost: 11000,
    operationalCost: 0,
    wastePercent: 0,
    targetMarginPercent: 56,
    recipe: [
      { ingredientId: 'RM-FNB-010', name: 'Roti Burger & Pastry Butter Dough', ingredientName: 'Roti Burger & Pastry Butter Dough', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 5000, subtotalCost: 5000 },
      { ingredientId: 'RM-FNB-011', name: 'Keju Slice Melt Cheddar', ingredientName: 'Keju Slice Melt Cheddar', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 3000, subtotalCost: 3000 },
      { ingredientId: 'RM-FNB-014', name: 'Susu Fresh Milk UHT', ingredientName: 'Susu Fresh Milk UHT', qty: 95, portionQty: 95, unit: 'ml', costPerUnit: 16, subtotalCost: 1500 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', ingredientName: 'Lunch Box Food Grade Eco', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1500, subtotalCost: 1500 },
    ],
  },
  'FNB-TEA-JUMBO': {
    rawMaterialCost: 2200,
    operationalCost: 0,
    wastePercent: 0,
    targetMarginPercent: 72,
    recipe: [
      { ingredientId: 'RM-FNB-015', name: 'Bubuk Matcha Jepang & Teh Melati', ingredientName: 'Bubuk Matcha Jepang & Teh Melati', qty: 2, portionQty: 2, unit: 'gr', costPerUnit: 300, subtotalCost: 600 },
      { ingredientId: 'RM-FNB-013', name: 'Gula Aren Cair', ingredientName: 'Gula Aren Cair', qty: 8, portionQty: 8, unit: 'ml', costPerUnit: 50, subtotalCost: 400 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', ingredientName: 'Paper Cup 16oz', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1200, subtotalCost: 1200 },
    ],
  },
  'FNB-001': {
    rawMaterialCost: 24100,
    operationalCost: 1500,
    wastePercent: 5,
    targetMarginPercent: 45,
    recipe: [
      { ingredientId: 'RM-FNB-001', name: 'Beras Putih Pandan Wangi', ingredientName: 'Beras Putih Pandan Wangi', qty: 150, portionQty: 150, unit: 'gr', costPerUnit: 15, subtotalCost: 2250 },
      { ingredientId: 'RM-FNB-002', name: 'Daging Sapi Wagyu Slice', ingredientName: 'Daging Sapi Wagyu Slice', qty: 80, portionQty: 80, unit: 'gr', costPerUnit: 180, subtotalCost: 14400 },
      { ingredientId: 'RM-FNB-004', name: 'Telur Ayam Negeri Pilihan', ingredientName: 'Telur Ayam Negeri Pilihan', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 2000, subtotalCost: 2000 },
      { ingredientId: 'RM-FNB-005', name: 'Bumbu Racik Rempah Spesial', ingredientName: 'Bumbu Racik Rempah Spesial', qty: 50, portionQty: 50, unit: 'gr', costPerUnit: 70, subtotalCost: 3500 },
      { ingredientId: 'RM-FNB-006', name: 'Minyak Goreng Sawit Chef', ingredientName: 'Minyak Goreng Sawit Chef', qty: 25, portionQty: 25, unit: 'ml', costPerUnit: 18, subtotalCost: 450 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', ingredientName: 'Lunch Box Food Grade Eco', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1500, subtotalCost: 1500 },
    ],
  },
  'FNB-002': {
    rawMaterialCost: 16360,
    operationalCost: 1500,
    wastePercent: 5,
    targetMarginPercent: 45,
    recipe: [
      { ingredientId: 'RM-FNB-003', name: 'Daging Ayam Fillet Segar', ingredientName: 'Daging Ayam Fillet Segar', qty: 200, portionQty: 200, unit: 'gr', costPerUnit: 55, subtotalCost: 11000 },
      { ingredientId: 'RM-FNB-005', name: 'Bumbu Racik Rempah Spesial', ingredientName: 'Bumbu Racik Rempah Spesial', qty: 50, portionQty: 50, unit: 'gr', costPerUnit: 70, subtotalCost: 3500 },
      { ingredientId: 'RM-FNB-006', name: 'Minyak Goreng Sawit Chef', ingredientName: 'Minyak Goreng Sawit Chef', qty: 20, portionQty: 20, unit: 'ml', costPerUnit: 18, subtotalCost: 360 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', ingredientName: 'Lunch Box Food Grade Eco', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1500, subtotalCost: 1500 },
    ],
  },
  'FNB-003': {
    rawMaterialCost: 16850,
    operationalCost: 1500,
    wastePercent: 5,
    targetMarginPercent: 45,
    recipe: [
      { ingredientId: 'RM-FNB-007', name: 'Mie Telur Hokkien Segar', ingredientName: 'Mie Telur Hokkien Segar', qty: 180, portionQty: 180, unit: 'gr', costPerUnit: 25, subtotalCost: 4500 },
      { ingredientId: 'RM-FNB-008', name: 'Udang & Cumi Seafood Segar', ingredientName: 'Udang & Cumi Seafood Segar', qty: 90, portionQty: 90, unit: 'gr', costPerUnit: 90, subtotalCost: 8100 },
      { ingredientId: 'RM-FNB-004', name: 'Telur Ayam Negeri Pilihan', ingredientName: 'Telur Ayam Negeri Pilihan', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 2000, subtotalCost: 2000 },
      { ingredientId: 'RM-FNB-006', name: 'Minyak Goreng Sawit Chef', ingredientName: 'Minyak Goreng Sawit Chef', qty: 25, portionQty: 25, unit: 'ml', costPerUnit: 18, subtotalCost: 450 },
      { ingredientId: 'RM-FNB-019', name: 'Paper Bowl & Tutup 650ml', ingredientName: 'Paper Bowl & Tutup 650ml', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1800, subtotalCost: 1800 },
    ],
  },
  'FNB-004': {
    rawMaterialCost: 26770,
    operationalCost: 1500,
    wastePercent: 5,
    targetMarginPercent: 45,
    recipe: [
      { ingredientId: 'RM-FNB-009', name: 'Beef Patty Gourmet 120g', ingredientName: 'Beef Patty Gourmet 120g', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 14000, subtotalCost: 14000 },
      { ingredientId: 'RM-FNB-010', name: 'Roti Burger & Pastry Butter Dough', ingredientName: 'Roti Burger & Pastry Butter Dough', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 5000, subtotalCost: 5000 },
      { ingredientId: 'RM-FNB-011', name: 'Keju Slice Melt Cheddar', ingredientName: 'Keju Slice Melt Cheddar', qty: 2, portionQty: 2, unit: 'pcs', costPerUnit: 3000, subtotalCost: 6000 },
      { ingredientId: 'RM-FNB-006', name: 'Minyak Goreng Sawit Chef', ingredientName: 'Minyak Goreng Sawit Chef', qty: 15, portionQty: 15, unit: 'ml', costPerUnit: 18, subtotalCost: 270 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', ingredientName: 'Lunch Box Food Grade Eco', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1500, subtotalCost: 1500 },
    ],
  },
  'FNB-005': {
    rawMaterialCost: 9240,
    operationalCost: 1200,
    wastePercent: 5,
    targetMarginPercent: 55,
    recipe: [
      { ingredientId: 'RM-FNB-012', name: 'Biji Kopi Espresso Blend', ingredientName: 'Biji Kopi Espresso Blend', qty: 18, portionQty: 18, unit: 'gr', costPerUnit: 200, subtotalCost: 3600 },
      { ingredientId: 'RM-FNB-014', name: 'Susu Fresh Milk UHT', ingredientName: 'Susu Fresh Milk UHT', qty: 180, portionQty: 180, unit: 'ml', costPerUnit: 16, subtotalCost: 2880 },
      { ingredientId: 'RM-FNB-013', name: 'Gula Aren Cair', ingredientName: 'Gula Aren Cair', qty: 30, portionQty: 30, unit: 'ml', costPerUnit: 52, subtotalCost: 1560 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', ingredientName: 'Paper Cup 16oz', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1200, subtotalCost: 1200 },
    ],
  },
  'FNB-006': {
    rawMaterialCost: 6800,
    operationalCost: 1200,
    wastePercent: 5,
    targetMarginPercent: 60,
    recipe: [
      { ingredientId: 'RM-FNB-014', name: 'Susu Fresh Milk UHT', ingredientName: 'Susu Fresh Milk UHT', qty: 220, portionQty: 220, unit: 'ml', costPerUnit: 16, subtotalCost: 3520 },
      { ingredientId: 'RM-FNB-013', name: 'Gula Aren Cair', ingredientName: 'Gula Aren Cair', qty: 40, portionQty: 40, unit: 'ml', costPerUnit: 52, subtotalCost: 2080 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', ingredientName: 'Paper Cup 16oz', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1200, subtotalCost: 1200 },
    ],
  },
  'FNB-007': {
    rawMaterialCost: 9940,
    operationalCost: 1200,
    wastePercent: 5,
    targetMarginPercent: 55,
    recipe: [
      { ingredientId: 'RM-FNB-015', name: 'Bubuk Matcha Jepang & Teh Melati', ingredientName: 'Bubuk Matcha Jepang & Teh Melati', qty: 15, portionQty: 15, unit: 'gr', costPerUnit: 300, subtotalCost: 4500 },
      { ingredientId: 'RM-FNB-014', name: 'Susu Fresh Milk UHT', ingredientName: 'Susu Fresh Milk UHT', qty: 200, portionQty: 200, unit: 'ml', costPerUnit: 16, subtotalCost: 3200 },
      { ingredientId: 'RM-FNB-013', name: 'Gula Aren Cair', ingredientName: 'Gula Aren Cair', qty: 20, portionQty: 20, unit: 'ml', costPerUnit: 52, subtotalCost: 1040 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', ingredientName: 'Paper Cup 16oz', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1200, subtotalCost: 1200 },
    ],
  },
  'FNB-008': {
    rawMaterialCost: 4220,
    operationalCost: 1000,
    wastePercent: 5,
    targetMarginPercent: 65,
    recipe: [
      { ingredientId: 'RM-FNB-015', name: 'Bubuk Matcha Jepang & Teh Melati', ingredientName: 'Bubuk Matcha Jepang & Teh Melati', qty: 4, portionQty: 4, unit: 'gr', costPerUnit: 300, subtotalCost: 1200 },
      { ingredientId: 'RM-FNB-013', name: 'Gula Aren Cair', ingredientName: 'Gula Aren Cair', qty: 35, portionQty: 35, unit: 'ml', costPerUnit: 52, subtotalCost: 1820 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', ingredientName: 'Paper Cup 16oz', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1200, subtotalCost: 1200 },
    ],
  },
  'FNB-009': {
    rawMaterialCost: 10300,
    operationalCost: 1200,
    wastePercent: 5,
    targetMarginPercent: 50,
    recipe: [
      { ingredientId: 'RM-FNB-016', name: 'Kentang Beku Shoestring', ingredientName: 'Kentang Beku Shoestring', qty: 160, portionQty: 160, unit: 'gr', costPerUnit: 40, subtotalCost: 6400 },
      { ingredientId: 'RM-FNB-006', name: 'Minyak Goreng Sawit Chef', ingredientName: 'Minyak Goreng Sawit Chef', qty: 50, portionQty: 50, unit: 'ml', costPerUnit: 18, subtotalCost: 900 },
      { ingredientId: 'RM-FNB-017', name: 'Minyak Truffle & Saus Mayo', ingredientName: 'Minyak Truffle & Saus Mayo', qty: 10, portionQty: 10, unit: 'ml', costPerUnit: 150, subtotalCost: 1500 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', ingredientName: 'Lunch Box Food Grade Eco', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1500, subtotalCost: 1500 },
    ],
  },
  'FNB-010': {
    rawMaterialCost: 11800,
    operationalCost: 1200,
    wastePercent: 5,
    targetMarginPercent: 50,
    recipe: [
      { ingredientId: 'RM-FNB-003', name: 'Daging Ayam Fillet Segar', ingredientName: 'Daging Ayam Fillet Segar', qty: 80, portionQty: 80, unit: 'gr', costPerUnit: 55, subtotalCost: 4400 },
      { ingredientId: 'RM-FNB-008', name: 'Udang & Cumi Seafood Segar', ingredientName: 'Udang & Cumi Seafood Segar', qty: 50, portionQty: 50, unit: 'gr', costPerUnit: 90, subtotalCost: 4500 },
      { ingredientId: 'RM-FNB-005', name: 'Bumbu Racik Rempah Spesial', ingredientName: 'Bumbu Racik Rempah Spesial', qty: 20, portionQty: 20, unit: 'gr', costPerUnit: 70, subtotalCost: 1400 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', ingredientName: 'Lunch Box Food Grade Eco', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1500, subtotalCost: 1500 },
    ],
  },
  'FNB-011': {
    rawMaterialCost: 7200,
    operationalCost: 1000,
    wastePercent: 5,
    targetMarginPercent: 55,
    recipe: [
      { ingredientId: 'RM-FNB-005', name: 'Bumbu Racik Rempah Spesial', ingredientName: 'Bumbu Racik Rempah Spesial', qty: 50, portionQty: 50, unit: 'gr', costPerUnit: 70, subtotalCost: 3500 },
      { ingredientId: 'RM-FNB-006', name: 'Minyak Goreng Sawit Chef', ingredientName: 'Minyak Goreng Sawit Chef', qty: 50, portionQty: 50, unit: 'ml', costPerUnit: 18, subtotalCost: 900 },
      { ingredientId: 'RM-FNB-017', name: 'Minyak Truffle & Saus Mayo', ingredientName: 'Minyak Truffle & Saus Mayo', qty: 8, portionQty: 8, unit: 'ml', costPerUnit: 150, subtotalCost: 1200 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', ingredientName: 'Lunch Box Food Grade Eco', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1500, subtotalCost: 1500 },
    ],
  },
  'FNB-012': {
    rawMaterialCost: 22350,
    operationalCost: 1500,
    wastePercent: 5,
    targetMarginPercent: 50,
    recipe: [
      { ingredientId: 'RM-FNB-001', name: 'Beras Putih Pandan Wangi', ingredientName: 'Beras Putih Pandan Wangi', qty: 150, portionQty: 150, unit: 'gr', costPerUnit: 15, subtotalCost: 2250 },
      { ingredientId: 'RM-FNB-003', name: 'Daging Ayam Fillet Segar', ingredientName: 'Daging Ayam Fillet Segar', qty: 200, portionQty: 200, unit: 'gr', costPerUnit: 55, subtotalCost: 11000 },
      { ingredientId: 'RM-FNB-005', name: 'Bumbu Racik Rempah Spesial', ingredientName: 'Bumbu Racik Rempah Spesial', qty: 50, portionQty: 50, unit: 'gr', costPerUnit: 70, subtotalCost: 3500 },
      { ingredientId: 'RM-FNB-015', name: 'Bubuk Matcha Jepang & Teh Melati', ingredientName: 'Bubuk Matcha Jepang & Teh Melati', qty: 4, portionQty: 4, unit: 'gr', costPerUnit: 300, subtotalCost: 1200 },
      { ingredientId: 'RM-FNB-013', name: 'Gula Aren Cair', ingredientName: 'Gula Aren Cair', qty: 30, portionQty: 30, unit: 'ml', costPerUnit: 52, subtotalCost: 1560 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', ingredientName: 'Lunch Box Food Grade Eco', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1500, subtotalCost: 1500 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', ingredientName: 'Paper Cup 16oz', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1200, subtotalCost: 1200 },
    ],
  },
  'FNB-013': {
    rawMaterialCost: 39250,
    operationalCost: 2500,
    wastePercent: 5,
    targetMarginPercent: 48,
    recipe: [
      { ingredientId: 'RM-FNB-001', name: 'Beras Putih Pandan Wangi', ingredientName: 'Beras Putih Pandan Wangi', qty: 150, portionQty: 150, unit: 'gr', costPerUnit: 15, subtotalCost: 2250 },
      { ingredientId: 'RM-FNB-002', name: 'Daging Sapi Wagyu Slice', ingredientName: 'Daging Sapi Wagyu Slice', qty: 80, portionQty: 80, unit: 'gr', costPerUnit: 180, subtotalCost: 14400 },
      { ingredientId: 'RM-FNB-016', name: 'Kentang Beku Shoestring', ingredientName: 'Kentang Beku Shoestring', qty: 150, portionQty: 150, unit: 'gr', costPerUnit: 40, subtotalCost: 6000 },
      { ingredientId: 'RM-FNB-014', name: 'Susu Fresh Milk UHT', ingredientName: 'Susu Fresh Milk UHT', qty: 200, portionQty: 200, unit: 'ml', costPerUnit: 16, subtotalCost: 3200 },
      { ingredientId: 'RM-FNB-013', name: 'Gula Aren Cair', ingredientName: 'Gula Aren Cair', qty: 35, portionQty: 35, unit: 'ml', costPerUnit: 52, subtotalCost: 1820 },
      { ingredientId: 'RM-FNB-018', name: 'Lunch Box Food Grade Eco', ingredientName: 'Lunch Box Food Grade Eco', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1500, subtotalCost: 1500 },
      { ingredientId: 'RM-FNB-020', name: 'Paper Cup 16oz', ingredientName: 'Paper Cup 16oz', qty: 1, portionQty: 1, unit: 'pcs', costPerUnit: 1200, subtotalCost: 1200 },
    ],
  },
};

/**
 * Helper cerdas untuk mengambil resep BOM default berdasarkan ID atau nama/kategori menu F&B
 */
export function getDefaultRecipeForFnbMenu(menu: { id?: string; name?: string; category?: string }) {
  const menuId = (menu.id || '').trim();
  if (menuId && DEFAULT_FNB_MENU_RECIPES[menuId]) {
    return DEFAULT_FNB_MENU_RECIPES[menuId];
  }
  const nameLower = (menu.name || '').toLowerCase();
  const catLower = (menu.category || '').toLowerCase();

  if (nameLower.includes('kopi susu') || nameLower.includes('gula aren')) {
    return DEFAULT_FNB_MENU_RECIPES['FNB-KOP-AREN'];
  }
  if (nameLower.includes('espresso') || nameLower.includes('americano')) {
    return DEFAULT_FNB_MENU_RECIPES['FNB-ESP-SHOT'];
  }
  if (nameLower.includes('caramel') || nameLower.includes('macchiato') || catLower.includes('kopi')) {
    return DEFAULT_FNB_MENU_RECIPES['FNB-005'];
  }
  if (nameLower.includes('croissant') || nameLower.includes('pastry') || nameLower.includes('roti') || catLower.includes('pastry')) {
    return DEFAULT_FNB_MENU_RECIPES['FNB-CRS-BTR'];
  }
  if (nameLower.includes('teh') || nameLower.includes('lemon tea')) {
    return DEFAULT_FNB_MENU_RECIPES['FNB-TEA-JUMBO'];
  }
  if (nameLower.includes('matcha')) {
    return DEFAULT_FNB_MENU_RECIPES['FNB-007'];
  }
  if (nameLower.includes('boba') || nameLower.includes('brown sugar') || catLower.includes('segar') || catLower.includes('minuman')) {
    return DEFAULT_FNB_MENU_RECIPES['FNB-006'];
  }
  if (nameLower.includes('fries') || nameLower.includes('kentang')) {
    return DEFAULT_FNB_MENU_RECIPES['FNB-009'];
  }
  if (nameLower.includes('dimsum')) {
    return DEFAULT_FNB_MENU_RECIPES['FNB-010'];
  }
  if (nameLower.includes('tahu')) {
    return DEFAULT_FNB_MENU_RECIPES['FNB-011'];
  }
  if (nameLower.includes('burger')) {
    return DEFAULT_FNB_MENU_RECIPES['FNB-004'];
  }
  if (nameLower.includes('mie')) {
    return DEFAULT_FNB_MENU_RECIPES['FNB-003'];
  }
  if (nameLower.includes('ayam')) {
    return DEFAULT_FNB_MENU_RECIPES['FNB-002'];
  }
  if (nameLower.includes('wagyu')) {
    return DEFAULT_FNB_MENU_RECIPES['FNB-001'];
  }
  return DEFAULT_FNB_MENU_RECIPES['FNB-NASGOR-SP'];
}

export const RECIPE_PRESETS: RecipePreset[] = [
  {
    id: 'preset-kopi-gula-aren',
    name: 'Kopi Susu Gula Aren Signature',
    category: 'Kopi',
    wastePercent: 0,
    packagingCost: 0,
    recipe: DEFAULT_FNB_MENU_RECIPES['FNB-KOP-AREN'].recipe,
  },
  {
    id: 'preset-nasgor-wagyu',
    name: 'Nasi Goreng Wagyu Spesial',
    category: 'Makanan Utama',
    wastePercent: 5,
    packagingCost: 1500,
    recipe: DEFAULT_FNB_MENU_RECIPES['FNB-001'].recipe,
  },
  {
    id: 'preset-ayam-madu',
    name: 'Ayam Bakar Madu Pedas Manis',
    category: 'Makanan Utama',
    wastePercent: 5,
    packagingCost: 1500,
    recipe: DEFAULT_FNB_MENU_RECIPES['FNB-002'].recipe,
  },
  {
    id: 'preset-burger-beef',
    name: 'Beef Burger Deluxe Double Cheese',
    category: 'Makanan Utama',
    wastePercent: 5,
    packagingCost: 1500,
    recipe: DEFAULT_FNB_MENU_RECIPES['FNB-004'].recipe,
  },
  {
    id: 'preset-caramel-macchiato',
    name: 'Iced Caramel Macchiato',
    category: 'Kopi',
    wastePercent: 5,
    packagingCost: 1200,
    recipe: DEFAULT_FNB_MENU_RECIPES['FNB-005'].recipe,
  },
  {
    id: 'preset-matcha-latte',
    name: 'Matcha Green Tea Latte',
    category: 'Non-Kopi / Segar',
    wastePercent: 5,
    packagingCost: 1200,
    recipe: DEFAULT_FNB_MENU_RECIPES['FNB-007'].recipe,
  },
  {
    id: 'preset-french-fries',
    name: 'French Fries Truffle & Herb',
    category: 'Pastry & Bakery',
    wastePercent: 5,
    packagingCost: 1200,
    recipe: DEFAULT_FNB_MENU_RECIPES['FNB-009'].recipe,
  },
];
