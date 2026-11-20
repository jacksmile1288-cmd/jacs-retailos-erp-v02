import { CanonicalBusinessSector, CartItem, ServiceStylistMaster } from '../types';

export interface AdaptiveCoaMeta {
  inventoryCode: string;
  inventoryName: string;
  revenueCode: string;
  revenueName: string;
  cogsCode: string;
  cogsName: string;
  taxCode: string;
  taxName: string;
  commissionExpenseCode: string;
  commissionExpenseName: string;
  commissionPayableCode: string;
  commissionPayableName: string;
}

/**
 * Skema Akun (COA) Adaptif Multi-Sektor berdasarkan activeSector (Single Source of Truth)
 * - 1-10201: Persediaan Bahan Baku Dapur & Topping (FNB) | Persediaan Bahan Habis Pakai Layanan (SERVICE) | Persediaan Barang Dagang / Material (lainnya)
 * - 4-10101: Pendapatan Makanan, Minuman & Topping (FNB) | Pendapatan Jasa Layanan & Grooming (SERVICE) | Pendapatan Penjualan (lainnya)
 * - 5-10101: HPP Bahan Baku Menu & Topping BOM (FNB) | Beban Bahan Habis Pakai Jasa (SERVICE) | Harga Pokok Penjualan (HPP) (lainnya)
 * - 2-10301: Hutang Pajak Restoran (PB1) (FNB) | PPN Keluaran (lainnya)
 * - 6-10101: Beban Komisi Karyawan
 * - 2-10201: Hutang Komisi Karyawan
 */
export function getAdaptiveCoaMeta(activeSector: CanonicalBusinessSector): AdaptiveCoaMeta {
  if (activeSector === 'FNB') {
    return {
      inventoryCode: '1-10201',
      inventoryName: 'Persediaan Bahan Baku Dapur & Topping',
      revenueCode: '4-10101',
      revenueName: 'Pendapatan Makanan, Minuman & Topping',
      cogsCode: '5-10101',
      cogsName: 'HPP Bahan Baku Menu & Topping BOM',
      taxCode: '2-10301',
      taxName: 'Hutang Pajak Restoran (PB1)',
      commissionExpenseCode: '6-10101',
      commissionExpenseName: 'Beban Komisi Karyawan',
      commissionPayableCode: '2-10201',
      commissionPayableName: 'Hutang Komisi Karyawan',
    };
  }

  if (activeSector === 'SERVICE') {
    return {
      inventoryCode: '1-10201',
      inventoryName: 'Persediaan Bahan Habis Pakai Layanan',
      revenueCode: '4-10101',
      revenueName: 'Pendapatan Jasa Layanan & Grooming',
      cogsCode: '5-10101',
      cogsName: 'Beban Bahan Habis Pakai Jasa',
      taxCode: '2-10301',
      taxName: 'PPN Keluaran',
      commissionExpenseCode: '6-10101',
      commissionExpenseName: 'Beban Komisi Karyawan',
      commissionPayableCode: '2-10201',
      commissionPayableName: 'Hutang Komisi Karyawan',
    };
  }

  return {
    inventoryCode: '1-10201',
    inventoryName: 'Persediaan Barang Dagang / Material',
    revenueCode: '4-10101',
    revenueName: 'Pendapatan Penjualan',
    cogsCode: '5-10101',
    cogsName: 'Harga Pokok Penjualan (HPP)',
    taxCode: '2-10301',
    taxName: 'PPN Keluaran',
    commissionExpenseCode: '6-10101',
    commissionExpenseName: 'Beban Komisi Karyawan',
    commissionPayableCode: '2-10201',
    commissionPayableName: 'Hutang Komisi Karyawan',
  };
}

/**
 * Mengembalikan map kode akun -> nama adaptif untuk tampilan Laporan Keuangan (Laba Rugi, Neraca Saldo, Jurnal).
 * Mencakup baik kode kanonik baru (1-10201, 4-10101, 5-10101, 2-10301, 6-10101, 2-10201)
 * maupun alias historis (1-10501, 4-10001, 5-10001) agar seluruh jurnal tampil konsisten per sektor aktif.
 */
export function buildAdaptiveAccountNameMap(activeSector: CanonicalBusinessSector): Record<string, string> {
  const coa = getAdaptiveCoaMeta(activeSector);
  return {
    '1-10101': 'Kas Tunai / Kas Kasir',
    '1-10102': 'Bank / QRIS Operasional',
    '1-10105': 'Piutang Usaha / Pelanggan (AR)',
    '1-10201': coa.inventoryName,
    '1-10501': coa.inventoryName,
    '2-10201': coa.commissionPayableName,
    '2-10301': coa.taxName,
    '4-10101': coa.revenueName,
    '4-10001': coa.revenueName,
    '5-10101': coa.cogsName,
    '5-10001': coa.cogsName,
    '6-10101': coa.commissionExpenseName,
  };
}

/**
 * Standarisasi kode akun kanonik lintas sektor:
 * - Pendapatan utama -> 4-10101 (konsolidasi dari 4-10001)
 * - HPP / Beban Pokok utama -> 5-10101 (konsolidasi dari 5-10001)
 * - Persediaan utama -> 1-10201 (konsolidasi dari 1-10501)
 * - Hutang Dagang AP -> 2-10101 (konsolidasi dari 2-10001)
 */
export function normalizeCanonicalAccountCode(code: string | undefined | null): string {
  const trimmed = String(code || '').trim();
  if (!trimmed) return '';
  if (trimmed === '4-10001') return '4-10101';
  if (trimmed === '5-10001') return '5-10101';
  if (trimmed === '1-10501') return '1-10201';
  if (trimmed === '2-10001') return '2-10101';
  return trimmed;
}

export interface EntityTaggedLedgerRecord {
  id?: string;
  transaction_id?: string;
  reference?: string;
  description?: string;
  category?: string;
  type?: string;
  account_target?: string;
  lines?: Array<{ accountCode?: string; accountName?: string }>;
  businessSector?: CanonicalBusinessSector | string;
  businessName?: string;
  isDemoSeed?: boolean;
}

const LEGACY_RETAIL_SEED_IDS = new Set([
  'FIN-REV-001',
  'FIN-REV-002',
  'FIN-HPP-001',
  'FIN-HPP-002',
  'INV-2026-0001',
  'INV-2026-0002',
  'JV-PROMO-SEED-TPR',
  'JV-PROMO-SEED-FEFO',
  'JV-PROMO-SEED-STORE',
  'CLM-SEED-001',
  'CLM-SEED-002',
]);

/**
 * Mendeteksi apakah record adalah seed demo bawaan Ritel (baik bertanda isDemoSeed maupun dari localStorage lama).
 */
export function isLegacyDemoSeedEntry(entry: EntityTaggedLedgerRecord): boolean {
  if (!entry) return false;
  if (entry.isDemoSeed) return true;
  const idUpper = String(entry.id || entry.transaction_id || '').toUpperCase();
  const refUpper = String(entry.reference || '').toUpperCase();
  if (LEGACY_RETAIL_SEED_IDS.has(idUpper) || LEGACY_RETAIL_SEED_IDS.has(refUpper)) return true;
  if (idUpper.startsWith('JV-PROMO-SEED-') || idUpper.startsWith('CLM-SEED-')) return true;
  if (refUpper.startsWith('INV-2026-PROMO-')) return true;
  return false;
}

/**
 * Mengisolasi transaksi penjualan, jurnal akuntansi, dan mutasi kas agar hanya menampilkan
 * entri milik entitas & sektor usaha aktif (atau entri netral sistem yang tidak terikat seed sektor lain).
 */
export function belongsToActiveEntity(
  entry: EntityTaggedLedgerRecord,
  activeSector: CanonicalBusinessSector,
  activeBusinessName?: string
): boolean {
  if (!entry) return false;
  const idUpper = String(entry.id || entry.transaction_id || '').toUpperCase();
  const refUpper = String(entry.reference || '').toUpperCase();
  const catUpper = String(entry.category || '').toUpperCase();
  const typeUpper = String(entry.type || '').toUpperCase();
  const targetCode = String(entry.account_target || '').split('·')[0].trim();

  // Entri saldo awal modal dasar (bukan demo penjualan) diperbolehkan kecuali secara eksplisit milik sektor lain
  const isOpeningBalance =
    idUpper.startsWith('FIN-OPENING') ||
    refUpper.startsWith('CAP-') ||
    catUpper.includes('MODAL KAS') ||
    catUpper.includes('SALDO AWAL');

  if (isOpeningBalance) {
    if (entry.businessSector && entry.businessSector !== activeSector) return false;
    return true;
  }

  // 1. Seed demo bawaan Ritel tidak boleh bocor ke FNB / SERVICE / FASHION / BUILDING
  if (isLegacyDemoSeedEntry(entry)) {
    const seedSector = (entry.businessSector as CanonicalBusinessSector) || 'RETAIL';
    if (seedSector !== activeSector) return false;
    return true;
  }

  // 2. Jika record sudah ditag secara eksplisit dengan businessSector
  if (entry.businessSector) {
    if (entry.businessSector !== activeSector) return false;
    const normEntryBiz = String(entry.businessName || '').trim().toLowerCase();
    const normActiveBiz = String(activeBusinessName || '').trim().toLowerCase();
    if (normEntryBiz && normActiveBiz && normEntryBiz !== normActiveBiz) {
      return false;
    }
    return true;
  }

  // 3. Fallback cerdas untuk record lama (belum bertag businessSector) berdasarkan kode akun / tipe khusus sektor
  const lineCodes = new Set<string>(
    (entry.lines || []).map((l) => String(l.accountCode || '').trim()).filter(Boolean)
  );
  if (targetCode) lineCodes.add(targetCode);

  if (
    activeSector !== 'FASHION' &&
    (typeUpper === 'POS_FASHION' ||
      idUpper.startsWith('JV-FASH-') ||
      idUpper.startsWith('FIN-FASH-') ||
      lineCodes.has('4-10004'))
  ) {
    return false;
  }

  if (
    activeSector !== 'BUILDING' &&
    (idUpper.startsWith('JV-BLD-') ||
      idUpper.startsWith('FIN-KULI-') ||
      idUpper.startsWith('FIN-FRANGKO-') ||
      lineCodes.has('4-10102') ||
      lineCodes.has('5-10205') ||
      lineCodes.has('5-10302'))
  ) {
    return false;
  }

  if (
    activeSector !== 'SERVICE' &&
    (typeUpper === 'POS_LAUNDRY' ||
      typeUpper === 'POS_SERVICE' ||
      idUpper.startsWith('JV-LND-') ||
      idUpper.startsWith('FIN-LND-') ||
      idUpper.startsWith('FIN-SVC-REV-') ||
      lineCodes.has('4-10105'))
  ) {
    return false;
  }

  if (
    activeSector !== 'RETAIL' &&
    (typeUpper === 'PROMO_FEFO_EXP' ||
      typeUpper === 'PROMO_SUPPLIER_TPR' ||
      lineCodes.has('5-10201') ||
      lineCodes.has('1-10305'))
  ) {
    return false;
  }

  return true;
}

/**
 * Menentukan apakah suatu kode akun relevan ditampilkan pada daftar COA sektor aktif saat bersaldo Rp 0.
 * Akun spesifik sektor lain disembunyikan bila bersaldo Rp 0 agar laporan Laba Rugi & Neraca Saldo bersih.
 */
export function isSectorRelevantAccount(
  code: string,
  activeSector: CanonicalBusinessSector,
  primaryBusinessModel?: string
): boolean {
  const norm = normalizeCanonicalAccountCode(code);
  const modelUpper = String(primaryBusinessModel || '').toUpperCase();

  // Akun spesifik Fashion
  if (norm === '4-10004') {
    return activeSector === 'FASHION';
  }
  // Akun spesifik Laundry (disembunyikan pada Barbershop, F&B, Retail, dll. bila Rp 0)
  if (norm === '4-10105') {
    return activeSector === 'SERVICE' && modelUpper === 'LAUNDRY';
  }
  // Akun spesifik Bahan Bangunan / Depo Material
  if (norm === '4-10102' || norm === '5-10205' || norm === '5-10302' || norm === '2-10401') {
    return activeSector === 'BUILDING';
  }
  // Akun spesifik Ritel (FEFO Clearance & Piutang Rebate Supplier)
  if (norm === '5-10201' || norm === '1-10305') {
    return activeSector === 'RETAIL';
  }
  // Akun Beban & Hutang Komisi Karyawan (relevan untuk Service & Fashion)
  if (norm === '6-10101' || norm === '2-10201') {
    return activeSector === 'SERVICE' || activeSector === 'FASHION';
  }
  return true;
}

export interface ServiceCommissionBreakdownItem {
  stylistId: string;
  stylistName: string;
  role?: string;
  commissionRate: number;
  eligibleRevenue: number;
  commissionAmount: number;
  itemNames: string[];
}

export interface ServiceCommissionSummary {
  totalCommission: number;
  totalEligibleServiceRevenue: number;
  retailExcludedRevenue: number;
  breakdown: ServiceCommissionBreakdownItem[];
}

/**
 * Menghitung komisi stylist/kapster secara akurat per item keranjang:
 * - Item bertipe SERVICE (jasa) dihitung berdasarkan rate stylist per-item (atau stylist utama transaksi).
 * - Item bertipe RETAIL (contoh: PRD-BRB-007 Clay Pomade) TIDAK dikenakan komisi kecuali stylist memiliki retailCommissionRate > 0.
 */
export function calculateServiceCommissionBreakdown(
  items: CartItem[],
  defaultStylist: { id?: string; name?: string; commissionRate?: number } | null | undefined,
  allStylists: ServiceStylistMaster[] = []
): ServiceCommissionSummary {
  const findStylistRecord = (id?: string, name?: string): ServiceStylistMaster | undefined => {
    if (id) {
      const byId = allStylists.find((s) => s.id === id);
      if (byId) return byId;
    }
    if (name) {
      const norm = name.trim().toLowerCase();
      const byName = allStylists.find((s) => s.name.trim().toLowerCase() === norm);
      if (byName) return byName;
    }
    return undefined;
  };

  const defaultRecord = defaultStylist ? findStylistRecord(defaultStylist.id, defaultStylist.name) : undefined;
  const grouped = new Map<string, ServiceCommissionBreakdownItem>();
  let totalCommission = 0;
  let totalEligibleServiceRevenue = 0;
  let retailExcludedRevenue = 0;

  for (const item of items || []) {
    const lineRevenue = Math.max(
      0,
      Math.round(Number(item.subtotal) || (Number(item.product?.sell_price) || 0) * (Number(item.quantity) || 0))
    );
    if (lineRevenue <= 0) continue;

    const prodIdUpper = String(item.product?.id || '').toUpperCase();
    const isRetailSalonItem =
      item.product?.itemType === 'RETAIL' || prodIdUpper.startsWith('PRD-BRB-');
    const isServiceItem =
      !isRetailSalonItem &&
      (item.product?.itemType === 'SERVICE' ||
        prodIdUpper.startsWith('SVC-BRB-') ||
        prodIdUpper.startsWith('SVC-LND-') ||
        prodIdUpper.startsWith('SLN-') ||
        String(item.product?.businessModel || '').toLowerCase() === 'salon' ||
        String(item.product?.businessModel || '').toLowerCase() === 'laundry');

    const itemStylistRecord = findStylistRecord(item.stylistId, item.stylistName) || defaultRecord;
    const resolvedId = item.stylistId || itemStylistRecord?.id || defaultStylist?.id || '';
    const resolvedName = (item.stylistName || itemStylistRecord?.name || defaultStylist?.name || '').trim();

    if (!resolvedName) {
      if (isRetailSalonItem) retailExcludedRevenue += lineRevenue;
      continue;
    }

    if (isRetailSalonItem) {
      const retailRate = Number(itemStylistRecord?.retailCommissionRate || 0);
      if (retailRate <= 0) {
        retailExcludedRevenue += lineRevenue;
        continue;
      }
      const comm = Math.round((lineRevenue * retailRate) / 100);
      if (comm <= 0) {
        retailExcludedRevenue += lineRevenue;
        continue;
      }
      const key = `${resolvedId || resolvedName}::RETAIL`;
      const prev = grouped.get(key);
      if (prev) {
        prev.eligibleRevenue += lineRevenue;
        prev.commissionAmount += comm;
        prev.itemNames.push(item.product.name);
      } else {
        grouped.set(key, {
          stylistId: resolvedId || resolvedName,
          stylistName: resolvedName,
          role: itemStylistRecord?.role,
          commissionRate: retailRate,
          eligibleRevenue: lineRevenue,
          commissionAmount: comm,
          itemNames: [item.product.name],
        });
      }
      totalCommission += comm;
      totalEligibleServiceRevenue += lineRevenue;
      continue;
    }

    if (!isServiceItem) continue;

    const rate =
      typeof item.stylistCommissionRate === 'number' && item.stylistCommissionRate > 0
        ? item.stylistCommissionRate
        : itemStylistRecord?.commissionRate ??
          defaultStylist?.commissionRate ??
          Number(item.product?.staffCommission || 0);

    if (rate <= 0) continue;

    const comm = Math.round((lineRevenue * rate) / 100);
    if (comm <= 0) continue;

    const key = resolvedId || resolvedName;
    const prev = grouped.get(key);
    if (prev) {
      prev.eligibleRevenue += lineRevenue;
      prev.commissionAmount += comm;
      prev.itemNames.push(item.product.name);
    } else {
      grouped.set(key, {
        stylistId: resolvedId || resolvedName,
        stylistName: resolvedName,
        role: itemStylistRecord?.role,
        commissionRate: rate,
        eligibleRevenue: lineRevenue,
        commissionAmount: comm,
        itemNames: [item.product.name],
      });
    }
    totalCommission += comm;
    totalEligibleServiceRevenue += lineRevenue;
  }

  return {
    totalCommission,
    totalEligibleServiceRevenue,
    retailExcludedRevenue,
    breakdown: Array.from(grouped.values()),
  };
}
