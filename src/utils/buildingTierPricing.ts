import { Product } from '../types';

export type BuildingTierCode = 'ECERAN' | 'TUKANG' | 'KONTRAKTOR';

export const MIN_SAFE_MARGIN_PERCENT = 3;

export interface BuildingTierConfig {
  tier1Price: number;
  tier2Price: number;
  tier2MinQty: number;
  tier3Price: number;
  tier3MinQty: number;
}

export interface BuildingTierResolution {
  tierName: BuildingTierCode;
  tierBadge: string;
  tierLabel: string;
  tier1UnitPrice: number;
  activeUnitPrice: number;
  savingsPerUnit: number;
  totalSavings: number;
  minQtyApplied: number;
  nextTierHint?: string;
}

export interface TierMarginGuardEvaluation {
  marginPercent: number;
  profitPerUnit: number;
  isBelowHpp: boolean;
  isBelowFloor: boolean;
  status: 'SAFE' | 'LOW_MARGIN' | 'BELOW_HPP';
  minSafePrice: number;
}

export interface BulkCubicConversionResult {
  isBulkConverted: boolean;
  fleetTierId: 'PICKUP_RET' | 'TRUCK_ENGKEL' | 'DUMP_TRUCK' | 'SAK_KARUNG' | 'KUBIK_M3';
  suffix: string;
  factorM3: number;
  label: string;
  unitSalePrice?: number;
  unitCostPrice: number;
}

export const BULK_FLEET_CONVERSION_M3: Record<
  'PICKUP_RET' | 'TRUCK_ENGKEL' | 'DUMP_TRUCK' | 'SAK_KARUNG' | 'KUBIK_M3',
  { suffix: string; factorM3: number; label: string; defaultFleetExpense: number }
> = {
  PICKUP_RET: {
    suffix: '-PKP',
    factorM3: 1.2,
    label: 'Ret Pick-up (1.2 m³)',
    defaultFleetExpense: 85000,
  },
  TRUCK_ENGKEL: {
    suffix: '-ENG',
    factorM3: 3.0,
    label: 'Ret Truk Engkel (3.0 m³)',
    defaultFleetExpense: 175000,
  },
  DUMP_TRUCK: {
    suffix: '-TRK',
    factorM3: 6.5,
    label: 'Ret Dump Truck (6.5 m³)',
    defaultFleetExpense: 325000,
  },
  SAK_KARUNG: {
    suffix: '-SAK',
    factorM3: 0.03,
    label: 'Eceran Sak/Karung (0.03 m³)',
    defaultFleetExpense: 0,
  },
  KUBIK_M3: {
    suffix: '-M3',
    factorM3: 1.0,
    label: 'Kubikasi Dasar (1.0 m³)',
    defaultFleetExpense: 85000,
  },
};

export function calcGrossMarginPercent(sellPrice: number, costPrice: number): number {
  const sell = Number(sellPrice) || 0;
  const cost = Number(costPrice) || 0;
  if (sell <= 0) return 0;
  return Number((((sell - cost) / sell) * 100).toFixed(1));
}

export function getMinSafeSellingPrice(costPrice: number, minMarginPct = MIN_SAFE_MARGIN_PERCENT): number {
  const cost = Math.max(0, Number(costPrice) || 0);
  if (cost <= 0) return 0;
  const raw = cost / (1 - minMarginPct / 100);
  return Math.ceil(raw / 100) * 100;
}

export function evaluateTierMarginGuard(
  sellPrice: number,
  costPrice: number,
  minMarginPct = MIN_SAFE_MARGIN_PERCENT
): TierMarginGuardEvaluation {
  const sell = Number(sellPrice) || 0;
  const cost = Number(costPrice) || 0;
  const marginPercent = calcGrossMarginPercent(sell, cost);
  const profitPerUnit = sell - cost;
  const isBelowHpp = cost > 0 && sell < cost;
  const isBelowFloor = cost > 0 && (sell < cost || marginPercent < minMarginPct);
  const minSafePrice = getMinSafeSellingPrice(cost, minMarginPct);

  let status: 'SAFE' | 'LOW_MARGIN' | 'BELOW_HPP' = 'SAFE';
  if (isBelowHpp) {
    status = 'BELOW_HPP';
  } else if (isBelowFloor) {
    status = 'LOW_MARGIN';
  }

  return {
    marginPercent,
    profitPerUnit,
    isBelowHpp,
    isBelowFloor,
    status,
    minSafePrice,
  };
}

export function resolveBulkCubicConversionFactor(params: {
  suffix?: string;
  bulkUnitType?: string;
  selectedUnit?: string;
  barcode?: string;
  product?: Product | null;
}): BulkCubicConversionResult {
  const { suffix, bulkUnitType, selectedUnit, barcode, product } = params;
  const rawSuffix = (suffix || '').toUpperCase().trim();
  const rawBarcode = (barcode || product?.barcode || product?.plu || '').toUpperCase().trim();
  const rawUnitType = (bulkUnitType || product?.bulkUnitType || '').toUpperCase().trim();
  const rawSelectedUnit = (selectedUnit || product?.unit || '').toUpperCase().trim();

  const isBulkProduct = Boolean(
    product?.materialNature === 'BULK_CURAH' ||
      (Array.isArray(product?.bulkFleetTiers) && product!.bulkFleetTiers!.length > 0) ||
      rawSelectedUnit.includes('M³') ||
      rawSelectedUnit.includes('M3') ||
      rawSelectedUnit.includes('KUBIK') ||
      rawSelectedUnit.includes('RET') ||
      rawSuffix.endsWith('-PKP') ||
      rawSuffix.endsWith('-ENG') ||
      rawSuffix.endsWith('-TRK') ||
      rawSuffix.endsWith('-SAK') ||
      rawBarcode.endsWith('-PKP') ||
      rawBarcode.endsWith('-ENG') ||
      rawBarcode.endsWith('-TRK') ||
      rawBarcode.endsWith('-SAK')
  );

  let detectedId: 'PICKUP_RET' | 'TRUCK_ENGKEL' | 'DUMP_TRUCK' | 'SAK_KARUNG' | 'KUBIK_M3' = 'KUBIK_M3';
  let hasExplicitFleetSuffix = false;

  if (
    rawSuffix.includes('-TRK') ||
    rawBarcode.endsWith('-TRK') ||
    rawUnitType === 'DUMP_TRUCK' ||
    rawSelectedUnit.includes('-TRK') ||
    rawSelectedUnit.includes('DUMP') ||
    rawSelectedUnit.includes('6.5')
  ) {
    detectedId = 'DUMP_TRUCK';
    hasExplicitFleetSuffix = true;
  } else if (
    rawSuffix.includes('-ENG') ||
    rawBarcode.endsWith('-ENG') ||
    rawUnitType === 'TRUCK_ENGKEL' ||
    rawUnitType === 'TRUCK_RET' ||
    rawSelectedUnit.includes('-ENG') ||
    rawSelectedUnit.includes('ENGKEL') ||
    rawSelectedUnit.includes('3.0')
  ) {
    detectedId = 'TRUCK_ENGKEL';
    hasExplicitFleetSuffix = true;
  } else if (
    rawSuffix.includes('-SAK') ||
    rawBarcode.endsWith('-SAK') ||
    rawUnitType === 'SAK_KARUNG' ||
    rawSelectedUnit.includes('-SAK') ||
    (isBulkProduct && (rawSelectedUnit.includes('KARUNG') || rawSelectedUnit.includes('0.03')))
  ) {
    detectedId = 'SAK_KARUNG';
    hasExplicitFleetSuffix = true;
  } else if (
    rawSuffix.includes('-PKP') ||
    rawBarcode.endsWith('-PKP') ||
    rawUnitType === 'PICKUP_RET' ||
    rawSelectedUnit.includes('-PKP') ||
    rawSelectedUnit.includes('PICK-UP') ||
    rawSelectedUnit.includes('PICKUP') ||
    rawSelectedUnit.includes('1.2')
  ) {
    detectedId = 'PICKUP_RET';
    hasExplicitFleetSuffix = true;
  }

  const matchedTier = product?.bulkFleetTiers?.find(
    (t) => t.id === detectedId || (t.suffix && rawSelectedUnit.includes(t.suffix.toUpperCase()))
  );
  const std = BULK_FLEET_CONVERSION_M3[detectedId];
  const factorM3 = matchedTier?.volumeM3 ?? std.factorM3;

  // Hitung HPP dasar per 1 m³ dari produk induk
  const rawBaseCost = Number(product?.costPrice ?? product?.cost_price ?? product?.buy_price ?? 0) || 0;
  const prodDefaultUnit = (product?.unit || '').toUpperCase();
  const baseUnitFactor =
    prodDefaultUnit.includes('PICK') || prodDefaultUnit.includes('1.2')
      ? 1.2
      : prodDefaultUnit.includes('ENGKEL') || prodDefaultUnit.includes('3.0')
      ? 3.0
      : prodDefaultUnit.includes('DUMP') || prodDefaultUnit.includes('6.5')
      ? 6.5
      : 1.0;
  const costPerM3 = baseUnitFactor > 0 ? rawBaseCost / baseUnitFactor : rawBaseCost;
  const unitCostPrice = matchedTier?.costPrice ?? Math.round(costPerM3 * factorM3);

  return {
    isBulkConverted: isBulkProduct && (hasExplicitFleetSuffix || detectedId !== 'KUBIK_M3' || prodDefaultUnit.includes('M³') || prodDefaultUnit.includes('M3')),
    fleetTierId: detectedId,
    suffix: matchedTier?.suffix || std.suffix,
    factorM3,
    label: matchedTier?.name || std.label,
    unitSalePrice: matchedTier?.price,
    unitCostPrice,
  };
}

export function estimateFleetDeliveryExpense(
  fleetType?: string,
  deliveryPolicy?: string,
  deliveryFleetActive?: boolean
): number {
  const isFrangko =
    deliveryPolicy === 'FRANGKO' ||
    deliveryPolicy === 'INCLUDE_ONGKIR' ||
    Boolean(deliveryFleetActive) ||
    Boolean(fleetType);
  if (!isFrangko) return 0;
  const ft = (fleetType || 'PICKUP_RET').toUpperCase();
  if (ft.includes('DUMP') || ft.includes('TRK')) return 325000;
  if (ft.includes('ENGKEL') || ft.includes('TRUCK') || ft.includes('ENG')) return 175000;
  return 85000;
}

export function calculateBuildingLoadingFeeTotal(
  items: Array<{ product?: Product | null; quantity?: number; qty?: number }>
): number {
  if (!Array.isArray(items) || items.length === 0) return 0;
  return items.reduce((sum, it) => {
    const p = it.product;
    if (!p || !isBuildingMaterialProduct(p)) return sum;
    const feePerUnit = Math.max(0, Number(p.defaultLoadingFee) || 0);
    if (feePerUnit <= 0) return sum;
    const qty = Math.max(0, Number(it.quantity ?? it.qty) || 0);
    return sum + Math.round(feePerUnit * qty);
  }, 0);
}

export function isBuildingMaterialProduct(p?: Product | null): boolean {
  if (!p) return false;
  const cat = (p.category || '').toUpperCase();
  return (
    p.businessModel === 'building' ||
    (p.id ? p.id.startsWith('MAT-') : false) ||
    Boolean(p.materialNature) ||
    cat.includes('PASIR') ||
    cat.includes('SEMEN') ||
    cat.includes('BATA') ||
    cat.includes('KAYU') ||
    cat.includes('PERPIPAAN') ||
    cat.includes('BESI') ||
    cat.includes('BAJA') ||
    cat.includes('PAKU') ||
    cat.includes('PERKAKAS') ||
    cat.includes('CAT')
  );
}

export function getBuildingTierConfig(p: Product): BuildingTierConfig {
  const tier1Price = Math.max(0, Number(p.price_retail ?? p.sell_price ?? p.sellingPrice ?? 0) || 0);
  const unitLower = (p.unit || '').toLowerCase();
  const isBulk =
    p.materialNature === 'BULK_CURAH' ||
    unitLower.includes('m³') ||
    unitLower.includes('m3') ||
    unitLower.includes('kubik') ||
    unitLower.includes('ret');

  const defaultT2Min = isBulk ? 3 : 10;
  const defaultT3Min = isBulk ? 6 : 40;

  const tier2MinQty = Math.max(2, Number(p.tier2MinQty) || defaultT2Min);
  const rawT3Min = Number(p.tier3MinQty) || defaultT3Min;
  const tier3MinQty = Math.max(tier2MinQty + 1, rawT3Min);

  const rawT2Price = Number(p.tier2Price ?? p.price_member ?? p.memberPrice);
  const tier2Price =
    rawT2Price > 0 && rawT2Price <= tier1Price
      ? rawT2Price
      : Math.max(0, Math.round(tier1Price * 0.94));

  const rawT3Price = Number(p.tier3Price ?? p.price_wholesale ?? p.wholesalePrice);
  const tier3Price =
    rawT3Price > 0 && rawT3Price <= tier2Price
      ? rawT3Price
      : Math.max(0, Math.round(tier1Price * 0.88));

  return {
    tier1Price,
    tier2Price,
    tier2MinQty,
    tier3Price,
    tier3MinQty,
  };
}

export function resolveBuildingItemTierPricing(params: {
  product: Product;
  quantity: number;
  isContractorMode?: boolean;
  baseUnitPriceOverride?: number;
  unitLabel?: string;
}): BuildingTierResolution {
  const { product, quantity, isContractorMode = false, baseUnitPriceOverride, unitLabel } = params;
  const cfg = getBuildingTierConfig(product);
  const qty = Math.max(0, Number(quantity) || 0);
  const unit = unitLabel || product.unit || 'Unit';

  const base1 =
    baseUnitPriceOverride !== undefined && baseUnitPriceOverride > 0
      ? baseUnitPriceOverride
      : cfg.tier1Price;

  const isOverridden =
    baseUnitPriceOverride !== undefined &&
    baseUnitPriceOverride > 0 &&
    cfg.tier1Price > 0 &&
    baseUnitPriceOverride !== cfg.tier1Price;

  const ratio2 = cfg.tier1Price > 0 ? cfg.tier2Price / cfg.tier1Price : 0.94;
  const ratio3 = cfg.tier1Price > 0 ? cfg.tier3Price / cfg.tier1Price : 0.88;

  const effectiveT2Price = isOverridden
    ? Math.round((base1 * ratio2) / 100) * 100
    : cfg.tier2Price;
  const effectiveT3Price = isOverridden
    ? Math.round((base1 * ratio3) / 100) * 100
    : cfg.tier3Price;

  if (isContractorMode || qty >= cfg.tier3MinQty) {
    const savingsPerUnit = Math.max(0, base1 - effectiveT3Price);
    return {
      tierName: 'KONTRAKTOR',
      tierBadge: 'TIER KONTRAKTOR',
      tierLabel: isContractorMode
        ? 'Tier Kontraktor (Mode Proyek)'
        : `Tier Kontraktor (≥${cfg.tier3MinQty} ${unit})`,
      tier1UnitPrice: base1,
      activeUnitPrice: effectiveT3Price,
      savingsPerUnit,
      totalSavings: Math.round(savingsPerUnit * qty),
      minQtyApplied: isContractorMode ? 1 : cfg.tier3MinQty,
    };
  }

  if (qty >= cfg.tier2MinQty) {
    const savingsPerUnit = Math.max(0, base1 - effectiveT2Price);
    const neededForT3 = Math.max(0, Number((cfg.tier3MinQty - qty).toFixed(2)));
    return {
      tierName: 'TUKANG',
      tierBadge: 'TIER TUKANG',
      tierLabel: `Tier Tukang (≥${cfg.tier2MinQty} ${unit})`,
      tier1UnitPrice: base1,
      activeUnitPrice: effectiveT2Price,
      savingsPerUnit,
      totalSavings: Math.round(savingsPerUnit * qty),
      minQtyApplied: cfg.tier2MinQty,
      nextTierHint:
        neededForT3 > 0
          ? `+${neededForT3} ${unit} lagi → Tier Kontraktor (Rp ${effectiveT3Price.toLocaleString('id-ID')})`
          : undefined,
    };
  }

  const neededForT2 = Math.max(0, Number((cfg.tier2MinQty - qty).toFixed(2)));
  return {
    tierName: 'ECERAN',
    tierBadge: '',
    tierLabel: 'Eceran Umum (Tier 1)',
    tier1UnitPrice: base1,
    activeUnitPrice: base1,
    savingsPerUnit: 0,
    totalSavings: 0,
    minQtyApplied: 1,
    nextTierHint:
      neededForT2 > 0
        ? `≥${cfg.tier2MinQty} ${unit}: Rp ${effectiveT2Price.toLocaleString('id-ID')} (Tukang) • ≥${cfg.tier3MinQty}: Rp ${effectiveT3Price.toLocaleString('id-ID')} (Kontraktor)`
        : undefined,
  };
}
