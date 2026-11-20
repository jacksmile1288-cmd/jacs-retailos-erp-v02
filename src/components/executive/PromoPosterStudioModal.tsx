import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Printer,
  Download,
  Send,
  Copy,
  RefreshCw,
  X,
  Palette,
  LayoutTemplate,
  Users,
  Check,
  Sparkles,
  Tag,
  Ruler,
  Package,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { CustomerMaster, Product } from '../../types';
import { PromoCampaign, loadPromoCampaigns, savePromoCampaigns } from '../../utils/promoEngine';

export type PosterFormat =
  | 'POSTER_A3'
  | 'POSTER_A4'
  | 'SPANDUK_BANNER'
  | 'SHELF_TALKER'
  | 'WHATSAPP_MEMBER'
  | 'IG_FEED_SQUARE'
  | 'IG_FEED_PORTRAIT'
  | 'TIKTOK_STORY_REELS'
  | 'FACEBOOK_POST_ADS'
  | 'THREADS_POST'
  | 'CUSTOM';

export type SocialTypographyStyle =
  | 'NONE'
  | 'AESTHETIC_EDITORIAL'
  | 'TIKTOK_REELS_VIRAL'
  | 'CLEAN_GLASS_CARD'
  | 'MINIMALIST_THREADS';

export type PosterPattern = 'SOLID' | 'GRID' | 'DOTS' | 'STRIPES';

export type PosterColorTheme =
  | 'PUTIH_BERSIH'
  | 'MERAH_KUNING'
  | 'HIJAU_RAMADAN'
  | 'CYAN_ENTERPRISE'
  | 'CUSTOM';

export type PosterPriceStyle =
  | 'KLASIK_SWALAYAN'
  | 'WOBBLER_STARBURST'
  | 'MINIMALIS_PAPAN_RAK'
  | 'SPLIT_DUO';

type ProductVisualKind =
  | 'OIL'
  | 'RICE'
  | 'MILK'
  | 'SYRUP'
  | 'BISCUIT'
  | 'DETERGENT'
  | 'BEVERAGE'
  | 'BUNDLE'
  | 'GENERIC';

interface ResolvedPosterProduct {
  name: string;
  qtyLabel?: string;
  originalPrice: number;
  promoPrice: number;
  promoBadgeText: string;
  savingsPercent: number;
  imageUrl?: string;
  visualKind: ProductVisualKind;
}

interface BroadcastQueueItem {
  id: string;
  name: string;
  tier: string;
  phoneRaw: string;
  phoneIntl: string;
  message: string;
  waUrl: string;
  status: 'QUEUED' | 'PROCESSING' | 'READY';
}

interface PromoPosterStudioModalProps {
  campaign: PromoCampaign;
  campaigns?: PromoCampaign[];
  onSelectCampaign?: (camp: PromoCampaign) => void;
  products: Product[];
  customers: CustomerMaster[];
  storeName?: string;
  isDark: boolean;
  onClose: () => void;
  showToast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const FORMAT_META: Record<
  Exclude<PosterFormat, 'CUSTOM'>,
  {
    label: string;
    dimensionLabel: string;
    subtitle: string;
    widthCm?: number;
    heightCm?: number;
    canvasW: number;
    canvasH: number;
    pageSizeCss: string;
  }
> = {
  POSTER_A3: {
    label: 'Poster A3',
    dimensionLabel: '29.7×42cm',
    subtitle: 'Standing Banner / Dinding',
    widthCm: 29.7,
    heightCm: 42,
    canvasW: 1200,
    canvasH: 1697,
    pageSizeCss: '297mm 420mm',
  },
  POSTER_A4: {
    label: 'Poster A4',
    dimensionLabel: '21×29.7cm',
    subtitle: 'Standar Cetak Kantor / Kasir',
    widthCm: 21,
    heightCm: 29.7,
    canvasW: 1200,
    canvasH: 1697,
    pageSizeCss: 'A4 portrait',
  },
  SPANDUK_BANNER: {
    label: 'Spanduk',
    dimensionLabel: '120×40cm',
    subtitle: 'Horizontal Meja Kasir / Toko',
    widthCm: 120,
    heightCm: 40,
    canvasW: 1800,
    canvasH: 600,
    pageSizeCss: 'A4 landscape',
  },
  SHELF_TALKER: {
    label: 'Shelf Talker',
    dimensionLabel: '10×7cm',
    subtitle: 'Penjepit Harga Rak Gondola',
    widthCm: 10,
    heightCm: 7,
    canvasW: 1200,
    canvasH: 840,
    pageSizeCss: '100mm 70mm',
  },
  WHATSAPP_MEMBER: {
    label: 'WA Member',
    dimensionLabel: '1080×1350px',
    subtitle: 'Rasio 4:5 Broadcast Member',
    canvasW: 1080,
    canvasH: 1350,
    pageSizeCss: 'A4 portrait',
  },
  IG_FEED_SQUARE: {
    label: 'IG Feed Square',
    dimensionLabel: '1080×1080px',
    subtitle: 'Rasio 1:1 Instagram Square',
    canvasW: 1080,
    canvasH: 1080,
    pageSizeCss: '1080px 1080px',
  },
  IG_FEED_PORTRAIT: {
    label: 'IG Feed Portrait',
    dimensionLabel: '1080×1350px',
    subtitle: 'Rasio 4:5 Instagram Portrait',
    canvasW: 1080,
    canvasH: 1350,
    pageSizeCss: 'A4 portrait',
  },
  TIKTOK_STORY_REELS: {
    label: 'TikTok / Story / Reels',
    dimensionLabel: '1080×1920px',
    subtitle: 'Rasio 9:16 Vertical Video Feed',
    canvasW: 1080,
    canvasH: 1920,
    pageSizeCss: '1080px 1920px',
  },
  FACEBOOK_POST_ADS: {
    label: 'Facebook Post / Ads',
    dimensionLabel: '1200×630px',
    subtitle: 'Rasio 1.91:1 Feed & Ads',
    canvasW: 1200,
    canvasH: 630,
    pageSizeCss: 'A4 landscape',
  },
  THREADS_POST: {
    label: 'Threads Post',
    dimensionLabel: '1080×1440px',
    subtitle: 'Rasio 3:4 Threads Microblog',
    canvasW: 1080,
    canvasH: 1440,
    pageSizeCss: 'A4 portrait',
  },
};

const PRICE_STYLE_META: Record<PosterPriceStyle, { label: string; desc: string }> = {
  KLASIK_SWALAYAN: {
    label: 'Klasik Swalayan',
    desc: 'Normal dicoret di atas, harga diskon raksasa di bawah',
  },
  WOBBLER_STARBURST: {
    label: 'Wobbler Starburst',
    desc: 'Lencana ledakan hemat menyala mencolok',
  },
  MINIMALIS_PAPAN_RAK: {
    label: 'Minimalis Papan Rak',
    desc: 'Grid info terstruktur + barcode besar siap scan',
  },
  SPLIT_DUO: {
    label: 'Split Duo',
    desc: 'Perbandingan item beli/normal vs gratis/paket hemat',
  },
};

interface PosterPaletteSpec {
  label: string;
  isLight: boolean;
  swatchClass: string;
  bgHex: string;
  bgGradEndHex: string;
  cardHex: string;
  accentHex: string;
  accentTextHex: string;
  headlineHex: string;
  titleHex: string;
  priceGlowHex: string;
  strikeHex: string;
  mutedHex: string;
  borderHex: string;
  starburstHex: string;
  starburstTextHex: string;
  containerClasses: string;
  titleClasses: string;
  mutedClasses: string;
  accentBadgeClasses: string;
  priceClasses: string;
  strikeClasses: string;
  itemCardClasses: string;
  barcodeBoxClasses: string;
}

const THEME_PALETTES: Record<PosterColorTheme, PosterPaletteSpec> = {
  PUTIH_BERSIH: {
    label: 'Putih Bersih (Hemat Tinta)',
    isLight: true,
    swatchClass: 'from-white via-slate-100 to-slate-300 border border-slate-300',
    bgHex: '#FFFFFF',
    bgGradEndHex: '#F8FAFC',
    cardHex: '#F8FAFC',
    accentHex: '#0F172A',
    accentTextHex: '#FFFFFF',
    headlineHex: '#0F172A',
    titleHex: '#0F172A',
    priceGlowHex: '#DC2626',
    strikeHex: '#64748B',
    mutedHex: '#475569',
    borderHex: '#0F172A',
    starburstHex: '#DC2626',
    starburstTextHex: '#FFFFFF',
    containerClasses: 'bg-white text-slate-900 border-slate-900 shadow-lg',
    titleClasses: 'text-slate-900',
    mutedClasses: 'text-slate-600',
    accentBadgeClasses: 'bg-slate-900 text-white font-black',
    priceClasses: 'text-red-600',
    strikeClasses: 'text-slate-500',
    itemCardClasses: 'bg-slate-50 border-slate-300 text-slate-900',
    barcodeBoxClasses: 'bg-white text-slate-900 border border-slate-300',
  },
  MERAH_KUNING: {
    label: 'Merah-Kuning Swalayan',
    isLight: false,
    swatchClass: 'from-red-600 to-amber-400',
    bgHex: '#991B1B',
    bgGradEndHex: '#DC2626',
    cardHex: '#7F1D1D',
    accentHex: '#FACC15',
    accentTextHex: '#7F1D1D',
    headlineHex: '#FEF08A',
    titleHex: '#FFFFFF',
    priceGlowHex: '#FDE047',
    strikeHex: '#FCA5A5',
    mutedHex: '#FEE2E2',
    borderHex: '#FACC15',
    starburstHex: '#FACC15',
    starburstTextHex: '#7F1D1D',
    containerClasses:
      'bg-gradient-to-br from-red-800 via-red-700 to-rose-700 text-white border-amber-300 shadow-[0_0_28px_rgba(250,204,21,0.35)]',
    titleClasses: 'text-white',
    mutedClasses: 'text-rose-100',
    accentBadgeClasses: 'bg-amber-300 text-red-950 font-black',
    priceClasses: 'text-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,0.75)]',
    strikeClasses: 'text-rose-200',
    itemCardClasses: 'bg-red-950/55 border-amber-300/45 text-white',
    barcodeBoxClasses: 'bg-white text-slate-900',
  },
  HIJAU_RAMADAN: {
    label: 'Hijau Ramadan',
    isLight: false,
    swatchClass: 'from-emerald-700 to-amber-300',
    bgHex: '#064E3B',
    bgGradEndHex: '#047857',
    cardHex: '#022C22',
    accentHex: '#FCD34D',
    accentTextHex: '#064E3B',
    headlineHex: '#FEF3C7',
    titleHex: '#FFFFFF',
    priceGlowHex: '#FDE68A',
    strikeHex: '#A7F3D0',
    mutedHex: '#D1FAE5',
    borderHex: '#F59E0B',
    starburstHex: '#F59E0B',
    starburstTextHex: '#022C22',
    containerClasses:
      'bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-800 text-white border-amber-400/80 shadow-[0_0_28px_rgba(245,158,11,0.28)]',
    titleClasses: 'text-white',
    mutedClasses: 'text-emerald-100',
    accentBadgeClasses: 'bg-amber-300 text-emerald-950 font-black',
    priceClasses: 'text-amber-300 drop-shadow-[0_0_12px_rgba(252,211,77,0.65)]',
    strikeClasses: 'text-emerald-200',
    itemCardClasses: 'bg-emerald-950/65 border-amber-400/35 text-white',
    barcodeBoxClasses: 'bg-white text-slate-900',
  },
  CYAN_ENTERPRISE: {
    label: 'Cyan Enterprise',
    isLight: false,
    swatchClass: 'from-slate-900 to-cyan-500',
    bgHex: '#070E1F',
    bgGradEndHex: '#0F172A',
    cardHex: '#111C33',
    accentHex: '#22D3EE',
    accentTextHex: '#082F49',
    headlineHex: '#ECFEFF',
    titleHex: '#FFFFFF',
    priceGlowHex: '#22D3EE',
    strikeHex: '#94A3B8',
    mutedHex: '#CBD5E1',
    borderHex: '#06B6D4',
    starburstHex: '#22D3EE',
    starburstTextHex: '#082F49',
    containerClasses:
      'bg-gradient-to-br from-[#070d1e] via-slate-900 to-cyan-950 text-white border-cyan-400/80 shadow-[0_0_28px_rgba(6,182,212,0.35)]',
    titleClasses: 'text-white',
    mutedClasses: 'text-slate-300',
    accentBadgeClasses: 'bg-cyan-400 text-slate-950 font-black',
    priceClasses: 'text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]',
    strikeClasses: 'text-slate-400',
    itemCardClasses: 'bg-slate-900/85 border-cyan-500/45 text-white',
    barcodeBoxClasses: 'bg-white text-slate-900',
  },
  CUSTOM: {
    label: 'Warna Kustom',
    isLight: true,
    swatchClass: 'from-cyan-400 via-fuchsia-400 to-amber-300',
    bgHex: '#FFFFFF',
    bgGradEndHex: '#F1F5F9',
    cardHex: '#F8FAFC',
    accentHex: '#0F172A',
    accentTextHex: '#FFFFFF',
    headlineHex: '#0F172A',
    titleHex: '#0F172A',
    priceGlowHex: '#DC2626',
    strikeHex: '#64748B',
    mutedHex: '#475569',
    borderHex: '#0F172A',
    starburstHex: '#DC2626',
    starburstTextHex: '#FFFFFF',
    containerClasses: 'shadow-xl',
    titleClasses: '',
    mutedClasses: 'opacity-80',
    accentBadgeClasses: 'bg-slate-900 text-white font-black',
    priceClasses: 'text-rose-600',
    strikeClasses: 'opacity-65',
    itemCardClasses: 'bg-white/80 border-slate-300 text-slate-900',
    barcodeBoxClasses: 'bg-white text-slate-900 border border-slate-300',
  },
};

function isHexColorLight(hex: string): boolean {
  const clean = (hex || '#ffffff').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, 'f');
  const r = parseInt(full.slice(0, 2), 16) || 255;
  const g = parseInt(full.slice(2, 4), 16) || 255;
  const b = parseInt(full.slice(4, 6), 16) || 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}

function buildCustomPalette(bgHex: string, textHex: string): PosterPaletteSpec {
  const lightBg = isHexColorLight(bgHex);
  return {
    label: 'Warna Kustom',
    isLight: lightBg,
    swatchClass: 'from-cyan-400 via-fuchsia-400 to-amber-300',
    bgHex,
    bgGradEndHex: bgHex,
    cardHex: lightBg ? 'rgba(255,255,255,0.88)' : 'rgba(15,23,42,0.55)',
    accentHex: textHex,
    accentTextHex: bgHex,
    headlineHex: textHex,
    titleHex: textHex,
    priceGlowHex: lightBg ? '#DC2626' : '#FDE047',
    strikeHex: lightBg ? '#64748B' : '#CBD5E1',
    mutedHex: textHex,
    borderHex: lightBg ? '#CBD5E1' : 'rgba(255,255,255,0.35)',
    starburstHex: lightBg ? '#DC2626' : '#FACC15',
    starburstTextHex: lightBg ? '#FFFFFF' : '#0F172A',
    containerClasses: lightBg ? 'border-slate-300 shadow-lg' : 'border-white/30 shadow-2xl',
    titleClasses: '',
    mutedClasses: 'opacity-80',
    accentBadgeClasses: lightBg ? 'bg-slate-900 text-white font-black' : 'bg-white text-slate-950 font-black',
    priceClasses: lightBg ? 'text-red-600' : 'text-yellow-300',
    strikeClasses: lightBg ? 'text-slate-500' : 'text-slate-300',
    itemCardClasses: lightBg
      ? 'bg-white/85 border-slate-300 text-slate-900'
      : 'bg-black/30 border-white/25 text-white',
    barcodeBoxClasses: 'bg-white text-slate-900 border border-slate-300',
  };
}

function getPatternOverlayStyle(pattern: PosterPattern, isLightBg: boolean): React.CSSProperties | undefined {
  if (pattern === 'SOLID') return undefined;
  const ink = isLightBg ? 'rgba(15, 23, 42, 0.09)' : 'rgba(255, 255, 255, 0.10)';
  if (pattern === 'GRID') {
    return {
      backgroundImage: `linear-gradient(to right, ${ink} 1px, transparent 1px), linear-gradient(to bottom, ${ink} 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
    };
  }
  if (pattern === 'DOTS') {
    return {
      backgroundImage: `radial-gradient(${ink} 1.75px, transparent 1.75px)`,
      backgroundSize: '18px 18px',
    };
  }
  return {
    backgroundImage: `repeating-linear-gradient(45deg, ${ink} 0px, ${ink} 2px, transparent 2px, transparent 14px)`,
  };
}

export function scrollWorkspaceToTop(modalBackdrop?: HTMLElement | null) {
  try {
    if (modalBackdrop) {
      modalBackdrop.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const scrollables = document.querySelectorAll<HTMLElement>('main, .overflow-y-auto, [data-scroll-container]');
    scrollables.forEach((el) => {
      if (el !== modalBackdrop && el.scrollTop > 0) {
        el.scrollTop = 0;
      }
    });
  } catch {
    // ignore
  }
}

function inferVisualKind(name: string, isBundle = false): ProductVisualKind {
  if (isBundle) return 'BUNDLE';
  const low = (name || '').toLowerCase();
  if (low.includes('minyak') || low.includes('bimoli') || low.includes('filma') || low.includes('sania')) return 'OIL';
  if (low.includes('beras') || low.includes('pandan') || low.includes('ramos') || low.includes('sania 5kg')) return 'RICE';
  if (low.includes('susu') || low.includes('dancow') || low.includes('frisian') || low.includes('ultra')) return 'MILK';
  if (low.includes('sirup') || low.includes('marjan') || low.includes('abc') || low.includes('kecap')) return 'SYRUP';
  if (low.includes('biskuit') || low.includes('khong guan') || low.includes('monde') || low.includes('wafer')) return 'BISCUIT';
  if (low.includes('detergen') || low.includes('attack') || low.includes('rinso') || low.includes('sabun')) return 'DETERGENT';
  if (low.includes('teh') || low.includes('kopi') || low.includes('aqua') || low.includes('le minerale')) return 'BEVERAGE';
  return 'GENERIC';
}

function generateBarcodeBars(code: string): number[] {
  const safe = (code || 'PROMO-TOKO').trim();
  const widths: number[] = [2, 1, 2, 1];
  for (let i = 0; i < safe.length; i++) {
    const ch = safe.charCodeAt(i);
    widths.push(((ch >> 4) & 3) + 1);
    widths.push(((ch >> 2) & 1) + 1);
    widths.push((ch & 3) + 1);
    widths.push(((ch >> 5) & 1) + 1);
  }
  widths.push(2, 1, 2);
  return widths;
}

function getDefaultHeadline(camp: PromoCampaign): string {
  const mech = camp.mechanic || 'STANDARD';
  if (camp.sourceType === 'FEFO_EXP') {
    if (mech === 'BUY_X_GET_Y') return `CLEARANCE CEPAT! BELI ${camp.buyQty || 2} GRATIS ${camp.getFreeQty || 1}`;
    if (mech === 'PWP_TEBUS_MURAH') return 'OBRAL TEBUS MURAH STOK TERBATAS!';
    return `CLEARANCE HEMAT ${camp.discountType === 'PERCENT' ? `${camp.discountValue}%` : `Rp ${camp.discountValue.toLocaleString('id-ID')}`}!`;
  }
  if (camp.sourceType === 'STORE_BND') return 'PAKET BUNDLING SUPER HEMAT!';
  if (mech === 'PWP_TEBUS_MURAH') return 'TEBUS MURAH SPESIAL MEMBER!';
  if (mech === 'BUY_X_GET_Y') return `PROMO BELI ${camp.buyQty || 2} GRATIS ${camp.getFreeQty || 1}!`;
  if (camp.sourceType === 'SUPPLIER_TPR') return `PROMO SPESIAL ${camp.supplierName ? camp.supplierName.toUpperCase() : 'PRINSIPAL'}!`;
  return camp.name.toUpperCase();
}

function resolveCampaignPosterProducts(camp: PromoCampaign, products: Product[]): ResolvedPosterProduct[] {
  const mech = camp.mechanic || 'STANDARD';
  const computePromoPrice = (normalPrice: number): { promoPrice: number; badge: string; pct: number } => {
    if (mech === 'PWP_TEBUS_MURAH') {
      const sp = Math.max(0, camp.pwpSpecialPrice ?? Math.max(0, normalPrice - camp.discountValue));
      const pct = normalPrice > 0 ? Math.max(1, Math.round(((normalPrice - sp) / normalPrice) * 100)) : 0;
      return {
        promoPrice: sp,
        badge: `Tebus Murah (Min. Rp ${(camp.pwpMinCartSubtotal || 0).toLocaleString('id-ID')})`,
        pct,
      };
    }
    if (mech === 'BUY_X_GET_Y') {
      const x = Math.max(1, camp.buyQty || 2);
      const y = Math.max(1, camp.getFreeQty || 1);
      const eff = Math.round((normalPrice * x) / (x + y));
      const pct = Math.max(1, Math.round((y / (x + y)) * 100));
      return {
        promoPrice: eff,
        badge: `Beli ${x} Gratis ${y} (Efektif/pcs)`,
        pct,
      };
    }
    const disc =
      camp.discountType === 'PERCENT'
        ? Math.round((normalPrice * camp.discountValue) / 100)
        : camp.discountValue;
    const finalPrice = Math.max(0, normalPrice - disc);
    const pct =
      camp.discountType === 'PERCENT'
        ? camp.discountValue
        : normalPrice > 0
        ? Math.max(1, Math.round((disc / normalPrice) * 100))
        : 0;
    return {
      promoPrice: finalPrice,
      badge:
        camp.discountType === 'PERCENT'
          ? `Hemat ${camp.discountValue}%`
          : `Potongan Rp ${camp.discountValue.toLocaleString('id-ID')}`,
      pct,
    };
  };

  if (Array.isArray(camp.componentSkus) && camp.componentSkus.length > 0) {
    if (camp.sourceType === 'STORE_BND' && camp.componentSkus.length > 1) {
      let totalNormal = 0;
      const compLines: string[] = [];
      let firstImage: string | undefined;
      camp.componentSkus.forEach((c) => {
        const p = products.find(
          (pr) => pr.id === c.skuId || pr.sku === c.skuId || pr.name.toLowerCase() === c.skuName.toLowerCase()
        );
        if (!firstImage && p?.image) firstImage = p.image;
        const unitPrice = Number(p?.price_retail ?? p?.sell_price ?? p?.sellingPrice) || Math.round(c.unitCost * 1.25);
        totalNormal += unitPrice * (c.qty || 1);
        compLines.push(`${c.skuName} (${c.qty}x)`);
      });
      const calc = computePromoPrice(totalNormal);
      return [
        {
          name: compLines.join(' + '),
          qtyLabel: `Paket ${camp.componentSkus.length} Produk`,
          originalPrice: totalNormal,
          promoPrice: calc.promoPrice,
          promoBadgeText: calc.badge,
          savingsPercent: calc.pct,
          imageUrl: firstImage,
          visualKind: 'BUNDLE',
        },
      ];
    }

    return camp.componentSkus.slice(0, 3).map((c) => {
      const p = products.find(
        (pr) => pr.id === c.skuId || pr.sku === c.skuId || pr.name.toLowerCase() === c.skuName.toLowerCase()
      );
      const normal = Number(p?.price_retail ?? p?.sell_price ?? p?.sellingPrice) || Math.round(c.unitCost * 1.25) || 20000;
      const calc = computePromoPrice(normal);
      const displayName = p?.name || c.skuName;
      return {
        name: displayName,
        qtyLabel: c.qty > 1 ? `${c.qty} unit` : undefined,
        originalPrice: normal,
        promoPrice: calc.promoPrice,
        promoBadgeText: calc.badge,
        savingsPercent: calc.pct,
        imageUrl: p?.image,
        visualKind: inferVisualKind(displayName, camp.sourceType === 'STORE_BND'),
      };
    });
  }

  const targetLower = (camp.targetValue || '').toLowerCase();
  const matchedProducts = products.filter((p) => {
    if (camp.targetType === 'SKU') {
      return (
        targetLower.includes((p.id || '').toLowerCase()) ||
        (p.sku && targetLower.includes(p.sku.toLowerCase())) ||
        targetLower.includes((p.name || '').toLowerCase())
      );
    }
    const pcCode = p.categoryCode ? `pc.${p.categoryCode}` : '';
    const catName = (p.category || '').toLowerCase();
    return (
      (pcCode && targetLower.includes(pcCode)) ||
      (catName && targetLower.includes(catName)) ||
      (targetLower.includes('minyak') && (p.name || '').toLowerCase().includes('minyak')) ||
      (targetLower.includes('beras') && (p.name || '').toLowerCase().includes('beras')) ||
      (targetLower.includes('susu') && (p.name || '').toLowerCase().includes('dancow')) ||
      (targetLower.includes('detergent') && (p.name || '').toLowerCase().includes('attack'))
    );
  });

  if (matchedProducts.length > 0) {
    return matchedProducts.slice(0, 3).map((p) => {
      const normal = Number(p.price_retail ?? p.sell_price ?? p.sellingPrice) || 25000;
      const calc = computePromoPrice(normal);
      return {
        name: p.name,
        originalPrice: normal,
        promoPrice: calc.promoPrice,
        promoBadgeText: calc.badge,
        savingsPercent: calc.pct,
        imageUrl: p.image,
        visualKind: inferVisualKind(p.name),
      };
    });
  }

  const fallbackNormal = 45000;
  const calc = computePromoPrice(fallbackNormal);
  const fallbackName = camp.targetValue || camp.name;
  return [
    {
      name: fallbackName,
      originalPrice: fallbackNormal,
      promoPrice: calc.promoPrice,
      promoBadgeText: calc.badge,
      savingsPercent: calc.pct,
      visualKind: inferVisualKind(fallbackName, camp.sourceType === 'STORE_BND'),
    },
  ];
}

function buildStoreWaBroadcast(
  camp: PromoCampaign,
  headline: string,
  items: ResolvedPosterProduct[],
  storeTitle: string,
  memberName?: string
): string {
  const greeting = memberName ? `Halo *${memberName}*,\n` : '';
  const lines = items
    .map(
      (it) =>
        `• *${it.name}*\n  ~Rp ${it.originalPrice.toLocaleString('id-ID')}~ ➔ *Rp ${it.promoPrice.toLocaleString('id-ID')}* (${it.promoBadgeText})`
    )
    .join('\n');

  const quotaNote =
    camp.sourceType === 'FEFO_EXP'
      ? 'Tanpa batas pembelian per struk (selama stok clearance tersedia).'
      : camp.maxQtyPerReceipt
      ? `Maksimal ${camp.maxQtyPerReceipt} ${camp.mechanic === 'BUY_X_GET_Y' ? 'bonus' : 'unit'} per struk.`
      : 'Berlaku untuk seluruh member terdaftar.';

  const barcodeCode = camp.generatedBarcode || camp.code;

  return (
    `${greeting}*${headline}*\n` +
    `Promo Resmi *${storeTitle}*\n\n` +
    `${lines}\n\n` +
    `Periode Promo: ${camp.startDate} s.d. ${camp.endDate}\n` +
    `Kode / Barcode Kasir: *${barcodeCode}*\n` +
    `Ketentuan: ${quotaNote}\n\n` +
    `Kunjungi ${storeTitle} & tunjukkan pesan ini di kasir sebelum periode berakhir!`
  );
}

function normalizeWaPhone(raw: string): string {
  const digits = (raw || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawStarburstPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  spikes: number
) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * i) / spikes - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawProductIllustrationOnCanvas(
  ctx: CanvasRenderingContext2D,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  item: ResolvedPosterProduct,
  storeTitle: string
) {
  // Clean studio photo backdrop
  const bg = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
  bg.addColorStop(0, '#F8FAFC');
  bg.addColorStop(1, '#E2E8F0');
  ctx.fillStyle = bg;
  drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 20);
  ctx.fill();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 3;
  ctx.stroke();

  const cx = boxX + boxW / 2;
  const cy = boxY + boxH / 2;

  // Soft studio spotlight ellipse under product
  ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + boxH * 0.34, boxW * 0.24, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  const kind = item.visualKind;
  if (kind === 'OIL' || kind === 'SYRUP' || kind === 'BEVERAGE') {
    const bodyColor = kind === 'OIL' ? '#F59E0B' : kind === 'SYRUP' ? '#DC2626' : '#0284C7';
    const labelColor = '#FFFFFF';
    // Bottle cap
    ctx.fillStyle = '#0F172A';
    drawRoundedRect(ctx, cx - 22, cy - 115, 44, 24, 6);
    ctx.fill();
    // Bottle neck
    ctx.fillStyle = bodyColor;
    drawRoundedRect(ctx, cx - 26, cy - 92, 52, 34, 8);
    ctx.fill();
    // Bottle main body
    drawRoundedRect(ctx, cx - 64, cy - 60, 128, 165, 24);
    ctx.fill();
    // Center product label
    ctx.fillStyle = labelColor;
    drawRoundedRect(ctx, cx - 50, cy - 22, 100, 74, 10);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(kind === 'OIL' ? 'MINYAK' : kind === 'SYRUP' ? 'SIRUP' : 'MINUMAN', cx, cy + 12);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(storeTitle.slice(0, 16), cx, cy + 34);
  } else if (kind === 'RICE' || kind === 'DETERGENT') {
    const bagColor = kind === 'RICE' ? '#059669' : '#2563EB';
    ctx.fillStyle = bagColor;
    drawRoundedRect(ctx, cx - 78, cy - 95, 156, 195, 24);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, cx - 60, cy - 42, 120, 92, 14);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(kind === 'RICE' ? 'BERAS 5KG' : 'DETERGEN', cx, cy);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('KUALITAS SUPER', cx, cy + 24);
  } else if (kind === 'BUNDLE') {
    // 2 overlapping boxes for bundle
    ctx.fillStyle = '#0891B2';
    drawRoundedRect(ctx, cx - 95, cy - 75, 110, 155, 18);
    ctx.fill();
    ctx.fillStyle = '#F59E0B';
    drawRoundedRect(ctx, cx - 5, cy - 95, 110, 175, 18);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, cx - 58, cy - 22, 116, 60, 12);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAKET HEMAT', cx, cy + 14);
  } else {
    // MILK / BISCUIT / GENERIC retail carton/tin
    const boxColor = kind === 'MILK' ? '#0284C7' : kind === 'BISCUIT' ? '#B91C1C' : '#0F172A';
    ctx.fillStyle = boxColor;
    drawRoundedRect(ctx, cx - 72, cy - 90, 144, 185, 20);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, cx - 54, cy - 40, 108, 88, 12);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 19px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(kind === 'MILK' ? 'SUSU' : kind === 'BISCUIT' ? 'BISKUIT' : 'PRODUK', cx, cy + 2);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('PROMO RESMI', cx, cy + 24);
  }
  ctx.textAlign = 'left';
}

function tryLoadCorsImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 2200);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

const ProductVisualThumbnail: React.FC<{
  item: ResolvedPosterProduct;
  storeTitle: string;
  compact?: boolean;
}> = ({ item, storeTitle, compact }) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [item.imageUrl, item.name]);

  if (item.imageUrl && !imgFailed) {
    return (
      <div
        className={`relative rounded-xl overflow-hidden bg-slate-100 border border-slate-300 flex items-center justify-center shrink-0 ${
          compact ? 'w-16 h-16' : 'w-full h-36 sm:h-44'
        }`}
      >
        <img
          src={item.imageUrl}
          alt={item.name}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const kind = item.visualKind;
  const labelMap: Record<ProductVisualKind, { title: string; color: string }> = {
    OIL: { title: 'MINYAK GORENG', color: '#F59E0B' },
    RICE: { title: 'BERAS PREMIUM', color: '#059669' },
    MILK: { title: 'SUSU NUTRISI', color: '#0284C7' },
    SYRUP: { title: 'SIRUP SPESIAL', color: '#DC2626' },
    BISCUIT: { title: 'BISKUIT KALENG', color: '#B91C1C' },
    DETERGENT: { title: 'DETERGEN', color: '#2563EB' },
    BEVERAGE: { title: 'MINUMAN SEGAR', color: '#0891B2' },
    BUNDLE: { title: 'PAKET BUNDLING', color: '#0F172A' },
    GENERIC: { title: 'PRODUK PROMO', color: '#0F172A' },
  };
  const meta = labelMap[kind];

  return (
    <div
      className={`rounded-xl bg-gradient-to-br from-slate-50 to-slate-200 border border-slate-300 flex flex-col items-center justify-center p-2 shrink-0 ${
        compact ? 'w-16 h-16' : 'w-full h-36 sm:h-44'
      }`}
    >
      <svg viewBox="0 0 180 120" className={compact ? 'w-12 h-12' : 'w-32 h-24'}>
        <ellipse cx="90" cy="108" rx="46" ry="7" fill="rgba(15,23,42,0.12)" />
        {kind === 'OIL' || kind === 'SYRUP' || kind === 'BEVERAGE' ? (
          <>
            <rect x="78" y="8" width="24" height="12" rx="3" fill="#0F172A" />
            <rect x="75" y="19" width="30" height="16" rx="4" fill={meta.color} />
            <rect x="54" y="33" width="72" height="72" rx="14" fill={meta.color} />
            <rect x="62" y="48" width="56" height="36" rx="6" fill="#FFFFFF" />
          </>
        ) : kind === 'BUNDLE' ? (
          <>
            <rect x="34" y="26" width="56" height="76" rx="10" fill="#0891B2" />
            <rect x="86" y="16" width="58" height="86" rx="10" fill="#F59E0B" />
            <rect x="50" y="44" width="80" height="34" rx="7" fill="#FFFFFF" />
          </>
        ) : (
          <>
            <rect x="52" y="18" width="76" height="86" rx="12" fill={meta.color} />
            <rect x="62" y="38" width="56" height="42" rx="7" fill="#FFFFFF" />
          </>
        )}
        <text
          x="90"
          y="67"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="900"
          fill="#0F172A"
          fontFamily="sans-serif"
        >
          {meta.title.slice(0, 12)}
        </text>
      </svg>
      {!compact && (
        <div className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wide mt-0.5 truncate max-w-full">
          {storeTitle} · Foto &amp; Visual Produk Resmi
        </div>
      )}
    </div>
  );
};

const StarburstBadge: React.FC<{
  pct: number;
  subLabel?: string;
  bgColor: string;
  textColor: string;
  compact?: boolean;
}> = ({ pct, subLabel = 'HEMAT', bgColor, textColor, compact }) => {
  const pts = useMemo(() => {
    const spikes = 14;
    const arr: string[] = [];
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? 48 : 37;
      const a = (Math.PI * i) / spikes - Math.PI / 2;
      arr.push(`${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`);
    }
    return arr.join(' ');
  }, []);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${
        compact ? 'w-14 h-14' : 'w-16 h-16 sm:w-20 sm:h-20'
      }`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <polygon points={pts} fill={bgColor} />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none rotate-[-6deg]"
        style={{ color: textColor }}
      >
        <span className="text-[8px] font-black tracking-wider uppercase">{subLabel}</span>
        <span className={`${compact ? 'text-xs' : 'text-sm sm:text-base'} font-black tabular-nums`}>
          {pct > 0 ? `${pct}%` : 'PROMO'}
        </span>
      </div>
    </div>
  );
};

export const PromoPosterStudioModal: React.FC<PromoPosterStudioModalProps> = ({
  campaign,
  campaigns = [],
  onSelectCampaign,
  products,
  customers,
  storeName,
  isDark,
  onClose,
  showToast,
}) => {
  const modalBackdropRef = useRef<HTMLDivElement | null>(null);
  const effectiveStore = storeName?.trim() || 'KHANSA SWALAYAN';

  const activeCampaign = useMemo(() => {
    const stored = loadPromoCampaigns().find((c) => c.id === campaign.id);
    return stored || campaign;
  }, [campaign]);

  const resolvedItems = useMemo(
    () => resolveCampaignPosterProducts(activeCampaign, products),
    [activeCampaign, products]
  );

  // Automatic queue of all active registered members with valid phone numbers
  const eligibleMembers = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.is_active !== false &&
          c.status !== 'Inactive' &&
          normalizeWaPhone(c.phone || '').length >= 9
      ),
    [customers]
  );

  const [format, setFormat] = useState<PosterFormat>('POSTER_A3');
  const [customWidthCm, setCustomWidthCm] = useState<number>(30);
  const [customHeightCm, setCustomHeightCm] = useState<number>(40);
  const [colorTheme, setColorTheme] = useState<PosterColorTheme>('PUTIH_BERSIH');
  const [customBgColor, setCustomBgColor] = useState<string>('#FFFFFF');
  const [customTextColor, setCustomTextColor] = useState<string>('#0F172A');
  const [bgPattern, setBgPattern] = useState<PosterPattern>('SOLID');
  const [priceStyle, setPriceStyle] = useState<PosterPriceStyle>('KLASIK_SWALAYAN');
  const [customHeroImage, setCustomHeroImage] = useState<string | null>(null);
  const [imageDisplayMode, setImageDisplayMode] = useState<'FULL_BG' | 'SPLIT_CARD' | 'NO_IMAGE'>('FULL_BG');
  const [socialTypography, setSocialTypography] = useState<SocialTypographyStyle>('NONE');
  const [textPosition, setTextPosition] = useState<'TOP' | 'CENTER' | 'BOTTOM'>('TOP');
  const [imageObjectPosition, setImageObjectPosition] = useState<'center' | 'top' | 'bottom' | 'left' | 'right'>('center');
  const [imageZoomScale, setImageZoomScale] = useState<number>(100);
  const [overlayOpacity, setOverlayOpacity] = useState<'DARK_70' | 'MED_45' | 'LIGHT_25'>('DARK_70');
  const [activeLeftTab, setActiveLeftTab] = useState<'DESIGN' | 'WA'>('DESIGN');
  const [showPriceBlock, setShowPriceBlock] = useState<boolean>(true);
  const [showBarcodeBlock, setShowBarcodeBlock] = useState<boolean>(false);
  const [showBranchQuota, setShowBranchQuota] = useState<boolean>(false);
  const [headline, setHeadline] = useState<string>(() => getDefaultHeadline(campaign));
  const [subtitleNarration, setSubtitleNarration] = useState<string>(() => {
    return `Lagi viral! Nikmati penawaran spesial ${campaign.name} di ${effectiveStore}. Tunjukkan kode promo ${campaign.code} di kasir!`;
  });
  const [waMessage, setWaMessage] = useState<string>(() =>
    buildStoreWaBroadcast(campaign, getDefaultHeadline(campaign), resolvedItems, effectiveStore)
  );
  const [copiedWa, setCopiedWa] = useState(false);
  const overlayAlpha = overlayOpacity === 'DARK_70' ? 0.7 : overlayOpacity === 'MED_45' ? 0.45 : 0.25;

  const handleSavePosterDesign = () => {
    try {
      const all = loadPromoCampaigns();
      const updated = all.map((c) => {
        if (c.id === activeCampaign.id) {
          return {
            ...c,
            name: headline || c.name,
          };
        }
        return c;
      });
      savePromoCampaigns(updated);
      if (showToast) showToast('Konfigurasi poster, foto, & redaksi berhasil disimpan ke riwayat kampanye!', 'success');
    } catch {
      if (showToast) showToast('Gagal menyimpan konfigurasi poster.', 'error');
    }
  };

  const handleSaveAndDownloadPng = () => {
    handleSavePosterDesign();
    handleDownloadPosterPng();
  };

  // Broadcast blast queue state
  const [blastQueue, setBlastQueue] = useState<BroadcastQueueItem[]>([]);
  const [isBlasting, setIsBlasting] = useState(false);
  const [blastCompletedCount, setBlastCompletedCount] = useState(0);

  useEffect(() => {
    scrollWorkspaceToTop(modalBackdropRef.current);
  }, [campaign.id]);

  useEffect(() => {
    const nextHead = getDefaultHeadline(activeCampaign);
    setHeadline(nextHead);
    setWaMessage(buildStoreWaBroadcast(activeCampaign, nextHead, resolvedItems, effectiveStore));
    setBlastQueue([]);
    setBlastCompletedCount(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCampaign.id]);

  // Rebuild queue whenever eligibleMembers, activeCampaign, headline, or waMessage changes (when not mid-blast)
  const preparedQueue = useMemo<BroadcastQueueItem[]>(() => {
    return eligibleMembers.map((m) => {
      const phoneIntl = normalizeWaPhone(m.phone);
      const personalizedMsg = buildStoreWaBroadcast(
        activeCampaign,
        headline,
        resolvedItems,
        effectiveStore,
        m.name
      );
      const finalMsg =
        waMessage.trim() !==
        buildStoreWaBroadcast(activeCampaign, headline, resolvedItems, effectiveStore).trim()
          ? `Halo *${m.name}*,\n${waMessage}`
          : personalizedMsg;
      return {
        id: m.id,
        name: m.name,
        tier: String(m.memberTier || m.tier_level || 'Member'),
        phoneRaw: m.phone,
        phoneIntl,
        message: finalMsg,
        waUrl: `https://wa.me/${phoneIntl}?text=${encodeURIComponent(finalMsg)}`,
        status: 'QUEUED',
      };
    });
  }, [eligibleMembers, activeCampaign, headline, resolvedItems, effectiveStore, waMessage]);

  const barcodeText = activeCampaign.generatedBarcode || activeCampaign.code;
  const barcodeBars = useMemo(() => generateBarcodeBars(barcodeText), [barcodeText]);
  const totalBarUnits = useMemo(() => barcodeBars.reduce((s, w) => s + w, 0), [barcodeBars]);

  const palette = useMemo(
    () => (colorTheme === 'CUSTOM' ? buildCustomPalette(customBgColor, customTextColor) : THEME_PALETTES[colorTheme]),
    [colorTheme, customBgColor, customTextColor]
  );
  const hasDarkOverlayBg = Boolean(customHeroImage && imageDisplayMode === 'FULL_BG');

  const effectiveSizeMeta = useMemo(() => {
    if (format === 'CUSTOM') {
      const wCm = Math.max(5, Math.min(300, Number(customWidthCm) || 30));
      const hCm = Math.max(5, Math.min(300, Number(customHeightCm) || 40));
      const ratio = wCm / hCm;
      const base = 1200;
      const canvasW = ratio >= 1 ? Math.round(Math.min(1800, base * Math.min(ratio, 2.5))) : base;
      const canvasH =
        ratio >= 1 ? Math.round(canvasW / ratio) : Math.round(Math.min(1800, base / Math.max(ratio, 0.4)));
      return {
        label: 'Ukuran Kustom',
        dimensionLabel: `${wCm}×${hCm}cm`,
        canvasW,
        canvasH,
        ratio,
        isHorizontal: ratio >= 1.45,
        pageSizeCss: `${wCm}cm ${hCm}cm`,
      };
    }
    const baseMeta = FORMAT_META[format];
    const ratio = baseMeta.canvasW / baseMeta.canvasH;
    return {
      label: baseMeta.label,
      dimensionLabel: baseMeta.dimensionLabel,
      canvasW: baseMeta.canvasW,
      canvasH: baseMeta.canvasH,
      ratio,
      isHorizontal: format === 'SPANDUK_BANNER',
      pageSizeCss: baseMeta.pageSizeCss,
    };
  }, [format, customWidthCm, customHeightCm]);

  const previewWidthClass = useMemo(() => {
    if (effectiveSizeMeta.isHorizontal) return 'max-w-full';
    if (format === 'SHELF_TALKER' || effectiveSizeMeta.ratio >= 1.15) return 'max-w-[500px]';
    if (effectiveSizeMeta.ratio < 0.65) return 'max-w-[300px]';
    if (effectiveSizeMeta.ratio <= 1.05 && effectiveSizeMeta.ratio >= 0.95) return 'max-w-[420px]';
    return 'max-w-[390px]';
  }, [effectiveSizeMeta.isHorizontal, effectiveSizeMeta.ratio, format]);

  const handleRegenerateWaText = () => {
    setWaMessage(buildStoreWaBroadcast(activeCampaign, headline, resolvedItems, effectiveStore));
    if (showToast) showToast('Teks broadcast WhatsApp diperbarui sesuai nama toko & promo aktif.');
  };

  const handleCopyWaText = () => {
    navigator.clipboard.writeText(waMessage);
    setCopiedWa(true);
    setTimeout(() => setCopiedWa(false), 2000);
    if (showToast) showToast('Teks pesan broadcast WhatsApp berhasil disalin!');
  };

  const downloadBroadcastCsvPackage = (items: BroadcastQueueItem[]) => {
    const csvEscape = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
    const header = ['No', 'Nama Member', 'Tier', 'No WhatsApp (62)', 'Pesan Broadcast', 'Link Siap Kirim (wa.me)'].join(',');
    const rows = items.map((q, idx) =>
      [
        String(idx + 1),
        csvEscape(q.name),
        csvEscape(q.tier),
        csvEscape(q.phoneIntl),
        csvEscape(q.message.replace(/\n/g, ' | ')),
        csvEscape(q.waUrl),
      ].join(',')
    );
    const csvContent = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blast-wa-member-${activeCampaign.code}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBlastAllMembers = () => {
    if (preparedQueue.length === 0) {
      if (showToast) showToast('Belum ada member terdaftar dengan nomor WhatsApp aktif.', 'warning');
      return;
    }

    setIsBlasting(true);
    setBlastCompletedCount(0);
    const working: BroadcastQueueItem[] = preparedQueue.map((q) => ({ ...q, status: 'PROCESSING' }));
    setBlastQueue(working);

    preparedQueue.forEach((_, idx) => {
      setTimeout(() => {
        setBlastQueue((prev) =>
          prev.map((item, i) => (i === idx ? { ...item, status: 'READY' } : item))
        );
        setBlastCompletedCount(idx + 1);

        if (idx === preparedQueue.length - 1) {
          setIsBlasting(false);
          downloadBroadcastCsvPackage(working.map((it) => ({ ...it, status: 'READY' })));
          try {
            navigator.clipboard.writeText(
              working
                .map((w, i) => `${i + 1}. ${w.name} (${w.phoneIntl})\n${w.waUrl}`)
                .join('\n\n')
            );
          } catch {
            // ignore clipboard permission issues
          }
          if (showToast) {
            showToast(
              `Antrean blast ${preparedQueue.length} member selesai diproses & paket pesan (.CSV) otomatis diunduh.`,
              'success'
            );
          }
        }
      }, (idx + 1) * 140);
    });
  };

  const handlePrintPoster = () => {
    window.print();
  };

  const handleDownloadPosterPng = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = effectiveSizeMeta.canvasW;
    canvas.height = effectiveSizeMeta.canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const pad = Math.round(Math.min(W, H) * 0.055);
    const quotaText =
      activeCampaign.sourceType === 'FEFO_EXP'
        ? 'FEFO Clearance · Unlimited/Struk'
        : activeCampaign.maxQtyPerReceipt
        ? `Maks. ${activeCampaign.maxQtyPerReceipt} unit/struk`
        : 'Promo Resmi Kasir';

    const primaryItem = resolvedItems[0];
    const loadedHeroImg = primaryItem?.imageUrl ? await tryLoadCorsImage(primaryItem.imageUrl) : null;
    const loadedCustomImg = customHeroImage ? await tryLoadCorsImage(customHeroImage) : null;
    const canvasHasFullBg = Boolean(loadedCustomImg && imageDisplayMode === 'FULL_BG');

    // 1. Background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, palette.bgHex);
    grad.addColorStop(1, palette.bgGradEndHex);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 1b. Background Pattern
    if (bgPattern !== 'SOLID') {
      ctx.save();
      const patternInk = palette.isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.10)';
      ctx.strokeStyle = patternInk;
      ctx.fillStyle = patternInk;
      if (bgPattern === 'GRID') {
        ctx.lineWidth = 2;
        for (let gx = 0; gx < W; gx += 48) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, H);
          ctx.stroke();
        }
        for (let gy = 0; gy < H; gy += 48) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(W, gy);
          ctx.stroke();
        }
      } else if (bgPattern === 'DOTS') {
        for (let dx = 20; dx < W; dx += 36) {
          for (let dy = 20; dy < H; dy += 36) {
            ctx.beginPath();
            ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (bgPattern === 'STRIPES') {
        ctx.lineWidth = 4;
        for (let sx = -H; sx < W + H; sx += 32) {
          ctx.beginPath();
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx + H, H);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    if (canvasHasFullBg && loadedCustomImg) {
      ctx.save();
      ctx.drawImage(loadedCustomImg, 0, 0, W, H);
      const ovGrad = ctx.createLinearGradient(0, H, 0, 0);
      ovGrad.addColorStop(0, `rgba(0, 0, 0, ${Math.min(0.9, overlayAlpha + 0.15)})`);
      ovGrad.addColorStop(1, `rgba(0, 0, 0, ${overlayAlpha})`);
      ctx.fillStyle = ovGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // Outer Frame
    ctx.strokeStyle = palette.borderHex;
    ctx.lineWidth = 8;
    drawRoundedRect(ctx, 18, 18, W - 36, H - 36, 28);
    ctx.stroke();

    // Header Badge
    const effectiveHeadlineHex = canvasHasFullBg ? '#FFFFFF' : palette.headlineHex;
    const effectiveTitleHex = canvasHasFullBg ? '#FFFFFF' : palette.titleHex;
    const effectiveMutedHex = canvasHasFullBg ? '#E2E8F0' : palette.mutedHex;

    ctx.fillStyle = canvasHasFullBg ? '#22D3EE' : palette.accentHex;
    drawRoundedRect(ctx, pad, pad, effectiveSizeMeta.isHorizontal ? 400 : 440, 50, 12);
    ctx.fill();
    ctx.fillStyle = canvasHasFullBg ? '#0F172A' : palette.accentTextHex;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`${effectiveStore.toUpperCase()} · PROMO`, pad + 18, pad + 33);

    ctx.fillStyle = effectiveMutedHex;
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(effectiveSizeMeta.dimensionLabel, W - pad, pad + 33);
    ctx.textAlign = 'left';

    const drawCanvasBarcode = (bx: number, by: number, bw: number, bh: number, labelSize = 24) => {
      ctx.fillStyle = '#FFFFFF';
      drawRoundedRect(ctx, bx, by, bw, bh, 12);
      ctx.fill();
      if (palette.isLight) {
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      let curX = bx + 18;
      const barSpan = bw - 36;
      const barH = Math.max(36, bh - 44);
      barcodeBars.forEach((w, idx) => {
        const segW = (w / totalBarUnits) * barSpan;
        if (idx % 2 === 0) {
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(curX, by + 12, Math.max(1.5, segW), barH);
        }
        curX += segW;
      });
      ctx.fillStyle = '#0F172A';
      ctx.font = `bold ${labelSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(barcodeText, bx + bw / 2, by + bh - 12);
      ctx.textAlign = 'left';
    };

    const drawFooterBoxIfEnabled = (fy: number, fh: number) => {
      if (!showBarcodeBlock && !showBranchQuota) return;
      ctx.fillStyle = '#FFFFFF';
      drawRoundedRect(ctx, pad, fy, W - pad * 2, fh, 22);
      ctx.fill();
      if (palette.isLight) {
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (showBarcodeBlock && showBranchQuota) {
        drawCanvasBarcode(pad + 14, fy + 14, Math.round((W - pad * 2) * 0.56), fh - 28, 22);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#0F172A';
        ctx.font = '900 26px sans-serif';
        ctx.fillText(effectiveStore.toUpperCase(), W - pad - 24, fy + 58);
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 19px sans-serif';
        ctx.fillText(quotaText, W - pad - 24, fy + 98);
        ctx.fillText(`s.d. ${activeCampaign.endDate}`, W - pad - 24, fy + 132);
        ctx.textAlign = 'left';
      } else if (showBarcodeBlock) {
        drawCanvasBarcode(pad + 14, fy + 14, W - pad * 2 - 28, fh - 28, 26);
      } else if (showBranchQuota) {
        ctx.fillStyle = '#0F172A';
        ctx.font = '900 28px sans-serif';
        ctx.fillText(effectiveStore.toUpperCase(), pad + 26, fy + 68);
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 21px sans-serif';
        ctx.fillText(`${quotaText} · Berlaku s.d. ${activeCampaign.endDate}`, pad + 26, fy + 114);
      }
    };

    if (effectiveSizeMeta.isHorizontal) {
      // SPANDUK HORIZONTAL
      const hasRightCol = showBarcodeBlock || showBranchQuota;
      const col1X = pad;
      const col1W = Math.round(W * (hasRightCol ? 0.32 : 0.42));
      const col2X = col1X + col1W + 28;
      const col2W = hasRightCol ? Math.round(W * 0.38) : W - col2X - pad;
      const col3X = col2X + col2W + 28;
      const col3W = W - col3X - pad;

      ctx.fillStyle = effectiveHeadlineHex;
      ctx.font = '900 46px sans-serif';
      const headLines = wrapCanvasText(ctx, headline, col1W).slice(0, 4);
      headLines.forEach((ln, idx) => {
        ctx.fillText(ln, col1X, pad + 128 + idx * 54);
      });
      ctx.fillStyle = effectiveMutedHex;
      ctx.font = 'bold 22px sans-serif';
      const subLines = wrapCanvasText(ctx, subtitleNarration || activeCampaign.name, col1W).slice(0, 2);
      subLines.forEach((ln, idx) => {
        ctx.fillText(ln, col1X, H - pad - 48 + idx * 28);
      });

      if (showPriceBlock) {
        const itemTop = pad + 82;
        const itemH = H - itemTop - pad;
        ctx.fillStyle = palette.cardHex;
        drawRoundedRect(ctx, col2X, itemTop, col2W, itemH, 22);
        ctx.fill();
        ctx.strokeStyle = palette.borderHex;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = palette.titleHex;
        ctx.font = 'bold 30px sans-serif';
        const prodLines = wrapCanvasText(ctx, primaryItem.name, col2W - (priceStyle === 'WOBBLER_STARBURST' ? 160 : 48)).slice(0, 2);
        prodLines.forEach((ln, idx) => ctx.fillText(ln, col2X + 24, itemTop + 52 + idx * 36));

        if (priceStyle === 'WOBBLER_STARBURST') {
          drawStarburstPolygon(ctx, col2X + col2W - 76, itemTop + 80, 56, 42, 14);
          ctx.fillStyle = palette.starburstHex;
          ctx.fill();
          ctx.fillStyle = palette.starburstTextHex;
          ctx.font = '900 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${primaryItem.savingsPercent}%`, col2X + col2W - 76, itemTop + 88);
          ctx.textAlign = 'left';
        }

        if (priceStyle === 'SPLIT_DUO') {
          const halfW = Math.round((col2W - 56) / 2);
          ctx.fillStyle = palette.isLight ? '#E2E8F0' : 'rgba(255,255,255,0.08)';
          drawRoundedRect(ctx, col2X + 20, itemTop + 150, halfW, itemH - 172, 14);
          ctx.fill();
          ctx.fillStyle = palette.accentHex;
          drawRoundedRect(ctx, col2X + 36 + halfW, itemTop + 150, halfW, itemH - 172, 14);
          ctx.fill();

          ctx.fillStyle = palette.strikeHex;
          ctx.font = 'bold 24px monospace';
          ctx.fillText('NORMAL', col2X + 34, itemTop + 188);
          ctx.fillText(`Rp ${primaryItem.originalPrice.toLocaleString('id-ID')}`, col2X + 34, itemTop + 236);

          ctx.fillStyle = palette.accentTextHex;
          ctx.font = '900 20px sans-serif';
          ctx.fillText('HARGA PROMO', col2X + 50 + halfW, itemTop + 188);
          ctx.font = '900 34px monospace';
          ctx.fillText(`Rp ${primaryItem.promoPrice.toLocaleString('id-ID')}`, col2X + 50 + halfW, itemTop + 238);
        } else {
          ctx.fillStyle = palette.strikeHex;
          ctx.font = 'bold 28px monospace';
          const normStr = `Normal: Rp ${primaryItem.originalPrice.toLocaleString('id-ID')}`;
          ctx.fillText(normStr, col2X + 24, itemTop + itemH - 115);
          const nw = ctx.measureText(normStr).width;
          ctx.strokeStyle = palette.strikeHex;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(col2X + 22, itemTop + itemH - 125);
          ctx.lineTo(col2X + 26 + nw, itemTop + itemH - 125);
          ctx.stroke();

          ctx.fillStyle = palette.priceGlowHex;
          ctx.font = '900 62px monospace';
          ctx.fillText(`Rp ${primaryItem.promoPrice.toLocaleString('id-ID')}`, col2X + 24, itemTop + itemH - 36);
        }
      }

      if (hasRightCol) {
        const itemTop = pad + 82;
        const itemH = H - itemTop - pad;
        if (showBarcodeBlock) {
          drawCanvasBarcode(col3X, itemTop, col3W, showBranchQuota ? Math.round(itemH * 0.56) : itemH, 22);
        }
        if (showBranchQuota) {
          const infoTop = showBarcodeBlock ? itemTop + Math.round(itemH * 0.61) : itemTop;
          const infoH = showBarcodeBlock ? Math.round(itemH * 0.39) : itemH;
          ctx.fillStyle = palette.cardHex;
          drawRoundedRect(ctx, col3X, infoTop, col3W, infoH, 16);
          ctx.fill();
          ctx.strokeStyle = palette.borderHex;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = palette.titleHex;
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText(effectiveStore.toUpperCase(), col3X + 20, infoTop + 40);
          ctx.font = 'bold 22px monospace';
          ctx.fillText(`${activeCampaign.startDate} s.d. ${activeCampaign.endDate}`, col3X + 20, infoTop + 74);
          ctx.fillStyle = palette.mutedHex;
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText(quotaText, col3X + 20, infoTop + 108);
        }
      }
    } else if (format === 'WHATSAPP_MEMBER') {
      ctx.fillStyle = effectiveHeadlineHex;
      ctx.font = '900 54px sans-serif';
      const headLines = wrapCanvasText(ctx, headline, W - pad * 2).slice(0, 2);
      let cursorY = pad + 118;
      headLines.forEach((ln) => {
        ctx.fillText(ln, pad, cursorY);
        cursorY += 64;
      });

      const photoH = 380;
      const photoY = cursorY + 12;
      const waHeroImg = loadedCustomImg && imageDisplayMode === 'SPLIT_CARD' ? loadedCustomImg : loadedHeroImg;
      if (waHeroImg) {
        ctx.save();
        drawRoundedRect(ctx, pad, photoY, W - pad * 2, photoH, 22);
        ctx.clip();
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(pad, photoY, W - pad * 2, photoH);
        const scale = Math.min((W - pad * 2) / waHeroImg.width, photoH / waHeroImg.height);
        const dw = waHeroImg.width * scale;
        const dh = waHeroImg.height * scale;
        ctx.drawImage(waHeroImg, pad + (W - pad * 2 - dw) / 2, photoY + (photoH - dh) / 2, dw, dh);
        ctx.restore();
        ctx.strokeStyle = palette.borderHex;
        ctx.lineWidth = 3;
        drawRoundedRect(ctx, pad, photoY, W - pad * 2, photoH, 22);
        ctx.stroke();
      } else if (imageDisplayMode !== 'NO_IMAGE') {
        drawProductIllustrationOnCanvas(ctx, pad, photoY, W - pad * 2, photoH, primaryItem, effectiveStore);
      }

      if (showPriceBlock) {
        const detailY = imageDisplayMode === 'NO_IMAGE' && !loadedCustomImg ? cursorY + 20 : photoY + photoH + 22;
        const detailH = 300;
        ctx.fillStyle = palette.cardHex;
        drawRoundedRect(ctx, pad, detailY, W - pad * 2, detailH, 22);
        ctx.fill();
        ctx.strokeStyle = palette.borderHex;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = palette.titleHex;
        ctx.font = 'bold 34px sans-serif';
        const titleLines = wrapCanvasText(ctx, primaryItem.name, W - pad * 2 - 180).slice(0, 2);
        titleLines.forEach((ln, idx) => ctx.fillText(ln, pad + 26, detailY + 54 + idx * 42));

        if (priceStyle === 'WOBBLER_STARBURST') {
          drawStarburstPolygon(ctx, W - pad - 88, detailY + 86, 60, 45, 14);
          ctx.fillStyle = palette.starburstHex;
          ctx.fill();
          ctx.fillStyle = palette.starburstTextHex;
          ctx.font = '900 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('HEMAT', W - pad - 88, detailY + 80);
          ctx.font = '900 28px sans-serif';
          ctx.fillText(`${primaryItem.savingsPercent}%`, W - pad - 88, detailY + 110);
          ctx.textAlign = 'left';
        }

        ctx.fillStyle = palette.strikeHex;
        ctx.font = 'bold 30px monospace';
        const origTxt = `Normal: Rp ${primaryItem.originalPrice.toLocaleString('id-ID')}`;
        ctx.fillText(origTxt, pad + 26, detailY + 165);
        const ow = ctx.measureText(origTxt).width;
        ctx.strokeStyle = palette.strikeHex;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pad + 24, detailY + 155);
        ctx.lineTo(pad + 28 + ow, detailY + 155);
        ctx.stroke();

        ctx.fillStyle = palette.priceGlowHex;
        ctx.font = '900 66px monospace';
        ctx.fillText(`Rp ${primaryItem.promoPrice.toLocaleString('id-ID')}`, pad + 26, detailY + 235);

        ctx.fillStyle = palette.mutedHex;
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(`${primaryItem.promoBadgeText}`, pad + 26, detailY + 278);
      }

      drawFooterBoxIfEnabled(H - pad - 175, 175);
    } else {
      // VERTICAL POSTER / SOCIAL FORMATS
      ctx.fillStyle = effectiveHeadlineHex;
      const headFontSize = format === 'SHELF_TALKER' ? 50 : 62;
      ctx.font = `900 ${headFontSize}px sans-serif`;
      const headLines = wrapCanvasText(ctx, headline, W - pad * 2).slice(0, 3);
      let cursorY = pad + 130;
      headLines.forEach((ln) => {
        ctx.fillText(ln, pad, cursorY);
        cursorY += headFontSize + 14;
      });

      if (subtitleNarration) {
        ctx.fillStyle = effectiveMutedHex;
        ctx.font = 'bold 24px sans-serif';
        const subLines = wrapCanvasText(ctx, subtitleNarration, W - pad * 2).slice(0, 3);
        subLines.forEach((ln) => {
          ctx.fillText(ln, pad, cursorY);
          cursorY += 32;
        });
        cursorY += 10;
      }

      if (loadedCustomImg && imageDisplayMode === 'SPLIT_CARD') {
        const splitH = Math.round(H * 0.28);
        ctx.save();
        drawRoundedRect(ctx, pad, cursorY, W - pad * 2, splitH, 22);
        ctx.clip();
        const sc = Math.max((W - pad * 2) / loadedCustomImg.width, splitH / loadedCustomImg.height);
        const dw = loadedCustomImg.width * sc;
        const dh = loadedCustomImg.height * sc;
        ctx.drawImage(loadedCustomImg, pad + (W - pad * 2 - dw) / 2, cursorY + (splitH - dh) / 2, dw, dh);
        ctx.restore();
        cursorY += splitH + 22;
      }

      if (showPriceBlock) {
        const maxItems = format === 'SHELF_TALKER' ? 1 : priceStyle === 'MINIMALIS_PAPAN_RAK' ? 2 : 3;
        const itemsToDraw = resolvedItems.slice(0, maxItems);
        const hasFooter = showBarcodeBlock || showBranchQuota;
        const footerH = hasFooter ? (priceStyle === 'MINIMALIS_PAPAN_RAK' ? 220 : 180) : 0;
        const availH = H - cursorY - pad - footerH - 25;
        const cardH = Math.min(250, Math.max(145, Math.floor((availH - (itemsToDraw.length - 1) * 18) / itemsToDraw.length)));

        itemsToDraw.forEach((it) => {
          ctx.fillStyle = palette.cardHex;
          drawRoundedRect(ctx, pad, cursorY, W - pad * 2, cardH, 22);
          ctx.fill();
          ctx.strokeStyle = palette.borderHex;
          ctx.lineWidth = 3;
          ctx.stroke();

          if (priceStyle === 'SPLIT_DUO') {
            ctx.fillStyle = palette.titleHex;
            ctx.font = 'bold 28px sans-serif';
            ctx.fillText(it.name, pad + 24, cursorY + 42);

            const halfW = Math.round((W - pad * 2 - 64) / 2);
            ctx.fillStyle = palette.isLight ? '#E2E8F0' : 'rgba(255,255,255,0.08)';
            drawRoundedRect(ctx, pad + 20, cursorY + 62, halfW, cardH - 80, 14);
            ctx.fill();

            ctx.fillStyle = palette.accentHex;
            drawRoundedRect(ctx, pad + 44 + halfW, cursorY + 62, halfW, cardH - 80, 14);
            ctx.fill();

            ctx.fillStyle = palette.mutedHex;
            ctx.font = 'bold 18px sans-serif';
            ctx.fillText(
              activeCampaign.mechanic === 'BUY_X_GET_Y' ? `BELI ${activeCampaign.buyQty || 2} UNIT` : 'HARGA NORMAL',
              pad + 36,
              cursorY + 96
            );
            ctx.fillStyle = palette.strikeHex;
            ctx.font = 'bold 30px monospace';
            ctx.fillText(`Rp ${it.originalPrice.toLocaleString('id-ID')}`, pad + 36, cursorY + 138);

            ctx.fillStyle = palette.accentTextHex;
            ctx.font = '900 18px sans-serif';
            ctx.fillText(
              activeCampaign.mechanic === 'BUY_X_GET_Y'
                ? `GRATIS ${activeCampaign.getFreeQty || 1} UNIT`
                : 'HARGA PROMO HEMAT',
              pad + 60 + halfW,
              cursorY + 96
            );
            ctx.font = '900 38px monospace';
            ctx.fillText(`Rp ${it.promoPrice.toLocaleString('id-ID')}`, pad + 60 + halfW, cursorY + 142);
          } else {
            ctx.fillStyle = palette.titleHex;
            ctx.font = 'bold 30px sans-serif';
            const titleMaxW = priceStyle === 'WOBBLER_STARBURST' ? W - pad * 2 - 190 : W - pad * 2 - 48;
            const pLines = wrapCanvasText(ctx, it.name, titleMaxW).slice(0, 2);
            pLines.forEach((ln, idx) => {
              ctx.fillText(ln, pad + 24, cursorY + 46 + idx * 36);
            });

            if (priceStyle === 'WOBBLER_STARBURST') {
              const sx = W - pad - 88;
              const sy = cursorY + Math.round(cardH / 2);
              drawStarburstPolygon(ctx, sx, sy, 66, 50, 14);
              ctx.fillStyle = palette.starburstHex;
              ctx.fill();
              ctx.fillStyle = palette.starburstTextHex;
              ctx.font = '900 18px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('HEMAT', sx, sy - 6);
              ctx.font = '900 30px sans-serif';
              ctx.fillText(it.savingsPercent > 0 ? `${it.savingsPercent}%` : 'PROMO', sx, sy + 26);
              ctx.textAlign = 'left';
            }

            const priceY = cursorY + cardH - 32;
            ctx.fillStyle = palette.strikeHex;
            ctx.font = 'bold 28px monospace';
            const origTxt = `Rp ${it.originalPrice.toLocaleString('id-ID')}`;
            ctx.fillText(origTxt, pad + 24, priceY - (priceStyle === 'KLASIK_SWALAYAN' ? 42 : 0));
            const ow = ctx.measureText(origTxt).width;
            ctx.strokeStyle = palette.strikeHex;
            ctx.lineWidth = 3;
            ctx.beginPath();
            const strikeLineY = priceY - (priceStyle === 'KLASIK_SWALAYAN' ? 52 : 10);
            ctx.moveTo(pad + 22, strikeLineY);
            ctx.lineTo(pad + 26 + ow, strikeLineY);
            ctx.stroke();

            ctx.fillStyle = palette.priceGlowHex;
            ctx.font = '900 56px monospace';
            if (priceStyle === 'KLASIK_SWALAYAN') {
              ctx.fillText(`Rp ${it.promoPrice.toLocaleString('id-ID')}`, pad + 24, priceY + 6);
            } else {
              ctx.textAlign = 'right';
              ctx.fillText(
                `Rp ${it.promoPrice.toLocaleString('id-ID')}`,
                priceStyle === 'WOBBLER_STARBURST' ? W - pad - 165 : W - pad - 24,
                priceY + 4
              );
              ctx.textAlign = 'left';
            }
          }

          cursorY += cardH + 18;
        });
      }

      drawFooterBoxIfEnabled(H - pad - 180, 180);
    }

    const link = document.createElement('a');
    link.download = `poster-${activeCampaign.code}-${format.toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    if (showToast) {
      showToast(`Gambar ${effectiveSizeMeta.label} (${effectiveSizeMeta.dimensionLabel} · ${W}×${H}px) berhasil diunduh.`);
    }
  };

  const renderPosterItemsContent = (compactPrint = false, singleCompact = false, isBanner = false) => {
    const maxItems =
      format === 'SHELF_TALKER' || singleCompact || isBanner || effectiveSizeMeta.isHorizontal
        ? 1
        : priceStyle === 'MINIMALIS_PAPAN_RAK'
        ? 2
        : 3;
    const list = resolvedItems.slice(0, maxItems);

    if (isBanner) {
      return (
        <div className="my-0">
          {list.map((it, idx) => {
            if (priceStyle === 'SPLIT_DUO') {
              return (
                <div key={idx} className={`p-2 rounded-lg border ${palette.itemCardClasses}`}>
                  <div className="text-xs font-bold leading-tight truncate mb-1">{it.name}</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div
                      className={`px-2 py-1 rounded border ${
                        palette.isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/25 border-white/15'
                      }`}
                    >
                      <div className="text-[8px] font-mono uppercase opacity-75">
                        {activeCampaign.mechanic === 'BUY_X_GET_Y'
                          ? `BELI ${activeCampaign.buyQty || 2}`
                          : 'NORMAL'}
                      </div>
                      <div className={`text-[10px] font-mono font-bold line-through tabular-nums ${palette.strikeClasses}`}>
                        Rp {it.originalPrice.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div
                      className="px-2 py-1 rounded font-black"
                      style={{ backgroundColor: palette.accentHex, color: palette.accentTextHex }}
                    >
                      <div className="text-[8px] font-mono uppercase">
                        {activeCampaign.mechanic === 'BUY_X_GET_Y'
                          ? `GRATIS ${activeCampaign.getFreeQty || 1}`
                          : 'PROMO'}
                      </div>
                      <div className="text-sm font-mono font-black tabular-nums leading-tight">
                        Rp {it.promoPrice.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (priceStyle === 'WOBBLER_STARBURST') {
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${palette.itemCardClasses}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold leading-tight truncate">{it.name}</div>
                    <div className={`text-[10px] font-mono line-through opacity-80 tabular-nums mt-0.5 ${palette.strikeClasses}`}>
                      Rp {it.originalPrice.toLocaleString('id-ID')}
                    </div>
                    <div className={`text-sm sm:text-base font-mono font-black tabular-nums leading-tight ${palette.priceClasses}`}>
                      Rp {it.promoPrice.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex flex-col items-center justify-center shrink-0 text-center leading-none font-black shadow-sm"
                    style={{ backgroundColor: palette.starburstHex, color: palette.starburstTextHex }}
                  >
                    <span className="text-[7px] uppercase">{activeCampaign.mechanic === 'BUY_X_GET_Y' ? 'GRATIS' : 'HEMAT'}</span>
                    <span className="text-[11px] tabular-nums">{it.savingsPercent > 0 ? `${it.savingsPercent}%` : 'PROMO'}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={idx} className={`p-2 rounded-lg border ${palette.itemCardClasses}`}>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-bold leading-tight truncate">{it.name}</span>
                  <span className="text-[9px] font-mono opacity-80 shrink-0">{it.promoBadgeText}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className={`text-[10px] font-mono line-through opacity-80 tabular-nums ${palette.strikeClasses}`}>
                    Rp {it.originalPrice.toLocaleString('id-ID')}
                  </span>
                  <span className={`text-sm sm:text-base font-mono font-black tracking-tight tabular-nums leading-tight ${palette.priceClasses}`}>
                    Rp {it.promoPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (priceStyle === 'SPLIT_DUO') {
      return (
        <div className="space-y-2 my-1">
          {list.map((it, idx) => (
            <div key={idx} className={`p-3 rounded-xl border ${palette.itemCardClasses}`}>
              <div className="text-xs sm:text-sm font-bold leading-snug mb-2">{it.name}</div>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={`p-2 rounded-lg border ${
                    palette.isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/25 border-white/15'
                  }`}
                >
                  <div className="text-[9px] font-mono uppercase opacity-75">
                    {activeCampaign.mechanic === 'BUY_X_GET_Y'
                      ? `BELI ${activeCampaign.buyQty || 2} UNIT`
                      : 'HARGA NORMAL'}
                  </div>
                  <div className={`text-sm font-mono font-bold line-through tabular-nums mt-0.5 ${palette.strikeClasses}`}>
                    Rp {it.originalPrice.toLocaleString('id-ID')}
                  </div>
                </div>
                <div
                  className="p-2 rounded-lg font-black"
                  style={{ backgroundColor: palette.accentHex, color: palette.accentTextHex }}
                >
                  <div className="text-[9px] font-mono uppercase">
                    {activeCampaign.mechanic === 'BUY_X_GET_Y'
                      ? `GRATIS ${activeCampaign.getFreeQty || 1} UNIT`
                      : activeCampaign.sourceType === 'STORE_BND'
                      ? 'HARGA PAKET'
                      : 'HARGA PROMO'}
                  </div>
                  <div className="text-base sm:text-lg font-mono font-black tabular-nums mt-0.5">
                    Rp {it.promoPrice.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (priceStyle === 'WOBBLER_STARBURST') {
      return (
        <div className="space-y-2 my-1">
          {list.map((it, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${palette.itemCardClasses}`}
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-bold leading-snug">{it.name}</div>
                <div className={`text-xs font-mono line-through opacity-80 tabular-nums mt-1 ${palette.strikeClasses}`}>
                  Rp {it.originalPrice.toLocaleString('id-ID')}
                </div>
                <div
                  className={`${compactPrint ? 'text-3xl' : 'text-xl sm:text-2xl'} font-mono font-black tabular-nums ${palette.priceClasses}`}
                >
                  Rp {it.promoPrice.toLocaleString('id-ID')}
                </div>
              </div>
              <StarburstBadge
                pct={it.savingsPercent}
                subLabel={activeCampaign.mechanic === 'BUY_X_GET_Y' ? 'GRATIS' : 'HEMAT'}
                bgColor={palette.starburstHex}
                textColor={palette.starburstTextHex}
                compact={effectiveSizeMeta.isHorizontal || format === 'SHELF_TALKER'}
              />
            </div>
          ))}
        </div>
      );
    }

    if (priceStyle === 'MINIMALIS_PAPAN_RAK') {
      return (
        <div className="space-y-2 my-1">
          {list.map((it, idx) => (
            <div key={idx} className={`p-3 rounded-xl border ${palette.itemCardClasses}`}>
              <div className="grid grid-cols-12 gap-2 items-center border-b pb-2 mb-2 border-current/15">
                <div className="col-span-8">
                  <div className="text-[10px] font-mono uppercase opacity-70">Item Promo</div>
                  <div className="text-xs sm:text-sm font-bold leading-snug">{it.name}</div>
                </div>
                <div className="col-span-4 text-right">
                  <div className="text-[10px] font-mono uppercase opacity-70">Aturan</div>
                  <div className="text-[10px] font-mono font-semibold">{it.promoBadgeText}</div>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className={`text-xs font-mono line-through opacity-75 tabular-nums ${palette.strikeClasses}`}>
                  Rp {it.originalPrice.toLocaleString('id-ID')}
                </span>
                <span
                  className={`${compactPrint ? 'text-3xl' : 'text-xl sm:text-2xl'} font-mono font-black tabular-nums ${palette.priceClasses}`}
                >
                  Rp {it.promoPrice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2 my-1">
        {list.map((it, idx) => (
          <div key={idx} className={`p-3 rounded-xl border ${palette.itemCardClasses}`}>
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold leading-snug">{it.name}</span>
              <span className="text-[10px] font-mono opacity-85 shrink-0">{it.promoBadgeText}</span>
            </div>
            <div className="mt-1.5 flex flex-col items-start">
              <span className={`text-xs sm:text-sm font-mono line-through opacity-80 tabular-nums ${palette.strikeClasses}`}>
                Normal: Rp {it.originalPrice.toLocaleString('id-ID')}
              </span>
              <span
                className={`${compactPrint ? 'text-4xl' : 'text-2xl sm:text-3xl'} font-mono font-black tracking-tight tabular-nums leading-none mt-0.5 ${palette.priceClasses}`}
              >
                Rp {it.promoPrice.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const quotaInfoLabel =
    activeCampaign.sourceType === 'FEFO_EXP'
      ? 'FEFO Clearance · Unlimited/Struk'
      : activeCampaign.maxQtyPerReceipt
      ? `Maks. ${activeCampaign.maxQtyPerReceipt} unit/struk`
      : 'Berlaku di Seluruh Kasir';

  const primaryItem = resolvedItems[0];
  const displayQueue = blastQueue.length > 0 ? blastQueue : preparedQueue;

  return (
    <>
      <div
        ref={modalBackdropRef}
        className="fixed inset-0 z-50 flex items-start justify-center pt-6 px-3 pb-6 sm:px-5 bg-black/80 backdrop-blur-sm overflow-y-auto print:hidden"
      >
        <div
          className={`w-full max-w-6xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-3rem)] ${
            isDark
              ? 'bg-[#0d1117] border-cyan-500/45 text-slate-100'
              : 'bg-white border-cyan-500/70 text-slate-900'
          }`}
        >
          {/* Sticky Top Bar (h-14 shrink-0) */}
          <div
            className={`px-5 h-14 border-b flex items-center justify-between gap-3 shrink-0 ${
              isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50/90'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="font-bold">STUDIO POSTER &amp; SOSMED</span>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 truncate">
                {effectiveStore}
              </span>
            </div>

            {campaigns.length > 1 && onSelectCampaign && (
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                  Pilih Promo:
                </label>
                <select
                  value={activeCampaign.id}
                  onChange={(e) => {
                    const found = campaigns.find((c) => c.id === e.target.value);
                    if (found) onSelectCampaign(found);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs max-w-[240px] outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-slate-200'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.status}] {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSavePosterDesign}
                className="py-1.5 px-3 rounded-xl border border-cyan-500/50 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-600 dark:text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Simpan Desain</span>
              </button>
              <button
                type="button"
                onClick={handleSaveAndDownloadPng}
                className="py-1.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PNG</span>
              </button>
              <button
                type="button"
                onClick={handlePrintPoster}
                className="py-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:text-slate-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body 2 Columns */}
          <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* LEFT COLUMN (42% / 5 cols): 2-Tab Controls & Automated Member Broadcast */}
            <div
              className={`lg:col-span-5 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r ${
                isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              {/* Left 2-Tab Switcher */}
              <div
                className={`px-4 pt-3 pb-2 border-b grid grid-cols-2 gap-2 shrink-0 ${
                  isDark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveLeftTab('DESIGN')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                    activeLeftTab === 'DESIGN'
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                      : isDark
                      ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>1. Desain &amp; Narasi Poster</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLeftTab('WA')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                    activeLeftTab === 'WA'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : isDark
                      ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>2. Broadcast WA ({eligibleMembers.length})</span>
                </button>
              </div>

              {/* Left Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {activeLeftTab === 'DESIGN' ? (
                  <>
                    {/* Baris 1: Upload Gambar & Mode Tampilan */}
                    <div
                      className={`p-3 rounded-2xl border space-y-2.5 ${
                        isDark ? 'bg-slate-900/80 border-cyan-500/30' : 'bg-cyan-50/60 border-cyan-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Gambar Latar / Produk</span>
                        </span>
                        {customHeroImage && (
                          <button
                            type="button"
                            onClick={() => setCustomHeroImage(null)}
                            className="text-[11px] text-rose-500 hover:text-rose-400 font-bold cursor-pointer"
                          >
                            Reset Foto
                          </button>
                        )}
                      </div>

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              setCustomHeroImage(evt.target?.result as string);
                              if (imageDisplayMode === 'NO_IMAGE') {
                                setImageDisplayMode('FULL_BG');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold block mb-1 text-slate-600 dark:text-slate-400">
                            Mode Tampilan Gambar
                          </label>
                          <select
                            value={imageDisplayMode}
                            onChange={(e) =>
                              setImageDisplayMode(e.target.value as 'FULL_BG' | 'SPLIT_CARD' | 'NO_IMAGE')
                            }
                            className={`w-full border rounded-xl px-2.5 py-1.5 text-xs outline-none ${
                              isDark
                                ? 'bg-slate-950 border-slate-700 text-slate-200'
                                : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          >
                            <option value="FULL_BG">Full BG + Overlay</option>
                            <option value="SPLIT_CARD">Split Card</option>
                            <option value="NO_IMAGE">Tanpa Gambar</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold block mb-1 text-slate-600 dark:text-slate-400">
                            Fokus Posisi Gambar
                          </label>
                          <select
                            value={imageObjectPosition}
                            onChange={(e) =>
                              setImageObjectPosition(
                                e.target.value as 'center' | 'top' | 'bottom' | 'left' | 'right'
                              )
                            }
                            disabled={!customHeroImage || imageDisplayMode === 'NO_IMAGE'}
                            className={`w-full border rounded-xl px-2.5 py-1.5 text-xs outline-none disabled:opacity-50 ${
                              isDark
                                ? 'bg-slate-950 border-slate-700 text-slate-200'
                                : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          >
                            <option value="center">Tengah (Center)</option>
                            <option value="top">Atas (Top)</option>
                            <option value="bottom">Bawah (Bottom)</option>
                            <option value="left">Kiri (Left)</option>
                            <option value="right">Kanan (Right)</option>
                          </select>
                        </div>
                      </div>

                      {customHeroImage && imageDisplayMode !== 'NO_IMAGE' && (
                        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-cyan-500/20 items-center">
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                              <span>Zoom Foto</span>
                              <span className="font-mono">{imageZoomScale}%</span>
                            </div>
                            <input
                              type="range"
                              min="100"
                              max="130"
                              value={imageZoomScale}
                              onChange={(e) => setImageZoomScale(Number(e.target.value))}
                              className="w-full accent-cyan-600 cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold block mb-0.5 text-slate-600 dark:text-slate-300">
                              Overlay Gelap
                            </label>
                            <select
                              value={overlayOpacity}
                              onChange={(e) =>
                                setOverlayOpacity(e.target.value as 'DARK_70' | 'MED_45' | 'LIGHT_25')
                              }
                              disabled={imageDisplayMode !== 'FULL_BG'}
                              className={`w-full border rounded-xl px-2 py-1 text-xs outline-none disabled:opacity-50 ${
                                isDark
                                  ? 'bg-slate-950 border-slate-700 text-slate-200'
                                  : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            >
                              <option value="DARK_70">Gelap (70%)</option>
                              <option value="MED_45">Sedang (45%)</option>
                              <option value="LIGHT_25">Terang (25%)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Baris 2: Format Cetak & Dimensi Medsos */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <LayoutTemplate className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Format Cetak &amp; Ukuran Media Sosial</span>
                      </label>
                      <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value as PosterFormat)}
                        className={`w-full border rounded-xl px-3 py-2 text-xs font-medium outline-none ${
                          isDark
                            ? 'bg-slate-950 border-slate-700 text-slate-200'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        {(Object.keys(FORMAT_META) as Exclude<PosterFormat, 'CUSTOM'>[]).map((key) => {
                          const m = FORMAT_META[key];
                          return (
                            <option key={key} value={key}>
                              {m.label} ({m.dimensionLabel}) — {m.subtitle}
                            </option>
                          );
                        })}
                        <option value="CUSTOM">
                          Ukuran Kustom ({customWidthCm}×{customHeightCm}cm)
                        </option>
                      </select>

                      {format === 'CUSTOM' && (
                        <div
                          className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
                            isDark ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-cyan-50 border-cyan-300'
                          }`}
                        >
                          <Ruler className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                          <span className="text-[11px] font-medium shrink-0">Dimensi (cm):</span>
                          <input
                            type="number"
                            min={5}
                            max={300}
                            value={customWidthCm}
                            onChange={(e) => setCustomWidthCm(Math.max(5, Number(e.target.value) || 5))}
                            className={`w-16 px-2 py-1 rounded-lg border text-xs font-mono text-center ${
                              isDark
                                ? 'bg-slate-950 border-slate-700 text-white'
                                : 'bg-white border-slate-300 text-slate-900'
                            }`}
                            aria-label="Lebar cm"
                          />
                          <span className="text-slate-400 font-mono">×</span>
                          <input
                            type="number"
                            min={5}
                            max={300}
                            value={customHeightCm}
                            onChange={(e) => setCustomHeightCm(Math.max(5, Number(e.target.value) || 5))}
                            className={`w-16 px-2 py-1 rounded-lg border text-xs font-mono text-center ${
                              isDark
                                ? 'bg-slate-950 border-slate-700 text-white'
                                : 'bg-white border-slate-300 text-slate-900'
                            }`}
                            aria-label="Tinggi cm"
                          />
                          <span className="text-[11px] font-mono text-slate-500">cm</span>
                        </div>
                      )}
                    </div>

                    {/* Baris 3: Gaya Tipografi Medsos, Posisi Teks & Gaya Harga Ritel */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                          Gaya Tipografi Medsos
                        </label>
                        <select
                          value={socialTypography}
                          onChange={(e) => setSocialTypography(e.target.value as SocialTypographyStyle)}
                          className={`w-full border rounded-xl px-2.5 py-2 text-xs outline-none ${
                            isDark
                              ? 'bg-slate-950 border-slate-700 text-slate-200'
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="NONE">Standar Ritel</option>
                          <option value="AESTHETIC_EDITORIAL">Aesthetic Editorial</option>
                          <option value="TIKTOK_REELS_VIRAL">TikTok / Reels Viral Bold</option>
                          <option value="CLEAN_GLASS_CARD">Clean Glassmorphism</option>
                          <option value="MINIMALIST_THREADS">Minimalist Threads</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                          Posisi Konten &amp; Teks
                        </label>
                        <select
                          value={textPosition}
                          onChange={(e) => setTextPosition(e.target.value as 'TOP' | 'CENTER' | 'BOTTOM')}
                          className={`w-full border rounded-xl px-2.5 py-2 text-xs outline-none ${
                            isDark
                              ? 'bg-slate-950 border-slate-700 text-slate-200'
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="TOP">Atas (Seimbang)</option>
                          <option value="CENTER">Tengah (Fokus Pusat)</option>
                          <option value="BOTTOM">Bawah (Overlay Foto)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold flex items-center gap-1.5 mb-1 text-slate-700 dark:text-slate-300">
                        <Tag className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Gaya Kartu Harga Ritel</span>
                      </label>
                      <select
                        value={priceStyle}
                        onChange={(e) => setPriceStyle(e.target.value as PosterPriceStyle)}
                        className={`w-full border rounded-xl px-3 py-2 text-xs outline-none ${
                          isDark
                            ? 'bg-slate-950 border-slate-700 text-slate-200'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        {(Object.keys(PRICE_STYLE_META) as PosterPriceStyle[]).map((styleKey) => {
                          const st = PRICE_STYLE_META[styleKey];
                          return (
                            <option key={styleKey} value={styleKey}>
                              {st.label} — {st.desc}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Baris 4: Tema Warna Visual + Custom Color Picker + Pattern */}
                    <div
                      className={`p-3 rounded-2xl border space-y-2.5 ${
                        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <label className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <Palette className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Tema Warna Visual &amp; Pola Latar</span>
                      </label>

                      <div className="grid grid-cols-5 gap-1.5">
                        {(Object.keys(THEME_PALETTES) as PosterColorTheme[]).map((themeKey) => {
                          const p = THEME_PALETTES[themeKey];
                          const active = colorTheme === themeKey;
                          return (
                            <button
                              key={themeKey}
                              type="button"
                              onClick={() => setColorTheme(themeKey)}
                              title={p.label}
                              className={`p-1.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                                active
                                  ? 'border-cyan-500 bg-cyan-500/15 ring-1 ring-cyan-500/40'
                                  : isDark
                                  ? 'border-slate-800 bg-slate-950 hover:border-slate-700'
                                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              <div
                                className={`h-3 w-full rounded bg-gradient-to-r ${p.swatchClass}`}
                                style={
                                  themeKey === 'CUSTOM'
                                    ? {
                                        background: `linear-gradient(135deg, ${customBgColor} 50%, ${customTextColor} 50%)`,
                                      }
                                    : undefined
                                }
                              />
                              <span className="text-[9px] font-semibold leading-tight truncate w-full">
                                {themeKey === 'PUTIH_BERSIH'
                                  ? 'Putih'
                                  : themeKey === 'MERAH_KUNING'
                                  ? 'Swalayan'
                                  : themeKey === 'HIJAU_RAMADAN'
                                  ? 'Hijau'
                                  : themeKey === 'CYAN_ENTERPRISE'
                                  ? 'Cyan'
                                  : 'Kustom'}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Color Picker Latar & Teks */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <label
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border cursor-pointer ${
                            colorTheme === 'CUSTOM'
                              ? 'border-cyan-500/60 bg-cyan-500/5'
                              : isDark
                              ? 'border-slate-800 bg-slate-950/70'
                              : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                              Warna Latar
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 uppercase">
                              {customBgColor}
                            </div>
                          </div>
                          <input
                            type="color"
                            value={customBgColor}
                            onChange={(e) => {
                              setCustomBgColor(e.target.value);
                              setColorTheme('CUSTOM');
                            }}
                            className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer shrink-0"
                            aria-label="Pilih warna latar kustom"
                          />
                        </label>

                        <label
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border cursor-pointer ${
                            colorTheme === 'CUSTOM'
                              ? 'border-cyan-500/60 bg-cyan-500/5'
                              : isDark
                              ? 'border-slate-800 bg-slate-950/70'
                              : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                              Warna Teks
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 uppercase">
                              {customTextColor}
                            </div>
                          </div>
                          <input
                            type="color"
                            value={customTextColor}
                            onChange={(e) => {
                              setCustomTextColor(e.target.value);
                              setColorTheme('CUSTOM');
                            }}
                            className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer shrink-0"
                            aria-label="Pilih warna teks kustom"
                          />
                        </label>
                      </div>

                      {/* Pilihan Pola Latar (Pattern) */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                          Pola Latar:
                        </span>
                        <div className="grid grid-cols-4 gap-1 flex-1">
                          {(
                            [
                              { id: 'SOLID', label: 'Polos' },
                              { id: 'GRID', label: 'Grid' },
                              { id: 'DOTS', label: 'Dots' },
                              { id: 'STRIPES', label: 'Garis' },
                            ] as const
                          ).map((pat) => (
                            <button
                              key={pat.id}
                              type="button"
                              onClick={() => setBgPattern(pat.id)}
                              className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                bgPattern === pat.id
                                  ? 'bg-cyan-600 text-white border-cyan-500'
                                  : isDark
                                  ? 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {pat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Baris 5: Toggle Switches Elemen Footer & Harga */}
                    <div
                      className={`p-3 rounded-2xl border space-y-2 ${
                        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Elemen Tampilan Poster
                      </div>

                      {[
                        {
                          label: 'Blok Harga & Produk Promo',
                          hint: 'Kartu harga coret & nominal diskon',
                          checked: showPriceBlock,
                          onToggle: () => setShowPriceBlock((v) => !v),
                        },
                        {
                          label: 'Barcode Kasir Promo',
                          hint: 'Default non-aktif agar bersih untuk medsos',
                          checked: showBarcodeBlock,
                          onToggle: () => setShowBarcodeBlock((v) => !v),
                        },
                        {
                          label: 'Keterangan Cabang & Kuota',
                          hint: 'Nama cabang, periode & batas struk di bawah',
                          checked: showBranchQuota,
                          onToggle: () => setShowBranchQuota((v) => !v),
                        },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-3 py-0.5">
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                              {item.label}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {item.hint}
                            </div>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={item.checked}
                            onClick={item.onToggle}
                            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                              item.checked
                                ? 'bg-cyan-600'
                                : isDark
                                ? 'bg-slate-700'
                                : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                item.checked ? 'translate-x-4.5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Baris 6: Editor Headline & Sub-Narasi Poster */}
                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold block text-slate-700 dark:text-slate-300">
                          Tema / Headline Promo
                        </label>
                        <input
                          type="text"
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          placeholder="Masukkan headline besar poster promo..."
                          className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold outline-none transition ${
                            isDark
                              ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold block text-slate-700 dark:text-slate-300">
                          Redaksi / Sub-Narasi Poster
                        </label>
                        <textarea
                          rows={2}
                          value={subtitleNarration}
                          onChange={(e) => setSubtitleNarration(e.target.value)}
                          placeholder="Redaksi promosi persuasif..."
                          className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none transition resize-none ${
                            isDark
                              ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                          }`}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* TAB 2: Automated Broadcast to ALL Registered Members */
                  <div
                    className={`p-4 rounded-2xl border space-y-3 ${
                      isDark ? 'bg-slate-900/80 border-emerald-500/35' : 'bg-emerald-50/60 border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>Broadcast Otomatis Seluruh Member</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                        {eligibleMembers.length} Member Siap Kirim
                      </span>
                    </div>

                    {/* Member Recipients Queue Preview */}
                    <div
                      className={`p-2.5 rounded-xl border max-h-48 overflow-y-auto space-y-1.5 ${
                        isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-emerald-200'
                      }`}
                    >
                      {displayQueue.length === 0 ? (
                        <div className="text-[11px] text-slate-500 text-center py-3">
                          Belum ada member terdaftar dengan nomor WhatsApp valid.
                        </div>
                      ) : (
                        displayQueue.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between gap-2 text-[11px] py-1 border-b last:border-b-0 border-current/10"
                          >
                            <div className="min-w-0 truncate">
                              <span className="font-semibold">{m.name}</span>{' '}
                              <span className="text-slate-500 font-mono">
                                ({m.tier}) · {m.phoneIntl}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {m.status === 'READY' ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold inline-flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Siap
                                </span>
                              ) : m.status === 'PROCESSING' ? (
                                <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                              ) : (
                                <span className="text-slate-400 font-mono">Antre</span>
                              )}
                              <a
                                href={m.waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-0.5"
                                title={`Buka chat WhatsApp ${m.name}`}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Editable Broadcast Template */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Template Pesan Otomatis ({effectiveStore})
                        </span>
                        <button
                          type="button"
                          onClick={handleRegenerateWaText}
                          className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Regenerasi Teks</span>
                        </button>
                      </div>
                      <textarea
                        rows={6}
                        value={waMessage}
                        onChange={(e) => setWaMessage(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border text-xs font-mono leading-relaxed outline-none resize-y ${
                          isDark
                            ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-emerald-500'
                            : 'bg-white border-slate-300 text-slate-800 focus:border-emerald-500'
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyWaText}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {copiedWa ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedWa ? 'Tersalin' : 'Salin Teks'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBlasting || eligibleMembers.length === 0}
                        onClick={handleBlastAllMembers}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        {isBlasting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>
                              Memproses {blastCompletedCount}/{eligibleMembers.length} Member...
                            </span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Kirim Blast Otomatis ke Semua Member ({eligibleMembers.length})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN (58% / 7 cols): Clean Unclipped Live WYSIWYG Preview */}
            <div
              className={`lg:col-span-7 p-4 sm:p-6 flex flex-col items-center justify-start overflow-y-auto min-h-0 ${
                isDark ? 'bg-slate-950/90' : 'bg-slate-100'
              }`}
            >
              <div className="w-full flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-3 shrink-0">
                <span>
                  PREVIEW · {effectiveSizeMeta.label.toUpperCase()} ({effectiveSizeMeta.dimensionLabel} ·{' '}
                  {effectiveSizeMeta.canvasW}×{effectiveSizeMeta.canvasH}px)
                </span>
                <span>
                  {PRICE_STYLE_META[priceStyle].label} · {palette.label}
                </span>
              </div>

              {/* Actual Visual Poster Card (my-auto prevents top clipping on tall 9:16 formats) */}
              <div className="w-full flex justify-center my-auto py-1">
                <div
                  style={{
                    aspectRatio: `${effectiveSizeMeta.canvasW} / ${effectiveSizeMeta.canvasH}`,
                    ...(colorTheme === 'CUSTOM' && !hasDarkOverlayBg
                      ? {
                          backgroundColor: customBgColor,
                          color: customTextColor,
                          borderColor: palette.borderHex,
                        }
                      : {}),
                  }}
                  className={`w-full ${previewWidthClass} rounded-2xl border-2 ${
                    effectiveSizeMeta.isHorizontal ? 'p-3 sm:p-4' : 'p-4 sm:p-5'
                  } flex flex-col overflow-hidden transition-all relative ${
                    hasDarkOverlayBg ? 'border-white/30 text-white shadow-2xl' : palette.containerClasses
                  } ${
                    socialTypography === 'CLEAN_GLASS_CARD'
                      ? 'backdrop-blur-md shadow-2xl'
                      : socialTypography === 'AESTHETIC_EDITORIAL'
                      ? 'font-serif tracking-wide'
                      : socialTypography === 'TIKTOK_REELS_VIRAL'
                      ? 'italic font-black uppercase tracking-tight'
                      : ''
                  }`}
                >
                  {/* Pattern Overlay Layer */}
                  {bgPattern !== 'SOLID' && (
                    <div
                      className="absolute inset-0 z-[5] pointer-events-none"
                      style={getPatternOverlayStyle(bgPattern, hasDarkOverlayBg ? false : palette.isLight)}
                    />
                  )}

                  {/* Uploaded custom image background / dark overlay */}
                  {hasDarkOverlayBg && customHeroImage && (
                    <>
                      <img
                        src={customHeroImage}
                        alt="Custom Background"
                        style={{
                          objectPosition: imageObjectPosition,
                          transform: `scale(${imageZoomScale / 100})`,
                        }}
                        className="absolute inset-0 w-full h-full object-cover z-0 transition-all duration-300"
                      />
                      <div
                        className="absolute inset-0 z-10 pointer-events-none transition-all duration-300"
                        style={{
                          background: `linear-gradient(to top, rgba(0,0,0,${Math.min(
                            0.9,
                            overlayAlpha + 0.15
                          )}), rgba(0,0,0,${overlayAlpha}))`,
                        }}
                      />
                    </>
                  )}

                  {/* Content wrapper z-20 */}
                  <div className="relative z-20 flex flex-col justify-between flex-1 min-h-0">
                    {/* Top Row: Official Store Name */}
                    <div className="flex items-center justify-between gap-2 shrink-0">
                      <span
                        className={`${
                          effectiveSizeMeta.isHorizontal ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'
                        } rounded-md font-mono tracking-wider uppercase ${
                          hasDarkOverlayBg ? 'bg-cyan-400 text-slate-950 font-black' : palette.accentBadgeClasses
                        }`}
                      >
                        {effectiveStore.toUpperCase()} · OFFICIAL PROMO
                      </span>
                      <span
                        className={`${
                          effectiveSizeMeta.isHorizontal ? 'text-[10px]' : 'text-[11px]'
                        } font-mono font-bold tracking-wide truncate ${
                          hasDarkOverlayBg ? 'text-slate-200' : palette.mutedClasses
                        }`}
                        style={
                          colorTheme === 'CUSTOM' && !hasDarkOverlayBg ? { color: customTextColor } : undefined
                        }
                      >
                        {effectiveSizeMeta.dimensionLabel}
                      </span>
                    </div>

                    {/* Main Body Aligned by textPosition */}
                    <div
                      className={`flex-1 flex flex-col min-h-0 ${
                        textPosition === 'TOP'
                          ? 'justify-start pt-2'
                          : textPosition === 'CENTER'
                          ? 'justify-center'
                          : 'justify-end pb-1'
                      } ${
                        socialTypography === 'MINIMALIST_THREADS' ? 'text-left items-stretch' : ''
                      }`}
                    >
                      {effectiveSizeMeta.isHorizontal ? (
                        <div className="grid grid-cols-12 gap-2.5 items-center my-1 min-h-0">
                          <div
                            className={`${
                              showPriceBlock ? 'col-span-5 pr-2 border-r border-current/15' : 'col-span-12'
                            } flex flex-col justify-center min-w-0`}
                          >
                            <h4
                              className={`text-base sm:text-lg font-black leading-tight tracking-tight uppercase line-clamp-2 ${
                                hasDarkOverlayBg ? 'text-white drop-shadow-md' : palette.titleClasses
                              }`}
                              style={
                                colorTheme === 'CUSTOM' && !hasDarkOverlayBg
                                  ? { color: customTextColor }
                                  : undefined
                              }
                            >
                              {headline}
                            </h4>
                            {subtitleNarration && (
                              <p
                                className={`text-[10px] mt-0.5 line-clamp-2 ${
                                  hasDarkOverlayBg ? 'text-slate-200 drop-shadow' : palette.mutedClasses
                                }`}
                                style={
                                  colorTheme === 'CUSTOM' && !hasDarkOverlayBg
                                    ? { color: customTextColor }
                                    : undefined
                                }
                              >
                                {subtitleNarration}
                              </p>
                            )}
                          </div>
                          {showPriceBlock && (
                            <div className="col-span-7 flex flex-col justify-center min-w-0">
                              {renderPosterItemsContent(false, true, true)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2 my-1">
                          {/* Split card image if mode is SPLIT_CARD */}
                          {customHeroImage && imageDisplayMode === 'SPLIT_CARD' && (
                            <div className="relative w-full h-36 sm:h-44 rounded-xl overflow-hidden border border-current/20 shrink-0 shadow-md">
                              <img
                                src={customHeroImage}
                                alt="Custom Product"
                                style={{
                                  objectPosition: imageObjectPosition,
                                  transform: `scale(${imageZoomScale / 100})`,
                                }}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Default Product Thumbnail for WA Member when no custom image uploaded */}
                          {!customHeroImage &&
                            imageDisplayMode !== 'NO_IMAGE' &&
                            format === 'WHATSAPP_MEMBER' &&
                            primaryItem && (
                              <div className="my-1">
                                <ProductVisualThumbnail item={primaryItem} storeTitle={effectiveStore} />
                              </div>
                            )}

                          {/* Headline & Subtitle Narration */}
                          <div
                            className={`space-y-1 ${
                              socialTypography === 'CLEAN_GLASS_CARD' && !hasDarkOverlayBg
                                ? palette.isLight
                                  ? 'p-2.5 rounded-xl bg-white/70 border border-slate-200/80 backdrop-blur-sm'
                                  : 'p-2.5 rounded-xl bg-black/25 border border-white/15 backdrop-blur-sm'
                                : ''
                            }`}
                          >
                            <h4
                              className={`${
                                format === 'SHELF_TALKER' ? 'text-xl sm:text-2xl' : 'text-xl sm:text-2xl'
                              } font-black leading-tight tracking-tight uppercase ${
                                hasDarkOverlayBg ? 'text-white drop-shadow-md' : palette.titleClasses
                              }`}
                              style={
                                colorTheme === 'CUSTOM' && !hasDarkOverlayBg
                                  ? { color: customTextColor }
                                  : undefined
                              }
                            >
                              {headline}
                            </h4>
                            {subtitleNarration && (
                              <p
                                className={`text-xs leading-relaxed font-medium ${
                                  hasDarkOverlayBg ? 'text-slate-200 drop-shadow' : palette.mutedClasses
                                }`}
                                style={
                                  colorTheme === 'CUSTOM' && !hasDarkOverlayBg
                                    ? { color: customTextColor }
                                    : undefined
                                }
                              >
                                {subtitleNarration}
                              </p>
                            )}
                            <div
                              className={`text-[11px] flex flex-wrap items-center gap-x-2 ${
                                hasDarkOverlayBg ? 'text-slate-300' : palette.mutedClasses
                              }`}
                              style={
                                colorTheme === 'CUSTOM' && !hasDarkOverlayBg
                                  ? { color: customTextColor }
                                  : undefined
                              }
                            >
                              <span>{activeCampaign.name}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono">
                                {activeCampaign.startDate} s.d. {activeCampaign.endDate}
                              </span>
                            </div>
                          </div>

                          {showPriceBlock && renderPosterItemsContent(false, format === 'WHATSAPP_MEMBER')}
                        </div>
                      )}
                    </div>

                    {/* Conditional Footer: Shown ONLY if Barcode or Branch/Quota is toggled ON */}
                    {(showBarcodeBlock || showBranchQuota) && (
                      <div
                        className={`rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-3 shrink-0 mt-2 ${
                          hasDarkOverlayBg
                            ? 'bg-white/95 backdrop-blur text-slate-900 border border-white/50 shadow-xl'
                            : palette.barcodeBoxClasses
                        }`}
                      >
                        {showBarcodeBlock && (
                          <div className="min-w-0 flex-1">
                            <svg
                              viewBox={`0 0 ${totalBarUnits} 40`}
                              className="h-8 w-full max-w-[190px]"
                              preserveAspectRatio="none"
                            >
                              {(() => {
                                let x = 0;
                                return barcodeBars.map((w, i) => {
                                  const el =
                                    i % 2 === 0 ? (
                                      <rect key={i} x={x} y={0} width={w} height={40} fill="#0f172a" />
                                    ) : null;
                                  x += w;
                                  return el;
                                });
                              })()}
                            </svg>
                            <div className="text-[11px] font-mono font-black tracking-widest mt-0.5 truncate text-slate-900">
                              {barcodeText}
                            </div>
                          </div>
                        )}

                        {showBranchQuota && (
                          <div className={`${showBarcodeBlock ? 'text-right' : 'text-left w-full'} shrink-0`}>
                            <div className="text-xs font-black tracking-tight uppercase text-slate-900">
                              {effectiveStore}
                            </div>
                            <div className="text-[10px] text-slate-600 font-medium">{quotaInfoLabel}</div>
                            <div className="text-[10px] font-mono text-slate-500">
                              s.d. {activeCampaign.endDate}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY CONTAINER FOR CRISP PAPER / PDF PRINTING */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #promo-poster-print-container, #promo-poster-print-container * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #promo-poster-print-container {
            position: fixed !important;
            inset: 0 !important;
            margin: 0 !important;
            padding: 10mm !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #ffffff !important;
          }
          @page {
            size: ${effectiveSizeMeta.pageSizeCss};
            margin: 8mm;
          }
        }
      `}</style>
      <div id="promo-poster-print-container" className="hidden print:flex">
        <div
          style={{
            aspectRatio: `${effectiveSizeMeta.canvasW} / ${effectiveSizeMeta.canvasH}`,
            ...(colorTheme === 'CUSTOM' && !hasDarkOverlayBg
              ? {
                  backgroundColor: customBgColor,
                  color: customTextColor,
                  borderColor: palette.borderHex,
                }
              : {}),
          }}
          className={`w-full ${previewWidthClass} rounded-2xl border-4 p-6 flex flex-col justify-between relative overflow-hidden ${
            hasDarkOverlayBg ? 'border-white/40 text-white' : palette.containerClasses
          } ${
            socialTypography === 'AESTHETIC_EDITORIAL'
              ? 'font-serif tracking-wide'
              : socialTypography === 'TIKTOK_REELS_VIRAL'
              ? 'italic font-black uppercase tracking-tight'
              : ''
          }`}
        >
          {bgPattern !== 'SOLID' && (
            <div
              className="absolute inset-0 z-[5] pointer-events-none"
              style={getPatternOverlayStyle(bgPattern, hasDarkOverlayBg ? false : palette.isLight)}
            />
          )}

          {hasDarkOverlayBg && customHeroImage && (
            <>
              <img
                src={customHeroImage}
                alt="Custom Print Background"
                style={{
                  objectPosition: imageObjectPosition,
                  transform: `scale(${imageZoomScale / 100})`,
                }}
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                  background: `linear-gradient(to top, rgba(0,0,0,${Math.min(
                    0.9,
                    overlayAlpha + 0.15
                  )}), rgba(0,0,0,${overlayAlpha}))`,
                }}
              />
            </>
          )}

          <div className="relative z-20 flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase ${
                  hasDarkOverlayBg ? 'bg-cyan-400 text-slate-950 font-black' : palette.accentBadgeClasses
                }`}
              >
                {effectiveStore.toUpperCase()} · OFFICIAL PROMO
              </span>
              <span
                className={`text-sm font-mono font-bold ${
                  hasDarkOverlayBg ? 'text-slate-200' : palette.mutedClasses
                }`}
                style={colorTheme === 'CUSTOM' && !hasDarkOverlayBg ? { color: customTextColor } : undefined}
              >
                {effectiveSizeMeta.dimensionLabel}
              </span>
            </div>

            {effectiveSizeMeta.isHorizontal ? (
              <div className="flex-1 grid grid-cols-12 gap-3 items-center my-1 min-h-0">
                <div
                  className={`${
                    showPriceBlock ? 'col-span-5 pr-2 border-r border-current/20' : 'col-span-12'
                  } flex flex-col justify-center`}
                >
                  <h2
                    className={`text-lg font-black uppercase leading-tight line-clamp-2 ${
                      hasDarkOverlayBg ? 'text-white' : palette.titleClasses
                    }`}
                    style={
                      colorTheme === 'CUSTOM' && !hasDarkOverlayBg ? { color: customTextColor } : undefined
                    }
                  >
                    {headline}
                  </h2>
                  <p
                    className={`text-[11px] mt-0.5 truncate ${
                      hasDarkOverlayBg ? 'text-slate-200' : palette.mutedClasses
                    }`}
                    style={
                      colorTheme === 'CUSTOM' && !hasDarkOverlayBg ? { color: customTextColor } : undefined
                    }
                  >
                    {subtitleNarration || activeCampaign.name}
                  </p>
                </div>
                {showPriceBlock && (
                  <div className="col-span-7 flex flex-col justify-center min-w-0">
                    {renderPosterItemsContent(false, true, true)}
                  </div>
                )}
              </div>
            ) : (
              <div className="my-2 space-y-2.5 flex-1 flex flex-col justify-center">
                {customHeroImage && imageDisplayMode === 'SPLIT_CARD' && (
                  <div className="relative w-full h-44 rounded-xl overflow-hidden border border-current/20">
                    <img
                      src={customHeroImage}
                      alt="Custom Print Product"
                      style={{
                        objectPosition: imageObjectPosition,
                        transform: `scale(${imageZoomScale / 100})`,
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <h2
                    className={`text-3xl font-black uppercase leading-tight ${
                      hasDarkOverlayBg ? 'text-white' : palette.titleClasses
                    }`}
                    style={
                      colorTheme === 'CUSTOM' && !hasDarkOverlayBg ? { color: customTextColor } : undefined
                    }
                  >
                    {headline}
                  </h2>
                  {subtitleNarration && (
                    <p
                      className={`text-sm font-medium ${
                        hasDarkOverlayBg ? 'text-slate-200' : palette.mutedClasses
                      }`}
                      style={
                        colorTheme === 'CUSTOM' && !hasDarkOverlayBg ? { color: customTextColor } : undefined
                      }
                    >
                      {subtitleNarration}
                    </p>
                  )}
                  <p
                    className={`text-xs ${hasDarkOverlayBg ? 'text-slate-300' : palette.mutedClasses}`}
                    style={
                      colorTheme === 'CUSTOM' && !hasDarkOverlayBg ? { color: customTextColor } : undefined
                    }
                  >
                    {activeCampaign.name} · Berlaku {activeCampaign.startDate} s.d. {activeCampaign.endDate}
                  </p>
                </div>

                {!customHeroImage &&
                  imageDisplayMode !== 'NO_IMAGE' &&
                  format === 'WHATSAPP_MEMBER' &&
                  primaryItem && (
                    <div className="my-2">
                      <ProductVisualThumbnail item={primaryItem} storeTitle={effectiveStore} />
                    </div>
                  )}

                {showPriceBlock && renderPosterItemsContent(true)}
              </div>
            )}

            {(showBarcodeBlock || showBranchQuota) && (
              <div
                className={`rounded-xl p-4 flex items-center justify-between gap-4 mt-3 ${
                  hasDarkOverlayBg ? 'bg-white/95 text-slate-900' : palette.barcodeBoxClasses
                }`}
              >
                {showBarcodeBlock && (
                  <div>
                    <svg viewBox={`0 0 ${totalBarUnits} 40`} className="h-12 w-56" preserveAspectRatio="none">
                      {(() => {
                        let x = 0;
                        return barcodeBars.map((w, i) => {
                          const el =
                            i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={40} fill="#0f172a" /> : null;
                          x += w;
                          return el;
                        });
                      })()}
                    </svg>
                    <div className="text-sm font-mono font-black tracking-widest mt-1 text-slate-900">
                      {barcodeText}
                    </div>
                  </div>
                )}
                {showBranchQuota && (
                  <div className={showBarcodeBlock ? 'text-right' : 'text-left w-full'}>
                    <div className="text-sm font-black uppercase text-slate-900">{effectiveStore}</div>
                    <div className="text-xs text-slate-600">{quotaInfoLabel}</div>
                    <div className="text-xs font-mono text-slate-500">s.d. {activeCampaign.endDate}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PromoPosterStudioModal;
