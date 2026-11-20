export interface ExecutiveRecommendation {
  id: string;
  kategori: string;
  tingkat_urgensi: 'KRITIS' | 'PERHATIAN' | 'OPTIMAL';
  fakta_data: string;
  saran_tindakan: string;
  aksi_target: string;
  tacticalType?: 'BUNDLING' | 'RESTOCK_CHECK' | 'GENERAL';
  tacticalPayload?: {
    deadstockName?: string;
    fastName?: string;
    maxDiscountPercent?: number;
    deadstockId?: string;
    fastId?: string;
    estimatedRestockCost?: number;
    restockPlafon?: number;
  };
}

export interface ExecutiveSnapshot {
  totalOmzet: number;
  liquidCash: number;
  pendingPrPoCount: number;
  apDueThisWeek: number;
  criticalStockCount: number;
  deadStockCount: number;
  blindShiftVarianceCount: number;
  restockPlafonAmount: number;
  estimatedRestockCostTotal: number;
  sampleDeadstock?: { id: string; name: string; cost: number; price: number };
  sampleFastMoving?: { id: string; name: string; cost: number; price: number };
}

export async function fetchExecutiveAiAdvice(snapshot: ExecutiveSnapshot): Promise<ExecutiveRecommendation[]> {
  // Deterministic local intelligent analytics engine based on real ERP data (zero network calls, zero PROXY_GENERATION_DISABLED errors)
  const fallbackRecs: ExecutiveRecommendation[] = [];

  // 1. Bundling Deadstock + Fast-Moving
  const dsName = snapshot.sampleDeadstock?.name || 'Produk Deadstock Mengendap';
  const fmName = snapshot.sampleFastMoving?.name || 'Produk Fast-Moving Anchor';
  const dsPrice = snapshot.sampleDeadstock?.price || 50000;
  const dsCost = snapshot.sampleDeadstock?.cost || 30000;
  const maxDiscount = Math.min(25, Math.max(5, Math.floor(((dsPrice - dsCost) / dsPrice) * 100)));

  fallbackRecs.push({
    id: 'fallback-bundling',
    kategori: 'INVENTORI & BUNDLING',
    tingkat_urgensi: snapshot.deadStockCount > 0 ? 'KRITIS' : 'OPTIMAL',
    fakta_data: `Deadstock: ${snapshot.deadStockCount} SKU • Kombinasi: ${dsName} + ${fmName}`,
    saran_tindakan: `Saran Bundling Taktis: Pasangkan ${dsName} dengan ${fmName}. Batas diskon maksimal adalah ${maxDiscount}% agar margin kotor tetap positif.`,
    aksi_target: 'deadstock',
    tacticalType: 'BUNDLING',
    tacticalPayload: {
      deadstockName: dsName,
      fastName: fmName,
      maxDiscountPercent: maxDiscount,
      deadstockId: snapshot.sampleDeadstock?.id,
      fastId: snapshot.sampleFastMoving?.id,
    }
  });

  // 2. Prioritas Restock & Pagu Kas
  const isRestockOverPlafon = snapshot.estimatedRestockCostTotal > snapshot.restockPlafonAmount;
  fallbackRecs.push({
    id: 'fallback-restock',
    kategori: 'PENGADAAN & PAGU KAS',
    tingkat_urgensi: isRestockOverPlafon ? 'KRITIS' : 'PERHATIAN',
    fakta_data: `Estimasi Restock: Rp ${snapshot.estimatedRestockCostTotal.toLocaleString('id-ID')} vs Plafon: Rp ${snapshot.restockPlafonAmount.toLocaleString('id-ID')}`,
    saran_tindakan: isRestockOverPlafon
      ? 'Estimasi restock kritis melampaui sisa pagu anggaran restock. Wajib melalui otorisasi dan persetujuan direksi.'
      : 'Estimasi restock dalam batas aman pagu anggaran pengadaan.',
    aksi_target: 'approval',
    tacticalType: 'RESTOCK_CHECK',
    tacticalPayload: {
      estimatedRestockCost: snapshot.estimatedRestockCostTotal,
      restockPlafon: snapshot.restockPlafonAmount,
    }
  });

  // 3. AP Aging vs Kas Liquid
  if (snapshot.apDueThisWeek > snapshot.liquidCash) {
    fallbackRecs.push({
      id: 'fallback-ap',
      kategori: 'KEUANGAN & KAS',
      tingkat_urgensi: 'KRITIS',
      fakta_data: `AP Jatuh Tempo: Rp ${snapshot.apDueThisWeek.toLocaleString('id-ID')} vs Kas: Rp ${snapshot.liquidCash.toLocaleString('id-ID')}`,
      saran_tindakan: 'Tagihan vendor minggu ini melebihi kas liquid. Prioritaskan pelunasan faktur kritikal.',
      aksi_target: 'cashflow',
      tacticalType: 'GENERAL',
    });
  } else {
    fallbackRecs.push({
      id: 'fallback-ap',
      kategori: 'KEUANGAN & KAS',
      tingkat_urgensi: 'OPTIMAL',
      fakta_data: `Kas Liquid: Rp ${snapshot.liquidCash.toLocaleString('id-ID')} (Aman)`,
      saran_tindakan: 'Posisi kas likuid stabil terhadap kewajiban hutang dagang minggu berjalan.',
      aksi_target: 'cashflow',
      tacticalType: 'GENERAL',
    });
  }

  // 4. Audit & Blind Shift
  fallbackRecs.push({
    id: 'fallback-audit',
    kategori: 'AUDIT & OPERASIONAL',
    tingkat_urgensi: snapshot.blindShiftVarianceCount > 0 ? 'PERHATIAN' : 'OPTIMAL',
    fakta_data: `${snapshot.blindShiftVarianceCount} Anomali / Selisih Blind Shift`,
    saran_tindakan: snapshot.blindShiftVarianceCount > 0 ? 'Periksa log kasir dan lakukan pembekuan terminal jika ditemukan ketidaksesuaian.' : 'Integritas kasir terjaga sempurna tanpa selisih kas.',
    aksi_target: 'fraud',
    tacticalType: 'GENERAL',
  });

  // 5. Promo & Harga Musiman / FEFO Auto-Draft
  fallbackRecs.push({
    id: 'fallback-promo',
    kategori: 'PROMO & HARGA MUSIMAN',
    tingkat_urgensi: snapshot.deadStockCount > 0 ? 'KRITIS' : 'OPTIMAL',
    fakta_data: `Deteksi Stok Mendekati Expired / Deadstock: ${snapshot.deadStockCount} SKU`,
    saran_tindakan: 'Gunakan fitur Auto-Draft FEFO dan template event musiman di tab Promo & Harga Musiman untuk eksekusi clearance dan bundel.',
    aksi_target: 'promo_campaign',
    tacticalType: 'BUNDLING',
  });

  return fallbackRecs;
}
