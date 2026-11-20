import React, { useState, useMemo } from 'react';
import {
  Tag,
  X,
  Check,
  Percent,
  DollarSign,
  Gift,
  Sparkles,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Delete,
  FileText,
  UserCheck,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PromotionProgram } from '../../types';
import {
  filterPromotionProgramsByDomain,
  isCampaignActiveToday,
  loadPromoCampaignsForDomain,
} from '../../utils/promoEngine';

export interface DiscountVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  discountType: 'IDR' | 'PERCENT';
  discountAmount: number;
  discountPercent: number;
  subtotal: number;
  onApplyDiscount: (
    type: 'IDR' | 'PERCENT',
    val: number,
    meta?: {
      isSupervisorApproved?: boolean;
      supervisorName?: string;
      reason?: string;
      promoCode?: string;
      promoName?: string;
    }
  ) => void;
  language?: 'ID' | 'EN';
  activeTerminalModelType?: string | null;
}

const SUPERVISOR_PINS: Record<string, string> = {
  '1234': 'Spv. Hendra (Store Supervisor)',
  '8888': 'Spv. Bambang (Area Manager)',
};

const MANUAL_DISCOUNT_REASONS = [
  'Promo Pelanggan Butik / VIP Member',
  'Display Sample / Cacat Jahitan Minor',
  'Barang Cacat Fisik / Kemasan Rusak Ringan',
  'Kompensasi Keluhan & Pelayanan Pelanggan',
  'Negosiasi Khusus Pelanggan Borongan / VIP',
  'Penyesuaian Selisih Harga Lapangan / Display',
  'Diskon Kebijakan Khusus Manajemen Toko',
];

const MAX_CASHIER_SELF_DISC_PCT = 15;

export const DiscountVoucherModal: React.FC<DiscountVoucherModalProps> = ({
  isOpen,
  onClose,
  discountType: initialType,
  discountAmount: initialAmount,
  discountPercent: initialPercent,
  subtotal,
  onApplyDiscount,
  language = 'ID',
  activeTerminalModelType = null,
}) => {
  const { promotions, addAuditLog, showToast, theme, businessDomainConfig } = useApp();
  const isLight = theme === 'light';
  const isEn = language === 'EN';

  const isBuildingDomain = useMemo(() => {
    if (!businessDomainConfig?.isHybridMultiUnit) {
      return businessDomainConfig?.mechanismFamily === 'BUILDING_BULK';
    }
    return (activeTerminalModelType || '').toLowerCase() === 'building';
  }, [businessDomainConfig?.isHybridMultiUnit, businessDomainConfig?.mechanismFamily, activeTerminalModelType]);

  // Ambil hanya promo resmi dari Executive / Merchandising yang aktif dan relevan dengan rumpun usaha aktif
  const activePromos = useMemo(() => {
    const rawActive = (promotions || []).filter(
      (p) => p.status === 'ACTIVE' || p.isActive === true
    );
    const domainFiltered = filterPromotionProgramsByDomain(
      rawActive,
      businessDomainConfig,
      activeTerminalModelType
    );

    const domainCampaigns = loadPromoCampaignsForDomain(
      businessDomainConfig,
      activeTerminalModelType
    ).filter((c) => isCampaignActiveToday(c));

    const existingCodes = new Set(domainFiltered.map((p) => (p.code || '').toUpperCase()));
    const mappedCampaigns: PromotionProgram[] = domainCampaigns
      .filter((c) => !existingCodes.has((c.code || '').toUpperCase()))
      .map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        type:
          c.sourceType === 'STORE_BND'
            ? 'BUNDLING'
            : c.sourceType === 'FEFO_EXP'
            ? 'FLASH_SALE'
            : c.targetType === 'CATEGORY'
            ? 'CATEGORY_DISCOUNT'
            : 'SKU_DISCOUNT',
        discountType: c.discountType === 'PERCENT' ? 'PERCENT' : 'IDR',
        discountValueType: c.discountType === 'PERCENT' ? 'PERCENT' : 'NOMINAL',
        discountValue: c.discountValue,
        minSpend: c.pwpMinCartSubtotal || 0,
        targetProductSku: c.targetValue,
        startDate: c.startDate,
        endDate: c.endDate,
        status: 'ACTIVE',
        isActive: true,
        approvedBy: c.supplierName ? `Rebate: ${c.supplierName}` : 'Manajemen Eksekutif',
        description: `Target: ${c.targetValue}`,
      }));

    return [...domainFiltered, ...mappedCampaigns];
  }, [promotions, businessDomainConfig, activeTerminalModelType]);

  const getPromoType = (p: {
    discountType?: 'PERCENT' | 'IDR';
    discountValueType?: 'PERCENT' | 'NOMINAL';
  }): 'PERCENT' | 'IDR' => {
    if (p.discountType) return p.discountType;
    return p.discountValueType === 'PERCENT' ? 'PERCENT' : 'IDR';
  };

  // State Tab: 'official' (Promo Resmi Terpusat) vs 'manual' (Diskon Khusus Supervisor)
  const [activeTab, setActiveTab] = useState<'official' | 'manual'>('official');

  // State Promo Resmi Terpilih
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [voucherCodeInput, setVoucherCodeInput] = useState<string>('');
  const [voucherFeedback, setVoucherFeedback] = useState<{
    text: string;
    success: boolean;
  } | null>(null);

  // State Diskon Manual
  const [manualType, setManualType] = useState<'IDR' | 'PERCENT'>(initialType || 'PERCENT');
  const [manualAmount, setManualAmount] = useState<number>(initialAmount || 0);
  const [manualPercent, setManualPercent] = useState<number>(initialPercent || 0);

  // State Supervisor PIN Otorisasi
  const [isSupervisorAuthorized, setIsSupervisorAuthorized] = useState<boolean>(false);
  const [authorizedSupervisor, setAuthorizedSupervisor] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>(MANUAL_DISCOUNT_REASONS[0]);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Cek promo voucher resmi dari sistem pusat (Tanpa bypass kode sembarangan)
  const handleVerifyVoucherCode = () => {
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) return;

    // Strict validation: hanya cocokkan dengan program promo resmi pusat
    const found = activePromos.find((p) => p.code.toUpperCase() === code);
    if (found) {
      setSelectedPromoId(found.id);
      const pType = getPromoType(found);
      const valStr =
        pType === 'PERCENT'
          ? `${found.discountValue}%`
          : `Rp ${found.discountValue.toLocaleString('id-ID')}`;
      setVoucherFeedback({
        text: `✓ Promo resmi aktif ditemukan: "${found.name}" (${valStr}) disetujui ${found.approvedBy || 'Manajemen'}`,
        success: true,
      });
    } else {
      setSelectedPromoId(null);
      setVoucherFeedback({
        text: isEn
          ? '✕ Code not registered in central Executive/Merchandising promotions system.'
          : '✕ Kode tidak terdaftar pada kebijakan promo resmi pusat. Hubungi Tim Merchandising.',
        success: false,
      });
    }
  };

  // Verifikasi PIN Supervisor
  const handleVerifyPin = (pinToTest?: string) => {
    const pin = (pinToTest !== undefined ? pinToTest : pinInput).trim();
    if (!pin) {
      setPinError('Masukkan 4 digit PIN Supervisor');
      return;
    }

    const supervisor = SUPERVISOR_PINS[pin];
    if (supervisor) {
      setIsSupervisorAuthorized(true);
      setAuthorizedSupervisor(supervisor);
      setPinError(null);
      setPinInput('');
      showToast(`Otorisasi diterima: ${supervisor}`);
      addAuditLog(
        `Otorisasi Supervisor Sukses: ${supervisor} membuka akses diskon manual kasir (Alasan: ${selectedReason})`,
        'POS Security',
        'INFO'
      );
    } else {
      setPinError(isEn ? 'Invalid Supervisor PIN!' : 'PIN Supervisor salah! Akses diskon manual ditolak.');
      setPinInput('');
    }
  };

  const handleNumpadKey = (num: string) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + num;
      setPinInput(nextPin);
      setPinError(null);
      if (nextPin.length === 4) {
        handleVerifyPin(nextPin);
      }
    }
  };

  const handleNumpadBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleNumpadClear = () => {
    setPinInput('');
    setPinError(null);
  };

  // Hitung batas otorisasi kasir mandiri (<= 15%) vs Supervisor PIN (> 15%)
  const effectiveManualPct = useMemo(() => {
    if (manualType === 'PERCENT') {
      return Math.min(100, Math.max(0, manualPercent));
    }
    if (subtotal <= 0) return manualAmount > 0 ? 100 : 0;
    return (Math.max(0, manualAmount) / subtotal) * 100;
  }, [manualType, manualPercent, manualAmount, subtotal]);

  const needsSupervisorAuth = effectiveManualPct > MAX_CASHIER_SELF_DISC_PCT;

  // Hitung preview potongan
  const activePromoObj = activePromos.find((p) => p.id === selectedPromoId);
  const calculatedSavings = useMemo(() => {
    if (activeTab === 'official' && activePromoObj) {
      const pType = getPromoType(activePromoObj);
      if (pType === 'PERCENT') {
        return Math.round((subtotal * Math.min(100, activePromoObj.discountValue)) / 100);
      }
      return Math.min(subtotal, activePromoObj.discountValue);
    }
    if (activeTab === 'manual' && (!needsSupervisorAuth || isSupervisorAuthorized)) {
      if (manualType === 'PERCENT') {
        return Math.round((subtotal * Math.min(100, manualPercent)) / 100);
      }
      return Math.min(subtotal, manualAmount);
    }
    return 0;
  }, [activeTab, activePromoObj, subtotal, needsSupervisorAuth, isSupervisorAuthorized, manualType, manualPercent, manualAmount]);

  const newSubtotalPreview = Math.max(0, subtotal - calculatedSavings);

  // Simpan & Terapkan Diskon ke Transaksi Kasir
  const handleApplyFinalDiscount = () => {
    if (activeTab === 'official') {
      if (!activePromoObj) {
        showToast('Pilih salah satu promo resmi pusat terlebih dahulu.');
        return;
      }
      const pType = getPromoType(activePromoObj);
      const val = activePromoObj.discountValue;

      addAuditLog(
        `Kasir menerapkan promo resmi pusat: "${activePromoObj.name}" (${activePromoObj.code}) senilai ${
          pType === 'PERCENT' ? `${val}%` : `Rp ${val.toLocaleString('id-ID')}`
        } pada transaksi POS`,
        'POS Promotion',
        'INFO'
      );

      onApplyDiscount(pType, val, {
        promoCode: activePromoObj.code,
        promoName: activePromoObj.name,
      });
      onClose();
    } else {
      const val = manualType === 'PERCENT' ? manualPercent : manualAmount;
      if (val <= 0) {
        showToast('Tentukan nilai diskon manual terlebih dahulu.');
        return;
      }
      if (!selectedReason.trim()) {
        showToast('Pilih alasan promo / diskon manual terlebih dahulu.');
        return;
      }
      if (needsSupervisorAuth && !isSupervisorAuthorized) {
        showToast(`Diskon > ${MAX_CASHIER_SELF_DISC_PCT}% wajib otorisasi PIN Supervisor!`);
        return;
      }

      const approverLabel = needsSupervisorAuth
        ? authorizedSupervisor
        : `Kasir Mandiri (≤ ${MAX_CASHIER_SELF_DISC_PCT}%)`;

      addAuditLog(
        `Diskon manual nota sebesar ${
          manualType === 'PERCENT' ? `${val}%` : `Rp ${val.toLocaleString('id-ID')}`
        } diterapkan oleh ${approverLabel} (Alasan: ${selectedReason})`,
        needsSupervisorAuth ? 'POS Supervisor Override' : 'POS Promotion',
        needsSupervisorAuth ? 'WARN' : 'INFO'
      );

      onApplyDiscount(manualType, val, {
        isSupervisorApproved: needsSupervisorAuth,
        supervisorName: approverLabel,
        reason: selectedReason,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-discount-voucher"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
    >
      <div className={`w-full max-w-lg border rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden ${
        isLight
          ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-900'
          : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-white'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/60'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-base leading-6 text-slate-900 dark:text-white">
                  {isEn ? 'Centralized Promo & Discount Policy' : 'Kebijakan Diskon & Promo Terpusat'}
                </h3>
                <span className="text-[10px] font-mono font-normal px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  EXECUTIVE HUB
                </span>
              </div>
              <p className="text-xs leading-5 font-normal text-slate-500 dark:text-slate-400">
                {isEn
                  ? 'Cashier operates under central merchandising rules'
                  : 'Wewenang diskon terpusat di modul Executive / Merchandising'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                : 'text-slate-400 hover:text-white hover:bg-slate-800 border-slate-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className={`px-4 pt-3 pb-2 border-b flex gap-2 shrink-0 ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('official')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-normal transition flex items-center justify-center gap-2 cursor-pointer border active:scale-[0.99] ${
              activeTab === 'official'
                ? 'bg-purple-600/20 text-purple-700 dark:text-purple-300 border-purple-500 shadow-xs'
                : isLight
                ? 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Gift className="w-4 h-4 text-purple-500" />
            <span>{isEn ? 'Official Authorized Promos' : 'Promo Resmi Pusat'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-700 dark:text-purple-300">
              {activePromos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-normal transition flex items-center justify-center gap-2 cursor-pointer border active:scale-[0.99] ${
              activeTab === 'manual'
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500 shadow-xs'
                : isLight
                ? 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            {!needsSupervisorAuth || isSupervisorAuthorized ? (
              <Unlock className="w-4 h-4 text-emerald-500" />
            ) : (
              <Lock className="w-4 h-4 text-amber-500" />
            )}
            <span>{isEn ? 'Manual Discount' : 'Diskon Manual Nota'}</span>
            {isSupervisorAuthorized && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                SPV
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: PROMO RESMI PUSAT (READ-ONLY 1-KLIK) */}
          {activeTab === 'official' && (
            <div className="space-y-4">
              {/* Central Policy Alert */}
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-2.5 text-xs text-purple-200">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">
                    {isEn ? 'Executive Merchandising Rulebook:' : 'Aturan Merchandising Terpusat:'}
                  </span>
                  <span>
                    {isEn
                      ? 'Cashiers can only apply authorized promotions issued by Management & Clearance Radar. Arbitrary coupons are blocked.'
                      : 'Kasir hanya dapat memilih dan menerapkan program promosi resmi yang telah diotorisasi Manajemen & Radar Kedaluwarsa.'}
                  </span>
                </div>
              </div>

              {/* Voucher Code Search & Claim */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isEn ? 'Verify Official Promo Code:' : 'Klaim Kode Promo Resmi:'}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={
                      isBuildingDomain
                        ? 'Contoh: REBATE-SEMEN-TGRD, DISC-VOL-BESI, 200-BND-MAT-CAT01'
                        : 'Contoh: CUCI50-SUSU, 200-BND-SEMBAKO01, PWP-TEBUS-BIMOLI'
                    }
                    value={voucherCodeInput}
                    onChange={(e) => setVoucherCodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyVoucherCode()}
                    className="flex-1 bg-[#0d1117] border border-[#30363d] text-white px-3 py-2 rounded-xl text-xs uppercase outline-none focus:border-purple-400 font-mono tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyVoucherCode}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                  >
                    {isEn ? 'Verify' : 'Validasi'}
                  </button>
                </div>
                {voucherFeedback && (
                  <p
                    className={`text-[11px] font-semibold mt-1 ${
                      voucherFeedback.success ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {voucherFeedback.text}
                  </p>
                )}
              </div>

              {/* Active Promotions List (1-Click Selection) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isEn ? 'Available Central Promotions (1-Click):' : 'Daftar Promo Resmi Aktif (1-Klik):'}</span>
                  </span>
                  <span className="text-[10px] text-gray-500 font-normal">Pilih salah satu</span>
                </div>

                {activePromos.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-[#30363d] text-center text-xs text-gray-400 space-y-1">
                    <p className="font-semibold text-gray-300">Belum ada promo resmi aktif</p>
                    <p className="text-[11px]">
                      Buat aturan promo di modul <strong>Executive &rarr; Promo &amp; Paket</strong> atau aktifkan dari{' '}
                      <strong>Radar Kedaluwarsa</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                    {activePromos.map((promo) => {
                      const pType = getPromoType(promo);
                      const isSelected = selectedPromoId === promo.id;
                      const valDisplay =
                        pType === 'PERCENT'
                          ? `${promo.discountValue}% OFF`
                          : `Rp ${promo.discountValue.toLocaleString('id-ID')} OFF`;

                      return (
                        <div
                          key={promo.id}
                          onClick={() => {
                            setSelectedPromoId(promo.id);
                            setVoucherCodeInput(promo.code);
                            setVoucherFeedback({
                              text: `✓ Promo terpilih: "${promo.name}" (${valDisplay})`,
                              success: true,
                            });
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition relative flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.25)] ring-1 ring-purple-500'
                              : 'bg-[#12161d] hover:bg-[#1a202c] border-[#30363d]'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-black text-xs text-amber-300 px-2 py-0.5 rounded bg-black/40 border border-amber-500/30">
                                {promo.code}
                              </span>
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                {promo.type.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="font-bold text-xs text-white truncate">{promo.name}</div>
                            {promo.description && (
                              <div className="text-[11px] text-gray-400 truncate mt-0.5">
                                {promo.description}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500 font-mono mt-1">
                              Otorisasi: {promo.approvedBy || promo.authorizedBy || 'Direksi Eksekutif'}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono font-black text-emerald-400 text-sm">{valDisplay}</div>
                            <div className="mt-1">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                                  <Check className="w-3 h-3" /> Terpilih
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-gray-400 hover:text-white">
                                  Klik Pasang &rarr;
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DISKON MANUAL NOTA (KASIR <= 15% MANDIRI, > 15% PIN SUPERVISOR) */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              {/* Batas Otorisasi Info */}
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                needsSupervisorAuth && !isSupervisorAuthorized
                  ? 'border-amber-500/40 bg-amber-950/20 text-amber-200'
                  : 'border-emerald-500/35 bg-emerald-950/20 text-emerald-200'
              }`}>
                {needsSupervisorAuth && !isSupervisorAuthorized ? (
                  <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">
                    {needsSupervisorAuth && !isSupervisorAuthorized
                      ? `Melebihi Batas Kasir (${MAX_CASHIER_SELF_DISC_PCT}%) — Otorisasi PIN Supervisor Diperlukan`
                      : isSupervisorAuthorized
                      ? `Otorisasi Supervisor Aktif: ${authorizedSupervisor}`
                      : `Diskon Kasir Mandiri Aktif (Maks. ${MAX_CASHIER_SELF_DISC_PCT}% per Nota)`}
                  </span>
                  <span className="text-[11px] opacity-85">
                    Potongan s.d. {MAX_CASHIER_SELF_DISC_PCT}% dapat diterapkan langsung dengan alasan promo. Di atas {MAX_CASHIER_SELF_DISC_PCT}% wajib PIN Supervisor.
                  </span>
                </div>
              </div>

              {/* Alasan Diskon Manual */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isEn ? 'Discount Reason (Mandatory Audit):' : 'Alasan Promo / Diskon (Wajib Audit):'}</span>
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white text-xs p-2.5 rounded-xl outline-none focus:border-amber-400 cursor-pointer"
                >
                  {MANUAL_DISCOUNT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Manual Discount Type Selector */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">Tipe Potongan Nota:</span>
                <div className="flex bg-[#0d1117] p-0.5 rounded-xl border border-[#30363d]">
                  <button
                    type="button"
                    onClick={() => setManualType('PERCENT')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                      manualType === 'PERCENT'
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Persentase (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualType('IDR')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                      manualType === 'IDR'
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Nominal (Rp)
                  </button>
                </div>
              </div>

              {/* Input Fields */}
              {manualType === 'PERCENT' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={manualPercent || ''}
                      onChange={(e) =>
                        setManualPercent(
                          Math.min(100, Math.max(0, Number(e.target.value) || 0))
                        )
                      }
                      className="w-full bg-[#0d1117] border border-[#30363d] text-white pl-4 pr-10 py-2.5 rounded-xl text-base font-mono font-bold outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                      %
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[5, 10, 15, 20, 30].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setManualPercent(val)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer font-mono border ${
                          val > MAX_CASHIER_SELF_DISC_PCT
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-[#21262d] hover:bg-[#30363d] text-gray-200 border-[#30363d]'
                        }`}
                      >
                        {val}%{val > MAX_CASHIER_SELF_DISC_PCT ? ' 🔒' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      placeholder="0"
                      value={manualAmount || ''}
                      onChange={(e) =>
                        setManualAmount(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="w-full bg-[#0d1117] border border-[#30363d] text-white pl-10 pr-4 py-2.5 rounded-xl text-base font-mono font-bold outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    {[10000, 25000, 50000, 100000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setManualAmount(val)}
                        className="flex-1 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-200 text-[11px] font-bold rounded-lg transition cursor-pointer font-mono border border-[#30363d]"
                      >
                        Rp {(val / 1000).toLocaleString('id-ID')}k
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Supervisor PIN Box (Hanya Muncul Saat Diskon > 15% & Belum Terotorisasi) */}
              {needsSupervisorAuth && !isSupervisorAuthorized && (
                <div className="p-4 rounded-xl border border-amber-500/35 bg-amber-950/20 space-y-3 animate-in fade-in">
                  <div className="text-center">
                    <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2">
                      OTORISASI PIN SUPERVISOR (DISKON {effectiveManualPct.toFixed(1)}% &gt; {MAX_CASHIER_SELF_DISC_PCT}%)
                    </div>
                    <div className="flex justify-center gap-3">
                      {[0, 1, 2, 3].map((idx) => {
                        const filled = idx < pinInput.length;
                        return (
                          <div
                            key={idx}
                            className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                              filled
                                ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] scale-110'
                                : 'bg-[#21262d] border border-[#30363d]'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {pinError && (
                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center flex items-center justify-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{pinError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-1.5">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleNumpadKey(num)}
                        className="h-9 rounded-xl font-mono font-bold text-sm bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] transition active:scale-95 cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleNumpadClear}
                      className="h-9 rounded-xl text-[11px] font-bold bg-[#21262d]/60 hover:bg-[#21262d] text-gray-400 border border-[#30363d] transition cursor-pointer"
                    >
                      CLEAR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumpadKey('0')}
                      className="h-9 rounded-xl font-mono font-bold text-sm bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] transition active:scale-95 cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleNumpadBackspace}
                      className="h-9 rounded-xl text-xs font-bold bg-[#21262d]/60 hover:bg-rose-950/40 text-rose-400 border border-[#30363d] transition flex items-center justify-center cursor-pointer"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-1.5 border-t border-[#30363d]">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Klik Cepat PIN Demo:</span>
                      <span className="text-amber-400 font-mono">PIN: 1234 / 8888</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleVerifyPin('1234')}
                        className="p-2 rounded-xl bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-left transition flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <div className="text-[11px] font-bold text-white">Spv. Hendra</div>
                          <div className="text-[10px] text-amber-400 font-mono">PIN: 1234</div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVerifyPin('8888')}
                        className="p-2 rounded-xl bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-left transition flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <div className="text-[11px] font-bold text-white">Spv. Bambang</div>
                          <div className="text-[10px] text-amber-400 font-mono">PIN: 8888</div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isSupervisorAuthorized && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span>SPV Aktif: <strong>{authorizedSupervisor}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSupervisorAuthorized(false);
                      setAuthorizedSupervisor('');
                    }}
                    className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                  >
                    Kunci PIN
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: Live Savings Calculation & Action Buttons */}
        <div className={`p-4 sm:p-5 border-t space-y-3 shrink-0 ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/60'
        }`}>
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-500 dark:text-slate-400">Total Potongan Diskon:</span>
            <span className="font-mono font-semibold text-rose-500 text-sm">
              -Rp {calculatedSavings.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs px-1 pb-1">
            <span className="text-slate-500 dark:text-slate-400">Subtotal Baru (Setelah Diskon):</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-base">
              Rp {newSubtotalPreview.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                onApplyDiscount('PERCENT', 0);
                onClose();
              }}
              className={`py-2.5 rounded-xl text-xs font-normal border transition cursor-pointer active:scale-[0.99] ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-800/60 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              {isEn ? 'Clear Discount' : 'Hapus Diskon'}
            </button>
            <button
              type="button"
              onClick={handleApplyFinalDiscount}
              className="py-2.5 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.99]"
            >
              <Check className="w-4 h-4" />
              <span>{isEn ? 'Apply to Order' : 'Terapkan ke Transaksi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountVoucherModal;
