import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Scan,
  Barcode,
  Sparkles,
  CheckCircle2,
  X,
  Layers,
  Building2,
  Package,
  MapPin,
  Boxes,
  Zap,
  ShieldCheck,
  TrendingUp,
  Percent,
  Hash,
  AlertTriangle,
} from 'lucide-react';
import { CategoryMaster, BrandMaster } from '../../types';

export interface StandardCategoryOption {
  code: number;
  name: string;
  keywords?: string[];
}

const FALLBACK_STANDARD_CATEGORIES: StandardCategoryOption[] = [
  { code: 2, name: 'Powder Detergent' },
  { code: 3, name: 'Powder Milk' },
  { code: 5, name: 'Cooking Oil' },
  { code: 10, name: 'Snack' },
  { code: 13, name: 'Mineral Water' },
  { code: 21, name: 'Toilet Soap' },
  { code: 22, name: 'Tooth Paste' },
  { code: 26, name: 'Shampoo' },
  { code: 63, name: 'Coffee' },
  { code: 90, name: 'Instant Noodle' },
  { code: 100, name: 'RTD Tea (Ready to Drink Tea)' },
  { code: 342, name: 'Rice' },
  { code: 344, name: 'Sugar' },
];

interface QuickBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoriesMaster: CategoryMaster[];
  brands: BrandMaster[];
  standardCategories?: StandardCategoryOption[];
  onSave: (data: {
    barcode: string;
    categoryCode: number;
    category: string;
    name: string;
    brand: string;
    manufacturer: string;
    stock: number;
    unit: string;
    cost_price: number;
    sell_price: number;
    price_retail: number;
    price_wholesale: number;
    price_distributor: number;
    taxable: boolean;
    rackLocation?: string;
  }) => void;
  isLight: boolean;
  isEn: boolean;
}

export const QuickBarcodeModal: React.FC<QuickBarcodeModalProps> = ({
  isOpen,
  onClose,
  categoriesMaster,
  brands,
  standardCategories,
  onSave,
  isLight,
  isEn,
}) => {
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const categoryDictionary = useMemo(() => {
    const list = standardCategories && standardCategories.length > 0
      ? standardCategories
      : FALLBACK_STANDARD_CATEGORIES;
    return [...list].sort((a, b) => a.code - b.code);
  }, [standardCategories]);

  // Form State (Urutan: Barcode/ID -> No & Nama Kategori -> Nama Produk -> Brand -> Harga & Stok)
  const [barcode, setBarcode] = useState('');
  const [categoryCode, setCategoryCode] = useState<number>(10);
  const [category, setCategory] = useState('Snack');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [stock, setStock] = useState<number>(20);
  const [unit, setUnit] = useState('PCS');
  const [rackLocation, setRackLocation] = useState('Rak A-01');

  // 3-Tier Pricing Matrix & Tax
  const [costPrice, setCostPrice] = useState<number>(5000);
  const [priceRetail, setPriceRetail] = useState<number>(6000); // Tier 1: Retail (+20%)
  const [priceWholesale, setPriceWholesale] = useState<number>(5800); // Tier 2: Member (+15%)
  const [priceDistributor, setPriceDistributor] = useState<number>(5500); // Tier 3: Grosir (+10%)
  const [taxable, setTaxable] = useState<boolean>(false);

  // Feedback banners
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getMargin = (price: number, cost: number) => {
    if (price <= 0) return { percent: '0.0', num: 0, isLoss: false, isLow: false };
    const margin = ((price - cost) / price) * 100;
    return {
      percent: margin.toFixed(1),
      num: margin,
      isLoss: margin < 0,
      isLow: margin >= 0 && margin < 10,
    };
  };

  // Sinkronisasi No Kategori <-> Nama Kategori
  const handleSelectCategoryCode = (code: number) => {
    setCategoryCode(code);
    const found = categoryDictionary.find((c) => c.code === code);
    if (found) {
      setCategory(found.name);
    }
  };

  const handleCategoryNameChange = (val: string) => {
    setCategory(val);
    const clean = val.trim().toLowerCase();
    const matched = categoryDictionary.find(
      (c) =>
        c.name.toLowerCase() === clean ||
        c.keywords?.some((kw) => clean.includes(kw))
    );
    if (matched) {
      setCategoryCode(matched.code);
    }
  };

  // Auto-detect kategori & brand saat mengetik nama produk jika belum diisi manual
  const handleNameChange = (val: string) => {
    setName(val);
    setValidationError(null);
    const low = val.toLowerCase().trim();
    if (low.length >= 3) {
      const matched = categoryDictionary.find((c) =>
        c.keywords?.some((kw) => low.includes(kw))
      );
      if (matched) {
        setCategoryCode(matched.code);
        setCategory(matched.name);
      }
    }
  };

  // Hitung otomatis harga +20% / +15% / +10%
  const applyStandardMarginPricing = (hpp: number) => {
    const safeHpp = Math.max(0, Number(hpp) || 0);
    setCostPrice(safeHpp);
    setPriceRetail(Math.ceil((safeHpp * 1.2) / 100) * 100);
    setPriceWholesale(Math.ceil((safeHpp * 1.15) / 100) * 100);
    setPriceDistributor(Math.ceil((safeHpp * 1.1) / 100) * 100);
  };

  // Quick Sample Pre-fills
  const handleLoadSample = (sampleType: 'drink' | 'snack' | 'nonbarcode' | 'detergent') => {
    setValidationError(null);
    setLastSavedMessage(null);

    if (sampleType === 'drink') {
      const rnd = Math.floor(100000000 + Math.random() * 900000000);
      setBarcode(`899${rnd}`);
      handleSelectCategoryCode(100);
      setName('Teh Botol Sosro Original 450ml');
      setBrand('SOSRO');
      setManufacturer('PT Sinar Sosro');
      setStock(48);
      setUnit('BTL');
      applyStandardMarginPricing(4200);
      setTaxable(false);
      setRackLocation('Chiller Depan-01');
    } else if (sampleType === 'snack') {
      const rnd = Math.floor(100000000 + Math.random() * 900000000);
      setBarcode(`899${rnd}`);
      handleSelectCategoryCode(10);
      setName('Chitato Sapi Panggang 68g');
      setBrand('CHITATO');
      setManufacturer('PT Indofood CBP Sukses Makmur');
      setStock(60);
      setUnit('PACK');
      applyStandardMarginPricing(8900);
      setTaxable(true);
      setRackLocation('Rak Snack B-02');
    } else if (sampleType === 'nonbarcode') {
      const rnd = Math.floor(1000 + Math.random() * 9000);
      setBarcode(`INT-${rnd}`);
      handleSelectCategoryCode(342);
      setName('Beras Pandan Wangi Premium Curah 5 Kg');
      setBrand('PANDAN WANGI');
      setManufacturer('Mitra Tani Lokal');
      setStock(35);
      setUnit('KG');
      applyStandardMarginPricing(68000);
      setTaxable(false);
      setRackLocation('Zona Sembako C-01');
    } else {
      const rnd = Math.floor(100000000 + Math.random() * 900000000);
      setBarcode(`899${rnd}`);
      handleSelectCategoryCode(2);
      setName('Rinso Anti Noda Powder Detergent 770gr');
      setBrand('RINSO');
      setManufacturer('PT Unilever Indonesia');
      setStock(40);
      setUnit('PACK');
      applyStandardMarginPricing(18500);
      setTaxable(true);
      setRackLocation('Lorong Kebersihan D-03');
    }
  };

  // Generate Barcode Pabrikan (EAN-13 style 899...)
  const handleGenerateBarcode = () => {
    const rnd = Math.floor(100000000 + Math.random() * 900000000);
    setBarcode(`899${rnd}`);
    setValidationError(null);
    setLastSavedMessage(null);
  };

  // Generate ID Internal Non-Barcode (INT-XXXX)
  const handleGenerateInternalId = () => {
    const rnd = Math.floor(1000 + Math.random() * 9000);
    setBarcode(`INT-${rnd}`);
    setValidationError(null);
    setLastSavedMessage(null);
  };

  // Submit & Distribute
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);

    if (!barcode.trim()) {
      setValidationError(
        isEn
          ? 'Barcode / Internal ID (INT-XXXX) is required!'
          : 'Barcode atau ID Non-Barcode (INT-XXXX) wajib diisi!'
      );
      barcodeInputRef.current?.focus();
      return;
    }

    if (!name.trim()) {
      setValidationError(
        isEn ? 'Product name is required!' : 'Nama Produk wajib diisi!'
      );
      return;
    }

    const matchedDict = categoryDictionary.find((c) => c.code === Number(categoryCode));
    const finalCategory = category.trim() || matchedDict?.name || 'Snack';
    const firstWordBrand = name.trim().split(/\s+/)[0]?.toUpperCase() || 'GENERIC';
    const finalBrand = brand.trim() || firstWordBrand;
    const finalManufacturer = manufacturer.trim() || 'Principal Mitra';

    onSave({
      barcode: barcode.trim(),
      categoryCode: Number(categoryCode) || 10,
      category: finalCategory,
      name: name.trim(),
      brand: finalBrand,
      manufacturer: finalManufacturer,
      stock: Number(stock) || 0,
      unit: unit.trim() || 'PCS',
      cost_price: Number(costPrice) || 0,
      sell_price: Number(priceRetail) || Math.ceil(Number(costPrice) * 1.2),
      price_retail: Number(priceRetail) || 0,
      price_wholesale: Number(priceWholesale) || Math.ceil(Number(costPrice) * 1.15),
      price_distributor: Number(priceDistributor) || Math.ceil(Number(costPrice) * 1.1),
      taxable,
      rackLocation: rackLocation.trim() || 'Gudang Utama',
    });

    const savedProductName = name;

    // Reset Form
    setBarcode('');
    setCategoryCode(10);
    setCategory('Snack');
    setName('');
    setBrand('');
    setManufacturer('');
    setStock(20);
    setUnit('PCS');
    applyStandardMarginPricing(5000);
    setTaxable(false);
    setRackLocation('Rak A-01');

    setLastSavedMessage(
      isEn
        ? `"${savedProductName}" saved with category ${categoryCode} and 3 pricing tiers! Ready for next item.`
        : `"${savedProductName}" tersimpan (No Kategori ${categoryCode} - ${finalCategory}) dengan 3 tier harga! Siap input berikutnya.`
    );

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  const retailMargin = getMargin(priceRetail, costPrice);
  const wholesaleMargin = getMargin(priceWholesale, costPrice);
  const distributorMargin = getMargin(priceDistributor, costPrice);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div
        className={`w-full max-w-4xl rounded-2xl border flex flex-col shadow-2xl overflow-hidden my-auto transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-400/40'
            : 'bg-[#161b22] border-[#30363d] text-[#e6edf3] shadow-black/80'
        }`}
        style={{
          boxShadow: isLight
            ? '0 20px 40px rgba(0,0,0,0.15)'
            : '0 0 40px rgba(16,185,129,0.15)',
        }}
      >
        {/* Top Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between gap-3 ${
            isLight
              ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-slate-200 text-slate-900'
              : 'bg-[#0d1117] border-[#30363d]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isLight
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
            >
              <Package className={`w-5 h-5 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-base tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {isEn ? 'Quick Barcode / Non-Barcode SKU Entry' : 'Input Cepat SKU (Barcode & Non-Barcode)'}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono border ${
                    isLight
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  SKEMA BAKU RETAILOS
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {isEn
                  ? 'Aligned identity flow: Barcode / INT-ID -> Category Code -> Product Name -> Brand -> Pricing & Stock.'
                  : 'Urutan baku: Barcode / ID Internal -> No & Nama Kategori -> Nama Produk -> Brand -> Harga & Stok.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Simulation Samples Bar */}
        <div
          className={`px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
            isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-[#10141a] border-[#30363d]'
          }`}
        >
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${isLight ? 'text-slate-800' : 'text-slate-400'}`}>
            <Zap className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
            <span>{isEn ? 'Quick Template Samples:' : 'Simulasi Uji Cepat:'}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleLoadSample('drink')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}
            >
              + Minuman (100)
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('snack')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition ${
                isLight
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              + Snack (10)
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('nonbarcode')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition ${
                isLight
                  ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-300'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
              }`}
            >
              + Non-Barcode (INT-ID)
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('detergent')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition ${
                isLight
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-300'
                  : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30'
              }`}
            >
              + Deterjen (2)
            </button>
          </div>
        </div>

        {/* Inline Validation Error */}
        {validationError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-500 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-xs underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Live Feedback Toast for Continuous Scanning */}
        {lastSavedMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-500 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{lastSavedMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setLastSavedMessage(null)}
              className="text-emerald-500 hover:underline text-xs cursor-pointer"
            >
              OK
            </button>
          </div>
        )}

        {/* Form Body — Disusun berurutan sesuai skema Katalog SKU */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* 1. BARCODE / ID NON-BARCODE */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                className={`text-xs font-bold flex items-center gap-1.5 tracking-wide ${
                  isLight ? 'text-teal-800' : 'text-emerald-400'
                }`}
              >
                <Barcode className="w-4 h-4" />
                <span>
                  {isEn
                    ? '1. BARCODE / INTERNAL NON-BARCODE ID *'
                    : '1. BARCODE / ID NON-BARCODE *'}
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateInternalId}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1 cursor-pointer font-bold transition ${
                    isLight
                      ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
                  }`}
                >
                  <Hash className="w-3 h-3" />
                  <span>{isEn ? 'Auto ID Non-Barcode (INT-XXXX)' : 'Buat ID Non-Barcode (INT-XXXX)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1 cursor-pointer font-bold transition ${
                    isLight
                      ? 'bg-teal-50 hover:bg-teal-100 border-teal-300 text-teal-800'
                      : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40 text-cyan-300'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isEn ? 'Generate Barcode (899...)' : 'Generate Barcode (899...)'}</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                ref={barcodeInputRef}
                id="input-quick-barcode"
                type="text"
                value={barcode}
                onChange={(e) => {
                  setBarcode(e.target.value);
                  setValidationError(null);
                }}
                placeholder={
                  isEn
                    ? 'Scan barcode or click Auto ID Non-Barcode (INT-XXXX)...'
                    : 'Pindai barcode pabrikan atau klik Buat ID Non-Barcode (INT-XXXX)...'
                }
                className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 font-mono text-sm tracking-wider transition focus:outline-none placeholder:italic placeholder:font-normal placeholder:tracking-normal ${
                  isLight
                    ? 'bg-white border-teal-500 text-slate-900 placeholder:text-slate-400/75 focus:border-teal-600 focus:ring-2 focus:ring-teal-400/30'
                    : 'bg-[#0d1117] border-emerald-500/60 text-emerald-300 placeholder:text-slate-500/60 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                }`}
              />
              <Scan className={`w-5 h-5 absolute left-3 top-3.5 ${isLight ? 'text-teal-700' : 'text-emerald-400'}`} />
            </div>
          </div>

          {/* 2. NO KATEGORI & NAMA KATEGORI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                <Hash className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                <span>{isEn ? '2a. Category Code (2 - 471)' : '2a. No Kategori (2 – 471)'}</span>
              </label>
              <select
                value={categoryCode}
                onChange={(e) => handleSelectCategoryCode(Number(e.target.value))}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold transition focus:outline-none cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                    : 'bg-[#0d1117] border-[#30363d] text-amber-300 focus:border-[#00f2fe]'
                }`}
              >
                {categoryDictionary.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.code} — {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                <Layers className={`w-3.5 h-3.5 ${isLight ? 'text-teal-700' : 'text-cyan-400'}`} />
                <span>{isEn ? '2b. Official Category Name' : '2b. Nama Kategori'}</span>
              </label>
              <input
                type="text"
                list="category-options-list"
                value={category}
                onChange={(e) => handleCategoryNameChange(e.target.value)}
                placeholder="Otomatis mengikuti No Kategori..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none placeholder:italic ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400/75 focus:border-cyan-500'
                    : 'bg-[#0d1117] border-[#30363d] text-white placeholder:text-slate-500/60 focus:border-[#00f2fe]'
                }`}
              />
              <datalist id="category-options-list">
                {categoryDictionary.map((c) => (
                  <option key={`std-cat-${c.code}`} value={c.name}>
                    {c.code}
                  </option>
                ))}
                {categoriesMaster.map((c, cIdx) => (
                  <option key={`quick-cat-${c.id}-${cIdx}`} value={c.name}>
                    {c.department}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          {/* 3. NAMA PRODUK */}
          <div className="space-y-1.5">
            <label className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {isEn ? '3. Product Name (Long Description) *' : '3. Nama Produk Lengkap (Long Description) *'}
            </label>
            <input
              id="input-quick-product-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Contoh: Indomie Goreng Spesial 85gr / Beras Pandan Wangi Curah 5 Kg"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none placeholder:italic ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400/75 focus:border-cyan-500'
                  : 'bg-[#0d1117] border-[#30363d] text-white placeholder:text-slate-500/60 focus:border-[#00f2fe]'
              }`}
            />
          </div>

          {/* 4. BRAND + Manufaktur & Lokasi Rak */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                <Building2 className={`w-3.5 h-3.5 ${isLight ? 'text-teal-700' : 'text-cyan-400'}`} />
                <span>{isEn ? '4. Brand' : '4. Brand / Merek'}</span>
              </label>
              <input
                type="text"
                list="brand-options-list"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Pilih atau ketik Brand..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none placeholder:italic ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400/75 focus:border-cyan-500'
                    : 'bg-[#0d1117] border-[#30363d] text-white placeholder:text-slate-500/60 focus:border-[#00f2fe]'
                }`}
              />
              <datalist id="brand-options-list">
                {brands.map((b, idx) => (
                  <option key={`${b.id}-${idx}`} value={b.name}>
                    {b.manufacturer}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {isEn ? 'Manufacturer / Principal' : 'Manufaktur / Principal'}
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="PT Indofood CBP, Unilever..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none placeholder:italic ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400/75 focus:border-cyan-500'
                    : 'bg-[#0d1117] border-[#30363d] text-white placeholder:text-slate-500/60 focus:border-[#00f2fe]'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                <MapPin className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                <span>{isEn ? 'Rack / Shelf Location' : 'Titik Rak / Lokasi'}</span>
              </label>
              <input
                type="text"
                value={rackLocation}
                onChange={(e) => setRackLocation(e.target.value)}
                placeholder="Rak A-02, Chiller Depan..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none placeholder:italic ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400/75 focus:border-cyan-500'
                    : 'bg-[#0d1117] border-[#30363d] text-white placeholder:text-slate-500/60 focus:border-[#00f2fe]'
                }`}
              />
            </div>
          </div>

          {/* 5. HARGA & STOK */}
          {/* 5a. 3-Tier Pricing Matrix */}
          <div
            className={`p-4 rounded-xl border ${
              isLight
                ? 'bg-gradient-to-br from-teal-50/60 via-white to-sky-50/60 border-teal-200 shadow-xs'
                : 'bg-[#0e1622] border-cyan-500/30'
            }`}
          >
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b ${
                isLight ? 'border-teal-200' : 'border-cyan-500/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-4 h-4 ${isLight ? 'text-teal-700' : 'text-[#00f2fe]'}`} />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-teal-800' : 'text-[#00f2fe]'}`}>
                  {isEn ? '5. HPP & Multi-Tier Pricing Matrix' : '5. HPP & Matriks Harga (+20% / +15% / +10%)'}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-slate-300'}`}>
                  {isEn ? 'HPP Modal:' : 'HPP Modal:'}
                </span>
                <div className="relative w-36">
                  <span className="absolute left-2.5 top-1.5 text-xs text-slate-500 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={costPrice}
                    onChange={(e) => applyStandardMarginPricing(parseFloat(e.target.value) || 0)}
                    className={`w-full pl-8 pr-2.5 py-1 rounded-lg border text-xs font-mono font-bold transition focus:outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-emerald-800 focus:border-emerald-500'
                        : 'bg-[#0d1117] border-[#30363d] text-emerald-400 focus:border-emerald-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3.5">
              {/* Retail (+20%) */}
              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-blue-200 shadow-xs' : 'bg-[#121b28] border-blue-500/40'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded uppercase border ${
                    isLight ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  }`}>
                    Retail (+20%)
                  </span>
                  <div className={`flex items-center gap-1 text-[11px] font-bold font-mono px-2 py-0.5 rounded ${
                    retailMargin.isLoss
                      ? 'bg-rose-500/20 text-rose-400'
                      : retailMargin.isLow
                      ? 'bg-amber-500/20 text-amber-400'
                      : isLight
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <Percent className="w-3 h-3" />
                    <span>{retailMargin.percent}%</span>
                  </div>
                </div>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={priceRetail}
                    onChange={(e) => setPriceRetail(parseFloat(e.target.value) || 0)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm font-mono font-bold transition focus:outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500' : 'bg-[#0d1117] border-[#30363d] text-[#00f2fe] focus:border-[#00f2fe]'
                    }`}
                  />
                </div>
              </div>

              {/* Member (+15%) */}
              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-purple-200 shadow-xs' : 'bg-[#17132a] border-purple-500/40'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded uppercase border ${
                    isLight ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                  }`}>
                    Member (+15%)
                  </span>
                  <div className={`flex items-center gap-1 text-[11px] font-bold font-mono px-2 py-0.5 rounded ${
                    wholesaleMargin.isLoss
                      ? 'bg-rose-500/20 text-rose-400'
                      : wholesaleMargin.isLow
                      ? 'bg-amber-500/20 text-amber-400'
                      : isLight
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-purple-400/20 text-purple-300'
                  }`}>
                    <Percent className="w-3 h-3" />
                    <span>{wholesaleMargin.percent}%</span>
                  </div>
                </div>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={priceWholesale}
                    onChange={(e) => setPriceWholesale(parseFloat(e.target.value) || 0)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm font-mono font-bold transition focus:outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-purple-500' : 'bg-[#0d1117] border-[#30363d] text-purple-400 focus:border-purple-400'
                    }`}
                  />
                </div>
              </div>

              {/* Grosir (+10%) */}
              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-white border-emerald-200 shadow-xs' : 'bg-[#0f1d1b] border-emerald-500/40'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded uppercase border ${
                    isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}>
                    Grosir (+10%)
                  </span>
                  <div className={`flex items-center gap-1 text-[11px] font-bold font-mono px-2 py-0.5 rounded ${
                    distributorMargin.isLoss
                      ? 'bg-rose-500/20 text-rose-400'
                      : distributorMargin.isLow
                      ? 'bg-amber-500/20 text-amber-400'
                      : isLight
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-emerald-400/20 text-emerald-300'
                  }`}>
                    <Percent className="w-3 h-3" />
                    <span>{distributorMargin.percent}%</span>
                  </div>
                </div>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={priceDistributor}
                    onChange={(e) => setPriceDistributor(parseFloat(e.target.value) || 0)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm font-mono font-bold transition focus:outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500' : 'bg-[#0d1117] border-[#30363d] text-emerald-400 focus:border-emerald-400'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5b. Stok Awal, Satuan & Status PPN */}
          <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f141c] border-[#30363d]'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Boxes className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                <span className={`text-xs font-bold tracking-wide uppercase ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {isEn ? 'Initial Stock, Unit & PPN Status' : 'Stok Awal Fisik, Satuan & Pajak (PPN)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {isEn ? 'Initial Stock' : 'Stok Awal'} *
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-mono font-bold transition focus:outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                      : 'bg-[#0d1117] border-[#30363d] text-emerald-400 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {isEn ? 'Unit (UoM)' : 'Satuan (UoM)'} *
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-mono transition focus:outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                      : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#00f2fe]'
                  }`}
                >
                  <option value="PCS">PCS</option>
                  <option value="PACK">PACK</option>
                  <option value="BOX">BOX</option>
                  <option value="BTL">BOTOL (BTL)</option>
                  <option value="KG">KILOGRAM (KG)</option>
                  <option value="PORSI">PORSI</option>
                  <option value="UNIT">UNIT</option>
                  <option value="STRIP">STRIP</option>
                  <option value="KARTON">KARTON</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={`text-xs font-bold flex items-center justify-between ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  <span>{isEn ? 'Tax Status (PPN)' : 'Status Pajak (PPN)'}</span>
                  <span className={`text-[10px] font-mono font-bold ${taxable ? 'text-amber-500' : 'text-slate-400'}`}>
                    {taxable ? 'PPN 11%' : 'NON-PPN'}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setTaxable(!taxable)}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    taxable
                      ? isLight
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                      : isLight
                      ? 'bg-white border-slate-300 text-slate-800'
                      : 'bg-[#0d1117] border-[#30363d] text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    {taxable ? 'Kena Pajak (11%)' : 'Non-PPN (0%)'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/10">
                    {taxable ? '11%' : '0%'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className={`pt-3 border-t flex items-center justify-between gap-3 ${
              isLight ? 'border-slate-200' : 'border-gray-700/40'
            }`}
          >
            <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {isEn
                ? 'Tip: Press "Enter" to save and scan the next product.'
                : 'Tip: Tekan Enter untuk simpan & langsung input SKU berikutnya.'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  isLight
                    ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isEn ? 'Close' : 'Tutup'}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer transition font-mono"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEn ? 'SAVE TO CATALOG' : 'SIMPAN KE KATALOG SKU'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
