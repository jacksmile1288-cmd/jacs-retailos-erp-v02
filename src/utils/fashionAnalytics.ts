import {
  BusinessDomainConfig,
  CartItem,
  Employee,
  FinanceEntry,
  Product,
  Sale,
  StockMutation,
} from '../types';
import { FASHION_APPAREL_PRODUCTS } from '../data/industryTerminalProducts';
import { resolveCanonicalSector } from './businessDomainConfig';

export interface FashionFinanceSummary {
  isActive: boolean;
  totalSalesCount: number;
  grossRevenue: number;
  discountTotal: number;
  clearanceDiscount: number;
  bundleDiscount: number;
  manualDiscount: number;
  netRevenue: number;
  journalContraDiscountTotal: number;
  zeroDiffExchangeCount: number;
  paidExchangeCount: number;
  paidExchangeDiffTotal: number;
}

export interface FashionAdvisorCommissionSummary {
  employeeId: string;
  employeeName: string;
  nip: string;
  role: string;
  department: string;
  trxCount: number;
  itemsSoldQty: number;
  grossSalesTotal: number;
  discountGivenTotal: number;
  netSalesTotal: number;
  commissionRatePercent: number;
  totalCommission: number;
  sharePercent: number;
}

export interface FashionVariantPerformanceRow {
  key: string;
  productId: string;
  productName: string;
  category: string;
  size: string;
  color: string;
  sellPrice: number;
  currentStock: number;
  soldQty: number;
  soldRevenue: number;
  exchangeInQty: number;
  exchangeOutQty: number;
  turnoverPct: number;
}

export interface FashionExecutiveAnalytics {
  totalFashionOrders: number;
  totalUnitsSold: number;
  grossSalesValue: number;
  totalDiscountValue: number;
  netSalesValue: number;
  normalPriceRevenue: number;
  promoDiscountRevenue: number;
  normalPriceUnits: number;
  promoDiscountUnits: number;
  normalRevenuePct: number;
  promoRevenuePct: number;
  normalUnitPct: number;
  promoUnitPct: number;
  avgDiscountPct: number;
  zeroDiffExchangeCount: number;
  paidExchangeCount: number;
  advisorLeaderboard: FashionAdvisorCommissionSummary[];
  advisorAttributedNetSales: number;
  advisorTotalCommission: number;
  unassignedNetSales: number;
  fastMovingVariants: FashionVariantPerformanceRow[];
  slowMovingVariants: FashionVariantPerformanceRow[];
  allVariantRows: FashionVariantPerformanceRow[];
  sizeSummary: Array<{ size: string; soldQty: number; currentStock: number }>;
  colorSummary: Array<{ color: string; soldQty: number; currentStock: number }>;
  totalVariantStock: number;
}

const matchesPeriodFilter = (isoDate: string, period?: string): boolean => {
  if (!period || period === 'ALL') return true;
  try {
    const parts = period.split('-');
    const targetYear = Number(parts[0]);
    const targetMonth = Number(parts[1]);
    if (!targetYear || !targetMonth) return true;
    const d = new Date(isoDate || Date.now());
    return d.getFullYear() === targetYear && d.getMonth() + 1 === targetMonth;
  } catch {
    return true;
  }
};

export const isFashionProduct = (product?: Partial<Product> | null): boolean => {
  if (!product) return false;
  const idUpper = String(product.id || '').toUpperCase();
  const bm = String(product.businessModel || '').toLowerCase();
  const catLower = String(product.category || '').toLowerCase();
  return (
    bm === 'fashion' ||
    idUpper.startsWith('FASH-') ||
    (Array.isArray(product.variantMatrix) && product.variantMatrix.length > 0) ||
    Boolean(product.fashionPromo) ||
    ['gamis', 'hijab', 'kemeja', 'kulot', 'apparel', 'fashion', 'butik', 'outerwear'].some((kw) =>
      catLower.includes(kw)
    )
  );
};

export const isZeroDiffFashionExchange = (sale?: Partial<Sale> | null): boolean => {
  if (!sale) return false;
  return Boolean(sale.isFashionExchange) && Math.round(Number(sale.total_amount) || 0) <= 0;
};

export const isFashionSale = (sale?: Partial<Sale> | null): boolean => {
  if (!sale) return false;
  if (sale.isFashionExchange || sale.fashionAdvisorId || sale.fashionAdvisorName) return true;
  const bType = String(sale.businessType || sale.business_type || sale.terminal_name || '').toLowerCase();
  if (bType.includes('fashion') || bType.includes('butik') || bType.includes('apparel')) return true;
  if (Array.isArray(sale.items)) {
    return sale.items.some(
      (it: any) =>
        Boolean(it?.selectedFashionSize) ||
        Boolean(it?.selectedFashionColor) ||
        isFashionProduct(it?.product)
    );
  }
  return false;
};

export const isFashionDomainActive = (
  domainConfig?: BusinessDomainConfig | null,
  businessProfile?: { category?: string; businessType?: string; activeSector?: string; domainConfig?: BusinessDomainConfig } | null,
  _sales?: Sale[],
  _finance?: FinanceEntry[]
): boolean => {
  // Strict Domain & Sector Gatekeeper:
  // Hanya aktif jika sektor kanonik aktif adalah FASHION (atau FASHION_BUTIK diaktifkan eksplisit di Mode Hybrid).
  // Tidak pernah membocorkan widget Fashion akibat data transaksi/keuangan historis saat sektor lain aktif.
  const canonicalSector = resolveCanonicalSector(domainConfig || (businessProfile as any));
  if (canonicalSector === 'FASHION') {
    return true;
  }
  if (
    domainConfig?.isHybridMultiUnit &&
    Array.isArray(domainConfig.enabledHybridModels) &&
    domainConfig.enabledHybridModels.includes('FASHION_BUTIK')
  ) {
    return true;
  }
  return false;
};

export const isFashionAdvisorEmployee = (emp?: Partial<Employee> | null): boolean => {
  if (!emp) return false;
  const text = `${emp.role || ''} ${emp.department || ''} ${emp.division || ''}`.toLowerCase();
  return (
    text.includes('fashion') ||
    text.includes('advisor') ||
    text.includes('pramuniaga') ||
    text.includes('butik') ||
    text.includes('stylist') ||
    typeof emp.fashionCommissionRate === 'number'
  );
};

export const resolveSaleDiscountTotal = (sale: Partial<Sale>): number => {
  const itemSavings = (sale.items || []).reduce((acc, it: any) => {
    const lineSav = Number(it?.promoSavings ?? ((Number(it?.itemDiscount) || 0) * (Number(it?.quantity) || 1))) || 0;
    return acc + Math.max(0, Math.round(lineSav));
  }, 0);
  const voucherDisc = Math.max(0, Math.round(Number(sale.cartVoucherDiscount) || 0));
  const explicitDisc = Math.max(0, Math.round(Number(sale.discount) || 0));
  const promoTot = Math.max(0, Math.round(Number(sale.promoSavingsTotal) || 0));
  return Math.max(explicitDisc, promoTot + voucherDisc, itemSavings + voucherDisc);
};

export const calculateFashionFinanceSummary = (
  sales: Sale[] = [],
  financeEntries: FinanceEntry[] = [],
  domainConfig?: BusinessDomainConfig | null,
  businessProfile?: { category?: string } | null
): FashionFinanceSummary => {
  const isActive = isFashionDomainActive(domainConfig, businessProfile, sales, financeEntries);

  let totalSalesCount = 0;
  let grossRevenue = 0;
  let discountTotal = 0;
  let clearanceDiscount = 0;
  let bundleDiscount = 0;
  let manualDiscount = 0;
  let netRevenue = 0;
  let zeroDiffExchangeCount = 0;
  let paidExchangeCount = 0;
  let paidExchangeDiffTotal = 0;

  for (const sale of sales || []) {
    const st = String(sale.status || '').toUpperCase();
    if (st === 'VOID' || st === 'VOIDED' || st === 'CANCELLED') continue;
    if (!isFashionSale(sale)) continue;

    if (sale.isFashionExchange) {
      const diff = Math.round(Number(sale.total_amount) || 0);
      if (diff <= 0) {
        zeroDiffExchangeCount += 1;
      } else {
        paidExchangeCount += 1;
        paidExchangeDiffTotal += diff;
        netRevenue += diff;
        grossRevenue += diff;
      }
      continue;
    }

    totalSalesCount += 1;
    const netAmt = Math.max(0, Math.round(Number(sale.total_amount) || 0));
    const discAmt = resolveSaleDiscountTotal(sale);
    netRevenue += netAmt;
    discountTotal += discAmt;
    grossRevenue += netAmt + discAmt;

    let attributedItemDisc = 0;
    for (const item of sale.items || []) {
      const anyIt = item as any;
      const lineSav = Math.max(
        0,
        Math.round(Number(anyIt?.promoSavings ?? ((Number(anyIt?.itemDiscount) || 0) * (Number(anyIt?.quantity) || 1))) || 0)
      );
      if (lineSav <= 0) continue;
      attributedItemDisc += lineSav;

      const pName = String(anyIt?.promoName || '').toLowerCase();
      const src = String(anyIt?.promoSourceType || '');
      if (pName.includes('manual') || pName.includes('custom')) {
        manualDiscount += lineSav;
      } else if (src === 'STORE_BND' || pName.includes('bundle') || pName.includes('mix') || pName.includes('paket')) {
        bundleDiscount += lineSav;
      } else {
        clearanceDiscount += lineSav;
      }
    }

    const voucherOrRemainingDisc = Math.max(
      Number(sale.cartVoucherDiscount) || 0,
      Math.max(0, discAmt - attributedItemDisc)
    );
    manualDiscount += voucherOrRemainingDisc;
  }

  const journalContraDiscountTotal = (financeEntries || [])
    .filter((f) => {
      const target = (f.account_target || '').trim();
      const catUpper = (f.category || '').toUpperCase();
      return (
        (f.id || '').startsWith('FIN-FASH-DISC-') ||
        target.startsWith('4-10004') ||
        catUpper.includes('POTONGAN & DISKON PENJUALAN FASHION')
      );
    })
    .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

  return {
    isActive,
    totalSalesCount,
    grossRevenue,
    discountTotal,
    clearanceDiscount,
    bundleDiscount,
    manualDiscount,
    netRevenue,
    journalContraDiscountTotal,
    zeroDiffExchangeCount,
    paidExchangeCount,
    paidExchangeDiffTotal,
  };
};

export const calculateFashionAdvisorCommissions = (
  employees: Employee[] = [],
  sales: Sale[] = [],
  period?: string
): {
  byEmployeeId: Record<string, FashionAdvisorCommissionSummary>;
  list: FashionAdvisorCommissionSummary[];
  totalCommission: number;
  totalNetSales: number;
  totalTrxCount: number;
  recentAdvisorSales: Sale[];
} => {
  const byEmployeeId: Record<string, FashionAdvisorCommissionSummary> = {};

  for (const emp of employees) {
    byEmployeeId[emp.id] = {
      employeeId: emp.id,
      employeeName: emp.name,
      nip: emp.nip,
      role: emp.role,
      department: emp.department,
      trxCount: 0,
      itemsSoldQty: 0,
      grossSalesTotal: 0,
      discountGivenTotal: 0,
      netSalesTotal: 0,
      commissionRatePercent: typeof emp.fashionCommissionRate === 'number' ? emp.fashionCommissionRate : 2,
      totalCommission: 0,
      sharePercent: 0,
    };
  }

  const resolveAdvisor = (id?: string, name?: string): FashionAdvisorCommissionSummary | null => {
    if (id && byEmployeeId[id]) return byEmployeeId[id];
    if (name) {
      const lower = name.trim().toLowerCase();
      const matched = Object.values(byEmployeeId).find(
        (s) => s.employeeName.trim().toLowerCase() === lower
      );
      if (matched) return matched;
    }
    return null;
  };

  let totalFashionNetSalesAll = 0;
  let totalTrxCount = 0;
  const recentAdvisorSales: Sale[] = [];

  for (const sale of sales || []) {
    const st = String(sale.status || '').toUpperCase();
    if (st === 'VOID' || st === 'VOIDED' || st === 'CANCELLED') continue;
    if (!matchesPeriodFilter(sale.created_at || sale.date, period)) continue;
    if (!isFashionSale(sale)) continue;
    // Jangan hitung tukar ukuran selisih Rp 0 sebagai penjualan/komisi baru
    if (isZeroDiffFashionExchange(sale)) continue;

    const netAmt = Math.max(0, Math.round(Number(sale.total_amount) || 0));
    const discAmt = sale.isFashionExchange ? 0 : resolveSaleDiscountTotal(sale);
    totalFashionNetSalesAll += netAmt;

    const advisor = resolveAdvisor(sale.fashionAdvisorId, sale.fashionAdvisorName);
    if (!advisor) continue;

    totalTrxCount += 1;
    recentAdvisorSales.push(sale);
    const itemsQty = sale.isFashionExchange
      ? 0
      : (sale.items || []).reduce((acc, it) => acc + Math.max(0, Number(it.quantity) || 0), 0);

    advisor.trxCount += 1;
    advisor.itemsSoldQty += itemsQty;
    advisor.netSalesTotal += netAmt;
    advisor.discountGivenTotal += discAmt;
    advisor.grossSalesTotal += netAmt + discAmt;

    const rate = advisor.commissionRatePercent;
    const commVal =
      typeof sale.fashionAdvisorCommission === 'number' && !sale.isFashionExchange
        ? Math.round(sale.fashionAdvisorCommission)
        : Math.round((netAmt * rate) / 100);
    advisor.totalCommission += commVal;
  }

  const allValues = Object.values(byEmployeeId).map((row) => ({
    ...row,
    sharePercent:
      totalFashionNetSalesAll > 0
        ? Math.round((row.netSalesTotal / totalFashionNetSalesAll) * 100)
        : 0,
  }));

  allValues.forEach((row) => {
    byEmployeeId[row.employeeId] = row;
  });

  const list = allValues
    .filter(
      (row) =>
        row.trxCount > 0 ||
        row.totalCommission > 0 ||
        isFashionAdvisorEmployee(employees.find((e) => e.id === row.employeeId))
    )
    .sort((a, b) => b.netSalesTotal - a.netSalesTotal || b.trxCount - a.trxCount);

  const totalCommission = allValues.reduce((acc, s) => acc + s.totalCommission, 0);
  const totalNetSales = allValues.reduce((acc, s) => acc + s.netSalesTotal, 0);

  return {
    byEmployeeId,
    list,
    totalCommission,
    totalNetSales,
    totalTrxCount,
    recentAdvisorSales: recentAdvisorSales.slice(0, 12),
  };
};

const extractVariantFromCartItem = (
  item: CartItem
): { size: string; color: string } => {
  const anyIt = item as any;
  let size = String(anyIt?.selectedFashionSize || '').trim();
  let color = String(anyIt?.selectedFashionColor || '').trim();
  if ((!size || !color) && item.modifiers?.variant) {
    const parts = String(item.modifiers.variant)
      .replace(/^Retur:\s*/i, '')
      .replace(/^Baru:\s*/i, '')
      .split(/[•|/-]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!size && parts[0]) size = parts[0];
    if (!color && parts[1]) color = parts[1];
  }
  return {
    size: size || 'ALL',
    color: color || 'Default',
  };
};

export const calculateFashionExecutiveAnalytics = (
  products: Product[] = [],
  sales: Sale[] = [],
  stockMutations: StockMutation[] = [],
  employees: Employee[] = [],
  period?: string
): FashionExecutiveAnalytics => {
  // 1. Build Fashion product catalog (merge state products + FASHION_APPAREL_PRODUCTS baseline)
  const productMap = new Map<string, Product>();
  FASHION_APPAREL_PRODUCTS.forEach((p) => productMap.set(p.id, p));
  (products || []).forEach((p) => {
    if (isFashionProduct(p)) {
      productMap.set(p.id, p);
    }
  });
  const fashionCatalog = Array.from(productMap.values());

  // 2. Build Size x Color variant cells map
  const variantMap = new Map<string, FashionVariantPerformanceRow>();
  let totalVariantStock = 0;

  for (const prod of fashionCatalog) {
    const matrix = Array.isArray(prod.variantMatrix) ? prod.variantMatrix : [];
    const sellPrice = Number(prod.sell_price ?? prod.sellingPrice ?? prod.price ?? 0) || 0;
    if (matrix.length > 0) {
      for (const cell of matrix) {
        const size = cell.size || 'ALL';
        const color = cell.color || 'Default';
        const key = `${prod.id}__${size.toUpperCase()}__${color.toUpperCase()}`;
        const cellStock = Math.max(0, Number(cell.stock) || 0);
        totalVariantStock += cellStock;
        variantMap.set(key, {
          key,
          productId: prod.id,
          productName: prod.name,
          category: prod.category || 'Fashion & Apparel',
          size,
          color,
          sellPrice,
          currentStock: cellStock,
          soldQty: 0,
          soldRevenue: 0,
          exchangeInQty: 0,
          exchangeOutQty: 0,
          turnoverPct: 0,
        });
      }
    } else {
      const stk = Math.max(0, Number(prod.stock) || 0);
      totalVariantStock += stk;
    }
  }

  // 3. Process sales (Normal vs Promo + Variant Sales + Exchange counters)
  let totalFashionOrders = 0;
  let totalUnitsSold = 0;
  let grossSalesValue = 0;
  let totalDiscountValue = 0;
  let netSalesValue = 0;
  let normalPriceRevenue = 0;
  let promoDiscountRevenue = 0;
  let normalPriceUnits = 0;
  let promoDiscountUnits = 0;
  let zeroDiffExchangeCount = 0;
  let paidExchangeCount = 0;

  for (const sale of sales || []) {
    const st = String(sale.status || '').toUpperCase();
    if (st === 'VOID' || st === 'VOIDED' || st === 'CANCELLED') continue;
    if (!matchesPeriodFilter(sale.created_at || sale.date, period)) continue;
    if (!isFashionSale(sale)) continue;

    if (sale.isFashionExchange) {
      const diff = Math.round(Number(sale.total_amount) || 0);
      if (diff <= 0) zeroDiffExchangeCount += 1;
      else {
        paidExchangeCount += 1;
        netSalesValue += diff;
        grossSalesValue += diff;
      }
      // Track variant exchange in/out from items
      const retItem = sale.items?.[0];
      const repItem = sale.items?.[1];
      if (retItem?.product?.id) {
        const { size, color } = extractVariantFromCartItem(retItem);
        const key = `${retItem.product.id}__${size.toUpperCase()}__${color.toUpperCase()}`;
        const cell = variantMap.get(key);
        if (cell) cell.exchangeInQty += Number(retItem.quantity) || 1;
      }
      if (repItem?.product?.id) {
        const { size, color } = extractVariantFromCartItem(repItem);
        const key = `${repItem.product.id}__${size.toUpperCase()}__${color.toUpperCase()}`;
        const cell = variantMap.get(key);
        if (cell) cell.exchangeOutQty += Number(repItem.quantity) || 1;
      }
      continue;
    }

    totalFashionOrders += 1;
    const saleNet = Math.max(0, Math.round(Number(sale.total_amount) || 0));
    const saleDisc = resolveSaleDiscountTotal(sale);
    const saleGross = saleNet + saleDisc;
    netSalesValue += saleNet;
    totalDiscountValue += saleDisc;
    grossSalesValue += saleGross;

    const cartVoucher = Math.max(0, Math.round(Number(sale.cartVoucherDiscount) || 0));
    const items = sale.items || [];
    const totalSaleItemSub = items.reduce((s, it) => s + Math.max(0, Number(it.subtotal) || 0), 0);

    for (const item of items) {
      const qty = Math.max(0, Number(item.quantity) || 0);
      if (qty <= 0) continue;
      totalUnitsSold += qty;

      const lineSub = Math.max(0, Math.round(Number(item.subtotal) || 0));
      const voucherShare =
        cartVoucher > 0 && totalSaleItemSub > 0
          ? Math.round((lineSub / totalSaleItemSub) * cartVoucher)
          : 0;
      const lineNet = Math.max(0, lineSub - voucherShare);
      const lineItemSav = Math.max(
        0,
        Math.round(Number(item.promoSavings ?? ((Number(item.itemDiscount) || 0) * qty)) || 0)
      );
      const isDiscountedItem = lineItemSav > 0 || cartVoucher > 0;

      if (isDiscountedItem) {
        promoDiscountRevenue += lineNet;
        promoDiscountUnits += qty;
      } else {
        normalPriceRevenue += lineNet;
        normalPriceUnits += qty;
      }

      const prodId = item.product?.id || (item as any).productId;
      if (prodId) {
        const { size, color } = extractVariantFromCartItem(item);
        const key = `${prodId}__${size.toUpperCase()}__${color.toUpperCase()}`;
        let cell = variantMap.get(key);
        if (!cell) {
          cell = {
            key,
            productId: prodId,
            productName: item.product?.name || prodId,
            category: item.product?.category || 'Fashion & Apparel',
            size,
            color,
            sellPrice: Number(item.product?.sell_price ?? item.product?.sellingPrice ?? 0) || 0,
            currentStock: Number(item.product?.stock) || 0,
            soldQty: 0,
            soldRevenue: 0,
            exchangeInQty: 0,
            exchangeOutQty: 0,
            turnoverPct: 0,
          };
          variantMap.set(key, cell);
        }
        cell.soldQty += qty;
        cell.soldRevenue += lineNet;
      }
    }
  }

  // Also capture exchange movements from stockMutations if not already captured via sales
  for (const mut of stockMutations || []) {
    const tUpper = String(mut.type || '').toUpperCase();
    if (!tUpper.includes('TUKAR UKURAN')) continue;
    const match = String(mut.product_name || '').match(/\(([^•)]+)\s*•\s*([^)]+)\)/);
    if (match && mut.product_id) {
      const size = match[1].trim();
      const color = match[2].trim();
      const key = `${mut.product_id}__${size.toUpperCase()}__${color.toUpperCase()}`;
      const cell = variantMap.get(key);
      if (cell && cell.exchangeInQty === 0 && cell.exchangeOutQty === 0) {
        if (tUpper.startsWith('IN')) cell.exchangeInQty += Number(mut.qty) || 1;
        if (tUpper.startsWith('OUT')) cell.exchangeOutQty += Number(mut.qty) || 1;
      }
    }
  }

  const totalAttrRev = normalPriceRevenue + promoDiscountRevenue;
  const normalRevenuePct =
    totalAttrRev > 0 ? Math.round((normalPriceRevenue / totalAttrRev) * 100) : 0;
  const promoRevenuePct =
    totalAttrRev > 0 ? Math.max(0, 100 - normalRevenuePct) : 0;
  const totalAttrUnits = normalPriceUnits + promoDiscountUnits;
  const normalUnitPct =
    totalAttrUnits > 0 ? Math.round((normalPriceUnits / totalAttrUnits) * 100) : 0;
  const promoUnitPct =
    totalAttrUnits > 0 ? Math.max(0, 100 - normalUnitPct) : 0;
  const avgDiscountPct =
    grossSalesValue > 0 ? Number(((totalDiscountValue / grossSalesValue) * 100).toFixed(1)) : 0;

  // 4. Advisor Leaderboard
  const advisorSummary = calculateFashionAdvisorCommissions(employees, sales, period);
  const unassignedNetSales = Math.max(0, netSalesValue - advisorSummary.totalNetSales);

  // 5. Fast-Moving vs Slow-Moving Variants & Size/Color Distribution
  const allVariantRows = Array.from(variantMap.values()).map((row) => {
    const netDemand = row.soldQty + row.exchangeOutQty;
    const denominator = Math.max(1, netDemand + row.currentStock);
    return {
      ...row,
      turnoverPct: Number(((netDemand / denominator) * 100).toFixed(1)),
    };
  });

  const fastMovingVariants = [...allVariantRows]
    .filter((r) => r.soldQty > 0 || r.exchangeOutQty > 0)
    .sort((a, b) => b.soldQty - a.soldQty || b.turnoverPct - a.turnoverPct || b.soldRevenue - a.soldRevenue)
    .slice(0, 8);

  const slowMovingVariants = [...allVariantRows]
    .filter((r) => r.currentStock > 0)
    .sort((a, b) => a.soldQty - b.soldQty || b.currentStock - a.currentStock || a.turnoverPct - b.turnoverPct)
    .slice(0, 8);

  const sizeMap = new Map<string, { size: string; soldQty: number; currentStock: number }>();
  const colorMap = new Map<string, { color: string; soldQty: number; currentStock: number }>();
  for (const row of allVariantRows) {
    const s = sizeMap.get(row.size) || { size: row.size, soldQty: 0, currentStock: 0 };
    s.soldQty += row.soldQty;
    s.currentStock += row.currentStock;
    sizeMap.set(row.size, s);

    const c = colorMap.get(row.color) || { color: row.color, soldQty: 0, currentStock: 0 };
    c.soldQty += row.soldQty;
    c.currentStock += row.currentStock;
    colorMap.set(row.color, c);
  }

  const sizeOrder = ['S', 'M', 'L', 'XL', 'XXL'];
  const sizeSummary = Array.from(sizeMap.values()).sort((a, b) => {
    const ia = sizeOrder.indexOf(a.size.toUpperCase());
    const ib = sizeOrder.indexOf(b.size.toUpperCase());
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return a.size.localeCompare(b.size);
  });

  const colorSummary = Array.from(colorMap.values()).sort(
    (a, b) => b.soldQty - a.soldQty || b.currentStock - a.currentStock
  );

  return {
    totalFashionOrders,
    totalUnitsSold,
    grossSalesValue,
    totalDiscountValue,
    netSalesValue,
    normalPriceRevenue,
    promoDiscountRevenue,
    normalPriceUnits,
    promoDiscountUnits,
    normalRevenuePct,
    promoRevenuePct,
    normalUnitPct,
    promoUnitPct,
    avgDiscountPct,
    zeroDiffExchangeCount,
    paidExchangeCount,
    advisorLeaderboard: advisorSummary.list,
    advisorAttributedNetSales: advisorSummary.totalNetSales,
    advisorTotalCommission: advisorSummary.totalCommission,
    unassignedNetSales,
    fastMovingVariants,
    slowMovingVariants,
    allVariantRows,
    sizeSummary,
    colorSummary,
    totalVariantStock,
  };
};
