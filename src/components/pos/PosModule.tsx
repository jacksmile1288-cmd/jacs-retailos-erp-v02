import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, CartItem, PaymentMethod, Terminal, PriceTier, CustomerMaster, CashierShift, ActiveNavModule, BuildingFleetType, LaundryPaymentStatus, ServiceItemFormat } from '../../types';
import {
  filterProductsByTerminal,
  getTerminalIndustry,
  TerminalIndustry,
  FNB_RESTAURANT_PRODUCTS,
  LAUNDRY_SERVICE_PRODUCTS,
  FASHION_APPAREL_PRODUCTS,
} from '../../data/industryTerminalProducts';
import { FNB_MENU_ITEMS } from '../../data/fnbData';
import {
  BARBERSHOP_SERVICE_SEEDS,
  LAUNDRY_SERVICE_SEEDS,
  getServiceFormatMeta,
  resolveServiceItemFormat,
  isBarbershopSalonProduct,
  isLaundryCatalogProduct,
  isServiceProductActive,
} from '../../data/serviceData';
import { calculateServiceCommissionBreakdown } from '../../utils/sectorCoaMap';
import { FnbModifierModal } from './FnbModifierModal';
import { FnbQuickToppingModal, FnbQuickToppingResult } from './FnbQuickToppingModal';
import { KotTicketModal } from './KotTicketModal';
import { HeldOrdersModal, HeldOrder } from './HeldOrdersModal';
import { HoldCartModal } from './HoldCartModal';
import { SupervisorVoidModal } from './SupervisorVoidModal';
import { QrisModal } from './QrisModal';
import { ManualProductSearchModal } from './ManualProductSearchModal';
import { DiscountVoucherModal } from './DiscountVoucherModal';
import { EditCartItemModal } from './EditCartItemModal';
import { FashionVariantPickerModal, FashionVariantSelection } from './FashionVariantPickerModal';
import { FashionExchangeModal } from './FashionExchangeModal';
import { OpenShiftModal } from './OpenShiftModal';
import { CloseShiftModal } from './CloseShiftModal';
import { QuickZReportModal } from './QuickZReportModal';
import { PettyCashModal } from './PettyCashModal';
import { ShiftSummaryReceiptModal } from './ShiftSummaryReceiptModal';
import { PaymentModal } from './PaymentModal';
import { LaundryTrackingBoard } from './LaundryTrackingBoard';
import {
  DigitalScaleModal,
  LaundryAreaModal,
  ScaleMeasurementPayload,
  LaundryAreaPayload,
} from './DigitalScaleModal';
import { triggerCashDrawer } from '../../utils/cashDrawerUtils';
import {
  getPosIdentityIdForBusinessModel,
  getAllowedPosIdentityIds,
  getBusinessModelDefinition,
  getPettyCashReasonPresets,
} from '../../utils/businessDomainConfig';
import {
  generatePosStations,
  getOperationalTopologyOption,
  normalizeStationCode,
  peekStationReceiptNumber,
  commitStationReceiptNumber,
  PosStationDescriptor,
  resolveSynchronizedTerminalDisplayName,
} from '../../utils/terminalConfigUtils';
import {
  loadPromoCampaignsForDomain,
  filterPromotionProgramsByDomain,
  resolvePackageBarcodePromo,
  getActivePackageProducts,
  recalculateCartWithPromos,
  getAvailablePwpOffers,
  ResolvedPromoResult,
} from '../../utils/promoEngine';
import {
  Search,
  Plus,
  Trash2,
  UserCheck,
  Tag,
  Package,
  Lock,
  Barcode,
  RotateCcw,
  ArrowLeft,
  ChefHat,
  UtensilsCrossed,
  ShoppingBag,
  X,
  Sun,
  Moon,
  Store,
  Edit3,
  Wallet,
  ChevronDown,
  Pause,
  Inbox,
  WifiOff,
  RefreshCw,
  ShoppingCart,
  Shirt,
  HardHat,
  Scissors,
  ArrowRight,
  LayoutDashboard,
  Boxes,
  Coins,
  Users,
  Truck,
  Minus,
  Clock,
  Layers,
  Keyboard,
  Monitor,
  Unlock,
  ClipboardList,
  Coffee,
  Play,
  ArrowLeftRight,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  Scale,
  Maximize2,
  Sparkles,
  Percent,
  FileSpreadsheet,
} from 'lucide-react';
import { isLaundryProductionEmployee } from '../../utils/laundryCommission';
import {
  isBuildingMaterialProduct,
  resolveBuildingItemTierPricing,
  evaluateTierMarginGuard,
  getMinSafeSellingPrice,
  resolveBulkCubicConversionFactor,
  estimateFleetDeliveryExpense,
  calculateBuildingLoadingFeeTotal,
} from '../../utils/buildingTierPricing';
import {
  resolveFnbMenuImageUrl,
  getFnbFallbackImageUrl,
} from '../../utils/demoSandbox';

interface PosIdentityCard {
  id: string;
  stationCode: string;
  receiptPrefixTag: string;
  code: string;
  posName: string;
  posTypeLabel: string;
  modelType: Terminal['modelType'];
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  isHybrid?: boolean;
}

export const PosModule: React.FC<{ returnToRegisterSignal?: number }> = ({
  returnToRegisterSignal = 0,
}) => {
  const {
    terminals,
    activeTerminal: contextActiveTerminal,
    setActiveTerminal,
    activeUser,
    currentUser,
    products,
    customers,
    sales,
    processPayment,
    isReceiptModalOpen,
    showToast,
    theme,
    toggleTheme,
    setIsCashierWorkspaceActive,
    addAuditLog,
    users,
    language: globalLanguage,
    getOpenShiftForStation,
    toggleStationBreak,
    verifyManagementAuthPin,
    boundStation,
    bindPosStation,
    unbindPosStation,
    businessProfile,
    businessDomainConfig,
    businessType,
    isDemoSandbox,
    activeSector,
    isFnb,
    isFashion,
    isBuilding,
    isService,
    isRetail,
    setActiveNav,
    isOnline,
    offlineQueue,
    syncOfflineTransactions,
    promotions,
    submitBuildingAuthRequest,
    laundryOrders,
    employees,
    serviceStylists,
    processFashionExchange,
    isMasterCatalogWiped,
    activeBackendProvider,
    gasOfflineQueueCount,
    syncOfflineQueues,
    isSuperAdminAuthenticated,
    activeCashierQuota,
    triggerSilentAutoBackupIfDue,
  } = useApp();

  const isFnbMode =
    businessType === 'FNB' ||
    (typeof window !== 'undefined' &&
      localStorage.getItem('jacs_demo_sandbox_business_type') === 'FNB');

  const sessionOperator = currentUser || activeUser;
  const canManageStationBinding = useMemo(() => {
    if (isSuperAdminAuthenticated) return true;
    if (!sessionOperator) return false;
    const roleStr = String(sessionOperator.role || '').toUpperCase();
    const divStr = String(sessionOperator.division || '').toUpperCase();
    const idStr = String(sessionOperator.user_id || sessionOperator.id || '').toUpperCase();
    return (
      roleStr.includes('SUPER') ||
      divStr.includes('SUPER') ||
      idStr.includes('SUPER') ||
      idStr === 'USR-001' ||
      roleStr.includes('EXEC') ||
      divStr.includes('EXEC') ||
      roleStr === 'MANAGER' ||
      roleStr === 'OWNER'
    );
  }, [isSuperAdminAuthenticated, sessionOperator]);

  const assignedCashierStationCode = useMemo((): string | null => {
    if (canManageStationBinding || !sessionOperator) return null;
    const roleStr = String(sessionOperator.role || '').toUpperCase();
    const divStr = String(sessionOperator.division || '').toUpperCase();
    const idStr = String(sessionOperator.user_id || sessionOperator.id || '').toUpperCase();
    const nameStr = String(sessionOperator.name || '').trim();

    const matchedRoster = (users || []).find(
      (u) =>
        (sessionOperator.user_id && u.user_id === sessionOperator.user_id) ||
        (sessionOperator.id && u.id === sessionOperator.id) ||
        (nameStr && String(u.name || '').trim().toLowerCase() === nameStr.toLowerCase())
    );
    const assignedRaw =
      sessionOperator.assignedTerminalId || matchedRoster?.assignedTerminalId || '';
    const assignedMatch = String(assignedRaw).match(/(\d+)/);
    if (assignedMatch) {
      const slot = Math.max(1, Math.min(10, parseInt(assignedMatch[1], 10)));
      return `POS-${String(slot).padStart(2, '0')}`;
    }

    const nameMatch =
      nameStr.match(/(?:kasir|pos|loket)\s*[-#]?\s*0?(\d+)/i) || nameStr.match(/0?(\d+)$/);
    if (nameMatch) {
      const slot = Math.max(1, Math.min(10, parseInt(nameMatch[1], 10)));
      return `POS-${String(slot).padStart(2, '0')}`;
    }

    if (idStr === 'USR-003') return 'POS-01';
    if (idStr === 'USR-004') return 'POS-02';
    if (idStr === 'USR-006') return 'POS-03';
    if (idStr === 'USR-007') return 'POS-04';
    const slotIdMatch = idStr.match(/USR-KASIR-0?(\d+)/i);
    if (slotIdMatch) {
      const slot = Math.max(1, Math.min(10, parseInt(slotIdMatch[1], 10)));
      return `POS-${String(slot).padStart(2, '0')}`;
    }

    if (
      roleStr.includes('KASIR') ||
      roleStr.includes('CASHIER') ||
      roleStr === 'POS' ||
      divStr.includes('POS') ||
      divStr.includes('KASIR')
    ) {
      return 'POS-01';
    }

    return null;
  }, [canManageStationBinding, sessionOperator, users]);

  const isHybridMode = Boolean(businessDomainConfig?.isHybridMultiUnit);
  const activeBusinessModelDef = useMemo(
    () => getBusinessModelDefinition(businessDomainConfig.primaryBusinessModel),
    [businessDomainConfig.primaryBusinessModel]
  );
  const activePosTypes = useMemo(
    () =>
      businessDomainConfig.activePosTypes && businessDomainConfig.activePosTypes.length > 0
        ? businessDomainConfig.activePosTypes
        : [activeBusinessModelDef.defaultPosType],
    [businessDomainConfig.activePosTypes, activeBusinessModelDef.defaultPosType]
  );
  const activeStationCount = Math.max(
    1,
    Math.min(
      10,
      Number(activeCashierQuota ?? businessDomainConfig?.activeStationCount ?? businessProfile?.posUnitCount ?? 2) || 2
    )
  );
  const activeStations: PosStationDescriptor[] = useMemo(
    () =>
      generatePosStations(
        activeStationCount,
        activePosTypes,
        businessDomainConfig.primaryBusinessModel
      ),
    [activeStationCount, activePosTypes, businessDomainConfig.primaryBusinessModel]
  );
  const primaryPosIdentityId = useMemo(
    () =>
      getPosIdentityIdForBusinessModel(
        businessDomainConfig.primaryBusinessModel,
        businessProfile?.category
      ),
    [businessDomainConfig.primaryBusinessModel, businessProfile?.category]
  );
  const _allowedPosIdentityIds = useMemo(
    () => getAllowedPosIdentityIds(businessDomainConfig, businessProfile?.category),
    [businessDomainConfig, businessProfile?.category]
  );
  void _allowedPosIdentityIds;

  const visiblePosIdentities = useMemo(() => {
    const iconByPosType: Record<string, React.ComponentType<{ className?: string }>> = {
      POS_RETAIL: ShoppingCart,
      POS_GROSIR_DISTRIBUSI: Store,
      POS_FNB: UtensilsCrossed,
      POS_BANGUNAN: HardHat,
      POS_JASA_LAYANAN: Scissors,
    };

    const stationCards: PosIdentityCard[] = activeStations.map((st) => ({
      id: st.stationCode,
      stationCode: st.stationCode,
      receiptPrefixTag: st.receiptPrefixTag,
      code: st.posCode,
      posName: st.displayName,
      posTypeLabel: st.posTypeLabel,
      modelType: st.modelType,
      emoji: st.emoji,
      icon: iconByPosType[st.posType] || ShoppingCart,
      isHybrid: st.posType === 'POS_FNB' && (isHybridMode || activePosTypes.length > 1),
    }));

    return stationCards;
  }, [activeStations, isHybridMode, activePosTypes.length]);

  const activeTerminal = contextActiveTerminal || terminals[0];
  const activeStationCode = normalizeStationCode(
    assignedCashierStationCode ||
      activeTerminal?.stationCode ||
      activeTerminal?.id ||
      boundStation?.stationCode ||
      activeStations[0]?.stationCode ||
      'POS-01'
  );
  const activeStationShift = useMemo(
    () => getOpenShiftForStation(activeStationCode) || null,
    [getOpenShiftForStation, activeStationCode]
  );

  useEffect(() => {
    if (visiblePosIdentities.length === 0) return;

    const enforcedStationCode = assignedCashierStationCode || boundStation?.stationCode;
    const boundMatch = enforcedStationCode
      ? visiblePosIdentities.find((st) => st.stationCode === enforcedStationCode)
      : undefined;

    if (boundMatch) {
      if (
        !contextActiveTerminal ||
        contextActiveTerminal.id !== boundMatch.stationCode ||
        contextActiveTerminal.stationCode !== boundMatch.stationCode ||
        contextActiveTerminal.name !== boundMatch.posName ||
        contextActiveTerminal.modelType !== boundMatch.modelType ||
        contextActiveTerminal.businessModel !== boundMatch.posTypeLabel
      ) {
        setActiveTerminal({
          id: boundMatch.stationCode,
          stationCode: boundMatch.stationCode,
          name: boundMatch.posName,
          code: boundMatch.stationCode,
          location: boundMatch.posTypeLabel,
          isActive: true,
          activeOrdersToday: contextActiveTerminal?.activeOrdersToday ?? 0,
          businessModel: boundMatch.posTypeLabel,
          businessType: boundMatch.posTypeLabel,
          modelType: boundMatch.modelType,
          isLocked: false,
          role: boundMatch.isHybrid ? 'HYBRID_BACKEND' : 'FRONT_END_ONLY',
          terminalType: boundMatch.isHybrid ? 'BACK_END' : 'FRONT_END',
        });
      }
      return;
    }

    const matchedStation = visiblePosIdentities.find(
      (item) =>
        item.stationCode === contextActiveTerminal?.stationCode ||
        item.id === contextActiveTerminal?.id
    );

    if (
      !contextActiveTerminal ||
      !matchedStation ||
      contextActiveTerminal.name !== matchedStation.posName ||
      contextActiveTerminal.modelType !== matchedStation.modelType ||
      contextActiveTerminal.businessModel !== matchedStation.posTypeLabel
    ) {
      const targetStation = matchedStation || visiblePosIdentities[0];
      setActiveTerminal({
        id: targetStation.stationCode,
        stationCode: targetStation.stationCode,
        name: targetStation.posName,
        code: targetStation.stationCode,
        location: targetStation.posTypeLabel,
        isActive: true,
        activeOrdersToday: contextActiveTerminal?.activeOrdersToday ?? 0,
        businessModel: targetStation.posTypeLabel,
        businessType: targetStation.posTypeLabel,
        modelType: targetStation.modelType,
        isLocked: false,
        role: targetStation.isHybrid ? 'HYBRID_BACKEND' : 'FRONT_END_ONLY',
        terminalType: targetStation.isHybrid ? 'BACK_END' : 'FRONT_END',
      });
    }
  }, [assignedCashierStationCode, boundStation, visiblePosIdentities, contextActiveTerminal, setActiveTerminal, activeSector]);

  const isEn = globalLanguage === 'en';
  const language: 'ID' | 'EN' = isEn ? 'EN' : 'ID';

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasExplicitLobbyReturn, setHasExplicitLobbyReturn] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(() =>
    Boolean(activeStationShift && activeStationShift.status === 'OPEN') || (isFnbMode && isDemoSandbox)
  );
  const [hoveredTerminalId, setHoveredTerminalId] = useState<string | null>(null);
  const [isStationPickerOpen, setIsStationPickerOpen] = useState(false);

  useEffect(() => {
    if (returnToRegisterSignal > 0) {
      setHasExplicitLobbyReturn(false);
      if (activeStationShift && activeStationShift.status === 'OPEN') {
        setIsRegisterOpen(true);
      }
    }
  }, [returnToRegisterSignal, activeStationShift]);

  useEffect(() => {
    if (
      activeStationShift &&
      activeStationShift.status === 'OPEN' &&
      !hasExplicitLobbyReturn &&
      !isStationPickerOpen &&
      !isRegisterOpen
    ) {
      setIsRegisterOpen(true);
    }
  }, [activeStationShift, hasExplicitLobbyReturn, isStationPickerOpen, isRegisterOpen]);

  const [pendingPosAuthAction, setPendingPosAuthAction] = useState<
    | { type: 'SWITCH_STATION' }
    | { type: 'NAVIGATE_MODULE'; moduleId: ActiveNavModule; label: string }
    | null
  >(null);
  const [posMgmtPinInput, setPosMgmtPinInput] = useState('');
  const [posMgmtPinError, setPosMgmtPinError] = useState<string | null>(null);
  const [showPosMgmtPin, setShowPosMgmtPin] = useState(false);

  const openPosMgmtPinPrompt = (
    action:
      | { type: 'SWITCH_STATION' }
      | { type: 'NAVIGATE_MODULE'; moduleId: ActiveNavModule; label: string }
  ) => {
    if (action.type === 'SWITCH_STATION' && !canManageStationBinding) {
      showToast(
        `Akses Dibatasi: Akun Anda terikat pada loket ${assignedCashierStationCode || activeStationCode}. Fitur "Ganti Loket PC" hanya tersedia untuk Executive Manager atau SuperAdmin.`,
        'warning'
      );
      return;
    }
    setPosMgmtPinInput('');
    setPosMgmtPinError(null);
    setShowPosMgmtPin(false);
    setPendingPosAuthAction(action);
  };

  const handleConfirmPosMgmtPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPosAuthAction) return;
    if (!verifyManagementAuthPin(posMgmtPinInput)) {
      setPosMgmtPinError('PIN Otorisasi Manajemen salah! Periksa kembali PIN 6 digit dari SuperAdmin.');
      addAuditLog(
        'POS_MANAGEMENT_PIN_FAILED',
        `Verifikasi PIN gagal saat mencoba aksi ${pendingPosAuthAction.type} di POS.`,
        'WARNING'
      );
      showToast('PIN Otorisasi Manajemen salah! Akses ditolak.', 'error');
      return;
    }

    const approved = pendingPosAuthAction;
    setPendingPosAuthAction(null);
    setPosMgmtPinInput('');
    setPosMgmtPinError(null);

    if (approved.type === 'SWITCH_STATION') {
      setIsStationPickerOpen(true);
      addAuditLog('POS_STATION_SWITCH_AUTHORIZED', 'PIN Otorisasi Manajemen valid untuk Ganti Loket PC.', 'INFO');
    } else {
      setIsCashierWorkspaceActive(false);
      setActiveNav(approved.moduleId);
      addAuditLog(
        'POS_MODULE_SWITCH_AUTHORIZED',
        `PIN Otorisasi Manajemen valid untuk membuka ${approved.label}.`,
        'INFO'
      );
      showToast(`Otorisasi berhasil. Mengalihkan ke modul ${approved.label}...`, 'success');
    }
  };

  const KOT_GRACE_PERIOD_MS = 5 * 60 * 1000;
  const KOT_EXPIRED_LOCK_MESSAGE =
    'Batas waktu revisi/pembatalan 5 menit setelah KOT Dapur telah berakhir. Pesanan sudah diproses dapur dan tidak dapat dibatalkan.';
  const KOT_TOPPING_LOCK_MESSAGE =
    'Batas waktu revisi 5 menit setelah KOT Dapur telah berakhir. Silakan tambah baris menu baru untuk pesanan dengan topping berbeda.';

  interface StationCartWorkspace {
    cart: CartItem[];
    fnbOrderMode: 'Dine-In' | 'Takeaway' | 'Delivery';
    fnbTableNo: string;
    hasSentKot: boolean;
    kotSentAt: number | null;
    kotVoidedItems: string[];
    kotRevisedItems?: string[];
  }

  const DEFAULT_STATION_WORKSPACE: StationCartWorkspace = {
    cart: [],
    fnbOrderMode: 'Dine-In',
    fnbTableNo: 'Meja 01',
    hasSentKot: false,
    kotSentAt: null,
    kotVoidedItems: [],
    kotRevisedItems: [],
  };

  const [stationWorkspaces, setStationWorkspaces] = useState<Record<string, StationCartWorkspace>>(() => {
    try {
      const saved = localStorage.getItem('jacs_pos_station_carts_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem('jacs_pos_station_carts_v1', JSON.stringify(stationWorkspaces));
    } catch {}
  }, [stationWorkspaces]);

  const activeStationWorkspace = stationWorkspaces[activeStationCode] || DEFAULT_STATION_WORKSPACE;
  const cart = activeStationWorkspace.cart;
  const fnbOrderMode = activeStationWorkspace.fnbOrderMode;
  const fnbTableNo = activeStationWorkspace.fnbTableNo;
  const hasSentKot = activeStationWorkspace.hasSentKot;
  const kotSentAt = activeStationWorkspace.kotSentAt ?? null;
  const kotVoidedItems = activeStationWorkspace.kotVoidedItems;
  const kotRevisedItems = activeStationWorkspace.kotRevisedItems ?? [];

  const setCart: React.Dispatch<React.SetStateAction<CartItem[]>> = useCallback(
    (updater) => {
      setStationWorkspaces((prev) => {
        const current = prev[activeStationCode] || DEFAULT_STATION_WORKSPACE;
        const nextCart = typeof updater === 'function' ? updater(current.cart) : updater;
        return {
          ...prev,
          [activeStationCode]: {
            ...current,
            cart: nextCart,
          },
        };
      });
    },
    [activeStationCode]
  );

  const setFnbOrderMode: React.Dispatch<React.SetStateAction<'Dine-In' | 'Takeaway' | 'Delivery'>> = useCallback(
    (updater) => {
      setStationWorkspaces((prev) => {
        const current = prev[activeStationCode] || DEFAULT_STATION_WORKSPACE;
        const nextMode = typeof updater === 'function' ? updater(current.fnbOrderMode) : updater;
        return {
          ...prev,
          [activeStationCode]: {
            ...current,
            fnbOrderMode: nextMode,
          },
        };
      });
    },
    [activeStationCode]
  );

  const setFnbTableNo: React.Dispatch<React.SetStateAction<string>> = useCallback(
    (updater) => {
      setStationWorkspaces((prev) => {
        const current = prev[activeStationCode] || DEFAULT_STATION_WORKSPACE;
        const nextTable = typeof updater === 'function' ? updater(current.fnbTableNo) : updater;
        return {
          ...prev,
          [activeStationCode]: {
            ...current,
            fnbTableNo: nextTable,
          },
        };
      });
    },
    [activeStationCode]
  );

  const setHasSentKot: React.Dispatch<React.SetStateAction<boolean>> = useCallback(
    (updater) => {
      setStationWorkspaces((prev) => {
        const current = prev[activeStationCode] || DEFAULT_STATION_WORKSPACE;
        const nextVal = typeof updater === 'function' ? updater(current.hasSentKot) : updater;
        return {
          ...prev,
          [activeStationCode]: {
            ...current,
            hasSentKot: nextVal,
          },
        };
      });
    },
    [activeStationCode]
  );

  const setKotSentAt: React.Dispatch<React.SetStateAction<number | null>> = useCallback(
    (updater) => {
      setStationWorkspaces((prev) => {
        const current = prev[activeStationCode] || DEFAULT_STATION_WORKSPACE;
        const nextVal = typeof updater === 'function' ? updater(current.kotSentAt ?? null) : updater;
        return {
          ...prev,
          [activeStationCode]: {
            ...current,
            kotSentAt: nextVal,
          },
        };
      });
    },
    [activeStationCode]
  );

  const setKotVoidedItems: React.Dispatch<React.SetStateAction<string[]>> = useCallback(
    (updater) => {
      setStationWorkspaces((prev) => {
        const current = prev[activeStationCode] || DEFAULT_STATION_WORKSPACE;
        const nextVal = typeof updater === 'function' ? updater(current.kotVoidedItems) : updater;
        return {
          ...prev,
          [activeStationCode]: {
            ...current,
            kotVoidedItems: nextVal,
          },
        };
      });
    },
    [activeStationCode]
  );

  const setKotRevisedItems: React.Dispatch<React.SetStateAction<string[]>> = useCallback(
    (updater) => {
      setStationWorkspaces((prev) => {
        const current = prev[activeStationCode] || DEFAULT_STATION_WORKSPACE;
        const nextVal =
          typeof updater === 'function' ? updater(current.kotRevisedItems ?? []) : updater;
        return {
          ...prev,
          [activeStationCode]: {
            ...current,
            kotRevisedItems: nextVal,
          },
        };
      });
    },
    [activeStationCode]
  );

  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [mechanicName, setMechanicName] = useState<string>('');
  const [stylistName, setStylistName] = useState<string>('');
  const [selectedStylistId, setSelectedStylistId] = useState<string>('');

  const activeServiceStylists = useMemo(
    () => (serviceStylists || []).filter((s) => s.isActive),
    [serviceStylists]
  );

  const selectedServiceStylist = useMemo(() => {
    if (selectedStylistId) {
      const found = activeServiceStylists.find((s) => s.id === selectedStylistId);
      if (found) return found;
    }
    if (stylistName.trim()) {
      const foundByName = activeServiceStylists.find(
        (s) => s.name.trim().toLowerCase() === stylistName.trim().toLowerCase()
      );
      if (foundByName) return foundByName;
    }
    return activeServiceStylists[0] || null;
  }, [activeServiceStylists, selectedStylistId, stylistName]);

  useEffect(() => {
    if (!selectedStylistId && activeServiceStylists.length > 0 && isService) {
      setSelectedStylistId(activeServiceStylists[0].id);
      setStylistName(activeServiceStylists[0].name);
    }
  }, [activeServiceStylists, selectedStylistId, isService]);
  const [petOrClientName, setPetOrClientName] = useState<string>('');
  const [deliveryFleetActive, setDeliveryFleetActive] = useState<boolean>(false);
  const [deliveryPolicy, setDeliveryPolicy] = useState<'FRANGKO' | 'LOCO'>('LOCO');
  const [selectedFleetType, setSelectedFleetType] = useState<BuildingFleetType>('PICKUP_RET');
  const [deliveryDestination, setDeliveryDestination] = useState<string>('');
  const [shippingFee, setShippingFee] = useState<number>(0);

  const [isHybridMenuOpen, setIsHybridMenuOpen] = useState(false);
  const hybridMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (hybridMenuRef.current && !hybridMenuRef.current.contains(e.target as Node)) {
        setIsHybridMenuOpen(false);
      }
    };
    if (isHybridMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isHybridMenuOpen]);

  const handleDirectHybridNavigation = (mod: { id: ActiveNavModule; label: string }) => {
    setIsHybridMenuOpen(false);
    openPosMgmtPinPrompt({ type: 'NAVIGATE_MODULE', moduleId: mod.id, label: mod.label });
  };

  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [isQuickZReportOpen, setIsQuickZReportOpen] = useState(false);
  const [isPettyCashModalOpen, setIsPettyCashModalOpen] = useState(false);
  const [closedShiftForReceipt, setClosedShiftForReceipt] = useState<CashierShift | null>(null);

  useEffect(() => {
    setIsCashierWorkspaceActive(isRegisterOpen);
    return () => {
      setIsCashierWorkspaceActive(false);
    };
  }, [isRegisterOpen, setIsCashierWorkspaceActive]);

  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);
  const [isFnbPhotoMenuMode, setIsFnbPhotoMenuMode] = useState<boolean>(() => isFnbMode);
  const [fnbCustomerName, setFnbCustomerName] = useState<string>('');
  const [fnbKitchenNote, setFnbKitchenNote] = useState<string>('');

  useEffect(() => {
    if (isFnbMode) {
      setIsFnbPhotoMenuMode(true);
    }
  }, [isFnbMode]);

  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);
  const [isCashUnderpaid, setIsCashUnderpaid] = useState<boolean>(false);

  const focusBarcodeInput = () => {
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
        barcodeInputRef.current.select();
      }
    }, 25);
  };

  const focusCashInput = () => {
    const doFocus = () => {
      if (cashInputRef.current) {
        cashInputRef.current.focus();
        cashInputRef.current.select();
      } else {
        const el = document.getElementById('pos-cash-given-input') as HTMLInputElement | null;
        if (el) {
          el.focus();
          el.select();
        }
      }
    };
    doFocus();
    setTimeout(doFocus, 30);
  };

  const [fnbSearchQuery, setFnbSearchQuery] = useState('');
  const [selectedFnbCategory, setSelectedFnbCategory] = useState<string>('ALL');

  const DEFAULT_FLEET_OPTIONS = [
    { id: 'PICKUP_RET', name: 'Ret Pick-up (±1.2 m³)', shortName: 'Ret Pick-up', volumeM3: 1.2, suffix: '-PKP', price: 350000, isActive: true },
    { id: 'TRUCK_ENGKEL', name: 'Ret Truk Engkel (±3.0 m³)', shortName: 'Ret Truk Engkel', volumeM3: 3.0, suffix: '-ENG', price: 850000, isActive: true },
    { id: 'DUMP_TRUCK', name: 'Ret Dump Truck Besar (±6.5 m³)', shortName: 'Dump Truck', volumeM3: 6.5, suffix: '-TRK', price: 1800000, isActive: true },
    { id: 'SAK_KARUNG', name: 'Eceran Karung / Sak (±0.03 m³)', shortName: 'Sak / Karung', volumeM3: 0.03, suffix: '-SAK', price: 18000, isActive: true },
  ];

  const isBusinessLaundryPrimary =
    isService &&
    businessDomainConfig.primaryBusinessModel === 'LAUNDRY' &&
    !isHybridMode;

  const isBusinessFashionPrimary =
    isFashion &&
    !isHybridMode;

  const isLaundryCartItem = (item?: CartItem | null): boolean =>
    Boolean(
      item?.product?.businessModel === 'laundry' ||
        item?.product?.laundryUnitType ||
        String(item?.product?.id || '').toUpperCase().startsWith('LND-')
    );

  const isFashionCartItem = (item?: CartItem | null): boolean =>
    Boolean(
      item?.product?.businessModel === 'fashion' ||
        String(item?.product?.id || '').toUpperCase().startsWith('FASH-') ||
        (item?.product?.variantMatrix && item.product.variantMatrix.length > 0)
    );

  const _resolvePosCartIndustry = (term?: Terminal | null): TerminalIndustry => {
    if (isBusinessLaundryPrimary) return 'laundry';
    if (isBusinessFashionPrimary) return 'fashion';
    if (
      term?.modelType === 'laundry' ||
      (term?.businessModel || '').toLowerCase().includes('laundry')
    ) {
      return 'laundry';
    }
    if (
      term?.modelType === 'fashion' ||
      term?.id === 'T-04' ||
      term?.code === 'POS-FASHION' ||
      (term?.businessModel || '').toLowerCase().includes('fashion') ||
      (term?.businessModel || '').toLowerCase().includes('butik')
    ) {
      return 'fashion';
    }
    const detected = getTerminalIndustry(term);
    if (businessDomainConfig.primaryBusinessModel === 'LAUNDRY' && detected === 'salon') {
      return 'laundry';
    }
    return detected;
  };
  void _resolvePosCartIndustry;

  const [deliveryMethod, setDeliveryMethod] = useState<'DIRECT' | 'FLEET_DELIVERY'>('DIRECT');
  const [workshopPlateNumber] = useState<string>('DD 4589 XY');
  const [workshopMechanic] = useState<string>('Rudi');

  const [, setIsDoModalOpen] = useState<boolean>(false);
  const [, setLastCompletedDoItems] = useState<CartItem[]>([]);
  const [, setLastDoReceiptNumber] = useState<string>('');

  const [selectedCartIndex, setSelectedCartIndex] = useState<number | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'IDR' | 'PERCENT'>('IDR');
  const [isTaxIncluded, setIsTaxIncluded] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [splitCashAmount, setSplitCashAmount] = useState<number>(0);
  const [splitNonCashAmount, setSplitNonCashAmount] = useState<number>(0);
  const [splitNonCashChannel, setSplitNonCashChannel] = useState<'QRIS' | 'DEBIT' | 'TRANSFER'>('QRIS');
  const [kasbonDpAmount, setKasbonDpAmount] = useState<number>(0);
  const [posMarginFloorAuthorized, setPosMarginFloorAuthorized] = useState<boolean>(false);

  useEffect(() => {
    if (cart.length === 0) {
      setSelectedCartIndex(null);
    } else if (selectedCartIndex !== null && selectedCartIndex >= cart.length) {
      setSelectedCartIndex(cart.length - 1);
    }
  }, [cart.length]);

  const [selectedPriceTier, setSelectedPriceTier] = useState<PriceTier>('RETAIL');
  const [isContractorMode, setIsContractorMode] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMaster | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);
  const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState<boolean>(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const resetToNewTransaction = () => {
    setCart([]);
    setHasSentKot(false);
    setKotSentAt(null);
    setKotVoidedItems([]);
    setKotRevisedItems([]);
    setEditingToppingCartIndex(null);
    setSelectedCartIndex(null);
    setDiscountAmount(0);
    setDiscountPercent(0);
    setPaymentMethod('CASH');
    setCashGiven(0);
    setSplitCashAmount(0);
    setSplitNonCashAmount(0);
    setSplitNonCashChannel('QRIS');
    setKasbonDpAmount(0);
    setIsCashUnderpaid(false);
    setSelectedCustomer(null);
    setSelectedPriceTier('RETAIL');
    setIsContractorMode(false);
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(false);
    setReceiptNumber(peekStationReceiptNumber(activeStationCode));
    setDeliveryFleetActive(false);
    setDeliveryPolicy('LOCO');
    setDeliveryMethod('DIRECT');
    setSelectedFleetType('PICKUP_RET');
    setDeliveryDestination('');
    setShippingFee(0);
    setIsDigitalScaleModalOpen(false);
    setScaleTargetService(null);
    setAreaModalService(null);
    setAreaTargetCartIndex(null);
    setLaundryCustomerName('');
    setFnbCustomerName('');
    setFnbKitchenNote('');
    setLaundryCustomerPhone('');
    setLaundryTotalPieces(1);
    setLaundryConditionNotes('');
    setLaundrySlaOverrideHours('AUTO');
    setLaundryPaymentStatus('LUNAS_AWAL');
    setLaundryDpAmount(0);
    setLaundryWasherId('');
    setLaundrySpecialistId('');
    setFashionAdvisorId('');
    setManualDiscountReason('');
    setManualDiscountAuthorizedBy('');
    setIsQuickFashionDiscOpen(false);
    setQuickDiscVal(0);
    setQuickDiscPin('');
    setQuickDiscSpvName('');
    setQuickDiscPinError(null);
    focusBarcodeInput();
  };

  const prevReceiptOpenRef = useRef<boolean>(isReceiptModalOpen);
  useEffect(() => {
    if (prevReceiptOpenRef.current && !isReceiptModalOpen) {
      resetToNewTransaction();
      focusBarcodeInput();
    }
    prevReceiptOpenRef.current = isReceiptModalOpen;
  }, [isReceiptModalOpen]);

  useEffect(() => {
    focusBarcodeInput();
  }, [isRegisterOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(targetNode)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCustomerAllowedTiers = (customer: CustomerMaster | null): PriceTier[] => {
    if (!customer) return ['RETAIL'];
    if (customer.has_store) return ['RETAIL', 'MEMBER', 'WHOLESALE'];
    return ['RETAIL', 'MEMBER'];
  };

  const allowedTiers = useMemo(() => getCustomerAllowedTiers(selectedCustomer), [selectedCustomer]);

  const normalizePhone = (phoneStr: string): string => {
    if (!phoneStr) return '';
    return phoneStr.replace(/\D/g, '').replace(/^62/, '0');
  };

  const handleCustomerSearchChange = (query: string) => {
    setCustomerSearchQuery(query);
    setIsCustomerDropdownOpen(true);

    if (!query.trim()) return;
    const normQuery = normalizePhone(query);
    const cleanCode = query.trim().toLowerCase();

    const matched = customers.find((c) => {
      const normCustPhone = normalizePhone(c.phone);
      const isPhoneMatch = normQuery.length >= 9 && normCustPhone === normQuery;
      const codeStr = (c.code || c.customer_code || '').toLowerCase();
      const idStr = (c.id || '').toLowerCase();
      const isCodeMatch = cleanCode.length >= 3 && (codeStr === cleanCode || idStr === cleanCode);
      return isPhoneMatch || isCodeMatch;
    });

    if (matched) {
      handleSelectCustomer(matched);
      playScannerBeep();
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers.slice(0, 6);
    const q = customerSearchQuery.toLowerCase().trim();
    const qNorm = normalizePhone(customerSearchQuery);
    return customers
      .filter((c) => {
        const codeVal = (c.code || c.customer_code || '').toLowerCase();
        const storeVal = (c.store_name || '').toLowerCase();
        const nameVal = (c.name || '').toLowerCase();
        const phoneVal = (c.phone || '').toLowerCase();
        return (
          nameVal.includes(q) ||
          phoneVal.includes(q) ||
          (qNorm.length >= 3 && normalizePhone(c.phone || '').includes(qNorm)) ||
          codeVal.includes(q) ||
          storeVal.includes(q)
        );
      })
      .slice(0, 8);
  }, [customers, customerSearchQuery]);

  const getProductPriceByTier = (product: Product, tier: PriceTier): number => {
    if (!product) return 0;
    const retail = product.price_retail ?? product.sell_price ?? 0;
    if (tier === 'WHOLESALE') {
      return product.price_wholesale ?? product.price_distributor ?? Math.round(retail * 0.90);
    }
    if (tier === 'MEMBER') {
      return product.price_member ?? Math.round(retail * 0.95);
    }
    return retail;
  };

  const getTierLabel = (tier: PriceTier): string => {
    switch (tier) {
      case 'WHOLESALE':
        return 'Grosir / Partai';
      case 'MEMBER':
        return 'Langganan / Member';
      default:
        return 'Ecer / Regular';
    }
  };

  const handleSelectPriceTier = (newTier: PriceTier) => {
    setSelectedPriceTier(newTier);
    const activeCampaigns = loadPromoCampaignsForDomain(businessDomainConfig, activeTerminal?.modelType);
    setCart((prevCart) => {
      const updatedTier = prevCart.map((item) => {
        if (!item?.product) return item;
        if (item.isPackage || item.product.isPackage) return item;
        const originalProduct =
          activeProducts.find((p) => p.id === item.product.id) ||
          products.find((p) => p.id === item.product.id) ||
          products.find((p) => (p.name || '').toLowerCase() === (item.product.name || '').toLowerCase()) ||
          item.product;
        const newUnitPrice = getProductPriceByTier(originalProduct, newTier);
        return {
          ...item,
          product: { ...item.product, sell_price: newUnitPrice },
          originalUnitPrice: newUnitPrice,
        };
      });
      return recalculatePosCart(updatedTier, activeCampaigns);
    });
    showToast(`Tingkat harga beralih ke: ${getTierLabel(newTier)}`);
  };

  const handleSelectCustomer = (customer: CustomerMaster | null) => {
    if (!customer) {
      handleClearCustomer();
      return;
    }
    setSelectedCustomer(customer);
    setIsCustomerDropdownOpen(false);
    setCustomerSearchQuery('');

    const rawTier = (customer.memberTier || customer.tier_level || '').toUpperCase();
    const hasStore = Boolean(customer.has_store || customer.store_name);
    const pts = (customer.points ?? 0).toLocaleString('id-ID');

    if (rawTier.includes('GROSIR') || rawTier.includes('WHOLESALE') || rawTier.includes('KONTRAKTOR') || hasStore) {
      if (isBuildingTerminal) {
        setIsContractorMode(true);
        setCart((prev) =>
          recalculatePosCart(
            prev,
            loadPromoCampaignsForDomain(businessDomainConfig, activeTerminal?.modelType),
            true
          )
        );
      }
      handleSelectPriceTier('WHOLESALE');
      showToast(
        isBuildingTerminal
          ? `Kontraktor Proyek: ${customer.name} • Mode Kontraktor (Tier 3) Otomatis Aktif`
          : `Mitra Grosir: ${customer.name} • ${pts} Pts (Harga Grosir Aktif)`
      );
    } else if (rawTier.includes('RETAIL') || rawTier === 'REGULER') {
      handleSelectPriceTier('RETAIL');
      showToast(`Pelanggan: ${customer.name} • ${pts} Pts (Harga Retail Aktif)`);
    } else {
      handleSelectPriceTier('MEMBER');
      showToast(`Member: ${customer.name} • ${pts} Pts (Harga Member Aktif)`);
    }
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    if (isContractorMode) {
      setIsContractorMode(false);
      setCart((prev) =>
        recalculatePosCart(
          prev,
          loadPromoCampaignsForDomain(businessDomainConfig, activeTerminal?.modelType),
          false
        )
      );
    }
    handleSelectPriceTier('RETAIL');
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(false);
    showToast('Dilepas: Kembali ke Pelanggan Umum / Walk-in (Tier Retail Aktif)');
  };

  useEffect(() => {
    setShowAllCategories(isHybridMode ? Boolean(activeTerminal?.allowAllCategories) : false);
  }, [activeTerminal?.id, activeTerminal?.name, activeTerminal?.allowAllCategories, isHybridMode]);

  const activeProducts = useMemo(() => {
    const lockedModelType: Terminal['modelType'] = isFnb
      ? 'fnb'
      : isBuilding
      ? 'building'
      : isFashion
      ? 'fashion'
      : isService
      ? businessDomainConfig.primaryBusinessModel === 'LAUNDRY'
        ? 'laundry'
        : 'salon'
      : 'retail';
    const effectiveTerminal =
      !isHybridMode && activeTerminal
        ? { ...activeTerminal, modelType: lockedModelType }
        : isBusinessLaundryPrimary && activeTerminal
        ? { ...activeTerminal, modelType: 'laundry' }
        : isBusinessFashionPrimary && activeTerminal
        ? { ...activeTerminal, modelType: 'fashion' }
        : activeTerminal;
    return filterProductsByTerminal(products, effectiveTerminal, showAllCategories);
  }, [
    products,
    activeTerminal,
    showAllCategories,
    isHybridMode,
    isFnb,
    isBuilding,
    isFashion,
    isService,
    businessDomainConfig.primaryBusinessModel,
    isBusinessLaundryPrimary,
    isBusinessFashionPrimary,
  ]);

  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const [receiptNumber, setReceiptNumber] = useState<string>(
    () => peekStationReceiptNumber(activeStationCode)
  );

  useEffect(() => {
    if (sales.length === 0) {
      setReceiptNumber(peekStationReceiptNumber(activeStationCode));
    }
  }, [sales.length, activeStationCode]);

  const [selectedFnbProduct, setSelectedFnbProduct] = useState<Product | null>(null);
  const [isFnbModalOpen, setIsFnbModalOpen] = useState(false);
  const [isKotModalOpen, setIsKotModalOpen] = useState(false);
  const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false);
  const [isHoldCartModalOpen, setIsHoldCartModalOpen] = useState(false);
  const [heldOrdersByStation, setHeldOrdersByStation] = useState<Record<string, HeldOrder[]>>(() => {
    try {
      const saved = localStorage.getItem('jacs_pos_held_orders_by_station_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem('jacs_pos_held_orders_by_station_v1', JSON.stringify(heldOrdersByStation));
    } catch {}
  }, [heldOrdersByStation]);

  const heldOrders = useMemo(
    () => heldOrdersByStation[activeStationCode] || [],
    [heldOrdersByStation, activeStationCode]
  );

  const setHeldOrders: React.Dispatch<React.SetStateAction<HeldOrder[]>> = useCallback(
    (updater) => {
      setHeldOrdersByStation((prevMap) => {
        const currentList = prevMap[activeStationCode] || [];
        const nextList = typeof updater === 'function' ? updater(currentList) : updater;
        return {
          ...prevMap,
          [activeStationCode]: nextList,
        };
      });
    },
    [activeStationCode]
  );

  const [voidingCartItem, setVoidingCartItem] = useState<{
    item: CartItem;
    index: number;
    mode?: 'REMOVE_ITEM' | 'REDUCE_QTY' | 'EDIT_TOPPING';
    targetQty?: number;
    pendingToppingUpdate?: FnbQuickToppingResult;
  } | null>(null);
  const [editingToppingCartIndex, setEditingToppingCartIndex] = useState<number | null>(null);
  const [isSupervisorVoidModalOpen, setIsSupervisorVoidModalOpen] = useState(false);
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
  const [isVoidConfirmOpen, setIsVoidConfirmOpen] = useState(false);
  const [isManualSearchOpen, setIsManualSearchOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isDigitalScaleModalOpen, setIsDigitalScaleModalOpen] = useState(false);
  const [scaleTargetService, setScaleTargetService] = useState<Product | null>(null);
  const [scaleLiveState, setScaleLiveState] = useState<{
    connected: boolean;
    grossKg: number;
    tareKg: number;
    netKg: number;
  }>({
    connected: false,
    grossKg: 0,
    tareKg: 0,
    netKg: 0,
  });
  const [areaModalService, setAreaModalService] = useState<Product | null>(null);
  const [areaTargetCartIndex, setAreaTargetCartIndex] = useState<number | null>(null);
  const [laundryCatalogFilter, setLaundryCatalogFilter] = useState<'ALL' | 'KILOAN' | 'SATUAN' | 'PASANG' | 'LUAS'>('ALL');
  const [laundryActiveTab, setLaundryActiveTab] = useState<'ORDER' | 'TRACKING'>('ORDER');
  const [laundryCustomerName, setLaundryCustomerName] = useState<string>('');
  const [laundryCustomerPhone, setLaundryCustomerPhone] = useState<string>('');
  const [laundryTotalPieces, setLaundryTotalPieces] = useState<number>(1);
  const [laundryConditionNotes, setLaundryConditionNotes] = useState<string>('');
  const [laundrySlaOverrideHours, setLaundrySlaOverrideHours] = useState<number | 'AUTO'>('AUTO');
  const [laundryPaymentStatus, setLaundryPaymentStatus] = useState<LaundryPaymentStatus>('LUNAS_AWAL');
  const [laundryDpAmount, setLaundryDpAmount] = useState<number>(0);
  const [laundryWasherId, setLaundryWasherId] = useState<string>('');
  const [laundrySpecialistId, setLaundrySpecialistId] = useState<string>('');

  const laundryStaffChoices = useMemo(() => {
    const activeStaff = (employees || []).filter((e) => e.status !== 'Inactive');
    return [...activeStaff].sort((a, b) => {
      const aLnd = isLaundryProductionEmployee(a) ? 0 : 1;
      const bLnd = isLaundryProductionEmployee(b) ? 0 : 1;
      if (aLnd !== bLnd) return aLnd - bLnd;
      return a.name.localeCompare(b.name);
    });
  }, [employees]);

  const [fashionAdvisorId, setFashionAdvisorId] = useState<string>('');
  const [variantPickerState, setVariantPickerState] = useState<{
    product: Product;
    mode: 'ADD' | 'CHANGE';
    cartIndex?: number;
    initialSize?: string;
    initialColor?: string;
  } | null>(null);
  const [isFashionExchangeOpen, setIsFashionExchangeOpen] = useState<boolean>(false);
  const [manualDiscountReason, setManualDiscountReason] = useState<string>('');
  const [manualDiscountAuthorizedBy, setManualDiscountAuthorizedBy] = useState<string>('');
  const [isQuickFashionDiscOpen, setIsQuickFashionDiscOpen] = useState<boolean>(false);
  const [quickDiscType, setQuickDiscType] = useState<'PERCENT' | 'IDR'>('PERCENT');
  const [quickDiscVal, setQuickDiscVal] = useState<number>(0);
  const [quickDiscReason, setQuickDiscReason] = useState<string>('Promo Pelanggan Butik / VIP Member');
  const [quickDiscPin, setQuickDiscPin] = useState<string>('');
  const [quickDiscSpvName, setQuickDiscSpvName] = useState<string>('');
  const [quickDiscPinError, setQuickDiscPinError] = useState<string | null>(null);

  const fashionAdvisorChoices = useMemo(() => {
    const activeStaff = (employees || []).filter((e) => e.status !== 'Inactive');
    return [...activeStaff].sort((a, b) => {
      const rank = (emp: typeof a) => {
        const txt = `${emp.role || ''} ${emp.department || ''} ${emp.division || ''}`.toLowerCase();
        if (txt.includes('fashion') || txt.includes('advisor') || txt.includes('pramuniaga') || txt.includes('stylist')) return 0;
        if (txt.includes('sales') || txt.includes('butik') || txt.includes('kasir')) return 1;
        return 2;
      };
      const diff = rank(a) - rank(b);
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });
  }, [employees]);

  const selectedFashionAdvisor = useMemo(
    () => fashionAdvisorChoices.find((e) => e.id === fashionAdvisorId) || null,
    [fashionAdvisorChoices, fashionAdvisorId]
  );

  const domainPromoCampaigns = useMemo(
    () => loadPromoCampaignsForDomain(businessDomainConfig, activeTerminal?.modelType),
    [businessDomainConfig, activeTerminal?.modelType, cart.length, isDiscountModalOpen, isManualSearchOpen]
  );

  const domainPromotions = useMemo(
    () => filterPromotionProgramsByDomain(promotions, businessDomainConfig, activeTerminal?.modelType),
    [promotions, businessDomainConfig, activeTerminal?.modelType]
  );

  const playScannerBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const now = audioCtx.currentTime;
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1400, now);
      gain1.gain.setValueAtTime(0.22, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.08);
    } catch {}
  };

  const isMultiPosSelectorActive = isHybridMode || visiblePosIdentities.length > 1;

  const isFnbTerminal = useMemo(() => {
    if (isFnbMode) return true;
    const primaryModel = String(businessDomainConfig?.primaryBusinessModel || businessProfile?.businessType || '').toUpperCase();
    if (primaryModel === 'FNB' || primaryModel === 'RESTO_CAFE' || businessDomainConfig?.mechanismFamily === 'FNB_CULINARY' || isFnb) return true;
    if (!isHybridMode) return isFnb;
    if (!activeTerminal) return isFnb;
    return (
      activeTerminal.modelType === 'fnb' ||
      activeTerminal.code === 'POS-FNB' ||
      (activeTerminal.businessModel || '').toLowerCase().includes('f&b') ||
      primaryModel === 'FNB'
    );
  }, [isFnbMode, activeTerminal, isHybridMode, isFnb, businessDomainConfig?.primaryBusinessModel, businessDomainConfig?.mechanismFamily, businessProfile?.businessType]);

  const isBuildingTerminal = useMemo(() => {
    if (!isHybridMode) return isBuilding;
    if (!activeTerminal) return isBuilding;
    return (
      activeTerminal.modelType === 'building' ||
      activeTerminal.code === 'POS-BUILD' ||
      (activeTerminal.businessModel || '').toLowerCase().includes('bangunan')
    );
  }, [activeTerminal, isHybridMode, isBuilding]);

  const isElectronicsTerminal = useMemo(() => {
    if (!isHybridMode) {
      return isRetail && Boolean(businessDomainConfig.subFeatures?.hasSerialImei);
    }
    if (!activeTerminal) return false;
    return (
      activeTerminal.code === 'POS-GADGET' ||
      activeTerminal.modelType === 'electronics'
    );
  }, [activeTerminal, isHybridMode, isRetail, businessDomainConfig.subFeatures?.hasSerialImei]);

  const isWorkshopTerminal = useMemo(() => {
    if (!isHybridMode) {
      return false;
    }
    if (!activeTerminal) return false;
    return (
      activeTerminal.code === 'POS-AUTO' ||
      activeTerminal.modelType === 'workshop'
    );
  }, [activeTerminal, isHybridMode]);

  const isRetailWholesalerTerminal = useMemo(() => {
    if (!isHybridMode) return isRetail;
    if (!activeTerminal) return isRetail;
    return activeTerminal.modelType === 'retail';
  }, [activeTerminal, isHybridMode, isRetail]);

  const isLaundryTerminal = useMemo(() => {
    if (!isHybridMode) {
      return isService && businessDomainConfig.primaryBusinessModel === 'LAUNDRY';
    }
    if (isBusinessLaundryPrimary) return true;
    if (!activeTerminal) {
      return isService && businessDomainConfig.primaryBusinessModel === 'LAUNDRY';
    }
    if (activeTerminal.modelType === 'laundry') return true;
    if ((activeTerminal.businessModel || '').toLowerCase().includes('laundry')) return true;
    if (
      businessDomainConfig.primaryBusinessModel === 'LAUNDRY' &&
      (activeTerminal.code === 'POS-SERVICE' ||
        activeTerminal.id === 'T-08' ||
        activeTerminal.modelType === 'salon')
    ) {
      return true;
    }
    return false;
  }, [activeTerminal, isHybridMode, isService, businessDomainConfig.primaryBusinessModel, isBusinessLaundryPrimary]);

  const isSalonServiceTerminal = useMemo(() => {
    if (!isHybridMode) {
      return isService && businessDomainConfig.primaryBusinessModel !== 'LAUNDRY';
    }
    if (isLaundryTerminal) return false;
    if (!activeTerminal) {
      return (
        activePosTypes.includes('POS_JASA_LAYANAN') &&
        businessDomainConfig.primaryBusinessModel !== 'LAUNDRY'
      );
    }
    return (
      activeTerminal.id === 'T-08' ||
      activeTerminal.code === 'POS-SERVICE' ||
      activeTerminal.modelType === 'salon' ||
      (activeTerminal.businessModel || '').toLowerCase().includes('jasa')
    );
  }, [isHybridMode, isService, isLaundryTerminal, activeTerminal, activePosTypes, businessDomainConfig.primaryBusinessModel]);

  const isFashionTerminal = useMemo(() => {
    if (!isHybridMode) return isFashion;
    if (isBusinessFashionPrimary) return true;
    if (!activeTerminal) return isFashion;
    const bm = (activeTerminal.businessModel || activeTerminal.businessType || '').toLowerCase();
    return (
      activeTerminal.modelType === 'fashion' ||
      activeTerminal.id === 'T-04' ||
      activeTerminal.code === 'POS-FASHION' ||
      bm.includes('fashion') ||
      bm.includes('butik')
    );
  }, [activeTerminal, isHybridMode, isFashion, isBusinessFashionPrimary]);

  const isWholesaleRetailMode = useMemo(() => {
    if (
      !isRetail ||
      isFnbTerminal ||
      isFashionTerminal ||
      isSalonServiceTerminal ||
      isLaundryTerminal ||
      isBuildingTerminal
    ) {
      return false;
    }
    const btLower = String(businessProfile?.businessType || '').toLowerCase();
    const pmUpper = String(businessDomainConfig?.primaryBusinessModel || '').toUpperCase();
    return Boolean(
      businessDomainConfig?.subFeatures?.isWholesale ||
        pmUpper === 'GROSIR_BESAR' ||
        pmUpper === 'GROSIR_KECIL' ||
        pmUpper === 'DEPO_DISTRIBUTOR' ||
        btLower.includes('grosir') ||
        btLower.includes('distributor') ||
        btLower.includes('b2b') ||
        selectedPriceTier === 'WHOLESALE'
    );
  }, [
    isRetail,
    isFnbTerminal,
    isFashionTerminal,
    isSalonServiceTerminal,
    isLaundryTerminal,
    isBuildingTerminal,
    businessProfile?.businessType,
    businessDomainConfig?.subFeatures?.isWholesale,
    businessDomainConfig?.primaryBusinessModel,
    selectedPriceTier,
  ]);

  const isKasbonAllowedForSector = useMemo(() => {
    if (isFnb || isFnbTerminal || isFnbPhotoMenuMode) return false;
    if (isFashion || isFashionTerminal) return false;
    if (isSalonServiceTerminal) return false;
    return Boolean(isBuilding || isBuildingTerminal || isLaundryTerminal || isWholesaleRetailMode);
  }, [
    isFnb,
    isFnbTerminal,
    isFnbPhotoMenuMode,
    isFashion,
    isFashionTerminal,
    isSalonServiceTerminal,
    isBuilding,
    isBuildingTerminal,
    isLaundryTerminal,
    isWholesaleRetailMode,
  ]);

  useEffect(() => {
    if (!isKasbonAllowedForSector && paymentMethod === 'KREDIT / TEMPO (AR)') {
      setPaymentMethod('CASH');
    }
  }, [isKasbonAllowedForSector, paymentMethod]);

  const pettyCashReasonPresets = useMemo(() => {
    if (isLaundryTerminal) {
      return getPettyCashReasonPresets('SERVICE', 'LAUNDRY');
    }
    if (isSalonServiceTerminal) {
      return getPettyCashReasonPresets('SERVICE', 'BARBERSHOP');
    }
    if (isFnbTerminal) {
      return getPettyCashReasonPresets('FNB', 'RESTO_CAFE');
    }
    if (isBuildingTerminal) {
      return getPettyCashReasonPresets('BUILDING', 'BAHAN_BANGUNAN');
    }
    if (isFashionTerminal) {
      return getPettyCashReasonPresets('FASHION', 'FASHION');
    }
    return getPettyCashReasonPresets(
      activeSector,
      businessDomainConfig?.primaryBusinessModel || businessProfile?.businessType
    );
  }, [
    isLaundryTerminal,
    isSalonServiceTerminal,
    isFnbTerminal,
    isBuildingTerminal,
    isFashionTerminal,
    activeSector,
    businessDomainConfig?.primaryBusinessModel,
    businessProfile?.businessType,
  ]);

  const fashionCatalogSource = useMemo(() => {
    const fromActive = activeProducts.filter(
      (p) =>
        p.businessModel === 'fashion' ||
        String(p.id || '').toUpperCase().startsWith('FASH-') ||
        Boolean(p.variantMatrix && p.variantMatrix.length > 0)
    );
    if (fromActive.length > 0) return fromActive;
    return isMasterCatalogWiped ? [] : FASHION_APPAREL_PRODUCTS;
  }, [activeProducts, isMasterCatalogWiped]);

  const fittingRoomHeldCount = useMemo(
    () => heldOrders.filter((o) => o.isFittingRoomHold).length,
    [heldOrders]
  );

  const salonServiceCatalogSource = useMemo(() => {
    const fromState = products.filter((p) => isBarbershopSalonProduct(p) && isServiceProductActive(p));
    if (fromState.length > 0) return fromState;
    return isMasterCatalogWiped ? [] : BARBERSHOP_SERVICE_SEEDS;
  }, [products, isMasterCatalogWiped]);

  const laundryCatalogSource = useMemo(() => {
    const fromState = products.filter((p) => isLaundryCatalogProduct(p) && isServiceProductActive(p));
    if (fromState.length > 0) return fromState;
    return isMasterCatalogWiped ? [] : LAUNDRY_SERVICE_SEEDS;
  }, [products, isMasterCatalogWiped]);

  // Satu sumber pencarian [F3]: menyatukan Master Data (products), katalog/paket terminal aktif,
  // serta item/varian yang sudah ada tanpa membuat set data dummy baru.
  const manualSearchProducts = useMemo(() => {
    if (isSalonServiceTerminal) {
      const seenSalon = new Set<string>();
      const salonList: Product[] = [];
      for (const p of [...salonServiceCatalogSource, ...activeProducts, ...(products || [])]) {
        if (!p || p.itemType === 'RAW_MATERIAL') continue;
        const key = String(p.id || p.sku || p.barcode || p.name || '').trim().toLowerCase();
        if (key && !seenSalon.has(key)) {
          seenSalon.add(key);
          salonList.push(p);
        }
      }
      return salonList;
    }
    if (isLaundryTerminal) {
      const seenLaundry = new Set<string>();
      const laundryList: Product[] = [];
      for (const p of [...laundryCatalogSource, ...activeProducts, ...(products || [])]) {
        if (!p || p.itemType === 'RAW_MATERIAL') continue;
        const key = String(p.id || p.sku || p.barcode || p.name || '').trim().toLowerCase();
        if (key && !seenLaundry.has(key)) {
          seenLaundry.add(key);
          laundryList.push(p);
        }
      }
      return laundryList;
    }

    const pkgProds = isFnbTerminal ? [] : getActivePackageProducts(activeProducts, domainPromoCampaigns);
    const seen = new Set<string>();
    const combined: Product[] = [];
    for (const p of [...pkgProds, ...activeProducts, ...(products || [])]) {
      if (!p || p.itemType === 'RAW_MATERIAL') continue;
      const idKey = String(p.id || '').trim().toLowerCase();
      const barcodeKey = String(p.barcode || p.sku || '').trim().toLowerCase();
      if ((idKey && seen.has(idKey)) || (barcodeKey && seen.has(`bc:${barcodeKey}`))) {
        continue;
      }
      if (idKey) seen.add(idKey);
      if (barcodeKey) seen.add(`bc:${barcodeKey}`);
      combined.push(p);
    }
    return combined;
  }, [
    products,
    activeProducts,
    isFnbTerminal,
    isSalonServiceTerminal,
    isLaundryTerminal,
    salonServiceCatalogSource,
    laundryCatalogSource,
    domainPromoCampaigns,
  ]);

  const serviceCartCommissionSummary = useMemo(() => {
    if (!isSalonServiceTerminal && !isLaundryTerminal) return null;
    return calculateServiceCommissionBreakdown(
      cart,
      selectedServiceStylist
        ? {
            id: selectedServiceStylist.id,
            name: selectedServiceStylist.name,
            commissionRate: selectedServiceStylist.commissionRate,
          }
        : stylistName.trim()
        ? { name: stylistName.trim() }
        : null,
      serviceStylists
    );
  }, [isSalonServiceTerminal, isLaundryTerminal, cart, selectedServiceStylist, stylistName, serviceStylists]);

  const kiloanLaundryServices = useMemo(() => {
    const matched = laundryCatalogSource.filter(
      (p) => p.laundryUnitType === 'KILOAN' || (p.unit || '').toLowerCase() === 'kg'
    );
    return matched.length > 0
      ? matched
      : LAUNDRY_SERVICE_PRODUCTS.filter((p) => p.laundryUnitType === 'KILOAN');
  }, [laundryCatalogSource]);

  const [salonCatalogFilter, setSalonCatalogFilter] = useState<'ALL' | ServiceItemFormat>('ALL');

  const filteredSalonServiceCatalog = useMemo(() => {
    if (salonCatalogFilter === 'ALL') return salonServiceCatalogSource;
    return salonServiceCatalogSource.filter(
      (p) => resolveServiceItemFormat(p) === salonCatalogFilter
    );
  }, [salonServiceCatalogSource, salonCatalogFilter]);

  const filteredQuickLaundryServices = useMemo(() => {
    if (laundryCatalogFilter === 'ALL') return laundryCatalogSource;
    return laundryCatalogSource.filter((p) => {
      if (p.laundryUnitType) return p.laundryUnitType === laundryCatalogFilter;
      const u = (p.unit || '').toLowerCase();
      if (laundryCatalogFilter === 'KILOAN') return u === 'kg';
      if (laundryCatalogFilter === 'PASANG') return u.includes('pasang');
      if (laundryCatalogFilter === 'LUAS') return u.includes('m2') || u.includes('m²');
      return true;
    });
  }, [laundryCatalogSource, laundryCatalogFilter]);

  const luasLaundryServices = useMemo(() => {
    const matched = laundryCatalogSource.filter(
      (p) =>
        p.laundryUnitType === 'LUAS' ||
        (p.unit || '').toLowerCase().includes('m2') ||
        (p.unit || '').toLowerCase().includes('m²')
    );
    return matched.length > 0
      ? matched
      : LAUNDRY_SERVICE_PRODUCTS.filter((p) => p.laundryUnitType === 'LUAS');
  }, [laundryCatalogSource]);

  const activeLaundryQueueCount = useMemo(
    () => laundryOrders.filter((o) => o.productionStatus !== 'DIAMBIL').length,
    [laundryOrders]
  );

  const computedLaundrySla = useMemo(() => {
    const itemHours = cart
      .map((it) => Number(it.product?.slaHours) || 0)
      .filter((h) => h > 0);
    const autoHours = itemHours.length > 0 ? Math.min(...itemHours) : 48;
    const hours =
      laundrySlaOverrideHours === 'AUTO'
        ? autoHours
        : Number(laundrySlaOverrideHours) || 48;
    const label =
      hours <= 6 ? 'Express 6 Jam' : hours <= 24 ? 'Kilat 24 Jam' : 'Reguler 48 Jam';
    const estDate = new Date(Date.now() + hours * 3600000);
    const display = estDate.toLocaleString('id-ID', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    return {
      hours,
      label,
      iso: estDate.toISOString(),
      display,
    };
  }, [cart, laundrySlaOverrideHours]);

  useEffect(() => {
    if (isRegisterOpen) {
      const primaryModel = String(businessDomainConfig?.primaryBusinessModel || businessProfile?.businessType || '').toUpperCase();
      const isFnbActive =
        isFnbMode ||
        primaryModel === 'FNB' ||
        primaryModel === 'RESTO_CAFE' ||
        businessDomainConfig?.mechanismFamily === 'FNB_CULINARY' ||
        isFnb ||
        isFnbTerminal;
      if (isFnbActive) {
        setIsFnbPhotoMenuMode(true);
      }
      if (activeTerminal) {
        setReceiptNumber(peekStationReceiptNumber(activeStationCode));
      }
    }
  }, [isFnbMode, activeTerminal, activeStationCode, isRegisterOpen, isFnbTerminal, businessDomainConfig?.primaryBusinessModel, businessDomainConfig?.mechanismFamily, businessProfile?.businessType, isFnb]);

  const applyBuildingTierPricingToCart = (
    items: CartItem[],
    contractorMode: boolean
  ): CartItem[] => {
    return items.map((item) => {
      if (!item?.product || item.isPackage || item.product.isPackage || item.modifiers) {
        return item;
      }
      const isBuildingItem = isBuildingTerminal || isBuildingMaterialProduct(item.product);
      if (!isBuildingItem) {
        if (!item.buildingTierName) return item;
        return {
          ...item,
          buildingTierName: undefined,
          buildingTierBadge: undefined,
          buildingTierLabel: undefined,
          buildingTierSavings: undefined,
          cubicConversionFactorM3: undefined,
          cubicDeductionM3: undefined,
          grossMarginPercent: undefined,
          isMarginBelowFloor: undefined,
        };
      }

      const canonical =
        products.find((p) => p.id === item.product.id) ||
        products.find((p) => (p.name || '').toLowerCase() === (item.product.name || '').toLowerCase()) ||
        item.product;

      const cubicInfo = resolveBulkCubicConversionFactor({
        product: canonical,
        selectedUnit: item.selectedUnit || item.product.unit,
        bulkUnitType: item.product.bulkUnitType,
      });

      const effectiveUnitCost = cubicInfo.isBulkConverted
        ? cubicInfo.unitCostPrice
        : Number(canonical.cost_price) > 0
        ? Number(canonical.cost_price)
        : Math.round((Number(canonical.sell_price) || 0) * 0.78);

      if (item.promoBadge === '[MANUAL DISC]') {
        const manualEffectivePrice = Math.max(0, (item.product.sell_price || 0) - (item.itemDiscount || 0));
        const manualMarginEval = evaluateTierMarginGuard(manualEffectivePrice, effectiveUnitCost);
        return {
          ...item,
          costPrice: effectiveUnitCost,
          cubicConversionFactorM3: cubicInfo.isBulkConverted ? cubicInfo.factorM3 : undefined,
          cubicDeductionM3: cubicInfo.isBulkConverted
            ? Number((cubicInfo.factorM3 * item.quantity).toFixed(4))
            : undefined,
          grossMarginPercent: manualMarginEval.marginPercent,
          isMarginBelowFloor: manualMarginEval.isBelowFloor,
        };
      }

      const baseUnitPriceOverride =
        item.isRetailUnit && canonical.priceSecondary
          ? canonical.priceSecondary
          : cubicInfo.isBulkConverted && cubicInfo.unitSalePrice > 0
          ? cubicInfo.unitSalePrice
          : item.product.bulkUnitType && item.product.sell_price > 0 && item.product.sell_price !== canonical.sell_price
          ? item.product.sell_price
          : undefined;

      const tierRes = resolveBuildingItemTierPricing({
        product: canonical,
        quantity: item.quantity,
        isContractorMode: contractorMode,
        baseUnitPriceOverride,
        unitLabel: item.selectedUnit || canonical.unit,
      });

      const hasBetterCampaignPromo =
        Boolean(item.promoSourceType) && (item.itemDiscount || 0) >= tierRes.savingsPerUnit;

      if (hasBetterCampaignPromo) {
        const promoEffectiveUnit = Math.max(0, (item.product.sell_price || 0) - (item.itemDiscount || 0));
        const promoMarginEval = evaluateTierMarginGuard(promoEffectiveUnit, effectiveUnitCost);
        return {
          ...item,
          costPrice: effectiveUnitCost,
          buildingTierName: tierRes.tierName,
          buildingTierBadge: tierRes.tierBadge || undefined,
          buildingTierLabel: tierRes.tierLabel,
          buildingTierSavings: 0,
          cubicConversionFactorM3: cubicInfo.isBulkConverted ? cubicInfo.factorM3 : undefined,
          cubicDeductionM3: cubicInfo.isBulkConverted
            ? Number((cubicInfo.factorM3 * item.quantity).toFixed(4))
            : undefined,
          grossMarginPercent: promoMarginEval.marginPercent,
          isMarginBelowFloor: promoMarginEval.isBelowFloor,
        };
      }

      const marginEval = evaluateTierMarginGuard(tierRes.activeUnitPrice, effectiveUnitCost);

      return {
        ...item,
        product: { ...item.product, sell_price: tierRes.tier1UnitPrice },
        originalUnitPrice: tierRes.tier1UnitPrice,
        customPrice: tierRes.activeUnitPrice,
        costPrice: effectiveUnitCost,
        itemDiscount: tierRes.savingsPerUnit,
        promoSavings: tierRes.totalSavings,
        promoCode: undefined,
        promoName: tierRes.tierName !== 'ECERAN' ? tierRes.tierLabel : undefined,
        promoSourceType: undefined,
        promoBadge: undefined,
        promoMechanic: undefined,
        freeBonusQty: 0,
        freeBonusLabel: undefined,
        promoHint: tierRes.nextTierHint,
        subtotal: Math.round(tierRes.activeUnitPrice * item.quantity),
        selectedPriceTier: tierRes.tierName,
        buildingTierName: tierRes.tierName,
        buildingTierBadge: tierRes.tierBadge || undefined,
        buildingTierLabel: tierRes.tierLabel,
        buildingTierSavings: tierRes.totalSavings,
        cubicConversionFactorM3: cubicInfo.isBulkConverted ? cubicInfo.factorM3 : undefined,
        cubicDeductionM3: cubicInfo.isBulkConverted
          ? Number((cubicInfo.factorM3 * item.quantity).toFixed(4))
          : undefined,
        grossMarginPercent: marginEval.marginPercent,
        isMarginBelowFloor: marginEval.isBelowFloor,
      };
    });
  };

  const recalculatePosCart = (
    draftCart: CartItem[],
    campaigns?: ReturnType<typeof loadPromoCampaignsForDomain>,
    contractorOverride?: boolean
  ): CartItem[] => {
    const promoCalculated = recalculateCartWithPromos(
      draftCart,
      activeProducts.length > 0 ? activeProducts : products,
      campaigns || loadPromoCampaignsForDomain(businessDomainConfig, activeTerminal?.modelType),
      domainPromotions
    );
    const tiered = applyBuildingTierPricingToCart(
      promoCalculated,
      contractorOverride ?? isContractorMode
    );
    return tiered.map((item) => {
      if (!item?.product || !item.modifiers) return item;
      const effectiveUnit = Math.max(0, (item.product.sell_price || 0) - (item.itemDiscount || 0));
      const syncedSubtotal = Math.round(effectiveUnit * item.quantity);
      return syncedSubtotal === item.subtotal ? item : { ...item, subtotal: syncedSubtotal };
    });
  };

  useEffect(() => {
    const shouldEnforceLaundry = isLaundryTerminal || isBusinessLaundryPrimary;
    const shouldEnforceFashion = isFashionTerminal || isBusinessFashionPrimary;
    if (!shouldEnforceLaundry && !shouldEnforceFashion && !isMultiPosSelectorActive && activeTerminal?.id !== primaryPosIdentityId) return;
    setCart((prev) => {
      if (prev.length === 0) return prev;
      if (shouldEnforceLaundry) {
        const hasNonLaundry = prev.some((c) => !isLaundryCartItem(c));
        if (hasNonLaundry) {
          const laundryOnly = prev.filter(isLaundryCartItem);
          return laundryOnly.length > 0 ? recalculatePosCart(laundryOnly) : [];
        }
        return recalculatePosCart(prev);
      }
      if (shouldEnforceFashion) {
        const hasNonFashion = prev.some((c) => !isFashionCartItem(c));
        if (hasNonFashion) {
          const fashionOnly = prev.filter(isFashionCartItem);
          return fashionOnly.length > 0 ? recalculatePosCart(fashionOnly) : [];
        }
        return recalculatePosCart(prev);
      }
      if (!isMultiPosSelectorActive) {
        const hasBuildingInCart = prev.some((c) => isBuildingMaterialProduct(c.product));
        if (businessDomainConfig.mechanismFamily !== 'BUILDING_BULK' && hasBuildingInCart) {
          const nonBuildingOnly = prev.filter((c) => !isBuildingMaterialProduct(c.product));
          return nonBuildingOnly.length > 0 ? recalculatePosCart(nonBuildingOnly) : [];
        }
        if (businessDomainConfig.mechanismFamily === 'BUILDING_BULK' && !hasBuildingInCart) {
          const buildingOnly = prev.filter((c) => isBuildingMaterialProduct(c.product));
          return buildingOnly.length > 0 ? recalculatePosCart(buildingOnly) : [];
        }
      }
      return recalculatePosCart(prev);
    });
  }, [
    activeTerminal?.name,
    activeTerminal?.id,
    activeTerminal?.modelType,
    isMultiPosSelectorActive,
    primaryPosIdentityId,
    businessDomainConfig.mechanismFamily,
    businessDomainConfig.primaryBusinessModel,
    businessDomainConfig.isHybridMultiUnit,
    isLaundryTerminal,
    isBusinessLaundryPrimary,
    isFashionTerminal,
    isBusinessFashionPrimary,
  ]);

  const handleToggleContractorMode = () => {
    const nextMode = !isContractorMode;
    setIsContractorMode(nextMode);
    setCart((prev) =>
      recalculatePosCart(
        prev,
        loadPromoCampaignsForDomain(businessDomainConfig, activeTerminal?.modelType),
        nextMode
      )
    );
    showToast(
      nextMode
        ? 'Mode Pelanggan Kontraktor AKTIF — Seluruh item material otomatis mendapat Harga Tier 3'
        : 'Mode Pelanggan Kontraktor NONAKTIF — Harga kembali menyesuaikan Qty (Eceran / Tukang / Kontraktor)',
      nextMode ? 'success' : 'info'
    );
  };

  const getActiveTransactionPriceTierLabel = (): string => {
    const hasBuildingItems = isBuildingTerminal || cart.some((c) => isBuildingMaterialProduct(c.product));
    if (hasBuildingItems) {
      if (isContractorMode) return 'Tier Kontraktor (Tier 3)';
      const tierSet = new Set(cart.map((c) => c.buildingTierName).filter(Boolean));
      if (tierSet.has('KONTRAKTOR') && (tierSet.has('TUKANG') || tierSet.has('ECERAN'))) {
        return 'Bertingkat (Tier Tukang & Kontraktor)';
      }
      if (tierSet.has('KONTRAKTOR')) return 'Tier Kontraktor (Tier 3)';
      if (tierSet.has('TUKANG')) return 'Tier Tukang (Tier 2)';
      return 'Eceran Umum (Tier 1)';
    }
    return getTierLabel(selectedPriceTier);
  };

  const handleAddToCart = (
    product: Product,
    scanQty = 1,
    explicitPkgPromo?: ResolvedPromoResult,
    laundryAreaMeta?: {
      lengthM: number;
      widthM: number;
      isMinAreaAdjusted: boolean;
      minAreaAppliedM2: number;
    }
  ) => {
    const isRaw =
      product.itemType === 'RAW_MATERIAL' ||
      (product.id || '').toLowerCase().startsWith('ing-') ||
      (product.id || '').toLowerCase().startsWith('raw-') ||
      (product.category || '').toLowerCase().includes('bahan baku');

    if (isRaw) {
      showToast(`❌ Item [${product.name}] adalah BAHAN BAKU mentah dan TIDAK DAPAT dijual di kasir!`);
      return;
    }

    if (product.laundryUnitType === 'LUAS' && !laundryAreaMeta) {
      setAreaTargetCartIndex(null);
      setAreaModalService(product);
      return;
    }

    const isZeroOrNegativeStock =
      !product.isPackage && product.itemType !== 'SERVICE' && (product.stock ?? 0) <= 0;

    const campaigns = loadPromoCampaignsForDomain(businessDomainConfig, activeTerminal?.modelType);
    let resolvedPkg = explicitPkgPromo;
    let resolvedProduct = product;
    if (product.isPackage && !resolvedPkg) {
      const pkgLookup = resolvePackageBarcodePromo(
        product.barcode || product.sku || product.id,
        activeProducts,
        campaigns,
        scanQty
      );
      if (pkgLookup) {
        if (pkgLookup.insufficientStockComponents.length > 0) {
          showToast(
            `⚠️ Stok komponen paket tidak mencukupi: ${pkgLookup.insufficientStockComponents.join(', ')}`,
            'warning'
          );
        }
        resolvedPkg = pkgLookup.promo;
        resolvedProduct = pkgLookup.product;
      }
    }

    const isLaundryItem =
      resolvedProduct.businessModel === 'laundry' ||
      Boolean(resolvedProduct.laundryUnitType) ||
      (resolvedProduct.id || '').startsWith('LND-');
    const isLaundryKiloan =
      resolvedProduct.laundryUnitType === 'KILOAN' ||
      (isLaundryItem && (resolvedProduct.unit || '').toLowerCase() === 'kg');
    const rawMinOrder = Number(resolvedProduct.minOrderWeightKg ?? resolvedProduct.minOrderQty ?? 0);
    let effectiveQty = scanQty;
    let autoMinApplied = false;
    if (isLaundryKiloan && rawMinOrder > 0 && effectiveQty < rawMinOrder) {
      effectiveQty = rawMinOrder;
      autoMinApplied = true;
    }

    const baseUnitPrice = resolvedProduct.isPackage && resolvedPkg
      ? resolvedPkg.originalUnitPrice
      : getProductPriceByTier(resolvedProduct, selectedPriceTier);

    const productWithBasePrice: Product = {
      ...resolvedProduct,
      sell_price: baseUnitPrice,
      price: baseUnitPrice,
    };

    const isFashionItem =
      resolvedProduct.businessModel === 'fashion' ||
      String(resolvedProduct.id || '').toUpperCase().startsWith('FASH-') ||
      Boolean(resolvedProduct.variantMatrix && resolvedProduct.variantMatrix.length > 0);
    const defaultMatrixCell = isFashionItem && resolvedProduct.variantMatrix?.length
      ? resolvedProduct.variantMatrix.find((c) => c.stock > 0) || resolvedProduct.variantMatrix[0]
      : undefined;
    const defaultFashionSize = isFashionItem
      ? defaultMatrixCell?.size ||
        (resolvedProduct.variantSize || 'M').split(',')[0]?.trim() ||
        'M'
      : undefined;
    const defaultFashionColor = isFashionItem
      ? defaultMatrixCell?.color ||
        (resolvedProduct.variantColor || 'Sage').split(',')[0]?.trim() ||
        'Sage'
      : undefined;

    let toastPromoSummary: ResolvedPromoResult | null = null;

    setCart((prev) => {
      const existing = !laundryAreaMeta
        ? prev.find((item) => {
            if (item.product.id !== resolvedProduct.id || item.modifiers) return false;
            if (isFashionItem) {
              return (
                (item.selectedFashionSize || defaultFashionSize) === defaultFashionSize &&
                (item.selectedFashionColor || defaultFashionColor) === defaultFashionColor
              );
            }
            return true;
          })
        : undefined;
      const draftCart: CartItem[] = existing
        ? prev.map((item) => {
            const matchesTarget =
              item.product.id === resolvedProduct.id &&
              !item.modifiers &&
              (!isFashionItem ||
                ((item.selectedFashionSize || defaultFashionSize) === defaultFashionSize &&
                  (item.selectedFashionColor || defaultFashionColor) === defaultFashionColor));
            if (matchesTarget) {
              const combinedQty = Number((item.quantity + scanQty).toFixed(2));
              const clampedQty =
                isLaundryKiloan && rawMinOrder > 0 && combinedQty < rawMinOrder
                  ? rawMinOrder
                  : combinedQty;
              return {
                ...item,
                product: productWithBasePrice,
                quantity: clampedQty,
                selectedUnit: item.selectedUnit || resolvedProduct.unit,
                selectedFashionSize: item.selectedFashionSize || defaultFashionSize,
                selectedFashionColor: item.selectedFashionColor || defaultFashionColor,
                actualNetWeightKg: isLaundryKiloan ? combinedQty : item.actualNetWeightKg,
                isMinWeightAdjusted:
                  isLaundryKiloan && rawMinOrder > 0 ? combinedQty < rawMinOrder : item.isMinWeightAdjusted,
                minWeightAppliedKg:
                  isLaundryKiloan && rawMinOrder > 0 ? rawMinOrder : item.minWeightAppliedKg,
                originalUnitPrice: baseUnitPrice,
                isPackage: Boolean(resolvedProduct.isPackage),
                componentSkus: resolvedProduct.componentSkus,
              };
            }
            return item;
          })
        : [
            ...prev,
            {
              product: productWithBasePrice,
              quantity: effectiveQty,
              subtotal: Math.round(baseUnitPrice * effectiveQty),
              originalUnitPrice: baseUnitPrice,
              itemDiscount: 0,
              selectedUnit: isLaundryItem ? resolvedProduct.unit : undefined,
              selectedFashionSize: defaultFashionSize,
              selectedFashionColor: defaultFashionColor,
              laundryLengthM: laundryAreaMeta?.lengthM,
              laundryWidthM: laundryAreaMeta?.widthM,
              actualNetWeightKg: isLaundryKiloan ? scanQty : undefined,
              isMinWeightAdjusted: laundryAreaMeta
                ? laundryAreaMeta.isMinAreaAdjusted
                : autoMinApplied,
              minWeightAppliedKg: laundryAreaMeta
                ? laundryAreaMeta.minAreaAppliedM2
                : autoMinApplied
                ? rawMinOrder
                : undefined,
              promoCode: resolvedPkg ? resolvedPkg.campaignCode : null,
              isPackage: Boolean(resolvedProduct.isPackage),
              componentSkus: resolvedProduct.componentSkus,
              ...(isSalonServiceTerminal &&
              resolvedProduct.itemType === 'SERVICE' &&
              selectedServiceStylist
                ? {
                    stylistId: selectedServiceStylist.id,
                    stylistName: selectedServiceStylist.name,
                    stylistCommissionRate: selectedServiceStylist.commissionRate,
                  }
                : {}),
            },
          ];

      const recalculated = recalculatePosCart(draftCart, campaigns);
      const updatedLine = recalculated.find(
        (it) =>
          it.product.id === resolvedProduct.id &&
          !it.modifiers &&
          (!isFashionItem ||
            ((it.selectedFashionSize || defaultFashionSize) === defaultFashionSize &&
              (it.selectedFashionColor || defaultFashionColor) === defaultFashionColor))
      );
      if (updatedLine?.promoSourceType && updatedLine.promoBadge) {
        toastPromoSummary = {
          campaignId: updatedLine.promoCode || '',
          campaignCode: updatedLine.promoCode || '',
          promoName: updatedLine.promoName || '',
          sourceType: updatedLine.promoSourceType,
          mechanic: updatedLine.promoMechanic || 'STANDARD',
          badgeLabel: updatedLine.promoBadge,
          originalUnitPrice: updatedLine.originalUnitPrice ?? baseUnitPrice,
          finalUnitPrice: baseUnitPrice,
          savingsPerUnit: updatedLine.itemDiscount || 0,
          totalLineSavings: updatedLine.promoSavings || 0,
          lineSubtotal: updatedLine.subtotal,
          promoQtyCapped: updatedLine.promoQtyCapped || 0,
          maxQtyPerReceipt: updatedLine.maxQtyPerReceipt ?? null,
          isUnlimitedFefo: Boolean(updatedLine.isUnlimitedFefo),
          freeBonusQty: updatedLine.freeBonusQty || 0,
          freeBonusLabel: updatedLine.freeBonusLabel,
          pwpQualified: updatedLine.pwpQualified,
          promoHint: updatedLine.promoHint,
          overriddenPromosCount: updatedLine.overriddenPromosCount || 0,
        };
      }
      return recalculated;
    });

    playScannerBeep();
    const activePromoInfo = toastPromoSummary || resolvedPkg;
    if (activePromoInfo) {
      const antiStackNote = activePromoInfo.overriddenPromosCount > 0 ? ` • Anti-Tumpuk (${activePromoInfo.overriddenPromosCount} promo lain dilewati)` : '';
      const bonusNote = activePromoInfo.freeBonusQty > 0 ? ` • +${activePromoInfo.freeBonusQty} Gratis!` : '';
      const savVal = toastPromoSummary ? toastPromoSummary.totalLineSavings : activePromoInfo.totalLineSavings;
      showToast(
        `+${effectiveQty} ${resolvedProduct.name} • ${activePromoInfo.badgeLabel}${bonusNote}${savVal > 0 ? ` Hemat Rp ${savVal.toLocaleString('id-ID')}` : ''}${antiStackNote}`,
        'success'
      );
    } else if (laundryAreaMeta) {
      showToast(
        `${resolvedProduct.name} (${laundryAreaMeta.lengthM}m × ${laundryAreaMeta.widthM}m = ${effectiveQty} m²) ditambahkan`,
        laundryAreaMeta.isMinAreaAdjusted ? 'warning' : 'success'
      );
    } else if (autoMinApplied) {
      showToast(
        `${resolvedProduct.name} otomatis disesuaikan ke minimum order ${rawMinOrder} ${resolvedProduct.unit || 'kg'}`,
        'warning'
      );
    } else if (isZeroOrNegativeStock) {
      showToast(
        `+${effectiveQty} ${resolvedProduct.name} ditambahkan (Stok sistem: ${resolvedProduct.stock ?? 0} → izin stok minus sementara)`,
        'warning'
      );
    } else {
      showToast(`+${effectiveQty} ${resolvedProduct.name} ditambahkan (${getTierLabel(selectedPriceTier)})`);
    }
    focusBarcodeInput();
  };

  const handleApplyDigitalScaleWeight = (payload: ScaleMeasurementPayload) => {
    const unitPrice = getProductPriceByTier(payload.service, selectedPriceTier);
    const serviceWithPrice: Product = {
      ...payload.service,
      sell_price: unitPrice,
      price: unitPrice,
    };

    setCart((prev) => {
      const targetIdx =
        selectedCartIndex !== null && prev[selectedCartIndex]?.product.id === payload.service.id
          ? selectedCartIndex
          : prev.findIndex((it) => it.product.id === payload.service.id && !it.modifiers);

      const draftCart: CartItem[] =
        targetIdx >= 0
          ? prev.map((it, idx) =>
              idx === targetIdx
                ? {
                    ...it,
                    product: serviceWithPrice,
                    quantity: payload.billedWeightKg,
                    selectedUnit: payload.service.unit || 'kg',
                    grossWeightKg: payload.grossWeightKg,
                    tareWeightKg: payload.tareWeightKg,
                    actualNetWeightKg: payload.netWeightKg,
                    isMinWeightAdjusted: payload.isMinWeightAdjusted,
                    minWeightAppliedKg: payload.minWeightAppliedKg,
                    originalUnitPrice: unitPrice,
                    subtotal: Math.round(unitPrice * payload.billedWeightKg),
                  }
                : it
            )
          : [
              ...prev,
              {
                product: serviceWithPrice,
                quantity: payload.billedWeightKg,
                subtotal: Math.round(unitPrice * payload.billedWeightKg),
                originalUnitPrice: unitPrice,
                itemDiscount: 0,
                selectedUnit: payload.service.unit || 'kg',
                grossWeightKg: payload.grossWeightKg,
                tareWeightKg: payload.tareWeightKg,
                actualNetWeightKg: payload.netWeightKg,
                isMinWeightAdjusted: payload.isMinWeightAdjusted,
                minWeightAppliedKg: payload.minWeightAppliedKg,
              },
            ];

      return recalculatePosCart(draftCart);
    });

    playScannerBeep();
    setScaleTargetService(null);
    if (payload.isMinWeightAdjusted) {
      showToast(
        `⚖️ ${payload.service.name}: Netto ${payload.netWeightKg.toFixed(2)} kg < Min. ${payload.minWeightAppliedKg} kg → Ditagih ${payload.billedWeightKg.toFixed(2)} kg`,
        'warning'
      );
    } else {
      showToast(
        `⚖️ ${payload.service.name}: ${payload.billedWeightKg.toFixed(2)} kg (Bruto ${payload.grossWeightKg.toFixed(2)} - Tare ${payload.tareWeightKg.toFixed(2)}) diterapkan`,
        'success'
      );
    }
    focusBarcodeInput();
  };

  const handleConfirmLaundryArea = (payload: LaundryAreaPayload) => {
    if (areaTargetCartIndex !== null && cart[areaTargetCartIndex]) {
      const idxToUpdate = areaTargetCartIndex;
      setCart((prev) => {
        const next = prev.map((item, idx) =>
          idx === idxToUpdate
            ? {
                ...item,
                quantity: payload.billedAreaM2,
                selectedUnit: payload.service.unit || 'm2',
                laundryLengthM: payload.lengthM,
                laundryWidthM: payload.widthM,
                isMinWeightAdjusted: payload.isMinAreaAdjusted,
                minWeightAppliedKg: payload.minAreaAppliedM2,
                subtotal: Math.round((item.product.sell_price || 0) * payload.billedAreaM2),
              }
            : item
        );
        return recalculatePosCart(next);
      });
      setAreaTargetCartIndex(null);
      setAreaModalService(null);
      playScannerBeep();
      showToast(
        `Dimensi ${payload.service.name} diperbarui: ${payload.lengthM}m × ${payload.widthM}m (${payload.billedAreaM2.toFixed(2)} m²)`,
        'success'
      );
      return;
    }

    setAreaModalService(null);
    handleAddToCart(payload.service, payload.billedAreaM2, undefined, {
      lengthM: payload.lengthM,
      widthM: payload.widthM,
      isMinAreaAdjusted: payload.isMinAreaAdjusted,
      minAreaAppliedM2: payload.minAreaAppliedM2,
    });
  };

  const formatFnbOrderLocationLabel = (
    mode: 'Dine-In' | 'Takeaway' | 'Delivery',
    tableNo: string
  ) => {
    if (mode === 'Dine-In') return `Dine-In • ${tableNo || 'Meja 01'}`;
    if (mode === 'Delivery') return 'Delivery • Tanpa Meja (Kurir)';
    return 'Takeaway • Tanpa Meja (Bungkus)';
  };

  const handleAddFnbOrder = (
    product: Product,
    quantity: number,
    modifiers: {
      tableNumber: string;
      orderType: 'Dine-In' | 'Take-Away' | 'Takeaway' | 'Delivery';
      spicyLevel: number;
      toppings: string[];
      notes: string;
    },
    extraPrice: number
  ) => {
    const unitPrice = product.sell_price + extraPrice;
    const syncedOrderType = (
      modifiers.orderType === 'Take-Away'
        ? 'Takeaway'
        : modifiers.orderType || fnbOrderMode
    ) as 'Dine-In' | 'Takeaway' | 'Delivery';
    const syncedTable =
      syncedOrderType === 'Dine-In'
        ? modifiers.tableNumber
          ? modifiers.tableNumber.toLowerCase().includes('meja')
            ? modifiers.tableNumber
            : `Meja ${modifiers.tableNumber}`
          : fnbTableNo
        : '';

    if (syncedOrderType === 'Dine-In' && syncedTable) {
      setFnbTableNo(syncedTable);
    }
    setFnbOrderMode(syncedOrderType);

    setCart((prev) => [
      ...prev,
      {
        product: { ...product, sell_price: unitPrice },
        originalUnitPrice: product.sell_price,
        quantity,
        subtotal: unitPrice * quantity,
        itemDiscount: 0,
        modifiers: {
          ...modifiers,
          toppingExtraPrice: extraPrice,
          tableNumber: syncedTable,
          orderType: syncedOrderType === 'Takeaway' ? 'Take-Away' : syncedOrderType,
        },
      },
    ]);
    playScannerBeep();
    showToast(
      `+${quantity} ${product.name} (${formatFnbOrderLocationLabel(syncedOrderType, syncedTable)}) ditambahkan`
    );
  };

  const handleQuickAddFnbProduct = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const activeTableForOrder = fnbOrderMode === 'Dine-In' ? fnbTableNo : '';
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (it) =>
          it.product.id === product.id &&
          !isItemSentToKot(it) &&
          (!it.modifiers?.toppings || it.modifiers.toppings.length === 0) &&
          !it.modifiers?.spicyLabel &&
          (!it.modifiers?.sugarIceLabel || it.modifiers.sugarIceLabel === 'Normal') &&
          !it.modifiers?.notes
      );
      if (existingIdx >= 0) {
        const next = [...prev];
        const target = { ...next[existingIdx] };
        target.quantity += 1;
        target.subtotal = target.quantity * target.product.sell_price;
        target.modifiers = {
          ...(target.modifiers || {
            spicyLevel: 0,
            toppings: [],
            notes: '',
          }),
          tableNumber: activeTableForOrder,
          orderType: fnbOrderMode === 'Takeaway' ? 'Take-Away' : fnbOrderMode,
        };
        next[existingIdx] = target;
        return recalculatePosCart(next);
      }
      return recalculatePosCart([
        ...prev,
        {
          product,
          originalUnitPrice: product.sell_price,
          quantity: 1,
          subtotal: product.sell_price,
          itemDiscount: 0,
          modifiers: {
            tableNumber: activeTableForOrder,
            orderType: fnbOrderMode === 'Takeaway' ? 'Take-Away' : fnbOrderMode,
            spicyLevel: 0,
            toppings: [],
            toppingDetails: [],
            toppingExtraPrice: 0,
            notes: fnbKitchenNote.trim(),
          },
        },
      ]);
    });
    playScannerBeep();
    showToast(
      `+1 ${product.name} masuk keranjang (${formatFnbOrderLocationLabel(fnbOrderMode, activeTableForOrder)})`
    );
  };

  const handleChangeFnbOrderMode = (nextMode: 'Dine-In' | 'Takeaway' | 'Delivery') => {
    setFnbOrderMode(nextMode);
    const nextTableForItems = nextMode === 'Dine-In' ? fnbTableNo : '';
    setCart((prev) =>
      prev.map((item) => ({
        ...item,
        modifiers: {
          ...(item.modifiers || { spicyLevel: 0, toppings: [], notes: '' }),
          tableNumber: nextTableForItems,
          orderType: nextMode === 'Takeaway' ? 'Take-Away' : nextMode,
        },
      }))
    );
  };

  const handleChangeFnbTableNo = (nextTable: string) => {
    setFnbTableNo(nextTable);
    setCart((prev) =>
      prev.map((item) => ({
        ...item,
        modifiers: {
          ...(item.modifiers || { spicyLevel: 0, toppings: [], notes: '' }),
          tableNumber: fnbOrderMode === 'Dine-In' ? nextTable : '',
          orderType: fnbOrderMode === 'Takeaway' ? 'Take-Away' : fnbOrderMode,
        },
      }))
    );
  };

  const isFnbModeActive = isFnbMode || isFnbTerminal || isFnbPhotoMenuMode;
  const isItemSentToKot = (it?: CartItem | null) => Boolean(it?.kotSent && (it.kotSentQty ?? 0) > 0);
  const hasAnyKotSentItem = hasSentKot || cart.some((it) => isItemSentToKot(it));

  const [kotNowMs, setKotNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    if (!hasAnyKotSentItem || !kotSentAt) return;
    setKotNowMs(Date.now());
    const timer = window.setInterval(() => {
      setKotNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [hasAnyKotSentItem, kotSentAt]);

  const kotElapsedMs = kotSentAt ? Math.max(0, kotNowMs - kotSentAt) : 0;
  const kotRemainingMs = kotSentAt ? Math.max(0, KOT_GRACE_PERIOD_MS - kotElapsedMs) : 0;
  const isKotGraceExpired = Boolean(hasAnyKotSentItem && kotSentAt && kotElapsedMs > KOT_GRACE_PERIOD_MS);
  const kotRemainingLabel = (() => {
    const totalSeconds = Math.max(0, Math.ceil(kotRemainingMs / 1000));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  })();

  const checkKotExpiredNow = () =>
    Boolean(hasAnyKotSentItem && kotSentAt && Date.now() - kotSentAt > KOT_GRACE_PERIOD_MS);

  const handleUpdateQty = (index: number, delta: number) => {
    const currentItem = cart[index];
    if (!currentItem) return;
    const nextQty = Number((currentItem.quantity + delta).toFixed(2));

    if (delta < 0) {
      if (isFnbModeActive) {
        if (!isItemSentToKot(currentItem)) {
          if (nextQty <= 0) {
            handleRemoveItem(index);
            return;
          }
          setCart((prev) => {
            const updated = prev.map((item, idx) =>
              idx === index ? { ...item, quantity: nextQty } : item
            );
            return recalculatePosCart(updated);
          });
          return;
        }
        const sentQty = currentItem.kotSentQty ?? currentItem.quantity;
        if (nextQty >= sentQty) {
          setCart((prev) => {
            const updated = prev.map((item, idx) =>
              idx === index ? { ...item, quantity: nextQty } : item
            );
            return recalculatePosCart(updated);
          });
          return;
        }
        if (checkKotExpiredNow()) {
          showToast(KOT_EXPIRED_LOCK_MESSAGE, 'error');
          return;
        }
        setVoidingCartItem({
          item: currentItem,
          index,
          mode: nextQty <= 0 ? 'REMOVE_ITEM' : 'REDUCE_QTY',
          targetQty: nextQty,
        });
        setIsSupervisorVoidModalOpen(true);
        return;
      }

      if (nextQty <= 0) {
        handleRequestRemoveItem(index);
        return;
      }
    }

    setCart((prev) => {
      const updated = prev.map((item, idx) =>
        idx === index ? { ...item, quantity: nextQty } : item
      );
      return recalculatePosCart(updated);
    });
  };

  const getProductUomOptions = (product: Product) => {
    const baseUnit = product.unit || 'Pcs';
    const basePrice = getProductPriceByTier(product, selectedPriceTier);
    const list = [
      {
        unit: baseUnit,
        conversionFactor: 1,
        price: basePrice,
        barcode: product.barcode,
      },
    ];
    if (product.unitSecondary && (product.conversionRate || 0) > 1) {
      const factor = product.conversionRate || 12;
      const secPrice =
        product.priceSecondary || Math.round(basePrice * factor * 0.95);
      list.push({
        unit: product.unitSecondary,
        conversionFactor: factor,
        price: secPrice,
        barcode: product.variantBarcode,
      });
    }
    const dusFactor = product.conversionRate && product.conversionRate >= 24 ? product.conversionRate : 24;
    if (!list.some(u => u.unit.toLowerCase().includes('dus') || u.unit.toLowerCase().includes('karton'))) {
      const dusPrice = Math.round(basePrice * dusFactor * 0.90);
      list.push({
        unit: 'Dus / Karton',
        conversionFactor: dusFactor,
        price: dusPrice,
        barcode: `${product.barcode || product.id}-DUS`,
      });
    }
    return list;
  };

  const handleSelectCartItemUnit = (index: number, nextUnitName: string) => {
    setCart((prev) => {
      const updated = prev.map((item, idx) => {
        if (idx !== index) return item;
        const uoms = getProductUomOptions(item.product);
        const chosenUom = uoms.find((u) => u.unit === nextUnitName) || uoms[0];
        const conversionFactor = chosenUom.conversionFactor;
        const baseStock = item.product.stock ?? 0;
        const requiredBaseQty = item.quantity * conversionFactor;
        if (requiredBaseQty > baseStock) {
          showToast(
            `⚠️ Peringatan: Stok dasar (${baseStock}) tidak mencukupi untuk ${item.quantity} ${chosenUom.unit} (${requiredBaseQty} base units)!`,
            'warning'
          );
        }
        const costPricePerUnit = Number(item.product.cost_price || item.product.costPrice || 0);
        const minSafeUnitPrice = costPricePerUnit * conversionFactor;
        const finalPrice = Math.max(chosenUom.price, minSafeUnitPrice);

        return {
          ...item,
          selectedUnit: chosenUom.unit,
          conversionFactor,
          originalUnitPrice: finalPrice,
          subtotal: Math.round(finalPrice * item.quantity),
        };
      });
      return recalculatePosCart(updated);
    });
  };

  const handleToggleItemUnit = (index: number) => {
    setCart((prev) => {
      const updated = prev.map((item, idx) => {
        if (idx === index) {
          const p = item.product;
          if (p.unitSecondary && p.priceSecondary) {
            const nextIsRetail = !item.isRetailUnit;
            const nextUnit = nextIsRetail ? p.unitSecondary : p.unit || 'Pcs';
            const unitPrice = nextIsRetail ? p.priceSecondary : p.sell_price;
            return { ...item, isRetailUnit: nextIsRetail, selectedUnit: nextUnit, originalUnitPrice: unitPrice };
          }
        }
        return item;
      });
      return recalculatePosCart(updated);
    });
  };

  const handleChangeFashionVariant = (index: number, nextSize: string, nextColor: string) => {
    setCart((prev) => {
      const updated = prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              selectedFashionSize: nextSize,
              selectedFashionColor: nextColor,
            }
          : item
      );
      return recalculatePosCart(updated);
    });
  };

  const handleConfirmFashionVariants = (selections: FashionVariantSelection[]) => {
    if (!variantPickerState || selections.length === 0) return;
    const { product, mode, cartIndex } = variantPickerState;
    const campaigns = loadPromoCampaignsForDomain(businessDomainConfig, activeTerminal?.modelType);

    if (mode === 'CHANGE' && cartIndex !== undefined && cart[cartIndex]) {
      const chosen = selections[0];
      handleChangeFashionVariant(cartIndex, chosen.size, chosen.color);
      playScannerBeep();
      showToast(`Varian ${product.name} diubah ke ${chosen.size} • ${chosen.color}`);
      return;
    }

    let zeroStockPicked = false;
    setCart((prev) => {
      const draft = [...prev];
      for (const sel of selections) {
        const cell = product.variantMatrix?.find(
          (c) => c.size === sel.size && c.color === sel.color
        );
        if (cell && cell.stock <= 0) zeroStockPicked = true;
        const baseTierPrice = getProductPriceByTier(product, selectedPriceTier);
        const upcharge = Number(product.sizeUpcharges?.[sel.size] || product.sizeUpcharges?.[sel.size.toUpperCase()] || 0);
        const unitPrice = baseTierPrice + upcharge;
        const prodWithPrice: Product = { ...product, sell_price: unitPrice, price: unitPrice };

        const existingIdx = draft.findIndex(
          (it) =>
            it.product.id === product.id &&
            !it.modifiers &&
            it.selectedFashionSize === sel.size &&
            it.selectedFashionColor === sel.color
        );
        if (existingIdx >= 0) {
          const cur = draft[existingIdx];
          draft[existingIdx] = {
            ...cur,
            product: prodWithPrice,
            quantity: Number((cur.quantity + sel.qty).toFixed(2)),
            originalUnitPrice: unitPrice,
          };
        } else {
          draft.push({
            product: prodWithPrice,
            quantity: sel.qty,
            subtotal: Math.round(unitPrice * sel.qty),
            originalUnitPrice: unitPrice,
            itemDiscount: 0,
            selectedUnit: product.unit || 'Pcs',
            selectedFashionSize: sel.size,
            selectedFashionColor: sel.color,
          });
        }
      }
      return recalculatePosCart(draft, campaigns);
    });

    playScannerBeep();
    const summaryTags = selections.map((s) => `${s.size}•${s.color} (${s.qty}x)`).join(', ');
    showToast(
      `+${product.name} [${summaryTags}] masuk keranjang${zeroStockPicked ? ' (Non-Blocking stok 0)' : ''}`,
      zeroStockPicked ? 'warning' : 'success'
    );
    focusBarcodeInput();
  };

  const handleSelectFleetTier = (index: number, fleetId: string) => {
    setCart((prev) => {
      const updated = prev.map((item, idx) => {
        if (idx === index) {
          const fleetList = item.product.bulkFleetTiers && item.product.bulkFleetTiers.length > 0 ? item.product.bulkFleetTiers : DEFAULT_FLEET_OPTIONS;
          const chosen = fleetList.find((f) => f.id === fleetId);
          if (chosen) {
            const cubicInfo = resolveBulkCubicConversionFactor({
              product: item.product,
              bulkUnitType: chosen.id,
              selectedUnit: chosen.name,
            });
            return {
              ...item,
              selectedUnit: chosen.name,
              originalUnitPrice: chosen.price,
              costPrice: cubicInfo.unitCostPrice,
              cubicConversionFactorM3: cubicInfo.factorM3,
              cubicDeductionM3: Number((cubicInfo.factorM3 * item.quantity).toFixed(4)),
              product: { ...item.product, sell_price: chosen.price, bulkUnitType: chosen.id },
            };
          }
        }
        return item;
      });
      return recalculatePosCart(updated);
    });
  };

  const handleDirectQtyChange = (index: number, newQty: number) => {
    setCart((prev) => {
      const updated = prev.map((item, idx) => {
        if (idx === index) {
          const isDecimalAllowed = Boolean(
            item.product.supportDecimal ||
              item.product.isWeighable ||
              item.product.laundryUnitType === 'KILOAN' ||
              item.product.laundryUnitType === 'LUAS' ||
              isBuildingTerminal
          );
          let validQty = isNaN(newQty) ? 1 : newQty;
          validQty = isDecimalAllowed ? Math.max(0.01, Math.round(validQty * 100) / 100) : Math.max(1, Math.floor(validQty));
          return { ...item, quantity: validQty };
        }
        return item;
      });
      return recalculatePosCart(updated);
    });
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length === 0) setSelectedCartIndex(null);
      else setSelectedCartIndex((curr) => (curr === null ? null : Math.min(curr, next.length - 1)));
      return recalculatePosCart(next);
    });
  };

  const handleRequestRemoveItem = (index: number) => {
    const targetItem = cart[index];
    if (!targetItem) return;

    if (isFnbModeActive && !isItemSentToKot(targetItem)) {
      handleRemoveItem(index);
      showToast(`Item draft "${targetItem.product.name}" dihapus dari keranjang.`);
      return;
    }

    if (isFnbModeActive && isItemSentToKot(targetItem) && checkKotExpiredNow()) {
      showToast(KOT_EXPIRED_LOCK_MESSAGE, 'error');
      return;
    }

    setVoidingCartItem({ item: targetItem, index, mode: 'REMOVE_ITEM' });
    setIsSupervisorVoidModalOpen(true);
  };

  const handleRequestCancelCart = () => {
    if (cart.length === 0) return;
    if (hasAnyKotSentItem) {
      if (checkKotExpiredNow()) {
        showToast(KOT_EXPIRED_LOCK_MESSAGE, 'error');
        return;
      }
      setVoidingCartItem(null);
      setIsSupervisorVoidModalOpen(true);
    } else {
      setIsVoidConfirmOpen(true);
    }
  };

  const applyToppingResultToCartItem = (index: number, result: FnbQuickToppingResult) => {
    setCart((prev) => {
      const updated = prev.map((it, idx) => {
        if (idx !== index) return it;
        const basePrice =
          it.originalUnitPrice ??
          Math.max(0, it.product.sell_price - (it.modifiers?.toppingExtraPrice || 0));
        const nextUnitPrice = basePrice + result.toppingExtraPrice;
        const effectiveUnit = Math.max(0, nextUnitPrice - (it.itemDiscount || 0));
        const nextOrderType: 'Dine-In' | 'Take-Away' | 'Takeaway' | 'Delivery' =
          fnbOrderMode === 'Takeaway' ? 'Take-Away' : fnbOrderMode;
        return {
          ...it,
          originalUnitPrice: basePrice,
          product: {
            ...it.product,
            sell_price: nextUnitPrice,
            price: nextUnitPrice,
          },
          subtotal: Math.round(effectiveUnit * it.quantity),
          modifiers: {
            ...(it.modifiers || {}),
            tableNumber: fnbOrderMode === 'Dine-In' ? fnbTableNo : '',
            orderType: nextOrderType,
            toppings: result.toppings,
            toppingDetails: result.toppingDetails,
            toppingExtraPrice: result.toppingExtraPrice,
            spicyLabel: result.spicyLabel,
            spicyLevel: result.spicyLevel ?? 0,
            sugarIceLabel: result.sugarIceLabel,
            sugarLevel: result.sugarLevel,
            temperature: result.temperature,
            notes: result.notes,
          },
        };
      });
      return recalculatePosCart(updated);
    });
  };

  const handleOpenQuickTopping = (index: number) => {
    const targetItem = cart[index];
    if (!targetItem) return;
    if (isItemSentToKot(targetItem) && checkKotExpiredNow()) {
      showToast(KOT_TOPPING_LOCK_MESSAGE, 'error');
      return;
    }
    setEditingToppingCartIndex(index);
  };

  const handleConfirmQuickTopping = (result: FnbQuickToppingResult) => {
    const idx = editingToppingCartIndex;
    setEditingToppingCartIndex(null);
    if (idx === null) return;
    const targetItem = cart[idx];
    if (!targetItem) return;

    if (!isItemSentToKot(targetItem)) {
      applyToppingResultToCartItem(idx, result);
      showToast(
        `Topping & catatan "${targetItem.product.name}" diperbarui (${result.summaryText}).`
      );
      return;
    }

    if (checkKotExpiredNow()) {
      showToast(KOT_TOPPING_LOCK_MESSAGE, 'error');
      return;
    }

    setVoidingCartItem({
      item: targetItem,
      index: idx,
      mode: 'EDIT_TOPPING',
      pendingToppingUpdate: result,
    });
    setIsSupervisorVoidModalOpen(true);
  };

  const handleApproveVoidItem = (
    item: CartItem | null,
    index: number | null,
    supervisorName: string,
    reason: string
  ) => {
    if (
      item &&
      index !== null &&
      voidingCartItem?.mode === 'EDIT_TOPPING' &&
      voidingCartItem.pendingToppingUpdate
    ) {
      const rev = voidingCartItem.pendingToppingUpdate;
      applyToppingResultToCartItem(index, rev);
      const revLabel = `${item.product.name}: ${rev.summaryText}`;
      setKotRevisedItems((prev) => [...prev, revLabel]);
      const basePrice =
        item.originalUnitPrice ??
        Math.max(0, item.product.sell_price - (item.modifiers?.toppingExtraPrice || 0));
      const newLineTotal = Math.round((basePrice + rev.toppingExtraPrice) * item.quantity);
      addAuditLog({
        action: `[REVISI TOPPING KOT] "${item.product.name}" diubah ke [${rev.summaryText}] (Total baris Rp ${newLineTotal.toLocaleString('id-ID')}). Disetujui: ${supervisorName}. Alasan: ${reason}.`,
        module: 'POS / Kasir',
        user: activeUser?.name || 'Kasir',
        division: activeUser?.division || 'POS / Kasir',
        amount: newLineTotal,
        category: 'VOID_POS',
        level: 'WARNING',
      });
      setVoidingCartItem(null);
      showToast(
        `Topping "${item.product.name}" diubah & ditandai [REVISI KOT] (Disetujui: ${supervisorName}).`,
        'warning'
      );
      return;
    }

    if (!item || index === null) {
      const totalValue = grandTotal;
      const orderDesc = isFnbModeActive
        ? formatFnbOrderLocationLabel(fnbOrderMode, fnbTableNo)
        : activeStationCode;
      addAuditLog({
        action: `[VOID TRANSAKSI POS] Pesanan ${orderDesc} (${cart.length} item, Rp ${totalValue.toLocaleString('id-ID')}) DIBATALKAN. Disetujui: ${supervisorName}. Alasan: ${reason}.`,
        module: 'POS / Kasir',
        user: activeUser?.name || 'Kasir',
        division: activeUser?.division || 'POS / Kasir',
        amount: totalValue,
        category: 'VOID_POS',
        level: 'WARNING',
      });
      resetToNewTransaction();
      setVoidingCartItem(null);
      showToast(`Pesanan berhasil dibatalkan & dicatat ke Audit Log (Disetujui: ${supervisorName}).`, 'warning');
      return;
    }

    if (voidingCartItem?.mode === 'REDUCE_QTY' && typeof voidingCartItem.targetQty === 'number') {
      const targetQty = Math.max(1, voidingCartItem.targetQty);
      const prevSentQty = item.kotSentQty ?? item.quantity;
      const cancelledQty = Math.max(1, Number((prevSentQty - targetQty).toFixed(2)));
      const cancelledNominal = Math.round((item.product.sell_price || 0) * cancelledQty);
      setCart((prev) => {
        const updated = prev.map((it, idx) =>
          idx === index
            ? {
                ...it,
                quantity: targetQty,
                kotSentQty: Math.min(prevSentQty, targetQty),
              }
            : it
        );
        return recalculatePosCart(updated);
      });
      if (isItemSentToKot(item)) {
        const label = `${item.product.name} (${cancelledQty}x)`;
        setKotVoidedItems((prev) => [...prev, label]);
      }
      addAuditLog({
        action: `[VOID ITEM KOT] Item "${item.product.name}" dikurangi -${cancelledQty}x (Rp ${cancelledNominal.toLocaleString('id-ID')}). Disetujui: ${supervisorName}. Alasan: ${reason}.`,
        module: 'POS / Kasir',
        user: activeUser?.name || 'Kasir',
        division: activeUser?.division || 'POS / Kasir',
        amount: cancelledNominal,
        category: 'VOID_POS',
        level: 'WARNING',
      });
      setVoidingCartItem(null);
      showToast(
        `Qty "${item.product.name}" dikurangi & ditandai REVISI KOT (Disetujui: ${supervisorName}).`,
        'warning'
      );
      return;
    }

    const wasSentToKot = isItemSentToKot(item);
    if (wasSentToKot) {
      const voidLabel = `${item.product.name} (${item.kotSentQty ?? item.quantity}x)`;
      setKotVoidedItems((prev) => [...prev, voidLabel]);
    }
    handleRemoveItem(index);
    addAuditLog({
      action: `[VOID ITEM POS] Item "${item.product.name}" (${item.quantity}x, Rp ${(item.subtotal || 0).toLocaleString('id-ID')}) DIBATALKAN. Disetujui: ${supervisorName}. Alasan: ${reason}.`,
      module: 'POS / Kasir',
      user: activeUser?.name || 'Kasir',
      division: activeUser?.division || 'POS / Kasir',
      amount: item.subtotal || 0,
      category: 'VOID_POS',
      level: 'WARNING',
    });
    setVoidingCartItem(null);
    showToast(
      wasSentToKot
        ? `Item "${item.product.name}" di-void & masuk penanda REVISI KOT (Disetujui: ${supervisorName}).`
        : `Item "${item.product.name}" berhasil di-void (Disetujui: ${supervisorName}).`
    );
  };

  const handleConfirmVoid = () => {
    resetToNewTransaction();
    setIsVoidConfirmOpen(false);
    showToast('Keranjang pesanan berhasil dikosongkan.');
  };

  const handleOpenHoldModal = () => {
    if (cart.length === 0) {
      showToast('Keranjang masih kosong, tidak ada pesanan untuk ditahan.');
      return;
    }
    setIsHoldCartModalOpen(true);
  };

  const handleConfirmHoldOrder = (
    holdName: string,
    fnbMeta?: { tableNo?: string; orderMode?: 'Dine-In' | 'Takeaway' | 'Delivery' }
  ) => {
    if (cart.length === 0) return;
    const savedOrderMode = fnbMeta?.orderMode || fnbOrderMode;
    const savedTableNo =
      savedOrderMode === 'Dine-In' ? fnbMeta?.tableNo || fnbTableNo || 'Meja 01' : undefined;
    const newHeld: HeldOrder = {
      id: `HOLD-${Date.now()}`,
      name: holdName,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      items: [...cart],
      total: grandTotal,
      customer: selectedCustomer,
      priceTier: selectedPriceTier,
      discountType,
      discountVal: discountType === 'PERCENT' ? discountPercent : discountAmount,
      isFittingRoomHold: isFashionTerminal,
      fittingRoomLabel: isFashionTerminal ? holdName : undefined,
      fashionAdvisorId: selectedFashionAdvisor?.id,
      fashionAdvisorName: selectedFashionAdvisor?.name,
      stationCode: activeStationCode,
      isFnbHold: isFnbModeActive,
      fnbTableNo: isFnbModeActive ? savedTableNo : undefined,
      fnbOrderMode: isFnbModeActive ? savedOrderMode : undefined,
      kotSent: hasAnyKotSentItem,
      kotSentAt: kotSentAt,
      kotVoidedItems: kotVoidedItems.length > 0 ? [...kotVoidedItems] : undefined,
      kotRevisedItems: kotRevisedItems.length > 0 ? [...kotRevisedItems] : undefined,
    };
    setHeldOrders((prev) => [newHeld, ...prev]);
    resetToNewTransaction();
    showToast(
      isFnbModeActive
        ? `Pesanan "${newHeld.name}" berhasil ditahan di loket ${activeStationCode}.`
        : isFashionTerminal
        ? `Pesanan "${newHeld.name}" dititipkan (Fitting Room) — Kasir siap melayani antrean berikutnya.`
        : `Transaksi "${newHeld.name}" berhasil ditahan (HOLD).`
    );
  };

  const handleRecallOrder = (order: HeldOrder) => {
    if (cart.length > 0) {
      const autoHoldLabel = isFnbModeActive
        ? fnbOrderMode === 'Dine-In'
          ? `${fnbTableNo} (Dine-In)`
          : fnbOrderMode === 'Delivery'
          ? 'Delivery • Tanpa Meja (Kurir)'
          : 'Takeaway • Tanpa Meja (Bungkus)'
        : isFashionTerminal
        ? `Fitting Room Auto (${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`
        : `Antrean Sebelumnya (${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`;
      const autoHeld: HeldOrder = {
        id: `HOLD-${Date.now()}`,
        name: autoHoldLabel,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        items: [...cart],
        total: grandTotal,
        customer: selectedCustomer,
        priceTier: selectedPriceTier,
        isFittingRoomHold: isFashionTerminal,
        fittingRoomLabel: isFashionTerminal ? 'Titipan Antrean Sebelumnya' : undefined,
        fashionAdvisorId: selectedFashionAdvisor?.id,
        fashionAdvisorName: selectedFashionAdvisor?.name,
        stationCode: activeStationCode,
        isFnbHold: isFnbModeActive,
        fnbTableNo: isFnbModeActive && fnbOrderMode === 'Dine-In' ? fnbTableNo : undefined,
        fnbOrderMode: isFnbModeActive ? fnbOrderMode : undefined,
        kotSent: hasAnyKotSentItem,
        kotSentAt: kotSentAt,
        kotVoidedItems: kotVoidedItems.length > 0 ? [...kotVoidedItems] : undefined,
        kotRevisedItems: kotRevisedItems.length > 0 ? [...kotRevisedItems] : undefined,
      };
      setHeldOrders((prev) => [autoHeld, ...prev.filter((o) => o.id !== order.id)]);
    } else {
      setHeldOrders((prev) => prev.filter((o) => o.id !== order.id));
    }
    setCart(recalculatePosCart(order.items));
    setSelectedCustomer(order.customer || null);
    setSelectedPriceTier(order.priceTier || 'RETAIL');
    if (order.fashionAdvisorId) {
      setFashionAdvisorId(order.fashionAdvisorId);
    }
    if (order.fnbOrderMode) {
      setFnbOrderMode(order.fnbOrderMode);
    }
    if (order.fnbOrderMode === 'Dine-In' && order.fnbTableNo) {
      setFnbTableNo(order.fnbTableNo);
    }
    setHasSentKot(Boolean(order.kotSent || order.items.some((it) => it.kotSent)));
    setKotSentAt(order.kotSentAt ?? null);
    setKotVoidedItems(order.kotVoidedItems ? [...order.kotVoidedItems] : []);
    setKotRevisedItems(order.kotRevisedItems ? [...order.kotRevisedItems] : []);
    if (order.discountType && order.discountVal !== undefined) {
      setDiscountType(order.discountType);
      if (order.discountType === 'PERCENT') setDiscountPercent(order.discountVal);
      else setDiscountAmount(order.discountVal);
    }
    setIsHeldOrdersModalOpen(false);
    showToast(`Antrean "${order.name}" berhasil dimuat kembali.`);
  };

  const handleDeleteHeldOrder = (id: string) => {
    setHeldOrders((prev) => prev.filter((o) => o.id !== id));
    showToast('Antrean berhasil dihapus.');
  };

  const handleManualOpenDrawer = () => {
    triggerCashDrawer();
    showToast('Sinyal pulsa buka laci kasir terkirim ke printer');
  };

  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = barcodeInput.trim();
    if (!q) {
      if (cart.length > 0 && !isFnbTerminal && !isFnbPhotoMenuMode) {
        setPaymentMethod('CASH');
        focusCashInput();
      } else {
        focusBarcodeInput();
      }
      return;
    }

    const searchPool = manualSearchProducts.length > 0 ? manualSearchProducts : activeProducts;

    const pkgResolved = resolvePackageBarcodePromo(q, searchPool, domainPromoCampaigns);
    if (pkgResolved) {
      if (pkgResolved.insufficientStockComponents.length > 0) {
        showToast(`⚠️ Stok komponen paket tidak mencukupi: ${pkgResolved.insufficientStockComponents.join(', ')}`, 'warning');
      }
      handleAddToCart(pkgResolved.product, 1, pkgResolved.promo);
      setBarcodeInput('');
      focusBarcodeInput();
      return;
    }

    const upperQ = q.toUpperCase();
    const fleetSuffixMatch = DEFAULT_FLEET_OPTIONS.find((f) => upperQ.endsWith(f.suffix));
    if (fleetSuffixMatch) {
      const baseQuery = q.slice(0, q.length - fleetSuffixMatch.suffix.length).trim();
      const baseProduct = searchPool.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === baseQuery.toLowerCase()) ||
          (p.plu && p.plu.toLowerCase() === baseQuery.toLowerCase()) ||
          (p.id && p.id.toLowerCase() === baseQuery.toLowerCase()) ||
          (p.name && p.name.toLowerCase().includes(baseQuery.toLowerCase()))
      );
      if (baseProduct) {
        const fleetList =
          baseProduct.bulkFleetTiers && baseProduct.bulkFleetTiers.length > 0
            ? baseProduct.bulkFleetTiers
            : DEFAULT_FLEET_OPTIONS;
        const chosenFleet = fleetList.find((f) => f.id === fleetSuffixMatch.id) || fleetSuffixMatch;
        const productWithFleet: Product = {
          ...baseProduct,
          sell_price: chosenFleet.price,
          bulkUnitType: chosenFleet.id,
        };
        const fleetDisplayName = 'shortName' in chosenFleet ? chosenFleet.shortName : chosenFleet.name;
        handleAddToCart(productWithFleet, 1);
        showToast(
          `Curah [${baseProduct.name}] mode ${fleetDisplayName} (${chosenFleet.volumeM3} m³) ditambahkan!`
        );
        setBarcodeInput('');
        focusBarcodeInput();
        return;
      }
    }

    for (const prod of searchPool) {
      if (Array.isArray(prod.variantMatrix) && prod.variantMatrix.length > 0) {
        const matchedCell = prod.variantMatrix.find(
          (cell) =>
            (cell.barcodeVariant && cell.barcodeVariant.toLowerCase() === q.toLowerCase()) ||
            (cell.skuVariant && cell.skuVariant.toLowerCase() === q.toLowerCase())
        );
        if (matchedCell) {
          const campaigns = loadPromoCampaignsForDomain(businessDomainConfig, activeTerminal?.modelType);
          const unitPrice = getProductPriceByTier(prod, selectedPriceTier);
          const prodWithPrice = { ...prod, sell_price: unitPrice, price: unitPrice };
          setCart((prev) => {
            const idx = prev.findIndex(
              (it) =>
                it.product.id === prod.id &&
                !it.modifiers &&
                it.selectedFashionSize === matchedCell.size &&
                it.selectedFashionColor === matchedCell.color
            );
            const next =
              idx >= 0
                ? prev.map((it, i) => (i === idx ? { ...it, quantity: it.quantity + 1 } : it))
                : [
                    ...prev,
                    {
                      product: prodWithPrice,
                      quantity: 1,
                      subtotal: unitPrice,
                      originalUnitPrice: unitPrice,
                      itemDiscount: 0,
                      selectedUnit: prod.unit || 'Pcs',
                      selectedFashionSize: matchedCell.size,
                      selectedFashionColor: matchedCell.color,
                    },
                  ];
            return recalculatePosCart(next, campaigns);
          });
          playScannerBeep();
          showToast(`+${prod.name} (${matchedCell.size} • ${matchedCell.color}) ditambahkan!`);
          setBarcodeInput('');
          focusBarcodeInput();
          return;
        }
      }
    }

    for (const prod of searchPool) {
      const uoms = getProductUomOptions(prod);
      const secondaryUom = uoms.find((u) => u.conversionFactor > 1 && u.barcode && u.barcode.toLowerCase() === q.toLowerCase());
      if (secondaryUom || (prod.variantBarcode && prod.variantBarcode.toLowerCase() === q.toLowerCase())) {
        const chosenUom = secondaryUom || uoms[1] || uoms[0];
        const conversionFactor = chosenUom.conversionFactor;
        const baseStock = prod.stock ?? 0;
        const requiredBaseQty = 1 * conversionFactor;
        if (requiredBaseQty > baseStock) {
          showToast(`⚠️ Peringatan: Stok dasar (${baseStock}) tidak mencukupi untuk kemasan ${chosenUom.unit} (${requiredBaseQty} base units)!`, 'warning');
        }
        const costPricePerUnit = Number(prod.cost_price || prod.costPrice || 0);
        const minSafeUnitPrice = costPricePerUnit * conversionFactor;
        const finalPrice = Math.max(chosenUom.price, minSafeUnitPrice);

        setCart((prev) => {
          const existingIdx = prev.findIndex((it) => it.product.id === prod.id && it.selectedUnit === chosenUom.unit && !it.modifiers);
          const next = existingIdx >= 0
            ? prev.map((it, i) => i === existingIdx ? { ...it, quantity: it.quantity + 1, subtotal: Math.round(finalPrice * (it.quantity + 1)) } : it)
            : [...prev, {
                product: prod,
                quantity: 1,
                subtotal: finalPrice,
                originalUnitPrice: finalPrice,
                itemDiscount: 0,
                selectedUnit: chosenUom.unit,
                conversionFactor,
              }];
          return recalculatePosCart(next);
        });
        playScannerBeep();
        showToast(`📦 Kemasan [${chosenUom.unit}] terdeteksi: +1 ${chosenUom.unit} (${conversionFactor} Pcs) • Rp ${finalPrice.toLocaleString('id-ID')}`, 'success');
        setBarcodeInput('');
        focusBarcodeInput();
        return;
      }
    }

    const match = searchPool.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === q.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase() === q.toLowerCase()) ||
        (p.plu && p.plu.toLowerCase() === q.toLowerCase()) ||
        (p.id && p.id.toLowerCase() === q.toLowerCase()) ||
        (p.name && p.name.toLowerCase() === q.toLowerCase())
    );

    const openOrAddMatched = (targetProd: Product) => {
      if (targetProd.variantMatrix && targetProd.variantMatrix.length > 0) {
        setVariantPickerState({ product: targetProd, mode: 'ADD' });
      } else {
        handleAddToCart(targetProd, 1);
      }
    };

    if (match) {
      openOrAddMatched(match);
      setBarcodeInput('');
      focusBarcodeInput();
    } else {
      const partial = searchPool.find(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q.toLowerCase())) ||
          (p.sku && p.sku.toLowerCase().includes(q.toLowerCase())) ||
          (p.plu && p.plu.toLowerCase().includes(q.toLowerCase())) ||
          (p.barcode && p.barcode.includes(q))
      );
      if (partial) {
        openOrAddMatched(partial);
      } else {
        showToast(`Produk [${q}] tidak ditemukan di master data!`);
      }
      setBarcodeInput('');
      focusBarcodeInput();
    }
  };

  const getItemVariant = (item: CartItem): string => {
    if (!item?.product) return '';
    if (item.selectedFashionSize || item.selectedFashionColor) {
      return `${item.selectedFashionSize || 'M'} • ${item.selectedFashionColor || 'Sage'}`;
    }
    let val = item.modifiers?.variant;
    if (!val && item.modifiers?.orderType) {
      const m = item.modifiers;
      const tNum = (m.tableNumber || '01').toLowerCase().includes('meja') ? m.tableNumber : `Meja ${m.tableNumber || '01'}`;
      val = m.orderType === 'Take-Away' ? 'Take-Away' : `Dine-In • ${tNum}`;
    } else if (!val && item.product.size && item.product.size.toLowerCase() !== (item.product.unit || '').toLowerCase()) {
      val = item.product.size;
    }
    return val || '';
  };

  const handleSaveEditedItem = (
    newQty: number,
    newItemDiscount: number,
    newVariant: string,
    discountMeta?: { reason?: string; authorizedBy?: string }
  ) => {
    if (editingItemIndex === null || editingItemIndex >= cart.length) return;
    setCart((prev) => {
      const next = [...prev];
      const target = { ...next[editingItemIndex] };
      const isManualOverride = newItemDiscount !== (target.itemDiscount || 0) || Boolean(discountMeta?.reason);
      target.quantity = newQty;
      if (target.modifiers || newVariant.trim()) {
        target.modifiers = { ...target.modifiers, variant: newVariant };
      }
      if (isManualOverride) {
        target.itemDiscount = newItemDiscount;
        target.promoSavings = newItemDiscount * newQty;
        target.promoCode = undefined;
        target.promoSourceType = undefined;
        target.promoMechanic = undefined;
        target.promoBadge = newItemDiscount > 0 ? '[MANUAL DISC]' : undefined;
        target.manualDiscountReason = newItemDiscount > 0 ? discountMeta?.reason : undefined;
        target.manualDiscountAuthorizedBy = newItemDiscount > 0 ? discountMeta?.authorizedBy : undefined;
        target.freeBonusQty = 0;
        target.freeBonusLabel = undefined;
        target.promoHint = undefined;
        target.subtotal = Math.round(Math.max(0, target.product.sell_price - newItemDiscount) * newQty);
      }
      next[editingItemIndex] = target;
      return recalculatePosCart(next);
    });
    if (discountMeta?.reason) {
      addAuditLog({
        action: `[DISKON MANUAL ITEM POS] Rp ${newItemDiscount.toLocaleString('id-ID')}/unit • Alasan: ${discountMeta.reason} • Otorisasi: ${discountMeta.authorizedBy || 'Kasir Mandiri'}`,
        module: 'POS / Kasir',
        user: activeUser?.name || 'Kasir',
      });
    }
    setEditingItemIndex(null);
    showToast('Item belanja diperbarui');
  };

  const fnbCategories = useMemo(() => {
    if (showAllCategories) {
      const cats = new Set<string>();
      activeProducts.forEach((p) => { if (p.category) cats.add(p.category); });
      return ['ALL', ...Array.from(cats)];
    }
    return ['ALL', 'Kopi & Espresso', 'Non-Kopi', 'Makanan', 'Snack'];
  }, [activeProducts, showAllCategories]);

  const filteredFnbProducts = useMemo(() => {
    const fnbFromActive = activeProducts.filter(
      (p) =>
        (isFnbMode ||
          p.itemType === 'MENU_FB' ||
          p.businessModel === 'fnb' ||
          (p.id || '').toUpperCase().includes('FNB')) &&
        p.itemType !== 'RAW_MATERIAL' &&
        !(p.id || '').startsWith('RM-FNB-') &&
        !(p.id || '').startsWith('ING-') &&
        !(p.id || '').toUpperCase().includes('-FNB-R')
    );

    const mergedMap = new Map<string, Product>();
    // Prioritaskan katalog aktif F&B (termasuk paket demo FNB) agar tampil di urutan teratas
    fnbFromActive.forEach((item) => {
      mergedMap.set(item.id, item);
    });
    FNB_MENU_ITEMS.forEach((item) => {
      if (!mergedMap.has(item.id)) mergedMap.set(item.id, item);
    });
    FNB_RESTAURANT_PRODUCTS.forEach((item) => {
      if (!mergedMap.has(item.id)) mergedMap.set(item.id, item);
    });

    const fullFnbCatalog = Array.from(mergedMap.values());
    const sourceList = showAllCategories && isHybridMode ? [...fullFnbCatalog, ...activeProducts.filter((p) => !mergedMap.has(p.id))] : fullFnbCatalog;

    return sourceList.filter((product) => {
      if (
        product.itemType === 'RAW_MATERIAL' ||
        (product.id || '').startsWith('RM-FNB-') ||
        (product.id || '').startsWith('ING-') ||
        (product.id || '').toUpperCase().includes('-FNB-R')
      ) {
        return false;
      }
      const cat = (product.category || '').toLowerCase();
      const nameLower = (product.name || '').toLowerCase();
      const selCat = selectedFnbCategory.toLowerCase();
      const matchCat =
        selectedFnbCategory === 'ALL' ||
        product.category === selectedFnbCategory ||
        (selCat.includes('kopi & espresso') &&
          ((cat.includes('kopi') && !cat.includes('non-kopi')) ||
            cat.includes('espresso') ||
            cat.includes('coffee') ||
            nameLower.includes('kopi') ||
            nameLower.includes('espresso') ||
            nameLower.includes('latte') ||
            nameLower.includes('cappuccino') ||
            nameLower.includes('americano'))) ||
        (selCat === 'non-kopi' &&
          (cat.includes('non-kopi') ||
            cat.includes('segar') ||
            cat.includes('juice') ||
            cat.includes('jus') ||
            cat.includes('teh') ||
            (cat.includes('minuman') && !cat.includes('kopi')))) ||
        (selCat === 'makanan' &&
          (cat.includes('makanan') ||
            cat.includes('mi &') ||
            cat.includes('mie') ||
            cat.includes('bakso') ||
            cat.includes('sup') ||
            cat.includes('soto') ||
            cat.includes('paket') ||
            cat.includes('rice') ||
            cat.includes('nasi'))) ||
        (selCat === 'snack' &&
          (cat.includes('snack') ||
            cat.includes('camilan') ||
            cat.includes('pastry') ||
            cat.includes('bakery') ||
            cat.includes('pelengkap') ||
            cat.includes('dessert') ||
            cat.includes('kue')));

      const matchSearch =
        !fnbSearchQuery ||
        product.name.toLowerCase().includes(fnbSearchQuery.toLowerCase()) ||
        product.id.toLowerCase().includes(fnbSearchQuery.toLowerCase()) ||
        (product.category || '').toLowerCase().includes(fnbSearchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [isFnbMode, activeProducts, showAllCategories, isHybridMode, selectedFnbCategory, fnbSearchQuery]);

  const subtotalBeforePromo = useMemo(
    () =>
      cart.reduce((acc, item) => {
        const unitGross = item?.originalUnitPrice ?? (item?.isRetailUnit && item?.product?.priceSecondary ? item.product.priceSecondary : item?.product?.sell_price || 0);
        const totalUnitsValued = (item?.quantity || 0) + (item?.freeBonusQty || 0);
        return acc + Math.round(unitGross * totalUnitsValued);
      }, 0),
    [cart]
  );
  const totalPromoSavings = useMemo(
    () =>
      cart.reduce((acc, item) => {
        const lineSavings = item?.promoSavings ?? ((item?.itemDiscount || 0) * (item?.quantity || 0));
        return acc + Math.round(lineSavings);
      }, 0),
    [cart]
  );
  const totalFreeBonusCount = useMemo(
    () => cart.reduce((acc, item) => acc + (item?.freeBonusQty || 0), 0),
    [cart]
  );
  const pwpOffers = useMemo(
    () => (isFnbTerminal ? [] : getAvailablePwpOffers(cart, activeProducts, domainPromoCampaigns)),
    [cart, activeProducts, isFnbTerminal, domainPromoCampaigns]
  );
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item?.subtotal || 0), 0), [cart]);
  const calculatedDiscount = useMemo(() => (discountType === 'PERCENT' ? Math.round((subtotal * discountPercent) / 100) : Math.min(subtotal, discountAmount)), [subtotal, discountType, discountPercent, discountAmount]);
  const totalAllDiscounts = useMemo(() => totalPromoSavings + calculatedDiscount, [totalPromoSavings, calculatedDiscount]);
  const taxAmount = useMemo(() => (isTaxIncluded ? Math.round(Math.max(0, subtotal - calculatedDiscount) * 0.11) : 0), [subtotal, calculatedDiscount, isTaxIncluded]);
  const activeShippingFee = deliveryPolicy === 'FRANGKO' || deliveryMethod === 'FLEET_DELIVERY' ? Math.max(0, Number(shippingFee) || 0) : 0;
  const rawGrandTotal = useMemo(() => Math.max(0, subtotal - calculatedDiscount + taxAmount + activeShippingFee), [subtotal, calculatedDiscount, taxAmount, activeShippingFee]);
  const cashRoundingDiff = useMemo(() => (paymentMethod === 'CASH' ? Math.round(rawGrandTotal / 100) * 100 - rawGrandTotal : 0), [rawGrandTotal, paymentMethod]);
  const grandTotal = useMemo(() => (paymentMethod === 'CASH' ? Math.round(rawGrandTotal / 100) * 100 : rawGrandTotal), [rawGrandTotal, paymentMethod]);
  const changeAmount = useMemo(() => (paymentMethod === 'CASH' ? Math.max(0, cashGiven - grandTotal) : 0), [cashGiven, grandTotal, paymentMethod]);
  const totalCartItemCount = useMemo(() => cart.reduce((acc, i) => acc + (i?.quantity || 0), 0), [cart]);

  const splitTotalEntered = useMemo(
    () => Math.max(0, Math.round((Number(splitCashAmount) || 0) + (Number(splitNonCashAmount) || 0))),
    [splitCashAmount, splitNonCashAmount]
  );
  const splitShortfall = useMemo(
    () => Math.max(0, grandTotal - splitTotalEntered),
    [grandTotal, splitTotalEntered]
  );
  const isSplitReadyToPay = useMemo(
    () => grandTotal > 0 && splitShortfall === 0,
    [grandTotal, splitShortfall]
  );
  const effectiveKasbonDp = useMemo(
    () =>
      Math.max(
        0,
        Math.min(
          grandTotal,
          Math.round(
            Number(
              isLaundryTerminal && laundryPaymentStatus === 'DP' && kasbonDpAmount === 0
                ? laundryDpAmount
                : kasbonDpAmount
            ) || 0
          )
        )
      ),
    [grandTotal, isLaundryTerminal, laundryPaymentStatus, laundryDpAmount, kasbonDpAmount]
  );
  const kasbonRemainingPiutang = useMemo(
    () => Math.max(0, grandTotal - effectiveKasbonDp),
    [grandTotal, effectiveKasbonDp]
  );
  const kasbonDefaultDueInfo = useMemo(() => {
    const due = new Date();
    due.setDate(due.getDate() + 14);
    const iso = due.toISOString().slice(0, 10);
    const display = due.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return { iso, display, tempoDays: 14 };
  }, []);
  const resolvedTopBarCustomerName = useMemo(
    () =>
      (
        selectedCustomer?.name ||
        (isLaundryTerminal && laundryCustomerName.trim() ? laundryCustomerName.trim() : '') ||
        customerSearchQuery.trim()
      ).trim(),
    [selectedCustomer?.name, isLaundryTerminal, laundryCustomerName, customerSearchQuery]
  );

  const handleSelectSplitPayment = () => {
    setPaymentMethod('SPLIT');
    if (grandTotal > 0 && splitCashAmount === 0 && splitNonCashAmount === 0) {
      const defaultCash = Math.floor(grandTotal / 2);
      setSplitCashAmount(defaultCash);
      setSplitNonCashAmount(grandTotal - defaultCash);
    }
  };

  const handleSelectKasbonPayment = () => {
    if (!isKasbonAllowedForSector) return;
    setPaymentMethod('KREDIT / TEMPO (AR)');
    if (isLaundryTerminal) {
      setLaundryPaymentStatus(effectiveKasbonDp > 0 ? 'DP' : 'BAYAR_AMBIL');
    }
    if (!resolvedTopBarCustomerName) {
      setTimeout(() => {
        const el = document.getElementById('pos-top-customer-search-input') as HTMLInputElement | null;
        if (el) el.focus();
      }, 40);
    }
  };

  const fashionAdvisorCommission = useMemo(() => {
    if (!selectedFashionAdvisor) return 0;
    const rate = Number(selectedFashionAdvisor.fashionCommissionRate ?? 2) || 0;
    return Math.round((grandTotal * rate) / 100);
  }, [selectedFashionAdvisor, grandTotal]);

  const handleApplyQuickFashionNoteDiscount = () => {
    const rawVal = Math.max(0, Number(quickDiscVal) || 0);
    if (rawVal <= 0) {
      setDiscountType('PERCENT');
      setDiscountPercent(0);
      setDiscountAmount(0);
      setManualDiscountReason('');
      setManualDiscountAuthorizedBy('');
      setIsQuickFashionDiscOpen(false);
      showToast('Diskon manual nota dihapus.');
      return;
    }
    const effPct =
      quickDiscType === 'PERCENT'
        ? Math.min(100, rawVal)
        : subtotal > 0
        ? (rawVal / subtotal) * 100
        : 100;
    const needsSpv = effPct > 15;
    if (needsSpv && !quickDiscSpvName) {
      const spvMap: Record<string, string> = {
        '1234': 'Spv. Hendra (Store Supervisor)',
        '8888': 'Spv. Bambang (Area Manager)',
      };
      const matchedSpv = spvMap[quickDiscPin.trim()];
      if (!matchedSpv) {
        setQuickDiscPinError('Diskon > 15% wajib PIN Supervisor (1234 / 8888).');
        return;
      }
      setQuickDiscSpvName(matchedSpv);
    }
    const approver = needsSpv
      ? quickDiscSpvName ||
        (quickDiscPin.trim() === '8888'
          ? 'Spv. Bambang (Area Manager)'
          : 'Spv. Hendra (Store Supervisor)')
      : 'Kasir Mandiri (≤ 15%)';

    setDiscountType(quickDiscType);
    if (quickDiscType === 'PERCENT') {
      setDiscountPercent(Math.min(100, rawVal));
    } else {
      setDiscountAmount(rawVal);
    }
    setManualDiscountReason(quickDiscReason);
    setManualDiscountAuthorizedBy(approver);
    setQuickDiscPinError(null);
    setIsQuickFashionDiscOpen(false);
    addAuditLog({
      action: `[DISKON NOTA BUTIK] ${quickDiscType === 'PERCENT' ? `${rawVal}%` : `Rp ${rawVal.toLocaleString('id-ID')}`} • Alasan: ${quickDiscReason} • Otorisasi: ${approver}`,
      module: 'POS / Kasir',
      user: activeUser?.name || 'Kasir',
    });
    showToast(`Diskon nota diterapkan (${approver})`, 'success');
  };

  const handleTerminalCardClick = (term: Terminal) => {
    const requestedStationCode = normalizeStationCode(term.stationCode || term.id || term.code);
    if (assignedCashierStationCode && requestedStationCode !== assignedCashierStationCode) {
      showToast(
        `1 Akun Kasir = 1 Loket Terikat: Akun ${sessionOperator?.name || 'Kasir'} hanya diizinkan membuka loket ${assignedCashierStationCode}.`,
        'warning'
      );
      return;
    }

    const targetStationCode = assignedCashierStationCode || requestedStationCode;
    const matchingStation = activeStations.find((s) => s.stationCode === targetStationCode);
    const isBoundHere = Boolean(
      boundStation && activeStations.some((s) => s.stationCode === boundStation.stationCode)
    );

    if (
      !assignedCashierStationCode &&
      isBoundHere &&
      boundStation &&
      boundStation.stationCode !== targetStationCode
    ) {
      showToast(
        `Perangkat ini terkunci pada loket ${boundStation.stationCode}. Klik "Lepas Kunci Perangkat" terlebih dahulu untuk pindah loket.`,
        'warning'
      );
      return;
    }

    bindPosStation({
      stationCode: targetStationCode,
      stationName: term.name,
      posType: matchingStation?.posType || term.posType,
      boundAt: new Date().toISOString(),
      boundBy: (currentUser || activeUser)?.name || 'Kasir',
    });

    const unlockedTerm: Terminal = {
      ...term,
      id: targetStationCode,
      stationCode: targetStationCode,
      code: targetStationCode,
      isLocked: false,
    };

    setReceiptNumber(peekStationReceiptNumber(targetStationCode));
    setActiveTerminal(unlockedTerm);
    setHasExplicitLobbyReturn(false);

    const stationShift = getOpenShiftForStation(targetStationCode);
    if (!stationShift) {
      setIsOpenShiftModalOpen(true);
    } else {
      setIsRegisterOpen(true);
    }
  };

  const handleSwitchDeviceStation = (targetCard: PosIdentityCard) => {
    if (!canManageStationBinding) {
      showToast(
        `1 Akun Kasir = 1 Loket Terikat: Hanya Executive Manager atau SuperAdmin yang dapat memindahkan loket PC.`,
        'warning'
      );
      setIsStationPickerOpen(false);
      return;
    }
    const targetCode = targetCard.stationCode;
    const matchingStation = activeStations.find((s) => s.stationCode === targetCode);

    bindPosStation({
      stationCode: targetCode,
      stationName: targetCard.posName,
      posType: matchingStation?.posType,
      boundAt: new Date().toISOString(),
      boundBy: (currentUser || activeUser)?.name || 'Kasir',
    });

    const switchedTerm: Terminal = {
      id: targetCode,
      stationCode: targetCode,
      name: targetCard.posName,
      code: targetCode,
      location: targetCard.posTypeLabel,
      isActive: true,
      activeOrdersToday: 0,
      businessModel: targetCard.posTypeLabel,
      businessType: targetCard.posTypeLabel,
      modelType: targetCard.modelType,
      isLocked: false,
      role: targetCard.isHybrid ? 'HYBRID_BACKEND' : 'FRONT_END_ONLY',
      terminalType: targetCard.isHybrid ? 'BACK_END' : 'FRONT_END',
    };

    setReceiptNumber(peekStationReceiptNumber(targetCode));
    setActiveTerminal(switchedTerm);
    setHasExplicitLobbyReturn(true);
    setIsRegisterOpen(false);
    setIsStationPickerOpen(false);
    showToast(`Perangkat dipindahkan ke loket ${targetCode} (${targetCard.posTypeLabel}).`, 'success');
  };

  const handleCashierLogout = () => {
    setHasExplicitLobbyReturn(true);
    setIsRegisterOpen(false);
    setIsFullscreen(false);
    showToast('Kembali ke Lobby Terminal POS.');
  };

  const handleHoldOrderFromModal = () => {
    if (cart.length === 0) return;
    setIsPaymentConfirmOpen(false);
    setIsHoldCartModalOpen(true);
  };

  const resolvedFleetLabel =
    selectedFleetType === 'DUMP_TRUCK'
      ? 'Dump Truck (±6.5 m³)'
      : selectedFleetType === 'TRUCK_ENGKEL'
      ? 'Truk Engkel (±3.0 m³)'
      : 'Pick-up (±1.2 m³)';

  const buildingCartAccounting = useMemo(() => {
    const isFleetOrder = deliveryFleetActive || deliveryMethod === 'FLEET_DELIVERY' || deliveryPolicy === 'FRANGKO';
    const itemsBelowMarginFloor = cart.filter(
      (item) => (isBuildingTerminal || isBuildingMaterialProduct(item.product)) && Boolean(item.isMarginBelowFloor)
    );
    const hasMarginViolation = itemsBelowMarginFloor.length > 0;
    const isCheckoutLockedByMargin = hasMarginViolation && !posMarginFloorAuthorized;

    const loadingFeeAmt = calculateBuildingLoadingFeeTotal(cart);
    const fleetExpenseAmt = estimateFleetDeliveryExpense(selectedFleetType, deliveryPolicy, isFleetOrder);
    const fleetDeliveryCostAmt =
      isBuildingTerminal || isFleetOrder ? fleetExpenseAmt : 0;

    const totalMaterialCogs = cart.reduce((acc, item) => {
      const unitCogs =
        item.costPrice !== undefined && item.costPrice > 0
          ? item.costPrice
          : Number(item.product?.cost_price) > 0
          ? Number(item.product.cost_price)
          : Math.round((Number(item.product?.sell_price) || 0) * 0.78);
      return acc + Math.round(unitCogs * (item.quantity || 1));
    }, 0);

    const materialRevenueAmt = Math.max(0, grandTotal - loadingFeeAmt);
    const grossProfitMaterial = materialRevenueAmt - totalMaterialCogs;
    const netProfitAfterShipping = grossProfitMaterial + loadingFeeAmt - fleetDeliveryCostAmt;
    const totalCubicDeductionM3 = Number(
      cart.reduce((acc, item) => acc + (item.cubicDeductionM3 || 0), 0).toFixed(2)
    );

    return {
      itemsBelowMarginFloor,
      hasMarginViolation,
      isCheckoutLockedByMargin,
      loadingFeeAmt,
      fleetDeliveryCostAmt,
      fleetExpenseLabel: resolvedFleetLabel,
      totalMaterialCogs,
      materialRevenueAmt,
      grossProfitMaterial,
      netProfitAfterShipping,
      totalCubicDeductionM3,
    };
  }, [
    cart,
    isBuildingTerminal,
    posMarginFloorAuthorized,
    deliveryFleetActive,
    deliveryMethod,
    deliveryPolicy,
    selectedFleetType,
    grandTotal,
    resolvedFleetLabel,
  ]);

  const handleAutoFixCartSafeMargin = () => {
    setCart((prev) =>
      prev.map((item) => {
        if (!item.isMarginBelowFloor) return item;
        const unitCost =
          item.costPrice !== undefined && item.costPrice > 0
            ? item.costPrice
            : Number(item.product?.cost_price) > 0
            ? Number(item.product.cost_price)
            : Math.round((Number(item.product?.sell_price) || 0) * 0.78);
        const safePrice = getMinSafeSellingPrice(unitCost, 3);
        const evalSafe = evaluateTierMarginGuard(safePrice, unitCost, 3);
        return {
          ...item,
          product: { ...item.product, sell_price: Math.max(item.product.sell_price, safePrice) },
          customPrice: safePrice,
          itemDiscount: Math.max(0, (item.product.sell_price || safePrice) - safePrice),
          subtotal: Math.round(safePrice * item.quantity),
          grossMarginPercent: evalSafe.marginPercent,
          isMarginBelowFloor: false,
        };
      })
    );
    showToast('Harga item telah disesuaikan otomatis ke batas aman Margin ≥ 3% di atas HPP.');
  };

  const handleQrisPaymentSuccess = () => {
    if (buildingCartAccounting.isCheckoutLockedByMargin) {
      showToast('⚠️ Transaksi dikunci! Terdapat item dengan harga di bawah HPP atau Margin < 3%. Aktifkan Otorisasi Khusus atau sesuaikan harga.', 'warning');
      return;
    }
    setIsQrisModalOpen(false);
    const isFleetOrder = deliveryFleetActive || deliveryMethod === 'FLEET_DELIVERY' || deliveryPolicy === 'FRANGKO';
    const committedReceiptNumber = commitStationReceiptNumber(activeStationCode);
    const isLaundryDeferred = isLaundryTerminal && laundryPaymentStatus !== 'LUNAS_AWAL';
    const resolvedPaidQris = isLaundryTerminal
      ? laundryPaymentStatus === 'BAYAR_AMBIL'
        ? 0
        : laundryPaymentStatus === 'DP'
        ? Math.max(0, Math.min(grandTotal, Number(laundryDpAmount) || 0))
        : grandTotal
      : grandTotal;
    const resolvedRemainingQris = Math.max(0, grandTotal - resolvedPaidQris);
    const laundryTagCode = `TAG-${String(committedReceiptNumber).replace(/[^A-Z0-9]/gi, '').slice(-4)}`;
    const resolvedLaundryCustName =
      selectedCustomer?.name ||
      (isFnbModeActive && fnbCustomerName.trim() ? fnbCustomerName.trim() : undefined) ||
      (isLaundryTerminal && laundryCustomerName.trim() ? laundryCustomerName.trim() : undefined);
    const resolvedLaundryCustPhone =
      selectedCustomer?.phone ||
      (isLaundryTerminal && laundryCustomerPhone.trim() ? laundryCustomerPhone.trim() : undefined);

    processPayment({
      items: cart,
      total: grandTotal,
      paymentMethod: 'QRIS',
      cashTendered: resolvedPaidQris,
      changeDue: 0,
      shiftId: activeStationShift?.status === 'OPEN' ? activeStationShift.id : undefined,
      customerId: selectedCustomer?.id,
      customerName: resolvedLaundryCustName,
      customerPhone: resolvedLaundryCustPhone,
      timestamp: new Date().toISOString(),
      terminalId: activeStationCode,
      stationCode: activeStationCode,
      businessType: activeTerminal.businessType || activeTerminal.businessModel || activeTerminal.modelType,
      receiptNumber: committedReceiptNumber,
      cashierName: activeUser?.name || 'Kasir',
      subtotalBeforeDiscount: subtotalBeforePromo,
      discount: totalAllDiscounts,
      promoSavingsTotal: totalPromoSavings,
      cartVoucherDiscount: calculatedDiscount,
      fnbOrderMode: isFnbModeActive ? fnbOrderMode : undefined,
      fnbTableNo: isFnbModeActive && fnbOrderMode === 'Dine-In' ? fnbTableNo : undefined,
      vehiclePlate,
      mechanicName,
      stylistId: selectedServiceStylist?.id,
      stylistName: selectedServiceStylist?.name || stylistName,
      stylistCommissionRate: selectedServiceStylist?.commissionRate,
      serviceCommissionTotal: serviceCartCommissionSummary?.totalCommission || undefined,
      petOrClientName,
      deliveryFleetActive: isFleetOrder,
      deliveryPolicy,
      fleetType: isFleetOrder ? selectedFleetType : undefined,
      fleetVehicleName: isFleetOrder ? resolvedFleetLabel : undefined,
      deliveryDestination: deliveryDestination || selectedCustomer?.store_address,
      shippingFee: activeShippingFee,
      loadingFee: buildingCartAccounting.loadingFeeAmt,
      materialRevenue: buildingCartAccounting.materialRevenueAmt,
      fleetDeliveryCost: buildingCartAccounting.fleetDeliveryCostAmt,
      netProfitAfterShipping: buildingCartAccounting.netProfitAfterShipping,
      dpAmount: isLaundryDeferred ? resolvedPaidQris : undefined,
      remainingBalance: resolvedRemainingQris,
      priceTier: getActiveTransactionPriceTierLabel(),
      isContractorMode,
      fashionAdvisorId: selectedFashionAdvisor?.id,
      fashionAdvisorName: selectedFashionAdvisor?.name,
      fashionAdvisorCommission: selectedFashionAdvisor ? fashionAdvisorCommission : undefined,
      manualDiscountReason: manualDiscountReason || undefined,
      manualDiscountAuthorizedBy: manualDiscountAuthorizedBy || undefined,
      ...(isLaundryTerminal
        ? {
            isLaundryOrder: true,
            laundryTotalPieces: Math.max(1, laundryTotalPieces || 1),
            laundryConditionNotes: laundryConditionNotes.trim() || '-',
            laundryEstimatedDoneAt: computedLaundrySla.iso,
            laundrySlaLabel: computedLaundrySla.label,
            laundrySlaHours: computedLaundrySla.hours,
            laundryPaymentStatus,
            laundryBagTagCode: laundryTagCode,
            laundryRackNumber: stylistName.trim() || undefined,
            laundryWasherId: laundryWasherId || undefined,
            laundryWasherName: laundryStaffChoices.find((e) => e.id === laundryWasherId)?.name,
            laundrySpecialistId: laundrySpecialistId || undefined,
            laundrySpecialistName: laundryStaffChoices.find((e) => e.id === laundrySpecialistId)?.name,
          }
        : {}),
    });
    if (isFleetOrder) {
      setLastCompletedDoItems([...cart]);
      setLastDoReceiptNumber(committedReceiptNumber);
      setIsDoModalOpen(true);
    }
    setPosMarginFloorAuthorized(false);
    resetToNewTransaction();
    showToast(`Pembayaran QRIS Berhasil (${committedReceiptNumber})!`);
  };

  const handleDirectPayF10 = (
    overrideCashTendered?: number,
    overrideMethod?: string,
    creditMeta?: { dpAmount: number; tempoDays: number; dueDate: string; remainingBalance: number }
  ) => {
    if (cart.length === 0) {
      showToast('Keranjang belanja masih kosong!');
      return;
    }
    if (buildingCartAccounting.isCheckoutLockedByMargin) {
      showToast('⚠️ Transaksi dikunci! Terdapat item dengan harga di bawah HPP atau Margin < 3%. Aktifkan Otorisasi Khusus atau sesuaikan harga.', 'warning');
      return;
    }
    const totalTagihan = grandTotal;
    const effectiveMethod = overrideMethod || paymentMethod;
    const isSplitMode = effectiveMethod === 'SPLIT';
    const isCreditAr =
      !isSplitMode &&
      (effectiveMethod === 'KREDIT / TEMPO (AR)' ||
        effectiveMethod === 'KREDIT' ||
        effectiveMethod === 'KASBON' ||
        effectiveMethod === 'AR_CREDIT');
    const isLaundryDeferred =
      !isSplitMode && isLaundryTerminal && (laundryPaymentStatus !== 'LUNAS_AWAL' || isCreditAr);

    if (isSplitMode) {
      const enteredCash = Math.max(0, Math.round(Number(splitCashAmount) || 0));
      const enteredNonCash = Math.max(0, Math.round(Number(splitNonCashAmount) || 0));
      if (enteredCash + enteredNonCash < totalTagihan) {
        const kurang = totalTagihan - (enteredCash + enteredNonCash);
        showToast(
          `⚠️ Nominal Split Payment belum lunas 100%! Masih kurang Rp ${kurang.toLocaleString('id-ID')}.`,
          'warning'
        );
        return;
      }
    }

    const resolvedCustomerNameForOrder =
      selectedCustomer?.name ||
      (isLaundryTerminal && laundryCustomerName.trim() ? laundryCustomerName.trim() : '') ||
      customerSearchQuery.trim();

    if ((isCreditAr || isLaundryDeferred) && !resolvedCustomerNameForOrder) {
      showToast(
        '⚠️ Wajib mengisi / memilih Nama Pelanggan di bar atas untuk transaksi Kasbon / DP!',
        'warning'
      );
      const topInput = document.getElementById('pos-top-customer-search-input') as HTMLInputElement | null;
      if (topInput) {
        topInput.focus();
      }
      return;
    }

    const selectedPaymentMethod = isSplitMode
      ? 'SPLIT'
      : isCreditAr || isLaundryDeferred
      ? 'KREDIT / TEMPO (AR)'
      : effectiveMethod === 'QRIS'
      ? 'QRIS'
      : effectiveMethod === 'EDC_DEBIT'
      ? 'Debit'
      : 'Tunai';
    const effectiveGiven = overrideCashTendered !== undefined ? overrideCashTendered : cashGiven;

    let cashTendered = totalTagihan;
    let remainingBalanceVal = 0;
    let splitCashFinal: number | undefined = undefined;
    let splitNonCashFinal: number | undefined = undefined;

    if (isSplitMode) {
      const rawNonCash = Math.max(0, Math.min(totalTagihan, Math.round(Number(splitNonCashAmount) || 0)));
      const rawCash = Math.max(0, Math.round(Number(splitCashAmount) || 0));
      splitNonCashFinal = rawNonCash;
      splitCashFinal = Math.max(0, totalTagihan - rawNonCash);
      cashTendered = rawCash + rawNonCash;
      remainingBalanceVal = 0;
    } else if (isCreditAr) {
      cashTendered = Math.max(
        0,
        Math.min(
          totalTagihan,
          Number(creditMeta?.dpAmount ?? effectiveKasbonDp) || 0
        )
      );
      remainingBalanceVal =
        creditMeta?.remainingBalance ?? Math.max(0, totalTagihan - cashTendered);
    } else if (isLaundryDeferred) {
      if (laundryPaymentStatus === 'BAYAR_AMBIL' && effectiveKasbonDp === 0) {
        cashTendered = 0;
        remainingBalanceVal = totalTagihan;
      } else {
        cashTendered = Math.max(
          0,
          Math.min(
            totalTagihan,
            Number(creditMeta?.dpAmount ?? (kasbonDpAmount > 0 ? kasbonDpAmount : laundryDpAmount)) || 0
          )
        );
        remainingBalanceVal = Math.max(0, totalTagihan - cashTendered);
      }
    } else if (effectiveMethod === 'CASH') {
      cashTendered = effectiveGiven > 0 ? effectiveGiven : totalTagihan;
      if (cashTendered < totalTagihan) {
        setIsCashUnderpaid(true);
        showToast(`❌ Uang diterima (Rp ${cashTendered.toLocaleString('id-ID')}) kurang dari Total!`);
        focusCashInput();
        return;
      }
    }

    setIsCashUnderpaid(false);
    const changeDue =
      isSplitMode
        ? Math.max(0, cashTendered - totalTagihan)
        : !isCreditAr && !isLaundryDeferred && effectiveMethod === 'CASH'
        ? Math.max(0, cashTendered - totalTagihan)
        : 0;
    const isFleetOrder = deliveryFleetActive || deliveryMethod === 'FLEET_DELIVERY' || deliveryPolicy === 'FRANGKO';
    const committedReceiptNumber = commitStationReceiptNumber(activeStationCode);
    const laundryTagCode = `TAG-${String(committedReceiptNumber).replace(/[^A-Z0-9]/gi, '').slice(-4)}`;
    const resolvedCustName =
      (isFnbModeActive && fnbCustomerName.trim() ? fnbCustomerName.trim() : '') ||
      resolvedCustomerNameForOrder ||
      undefined;
    const resolvedCustPhone =
      selectedCustomer?.phone ||
      (isLaundryTerminal && laundryCustomerPhone.trim() ? laundryCustomerPhone.trim() : undefined);
    const resolvedLaundryStatusForSale: LaundryPaymentStatus =
      isCreditAr || isLaundryDeferred
        ? remainingBalanceVal > 0
          ? cashTendered > 0
            ? 'DP'
            : 'BAYAR_AMBIL'
          : 'LUNAS_AWAL'
        : 'LUNAS_AWAL';

    processPayment({
      items: cart,
      total: totalTagihan,
      paymentMethod: selectedPaymentMethod,
      cashTendered,
      changeDue,
      splitCashAmount: splitCashFinal,
      splitNonCashAmount: splitNonCashFinal,
      splitNonCashMethod: isSplitMode ? splitNonCashChannel : undefined,
      shiftId: activeStationShift?.status === 'OPEN' ? activeStationShift.id : undefined,
      customerId: selectedCustomer?.id || 'GUEST',
      customerName: resolvedCustName,
      customerPhone: resolvedCustPhone,
      timestamp: new Date().toISOString(),
      terminalId: activeStationCode,
      stationCode: activeStationCode,
      businessType: activeTerminal.businessType || activeTerminal.businessModel || activeTerminal.modelType,
      receiptNumber: committedReceiptNumber,
      cashierName: activeUser?.name || 'Kasir',
      subtotalBeforeDiscount: subtotalBeforePromo,
      discount: totalAllDiscounts,
      promoSavingsTotal: totalPromoSavings,
      cartVoucherDiscount: calculatedDiscount,
      fnbOrderMode: isFnbModeActive ? fnbOrderMode : undefined,
      fnbTableNo: isFnbModeActive && fnbOrderMode === 'Dine-In' ? fnbTableNo : undefined,
      vehiclePlate,
      mechanicName,
      stylistId: selectedServiceStylist?.id,
      stylistName: selectedServiceStylist?.name || stylistName,
      stylistCommissionRate: selectedServiceStylist?.commissionRate,
      serviceCommissionTotal: serviceCartCommissionSummary?.totalCommission || undefined,
      petOrClientName,
      deliveryFleetActive: isFleetOrder,
      deliveryPolicy,
      fleetType: isFleetOrder ? selectedFleetType : undefined,
      fleetVehicleName: isFleetOrder ? resolvedFleetLabel : undefined,
      deliveryDestination: deliveryDestination || selectedCustomer?.store_address,
      shippingFee: activeShippingFee,
      loadingFee: buildingCartAccounting.loadingFeeAmt,
      materialRevenue: buildingCartAccounting.materialRevenueAmt,
      fleetDeliveryCost: buildingCartAccounting.fleetDeliveryCostAmt,
      netProfitAfterShipping: buildingCartAccounting.netProfitAfterShipping,
      dpAmount: isCreditAr || isLaundryDeferred ? cashTendered : undefined,
      tempoDays:
        isCreditAr || isLaundryDeferred
          ? creditMeta?.tempoDays ?? kasbonDefaultDueInfo.tempoDays
          : undefined,
      dueDate:
        isCreditAr || isLaundryDeferred
          ? creditMeta?.dueDate ?? kasbonDefaultDueInfo.iso
          : undefined,
      remainingBalance: remainingBalanceVal,
      priceTier: getActiveTransactionPriceTierLabel(),
      isContractorMode,
      fashionAdvisorId: selectedFashionAdvisor?.id,
      fashionAdvisorName: selectedFashionAdvisor?.name,
      fashionAdvisorCommission: selectedFashionAdvisor ? fashionAdvisorCommission : undefined,
      manualDiscountReason: manualDiscountReason || undefined,
      manualDiscountAuthorizedBy: manualDiscountAuthorizedBy || undefined,
      ...(isLaundryTerminal
        ? {
            isLaundryOrder: true,
            laundryTotalPieces: Math.max(1, laundryTotalPieces || 1),
            laundryConditionNotes: laundryConditionNotes.trim() || '-',
            laundryEstimatedDoneAt: computedLaundrySla.iso,
            laundrySlaLabel: computedLaundrySla.label,
            laundrySlaHours: computedLaundrySla.hours,
            laundryPaymentStatus: resolvedLaundryStatusForSale,
            laundryBagTagCode: laundryTagCode,
            laundryRackNumber: stylistName.trim() || undefined,
            laundryWasherId: laundryWasherId || undefined,
            laundryWasherName: laundryStaffChoices.find((e) => e.id === laundryWasherId)?.name,
            laundrySpecialistId: laundrySpecialistId || undefined,
            laundrySpecialistName: laundryStaffChoices.find((e) => e.id === laundrySpecialistId)?.name,
          }
        : {}),
    });

    if (
      (isSplitMode && (splitCashFinal || 0) > 0) ||
      ((isCreditAr || isLaundryDeferred) && cashTendered > 0) ||
      (!isCreditAr && !isLaundryDeferred && (effectiveMethod === 'CASH' || selectedPaymentMethod === 'Tunai'))
    ) {
      triggerCashDrawer();
    }

    const isBuildingTrx =
      isFleetOrder ||
      isBuildingTerminal ||
      (isHybridMode && cart.some((c) => c.product.businessModel === 'building' || (c.product.id || '').startsWith('MAT-')));
    if (isBuildingTrx) {
      setLastCompletedDoItems([...cart]);
      setLastDoReceiptNumber(committedReceiptNumber);
      setIsDoModalOpen(true);
    }

    setPosMarginFloorAuthorized(false);
    showToast(
      isSplitMode
        ? `Split Payment Berhasil: Tunai Rp ${(splitCashFinal || 0).toLocaleString('id-ID')} + ${splitNonCashChannel} Rp ${(splitNonCashFinal || 0).toLocaleString('id-ID')} (${committedReceiptNumber})`
        : isCreditAr || isLaundryDeferred
        ? `Kasbon / DP Tercatat: DP Rp ${cashTendered.toLocaleString('id-ID')} • Sisa Piutang Rp ${remainingBalanceVal.toLocaleString('id-ID')} (${committedReceiptNumber})`
        : `Transaksi Berhasil (${committedReceiptNumber})`
    );
    setIsPaymentConfirmOpen(false);
    resetToNewTransaction();
  };

  const handleCashInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.code === 'Space' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      setCashGiven(grandTotal);
      setIsCashUnderpaid(false);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      focusBarcodeInput();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (cart.length === 0) return;
      if (paymentMethod === 'SPLIT' || paymentMethod === 'KREDIT / TEMPO (AR)' || (isLaundryTerminal && laundryPaymentStatus !== 'LUNAS_AWAL')) {
        handleDirectPayF10();
        return;
      }
      if (paymentMethod === 'CASH') {
        const inputNum = Number(e.currentTarget?.value) || 0;
        const effectiveCash = inputNum > 0 ? inputNum : cashGiven || grandTotal;
        setCashGiven(effectiveCash);
        if (effectiveCash < grandTotal) {
          setIsCashUnderpaid(true);
          focusCashInput();
          return;
        }
        setIsCashUnderpaid(false);
        handleDirectPayF10(effectiveCash);
      } else {
        handleDirectPayF10();
      }
    }
  };

  const handleManualBayarClick = () => {
    if (cart.length === 0) {
      showToast('Keranjang belanja masih kosong!');
      return;
    }
    if (paymentMethod === 'SPLIT' || paymentMethod === 'KREDIT / TEMPO (AR)' || (isLaundryTerminal && laundryPaymentStatus !== 'LUNAS_AWAL')) {
      handleDirectPayF10();
      return;
    }
    if (paymentMethod === 'CASH') {
      const effectiveCash = cashGiven > 0 ? cashGiven : grandTotal;
      setCashGiven(effectiveCash);
      if (effectiveCash < grandTotal) {
        setIsCashUnderpaid(true);
        focusCashInput();
        return;
      }
      setIsCashUnderpaid(false);
      handleDirectPayF10(effectiveCash);
    } else {
      handleDirectPayF10();
    }
  };

  const executeSaleCheckout = (
    overrideMethod?: string,
    creditMeta?: { dpAmount: number; tempoDays: number; dueDate: string; remainingBalance: number }
  ) => {
    const activeMethod = overrideMethod || paymentMethod;
    const isCredit =
      activeMethod === 'KREDIT / TEMPO (AR)' ||
      activeMethod === 'KREDIT' ||
      activeMethod === 'AR_CREDIT';
    const isLaundryDeferred = isLaundryTerminal && laundryPaymentStatus !== 'LUNAS_AWAL';
    handleDirectPayF10(
      isCredit || isLaundryDeferred
        ? creditMeta?.dpAmount ?? (laundryPaymentStatus === 'DP' ? laundryDpAmount : 0)
        : activeMethod === 'CASH'
        ? cashGiven > 0
          ? cashGiven
          : grandTotal
        : grandTotal,
      overrideMethod,
      creditMeta
    );
  };

  const isLight = theme === 'light';

  return (
    <div
      id="module-pos"
      className={`transition-all duration-200 ${
        isRegisterOpen
          ? `${
              isLaundryTerminal
                ? 'min-h-[calc(100vh-8.75rem)] flex flex-col overflow-y-auto'
                : 'h-[calc(100vh-8.75rem)] min-h-[520px] flex flex-col overflow-hidden'
            } rounded-2xl border p-2.5 sm:p-3 ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
            }`
          : isFullscreen
          ? 'space-y-3 relative p-3 sm:p-4 rounded-2xl bg-[#0d1117] text-white'
          : 'space-y-3 relative'
      }`}
    >
      {!isRegisterOpen ? (
        (() => {
          const lockedCode = assignedCashierStationCode || boundStation?.stationCode;
          const hasValidDeviceBinding = Boolean(
            lockedCode && activeStations.some((s) => s.stationCode === lockedCode)
          );
          const activeDeviceIdentity =
            visiblePosIdentities.find((item) =>
              assignedCashierStationCode
                ? item.stationCode === assignedCashierStationCode
                : hasValidDeviceBinding
                ? item.stationCode === boundStation?.stationCode
                : item.stationCode === activeStationCode
            ) || visiblePosIdentities[0];
          const singleActiveIdentities = activeDeviceIdentity ? [activeDeviceIdentity] : [];

          return (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div
                className={`px-3.5 py-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 transition-all duration-200 ${
                  isLight
                    ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] text-slate-900'
                    : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-mono font-normal text-xs shrink-0">
                    POS
                  </div>
                  <div>
                    <h2 className="text-base leading-6 font-medium tracking-tight">
                      {language === 'ID' ? 'Terminal Point of Sale' : 'Point of Sale Terminals'}
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Arsitektur: <strong className="text-emerald-600 dark:text-emerald-400">{getOperationalTopologyOption('NON_BLOCKING_ERP').shortLabel}</strong>
                      {' • '}
                      Loket Terikat: <strong className="font-mono text-cyan-600 dark:text-cyan-300">{activeDeviceIdentity?.stationCode || 'POS-01'}</strong>
                      {visiblePosIdentities.length > 1 ? ` (dari ${visiblePosIdentities.length} loket terdaftar)` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {(hasValidDeviceBinding || assignedCashierStationCode) && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] leading-4 font-mono font-semibold border flex items-center gap-1.5 ${
                        isLight
                          ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                          : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35'
                      }`}
                      title="Aturan 1 Akun Kasir = 1 Loket Terikat"
                    >
                      <Monitor className="w-3 h-3" />
                      <span>
                        {assignedCashierStationCode
                          ? `Akun Terikat: ${assignedCashierStationCode}`
                          : `PC Terikat: ${boundStation?.stationCode || activeStationCode}`}
                      </span>
                    </span>
                  )}

                  {canManageStationBinding && (visiblePosIdentities.length > 1 || hasValidDeviceBinding) && (
                    <button
                      type="button"
                      id="btn-switch-pc-station"
                      onClick={() => openPosMgmtPinPrompt({ type: 'SWITCH_STATION' })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] leading-4 font-semibold border flex items-center gap-1.5 cursor-pointer transition ${
                        isLight
                          ? 'bg-slate-100 hover:bg-cyan-50 text-slate-800 hover:text-cyan-800 border-slate-300 hover:border-cyan-400'
                          : 'bg-slate-800 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border-slate-700 hover:border-cyan-500/40'
                      }`}
                    >
                      <ArrowLeftRight className="w-3 h-3 text-cyan-500" />
                      <span>Ganti Loket PC</span>
                    </button>
                  )}

                  <div
                    className={`px-2.5 py-0.5 rounded-full text-[11px] leading-4 font-mono font-normal tracking-widest border flex items-center gap-1.5 select-none ${
                      isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{`${visiblePosIdentities.length} LOKET TERDAFTAR`}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5 w-full max-w-5xl mx-auto pt-2">
                {singleActiveIdentities.map((item) => {
                  const isSelected = activeTerminal?.id === item.stationCode || activeTerminal?.stationCode === item.stationCode;
                  const isHovered = hoveredTerminalId === item.stationCode;
                  const isFocused = isSelected || isHovered;
                  const isThisDeviceStation = hasValidDeviceBinding && boundStation?.stationCode === item.stationCode;

                  const termObj: Terminal = {
                    id: item.stationCode,
                    stationCode: item.stationCode,
                    name: item.posName,
                    code: item.stationCode,
                    location: item.posTypeLabel,
                    isActive: true,
                    activeOrdersToday: 0,
                    businessModel: item.posTypeLabel,
                    businessType: item.posTypeLabel,
                    modelType: item.modelType,
                    isLocked: false,
                    role: item.isHybrid ? 'HYBRID_BACKEND' : 'FRONT_END_ONLY',
                    terminalType: item.isHybrid ? 'BACK_END' : 'FRONT_END',
                  };

                 const skuCount =
                    item.modelType === 'fnb'
                      ? Math.max(
                          FNB_MENU_ITEMS.length,
                          filterProductsByTerminal(products, termObj, false).length
                        )
                      : (() => {
                          const seenSku = new Set<string>();
                          const mergedCatalog = [
                            ...filterProductsByTerminal(products, termObj, false),
                            ...(products || []),
                          ];
                          for (const p of mergedCatalog) {
                            if (!p || p.itemType === 'RAW_MATERIAL') continue;
                            const idKey = String(p.id || '').trim().toLowerCase();
                            const bcKey = String(p.barcode || p.sku || '').trim().toLowerCase();
                            const uniqueKey = idKey || (bcKey ? `bc:${bcKey}` : '');
                            if (uniqueKey) seenSku.add(uniqueKey);
                          }
                          return seenSku.size;
                        })();

                  const primaryModel = businessDomainConfig.primaryBusinessModel;

                  let descriptiveSubtitle =
                    'Terminal Transaksi Ritel Terpadu • Pemindaian Barcode Cepat, Kontrol Stok Unit/Box & Cetak Struk 80mm';
                  let featureBadges: string[] = [
                    'Barcode Scanner',
                    'Multi-Satuan',
                    'Real-Time Stok',
                  ];
                  let quickShortcuts = 'F2 Scan · F3 Cari · F10 Bayar';

                  if (item.code === 'POS-GROSIR' || item.id === 'T-03') {
                    descriptiveSubtitle =
                      'Terminal Grosir & Distribusi B2B • Multi-Tier Harga Karton/Dus, Aturan MOQ & Penjualan Kredit/Tempo';
                    featureBadges = [
                      'Multi-Tier Grosir',
                      'Aturan MOQ & Tempo',
                      'Satuan Pcs/Box/Karton',
                    ];
                    quickShortcuts = 'F2 Scan · F3 Katalog · F10 Checkout';
                  } else if (item.modelType === 'fnb' || item.code === 'POS-FNB' || item.id === 'T-02') {
                    descriptiveSubtitle =
                      'Terminal Kasir Kuliner F&B Terpadu • Menu Foto Interaktif, Dine-In/Takeaway, Nomor Meja & Resep BOM';
                    featureBadges = [
                      'Menu Foto Cepat',
                      'Meja & Dine-In',
                      'Potong BOM Otomatis',
                    ];
                    quickShortcuts = 'F3 Menu · KOT Dapur · F10 Bayar';
                  } else if (item.modelType === 'building' || item.code === 'POS-BUILD' || item.id === 'T-05') {
                    descriptiveSubtitle =
                      'Terminal Depo Bahan Bangunan & Material • Konversi Curah m³/Ret Armada, DO Frangko/Loco & Proteksi Margin';
                    featureBadges = [
                      'Konversi Curah m³/Ret',
                      'Armada DO Frangko',
                      'Guardrail Margin',
                    ];
                    quickShortcuts = 'F3 Material · Mode Kontraktor · F10 DO';
                  } else if (item.modelType === 'laundry' || primaryModel === 'LAUNDRY') {
                    descriptiveSubtitle =
                      'Terminal Kasir Laundry & Binatu Multi-Satuan • Timbangan Digital USB/HID, Potong Tare, Min. Berat & Durasi SLA';
                    featureBadges = [
                      'Timbangan Digital',
                      '4 Satuan (kg/pcs/psg/m²)',
                      'Auto Min. & SLA',
                    ];
                    quickShortcuts = 'Timbang USB/HID · F3 Layanan · F10 Bayar';
                  } else if (item.modelType === 'salon' || item.code === 'POS-SERVICE' || item.id === 'T-08') {
                    descriptiveSubtitle =
                      'Terminal Jasa & Layanan Profesional • Order Pelanggan, Penugasan Stylist/Petugas & Cetak Nota Layanan';
                    featureBadges = [
                      'Order Jasa & Nota',
                      'Penugasan Stylist/Staf',
                      'Real-Time Layanan',
                    ];
                    quickShortcuts = 'F3 Layanan · Input Staf · F10 Bayar';
                  } else if (item.modelType === 'fashion' || primaryModel === 'FASHION_BUTIK') {
                    descriptiveSubtitle =
                      'Terminal Butik & Fashion Terpadu • Pemilih Varian Ukuran/Warna, Scan Hangtag & Cetak Struk 80mm';
                    featureBadges = [
                      'Scan Hangtag',
                      'Varian Ukuran/Warna',
                      'Real-Time Stok',
                    ];
                  } else if (primaryModel === 'TOKO_KOSMETIK_KECANTIKAN') {
                    descriptiveSubtitle =
                      'Terminal Ritel Kosmetik & Kecantikan • Pemindaian Barcode Cepat, Kontrol Expired FEFO & Promo Bundling';
                  } else if (primaryModel === 'TOKO_ATK') {
                    descriptiveSubtitle =
                      'Terminal Ritel Alat Tulis & Kantor • Transaksi Cepat Satuan/Pak, Diskon Member & Cetak Struk 80mm';
                  } else if (primaryModel === 'PET_SHOP') {
                    descriptiveSubtitle =
                      'Terminal Pet Shop & Kebutuhan Hewan • Pemindaian SKU Pakan & Aksesoris, Multi-Satuan & Riwayat Member';
                  }

                  const stationShift = getOpenShiftForStation(item.stationCode);
                  const isShiftOpen = Boolean(stationShift && stationShift.status === 'OPEN');

                  return (
                    <div
                      key={item.stationCode}
                      onMouseEnter={() => setHoveredTerminalId(item.stationCode)}
                      onMouseLeave={() => setHoveredTerminalId(null)}
                      onClick={() => handleTerminalCardClick(termObj)}
                      className={`group relative border rounded-2xl select-none transition-all duration-300 cursor-pointer hover:-translate-y-0.5 w-full max-w-5xl mx-auto p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8 ${
                        isLight
                          ? isThisDeviceStation
                            ? 'bg-emerald-50/40 border-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.18)]'
                            : isFocused
                            ? 'bg-white border-cyan-500 shadow-[0_0_28px_rgba(6,182,212,0.24)]'
                            : 'bg-white border-cyan-500/45 shadow-[0_4px_20px_rgba(6,182,212,0.10)] hover:border-cyan-500 hover:shadow-[0_0_28px_rgba(6,182,212,0.24)]'
                          : isThisDeviceStation
                          ? 'bg-slate-900/95 border-emerald-400/75 shadow-[0_0_28px_rgba(16,185,129,0.20)]'
                          : isFocused
                          ? 'bg-slate-900/95 border-cyan-400/70 shadow-[0_0_32px_rgba(34,211,238,0.20)]'
                          : 'bg-slate-900/95 border-cyan-500/30 shadow-[0_6px_24px_rgba(6,182,212,0.07)] hover:border-cyan-400/65 hover:shadow-[0_0_32px_rgba(34,211,238,0.18)]'
                      }`}
                    >
                      <div className="flex-1 min-w-0 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-xs leading-4 px-2.5 py-1 rounded-lg border font-mono font-bold tracking-wider transition-colors duration-200 ${
                                isThisDeviceStation
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                  : isFocused
                                  ? isLight
                                    ? 'bg-cyan-50 text-cyan-700 border-cyan-400/80'
                                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-400/60'
                                  : isLight
                                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                                  : 'bg-slate-800/90 text-slate-300 border-slate-700'
                              }`}
                            >
                              {item.stationCode}
                            </span>
                            <span
                              className={`text-[11px] leading-4 px-2 py-1 rounded-lg border font-mono font-medium ${
                                isLight
                                  ? 'bg-slate-50 text-slate-600 border-slate-200'
                                  : 'bg-slate-800/60 text-slate-300 border-slate-700/80'
                              }`}
                            >
                              INV-{item.receiptPrefixTag}-...
                            </span>
                            <span
                              className={`text-[11px] leading-4 px-2.5 py-1 rounded-lg border font-medium ${
                                isLight
                                  ? 'bg-slate-50 text-slate-700 border-slate-200'
                                  : 'bg-slate-800/60 text-slate-300 border-slate-700/80'
                              }`}
                            >
                              {activeBusinessModelDef.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isThisDeviceStation && (
                              <span className="text-[10px] leading-4 px-2 py-0.5 font-semibold rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 font-mono">
                                PC INI
                              </span>
                            )}
                            {item.isHybrid && (
                              <span className="text-[10px] leading-4 px-2 py-0.5 font-semibold rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-mono">
                                HYBRID
                              </span>
                            )}
                            {stationShift && stationShift.status === 'OPEN' && stationShift.isPaused ? (
                              <span className="text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/35 font-semibold text-[10px] leading-4 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 font-mono">
                                <Coffee className="w-3 h-3" />
                                ISTIRAHAT
                              </span>
                            ) : stationShift && stationShift.status === 'OPEN' ? (
                              <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 font-semibold text-[10px] leading-4 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                ONLINE
                              </span>
                            ) : (
                              <span className="text-slate-600 dark:text-slate-300 bg-slate-500/10 border border-slate-500/30 font-semibold text-[10px] leading-4 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 font-mono">
                                <Clock className="w-3 h-3" />
                                BELUM BUKA SHIFT
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div
                            className={`w-14 h-14 rounded-2xl shrink-0 border flex items-center justify-center transition-all duration-300 ${
                              isFocused
                                ? isLight
                                  ? 'bg-cyan-50 border-cyan-400/80 shadow-[0_0_18px_rgba(34,211,238,0.28)]'
                                  : 'bg-cyan-500/15 border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.28)]'
                                : isLight
                                ? 'bg-slate-100 border-slate-200'
                                : 'bg-slate-800/80 border-slate-700/80'
                            }`}
                          >
                            <span className="text-2xl select-none transition-transform duration-300 group-hover:scale-110" role="img">
                              {item.emoji}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <h3
                              className={`font-semibold tracking-tight transition-colors duration-200 text-xl sm:text-2xl leading-tight ${
                                isLight
                                  ? isFocused
                                    ? 'text-cyan-950'
                                    : 'text-slate-900'
                                  : isFocused
                                  ? 'text-white'
                                  : 'text-slate-100'
                              }`}
                            >
                              {item.posName}
                            </h3>
                            <p
                              className={`text-xs sm:text-sm leading-relaxed ${
                                isLight ? 'text-slate-600' : 'text-slate-300/90'
                              }`}
                            >
                              {descriptiveSubtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {featureBadges.map((badgeLabel, badgeIdx) => {
                            const BadgeIcon =
                              badgeIdx === 0 ? Barcode : badgeIdx === 1 ? Layers : Boxes;
                            return (
                              <span
                                key={badgeLabel}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
                                  isLight
                                    ? 'bg-cyan-50/80 text-cyan-800 border-cyan-200 group-hover:border-cyan-300'
                                    : 'bg-cyan-500/10 text-cyan-200 border-cyan-500/25 group-hover:border-cyan-400/45'
                                }`}
                              >
                                <BadgeIcon className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                                <span>{badgeLabel}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col justify-between gap-3.5 w-full lg:w-[340px] lg:border-l lg:pl-7 border-slate-200 dark:border-slate-800">
                        <div
                          className={`p-3.5 rounded-xl border space-y-2.5 text-xs ${
                            isLight
                              ? 'bg-slate-50/90 border-slate-200/90'
                              : 'bg-slate-950/75 border-slate-800/90'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                              <Clock className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                              <span>Status Shift</span>
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold border ${
                                isShiftOpen && stationShift?.isPaused
                                  ? isLight
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                                  : isShiftOpen
                                  ? isLight
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                                  : isLight
                                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                                  : 'bg-slate-800/80 text-slate-300 border-slate-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isShiftOpen && stationShift?.isPaused
                                    ? 'bg-amber-500'
                                    : isShiftOpen
                                    ? 'bg-emerald-500 animate-pulse'
                                    : 'bg-slate-400'
                                }`}
                              />
                              {isShiftOpen && stationShift?.isPaused
                                ? `Istirahat (${stationShift?.cashierName || 'Kasir'})`
                                : isShiftOpen
                                ? `Aktif (${stationShift?.cashierName || 'Kasir'})`
                                : 'Siap Buka Shift'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                              <Package className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                              <span>Katalog SKU Aktif</span>
                            </span>
                            <span className={`font-mono font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {skuCount.toLocaleString('id-ID')} SKU
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/80 dark:border-slate-800/80">
                            <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                              <Keyboard className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                              <span>Pintasan Cepat</span>
                            </span>
                            <span
                              className={`font-mono text-[11px] font-medium ${
                                isLight ? 'text-cyan-700' : 'text-cyan-300'
                              }`}
                            >
                              {quickShortcuts}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTerminalCardClick(termObj);
                            }}
                            className={`w-full py-3.5 px-6 rounded-xl text-sm leading-5 font-semibold transition-all duration-200 text-center flex items-center justify-center gap-2 ${
                              isFocused
                                ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.45)] cursor-pointer active:scale-[0.99]'
                                : 'bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.32)] group-hover:shadow-[0_0_24px_rgba(34,211,238,0.45)] cursor-pointer active:scale-[0.99]'
                            }`}
                          >
                            <span>
                              {language === 'ID'
                                ? `Buka ${item.stationCode} →`
                                : `Open ${item.stationCode} →`}
                            </span>
                          </button>

                          {(isShiftOpen || visiblePosIdentities.length > 1 || hasValidDeviceBinding) && (
                            <div className="flex items-center gap-2">
                              {isShiftOpen && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStationBreak(item.stationCode);
                                  }}
                                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                                    stationShift?.isPaused
                                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400'
                                      : isLight
                                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                                      : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/35'
                                  }`}
                                >
                                  {stationShift?.isPaused ? (
                                    <>
                                      <Play className="w-3.5 h-3.5" />
                                      <span>Lanjut Online</span>
                                    </>
                                  ) : (
                                    <>
                                      <Coffee className="w-3.5 h-3.5" />
                                      <span>Istirahat</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {canManageStationBinding && (visiblePosIdentities.length > 1 || hasValidDeviceBinding) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPosMgmtPinPrompt({ type: 'SWITCH_STATION' });
                                  }}
                                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition ${
                                    isLight
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
                                  }`}
                                >
                                  <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-500" />
                                  <span>Ganti Loket PC</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()
      ) : (
        <div className="h-full flex flex-col overflow-hidden w-full">
          <div
            id="bar-pos-top-control"
            className={`min-h-11 flex-shrink-0 mb-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border flex flex-wrap items-center justify-between gap-1.5 transition-all duration-200 select-none ${
              isLight
                ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] text-slate-900'
                : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] text-white'
            }`}
          >
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
              <button
                id="btn-back-to-terminals-top-left"
                type="button"
                onClick={handleCashierLogout}
                title={language === 'ID' ? 'Kembali ke Lobby Terminal' : 'Back to Terminal Lobby'}
                className={`px-2 py-1 rounded-lg border font-medium text-xs leading-4 flex items-center gap-1 transition-all duration-200 cursor-pointer shrink-0 shadow-sm active:scale-[0.99] ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-gray-200'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span className="hidden sm:inline">
                  {language === 'ID' ? 'Lobby Terminal' : 'Terminal Lobby'}
                </span>
              </button>

              <div className="flex items-center gap-1 shrink-0 pr-0.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/35">
                  {activeStationCode}
                </span>
                {isOnline ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-normal text-xs font-mono hidden xl:inline max-w-[85px] truncate">{activeTerminal?.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      activeBackendProvider === 'SUPABASE' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      activeBackendProvider === 'GAS' ? 'bg-amber-500/15 text-amber-400 border border-emerald-500/30' :
                      'bg-slate-700 text-slate-300 border border-slate-600'
                    }`}>
                      [{activeBackendProvider}]
                    </span>
                    {(offlineQueue.length > 0 || gasOfflineQueueCount > 0) && (
                      <button
                        type="button"
                        onClick={async () => {
                          await syncOfflineTransactions();
                          await syncOfflineQueues();
                        }}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-normal bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all duration-200 cursor-pointer flex items-center gap-1 active:scale-[0.99]"
                        title="Sinkronkan antrean offline ke Cloud"
                      >
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        <span>Sync ({offlineQueue.length + gasOfflineQueueCount})</span>
                      </button>
                    )}
                  </>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-normal bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                    <WifiOff className="w-3 h-3 text-amber-400" />
                    OFFLINE
                  </span>
                )}
              </div>

              <div className="relative shrink-0" ref={hybridMenuRef}>
                <button
                  id="btn-pos-hybrid-erp-access"
                  type="button"
                  onClick={() => setIsHybridMenuOpen(!isHybridMenuOpen)}
                  className="px-2 py-1 rounded-lg border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium text-xs leading-4 flex items-center gap-1 shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.99]"
                >
                  <span>ERP</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isHybridMenuOpen && (
                  <div
                    className={`absolute left-0 top-full mt-2 z-50 w-64 rounded-xl border-2 border-amber-500/50 shadow-2xl p-2 ${
                      isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
                    }`}
                  >
                    <div className="grid grid-cols-1 gap-1 text-xs leading-5">
                      {([
                        { id: 'executive' as ActiveNavModule, label: 'Eksekutif & Manajerial', icon: LayoutDashboard },
                        { id: 'warehouse' as ActiveNavModule, label: 'Gudang & Inventori', icon: Boxes },
                        { id: 'finance' as ActiveNavModule, label: 'Keuangan & Akuntansi', icon: Coins },
                        { id: 'purchasing' as ActiveNavModule, label: 'Pengadaan & Purchasing', icon: ShoppingCart },
                        { id: 'hr' as ActiveNavModule, label: 'SDM & Personalia', icon: Users },
                        { id: 'master-data' as ActiveNavModule, label: 'Data Master', icon: Package },
                      ] as const).map((mod) => {
                        const ModIcon = mod.icon;
                        return (
                          <button
                            key={mod.id}
                            type="button"
                            onClick={() => handleDirectHybridNavigation(mod)}
                            className={`w-full text-left p-1.5 rounded-lg border flex items-center gap-2 transition cursor-pointer active:scale-[0.99] ${
                              isLight ? 'hover:bg-amber-50 border-slate-200' : 'hover:bg-slate-800 border-slate-800'
                            }`}
                          >
                            <ModIcon className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-normal text-xs leading-5 flex-1">{mod.label}</span>
                            <ArrowRight className="w-3 h-3 opacity-60" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {!(isFnbMode || isFnbPhotoMenuMode) ? (
                <>
                  <form onSubmit={handleBarcodeSubmit} className="relative w-36 sm:w-44 xl:w-52 shrink-0">
                    <Barcode className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      placeholder="Scan Barcode [F2]..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      className={`w-full text-xs leading-4 pl-7 pr-8 py-1 rounded-lg outline-none font-normal border transition ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500 placeholder:text-slate-400/80 placeholder:italic'
                          : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500 placeholder:text-slate-500 placeholder:italic'
                      }`}
                    />
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 px-1 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-[9px] font-mono font-normal">
                      F2
                    </span>
                  </form>

                  <button
                    type="button"
                    onClick={() => setIsManualSearchOpen(true)}
                    className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs leading-4 font-normal flex items-center gap-1 cursor-pointer shrink-0 transition-all duration-200 active:scale-[0.99]"
                  >
                    <Search className="w-3 h-3" />
                    <span className="hidden sm:inline">Cari</span>
                    <span className="text-[10px] opacity-80 font-mono font-normal">[F3]</span>
                  </button>
                </>
              ) : (
                <div className="px-2.5 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 shrink-0">
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Kasir F&amp;B • Visual Menu</span>
                </div>
              )}

              {isRetailWholesalerTerminal && (
                <div className={`flex items-center p-0.5 rounded-lg border gap-0.5 text-xs font-normal shrink-0 ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'}`}>
                  <button
                    type="button"
                    onClick={() => handleSelectPriceTier('RETAIL')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-normal cursor-pointer transition-all active:scale-[0.99] ${
                      selectedPriceTier === 'RETAIL' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Ecer
                  </button>
                  <button
                    type="button"
                    onClick={() => allowedTiers.includes('MEMBER') ? handleSelectPriceTier('MEMBER') : showToast('Input Member terlebih dahulu')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-normal cursor-pointer flex items-center gap-1 transition-all active:scale-[0.99] ${
                      selectedPriceTier === 'MEMBER' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    {!allowedTiers.includes('MEMBER') && <Lock className="w-2.5 h-2.5" />}
                    <span>Member</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => allowedTiers.includes('WHOLESALE') ? handleSelectPriceTier('WHOLESALE') : showToast('Khusus Member Toko Terverifikasi')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-normal cursor-pointer flex items-center gap-1 transition-all active:scale-[0.99] ${
                      selectedPriceTier === 'WHOLESALE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    {!allowedTiers.includes('WHOLESALE') && <Lock className="w-2.5 h-2.5" />}
                    <span>Grosir</span>
                  </button>
                </div>
              )}

              {isBuildingTerminal && (
                <button
                  type="button"
                  id="btn-toggle-contractor-mode"
                  onClick={handleToggleContractorMode}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 cursor-pointer shrink-0 transition-all active:scale-[0.99] ${
                    isContractorMode
                      ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-sm'
                      : isLight
                      ? 'bg-slate-50 hover:bg-amber-50 border-slate-300 text-slate-800'
                      : 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <HardHat className={`w-3.5 h-3.5 ${isContractorMode ? 'text-amber-300' : 'text-amber-500'}`} />
                  <span>Mode Pelanggan Kontraktor</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                      isContractorMode
                        ? 'bg-black/25 text-white'
                        : isLight
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isContractorMode ? 'ON • TIER 3' : 'OFF'}
                  </span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
              {selectedCustomer ? (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-xs shrink-0">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-normal text-[11px] truncate max-w-[85px]">{selectedCustomer.name}</span>
                  <button type="button" onClick={handleClearCustomer} className="text-gray-400 hover:text-rose-400 cursor-pointer p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="relative flex items-center shrink-0 w-36 sm:w-40 xl:w-48" ref={customerDropdownRef}>
                  <input
                    id="pos-top-customer-search-input"
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => handleCustomerSearchChange(e.target.value)}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    placeholder={
                      paymentMethod === 'KREDIT / TEMPO (AR)'
                        ? '* Nama Pelanggan (Wajib)...'
                        : 'Pelanggan...'
                    }
                    className={`w-full text-xs leading-4 px-2 py-1 rounded-lg outline-none font-normal border transition ${
                      paymentMethod === 'KREDIT / TEMPO (AR)' && !customerSearchQuery.trim()
                        ? 'border-amber-500 ring-1 ring-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 placeholder:text-amber-600/80 dark:placeholder:text-amber-400/80'
                        : isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400/80 placeholder:italic'
                        : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 placeholder:italic'
                    }`}
                  />
                  {isCustomerDropdownOpen && (
                    <div className={`absolute right-0 top-full mt-1.5 z-50 w-64 max-h-64 overflow-y-auto rounded-xl border shadow-2xl p-1.5 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                      {customerSearchQuery.trim() && (
                        <button
                          type="button"
                          onClick={() => setIsCustomerDropdownOpen(false)}
                          className="w-full text-left px-2 py-1.5 mb-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center justify-between cursor-pointer"
                        >
                          <span className="truncate">Gunakan: &ldquo;{customerSearchQuery.trim()}&rdquo;</span>
                          <span className="text-[10px] font-mono shrink-0">Pilih</span>
                        </button>
                      )}
                      {filteredCustomers.map((c, idx) => (
                        <button
                          key={`cust-${c.id}-${idx}`}
                          type="button"
                          onClick={() => handleSelectCustomer(c)}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs leading-5 hover:bg-cyan-500/15 flex items-center justify-between cursor-pointer transition"
                        >
                          <span className="font-normal">{c.name}</span>
                          <span className="text-[10px] font-mono text-gray-400">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleOpenHoldModal}
                disabled={cart.length === 0}
                className="px-2 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300 text-[11px] leading-4 font-normal flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-all duration-200 active:scale-[0.99]"
              >
                <Pause className="w-3 h-3" />
                <span className="hidden sm:inline">Hold</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHeldOrdersModalOpen(true)}
                className="px-2 py-1 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 text-[11px] leading-4 font-normal flex items-center gap-1 cursor-pointer transition-all duration-200 active:scale-[0.99]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Recall ({heldOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(true)}
                className="px-2 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300 text-[11px] leading-4 font-normal flex items-center gap-1 cursor-pointer transition-all duration-200 active:scale-[0.99]"
              >
                <Tag className="w-3 h-3" />
                <span className="hidden sm:inline">Promo</span>
              </button>

              <button
                type="button"
                onClick={handleManualOpenDrawer}
                className="px-2 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] leading-4 font-normal flex items-center gap-1 cursor-pointer transition-all duration-200 active:scale-[0.99]"
              >
                <Inbox className="w-3 h-3" />
                <span className="hidden md:inline">Laci [F12]</span>
              </button>

              {activeStationShift ? (
                <div
                  className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-semibold shrink-0 flex items-center gap-1 ${
                    activeStationShift.isPaused
                      ? 'border-amber-500/45 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      activeStationShift.isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  <span>
                    {activeStationShift.isPaused
                      ? `${activeStationCode}: Istirahat`
                      : `${activeStationCode}: Online`}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsOpenShiftModalOpen(true)}
                  className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-normal text-xs leading-4 cursor-pointer transition-all active:scale-[0.99]"
                >
                  Buka Shift
                </button>
              )}

              <button
                type="button"
                id="btn-pos-station-break"
                onClick={() => {
                  if (!activeStationShift) {
                    showToast('Buka shift terlebih dahulu untuk mengaktifkan mode Istirahat.', 'warning');
                    setIsOpenShiftModalOpen(true);
                    return;
                  }
                  toggleStationBreak(activeStationCode);
                }}
                className={`px-2 py-1 rounded-lg border text-[11px] leading-4 font-medium flex items-center gap-1 cursor-pointer transition-all duration-200 active:scale-[0.99] shrink-0 ${
                  activeStationShift?.isPaused
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
                    : 'border-amber-500/45 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                }`}
              >
                {activeStationShift?.isPaused ? (
                  <>
                    <Play className="w-3 h-3" />
                    <span>Lanjut Online</span>
                  </>
                ) : (
                  <>
                    <Coffee className="w-3 h-3" />
                    <span>Istirahat</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => (activeStationShift ? setIsPettyCashModalOpen(true) : setIsOpenShiftModalOpen(true))}
                className="px-2 py-1 rounded-lg border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] leading-4 font-normal cursor-pointer transition-all duration-200 active:scale-[0.99] shrink-0"
              >
                Tarik Kas
              </button>

              <button
                type="button"
                id="btn-pos-zreport-close-shift"
                onClick={() => {
                  void triggerSilentAutoBackupIfDue('POS_ZREPORT_BUTTON');
                  setIsQuickZReportOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] leading-4 font-medium flex items-center gap-1 cursor-pointer transition-all duration-200 active:scale-[0.99] shrink-0"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Tutup Shift (Z-Report)</span>
              </button>

              <button
                type="button"
                id="btn-pos-cancel-cart"
                onClick={handleRequestCancelCart}
                disabled={cart.length === 0}
                title={
                  isKotGraceExpired
                    ? KOT_EXPIRED_LOCK_MESSAGE
                    : 'Batalkan / kosongkan keranjang pesanan'
                }
                className={`px-2 py-1 rounded-lg border text-[11px] leading-4 font-normal disabled:opacity-40 transition-all duration-200 active:scale-[0.99] shrink-0 ${
                  isKotGraceExpired
                    ? 'border-rose-500/30 bg-rose-500/5 text-rose-400/70 opacity-60 cursor-not-allowed'
                    : 'border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer'
                }`}
              >
                Batal
              </button>

              <button type="button" onClick={toggleTheme} className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-[0.99] shrink-0">
                {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            </div>
          </div>

          <div className={`flex-1 mb-1 flex flex-col ${(isFnbMode || isFnbPhotoMenuMode) || isSalonServiceTerminal || isLaundryTerminal ? 'min-h-0 overflow-hidden' : 'min-h-0 overflow-y-auto'}`}>
            {(isFnbMode || isFnbPhotoMenuMode) ? (
              <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 overflow-hidden h-full">
                <div className="w-full lg:w-[58%] lg:flex-1 min-w-0 flex flex-col h-full min-h-0 overflow-hidden">
                  <div className={`p-2 rounded-xl border flex flex-col gap-1.5 mb-2 shrink-0 ${isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'}`}>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari nama masakan, minuman, kopi, snack..."
                          value={fnbSearchQuery}
                          onChange={(e) => setFnbSearchQuery(e.target.value)}
                          className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-lg outline-none border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsKotModalOpen(true)}
                        disabled={cart.length === 0}
                        className="px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition shrink-0"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>KOT Dapur</span>
                      </button>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-0.5 text-xs">
                      {fnbCategories.map((cat, idx) => (
                        <button
                          key={`cat-${cat}-${idx}`}
                          onClick={() => setSelectedFnbCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-bold text-[11px] cursor-pointer transition ${
                            selectedFnbCategory === cat
                              ? 'bg-emerald-500 text-black shadow-sm'
                              : isLight
                              ? 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                              : 'bg-[#0d1117] text-gray-400 border border-[#30363d] hover:text-white'
                          }`}
                        >
                          {cat === 'ALL' ? 'Semua' : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pb-2">
                      {filteredFnbProducts.map((product, idx) => {
                        const menuImageUrl = resolveFnbMenuImageUrl(
                          product.name,
                          product.category,
                          product.image
                        );
                        const fallbackImageUrl = getFnbFallbackImageUrl(product.category);
                        return (
                          <div
                            key={`fnb-${product.id}-${idx}`}
                            onClick={() => handleQuickAddFnbProduct(product)}
                            className={`group rounded-xl border overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-150 hover:border-emerald-500/80 hover:shadow-md active:scale-[0.98] ${
                              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#161b22] border-[#30363d]'
                            }`}
                          >
                            <div className="flex flex-col">
                              <div className="relative h-24 w-full overflow-hidden rounded-t-xl bg-slate-200 dark:bg-slate-800">
                                <img
                                  src={menuImageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                  onError={(e) => {
                                    const imgEl = e.currentTarget;
                                    if (imgEl.dataset.fallbackApplied === '1') return;
                                    imgEl.dataset.fallbackApplied = '1';
                                    imgEl.src = fallbackImageUrl;
                                  }}
                                />
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-black/45 to-transparent" />
                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur-sm border border-white/15 text-[9px] font-semibold tracking-wide text-white/95 truncate max-w-[88%]">
                                  {product.category || 'Menu F&B'}
                                </span>
                              </div>
                              <div className="px-2 pt-1.5 pb-1">
                                <h4 className="text-[11px] font-bold leading-tight line-clamp-2 min-h-[1.75rem] text-slate-900 dark:text-slate-100">
                                  {product.name}
                                </h4>
                              </div>
                            </div>
                            <div className="px-2 pb-1.5 pt-1 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-1">
                              <span className="text-[11.5px] font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 truncate">
                                Rp {product.sell_price.toLocaleString('id-ID')}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFnbProduct(product);
                                    setIsFnbModalOpen(true);
                                  }}
                                  title="Atur Topping / Level Pedas / Catatan Khusus"
                                  className={`px-1.5 h-6 rounded-md text-[10px] font-semibold cursor-pointer active:scale-95 transition border ${
                                    isLight
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                      : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
                                  }`}
                                >
                                  Opsi
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickAddFnbProduct(product, e)}
                                  title="Tambah 1 porsi ke pesanan"
                                  aria-label={`Tambah ${product.name}`}
                                  className="w-6 h-6 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center cursor-pointer active:scale-95 transition shadow-xs"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[2.75]" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className={`w-full lg:w-[42%] lg:min-w-[420px] shrink-0 flex flex-col h-full rounded-2xl border overflow-hidden ${isLight ? 'bg-white border-slate-300 shadow-sm' : 'bg-[#161b22] border-[#30363d]'}`}>
                  <div className={`p-3 border-b space-y-2.5 shrink-0 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className={`grid grid-cols-3 gap-1 flex-1 p-1 rounded-xl border ${isLight ? 'bg-slate-200/70 border-slate-300' : 'bg-black/30 border-slate-800'}`}>
                        {(['Dine-In', 'Take Away', 'Delivery / Online'] as const).map((mode) => {
                          const internalMode = mode === 'Take Away' ? 'Takeaway' : mode === 'Delivery / Online' ? 'Delivery' : 'Dine-In';
                          const isSelected = fnbOrderMode === internalMode;
                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => handleChangeFnbOrderMode(internalMode)}
                              className={`py-2 px-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap truncate ${
                                isSelected
                                  ? 'bg-emerald-500 text-black shadow-sm'
                                  : isLight
                                  ? 'text-slate-600 hover:text-slate-900'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              {mode}
                            </button>
                          );
                        })}
                      </div>
                      {fnbOrderMode === 'Dine-In' ? (
                        <select
                          value={fnbTableNo}
                          onChange={(e) => handleChangeFnbTableNo(e.target.value)}
                          aria-label="Pilih Meja Resto"
                          className={`px-3 py-2 rounded-xl border text-xs font-extrabold outline-none cursor-pointer min-w-[108px] shrink-0 ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900'
                              : 'bg-[#161b22] border-cyan-500/45 text-cyan-300'
                          }`}
                        >
                          {Array.from({ length: 12 }, (_, i) => {
                            const label = `Meja ${String(i + 1).padStart(2, '0')}`;
                            return (
                              <option key={label} value={label}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <span
                          id="fnb-no-table-badge"
                          className={`px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 ${
                            fnbOrderMode === 'Delivery'
                              ? isLight
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                                : 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                              : isLight
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          }`}
                        >
                          {fnbOrderMode === 'Delivery' ? (
                            <>
                              <Truck className="w-3.5 h-3.5 shrink-0" />
                              <span>Online</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                              <span>Take Away</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-2 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold shrink-0 w-28 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                          Nama Pelanggan:
                        </span>
                        <input
                          type="text"
                          value={fnbCustomerName}
                          onChange={(e) => setFnbCustomerName(e.target.value)}
                          placeholder="Nama Pelanggan (Opsional)..."
                          className={`w-full text-xs px-3 py-1.5 rounded-xl outline-none border ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900'
                              : 'bg-[#0d1117] border-[#30363d] text-white'
                          }`}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold shrink-0 w-28 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                          Catatan Dapur:
                        </span>
                        <input
                          type="text"
                          value={fnbKitchenNote}
                          onChange={(e) => {
                            const nextNote = e.target.value;
                            setFnbKitchenNote(nextNote);
                          }}
                          placeholder="Contoh: Kurangi es, tidak pedas, pisah saus..."
                          className={`w-full text-xs px-3 py-1.5 rounded-xl outline-none border ${
                            isLight
                              ? 'bg-amber-50/70 border-amber-300 text-slate-900 placeholder:text-slate-400'
                              : 'bg-[#0d1117] border-amber-500/40 text-amber-200 placeholder:text-slate-500'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 px-0.5">
                      <span>
                        Mode Pesanan: <strong className="text-emerald-500 dark:text-emerald-400">{fnbOrderMode}</strong> •{' '}
                        <strong className="text-cyan-600 dark:text-cyan-400">
                          {fnbOrderMode === 'Dine-In'
                            ? fnbTableNo
                            : fnbOrderMode === 'Delivery'
                            ? 'Tanpa Meja • Kurir'
                            : 'Tanpa Meja • Bungkus'}
                        </strong>
                      </span>
                      <span className="font-mono font-bold tabular-nums text-slate-700 dark:text-slate-200">
                        {cart.reduce((s, i) => s + i.quantity, 0)} Porsi/Item
                      </span>
                    </div>
                    {hasAnyKotSentItem && kotSentAt && (
                      <div
                        id="fnb-kot-grace-badge"
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono font-medium flex items-center justify-between gap-2 tabular-nums ${
                          isKotGraceExpired
                            ? isLight
                              ? 'bg-rose-50 border-rose-300 text-rose-700'
                              : 'bg-rose-500/15 border-rose-500/45 text-rose-300'
                            : kotRemainingMs <= 60 * 1000
                            ? isLight
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-amber-500/15 border-amber-500/45 text-amber-300'
                            : isLight
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 min-w-0 truncate">
                          {isKotGraceExpired ? (
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="truncate">
                            {isKotGraceExpired
                              ? 'KOT Terkunci (> 5 Menit - Sedang Dimasak)'
                              : `KOT Terkirim • Sisa Waktu Revisi: ${kotRemainingLabel}`}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {cart.map((item, idx) => {
                      const savings = item.promoSavings ?? ((item.itemDiscount || 0) * item.quantity);
                      const isSentKotItem = isItemSentToKot(item);
                      const isLockedKotItem =
                        isKotGraceExpired &&
                        isSentKotItem &&
                        item.quantity <= (item.kotSentQty ?? item.quantity);
                      const isToppingLocked = isKotGraceExpired && isSentKotItem;
                      const mods = item.modifiers;
                      const hasToppingsOrNotes = Boolean(
                        (mods?.toppings && mods.toppings.length > 0) ||
                          mods?.spicyLabel ||
                          (mods?.sugarIceLabel && mods.sugarIceLabel !== 'Normal') ||
                          mods?.notes
                      );
                      return (
                        <div
                          key={`fnb-cart-${idx}`}
                          className={`p-2.5 rounded-xl border flex items-start justify-between gap-3 ${
                            isLight
                              ? 'bg-slate-50/75 border-slate-200'
                              : 'bg-[#0d1117]/75 border-slate-800'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[13px] font-bold leading-snug ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                                {item.product.name}
                              </span>
                              {item.kotSent && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono border ${
                                    isKotGraceExpired
                                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/35'
                                      : 'bg-amber-500/20 text-amber-300 border-amber-500/35'
                                  }`}
                                >
                                  {isKotGraceExpired ? 'KOT 🔒' : 'KOT'}
                                </span>
                              )}
                              {item.promoBadge && (
                                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  {item.promoBadge}
                                </span>
                              )}
                            </div>
                            {hasToppingsOrNotes && (
                              <div className="mt-1 pl-2 border-l-2 border-emerald-500/40 space-y-0.5 text-[11px] leading-snug">
                                {mods?.toppings && mods.toppings.length > 0 && (
                                  <div className={isLight ? 'text-emerald-700 font-medium' : 'text-emerald-300 font-medium'}>
                                    +{' '}
                                    {mods.toppingDetails && mods.toppingDetails.length > 0
                                      ? mods.toppingDetails
                                          .map((t) =>
                                            t.price > 0
                                              ? `${t.name} (+Rp ${t.price.toLocaleString('id-ID')})`
                                              : t.name
                                          )
                                          .join(', ')
                                      : mods.toppings.join(', ')}
                                  </div>
                                )}
                                {(mods?.spicyLabel ||
                                  (mods?.sugarIceLabel && mods.sugarIceLabel !== 'Normal')) && (
                                  <div className={isLight ? 'text-amber-700' : 'text-amber-300'}>
                                    {[
                                      mods?.spicyLabel ? `Pedas: ${mods.spicyLabel}` : null,
                                      mods?.sugarIceLabel && mods.sugarIceLabel !== 'Normal'
                                        ? mods.sugarIceLabel
                                        : null,
                                    ]
                                      .filter(Boolean)
                                      .join(' • ')}
                                  </div>
                                )}
                                {mods?.notes && (
                                  <div className={isLight ? 'text-slate-600 italic' : 'text-slate-400 italic'}>
                                    Catatan: &quot;{mods.notes}&quot;
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                              <span className="tabular-nums font-medium">
                                {item.quantity}x @ Rp {item.product.sell_price.toLocaleString('id-ID')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenQuickTopping(idx)}
                                title={
                                  isToppingLocked
                                    ? KOT_TOPPING_LOCK_MESSAGE
                                    : isSentKotItem
                                    ? 'Ubah Topping / Catatan (Wajib PIN Supervisor)'
                                    : 'Tambah / Ubah Topping & Catatan'
                                }
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold transition ${
                                  isToppingLocked
                                    ? 'border-slate-700/60 bg-slate-800/40 text-slate-500 opacity-60 cursor-not-allowed'
                                    : hasToppingsOrNotes
                                    ? isLight
                                      ? 'border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer'
                                      : 'border-emerald-500/45 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 cursor-pointer'
                                    : isLight
                                    ? 'border-cyan-400/70 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 cursor-pointer'
                                    : 'border-cyan-500/35 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 cursor-pointer'
                                }`}
                              >
                                {isToppingLocked ? (
                                  <Lock className="w-2.5 h-2.5" />
                                ) : (
                                  <Sparkles className="w-2.5 h-2.5" />
                                )}
                                <span>+ Topping</span>
                              </button>
                              {(item.freeBonusQty || 0) > 0 && (
                                <span className="text-cyan-500 dark:text-cyan-400 font-mono font-semibold">
                                  (+ Gratis {item.freeBonusQty})
                                </span>
                              )}
                              {savings > 0 && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                                  (Hemat Rp {savings.toLocaleString('id-ID')})
                                </span>
                              )}
                            </div>
                            {item.promoHint && (
                              <div className="text-[10px] text-amber-500 dark:text-amber-400/90 truncate mt-0.5">
                                {item.promoHint}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 pt-0.5">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(idx, -1)}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg border transition ${
                                  isLockedKotItem
                                    ? 'border-slate-700/60 bg-slate-800/40 text-slate-500 opacity-50 cursor-not-allowed'
                                    : isLight
                                    ? 'border-slate-300 bg-white hover:bg-slate-200 text-slate-800 cursor-pointer'
                                    : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-white cursor-pointer'
                                }`}
                                title={isLockedKotItem ? KOT_EXPIRED_LOCK_MESSAGE : 'Kurangi Qty'}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className={`min-w-[1.5rem] text-center font-mono font-bold text-xs tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(idx, 1)}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer transition ${
                                  isLight ? 'border-slate-300 bg-white hover:bg-slate-200 text-slate-800' : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-white'
                                }`}
                                title="Tambah Qty (Add-on)"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="font-mono font-extrabold text-[13px] text-emerald-600 dark:text-emerald-400 tabular-nums min-w-[84px] text-right">
                              Rp {item.subtotal.toLocaleString('id-ID')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRequestRemoveItem(idx)}
                              className={`p-1 rounded-md transition ${
                                isKotGraceExpired && isSentKotItem
                                  ? 'text-rose-500/40 cursor-not-allowed'
                                  : 'text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer'
                              }`}
                              title={
                                isKotGraceExpired && isSentKotItem
                                  ? KOT_EXPIRED_LOCK_MESSAGE
                                  : 'Hapus Item'
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className={`p-3 border-t space-y-2.5 shrink-0 ${isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#0d1117]/60 border-slate-800'}`}>
                    {totalAllDiscounts > 0 && (
                      <div className="flex justify-between items-center text-xs text-emerald-500 font-mono font-semibold">
                        <span>Total Hemat Promo</span>
                        <span>-Rp {totalAllDiscounts.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-extrabold tracking-wide text-slate-600 dark:text-slate-300">
                        TOTAL
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-extrabold text-xl tabular-nums">
                        Rp {grandTotal.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {paymentMethod === 'SPLIT' ? (
                      <div className="p-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 space-y-1.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block mb-0.5">
                              Nominal Tunai (1-10101):
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={splitCashAmount || ''}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value) || 0);
                                setSplitCashAmount(val);
                              }}
                              placeholder="0"
                              className={`h-8 w-full px-2 text-xs font-mono font-semibold border rounded-lg outline-none ${
                                isLight
                                  ? 'border-emerald-500/60 bg-white text-slate-900'
                                  : 'border-emerald-500/50 bg-slate-950 text-white'
                              }`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-[10px] font-mono text-indigo-600 dark:text-indigo-300">
                                Non-Tunai ({splitNonCashChannel}):
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const next =
                                    splitNonCashChannel === 'QRIS'
                                      ? 'DEBIT'
                                      : splitNonCashChannel === 'DEBIT'
                                      ? 'TRANSFER'
                                      : 'QRIS';
                                  setSplitNonCashChannel(next);
                                }}
                                className="text-[10px] font-mono px-1.5 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 cursor-pointer"
                              >
                                Ubah
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                value={splitNonCashAmount || ''}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  setSplitNonCashAmount(val);
                                }}
                                placeholder="0"
                                className={`h-8 w-full px-2 text-xs font-mono font-semibold border rounded-lg outline-none ${
                                  isLight
                                    ? 'border-indigo-500/60 bg-white text-slate-900'
                                    : 'border-indigo-500/50 bg-slate-950 text-white'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setSplitNonCashAmount(Math.max(0, grandTotal - splitCashAmount))
                                }
                                className="h-8 px-2 rounded-lg text-[10px] font-semibold bg-indigo-600 text-white cursor-pointer shrink-0"
                              >
                                Sisa
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono pt-0.5">
                          <span className="text-slate-500 dark:text-slate-400">
                            Status Split (1-10101 + 1-10102):
                          </span>
                          <span
                            className={`font-bold ${
                              splitShortfall === 0 && grandTotal > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-500'
                            }`}
                          >
                            {splitShortfall === 0 && grandTotal > 0
                              ? '✓ LUNAS 100%'
                              : `Kurang: Rp ${splitShortfall.toLocaleString('id-ID')}`}
                          </span>
                        </div>
                      </div>
                    ) : paymentMethod === 'CASH' ? (
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Diterima:</span>
                          <input
                            type="number"
                            min={0}
                            value={cashGiven || ''}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setCashGiven(val);
                              if (isCashUnderpaid && val >= grandTotal) setIsCashUnderpaid(false);
                            }}
                            onKeyDown={handleCashInputKeyDown}
                            placeholder="0"
                            className={`h-8 w-28 px-2 text-xs font-mono font-bold text-center border rounded-lg outline-none ${
                              isLight
                                ? 'border-emerald-500/60 bg-white text-slate-900'
                                : 'border-emerald-500/50 bg-slate-950 text-white'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCashGiven(grandTotal);
                              setIsCashUnderpaid(false);
                            }}
                            className="h-8 px-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                          >
                            Pas
                          </button>
                        </div>
                        <div className="text-right font-mono text-xs">
                          <span className="text-slate-500 dark:text-slate-400 mr-1">
                            {cashGiven >= grandTotal ? 'Kembali:' : 'Kurang:'}
                          </span>
                          <span
                            className={`font-extrabold tabular-nums ${
                              cashGiven >= grandTotal
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-500'
                            }`}
                          >
                            Rp{' '}
                            {(cashGiven >= grandTotal
                              ? changeAmount
                              : grandTotal - cashGiven
                            ).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    <div
                      className={`grid grid-cols-4 p-1 rounded-xl border text-xs gap-1 ${
                        isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CASH')}
                        className={`h-8 px-2 rounded-lg cursor-pointer text-[11px] font-semibold whitespace-nowrap transition ${
                          paymentMethod === 'CASH'
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : isLight
                            ? 'text-slate-700 hover:text-slate-900'
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        💵 Tunai
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('QRIS');
                          setIsQrisModalOpen(true);
                        }}
                        className={`h-8 px-2 rounded-lg cursor-pointer text-[11px] font-semibold whitespace-nowrap transition ${
                          paymentMethod === 'QRIS'
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : isLight
                            ? 'text-slate-700 hover:text-slate-900'
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        📱 QRIS
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('EDC_DEBIT')}
                        className={`h-8 px-2 rounded-lg cursor-pointer text-[11px] font-semibold whitespace-nowrap transition ${
                          paymentMethod === 'EDC_DEBIT'
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : isLight
                            ? 'text-slate-700 hover:text-slate-900'
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        💳 Debit
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectSplitPayment}
                        className={`h-8 px-2 rounded-lg cursor-pointer text-[11px] font-semibold whitespace-nowrap transition ${
                          paymentMethod === 'SPLIT'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : isLight
                            ? 'text-indigo-700 hover:bg-indigo-50'
                            : 'text-indigo-300 hover:text-white'
                        }`}
                      >
                        🔀 Split
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleManualBayarClick}
                      disabled={cart.length === 0 || (paymentMethod === 'SPLIT' && !isSplitReadyToPay)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-sm tracking-wide leading-5 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all duration-200"
                    >
                      {paymentMethod === 'SPLIT'
                        ? isSplitReadyToPay
                          ? 'Bayar Split [F10]'
                          : `Split Kurang Rp ${splitShortfall.toLocaleString('id-ID')}`
                        : 'Bayar [F10]'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (isSalonServiceTerminal || isLaundryTerminal) ? (
              <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2.5 overflow-hidden h-full">
                <div
                  className={`w-full lg:w-[62%] flex flex-col h-full min-h-0 rounded-xl border overflow-hidden ${
                    isLight
                      ? 'bg-white border-purple-500/50 shadow-sm text-slate-900'
                      : 'bg-slate-900 border-purple-500/30 text-white'
                  }`}
                >
                  {isSalonServiceTerminal ? (
                    <>
                      <div
                        className={`p-2.5 border-b space-y-2 shrink-0 ${
                          isLight ? 'bg-purple-50/60 border-purple-200' : 'bg-purple-500/10 border-purple-500/25'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-purple-700 dark:text-purple-300">
                              ✂️ Stylist / Kapster Utama:
                            </span>
                            <select
                              value={selectedServiceStylist?.id || ''}
                              onChange={(e) => {
                                const picked = activeServiceStylists.find((s) => s.id === e.target.value);
                                setSelectedStylistId(e.target.value);
                                setStylistName(picked?.name || '');
                              }}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-medium outline-none cursor-pointer ${
                                isLight
                                  ? 'bg-white border-purple-300 text-slate-900'
                                  : 'bg-slate-950 border-purple-500/40 text-white'
                              }`}
                            >
                              {activeServiceStylists.length === 0 ? (
                                <option value="">Belum ada Stylist Aktif</option>
                              ) : (
                                activeServiceStylists.map((st) => (
                                  <option key={st.id} value={st.id}>
                                    {st.name} — {st.role} (Komisi {st.commissionRate}%)
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                          {serviceCartCommissionSummary && serviceCartCommissionSummary.totalCommission > 0 && (
                            <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35">
                              Est. Komisi Jasa: Rp {serviceCartCommissionSummary.totalCommission.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-purple-500/20">
                          <div className="flex items-center gap-1 flex-wrap">
                            {(
                              [
                                { id: 'ALL' as const, label: 'Semua' },
                                { id: 'LAYANAN_SATUAN' as const, label: 'Satuan' },
                                { id: 'PAKET_BUNDLING' as const, label: 'Paket Bundling' },
                                { id: 'LAYANAN_ADDON' as const, label: 'Add-on' },
                                { id: 'PRODUK_RETAIL_SALON' as const, label: 'Retail' },
                              ]
                            ).map((pill) => {
                              const isActive = salonCatalogFilter === pill.id;
                              return (
                                <button
                                  key={pill.id}
                                  type="button"
                                  onClick={() => setSalonCatalogFilter(pill.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition ${
                                    isActive
                                      ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                                      : isLight
                                      ? 'bg-white text-slate-700 border-slate-300 hover:bg-purple-50'
                                      : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
                                  }`}
                                >
                                  {pill.label}
                                </button>
                              );
                            })}
                          </div>
                          <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300">
                            {filteredSalonServiceCatalog.length} Item Aktif
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-h-0 overflow-y-auto p-2.5">
                        {filteredSalonServiceCatalog.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-500 py-8">
                            Belum ada layanan/produk pada kategori filter ini.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                            {filteredSalonServiceCatalog.map((svc) => {
                              const isSvcItem = svc.itemType === 'SERVICE';
                              const fmtMeta = getServiceFormatMeta(svc);
                              return (
                                <button
                                  key={svc.id}
                                  type="button"
                                  onClick={() => handleAddToCart(svc, 1)}
                                  className={`text-left p-2.5 rounded-xl border transition cursor-pointer active:scale-[0.99] flex flex-col justify-between gap-2 ${
                                    isLight
                                      ? 'bg-white hover:bg-purple-50/70 border-slate-200 hover:border-purple-400 text-slate-900 shadow-2xs'
                                      : 'bg-slate-950/80 hover:bg-purple-950/40 border-slate-800 hover:border-purple-400/70 text-slate-100'
                                  }`}
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-start justify-between gap-1.5">
                                      <span className="text-xs font-semibold leading-snug line-clamp-2">
                                        {svc.name}
                                      </span>
                                      <span
                                        className={`shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded border ${fmtMeta.badgeClass}`}
                                      >
                                        {fmtMeta.shortLabel}
                                      </span>
                                    </div>
                                    {svc.packageDetails && (
                                      <div className="text-[10px] leading-snug text-amber-700 dark:text-amber-300/90 line-clamp-2">
                                        Isi: {svc.packageDetails}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-200/70 dark:border-slate-800/80">
                                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                      Rp {Number(svc.sell_price || 0).toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                      {isSvcItem
                                        ? `⏱ ${svc.serviceDuration || '30 mnt'}`
                                        : `Stok ${svc.stock ?? 0}`}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className={`px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-1.5 border-b shrink-0 ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/90 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <button
                            id="btn-laundry-tab-order"
                            type="button"
                            onClick={() => setLaundryActiveTab('ORDER')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                              laundryActiveTab === 'ORDER'
                                ? 'bg-cyan-600 text-white shadow-xs'
                                : isLight
                                ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                                : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                            }`}
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Transaksi &amp; Input Order</span>
                          </button>
                          <button
                            id="btn-laundry-tab-tracking"
                            type="button"
                            onClick={() => setLaundryActiveTab('TRACKING')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                              laundryActiveTab === 'TRACKING'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : isLight
                                ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                                : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                            }`}
                          >
                            <ClipboardList className="w-3 h-3" />
                            <span>Tracking Cucian &amp; Rak</span>
                            <span
                              className={`px-1 py-0 rounded text-[10px] font-mono font-bold ${
                                laundryActiveTab === 'TRACKING'
                                  ? 'bg-black/25 text-white'
                                  : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                              }`}
                            >
                              {activeLaundryQueueCount}
                            </span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              Est. Selesai ({computedLaundrySla.label}): {computedLaundrySla.display}
                            </span>
                          </span>
                        </div>
                      </div>

                      {laundryActiveTab === 'TRACKING' ? (
                        <div className="flex-1 min-h-0 flex flex-col p-2.5 overflow-hidden">
                          <LaundryTrackingBoard onBackToOrder={() => setLaundryActiveTab('ORDER')} />
                        </div>
                      ) : (
                        <>
                          <div className="px-2.5 py-1 bg-cyan-500/10 flex flex-wrap items-center justify-between gap-1.5 text-[11px] leading-4 shrink-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
                                <span>🧺</span>
                                <span>Kasir Laundry Multi-Satuan</span>
                              </span>
                              <input
                                type="text"
                                value={stylistName}
                                onChange={(e) => setStylistName(e.target.value)}
                                placeholder="Rak / Petugas..."
                                className={`w-28 h-6 px-2 py-0 rounded-md border text-[11px] outline-none ${
                                  isLight
                                    ? 'bg-white border-slate-300 text-slate-900'
                                    : 'bg-slate-900 border-slate-700 text-white'
                                }`}
                              />
                              {scaleLiveState.connected && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>
                                    Serial: {scaleLiveState.netKg.toFixed(2)} kg
                                  </span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {luasLaundryServices.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAreaTargetCartIndex(null);
                                    setAreaModalService(luasLaundryServices[0]);
                                  }}
                                  className="px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-sm transition active:scale-[0.99]"
                                >
                                  <Maximize2 className="w-3 h-3" />
                                  <span>Hitung P×L (m²)</span>
                                </button>
                              )}
                              <button
                                id="btn-open-digital-scale"
                                type="button"
                                onClick={() => {
                                  const selectedRow =
                                    selectedCartIndex !== null ? cart[selectedCartIndex] : undefined;
                                  const defaultKiloan =
                                    selectedRow && selectedRow.product.laundryUnitType === 'KILOAN'
                                      ? selectedRow.product
                                      : kiloanLaundryServices[0] || null;
                                  setScaleTargetService(defaultKiloan);
                                  setIsDigitalScaleModalOpen(true);
                                }}
                                className="px-2.5 py-0.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-sm transition active:scale-[0.99]"
                              >
                                <Scale className="w-3 h-3" />
                                <span>Timbangan Digital</span>
                              </button>
                            </div>
                          </div>

                          <div
                            className={`px-2.5 py-1.5 border-t grid grid-cols-2 sm:grid-cols-6 gap-1.5 items-end shrink-0 ${
                              isLight ? 'bg-cyan-50/40 border-slate-200' : 'bg-slate-900/80 border-slate-800'
                            }`}
                          >
                            <div>
                              <label className="block text-[9px] leading-3 font-mono uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                                Nama Pelanggan
                              </label>
                              <input
                                id="input-laundry-customer-name"
                                type="text"
                                value={selectedCustomer?.name || laundryCustomerName}
                                onChange={(e) => {
                                  if (selectedCustomer) handleClearCustomer();
                                  setLaundryCustomerName(e.target.value);
                                }}
                                placeholder="Walk-in / Nama..."
                                className={`w-full h-7 px-2 py-0.5 rounded-md border text-[11px] outline-none ${
                                  isLight
                                    ? 'bg-white border-slate-300 text-slate-900'
                                    : 'bg-slate-950 border-slate-700 text-white'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] leading-3 font-mono uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                                No. WhatsApp
                              </label>
                              <input
                                id="input-laundry-customer-wa"
                                type="tel"
                                value={selectedCustomer?.phone || laundryCustomerPhone}
                                onChange={(e) => setLaundryCustomerPhone(e.target.value)}
                                placeholder="0812xxxx..."
                                className={`w-full h-7 px-2 py-0.5 rounded-md border text-[11px] font-mono outline-none ${
                                  isLight
                                    ? 'bg-white border-slate-300 text-slate-900'
                                    : 'bg-slate-950 border-slate-700 text-white'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] leading-3 font-mono uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                                Fisik (Total Pcs)
                              </label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setLaundryTotalPieces((p) => Math.max(1, p - 1))}
                                  className={`w-6 h-7 rounded-md border flex items-center justify-center cursor-pointer ${
                                    isLight
                                      ? 'bg-white border-slate-300 text-slate-700'
                                      : 'bg-slate-950 border-slate-700 text-slate-200'
                                  }`}
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <input
                                  id="input-laundry-total-pcs"
                                  type="number"
                                  min={1}
                                  value={laundryTotalPieces}
                                  onChange={(e) =>
                                    setLaundryTotalPieces(Math.max(1, parseInt(e.target.value, 10) || 1))
                                  }
                                  className={`w-full h-7 text-center rounded-md border text-[11px] font-mono font-bold outline-none ${
                                    isLight
                                      ? 'bg-white border-slate-300 text-slate-900'
                                      : 'bg-slate-950 border-slate-700 text-white'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => setLaundryTotalPieces((p) => p + 1)}
                                  className={`w-6 h-7 rounded-md border flex items-center justify-center cursor-pointer ${
                                    isLight
                                      ? 'bg-white border-slate-300 text-slate-700'
                                      : 'bg-slate-950 border-slate-700 text-slate-200'
                                  }`}
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[9px] leading-3 font-mono uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                                Catatan Kondisi Awal
                              </label>
                              <input
                                id="input-laundry-condition-notes"
                                type="text"
                                value={laundryConditionNotes}
                                onChange={(e) => setLaundryConditionNotes(e.target.value)}
                                placeholder="Pisah putih, ada noda..."
                                className={`w-full h-7 px-2 py-0.5 rounded-md border text-[11px] outline-none ${
                                  isLight
                                    ? 'bg-white border-slate-300 text-slate-900'
                                    : 'bg-slate-950 border-slate-700 text-white'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] leading-3 font-mono uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                                Paket SLA
                              </label>
                              <select
                                value={String(laundrySlaOverrideHours)}
                                onChange={(e) =>
                                  setLaundrySlaOverrideHours(
                                    e.target.value === 'AUTO' ? 'AUTO' : Number(e.target.value)
                                  )
                                }
                                className={`w-full h-7 px-1.5 py-0.5 rounded-md border text-[11px] outline-none cursor-pointer ${
                                  isLight
                                    ? 'bg-white border-indigo-300 text-indigo-900'
                                    : 'bg-slate-950 border-indigo-500/40 text-indigo-200'
                                }`}
                              >
                                <option value="AUTO">Auto ({computedLaundrySla.hours}j)</option>
                                <option value="6">Express 6j</option>
                                <option value="24">Kilat 24j</option>
                                <option value="48">Reguler 48j</option>
                              </select>
                            </div>
                          </div>

                          <div
                            className={`px-2.5 py-1.5 border-t border-b flex flex-wrap items-center justify-between gap-1.5 shrink-0 ${
                              isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-1 flex-wrap">
                              {(
                                [
                                  { id: 'ALL', label: 'Semua' },
                                  { id: 'KILOAN', label: 'Kiloan (kg)' },
                                  { id: 'SATUAN', label: 'Satuan (pcs/stel)' },
                                  { id: 'PASANG', label: 'Pasang' },
                                  { id: 'LUAS', label: 'Luas (m²)' },
                                ] as const
                              ).map((tab) => (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() => setLaundryCatalogFilter(tab.id)}
                                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition ${
                                    laundryCatalogFilter === tab.id
                                      ? 'bg-cyan-600 text-white border-cyan-500'
                                      : isLight
                                      ? 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>
                            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-300">
                              {filteredQuickLaundryServices.length} Layanan
                            </span>
                          </div>

                          <div className="flex-1 min-h-0 overflow-y-auto p-2.5">
                            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                              {filteredQuickLaundryServices.map((srv) => {
                                const isKiloan =
                                  srv.laundryUnitType === 'KILOAN' ||
                                  (srv.unit || '').toLowerCase() === 'kg';
                                const isLuas =
                                  srv.laundryUnitType === 'LUAS' ||
                                  (srv.unit || '').toLowerCase().includes('m2');
                                const minOrderVal = Number(srv.minOrderWeightKg ?? srv.minOrderQty ?? 0);
                                return (
                                  <div
                                    key={srv.id}
                                    onClick={() => handleAddToCart(srv, 1)}
                                    className={`p-2.5 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                                      isLight
                                        ? 'bg-white hover:border-cyan-500 border-slate-200 shadow-2xs'
                                        : 'bg-slate-950/80 hover:border-cyan-400/60 border-slate-800'
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                                          {srv.laundryUnitType || srv.unit}
                                        </span>
                                        {srv.slaDuration && (
                                          <span className="text-[9px] font-mono text-indigo-600 dark:text-indigo-300 truncate">
                                            ⏱ {srv.slaDuration}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs font-semibold leading-snug line-clamp-2">
                                        {srv.name}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-200/70 dark:border-slate-800">
                                      <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        Rp {srv.sell_price.toLocaleString('id-ID')}/{srv.unit}
                                      </div>
                                      {isKiloan ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setScaleTargetService(srv);
                                            setIsDigitalScaleModalOpen(true);
                                          }}
                                          className="px-1.5 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-semibold flex items-center gap-0.5 cursor-pointer"
                                        >
                                          <Scale className="w-2.5 h-2.5" />
                                          <span>Timbang</span>
                                        </button>
                                      ) : isLuas ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAreaTargetCartIndex(null);
                                            setAreaModalService(srv);
                                          }}
                                          className="px-1.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-semibold flex items-center gap-0.5 cursor-pointer"
                                        >
                                          <Maximize2 className="w-2.5 h-2.5" />
                                          <span>P×L</span>
                                        </button>
                                      ) : minOrderVal > 1 ? (
                                        <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400">
                                          Min {minOrderVal}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div
                  className={`w-full lg:w-[38%] flex flex-col h-full min-h-0 rounded-xl border overflow-hidden ${
                    isLight
                      ? 'bg-white border-cyan-500/60 shadow-sm text-slate-900'
                      : 'bg-slate-900 border-cyan-500/35 text-white'
                  }`}
                >
                  <div
                    className={`px-3 py-2 border-b flex items-center justify-between text-xs shrink-0 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span className="font-semibold text-xs sm:text-sm">Daftar Belanja</span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                        {cart.length} SKU •{' '}
                        {Number.isInteger(totalCartItemCount)
                          ? totalCartItemCount
                          : totalCartItemCount.toFixed(2)}{' '}
                        {isLaundryTerminal ? 'Unit' : 'Item'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsManualSearchOpen(true)}
                      className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium text-xs cursor-pointer flex items-center gap-1 active:scale-[0.99] transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Pilih Layanan [F3]</span>
                    </button>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                        <Barcode className="w-7 h-7 text-cyan-500/50" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Klik kartu layanan di sebelah kiri atau tekan [F3] untuk menambah pesanan
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsManualSearchOpen(true)}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-lg cursor-pointer transition"
                        >
                          + Pilih Layanan [F3]
                        </button>
                      </div>
                    ) : (
                      cart.map((item, idx) => {
                        const fmtMeta = getServiceFormatMeta(item.product);
                        const itemUnit = item.selectedUnit || item.product.unit || 'Sesi';
                        const rawUnitPrice = item.product.sell_price || 0;
                        const unitDisc = item.itemDiscount || 0;
                        const effectiveUnitPrice = Math.max(0, rawUnitPrice - unitDisc);
                        return (
                          <div
                            key={`svc-cart-${item.product.id}-${idx}`}
                            onClick={() => setSelectedCartIndex(idx)}
                            className={`p-2 rounded-xl border text-xs transition ${
                              idx === selectedCartIndex
                                ? isLight
                                  ? 'bg-cyan-50/70 border-cyan-400'
                                  : 'bg-cyan-500/10 border-cyan-500/40'
                                : isLight
                                ? 'bg-white border-slate-200 hover:bg-slate-50'
                                : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold leading-snug">
                                    {item.product.name}
                                  </span>
                                  <span
                                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${fmtMeta.badgeClass}`}
                                  >
                                    {fmtMeta.shortLabel}
                                  </span>
                                </div>
                                {item.product.packageDetails && (
                                  <div className="text-[10px] text-amber-700 dark:text-amber-300/90 leading-snug">
                                    Isi: {item.product.packageDetails}
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                    {item.quantity} {itemUnit} × Rp{' '}
                                    {effectiveUnitPrice.toLocaleString('id-ID')}
                                  </span>
                                  {isSalonServiceTerminal && (
                                    <div
                                      className="inline-flex items-center gap-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {item.product.itemType === 'SERVICE' ? (
                                        <select
                                          value={item.stylistId || selectedServiceStylist?.id || ''}
                                          onChange={(e) => {
                                            const picked = activeServiceStylists.find(
                                              (s) => s.id === e.target.value
                                            );
                                            setCart((prev) =>
                                              prev.map((row, rowIdx) =>
                                                rowIdx === idx
                                                  ? {
                                                      ...row,
                                                      stylistId: picked?.id,
                                                      stylistName: picked?.name,
                                                      stylistCommissionRate: picked?.commissionRate,
                                                    }
                                                  : row
                                              )
                                            );
                                          }}
                                          className={`text-[10px] font-medium py-0.5 px-1.5 rounded border cursor-pointer outline-none ${
                                            isLight
                                              ? 'bg-purple-50 border-purple-300 text-purple-800'
                                              : 'bg-purple-500/15 border-purple-500/35 text-purple-200'
                                          }`}
                                        >
                                          {activeServiceStylists.map((st) => (
                                            <option key={st.id} value={st.id}>
                                              ✂️ {st.name} ({st.commissionRate}%)
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                          Non-Komisi
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {isLaundryTerminal &&
                                    (item.product.laundryUnitType === 'KILOAN' ||
                                      (item.product.unit || '').toLowerCase() === 'kg') && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedCartIndex(idx);
                                          setScaleTargetService(item.product);
                                          setIsDigitalScaleModalOpen(true);
                                        }}
                                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer flex items-center gap-0.5"
                                      >
                                        <Scale className="w-2.5 h-2.5" />
                                        <span>Timbang</span>
                                      </button>
                                    )}
                                </div>
                              </div>

                              <div
                                className="flex flex-col items-end gap-1 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                  Rp {item.subtotal.toLocaleString('id-ID')}
                                </span>
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(idx, -1)}
                                    className={`w-5 h-5 flex items-center justify-center rounded border text-[10px] cursor-pointer transition ${
                                      isLight
                                        ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
                                        : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-white'
                                    }`}
                                    title="Kurangi Qty"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                  <input
                                    type="number"
                                    step="any"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleDirectQtyChange(idx, parseFloat(e.target.value) || 1)
                                    }
                                    className={`w-11 h-5 text-center font-mono text-[11px] border rounded ${
                                      isLight
                                        ? 'border-slate-300 bg-white text-slate-900'
                                        : 'border-slate-700 bg-slate-900 text-white'
                                    }`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(idx, 1)}
                                    className={`w-5 h-5 flex items-center justify-center rounded border text-[10px] cursor-pointer transition ${
                                      isLight
                                        ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
                                        : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-white'
                                    }`}
                                    title="Tambah Qty"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRequestRemoveItem(idx)}
                                    className="w-5 h-5 flex items-center justify-center rounded border border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 cursor-pointer ml-0.5"
                                    title="Hapus Item"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div
                    className={`p-2.5 border-t space-y-2 shrink-0 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <span>Subtotal:</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200">
                            Rp {subtotalBeforePromo.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsTaxIncluded(!isTaxIncluded)}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono border cursor-pointer transition ${
                              isTaxIncluded
                                ? 'bg-cyan-600 text-white border-cyan-500'
                                : isLight
                                ? 'bg-white text-slate-600 border-slate-300'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            PPN {isTaxIncluded ? '+11%' : '0%'}
                          </button>
                          <span className="font-mono text-[11px]">
                            Rp {taxAmount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          TOTAL
                        </div>
                        <div
                          id="pos-grand-total-display"
                          className="font-mono font-bold text-lg sm:text-xl text-emerald-600 dark:text-emerald-400 tabular-nums"
                        >
                          Rp {grandTotal.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>

                    {isLaundryTerminal && (
                      <div
                        className={`grid grid-cols-3 p-0.5 rounded-lg border text-[11px] gap-0.5 ${
                          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        {(
                          [
                            { id: 'LUNAS_AWAL' as LaundryPaymentStatus, label: 'Lunas Awal' },
                            { id: 'DP' as LaundryPaymentStatus, label: 'DP' },
                            { id: 'BAYAR_AMBIL' as LaundryPaymentStatus, label: 'Bayar Ambil' },
                          ]
                        ).map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              setLaundryPaymentStatus(st.id);
                              if (st.id === 'DP' && laundryDpAmount === 0) {
                                setLaundryDpAmount(Math.round(grandTotal * 0.5));
                              }
                            }}
                            className={`py-1 px-2 rounded-md font-semibold cursor-pointer transition ${
                              laundryPaymentStatus === st.id
                                ? st.id === 'LUNAS_AWAL'
                                  ? 'bg-emerald-600 text-white'
                                  : st.id === 'DP'
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-indigo-600 text-white'
                                : isLight
                                ? 'text-slate-700 hover:bg-slate-200'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {paymentMethod === 'SPLIT' ? (
                      <div className="p-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 space-y-1">
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 block">
                              Nominal Tunai (1-10101):
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={splitCashAmount || ''}
                              onChange={(e) =>
                                setSplitCashAmount(Math.max(0, Number(e.target.value) || 0))
                              }
                              placeholder="0"
                              className={`h-7 w-full px-1.5 text-xs font-mono font-semibold border rounded outline-none ${
                                isLight
                                  ? 'border-emerald-500/60 bg-white text-slate-900'
                                  : 'border-emerald-500/50 bg-slate-900 text-white'
                              }`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-mono text-indigo-600 dark:text-indigo-300">
                                Non-Tunai ({splitNonCashChannel}):
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const next =
                                    splitNonCashChannel === 'QRIS'
                                      ? 'DEBIT'
                                      : splitNonCashChannel === 'DEBIT'
                                      ? 'TRANSFER'
                                      : 'QRIS';
                                  setSplitNonCashChannel(next);
                                }}
                                className="text-[9px] font-mono px-1 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 cursor-pointer"
                              >
                                Ubah
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                value={splitNonCashAmount || ''}
                                onChange={(e) =>
                                  setSplitNonCashAmount(Math.max(0, Number(e.target.value) || 0))
                                }
                                placeholder="0"
                                className={`h-7 w-full px-1.5 text-xs font-mono font-semibold border rounded outline-none ${
                                  isLight
                                    ? 'border-indigo-500/60 bg-white text-slate-900'
                                    : 'border-indigo-500/50 bg-slate-900 text-white'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setSplitNonCashAmount(Math.max(0, grandTotal - splitCashAmount))
                                }
                                className="h-7 px-1.5 rounded text-[10px] font-semibold bg-indigo-600 text-white cursor-pointer shrink-0"
                              >
                                Sisa
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
                          <span className="text-slate-500 dark:text-slate-400">
                            Status Split (1-10101 + 1-10102):
                          </span>
                          <span
                            className={`font-bold ${
                              splitShortfall === 0 && grandTotal > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-500'
                            }`}
                          >
                            {splitShortfall === 0 && grandTotal > 0
                              ? '✓ LUNAS 100%'
                              : `Kurang: Rp ${splitShortfall.toLocaleString('id-ID')}`}
                          </span>
                        </div>
                      </div>
                    ) : isKasbonAllowedForSector &&
                      (paymentMethod === 'KREDIT / TEMPO (AR)' ||
                        (isLaundryTerminal && laundryPaymentStatus !== 'LUNAS_AWAL')) ? (
                      <div className="p-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 whitespace-nowrap">
                              Bayar DP Awal (Rp):
                            </span>
                            <input
                              id="pos-kasbon-dp-input"
                              type="number"
                              min={0}
                              max={grandTotal}
                              value={effectiveKasbonDp || ''}
                              onChange={(e) => {
                                const val = Math.max(
                                  0,
                                  Math.min(grandTotal, Number(e.target.value) || 0)
                                );
                                setKasbonDpAmount(val);
                                if (isLaundryTerminal) {
                                  setLaundryDpAmount(val);
                                  setLaundryPaymentStatus(val > 0 ? 'DP' : 'BAYAR_AMBIL');
                                }
                              }}
                              placeholder="0 (Kasbon 100%)"
                              className={`h-7 w-24 px-1.5 text-xs font-mono font-semibold text-center border rounded-lg outline-none ${
                                isLight
                                  ? 'border-amber-400 bg-white text-slate-900'
                                  : 'border-amber-500/50 bg-slate-900 text-white'
                              }`}
                            />
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 block">
                              Sisa Piutang / Kasbon (1-10105):
                            </span>
                            <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                              Rp {kasbonRemainingPiutang.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono pt-0.5 border-t border-amber-500/20">
                          <span
                            className={
                              resolvedTopBarCustomerName
                                ? 'text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[170px]'
                                : 'text-amber-600 dark:text-amber-400 font-semibold'
                            }
                          >
                            {resolvedTopBarCustomerName
                              ? `Pelanggan: ${resolvedTopBarCustomerName}`
                              : '* Wajib Isi Pelanggan di Bar Atas'}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            Tempo: +14 Hr ({kasbonDefaultDueInfo.display})
                          </span>
                        </div>
                      </div>
                    ) : paymentMethod === 'CASH' ? (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70 dark:border-slate-800">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Diterima:
                          </span>
                          <input
                            ref={cashInputRef}
                            id="pos-cash-given-input"
                            type="number"
                            min="0"
                            value={cashGiven || ''}
                            placeholder="0"
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setCashGiven(val);
                              if (isCashUnderpaid && val >= grandTotal) setIsCashUnderpaid(false);
                            }}
                            onKeyDown={handleCashInputKeyDown}
                            className={`h-7 w-24 px-2 text-xs font-mono font-semibold text-center border rounded-lg outline-none transition ${
                              isCashUnderpaid
                                ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : isLight
                                ? 'border-emerald-500/60 bg-white text-slate-900'
                                : 'border-emerald-500/50 bg-slate-900 text-white'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCashGiven(grandTotal);
                              setIsCashUnderpaid(false);
                            }}
                            className="h-7 px-2 rounded-lg text-[11px] font-medium bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition"
                          >
                            Pas
                          </button>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            {cashGiven >= grandTotal ? 'Kembalian:' : 'Kurang:'}
                          </span>
                          <span
                            className={`font-mono font-bold text-xs sm:text-sm ${
                              cashGiven >= grandTotal
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-500'
                            }`}
                          >
                            Rp{' '}
                            {(cashGiven >= grandTotal
                              ? changeAmount
                              : grandTotal - cashGiven
                            ).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500">
                          Metode Non-Tunai:
                        </span>
                        <button
                          type="button"
                          onClick={() => paymentMethod === 'QRIS' && setIsQrisModalOpen(true)}
                          className="h-7 px-2.5 rounded-lg text-[11px] font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 cursor-pointer"
                        >
                          {paymentMethod === 'QRIS' ? 'Buka QRIS Dinamis' : 'Mesin EDC Siap'}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <div
                        className={`grid ${
                          isKasbonAllowedForSector ? 'grid-cols-5' : 'grid-cols-4'
                        } p-0.5 rounded-lg border text-[11px] gap-0.5 flex-1 ${
                          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('CASH');
                            if (isLaundryTerminal) setLaundryPaymentStatus('LUNAS_AWAL');
                          }}
                          className={`h-8 px-1.5 rounded-md cursor-pointer text-[10px] font-medium whitespace-nowrap transition ${
                            paymentMethod === 'CASH'
                              ? 'bg-cyan-600 text-white shadow-xs'
                              : isLight
                              ? 'text-slate-700 hover:text-slate-900'
                              : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          💵 Tunai
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('QRIS');
                            if (!isLaundryTerminal || laundryPaymentStatus === 'LUNAS_AWAL') {
                              setIsQrisModalOpen(true);
                            }
                          }}
                          className={`h-8 px-1.5 rounded-md cursor-pointer text-[10px] font-medium whitespace-nowrap transition ${
                            paymentMethod === 'QRIS'
                              ? 'bg-cyan-600 text-white shadow-xs'
                              : isLight
                              ? 'text-slate-700 hover:text-slate-900'
                              : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          📱 QRIS
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('EDC_DEBIT')}
                          className={`h-8 px-1.5 rounded-md cursor-pointer text-[10px] font-medium whitespace-nowrap transition ${
                            paymentMethod === 'EDC_DEBIT'
                              ? 'bg-cyan-600 text-white shadow-xs'
                              : isLight
                              ? 'text-slate-700 hover:text-slate-900'
                              : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          💳 Debit
                        </button>
                        <button
                          type="button"
                          onClick={handleSelectSplitPayment}
                          className={`h-8 px-1.5 rounded-md cursor-pointer text-[10px] font-semibold whitespace-nowrap transition ${
                            paymentMethod === 'SPLIT'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : isLight
                              ? 'text-indigo-700 hover:bg-indigo-50'
                              : 'text-indigo-300 hover:text-white'
                          }`}
                        >
                          🔀 Split
                        </button>
                        {isKasbonAllowedForSector && (
                          <button
                            type="button"
                            onClick={handleSelectKasbonPayment}
                            className={`h-8 px-1.5 rounded-md cursor-pointer text-[10px] font-semibold whitespace-nowrap transition ${
                              paymentMethod === 'KREDIT / TEMPO (AR)'
                                ? 'bg-amber-500 text-slate-950 shadow-xs'
                                : isLight
                                ? 'text-amber-700 hover:bg-amber-50'
                                : 'text-amber-300 hover:text-white'
                            }`}
                          >
                            📋 Kasbon/DP
                          </button>
                        )}
                      </div>

                      <button
                        id="btn-process-pos-sale"
                        type="button"
                        onClick={handleManualBayarClick}
                        disabled={
                          cart.length === 0 || (paymentMethod === 'SPLIT' && !isSplitReadyToPay)
                        }
                        className="h-9 px-3 rounded-xl font-semibold text-xs whitespace-nowrap flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-[0.99] transition cursor-pointer disabled:opacity-40 shrink-0"
                      >
                        <Wallet className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {paymentMethod === 'SPLIT'
                            ? isSplitReadyToPay
                              ? 'Bayar Split [F10]'
                              : 'Belum Lunas'
                            : paymentMethod === 'KREDIT / TEMPO (AR)' ||
                              (isLaundryTerminal && laundryPaymentStatus !== 'LUNAS_AWAL')
                            ? 'Simpan Kasbon [F10]'
                            : 'Bayar [F10]'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                id="card-pos-cart-table"
                className={`${
                  isLaundryTerminal && laundryActiveTab !== 'TRACKING'
                    ? 'flex-1 min-h-fit'
                    : 'flex-1 min-h-0'
                } flex flex-col rounded-xl border overflow-hidden transition-all duration-200 ${
                  isLight
                    ? 'border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] bg-white text-slate-900'
                    : 'border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] bg-slate-900 text-white'
                }`}
              >
                {activeTerminal?.id === 'T-01' && (
                  <div className="px-3 py-1.5 bg-cyan-500/10 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-2 text-xs leading-5">
                    <span className="font-medium text-cyan-600 dark:text-cyan-400">
                      POS Retail Operating Mode:
                    </span>
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      Scan Barcode [F2] Aktif • Diskon Item Didukung
                    </span>
                  </div>
                )}
                {activeTerminal?.id === 'T-02' && (
                  <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs leading-5">
                    <span className="font-medium text-amber-600 dark:text-amber-400">F&amp;B Mode:</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleChangeFnbOrderMode(
                          fnbOrderMode === 'Dine-In'
                            ? 'Takeaway'
                            : fnbOrderMode === 'Takeaway'
                            ? 'Delivery'
                            : 'Dine-In'
                        )
                      }
                      className="px-2 py-0.5 rounded bg-amber-500 text-black font-normal text-[11px] cursor-pointer active:scale-[0.99]"
                    >
                      {fnbOrderMode}
                    </button>
                    {fnbOrderMode === 'Dine-In' ? (
                      <>
                        <span className="text-slate-400 ml-2">Meja:</span>
                        <input
                          type="text"
                          value={fnbTableNo}
                          onChange={(e) => handleChangeFnbTableNo(e.target.value)}
                          className="w-16 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-center font-normal text-xs outline-none"
                        />
                      </>
                    ) : (
                      <span className="ml-2 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[11px]">
                        {fnbOrderMode === 'Delivery'
                          ? 'Tanpa Meja • Kurir'
                          : 'Tanpa Meja • Bungkus'}
                      </span>
                    )}
                  </div>
                )}
                {activeTerminal?.id === 'T-03' && (
                  <div className="px-3 py-1.5 bg-emerald-500/10 border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs leading-5">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">POS Grosir &amp; Distribusi:</span>
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      Ecer / Member / Grosir otomatis aktif • Satuan: Pcs/Box/Karton
                    </span>
                  </div>
                )}
                {isFashionTerminal && (
                  <div className="border-b border-purple-500/25 shrink-0">
                    <div
                      className={`px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs ${
                        isLight
                          ? 'bg-purple-50/75 text-slate-900'
                          : 'bg-purple-950/20 text-slate-100'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-600 text-white text-[11px] font-semibold">
                          <Shirt className="w-3.5 h-3.5" />
                          <span>POS Butik &amp; Fashion</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <select
                            id="select-fashion-advisor"
                            value={fashionAdvisorId}
                            onChange={(e) => setFashionAdvisorId(e.target.value)}
                            className={`h-7 px-2 rounded-lg border text-[11px] outline-none cursor-pointer ${
                              isLight
                                ? 'bg-white border-purple-300 text-slate-800'
                                : 'bg-slate-950 border-purple-500/35 text-slate-100'
                            }`}
                          >
                            <option value="">Pramuniaga: Kasir Langsung</option>
                            {fashionAdvisorChoices.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name} ({emp.fashionCommissionRate ?? 2}%)
                              </option>
                            ))}
                          </select>
                          {selectedFashionAdvisor && (
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                              Komisi {selectedFashionAdvisor.fashionCommissionRate ?? 2}%: Rp {fashionAdvisorCommission.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          id="btn-fashion-variant-matrix"
                          type="button"
                          onClick={() => {
                            const selectedRow =
                              selectedCartIndex !== null ? cart[selectedCartIndex] : cart[0];
                            if (selectedRow && selectedRow.product.variantMatrix?.length) {
                              setVariantPickerState({
                                product: selectedRow.product,
                                mode: 'ADD',
                                initialSize: selectedRow.selectedFashionSize,
                                initialColor: selectedRow.selectedFashionColor,
                              });
                            } else {
                              setIsManualSearchOpen(true);
                            }
                          }}
                          className="h-7 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer transition active:scale-[0.99]"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Matriks Ukuran×Warna</span>
                        </button>

                        <button
                          id="btn-fashion-hold-fitting-room"
                          type="button"
                          disabled={cart.length === 0}
                          onClick={handleOpenHoldModal}
                          className="h-7 px-2.5 rounded-lg border border-amber-500/45 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer disabled:opacity-40 transition"
                        >
                          <Pause className="w-3 h-3" />
                          <span>Hold / Fitting Room</span>
                        </button>

                        <button
                          id="btn-fashion-recall-fitting"
                          type="button"
                          onClick={() => setIsHeldOrdersModalOpen(true)}
                          className="h-7 px-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Titipan ({fittingRoomHeldCount > 0 ? fittingRoomHeldCount : heldOrders.length})</span>
                        </button>

                        <button
                          id="btn-fashion-exchange"
                          type="button"
                          onClick={() => setIsFashionExchangeOpen(true)}
                          className="h-7 px-2.5 rounded-lg border border-emerald-500/45 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>Tukar Ukuran / Barang</span>
                        </button>

                        <button
                          id="btn-fashion-quick-nota-disc"
                          type="button"
                          onClick={() => setIsQuickFashionDiscOpen((v) => !v)}
                          className={`h-7 px-2.5 rounded-lg border text-[11px] font-medium flex items-center gap-1 cursor-pointer transition ${
                            calculatedDiscount > 0 || isQuickFashionDiscOpen
                              ? 'bg-rose-600 text-white border-rose-500'
                              : isLight
                              ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                              : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          <Percent className="w-3 h-3" />
                          <span>
                            {calculatedDiscount > 0
                              ? `Disc Nota: -Rp ${calculatedDiscount.toLocaleString('id-ID')}`
                              : 'Diskon Nota'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div
                      className={`px-2.5 py-1 border-t flex items-center gap-1.5 overflow-x-auto ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/70 border-slate-800'
                      }`}
                    >
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 shrink-0">
                        Artikel Cepat:
                      </span>
                      {fashionCatalogSource.slice(0, 7).map((fp) => {
                        const hasClr = Boolean(fp.fashionPromo?.clearanceActive);
                        const hasBnd = Boolean(fp.fashionPromo?.bundleActive);
                        return (
                          <button
                            key={fp.id}
                            type="button"
                            onClick={() => setVariantPickerState({ product: fp, mode: 'ADD' })}
                            className={`px-2 py-0.5 rounded-lg border text-[11px] flex items-center gap-1.5 shrink-0 cursor-pointer transition ${
                              isLight
                                ? 'bg-slate-50 hover:bg-purple-50 border-slate-200 hover:border-purple-400 text-slate-800'
                                : 'bg-slate-950 hover:bg-purple-950/30 border-slate-800 hover:border-purple-500/50 text-slate-200'
                            }`}
                          >
                            <span className="font-medium truncate max-w-[140px]">{fp.name}</span>
                            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                              {(Number(fp.sell_price || 0) / 1000).toFixed(0)}k
                            </span>
                            {hasClr && (
                              <span className="text-[9px] font-mono px-1 rounded bg-rose-500/15 text-rose-600 dark:text-rose-300">
                                {fp.fashionPromo?.clearanceType === 'PERCENT'
                                  ? `-${fp.fashionPromo.clearanceValue}%`
                                  : 'CLR'}
                              </span>
                            )}
                            {!hasClr && hasBnd && (
                              <span className="text-[9px] font-mono px-1 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                                Mix&amp;Match
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {isQuickFashionDiscOpen && (
                      <div
                        className={`px-2.5 py-2 border-t flex flex-wrap items-center gap-2 text-xs ${
                          isLight ? 'bg-rose-50/60 border-rose-200' : 'bg-rose-950/20 border-rose-500/30'
                        }`}
                      >
                        <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setQuickDiscType('PERCENT')}
                            className={`px-2 py-1 text-[11px] font-bold cursor-pointer ${
                              quickDiscType === 'PERCENT'
                                ? 'bg-rose-600 text-white'
                                : 'bg-white dark:bg-slate-900 text-slate-500'
                            }`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickDiscType('IDR')}
                            className={`px-2 py-1 text-[11px] font-bold cursor-pointer ${
                              quickDiscType === 'IDR'
                                ? 'bg-rose-600 text-white'
                                : 'bg-white dark:bg-slate-900 text-slate-500'
                            }`}
                          >
                            Rp
                          </button>
                        </div>

                        <input
                          type="number"
                          min={0}
                          value={quickDiscVal || ''}
                          onChange={(e) => {
                            setQuickDiscVal(Math.max(0, Number(e.target.value) || 0));
                            setQuickDiscPinError(null);
                          }}
                          placeholder={quickDiscType === 'PERCENT' ? 'Diskon %' : 'Nominal Rp'}
                          className={`h-7 w-24 px-2 rounded-lg border font-mono text-xs outline-none ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                          }`}
                        />

                        <select
                          value={quickDiscReason}
                          onChange={(e) => setQuickDiscReason(e.target.value)}
                          className={`h-7 px-2 rounded-lg border text-[11px] outline-none ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                          }`}
                        >
                          <option value="Promo Pelanggan Butik / VIP Member">Promo Pelanggan Butik / VIP Member</option>
                          <option value="Display Sample / Cacat Jahitan Minor">Display Sample / Cacat Jahitan Minor</option>
                          <option value="Negosiasi Paket Koleksi Kasir">Negosiasi Paket Koleksi Kasir</option>
                          <option value="Diskon Kebijakan Khusus Manajemen Toko">Kebijakan Khusus Manajemen</option>
                        </select>

                        {((quickDiscType === 'PERCENT' && quickDiscVal > 15) ||
                          (quickDiscType === 'IDR' && subtotal > 0 && (quickDiscVal / subtotal) * 100 > 15)) &&
                          !quickDiscSpvName && (
                            <input
                              type="password"
                              maxLength={4}
                              value={quickDiscPin}
                              onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                                setQuickDiscPin(v);
                                setQuickDiscPinError(null);
                              }}
                              placeholder="PIN SPV (1234/8888)"
                              className={`h-7 w-32 px-2 rounded-lg border font-mono text-xs outline-none ${
                                isLight ? 'bg-amber-50 border-amber-400 text-slate-900' : 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                              }`}
                            />
                          )}

                        <button
                          type="button"
                          onClick={handleApplyQuickFashionNoteDiscount}
                          className="h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Terapkan
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickDiscVal(0);
                            setDiscountPercent(0);
                            setDiscountAmount(0);
                            setManualDiscountReason('');
                            setManualDiscountAuthorizedBy('');
                            setQuickDiscSpvName('');
                            setIsQuickFashionDiscOpen(false);
                          }}
                          className="h-7 px-2 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] cursor-pointer"
                        >
                          Reset
                        </button>
                        {quickDiscPinError && (
                          <span className="text-[11px] font-semibold text-rose-500">{quickDiscPinError}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {(activeTerminal?.id === 'T-05' || isBuildingTerminal) && (
                  <div className="px-3 py-1.5 bg-indigo-500/10 border-b border-indigo-500/20 flex flex-wrap items-center gap-2 text-xs leading-5">
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">Depo Bangunan:</span>
                    <div className="flex items-center gap-1 rounded-lg border border-indigo-500/30 p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryPolicy('LOCO');
                          setDeliveryMethod('DIRECT');
                          setDeliveryFleetActive(false);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition ${
                          deliveryPolicy === 'LOCO' && deliveryMethod === 'DIRECT'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-500 dark:text-slate-300'
                        }`}
                      >
                        Loco (Ambil Sendiri)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryPolicy('FRANGKO');
                          setDeliveryMethod('FLEET_DELIVERY');
                          setDeliveryFleetActive(true);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition ${
                          deliveryPolicy === 'FRANGKO' || deliveryMethod === 'FLEET_DELIVERY'
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'text-slate-500 dark:text-slate-300'
                        }`}
                      >
                        Frangko (Kirim Armada DO)
                      </button>
                    </div>
                    {(deliveryPolicy === 'FRANGKO' || deliveryMethod === 'FLEET_DELIVERY' || deliveryFleetActive) && (
                      <>
                        <select
                          value={selectedFleetType}
                          onChange={(e) => setSelectedFleetType(e.target.value as BuildingFleetType)}
                          className={`px-2 py-0.5 rounded border text-[11px] outline-none ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        >
                          <option value="PICKUP_RET">Pick-up (±1.2 m³)</option>
                          <option value="TRUCK_ENGKEL">Truk Engkel (±3.0 m³)</option>
                          <option value="DUMP_TRUCK">Dump Truck (±6.5 m³)</option>
                        </select>
                        <input
                          type="text"
                          value={deliveryDestination}
                          onChange={(e) => setDeliveryDestination(e.target.value)}
                          placeholder="Alamat proyek / tujuan DO..."
                          className={`w-44 px-2 py-0.5 rounded border text-[11px] outline-none ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />
                        <input
                          type="number"
                          min={0}
                          value={shippingFee || ''}
                          onChange={(e) => setShippingFee(Math.max(0, Number(e.target.value) || 0))}
                          placeholder="Ongkir Rp (0=Free)"
                          className={`w-28 px-2 py-0.5 rounded border text-[11px] font-mono outline-none ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />
                      </>
                    )}
                    <span className="text-[10px] text-slate-400 ml-auto font-normal hidden sm:inline">(Support Qty Desimal 1.5, 2.25)</span>
                  </div>
                )}
                {activeTerminal?.id === 'T-06' && (
                  <div className="px-3 py-1.5 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center justify-between text-xs leading-5">
                    <span className="font-medium text-cyan-600 dark:text-cyan-400">Elektronik &amp; Gadget:</span>
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">Input Nomor Seri / IMEI tercetak otomatis pada struk</span>
                  </div>
                )}
                {activeTerminal?.id === 'T-07' && (
                  <div className="px-3 py-1.5 bg-orange-500/10 border-b border-orange-500/20 flex items-center gap-2 text-xs leading-5">
                    <span className="font-medium text-orange-600 dark:text-orange-400">Bengkel:</span>
                    <input type="text" value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} placeholder="No. Polisi..." className="w-32 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono outline-none" />
                    <input type="text" value={mechanicName} onChange={e => setMechanicName(e.target.value)} placeholder="Mekanik..." className="w-28 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs outline-none" />
                  </div>
                )}
                {isLaundryTerminal ? (
                  <div className="border-b border-cyan-500/25 shrink-0">
                    <div
                      className={`px-2.5 py-1 flex flex-wrap items-center justify-between gap-1.5 border-b ${
                        isLight
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-slate-950/90 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <button
                          id="btn-laundry-tab-order"
                          type="button"
                          onClick={() => setLaundryActiveTab('ORDER')}
                          className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                            laundryActiveTab === 'ORDER'
                              ? 'bg-cyan-600 text-white shadow-xs'
                              : isLight
                              ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                              : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>Transaksi &amp; Input Order</span>
                        </button>
                        <button
                          id="btn-laundry-tab-tracking"
                          type="button"
                          onClick={() => setLaundryActiveTab('TRACKING')}
                          className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                            laundryActiveTab === 'TRACKING'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : isLight
                              ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                              : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          <ClipboardList className="w-3 h-3" />
                          <span>Tracking Cucian &amp; Rak</span>
                          <span
                            className={`px-1 py-0 rounded text-[10px] font-mono font-bold ${
                              laundryActiveTab === 'TRACKING'
                                ? 'bg-black/25 text-white'
                                : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                            }`}
                          >
                            {activeLaundryQueueCount}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            Est. Selesai ({computedLaundrySla.label}): {computedLaundrySla.display}
                          </span>
                        </span>
                      </div>
                    </div>

                    {laundryActiveTab === 'ORDER' && (
                      <>
                        <div className="px-2.5 py-1 bg-cyan-500/10 flex flex-wrap items-center justify-between gap-1.5 text-[11px] leading-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
                              <span>🧺</span>
                              <span>Kasir Laundry Multi-Satuan</span>
                            </span>
                            <input
                              type="text"
                              value={stylistName}
                              onChange={(e) => setStylistName(e.target.value)}
                              placeholder="Rak / Petugas..."
                              className={`w-28 h-6 px-2 py-0 rounded-md border text-[11px] outline-none ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-900'
                                  : 'bg-slate-900 border-slate-700 text-white'
                              }`}
                            />
                            {scaleLiveState.connected && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>
                                  Serial: {scaleLiveState.netKg.toFixed(2)} kg (Tare {scaleLiveState.tareKg.toFixed(2)})
                                </span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {luasLaundryServices.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAreaTargetCartIndex(null);
                                  setAreaModalService(luasLaundryServices[0]);
                                }}
                                className="px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-sm transition active:scale-[0.99]"
                              >
                                <Maximize2 className="w-3 h-3" />
                                <span>Hitung P×L (m²)</span>
                              </button>
                            )}
                            <button
                              id="btn-open-digital-scale"
                              type="button"
                              onClick={() => {
                                const selectedRow =
                                  selectedCartIndex !== null ? cart[selectedCartIndex] : undefined;
                                const defaultKiloan =
                                  selectedRow && selectedRow.product.laundryUnitType === 'KILOAN'
                                    ? selectedRow.product
                                    : kiloanLaundryServices[0] || null;
                                setScaleTargetService(defaultKiloan);
                                setIsDigitalScaleModalOpen(true);
                              }}
                              className="px-2.5 py-0.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-sm transition active:scale-[0.99]"
                            >
                              <Scale className="w-3 h-3" />
                              <span>Timbangan Digital</span>
                              {scaleLiveState.netKg > 0 && (
                                <span className="px-1 py-0 rounded bg-black/25 font-mono text-[10px]">
                                  {scaleLiveState.netKg.toFixed(2)} kg
                                </span>
                              )}
                            </button>
                          </div>
                        </div>

                        <div
                          className={`px-2.5 py-1 border-t grid grid-cols-1 md:grid-cols-12 gap-1.5 items-end ${
                            isLight ? 'bg-cyan-50/40 border-slate-200' : 'bg-slate-900/80 border-slate-800'
                          }`}
                        >
                          <div className="md:col-span-2">
                            <label className="block text-[9px] leading-3 font-mono uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                              Nama Pelanggan
                            </label>
                            <input
                              id="input-laundry-customer-name"
                              type="text"
                              value={selectedCustomer?.name || laundryCustomerName}
                              onChange={(e) => {
                                if (selectedCustomer) handleClearCustomer();
                                setLaundryCustomerName(e.target.value);
                              }}
                              placeholder="Walk-in / Nama..."
                              className={`w-full h-7 px-2 py-0.5 rounded-md border text-[11px] outline-none ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                                  : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                              }`}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[9px] leading-3 font-mono uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                              No. WhatsApp
                            </label>
                            <input
                              id="input-laundry-customer-wa"
                              type="tel"
                              value={selectedCustomer?.phone || laundryCustomerPhone}
                              onChange={(e) => setLaundryCustomerPhone(e.target.value)}
                              placeholder="0812xxxx..."
                              className={`w-full h-7 px-2 py-0.5 rounded-md border text-[11px] font-mono outline-none ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                                  : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                              }`}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[9px] leading-3 font-mono uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                              Fisik Pakaian (Total Pcs)
                            </label>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setLaundryTotalPieces((p) => Math.max(1, p - 1))}
                                className={`w-6 h-7 rounded-md border flex items-center justify-center cursor-pointer ${
                                  isLight
                                    ? 'bg-white border-slate-300 text-slate-700'
                                    : 'bg-slate-950 border-slate-700 text-slate-200'
                                }`}
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <input
                                id="input-laundry-total-pcs"
                                type="number"
                                min={1}
                                value={laundryTotalPieces}
                                onChange={(e) =>
                                  setLaundryTotalPieces(Math.max(1, parseInt(e.target.value, 10) || 1))
                                }
                                className={`w-full h-7 text-center rounded-md border text-[11px] font-mono font-bold outline-none ${
                                  isLight
                                    ? 'bg-white border-slate-300 text-slate-900'
                                    : 'bg-slate-950 border-slate-700 text-white'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => setLaundryTotalPieces((p) => p + 1)}
                                className={`w-6 h-7 rounded-md border flex items-center justify-center cursor-pointer ${
                                  isLight
                                    ? 'bg-white border-slate-300 text-slate-700'
                                    : 'bg-slate-950 border-slate-700 text-slate-200'
                                }`}
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>

                          <div className="md:col-span-4">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <label className="text-[9px] leading-3 font-mono uppercase text-slate-500 dark:text-slate-400 truncate">
                                Catatan Kondisi Awal
                              </label>
                              <div className="flex items-center gap-1 shrink-0">
                                {['Pisah Putih', 'Ada Noda', 'Kancing Longgar'].map((chip) => (
                                  <button
                                    key={chip}
                                    type="button"
                                    onClick={() =>
                                      setLaundryConditionNotes((prev) =>
                                        prev.trim()
                                          ? prev.includes(chip)
                                            ? prev
                                            : `${prev}, ${chip}`
                                          : chip
                                      )
                                    }
                                    className={`px-1 py-0 rounded text-[9px] leading-3.5 border cursor-pointer ${
                                      isLight
                                        ? 'bg-white border-amber-300 text-amber-800 hover:bg-amber-50'
                                        : 'bg-amber-500/10 border-amber-500/35 text-amber-300 hover:bg-amber-500/20'
                                    }`}
                                  >
                                    +{chip}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <input
                              id="input-laundry-condition-notes"
                              type="text"
                              value={laundryConditionNotes}
                              onChange={(e) => setLaundryConditionNotes(e.target.value)}
                              placeholder="Misal: Kemeja putih pisah warna, noda kerah..."
                              className={`w-full h-7 px-2 py-0.5 rounded-md border text-[11px] outline-none ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                                  : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                              }`}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[9px] leading-3 font-mono uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                              Paket SLA Selesai
                            </label>
                            <select
                              value={String(laundrySlaOverrideHours)}
                              onChange={(e) =>
                                setLaundrySlaOverrideHours(
                                  e.target.value === 'AUTO' ? 'AUTO' : Number(e.target.value)
                                )
                              }
                              className={`w-full h-7 px-2 py-0.5 rounded-md border text-[11px] outline-none cursor-pointer ${
                                isLight
                                  ? 'bg-white border-indigo-300 text-indigo-900'
                                  : 'bg-slate-950 border-indigo-500/40 text-indigo-200'
                              }`}
                            >
                              <option value="AUTO">Auto Layanan ({computedLaundrySla.hours}j)</option>
                              <option value="6">Express 6 Jam</option>
                              <option value="24">Kilat 24 Jam</option>
                              <option value="48">Reguler 48 Jam</option>
                            </select>
                          </div>
                        </div>

                        <div
                          className={`px-2.5 py-1 border-t flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] ${
                            isLight ? 'bg-indigo-50/40 border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-300 font-semibold">
                            <UserCheck className="w-3 h-3" />
                            <span>Petugas Produksi (Opsional):</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">Op. Cuci:</span>
                            <select
                              value={laundryWasherId}
                              onChange={(e) => setLaundryWasherId(e.target.value)}
                              aria-label="Pilih Operator Cuci Awal"
                              className={`h-6 px-1.5 py-0 rounded border text-[11px] outline-none cursor-pointer ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                                  : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                              }`}
                            >
                              <option value="">-- Otomatis / Isi di Tracking --</option>
                              {laundryStaffChoices.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name} ({emp.role})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">Teknisi Sepatu/Karpet:</span>
                            <select
                              value={laundrySpecialistId}
                              onChange={(e) => setLaundrySpecialistId(e.target.value)}
                              aria-label="Pilih Teknisi Sepatu atau Karpet Awal"
                              className={`h-6 px-1.5 py-0 rounded border text-[11px] outline-none cursor-pointer ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                                  : 'bg-slate-950 border-slate-700 text-white focus:border-amber-400'
                              }`}
                            >
                              <option value="">-- Opsional --</option>
                              {laundryStaffChoices.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name} ({emp.role})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div
                          className={`px-2.5 py-1.5 border-t space-y-1 ${
                            isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1 flex-wrap">
                              {(
                                [
                                  { id: 'ALL', label: 'Semua Layanan' },
                                  { id: 'KILOAN', label: 'Kiloan (kg)' },
                                  { id: 'SATUAN', label: 'Satuan (pcs/stel)' },
                                  { id: 'PASANG', label: 'Pasang' },
                                  { id: 'LUAS', label: 'Luas (m²)' },
                                ] as const
                              ).map((tab) => (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() => setLaundryCatalogFilter(tab.id)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer transition ${
                                    laundryCatalogFilter === tab.id
                                      ? 'bg-cyan-600 text-white border-cyan-500'
                                      : isLight
                                      ? 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                              Klik layanan untuk tambah • Min. Berat &amp; SLA otomatis tercatat
                            </span>
                          </div>

                          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                            {filteredQuickLaundryServices.map((srv) => {
                              const isKiloan =
                                srv.laundryUnitType === 'KILOAN' ||
                                (srv.unit || '').toLowerCase() === 'kg';
                              const isLuas =
                                srv.laundryUnitType === 'LUAS' ||
                                (srv.unit || '').toLowerCase().includes('m2');
                              const minOrderVal = Number(srv.minOrderWeightKg ?? srv.minOrderQty ?? 0);
                              return (
                                <div
                                  key={srv.id}
                                  onClick={() => handleAddToCart(srv, 1)}
                                  className={`shrink-0 w-44 px-2 py-1.5 rounded-lg border cursor-pointer transition flex flex-col justify-between gap-0.5 ${
                                    isLight
                                      ? 'bg-white hover:border-cyan-500 border-slate-200 shadow-2xs'
                                      : 'bg-slate-900 hover:border-cyan-400/60 border-slate-800'
                                  }`}
                                >
                                  <div className="space-y-0.5">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[9px] font-mono uppercase px-1 py-0 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                                        {srv.laundryUnitType || srv.unit}
                                      </span>
                                      {srv.slaDuration && (
                                        <span className="text-[9px] font-mono text-indigo-600 dark:text-indigo-300 truncate">
                                          ⏱ {srv.slaDuration}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] font-semibold leading-tight line-clamp-1">
                                      {srv.name}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-slate-200/70 dark:border-slate-800">
                                    <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                      Rp {srv.sell_price.toLocaleString('id-ID')}/{srv.unit}
                                    </div>
                                    {isKiloan ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setScaleTargetService(srv);
                                          setIsDigitalScaleModalOpen(true);
                                        }}
                                        className="px-1.5 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-semibold flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <Scale className="w-2.5 h-2.5" />
                                        <span>Timbang</span>
                                      </button>
                                    ) : isLuas ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setAreaTargetCartIndex(null);
                                          setAreaModalService(srv);
                                        }}
                                        className="px-1.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-semibold flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <Maximize2 className="w-2.5 h-2.5" />
                                        <span>P×L</span>
                                      </button>
                                    ) : minOrderVal > 1 ? (
                                      <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400">
                                        Min {minOrderVal}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  isSalonServiceTerminal && (
                    <div className={`border-b ${isLight ? 'bg-purple-50/60 border-purple-200' : 'bg-purple-500/10 border-purple-500/25'}`}>
                      <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-purple-700 dark:text-purple-300">
                            ✂️ Stylist / Kapster Utama:
                          </span>
                          <select
                            value={selectedServiceStylist?.id || ''}
                            onChange={(e) => {
                              const picked = activeServiceStylists.find((s) => s.id === e.target.value);
                              setSelectedStylistId(e.target.value);
                              setStylistName(picked?.name || '');
                            }}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-medium outline-none cursor-pointer ${
                              isLight
                                ? 'bg-white border-purple-300 text-slate-900'
                                : 'bg-slate-950 border-purple-500/40 text-white'
                            }`}
                          >
                            {activeServiceStylists.length === 0 ? (
                              <option value="">Belum ada Stylist Aktif</option>
                            ) : (
                              activeServiceStylists.map((st) => (
                                <option key={st.id} value={st.id}>
                                  {st.name} — {st.role} (Komisi {st.commissionRate}%)
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                        {serviceCartCommissionSummary && serviceCartCommissionSummary.totalCommission > 0 && (
                          <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35">
                            Est. Komisi Jasa: Rp {serviceCartCommissionSummary.totalCommission.toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>

                      <div className={`px-3 pb-2.5 pt-1 border-t ${isLight ? 'border-purple-200/70' : 'border-purple-500/20'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-purple-700 dark:text-purple-300 font-semibold">
                            Quick Service Cards ({salonServiceCatalogSource.length} Layanan &amp; Produk Aktif)
                          </span>
                          <span className="text-[10px] text-slate-500">Klik kartu untuk langsung masuk keranjang</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                          {salonServiceCatalogSource.map((svc) => {
                            const isSvcItem = svc.itemType === 'SERVICE';
                            const fmtMeta = getServiceFormatMeta(svc);
                            return (
                              <button
                                key={svc.id}
                                type="button"
                                onClick={() => handleAddToCart(svc, 1)}
                                className={`text-left p-2 rounded-lg border transition cursor-pointer active:scale-[0.99] flex flex-col justify-between gap-1 ${
                                  isLight
                                    ? 'bg-white hover:bg-purple-50 border-slate-200 hover:border-purple-400 text-slate-900'
                                    : 'bg-slate-900/90 hover:bg-purple-950/50 border-slate-700/80 hover:border-purple-400 text-slate-100'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-start justify-between gap-1">
                                    <span className="text-[11px] font-semibold leading-tight line-clamp-2">
                                      {svc.name}
                                    </span>
                                    <span
                                      className={`shrink-0 text-[9px] font-mono px-1 py-0.5 rounded border ${fmtMeta.badgeClass}`}
                                    >
                                      {fmtMeta.shortLabel}
                                    </span>
                                  </div>
                                  {svc.packageDetails && (
                                    <div className="text-[10px] leading-snug text-amber-700 dark:text-amber-300/90 line-clamp-2">
                                      Isi: {svc.packageDetails}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between gap-1 pt-0.5">
                                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    Rp {Number(svc.sell_price || 0).toLocaleString('id-ID')}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                                    {isSvcItem
                                      ? `⏱ ${svc.serviceDuration || '30 mnt'}`
                                      : `Stok ${svc.stock ?? 0}`}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )
                )}

                {isLaundryTerminal && laundryActiveTab === 'TRACKING' ? (
                  <div className="flex-1 min-h-0 flex flex-col p-2.5 overflow-hidden">
                    <LaundryTrackingBoard onBackToOrder={() => setLaundryActiveTab('ORDER')} />
                  </div>
                ) : (
                  <>
                    <div className={`px-3 py-1.5 border-b flex items-center justify-between text-xs leading-5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span className="font-medium text-sm leading-5">Daftar Belanja</span>
                        <span className="font-mono text-[11px] leading-4 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-normal">
                          {cart.length} SKU • {Number.isInteger(totalCartItemCount) ? totalCartItemCount : totalCartItemCount.toFixed(2)} {isLaundryTerminal ? 'Unit' : isSalonServiceTerminal ? 'Item' : 'Pcs'}{totalFreeBonusCount > 0 ? ` (+${totalFreeBonusCount} Gratis)` : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsManualSearchOpen(true)}
                        className="text-cyan-600 dark:text-cyan-400 hover:underline font-normal text-xs cursor-pointer flex items-center gap-1 active:scale-[0.99] transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isSalonServiceTerminal || isLaundryTerminal ? 'Pilih Layanan [F3]' : 'Tambah Item [F3]'}</span>
                      </button>
                    </div>

                    {pwpOffers.length > 0 && !isSalonServiceTerminal && !isLaundryTerminal && (
                      <div className={`px-3 py-1.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
                        isLight ? 'bg-amber-50/80 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/25 text-amber-200'
                      }`}>
                        {pwpOffers.slice(0, 2).map((offer, oIdx) => {
                          const reachedCap = offer.maxQtyPerReceipt !== null && offer.alreadyInCartQty >= offer.maxQtyPerReceipt;
                          return (
                            <div key={`pwp-offer-${offer.campaign.id}-${oIdx}`} className="flex items-center justify-between gap-2 w-full sm:w-auto flex-1">
                              <div className="min-w-0 truncate font-mono text-[11px] tabular-nums">
                                {offer.isQualified ? (
                                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                                    Tebus Murah Terbuka: {offer.product.name} Rp {offer.specialPrice.toLocaleString('id-ID')}
                                    {' '}· Normal Rp {offer.regularPrice.toLocaleString('id-ID')}
                                    {offer.maxQtyPerReceipt ? ` · Maks ${offer.maxQtyPerReceipt}/struk` : ' · Unlimited FEFO'}
                                  </span>
                                ) : (
                                  <span>
                                    Belanja tambah Rp {offer.shortfallAmount.toLocaleString('id-ID')} lagi (min. Rp {offer.minCartSubtotal.toLocaleString('id-ID')}) untuk Tebus Murah {offer.product.name} Rp {offer.specialPrice.toLocaleString('id-ID')}
                                  </span>
                                )}
                              </div>
                              {offer.isQualified && !reachedCap && (
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(offer.product, 1)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] cursor-pointer whitespace-nowrap shrink-0 transition"
                                >
                                  + Tebus Rp {offer.specialPrice.toLocaleString('id-ID')}
                                </button>
                              )}
                              {offer.isQualified && reachedCap && (
                                <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 whitespace-nowrap shrink-0">
                                  Kuota Tebus Tercapai ({offer.alreadyInCartQty}/{offer.maxQtyPerReceipt})
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className={`overflow-x-auto flex-1 ${isLaundryTerminal ? 'min-h-[260px]' : 'min-h-0 overflow-y-auto'}`}>
                      {cart.length === 0 ? (
                        <div className={`h-full ${isLaundryTerminal ? 'min-h-[220px] py-6' : 'min-h-[180px] py-8'} flex flex-col items-center justify-center text-center space-y-2`}>
                          <Barcode className="w-8 h-8 text-cyan-500/60" />
                          <p className="text-sm leading-5 font-normal text-slate-500 dark:text-slate-400">
                            {isSalonServiceTerminal
                              ? 'Pilih kartu layanan di atas atau tekan [F3] untuk menambah jasa & produk salon'
                              : 'Terminal Kasir Siap Melayani'}
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsManualSearchOpen(true)}
                            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-normal rounded-xl cursor-pointer active:scale-[0.99] transition-all shadow-sm"
                          >
                            {isSalonServiceTerminal || isLaundryTerminal ? 'Cari Paket Layanan [F3]' : 'Cari Produk Manual [F3]'}
                          </button>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse text-xs leading-5">
                          <thead className={`border-b text-[11px] leading-4 font-mono font-normal tracking-widest uppercase sticky top-0 z-10 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                            <tr>
                              <th className="py-1.5 px-2 text-center w-10">No</th>
                              <th className="py-1.5 px-2 w-36">CODE / BARCODE</th>
                              <th className="py-1.5 px-2">Nama Produk</th>
                              <th className="py-1.5 px-2 text-center w-24">Qty</th>
                              <th className="py-1.5 px-2 text-right w-32">Harga Satuan</th>
                              <th className="py-1.5 px-2 text-right w-36">Total</th>
                              <th className="py-1.5 px-2 text-center w-24">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-normal">
                            {cart.map((item, idx) => {
                              const sizeOrVariant = getItemVariant(item);
                              const itemCode = item.product?.barcode || item.product?.id || '-';
                              const itemUnit = item.product?.unit || 'Pcs';
                              const rawUnitPrice = item.isRetailUnit && item.product.priceSecondary ? item.product.priceSecondary : item.product.sell_price;
                              const unitDisc = item.itemDiscount || 0;
                              const effectiveUnitPrice = Math.max(0, rawUnitPrice - unitDisc);
                              const linePromoSavings = item.promoSavings ?? (unitDisc * item.quantity);
                              const comps = item.componentSkus || item.product?.componentSkus;
                              const badgeTone =
                                item.promoSourceType === 'FEFO_EXP'
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/35'
                                  : item.promoSourceType === 'SUPPLIER_TPR'
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35'
                                  : item.promoSourceType === 'SEASONAL'
                                  ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/35'
                                  : item.promoSourceType === 'STORE_BND'
                                  ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/35'
                                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35';

                              return (
                                <tr
                                  key={`pos-row-${itemCode}-${idx}`}
                                  onClick={() => setSelectedCartIndex(idx)}
                                  className={`border-b border-slate-100 dark:border-slate-800/60 min-h-9 cursor-pointer transition-colors ${
                                    idx === selectedCartIndex 
                                      ? 'bg-cyan-500/10 text-cyan-900 dark:text-cyan-200' 
                                      : isLight 
                                      ? 'hover:bg-slate-50 text-slate-800' 
                                      : 'hover:bg-slate-800/40 text-slate-200'
                                  }`}
                                >
                                  <td className="py-1.5 px-2 text-center font-mono text-xs text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                                  <td className="py-1.5 px-2 font-mono text-xs text-slate-500 dark:text-slate-400">{itemCode}</td>
                                  <td className="py-1.5 px-2 text-xs font-normal">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span>{item.product.name}</span>
                                      {item.buildingTierBadge && (
                                        <span
                                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                            item.buildingTierName === 'KONTRAKTOR'
                                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                                              : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40'
                                          }`}
                                        >
                                          {item.buildingTierBadge}
                                        </span>
                                      )}
                                      {item.promoBadge && (
                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${badgeTone}`}>
                                          {item.promoBadge}
                                        </span>
                                      )}
                                      {isSalonServiceTerminal && (() => {
                                        const fmtMeta = getServiceFormatMeta(item.product);
                                        return (
                                          <div
                                            className="inline-flex flex-wrap items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${fmtMeta.badgeClass}`}>
                                              {fmtMeta.shortLabel}
                                            </span>
                                            {item.product.itemType === 'SERVICE' ? (
                                              <select
                                                value={item.stylistId || selectedServiceStylist?.id || ''}
                                                onChange={(e) => {
                                                  const picked = activeServiceStylists.find((s) => s.id === e.target.value);
                                                  setCart((prev) =>
                                                    prev.map((row, rowIdx) =>
                                                      rowIdx === idx
                                                        ? {
                                                            ...row,
                                                            stylistId: picked?.id,
                                                            stylistName: picked?.name,
                                                            stylistCommissionRate: picked?.commissionRate,
                                                          }
                                                        : row
                                                    )
                                                  );
                                                }}
                                                className={`text-[10px] font-medium py-0.5 px-1.5 rounded border cursor-pointer outline-none ${
                                                  isLight
                                                    ? 'bg-purple-50 border-purple-300 text-purple-800'
                                                    : 'bg-purple-500/15 border-purple-500/35 text-purple-200'
                                                }`}
                                              >
                                                {activeServiceStylists.map((st) => (
                                                  <option key={st.id} value={st.id}>
                                                    ✂️ {st.name} ({st.commissionRate}%)
                                                  </option>
                                                ))}
                                              </select>
                                            ) : (
                                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                                Non-Komisi
                                              </span>
                                            )}
                                            {item.product.packageDetails && (
                                              <span className="text-[10px] text-amber-700 dark:text-amber-300/90">
                                                • Isi: {item.product.packageDetails}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })()}
                                      {(item.product.businessModel === 'fashion' || Boolean(item.product.variantMatrix?.length)) ? (() => {
                                        const sizes = item.product.variantMatrix?.length
                                          ? Array.from(new Set(item.product.variantMatrix.map((c) => c.size)))
                                          : (item.product.variantSize || 'S, M, L, XL, XXL').split(',').map((s) => s.trim()).filter(Boolean);
                                        const colors = item.product.variantMatrix?.length
                                          ? Array.from(new Set(item.product.variantMatrix.map((c) => c.color)))
                                          : (item.product.variantColor || 'Sage, Maroon, Hitam, Cream').split(',').map((c) => c.trim()).filter(Boolean);
                                        const curSize = item.selectedFashionSize || sizes[0] || 'M';
                                        const curColor = item.selectedFashionColor || colors[0] || 'Sage';
                                        const matchedCell = item.product.variantMatrix?.find(
                                          (c) => c.size === curSize && c.color === curColor
                                        );
                                        return (
                                          <div
                                            className="inline-flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <select
                                              value={curSize}
                                              onChange={(e) => handleChangeFashionVariant(idx, e.target.value, curColor)}
                                              className="text-[10px] font-mono font-semibold py-0.5 px-1.5 rounded border bg-purple-500/10 border-purple-500/35 text-purple-700 dark:text-purple-300 cursor-pointer"
                                            >
                                              {sizes.map((sz) => (
                                                <option key={sz} value={sz}>
                                                  Size {sz}
                                                </option>
                                              ))}
                                            </select>
                                            <select
                                              value={curColor}
                                              onChange={(e) => handleChangeFashionVariant(idx, curSize, e.target.value)}
                                              className="text-[10px] font-medium py-0.5 px-1.5 rounded border bg-purple-500/10 border-purple-500/35 text-purple-700 dark:text-purple-300 cursor-pointer"
                                            >
                                              {colors.map((cl) => (
                                                <option key={cl} value={cl}>
                                                  {cl}
                                                </option>
                                              ))}
                                            </select>
                                            {matchedCell !== undefined && (
                                              <span className={`text-[10px] font-mono px-1 rounded border ${
                                                matchedCell.stock <= 0
                                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/35'
                                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                                              }`}>
                                                Stok {matchedCell.stock}
                                              </span>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setVariantPickerState({
                                                  product: item.product,
                                                  mode: 'CHANGE',
                                                  cartIndex: idx,
                                                  initialSize: curSize,
                                                  initialColor: curColor,
                                                })
                                              }
                                              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white cursor-pointer transition"
                                            >
                                              Matriks
                                            </button>
                                          </div>
                                        );
                                      })() : (
                                        sizeOrVariant && <span className="text-[10px] text-slate-400">({sizeOrVariant})</span>
                                      )}
                                      <span className="text-[10px] font-mono px-1 rounded border border-slate-300 dark:border-slate-700 text-slate-500">
                                        {item.selectedUnit || itemUnit}
                                      </span>
                                      {Boolean(item.product.unitSecondary && item.product.priceSecondary) && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleItemUnit(idx);
                                          }}
                                          className="text-[9px] font-normal px-1.5 rounded border border-indigo-500/40 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 cursor-pointer active:scale-[0.99]"
                                        >
                                          ⇄ {item.isRetailUnit ? item.product.unit : item.product.unitSecondary}
                                        </button>
                                      )}
                                      {Boolean(item.product.materialNature === 'BULK_CURAH' || (item.product.category || '').includes('PASIR')) && (
                                        <select
                                          value={item.product.bulkUnitType || 'PICKUP_RET'}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => handleSelectFleetTier(idx, e.target.value)}
                                          className="text-[10px] font-normal py-0.5 px-2 rounded-lg border bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                                        >
                                          {DEFAULT_FLEET_OPTIONS.map((fleet) => (
                                            <option key={fleet.id} value={fleet.id}>
                                              {fleet.shortName} ({fleet.suffix} = {fleet.volumeM3} m³)
                                            </option>
                                          ))}
                                        </select>
                                      )}
                                      {item.cubicConversionFactorM3 && (
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30 font-semibold">
                                          Potong Curah: {item.cubicDeductionM3 ?? Number((item.cubicConversionFactorM3 * item.quantity).toFixed(2))} m³ (@{item.cubicConversionFactorM3} m³)
                                        </span>
                                      )}
                                      {item.grossMarginPercent !== undefined && (isBuildingTerminal || isBuildingMaterialProduct(item.product)) && (
                                        <span
                                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold ${
                                            item.isMarginBelowFloor
                                              ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                                              : 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30'
                                          }`}
                                        >
                                          Margin {item.grossMarginPercent.toFixed(1)}%
                                          {item.isMarginBelowFloor ? ' ⚠️ < 3%' : ''}
                                        </span>
                                      )}
                                      {item.product.slaDuration && (
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                                          ⏱ {item.product.slaDuration}
                                        </span>
                                      )}
                                      {item.laundryLengthM && item.laundryWidthM && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAreaTargetCartIndex(idx);
                                            setAreaModalService(item.product);
                                          }}
                                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 cursor-pointer hover:bg-purple-500/25"
                                        >
                                          📐 {item.laundryLengthM}m × {item.laundryWidthM}m
                                        </button>
                                      )}
                                      {item.grossWeightKg !== undefined && (
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                                          ⚖️ Bruto {item.grossWeightKg.toFixed(2)} - Tare {(item.tareWeightKg || 0).toFixed(2)} = Netto {(item.actualNetWeightKg ?? item.quantity).toFixed(2)} kg
                                        </span>
                                      )}
                                      {item.isMinWeightAdjusted && (
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/35 font-semibold">
                                          Auto Min. {item.minWeightAppliedKg ?? item.quantity} {item.selectedUnit || itemUnit}
                                        </span>
                                      )}
                                      {(item.product.laundryUnitType === 'KILOAN' || (isLaundryTerminal && (item.product.unit || '').toLowerCase() === 'kg')) && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCartIndex(idx);
                                            setScaleTargetService(item.product);
                                            setIsDigitalScaleModalOpen(true);
                                          }}
                                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer flex items-center gap-0.5"
                                        >
                                          <Scale className="w-2.5 h-2.5" />
                                          <span>Timbang</span>
                                        </button>
                                      )}
                                    </div>
                                    {Array.isArray(comps) && comps.length > 0 && (
                                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                                        Komponen Paket ({comps.length} SKU): {comps.map(c => `${c.qty * (item.quantity + (item.freeBonusQty || 0))}x ${c.skuName}`).join(' • ')}
                                      </div>
                                    )}
                                    {(item.freeBonusQty || 0) > 0 && (
                                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono font-semibold">
                                        + Bonus Gratis: {item.freeBonusQty} unit ({item.freeBonusLabel || 'Beli X Gratis Y'})
                                      </div>
                                    )}
                                    {(linePromoSavings > 0 || item.promoHint || item.manualDiscountReason) && (
                                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono flex flex-wrap gap-x-2">
                                        {linePromoSavings > 0 && (
                                          <span>
                                            {item.promoName ? `${item.promoName} • ` : item.buildingTierLabel ? `${item.buildingTierLabel} • ` : ''}
                                            Hemat Rp {linePromoSavings.toLocaleString('id-ID')}
                                          </span>
                                        )}
                                        {item.manualDiscountReason && (
                                          <span className="text-amber-600 dark:text-amber-300">
                                            ({item.manualDiscountReason}{item.manualDiscountAuthorizedBy ? ` • ${item.manualDiscountAuthorizedBy}` : ''})
                                          </span>
                                        )}
                                        {item.promoHint && (
                                          <span className={item.pwpQualified === false ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}>
                                            {item.promoHint}
                                          </span>
                                        )}
                                        {(item.overriddenPromosCount || 0) > 0 && (
                                          <span className="text-slate-400">
                                            (Anti-Tumpuk: {item.overriddenPromosCount} promo lain non-aktif)
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-1.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col items-center">
                                      <div className="inline-flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateQty(idx, -1)}
                                          className={`w-5 h-6 flex items-center justify-center rounded border text-xs cursor-pointer transition ${
                                            isLight ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800' : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-white'
                                          }`}
                                          title="Kurangi Qty"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <input
                                          id={`pos-qty-input-${idx}`}
                                          type="number"
                                          step="any"
                                          value={item.quantity}
                                          onChange={(e) => handleDirectQtyChange(idx, parseFloat(e.target.value) || 1)}
                                          className="w-14 h-6 text-center font-mono font-normal text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateQty(idx, 1)}
                                          className={`w-5 h-6 flex items-center justify-center rounded border text-xs cursor-pointer transition ${
                                            isLight ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800' : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-white'
                                          }`}
                                          title="Tambah Qty"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                      {(item.freeBonusQty || 0) > 0 && (
                                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                                          +{item.freeBonusQty} Gratis
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-1.5 px-2 text-right font-mono text-xs">
                                    {unitDisc > 0 ? (
                                      <div className="flex flex-col items-end leading-tight">
                                        <span className="text-[10px] text-slate-400 line-through">
                                          Rp {rawUnitPrice.toLocaleString('id-ID')}
                                        </span>
                                        <span className="text-emerald-600 dark:text-emerald-400">
                                          Rp {effectiveUnitPrice.toLocaleString('id-ID')}
                                        </span>
                                      </div>
                                    ) : (
                                      <span>Rp {rawUnitPrice.toLocaleString('id-ID')}</span>
                                    )}
                                  </td>
                                  <td className="py-1.5 px-2 text-right font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                                    <div>Rp {item.subtotal.toLocaleString('id-ID')}</div>
                                    {linePromoSavings > 0 && (
                                      <div className="text-[10px] font-normal text-emerald-500">
                                        -Rp {linePromoSavings.toLocaleString('id-ID')}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-0.5 px-1.5 text-center">
                                    <div className="inline-flex gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setEditingItemIndex(idx)}
                                        className="w-6 h-6 flex items-center justify-center rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 cursor-pointer active:scale-[0.99] transition-all"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRequestRemoveItem(idx)}
                                        className="w-6 h-6 flex items-center justify-center rounded border border-rose-500/40 bg-rose-500/10 text-rose-500 cursor-pointer active:scale-[0.99] transition-all"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {isElectronicsTerminal && (
            <div className="w-full py-2 px-3 mb-1.5 rounded-xl border border-sky-500/40 bg-sky-950/30 text-sky-200 flex items-center justify-between text-xs">
              <span className="font-bold">📱 Elektronik &amp; Gadget Register • Dual-IMEI &amp; Garansi Aktif</span>
              <span className="font-mono text-emerald-400 font-bold">● ONLINE</span>
            </div>
          )}

          {isWorkshopTerminal && (
            <div className="w-full py-2 px-3 mb-1.5 rounded-xl border border-orange-500/40 bg-orange-950/30 text-orange-200 flex items-center justify-between text-xs">
              <span className="font-bold">🔧 Bengkel • Nopol: {workshopPlateNumber} • Mekanik: {workshopMechanic}</span>
              <span className="font-mono text-emerald-400 font-bold">● ONLINE</span>
            </div>
          )}

          {(isBuildingTerminal || (isHybridMode && cart.some((c) => c.product.businessModel === 'building'))) && (
            <div className={`w-full py-2 px-3 mb-1.5 rounded-xl border flex flex-col gap-1.5 text-xs ${
              isLight ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-indigo-500/30 bg-indigo-950/30 text-indigo-200'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-amber-500" />
                    Skema Kirim Depo:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryPolicy('LOCO');
                      setDeliveryMethod('DIRECT');
                      setDeliveryFleetActive(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                      deliveryPolicy === 'LOCO' && deliveryMethod === 'DIRECT'
                        ? 'bg-indigo-600 text-white'
                        : isLight
                        ? 'bg-white border border-slate-300 text-slate-700'
                        : 'bg-[#161b22] text-slate-300'
                    }`}
                  >
                    📦 Loco (Ambil Sendiri)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryPolicy('FRANGKO');
                      setDeliveryMethod('FLEET_DELIVERY');
                      setDeliveryFleetActive(true);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                      deliveryPolicy === 'FRANGKO' || deliveryMethod === 'FLEET_DELIVERY'
                        ? 'bg-amber-500 text-slate-950'
                        : isLight
                        ? 'bg-white border border-slate-300 text-slate-700'
                        : 'bg-[#161b22] text-slate-300'
                    }`}
                  >
                    🚛 Frangko ({selectedFleetType === 'DUMP_TRUCK' ? 'Dump Truck' : selectedFleetType === 'TRUCK_ENGKEL' ? 'Engkel' : 'Pick-up'})
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        submitBuildingAuthRequest({
                          type: 'DISKON_BORONGAN_FRANGKO',
                          customerId: selectedCustomer?.id,
                          contractorName: selectedCustomer?.name || 'Pelanggan Proyek Depo',
                          projectTitle: deliveryDestination || selectedCustomer?.store_name || 'Order Material Borongan POS',
                          requestedBy: activeUser?.name || 'Kasir Depo',
                          orderSubtotal: subtotal,
                          requestedDiscountPercent: discountType === 'PERCENT' && discountPercent > 0 ? discountPercent : 5,
                          requestedDiscountAmount: calculatedDiscount > 0 ? calculatedDiscount : Math.round(subtotal * 0.05),
                          frangkoFeeWaived: activeShippingFee > 0 ? activeShippingFee : 250000,
                          reason: `Pengajuan Diskon Borongan & Bebas Ongkir Frangko (${resolvedFleetLabel}) dari POS`,
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg font-semibold text-[11px] bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-700 dark:text-amber-300 cursor-pointer"
                    >
                      Ajukan Borongan / Free Frangko
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('KREDIT / TEMPO (AR)');
                      setIsPaymentConfirmOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg font-semibold text-[11px] bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
                  >
                    📋 DP / Tempo Kontraktor
                  </button>
                </div>
              </div>

              <div className={`pt-1.5 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono ${
                isLight ? 'border-amber-200 text-slate-800' : 'border-indigo-500/25 text-slate-300'
              }`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    Omzet Material (4-10001):{' '}
                    <strong className="text-slate-900 dark:text-white">
                      Rp {buildingCartAccounting.materialRevenueAmt.toLocaleString('id-ID')}
                    </strong>
                  </span>
                  <span>
                    Jasa Bongkar Kuli (4-10102):{' '}
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      +Rp {buildingCartAccounting.loadingFeeAmt.toLocaleString('id-ID')}
                    </strong>
                  </span>
                  <span>
                    Beban Armada Frangko (5-10205):{' '}
                    <strong className="text-rose-600 dark:text-rose-400">
                      -Rp {buildingCartAccounting.fleetDeliveryCostAmt.toLocaleString('id-ID')}
                    </strong>
                  </span>
                  {buildingCartAccounting.totalCubicDeductionM3 > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30 font-bold">
                      Total Potong Stok Curah: {buildingCartAccounting.totalCubicDeductionM3} m³
                    </span>
                  )}
                </div>
                <div className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold">
                  Est. Laba Bersih Setelah Ongkir: Rp {buildingCartAccounting.netProfitAfterShipping.toLocaleString('id-ID')}
                </div>
              </div>

              {buildingCartAccounting.hasMarginViolation && (
                <div className="rounded-lg p-2 bg-rose-500/15 border border-rose-500/60 text-rose-800 dark:text-rose-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px]">
                    <span className="font-bold uppercase">⚠️ Margin Floor Guard (&lt; 3% / Di Bawah HPP): </span>
                    <span>
                      {buildingCartAccounting.itemsBelowMarginFloor.map((it) => it.product.name).join(', ')}. Pembayaran dikunci tanpa otorisasi.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoFixCartSafeMargin}
                      className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer"
                    >
                      Sesuaikan Harga Aman (≥3%)
                    </button>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold cursor-pointer bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded border border-rose-400">
                      <input
                        type="checkbox"
                        checked={posMarginFloorAuthorized}
                        onChange={(e) => setPosMarginFloorAuthorized(e.target.checked)}
                        className="rounded border-rose-500 text-rose-600"
                      />
                      <span>Otorisasi Khusus</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {!(isFnbMode || isFnbPhotoMenuMode) && !isSalonServiceTerminal && !isLaundryTerminal && (
            <div
              id="bar-pos-bottom-payment"
              className={`w-full min-h-[60px] shrink-0 mt-auto border rounded-xl px-2.5 sm:px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-x-2.5 gap-y-1.5 transition-all duration-200 ${
                isLight
                  ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)] text-slate-900'
                  : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] text-white'
              }`}
            >
              <div className="flex flex-col justify-center shrink-0 pr-2 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-1.5 text-[11px] leading-4">
                  <span className="font-normal text-slate-500 dark:text-slate-400">Subtotal:</span>
                  <span className="font-mono font-normal">Rp {subtotalBeforePromo.toLocaleString('id-ID')}</span>
                </div>
                {totalAllDiscounts > 0 && (
                  <div className="flex items-center justify-between gap-1.5 text-[10px] leading-4 text-emerald-600 dark:text-emerald-400 font-mono">
                    <span>{isBuildingTerminal ? 'Hemat Tier / Promo:' : 'Hemat Promo:'}</span>
                    <span>-Rp {totalAllDiscounts.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-0.5 text-[11px] leading-4">
                  <button
                    type="button"
                    onClick={() => setIsTaxIncluded(!isTaxIncluded)}
                    className={`text-[10px] leading-3.5 px-1.5 py-0.5 rounded font-mono font-normal border cursor-pointer transition-all active:scale-[0.99] ${
                      isTaxIncluded
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : isLight
                        ? 'bg-slate-100 text-slate-600 border-slate-300'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    PPN {isTaxIncluded ? '+11%' : '0%'}
                  </button>
                  <span className="font-mono text-[11px] leading-4 font-normal">Rp {taxAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 px-0.5 sm:px-1">
                <div className="text-right">
                  <div className="text-[10px] leading-3.5 font-mono font-normal tracking-widest uppercase text-emerald-600 dark:text-emerald-400">TOTAL</div>
                  <div className="text-[9px] leading-3 text-slate-400 font-mono font-normal">{getActiveTransactionPriceTierLabel()}</div>
                </div>
                <div
                  id="pos-grand-total-display"
                  className={`font-mono font-semibold whitespace-nowrap text-emerald-600 dark:text-emerald-400 ${
                    isLaundryTerminal ? 'text-lg sm:text-xl xl:text-2xl' : 'text-xl sm:text-2xl lg:text-3xl'
                  }`}
                >
                  Rp {grandTotal.toLocaleString('id-ID')}
                </div>
              </div>

              {isLaundryTerminal && (
                <div className="flex items-center gap-1 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-2">
                  <div
                    className={`flex items-center p-0.5 rounded-lg border text-[11px] gap-0.5 ${
                      isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    {(
                      [
                        { id: 'LUNAS_AWAL' as LaundryPaymentStatus, label: 'Lunas Awal' },
                        { id: 'DP' as LaundryPaymentStatus, label: 'DP' },
                        { id: 'BAYAR_AMBIL' as LaundryPaymentStatus, label: 'Bayar Ambil' },
                      ]
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setLaundryPaymentStatus(st.id);
                          if (st.id === 'DP' && laundryDpAmount === 0) {
                            setLaundryDpAmount(Math.round(grandTotal * 0.5));
                          }
                        }}
                        className={`h-7 sm:h-8 px-2 rounded-md font-semibold whitespace-nowrap cursor-pointer transition ${
                          laundryPaymentStatus === st.id
                            ? st.id === 'LUNAS_AWAL'
                              ? 'bg-emerald-600 text-white'
                              : st.id === 'DP'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-indigo-600 text-white'
                            : isLight
                            ? 'text-slate-700 hover:bg-slate-200'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-2">
                {paymentMethod === 'SPLIT' ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <div className="flex flex-col">
                      <span className="text-[9px] leading-3.5 font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        Nominal Tunai (1-10101):
                      </span>
                      <input
                        id="pos-split-cash-input"
                        type="number"
                        min={0}
                        value={splitCashAmount || ''}
                        onChange={(e) =>
                          setSplitCashAmount(Math.max(0, Number(e.target.value) || 0))
                        }
                        placeholder="0"
                        className={`h-8 w-20 sm:w-24 px-1.5 text-xs sm:text-sm font-mono font-semibold text-center border rounded-lg outline-none ${
                          isLight
                            ? 'border-emerald-500/60 bg-white text-slate-900'
                            : 'border-emerald-500/50 bg-slate-950 text-white'
                        }`}
                      />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] leading-3.5 font-mono text-indigo-600 dark:text-indigo-300 whitespace-nowrap">
                          Non-Tunai ({splitNonCashChannel}):
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next =
                              splitNonCashChannel === 'QRIS'
                                ? 'DEBIT'
                                : splitNonCashChannel === 'DEBIT'
                                ? 'TRANSFER'
                                : 'QRIS';
                            setSplitNonCashChannel(next);
                          }}
                          className="text-[9px] leading-3.5 font-mono px-1 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 cursor-pointer"
                        >
                          Ubah
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          id="pos-split-noncash-input"
                          type="number"
                          min={0}
                          value={splitNonCashAmount || ''}
                          onChange={(e) =>
                            setSplitNonCashAmount(Math.max(0, Number(e.target.value) || 0))
                          }
                          placeholder="0"
                          className={`h-8 w-20 sm:w-24 px-1.5 text-xs sm:text-sm font-mono font-semibold text-center border rounded-lg outline-none ${
                            isLight
                              ? 'border-indigo-500/60 bg-white text-slate-900'
                              : 'border-indigo-500/50 bg-slate-950 text-white'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setSplitNonCashAmount(Math.max(0, grandTotal - splitCashAmount))
                          }
                          className="h-8 px-2 rounded-lg text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                        >
                          Sisa
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col pl-0.5">
                      <span className="text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {splitShortfall === 0 && grandTotal > 0 ? 'Status Split:' : 'Kurang Bayar:'}
                      </span>
                      <div
                        className={`font-mono font-bold text-xs sm:text-sm whitespace-nowrap ${
                          splitShortfall === 0 && grandTotal > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-500'
                        }`}
                      >
                        {splitShortfall === 0 && grandTotal > 0
                          ? '✓ LUNAS 100%'
                          : `Rp ${splitShortfall.toLocaleString('id-ID')}`}
                      </div>
                    </div>
                  </div>
                ) : isKasbonAllowedForSector &&
                  (paymentMethod === 'KREDIT / TEMPO (AR)' ||
                    (isLaundryTerminal && laundryPaymentStatus !== 'LUNAS_AWAL')) ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] leading-3.5 font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        Bayar DP Awal (Rp):
                      </span>
                      <input
                        id="pos-kasbon-dp-input"
                        type="number"
                        min={0}
                        max={grandTotal}
                        value={effectiveKasbonDp || ''}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(grandTotal, Number(e.target.value) || 0));
                          setKasbonDpAmount(val);
                          if (isLaundryTerminal) {
                            setLaundryDpAmount(val);
                            setLaundryPaymentStatus(val > 0 ? 'DP' : 'BAYAR_AMBIL');
                          }
                        }}
                        placeholder="0 (Kasbon 100%)"
                        className={`h-8 w-24 sm:w-28 px-1.5 text-xs sm:text-sm font-mono font-semibold text-center border rounded-lg outline-none ${
                          isLight
                            ? 'border-amber-400 bg-white text-slate-900'
                            : 'border-amber-500/50 bg-slate-950 text-white'
                        }`}
                      />
                    </div>
                    <div className="flex flex-col pl-0.5">
                      <span className="text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        Sisa Piutang / Kasbon (1-10105):
                      </span>
                      <div className="font-mono font-bold text-xs sm:text-sm whitespace-nowrap text-rose-600 dark:text-rose-400">
                        Rp {kasbonRemainingPiutang.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="flex flex-col pl-1 border-l border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        Jatuh Tempo (+14 Hari):
                      </span>
                      <div className="font-mono font-semibold text-[11px] whitespace-nowrap text-amber-600 dark:text-amber-400">
                        {kasbonDefaultDueInfo.display}
                      </div>
                    </div>
                  </div>
                ) : paymentMethod === 'CASH' ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex flex-col">
                      <span className="text-[9px] leading-3.5 font-normal text-slate-500 dark:text-slate-400">Diterima:</span>
                      <div className="flex items-center gap-1">
                        <input
                          ref={cashInputRef}
                          id="pos-cash-given-input"
                          type="number"
                          min="0"
                          value={cashGiven || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setCashGiven(val);
                            if (isCashUnderpaid && val >= grandTotal) setIsCashUnderpaid(false);
                          }}
                          onKeyDown={handleCashInputKeyDown}
                          className={`h-8 w-20 sm:w-24 px-1.5 text-sm font-mono font-semibold text-center border rounded-lg outline-none transition ${
                            isCashUnderpaid
                              ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : isLight
                              ? 'border-emerald-500/60 bg-white text-slate-900 focus:border-emerald-500'
                              : 'border-emerald-500/50 bg-slate-950 text-white focus:border-emerald-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCashGiven(grandTotal);
                            setIsCashUnderpaid(false);
                          }}
                          className="h-8 px-2 rounded-lg text-[11px] leading-4 font-normal bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-[0.99] transition-all"
                        >
                          Pas
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col pl-0.5">
                      <span className="text-[9px] leading-3.5 font-normal text-slate-500 dark:text-slate-400">{cashGiven >= grandTotal ? 'Kembalian:' : 'Kurang:'}</span>
                      <div className={`font-mono font-semibold text-sm sm:text-base whitespace-nowrap ${cashGiven >= grandTotal ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                        Rp {(cashGiven >= grandTotal ? changeAmount : grandTotal - cashGiven).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => paymentMethod === 'QRIS' && setIsQrisModalOpen(true)}
                    className="h-8 px-2.5 rounded-lg text-[11px] font-normal bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 cursor-pointer whitespace-nowrap active:scale-[0.99] transition-all"
                  >
                    {paymentMethod === 'QRIS' ? 'Buka QRIS Dinamis' : 'Mesin EDC Siap'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-2 ml-auto">
                <div className={`flex items-center p-0.5 rounded-lg border text-[11px] gap-0.5 ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`h-8 px-2 rounded-md cursor-pointer text-[11px] font-normal whitespace-nowrap transition-all active:scale-[0.99] ${
                      paymentMethod === 'CASH'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : isLight
                        ? 'text-slate-700 hover:text-slate-900'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    💵 Tunai
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('QRIS');
                      if (!isLaundryTerminal || laundryPaymentStatus === 'LUNAS_AWAL') {
                        setIsQrisModalOpen(true);
                      }
                    }}
                    className={`h-8 px-2 rounded-md cursor-pointer text-[11px] font-normal whitespace-nowrap transition-all active:scale-[0.99] ${
                      paymentMethod === 'QRIS'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : isLight
                        ? 'text-slate-700 hover:text-slate-900'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    📱 QRIS
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('EDC_DEBIT')}
                    className={`h-8 px-2 rounded-md cursor-pointer text-[11px] font-normal whitespace-nowrap transition-all active:scale-[0.99] ${
                      paymentMethod === 'EDC_DEBIT'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : isLight
                        ? 'text-slate-700 hover:text-slate-900'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    💳 Debit
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectSplitPayment}
                    className={`h-8 px-2 rounded-md cursor-pointer text-[11px] font-semibold whitespace-nowrap transition-all active:scale-[0.99] ${
                      paymentMethod === 'SPLIT'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : isLight
                        ? 'text-indigo-700 hover:bg-indigo-50'
                        : 'text-indigo-300 hover:text-white'
                    }`}
                  >
                    🔀 Split
                  </button>
                  {isKasbonAllowedForSector && (
                    <button
                      type="button"
                      onClick={handleSelectKasbonPayment}
                      className={`h-8 px-2 rounded-md cursor-pointer text-[11px] font-semibold whitespace-nowrap transition-all active:scale-[0.99] ${
                        paymentMethod === 'KREDIT / TEMPO (AR)'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : isLight
                          ? 'text-amber-700 hover:bg-amber-50'
                          : 'text-amber-300 hover:text-white'
                      }`}
                    >
                      📋 Kasbon / DP
                    </button>
                  )}
                </div>

                <button
                  id="btn-process-pos-sale"
                  type="button"
                  onClick={handleManualBayarClick}
                  disabled={
                    cart.length === 0 || (paymentMethod === 'SPLIT' && !isSplitReadyToPay)
                  }
                  className="h-9 px-3.5 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-40 shrink-0"
                >
                  <Wallet className="w-4 h-4 shrink-0" />
                  <span>
                    {paymentMethod === 'SPLIT'
                      ? isSplitReadyToPay
                        ? 'Bayar Split [F10]'
                        : 'Belum Lunas'
                      : paymentMethod === 'KREDIT / TEMPO (AR)' ||
                        (isLaundryTerminal && laundryPaymentStatus !== 'LUNAS_AWAL')
                      ? 'Simpan Kasbon [F10]'
                      : 'Bayar [F10]'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <ManualProductSearchModal
        isOpen={isManualSearchOpen}
        onClose={() => {
          setIsManualSearchOpen(false);
          focusBarcodeInput();
        }}
        products={manualSearchProducts}
        onSelectProduct={(prod) => {
          const isFashionProduct =
            prod.businessModel === 'fashion' ||
            Boolean(prod.variantMatrix && prod.variantMatrix.length > 0) ||
            String(prod.id || '').toUpperCase().startsWith('FASH-');
          if (isFashionProduct) {
            setIsManualSearchOpen(false);
            setVariantPickerState({ product: prod, mode: 'ADD' });
            return;
          }
          const pickedQty = Number((prod as { qty?: number }).qty) > 0 ? Number((prod as { qty?: number }).qty) : 1;
          handleAddToCart(prod, pickedQty);
          focusBarcodeInput();
        }}
        language={language}
        showAllCategories={showAllCategories}
        onToggleShowAllCategories={() => setShowAllCategories((prev) => !prev)}
        terminalName={resolveSynchronizedTerminalDisplayName(
          activeStationCode,
          activeSector,
          businessDomainConfig?.primaryBusinessModel || businessProfile?.businessType
        )}
        isServiceMode={isSalonServiceTerminal || isLaundryTerminal}
      />

      <DiscountVoucherModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        discountType={discountType}
        discountAmount={discountAmount}
        discountPercent={discountPercent}
        subtotal={subtotal}
        onApplyDiscount={(type, val, meta) => {
          setDiscountType(type);
          if (type === 'IDR') {
            setDiscountAmount(val);
            if (val === 0) setDiscountPercent(0);
          } else {
            setDiscountPercent(val);
            if (val === 0) setDiscountAmount(0);
          }
          setManualDiscountReason(val > 0 ? meta?.reason || meta?.promoName || '' : '');
          setManualDiscountAuthorizedBy(val > 0 ? meta?.supervisorName || '' : '');
          showToast(val > 0 ? 'Diskon transaksi berhasil diperbarui!' : 'Diskon transaksi dihapus.');
        }}
        language={language}
        activeTerminalModelType={activeTerminal?.modelType}
      />

      <FnbModifierModal
        product={selectedFnbProduct}
        isOpen={isFnbModalOpen}
        onClose={() => {
          setIsFnbModalOpen(false);
          setSelectedFnbProduct(null);
        }}
        onConfirm={handleAddFnbOrder}
      />

      <FnbQuickToppingModal
        isOpen={editingToppingCartIndex !== null}
        onClose={() => setEditingToppingCartIndex(null)}
        item={editingToppingCartIndex !== null ? cart[editingToppingCartIndex] || null : null}
        onConfirm={handleConfirmQuickTopping}
        isLight={isLight}
        requiresSupervisorPin={
          editingToppingCartIndex !== null &&
          isItemSentToKot(cart[editingToppingCartIndex])
        }
      />

      <KotTicketModal
        isOpen={isKotModalOpen}
        onClose={() => setIsKotModalOpen(false)}
        cart={cart}
        terminal={activeTerminal}
        user={activeUser}
        orderType={fnbOrderMode}
        tableNumber={fnbOrderMode === 'Dine-In' ? fnbTableNo : ''}
        voidedKotItems={kotVoidedItems}
        revisedKotItems={kotRevisedItems}
        onSentToKitchen={() => {
          setCart((prev) =>
            prev.map((it) => ({
              ...it,
              kotSent: true,
              kotSentQty: it.quantity,
            }))
          );
          setHasSentKot(true);
          setKotSentAt((prevTs) => prevTs ?? Date.now());
          showToast(
            kotVoidedItems.length > 0 || kotRevisedItems.length > 0
              ? 'Revisi KOT Dapur berhasil dikirim ke antrean dapur!'
              : 'Pesanan berhasil dikirim ke antrean dapur! (Batas revisi: 5 menit)'
          );
        }}
      />

      <HeldOrdersModal
        isOpen={isHeldOrdersModalOpen}
        onClose={() => setIsHeldOrdersModalOpen(false)}
        heldOrders={heldOrders}
        onRecall={handleRecallOrder}
        onDelete={handleDeleteHeldOrder}
        isLight={isLight}
        language={language}
        onOpenHoldModal={handleOpenHoldModal}
      />

      <HoldCartModal
        isOpen={isHoldCartModalOpen}
        onClose={() => setIsHoldCartModalOpen(false)}
        onConfirmHold={handleConfirmHoldOrder}
        cart={cart}
        selectedCustomer={selectedCustomer}
        heldOrdersCount={heldOrders.length}
        isLight={isLight}
        language={language}
        isFashionMode={isFashionTerminal}
        isFnbMode={isFnbModeActive}
        isServiceMode={isSalonServiceTerminal || isLaundryTerminal}
        serviceStylistName={selectedServiceStylist?.name || stylistName}
        fnbTableNo={fnbOrderMode === 'Dine-In' ? fnbTableNo : ''}
        fnbOrderMode={fnbOrderMode}
      />

      <FashionVariantPickerModal
        isOpen={Boolean(variantPickerState)}
        onClose={() => {
          setVariantPickerState(null);
          focusBarcodeInput();
        }}
        product={variantPickerState?.product || null}
        isLight={isLight}
        mode={variantPickerState?.mode || 'ADD'}
        initialSize={variantPickerState?.initialSize}
        initialColor={variantPickerState?.initialColor}
        onConfirm={handleConfirmFashionVariants}
      />

      <FashionExchangeModal
        isOpen={isFashionExchangeOpen}
        onClose={() => {
          setIsFashionExchangeOpen(false);
          focusBarcodeInput();
        }}
        sales={sales}
        products={products}
        fashionAdvisorId={selectedFashionAdvisor?.id}
        fashionAdvisorName={selectedFashionAdvisor?.name}
        activeStationCode={activeStationCode}
        activeTerminalId={activeTerminal?.id}
        activeShiftId={activeStationShift?.status === 'OPEN' ? activeStationShift.id : undefined}
        isLight={isLight}
        onSubmitExchange={processFashionExchange}
      />

      <SupervisorVoidModal
        isOpen={isSupervisorVoidModalOpen}
        onClose={() => {
          setIsSupervisorVoidModalOpen(false);
          setVoidingCartItem(null);
        }}
        item={voidingCartItem?.item || null}
        itemIndex={voidingCartItem?.index ?? null}
        onApprove={handleApproveVoidItem}
        isLight={isLight}
        language={language}
        users={users}
        customTitle={
          voidingCartItem?.mode === 'EDIT_TOPPING'
            ? 'Otorisasi Revisi KOT Supervisor'
            : undefined
        }
        customSubtitle={
          voidingCartItem?.mode === 'EDIT_TOPPING'
            ? 'Perubahan topping/catatan pada item yang sudah dikirim ke KOT memerlukan PIN Supervisor (1234 / 8888)'
            : undefined
        }
        customBadge={
          voidingCartItem?.mode === 'EDIT_TOPPING' ? 'REVISI KOT' : undefined
        }
      />

      {isVoidConfirmOpen && (
        <div
          id="modal-confirm-clear-cart"
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsVoidConfirmOpen(false)}
        >
          <div
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-5 space-y-4 ${
              isLight
                ? 'bg-white border-rose-300 text-slate-900'
                : 'bg-[#161b22] border-rose-500/40 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Kosongkan Keranjang Pesanan?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Pesanan masih berstatus draft ({cart.length} item •{' '}
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </span>
                  ) dan belum dikirim ke dapur. Seluruh item di keranjang aktif akan dikosongkan.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsVoidConfirmOpen(false)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-medium cursor-pointer transition ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                Kembali
              </button>
              <button
                type="button"
                id="btn-confirm-clear-draft-cart"
                onClick={handleConfirmVoid}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer shadow-sm transition active:scale-[0.99]"
              >
                Ya, Kosongkan
              </button>
            </div>
          </div>
        </div>
      )}

      <QrisModal
        isOpen={isQrisModalOpen}
        onClose={() => setIsQrisModalOpen(false)}
        totalAmount={grandTotal}
        merchantName={businessProfile?.name || businessProfile?.businessName || 'BARBER HUMAIRA'}
        refId={receiptNumber}
        isLight={isLight}
        onSuccess={handleQrisPaymentSuccess}
      />

      <EditCartItemModal
        isOpen={editingItemIndex !== null}
        onClose={() => setEditingItemIndex(null)}
        item={editingItemIndex !== null ? cart[editingItemIndex] : null}
        onSave={handleSaveEditedItem}
        language={language}
      />

      <DigitalScaleModal
        isOpen={isDigitalScaleModalOpen}
        onClose={() => {
          setIsDigitalScaleModalOpen(false);
          setScaleTargetService(null);
        }}
        kiloanServices={kiloanLaundryServices}
        initialService={scaleTargetService}
        initialGrossKg={scaleLiveState.grossKg}
        initialTareKg={scaleLiveState.tareKg}
        isLight={isLight}
        onApplyWeight={handleApplyDigitalScaleWeight}
        onScaleLiveUpdate={setScaleLiveState}
      />

      <LaundryAreaModal
        isOpen={Boolean(areaModalService)}
        service={areaModalService}
        initialLengthM={
          areaTargetCartIndex !== null ? cart[areaTargetCartIndex]?.laundryLengthM : undefined
        }
        initialWidthM={
          areaTargetCartIndex !== null ? cart[areaTargetCartIndex]?.laundryWidthM : undefined
        }
        isLight={isLight}
        onClose={() => {
          setAreaModalService(null);
          setAreaTargetCartIndex(null);
        }}
        onConfirm={handleConfirmLaundryArea}
      />

      <PaymentModal
        isOpen={isPaymentConfirmOpen}
        onClose={() => {
          setIsPaymentConfirmOpen(false);
          focusBarcodeInput();
        }}
        cart={cart}
        grandTotal={grandTotal}
        rawGrandTotal={rawGrandTotal}
        cashRoundingDiff={cashRoundingDiff}
        receiptNumber={receiptNumber}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        cashGiven={cashGiven}
        setCashGiven={setCashGiven}
        changeAmount={changeAmount}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={handleSelectCustomer}
        customers={customers}
        onConfirmPayment={(overrideMethod, creditMeta) => {
          if (overrideMethod) setPaymentMethod(overrideMethod as PaymentMethod);
          executeSaleCheckout(overrideMethod, creditMeta);
        }}
        isLight={isLight}
        language={language}
        activeTerminal={activeTerminal}
        onHoldOrder={handleHoldOrderFromModal}
        promoSavingsTotal={totalPromoSavings}
        isBuildingBulkMode={isBuildingTerminal || businessDomainConfig?.mechanismFamily === 'BUILDING_BULK'}
        onRequestCreditLimitIncrease={(reqPayload) => {
          submitBuildingAuthRequest({
            type: 'PLAFON_KREDIT_KONTRAKTOR',
            customerId: reqPayload.customerId,
            contractorName: reqPayload.contractorName,
            projectTitle: reqPayload.projectTitle,
            requestedBy: activeUser?.name || 'Kasir Depo',
            currentCreditLimit: reqPayload.currentCreditLimit,
            requestedCreditLimit: reqPayload.requestedCreditLimit,
            outstandingBalance: reqPayload.outstandingBalance,
            reason: reqPayload.reason,
          });
        }}
        onOpenQris={() => {
          setIsPaymentConfirmOpen(false);
          setIsQrisModalOpen(true);
        }}
        isLaundryMode={isLaundryTerminal}
        laundryPayStatus={laundryPaymentStatus}
        setLaundryPayStatus={setLaundryPaymentStatus}
        laundryDpAmount={laundryDpAmount}
        setLaundryDpAmount={setLaundryDpAmount}
        laundryMetaSummary={{
          customerName: selectedCustomer?.name || laundryCustomerName || 'Pelanggan Laundry',
          customerPhone: selectedCustomer?.phone || laundryCustomerPhone,
          totalPieces: laundryTotalPieces,
          estimatedDoneStr: computedLaundrySla.display,
          slaLabel: computedLaundrySla.label,
        }}
      />

      <OpenShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        onSuccess={() => {
          setIsOpenShiftModalOpen(false);
          setIsRegisterOpen(true);
        }}
        isLight={isLight}
      />

      <PettyCashModal
        isOpen={isPettyCashModalOpen}
        onClose={() => setIsPettyCashModalOpen(false)}
        isLight={isLight}
        reasonPresets={pettyCashReasonPresets}
        activeShiftOverride={activeStationShift}
      />

      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
        onShiftClosed={(closedShift) => {
          setClosedShiftForReceipt(closedShift);
          handleCashierLogout();
        }}
        isLight={isLight}
      />

      <QuickZReportModal
        isOpen={isQuickZReportOpen}
        onClose={() => setIsQuickZReportOpen(false)}
        onZReportClosed={(closedShift) => {
          setClosedShiftForReceipt(closedShift);
        }}
        activeStationCode={activeStationCode}
        activeTerminalName={resolveSynchronizedTerminalDisplayName(
          activeStationCode,
          activeSector,
          businessDomainConfig?.primaryBusinessModel || businessProfile?.businessType
        )}
        activeTerminalId={activeTerminal?.id || activeStationCode}
        isLight={isLight}
      />

      {closedShiftForReceipt && (
        <ShiftSummaryReceiptModal
          shift={closedShiftForReceipt}
          onClose={() => setClosedShiftForReceipt(null)}
          isLight={isLight}
        />
      )}

      {isStationPickerOpen && (
        <div
          id="modal-switch-pc-station"
          className="fixed inset-0 z-[75] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsStationPickerOpen(false)}
        >
          <div
            className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900'
                : 'bg-slate-900 border-slate-700 text-slate-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/35 text-cyan-500 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Ganti Loket PC Perangkat Ini</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pilih loket tujuan untuk mengikat perangkat ini tanpa menampilkan kartu loket lain di layar utama.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStationPickerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Tutup modal ganti loket"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {visiblePosIdentities.map((stCard) => {
                const stShift = getOpenShiftForStation(stCard.stationCode);
                const isCurrentStation =
                  (boundStation && boundStation.stationCode === stCard.stationCode) ||
                  (!boundStation && activeStationCode === stCard.stationCode);
                return (
                  <button
                    key={stCard.stationCode}
                    type="button"
                    onClick={() => handleSwitchDeviceStation(stCard)}
                    className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                      isCurrentStation
                        ? isLight
                          ? 'bg-cyan-50 border-cyan-400 ring-1 ring-cyan-400/50'
                          : 'bg-cyan-500/15 border-cyan-400/60 ring-1 ring-cyan-400/30'
                        : isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        : 'bg-slate-950/70 hover:bg-slate-800/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{stCard.emoji}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
                            {stCard.stationCode}
                          </span>
                          <span className="text-xs font-semibold truncate">{stCard.posName}</span>
                          {isCurrentStation && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              AKTIF
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {stCard.posTypeLabel} · Struk: INV-{stCard.receiptPrefixTag}-...
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {stShift && stShift.status === 'OPEN' && stShift.isPaused ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <Coffee className="w-3 h-3" />
                          Istirahat ({stShift.cashierName})
                        </span>
                      ) : stShift && stShift.status === 'OPEN' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online ({stShift.cashierName})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
                          Belum Buka Shift
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              {boundStation ? (
                <button
                  type="button"
                  onClick={() => {
                    const prevCode = boundStation.stationCode;
                    unbindPosStation();
                    setIsStationPickerOpen(false);
                    showToast(`Kunci loket ${prevCode} pada PC ini dilepas.`);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Lepas Kunci ({boundStation.stationCode})</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Klik loket untuk mengikat perangkat ini.
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsStationPickerOpen(false)}
                className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingPosAuthAction && (
        <div
          id="modal-pos-mgmt-auth-pin"
          className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPendingPosAuthAction(null)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
              isLight
                ? 'bg-white border-amber-400 text-slate-900'
                : 'bg-slate-900 border-amber-500/50 text-slate-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-500 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">PIN Otorisasi Manajemen</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {pendingPosAuthAction.type === 'SWITCH_STATION'
                      ? 'Konfirmasi keamanan untuk Ganti Loket PC'
                      : `Tujuan: ${pendingPosAuthAction.label}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingPosAuthAction(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Tutup modal verifikasi PIN"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPosMgmtPin} className="p-5 space-y-4">
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Masukkan <strong>PIN Otorisasi Manajemen (6 digit)</strong> yang diatur di Konsol SuperAdmin sebelum melanjutkan.
              </p>

              <div className="space-y-1.5">
                <label
                  htmlFor="input-verify-pos-mgmt-pin"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  PIN 6 Digit
                </label>
                <div className="relative">
                  <input
                    id="input-verify-pos-mgmt-pin"
                    type={showPosMgmtPin ? 'text' : 'password'}
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    value={posMgmtPinInput}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setPosMgmtPinInput(digits);
                      setPosMgmtPinError(null);
                    }}
                    placeholder="••••••"
                    className={`w-full px-4 py-3 pr-11 rounded-xl border font-mono font-bold text-lg tracking-[0.4em] text-center outline-none transition ${
                      posMgmtPinError
                        ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                        : isLight
                        ? 'bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900'
                        : 'bg-slate-950 border-slate-700 focus:border-amber-400 text-amber-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPosMgmtPin((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 cursor-pointer"
                    aria-label="Tampilkan atau sembunyikan PIN"
                  >
                    {showPosMgmtPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {posMgmtPinError && (
                <div className="p-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-500 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{posMgmtPinError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingPosAuthAction(null)}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verifikasi &amp; Lanjutkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosModule;