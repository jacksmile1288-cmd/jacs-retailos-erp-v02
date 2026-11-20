import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, BulkFleetTier, WeightFractionTier, WeightFractionConfig } from '../../types';
import { BUILDING_HARDWARE_PRODUCTS } from '../../data/industryTerminalProducts';
import {
  getBuildingTierConfig,
  evaluateTierMarginGuard,
  getMinSafeSellingPrice,
  MIN_SAFE_MARGIN_PERCENT,
} from '../../utils/buildingTierPricing';
import {
  Truck,
  Layers,
  Package,
  Plus,
  Trash2,
  X,
  Search,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ArrowLeft,
  Filter,
  Check,
  AlertCircle,
  HardHat,
  Ruler,
  Boxes,
  HelpCircle,
  Zap,
  Scale,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

export const DEFAULT_FLEET_TIERS: BulkFleetTier[] = [
  { id: 'PICKUP_RET', name: 'Ret Pick-up (±1.2 m³)', volumeM3: 1.2, suffix: '-PKP', price: 350000, costPrice: 260000, isActive: true },
  { id: 'TRUCK_ENGKEL', name: 'Ret Truk Engkel (±3.0 m³)', volumeM3: 3.0, suffix: '-ENG', price: 850000, costPrice: 650000, isActive: true },
  { id: 'DUMP_TRUCK', name: 'Ret Dump Truck Besar (±6.5 m³)', volumeM3: 6.5, suffix: '-TRK', price: 1800000, costPrice: 1400000, isActive: true },
  { id: 'SAK_KARUNG', name: 'Eceran Karung / Sak (±0.03 m³)', volumeM3: 0.03, suffix: '-SAK', price: 18000, costPrice: 12000, isActive: true },
];

export const DEFAULT_FRACTION_TIERS: WeightFractionTier[] = [
  { id: 'FRAC_1KG', name: '1 Kg', fractionKg: 1.0, price: 18000, isActive: true },
  { id: 'FRAC_050', name: '1/2 Kg (500g)', fractionKg: 0.5, price: 9500, isActive: true },
  { id: 'FRAC_025', name: '1/4 Kg (250g)', fractionKg: 0.25, price: 5000, isActive: true },
  { id: 'FRAC_010', name: '1 Ons (100g)', fractionKg: 0.1, price: 2200, isActive: true },
];

interface BuildingMaterialsMasterModuleProps {
  onBackToOverview?: () => void;
}

export const BuildingMaterialsMasterModule: React.FC<BuildingMaterialsMasterModuleProps> = ({
  onBackToOverview,
}) => {
  const {
    products,
    addProduct,
    addProductsBulk,
    updateProduct,
    deleteProduct,
    showToast,
    addAuditLog,
    theme,
    language,
  } = useApp();

  const isLight = theme === 'light';
  const isEn = language === 'en';

  const [searchQuery, setSearchQuery] = useState('');
  const [natureFilter, setNatureFilter] = useState<'ALL' | 'BULK_CURAH' | 'DIMENSION_CUSTOM' | 'MANUFACTURED'>('ALL');
  const [deliveryFilter, setDeliveryFilter] = useState<'ALL' | 'INCLUDE_ONGKIR' | 'EXCLUDE_ONGKIR'>('ALL');

  // Modal Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('PASIR_BATU_SEMEN');
  const [brand, setBrand] = useState('Lokal / Standar');
  const [barcode, setBarcode] = useState('');
  const [sellPrice, setSellPrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [stock, setStock] = useState(100);
  const [unit, setUnit] = useState('Ret Pick-up');
  const [materialNature, setMaterialNature] = useState<'BULK_CURAH' | 'DIMENSION_CUSTOM' | 'MANUFACTURED'>('BULK_CURAH');
  
  // Custom Dimension (Kayu/Balok/Papan)
  const [lengthCm, setLengthCm] = useState<number>(400);
  const [widthCm, setWidthCm] = useState<number>(20);
  const [thicknessMm, setThicknessMm] = useState<number>(20);

  // Bulk Armada
  const [bulkUnitType, setBulkUnitType] = useState<string>('PICKUP_RET');
  const [fleetTiers, setFleetTiers] = useState<BulkFleetTier[]>(DEFAULT_FLEET_TIERS);

  // Weight Fraction State (Paku, Kawat, Baut)
  const [isWeightFraction, setIsWeightFraction] = useState(false);
  const [weightBaseUnit, setWeightBaseUnit] = useState<'Kg' | 'Dus'>('Kg');
  const [dusWeightKg, setDusWeightKg] = useState<number>(10);
  const [packagingFee, setPackagingFee] = useState<number>(500);
  const [fractionTiers, setFractionTiers] = useState<WeightFractionTier[]>(DEFAULT_FRACTION_TIERS);

  // Multi-unit retail
  const [hasSecondaryUnit, setHasSecondaryUnit] = useState(false);
  const [unitSecondary, setUnitSecondary] = useState('Meter');
  const [priceSecondary, setPriceSecondary] = useState(0);
  const [conversionRate, setConversionRate] = useState(1);
  const [supportDecimal, setSupportDecimal] = useState(true);

  // Delivery & Loading Fees
  const [deliveryPricingPolicy, setDeliveryPricingPolicy] = useState<'INCLUDE_ONGKIR' | 'EXCLUDE_ONGKIR' | 'TIER_DISTANCE'>('EXCLUDE_ONGKIR');
  const [defaultLoadingFee, setDefaultLoadingFee] = useState<number>(25000);
  const [minOrderQty, setMinOrderQty] = useState<number>(1);

  // 3-Tier Harga Otomatis (Tier 1 Eceran Umum, Tier 2 Tukang, Tier 3 Kontraktor)
  const [tier2MinQty, setTier2MinQty] = useState<number>(10);
  const [tier2Price, setTier2Price] = useState<number>(0);
  const [tier3MinQty, setTier3MinQty] = useState<number>(40);
  const [tier3Price, setTier3Price] = useState<number>(0);
  const [marginGuardAuthorized, setMarginGuardAuthorized] = useState<boolean>(false);

  // Inline table quick-edit 3-tier pricing
  const [inlineTierEditId, setInlineTierEditId] = useState<string | null>(null);
  const [inlineMarginAuthorized, setInlineMarginAuthorized] = useState<boolean>(false);
  const [inlineTierForm, setInlineTierForm] = useState<{
    sellPrice: number;
    tier2MinQty: number;
    tier2Price: number;
    tier3MinQty: number;
    tier3Price: number;
  }>({ sellPrice: 0, tier2MinQty: 10, tier2Price: 0, tier3MinQty: 40, tier3Price: 0 });

  // Auto-Generate Barcode Depo / PLU
  const handleAutoGenerateBarcode = (formatType?: 'DEPO' | 'NUMERIC_8') => {
    let newBarcode = '';
    if (formatType === 'NUMERIC_8') {
      // 8-digit PLU internal / EAN-13 numeric (e.g. 28012345)
      const rand8 = Math.floor(10000000 + Math.random() * 90000000).toString();
      newBarcode = rand8;
    } else {
      let prefix = 'DEP-MAT-';
      const cat = (category || '').toUpperCase();
      const nm = (name || '').toUpperCase();
      if (cat.includes('PASIR') || cat.includes('SEMEN') || cat.includes('CURAH') || materialNature === 'BULK_CURAH') {
        prefix = 'DEP-CURAH-';
      } else if (nm.includes('PAKU') || cat.includes('PAKU') || isWeightFraction) {
        prefix = 'DEP-PAKU-';
      } else if (cat.includes('KAYU') || materialNature === 'DIMENSION_CUSTOM') {
        prefix = 'DEP-KAYU-';
      } else if (cat.includes('PIPA') || cat.includes('PVC')) {
        prefix = 'DEP-PIPA-';
      } else if (cat.includes('BESI')) {
        prefix = 'DEP-BESI-';
      } else {
        prefix = 'DEP-PLU-';
      }
      const rand5 = Math.floor(10000 + Math.random() * 90000).toString();
      newBarcode = `${prefix}${rand5}`;
    }
    setBarcode(newBarcode);
    showToast(`Barcode Depo berhasil di-generate: ${newBarcode}`);
  };

  // Auto-Recalculate Fractions (1 Kg, 1/2 Kg, 1/4 Kg + margin kemasan, 1 Ons)
  const handleRecalculateFractions = (basePrice: number, packFee: number = packagingFee) => {
    const p = basePrice > 0 ? basePrice : 18000;
    setFractionTiers([
      { id: 'FRAC_1KG', name: '1 Kg', fractionKg: 1.0, price: p, isActive: true },
      { id: 'FRAC_050', name: '1/2 Kg (500g)', fractionKg: 0.5, price: Math.round(p * 0.5), isActive: true },
      { id: 'FRAC_025', name: '1/4 Kg (250g)', fractionKg: 0.25, price: Math.round(p * 0.25 + packFee), isActive: true },
      { id: 'FRAC_010', name: '1 Ons (100g)', fractionKg: 0.1, price: Math.round(p * 0.1), isActive: true },
    ]);
  };

  // Filter building materials products
  const buildingMaterials = useMemo(() => {
    return products.filter((p) => {
      const cat = (p.category || '').toUpperCase();
      const isBuilding =
        p.businessModel === 'building' ||
        (p.id && p.id.startsWith('MAT-')) ||
        Boolean(p.materialNature) ||
        cat.includes('PASIR') ||
        cat.includes('SEMEN') ||
        cat.includes('BATA') ||
        cat.includes('KAYU') ||
        cat.includes('PERPIPAAN') ||
        cat.includes('BESI') ||
        cat.includes('BAJA') ||
        cat.includes('PAKU') ||
        cat.includes('PERKAKAS') ||
        cat.includes('CAT');
      return isBuilding;
    });
  }, [products]);

  // Pastikan katalog otomatis memuat data bawaan BUILDING_HARDWARE_PRODUCTS saat daftar material kosong (kecuali setelah Reset Level 2 / Level 4)
  const { isMasterCatalogWiped } = useApp();
  const hasAutoSeededRef = useRef(false);
  useEffect(() => {
    if (!isMasterCatalogWiped && !hasAutoSeededRef.current && buildingMaterials.length === 0) {
      hasAutoSeededRef.current = true;
      addProductsBulk(
        BUILDING_HARDWARE_PRODUCTS,
        `Katalog bawaan Depo Bangunan (${BUILDING_HARDWARE_PRODUCTS.length} SKU) dimuat otomatis`
      );
    }
  }, [buildingMaterials.length, addProductsBulk, isMasterCatalogWiped]);

  const handleLoadDefaultCatalog = () => {
    const existingIds = new Set(products.map((p) => p.id));
    const missing = BUILDING_HARDWARE_PRODUCTS.filter((p) => !existingIds.has(p.id));
    if (missing.length === 0) {
      showToast('Seluruh katalog bawaan Depo Bangunan sudah tersedia.');
      return;
    }
    addProductsBulk(missing, `${missing.length} SKU bawaan Depo Bangunan berhasil dimuat.`);
  };

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return buildingMaterials.filter((m) => {
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.barcode && m.barcode.toLowerCase().includes(q)) ||
        (m.category && m.category.toLowerCase().includes(q)) ||
        (m.brand && m.brand.toLowerCase().includes(q));

      const matchNature =
        natureFilter === 'ALL' ||
        m.materialNature === natureFilter ||
        (!m.materialNature && natureFilter === 'MANUFACTURED');

      const matchDelivery =
        deliveryFilter === 'ALL' || m.deliveryPricingPolicy === deliveryFilter;

      return matchSearch && matchNature && matchDelivery;
    });
  }, [buildingMaterials, searchQuery, natureFilter, deliveryFilter]);

  // Metrics
  const bulkCount = buildingMaterials.filter((m) => m.materialNature === 'BULK_CURAH').length;
  const dimensionCount = buildingMaterials.filter((m) => m.materialNature === 'DIMENSION_CUSTOM').length;
  const includeOngkirCount = buildingMaterials.filter((m) => m.deliveryPricingPolicy === 'INCLUDE_ONGKIR').length;
  const totalStockUnits = buildingMaterials.reduce((sum, m) => sum + (m.stock || 0), 0);

  const handleOpenAdd = () => {
    setEditingMaterial(null);
    setName('');
    setCategory('PASIR_BATU_SEMEN');
    setBrand('Lokal / Standar');
    setBarcode(`MAT-${Date.now().toString().slice(-6)}`);
    setSellPrice(350000);
    setCostPrice(260000);
    setStock(100);
    setUnit('Ret Pick-up');
    setMaterialNature('BULK_CURAH');
    setLengthCm(400);
    setWidthCm(20);
    setThicknessMm(20);
    setBulkUnitType('PICKUP_RET');
    setFleetTiers(DEFAULT_FLEET_TIERS);
    setIsWeightFraction(false);
    setWeightBaseUnit('Kg');
    setDusWeightKg(10);
    setPackagingFee(500);
    setFractionTiers(DEFAULT_FRACTION_TIERS);
    setHasSecondaryUnit(false);
    setUnitSecondary('Meter');
    setPriceSecondary(0);
    setConversionRate(1);
    setSupportDecimal(true);
    setDeliveryPricingPolicy('EXCLUDE_ONGKIR');
    setDefaultLoadingFee(25000);
    setMinOrderQty(1);
    setTier2MinQty(3);
    setTier2Price(330000);
    setTier3MinQty(6);
    setTier3Price(305000);
    setMarginGuardAuthorized(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (m: Product) => {
    const tierCfg = getBuildingTierConfig(m);
    setEditingMaterial(m);
    setName(m.name);
    setCategory(m.category || 'PASIR_BATU_SEMEN');
    setBrand(m.brand || 'Lokal / Standar');
    setBarcode(m.barcode || m.id);
    setSellPrice(tierCfg.tier1Price);
    setCostPrice(m.cost_price || 0);
    setStock(m.stock);
    setUnit(m.unit || 'Pcs');
    setMaterialNature(m.materialNature || 'MANUFACTURED');
    setLengthCm(m.customDimension?.lengthCm || 400);
    setWidthCm(m.customDimension?.widthCm || 20);
    setThicknessMm(m.customDimension?.thicknessMm || 20);
    setBulkUnitType(m.bulkUnitType || 'PICKUP_RET');
    setFleetTiers(
      m.bulkFleetTiers && m.bulkFleetTiers.length > 0
        ? m.bulkFleetTiers
        : DEFAULT_FLEET_TIERS
    );
    setIsWeightFraction(Boolean(m.isWeightFraction || m.weightFractionConfig?.enabled));
    setWeightBaseUnit(m.weightFractionConfig?.baseUnit || 'Kg');
    setDusWeightKg(m.weightFractionConfig?.dusWeightKg || 10);
    setPackagingFee(m.weightFractionConfig?.packagingFee || 500);
    setFractionTiers(
      m.weightFractionConfig?.fractions && m.weightFractionConfig.fractions.length > 0
        ? m.weightFractionConfig.fractions
        : [
            { id: 'FRAC_1KG', name: '1 Kg', fractionKg: 1.0, price: m.sell_price || 18000, isActive: true },
            { id: 'FRAC_050', name: '1/2 Kg (500g)', fractionKg: 0.5, price: Math.round((m.sell_price || 18000) * 0.5 + 500), isActive: true },
            { id: 'FRAC_025', name: '1/4 Kg (250g)', fractionKg: 0.25, price: Math.round((m.sell_price || 18000) * 0.25 + 500), isActive: true },
            { id: 'FRAC_010', name: '1 Ons (100g)', fractionKg: 0.1, price: Math.round((m.sell_price || 18000) * 0.1 + 250), isActive: true },
          ]
    );
    setHasSecondaryUnit(Boolean(m.unitSecondary && m.priceSecondary));
    setUnitSecondary(m.unitSecondary || 'Meter');
    setPriceSecondary(m.priceSecondary || 0);
    setConversionRate(m.conversionRate || 1);
    setSupportDecimal(m.supportDecimal ?? true);
    setDeliveryPricingPolicy(m.deliveryPricingPolicy || 'EXCLUDE_ONGKIR');
    setDefaultLoadingFee(m.defaultLoadingFee || 0);
    setMinOrderQty(m.minOrderQty || 1);
    setTier2MinQty(tierCfg.tier2MinQty);
    setTier2Price(tierCfg.tier2Price);
    setTier3MinQty(tierCfg.tier3MinQty);
    setTier3Price(tierCfg.tier3Price);
    setMarginGuardAuthorized(false);
    setIsAddModalOpen(true);
  };

  const handleAutoCalcTiers = (baseSell: number) => {
    const safeSell = Math.max(0, Number(baseSell) || 0);
    const minSafe = getMinSafeSellingPrice(costPrice, MIN_SAFE_MARGIN_PERCENT);
    const calcT2 = Math.round((safeSell * 0.95) / 100) * 100;
    const calcT3 = Math.round((safeSell * 0.88) / 100) * 100;
    setTier2Price(minSafe > 0 ? Math.max(minSafe, calcT2) : calcT2);
    setTier3Price(minSafe > 0 ? Math.max(minSafe, calcT3) : calcT3);
  };

  const modalTier1Eval = useMemo(
    () => evaluateTierMarginGuard(sellPrice, costPrice, MIN_SAFE_MARGIN_PERCENT),
    [sellPrice, costPrice]
  );
  const modalTier2Eval = useMemo(
    () => evaluateTierMarginGuard(tier2Price, costPrice, MIN_SAFE_MARGIN_PERCENT),
    [tier2Price, costPrice]
  );
  const modalTier3Eval = useMemo(
    () => evaluateTierMarginGuard(tier3Price, costPrice, MIN_SAFE_MARGIN_PERCENT),
    [tier3Price, costPrice]
  );
  const modalHasFloorViolation =
    modalTier1Eval.isBelowFloor || modalTier2Eval.isBelowFloor || modalTier3Eval.isBelowFloor;

  const handleAdjustModalToSafeMargin = () => {
    const minSafe3 = getMinSafeSellingPrice(costPrice, MIN_SAFE_MARGIN_PERCENT);
    const minSafe2 = getMinSafeSellingPrice(costPrice, 6);
    const minSafe1 = getMinSafeSellingPrice(costPrice, 10);
    if (sellPrice < minSafe1) setSellPrice(minSafe1);
    if (tier2Price < minSafe2) setTier2Price(minSafe2);
    if (tier3Price < minSafe3) setTier3Price(minSafe3);
    showToast(`Harga Tier telah disesuaikan di atas batas aman HPP (Min. Margin ${MIN_SAFE_MARGIN_PERCENT}%)`);
  };

  const handleStartInlineTierEdit = (m: Product) => {
    const cfg = getBuildingTierConfig(m);
    setInlineTierEditId(m.id);
    setInlineMarginAuthorized(false);
    setInlineTierForm({
      sellPrice: cfg.tier1Price,
      tier2MinQty: cfg.tier2MinQty,
      tier2Price: cfg.tier2Price,
      tier3MinQty: cfg.tier3MinQty,
      tier3Price: cfg.tier3Price,
    });
  };

  const handleSaveInlineTierEdit = (m: Product) => {
    const t1 = Math.max(0, Number(inlineTierForm.sellPrice) || 0);
    const t2Min = Math.max(2, Number(inlineTierForm.tier2MinQty) || 2);
    const t3Min = Math.max(t2Min + 1, Number(inlineTierForm.tier3MinQty) || t2Min + 1);
    const t2Price = Math.max(0, Number(inlineTierForm.tier2Price) || 0);
    const t3Price = Math.max(0, Number(inlineTierForm.tier3Price) || 0);
    const hpp = Math.max(0, Number(m.cost_price ?? m.costPrice ?? 0) || 0);

    const eval1 = evaluateTierMarginGuard(t1, hpp, MIN_SAFE_MARGIN_PERCENT);
    const eval2 = evaluateTierMarginGuard(t2Price, hpp, MIN_SAFE_MARGIN_PERCENT);
    const eval3 = evaluateTierMarginGuard(t3Price, hpp, MIN_SAFE_MARGIN_PERCENT);

    if ((eval1.isBelowFloor || eval2.isBelowFloor || eval3.isBelowFloor) && !inlineMarginAuthorized) {
      showToast(
        `⚠️ Margin Floor Guard: Harga Tier 3 (Rp ${t3Price.toLocaleString('id-ID')}) di bawah HPP / Margin < ${MIN_SAFE_MARGIN_PERCENT}%! Naikkan harga atau aktifkan Otorisasi Khusus.`
      );
      return;
    }

    updateProduct(m.id, {
      sell_price: t1,
      sellingPrice: t1,
      price_retail: t1,
      price: t1,
      tier2MinQty: t2Min,
      tier2Price: t2Price,
      price_member: t2Price,
      memberPrice: t2Price,
      tier3MinQty: t3Min,
      tier3Price: t3Price,
      price_wholesale: t3Price,
      wholesalePrice: t3Price,
    });
    setInlineTierEditId(null);
    setInlineMarginAuthorized(false);
    showToast(`Tier Harga 3 Tingkat untuk "${m.name}" berhasil disimpan!`);
    addAuditLog(
      `Updated 3-tier pricing for ${m.name} (${m.id})${inlineMarginAuthorized ? ' [SPECIAL MARGIN OVERRIDE]' : ''}`,
      'Master Data'
    );
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama material wajib diisi!');
      return;
    }

    const normalizedT2Min = Math.max(2, Number(tier2MinQty) || 10);
    const normalizedT3Min = Math.max(normalizedT2Min + 1, Number(tier3MinQty) || normalizedT2Min + 1);
    const normalizedT2Price = tier2Price > 0 ? tier2Price : Math.round((sellPrice * 0.95) / 100) * 100;
    const normalizedT3Price = tier3Price > 0 ? tier3Price : Math.round((sellPrice * 0.88) / 100) * 100;

    const evalT1 = evaluateTierMarginGuard(sellPrice, costPrice, MIN_SAFE_MARGIN_PERCENT);
    const evalT2 = evaluateTierMarginGuard(normalizedT2Price, costPrice, MIN_SAFE_MARGIN_PERCENT);
    const evalT3 = evaluateTierMarginGuard(normalizedT3Price, costPrice, MIN_SAFE_MARGIN_PERCENT);

    if ((evalT1.isBelowFloor || evalT2.isBelowFloor || evalT3.isBelowFloor) && !marginGuardAuthorized) {
      showToast(
        `⚠️ Margin Floor Guard: Penyimpanan dikunci karena Harga Tier 3 di bawah HPP atau Margin < ${MIN_SAFE_MARGIN_PERCENT}%! Sesuaikan harga atau centang Otorisasi Khusus.`
      );
      return;
    }

    const payload: Partial<Product> = {
      name: name.trim(),
      category: category.trim(),
      brand: brand.trim(),
      barcode: barcode.trim() || `MAT-${Date.now().toString().slice(-6)}`,
      sell_price: sellPrice,
      sellingPrice: sellPrice,
      price_retail: sellPrice,
      cost_price: costPrice,
      tier2Price: normalizedT2Price,
      tier2MinQty: normalizedT2Min,
      price_member: normalizedT2Price,
      memberPrice: normalizedT2Price,
      tier3Price: normalizedT3Price,
      tier3MinQty: normalizedT3Min,
      price_wholesale: normalizedT3Price,
      wholesalePrice: normalizedT3Price,
      stock,
      unit: unit.trim(),
      status: 'Active',
      itemType: 'RETAIL',
      businessModel: 'building',
      materialNature,
      customDimension:
        materialNature === 'DIMENSION_CUSTOM'
          ? { lengthCm, widthCm, thicknessMm }
          : undefined,
      bulkUnitType: materialNature === 'BULK_CURAH' ? bulkUnitType : undefined,
      bulkFleetTiers: materialNature === 'BULK_CURAH' ? fleetTiers : undefined,
      isWeightFraction,
      weightFractionConfig: isWeightFraction
        ? {
            enabled: true,
            baseUnit: weightBaseUnit,
            dusWeightKg: weightBaseUnit === 'Dus' ? dusWeightKg : undefined,
            packagingFee,
            fractions: fractionTiers,
          }
        : undefined,
      unitSecondary: hasSecondaryUnit ? unitSecondary.trim() : undefined,
      priceSecondary: hasSecondaryUnit ? priceSecondary : undefined,
      conversionRate: hasSecondaryUnit ? conversionRate : undefined,
      supportDecimal: isWeightFraction ? true : supportDecimal,
      deliveryPricingPolicy,
      defaultLoadingFee,
      minOrderQty,
    };

    if (editingMaterial) {
      updateProduct(editingMaterial.id, payload);
      showToast(`Material "${name}" berhasil diperbarui!`);
      addAuditLog(`Updated building material ${name} (${editingMaterial.id})`, 'Master Data');
    } else {
      const generatedId = `MAT-${Date.now().toString().slice(-6)}`;
      addProduct({
        ...payload,
        id: generatedId,
        plu: barcode.trim() || generatedId,
      } as Product);
      showToast(`Material "${name}" berhasil ditambahkan!`);
      addAuditLog(`Created building material ${name} (${generatedId})`, 'Master Data');
    }

    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string, matName: string) => {
    if (window.confirm(`Yakin ingin menghapus material "${matName}"?`)) {
      deleteProduct(id);
      showToast(`Material "${matName}" telah dihapus.`);
      addAuditLog(`Deleted building material ${matName} (${id})`, 'Master Data');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar with Header and Actions */}
      <div className={`flex items-center justify-between gap-3 pb-3 border-b ${
        isLight ? 'border-slate-200' : 'border-gray-700/40'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-xl">🏗️</span>
          <h2 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Building & Hardware Depot
          </h2>
        </div>

        <button
          onClick={handleOpenAdd}
          className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition active:scale-95 ${
            isLight
              ? 'bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 shadow-sm'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Material Fleksibel</span>
        </button>
      </div>

      {/* 4 Neon KPI Metric Cards (Border 3D Neon Solid in dark, Clean thin border in light) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-3.5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:-translate-y-1 active:scale-95 flex items-center justify-between ${
          isLight
            ? 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
            : 'border-2 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 border-indigo-400/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(129,140,248,0.4)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
        }`}>
          <div>
            <div className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Total Material</div>
            <div className={`text-xl font-black font-mono mt-0.5 ${isLight ? 'text-indigo-800' : 'text-indigo-400'}`}>
              {buildingMaterials.length} SKU
            </div>
            <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              {totalStockUnits.toLocaleString('id-ID')} unit fisik
            </div>
          </div>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
            isLight
              ? 'bg-indigo-50 text-indigo-700 border-slate-200'
              : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
          }`}>
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:-translate-y-1 active:scale-95 flex items-center justify-between ${
          isLight
            ? 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
            : 'border-2 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 border-amber-400/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(245,158,11,0.4)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
        }`}>
          <div>
            <div className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Material Curah</div>
            <div className={`text-xl font-black font-mono mt-0.5 ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
              {bulkCount} Item
            </div>
            <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-amber-700' : 'text-amber-300/80'}`}>
              Pasir, Split, Ret Truk/Pick-up
            </div>
          </div>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
            isLight
              ? 'bg-amber-50 text-amber-700 border-slate-200'
              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
          }`}>
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:-translate-y-1 active:scale-95 flex items-center justify-between ${
          isLight
            ? 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
            : 'border-2 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 border-emerald-400/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(16,185,129,0.4)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
        }`}>
          <div>
            <div className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Kayu Dimensi Custom</div>
            <div className={`text-xl font-black font-mono mt-0.5 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
              {dimensionCount} Item
            </div>
            <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-emerald-700' : 'text-emerald-300/80'}`}>
              Papan / Balok PxLxT
            </div>
          </div>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
            isLight
              ? 'bg-emerald-50 text-emerald-700 border-slate-200'
              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          }`}>
            <Ruler className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:-translate-y-1 active:scale-95 flex items-center justify-between ${
          isLight
            ? 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
            : 'border-2 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 border-cyan-400/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.4)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
        }`}>
          <div>
            <div className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Frangko (Free Ongkir)</div>
            <div className={`text-xl font-black font-mono mt-0.5 ${isLight ? 'text-sky-800' : 'text-cyan-400'}`}>
              {includeOngkirCount} Item
            </div>
            <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-sky-700' : 'text-cyan-300/80'}`}>
              Include armada toko
            </div>
          </div>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
            isLight
              ? 'bg-sky-50 text-sky-700 border-slate-200'
              : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
          }`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
        isLight
          ? 'bg-white border-slate-200 shadow-sm text-slate-900'
          : 'bg-[#161b22] border-[#30363d] text-white'
      }`}>
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Cari nama material, kode, kategori, atau brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl border focus:outline-none focus:border-indigo-500 text-xs ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-[#0d1117] border-[#30363d] text-white'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Nature filter */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
          }`}>
            <span className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Tipe:</span>
            <select
              value={natureFilter}
              onChange={(e) => setNatureFilter(e.target.value as any)}
              className={`bg-transparent font-semibold text-xs outline-none cursor-pointer ${isLight ? 'text-slate-900' : 'text-white'}`}
            >
              <option value="ALL" className={isLight ? 'bg-white text-slate-900' : 'bg-[#161b22]'}>Semua Tipe</option>
              <option value="BULK_CURAH" className={isLight ? 'bg-white text-slate-900' : 'bg-[#161b22]'}>Curah / Ret Volume</option>
              <option value="DIMENSION_CUSTOM" className={isLight ? 'bg-white text-slate-900' : 'bg-[#161b22]'}>Kayu Dimensi Custom</option>
              <option value="MANUFACTURED" className={isLight ? 'bg-white text-slate-900' : 'bg-[#161b22]'}>Pabrikan / Standar</option>
            </select>
          </div>

          {/* Delivery filter */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
          }`}>
            <span className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Antar:</span>
            <select
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value as any)}
              className={`bg-transparent font-semibold text-xs outline-none cursor-pointer ${isLight ? 'text-slate-900' : 'text-white'}`}
            >
              <option value="ALL" className={isLight ? 'bg-white text-slate-900' : 'bg-[#161b22]'}>Semua Kebijakan</option>
              <option value="INCLUDE_ONGKIR" className={isLight ? 'bg-white text-slate-900' : 'bg-[#161b22]'}>Free Antar (Frangko)</option>
              <option value="EXCLUDE_ONGKIR" className={isLight ? 'bg-white text-slate-900' : 'bg-[#161b22]'}>Loco (Ambil Sendiri)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className={`border rounded-2xl overflow-hidden ${isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-[#30363d] bg-[#161b22]'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-bold uppercase text-[10px] tracking-wider ${
              isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-[#0d1117] text-slate-300 border-[#30363d]'
            }`}>
              <tr>
                <th className="py-2.5 px-3 font-bold">Kode / Barcode</th>
                <th className="py-2.5 px-3 font-bold">Nama Material & Brand</th>
                <th className="py-2.5 px-3 font-bold">Tipe & Spesifikasi</th>
                <th className="py-2.5 px-3 text-center font-bold">Satuan UOM</th>
                <th className="py-2.5 px-3 text-center font-bold">Stok</th>
                <th className="py-2.5 px-3 text-right font-bold">Harga Modal (HPP)</th>
                <th className="py-2.5 px-3 text-right font-bold min-w-[235px]">3 Tier Harga (Eceran / Tukang / Kontraktor)</th>
                <th className="py-2.5 px-3 font-bold">Kebijakan Pengiriman</th>
                <th className="py-2.5 px-3 text-center font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${isLight ? 'divide-slate-200 bg-white text-slate-900' : 'divide-[#30363d] text-gray-200'}`}>
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`py-8 text-center space-y-2 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                    <div>Tidak ada material yang cocok dengan filter pencarian.</div>
                    {buildingMaterials.length === 0 && (
                      <button
                        type="button"
                        onClick={handleLoadDefaultCatalog}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                      >
                        Muat Katalog Bawaan Depo Bangunan
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((m, mIdx) => {
                  const isBulk = m.materialNature === 'BULK_CURAH';
                  const isWood = m.materialNature === 'DIMENSION_CUSTOM';
                  const isInclude = m.deliveryPricingPolicy === 'INCLUDE_ONGKIR';
                  const tierCfg = getBuildingTierConfig(m);
                  const isInlineEditing = inlineTierEditId === m.id;

                  return (
                    <tr key={`bmat-row-${m.id}-${mIdx}`} className={`${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1c2128]'} transition`}>
                      {/* Code / Barcode */}
                      <td className={`py-2.5 px-3 font-mono text-[11px] ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                        <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{m.id}</div>
                        <div>{m.barcode}</div>
                      </td>

                      {/* Name & Brand */}
                      <td className="py-2.5 px-3">
                        <div className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{m.name}</div>
                        <div className={`text-[10px] flex items-center gap-1.5 mt-0.5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                          <span className={`px-1.5 py-0.2 rounded font-mono border ${
                            isLight ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                          }`}>
                            {m.category || 'MATERIAL'}
                          </span>
                          <span>•</span>
                          <span>{m.brand || 'Lokal'}</span>
                        </div>
                      </td>

                      {/* Nature & Specs */}
                      <td className="py-2.5 px-3">
                        {isBulk ? (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                              <Truck className="w-3 h-3" />
                              <span>Curah: {m.bulkUnitType || m.unit}</span>
                            </span>
                            {m.bulkFleetTiers && m.bulkFleetTiers.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {m.bulkFleetTiers
                                  .filter((f) => f.isActive)
                                  .map((f, fIdx) => (
                                    <span
                                      key={`fleet-${f.id}-${fIdx}`}
                                      className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                      title={`${f.name} (±${f.volumeM3} m³) - Rp ${f.price.toLocaleString('id-ID')}`}
                                    >
                                      {f.suffix}: ±{f.volumeM3}m³
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        ) : m.isWeightFraction ? (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1 w-fit">
                              <Scale className="w-3 h-3" />
                              <span>Fraksi Timbang ({m.weightFractionConfig?.baseUnit || m.unit})</span>
                            </span>
                            {m.weightFractionConfig?.fractions && (
                              <div className="flex flex-wrap gap-1">
                                {m.weightFractionConfig.fractions
                                  .filter((fr) => fr.isActive)
                                  .map((fr, frIdx) => (
                                    <span
                                      key={`frac-${fr.id}-${frIdx}`}
                                      className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20"
                                    >
                                      {fr.name}: Rp {(fr.price / 1000).toLocaleString('id-ID')}k
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        ) : isWood ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              Kayu Custom
                            </span>
                            {m.customDimension && (
                              <div className="text-[10px] font-mono text-gray-400">
                                {m.customDimension.thicknessMm}mm × {m.customDimension.widthCm}cm × {m.customDimension.lengthCm}cm
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            Pabrikan Standar
                          </span>
                        )}
                      </td>

                      {/* UOM */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`font-bold font-mono px-2 py-0.5 rounded text-xs ${
                          isLight
                            ? 'bg-slate-100 border border-slate-300 text-slate-800'
                            : 'bg-black/40 border border-gray-700 text-gray-200'
                        }`}>
                          {m.unit}
                        </span>
                        {m.unitSecondary && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                            Ecer: {m.unitSecondary}
                          </div>
                        )}
                        {m.isWeightFraction && (
                          <div className="text-[9px] text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                            ±0.25 - 0.50
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        <span className={m.stock > 10 ? 'text-slate-800 dark:text-white' : 'text-rose-600 dark:text-rose-400'}>
                          {m.stock}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-gray-400">
                        Rp {(m.cost_price || 0).toLocaleString('id-ID')}
                      </td>

                      {/* Sell Price + 3-Tier Pricing + Margin Floor Guard (Inline View & Quick Edit) */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        {(() => {
                          const rowHpp = Math.max(0, Number(m.cost_price ?? m.costPrice ?? 0) || 0);
                          const viewEval1 = evaluateTierMarginGuard(tierCfg.tier1Price, rowHpp, MIN_SAFE_MARGIN_PERCENT);
                          const viewEval2 = evaluateTierMarginGuard(tierCfg.tier2Price, rowHpp, MIN_SAFE_MARGIN_PERCENT);
                          const viewEval3 = evaluateTierMarginGuard(tierCfg.tier3Price, rowHpp, MIN_SAFE_MARGIN_PERCENT);

                          if (isInlineEditing) {
                            const inEval1 = evaluateTierMarginGuard(inlineTierForm.sellPrice, rowHpp, MIN_SAFE_MARGIN_PERCENT);
                            const inEval2 = evaluateTierMarginGuard(inlineTierForm.tier2Price, rowHpp, MIN_SAFE_MARGIN_PERCENT);
                            const inEval3 = evaluateTierMarginGuard(inlineTierForm.tier3Price, rowHpp, MIN_SAFE_MARGIN_PERCENT);
                            const inHasViolation = inEval1.isBelowFloor || inEval2.isBelowFloor || inEval3.isBelowFloor;
                            const isInlineLocked = inHasViolation && !inlineMarginAuthorized;

                            return (
                              <div className={`p-2 rounded-xl border text-left space-y-1.5 ${
                                inHasViolation
                                  ? isLight ? 'bg-rose-50 border-rose-400 text-slate-900' : 'bg-rose-950/30 border-rose-500/60 text-white'
                                  : isLight ? 'bg-sky-50 border-sky-300 text-slate-900' : 'bg-[#0d1117] border-indigo-500/40 text-white'
                              }`}>
                                <div className="flex items-center justify-between gap-1 text-[10px]">
                                  <span className="font-bold whitespace-nowrap">T1 (1+):</span>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min={0}
                                      value={inlineTierForm.sellPrice}
                                      onChange={(e) => setInlineTierForm((prev) => ({ ...prev, sellPrice: Number(e.target.value) || 0 }))}
                                      className={`w-24 px-1.5 py-0.5 rounded border text-right font-bold text-[11px] ${
                                        inEval1.isBelowFloor
                                          ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-300'
                                          : isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-slate-700 text-white'
                                      }`}
                                    />
                                    <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${
                                      inEval1.isBelowFloor
                                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                    }`}>
                                      {inEval1.marginPercent}%
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-1 text-[10px]">
                                  <span className="font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">T2 ≥</span>
                                  <input
                                    type="number"
                                    min={2}
                                    value={inlineTierForm.tier2MinQty}
                                    onChange={(e) => setInlineTierForm((prev) => ({ ...prev, tier2MinQty: Number(e.target.value) || 2 }))}
                                    className={`w-10 px-1 py-0.5 rounded border text-center font-bold text-[11px] ${
                                      isLight ? 'bg-white border-amber-300 text-slate-900' : 'bg-[#161b22] border-amber-500/40 text-amber-300'
                                    }`}
                                    title="Min Qty Tier 2"
                                  />
                                  <input
                                    type="number"
                                    min={0}
                                    value={inlineTierForm.tier2Price}
                                    onChange={(e) => setInlineTierForm((prev) => ({ ...prev, tier2Price: Number(e.target.value) || 0 }))}
                                    className={`w-22 px-1.5 py-0.5 rounded border text-right font-bold text-[11px] ${
                                      inEval2.isBelowFloor
                                        ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-300'
                                        : isLight ? 'bg-white border-amber-300 text-slate-900' : 'bg-[#161b22] border-amber-500/40 text-amber-300'
                                    }`}
                                    title="Harga Tier 2"
                                  />
                                  <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${
                                    inEval2.isBelowFloor
                                      ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                  }`}>
                                    {inEval2.marginPercent}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-1 text-[10px]">
                                  <span className="font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">T3 ≥</span>
                                  <input
                                    type="number"
                                    min={3}
                                    value={inlineTierForm.tier3MinQty}
                                    onChange={(e) => setInlineTierForm((prev) => ({ ...prev, tier3MinQty: Number(e.target.value) || 3 }))}
                                    className={`w-10 px-1 py-0.5 rounded border text-center font-bold text-[11px] ${
                                      isLight ? 'bg-white border-emerald-400 text-slate-900' : 'bg-[#161b22] border-emerald-500/40 text-emerald-300'
                                    }`}
                                    title="Min Qty Tier 3"
                                  />
                                  <input
                                    type="number"
                                    min={0}
                                    value={inlineTierForm.tier3Price}
                                    onChange={(e) => setInlineTierForm((prev) => ({ ...prev, tier3Price: Number(e.target.value) || 0 }))}
                                    className={`w-22 px-1.5 py-0.5 rounded border text-right font-bold text-[11px] ${
                                      inEval3.isBelowFloor
                                        ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-300'
                                        : isLight ? 'bg-white border-emerald-400 text-slate-900' : 'bg-[#161b22] border-emerald-500/40 text-emerald-300'
                                    }`}
                                    title="Harga Tier 3"
                                  />
                                  <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${
                                    inEval3.isBelowFloor
                                      ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  }`}>
                                    {inEval3.marginPercent}%
                                  </span>
                                </div>

                                {inHasViolation && (
                                  <div className={`p-1.5 rounded-lg border text-[9px] space-y-1 ${
                                    isLight ? 'bg-rose-100 border-rose-300 text-rose-900' : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                                  }`}>
                                    <div className="font-bold flex items-center gap-1">
                                      <ShieldAlert className="w-3 h-3 shrink-0 text-rose-500" />
                                      <span>
                                        {inEval3.isBelowHpp
                                          ? `Tier 3 di bawah HPP (Rp ${rowHpp.toLocaleString('id-ID')})!`
                                          : `Margin Tier < ${MIN_SAFE_MARGIN_PERCENT}% (Min. Aman Rp ${inEval3.minSafePrice.toLocaleString('id-ID')})`}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setInlineTierForm((prev) => ({
                                            ...prev,
                                            sellPrice: Math.max(prev.sellPrice, getMinSafeSellingPrice(rowHpp, 10)),
                                            tier2Price: Math.max(prev.tier2Price, getMinSafeSellingPrice(rowHpp, 6)),
                                            tier3Price: Math.max(prev.tier3Price, inEval3.minSafePrice),
                                          }))
                                        }
                                        className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold cursor-pointer"
                                      >
                                        Set Aman ≥3%
                                      </button>
                                      <label className="flex items-center gap-1 cursor-pointer font-bold">
                                        <input
                                          type="checkbox"
                                          checked={inlineMarginAuthorized}
                                          onChange={(e) => setInlineMarginAuthorized(e.target.checked)}
                                          className="accent-rose-600"
                                        />
                                        <span>Otorisasi</span>
                                      </label>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-end gap-1 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInlineTierEditId(null);
                                      setInlineMarginAuthorized(false);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                      isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-700 text-slate-200'
                                    }`}
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isInlineLocked}
                                    onClick={() => handleSaveInlineTierEdit(m)}
                                    className={`px-2 py-0.5 rounded text-white text-[10px] font-bold transition ${
                                      isInlineLocked
                                        ? 'bg-rose-400/50 cursor-not-allowed opacity-60'
                                        : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'
                                    }`}
                                  >
                                    {isInlineLocked ? '🔒 Terkunci' : 'Simpan'}
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-1">
                              <div className="flex items-center justify-end gap-1.5">
                                <span className={`text-[9px] px-1 py-0.5 rounded border font-bold ${
                                  isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}>
                                  T1 (1+)
                                </span>
                                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                  Rp {tierCfg.tier1Price.toLocaleString('id-ID')}
                                </span>
                                <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                  viewEval1.isBelowFloor
                                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                                    : isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                                }`}>
                                  {viewEval1.marginPercent}%
                                </span>
                              </div>
                              <div className="flex items-center justify-end gap-1.5 text-[10px]">
                                <span className={`text-[9px] px-1 py-0.2 rounded border font-bold ${
                                  isLight ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                }`}>
                                  Tukang ≥{tierCfg.tier2MinQty}
                                </span>
                                <span className={`font-bold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                                  Rp {tierCfg.tier2Price.toLocaleString('id-ID')}
                                </span>
                                <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                  viewEval2.isBelowFloor
                                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                                    : isLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-500/15 text-amber-300'
                                }`}>
                                  {viewEval2.marginPercent}%
                                </span>
                              </div>
                              <div className="flex items-center justify-end gap-1.5 text-[10px]">
                                <span className={`text-[9px] px-1 py-0.2 rounded border font-bold ${
                                  viewEval3.isBelowFloor
                                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                                    : isLight ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                }`}>
                                  Kontraktor ≥{tierCfg.tier3MinQty}
                                </span>
                                <span className={`font-bold ${
                                  viewEval3.isBelowFloor
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : isLight ? 'text-emerald-800' : 'text-emerald-400'
                                }`}>
                                  Rp {tierCfg.tier3Price.toLocaleString('id-ID')}
                                </span>
                                <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                  viewEval3.isBelowFloor
                                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40'
                                    : isLight ? 'bg-emerald-100 text-emerald-900' : 'bg-emerald-500/15 text-emerald-300'
                                }`}>
                                  {viewEval3.marginPercent}%
                                </span>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleStartInlineTierEdit(m)}
                                  className={`text-[9px] font-bold underline cursor-pointer ${
                                    isLight ? 'text-indigo-700 hover:text-indigo-900' : 'text-indigo-400 hover:text-indigo-300'
                                  }`}
                                >
                                  Ubah Tier Inline
                                </button>
                              </div>
                              {isBulk && m.bulkFleetTiers && m.bulkFleetTiers.length > 0 && (
                                <div className="text-[10px] text-amber-700 dark:text-amber-300/90 font-mono">
                                  {m.bulkFleetTiers
                                    .filter((f) => f.isActive)
                                    .map((f) => `${f.suffix.replace('-', '')}: ${(f.price / 1000).toLocaleString('id-ID')}k`)
                                    .join(' | ')}
                                </div>
                              )}
                              {m.isWeightFraction && m.weightFractionConfig && (
                                <div className="text-[10px] text-purple-700 dark:text-purple-300/90 font-mono">
                                  {m.weightFractionConfig.fractions
                                    .filter((fr) => fr.isActive && fr.fractionKg < 1)
                                    .map((fr) => `${fr.name.split(' ')[0]}: Rp ${(fr.price / 1000).toLocaleString('id-ID')}k`)
                                    .join(' • ')}
                                </div>
                              )}
                              {m.priceSecondary && !isBulk && !m.isWeightFraction && (
                                <div className="text-[10px] text-amber-700 dark:text-amber-400">
                                  (Ecer {m.unitSecondary}: Rp {m.priceSecondary.toLocaleString('id-ID')})
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Delivery Policy */}
                      <td className="py-2.5 px-3">
                        <div className="space-y-0.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                              isInclude
                                ? 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30'
                                : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700'
                            }`}
                          >
                            {isInclude ? '✓ Free Antar (Frangko)' : 'Loco (Ambil Sendiri)'}
                          </span>
                          {m.defaultLoadingFee ? (
                            <div className="text-[10px] text-slate-600 dark:text-gray-400 font-mono">
                              Kuli: +Rp {m.defaultLoadingFee.toLocaleString('id-ID')}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1 rounded-lg text-indigo-400 hover:bg-indigo-500/20 border border-transparent hover:border-indigo-500/30 transition cursor-pointer"
                            title="Edit Material"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(m.id, m.name)}
                            className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 transition cursor-pointer"
                            title="Hapus Material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah / Edit Material Fleksibel */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-start justify-center pt-6 px-3 pb-6 sm:px-4 overflow-y-auto">
          <div
            className={`w-full max-w-2xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-3rem)] ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900'
                : 'bg-[#161b22] border-[#30363d] text-slate-100'
            }`}
          >
            {/* Header Terkunci (Sticky Top) */}
            <div
              className={`sticky top-0 z-10 shrink-0 px-5 py-4 border-b flex items-center justify-between ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#12161f] border-[#30363d] text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                    isLight
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                      : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                  }`}
                >
                  <HardHat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {editingMaterial ? 'Edit Material Bangunan' : 'Tambah Material Bangunan Fleksibel'}
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                    Form input material curah, kayu dimensi custom, semen &amp; tarif ongkir armada
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveMaterial} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Barcode Scanner Full-Width Paling Atas (Posisi 1) */}
              <div
                className={`p-3.5 rounded-xl border space-y-1.5 ${
                  isLight ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-amber-500/10 border-amber-500/40'
                }`}
              >
                <label
                  className={`block text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                    isLight ? 'text-amber-900' : 'text-amber-400'
                  }`}
                >
                  <span>1. Barcode / SKU Scanner Material (Auto-Fill Atas) *</span>
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBarcode(val);
                    const found = products.find(p => p.id === val || p.barcode === val);
                    if (found) {
                      setName(found.name);
                      setBrand(found.brand || 'Lokal / Standar');
                      setSellPrice(found.sell_price || 0);
                      setCostPrice(found.cost_price || 0);
                      setStock(found.stock ?? 100);
                      showToast(`Auto-fill material: ${found.name}`);
                    }
                  }}
                  placeholder="Scan barcode atau ketik kode material depot..."
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-mono font-bold outline-none ${
                    isLight ? 'bg-white border-amber-400 text-slate-900' : 'bg-[#0d1117] border-amber-500 text-amber-200'
                  }`}
                />
              </div>

              {/* Row 1: Nama & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className={`font-bold block mb-1 ${isLight ? 'text-slate-900' : 'text-gray-300'}`}>
                    Nama Barang Material <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pasir Pasang Hitam, Semen Gresik 40kg, Kayu Kaso 4x6"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-500 font-medium ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`font-bold block mb-1 ${isLight ? 'text-slate-900' : 'text-gray-300'}`}>
                    Brand / Produsen
                  </label>
                  <input
                    type="text"
                    placeholder="Tambang Lokal / Wavin / Holcim"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-500 font-medium ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Row 2: Kategori & Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`font-bold block mb-1 ${isLight ? 'text-slate-900' : 'text-gray-300'}`}>
                    Kategori Material
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setCategory(newCat);
                      if (newCat === 'PASIR_BATU_SEMEN') {
                        setMaterialNature('BULK_CURAH');
                        setUnit('Ret Pick-up');
                      } else if (newCat === 'KAYU_PAPAN') {
                        setMaterialNature('DIMENSION_CUSTOM');
                        setUnit('Lembar');
                      } else if (newCat === 'PAKU_KAWAT_BAUT' || newCat === 'ALAT_PERTUKANGAN') {
                        setIsWeightFraction(true);
                        setUnit('Kg');
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-500 font-medium cursor-pointer ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  >
                    <option value="PASIR_BATU_SEMEN">Pasir, Batu &amp; Semen (Curah)</option>
                    <option value="BATA_BATAKO">Bata Merah, Batako &amp; Hebel</option>
                    <option value="KAYU_PAPAN">Kayu, Balok, Kaso &amp; Triplek</option>
                    <option value="PERPIPAAN">Perpipaan &amp; Fitting PVC</option>
                    <option value="BESI_BAJA">Besi Beton, Wiremesh &amp; Baja Ringan</option>
                    <option value="PAKU_KAWAT_BAUT">Paku, Kawat, Baut &amp; Sekrup</option>
                    <option value="CAT_FINISHING">Cat &amp; Bahan Finishing</option>
                    <option value="KELISTRIKAN">Kabel &amp; Perlengkapan Listrik</option>
                    <option value="ALAT_PERTUKANGAN">Alat &amp; Perkakas Tukang</option>
                  </select>
                </div>
                <div>
                  <label className={`font-bold block mb-1 ${isLight ? 'text-slate-900' : 'text-gray-300'}`}>
                    Kode / Barcode PLU
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="DEP-CURAH-XXXXX / Barcode EAN"
                      className={`flex-1 min-w-0 px-3 py-2 rounded-xl border font-mono focus:outline-none focus:border-indigo-500 font-bold ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleAutoGenerateBarcode('DEPO')}
                      className={`shrink-0 px-2.5 py-2 rounded-xl border text-[10px] sm:text-xs font-bold flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-xs whitespace-nowrap ${
                        isLight
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-400'
                          : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                      }`}
                      title="Generate Barcode Prefix Kategori (DEP-CURAH / DEP-PAKU / DEP-KAYU)"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                      <span>Generate Depo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoGenerateBarcode('NUMERIC_8')}
                      className={`shrink-0 px-2 py-2 rounded-xl border text-[10px] font-bold flex items-center gap-0.5 cursor-pointer transition active:scale-95 shadow-xs whitespace-nowrap ${
                        isLight
                          ? 'bg-purple-100 hover:bg-purple-200 text-purple-950 border-purple-400'
                          : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/40'
                      }`}
                      title="Generate Angka EAN-13 / PLU Internal 8-Digit Unik"
                    >
                      <span>8-Digit</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 3: Opsi Tipe Material (Nature) */}
              <div
                className={`p-3 rounded-xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-indigo-300' : 'bg-[#0d1117] border-indigo-500/30'
                }`}
              >
                <label className={`font-bold block ${isLight ? 'text-indigo-950' : 'text-indigo-300'}`}>
                  Pilih Karakter &amp; Tipe Material:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMaterialNature('BULK_CURAH');
                      setUnit('Ret Pick-up');
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                      materialNature === 'BULK_CURAH'
                        ? isLight
                          ? 'bg-amber-100 border-amber-500 text-slate-900'
                          : 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : isLight
                        ? 'bg-white border-slate-300 text-slate-800 hover:border-indigo-400'
                        : 'bg-[#161b22] border-[#30363d] text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span>🚛</span>
                      <span>Curah / Volume</span>
                    </div>
                    <div className="text-[10px] mt-0.5 opacity-80">
                      Pasir, batu split, tanah (Ret Pick-up/Truk/m³)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMaterialNature('DIMENSION_CUSTOM');
                      setUnit('Lembar');
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                      materialNature === 'DIMENSION_CUSTOM'
                        ? isLight
                          ? 'bg-emerald-100 border-emerald-500 text-slate-900'
                          : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : isLight
                        ? 'bg-white border-slate-300 text-slate-800 hover:border-indigo-400'
                        : 'bg-[#161b22] border-[#30363d] text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span>🪵</span>
                      <span>Kayu Custom Dimensi</span>
                    </div>
                    <div className="text-[10px] mt-0.5 opacity-80">
                      Papan cor, kaso, balok dengan PxLxT
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMaterialNature('MANUFACTURED');
                      setUnit('Pcs');
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                      materialNature === 'MANUFACTURED'
                        ? isLight
                          ? 'bg-blue-100 border-blue-500 text-slate-900'
                          : 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : isLight
                        ? 'bg-white border-slate-300 text-slate-800 hover:border-indigo-400'
                        : 'bg-[#161b22] border-[#30363d] text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span>🧱</span>
                      <span>Pabrikan / Standar</span>
                    </div>
                    <div className="text-[10px] mt-0.5 opacity-80">
                      Semen sak, bata, hebel, pipa batang
                    </div>
                  </button>
                </div>
              </div>

              {/* Sub-form Multi-Armada Material Curah */}
              {materialNature === 'BULK_CURAH' && (
                <div
                  className={`p-3.5 rounded-xl border space-y-2.5 ${
                    isLight
                      ? 'bg-amber-50 border-amber-300 text-slate-900'
                      : 'bg-amber-950/20 border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`font-bold flex items-center gap-1.5 ${
                        isLight ? 'text-slate-900' : 'text-amber-400'
                      }`}
                    >
                      <Truck className={`w-4 h-4 shrink-0 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                      <span>Skema Multi-Armada Curah (Harga &amp; Estimasi Volume m³):</span>
                    </div>
                    <span className={`text-[10px] font-mono font-semibold ${isLight ? 'text-amber-900' : 'text-amber-400/80'}`}>
                      Kode Suffix Otomatis
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {fleetTiers.map((fleet, idx) => (
                      <div
                        key={`fleet-tier-${fleet.id}-${idx}`}
                        className={`p-2.5 rounded-xl border transition ${
                          fleet.isActive
                            ? isLight
                              ? 'bg-white border-amber-400 text-slate-900 shadow-xs'
                              : 'bg-[#161b22] border-amber-500/40 text-white'
                            : isLight
                            ? 'bg-slate-100 border-slate-300 text-slate-700 opacity-75'
                            : 'bg-[#0d1117] border-[#30363d] text-gray-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fleet.isActive}
                              onChange={(e) => {
                                const updated = [...fleetTiers];
                                updated[idx].isActive = e.target.checked;
                                setFleetTiers(updated);
                              }}
                              className="accent-amber-600 rounded cursor-pointer w-3.5 h-3.5"
                            />
                            <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {fleet.name}
                            </span>
                          </label>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              isLight
                                ? 'bg-amber-100 text-amber-950 border-amber-400'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {fleet.suffix}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 items-center">
                          <div className={`text-[10px] font-mono ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                            Volume:{' '}
                            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-amber-300'}`}>
                              ±{fleet.volumeM3} m³
                            </span>
                          </div>
                          <div className="relative">
                            <span
                              className={`absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono ${
                                isLight ? 'text-slate-600' : 'text-gray-400'
                              }`}
                            >
                              Rp
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={fleet.price}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                const updated = [...fleetTiers];
                                updated[idx].price = val;
                                setFleetTiers(updated);
                                if (fleet.id === 'PICKUP_RET') {
                                  setSellPrice(val);
                                }
                              }}
                              className={`w-full pl-7 pr-2 py-1 rounded-lg border text-xs font-mono font-bold text-right focus:outline-none ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                                  : 'bg-[#0d1117] border-[#30363d] text-amber-300 focus:border-amber-400'
                              }`}
                              placeholder="Harga"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-form Kayu Custom Dimensi */}
              {materialNature === 'DIMENSION_CUSTOM' && (
                <div
                  className={`p-3 rounded-xl border space-y-2 ${
                    isLight ? 'bg-emerald-50 border-emerald-300 text-slate-900' : 'bg-emerald-950/20 border-emerald-500/40'
                  }`}
                >
                  <div className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-emerald-950' : 'text-emerald-400'}`}>
                    <Ruler className="w-4 h-4" />
                    <span>Spesifikasi Dimensi Kayu:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className={`text-[10px] block mb-0.5 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        Panjang (cm)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={lengthCm}
                        onChange={(e) => setLengthCm(Number(e.target.value) || 0)}
                        className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-center ${
                          isLight ? 'bg-white border-emerald-400 text-slate-900' : 'bg-[#0d1117] border-emerald-500/40 text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] block mb-0.5 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        Lebar (cm)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={widthCm}
                        onChange={(e) => setWidthCm(Number(e.target.value) || 0)}
                        className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-center ${
                          isLight ? 'bg-white border-emerald-400 text-slate-900' : 'bg-[#0d1117] border-emerald-500/40 text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] block mb-0.5 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        Tebal (mm)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={thicknessMm}
                        onChange={(e) => setThicknessMm(Number(e.target.value) || 0)}
                        className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-center ${
                          isLight ? 'bg-white border-emerald-400 text-slate-900' : 'bg-[#0d1117] border-emerald-500/40 text-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Row 4: Satuan Utama & Stok */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`font-bold block mb-1 ${isLight ? 'text-slate-900' : 'text-gray-300'}`}>
                    Satuan Volume / Armada <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ret Pick-up / Truk / m³ / Sak / Lembar / Batang"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-500 font-medium ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`font-bold block mb-1 ${isLight ? 'text-slate-900' : 'text-gray-300'}`}>
                    Stok Fisik Awal
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`font-bold block mb-1 ${isLight ? 'text-slate-900' : 'text-gray-300'}`}>
                    Min. Pemesanan
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={minOrderQty}
                    onChange={(e) => setMinOrderQty(Number(e.target.value) || 1)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Row 5: Harga Jual (Tier 1 Eceran) & HPP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`font-bold block mb-1 ${isLight ? 'text-slate-900' : 'text-gray-300'}`}>
                    Harga Pokok (HPP / Beli)
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                      Rp
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={costPrice}
                      onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
                      className={`w-full pl-10 pr-3 py-2 rounded-xl border font-mono font-bold ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`font-bold block mb-1 ${isLight ? 'text-slate-900' : 'text-gray-300'}`}>
                    Harga Tier 1 — Eceran Umum (Qty 1+) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span
                      className={`absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold ${
                        isLight ? 'text-emerald-700' : 'text-emerald-400'
                      }`}
                    >
                      Rp
                    </span>
                    <input
                      type="number"
                      min={0}
                      required
                      value={sellPrice}
                      onChange={(e) => setSellPrice(Number(e.target.value) || 0)}
                      className={`w-full pl-10 pr-3 py-2 rounded-xl border font-mono font-bold ${
                        isLight
                          ? 'bg-white border-emerald-500 text-emerald-800'
                          : 'bg-[#0d1117] border-emerald-500/50 text-emerald-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Row 5B: Skema 3 Tingkat Harga Otomatis (Eceran, Tukang, Kontraktor) */}
              <div
                className={`p-3.5 rounded-xl border space-y-3 ${
                  isLight
                    ? 'bg-sky-50 border-sky-300 text-slate-900'
                    : 'bg-[#0d1117] border-cyan-500/35 text-slate-100'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-indigo-950' : 'text-cyan-300'}`}>
                      <TrendingUp className={`w-4 h-4 shrink-0 ${isLight ? 'text-indigo-700' : 'text-cyan-400'}`} />
                      <span>Skema 3 Tingkat Harga Otomatis (Tier Qty &amp; Kontraktor)</span>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                      Harga otomatis turun saat kasir menaikkan Qty di POS atau saat Mode Pelanggan Kontraktor aktif
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoCalcTiers(sellPrice)}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold cursor-pointer transition ${
                      isLight
                        ? 'bg-white hover:bg-indigo-50 border-indigo-300 text-indigo-800'
                        : 'bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/40 text-indigo-300'
                    }`}
                  >
                    Auto Hitung T2 (-5%) &amp; T3 (-12%)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Tier 1 */}
                  <div className={`p-2.5 rounded-xl border space-y-1.5 ${
                    modalTier1Eval.isBelowFloor
                      ? isLight ? 'bg-rose-50 border-rose-400' : 'bg-rose-950/25 border-rose-500/50'
                      : isLight ? 'bg-white border-slate-300' : 'bg-[#161b22] border-[#30363d]'
                  }`}>
                    <div className="flex items-center justify-between gap-1">
                      <div className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Tier 1 • Eceran Umum
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                        modalTier1Eval.isBelowFloor
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/40'
                          : isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}>
                        Margin {modalTier1Eval.marginPercent}%
                      </span>
                    </div>
                    <div className={`text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                      Syarat: Qty mulai 1 {unit || 'Unit'}
                    </div>
                    <div className={`text-sm font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Rp {sellPrice.toLocaleString('id-ID')}
                    </div>
                    <div className={`text-[9px] font-mono ${
                      modalTier1Eval.profitPerUnit >= 0
                        ? isLight ? 'text-emerald-700' : 'text-emerald-400'
                        : 'text-rose-500 font-bold'
                    }`}>
                      Laba/unit: {modalTier1Eval.profitPerUnit >= 0 ? '+' : ''}Rp {modalTier1Eval.profitPerUnit.toLocaleString('id-ID')}
                    </div>
                  </div>

                  {/* Tier 2 */}
                  <div className={`p-2.5 rounded-xl border space-y-1.5 ${
                    modalTier2Eval.isBelowFloor
                      ? isLight ? 'bg-rose-50 border-rose-400' : 'bg-rose-950/25 border-rose-500/50'
                      : isLight ? 'bg-amber-50/90 border-amber-300' : 'bg-amber-500/10 border-amber-500/35'
                  }`}>
                    <div className="flex items-center justify-between gap-1">
                      <div className={`text-[11px] font-bold ${isLight ? 'text-amber-950' : 'text-amber-300'}`}>
                        Tier 2 • Tukang / Partai
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                        modalTier2Eval.isBelowFloor
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/40'
                          : isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/35'
                      }`}>
                        Margin {modalTier2Eval.marginPercent}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className={`text-[9px] font-bold block mb-0.5 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                          Min. Qty ({unit || 'Unit'})
                        </label>
                        <input
                          type="number"
                          min={2}
                          value={tier2MinQty}
                          onChange={(e) => setTier2MinQty(Number(e.target.value) || 2)}
                          className={`w-full px-2 py-1 rounded-lg border font-mono font-bold text-center text-xs ${
                            isLight ? 'bg-white border-amber-400 text-slate-900' : 'bg-[#0d1117] border-amber-500/40 text-amber-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`text-[9px] font-bold block mb-0.5 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                          Harga Tier 2 (Rp)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={tier2Price}
                          onChange={(e) => setTier2Price(Number(e.target.value) || 0)}
                          className={`w-full px-2 py-1 rounded-lg border font-mono font-bold text-right text-xs ${
                            modalTier2Eval.isBelowFloor
                              ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-300'
                              : isLight ? 'bg-white border-amber-400 text-slate-900' : 'bg-[#0d1117] border-amber-500/40 text-amber-300'
                          }`}
                        />
                      </div>
                    </div>
                    <div className={`text-[9px] font-mono ${
                      modalTier2Eval.profitPerUnit >= 0
                        ? isLight ? 'text-amber-900' : 'text-amber-300/90'
                        : 'text-rose-500 font-bold'
                    }`}>
                      Laba/unit: {modalTier2Eval.profitPerUnit >= 0 ? '+' : ''}Rp {modalTier2Eval.profitPerUnit.toLocaleString('id-ID')}
                    </div>
                  </div>

                  {/* Tier 3 */}
                  <div className={`p-2.5 rounded-xl border space-y-1.5 ${
                    modalTier3Eval.isBelowFloor
                      ? isLight ? 'bg-rose-50 border-rose-500' : 'bg-rose-950/30 border-rose-500/60'
                      : isLight ? 'bg-emerald-50/90 border-emerald-400' : 'bg-emerald-500/10 border-emerald-500/35'
                  }`}>
                    <div className="flex items-center justify-between gap-1">
                      <div className={`text-[11px] font-bold ${
                        modalTier3Eval.isBelowFloor
                          ? 'text-rose-600 dark:text-rose-300'
                          : isLight ? 'text-emerald-950' : 'text-emerald-300'
                      }`}>
                        Tier 3 • Kontraktor
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                        modalTier3Eval.isBelowFloor
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/40'
                          : isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35'
                      }`}>
                        Margin {modalTier3Eval.marginPercent}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className={`text-[9px] font-bold block mb-0.5 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                          Min. Qty ({unit || 'Unit'})
                        </label>
                        <input
                          type="number"
                          min={3}
                          value={tier3MinQty}
                          onChange={(e) => setTier3MinQty(Number(e.target.value) || 3)}
                          className={`w-full px-2 py-1 rounded-lg border font-mono font-bold text-center text-xs ${
                            isLight ? 'bg-white border-emerald-400 text-slate-900' : 'bg-[#0d1117] border-emerald-500/40 text-emerald-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`text-[9px] font-bold block mb-0.5 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                          Harga Tier 3 (Rp)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={tier3Price}
                          onChange={(e) => setTier3Price(Number(e.target.value) || 0)}
                          className={`w-full px-2 py-1 rounded-lg border font-mono font-bold text-right text-xs ${
                            modalTier3Eval.isBelowFloor
                              ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-300'
                              : isLight ? 'bg-white border-emerald-400 text-slate-900' : 'bg-[#0d1117] border-emerald-500/40 text-emerald-300'
                          }`}
                        />
                      </div>
                    </div>
                    <div className={`text-[9px] font-mono ${
                      modalTier3Eval.profitPerUnit >= 0 && !modalTier3Eval.isBelowFloor
                        ? isLight ? 'text-emerald-800' : 'text-emerald-300/90'
                        : 'text-rose-500 font-bold'
                    }`}>
                      Laba/unit: {modalTier3Eval.profitPerUnit >= 0 ? '+' : ''}Rp {modalTier3Eval.profitPerUnit.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* Margin Floor Guard Warning Banner (ketika Harga Tier < HPP atau Margin < 3%) */}
                {modalHasFloorViolation && (
                  <div
                    className={`p-3 rounded-xl border space-y-2 ${
                      isLight
                        ? 'bg-rose-50 border-rose-400 text-rose-950'
                        : 'bg-rose-950/35 border-rose-500/60 text-rose-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs">
                            MARGIN FLOOR GUARD AKTIF — Penyimpanan Dikunci!
                          </div>
                          <p className="text-[11px] mt-0.5">
                            {modalTier3Eval.isBelowHpp
                              ? `Harga Tier 3 (Rp ${tier3Price.toLocaleString('id-ID')}) jatuh di bawah HPP (Rp ${costPrice.toLocaleString('id-ID')}).`
                              : `Margin kotor Tier 3 (${modalTier3Eval.marginPercent}%) di bawah batas aman ${MIN_SAFE_MARGIN_PERCENT}% (Min. Harga Aman: Rp ${modalTier3Eval.minSafePrice.toLocaleString('id-ID')}).`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAdjustModalToSafeMargin}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer shrink-0"
                      >
                        Sesuaikan ke Batas Aman (≥{MIN_SAFE_MARGIN_PERCENT}%)
                      </button>
                    </div>
                    <label className="flex items-center gap-2 pt-1 border-t border-rose-400/30 cursor-pointer text-[11px] font-semibold">
                      <input
                        type="checkbox"
                        checked={marginGuardAuthorized}
                        onChange={(e) => setMarginGuardAuthorized(e.target.checked)}
                        className="accent-rose-600 w-3.5 h-3.5 rounded cursor-pointer"
                      />
                      <span>
                        Otorisasi Khusus Direksi / Manager (Buka Kunci &amp; Izinkan Simpan Harga di Bawah Margin {MIN_SAFE_MARGIN_PERCENT}%)
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Row 6: Multi-Satuan Eceran (Optional) */}
              <div
                className={`p-3 rounded-xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className={`font-bold flex items-center gap-2 cursor-pointer ${isLight ? 'text-slate-900' : 'text-gray-200'}`}>
                    <input
                      type="checkbox"
                      checked={hasSecondaryUnit}
                      onChange={(e) => setHasSecondaryUnit(e.target.checked)}
                      className="rounded accent-indigo-500 cursor-pointer w-4 h-4"
                    />
                    <span>Aktifkan Mode Eceran (Multi-Satuan)</span>
                  </label>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                    Contoh: Pipa Batang vs Meter
                  </span>
                </div>

                {hasSecondaryUnit && (
                  <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-[#30363d]'}`}>
                    <div>
                      <label className={`text-[10px] block mb-0.5 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        Satuan Eceran
                      </label>
                      <input
                        type="text"
                        placeholder="Meter / Kg"
                        value={unitSecondary}
                        onChange={(e) => setUnitSecondary(e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-lg border ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] block mb-0.5 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        Harga Eceran (Rp)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={priceSecondary}
                        onChange={(e) => setPriceSecondary(Number(e.target.value) || 0)}
                        className={`w-full px-2.5 py-1.5 rounded-lg border font-mono font-bold ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-amber-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] block mb-0.5 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        Konversi (1 {unit} =)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={conversionRate}
                        onChange={(e) => setConversionRate(Number(e.target.value) || 1)}
                        className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-center ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Row 6B: Produk Satuan Timbang / Fraksi Berat (Paku, Kawat, Baut) */}
              <div
                className={`p-3.5 rounded-xl border space-y-3 ${
                  isLight ? 'bg-purple-50 border-purple-300 text-slate-900' : 'bg-[#0d1117] border-purple-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <label
                    className={`font-bold flex items-center gap-2 cursor-pointer ${
                      isLight ? 'text-indigo-950' : 'text-purple-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isWeightFraction}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsWeightFraction(checked);
                        if (checked) {
                          setUnit('Kg');
                          handleRecalculateFractions(sellPrice > 0 ? sellPrice : 18000);
                        }
                      }}
                      className="rounded accent-purple-500 cursor-pointer w-4 h-4"
                    />
                    <div className="flex items-center gap-1.5">
                      <Scale className={`w-4 h-4 ${isLight ? 'text-purple-700' : 'text-purple-400'}`} />
                      <span>Produk Satuan Timbang / Fraksi Berat (Paku, Kawat, Baut)</span>
                    </div>
                  </label>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-purple-900 font-semibold' : 'text-purple-400/80'}`}>
                    1/4 Kg, 1/2 Kg, 1 Ons
                  </span>
                </div>

                {isWeightFraction && (
                  <div className={`space-y-3 pt-2 border-t ${isLight ? 'border-purple-200' : 'border-purple-500/20'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className={`text-[10px] font-semibold block mb-1 ${isLight ? 'text-slate-900' : 'text-gray-300'}`}>
                          Satuan Induk Stok Gudang
                        </label>
                        <select
                          value={weightBaseUnit}
                          onChange={(e) => {
                            const val = e.target.value as 'Kg' | 'Dus';
                            setWeightBaseUnit(val);
                            setUnit(val);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg border font-medium cursor-pointer ${
                            isLight ? 'bg-white border-purple-300 text-slate-900' : 'bg-[#161b22] border-purple-500/40 text-white'
                          }`}
                        >
                          <option value="Kg">Kilogram (Kg)</option>
                          <option value="Dus">Dus / Box (10 Kg)</option>
                        </select>
                      </div>

                      {weightBaseUnit === 'Dus' && (
                        <div>
                          <label className={`text-[10px] font-semibold block mb-1 ${isLight ? 'text-slate-900' : 'text-gray-300'}`}>
                            Berat Isi per Dus (Kg)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={dusWeightKg}
                            onChange={(e) => setDusWeightKg(Number(e.target.value) || 1)}
                            className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                              isLight ? 'bg-white border-purple-300 text-slate-900' : 'bg-[#161b22] border-purple-500/40 text-white'
                            }`}
                          />
                        </div>
                      )}

                      <div>
                        <label className={`text-[10px] font-semibold block mb-1 ${isLight ? 'text-slate-900' : 'text-gray-300'}`}>
                          Margin Plastik/Bungkus (Rp)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={packagingFee}
                          onChange={(e) => {
                            const fee = Number(e.target.value) || 0;
                            setPackagingFee(fee);
                            handleRecalculateFractions(sellPrice, fee);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg border font-mono font-bold ${
                            isLight ? 'bg-white border-purple-300 text-slate-900' : 'bg-[#161b22] border-purple-500/40 text-amber-300'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Quick Fraction Tiers Configuration */}
                    <div
                      className={`p-2.5 rounded-lg border space-y-2 ${
                        isLight ? 'bg-white border-purple-200' : 'bg-[#161b22] border-[#30363d]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-gray-300'}`}>
                          Konversi Cepat di Kasir &amp; Penetapan Harga Fraksi:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRecalculateFractions(sellPrice, packagingFee)}
                          className={`text-[10px] flex items-center gap-1 font-bold cursor-pointer ${
                            isLight ? 'text-purple-800 hover:text-purple-950' : 'text-purple-400 hover:text-purple-300'
                          }`}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Hitung Rasio Otomatis</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {fractionTiers.map((tier, idx) => (
                          <div
                            key={`frac-tier-item-${tier.id}-${idx}`}
                            className={`p-2 rounded-lg border transition ${
                              tier.isActive
                                ? isLight
                                  ? 'bg-purple-50 border-purple-300 text-slate-900'
                                  : 'bg-purple-950/20 border-purple-500/40 text-white'
                                : isLight
                                ? 'bg-slate-100 border-slate-300 text-slate-600 opacity-75'
                                : 'bg-[#0d1117] border-[#30363d] text-gray-500 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`font-bold text-xs ${isLight ? 'text-indigo-950' : 'text-purple-300'}`}>
                                {tier.name}
                              </span>
                              <input
                                type="checkbox"
                                checked={tier.isActive}
                                onChange={(e) => {
                                  const updated = [...fractionTiers];
                                  updated[idx].isActive = e.target.checked;
                                  setFractionTiers(updated);
                                }}
                                className="accent-purple-500 rounded cursor-pointer"
                              />
                            </div>
                            <div className={`text-[9px] font-mono mb-1 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                              Rasio: {tier.fractionKg} Kg
                            </div>
                            <div className="relative">
                              <span
                                className={`absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] ${
                                  isLight ? 'text-slate-600' : 'text-gray-400'
                                }`}
                              >
                                Rp
                              </span>
                              <input
                                type="number"
                                min={0}
                                value={tier.price}
                                onChange={(e) => {
                                  const updated = [...fractionTiers];
                                  updated[idx].price = Number(e.target.value) || 0;
                                  setFractionTiers(updated);
                                }}
                                className={`w-full pl-6 pr-1.5 py-1 rounded border text-xs font-mono font-bold text-right focus:outline-none focus:border-purple-500 ${
                                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-amber-300'
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className={`text-[10px] italic ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        * Kasir dapat memilih fraksi timbang secara instan (1/4 Kg, 1/2 Kg, 1 Ons) dan stok gudang otomatis terpotong desimal.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 7: Kebijakan Antar & Upah Kuli Bongkar */}
              <div
                className={`p-3.5 rounded-xl border space-y-3 ${
                  isLight
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
                    : 'bg-indigo-950/20 border-indigo-500/40'
                }`}
              >
                <div
                  className={`font-bold flex items-center gap-1.5 ${
                    isLight ? 'text-indigo-950' : 'text-indigo-300'
                  }`}
                >
                  <Truck className={`w-4 h-4 shrink-0 ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`} />
                  <span>Kebijakan Pengiriman &amp; Biaya Bongkar Armada Toko:</span>
                </div>

                <div className="space-y-2">
                  <label className={`flex items-center gap-2 cursor-pointer ${isLight ? 'text-slate-900' : 'text-gray-200'}`}>
                    <input
                      type="radio"
                      name="deliveryPolicy"
                      checked={deliveryPricingPolicy === 'INCLUDE_ONGKIR'}
                      onChange={() => setDeliveryPricingPolicy('INCLUDE_ONGKIR')}
                      className="accent-indigo-600 w-4 h-4"
                    />
                    <div>
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Termasuk Antar (Frangko / Free Ongkir Armada)
                      </span>
                      <span className={`text-[10px] block ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        Harga jual sudah meng-cover pengiriman dalam radius kota
                      </span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2 cursor-pointer ${isLight ? 'text-slate-900' : 'text-gray-200'}`}>
                    <input
                      type="radio"
                      name="deliveryPolicy"
                      checked={deliveryPricingPolicy === 'EXCLUDE_ONGKIR'}
                      onChange={() => setDeliveryPricingPolicy('EXCLUDE_ONGKIR')}
                      className="accent-indigo-600 w-4 h-4"
                    />
                    <div>
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Belum Termasuk Antar (Loco Gudang / Ambil Sendiri)
                      </span>
                      <span className={`text-[10px] block ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        Pembeli mengambil di depo atau ongkir ditagihkan terpisah
                      </span>
                    </div>
                  </label>
                </div>

                <div
                  className={`pt-2 border-t flex items-center justify-between gap-3 ${
                    isLight ? 'border-indigo-200' : 'border-indigo-500/30'
                  }`}
                >
                  <label className={`font-semibold ${isLight ? 'text-indigo-950' : 'text-gray-300'}`}>
                    Tambahan Upah Bongkar Kuli per Satuan/Ret (Rp):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={defaultLoadingFee}
                    onChange={(e) => setDefaultLoadingFee(Number(e.target.value) || 0)}
                    className={`w-36 px-3 py-1.5 rounded-lg border font-mono font-bold text-right ${
                      isLight
                        ? 'bg-white border-indigo-400 text-slate-900'
                        : 'bg-[#0d1117] border-indigo-500/50 text-amber-300'
                    }`}
                  />
                </div>
              </div>

              {/* Footer */}
              <div
                className={`flex items-center justify-end gap-2 pt-2 border-t ${
                  isLight ? 'border-slate-200' : 'border-[#30363d]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-xl font-semibold transition cursor-pointer ${
                    isLight
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalHasFloorViolation && !marginGuardAuthorized}
                  className={`px-5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    modalHasFloorViolation && !marginGuardAuthorized
                      ? 'bg-rose-500/40 text-rose-200 cursor-not-allowed opacity-70'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] cursor-pointer active:scale-95'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {modalHasFloorViolation && !marginGuardAuthorized
                      ? '🔒 Terkunci (Margin < 3% / Di Bawah HPP)'
                      : 'Simpan Material Bangunan'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
