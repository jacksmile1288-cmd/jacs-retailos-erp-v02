import { CartItem, FinanceEntry, PaymentMethod, Product, Sale } from '../types';
import {
  calculateTierPrices,
  parseProductAttributes,
  runAISmartMapper,
  toTitleCase
} from '../data/retailCategoryDictionary';
import { CloverConfig, CloverEnvironment, dualBackendSync } from './dualBackendSync';

export type CloverTransportMode = 'DIRECT_REST' | 'GAS_PROXY' | 'SUPABASE_PROXY';

export interface CloverSyncResult {
  success: boolean;
  products: Product[];
  sales: Sale[];
  financeEntries: FinanceEntry[];
  itemsFetched: number;
  ordersFetched: number;
  ordersMapped: number;
  currencyCode: string;
  transportUsed: CloverTransportMode;
  syncedAt: string;
  warnings: string[];
  error?: string;
  corsBlocked?: boolean;
}

const ZERO_DECIMAL_CURRENCIES = new Set(['IDR', 'JPY', 'KRW', 'VND', 'CLP', 'ISK']);

export function getCloverBaseUrl(environment: CloverEnvironment): string {
  return environment === 'SANDBOX' ? 'https://apisandbox.dev.clover.com' : 'https://api.clover.com';
}

function makeInternalBarcodeId(cloverId: string | undefined, idx: number): string {
  const clean = String(cloverId || '')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase();
  const suffix = (clean.slice(-4) || String(idx + 1).padStart(4, '0')).padStart(4, '0');
  return `INT-${suffix}`;
}

function mapCloverPaymentMethod(order: any): PaymentMethod {
  const payment = Array.isArray(order?.payments?.elements) ? order.payments.elements[0] : null;
  const label = String(
    payment?.tender?.label || payment?.tender?.labelKey || order?.paymentState || ''
  ).toLowerCase();

  if (label.includes('qris') || label.includes('qr')) return 'QRIS';
  if (label.includes('debit')) return 'EDC_DEBIT';
  if (label.includes('credit') || label.includes('card') || label.includes('visa') || label.includes('master')) {
    return 'EDC_CREDIT';
  }
  if (label.includes('transfer') || label.includes('bank')) return 'TRANSFER';
  return 'CASH';
}

async function fetchCloverEndpoint(
  url: string,
  apiToken: string
): Promise<{
  ok: boolean;
  status: number;
  data?: any;
  transport: CloverTransportMode;
  error?: string;
  corsBlocked?: boolean;
}> {
  // 1. Coba Direct REST Fetch ke API Clover
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json'
      }
    });

    const data = await res.json().catch(() => null);
    if (res.ok) {
      return {
        ok: true,
        status: res.status,
        data,
        transport: 'DIRECT_REST'
      };
    }

    // Jika error HTTP eksplisit dari server Clover (401/403/404/429), langsung laporkan
    const cloverMsg =
      data?.message || data?.error?.message || `Clover API mengembalikan status HTTP ${res.status}.`;
    return {
      ok: false,
      status: res.status,
      data,
      transport: 'DIRECT_REST',
      error: cloverMsg
    };
  } catch (networkErr: any) {
    // 2. Biasanya TypeError: Failed to fetch menandakan blokir CORS browser atau gangguan jaringan -> coba Proxy Fallback
    const proxyRes = await dualBackendSync.proxyCloverFetch(url, apiToken);
    if (proxyRes.ok && proxyRes.transport) {
      return {
        ok: true,
        status: proxyRes.status,
        data: proxyRes.data,
        transport: proxyRes.transport
      };
    }

    const rawMsg = String(networkErr?.message || '');
    const isLikelyCorsOrNetwork =
      networkErr instanceof TypeError ||
      /failed to fetch|networkerror|cors|load failed/i.test(rawMsg);

    return {
      ok: false,
      status: proxyRes.status || 0,
      transport: proxyRes.transport || 'DIRECT_REST',
      corsBlocked: isLikelyCorsOrNetwork,
      error: proxyRes.transport
        ? `Gagal menarik data via ${proxyRes.transport}: ${proxyRes.error || rawMsg}`
        : isLikelyCorsOrNetwork
        ? 'Permintaan langsung browser ke API Clover diblokir oleh kebijakan CORS atau jaringan.'
        : rawMsg || 'Gagal terhubung ke server Clover.'
    };
  }
}

export async function syncWithCloverPos(config: Pick<CloverConfig, 'merchantId' | 'apiToken' | 'environment'>): Promise<CloverSyncResult> {
  const syncedAt = new Date().toISOString();
  const merchantId = (config.merchantId || '').trim();
  const apiToken = (config.apiToken || '').trim();
  const environment: CloverEnvironment = config.environment === 'SANDBOX' ? 'SANDBOX' : 'PRODUCTION';
  const warnings: string[] = [];

  if (!merchantId) {
    return {
      success: false,
      products: [],
      sales: [],
      financeEntries: [],
      itemsFetched: 0,
      ordersFetched: 0,
      ordersMapped: 0,
      currencyCode: 'IDR',
      transportUsed: 'DIRECT_REST',
      syncedAt,
      warnings,
      error:
        'Clover Merchant ID masih kosong. Masukkan Merchant ID toko Anda (contoh: 13 karakter alfanumerik dari Clover Dashboard) sebelum menguji koneksi.'
    };
  }

  if (!apiToken) {
    return {
      success: false,
      products: [],
      sales: [],
      financeEntries: [],
      itemsFetched: 0,
      ordersFetched: 0,
      ordersMapped: 0,
      currencyCode: 'IDR',
      transportUsed: 'DIRECT_REST',
      syncedAt,
      warnings,
      error: 'Clover Live API Token belum diisi. Masukkan token API aktif (misal clv_live_... atau Private Token).'
    };
  }

  if (!/^[A-Z0-9]{13}$/i.test(merchantId)) {
    warnings.push(
      `Format Merchant ID "${merchantId}" bukan 13 karakter alfanumerik standar Clover. Tetap mencoba menghubungi endpoint Clover...`
    );
  }

  const baseUrl = getCloverBaseUrl(environment);
  const itemsUrl = `${baseUrl}/v3/merchants/${encodeURIComponent(merchantId)}/items?expand=categories,itemStock&limit=500`;
  const ordersUrl = `${baseUrl}/v3/merchants/${encodeURIComponent(merchantId)}/orders?limit=100&expand=lineItems,payments`;
  const propsUrl = `${baseUrl}/v3/merchants/${encodeURIComponent(merchantId)}/properties`;

  // Tarik katalog produk terlebih dahulu untuk validasi koneksi & transport
  const itemsRes = await fetchCloverEndpoint(itemsUrl, apiToken);
  if (!itemsRes.ok) {
    let helpfulError = itemsRes.error || 'Gagal menarik katalog produk dari Clover.';
    if (itemsRes.status === 401 || itemsRes.status === 403) {
      helpfulError = `Otorisasi Clover ditolak (HTTP ${itemsRes.status}). Pastikan API Token valid, belum kedaluwarsa, dan memiliki izin Read Inventory & Orders untuk Merchant ID ${merchantId}.`;
    } else if (itemsRes.status === 404) {
      helpfulError = `Merchant ID "${merchantId}" tidak ditemukan di environment ${environment} (HTTP 404). Periksa kembali Merchant ID atau ubah pilihan Environment (Production vs Sandbox).`;
    } else if (itemsRes.corsBlocked) {
      helpfulError =
        'Koneksi browser langsung ke API Clover diblokir oleh CORS browser. Konfigurasikan GAS Webhook Proxy (action: CLOVER_PROXY_FETCH) atau Supabase Edge Function (clover-proxy) di Tab Integrasi Cloud & Dual-Backend agar permintaan diteruskan melalui server.';
    }

    return {
      success: false,
      products: [],
      sales: [],
      financeEntries: [],
      itemsFetched: 0,
      ordersFetched: 0,
      ordersMapped: 0,
      currencyCode: 'IDR',
      transportUsed: itemsRes.transport,
      syncedAt,
      warnings,
      error: helpfulError,
      corsBlocked: itemsRes.corsBlocked
    };
  }

  // Tarik properti mata uang merchant (best-effort) dan riwayat order secara paralel
  const [propsRes, ordersRes] = await Promise.all([
    fetchCloverEndpoint(propsUrl, apiToken),
    fetchCloverEndpoint(ordersUrl, apiToken)
  ]);

  let currencyCode = 'IDR';
  if (propsRes.ok && propsRes.data?.defaultCurrency) {
    currencyCode = String(propsRes.data.defaultCurrency).toUpperCase();
  } else {
    warnings.push(
      'Mata uang merchant tidak terbaca dari endpoint properties; nominal Clover dipetakan langsung ke Rupiah (skala 1:1).'
    );
  }

  const priceScale = ZERO_DECIMAL_CURRENCIES.has(currencyCode) ? 1 : 0.01;
  if (priceScale !== 1) {
    warnings.push(
      `Toko Clover menggunakan mata uang ${currencyCode}. Harga Clover (minor units/sen) otomatis dibagi 100 saat pemetaan.`
    );
  }

  const rawItems: any[] = Array.isArray(itemsRes.data?.elements) ? itemsRes.data.elements : [];
  const usedBarcodes = new Set<string>();

  const mappedProducts: Product[] = rawItems.map((item, idx) => {
    const rawName = toTitleCase(String(item?.name || `Produk Clover ${idx + 1}`).trim());
    const candidateBarcode = String(item?.code || item?.sku || '').trim();
    let finalBarcode = candidateBarcode || makeInternalBarcodeId(item?.id, idx);
    if (usedBarcodes.has(finalBarcode)) {
      finalBarcode = makeInternalBarcodeId(`${item?.id || ''}${idx}`, idx);
    }
    usedBarcodes.add(finalBarcode);

    const cloverCatName = String(item?.categories?.elements?.[0]?.name || '').trim();
    const smartCat = runAISmartMapper(finalBarcode, `${rawName} ${cloverCatName}`, []);
    const attrs = parseProductAttributes(rawName);

    const rawPrice = Number(item?.price) || 0;
    const rawCost = Number(item?.cost) || 0;

    const scaledSell = Math.max(0, Math.round(rawPrice * priceScale));
    const scaledCost = Math.max(0, Math.round(rawCost * priceScale));

    const costPrice = scaledCost > 0 ? scaledCost : scaledSell > 0 ? Math.round(scaledSell / 1.2) : 0;
    const derivedTiers = calculateTierPrices(costPrice);
    const sellingPrice = scaledSell > 0 ? scaledSell : derivedTiers.retailPrice;
    const memberPrice =
      scaledSell > 0 ? Math.max(costPrice, Math.round(sellingPrice * 0.95)) : derivedTiers.memberPrice;
    const wholesalePrice =
      scaledSell > 0 ? Math.max(costPrice, Math.round(sellingPrice * 0.9)) : derivedTiers.wholesalePrice;

    const rawStock =
      item?.itemStock?.quantity ?? item?.itemStock?.stockCount ?? item?.stockCount ?? 0;
    const stock = Math.max(0, Math.round((Number(rawStock) || 0) * 100) / 100);
    const skuCode = String(item?.sku || `CLV-${item?.id || idx + 1}`).trim();
    const productId = `CLV-${String(item?.id || idx + 1)}`;

    return {
      id: productId,
      sku: skuCode,
      barcode: finalBarcode,
      name: rawName,
      categoryCode: smartCat.categoryCode, // Angka kategori 2 - 471 tanpa awalan PC.
      category: smartCat.categoryName,
      brand: attrs.brand,
      unit: String(item?.unitName || attrs.unit || 'Pcs'),
      costPrice,
      cost_price: costPrice,
      buy_price: costPrice,
      hpp: costPrice,
      sellingPrice,
      sell_price: sellingPrice,
      price_retail: sellingPrice,
      retailPrice: sellingPrice,
      price: sellingPrice,
      memberPrice,
      price_member: memberPrice,
      wholesalePrice,
      price_wholesale: wholesalePrice,
      stock,
      initialStock: stock,
      minStock: 10,
      min_stock: 10,
      status: stock <= 0 ? 'Out of Stock' : stock <= 10 ? 'Low Stock' : 'Active',
      description: cloverCatName ? `Clover Category: ${cloverCatName}` : 'Sinkronisasi Clover POS Live',
      branchId: 'CAB-PUSAT'
    };
  });

  // Peta produk berdasarkan ID asli Clover dan nama untuk menautkan lineItems order
  const productByCloverId = new Map<string, Product>();
  const productByName = new Map<string, Product>();
  mappedProducts.forEach((p) => {
    productByCloverId.set(p.id.replace(/^CLV-/, ''), p);
    productByName.set(p.name.toLowerCase(), p);
  });

  if (!ordersRes.ok) {
    warnings.push(
      `Katalog produk berhasil ditarik (${mappedProducts.length} SKU), namun riwayat order gagal ditarik: ${ordersRes.error || 'Unknown error'}`
    );
  }

  const rawOrders: any[] = ordersRes.ok && Array.isArray(ordersRes.data?.elements) ? ordersRes.data.elements : [];
  const mappedSales: Sale[] = [];
  const mappedFinanceEntries: FinanceEntry[] = [];

  for (const ord of rawOrders) {
    const stateStr = String(ord?.state || '').toLowerCase();
    const payState = String(ord?.paymentState || '').toUpperCase();
    if (stateStr === 'deleted' || payState === 'VOIDED' || payState === 'REFUNDED') {
      continue;
    }

    const lineElements: any[] = Array.isArray(ord?.lineItems?.elements) ? ord.lineItems.elements : [];
    const hasPayments = Array.isArray(ord?.payments?.elements) && ord.payments.elements.length > 0;
    const isCompleted = stateStr === 'locked' || payState === 'PAID' || hasPayments;

    // Hanya sinkronkan order selesai/terbayar atau order dengan total nominal valid
    const rawOrderTotal = Number(ord?.total) || 0;
    if (!isCompleted && rawOrderTotal <= 0) continue;

    // Kelompokkan line items berdasarkan produk
    const groupedItems = new Map<string, CartItem>();
    let computedLineSum = 0;

    lineElements.forEach((li, liIdx) => {
      const liItemId = String(li?.item?.id || '');
      const liName = toTitleCase(String(li?.name || `Item Clover ${liIdx + 1}`));
      const matchedProduct: Product =
        (liItemId && productByCloverId.get(liItemId)) ||
        productByName.get(liName.toLowerCase()) || {
          id: liItemId ? `CLV-${liItemId}` : `CLV-ITEM-${liIdx + 1}`,
          sku: liItemId || `CLV-ITEM-${liIdx + 1}`,
          barcode: makeInternalBarcodeId(liItemId || li?.id, liIdx),
          name: liName,
          categoryCode: 10,
          category: 'Snack / General',
          brand: parseProductAttributes(liName).brand,
          unit: 'Pcs',
          costPrice: Math.round((Number(li?.price) || 0) * priceScale * 0.8),
          cost_price: Math.round((Number(li?.price) || 0) * priceScale * 0.8),
          sellingPrice: Math.round((Number(li?.price) || 0) * priceScale),
          sell_price: Math.round((Number(li?.price) || 0) * priceScale),
          price_retail: Math.round((Number(li?.price) || 0) * priceScale),
          stock: 0,
          status: 'Active'
        };

      const qty = Math.max(1, Number(li?.unitQty ? li.unitQty / 1000 : 1) || 1);
      const unitSell =
        Number(li?.price) > 0
          ? Math.round(Number(li.price) * priceScale)
          : Number(matchedProduct.sellingPrice || matchedProduct.sell_price || 0);
      const sub = Math.round(unitSell * qty);
      computedLineSum += sub;

      const existing = groupedItems.get(matchedProduct.id);
      if (existing) {
        existing.quantity += qty;
        existing.subtotal += sub;
      } else {
        groupedItems.set(matchedProduct.id, {
          product: matchedProduct,
          quantity: qty,
          subtotal: sub,
          costPrice: matchedProduct.costPrice || matchedProduct.cost_price || 0,
          selectedPriceTier: 'RETAIL'
        });
      }
    });

    const totalAmount =
      rawOrderTotal > 0 ? Math.round(rawOrderTotal * priceScale) : Math.round(computedLineSum);
    if (totalAmount <= 0) continue;

    const cartItems = Array.from(groupedItems.values());
    const itemsSummary =
      cartItems.length > 0
        ? cartItems.map((ci) => `${ci.product.name} (x${ci.quantity})`).join(', ')
        : ord?.title || `Clover Order #${ord?.id || ''}`;

    const paymentMethod = mapCloverPaymentMethod(ord);
    const createdIso = ord?.createdTime
      ? new Date(Number(ord.createdTime)).toISOString()
      : syncedAt;
    const txId = `CLV-ORD-${String(ord?.id || mappedSales.length + 1)}`;

    mappedSales.push({
      transaction_id: txId,
      receipt_number: txId,
      date: createdIso,
      created_at: createdIso,
      cashier_id: String(ord?.employee?.id || 'CLOVER-OP'),
      cashier_name: String(ord?.employee?.name || 'Clover Operator'),
      terminal_name: 'CLOVER POS LIVE',
      terminalId: 'T-CLOVER',
      items_summary: itemsSummary,
      items: cartItems,
      subtotal: totalAmount,
      discount: 0,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      amount_paid: totalAmount,
      change_amount: 0,
      status: 'COMPLETED',
      syncStatus: 'SYNCED',
      branchId: 'CAB-PUSAT'
    });

    mappedFinanceEntries.push({
      id: `FIN-${txId}`,
      date: createdIso.slice(0, 10),
      created_at: createdIso,
      type: 'INCOME',
      category: 'Penjualan POS (Clover Live)',
      description: `Sinkronisasi Order Clover ${txId}: ${itemsSummary.slice(0, 90)}`,
      amount: totalAmount,
      reference: txId,
      payment_method: paymentMethod,
      account_target: paymentMethod === 'CASH' ? 'Kas Operasional' : 'Rekening Bank Utama'
    });
  }

  return {
    success: true,
    products: mappedProducts,
    sales: mappedSales,
    financeEntries: mappedFinanceEntries,
    itemsFetched: rawItems.length,
    ordersFetched: rawOrders.length,
    ordersMapped: mappedSales.length,
    currencyCode,
    transportUsed: itemsRes.transport,
    syncedAt,
    warnings
  };
}
