import { TerminalConfigMetadata, TerminalRole } from '../types';

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

/**
 * Generates terminal configuration metadata based on active unit quota and selected cashier architecture.
 *
 * Rules:
 * - If mode is "Hybrid": minimum 2 units.
 *   - KASIR 01: role = "FRONT_END_ONLY" (Kasir Utama)
 *   - KASIR 02: role = "HYBRID_BACKEND" (Kasir + Akses Menu ERP/Admin)
 *   - KASIR 03 s/d N: role = "FRONT_END_ONLY" (Kasir Reguler Tambahan)
 * - If mode is "Centralized" (Terpusat):
 *   - All terminals (1 s/d N): role = "FRONT_END_ONLY"
 */
export function generateTerminalConfigs(
  posUnitCount: number = 10,
  cashierArchitecture: string | undefined = 'CENTRALIZED_FRONTEND',
  industryCategory: string = 'Modern Retail',
  existingConfigs?: TerminalConfigMetadata[]
): TerminalConfigMetadata[] {
  const isHybrid = isHybridArchitecture(cashierArchitecture);
  const minCount = isHybrid ? 2 : 1;
  const effectiveCount = Math.max(minCount, Math.min(10, posUnitCount || minCount));
  const industry = industryCategory || 'Modern Retail';

  return Array.from({ length: effectiveCount }).map((_, idx) => {
    const slotNum = idx + 1;
    const numStr = String(slotNum).padStart(2, '0');
    const id = `T-${numStr}`;
    const name = `KASIR ${numStr}`;

    let role: TerminalRole = 'FRONT_END_ONLY';
    if (isHybrid) {
      if (idx === 0) {
        role = 'FRONT_END_ONLY';
      } else if (idx === 1) {
        role = 'HYBRID_BACKEND';
      } else {
        role = 'FRONT_END_ONLY';
      }
    } else {
      role = 'FRONT_END_ONLY';
    }

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
