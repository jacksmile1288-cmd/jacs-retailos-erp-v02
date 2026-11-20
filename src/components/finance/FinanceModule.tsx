import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAudit } from '../../audit';
import { LedgerTable } from './LedgerTable';
import { AccountsPayableTab } from './AccountsPayableTab';
import { AccountsReceivableTab } from './AccountsReceivableTab';
import { FinancialReportsTab } from './FinancialReportsTab';
import { CashReconciliationTab } from './CashReconciliationTab';
import { PromoAuditRebateTab } from './PromoAuditRebateTab';
import { JournalVoucherModal } from './JournalVoucherModal';
import { CashEntryModal } from './CashEntryModal';
import MasterDataModule from '../master/MasterDataModule';
import {
  Wallet,
  TrendingUp,
  ArrowDownRight,
  CreditCard,
  Printer,
  Database,
  Receipt,
  Truck,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  CheckCircle2,
  Shirt,
  Tag,
} from 'lucide-react';
import { estimateFleetDeliveryExpense } from '../../utils/buildingTierPricing';
import { calculateFashionFinanceSummary } from '../../utils/fashionAnalytics';
import { getEffectiveBusinessDomainConfig } from '../../utils/businessDomainConfig';
import {
  buildDomainIsolatedApInvoices,
  isApInvoiceUnpaid,
  filterArInvoicesByBusinessDomain,
  filterProductsByBusinessDomain,
} from '../../utils/buildingDomainIsolation';

export const FinanceModule: React.FC = () => {
  const {
    finance,
    sales,
    invoicesDue,
    invoicesReceivable,
    purchasing,
    cashierShifts,
    supplierRebateClaims,
    products,
    businessProfile,
    theme,
    postGeneralJournalVoucher,
    language,
    showJournalModal,
    setShowJournalModal,
    journalVoucherInitialData,
    setJournalVoucherInitialData,
    getLiquidCashBalance,
    activeUser,
    currentUser,
    businessDomainConfig,
    laundryOrders,
    isLedgerReset,
  } = useApp();

  const { recordAudit } = useAudit();
  const isLight = theme === 'light';
  const isEn = language === 'en';
  const effectiveDomainConfig = useMemo(
    () => businessDomainConfig || getEffectiveBusinessDomainConfig(businessProfile),
    [businessDomainConfig, businessProfile]
  );
  const isBuildingBulkActive = effectiveDomainConfig.mechanismFamily === 'BUILDING_BULK';
  const isLaundryActive = effectiveDomainConfig.primaryBusinessModel === 'LAUNDRY';
  const isFashionActive = effectiveDomainConfig.primaryBusinessModel === 'FASHION_BUTIK';

  const [financeMainTab, setFinanceMainTab] = useState('ledger');
  const [showCashEntryModal, setShowCashEntryModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const tabScrollRef = useRef<HTMLDivElement | null>(null);

  const handleScrollTabs = (direction: 'left' | 'right') => {
    if (!tabScrollRef.current) return;
    const offset = direction === 'left' ? -260 : 260;
    tabScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const effectiveUser = currentUser || activeUser;

  const t = {
    header: isEn ? 'FINANCIAL CENTER & GENERAL LEDGER' : 'PUSAT KEUANGAN & BUKU BESAR',
    btnCash: isEn ? '+ Cash In/Out' : '+ Kas Masuk/Keluar',
    btnJournal: isEn ? '+ Journal Adjustment / COA' : '+ Jurnal Koreksi / COA',
    btnPrint: isEn ? 'Print / Export' : 'Cetak / Export',
    cardCash: isEn ? 'Cash & Bank Balance' : 'Saldo Kas & Bank',
    cardGross: isEn ? 'Real Gross Profit' : 'Laba Kotor Riil',
    cardAP: isEn ? 'Accounts Payable (AP)' : 'Hutang Usaha (AP)',
    cardFlow: isEn ? 'Daily Cash Flow' : 'Arus Kas Harian',
    tabLedger: isEn ? 'General Ledger & Cash' : 'Buku Besar & Kas',
    tabAP: isEn ? 'Accounts Payable (AP)' : 'Hutang Dagang (AP)',
    tabAR: isEn ? 'Accounts Receivable (AR)' : 'Piutang Usaha (AR)',
    tabReports: isEn ? 'Financial Reports' : 'Laporan Keuangan',
    tabRecon: isEn ? 'Shift Reconciliation' : 'Rekonsiliasi Shift',
    tabPromoAudit: isEn ? 'Promo Expense & Supplier Rebates' : 'Audit Beban Promo & Klaim Supplier',
    tabMaster: isEn ? 'Master Data & Pricing' : 'Data Master & Harga',
  };

  const liquidCashBalance = getLiquidCashBalance();

  // Normalisasi label kategori Buku Besar berdasarkan rumpun usaha aktif
  const domainAlignedFinance = useMemo(() => {
    if (!isBuildingBulkActive) return finance;
    return finance.map((entry) => {
      const catUpper = (entry.category || '').trim().toUpperCase();
      if (catUpper === 'PENJUALAN POS RITEL' || catUpper === 'PENDAPATAN PENJUALAN MATERIAL') {
        return {
          ...entry,
          category: 'PENJUALAN DEPO MATERIAL',
          account_target: entry.account_target || '4-10101 · Pendapatan Penjualan Material',
        };
      }
      if (!entry.account_target) {
        if (catUpper === 'HPP') {
          return { ...entry, account_target: '5-10101 · Harga Pokok Penjualan (HPP)' };
        }
        if (catUpper.includes('MODAL KAS')) {
          return { ...entry, account_target: '1-10002 · Bank Operasional' };
        }
      }
      return entry;
    });
  }, [finance, isBuildingBulkActive]);

  // Helper: identifikasi apakah entri merupakan transaksi pembukaan modal / saldo awal / neraca (bukan pendapatan penjualan 4-*)
  const isOpeningOrBalanceSheetEntry = (f: typeof domainAlignedFinance[0]): boolean => {
    const idUpper = (f.id || '').toUpperCase();
    const refUpper = (f.reference || '').toUpperCase();
    const catUpper = (f.category || '').toUpperCase();
    const target = (f.account_target || '').trim();
    const descUpper = (f.description || '').toUpperCase();

    if (
      idUpper === 'FIN-OPENING-001' ||
      idUpper.startsWith('FIN-OPENING') ||
      refUpper.startsWith('CAP-') ||
      catUpper.includes('MODAL KAS') ||
      catUpper.includes('SALDO AWAL') ||
      catUpper.includes('SETORAN MODAL') ||
      catUpper.includes('PELUNASAN PIUTANG') ||
      catUpper.includes('UANG MUKA') ||
      descUpper.includes('SALDO AWAL KAS') ||
      target.startsWith('3-') ||
      target.startsWith('1-') ||
      target.startsWith('2-')
    ) {
      return true;
    }
    return false;
  };

  const isContraRevenueEntry = (f: typeof domainAlignedFinance[0]): boolean => {
    const target = (f.account_target || '').trim();
    const catUpper = (f.category || '').toUpperCase();
    const idUpper = (f.id || '').toUpperCase();
    return (
      idUpper.startsWith('FIN-FASH-DISC-') ||
      target.startsWith('4-10004') ||
      target.startsWith('4-10002') ||
      catUpper.includes('POTONGAN & DISKON PENJUALAN') ||
      catUpper.includes('RETUR PENJUALAN')
    );
  };

  const isSalesRevenueEntry = (f: typeof domainAlignedFinance[0]): boolean => {
    if (isOpeningOrBalanceSheetEntry(f)) return false;
    if (isContraRevenueEntry(f)) return false;
    const typeUpper = (f.type || '').toUpperCase();
    const target = (f.account_target || '').trim();
    const catUpper = (f.category || '').toUpperCase();
    if (target.startsWith('4-')) return true;
    if (typeUpper === 'INCOME' || typeUpper === 'IN / PENDAPATAN') {
      return (
        catUpper.includes('PENJUALAN') ||
        catUpper.includes('PENDAPATAN') ||
        catUpper.includes('JASA BONGKAR') ||
        !target
      );
    }
    return false;
  };

  const isCogsHppEntry = (f: typeof domainAlignedFinance[0]): boolean => {
    const t = (f.type || '').toUpperCase();
    const cat = (f.category || '').toUpperCase();
    const target = (f.account_target || '').trim();
    return (
      t === 'HPP / BEBAN POKOK' ||
      cat === 'HPP' ||
      cat === 'BEBAN BAHAN HABIS PAKAI JASA' ||
      cat.includes('SUSUT MATERIAL') ||
      target.startsWith('5-10001') ||
      target.startsWith('5-10101') ||
      target.startsWith('5-10302') ||
      target.startsWith('5-10003')
    );
  };

  const realGrossProfit = useMemo(() => {
    const grossSalesRevenue = domainAlignedFinance
      .filter((f) => isSalesRevenueEntry(f))
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);
    const contraRevenueDiscounts = domainAlignedFinance
      .filter((f) => isContraRevenueEntry(f))
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);
    const hpp = domainAlignedFinance
      .filter((f) => isCogsHppEntry(f))
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);
    return grossSalesRevenue - contraRevenueDiscounts - hpp;
  }, [domainAlignedFinance]);

  const dailyCashFlow = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return domainAlignedFinance
      .filter((f) => (f.date || '').slice(0, 10) === today && !isOpeningOrBalanceSheetEntry(f))
      .reduce((acc, f) => {
        if (typeof (f as any).cashDelta === 'number') {
          return acc + (f as any).cashDelta;
        }
        const type = (f.type || '').toUpperCase();
        const payMethod = String((f as any).paymentMethod || f.payment_method || '').toUpperCase();
        const idUpper = String(f.id || '').toUpperCase();
        if (
          payMethod === 'ACCRUAL_COMMISSION' ||
          idUpper.startsWith('FIN-COMM-') ||
          ((f.category === 'HPP' || f.category === 'Beban Bahan Habis Pakai Jasa' || type === 'HPP / BEBAN POKOK') &&
            (payMethod === 'SYSTEM_AUTO' || payMethod === 'FIFO'))
        ) {
          return acc;
        }
        return type === 'INCOME' || type === 'IN / PENDAPATAN' ? acc + f.amount : acc - f.amount;
      }, 0);
  }, [domainAlignedFinance]);

  const isolatedApInvoices = useMemo(
    () => buildDomainIsolatedApInvoices(invoicesDue, purchasing, businessDomainConfig, isLedgerReset),
    [invoicesDue, purchasing, businessDomainConfig, isLedgerReset]
  );

  const totalInvoicesDue = useMemo(() => {
    return isolatedApInvoices
      .filter((inv) => isApInvoiceUnpaid(inv.status, inv.amount))
      .reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
  }, [isolatedApInvoices]);

  // Ringkasan Pemisahan Jurnal Biaya Logistik (Upah Bongkar Kuli & Beban Armada Frangko) untuk Depo Bangunan
  const buildingLogisticsSummary = useMemo(() => {
    const kuliEntries = domainAlignedFinance.filter(
      (f) => (f.account_target || '').startsWith('4-10102') || (f.category || '').includes('Jasa Bongkar Kuli')
    );
    const frangkoEntries = domainAlignedFinance.filter(
      (f) => (f.account_target || '').startsWith('5-10205') || (f.category || '').includes('Beban Pengiriman Armada') || (f.category || '').includes('Beban Armada')
    );
    const materialRevenueEntries = domainAlignedFinance.filter(
      (f) =>
        isSalesRevenueEntry(f) &&
        !(f.account_target || '').startsWith('4-10102') &&
        !(f.category || '').includes('Jasa Bongkar Kuli')
    );
    const cogsEntries = domainAlignedFinance.filter((f) => isCogsHppEntry(f));

    const buildingSales = (sales || []).filter(
      (s) =>
        s.status !== 'VOID' &&
        s.status !== 'VOIDED' &&
        (Boolean(s.deliveryFleetActive) ||
          Boolean(s.fleetType) ||
          (s.loadingFee || 0) > 0 ||
          (s.fleetDeliveryCost || 0) > 0)
    );

    const kuliFromFinance = kuliEntries.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const frangkoFromFinance = frangkoEntries.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    const materialRevTotal = materialRevenueEntries.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const materialCogsTotal = cogsEntries.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    let loadingFeeTotal = kuliFromFinance;
    let frangkoTotal = frangkoFromFinance;
    let pickupCount = 0;
    let engkelCount = 0;
    let dumpCount = 0;

    buildingSales.forEach((s) => {
      const kuli = s.loadingFee || 0;
      if (kuliFromFinance === 0 && kuli > 0) loadingFeeTotal += kuli;

      const fExpense = estimateFleetDeliveryExpense(s.fleetType, s.deliveryPolicy, s.deliveryFleetActive);
      const fCost = s.fleetDeliveryCost !== undefined ? s.fleetDeliveryCost : fExpense;
      if (frangkoFromFinance === 0 && fCost > 0) frangkoTotal += fCost;

      const ft = (s.fleetType || '').toUpperCase();
      if (ft.includes('PICKUP')) pickupCount += 1;
      else if (ft.includes('ENGKEL')) engkelCount += 1;
      else if (ft.includes('DUMP') || ft.includes('TRUCK')) dumpCount += 1;
    });

    // Hitung jumlah ritase dari jurnal 5-10205 jika diposting via Voucher Jurnal Umum
    frangkoEntries.forEach((entry) => {
      const desc = `${entry.account_target || ''} ${entry.description || ''}`.toUpperCase();
      if (desc.includes('PICK-UP') || desc.includes('PICKUP')) pickupCount += 1;
      else if (desc.includes('DUMP')) dumpCount += 1;
      else engkelCount += 1;
    });

    const grossProfitMaterial = materialRevTotal - materialCogsTotal;
    const netProfitAfterShipping = grossProfitMaterial + loadingFeeTotal - frangkoTotal;

    return {
      materialRevTotal,
      materialCogsTotal,
      grossProfitMaterial,
      loadingFeeTotal,
      frangkoTotal,
      netProfitAfterShipping,
      pickupCount,
      engkelCount,
      dumpCount,
      hasData: isBuildingBulkActive || kuliEntries.length > 0 || frangkoEntries.length > 0,
    };
  }, [domainAlignedFinance, sales, isBuildingBulkActive]);

  const laundryFinanceSummary = useMemo(() => {
    const model = businessDomainConfig?.primaryBusinessModel;
    const catLower = (businessProfile?.category || '').toLowerCase();
    const hasLaundryFinance = domainAlignedFinance.some(
      (f) =>
        (f.id || '').startsWith('FIN-LND-') ||
        (f.account_target || '').startsWith('4-10105') ||
        (f.category || '').toLowerCase().includes('laundry')
    );
    const isActive = model === 'LAUNDRY' || catLower.includes('laundry') || hasLaundryFinance;

    const orders = Array.isArray(laundryOrders) ? laundryOrders : [];
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
    const cashDpCollected = orders.reduce((acc, o) => acc + (Number(o.paidAmount) || 0), 0);
    const unpaidArTotal = orders.reduce((acc, o) => acc + Math.max(0, Number(o.remainingAmount) || 0), 0);
    const unpaidOrdersCount = orders.filter((o) => (Number(o.remainingAmount) || 0) > 0).length;
    const readyRackArTotal = orders
      .filter((o) => o.productionStatus === 'SIAP_AMBIL' && (Number(o.remainingAmount) || 0) > 0)
      .reduce((acc, o) => acc + (Number(o.remainingAmount) || 0), 0);
    const settledCount = orders.filter((o) => (Number(o.remainingAmount) || 0) <= 0).length;

    return {
      isActive,
      totalOrders,
      totalRevenue,
      cashDpCollected,
      unpaidArTotal,
      unpaidOrdersCount,
      readyRackArTotal,
      settledCount,
    };
  }, [businessDomainConfig?.primaryBusinessModel, businessProfile?.category, domainAlignedFinance, laundryOrders]);

  const fashionFinanceSummary = useMemo(
    () =>
      calculateFashionFinanceSummary(
        sales || [],
        domainAlignedFinance,
        businessDomainConfig,
        businessProfile
      ),
    [sales, domainAlignedFinance, businessDomainConfig, businessProfile]
  );

  const tabs = [
    { id: 'ledger', label: t.tabLedger },
    { id: 'ap', label: t.tabAP },
    { id: 'ar', label: t.tabAR },
    { id: 'reports', label: t.tabReports },
    { id: 'cash_reconciliation', label: t.tabRecon },
    { id: 'promo_audit', label: t.tabPromoAudit, icon: Receipt },
    { id: 'master_data', label: t.tabMaster, icon: Database },
  ];

  const activeTabInfo = useMemo(() => {
    const map: Record<string, { title: string; fileSlug: string }> = {
      ledger: { title: 'Buku Besar & Arus Kas', fileSlug: 'buku-besar-kas' },
      ap: { title: 'Daftar Hutang Dagang (AP)', fileSlug: 'hutang-dagang-ap' },
      ar: { title: 'Daftar Piutang Usaha (AR)', fileSlug: 'piutang-usaha-ar' },
      reports: { title: 'Laporan Laba Rugi & Keuangan', fileSlug: 'laporan-laba-rugi' },
      cash_reconciliation: { title: 'Rekonsiliasi Shift Kasir', fileSlug: 'rekonsiliasi-shift' },
      promo_audit: { title: 'Audit Beban Promo & Klaim Rebate', fileSlug: 'audit-rebate-promo' },
      master_data: { title: 'Katalog Harga & Data Master', fileSlug: 'katalog-harga-master' },
    };
    return map[financeMainTab] || map.ledger;
  }, [financeMainTab]);

  const activeBusinessTitle =
    businessProfile?.name ||
    (businessDomainConfig?.mechanismFamily === 'FNB_CULINARY'
      ? 'NEXUS CULINARY & COFFEE ROASTERY'
      : businessDomainConfig?.mechanismFamily === 'BUILDING_BULK'
      ? 'DEPO MATERIAL & BAJA NUSANTARA'
      : 'NEXUS RETAIL & ENTERPRISE');

  const activeDomainLabel =
    businessDomainConfig?.primaryBusinessModel ||
    businessDomainConfig?.mechanismFamily ||
    'Multi-Industry';

  const escapeCsvCell = (val: unknown): string => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const handleExportActiveTabCsv = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (financeMainTab === 'ledger') {
      headers = ['Tanggal', 'ID / Referensi', 'Kategori', 'Akun COA', 'Deskripsi', 'Tipe', 'Metode Bayar', 'Nominal (Rp)'];
      rows = domainAlignedFinance.map((f) => [
        f.date || todayStr,
        f.reference || f.id,
        f.category || '-',
        f.account_target || '-',
        f.description || '-',
        f.type || '-',
        (f as any).paymentMethod || f.payment_method || 'TUNAI',
        Number(f.amount) || 0,
      ]);
    } else if (financeMainTab === 'ap') {
      headers = ['ID Tagihan', 'Referensi PO', 'Supplier / Vendor', 'Jatuh Tempo', 'Total Tagihan (Rp)', 'Sisa Hutang (Rp)', 'Status'];
      rows = isolatedApInvoices.map((inv: any) => [
        inv.id || '-',
        inv.poId || inv.reference || '-',
        inv.supplier || inv.vendor || '-',
        inv.dueDate || inv.due_date || '-',
        Number(inv.totalAmount || inv.amount) || 0,
        Number(inv.amount) || 0,
        inv.status || 'BELUM LUNAS',
      ]);
    } else if (financeMainTab === 'ar') {
      const domainAr = filterArInvoicesByBusinessDomain(invoicesReceivable || [], businessDomainConfig);
      headers = ['No Invoice', 'Pelanggan / Klien', 'Tanggal Jatuh Tempo', 'Sisa Piutang (Rp)', 'Status'];
      rows = domainAr.map((ar: any) => [
        ar.invoice_number || ar.id || '-',
        ar.party_name || ar.vendor || ar.customerName || '-',
        ar.due_date || ar.dueDate || '-',
        Number(ar.amount) || 0,
        ar.status || 'Unpaid',
      ]);
    } else if (financeMainTab === 'reports') {
      const salesRevenue = domainAlignedFinance
        .filter((f) => isSalesRevenueEntry(f))
        .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);
      const hppTotal = domainAlignedFinance
        .filter((f) => isCogsHppEntry(f))
        .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);
      headers = ['Komponen Laporan Keuangan', 'Kode Akun', 'Keterangan Domain', 'Nilai (Rp)'];
      rows = [
        ['Pendapatan Penjualan Bersih', '4-10001', activeDomainLabel, salesRevenue],
        ['Beban Pokok Penjualan (HPP)', '5-10001', 'Harga Pokok Penjualan / Resep BOM', hppTotal],
        ['Laba Kotor Riil', 'LABA-KOTOR', 'Pendapatan Penjualan dikurangi HPP', realGrossProfit],
        ['Saldo Kas & Bank Aktif', '1-10001 / 1-10002', 'Kas Operasional & Rekening Giro', liquidCashBalance],
        ['Total Hutang Dagang Belum Lunas (AP)', '2-10001', 'Kewajiban Supplier Aktif', totalInvoicesDue],
      ];
    } else if (financeMainTab === 'cash_reconciliation') {
      headers = ['ID Shift', 'Kasir', 'Terminal', 'Waktu Buka', 'Waktu Tutup', 'Saldo Awal (Rp)', 'Kas Fisik Aktual (Rp)', 'Status'];
      rows = (cashierShifts || []).map((sh: any) => [
        sh.id || '-',
        sh.cashierName || '-',
        sh.terminalId || 'KASIR-01',
        sh.openedAt || sh.startTime || '-',
        sh.closedAt || sh.endTime || 'MASIH BUKA',
        Number(sh.openingCash || sh.initialCash) || 0,
        Number(sh.closingCash ?? sh.actualCash ?? sh.openingCash) || 0,
        sh.status || 'OPEN',
      ]);
    } else if (financeMainTab === 'promo_audit') {
      headers = ['ID Klaim', 'Nama Kampanye Promo', 'Supplier / Prinsipal', 'Total Diskon (Rp)', 'Subsidi Supplier (Rp)', 'Beban Toko (Rp)', 'Status Klaim'];
      rows = (supplierRebateClaims || []).map((cl: any) => [
        cl.id || '-',
        cl.campaignName || cl.promoName || '-',
        cl.supplierName || '-',
        Number(cl.totalDiscountAmount || cl.claimAmount) || 0,
        Number(cl.supplierSubsidyAmount || cl.claimAmount) || 0,
        Number(cl.storeExpenseAmount) || 0,
        cl.status || 'PENDING',
      ]);
    } else {
      const domainProds = filterProductsByBusinessDomain(products || [], businessDomainConfig);
      headers = ['Kode SKU', 'Nama Produk / Menu', 'Kategori', 'Satuan', 'HPP (Rp)', 'Harga Jual (Rp)', 'Margin (%)', 'Stok'];
      rows = domainProds.map((p: any) => {
        const cost = Number(p.cost ?? p.buyPrice) || 0;
        const price = Number(p.price ?? p.sellPrice) || 0;
        const marginPct = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : '0.0';
        return [
          p.id || p.sku || '-',
          p.name || '-',
          p.category || '-',
          p.unit || 'Pcs',
          cost,
          price,
          marginPct,
          Number(p.stock) || 0,
        ];
      });
    }

    const metaRows = [
      [`LAPORAN RESMI: ${activeTabInfo.title.toUpperCase()}`],
      [`Entitas Usaha: ${activeBusinessTitle} (${activeDomainLabel})`],
      [`Tanggal Unduh: ${new Date().toLocaleString('id-ID')} | Dicetak Oleh: ${effectiveUser?.name || 'Finance Officer'}`],
      [],
    ];

    const csvContent =
      '\uFEFF' +
      [
        ...metaRows.map((r) => r.map(escapeCsvCell).join(',')),
        headers.map(escapeCsvCell).join(','),
        ...rows.map((r) => r.map(escapeCsvCell).join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTabInfo.fileSlug}-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowExportMenu(false);
    setExportNotice(`File CSV/Excel "${activeTabInfo.title}" berhasil diunduh (${rows.length} baris data).`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handlePrintOfficialReport = () => {
    setShowExportMenu(false);
    setExportNotice(`Menyiapkan cetak dokumen resmi "${activeTabInfo.title}" dengan kop surat ${activeBusinessTitle}...`);
    setTimeout(() => {
      window.print();
      setTimeout(() => setExportNotice(null), 3000);
    }, 150);
  };

  return (
    <div id="finance-module" className="p-4 md:p-6 space-y-6 rounded-2xl bg-slate-50 dark:bg-[#070d1e] min-h-full text-slate-900 dark:text-slate-100 transition-colors">
      {/* Kop Surat Resmi (Tampil saat Cetak / Save PDF & saat pemicu cetak aktif) */}
      <div className={`${exportNotice?.includes('Menyiapkan cetak') ? 'block' : 'hidden'} print:block p-5 rounded-xl border-2 border-slate-800 bg-white text-slate-900 mb-4`}>
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
          <div>
            <div className="text-lg font-black uppercase tracking-wide text-slate-900">
              {activeBusinessTitle}
            </div>
            <div className="text-xs font-medium text-slate-600">
              Rumpun Usaha: {activeDomainLabel} • {businessProfile?.address || 'Jl. Jend. Sudirman Kav. 52-53, Jakarta'}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              NPWP: {(businessProfile as any)?.npwp || '01.345.678.9-012.000'} • Telp: {businessProfile?.phone || '(021) 5098-7700'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded bg-slate-900 text-white inline-block">
              DOKUMEN KEUANGAN RESMI
            </div>
            <div className="text-sm font-bold text-slate-800 mt-1">
              {activeTabInfo.title}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Dicetak: {new Date().toLocaleString('id-ID')} • Oleh: {effectiveUser?.name || 'Finance Officer'}
            </div>
          </div>
        </div>
      </div>

      {/* Notifikasi Umpan Balik Export */}
      {exportNotice && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{exportNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="text-[11px] font-mono underline hover:opacity-80 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top Banner & Action Controls */}
      <div
        className={`p-5 md:p-6 rounded-2xl border transition-all duration-200 ${
          isLight
            ? 'bg-white border-cyan-500/70 text-slate-900 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            : 'bg-[#161b22] border-cyan-500/35 text-white shadow-[0_0_16px_rgba(6,182,212,0.08)]'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-slate-900 dark:text-white font-medium text-xl leading-7 tracking-tight">
                {t.header}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal tracking-widest uppercase border flex items-center gap-1.5 ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.16)]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                ENTERPRISE CORE - LIVE SYNC
              </span>
            </div>
            <p className="text-sm font-normal text-slate-600 dark:text-slate-400 mt-1 leading-5">
              {isEn
                ? 'Unified multi-industry accounting, live ledger sync & master pricing hub'
                : 'Konsol sentral pembukuan multi-lini bisnis, sinkronisasi buku besar & kendali harga master'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowCashEntryModal(true)}
              className="px-3.5 py-2 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/55 transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-[0.99]"
            >
              <Wallet className="w-4 h-4" />
              {t.btnCash}
            </button>
            <button
              type="button"
              onClick={() => setShowJournalModal(true)}
              className="px-3.5 py-2 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 rounded-xl text-sm font-medium hover:bg-cyan-100 dark:hover:bg-cyan-900/55 transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-[0.99]"
            >
              <CreditCard className="w-4 h-4" />
              {t.btnJournal}
            </button>

            {/* Dropdown Menu Cetak / Export Sesuai Tab Aktif */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700/80 font-medium shadow-sm rounded-xl text-sm transition-all duration-150 cursor-pointer flex items-center gap-1.5 active:scale-[0.99]"
              >
                <Printer className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>{t.btnPrint}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <div
                  className={`absolute right-0 mt-2 w-80 rounded-xl border shadow-2xl z-50 p-2 ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                >
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-bold">
                      Target Export Tab Aktif
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      {activeTabInfo.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Kop: {activeBusinessTitle}
                    </div>
                  </div>

                  <div className="py-1 space-y-1">
                    <button
                      type="button"
                      onClick={handlePrintOfficialReport}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition flex items-start gap-2.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Cetak Laporan Resmi / Save PDF
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Format dokumen resmi lengkap dengan kop surat usaha aktif
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportActiveTabCsv}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition flex items-start gap-2.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Unduh File CSV / Excel</span>
                          <Download className="w-3 h-3 text-emerald-500" />
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Ekspor tabel {activeTabInfo.title} ({activeTabInfo.fileSlug}.csv)
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4 Kartu Metrik Ringkasan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 border ${
            liquidCashBalance < 0 
              ? 'border-rose-500/80 bg-rose-500/5 shadow-[0_0_18px_rgba(244,63,94,0.22)]' 
              : isLight 
              ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' 
              : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-mono font-normal text-[11px] leading-4 uppercase tracking-widest">
                  {t.cardCash}
                </span>
                {liquidCashBalance < 0 && (
                  <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[9px] px-1.5 py-0.5 rounded font-mono font-normal uppercase animate-pulse">
                    DEFISIT
                  </span>
                )}
              </div>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-lg leading-7 font-mono font-semibold ${liquidCashBalance < 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}`}>
              Rp {liquidCashBalance.toLocaleString('id-ID')}
            </div>
            <div className="text-sm leading-5 font-normal text-slate-500 dark:text-slate-400 mt-1">
              Kas Aktif & Rekening Giro
            </div>
          </div>

          <div className={`rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 border ${
            isLight 
              ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' 
              : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 dark:text-slate-400 font-mono font-normal text-[11px] leading-4 uppercase tracking-widest">
                {t.cardGross}
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg leading-7 font-mono font-semibold text-blue-600 dark:text-blue-400">
              Rp {realGrossProfit.toLocaleString('id-ID')}
            </div>
            <div className="text-sm leading-5 font-normal text-slate-500 dark:text-slate-400 mt-1">
              Total Omzet dikurangi HPP
            </div>
          </div>

          <div className={`rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 border ${
            totalInvoicesDue > 0
              ? 'border-amber-500/80 bg-amber-500/5 shadow-[0_0_18px_rgba(245,158,11,0.22)]'
              : isLight 
              ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]' 
              : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-mono font-normal text-[11px] leading-4 uppercase tracking-widest">
                  {t.cardAP}
                </span>
                {totalInvoicesDue > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                )}
              </div>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg leading-7 font-mono font-semibold text-amber-600 dark:text-amber-400">
              Rp {totalInvoicesDue.toLocaleString('id-ID')}
            </div>
            <div className="text-sm leading-5 font-normal text-slate-500 dark:text-slate-400 mt-1">
              Tagihan Supplier Belum Lunas
            </div>
          </div>

          <div className={`rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 border ${
            dailyCashFlow >= 0
              ? 'border-emerald-500/60 bg-emerald-500/5 shadow-[0_0_14px_rgba(16,185,129,0.14)]'
              : 'border-rose-500/60 bg-rose-500/5 shadow-[0_0_14px_rgba(244,63,94,0.14)]'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 dark:text-slate-400 font-mono font-normal text-[11px] leading-4 uppercase tracking-widest">
                {t.cardFlow}
              </span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${dailyCashFlow >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-lg leading-7 font-mono font-semibold ${dailyCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {dailyCashFlow >= 0 ? '+' : '-'}Rp {Math.abs(dailyCashFlow).toLocaleString('id-ID')}
            </div>
            <div className="text-sm leading-5 font-normal text-slate-500 dark:text-slate-400 mt-1">
              Net Arus Masuk/Keluar Hari Ini
            </div>
          </div>
        </div>

        {/* Panel Pemisahan Jurnal Biaya Logistik Depo Bangunan (Upah Bongkar Kuli & Beban Armada Frangko) */}
        {buildingLogisticsSummary.hasData && (
          <div className={`mt-4 rounded-xl border p-4 transition-all ${
            isLight
              ? 'bg-orange-50/60 border-orange-300 text-slate-900'
              : 'bg-orange-950/20 border-orange-500/35 text-slate-100'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                  <Truck className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-orange-900 dark:text-orange-300">
                    Pemisahan Jurnal Biaya Logistik Depo Bangunan (Kuli Bongkar & Armada Frangko)
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    Otomatis memisahkan Pendapatan Material (4-10001), Jasa Bongkar Kuli (4-10102), dan Beban Armada Frangko (5-10205)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-500/30 text-orange-700 dark:text-orange-300 font-bold">
                  Pick-up: {buildingLogisticsSummary.pickupCount}x (Rp 85rb)
                </span>
                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-500/30 text-orange-700 dark:text-orange-300 font-bold">
                  Engkel: {buildingLogisticsSummary.engkelCount}x (Rp 175rb)
                </span>
                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-500/30 text-orange-700 dark:text-orange-300 font-bold">
                  Dump Truck: {buildingLogisticsSummary.dumpCount}x (Rp 325rb)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg p-3 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pendapatan Penjualan Material (4-10001)
                </div>
                <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  Rp {buildingLogisticsSummary.materialRevTotal.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                  Laba Kotor Material: Rp {buildingLogisticsSummary.grossProfitMaterial.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="rounded-lg p-3 bg-white dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-500/30">
                <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Pendapatan / Titipan Jasa Bongkar Kuli (4-10102)
                </div>
                <div className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  +Rp {buildingLogisticsSummary.loadingFeeTotal.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Terpisah dari omzet material pokok
                </div>
              </div>

              <div className="rounded-lg p-3 bg-white dark:bg-slate-900/90 border border-rose-200 dark:border-rose-500/30">
                <div className="text-[10px] font-mono uppercase tracking-wider text-rose-700 dark:text-rose-300">
                  Beban Pengiriman Armada Frangko (5-10205)
                </div>
                <div className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  -Rp {buildingLogisticsSummary.frangkoTotal.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  BBM & Ritase Sopir (Frangko Lokasi Proyek)
                </div>
              </div>

              <div className="rounded-lg p-3 bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/40">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-bold">
                  Est. Laba Bersih Setelah Ongkir
                </div>
                <div className="text-base font-mono font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Rp {buildingLogisticsSummary.netProfitAfterShipping.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                  Laba Kotor Material + Jasa Kuli − Beban Armada
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel Rekonsiliasi Keuangan & Piutang Jasa Laundry (4-10105 & 1-10301) */}
        {laundryFinanceSummary.isActive && isLaundryActive && (
          <div className={`mt-4 rounded-xl border p-4 transition-all ${
            isLight
              ? 'bg-cyan-50/60 border-cyan-300 text-slate-900'
              : 'bg-cyan-950/20 border-cyan-500/35 text-slate-100'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  <Shirt className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-900 dark:text-cyan-300">
                    Rekonsiliasi Keuangan &amp; Piutang Usaha Jasa Laundry (4-10105 &amp; 1-10301)
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    Pembayaran Lunas/DP masuk ke Kas/Bank real-time; sisa tagihan (Bayar Saat Ambil / Sisa DP) otomatis tercatat di Piutang Usaha &amp; lunas saat pengambilan.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFinanceMainTab('ar')}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer transition"
              >
                Kelola Piutang Laundry (AR) →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg p-3 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pendapatan Jasa Laundry (4-10105)
                </div>
                <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  Rp {laundryFinanceSummary.totalRevenue.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                  Total {laundryFinanceSummary.totalOrders} order cucian
                </div>
              </div>

              <div className="rounded-lg p-3 bg-white dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-500/30">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Kas &amp; DP Diterima (1-10001/02/03)
                </div>
                <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  +Rp {laundryFinanceSummary.cashDpCollected.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {laundryFinanceSummary.settledCount} order sudah lunas penuh
                </div>
              </div>

              <div className="rounded-lg p-3 bg-white dark:bg-slate-900/90 border border-amber-200 dark:border-amber-500/30">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Piutang Usaha Cucian (1-10301)
                </div>
                <div className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  Rp {laundryFinanceSummary.unpaidArTotal.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {laundryFinanceSummary.unpaidOrdersCount} nota Sisa DP / Bayar Ambil
                </div>
              </div>

              <div className="rounded-lg p-3 bg-cyan-50/90 dark:bg-cyan-950/30 border border-cyan-300 dark:border-cyan-500/40">
                <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-800 dark:text-cyan-300 font-bold">
                  Tagihan Tertahan di Rak (Siap Ambil)
                </div>
                <div className="text-base font-mono font-black text-cyan-700 dark:text-cyan-400 mt-0.5">
                  Rp {laundryFinanceSummary.readyRackArTotal.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-cyan-700/80 dark:text-cyan-300/80 mt-0.5">
                  Otomatis cair saat pelanggan ambil cucian
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel Rekonsiliasi Pendapatan Kotor, Potongan Diskon (4-10004) & Tukar Ukuran Fashion */}
        {fashionFinanceSummary.isActive && isFashionActive && (
          <div className={`mt-4 rounded-xl border p-4 transition-all ${
            isLight
              ? 'bg-fuchsia-50/50 border-fuchsia-300 text-slate-900'
              : 'bg-fuchsia-950/15 border-fuchsia-500/35 text-slate-100'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/30">
                  <Tag className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-fuchsia-900 dark:text-fuchsia-300">
                    Rekonsiliasi Pendapatan Kotor, Potongan Promo (4-10004) &amp; Tukar Ukuran Butik
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    Potongan Clearance, Mix &amp; Match, dan Diskon Nota dicatat terpisah pada akun kontra-pendapatan 4-10004; Tukar Ukuran selisih Rp 0 hanya memperbarui mutasi stok tanpa menggandakan omzet.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFinanceMainTab('reports')}
                className="px-3 py-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-semibold cursor-pointer transition"
              >
                Lihat Laba Rugi (4-10001 vs 4-10004) →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg p-3 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pendapatan Kotor Butik (4-10001)
                </div>
                <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  Rp {fashionFinanceSummary.grossRevenue.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                  {fashionFinanceSummary.totalSalesCount} nota penjualan sebelum diskon
                </div>
              </div>

              <div className="rounded-lg p-3 bg-white dark:bg-slate-900/90 border border-rose-200 dark:border-rose-500/30">
                <div className="text-[10px] font-mono uppercase tracking-wider text-rose-700 dark:text-rose-300">
                  Potongan &amp; Diskon Penjualan (4-10004)
                </div>
                <div className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  -Rp {fashionFinanceSummary.discountTotal.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate" title={`Clearance Rp ${fashionFinanceSummary.clearanceDiscount.toLocaleString('id-ID')} • Bundle Rp ${fashionFinanceSummary.bundleDiscount.toLocaleString('id-ID')} • Manual Rp ${fashionFinanceSummary.manualDiscount.toLocaleString('id-ID')}`}>
                  Clr: {fashionFinanceSummary.clearanceDiscount.toLocaleString('id-ID')} • Bnd: {fashionFinanceSummary.bundleDiscount.toLocaleString('id-ID')} • Man: {fashionFinanceSummary.manualDiscount.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="rounded-lg p-3 bg-white dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-500/30">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Pendapatan Bersih Fashion (Net)
                </div>
                <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  +Rp {fashionFinanceSummary.netRevenue.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Pendapatan Kotor − Potongan (4-10004)
                </div>
              </div>

              <div className="rounded-lg p-3 bg-fuchsia-50/90 dark:bg-fuchsia-950/30 border border-fuchsia-300 dark:border-fuchsia-500/40">
                <div className="text-[10px] font-mono uppercase tracking-wider text-fuchsia-800 dark:text-fuchsia-300 font-bold">
                  Tukar Ukuran / Barang (Non-Duplikasi)
                </div>
                <div className="text-sm font-mono font-black text-fuchsia-700 dark:text-fuchsia-300 mt-0.5">
                  {fashionFinanceSummary.zeroDiffExchangeCount} Nota Rp 0
                  {fashionFinanceSummary.paidExchangeCount > 0 ? ` • ${fashionFinanceSummary.paidExchangeCount} Upgrade` : ''}
                </div>
                <div className="text-[10px] text-fuchsia-700/80 dark:text-fuchsia-300/80 mt-0.5">
                  {fashionFinanceSummary.paidExchangeDiffTotal > 0
                    ? `Selisih upgrade masuk: +Rp ${fashionFinanceSummary.paidExchangeDiffTotal.toLocaleString('id-ID')}`
                    : 'Hanya mutasi stok (+1 / -1), 0 jurnal omzet'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigasi Tab Horizontal dengan Tombol Scroll Kiri/Kanan (Termasuk Data Master Tertanam) */}
      <div className={`flex items-center gap-1.5 p-1.5 rounded-xl w-full border transition-all duration-200 ${
        isLight
          ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
          : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]'
      }`}>
        <button
          type="button"
          onClick={() => handleScrollTabs('left')}
          aria-label="Scroll tab ke kiri"
          title="Geser bilah tab ke kiri"
          className={`p-2 rounded-lg border shrink-0 transition cursor-pointer active:scale-95 ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-cyan-950/50 hover:text-cyan-300 hover:border-cyan-500/40'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={tabScrollRef}
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 min-w-0"
        >
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isAP = tab.id === 'ap';
            const isActive = financeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFinanceMainTab(tab.id);
                  e.currentTarget.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center',
                  });
                }}
                className={`px-4 py-2 rounded-lg text-sm leading-5 font-medium transition-all duration-150 cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 active:scale-[0.99] ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-[0_0_14px_rgba(6,182,212,0.4)]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30'
                }`}
              >
                {TabIcon && <TabIcon className="w-4 h-4" />}
                <span>{tab.label}</span>
                {isAP && totalInvoicesDue > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleScrollTabs('right')}
          aria-label="Scroll tab ke kanan"
          title="Geser bilah tab ke kanan (Data Master & Harga)"
          className={`p-2 rounded-lg border shrink-0 transition cursor-pointer active:scale-95 ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-cyan-950/50 hover:text-cyan-300 hover:border-cyan-500/40'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Konten Tab Aktif (Eksklusif Hanya 1 Tab Aktif) */}
      <div className="transition-all duration-150" key={`finance-active-panel-${financeMainTab}`}>
        {financeMainTab === 'master_data' ? (
          <MasterDataModule />
        ) : financeMainTab === 'ledger' ? (
          <LedgerTable finance={domainAlignedFinance} isLight={isLight} />
        ) : financeMainTab === 'ap' ? (
          <AccountsPayableTab isLight={isLight} />
        ) : financeMainTab === 'ar' ? (
          <AccountsReceivableTab isLight={isLight} />
        ) : financeMainTab === 'reports' ? (
          <FinancialReportsTab isLight={isLight} />
        ) : financeMainTab === 'cash_reconciliation' ? (
          <CashReconciliationTab isLight={isLight} />
        ) : financeMainTab === 'promo_audit' ? (
          <PromoAuditRebateTab isLight={isLight} onNavigateToAP={() => setFinanceMainTab('ap')} />
        ) : null}
      </div>

      {/* Modals */}
      {showCashEntryModal && (
        <CashEntryModal
          isOpen={showCashEntryModal}
          onClose={() => setShowCashEntryModal(false)}
        />
      )}

      {showJournalModal && (
        <JournalVoucherModal
          isOpen={showJournalModal}
          onClose={() => {
            setShowJournalModal(false);
            setJournalVoucherInitialData(null);
          }}
          isLight={isLight}
          initialData={journalVoucherInitialData}
          onSave={(data) => {
            const totalDebit = data.lines.reduce((acc: number, l: any) => acc + (Number(l.debit) || 0), 0);
            const totalCredit = data.lines.reduce((acc: number, l: any) => acc + (Number(l.credit) || 0), 0);

            const result = postGeneralJournalVoucher({
              voucherNo: data.reference,
              transactionDate: data.date,
              documentType: data.type,
              sector: data.sector,
              terminal: data.terminal,
              branch: data.branch,
              referenceNo: data.reference,
              generalMemo: data.memo,
              lines: data.lines.map((l: any) => ({
                accountCode: l.accountCode || l.coa,
                accountName: l.accountName || l.memo || l.coa,
                description: l.memo,
                debit: Number(l.debit) || 0,
                credit: Number(l.credit) || 0,
              })),
            });

            recordAudit({
              traceId: data.reference || `JV-${Date.now()}`,
              userId: effectiveUser?.id || 'finance-officer',
              userName: effectiveUser?.name || 'Finance Officer',
              userRole: effectiveUser?.role || 'Finance',
              module: 'FINANCE',
              action: 'CONFIG_CHANGE',
              severity: 'CRITICAL',
              entityId: data.reference,
              payloadAfter: {
                voucherNo: data.reference,
                date: data.date,
                memo: data.memo,
                totalDebit,
                totalCredit,
                lineCount: data.lines.length,
              },
            });

            if (result && result.success) {
              setShowJournalModal(false);
              setJournalVoucherInitialData(null);
            } else {
              setShowJournalModal(false);
              setJournalVoucherInitialData(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default FinanceModule;