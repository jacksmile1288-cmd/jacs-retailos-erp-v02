import React, { useState, useMemo, useEffect } from 'react';
import { Product, RecipeIngredient } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  INITIAL_RAW_INGREDIENTS,
  RECIPE_PRESETS,
  RawIngredientMaster,
  RecipePreset,
} from '../../data/rawIngredientsData';
import { calculateProductHpp, HppCalculationResult } from '../../utils/recipeUtils';
import {
  X,
  UtensilsCrossed,
  Plus,
  Trash2,
  ChefHat,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  Scale,
  RefreshCw,
  Info,
  HelpCircle,
} from 'lucide-react';

interface BomRecipeModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: (updatedProduct: Product) => void;
}

export const BomRecipeModal: React.FC<BomRecipeModalProps> = ({
  product,
  isOpen,
  onClose,
  onSaveSuccess,
}) => {
  const { products, inventory, updateProduct, addAuditLog, showToast, theme } = useApp();
  const isLight = theme === 'light';

  // State resep lokal
  const [recipeItems, setRecipeItems] = useState<RecipeIngredient[]>([]);
  const [wastePercent, setWastePercent] = useState<number>(5);
  const [packagingCost, setPackagingCost] = useState<number>(1500);

  // Input penambahan bahan baru
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [inputQty, setInputQty] = useState<number | ''>(100);
  const [inputUnit, setInputUnit] = useState<string>('gr');
  const [inputCostPerUnit, setInputCostPerUnit] = useState<number | ''>(15);
  const [customName, setCustomName] = useState<string>('');
  const [isCustomIngredient, setIsCustomIngredient] = useState<boolean>(false);

  // Daftar bahan baku gabungan dari master database inventori/gudang & initial raw ingredients
  const availableRawMaterials = useMemo(() => {
    const rawMap = new Map<string, { id: string; name: string; unit: string; costPerUnit: number; stock: number; category: string }>();

    // 1. Dari INITIAL_RAW_INGREDIENTS
    INITIAL_RAW_INGREDIENTS.forEach((item) => {
      rawMap.set(item.id, {
        id: item.id,
        name: item.name,
        unit: item.unit,
        costPerUnit: item.costPerUnit,
        stock: item.currentStock,
        category: item.category,
      });
    });

    // 2. Dari products / inventory di sistem yang bertipe bahan baku / gudang
    products.forEach((p) => {
      const isRaw =
        p.category === 'Bahan Baku & Mentah' ||
        p.category?.toLowerCase().includes('bahan') ||
        p.id.startsWith('ING-') ||
        p.category?.toLowerCase().includes('raw');
      if (isRaw) {
        rawMap.set(p.id, {
          id: p.id,
          name: p.name,
          unit: p.unit || 'pcs',
          costPerUnit: Number(p.cost_price) || 0,
          stock: p.stock ?? 0,
          category: p.category || 'Gudang Utama',
        });
      }
    });

    return Array.from(rawMap.values());
  }, [products]);

  // Sinkronisasi saat modal dibuka untuk produk tertentu
  useEffect(() => {
    if (!product) return;

    if (product.recipe && product.recipe.length > 0) {
      setRecipeItems(product.recipe.map((r) => ({ ...r })));
    } else {
      // Coba cari kecocokan di RECIPE_PRESETS berdasarkan nama produk
      const matchedPreset = RECIPE_PRESETS.find(
        (preset) =>
          product.name.toLowerCase().includes(preset.name.toLowerCase()) ||
          preset.name.toLowerCase().includes(product.name.toLowerCase())
      );

      if (matchedPreset) {
        setRecipeItems(matchedPreset.recipe.map((r) => ({ ...r })));
        setWastePercent(matchedPreset.wastePercent ?? 5);
        setPackagingCost(matchedPreset.packagingCost ?? 1500);
      } else {
        setRecipeItems([]);
        setWastePercent(product.wastePercent !== undefined ? product.wastePercent : 5);
        setPackagingCost(product.packagingCost !== undefined ? product.packagingCost : 1500);
      }
    }

    if (product.wastePercent !== undefined) {
      setWastePercent(product.wastePercent);
    }
    if (product.packagingCost !== undefined) {
      setPackagingCost(product.packagingCost);
    }

    // Set default pilihan bahan pertama jika tersedia
    if (availableRawMaterials.length > 0) {
      const first = availableRawMaterials[0];
      setSelectedIngredientId(first.id);
      setInputUnit(first.unit);
      setInputCostPerUnit(first.costPerUnit);
    }
  }, [product, isOpen, availableRawMaterials]);

  // Handler saat memilih bahan dari dropdown
  const handleSelectRawMaterial = (id: string) => {
    if (id === '__custom__') {
      setIsCustomIngredient(true);
      setSelectedIngredientId('__custom__');
      setCustomName('');
      setInputQty(1);
      setInputUnit('pcs');
      setInputCostPerUnit(1000);
      return;
    }

    setIsCustomIngredient(false);
    setSelectedIngredientId(id);
    const found = availableRawMaterials.find((item) => item.id === id);
    if (found) {
      setInputUnit(found.unit);
      setInputCostPerUnit(found.costPerUnit);
      if (found.unit === 'gr' || found.unit === 'ml') {
        setInputQty(50);
      } else {
        setInputQty(1);
      }
    }
  };

  // Tambah baris bahan baku ke resep
  const handleAddIngredient = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const qty = Number(inputQty);
    const cost = Number(inputCostPerUnit);

    if (qty <= 0) {
      showToast('Takaran bahan harus lebih besar dari 0.');
      return;
    }

    if (isCustomIngredient) {
      if (!customName.trim()) {
        showToast('Mohon masukkan nama bahan baku kustom.');
        return;
      }
      const newIng: RecipeIngredient = {
        ingredientId: `ING-CUSTOM-${Date.now().toString().slice(-4)}`,
        name: customName.trim(),
        qty,
        unit: inputUnit.trim() || 'pcs',
        costPerUnit: cost >= 0 ? cost : 0,
      };
      setRecipeItems((prev) => [...prev, newIng]);
      setCustomName('');
      setIsCustomIngredient(false);
      if (availableRawMaterials.length > 0) {
        setSelectedIngredientId(availableRawMaterials[0].id);
        setInputUnit(availableRawMaterials[0].unit);
        setInputCostPerUnit(availableRawMaterials[0].costPerUnit);
      }
      return;
    }

    const found = availableRawMaterials.find((i) => i.id === selectedIngredientId);
    if (!found) {
      showToast('Bahan baku tidak valid.');
      return;
    }

    // Cek apakah bahan ini sudah ada di resep, jika ya akumulasikan
    const existingIndex = recipeItems.findIndex((r) => r.ingredientId === found.id);
    if (existingIndex !== -1) {
      setRecipeItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, qty: item.qty + qty, costPerUnit: cost }
            : item
        )
      );
      showToast(`Takaran ${found.name} ditambahkan (+${qty} ${found.unit}).`);
    } else {
      const newIng: RecipeIngredient = {
        ingredientId: found.id,
        name: found.name,
        qty,
        unit: inputUnit || found.unit,
        costPerUnit: cost,
      };
      setRecipeItems((prev) => [...prev, newIng]);
      showToast(`${found.name} dimasukkan ke resep.`);
    }
  };

  // Hapus baris bahan
  const handleRemoveIngredient = (index: number) => {
    setRecipeItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update takaran langsung pada baris tabel
  const handleUpdateRowQty = (index: number, newQty: number) => {
    const validQty = Math.max(0, newQty);
    setRecipeItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, qty: validQty } : item))
    );
  };

  // Update biaya per unit langsung pada baris tabel
  const handleUpdateRowCost = (index: number, newCost: number) => {
    const validCost = Math.max(0, newCost);
    setRecipeItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, costPerUnit: validCost } : item))
    );
  };

  // Terapkan salah satu Preset Chef Koki
  const handleApplyPreset = (preset: RecipePreset) => {
    setRecipeItems(preset.recipe.map((r) => ({ ...r })));
    setWastePercent(preset.wastePercent ?? 5);
    setPackagingCost(preset.packagingCost ?? 1500);
    showToast(`Preset resep "${preset.name}" berhasil diterapkan!`);
  };

  // Kalkulasi HPP dan Food Cost secara instan
  const hppResult: HppCalculationResult = useMemo(() => {
    if (!product) {
      return {
        rawIngredientsCost: 0,
        wastePercent: 5,
        wasteCost: 0,
        packagingCost: 0,
        totalHpp: 0,
        foodCostPercent: 0,
        grossMarginNominal: 0,
        grossMarginPercent: 0,
        status: 'optimal',
        statusLabel: 'Optimal',
      };
    }

    return calculateProductHpp(
      product,
      recipeItems,
      wastePercent,
      packagingCost,
      product.sell_price || product.price_retail || 0
    );
  }, [product, recipeItems, wastePercent, packagingCost]);

  // Simpan resep ke produk dan perbarui HPP (cost_price)
  const handleSaveRecipe = () => {
    if (!product) return;

    const sellPrice = Number(product.sell_price || product.price_retail) || 0;
    const finalHpp = hppResult.totalHpp;

    const recipeSummaryText = recipeItems
      .map((r) => `${r.name} ${r.qty}${r.unit}`)
      .join(', ');

    const updates: Partial<Product> = {
      recipe: recipeItems,
      wastePercent,
      packagingCost,
      cost_price: finalHpp,
      recipeSummary: recipeSummaryText || undefined,
    };

    updateProduct(product.id, updates);

    addAuditLog(
      `BOM & HPP Resep diperbarui untuk [${product.id}] "${product.name}": HPP Rp ${finalHpp.toLocaleString(
        'id-ID'
      )} (Food Cost ${hppResult.foodCostPercent}%, Waste ${wastePercent}%, Packaging Rp ${packagingCost.toLocaleString(
        'id-ID'
      )})`,
      'Master Data / BOM Resep'
    );

    showToast(
      `Resep & HPP "${product.name}" berhasil disimpan! HPP Otomatis: Rp ${finalHpp.toLocaleString(
        'id-ID'
      )} (Food Cost ${hppResult.foodCostPercent}%).`
    );

    if (onSaveSuccess) {
      onSaveSuccess({ ...product, ...updates });
    }

    onClose();
  };

  if (!isOpen || !product) return null;

  const currentSellPrice = Number(product.sell_price || product.price_retail) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 ${
          isLight
            ? 'bg-slate-50 border-slate-300 text-slate-900 shadow-slate-900/30'
            : 'bg-[#12161f] border-[#2d3748] text-white shadow-black/80'
        }`}
      >
        {/* ================= HEADER MODAL ================= */}
        <div
          className={`p-4 sm:p-5 border-b flex items-start justify-between gap-4 shrink-0 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#161c28] border-gray-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20 shrink-0">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  Atur Resep & Bill of Materials (BOM)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  F&B Resto & Kitchen
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Formula komposisi takaran bahan baku gudang, penyusutan (waste), kemasan, dan kalkulasi HPP otomatis.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl bg-gray-800/40 hover:bg-gray-800 cursor-pointer transition shrink-0"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= KONTEN BODY MODAL (SCROLLABLE) ================= */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* 1. INFORMASI MENU & HARGA JUAL */}
          <div
            className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#182030] border-gray-700/60'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-14 h-14 rounded-xl object-cover border border-gray-700 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 shrink-0">
                  <ChefHat className="w-7 h-7" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2">
                  <span>SKU: {product.id}</span>
                  <span>•</span>
                  <span>Kategori: {product.category}</span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white truncate" title={product.name}>
                  {product.name}
                </h4>
                <div className="text-xs text-gray-300 mt-0.5">
                  Harga Jual Kasir:{' '}
                  <span className="font-bold text-emerald-400">
                    Rp {currentSellPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Presets Dropdown */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Preset Chef:</span>
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {RECIPE_PRESETS.slice(0, 3).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-800 hover:bg-emerald-950 text-emerald-400 border border-gray-700 hover:border-emerald-500/50 transition cursor-pointer"
                    title={`Muat komposisi resep standar "${preset.name}"`}
                  >
                    {preset.name.split(' ')[0]}...
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. FORM PENAMBAHAN BAHAN BAKU BARU */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#151b27] border-gray-700/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Tambah Bahan Mentah ke Formula Resep</span>
              </label>
              <button
                type="button"
                onClick={() => handleSelectRawMaterial('__custom__')}
                className={`text-[11px] font-semibold text-cyan-400 hover:underline cursor-pointer ${
                  isCustomIngredient ? 'font-bold underline text-emerald-400' : ''
                }`}
              >
                + Input Bahan Kustom (Manual)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              {/* Pilihan Bahan Mentah */}
              <div className="sm:col-span-5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Bahan Baku dari Gudang / Inventori
                </label>
                {isCustomIngredient ? (
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Contoh: Saus Keju Cheddar Homemade"
                    className={`w-full text-xs px-3 py-2 rounded-xl border outline-none font-medium ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                        : 'bg-[#0d1117] border-gray-700 text-white focus:border-emerald-500'
                    }`}
                  />
                ) : (
                  <select
                    value={selectedIngredientId}
                    onChange={(e) => handleSelectRawMaterial(e.target.value)}
                    className={`w-full text-xs px-3 py-2 rounded-xl border outline-none font-medium ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                        : 'bg-[#0d1117] border-gray-700 text-white focus:border-emerald-500'
                    }`}
                  >
                    <optgroup label="Bahan Baku Standar (Gudang F&B)">
                      {availableRawMaterials.map((ing, ingIdx) => (
                        <option key={`bom-raw-opt-${ing.id}-${ingIdx}`} value={ing.id}>
                          {ing.name} ({ing.category}) - Rp {ing.costPerUnit}/{ing.unit} [Stok: {ing.stock}]
                        </option>
                      ))}
                    </optgroup>
                    <option value="__custom__">+ Input Bahan Baku Lain / Manual...</option>
                  </select>
                )}
              </div>

              {/* Takaran / Qty */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Takaran (Qty)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={inputQty}
                  onChange={(e) => setInputQty(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="100"
                  className={`w-full text-xs px-3 py-2 rounded-xl border outline-none font-bold text-center ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                      : 'bg-[#0d1117] border-gray-700 text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              {/* Satuan / Unit */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Satuan (UOM)
                </label>
                <select
                  value={inputUnit}
                  onChange={(e) => setInputUnit(e.target.value)}
                  className={`w-full text-xs px-3 py-2 rounded-xl border outline-none font-medium ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                      : 'bg-[#0d1117] border-gray-700 text-white focus:border-emerald-500'
                  }`}
                >
                  <option value="gr">Gram (gr)</option>
                  <option value="ml">Mililiter (ml)</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="slice">Slice / Lembar</option>
                  <option value="porsi">Porsi</option>
                  <option value="sachet">Sachet</option>
                  <option value="butir">Butir</option>
                  <option value="pack">Pack</option>
                </select>
              </div>

              {/* Biaya per Unit */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Biaya / Unit (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={inputCostPerUnit}
                  onChange={(e) =>
                    setInputCostPerUnit(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="15"
                  className={`w-full text-xs px-3 py-2 rounded-xl border outline-none font-bold text-right ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                      : 'bg-[#0d1117] border-gray-700 text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              {/* Tombol Tambah */}
              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center cursor-pointer shadow-md shadow-emerald-500/20 transition"
                  title="Tambah ke Resep"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 3. TABEL KOMPOSISI RESEP (BILL OF MATERIALS) */}
          <div
            className={`rounded-xl border overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#151b27] border-gray-800'
            }`}
          >
            <div className="p-3 border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Daftar Komposisi Bahan Baku ({recipeItems.length} komponen)</span>
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                Subtotal Bahan: <strong className="text-emerald-400">Rp {hppResult.rawIngredientsCost.toLocaleString('id-ID')}</strong>
              </span>
            </div>

            <div className="overflow-x-auto max-h-56">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                      isLight ? 'bg-slate-100 text-slate-600' : 'bg-gray-800/60 text-gray-400'
                    }`}
                  >
                    <th className="p-2.5 text-center w-10">#</th>
                    <th className="p-2.5">Bahan Mentah</th>
                    <th className="p-2.5 text-center w-28">Takaran (Qty)</th>
                    <th className="p-2.5 text-center w-20">Satuan</th>
                    <th className="p-2.5 text-right w-28">Biaya / Unit</th>
                    <th className="p-2.5 text-right w-32">Subtotal Biaya</th>
                    <th className="p-2.5 text-center w-12">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {recipeItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-gray-400">
                        Belum ada bahan baku dalam resep ini. Silakan tambahkan bahan di atas atau pilih preset.
                      </td>
                    </tr>
                  ) : (
                    recipeItems.map((item, idx) => {
                      const subtotal = Math.round(item.qty * item.costPerUnit);
                      return (
                        <tr
                          key={`${item.ingredientId}-${idx}`}
                          className={`hover:bg-cyan-500/5 transition ${
                            isLight ? 'text-slate-800' : 'text-gray-200'
                          }`}
                        >
                          <td className="p-2.5 text-center font-mono text-gray-400">{idx + 1}</td>
                          <td className="p-2.5 font-bold">
                            <div>{item.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{item.ingredientId}</div>
                          </td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={item.qty}
                              onChange={(e) => handleUpdateRowQty(idx, Number(e.target.value))}
                              className={`w-20 text-xs px-2 py-1 rounded-lg border outline-none font-bold text-center ${
                                isLight
                                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                                  : 'bg-[#0d1117] border-gray-700 text-white focus:border-emerald-500'
                              }`}
                            />
                          </td>
                          <td className="p-2.5 text-center font-mono text-gray-400 font-semibold">
                            {item.unit}
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.costPerUnit}
                              onChange={(e) => handleUpdateRowCost(idx, Number(e.target.value))}
                              className={`w-24 text-xs px-2 py-1 rounded-lg border outline-none font-bold text-right ${
                                isLight
                                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                                  : 'bg-[#0d1117] border-gray-700 text-white focus:border-emerald-500'
                              }`}
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                            Rp {subtotal.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(idx)}
                              className="p-1 rounded-lg bg-gray-800 hover:bg-rose-950 text-rose-400 border border-transparent hover:border-rose-500/40 cursor-pointer transition"
                              title="Hapus Bahan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. PARAMETER PENYESUAIAN: SUSUT (WASTE %) & KEMASAN (PACKAGING) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Waste % */}
            <div
              className={`p-3.5 rounded-xl border space-y-1.5 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#151b27] border-gray-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <span>Persentase Waste / Susut Bahan</span>
                </label>
                <span className="text-[11px] font-mono font-bold text-amber-400">
                  Rp {hppResult.wasteCost.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Faktor pemotongan, sisa kulit/lemak, penyusutan saat dimasak (Default: 5%).
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={wastePercent}
                  onChange={(e) => setWastePercent(Number(e.target.value))}
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
                <div className="w-16 flex items-center justify-center font-bold text-xs px-2 py-1 rounded-lg bg-gray-800 border border-gray-700 text-amber-400">
                  {wastePercent}%
                </div>
              </div>
            </div>

            {/* Kemasan (Packaging) */}
            <div
              className={`p-3.5 rounded-xl border space-y-1.5 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#151b27] border-gray-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-cyan-400" />
                  <span>Komponen Kemasan (Packaging)</span>
                </label>
                <span className="text-[11px] font-mono font-bold text-cyan-400">
                  Rp {packagingCost.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Biaya kotak lunch box, paper bowl, cup 16oz, sedotan, atau kantong ramah lingkungan.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-gray-400 font-bold">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(Math.max(0, Number(e.target.value)))}
                  className={`flex-1 text-xs px-3 py-1.5 rounded-xl border outline-none font-bold ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                      : 'bg-[#0d1117] border-gray-700 text-white focus:border-cyan-500'
                  }`}
                  placeholder="1500"
                />
              </div>
            </div>
          </div>

          {/* 5. SUMMARY STATS LIVE: KALKULASI HPP OTOMATIS & FOOD COST % */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isLight
                ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-300'
                : 'bg-gradient-to-br from-[#122623] to-[#121c2c] border-emerald-500/30'
            }`}
          >
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Kalkulasi Otomatis HPP & Food Cost %</span>
              </span>
              <span className="text-[11px] font-mono text-gray-300">
                Formula: Biaya Bahan + Kemasan + (Waste % * Biaya Bahan)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {/* Total Biaya Bahan */}
              <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800">
                <div className="text-[10px] text-gray-400 font-bold uppercase">Biaya Bahan Baku</div>
                <div className="text-sm sm:text-base font-black text-gray-200 mt-1">
                  Rp {hppResult.rawIngredientsCost.toLocaleString('id-ID')}
                </div>
              </div>

              {/* Susut & Kemasan */}
              <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800">
                <div className="text-[10px] text-gray-400 font-bold uppercase">Susut + Kemasan</div>
                <div className="text-sm sm:text-base font-black text-amber-400 mt-1">
                  Rp {(hppResult.wasteCost + hppResult.packagingCost).toLocaleString('id-ID')}
                </div>
              </div>

              {/* Total HPP Otomatis */}
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40">
                <div className="text-[10px] text-emerald-400 font-bold uppercase">HPP Otomatis</div>
                <div className="text-base sm:text-lg font-black text-emerald-300 mt-1">
                  Rp {hppResult.totalHpp.toLocaleString('id-ID')}
                </div>
              </div>

              {/* Food Cost % Terhadap Harga Jual */}
              <div
                className={`p-2.5 rounded-xl border ${
                  hppResult.status === 'optimal'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : hppResult.status === 'moderate'
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="text-[10px] font-bold uppercase">Food Cost %</div>
                <div className="text-base sm:text-lg font-black mt-1">
                  {hppResult.foodCostPercent}%
                </div>
                <div className="text-[9px] font-bold uppercase mt-0.5 tracking-tight">
                  {hppResult.statusLabel}
                </div>
              </div>
            </div>

            {/* Visual Margin Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] text-gray-300">
                <span>
                  Margin Kotor (Gross Profit):{' '}
                  <strong className="text-cyan-400">
                    Rp {hppResult.grossMarginNominal.toLocaleString('id-ID')} ({hppResult.grossMarginPercent}%)
                  </strong>
                </span>
                <span className="text-[10px] text-gray-400">
                  Target Standar Resto: Food Cost 28% - 35%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-gray-800 overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, hppResult.foodCostPercent)}%` }}
                  title={`Food Cost: ${hppResult.foodCostPercent}%`}
                />
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, 100 - hppResult.foodCostPercent)}%` }}
                  title={`Gross Margin: ${hppResult.grossMarginPercent}%`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= FOOTER AKSI ================= */}
        <div
          className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#161c28] border-gray-800'
          }`}
        >
          <div className="text-xs text-gray-400 flex items-center gap-1.5 self-start sm:self-center">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Saat transaksi F&B diselesaikan di kasir, stok bahan mentah di atas akan terpotong otomatis dari modul Warehouse.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer transition"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSaveRecipe}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/25 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Resep & Perbarui HPP Produk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
