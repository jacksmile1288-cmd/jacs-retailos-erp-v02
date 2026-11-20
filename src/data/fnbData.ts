import { Product, FnbToppingMaster } from '../types';
import { FNB_RESTAURANT_PRODUCTS } from './industryTerminalProducts';

export interface FnbModifierOption {
  id: string;
  name: string;
  price: number;
}

export const FNB_TOPPING_OPTIONS: FnbModifierOption[] = [
  { id: 'top-egg', name: 'Telur Mata Sapi', price: 5000 },
  { id: 'top-cheese', name: 'Keju Mozzarella Melt', price: 7000 },
  { id: 'top-sambal', name: 'Extra Sambal Bawang Korek', price: 3000 },
  { id: 'top-rice', name: 'Nasi Putih Wangi Pandan', price: 6000 },
  { id: 'top-sausage', name: 'Sosis Panggang Bratwurst', price: 8000 },
  { id: 'top-kerupuk', name: 'Kerupuk Kulit Gurih', price: 4000 },
];

export function generateNextToppingSku(
  existing: Array<{ id?: string; sku?: string }>
): string {
  let maxNum = 0;
  existing.forEach((item) => {
    const candidates = [item.sku, item.id].filter(Boolean) as string[];
    candidates.forEach((code) => {
      const m = /^TOP-FNB-(\d+)$/i.exec(code.trim());
      if (m) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n) && n > maxNum) maxNum = n;
      }
    });
  });
  return `TOP-FNB-${String(maxNum + 1).padStart(3, '0')}`;
}

export function generateNextRawMaterialSku(existingIds: string[]): string {
  let maxNum = 0;
  existingIds.forEach((code) => {
    const m = /^RM-FNB-(\d+)$/i.exec((code || '').trim());
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n) && n > maxNum) maxNum = n;
    }
  });
  return `RM-FNB-${String(maxNum + 1).padStart(3, '0')}`;
}

export const DEFAULT_FNB_TOPPING_MASTERS: FnbToppingMaster[] = [
  // Kategori Makanan Utama
  {
    id: 'TOP-FNB-001',
    sku: 'TOP-FNB-001',
    name: 'Extra Telur',
    category: 'MAIN_FOOD',
    price: 5000,
    isActive: true,
    rawMaterialId: 'RM-FNB-004',
    rawMaterialName: 'Telur Ayam Negeri Pilihan',
    rawMaterialQty: 1,
    rawMaterialUnit: 'Pcs',
    hppCost: 2000,
    notes: 'Telur mata sapi / dadar tambahan',
  },
  {
    id: 'TOP-FNB-002',
    sku: 'TOP-FNB-002',
    name: 'Extra Keju',
    category: 'MAIN_FOOD',
    price: 6000,
    isActive: true,
    rawMaterialId: 'RM-FNB-011',
    rawMaterialName: 'Keju Slice Melt Cheddar',
    rawMaterialQty: 1,
    rawMaterialUnit: 'Pcs',
    hppCost: 3000,
    notes: 'Keju cheddar melt tambahan',
  },
  {
    id: 'TOP-FNB-003',
    sku: 'TOP-FNB-003',
    name: 'Extra Ayam Suwir',
    category: 'MAIN_FOOD',
    price: 8000,
    isActive: true,
    rawMaterialId: 'RM-FNB-003',
    rawMaterialName: 'Daging Ayam Fillet Segar',
    rawMaterialQty: 50,
    rawMaterialUnit: 'Gram',
    hppCost: 2750,
    notes: 'Tambahan 50gr daging ayam suwir berbumbu',
  },
  {
    id: 'TOP-FNB-004',
    sku: 'TOP-FNB-004',
    name: 'Kerupuk',
    category: 'MAIN_FOOD',
    price: 3000,
    isActive: true,
    hppCost: 0,
    notes: 'Kerupuk renyah pendamping makanan utama (Non-BOM)',
  },
  // Kategori Kopi & Non-Kopi
  {
    id: 'TOP-FNB-005',
    sku: 'TOP-FNB-005',
    name: 'Extra Espresso Shot',
    category: 'DRINK',
    price: 6000,
    isActive: true,
    rawMaterialId: 'RM-FNB-012',
    rawMaterialName: 'Biji Kopi Espresso Blend',
    rawMaterialQty: 18,
    rawMaterialUnit: 'Gram',
    hppCost: 3600,
    notes: '18gr espresso blend single shot',
  },
  {
    id: 'TOP-FNB-006',
    sku: 'TOP-FNB-006',
    name: 'Boba / Jelly',
    category: 'DRINK',
    price: 5000,
    isActive: true,
    hppCost: 0,
    notes: 'Brown sugar boba / grass jelly 1 scoop (Non-BOM)',
  },
  {
    id: 'TOP-FNB-007',
    sku: 'TOP-FNB-007',
    name: 'Cream Cheese Foam',
    category: 'DRINK',
    price: 7000,
    isActive: true,
    rawMaterialId: 'RM-FNB-011',
    rawMaterialName: 'Keju Slice Melt Cheddar',
    rawMaterialQty: 1,
    rawMaterialUnit: 'Pcs',
    hppCost: 3000,
    notes: 'Foam keju lembut untuk kopi & non-kopi',
  },
  // Kategori Pastry & Snack
  {
    id: 'TOP-FNB-008',
    sku: 'TOP-FNB-008',
    name: 'Saus Keju / Truffle Mayo',
    category: 'PASTRY_SNACK',
    price: 5000,
    isActive: true,
    rawMaterialId: 'RM-FNB-017',
    rawMaterialName: 'Minyak Truffle & Saus Mayo',
    rawMaterialQty: 15,
    rawMaterialUnit: 'Ml',
    hppCost: 2250,
    notes: 'Dipping sauce 15ml untuk pastry & snack',
  },
  {
    id: 'TOP-FNB-009',
    sku: 'TOP-FNB-009',
    name: 'Hangatkan / Warm Up',
    category: 'PASTRY_SNACK',
    price: 0,
    isActive: true,
    hppCost: 0,
    notes: 'Layanan hangatkan di oven sebelum disajikan',
  },
];

export const FNB_MENU_ITEMS: Product[] = FNB_RESTAURANT_PRODUCTS;

export const FNB_PRODUCTS: Product[] = FNB_RESTAURANT_PRODUCTS;
