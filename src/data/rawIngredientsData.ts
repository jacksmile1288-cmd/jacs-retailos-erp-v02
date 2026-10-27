import { RecipeIngredient, Product, InventoryRecord } from '../types';

export interface RawIngredientMaster {
  id: string;
  name: string;
  category: string;
  unit: string;
  costPerUnit: number; // Harga modal per unit dasar
  currentStock: number;
}

export const INITIAL_RAW_INGREDIENTS: RawIngredientMaster[] = [
  { id: 'ING-001', name: 'Beras Putih Pandan Wangi', category: 'Sembako & Beras', unit: 'gr', costPerUnit: 15, currentStock: 25000 },
  { id: 'ING-002', name: 'Daging Sapi Wagyu Slice', category: 'Daging & Unggas', unit: 'gr', costPerUnit: 180, currentStock: 8000 },
  { id: 'ING-003', name: 'Daging Ayam Fillet Segar', category: 'Daging & Unggas', unit: 'gr', costPerUnit: 55, currentStock: 12000 },
  { id: 'ING-004', name: 'Telur Ayam Negeri', category: 'Telur & Diary', unit: 'pcs', costPerUnit: 2000, currentStock: 300 },
  { id: 'ING-005', name: 'Bumbu Racik Rempah Spesial', category: 'Bumbu & Rempah', unit: 'porsi', costPerUnit: 3500, currentStock: 500 },
  { id: 'ING-006', name: 'Minyak Goreng Sawit', category: 'Minyak & Lemak', unit: 'ml', costPerUnit: 18, currentStock: 30000 },
  { id: 'ING-007', name: 'Mie Telur Hokkien', category: 'Bahan Olahan', unit: 'gr', costPerUnit: 25, currentStock: 10000 },
  { id: 'ING-008', name: 'Udang & Cumi Seafood Segar', category: 'Seafood', unit: 'gr', costPerUnit: 90, currentStock: 6000 },
  { id: 'ING-009', name: 'Beef Patty Gourmet 120g', category: 'Daging & Unggas', unit: 'pcs', costPerUnit: 14000, currentStock: 150 },
  { id: 'ING-010', name: 'Roti Burger Brioche Bun', category: 'Bakery & Roti', unit: 'pcs', costPerUnit: 5000, currentStock: 150 },
  { id: 'ING-011', name: 'Keju Slice Melt Cheddar', category: 'Telur & Diary', unit: 'slice', costPerUnit: 3000, currentStock: 200 },
  { id: 'ING-012', name: 'Biji Kopi Espresso Blend Arabica', category: 'Kopi & Teh', unit: 'gr', costPerUnit: 280, currentStock: 5000 },
  { id: 'ING-013', name: 'Sirup Karamel & Gula Cair', category: 'Sirup & Pemanis', unit: 'ml', costPerUnit: 45, currentStock: 6000 },
  { id: 'ING-014', name: 'Susu Fresh Milk UHT', category: 'Telur & Diary', unit: 'ml', costPerUnit: 22, currentStock: 20000 },
  { id: 'ING-015', name: 'Bubuk Matcha Jepang Premium', category: 'Kopi & Teh', unit: 'gr', costPerUnit: 400, currentStock: 2000 },
  { id: 'ING-016', name: 'Kentang Beku Shoestring', category: 'Bahan Olahan', unit: 'gr', costPerUnit: 40, currentStock: 15000 },
  { id: 'ING-017', name: 'Minyak Truffle & Parsley', category: 'Minyak & Lemak', unit: 'ml', costPerUnit: 250, currentStock: 1000 },
  { id: 'ING-018', name: 'Lunch Box Food Grade Eco', category: 'Kemasan (Packaging)', unit: 'pcs', costPerUnit: 1500, currentStock: 400 },
  { id: 'ING-019', name: 'Paper Bowl & Tutup 650ml', category: 'Kemasan (Packaging)', unit: 'pcs', costPerUnit: 1800, currentStock: 350 },
  { id: 'ING-020', name: 'Paper Cup 16oz & Sedotan', category: 'Kemasan (Packaging)', unit: 'pcs', costPerUnit: 1200, currentStock: 500 },
];

/**
 * Konversi bahan baku ke format produk ERP (untuk sinkronisasi katalog gudang)
 */
export const RAW_INGREDIENTS_AS_PRODUCTS: Product[] = INITIAL_RAW_INGREDIENTS.map((ing) => ({
  id: ing.id,
  name: ing.name,
  itemType: 'RAW_MATERIAL',
  category: 'Bahan Baku & Mentah',
  brand: 'Gudang Utama',
  sell_price: ing.costPerUnit,
  cost_price: ing.costPerUnit,
  stock: ing.currentStock,
  unit: ing.unit,
  status: 'Active',
  businessModel: 'fnb',
  plu: ing.id,
}));

export const RAW_INGREDIENTS_AS_INVENTORY: InventoryRecord[] = INITIAL_RAW_INGREDIENTS.map((ing) => ({
  product_id: ing.id,
  product_name: ing.name,
  initial_stock: ing.currentStock,
  in_qty: 0,
  out_qty: 0,
  final_stock: ing.currentStock,
  last_update: '2026-09-27 08:00:00',
}));

export interface RecipePreset {
  id: string;
  name: string;
  category: string;
  recipe: RecipeIngredient[];
  wastePercent: number;
  packagingCost: number;
}

export const RECIPE_PRESETS: RecipePreset[] = [
  {
    id: 'preset-nasgor-wagyu',
    name: 'Nasi Goreng Wagyu Spesial',
    category: 'Makanan Utama',
    wastePercent: 5,
    packagingCost: 1500,
    recipe: [
      { ingredientId: 'ING-001', name: 'Beras Putih Pandan Wangi', qty: 150, unit: 'gr', costPerUnit: 15 },
      { ingredientId: 'ING-002', name: 'Daging Sapi Wagyu Slice', qty: 80, unit: 'gr', costPerUnit: 180 },
      { ingredientId: 'ING-004', name: 'Telur Ayam Negeri', qty: 1, unit: 'pcs', costPerUnit: 2000 },
      { ingredientId: 'ING-005', name: 'Bumbu Racik Rempah Spesial', qty: 1, unit: 'porsi', costPerUnit: 3500 },
      { ingredientId: 'ING-006', name: 'Minyak Goreng Sawit', qty: 25, unit: 'ml', costPerUnit: 18 },
    ],
  },
  {
    id: 'preset-ayam-madu',
    name: 'Ayam Bakar Madu Pedas Manis',
    category: 'Makanan Utama',
    wastePercent: 5,
    packagingCost: 1500,
    recipe: [
      { ingredientId: 'ING-003', name: 'Daging Ayam Fillet Segar', qty: 200, unit: 'gr', costPerUnit: 55 },
      { ingredientId: 'ING-005', name: 'Bumbu Racik Rempah Spesial', qty: 1, unit: 'porsi', costPerUnit: 3500 },
      { ingredientId: 'ING-006', name: 'Minyak Goreng Sawit', qty: 20, unit: 'ml', costPerUnit: 18 },
    ],
  },
  {
    id: 'preset-burger-beef',
    name: 'Beef Burger Deluxe Double Cheese',
    category: 'Makanan Utama',
    wastePercent: 5,
    packagingCost: 1500,
    recipe: [
      { ingredientId: 'ING-009', name: 'Beef Patty Gourmet 120g', qty: 1, unit: 'pcs', costPerUnit: 14000 },
      { ingredientId: 'ING-010', name: 'Roti Burger Brioche Bun', qty: 1, unit: 'pcs', costPerUnit: 5000 },
      { ingredientId: 'ING-011', name: 'Keju Slice Melt Cheddar', qty: 2, unit: 'slice', costPerUnit: 3000 },
      { ingredientId: 'ING-006', name: 'Minyak Goreng Sawit', qty: 15, unit: 'ml', costPerUnit: 18 },
    ],
  },
  {
    id: 'preset-caramel-macchiato',
    name: 'Iced Caramel Macchiato',
    category: 'Minuman',
    wastePercent: 5,
    packagingCost: 1200,
    recipe: [
      { ingredientId: 'ING-012', name: 'Biji Kopi Espresso Blend Arabica', qty: 18, unit: 'gr', costPerUnit: 280 },
      { ingredientId: 'ING-014', name: 'Susu Fresh Milk UHT', qty: 180, unit: 'ml', costPerUnit: 22 },
      { ingredientId: 'ING-013', name: 'Sirup Karamel & Gula Cair', qty: 30, unit: 'ml', costPerUnit: 45 },
    ],
  },
  {
    id: 'preset-matcha-latte',
    name: 'Matcha Green Tea Latte',
    category: 'Minuman',
    wastePercent: 5,
    packagingCost: 1200,
    recipe: [
      { ingredientId: 'ING-015', name: 'Bubuk Matcha Jepang Premium', qty: 15, unit: 'gr', costPerUnit: 400 },
      { ingredientId: 'ING-014', name: 'Susu Fresh Milk UHT', qty: 200, unit: 'ml', costPerUnit: 22 },
      { ingredientId: 'ING-013', name: 'Sirup Karamel & Gula Cair', qty: 20, unit: 'ml', costPerUnit: 45 },
    ],
  },
  {
    id: 'preset-french-fries',
    name: 'French Fries Truffle & Herb',
    category: 'Snack & Camilan',
    wastePercent: 5,
    packagingCost: 1200,
    recipe: [
      { ingredientId: 'ING-016', name: 'Kentang Beku Shoestring', qty: 160, unit: 'gr', costPerUnit: 40 },
      { ingredientId: 'ING-006', name: 'Minyak Goreng Sawit', qty: 50, unit: 'ml', costPerUnit: 18 },
      { ingredientId: 'ING-017', name: 'Minyak Truffle & Parsley', qty: 10, unit: 'ml', costPerUnit: 250 },
    ],
  },
];
