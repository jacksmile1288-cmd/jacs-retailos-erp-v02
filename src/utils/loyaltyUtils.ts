import { PriceTier } from '../types';

export const LOYALTY_THRESHOLDS = {
  GOLD: 2500000,     // Rp 2.500.000 -> Gold Tier
  PLATINUM: 7500000, // Rp 7.500.000 -> Platinum Tier (Buka Hak Akses Grosir)
};

export interface TierLevelResult {
  tier_level: 'Silver' | 'Gold' | 'Platinum';
  memberTier: 'Silver' | 'Gold' | 'Platinum';
  allowed_tiers: PriceTier[];
  nextTierThreshold?: number;
  progressPercent: number;
}

/**
 * Menghitung tingkat loyalitas anggota berdasarkan akumulasi total belanja periode berjalan.
 * Aturan Grosir/Partai:
 * Hak akses tier 'WHOLESALE' (Grosir / Partai) HANYA diberikan apabila pelanggan terverifikasi memiliki toko/usaha fisik (has_store === true).
 * Member perorangan (meskipun mencapai level Platinum) HANYA berhak atas harga ['RETAIL', 'MEMBER'].
 * - Silver: Member baru (< Rp 2.500.000)
 * - Gold: Total belanja >= Rp 2.500.000
 * - Platinum: Total belanja >= Rp 7.500.000 (Membuka Grosir HANYA jika has_store === true)
 */
export const calculateMemberTierLevel = (
  spending: number,
  has_store: boolean = false
): TierLevelResult => {
  const currentSpending = Math.max(0, spending);

  const wholesaleEntitlement: PriceTier[] = has_store
    ? ['RETAIL', 'MEMBER', 'WHOLESALE']
    : ['RETAIL', 'MEMBER'];

  if (currentSpending >= LOYALTY_THRESHOLDS.PLATINUM) {
    return {
      tier_level: 'Platinum',
      memberTier: 'Platinum',
      allowed_tiers: wholesaleEntitlement,
      progressPercent: 100,
    };
  }

  if (currentSpending >= LOYALTY_THRESHOLDS.GOLD) {
    const range = LOYALTY_THRESHOLDS.PLATINUM - LOYALTY_THRESHOLDS.GOLD;
    const progress = currentSpending - LOYALTY_THRESHOLDS.GOLD;
    return {
      tier_level: 'Gold',
      memberTier: 'Gold',
      allowed_tiers: wholesaleEntitlement,
      nextTierThreshold: LOYALTY_THRESHOLDS.PLATINUM,
      progressPercent: Math.min(100, Math.round((progress / range) * 100)),
    };
  }

  // Silver (Default)
  return {
    tier_level: 'Silver',
    memberTier: 'Silver',
    allowed_tiers: wholesaleEntitlement,
    nextTierThreshold: LOYALTY_THRESHOLDS.GOLD,
    progressPercent: Math.min(100, Math.round((currentSpending / LOYALTY_THRESHOLDS.GOLD) * 100)),
  };
};

/**
 * Mengecek apakah pelanggan berhak atas harga Grosir/Partai (Wajib memiliki toko fisik).
 */
export const isWholesaleQualified = (customer?: { has_store?: boolean } | null): boolean => {
  return Boolean(customer && customer.has_store);
};

/**
 * Menormalisasi nomor telepon/HP untuk pencarian cepat instan:
 * Menghilangkan spasi, tanda hubung (-), dan mengonversi format internasional 62 atau +62 ke awalan 0.
 */
export const normalizePhoneNumber = (raw: string): string => {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('62')) {
    return '0' + digits.slice(2);
  }
  return digits;
};
