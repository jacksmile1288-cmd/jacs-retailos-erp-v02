import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { useAudit } from '../../audit';
import {
  Sparkles,
  Plus,
  AlertTriangle,
  Trash2,
  Printer,
  X,
  Gift,
  ShoppingBag,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';
import { PromoPosterStudioModal, scrollWorkspaceToTop } from './PromoPosterStudioModal';
import { getEffectiveBusinessDomainConfig } from '../../utils/businessDomainConfig';
import { BUILDING_HARDWARE_PRODUCTS, FASHION_APPAREL_PRODUCTS } from '../../data/industryTerminalProducts';
import { FNB_PRODUCTS } from '../../data/fnbData';

import {
  PromoSourceType,
  PromoMechanic,
  PromoStatus,
  DiscountType,
  TargetType,
  PromoCampaign,
  DEFAULT_BUILDING_PROMO_CAMPAIGNS,
  DEFAULT_FNB_PROMO_CAMPAIGNS,
  filterPromoCampaignsByDomain,
  isVolumeBoronganCampaign,
  loadPromoCampaigns,
  savePromoCampaigns,
  normalizeMaxQtyPerReceipt,
} from '../../utils/promoEngine';

export type { PromoSourceType, PromoMechanic, PromoStatus, DiscountType, TargetType, PromoCampaign };

interface PromoCampaignCenterTabProps {
  isDark: boolean;
}

export const PromoCampaignCenterTab: React.FC<PromoCampaignCenterTabProps> = ({ isDark }) => {
  const { products, customers, businessProfile, businessDomainConfig, showToast } = useApp();
  const { recordAudit } = useAudit();

  const effectiveDomainConfig = useMemo(
    () => businessDomainConfig || getEffectiveBusinessDomainConfig(businessProfile),
    [businessDomainConfig, businessProfile]
  );
  const activeFamily = effectiveDomainConfig.mechanismFamily;
  const isBuildingBulk = activeFamily === 'BUILDING_BULK';
  const isFnbCulinary = activeFamily === 'FNB_CULINARY';

  const activeBusinessIdentity = useMemo(() => {
    const customName = businessProfile?.name?.trim();
    if (customName) return customName;
    if (isFnbCulinary) return 'NASI PADANG HUMAIRA';
    if (isBuildingBulk) return 'DEPO BANGUNAN & BESI BAJA';
    return 'NEXUS SWALAYAN & RITEL';
  }, [businessProfile?.name, isFnbCulinary, isBuildingBulk]);

  const domainProducts = useMemo(() => {
    if (isBuildingBulk) {
      const map = new Map<string, any>();
      BUILDING_HARDWARE_PRODUCTS.forEach((p) => map.set(p.id, p));
      (products || []).forEach((p: any) => {
        const idStr = String(p?.id || '');
        const catLower = String(p?.category || '').toLowerCase();
        if (
          p?.businessModel === 'building' ||
          idStr.startsWith('MAT-') ||
          Boolean(p?.materialNature) ||
          ['semen', 'pasir', 'batu', 'besi', 'baja', 'perpipaan', 'paku', 'kawat', 'kayu', 'cat', 'perkakas', 'material'].some(
            (kw) => catLower.includes(kw)
          )
        ) {
          map.set(p.id, p);
        }
      });
      return Array.from(map.values());
    }

    if (isFnbCulinary) {
      const map = new Map<string, any>();
      // Muat katalog standar 18 Menu F&B lengkap dengan foto, harga jual, dan HPP
      FNB_PRODUCTS.forEach((p: any) => {
        map.set(p.id, {
          ...p,
          image: p.image || p.imageUrl,
          imageUrl: p.imageUrl || p.image,
          sell_price: Number(p.sell_price ?? p.price_retail ?? p.price ?? 0),
          cost_price: Number(p.cost_price ?? p.costPrice ?? p.cost ?? 0),
        });
      });
      // Gabungkan menu F&B kustom dari state products, sembunyikan bahan baku (RM-FNB/ING) & produk minimarket/elektronik
      (products || []).forEach((p: any) => {
        const idUpper = String(p?.id || '').toUpperCase();
        const itemTypeUpper = String(p?.item_type || '').toUpperCase();
        const catLower = String(p?.category || '').toLowerCase();
        if (
          idUpper.startsWith('RM-FNB-') ||
          idUpper.startsWith('ING-') ||
          idUpper.startsWith('MAT-') ||
          itemTypeUpper === 'RAW_MATERIAL' ||
          catLower.includes('bahan baku')
        ) {
          return;
        }
        const isFnbMenu =
          idUpper.startsWith('FNB-') ||
          itemTypeUpper === 'MENU_FB' ||
          p?.businessModel === 'fnb' ||
          ['kopi', 'non-kopi', 'makanan utama', 'pastry', 'bakery', 'paket hemat'].some((kw) => catLower.includes(kw));
        if (isFnbMenu) {
          const existing = map.get(p.id);
          map.set(p.id, {
            ...existing,
            ...p,
            image: p.image || p.imageUrl || existing?.image || existing?.imageUrl,
            imageUrl: p.imageUrl || p.image || existing?.imageUrl || existing?.image,
            sell_price: Number(p.sell_price ?? p.price_retail ?? p.price ?? existing?.sell_price ?? 0),
            cost_price: Number(p.cost_price ?? p.costPrice ?? p.cost ?? existing?.cost_price ?? 0),
          });
        }
      });
      return Array.from(map.values());
    }

    const isFashionActive = effectiveDomainConfig.primaryBusinessModel === 'FASHION_BUTIK';
    if (isFashionActive) {
      const map = new Map<string, any>();
      FASHION_APPAREL_PRODUCTS.forEach((p) => map.set(p.id, p));
      (products || []).forEach((p: any) => {
        const idUpper = String(p?.id || '').toUpperCase();
        const catLower = String(p?.category || '').toLowerCase();
        if (
          idUpper.startsWith('FASHION-') ||
          p?.businessModel === 'fashion' ||
          ['gamis', 'hijab', 'kemeja', 'kulot', 'voal', 'silk', 'linen', 'butik', 'pakaian'].some(
            (kw) => catLower.includes(kw) || idUpper.includes(kw)
          )
        ) {
          map.set(p.id, p);
        }
      });
      return Array.from(map.values());
    }

    const isLaundryActive = effectiveDomainConfig.primaryBusinessModel === 'LAUNDRY';
    if (isLaundryActive) {
      return (products || []).filter((p: any) => {
        const idUpper = String(p?.id || '').toUpperCase();
        const catLower = String(p?.category || '').toLowerCase();
        return idUpper.startsWith('LND-') || catLower.includes('cucian') || catLower.includes('laundry');
      });
    }

    // Mode RETAIL_GENERAL: sembunyikan item material bangunan, bahan baku dapur, dan menu F&B jika bukan Hybrid
    if (!effectiveDomainConfig.isHybridMultiUnit) {
      return (products || []).filter((p: any) => {
        const idUpper = String(p?.id || '').toUpperCase();
        const itemTypeUpper = String(p?.item_type || '').toUpperCase();
        if (
          idUpper.startsWith('MAT-') ||
          idUpper.startsWith('FNB-') ||
          idUpper.startsWith('RM-FNB-') ||
          idUpper.startsWith('ING-') ||
          itemTypeUpper === 'MENU_FB' ||
          itemTypeUpper === 'RAW_MATERIAL' ||
          p?.businessModel === 'building' ||
          p?.businessModel === 'fnb'
        ) {
          return false;
        }
        return true;
      });
    }

    return products || [];
  }, [isBuildingBulk, isFnbCulinary, effectiveDomainConfig.isHybridMultiUnit, effectiveDomainConfig.primaryBusinessModel, products]);

  const [campaigns, setCampaigns] = useState<PromoCampaign[]>(() => loadPromoCampaigns());

  useEffect(() => {
    savePromoCampaigns(campaigns);
  }, [campaigns]);

  useEffect(() => {
    const syncFromStorage = () => {
      const latest = loadPromoCampaigns();
      setCampaigns((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(latest)) return prev;
        return latest;
      });
    };
    window.addEventListener('storage', syncFromStorage);
    return () => window.removeEventListener('storage', syncFromStorage);
  }, []);

  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedLabelPreview, setSelectedLabelPreview] = useState<PromoCampaign | null>(null);
  const [selectedPosterCampaign, setSelectedPosterCampaign] = useState<PromoCampaign | null>(null);
  const [fefoDraftMechanic, setFefoDraftMechanic] = useState<PromoMechanic>('STANDARD');

  const createModalBackdropRef = useRef<HTMLDivElement | null>(null);
  const labelModalBackdropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isCreateModalOpen) {
      scrollWorkspaceToTop(createModalBackdropRef.current);
    }
  }, [isCreateModalOpen]);

  useEffect(() => {
    if (selectedLabelPreview) {
      scrollWorkspaceToTop(labelModalBackdropRef.current);
    }
  }, [selectedLabelPreview]);

  useEffect(() => {
    if (selectedPosterCampaign) {
      scrollWorkspaceToTop();
    }
  }, [selectedPosterCampaign]);

  const domainCampaigns = useMemo(() => {
    let list = filterPromoCampaignsByDomain(campaigns, effectiveDomainConfig);
    if (effectiveDomainConfig.primaryBusinessModel === 'FASHION_BUTIK') {
      list = list.filter((c) => {
        const text = `${c.code || ''} ${c.name || ''} ${c.targetValue || ''} ${c.supplierName || ''}`.toLowerCase();
        if (
          text.includes('indomie') ||
          text.includes('bimoli') ||
          text.includes('minyak goreng') ||
          text.includes('beras') ||
          text.includes('gula') ||
          text.includes('kao') ||
          text.includes('attack') ||
          text.includes('dancow') ||
          text.includes('nestle') ||
          text.includes('rinso') ||
          text.includes('sunlight') ||
          text.includes('laundry') ||
          text.includes('semen') ||
          text.includes('besi')
        ) {
          return false;
        }
        return true;
      });
    }
    return list;
  }, [campaigns, effectiveDomainConfig]);

  const handleOpenStudioShortcut = () => {
    const preferred = domainCampaigns.find(c => c.status === 'AKTIF') || domainCampaigns[0] || null;
    if (!preferred) {
      if (showToast) showToast('Belum ada kampanye promo. Buat kampanye terlebih dahulu untuk membuka Studio Poster.', 'warning');
      return;
    }
    setSelectedPosterCampaign(preferred);
    scrollWorkspaceToTop();
  };

  const todayIso = new Date().toISOString().split('T')[0];
  const nextMonthIso = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  // Form State
  const [formSource, setFormSource] = useState<PromoSourceType>('SEASONAL');
  const [formMechanic, setFormMechanic] = useState<PromoMechanic>('STANDARD');
  const [formPromoTag, setFormPromoTag] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formStartDate, setFormStartDate] = useState<string>(todayIso);
  const [formEndDate, setFormEndDate] = useState<string>(nextMonthIso);
  const [formTargetType, setFormTargetType] = useState<TargetType>('SKU');
  const [formTargetValue, setFormTargetValue] = useState<string>(domainProducts[0]?.id || '');
  const [formDiscountType, setFormDiscountType] = useState<DiscountType>('PERCENT');
  const [formDiscountValue, setFormDiscountValue] = useState<number>(10);
  const [formSupplierName, setFormSupplierName] = useState<string>('');
  const [formRebateValue, setFormRebateValue] = useState<number>(5000000);
  const [formSelectedSkuId, setFormSelectedSkuId] = useState<string>(domainProducts[0]?.id || '');
  const [formBundleSkus, setFormBundleSkus] = useState<Array<{ skuId: string; skuName: string; qty: number; unitCost: number }>>([]);

  // Sinkronisasi otomatis saat berpindah domain usaha (BUILDING_BULK / FNB_CULINARY / RETAIL_GENERAL)
  useEffect(() => {
    if (isBuildingBulk) {
      setCampaigns((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const missing = DEFAULT_BUILDING_PROMO_CAMPAIGNS.filter((d) => !existingIds.has(d.id));
        return missing.length > 0 ? [...prev, ...missing] : prev;
      });
      if (activeFilter === 'FEFO_EXP' || activeFilter === 'BUY_X_GET_Y') {
        setActiveFilter('ALL');
      }
      if (formSource === 'FEFO_EXP') {
        setFormSource('SEASONAL');
      }
    } else if (isFnbCulinary) {
      setCampaigns((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const missing = DEFAULT_FNB_PROMO_CAMPAIGNS.filter((d) => !existingIds.has(d.id));
        return missing.length > 0 ? [...prev, ...missing] : prev;
      });
      if (activeFilter === 'VOLUME_BORONGAN' || activeFilter === 'FEFO_EXP') {
        setActiveFilter('ALL');
      }
      if (formSource === 'FEFO_EXP') {
        setFormSource('SEASONAL');
      }
    } else if (activeFilter === 'VOLUME_BORONGAN') {
      setActiveFilter('ALL');
    }

    if (domainProducts.length > 0) {
      const firstId = domainProducts[0].id;
      if (formTargetType === 'SKU' && !domainProducts.some((p: any) => p.id === formTargetValue)) {
        setFormTargetValue(firstId);
      }
      if (!domainProducts.some((p: any) => p.id === formSelectedSkuId)) {
        setFormSelectedSkuId(firstId);
      }
    }
  }, [isBuildingBulk, isFnbCulinary, domainProducts, activeFilter, formSource, formTargetType, formTargetValue, formSelectedSkuId]);

  // 3 Aturan Promo State
  const [formPwpMinCartSubtotal, setFormPwpMinCartSubtotal] = useState<number>(isFnbCulinary ? 65000 : 100000);
  const [formPwpSpecialPrice, setFormPwpSpecialPrice] = useState<number>(isFnbCulinary ? 15000 : 20000);
  const [formBuyQty, setFormBuyQty] = useState<number>(2);
  const [formGetFreeQty, setFormGetFreeQty] = useState<number>(1);
  const [formMaxQtyPerReceipt, setFormMaxQtyPerReceipt] = useState<string>('2');

  // Kalkulator Diskon & Bundling Otomatis (Live Preview di Modal Kampanye)
  const livePromoCalculator = useMemo(() => {
    if (formSource === 'STORE_BND') {
      const items = formBundleSkus.map((b) => {
        const found = domainProducts.find((p: any) => p.id === b.skuId);
        const normalPrice = Number(found?.sell_price ?? found?.price_retail ?? found?.price ?? 25000);
        const hppPrice = Number(found?.cost_price ?? found?.costPrice ?? b.unitCost ?? Math.round(normalPrice * 0.45));
        return {
          ...b,
          normalPrice,
          hppPrice,
          image: found?.image || found?.imageUrl || '',
          category: found?.category || '',
        };
      });
      const totalNormal = items.reduce((sum, i) => sum + i.normalPrice * i.qty, 0);
      const totalHpp = items.reduce((sum, i) => sum + i.hppPrice * i.qty, 0);
      const cutNominal =
        formDiscountType === 'PERCENT'
          ? Math.round((totalNormal * Math.min(100, Math.max(0, formDiscountValue))) / 100)
          : Math.max(0, formDiscountValue);
      const finalBundlePrice = Math.max(0, totalNormal - cutNominal);
      const marginNominal = finalBundlePrice - totalHpp;
      const marginPct = finalBundlePrice > 0 ? (marginNominal / finalBundlePrice) * 100 : 0;
      return {
        mode: 'BUNDLE' as const,
        title: items.length > 0 ? items.map((i) => `${i.qty}x ${i.skuName}`).join(' + ') : 'Pilih minimal 1 menu/item paket di atas',
        image: items[0]?.image || '',
        category: items[0]?.category || 'Paket Bundling',
        normalPrice: totalNormal,
        hppPrice: totalHpp,
        finalPrice: finalBundlePrice,
        savings: cutNominal,
        marginNominal,
        marginPct,
      };
    }

    const targetProd =
      formTargetType === 'SKU'
        ? domainProducts.find((p: any) => p.id === formTargetValue) || domainProducts[0]
        : domainProducts.find((p: any) =>
            String(p.category || '').toLowerCase().includes(String(formTargetValue || '').toLowerCase())
          ) || domainProducts[0];

    const normalPrice = Number(targetProd?.sell_price ?? targetProd?.price_retail ?? targetProd?.price ?? 25000);
    const hppPrice = Number(targetProd?.cost_price ?? targetProd?.costPrice ?? Math.round(normalPrice * 0.45));

    if (formMechanic === 'PWP_TEBUS_MURAH') {
      const finalPrice = Math.max(0, Number(formPwpSpecialPrice) || 0);
      const savings = Math.max(0, normalPrice - finalPrice);
      const marginNominal = finalPrice - hppPrice;
      const marginPct = finalPrice > 0 ? (marginNominal / finalPrice) * 100 : 0;
      return {
        mode: 'PWP' as const,
        title: targetProd?.name || formTargetValue,
        image: targetProd?.image || targetProd?.imageUrl || '',
        category: targetProd?.category || 'Item Promo',
        normalPrice,
        hppPrice,
        finalPrice,
        savings,
        marginNominal,
        marginPct,
      };
    }

    if (formMechanic === 'BUY_X_GET_Y') {
      const bQty = Math.max(1, Number(formBuyQty) || 2);
      const gQty = Math.max(1, Number(formGetFreeQty) || 1);
      const totalUnits = bQty + gQty;
      const totalPaid = normalPrice * bQty;
      const totalHpp = hppPrice * totalUnits;
      const savings = normalPrice * gQty;
      const marginNominal = totalPaid - totalHpp;
      const marginPct = totalPaid > 0 ? (marginNominal / totalPaid) * 100 : 0;
      return {
        mode: 'BXGY' as const,
        title: `${targetProd?.name || formTargetValue} (Beli ${bQty} Gratis ${gQty})`,
        image: targetProd?.image || targetProd?.imageUrl || '',
        category: targetProd?.category || 'Item Promo',
        normalPrice: normalPrice * totalUnits,
        hppPrice: totalHpp,
        finalPrice: totalPaid,
        savings,
        marginNominal,
        marginPct,
      };
    }

    const savings =
      formDiscountType === 'PERCENT'
        ? Math.round((normalPrice * Math.min(100, Math.max(0, formDiscountValue))) / 100)
        : Math.min(normalPrice, Math.max(0, formDiscountValue));
    const finalPrice = Math.max(0, normalPrice - savings);
    const marginNominal = finalPrice - hppPrice;
    const marginPct = finalPrice > 0 ? (marginNominal / finalPrice) * 100 : 0;

    return {
      mode: 'STANDARD' as const,
      title: formTargetType === 'SKU' ? targetProd?.name || formTargetValue : `Kategori: ${formTargetValue} (Contoh: ${targetProd?.name || '-'})`,
      image: targetProd?.image || targetProd?.imageUrl || '',
      category: targetProd?.category || formTargetValue,
      normalPrice,
      hppPrice,
      finalPrice,
      savings,
      marginNominal,
      marginPct,
    };
  }, [
    formSource,
    formBundleSkus,
    domainProducts,
    formDiscountType,
    formDiscountValue,
    formTargetType,
    formTargetValue,
    formMechanic,
    formPwpSpecialPrice,
    formBuyQty,
    formGetFreeQty,
  ]);

  // Auto-Draft FEFO Feature (Mendukung STANDARD, BUY_X_GET_Y, PWP_TEBUS_MURAH — maxQtyPerReceipt otomatis unlimited)
  const handleAutoDraftFefo = () => {
    const candidateProducts = domainProducts.filter((p: any) => (p.stock || 0) > 0).slice(0, 3);
    if (candidateProducts.length === 0) {
      if (showToast) showToast('Tidak ada produk tersedia untuk auto-draft FEFO.', 'warning');
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const newDrafts: PromoCampaign[] = candidateProducts.map((p: any, idx: number) => {
      const barcode = `200-EXP-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
      const sellPrice = Number(p.price_retail ?? p.sell_price ?? p.price) || 20000;
      const costPrice = Number(p.costPrice ?? p.cost_price) || Math.round(sellPrice * 0.7);

      if (fefoDraftMechanic === 'BUY_X_GET_Y') {
        return {
          id: `fefo-draft-${Date.now()}-${idx}`,
          code: barcode,
          name: `Auto-Draft FEFO Beli 2 Gratis 1: ${p.name}`,
          sourceType: 'FEFO_EXP',
          mechanic: 'BUY_X_GET_Y',
          startDate: todayIso,
          endDate: nextMonthIso,
          targetType: 'SKU',
          targetValue: `${p.id} (${p.name})`,
          discountType: 'PERCENT',
          discountValue: 0,
          buyQty: 2,
          getFreeQty: 1,
          maxQtyPerReceipt: null, // Otomatis unlimited untuk FEFO_EXP
          domainFamily: activeFamily,
          status: 'DRAFT',
          generatedBarcode: barcode,
          componentSkus: [{ skuId: p.id, skuName: p.name, qty: 1, unitCost: costPrice }],
          createdAt: todayIso,
        };
      }

      if (fefoDraftMechanic === 'PWP_TEBUS_MURAH') {
        const specialPrice = Math.max(1000, Math.round(sellPrice * 0.6));
        return {
          id: `fefo-draft-${Date.now()}-${idx}`,
          code: barcode,
          name: `Auto-Draft FEFO Tebus Murah: ${p.name}`,
          sourceType: 'FEFO_EXP',
          mechanic: 'PWP_TEBUS_MURAH',
          startDate: todayIso,
          endDate: nextMonthIso,
          targetType: 'SKU',
          targetValue: `${p.id} (${p.name})`,
          discountType: 'NOMINAL',
          discountValue: Math.max(0, sellPrice - specialPrice),
          pwpMinCartSubtotal: 50000,
          pwpSpecialPrice: specialPrice,
          maxQtyPerReceipt: null, // Otomatis unlimited untuk FEFO_EXP
          domainFamily: activeFamily,
          status: 'DRAFT',
          generatedBarcode: barcode,
          componentSkus: [{ skuId: p.id, skuName: p.name, qty: 1, unitCost: costPrice }],
          createdAt: todayIso,
        };
      }

      return {
        id: `fefo-draft-${Date.now()}-${idx}`,
        code: barcode,
        name: `Auto-Draft Clearance FEFO (H-7 s.d. H-30): ${p.name}`,
        sourceType: 'FEFO_EXP',
        mechanic: 'STANDARD',
        startDate: todayIso,
        endDate: nextMonthIso,
        targetType: 'SKU',
        targetValue: `${p.id} (${p.name})`,
        discountType: 'PERCENT',
        discountValue: 20,
        maxQtyPerReceipt: null, // Otomatis unlimited untuk FEFO_EXP
        domainFamily: activeFamily,
        status: 'DRAFT',
        generatedBarcode: barcode,
        componentSkus: [{ skuId: p.id, skuName: p.name, qty: 1, unitCost: costPrice }],
        createdAt: todayIso,
      };
    });

    setCampaigns(prev => [...newDrafts, ...prev]);
    if (showToast) {
      showToast(
        `Berhasil membuat ${newDrafts.length} draf promo FEFO (${fefoDraftMechanic}) tanpa batas kuota/struk. Menunggu persetujuan Manager.`
      );
    }
    recordAudit({
      traceId: `EXEC-FEFO-AUTODRAFT-${Date.now()}`,
      userId: 'executive-cockpit',
      userName: 'Manager Eksekutif',
      userRole: 'Manager',
      module: 'EXECUTIVE',
      action: 'CONFIG_CHANGE',
      severity: 'INFO',
      payloadAfter: { count: newDrafts.length, mechanic: fefoDraftMechanic, maxQtyPerReceipt: null }
    });
  };

  // Quick F&B Culinary Presets (Otomatis Memuat Menu dari 18 Menu F&B)
  const handleApplyFnbPreset = (presetType: 'LUNCH_COMBO' | 'PASTRY_2G1' | 'TEBUS_MATCHA') => {
    if (presetType === 'LUNCH_COMBO') {
      const nasgor = domainProducts.find((p: any) => p.id === 'FNB-MAK-NASGOR') || domainProducts[0];
      const kopi = domainProducts.find((p: any) => p.id === 'FNB-KOP-AREN') || domainProducts[1] || domainProducts[0];
      setFormSource('STORE_BND');
      setFormMechanic('STANDARD');
      setFormPromoTag('PAKET_HEMAT');
      setFormName(`Paket Makan Siang Hemat ${activeBusinessIdentity} (Nasi Goreng + Kopi Aren)`);
      setFormDiscountType('NOMINAL');
      setFormDiscountValue(11000);
      setFormMaxQtyPerReceipt('4');
      setFormBundleSkus(
        [nasgor, kopi]
          .filter(Boolean)
          .map((m: any) => ({
            skuId: m.id,
            skuName: m.name,
            qty: 1,
            unitCost: Number(m.cost_price ?? m.costPrice ?? 9000),
          }))
      );
      setIsCreateModalOpen(true);
      if (showToast) showToast('Template F&B [Paket Makan Siang & Kopi] dimuat ke kalkulator bundling.');
      return;
    }

    if (presetType === 'PASTRY_2G1') {
      const croissant = domainProducts.find((p: any) => p.id === 'FNB-PAS-CROIS') || domainProducts[0];
      setFormSource('STORE_DISC');
      setFormMechanic('BUY_X_GET_Y');
      setFormPromoTag('BELI_X_GRATIS_Y');
      setFormName(`Beli 2 Gratis 1 ${croissant?.name || 'Butter Croissant Artisan'}`);
      setFormTargetType('SKU');
      setFormTargetValue(croissant?.id || 'FNB-PAS-CROIS');
      setFormBuyQty(2);
      setFormGetFreeQty(1);
      setFormMaxQtyPerReceipt('2');
      setIsCreateModalOpen(true);
      if (showToast) showToast('Template F&B [Beli 2 Gratis 1 Pastry/Kopi] dimuat ke form kampanye.');
      return;
    }

    const matcha = domainProducts.find((p: any) => p.id === 'FNB-NON-MATCHA') || domainProducts[0];
    setFormSource('STORE_DISC');
    setFormMechanic('PWP_TEBUS_MURAH');
    setFormPromoTag('TEBUS_MURAH');
    setFormName(`Tebus Murah ${matcha?.name || 'Matcha Latte Uji Kyoto'} Rp 15.000`);
    setFormTargetType('SKU');
    setFormTargetValue(matcha?.id || 'FNB-NON-MATCHA');
    setFormPwpMinCartSubtotal(65000);
    setFormPwpSpecialPrice(15000);
    setFormMaxQtyPerReceipt('2');
    setIsCreateModalOpen(true);
    if (showToast) showToast('Template F&B [Tebus Murah Minuman Segar] dimuat ke form kampanye.');
  };

  // Quick Seasonal Templates Presets
  const handleApplySeasonalPreset = (presetType: 'RAMADHAN' | 'NATARU' | 'PAYDAY') => {
    let presetName = '';
    let presetCat = '';
    let presetDisc = 15;

    if (presetType === 'RAMADHAN') {
      presetName = 'Paket Ramadhan & Lebaran (Sirup & Biskuit)';
      presetCat = 'PC.200 (Sirup) & PC.73 (Biskuit Lebaran)';
      presetDisc = 15;
    } else if (presetType === 'NATARU') {
      presetName = 'Paket Natal & Tahun Baru (Festive Hampers)';
      presetCat = 'PC.45 (Cokelat & Kado Eksklusif)';
      presetDisc = 20;
    } else {
      presetName = 'Promo Gajian / Payday Super Sale Sembako';
      presetCat = 'PC.5 (Minyak Goreng) & PC.342 (Beras Premium)';
      presetDisc = 10;
    }

    setFormSource('SEASONAL');
    setFormMechanic('STANDARD');
    setFormPromoTag('');
    setFormName(presetName);
    setFormTargetType('CATEGORY');
    setFormTargetValue(presetCat);
    setFormDiscountType('PERCENT');
    setFormDiscountValue(presetDisc);
    setFormMaxQtyPerReceipt('3');
    setIsCreateModalOpen(true);
    if (showToast) showToast(`Template cepat [${presetName}] dimuat ke form kampanye.`);
  };

  // Quick Building Material Presets
  const handleApplyBuildingPreset = (presetType: 'RENOVASI' | 'BORONGAN' | 'REBATE_SEMEN_CAT') => {
    if (presetType === 'RENOVASI') {
      setFormSource('SEASONAL');
      setFormMechanic('STANDARD');
      setFormPromoTag('');
      setFormName('Paket Renovasi & Bangun Rumah (Cat, Pipa & Semen)');
      setFormTargetType('CATEGORY');
      setFormTargetValue('Semen, Cat/Thinner & Perpipaan');
      setFormDiscountType('PERCENT');
      setFormDiscountValue(12);
      setFormMaxQtyPerReceipt('');
      setIsCreateModalOpen(true);
      if (showToast) showToast('Template cepat [Paket Renovasi & Bangun Rumah] dimuat ke form kampanye.');
      return;
    }

    if (presetType === 'BORONGAN') {
      const besiSku = domainProducts.find((p: any) => String(p.id).includes('BSI'))?.id || domainProducts[0]?.id || 'MAT-BSI-10MM';
      setFormSource('STORE_DISC');
      setFormMechanic('STANDARD');
      setFormPromoTag('VOLUME_BORONGAN');
      setFormName('Diskon Borongan Kontraktor (Besi Beton, Baja & Curah)');
      setFormTargetType('SKU');
      setFormTargetValue(besiSku);
      setFormDiscountType('PERCENT');
      setFormDiscountValue(8);
      setFormMaxQtyPerReceipt('');
      setIsCreateModalOpen(true);
      if (showToast) showToast('Template cepat [Diskon Borongan Kontraktor] dimuat ke form kampanye.');
      return;
    }

    const semenSku = domainProducts.find((p: any) => String(p.id).includes('SMN'))?.id || domainProducts[0]?.id || 'MAT-SMN-50KG';
    setFormSource('SUPPLIER_TPR');
    setFormMechanic('STANDARD');
    setFormPromoTag('');
    setFormName('Rebate Pabrik Semen Tonasa / Tiga Roda & Cat Dulux');
    setFormTargetType('SKU');
    setFormTargetValue(semenSku);
    setFormDiscountType('NOMINAL');
    setFormDiscountValue(5000);
    setFormSupplierName('PT Semen Tonasa / Indocement / ICI Paints');
    setFormRebateValue(15000000);
    setFormMaxQtyPerReceipt('');
    setIsCreateModalOpen(true);
    if (showToast) showToast('Template cepat [Rebate Pabrik Semen & Cat] dimuat ke form kampanye.');
  };

  const handleAddBundleComponent = () => {
    const prod = domainProducts.find((p: any) => p.id === formSelectedSkuId);
    if (!prod) return;
    if (formBundleSkus.some(s => s.skuId === prod.id)) {
      if (showToast) showToast('SKU sudah ada dalam paket bundling.');
      return;
    }
    setFormBundleSkus(prev => [
      ...prev,
      { skuId: prod.id, skuName: prod.name, qty: 1, unitCost: prod.costPrice || prod.cost_price || (prod.price || prod.sell_price || 0) * 0.7 }
    ]);
  };

  const handleRemoveBundleComponent = (skuId: string) => {
    setFormBundleSkus(prev => prev.filter(s => s.skuId !== skuId));
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      if (showToast) showToast('Nama kampanye promo wajib diisi.', 'warning');
      return;
    }

    let code = '';
    let generatedBarcode: string | undefined = undefined;
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);

    if (formSource === 'STORE_BND') {
      code = `200-BND-${dateStr}-${randSuffix}`;
      generatedBarcode = code;
    } else if (formSource === 'FEFO_EXP') {
      code = `200-EXP-${dateStr}-${randSuffix}`;
      generatedBarcode = code;
    } else if (formMechanic === 'PWP_TEBUS_MURAH') {
      code = `${isFnbCulinary ? 'PWP-FNB' : 'PWP-TEBUS'}-${randSuffix}`;
    } else if (formMechanic === 'BUY_X_GET_Y') {
      code = `${isFnbCulinary ? 'BXGY-FNB' : 'BXGY'}-${Math.max(1, formBuyQty)}G${Math.max(1, formGetFreeQty)}-${randSuffix}`;
    } else if (formSource === 'SUPPLIER_TPR') {
      code = `TPR-${formSupplierName ? formSupplierName.substring(0, 6).toUpperCase() : 'VEND'}-${randSuffix}`;
    } else if (formSource === 'STORE_DISC') {
      code = `${isFnbCulinary ? 'PROMO-FNB' : 'VOL-BOR'}-${randSuffix}`;
    } else {
      code = `${isFnbCulinary ? 'PROMO-FNB' : 'PROMO-SEA'}-${randSuffix}`;
    }

    const selectedTargetProd = domainProducts.find((p: any) => p.id === formTargetValue || p.id === formSelectedSkuId);
    const resolvedComponents =
      formSource === 'STORE_BND'
        ? formBundleSkus
        : formSource === 'FEFO_EXP'
        ? formBundleSkus.length > 0
          ? formBundleSkus
          : selectedTargetProd
          ? [{ skuId: selectedTargetProd.id, skuName: selectedTargetProd.name, qty: 1, unitCost: selectedTargetProd.costPrice || selectedTargetProd.cost_price || 0 }]
          : undefined
        : (isBuildingBulk || isFnbCulinary) && selectedTargetProd
        ? [{ skuId: selectedTargetProd.id, skuName: selectedTargetProd.name, qty: 1, unitCost: selectedTargetProd.costPrice || selectedTargetProd.cost_price || 0 }]
        : undefined;

    const normalizedCap = normalizeMaxQtyPerReceipt(
      formSource,
      formMaxQtyPerReceipt.trim() === '' ? null : Number(formMaxQtyPerReceipt)
    );

    const resolvedMechanic: PromoMechanic =
      formSource === 'STORE_BND' ? 'BUNDLE' : formMechanic;

    const newCampaign: PromoCampaign = {
      id: `${isBuildingBulk ? 'promo-mat' : isFnbCulinary ? 'promo-fnb' : 'promo'}-${Date.now()}`,
      code,
      name: formName,
      sourceType: formSource,
      mechanic: resolvedMechanic,
      startDate: formStartDate,
      endDate: formEndDate,
      targetType: formSource === 'STORE_BND' ? 'CATEGORY' : formTargetType,
      targetValue:
        formSource === 'STORE_BND'
          ? isFnbCulinary
            ? 'PC.200 (Paket Bundling Menu F&B)'
            : 'PC.200 (Barang Paket / Bundling)'
          : formTargetType === 'SKU'
          ? selectedTargetProd
            ? `${selectedTargetProd.id} (${selectedTargetProd.name})`
            : formTargetValue
          : formTargetValue,
      discountType: formMechanic === 'PWP_TEBUS_MURAH' ? 'NOMINAL' : formDiscountType,
      discountValue:
        formMechanic === 'PWP_TEBUS_MURAH' && selectedTargetProd
          ? Math.max(0, (selectedTargetProd.sell_price || selectedTargetProd.price_retail || 0) - formPwpSpecialPrice)
          : formMechanic === 'BUY_X_GET_Y'
          ? 100
          : formDiscountValue,
      status: 'AKTIF',
      supplierName: formSource === 'SUPPLIER_TPR' ? formSupplierName : undefined,
      rebateClaimValue: formSource === 'SUPPLIER_TPR' ? formRebateValue : undefined,
      componentSkus: resolvedComponents,
      generatedBarcode,
      pwpMinCartSubtotal: formMechanic === 'PWP_TEBUS_MURAH' ? Math.max(0, Number(formPwpMinCartSubtotal) || 0) : undefined,
      pwpSpecialPrice: formMechanic === 'PWP_TEBUS_MURAH' ? Math.max(0, Number(formPwpSpecialPrice) || 0) : undefined,
      buyQty: formMechanic === 'BUY_X_GET_Y' ? Math.max(1, Math.floor(Number(formBuyQty) || 2)) : undefined,
      getFreeQty: formMechanic === 'BUY_X_GET_Y' ? Math.max(1, Math.floor(Number(formGetFreeQty) || 1)) : undefined,
      maxQtyPerReceipt: normalizedCap,
      domainFamily: activeFamily,
      promoTag:
        formPromoTag ||
        (formSource === 'STORE_BND'
          ? 'PAKET_HEMAT'
          : formSource === 'STORE_DISC' && isBuildingBulk
          ? 'VOLUME_BORONGAN'
          : undefined),
      createdAt: new Date().toISOString().split('T')[0]
    };

    setCampaigns(prev => [newCampaign, ...prev]);
    recordAudit({
      traceId: `EXEC-PROMO-CREATE-${Date.now()}`,
      userId: 'executive-cockpit',
      userName: 'Manager Eksekutif',
      userRole: 'Manager',
      module: 'EXECUTIVE',
      action: 'CONFIG_CHANGE',
      severity: 'INFO',
      payloadAfter: newCampaign
    });

    if (showToast) showToast(`Berhasil menerbitkan kampanye promo [${code}] — langsung aktif di Kasir POS!`);
    setIsCreateModalOpen(false);
    setFormName('');
    setFormPromoTag('');
    setFormBundleSkus([]);
  };

  const handleToggleStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus: PromoStatus = c.status === 'AKTIF' ? 'BERAKHIR' : 'AKTIF';
        if (showToast) showToast(`Status promo ${c.code} diubah menjadi ${nextStatus}.`);
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const handleChangeDraftMechanic = (id: string, nextMechanic: PromoMechanic) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c;
      const targetProd = domainProducts.find((p: any) => (c.targetValue || '').includes(p.id) || c.componentSkus?.[0]?.skuId === p.id);
      const sellPrice = Number(targetProd?.price_retail ?? targetProd?.sell_price ?? 20000);
      return {
        ...c,
        mechanic: nextMechanic,
        buyQty: nextMechanic === 'BUY_X_GET_Y' ? (c.buyQty || 2) : undefined,
        getFreeQty: nextMechanic === 'BUY_X_GET_Y' ? (c.getFreeQty || 1) : undefined,
        pwpMinCartSubtotal: nextMechanic === 'PWP_TEBUS_MURAH' ? (c.pwpMinCartSubtotal || 50000) : undefined,
        pwpSpecialPrice: nextMechanic === 'PWP_TEBUS_MURAH' ? (c.pwpSpecialPrice || Math.max(1000, Math.round(sellPrice * 0.6))) : undefined,
        maxQtyPerReceipt: normalizeMaxQtyPerReceipt(c.sourceType, c.maxQtyPerReceipt),
      };
    }));
    if (showToast) showToast(`Mekanisme draf promo diperbarui ke ${nextMechanic}.`);
  };

  const handleDeleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    if (showToast) showToast('Kampanye promo berhasil dihapus dari sistem.');
  };

  const filteredCampaigns =
    activeFilter === 'ALL'
      ? domainCampaigns
      : activeFilter === 'VOLUME_BORONGAN'
      ? domainCampaigns.filter(isVolumeBoronganCampaign)
      : activeFilter === 'PWP_TEBUS_MURAH' || activeFilter === 'BUY_X_GET_Y'
      ? domainCampaigns.filter(c => (c.mechanic || 'STANDARD') === activeFilter)
      : domainCampaigns.filter(c => c.sourceType === activeFilter);

  const filterTabs = isBuildingBulk
    ? [
        { id: 'ALL', label: 'Semua Promo' },
        { id: 'VOLUME_BORONGAN', label: 'Diskon Volume / Borongan' },
        { id: 'SUPPLIER_TPR', label: 'Rebate Supplier Material' },
        { id: 'SEASONAL', label: 'Paket Renovasi & Event' },
        { id: 'STORE_BND', label: 'Bundling Paket (200-BND)' },
        { id: 'PWP_TEBUS_MURAH', label: 'Tebus Murah Perkakas' },
      ]
    : isFnbCulinary
    ? [
        { id: 'ALL', label: 'Semua Promo Kuliner' },
        { id: 'STORE_BND', label: 'Paket Bundling Menu' },
        { id: 'BUY_X_GET_Y', label: 'Beli X Gratis Y' },
        { id: 'PWP_TEBUS_MURAH', label: 'Tebus Murah Minuman' },
        { id: 'SEASONAL', label: 'Promo Jam Makan / Event' },
        { id: 'SUPPLIER_TPR', label: 'Subsidi Roastery / Prinsipal' },
      ]
    : [
        { id: 'ALL', label: 'Semua Promo' },
        { id: 'SEASONAL', label: 'Seasonal Event' },
        { id: 'FEFO_EXP', label: 'Clearance FEFO (Unlimited)' },
        { id: 'SUPPLIER_TPR', label: 'Supplier TPR' },
        { id: 'STORE_BND', label: 'Bundling Paket (200-BND)' },
        { id: 'PWP_TEBUS_MURAH', label: 'PWP Tebus Murah' },
        { id: 'BUY_X_GET_Y', label: 'Beli X Gratis Y' },
      ];

  const fnbCategories = ['Kopi', 'Non-Kopi / Segar', 'Makanan Utama', 'Pastry & Bakery', 'Paket Hemat'];

  return (
    <div className={`p-5 rounded-2xl border transition-all space-y-6 ${
      isDark ? 'bg-slate-900/40 border-cyan-500/35 backdrop-blur-xl shadow-[0_0_16px_rgba(6,182,212,0.1)]' : 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.16)]'
    }`}>
      {/* Header Modul */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
        isDark ? 'border-white/[0.06]' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className={`text-base leading-6 font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Sparkles className="w-5 h-5 text-cyan-400" />
              {isBuildingBulk
                ? 'Pusat Kampanye Promo & Harga Proyek Depo Material'
                : isFnbCulinary
                ? `Pusat Promo Kuliner, Broadcast WA & Studio Poster — ${activeBusinessIdentity}`
                : 'Pusat Kampanye Promo & Harga Musiman'}
            </h2>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
              isFnbCulinary
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : isBuildingBulk
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
            }`}>
              {domainProducts.length} {isFnbCulinary ? 'Menu F&B Aktif' : 'SKU Katalog Aktif'}
            </span>
          </div>
          <p className={`text-xs mt-0.5 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isBuildingBulk
              ? 'Mendukung Diskon Volume/Borongan Kontraktor, Rebate Pabrik Material (Semen & Cat), Bundling Paket Proyek, serta Tebus Murah Perkakas.'
              : isFnbCulinary
              ? `Terintegrasi otomatis dengan ${domainProducts.length} Katalog Menu F&B (${activeBusinessIdentity}), Kalkulator Diskon/Bundling, Broadcast WhatsApp Pelanggan, Generator Poster Sosmed, & Kasir POS F&B.`
              : 'Mendukung 4 sumber promo, PWP Tebus Murah, Beli X Gratis Y, dan kuota maks qty/struk (otomatis Unlimited untuk FEFO_EXP).'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isBuildingBulk && !isFnbCulinary && (
            <>
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs ${
                isDark ? 'bg-slate-950/70 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                <span className="text-[11px] font-mono">Mode FEFO:</span>
                <select
                  value={fefoDraftMechanic}
                  onChange={(e) => setFefoDraftMechanic(e.target.value as PromoMechanic)}
                  className={`text-xs font-medium bg-transparent outline-none cursor-pointer ${
                    isDark ? 'text-amber-300' : 'text-amber-900'
                  }`}
                >
                  <option value="STANDARD" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Diskon Bertingkat</option>
                  <option value="BUY_X_GET_Y" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Beli X Gratis Y</option>
                  <option value="PWP_TEBUS_MURAH" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>PWP Tebus Murah</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAutoDraftFefo}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25' : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                }`}
                title="Otomatis Buat Draf Promo FEFO dengan kuota struk Unlimited"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-Draft Promo FEFO</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleOpenStudioShortcut}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border whitespace-nowrap ${
              isDark
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
            }`}
            title="Buka Studio Poster Cetak & Broadcast WhatsApp Member"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Studio Poster Sosmed &amp; Broadcast WA</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCreateModalOpen(true);
              scrollWorkspaceToTop();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer active:scale-[0.99] whitespace-nowrap ${
              isDark
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Buat Kampanye Baru</span>
          </button>
        </div>
      </div>

      {/* Template Cepat 1-Klik Presets (Adaptif Domain) */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isDark
          ? isBuildingBulk
            ? 'bg-slate-900/60 border-amber-500/30'
            : isFnbCulinary
            ? 'bg-slate-900/60 border-emerald-500/30'
            : 'bg-slate-900/60 border-cyan-500/30'
          : isBuildingBulk
          ? 'bg-amber-50/60 border-amber-200'
          : isFnbCulinary
          ? 'bg-emerald-50/60 border-emerald-200'
          : 'bg-cyan-50/60 border-cyan-200'
      }`}>
        <div>
          <span className={`text-xs font-semibold block ${
            isDark
              ? isBuildingBulk
                ? 'text-amber-300'
                : isFnbCulinary
                ? 'text-emerald-300'
                : 'text-cyan-300'
              : isBuildingBulk
              ? 'text-amber-900'
              : isFnbCulinary
              ? 'text-emerald-900'
              : 'text-cyan-900'
          }`}>
            {isBuildingBulk
              ? 'Template Cepat Promo Depo Material (1-Klik Presets)'
              : isFnbCulinary
              ? `Template Cepat Promo Kuliner & Kafe — ${activeBusinessIdentity} (1-Klik Presets)`
              : 'Template Cepat Event Musiman (1-Klik Presets)'}
          </span>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {isBuildingBulk
              ? 'Pilih template promo bangunan di bawah untuk langsung menyusun paket renovasi, diskon borongan kontraktor, atau rebate pabrik.'
              : isFnbCulinary
              ? 'Pilih template promo kuliner di bawah untuk langsung memuat menu F&B beserta foto & kalkulasi HPP ke form kampanye.'
              : 'Pilih template event di bawah untuk langsung mengelompokkan kategori relevan ke form persetujuan Manager.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isBuildingBulk ? (
            <>
              <button
                type="button"
                onClick={() => handleApplyBuildingPreset('RENOVASI')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isDark ? 'bg-white/[0.04] border-white/[0.08] text-amber-300 hover:bg-amber-500/20' : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-50'
                }`}
              >
                + Paket Renovasi &amp; Bangun Rumah
              </button>
              <button
                type="button"
                onClick={() => handleApplyBuildingPreset('BORONGAN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isDark ? 'bg-white/[0.04] border-white/[0.08] text-amber-300 hover:bg-amber-500/20' : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-50'
                }`}
              >
                + Diskon Borongan Kontraktor
              </button>
              <button
                type="button"
                onClick={() => handleApplyBuildingPreset('REBATE_SEMEN_CAT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isDark ? 'bg-white/[0.04] border-white/[0.08] text-amber-300 hover:bg-amber-500/20' : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-50'
                }`}
              >
                + Rebate Pabrik Semen &amp; Cat
              </button>
            </>
          ) : isFnbCulinary ? (
            <>
              <button
                type="button"
                onClick={() => handleApplyFnbPreset('LUNCH_COMBO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isDark ? 'bg-white/[0.04] border-white/[0.08] text-emerald-300 hover:bg-emerald-500/20' : 'bg-white border-emerald-300 text-emerald-900 hover:bg-emerald-50'
                }`}
              >
                + Paket Makan Siang &amp; Kopi
              </button>
              <button
                type="button"
                onClick={() => handleApplyFnbPreset('PASTRY_2G1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isDark ? 'bg-white/[0.04] border-white/[0.08] text-emerald-300 hover:bg-emerald-500/20' : 'bg-white border-emerald-300 text-emerald-900 hover:bg-emerald-50'
                }`}
              >
                + Beli 2 Gratis 1 Pastry &amp; Kopi
              </button>
              <button
                type="button"
                onClick={() => handleApplyFnbPreset('TEBUS_MATCHA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isDark ? 'bg-white/[0.04] border-white/[0.08] text-emerald-300 hover:bg-emerald-500/20' : 'bg-white border-emerald-300 text-emerald-900 hover:bg-emerald-50'
                }`}
              >
                + Tebus Murah Minuman Segar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleApplySeasonalPreset('RAMADHAN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isDark ? 'bg-white/[0.04] border-white/[0.08] text-cyan-300 hover:bg-cyan-500/20' : 'bg-white border-slate-300 text-cyan-800 hover:bg-cyan-50'
                }`}
              >
                + Paket Ramadhan / Lebaran
              </button>
              <button
                type="button"
                onClick={() => handleApplySeasonalPreset('NATARU')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isDark ? 'bg-white/[0.04] border-white/[0.08] text-cyan-300 hover:bg-cyan-500/20' : 'bg-white border-slate-300 text-cyan-800 hover:bg-cyan-50'
                }`}
              >
                + Paket Natal &amp; Tahun Baru
              </button>
              <button
                type="button"
                onClick={() => handleApplySeasonalPreset('PAYDAY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isDark ? 'bg-white/[0.04] border-white/[0.08] text-cyan-300 hover:bg-cyan-500/20' : 'bg-white border-slate-300 text-cyan-800 hover:bg-cyan-50'
                }`}
              >
                + Promo Gajian / Payday
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Tabs Sumber & Mekanisme */}
      <div className="flex flex-wrap items-center gap-2">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
              activeFilter === tab.id
                ? isDark
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-xs'
                  : 'bg-cyan-50 text-cyan-800 border-cyan-300 shadow-xs'
                : isDark
                ? 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabel Kampanye Promo */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className={`border-b font-mono text-[11px] ${isDark ? 'border-white/[0.08] text-slate-400' : 'border-slate-200 text-slate-600'}`}>
              <th className="py-3 px-3">Kode / Barcode</th>
              <th className="py-3 px-3">Nama Kampanye &amp; Aturan</th>
              <th className="py-3 px-3">Sumber / Mekanisme</th>
              <th className="py-3 px-3">Periode &amp; Batas Struk</th>
              <th className="py-3 px-3">Target &amp; Nilai Benefit</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Aksi &amp; Label</th>
            </tr>
          </thead>
          <tbody className={isDark ? 'divide-y divide-white/[0.04]' : 'divide-y divide-slate-100'}>
            {filteredCampaigns.map((camp, cIdx) => {
              const isAktif = camp.status === 'AKTIF';
              const isDraft = camp.status === 'DRAFT';
              const isStoreBndOrExp = camp.sourceType === 'STORE_BND' || camp.sourceType === 'FEFO_EXP';
              const mech = camp.mechanic || 'STANDARD';
              const isFefoUnlimited = camp.sourceType === 'FEFO_EXP';
              const capLabel = isFefoUnlimited
                ? 'Unlimited (Otomatis FEFO)'
                : camp.maxQtyPerReceipt && camp.maxQtyPerReceipt > 0
                ? `Maks. ${camp.maxQtyPerReceipt} ${mech === 'BUY_X_GET_Y' ? 'bonus' : 'unit'}/struk`
                : 'Unlimited';

              const matchedMenuThumb = domainProducts.find(
                (p: any) =>
                  (camp.targetValue || '').includes(p.id) ||
                  camp.componentSkus?.some((cs) => cs.skuId === p.id)
              );

              return (
                <tr key={camp.id || `camp-${cIdx}`} className={`transition-all ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                  <td className="py-3 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {camp.code}
                    {camp.generatedBarcode && (
                      <span className="block text-[10px] text-slate-400 font-normal">Barcode Paket Aktif</span>
                    )}
                  </td>
                  <td className={`py-3 px-3 font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    <div className="flex items-center gap-2.5">
                      {matchedMenuThumb?.image && (
                        <img
                          src={matchedMenuThumb.image}
                          alt={matchedMenuThumb.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                        />
                      )}
                      <div>
                        <div>{camp.name}</div>
                        {mech === 'PWP_TEBUS_MURAH' && (
                          <div className="text-[11px] font-mono text-amber-600 dark:text-amber-300 font-normal mt-0.5 tabular-nums">
                            Syarat Belanja &ge; Rp {(camp.pwpMinCartSubtotal || 0).toLocaleString('id-ID')} · Tebus Rp {(camp.pwpSpecialPrice || 0).toLocaleString('id-ID')}
                          </div>
                        )}
                        {mech === 'BUY_X_GET_Y' && (
                          <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-300 font-normal mt-0.5 tabular-nums">
                            Otomatis Beli {camp.buyQty || 2} Gratis {camp.getFreeQty || 1} di Keranjang POS
                          </div>
                        )}
                        {camp.supplierName && (
                          <span className="block text-[11px] text-amber-500 dark:text-amber-400 font-normal">
                            Vendor: {camp.supplierName} (Rebate: Rp {(camp.rebateClaimValue || 0).toLocaleString('id-ID')})
                          </span>
                        )}
                      </div>
                    </div>
                    {isDraft && camp.sourceType === 'FEFO_EXP' && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-400 font-normal">Aturan Draf:</span>
                        <select
                          value={mech}
                          onChange={(e) => handleChangeDraftMechanic(camp.id, e.target.value as PromoMechanic)}
                          className={`text-[11px] px-2 py-0.5 rounded border outline-none cursor-pointer ${
                            isDark ? 'bg-slate-950 border-slate-700 text-amber-300' : 'bg-white border-slate-300 text-amber-800'
                          }`}
                        >
                          <option value="STANDARD">Diskon Bertingkat</option>
                          <option value="BUY_X_GET_Y">Beli 2 Gratis 1</option>
                          <option value="PWP_TEBUS_MURAH">PWP Tebus Murah</option>
                        </select>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 space-y-1">
                    <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      {camp.sourceType}
                      {mech !== 'STANDARD' && (
                        <span className="block text-cyan-600 dark:text-cyan-400 font-semibold">
                          {mech}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    <div>{camp.startDate} s.d. {camp.endDate}</div>
                    <div className={`mt-0.5 ${isFefoUnlimited ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                      Kuota: {capLabel}
                    </div>
                  </td>
                  <td className="py-3 px-3 tabular-nums">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                      {mech === 'PWP_TEBUS_MURAH'
                        ? `Tebus Rp ${(camp.pwpSpecialPrice || 0).toLocaleString('id-ID')}`
                        : mech === 'BUY_X_GET_Y'
                        ? `Beli ${camp.buyQty || 2} Gratis ${camp.getFreeQty || 1}`
                        : camp.discountType === 'PERCENT'
                        ? `${camp.discountValue}%`
                        : `Rp ${camp.discountValue.toLocaleString('id-ID')}`}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">Target: {camp.targetValue}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`font-mono text-[11px] font-semibold uppercase ${
                      isAktif
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isDraft
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {camp.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedPosterCampaign(camp)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all inline-flex items-center gap-1 cursor-pointer ${
                        isDark
                          ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                      title="Buka Studio Poster Cetak & Broadcast WhatsApp Member"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Buat Poster &amp; WA</span>
                    </button>
                    {isStoreBndOrExp && (
                      <button
                        type="button"
                        onClick={() => setSelectedLabelPreview(camp)}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-600/15 hover:bg-cyan-600/25 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 text-[11px] font-medium transition-all inline-flex items-center gap-1 cursor-pointer"
                        title="Cetak Label Barcode Paket"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Label</span>
                      </button>
                    )}
                    {isDraft ? (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(camp.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                      >
                        Aktifkan Promo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(camp.id)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        {isAktif ? 'Akhiri' : 'Aktifkan'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteCampaign(camp.id)}
                      className="px-2 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-[11px] transition-all cursor-pointer"
                      title="Hapus Kampanye"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL: BUAT KAMPANYE PROMO BARU (Posisi Atas Tanpa Scroll) */}
      {isCreateModalOpen &&
        createPortal(
          <div
            ref={createModalBackdropRef}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
          >
          <div className={`w-full max-w-xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] ${
            isDark ? 'bg-slate-900 border-cyan-500/40 text-slate-100' : 'bg-white border-cyan-500/70 text-slate-900'
          }`}>
            <div className={`px-6 py-4 border-b shrink-0 flex items-start justify-between ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-600 dark:text-cyan-400">
                  {isBuildingBulk
                    ? 'Generator & Setup Promo Depo Material'
                    : isFnbCulinary
                    ? `Generator Promo & Bundling Menu — ${activeBusinessIdentity}`
                    : 'Generator & Setup Promo Swalayan'}
                </span>
                <h3 className="text-base font-bold mt-0.5">
                  {isBuildingBulk
                    ? 'Buat Kampanye Promo Depo Material'
                    : isFnbCulinary
                    ? 'Buat Kampanye Promo Menu F&B & Paket Bundling'
                    : 'Buat Kampanye Promo & Harga Musiman'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className={`block font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Sumber Promo</label>
                  <select
                    value={formSource}
                    onChange={e => setFormSource(e.target.value as PromoSourceType)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="SEASONAL">
                      {isBuildingBulk
                        ? 'SEASONAL (Paket Renovasi / Event Proyek)'
                        : isFnbCulinary
                        ? 'SEASONAL (Promo Jam Makan / Event Kuliner)'
                        : 'SEASONAL (Event Musiman)'}
                    </option>
                    {!isBuildingBulk && !isFnbCulinary && (
                      <option value="FEFO_EXP">FEFO_EXP (Clearance Kadaluarsa 200-EXP)</option>
                    )}
                    <option value="STORE_DISC">
                      {isBuildingBulk
                        ? 'STORE_DISC (Diskon Volume / Borongan)'
                        : isFnbCulinary
                        ? 'STORE_DISC (Diskon Menu / Happy Hour Resto)'
                        : 'STORE_DISC (Diskon Reguler Toko)'}
                    </option>
                    <option value="SUPPLIER_TPR">
                      {isBuildingBulk
                        ? 'SUPPLIER_TPR (Rebate Pabrik Material)'
                        : isFnbCulinary
                        ? 'SUPPLIER_TPR (Subsidi Roastery / Prinsipal Minuman)'
                        : 'SUPPLIER_TPR (Vendor / Rebate)'}
                    </option>
                    <option value="STORE_BND">
                      {isFnbCulinary
                        ? 'STORE_BND (Paket Bundling Makan & Minum)'
                        : 'STORE_BND (Bundling Paket 200-BND)'}
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className={`block font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isBuildingBulk
                      ? 'Aturan Mekanisme Depo Material'
                      : isFnbCulinary
                      ? 'Aturan Mekanisme Promo F&B'
                      : 'Aturan Mekanisme Swalayan'}
                  </label>
                  <select
                    value={formMechanic}
                    onChange={e => setFormMechanic(e.target.value as PromoMechanic)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="STANDARD">Diskon Standar (% / Nominal Rp)</option>
                    <option value="PWP_TEBUS_MURAH">
                      {isBuildingBulk
                        ? 'PWP_TEBUS_MURAH (Tebus Murah Perkakas)'
                        : isFnbCulinary
                        ? 'PWP_TEBUS_MURAH (Tebus Murah Minuman / Dessert)'
                        : 'PWP_TEBUS_MURAH (Tebus Murah Min. Belanja)'}
                    </option>
                    <option value="BUY_X_GET_Y">BUY_X_GET_Y (Beli X Unit Gratis Y Unit)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`block font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Nama Kampanye Promo</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder={
                    isBuildingBulk
                      ? 'Contoh: Diskon Volume Besi Beton / Paket Pengecatan Rumah'
                      : isFnbCulinary
                      ? `Contoh: Paket Makan Siang Hemat ${activeBusinessIdentity} / Beli 2 Gratis 1 Kopi Aren`
                      : 'Contoh: Tebus Murah Minyak Goreng / Beli 2 Gratis 1'
                  }
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className={`block font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Tanggal Mulai</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={`block font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Tanggal Berakhir</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={`block font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Maks. Qty/Struk
                  </label>
                  {formSource === 'FEFO_EXP' ? (
                    <div className="w-full rounded-xl px-3 py-2 text-xs font-mono font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300">
                      Unlimited (FEFO)
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      value={formMaxQtyPerReceipt}
                      onChange={e => setFormMaxQtyPerReceipt(e.target.value)}
                      placeholder="Kosong = Unlimited"
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  )}
                </div>
              </div>

              {formSource === 'SUPPLIER_TPR' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="space-y-1">
                    <label className="text-amber-700 dark:text-amber-300 font-medium">Nama Supplier / Vendor</label>
                    <input
                      type="text"
                      value={formSupplierName}
                      onChange={e => setFormSupplierName(e.target.value)}
                      placeholder={
                        isBuildingBulk
                          ? 'PT Semen Tonasa / Dulux ICI Paints'
                          : isFnbCulinary
                          ? 'PT Kopi Nusantara Roastery / Anchor Dairy'
                          : 'PT Unilever Indonesia'
                      }
                      className={`w-full border rounded-lg px-2.5 py-1.5 text-xs ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-amber-700 dark:text-amber-300 font-medium">Nilai Klaim Rebate (Rp)</label>
                    <input
                      type="number"
                      value={formRebateValue}
                      onChange={e => setFormRebateValue(Number(e.target.value))}
                      className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              )}

              {formSource !== 'STORE_BND' && (
                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="space-y-1">
                    <label className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Target Diskon</label>
                    <select
                      value={formTargetType}
                      onChange={e => {
                        const nextType = e.target.value as TargetType;
                        setFormTargetType(nextType);
                        if (nextType === 'CATEGORY' && isFnbCulinary) {
                          setFormTargetValue('Makanan Utama');
                        } else if (nextType === 'SKU' && domainProducts[0]) {
                          setFormTargetValue(domainProducts[0].id);
                        }
                      }}
                      className={`w-full border rounded-lg px-2.5 py-1.5 text-xs ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="SKU">{isFnbCulinary ? 'Per Menu F&B' : 'Per SKU Produk'}</option>
                      <option value="CATEGORY">
                        {isBuildingBulk
                          ? 'Per Kategori Material'
                          : isFnbCulinary
                          ? 'Per Kategori Menu F&B'
                          : 'Per Kategori (PC.x)'}
                      </option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {formTargetType === 'SKU'
                        ? isFnbCulinary
                          ? 'Pilih Menu F&B Target (18 Menu Aktif)'
                          : 'Pilih Produk Target'
                        : 'Kode / Nama Kategori'}
                    </label>
                    {formTargetType === 'SKU' ? (
                      <select
                        value={formTargetValue}
                        onChange={e => setFormTargetValue(e.target.value)}
                        className={`w-full border rounded-lg px-2.5 py-1.5 text-xs ${
                          isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        {domainProducts.map((p: any, pIdx: number) => (
                          <option key={`target-sku-${p.id || pIdx}`} value={p.id}>
                            {p.id} - {p.name} (Rp {Number(p.sell_price ?? p.price_retail ?? p.price ?? 0).toLocaleString('id-ID')})
                          </option>
                        ))}
                      </select>
                    ) : isFnbCulinary ? (
                      <select
                        value={formTargetValue}
                        onChange={e => setFormTargetValue(e.target.value)}
                        className={`w-full border rounded-lg px-2.5 py-1.5 text-xs ${
                          isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        {fnbCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            Kategori Menu: {cat}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formTargetValue}
                        onChange={e => setFormTargetValue(e.target.value)}
                        placeholder={
                          isBuildingBulk
                            ? 'Contoh: Semen, Besi/Baja & Perpipaan'
                            : 'Contoh: PC.2 (Powder Detergent) & PC.5 (Cooking Oil)'
                        }
                        className={`w-full border rounded-lg px-2.5 py-1.5 text-xs ${
                          isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    )}
                  </div>
                </div>
              )}

              {formSource === 'STORE_BND' && (
                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-3">
                  <span className="font-bold text-cyan-700 dark:text-cyan-300 block">
                    {isFnbCulinary
                      ? 'Komponen Menu Paket Bundling F&B (Otomatis Muncul di Kasir POS)'
                      : 'Komponen SKU Paket Bundling (Barcode Otomatis 200-BND)'}
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={formSelectedSkuId}
                      onChange={e => setFormSelectedSkuId(e.target.value)}
                      className={`flex-1 border rounded-xl px-3 py-1.5 text-xs ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      {domainProducts.map((p: any, pIdx: number) => (
                        <option key={`bnd-sku-${p.id || pIdx}`} value={p.id}>
                          {p.name} — Rp {Number(p.sell_price ?? p.price_retail ?? p.price ?? 0).toLocaleString('id-ID')}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddBundleComponent}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Tambah {isFnbCulinary ? 'Menu' : 'SKU'}
                    </button>
                  </div>

                  {formBundleSkus.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {formBundleSkus.map((item, idx) => (
                        <div key={`bnd-comp-${item.skuId}-${idx}`} className={`flex items-center justify-between p-2 rounded-lg border ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                        }`}>
                          <span>{item.skuName} (Qty: {item.qty})</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBundleComponent(item.skuId)}
                            className="text-rose-500 hover:text-rose-400 text-[11px]"
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Konfigurasi Spesifik Mekanisme */}
              {formMechanic === 'PWP_TEBUS_MURAH' ? (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="space-y-1">
                    <label className="font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Syarat Min. Subtotal Keranjang (Rp)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formPwpMinCartSubtotal}
                      onChange={e => setFormPwpMinCartSubtotal(Number(e.target.value))}
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-amber-700 dark:text-amber-300">Harga Tebus Murah / Unit (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={formPwpSpecialPrice}
                      onChange={e => setFormPwpSpecialPrice(Number(e.target.value))}
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                      required
                    />
                  </div>
                </div>
              ) : formMechanic === 'BUY_X_GET_Y' ? (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="space-y-1">
                    <label className="font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" />
                      <span>Beli Minimal X Unit</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formBuyQty}
                      onChange={e => setFormBuyQty(Math.max(1, Number(e.target.value)))}
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-emerald-700 dark:text-emerald-300">Gratis Otomatis Y Unit</label>
                    <input
                      type="number"
                      min="1"
                      value={formGetFreeQty}
                      onChange={e => setFormGetFreeQty(Math.max(1, Number(e.target.value)))}
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={`block font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Tipe Potongan</label>
                    <select
                      value={formDiscountType}
                      onChange={e => setFormDiscountType(e.target.value as DiscountType)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="PERCENT">Persentase (%)</option>
                      <option value="NOMINAL">Nominal (Rp)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={`block font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Nilai Potongan</label>
                    <input
                      type="number"
                      value={formDiscountValue}
                      onChange={e => setFormDiscountValue(Number(e.target.value))}
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                      required
                    />
                  </div>
                </div>
              )}

              {/* KALKULATOR DISKON & BUNDLING REALTIME (Memuat Foto Menu, Harga Jual, HPP & Margin) */}
              <div className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-slate-950/90 border-emerald-500/35' : 'bg-emerald-50/70 border-emerald-300'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">
                    Kalkulator Diskon &amp; Bundling Otomatis ({activeBusinessIdentity})
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    livePromoCalculator.marginPct >= 15
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                      : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                  }`}>
                    Est. Margin Promo: {livePromoCalculator.marginPct.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {livePromoCalculator.image && (
                    <img
                      src={livePromoCalculator.image}
                      alt={livePromoCalculator.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-emerald-500/40 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {livePromoCalculator.title}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-1.5 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Harga Normal</span>
                        <span className="line-through text-slate-400">
                          Rp {livePromoCalculator.normalPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Harga Promo</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          Rp {livePromoCalculator.finalPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Hemat / Diskon</span>
                        <span className="font-bold text-amber-600 dark:text-amber-300">
                          -Rp {livePromoCalculator.savings.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`px-6 py-3.5 border-t shrink-0 flex items-center justify-end gap-2 ${isDark ? 'border-white/[0.08] bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Terbitkan Kampanye Promo</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: PREVIEW LABEL STIKER BARCODE PAKET */}
      {selectedLabelPreview && (
        <div
          ref={labelModalBackdropRef}
          className="fixed inset-0 z-50 flex items-start justify-center pt-6 px-4 pb-6 bg-black/70 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-md p-6 rounded-2xl bg-white text-slate-900 border border-cyan-500 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b pb-3 border-slate-200">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-600">Stiker Barcode Resmi Toko</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedLabelPreview.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLabelPreview(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3 font-mono">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                {activeBusinessIdentity} Official Bundle
              </span>
              <div className="py-3 px-4 bg-white border border-slate-300 rounded-lg shadow-inner inline-block">
                <div className="text-2xl font-black tracking-widest text-slate-900">{selectedLabelPreview.code}</div>
                <div className="text-[10px] text-slate-500 mt-1">|||||| |||||||| ||||||||| |||||</div>
              </div>
              <div className="text-xs font-sans text-slate-700 font-medium">
                {selectedLabelPreview.mechanic === 'BUY_X_GET_Y'
                  ? `Beli ${selectedLabelPreview.buyQty || 2} Gratis ${selectedLabelPreview.getFreeQty || 1}`
                  : selectedLabelPreview.mechanic === 'PWP_TEBUS_MURAH'
                  ? `Tebus Murah Rp ${(selectedLabelPreview.pwpSpecialPrice || 0).toLocaleString('id-ID')} (Min. Belanja Rp ${(selectedLabelPreview.pwpMinCartSubtotal || 0).toLocaleString('id-ID')})`
                  : `Potongan: ${selectedLabelPreview.discountType === 'PERCENT' ? `${selectedLabelPreview.discountValue}%` : `Rp ${selectedLabelPreview.discountValue.toLocaleString('id-ID')}`}`}
                {' · '}
                {selectedLabelPreview.sourceType === 'FEFO_EXP'
                  ? 'Kuota Struk: Unlimited (FEFO)'
                  : selectedLabelPreview.maxQtyPerReceipt
                  ? `Maks. ${selectedLabelPreview.maxQtyPerReceipt}/struk`
                  : 'Kuota: Unlimited'}
              </div>
              {selectedLabelPreview.componentSkus && selectedLabelPreview.componentSkus.length > 0 && (
                <div className="text-left text-xs font-sans text-slate-600 border-t pt-2 mt-2 space-y-1">
                  <span className="font-bold block text-[11px] text-slate-800">Komponen SKU Paket:</span>
                  {selectedLabelPreview.componentSkus.map(c => (
                    <div key={c.skuId} className="flex justify-between text-[11px]">
                      <span>- {c.skuName}</span>
                      <span className="font-mono font-semibold">x{c.qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (showToast) showToast(`Label barcode ${selectedLabelPreview.code} dikirim ke antrean printer kasir/label.`);
                  setSelectedLabelPreview(null);
                }}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Label Stiker</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedLabelPreview(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STUDIO POSTER CETAK & WHATSAPP MEMBER */}
      {selectedPosterCampaign && (
        <PromoPosterStudioModal
          campaign={selectedPosterCampaign}
          campaigns={domainCampaigns}
          onSelectCampaign={(camp) => setSelectedPosterCampaign(camp)}
          products={domainProducts}
          customers={customers}
          storeName={activeBusinessIdentity}
          isDark={isDark}
          onClose={() => setSelectedPosterCampaign(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
};
