import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { FnbToppingCategory, FnbToppingMaster } from '../../types';
import { INITIAL_RAW_INGREDIENTS } from '../../data/rawIngredientsData';
import {
  generateNextToppingSku,
  generateNextRawMaterialSku,
} from '../../data/fnbData';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  UtensilsCrossed,
  Coffee,
  Cookie,
  Link2,
  CheckCircle2,
  PauseCircle,
  Sparkles,
  Package,
  PackagePlus,
  Tag,
  Lock,
} from 'lucide-react';

const CATEGORY_META: Record<
  FnbToppingCategory,
  { label: string; shortLabel: string; badgeClass: string; lightBadgeClass: string; Icon: React.FC<{ className?: string }> }
> = {
  MAIN_FOOD: {
    label: 'Makanan Utama',
    shortLabel: 'Makanan Utama',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
    lightBadgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    Icon: UtensilsCrossed,
  },
  DRINK: {
    label: 'Kopi & Non-Kopi',
    shortLabel: 'Kopi & Non-Kopi',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
    lightBadgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300',
    Icon: Coffee,
  },
  PASTRY_SNACK: {
    label: 'Pastry & Snack',
    shortLabel: 'Pastry & Snack',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    lightBadgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    Icon: Cookie,
  },
};

export const FnbToppingMasterTab: React.FC = () => {
  const {
    fnbToppings,
    addFnbTopping,
    updateFnbTopping,
    deleteFnbTopping,
    toggleFnbToppingActive,
    registerFnbRawMaterial,
    products,
    theme,
    showToast,
  } = useApp();

  const isLight = theme === 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | FnbToppingCategory>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSku, setEditingSku] = useState<string>('');

  // Form fields Topping
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<FnbToppingCategory>('MAIN_FOOD');
  const [formPrice, setFormPrice] = useState<string>('5000');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formRawMaterialId, setFormRawMaterialId] = useState<string>('');
  const [formRawMaterialQty, setFormRawMaterialQty] = useState<string>('1');
  const [formNotes, setFormNotes] = useState<string>('');

  // Mini-form inline: "+ Daftarkan SKU Bahan Baku Baru"
  const [isQuickRawOpen, setIsQuickRawOpen] = useState(false);
  const [quickRawName, setQuickRawName] = useState('');
  const [quickRawUnit, setQuickRawUnit] = useState<'Gram' | 'Ml' | 'Pcs'>('Pcs');
  const [quickRawCost, setQuickRawCost] = useState<string>('3000');
  const [quickRawStock, setQuickRawStock] = useState<string>('100');

  // Gabungkan daftar bahan baku dapur dari state products + INITIAL_RAW_INGREDIENTS agar stok & HPP selalu terbaru
  const availableRawMaterials = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; unit: string; costPerUnit: number; stock: number }
    >();
    INITIAL_RAW_INGREDIENTS.forEach((ing) => {
      map.set(ing.id, {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        costPerUnit: ing.costPerUnit,
        stock: ing.currentStock,
      });
    });
    products.forEach((p) => {
      const idUpper = (p.id || '').toUpperCase();
      if (p.itemType === 'RAW_MATERIAL' || idUpper.startsWith('RM-FNB-')) {
        map.set(p.id, {
          id: p.id,
          name: p.name,
          unit: p.unit || 'Gram',
          costPerUnit: Number(p.cost_price ?? p.costPrice ?? 0),
          stock: Number(p.stock) || 0,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [products]);

  const nextAutoToppingSku = useMemo(
    () => generateNextToppingSku(fnbToppings),
    [fnbToppings]
  );

  const nextAutoRawSku = useMemo(
    () =>
      generateNextRawMaterialSku([
        ...availableRawMaterials.map((r) => r.id),
        ...products.map((p) => p.id),
      ]),
    [availableRawMaterials, products]
  );

  const selectedRawMaterial = useMemo(
    () => availableRawMaterials.find((r) => r.id === formRawMaterialId) || null,
    [availableRawMaterials, formRawMaterialId]
  );

  // Referensi HPP 100% otomatis dari Master Bahan Baku Gudang × Takaran per Porsi (Rp 0 jika Non-BOM / Layanan)
  const computedFormHpp = useMemo(() => {
    if (!selectedRawMaterial) return 0;
    const qty = Math.max(0, Number(formRawMaterialQty) || 0);
    return Math.round(qty * selectedRawMaterial.costPerUnit);
  }, [selectedRawMaterial, formRawMaterialQty]);

  const filteredToppings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return fnbToppings.filter((t) => {
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        (t.sku || t.id).toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        (t.rawMaterialId || '').toLowerCase().includes(q) ||
        (t.rawMaterialName || '').toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q)
      );
    });
  }, [fnbToppings, categoryFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = fnbToppings.length;
    const activeCount = fnbToppings.filter((t) => t.isActive).length;
    const bomLinkedCount = fnbToppings.filter((t) => Boolean(t.rawMaterialId && (t.rawMaterialQty || 0) > 0)).length;
    const paidToppings = fnbToppings.filter((t) => t.price > 0);
    const avgMarginPct =
      paidToppings.length > 0
        ? Math.round(
            paidToppings.reduce((acc, t) => {
              const liveRaw = t.rawMaterialId
                ? availableRawMaterials.find((r) => r.id === t.rawMaterialId)
                : null;
              const hpp =
                liveRaw && (t.rawMaterialQty || 0) > 0
                  ? Math.round((t.rawMaterialQty || 0) * liveRaw.costPerUnit)
                  : 0;
              return acc + ((t.price - hpp) / t.price) * 100;
            }, 0) / paidToppings.length
          )
        : 0;
    return { total, activeCount, bomLinkedCount, avgMarginPct };
  }, [fnbToppings, availableRawMaterials]);

  const resetQuickRawForm = () => {
    setIsQuickRawOpen(false);
    setQuickRawName('');
    setQuickRawUnit('Pcs');
    setQuickRawCost('3000');
    setQuickRawStock('100');
  };

  const openAddModal = () => {
    setEditingId(null);
    setEditingSku('');
    setFormName('');
    setFormCategory(categoryFilter === 'ALL' ? 'MAIN_FOOD' : categoryFilter);
    setFormPrice('5000');
    setFormIsActive(true);
    setFormRawMaterialId('');
    setFormRawMaterialQty('1');
    setFormNotes('');
    resetQuickRawForm();
    setIsModalOpen(true);
  };

  const openEditModal = (t: FnbToppingMaster) => {
    setEditingId(t.id);
    setEditingSku(t.sku || t.id);
    setFormName(t.name);
    setFormCategory(t.category);
    setFormPrice(String(t.price ?? 0));
    setFormIsActive(Boolean(t.isActive));
    setFormRawMaterialId(t.rawMaterialId || '');
    setFormRawMaterialQty(String(t.rawMaterialQty ?? 1));
    setFormNotes(t.notes || '');
    resetQuickRawForm();
    setIsModalOpen(true);
  };

  const handleQuickCreateRawMaterial = () => {
    const cleanName = quickRawName.trim();
    if (!cleanName) {
      showToast('Nama Bahan Baku wajib diisi.', 'error');
      return;
    }
    const unitCostVal = Math.max(0, Math.round(Number(quickRawCost) || 0));
    const initStockVal = Math.max(0, Number(quickRawStock) || 0);

    const created = registerFnbRawMaterial({
      name: cleanName,
      unit: quickRawUnit,
      costPerUnit: unitCostVal,
      initialStock: initStockVal,
    });

    // Langsung tautkan SKU bahan baku yang baru didaftarkan ke topping yang sedang dibuat/diedit
    setFormRawMaterialId(created.id);
    if (!formRawMaterialQty || Number(formRawMaterialQty) <= 0) {
      setFormRawMaterialQty(quickRawUnit === 'Pcs' ? '1' : quickRawUnit === 'Ml' ? '15' : '50');
    }
    resetQuickRawForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = formName.trim();
    if (!cleanedName) {
      showToast('Nama topping wajib diisi.', 'error');
      return;
    }
    const priceVal = Math.max(0, Math.round(Number(formPrice) || 0));
    const hasBomLink = Boolean(selectedRawMaterial);
    const bomQty = hasBomLink ? Math.max(0.01, Number(formRawMaterialQty) || 1) : undefined;

    const payload: Omit<FnbToppingMaster, 'id' | 'sku'> = {
      name: cleanedName,
      category: formCategory,
      price: priceVal,
      isActive: formIsActive,
      rawMaterialId: hasBomLink ? selectedRawMaterial!.id : undefined,
      rawMaterialName: hasBomLink ? selectedRawMaterial!.name : undefined,
      rawMaterialQty: bomQty,
      rawMaterialUnit: hasBomLink ? selectedRawMaterial!.unit : undefined,
      hppCost: hasBomLink ? computedFormHpp : 0,
      notes: formNotes.trim() || undefined,
    };

    if (editingId) {
      updateFnbTopping(editingId, payload);
    } else {
      addFnbTopping({
        ...payload,
        sku: nextAutoToppingSku,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (t: FnbToppingMaster) => {
    deleteFnbTopping(t.id);
  };

  const modalActiveSku = editingId ? editingSku || editingId : nextAutoToppingSku;

  return (
    <div className="space-y-4">
      {/* KPI Ringkas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="text-[11px] text-slate-400">Total Master Topping</div>
          <div className="text-xl font-bold font-mono tabular-nums mt-0.5 text-amber-500">
            {stats.total} <span className="text-xs font-normal text-slate-400">SKU</span>
          </div>
        </div>
        <div
          className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="text-[11px] text-slate-400">Aktif di Layar Kasir POS</div>
          <div className="text-xl font-bold font-mono tabular-nums mt-0.5 text-emerald-500">
            {stats.activeCount} <span className="text-xs font-normal text-slate-400">/ {stats.total}</span>
          </div>
        </div>
        <div
          className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="text-[11px] text-slate-400">Tertaut Bahan Baku BOM</div>
          <div className="text-xl font-bold font-mono tabular-nums mt-0.5 text-cyan-500">
            {stats.bomLinkedCount} <span className="text-xs font-normal text-slate-400">Auto Potong Stok</span>
          </div>
        </div>
        <div
          className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="text-[11px] text-slate-400">Rata-rata Gross Margin</div>
          <div className="text-xl font-bold font-mono tabular-nums mt-0.5 text-indigo-400">
            {stats.avgMarginPct}%
          </div>
        </div>
      </div>

      {/* Toolbar Filter & Tombol Tambah */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border ${
          isLight
            ? 'bg-amber-50/50 border-amber-300/70'
            : 'bg-slate-900/90 border-amber-500/30'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode TOP-FNB, nama topping, atau RM-FNB..."
              className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none transition ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                  : 'bg-slate-950 border-slate-700 text-white focus:border-amber-500'
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                { id: 'ALL', label: `Semua (${fnbToppings.length})` },
                {
                  id: 'MAIN_FOOD',
                  label: `Makanan Utama (${fnbToppings.filter((t) => t.category === 'MAIN_FOOD').length})`,
                },
                {
                  id: 'DRINK',
                  label: `Kopi & Non-Kopi (${fnbToppings.filter((t) => t.category === 'DRINK').length})`,
                },
                {
                  id: 'PASTRY_SNACK',
                  label: `Pastry & Snack (${fnbToppings.filter((t) => t.category === 'PASTRY_SNACK').length})`,
                },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setCategoryFilter(btn.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                  categoryFilter === btn.id
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                    : isLight
                    ? 'bg-white border border-slate-300 text-slate-700 hover:bg-amber-50'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <button
          id="btn-add-fnb-topping-master"
          type="button"
          onClick={openAddModal}
          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Topping Baru</span>
        </button>
      </div>

      {/* Tabel Master Topping & Add-on */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className={`border-b text-[11px] uppercase tracking-wider font-mono ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-500'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400'
                }`}
              >
                <th className="py-2.5 px-3 whitespace-nowrap">Kode SKU</th>
                <th className="py-2.5 px-3">Nama Topping &amp; Catatan</th>
                <th className="py-2.5 px-3">Kategori Menu</th>
                <th className="py-2.5 px-3 text-right">Harga Tambahan POS</th>
                <th className="py-2.5 px-3">Tautan Bahan Baku (BOM)</th>
                <th className="py-2.5 px-3 text-right">HPP Gudang / Margin</th>
                <th className="py-2.5 px-3 text-center">Status POS</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/70'}`}>
              {filteredToppings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Tidak ada data topping yang cocok. Klik &quot;Tambah Topping Baru&quot; untuk menambahkan.
                  </td>
                </tr>
              ) : (
                filteredToppings.map((t) => {
                  const catMeta = CATEGORY_META[t.category] || CATEGORY_META.MAIN_FOOD;
                  const CatIcon = catMeta.Icon;
                  const skuCode = t.sku || t.id;
                  const liveRaw = t.rawMaterialId
                    ? availableRawMaterials.find((r) => r.id === t.rawMaterialId)
                    : null;
                  const resolvedHpp =
                    liveRaw && (t.rawMaterialQty || 0) > 0
                      ? Math.round((t.rawMaterialQty || 0) * liveRaw.costPerUnit)
                      : 0;
                  const marginRp = t.price - resolvedHpp;
                  const marginPct = t.price > 0 ? Math.round((marginRp / t.price) * 100) : 0;

                  return (
                    <tr
                      key={t.id}
                      className={`transition ${
                        !t.isActive ? 'opacity-60' : ''
                      } ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono text-[11px] font-semibold tracking-tight ${
                            isLight
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          }`}
                        >
                          <Tag className="w-3 h-3 shrink-0" />
                          <span>{skuCode}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-xs flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{t.name}</span>
                        </div>
                        {t.notes && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{t.notes}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium ${
                            isLight ? catMeta.lightBadgeClass : catMeta.badgeClass
                          }`}
                        >
                          <CatIcon className="w-3 h-3" />
                          <span>{catMeta.label}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-emerald-500 whitespace-nowrap">
                        {t.price > 0 ? `+Rp ${t.price.toLocaleString('id-ID')}` : 'Rp 0 (Gratis)'}
                      </td>
                      <td className="py-2.5 px-3">
                        {t.rawMaterialId && (t.rawMaterialQty || 0) > 0 ? (
                          <div className="space-y-0.5">
                            <div className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-500">
                              <Link2 className="w-3 h-3 shrink-0" />
                              <span className="font-mono">{t.rawMaterialId}</span>
                              <span>• {liveRaw?.name || t.rawMaterialName}</span>
                            </div>
                            <div className="text-[10px] font-mono tabular-nums text-slate-400">
                              Takaran: {t.rawMaterialQty} {liveRaw?.unit || t.rawMaterialUnit || 'Pcs'}
                              {liveRaw ? ` • Stok Gudang: ${liveRaw.stock.toLocaleString('id-ID')} ${liveRaw.unit}` : ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            Non-BOM / Layanan (Rp 0)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        <div className="text-[11px] font-medium">
                          Rp {resolvedHpp.toLocaleString('id-ID')}
                        </div>
                        {t.price > 0 && (
                          <div className="text-[10px] text-emerald-500">
                            Margin {marginPct}% (+Rp {marginRp.toLocaleString('id-ID')})
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleFnbToppingActive(t.id)}
                          title={t.isActive ? 'Klik untuk nonaktifkan di POS' : 'Klik untuk aktifkan di POS'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition cursor-pointer ${
                            t.isActive
                              ? isLight
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                              : isLight
                              ? 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {t.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <PauseCircle className="w-3 h-3" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(t)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isLight
                                ? 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                            title="Edit Topping"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isLight
                                ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                : 'border-rose-500/30 text-rose-400 hover:bg-rose-500/15'
                            }`}
                            title="Hapus Topping"
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

      {/* Modal Tambah / Edit Topping Master */}
      {isModalOpen &&
        createPortal(
          <div
            id="modal-fnb-topping-master-form"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
                isLight
                  ? 'bg-white border-amber-400/70 text-slate-900'
                  : 'bg-[#161b22] border-amber-500/40 text-white'
              }`}
            >
              {/* Header Modal + Badge Kode SKU */}
              <div
                className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-500 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold">
                        {editingId ? 'Edit Master Topping & Add-on' : 'Tambah Topping & Add-on Baru'}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono text-[10px] font-bold tracking-tight ${
                          isLight
                            ? 'bg-amber-100 border-amber-300 text-amber-900'
                            : 'bg-amber-500/20 border-amber-500/45 text-amber-300'
                        }`}
                      >
                        <Tag className="w-2.5 h-2.5" />
                        <span>{modalActiveSku}</span>
                        {!editingId && <span className="opacity-75 font-normal">(Auto)</span>}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tersinkronisasi real-time ke tombol + Topping Kasir POS &amp; HPP Gudang Dapur
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-semibold">
                      Nama Topping / Add-on <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="cth. Extra Sosis Bakar"
                      className={`w-full px-3 py-2 rounded-xl border outline-none ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-[#0d1117] border-[#30363d] text-white focus:border-amber-500'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold">Kategori Menu POS</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as FnbToppingCategory)}
                      className={`w-full px-3 py-2 rounded-xl border outline-none cursor-pointer ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-[#0d1117] border-[#30363d] text-white focus:border-amber-500'
                      }`}
                    >
                      <option value="MAIN_FOOD">Makanan Utama</option>
                      <option value="DRINK">Kopi &amp; Non-Kopi</option>
                      <option value="PASTRY_SNACK">Pastry &amp; Snack</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-semibold">Harga Tambahan POS (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border font-mono tabular-nums outline-none ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-[#0d1117] border-[#30363d] text-white focus:border-amber-500'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold">Status Tampil di Kasir POS</label>
                    <button
                      type="button"
                      onClick={() => setFormIsActive((v) => !v)}
                      className={`w-full px-3 py-2 rounded-xl border font-semibold flex items-center justify-between cursor-pointer transition ${
                        formIsActive
                          ? isLight
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                            : 'bg-emerald-500/15 border-emerald-500/45 text-emerald-300'
                          : isLight
                          ? 'bg-slate-100 border-slate-300 text-slate-600'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <span>{formIsActive ? 'Aktif (Muncul di POS)' : 'Nonaktif (Disembunyikan)'}</span>
                      {formIsActive ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <PauseCircle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Section Tautan Bahan Baku Gudang (BOM) & Referensi HPP Read-Only */}
                <div
                  className={`p-3.5 rounded-xl border space-y-3 ${
                    isLight
                      ? 'bg-cyan-50/50 border-cyan-200'
                      : 'bg-cyan-950/20 border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-xs flex items-center gap-1.5 text-cyan-500">
                      <Package className="w-3.5 h-3.5" />
                      <span>Tautan Bahan Baku Gudang (BOM &amp; HPP Otomatis)</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="block text-[11px] font-medium text-slate-400">
                        Pilih SKU Bahan Baku Gudang Dapur
                      </label>
                      <button
                        id="btn-quick-register-raw-material"
                        type="button"
                        onClick={() => setIsQuickRawOpen((v) => !v)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition cursor-pointer ${
                          isQuickRawOpen
                            ? isLight
                              ? 'bg-slate-200 border-slate-300 text-slate-700'
                              : 'bg-slate-800 border-slate-600 text-slate-200'
                            : isLight
                            ? 'bg-cyan-100/80 border-cyan-300 text-cyan-800 hover:bg-cyan-200/80'
                            : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25'
                        }`}
                      >
                        <PackagePlus className="w-3 h-3" />
                        <span>{isQuickRawOpen ? 'Tutup Form Cepat' : '+ Daftarkan SKU Bahan Baku Baru'}</span>
                      </button>
                    </div>

                    <select
                      value={formRawMaterialId}
                      onChange={(e) => setFormRawMaterialId(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border outline-none cursor-pointer text-xs ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                          : 'bg-[#0d1117] border-[#30363d] text-white focus:border-cyan-500'
                      }`}
                    >
                      <option value="">-- Tidak Ditautkan (Non-BOM / Layanan • HPP Rp 0) --</option>
                      {availableRawMaterials.map((rm) => (
                        <option key={rm.id} value={rm.id}>
                          {rm.id} — {rm.name} (Rp {rm.costPerUnit.toLocaleString('id-ID')}/{rm.unit} • Stok: {rm.stock.toLocaleString('id-ID')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mini-Form Inline: Daftarkan SKU Bahan Baku Gudang Dapur Baru */}
                  {isQuickRawOpen && (
                    <div
                      id="quick-register-raw-material-panel"
                      className={`p-3 rounded-xl border space-y-2.5 animate-in fade-in ${
                        isLight
                          ? 'bg-white border-cyan-300 shadow-xs'
                          : 'bg-[#0d1117] border-cyan-500/45 shadow-inner'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-500">
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>Pendaftaran Cepat Bahan Baku Gudang</span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded border font-mono text-[10px] font-bold ${
                            isLight
                              ? 'bg-cyan-50 border-cyan-300 text-cyan-800'
                              : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          }`}
                        >
                          Auto: {nextAutoRawSku}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="block text-[10px] text-slate-400">
                            Nama Bahan Baku <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={quickRawName}
                            onChange={(e) => setQuickRawName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleQuickCreateRawMaterial();
                              }
                            }}
                            placeholder="cth. Sosis Bakar Bratwurst"
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${
                              isLight
                                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                                : 'bg-[#161b22] border-[#30363d] text-white focus:border-cyan-500'
                            }`}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] text-slate-400">Satuan</label>
                          <select
                            value={quickRawUnit}
                            onChange={(e) => setQuickRawUnit(e.target.value as 'Gram' | 'Ml' | 'Pcs')}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none cursor-pointer ${
                              isLight
                                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                                : 'bg-[#161b22] border-[#30363d] text-white focus:border-cyan-500'
                            }`}
                          >
                            <option value="Pcs">Pcs</option>
                            <option value="Gram">Gram</option>
                            <option value="Ml">Ml</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] text-slate-400">
                            Harga Modal Satuan (Rp/{quickRawUnit})
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={50}
                            value={quickRawCost}
                            onChange={(e) => setQuickRawCost(e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded-lg border font-mono tabular-nums text-xs outline-none ${
                              isLight
                                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                                : 'bg-[#161b22] border-[#30363d] text-white focus:border-cyan-500'
                            }`}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] text-slate-400">
                            Stok Awal ({quickRawUnit})
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={quickRawStock}
                            onChange={(e) => setQuickRawStock(e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded-lg border font-mono tabular-nums text-xs outline-none ${
                              isLight
                                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                                : 'bg-[#161b22] border-[#30363d] text-white focus:border-cyan-500'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={resetQuickRawForm}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          Batal
                        </button>
                        <button
                          id="btn-confirm-quick-register-raw"
                          type="button"
                          onClick={handleQuickCreateRawMaterial}
                          className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-[11px] cursor-pointer transition shadow-xs"
                        >
                          Daftarkan &amp; Tautkan ({nextAutoRawSku})
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Takaran & Referensi HPP Read-Only (Tanpa Input HPP Manual) */}
                  <div className={`grid gap-3 ${selectedRawMaterial ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    {selectedRawMaterial && (
                      <div className="space-y-1">
                        <label className="block text-[11px] text-slate-400">
                          Takaran per Porsi ({selectedRawMaterial.unit})
                        </label>
                        <input
                          type="number"
                          min={0.1}
                          step="any"
                          value={formRawMaterialQty}
                          onChange={(e) => setFormRawMaterialQty(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border font-mono tabular-nums outline-none ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                              : 'bg-[#0d1117] border-[#30363d] text-white focus:border-cyan-500'
                          }`}
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Lock className="w-3 h-3 text-emerald-500" />
                        <span>Referensi HPP Bahan Baku Gudang</span>
                      </label>
                      <div
                        className={`px-3 py-2 rounded-xl border font-mono tabular-nums ${
                          isLight
                            ? 'bg-slate-100 border-slate-200 text-emerald-700'
                            : 'bg-[#0d1117]/80 border-[#30363d] text-emerald-400'
                        }`}
                      >
                        <div className="font-bold text-xs">
                          Rp {computedFormHpp.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] font-sans text-slate-400 mt-0.5">
                          {selectedRawMaterial
                            ? `Rp ${selectedRawMaterial.costPerUnit.toLocaleString('id-ID')}/${selectedRawMaterial.unit} × ${Math.max(0, Number(formRawMaterialQty) || 0)} ${selectedRawMaterial.unit}`
                            : 'Non-BOM / Layanan • HPP Rp 0 (tidak memotong stok gudang)'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold">Catatan Internal (Opsional)</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="cth. 1 porsi = 50gr ayam fillet suwir"
                    className={`w-full px-3 py-2 rounded-xl border outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                        : 'bg-[#0d1117] border-[#30363d] text-white focus:border-amber-500'
                    }`}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className={`px-4 py-2 rounded-xl border font-medium cursor-pointer ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        : 'bg-[#21262d] border-[#30363d] text-slate-300 hover:bg-[#30363d]'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    {editingId ? 'Simpan Perubahan' : `Simpan Topping (${modalActiveSku})`}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
