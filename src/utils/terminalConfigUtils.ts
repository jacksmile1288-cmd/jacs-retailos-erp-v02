import {
  ActivePosType,
  BusinessModelId,
  OperationalTopologyMode,
  Terminal,
  TerminalConfigMetadata,
  TerminalRole,
} from '../types';
import { getActivePosTypeOption } from './businessDomainConfig';

export function isHybridArchitecture(arch?: string): boolean {
  return arch === 'HYBRID_FRONT_BACK' || arch === 'HYBRID_FRONT_BACKEND';
}

export function getEffectiveArchitecture(arch?: string): 'CENTRALIZED_FRONTEND' | 'HYBRID_FRONT_BACK' {
  if (isHybridArchitecture(arch)) {
    return 'HYBRID_FRONT_BACK';
  }
  return 'CENTRALIZED_FRONTEND';
}

export const DEFAULT_TERMINAL_COLORS = [
  '#00f2fe', // Cyan
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#06b6d4', // Sky
  '#14b8a6', // Teal
  '#e11d48', // Rose
  '#6366f1', // Indigo
];

export interface OperationalTopologyOption {
  id: OperationalTopologyMode;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
  recommendedStations: number;
}

export const UNIFIED_NON_BLOCKING_TOPOLOGY: OperationalTopologyOption = {
  id: 'NON_BLOCKING_ERP',
  label: 'Unified Non-Blocking ERP (6 Pilar Aktif + Multi-Loket POS)',
  shortLabel: 'Non-Blocking ERP',
  badge: '6 PILAR AKTIF · NON-BLOCKING',
  description:
    'Satu arsitektur tunggal fleksibel: akses penuh ke seluruh 6 pilar manajemen, generator loket POS-01 s/d POS-10 dengan Station Binding, serta transaksi POS tetap berjalan walau stok 0/minus atau PO & jurnal belum diposting.',
  recommendedStations: 1,
};

export const OPERATIONAL_TOPOLOGY_OPTIONS: OperationalTopologyOption[] = [
  UNIFIED_NON_BLOCKING_TOPOLOGY,
];

export const getOperationalTopologyOption = (
  _mode?: OperationalTopologyMode
): OperationalTopologyOption => {
  return UNIFIED_NON_BLOCKING_TOPOLOGY;
};

export interface PosStationDescriptor {
  stationCode: string; // e.g. 'POS-01', 'POS-02'
  receiptPrefixTag: string; // e.g. 'POS01', 'POS02'
  terminalId: string; // e.g. 'POS-01'
  posType: ActivePosType;
  posTypeLabel: string;
  posCode: string;
  modelType: Terminal['modelType'];
  emoji: string;
  displayName: string;
  colorHex: string;
}

export function normalizeStationCode(raw?: string | null): string {
  if (!raw) return 'POS-01';
  const trimmed = raw.trim().toUpperCase();
  const match = trimmed.match(/POS[-_ ]?(\d{1,2})/);
  if (match) {
    return `POS-${match[1].padStart(2, '0')}`;
  }
  const kasirMatch = trimmed.match(/KASIR[-_ ]?(\d{1,2})/);
  if (kasirMatch) {
    return `POS-${kasirMatch[1].padStart(2, '0')}`;
  }
  const tMatch = trimmed.match(/^T-(\d{1,2})$/);
  if (tMatch) {
    return `POS-${tMatch[1].padStart(2, '0')}`;
  }
  return trimmed.startsWith('POS-') ? trimmed : 'POS-01';
}

export function normalizeStationReceiptTag(stationCodeOrId?: string | null): string {
  const normalized = normalizeStationCode(stationCodeOrId);
  return normalized.replace(/[^A-Z0-9]/g, '');
}

export function getSectorTerminalSubtitle(
  sector?: string | null,
  primaryBusinessModel?: BusinessModelId | string | null
): string {
  const modelUpper = String(primaryBusinessModel || '').trim().toUpperCase();
  const sectorUpper = String(sector || '').trim().toUpperCase();

  if (modelUpper === 'LAUNDRY' || modelUpper.includes('LAUNDRY') || modelUpper.includes('BINATU')) {
    return 'Laundry & Binatu Terminal';
  }
  if (
    sectorUpper === 'SERVICE' ||
    modelUpper === 'BARBERSHOP_SALON' ||
    modelUpper.includes('BARBER') ||
    modelUpper.includes('SALON')
  ) {
    return 'Barbershop & Salon Terminal';
  }
  if (
    sectorUpper === 'FNB' ||
    modelUpper === 'RESTO_CAFE' ||
    modelUpper.includes('RESTO') ||
    modelUpper.includes('CAFE') ||
    modelUpper.includes('FNB')
  ) {
    return 'F&B & Resto Terminal';
  }
  if (
    sectorUpper === 'FASHION' ||
    modelUpper === 'FASHION_BUTIK' ||
    modelUpper.includes('FASHION') ||
    modelUpper.includes('BUTIK')
  ) {
    return 'Fashion & Butik Terminal';
  }
  if (
    sectorUpper === 'BUILDING' ||
    modelUpper === 'BAHAN_BANGUNAN_MATERIAL' ||
    modelUpper.includes('BANGUNAN') ||
    modelUpper.includes('MATERIAL')
  ) {
    return 'Depo Material & Bangunan Terminal';
  }
  return 'Retail & Store Terminal';
}

export function getSectorPosModeLabel(
  sector?: string | null,
  primaryBusinessModel?: BusinessModelId | string | null
): string {
  const modelUpper = String(primaryBusinessModel || '').trim().toUpperCase();
  const sectorUpper = String(sector || '').trim().toUpperCase();

  if (modelUpper === 'LAUNDRY' || modelUpper.includes('LAUNDRY') || modelUpper.includes('BINATU')) {
    return 'POS Laundry & Binatu';
  }
  if (
    sectorUpper === 'SERVICE' ||
    modelUpper === 'BARBERSHOP_SALON' ||
    modelUpper.includes('BARBER') ||
    modelUpper.includes('SALON')
  ) {
    return 'POS Jasa & Layanan';
  }
  if (
    sectorUpper === 'FNB' ||
    modelUpper === 'RESTO_CAFE' ||
    modelUpper.includes('RESTO') ||
    modelUpper.includes('CAFE') ||
    modelUpper.includes('FNB')
  ) {
    return 'POS F&B (Resto & Cafe)';
  }
  if (
    sectorUpper === 'FASHION' ||
    modelUpper === 'FASHION_BUTIK' ||
    modelUpper.includes('FASHION') ||
    modelUpper.includes('BUTIK')
  ) {
    return 'POS Fashion & Butik';
  }
  if (
    sectorUpper === 'BUILDING' ||
    modelUpper === 'BAHAN_BANGUNAN_MATERIAL' ||
    modelUpper.includes('BANGUNAN') ||
    modelUpper.includes('MATERIAL')
  ) {
    return 'POS Bahan Bangunan & Material';
  }
  if (
    modelUpper === 'GROSIR_BESAR' ||
    modelUpper === 'GROSIR_KECIL' ||
    modelUpper === 'DEPO_DISTRIBUTOR' ||
    modelUpper.includes('GROSIR')
  ) {
    return 'POS Grosir & Distribusi';
  }
  return 'POS Retail';
}

export function resolveSynchronizedTerminalDisplayName(
  stationOrTerminal?: string | null,
  sector?: string | null,
  primaryBusinessModel?: BusinessModelId | string | null
): string {
  const stationCode = normalizeStationCode(stationOrTerminal || 'POS-01');
  const modeLabel = getSectorPosModeLabel(sector, primaryBusinessModel);
  return `${stationCode} · ${modeLabel}`;
}

export function generatePosStations(
  stationCount: number = 1,
  activePosTypes: ActivePosType[] = ['POS_RETAIL'],
  primaryBusinessModel?: BusinessModelId
): PosStationDescriptor[] {
  const safeCount = Math.max(1, Math.min(10, Number(stationCount) || 1));
  const safePosTypes: ActivePosType[] =
    activePosTypes && activePosTypes.length > 0 ? activePosTypes : ['POS_RETAIL'];

  return Array.from({ length: safeCount }).map((_, idx) => {
    const slotNum = idx + 1;
    const numStr = String(slotNum).padStart(2, '0');
    const stationCode = `POS-${numStr}`;
    const receiptPrefixTag = `POS${numStr}`;
    const posType = safePosTypes[idx % safePosTypes.length];
    const opt = getActivePosTypeOption(posType);
    const isFashionPrimary =
      posType === 'POS_RETAIL' &&
      primaryBusinessModel === 'FASHION_BUTIK' &&
      safePosTypes.length === 1;
    const isLaundryPrimary =
      posType === 'POS_JASA_LAYANAN' &&
      primaryBusinessModel === 'LAUNDRY';

    const resolvedPosTypeLabel = isLaundryPrimary
      ? 'POS Laundry & Binatu'
      : isFashionPrimary
      ? 'POS Fashion & Butik'
      : opt.label;

    return {
      stationCode,
      receiptPrefixTag,
      terminalId: stationCode,
      posType,
      posTypeLabel: resolvedPosTypeLabel,
      posCode: opt.code,
      modelType: isFashionPrimary ? 'fashion' : isLaundryPrimary ? 'laundry' : opt.modelType,
      emoji: isLaundryPrimary ? '🧺' : isFashionPrimary ? '👗' : opt.emoji,
      displayName: `${stationCode} · ${resolvedPosTypeLabel}`,
      colorHex: DEFAULT_TERMINAL_COLORS[idx % DEFAULT_TERMINAL_COLORS.length],
    };
  });
}

const STATION_BINDING_STORAGE_KEY = 'jacs_pos_station_binding_v1';
const STATION_RECEIPT_SEQ_KEY = 'jacs_pos_receipt_seq_v1';

export interface PosStationBinding {
  stationCode: string;
  stationName: string;
  posType?: ActivePosType;
  boundAt: string;
  boundBy?: string;
}

export function getBoundPosStation(): PosStationBinding | null {
  try {
    const raw = localStorage.getItem(STATION_BINDING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.stationCode === 'string' && parsed.stationCode.trim()) {
      return {
        ...parsed,
        stationCode: normalizeStationCode(parsed.stationCode),
      };
    }
  } catch {}
  return null;
}

export function setBoundPosStation(binding: PosStationBinding): PosStationBinding {
  const normalized: PosStationBinding = {
    ...binding,
    stationCode: normalizeStationCode(binding.stationCode),
  };
  try {
    localStorage.setItem(STATION_BINDING_STORAGE_KEY, JSON.stringify(normalized));
  } catch {}
  return normalized;
}

export function clearBoundPosStation(): void {
  try {
    localStorage.removeItem(STATION_BINDING_STORAGE_KEY);
  } catch {}
}

export function peekStationReceiptNumber(stationCode?: string | null): string {
  const tag = normalizeStationReceiptTag(stationCode || getBoundPosStation()?.stationCode || 'POS-01');
  const now = new Date();
  const yymmdd = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const seqKey = `${tag}_${yymmdd}`;
  let currentSeq = 0;
  try {
    const raw = localStorage.getItem(STATION_RECEIPT_SEQ_KEY);
    if (raw) {
      const map = JSON.parse(raw) as Record<string, number>;
      currentSeq = Number(map?.[seqKey]) || 0;
    }
  } catch {}
  const nextSeq = String(currentSeq + 1).padStart(4, '0');
  return `INV-${tag}-${yymmdd}-${nextSeq}`;
}

export function commitStationReceiptNumber(stationCode?: string | null): string {
  const tag = normalizeStationReceiptTag(stationCode || getBoundPosStation()?.stationCode || 'POS-01');
  const now = new Date();
  const yymmdd = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const seqKey = `${tag}_${yymmdd}`;
  let nextNum = 1;
  try {
    const raw = localStorage.getItem(STATION_RECEIPT_SEQ_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    nextNum = (Number(map?.[seqKey]) || 0) + 1;
    map[seqKey] = nextNum;
    localStorage.setItem(STATION_RECEIPT_SEQ_KEY, JSON.stringify(map));
  } catch {}
  return `INV-${tag}-${yymmdd}-${String(nextNum).padStart(4, '0')}`;
}

/**
 * Generates terminal configuration metadata based on active unit quota and selected cashier architecture.
 */
export function generateTerminalConfigs(
  posUnitCount: number = 1,
  _cashierArchitecture: string | undefined = 'HYBRID_FRONT_BACK',
  industryCategory: string = 'Modern Retail',
  existingConfigs?: TerminalConfigMetadata[],
  _operationalTopology?: OperationalTopologyMode
): TerminalConfigMetadata[] {
  const effectiveCount = Math.max(1, Math.min(10, posUnitCount || 1));
  const industry = industryCategory || 'Modern Retail';

  return Array.from({ length: effectiveCount }).map((_, idx) => {
    const slotNum = idx + 1;
    const numStr = String(slotNum).padStart(2, '0');
    const id = `POS-${numStr}`;
    const name = `LOKET ${id}`;

    const role: TerminalRole = 'HYBRID_BACKEND';

    const prev = existingConfigs?.find((c) => c.id === id);

    return {
      id,
      name,
      industry: prev?.industry || industry,
      role,
      colorTheme: prev?.colorTheme || DEFAULT_TERMINAL_COLORS[idx % DEFAULT_TERMINAL_COLORS.length],
      pinRequired: true,
    };
  });
}

