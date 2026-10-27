import React, { useState, useRef, useEffect } from 'react';
import {
  Scan,
  Barcode,
  Sparkles,
  CheckCircle2,
  X,
  Plus,
  Layers,
  Building2,
  Package,
  MapPin,
  DollarSign,
  Boxes,
  Zap,
  Tag,
  ShieldCheck,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { CategoryMaster, BrandMaster } from '../../types';

interface QuickBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoriesMaster: CategoryMaster[];
  brands: BrandMaster[];
  onSave: (data: {
    barcode: string;
    name: string;
    category: string;
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
  onSave,
  isLight,
  isEn,
}) => {
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [stock, setStock] = useState<number>(20);
  const [unit, setUnit] = useState('PCS');
  const [rackLocation, setRackLocation] = useState('Rak A-01');

  // 3-Tier Pricing Matrix & Tax
  const [costPrice, setCostPrice] = useState<number>(5000);
  const [priceRetail, setPriceRetail] = useState<number>(7500); // Tier 1: Eceran
  const [priceWholesale, setPriceWholesale] = useState<number>(6800); // Tier 2: Partai
  const [priceDistributor, setPriceDistributor] = useState<number>(6200); // Tier 3: Distributor
  const [taxable, setTaxable] = useState<boolean>(false); // Non-PPN vs PPN 11%

  // Success indicator message for rapid sequential scanning
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);

  // Auto focus barcode input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Margin calculation helper: ((Price - Cost) / Price) * 100
  const getMargin = (price: number, cost: number) => {
    if (price <= 0) return { percent: '0.0', num: 0, isLoss: false };
    const margin = ((price - cost) / price) * 100;
    return {
      percent: margin.toFixed(1),
      num: margin,
      isLoss: margin < 0,
      isLow: margin >= 0 && margin < 10,
    };
  };

  // Quick Sample Pre-fills
  const handleLoadSample = (sampleType: 'drink' | 'snack' | 'med' | 'gadget') => {
    if (sampleType === 'drink') {
      const rnd = Math.floor(10000000 + Math.random() * 90000000);
      setBarcode(`899${rnd}`);
      setName('Teh Botol Sosro Original 450ml');
      setCategory('Minuman Siap Saji');
      setBrand('Sosro');
      setManufacturer('PT Sinar Sosro');
      setStock(48);
      setUnit('BTL');
      setCostPrice(4200);
      setPriceRetail(6500);
      setPriceWholesale(5800);
      setPriceDistributor(5200);
      setTaxable(false);
      setRackLocation('Chiller Depan-01');
    } else if (sampleType === 'snack') {
      const rnd = Math.floor(10000000 + Math.random() * 90000000);
      setBarcode(`899${rnd}`);
      setName('Chitato Sapi Panggang 68g');
      setCategory('Makanan Ringan');
      setBrand('Chitato');
      setManufacturer('PT Indofood CBP Sukses Makmur');
      setStock(60);
      setUnit('BKS');
      setCostPrice(8900);
      setPriceRetail(12500);
      setPriceWholesale(11200);
      setPriceDistributor(10200);
      setTaxable(true);
      setRackLocation('Rak Snack B-02');
    } else if (sampleType === 'med') {
      const rnd = Math.floor(10000000 + Math.random() * 90000000);
      setBarcode(`899${rnd}`);
      setName('Panadol Extra Paracetamol 500mg Strip 10s');
      setCategory('Obat Bebas');
      setBrand('Panadol');
      setManufacturer('PT Glaxo Wellcome Indonesia');
      setStock(100);
      setUnit('STRIP');
      setCostPrice(10500);
      setPriceRetail(14000);
      setPriceWholesale(12800);
      setPriceDistributor(11900);
      setTaxable(false);
      setRackLocation('Etalase Obat A-01');
    } else {
      const rnd = Math.floor(10000000 + Math.random() * 90000000);
      setBarcode(`35${rnd}12345`);
      setName('Samsung Galaxy Buds FE Graphite Edition');
      setCategory('Gadget & Aksesoris');
      setBrand('Samsung');
      setManufacturer('Samsung Electronics');
      setStock(12);
      setUnit('UNIT');
      setCostPrice(980000);
      setPriceRetail(1299000);
      setPriceWholesale(1199000);
      setPriceDistributor(1099000);
      setTaxable(true);
      setRackLocation('Etalase Kaca VIP');
    }
    setLastSavedMessage(null);
  };

  // Generate random barcode
  const handleGenerateBarcode = () => {
    const rnd = Math.floor(100000000 + Math.random() * 900000000);
    setBarcode(`899${rnd}`);
    setLastSavedMessage(null);
  };

  // Submit & Distribute
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!barcode.trim()) {
      alert(isEn ? 'Barcode / SKU is required!' : 'Kode Barcode / SKU wajib diisi!');
      barcodeInputRef.current?.focus();
      return;
    }

    if (!name.trim()) {
      alert(isEn ? 'Product name is required!' : 'Nama Produk wajib diisi!');
      return;
    }

    const finalCategory = category.trim() || 'General Merchandise';
    const finalBrand = brand.trim() || 'General Brand';
    const finalManufacturer = manufacturer.trim() || 'Principal Mitra';

    // Fire auto distribution handler
    onSave({
      barcode: barcode.trim(),
      name: name.trim(),
      category: finalCategory,
      brand: finalBrand,
      manufacturer: finalManufacturer,
      stock: Number(stock) || 0,
      unit: unit.trim() || 'PCS',
      cost_price: Number(costPrice) || 0,
      sell_price: Number(priceRetail) || Number(costPrice) * 1.25,
      price_retail: Number(priceRetail) || 0,
      price_wholesale: Number(priceWholesale) || Number(priceRetail) * 0.92,
      price_distributor: Number(priceDistributor) || Number(priceRetail) * 0.85,
      taxable,
      rackLocation: rackLocation.trim() || 'Gudang Utama',
    });

    const savedProductName = name;

    // Reset Form for immediate sequential scanning
    setBarcode('');
    setName('');
    setCategory('');
    setBrand('');
    setManufacturer('');
    setStock(20);
    setUnit('PCS');
    setCostPrice(5000);
    setPriceRetail(7500);
    setPriceWholesale(6800);
    setPriceDistributor(6200);
    setTaxable(false);
    setRackLocation('Rak A-01');

    // Notify user of success and keep focus on barcode input
    setLastSavedMessage(
      isEn
        ? `✓ "${savedProductName}" saved with 3 pricing tiers! Ready for next product.`
        : `✓ "${savedProductName}" tersimpan dengan matriks 3 tingkat harga! Siap input barcode berikutnya.`
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
        {/* Top Header: Input Data Produk / Master Item */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between gap-3 ${
            isLight
              ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-slate-200 text-slate-900'
              : 'bg-[#0d1117] border-[#30363d]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isLight
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            }`}>
              <Package className={`w-5 h-5 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
                  {isEn ? 'Product / Master Item Entry' : 'Input Data Produk / Master Item'}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono border ${
                  isLight
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}>
                  3-TIER PRICING READY
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {isEn
                  ? 'Flexible input via hardware Barcode Scanner (auto-capture) or manual entry / auto-generated code.'
                  : 'Input fleksibel via Barcode Scanner hardware (auto-capture) maupun pencatatan manual / generate kode otomatis.'}
              </p>
            </div>
          </div>

          <button
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
          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-400 text-[11px] font-semibold">
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
              + {isEn ? 'Drink (F&B)' : 'Minuman RTD'}
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
              + {isEn ? 'Snack (PPN)' : 'Snack (PPN)'}
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('med')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition ${
                isLight
                  ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-300'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
              }`}
            >
              + {isEn ? 'Pharmacy' : 'Obat / Apotek'}
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('gadget')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition ${
                isLight
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-300'
                  : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30'
              }`}
            >
              + {isEn ? 'Gadget VIP' : 'Gadget Elektronik'}
            </button>
          </div>
        </div>

        {/* Live Feedback Toast for Continuous Scanning */}
        {lastSavedMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{lastSavedMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setLastSavedMessage(null)}
              className="text-emerald-400/80 hover:text-emerald-300 text-xs underline cursor-pointer"
            >
              OK
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Primary Row: Barcode input with Auto-Focus + Random Generator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold flex items-center gap-1.5 tracking-wide ${
                isLight ? 'text-teal-800 dark:text-cyan-400' : 'text-emerald-400'
              }`}>
                <Barcode className="w-4 h-4" />
                <span>{isEn ? 'HARDWARE BARCODE SCANNER / SKU CODE' : 'KODE BARCODE SCANNER / SKU'} *</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className={`text-xs flex items-center gap-1 cursor-pointer font-semibold ${
                  isLight ? 'text-teal-700 hover:text-teal-900' : 'text-cyan-400 hover:text-cyan-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isEn ? 'Auto-Generate Barcode' : 'Generate Kode Otomatis'}</span>
              </button>
            </div>

            <div className="relative">
              <input
                ref={barcodeInputRef}
                id="input-quick-barcode"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder={
                  isEn
                    ? 'Scan barcode item with scanner or type code...'
                    : 'Arahkan scanner ke barcode produk atau ketik manual...'
                }
                required
                className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 font-mono text-sm tracking-wider transition focus:outline-none ${
                  isLight
                    ? 'bg-white border-teal-500 text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-400/30'
                    : 'bg-[#0d1117] border-emerald-500/60 text-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                }`}
              />
              <Scan className={`w-5 h-5 absolute left-3 top-3.5 ${isLight ? 'text-teal-700' : 'text-emerald-400'}`} />
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {isEn
                ? 'Scanner hardware automatically sends "Enter" keystroke, moving seamlessly to product name or quick saving.'
                : 'Scanner USB hardware otomatis mengirim tombol "Enter", memindahkan kursor ke nama produk atau simpan langsung.'}
            </p>
          </div>

          {/* Product Full Name & Detail */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {isEn ? 'Full Product Name & Details (Size / Variant)' : 'Nama Barang Lengkap & Detail (Varian/Rasa/Warna)'} *
            </label>
            <input
              id="input-quick-product-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Aqua Air Mineral 600ml / Kemeja Oxford Slimfit Navy (L)"
              required
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
                  : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#00f2fe]'
              }`}
            />
          </div>

          {/* Grid 2 Cols: Category & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Layers className={`w-3.5 h-3.5 ${isLight ? 'text-teal-700' : 'text-cyan-400'}`} />
                <span>{isEn ? 'Category' : 'Kategori (Baru atau Pilih)'}</span>
              </label>
              <input
                type="text"
                list="category-options-list"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Pilih atau ketik Kategori baru..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
                    : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#00f2fe]'
                }`}
              />
              <datalist id="category-options-list">
                {categoriesMaster.map((c, cIdx) => (
                  <option key={`quick-cat-${c.id}-${cIdx}`} value={c.name}>
                    {c.department}
                  </option>
                ))}
              </datalist>
              <span className="text-[10px] text-slate-600 dark:text-slate-400">
                {isEn ? 'New category will auto-populate Category Master card' : 'Kategori baru otomatis menambah counter kartu [Kategori]'}
              </span>
            </div>

            {/* Brand */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Building2 className={`w-3.5 h-3.5 ${isLight ? 'text-teal-700' : 'text-cyan-400'}`} />
                <span>{isEn ? 'Brand / Merek' : 'Merek / Brand (Baru atau Pilih)'}</span>
              </label>
              <input
                type="text"
                list="brand-options-list"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Pilih atau ketik Merek baru..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
                    : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#00f2fe]'
                }`}
              />
              <datalist id="brand-options-list">
                {brands.map((b, idx) => (
                  <option key={`${b.id}-${idx}`} value={b.name}>
                    {b.manufacturer}
                  </option>
                ))}
              </datalist>
              <span className="text-[10px] text-slate-600 dark:text-slate-400">
                {isEn ? 'New brand will auto-populate Brand Master card' : 'Merek baru otomatis menambah counter kartu [Merek]'}
              </span>
            </div>
          </div>

          {/* Manufacturer & Warehouse Rack Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {isEn ? 'Manufacturer / Principal' : 'Manufaktur / Pabrikan'}
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Contoh: PT Indofood CBP, Unilever, Apple Inc."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
                    : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#00f2fe]'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <MapPin className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                <span>{isEn ? 'Warehouse Shelf / Rack Location' : 'Titik Rak / Lokasi Gudang'}</span>
              </label>
              <input
                type="text"
                value={rackLocation}
                onChange={(e) => setRackLocation(e.target.value)}
                placeholder="Contoh: Rak A-02, Chiller Depan, Gudang Utama"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
                    : 'bg-[#0d1117] border-[#30363d] text-white focus:border-[#00f2fe]'
                }`}
              />
            </div>
          </div>

          {/* Operational Stock & Satuan (Notice: manual alert threshold is removed!) */}
          <div className={`p-4 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f141c] border-[#30363d]'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Boxes className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase">
                  {isEn ? 'Operational Stock & Inventory Entry' : 'Pencatatan Stok Fisik Awal & Satuan'}
                </span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded border ${
                isLight
                  ? 'text-slate-700 bg-white border-slate-300 font-medium'
                  : 'text-slate-400 bg-black/20 border-slate-700'
              }`}>
                {isEn ? 'Alert Threshold managed by Executive Policy' : 'Batas Alert dikontrol oleh Kebijakan Eksekutif'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Initial Stock */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {isEn ? 'Initial Recorded Stock' : 'Stok Awal Fisik'} *
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

              {/* UoM / Unit */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {isEn ? 'Unit of Measure (UoM)' : 'Satuan (UoM)'} *
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
                  <option value="BOX">BOX</option>
                  <option value="PACK">PACK</option>
                  <option value="BTL">BOTOL (BTL)</option>
                  <option value="PORSI">PORSI</option>
                  <option value="UNIT">UNIT</option>
                  <option value="STRIP">STRIP</option>
                  <option value="TUBE">TUBE</option>
                  <option value="KG">KILOGRAM (KG)</option>
                  <option value="KARTON">KARTON</option>
                </select>
              </div>

              {/* Tax Status Toggle Switch */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>{isEn ? 'Tax Status (PPN)' : 'Status Pajak (PPN)'}</span>
                  <span className={`text-[10px] font-mono font-bold ${
                    taxable
                      ? isLight ? 'text-amber-800' : 'text-amber-400'
                      : isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    {taxable ? 'PPN 11% AKTIF' : 'NON-PPN'}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setTaxable(!taxable)}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    taxable
                      ? isLight
                        ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
                        : 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : isLight
                      ? 'bg-white border-slate-300 text-slate-800'
                      : 'bg-[#0d1117] border-[#30363d] text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    {taxable ? 'Kena Pajak (PPN 11%)' : 'Non-PPN (Bebas Pajak)'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    taxable
                      ? isLight ? 'bg-amber-200 text-amber-900' : 'bg-amber-500/30 text-amber-300'
                      : isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-700/50 text-slate-300'
                  }`}>
                    {taxable ? '11%' : '0%'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 3-Tier Pricing Matrix Section */}
          <div className={`p-4 rounded-xl border ${
            isLight
              ? 'bg-gradient-to-br from-teal-50/60 via-white to-sky-50/60 border-teal-200 shadow-xs'
              : 'bg-[#0e1622] border-cyan-500/30'
          }`}
          style={{
            boxShadow: isLight
              ? '0 4px 15px rgba(13,148,136,0.08)'
              : '0 0 25px rgba(0,242,254,0.08)',
          }}
          >
            {/* Matrix Header */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b ${
              isLight ? 'border-teal-200' : 'border-cyan-500/20'
            }`}>
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-4 h-4 ${isLight ? 'text-teal-700' : 'text-[#00f2fe]'}`} />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${
                  isLight ? 'text-teal-800' : 'text-[#00f2fe]'
                }`}>
                  {isEn ? 'Tiered Pricing Matrix & Gross Margin Estimator' : 'Matriks 3 Tingkat Harga & Estimasi Margin (%)'}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-900 dark:text-slate-300">
                  {isEn ? 'Cost Basis (HPP Modal):' : 'Harga Beli Modal (HPP):'}
                </span>
                <div className="relative w-36">
                  <span className="absolute left-2.5 top-1.5 text-xs text-slate-500 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className={`w-full pl-8 pr-2.5 py-1 rounded-lg border text-xs font-mono font-bold transition focus:outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-emerald-800 focus:border-emerald-500'
                        : 'bg-[#0d1117] border-[#30363d] text-emerald-400 focus:border-emerald-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* 3 Tier Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3.5">
              {/* TIER 1: Harga Eceran (Retail Price) */}
              <div className={`p-3.5 rounded-xl border relative transition ${
                isLight ? 'bg-white border-blue-200 shadow-xs' : 'bg-[#121b28] border-blue-500/40'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded uppercase border ${
                    isLight
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  }`}>
                    Tier 1 • Eceran
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
                    <span>{retailMargin.percent}% Margin</span>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {isEn ? 'Retail Price (End-Consumer)' : 'Harga Eceran (Konsumen Umum)'}
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-2">
                  {isEn ? 'Standard retail counter checkout' : 'Tarif standar kasir POS konsumen langsung'}
                </p>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={priceRetail}
                    onChange={(e) => setPriceRetail(parseFloat(e.target.value) || 0)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm font-mono font-bold transition focus:outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                        : 'bg-[#0d1117] border-[#30363d] text-[#00f2fe] focus:border-[#00f2fe]'
                    }`}
                  />
                </div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1.5 flex justify-between">
                  <span>Laba Bersih / Unit:</span>
                  <span className={`font-mono font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    Rp {Math.max(0, priceRetail - costPrice).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* TIER 2: Harga Partai (Wholesale Price) */}
              <div className={`p-3.5 rounded-xl border relative transition ${
                isLight ? 'bg-white border-purple-200 shadow-xs' : 'bg-[#17132a] border-purple-500/40'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded uppercase border ${
                    isLight
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                  }`}>
                    Tier 2 • Partai / Reseller
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
                    <span>{wholesaleMargin.percent}% Margin</span>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {isEn ? 'Wholesale (Mid-tier / Reseller)' : 'Harga Partai (Reseller / Sedang)'}
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-2">
                  {isEn ? 'For carton / minimum volume orders' : 'Kuantitas menengah (misal min. 1 lusin/box)'}
                </p>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={priceWholesale}
                    onChange={(e) => setPriceWholesale(parseFloat(e.target.value) || 0)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm font-mono font-bold transition focus:outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-purple-500'
                        : 'bg-[#0d1117] border-[#30363d] text-purple-400 focus:border-purple-400'
                    }`}
                  />
                </div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1.5 flex justify-between">
                  <span>Laba Bersih / Unit:</span>
                  <span className={`font-mono font-semibold ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>
                    Rp {Math.max(0, priceWholesale - costPrice).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* TIER 3: Harga Distributor / Wholesaler (Bulk/Distributor Price) */}
              <div className={`p-3.5 rounded-xl border relative transition ${
                isLight ? 'bg-white border-emerald-200 shadow-xs' : 'bg-[#0f1d1b] border-emerald-500/40'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded uppercase border ${
                    isLight
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}>
                    Tier 3 • Distributor
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
                    <span>{distributorMargin.percent}% Margin</span>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {isEn ? 'Bulk / Distributor Price' : 'Harga Distributor / Wholesaler'}
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-2">
                  {isEn ? 'Lowest tier for official agents & bulk' : 'Tier terendah untuk agen resmi / partai besar'}
                </p>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={priceDistributor}
                    onChange={(e) => setPriceDistributor(parseFloat(e.target.value) || 0)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm font-mono font-bold transition focus:outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                        : 'bg-[#0d1117] border-[#30363d] text-emerald-400 focus:border-emerald-400'
                    }`}
                  />
                </div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1.5 flex justify-between">
                  <span>Laba Bersih / Unit:</span>
                  <span className={`font-mono font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                    Rp {Math.max(0, priceDistributor - costPrice).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`pt-3 border-t flex items-center justify-between gap-3 ${
            isLight ? 'border-slate-200' : 'border-gray-700/40'
          }`}>
            <span className="text-[11px] text-slate-600 dark:text-slate-400">
              {isEn
                ? 'Tip: Press "Enter" to save and immediately scan the next product.'
                : 'Tip: Tekan Enter untuk simpan & langsung scan produk berikutnya.'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  isLight
                    ? 'border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100'
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
                <span>{isEn ? 'SAVE & DISTRIBUTE (ENTER)' : 'SIMPAN KE MASTER DATA'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
