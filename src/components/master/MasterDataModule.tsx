import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BusinessDomainConfig, FashionArticlePromo, FashionVariantCell, Product, ServiceItemFormat } from '../../types';
import { FBMasterModule } from './FBMasterModule';
import { FnbToppingMasterTab } from './FnbToppingMasterTab';
import { ServiceStylistMasterTab } from './ServiceStylistMasterTab';
import { BuildingMaterialsMasterModule } from './BuildingMaterialsMasterModule';
import { QuickBarcodeModal } from './QuickBarcodeModal';
import { BarcodeLabelStudioModal } from './BarcodeLabelStudioModal';
import { SmartMigrationPanel } from './SmartMigrationPanel';
import { FNB_PRODUCTS } from '../../data/fnbData';
import {
  BARBERSHOP_SERVICE_SEEDS,
  LAUNDRY_SERVICE_SEEDS,
  SERVICE_FORMAT_OPTIONS,
  getServiceFormatMeta,
  resolveServiceItemFormat,
  generateNextServiceSku,
  isBarbershopSalonProduct,
  isLaundryCatalogProduct,
  isServiceProductActive,
} from '../../data/serviceData';
import {
  FASHION_APPAREL_PRODUCTS,
  FASHION_STANDARD_COLORS,
  FASHION_STANDARD_SIZES,
  ELECTRONICS_GADGETS_PRODUCTS,
  AUTOMOTIVE_WORKSHOP_PRODUCTS,
  SALON_BARBERSHOP_PRODUCTS,
  LAUNDRY_SERVICE_PRODUCTS,
  LAUNDRY_SLA_OPTIONS,
  buildFashionVariantMatrix,
  sumVariantMatrixStock,
} from '../../data/industryTerminalProducts';
import {
  BUSINESS_MECHANISM_FAMILIES,
  getBusinessModelDefinition,
  getEffectiveBusinessDomainConfig,
  resolveCanonicalSector,
} from '../../utils/businessDomainConfig';

export {
  toTitleCase,
  RETAIL_CATEGORY_DICTIONARY,
  runAISmartMapper,
  parseProductAttributes,
  calculateTierPrices
} from '../../data/retailCategoryDictionary';
import {
  RETAIL_CATEGORY_DICTIONARY,
  calculateTierPrices,
  toTitleCase
} from '../../data/retailCategoryDictionary';

type MasterDataTab =
  | 'catalog'
  | 'categories'
  | 'migration'
  | 'fnb_catalog'
  | 'fb_bom'
  | 'fnb_toppings'
  | 'building'
  | 'specialty_catalog'
  | 'service_stylists';

const NON_RETAIL_MODELS = new Set([
  'fnb',
  'building',
  'fashion',
  'electronics',
  'gadget',
  'workshop',
  'automotive',
  'salon',
  'laundry',
  'service',
  'services',
]);

const NON_RETAIL_ID_PREFIXES = ['ing-', 'raw-', 'fnb-', 'mat-', 'fash-', 'gad-', 'oto-', 'sln-', 'lnd-', 'svc-', 'prd-brb-'];

const getPrimaryTabForSector = (sector: 'FNB' | 'FASHION' | 'BUILDING' | 'SERVICE' | 'RETAIL'): MasterDataTab => {
  switch (sector) {
    case 'FNB':
      return 'fnb_catalog';
    case 'BUILDING':
      return 'building';
    case 'FASHION':
    case 'SERVICE':
      return 'specialty_catalog';
    case 'RETAIL':
    default:
      return 'catalog';
  }
};

export const MasterDataModule: React.FC = () => {
  const {
    products,
    addProduct,
    addProductsBulk,
    updateProduct,
    deleteProduct,
    addAuditLog,
    showToast,
    categoriesMaster,
    brands,
    theme,
    language,
    businessProfile,
    businessDomainConfig,
    activeSector,
    isFnb,
    isFashion,
    isBuilding,
    isService,
    isRetail,
    fnbToppings,
    serviceStylists,
    isMasterCatalogWiped,
  } = useApp();

  const effectiveDomainConfig = useMemo(
    () => (businessProfile ? getEffectiveBusinessDomainConfig(businessProfile) : businessDomainConfig),
    [businessProfile, businessDomainConfig]
  );

  const isHybridMode = Boolean(effectiveDomainConfig.isHybridMultiUnit);
  const mechanismFamily = effectiveDomainConfig.mechanismFamily;
  const primaryModel = effectiveDomainConfig.primaryBusinessModel;
  const activeFamilyMeta = BUSINESS_MECHANISM_FAMILIES[mechanismFamily];
  const activeModelDef = getBusinessModelDefinition(primaryModel);

  const specialtySubKind: 'fashion' | 'electronics' | 'laundry' | 'service' = useMemo(() => {
    if (isFashion) {
      return 'fashion';
    }
    if (isService) {
      if (
        primaryModel === 'LAUNDRY' ||
        String(businessProfile?.category || '').toLowerCase().includes('laundry')
      ) {
        return 'laundry';
      }
      return 'service';
    }
    if (effectiveDomainConfig.subFeatures?.hasSerialImei) {
      return 'electronics';
    }
    return 'fashion';
  }, [isFashion, isService, primaryModel, effectiveDomainConfig.subFeatures, businessProfile?.category]);

  const specialtyTabLabel =
    specialtySubKind === 'fashion'
      ? 'Katalog Varian Ukuran & Warna'
      : specialtySubKind === 'electronics'
      ? 'Katalog Serial & IMEI'
      : specialtySubKind === 'laundry'
      ? 'Katalog Layanan Laundry'
      : 'Katalog Layanan & Jasa';

  const visibleTabs = useMemo<MasterDataTab[]>(() => {
    const base: MasterDataTab[] = [];
    const addSectorTabs = (sec: 'FNB' | 'FASHION' | 'BUILDING' | 'SERVICE' | 'RETAIL') => {
      if (sec === 'RETAIL') {
        ['catalog', 'migration', 'categories'].forEach((t) => {
          if (!base.includes(t as MasterDataTab)) base.push(t as MasterDataTab);
        });
      } else if (sec === 'FNB') {
        ['fnb_catalog', 'fb_bom', 'fnb_toppings'].forEach((t) => {
          if (!base.includes(t as MasterDataTab)) base.push(t as MasterDataTab);
        });
      } else if (sec === 'BUILDING') {
        if (!base.includes('building')) base.push('building');
      } else if (sec === 'FASHION') {
        if (!base.includes('specialty_catalog')) base.push('specialty_catalog');
      } else if (sec === 'SERVICE') {
        if (!base.includes('specialty_catalog')) base.push('specialty_catalog');
        if (!base.includes('service_stylists')) base.push('service_stylists');
      }
    };

    // Selalu dahulukan tab sektor kanonik aktif
    addSectorTabs(activeSector);

    // Hanya tambahkan tab sektor lain bila Mode Hybrid Multi-Unit aktif
    if (isHybridMode) {
      const enabledModels = effectiveDomainConfig.enabledHybridModels || [];
      if (enabledModels.length > 0) {
        enabledModels.forEach((mId) => {
          addSectorTabs(resolveCanonicalSector(mId));
        });
      } else {
        addSectorTabs('RETAIL');
        addSectorTabs('FNB');
        addSectorTabs('BUILDING');
        addSectorTabs('FASHION');
      }
    }

    return base;
  }, [activeSector, isHybridMode, effectiveDomainConfig.enabledHybridModels]);

  // Navigasi Tab Utama (otomatis terkunci ke sektor aktif)
  const [activeTab, setActiveTab] = useState<MasterDataTab>(() =>
    getPrimaryTabForSector(activeSector)
  );

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0] || getPrimaryTabForSector(activeSector));
    }
  }, [visibleTabs, activeTab, activeSector]);

  useEffect(() => {
    setActiveTab(getPrimaryTabForSector(activeSector));
    setEditingId(null);
    setEditForm({});
    setSearchQuery('');
  }, [activeSector, primaryModel]);

  // Filter & Edit Inline Katalog
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryCode, setFilterCategoryCode] = useState<string>('ALL');
  const [specialtyTypeFilter, setSpecialtyTypeFilter] = useState<'ALL' | ServiceItemFormat>('ALL');
  const [laundryUnitFilter, setLaundryUnitFilter] = useState<'ALL' | 'KILOAN' | 'SATUAN' | 'PASANG' | 'LUAS'>('ALL');
  const [fashionFilter, setFashionFilter] = useState<'ALL' | 'CLEARANCE' | 'BUNDLE' | 'LOW_STOCK'>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});

  // Quick-add state khusus F&B Menu & Specialty Service / Laundry / Fashion
  const [isSpecialtyAddOpen, setIsSpecialtyAddOpen] = useState(false);
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecBrand, setNewSpecBrand] = useState('');
  const [newSpecCategory, setNewSpecCategory] = useState('');
  const [newSpecCost, setNewSpecCost] = useState<number>(0);
  const [newSpecSell, setNewSpecSell] = useState<number>(0);
  const [newSpecStock, setNewSpecStock] = useState<number>(10);
  const [newSpecSize, setNewSpecSize] = useState('S, M, L, XL, XXL');
  const [newSpecColor, setNewSpecColor] = useState('Sage, Maroon, Hitam, Cream');
  const [newFashionClearanceActive, setNewFashionClearanceActive] = useState(false);
  const [newFashionClearanceType, setNewFashionClearanceType] = useState<'PERCENT' | 'NOMINAL'>('PERCENT');
  const [newFashionClearanceValue, setNewFashionClearanceValue] = useState<number>(15);
  const [newFashionBundleActive, setNewFashionBundleActive] = useState(false);
  const [newFashionBundleMinQty, setNewFashionBundleMinQty] = useState<number>(2);
  const [newFashionBundleType, setNewFashionBundleType] = useState<'PERCENT' | 'NOMINAL'>('NOMINAL');
  const [newFashionBundleValue, setNewFashionBundleValue] = useState<number>(15000);
  const [newFashionBundleScope, setNewFashionBundleScope] = useState<'SAME_SKU' | 'MIX_MATCH_FASHION'>('MIX_MATCH_FASHION');
  const [newSpecImei, setNewSpecImei] = useState('');
  const [newSpecWarranty, setNewSpecWarranty] = useState('12 Bulan Garansi Resmi');
  const [newSpecServiceFormat, setNewSpecServiceFormat] = useState<ServiceItemFormat>('LAYANAN_SATUAN');
  const [newSpecPackageDetails, setNewSpecPackageDetails] = useState('');
  const [newSpecDuration, setNewSpecDuration] = useState('30 mnt');
  const [newLaundryUnitType, setNewLaundryUnitType] = useState<'KILOAN' | 'SATUAN' | 'PASANG' | 'LUAS'>('KILOAN');
  const [newLaundryUnit, setNewLaundryUnit] = useState<string>('kg');
  const [newLaundryMinOrder, setNewLaundryMinOrder] = useState<number>(2);
  const [newLaundrySla, setNewLaundrySla] = useState<string>('Reguler 48 Jam');

  // State Modal Eksisting & Fashion Modals
  const [showQuickBarcode, setShowQuickBarcode] = useState(false);
  const [labelModalProduct, setLabelModalProduct] = useState<Product | null>(null);
  const [matrixModalProduct, setMatrixModalProduct] = useState<Product | null>(null);
  const [matrixDraftCells, setMatrixDraftCells] = useState<FashionVariantCell[]>([]);
  const [matrixBatchQty, setMatrixBatchQty] = useState<number>(5);
  const [fashionPromoModalProduct, setFashionPromoModalProduct] = useState<Product | null>(null);
  const [fashionPromoDraft, setFashionPromoDraft] = useState<FashionArticlePromo>({
    clearanceActive: false,
    clearanceType: 'PERCENT',
    clearanceValue: 15,
    clearanceLabel: 'Clearance Sale Koleksi',
    bundleActive: false,
    bundleMinQty: 2,
    bundleDiscountType: 'NOMINAL',
    bundleDiscountValue: 20000,
    bundleScope: 'MIX_MATCH_FASHION',
    bundleLabel: 'Beli 2 Lebih Hemat',
  });

  // Katalog Ritel Umum (terisolasi dari menu F&B, bahan baku, material bangunan, & item specialty)
  const retailDomainProducts = useMemo(() => {
    return products.filter((p) => {
      const it = String(p.itemType || '').toUpperCase();
      if (it === 'MENU_FB' || it === 'RAW_MATERIAL' || it === 'SERVICE') return false;
      const bm = String(p.businessModel || '').toLowerCase();
      if (NON_RETAIL_MODELS.has(bm)) return false;
      const idLower = String(p.id || '').toLowerCase();
      if (NON_RETAIL_ID_PREFIXES.some((pref) => idLower.startsWith(pref))) return false;
      const catLower = String(p.category || '').toLowerCase();
      if (catLower.includes('bahan baku') || catLower.includes('bahan mentah')) return false;
      return true;
    });
  }, [products]);

  // Filter Katalog Produk Ritel
  const filteredProducts = useMemo(() => {
    return retailDomainProducts.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.batchNumber || p.batchNo || '').toLowerCase().includes(q) ||
        (p.pharmacyClass || p.drugClass || '').toLowerCase().includes(q) ||
        String(p.categoryCode || '').includes(q);

      const normalizedCode = String(p.categoryCode || 10).replace(/^PC\./i, '');
      const matchCat =
        filterCategoryCode === 'ALL' || normalizedCode === filterCategoryCode;

      return matchQuery && matchCat;
    });
  }, [retailDomainProducts, searchQuery, filterCategoryCode]);

  // Katalog Menu F&B terisolasi (FNB_CULINARY -> Katalog Menu)
  const fnbCatalogMenus = useMemo(() => {
    const fromState = products.filter(
      (p) =>
        p.itemType === 'MENU_FB' ||
        String(p.businessModel || '').toLowerCase() === 'fnb' ||
        String(p.id || '').toUpperCase().startsWith('FNB-')
    );
    const seen = new Set(fromState.map((p) => p.id));
    const merged = [...fromState];
    if (!isMasterCatalogWiped) {
      FNB_PRODUCTS.forEach((fp) => {
        if (!seen.has(fp.id)) merged.push(fp);
      });
    }
    const q = searchQuery.toLowerCase().trim();
    return merged.filter((p) => {
      if (p.itemType === 'RAW_MATERIAL') return false;
      const idLower = String(p.id || '').toLowerCase();
      if (idLower.startsWith('ing-') || idLower.startsWith('raw-')) return false;
      const catLower = String(p.category || '').toLowerCase();
      if (catLower.includes('bahan baku') || catLower.includes('bahan mentah')) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.plu || '').toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q) ||
        catLower.includes(q)
      );
    });
  }, [products, searchQuery, isMasterCatalogWiped]);

  // Katalog Specialty & Service terisolasi (SPECIALTY_SERVICE)
  const specialtyProducts = useMemo(() => {
    const fallbackList =
      specialtySubKind === 'fashion'
        ? FASHION_APPAREL_PRODUCTS
        : specialtySubKind === 'electronics'
        ? ELECTRONICS_GADGETS_PRODUCTS
        : specialtySubKind === 'laundry'
        ? LAUNDRY_SERVICE_SEEDS
        : BARBERSHOP_SERVICE_SEEDS;

    const matchesSpecialty = (p: Product) => {
      const bm = String(p.businessModel || '').toLowerCase();
      const idUpper = String(p.id || '').toUpperCase();
      if (specialtySubKind === 'fashion') {
        return bm === 'fashion' || idUpper.startsWith('FASH-') || Boolean(p.variantSize || p.variantColor);
      }
      if (specialtySubKind === 'electronics') {
        return bm === 'electronics' || bm === 'gadget' || idUpper.startsWith('GAD-') || Boolean(p.imeiSerial || p.warrantyPeriod);
      }
      if (specialtySubKind === 'laundry') {
        return isLaundryCatalogProduct(p);
      }
      return isBarbershopSalonProduct(p);
    };

    const fromState = products.filter(matchesSpecialty);
    const seen = new Set(fromState.map((p) => p.id));
    const merged = [...fromState];
    if (!isMasterCatalogWiped) {
      fallbackList.forEach((fp) => {
        if (!seen.has(fp.id)) merged.push(fp);
      });
    }

    const q = searchQuery.toLowerCase().trim();
    return merged.filter((p) => {
      if (specialtySubKind === 'service' && specialtyTypeFilter !== 'ALL') {
        if (resolveServiceItemFormat(p) !== specialtyTypeFilter) return false;
      }
      if (specialtySubKind === 'laundry' && laundryUnitFilter !== 'ALL') {
        const uType = p.laundryUnitType || (p.unit === 'kg' ? 'KILOAN' : p.unit === 'pasang' ? 'PASANG' : p.unit === 'm2' ? 'LUAS' : 'SATUAN');
        if (uType !== laundryUnitFilter) return false;
      }
      if (specialtySubKind === 'fashion' && fashionFilter !== 'ALL') {
        if (fashionFilter === 'CLEARANCE' && !(p.fashionPromo?.clearanceActive && (p.fashionPromo?.clearanceValue || 0) > 0)) {
          return false;
        }
        if (fashionFilter === 'BUNDLE' && !(p.fashionPromo?.bundleActive && (p.fashionPromo?.bundleDiscountValue || 0) > 0)) {
          return false;
        }
        if (fashionFilter === 'LOW_STOCK') {
          const minThreshold = p.minStock ?? p.min_stock ?? 15;
          const hasLowCell = Boolean(p.variantMatrix?.some((c) => c.stock <= 2));
          if ((p.stock || 0) > minThreshold && !hasLowCell) return false;
        }
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.packageDetails || '').toLowerCase().includes(q) ||
        getServiceFormatMeta(p).label.toLowerCase().includes(q) ||
        (p.slaDuration || '').toLowerCase().includes(q) ||
        (p.unit || '').toLowerCase().includes(q) ||
        (p.imeiSerial || '').toLowerCase().includes(q) ||
        (p.variantSize || '').toLowerCase().includes(q) ||
        (p.variantColor || '').toLowerCase().includes(q) ||
        (p.fashionPromo?.clearanceLabel || '').toLowerCase().includes(q) ||
        (p.fashionPromo?.bundleLabel || '').toLowerCase().includes(q)
      );
    });
  }, [products, specialtySubKind, specialtyTypeFilter, laundryUnitFilter, fashionFilter, searchQuery, businessProfile?.category, isMasterCatalogWiped]);

  // Ekstraksi Daftar Kategori Unik dari Kamus
  const allStandardCategories = useMemo(() => {
    return [...RETAIL_CATEGORY_DICTIONARY].sort((a, b) => a.code - b.code);
  }, []);

  // Format ID Internal Non-Barcode jika produk tidak memiliki barcode pabrikan
  const formatProductBarcodeId = (p: Product): string => {
    const raw = (p.barcode || '').trim();
    if (raw) return raw;
    if (p.id && p.id.startsWith('INT-')) return p.id;
    const suffix = (p.id || '0000').replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase().padStart(4, '0');
    return `INT-${suffix}`;
  };

  const persistProductEdit = (product: Product, updates: Partial<Product>) => {
    const existsInState = products.some((item) => item.id === product.id);
    if (existsInState && updateProduct) {
      updateProduct(product.id, updates);
    } else {
      addProduct({ ...product, ...updates, id: product.id });
    }
  };

  // Simpan Edit Inline Katalog
  const handleSaveInlineEdit = (product: Product) => {
    if (!updateProduct) return;
    const currentCost = product.costPrice ?? product.cost_price ?? product.buy_price ?? 0;
    const currentSell =
      product.sellingPrice ??
      product.sell_price ??
      product.price_retail ??
      product.retailPrice ??
      product.price ??
      0;
    const updatedCost = Number(editForm.costPrice ?? editForm.cost_price ?? currentCost);
    const tiers = calculateTierPrices(updatedCost);
    const updatedSell = Number(
      editForm.sellingPrice ??
        editForm.sell_price ??
        editForm.price_retail ??
        editForm.retailPrice ??
        editForm.price ??
        (currentSell || tiers.retailPrice)
    );
    const selectedCode = Number(editForm.categoryCode ?? product.categoryCode ?? 10);
    const catObj = allStandardCategories.find((c) => c.code === selectedCode);
    const cleanedBarcode =
      editForm.barcode !== undefined
        ? editForm.barcode.trim() || formatProductBarcodeId(product)
        : formatProductBarcodeId(product);
    const cleanedBrand =
      editForm.brand !== undefined
        ? editForm.brand.trim().toUpperCase() || product.brand || 'GENERIC'
        : product.brand || 'GENERIC';

    const nextBatch =
      editForm.batchNumber !== undefined
        ? editForm.batchNumber
        : editForm.batchNo !== undefined
        ? editForm.batchNo
        : product.batchNumber ?? product.batchNo;
    const nextPharmaClass =
      editForm.pharmacyClass !== undefined
        ? editForm.pharmacyClass
        : product.pharmacyClass;

    persistProductEdit(product, {
      ...editForm,
      barcode: cleanedBarcode,
      brand: cleanedBrand,
      name: editForm.name ? toTitleCase(editForm.name) : product.name,
      categoryCode: selectedCode,
      category: catObj ? catObj.name : editForm.category || product.category,
      costPrice: updatedCost,
      cost_price: updatedCost,
      sellingPrice: updatedSell,
      sell_price: updatedSell,
      price_retail: updatedSell,
      retailPrice: updatedSell,
      price: updatedSell,
      memberPrice: Number(editForm.memberPrice ?? tiers.memberPrice),
      price_member: Number(editForm.memberPrice ?? tiers.memberPrice),
      wholesalePrice: Number(editForm.wholesalePrice ?? tiers.wholesalePrice),
      price_wholesale: Number(editForm.wholesalePrice ?? tiers.wholesalePrice),
      batchNumber: nextBatch,
      batchNo: nextBatch,
      pharmacyClass: nextPharmaClass,
      drugClass: nextPharmaClass || product.drugClass,
    });
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveSpecialtyInlineEdit = (product: Product) => {
    const costVal = Number(editForm.costPrice ?? editForm.cost_price ?? product.cost_price ?? 0);
    const sellVal = Number(editForm.sellingPrice ?? editForm.sell_price ?? product.sell_price ?? 0);
    const stockVal = Number(editForm.stock ?? product.stock ?? 0);
    const nextLaundryUnitType = editForm.laundryUnitType ?? product.laundryUnitType;
    const nextMinWeight = Number(editForm.minOrderWeightKg ?? product.minOrderWeightKg ?? (nextLaundryUnitType === 'KILOAN' ? 2 : 1));
    const nextSla = editForm.slaDuration !== undefined ? editForm.slaDuration : product.slaDuration;
    const slaOpt = LAUNDRY_SLA_OPTIONS.find((s) => s.label === nextSla);
    const nextServiceFormat: ServiceItemFormat | undefined =
      specialtySubKind === 'service'
        ? editForm.serviceFormat ?? resolveServiceItemFormat(product)
        : editForm.serviceFormat ?? product.serviceFormat;
    const nextIsRetailSalon = nextServiceFormat === 'PRODUK_RETAIL_SALON';
    const nextPackageDetails =
      editForm.packageDetails !== undefined
        ? editForm.packageDetails.trim() || undefined
        : product.packageDetails;

    persistProductEdit(product, {
      ...editForm,
      name: editForm.name !== undefined ? editForm.name.trim() || product.name : product.name,
      brand: editForm.brand !== undefined ? editForm.brand.trim() || product.brand : product.brand,
      category: editForm.category !== undefined ? editForm.category.trim() || product.category : product.category,
      costPrice: costVal,
      cost_price: costVal,
      hpp: costVal,
      sellingPrice: sellVal,
      sell_price: sellVal,
      price_retail: sellVal,
      retailPrice: sellVal,
      price: sellVal,
      stock: specialtySubKind === 'service' && !nextIsRetailSalon ? 999 : stockVal,
      variantSize: editForm.variantSize !== undefined ? editForm.variantSize : product.variantSize,
      variantColor: editForm.variantColor !== undefined ? editForm.variantColor : product.variantColor,
      imeiSerial: editForm.imeiSerial !== undefined ? editForm.imeiSerial : product.imeiSerial,
      warrantyPeriod: editForm.warrantyPeriod !== undefined ? editForm.warrantyPeriod : product.warrantyPeriod,
      serviceDuration:
        specialtySubKind === 'service' && nextIsRetailSalon
          ? undefined
          : nextSla || (editForm.serviceDuration !== undefined ? editForm.serviceDuration : product.serviceDuration),
      ...(specialtySubKind === 'service'
        ? {
            serviceFormat: nextServiceFormat,
            itemType: nextIsRetailSalon ? 'RETAIL' : 'SERVICE',
            isPackage: nextServiceFormat === 'PAKET_BUNDLING',
            packageDetails: nextPackageDetails,
            staffCommission: nextIsRetailSalon ? 0 : product.staffCommission ?? 20,
          }
        : {}),
      laundryUnitType: nextLaundryUnitType,
      unit: editForm.unit !== undefined ? editForm.unit : product.unit,
      supportDecimal: nextLaundryUnitType === 'KILOAN' || nextLaundryUnitType === 'LUAS' ? true : product.supportDecimal,
      isWeighable: nextLaundryUnitType === 'KILOAN' ? true : product.isWeighable,
      minOrderWeightKg: nextMinWeight,
      minOrderQty: nextMinWeight,
      slaDuration: nextSla,
      slaHours: slaOpt ? slaOpt.hours : product.slaHours,
    });
    setEditingId(null);
    setEditForm({});
    showToast(`SKU "${product.name}" berhasil diperbarui!`);
  };

  const handleCreateSpecialtyProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecName.trim()) {
      showToast('Nama item wajib diisi!');
      return;
    }
    const ts = Date.now().toString().slice(-6);
    const isLaundryItem = specialtySubKind === 'laundry';
    const isServiceItem =
      isLaundryItem || (specialtySubKind === 'service' && newSpecServiceFormat !== 'PRODUK_RETAIL_SALON');
    const isBundlingPackage = specialtySubKind === 'service' && newSpecServiceFormat === 'PAKET_BUNDLING';
    const prefix =
      specialtySubKind === 'fashion'
        ? 'FASH'
        : specialtySubKind === 'electronics'
        ? 'GAD'
        : isLaundryItem
        ? 'SVC-LND'
        : isServiceItem
        ? 'SVC-BRB'
        : 'PRD-BRB';
    const generatedId =
      prefix === 'SVC-BRB' || prefix === 'PRD-BRB' || prefix === 'SVC-LND'
        ? generateNextServiceSku(products, prefix)
        : `${prefix}-${ts}`;
    const bm =
      specialtySubKind === 'fashion'
        ? 'fashion'
        : specialtySubKind === 'electronics'
        ? 'electronics'
        : isLaundryItem
        ? 'laundry'
        : 'salon';

    const sell = Math.max(0, Number(newSpecSell) || 0);
    const cost = Math.max(0, Number(newSpecCost) || 0);
    const laundryCatMap: Record<'KILOAN' | 'SATUAN' | 'PASANG' | 'LUAS', string> = {
      KILOAN: 'Laundry Kiloan (kg)',
      SATUAN: 'Laundry Satuan (Pcs/Stel)',
      PASANG: 'Laundry Pasang (Sepatu/Tas)',
      LUAS: 'Laundry Luas (Karpet/m2)',
    };
    const serviceFormatCategoryMap: Record<ServiceItemFormat, string> = {
      LAYANAN_SATUAN: 'Barbershop & Haircut',
      PAKET_BUNDLING: 'Paket Bundling Barbershop',
      LAYANAN_ADDON: 'Layanan Tambahan (Add-on)',
      PRODUK_RETAIL_SALON: 'Produk Retail Salon',
    };
    const slaOpt = LAUNDRY_SLA_OPTIONS.find((s) => s.label === newLaundrySla);
    const minOrderNum = Math.max(0.5, Number(newLaundryMinOrder) || (newLaundryUnitType === 'KILOAN' ? 2 : 1));

    const parsedSizes = newSpecSize
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedColors = newSpecColor
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    const effectiveSizes = parsedSizes.length > 0 ? parsedSizes : [...FASHION_STANDARD_SIZES];
    const effectiveColors = parsedColors.length > 0 ? parsedColors : [...FASHION_STANDARD_COLORS];
    const perCellStock = Math.max(0, Number(newSpecStock) || 0);
    const fashionMatrix =
      specialtySubKind === 'fashion'
        ? buildFashionVariantMatrix(
            effectiveSizes,
            effectiveColors,
            `FSH-${ts}`,
            effectiveSizes.map(() => perCellStock)
          )
        : undefined;
    const fashionTotalStock = fashionMatrix ? sumVariantMatrixStock(fashionMatrix) : perCellStock;
    const newFashionPromo: FashionArticlePromo | undefined =
      specialtySubKind === 'fashion' && (newFashionClearanceActive || newFashionBundleActive)
        ? {
            clearanceActive: newFashionClearanceActive,
            clearanceType: newFashionClearanceType,
            clearanceValue: Math.max(0, Number(newFashionClearanceValue) || 0),
            clearanceLabel: `Clearance ${newSpecName.trim()}`,
            bundleActive: newFashionBundleActive,
            bundleMinQty: Math.max(2, Number(newFashionBundleMinQty) || 2),
            bundleDiscountType: newFashionBundleType,
            bundleDiscountValue: Math.max(0, Number(newFashionBundleValue) || 0),
            bundleScope: newFashionBundleScope,
            bundleLabel:
              newFashionBundleScope === 'MIX_MATCH_FASHION'
                ? `Mix & Match Min. ${Math.max(2, Number(newFashionBundleMinQty) || 2)} Item`
                : `Beli ${Math.max(2, Number(newFashionBundleMinQty) || 2)} Lebih Hemat`,
          }
        : undefined;

    addProduct({
      id: generatedId,
      sku: generatedId,
      barcode:
        prefix === 'SVC-BRB' || prefix === 'PRD-BRB' || prefix === 'SVC-LND'
          ? generatedId
          : `899${ts}`,
      plu: generatedId,
      serviceCode: isServiceItem ? generatedId : undefined,
      name: newSpecName.trim(),
      brand: newSpecBrand.trim() || (specialtySubKind === 'service' ? 'Barbershop Signature' : activeModelDef.shortLabel),
      category:
        newSpecCategory.trim() ||
        (specialtySubKind === 'fashion'
          ? 'Busana & Apparel'
          : specialtySubKind === 'electronics'
          ? 'Elektronik & Gadget'
          : isLaundryItem
          ? laundryCatMap[newLaundryUnitType]
          : serviceFormatCategoryMap[newSpecServiceFormat]),
      costPrice: cost,
      cost_price: cost,
      hpp: cost,
      sellingPrice: sell,
      sell_price: sell,
      price_retail: sell,
      retailPrice: sell,
      price: sell,
      price_member: Math.round(sell * 0.92),
      price_wholesale: Math.round(sell * 0.85),
      stock: isServiceItem ? 999 : specialtySubKind === 'fashion' ? fashionTotalStock : Math.max(0, Number(newSpecStock) || 0),
      minStock: specialtySubKind === 'fashion' ? 12 : isServiceItem ? 0 : 5,
      unit: isLaundryItem
        ? newLaundryUnit
        : isBundlingPackage
        ? 'Paket'
        : isServiceItem
        ? 'Sesi'
        : specialtySubKind === 'electronics'
        ? 'Unit'
        : 'Pcs',
      businessModel: bm,
      itemType: isServiceItem ? 'SERVICE' : 'RETAIL',
      status: 'Active',
      ...(specialtySubKind === 'fashion'
        ? {
            variantSize: effectiveSizes.join(', '),
            variantColor: effectiveColors.join(', '),
            variantMatrix: fashionMatrix,
            fashionPromo: newFashionPromo,
          }
        : {}),
      ...(specialtySubKind === 'electronics'
        ? { imeiSerial: newSpecImei || `SN-${ts}`, warrantyPeriod: newSpecWarranty }
        : {}),
      ...(specialtySubKind === 'service'
        ? {
            serviceFormat: newSpecServiceFormat,
            isPackage: isBundlingPackage,
            packageDetails: newSpecPackageDetails.trim() || undefined,
            serviceDuration: isServiceItem ? newSpecDuration.trim() || '30 mnt' : undefined,
            staffCommission: isServiceItem ? 20 : 0,
          }
        : {}),
      ...(isLaundryItem
        ? {
            serviceFormat: 'LAYANAN_SATUAN',
            laundryUnitType: newLaundryUnitType,
            supportDecimal: newLaundryUnitType === 'KILOAN' || newLaundryUnitType === 'LUAS',
            isWeighable: newLaundryUnitType === 'KILOAN',
            minOrderWeightKg: minOrderNum,
            minOrderQty: minOrderNum,
            slaDuration: newLaundrySla,
            slaHours: slaOpt?.hours ?? 48,
            serviceDuration: newLaundrySla,
          }
        : {}),
    });

    showToast(`Item "${newSpecName.trim()}" (${generatedId}) berhasil ditambahkan ke ${specialtyTabLabel} & langsung aktif di POS!`);
    setNewSpecName('');
    setNewSpecBrand('');
    setNewSpecCategory('');
    setNewSpecCost(0);
    setNewSpecSell(0);
    setNewSpecPackageDetails('');
    setNewSpecDuration('30 mnt');
    setNewSpecImei('');
    setNewFashionClearanceActive(false);
    setNewFashionBundleActive(false);
    setIsSpecialtyAddOpen(false);
  };

  const openFashionMatrixEditor = (prod: Product) => {
    const sizes = (prod.variantSize || FASHION_STANDARD_SIZES.join(', '))
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const colors = (prod.variantColor || FASHION_STANDARD_COLORS.join(', '))
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    const initialMatrix =
      Array.isArray(prod.variantMatrix) && prod.variantMatrix.length > 0
        ? prod.variantMatrix.map((c) => ({ ...c }))
        : buildFashionVariantMatrix(
            sizes.length > 0 ? sizes : [...FASHION_STANDARD_SIZES],
            colors.length > 0 ? colors : [...FASHION_STANDARD_COLORS],
            prod.plu || prod.id,
            [3, 4, 4, 3, 2]
          );
    setMatrixDraftCells(initialMatrix);
    setMatrixModalProduct(prod);
  };

  const handleSaveFashionMatrix = () => {
    if (!matrixModalProduct) return;
    const total = sumVariantMatrixStock(matrixDraftCells);
    const uniqueSizes = Array.from(new Set(matrixDraftCells.map((c) => c.size))).join(', ');
    const uniqueColors = Array.from(new Set(matrixDraftCells.map((c) => c.color))).join(', ');
    persistProductEdit(matrixModalProduct, {
      variantMatrix: matrixDraftCells,
      variantSize: uniqueSizes,
      variantColor: uniqueColors,
      stock: total,
      status: total <= 0 ? 'Out of Stock' : total <= (matrixModalProduct.minStock ?? 12) ? 'Low Stock' : 'Active',
    });
    showToast(`Matriks stok "${matrixModalProduct.name}" (${matrixDraftCells.length} kombinasi • ${total} pcs) disimpan!`);
    setMatrixModalProduct(null);
  };

  const openFashionPromoEditor = (prod: Product) => {
    setFashionPromoDraft({
      clearanceActive: Boolean(prod.fashionPromo?.clearanceActive),
      clearanceType: prod.fashionPromo?.clearanceType || 'PERCENT',
      clearanceValue: prod.fashionPromo?.clearanceValue ?? 15,
      clearanceLabel: prod.fashionPromo?.clearanceLabel || `Clearance Sale ${prod.name}`,
      bundleActive: Boolean(prod.fashionPromo?.bundleActive),
      bundleMinQty: prod.fashionPromo?.bundleMinQty ?? 2,
      bundleDiscountType: prod.fashionPromo?.bundleDiscountType || 'NOMINAL',
      bundleDiscountValue: prod.fashionPromo?.bundleDiscountValue ?? 20000,
      bundleScope: prod.fashionPromo?.bundleScope || 'MIX_MATCH_FASHION',
      bundleLabel: prod.fashionPromo?.bundleLabel || 'Beli 2 Lebih Hemat / Mix & Match',
    });
    setFashionPromoModalProduct(prod);
  };

  const handleSaveFashionPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fashionPromoModalProduct) return;
    persistProductEdit(fashionPromoModalProduct, {
      fashionPromo: {
        ...fashionPromoDraft,
        clearanceValue: Math.max(0, Number(fashionPromoDraft.clearanceValue) || 0),
        bundleMinQty: Math.max(2, Number(fashionPromoDraft.bundleMinQty) || 2),
        bundleDiscountValue: Math.max(0, Number(fashionPromoDraft.bundleDiscountValue) || 0),
      },
    });
    showToast(`Pengaturan promo "${fashionPromoModalProduct.name}" diperbarui & langsung aktif di kasir!`);
    setFashionPromoModalProduct(null);
  };

  const isLight = theme === 'light';

  return (
    <div
      className={`p-4 md:p-6 rounded-2xl border min-h-full font-sans transition-all duration-200 ${
        isLight
          ? 'bg-white border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.18)] hover:border-cyan-500 hover:shadow-[0_0_22px_rgba(6,182,212,0.32)] text-slate-900'
          : 'bg-slate-950 border-cyan-500/35 shadow-[0_0_16px_rgba(6,182,212,0.08)] hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.16)] text-slate-100'
      }`}
    >
      {/* Header Utama */}
      <div className={`flex flex-wrap justify-between items-center gap-4 mb-5 border-b pb-4 ${isLight ? 'border-cyan-500/20' : 'border-slate-800'}`}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
              isLight
                ? 'bg-transparent border-0 shadow-none px-0 py-0 text-cyan-800'
                : 'px-2 py-0.5 border rounded bg-cyan-500/15 border-cyan-500/35 text-cyan-300'
            }`}>
              JacS Enterprise
            </span>
            <h1 className={`text-lg md:text-xl font-medium tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Master Data &amp; AI Smart Category Center
            </h1>
            <span className={`px-2 py-0.5 border text-[10px] font-mono font-medium rounded uppercase tracking-wider ${
              isLight
                ? 'bg-emerald-50 border-emerald-400/70 text-emerald-800'
                : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
            }`}>
              {activeSector} · {activeModelDef.shortLabel}
            </span>
          </div>
          <p className={`text-xs font-normal tracking-wide mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {isFnb
              ? 'Katalog Menu Jadi, Komposisi Resep BOM Bahan Baku, Master Topping & Add-on, & Kalkulator HPP Dapur'
              : isBuilding
              ? 'Master Material Bangunan, Konversi Curah m³/Ret Armada, Dimensi Custom, & Fraksi Timbang'
              : isFashion || isService
              ? `${activeFamilyMeta.label} — ${specialtyTabLabel} (${activeModelDef.label})`
              : isRetail
              ? 'Standar Katalog Ritel Modern (PC.2 – PC.471), Multi-Tier Pricing (+20%/+15%/+10%), & Barcode Shelf Studio'
              : 'Standar Katalog Ritel Modern'}
          </p>
        </div>

        {/* Navigasi Sub-Modul (Terisolasi Otomatis per Rumpun Usaha) */}
        <div className="flex flex-wrap gap-1.5">
          {visibleTabs.includes('catalog') && (
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 text-xs font-medium tracking-wide rounded-lg transition-all cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-cyan-50 border border-slate-300'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Katalog SKU ({retailDomainProducts.length})
            </button>
          )}
          {visibleTabs.includes('migration') && (
            <button
              onClick={() => setActiveTab('migration')}
              className={`px-3 py-1.5 text-xs font-medium tracking-wide rounded-lg transition-all cursor-pointer ${
                activeTab === 'migration'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-cyan-50 border border-slate-300'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              AI Smart Migration
            </button>
          )}
          {visibleTabs.includes('categories') && (
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 text-xs font-medium tracking-wide rounded-lg transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-cyan-50 border border-slate-300'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Kamus Kategori ({allStandardCategories.length})
            </button>
          )}
          {visibleTabs.includes('fnb_catalog') && (
            <button
              onClick={() => setActiveTab('fnb_catalog')}
              className={`px-3 py-1.5 text-xs font-medium tracking-wide rounded-lg transition-all cursor-pointer ${
                activeTab === 'fnb_catalog'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-amber-50 border border-slate-300'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Katalog Menu ({fnbCatalogMenus.length})
            </button>
          )}
          {visibleTabs.includes('fb_bom') && (
            <button
              onClick={() => setActiveTab('fb_bom')}
              className={`px-3 py-1.5 text-xs font-medium tracking-wide rounded-lg transition-all cursor-pointer ${
                activeTab === 'fb_bom'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-amber-50 border border-slate-300'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              F&amp;B BOM &amp; HPP
            </button>
          )}
          {visibleTabs.includes('fnb_toppings') && (
            <button
              id="tab-master-fnb-toppings"
              onClick={() => setActiveTab('fnb_toppings')}
              className={`px-3 py-1.5 text-xs font-medium tracking-wide rounded-lg transition-all cursor-pointer ${
                activeTab === 'fnb_toppings'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-amber-50 border border-slate-300'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Master Topping &amp; Add-on ({fnbToppings.filter((t) => t.isActive).length}/{fnbToppings.length})
            </button>
          )}
          {visibleTabs.includes('building') && (
            <button
              onClick={() => setActiveTab('building')}
              className={`px-3 py-1.5 text-xs font-medium tracking-wide rounded-lg transition-all cursor-pointer ${
                activeTab === 'building'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-emerald-50 border border-slate-300'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Material Bangunan &amp; Curah
            </button>
          )}
          {visibleTabs.includes('specialty_catalog') && (
            <button
              onClick={() => setActiveTab('specialty_catalog')}
              className={`px-3 py-1.5 text-xs font-medium tracking-wide rounded-lg transition-all cursor-pointer ${
                activeTab === 'specialty_catalog'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-purple-50 border border-slate-300'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {specialtyTabLabel} ({specialtyProducts.length})
            </button>
          )}
          {visibleTabs.includes('service_stylists') && (
            <button
              onClick={() => setActiveTab('service_stylists')}
              className={`px-3 py-1.5 text-xs font-medium tracking-wide rounded-lg transition-all cursor-pointer ${
                activeTab === 'service_stylists'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-indigo-50 border border-slate-300'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Master Stylist &amp; Petugas ({serviceStylists.filter((s) => s.isActive).length}/{serviceStylists.length})
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: KATALOG SKU RITEL MODERN */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Toolbar Pencarian & Aksi Cepat */}
          <div className={`flex flex-wrap justify-between items-center gap-3 border p-3 rounded-xl transition-all ${
            isLight
              ? 'bg-slate-50/80 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
              : 'bg-slate-900/90 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.06)]'
          }`}>
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Barcode, Nama Produk, Brand, atau No Kategori..."
                className={`border rounded-lg px-3 py-1.5 text-xs font-normal w-full md:w-80 focus:outline-none focus:border-cyan-500 ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-100'
                }`}
              />
              <select
                value={filterCategoryCode}
                onChange={(e) => setFilterCategoryCode(e.target.value)}
                className={`border rounded-lg px-3 py-1.5 text-xs font-normal focus:outline-none focus:border-cyan-500 ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-200'
                }`}
              >
                <option value="ALL">Semua Kategori Resmi</option>
                {allStandardCategories.map((cat) => (
                  <option key={cat.code} value={String(cat.code)}>
                    {cat.code} — {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQuickBarcode(true)}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium text-xs tracking-wide rounded-lg transition-all cursor-pointer"
              >
                + Quick Barcode SKU
              </button>
              <button
                onClick={() => setActiveTab('migration')}
                className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium text-xs tracking-wide rounded-lg transition-all cursor-pointer"
              >
                Impor Massal AI
              </button>
            </div>
          </div>

          {/* Tabel Data Katalog */}
          <div className={`border rounded-xl overflow-x-auto transition-all ${
            isLight
              ? 'bg-white border-cyan-500/55 shadow-[0_0_14px_rgba(6,182,212,0.12)]'
              : 'bg-slate-900/90 border-cyan-500/30 shadow-[0_0_14px_rgba(6,182,212,0.08)]'
          }`}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b uppercase text-[11px] font-medium tracking-wider ${
                  isLight
                    ? 'border-slate-200 bg-slate-100/80 text-slate-700'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}>
                  <th className="p-3 whitespace-nowrap font-medium">BARCODE / ID</th>
                  <th className="p-3 whitespace-nowrap font-medium">NO KATEGORI</th>
                  <th className="p-3 whitespace-nowrap font-medium">NAMA KATEGORI</th>
                  <th className="p-3 min-w-[200px] font-medium">NAMA PRODUK</th>
                  <th className="p-3 whitespace-nowrap font-medium">BRAND</th>
                  <th className="p-3 text-right whitespace-nowrap font-medium">HPP</th>
                  <th className="p-3 text-right whitespace-nowrap font-medium">RETAIL (+20%)</th>
                  <th className="p-3 text-right whitespace-nowrap font-medium">MEMBER (+15%)</th>
                  <th className="p-3 text-right whitespace-nowrap font-medium">GROSIR (+10%)</th>
                  <th className="p-3 text-center whitespace-nowrap font-medium">STOK</th>
                  <th className="p-3 text-center whitespace-nowrap font-medium">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-500 font-normal">
                      Tidak ada produk yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isEditing = editingId === p.id;
                    const displayBarcodeId = formatProductBarcodeId(p);
                    const normalizedProdCode = Number(String(p.categoryCode ?? 10).replace(/^PC\./i, '')) || 10;
                    const activeCatCode = Number(
                      isEditing ? (String(editForm.categoryCode ?? normalizedProdCode).replace(/^PC\./i, '')) : normalizedProdCode
                    ) || 10;
                    const matchedCat = allStandardCategories.find((c) => c.code === activeCatCode);
                    const displayCatName = isEditing
                      ? (matchedCat?.name || editForm.category || p.category || 'Umum')
                      : (p.category || matchedCat?.name || 'Umum');
                    const cost = p.costPrice ?? p.cost_price ?? p.buy_price ?? 0;
                    const sell =
                      p.sellingPrice ??
                      p.sell_price ??
                      p.price_retail ??
                      p.retailPrice ??
                      p.price ??
                      (cost > 0 ? Math.ceil((cost * 1.2) / 100) * 100 : 0);
                    const memberP = p.memberPrice ?? p.price_member ?? Math.round(sell * 0.95);
                    const wholesaleP = p.wholesalePrice ?? p.price_wholesale ?? Math.round(sell * 0.9);

                    return (
                      <tr
                        key={p.id}
                        className={`border-b ${
                          isLight
                            ? 'border-slate-200 hover:bg-cyan-50/40'
                            : 'border-slate-800/50 hover:bg-slate-800/40'
                        }`}
                      >
                        {/* (1) BARCODE / ID */}
                        <td className="p-2.5 font-mono font-normal whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editForm.barcode ?? displayBarcodeId}
                                onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                                className="bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-xs w-32 font-mono text-cyan-300"
                              />
                              <button
                                type="button"
                                title="Buat ID Non-Barcode (INT-XXXX)"
                                onClick={() =>
                                  setEditForm({
                                    ...editForm,
                                    barcode: `INT-${Math.floor(1000 + Math.random() * 9000)}`,
                                  })
                                }
                                className="px-1.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-500 rounded text-[10px] font-mono font-medium cursor-pointer"
                              >
                                INT
                              </button>
                            </div>
                          ) : (
                            <span
                              className={
                                displayBarcodeId.startsWith('INT-')
                                  ? 'px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[11px] font-medium'
                                  : isLight
                                  ? 'text-cyan-700 font-medium'
                                  : 'text-cyan-300'
                              }
                            >
                              {displayBarcodeId}
                            </span>
                          )}
                        </td>

                        {/* (2) NO KATEGORI */}
                        <td className="p-2.5 whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={activeCatCode}
                              onChange={(e) => {
                                const code = Number(e.target.value);
                                const found = allStandardCategories.find((c) => c.code === code);
                                setEditForm({
                                  ...editForm,
                                  categoryCode: code,
                                  category: found ? found.name : editForm.category,
                                });
                              }}
                              className="bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-xs font-mono text-amber-300"
                            >
                              {allStandardCategories.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.code}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 border font-mono text-[10px] font-medium rounded ${
                              isLight
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}>
                              {normalizedProdCode}
                            </span>
                          )}
                        </td>

                        {/* (3) NAMA KATEGORI */}
                        <td className={`p-2.5 font-normal whitespace-nowrap ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          {displayCatName}
                        </td>

                        {/* (4) NAMA PRODUK */}
                        <td className={`p-2.5 font-medium ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.name ?? p.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-xs w-full min-w-[180px]"
                            />
                          ) : (
                            p.name
                          )}
                        </td>

                        {/* (5) BRAND */}
                        <td className={`p-2.5 font-normal whitespace-nowrap ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.brand ?? p.brand ?? ''}
                              onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                              className="bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-xs w-28"
                            />
                          ) : (
                            p.brand || '-'
                          )}
                        </td>

                        {/* (6) HPP */}
                        <td className={`p-2.5 text-right font-mono font-normal whitespace-nowrap ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editForm.costPrice ?? cost}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  costPrice: Number(e.target.value),
                                  cost_price: Number(e.target.value),
                                })
                              }
                              className="bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-xs w-24 text-right"
                            />
                          ) : (
                            `Rp ${cost.toLocaleString('id-ID')}`
                          )}
                        </td>

                        {/* (7) RETAIL (+20%) */}
                        <td className={`p-2.5 text-right font-mono font-medium whitespace-nowrap ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editForm.sellingPrice ?? editForm.sell_price ?? editForm.retailPrice ?? editForm.price ?? sell}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setEditForm({
                                  ...editForm,
                                  sellingPrice: v,
                                  sell_price: v,
                                  price_retail: v,
                                  retailPrice: v,
                                  price: v,
                                });
                              }}
                              className="bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-xs w-24 text-right"
                            />
                          ) : (
                            `Rp ${sell.toLocaleString('id-ID')}`
                          )}
                        </td>

                        {/* (8) MEMBER (+15%) */}
                        <td className={`p-2.5 text-right font-mono font-normal whitespace-nowrap ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                          Rp {memberP.toLocaleString('id-ID')}
                        </td>

                        {/* (9) GROSIR (+10%) */}
                        <td className={`p-2.5 text-right font-mono font-normal whitespace-nowrap ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>
                          Rp {wholesaleP.toLocaleString('id-ID')}
                        </td>

                        {/* (10) STOK */}
                        <td className={`p-2.5 text-center font-mono font-normal whitespace-nowrap ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {p.stock} {p.unit || 'pcs'}
                        </td>

                        {/* (11) AKSI */}
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineEdit(p)}
                                  className="px-2 py-1 bg-emerald-500 text-slate-950 font-medium rounded text-[10px] cursor-pointer"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-2 py-1 bg-slate-700 text-slate-200 font-medium rounded text-[10px] cursor-pointer"
                                >
                                  Batal
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(p.id);
                                    setEditForm(p);
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer ${
                                    isLight
                                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                  }`}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setLabelModalProduct(p)}
                                  className={`px-2 py-1 font-medium rounded text-[10px] border cursor-pointer ${
                                    isLight
                                      ? 'bg-cyan-50 hover:bg-cyan-500 text-cyan-800 hover:text-white border-cyan-400/70'
                                      : 'bg-cyan-950 hover:bg-cyan-600 text-cyan-300 hover:text-slate-950 border-cyan-800/50'
                                  }`}
                                >
                                  Label Rak
                                </button>
                                {deleteProduct && (
                                  <button
                                    type="button"
                                    onClick={() => deleteProduct(p.id)}
                                    className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer ${
                                      isLight
                                        ? 'bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white'
                                        : 'bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white'
                                    }`}
                                  >
                                    Hapus
                                  </button>
                                )}
                              </>
                            )}
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
      )}

      {/* TAB 2: AI SMART MIGRATION WIZARD */}
      {activeTab === 'migration' && (
        <SmartMigrationPanel
          products={products}
          addProductsBulk={addProductsBulk}
          addAuditLog={addAuditLog}
          showToast={showToast}
          isLight={isLight}
          onGoToCatalog={() => setActiveTab('catalog')}
        />
      )}

      {/* TAB 3: REFERENSI KAMUS KATEGORI RESMI */}
      {activeTab === 'categories' && (
        <div className={`border rounded-xl p-4 transition-all ${
          isLight
            ? 'bg-slate-50/70 border-cyan-500/55 shadow-[0_0_14px_rgba(6,182,212,0.12)]'
            : 'bg-slate-900/90 border-cyan-500/30 shadow-[0_0_14px_rgba(6,182,212,0.08)]'
        }`}>
          <div className="mb-3">
            <h2 className={`text-sm font-medium tracking-wide ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
              Standar Nomor Kategori Resmi Ritel Modern (ACNielsen Audit Reference)
            </h2>
            <p className={`text-xs font-normal tracking-wide ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Digunakan otomatis oleh AI Smart Mapper untuk klasifikasi SKU, pelaporan inventaris, dan label rak.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[540px] overflow-y-auto pr-1">
            {allStandardCategories.map((cat) => (
              <div
                key={cat.code}
                className={`p-3 border rounded-lg flex flex-col justify-between ${
                  isLight ? 'bg-white border-cyan-500/40 shadow-xs' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-medium text-xs ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{cat.name}</span>
                  <span className={`px-2 py-0.5 font-mono text-[11px] font-medium rounded border ${
                    isLight
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    PC.{cat.code}
                  </span>
                </div>
                <p className="text-[10px] font-normal text-slate-500 mt-1.5 line-clamp-1">
                  Token: {cat.keywords.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: F&B KATALOG MENU (Khusus Rumpun FNB_CULINARY) */}
      {activeTab === 'fnb_catalog' && (
        <div className="space-y-4">
          <div className={`flex flex-wrap justify-between items-center gap-3 border p-3 rounded-xl transition-all ${
            isLight
              ? 'bg-amber-50/60 border-amber-400/50'
              : 'bg-slate-900/90 border-amber-500/30'
          }`}>
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Nama Menu, PLU, atau Kategori F&B..."
                className={`border rounded-lg px-3 py-1.5 text-xs font-normal w-full md:w-80 focus:outline-none focus:border-amber-500 ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-100'
                }`}
              />
              <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300">
                {fnbCatalogMenus.length} Menu Jadi Tersedia
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('fb_bom')}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs tracking-wide rounded-lg transition-all cursor-pointer"
            >
              Buka F&amp;B BOM &amp; HPP →
            </button>
          </div>

          <div className={`border rounded-xl overflow-x-auto transition-all ${
            isLight
              ? 'bg-white border-amber-500/40 shadow-sm'
              : 'bg-slate-900/90 border-amber-500/30'
          }`}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b uppercase text-[11px] font-medium tracking-wider ${
                  isLight
                    ? 'border-slate-200 bg-slate-100/80 text-slate-700'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}>
                  <th className="p-3 whitespace-nowrap font-medium">KODE / PLU</th>
                  <th className="p-3 whitespace-nowrap font-medium">KATEGORI MENU</th>
                  <th className="p-3 min-w-[200px] font-medium">NAMA MENU</th>
                  <th className="p-3 whitespace-nowrap font-medium">TIPE &amp; VARIAN</th>
                  <th className="p-3 text-right whitespace-nowrap font-medium">HPP RESEP</th>
                  <th className="p-3 text-right whitespace-nowrap font-medium">HARGA JUAL</th>
                  <th className="p-3 text-center whitespace-nowrap font-medium">STOK PORSI</th>
                  <th className="p-3 text-center whitespace-nowrap font-medium">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {fnbCatalogMenus.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Tidak ada menu F&amp;B yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  fnbCatalogMenus.map((m) => {
                    const isEditing = editingId === m.id;
                    const hppVal = m.costing?.totalCost ?? m.costPrice ?? m.cost_price ?? 0;
                    const sellVal = m.sellingPrice ?? m.sell_price ?? m.price_retail ?? 0;
                    return (
                      <tr
                        key={m.id}
                        className={`border-b ${
                          isLight ? 'border-slate-200 hover:bg-amber-50/40' : 'border-slate-800/50 hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="p-2.5 font-mono text-amber-600 dark:text-amber-300 whitespace-nowrap">
                          {m.plu || m.barcode || m.id}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                            isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}>
                            {m.category || 'F&B Menu'}
                          </span>
                        </td>
                        <td className={`p-2.5 font-medium ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.name ?? m.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="bg-slate-950 border border-amber-500 rounded px-2 py-1 text-xs w-full min-w-[180px]"
                            />
                          ) : (
                            m.name
                          )}
                        </td>
                        <td className="p-2.5 whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400">
                          {m.menuType || 'Menu'}
                          {m.toppingEnabled ? ` • +Topping (${m.toppings?.length || 0})` : ''}
                          {m.spicyEnabled ? ' • Level Pedas' : ''}
                        </td>
                        <td className="p-2.5 text-right font-mono whitespace-nowrap">
                          Rp {Math.round(hppVal).toLocaleString('id-ID')}
                        </td>
                        <td className="p-2.5 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editForm.sell_price ?? sellVal}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setEditForm({
                                  ...editForm,
                                  sell_price: v,
                                  sellingPrice: v,
                                  price_retail: v,
                                  price: v,
                                });
                              }}
                              className="bg-slate-950 border border-amber-500 rounded px-2 py-1 text-xs w-24 text-right"
                            />
                          ) : (
                            `Rp ${sellVal.toLocaleString('id-ID')}`
                          )}
                        </td>
                        <td className="p-2.5 text-center font-mono whitespace-nowrap">
                          {m.stock ?? 100} {m.unit || 'Porsi'}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveSpecialtyInlineEdit(m)}
                                  className="px-2 py-1 bg-emerald-500 text-slate-950 font-medium rounded text-[10px] cursor-pointer"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-2 py-1 bg-slate-700 text-slate-200 font-medium rounded text-[10px] cursor-pointer"
                                >
                                  Batal
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(m.id);
                                    setEditForm(m);
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer ${
                                    isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                  }`}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('fb_bom')}
                                  className="px-2 py-1 rounded text-[10px] font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-300 border border-amber-500/30 cursor-pointer"
                                >
                                  Resep BOM
                                </button>
                              </>
                            )}
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
      )}

      {/* TAB 5: F&B RECIPE BOM & HPP */}
      {activeTab === 'fb_bom' && <FBMasterModule />}

      {/* TAB 5b: MASTER TOPPING & ADD-ON F&B */}
      {activeTab === 'fnb_toppings' && <FnbToppingMasterTab />}

      {/* TAB 6: MATERIAL BANGUNAN & CURAH */}
      {activeTab === 'building' && <BuildingMaterialsMasterModule />}

      {/* TAB 7: KATALOG SPECIALTY & SERVICE (Varian Ukuran/Warna, Serial/IMEI, atau Sparepart & Jasa) */}
      {activeTab === 'specialty_catalog' && (
        <div className="space-y-4">
          <div className={`flex flex-wrap justify-between items-center gap-3 border p-3 rounded-xl transition-all ${
            isLight
              ? 'bg-purple-50/50 border-purple-400/50'
              : 'bg-slate-900/90 border-purple-500/30'
          }`}>
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  specialtySubKind === 'fashion'
                    ? 'Cari Produk Fashion, Ukuran (S-XXL), Warna, atau Brand...'
                    : specialtySubKind === 'electronics'
                    ? 'Cari Perangkat Elektronik, No. Serial / IMEI, atau Garansi...'
                    : specialtySubKind === 'laundry'
                    ? 'Cari Layanan Laundry (Kiloan, Satuan, Sepatu, Karpet) atau SLA...'
                    : 'Cari Sparepart, Oli, Layanan Jasa, atau Durasi...'
                }
                className={`border rounded-lg px-3 py-1.5 text-xs font-normal w-full md:w-80 focus:outline-none focus:border-purple-500 ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-100'
                }`}
              />

              {specialtySubKind === 'fashion' && (
                <div className="flex flex-wrap items-center gap-1">
                  {(
                    [
                      { id: 'ALL', label: 'Semua Artikel' },
                      { id: 'CLEARANCE', label: '🔥 Clearance Sale' },
                      { id: 'BUNDLE', label: '🎁 Bundle / Mix & Match' },
                      { id: 'LOW_STOCK', label: '⚠️ Varian Menipis' },
                    ] as const
                  ).map((pill) => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setFashionFilter(pill.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition ${
                        fashionFilter === pill.id
                          ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                          : isLight
                          ? 'bg-white text-slate-700 border-slate-300 hover:bg-purple-50'
                          : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              )}

              {specialtySubKind === 'laundry' && (
                <div className="flex flex-wrap items-center gap-1">
                  {(
                    [
                      { id: 'ALL', label: 'Semua Satuan' },
                      { id: 'KILOAN', label: '⚖️ Kiloan (kg)' },
                      { id: 'SATUAN', label: '👔 Satuan (pcs/stel)' },
                      { id: 'PASANG', label: '👟 Pasang' },
                      { id: 'LUAS', label: '📐 Luas (m²)' },
                    ] as const
                  ).map((pill) => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setLaundryUnitFilter(pill.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition ${
                        laundryUnitFilter === pill.id
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                          : isLight
                          ? 'bg-white text-slate-700 border-slate-300 hover:bg-cyan-50'
                          : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              )}

              {specialtySubKind === 'service' && (
                <select
                  value={specialtyTypeFilter}
                  onChange={(e) => setSpecialtyTypeFilter(e.target.value as 'ALL' | ServiceItemFormat)}
                  className={`border rounded-lg px-3 py-1.5 text-xs font-normal focus:outline-none focus:border-purple-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-200'
                  }`}
                >
                  <option value="ALL">Semua Tipe Layanan &amp; Produk</option>
                  {SERVICE_FORMAT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSpecialtyAddOpen((v) => !v)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs tracking-wide rounded-lg transition-all cursor-pointer"
            >
              {isSpecialtyAddOpen
                ? 'Tutup Form Tambah'
                : `+ Tambah ${
                    specialtySubKind === 'fashion'
                      ? 'Varian Busana'
                      : specialtySubKind === 'electronics'
                      ? 'SKU Serial/IMEI'
                      : specialtySubKind === 'laundry'
                      ? 'Layanan Laundry'
                      : 'Layanan / Paket'
                  }`}
            </button>
          </div>

          {isSpecialtyAddOpen && (
            <form
              onSubmit={handleCreateSpecialtyProduct}
              className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs ${
                isLight ? 'bg-slate-50 border-purple-300' : 'bg-slate-900 border-purple-500/40'
              }`}
            >
              <div>
                <label className="block text-[11px] font-medium mb-1">Nama Item / Layanan *</label>
                <input
                  type="text"
                  required
                  value={newSpecName}
                  onChange={(e) => setNewSpecName(e.target.value)}
                  placeholder="Contoh: Kemeja Linen / Servis Berkala"
                  className={`w-full px-2.5 py-1.5 rounded-lg border ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">Brand / Studio</label>
                <input
                  type="text"
                  value={newSpecBrand}
                  onChange={(e) => setNewSpecBrand(e.target.value)}
                  placeholder="Nama Brand / Mitra"
                  className={`w-full px-2.5 py-1.5 rounded-lg border ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>
              {specialtySubKind === 'fashion' && (
                <>
                  <div>
                    <label className="block text-[11px] font-medium mb-1">Matriks Ukuran (pisahkan koma)</label>
                    <input
                      type="text"
                      value={newSpecSize}
                      onChange={(e) => setNewSpecSize(e.target.value)}
                      placeholder="S, M, L, XL, XXL"
                      className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1">Matriks Warna (pisahkan koma)</label>
                    <input
                      type="text"
                      value={newSpecColor}
                      onChange={(e) => setNewSpecColor(e.target.value)}
                      placeholder="Sage, Maroon, Hitam, Cream"
                      className={`w-full px-2.5 py-1.5 rounded-lg border ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </>
              )}
              {specialtySubKind === 'electronics' && (
                <>
                  <div>
                    <label className="block text-[11px] font-medium mb-1">No. Serial / IMEI</label>
                    <input
                      type="text"
                      value={newSpecImei}
                      onChange={(e) => setNewSpecImei(e.target.value)}
                      placeholder="IMEI / SN Perangkat"
                      className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1">Masa Garansi</label>
                    <input
                      type="text"
                      value={newSpecWarranty}
                      onChange={(e) => setNewSpecWarranty(e.target.value)}
                      placeholder="12 Bulan Garansi Resmi"
                      className={`w-full px-2.5 py-1.5 rounded-lg border ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </>
              )}
              {specialtySubKind === 'service' && (
                <>
                  <div>
                    <label className="block text-[11px] font-medium mb-1">Tipe Item *</label>
                    <select
                      value={newSpecServiceFormat}
                      onChange={(e) => setNewSpecServiceFormat(e.target.value as ServiceItemFormat)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    >
                      {SERVICE_FORMAT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {newSpecServiceFormat !== 'PRODUK_RETAIL_SALON' && (
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Durasi Layanan</label>
                      <input
                        type="text"
                        value={newSpecDuration}
                        onChange={(e) => setNewSpecDuration(e.target.value)}
                        placeholder="Contoh: 25 mnt / 35 mnt"
                        className={`w-full px-2.5 py-1.5 rounded-lg border ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                        }`}
                      />
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium mb-1">
                      {newSpecServiceFormat === 'PAKET_BUNDLING'
                        ? 'Rincian Isi Paket (Bundling)'
                        : 'Rincian Isi Paket / Keterangan Singkat (Opsional)'}
                    </label>
                    <input
                      type="text"
                      value={newSpecPackageDetails}
                      onChange={(e) => setNewSpecPackageDetails(e.target.value)}
                      placeholder="Contoh: Cukur Reguler + Cuci Rambut + Tonic"
                      className={`w-full px-2.5 py-1.5 rounded-lg border ${
                        newSpecServiceFormat === 'PAKET_BUNDLING'
                          ? isLight
                            ? 'bg-amber-50/70 border-amber-400 text-slate-900'
                            : 'bg-amber-500/10 border-amber-500/50 text-white'
                          : isLight
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </>
              )}
              {specialtySubKind === 'laundry' && (
                <>
                  <div>
                    <label className="block text-[11px] font-medium mb-1">Jenis Satuan Laundry</label>
                    <select
                      value={newLaundryUnitType}
                      onChange={(e) => {
                        const mode = e.target.value as 'KILOAN' | 'SATUAN' | 'PASANG' | 'LUAS';
                        setNewLaundryUnitType(mode);
                        if (mode === 'KILOAN') {
                          setNewLaundryUnit('kg');
                          setNewLaundryMinOrder(2);
                        } else if (mode === 'SATUAN') {
                          setNewLaundryUnit('pcs');
                          setNewLaundryMinOrder(1);
                        } else if (mode === 'PASANG') {
                          setNewLaundryUnit('pasang');
                          setNewLaundryMinOrder(1);
                        } else {
                          setNewLaundryUnit('m2');
                          setNewLaundryMinOrder(1);
                        }
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg border ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    >
                      <option value="KILOAN">Kiloan (kg desimal &amp; Timbangan)</option>
                      <option value="SATUAN">Satuan (pcs / stel)</option>
                      <option value="PASANG">Pasang (Sepatu / Sandal)</option>
                      <option value="LUAS">Luas (m² / Panjang × Lebar)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1">Satuan Tagihan</label>
                    <select
                      value={newLaundryUnit}
                      onChange={(e) => setNewLaundryUnit(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    >
                      <option value="kg">kg (Kilogram Desimal)</option>
                      <option value="pcs">pcs</option>
                      <option value="stel">stel</option>
                      <option value="pasang">pasang</option>
                      <option value="m2">m2 (Meter Persegi)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1">Minimum Order ({newLaundryUnit})</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0.5}
                      value={newLaundryMinOrder}
                      onChange={(e) => setNewLaundryMinOrder(Math.max(0.5, Number(e.target.value) || 1))}
                      className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1">Durasi SLA Pengerjaan</label>
                    <select
                      value={newLaundrySla}
                      onChange={(e) => setNewLaundrySla(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    >
                      {LAUNDRY_SLA_OPTIONS.map((opt) => (
                        <option key={opt.label} value={opt.label}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-[11px] font-medium mb-1">
                  {specialtySubKind === 'service' && newSpecServiceFormat !== 'PRODUK_RETAIL_SALON'
                    ? 'HPP Consumables (Rp)'
                    : 'HPP / Modal (Rp)'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={newSpecCost}
                  onChange={(e) => setNewSpecCost(Number(e.target.value))}
                  className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">Harga Jual (Rp) *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newSpecSell}
                  onChange={(e) => setNewSpecSell(Number(e.target.value))}
                  className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>
              {specialtySubKind !== 'laundry' &&
                !(specialtySubKind === 'service' && newSpecServiceFormat !== 'PRODUK_RETAIL_SALON') && (
                  <div>
                    <label className="block text-[11px] font-medium mb-1">
                      {specialtySubKind === 'fashion'
                        ? 'Stok Awal / Sel Varian'
                        : specialtySubKind === 'service'
                        ? 'Stok Awal (Pcs)'
                        : 'Stok Awal'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newSpecStock}
                      onChange={(e) => setNewSpecStock(Number(e.target.value))}
                      className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                )}
              {specialtySubKind === 'fashion' && (
                <div className="sm:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-purple-500/20">
                  <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-rose-200' : 'bg-slate-950/60 border-rose-500/30'}`}>
                    <label className="flex items-center gap-2 text-[11px] font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFashionClearanceActive}
                        onChange={(e) => setNewFashionClearanceActive(e.target.checked)}
                      />
                      <span>Aktifkan Clearance Sale Artikel</span>
                    </label>
                    {newFashionClearanceActive && (
                      <div className="mt-2 flex items-center gap-2">
                        <select
                          value={newFashionClearanceType}
                          onChange={(e) => setNewFashionClearanceType(e.target.value as 'PERCENT' | 'NOMINAL')}
                          className={`px-2 py-1 rounded border text-[11px] ${
                            isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                          }`}
                        >
                          <option value="PERCENT">Persen (%)</option>
                          <option value="NOMINAL">Nominal (Rp)</option>
                        </select>
                        <input
                          type="number"
                          min={0}
                          value={newFashionClearanceValue}
                          onChange={(e) => setNewFashionClearanceValue(Number(e.target.value))}
                          className={`flex-1 px-2 py-1 rounded border font-mono text-[11px] ${
                            isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                  <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-purple-200' : 'bg-slate-950/60 border-purple-500/30'}`}>
                    <label className="flex items-center gap-2 text-[11px] font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFashionBundleActive}
                        onChange={(e) => setNewFashionBundleActive(e.target.checked)}
                      />
                      <span>Aktifkan Bundle / Mix &amp; Match</span>
                    </label>
                    {newFashionBundleActive && (
                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        <select
                          value={newFashionBundleScope}
                          onChange={(e) => setNewFashionBundleScope(e.target.value as 'SAME_SKU' | 'MIX_MATCH_FASHION')}
                          className={`px-1.5 py-1 rounded border text-[10px] ${
                            isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                          }`}
                        >
                          <option value="MIX_MATCH_FASHION">Mix &amp; Match</option>
                          <option value="SAME_SKU">SKU Sama</option>
                        </select>
                        <input
                          type="number"
                          min={2}
                          value={newFashionBundleMinQty}
                          onChange={(e) => setNewFashionBundleMinQty(Math.max(2, Number(e.target.value) || 2))}
                          title="Min Qty"
                          placeholder="Min Qty"
                          className={`px-2 py-1 rounded border font-mono text-[11px] ${
                            isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                          }`}
                        />
                        <div className="flex gap-1">
                          <select
                            value={newFashionBundleType}
                            onChange={(e) => setNewFashionBundleType(e.target.value as 'PERCENT' | 'NOMINAL')}
                            className={`px-1 py-1 rounded border text-[10px] ${
                              isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                            }`}
                          >
                            <option value="NOMINAL">Rp</option>
                            <option value="PERCENT">%</option>
                          </select>
                          <input
                            type="number"
                            min={0}
                            value={newFashionBundleValue}
                            onChange={(e) => setNewFashionBundleValue(Number(e.target.value))}
                            className={`w-full px-1.5 py-1 rounded border font-mono text-[11px] ${
                              isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold cursor-pointer transition"
                >
                  Simpan Item
                </button>
              </div>
            </form>
          )}

          <div className={`border rounded-xl overflow-x-auto transition-all ${
            isLight
              ? 'bg-white border-purple-500/40 shadow-sm'
              : 'bg-slate-900/90 border-purple-500/30'
          }`}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b uppercase text-[11px] font-medium tracking-wider ${
                  isLight
                    ? 'border-slate-200 bg-slate-100/80 text-slate-700'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}>
                  <th className="p-3 whitespace-nowrap font-medium">SKU / BARCODE</th>
                  <th className="p-3 whitespace-nowrap font-medium">
                    {specialtySubKind === 'service' ? 'TIPE LAYANAN' : specialtySubKind === 'laundry' ? 'TIPE SATUAN' : 'KATEGORI'}
                  </th>
                  <th className="p-3 min-w-[220px] font-medium">NAMA ITEM &amp; RINCIAN PAKET</th>
                  <th className="p-3 whitespace-nowrap font-medium">BRAND</th>
                  {specialtySubKind === 'fashion' && (
                    <>
                      <th className="p-3 whitespace-nowrap font-medium text-purple-600 dark:text-purple-300">MATRIKS VARIAN (UKURAN × WARNA)</th>
                      <th className="p-3 whitespace-nowrap font-medium text-rose-600 dark:text-rose-300">PROMO ARTIKEL</th>
                    </>
                  )}
                  {specialtySubKind === 'electronics' && (
                    <>
                      <th className="p-3 whitespace-nowrap font-medium text-cyan-600 dark:text-cyan-300">NO. SERIAL / IMEI</th>
                      <th className="p-3 whitespace-nowrap font-medium text-cyan-600 dark:text-cyan-300">MASA GARANSI</th>
                    </>
                  )}
                  {specialtySubKind === 'service' && (
                    <th className="p-3 whitespace-nowrap font-medium text-orange-600 dark:text-orange-300">DURASI / SATUAN</th>
                  )}
                  {specialtySubKind === 'laundry' && (
                    <>
                      <th className="p-3 whitespace-nowrap font-medium text-cyan-600 dark:text-cyan-300">SATUAN &amp; MIN. ORDER</th>
                      <th className="p-3 whitespace-nowrap font-medium text-amber-600 dark:text-amber-300">DURASI SLA</th>
                    </>
                  )}
                  <th className="p-3 text-right whitespace-nowrap font-medium">HPP</th>
                  <th className="p-3 text-right whitespace-nowrap font-medium">HARGA JUAL</th>
                  <th className="p-3 text-center whitespace-nowrap font-medium">STOK</th>
                  <th className="p-3 text-center whitespace-nowrap font-medium">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {specialtyProducts.length === 0 ? (
                  <tr>
                    <td colSpan={specialtySubKind === 'service' ? 9 : 10} className="p-8 text-center text-slate-500">
                      Belum ada SKU pada katalog sub-jenis usaha ini.
                    </td>
                  </tr>
                ) : (
                  specialtyProducts.map((sp) => {
                    const isEditing = editingId === sp.id;
                    const costVal = sp.costPrice ?? sp.cost_price ?? 0;
                    const sellVal = sp.sellingPrice ?? sp.sell_price ?? sp.price_retail ?? 0;
                    const isSvc = String(sp.itemType || '').toUpperCase() === 'SERVICE';
                    const svcFormatMeta = getServiceFormatMeta(sp);
                    const laundryMode =
                      sp.laundryUnitType ||
                      (sp.unit === 'kg'
                        ? 'KILOAN'
                        : sp.unit === 'pasang'
                        ? 'PASANG'
                        : sp.unit === 'm2'
                        ? 'LUAS'
                        : 'SATUAN');
                    const minOrderDisplay = sp.minOrderWeightKg ?? sp.minOrderQty ?? (laundryMode === 'KILOAN' ? 2 : 1);
                    const slaDisplay = String(sp.slaDuration || sp.serviceDuration || 'Reguler 48 Jam');
                    const fp = sp.fashionPromo;
                    const clearancePrice =
                      fp?.clearanceActive && (fp.clearanceValue || 0) > 0
                        ? fp.clearanceType === 'PERCENT'
                          ? Math.max(0, Math.round(sellVal * (1 - Math.min(100, fp.clearanceValue) / 100)))
                          : Math.max(0, sellVal - fp.clearanceValue)
                        : null;
                    const matrixCellCount = sp.variantMatrix?.length || 0;

                    return (
                      <tr
                        key={sp.id}
                        className={`border-b ${
                          isLight ? 'border-slate-200 hover:bg-purple-50/40' : 'border-slate-800/50 hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="p-2.5 font-mono text-cyan-700 dark:text-cyan-300 whitespace-nowrap">
                          {sp.sku || sp.barcode || sp.plu || sp.id}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          {isEditing && specialtySubKind === 'service' ? (
                            <select
                              value={editForm.serviceFormat ?? resolveServiceItemFormat(sp)}
                              onChange={(e) => {
                                const fmt = e.target.value as ServiceItemFormat;
                                setEditForm({
                                  ...editForm,
                                  serviceFormat: fmt,
                                  itemType: fmt === 'PRODUK_RETAIL_SALON' ? 'RETAIL' : 'SERVICE',
                                  isPackage: fmt === 'PAKET_BUNDLING',
                                });
                              }}
                              className={`border border-purple-500 rounded px-2 py-1 text-[11px] ${
                                isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                              }`}
                            >
                              {SERVICE_FORMAT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                              specialtySubKind === 'laundry'
                                ? laundryMode === 'KILOAN'
                                  ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/35'
                                  : laundryMode === 'LUAS'
                                  ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/35'
                                  : laundryMode === 'PASANG'
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35'
                                  : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/35'
                                : specialtySubKind === 'service'
                                ? svcFormatMeta.badgeClass
                                : isLight
                                ? 'bg-purple-50 text-purple-800 border-purple-300'
                                : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            }`}>
                              {specialtySubKind === 'laundry'
                                ? laundryMode === 'KILOAN'
                                  ? 'KILOAN (KG)'
                                  : laundryMode === 'LUAS'
                                  ? 'LUAS (M² • P×L)'
                                  : laundryMode === 'PASANG'
                                  ? 'PASANG'
                                  : 'SATUAN'
                                : specialtySubKind === 'service'
                                ? svcFormatMeta.label
                                : sp.category}
                            </span>
                          )}
                        </td>
                        <td className={`p-2.5 font-medium ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                          {isEditing ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={editForm.name ?? sp.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className={`border border-purple-500 rounded px-2 py-1 text-xs w-full min-w-[200px] ${
                                  isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                                }`}
                              />
                              {specialtySubKind === 'service' && (
                                <input
                                  type="text"
                                  value={editForm.packageDetails ?? sp.packageDetails ?? ''}
                                  onChange={(e) => setEditForm({ ...editForm, packageDetails: e.target.value })}
                                  placeholder="Rincian isi paket (opsional, misal: Cukur + Cuci + Tonic)"
                                  className={`border border-amber-500/60 rounded px-2 py-1 text-[11px] font-normal w-full min-w-[200px] ${
                                    isLight ? 'bg-amber-50/60 text-slate-800' : 'bg-slate-950 text-amber-200'
                                  }`}
                                />
                              )}
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <div>{sp.name}</div>
                              {sp.packageDetails && (
                                <div className={`text-[11px] font-normal ${isLight ? 'text-amber-700' : 'text-amber-300/90'}`}>
                                  Isi Paket: {sp.packageDetails}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">{sp.brand || '-'}</td>

                        {specialtySubKind === 'fashion' && (
                          <>
                            <td className="p-2.5 min-w-[230px]">
                              {isEditing ? (
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    value={editForm.variantSize ?? sp.variantSize ?? sp.size ?? ''}
                                    onChange={(e) => setEditForm({ ...editForm, variantSize: e.target.value })}
                                    placeholder="S, M, L, XL, XXL"
                                    className={`border border-purple-500 rounded px-2 py-1 text-xs w-full ${
                                      isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                                    }`}
                                  />
                                  <input
                                    type="text"
                                    value={editForm.variantColor ?? sp.variantColor ?? sp.color ?? ''}
                                    onChange={(e) => setEditForm({ ...editForm, variantColor: e.target.value })}
                                    placeholder="Sage, Maroon, Hitam, Cream"
                                    className={`border border-purple-500 rounded px-2 py-1 text-xs w-full ${
                                      isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                                    }`}
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-1">
                                    <span className="font-mono text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                                      {sp.variantSize || sp.size || 'S-XXL'}
                                    </span>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                                      {sp.variantColor || sp.color || 'Multi Warna'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => openFashionMatrixEditor(sp)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer transition ${
                                        isLight
                                          ? 'bg-purple-50 hover:bg-purple-600 text-purple-800 hover:text-white border-purple-300'
                                          : 'bg-purple-500/15 hover:bg-purple-600 text-purple-300 hover:text-white border-purple-500/35'
                                      }`}
                                    >
                                      📊 Matriks {matrixCellCount > 0 ? `${matrixCellCount} Sel` : 'Ukuran×Warna'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 min-w-[210px]">
                              <div className="flex flex-col gap-1 items-start">
                                {fp?.clearanceActive && (fp.clearanceValue || 0) > 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/35">
                                    🔥 Clearance {fp.clearanceType === 'PERCENT' ? `-${fp.clearanceValue}%` : `-Rp ${fp.clearanceValue.toLocaleString('id-ID')}`}
                                  </span>
                                )}
                                {fp?.bundleActive && (fp.bundleDiscountValue || 0) > 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35">
                                    🎁 {fp.bundleScope === 'MIX_MATCH_FASHION' ? 'Mix & Match' : 'Bundle'} {fp.bundleMinQty}+ ({fp.bundleDiscountType === 'PERCENT' ? `-${fp.bundleDiscountValue}%` : `-Rp ${fp.bundleDiscountValue.toLocaleString('id-ID')}`})
                                  </span>
                                )}
                                {!fp?.clearanceActive && !fp?.bundleActive && (
                                  <span className="text-[10px] text-slate-400 italic">Harga Normal</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openFashionPromoEditor(sp)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer transition ${
                                    isLight
                                      ? 'bg-amber-50 hover:bg-amber-500 text-amber-800 hover:text-white border-amber-300'
                                      : 'bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border-amber-500/30'
                                  }`}
                                >
                                  🏷️ Atur Promo
                                </button>
                              </div>
                            </td>
                          </>
                        )}

                        {specialtySubKind === 'electronics' && (
                          <>
                            <td className="p-2.5 whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm.imeiSerial ?? sp.imeiSerial ?? sp.plu ?? ''}
                                  onChange={(e) => setEditForm({ ...editForm, imeiSerial: e.target.value })}
                                  className="bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-xs font-mono w-32"
                                />
                              ) : (
                                <span className="font-mono text-xs">{sp.imeiSerial || sp.plu || sp.id}</span>
                              )}
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm.warrantyPeriod ?? sp.warrantyPeriod ?? ''}
                                  onChange={(e) => setEditForm({ ...editForm, warrantyPeriod: e.target.value })}
                                  className="bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-xs w-40"
                                />
                              ) : (
                                <span className="text-xs">{sp.warrantyPeriod || '-'}</span>
                              )}
                            </td>
                          </>
                        )}

                        {specialtySubKind === 'service' && (
                          <td className="p-2.5 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.serviceDuration ?? sp.serviceDuration ?? sp.unit ?? ''}
                                onChange={(e) => setEditForm({ ...editForm, serviceDuration: e.target.value })}
                                className="bg-slate-950 border border-orange-500 rounded px-2 py-1 text-xs w-28"
                              />
                            ) : (
                              <span className="font-mono text-xs">{sp.serviceDuration || sp.unit || '-'}</span>
                            )}
                          </td>
                        )}

                        {specialtySubKind === 'laundry' && (
                          <>
                            <td className="p-2.5 whitespace-nowrap">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <select
                                    value={editForm.unit ?? sp.unit ?? 'kg'}
                                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                                    className={`border border-cyan-500 rounded px-1.5 py-1 text-xs font-mono ${
                                      isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                                    }`}
                                  >
                                    <option value="kg">kg</option>
                                    <option value="pcs">pcs</option>
                                    <option value="stel">stel</option>
                                    <option value="pasang">pasang</option>
                                    <option value="m2">m2</option>
                                  </select>
                                  <input
                                    type="number"
                                    step="0.5"
                                    min={0.5}
                                    value={editForm.minOrderWeightKg ?? minOrderDisplay}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, minOrderWeightKg: Math.max(0.5, Number(e.target.value) || 1) })
                                    }
                                    className={`border border-cyan-500 rounded px-1.5 py-1 text-xs font-mono w-16 ${
                                      isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                                    }`}
                                    title="Minimum Order"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 font-mono text-xs">
                                  <span className="font-semibold text-cyan-700 dark:text-cyan-300">/{sp.unit || 'kg'}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                    isLight
                                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                                      : 'bg-slate-800 text-slate-300 border-slate-700'
                                  }`}>
                                    Min. {minOrderDisplay} {sp.unit || 'kg'}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              {isEditing ? (
                                <select
                                  value={editForm.slaDuration ?? slaDisplay}
                                  onChange={(e) => setEditForm({ ...editForm, slaDuration: e.target.value })}
                                  className={`border border-amber-500 rounded px-2 py-1 text-xs ${
                                    isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                                  }`}
                                >
                                  {LAUNDRY_SLA_OPTIONS.map((opt) => (
                                    <option key={opt.label} value={opt.label}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                    slaDisplay.includes('6 Jam')
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
                                      : slaDisplay.includes('24 Jam')
                                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35'
                                      : 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30'
                                  }`}
                                >
                                  ⏱ {slaDisplay}
                                </span>
                              )}
                            </td>
                          </>
                        )}

                        <td className="p-2.5 text-right font-mono whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              value={editForm.cost_price ?? costVal}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setEditForm({
                                  ...editForm,
                                  cost_price: v,
                                  costPrice: v,
                                  hpp: v,
                                });
                              }}
                              className={`border border-purple-500 rounded px-2 py-1 text-xs w-24 text-right ${
                                isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                              }`}
                            />
                          ) : (
                            `Rp ${costVal.toLocaleString('id-ID')}`
                          )}
                        </td>
                        <td className="p-2.5 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editForm.sell_price ?? sellVal}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setEditForm({
                                  ...editForm,
                                  sell_price: v,
                                  sellingPrice: v,
                                  price_retail: v,
                                  price: v,
                                });
                              }}
                              className={`border border-purple-500 rounded px-2 py-1 text-xs w-24 text-right ${
                                isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                              }`}
                            />
                          ) : clearancePrice !== null ? (
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-slate-400 line-through">
                                Rp {sellVal.toLocaleString('id-ID')}
                              </span>
                              <span className="text-rose-600 dark:text-rose-400 font-bold">
                                Rp {clearancePrice.toLocaleString('id-ID')}
                              </span>
                            </div>
                          ) : (
                            `Rp ${sellVal.toLocaleString('id-ID')}`
                          )}
                        </td>
                        <td className="p-2.5 text-center font-mono whitespace-nowrap">
                          {isEditing && !isSvc ? (
                            <input
                              type="number"
                              min={0}
                              value={editForm.stock ?? sp.stock ?? 0}
                              onChange={(e) => setEditForm({ ...editForm, stock: Math.max(0, Number(e.target.value) || 0) })}
                              className={`border border-purple-500 rounded px-2 py-1 text-xs w-16 text-center ${
                                isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                              }`}
                            />
                          ) : isSvc ? (
                            '∞ Layanan'
                          ) : (
                            `${sp.stock} ${sp.unit || 'Pcs'}`
                          )}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveSpecialtyInlineEdit(sp)}
                                  className="px-2 py-1 bg-emerald-500 text-slate-950 font-medium rounded text-[10px] cursor-pointer"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-2 py-1 bg-slate-700 text-slate-200 font-medium rounded text-[10px] cursor-pointer"
                                >
                                  Batal
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextStatus = isServiceProductActive(sp) ? 'Inactive' : 'Active';
                                    persistProductEdit(sp, { status: nextStatus });
                                    showToast(
                                      `"${sp.name}" ${nextStatus === 'Active' ? 'diaktifkan di POS' : 'dinonaktifkan dari POS'}`,
                                      nextStatus === 'Active' ? 'success' : 'info'
                                    );
                                  }}
                                  className={`px-2 py-1 font-medium rounded text-[10px] border cursor-pointer ${
                                    isServiceProductActive(sp)
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25'
                                      : 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/30 hover:bg-slate-500/25'
                                  }`}
                                  title="Aktifkan / Nonaktifkan di POS"
                                >
                                  {isServiceProductActive(sp) ? 'Aktif' : 'Nonaktif'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(sp.id);
                                    setEditForm(sp);
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer ${
                                    isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                  }`}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setLabelModalProduct(sp)}
                                  className={`px-2 py-1 font-medium rounded text-[10px] border cursor-pointer ${
                                    isLight
                                      ? 'bg-cyan-50 hover:bg-cyan-500 text-cyan-800 hover:text-white border-cyan-400/70'
                                      : 'bg-cyan-950 hover:bg-cyan-600 text-cyan-300 hover:text-slate-950 border-cyan-800/50'
                                  }`}
                                >
                                  Label
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteProduct(sp.id);
                                    showToast(`"${sp.name}" dihapus dari katalog`, 'warning');
                                  }}
                                  className={`px-2 py-1 font-medium rounded text-[10px] border cursor-pointer ${
                                    isLight
                                      ? 'bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border-rose-300'
                                      : 'bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white border-rose-700/50'
                                  }`}
                                >
                                  Hapus
                                </button>
                              </>
                            )}
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
      )}

      {/* TAB MASTER STYLIST & PETUGAS (KHUSUS SEKTOR SERVICE) */}
      {activeTab === 'service_stylists' && <ServiceStylistMasterTab />}

      {/* MODAL QUICK BARCODE */}
      {showQuickBarcode && (
        <QuickBarcodeModal
          isOpen={showQuickBarcode}
          onClose={() => setShowQuickBarcode(false)}
          categoriesMaster={categoriesMaster || []}
          brands={brands || []}
          standardCategories={allStandardCategories}
          isLight={theme === 'light'}
          isEn={String(language).toLowerCase().includes('en')}
          onSave={(data) => {
            const costVal = Number(data.cost_price || 0);
            const sellVal = Number(data.sell_price || data.price_retail || 0);
            const memberVal = Number(data.price_wholesale || sellVal);
            const wholesaleVal = Number(data.price_distributor || sellVal);
            const newP: Product = {
              id: data.barcode.startsWith('INT-') ? data.barcode : `BR${Date.now().toString().slice(-6)}`,
              barcode: data.barcode,
              categoryCode: data.categoryCode || 10,
              category: data.category,
              name: toTitleCase(data.name),
              brand: data.brand,
              manufacturer: data.manufacturer,
              stock: data.stock,
              unit: data.unit,
              costPrice: costVal,
              cost_price: costVal,
              sellingPrice: sellVal,
              sell_price: sellVal,
              price_retail: Number(data.price_retail || sellVal),
              retailPrice: Number(data.price_retail || sellVal),
              price: Number(data.price_retail || sellVal),
              memberPrice: memberVal,
              price_member: memberVal,
              wholesalePrice: wholesaleVal,
              price_wholesale: wholesaleVal,
              price_distributor: wholesaleVal,
              taxable: data.taxable,
              status: data.stock > 0 ? 'Active' : 'Out of Stock',
            };
            addProduct(newP);
            setShowQuickBarcode(false);
          }}
        />
      )}

      {/* MODAL BARCODE SHELF LABEL STUDIO */}
      {labelModalProduct && (
        <BarcodeLabelStudioModal
          isOpen={!!labelModalProduct}
          product={labelModalProduct}
          allProducts={products}
          onClose={() => setLabelModalProduct(null)}
          language={String(language).toLowerCase().includes('en') ? 'EN' : 'ID'}
          isLight={theme === 'light'}
        />
      )}

      {/* MODAL MATRIKS VARIAN FASHION (UKURAN × WARNA) */}
      {matrixModalProduct && (() => {
        const sizes = Array.from(new Set(matrixDraftCells.map((c) => c.size)));
        const colors = Array.from(new Set(matrixDraftCells.map((c) => c.color)));
        const totalStock = sumVariantMatrixStock(matrixDraftCells);
        return (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setMatrixModalProduct(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden ${
                isLight ? 'bg-white border-purple-400 text-slate-900' : 'bg-slate-900 border-purple-500/40 text-slate-100'
              }`}
            >
              <div className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 ${
                isLight ? 'bg-purple-50 border-purple-200' : 'bg-slate-950/70 border-slate-800'
              }`}>
                <div>
                  <h3 className="text-sm font-bold text-purple-700 dark:text-purple-300">
                    Matriks Stok Varian (Ukuran × Warna) — {matrixModalProduct.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Edit stok per kombinasi ukuran &amp; warna. Total stok produk otomatis terhitung dan terhubung real-time ke POS &amp; Gudang.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMatrixModalProduct(null)}
                  className="px-2.5 py-1 rounded-lg text-xs border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Isi Massal Semua Sel:</span>
                    <input
                      type="number"
                      min={0}
                      value={matrixBatchQty}
                      onChange={(e) => setMatrixBatchQty(Math.max(0, Number(e.target.value) || 0))}
                      className={`w-16 px-2 py-1 rounded border font-mono text-xs text-center ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setMatrixDraftCells((prev) =>
                          prev.map((c) => ({ ...c, stock: matrixBatchQty }))
                        )
                      }
                      className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-medium cursor-pointer"
                    >
                      Terapkan ke {matrixDraftCells.length} Sel
                    </button>
                  </div>
                  <div className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35">
                    Total Stok Matriks: {totalStock} Pcs
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-950 text-slate-300'}>
                        <th className="p-2.5 text-left font-mono border-b border-slate-200 dark:border-slate-800">
                          UKURAN \ WARNA
                        </th>
                        {colors.map((color) => (
                          <th
                            key={color}
                            className="p-2.5 text-center font-semibold border-b border-slate-200 dark:border-slate-800"
                          >
                            {color}
                          </th>
                        ))}
                        <th className="p-2.5 text-center font-mono border-b border-slate-200 dark:border-slate-800">
                          SUBTOTAL
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizes.map((size) => {
                        const rowSum = matrixDraftCells
                          .filter((c) => c.size === size)
                          .reduce((acc, c) => acc + (c.stock || 0), 0);
                        return (
                          <tr key={size} className="border-b border-slate-200/70 dark:border-slate-800/70">
                            <td className="p-2.5 font-mono font-bold text-purple-700 dark:text-purple-300">
                              Size {size}
                            </td>
                            {colors.map((color) => {
                              const cellIdx = matrixDraftCells.findIndex(
                                (c) => c.size === size && c.color === color
                              );
                              const cell = cellIdx >= 0 ? matrixDraftCells[cellIdx] : null;
                              const val = cell?.stock ?? 0;
                              return (
                                <td key={`${size}-${color}`} className="p-2 text-center">
                                  <input
                                    type="number"
                                    min={0}
                                    value={val}
                                    onChange={(e) => {
                                      const nextQty = Math.max(0, Math.floor(Number(e.target.value) || 0));
                                      setMatrixDraftCells((prev) => {
                                        if (cellIdx >= 0) {
                                          return prev.map((c, idx) =>
                                            idx === cellIdx ? { ...c, stock: nextQty } : c
                                          );
                                        }
                                        return [
                                          ...prev,
                                          {
                                            size,
                                            color,
                                            stock: nextQty,
                                            skuVariant: `${matrixModalProduct.id}-${size}-${color}`,
                                          },
                                        ];
                                      });
                                    }}
                                    className={`w-16 px-2 py-1 rounded-lg border font-mono text-center text-xs outline-none ${
                                      val === 0
                                        ? 'border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-300'
                                        : val <= 2
                                        ? 'border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                        : isLight
                                        ? 'border-slate-300 bg-white text-slate-900'
                                        : 'border-slate-700 bg-slate-950 text-white'
                                    }`}
                                  />
                                </td>
                              );
                            })}
                            <td className="p-2.5 text-center font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                              {rowSum}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMatrixModalProduct(null)}
                    className={`px-4 py-2 rounded-xl border text-xs cursor-pointer ${
                      isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFashionMatrix}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Simpan Matriks Stok ({totalStock} Pcs)
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL PENGATURAN PROMO ARTIKEL FASHION (CLEARANCE & BUNDLE / MIX & MATCH) */}
      {fashionPromoModalProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setFashionPromoModalProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden ${
              isLight ? 'bg-white border-amber-400 text-slate-900' : 'bg-slate-900 border-amber-500/40 text-slate-100'
            }`}
          >
            <div className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 ${
              isLight ? 'bg-amber-50 border-amber-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div>
                <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  Pengaturan Promo Artikel — {fashionPromoModalProduct.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Harga Normal: Rp {(fashionPromoModalProduct.sell_price || 0).toLocaleString('id-ID')} • Aturan otomatis aktif di kasir POS.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFashionPromoModalProduct(null)}
                className="px-2.5 py-1 rounded-lg text-xs border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSaveFashionPromo} className="p-5 space-y-4 text-xs">
              <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                isLight ? 'bg-rose-50/50 border-rose-200' : 'bg-rose-950/20 border-rose-500/30'
              }`}>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-semibold text-rose-700 dark:text-rose-300">
                    1. Diskon Clearance Sale / Potongan Artikel
                  </span>
                  <input
                    type="checkbox"
                    checked={fashionPromoDraft.clearanceActive}
                    onChange={(e) =>
                      setFashionPromoDraft((p) => ({ ...p, clearanceActive: e.target.checked }))
                    }
                  />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Tipe Diskon</label>
                    <select
                      value={fashionPromoDraft.clearanceType}
                      onChange={(e) =>
                        setFashionPromoDraft((p) => ({
                          ...p,
                          clearanceType: e.target.value as 'PERCENT' | 'NOMINAL',
                        }))
                      }
                      className={`w-full px-2.5 py-1.5 rounded-lg border ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                      }`}
                    >
                      <option value="PERCENT">Persen (%)</option>
                      <option value="NOMINAL">Nominal (Rp)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">
                      Nilai ({fashionPromoDraft.clearanceType === 'PERCENT' ? '%' : 'Rp'})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={fashionPromoDraft.clearanceValue}
                      onChange={(e) =>
                        setFashionPromoDraft((p) => ({
                          ...p,
                          clearanceValue: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Label Promo</label>
                    <input
                      type="text"
                      value={fashionPromoDraft.clearanceLabel || ''}
                      onChange={(e) =>
                        setFashionPromoDraft((p) => ({ ...p, clearanceLabel: e.target.value }))
                      }
                      placeholder="Clearance Sale"
                      className={`w-full px-2.5 py-1.5 rounded-lg border ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/30'
              }`}>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    2. Promo Bundle / Mix &amp; Match Koleksi
                  </span>
                  <input
                    type="checkbox"
                    checked={fashionPromoDraft.bundleActive}
                    onChange={(e) =>
                      setFashionPromoDraft((p) => ({ ...p, bundleActive: e.target.checked }))
                    }
                  />
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-1">Mekanik Paket</label>
                    <select
                      value={fashionPromoDraft.bundleScope}
                      onChange={(e) =>
                        setFashionPromoDraft((p) => ({
                          ...p,
                          bundleScope: e.target.value as 'SAME_SKU' | 'MIX_MATCH_FASHION',
                        }))
                      }
                      className={`w-full px-2.5 py-1.5 rounded-lg border ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                      }`}
                    >
                      <option value="MIX_MATCH_FASHION">Mix &amp; Match Koleksi Fashion</option>
                      <option value="SAME_SKU">Khusus Artikel Ini (Lintas Ukuran/Warna)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Min. Qty (Pcs)</label>
                    <input
                      type="number"
                      min={2}
                      value={fashionPromoDraft.bundleMinQty}
                      onChange={(e) =>
                        setFashionPromoDraft((p) => ({
                          ...p,
                          bundleMinQty: Math.max(2, Number(e.target.value) || 2),
                        }))
                      }
                      className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Tipe Potongan</label>
                    <select
                      value={fashionPromoDraft.bundleDiscountType}
                      onChange={(e) =>
                        setFashionPromoDraft((p) => ({
                          ...p,
                          bundleDiscountType: e.target.value as 'PERCENT' | 'NOMINAL',
                        }))
                      }
                      className={`w-full px-2.5 py-1.5 rounded-lg border ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                      }`}
                    >
                      <option value="NOMINAL">Rp / Pcs</option>
                      <option value="PERCENT">Persen (%)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">
                      Nilai Potongan ({fashionPromoDraft.bundleDiscountType === 'PERCENT' ? '%' : 'Rp/pcs'})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={fashionPromoDraft.bundleDiscountValue}
                      onChange={(e) =>
                        setFashionPromoDraft((p) => ({
                          ...p,
                          bundleDiscountValue: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Nama / Label Bundle</label>
                    <input
                      type="text"
                      value={fashionPromoDraft.bundleLabel || ''}
                      onChange={(e) =>
                        setFashionPromoDraft((p) => ({ ...p, bundleLabel: e.target.value }))
                      }
                      placeholder="Beli 2 Lebih Hemat"
                      className={`w-full px-2.5 py-1.5 rounded-lg border ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border text-[11px] ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}>
                Anti-Tumpuk Aktif: Jika Clearance &amp; Bundle sama-sama memenuhi syarat di kasir, sistem otomatis memilih potongan yang paling menguntungkan pelanggan tanpa diskon ganda.
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFashionPromoModalProduct(null)}
                  className={`px-4 py-2 rounded-xl border text-xs cursor-pointer ${
                    isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold cursor-pointer"
                >
                  Simpan Pengaturan Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterDataModule;