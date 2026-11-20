import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product } from '../../types';
import { Search, X, Plus, Package, Barcode, ArrowUpDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getServiceFormatMeta } from '../../data/serviceData';

interface ManualProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  language?: 'ID' | 'EN';
  terminalName?: string;
  showAllCategories?: boolean;
  onToggleShowAllCategories?: () => void;
  isServiceMode?: boolean;
}

export const ManualProductSearchModal: React.FC<ManualProductSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  language = 'ID',
  terminalName,
  isServiceMode = false,
}) => {
  const { theme, isService } = useApp();
  const effectiveServiceMode = isServiceMode || isService;
  const isLight = theme === 'light';
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  const getUnitOptions = (prod: Product) => {
    const options = [prod.unit || 'Pcs'];
    if (prod.unitSecondary) options.push(prod.unitSecondary);
    return options;
  };

  const activeProducts = useMemo(() => {
    return products.filter((p) => {
      const stUpper = String(p.status || 'Active').trim().toUpperCase();
      if (stUpper === 'DISCONTINUED' || stUpper === 'INACTIVE' || stUpper === 'NONAKTIF') return false;
      if (p.itemType === 'RAW_MATERIAL') return false;
      const idLower = (p.id || '').toLowerCase();
      if (idLower.startsWith('ing-') || idLower.startsWith('raw-')) return false;
      const catLower = (p.category || '').toLowerCase();
      if (catLower.includes('bahan baku') || catLower.includes('bahan mentah')) return false;
      return true;
    });
  }, [products]);

  const categories = useMemo(() => {
    const available = new Set<string>();
    activeProducts.forEach((p) => {
      if (p.category && !p.category.includes('(') && !p.category.includes(')')) {
        available.add(p.category.trim());
      }
    });
    return ['ALL', ...Array.from(available)];
  }, [activeProducts]);

  const filtered = useMemo(() => {
    return activeProducts.filter((p) => {
      const matchCat =
        selectedCat === 'ALL' ||
        (p.category && p.category.toLowerCase() === selectedCat.toLowerCase());
      const q = search.toLowerCase().trim();
      const desc = p.description || '';
      const brand = p.brand || '';
      const name = p.name || '';
      const id = p.id || '';
      const cat = p.category || '';
      const matchSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        brand.toLowerCase().includes(q) ||
        id.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q)) ||
        cat.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeProducts, selectedCat, search]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filtered.length, search, selectedCat]);

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setSearch('');
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!itemsContainerRef.current) return;
    const targetEl = itemsContainerRef.current.querySelector(
      `[data-search-idx="${highlightedIndex}"]`
    ) as HTMLElement | null;
    if (targetEl) {
      targetEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [highlightedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, Math.max(0, filtered.length - 1)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0 && highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        const selected = filtered[highlightedIndex];
        const qty = quantities[selected.id] || 1;
        const unit = selectedUnits[selected.id] || selected.unit || 'Pcs';
        onSelectProduct({ ...selected, unit, qty } as any);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
  };

  const [displayLimit, setDisplayLimit] = useState(30);

  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen, onClose]);

  // Reset display limit when search or category changes
  useEffect(() => {
    setDisplayLimit(30);
  }, [search, selectedCat]);

  const displayedProducts = useMemo(() => {
    return filtered.slice(0, displayLimit);
  }, [filtered, displayLimit]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-manual-product-search"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-900'
            : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-white'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/60'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="px-2.5 py-1 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-mono font-normal text-[11px] tracking-widest">
              [F3]
            </div>
            <div>
              <h3 className="text-base leading-6 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <span>
                  {effectiveServiceMode
                    ? 'Pilih Paket Layanan & Produk Salon [F3]'
                    : language === 'ID'
                    ? 'Cari Produk Manual [F3]'
                    : 'Manual Product Search [F3]'}
                </span>
                <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 hidden sm:inline-flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3" />
                  <span>{language === 'ID' ? 'Panah Atas / Bawah + Enter' : 'Arrow Up/Down + Enter'}</span>
                </span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-normal transition cursor-pointer active:scale-[0.99] ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-800/60 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            {language === 'ID' ? 'Selesai Belanja [Esc]' : 'Finish [Esc]'}
          </button>
        </div>

        {/* Search Bar & Category Chips */}
        <div className={`p-4 border-b space-y-3 shrink-0 ${
          isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-950/40'
        }`}>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              autoFocus
              placeholder={
                effectiveServiceMode
                  ? 'Ketik nama paket jasa, produk salon, atau kode SKU (SVC-BRB / PRD-BRB / SVC-LND)...'
                  : language === 'ID'
                  ? 'Ketik nama barang, barcode, merk, SKU... (↑/↓ navigasi, Enter tambah)'
                  : 'Search product name, barcode, brand, SKU... (↑/↓ navigate, Enter add)'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full text-sm leading-5 font-normal placeholder:italic pl-9 pr-8 py-2 rounded-xl outline-none transition border ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                  : 'bg-slate-900 border-slate-700 text-white focus:border-cyan-400'
              }`}
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map((cat, catIdx) => (
              <button
                key={`cat-${cat}-${catIdx}`}
                onClick={() => {
                  setSelectedCat(cat);
                  searchInputRef.current?.focus();
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono font-normal tracking-wide whitespace-nowrap transition cursor-pointer active:scale-[0.99] border ${
                  selectedCat === cat
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-xs'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                    : 'bg-slate-800/60 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'ALL' ? (language === 'ID' ? 'Semua' : 'All') : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div
          ref={itemsContainerRef}
          className={`flex-1 overflow-y-auto p-4 space-y-1 divide-y ${
            isLight ? 'divide-slate-200 bg-white' : 'divide-slate-800 bg-slate-900'
          }`}
        >
          {displayedProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Package className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <p className="text-sm font-normal">
                {language === 'ID' ? 'Produk tidak ditemukan' : 'No products found'}
              </p>
            </div>
          ) : (
            <>
              {displayedProducts.map((prod, pIdx) => {
                const isLowOrNegativeStock = (prod.stock ?? 0) <= 0;
                const isHighlighted = highlightedIndex === pIdx;
                const qty = quantities[prod.id] || 1;
                const unit = selectedUnits[prod.id] || prod.unit || 'Pcs';
                
                return (
                  <div
                    key={`f1-prod-${prod.id || prod.barcode || 'item'}-${pIdx}`}
                    data-search-idx={pIdx}
                    className={`px-3 py-2 flex items-center justify-between gap-4 transition border rounded-xl ${
                      isHighlighted
                        ? isLight
                          ? 'bg-cyan-50 border-cyan-400 shadow-xs'
                          : 'bg-cyan-500/15 border-cyan-500/60 shadow-xs'
                        : isLight
                        ? 'border-transparent hover:bg-slate-50'
                        : 'border-transparent hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm leading-5 font-normal truncate text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5">
                        <span>{prod.name}</span>
                        {effectiveServiceMode && (() => {
                          const fmtMeta = getServiceFormatMeta(prod);
                          return (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${fmtMeta.badgeClass}`}
                            >
                              {fmtMeta.label}
                            </span>
                          );
                        })()}
                        {!effectiveServiceMode && prod.variantMatrix && prod.variantMatrix.length > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/35">
                            Matriks Ukuran×Warna ({prod.variantMatrix.filter((c) => c.stock > 0).length} varian)
                          </span>
                        )}
                        {!effectiveServiceMode && prod.fashionPromo?.clearanceActive && (prod.fashionPromo.clearanceValue || 0) > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/35">
                            Clearance {prod.fashionPromo.clearanceType === 'NOMINAL' ? `Rp ${Number(prod.fashionPromo.clearanceValue).toLocaleString('id-ID')}` : `${prod.fashionPromo.clearanceValue}%`}
                          </span>
                        )}
                        {!effectiveServiceMode && prod.fashionPromo?.bundleActive && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/35">
                            {prod.fashionPromo.bundleLabel || 'Mix & Match / Bundle'}
                          </span>
                        )}
                        {(prod.slaDuration || prod.serviceDuration) && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                            ⏱ {prod.slaDuration || prod.serviceDuration}
                          </span>
                        )}
                        {prod.laundryUnitType && (prod.minOrderWeightKg || prod.minOrderQty) && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                            Min. {prod.minOrderWeightKg ?? prod.minOrderQty} {prod.unit || 'kg'}
                          </span>
                        )}
                        {isLowOrNegativeStock && prod.itemType !== 'SERVICE' && (
                          <span className="text-[11px] font-mono font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded">
                            {(prod.stock ?? 0) < 0 ? `Stok Minus (${prod.stock})` : 'Stok 0 (Tetap Bisa Jual)'}
                          </span>
                        )}
                      </div>
                      {effectiveServiceMode && prod.packageDetails && (
                        <div className="text-[11px] leading-4 text-amber-700 dark:text-amber-300/90 mt-0.5">
                          Isi Paket: {prod.packageDetails}
                        </div>
                      )}
                      <div className="text-[11px] leading-4 text-slate-500 dark:text-slate-400 font-mono font-normal">
                        {prod.sku || prod.barcode || prod.id} • {prod.itemType === 'SERVICE' ? `Jasa (${prod.serviceDuration || prod.slaDuration || prod.unit || 'Sesi'})` : `Stok: ${prod.stock ?? 0} ${prod.unit || 'Pcs'}`}
                      </div>
                    </div>

                    <div className="flex-none w-48">
                      <select 
                        className={`w-full text-xs font-mono font-normal p-1.5 rounded-lg border cursor-pointer outline-none ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900'
                            : 'bg-slate-950 border-slate-700 text-white'
                        }`}
                        value={unit}
                        onChange={(e) => setSelectedUnits(prev => ({...prev, [prod.id]: e.target.value}))}
                      >
                        <option value={prod.unit || 'Pcs'}>
                          {prod.unit || 'Pcs'} - Rp {Number(prod.sell_price).toLocaleString('id-ID')}
                        </option>
                        {prod.unitSecondary && (
                          <option value={prod.unitSecondary}>
                              {prod.unitSecondary} {prod.priceSecondary ? `- Rp ${Number(prod.priceSecondary).toLocaleString('id-ID')}` : ''}
                          </option>
                        )}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 flex-none">
                      <div className={`flex items-center rounded-lg border ${
                        isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                      }`}>
                        <button
                          onClick={() =>
                            setQuantities((prev) => ({
                              ...prev,
                              [prod.id]: Math.max(prod.supportDecimal ? 0.5 : 1, Number(((prev[prod.id] || 1) - (prod.supportDecimal ? 0.5 : 1)).toFixed(2))),
                            }))
                          }
                          className="px-2.5 py-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer active:scale-[0.99]"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step={prod.supportDecimal ? '0.01' : '1'}
                          className="w-12 text-center bg-transparent text-xs font-mono font-normal text-slate-900 dark:text-white outline-none"
                          value={qty}
                          onChange={(e) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [prod.id]: Math.max(prod.supportDecimal ? 0.01 : 1, parseFloat(e.target.value) || 1),
                            }))
                          }
                        />
                        <button
                          onClick={() =>
                            setQuantities((prev) => ({
                              ...prev,
                              [prod.id]: Number(((prev[prod.id] || 1) + (prod.supportDecimal ? 0.5 : 1)).toFixed(2)),
                            }))
                          }
                          className="px-2.5 py-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer active:scale-[0.99]"
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProduct({ ...prod, unit, qty } as any);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer active:scale-[0.99] shadow-xs ${
                          isLowOrNegativeStock
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                );
              })}

              {filtered.length > displayLimit && (
                <div className="py-4 flex justify-center">
                  <button
                    onClick={() => setDisplayLimit((prev) => prev + 30)}
                    className={`px-5 py-2 rounded-xl text-xs font-normal transition border shadow-xs cursor-pointer active:scale-[0.99] ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-cyan-700'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-400'
                    }`}
                  >
                    {language === 'ID' ? `Muat Lebih Banyak (+${filtered.length - displayLimit} item)` : `Load More (+${filtered.length - displayLimit} items)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
