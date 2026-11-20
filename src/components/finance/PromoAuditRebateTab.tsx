import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SupplierRebateClaim } from '../../types';
import {
  Search,
  Download,
  CheckCircle2,
  ArrowRight,
  Building2,
  Receipt,
  PackageCheck,
  Tag,
  Wallet,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface PromoAuditRebateTabProps {
  isLight?: boolean;
  onNavigateToAP?: () => void;
}

type AuditSubView = 'ALL' | 'SUPPLIER_TPR' | 'FEFO_EXP' | 'STORE_PROMO' | 'JOURNALS';

export const PromoAuditRebateTab: React.FC<PromoAuditRebateTabProps> = ({
  isLight = false,
  onNavigateToAP,
}) => {
  const {
    journalEntries,
    supplierRebateClaims,
    invoicesDue,
    purchasing,
    sales,
    applySupplierRebateToAP,
    settleRebateClaimCash,
    businessDomainConfig,
    showToast,
  } = useApp();

  const isFnbActive = businessDomainConfig?.mechanismFamily === 'FNB_CULINARY' && !businessDomainConfig?.isHybridMultiUnit;

  const domainIsolatedClaims = useMemo(() => {
    let claims = supplierRebateClaims || [];
    if (isFnbActive) {
      claims = claims.filter((c) => {
        const text = `${c.supplierName || ''} ${c.promoCode || ''} ${c.productNames?.join(' ') || ''}`.toLowerCase();
        if (text.includes('nestle') || text.includes('dancow') || text.includes('kao') || text.includes('dandow') || text.includes('semen') || text.includes('tonasa')) {
          return false;
        }
        return true;
      });
    }
    return claims;
  }, [supplierRebateClaims, isFnbActive]);

  const [subView, setSubView] = useState<AuditSubView>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState<'ALL' | 'CLAIMABLE' | 'DONE'>('ALL');
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>([]);

  // Modal state for AP Offset
  const [offsetClaimsTarget, setOffsetClaimsTarget] = useState<SupplierRebateClaim[] | null>(null);
  const [selectedApInvoiceId, setSelectedApInvoiceId] = useState<string>('');

  // Promo journals derived in real time from journalEntries
  const promoJournals = useMemo(() => {
    return (journalEntries || []).filter(
      (j) =>
        Boolean(j.promoSourceType) ||
        ['PROMO_SUPPLIER_TPR', 'PROMO_FEFO_EXP', 'PROMO_STORE', 'AP_REBATE_OFFSET', 'REBATE_CASH_SETTLEMENT'].includes(
          String(j.type || '')
        ) ||
        (j.lines || []).some((l) => ['1-10305', '5-10201', '5-10202'].includes(l.accountCode))
    );
  }, [journalEntries]);

  // Aggregate accounting metrics per source from actual posted journals
  const metrics = useMemo(() => {
    let tprGross = 0;
    let fefoExpense = 0;
    let fefoSalvageRevenue = 0;
    let fefoQtySaved = 0;
    let fefoTxCount = 0;
    let storePromoExpense = 0;
    let seasonalExpense = 0;
    let storeBndExpense = 0;

    promoJournals.forEach((j) => {
      if (j.type === 'AP_REBATE_OFFSET' || j.type === 'REBATE_CASH_SETTLEMENT') return;
      const amt = Number(j.amount) || (j.lines || []).reduce((s, l) => s + (l.debit || 0), 0);

      if (j.promoSourceType === 'SUPPLIER_TPR' || j.type === 'PROMO_SUPPLIER_TPR') {
        tprGross += amt;
      } else if (j.promoSourceType === 'FEFO_EXP' || j.type === 'PROMO_FEFO_EXP') {
        fefoExpense += amt;
        fefoSalvageRevenue += Number(j.fefoSalvageRevenue) || 0;
        fefoQtySaved += Number(j.fefoQtySaved) || 0;
        fefoTxCount += 1;
      } else if (j.promoSourceType === 'SEASONAL' || j.promoSourceType === 'STORE_BND' || j.promoSourceType === 'STORE_DISC' || j.type === 'PROMO_STORE') {
        storePromoExpense += amt;
        if (j.promoSourceType === 'SEASONAL') seasonalExpense += amt;
        else storeBndExpense += amt;
      }
    });

    const claimableClaims = (domainIsolatedClaims || []).filter((c) => c.status === 'CLAIMABLE');
    const claimableRebateTotal = claimableClaims.reduce((s, c) => s + (c.claimAmount || 0), 0);
    const settledOrOffsetRebateTotal = (domainIsolatedClaims || [])
      .filter((c) => c.status !== 'CLAIMABLE')
      .reduce((s, c) => s + (c.claimAmount || 0), 0);

    const totalPosRevenue = (sales || []).reduce((s, tx) => s + (Number(tx.total_amount) || 0), 0);
    const totalPromoImpact = tprGross + fefoExpense + storePromoExpense;
    const fefoRecoveryRatio =
      fefoSalvageRevenue + fefoExpense > 0
        ? Math.round((fefoSalvageRevenue / (fefoSalvageRevenue + fefoExpense)) * 100)
        : 0;

    return {
      tprGross,
      claimableRebateTotal,
      claimableCount: claimableClaims.length,
      settledOrOffsetRebateTotal,
      fefoExpense,
      fefoSalvageRevenue,
      fefoQtySaved,
      fefoTxCount,
      fefoRecoveryRatio,
      storePromoExpense,
      seasonalExpense,
      storeBndExpense,
      totalPromoImpact,
      promoToSalesPct: totalPosRevenue > 0 ? ((totalPromoImpact / totalPosRevenue) * 100).toFixed(2) : '0.00',
    };
  }, [promoJournals, domainIsolatedClaims, sales]);

  // All unpaid AP invoices (from invoicesDue + virtual POs)
  const unpaidApInvoices = useMemo(() => {
    const map = new Map<string, { id: string; invoice_number: string; vendor: string; amount: number; due_date: string }>();

    (invoicesDue || []).forEach((inv) => {
      if (inv.type === 'RECEIVABLE') return;
      const isPaid = ['PAID', 'Paid', 'Lunas'].includes(inv.status) || inv.amount <= 0;
      if (!isPaid) {
        map.set(inv.po_number || inv.id, {
          id: inv.id,
          invoice_number: inv.invoice_number || inv.id,
          vendor: inv.party_name || inv.vendor || 'Supplier',
          amount: inv.amount,
          due_date: inv.due_date || '-',
        });
      }
    });

    (purchasing || []).forEach((po) => {
      const received = po.status === 'RECEIVED' || po.status === 'COMPLETED' || po.status === 'Selesai';
      if (received && po.payment_status !== 'Lunas' && !map.has(po.po_number)) {
        map.set(po.po_number, {
          id: `INV-AP-${po.po_number}`,
          invoice_number: `INV-AP-${po.po_number}`,
          vendor: po.supplier_name || 'Supplier',
          amount: po.total_amount,
          due_date: po.due_date || '-',
        });
      }
    });

    return Array.from(map.values());
  }, [invoicesDue, purchasing]);

  const filteredClaims = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (domainIsolatedClaims || []).filter((c) => {
      if (claimStatusFilter === 'CLAIMABLE' && c.status !== 'CLAIMABLE') return false;
      if (claimStatusFilter === 'DONE' && c.status === 'CLAIMABLE') return false;
      if (!q) return true;
      return (
        c.supplierName.toLowerCase().includes(q) ||
        c.promoCode.toLowerCase().includes(q) ||
        c.receiptNumber.toLowerCase().includes(q) ||
        c.productNames.some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [domainIsolatedClaims, claimStatusFilter, searchQuery]);

  const fefoRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return promoJournals.filter((j) => {
      if (j.promoSourceType !== 'FEFO_EXP' && j.type !== 'PROMO_FEFO_EXP') return false;
      if (!q) return true;
      return (
        (j.reference || '').toLowerCase().includes(q) ||
        (j.promoCode || '').toLowerCase().includes(q) ||
        (j.description || '').toLowerCase().includes(q)
      );
    });
  }, [promoJournals, searchQuery]);

  const storePromoRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return promoJournals.filter((j) => {
      const isStore =
        j.type === 'PROMO_STORE' ||
        j.promoSourceType === 'SEASONAL' ||
        j.promoSourceType === 'STORE_BND' ||
        j.promoSourceType === 'STORE_DISC';
      if (!isStore) return false;
      if (!q) return true;
      return (
        (j.reference || '').toLowerCase().includes(q) ||
        (j.promoCode || '').toLowerCase().includes(q) ||
        (j.description || '').toLowerCase().includes(q)
      );
    });
  }, [promoJournals, searchQuery]);

  const filteredJournals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return promoJournals.filter((j) => {
      if (!q) return true;
      return (
        (j.reference || '').toLowerCase().includes(q) ||
        (j.description || '').toLowerCase().includes(q) ||
        (j.supplierName || '').toLowerCase().includes(q) ||
        (j.promoCode || '').toLowerCase().includes(q) ||
        (j.lines || []).some((l) => l.accountCode.toLowerCase().includes(q) || l.accountName.toLowerCase().includes(q))
      );
    });
  }, [promoJournals, searchQuery]);

  const openOffsetModal = (claims: SupplierRebateClaim[]) => {
    const valid = claims.filter((c) => c.status === 'CLAIMABLE');
    if (valid.length === 0) {
      showToast('Tidak ada klaim rebate berstatus Siap Potong AP yang dipilih.', 'warning');
      return;
    }
    const primarySupplier = valid[0].supplierName.toLowerCase();
    const matchedInv =
      unpaidApInvoices.find(
        (inv) =>
          inv.vendor.toLowerCase().includes(primarySupplier) ||
          primarySupplier.includes(inv.vendor.toLowerCase())
      ) || unpaidApInvoices[0];

    setSelectedApInvoiceId(matchedInv?.id || '');
    setOffsetClaimsTarget(valid);
  };

  const handleConfirmOffset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offsetClaimsTarget || !selectedApInvoiceId) return;
    const res = applySupplierRebateToAP(
      offsetClaimsTarget.map((c) => c.id),
      selectedApInvoiceId
    );
    if (res.success) {
      setOffsetClaimsTarget(null);
      setSelectedClaimIds((prev) => prev.filter((id) => !offsetClaimsTarget.some((c) => c.id === id)));
    }
  };

  const toggleClaimSelection = (id: string) => {
    setSelectedClaimIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkOffsetSelected = () => {
    const chosen = (supplierRebateClaims || []).filter(
      (c) => selectedClaimIds.includes(c.id) && c.status === 'CLAIMABLE'
    );
    openOffsetModal(chosen);
  };

  const handleExportCsv = () => {
    const rows: string[] = [
      'Sumber,No_Referensi,Tanggal,Supplier_Atau_Akun,Kode_Promo,Nominal_Rp,Status_Atau_Keterangan',
    ];
    promoJournals.forEach((j) => {
      const amt = Number(j.amount) || (j.lines || []).reduce((s, l) => s + (l.debit || 0), 0);
      rows.push(
        `"${j.promoSourceType || j.type || 'PROMO'}","${j.reference || j.id}","${j.date}","${j.supplierName || 'Internal Toko'}","${j.promoCode || '-'}",${amt},"${(j.description || '').replace(/"/g, '""')}"`
      );
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-beban-promo-rebate-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Laporan Audit Beban Promo & Klaim Supplier berhasil diekspor (CSV).', 'success');
  };

  const cardSurface = isLight
    ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.14)]'
    : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)]';

  const subtleDivider = isLight ? 'border-slate-200' : 'border-slate-800';

  return (
    <div id="promo-audit-rebate-tab" className="space-y-6 font-sans">
      {/* Header & Summary Strip */}
      <div className={`p-5 rounded-2xl border transition-all duration-200 ${cardSurface}`}>
        <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b ${subtleDivider}`}>
          <div>
            <h2 className="text-lg leading-7 font-semibold text-slate-900 dark:text-white tracking-tight">
              Audit Beban Promo & Klaim Rebate Supplier
            </h2>
            <p className="text-sm leading-5 text-slate-600 dark:text-slate-400 mt-0.5">
              Klasifikasi jurnal otomatis real-time dari transaksi POS ke Piutang Rebate Vendor (1-10305), Beban Clearance FEFO (5-10201), dan Beban Promosi Toko (5-10202).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onNavigateToAP && (
              <button
                type="button"
                onClick={onNavigateToAP}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Buka Hutang Dagang (AP)</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit CSV</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
          {/* KPI 1: SUPPLIER_TPR */}
          <div className={`rounded-xl p-4 border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Piutang Rebate (1-10305)</span>
              <Building2 className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="mt-1.5 text-xl font-mono font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums">
              Rp {metrics.claimableRebateTotal.toLocaleString('id-ID')}
            </div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
              {metrics.claimableCount} klaim siap potong AP · Sudah offset Rp {metrics.settledOrOffsetRebateTotal.toLocaleString('id-ID')}
            </div>
          </div>

          {/* KPI 2: FEFO_EXP */}
          <div className={`rounded-xl p-4 border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Clearance FEFO (5-10201)</span>
              <PackageCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-1.5 text-xl font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
              Rp {metrics.fefoExpense.toLocaleString('id-ID')}
            </div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
              {metrics.fefoQtySaved} unit terselamatkan · Omzet Rp {metrics.fefoSalvageRevenue.toLocaleString('id-ID')} ({metrics.fefoRecoveryRatio}%)
            </div>
          </div>

          {/* KPI 3: SEASONAL & STORE_BND */}
          <div className={`rounded-xl p-4 border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Promosi Toko (5-10202)</span>
              <Tag className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-1.5 text-xl font-mono font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
              Rp {metrics.storePromoExpense.toLocaleString('id-ID')}
            </div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
              Seasonal Rp {metrics.seasonalExpense.toLocaleString('id-ID')} · Bundling Rp {metrics.storeBndExpense.toLocaleString('id-ID')}
            </div>
          </div>

          {/* KPI 4: TOTAL PROMO REALIZATION */}
          <div className={`rounded-xl p-4 border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Total Nilai Promo POS</span>
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-1.5 text-xl font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              Rp {metrics.totalPromoImpact.toLocaleString('id-ID')}
            </div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
              Rasio {metrics.promoToSalesPct}% dari omzet POS · {promoJournals.length} jurnal tercatat
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Segmented Controls */}
      <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${cardSurface}`}>
        <div className={`flex flex-wrap items-center gap-1 p-1 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          {[
            { id: 'ALL', label: 'Semua Ringkasan' },
            { id: 'SUPPLIER_TPR', label: `Klaim Rebate Supplier (${supplierRebateClaims.length})` },
            { id: 'FEFO_EXP', label: `Penyelamatan FEFO (${fefoRecords.length})` },
            { id: 'STORE_PROMO', label: `Promo Toko (${storePromoRecords.length})` },
            { id: 'JOURNALS', label: `Jurnal Double-Entry (${promoJournals.length})` },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubView(item.id as AuditSubView)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                subView === item.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari supplier, no. struk, kode promo, COA..."
            className={`w-full pl-9 pr-8 py-2 rounded-lg border text-sm outline-none transition ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: DAFTAR TAGIHAN REBATE SUPPLIER (SUPPLIER_TPR) */}
      {(subView === 'ALL' || subView === 'SUPPLIER_TPR') && (
        <div className={`rounded-2xl border overflow-hidden ${cardSurface}`}>
          <div className={`p-4 flex flex-wrap items-center justify-between gap-3 border-b ${subtleDivider}`}>
            <div>
              <h3 className="text-base font-medium text-slate-900 dark:text-white">
                Daftar Tagihan Rebate Supplier (SUPPLIER_TPR · Akun 1-10305)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Piutang rebate vendor hasil potongan/bonus POS yang siap dipotongkan ke faktur Hutang Dagang (AP) atau dicairkan ke rekening bank.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className={`flex items-center gap-1 p-0.5 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                {[
                  { id: 'ALL', label: 'Semua' },
                  { id: 'CLAIMABLE', label: 'Siap Potong AP' },
                  { id: 'DONE', label: 'Selesai' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setClaimStatusFilter(f.id as 'ALL' | 'CLAIMABLE' | 'DONE')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                      claimStatusFilter === f.id
                        ? 'bg-slate-800 dark:bg-slate-700 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {selectedClaimIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleBulkOffsetSelected}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Potong AP Terpilih ({selectedClaimIds.length})</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={`text-[11px] font-mono uppercase tracking-wider border-b ${isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-[#0d1117] text-slate-400 border-slate-800'}`}>
                <tr>
                  <th className="py-3 px-4 w-10 text-center">Pilih</th>
                  <th className="py-3 px-4">No. Struk & Tanggal</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Promo & Produk</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Nominal Rebate</th>
                  <th className="py-3 px-4">Status Klaim</th>
                  <th className="py-3 px-4 text-right">Aksi Penyelesaian</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                      Belum ada klaim rebate SUPPLIER_TPR pada filter ini. Lakukan transaksi POS dengan produk promo vendor untuk mencatat piutang rebate otomatis.
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((clm) => {
                    const isClaimable = clm.status === 'CLAIMABLE';
                    const isChecked = selectedClaimIds.includes(clm.id);
                    return (
                      <tr key={clm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            disabled={!isClaimable}
                            checked={isChecked}
                            onChange={() => toggleClaimSelection(clm.id)}
                            className="rounded border-slate-400 cursor-pointer disabled:opacity-30"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          <div className="text-cyan-600 dark:text-cyan-400 font-medium">{clm.receiptNumber}</div>
                          <div className="text-slate-500 dark:text-slate-400 mt-0.5">{clm.date.slice(0, 10)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">{clm.supplierName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">Jurnal: {clm.journalRef}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs font-mono text-slate-700 dark:text-slate-300">{clm.promoCode}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[260px]" title={clm.productNames.join(', ')}>
                            {clm.productNames.join(', ')}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {clm.qtyUnits}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-cyan-600 dark:text-cyan-400">
                          Rp {clm.claimAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {clm.status === 'CLAIMABLE' ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              Siap Potong AP
                            </span>
                          ) : clm.status === 'DEDUCTED_AP' ? (
                            <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                              <span>Dipotong ke AP</span>
                              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                {clm.deductedInvoiceNumber}
                              </div>
                            </div>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              Cair via Bank
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {isClaimable ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openOffsetModal([clm])}
                                className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition cursor-pointer whitespace-nowrap"
                              >
                                Potongkan ke AP
                              </button>
                              <button
                                type="button"
                                onClick={() => settleRebateClaimCash(clm.id)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer whitespace-nowrap"
                              >
                                Cair Bank
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Terealisasi</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: REALISASI PENYELAMATAN STOK FEFO (FEFO_EXP) */}
      {(subView === 'ALL' || subView === 'FEFO_EXP') && (
        <div className={`rounded-2xl border overflow-hidden ${cardSurface}`}>
          <div className={`p-4 border-b ${subtleDivider}`}>
            <h3 className="text-base font-medium text-slate-900 dark:text-white">
              Realisasi Clearance & Penyelamatan Stok Kadaluarsa (FEFO_EXP · Akun 5-10201)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dipisahkan dari diskon promosi toko agar tim keuangan dapat mengevaluasi nilai omzet yang berhasil diselamatkan sebelum stok kedaluwarsa.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={`text-[11px] font-mono uppercase tracking-wider border-b ${isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-[#0d1117] text-slate-400 border-slate-800'}`}>
                <tr>
                  <th className="py-3 px-4">No. Struk & Tanggal</th>
                  <th className="py-3 px-4">Kode Promo FEFO</th>
                  <th className="py-3 px-4">Keterangan Jurnal</th>
                  <th className="py-3 px-4 text-right">Unit Diselamatkan</th>
                  <th className="py-3 px-4 text-right">Omzet Terselamatkan</th>
                  <th className="py-3 px-4 text-right">Beban Clearance (5-10201)</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                {fefoRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      Belum ada transaksi clearance FEFO_EXP yang tercatat.
                    </td>
                  </tr>
                ) : (
                  fefoRecords.map((j) => {
                    const amt = Number(j.amount) || (j.lines || []).reduce((s, l) => s + (l.debit || 0), 0);
                    return (
                      <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs">
                          <div className="text-cyan-600 dark:text-cyan-400">{j.reference}</div>
                          <div className="text-slate-500 dark:text-slate-400">{j.date}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-amber-600 dark:text-amber-400">
                          {j.promoCode || 'FEFO_EXP'}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300 max-w-md truncate" title={j.description}>
                          {j.description}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-white">
                          {j.fefoQtySaved || 0} unit
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                          Rp {(j.fefoSalvageRevenue || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                          Rp {amt.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: BEBAN PROMOSI & DISKON TOKO (SEASONAL & STORE_BND) */}
      {(subView === 'ALL' || subView === 'STORE_PROMO') && (
        <div className={`rounded-2xl border overflow-hidden ${cardSurface}`}>
          <div className={`p-4 border-b ${subtleDivider}`}>
            <h3 className="text-base font-medium text-slate-900 dark:text-white">
              Beban Promosi & Diskon Penjualan Toko (SEASONAL & STORE_BND · Akun 5-10202)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Akumulasi subsidi margin promo musiman, PWP Tebus Murah internal, bundling paket toko, dan voucher keranjang.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={`text-[11px] font-mono uppercase tracking-wider border-b ${isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-[#0d1117] text-slate-400 border-slate-800'}`}>
                <tr>
                  <th className="py-3 px-4">No. Struk & Tanggal</th>
                  <th className="py-3 px-4">Sumber</th>
                  <th className="py-3 px-4">Kode Promo</th>
                  <th className="py-3 px-4">Keterangan Jurnal</th>
                  <th className="py-3 px-4 text-right">Beban Promosi (5-10202)</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                {storePromoRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      Belum ada transaksi promo SEASONAL / STORE_BND yang tercatat.
                    </td>
                  </tr>
                ) : (
                  storePromoRecords.map((j) => {
                    const amt = Number(j.amount) || (j.lines || []).reduce((s, l) => s + (l.debit || 0), 0);
                    return (
                      <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs">
                          <div className="text-cyan-600 dark:text-cyan-400">{j.reference}</div>
                          <div className="text-slate-500 dark:text-slate-400">{j.date}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                          {j.promoSourceType || 'SEASONAL'}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                          {j.promoCode || '-'}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-md truncate" title={j.description}>
                          {j.description}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">
                          Rp {amt.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: JURNAL OTOMATIS DOUBLE-ENTRY */}
      {(subView === 'ALL' || subView === 'JOURNALS') && (
        <div className={`rounded-2xl border overflow-hidden ${cardSurface}`}>
          <div className={`p-4 border-b ${subtleDivider}`}>
            <h3 className="text-base font-medium text-slate-900 dark:text-white">
              Jurnal Akuntansi Otomatis Promo & Settlement (Double-Entry)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Terhubung langsung ke Laporan Laba Rugi dan Neraca Saldo pada modul Laporan Keuangan.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={`text-[11px] font-mono uppercase tracking-wider border-b ${isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-[#0d1117] text-slate-400 border-slate-800'}`}>
                <tr>
                  <th className="py-3 px-4">ID Jurnal & Ref</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Deskripsi Transaksi</th>
                  <th className="py-3 px-4">Akun COA</th>
                  <th className="py-3 px-4 text-right">Debit</th>
                  <th className="py-3 px-4 text-right">Kredit</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                {filteredJournals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      Belum ada entri jurnal promo otomatis yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredJournals.map((j) =>
                    (j.lines || []).map((line, lIdx) => (
                      <tr key={`${j.id}-${lIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-xs">
                        <td className="py-2.5 px-4 font-mono">
                          {lIdx === 0 ? (
                            <>
                              <div className="text-cyan-600 dark:text-cyan-400">{j.reference}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">{j.id}</div>
                            </>
                          ) : (
                            <span className="text-slate-400">↳</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {lIdx === 0 ? j.date : ''}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 max-w-sm truncate" title={j.description}>
                          {lIdx === 0 ? j.description : ''}
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          <span className="text-slate-900 dark:text-white">{line.accountCode}</span>
                          <span className="text-slate-400 mx-1.5">·</span>
                          <span className="text-slate-600 dark:text-slate-400">{line.accountName}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                          {line.debit > 0 ? `Rp ${line.debit.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400">
                          {line.credit > 0 ? `Rp ${line.credit.toLocaleString('id-ID')}` : '-'}
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL OFFSET KLAIM REBATE KE HUTANG DAGANG (AP) */}
      {offsetClaimsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${
              isLight
                ? 'bg-white border-cyan-500/70 text-slate-900'
                : 'bg-[#161b22] border-cyan-500/40 text-slate-100'
            }`}
          >
            <div className={`flex items-start justify-between pb-3 border-b ${subtleDivider}`}>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Potong Hutang Dagang (AP) dengan Klaim Rebate
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {offsetClaimsTarget.length} klaim terpilih · Total klaim Rp{' '}
                  {offsetClaimsTarget.reduce((s, c) => s + c.claimAmount, 0).toLocaleString('id-ID')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOffsetClaimsTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmOffset} className="pt-4 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Faktur Hutang Dagang (AP) yang Akan Dipotong
                </label>
                {unpaidApInvoices.length === 0 ? (
                  <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-300">
                    Tidak ada tagihan Hutang Dagang (AP) belum lunas saat ini. Gunakan tombol &quot;Cair Bank&quot; jika vendor membayar rebate via transfer.
                  </div>
                ) : (
                  <select
                    value={selectedApInvoiceId}
                    onChange={(e) => setSelectedApInvoiceId(e.target.value)}
                    required
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                        : 'bg-[#0d1117] border-slate-700 text-white focus:border-cyan-500'
                    }`}
                  >
                    {unpaidApInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.vendor} · {inv.invoice_number} (Sisa Rp {inv.amount.toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedApInvoiceId && (() => {
                const chosenInv = unpaidApInvoices.find((i) => i.id === selectedApInvoiceId);
                const rawClaim = offsetClaimsTarget.reduce((s, c) => s + c.claimAmount, 0);
                const applied = chosenInv ? Math.min(chosenInv.amount, rawClaim) : rawClaim;
                const remaining = chosenInv ? Math.max(0, chosenInv.amount - applied) : 0;
                return (
                  <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-slate-800'}`}>
                    <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Pratinjau Jurnal Otomatis (AP Rebate Offset)</span>
                    </div>
                    <div className="font-mono text-[11px] space-y-0.5 text-slate-600 dark:text-slate-400">
                      <div>Debit · 2-10101 Hutang Dagang (AP): Rp {applied.toLocaleString('id-ID')}</div>
                      <div>Kredit · 1-10305 Piutang Rebate Supplier: Rp {applied.toLocaleString('id-ID')}</div>
                    </div>
                    {chosenInv && (
                      <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex justify-between font-mono">
                        <span>Sisa Hutang Invoice Setelah Potong:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Rp {remaining.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOffsetClaimsTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!selectedApInvoiceId || unpaidApInvoices.length === 0}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-medium cursor-pointer"
                >
                  Konfirmasi Potong Hutang AP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoAuditRebateTab;
