import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAudit } from '../../audit';
import MasterDataModule from '../master/MasterDataModule';
import { AbcMarginMatrixTab } from './AbcMarginMatrixTab';
import { PromoCampaignCenterTab } from './PromoCampaignCenterTab';
import { ExecutiveAuditLogTab } from './ExecutiveAuditLogTab';
import {
  BUSINESS_MECHANISM_FAMILIES,
  CANONICAL_SECTOR_META,
  getBusinessModelDefinition,
  getEffectiveBusinessDomainConfig,
  resolveCanonicalSector,
} from '../../utils/businessDomainConfig';
import {
  BUILDING_HARDWARE_PRODUCTS,
  FASHION_APPAREL_PRODUCTS,
  ELECTRONICS_GADGETS_PRODUCTS,
  AUTOMOTIVE_WORKSHOP_PRODUCTS,
  SALON_BARBERSHOP_PRODUCTS,
  PHARMACY_HEALTHCARE_PRODUCTS,
} from '../../data/industryTerminalProducts';
import { FNB_PRODUCTS } from '../../data/fnbData';
import { RAW_INGREDIENTS_AS_PRODUCTS } from '../../data/rawIngredientsData';
import {
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  Zap,
  Activity,
  Layers,
  DollarSign,
  Warehouse,
  ArrowUpRight,
  Sparkles,
  Building2,
  Archive,
  Sliders,
  Shield,
  CheckSquare,
  Square,
  RefreshCw,
  PieChart,
  BarChart3,
  ArrowRight,
  Lock,
  Send,
  SlidersHorizontal,
  UtensilsCrossed,
  Shirt,
  Database,
  X,
  BrainCircuit,
  ChevronDown,
  Truck,
  HardHat,
  Boxes,
  PackageCheck,
  Wrench,
  Smartphone,
  Scale,
  FileSpreadsheet,
  Tag,
  Flame,
  Users,
  ShoppingBag,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { fetchExecutiveAiAdvice, ExecutiveRecommendation } from '../../services/executiveAiAdvisor';
import { extractLaundryOrderMetrics } from '../../utils/laundryCommission';
import {
  calculateFashionExecutiveAnalytics,
} from '../../utils/fashionAnalytics';

export const ExecutiveModule: React.FC = () => {
  const { theme } = useApp();
  const { recordAudit } = useAudit();
  const isDark = theme === 'dark';

  const {
    products,
    salesHistory,
    purchaseRequests,
    purchasing,
    goodsReceipts,
    customers,
    activeBranchId,
    voidItemLogs,
    terminals,
    users,
    invoicesDue,
    payVendorInvoice,
    getLiquidCashBalance,
    finance,
    employees,
    updatePurchaseOrderPayment,
    approvePurchaseRequest,
    rejectPurchaseRequest,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    buildingDeliveryOrders,
    updateBuildingDeliveryStatus,
    bulkShrinkageLogs,
    recordBulkShrinkage,
    buildingAuthRequests,
    approveBuildingAuthRequest,
    rejectBuildingAuthRequest,
    showToast,
    activeUser,
    currentUser,
    businessProfile,
    businessDomainConfig,
    activeSector: ctxActiveSector,
    isFnb: ctxIsFnb,
    isFashion: ctxIsFashion,
    isBuilding: ctxIsBuilding,
    isService: ctxIsService,
    isRetail: ctxIsRetail,
    businessVertical: ctxBusinessVertical,
    laundryOrders,
    stockMutations,
    fnbToppings,
    updateUserPin,
  } = useApp() as any;

  const effectiveUser = currentUser || activeUser;
  const [execStaffPinInputs, setExecStaffPinInputs] = useState<Record<string, string>>({});

  const isSuperAdminAccountExec = (u?: any): boolean => {
    if (!u) return false;
    const roleStr = String(u.role || '').toUpperCase();
    const divStr = String(u.division || '').toUpperCase();
    const idStr = String(u.user_id || u.id || '').toUpperCase();
    return (
      roleStr.includes('SUPER') ||
      divStr.includes('SUPER') ||
      idStr === 'USR-001' ||
      idStr === 'USR-SUPERADMIN'
    );
  };

  const effectiveDomainConfig = useMemo(
    () => (businessProfile ? getEffectiveBusinessDomainConfig(businessProfile) : businessDomainConfig),
    [businessProfile, businessDomainConfig]
  );
  const activeSector = useMemo(
    () => ctxActiveSector || resolveCanonicalSector(effectiveDomainConfig),
    [ctxActiveSector, effectiveDomainConfig]
  );
  const isFnb = typeof ctxIsFnb === 'boolean' ? ctxIsFnb : activeSector === 'FNB';
  const isFashion = typeof ctxIsFashion === 'boolean' ? ctxIsFashion : activeSector === 'FASHION';
  const isBuilding = typeof ctxIsBuilding === 'boolean' ? ctxIsBuilding : activeSector === 'BUILDING';
  const isService = typeof ctxIsService === 'boolean' ? ctxIsService : activeSector === 'SERVICE';
  const isRetail = typeof ctxIsRetail === 'boolean' ? ctxIsRetail : activeSector === 'RETAIL';

  const activeFamily = effectiveDomainConfig.mechanismFamily;
  const businessVertical = activeSector || ctxBusinessVertical || 'RETAIL';
  const activeModelDef = useMemo(
    () => getBusinessModelDefinition(effectiveDomainConfig.primaryBusinessModel),
    [effectiveDomainConfig.primaryBusinessModel]
  );
  const activeFamilyMeta = BUSINESS_MECHANISM_FAMILIES[activeFamily];
  const isBuildingBulkActive = isBuilding;
  const isLaundryActive = isService && effectiveDomainConfig.primaryBusinessModel === 'LAUNDRY';
  const isNonLaundryServiceActive = isService && effectiveDomainConfig.primaryBusinessModel !== 'LAUNDRY';
  // Strict Gatekeeper: Cockpit Fashion & Butik HANYA aktif saat isFashion === true
  const isFashionActive = isFashion;

  const enterpriseHeaderBadge =
    CANONICAL_SECTOR_META[activeSector as keyof typeof CANONICAL_SECTOR_META]?.enterpriseBadge ||
    'RETAIL ENTERPRISE';

  // 1. Deteksi Multi-Cabang Otomatis
  const registeredBranchIds = Array.from(new Set([
    ...(salesHistory || []).map((s: any) => s.branchId).filter(Boolean),
    ...(products || []).map((p: any) => p.branchId).filter(Boolean)
  ]));

  const isMultiBranch = registeredBranchIds.length > 1;
  const selectedBranch = isMultiBranch ? (activeBranchId || 'ALL') : 'ALL';

  // State Eksekutif & Interaksi Dinamis
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [execDoStatusFilter, setExecDoStatusFilter] = useState<'ALL' | 'MENUNGGU_MUAT' | 'DALAM_PENGIRIMAN' | 'TERKIRIM_PROYEK'>('ALL');
  const [execShrinkProductId, setExecShrinkProductId] = useState<string>('MAT-PASIR-01');
  const [execShrinkQty, setExecShrinkQty] = useState<string>('0.5');
  const [execShrinkReason, setExecShrinkReason] = useState<string>('Susut penguapan & tercecer muat di yard material');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);
  const [selectedAPIds, setSelectedAPIds] = useState<string[]>([]);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedDivisionIndex, setSelectedDivisionIndex] = useState<number | null>(null);
  const [activeSliderTrack, setActiveSliderTrack] = useState<'ap' | 'payroll' | 'restock' | null>(null);

  const [selectedHourlyAudit, setSelectedHourlyAudit] = useState<{
    hour: number;
    label: string;
    txCount: number;
    totalRevenue: number;
    txs: any[];
    anomalies: any[];
    hasAnomaly: boolean;
  } | null>(null);

  const [selectedSKUDetails, setSelectedSKUDetails] = useState<{
    product: any;
    soldQty: number;
    marginPercent: number;
    costPrice: number;
    sellingPrice: number;
    totalProfit: number;
    quadrant: 'star' | 'workhorse' | 'opportunity' | 'deadstock';
    recommendation: string;
  } | null>(null);

  const [selectedFlowStage, setSelectedFlowStage] = useState<'revenue' | 'cogs' | 'opex' | 'netprofit' | 'cashinflow' | null>(null);

  const [aiRecommendations, setAiRecommendations] = useState<ExecutiveRecommendation[] | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [managerDecisions, setManagerDecisions] = useState<Array<{
    id: string;
    timestamp: string;
    kategori: string;
    fakta: string;
    saran: string;
    decision: 'DITINDAKLANJUTI' | 'DIABAIKAN';
  }>>([]);

  const handleManagerDecision = (rec: ExecutiveRecommendation, decision: 'DITINDAKLANJUTI' | 'DIABAIKAN') => {
    const timestamp = new Date().toLocaleString('id-ID');
    const newEntry = {
      id: `${rec.id}-${Date.now()}`,
      timestamp,
      kategori: rec.kategori,
      fakta: rec.fakta_data,
      saran: rec.saran_tindakan,
      decision,
    };
    setManagerDecisions(prev => [newEntry, ...prev]);
    recordAudit({
      traceId: `EXEC-AI-DECISION-${Date.now()}`,
      userId: 'executive-cockpit',
      userName: 'Manager Eksekutif',
      userRole: 'Manager',
      module: 'EXECUTIVE',
      action: 'CONFIG_CHANGE',
      severity: decision === 'DITINDAKLANJUTI' ? 'INFO' : 'WARN',
      payloadAfter: {
        recommendationId: rec.id,
        kategori: rec.kategori,
        fakta: rec.fakta_data,
        saran: rec.saran_tindakan,
        decision,
      },
    });
    if (showToast) showToast(`Keputusan Manager [${decision}] berhasil dicatat ke Tata Kelola & Audit Log.`);
    if (decision === 'DITINDAKLANJUTI' && rec.aksi_target) {
      setActiveTab(rec.aksi_target);
    }
  };

  const handleRunAiAnalysis = async () => {
    setIsAnalyzingAi(true);
    try {
      const sampleDs = skuQuadrantList.find((s: any) => s.quadrant === 'deadstock');
      const sampleStar = skuQuadrantList.find((s: any) => s.quadrant === 'star');
      const criticalProds = activeDomainProducts.filter((p: any) => (p.stock || 0) <= (p.minStock || 5));
      const estRestockCost = criticalProds.reduce((acc: number, p: any) => acc + (((p.minStock || 5) - (p.stock || 0)) * (p.costPrice || p.price * 0.7 || 50000)), 0);

      const snapshot = {
        totalOmzet,
        liquidCash: kasOperasional,
        pendingPrPoCount: pendingPRs.length,
        apDueThisWeek: dueThisWeek,
        criticalStockCount: criticalProds.length,
        deadStockCount: skuQuadrantList.filter((s: any) => s.quadrant === 'deadstock').length,
        blindShiftVarianceCount: voidItemLogs ? voidItemLogs.length : 0,
        restockPlafonAmount: kasOperasional * 0.25,
        estimatedRestockCostTotal: estRestockCost || 15000000,
        sampleDeadstock: sampleDs ? { id: sampleDs.product.id, name: sampleDs.product.name, cost: sampleDs.costPrice, price: sampleDs.sellingPrice } : undefined,
        sampleFastMoving: sampleStar ? { id: sampleStar.product.id, name: sampleStar.product.name, cost: sampleStar.costPrice, price: sampleStar.sellingPrice } : undefined,
      };
      const recs = await fetchExecutiveAiAdvice(snapshot);
      setAiRecommendations(recs);
      if (showToast) showToast('Analisis AI Executive Advisor berhasil diselesaikan.');
    } catch {
      if (showToast) showToast('Gagal menjalankan analisis AI.');
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // State Alokasi Kas & Intervensi
  const [frozenCashiers, setFrozenCashiers] = useState<string[]>([]);
  const [lockedVoidCashiers, setLockedVoidCashiers] = useState<string[]>([]);
  const [treasurySplit, setTreasurySplit] = useState<{ ap: number; payroll: number; restock: number }>({
    ap: 40,
    payroll: 35,
    restock: 25
  });
  const [isTreasuryLocked, setIsTreasuryLocked] = useState<boolean>(false);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  // 2. Filter Penjualan Selesai Riil
  const filteredSales = (salesHistory || []).filter((t: any) =>
    (!isMultiBranch || selectedBranch === 'ALL' || t.branchId === selectedBranch) &&
    (t.status === 'COMPLETED' || t.status === 'PAID' || !t.status)
  );

  const totalOmzet = filteredSales.reduce((acc: number, curr: any) => acc + (Number(curr.total_amount ?? curr.total) || 0), 0);
  const totalStruk = filteredSales.length;

  // 3. Filter Produk Riil
  const filteredProducts = (products || []).filter((p: any) =>
    !isMultiBranch || selectedBranch === 'ALL' || p.branchId === selectedBranch
  );

  // 3b. Analitik Khusus Rumpun BUILDING_BULK (Material Bangunan, Curah m³/Ret, Surat Jalan & Piutang Proyek)
  const buildingBulkAnalytics = useMemo(() => {
    const isBuildingProduct = (p: any) => {
      const idStr = String(p?.id || '');
      const catLower = String(p?.category || '').toLowerCase();
      return (
        p?.businessModel === 'building' ||
        idStr.startsWith('MAT-') ||
        Boolean(p?.materialNature) ||
        ['semen', 'pasir', 'batu', 'besi', 'baja', 'perpipaan', 'paku', 'kawat', 'kayu', 'cat', 'perkakas', 'material'].some(
          (kw) => catLower.includes(kw)
        )
      );
    };

    const isBulkCurahProduct = (p: any) => {
      const unitLower = String(p?.unit || '').toLowerCase();
      const catLower = String(p?.category || '').toLowerCase();
      return (
        p?.materialNature === 'BULK_CURAH' ||
        unitLower.includes('m³') ||
        unitLower.includes('m3') ||
        unitLower.includes('kubik') ||
        unitLower.includes('ret') ||
        (Array.isArray(p?.bulkFleetTiers) && p.bulkFleetTiers.length > 0) ||
        catLower.includes('pasir') ||
        catLower.includes('batu')
      );
    };

    const mergedMap = new Map<string, any>();
    BUILDING_HARDWARE_PRODUCTS.forEach((p) => mergedMap.set(p.id, p));
    filteredProducts.forEach((p: any) => {
      if (isBuildingProduct(p)) {
        mergedMap.set(p.id, p);
      }
    });
    const catalog = Array.from(mergedMap.values());

    const bulkItems = catalog.filter(isBulkCurahProduct);
    const unitItems = catalog.filter((p) => !isBulkCurahProduct(p));

    const calcItemVal = (p: any) =>
      (Number(p.stock) || 0) * (Number(p.costPrice ?? p.cost_price ?? p.buy_price) || 0);

    const bulkValuation = bulkItems.reduce((sum, p) => sum + calcItemVal(p), 0);
    const unitValuation = unitItems.reduce((sum, p) => sum + calcItemVal(p), 0);
    const totalValuation = bulkValuation + unitValuation;
    const bulkSharePercent = totalValuation > 0 ? Math.round((bulkValuation / totalValuation) * 100) : 0;
    const unitSharePercent = totalValuation > 0 ? 100 - bulkSharePercent : 0;

    const totalBulkStockQty = bulkItems.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
    const totalUnitStockQty = unitItems.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);

    // Status Surat Jalan (DO) & Ritase Armada dari buildingDeliveryOrders real-time + salesHistory + GR vendor
    const liveDoList = Array.isArray(buildingDeliveryOrders) ? buildingDeliveryOrders : [];
    const trackedTxOrDoIds = new Set<string>();
    liveDoList.forEach((d: any) => {
      if (d.transactionId) trackedTxOrDoIds.add(String(d.transactionId));
      if (d.receiptNumber) trackedTxOrDoIds.add(String(d.receiptNumber));
    });

    const extraFleetSales = filteredSales.filter((s: any) => {
      const txKey = String(s.transaction_id || s.id || '');
      const recKey = String(s.receipt_number || '');
      if ((txKey && trackedTxOrDoIds.has(txKey)) || (recKey && trackedTxOrDoIds.has(recKey))) {
        return false;
      }
      return (
        Boolean(s.deliveryFleetActive) ||
        s.deliveryPolicy === 'FRANGKO' ||
        Boolean(s.fleetType) ||
        (Array.isArray(s.items) &&
          s.items.some(
            (it: any) =>
              it.deliveryMethod === 'FLEET_DELIVERY' ||
              it.product?.businessModel === 'building' ||
              String(it.product?.id || '').startsWith('MAT-') ||
              Boolean(it.product?.materialNature)
          ))
      );
    });

    let pickupTrips = 0;
    let truckTrips = 0;
    let dumpTruckTrips = 0;
    let totalEstimatedVolumeM3 = 0;
    let waitingLoadCount = 0;
    let inTransitCount = 0;
    let deliveredCount = 0;

    liveDoList.forEach((d: any) => {
      if (d.status === 'MENUNGGU_MUAT') waitingLoadCount += 1;
      else if (d.status === 'DALAM_PENGIRIMAN') inTransitCount += 1;
      else if (d.status === 'TERKIRIM_PROYEK') deliveredCount += 1;

      if (d.fleetType === 'DUMP_TRUCK') dumpTruckTrips += 1;
      else if (d.fleetType === 'TRUCK_ENGKEL') truckTrips += 1;
      else pickupTrips += 1;

      totalEstimatedVolumeM3 += Number(d.estimatedVolumeM3) || 1.2;
    });

    extraFleetSales.forEach((s: any) => {
      const items = Array.isArray(s.items) ? s.items : [];
      let hasMatchedFleet = false;
      items.forEach((it: any) => {
        const unitLabel = String(it.selectedUnit || it.product?.unit || '').toLowerCase();
        const qty = Number(it.quantity ?? it.qty) || 1;
        if (unitLabel.includes('dump') || unitLabel.includes('6.5')) {
          dumpTruckTrips += 1;
          totalEstimatedVolumeM3 += qty * 6.5;
          hasMatchedFleet = true;
        } else if (unitLabel.includes('engkel') || unitLabel.includes('truk') || unitLabel.includes('3.0')) {
          truckTrips += 1;
          totalEstimatedVolumeM3 += qty * 3.0;
          hasMatchedFleet = true;
        } else if (unitLabel.includes('pick') || unitLabel.includes('ret') || unitLabel.includes('m³') || unitLabel.includes('m3')) {
          pickupTrips += 1;
          totalEstimatedVolumeM3 += unitLabel.includes('m³') || unitLabel.includes('m3') ? qty : qty * 1.2;
          hasMatchedFleet = true;
        }
      });
      if (!hasMatchedFleet && (s.deliveryFleetActive || s.deliveryPolicy === 'FRANGKO')) {
        if (s.fleetType === 'DUMP_TRUCK') {
          dumpTruckTrips += 1;
          totalEstimatedVolumeM3 += 6.5;
        } else if (s.fleetType === 'TRUCK_ENGKEL') {
          truckTrips += 1;
          totalEstimatedVolumeM3 += 3.0;
        } else {
          pickupTrips += 1;
          totalEstimatedVolumeM3 += 1.2;
        }
      }
      if (s.deliveryFleetActive || s.deliveryPolicy === 'FRANGKO') waitingLoadCount += 1;
      else deliveredCount += 1;
    });

    const totalRitaseArmada = pickupTrips + truckTrips + dumpTruckTrips;
    const inboundVendorDoCount = (goodsReceipts || []).filter((gr: any) => Boolean(gr.deliveryOrderNumber)).length;
    const recentDoList = [
      ...liveDoList.map((d: any) => ({
        doNumber: d.doNumber,
        customer: d.customerName,
        summary: d.itemsSummary,
        total: Number(d.totalOrderValue) || 0,
        isFleet: d.deliveryPolicy === 'FRANGKO',
        status: d.status,
        fleetLabel: d.fleetVehicleName || d.fleetType,
        date: d.date,
      })),
      ...extraFleetSales.slice(0, 4).map((s: any) => ({
        doNumber: s.deliveryOrderNumber || `DO-${String(s.receipt_number || s.transaction_id || 'POS').slice(-8)}`,
        customer: s.customer_name || s.petOrClientName || 'Proyek / Pelanggan Depo',
        summary: s.items_summary || 'Material Bangunan',
        total: Number(s.total_amount ?? s.total) || 0,
        isFleet: Boolean(s.deliveryFleetActive || s.deliveryPolicy === 'FRANGKO'),
        status: s.deliveryFleetActive || s.deliveryPolicy === 'FRANGKO' ? 'MENUNGGU_MUAT' : 'TERKIRIM_PROYEK',
        fleetLabel: s.fleetVehicleName || 'Armada Depo',
        date: s.created_at || s.date,
      })),
    ].slice(0, 6);

    const shrinkageLogsList = Array.isArray(bulkShrinkageLogs) ? bulkShrinkageLogs : [];
    const totalShrinkageLossValue = shrinkageLogsList.reduce(
      (sum: number, l: any) => sum + (Number(l.costValueLoss) || 0),
      0
    );

    // Piutang Proyek / Kontraktor (Tempo & DP)
    const todayStr = new Date().toISOString().slice(0, 10);
    const receivableInvoices = (invoicesDue || []).filter((inv: any) => inv.type === 'RECEIVABLE');
    const unpaidReceivables = receivableInvoices.filter(
      (inv: any) => inv.status !== 'PAID' && inv.status !== 'Paid' && inv.status !== 'Lunas'
    );
    const overdueReceivables = unpaidReceivables.filter(
      (inv: any) => inv.status === 'Overdue' || (inv.due_date && inv.due_date < todayStr)
    );

    const creditPosSales = filteredSales.filter((s: any) => {
      const pm = String(s.payment_method || '').toUpperCase();
      const totalAmt = Number(s.total_amount ?? s.total) || 0;
      const paidAmt = typeof s.amount_paid === 'number' ? Number(s.amount_paid) : totalAmt;
      return pm.includes('KREDIT') || pm.includes('TEMPO') || pm.includes('AR') || paidAmt < totalAmt;
    });

    const dpCollectedTotal = creditPosSales.reduce((acc: number, s: any) => {
      const totalAmt = Number(s.total_amount ?? s.total) || 0;
      const paidAmt = typeof s.amount_paid === 'number' ? Number(s.amount_paid) : 0;
      return acc + Math.min(Math.max(0, paidAmt), totalAmt);
    }, 0);

    const invoiceNumSet = new Set(
      receivableInvoices.map((inv: any) => String(inv.invoice_number || inv.id || '').toUpperCase())
    );
    const extraPosTempoOutstanding = creditPosSales.reduce((acc: number, s: any) => {
      const ref = String(s.receipt_number || s.transaction_id || '').toUpperCase();
      if (invoiceNumSet.has(ref)) return acc;
      const totalAmt = Number(s.total_amount ?? s.total) || 0;
      const paidAmt = typeof s.amount_paid === 'number' ? Number(s.amount_paid) : 0;
      return acc + Math.max(0, totalAmt - paidAmt);
    }, 0);

    const invoiceArTotal = unpaidReceivables.reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0);
    const overdueArTotal = overdueReceivables.reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0);
    const customerOutstandingExtra = (customers || []).reduce((sum: number, c: any) => {
      const bal = Number(c.outstanding_balance) || 0;
      return sum + bal;
    }, 0);

    const totalPiutangProyek = invoiceArTotal + extraPosTempoOutstanding;

    // Pemisahan Jurnal Biaya Logistik & Est. Laba Bersih Setelah Ongkir (Executive Summary)
    const fleetCostByTrip = pickupTrips * 85000 + truckTrips * 175000 + dumpTruckTrips * 325000;
    let materialRevenueTotal = 0;
    let materialCogsTotal = 0;
    let loadingFeeTotal = 0;
    let recordedFleetCostTotal = 0;

    filteredSales.forEach((s: any) => {
      if (s.status === 'VOID' || s.status === 'VOIDED') return;
      const isBld =
        Boolean(s.deliveryFleetActive) ||
        Boolean(s.fleetType) ||
        (s.loadingFee || 0) > 0 ||
        (s.fleetDeliveryCost || 0) > 0 ||
        (Array.isArray(s.items) && s.items.some((it: any) => isBuildingProduct(it.product)));
      if (!isBld) return;

      const kuli = Number(s.loadingFee) || 0;
      const matRev =
        s.materialRevenue !== undefined
          ? Number(s.materialRevenue)
          : Math.max(0, (Number(s.total_amount ?? s.total) || 0) - kuli);
      const cogs = (Array.isArray(s.items) ? s.items : []).reduce(
        (acc: number, it: any) =>
          acc +
          (Number(it.costPrice || it.product?.cost_price) ||
            Math.round((Number(it.product?.sell_price) || 0) * 0.78)) *
            (Number(it.quantity ?? it.qty) || 1),
        0
      );
      materialRevenueTotal += matRev;
      materialCogsTotal += cogs;
      loadingFeeTotal += kuli;
      if (s.fleetDeliveryCost !== undefined) {
        recordedFleetCostTotal += Number(s.fleetDeliveryCost) || 0;
      }
    });

    if (materialRevenueTotal === 0) {
      const doValSum = liveDoList.reduce((acc: number, d: any) => acc + (Number(d.totalOrderValue) || 0), 0);
      materialRevenueTotal = doValSum > 0 ? doValSum : 46850000;
      materialCogsTotal = Math.round(materialRevenueTotal * 0.77);
      if (loadingFeeTotal === 0) loadingFeeTotal = 425000;
    }

    const fleetDeliveryCostTotal = recordedFleetCostTotal > 0 ? recordedFleetCostTotal : Math.max(fleetCostByTrip, 585000);
    const grossProfitMaterial = materialRevenueTotal - materialCogsTotal;
    const estNetProfitAfterShipping = grossProfitMaterial + loadingFeeTotal - fleetDeliveryCostTotal;

    // Rekap Tagihan Proyek / Statement of Account (SOA) Kontraktor
    const soaMap = new Map<
      string,
      {
        contractorName: string;
        projectName: string;
        doCount: number;
        totalDoDeliveredValue: number;
        totalDpPaid: number;
        remainingTempoBalance: number;
        dueDate: string;
        dueStatus: 'OVERDUE' | 'JATUH_TEMPO_DEKAT' | 'TEMPO_AKTIF' | 'LUNAS';
      }
    >();

    // 1. Seed from live DO list & extra fleet sales
    liveDoList.forEach((d: any) => {
      const key = String(d.customerName || 'Kontraktor Proyek').trim();
      const existing = soaMap.get(key) || {
        contractorName: key,
        projectName: d.destinationAddress || 'Proyek Konstruksi Depo',
        doCount: 0,
        totalDoDeliveredValue: 0,
        totalDpPaid: 0,
        remainingTempoBalance: 0,
        dueDate: d.date || todayStr,
        dueStatus: 'TEMPO_AKTIF' as const,
      };
      existing.doCount += 1;
      existing.totalDoDeliveredValue += Number(d.totalOrderValue) || 0;
      soaMap.set(key, existing);
    });

    // 2. Enrich with POS credit / DP sales
    creditPosSales.forEach((s: any) => {
      const key = String(s.customer_name || 'Kontraktor Proyek').trim();
      const totalAmt = Number(s.total_amount ?? s.total) || 0;
      const paidAmt = typeof s.amount_paid === 'number' ? Number(s.amount_paid) : 0;
      const remAmt = Math.max(0, totalAmt - paidAmt);
      const dueStr = s.dueDate || todayStr;
      const existing = soaMap.get(key) || {
        contractorName: key,
        projectName: s.deliveryDestination || 'Proyek Konstruksi Depo',
        doCount: 0,
        totalDoDeliveredValue: 0,
        totalDpPaid: 0,
        remainingTempoBalance: 0,
        dueDate: dueStr,
        dueStatus: 'TEMPO_AKTIF' as const,
      };
      if (existing.totalDoDeliveredValue < totalAmt) {
        existing.totalDoDeliveredValue = totalAmt;
      }
      existing.totalDpPaid += Math.min(Math.max(0, paidAmt), totalAmt);
      existing.remainingTempoBalance += remAmt;
      if (dueStr) existing.dueDate = dueStr;
      soaMap.set(key, existing);
    });

    // 3. Enrich with Receivable Invoices (AR)
    receivableInvoices.forEach((inv: any) => {
      const key = String(inv.party_name || 'Kontraktor Proyek').trim();
      const remAmt =
        inv.status === 'PAID' || inv.status === 'Paid' || inv.status === 'Lunas'
          ? 0
          : Number(inv.amount) || 0;
      const totalOriginal = Number(inv.original_amount) || (remAmt > 0 ? Math.round(remAmt * 1.4) : Number(inv.amount) || 0);
      const dpEst = Math.max(0, totalOriginal - remAmt);
      const dueStr = inv.due_date || todayStr;
      const existing = soaMap.get(key);
      if (existing) {
        if (existing.remainingTempoBalance === 0 && remAmt > 0) {
          existing.remainingTempoBalance = remAmt;
        }
        if (existing.totalDpPaid === 0 && dpEst > 0) {
          existing.totalDpPaid = dpEst;
        }
        if (existing.totalDoDeliveredValue < existing.totalDpPaid + existing.remainingTempoBalance) {
          existing.totalDoDeliveredValue = existing.totalDpPaid + existing.remainingTempoBalance;
        }
        existing.dueDate = dueStr;
      } else {
        soaMap.set(key, {
          contractorName: key,
          projectName: inv.description || 'Proyek Kontraktor B2B',
          doCount: 2,
          totalDoDeliveredValue: totalOriginal,
          totalDpPaid: dpEst,
          remainingTempoBalance: remAmt,
          dueDate: dueStr,
          dueStatus: 'TEMPO_AKTIF',
        });
      }
    });

    // Ensure rich default Statement of Account rows for building depot
    if (soaMap.size < 2) {
      if (!soaMap.has('CV. Bangun Karya Mandiri')) {
        soaMap.set('CV. Bangun Karya Mandiri', {
          contractorName: 'CV. Bangun Karya Mandiri',
          projectName: 'Cluster Harmoni Tahap 2 (14 Unit)',
          doCount: 3,
          totalDoDeliveredValue: 28500000,
          totalDpPaid: 10000000,
          remainingTempoBalance: 18500000,
          dueDate: '2025-05-20',
          dueStatus: 'TEMPO_AKTIF',
        });
      }
      if (!soaMap.has('PT. Cipta Konstruksi Nusantara')) {
        soaMap.set('PT. Cipta Konstruksi Nusantara', {
          contractorName: 'PT. Cipta Konstruksi Nusantara',
          projectName: 'Renovasi Ruko 3 Lantai Sudirman',
          doCount: 2,
          totalDoDeliveredValue: 19200000,
          totalDpPaid: 6700000,
          remainingTempoBalance: 12500000,
          dueDate: '2025-02-10',
          dueStatus: 'OVERDUE',
        });
      }
    }

    const contractorStatementOfAccounts = Array.from(soaMap.values()).map((row) => {
      let status: 'OVERDUE' | 'JATUH_TEMPO_DEKAT' | 'TEMPO_AKTIF' | 'LUNAS' = 'TEMPO_AKTIF';
      if (row.remainingTempoBalance <= 0) {
        status = 'LUNAS';
      } else if (row.dueDate && row.dueDate < todayStr) {
        status = 'OVERDUE';
      } else if (row.dueDate) {
        const diffDays = Math.ceil(
          (new Date(row.dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays <= 7) status = 'JATUH_TEMPO_DEKAT';
      }
      return {
        ...row,
        dueStatus: status,
      };
    });

    return {
      catalog,
      bulkItems,
      unitItems,
      bulkValuation,
      unitValuation,
      totalValuation,
      bulkSharePercent,
      unitSharePercent,
      totalBulkStockQty,
      totalUnitStockQty,
      fleetSalesCount: liveDoList.length + extraFleetSales.length,
      totalRitaseArmada,
      pickupTrips,
      truckTrips,
      dumpTruckTrips,
      waitingLoadCount,
      inTransitCount,
      deliveredCount,
      totalShrinkageLossValue,
      shrinkageLogsCount: shrinkageLogsList.length,
      totalEstimatedVolumeM3: Number(totalEstimatedVolumeM3.toFixed(1)),
      inboundVendorDoCount,
      recentDoList,
      unpaidReceivables,
      overdueReceivables,
      totalPiutangProyek,
      overdueArTotal,
      dpCollectedTotal,
      creditPosSalesCount: creditPosSales.length,
      customerOutstandingExtra,
      materialRevenueTotal,
      materialCogsTotal,
      grossProfitMaterial,
      loadingFeeTotal,
      fleetDeliveryCostTotal,
      estNetProfitAfterShipping,
      contractorStatementOfAccounts,
    };
  }, [filteredProducts, filteredSales, goodsReceipts, invoicesDue, customers, buildingDeliveryOrders, bulkShrinkageLogs]);

  // 3b-2. Analitik Khusus Rumpun LAUNDRY (Berat Cucian kg, Rasio Express vs Reguler, Piutang Rak & SLA On-Time)
  const laundryExecutiveAnalytics = useMemo(() => {
    const orders: any[] = Array.isArray(laundryOrders) ? laundryOrders : [];
    let totalWeightKg = 0;
    let totalPhysicalPcs = 0;
    let totalSatuanPcs = 0;
    let totalPasang = 0;
    let totalAreaM2 = 0;
    let expressCount = 0;
    let kilatCount = 0;
    let regulerCount = 0;
    let piutangRakAmount = 0;
    let piutangTotalLaundryAmount = 0;
    let unpaidOrdersCount = 0;
    let readyRackOrdersCount = 0;
    let totalLaundryRevenue = 0;
    let totalCashDpCollected = 0;
    let onTimeCount = 0;
    let overdueCount = 0;

    const stageCounts: Record<string, number> = {
      DITERIMA: 0,
      CUCI: 0,
      SETRIKA: 0,
      SIAP_AMBIL: 0,
      DIAMBIL: 0,
    };

    const nowMs = Date.now();

    orders.forEach((o) => {
      const vol = extractLaundryOrderMetrics(o);
      totalWeightKg += vol.kiloanKg;
      totalPhysicalPcs += vol.totalPhysicalPcs;
      totalSatuanPcs += vol.satuanPcs;
      totalPasang += vol.pasangCount;
      totalAreaM2 += vol.areaM2;

      const slaH = Number(o.slaHours) || 48;
      const slaTxt = String(o.slaLabel || '').toLowerCase();
      if (slaH <= 6 || slaTxt.includes('express')) {
        expressCount += 1;
      } else if (slaH <= 24 || slaTxt.includes('kilat')) {
        kilatCount += 1;
      } else {
        regulerCount += 1;
      }

      const remAmt = Math.max(0, Number(o.remainingAmount) || 0);
      totalLaundryRevenue += Number(o.totalAmount) || 0;
      totalCashDpCollected += Number(o.paidAmount) || 0;
      if (remAmt > 0) {
        piutangTotalLaundryAmount += remAmt;
        unpaidOrdersCount += 1;
      }
      if (o.productionStatus === 'SIAP_AMBIL') {
        readyRackOrdersCount += 1;
        piutangRakAmount += remAmt;
      }

      const stageKey = o.productionStatus || 'DITERIMA';
      stageCounts[stageKey] = (stageCounts[stageKey] || 0) + 1;

      const estMs = o.estimatedDoneAt ? new Date(o.estimatedDoneAt).getTime() : nowMs;
      if (o.productionStatus === 'DIAMBIL') {
        const pickedMs = o.pickedUpAt ? new Date(o.pickedUpAt).getTime() : estMs;
        if (pickedMs <= estMs) onTimeCount += 1;
        else overdueCount += 1;
      } else {
        if (nowMs <= estMs) onTimeCount += 1;
        else overdueCount += 1;
      }
    });

    const totalOrders = orders.length;
    const expressRatioPct = totalOrders > 0 ? Math.round((expressCount / totalOrders) * 100) : 0;
    const kilatRatioPct = totalOrders > 0 ? Math.round((kilatCount / totalOrders) * 100) : 0;
    const regulerRatioPct = totalOrders > 0 ? Math.max(0, 100 - expressRatioPct - kilatRatioPct) : 0;
    const slaOnTimeRatePct = totalOrders > 0 ? Math.round((onTimeCount / totalOrders) * 100) : 100;

    return {
      orders,
      totalOrders,
      totalWeightKg: Number(totalWeightKg.toFixed(2)),
      totalPhysicalPcs,
      totalSatuanPcs: Number(totalSatuanPcs.toFixed(1)),
      totalPasang: Number(totalPasang.toFixed(1)),
      totalAreaM2: Number(totalAreaM2.toFixed(2)),
      expressCount,
      kilatCount,
      regulerCount,
      expressRatioPct,
      kilatRatioPct,
      regulerRatioPct,
      piutangRakAmount,
      piutangTotalLaundryAmount,
      unpaidOrdersCount,
      readyRackOrdersCount,
      totalLaundryRevenue,
      totalCashDpCollected,
      onTimeCount,
      overdueCount,
      slaOnTimeRatePct,
      stageCounts,
    };
  }, [laundryOrders]);

  // 3b-3. Analitik Khusus Rumpun FASHION_BUTIK (Rasio Harga Normal vs Promo, Kontribusi Pramuniaga & Varian Fast vs Slow Moving)
  const fashionExecutiveAnalytics = useMemo(
    () =>
      calculateFashionExecutiveAnalytics(
        filteredProducts,
        filteredSales,
        stockMutations || [],
        employees || []
      ),
    [filteredProducts, filteredSales, stockMutations, employees]
  );

  // 3c. Katalog & Valuasi Stok HPP Sinkron Rumpun Aktif (Agar KPI Atas Konsisten 100% dengan Panel Domain)
  const activeDomainProducts = useMemo(() => {
    if (activeFamily === 'BUILDING_BULK') {
      return buildingBulkAnalytics.catalog;
    }

    if (activeFamily === 'FNB_CULINARY') {
      const fromState = filteredProducts.filter(
        (p: any) =>
          p.itemType === 'MENU_FB' ||
          String(p.businessModel || '').toLowerCase() === 'fnb' ||
          String(p.id || '').toUpperCase().startsWith('FNB-')
      );
      const map = new Map<string, any>();
      FNB_PRODUCTS.forEach((p) => map.set(p.id, p));
      fromState.forEach((p: any) => {
        if (p.itemType !== 'RAW_MATERIAL') map.set(p.id, p);
      });
      return Array.from(map.values());
    }

    if (activeFamily === 'SPECIALTY_SERVICE') {
      const model = effectiveDomainConfig.primaryBusinessModel;
      const isFashionModel = model === 'FASHION_BUTIK' || Boolean(effectiveDomainConfig.subFeatures?.hasVariantMatrix);
      const isElectronicsModel = Boolean(effectiveDomainConfig.subFeatures?.hasSerialImei);
      const baseCatalog = isFashionModel
        ? FASHION_APPAREL_PRODUCTS
        : isElectronicsModel
        ? ELECTRONICS_GADGETS_PRODUCTS
        : [...AUTOMOTIVE_WORKSHOP_PRODUCTS, ...SALON_BARBERSHOP_PRODUCTS];

      const map = new Map<string, any>();
      baseCatalog.forEach((p) => map.set(p.id, p));
      filteredProducts.forEach((p: any) => {
        const bm = String(p.businessModel || '').toLowerCase();
        const idUpper = String(p.id || '').toUpperCase();
        if (isFashionModel && (bm === 'fashion' || idUpper.startsWith('FASH-'))) {
          map.set(p.id, p);
        } else if (isElectronicsModel && (bm === 'electronics' || bm === 'gadget' || idUpper.startsWith('GAD-'))) {
          map.set(p.id, p);
        } else if (
          (model === 'BARBERSHOP_SALON' || model === 'LAUNDRY') &&
          (bm === 'workshop' || bm === 'automotive' || bm === 'salon' || bm === 'service' || idUpper.startsWith('OTO-') || idUpper.startsWith('SLN-'))
        ) {
          map.set(p.id, p);
        }
      });
      return Array.from(map.values());
    }

    // RETAIL_GENERAL (termasuk Toko Obat & Kesehatan Umum, Grosir, & Ritel)
    const nonRetailModels = new Set(['fnb', 'building', 'fashion', 'electronics', 'gadget', 'workshop', 'automotive', 'salon', 'service']);
    const nonRetailPrefixes = ['fnb-', 'ing-', 'raw-', 'mat-', 'fash-', 'gad-', 'oto-', 'sln-'];
    const retailFiltered = filteredProducts.filter((p: any) => {
      const it = String(p.itemType || '').toUpperCase();
      if (it === 'MENU_FB' || it === 'RAW_MATERIAL' || it === 'SERVICE') return false;
      const bm = String(p.businessModel || '').toLowerCase();
      if (nonRetailModels.has(bm)) return false;
      const idLower = String(p.id || '').toLowerCase();
      if (nonRetailPrefixes.some((pref) => idLower.startsWith(pref))) return false;
      return true;
    });

    if (effectiveDomainConfig.primaryBusinessModel === 'TOKO_OBAT_KESEHATAN') {
      const map = new Map<string, any>();
      retailFiltered.forEach((p: any) => map.set(p.id, p));
      PHARMACY_HEALTHCARE_PRODUCTS.forEach((p) => {
        if (!map.has(p.id)) map.set(p.id, p);
      });
      return Array.from(map.values());
    }

    return retailFiltered;
  }, [activeFamily, buildingBulkAnalytics.catalog, filteredProducts, effectiveDomainConfig.primaryBusinessModel, effectiveDomainConfig.subFeatures]);

  // 3b-4. Analitik Operasional Sektor F&B (Menu Terlaris, Food Cost BOM %, Dine-In vs Takeaway/Delivery, Bahan Baku Kritis)
  const fnbExecutiveAnalytics = useMemo(() => {
    const fnbMenuMap = new Map<string, any>();
    FNB_PRODUCTS.forEach((m) => fnbMenuMap.set(m.id, m));
    filteredProducts.forEach((p: any) => {
      if (
        p.itemType === 'MENU_FB' ||
        String(p.businessModel || '').toLowerCase() === 'fnb' ||
        String(p.id || '').toUpperCase().startsWith('FNB-')
      ) {
        if (p.itemType !== 'RAW_MATERIAL') fnbMenuMap.set(p.id, p);
      }
    });
    const menuList = Array.from(fnbMenuMap.values());

    // Estimasi rata-rata Food Cost BOM (%)
    let foodCostPctSum = 0;
    let foodCostMeasuredCount = 0;
    menuList.forEach((m: any) => {
      const sell = Number(m.sell_price ?? m.sellingPrice ?? m.price ?? 0) || 0;
      const bomCost =
        Number(
          m.costing?.rawMaterialHPP ??
            m.costing?.rawMaterialCost ??
            m.costing?.totalCost ??
            m.cost_price ??
            m.costPrice ??
            0
        ) || 0;
      if (sell > 0 && bomCost > 0) {
        foodCostPctSum += (bomCost / sell) * 100;
        foodCostMeasuredCount += 1;
      }
    });
    const avgFoodCostPct =
      foodCostMeasuredCount > 0 ? Number((foodCostPctSum / foodCostMeasuredCount).toFixed(1)) : 31.5;
    const avgGrossMarginPct = Number(Math.max(0, 100 - avgFoodCostPct).toFixed(1));

    // Filter transaksi F&B
    const todayStr = new Date().toISOString().slice(0, 10);
    const fnbSalesAll = filteredSales.filter((s: any) => {
      const bt = String(s.businessType || s.business_type || s.terminal_name || '').toLowerCase();
      if (bt.includes('f&b') || bt.includes('fnb') || bt.includes('resto') || bt.includes('cafe')) return true;
      if (s.tableName || s.orderType || s.serviceMode) return true;
      return Array.isArray(s.items) && s.items.some((it: any) => {
        const pid = String(it?.product?.id || it?.productId || '').toUpperCase();
        return pid.startsWith('FNB-') || it?.product?.itemType === 'MENU_FB';
      });
    });

    const fnbSalesToday = fnbSalesAll.filter((s: any) =>
      String(s.created_at || s.date || '').slice(0, 10) === todayStr
    );
    const sourceSalesForTop = fnbSalesToday.length > 0 ? fnbSalesToday : fnbSalesAll;

    let dineInCount = 0;
    let takeawayDeliveryCount = 0;
    const menuSalesAgg = new Map<string, { name: string; qty: number; revenue: number }>();

    sourceSalesForTop.forEach((s: any) => {
      const modeRaw = String(
        s.orderType || s.serviceMode || s.diningMode || (s.tableName ? 'DINE_IN' : 'TAKEAWAY')
      ).toUpperCase();
      if (modeRaw.includes('TAKE') || modeRaw.includes('DELIV') || modeRaw.includes('BUNGKUS') || modeRaw.includes('ONLINE')) {
        takeawayDeliveryCount += 1;
      } else {
        dineInCount += 1;
      }

      (s.items || []).forEach((it: any) => {
        const name = String(it?.product?.name || it?.name || 'Menu F&B');
        const qty = Math.max(0, Number(it?.quantity ?? it?.qty) || 1);
        const rev = Math.max(
          0,
          Number(it?.subtotal) ||
            qty * (Number(it?.unitPrice ?? it?.product?.sell_price ?? it?.product?.price) || 0)
        );
        const prev = menuSalesAgg.get(name) || { name, qty: 0, revenue: 0 };
        prev.qty += qty;
        prev.revenue += rev;
        menuSalesAgg.set(name, prev);
      });
    });

    const rankedMenus = Array.from(menuSalesAgg.values()).sort((a, b) => b.qty - a.qty || b.revenue - a.revenue);
    const topMenu = rankedMenus[0] || (menuList[0] ? { name: menuList[0].name, qty: 0, revenue: 0 } : null);
    const totalFnbTx = dineInCount + takeawayDeliveryCount;
    const dineInPct = totalFnbTx > 0 ? Math.round((dineInCount / totalFnbTx) * 100) : 0;
    const takeawayPct = totalFnbTx > 0 ? 100 - dineInPct : 0;

    // Bahan baku dapur kritis (RM-FNB-*)
    const rawMap = new Map<string, any>();
    RAW_INGREDIENTS_AS_PRODUCTS.forEach((rm) => rawMap.set(rm.id, rm));
    filteredProducts.forEach((p: any) => {
      const idUp = String(p.id || '').toUpperCase();
      if (idUp.startsWith('RM-FNB-') || idUp.startsWith('ING-') || p.itemType === 'RAW_MATERIAL') {
        const base = rawMap.get(p.id);
        rawMap.set(p.id, base ? { ...base, ...p } : p);
      }
    });
    const allRawMaterials = Array.from(rawMap.values());
    const criticalRawMaterials = allRawMaterials
      .filter((rm: any) => {
        const stk = Number(rm.stock) || 0;
        const minStk = Number(rm.min_stock ?? rm.minStock ?? 500) || 500;
        return stk <= minStk;
      })
      .sort((a: any, b: any) => (Number(a.stock) || 0) - (Number(b.stock) || 0));

    return {
      menuCount: menuList.length,
      activeToppingCount: Array.isArray(fnbToppings)
        ? fnbToppings.filter((t: any) => t.isActive !== false).length
        : 0,
      topMenu,
      isTodayData: fnbSalesToday.length > 0,
      avgFoodCostPct,
      avgGrossMarginPct,
      dineInCount,
      takeawayDeliveryCount,
      totalFnbTx,
      dineInPct,
      takeawayPct,
      totalRawMaterialCount: allRawMaterials.length,
      criticalRawMaterials,
    };
  }, [filteredProducts, filteredSales, fnbToppings]);

  // 3b-5. Analitik Operasional Sektor SERVICE Non-Laundry (Barbershop & Salon)
  const serviceGeneralAnalytics = useMemo(() => {
    const serviceSales = filteredSales.filter((s: any) => {
      const bt = String(s.businessType || s.business_type || s.terminal_name || '').toLowerCase();
      if (bt.includes('salon') || bt.includes('barber') || bt.includes('jasa') || bt.includes('service')) return true;
      return Array.isArray(s.items) && s.items.some((it: any) => {
        const pid = String(it?.product?.id || '').toUpperCase();
        return pid.startsWith('SLN-') || it?.product?.itemType === 'SERVICE';
      });
    });

    const svcCountMap = new Map<string, { name: string; qty: number; revenue: number }>();
    let totalServiceRevenue = 0;
    serviceSales.forEach((s: any) => {
      totalServiceRevenue += Number(s.total_amount ?? s.total) || 0;
      (s.items || []).forEach((it: any) => {
        const name = String(it?.product?.name || 'Layanan Jasa');
        const qty = Math.max(0, Number(it?.quantity ?? it?.qty) || 1);
        const rev = Math.max(0, Number(it?.subtotal) || qty * (Number(it?.product?.sell_price) || 0));
        const prev = svcCountMap.get(name) || { name, qty: 0, revenue: 0 };
        prev.qty += qty;
        prev.revenue += rev;
        svcCountMap.set(name, prev);
      });
    });

    const topService = Array.from(svcCountMap.values()).sort((a, b) => b.qty - a.qty)[0] || {
      name: SALON_BARBERSHOP_PRODUCTS[0]?.name || 'Potong Rambut & Grooming',
      qty: 0,
      revenue: 0,
    };

    return {
      totalOrders: serviceSales.length,
      totalServiceRevenue,
      estStylistCommission: Math.round(totalServiceRevenue * 0.15),
      catalogCount: Math.max(activeDomainProducts.length, SALON_BARBERSHOP_PRODUCTS.length),
      topService,
    };
  }, [filteredSales, activeDomainProducts.length]);

  // 3b-6. Analitik Operasional Sektor RETAIL (Perputaran SKU, Margin, Stok Rendah & Valuasi)
  const retailExecutiveAnalytics = useMemo(() => {
    const retailSkus = activeDomainProducts || [];
    let marginSum = 0;
    let marginCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalRetailValuation = 0;

    retailSkus.forEach((p: any) => {
      const stock = Number(p.stock) || 0;
      const minStk = Number(p.minStock ?? p.min_stock ?? 5) || 5;
      const cost = Number(p.costPrice ?? p.cost_price ?? p.buy_price ?? 0) || 0;
      const sell = Number(p.sellingPrice ?? p.sell_price ?? p.price ?? 0) || 0;
      totalRetailValuation += Math.max(0, stock) * Math.max(0, cost);
      if (stock <= 0) outOfStockCount += 1;
      else if (stock <= minStk) lowStockCount += 1;
      if (sell > 0 && cost > 0) {
        marginSum += ((sell - cost) / sell) * 100;
        marginCount += 1;
      }
    });

    const skuSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();
    let retailUnitsSold = 0;
    filteredSales.forEach((s: any) => {
      (s.items || []).forEach((it: any) => {
        const pid = String(it?.product?.id || '').toUpperCase();
        if (pid.startsWith('FNB-') || pid.startsWith('MAT-') || pid.startsWith('FASH-') || pid.startsWith('LND-') || pid.startsWith('SLN-')) {
          return;
        }
        const name = String(it?.product?.name || 'Produk Ritel');
        const qty = Math.max(0, Number(it?.quantity ?? it?.qty) || 1);
        const rev = Math.max(0, Number(it?.subtotal) || qty * (Number(it?.product?.sell_price ?? it?.product?.price) || 0));
        retailUnitsSold += qty;
        const prev = skuSalesMap.get(name) || { name, qty: 0, revenue: 0 };
        prev.qty += qty;
        prev.revenue += rev;
        skuSalesMap.set(name, prev);
      });
    });

    const topRetailSku = Array.from(skuSalesMap.values()).sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)[0] ||
      (retailSkus[0] ? { name: retailSkus[0].name, qty: 0, revenue: 0 } : null);

    const avgMarginPct = marginCount > 0 ? Number((marginSum / marginCount).toFixed(1)) : 24.0;
    const healthyRatioPct =
      retailSkus.length > 0
        ? Math.round(((retailSkus.length - lowStockCount - outOfStockCount) / retailSkus.length) * 100)
        : 100;

    return {
      totalSkus: retailSkus.length,
      avgMarginPct,
      lowStockCount,
      outOfStockCount,
      healthyRatioPct,
      totalRetailValuation,
      retailUnitsSold,
      topRetailSku,
    };
  }, [activeDomainProducts, filteredSales]);

  const totalValuasiStok = useMemo(() => {
    if (activeFamily === 'BUILDING_BULK') {
      return buildingBulkAnalytics.totalValuation;
    }
    return activeDomainProducts.reduce(
      (acc: number, p: any) => acc + (Number(p.stock) || 0) * (Number(p.costPrice ?? p.cost_price ?? p.buy_price) || 0),
      0
    );
  }, [activeFamily, buildingBulkAnalytics.totalValuation, activeDomainProducts]);

  const activeCatalogCountLabel =
    activeFamily === 'BUILDING_BULK'
      ? `${activeDomainProducts.length} Item Depo Material`
      : activeFamily === 'FNB_CULINARY'
      ? `${activeDomainProducts.length} Menu F&B`
      : activeFamily === 'SPECIALTY_SERVICE'
      ? `${activeDomainProducts.length} Item Spesialis`
      : `${activeDomainProducts.length} Item Katalog`;

  // 4. Akumulasi Qty Terjual Riil
  const realSoldQtyMap: Record<string, number> = {};
  filteredSales.forEach((tx: any) => {
    const items = Array.isArray(tx.items) ? tx.items : [];
    items.forEach((it: any) => {
      const pId = it.productId || it.id;
      if (pId) {
        realSoldQtyMap[pId] = (realSoldQtyMap[pId] || 0) + (Number(it.quantity || it.qty) || 1);
      }
    });
  });

  // 5. Kalkulasi HPP Riil (Hanya dari jurnal HPP otomatis / SYSTEM_AUTO / kategori HPP)
  const financeHppTotal = (finance || [])
    .filter((f: any) => 
      (!isMultiBranch || selectedBranch === 'ALL' || f.branchId === selectedBranch) &&
      (f.category === 'HPP' || f.payment_method === 'SYSTEM_AUTO' || f.type === 'HPP / BEBAN POKOK' || f.category?.toLowerCase().includes('hpp'))
    )
    .reduce((acc: number, f: any) => acc + (Number(f.amount) || 0), 0);

  const salesFallbackCOGS = filteredSales.reduce((totalHpp: number, tx: any) => {
    const items = Array.isArray(tx.items) ? tx.items : [];
    const txHpp = items.reduce((sum: number, item: any) => {
      const productMaster = (products || []).find((p: any) => p.id === (item.productId || item.id));
      const unitCost = Number(item.costPrice ?? (productMaster ? (productMaster.costPrice ?? productMaster.cost_price) : 0)) || 0;
      const qty = Number(item.quantity || item.qty) || 1;
      return sum + (unitCost * qty);
    }, 0);
    return totalHpp + txHpp;
  }, 0);

  const calculatedCOGS = financeHppTotal > 0 ? financeHppTotal : salesFallbackCOGS;

  const calculatedGrossProfit = totalOmzet - calculatedCOGS;

  // 6. Kalkulasi OPEX & Payroll Riil (Eksklusif di luar HPP / SYSTEM_AUTO untuk mencegah double counting)
  const realExpensesTotal = (finance || [])
    .filter((f: any) => 
      (!isMultiBranch || selectedBranch === 'ALL' || f.branchId === selectedBranch) && 
      (f.type === 'EXPENSE' || f.type === 'EXPENSE / BIAYA') &&
      f.category !== 'HPP' &&
      f.payment_method !== 'SYSTEM_AUTO' &&
      f.type !== 'HPP / BEBAN POKOK' &&
      !f.category?.toLowerCase().includes('hpp')
    )
    .reduce((acc: number, f: any) => acc + (Number(f.amount) || 0), 0);

  const realPayrollTotal = (employees || [])
    .filter((emp: any) => (!isMultiBranch || selectedBranch === 'ALL' || emp.branchId === selectedBranch) && emp.status !== 'Inactive')
    .reduce((acc: number, emp: any) => acc + (Number(emp.salary || emp.baseSalary) || 0), 0);

  const calculatedOPEX = realExpensesTotal + realPayrollTotal;
  const calculatedNetProfit = calculatedGrossProfit - calculatedOPEX;

  const now = new Date();

  // 7. Alert Kadaluarsa Riil
  const expiryAlertsReal = filteredProducts.filter((p: any) => {
    const expiryDate = p.expiryDate ? new Date(p.expiryDate) : null;
    if (!expiryDate) return false;
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).map((p: any) => ({
    sku: p.id,
    name: p.name,
    batch: p.batchNo || 'BATCH-2026',
    daysLeft: Math.ceil(((p.expiryDate ? new Date(p.expiryDate).getTime() : now.getTime()) - now.getTime()) / (1000 * 60 * 60 * 24)),
    stock: p.stock || 0,
    status: 'KRITIS' as const,
    action: businessVertical === 'FNB' ? 'Buang / Diskon Cepat' : 'Flash Sale'
  }));

  // 8. PR & PO Pending Riil
  const pendingPRList = (purchaseRequests || []).filter((pr: any) =>
    (!isMultiBranch || selectedBranch === 'ALL' || pr.branchId === selectedBranch) &&
    (pr.status === 'PENDING' || pr.status === 'Pending Approval' || pr.status === 'pending' || pr.status === 'Draft PR' || pr.status === 'Draft')
  );

  const pendingPOList = (purchasing || []).filter((po: any) =>
    (!isMultiBranch || selectedBranch === 'ALL' || po.branchId === selectedBranch) &&
    (po.status === 'PENDING' || po.status === 'PENDING_APPROVAL' || po.status === 'Pending Approval' || po.status === 'Menunggu Approval Pimpinan' || po.status === 'Menunggu Approval Direksi')
  );

  const pendingPRs = [...pendingPRList, ...pendingPOList];

  // 9. Grafik Tren Omzet 7 Hari Riil
  const getTxDateStr = (tx: any) => {
    try {
      const raw = tx.createdAt || tx.created_at || tx.date || Date.now();
      return new Date(raw).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const last7DaysDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const last7DaysData = last7DaysDates.map(dateStr => {
    return filteredSales
      .filter((t: any) => getTxDateStr(t) === dateStr)
      .reduce((acc: number, curr: any) => acc + (Number(curr.total_amount ?? curr.total) || 0), 0);
  });

  const sum7Days = last7DaysData.reduce((a, b) => a + b, 0);
  const maxOmzet = Math.max(...last7DaysData, 1);

  const getYCoord = (val: number) => {
    if (val === 0) return 130;
    return Math.max(25, 130 - (val / maxOmzet) * 95);
  };

  const dayLabels = last7DaysDates.map(dStr => {
    const d = new Date(dStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { weekday: 'short' });
  });

  // 10. Skor Performa 6 Divisi
  const totalSalesAll = salesHistory ? salesHistory.length : 0;
  const completedSalesAll = salesHistory ? salesHistory.filter((s: any) => s.status === 'COMPLETED' || s.status === 'PAID' || !s.status).length : 0;

  const scorePos = totalSalesAll > 0 ? Math.min(100, Math.round((completedSalesAll / totalSalesAll) * 100)) : 100;
  const scoreGudang = activeDomainProducts.length > 0
    ? Math.min(100, Math.round(((activeDomainProducts.filter((p: any) => (p.stock || 0) >= (p.minStock || p.min_stock || 0)).length) / activeDomainProducts.length) * 100))
    : 100;
  const scorePO = (purchasing || []).length > 0
    ? Math.min(100, Math.round((((purchasing || []).filter((po: any) => po.status === 'Lunas' || po.status === 'PAID' || po.status === 'Selesai' || po.status === 'FULLY_RECEIVED' || po.status === 'Approved' || po.status === 'APPROVED').length) / (purchasing || []).length) * 100))
    : 100;
  const scoreFinance = totalSalesAll > 0 ? Math.min(100, Math.round((completedSalesAll / totalSalesAll) * 100)) : 100;
  const scoreSDM = (terminals && terminals.length > 0)
    ? Math.min(100, Math.round((terminals.filter((t: any) => t.isActive).length / terminals.length) * 100))
    : ((users && users.length > 0) ? Math.min(100, Math.round((users.filter((u: any) => u.status === 'Active').length / users.length) * 100)) : 100);
  const fraudCount = voidItemLogs ? voidItemLogs.length : 0;
  const scoreAudit = Math.max(0, 100 - fraudCount * 5);

  const divisionStats = [
    { name: 'POS & Kasir', score: scorePos, status: scorePos >= 80 ? 'Optimal' : 'Perlu Perhatian' },
    {
      name:
        activeFamily === 'BUILDING_BULK'
          ? 'Depo, Curah & Armada'
          : businessVertical === 'FNB'
          ? 'Dapur & Stok'
          : 'Gudang & Stok',
      score: scoreGudang,
      status: scoreGudang >= 80 ? 'Terkendali' : 'Low Stock'
    },
    { name: 'Pengadaan & PO', score: scorePO, status: scorePO >= 80 ? 'Review PR' : 'Pending' },
    { name: 'Keuangan & Kas', score: scoreFinance, status: scoreFinance >= 80 ? 'Seimbang' : 'Risiko Void' },
    { name: 'SDM & Shift', score: scoreSDM, status: scoreSDM >= 80 ? 'Normal' : 'Shift Low' },
    { name: 'Audit & Integritas', score: scoreAudit, status: scoreAudit >= 90 ? 'Aman' : (scoreAudit >= 70 ? 'Waspada' : 'Kritis') },
  ];

  // 11. Arus Kas & AP Aging Riil
  const kasOperasional = getLiquidCashBalance ? getLiquidCashBalance() : 0;

  const unpaidAPInvoices = (invoicesDue || []).filter((inv: any) =>
    (inv.type === 'PAYABLE' || inv.type !== 'RECEIVABLE') &&
    inv.status !== 'Paid' && inv.status !== 'PAID' && inv.status !== 'Lunas'
  );

  const unpaidPOs = (purchasing || []).filter((po: any) =>
    po.payment_status !== 'PAID' && po.payment_status !== 'Paid' && po.payment_status !== 'Lunas' &&
    (po.status === 'APPROVED' || po.status === 'COMPLETED' || po.status === 'RECEIVED')
  );

  const combinedAPList = [
    ...unpaidAPInvoices.map((inv: any) => ({
      id: String(inv.id),
      vendor: inv.party_name || inv.vendor || 'Vendor AP',
      invoiceNo: inv.invoice_number || inv.id || 'INV-AP',
      amount: Number(inv.amount) || 0,
      dueDate: inv.due_date || new Date().toISOString().split('T')[0],
      source: 'INVOICE' as const,
      raw: inv
    })),
    ...unpaidPOs.filter((po: any) => !unpaidAPInvoices.some((inv: any) => inv.po_number === po.po_number || inv.id === po.id)).map((po: any) => ({
      id: String(po.id),
      vendor: po.supplier_name || po.supplier || po.vendorName || 'Supplier PO',
      invoiceNo: po.po_number || po.id || 'PO-AP',
      amount: Number(po.total_amount || po.totalAmount) || 0,
      dueDate: po.due_date || po.delivery_date || new Date().toISOString().split('T')[0],
      source: 'PO' as const,
      raw: po
    }))
  ];

  const nowMs = new Date().setHours(0, 0, 0, 0);
  const sevenDaysMs = nowMs + 7 * 24 * 60 * 60 * 1000;

  const dueThisWeek = combinedAPList.filter((item) => {
    const itemDateMs = new Date(item.dueDate).setHours(0, 0, 0, 0);
    return itemDateMs <= sevenDaysMs;
  }).reduce((sum, item) => sum + item.amount, 0);

  const estimatedMonthlyExpense = calculatedOPEX > 0 ? calculatedOPEX : 1;
  const cashRunway = kasOperasional > 0
    ? ((kasOperasional / estimatedMonthlyExpense)).toFixed(1) + ' Bln'
    : '0 Bln';

  const laborCostRatio = totalOmzet > 0
    ? ((realPayrollTotal / totalOmzet) * 100).toFixed(1)
    : '0.0';

  const toggleSelectAllAP = () => {
    if (selectedAPIds.length === combinedAPList.length) {
      setSelectedAPIds([]);
    } else {
      setSelectedAPIds(combinedAPList.map(item => item.id));
    }
  };

  const toggleSelectAP = (id: string) => {
    if (selectedAPIds.includes(id)) {
      setSelectedAPIds(selectedAPIds.filter(i => i !== id));
    } else {
      setSelectedAPIds([...selectedAPIds, id]);
    }
  };

  const selectedAPTotalAmount = combinedAPList
    .filter(item => selectedAPIds.includes(item.id))
    .reduce((sum, item) => sum + item.amount, 0);

  const handleBatchAPPayment = () => {
    if (selectedAPIds.length === 0) return;
    selectedAPIds.forEach(id => {
      const apItem = combinedAPList.find(i => i.id === id);
      if (apItem) {
        if (apItem.source === 'INVOICE' && payVendorInvoice) {
          payVendorInvoice(id);
        } else if (apItem.source === 'PO' && updatePurchaseOrderPayment) {
          updatePurchaseOrderPayment(id, 'PAID');
        }
      }
    });

    recordAudit({
      traceId: `EXEC-BATCH-AP-${Date.now()}`,
      userId: effectiveUser?.id || 'executive-cockpit',
      userName: effectiveUser?.name || 'Direksi / Pimpinan',
      userRole: effectiveUser?.role || 'Executive',
      module: 'FINANCE',
      action: 'PURCHASE_ORDER_PAYMENT',
      severity: 'CRITICAL',
      payloadAfter: {
        totalAmountPaid: selectedAPTotalAmount,
        invoiceCount: selectedAPIds.length,
        invoices: selectedAPIds,
      },
    });

    if (showToast) {
      showToast(`Berhasil mengotorisasi pelunasan batch ${selectedAPIds.length} faktur total ${formatRupiah(selectedAPTotalAmount)}.`);
    }
    setSelectedAPIds([]);
  };

  // 12. Heatmap Jam Transaksi Riil
  const hourlyTrafficData = Array.from({ length: 15 }, (_, idx) => {
    const hour = idx + 8;
    const hourStr = hour < 10 ? `0${hour}` : `${hour}`;

    const txs = filteredSales.filter((s: any) => {
      const d = new Date(s.createdAt || s.created_at || s.date || Date.now());
      return d.getHours() === hour;
    });

    const anomalies = (voidItemLogs || []).filter((v: any) => {
      const d = new Date(v.timestamp || v.created_at || Date.now());
      return d.getHours() === hour;
    });

    const count = txs.length;
    const rev = txs.reduce((sum: number, t: any) => sum + (Number(t.total_amount ?? t.total) || 0), 0);
    const hasAnomaly = anomalies.length > 0;

    return {
      hour,
      label: `${hourStr}:00`,
      txCount: count,
      totalRevenue: rev,
      txs,
      anomalies,
      hasAnomaly
    };
  });

  const maxHourlyCount = Math.max(...hourlyTrafficData.map(h => h.txCount), 1);

  // 13. Matriks 4 Kuadran SKU Riil
  const skuQuadrantList = activeDomainProducts.map((p: any) => {
    const cost = Number(p.costPrice ?? p.cost_price ?? p.buy_price) || 0;
    const price = Number(p.retailPrice ?? p.price ?? p.sellingPrice ?? p.sell_price ?? p.price_retail) || 0;
    const marginPercent = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
    const soldQty = realSoldQtyMap[p.id] || 0;
    const totalProfit = (price - cost) * soldQty;

    let quadrant: 'star' | 'workhorse' | 'opportunity' | 'deadstock' = 'deadstock';
    let recommendation = '';

    if (soldQty >= 10 && marginPercent >= 20) {
      quadrant = 'star';
      recommendation = businessVertical === 'FNB'
        ? 'Menu Signature: Tingkat pemesanan tinggi dengan margin tebal. Pastikan stok bahan baku selalu terjaga.'
        : 'Produk Unggulan: Laku tinggi dengan margin tebal. Pastikan stok penyangga selalu siap.';
    } else if (soldQty >= 10 && marginPercent < 20) {
      quadrant = 'workhorse';
      recommendation = businessVertical === 'FNB'
        ? 'Menu Volume: Sangat diminati namun margin tipis. Pertimbangkan sedikit penyesuaian porsi/harga.'
        : 'Volume Tinggi, Margin Rendah: Evaluasi penyesuaian harga jual atau negosiasi ulang ke supplier.';
    } else if (soldQty < 10 && marginPercent >= 20) {
      quadrant = 'opportunity';
      recommendation = businessVertical === 'FNB'
        ? 'Menu Eksklusif: Margin tinggi namun jarang dipesan. Buat paket kombo atau tawarkan rekomendasi pramusaji.'
        : 'Margin Tebal, Perputaran Lambat: Dorong dengan bundling produk atau optimasi display depan.';
    } else {
      quadrant = 'deadstock';
      recommendation = businessVertical === 'FNB'
        ? 'Risiko Spoilage: Menu kurang diminati dan berpotensi membuang bahan baku. Evaluasi penghapusan menu.'
        : 'Stagnan & Mengikat Modal: Ajukan mutasi antar-cabang atau diskon flash sale untuk memutar kas.';
    }

    return {
      product: p,
      soldQty,
      marginPercent,
      costPrice: cost,
      sellingPrice: price,
      totalProfit,
      quadrant,
      recommendation
    };
  });

  // 14. Kinerja Cabang Riil
  const realBranchPerformance = registeredBranchIds.map((bId) => {
    const branchSales = (salesHistory || []).filter((s: any) => s.branchId === bId && (s.status === 'COMPLETED' || s.status === 'PAID'));
    const branchOmzet = branchSales.reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0);
    const branchTxCount = branchSales.length;

    const branchProducts = (products || []).filter((p: any) => p.branchId === bId);
    const lowStockItem = branchProducts.find((p: any) => (Number(p.stock) || 0) <= (Number(p.minStock || p.min_stock) || 5));

    return {
      id: bId,
      name: `Cabang ${bId}`,
      omzet: branchOmzet,
      tx: branchTxCount,
      rating: branchOmzet >= 50000000 ? 'Sangat Baik' : branchOmzet >= 10000000 ? 'Baik' : 'Normal',
      needStock: !!lowStockItem,
      shortageSKU: lowStockItem ? lowStockItem.name : null
    };
  });

  const handleToggleFreezeCashier = (cashierName: string) => {
    const isNowFrozen = !frozenCashiers.includes(cashierName);
    if (frozenCashiers.includes(cashierName)) {
      setFrozenCashiers(frozenCashiers.filter(c => c !== cashierName));
      if (showToast) showToast(`Sesi kasir untuk ${cashierName} telah DIBUKA KEMBALI.`);
    } else {
      setFrozenCashiers([...frozenCashiers, cashierName]);
      if (showToast) showToast(`Terminal kasir ${cashierName} telah DIBEKUKAN dari Executive Cockpit.`);
    }

    recordAudit({
      traceId: `EXEC-CASHIER-FREEZE-${Date.now()}`,
      userId: effectiveUser?.id || 'executive-cockpit',
      userName: effectiveUser?.name || 'Direksi / Pimpinan',
      userRole: effectiveUser?.role || 'Executive',
      module: 'AUTH',
      action: 'AUTH_OVERRIDE_PIN',
      severity: isNowFrozen ? 'CRITICAL' : 'WARN',
      entityId: cashierName,
      payloadAfter: {
        targetCashier: cashierName,
        action: isNowFrozen ? 'FREEZE_TERMINAL' : 'UNFREEZE_TERMINAL',
      },
    });
  };

  const handleToggleLockVoid = (cashierName: string) => {
    const isNowLocked = !lockedVoidCashiers.includes(cashierName);
    if (lockedVoidCashiers.includes(cashierName)) {
      setLockedVoidCashiers(lockedVoidCashiers.filter(c => c !== cashierName));
      if (showToast) showToast(`Limit void untuk ${cashierName} dikembalikan ke normal.`);
    } else {
      setLockedVoidCashiers([...lockedVoidCashiers, cashierName]);
      if (showToast) showToast(`Limit void ${cashierName} DIKUNCI (Rp 0). Memerlukan otorisasi supervisor.`);
    }

    recordAudit({
      traceId: `EXEC-VOID-LOCK-${Date.now()}`,
      userId: effectiveUser?.id || 'executive-cockpit',
      userName: effectiveUser?.name || 'Direksi / Pimpinan',
      userRole: effectiveUser?.role || 'Executive',
      module: 'POS',
      action: 'CONFIG_CHANGE',
      severity: 'WARN',
      entityId: cashierName,
      payloadAfter: {
        targetCashier: cashierName,
        action: isNowLocked ? 'LOCK_VOID_LIMIT_ZERO' : 'RESTORE_VOID_LIMIT',
      },
    });
  };

  const handleDispatchInterbranchTransfer = (productName: string, fromBranch: string, toBranch: string, qty: number) => {
    recordAudit({
      traceId: `EXEC-INTERBRANCH-${Date.now()}`,
      userId: effectiveUser?.id || 'executive-cockpit',
      userName: effectiveUser?.name || 'Direksi / Pimpinan',
      userRole: effectiveUser?.role || 'Executive',
      module: 'WAREHOUSE',
      action: 'STOCK_ADJUSTMENT',
      severity: 'INFO',
      entityId: productName,
      payloadAfter: {
        productName,
        fromBranch,
        toBranch,
        qty,
      },
    });

    if (showToast) {
      showToast(`MUTASI TERBIT: Pengiriman ${qty} unit [${productName}] dari ${fromBranch} menuju ${toBranch} dijadwalkan.`);
    }
  };

  const handleSaveTreasurySplit = () => {
    const nextLocked = !isTreasuryLocked;
    setIsTreasuryLocked(nextLocked);

    recordAudit({
      traceId: `EXEC-TREASURY-SPLIT-${Date.now()}`,
      userId: effectiveUser?.id || 'executive-cockpit',
      userName: effectiveUser?.name || 'Direksi / Pimpinan',
      userRole: effectiveUser?.role || 'Executive',
      module: 'FINANCE',
      action: 'CONFIG_CHANGE',
      severity: 'CRITICAL',
      payloadAfter: {
        isLocked: nextLocked,
        split: treasurySplit,
      },
    });

    if (nextLocked && showToast) {
      showToast(`PAGU TERKUNCI: AP ${treasurySplit.ap}%, Payroll ${treasurySplit.payroll}%, Restock ${treasurySplit.restock}%. Pengadaan yang melebihi batas ini wajib melalui persetujuan direksi.`);
    } else if (!nextLocked && showToast) {
      showToast(`Pagu alokasi kas dibuka kembali untuk penyesuaian operasional.`);
    }
  };

  // Struktur 5 Menu Utama Navigasi (1 Tombol Langsung + 4 Dropdown)
  const pendingBuildingAuthList = useMemo(
    () => (Array.isArray(buildingAuthRequests) ? buildingAuthRequests.filter((r: any) => r.status === 'PENDING') : []),
    [buildingAuthRequests]
  );
  const activeDoPendingCount = isBuildingBulkActive
    ? buildingBulkAnalytics.waitingLoadCount + buildingBulkAnalytics.inTransitCount
    : 0;
  const totalApprovalPendingCount = pendingPRs.length + (isBuildingBulkActive ? pendingBuildingAuthList.length : 0);
  const financeTotalBadge = totalApprovalPendingCount + combinedAPList.length;
  const opsTotalBadge = expiryAlertsReal.length + activeDoPendingCount;

  type NavSubItem = {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: number | string | null;
    badgeTone?: 'rose' | 'amber' | 'purple' | 'cyan';
  };

  type NavMenuGroup = {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    directTabId?: string;
    badge?: number | string | null;
    badgeTone?: 'rose' | 'amber' | 'purple' | 'cyan';
    items?: NavSubItem[];
  };

  const navigationMenuGroups: NavMenuGroup[] = [
    {
      id: 'overview',
      label: 'Ringkasan & Alokasi Kas',
      icon: Activity,
      directTabId: 'overview',
      badge: null,
    },
    {
      id: 'ops_stock',
      label: 'Operasional & Stok',
      icon: Archive,
      badge: opsTotalBadge > 0 ? opsTotalBadge : null,
      badgeTone: 'rose',
      items: [
        ...(isBuildingBulkActive
          ? [
              {
                id: 'logistics_shrinkage',
                label: 'Logistik Armada, DO & Susut Curah',
                icon: Truck,
                badge: activeDoPendingCount > 0 ? activeDoPendingCount : null,
                badgeTone: 'amber' as const,
              },
            ]
          : []),
        {
          id: 'expiry',
          label:
            businessVertical === 'FNB'
              ? 'Waste & Spoilage Bahan'
              : activeFamily === 'BUILDING_BULK'
              ? 'Alert Kadaluarsa Semen/Cat'
              : 'Alert Kadaluarsa',
          icon: AlertTriangle,
          badge: expiryAlertsReal.length > 0 ? expiryAlertsReal.length : null,
          badgeTone: 'rose',
        },
        {
          id: 'deadstock',
          label:
            activeFamily === 'BUILDING_BULK'
              ? 'Material Mengendap & Margin'
              : businessVertical === 'FASHION'
              ? 'Deadstock Musiman'
              : businessVertical === 'FNB'
              ? 'Bahan Mengendap'
              : 'Deadstock & Rebalancing',
          icon: Archive,
          badge: null,
        },
        {
          id: 'traffic',
          label: businessVertical === 'FNB' ? 'Jam Sibuk Dapur & POS' : 'Peak & Intervensi Jam Live',
          icon: BarChart3,
          badge: 'Live',
          badgeTone: 'cyan',
        },
        ...(isMultiBranch
          ? [
              {
                id: 'branches',
                label: 'Kinerja Cabang & Rotasi',
                icon: Building2,
                badge: null,
              },
            ]
          : []),
      ],
    },
    {
      id: 'finance_auth',
      label: 'Keuangan & Otorisasi',
      icon: DollarSign,
      badge: financeTotalBadge > 0 ? financeTotalBadge : null,
      badgeTone: 'amber',
      items: [
        {
          id: 'approval',
          label: isBuildingBulkActive ? 'Otorisasi PO, Kredit & Borongan' : 'Otorisasi PR & PO',
          icon: FileCheck,
          badge: totalApprovalPendingCount > 0 ? totalApprovalPendingCount : null,
          badgeTone: 'amber',
        },
        {
          id: 'cashflow',
          label: 'Arus Kas & AP Aging',
          icon: DollarSign,
          badge: combinedAPList.length > 0 ? combinedAPList.length : null,
          badgeTone: 'cyan',
        },
      ],
    },
    {
      id: 'promo_campaign',
      label: 'Promo & Harga Musiman',
      icon: Sparkles,
      directTabId: 'promo_campaign',
      badge: null,
    },
    {
      id: 'master_data',
      label: 'Data Master & Katalog',
      icon: Database,
      directTabId: 'master_data',
      badge: null,
    },
    {
      id: 'audit_gov',
      label: 'Audit & Tata Kelola',
      icon: Shield,
      badge: fraudCount > 0 ? fraudCount : null,
      badgeTone: 'purple',
      items: [
        {
          id: 'fraud',
          label:
            businessVertical === 'FNB'
              ? 'Audit Void & Matriks Menu'
              : businessVertical === 'FASHION'
              ? 'Audit & Matriks Varian'
              : 'Audit Kasir & Matriks SKU',
          icon: ShieldAlert,
          badge: fraudCount > 0 ? fraudCount : null,
          badgeTone: 'purple',
        },
        {
          id: 'governance',
          label: 'Tata Kelola & Kredensial Staf',
          icon: Shield,
          badge: null,
        },
      ],
    },
    {
      id: 'audit_log',
      label: 'Audit Log',
      icon: ShieldCheck,
      directTabId: 'audit_log',
      badge: null,
    },
  ];

  const renderNavBadge = (badge: number | string | null | undefined, tone?: 'rose' | 'amber' | 'purple' | 'cyan') => {
    if (!badge) return null;
    const toneClass =
      tone === 'rose'
        ? 'bg-rose-500/20 text-rose-500 dark:text-rose-300 border border-rose-500/35'
        : tone === 'amber'
        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/35'
        : tone === 'purple'
        ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/35'
        : 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/35';
    return (
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold leading-none tabular-nums ${toneClass}`}>
        {badge}
      </span>
    );
  };

  return (
    <div className={`min-h-full rounded-2xl p-4 sm:p-6 space-y-6 transition-colors duration-300 font-sans ${
      isDark ? 'bg-[#090d16] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Header Utama Eksekutif */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-900/50 border-cyan-500/35 backdrop-blur-xl shadow-[0_0_16px_rgba(6,182,212,0.1)]' : 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
      }`}>
        <div className="flex items-center gap-3.5">
          <span className={`p-3 rounded-2xl border flex items-center justify-center ${
            activeFamily === 'BUILDING_BULK'
              ? isDark
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs'
              : activeFamily === 'FNB_CULINARY'
              ? isDark
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                : 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs'
              : activeFamily === 'SPECIALTY_SERVICE'
              ? isDark
                ? 'bg-purple-500/15 text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'bg-purple-50 text-purple-700 border-purple-300 shadow-xs'
              : isDark
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
              : 'bg-cyan-50 text-cyan-700 border-cyan-200 shadow-xs'
          }`}>
            {activeFamily === 'BUILDING_BULK' ? (
              <HardHat className="w-5 h-5" />
            ) : activeFamily === 'FNB_CULINARY' ? (
              <UtensilsCrossed className="w-5 h-5" />
            ) : activeFamily === 'SPECIALTY_SERVICE' ? (
              effectiveDomainConfig.primaryBusinessModel === 'FASHION_BUTIK' ? (
                <Shirt className="w-5 h-5" />
              ) : effectiveDomainConfig.subFeatures?.hasSerialImei ? (
                <Smartphone className="w-5 h-5" />
              ) : (
                <Wrench className="w-5 h-5" />
              )
            ) : (
              <Building2 className="w-5 h-5" />
            )}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={`text-xl leading-7 font-medium tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Executive Board Cockpit
              </h1>
              <span className={`text-[11px] font-mono font-semibold uppercase px-2.5 py-0.5 rounded border ${
                activeFamily === 'BUILDING_BULK'
                  ? isDark
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                  : activeFamily === 'FNB_CULINARY'
                  ? isDark
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                  : activeFamily === 'SPECIALTY_SERVICE'
                  ? isDark
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                    : 'bg-purple-100 text-purple-900 border-purple-300'
                  : isDark
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {enterpriseHeaderBadge}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isDark
                  ? 'bg-white/[0.04] text-slate-300 border-white/10'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                {activeModelDef.label}
              </span>
            </div>
            <p className={`text-xs mt-0.5 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {activeFamily === 'BUILDING_BULK'
                ? 'Pusat Kendali Depo Material, Status Surat Jalan & Ritase Armada, Piutang Proyek, & Valuasi Stok Curah'
                : activeFamily === 'FNB_CULINARY'
                ? 'Pusat Kendali Operasional Kuliner, Food Cost BOM Bahan Baku, Audit Kasir, & Alokasi Modal'
                : activeFamily === 'SPECIALTY_SERVICE'
                ? `Pusat Kendali ${activeModelDef.shortLabel}, Margin Layanan/Varian, Audit Kasir, & Alokasi Modal`
                : `Pusat Kendali Keputusan Finansial (${activeFamilyMeta.label}), Audit Kasir, Katalog Master, & Alokasi Modal`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {isMultiBranch && (
            <span className={`text-xs font-mono font-normal px-3 py-1.5 rounded-xl border ${
              isDark ? 'bg-white/[0.02] border-white/[0.06] text-cyan-400' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              Cabang: {selectedBranch}
            </span>
          )}

          <button
            type="button"
            onClick={() => window.location.reload()}
            className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-[0.99] ${
              isDark
                ? 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:border-cyan-400/40 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs hover:border-slate-300'
            }`}
            title="Refresh Realtime Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigasi Menu Utama (Tombol Langsung + Dropdown, 1 Baris Utuh Tanpa Scroll) */}
      <div
        ref={navContainerRef}
        className={`relative z-30 flex flex-wrap items-center gap-1 p-1.5 rounded-2xl border ${
          isDark
            ? 'bg-slate-900/60 border-cyan-500/35 backdrop-blur-md shadow-[0_0_16px_rgba(6,182,212,0.1)]'
            : 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
        }`}
      >
        {navigationMenuGroups.map((group) => {
          const GroupIcon = group.icon;
          const isDropdown = Boolean(group.items && group.items.length > 0);
          const isActiveGroup = group.directTabId
            ? activeTab === group.directTabId
            : Boolean(group.items?.some((sub) => sub.id === activeTab));
          const isOpen = openDropdown === group.id;
          const activeSubItem = group.items?.find((sub) => sub.id === activeTab);

          return (
            <div key={group.id} className="relative">
              <button
                type="button"
                onClick={() => {
                  if (group.directTabId) {
                    setActiveTab(group.directTabId);
                    setOpenDropdown(null);
                  } else {
                    setOpenDropdown((prev) => (prev === group.id ? null : group.id));
                  }
                }}
                aria-expanded={isDropdown ? isOpen : undefined}
                aria-haspopup={isDropdown ? 'menu' : undefined}
                className={`relative group flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-[0.99] border ${
                  isActiveGroup
                    ? isDark
                      ? 'bg-cyan-500/15 border-cyan-400/50 text-white shadow-[0_0_12px_rgba(6,182,212,0.22)]'
                      : 'bg-cyan-50 border-cyan-500/60 text-cyan-950 font-semibold shadow-xs'
                    : isOpen
                    ? isDark
                      ? 'bg-white/[0.06] border-white/10 text-white'
                      : 'bg-slate-100 border-slate-300 text-slate-900'
                    : isDark
                    ? 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <GroupIcon
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    isActiveGroup
                      ? isDark
                        ? 'text-cyan-400'
                        : 'text-cyan-700'
                      : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                <span>{group.label}</span>
                {activeSubItem && (
                  <span
                    className={`hidden 2xl:inline-block max-w-[115px] truncate text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                      isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-800'
                    }`}
                  >
                    {activeSubItem.label}
                  </span>
                )}
                {renderNavBadge(group.badge, group.badgeTone)}
                {isDropdown && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                )}
                {isActiveGroup && (
                  <span
                    className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full ${
                      isDark ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.85)]' : 'bg-cyan-600'
                    }`}
                  />
                )}
              </button>

              {isDropdown && isOpen && group.items && (
                <div
                  role="menu"
                  className={`absolute ${
                    group.id === 'audit_gov' ? 'left-0 lg:left-auto lg:right-0' : 'left-0'
                  } mt-2 w-64 rounded-2xl border p-1.5 shadow-2xl z-50 space-y-0.5 ${
                    isDark
                      ? 'bg-slate-900/95 border-cyan-500/40 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.65)]'
                      : 'bg-white border-cyan-500/60 shadow-[0_12px_28px_rgba(15,23,42,0.16)]'
                  }`}
                >
                  {group.items.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setActiveTab(sub.id);
                          setOpenDropdown(null);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer text-left ${
                          isSubActive
                            ? isDark
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-cyan-50 text-cyan-900 border border-cyan-300 font-semibold'
                            : isDark
                            ? 'text-slate-300 hover:bg-white/[0.06] hover:text-white border border-transparent'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <SubIcon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSubActive ? 'text-cyan-400' : 'text-slate-400'
                            }`}
                          />
                          <span className="truncate">{sub.label}</span>
                        </span>
                        {renderNavBadge(sub.badge, sub.badgeTone)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & ALOKASI KAS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* AI Executive Advisor Panel (Human-in-the-Loop) */}
          <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
            isDark ? 'bg-slate-900/50 border-cyan-500/35 backdrop-blur-xl shadow-[0_0_16px_rgba(6,182,212,0.1)]' : 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className={`p-2.5 rounded-xl border flex items-center justify-center ${
                  isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                }`}>
                  <BrainCircuit className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={`text-base leading-6 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      AI Executive Advisor • Human-in-the-Loop Intelligence
                    </h2>
                    <span className={`text-[10px] font-mono font-normal uppercase px-2 py-0.5 rounded border ${
                      isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 text-cyan-800 border-cyan-200'
                    }`}>
                      Gemini 2.5 Flash
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Saran strategis berbasis data lintas divisi. Prinsip Human-in-the-Loop: AI menganalisis, Manager mengeksekusi secara manual.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={isAnalyzingAi}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer active:scale-[0.99] ${
                  isAnalyzingAi
                    ? 'bg-slate-700 text-slate-400 border border-slate-600 cursor-not-allowed'
                    : isDark
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAnalyzingAi ? 'Menganalisis Snapshot Divisi...' : 'Analisis AI Sekarang'}</span>
              </button>
            </div>

            {/* Deteksi Pola Selisih Kas & Void Operasional */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isDark ? 'bg-slate-900/60 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'}`}>
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <div>
                  <h3 className={`text-xs font-semibold ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                    Deteksi Anomali Operasional: {voidItemLogs ? voidItemLogs.length : 0} Transaksi Void / Batal &amp; Rekonsiliasi Kas Shift
                  </h3>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Analisis riwayat rekonsiliasi Blind Shift Closing &amp; transaksi batal (void) merangkum temuan berbasis nomor shift tanpa memblokir kasir.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('fraud');
                  if (showToast) showToast('Mengarahkan ke Audit Kasir & Deteksi Anomali.');
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
                  isDark
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                    : 'bg-white border-amber-300 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <span>Tinjau di Audit Kasir</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {aiRecommendations && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {aiRecommendations.map((rec) => {
                  const isKritis = rec.tingkat_urgensi === 'KRITIS';
                  const isPerhatian = rec.tingkat_urgensi === 'PERHATIAN';
                  return (
                    <div key={rec.id} className={`p-4 rounded-xl border transition-all hover:-translate-y-0.5 space-y-3 flex flex-col justify-between ${
                      isKritis
                        ? isDark ? 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.15)]' : 'bg-rose-50 border-rose-300 shadow-xs'
                        : isPerhatian
                        ? isDark ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]' : 'bg-amber-50 border-amber-300 shadow-xs'
                        : isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-mono font-normal uppercase px-2 py-0.5 rounded border ${
                            isKritis
                              ? isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-rose-100 text-rose-800'
                              : isPerhatian
                              ? isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800'
                              : isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {rec.tingkat_urgensi}
                          </span>
                          <span className="text-[11px] font-mono font-normal text-slate-500">{rec.kategori}</span>
                        </div>

                        <div className={`text-xs font-mono font-semibold ${
                          isKritis ? 'text-rose-400' : isPerhatian ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {rec.fakta_data}
                        </div>

                        <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {rec.saran_tindakan}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleManagerDecision(rec, 'DITINDAKLANJUTI')}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-[0.99] border ${
                              isDark
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                                : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Tindak Lanjuti</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleManagerDecision(rec, 'DIABAIKAN')}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-[0.99] border ${
                              isDark
                                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
                                : 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Abaikan</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ringkasan Metrik 4 Kartu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border transition-all hover:-translate-y-0.5 ${
              isDark ? 'bg-slate-900/40 border-cyan-500/35 backdrop-blur-xl shadow-[0_0_16px_rgba(6,182,212,0.1)]' : 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-mono font-normal uppercase tracking-widest text-slate-500 mb-1">
                <span>Total Omzet Riil</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className={`text-lg leading-7 font-semibold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                {formatRupiah(totalOmzet)}
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-1">{totalStruk} Transaksi Selesai</p>
            </div>

            <div className={`p-5 rounded-2xl border transition-all hover:-translate-y-0.5 ${
              isDark ? 'bg-slate-900/40 border-cyan-500/35 backdrop-blur-xl shadow-[0_0_16px_rgba(6,182,212,0.1)]' : 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-mono font-normal uppercase tracking-widest text-slate-500 mb-1">
                <span>Saldo Kas Liquid</span>
                <DollarSign className="w-4 h-4 text-cyan-500" />
              </div>
              <div className={`text-lg leading-7 font-semibold font-mono tracking-tight ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                {formatRupiah(kasOperasional)}
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-1">Kas & Bank Aktif</p>
            </div>

            <div className={`p-5 rounded-2xl border transition-all hover:-translate-y-0.5 ${
              isDark ? 'bg-slate-900/40 border-cyan-500/35 backdrop-blur-xl shadow-[0_0_16px_rgba(6,182,212,0.1)]' : 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-mono font-normal uppercase tracking-widest text-slate-500 mb-1">
                <span>Valuasi Stok HPP</span>
                <Warehouse className="w-4 h-4 text-amber-500" />
              </div>
              <div className={`text-lg leading-7 font-semibold font-mono tracking-tight ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                {formatRupiah(totalValuasiStok)}
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-1">{activeCatalogCountLabel}</p>
            </div>

            <div className={`p-5 rounded-2xl border transition-all hover:-translate-y-0.5 ${
              pendingPRs.length > 0
                ? isDark
                  ? 'bg-slate-900/40 border-amber-500/40 backdrop-blur-xl shadow-[0_0_16px_rgba(245,158,11,0.12)]'
                  : 'bg-white border-amber-500/70 shadow-[0_0_16px_rgba(245,158,11,0.18)]'
                : isDark
                ? 'bg-slate-900/40 border-cyan-500/35 backdrop-blur-xl shadow-[0_0_16px_rgba(6,182,212,0.1)]'
                : 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-mono font-normal uppercase tracking-widest text-slate-500 mb-1">
                <span className={pendingPRs.length > 0 ? 'text-amber-600 dark:text-amber-400' : ''}>Pending PR & PO</span>
                {pendingPRs.length > 0 ? (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                ) : (
                  <FileCheck className="w-4 h-4 text-purple-500" />
                )}
              </div>
              <div className={`text-lg leading-7 font-semibold font-mono tracking-tight ${
                pendingPRs.length > 0
                  ? isDark ? 'text-amber-400' : 'text-amber-700'
                  : isDark ? 'text-purple-400' : 'text-purple-700'
              }`}>
                {pendingPRs.length} Document
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-1">Menunggu Persetujuan</p>
            </div>
          </div>

          {/* PANEL KHUSUS RUMPUN BUILDING_BULK (Material Bangunan, Armada Curah & Piutang Proyek) */}
          {isBuildingBulkActive && (
            <div
              className={`p-5 rounded-2xl border transition-all space-y-5 ${
                isDark
                  ? 'bg-slate-900/55 border-amber-500/40 backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.12)]'
                  : 'bg-white border-amber-400 shadow-[0_4px_18px_rgba(245,158,11,0.12)]'
              }`}
            >
              <div
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5 ${
                  isDark ? 'border-white/[0.08]' : 'border-amber-200/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`p-2.5 rounded-xl border flex items-center justify-center ${
                      isDark
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    <Truck className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={`text-base leading-6 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Cockpit Operasional Material &amp; Pengiriman Depo
                      </h2>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          isDark
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        SEKTOR: BUILDING
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Pemantauan khusus Surat Jalan &amp; Ritase Armada, Piutang Proyek/Kontraktor (Tempo &amp; DP), serta Valuasi Stok Curah vs Satuan.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('master_data')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isDark
                        ? 'bg-amber-500/15 border-amber-500/35 text-amber-300 hover:bg-amber-500/25'
                        : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Kelola Katalog Curah</span>
                  </button>
                </div>
              </div>

              {/* 3 Kolom Indikator Utama BUILDING_BULK */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. Status Surat Jalan (DO) & Ritase Armada */}
                <div
                  className={`p-4 rounded-xl border space-y-3 flex flex-col justify-between ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-slate-50/90 border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                        <Truck className="w-4 h-4 text-amber-500" />
                        Status Surat Jalan &amp; Ritase Armada
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          isDark
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            : 'bg-cyan-50 text-cyan-800 border-cyan-300'
                        }`}
                      >
                        {buildingBulkAnalytics.fleetSalesCount} DO Kirim
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/70 border-white/[0.06]' : 'bg-white border-slate-200'}`}>
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Ritase Armada</span>
                        <span className={`text-base font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {buildingBulkAnalytics.totalRitaseArmada} Rit
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Est. {buildingBulkAnalytics.totalEstimatedVolumeM3} m³ terkirim
                        </span>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/70 border-white/[0.06]' : 'bg-white border-slate-200'}`}>
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">DO Masuk Supplier</span>
                        <span className={`text-base font-bold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          {buildingBulkAnalytics.inboundVendorDoCount} DO
                        </span>
                        <span className="text-[10px] text-slate-500 block">Goods Receipt Terverifikasi</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                      <div className={`px-2 py-1.5 rounded border text-center ${isDark ? 'bg-slate-900/50 border-white/[0.06] text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                        <div className="text-slate-500">Pick-up</div>
                        <div className="font-bold">{buildingBulkAnalytics.pickupTrips} Rit</div>
                      </div>
                      <div className={`px-2 py-1.5 rounded border text-center ${isDark ? 'bg-slate-900/50 border-white/[0.06] text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                        <div className="text-slate-500">Engkel</div>
                        <div className="font-bold">{buildingBulkAnalytics.truckTrips} Rit</div>
                      </div>
                      <div className={`px-2 py-1.5 rounded border text-center ${isDark ? 'bg-slate-900/50 border-white/[0.06] text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                        <div className="text-slate-500">Dump</div>
                        <div className="font-bold">{buildingBulkAnalytics.dumpTruckTrips} Rit</div>
                      </div>
                    </div>

                    {buildingBulkAnalytics.recentDoList.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        {buildingBulkAnalytics.recentDoList.slice(0, 2).map((doItem: any, idx: number) => (
                          <div
                            key={idx}
                            className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-2 text-[11px] ${
                              isDark ? 'bg-slate-900/40 border-white/[0.05]' : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className={`font-mono font-semibold truncate ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
                                {doItem.doNumber} • {doItem.customer}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">{doItem.summary}</div>
                            </div>
                            <span
                              className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                doItem.status === 'TERKIRIM_PROYEK'
                                  ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                                  : doItem.status === 'DALAM_PENGIRIMAN'
                                  ? isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-800'
                                  : isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {doItem.status === 'MENUNGGU_MUAT'
                                ? 'MENUNGGU MUAT'
                                : doItem.status === 'DALAM_PENGIRIMAN'
                                ? 'PENGIRIMAN'
                                : 'TERKIRIM'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`p-2.5 rounded-lg border text-[11px] flex items-center gap-2 ${
                        isDark ? 'bg-slate-900/40 border-white/[0.05] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                      }`}>
                        <PackageCheck className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Siap mencatat DO &amp; ritase saat kasir mengaktifkan opsi Kirim Armada.</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTab('logistics_shrinkage')}
                      className={`w-full py-1.5 px-2.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 border cursor-pointer transition ${
                        isDark
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                          : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Kelola Armada, Status DO &amp; Susut Curah</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 2. Piutang Proyek / Kontraktor (Tempo & DP) */}
                <div
                  className={`p-4 rounded-xl border space-y-3 flex flex-col justify-between ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-slate-50/90 border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>
                        <DollarSign className="w-4 h-4 text-purple-500" />
                        Piutang Proyek &amp; Kontraktor (Tempo / DP)
                      </span>
                      {buildingBulkAnalytics.overdueReceivables.length > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            isDark
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {buildingBulkAnalytics.overdueReceivables.length} Overdue
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/70 border-white/[0.06]' : 'bg-white border-slate-200'}`}>
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">Piutang Tempo Aktif</span>
                        <span className={`text-sm font-bold font-mono ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                          {formatRupiah(buildingBulkAnalytics.totalPiutangProyek)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {buildingBulkAnalytics.unpaidReceivables.length} Faktur Proyek
                        </span>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/70 border-white/[0.06]' : 'bg-white border-slate-200'}`}>
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">DP Proyek Masuk</span>
                        <span className={`text-sm font-bold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          {formatRupiah(buildingBulkAnalytics.dpCollectedTotal)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {buildingBulkAnalytics.creditPosSalesCount} Order Tempo POS
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {buildingBulkAnalytics.unpaidReceivables.length === 0 ? (
                        <div className={`p-2.5 rounded-lg border text-[11px] flex items-center gap-2 ${
                          isDark ? 'bg-slate-900/40 border-white/[0.05] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                        }`}>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Seluruh tagihan tempo kontraktor/proyek saat ini lunas.</span>
                        </div>
                      ) : (
                        buildingBulkAnalytics.unpaidReceivables.slice(0, 3).map((inv: any) => {
                          const isOverdue = inv.status === 'Overdue';
                          return (
                            <div
                              key={inv.id}
                              className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-2 text-[11px] ${
                                isOverdue
                                  ? isDark
                                    ? 'bg-rose-950/25 border-rose-500/35'
                                    : 'bg-rose-50 border-rose-300'
                                  : isDark
                                  ? 'bg-slate-900/40 border-white/[0.05]'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className={`font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                  {inv.party_name}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 truncate">
                                  {inv.invoice_number} • Tempo {inv.due_date}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className={`font-mono font-bold ${isOverdue ? 'text-rose-500' : isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                                  {formatRupiah(inv.amount)}
                                </div>
                                <span
                                  className={`text-[9px] font-mono font-bold uppercase ${
                                    isOverdue ? 'text-rose-500' : 'text-amber-500'
                                  }`}
                                >
                                  {isOverdue ? 'OVERDUE' : 'TEMPO'}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Valuasi Stok Curah (m³/Ret) vs Satuan (Sak/Batang) */}
                <div
                  className={`p-4 rounded-xl border space-y-3 flex flex-col justify-between ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-slate-50/90 border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>
                        <Boxes className="w-4 h-4 text-emerald-500" />
                        Valuasi Curah (m³/Ret) vs Satuan
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          isDark
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {buildingBulkAnalytics.bulkItems.length + buildingBulkAnalytics.unitItems.length} SKU Depo
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/70 border-amber-500/25' : 'bg-white border-amber-300'}`}>
                        <span className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 block">
                          Stok Curah (m³ / Ret)
                        </span>
                        <span className={`text-sm font-bold font-mono ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                          {formatRupiah(buildingBulkAnalytics.bulkValuation)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {buildingBulkAnalytics.bulkItems.length} SKU • {buildingBulkAnalytics.totalBulkStockQty} m³/Ret ({buildingBulkAnalytics.bulkSharePercent}%)
                        </span>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/70 border-cyan-500/25' : 'bg-white border-cyan-300'}`}>
                        <span className="text-[10px] font-mono uppercase text-cyan-600 dark:text-cyan-400 block">
                          Stok Satuan (Sak/Btg)
                        </span>
                        <span className={`text-sm font-bold font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
                          {formatRupiah(buildingBulkAnalytics.unitValuation)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {buildingBulkAnalytics.unitItems.length} SKU • {buildingBulkAnalytics.totalUnitStockQty} Sak/Btg ({buildingBulkAnalytics.unitSharePercent}%)
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Split Bar Curah vs Satuan */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>Proporsi Modal Curah vs Satuan</span>
                        <span>Total HPP: {formatRupiah(buildingBulkAnalytics.totalValuation)}</span>
                      </div>
                      <div className={`w-full h-2.5 rounded-full overflow-hidden flex ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <div
                          className="h-full bg-amber-500 transition-all duration-500"
                          style={{ width: `${buildingBulkAnalytics.bulkSharePercent}%` }}
                          title={`Stok Curah: ${buildingBulkAnalytics.bulkSharePercent}%`}
                        />
                        <div
                          className="h-full bg-cyan-500 transition-all duration-500"
                          style={{ width: `${buildingBulkAnalytics.unitSharePercent}%` }}
                          title={`Stok Satuan: ${buildingBulkAnalytics.unitSharePercent}%`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] pt-0.5">
                        <span className="flex items-center gap-1 text-amber-500 font-medium">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                          Curah {buildingBulkAnalytics.bulkSharePercent}%
                        </span>
                        <span className="flex items-center gap-1 text-cyan-500 font-medium">
                          <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                          Satuan {buildingBulkAnalytics.unitSharePercent}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {[...buildingBulkAnalytics.bulkItems.slice(0, 1), ...buildingBulkAnalytics.unitItems.slice(0, 2)].map((item: any) => (
                        <div
                          key={item.id}
                          className={`px-2.5 py-1 rounded-lg border flex items-center justify-between gap-2 text-[11px] ${
                            isDark ? 'bg-slate-900/40 border-white/[0.05]' : 'bg-white border-slate-200'
                          }`}
                        >
                          <span className={`truncate font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {item.name}
                          </span>
                          <span className="font-mono text-[10px] shrink-0 text-slate-500">
                            {item.stock} {item.unit || 'Unit'} •{' '}
                            <strong className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>
                              {formatRupiah((Number(item.stock) || 0) * (Number(item.costPrice ?? item.cost_price) || 0))}
                            </strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Pemisahan Jurnal Biaya Logistik & Est. Laba Bersih Setelah Ongkir + Rekap Tagihan Proyek (Statement of Account Kontraktor) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
                {/* Kiri (5 Kolom): Pemisahan Jurnal Logistik & Est. Laba Bersih Setelah Ongkir */}
                <div
                  className={`lg:col-span-5 p-4 rounded-xl border space-y-3 flex flex-col justify-between ${
                    isDark ? 'bg-slate-950/60 border-orange-500/30' : 'bg-orange-50/60 border-orange-200'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-orange-300' : 'text-orange-900'}`}>
                        <Truck className="w-4 h-4 text-orange-500" />
                        Akuntansi Logistik &amp; Est. Laba Bersih Stlh Ongkir
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        COA 4-10102 &amp; 5-10205
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/80 border-white/[0.06]' : 'bg-white border-slate-200'}`}>
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">
                          Pendapatan Material (4-10001)
                        </span>
                        <span className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {formatRupiah(buildingBulkAnalytics.materialRevenueTotal)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Laba Kotor: {formatRupiah(buildingBulkAnalytics.grossProfitMaterial)}
                        </span>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/80 border-indigo-500/25' : 'bg-white border-indigo-200'}`}>
                        <span className="text-[10px] font-mono uppercase text-indigo-500 block">
                          Jasa Bongkar Kuli (4-10102)
                        </span>
                        <span className={`text-xs font-bold font-mono ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                          +{formatRupiah(buildingBulkAnalytics.loadingFeeTotal)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Pendapatan / Titipan Upah Kuli
                        </span>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/80 border-rose-500/25' : 'bg-white border-rose-200'}`}>
                        <span className="text-[10px] font-mono uppercase text-rose-500 block">
                          Beban Armada Frangko (5-10205)
                        </span>
                        <span className={`text-xs font-bold font-mono ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                          -{formatRupiah(buildingBulkAnalytics.fleetDeliveryCostTotal)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Pick-up / Engkel / Dump Truck
                        </span>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-emerald-950/35 border-emerald-500/40' : 'bg-emerald-50 border-emerald-300'}`}>
                        <span className={`text-[10px] font-mono uppercase font-bold block ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                          Est. Laba Bersih Stlh Ongkir
                        </span>
                        <span className={`text-sm font-black font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          {formatRupiah(buildingBulkAnalytics.estNetProfitAfterShipping)}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400/80 block">
                          Net setelah biaya kirim proyek
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kanan (7 Kolom): Rekap Tagihan Proyek / Statement of Account (SOA) Kontraktor */}
                <div
                  className={`lg:col-span-7 p-4 rounded-xl border space-y-2.5 ${
                    isDark ? 'bg-slate-950/60 border-purple-500/30' : 'bg-purple-50/40 border-purple-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>
                        <FileSpreadsheet className="w-4 h-4 text-purple-500" />
                        Rekap Tagihan Proyek / Statement of Account (SOA) Kontraktor
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Ringkasan per proyek/kontraktor: Total Nilai DO Terkirim, Total DP Masuk, Sisa Tagihan Tempo &amp; Status Jatuh Tempo
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-800 border-purple-300'
                    }`}>
                      {buildingBulkAnalytics.contractorStatementOfAccounts.length} Akun Kontraktor
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/[0.08]">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className={`font-mono text-[10px] uppercase ${isDark ? 'bg-slate-900/90 text-slate-400' : 'bg-slate-100 text-slate-700'}`}>
                        <tr>
                          <th className="py-1.5 px-2.5">Kontraktor / Proyek</th>
                          <th className="py-1.5 px-2.5 text-right">Total Nilai DO Terkirim</th>
                          <th className="py-1.5 px-2.5 text-right">Total DP Masuk</th>
                          <th className="py-1.5 px-2.5 text-right">Sisa Tagihan Tempo</th>
                          <th className="py-1.5 px-2.5 text-center">Status Jatuh Tempo</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-white/[0.06] bg-slate-900/40' : 'divide-slate-200 bg-white'}`}>
                        {buildingBulkAnalytics.contractorStatementOfAccounts.map((soa, sIdx) => (
                          <tr key={`soa-row-${sIdx}`}>
                            <td className="py-1.5 px-2.5">
                              <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {soa.contractorName}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {soa.projectName} ({soa.doCount} DO)
                              </div>
                            </td>
                            <td className={`py-1.5 px-2.5 text-right font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {formatRupiah(soa.totalDoDeliveredValue)}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatRupiah(soa.totalDpPaid)}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-bold text-amber-600 dark:text-amber-300">
                              {formatRupiah(soa.remainingTempoBalance)}
                            </td>
                            <td className="py-1.5 px-2.5 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                                  soa.dueStatus === 'OVERDUE'
                                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/40'
                                    : soa.dueStatus === 'JATUH_TEMPO_DEKAT'
                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                                    : soa.dueStatus === 'LUNAS'
                                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                                    : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/35'
                                }`}
                              >
                                {soa.dueStatus === 'OVERDUE'
                                  ? `OVERDUE (${soa.dueDate})`
                                  : soa.dueStatus === 'JATUH_TEMPO_DEKAT'
                                  ? `SEGERA (${soa.dueDate})`
                                  : soa.dueStatus === 'LUNAS'
                                  ? 'LUNAS'
                                  : `TEMPO (${soa.dueDate})`}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Panel Cockpit Eksekutif Operasional & KPI Laundry */}
          {isLaundryActive && (
            <div
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                isDark
                  ? 'bg-slate-900/50 border-cyan-500/40 backdrop-blur-xl shadow-[0_0_20px_rgba(6,182,212,0.12)]'
                  : 'bg-white border-cyan-500/70 shadow-[0_0_18px_rgba(6,182,212,0.14)]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-cyan-500 shrink-0">
                    <Shirt className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`text-base leading-6 font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Cockpit Eksekutif Operasional &amp; KPI Laundry
                    </h2>
                    <p className={`text-xs mt-0.5 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Ringkasan volume kiloan masuk, rasio SLA Express vs Reguler, Piutang Rak cucian siap ambil, dan kepatuhan waktu produksi.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-300 self-start sm:self-auto">
                  SYNC: POS • TRACKING RAK • FINANCE AR • KOMISI HR
                </span>
              </div>

              {/* 4 KPI Utama Laundry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* KPI 1: Total Berat Cucian Masuk (kg) */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-cyan-500/30' : 'bg-cyan-50/50 border-cyan-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                      Total Berat Cucian Masuk
                    </span>
                    <Scale className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div className={`text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {laundryExecutiveAnalytics.totalWeightKg.toFixed(1)} kg
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    {laundryExecutiveAnalytics.totalPhysicalPcs} Pcs Fisik &bull; {laundryExecutiveAnalytics.totalSatuanPcs} Pcs Satuan &bull; {laundryExecutiveAnalytics.totalPasang} Psg &bull; {laundryExecutiveAnalytics.totalAreaM2} m²
                  </div>
                </div>

                {/* KPI 2: Rasio Order Express vs Reguler */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-indigo-500/30' : 'bg-indigo-50/50 border-indigo-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      Rasio Express vs Reguler
                    </span>
                    <Zap className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {laundryExecutiveAnalytics.expressRatioPct}% Express : {laundryExecutiveAnalytics.regulerRatioPct}% Reguler
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex my-1.5">
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${laundryExecutiveAnalytics.expressRatioPct}%` }}
                      title={`Express: ${laundryExecutiveAnalytics.expressCount}`}
                    />
                    <div
                      className="bg-cyan-500 h-full"
                      style={{ width: `${laundryExecutiveAnalytics.kilatRatioPct}%` }}
                      title={`Kilat: ${laundryExecutiveAnalytics.kilatCount}`}
                    />
                    <div
                      className="bg-indigo-500 h-full"
                      style={{ width: `${laundryExecutiveAnalytics.regulerRatioPct}%` }}
                      title={`Reguler: ${laundryExecutiveAnalytics.regulerCount}`}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    Exp (6j): {laundryExecutiveAnalytics.expressCount} &bull; Kilat (24j): {laundryExecutiveAnalytics.kilatCount} &bull; Reg (48j): {laundryExecutiveAnalytics.regulerCount}
                  </div>
                </div>

                {/* KPI 3: Nilai Tagihan Belum Diambil (Piutang Rak) */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-amber-500/35' : 'bg-amber-50/50 border-amber-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      Piutang Rak (Belum Diambil)
                    </span>
                    <DollarSign className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                    {formatRupiah(laundryExecutiveAnalytics.piutangTotalLaundryAmount)}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    Rak Siap Ambil: {formatRupiah(laundryExecutiveAnalytics.piutangRakAmount)} ({laundryExecutiveAnalytics.unpaidOrdersCount} nota AR)
                  </div>
                </div>

                {/* KPI 4: Performa Ketepatan Waktu SLA */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-emerald-500/35' : 'bg-emerald-50/50 border-emerald-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Performa Ketepatan SLA
                    </span>
                    <Clock className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {laundryExecutiveAnalytics.slaOnTimeRatePct}% On-Time
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    {laundryExecutiveAnalytics.onTimeCount}/{laundryExecutiveAnalytics.totalOrders} order sesuai estimasi &bull; {laundryExecutiveAnalytics.overdueCount} terlambat
                  </div>
                </div>
              </div>

              {/* Pipeline 5 Tahap Produksi & Daftar Tagihan / Rak Aktif */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className={`lg:col-span-5 p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-950/60 border-white/[0.08]' : 'bg-slate-50/80 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Distribusi Antrean Produksi Laundry
                    </span>
                    <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                      Total {laundryExecutiveAnalytics.totalOrders} Order
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {[
                      { key: 'DITERIMA', label: 'Diterima', cls: 'text-sky-600 dark:text-sky-300 border-sky-500/30 bg-sky-500/10' },
                      { key: 'CUCI', label: 'Cuci', cls: 'text-cyan-600 dark:text-cyan-300 border-cyan-500/30 bg-cyan-500/10' },
                      { key: 'SETRIKA', label: 'Setrika', cls: 'text-indigo-600 dark:text-indigo-300 border-indigo-500/30 bg-indigo-500/10' },
                      { key: 'SIAP_AMBIL', label: 'Siap Rak', cls: 'text-amber-700 dark:text-amber-300 border-amber-500/35 bg-amber-500/15' },
                      { key: 'DIAMBIL', label: 'Diambil', cls: 'text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10' },
                    ].map((st) => (
                      <div key={st.key} className={`p-2 rounded-lg border ${st.cls}`}>
                        <div className="text-base font-bold font-mono">
                          {laundryExecutiveAnalytics.stageCounts[st.key] || 0}
                        </div>
                        <div className="text-[10px] font-medium truncate">{st.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Omzet Order</span>
                      <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatRupiah(laundryExecutiveAnalytics.totalLaundryRevenue)}
                      </span>
                    </div>
                    <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Kas &amp; DP Masuk</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(laundryExecutiveAnalytics.totalCashDpCollected)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`lg:col-span-7 p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-slate-950/60 border-white/[0.08]' : 'bg-slate-50/80 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Monitor Tagihan Cucian, Nomor Rak &amp; Deadline SLA
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Real-Time Sync POS &amp; Piutang (1-10301)
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/[0.08]">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className={`font-mono text-[10px] uppercase ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-700'}`}>
                        <tr>
                          <th className="py-1.5 px-2.5">Tag / Order</th>
                          <th className="py-1.5 px-2.5">Pelanggan</th>
                          <th className="py-1.5 px-2.5">Tahap &amp; Rak</th>
                          <th className="py-1.5 px-2.5">SLA</th>
                          <th className="py-1.5 px-2.5 text-right">Sisa Piutang</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-white/[0.06] bg-slate-900/40' : 'divide-slate-200 bg-white'}`}>
                        {laundryExecutiveAnalytics.orders.slice(0, 6).map((ord: any) => (
                          <tr key={ord.id}>
                            <td className="py-1.5 px-2.5 font-mono">
                              <div className="font-bold text-cyan-600 dark:text-cyan-400">{ord.tagCode}</div>
                              <div className="text-[10px] text-slate-500">{ord.orderNumber}</div>
                            </td>
                            <td className="py-1.5 px-2.5">
                              <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{ord.customerName}</div>
                              <div className="text-[10px] text-slate-500">{ord.totalPieces} Pcs</div>
                            </td>
                            <td className="py-1.5 px-2.5 font-mono text-[10px]">
                              <span className="font-semibold">{ord.productionStatus}</span>
                              {ord.rackNumber && (
                                <span className="ml-1 px-1 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                  {ord.rackNumber}
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-2.5 text-[10px]">
                              <span className="font-medium">{ord.slaLabel}</span>
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-bold">
                              {(Number(ord.remainingAmount) || 0) > 0 ? (
                                <span className="text-amber-600 dark:text-amber-400">
                                  {formatRupiah(ord.remainingAmount)}
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400">LUNAS</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Panel Cockpit Eksekutif Operasional & KPI Fashion & Butik */}
          {isFashionActive && (
            <div
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                isDark
                  ? 'bg-slate-900/50 border-fuchsia-500/40 backdrop-blur-xl shadow-[0_0_20px_rgba(217,70,239,0.12)]'
                  : 'bg-white border-fuchsia-500/70 shadow-[0_0_18px_rgba(217,70,239,0.12)]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/35 flex items-center justify-center text-fuchsia-500 shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`text-base leading-6 font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Cockpit Eksekutif Operasional &amp; KPI Fashion &amp; Butik
                    </h2>
                    <p className={`text-xs mt-0.5 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Rasio penjualan harga normal vs promo/diskon (Akun 4-10004), kontribusi omzet Pramuniaga / Fashion Advisor, serta deteksi varian Ukuran × Warna Fast-Moving vs Slow-Moving.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border bg-fuchsia-500/10 border-fuchsia-500/35 text-fuchsia-700 dark:text-fuchsia-300 self-start sm:self-auto">
                  SYNC: POS BUTIK • DISKON 4-10004 • KOMISI ADVISOR HR • MATRIKS VARIAN
                </span>
              </div>

              {/* 4 KPI Utama Fashion & Butik */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* KPI 1: Rasio Harga Normal vs Barang Promo/Diskon */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-fuchsia-500/30' : 'bg-fuchsia-50/50 border-fuchsia-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300">
                      Rasio Harga Normal vs Promo
                    </span>
                    <Tag className="w-4 h-4 text-fuchsia-500" />
                  </div>
                  <div className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {fashionExecutiveAnalytics.normalRevenuePct}% Normal : {fashionExecutiveAnalytics.promoRevenuePct}% Promo
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex my-1.5">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${fashionExecutiveAnalytics.normalRevenuePct}%` }}
                      title={`Normal: ${formatRupiah(fashionExecutiveAnalytics.normalPriceRevenue)}`}
                    />
                    <div
                      className="bg-rose-500 h-full"
                      style={{ width: `${fashionExecutiveAnalytics.promoRevenuePct}%` }}
                      title={`Promo: ${formatRupiah(fashionExecutiveAnalytics.promoDiscountRevenue)}`}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-relaxed">
                    Normal: {formatRupiah(fashionExecutiveAnalytics.normalPriceRevenue)} ({fashionExecutiveAnalytics.normalPriceUnits} pcs)
                    <br />
                    Promo: {formatRupiah(fashionExecutiveAnalytics.promoDiscountRevenue)} &bull; Potongan: -{formatRupiah(fashionExecutiveAnalytics.totalDiscountValue)} ({fashionExecutiveAnalytics.avgDiscountPct}%)
                  </div>
                </div>

                {/* KPI 2: Kontribusi Omzet per Pramuniaga / Fashion Advisor */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-indigo-500/30' : 'bg-indigo-50/50 border-indigo-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      Omzet Fashion Advisor
                    </span>
                    <Users className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className={`text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatRupiah(fashionExecutiveAnalytics.advisorAttributedNetSales)}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono leading-relaxed">
                    Top:{' '}
                    <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                      {fashionExecutiveAnalytics.advisorLeaderboard[0]?.trxCount
                        ? `${fashionExecutiveAnalytics.advisorLeaderboard[0].employeeName} (${fashionExecutiveAnalytics.advisorLeaderboard[0].sharePercent}%)`
                        : 'Belum ada transaksi'}
                    </span>
                    <br />
                    Est. Komisi HR: {formatRupiah(fashionExecutiveAnalytics.advisorTotalCommission)}
                  </div>
                </div>

                {/* KPI 3: Varian Ukuran & Warna Paling Laris (Fast-Moving) */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-emerald-500/35' : 'bg-emerald-50/50 border-emerald-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Varian Terlaris (Fast-Moving)
                    </span>
                    <Flame className="w-4 h-4 text-emerald-500" />
                  </div>
                  {fashionExecutiveAnalytics.fastMovingVariants.length > 0 ? (
                    <>
                      <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">
                        {fashionExecutiveAnalytics.fastMovingVariants[0].size} &bull; {fashionExecutiveAnalytics.fastMovingVariants[0].color}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono leading-relaxed truncate">
                        {fashionExecutiveAnalytics.fastMovingVariants[0].productName}
                        <br />
                        Terjual: {fashionExecutiveAnalytics.fastMovingVariants[0].soldQty} pcs &bull; Turnover {fashionExecutiveAnalytics.fastMovingVariants[0].turnoverPct}%
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`text-base font-bold font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Menunggu Penjualan
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                        {fashionExecutiveAnalytics.allVariantRows.length} sel varian Ukuran × Warna siap dipantau
                      </div>
                    </>
                  )}
                </div>

                {/* KPI 4: Varian Menumpuk (Slow-Moving) & Tukar Ukuran */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-amber-500/35' : 'bg-amber-50/50 border-amber-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      Stok Menumpuk &amp; Tukar Ukuran
                    </span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  {fashionExecutiveAnalytics.slowMovingVariants.length > 0 ? (
                    <>
                      <div className="text-base font-bold font-mono text-amber-600 dark:text-amber-400 truncate">
                        {fashionExecutiveAnalytics.slowMovingVariants[0].size} &bull; {fashionExecutiveAnalytics.slowMovingVariants[0].color} ({fashionExecutiveAnalytics.slowMovingVariants[0].currentStock} pcs)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono leading-relaxed truncate">
                        {fashionExecutiveAnalytics.slowMovingVariants[0].productName} (Terjual {fashionExecutiveAnalytics.slowMovingVariants[0].soldQty})
                        <br />
                        Tukar Ukuran Rp 0: {fashionExecutiveAnalytics.zeroDiffExchangeCount} nota &bull; Selisih Bayar: {fashionExecutiveAnalytics.paidExchangeCount}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                        {fashionExecutiveAnalytics.totalVariantStock} Pcs Matriks
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                        Tukar Ukuran Rp 0: {fashionExecutiveAnalytics.zeroDiffExchangeCount} nota
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Tengah: Kontribusi Omzet per Pramuniaga & Sebaran Ukuran / Warna */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Kiri: Kontribusi Omzet per Pramuniaga / Fashion Advisor */}
                <div className={`lg:col-span-6 p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-950/60 border-white/[0.08]' : 'bg-slate-50/80 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      <Award className="w-4 h-4 text-indigo-500" />
                      Kontribusi Omzet per Pramuniaga / Fashion Advisor
                    </span>
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                      Net Sales: {formatRupiah(fashionExecutiveAnalytics.netSalesValue)}
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/[0.08]">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className={`font-mono text-[10px] uppercase ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-700'}`}>
                        <tr>
                          <th className="py-1.5 px-2.5">Pramuniaga</th>
                          <th className="py-1.5 px-2.5 text-center">Nota / Pcs</th>
                          <th className="py-1.5 px-2.5 text-right">Omzet Bersih</th>
                          <th className="py-1.5 px-2.5 text-right">Share</th>
                          <th className="py-1.5 px-2.5 text-right">Komisi HR</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-white/[0.06] bg-slate-900/40' : 'divide-slate-200 bg-white'}`}>
                        {fashionExecutiveAnalytics.advisorLeaderboard.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-4 px-3 text-center text-slate-500">
                              Belum ada data Pramuniaga atau transaksi Fashion.
                            </td>
                          </tr>
                        ) : (
                          fashionExecutiveAnalytics.advisorLeaderboard.map((adv) => (
                            <tr key={adv.employeeId}>
                              <td className="py-1.5 px-2.5">
                                <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{adv.employeeName}</div>
                                <div className="text-[10px] text-slate-500">{adv.role} &bull; {adv.commissionRatePercent}%</div>
                              </td>
                              <td className="py-1.5 px-2.5 text-center font-mono">
                                {adv.trxCount} / {adv.itemsSoldQty}
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-300">
                                {formatRupiah(adv.netSalesTotal)}
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono">
                                <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-semibold">
                                  {adv.sharePercent}%
                                </span>
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {formatRupiah(adv.totalCommission)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {fashionExecutiveAnalytics.unassignedNetSales > 0 && (
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      * Omzet Butik tanpa pilihan Pramuniaga: {formatRupiah(fashionExecutiveAnalytics.unassignedNetSales)}
                    </div>
                  )}
                </div>

                {/* Kanan: Distribusi Ukuran (S-XXL) & Warna */}
                <div className={`lg:col-span-6 p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-950/60 border-white/[0.08]' : 'bg-slate-50/80 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Sebaran Permintaan &amp; Sisa Stok per Ukuran &amp; Warna
                    </span>
                    <span className="text-[10px] font-mono text-fuchsia-600 dark:text-fuchsia-300">
                      Total Stok Matriks: {fashionExecutiveAnalytics.totalVariantStock} pcs
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-500 mb-1.5">Per Ukuran (Terjual vs Sisa Stok)</div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {fashionExecutiveAnalytics.sizeSummary.slice(0, 5).map((sz) => (
                        <div key={sz.size} className={`p-2 rounded-lg border text-center ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <div className="text-xs font-bold font-mono text-fuchsia-600 dark:text-fuchsia-300">{sz.size}</div>
                          <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{sz.soldQty} terjual</div>
                          <div className="text-[10px] font-mono text-slate-500">Sisa {sz.currentStock}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-500 mb-1.5">Per Warna (Terjual vs Sisa Stok)</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {fashionExecutiveAnalytics.colorSummary.slice(0, 4).map((cl) => (
                        <div key={cl.color} className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <div className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{cl.color}</div>
                          <div className="flex items-center justify-between text-[10px] font-mono mt-0.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{cl.soldQty} laku</span>
                            <span className="text-slate-500">Stok {cl.currentStock}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bawah: Fast-Moving vs Slow-Moving Varian Ukuran x Warna */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Fast-Moving Varian */}
                <div className={`p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-slate-950/60 border-emerald-500/30' : 'bg-emerald-50/30 border-emerald-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-emerald-500" />
                      Varian Paling Laris (Fast-Moving Ukuran × Warna)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                      Prioritas Restock
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/[0.08]">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className={`font-mono text-[10px] uppercase ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-700'}`}>
                        <tr>
                          <th className="py-1.5 px-2.5">Artikel</th>
                          <th className="py-1.5 px-2.5">Ukuran &bull; Warna</th>
                          <th className="py-1.5 px-2.5 text-right">Terjual</th>
                          <th className="py-1.5 px-2.5 text-right">Sisa</th>
                          <th className="py-1.5 px-2.5 text-right">Turnover</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-white/[0.06] bg-slate-900/40' : 'divide-slate-200 bg-white'}`}>
                        {fashionExecutiveAnalytics.fastMovingVariants.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-4 px-3 text-center text-slate-500">
                              Belum ada varian Ukuran × Warna yang terjual pada periode ini.
                            </td>
                          </tr>
                        ) : (
                          fashionExecutiveAnalytics.fastMovingVariants.slice(0, 6).map((v) => (
                            <tr key={v.key}>
                              <td className="py-1.5 px-2.5">
                                <div className={`font-medium truncate max-w-[170px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{v.productName}</div>
                                <div className="text-[10px] text-slate-500">{formatRupiah(v.soldRevenue)}</div>
                              </td>
                              <td className="py-1.5 px-2.5 font-mono">
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold">
                                  {v.size} &bull; {v.color}
                                </span>
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {v.soldQty} pcs
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono text-slate-500">
                                {v.currentStock}
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {v.turnoverPct}%
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Slow-Moving Varian */}
                <div className={`p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-slate-950/60 border-amber-500/30' : 'bg-amber-50/30 border-amber-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Varian Menumpuk (Slow-Moving Ukuran × Warna)
                    </span>
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                      Rekomendasi Clearance Sale
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/[0.08]">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className={`font-mono text-[10px] uppercase ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-700'}`}>
                        <tr>
                          <th className="py-1.5 px-2.5">Artikel</th>
                          <th className="py-1.5 px-2.5">Ukuran &bull; Warna</th>
                          <th className="py-1.5 px-2.5 text-right">Terjual</th>
                          <th className="py-1.5 px-2.5 text-right">Stok Menumpuk</th>
                          <th className="py-1.5 px-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-white/[0.06] bg-slate-900/40' : 'divide-slate-200 bg-white'}`}>
                        {fashionExecutiveAnalytics.slowMovingVariants.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-4 px-3 text-center text-slate-500">
                              Tidak ada stok varian menumpuk saat ini.
                            </td>
                          </tr>
                        ) : (
                          fashionExecutiveAnalytics.slowMovingVariants.slice(0, 6).map((v) => (
                            <tr key={v.key}>
                              <td className="py-1.5 px-2.5">
                                <div className={`font-medium truncate max-w-[170px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{v.productName}</div>
                                <div className="text-[10px] text-slate-500">Harga: {formatRupiah(v.sellPrice)}</div>
                              </td>
                              <td className="py-1.5 px-2.5 font-mono">
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold">
                                  {v.size} &bull; {v.color}
                                </span>
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono text-slate-500">
                                {v.soldQty} pcs
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                                {v.currentStock} pcs
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono">
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px]">
                                  {v.soldQty === 0 ? 'STAGNAN' : `TURNOVER ${v.turnoverPct}%`}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PANEL KHUSUS SEKTOR FNB: Cockpit Operasional Kuliner & Food Cost F&B */}
          {isFnb && (
            <div
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                isDark
                  ? 'bg-slate-900/50 border-orange-500/40 backdrop-blur-xl shadow-[0_0_20px_rgba(249,115,22,0.12)]'
                  : 'bg-white border-orange-400/80 shadow-[0_4px_18px_rgba(249,115,22,0.12)]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/35 flex items-center justify-center text-orange-500 shrink-0">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={`text-base leading-6 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Cockpit Operasional Kuliner &amp; Food Cost F&amp;B
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border bg-orange-500/15 border-orange-500/35 text-orange-600 dark:text-orange-300">
                        SEKTOR: FNB
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Ringkasan performa menu kuliner, rasio Food Cost resep BOM, komposisi Dine-In vs Takeaway/Delivery &amp; pemantauan stok bahan baku dapur.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-300 self-start sm:self-auto">
                  {fnbExecutiveAnalytics.menuCount} MENU • {fnbExecutiveAnalytics.activeToppingCount} TOPPING • {fnbExecutiveAnalytics.totalRawMaterialCount} BAHAN DAPUR
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Menu Terlaris Hari Ini */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-orange-500/30' : 'bg-orange-50/50 border-orange-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-orange-700 dark:text-orange-300">
                      Menu Terlaris {fnbExecutiveAnalytics.isTodayData ? 'Hari Ini' : 'Periode Aktif'}
                    </span>
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className={`text-sm font-bold leading-snug line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {fnbExecutiveAnalytics.topMenu ? fnbExecutiveAnalytics.topMenu.name : 'Belum Ada Order'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
                    <span>{fnbExecutiveAnalytics.topMenu?.qty || 0} Porsi Terjual</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {formatRupiah(fnbExecutiveAnalytics.topMenu?.revenue || 0)}
                    </span>
                  </div>
                </div>

                {/* 2. Estimasi Rata-rata Food Cost BOM (%) */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Rata-Rata Food Cost BOM
                    </span>
                    <PieChart className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className={`text-xl font-bold font-mono ${
                    fnbExecutiveAnalytics.avgFoodCostPct > 40
                      ? 'text-rose-500'
                      : fnbExecutiveAnalytics.avgFoodCostPct > 35
                      ? 'text-amber-500'
                      : isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    {fnbExecutiveAnalytics.avgFoodCostPct}%
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Est. Gross Margin Kuliner: <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{fnbExecutiveAnalytics.avgGrossMarginPct}%</span>
                  </div>
                </div>

                {/* 3. Total Transaksi Dine-In vs Takeaway/Delivery */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-cyan-500/30' : 'bg-cyan-50/50 border-cyan-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                      Dine-In vs Takeaway/Delivery
                    </span>
                    <ShoppingBag className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div className={`text-base font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {fnbExecutiveAnalytics.dineInCount} Dine-In <span className="text-slate-400 font-normal">/</span> {fnbExecutiveAnalytics.takeawayDeliveryCount} Takeaway
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-2 flex">
                    <div
                      className="h-full bg-cyan-500 transition-all"
                      style={{ width: `${fnbExecutiveAnalytics.totalFnbTx > 0 ? fnbExecutiveAnalytics.dineInPct : 50}%` }}
                    />
                    <div
                      className="h-full bg-amber-500 transition-all"
                      style={{ width: `${fnbExecutiveAnalytics.totalFnbTx > 0 ? fnbExecutiveAnalytics.takeawayPct : 50}%` }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                    <span>Dine-In {fnbExecutiveAnalytics.dineInPct}%</span>
                    <span>Takeaway/Delivery {fnbExecutiveAnalytics.takeawayPct}%</span>
                  </div>
                </div>

                {/* 4. Status Bahan Baku Kritis Dapur */}
                <div className={`p-3.5 rounded-xl border ${
                  fnbExecutiveAnalytics.criticalRawMaterials.length > 0
                    ? isDark ? 'bg-rose-950/30 border-rose-500/40' : 'bg-rose-50/60 border-rose-300'
                    : isDark ? 'bg-slate-950/70 border-emerald-500/30' : 'bg-emerald-50/40 border-emerald-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-mono uppercase tracking-wider ${
                      fnbExecutiveAnalytics.criticalRawMaterials.length > 0
                        ? 'text-rose-600 dark:text-rose-300'
                        : 'text-emerald-700 dark:text-emerald-300'
                    }`}>
                      Bahan Baku Kritis Dapur
                    </span>
                    <AlertTriangle className={`w-4 h-4 ${
                      fnbExecutiveAnalytics.criticalRawMaterials.length > 0 ? 'text-rose-500' : 'text-emerald-500'
                    }`} />
                  </div>
                  <div className={`text-xl font-bold font-mono ${
                    fnbExecutiveAnalytics.criticalRawMaterials.length > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    {fnbExecutiveAnalytics.criticalRawMaterials.length} SKU Kritis
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {fnbExecutiveAnalytics.criticalRawMaterials.length > 0
                      ? fnbExecutiveAnalytics.criticalRawMaterials.slice(0, 2).map((r: any) => r.name).join(', ')
                      : `Seluruh ${fnbExecutiveAnalytics.totalRawMaterialCount} bahan baku dapur dalam batas aman`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PANEL KHUSUS SEKTOR SERVICE (Barbershop & Salon Non-Laundry): Cockpit Operasional Layanan & Antrean Jasa */}
          {isNonLaundryServiceActive && (
            <div
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                isDark
                  ? 'bg-slate-900/50 border-violet-500/40 backdrop-blur-xl shadow-[0_0_20px_rgba(139,92,246,0.12)]'
                  : 'bg-white border-violet-400/80 shadow-[0_4px_18px_rgba(139,92,246,0.12)]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/35 flex items-center justify-center text-violet-500 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={`text-base leading-6 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Cockpit Operasional Layanan &amp; Antrean Jasa
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border bg-violet-500/15 border-violet-500/35 text-violet-600 dark:text-violet-300">
                        SEKTOR: SERVICE
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Pantauan transaksi jasa grooming/barbershop, layanan terlaris, estimasi komisi stylist &amp; kesiapan katalog layanan aktif.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border bg-violet-500/10 border-violet-500/35 text-violet-600 dark:text-violet-300 self-start sm:self-auto">
                  {activeModelDef.label.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-violet-500/30' : 'bg-violet-50/50 border-violet-200'}`}>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-violet-700 dark:text-violet-300">Total Order Jasa</span>
                  <div className={`text-xl font-bold font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {serviceGeneralAnalytics.totalOrders} Sesi
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Omzet Jasa: {formatRupiah(serviceGeneralAnalytics.totalServiceRevenue)}</p>
                </div>
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-cyan-500/30' : 'bg-cyan-50/50 border-cyan-200'}`}>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-700 dark:text-cyan-300">Layanan Terlaris</span>
                  <div className={`text-sm font-bold mt-1 line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {serviceGeneralAnalytics.topService.name}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{serviceGeneralAnalytics.topService.qty}x Dipesan</p>
                </div>
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'}`}>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Est. Komisi Stylist (15%)</span>
                  <div className={`text-xl font-bold font-mono mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    {formatRupiah(serviceGeneralAnalytics.estStylistCommission)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Tersinkron ke Modul Payroll HR</p>
                </div>
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Katalog Layanan Aktif</span>
                  <div className={`text-xl font-bold font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {serviceGeneralAnalytics.catalogCount} Layanan
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Antrean &amp; Jadwal Siap Operasional</p>
                </div>
              </div>
            </div>
          )}

          {/* PANEL KHUSUS SEKTOR RETAIL: Cockpit Operasional Ritel & Perputaran SKU */}
          {isRetail && (
            <div
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                isDark
                  ? 'bg-slate-900/50 border-cyan-500/40 backdrop-blur-xl shadow-[0_0_20px_rgba(6,182,212,0.12)]'
                  : 'bg-white border-cyan-400/80 shadow-[0_4px_18px_rgba(6,182,212,0.12)]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-cyan-500 shrink-0">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={`text-base leading-6 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Cockpit Operasional Ritel &amp; Perputaran SKU
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border bg-cyan-500/15 border-cyan-500/35 text-cyan-600 dark:text-cyan-300">
                        SEKTOR: RETAIL
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Pantauan SKU terlaris, rata-rata margin kotor ritel, status stok menipis &amp; kesehatan katalog {activeModelDef.label}.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border bg-cyan-500/10 border-cyan-500/35 text-cyan-600 dark:text-cyan-300 self-start sm:self-auto">
                  {retailExecutiveAnalytics.totalSkus} SKU AKTIF • {retailExecutiveAnalytics.healthyRatioPct}% STOK SEHAT
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-cyan-500/30' : 'bg-cyan-50/50 border-cyan-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-700 dark:text-cyan-300">SKU Fast Moving</span>
                    <TrendingUp className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div className={`text-sm font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {retailExecutiveAnalytics.topRetailSku ? retailExecutiveAnalytics.topRetailSku.name : 'Belum Ada Penjualan'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1 flex justify-between">
                    <span>{retailExecutiveAnalytics.topRetailSku?.qty || 0} Unit Terjual</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                      {formatRupiah(retailExecutiveAnalytics.topRetailSku?.revenue || 0)}
                    </span>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Rata-Rata Margin Ritel</span>
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className={`text-xl font-bold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    {retailExecutiveAnalytics.avgMarginPct}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Total Unit Terjual: <span className="font-mono font-semibold">{retailExecutiveAnalytics.retailUnitsSold} pcs</span>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  retailExecutiveAnalytics.lowStockCount + retailExecutiveAnalytics.outOfStockCount > 0
                    ? isDark ? 'bg-amber-950/30 border-amber-500/40' : 'bg-amber-50/60 border-amber-300'
                    : isDark ? 'bg-slate-950/70 border-emerald-500/30' : 'bg-emerald-50/40 border-emerald-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-300">Peringatan Stok Rendah</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className={`text-xl font-bold font-mono ${
                    retailExecutiveAnalytics.lowStockCount + retailExecutiveAnalytics.outOfStockCount > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    {retailExecutiveAnalytics.lowStockCount + retailExecutiveAnalytics.outOfStockCount} SKU
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {retailExecutiveAnalytics.outOfStockCount} Habis • {retailExecutiveAnalytics.lowStockCount} Menipis
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/70 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Valuasi Katalog Ritel</span>
                    <PackageCheck className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className={`text-base font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatRupiah(retailExecutiveAnalytics.totalRetailValuation)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {retailExecutiveAnalytics.totalSkus} SKU Terdaftar ({activeModelDef.shortLabel})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Kontrol Alokasi Modal & Kas */}
          <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
            isDark ? 'bg-slate-900/40 border-cyan-500/35 backdrop-blur-xl shadow-[0_0_16px_rgba(6,182,212,0.1)]' : 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-white/[0.06]">
              <div>
                <h2 className={`text-base leading-6 font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <SlidersHorizontal className="w-4 h-4 text-cyan-500" />
                  Alokasi Kas & Pagu Anggaran Operasional
                </h2>
                <p className={`text-xs mt-0.5 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Tentukan persentase alokasi dana kas operasional untuk pelunasan hutang, gaji, dan restock.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveTreasurySplit}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer active:scale-[0.99] ${
                  isTreasuryLocked
                    ? isDark ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-rose-100 text-rose-800 border border-rose-300'
                    : isDark ? 'bg-cyan-600 text-white hover:bg-cyan-500' : 'bg-cyan-600 text-white hover:bg-cyan-700'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isTreasuryLocked ? 'Buka Pagu' : 'Kunci Pagu'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-3.5 rounded-xl border transition-all ${
                isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className={activeSliderTrack === 'ap' ? (isDark ? 'text-amber-300 font-bold' : 'text-amber-800 font-bold') : 'text-amber-600'}>
                    Pagu Hutang Vendor (AP)
                  </span>
                  <span className="font-mono">{treasurySplit.ap}%</span>
                </div>
                <div className="text-base font-bold font-mono text-amber-500">
                  {formatRupiah((kasOperasional * treasurySplit.ap) / 100)}
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  disabled={isTreasuryLocked}
                  value={treasurySplit.ap}
                  onChange={(e) => setTreasurySplit({ ...treasurySplit, ap: Number(e.target.value) })}
                  className="w-full mt-2 accent-amber-500 cursor-pointer disabled:opacity-40"
                />
              </div>

              <div className={`p-3.5 rounded-xl border transition-all ${
                isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className={activeSliderTrack === 'payroll' ? (isDark ? 'text-purple-300 font-bold' : 'text-purple-800 font-bold') : 'text-purple-600'}>
                    Cadangan Gaji & OPEX
                  </span>
                  <span className="font-mono">{treasurySplit.payroll}%</span>
                </div>
                <div className="text-base font-bold font-mono text-purple-500">
                  {formatRupiah((kasOperasional * treasurySplit.payroll) / 100)}
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  disabled={isTreasuryLocked}
                  value={treasurySplit.payroll}
                  onChange={(e) => setTreasurySplit({ ...treasurySplit, payroll: Number(e.target.value) })}
                  className="w-full mt-2 accent-purple-500 cursor-pointer disabled:opacity-40"
                />
              </div>

              <div className={`p-3.5 rounded-xl border transition-all ${
                isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className={activeSliderTrack === 'restock' ? (isDark ? 'text-emerald-300 font-bold' : 'text-emerald-800 font-bold') : 'text-emerald-600'}>
                    Plafon Pengadaan Restock
                  </span>
                  <span className="font-mono">{treasurySplit.restock}%</span>
                </div>
                <div className="text-base font-bold font-mono text-emerald-500">
                  {formatRupiah((kasOperasional * treasurySplit.restock) / 100)}
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  disabled={isTreasuryLocked}
                  value={treasurySplit.restock}
                  onChange={(e) => setTreasurySplit({ ...treasurySplit, restock: Number(e.target.value) })}
                  className="w-full mt-2 accent-emerald-500 cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>
          </div>

          {/* Tren 7 Hari & Evaluasi 6 Divisi */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-2 p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900/40 border-white/[0.06] backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <Activity className="w-4 h-4 text-cyan-500" />
                    Tren Kecepatan Finansial (7 Hari Terakhir)
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Pergerakan omzet harian berdasarkan transaksi kasir
                  </p>
                </div>
                <div className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border ${
                  isDark ? 'bg-white/[0.02] border-white/[0.06] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  Rata-rata: <span className={isDark ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold'}>{formatRupiah(Math.round(sum7Days / 7))}</span>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <div className="min-w-[500px] h-48 relative pt-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 700 160">
                    <defs>
                      <linearGradient id="cyanHairlineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={isDark ? 0.35 : 0.25} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {[30, 65, 100, 135].map((y, idx) => (
                      <line key={idx} x1="30" y1={y} x2="670" y2={y} stroke={isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'} strokeWidth="1" />
                    ))}

                    <path
                      d={`M 50 130 ${last7DaysData.map((val, i) => `L ${50 + i * 100} ${getYCoord(val)}`).join(' ')} L 650 130 Z`}
                      fill="url(#cyanHairlineGrad)"
                    />

                    <path
                      d={`M 50 ${getYCoord(last7DaysData[0])} ${last7DaysData.map((val, i) => `L ${50 + i * 100} ${getYCoord(val)}`).join(' ')}`}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className={isDark ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : ''}
                    />

                    {last7DaysData.map((val, i) => {
                      const x = 50 + i * 100;
                      const y = getYCoord(val);
                      return (
                        <g key={i} className="group cursor-pointer">
                          <circle cx={x} cy={y} r="5" fill="#06b6d4" className="transition-all group-hover:r-7" />
                          <circle cx={x} cy={y} r="10" fill="#06b6d4" opacity={isDark ? 0.3 : 0.15} className="animate-pulse" />
                          <text x={x} y={y - 12} textAnchor="middle" fill={isDark ? '#e2e8f0' : '#0f172a'} fontSize="10" fontWeight="bold" className="font-mono">
                            {(val / 1000000).toFixed(1)}M
                          </text>
                          <text x={x} y="150" textAnchor="middle" fill={isDark ? '#64748b' : '#94a3b8'} fontSize="10" fontWeight="bold">
                            {dayLabels[i]}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900/40 border-white/[0.06] backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <Sliders className="w-4 h-4 text-cyan-500" />
                    Kesehatan 6 Divisi
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Klik baris untuk menyorot</p>
                </div>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                  isDark ? 'bg-white/[0.02] border-white/[0.06] text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  Target: 90%
                </span>
              </div>

              <div className="space-y-1">
                {divisionStats.map((div, idx) => {
                  const isSelected = selectedDivisionIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDivisionIndex(isSelected ? null : idx)}
                      className={`px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-between ${
                        isSelected
                          ? isDark
                            ? 'bg-cyan-500/[0.12] border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                            : 'bg-cyan-50 border border-cyan-300 shadow-sm shadow-cyan-100'
                          : isDark
                          ? 'hover:bg-white/[0.02] border border-transparent'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full transition-all ${
                          div.score >= 90
                            ? isDark ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-emerald-500 shadow-sm shadow-emerald-200'
                            : div.score >= 70
                            ? isDark ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-cyan-500 shadow-sm shadow-cyan-200'
                            : isDark ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'bg-amber-500 shadow-sm shadow-amber-200'
                        } ${isSelected ? 'scale-125' : ''}`} />
                        <span className={`text-xs font-semibold ${
                          isSelected ? (isDark ? 'text-white font-bold' : 'text-cyan-950 font-bold') : (isDark ? 'text-slate-200' : 'text-slate-800')
                        }`}>
                          {div.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {div.status}
                        </span>
                        <span className={`text-sm font-bold font-mono transition-all ${
                          div.score >= 90 
                            ? isDark ? 'text-emerald-400' : 'text-emerald-700' 
                            : div.score >= 70 
                            ? isDark ? 'text-cyan-400' : 'text-cyan-700' 
                            : isDark ? 'text-amber-400' : 'text-amber-700'
                        } ${isSelected ? (isDark ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] scale-105' : 'scale-105') : ''}`}>
                          {div.score}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interaktif Financial Capital Flow */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/40 border-white/[0.06] backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 mb-4 ${
              isDark ? 'border-white/[0.06]' : 'border-slate-200'
            }`}>
              <div>
                <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Alur Modal Finansial Riil (Buku Besar)
                </h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Klik tahapan alur untuk menyalakan sorotan dan memeriksa rincian transaksi
                </p>
              </div>
              <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                Margin Bersih: {totalOmzet > 0 ? ((calculatedNetProfit / totalOmzet) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { id: 'revenue', tag: 'Stage 1', label: 'Pendapatan Kotor', amount: formatRupiah(totalOmzet), sub: `${totalStruk} struk sukses`, color: 'emerald' },
                { id: 'cogs', tag: 'Stage 2', label: 'Beban HPP Riil', amount: formatRupiah(calculatedCOGS), sub: 'Biaya pokok item terjual', color: 'rose' },
                { id: 'opex', tag: 'Stage 3', label: 'Beban OPEX & Gaji', amount: formatRupiah(calculatedOPEX), sub: 'Buku kas & payroll', color: 'amber' },
                { id: 'netprofit', tag: 'Stage 4', label: 'Laba Bersih Riil', amount: formatRupiah(calculatedNetProfit), sub: 'Hasil bersih operasional', color: 'cyan' },
                { id: 'cashinflow', tag: 'Stage 5', label: 'Saldo Kas Riil', amount: formatRupiah(kasOperasional), sub: 'Kas & bank cair aktif', color: 'purple' },
              ].map((stage) => {
                const isSelected = selectedFlowStage === stage.id;
                return (
                  <div
                    key={stage.id}
                    onClick={() => setSelectedFlowStage(isSelected ? null : (stage.id as any))}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 group ${
                      isSelected
                        ? isDark
                          ? stage.color === 'emerald'
                            ? 'bg-emerald-500/[0.12] border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.35)] scale-[1.02]'
                            : stage.color === 'rose'
                            ? 'bg-rose-500/[0.12] border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.35)] scale-[1.02]'
                            : stage.color === 'amber'
                            ? 'bg-amber-500/[0.12] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-[1.02]'
                            : stage.color === 'cyan'
                            ? 'bg-cyan-500/[0.12] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] scale-[1.02]'
                            : 'bg-purple-500/[0.12] border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.35)] scale-[1.02]'
                          : stage.color === 'emerald'
                          ? 'bg-emerald-50 border-emerald-400 shadow-md shadow-emerald-100 scale-[1.02]'
                          : stage.color === 'rose'
                          ? 'bg-rose-50 border-rose-400 shadow-md shadow-rose-100 scale-[1.02]'
                          : stage.color === 'amber'
                          ? 'bg-amber-50 border-amber-400 shadow-md shadow-amber-100 scale-[1.02]'
                          : stage.color === 'cyan'
                          ? 'bg-cyan-50 border-cyan-400 shadow-md shadow-cyan-100 scale-[1.02]'
                          : 'bg-purple-50 border-purple-400 shadow-md shadow-purple-100 scale-[1.02]'
                        : isDark
                        ? 'bg-white/[0.02] border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04]'
                        : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                      <span>{stage.tag}</span>
                      <ArrowRight className={`w-3 h-3 transition-all ${
                        isSelected ? (isDark ? 'opacity-100 translate-x-1 text-cyan-400' : 'opacity-100 translate-x-1 text-cyan-700') : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                      }`} />
                    </div>
                    <div className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {stage.label}
                    </div>
                    <div className={`text-base font-bold font-mono tracking-tight mt-1 transition-all ${
                      stage.color === 'emerald' ? (isDark ? 'text-emerald-400' : 'text-emerald-700') :
                      stage.color === 'rose' ? (isDark ? 'text-rose-400' : 'text-rose-700') :
                      stage.color === 'amber' ? (isDark ? 'text-amber-400' : 'text-amber-700') :
                      stage.color === 'cyan' ? (isDark ? 'text-cyan-400' : 'text-cyan-700') : (isDark ? 'text-purple-400' : 'text-purple-700')
                    } ${isSelected && isDark ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]' : ''}`}>
                      {stage.amount}
                    </div>
                    <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      {stage.sub}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2B: LOGISTIK ARMADA, SURAT JALAN (DO) & SUSUT CURAH (BUILDING_BULK) */}
      {activeTab === 'logistics_shrinkage' && isBuildingBulkActive && (
        <div className="space-y-5">
          {/* Panel Atas: Monitor Status Muat Armada & Surat Jalan (DO) */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-slate-900/40 border-amber-500/35 backdrop-blur-xl' : 'bg-white border-amber-500/60 shadow-sm'
          }`}>
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${
              isDark ? 'border-white/[0.06]' : 'border-slate-200'
            }`}>
              <div>
                <h2 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Truck className="w-4 h-4 text-amber-500" />
                  Logistik Armada, Surat Jalan (DO) &amp; Susut Curah (m³ / Ret)
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Pemantauan status muat armada proyek secara real-time dari POS Depo dan kontrol selisih susut material curah.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {([
                  { id: 'ALL', label: 'Semua DO' },
                  { id: 'MENUNGGU_MUAT', label: 'Menunggu Muat' },
                  { id: 'DALAM_PENGIRIMAN', label: 'Dalam Pengiriman' },
                  { id: 'TERKIRIM_PROYEK', label: 'Terkirim ke Proyek' },
                ] as const).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setExecDoStatusFilter(st.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer transition ${
                      execDoStatusFilter === st.id
                        ? 'bg-amber-600 text-white border-amber-500'
                        : isDark
                        ? 'bg-slate-900 border-white/[0.08] text-slate-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Menunggu Muat</span>
                <span className={`text-lg font-bold font-mono ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                  {buildingBulkAnalytics.waitingLoadCount} Armada
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'}`}>
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Dalam Pengiriman</span>
                <span className={`text-lg font-bold font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-900'}`}>
                  {buildingBulkAnalytics.inTransitCount} Armada
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Terkirim ke Proyek</span>
                <span className={`text-lg font-bold font-mono ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>
                  {buildingBulkAnalytics.deliveredCount} Armada
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50 border-rose-200'}`}>
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Beban Susut Curah</span>
                <span className={`text-lg font-bold font-mono ${isDark ? 'text-rose-300' : 'text-rose-800'}`}>
                  {formatRupiah(buildingBulkAnalytics.totalShrinkageLossValue)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.08]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-mono uppercase tracking-wider ${
                    isDark ? 'bg-white/[0.02] text-slate-400 border-white/[0.06]' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    <th className="py-2.5 px-3">Surat Jalan (DO)</th>
                    <th className="py-2.5 px-3">Kontraktor &amp; Lokasi</th>
                    <th className="py-2.5 px-3">Armada &amp; Kubikasi</th>
                    <th className="py-2.5 px-3">Ringkasan Material</th>
                    <th className="py-2.5 px-3 text-center">Status Muat</th>
                    <th className="py-2.5 px-3 text-right">Intervensi Direksi / Gudang</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/[0.05] text-slate-200' : 'divide-slate-200 text-slate-800'}`}>
                  {(buildingDeliveryOrders || [])
                    .filter((d: any) => execDoStatusFilter === 'ALL' || d.status === execDoStatusFilter)
                    .map((d: any) => (
                      <tr key={d.id}>
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                          <div className={`font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>{d.doNumber}</div>
                          <div className="text-[10px] text-slate-500">{d.deliveryPolicy} • {new Date(d.date).toLocaleDateString('id-ID')}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold">{d.customerName}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{d.destination}</div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div>{d.fleetVehicleName || d.fleetType}</div>
                          <div className="text-[10px] font-mono text-slate-500">Est. {d.estimatedVolumeM3} m³</div>
                        </td>
                        <td className="py-2.5 px-3 max-w-[220px]">
                          <div className="truncate">{d.itemsSummary}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            d.status === 'TERKIRIM_PROYEK'
                              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                              : d.status === 'DALAM_PENGIRIMAN'
                              ? 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30'
                              : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                          }`}>
                            {d.status === 'MENUNGGU_MUAT'
                              ? 'MENUNGGU MUAT'
                              : d.status === 'DALAM_PENGIRIMAN'
                              ? 'DALAM PENGIRIMAN'
                              : 'TERKIRIM KE PROYEK'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {d.status === 'MENUNGGU_MUAT' && (
                            <button
                              type="button"
                              onClick={() => updateBuildingDeliveryStatus && updateBuildingDeliveryStatus(d.id, 'DALAM_PENGIRIMAN')}
                              className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-medium cursor-pointer"
                            >
                              Berangkat Kirim
                            </button>
                          )}
                          {d.status === 'DALAM_PENGIRIMAN' && (
                            <button
                              type="button"
                              onClick={() => updateBuildingDeliveryStatus && updateBuildingDeliveryStatus(d.id, 'TERKIRIM_PROYEK')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium cursor-pointer"
                            >
                              Tandai Terkirim
                            </button>
                          )}
                          {d.status === 'TERKIRIM_PROYEK' && (
                            <span className="text-[11px] font-mono text-emerald-500">✓ Selesai Terkirim</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panel Bawah: Pencatatan & Audit Susut Material Curah (Pasir / Batu Pecah / Kayu) */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-slate-900/40 border-white/[0.08] backdrop-blur-xl' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Scale className="w-4 h-4 text-rose-500" />
                  Audit &amp; Pencatatan Selisih Susut Material Curah (Pasir / Batu Pecah / Kayu)
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Sinkron langsung dengan kartu stok gudang dan jurnal beban susut curah.
                </p>
              </div>
              <span className="text-xs font-mono text-rose-500 font-semibold">
                {(bulkShrinkageLogs || []).length} Catatan Susut
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Material Curah / Kayu</label>
                <select
                  value={execShrinkProductId}
                  onChange={(e) => setExecShrinkProductId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-slate-950 border-white/[0.1] text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {buildingBulkAnalytics.catalog.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Stok: {m.stock} {m.unit || 'm³'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Selisih Susut</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={execShrinkQty}
                  onChange={(e) => setExecShrinkQty(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-mono outline-none ${
                    isDark ? 'bg-slate-950 border-white/[0.1] text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div className="md:col-span-4">
                <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Alasan / Temuan Yard</label>
                <input
                  type="text"
                  value={execShrinkReason}
                  onChange={(e) => setExecShrinkReason(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-slate-950 border-white/[0.1] text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => {
                    const mat = buildingBulkAnalytics.catalog.find((m: any) => m.id === execShrinkProductId);
                    const qty = Number(execShrinkQty) || 0;
                    if (!mat || qty <= 0) {
                      if (showToast) showToast('Masukkan jumlah susut yang valid (> 0)', 'warning');
                      return;
                    }
                    if (recordBulkShrinkage) {
                      recordBulkShrinkage({
                        productId: mat.id,
                        productName: mat.name,
                        unit: mat.unit || 'm³',
                        costPrice: Number(mat.costPrice ?? mat.cost_price ?? mat.buy_price) || 0,
                        currentStock: Number(mat.stock) || 0,
                        shrinkageQty: qty,
                        reason: execShrinkReason || 'Audit susut material curah Executive',
                      });
                    }
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Catat Susut
                </button>
              </div>
            </div>

            {(bulkShrinkageLogs || []).length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.08]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] font-mono uppercase ${
                      isDark ? 'bg-white/[0.02] text-slate-400 border-white/[0.06]' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      <th className="py-2 px-3">Tanggal</th>
                      <th className="py-2 px-3">Material Curah</th>
                      <th className="py-2 px-3 text-right">Stok Sistem → Fisik</th>
                      <th className="py-2 px-3 text-right">Susut</th>
                      <th className="py-2 px-3 text-right">Beban HPP</th>
                      <th className="py-2 px-3">Catatan Yard</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
                    {(bulkShrinkageLogs || []).map((log: any) => (
                      <tr key={log.id}>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                          {new Date(log.date).toLocaleDateString('id-ID')}
                        </td>
                        <td className={`py-2 px-3 font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{log.productName}</td>
                        <td className="py-2 px-3 text-right font-mono">
                          {log.systemQty} → {log.physicalQty} {log.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-500">
                          -{log.shrinkageQty} {log.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-amber-500">
                          {formatRupiah(log.costValueLoss)}
                        </td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-[240px]">{log.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ALERT KADALUARSA */}
      {activeTab === 'expiry' && (
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/40 border-white/[0.06] backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 mb-4 ${
            isDark ? 'border-white/[0.06]' : 'border-slate-200'
          }`}>
            <div>
              <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                {businessVertical === 'FNB' ? 'Monitoring Bahan Baku Rusak / Spoilage (<= 7 Hari)' :
                 'Monitoring Inventori Dekat Kadaluarsa (<= 7 Hari)'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Daftar persediaan mendekati batas kedaluwarsa dihitung otomatis dari tanggal hari ini
              </p>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${
              isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {expiryAlertsReal.length} Item Kritis
            </span>
          </div>

          {expiryAlertsReal.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {businessVertical === 'FNB' ? 'Seluruh stok bahan dapur dalam kondisi segar dan layak olah.' :
                 'Tidak ada stok produk yang berisiko kadaluarsa dalam 7 hari ke depan.'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Seluruh stok inventori dalam kondisi aman.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${
                    isDark ? 'border-white/[0.06]' : 'border-slate-200'
                  }`}>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Nama Barang</th>
                    <th className="py-2.5 px-3">No. Batch</th>
                    <th className="py-2.5 px-3 text-center">Sisa Hari</th>
                    <th className="py-2.5 px-3 text-right">Stok</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Aksi Direksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
                  {expiryAlertsReal.map((item, idx) => (
                    <tr key={idx} className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                      <td className={`py-3 px-3 font-mono font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{item.sku}</td>
                      <td className={`py-3 px-3 font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{item.batch}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-rose-500">{item.daysLeft} Hari</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold">{item.stock} Unit</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isDark ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          KRITIS
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => showToast && showToast(`Tindakan aktif untuk SKU ${item.sku}. Terintegrasi ke modul kasir.`)}
                          className={`px-2.5 py-1 text-white rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                            isDark 
                              ? 'bg-rose-600 hover:bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' 
                              : 'bg-rose-600 hover:bg-rose-700 shadow-sm'
                          }`}
                        >
                          {item.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PEAK TRAFFIC & INTERVENSI JAM */}
      {activeTab === 'traffic' && (
        <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
          isDark ? 'bg-slate-900/40 border-white/[0.06] backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-white/[0.06]' : 'border-slate-200'
          }`}>
            <div>
              <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <BarChart3 className="w-4 h-4 text-cyan-500" />
                {businessVertical === 'FNB' ? 'Matriks Jam Ramai Restoran & Deteksi Anomali' : 'Matriks Jam Transaksi Riil & Deteksi Anomali'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Klik batang jam: batang terpilih akan menyala dan membuka laci inspeksi transaksi
              </p>
            </div>
            <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
              isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
            }`}>
              Aktual POS
            </span>
          </div>

          <div className="pt-4">
            <div className={`flex items-end gap-2.5 h-48 px-2 overflow-x-auto border-b ${
              isDark ? 'border-white/[0.06]' : 'border-slate-200'
            }`}>
              {hourlyTrafficData.map((h, idx) => {
                const heightPercent = h.txCount === 0 ? 5 : Math.max(12, Math.round((h.txCount / maxHourlyCount) * 100));
                const isSelected = selectedHour === h.hour;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedHour(isSelected ? null : h.hour);
                      setSelectedHourlyAudit(h);
                    }}
                    className={`flex-1 min-w-[38px] flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-300 group ${
                      selectedHour !== null && !isSelected ? 'opacity-35' : 'opacity-100'
                    }`}
                  >
                    <div className={`text-[10px] font-mono transition-opacity ${
                      isSelected 
                        ? isDark ? 'opacity-100 text-cyan-300 font-bold drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]' : 'opacity-100 text-cyan-800 font-bold' 
                        : 'text-slate-500 opacity-0 group-hover:opacity-100'
                    }`}>
                      {h.txCount}
                    </div>

                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        isSelected
                          ? h.hasAnomaly
                            ? isDark
                              ? 'bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.9),0_0_8px_rgba(255,255,255,0.8)] scale-y-105'
                              : 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-y-105'
                            : isDark
                              ? 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.9),0_0_8px_rgba(255,255,255,0.8)] scale-y-105'
                              : 'bg-cyan-600 shadow-[0_0_12px_rgba(8,145,178,0.6)] scale-y-105'
                          : h.txCount === 0
                          ? isDark ? 'bg-slate-700/30' : 'bg-slate-200/80'
                          : h.hasAnomaly
                          ? isDark 
                            ? 'bg-amber-400/80 group-hover:bg-amber-300 group-hover:shadow-[0_0_12px_rgba(251,191,36,0.6)]' 
                            : 'bg-amber-500/80 group-hover:bg-amber-600'
                          : isDark 
                            ? 'bg-cyan-500/80 group-hover:bg-cyan-400 group-hover:shadow-[0_0_12px_rgba(6,182,212,0.6)]' 
                            : 'bg-cyan-600/80 group-hover:bg-cyan-700'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <div className={`text-[10px] font-mono py-1.5 transition-colors ${
                      isSelected 
                        ? isDark ? 'text-cyan-400 font-bold' : 'text-cyan-800 font-bold' 
                        : 'text-slate-500'
                    }`}>
                      {h.label.split(':')[0]}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded ${isDark ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-cyan-600 shadow-sm'}`}></span>
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Transaksi Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded ${isDark ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-amber-500 shadow-sm'}`}></span>
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Terdapat Void / Anomali</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded ${isDark ? 'bg-slate-700/40' : 'bg-slate-300'}`}></span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Belum Ada Transaksi</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OTORISASI PR & PO */}
      {activeTab === 'approval' && (
        <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
          isDark ? 'bg-slate-900/40 border-amber-500/40 backdrop-blur-xl shadow-[0_0_16px_rgba(245,158,11,0.12)]' : 'bg-white border-amber-500/70 shadow-[0_0_16px_rgba(245,158,11,0.18)]'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-white/[0.06]' : 'border-slate-200'
          }`}>
            <div>
              <h2 className={`text-base leading-6 font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <FileCheck className="w-4 h-4 text-amber-500" />
                Otorisasi Pengadaan (PR &amp; PO Pending Direksi)
              </h2>
              <p className={`text-xs mt-0.5 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Daftar persetujuan dokumen pengadaan barang dan anggaran
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-normal border ${
              isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>{pendingPRs.length} Menunggu Approval</span>
            </span>
          </div>

          {pendingPRs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Seluruh PR &amp; PO telah diotorisasi.
              </p>
              <p className="text-xs text-slate-500 font-normal mt-0.5">Tidak ada antrean dokumen tertunda saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingPRs.map((pr: any, idx: number) => {
                const docNo = pr.requestNumber || pr.po_number || pr.id || `PR-2026-00${idx + 1}`;
                const requester = pr.requesterName || pr.requestedBy || pr.supplier_name || 'Staff Logistik';
                const totalAmt = pr.totalEstimatedCost || pr.totalAmount || pr.estimatedTotal || pr.total_amount || 0;
                const purpose = pr.notes || pr.purpose || 'Pengadaan Inventori Restock';

                return (
                  <div key={idx} className={`p-4 rounded-xl border transition-all hover:-translate-y-0.5 space-y-3 ${
                    isDark 
                      ? 'bg-white/[0.02] border-white/[0.06] hover:border-amber-400/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                      : 'bg-white border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`text-[11px] font-mono font-medium ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                          {docNo}
                        </span>
                        <h3 className={`text-sm font-medium mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {purpose}
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono font-normal text-slate-500">
                        {pr.createdAt ? new Date(pr.createdAt).toLocaleDateString('id-ID') : 'Hari ini'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500 font-normal">Pemohon: <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{requester}</span></span>
                      <span className={`font-mono font-semibold text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{formatRupiah(totalAmt)}</span>
                    </div>

                    <div className={`flex items-center gap-2 pt-1 border-t ${isDark ? 'border-white/[0.04]' : 'border-slate-100'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          if (approvePurchaseRequest && pr.requestNumber) approvePurchaseRequest(pr.id);
                          else if (approvePurchaseOrder && pr.po_number) approvePurchaseOrder(pr.id);

                          recordAudit({
                            traceId: `EXEC-APPROVE-${docNo}`,
                            userId: effectiveUser?.id || 'executive-cockpit',
                            userName: effectiveUser?.name || 'Direksi / Pimpinan',
                            userRole: effectiveUser?.role || 'Executive',
                            module: 'PURCHASING',
                            action: 'CONFIG_CHANGE',
                            severity: totalAmt > 20000000 ? 'CRITICAL' : 'INFO',
                            entityId: docNo,
                            payloadAfter: {
                              decision: 'APPROVED',
                              documentNumber: docNo,
                              totalAmount: totalAmt,
                            },
                          });

                          if (showToast) showToast(`Dokumen ${docNo} berhasil disetujui.`);
                        }}
                        className={`flex-1 py-1.5 text-white rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] ${
                          isDark 
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-xs'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (rejectPurchaseRequest && pr.requestNumber) rejectPurchaseRequest(pr.id, 'Ditolak Direksi');
                          else if (rejectPurchaseOrder && pr.po_number) rejectPurchaseOrder(pr.id, 'Ditolak Direksi');

                          recordAudit({
                            traceId: `EXEC-REJECT-${docNo}`,
                            userId: effectiveUser?.id || 'executive-cockpit',
                            userName: effectiveUser?.name || 'Direksi / Pimpinan',
                            userRole: effectiveUser?.role || 'Executive',
                            module: 'PURCHASING',
                            action: 'CONFIG_CHANGE',
                            severity: 'WARN',
                            entityId: docNo,
                            payloadAfter: {
                              decision: 'REJECTED',
                              reason: 'Ditolak Direksi',
                              documentNumber: docNo,
                            },
                          });

                          if (showToast) showToast(`Dokumen ${docNo} ditolak.`);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer active:scale-[0.99] ${
                          isDark ? 'border-white/[0.06] text-rose-400 hover:bg-rose-500/10' : 'border-slate-200 text-rose-700 hover:bg-rose-50'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Panel Khusus BUILDING_BULK: Otorisasi Plafon Kredit Kontraktor & Persetujuan Diskon Borongan / Ongkir Frangko */}
          {isBuildingBulkActive && (
            <div className={`pt-4 mt-2 border-t space-y-4 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                    <HardHat className="w-4 h-4 text-amber-500" />
                    Otorisasi Plafon Kredit Kontraktor &amp; Persetujuan Diskon Borongan / Ongkir Frangko
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Pengajuan khusus Depo Material dari kasir proyek maupun tim sales kontraktor di samping persetujuan PO supplier material.
                  </p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${
                  isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-800 border-purple-200'
                }`}>
                  {pendingBuildingAuthList.length} Pengajuan Menunggu
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(buildingAuthRequests || []).map((req: any) => {
                  const isPlafon = req.type === 'PLAFON_KREDIT_KONTRAKTOR';
                  const isPending = req.status === 'PENDING';
                  return (
                    <div
                      key={req.id}
                      className={`p-4 rounded-xl border space-y-3 transition-all ${
                        isDark
                          ? 'bg-white/[0.02] border-white/[0.08]'
                          : 'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                              isPlafon
                                ? isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-800 border-purple-300'
                                : isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {isPlafon ? 'PLAFON KREDIT KONTRAKTOR' : 'DISKON BORONGAN / FRANGKO'}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">{req.requestNumber}</span>
                          </div>
                          <h4 className={`text-sm font-semibold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {req.contractorName}
                          </h4>
                          <p className="text-[11px] text-slate-500">{req.projectTitle}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-500'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-500'
                            : 'bg-amber-500/20 text-amber-500'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      {isPlafon ? (
                        <div className={`p-2.5 rounded-lg border text-xs grid grid-cols-3 gap-2 ${
                          isDark ? 'bg-slate-950/60 border-white/[0.06]' : 'bg-white border-slate-200'
                        }`}>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Plafon Saat Ini</span>
                            <span className="font-mono font-semibold">{formatRupiah(req.currentCreditLimit || 0)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Ajuan Plafon Baru</span>
                            <span className="font-mono font-bold text-purple-500">{formatRupiah(req.requestedCreditLimit || 0)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Piutang Berjalan</span>
                            <span className="font-mono font-semibold text-amber-500">{formatRupiah(req.outstandingBalance || 0)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className={`p-2.5 rounded-lg border text-xs grid grid-cols-3 gap-2 ${
                          isDark ? 'bg-slate-950/60 border-white/[0.06]' : 'bg-white border-slate-200'
                        }`}>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Nilai Order Borongan</span>
                            <span className="font-mono font-semibold">{formatRupiah(req.orderSubtotal || 0)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Diskon ({req.requestedDiscountPercent || 0}%)</span>
                            <span className="font-mono font-bold text-amber-500">{formatRupiah(req.requestedDiscountAmount || 0)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Subsidi Frangko</span>
                            <span className="font-mono font-semibold text-cyan-500">{formatRupiah(req.frangkoFeeWaived || 0)}</span>
                          </div>
                        </div>
                      )}

                      <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {req.reason}
                      </p>

                      {isPending ? (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (approveBuildingAuthRequest) approveBuildingAuthRequest(req.id);
                              recordAudit({
                                traceId: `EXEC-BAUTH-APP-${req.requestNumber}`,
                                userId: effectiveUser?.id || 'executive-cockpit',
                                userName: effectiveUser?.name || 'Direksi / Pimpinan',
                                userRole: effectiveUser?.role || 'Executive',
                                module: 'EXECUTIVE',
                                action: 'CONFIG_CHANGE',
                                severity: 'INFO',
                                entityId: req.requestNumber,
                                payloadAfter: { decision: 'APPROVED', type: req.type, contractor: req.contractorName },
                              });
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isPlafon ? 'Setujui Plafon' : 'Setujui Borongan / Frangko'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (rejectBuildingAuthRequest) rejectBuildingAuthRequest(req.id, 'Ditolak Direksi');
                              recordAudit({
                                traceId: `EXEC-BAUTH-REJ-${req.requestNumber}`,
                                userId: effectiveUser?.id || 'executive-cockpit',
                                userName: effectiveUser?.name || 'Direksi / Pimpinan',
                                userRole: effectiveUser?.role || 'Executive',
                                module: 'EXECUTIVE',
                                action: 'CONFIG_CHANGE',
                                severity: 'WARN',
                                entityId: req.requestNumber,
                                payloadAfter: { decision: 'REJECTED', type: req.type, contractor: req.contractorName },
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                              isDark ? 'border-white/[0.08] text-rose-400 hover:bg-rose-500/10' : 'border-slate-300 text-rose-700 hover:bg-rose-50'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-slate-500">
                          Keputusan oleh {req.reviewedBy || 'Direksi'} • {req.reviewNote || req.status}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUDIT KASIR & MATRIKS KUADRAN SKU */}
      {activeTab === 'fraud' && (
        <div className="space-y-6">
          <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
            isDark ? 'bg-slate-900/40 border-white/[0.06] backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-white/[0.06]' : 'border-slate-200'
            }`}>
              <div>
                <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <PieChart className="w-4 h-4 text-purple-500" />
                  {businessVertical === 'FNB' ? 'Matriks Portofolio Menu (Margin vs Pemesanan Tamu)' :
                   businessVertical === 'FASHION' ? 'Matriks Varian Pakaian (Margin vs Volume Penjualan)' :
                   'Matriks Portofolio SKU Riil (Margin vs Penjualan POS)'}
                </h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Penjualan dihitung murni dari struk transaksi selesai. Klik produk untuk rincian strategi
                </p>
              </div>
              <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}>
                {skuQuadrantList.length} Item Dipetakan
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: '★ Bintang (Star)', desc: 'Laku tinggi (>= 10) & margin >= 20%', quadrant: 'star', color: 'emerald' },
                { title: '⚙ Kuda Beban (Workhorse)', desc: 'Laku tinggi (>= 10) & margin < 20%', quadrant: 'workhorse', color: 'cyan' },
                { title: '💡 Peluang (Opportunity)', desc: 'Laku rendah (< 10) & margin >= 20%', quadrant: 'opportunity', color: 'amber' },
                { title: '⚠ Deadstock / Anomali', desc: 'Laku rendah (< 10) & margin < 20%', quadrant: 'deadstock', color: 'rose' },
              ].map((q) => {
                const itemsInQuadrant = skuQuadrantList.filter(s => s.quadrant === q.quadrant);
                return (
                  <div key={q.quadrant} className={`p-4 rounded-xl border ${
                    isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${
                        q.color === 'emerald' ? (isDark ? 'text-emerald-400' : 'text-emerald-700') :
                        q.color === 'cyan' ? (isDark ? 'text-cyan-400' : 'text-cyan-700') :
                        q.color === 'amber' ? (isDark ? 'text-amber-400' : 'text-amber-700') : (isDark ? 'text-rose-400' : 'text-rose-700')
                      }`}>
                        {q.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{itemsInQuadrant.length} Item</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-2 max-h-40 overflow-y-auto">
                      {itemsInQuadrant.length === 0 ? (
                        <span className="text-[11px] text-slate-500 italic">Belum ada item di kuadran ini.</span>
                      ) : (
                        itemsInQuadrant.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedSKUDetails(s)}
                            className={`px-2 py-1 rounded text-[11px] font-mono transition-all border flex items-center gap-1.5 cursor-pointer ${
                              isDark
                                ? 'bg-slate-900 border-white/[0.08] text-slate-300 hover:text-white hover:border-cyan-400 hover:shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-cyan-400 hover:bg-cyan-50/50 shadow-sm'
                            }`}
                          >
                            <span>{s.product.name}</span>
                            <span className="text-[10px] opacity-60">({s.soldQty} laku)</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
            isDark ? 'bg-slate-900/40 border-white/[0.06] backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Temuan Audit Kasir & Tindakan Intervensi Langsung
            </h2>

            {voidItemLogs && voidItemLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${
                      isDark ? 'border-white/[0.06]' : 'border-slate-200'
                    }`}>
                      <th className="py-2.5 px-3">Waktu</th>
                      <th className="py-2.5 px-3">Kasir / POS</th>
                      <th className="py-2.5 px-3">Item Void</th>
                      <th className="py-2.5 px-3">Alasan</th>
                      <th className="py-2.5 px-3 text-center">Status Operator</th>
                      <th className="py-2.5 px-3 text-right">Intervensi Direksi</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
                    {voidItemLogs.map((log: any, idx: number) => {
                      const cashierName = log.cashierName || log.cashier || 'Kasir On-Duty';
                      const isFrozen = frozenCashiers.includes(cashierName);
                      const isLockedVoid = lockedVoidCashiers.includes(cashierName);

                      return (
                        <tr key={idx} className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                          <td className="py-3 px-3 font-mono text-slate-500">
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('id-ID') : '-'}
                          </td>
                          <td className={`py-3 px-3 font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {cashierName}
                          </td>
                          <td className={`py-3 px-3 font-semibold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                            {log.itemName || log.item || 'Item Terhapus'}
                          </td>
                          <td className="py-3 px-3 text-slate-400">{log.reason || 'Koreksi Struk'}</td>
                          <td className="py-3 px-3 text-center">
                            {isFrozen ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isDark ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.3)]' : 'bg-rose-100 text-rose-800 border border-rose-200 shadow-sm'
                              }`}>
                                DIBEKUKAN
                              </span>
                            ) : isLockedVoid ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'bg-amber-100 text-amber-800 border border-amber-200 shadow-sm'
                              }`}>
                                VOID TERKUNCI
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}>
                                NORMAL
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleLockVoid(cashierName)}
                              className={`px-2 py-1 rounded text-[11px] font-medium transition-all border cursor-pointer ${
                                isLockedVoid
                                  ? isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'bg-amber-100 text-amber-900 border-amber-300'
                                  : isDark ? 'bg-white/[0.02] border-white/[0.08] text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {isLockedVoid ? 'Buka Limit' : 'Kunci Void Rp 0'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleFreezeCashier(cashierName)}
                              className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                                isFrozen
                                  ? isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                  : isDark ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                              }`}
                            >
                              {isFrozen ? 'Buka Sesi' : 'Bekukan Terminal'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 font-medium">
                Belum ada rekaman void atau anomali kasir pada sesi operasional berjalan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: ARUS KAS & AP AGING */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border transition-all hover:-translate-y-0.5 ${
              isDark ? 'bg-slate-900/40 border-cyan-500/35 backdrop-blur-xl shadow-[0_0_16px_rgba(6,182,212,0.1)]' : 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            }`}>
              <span className="text-[11px] font-mono font-normal text-slate-500 block mb-1 uppercase tracking-widest">Kas Operasional Liquid</span>
              <div className={`text-lg leading-7 font-semibold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                {formatRupiah(kasOperasional)}
              </div>
              <span className={`text-[11px] font-normal mt-2 block ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Saldo kas & bank aktif</span>
            </div>

            <div className={`p-5 rounded-2xl border transition-all hover:-translate-y-0.5 ${
              dueThisWeek > 0
                ? isDark
                  ? 'bg-slate-900/40 border-amber-500/40 backdrop-blur-xl shadow-[0_0_16px_rgba(245,158,11,0.12)]'
                  : 'bg-white border-amber-500/70 shadow-[0_0_16px_rgba(245,158,11,0.18)]'
                : isDark
                ? 'bg-slate-900/40 border-cyan-500/35 backdrop-blur-xl shadow-[0_0_16px_rgba(6,182,212,0.1)]'
                : 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono font-normal text-slate-500 block uppercase tracking-widest">Jatuh Tempo Mgg Ini</span>
                {dueThisWeek > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
              </div>
              <div className={`text-lg leading-7 font-semibold font-mono tracking-tight ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                {formatRupiah(dueThisWeek)}
              </div>
              <span className={`text-[11px] font-normal mt-2 block ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Tagihan vendor &le; 7 hari</span>
            </div>

            <div className={`p-5 rounded-2xl border transition-all hover:-translate-y-0.5 ${
              isDark ? 'bg-slate-900/40 border-cyan-500/35 backdrop-blur-xl shadow-[0_0_16px_rgba(6,182,212,0.1)]' : 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            }`}>
              <span className="text-[11px] font-mono font-normal text-slate-500 block mb-1 uppercase tracking-widest">Cash Runway Riil</span>
              <div className={`text-lg leading-7 font-semibold font-mono tracking-tight ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                {cashRunway}
              </div>
              <span className={`text-[11px] font-normal mt-2 block ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>Kecukupan kas vs OPEX</span>
            </div>

            <div className={`p-5 rounded-2xl border transition-all hover:-translate-y-0.5 ${
              isDark ? 'bg-slate-900/40 border-cyan-500/35 backdrop-blur-xl shadow-[0_0_16px_rgba(6,182,212,0.1)]' : 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
            }`}>
              <span className="text-[11px] font-mono font-normal text-slate-500 block mb-1 uppercase tracking-widest">Labor Cost Ratio</span>
              <div className={`text-lg leading-7 font-semibold font-mono tracking-tight ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                {laborCostRatio}%
              </div>
              <span className={`text-[11px] font-normal mt-2 block ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>Beban payroll terhadap omzet</span>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
            isDark ? 'bg-slate-900/40 border-cyan-500/35 backdrop-blur-xl shadow-[0_0_16px_rgba(6,182,212,0.1)]' : 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-white/[0.06]' : 'border-slate-200'
            }`}>
              <div>
                <h2 className={`text-base leading-6 font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <DollarSign className="w-4 h-4 text-cyan-500" />
                  Kewajiban Pembayaran Faktur Vendor (AP Aging)
                </h2>
                <p className={`text-xs mt-0.5 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Centang faktur untuk otorisasi pelunasan serentak
                </p>
              </div>
              <span className={`text-[11px] font-mono font-normal px-2.5 py-0.5 rounded-full border ${
                isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
              }`}>
                {combinedAPList.length} Faktur Tertunggak
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-mono font-normal uppercase tracking-widest text-slate-500 ${
                    isDark ? 'border-white/[0.06]' : 'border-slate-200'
                  }`}>
                    <th className="py-2.5 px-3 w-10 text-center">
                      <button type="button" onClick={toggleSelectAllAP} className="hover:text-cyan-500 transition-colors cursor-pointer active:scale-[0.99]">
                        {selectedAPIds.length === combinedAPList.length && combinedAPList.length > 0 ? (
                          <CheckSquare className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-2.5 px-3">Vendor / Supplier</th>
                    <th className="py-2.5 px-3">No. Faktur</th>
                    <th className="py-2.5 px-3 text-right">Nominal Tagihan</th>
                    <th className="py-2.5 px-3 text-center">Jatuh Tempo</th>
                    <th className="py-2.5 px-3 text-center">Sumber</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
                  {combinedAPList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-normal">
                        Tidak ada hutang faktur vendor yang tertunggak saat ini.
                      </td>
                    </tr>
                  ) : (
                    combinedAPList.map((item) => {
                      const isSelected = selectedAPIds.includes(item.id);
                      return (
                        <tr key={item.id} className={`transition-all duration-300 ${
                          isSelected
                            ? isDark
                              ? 'bg-cyan-500/[0.12]'
                              : 'bg-cyan-50/80 shadow-xs'
                            : isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'
                        }`}>
                          <td className="py-3 px-3 text-center">
                            <button type="button" onClick={() => toggleSelectAP(item.id)} className="cursor-pointer active:scale-[0.99]">
                              {isSelected ? (
                                <CheckSquare className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
                              ) : (
                                <Square className="w-4 h-4 text-slate-500" />
                              )}
                            </button>
                          </td>
                          <td className={`py-3 px-3 font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.vendor}</td>
                          <td className="py-3 px-3 font-mono text-cyan-500 font-normal">{item.invoiceNo}</td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-amber-500">{formatRupiah(item.amount)}</td>
                          <td className="py-3 px-3 text-center font-mono font-normal text-slate-400">{item.dueDate}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-normal ${
                              item.source === 'INVOICE'
                                ? isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                                : isDark ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-800 border border-purple-200'
                            }`}>
                              {item.source}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.source === 'INVOICE' && payVendorInvoice) payVendorInvoice(item.id);
                                else if (item.source === 'PO' && updatePurchaseOrderPayment) updatePurchaseOrderPayment(item.id, 'PAID');
                                if (showToast) showToast(`Faktur ${item.invoiceNo} disetujui & dilunasi.`);
                              }}
                              className={`px-2.5 py-1 text-white rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-[0.99] ${
                                isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-cyan-600 hover:bg-cyan-700 shadow-xs'
                              }`}
                            >
                              Bayar Now
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {selectedAPIds.length > 0 && (
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300' : 'bg-cyan-50 border-cyan-300 text-cyan-950'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-xs">{selectedAPIds.length} Faktur Terpilih</span>
                  <span className="text-xs font-mono font-semibold">Total: {formatRupiah(selectedAPTotalAmount)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleBatchAPPayment}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 active:scale-[0.99]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Otorisasi Pelunasan Batch
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: KINERJA CABANG & ROTASI */}
      {activeTab === 'branches' && isMultiBranch && (
        <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
          isDark ? 'bg-slate-900/40 border-white/[0.06] backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-white/[0.06]' : 'border-slate-200'
          }`}>
            <div>
              <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Building2 className="w-4 h-4 text-cyan-500" />
                Matriks Kinerja Multi-Cabang & Rebalancing Stok
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Pantau performa penjualan dan transfer stok antar-cabang secara langsung
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {realBranchPerformance.map((b) => (
              <div key={b.id} className={`p-4 rounded-xl border space-y-3 ${
                isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{b.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    b.rating === 'Sangat Baik'
                      ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-900'
                      : isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-cyan-100 text-cyan-900'
                  }`}>
                    {b.rating}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Omzet Cabang</span>
                    <span className="font-mono font-bold text-cyan-400">{formatRupiah(b.omzet)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total Transaksi</span>
                    <span className="font-mono font-bold text-slate-300">{b.tx} Struk</span>
                  </div>
                </div>

                {b.needStock && b.shortageSKU && (
                  <div className={`p-3 rounded-lg border text-xs space-y-2 ${
                    isDark ? 'bg-amber-950/30 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Min Stok Terlampaui: {b.shortageSKU}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDispatchInterbranchTransfer(b.shortageSKU!, 'Gudang Pusat', b.id, 20)}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] rounded transition-all cursor-pointer"
                    >
                      Kirim Transfer Stok 20 Unit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: DEADSTOCK & REBALANCING (ABC INVENTORY & MARGIN MATRIX) */}
      {activeTab === 'deadstock' && (
        <AbcMarginMatrixTab isDark={isDark} />
      )}

      {/* TAB 9: GOVERNANCE, CREDENTIAL MANAGEMENT & AUDIT LOG */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
          {/* PANEL MANAJEMEN KREDENSIAL STAF OPERASIONAL (MODE OTORITAS: EXECUTIVE MANAGER) */}
          <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
            isDark ? 'bg-slate-900/50 border-amber-500/35 backdrop-blur-xl' : 'bg-white border-amber-500/60 shadow-sm'
          }`}>
            <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4 ${
              isDark ? 'border-white/[0.08]' : 'border-slate-200'
            }`}>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className={`text-base leading-6 font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Manajemen Kredensial Staf Operasional
                  </h2>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider border ${
                    isDark
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/45'
                      : 'bg-amber-50 text-amber-800 border-amber-400'
                  }`}>
                    <Shield className="w-3.5 h-3.5" />
                    MODE OTORITAS: EXECUTIVE MANAGER
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Kewenangan Executive Manager (<strong>Jacs Enterprise</strong>): Dapat mengatur atau mengganti PIN/sandi <strong>satu per satu</strong> bagi staf operasional di bawahnya (Admin Gudang, Kasir 01–04, Finance, Purchasing, HR). Akun <strong>Master SuperAdmin</strong> terkunci permanen dan fitur <em>Reset Total Semua Sandi Operasional</em> hanya tersedia pada otoritas SuperAdmin.
                </p>
              </div>

              <div className={`px-3.5 py-2 rounded-xl text-[11px] font-mono border flex items-center gap-2 shrink-0 ${
                isDark
                  ? 'bg-slate-950/70 text-slate-400 border-white/10'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}>
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Reset Total Sandi Operasional: Khsusus SuperAdmin</span>
              </div>
            </div>

            <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
              <table className="w-full text-left text-xs">
                <thead className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${
                  isDark ? 'bg-slate-950/60 text-slate-400' : 'bg-slate-100 text-slate-600'
                }`}>
                  <tr>
                    <th className="py-3 px-3.5">Nama Akun / Staf</th>
                    <th className="py-3 px-3.5">Role / Divisi</th>
                    <th className="py-3 px-3.5">Status PIN Aktif</th>
                    <th className="py-3 px-3.5">Ubah PIN Staf (Satu per Satu)</th>
                    <th className="py-3 px-3.5 text-center">Aksi Otoritas</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-200 bg-white'}`}>
                  {(users || []).map((u: any) => {
                    const isSuper = isSuperAdminAccountExec(u);
                    return (
                      <tr key={u.user_id || u.id} className={isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}>
                        <td className="py-3 px-3.5 font-medium">
                          <div className="flex items-center gap-2">
                            <span>{u.name}</span>
                            {isSuper && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                isDark
                                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                                  : 'bg-rose-50 text-rose-700 border-rose-300'
                              }`}>
                                MASTER RECOVERY
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3.5">{u.role} ({u.division})</td>
                        <td className="py-3 px-3.5 font-mono">
                          {isSuper ? (
                            <span className="text-rose-400 font-bold">•••• (Permanen)</span>
                          ) : (
                            <span className="text-emerald-400 font-semibold">{u.pin}</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          {isSuper ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                              isDark
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}>
                              <Lock className="w-3 h-3" />
                              TERKUNCI PERMANEN (MASTER SUPERADMIN)
                            </span>
                          ) : (
                            <input
                              type="password"
                              maxLength={6}
                              value={execStaffPinInputs[u.user_id] || ''}
                              onChange={(e) =>
                                setExecStaffPinInputs((prev) => ({
                                  ...prev,
                                  [u.user_id]: e.target.value,
                                }))
                              }
                              placeholder="PIN baru..."
                              className={`py-1 px-2.5 rounded-lg border font-mono text-xs w-32 ${
                                isDark
                                  ? 'bg-slate-950 border-white/15 text-white'
                                  : 'bg-slate-50 border-slate-300 text-slate-900'
                              }`}
                            />
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          {isSuper ? (
                            <button
                              type="button"
                              disabled
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border cursor-not-allowed inline-flex items-center gap-1 ${
                                isDark
                                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                                  : 'bg-slate-100 text-rose-700 border-rose-300'
                              }`}
                            >
                              <Lock className="w-3 h-3" />
                              <span>TERKUNCI PERMANEN (MASTER SUPERADMIN)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const nextPin = (execStaffPinInputs[u.user_id] || '').trim();
                                if (!nextPin) {
                                  if (showToast) showToast('Masukkan PIN/Sandi baru untuk staf operasional terlebih dahulu!', 'warning');
                                  return;
                                }
                                if (typeof updateUserPin === 'function') {
                                  updateUserPin(u.user_id, nextPin);
                                }
                                recordAudit({
                                  traceId: `EXEC-PIN-UPDATE-${u.user_id}-${Date.now()}`,
                                  userId: effectiveUser?.id || 'USR-002',
                                  userName: effectiveUser?.name || 'Executive Manager',
                                  userRole: 'Executive Manager',
                                  module: 'AUTH',
                                  action: 'AUTH_OVERRIDE_PIN',
                                  severity: 'WARN',
                                  entityId: u.user_id,
                                  payloadAfter: { targetUser: u.name, updatedByAuthority: 'EXECUTIVE_MANAGER' },
                                });
                                setExecStaffPinInputs((prev) => ({ ...prev, [u.user_id]: '' }));
                                if (showToast) {
                                  showToast(`PIN operasional untuk ${u.name} (${u.role}) berhasil diperbarui oleh Executive Manager!`, 'success');
                                }
                              }}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer transition active:scale-95"
                            >
                              Simpan PIN Staf
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border transition-all space-y-5 ${
            isDark ? 'bg-slate-900/40 border-white/[0.06] backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-white/[0.06]' : 'border-slate-200'
          }`}>
            <div>
              <h2 className={`text-base leading-6 font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Shield className="w-4 h-4 text-emerald-500" />
                Tata Kelola &amp; Jejak Audit Keputusan Manager (Governance &amp; Audit Trail)
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Jejak audit permanen atas persetujuan, penolakan, serta tindak lanjut saran AI Executive Advisor oleh Manager.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className={`text-xs font-mono font-semibold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Log Keputusan AI &amp; Intervensi Manager ({managerDecisions.length})
            </h3>
            {managerDecisions.length === 0 ? (
              <div className={`p-6 rounded-xl border text-center text-xs ${isDark ? 'bg-slate-900/40 border-white/[0.06] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p className="font-medium text-slate-300">Belum ada keputusan Manager yang dicatat pada sesi ini.</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Gunakan tombol `Tindak Lanjuti` atau `Abaikan` pada kartu saran AI Executive Advisor untuk merekam jejak audit tata kelola.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b font-mono text-[11px] ${isDark ? 'border-white/[0.08] text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Kategori Saran AI</th>
                      <th className="py-2.5 px-3">Fakta &amp; Saran Tindakan</th>
                      <th className="py-2.5 px-3">Keputusan Manager</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {managerDecisions.map((item) => {
                      const isFollowUp = item.decision === 'DITINDAKLANJUTI';
                      return (
                        <tr key={item.id} className={`transition-all ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{item.timestamp}</td>
                          <td className="py-3 px-3 font-mono font-semibold text-cyan-400 whitespace-nowrap">{item.kategori}</td>
                          <td className="py-3 px-3">
                            <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.fakta}</div>
                            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.saran}</div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                              isFollowUp
                                ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}>
                              {isFollowUp ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {item.decision}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {/* TAB: PROMO & HARGA MUSIMAN */}
      {activeTab === 'promo_campaign' && (
        <PromoCampaignCenterTab isDark={isDark} />
      )}

      {/* TAB 10: DATA MASTER & KATALOG TERTANAM */}
      {activeTab === 'master_data' && (
        <div className="mt-2">
          <MasterDataModule />
        </div>
      )}

      {/* TAB 11: AUDIT LOG AKTIVITAS SENSITIF (READ-ONLY) */}
      {activeTab === 'audit_log' && (
        <ExecutiveAuditLogTab isDark={isDark} />
      )}

      {/* MODAL: DETIL AUDIT SKU */}
      {selectedSKUDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl space-y-4 ${
            isDark ? 'bg-slate-900 border-cyan-500/40 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">Rincian Performa SKU</span>
                <h3 className="text-base font-bold mt-0.5">{selectedSKUDetails.product.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSKUDetails(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="text-slate-400 block">Harga Modal HPP</span>
                <span className="font-mono font-bold text-slate-200">{formatRupiah(selectedSKUDetails.costPrice)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="text-slate-400 block">Harga Jual POS</span>
                <span className="font-mono font-bold text-cyan-400">{formatRupiah(selectedSKUDetails.sellingPrice)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="text-slate-400 block">Margin Keuntungan</span>
                <span className="font-mono font-bold text-emerald-400">{selectedSKUDetails.marginPercent}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="text-slate-400 block">Total Qty Terjual</span>
                <span className="font-mono font-bold text-purple-400">{selectedSKUDetails.soldQty} Unit</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-xs text-cyan-200 space-y-1">
              <span className="font-bold block">Rekomendasi Strategis Direksi:</span>
              <p className="text-[11px] leading-relaxed text-cyan-300">{selectedSKUDetails.recommendation}</p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSKUDetails(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}

      {/* MODAL: AUDIT TRANSAKSI JAM TERPILIH */}
      {selectedHourlyAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-xl p-6 rounded-2xl border shadow-2xl space-y-4 ${
            isDark ? 'bg-slate-900 border-cyan-500/40 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">Inspeksi Transaksi Jam {selectedHourlyAudit.label}</span>
                <h3 className="text-base font-bold mt-0.5">Ringkasan {selectedHourlyAudit.txCount} Transaksi Aktif</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHourlyAudit(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="text-slate-400 block">Total Omzet Jam Ini</span>
                <span className="font-mono font-bold text-emerald-400">{formatRupiah(selectedHourlyAudit.totalRevenue)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="text-slate-400 block">Anomali / Void</span>
                <span className={`font-mono font-bold ${selectedHourlyAudit.hasAnomaly ? 'text-rose-400' : 'text-slate-300'}`}>
                  {selectedHourlyAudit.anomalies.length} Kejadian
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedHourlyAudit(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Tutup Inspeksi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveModule;