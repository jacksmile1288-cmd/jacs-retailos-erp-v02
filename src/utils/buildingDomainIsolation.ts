import {
  BusinessDomainConfig,
  GoodsReceipt,
  InventoryRecord,
  InvoiceDue,
  Product,
  PurchaseOrder,
  PurchaseRequest,
  StockMutation,
  SupplierMaster,
} from '../types';
import { isBuildingMaterialProduct } from './buildingTierPricing';
import {
  RAW_INGREDIENTS_AS_PRODUCTS,
  RAW_INGREDIENTS_AS_INVENTORY,
  normalizeFnbRawMaterialId,
} from '../data/rawIngredientsData';
import { isDemoSandboxMode } from './demoSandbox';

export const BUILDING_PURCHASE_UNIT_OPTIONS = [
  'Sak',
  'm³',
  'Ret Dump Truck',
  'Ret Truk Engkel',
  'Ret Pick-up',
  'Batang',
  'Pail',
  'Galon',
  'Kg',
  'Lembar',
  'Roll',
  'Set',
] as const;

export interface GrnFleetCubicOption {
  unit: string;
  label: string;
  factorM3: number;
  description: string;
}

export const GRN_FLEET_CUBIC_OPTIONS: GrnFleetCubicOption[] = [
  {
    unit: 'Ret Dump Truck',
    label: 'Ret Dump Truck (1 Dump Truck = 6.5 m³)',
    factorM3: 6.5,
    description: 'Konversi otomatis 1 Armada Dump Truck = 6.5 m³ ke saldo stok dasar',
  },
  {
    unit: 'Ret Truk Engkel',
    label: 'Ret Truk Engkel (1 Engkel = 3.0 m³)',
    factorM3: 3.0,
    description: 'Konversi otomatis 1 Armada Truk Engkel = 3.0 m³ ke saldo stok dasar',
  },
  {
    unit: 'Ret Pick-up',
    label: 'Ret Pick-up (1 Pick-up = 1.2 m³)',
    factorM3: 1.2,
    description: 'Konversi otomatis 1 Armada Pick-up = 1.2 m³ ke saldo stok dasar',
  },
  {
    unit: 'm³',
    label: 'Kubikasi Langsung (1 m³ = 1.0 m³)',
    factorM3: 1.0,
    description: 'Satuan langsung kubikasi dasar (1:1 m³)',
  },
];

export const resolveGrnBulkCubicConversion = (params: {
  unit?: string;
  productId?: string;
  productName?: string;
  product?: Partial<Product> | null;
}): {
  isBulkCubicItem: boolean;
  factorM3: number;
  matchedUnitLabel: string;
  baseUnit: string;
  formulaText: (qty: number) => string;
} => {
  const unitRaw = String(params.unit || '').trim();
  const unitUpper = unitRaw.toUpperCase();
  const idUpper = String(params.productId || params.product?.id || '').toUpperCase();
  const nameUpper = String(params.productName || params.product?.name || '').toUpperCase();
  const prodUnitUpper = String(params.product?.unit || '').toUpperCase();

  const isBulkCubicItem = Boolean(
    params.product?.materialNature === 'BULK_CURAH' ||
      params.product?.bulkUnitType === 'KUBIK_M3' ||
      prodUnitUpper === 'M³' ||
      prodUnitUpper === 'M3' ||
      unitUpper.includes('M³') ||
      unitUpper.includes('M3') ||
      unitUpper.includes('DUMP') ||
      unitUpper.includes('ENGKEL') ||
      unitUpper.includes('PICK') ||
      unitUpper.includes('RET') ||
      idUpper.includes('PSR') ||
      idUpper.includes('PASIR') ||
      idUpper.includes('SPL') ||
      idUpper.includes('SPLIT') ||
      nameUpper.includes('PASIR') ||
      nameUpper.includes('BATU SPLIT') ||
      nameUpper.includes('BATU PECAH') ||
      nameUpper.includes('SIRTU') ||
      nameUpper.includes('CURAH')
  );

  if (!isBulkCubicItem) {
    return {
      isBulkCubicItem: false,
      factorM3: 1,
      matchedUnitLabel: unitRaw || params.product?.unit || 'Unit',
      baseUnit: params.product?.unit || unitRaw || 'Unit',
      formulaText: (qty: number) => `${qty} ${unitRaw || 'Unit'}`,
    };
  }

  let factorM3 = 1.0;
  let matchedUnitLabel = unitRaw || 'm³';

  if (unitUpper.includes('DUMP') || unitUpper.includes('6.5') || unitUpper.includes('TRK')) {
    factorM3 = 6.5;
    matchedUnitLabel = 'Ret Dump Truck';
  } else if (unitUpper.includes('ENGKEL') || unitUpper.includes('3.0') || unitUpper.includes('ENG')) {
    factorM3 = 3.0;
    matchedUnitLabel = 'Ret Truk Engkel';
  } else if (unitUpper.includes('PICK') || unitUpper.includes('1.2') || unitUpper.includes('PKP')) {
    factorM3 = 1.2;
    matchedUnitLabel = 'Ret Pick-up';
  } else if (unitUpper.includes('RET') && !unitUpper.includes('ENGKEL') && !unitUpper.includes('PICK')) {
    factorM3 = 6.5;
    matchedUnitLabel = 'Ret Dump Truck';
  } else {
    factorM3 = 1.0;
    matchedUnitLabel = 'm³';
  }

  return {
    isBulkCubicItem: true,
    factorM3,
    matchedUnitLabel,
    baseUnit: 'm³',
    formulaText: (qty: number) => {
      const converted = Number((qty * factorM3).toFixed(2));
      if (factorM3 === 1) {
        return `${qty} m³ = +${converted} m³ ke Saldo Stok Dasar`;
      }
      return `${qty} ${matchedUnitLabel} × ${factorM3} m³ = +${converted} m³ ke Saldo Stok Dasar`;
    },
  };
};

// ============================================================================
// DATA BAWAAN KHUSUS BUILDING_BULK (MATERIAL BANGUNAN, BESI/KAYU & PERTANIAN)
// ============================================================================

export const BUILDING_BULK_SUPPLIERS: SupplierMaster[] = [
  {
    id: 'SUP-BLD-01',
    code: 'SUP-BLD-01',
    name: 'PT Semen Tonasa / Tiga Roda',
    contactPerson: 'Ir. Hendrawan Saputra',
    phone: '0811-4455-8801',
    email: 'distribusi@sementonasa-tigaroda.co.id',
    address: 'Kawasan Industri KIMA Jl. Perintis Kemerdekaan KM 15, Makassar',
    paymentTerms: 'Tempo 30 Hari',
    activePoCount: 2,
    status: 'Active',
  },
  {
    id: 'SUP-BLD-02',
    code: 'SUP-BLD-02',
    name: 'CV Quarry Merapi & Alam',
    contactPerson: 'H. Darwis Quarry',
    phone: '0812-4199-7722',
    email: 'logistik@quarrymerapi-alam.id',
    address: 'Pangkalan Tambang Galian C Sungai Jeneberang / Merapi Quarry',
    paymentTerms: 'Tempo 14 Hari',
    activePoCount: 1,
    status: 'Active',
  },
  {
    id: 'SUP-BLD-03',
    code: 'SUP-BLD-03',
    name: 'PT Krakatau Steel / Distributor Besi',
    contactPerson: 'Bambang Wijaya, ST',
    phone: '0813-5566-9900',
    email: 'sales.proyek@distributorbesisni.co.id',
    address: 'Jl. Tol Ir. Sutami Kawasan Pergudangan Parangloe Blok D-12',
    paymentTerms: 'Tempo 30 Hari',
    activePoCount: 1,
    status: 'Active',
  },
  {
    id: 'SUP-BLD-04',
    code: 'SUP-BLD-04',
    name: 'PT Dulux / Jotun Paint Indonesia',
    contactPerson: 'Siti Rahmawati',
    phone: '0811-8800-3344',
    email: 'depo.cat@dulux-jotun-dist.co.id',
    address: 'Kawasan Pergudangan Bizpark Commercial Estate Blok A-08',
    paymentTerms: 'Tempo 30 Hari',
    activePoCount: 1,
    status: 'Active',
  },
];

export const BUILDING_BULK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    po_number: 'PO-BLD-2026-001',
    date: '2026-10-18',
    supplier_name: 'PT Semen Tonasa / Tiga Roda',
    supplier_id: 'SUP-BLD-01',
    items: 'Semen Portland 50kg SNI (250 Sak)',
    subtotal: 14000000,
    include_ppn: true,
    ppn_rate: 11,
    ppn_amount: 1540000,
    total_amount: 15540000,
    payment_term: 'Tempo 30 Hari',
    payment_status: 'Belum Bayar',
    due_date: '2026-11-17',
    status: 'APPROVED',
    approved_by: 'Ir. Hendra (Kepala Depo & Operasional)',
    approved_date: '2026-10-18',
    notes: 'Restock semen PCC 50kg untuk alokasi kontrak proyek ruko & stok gudang utama.',
    item_details: [
      {
        product_id: 'MAT-SMN-50KG',
        product_name: 'Semen Portland 50kg SNI',
        qty: 250,
        received_qty: 0,
        unit_cost: 56000,
        subtotal: 14000000,
        unit: 'Sak',
      },
    ],
  },
  {
    po_number: 'PO-BLD-2026-002',
    date: '2026-10-19',
    supplier_name: 'CV Quarry Merapi & Alam',
    supplier_id: 'SUP-BLD-02',
    items: 'Pasir Pasang Curah (Quarry Merapi) (4 Ret Dump Truck), Batu Split 1/2 Cor Beton Curah (3 Ret Dump Truck)',
    subtotal: 10080000,
    include_ppn: false,
    ppn_rate: 0,
    ppn_amount: 0,
    total_amount: 10080000,
    payment_term: 'Tempo 14 Hari',
    payment_status: 'Belum Bayar',
    due_date: '2026-11-02',
    status: 'APPROVED',
    approved_by: 'Ir. Hendra (Kepala Depo & Operasional)',
    approved_date: '2026-10-19',
    notes: 'Pengiriman armada Dump Truck Quarry (1 Dump Truck = 6.5 m³) langsung ke Yard Material Curah.',
    item_details: [
      {
        product_id: 'MAT-PSR-1M3',
        product_name: 'Pasir Pasang Curah (Quarry Merapi)',
        qty: 4,
        received_qty: 0,
        unit_cost: 1380000,
        subtotal: 5520000,
        unit: 'Ret Dump Truck',
      },
      {
        product_id: 'MAT-SPL-1M3',
        product_name: 'Batu Split 1/2 Cor Beton Curah',
        qty: 3,
        received_qty: 0,
        unit_cost: 1520000,
        subtotal: 4560000,
        unit: 'Ret Dump Truck',
      },
    ],
  },
  {
    po_number: 'PO-BLD-2026-003',
    date: '2026-10-20',
    supplier_name: 'PT Krakatau Steel / Distributor Besi',
    supplier_id: 'SUP-BLD-03',
    items: 'Besi Beton Polos 10mm SNI (12m) (200 Batang), Baja Ringan Kanal C 75mm SNI (6m) (150 Batang)',
    subtotal: 26400000,
    include_ppn: true,
    ppn_rate: 11,
    ppn_amount: 2904000,
    total_amount: 29304000,
    payment_term: 'Tempo 30 Hari',
    payment_status: 'Belum Bayar',
    due_date: '2026-11-19',
    status: 'PENDING_APPROVAL',
    requiresDirectorApproval: true,
    notes: 'Pengadaan besi beton SNI & baja ringan proyek perumahan cluster tahap 2 (Otorisasi > Rp 20 Jt).',
    item_details: [
      {
        product_id: 'MAT-BSI-10MM',
        product_name: 'Besi Beton Polos 10mm SNI (12m)',
        qty: 200,
        received_qty: 0,
        unit_cost: 72000,
        subtotal: 14400000,
        unit: 'Batang',
      },
      {
        product_id: 'MAT-BJR-C75',
        product_name: 'Baja Ringan Kanal C 75mm SNI (6m)',
        qty: 150,
        received_qty: 0,
        unit_cost: 80000,
        subtotal: 12000000,
        unit: 'Batang',
      },
    ],
  },
  {
    po_number: 'PO-BLD-2026-004',
    date: '2026-10-14',
    supplier_name: 'PT Dulux / Jotun Paint Indonesia',
    supplier_id: 'SUP-BLD-04',
    items: 'Cat Tembok Interior 5kg Anti-Jamur (40 Pail), Pipa PVC AW 4 Inch Saluran Air (50 Batang)',
    subtotal: 9260000,
    include_ppn: true,
    ppn_rate: 11,
    ppn_amount: 1018600,
    total_amount: 10278600,
    payment_term: 'Tempo 30 Hari',
    payment_status: 'Lunas',
    due_date: '2026-11-13',
    paid_date: '2026-10-16',
    payment_method: 'Transfer Bank Mandiri',
    payment_ref: 'TRF-MDR-BLD8812',
    status: 'Selesai',
    delivery_order_no: 'SJ-DLX-2026-991',
    received_date: '2026-10-15',
    received_by: 'Hendra Wijaya (Kepala Gudang Depo)',
    item_details: [
      {
        product_id: 'MAT-CAT-INT5',
        product_name: 'Cat Tembok Interior 5kg Anti-Jamur',
        qty: 40,
        received_qty: 40,
        unit_cost: 94000,
        subtotal: 3760000,
        unit: 'Pail',
      },
      {
        product_id: 'MAT-PIP-PVC4',
        product_name: 'Pipa PVC AW 4 Inch Saluran Air',
        qty: 50,
        received_qty: 50,
        unit_cost: 110000,
        subtotal: 5500000,
        unit: 'Batang',
      },
    ],
  },
];

export const BUILDING_BULK_PURCHASE_REQUESTS: PurchaseRequest[] = [
  {
    pr_number: 'PR-BLD-2026-001',
    date: '2026-10-19',
    department: 'Gudang Yard & Material Curah',
    requester_name: 'Hendra Wijaya (Kepala Gudang Depo)',
    item_name: 'Pasir Pasang Curah Quarry Merapi (5 Ret Dump Truck / 32.5 m³)',
    qty: 5,
    estimated_cost: 6900000,
    status: 'PENDING',
    urgency: 'High',
  },
  {
    pr_number: 'PR-BLD-2026-002',
    date: '2026-10-18',
    department: 'Depo Kayu & Konstruksi',
    requester_name: 'Darwis (Koordinator Yard)',
    item_name: 'Kayu Balok & Kaso Meranti 5x7 x 4 Meter (120 Batang)',
    qty: 120,
    estimated_cost: 4200000,
    status: 'Approved',
    urgency: 'Medium',
  },
  {
    pr_number: 'PR-BLD-2026-003',
    date: '2026-10-17',
    department: 'Divisi Cat & Perpipaan',
    requester_name: 'Agnes Monica (Purchasing Material)',
    item_name: 'Cat Tembok Interior Anti-Jamur Pail (30 Pail)',
    qty: 30,
    estimated_cost: 2820000,
    status: 'PENDING',
    urgency: 'Medium',
  },
];

export const BUILDING_BULK_STOCK_MUTATIONS: StockMutation[] = [
  {
    id: 'MUT-BLD-001',
    timestamp: '2026-10-19 14:20:00',
    product_id: 'MAT-PSR-1M3',
    sku: '899900100006',
    product_name: 'Pasir Pasang Curah (Quarry Merapi)',
    type: 'IN / GOODS_RECEIPT',
    qty: 26,
    previous_stock: 80.5,
    final_stock: 106.5,
    reference_no: 'GR-BLD-2026-0001',
    notes: 'Penerimaan 4 Ret Dump Truck × 6.5 m³ = +26 m³ dari CV Quarry Merapi & Alam',
    operator: 'Hendra Wijaya (Kepala Gudang Depo)',
    unit_cost: 220000,
  },
  {
    id: 'MUT-BLD-002',
    timestamp: '2026-10-19 15:40:10',
    product_id: 'MAT-PSR-1M3',
    sku: '899900100006',
    product_name: 'Pasir Pasang Curah (Quarry Merapi)',
    type: 'OUT / KASIR',
    qty: 6.5,
    previous_stock: 106.5,
    final_stock: 100,
    reference_no: 'DO-2026-8801',
    notes: 'Penjualan Kasir Depo 1 Ret Dump Truck (Konversi Otomatis -6.5 m³) CV Bangun Jaya',
    operator: 'Kasir Depo Bangunan (T-05)',
  },
  {
    id: 'MUT-BLD-003',
    timestamp: '2026-10-18 11:15:00',
    product_id: 'MAT-SMN-50KG',
    sku: '899900100001',
    product_name: 'Semen Portland 50kg SNI',
    type: 'OUT / KASIR',
    qty: 40,
    previous_stock: 290,
    final_stock: 250,
    reference_no: 'DO-2026-8802',
    notes: 'Pengiriman Frangko Proyek Cluster Griya Asri (40 Sak - Tier 3 Kontraktor)',
    operator: 'Kasir Depo Bangunan (T-05)',
  },
  {
    id: 'MUT-BLD-004',
    timestamp: '2026-10-18 11:16:00',
    product_id: 'MAT-BSI-10MM',
    sku: '899900100007',
    product_name: 'Besi Beton Polos 10mm SNI (12m)',
    type: 'OUT / KASIR',
    qty: 35,
    previous_stock: 185,
    final_stock: 150,
    reference_no: 'DO-2026-8802',
    notes: 'Penjualan Tier Tukang/Kontraktor 35 Batang Besi Beton 10mm SNI',
    operator: 'Kasir Depo Bangunan (T-05)',
  },
  {
    id: 'MUT-BLD-005',
    timestamp: '2026-10-15 09:30:00',
    product_id: 'MAT-CAT-INT5',
    sku: '899900100002',
    product_name: 'Cat Tembok Interior 5kg Anti-Jamur',
    type: 'IN / GOODS_RECEIPT',
    qty: 40,
    previous_stock: 25,
    final_stock: 65,
    reference_no: 'PO-BLD-2026-004',
    notes: 'Penerimaan PO PT Dulux / Jotun Paint Indonesia (40 Pail)',
    operator: 'Hendra Wijaya (Kepala Gudang Depo)',
    unit_cost: 94000,
  },
];

export const BUILDING_BULK_GOODS_RECEIPTS: GoodsReceipt[] = [
  {
    id: 'GR-BLD-2026-0001',
    poId: 'PO-BLD-2026-004',
    poNumber: 'PO-BLD-2026-004',
    vendorId: 'SUP-BLD-04',
    vendorName: 'PT Dulux / Jotun Paint Indonesia',
    warehouseId: 'WH-DEPO-01',
    deliveryOrderNumber: 'SJ-DLX-2026-991',
    receivedDate: '2026-10-15 09:30:00',
    receivedByUserId: 'Hendra Wijaya (Kepala Gudang Depo)',
    status: 'VERIFIED',
    items: [
      {
        id: 'GRI-BLD-001',
        poItemId: 'POI-BLD-001',
        productId: 'MAT-CAT-INT5',
        productName: 'Cat Tembok Interior 5kg Anti-Jamur',
        orderedQty: 40,
        receivedQty: 40,
        acceptedQty: 40,
        rejectedQty: 0,
        unit: 'Pail',
        unitCost: 94000,
        totalCost: 3760000,
      },
      {
        id: 'GRI-BLD-002',
        poItemId: 'POI-BLD-002',
        productId: 'MAT-PIP-PVC4',
        productName: 'Pipa PVC AW 4 Inch Saluran Air',
        orderedQty: 50,
        receivedQty: 50,
        acceptedQty: 50,
        rejectedQty: 0,
        unit: 'Batang',
        unitCost: 110000,
        totalCost: 5500000,
      },
    ],
    notes: 'Penerimaan material cat pail & pipa PVC kondisi baik di Gudang Depo Bangunan.',
    idempotencyKey: 'IDEM-GR-BLD-2026-0001',
  },
];

// ============================================================================
// DETEKSI & ISOLASI DOMAIN OTOMATIS LINTAS MODUL
// ============================================================================

const BUILDING_KEYWORDS = [
  'SEMEN',
  'TONASA',
  'TIGA RODA',
  'GRESIK',
  'QUARRY',
  'MERAPI',
  'PASIR',
  'BATU SPLIT',
  'BATU PECAH',
  'KRAKATAU STEEL',
  'DISTRIBUTOR BESI',
  'BESI BETON',
  'BAJA RINGAN',
  'KANAL C',
  'PIPA PVC',
  'RUCIKA',
  'WAVIN',
  'KAYU BALOK',
  'MERANTI',
  'DULUX',
  'JOTUN',
  'CAT TEMBOK',
  'PAKU BAJA',
  'KUNCI PAS',
  'TEKIRO',
  'DUMP TRUCK',
  'TRUK ENGKEL',
];

const NON_BUILDING_RETAIL_IT_KEYWORDS = [
  'INDOFOOD',
  'DISTRIBUTOR KOMPUTER',
  'MITRA GLOBAL TEKNOLOGI',
  'SURYA NUSANTARA ELEKTRONIK',
  'ANEKA JAYA SUPPLY',
  'KERTAS THERMAL',
  'THERMAL RECEIPT PRINTER',
  'MONITOR GAMING',
  'KEYBOARD RGB',
  'GAMING MOUSE',
  'EXTERNAL SSD',
  'ROUTER WIFI',
  'USB-C MULTIPORT',
  'HEADSET WIRELESS',
  'UPS 1200VA',
  'BARCODE SCANNER',
  'INDOMIE',
  'BIMOLI',
  'DANCOW',
  'KAO ATTACK',
  'BERAS RAMOS',
  'TEPUNG SEGITIGA',
];

export const isBuildingMaterialDomainProduct = (product?: Partial<Product> | null): boolean => {
  if (!product) return false;
  const idUpper = String(product.id || '').toUpperCase();
  const skuUpper = String(product.sku || '').toUpperCase();
  // Explicitly exclude SKU-001..SKU-005 retail grocery and PRD-* IT hardware
  if (idUpper.startsWith('SKU-00') || idUpper.startsWith('PRD-')) {
    return false;
  }
  if (idUpper.startsWith('MAT-') || skuUpper.startsWith('MAT-')) {
    return true;
  }
  return isBuildingMaterialProduct(product as Product);
};

export const isBuildingMaterialSupplier = (supplier?: Partial<SupplierMaster> | null): boolean => {
  if (!supplier) return false;
  const idUpper = String(supplier.id || supplier.code || '').toUpperCase();
  const nameUpper = String(supplier.name || '').toUpperCase();
  if (idUpper.startsWith('SUP-BLD')) return true;
  if (NON_BUILDING_RETAIL_IT_KEYWORDS.some((kw) => nameUpper.includes(kw))) return false;
  return BUILDING_KEYWORDS.some((kw) => nameUpper.includes(kw));
};

export const isBuildingMaterialPO = (po?: Partial<PurchaseOrder> | null): boolean => {
  if (!po) return false;
  const poNoUpper = String(po.po_number || po.po_id || '').toUpperCase();
  const supIdUpper = String(po.supplier_id || po.vendor_id || '').toUpperCase();
  const supNameUpper = String(po.supplier_name || '').toUpperCase();
  const itemsUpper = String(po.items || '').toUpperCase();

  if (poNoUpper.startsWith('PO-BLD') || supIdUpper.startsWith('SUP-BLD')) {
    return true;
  }

  if (
    Array.isArray(po.item_details) &&
    po.item_details.some((d) => String(d.product_id || '').toUpperCase().startsWith('MAT-'))
  ) {
    return true;
  }

  if (
    NON_BUILDING_RETAIL_IT_KEYWORDS.some(
      (kw) => supNameUpper.includes(kw) || itemsUpper.includes(kw)
    )
  ) {
    return false;
  }

  return BUILDING_KEYWORDS.some(
    (kw) => supNameUpper.includes(kw) || itemsUpper.includes(kw)
  );
};

export const isBuildingMaterialPR = (pr?: Partial<PurchaseRequest> | null): boolean => {
  if (!pr) return false;
  const prNoUpper = String(pr.pr_number || pr.id || '').toUpperCase();
  const itemUpper = String(pr.item_name || '').toUpperCase();
  const deptUpper = String(pr.department || '').toUpperCase();

  if (prNoUpper.startsWith('PR-BLD')) return true;
  if (NON_BUILDING_RETAIL_IT_KEYWORDS.some((kw) => itemUpper.includes(kw))) return false;
  return (
    BUILDING_KEYWORDS.some((kw) => itemUpper.includes(kw)) ||
    deptUpper.includes('CURAH') ||
    deptUpper.includes('DEPO') ||
    deptUpper.includes('KONSTRUKSI')
  );
};

export const isBuildingMaterialMutation = (
  mutation?: Partial<StockMutation> | null,
  buildingProductIds?: Set<string>
): boolean => {
  if (!mutation) return false;
  const idUpper = String(mutation.id || '').toUpperCase();
  const prodId = String(mutation.product_id || '');
  const prodIdUpper = prodId.toUpperCase();
  const nameUpper = String(mutation.product_name || '').toUpperCase();
  const refUpper = String(mutation.reference_no || '').toUpperCase();

  if (
    idUpper.startsWith('MUT-BLD') ||
    prodIdUpper.startsWith('MAT-') ||
    refUpper.startsWith('PO-BLD') ||
    refUpper.startsWith('GR-BLD') ||
    refUpper.startsWith('DO-2026')
  ) {
    return true;
  }
  if (buildingProductIds && buildingProductIds.has(prodId)) {
    return true;
  }
  if (prodIdUpper.startsWith('SKU-00') || prodIdUpper.startsWith('PRD-')) {
    return false;
  }
  if (NON_BUILDING_RETAIL_IT_KEYWORDS.some((kw) => nameUpper.includes(kw))) {
    return false;
  }
  return BUILDING_KEYWORDS.some((kw) => nameUpper.includes(kw));
};

export const isBuildingMaterialGoodsReceipt = (gr?: Partial<GoodsReceipt> | null): boolean => {
  if (!gr) return false;
  const idUpper = String(gr.id || '').toUpperCase();
  const poUpper = String(gr.poNumber || gr.poId || '').toUpperCase();
  const vendorUpper = String(gr.vendorName || gr.vendorId || '').toUpperCase();

  if (
    idUpper.startsWith('GR-BLD') ||
    poUpper.startsWith('PO-BLD') ||
    String(gr.vendorId || '').toUpperCase().startsWith('SUP-BLD')
  ) {
    return true;
  }
  if (
    Array.isArray(gr.items) &&
    gr.items.some((it) => String(it.productId || '').toUpperCase().startsWith('MAT-'))
  ) {
    return true;
  }
  if (NON_BUILDING_RETAIL_IT_KEYWORDS.some((kw) => vendorUpper.includes(kw))) {
    return false;
  }
  return BUILDING_KEYWORDS.some((kw) => vendorUpper.includes(kw));
};

// ============================================================================
// F&B CULINARY (DAPUR RESTO, KAFE & BAKERY) ISOLATED DATA & HELPERS
// ============================================================================

export const FNB_CULINARY_SUPPLIERS: SupplierMaster[] = [
  {
    id: 'SUP-FNB-01',
    code: 'SUP-FNB-01',
    name: 'PT Kopi Nusantara Roastery',
    contactPerson: 'Bpk. Rian Pratama (Roaster Head)',
    phone: '0811-3400-8811',
    email: 'order@kopinusantararoastery.co.id',
    address: 'Jl. Soekarno Hatta No. 88, Bandung',
    paymentTerms: 'Tempo 14 Hari',
    activePoCount: 1,
    status: 'Active',
  },
  {
    id: 'SUP-FNB-02',
    code: 'SUP-FNB-02',
    name: 'PT Prime Meat Coldstorage',
    contactPerson: 'Ibu Melissa Wijaya (Key Account)',
    phone: '0812-8890-1122',
    email: 'horeca@primemeatcold.co.id',
    address: 'Kawasan Industri Pulo Gadung Blok N-12, Jakarta',
    paymentTerms: 'Tempo 14 Hari',
    activePoCount: 1,
    status: 'Active',
  },
  {
    id: 'SUP-FNB-03',
    code: 'SUP-FNB-03',
    name: 'PT Artisan Bakery & Dairy Supply',
    contactPerson: 'Bpk. Kevin Halim (Horeca Division)',
    phone: '0813-7712-9090',
    email: 'supply@artisanbakerydairy.id',
    address: 'Jl. Raya Darmo Permai III No. 21, Surabaya',
    paymentTerms: 'Tempo 30 Hari',
    activePoCount: 1,
    status: 'Active',
  },
  {
    id: 'SUP-FNB-04',
    code: 'SUP-FNB-04',
    name: 'CV Pangan Kuliner Nusantara',
    contactPerson: 'Bpk. Haji Surya (Logistik Dapur)',
    phone: '0815-9901-3344',
    email: 'distribusi@pangankuliner.co.id',
    address: 'Pasar Induk Kramat Jati Blok D-05, Jakarta',
    paymentTerms: 'COD / Tempo 7 Hari',
    activePoCount: 0,
    status: 'Active',
  },
  {
    id: 'SUP-FNB-05',
    code: 'SUP-FNB-05',
    name: 'CV Kemasan Eco Packindo',
    contactPerson: 'Ibu Diana Putri (Sales Packaging)',
    phone: '0817-6621-4455',
    email: 'sales@ecopackindo.com',
    address: 'Kawasan Pergudangan Taman Tekno BSD Blok K-09, Tangerang',
    paymentTerms: 'Tempo 30 Hari',
    activePoCount: 0,
    status: 'Active',
  },
];

export const FNB_CULINARY_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    po_number: 'PO-FNB-2026-001',
    date: '2026-09-25',
    due_date: '2026-10-09',
    supplier_id: 'SUP-FNB-01',
    supplier_name: 'PT Kopi Nusantara Roastery',
    items: 'Biji Kopi Espresso Blend (15.000 Gr), Gula Aren Cair (20.000 Ml), Bubuk Matcha Jepang (2.733 Gr)',
    subtotal: 4860000,
    include_ppn: false,
    ppn_rate: 0,
    ppn_amount: 0,
    total_amount: 4860000,
    status: 'APPROVED',
    payment_term: 'Tempo 14 Hari',
    payment_status: 'Belum Bayar',
    approved_by: 'Manager Operasional F&B',
    notes: 'Restock Biji Kopi Arabica Espresso Blend, Gula Aren Cair & Matcha Barista',
    item_details: [
      {
        product_id: 'RM-FNB-012',
        product_name: 'Biji Kopi Espresso Blend',
        qty: 15000,
        unit: 'Gram',
        unit_cost: 200,
        subtotal: 3000000,
      },
      {
        product_id: 'RM-FNB-013',
        product_name: 'Gula Aren Cair',
        qty: 20000,
        unit: 'Ml',
        unit_cost: 52,
        subtotal: 1040000,
      },
      {
        product_id: 'RM-FNB-015',
        product_name: 'Bubuk Matcha Jepang & Teh Melati',
        qty: 2733,
        unit: 'Gram',
        unit_cost: 300,
        subtotal: 820000,
      },
    ],
  },
  {
    po_number: 'PO-FNB-2026-002',
    date: '2026-09-26',
    due_date: '2026-10-10',
    supplier_id: 'SUP-FNB-02',
    supplier_name: 'PT Prime Meat Coldstorage',
    items: 'Daging Sapi Wagyu Slice (20.000 Gr), Daging Ayam Fillet Segar (30.000 Gr), Kentang Beku Shoestring (30.000 Gr)',
    subtotal: 6450000,
    include_ppn: false,
    ppn_rate: 0,
    ppn_amount: 0,
    total_amount: 6450000,
    status: 'APPROVED',
    payment_term: 'Tempo 14 Hari',
    payment_status: 'Belum Bayar',
    approved_by: 'Direktur Kuliner',
    notes: 'Pasokan Daging Sapi Wagyu Slice, Ayam Fillet & Kentang Shoestring Chiller',
    item_details: [
      {
        product_id: 'RM-FNB-002',
        product_name: 'Daging Sapi Wagyu Slice',
        qty: 20000,
        unit: 'Gram',
        unit_cost: 180,
        subtotal: 3600000,
      },
      {
        product_id: 'RM-FNB-003',
        product_name: 'Daging Ayam Fillet Segar',
        qty: 30000,
        unit: 'Gram',
        unit_cost: 55,
        subtotal: 1650000,
      },
      {
        product_id: 'RM-FNB-016',
        product_name: 'Kentang Beku Shoestring',
        qty: 30000,
        unit: 'Gram',
        unit_cost: 40,
        subtotal: 1200000,
      },
    ],
  },
  {
    po_number: 'PO-FNB-2026-003',
    date: '2026-09-27',
    due_date: '2026-10-27',
    supplier_id: 'SUP-FNB-03',
    supplier_name: 'PT Artisan Bakery & Dairy Supply',
    items: 'Susu Fresh Milk UHT (120.000 Ml), Roti Burger & Pastry Butter Dough (250 Pcs), Keju Slice Melt Cheddar (250 Pcs)',
    subtotal: 3920000,
    include_ppn: false,
    ppn_rate: 0,
    ppn_amount: 0,
    total_amount: 3920000,
    status: 'APPROVED',
    payment_term: 'Tempo 30 Hari',
    payment_status: 'Belum Bayar',
    approved_by: 'Manager Operasional F&B',
    notes: 'Pengadaan Susu Fresh Milk UHT Barista, Roti Brioche & Pastry Dough',
    item_details: [
      {
        product_id: 'RM-FNB-014',
        product_name: 'Susu Fresh Milk UHT',
        qty: 120000,
        unit: 'Ml',
        unit_cost: 16,
        subtotal: 1920000,
      },
      {
        product_id: 'RM-FNB-010',
        product_name: 'Roti Burger & Pastry Butter Dough',
        qty: 250,
        unit: 'Pcs',
        unit_cost: 5000,
        subtotal: 1250000,
      },
      {
        product_id: 'RM-FNB-011',
        product_name: 'Keju Slice Melt Cheddar',
        qty: 250,
        unit: 'Pcs',
        unit_cost: 3000,
        subtotal: 750000,
      },
    ],
  },
];

export const FNB_CULINARY_PURCHASE_REQUESTS: PurchaseRequest[] = [
  {
    pr_number: 'PR-FNB-2026-01',
    date: '2026-09-27',
    department: 'Barista & Coffee Roastery',
    requester_name: 'Rian Pratama (Head Barista)',
    item_name: 'Biji Kopi Espresso Blend (RM-FNB-012) - 10.000 Gram',
    qty: 10000,
    estimated_cost: 2000000,
    status: 'PENDING',
    urgency: 'High',
  },
  {
    pr_number: 'PR-FNB-2026-02',
    date: '2026-09-27',
    department: 'Dapur & Packaging Takeaway',
    requester_name: 'Chef Hendra (Kitchen Head)',
    item_name: 'Paper Cup 16oz (RM-FNB-020) - 1.000 Pcs',
    qty: 1000,
    estimated_cost: 1200000,
    status: 'Approved',
    urgency: 'Medium',
  },
];

export const FNB_CULINARY_STOCK_MUTATIONS: StockMutation[] = [
  {
    id: 'MUT-FNB-BOM-001',
    timestamp: '2026-09-27 10:15:22',
    date: '2026-09-27',
    product_id: 'RM-FNB-012',
    sku: 'RM-FNB-012',
    product_name: 'Biji Kopi Espresso Blend',
    type: 'OUT / RESEP BOM',
    qty: 180,
    previous_stock: 6180,
    final_stock: 6000,
    balanceAfter: 6000,
    reference_no: 'KOT-POS-0012',
    referenceId: 'KOT-POS-0012',
    notes: 'Pemotongan otomatis BOM: 10x Kopi Susu Gula Aren Signature (@18gr)',
    operator: 'Sistem BOM Kasir F&B',
    warehouse: 'Barista Station S-01',
  },
  {
    id: 'MUT-FNB-BOM-002',
    timestamp: '2026-09-27 10:15:22',
    date: '2026-09-27',
    product_id: 'RM-FNB-014',
    sku: 'RM-FNB-014',
    product_name: 'Susu Fresh Milk UHT',
    type: 'OUT / RESEP BOM',
    qty: 1500,
    previous_stock: 21500,
    final_stock: 20000,
    balanceAfter: 20000,
    reference_no: 'KOT-POS-0012',
    referenceId: 'KOT-POS-0012',
    notes: 'Pemotongan otomatis BOM: 10x Kopi Susu Gula Aren Signature (@150ml)',
    operator: 'Sistem BOM Kasir F&B',
    warehouse: 'Chiller Barista B-02',
  },
  {
    id: 'MUT-FNB-BOM-003',
    timestamp: '2026-09-27 11:05:10',
    date: '2026-09-27',
    product_id: 'RM-FNB-001',
    sku: 'RM-FNB-001',
    product_name: 'Beras Putih Pandan Wangi',
    type: 'OUT / RESEP BOM',
    qty: 750,
    previous_stock: 25750,
    final_stock: 25000,
    balanceAfter: 25000,
    reference_no: 'KOT-POS-0015',
    referenceId: 'KOT-POS-0015',
    notes: 'Pemotongan otomatis BOM: 5x Nasi Goreng Spesial Wagyu (@150gr)',
    operator: 'Sistem BOM Kasir F&B',
    warehouse: 'Dry Store Rak A-01',
  },
  {
    id: 'MUT-FNB-PO-004',
    timestamp: '2026-09-26 16:40:00',
    date: '2026-09-26',
    product_id: 'RM-FNB-002',
    sku: 'RM-FNB-002',
    product_name: 'Daging Sapi Wagyu Slice',
    type: 'IN / PO DAPUR',
    qty: 3000,
    previous_stock: 5000,
    final_stock: 8000,
    balanceAfter: 8000,
    reference_no: 'GRN/PO-FNB-2026-002',
    referenceId: 'PO-FNB-2026-002',
    notes: 'Penerimaan bahan baku chiller dari PT Prime Meat Coldstorage',
    operator: 'Chef & Gudang Dapur',
    warehouse: 'Chiller Dapur C-01',
  },
  {
    id: 'MUT-FNB-PO-005',
    timestamp: '2026-09-26 16:45:00',
    date: '2026-09-26',
    product_id: 'RM-FNB-020',
    sku: 'RM-FNB-020',
    product_name: 'Paper Cup 16oz',
    type: 'IN / PO DAPUR',
    qty: 200,
    previous_stock: 300,
    final_stock: 500,
    balanceAfter: 500,
    reference_no: 'GRN/PO-FNB-2026-001',
    referenceId: 'PO-FNB-2026-001',
    notes: 'Restock kemasan cup barista 16oz food grade',
    operator: 'Staf Gudang F&B',
    warehouse: 'Packaging Rak P-03',
  },
];

export const FNB_CULINARY_GOODS_RECEIPTS: GoodsReceipt[] = [
  {
    id: 'GRN-FNB-2026-001',
    poId: 'PO-FNB-2026-002',
    poNumber: 'PO-FNB-2026-002',
    vendorId: 'SUP-FNB-02',
    vendorName: 'PT Prime Meat Coldstorage',
    warehouseId: 'WH-FNB-CHILLER',
    deliveryOrderNumber: 'SJ-PMC-2026-881',
    receivedDate: '2026-09-26 16:40:00',
    receivedByUserId: 'Sous Chef & QC Chiller',
    status: 'VERIFIED',
    items: [
      {
        id: 'GRI-FNB-001',
        poItemId: 'POI-FNB-001',
        productId: 'RM-FNB-002',
        productName: 'Daging Sapi Wagyu Slice',
        orderedQty: 20000,
        receivedQty: 20000,
        acceptedQty: 20000,
        rejectedQty: 0,
        unit: 'Gram',
        unitCost: 180,
        totalCost: 3600000,
      },
    ],
    notes: 'Suhu chiller 2°C sesuai standar food safety dapur F&B',
    idempotencyKey: 'IDEM-GRN-FNB-2026-001',
  },
];

export const isFnbRawMaterialProduct = (p?: Partial<Product> | null): boolean => {
  if (!p) return false;
  const idUpper = String(p.id || '').toUpperCase();
  const catUpper = String(p.category || '').toUpperCase();
  if (
    idUpper.startsWith('RM-FNB-') ||
    idUpper.startsWith('ING-') ||
    p.itemType === 'RAW_MATERIAL' ||
    catUpper.includes('BAHAN BAKU DAPUR') ||
    catUpper.includes('BAHAN BAKU & MENTAH')
  ) {
    return true;
  }
  return false;
};

export const isFnbCulinarySupplier = (s?: Partial<SupplierMaster> | { name?: string } | null): boolean => {
  if (!s) return false;
  const idUpper = String((s as SupplierMaster).id || '').toUpperCase();
  const nameUpper = String(s.name || '').toUpperCase();
  if (idUpper.startsWith('SUP-FNB-')) return true;
  const fnbKeywords = [
    'KOPI NUSANTARA',
    'ROASTERY',
    'PRIME MEAT',
    'COLDSTORAGE',
    'ARTISAN BAKERY',
    'DAIRY SUPPLY',
    'PANGAN KULINER',
    'ECO PACKINDO',
    'DAPUR',
    'HORECA',
    'BARISTA',
    'KULINER',
  ];
  return fnbKeywords.some((kw) => nameUpper.includes(kw));
};

export const isFnbCulinaryPO = (po?: Partial<PurchaseOrder> | null): boolean => {
  if (!po) return false;
  const poNoUpper = String(po.po_number || '').toUpperCase();
  if (poNoUpper.startsWith('PO-FNB')) return true;
  if (isFnbCulinarySupplier({ name: po.supplier_name })) return true;
  if (Array.isArray(po.item_details) && po.item_details.length > 0) {
    return po.item_details.some((it) => {
      const pid = String(it.product_id || '').toUpperCase();
      return pid.startsWith('RM-FNB-') || pid.startsWith('ING-');
    });
  }
  return false;
};

export const isFnbCulinaryMutation = (m?: Partial<StockMutation> | null): boolean => {
  if (!m) return false;
  const idUpper = String(m.id || '').toUpperCase();
  const prodIdUpper = String(m.product_id || '').toUpperCase();
  const typeUpper = String(m.type || '').toUpperCase();
  const refUpper = String(m.reference_no || '').toUpperCase();
  if (
    idUpper.startsWith('MUT-FNB-') ||
    prodIdUpper.startsWith('RM-FNB-') ||
    prodIdUpper.startsWith('ING-') ||
    typeUpper.includes('RESEP BOM') ||
    typeUpper.includes('PO DAPUR') ||
    refUpper.startsWith('KOT-') ||
    refUpper.includes('PO-FNB')
  ) {
    return true;
  }
  return false;
};

export const filterProductsByBusinessDomain = (
  products: Product[],
  domainConfig?: BusinessDomainConfig | null
): Product[] => {
  if (!domainConfig || domainConfig.isHybridMultiUnit) {
    return products;
  }

  if (domainConfig.mechanismFamily === 'BUILDING_BULK') {
    return products.filter((p) => isBuildingMaterialDomainProduct(p));
  }

  if (domainConfig.mechanismFamily === 'FNB_CULINARY') {
    // Saat FNB_CULINARY aktif & Hybrid OFF, Gudang memuat 20 SKU Bahan Baku Dapur F&B (RM-FNB-001 s.d. RM-FNB-020)
    const map = new Map<string, Product>();
    RAW_INGREDIENTS_AS_PRODUCTS.forEach((rawProd) => {
      map.set(rawProd.id, rawProd);
    });
    (products || []).forEach((p) => {
      if (isFnbRawMaterialProduct(p)) {
        const normId = normalizeFnbRawMaterialId(p.id);
        const base = map.get(normId);
        map.set(normId, base ? { ...base, ...p, id: normId, plu: normId, unit: base.unit || p.unit } : { ...p, id: normId });
      }
    });
    return Array.from(map.values());
  }

  if (domainConfig.mechanismFamily === 'SPECIALTY_SERVICE') {
    if (domainConfig.primaryBusinessModel === 'LAUNDRY') {
      const laundryList = products.filter(
        (p) =>
          p.businessModel === 'laundry' ||
          Boolean(p.laundryUnitType) ||
          String(p.id || '').toUpperCase().startsWith('LND-')
      );
      return laundryList.length > 0 ? laundryList : products.filter((p) => !isBuildingMaterialDomainProduct(p));
    }
    if (domainConfig.primaryBusinessModel === 'FASHION_BUTIK') {
      const fashionList = products.filter(
        (p) =>
          p.businessModel === 'fashion' ||
          String(p.id || '').toUpperCase().startsWith('FASH-') ||
          Boolean(p.variantMatrix?.length || p.variantSize || p.variantColor)
      );
      return fashionList.length > 0 ? fashionList : products.filter((p) => !isBuildingMaterialDomainProduct(p));
    }
    const specList = products.filter(
      (p) =>
        p.businessModel === 'fashion' ||
        p.businessModel === 'electronics' ||
        p.businessModel === 'workshop' ||
        p.businessModel === 'salon' ||
        p.businessModel === 'laundry' ||
        p.businessModel === 'services' ||
        p.itemType === 'SERVICE' ||
        String(p.id || '').toUpperCase().startsWith('FASH-') ||
        String(p.id || '').toUpperCase().startsWith('GAD-') ||
        String(p.id || '').toUpperCase().startsWith('OTO-') ||
        String(p.id || '').toUpperCase().startsWith('SLN-') ||
        String(p.id || '').toUpperCase().startsWith('LND-')
    );
    return specList.length > 0 ? specList : products.filter((p) => !isBuildingMaterialDomainProduct(p));
  }

  // Default: RETAIL_GENERAL -> hide MAT-* building products and RM-FNB-* raw materials when Hybrid is OFF
  return products.filter(
    (p) =>
      !String(p.id || '').toUpperCase().startsWith('MAT-') &&
      p.businessModel !== 'building' &&
      !isFnbRawMaterialProduct(p)
  );
};

export const filterInventoryByBusinessDomain = (
  inventory: InventoryRecord[],
  products: Product[],
  domainConfig?: BusinessDomainConfig | null
): InventoryRecord[] => {
  if (!domainConfig || domainConfig.isHybridMultiUnit) {
    return inventory;
  }
  if (domainConfig.mechanismFamily === 'FNB_CULINARY') {
    const fnbRawProducts = filterProductsByBusinessDomain(products, domainConfig);
    const prodMap = new Map(fnbRawProducts.map((p) => [p.id, p]));
    const invMap = new Map<string, InventoryRecord>();
    RAW_INGREDIENTS_AS_INVENTORY.forEach((rec) => {
      const latestProd = prodMap.get(rec.product_id);
      invMap.set(rec.product_id, {
        ...rec,
        final_stock: latestProd ? latestProd.stock : rec.final_stock,
      });
    });
    (inventory || []).forEach((inv) => {
      const normId = normalizeFnbRawMaterialId(inv.product_id);
      if (prodMap.has(normId)) {
        const latestProd = prodMap.get(normId)!;
        const base = invMap.get(normId);
        invMap.set(normId, {
          ...(base || inv),
          ...inv,
          product_id: normId,
          product_name: latestProd.name,
          final_stock: latestProd.stock,
        });
      }
    });
    return Array.from(invMap.values());
  }

  const allowedProducts = filterProductsByBusinessDomain(products, domainConfig);
  const allowedIds = new Set(allowedProducts.map((p) => p.id));
  const filtered = inventory.filter((inv) => allowedIds.has(inv.product_id));

  if (domainConfig.mechanismFamily === 'SPECIALTY_SERVICE' && domainConfig.primaryBusinessModel === 'FASHION_BUTIK') {
    const existingInvIds = new Set(filtered.map((inv) => inv.product_id));
    const todayStr = new Date().toISOString().slice(0, 10);
    const missingFromInv = allowedProducts
      .filter((p) => !existingInvIds.has(p.id))
      .map((p) => ({
        product_id: p.id,
        product_name: p.name,
        initial_stock: Number(p.stock) || 0,
        in_qty: 0,
        out_qty: 0,
        final_stock: Number(p.stock) || 0,
        last_update: todayStr,
        last_updated: todayStr,
      }));
    return [...filtered, ...missingFromInv];
  }

  return filtered;
};

export const filterMutationsByBusinessDomain = (
  mutations: StockMutation[],
  products: Product[],
  domainConfig?: BusinessDomainConfig | null
): StockMutation[] => {
  if (!domainConfig || domainConfig.isHybridMultiUnit) {
    return mutations;
  }
  const buildingIds = new Set(
    products.filter((p) => isBuildingMaterialDomainProduct(p)).map((p) => p.id)
  );
  if (domainConfig.mechanismFamily === 'BUILDING_BULK') {
    return mutations.filter((m) => isBuildingMaterialMutation(m, buildingIds));
  }
  if (domainConfig.mechanismFamily === 'FNB_CULINARY') {
    const fromState = (mutations || []).filter((m) => isFnbCulinaryMutation(m));
    const seenIds = new Set(fromState.map((m) => m.id));
    const merged = [...fromState];
    FNB_CULINARY_STOCK_MUTATIONS.forEach((seed) => {
      if (!seenIds.has(seed.id)) {
        merged.push(seed);
      }
    });
    return merged;
  }
  return mutations.filter(
    (m) => !isBuildingMaterialMutation(m, buildingIds) && !isFnbCulinaryMutation(m)
  );
};

export const FASHION_APPAREL_SUPPLIERS: SupplierMaster[] = [
  {
    id: 'SUP-FASH-01',
    code: 'SUP-FASH-01',
    name: 'PT Garmen & Konveksi Busana Nusantara',
    contactPerson: 'Hj. Rosidah, SE',
    phone: '0812-3344-5566',
    email: 'order@garmennusantara.co.id',
    address: 'Kawasan Industri Tekstil Blok A-12, Bandung',
    paymentTerms: 'Tempo 30 Hari',
    activePoCount: 2,
    status: 'Active',
  },
  {
    id: 'SUP-FASH-02',
    code: 'SUP-FASH-02',
    name: 'PT Tekstil Rayon & Sutra Indah',
    contactPerson: 'Bpk. Hendra Gunawan',
    phone: '0813-4455-6677',
    email: 'sales@tekstilsutraindah.id',
    address: 'Jl. Industri Kain No. 45, Solo',
    paymentTerms: 'Tempo 30 Hari',
    activePoCount: 1,
    status: 'Active',
  },
  {
    id: 'SUP-FASH-03',
    code: 'SUP-FASH-03',
    name: 'CV Konveksi Busana Muslim & Casual',
    contactPerson: 'Ibu Aminah',
    phone: '0811-5566-7788',
    email: 'konveksi@busanacasual.co.id',
    address: 'Sentra Konveksi Cicalengka Blok B-05, Bandung',
    paymentTerms: 'Tempo 14 Hari',
    activePoCount: 1,
    status: 'Active',
  },
];

export const FASHION_APPAREL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    po_number: 'PO-FASH-2026-001',
    date: '2026-10-15',
    due_date: '2026-11-14',
    supplier_id: 'SUP-FASH-01',
    supplier_name: 'PT Garmen & Konveksi Busana Nusantara',
    items: 'Gamis Silk Humaira (Size M-XL) (100 Pcs), Tunik Katun Rayon Premium (80 Pcs)',
    subtotal: 18500000,
    include_ppn: true,
    ppn_rate: 11,
    ppn_amount: 2035000,
    total_amount: 20535000,
    status: 'APPROVED',
    payment_term: 'Tempo 30 Hari',
    payment_status: 'Belum Bayar',
    approved_by: 'Manajer Butik & Fashion',
    notes: 'Restock koleksi busana muslim dan tunik premium untuk persiapan musim liburan.',
    item_details: [
      {
        product_id: 'FASH-001',
        product_name: 'Gamis Silk Humaira',
        qty: 100,
        received_qty: 100,
        unit_cost: 110000,
        subtotal: 11000000,
        unit: 'Pcs',
      },
      {
        product_id: 'FASH-002',
        product_name: 'Tunik Katun Rayon Premium',
        qty: 80,
        received_qty: 80,
        unit_cost: 93750,
        subtotal: 7500000,
        unit: 'Pcs',
      },
    ],
  },
];

const NON_FASHION_VENDOR_KEYWORDS = [
  'INDOFOOD',
  'NESTLE',
  'KAO',
  'UNILEVER',
  'WINGS',
  'MAYORA',
  'DANCOW',
  'BIMOLI',
  'ATTACK',
  'TIRTA INVESTAMA',
  'SANTOS JAYA',
  'ULTRAJAYA',
  'FRISIAN FLAG',
  'COCA-COLA',
  'MAYA MUNCAR',
  'WILMAR NABATI',
  'UNI-CHARM',
  'UNZA VITALIS',
  'TEMPO SCAN',
  'INTERNATIONAL CHEMICAL',
  'SO GOOD',
  'NIPPON INDOSARI',
  'SURYA NUSANTARA ELEKTRONIK',
  'MITRA GLOBAL TEKNOLOGI',
  'DISTRIBUTOR KOMPUTER',
  'ANEKA JAYA SUPPLY',
  'DIGITAL SOLUSINDO',
  'TEKNOLOGI',
  'ELEKTRONIK',
  'KOMPUTER',
  'QUARRY',
  'KRAKATAU',
  'TONASA',
  'TIGA RODA',
  'DULUX',
  'JOTUN',
  'BANGUN JAYA',
  'KARYA MANDIRI',
  'MAJU KONSTRUKSI',
  'KOPI NUSANTARA',
  'ROASTERY',
  'PRIME MEAT',
  'COLDSTORAGE',
  'ARTISAN BAKERY',
  'DAIRY SUPPLY',
  'PANGAN KULINER',
  'ECO PACKINDO',
];

export const isFashionApparelSupplier = (s?: Partial<SupplierMaster> | { name?: string } | null): boolean => {
  if (!s) return false;
  const idUpper = String((s as SupplierMaster).id || '').toUpperCase();
  const nameUpper = String(s.name || '').toUpperCase();
  if (idUpper.startsWith('SUP-FASH')) return true;
  const fashionKeywords = ['GARMEN', 'KONVEKSI', 'TEKSTIL', 'KAIN', 'FASHION', 'BUTIK', 'BUSANA'];
  if (fashionKeywords.some((kw) => nameUpper.includes(kw))) {
    if (NON_FASHION_VENDOR_KEYWORDS.some((kw) => nameUpper.includes(kw))) return false;
    return true;
  }
  return false;
};

export const isFashionApparelPO = (po?: Partial<PurchaseOrder> | null): boolean => {
  if (!po) return false;
  const poNoUpper = String(po.po_number || '').toUpperCase();
  if (poNoUpper.startsWith('PO-FASH')) return true;
  if (isFashionApparelSupplier({ name: po.supplier_name })) return true;
  if (Array.isArray(po.item_details) && po.item_details.length > 0) {
    return po.item_details.some((it) => {
      const pid = String(it.product_id || '').toUpperCase();
      return pid.startsWith('FASH-');
    });
  }
  return false;
};

export const LEDGER_RESET_ACTIVE_ENTITY_KEY = 'jacs_retailos_erp_v2_2_ledger_reset_active_entity';

export const isLedgerResetToActiveEntity = (): boolean => {
  if (isDemoSandboxMode()) return false;
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(LEDGER_RESET_ACTIVE_ENTITY_KEY) === 'true';
  } catch {
    return false;
  }
};

export const filterPurchaseOrdersByBusinessDomain = (
  purchaseOrders: PurchaseOrder[],
  domainConfig?: BusinessDomainConfig | null,
  skipDemoSeeds?: boolean
): PurchaseOrder[] => {
  const suppressSeeds = Boolean(skipDemoSeeds) || isLedgerResetToActiveEntity();
  if (!domainConfig || domainConfig.isHybridMultiUnit) {
    return purchaseOrders;
  }
  if (domainConfig.mechanismFamily === 'BUILDING_BULK') {
    return purchaseOrders.filter((po) => isBuildingMaterialPO(po));
  }
  if (domainConfig.mechanismFamily === 'FNB_CULINARY') {
    const fromState = (purchaseOrders || []).filter((po) => isFnbCulinaryPO(po));
    if (suppressSeeds) return fromState;
    const seen = new Set(fromState.map((po) => po.po_number));
    const merged = [...fromState];
    FNB_CULINARY_PURCHASE_ORDERS.forEach((seed) => {
      if (!seen.has(seed.po_number)) {
        merged.push(seed);
      }
    });
    return merged;
  }
  if (domainConfig.mechanismFamily === 'SPECIALTY_SERVICE' && domainConfig.primaryBusinessModel === 'FASHION_BUTIK') {
    const fromState = (purchaseOrders || []).filter((po) => {
      const poNoUpper = String(po.po_number || '').toUpperCase();
      const supNameUpper = String(po.supplier_name || '').toUpperCase();
      if (poNoUpper.startsWith('PO-FASH')) return true;
      if (NON_FASHION_VENDOR_KEYWORDS.some((kw) => supNameUpper.includes(kw))) return false;
      if (isBuildingMaterialPO(po) || isFnbCulinaryPO(po)) return false;
      return true;
    });
    if (suppressSeeds) return fromState;
    const seen = new Set(fromState.map((po) => po.po_number));
    const merged = [...fromState];
    FASHION_APPAREL_PURCHASE_ORDERS.forEach((seed) => {
      if (!seen.has(seed.po_number)) {
        merged.push(seed);
      }
    });
    return merged;
  }
  return purchaseOrders.filter((po) => !isBuildingMaterialPO(po) && !isFnbCulinaryPO(po));
};

export const filterPurchaseRequestsByBusinessDomain = (
  purchaseRequests: PurchaseRequest[],
  domainConfig?: BusinessDomainConfig | null,
  skipDemoSeeds?: boolean
): PurchaseRequest[] => {
  const suppressSeeds = Boolean(skipDemoSeeds) || isLedgerResetToActiveEntity();
  if (!domainConfig || domainConfig.isHybridMultiUnit) {
    return purchaseRequests;
  }
  if (domainConfig.mechanismFamily === 'BUILDING_BULK') {
    return purchaseRequests.filter((pr) => isBuildingMaterialPR(pr));
  }
  if (domainConfig.mechanismFamily === 'FNB_CULINARY') {
    const fromState = (purchaseRequests || []).filter(
      (pr) =>
        String(pr.pr_number || '').toUpperCase().startsWith('PR-FNB') ||
        String(pr.item_name || '').toUpperCase().includes('RM-FNB-') ||
        String(pr.department || '').toUpperCase().includes('DAPUR') ||
        String(pr.department || '').toUpperCase().includes('BARISTA')
    );
    if (suppressSeeds) return fromState;
    const seen = new Set(fromState.map((pr) => pr.pr_number));
    const merged = [...fromState];
    FNB_CULINARY_PURCHASE_REQUESTS.forEach((seed) => {
      if (!seen.has(seed.pr_number)) {
        merged.push(seed);
      }
    });
    return merged;
  }
  return purchaseRequests.filter(
    (pr) =>
      !isBuildingMaterialPR(pr) &&
      !String(pr.pr_number || '').toUpperCase().startsWith('PR-FNB') &&
      !String(pr.item_name || '').toUpperCase().includes('RM-FNB-')
  );
};

export const filterSuppliersByBusinessDomain = (
  suppliers: SupplierMaster[],
  domainConfig?: BusinessDomainConfig | null
): SupplierMaster[] => {
  if (!domainConfig || domainConfig.isHybridMultiUnit) {
    return suppliers;
  }
  if (domainConfig.mechanismFamily === 'BUILDING_BULK') {
    return suppliers.filter((s) => isBuildingMaterialSupplier(s));
  }
  if (domainConfig.mechanismFamily === 'FNB_CULINARY') {
    const fromState = (suppliers || []).filter((s) => isFnbCulinarySupplier(s));
    const seen = new Set(fromState.map((s) => s.id));
    const merged = [...fromState];
    FNB_CULINARY_SUPPLIERS.forEach((seed) => {
      if (!seen.has(seed.id)) {
        merged.push(seed);
      }
    });
    return merged;
  }
  if (domainConfig.mechanismFamily === 'SPECIALTY_SERVICE' && domainConfig.primaryBusinessModel === 'FASHION_BUTIK') {
    const fromState = (suppliers || []).filter((s) => {
      const nameUpper = String(s.name || '').toUpperCase();
      const idUpper = String(s.id || '').toUpperCase();
      if (idUpper.startsWith('SUP-FASH')) return true;
      if (NON_FASHION_VENDOR_KEYWORDS.some((kw) => nameUpper.includes(kw))) return false;
      if (isBuildingMaterialSupplier(s) || isFnbCulinarySupplier(s)) return false;
      return true;
    });
    const seen = new Set(fromState.map((s) => s.id));
    const merged = [...fromState];
    FASHION_APPAREL_SUPPLIERS.forEach((seed) => {
      if (!seen.has(seed.id)) {
        merged.push(seed);
      }
    });
    return merged;
  }
  return suppliers.filter((s) => !isBuildingMaterialSupplier(s) && !isFnbCulinarySupplier(s));
};

export const filterGoodsReceiptsByBusinessDomain = (
  goodsReceipts: GoodsReceipt[],
  domainConfig?: BusinessDomainConfig | null
): GoodsReceipt[] => {
  if (!domainConfig || domainConfig.isHybridMultiUnit) {
    return goodsReceipts;
  }
  if (domainConfig.mechanismFamily === 'BUILDING_BULK') {
    return goodsReceipts.filter((gr) => isBuildingMaterialGoodsReceipt(gr));
  }
  if (domainConfig.mechanismFamily === 'FNB_CULINARY') {
    const fromState = (goodsReceipts || []).filter(
      (gr) =>
        String(gr.id || '').toUpperCase().startsWith('GRN-FNB') ||
        String(gr.poNumber || '').toUpperCase().startsWith('PO-FNB') ||
        isFnbCulinarySupplier({ name: gr.vendorName })
    );
    if (isLedgerResetToActiveEntity()) return fromState;
    const seen = new Set(fromState.map((gr) => gr.id));
    const merged = [...fromState];
    FNB_CULINARY_GOODS_RECEIPTS.forEach((seed) => {
      if (!seen.has(seed.id)) {
        merged.push(seed);
      }
    });
    return merged;
  }
  return goodsReceipts.filter(
    (gr) =>
      !isBuildingMaterialGoodsReceipt(gr) &&
      !String(gr.id || '').toUpperCase().startsWith('GRN-FNB') &&
      !String(gr.poNumber || '').toUpperCase().startsWith('PO-FNB')
  );
};

const NON_MINIMARKET_VENDOR_KEYWORDS = [
  'MITRA GLOBAL TEKNOLOGI',
  'SURYA NUSANTARA ELEKTRONIK',
  'DISTRIBUTOR KOMPUTER',
  'ANEKA JAYA SUPPLY',
  'TEKNOLOGI',
  'ELEKTRONIK',
  'KOMPUTER',
  'KONSTRUKSI',
  'MAJU KONSTRUKSI',
  'BANGUN JAYA',
  'KARYA MANDIRI',
  'DIGITAL SOLUSINDO',
  'QUARRY',
  'KRAKATAU',
  'TONASA',
  'TIGA RODA',
  'DULUX',
  'JOTUN',
  'BENGKEL',
  'OTOMOTIF',
  'BARBERSHOP',
  'ROASTERY',
  'PRIME MEAT',
  'COLDSTORAGE',
  'ARTISAN BAKERY',
  'ECO PACKINDO',
];

const NON_FNB_VENDOR_KEYWORDS = [
  'SURYA NUSANTARA ELEKTRONIK',
  'MITRA GLOBAL TEKNOLOGI',
  'DISTRIBUTOR KOMPUTER',
  'NESTLE',
  'KAO',
  'INDOFOOD',
  'UNILEVER',
  'WINGS',
  'MAYORA',
  'DIGITAL SOLUSINDO',
  'PRIMA KARYA MANDIRI',
  'MAJU KONSTRUKSI',
  'BANGUN JAYA',
  'QUARRY',
  'KRAKATAU',
  'TONASA',
  'TIGA RODA',
  'DULUX',
  'JOTUN',
  'ELEKTRONIK',
  'KOMPUTER',
];

export const isPayableApInvoiceRecord = (inv?: Partial<InvoiceDue> | null): boolean => {
  if (!inv) return false;
  const typeUpper = String(inv.type || '').toUpperCase();
  const idUpper = String(inv.id || '').toUpperCase();
  const invNoUpper = String(inv.invoice_number || '').toUpperCase();
  const partyUpper = String(inv.party_name || inv.vendor || '').toUpperCase();

  // Strictly exclude Accounts Receivable (INV-AR-*, RECEIVABLE, customer/contractor AR)
  if (
    typeUpper === 'RECEIVABLE' ||
    typeUpper === 'AR' ||
    idUpper.startsWith('INV-AR') ||
    idUpper.startsWith('AR-') ||
    invNoUpper.startsWith('INV-AR') ||
    invNoUpper.startsWith('JACS-CORP') ||
    invNoUpper.startsWith('RCP-') ||
    partyUpper.includes('KONSTRUKSI')
  ) {
    return false;
  }

  return true;
};

export const isApInvoiceUnpaid = (status?: string, amount?: number): boolean => {
  if (typeof amount === 'number' && amount <= 0) return false;
  const s = String(status || '').trim();
  if (!s) return true;
  const upper = s.toUpperCase();
  if (upper === 'PAID' || upper === 'LUNAS') return false;
  return (
    upper === 'UNPAID' ||
    upper === 'OVERDUE' ||
    upper === 'PARTIAL' ||
    upper === 'BELUM BAYAR' ||
    upper === 'JATUH TEMPO' ||
    upper === 'PENDING'
  );
};

export const buildDomainIsolatedApInvoices = (
  invoicesDue: InvoiceDue[] = [],
  purchasing: PurchaseOrder[] = [],
  domainConfig?: BusinessDomainConfig | null,
  skipDemoSeeds?: boolean
): InvoiceDue[] => {
  const suppressSeeds = Boolean(skipDemoSeeds) || isLedgerResetToActiveEntity();
  if (suppressSeeds && (invoicesDue || []).length === 0 && (purchasing || []).length === 0) {
    return [];
  }
  const isHybrid = Boolean(domainConfig?.isHybridMultiUnit);
  const family = domainConfig?.mechanismFamily || 'RETAIL_GENERAL';

  const matchesDomainVendor = (
    vendorName: string,
    poNumber?: string,
    poRecord?: Partial<PurchaseOrder> | null
  ): boolean => {
    const vUpper = String(vendorName || '').toUpperCase();
    const poUpper = String(poNumber || '').toUpperCase();

    if (isHybrid || !domainConfig) {
      return true;
    }

    const isBuilding =
      poUpper.startsWith('PO-BLD') ||
      isBuildingMaterialSupplier({ name: vendorName }) ||
      (poRecord ? isBuildingMaterialPO(poRecord) : false);

    const isFnb =
      poUpper.startsWith('PO-FNB') ||
      isFnbCulinarySupplier({ name: vendorName }) ||
      (poRecord ? isFnbCulinaryPO(poRecord) : false);

    if (family === 'BUILDING_BULK') {
      return isBuilding;
    }

    if (family === 'FNB_CULINARY') {
      if (NON_FNB_VENDOR_KEYWORDS.some((kw) => vUpper.includes(kw))) {
        return false;
      }
      if (isBuilding) return false;
      return isFnb || poUpper.startsWith('PO-FNB') || poUpper.startsWith('INV-AP-FNB');
    }

    if (family === 'SPECIALTY_SERVICE' && domainConfig?.primaryBusinessModel === 'FASHION_BUTIK') {
      if (NON_FASHION_VENDOR_KEYWORDS.some((kw) => vUpper.includes(kw))) {
        return false;
      }
      if (isBuilding || isFnb) return false;
      return true;
    }

    if (isBuilding || isFnb) {
      return false;
    }

    if (family === 'RETAIL_GENERAL') {
      if (NON_MINIMARKET_VENDOR_KEYWORDS.some((kw) => vUpper.includes(kw))) {
        return false;
      }
      if (poRecord && Array.isArray(poRecord.item_details)) {
        const hasItHardware = poRecord.item_details.some((d) =>
          String(d.product_id || '').toUpperCase().startsWith('PRD-0')
        );
        if (hasItHardware) return false;
      }
      return true;
    }

    return true;
  };

  const map = new Map<string, InvoiceDue>();

  // Saat FNB_CULINARY atau FASHION_BUTIK aktif, sertakan purchase orders domain terkait (tanpa fallback seed bila buku besar telah di-reset)
  const effectivePurchasing =
    !isHybrid && (family === 'FNB_CULINARY' || (family === 'SPECIALTY_SERVICE' && domainConfig?.primaryBusinessModel === 'FASHION_BUTIK'))
      ? filterPurchaseOrdersByBusinessDomain(purchasing, domainConfig, suppressSeeds)
      : purchasing || [];

  (invoicesDue || []).forEach((inv) => {
    if (!isPayableApInvoiceRecord(inv)) return;
    const vendorName = inv.party_name || inv.vendor || '';
    if (!matchesDomainVendor(vendorName, inv.po_number)) return;
    const key = inv.po_number || inv.id;
    map.set(key, {
      ...inv,
      type: 'PAYABLE',
      party_name: vendorName || 'Supplier Umum',
      vendor: inv.vendor || vendorName || 'Supplier Umum',
    });
  });

  effectivePurchasing.forEach((po) => {
    const isReceived =
      po.status === 'RECEIVED' ||
      po.status === 'COMPLETED' ||
      po.status === 'Selesai' ||
      po.status === 'APPROVED' ||
      po.status === 'Approved' ||
      (family === 'FNB_CULINARY' && po.po_number.startsWith('PO-FNB-')) ||
      (family === 'SPECIALTY_SERVICE' && domainConfig?.primaryBusinessModel === 'FASHION_BUTIK' && po.po_number.startsWith('PO-FASH-'));
    if (!isReceived) return;
    const vendorName = po.supplier_name || (po as any).vendor_name || 'Supplier Umum';
    if (!matchesDomainVendor(vendorName, po.po_number, po)) return;
    if (map.has(po.po_number)) return;

    map.set(po.po_number, {
      id: `INV-AP-${po.po_number}`,
      type: 'PAYABLE',
      invoice_number: `INV-AP/${po.po_number}`,
      po_number: po.po_number,
      party_name: vendorName,
      vendor: vendorName,
      amount: po.total_amount,
      due_date: po.due_date || po.date || new Date().toISOString().split('T')[0],
      status: po.payment_status === 'Lunas' ? 'PAID' : 'UNPAID',
      paidAt: po.paid_date,
      terms: po.payment_term,
    });
  });

  return Array.from(map.values());
};

export const FNB_CULINARY_AR_INVOICES: InvoiceDue[] = [
  {
    id: 'INV-AR-FNB-001',
    type: 'RECEIVABLE',
    invoice_number: 'INV-FNB/CAT-2026-001',
    party_name: 'Katering Event Bank Mandiri (120 Pax)',
    vendor: 'Katering Event Bank Mandiri (120 Pax)',
    amount: 6400000,
    due_date: '2026-10-12',
    status: 'UNPAID',
    terms: 'Tempo 14 Hari',
  },
  {
    id: 'INV-AR-FNB-002',
    type: 'RECEIVABLE',
    invoice_number: 'INV-FNB/VIP-2026-002',
    party_name: 'Coffee Break & Pastry Seminar BUMN',
    vendor: 'Coffee Break & Pastry Seminar BUMN',
    amount: 3250000,
    due_date: '2026-10-18',
    status: 'UNPAID',
    terms: 'Tempo 14 Hari',
  },
];

export const filterArInvoicesByBusinessDomain = (
  arInvoices: InvoiceDue[] = [],
  domainConfig?: BusinessDomainConfig | null
): InvoiceDue[] => {
  if (!domainConfig || domainConfig.isHybridMultiUnit) {
    return arInvoices;
  }
  const family = domainConfig.mechanismFamily;

  if (family === 'FNB_CULINARY') {
    const filtered = (arInvoices || []).filter((inv) => {
      const partyUpper = String(inv.party_name || inv.vendor || '').toUpperCase();
      const invUpper = String(inv.invoice_number || inv.id || '').toUpperCase();
      if (NON_FNB_VENDOR_KEYWORDS.some((kw) => partyUpper.includes(kw))) {
        return false;
      }
      if (invUpper.includes('JACS-CORP') || invUpper.includes('BLD')) {
        return false;
      }
      return true;
    });
    const seen = new Set(filtered.map((i) => i.id));
    const merged = [...filtered];
    FNB_CULINARY_AR_INVOICES.forEach((seed) => {
      if (!seen.has(seed.id)) {
        merged.push(seed);
      }
    });
    return merged;
  }

  if (family === 'BUILDING_BULK') {
    return (arInvoices || []).filter((inv) => {
      const partyUpper = String(inv.party_name || inv.vendor || '').toUpperCase();
      if (partyUpper.includes('DIGITAL SOLUSINDO') || partyUpper.includes('PRIMA KARYA MANDIRI')) {
        return false;
      }
      return true;
    });
  }

  if (family === 'RETAIL_GENERAL') {
    return (arInvoices || []).filter((inv) => {
      const partyUpper = String(inv.party_name || inv.vendor || '').toUpperCase();
      if (
        partyUpper.includes('DIGITAL SOLUSINDO') ||
        partyUpper.includes('PRIMA KARYA MANDIRI') ||
        partyUpper.includes('KONSTRUKSI') ||
        partyUpper.includes('BANGUN JAYA')
      ) {
        return false;
      }
      return true;
    });
  }

  return arInvoices;
};


