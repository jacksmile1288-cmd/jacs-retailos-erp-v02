import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, CartItem, PaymentMethod, Terminal, PriceTier, CustomerMaster, CashierShift, PaymentPayload, User as UserType, ActiveNavModule } from '../../types';
import { getReactiveNeonGlowStyle } from '../../utils/neonGlow';
import { calculateMemberTierLevel, LOYALTY_THRESHOLDS } from '../../utils/loyaltyUtils';
import { FNB_PRODUCTS } from '../../data/fnbData';
import {
  filterProductsByTerminal,
  INDUSTRY_DEMO_CARTS,
  getTerminalIndustry,
  TerminalIndustry,
} from '../../data/industryTerminalProducts';
import { TerminalUnlockModal } from './TerminalUnlockModal';
import { FnbModifierModal } from './FnbModifierModal';
import { KotTicketModal } from './KotTicketModal';
import { HeldOrdersModal, HeldOrder } from './HeldOrdersModal';
import { HoldCartModal } from './HoldCartModal';
import { SupervisorVoidModal } from './SupervisorVoidModal';
import { QrisModal } from './QrisModal';
import { VirtualNumpad } from './VirtualNumpad';
import { ManualProductSearchModal } from './ManualProductSearchModal';
import { DiscountVoucherModal } from './DiscountVoucherModal';
import { EditCartItemModal } from './EditCartItemModal';
import { OpenShiftModal } from './OpenShiftModal';
import { CloseShiftModal } from './CloseShiftModal';
import { PettyCashModal } from './PettyCashModal';
import { ShiftSummaryReceiptModal } from './ShiftSummaryReceiptModal';
import { PaymentModal } from './PaymentModal';
import { triggerCashDrawer } from '../../utils/cashDrawerUtils';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  UserCheck,
  CreditCard,
  QrCode,
  Banknote,
  Building2,
  CheckCircle,
  Tag,
  Package,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  Percent,
  Barcode,
  Maximize2,
  Minimize2,
  Volume2,
  SlidersHorizontal,
  RotateCcw,
  ArrowLeft,
  ChevronRight,
  Clock,
  Printer,
  ChefHat,
  UtensilsCrossed,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ShoppingBag,
  Smartphone,
  X,
  Languages,
  LayoutGrid,
  FileSpreadsheet,
  Sun,
  Moon,
  Store,
  Monitor,
  Edit3,
  Wallet,
  Calculator,
  ChevronUp,
  ChevronDown,
  Pause,
  PauseCircle,
  Ban,
  Inbox,
  Truck,
  MapPin,
  User,
  Users,
  FileText,
  CheckCircle2,
  ArrowUpRight,
  LogOut,
  Wifi,
  WifiOff,
  RefreshCw,
  ShoppingCart,
  Pill,
  Shirt,
  Wrench,
  HardHat,
  Scissors,
  ArrowRight,
  LayoutDashboard,
  Boxes,
  Coins,
  Shield,
  KeyRound,
} from 'lucide-react';

const TERMINAL_BILINGUAL: Record<string, { en: string; id: string }> = {
  'T-01': { en: 'Retail & Wholesaler Modern', id: 'Retail & Wholesaler Modern' },
  'T-02': { en: 'Food & Beverage (F&B)', id: 'Food & Beverage (F&B)' },
  'T-03': { en: 'Pharmacy & Pet Shop', id: 'Pharmacy & Pet Shop' },
  'T-04': { en: 'Fashion & Apparel', id: 'Fashion & Apparel' },
  'T-05': { en: 'Building Materials & Hardware', id: 'Building Materials & Hardware' },
  'T-06': { en: 'Electronics & Gadgets', id: 'Electronics & Gadgets' },
  'T-07': { en: 'Automotive & Workshop', id: 'Automotive & Workshop' },
  'T-08': { en: 'Salon & Barbershop', id: 'Salon & Barbershop' },
  'T-09': { en: 'Building Materials & Hardware', id: 'Building Materials & Hardware' },
  'T-10': { en: 'Salon & Barbershop', id: 'Salon & Barbershop' },
};

const TERMINAL_TRANSLATIONS: Record<string, { businessModel: string; subLabel: string }> = {
  'T-01': { businessModel: 'Retail & Wholesaler Modern', subLabel: 'Master Data' },
  'T-02': { businessModel: 'Food & Beverage (F&B)', subLabel: 'Master Data' },
  'T-03': { businessModel: 'Pharmacy & Pet Shop', subLabel: 'Master Data' },
  'T-04': { businessModel: 'Fashion & Apparel', subLabel: 'Master Data' },
  'T-05': { businessModel: 'Building Materials & Hardware', subLabel: 'Master Data' },
  'T-06': { businessModel: 'Electronics & Gadgets', subLabel: 'Master Data' },
  'T-07': { businessModel: 'Automotive & Workshop', subLabel: 'Master Data' },
  'T-08': { businessModel: 'Salon & Barbershop', subLabel: 'Master Data' },
  'T-09': { businessModel: 'Building Materials & Hardware', subLabel: 'Master Data' },
  'T-10': { businessModel: 'Salon & Barbershop', subLabel: 'Master Data' },
};

interface PosTerminalCardTheme {
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  cardTitleId: string;
  cardTitleEn: string;
  subtitle: string;
  businessModel: string;
  descId: string;
  descEn: string;
  borderClass: string;
  buttonColor: string;
}

const POS_TERMINAL_CARD_THEMES: Record<string, PosTerminalCardTheme> = {
  'T-01': {
    emoji: '🛒',
    icon: ShoppingCart,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(Ritel & Grosir)',
    businessModel: 'Ritel & Grosir Modern',
    descId: 'Kasir ritel modern, toko kelontong, minimarket & grosir.',
    descEn: 'Modern retail checkout, grocery store & wholesale.',
    borderClass: 'border-cyan-500/40 hover:border-cyan-400',
    buttonColor: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
  },
  'T-02': {
    emoji: '🍳',
    icon: UtensilsCrossed,
    iconColor: 'text-amber-600 dark:text-amber-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(Makanan & Minuman)',
    businessModel: 'Makanan & Minuman (F&B)',
    descId: 'Loket kasir FnB / resto, cetak tiket dapur KOT & meja.',
    descEn: 'FnB & dining cashier, kitchen KOT tickets & table orders.',
    borderClass: 'border-amber-500/40 hover:border-amber-400',
    buttonColor: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
  },
  'T-03': {
    emoji: '💊🐾',
    icon: Pill,
    iconColor: 'text-rose-600 dark:text-rose-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(Farmasi & Toko Hewan)',
    businessModel: 'Farmasi & Toko Hewan',
    descId: 'Apotek, obat resep, pakan & vitamin kebutuhan hewan.',
    descEn: 'Pharmacy, prescription drugs, pet food & animal vitamins.',
    borderClass: 'border-rose-500/40 hover:border-rose-400',
    buttonColor: 'bg-rose-500 hover:bg-rose-400 text-white',
  },
  'T-04': {
    emoji: '👗',
    icon: Shirt,
    iconColor: 'text-fuchsia-600 dark:text-fuchsia-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(Fashion & Busana)',
    businessModel: 'Fashion & Busana',
    descId: 'Loket butik fashion, varian ukuran/warna & barcode.',
    descEn: 'Fashion boutique, color/size variants & barcode checkout.',
    borderClass: 'border-fuchsia-500/40 hover:border-fuchsia-400',
    buttonColor: 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white',
  },
  'T-05': {
    emoji: '🏗️',
    icon: HardHat,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(Bahan Bangunan & Perkakas)',
    businessModel: 'Bahan Bangunan & Perkakas',
    descId: 'Penjualan semen, cat, besi, alat teknik & material.',
    descEn: 'Cement, paint, steel, construction tools & materials.',
    borderClass: 'border-emerald-500/40 hover:border-emerald-400',
    buttonColor: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
  },
  'T-06': {
    emoji: '📱',
    icon: Smartphone,
    iconColor: 'text-violet-600 dark:text-violet-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(Elektronik & Gawai)',
    businessModel: 'Elektronik & Gawai',
    descId: 'Loket elektronik, scan nomor seri IMEI & kartu garansi.',
    descEn: 'Electronics checkout, IMEI/SN serial tracking & warranty.',
    borderClass: 'border-violet-500/40 hover:border-violet-400',
    buttonColor: 'bg-violet-500 hover:bg-violet-400 text-white',
  },
  'T-07': {
    emoji: '🔧',
    icon: Wrench,
    iconColor: 'text-orange-600 dark:text-orange-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(Bengkel & Otomotif)',
    businessModel: 'Bengkel & Otomotif',
    descId: 'Estimasi servis bengkel, suku cadang & mekanik.',
    descEn: 'Workshop service estimates, spare parts & mechanics.',
    borderClass: 'border-orange-500/40 hover:border-orange-400',
    buttonColor: 'bg-orange-500 hover:bg-orange-400 text-white',
  },
  'T-08': {
    emoji: '💈',
    icon: Scissors,
    iconColor: 'text-teal-600 dark:text-teal-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(Salon & Barbershop)',
    businessModel: 'Salon & Barbershop',
    descId: 'Layanan potong rambut, komisi kapster & perawatan.',
    descEn: 'Haircuts, queue, barber stylists & grooming products.',
    borderClass: 'border-teal-500/40 hover:border-teal-400',
    buttonColor: 'bg-teal-500 hover:bg-teal-400 text-slate-950',
  },
  'T-09': {
    emoji: '🏗️',
    icon: HardHat,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(Bahan Bangunan & Perkakas)',
    businessModel: 'Bahan Bangunan & Perkakas',
    descId: 'Penjualan semen, cat, besi, alat teknik & material.',
    descEn: 'Cement, paint, steel, construction tools & materials.',
    borderClass: 'border-emerald-500/40 hover:border-emerald-400',
    buttonColor: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
  },
  'T-10': {
    emoji: '💈',
    icon: Scissors,
    iconColor: 'text-teal-600 dark:text-teal-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(Salon & Barbershop)',
    businessModel: 'Salon & Barbershop',
    descId: 'Layanan potong rambut, komisi kapster & perawatan.',
    descEn: 'Haircuts, queue, barber stylists & grooming products.',
    borderClass: 'border-teal-500/40 hover:border-teal-400',
    buttonColor: 'bg-teal-500 hover:bg-teal-400 text-slate-950',
  },
};

const INDUSTRY_CLONE_TEMPLATES: Record<TerminalIndustry, {
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  cardTitleId: string;
  cardTitleEn: string;
  subtitle: string;
  businessModel: string;
  modelType: Terminal['modelType'];
  location: string;
  descId: string;
  descEn: string;
  borderClass: string;
  buttonColor: string;
  colorHex: string;
  neonBorderClass: string;
  neonBgClass: string;
  neonTextClass: string;
}> = {
  retail: {
    emoji: '🛒',
    icon: ShoppingCart,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(retail & wholesaler)',
    businessModel: 'Retail & Wholesaler Modern',
    modelType: 'retail',
    location: 'Modern Retail & Wholesale',
    descId: 'Kasir ritel modern, toko kelontong, minimarket & grosir.',
    descEn: 'Modern retail checkout, grocery store & wholesale.',
    borderClass: 'border-cyan-500/40 hover:border-cyan-400',
    buttonColor: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
    colorHex: '#00F0FF',
    neonBorderClass: 'border-cyan-500/40',
    neonBgClass: 'bg-cyan-500/10',
    neonTextClass: 'text-cyan-400',
  },
  fnb: {
    emoji: '🍳',
    icon: UtensilsCrossed,
    iconColor: 'text-amber-600 dark:text-amber-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(food & beverage)',
    businessModel: 'Food & Beverage (F&B)',
    modelType: 'fnb',
    location: 'Dining & Kitchen',
    descId: 'Loket kasir FnB / resto, cetak tiket dapur KOT & meja.',
    descEn: 'FnB & dining cashier, kitchen KOT tickets & table orders.',
    borderClass: 'border-amber-500/40 hover:border-amber-400',
    buttonColor: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    colorHex: '#F59E0B',
    neonBorderClass: 'border-amber-500/40',
    neonBgClass: 'bg-amber-500/10',
    neonTextClass: 'text-amber-400',
  },
  pharmacy: {
    emoji: '💊🐾',
    icon: Pill,
    iconColor: 'text-rose-600 dark:text-rose-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(pharmacy & pet shop)',
    businessModel: 'Pharmacy & Pet Shop',
    modelType: 'pharmacy',
    location: 'Dispensary & Pet Store',
    descId: 'Apotek, obat resep, pakan & vitamin kebutuhan hewan.',
    descEn: 'Pharmacy, prescription drugs, pet food & animal vitamins.',
    borderClass: 'border-rose-500/40 hover:border-rose-400',
    buttonColor: 'bg-rose-500 hover:bg-rose-400 text-white',
    colorHex: '#F43F5E',
    neonBorderClass: 'border-rose-500/40',
    neonBgClass: 'bg-rose-500/10',
    neonTextClass: 'text-rose-400',
  },
  fashion: {
    emoji: '👗',
    icon: Shirt,
    iconColor: 'text-fuchsia-600 dark:text-fuchsia-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(fashion & apparel)',
    businessModel: 'Fashion & Apparel',
    modelType: 'fashion',
    location: 'Boutique & Wardrobe',
    descId: 'Loket butik fashion, varian ukuran/warna & barcode.',
    descEn: 'Fashion boutique, color/size variants & barcode checkout.',
    borderClass: 'border-fuchsia-500/40 hover:border-fuchsia-400',
    buttonColor: 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white',
    colorHex: '#D946EF',
    neonBorderClass: 'border-fuchsia-500/40',
    neonBgClass: 'bg-fuchsia-500/10',
    neonTextClass: 'text-fuchsia-400',
  },
  building: {
    emoji: '🏗️',
    icon: HardHat,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(building materials & hardware)',
    businessModel: 'Building Materials & Hardware',
    modelType: 'building',
    location: 'Depo Bahan Bangunan',
    descId: 'Penjualan semen, cat, besi, alat teknik & material.',
    descEn: 'Cement, paint, steel, construction tools & materials.',
    borderClass: 'border-emerald-500/40 hover:border-emerald-400',
    buttonColor: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
    colorHex: '#10B981',
    neonBorderClass: 'border-emerald-500/40',
    neonBgClass: 'bg-emerald-500/10',
    neonTextClass: 'text-emerald-400',
  },
  electronics: {
    emoji: '📱',
    icon: Smartphone,
    iconColor: 'text-violet-600 dark:text-violet-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(electronics & gadgets)',
    businessModel: 'Electronics & Gadgets',
    modelType: 'electronics',
    location: 'Gadget & Tech Store',
    descId: 'Loket elektronik, scan nomor seri IMEI & kartu garansi.',
    descEn: 'Electronics checkout, IMEI/SN serial tracking & warranty.',
    borderClass: 'border-violet-500/40 hover:border-violet-400',
    buttonColor: 'bg-violet-500 hover:bg-violet-400 text-white',
    colorHex: '#8B5CF6',
    neonBorderClass: 'border-violet-500/40',
    neonBgClass: 'bg-violet-500/10',
    neonTextClass: 'text-violet-400',
  },
  workshop: {
    emoji: '🔧',
    icon: Wrench,
    iconColor: 'text-orange-600 dark:text-orange-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(automotive & workshop)',
    businessModel: 'Automotive & Workshop',
    modelType: 'workshop',
    location: 'Service Bay & Workshop',
    descId: 'Estimasi servis bengkel, suku cadang & mekanik.',
    descEn: 'Workshop service estimates, spare parts & mechanics.',
    borderClass: 'border-orange-500/40 hover:border-orange-400',
    buttonColor: 'bg-orange-500 hover:bg-orange-400 text-white',
    colorHex: '#F97316',
    neonBorderClass: 'border-orange-500/40',
    neonBgClass: 'bg-orange-500/10',
    neonTextClass: 'text-orange-400',
  },
  salon: {
    emoji: '💈',
    icon: Scissors,
    iconColor: 'text-teal-600 dark:text-teal-400',
    cardTitleId: 'JacS Kasir',
    cardTitleEn: 'Cashier JacS',
    subtitle: '(salon & barbershop)',
    businessModel: 'Salon & Barbershop',
    modelType: 'salon',
    location: 'Beauty & Grooming Station',
    descId: 'Layanan potong rambut, komisi kapster & perawatan.',
    descEn: 'Haircuts, queue, barber stylists & grooming products.',
    borderClass: 'border-teal-500/40 hover:border-teal-400',
    buttonColor: 'bg-teal-500 hover:bg-teal-400 text-slate-950',
    colorHex: '#14B8A6',
    neonBorderClass: 'border-teal-500/40',
    neonBgClass: 'bg-teal-500/10',
    neonTextClass: 'text-teal-400',
  },
};

interface CashierSlotAccent {
  borderClass: string;
  glowClass: string;
  bgClassLight: string;
  bgClassDark: string;
  iconBgLight: string;
  iconBgDark: string;
  iconBorder: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  buttonColor: string;
  ringClass: string;
}

const CASHIER_SLOT_ACCENTS: CashierSlotAccent[] = [
  // Slot 0 -> KASIR 01: Cyan / Biru Ritel
  {
    borderClass: 'border-cyan-500 hover:border-cyan-400',
    glowClass: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.35)]',
    bgClassLight: 'bg-gradient-to-b from-cyan-50/70 to-white',
    bgClassDark: 'bg-gradient-to-b from-cyan-950/20 to-[#0d1527]',
    iconBgLight: 'bg-cyan-100/80',
    iconBgDark: 'bg-cyan-950/60',
    iconBorder: 'border-cyan-500/50',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    badgeBorder: 'border-cyan-500/30',
    buttonColor: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]',
    ringClass: 'ring-2 ring-cyan-400',
  },
  // Slot 1 -> KASIR 02: Amber / Emas (Hybrid Back-End)
  {
    borderClass: 'border-amber-500 hover:border-amber-400',
    glowClass: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.35)]',
    bgClassLight: 'bg-gradient-to-b from-amber-50/70 to-white',
    bgClassDark: 'bg-gradient-to-b from-amber-950/20 to-[#0d1527]',
    iconBgLight: 'bg-amber-100/80',
    iconBgDark: 'bg-amber-950/60',
    iconBorder: 'border-amber-500/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-500/30',
    buttonColor: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
    ringClass: 'ring-2 ring-amber-400',
  },
  // Slot 2 -> KASIR 03: Emerald / Hijau
  {
    borderClass: 'border-emerald-500 hover:border-emerald-400',
    glowClass: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]',
    bgClassLight: 'bg-gradient-to-b from-emerald-50/70 to-white',
    bgClassDark: 'bg-gradient-to-b from-emerald-950/20 to-[#0d1527]',
    iconBgLight: 'bg-emerald-100/80',
    iconBgDark: 'bg-emerald-950/60',
    iconBorder: 'border-emerald-500/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-500/30',
    buttonColor: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]',
    ringClass: 'ring-2 ring-emerald-400',
  },
  // Slot 3 -> KASIR 04: Purple / Violet
  {
    borderClass: 'border-purple-500 hover:border-purple-400',
    glowClass: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.35)]',
    bgClassLight: 'bg-gradient-to-b from-purple-50/70 to-white',
    bgClassDark: 'bg-gradient-to-b from-purple-950/20 to-[#0d1527]',
    iconBgLight: 'bg-purple-100/80',
    iconBgDark: 'bg-purple-950/60',
    iconBorder: 'border-purple-500/50',
    iconColor: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-500/30',
    buttonColor: 'bg-purple-500 hover:bg-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]',
    ringClass: 'ring-2 ring-purple-400',
  },
  // Slot 4 -> KASIR 05: Rose
  {
    borderClass: 'border-rose-500 hover:border-rose-400',
    glowClass: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.35)]',
    bgClassLight: 'bg-gradient-to-b from-rose-50/70 to-white',
    bgClassDark: 'bg-gradient-to-b from-rose-950/20 to-[#0d1527]',
    iconBgLight: 'bg-rose-100/80',
    iconBgDark: 'bg-rose-950/60',
    iconBorder: 'border-rose-500/50',
    iconColor: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-500/30',
    buttonColor: 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]',
    ringClass: 'ring-2 ring-rose-400',
  },
  // Slot 5 -> KASIR 06: Blue / Indigo
  {
    borderClass: 'border-blue-500 hover:border-blue-400',
    glowClass: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]',
    bgClassLight: 'bg-gradient-to-b from-blue-50/70 to-white',
    bgClassDark: 'bg-gradient-to-b from-blue-950/20 to-[#0d1527]',
    iconBgLight: 'bg-blue-100/80',
    iconBgDark: 'bg-blue-950/60',
    iconBorder: 'border-blue-500/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-500/30',
    buttonColor: 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]',
    ringClass: 'ring-2 ring-blue-400',
  },
  // Slot 6 -> KASIR 07: Orange
  {
    borderClass: 'border-orange-500 hover:border-orange-400',
    glowClass: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.35)]',
    bgClassLight: 'bg-gradient-to-b from-orange-50/70 to-white',
    bgClassDark: 'bg-gradient-to-b from-orange-950/20 to-[#0d1527]',
    iconBgLight: 'bg-orange-100/80',
    iconBgDark: 'bg-orange-950/60',
    iconBorder: 'border-orange-500/50',
    iconColor: 'text-orange-600 dark:text-orange-400',
    badgeBg: 'bg-orange-500/15',
    badgeText: 'text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-500/30',
    buttonColor: 'bg-orange-500 hover:bg-orange-400 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]',
    ringClass: 'ring-2 ring-orange-400',
  },
  // Slot 7 -> KASIR 08: Indigo
  {
    borderClass: 'border-indigo-500 hover:border-indigo-400',
    glowClass: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.35)]',
    bgClassLight: 'bg-gradient-to-b from-indigo-50/70 to-white',
    bgClassDark: 'bg-gradient-to-b from-indigo-950/20 to-[#0d1527]',
    iconBgLight: 'bg-indigo-100/80',
    iconBgDark: 'bg-indigo-950/60',
    iconBorder: 'border-indigo-500/50',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-500/15',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-500/30',
    buttonColor: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]',
    ringClass: 'ring-2 ring-indigo-400',
  },
  // Slot 8 -> KASIR 09: Teal
  {
    borderClass: 'border-teal-500 hover:border-teal-400',
    glowClass: 'hover:shadow-[0_0_20px_rgba(20,184,166,0.35)]',
    bgClassLight: 'bg-gradient-to-b from-teal-50/70 to-white',
    bgClassDark: 'bg-gradient-to-b from-teal-950/20 to-[#0d1527]',
    iconBgLight: 'bg-teal-100/80',
    iconBgDark: 'bg-teal-950/60',
    iconBorder: 'border-teal-500/50',
    iconColor: 'text-teal-600 dark:text-teal-400',
    badgeBg: 'bg-teal-500/15',
    badgeText: 'text-teal-700 dark:text-teal-300',
    badgeBorder: 'border-teal-500/30',
    buttonColor: 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-[0_0_12px_rgba(20,184,166,0.4)]',
    ringClass: 'ring-2 ring-teal-400',
  },
  // Slot 9 -> KASIR 10: Pink
  {
    borderClass: 'border-pink-500 hover:border-pink-400',
    glowClass: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.35)]',
    bgClassLight: 'bg-gradient-to-b from-pink-50/70 to-white',
    bgClassDark: 'bg-gradient-to-b from-pink-950/20 to-[#0d1527]',
    iconBgLight: 'bg-pink-100/80',
    iconBgDark: 'bg-pink-950/60',
    iconBorder: 'border-pink-500/50',
    iconColor: 'text-pink-600 dark:text-pink-400',
    badgeBg: 'bg-pink-500/15',
    badgeText: 'text-pink-700 dark:text-pink-300',
    badgeBorder: 'border-pink-500/30',
    buttonColor: 'bg-pink-500 hover:bg-pink-400 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]',
    ringClass: 'ring-2 ring-pink-400',
  },
];

export const PosModule: React.FC = () => {
  const {
    terminals,
    activeTerminal,
    setActiveTerminal,
    addTerminal,
    toggleTerminalLock,
    setAllTerminalsLock,
    activeUser,
    currentUser,
    setCurrentUser,
    setActiveUser,
    isSuperAdminAuthenticated,
    openPinAuth,
    products,
    customers,
    setCustomers,
    processSale,
    processPayment,
    sales,
    showReceipt,
    closeReceipt,
    isReceiptModalOpen,
    showToast,
    theme,
    toggleTheme,
    isCashierWorkspaceActive,
    setIsCashierWorkspaceActive,
    addAuditLog,
    users,
    language: globalLanguage,
    setLanguage: setGlobalLanguage,
    // POS Cashier Shift & Cash Reconciliation (APS POS4: 32_ShiftKasir)
    activeShift,
    shiftsHistory,
    openCashierShift,
    recordShiftExpense,
    closeCashierShift,
    businessProfile,
    setActiveNav,
    updateBusinessProfile,
    isOnline,
    offlineQueue,
    syncOfflineQueue,
    syncOfflineTransactions,
  } = useApp();

  const isEn = globalLanguage === 'en';
  const language: 'ID' | 'EN' = isEn ? 'EN' : 'ID';
  const isSuperAdmin = Boolean(
    isSuperAdminAuthenticated || activeUser?.role === 'Super Admin'
  );

  // Fullscreen & Register State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [hoveredTerminalId, setHoveredTerminalId] = useState<string | null>(null);

  // Akses Menu ERP / Back-End Khusus KASIR 02 (Hybrid)
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

  // State Verifikasi PIN Akses Backend / Menu ERP untuk Kasir 02 Hybrid
  const [isHybridPinModalOpen, setIsHybridPinModalOpen] = useState(false);
  const [pendingHybridModule, setPendingHybridModule] = useState<{ id: ActiveNavModule; label: string } | null>(null);
  const [hybridPinInput, setHybridPinInput] = useState('');
  const [hybridPinError, setHybridPinError] = useState<string | null>(null);

  const handleRequestHybridNavigation = (mod: { id: ActiveNavModule; label: string }) => {
    setPendingHybridModule(mod);
    setHybridPinInput('');
    setHybridPinError(null);
    setIsHybridMenuOpen(false);
    setIsHybridPinModalOpen(true);
  };

  const handleVerifyHybridPin = (pinToTest?: string) => {
    const pin = pinToTest !== undefined ? pinToTest : hybridPinInput;
    if (!pin || pin.length < 4) {
      setHybridPinError('PIN minimal 4 digit.');
      return;
    }

    // Otorisasi PIN: PIN khusus Kasir 02 ('2222'), default PIN ('1234'), Master Admin ('9999'), atau PIN user yang sedang aktif
    const validPins = [
      '2222',
      '1234',
      '9999',
      activeUser?.pin,
      currentUser?.pin,
      ...(users || []).map((u) => u.pin).filter(Boolean),
    ].filter(Boolean);

    const isMatch = validPins.includes(pin);

    if (isMatch) {
      const target = pendingHybridModule;
      setIsHybridPinModalOpen(false);
      setHybridPinInput('');
      setHybridPinError(null);

      if (target) {
        setIsCashierWorkspaceActive(false);
        setActiveNav(target.id);
        showToast(`PIN terverifikasi! Mengalihkan ke modul ${target.label}...`);
      }
    } else {
      setHybridPinError('PIN Salah! Gunakan PIN Kasir 02 (2222) atau PIN Admin (1234 / 9999)');
      setHybridPinInput('');
    }
  };

  // POS Cashier Shift & Cash Reconciliation States (APS POS4: 32_ShiftKasir)
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [isPettyCashModalOpen, setIsPettyCashModalOpen] = useState(false);
  const [closedShiftForReceipt, setClosedShiftForReceipt] = useState<CashierShift | null>(null);

  // Sync fullscreen cashier workspace state with global App context (auto-collapse sidebar)
  useEffect(() => {
    setIsCashierWorkspaceActive(isRegisterOpen);
    if (!isRegisterOpen && activeUser?.role === 'Kasir') {
      setActiveUser(null);
      setCurrentUser(null);
    }
    return () => {
      setIsCashierWorkspaceActive(false);
    };
  }, [isRegisterOpen, setIsCashierWorkspaceActive]);

  // Realtime clock (updates every second)
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentTime(`${dateStr}, ${timeStr}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Category filter dropdown for POS register
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Toggle 'Semua Kategori': default false (hanya menampilkan kategori spesifik industri terminal aktif)
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);

  // Mode View: true = Foto Menu F&B, false = Grid Transaksi SKU Layar Lebar
  const [isFnbPhotoMenuMode, setIsFnbPhotoMenuMode] = useState<boolean>(false);

  // Search & Barcode Input
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);
  const [isCashUnderpaid, setIsCashUnderpaid] = useState<boolean>(false);

  // Helper untuk autofocus & siklus kursor scan barcode [F2]
  const focusBarcodeInput = () => {
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
        barcodeInputRef.current.select();
      }
    }, 25);
  };

  // Helper untuk autofocus & seleksi input nominal Diterima
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

  // Transaksi Demo / Dummy Kasir Resmi Terpusat (Berdasarkan Industri Terminal)
  const PHARMACY_DEMO_CART: CartItem[] = INDUSTRY_DEMO_CARTS.pharmacy;
  const ELECTRONICS_DEMO_CART: CartItem[] = INDUSTRY_DEMO_CARTS.electronics;
  const WORKSHOP_DEMO_CART: CartItem[] = INDUSTRY_DEMO_CARTS.workshop;

  // Preset Armada Standar untuk Material Curah (Pasir, Batu, Split, Tanah)
  const DEFAULT_FLEET_OPTIONS = [
    { id: 'PICKUP_RET', name: 'Ret Pick-up (±1.2 m³)', shortName: 'Ret Pick-up', volumeM3: 1.2, suffix: '-PKP', price: 350000, isActive: true },
    { id: 'TRUCK_ENGKEL', name: 'Ret Truk Engkel (±3.0 m³)', shortName: 'Ret Truk Engkel', volumeM3: 3.0, suffix: '-ENG', price: 850000, isActive: true },
    { id: 'DUMP_TRUCK', name: 'Ret Dump Truck Besar (±6.5 m³)', shortName: 'Dump Truck', volumeM3: 6.5, suffix: '-TRK', price: 1800000, isActive: true },
    { id: 'SAK_KARUNG', name: 'Eceran Karung / Sak (±0.03 m³)', shortName: 'Sak / Karung', volumeM3: 0.03, suffix: '-SAK', price: 18000, isActive: true },
  ];

  // Transaksi Demo Depo Bahan Bangunan (KASIR 09)
  const BUILDING_DEMO_CART: CartItem[] = INDUSTRY_DEMO_CARTS.building;

  // Cart & Pricing State - Terisi default transaksi contoh kasir sesuai industri terminal aktif
  const [cart, setCart] = useState<CartItem[]>(() => {
    const ind = getTerminalIndustry(activeTerminal);
    return INDUSTRY_DEMO_CARTS[ind] || INDUSTRY_DEMO_CARTS.retail;
  });
  // Panel Pengiriman Material Bangunan (Bawa Langsung vs Armada Toko DO)
  const [deliveryMethod, setDeliveryMethod] = useState<'DIRECT' | 'FLEET_DELIVERY'>('DIRECT');

  // Info Kendaraan & Mekanik KASIR 08 (Auto Workshop & Service)
  const [workshopPlateNumber, setWorkshopPlateNumber] = useState<string>('DD 4589 XY');
  const [workshopMechanic, setWorkshopMechanic] = useState<string>('Rudi');

  // Modal Penugasan Armada & Surat Jalan (DO)
  const [isDoModalOpen, setIsDoModalOpen] = useState<boolean>(false);
  const [isPreviewDoOpen, setIsPreviewDoOpen] = useState<boolean>(false);
  const [doDriverName, setDoDriverName] = useState<string>('Pak Joko (Driver Toko)');
  const [doVehiclePlate, setDoVehiclePlate] = useState<string>('B 9281 KBC (Truk Engkel)');
  const [doProjectAddress, setDoProjectAddress] = useState<string>('Proyek Ruko Sentosa Blok C4, Jl. Pemuda No. 88');
  const [doForemanName, setDoForemanName] = useState<string>('Mandor Yanto (0812-9988-7766)');
  const [doDeliveryTime, setDoDeliveryTime] = useState<string>('14:30 WIB');
  const [doNotes, setDoNotes] = useState<string>('Jalan cor beton, siap bongkar kuli di depan bedeng mandor.');
  const [lastCompletedDoItems, setLastCompletedDoItems] = useState<CartItem[]>([]);
  const [lastDoReceiptNumber, setLastDoReceiptNumber] = useState<string>('');
  // Fast Cart Keyboard Navigation & Selection State ([ArrowUp]/[ArrowDown], [Del], [+/-])
  const [selectedCartIndex, setSelectedCartIndex] = useState<number | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'IDR' | 'PERCENT'>('IDR');
  const [isTaxIncluded, setIsTaxIncluded] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashGiven, setCashGiven] = useState<number>(0);

  // Keep selectedCartIndex within valid bounds when cart size changes
  useEffect(() => {
    if (cart.length === 0) {
      setSelectedCartIndex(null);
    } else if (selectedCartIndex !== null && selectedCartIndex >= cart.length) {
      setSelectedCartIndex(cart.length - 1);
    }
  }, [cart.length]);

  // 3-Tier Price Matrix & Customer Selection State
  const [selectedPriceTier, setSelectedPriceTier] = useState<PriceTier>('RETAIL');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMaster | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);
  const [isCartCustomerDropdownOpen, setIsCartCustomerDropdownOpen] = useState<boolean>(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');
  const [newCustomerNotes, setNewCustomerNotes] = useState<string>('');
  const [newCustomerHasStore, setNewCustomerHasStore] = useState<boolean>(false);
  const [newCustomerStoreName, setNewCustomerStoreName] = useState<string>('');
  const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState<boolean>(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const cartCustomerDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-Reset Transaction Helper (Pencegahan Salah Pelanggan & Netralisasi Tier)
  const resetToNewTransaction = () => {
    setCart([]);
    setSelectedCartIndex(null);
    setDiscountAmount(0);
    setDiscountPercent(0);
    setCashGiven(0);
    setIsCashUnderpaid(false);
    setSelectedCustomer(null);
    setSelectedPriceTier('RETAIL');
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(false);
    setIsCartCustomerDropdownOpen(false);
    const isKasir02Active = activeTerminal?.code === 'KASIR-02' || activeTerminal?.name === 'KASIR 02';
    setReceiptNumber(isKasir02Active ? `TRX-KASIR02-${Date.now().toString().slice(-6)}` : `TRX-POS-${Date.now().toString().slice(-6)}`);
    focusBarcodeInput();
  };

  // Watch receipt modal close: auto-reset transaction so previous member data does not leak into next queue
  const prevReceiptOpenRef = useRef<boolean>(isReceiptModalOpen);
  useEffect(() => {
    if (prevReceiptOpenRef.current && !isReceiptModalOpen) {
      resetToNewTransaction();
      focusBarcodeInput();
    }
    prevReceiptOpenRef.current = isReceiptModalOpen;
  }, [isReceiptModalOpen]);

  // Autofocus input scan barcode [F2] saat halaman pertama kali dibuka / kasir aktif
  useEffect(() => {
    focusBarcodeInput();
  }, [isRegisterOpen]);

  // Close customer dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(targetNode)
      ) {
        setIsCustomerDropdownOpen(false);
      }
      if (
        cartCustomerDropdownRef.current &&
        !cartCustomerDropdownRef.current.contains(targetNode)
      ) {
        setIsCartCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Multi-tier entitlement calculation helper with store qualification
  // Tombol [ Grosir / Partai ] HANYA dapat diakses jika pelanggan terdaftar memiliki atribut has_store === true.
  // Member perorangan (meskipun level Platinum) tetap diarahkan ke tier [ Langganan / Member ]
  // dan tidak dapat mengakses harga Grosir jika tidak terverifikasi memiliki toko.
  const getCustomerAllowedTiers = (customer: CustomerMaster | null): PriceTier[] => {
    if (!customer) {
      // Pelanggan Umum / Tentatif (Non-Member): strictly RETAIL
      return ['RETAIL'];
    }
    if (customer.has_store) {
      return ['RETAIL', 'MEMBER', 'WHOLESALE'];
    }
    return ['RETAIL', 'MEMBER'];
  };

  const allowedTiers = useMemo(() => getCustomerAllowedTiers(selectedCustomer), [selectedCustomer]);

  // Normalize phone number for rapid matching (0812..., 62812..., +62812...)
  const normalizePhone = (phoneStr: string): string => {
    if (!phoneStr) return '';
    return phoneStr.replace(/\D/g, '').replace(/^62/, '0');
  };

  // Fast customer search and auto-detect upon full phone number or barcode scan
  const handleCustomerSearchChange = (query: string) => {
    setCustomerSearchQuery(query);
    setIsCustomerDropdownOpen(true);

    if (!query.trim()) return;

    const normQuery = normalizePhone(query);
    const cleanCode = query.trim().toLowerCase();

    // Fast matching logic:
    // 1. Phone matching: length >= 9 digits and matches normalized phone
    // 2. Barcode / Member Code / Customer Code match
    // 3. Store name exact match
    const matched = customers.find((c) => {
      const normCustPhone = normalizePhone(c.phone);
      const isPhoneMatch = normQuery.length >= 9 && normCustPhone === normQuery;
      const codeStr = (c.code || c.customer_code || '').toLowerCase();
      const idStr = (c.id || '').toLowerCase();
      const isCodeMatch =
        cleanCode.length >= 3 &&
        (codeStr === cleanCode || idStr === cleanCode);
      return isPhoneMatch || isCodeMatch;
    });

    if (matched) {
      handleSelectCustomer(matched);
      try {
        playScannerBeep();
      } catch {
        // audio fail-safe
      }
    }
  };

  // Filtered customer list for realtime search dropdown
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

  // Price tier resolution helper
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

  // Switch tier and automatically recalculate unit price for all items currently in cart
  const handleSelectPriceTier = (newTier: PriceTier) => {
    setSelectedPriceTier(newTier);
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (!item?.product) return item;
        const originalProduct =
          products.find((p) => p.id === item.product.id) ||
          products.find((p) => (p.name || '').toLowerCase() === (item.product.name || '').toLowerCase()) ||
          item.product;
        const newUnitPrice = getProductPriceByTier(originalProduct, newTier);
        const effectivePrice = Math.max(0, newUnitPrice - (item.itemDiscount || 0));
        return {
          ...item,
          product: {
            ...item.product,
            sell_price: newUnitPrice,
          },
          subtotal: effectivePrice * item.quantity,
        };
      })
    );
    showToast(`Tingkat harga beralih ke: ${getTierLabel(newTier)}`);
  };

  const handleSelectCustomer = (customer: CustomerMaster | null) => {
    if (!customer) {
      handleClearCustomer();
      return;
    }
    setSelectedCustomer(customer);
    setIsCustomerDropdownOpen(false);
    setIsCartCustomerDropdownOpen(false);
    setCustomerSearchQuery('');

    const rawTier = (customer.memberTier || customer.tier_level || '').toUpperCase();
    const hasStore = Boolean(customer.has_store || customer.store_name);
    const pts = (customer.points ?? 0).toLocaleString('id-ID');

    // Terapkan otomatis Tier Harga pelanggan (Retail, Member, atau Grosir) ke keranjang
    if (rawTier.includes('GROSIR') || rawTier.includes('WHOLESALE') || hasStore) {
      handleSelectPriceTier('WHOLESALE');
      showToast(
        language === 'ID'
          ? `Mitra Grosir: ${customer.name} (${customer.store_name || 'Toko Mitra'}) • ${pts} Pts (Harga Grosir Aktif)`
          : `Wholesale Partner: ${customer.name} • ${pts} Pts (Wholesale Price Active)`
      );
    } else if (rawTier.includes('RETAIL') || rawTier === 'REGULER') {
      handleSelectPriceTier('RETAIL');
      showToast(
        language === 'ID'
          ? `Pelanggan: ${customer.name} • ${pts} Pts (Harga Retail Aktif)`
          : `Customer: ${customer.name} • ${pts} Pts (Retail Price Active)`
      );
    } else {
      handleSelectPriceTier('MEMBER');
      showToast(
        language === 'ID'
          ? `Member: ${customer.name} • ${pts} Pts (Harga Member Aktif)`
          : `Member: ${customer.name} • ${pts} Pts (Member Price Active)`
      );
    }
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    handleSelectPriceTier('RETAIL');
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(false);
    setIsCartCustomerDropdownOpen(false);
    showToast(
      language === 'ID'
        ? 'Dilepas: Kembali ke Pelanggan Umum / Walk-in (Tier Retail Aktif)'
        : 'Detached: Reverted to Walk-in Guest (Retail Tier Active)'
    );
  };

  const handleCreateNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      showToast('Nama lengkap pelanggan wajib diisi!');
      return;
    }
    if (!newCustomerPhone.trim()) {
      showToast('Nomor HP / WhatsApp wajib diisi!');
      return;
    }
    if (newCustomerHasStore && !newCustomerStoreName.trim()) {
      showToast(
        language === 'ID'
          ? 'Nama toko / usaha wajib diisi untuk mitra grosir!'
          : 'Store / business name is required for wholesale partner!'
      );
      return;
    }

    const tiers: PriceTier[] = newCustomerHasStore
      ? ['RETAIL', 'MEMBER', 'WHOLESALE']
      : ['RETAIL', 'MEMBER'];

    const created: CustomerMaster = {
      id: `MBR-${String(customers.length + 1).padStart(3, '0')}`,
      code: newCustomerHasStore
        ? `STR-${Math.floor(1000 + Math.random() * 9000)}`
        : `SLV-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      email: `${newCustomerPhone.replace(/\D/g, '')}@member.jacs`,
      memberTier: 'Silver',
      tier_level: 'Silver',
      allowed_tiers: tiers,
      total_spending_current_period: 0,
      totalSpent: 0,
      points: 0,
      status: 'Active',
      notes: newCustomerNotes.trim() || undefined,
      has_store: newCustomerHasStore,
      store_name: newCustomerHasStore ? newCustomerStoreName.trim() : undefined,
    };

    setCustomers((prev) => [created, ...prev]);
    setSelectedCustomer(created);

    addAuditLog(
      `Registrasi Member Baru POS "${created.name}" (${created.phone}) • Tier: ${created.memberTier}${newCustomerHasStore ? `, Toko: ${created.store_name}` : ''}`,
      'Customer Loyalty',
      'INFO'
    );

    if (newCustomerHasStore) {
      handleSelectPriceTier('WHOLESALE');
      showToast(
        language === 'ID'
          ? `Mitra Toko "${created.name} • Toko: ${created.store_name}" terdaftar & harga Grosir aktif!`
          : `Store Partner "${created.name} • Store: ${created.store_name}" registered & Wholesale price active!`
      );
    } else {
      handleSelectPriceTier('MEMBER');
      showToast(
        language === 'ID'
          ? `Member baru "${created.name} • Silver" berhasil didaftarkan & aktif dengan harga Langganan!`
          : `New member "${created.name} • Silver" registered & activated with Member pricing!`
      );
    }

    setIsNewCustomerModalOpen(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerNotes('');
    setNewCustomerHasStore(false);
    setNewCustomerStoreName('');
  };

  // Sinkronkan filter 'Semua Kategori' dengan pengaturan hak akses terminal aktif (Super Admin)
  useEffect(() => {
    setShowAllCategories(Boolean(activeTerminal?.allowAllCategories));
  }, [activeTerminal?.id, activeTerminal?.name, activeTerminal?.allowAllCategories]);

  // Filter active products for POS Kasir:
  // Default: HANYA menampilkan produk yang sesuai dengan industri kasir yang sedang dibuka:
  // - KASIR 02 (F&B): Makanan, Minuman, Snack
  // - KASIR 04 (Pharmacy): Obat, Vitamin, Alkes
  // - KASIR 09 (Building): Material, Cat, Perkakas Bangunan
  // - Kasir 01/03/06/10: Seluruh Ritel Umum
  // Jika toggle 'Semua Kategori' aktif: membuka seluruh katalog produk.
  // Proteksi ketat: item bertipe 'RAW_MATERIAL' atau bahan mentah DILARANG muncul di katalog kasir.
  const activeProducts = useMemo(() => {
    return filterProductsByTerminal(products, activeTerminal, showAllCategories);
  }, [products, activeTerminal, showAllCategories]);

  // Editing cart item state
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Muat Transaksi Demo / Dummy Kasir Resmi sesuai industri register yang aktif (Minimal 5 Produk per Industri)
  useEffect(() => {
    setCart((prev) => {
      if (prev.length > 0) return prev;
      const ind = getTerminalIndustry(activeTerminal);
      return INDUSTRY_DEMO_CARTS[ind] || INDUSTRY_DEMO_CARTS.retail;
    });
  }, [activeTerminal?.name, activeTerminal?.id, activeTerminal?.modelType]);

  useEffect(() => {
    if (isRegisterOpen) {
      setCart((prev) => {
        if (prev.length > 0) return prev;
        const ind = getTerminalIndustry(activeTerminal);
        return INDUSTRY_DEMO_CARTS[ind] || INDUSTRY_DEMO_CARTS.retail;
      });
    }
  }, [isRegisterOpen, activeTerminal?.id, activeTerminal?.name, activeTerminal?.modelType]);

  // Receipt Number
  const [receiptNumber, setReceiptNumber] = useState<string>(
    () => `TRX-POS-${Date.now().toString().slice(-6)}`
  );

  // Modals
  const [terminalToUnlock, setTerminalToUnlock] = useState<Terminal | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  const [selectedFnbProduct, setSelectedFnbProduct] = useState<Product | null>(null);
  const [isFnbModalOpen, setIsFnbModalOpen] = useState(false);
  const [isKotModalOpen, setIsKotModalOpen] = useState(false);
  const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false);
  const [isHoldCartModalOpen, setIsHoldCartModalOpen] = useState(false);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => {
    try {
      const saved = localStorage.getItem('jacs_pos_held_orders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('jacs_pos_held_orders', JSON.stringify(heldOrders));
    } catch (e) {}
  }, [heldOrders]);

  const [voidingCartItem, setVoidingCartItem] = useState<{ item: CartItem; index: number } | null>(null);
  const [isSupervisorVoidModalOpen, setIsSupervisorVoidModalOpen] = useState(false);
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
  const [isVoidConfirmOpen, setIsVoidConfirmOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isManualSearchOpen, setIsManualSearchOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isKeypadModalOpen, setIsKeypadModalOpen] = useState(false);

  // Collapsible Cart Table / Dropdown Drawer states
  const [isCartExpanded, setIsCartExpanded] = useState<boolean>(true);
  const [recentScannedAlert, setRecentScannedAlert] = useState<{
    name: string;
    qty: number;
    subtotal: number;
    timestamp: number;
  } | null>(null);
  const [isCollapsedFlashing, setIsCollapsedFlashing] = useState<boolean>(false);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerItemScannedEffect = (name: string, qty: number, subtotalVal: number) => {
    setRecentScannedAlert({
      name,
      qty,
      subtotal: subtotalVal,
      timestamp: Date.now(),
    });
    setIsCollapsedFlashing(true);
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    alertTimeoutRef.current = setTimeout(() => {
      setIsCollapsedFlashing(false);
    }, 2800);
  };

  // 3 most recently scanned items in cart
  const latestCartItems = useMemo(() => {
    return [...cart].slice(-3).reverse();
  }, [cart]);

  // Hardware Scanner buffer
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // Audio feedback synthesizer
  const playScannerBeep = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    } catch {
      // Audio fallback
    }
  };

  // Is Current Terminal F&B?
  const isFnbTerminal = useMemo(() => {
    if (!activeTerminal) return false;
    return (
      activeTerminal.modelType === 'fnb' ||
      activeTerminal.name === 'KASIR 02' ||
      (activeTerminal.businessModel || '').toLowerCase().includes('resto') ||
      (activeTerminal.businessModel || '').toLowerCase().includes('f&b') ||
      (activeTerminal.businessModel || '').toLowerCase().includes('cafe') ||
      (activeTerminal.location || '').toLowerCase().includes('f&b')
    );
  }, [activeTerminal]);

  // Is Current Terminal Building Materials Depot (KASIR 09)?
  const isBuildingTerminal = useMemo(() => {
    if (!activeTerminal) return false;
    return (
      activeTerminal.modelType === 'building' ||
      activeTerminal.name === 'KASIR 09' ||
      activeTerminal.code === 'POS-09' ||
      (activeTerminal.businessModel || '').toLowerCase().includes('bangunan') ||
      (activeTerminal.businessModel || '').toLowerCase().includes('material') ||
      (activeTerminal.location || '').toLowerCase().includes('bangunan')
    );
  }, [activeTerminal]);

  // Is Current Terminal Electronics & Gadgets (KASIR 07)?
  const isElectronicsTerminal = useMemo(() => {
    if (!activeTerminal) return false;
    return (
      activeTerminal.name === 'KASIR 07' ||
      activeTerminal.id === 'T-07' ||
      activeTerminal.code === 'POS-07' ||
      activeTerminal.modelType === 'electronics' ||
      (activeTerminal.location || '').toLowerCase().includes('elektronik') ||
      (activeTerminal.businessModel || '').toLowerCase().includes('elektronik') ||
      (activeTerminal.businessModel || '').toLowerCase().includes('gadget')
    );
  }, [activeTerminal]);

  // Is Current Terminal Auto Workshop & Service (KASIR 08)?
  const isWorkshopTerminal = useMemo(() => {
    if (!activeTerminal) return false;
    return (
      activeTerminal.name === 'KASIR 08' ||
      activeTerminal.id === 'T-08' ||
      activeTerminal.code === 'POS-08' ||
      activeTerminal.modelType === 'workshop' ||
      (activeTerminal.location || '').toLowerCase().includes('bengkel') ||
      (activeTerminal.businessModel || '').toLowerCase().includes('bengkel') ||
      (activeTerminal.businessModel || '').toLowerCase().includes('workshop')
    );
  }, [activeTerminal]);

  // Is Current Terminal Retail & Wholesaler (KASIR 01, 03, 06)?
  const isRetailWholesalerTerminal = useMemo(() => {
    if (!activeTerminal) return false;
    const name = activeTerminal.name || '';
    const id = activeTerminal.id || '';
    const code = activeTerminal.code || '';
    return (
      name === 'KASIR 01' ||
      name === 'KASIR 03' ||
      name === 'KASIR 06' ||
      id === 'T-01' ||
      id === 'T-03' ||
      id === 'T-06' ||
      code === 'POS-01' ||
      code === 'POS-03' ||
      code === 'POS-06'
    );
  }, [activeTerminal]);

  // When active terminal changes or register opens, configure default view mode
  useEffect(() => {
    if (isRegisterOpen) {
      if (isFnbTerminal) {
        setIsFnbPhotoMenuMode(true);
      } else {
        setIsFnbPhotoMenuMode(false);
      }
      setReceiptNumber(`TRX-${activeTerminal.code || 'POS'}-${Date.now().toString().slice(-6)}`);
    }
  }, [activeTerminal, isRegisterOpen, isFnbTerminal]);

  // Add to cart helper
  const handleAddToCart = (product: Product, scanQty = 1) => {
    const isRaw =
      product.itemType === 'RAW_MATERIAL' ||
      (product.id || '').toLowerCase().startsWith('ing-') ||
      (product.id || '').toLowerCase().startsWith('raw-') ||
      (product.category || '').toLowerCase().includes('bahan baku') ||
      (product.category || '').toLowerCase().includes('bahan mentah');

    if (isRaw) {
      showToast(
        language === 'ID'
          ? `❌ Item [${product.name}] adalah BAHAN BAKU mentah dan TIDAK DAPAT dijual di kasir!`
          : `❌ Item [${product.name}] is RAW MATERIAL and CANNOT be sold at POS cashier!`
      );
      return;
    }

    if (product.stock <= 0) {
      showToast(
        language === 'ID'
          ? `Stok ${product.name} telah habis!`
          : `Stock for ${product.name} is depleted!`
      );
      return;
    }

    const tierUnitPrice = getProductPriceByTier(product, selectedPriceTier);
    const productWithTierPrice: Product = {
      ...product,
      sell_price: tierUnitPrice,
    };

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && !item.modifiers
      );
      if (existing) {
        return prev.map((item) => {
          if (item.product.id === product.id && !item.modifiers) {
            const nextQty = item.quantity + scanQty;
            return {
              ...item,
              product: productWithTierPrice,
              quantity: nextQty,
              subtotal: (tierUnitPrice - (item.itemDiscount || 0)) * nextQty,
              signa: item.signa || product.signa,
            };
          }
          return item;
        });
      }
      return [
        ...prev,
        {
          product: productWithTierPrice,
          quantity: scanQty,
          subtotal: tierUnitPrice * scanQty,
          itemDiscount: 0,
          signa: product.signa,
        },
      ];
    });

    playScannerBeep();
    triggerItemScannedEffect(product.name, scanQty, tierUnitPrice * scanQty);
    showToast(
      language === 'ID'
        ? `+${scanQty} ${product.name} ditambahkan (${getTierLabel(selectedPriceTier)})`
        : `+${scanQty} ${product.name} added to cart`
    );
    focusBarcodeInput();
  };

  // Add F&B item with modifiers
  const handleAddFnbOrder = (
    product: Product,
    quantity: number,
    modifiers: {
      tableNumber: string;
      orderType: 'Dine-In' | 'Take-Away';
      spicyLevel: number;
      toppings: string[];
      notes: string;
    },
    extraPrice: number
  ) => {
    const isRaw =
      product.itemType === 'RAW_MATERIAL' ||
      (product.id || '').toLowerCase().startsWith('ing-') ||
      (product.id || '').toLowerCase().startsWith('raw-') ||
      (product.category || '').toLowerCase().includes('bahan baku') ||
      (product.category || '').toLowerCase().includes('bahan mentah');

    if (isRaw) {
      showToast(
        language === 'ID'
          ? `❌ Item [${product.name}] adalah BAHAN BAKU mentah dan TIDAK DAPAT dijual di kasir!`
          : `❌ Item [${product.name}] is RAW MATERIAL and CANNOT be sold at POS cashier!`
      );
      return;
    }

    const unitPrice = product.sell_price + extraPrice;
    setCart((prev) => [
      ...prev,
      {
        product: {
          ...product,
          sell_price: unitPrice,
        },
        quantity,
        subtotal: unitPrice * quantity,
        itemDiscount: 0,
        modifiers,
      },
    ]);
    playScannerBeep();
    triggerItemScannedEffect(product.name, quantity, unitPrice * quantity);
    showToast(
      language === 'ID'
        ? `+${quantity} ${product.name} (${modifiers.orderType} • ${modifiers.tableNumber}) ditambahkan`
        : `+${quantity} ${product.name} (${modifiers.orderType} • ${modifiers.tableNumber}) added`
    );
  };

  // Update item quantity
  const handleUpdateQty = (index: number, delta: number) => {
    const currentItem = cart[index];
    if (!currentItem) return;

    if (currentItem.quantity + delta <= 0) {
      handleRequestRemoveItem(index);
      return;
    }

    setCart((prev) => {
      return prev.map((item, idx) => {
        if (idx === index) {
          const targetQty = item.quantity + delta;
          return {
            ...item,
            quantity: targetQty,
            subtotal: (item.product.sell_price - (item.itemDiscount || 0)) * targetQty,
          };
        }
        return item;
      });
    });
  };

  // Toggle Satuan Eceran vs Utuh (Meter vs Batang/Roll untuk material bangunan)
  const handleToggleItemUnit = (index: number) => {
    setCart((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const p = item.product;
          if (p.unitSecondary && p.priceSecondary) {
            const nextIsRetail = !item.isRetailUnit;
            const nextUnit = nextIsRetail ? p.unitSecondary : p.unit || 'Pcs';
            const unitPrice = nextIsRetail ? p.priceSecondary : p.sell_price;
            const nextSubtotal = Math.round((unitPrice - (item.itemDiscount || 0)) * item.quantity);
            return {
              ...item,
              isRetailUnit: nextIsRetail,
              selectedUnit: nextUnit,
              subtotal: nextSubtotal,
            };
          }
        }
        return item;
      })
    );
  };

  // Dropdown Armada Cepat untuk Item Curah KASIR 09
  const handleSelectFleetTier = (index: number, fleetId: string) => {
    setCart((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const fleetList =
            item.product.bulkFleetTiers && item.product.bulkFleetTiers.length > 0
              ? item.product.bulkFleetTiers
              : DEFAULT_FLEET_OPTIONS;
          const chosen = fleetList.find((f) => f.id === fleetId);
          if (chosen) {
            const newPrice = chosen.price;
            const newUnit = chosen.name;
            const nextSubtotal = Math.round((newPrice - (item.itemDiscount || 0)) * item.quantity);
            return {
              ...item,
              selectedUnit: newUnit,
              subtotal: nextSubtotal,
              product: {
                ...item.product,
                sell_price: newPrice,
                bulkUnitType: chosen.id,
              },
            };
          }
        }
        return item;
      })
    );
  };

  // Direct fast numeric quantity change (supermarket cashier keyboard input with decimal support)
  const handleDirectQtyChange = (index: number, newQty: number) => {
    setCart((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const isDecimalAllowed = Boolean(item.product.supportDecimal || isBuildingTerminal);
          let validQty = isNaN(newQty) ? 1 : newQty;
          if (isDecimalAllowed) {
            validQty = Math.max(0.01, Math.round(validQty * 100) / 100);
          } else {
            validQty = Math.max(1, Math.floor(validQty));
          }
          const unitPrice = item.isRetailUnit && item.product.priceSecondary
            ? item.product.priceSecondary
            : item.product.sell_price;
          const effectivePrice = Math.max(0, unitPrice - (item.itemDiscount || 0));
          return {
            ...item,
            quantity: validQty,
            subtotal: Math.round(effectivePrice * validQty),
          };
        }
        return item;
      })
    );
  };

  // Update per-item discount
  const handleUpdateItemDiscount = (index: number, discount: number) => {
    setCart((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const clampedDiscount = Math.max(0, Math.min(item.product.sell_price, discount));
          return {
            ...item,
            itemDiscount: clampedDiscount,
            subtotal: (item.product.sell_price - clampedDiscount) * item.quantity,
          };
        }
        return item;
      })
    );
  };

  // Remove item by index
  const handleRemoveItem = (index: number) => {
    setCart((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length === 0) {
        setSelectedCartIndex(null);
      } else {
        setSelectedCartIndex((curr) => {
          if (curr === null) return null;
          if (curr >= next.length) return next.length - 1;
          return curr;
        });
      }
      return next;
    });
  };

  // Supervisor Void Approval: triggers verification modal before removing scanned item
  const handleRequestRemoveItem = (index: number) => {
    const targetItem = cart[index];
    if (!targetItem) return;
    setVoidingCartItem({ item: targetItem, index });
    setIsSupervisorVoidModalOpen(true);
  };

  // Called when supervisor approves void
  const handleApproveVoidItem = (item: CartItem, index: number, supervisorName: string, reason: string) => {
    handleRemoveItem(index);

    const subtotalVal = item.subtotal || item.product.sell_price * item.quantity;
    addAuditLog(
      `[VOID ITEM POS] Item "${item.product.name}" (${item.quantity} ${item.product.unit || 'pcs'} @ Rp ${item.product.sell_price.toLocaleString('id-ID')} | Total: Rp ${subtotalVal.toLocaleString('id-ID')}) DIBATALKAN dari transaksi kasir. Disetujui oleh: ${supervisorName}. Alasan: ${reason}.`,
      'POS / Kasir',
      'WARN'
    );

    showToast(
      language === 'ID'
        ? `Item "${item.product.name}" berhasil di-void (Disetujui: ${supervisorName})`
        : `Item "${item.product.name}" voided (Approved by: ${supervisorName})`
    );
  };

  // Clear / Void Cart
  const handleConfirmVoid = () => {
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    addAuditLog(
      `[VOID TRANSAKSI] Seluruh transaksi kasir (${cart.length} SKU, ${totalItems} pcs senilai Rp ${grandTotal.toLocaleString('id-ID')}) DIBATALKAN (Void) oleh kasir.`,
      'POS / Kasir',
      'WARN'
    );
    resetToNewTransaction();
    setIsVoidConfirmOpen(false);
    showToast(
      language === 'ID'
        ? 'Transaksi berhasil dibatalkan (VOID). Kasir kembali ke Transaksi Baru / Pelanggan Umum.'
        : 'Transaction voided successfully. Reverted to New Transaction / Guest.'
    );
  };

  // Open Hold Cart Modal
  const handleOpenHoldModal = () => {
    if (cart.length === 0) {
      showToast(
        language === 'ID'
          ? 'Keranjang masih kosong, tidak ada pesanan untuk ditahan.'
          : 'Cart is empty, nothing to hold.'
      );
      return;
    }
    setIsHoldCartModalOpen(true);
  };

  // Confirm Hold Order from Modal
  const handleConfirmHoldOrder = (holdName: string) => {
    if (cart.length === 0) return;

    const newHeld: HeldOrder = {
      id: `HOLD-${Date.now()}`,
      name: holdName,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      items: [...cart],
      total: grandTotal,
      customer: selectedCustomer,
      priceTier: selectedPriceTier,
    };

    setHeldOrders((prev) => [newHeld, ...prev]);
    resetToNewTransaction();
    addAuditLog(
      `[HOLD CART] Transaksi antrean "${newHeld.name}" (${newHeld.items.length} SKU, total Rp ${newHeld.total.toLocaleString('id-ID')}) DITAHAN (HOLD) oleh kasir.`,
      'POS / Kasir',
      'INFO'
    );
    showToast(
      language === 'ID'
        ? `Transaksi "${newHeld.name}" berhasil ditahan (HOLD). Kasir siap melayani antrean berikutnya.`
        : `Order "${newHeld.name}" held successfully.`
    );
  };

  // Hold / Pending Current Transaction (Quick / Fallback)
  const handleHoldOrder = () => {
    handleOpenHoldModal();
  };

  // Recall Held Order
  const handleRecallOrder = (order: HeldOrder) => {
    // If cart currently has items, automatically park current cart to prevent data loss
    if (cart.length > 0) {
      const autoParkName = `${language === 'ID' ? 'Antrean Sebelumnya' : 'Previous Cart'} (${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`;
      const autoHeld: HeldOrder = {
        id: `HOLD-${Date.now()}`,
        name: autoParkName,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        items: [...cart],
        total: grandTotal,
        customer: selectedCustomer,
        priceTier: selectedPriceTier,
      };
      setHeldOrders((prev) => [autoHeld, ...prev.filter((o) => o.id !== order.id)]);
      showToast(
        language === 'ID'
          ? `Keranjang aktif disimpan ke "${autoParkName}" & antrean "${order.name}" dimuat.`
          : `Active cart saved to "${autoParkName}" & order "${order.name}" recalled.`
      );
    } else {
      setHeldOrders((prev) => prev.filter((o) => o.id !== order.id));
      showToast(
        language === 'ID'
          ? `Antrean "${order.name}" berhasil dimuat kembali (RECALL).`
          : `Order "${order.name}" recalled successfully.`
      );
    }

    setCart(order.items);
    setSelectedCustomer(order.customer || null);
    setSelectedPriceTier(order.priceTier || 'RETAIL');
    setIsHeldOrdersModalOpen(false);

    addAuditLog(
      `[RECALL CART] Antrean "${order.name}" (${order.items.length} SKU, total Rp ${order.total.toLocaleString('id-ID')}) DIPANGGIL KEMBALI (RECALL) ke kasir.`,
      'POS / Kasir',
      'INFO'
    );
  };

  // Delete Held Order
  const handleDeleteHeldOrder = (id: string) => {
    const target = heldOrders.find((o) => o.id === id);
    setHeldOrders((prev) => prev.filter((o) => o.id !== id));
    if (target) {
      addAuditLog(
        `[DELETE HELD] Antrean "${target.name}" (${target.items.length} SKU) dihapus oleh kasir.`,
        'POS / Kasir',
        'INFO'
      );
    }
    showToast(language === 'ID' ? 'Antrean berhasil dihapus.' : 'Held order deleted.');
  };

  // Reprint Last Receipt
  const handleReprintLastReceipt = () => {
    if (!sales || sales.length === 0) {
      showToast(
        language === 'ID'
          ? 'Belum ada transaksi penjualan yang tercatat.'
          : 'No sales recorded yet.'
      );
      return;
    }
    const lastSale = sales[sales.length - 1];
    showReceipt(lastSale);
  };

  // Manual Cash Drawer Open Command (ESC/POS RJ11 Trigger)
  const handleManualOpenDrawer = () => {
    triggerCashDrawer();
    showToast(
      language === 'ID'
        ? 'Sinyal pulsa buka laci kasir terkirim ke printer'
        : 'Pulse signal sent to open cash drawer via printer'
    );
  };

  // Barcode search / enter handler
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

    // Dukungan instan scanner untuk barcode Obat Racikan "RCK-2026-001"
    if (q.toUpperCase() === 'RCK-2026-001' || q.toUpperCase() === 'RACIK-FLU-BATUK-DEWASA') {
      const racikanItem: Product = {
        id: 'RCK-2026-001',
        plu: 'RACIK-FLU-BATUK-DEWASA',
        barcode: 'RCK-2026-001',
        name: 'Racikan Kapsul Flu & Batuk Dewasa',
        itemType: 'RETAIL',
        category: 'FARMASI_RACIKAN',
        brand: 'Apotek JacS Farma',
        sell_price: 45000,
        cost_price: 24500,
        stock: 50,
        status: 'Active',
        unit: 'Kapsul',
        pharmacyClass: 'RACIKAN',
        signa: '3 x 1 Kapsul sesudah makan',
        businessModel: 'pharmacy',
      };
      handleAddToCart(racikanItem, 1);
      setBarcodeInput('');
      focusBarcodeInput();
      return;
    }

    const match = activeProducts.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === q.toLowerCase()) ||
        (p.plu && p.plu.toLowerCase() === q.toLowerCase()) ||
        (p.id && p.id.toLowerCase() === q.toLowerCase()) ||
        (p.name && p.name.toLowerCase() === q.toLowerCase())
    );

    if (match) {
      handleAddToCart(match, 1);
      setBarcodeInput('');
      focusBarcodeInput();
    } else {
      // Check if item exists in raw materials
      const rawMatch = products.find(
        (p) =>
          (p.itemType === 'RAW_MATERIAL' ||
            (p.id || '').toLowerCase().startsWith('ing-') ||
            (p.id || '').toLowerCase().startsWith('raw-') ||
            (p.category || '').toLowerCase().includes('bahan baku') ||
            (p.category || '').toLowerCase().includes('bahan mentah')) &&
          ((p.barcode && p.barcode.toLowerCase() === q.toLowerCase()) ||
            (p.plu && p.plu.toLowerCase() === q.toLowerCase()) ||
            (p.id && p.id.toLowerCase() === q.toLowerCase()) ||
            (p.name && p.name.toLowerCase() === q.toLowerCase()))
      );
      if (rawMatch) {
        showToast(
          language === 'ID'
            ? `❌ Item [${rawMatch.name}] adalah BAHAN BAKU mentah dan TIDAK DAPAT dijual di kasir!`
            : `❌ Item [${rawMatch.name}] is RAW MATERIAL and CANNOT be sold at POS cashier!`
        );
        setBarcodeInput('');
        focusBarcodeInput();
        return;
      }

      // Check if item exists but is DISCONTINUED
      const discontinuedMatch = products.find(
        (p) =>
          String(p.status || '').toUpperCase() === 'DISCONTINUED' &&
          ((p.barcode && p.barcode.toLowerCase() === q.toLowerCase()) ||
            (p.plu && p.plu.toLowerCase() === q.toLowerCase()) ||
            (p.id && p.id.toLowerCase() === q.toLowerCase()) ||
            (p.name && p.name.toLowerCase() === q.toLowerCase()))
      );
      if (discontinuedMatch) {
        showToast(
          language === 'ID'
            ? `Produk [${discontinuedMatch.name}] berstatus DISCONTINUED dan disembunyikan dari kasir!`
            : `Product [${discontinuedMatch.name}] is DISCONTINUED and hidden from POS!`
        );
        setBarcodeInput('');
        focusBarcodeInput();
        return;
      }

      // Check partial match by name, description, plu, or barcode in activeProducts
      const partial = activeProducts.find(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q.toLowerCase())) ||
          (p.description && p.description.toLowerCase().includes(q.toLowerCase())) ||
          (p.plu && p.plu.toLowerCase().includes(q.toLowerCase())) ||
          (p.barcode && p.barcode.includes(q))
      );
      if (partial) {
        handleAddToCart(partial, 1);
        setBarcodeInput('');
        focusBarcodeInput();
      } else {
        showToast(
          language === 'ID'
            ? `Produk [${q}] tidak ditemukan di master data!`
            : `Product [${q}] not found in master catalog!`
        );
        setBarcodeInput('');
        focusBarcodeInput();
      }
    }
  };

  // Helper to format item variant/size cleanly for enterprise grid table (tanpa duplikasi teks satuan UOM)
  const getItemVariant = (item: CartItem): string => {
    if (!item?.product) return '';
    let val = item.modifiers?.variant;
    if (!val) {
      if (item.modifiers?.orderType) {
        const m = item.modifiers;
        const oType = m.orderType;
        const rawT = m.tableNumber || '01';
        const tNum = rawT.toLowerCase().includes('meja') ? rawT : `Meja ${rawT}`;
        const temp = m.temperature ? ` • ${m.temperature}` : '';
        const sugar = m.sugarLevel ? ` • ${m.sugarLevel}` : '';
        const spicy = (m.spicyLevel !== undefined && m.spicyLevel > 0) ? ` • Level ${m.spicyLevel}` : '';
        const tops = m.toppings && m.toppings.length > 0 ? ` • ${m.toppings.join(', ')}` : '';

        if (oType === 'Take-Away') {
          val = `Take-Away${temp}${sugar}${spicy}${tops}`;
        } else {
          val = `Dine-In • ${tNum}${temp}${sugar}${spicy}${tops}`;
        }
      } else if (item.product.size && item.product.size.toLowerCase() !== (item.product.unit || '').toLowerCase()) {
        val = item.product.size;
      } else {
        return '';
      }
    }
    const cleaned = (val || '')
      .replace(/\s*\/\s*ORIGINAL\b/gi, '')
      .replace(/\bORIGINAL\s*\/\s*/gi, '')
      .replace(/\bORIGINAL\b/gi, '')
      .trim();

    if (
      !cleaned ||
      cleaned.toUpperCase() === 'STANDAR' ||
      cleaned.toUpperCase() === 'STD' ||
      cleaned.toUpperCase() === 'ALL' ||
      cleaned.toLowerCase() === (item.product.unit || '').toLowerCase()
    ) {
      return '';
    }
    return cleaned;
  };

  const handleSaveEditedItem = (newQty: number, newItemDiscount: number, newVariant: string) => {
    if (editingItemIndex === null || editingItemIndex >= cart.length) return;
    setCart((prev) => {
      const next = [...prev];
      const target = { ...next[editingItemIndex] };
      target.quantity = newQty;
      target.itemDiscount = newItemDiscount;
      target.modifiers = { ...target.modifiers, variant: newVariant };
      target.subtotal = Math.max(0, (target.product.sell_price - newItemDiscount) * newQty);
      next[editingItemIndex] = target;
      return next;
    });
    setEditingItemIndex(null);
    showToast(language === 'ID' ? 'Item belanja diperbarui' : 'Cart item updated');
  };

  // Global Hardware Scanner & Enterprise Shortcuts (F2, F3, F4, F10, F12, Esc) Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Shortcut [F2]: Focus barcode scanner input
      if (e.key === 'F2') {
        e.preventDefault();
        focusBarcodeInput();
        return;
      }

      // 2. Shortcut [F3] / [F1]: Open Manual Product Search
      if (e.key === 'F3' || e.key === 'F1') {
        e.preventDefault();
        setIsManualSearchOpen(true);
        return;
      }

      // 3. Shortcut [F4] atau tombol Asterisk [*]: Melompatkan kursor ke input Qty item terakhir yang aktif
      if (e.key === 'F4' || e.key === '*' || e.code === 'NumpadMultiply') {
        const target = e.target as HTMLElement;
        const isTargetInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
        if (e.key === 'F4' || !isTargetInput || target === barcodeInputRef.current) {
          e.preventDefault();
          if (cart.length > 0) {
            const lastIdx = cart.length - 1;
            const inputEl = document.getElementById(`pos-qty-input-${lastIdx}`) as HTMLInputElement | null;
            if (inputEl) {
              inputEl.focus();
              inputEl.select();
            }
          } else {
            showToast(language === 'ID' ? 'Keranjang belanja masih kosong!' : 'Cart is empty!');
          }
          return;
        }
      }

      // Shortcut [F6]: Tahan Antrean Keranjang Belanja (Hold Cart)
      if (e.key === 'F6') {
        e.preventDefault();
        handleOpenHoldModal();
        return;
      }

      // Shortcut [F7]: Panggil Kembali Antrean Tertahan (Recall Cart)
      if (e.key === 'F7') {
        e.preventDefault();
        setIsHeldOrdersModalOpen(true);
        return;
      }

      // 4. Shortcut [F10]: Alihkan fokus kursor ke input nominal "Diterima"
      if (e.key === 'F10') {
        e.preventDefault();
        if (cart.length > 0) {
          setPaymentMethod('CASH');
          focusCashInput();
        } else {
          showToast(language === 'ID' ? 'Keranjang belanja masih kosong!' : 'Cart is empty!');
        }
        return;
      }

      // 5. Shortcut [F12]: Buka Laci Kasir (Cash Drawer ESC/POS Trigger)
      if (e.key === 'F12') {
        e.preventDefault();
        handleManualOpenDrawer();
        return;
      }

      // 6. Shortcut [Escape]: Fungsi batalkan/tutup (Tutup modal terbuka -> Batalkan pilihan baris keranjang -> Kembalikan kursor ke input [F2])
      if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedCartIndex !== null) {
          setSelectedCartIndex(null);
        }
        if (isPaymentConfirmOpen) {
          setIsPaymentConfirmOpen(false);
        }
        if (isManualSearchOpen) {
          setIsManualSearchOpen(false);
        }
        if (isQrisModalOpen) {
          setIsQrisModalOpen(false);
        }
        if (isHeldOrdersModalOpen) {
          setIsHeldOrdersModalOpen(false);
        }
        if (isHoldCartModalOpen) {
          setIsHoldCartModalOpen(false);
        }
        if (isSupervisorVoidModalOpen) {
          setIsSupervisorVoidModalOpen(false);
          setVoidingCartItem(null);
        }
        if (isDiscountModalOpen) {
          setIsDiscountModalOpen(false);
        }
        if (isKotModalOpen) {
          setIsKotModalOpen(false);
        }
        if (isFnbModalOpen) {
          setIsFnbModalOpen(false);
        }
        if (editingItemIndex !== null) {
          setEditingItemIndex(null);
        }
        if (isReceiptModalOpen) {
          closeReceipt();
        }
        if (isCustomerDropdownOpen) {
          setIsCustomerDropdownOpen(false);
        }
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        focusBarcodeInput();
        return;
      }

      // Enter saat modal konfirmasi pembayaran terbuka langsung memproses & mencetak struk
      if (e.key === 'Enter' && isPaymentConfirmOpen) {
        e.preventDefault();
        executeSaleCheckout();
        return;
      }

      const isAnyModalOpen =
        isPaymentConfirmOpen ||
        isManualSearchOpen ||
        isQrisModalOpen ||
        isHeldOrdersModalOpen ||
        isHoldCartModalOpen ||
        isSupervisorVoidModalOpen ||
        isDiscountModalOpen ||
        isKotModalOpen ||
        isFnbModalOpen ||
        isReceiptModalOpen ||
        isCustomerDropdownOpen ||
        isNewCustomerModalOpen ||
        isUnlockModalOpen ||
        isHybridPinModalOpen ||
        isVoidConfirmOpen;

      const target = e.target as HTMLElement;

      // Enter saat keranjang terisi dan tidak sedang di input tertentu: otomatis alihkan ke input nominal "Diterima"
      // HANYA aktif pada mode Kasir Retail / Non-F&B.
      // Pada mode F&B / Resto, pertahankan alur pilih meja dan tambah pesanan tanpa auto-focus ke pembayaran tunai saat Enter ditekan pada menu.
      if (e.key === 'Enter' && !isAnyModalOpen && cart.length > 0) {
        const isTargetInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
        if (!isTargetInput && !isFnbTerminal && !isFnbPhotoMenuMode) {
          e.preventDefault();
          setPaymentMethod('CASH');
          focusCashInput();
          return;
        }
      }

      // 7. Navigasi Keranjang Cepat [ArrowUp] / [ArrowDown]
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !isAnyModalOpen && cart.length > 0) {
        const isTargetInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
        const isBarcodeInput = target === barcodeInputRef.current;
        const isQtyInput = target?.id && target.id.startsWith('pos-qty-input-');

        if (!isTargetInput || isBarcodeInput || isQtyInput) {
          e.preventDefault();
          if (isBarcodeInput) {
            barcodeInputRef.current?.blur();
          }

          let nextIdx: number;
          if (e.key === 'ArrowDown') {
            nextIdx = selectedCartIndex === null ? 0 : Math.min(cart.length - 1, selectedCartIndex + 1);
          } else {
            nextIdx = selectedCartIndex === null ? cart.length - 1 : Math.max(0, selectedCartIndex - 1);
          }
          setSelectedCartIndex(nextIdx);

          if (isQtyInput) {
            const nextQtyInput = document.getElementById(`pos-qty-input-${nextIdx}`) as HTMLInputElement | null;
            if (nextQtyInput) {
              nextQtyInput.focus();
              nextQtyInput.select();
            }
          }
          return;
        }
      }

      // 8. Hapus Baris Item Terpilih [Delete] atau [Backspace]
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        !isAnyModalOpen &&
        selectedCartIndex !== null &&
        selectedCartIndex >= 0 &&
        selectedCartIndex < cart.length
      ) {
        const isTargetInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
        if (!isTargetInput) {
          e.preventDefault();
          handleRequestRemoveItem(selectedCartIndex);
          return;
        }
      }

      // 9. Shortcut [+] dan [-] Menambah / Mengurangi Qty Item Terpilih
      if (!isAnyModalOpen && selectedCartIndex !== null && selectedCartIndex >= 0 && selectedCartIndex < cart.length) {
        const isTargetInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
        if (!isTargetInput) {
          if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
            e.preventDefault();
            handleUpdateQty(selectedCartIndex, 1);
            return;
          }
          if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
            e.preventDefault();
            handleUpdateQty(selectedCartIndex, -1);
            return;
          }
        }
      }

      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Shortcut [Spacebar]: Buka / Tutup Rincian Daftar Belanja secara instan
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsCartExpanded((prev) => !prev);
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTimeRef.current > 100) {
        barcodeBufferRef.current = '';
      }
      lastKeyTimeRef.current = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 3) {
          const scannedCode = barcodeBufferRef.current.trim();
          const match = activeProducts.find(
            (p) =>
              p.barcode === scannedCode ||
              (p.plu && p.plu.toLowerCase() === scannedCode.toLowerCase()) ||
              (p.id && p.id.toLowerCase() === scannedCode.toLowerCase())
          );
          if (match) {
            handleAddToCart(match, 1);
            focusBarcodeInput();
          } else {
            const rawMatch = products.find(
              (p) =>
                (p.itemType === 'RAW_MATERIAL' ||
                  (p.id || '').toLowerCase().startsWith('ing-') ||
                  (p.id || '').toLowerCase().startsWith('raw-') ||
                  (p.category || '').toLowerCase().includes('bahan baku') ||
                  (p.category || '').toLowerCase().includes('bahan mentah')) &&
                (p.barcode === scannedCode ||
                  (p.plu && p.plu.toLowerCase() === scannedCode.toLowerCase()) ||
                  (p.id && p.id.toLowerCase() === scannedCode.toLowerCase()))
            );
            if (rawMatch) {
              showToast(
                language === 'ID'
                  ? `❌ Item [${rawMatch.name}] adalah BAHAN BAKU mentah dan TIDAK DAPAT dijual di kasir!`
                  : `❌ Item [${rawMatch.name}] is RAW MATERIAL and CANNOT be sold at POS cashier!`
              );
            } else {
              const discontinuedMatch = products.find(
                (p) =>
                  String(p.status || '').toUpperCase() === 'DISCONTINUED' &&
                  (p.barcode === scannedCode ||
                    (p.plu && p.plu.toLowerCase() === scannedCode.toLowerCase()) ||
                    (p.id && p.id.toLowerCase() === scannedCode.toLowerCase()))
              );
              if (discontinuedMatch) {
                showToast(
                  language === 'ID'
                    ? `Produk [${discontinuedMatch.name}] berstatus DISCONTINUED dan disembunyikan dari kasir!`
                    : `Product [${discontinuedMatch.name}] is DISCONTINUED and hidden from POS!`
                );
              } else {
                showToast(
                  language === 'ID'
                    ? `Barcode [${scannedCode}] tidak ditemukan!`
                    : `Barcode [${scannedCode}] not found!`
                );
              }
            }
            focusBarcodeInput();
          }
          barcodeBufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    products,
    activeProducts,
    isRegisterOpen,
    language,
    cart,
    selectedCartIndex,
    isPaymentConfirmOpen,
    isManualSearchOpen,
    isReceiptModalOpen,
    isQrisModalOpen,
    isHeldOrdersModalOpen,
    isDiscountModalOpen,
    isKotModalOpen,
    isFnbModalOpen,
    editingItemIndex,
    isCustomerDropdownOpen,
    isFnbTerminal,
    isFnbPhotoMenuMode,
  ]);

  // Auto-scroll baris keranjang yang sedang terpilih ke area pandang aktif
  useEffect(() => {
    if (selectedCartIndex !== null) {
      const rowId = isFnbPhotoMenuMode
        ? `fnb-cart-row-${selectedCartIndex}`
        : `pos-cart-row-${selectedCartIndex}`;
      const el = document.getElementById(rowId);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedCartIndex, isFnbPhotoMenuMode]);

  // Listener for Hold / Penundaan Transaksi dari Struk Belanja
  useEffect(() => {
    const handleHoldFromReceiptEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ sale: any }>;
      const sale = customEvent.detail?.sale;
      if (sale && sale.items && sale.items.length > 0) {
        setCart(sale.items);
        if (sale.customer_id) {
          const matchedCust = customers.find((c) => c.id === sale.customer_id);
          if (matchedCust) setSelectedCustomer(matchedCust);
        }
        showToast(
          language === 'ID'
            ? 'Item nota dikembalikan ke keranjang belanja kasir untuk penambahan produk.'
            : 'Receipt items returned to cart for additional shopping.'
        );
      }
    };

    window.addEventListener('pos-hold-from-receipt', handleHoldFromReceiptEvent);
    return () => {
      window.removeEventListener('pos-hold-from-receipt', handleHoldFromReceiptEvent);
    };
  }, [customers, language]);

  // F&B Categories & Filtered Products:
  // KASIR 02 (F&B / Resto): default HANYA menampilkan kategori Makanan, Minuman, dan Snack.
  // Jika toggle 'Semua Kategori' aktif: kasir dapat mengakses seluruh kategori.
  const fnbCategories = useMemo(() => {
    if (showAllCategories) {
      const cats = new Set<string>();
      activeProducts.forEach((p) => {
        if (p.category) cats.add(p.category);
      });
      return ['ALL', ...Array.from(cats)];
    }
    return ['ALL', 'Kopi', 'Non-Kopi / Segar', 'Makanan Utama', 'Pastry & Bakery', 'Paket Hemat'];
  }, [activeProducts, showAllCategories]);

  const filteredFnbProducts = useMemo(() => {
    const fnbList = activeProducts.filter((p) => p.itemType === 'MENU_FB' || p.businessModel === 'fnb');
    const sourceList = showAllCategories
      ? activeProducts
      : (fnbList.length > 0 ? fnbList : activeProducts);

    return sourceList.filter((product) => {
      if (product.itemType === 'RAW_MATERIAL') return false;

      // Sembunyikan kategori ritel / minimarket
      if (!showAllCategories) {
        const cat = (product.category || '').toLowerCase();
        const name = (product.name || '').toLowerCase();
        if (
          cat.includes('instan') ||
          cat.includes('biskuit') ||
          cat.includes('dishwashing') ||
          cat.includes('canned') ||
          cat.includes('energy') ||
          cat.includes('soft drink') ||
          cat.includes('sabun') ||
          cat.includes('deterjen') ||
          cat.includes('snack & biskuit') ||
          name.includes('deterjen') ||
          name.includes('dishwashing')
        ) {
          return false;
        }
      }

      const catLower = (product.category || '').toLowerCase();
      const matchCat =
        selectedFnbCategory === 'ALL' ||
        product.category === selectedFnbCategory ||
        (selectedFnbCategory === 'Kopi' &&
          (catLower.includes('kopi') || catLower.includes('coffee'))) ||
        (selectedFnbCategory === 'Non-Kopi / Segar' &&
          (catLower.includes('non-kopi') || catLower.includes('segar') || catLower.includes('beverage') || catLower.includes('tea') || catLower.includes('teh') || catLower.includes('jus'))) ||
        (selectedFnbCategory === 'Makanan Utama' &&
          (catLower.includes('utama') || catLower.includes('main course') || catLower.includes('makanan') || catLower.includes('nasi') || catLower.includes('mie'))) ||
        (selectedFnbCategory === 'Pastry & Bakery' &&
          (catLower.includes('pastry') || catLower.includes('bakery') || catLower.includes('roti') || catLower.includes('snack'))) ||
        (selectedFnbCategory === 'Paket Hemat' &&
          (catLower.includes('paket') || catLower.includes('hemat') || catLower.includes('combo')));

      const matchSearch =
        !fnbSearchQuery ||
        product.name.toLowerCase().includes(fnbSearchQuery.toLowerCase()) ||
        product.id.toLowerCase().includes(fnbSearchQuery.toLowerCase()) ||
        (product.category || '').toLowerCase().includes(fnbSearchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeProducts, showAllCategories, selectedFnbCategory, fnbSearchQuery]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item?.subtotal || 0), 0);
  }, [cart]);

  const calculatedDiscount = useMemo(() => {
    if (discountType === 'PERCENT') {
      return Math.round((subtotal * discountPercent) / 100);
    }
    return Math.min(subtotal, discountAmount);
  }, [subtotal, discountType, discountPercent, discountAmount]);

  const taxAmount = useMemo(() => {
    if (!isTaxIncluded) return 0;
    const taxable = Math.max(0, subtotal - calculatedDiscount);
    return Math.round(taxable * 0.11);
  }, [subtotal, calculatedDiscount, isTaxIncluded]);

  // Total Tagihan Murni (sebelum pembulatan kasir)
  const rawGrandTotal = useMemo(() => {
    return Math.max(0, subtotal - calculatedDiscount + taxAmount);
  }, [subtotal, calculatedDiscount, taxAmount]);

  // Cash Rounding ke Rp 100 terdekat untuk metode CASH, sedangkan Non-Tunai (QRIS / EDC) menggunakan nominal murni
  const cashRoundingDiff = useMemo(() => {
    if (paymentMethod !== 'CASH') return 0;
    const rounded = Math.round(rawGrandTotal / 100) * 100;
    return rounded - rawGrandTotal;
  }, [rawGrandTotal, paymentMethod]);

  const grandTotal = useMemo(() => {
    if (paymentMethod === 'CASH') {
      return Math.round(rawGrandTotal / 100) * 100;
    }
    return rawGrandTotal;
  }, [rawGrandTotal, paymentMethod]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'CASH') return 0;
    return Math.max(0, cashGiven - grandTotal);
  }, [cashGiven, grandTotal, paymentMethod]);

  const totalCartItemCount = useMemo(() => {
    return cart.reduce((acc, i) => acc + (i?.quantity || 0), 0);
  }, [cart]);

  // Terminal Selection click handler (Enforces Lock & Security PIN, and Shift Check)
  const handleTerminalCardClick = (term: Terminal) => {
    let targetTerm: Terminal = { ...term };
    if (!term.businessModel) {
      if (term.id === 'T-07' || term.name === 'KASIR 07') {
        targetTerm = {
          ...term,
          colorHex: '#38bdf8',
          businessModel: 'Elektronik & Gawai',
          subLabel: 'Data Master',
        };
      } else if (term.id === 'T-08' || term.name === 'KASIR 08') {
        targetTerm = {
          ...term,
          colorHex: '#84cc16',
          businessModel: 'Bengkel & Otomotif',
          subLabel: 'Data Master',
        };
      } else if (term.code === 'KASIR-02' || term.name === 'KASIR 02' || term.id === 'T-02') {
        targetTerm = {
          ...term,
          id: term.id || 'T-02',
          name: 'KASIR 02',
          code: 'KASIR-02',
          businessModel: 'Kuliner & Resto (F&B)',
          colorHex: term.colorHex || '#10B981',
        };
      }
    }

    if (term.isLocked || !activeUser) {
      setTerminalToUnlock(targetTerm);
      setIsUnlockModalOpen(true);
      return;
    }

    // Set registerId & receipt prefix (KASIR-02 mandiri vs POS)
    if (targetTerm.code === 'KASIR-02' || targetTerm.name === 'KASIR 02') {
      setReceiptNumber(`TRX-KASIR02-${Date.now().toString().slice(-6)}`);
    } else {
      setReceiptNumber(`TRX-POS-${Date.now().toString().slice(-6)}`);
    }

    setActiveTerminal(targetTerm);

    // Cek apakah terminal tersebut sudah memiliki sesi shift aktif
    const hasActiveShift = Boolean(
      activeShift &&
      activeShift.status === 'OPEN' &&
      (activeShift.terminalId === targetTerm.id || activeShift.terminalName === targetTerm.name)
    );

    if (!hasActiveShift) {
      // Modal input shift kasir hanya boleh muncul saat pengguna mengklik kartu terminal spesifik ("Buka Kasir →") dan terminal tersebut belum memiliki sesi shift aktif
      setIsOpenShiftModalOpen(true);
    } else {
      const ind = getTerminalIndustry(targetTerm);
      setCart(INDUSTRY_DEMO_CARTS[ind] || INDUSTRY_DEMO_CARTS.retail);
      setIsRegisterOpen(true);
    }
  };

  // Dual-Mode Kasir Bantuan Handler untuk Terminal 02
  const handleOpenKasir02 = (rawT: Terminal) => {
    const kasir02Term: Terminal = {
      ...rawT,
      id: rawT.id || 'T-02',
      name: 'KASIR 02',
      code: 'KASIR-02',
      businessModel: 'Ritel & Kasir Bantuan (Back-End)',
      colorHex: '#00f2fe',
      isLocked: rawT.isLocked,
    };
    handleTerminalCardClick(kasir02Term);
  };

  // Handler Logout Kasir / Keluar dari Layar Register
  const handleCashierLogout = () => {
    setIsRegisterOpen(false);
    setIsFullscreen(false);
    // Kembalikan teks Topbar menjadi "POS & CASHIER (TERMINAL)"
    setActiveUser(null);
    setCurrentUser(null);
    showToast(
      language === 'ID'
        ? 'Kasir telah logout. Profil Topbar kembali ke status POS & CASHIER (TERMINAL).'
        : 'Cashier logged out. Topbar profile returned to POS & CASHIER (TERMINAL).'
    );
  };

  // Terminal Unlock Success Callback
  const handleUnlockSuccess = (term: Terminal, user?: UserType) => {
    toggleTerminalLock(term.id, false);
    const unlocked = { ...term, isLocked: false };
    setActiveTerminal(unlocked);

    const termName = (unlocked.name || '').toUpperCase();
    const termCode = (unlocked.code || '').toUpperCase();
    const termId = (unlocked.id || '').toUpperCase();

    let targetCashier: UserType | undefined = user;
    let matchedName = 'Andi Pratama';
    let matchedRole = 'Kasir 01';
    let matchedEmail = 'andi.pos01@jacs-erp.com';
    let matchedId = 'emp-001';

    if (termName.includes('02') || termCode.includes('02') || termId === 'T-02') {
      matchedName = 'Maya Indah';
      matchedRole = 'Kasir 02';
      matchedEmail = 'maya.pos02@jacs-erp.com';
      matchedId = 'emp-002';
    } else if (termName.includes('03') || termCode.includes('03') || termId === 'T-03') {
      matchedName = 'Rian Hidayat';
      matchedRole = 'Kasir 03';
      matchedEmail = 'rian.pos03@jacs-erp.com';
      matchedId = 'emp-003';
    } else if (termName.includes('04') || termCode.includes('04') || termId === 'T-04') {
      matchedName = 'Siti Aminah';
      matchedRole = 'Kasir 04';
      matchedEmail = 'siti.pos04@jacs-erp.com';
      matchedId = 'emp-004';
    }

    if (!targetCashier || targetCashier.role !== 'Kasir') {
      const existingUser = users.find((u) => u.name === matchedName);
      if (existingUser) {
        targetCashier = existingUser;
      } else {
        targetCashier = {
          user_id: matchedId,
          id: matchedId,
          name: matchedName,
          email: matchedEmail,
          division: 'POS & Kasir',
          role: 'Kasir',
          status: 'Active',
          pin: '1234',
          avatar: null,
          avatarUrl: null,
        };
      }
    }

    if (targetCashier) {
      setCurrentUser(targetCashier);
      setActiveUser(targetCashier);
    }
    setIsUnlockModalOpen(false);
    setTerminalToUnlock(null);
    showToast(
      language === 'ID'
        ? `Terminal ${term.name} berhasil dibuka! Kasir bertugas: ${targetCashier.name} (${matchedRole})`
        : `Terminal ${term.name} unlocked! Cashier: ${targetCashier.name} (${matchedRole})`
    );

    const hasActiveShift = Boolean(
      activeShift &&
      activeShift.status === 'OPEN' &&
      (activeShift.terminalId === unlocked.id || activeShift.terminalName === unlocked.name)
    );

    if (!hasActiveShift) {
      setIsOpenShiftModalOpen(true);
    } else {
      const ind = getTerminalIndustry(unlocked);
      setCart(INDUSTRY_DEMO_CARTS[ind] || INDUSTRY_DEMO_CARTS.retail);
      setIsRegisterOpen(true);
    }
  };

  // Toggle all terminals lock - Unlock All
  const areAllLocked = terminals.every((t) => t.isLocked);
  const handleToggleAllTerminals = () => {
    setAllTerminalsLock(false);
  };



  // Hold order directly from Payment Confirmation Modal (Saves to Pending Orders & Clears Register)
  const handleHoldOrderFromModal = () => {
    if (cart.length === 0) return;

    const defaultName = selectedCustomer
      ? `${selectedCustomer.name}`
      : `${language === 'ID' ? 'Antrean' : 'Customer'} #${heldOrders.length + 1}`;
    
    const customerName = window.prompt(
      language === 'ID'
        ? 'Nama Pelanggan / Catatan Antrean untuk Ditunda (Hold):'
        : 'Customer Name / Hold Note:',
      defaultName
    );

    if (customerName === null) return;

    const newHeld: HeldOrder = {
      id: `HOLD-${Date.now()}`,
      name: customerName.trim() || defaultName,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      items: [...cart],
      total: grandTotal,
      customer: selectedCustomer,
      priceTier: selectedPriceTier,
    };

    setHeldOrders((prev) => [...prev, newHeld]);
    setIsPaymentConfirmOpen(false);
    resetToNewTransaction();
    showToast(
      language === 'ID'
        ? `Transaksi "${newHeld.name}" berhasil ditunda (HOLD) ke daftar antrean!`
        : `Order "${newHeld.name}" moved to held queue!`
    );
  };

  // Open Payment Confirmation & Receipt Modal
  const handleCheckout = () => {
    if (cart.length === 0) {
      showToast(
        language === 'ID'
          ? 'Pilih minimal 1 produk untuk transaksi!'
          : 'Please select at least 1 item to checkout!'
      );
      return;
    }

    // Jika metode pembayaran QRIS, langsung tampilkan modal QRIS Dinamis
    if (paymentMethod === 'QRIS') {
      setIsQrisModalOpen(true);
      return;
    }

    if (paymentMethod === 'CASH') {
      if (!cashGiven || cashGiven <= 0) {
        setCashGiven(grandTotal);
      } else if (cashGiven < grandTotal) {
        showToast(
          language === 'ID'
            ? 'Jumlah uang yang dibayarkan kurang dari Total Belanja!'
            : 'Cash paid is less than the Grand Total!'
        );
        const inputEl = document.getElementById('pos-cash-given-input') as HTMLInputElement | null;
        if (inputEl) {
          inputEl.focus();
          inputEl.select();
        }
        return;
      }
    }

    setIsPaymentConfirmOpen(true);
  };

  // Callback saat pembayaran QRIS berhasil diverifikasi
  const handleQrisPaymentSuccess = () => {
    setIsQrisModalOpen(false);
    const itemsSummary = cart
      .map(
        (item) =>
          `${item.product.name}${
            item.modifiers ? ` (${item.modifiers.orderType} ${item.modifiers.tableNumber})` : ''
          } (${item.quantity}x)`
      )
      .join(', ');

    const calculatedPoints = selectedCustomer ? Math.floor(grandTotal / 10000) : 0;

    const paymentPayload: PaymentPayload = {
      items: cart,
      total: grandTotal,
      paymentMethod: 'QRIS',
      cashTendered: grandTotal,
      changeDue: 0,
      shiftId: activeShift?.status === 'OPEN' ? activeShift.id : undefined,
      customerId: selectedCustomer?.id,
      timestamp: new Date().toISOString(),
      terminalId: activeTerminal.id,
      businessType: activeTerminal.businessType || activeTerminal.businessModel || activeTerminal.modelType,
      receiptNumber: receiptNumber,
      cashierName: activeUser?.name || 'Kasir',
    };

    processPayment(paymentPayload);

    if (selectedCustomer) {
      addAuditLog(
        `POS Checkout QRIS Member: "${selectedCustomer.name}" (${selectedCustomer.phone || selectedCustomer.id}) Struk #${receiptNumber} Total Rp ${grandTotal.toLocaleString('id-ID')} [Tier: ${getTierLabel(selectedPriceTier)}, Poin +${calculatedPoints}]`,
        'Customer Loyalty',
        'INFO'
      );
    }
    if (deliveryMethod === 'FLEET_DELIVERY') {
      setLastCompletedDoItems([...cart]);
      setLastDoReceiptNumber(receiptNumber);
      setIsDoModalOpen(true);
    }
    // Transaksi QRIS tercatat resmi ke saldo settlement tanpa trigger laci kasir
    resetToNewTransaction();
    showToast(
      language === 'ID'
        ? 'Pembayaran QRIS Berhasil! Auto-journal Kas Masuk [Bank QRIS] & Jurnal HPP dibukukan ke Finance.'
        : 'QRIS payment verified! Auto-journal Cash In [Bank QRIS] & COGS recorded in Finance.'
    );
  };

  // Handler Langsung Eksekusi Transaksi Kasir [Bayar [F10]] (APS POS5 Integration)
  const handleDirectPayF10 = (overrideCashTendered?: number) => {
    if (cart.length === 0) {
      showToast(language === 'ID' ? 'Keranjang belanja masih kosong!' : 'Cart is empty!');
      return;
    }

    const totalTagihan = grandTotal;
    const isCreditAr =
      paymentMethod === 'KREDIT / TEMPO (AR)' ||
      paymentMethod === 'KREDIT' ||
      paymentMethod === 'AR_CREDIT';

    if (isCreditAr && !selectedCustomer) {
      showToast(
        language === 'ID'
          ? 'Pilih Pelanggan / Member terlebih dahulu untuk transaksi Kredit / Tempo (AR)!'
          : 'Please select a customer for Credit / AR transaction!'
      );
      setIsPaymentConfirmOpen(true);
      return;
    }

    const selectedPaymentMethod =
      isCreditAr
        ? 'KREDIT / TEMPO (AR)'
        : paymentMethod === 'QRIS'
        ? 'QRIS'
        : paymentMethod === 'EDC_DEBIT'
        ? 'Debit'
        : 'Tunai';

    // Nilai dari input Diterima
    const effectiveGiven = overrideCashTendered !== undefined ? overrideCashTendered : cashGiven;
    const cashTendered =
      paymentMethod === 'CASH'
        ? (effectiveGiven > 0 ? effectiveGiven : totalTagihan)
        : totalTagihan;

    // Jika pembayaran tunai dan uang kurang dari total, cegah eksekusi dan beri highlight/peringatan
    if (paymentMethod === 'CASH' && cashTendered < totalTagihan) {
      setIsCashUnderpaid(true);
      showToast(
        language === 'ID'
          ? `❌ Uang diterima (Rp ${cashTendered.toLocaleString('id-ID')}) kurang dari Total (Rp ${totalTagihan.toLocaleString('id-ID')})!`
          : `❌ Amount paid is less than Grand Total!`
      );
      focusCashInput();
      return;
    }

    setIsCashUnderpaid(false);

    // Kembalian yang tertera
    const changeDue =
      paymentMethod === 'CASH'
        ? Math.max(0, cashTendered - totalTagihan)
        : 0;

    const payload: PaymentPayload = {
      items: cart,
      total: totalTagihan,
      paymentMethod: selectedPaymentMethod,
      cashTendered: cashTendered,
      changeDue: changeDue,
      shiftId: activeShift?.status === 'OPEN' ? activeShift.id : activeShift?.id || 'SHIFT-0001',
      customerId: selectedCustomer?.id || 'GUEST',
      timestamp: new Date().toISOString(),
      terminalId: activeTerminal.id,
      businessType: activeTerminal.businessType || activeTerminal.businessModel || activeTerminal.modelType,
      receiptNumber: receiptNumber,
      cashierName: activeUser?.name || 'Kasir',
    };

    // Panggil langsung fungsi processPayment(payload) -> mencatat penjualan dan membuka ReceiptModal
    processPayment(payload);

    // Otomatis buka laci kasir jika metode pembayaran adalah TUNAI
    if (paymentMethod === 'CASH' || selectedPaymentMethod === 'Tunai') {
      triggerCashDrawer();
    }

    // Jika transaksi material/armada, buka Surat Jalan DO
    const isBuildingTrx =
      deliveryMethod === 'FLEET_DELIVERY' ||
      isBuildingTerminal ||
      cart.some(
        (c) =>
          c.product.businessModel === 'building' ||
          (c.product.id || '').startsWith('MAT-') ||
          c.product.materialNature === 'BULK_CURAH'
      );

    if (isBuildingTrx) {
      setLastCompletedDoItems([...cart]);
      setLastDoReceiptNumber(receiptNumber);
      setIsDoModalOpen(true);
    }

    // Setelah sukses, tampilkan alert/toast "Transaksi Berhasil"
    showToast('Transaksi Berhasil');

    // Reset input Diterima
    setCashGiven(0);

    // Kosongkan cart (setCart([])) & reset ke transaksi baru dengan nomor struk baru
    setCart([]);
    setSelectedCartIndex(null);
    setIsPaymentConfirmOpen(false);
    resetToNewTransaction();
  };

  // Handler Event onKeyDown pada Input "Diterima"
  const handleCashInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 1. Shortcut Spasi atau 'P' / 'p': Otomatis isi uang pas
    if (e.key === ' ' || e.code === 'Space' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      setCashGiven(grandTotal);
      setIsCashUnderpaid(false);
      showToast(
        language === 'ID'
          ? `Uang Pas: Rp ${grandTotal.toLocaleString('id-ID')}`
          : `Exact Cash: Rp ${grandTotal.toLocaleString('id-ID')}`
      );
      return;
    }

    // 2. Escape: Kembalikan fokus kursor ke input scan barcode [F2]
    if (e.key === 'Escape') {
      e.preventDefault();
      focusBarcodeInput();
      return;
    }

    // 3. Enter di input Diterima:
    if (e.key === 'Enter') {
      e.preventDefault();
      if (cart.length === 0) {
        showToast(language === 'ID' ? 'Keranjang belanja masih kosong!' : 'Cart is empty!');
        return;
      }

      if (paymentMethod === 'CASH') {
        const rawTargetVal = e.currentTarget?.value;
        const inputNum = rawTargetVal !== undefined && rawTargetVal !== '' ? Number(rawTargetVal) : NaN;
        let effectiveCash = !isNaN(inputNum) && inputNum > 0 ? inputNum : cashGiven;

        // Jika input kosong atau 0, otomatis isi dengan total tagihan (uang pas)
        if (!effectiveCash || effectiveCash <= 0) {
          effectiveCash = grandTotal;
          setCashGiven(grandTotal);
        }

        // Jika nilai kurang dari total, cegah eksekusi dan beri highlight/peringatan
        if (effectiveCash < grandTotal) {
          setIsCashUnderpaid(true);
          showToast(
            language === 'ID'
              ? `❌ Uang diterima (Rp ${effectiveCash.toLocaleString('id-ID')}) kurang dari Total (Rp ${grandTotal.toLocaleString('id-ID')})!`
              : `❌ Cash tendered (Rp ${effectiveCash.toLocaleString('id-ID')}) is less than Total (Rp ${grandTotal.toLocaleString('id-ID')})!`
          );
          focusCashInput();
          return;
        }

        // Jika nilai diterima >= total tagihan, langsung eksekusi transaksi dan buka ReceiptModal
        setIsCashUnderpaid(false);
        handleDirectPayF10(effectiveCash);
      } else {
        handleDirectPayF10();
      }
    }
  };

  // Eksekutor manual tombol [Bayar [F10]]
  const handleManualBayarClick = () => {
    if (cart.length === 0) {
      showToast(language === 'ID' ? 'Keranjang belanja masih kosong!' : 'Cart is empty!');
      return;
    }

    if (paymentMethod === 'CASH') {
      let effectiveCash = cashGiven;
      if (!effectiveCash || effectiveCash <= 0) {
        effectiveCash = grandTotal;
        setCashGiven(grandTotal);
      }

      if (effectiveCash < grandTotal) {
        setIsCashUnderpaid(true);
        showToast(
          language === 'ID'
            ? `❌ Uang diterima (Rp ${effectiveCash.toLocaleString('id-ID')}) kurang dari Total (Rp ${grandTotal.toLocaleString('id-ID')})!`
            : `❌ Amount paid is less than Grand Total!`
        );
        focusCashInput();
        return;
      }

      setIsCashUnderpaid(false);
      handleDirectPayF10(effectiveCash);
    } else {
      handleDirectPayF10();
    }
  };

  // Execute Sale Checkout and Print
  const executeSaleCheckout = () => {
    const itemsSummary = cart
      .map(
        (item) =>
          `${item.product.name}${
            item.modifiers ? ` (${item.modifiers.orderType} ${item.modifiers.tableNumber})` : ''
          } (${item.quantity}x)`
      )
      .join(', ');

    const isCreditAr =
      paymentMethod === 'KREDIT / TEMPO (AR)' ||
      paymentMethod === 'KREDIT' ||
      paymentMethod === 'AR_CREDIT';

    if (isCreditAr && !selectedCustomer) {
      showToast(
        language === 'ID'
          ? 'Pilih Pelanggan / Member terlebih dahulu untuk transaksi Kredit / Tempo (AR)!'
          : 'Please select a customer for Credit / AR transaction!'
      );
      setIsPaymentConfirmOpen(true);
      return;
    }

    const calculatedPoints = selectedCustomer ? Math.floor(grandTotal / 10000) : 0;

    const paymentPayload: PaymentPayload = {
      items: cart,
      total: grandTotal,
      paymentMethod: paymentMethod,
      cashTendered: paymentMethod === 'CASH' ? cashGiven : grandTotal,
      changeDue: changeAmount,
      shiftId: activeShift?.status === 'OPEN' ? activeShift.id : undefined,
      customerId: selectedCustomer?.id,
      timestamp: new Date().toISOString(),
      terminalId: activeTerminal.id,
      businessType: activeTerminal.businessType || activeTerminal.businessModel || activeTerminal.modelType,
      receiptNumber: receiptNumber,
      cashierName: activeUser?.name || 'Kasir',
    };

    processPayment(paymentPayload);

    if (selectedCustomer) {
      addAuditLog(
        `POS Checkout Member: "${selectedCustomer.name}" (${selectedCustomer.phone || selectedCustomer.id}) Struk #${receiptNumber} Total Rp ${grandTotal.toLocaleString('id-ID')} [Tier: ${getTierLabel(selectedPriceTier)}, Poin +${calculatedPoints}]`,
        'Customer Loyalty',
        'INFO'
      );
    }

    // Otomatis buka laci kasir jika metode pembayaran adalah TUNAI (CASH)
    if (paymentMethod === 'CASH') {
      triggerCashDrawer();
      showToast(
        language === 'ID'
          ? 'Sinyal pulsa buka laci kasir terkirim ke printer (Kas Fisik Laci)'
          : 'Cash drawer kick pulse signal sent to printer'
      );
    } else if (isCreditAr) {
      showToast(
        language === 'ID'
          ? `Transaksi Kredit / Tempo (AR) #${receiptNumber} Berhasil! Tagihan Piutang Usaha (1-10301) dicatat ke Finance.`
          : `Credit Sale (AR) #${receiptNumber} recorded! Accounts Receivable registered in Finance.`
      );
    } else if (paymentMethod === 'EDC_DEBIT') {
      showToast(
        language === 'ID'
          ? 'Transaksi EDC / Debit berhasil dicatat ke Penerimaan Bank.'
          : 'EDC / Debit sale recorded to Bank Settlement.'
      );
    }

    // Reset state & new receipt number (Buka Surat Jalan DO saat pembayaran selesai jika transaksi armada/bahan bangunan)
    const isBuildingTrx =
      deliveryMethod === 'FLEET_DELIVERY' ||
      isBuildingTerminal ||
      cart.some(
        (c) =>
          c.product.businessModel === 'building' ||
          (c.product.id || '').startsWith('MAT-') ||
          c.product.materialNature === 'BULK_CURAH'
      );

    if (isBuildingTrx) {
      setLastCompletedDoItems([...cart]);
      setLastDoReceiptNumber(receiptNumber);
      setIsDoModalOpen(true);
    }
    resetToNewTransaction();
    setIsPaymentConfirmOpen(false);
    if (!isCreditAr) {
      showToast(
        language === 'ID'
          ? `Transaksi selesai! Auto-Journal Kas Masuk [${paymentMethod === 'CASH' ? 'Kas Kasir / Laci' : 'Bank QRIS / Settlement'}] & Jurnal HPP dibukukan.`
          : `Sale completed! Auto-journal Cash In [${paymentMethod === 'CASH' ? 'Cash Drawer' : 'Bank Settlement'}] & COGS recorded.`
      );
    }
  };

  const isLight = theme === 'light';

  return (
    <div
      id="module-pos"
      className={`transition-all duration-200 ${
        isRegisterOpen
          ? `fixed inset-0 z-30 h-screen flex flex-col overflow-hidden p-3 ${
              isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#0d1117] text-white'
            }`
          : isFullscreen
          ? 'fixed inset-0 z-50 bg-[#0d1117] text-white p-3 sm:p-4 overflow-y-auto'
          : 'min-h-[calc(100vh-140px)] space-y-4 relative'
      }`}
    >
      {/* ========================================================= */}
      {/* 1. HALAMAN DEPAN: 10 TERMINAL KASIR MINIMALIS & BERSIH   */}
      {/* ========================================================= */}
      {!isRegisterOpen ? (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Top Cashier Bar Header & Global Controls */}
          <div
            className={`p-2.5 sm:p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2 mb-3 shadow-sm ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}
          >
            {/* Sisi Kiri: Badge [POS] + Judul "Terminal Kasir / Cashier Terminals" + Badge Industri */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-[#0052FF]/15 border border-[#0052FF]/40 text-[#0052FF] dark:text-[#58a6ff] flex items-center justify-center font-black text-xs shrink-0">
                POS
              </div>
              <h2
                className={`text-base font-black tracking-wide shrink-0 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {language === 'ID' ? 'Terminal Kasir' : 'Cashier Terminals'}
              </h2>
              {/* Badge Industri */}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 shrink-0 ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-[#0d1117] text-gray-300 border-[#30363d]'
                }`}
              >
                🏢 {businessProfile?.category || (language === 'ID' ? 'Modern Retail' : 'Modern Retail')}
              </span>
              {/* Badge Arsitektur Kasir Terpilih */}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 ${
                  (businessProfile?.cashierArchitecture || 'CENTRALIZED_FRONTEND') === 'CENTRALIZED_FRONTEND'
                    ? 'bg-blue-600/15 text-blue-400 border-blue-500/30'
                    : 'bg-cyan-600/15 text-cyan-300 border-cyan-500/30'
                }`}
                title={
                  (businessProfile?.cashierArchitecture || 'CENTRALIZED_FRONTEND') === 'CENTRALIZED_FRONTEND'
                    ? (language === 'ID' ? 'Kasir Terpusat (Front-End Only)' : 'Centralized Cashier (Front-End Only)')
                    : (language === 'ID' ? 'Hybrid (Front-End + Back-End Admin/Gudang)' : 'Hybrid (Front-End + Back-End Admin/Logistics)')
                }
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                <span>
                  {(businessProfile?.cashierArchitecture || 'CENTRALIZED_FRONTEND') === 'CENTRALIZED_FRONTEND'
                    ? (language === 'ID' ? 'Kasir Terpusat' : 'Centralized')
                    : 'Hybrid'}
                </span>
              </span>
            </div>

            {/* Sisi Kanan: Tombol Kunci/Buka Semua Kasir dan Tambah Terminal */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {/* Tombol Kunci / Buka Semua Kasir */}
              <button
                id="btn-toggle-all-lock"
                onClick={handleToggleAllTerminals}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  areAllLocked
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                }`}
              >
                {areAllLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>
                  {areAllLocked
                    ? language === 'ID'
                      ? 'Buka Semua'
                      : 'Unlock All'
                    : language === 'ID'
                    ? 'Kunci Semua'
                    : 'Lock All'}
                </span>
              </button>

              {/* Status Kuota Unit Kasir Terkunci (Super Admin Configuration) */}
              <div
                id="badge-pos-locked-quota"
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 select-none ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-[#0d1117] text-slate-300 border-[#30363d]'
                }`}
                title="Jumlah unit kasir aktif murni terkunci mengikuti konfigurasi Profil Entitas Usaha di Super Admin Console"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {language === 'ID'
                    ? `Kuota: ${businessProfile?.posUnitCount || 1} Kasir Aktif`
                    : `Quota: ${businessProfile?.posUnitCount || 1} Active Cashiers`}
                </span>
              </div>
            </div>
          </div>

          {/* CASHIER TERMINAL GRID (FILTERED BY INDUSTRY & UNIT COUNT) */}
          {(() => {
            // Helper filter industri dari BusinessEntityProfile
            const profileCat = (businessProfile?.category || '').toLowerCase();
            const allowedIndustry: TerminalIndustry | 'ALL' = (() => {
              if (profileCat.includes('multi-industry') || profileCat === '' || profileCat.includes('semua') || profileCat.includes('all')) {
                return 'ALL';
              }
              if (profileCat.includes('f&b') || profileCat.includes('restoran') || profileCat.includes('cafe') || profileCat.includes('kuliner')) {
                return 'fnb';
              }
              if (profileCat.includes('farmasi') || profileCat.includes('apotek') || profileCat.includes('pharmacy') || profileCat.includes('pet') || profileCat.includes('hewan')) {
                return 'pharmacy';
              }
              if (profileCat.includes('fashion') || profileCat.includes('butik') || profileCat.includes('busana') || profileCat.includes('apparel')) {
                return 'fashion';
              }
              if (profileCat.includes('elektronik') || profileCat.includes('gadget') || profileCat.includes('komputer') || profileCat.includes('electronics')) {
                return 'electronics';
              }
              if (profileCat.includes('bengkel') || profileCat.includes('otomotif') || profileCat.includes('automotive') || profileCat.includes('workshop')) {
                return 'workshop';
              }
              if (profileCat.includes('bangunan') || profileCat.includes('material') || profileCat.includes('depo') || profileCat.includes('building') || profileCat.includes('hardware')) {
                return 'building';
              }
              if (profileCat.includes('salon') || profileCat.includes('barber') || profileCat.includes('grooming')) {
                return 'salon';
              }
              if (profileCat.includes('modern retail') || profileCat.includes('supermarket') || profileCat.includes('minimarket') || profileCat.includes('retail') || profileCat.includes('ritel') || profileCat.includes('grosir')) {
                return 'retail';
              }
              return 'ALL'; // Fallback
            })();

            // 1. Ambil batas kuota kasir aktif dari Profil Bisnis (Super Admin & Tombol Tambah Terminal)
            const maxUnits = Math.max(1, Math.min(10, businessProfile?.posUnitCount ?? (allowedIndustry === 'ALL' ? 8 : 1)));

            // 2. Kloning Industri Toko (Bukan Urutan Modul):
            // Jika toko bertipe Modern Retail (atau industri spesifik lainnya), semua kartu kasir
            // (KASIR 01, KASIR 02, dst.) dikloning menggunakan tipe industri toko tersebut,
            // tanpa pernah menampilkan industri lain (seperti F&B).
            type DisplayedTerminalItem = {
              terminal: Terminal;
              theme: PosTerminalCardTheme;
            };

            const displayedItems: DisplayedTerminalItem[] = (() => {
              const isHybridMode =
                businessProfile?.cashierArchitecture === 'HYBRID_FRONT_BACK' ||
                businessProfile?.cashierArchitecture === 'HYBRID_FRONT_BACKEND';

              if (allowedIndustry === 'ALL') {
                return terminals.slice(0, maxUnits).map((rawTerm, idx) => {
                  const theme = POS_TERMINAL_CARD_THEMES[rawTerm.id] || {
                    emoji: '🛒',
                    icon: ShoppingCart,
                    iconColor: 'text-cyan-600 dark:text-cyan-400',
                    cardTitleId: 'JacS Kasir',
                    cardTitleEn: 'Cashier JacS',
                    subtitle: '(retail & wholesaler)',
                    businessModel: rawTerm.businessModel || 'Retail & Wholesaler Modern',
                    descId: 'Kasir ritel modern, toko kelontong, minimarket & grosir.',
                    descEn: 'Modern retail checkout, grocery store & wholesale.',
                    borderClass: 'border-cyan-500/40 hover:border-cyan-400',
                    buttonColor: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
                  };

                  const cfg = businessProfile?.terminalConfigs?.find((c) => c.id === rawTerm.id);
                  const effectiveRole = cfg?.role || rawTerm.role || (isHybridMode && idx === 1 ? 'HYBRID_BACKEND' : 'FRONT_END_ONLY');

                  return {
                    terminal: {
                      ...rawTerm,
                      businessModel: theme.businessModel,
                      location: theme.businessModel,
                      role: effectiveRole,
                      terminalType: effectiveRole === 'HYBRID_BACKEND' ? 'BACK_END' : 'FRONT_END',
                    },
                    theme,
                  };
                });
              }

              // Industri Spesifik Toko: Kloning template industri toko ke seluruh unit kasir aktif
              const tpl = INDUSTRY_CLONE_TEMPLATES[allowedIndustry] || INDUSTRY_CLONE_TEMPLATES.retail;

              return Array.from({ length: maxUnits }).map((_, idx) => {
                const slotNum = idx + 1;
                const numStr = String(slotNum).padStart(2, '0');
                const termId = `T-${numStr}`;
                const termCode = `POS-${numStr}`;
                const termName = `KASIR ${numStr}`;

                // Pertahankan status lock atau atribut runtime jika ada terminal yang tersimpan
                const existing = terminals.find((t) => t.id === termId) || terminals[idx];
                const cfg = businessProfile?.terminalConfigs?.find((c) => c.id === termId);
                const effectiveRole = cfg?.role || existing?.role || (isHybridMode && idx === 1 ? 'HYBRID_BACKEND' : 'FRONT_END_ONLY');

                const clonedTerminal: Terminal = {
                  id: termId,
                  name: termName,
                  code: termCode,
                  colorHex: tpl.colorHex,
                  neonBorderClass: tpl.neonBorderClass,
                  neonBgClass: tpl.neonBgClass,
                  neonTextClass: tpl.neonTextClass,
                  location: tpl.location,
                  isActive: existing ? existing.isActive : true,
                  activeOrdersToday: existing ? existing.activeOrdersToday : 0,
                  businessModel: tpl.businessModel,
                  businessType: tpl.businessModel,
                  subLabel: 'Data Master',
                  modelType: tpl.modelType,
                  isLocked: existing !== undefined ? Boolean(existing.isLocked) : true,
                  allowAllCategories: existing ? existing.allowAllCategories : false,
                  terminalType: effectiveRole === 'HYBRID_BACKEND' ? 'BACK_END' : 'FRONT_END',
                  role: effectiveRole,
                };

                const cardTheme: PosTerminalCardTheme = {
                  emoji: tpl.emoji,
                  icon: tpl.icon,
                  iconColor: tpl.iconColor,
                  cardTitleId: tpl.cardTitleId,
                  cardTitleEn: tpl.cardTitleEn,
                  subtitle: tpl.subtitle,
                  businessModel: tpl.businessModel,
                  descId: tpl.descId,
                  descEn: tpl.descEn,
                  borderClass: tpl.borderClass,
                  buttonColor: tpl.buttonColor,
                };

                return {
                  terminal: clonedTerminal,
                  theme: cardTheme,
                };
              });
            })();

            // 3. Susun container adaptif sesuai jumlah kasir aktif (1, 2, 3, 4+)
            const isSingle = displayedItems.length === 1;
            const isDouble = displayedItems.length === 2;

            const containerClass =
              isSingle
                ? 'w-full max-w-xl mx-auto py-8'
                : isDouble
                ? 'grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto py-4'
                : displayedItems.length === 3
                ? 'grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-6xl mx-auto py-2'
                : displayedItems.length === 4
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl mx-auto py-2'
                : 'grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full max-w-6xl mx-auto py-2';

            return (
              <div className={containerClass}>
                {displayedItems.map(({ terminal: term, theme }, tIdx) => {
                  // Status Kunci Terminal: Konsisten membaca dari AppContext / localStorage
                  const isLocked = Boolean(term.isLocked);
                  const isSelected = activeTerminal.id === term.id;
                  const cardTitle = language === 'EN' ? theme.cardTitleEn : theme.cardTitleId;
                  const cardDesc = language === 'EN' ? theme.descEn : theme.descId;
                  const isHybridUnit = term.role === 'HYBRID_BACKEND';

                  // Tentukan warna aksen per slot kasir: KASIR 01 = Cyan, KASIR 02 = Amber, KASIR 03 = Emerald, KASIR 04 = Purple
                  const match = term.id.match(/\d+/);
                  const slotIndex = match ? Math.max(0, parseInt(match[0], 10) - 1) : tIdx;
                  const accent = CASHIER_SLOT_ACCENTS[slotIndex % CASHIER_SLOT_ACCENTS.length];

                  // Styling proporsional adaptif (1 kartu besar, 2 kartu seimbang, 3-4 kartu rapi)
                  const cardPaddingClass = isSingle
                    ? 'p-6 sm:p-8 rounded-3xl min-h-[350px]'
                    : isDouble
                    ? 'p-5 sm:p-6 rounded-2xl min-h-[290px]'
                    : 'p-3.5 sm:p-4 rounded-2xl';

                  const iconBoxClass = isSingle
                    ? 'w-20 h-20 rounded-2xl mb-4 text-4xl'
                    : isDouble
                    ? 'w-16 h-16 rounded-2xl mb-3 text-3xl'
                    : 'w-12 h-12 rounded-xl mb-2 text-2xl';

                  const titleClass = isSingle
                    ? 'text-2xl font-black mb-1.5'
                    : isDouble
                    ? 'text-lg font-black mb-1'
                    : 'text-base font-black mb-0.5';

                  const subtitleClass = isSingle
                    ? 'text-sm font-bold text-slate-600 dark:text-slate-300'
                    : 'text-xs font-bold text-slate-600 dark:text-slate-300';

                  const buttonClass = isSingle
                    ? 'w-full mt-6 py-3 px-6 rounded-xl text-sm font-black'
                    : isDouble
                    ? 'w-full mt-4 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold'
                    : 'w-full mt-2 py-1.5 px-3 rounded-lg text-[11px] font-bold';

                  return (
                    <div
                      key={`term-${term.id}-${tIdx}`}
                      id={`card-terminal-${term.code.toLowerCase()}`}
                      onMouseEnter={() => setHoveredTerminalId(term.id)}
                      onMouseLeave={() => setHoveredTerminalId(null)}
                      onClick={() => {
                        handleTerminalCardClick(term);
                      }}
                      className={`relative border-2 ${cardPaddingClass} flex flex-col justify-between h-full select-none cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl ${
                        isLight ? accent.bgClassLight : accent.bgClassDark
                      } ${accent.borderClass} ${accent.glowClass} ${isSelected ? accent.ringClass : ''}`}
                    >
                      {/* Konten Atas: Baris Status & Terminal Code */}
                      <div>
                        <div className="flex items-center justify-between w-full mb-3 gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-black ${isSingle ? 'text-sm px-4 py-1.5' : 'text-xs px-3 py-1'} rounded-full border font-mono ${accent.badgeBg} ${accent.badgeText} ${accent.badgeBorder}`}>
                              {term.name}
                            </span>
                            {isHybridUnit && (
                              <span
                                className={`${isSingle ? 'text-xs px-2.5 py-1' : 'text-[10px] px-2 py-0.5'} font-black rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-mono tracking-tight shadow-xs`}
                                title="Kasir Front-End + Hak Akses Back-End Admin/ERP"
                              >
                                HYBRID BACK-END
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isLocked ? (
                              <span className={`text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 border border-amber-400 dark:border-amber-600 font-bold ${isSingle ? 'text-xs px-3.5 py-1.5' : 'text-xs px-3 py-1'} rounded-full flex items-center gap-1.5 font-mono`}>
                                <Lock className={`${isSingle ? 'w-3.5 h-3.5' : 'w-3 h-3'} text-amber-600 dark:text-amber-400`} />
                                {language === 'ID' ? 'TERKUNCI' : 'LOCKED'}
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className={`text-emerald-900 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400 dark:border-emerald-600 font-bold ${isSingle ? 'text-xs px-3.5 py-1.5' : 'text-xs px-3 py-1'} rounded-full flex items-center gap-1.5 font-mono`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  ONLINE
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTerminalLock(term.id, true);
                                    showToast(
                                      language === 'ID'
                                        ? `Terminal ${term.name} telah dikunci`
                                        : `Terminal ${term.name} is locked`
                                    );
                                  }}
                                  className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                                  title="Kunci Terminal ini"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Wadah Ikon Solid & Kontras Tegas Sesuai Aksen Kasir */}
                        <div className={`${iconBoxClass} ${isLight ? accent.iconBgLight : accent.iconBgDark} border-2 ${accent.iconBorder} shadow-sm flex items-center justify-center mx-auto`}>
                          <span
                            className={`font-black select-none ${accent.iconColor}`}
                            role="img"
                            aria-label={cardTitle}
                          >
                            {theme.emoji}
                          </span>
                        </div>

                        {/* Tipografi & Judul Kartu: Cashier JacS + Sub-judul peruntukan */}
                        <div className="text-center px-1 mb-1">
                          <h3 className={`${titleClass} text-slate-950 dark:text-white text-center tracking-tight`}>
                            {cardTitle}
                          </h3>
                          <p className={`${subtitleClass} text-center lowercase tracking-wide mt-0.5`}>
                            {theme.subtitle}
                          </p>
                          <div className="my-2 py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5">
                            <div className="font-bold flex items-center justify-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>Status: Standby</span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              Total Sesi: Rp 0 / 0 Transaksi
                            </div>
                          </div>
                          {isSingle ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                              {cardDesc}
                            </p>
                          ) : (
                            <p className="hidden">
                              {cardDesc}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Tombol Buka Terminal Sesuai Warna Aksen Unik */}
                      <div className="mt-auto">
                        {isLocked ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTerminalCardClick(term);
                            }}
                            className={`${buttonClass} transition-all text-center flex items-center justify-center gap-2 ${accent.buttonColor} cursor-pointer active:scale-95 shadow-md opacity-90 hover:opacity-100`}
                          >
                            <Unlock className={isSingle ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
                            <span>{language === 'ID' ? 'Buka PIN →' : 'Unlock PIN →'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTerminalCardClick(term);
                            }}
                            className={`${buttonClass} transition-all text-center flex items-center justify-center gap-2 ${accent.buttonColor} cursor-pointer active:scale-95 shadow-md`}
                          >
                            <span>{language === 'ID' ? (!activeUser ? 'Buka PIN →' : 'Buka Terminal →') : (!activeUser ? 'Unlock PIN →' : 'Open Terminal →')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. ARSITEKTUR LAYAR KERJA KASIR (ZERO SCROLL VIEWPORT 1 LAYAR PENUH)      */
        /* ========================================================================= */
        <div className="h-full flex flex-col overflow-hidden w-full">
          {/* ===================================================================== */}
          {/* BILAH ATAS: ULTRA-TIPIS SEJAJAR 1 BARIS HORIZONTAL (TINGGI MAX 48PX) */}
          {/* ===================================================================== */}
          <div
            id="bar-pos-top-control"
            className={`h-12 max-h-12 flex-shrink-0 mb-1.5 px-2.5 sm:px-3 rounded-xl border flex items-center justify-between gap-2 shadow-xs transition-colors select-none overflow-x-auto no-scrollbar ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}
          >
            {/* SISI KIRI: TOMBOL KELUAR, STATUS TERMINAL, INPUT BARCODE [F2], TOMBOL [F3 CARI], & TIER MINI */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Tombol Navigasi Kembali di Header Kasir (Pojok Paling Kiri) */}
              <button
                id="btn-back-to-terminals-top-left"
                type="button"
                onClick={handleCashierLogout}
                className={`px-3 py-1.5 rounded-xl border font-black text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm active:scale-95 ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 hover:text-slate-950'
                    : 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] text-gray-200 hover:text-white'
                }`}
                title="Keluar / Kembali ke Terminal Kasir"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#0052FF] dark:text-[#58a6ff]" />
                <span>{language === 'ID' ? 'Keluar / Ganti Kasir' : 'Exit / Switch Register'}</span>
              </button>

              {/* Badge Status Terminal & Online / Offline Mode */}
              <div className="flex items-center gap-1.5 shrink-0 pr-1">
                {isOnline ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="Scanner & Kasir Cloud Online" />
                    <span className="font-bold text-xs font-mono text-slate-800 dark:text-white hidden sm:inline">
                      {activeTerminal.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      ONLINE (Cloud Connected)
                    </span>
                    {offlineQueue.length > 0 && (
                      <button
                        type="button"
                        id="btn-pos-manual-sync-register-bar"
                        onClick={async () => {
                          const res = await syncOfflineTransactions();
                          showToast(res.message);
                        }}
                        className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-amber-500 hover:bg-amber-400 text-slate-900 transition cursor-pointer flex items-center gap-1 shadow-xs"
                        title="Kirim dan sinkronkan transaksi offline sekarang"
                      >
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        <span>Sinkronkan Sekarang (Sync Cloud) ({offlineQueue.length})</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shadow-[0_0_8px_rgba(245,158,11,0.8)]" title="Mode Offline Aktif" />
                    <span className="font-bold text-xs font-mono text-amber-500 dark:text-amber-300 hidden sm:inline">
                      {activeTerminal.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <WifiOff className="w-3 h-3 text-amber-400" />
                      OFFLINE MODE (Local Storage Active)
                    </span>
                    {offlineQueue.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-amber-500 text-slate-950">
                          [ {offlineQueue.length} Transaksi Tertunda ]
                        </span>
                        <button
                          type="button"
                          id="btn-pos-manual-sync-register-bar-offline"
                          onClick={async () => {
                            const res = await syncOfflineTransactions();
                            showToast(res.message);
                          }}
                          className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-amber-400 hover:bg-amber-300 text-slate-950 transition cursor-pointer flex items-center gap-1 shadow-xs"
                          title="Kirim dan sinkronkan transaksi offline sekarang"
                        >
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          <span>Sinkronkan Sekarang (Sync Cloud)</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
                <span className="text-[10px] text-gray-400 font-mono hidden xl:inline">• {language === 'EN' ? 'Master Data' : 'Data Master'}</span>
              </div>

              {/* Akses Menu ERP / Backend Khusus KASIR 02 (Hybrid Back-End) */}
              {(activeTerminal.role === 'HYBRID_BACKEND' ||
                activeTerminal.id === 'T-02' ||
                activeTerminal.code === 'POS-02' ||
                activeTerminal.code === 'KASIR-02' ||
                (businessProfile?.cashierArchitecture === 'HYBRID_FRONT_BACK' && activeTerminal.id === 'T-02')) && (
                <div className="relative shrink-0" ref={hybridMenuRef}>
                  <button
                    id="btn-pos-hybrid-erp-access"
                    type="button"
                    onClick={() => setIsHybridMenuOpen(!isHybridMenuOpen)}
                    className="px-2.5 py-1.5 rounded-xl border border-amber-500/80 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer active:scale-95 transition"
                    title="Akses Back-End / Menu ERP dengan Verifikasi PIN (Khusus Terminal Kasir 02 Hybrid)"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-950" />
                    <span className="font-extrabold tracking-tight">Menu Backend / ERP 🔐</span>
                    <ChevronDown className={`w-3 h-3 text-slate-950 transition-transform duration-200 ${isHybridMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu Akses ERP / Backend */}
                  {isHybridMenuOpen && (
                    <div
                      className={`absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl border-2 border-amber-500/50 shadow-2xl p-2.5 animate-in fade-in zoom-in-95 ${
                        isLight ? 'bg-white text-slate-900 shadow-amber-500/10' : 'bg-[#161b22] text-white shadow-black/80'
                      }`}
                    >
                      <div className="px-2 py-1.5 border-b border-amber-500/30 mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase font-mono tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" />
                            KASIR 02: AKSES HYBRID
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30">
                            PIN PROTECTED
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          Terminal kasir memiliki otorisasi ganda. Membuka modul ERP &amp; Administrasi memerlukan otentikasi PIN.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-1 text-xs">
                        {([
                          { id: 'dashboard' as ActiveNavModule, label: 'Dashboard Eksekutif', icon: LayoutDashboard, desc: 'Laporan omzet, laba & performa penjualan' },
                          { id: 'warehouse' as ActiveNavModule, label: 'Gudang & Inventori', icon: Boxes, desc: 'Manajemen stok, mutasi gudang & opname' },
                          { id: 'finance' as ActiveNavModule, label: 'Keuangan & Akuntansi', icon: Coins, desc: 'Buku kas, jurnal kasir & laporan keuangan' },
                          { id: 'purchasing' as ActiveNavModule, label: 'Pengadaan & Purchasing', icon: ShoppingCart, desc: 'Purchase Order, penerimaan barang & supplier' },
                          { id: 'hr' as ActiveNavModule, label: 'SDM & Personalia', icon: Users, desc: 'Absensi karyawan, shift kerja & payroll' },
                          { id: 'master-data' as ActiveNavModule, label: 'Master Data & Katalog', icon: Package, desc: 'Katalog SKU produk, barcode & harga grosir' },
                          { id: 'admin' as ActiveNavModule, label: 'Super Admin Console', icon: Building2, desc: 'Pengaturan entitas bisnis & arsitektur kasir' },
                        ] as const).map((mod) => {
                          const ModIcon = mod.icon;
                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => handleRequestHybridNavigation(mod)}
                              className={`w-full text-left p-2 rounded-xl border flex items-center gap-2.5 transition cursor-pointer ${
                                isLight
                                  ? 'hover:bg-amber-50/80 border-slate-200 hover:border-amber-400 text-slate-800'
                                  : 'hover:bg-[#21262d] border-[#30363d] hover:border-amber-500/50 text-slate-200'
                              }`}
                            >
                              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <ModIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-xs flex items-center justify-between">
                                  <span>{mod.label}</span>
                                  <ArrowRight className="w-3 h-3 opacity-60" />
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  {mod.desc}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Opsi Tampilkan Sidebar Menu ERP (Side-by-side) */}
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleRequestHybridNavigation({ id: 'admin' as ActiveNavModule, label: 'Navigasi Sidebar Menu ERP' })}
                          className="w-full py-1.5 px-2.5 rounded-xl font-bold text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <span>Tampilkan Sidebar Menu ERP</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Input Scan Barcode [F2] (Lebar Wajar w-56 sm:w-64) */}
              <form onSubmit={handleBarcodeSubmit} className="relative w-52 sm:w-64 shrink-0">
                <Barcode className="w-3.5 h-3.5 text-[#0052FF] dark:text-[#58a6ff] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder={language === 'ID' ? 'Scan Barcode [F2]...' : 'Scan Barcode [F2]...'}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !barcodeInput.trim()) {
                      e.preventDefault();
                      if (cart.length > 0 && !isFnbTerminal && !isFnbPhotoMenuMode) {
                        setPaymentMethod('CASH');
                        focusCashInput();
                      } else if (!isFnbTerminal && !isFnbPhotoMenuMode) {
                        showToast(language === 'ID' ? 'Keranjang belanja masih kosong!' : 'Cart is empty!');
                      }
                      return;
                    }
                    if (e.key === '*' || e.code === 'NumpadMultiply') {
                      e.preventDefault();
                      if (cart.length > 0) {
                        const lastIdx = cart.length - 1;
                        const inputEl = document.getElementById(`pos-qty-input-${lastIdx}`) as HTMLInputElement | null;
                        if (inputEl) {
                          inputEl.focus();
                          inputEl.select();
                        }
                      } else {
                        showToast(language === 'ID' ? 'Keranjang belanja masih kosong!' : 'Cart is empty!');
                      }
                    }
                  }}
                  className={`w-full text-xs pl-8 pr-12 py-1.5 rounded-lg outline-none font-medium border transition ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF] focus:bg-white'
                      : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                  }`}
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {barcodeInput && (
                    <button
                      type="button"
                      onClick={() => setBarcodeInput('')}
                      className="text-gray-400 hover:text-white p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <span className="px-1 py-0.2 rounded bg-blue-500/15 border border-blue-500/30 text-[#0052FF] dark:text-[#58a6ff] text-[9px] font-mono font-bold">
                    F2
                  </span>
                </div>
              </form>

              {/* Tombol [F3 Cari] */}
              <button
                type="button"
                onClick={() => setIsManualSearchOpen(true)}
                className="px-2.5 py-1.5 bg-[#0052FF] hover:bg-[#0043d1] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer shrink-0 active:scale-95"
                title="Cari Katalog Produk Manual [F3 / F1]"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cari</span>
                <span className="text-[10px] opacity-80 font-mono">[F3]</span>
              </button>

              {/* Toggle Switch 'Semua Kategori' (Buka Seluruh Katalog Multi-Industri) */}
              <div
                id="toggle-pos-all-categories"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs shrink-0 select-none transition ${
                  showAllCategories
                    ? isLight
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                      : 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300 shadow-xs'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] text-gray-400'
                }`}
                title={
                  showAllCategories
                    ? language === 'ID'
                      ? 'Mode SEMUA KATEGORI aktif: seluruh katalog produk terbuka. Klik untuk kembali ke filter terminal.'
                      : 'ALL CATEGORIES active: full catalog unlocked. Click to return to terminal filter.'
                    : language === 'ID'
                    ? `Filter kategori aktif: default industri [${activeTerminal.name}]. Klik untuk membuka SEMUA kategori.`
                    : `Active category filter: default industry [${activeTerminal.name}]. Click to unlock ALL categories.`
                }
              >
                <button
                  type="button"
                  role="switch"
                  aria-checked={showAllCategories}
                  onClick={() => {
                    const nextVal = !showAllCategories;
                    setShowAllCategories(nextVal);
                    showToast(
                      nextVal
                        ? language === 'ID'
                          ? '🌐 Mode "Semua Kategori" AKTIF: seluruh katalog produk terbuka'
                          : '🌐 "All Categories" ACTIVE: full product catalog unlocked'
                        : language === 'ID'
                        ? `🔒 Filter default industri terminal [${activeTerminal.name}] aktif kembali`
                        : `🔒 Terminal default industry filter [${activeTerminal.name}] restored`
                    );
                  }}
                  className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    showAllCategories ? 'bg-indigo-600' : isLight ? 'bg-slate-300' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      showAllCategories ? 'translate-x-3' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-[11px] font-bold hidden md:inline">
                  {language === 'ID' ? 'Semua Kategori' : 'All Categories'}
                </span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-mono font-black uppercase ${
                    showAllCategories
                      ? 'bg-indigo-500 text-white'
                      : isLight
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {showAllCategories ? 'ON' : 'OFF'}
                </span>
              </div>

              {/* Tombol Tier [Ecer] [Member] [Grosir] Berdampingan Langsung Tanpa Menindih Kolom Scan - KHUSUS RETAIL & WHOLESALER */}
              {isRetailWholesalerTerminal && (
                <div
                  className={`flex items-center p-0.5 rounded-lg border-2 gap-1 text-xs font-semibold shrink-0 ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                  }`}
                >
                {/* Ecer */}
                <button
                  type="button"
                  onClick={() => handleSelectPriceTier('RETAIL')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-black transition cursor-pointer border ${
                    selectedPriceTier === 'RETAIL'
                      ? 'bg-[#0052FF] text-white border-[#0052FF] shadow-xs'
                      : isLight
                      ? 'border-slate-300 text-slate-800 hover:bg-slate-200'
                      : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                  title="Tier 1: Harga Ecer / Retail"
                >
                  Ecer
                </button>

                {/* Member */}
                <button
                  type="button"
                  onClick={() => {
                    if (allowedTiers.includes('MEMBER')) {
                      handleSelectPriceTier('MEMBER');
                    } else {
                      showToast(
                        !selectedCustomer
                          ? 'Terkunci: Input No. HP Member untuk membuka harga Langganan'
                          : 'Member ini tidak berhak atas harga Langganan'
                      );
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-black transition flex items-center gap-1 border ${
                    selectedPriceTier === 'MEMBER'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : allowedTiers.includes('MEMBER')
                      ? isLight
                        ? 'bg-amber-50 text-amber-900 border-amber-400 hover:bg-amber-100 cursor-pointer'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 cursor-pointer'
                      : isLight
                      ? 'border-slate-400 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer'
                      : 'border-slate-600 bg-slate-800/80 text-slate-300 hover:bg-slate-700 cursor-pointer'
                  }`}
                  title={
                    allowedTiers.includes('MEMBER')
                      ? 'Tier 2: Harga Langganan / Member'
                      : 'Terkunci: Scan/Input Member terlebih dahulu'
                  }
                >
                  {allowedTiers.includes('MEMBER') ? (
                    <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-300" />
                  ) : (
                    <Lock className="w-2.5 h-2.5 text-slate-500" />
                  )}
                  <span>Member</span>
                </button>

                {/* Grosir */}
                <button
                  type="button"
                  onClick={() => {
                    if (allowedTiers.includes('WHOLESALE')) {
                      handleSelectPriceTier('WHOLESALE');
                    } else {
                      showToast(
                        !selectedCustomer
                          ? 'Terkunci: Harga Grosir khusus member pemilik toko terverifikasi'
                          : 'Member ini tidak memiliki hak harga Grosir / Toko'
                      );
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-black transition flex items-center gap-1 border ${
                    selectedPriceTier === 'WHOLESALE'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : allowedTiers.includes('WHOLESALE')
                      ? isLight
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-400 hover:bg-emerald-100 cursor-pointer'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30 cursor-pointer'
                      : isLight
                      ? 'border-slate-400 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer'
                      : 'border-slate-600 bg-slate-800/80 text-slate-300 hover:bg-slate-700 cursor-pointer'
                  }`}
                  title={
                    allowedTiers.includes('WHOLESALE')
                      ? 'Tier 3: Harga Grosir / Partai Besar'
                      : 'Terkunci: Khusus Member Mitra Toko Terverifikasi'
                  }
                >
                  {allowedTiers.includes('WHOLESALE') ? (
                    <Layers className="w-3 h-3 text-emerald-500 dark:text-emerald-300" />
                  ) : (
                    <Lock className="w-2.5 h-2.5 text-slate-500" />
                  )}
                  <span>Grosir</span>
                </button>
              </div>
            )}
            </div>

            {/* SISI KANAN: INPUT NO. HP MEMBER (KHUSUS RETAIL & WHOLESALER) DAN TOMBOL AKSI FUNGSI */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Customer Selector / Chip (Tersedia untuk Seluruh Transaksi POS) */}
              {selectedCustomer ? (
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs shrink-0 max-w-[210px] ${
                    selectedCustomer.has_store
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                      : isLight
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <div className="truncate">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-[11px] truncate leading-tight">
                        {selectedCustomer.name}
                      </span>
                      <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono font-bold shrink-0">
                        {selectedCustomer.points ?? 0} Pts
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-400 font-mono block leading-tight">
                      {selectedCustomer.store_name ? `${selectedCustomer.store_name} • ` : ''}{selectedCustomer.phone}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="p-0.5 rounded hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition cursor-pointer ml-0.5 shrink-0"
                    title="Lepas member (Kembali ke Pelanggan Umum / Walk-in)"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="relative flex items-center shrink-0 w-40 sm:w-48 lg:w-52" ref={customerDropdownRef}>
                  <UserCheck className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => handleCustomerSearchChange(e.target.value)}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    placeholder="Pelanggan / No. HP Member..."
                    className={`w-full text-xs pl-7 pr-6 py-1.5 rounded-lg outline-none font-medium border transition ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF] focus:bg-white'
                        : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                    }`}
                  />
                  {customerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCustomerSearchQuery('')}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {/* Dropdown Hasil Pencarian Member */}
                  {isCustomerDropdownOpen && (
                    <div
                      className={`absolute right-0 top-full mt-1.5 z-50 w-80 max-h-72 overflow-y-auto rounded-xl border shadow-2xl p-1.5 animate-in fade-in duration-100 ${
                        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                      }`}
                    >
                      {/* Opsi Default: Pelanggan Umum / Walk-in Customer */}
                      <button
                        type="button"
                        onClick={handleClearCustomer}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer mb-1 border-b ${
                          !selectedCustomer
                            ? 'bg-blue-500/15 border-blue-500/30 text-blue-300 font-bold'
                            : isLight
                            ? 'hover:bg-slate-100 border-slate-200 text-slate-800'
                            : 'hover:bg-[#21262d] border-gray-700/60 text-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400 shrink-0" />
                          <div>
                            <div className="font-bold text-xs flex items-center gap-1.5">
                              <span>Umum / Walk-in Customer</span>
                              {!selectedCustomer && (
                                <span className="text-[9px] text-cyan-400 font-mono font-bold">• AKTIF</span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400">Transaksi non-member reguler (Tier Retail)</div>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-700/50 text-slate-300 border border-slate-600/50 shrink-0">
                          Retail
                        </span>
                      </button>

                      <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Daftar Pelanggan & Member Toko ({customers.length})
                      </div>

                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((c, cIdx) => {
                          const rawTier = (c.memberTier || c.tier_level || 'Member').toUpperCase();
                          const isWholesale = rawTier.includes('GROSIR') || rawTier.includes('WHOLESALE') || c.has_store;
                          const isSelected = Boolean(selectedCustomer && (selectedCustomer as CustomerMaster).id === c.id);
                          return (
                            <button
                              key={`pos-cust-${c.id || c.code || 'cust'}-${cIdx}`}
                              type="button"
                              onClick={() => handleSelectCustomer(c)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                                isSelected
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                                  : isLight
                                  ? 'hover:bg-slate-100'
                                  : 'hover:bg-[#21262d]'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-bold truncate text-xs flex items-center gap-1.5">
                                  <span>{c.name}</span>
                                  {c.store_name && (
                                    <span className="text-[10px] text-cyan-400 font-medium">
                                      ({c.store_name})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                                  <span>{c.phone}</span>
                                  <span className="text-amber-400 font-bold">• {(c.points ?? 0).toLocaleString('id-ID')} Pts</span>
                                </div>
                              </div>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${
                                  isWholesale
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                }`}
                              >
                                {isWholesale ? 'Grosir' : 'Member'}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-xs text-gray-400">
                          Tidak ditemukan member dengan kata kunci tersebut.
                        </div>
                      )}

                      {/* Tombol Pendaftaran Cepat Member Baru */}
                      <div className="pt-1.5 mt-1 border-t border-gray-700/50">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomerDropdownOpen(false);
                            setIsNewCustomerModalOpen(true);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-[11px] font-bold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Daftarkan Pelanggan / Member Baru</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tombol Tahan Antrean (Hold Cart) */}
              <button
                type="button"
                id="btn-pos-hold-cart"
                onClick={handleOpenHoldModal}
                disabled={cart.length === 0}
                className={`px-2.5 py-1.5 rounded-lg border transition cursor-pointer shrink-0 flex items-center gap-1.5 text-[11px] font-bold ${
                  cart.length === 0
                    ? 'opacity-40 cursor-not-allowed border-slate-300 dark:border-slate-800 text-slate-400'
                    : isLight
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-xs'
                }`}
                title={language === 'ID' ? 'Tahan keranjang belanja pelanggan antre (Hold Cart)' : 'Hold customer cart'}
              >
                <Pause className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">{language === 'ID' ? 'Tahan (Hold)' : 'Hold Cart'}</span>
              </button>

              {/* Tombol Panggil Antrean (Recall Cart) */}
              <button
                type="button"
                id="btn-pos-recall-cart"
                onClick={() => setIsHeldOrdersModalOpen(true)}
                className={`px-2.5 py-1.5 rounded-lg border transition cursor-pointer shrink-0 flex items-center gap-1.5 text-[11px] font-bold ${
                  heldOrders.length > 0
                    ? isLight
                      ? 'bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-400 shadow-xs'
                      : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/50 shadow-xs'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-[#21262d] hover:bg-[#30363d] text-gray-300 border-gray-700'
                }`}
                title={language === 'ID' ? 'Panggil kembali antrean tertahan (Recall Cart)' : 'Recall held orders'}
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#0052FF] dark:text-[#58a6ff]" />
                <span>{language === 'ID' ? 'Recall' : 'Recall'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                  heldOrders.length > 0
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-300 dark:bg-gray-700 text-slate-800 dark:text-gray-300'
                }`}>
                  {heldOrders.length}
                </span>
              </button>

              {/* Promo & Diskon Voucher Ringkas */}
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(true)}
                className={`px-2 py-1.5 rounded-lg border-2 transition cursor-pointer shrink-0 flex items-center gap-1 text-[11px] font-bold ${
                  calculatedDiscount > 0
                    ? 'bg-amber-500 text-black border-amber-600 font-black shadow-xs'
                    : isLight
                    ? 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : 'border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                }`}
                title="Voucher Promo & Diskon"
              >
                <Tag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Promo</span>
                {calculatedDiscount > 0 && (
                  <span className="text-[10px] font-mono font-black">
                    (-{calculatedDiscount.toLocaleString('id-ID')})
                  </span>
                )}
              </button>

              {/* [F12 Laci] Buka Laci Kasir */}
              <button
                id="btn-open-cash-drawer"
                type="button"
                onClick={handleManualOpenDrawer}
                className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
                title="Buka Laci Kasir (F12) - ESC/POS Pulsa"
              >
                <Inbox className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden md:inline">Laci</span>
                <span className="font-mono text-[9px] opacity-80">[F12]</span>
              </button>

              {/* STATUS SHIFT KASIR (APS POS4: 32_ShiftKasir) */}
              {activeShift ? (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-mono shrink-0 shadow-xs ${
                    isLight
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                      : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  }`}
                  title={`ID Shift: ${activeShift.id}\nPetugas: ${activeShift.cashierName}\nModal Awal: Rp ${activeShift.initialCash.toLocaleString('id-ID')}\nPenjualan Tunai: Rp ${activeShift.totalCashSales.toLocaleString('id-ID')}\nKas Keluar: Rp ${activeShift.totalExpenses.toLocaleString('id-ID')}\nEstimasi Kas Laci: Rp ${activeShift.expectedCashInDrawer.toLocaleString('id-ID')}`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="font-bold text-[10px]">
                    SHIFT #{activeShift.id.split('-').pop()}
                  </span>
                  <span className="opacity-40">|</span>
                  <span className="text-[10px] hidden xl:inline text-gray-400">
                    Modal: Rp {(activeShift.initialCash / 1000).toLocaleString('id-ID')}k
                  </span>
                  <span className="opacity-40 hidden xl:inline">|</span>
                  <span className="font-black text-emerald-400">
                    Laci: Rp {activeShift.expectedCashInDrawer.toLocaleString('id-ID')}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsOpenShiftModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0 animate-pulse"
                  title="Shift kasir belum dibuka! Klik untuk input saldo modal kas awal"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Buka Shift</span>
                </button>
              )}

              {/* [Tarik Kas / Petty Cash Keluar] Quick Action Button */}
              <button
                id="btn-pos-petty-cash"
                type="button"
                onClick={() => {
                  if (!activeShift) {
                    showToast('Buka shift kasir terlebih dahulu sebelum menarik kas!');
                    setIsOpenShiftModalOpen(true);
                    return;
                  }
                  setIsPettyCashModalOpen(true);
                }}
                className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 ${
                  isLight
                    ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                }`}
                title="Tarik Kas / Petty Cash Keluar untuk Pengeluaran Darurat Kasir (cth: beli plastik/es)"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Tarik Kas</span>
                <span className="text-[9px] opacity-80 font-mono hidden lg:inline">[Petty]</span>
              </button>

              {/* [Tutup Shift / End of Day] Header Action Button */}
              <button
                id="btn-pos-close-shift"
                type="button"
                onClick={() => {
                  if (!activeShift) {
                    showToast('Tidak ada shift kasir yang sedang aktif.');
                    setIsOpenShiftModalOpen(true);
                    return;
                  }
                  setIsCloseShiftModalOpen(true);
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-black flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm ${
                  isLight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700'
                    : 'bg-indigo-600/90 hover:bg-indigo-500 text-white border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                }`}
                title="Tutup Shift & Rekonsiliasi Kas (Cash Drawer Closing)"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Tutup Shift & Rekonsiliasi</span>
                <span className="text-[9px] opacity-80 hidden md:inline">[Closing]</span>
              </button>

              {/* [Batal] / Void */}
              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0) setIsVoidConfirmOpen(true);
                }}
                disabled={cart.length === 0}
                className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 ${
                  cart.length === 0
                    ? 'opacity-40 cursor-not-allowed border-transparent text-gray-500'
                    : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-500'
                }`}
                title="Batal Transaksi / Void"
              >
                <Ban className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Batal</span>
              </button>

              {/* Mode Gelap/Terang */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`p-1.5 rounded-lg border transition cursor-pointer shrink-0 ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] text-gray-300'
                }`}
                title={isLight ? 'Ganti ke Mode Gelap' : 'Ganti ke Mode Terang'}
              >
                {isLight ? <Moon className="w-3.5 h-3.5 text-blue-600" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              </button>

              {/* Tombol Logout Kasir & Kembali ke Daftar Terminal */}
              <button
                id="btn-back-to-terminals"
                type="button"
                onClick={handleCashierLogout}
                className={`px-2.5 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 active:scale-95 ${
                  isLight
                    ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                    : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400'
                }`}
                title={language === 'ID' ? 'Logout Kasir & Kembali ke Terminal' : 'Logout Cashier & Exit Register'}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'ID' ? 'Logout Kasir' : 'Logout'}</span>
              </button>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* AREA TENGAH: SPLIT VIEW 2-KOLOM (F&B) ATAU TABEL SKU (RETAIL)         */}
          {/* ===================================================================== */}
          <div className={`flex-1 min-h-0 mb-1 flex flex-col ${isFnbPhotoMenuMode ? 'overflow-hidden' : 'overflow-y-auto'}`}>
              {/* JIKA MODE F&B MENU BERGAMBAR AKTIF (SPLIT VIEW 2-KOLOM: 65% KATALOG & 35% KERANJANG/BAYAR) */}
              {isFnbPhotoMenuMode ? (
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 overflow-hidden h-full">
                  {/* KOLOM KIRI (65% LEBAR LAYAR): KATALOG MENU & KATEGORI */}
                  <div className="w-full lg:w-[65%] flex flex-col h-full min-h-0 overflow-hidden">
                    {/* F&B Search & KOT Button Bar */}
                    <div className={`p-2.5 rounded-xl border flex flex-col gap-2 mb-2 shrink-0 ${
                      isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#161b22] border-[#30363d]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            placeholder={
                              language === 'ID'
                                ? 'Cari nama masakan, minuman, kopi, snack...'
                                : 'Search dishes, coffee, beverages, snacks...'
                            }
                            value={fnbSearchQuery}
                            onChange={(e) => setFnbSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const firstAvailable = filteredFnbProducts.find((p) => (p.stock ?? 0) > 0) || filteredFnbProducts[0];
                                if (firstAvailable && (firstAvailable.stock ?? 0) > 0) {
                                  setSelectedFnbProduct(firstAvailable);
                                  setIsFnbModalOpen(true);
                                }
                              }
                            }}
                            className={`w-full text-xs pl-9 pr-3 py-2 rounded-xl outline-none border transition ${
                              isLight
                                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white'
                                : 'bg-[#0d1117] border-[#30363d] text-white focus:border-emerald-500'
                            }`}
                          />
                        </div>

                        {/* Tombol Kirim Dapur / Cetak KOT */}
                        <button
                          id="btn-open-kot-modal-top"
                          type="button"
                          onClick={() => setIsKotModalOpen(true)}
                          disabled={cart.length === 0}
                          className={`px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 ${
                            cart.length === 0
                              ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20'
                          }`}
                          title="Kirim ke Dapur / Cetak KOT"
                        >
                          <ChefHat className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {language === 'ID' ? 'KOT Dapur' : 'Print KOT'}
                          </span>
                        </button>
                      </div>

                      {/* Category Filter Chips & Toggle Semua Kategori */}
                      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 no-scrollbar text-xs">
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                          {fnbCategories.map((cat, catIdx) => (
                            <button
                              key={`fnb-cat-${cat}-${catIdx}`}
                              onClick={() => setSelectedFnbCategory(cat)}
                              className={`px-3 py-1 rounded-xl whitespace-nowrap font-bold text-xs transition cursor-pointer ${
                                selectedFnbCategory === cat
                                  ? 'bg-emerald-500 text-black shadow-xs'
                                  : isLight
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                                  : 'bg-[#0d1117] text-gray-400 hover:text-white border border-[#30363d]'
                              }`}
                            >
                              {cat === 'ALL'
                                ? language === 'ID'
                                  ? 'Semua Menu'
                                  : 'All Menu'
                                : cat}
                            </button>
                          ))}
                        </div>

                        {/* Toggle Switch 'Semua Kategori' */}
                        <button
                          type="button"
                          onClick={() => {
                            const next = !showAllCategories;
                            setShowAllCategories(next);
                            showToast(
                              next
                                ? (language === 'ID' ? '🌐 Menampilkan seluruh katalog' : '🌐 All categories unlocked')
                                : (language === 'ID' ? '🔒 Filter default F&B (Makanan/Minuman/Snack) aktif' : '🔒 Default F&B filter restored')
                            );
                          }}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-bold shrink-0 transition cursor-pointer ${
                            showAllCategories
                              ? isLight ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-indigo-950/60 border-indigo-500/60 text-indigo-300'
                              : isLight ? 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200' : 'bg-[#0d1117] border-[#30363d] text-gray-400 hover:text-gray-200'
                          }`}
                          title="Buka / Kunci seluruh kategori katalog"
                        >
                          <span>{language === 'ID' ? 'Semua Kategori' : 'All Categories'}</span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-black ${
                            showAllCategories ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300'
                          }`}>
                            {showAllCategories ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* DAFTAR MENU BERGAMBAR: KOMPAK GRID 3-4 KOLOM, SCROLL VERTIKAL MANDIRI (max-h-[calc(100vh-160px)]) */}
                    <div className="flex-1 min-h-0 overflow-y-auto max-h-[calc(100vh-160px)] pr-1 scroll-smooth">
                      {filteredFnbProducts.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                          <UtensilsCrossed className="w-10 h-10 opacity-30" />
                          <p className="text-xs font-semibold">Tidak ada menu yang sesuai kriteria pencarian</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 pb-3 auto-rows-fr">
                          {filteredFnbProducts.map((product, pIdx) => {
                            const isOutOfStock = (product.stock ?? 0) <= 0;
                            return (
                              <div
                                key={`fnb-prod-${product.id || product.barcode || 'prod'}-${pIdx}`}
                                id={`fnb-card-${product.id}`}
                                onClick={() => {
                                  if (!isOutOfStock) {
                                    setSelectedFnbProduct(product);
                                    setIsFnbModalOpen(true);
                                  }
                                }}
                                className={`group rounded-2xl border flex flex-col h-full justify-between overflow-hidden transition cursor-pointer hover:shadow-md active:scale-[0.98] ${
                                  isLight
                                    ? 'bg-white border-slate-200 hover:border-emerald-500 shadow-xs'
                                    : 'bg-[#161b22] border-[#30363d] hover:border-emerald-500'
                                } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {/* 1. Kontainer Gambar Menu (Terkunci & Overflow Hidden) */}
                                <div className="relative h-24 sm:h-28 max-h-28 w-full overflow-hidden bg-slate-100 dark:bg-[#0d1117] shrink-0">
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                                      <UtensilsCrossed className="w-6 h-6" />
                                    </div>
                                  )}

                                  {/* Badge Kategori - Terkunci Rapi di Dalam Frame Gambar */}
                                  <div className="absolute top-2 left-2 max-w-[65%] z-10 pointer-events-none">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-black/80 text-emerald-300 px-2 py-0.5 rounded-md backdrop-blur-xs border border-emerald-500/40 shadow-xs truncate block">
                                      {product.category}
                                    </span>
                                  </div>

                                  {/* Badge Stok - Terkunci Rapi di Dalam Frame Gambar */}
                                  <div className="absolute top-2 right-2 z-10 pointer-events-none">
                                    <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-xs shadow-xs ${
                                      isOutOfStock
                                        ? 'bg-rose-900/90 text-rose-100 border border-rose-500/60'
                                        : (product.stock ?? 0) <= 10
                                        ? 'bg-amber-900/90 text-amber-100 border border-amber-500/60'
                                        : 'bg-black/80 text-slate-100 border border-white/20'
                                    }`}>
                                      {isOutOfStock ? 'Habis' : `Stok: ${product.stock}`}
                                    </span>
                                  </div>
                                </div>

                                {/* 2. Kontainer Teks Terpisah di Bawah Gambar */}
                                <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1 gap-2 bg-inherit">
                                  <div>
                                    <h4
                                      title={product.name}
                                      className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 min-h-[2.5rem] leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition"
                                    >
                                      {product.name}
                                    </h4>
                                  </div>

                                  <div className="pt-2 border-t border-slate-200/80 dark:border-[#30363d]/80 flex items-center justify-between mt-auto">
                                    <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                      Rp {product.sell_price.toLocaleString('id-ID')}
                                    </div>
                                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 flex items-center justify-center transition font-black text-xs shrink-0 shadow-xs">
                                      <Plus className="w-3.5 h-3.5" />
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* KOLOM KANAN (35% LEBAR LAYAR): PANEL KERANJANG BELANJA & PEMBAYARAN STICKY */}
                  <div className={`w-full lg:w-[35%] flex flex-col h-full max-h-[calc(100vh-160px)] rounded-2xl border shadow-sm overflow-hidden shrink-0 ${
                    isLight ? 'bg-white border-slate-300' : 'bg-[#161b22] border-[#30363d]'
                  }`}>
                    {/* Header Keranjang Belanja */}
                    <div className={`px-3 py-2 border-b flex items-center justify-between text-xs shrink-0 ${
                      isLight ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-[#0d1117] text-gray-200 border-[#30363d]'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold">
                        <ShoppingBag className="w-4 h-4 text-[#0052FF] dark:text-[#58a6ff]" />
                        <span className="font-black text-xs sm:text-sm">Keranjang</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-black border border-blue-300 dark:border-blue-700">
                          {cart.length} SKU • {totalCartItemCount} Pcs
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleOpenHoldModal}
                          disabled={cart.length === 0}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                            cart.length === 0
                              ? 'opacity-40 cursor-not-allowed border-transparent text-slate-400'
                              : isLight
                              ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                          }`}
                          title="Tahan keranjang pesanan meja/pelanggan (Hold Cart)"
                        >
                          <Pause className="w-2.5 h-2.5" />
                          <span>Hold</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsHeldOrdersModalOpen(true)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                            heldOrders.length > 0
                              ? isLight
                                ? 'bg-blue-100 text-blue-900 border-blue-300 font-black'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-black'
                              : isLight
                              ? 'text-slate-600 border-slate-300'
                              : 'text-gray-400 border-gray-700'
                          }`}
                          title="Panggil pesanan tertahan (Recall Cart)"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Recall ({heldOrders.length})</span>
                        </button>

                        {cart.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsVoidConfirmOpen(true)}
                            className="text-rose-500 hover:text-rose-600 font-bold text-[11px] flex items-center gap-1 cursor-pointer ml-1"
                            title="Batalkan / Kosongkan Keranjang"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Kosongkan</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bar Pemilih Pelanggan & Tier Transaksi POS Terintegrasi */}
                    {selectedCustomer ? (
                      <div className={`px-3 py-2 border-b flex items-center justify-between gap-2 shrink-0 ${
                        selectedCustomer.has_store
                          ? isLight
                            ? 'bg-emerald-50/80 border-emerald-200'
                            : 'bg-emerald-950/30 border-emerald-800/50'
                          : isLight
                          ? 'bg-blue-50/80 border-blue-200'
                          : 'bg-blue-950/30 border-blue-800/50'
                      }`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                            selectedCustomer.has_store
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#0052FF] text-white'
                          }`}>
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                                {selectedCustomer.name}
                              </span>
                              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border uppercase shrink-0 ${
                                selectedPriceTier === 'WHOLESALE'
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                                  : selectedPriceTier === 'MEMBER'
                                  ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40'
                                  : 'bg-slate-200 text-slate-700 border-slate-300'
                              }`}>
                                {selectedPriceTier === 'WHOLESALE' ? 'Tier Grosir' : selectedPriceTier === 'MEMBER' ? 'Tier Member' : 'Tier Retail'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-gray-400 font-mono flex items-center gap-2">
                              <span>{selectedCustomer.store_name ? `${selectedCustomer.store_name} • ` : ''}{selectedCustomer.phone}</span>
                              <span className="text-amber-500 dark:text-amber-300 font-bold">
                                ★ {(selectedCustomer.points ?? 0).toLocaleString('id-ID')} Pts
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" ref={cartCustomerDropdownRef}>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCartCustomerDropdownOpen(!isCartCustomerDropdownOpen);
                                setCustomerSearchQuery('');
                              }}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                              title="Ganti Pelanggan / Member"
                            >
                              Ganti
                            </button>

                            {/* Dropdown Ganti Member */}
                            {isCartCustomerDropdownOpen && (
                              <div className={`absolute right-0 top-full mt-1.5 z-50 w-72 sm:w-80 max-h-72 overflow-y-auto rounded-xl border shadow-2xl p-2 animate-in fade-in duration-100 ${
                                isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300' : 'bg-[#161b22] border-[#30363d] text-white shadow-black'
                              }`}>
                                <div className="relative mb-2">
                                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  <input
                                    autoFocus
                                    type="text"
                                    value={customerSearchQuery}
                                    onChange={(e) => handleCustomerSearchChange(e.target.value)}
                                    placeholder="Cari nama, No. HP, atau kode..."
                                    className={`w-full text-xs pl-7 pr-6 py-1.5 rounded-lg outline-none font-medium border ${
                                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                                    }`}
                                  />
                                  {customerSearchQuery && (
                                    <button
                                      type="button"
                                      onClick={() => setCustomerSearchQuery('')}
                                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5 cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={handleClearCustomer}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer mb-1 border-b ${
                                    isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-[#21262d] text-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <div>
                                      <span className="font-bold text-xs block">Umum / Walk-in Customer</span>
                                      <span className="text-[10px] text-gray-400">Non-member reguler (Tier Retail)</span>
                                    </div>
                                  </div>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-700/50 text-slate-300">
                                    Retail
                                  </span>
                                </button>

                                <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                  Daftar Member ({customers.length})
                                </div>

                                {filteredCustomers.length > 0 ? (
                                  filteredCustomers.map((c, cIdx) => {
                                    const rawTier = (c.memberTier || c.tier_level || 'Member').toUpperCase();
                                    const isWholesale = rawTier.includes('GROSIR') || rawTier.includes('WHOLESALE') || c.has_store;
                                    return (
                                      <button
                                        key={`cart-cust-switch-${c.id}-${cIdx}`}
                                        type="button"
                                        onClick={() => handleSelectCustomer(c)}
                                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                                          selectedCustomer?.id === c.id
                                            ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                                            : isLight ? 'hover:bg-slate-100 text-slate-900' : 'hover:bg-[#21262d] text-gray-200'
                                        }`}
                                      >
                                        <div className="min-w-0 pr-2">
                                          <div className="font-bold truncate text-xs flex items-center gap-1">
                                            <span>{c.name}</span>
                                            {c.store_name && (
                                              <span className="text-[10px] text-cyan-500 font-normal">
                                                ({c.store_name})
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                                            <span>{c.phone}</span>
                                            <span className="text-amber-400 font-bold">★ {(c.points ?? 0).toLocaleString('id-ID')} Pts</span>
                                          </div>
                                        </div>
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${
                                          isWholesale
                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                            : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                                        }`}>
                                          {isWholesale ? 'Grosir' : 'Member'}
                                        </span>
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className="p-3 text-center text-xs text-gray-400">
                                    Tidak ditemukan member yang cocok
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={handleClearCustomer}
                            className="px-1.5 py-1 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition cursor-pointer"
                            title="Lepas Member (Kembali ke Umum / Walk-in)"
                          >
                            ✕ Umum
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`px-3 py-2 border-b flex items-center justify-between gap-2 shrink-0 ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                      }`} ref={cartCustomerDropdownRef}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-gray-400 flex items-center justify-center font-bold text-xs shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-800 dark:text-gray-200">
                                Umum / Walk-in Customer
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-gray-300 border border-slate-300 dark:border-slate-700">
                                Retail
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 block">Transaksi non-member reguler</span>
                          </div>
                        </div>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCartCustomerDropdownOpen(!isCartCustomerDropdownOpen);
                              setCustomerSearchQuery('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-black bg-[#0052FF] text-white hover:bg-blue-600 flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
                            title="Pilih atau cari member pelanggan"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>+ Pilih Member</span>
                          </button>

                          {/* Dropdown Menu di Panel Keranjang */}
                          {isCartCustomerDropdownOpen && (
                            <div className={`absolute right-0 top-full mt-1.5 z-50 w-72 sm:w-80 max-h-72 overflow-y-auto rounded-xl border shadow-2xl p-2 animate-in fade-in duration-100 ${
                              isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300' : 'bg-[#161b22] border-[#30363d] text-white shadow-black'
                            }`}>
                              <div className="relative mb-2">
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  autoFocus
                                  type="text"
                                  value={customerSearchQuery}
                                  onChange={(e) => handleCustomerSearchChange(e.target.value)}
                                  placeholder="Cari nama, No. HP, atau kode..."
                                  className={`w-full text-xs pl-7 pr-6 py-1.5 rounded-lg outline-none font-medium border ${
                                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                                  }`}
                                />
                                {customerSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => setCustomerSearchQuery('')}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              {/* Opsi Default: Umum / Walk-in Customer */}
                              <button
                                type="button"
                                onClick={handleClearCustomer}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer mb-1 border-b ${
                                  !selectedCustomer
                                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-400 font-bold'
                                    : isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-[#21262d] text-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <div>
                                    <span className="font-bold text-xs block">Umum / Walk-in Customer</span>
                                    <span className="text-[10px] text-gray-400">Non-member reguler (Tier Retail)</span>
                                  </div>
                                </div>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-700/50 text-slate-300">
                                  Retail
                                </span>
                              </button>

                              <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Daftar Member Master ({customers.length})
                              </div>

                              {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((c, cIdx) => {
                                  const rawTier = (c.memberTier || c.tier_level || 'Member').toUpperCase();
                                  const isWholesale = rawTier.includes('GROSIR') || rawTier.includes('WHOLESALE') || c.has_store;
                                  return (
                                    <button
                                      key={`cart-cust-item-${c.id}-${cIdx}`}
                                      type="button"
                                      onClick={() => handleSelectCustomer(c)}
                                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                                        Boolean(selectedCustomer && (selectedCustomer as CustomerMaster).id === c.id)
                                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                                          : isLight ? 'hover:bg-slate-100 text-slate-900' : 'hover:bg-[#21262d] text-gray-200'
                                      }`}
                                    >
                                      <div className="min-w-0 pr-2">
                                        <div className="font-bold truncate text-xs flex items-center gap-1">
                                          <span>{c.name}</span>
                                          {c.store_name && (
                                            <span className="text-[10px] text-cyan-500 font-normal">
                                              ({c.store_name})
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                                          <span>{c.phone}</span>
                                          <span className="text-amber-400 font-bold">★ {(c.points ?? 0).toLocaleString('id-ID')} Pts</span>
                                        </div>
                                      </div>
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${
                                        isWholesale
                                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                          : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                                      }`}>
                                        {isWholesale ? 'Grosir' : 'Member'}
                                      </span>
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="p-3 text-center text-xs text-gray-400">
                                  Tidak ditemukan member yang cocok
                                </div>
                              )}

                              <div className="pt-1.5 mt-1 border-t border-gray-700/50">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsCartCustomerDropdownOpen(false);
                                    setIsNewCustomerModalOpen(true);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded-lg text-[11px] font-bold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Daftarkan Pelanggan / Member Baru</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Daftar Item Keranjang Belanja (Scrollable Vertikal) */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5 divide-y divide-slate-100 dark:divide-[#30363d]/40">
                      {cart.length === 0 ? (
                        <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-4 text-gray-400 space-y-2">
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-[#0052FF] dark:text-[#58a6ff]">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Keranjang Belanja Kosong</p>
                          <p className="text-[11px] text-gray-400">Pilih menu dari katalog (kiri) atau gunakan scan barcode [F2]</p>
                        </div>
                      ) : (
                        cart.map((item, idx) => {
                          const isSelected = idx === selectedCartIndex;
                          return (
                            <div
                              key={`cart-item-${item.product.id}-${idx}`}
                              id={`fnb-cart-row-${idx}`}
                              onClick={() => setSelectedCartIndex(idx)}
                              className={`p-2 rounded-xl transition cursor-pointer border ${
                                isSelected
                                  ? 'bg-emerald-500/15 dark:bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/70 shadow-sm'
                                  : isLight
                                  ? 'border-transparent hover:bg-slate-100/80'
                                  : 'border-transparent hover:bg-[#21262d]'
                              } flex flex-col gap-1 text-xs`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0 flex-1">
                                  {(() => {
                                    const isRacikan =
                                      (item.product?.id || '').startsWith('RCK-') ||
                                      (item.product?.barcode || '').startsWith('RCK-') ||
                                      item.product?.pharmacyClass === 'RACIKAN' ||
                                      item.product?.category === 'FARMASI_RACIKAN';

                                    const isObatKeras =
                                      item.product?.pharmacyClass === 'OBAT_KERAS' ||
                                      (item.product?.category || '').toLowerCase().includes('keras') ||
                                      (item.product?.id || '').startsWith('MED-');

                                    const signaText = item.signa || item.product?.signa;

                                    return (
                                      <>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {isObatKeras && (
                                            <span
                                              className="w-4 h-4 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 border border-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                                              title="Obat Keras (K)"
                                            >
                                              K
                                            </span>
                                          )}
                                          <span className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                                            {item.product.name}
                                          </span>
                                          {isRacikan && (
                                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-purple-900/60 text-purple-300 border border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.4)] shrink-0">
                                              [KODE: {item.product.barcode || item.product.id}]
                                            </span>
                                          )}
                                          {isSelected && (
                                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500 text-black shrink-0 tracking-wider">
                                              AKTIF [↑↓]
                                            </span>
                                          )}
                                        </div>
                                      </>
                                    );
                                  })()}
                                  {item.modifiers && (
                                    <span className="text-[10px] text-amber-500 block truncate font-medium">
                                      {item.modifiers.orderType} • Meja {item.modifiers.tableNumber || '-'}
                                      {item.modifiers.spicyLevel !== undefined && ` • Lvl ${item.modifiers.spicyLevel}`}
                                      {item.modifiers.notes && ` (${item.modifiers.notes})`}
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono font-black text-xs text-slate-950 dark:text-emerald-400 shrink-0">
                                  Rp {item.subtotal.toLocaleString('id-ID')}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] text-gray-400 font-mono">
                                  @ Rp {item.product.sell_price.toLocaleString('id-ID')}
                                </span>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateQty(idx, -1);
                                    }}
                                    className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-700 dark:text-gray-300 flex items-center justify-center text-xs font-black transition cursor-pointer"
                                    title="Kurangi Qty [-]"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>

                                  <input
                                    id={`pos-qty-input-${idx}`}
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleDirectQtyChange(idx, Number(e.target.value))}
                                    onFocus={(e) => {
                                      e.target.select();
                                      setSelectedCartIndex(idx);
                                    }}
                                    className={`w-9 text-center font-mono font-bold text-xs py-0.5 rounded border ${
                                      isLight
                                        ? 'bg-white border-slate-300 text-slate-900'
                                        : 'bg-[#0d1117] border-[#30363d] text-white'
                                    } outline-none focus:border-[#0052FF]`}
                                  />

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateQty(idx, 1);
                                    }}
                                    className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500 hover:text-black text-slate-700 dark:text-gray-300 flex items-center justify-center text-xs font-black transition cursor-pointer"
                                    title="Tambah Qty [+]"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRequestRemoveItem(idx);
                                    }}
                                    className="p-1 rounded text-rose-500 hover:bg-rose-500/15 transition cursor-pointer ml-1"
                                    title={language === 'ID' ? 'Hapus Baris Item (Otorisasi Supervisor) [Delete]' : 'Void Line Item (Supervisor Approval) [Delete]'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Panel Finansial & Pembayaran Terintegrasi (Sticky Bagian Bawah Kolom Kanan) */}
                    <div className={`p-2.5 border-t-2 space-y-2 shrink-0 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                    }`}>
                      {/* Ringkasan Pelanggan, Tier & Poin Loyalitas */}
                      <div className={`p-2 rounded-xl border text-[11px] space-y-1.5 ${
                        selectedCustomer
                          ? isLight
                            ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                            : 'bg-blue-950/30 border-blue-800/40 text-blue-200'
                          : isLight
                          ? 'bg-slate-100/80 border-slate-200 text-slate-700'
                          : 'bg-slate-900/40 border-slate-800 text-gray-300'
                      }`}>
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-[#0052FF] dark:text-[#58a6ff]" />
                            <span>Pelanggan & Tier:</span>
                          </span>
                          <span className="font-mono">
                            {selectedCustomer
                              ? `${selectedCustomer.name} (${getTierLabel(selectedPriceTier)})`
                              : 'Umum / Walk-in (Retail)'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Poin Loyalitas:</span>
                          </span>
                          {selectedCustomer ? (
                            <div className="font-mono text-right">
                              <span className="font-extrabold text-amber-600 dark:text-amber-300">
                                {(selectedCustomer.points ?? 0).toLocaleString('id-ID')} Pts
                              </span>
                              {grandTotal > 0 && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold ml-1.5">
                                  (+{Math.floor(grandTotal / 10000)} Pts)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="font-mono text-gray-400">0 Pts (Non-Member)</span>
                          )}
                        </div>
                      </div>

                      {/* Subtotal & PPN 11% Toggle */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-gray-400 font-semibold">Subtotal:</span>
                          <span className="font-mono font-black text-slate-900 dark:text-white">
                            Rp {subtotal.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setIsTaxIncluded(!isTaxIncluded)}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-black border transition cursor-pointer flex items-center gap-0.5 active:scale-95 ${
                              isTaxIncluded
                                ? 'bg-blue-600 text-white border-blue-600'
                                : isLight
                                ? 'text-slate-700 border-slate-400 bg-slate-100 hover:bg-slate-200'
                                : 'text-gray-300 border-slate-600 bg-slate-800 hover:bg-slate-700'
                            }`}
                            title={isTaxIncluded ? 'PPN 11% Aktif' : 'PPN 0%'}
                          >
                            <span>PPN</span>
                            <span>{isTaxIncluded ? '+11%' : '0%'}</span>
                          </button>
                          <span className={`font-mono text-xs font-black ${
                            isTaxIncluded && taxAmount > 0
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-slate-400'
                          }`}>
                            Rp {taxAmount.toLocaleString('id-ID')}
                          </span>
                        </div>

                        {calculatedDiscount > 0 && (
                          <div className="flex items-center justify-between text-amber-500 font-bold">
                            <span>Diskon:</span>
                            <span className="font-mono">-Rp {calculatedDiscount.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                      </div>

                      {/* Grand Total Display */}
                      <div className="flex items-baseline justify-between pt-1 border-t border-slate-200 dark:border-gray-800">
                        <div>
                          <span className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                            TOTAL
                          </span>
                          <span className="text-[10px] text-gray-400 block font-mono">
                            {selectedCustomer ? `${selectedCustomer.name} • ${selectedPriceTier}` : 'Walk-in • RETAIL'}
                          </span>
                        </div>
                        <div id="pos-grand-total-display" className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 leading-none">
                          Rp {grandTotal.toLocaleString('id-ID')}
                        </div>
                      </div>

                      {/* Pilihan Metode Pembayaran (CASH, QRIS, DEBIT) */}
                      <div className={`grid grid-cols-3 gap-1 p-0.5 rounded-lg border text-xs font-black ${
                        isLight ? 'bg-slate-200/70 border-slate-300' : 'bg-[#161b22] border-[#30363d]'
                      }`}>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('CASH')}
                          className={`py-1 rounded text-center transition cursor-pointer text-xs ${
                            paymentMethod === 'CASH'
                              ? 'bg-[#0052FF] text-white shadow-xs'
                              : isLight ? 'text-slate-700 hover:bg-slate-300' : 'text-gray-300 hover:text-white'
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
                          className={`py-1 rounded text-center transition cursor-pointer text-xs ${
                            paymentMethod === 'QRIS'
                              ? 'bg-[#0052FF] text-white shadow-xs'
                              : isLight ? 'text-slate-700 hover:bg-slate-300' : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          📱 QRIS
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('EDC_DEBIT')}
                          className={`py-1 rounded text-center transition cursor-pointer text-xs ${
                            paymentMethod === 'EDC_DEBIT'
                              ? 'bg-[#0052FF] text-white shadow-xs'
                              : isLight ? 'text-slate-700 hover:bg-slate-300' : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          💳 Debit
                        </button>
                      </div>

                      {/* Area Received & Kembalian (Khusus CASH) */}
                      {paymentMethod === 'CASH' ? (
                        <div className="space-y-1.5 pt-0.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-gray-300 shrink-0">
                              {language === 'ID' ? 'Diterima:' : 'Received:'}
                            </span>
                            <div className="flex items-center gap-1">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  Rp
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
                                    if (isCashUnderpaid && val >= grandTotal) {
                                      setIsCashUnderpaid(false);
                                    }
                                  }}
                                  onFocus={(e) => e.target.select()}
                                  onKeyDown={handleCashInputKeyDown}
                                  className={`h-8 sm:h-9 w-24 sm:w-28 pl-7 pr-1.5 text-sm font-black text-center font-mono border-2 rounded-lg shadow-xs outline-none ${
                                    isCashUnderpaid
                                      ? 'border-rose-500 bg-rose-500/10 text-rose-600 ring-2 ring-rose-400/50'
                                      : 'border-emerald-500 ' + (isLight ? 'bg-white text-slate-900' : 'bg-[#0d1117] text-white')
                                  }`}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setCashGiven(grandTotal);
                                  setIsCashUnderpaid(false);
                                }}
                                className="h-8 sm:h-9 px-2 rounded-lg text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer active:scale-95"
                                title="Bayar Uang Pas (Spasi / P)"
                              >
                                Pas
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-gray-300">
                              {cashGiven >= grandTotal ? 'Kembalian:' : 'Kurang:'}
                            </span>
                            <span className={`font-mono font-black text-sm sm:text-base ${
                              cashGiven >= grandTotal ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                            }`}>
                              Rp {cashGiven >= grandTotal ? changeAmount.toLocaleString('id-ID') : (grandTotal - cashGiven).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      ) : paymentMethod === 'QRIS' ? (
                        <button
                          type="button"
                          onClick={() => setIsQrisModalOpen(true)}
                          className="w-full py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Buka QRIS Dinamis</span>
                        </button>
                      ) : (
                        <div className="py-1.5 px-2 rounded-lg text-xs font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20 text-center flex items-center justify-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Mesin EDC Siap</span>
                        </div>
                      )}

                      {/* Tombol Aksi [Send to Kitchen / Print KOT] & [Bayar [F10]] */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          id="btn-open-kot-modal"
                          type="button"
                          onClick={() => setIsKotModalOpen(true)}
                          disabled={cart.length === 0}
                          className={`h-10 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            cart.length === 0
                              ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20'
                          }`}
                          title="Kirim Pesanan ke Printer Dapur (KOT)"
                        >
                          <ChefHat className="w-4 h-4 shrink-0" />
                          <span className="truncate">KOT Dapur</span>
                        </button>

                        <button
                          id="btn-process-pos-sale-fnb"
                          type="button"
                          onClick={handleManualBayarClick}
                          disabled={cart.length === 0}
                          className={`h-10 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg transition active:scale-95 cursor-pointer border-2 shrink-0 ${
                            cart.length === 0
                              ? 'opacity-40 cursor-not-allowed bg-gray-500 border-gray-600 text-white'
                              : 'bg-[#0052FF] hover:bg-[#0043d1] border-blue-600 text-white shadow-blue-500/30'
                          }`}
                          title="Bayar Transaksi [F10]"
                        >
                          <span>Bayar</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-black/30 text-white border border-white/20">
                            [F10]
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* TABEL GRID TRANSAKSI TERMINAL KASIR SWALAYAN (80% TINGGI LAYAR) */
                <div
                  id="card-pos-cart-table"
                  className={`flex-1 min-h-0 flex flex-col rounded-lg border-2 overflow-hidden shadow-sm transition-colors ${
                    isLight ? 'border-slate-400 bg-white' : 'border-slate-700 bg-[#161b22]'
                  }`}
                >
                  {/* Sub-Header Tabel Belanja Ringkas */}
                  <div
                    className={`px-3 py-1.5 border-b-2 flex items-center justify-between text-xs flex-shrink-0 select-none ${
                      isLight ? 'bg-slate-100 text-slate-950 border-slate-300' : 'bg-[#0d1117] text-gray-200 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <ShoppingBag className="w-4 h-4 text-[#0052FF] dark:text-[#58a6ff]" />
                      <span className="text-slate-950 dark:text-white font-black text-xs sm:text-sm">
                        {language === 'ID' ? 'Daftar Belanja' : 'Cart Items'}
                      </span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-slate-900 dark:text-blue-200 border border-blue-400 dark:border-blue-700 font-black">
                        {cart.length} SKU • {totalCartItemCount} Pcs
                      </span>
                      {selectedCustomer && (
                        <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hidden sm:inline">
                          • Member: <strong className="font-black text-emerald-950 dark:text-emerald-200">{selectedCustomer.name}</strong> ({selectedPriceTier})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Hold Cart */}
                      <button
                        type="button"
                        onClick={handleOpenHoldModal}
                        disabled={cart.length === 0}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                          cart.length === 0
                            ? 'opacity-40 cursor-not-allowed border-transparent text-slate-400'
                            : isLight
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                            : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-xs'
                        }`}
                        title="Tahan transaksi keranjang saat ini (Hold Cart)"
                      >
                        <Pause className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>{language === 'ID' ? 'Hold' : 'Hold'}</span>
                      </button>

                      {/* Recall Cart */}
                      <button
                        type="button"
                        onClick={() => setIsHeldOrdersModalOpen(true)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                          heldOrders.length > 0
                            ? isLight
                              ? 'bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300 shadow-xs'
                              : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/40 shadow-xs'
                            : isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            : 'bg-[#21262d] hover:bg-[#30363d] text-gray-300 border-gray-700'
                        }`}
                        title="Panggil transaksi yang ditahan (Recall Cart)"
                      >
                        <RotateCcw className="w-3 h-3 text-[#0052FF] dark:text-[#58a6ff]" />
                        <span>{language === 'ID' ? 'Recall' : 'Recall'}</span>
                        <span className={`px-1.5 py-0.1 rounded-full text-[10px] font-mono font-black ${
                          heldOrders.length > 0
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-300 dark:bg-gray-700 text-slate-800 dark:text-gray-300'
                        }`}>
                          {heldOrders.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsManualSearchOpen(true)}
                        className="text-[#0052FF] dark:text-[#58a6ff] hover:underline font-black text-xs cursor-pointer flex items-center gap-1 ml-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{language === 'ID' ? 'Tambah Item [F3]' : 'Add Item [F3]'}</span>
                      </button>
                    </div>
                  </div>

                  {/* KONTEN TABEL BELANJA: PENUH & SCROLL HALUS OTOMATIS */}
                  <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto scroll-smooth">
                    {cart.length === 0 ? (
                      <div className="h-full min-h-[240px] flex flex-col items-center justify-center py-12 text-center space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#0052FF] dark:text-[#58a6ff]">
                          <Barcode className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-base font-bold text-slate-900 dark:text-white">
                            {language === 'ID' ? 'Terminal Kasir Siap Melayani' : 'Register Ready'}
                          </p>
                          <p className="text-xs text-gray-400 max-w-sm mx-auto">
                            {language === 'ID'
                              ? 'Scan barcode barang [F2], masukkan No. HP Member di atas, atau cari produk dari katalog [F3].'
                              : 'Scan product barcode [F2], input member phone above, or browse product catalog [F3].'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsManualSearchOpen(true)}
                          className="mt-2 px-4 py-2 bg-[#0052FF] hover:bg-[#0043d1] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>{language === 'ID' ? 'Cari Produk Manual [F3]' : 'Browse Products [F3]'}</span>
                        </button>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        {/* 7 Sticky Table Columns (Standard Minimarket ERP) */}
                        <thead
                          className={`border-b-2 sticky top-0 z-10 font-mono text-[11px] uppercase tracking-wider ${
                            isLight
                              ? 'bg-slate-100 text-slate-950 border-slate-300'
                              : 'bg-[#161b22] text-gray-200 border-slate-700'
                          }`}
                        >
                          <tr>
                            <th className="py-1 px-2 text-center w-10 font-black border-r border-slate-300 dark:border-slate-700 text-slate-950 dark:text-gray-200">No</th>
                            <th className="py-1 px-2 w-32 sm:w-36 font-black border-r border-slate-300 dark:border-slate-700 text-slate-950 dark:text-gray-200">CODE / BARCODE</th>
                            <th className="py-1 px-2 font-black border-r border-slate-300 dark:border-slate-700 text-slate-950 dark:text-gray-200">{language === 'ID' ? 'Nama Produk' : 'Product Name'}</th>
                            <th className="py-1 px-2 text-center w-20 sm:w-24 font-black border-r border-slate-300 dark:border-slate-700 text-slate-950 dark:text-gray-200">
                              Qty <span className="text-[9px] text-blue-600 dark:text-blue-400 font-mono lowercase">[f4]</span>
                            </th>
                            <th className="py-1 px-2 text-right w-28 sm:w-32 font-black border-r border-slate-300 dark:border-slate-700 text-slate-950 dark:text-gray-200">{language === 'ID' ? 'Harga Satuan' : 'Unit Price'}</th>
                            <th className="py-1 px-2 text-right w-32 sm:w-36 font-black border-r border-slate-300 dark:border-slate-700 text-slate-950 dark:text-gray-200">{language === 'ID' ? 'Total' : 'Total'}</th>
                            <th className="py-1 px-2 text-center w-20 sm:w-24 font-black text-slate-950 dark:text-gray-200">{language === 'ID' ? 'Aksi' : 'Action'}</th>
                          </tr>
                        </thead>
                        <tbody
                          className={`divide-y ${
                            isLight ? 'divide-slate-300' : 'divide-slate-700'
                          }`}
                        >
                          {cart.map((item, idx) => {
                            const sizeOrVariant = getItemVariant(item);
                            const itemCode = item.product?.barcode || item.product?.id || '-';
                            const itemUnit = item.product?.unit || 'Pcs';
                            const isSelected = idx === selectedCartIndex;

                            return (
                              <tr
                                key={`pos-cart-${item.product?.id || item.product?.barcode || 'item'}-${idx}`}
                                id={`pos-cart-row-${idx}`}
                                onClick={() => setSelectedCartIndex(idx)}
                                className={`border-b transition duration-75 h-7.5 max-h-8 cursor-pointer select-none ${
                                  isSelected
                                    ? isLight
                                      ? 'bg-blue-100/95 text-blue-950 font-bold ring-2 ring-inset ring-[#0052FF] border-l-4 border-l-[#0052FF]'
                                      : 'bg-blue-950/70 text-blue-100 font-bold ring-2 ring-inset ring-[#58a6ff] border-l-4 border-l-[#58a6ff]'
                                    : isLight
                                    ? idx % 2 === 0
                                      ? 'bg-white hover:bg-blue-50/90 text-slate-950 border-slate-300'
                                      : 'bg-slate-50 hover:bg-blue-50/90 text-slate-950 border-slate-300'
                                    : idx % 2 === 0
                                    ? 'bg-[#161b22] hover:bg-[#1c2128] text-gray-100 border-slate-700'
                                    : 'bg-[#0d1117] hover:bg-[#1c2128] text-gray-100 border-slate-700'
                                }`}
                              >
                                {/* 1. No (01, 02, 03...) */}
                                <td className={`py-1 px-2 text-center font-mono font-black text-xs border-r border-slate-300 dark:border-slate-700 ${
                                  isSelected
                                    ? isLight ? 'text-[#0052FF] font-black' : 'text-[#58a6ff] font-black'
                                    : isLight ? 'text-slate-950' : 'text-gray-300'
                                }`}>
                                  {isSelected && <span className="inline-block mr-0.5 animate-pulse text-[#0052FF] dark:text-[#58a6ff]">►</span>}
                                  {String(idx + 1).padStart(2, '0')}
                                </td>

                                {/* 2. CODE / BARCODE (Pabrik atau Kode PLU/Internal Toko) */}
                                <td className={`py-1 px-2 font-mono text-xs font-bold border-r border-slate-300 dark:border-slate-700 truncate ${
                                  isSelected
                                    ? isLight ? 'text-blue-950 font-black' : 'text-blue-200 font-black'
                                    : isLight ? 'text-slate-800' : 'text-slate-200'
                                }`} title={`Kode: ${itemCode}`}>
                                  {itemCode}
                                </td>

                                {/* 3. Nama Produk, Satuan UOM & Badge Farmasi Khusus */}
                                <td className="py-1 px-2 border-r border-slate-300 dark:border-slate-700">
                                  {(() => {
                                    const isRacikan =
                                      (item.product?.id || '').startsWith('RCK-') ||
                                      (item.product?.barcode || '').startsWith('RCK-') ||
                                      item.product?.pharmacyClass === 'RACIKAN' ||
                                      item.product?.category === 'FARMASI_RACIKAN';

                                    const isObatKeras =
                                      item.product?.pharmacyClass === 'OBAT_KERAS' ||
                                      (item.product?.category || '').toLowerCase().includes('keras') ||
                                      (item.product?.id || '').startsWith('MED-');

                                    return (
                                      <div className="flex items-center gap-1.5 flex-wrap truncate">
                                        {isObatKeras && (
                                          <span
                                            className="w-4 h-4 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 border border-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                                            title="Obat Keras (K)"
                                          >
                                            K
                                          </span>
                                        )}
                                        <span
                                          className={`text-xs font-semibold truncate ${
                                            isSelected
                                              ? isLight ? 'text-blue-950 font-black' : 'text-white font-black'
                                              : isLight ? 'text-slate-900' : 'text-slate-100'
                                          }`}
                                          title={item.product.name}
                                        >
                                          {item.product.name}
                                        </span>

                                        {isRacikan && (
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-900/60 text-purple-300 border border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.4)] shrink-0">
                                            [KODE: {itemCode}]
                                          </span>
                                        )}

                                        {sizeOrVariant &&
                                          sizeOrVariant !== 'ALL' &&
                                          sizeOrVariant !== 'STD' &&
                                          sizeOrVariant !== 'STANDAR' &&
                                          sizeOrVariant.toLowerCase() !== (itemUnit || '').toLowerCase() && (
                                            <span className={`text-[10px] font-semibold shrink-0 ${
                                              isLight ? 'text-slate-600' : 'text-slate-400'
                                            }`}>
                                              ({sizeOrVariant})
                                            </span>
                                          )}
                                        {/* Badge Satuan Aktif */}
                                        <span className={`text-[10px] font-mono px-1 rounded border shrink-0 ${
                                          item.isRetailUnit
                                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 dark:text-amber-300 font-bold'
                                            : isLight
                                            ? 'bg-slate-100 border-slate-300 text-slate-700'
                                            : 'bg-slate-800 border-slate-600 text-slate-300'
                                        }`}>
                                          {item.selectedUnit || itemUnit}
                                        </span>

                                        {/* Badge IMEI, Serial Number & Garansi (Electronics KASIR 07) */}
                                        {item.product.imeiSerial && (
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/40 shrink-0">
                                            IMEI: {item.product.imeiSerial}
                                          </span>
                                        )}
                                        {item.product.specs && (
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 shrink-0">
                                            {item.product.specs}
                                          </span>
                                        )}
                                        {item.product.warrantyPeriod && (
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                                            🛡️ Garansi: {item.product.warrantyPeriod}
                                          </span>
                                        )}

                                        {/* Badge Part Fisik / Jasa Servis (Workshop KASIR 08) */}
                                        {item.product.description && (item.product.description === 'Part Fisik' || item.product.description === 'Jasa Servis') && (
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                                            item.product.description === 'Jasa Servis'
                                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                                              : 'bg-orange-500/15 text-orange-400 border border-orange-500/40'
                                          }`}>
                                            {item.product.description === 'Jasa Servis' ? '⚙️ Jasa Servis' : '📦 Part Fisik'}
                                          </span>
                                        )}

                                        {/* Toggle Satuan Eceran/Utuh (Building Materials Multi-Unit) */}
                                        {Boolean(item.product.unitSecondary && item.product.priceSecondary) && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleItemUnit(idx);
                                            }}
                                            className="text-[9px] font-bold px-1.5 py-0.2 rounded border border-indigo-500/40 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/25 transition cursor-pointer flex items-center gap-0.5 shrink-0 active:scale-95"
                                            title={`Ganti Satuan: ${item.isRetailUnit ? `Utuh (${item.product.unit})` : `Eceran (${item.product.unitSecondary})`}`}
                                          >
                                            <span>⇄</span>
                                            <span>{item.isRetailUnit ? `Utuh (${item.product.unit})` : `Eceran (${item.product.unitSecondary})`}</span>
                                          </button>
                                        )}

                                        {/* Dropdown Armada Cepat pada Item Curah KASIR 09 */}
                                        {Boolean(
                                          item.product.materialNature === 'BULK_CURAH' ||
                                          (item.product.category || '').includes('PASIR') ||
                                          (item.product.bulkFleetTiers && item.product.bulkFleetTiers.length > 0)
                                        ) && (
                                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                                              <Truck className="w-3 h-3 text-amber-400" />
                                              <span className="hidden sm:inline">Armada:</span>
                                            </span>
                                            <select
                                              value={
                                                item.product.bulkUnitType ||
                                                (item.product.bulkFleetTiers || DEFAULT_FLEET_OPTIONS).find(
                                                  (f) =>
                                                    f.id === item.product.bulkUnitType ||
                                                    f.name === item.selectedUnit ||
                                                    f.price === item.product.sell_price
                                                )?.id || 'PICKUP_RET'
                                              }
                                              onChange={(e) => {
                                                e.stopPropagation();
                                                handleSelectFleetTier(idx, e.target.value);
                                              }}
                                              className={`text-[10px] font-bold py-0.5 px-2 rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                                                isLight
                                                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                                                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                                              }`}
                                              title="Pilih Armada: Ret Pick-up (Rp 350rb) | Ret Truk Engkel (Rp 850rb) | Dump Truck (Rp 1.8jt)"
                                            >
                                              {((item.product.bulkFleetTiers && item.product.bulkFleetTiers.length > 0)
                                                ? item.product.bulkFleetTiers.filter((f) => f.isActive)
                                                : DEFAULT_FLEET_OPTIONS
                                              ).map((fleet, flIdx) => {
                                                const fleetLabel = fleet.name.toLowerCase().includes('dump truck')
                                                  ? 'Dump Truck'
                                                  : fleet.name.toLowerCase().includes('pick-up') || fleet.name.toLowerCase().includes('pickup')
                                                  ? 'Ret Pick-up'
                                                  : fleet.name.toLowerCase().includes('engkel')
                                                  ? 'Ret Truk Engkel'
                                                  : fleet.name.toLowerCase().includes('karung') || fleet.name.toLowerCase().includes('sak')
                                                  ? 'Sak / Karung'
                                                  : fleet.name.split(' (')[0];

                                                const priceTag = fleet.price >= 1000000
                                                  ? `${(fleet.price / 1000000).toFixed(1).replace('.0', '')}jt`
                                                  : `${Math.round(fleet.price / 1000)}rb`;

                                                return (
                                                  <option
                                                    key={`fleet-opt-${fleet.id}-${flIdx}`}
                                                    value={fleet.id}
                                                    className={isLight ? 'bg-white text-slate-900' : 'bg-[#161b22] text-white'}
                                                  >
                                                    {fleetLabel} (Rp {priceTag})
                                                  </option>
                                                );
                                              })}
                                            </select>
                                          </div>
                                        )}

                                        {isSelected && (
                                          <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-blue-600 text-white shrink-0 tracking-wider">
                                            AKTIF [Del / +/-]
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </td>

                                {/* 4. Kotak Qty Presisi & Navigasi Keyboard Interaktif (Mendukung Desimal) */}
                                <td className="py-1 px-2 text-center border-r border-slate-300 dark:border-slate-700">
                                  <div className="inline-flex items-center justify-center">
                                    <input
                                      id={`pos-qty-input-${idx}`}
                                      type="number"
                                      step={item.product.supportDecimal || isBuildingTerminal ? 'any' : '1'}
                                      min={item.product.supportDecimal || isBuildingTerminal ? 0.01 : 1}
                                      max={9999}
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const rawVal = e.target.value;
                                        if (rawVal === '') {
                                          handleDirectQtyChange(idx, 0);
                                        } else {
                                          const parsed = parseFloat(rawVal.replace(',', '.'));
                                          if (!isNaN(parsed)) {
                                            handleDirectQtyChange(idx, parsed);
                                          }
                                        }
                                      }}
                                      onFocus={(e) => {
                                        e.target.select();
                                        setSelectedCartIndex(idx);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          if (cart.length > 0 && !isFnbTerminal && !isFnbPhotoMenuMode) {
                                            setPaymentMethod('CASH');
                                            focusCashInput();
                                          } else {
                                            focusBarcodeInput();
                                          }
                                        } else if (e.key === 'Escape') {
                                          e.preventDefault();
                                          focusBarcodeInput();
                                        }
                                      }}
                                      className={`w-14 sm:w-16 h-5.5 sm:h-6 text-center font-black text-xs border rounded outline-none transition ${
                                        isLight
                                          ? 'border-slate-400 bg-white text-slate-950 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                                          : 'border-slate-600 bg-slate-900 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                      }`}
                                      title={language === 'ID' ? 'Ketik kuantitas [Bisa desimal, misal 2.5]' : 'Type quantity'}
                                    />
                                  </div>
                                </td>

                                {/* 5. Harga Satuan (Otomatis Switch Eceran/Utuh) */}
                                <td className={`py-1 px-2 text-right font-mono text-xs font-black border-r border-slate-300 dark:border-slate-700 ${
                                  isLight ? 'text-slate-950' : 'text-slate-100'
                                }`}>
                                  {(() => {
                                    const unitPrice = item.isRetailUnit && item.product.priceSecondary
                                      ? item.product.priceSecondary
                                      : item.product.sell_price;
                                    return (
                                      <div className="flex flex-col items-end">
                                        <span>Rp {unitPrice.toLocaleString('id-ID')}</span>
                                        {item.isRetailUnit && (
                                          <span className="text-[9px] font-bold text-amber-500 font-mono">
                                            (Ecer/{item.selectedUnit || item.product.unitSecondary || 'Meter'})
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </td>

                                {/* 6. Total */}
                                <td className={`py-1 px-2 text-right font-mono font-black text-xs border-r border-slate-300 dark:border-slate-700 ${
                                  isLight ? 'text-emerald-700' : 'text-emerald-400'
                                }`}>
                                  Rp {item.subtotal.toLocaleString('id-ID')}
                                </td>

                                {/* 7. Aksi */}
                                <td className="py-0.5 px-1.5 text-center">
                                  <div className="inline-flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingItemIndex(idx)}
                                      className={`w-6 h-6 flex items-center justify-center rounded border transition cursor-pointer active:scale-90 ${
                                        isLight
                                          ? 'bg-blue-50 text-[#0052FF] hover:bg-blue-100 border-blue-300 shadow-xs'
                                          : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border-blue-500/40'
                                      }`}
                                      title={language === 'ID' ? 'Edit item nota' : 'Edit item'}
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRequestRemoveItem(idx)}
                                      className={`w-6 h-6 flex items-center justify-center rounded border transition cursor-pointer active:scale-90 ${
                                        isLight
                                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-300 shadow-xs'
                                          : 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border-rose-500/40'
                                      }`}
                                      title={language === 'ID' ? 'Void baris item ini (Otorisasi Supervisor)' : 'Void item line (Supervisor Approval)'}
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
                </div>
              )}
          </div>

          {/* Panel Banner Khusus KASIR 07 (Elektronik & Gadget) */}
          {isElectronicsTerminal && (
            <div
              className={`w-full py-2 px-3 mb-1.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs transition ${
                isLight ? 'bg-sky-50 border-sky-300 text-sky-950' : 'bg-sky-950/30 border-sky-500/40 text-sky-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-sky-500 dark:text-sky-400">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>Elektronik & Gadget Register:</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-bold font-mono">
                  ✓ Dual-IMEI, Serial Number & Garansi Aktif
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  ● STATUS: ONLINE / ACTIVE
                </span>
                <span className="text-gray-400 hidden sm:inline">Garansi Resmi Terverifikasi</span>
              </div>
            </div>
          )}

          {/* Panel Banner Khusus KASIR 08 (Bengkel Otomotif & Servis) */}
          {isWorkshopTerminal && (
            <div
              className={`w-full py-2 px-3 mb-1.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs transition ${
                isLight ? 'bg-orange-50 border-orange-300 text-orange-950' : 'bg-orange-950/30 border-orange-500/40 text-orange-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-orange-500 dark:text-orange-400">
                  <span className="text-base">🔧</span>
                  <span>Info Kendaraan & Bengkel:</span>
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs font-black">
                    Nopol: {workshopPlateNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                    Mekanik: {workshopMechanic}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  ● STATUS: ONLINE / ACTIVE
                </span>
                <span className="text-gray-400 hidden sm:inline">Jasa Servis, Sparepart & Nopol</span>
              </div>
            </div>
          )}

          {/* Panel Pengiriman Material Bangunan (Bawa Langsung vs Armada Toko DO) */}
          {(isBuildingTerminal || cart.some((c) => c.product.businessModel === 'building' || (c.product.id || '').startsWith('MAT-'))) && (
            <div
              className={`w-full py-1.5 px-3 mb-1.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs transition ${
                isLight ? 'bg-indigo-50/80 border-indigo-200 text-slate-800' : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-indigo-400">
                  <span className="text-base">🚚</span>
                  <span>Distribusi Logistik / Pengiriman Material:</span>
                </span>
                {deliveryMethod === 'FLEET_DELIVERY' && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold font-mono">
                    ✓ Terbitkan Dokumen Surat Jalan DO Armada Toko
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('DIRECT')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border active:scale-95 ${
                    deliveryMethod === 'DIRECT'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : isLight
                      ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'bg-[#161b22] border-slate-700 text-gray-300 hover:text-white'
                  }`}
                >
                  <span>📦</span>
                  <span>Bawa Langsung</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMethod('FLEET_DELIVERY');
                    setIsDoModalOpen(true);
                  }}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border active:scale-95 ${
                    deliveryMethod === 'FLEET_DELIVERY'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      : isLight
                      ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'bg-[#161b22] border-slate-700 text-gray-300 hover:text-white'
                  }`}
                >
                  <span>🚛</span>
                  <span>Kirim Armada Toko (Buat Surat Jalan DO)</span>
                </button>
                {deliveryMethod === 'FLEET_DELIVERY' && (
                  <button
                    type="button"
                    onClick={() => setIsDoModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg font-bold text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition cursor-pointer flex items-center gap-1 active:scale-95"
                    title="Buka form penugasan sopir & cetak surat jalan DO"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Surat Jalan DO</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BILAH BAWAH: STRIP HORIZONTAL TUNGGAL PEMBAYARAN KHUSUS MODE RETAIL       */}
          {/* ========================================================================= */}
          {!isFnbPhotoMenuMode && (
            <div
              id="bar-pos-bottom-payment"
              className={`w-full min-h-[72px] sm:h-[76px] flex-shrink-0 shrink-0 mt-auto border-t-2 rounded-xl px-2.5 sm:px-4 py-1.5 flex items-center justify-between gap-1.5 sm:gap-3 shadow-lg transition-colors select-none overflow-x-auto no-scrollbar flex-nowrap ${
                isLight ? 'bg-white border-slate-300 shadow-slate-200' : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
            {/* 1. SISI KIRI: INDIKATOR RINGKAS SUBTOTAL & PPN CHARGE */}
            <div className="flex flex-col justify-center flex-shrink-0 shrink-0 pr-2 sm:pr-3 border-r-2 border-slate-300 dark:border-[#30363d] min-w-[125px] sm:min-w-[155px]">
              {/* Row 1: Subtotal */}
              <div className="flex items-center justify-between gap-1 text-xs">
                <span className="text-slate-800 dark:text-slate-200 font-bold">Subtotal:</span>
                <span className="font-mono font-black text-slate-950 dark:text-white">
                  Rp {subtotal.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Row 2: [PPN +11%] Charge */}
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setIsTaxIncluded(!isTaxIncluded)}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-black border transition cursor-pointer flex items-center gap-0.5 active:scale-95 shrink-0 ${
                    isTaxIncluded
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : isLight
                      ? 'text-slate-700 border-slate-400 bg-slate-100 hover:bg-slate-200'
                      : 'text-gray-300 border-slate-600 bg-slate-800/80 hover:bg-slate-700'
                  }`}
                  title={isTaxIncluded ? 'PPN 11% Aktif (Klik untuk nonaktifkan)' : 'PPN 0% (Klik untuk aktifkan 11%)'}
                >
                  <span>PPN</span>
                  <span>{isTaxIncluded ? '+11%' : '0%'}</span>
                </button>
                <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold">
                  <span className="text-[11px] text-slate-700 dark:text-slate-300">Charge:</span>
                  <span className={`font-mono text-[11px] font-black ${
                    isTaxIncluded && taxAmount > 0
                      ? 'text-blue-700 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    Rp {taxAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. SISI TENGAH-KIRI: TAMPILAN TOTAL BELANJA */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 shrink-0 px-1 sm:px-2">
              <div className="text-right">
                <div className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  TOTAL
                </div>
                <div className="text-[10px] text-slate-700 dark:text-gray-300 font-mono font-bold hidden sm:block">
                  {getTierLabel(selectedPriceTier)}
                </div>
                {paymentMethod === 'CASH' && cashRoundingDiff !== 0 && (
                  <span className="text-[9px] font-bold text-amber-500 font-mono block">
                    {cashRoundingDiff > 0 ? `+Rp ${cashRoundingDiff}` : `-Rp ${Math.abs(cashRoundingDiff)}`} (Round)
                  </span>
                )}
              </div>
              <div
                id="pos-grand-total-display"
                className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight leading-none drop-shadow-xs"
              >
                Rp {grandTotal.toLocaleString('id-ID')}
              </div>
            </div>

            {/* 3. SISI TENGAH-KANAN: INPUT UANG DITERIMA & KEMBALIAN (HIGH-VISIBILITY CASHIER DOCK) */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 shrink-0 border-l-2 border-slate-300 dark:border-[#30363d] pl-1.5 sm:pl-3">
              {paymentMethod === 'CASH' ? (
                <div className="flex items-center gap-2">
                  {/* Input Diterima */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-800 dark:text-gray-200 font-bold leading-none mb-1">
                      {language === 'ID' ? 'Diterima:' : 'Received:'}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Rp
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
                            if (isCashUnderpaid && val >= grandTotal) {
                              setIsCashUnderpaid(false);
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={handleCashInputKeyDown}
                          className={`h-10 sm:h-11 w-28 sm:w-34 pl-7 pr-2 text-base sm:text-lg font-black text-center font-mono border-2 rounded-lg shadow-sm outline-none transition ${
                            isCashUnderpaid
                              ? 'border-rose-500 bg-rose-500/10 text-rose-600 ring-2 ring-rose-400/50'
                              : 'border-emerald-500 focus:ring-2 focus:ring-emerald-400 ' +
                                (isLight ? 'bg-white text-slate-950 focus:bg-white' : 'bg-[#0d1117] text-white focus:border-emerald-400')
                          }`}
                        />
                      </div>

                      {/* Tombol Pas */}
                      <button
                        type="button"
                        onClick={() => {
                          setCashGiven(grandTotal);
                          setIsCashUnderpaid(false);
                        }}
                        className="h-10 sm:h-11 px-2.5 rounded-lg text-xs font-black border-2 border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer active:scale-95 shadow-sm flex items-center justify-center shrink-0"
                        title="Bayar Uang Pas (Spasi / P)"
                      >
                        Pas
                      </button>
                    </div>
                  </div>

                  {/* Kembalian / Kurang */}
                  <div className="flex flex-col pl-1 justify-center">
                    <span className="text-[10px] text-slate-800 dark:text-gray-200 font-bold leading-none mb-1">
                      {cashGiven >= grandTotal
                        ? language === 'ID' ? 'Kembalian:' : 'Change:'
                        : language === 'ID' ? 'Kurang:' : 'Due:'}
                    </span>
                    <div
                      className={`font-mono font-black text-lg sm:text-xl lg:text-2xl tracking-tight leading-none ${
                        cashGiven >= grandTotal
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600'
                      }`}
                    >
                      Rp{' '}
                      {cashGiven >= grandTotal
                        ? changeAmount.toLocaleString('id-ID')
                        : (grandTotal - cashGiven).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ) : paymentMethod === 'QRIS' ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsQrisModalOpen(true)}
                    className="h-10 sm:h-11 px-3 sm:px-4 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border-2 border-rose-500/30 hover:bg-rose-500/20 flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm shrink-0"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Buka QRIS Dinamis</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="h-10 sm:h-11 px-3 sm:px-4 rounded-lg text-xs font-bold text-slate-800 dark:text-gray-200 flex items-center gap-1.5 bg-blue-500/10 border-2 border-blue-500/30 shrink-0">
                    <CreditCard className="w-4 h-4 text-[#0052FF]" />
                    <span>Mesin EDC Siap</span>
                  </span>
                </div>
              )}
            </div>

            {/* 4. SISI KANAN: TOMBOL METODE BAYAR + TOMBOL UTAMA [BAYAR (F10)] */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 shrink-0 border-l-2 border-slate-300 dark:border-[#30363d] pl-2 sm:pl-3 ml-auto">
              {/* Tombol Cepat Pilihan Metode */}
              <div
                className={`flex items-center p-0.5 rounded-xl border-2 text-xs font-black gap-0.5 flex-shrink-0 shrink-0 ${
                  isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`h-10 sm:h-11 px-2 sm:px-3 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    paymentMethod === 'CASH'
                      ? 'bg-[#0052FF] text-white shadow-sm'
                      : isLight
                      ? 'text-slate-950 hover:bg-slate-200'
                      : 'text-gray-200 hover:text-white'
                  }`}
                  title="Bayar Tunai / Cash"
                >
                  <span className="text-sm">💵</span>
                  <span>Tunai</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('QRIS');
                    setIsQrisModalOpen(true);
                  }}
                  className={`h-10 sm:h-11 px-2 sm:px-3 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    paymentMethod === 'QRIS'
                      ? 'bg-[#0052FF] text-white shadow-sm'
                      : isLight
                      ? 'text-slate-950 hover:bg-slate-200'
                      : 'text-gray-200 hover:text-white'
                  }`}
                  title="Bayar QRIS Dinamis"
                >
                  <span className="text-sm">📱</span>
                  <span>QRIS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('EDC_DEBIT')}
                  className={`h-10 sm:h-11 px-2 sm:px-3 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    paymentMethod === 'EDC_DEBIT'
                      ? 'bg-[#0052FF] text-white shadow-sm'
                      : isLight
                      ? 'text-slate-950 hover:bg-slate-200'
                      : 'text-gray-200 hover:text-white'
                  }`}
                  title="Bayar Debit / Kartu EDC"
                >
                  <span className="text-sm">💳</span>
                  <span>Debit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('KREDIT / TEMPO (AR)');
                    if (!selectedCustomer) {
                      showToast(
                        language === 'ID'
                          ? 'Silakan pilih Member/Pelanggan terlebih dahulu untuk transaksi Kredit / Tempo (AR)!'
                          : 'Please select a customer for Credit / AR transaction!'
                      );
                      setIsPaymentConfirmOpen(true);
                    }
                  }}
                  className={`h-10 sm:h-11 px-2 sm:px-3 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    paymentMethod === 'KREDIT / TEMPO (AR)' || paymentMethod === 'KREDIT'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : isLight
                      ? 'text-purple-900 hover:bg-purple-100'
                      : 'text-purple-300 hover:text-white'
                  }`}
                  title="Bayar Kredit / Tempo (AR) Khusus Member"
                >
                  <span className="text-sm">📋</span>
                  <span>Kredit (AR)</span>
                </button>
              </div>

              {/* Tombol Utama [Bayar (F10)] */}
              <button
                id="btn-process-pos-sale"
                type="button"
                onClick={handleManualBayarClick}
                disabled={cart.length === 0}
                className={`h-11 sm:h-12 px-4 sm:px-6 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer flex-shrink-0 shrink-0 border-2 whitespace-nowrap min-w-max ${
                  cart.length === 0
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700'
                    : 'bg-[#0052FF] hover:bg-[#0043d1] text-white shadow-blue-500/25 border-blue-600 ring-2 ring-blue-400/30'
                }`}
                title="Selesaikan Transaksi Langsung [F10]"
              >
                <Wallet className="w-4 h-4 flex-shrink-0 shrink-0" />
                <span className="font-black whitespace-nowrap">Bayar [F10]</span>
              </button>
            </div>
          </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODALS & SUB-COMPONENTS                                */}
      {/* ========================================================= */}

      {/* Manual Product Search Modal [F3] / [F1] */}
      <ManualProductSearchModal
        isOpen={isManualSearchOpen}
        onClose={() => {
          setIsManualSearchOpen(false);
          focusBarcodeInput();
        }}
        products={activeProducts}
        onSelectProduct={(prod) => {
          handleAddToCart(prod, 1);
          focusBarcodeInput();
        }}
        language={language}
        showAllCategories={showAllCategories}
        onToggleShowAllCategories={() => setShowAllCategories((prev) => !prev)}
        terminalName={activeTerminal.name}
      />

      {/* Promos & Discount Voucher Modal */}
      <DiscountVoucherModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        discountType={discountType}
        discountAmount={discountAmount}
        discountPercent={discountPercent}
        subtotal={subtotal}
        onApplyDiscount={(type, val) => {
          setDiscountType(type);
          if (type === 'IDR') {
            setDiscountAmount(val);
          } else {
            setDiscountPercent(val);
          }
          showToast(
            language === 'ID'
              ? 'Diskon transaksi berhasil diperbarui!'
              : 'Order discount updated!'
          );
        }}
        language={language}
      />

      {/* Security Terminal Unlock PIN Modal (Admin123) */}
      <TerminalUnlockModal
        terminal={terminalToUnlock}
        isOpen={isUnlockModalOpen}
        onClose={() => {
          setIsUnlockModalOpen(false);
          setTerminalToUnlock(null);
        }}
        onUnlockSuccess={handleUnlockSuccess}
      />

      {/* Modal Verifikasi PIN Keamanan Khusus Akses Menu Backend/Admin Kasir 02 Hybrid */}
      {isHybridPinModalOpen && (
        <div
          id="modal-hybrid-erp-pin-auth"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
        >
          <div
            className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl space-y-4 animate-in zoom-in-95 ${
              isLight ? 'bg-white border-amber-300 text-slate-900' : 'bg-[#161b22] border-amber-500/50 text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center font-black">
                  <Shield className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Otorisasi PIN Backend</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                      KASIR 02
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {pendingHybridModule
                      ? `Buka modul: ${pendingHybridModule.label}`
                      : 'Buka menu sistem ERP & Administrasi'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsHybridPinModalOpen(false);
                  setPendingHybridModule(null);
                  setHybridPinInput('');
                  setHybridPinError(null);
                }}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hint & Info Pengamanan */}
            <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
              isLight ? 'bg-amber-50/80 border-amber-200 text-amber-950' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <span className="text-[11px] font-medium flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                PIN Kasir 02 (Maya):
              </span>
              <button
                type="button"
                onClick={() => {
                  setHybridPinInput('2222');
                  handleVerifyHybridPin('2222');
                }}
                className="px-2 py-0.5 rounded font-mono font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer text-[11px]"
                title="Gunakan PIN Kasir 02"
              >
                2222 (Maya)
              </button>
            </div>

            {/* Input PIN Display */}
            <div className="space-y-1.5">
              <input
                id="input-hybrid-pin-auth"
                type="password"
                maxLength={8}
                autoFocus
                placeholder="••••"
                value={hybridPinInput}
                onChange={(e) => {
                  setHybridPinInput(e.target.value);
                  setHybridPinError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleVerifyHybridPin();
                  }
                }}
                className={`w-full text-center text-2xl font-mono tracking-widest py-2 rounded-xl outline-none border-2 transition ${
                  hybridPinError
                    ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                    : isLight
                    ? 'bg-slate-50 border-amber-300 text-slate-900 focus:border-amber-500'
                    : 'bg-[#0d1117] border-amber-500/40 text-white focus:border-amber-400'
                }`}
              />
              {hybridPinError && (
                <div className="text-center text-xs font-bold text-rose-500 flex items-center justify-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{hybridPinError}</span>
                </div>
              )}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                <button
                  key={`hybrid-key-${k}`}
                  type="button"
                  onClick={() => {
                    if (k === 'C') {
                      setHybridPinInput('');
                      setHybridPinError(null);
                    } else if (k === '⌫') {
                      setHybridPinInput((prev) => prev.slice(0, -1));
                    } else {
                      if (hybridPinInput.length < 8) {
                        const next = hybridPinInput + k;
                        setHybridPinInput(next);
                        if (next.length === 4) {
                          handleVerifyHybridPin(next);
                        }
                      }
                    }
                  }}
                  className={`h-10 text-sm font-bold rounded-xl border active:scale-95 transition cursor-pointer flex items-center justify-center ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                      : 'bg-[#21262d] hover:bg-[#30363d] text-white border-gray-700'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsHybridPinModalOpen(false);
                  setPendingHybridModule(null);
                  setHybridPinInput('');
                  setHybridPinError(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-[#21262d] hover:bg-[#30363d] text-gray-300 border-gray-700'
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleVerifyHybridPin()}
                className="py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Verifikasi PIN</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* F&B Modifiers Modal */}
      <FnbModifierModal
        product={selectedFnbProduct}
        isOpen={isFnbModalOpen}
        onClose={() => {
          setIsFnbModalOpen(false);
          setSelectedFnbProduct(null);
        }}
        onConfirm={handleAddFnbOrder}
      />

      {/* Kitchen Order Ticket (KOT) Modal */}
      <KotTicketModal
        isOpen={isKotModalOpen}
        onClose={() => setIsKotModalOpen(false)}
        cart={cart}
        terminal={activeTerminal}
        user={activeUser}
        onSentToKitchen={() => {
          showToast(
            language === 'ID'
              ? 'Pesanan berhasil dikirim ke antrean dapur & barista!'
              : 'Order sent to kitchen & barista queue!'
          );
        }}
      />

      {/* Held Orders / Antrean Recall Modal */}
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

      {/* Hold Cart Modal */}
      <HoldCartModal
        isOpen={isHoldCartModalOpen}
        onClose={() => setIsHoldCartModalOpen(false)}
        onConfirmHold={handleConfirmHoldOrder}
        cart={cart}
        selectedCustomer={selectedCustomer}
        heldOrdersCount={heldOrders.length}
        isLight={isLight}
        language={language}
      />

      {/* Supervisor Void Approval Modal */}
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
      />

      {/* QRIS Dinamis Preview Modal */}
      <QrisModal
        isOpen={isQrisModalOpen}
        onClose={() => setIsQrisModalOpen(false)}
        totalAmount={grandTotal}
        merchantName="JACS MART / TOKO MITRA"
        refId={receiptNumber}
        isLight={isLight}
        onSuccess={handleQrisPaymentSuccess}
      />

      {/* Modal [+ Pelanggan Baru] Ringkas */}
      {isNewCustomerModalOpen && (
        <div
          id="modal-new-customer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
        >
          <div
            className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl space-y-4 animate-in zoom-in-95 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-700/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {language === 'ID' ? 'Daftar Pelanggan Baru' : 'Register New Customer'}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {language === 'ID' ? 'Sinkron otomatis ke Master Data Pelanggan' : 'Auto syncs to Customer Master'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">
                  {language === 'ID' ? 'Nama Lengkap Pelanggan *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'ID' ? 'Contoh: Hendra Wijaya' : 'e.g. Hendra Wijaya'}
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-semibold outline-none transition ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF] focus:bg-white'
                      : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">
                  {language === 'ID' ? 'Nomor HP / WhatsApp *' : 'WhatsApp / Mobile Number *'}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="081234567890"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono font-semibold outline-none transition ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF] focus:bg-white'
                      : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">
                  {language === 'ID' ? 'Catatan Singkat (Opsional)' : 'Short Notes (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'ID' ? 'Contoh: Langganan kantor, tetangga toko, reseller...' : 'e.g. Office regular, local neighbor...'}
                  value={newCustomerNotes}
                  onChange={(e) => setNewCustomerNotes(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-semibold outline-none transition ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0052FF] focus:bg-white'
                      : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#0052FF]'
                  }`}
                />
              </div>

              {/* Checkbox / Toggle Kepemilikan Toko */}
              <div
                className={`p-3 rounded-xl border transition ${
                  newCustomerHasStore
                    ? isLight
                      ? 'bg-emerald-50/90 border-emerald-300'
                      : 'bg-emerald-950/20 border-emerald-500/40'
                    : isLight
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newCustomerHasStore}
                    onChange={(e) => setNewCustomerHasStore(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-600 cursor-pointer accent-emerald-600 mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-white">
                      <Store className="w-3.5 h-3.5 text-emerald-400" />
                      {language === 'ID'
                        ? 'Pelanggan Memiliki Toko / Reseller Grosir'
                        : 'Customer Owns a Store / Wholesale Reseller'}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {language === 'ID'
                        ? 'Centang jika pelanggan memiliki toko fisik/usaha untuk mengaktifkan izin tier Grosir/Partai'
                        : 'Check if customer has a physical store to unlock wholesale pricing tier'}
                    </p>
                  </div>
                </label>

                {/* Input Nama Toko jika dicentang */}
                {newCustomerHasStore && (
                  <div className="mt-2.5 pt-2.5 border-t border-emerald-500/20">
                    <label className="block text-emerald-400 font-semibold mb-1 text-[11px]">
                      {language === 'ID' ? 'Nama Toko / Usaha *' : 'Store / Business Name *'}
                    </label>
                    <input
                      type="text"
                      required={newCustomerHasStore}
                      placeholder={
                        language === 'ID'
                          ? 'Contoh: Toko Barokah Jaya / UD Sinar Terang'
                          : 'e.g. Barokah Mart / UD Sinar Terang'
                      }
                      value={newCustomerStoreName}
                      onChange={(e) => setNewCustomerStoreName(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold outline-none transition ${
                        isLight
                          ? 'bg-white border-emerald-300 text-slate-900 focus:border-emerald-600'
                          : 'bg-[#161b22] border-emerald-500/50 text-white focus:border-emerald-400'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Status Awal & Kenaikan Level Otomatis (Otomasi Kasir) */}
              <div
                className={`p-3 rounded-xl border space-y-2 text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-gray-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Status Hak Akses:</span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${
                        newCustomerHasStore
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-500/20 text-slate-200 border-slate-500/40'
                      }`}
                    >
                      {newCustomerHasStore ? 'Mitra Toko Terverifikasi' : 'Perorangan (Silver)'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      newCustomerHasStore
                        ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
                        : 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                    }`}
                  >
                    {newCustomerHasStore
                      ? 'Hak: Ecer + Langganan + Grosir'
                      : 'Hak: Ecer + Langganan'}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 leading-relaxed pl-1 border-l-2 border-[#0052FF]/60 mt-1">
                  {newCustomerHasStore ? (
                    <span>
                      Pelanggan dengan toko fisik terverifikasi otomatis mendapatkan hak akses harga{' '}
                      <span className="text-emerald-400 font-bold">Grosir / Partai</span> serta member.
                    </span>
                  ) : (
                    <span>
                      Member baru perorangan otomatis mendapatkan harga{' '}
                      <span className="text-amber-300 font-semibold">Langganan/Member</span>. Tier Grosir terkunci khusus pemilik toko fisik terverifikasi.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-700/30">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl font-bold text-xs bg-transparent hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  {language === 'ID' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{language === 'ID' ? 'Simpan & Aktifkan Member' : 'Save & Activate Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Void Transaction Confirmation Dialog */}
      {isVoidConfirmOpen && (
        <div
          id="modal-confirm-void"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
        >
          <div className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center space-y-4 border ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
          }`}>
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/40 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ID' ? 'Batalkan Transaksi (VOID)?' : 'Void Transaction?'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                {language === 'ID'
                  ? `Seluruh ${cart.length} item pada keranjang kasir saat ini akan dikosongkan. Tindakan ini tidak dapat dibatalkan.`
                  : `All ${cart.length} items currently in cart will be cleared. This action cannot be undone.`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsVoidConfirmOpen(false)}
                className={`py-2.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-[#21262d] hover:bg-[#30363d] text-gray-300 border-gray-700'
                }`}
              >
                {language === 'ID' ? 'Kembali' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="py-2.5 rounded-xl font-bold text-xs bg-rose-500 hover:bg-rose-600 text-white shadow-lg transition cursor-pointer"
              >
                {language === 'ID' ? 'Ya, Batalkan (Void)' : 'Yes, Void'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Cart Item Modal */}
      <EditCartItemModal
        isOpen={editingItemIndex !== null}
        onClose={() => setEditingItemIndex(null)}
        item={editingItemIndex !== null ? cart[editingItemIndex] : null}
        onSave={handleSaveEditedItem}
        language={language}
      />

      {/* Mobile Cart Drawer Modal */}
      {isMobileCartOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className={`border-t rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-4 ${
            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#30363d] pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#0052FF]" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {language === 'ID' ? 'Lembar Transaksi Kasir' : 'Checkout Worksheet'}
                </span>
              </div>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-gray-400">
                {totalCartItemCount} {language === 'ID' ? 'Item dalam keranjang' : 'Items in cart'}
              </span>
              <span className="font-mono font-bold text-base text-emerald-600 dark:text-[#10B981]">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Quick Hold & Recall Buttons on Mobile */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileCartOpen(false);
                  handleOpenHoldModal();
                }}
                disabled={cart.length === 0}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  cart.length === 0
                    ? 'opacity-40 cursor-not-allowed border-transparent text-slate-400'
                    : isLight
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                }`}
              >
                <Pause className="w-3.5 h-3.5" />
                <span>{language === 'ID' ? 'Tahan (Hold)' : 'Hold Cart'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileCartOpen(false);
                  setIsHeldOrdersModalOpen(true);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  heldOrders.length > 0
                    ? isLight
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-[#21262d] text-gray-300 border-gray-700'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recall ({heldOrders.length})</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cart.map((item, idx) => (
                <div
                  key={`pos-receipt-${item.product?.id || item.product?.barcode || 'item'}-${idx}`}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-bold truncate text-slate-900 dark:text-white">
                      {item.product?.name || 'Produk'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-gray-400">
                      {item.quantity}x @ Rp {(item.product?.sell_price || 0).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-mono font-bold text-emerald-600 dark:text-[#10B981]">
                      Rp {(item.subtotal || 0).toLocaleString('id-ID')}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileCartOpen(false);
                        handleRequestRemoveItem(idx);
                      }}
                      className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer ml-1"
                      title="Void item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setIsMobileCartOpen(false);
                handleCheckout();
              }}
              disabled={cart.length === 0}
              className="w-full py-3.5 rounded-xl font-bold text-xs bg-[#0052FF] hover:bg-[#0043d1] text-white shadow-lg cursor-pointer"
            >
              {language === 'ID'
                ? `Bayar Sekarang (Rp ${grandTotal.toLocaleString('id-ID')})`
                : `Pay Now (Rp ${grandTotal.toLocaleString('id-ID')})`}
            </button>
          </div>
        </div>
      )}
      {/* Optional Popover Virtual Numpad Modal */}
      {isKeypadModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsKeypadModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-xs rounded-2xl p-4 border shadow-2xl space-y-3 animate-in zoom-in-95 ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-700/30">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Calculator className="w-4 h-4 text-[#0052FF]" />
                <span>{language === 'ID' ? 'Keypad Numpad Virtual' : 'Virtual Numpad'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsKeypadModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <VirtualNumpad
              value={cashGiven}
              onChange={(val) => setCashGiven(val)}
              totalAmount={grandTotal}
            />

            <button
              type="button"
              onClick={() => setIsKeypadModalOpen(false)}
              className="w-full py-2 bg-[#0052FF] hover:bg-[#0043d1] text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {language === 'ID' ? 'Selesai / Tutup' : 'Done / Close'}
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Pembayaran & Cetak Struk (APS POS5 PaymentModal) */}
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
        onSelectCustomer={(cust) => {
          handleSelectCustomer(cust);
        }}
        customers={customers}
        onConfirmPayment={(overrideMethod) => {
          if (overrideMethod) {
            setPaymentMethod(overrideMethod as PaymentMethod);
          }
          executeSaleCheckout();
        }}
        isLight={isLight}
        language={language}
        activeTerminal={activeTerminal}
        onHoldOrder={handleHoldOrderFromModal}
        onOpenQris={() => {
          setIsPaymentConfirmOpen(false);
          setIsQrisModalOpen(true);
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL 1: FORM PENUGASAN ARMADA & SURAT JALAN DO (KASIR 09 BAHAN BANGUNAN) */}
      {/* ========================================================================= */}
      {isDoModalOpen && (
        <div
          id="modal-delivery-order"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsDoModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh] animate-in zoom-in-95 ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            {/* Header Modal */}
            <div className="px-5 py-3.5 border-b border-gray-700/40 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                    <span>Penugasan Armada & Surat Jalan (DO)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      KASIR 09
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Input sopir, no. polisi kendaraan, alamat drop & preview DO resmi kuli
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDoModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Row 1: Sopir & No. Polisi Kendaraan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`font-bold block mb-1 flex items-center gap-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    <span>Nama Sopir / Driver Toko <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={doDriverName}
                    onChange={(e) => setDoDriverName(e.target.value)}
                    placeholder="Contoh: Pak Joko / Budi"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-amber-500 font-semibold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`font-bold block mb-1 flex items-center gap-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                    <Truck className="w-3.5 h-3.5 text-amber-500" />
                    <span>No. Polisi & Tipe Kendaraan <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={doVehiclePlate}
                    onChange={(e) => setDoVehiclePlate(e.target.value)}
                    placeholder="Contoh: B 9281 KBC (Truk Engkel)"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-amber-500 font-mono font-semibold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Row 2: Alamat Proyek & Nama Mandor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`font-bold block mb-1 flex items-center gap-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Alamat Drop / Lokasi Proyek <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={doProjectAddress}
                    onChange={(e) => setDoProjectAddress(e.target.value)}
                    placeholder="Contoh: Proyek Ruko Sentosa Blok C4, Jl. Pemuda"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-amber-500 font-medium ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`font-bold block mb-1 flex items-center gap-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                    <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>Nama Mandor / Penerima Proyek <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={doForemanName}
                    onChange={(e) => setDoForemanName(e.target.value)}
                    placeholder="Contoh: Mandor Yanto (0812-xxxx)"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-amber-500 font-medium ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Row 3: Jam Pengiriman & Catatan Rute */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`font-bold block mb-1 flex items-center gap-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Jam Rencana Kirim</span>
                  </label>
                  <input
                    type="text"
                    value={doDeliveryTime}
                    onChange={(e) => setDoDeliveryTime(e.target.value)}
                    placeholder="Contoh: 14:30 WIB"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-amber-500 font-mono text-center font-bold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={`font-bold block mb-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>Catatan Akses Jalan / Kuli Bongkar</label>
                  <input
                    type="text"
                    value={doNotes}
                    onChange={(e) => setDoNotes(e.target.value)}
                    placeholder="Contoh: Jalan cor beton, siap kuli bongkar di lokasi"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-amber-500 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Ringkasan Muatan Fisik */}
              <div className={`p-3 rounded-xl border space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                    <Package className="w-4 h-4 text-amber-500" />
                    <span>Daftar Muatan Fisik Material (Tanpa Harga):</span>
                  </span>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                    {(cart.length > 0 ? cart : lastCompletedDoItems).length} Material Siap Angkut
                  </span>
                </div>

                <div className={`max-h-36 overflow-y-auto border rounded-lg ${isLight ? 'border-slate-300 bg-white' : 'border-[#30363d] bg-[#0d1117]'}`}>
                  <table className="w-full text-left text-[11px]">
                    <thead className={`font-bold uppercase text-[9px] border-b ${
                      isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-[#161b22] text-gray-400 border-[#30363d]'
                    }`}>
                      <tr>
                        <th className="py-1 px-2">No</th>
                        <th className="py-1 px-2">Deskripsi Material</th>
                        <th className="py-1 px-2 text-center">Qty Fisik</th>
                        <th className="py-1 px-2 text-center">Satuan / Armada</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${
                      isLight ? 'divide-slate-200 text-slate-800' : 'divide-[#30363d] text-gray-200'
                    }`}>
                      {(cart.length > 0 ? cart : lastCompletedDoItems).map((it, idx) => (
                        <tr key={`do-item-${it.product?.id || idx}`} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-[#161b22]'}>
                          <td className="py-1 px-2 font-mono text-center opacity-70">{idx + 1}</td>
                          <td className="py-1 px-2 font-medium">
                            <div className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{it.product.name}</div>
                            <div className="text-[10px] opacity-70 font-mono">{it.product.id || it.product.barcode}</div>
                          </td>
                          <td className="py-1 px-2 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                            {it.quantity}
                          </td>
                          <td className="py-1 px-2 text-center font-mono">
                            <span className={`px-1.5 py-0.5 rounded border text-[10px] ${
                              isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-black/40 border-gray-700 text-gray-300'
                            }`}>
                              {it.selectedUnit || it.product.unit || 'Pcs'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className={`text-[10px] italic ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  * Dokumen Surat Jalan DO resmi diserahkan ke kuli & sopir tanpa mencantumkan nominal rupiah tagihan.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className={`px-5 py-3 border-t flex items-center justify-between ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#12161f] border-gray-700/40'
            }`}>
              <button
                type="button"
                onClick={() => setIsDoModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition cursor-pointer"
              >
                Batal
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewDoOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 cursor-pointer transition shadow-md active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  <span>Preview Surat Jalan Material</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDoModalOpen(false);
                    showToast(`Penugasan armada ${doVehiclePlate} (Sopir: ${doDriverName}) berhasil disimpan!`);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 cursor-pointer transition shadow-md active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Penugasan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PREVIEW CETAK SURAT JALAN DO RESMI (LAYOUT CETAK TANPA HARGA)    */}
      {/* ========================================================================= */}
      {isPreviewDoOpen && (
        <div
          id="modal-preview-do"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsPreviewDoOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh] animate-in zoom-in-95"
          >
            {/* Action Bar (Top) */}
            <div className="px-5 py-3 bg-slate-100 border-b border-slate-300 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Format Cetak Surat Jalan Pengiriman (DO Fisik)</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak DO</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewDoOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Paper Document (NO PRICES - PHYSICAL ONLY) */}
            <div id="printable-delivery-order" className="p-6 sm:p-8 space-y-4 overflow-y-auto flex-1 font-sans text-xs bg-white text-slate-900">
              {/* Header Surat Jalan */}
              <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏗️</span>
                    <h1 className="text-lg font-black tracking-tight uppercase text-slate-950">
                      DEPO BAHAN BANGUNAN NUSANTARA
                    </h1>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Jl. Raya Industri Bahan Bangunan No. 88 • Hotline Logistik: (021) 7788-9900
                  </p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs font-black uppercase text-amber-700 tracking-wider">
                    SURAT JALAN / DELIVERY ORDER
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    DO-{lastDoReceiptNumber || receiptNumber || '2026-0929-01'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Detail Penugasan Grid */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px]">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Pengemudi / Sopir Toko:</span>
                    <span className="font-bold text-slate-900">{doDriverName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">No. Polisi Armada:</span>
                    <span className="font-mono font-bold text-slate-900">{doVehiclePlate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Jam Rencana Pengiriman:</span>
                    <span className="font-mono font-bold text-amber-700">{doDeliveryTime}</span>
                  </div>
                </div>

                <div className="space-y-1 border-l border-slate-200 pl-4">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Mandor / Penerima Proyek:</span>
                    <span className="font-bold text-slate-900">{doForemanName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Alamat Drop Material:</span>
                    <span className="font-medium text-slate-900">{doProjectAddress}</span>
                  </div>
                  {doNotes && (
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Catatan Rute:</span>
                      <span className="text-slate-700 italic">{doNotes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Physical Material Table (NO PRICES) */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-200 border-b border-slate-300 font-bold uppercase text-[10px] text-slate-800">
                    <tr>
                      <th className="py-2 px-2.5 text-center w-10">No</th>
                      <th className="py-2 px-2.5">Kode Material</th>
                      <th className="py-2 px-2.5">Nama Barang & Spesifikasi Armada</th>
                      <th className="py-2 px-2.5 text-center">Kuantitas Fisik</th>
                      <th className="py-2 px-2.5 text-center w-24">Cek Gudang</th>
                      <th className="py-2 px-2.5 text-center w-24">Cek Proyek</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {(cart.length > 0 ? cart : lastCompletedDoItems).map((it, idx) => (
                      <tr key={`print-do-${it.product?.id || idx}`}>
                        <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-600">{idx + 1}</td>
                        <td className="py-2 px-2.5 font-mono text-[11px] font-bold text-slate-800">
                          {it.product?.id || it.product?.barcode || '-'}
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="font-bold text-slate-900 text-xs">{it.product.name}</div>
                          <div className="text-[10px] text-slate-600">
                            Satuan/Armada: <span className="font-semibold text-slate-900">{it.selectedUnit || it.product.unit || 'Pcs'}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono font-black text-sm text-slate-950">
                          {it.quantity} {it.selectedUnit || it.product.unit}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono text-slate-400">
                          [ &nbsp;&nbsp;&nbsp; ]
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono text-slate-400">
                          [ &nbsp;&nbsp;&nbsp; ]
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Disclaimer */}
              <div className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold">Perhatian:</span> Harap periksa jenis dan kuantitas material bangunan fisik saat serah terima di lokasi proyek sebelum ditandatangani. Barang yang sudah diturunkan dari armada tidak dapat ditukar kecuali ada cacat pabrikasi/kerusakan saat transit.
              </div>

              {/* 3 Column Signature Area */}
              <div className="grid grid-cols-3 gap-4 pt-4 text-center text-xs">
                <div className="space-y-12">
                  <div className="font-bold text-slate-700 text-[11px] uppercase">
                    Pengemudi / Sopir
                  </div>
                  <div>
                    <div className="border-b border-slate-400 mx-6"></div>
                    <div className="text-[11px] font-bold text-slate-900 mt-1">
                      ( {doDriverName.split(' ')[0] || 'Sopir Toko'} )
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="font-bold text-slate-700 text-[11px] uppercase">
                    Checker / Petugas Gudang
                  </div>
                  <div>
                    <div className="border-b border-slate-400 mx-6"></div>
                    <div className="text-[11px] font-bold text-slate-900 mt-1">
                      ( {activeUser?.name || 'Checker Depo'} )
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="font-bold text-slate-700 text-[11px] uppercase">
                    Penerima / Mandor Proyek
                  </div>
                  <div>
                    <div className="border-b border-slate-400 mx-6"></div>
                    <div className="text-[11px] font-bold text-slate-900 mt-1">
                      ( {doForemanName.split(' ')[0] || 'Mandor Penerima'} )
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-100 border-t border-slate-300 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPreviewDoOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                ← Kembali ke Form
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPreviewDoOpen(false);
                  setIsDoModalOpen(false);
                  showToast('Surat Jalan Pengiriman DO siap diserahkan ke sopir dan kuli!');
                }}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL SHIFT KASIR & REKONSILIASI KAS (APS POS4: 32_ShiftKasir)             */}
      {/* ========================================================================= */}
      {/* 1. Modal Buka Shift Kasir (Wajib di awal shift jika belum dibuka) */}
      <OpenShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        onSuccess={() => {
          setIsOpenShiftModalOpen(false);
          const ind = getTerminalIndustry(activeTerminal);
          setCart(INDUSTRY_DEMO_CARTS[ind] || INDUSTRY_DEMO_CARTS.retail);
          setIsRegisterOpen(true);
        }}
        isLight={isLight}
      />

      {/* 2. Modal Quick Action Tarik Kas / Petty Cash Kasir Keluar */}
      <PettyCashModal
        isOpen={isPettyCashModalOpen}
        onClose={() => setIsPettyCashModalOpen(false)}
        isLight={isLight}
      />

      {/* 3. Modal Tutup Shift Kasir & Rekonsiliasi Kas (End of Day) */}
      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
        onShiftClosed={(closedShift) => {
          setClosedShiftForReceipt(closedShift);
          handleCashierLogout();
        }}
        isLight={isLight}
      />

      {/* 4. Mini Summary Receipt Modal Cetak Rekonsiliasi Shift Kasir */}
      {closedShiftForReceipt && (
        <ShiftSummaryReceiptModal
          shift={closedShiftForReceipt}
          onClose={() => setClosedShiftForReceipt(null)}
          isLight={isLight}
        />
      )}

      {/* 5. Modal Verifikasi PIN Khusus Akses Backend / ERP Kasir 02 (Hybrid) */}
      {isHybridPinModalOpen && pendingHybridModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div
            className={`w-full max-w-sm rounded-3xl border-2 border-amber-500 shadow-2xl p-6 ${
              isLight ? 'bg-white text-slate-900' : 'bg-[#161b22] text-white'
            }`}
          >
            {/* Modal Header */}
            <div className="text-center mb-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mb-3 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.35)]">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black tracking-tight text-amber-600 dark:text-amber-400">
                Verifikasi Otorisasi PIN
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Akses Modul Backend ERP:{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {pendingHybridModule.label}
                </span>
              </p>
            </div>

            {/* PIN Display Dots */}
            <div className="mb-4">
              <div className="flex justify-center gap-3 my-2">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = hybridPinInput.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                        filled
                          ? 'bg-amber-500 border-amber-500 scale-110 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                          : 'border-slate-300 dark:border-slate-700 bg-transparent'
                      }`}
                    />
                  );
                })}
              </div>

              {hybridPinError && (
                <p className="text-xs text-rose-500 text-center font-semibold mt-2 animate-shake">
                  {hybridPinError}
                </p>
              )}
            </div>

            {/* Keypad 0-9 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => {
                    if (hybridPinInput.length < 6) {
                      const next = hybridPinInput + digit;
                      setHybridPinInput(next);
                      setHybridPinError(null);
                      if (next.length === 4) {
                        handleVerifyHybridPin(next);
                      }
                    }
                  }}
                  className={`py-3 rounded-2xl font-black text-lg border cursor-pointer active:scale-95 transition ${
                    isLight
                      ? 'bg-slate-100 hover:bg-amber-100/70 border-slate-200 text-slate-800'
                      : 'bg-[#21262d] hover:bg-[#30363d] border-[#30363d] text-white hover:border-amber-500/40'
                  }`}
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setHybridPinInput('');
                  setHybridPinError(null);
                }}
                className="py-3 rounded-2xl font-bold text-xs border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 cursor-pointer active:scale-95 transition"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  if (hybridPinInput.length < 6) {
                    const next = hybridPinInput + '0';
                    setHybridPinInput(next);
                    setHybridPinError(null);
                    if (next.length === 4) {
                      handleVerifyHybridPin(next);
                    }
                  }
                }}
                className={`py-3 rounded-2xl font-black text-lg border cursor-pointer active:scale-95 transition ${
                  isLight
                    ? 'bg-slate-100 hover:bg-amber-100/70 border-slate-200 text-slate-800'
                    : 'bg-[#21262d] hover:bg-[#30363d] border-[#30363d] text-white hover:border-amber-500/40'
                }`}
              >
                0
              </button>
              <button
                type="button"
                onClick={() => {
                  setHybridPinInput((prev) => prev.slice(0, -1));
                  setHybridPinError(null);
                }}
                className={`py-3 rounded-2xl font-bold text-xs border cursor-pointer active:scale-95 transition ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                    : 'bg-[#21262d] hover:bg-[#30363d] border-[#30363d] text-slate-300'
                }`}
              >
                ⌫ Del
              </button>
            </div>

            {/* Quick PIN Presets & Action Buttons */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-4 px-1">
              <span>PIN Kasir 02: <strong className="text-amber-500 font-mono">2222</strong></span>
              <span>PIN Default: <strong className="text-slate-500 dark:text-slate-300 font-mono">1234</strong></span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsHybridPinModalOpen(false);
                  setPendingHybridModule(null);
                  setHybridPinInput('');
                  setHybridPinError(null);
                }}
                className="py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleVerifyHybridPin()}
                className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition cursor-pointer"
              >
                Verifikasi PIN ↵
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosModule;
