import { Product, RecipeIngredient } from '../types';

export interface HppCalculationResult {
  rawIngredientsCost: number;
  wastePercent: number;
  wasteCost: number;
  packagingCost: number;
  totalHpp: number;
  foodCostPercent: number;
  grossMarginNominal: number;
  grossMarginPercent: number;
  status: 'optimal' | 'moderate' | 'warning';
  statusLabel: string;
}

/**
 * Menghitung HPP Otomatis = Total Biaya Bahan Baku + Kemasan + (Waste % * Biaya Bahan)
 * Serta Food Cost % secara dinamis terhadap harga jual.
 */
export const calculateProductHpp = (
  product: Partial<Product>,
  customRecipe?: RecipeIngredient[],
  customWastePercent?: number,
  customPackagingCost?: number,
  customSellPrice?: number
): HppCalculationResult => {
  const recipe = customRecipe !== undefined ? customRecipe : product.recipe || [];
  const wastePercent = customWastePercent !== undefined
    ? customWastePercent
    : product.wastePercent !== undefined
    ? product.wastePercent
    : 5;
  const packagingCost = customPackagingCost !== undefined
    ? customPackagingCost
    : product.packagingCost !== undefined
    ? product.packagingCost
    : 0;

  const rawIngredientsCost = recipe.reduce((sum, item) => {
    const qty = Number(item.qty) || 0;
    const cost = Number(item.costPerUnit) || 0;
    return sum + qty * cost;
  }, 0);

  const wasteCost = Math.round((rawIngredientsCost * (wastePercent / 100)));
  const totalHpp = recipe.length > 0
    ? Math.round(rawIngredientsCost + packagingCost + wasteCost)
    : Number(product.cost_price) || 0;

  const sellPrice = customSellPrice !== undefined
    ? customSellPrice
    : Number(product.sell_price) || Number(product.price_retail) || 0;

  const foodCostPercent = sellPrice > 0
    ? Math.round((totalHpp / sellPrice) * 1000) / 10
    : 0;

  const grossMarginNominal = Math.max(0, sellPrice - totalHpp);
  const grossMarginPercent = sellPrice > 0
    ? Math.round(((sellPrice - totalHpp) / sellPrice) * 1000) / 10
    : 0;

  let status: 'optimal' | 'moderate' | 'warning' = 'optimal';
  let statusLabel = 'Optimal (<35%)';

  if (foodCostPercent > 45) {
    status = 'warning';
    statusLabel = 'Tinggi / Margin Tipis (>45%)';
  } else if (foodCostPercent > 35) {
    status = 'moderate';
    statusLabel = 'Moderat (35-45%)';
  } else {
    status = 'optimal';
    statusLabel = 'Sangat Sehat (Ideal F&B 25-35%)';
  }

  return {
    rawIngredientsCost,
    wastePercent,
    wasteCost,
    packagingCost,
    totalHpp,
    foodCostPercent,
    grossMarginNominal,
    grossMarginPercent,
    status,
    statusLabel,
  };
};
