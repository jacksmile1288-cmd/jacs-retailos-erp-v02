import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product } from '../../types';
import { Search, X, Plus, Package, Tag, Barcode, CornerDownLeft, ArrowUpDown } from 'lucide-react';

interface ManualProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  language?: 'ID' | 'EN';
  showAllCategories?: boolean;
  onToggleShowAllCategories?: () => void;
  terminalName?: string;
}

export const ManualProductSearchModal: React.FC<ManualProductSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  language = 'ID',
  showAllCategories = false,
  onToggleShowAllCategories,
  terminalName,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  const activeProducts = useMemo(() => {
    return products.filter((p) => {
      if (String(p.status).toUpperCase() === 'DISCONTINUED') return false;
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

  // Reset highlight index when filter or search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filtered.length, search, selectedCat]);

  // Focus search input when modal opens
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

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (!itemsContainerRef.current) return;
    const targetEl = itemsContainerRef.current.querySelector(
      `[data-search-idx="${highlightedIndex}"]`
    ) as HTMLElement | null;
    if (targetEl) {
      targetEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [highlightedIndex]);

  // Keyboard navigation within the modal
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
        if ((selected.stock ?? 0) > 0) {
          onSelectProduct(selected);
          onClose();
        }
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
  };

  // Global window listener for Escape or Arrow keys when modal is open
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

  if (!isOpen) return null;

  return (
    <div
      id="modal-manual-product-search"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-white"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="px-2.5 py-1 rounded-xl bg-[#0052FF]/20 text-[#58a6ff] border border-[#0052FF]/30 flex items-center justify-center font-mono font-bold text-xs">
              F3 / F1
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>{language === 'ID' ? 'Cari Produk Manual [F3]' : 'Manual Product Search [F3]'}</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 hidden sm:inline-flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3" />
                  <span>{language === 'ID' ? 'Panah Atas / Bawah + Enter' : 'Arrow Up/Down + Enter'}</span>
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">
                {language === 'ID'
                  ? 'Gunakan tombol Panah ↑ / ↓ untuk memilih barang, Enter untuk menambahkan, dan Esc untuk menutup.'
                  : 'Use Arrow ↑ / ↓ keys to navigate products, Enter to add to cart, and Esc to close.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#21262d] transition cursor-pointer"
            title="Tutup [Esc]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Category Chips & Toggle Semua Kategori */}
        <div className="p-4 border-b border-[#30363d] space-y-3 bg-[#0d1117]/60">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              autoFocus
              placeholder={
                language === 'ID'
                  ? 'Ketik nama barang, barcode, merk, SKU... (↑/↓ navigasi, Enter pilih)'
                  : 'Search product name, barcode, brand, SKU... (↑/↓ navigate, Enter select)'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-[#161b22] border border-[#30363d] text-white text-xs pl-9 pr-8 py-2.5 rounded-xl outline-none focus:border-[#0052FF] focus:ring-1 focus:ring-[#0052FF]"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Toggle Switch 'Semua Kategori' */}
          {onToggleShowAllCategories && (
            <div className="flex items-center justify-between px-1 py-0.5 text-xs">
              <span className="text-[11px] text-gray-400">
                {showAllCategories
                  ? (language === 'ID' ? '🌐 Menampilkan SELURUH kategori katalog sistem' : '🌐 Showing ALL product categories')
                  : (language === 'ID' ? `🔒 Filter aktif sesuai industri ${terminalName ? `[${terminalName}]` : ''}` : `🔒 Filtered by terminal industry ${terminalName ? `[${terminalName}]` : ''}`)}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={showAllCategories}
                onClick={onToggleShowAllCategories}
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  showAllCategories
                    ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-300'
                    : 'bg-[#161b22] border-[#30363d] text-gray-300 hover:bg-[#21262d]'
                }`}
                title={
                  showAllCategories
                    ? (language === 'ID' ? 'Kembali ke filter khusus industri terminal' : 'Return to terminal filter')
                    : (language === 'ID' ? 'Buka seluruh kategori produk' : 'Unlock all categories')
                }
              >
                <span className="text-[10px] font-bold">
                  {language === 'ID' ? 'Semua Kategori' : 'All Categories'}
                </span>
                <div
                  className={`relative inline-flex h-4 w-7 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    showAllCategories ? 'bg-indigo-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      showAllCategories ? 'translate-x-3' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>
            </div>
          )}

          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map((cat, catIdx) => (
              <button
                key={`cat-${cat}-${catIdx}`}
                onClick={() => {
                  setSelectedCat(cat);
                  searchInputRef.current?.focus();
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCat === cat
                    ? 'bg-[#0052FF] text-white shadow-sm'
                    : 'bg-[#21262d] text-gray-400 hover:text-white'
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
          className="flex-1 overflow-y-auto p-4 divide-y divide-[#30363d]/50 space-y-1"
        >
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Package className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <p className="text-sm font-semibold">
                {language === 'ID' ? 'Produk tidak ditemukan' : 'No products found'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {language === 'ID'
                  ? 'Coba gunakan kata kunci pencarian atau kategori lain'
                  : 'Try searching with different keywords'}
              </p>
            </div>
          ) : (
            filtered.map((prod, pIdx) => {
              const stockNum = prod.stock ?? 0;
              const isOutOfStock = stockNum <= 0;
              const isHighlighted = highlightedIndex === pIdx;
              const cleanDesc = (prod.description && !prod.description.toLowerCase().includes('unknown'))
                ? prod.description
                : prod.name || 'Produk';
              const sellPrice = Number(prod.sell_price ?? prod.price_retail) || 0;
              return (
                <div
                  key={`f1-prod-${prod.id || prod.barcode || 'item'}-${pIdx}`}
                  data-search-idx={pIdx}
                  onClick={() => {
                    if (!isOutOfStock) {
                      onSelectProduct(prod);
                      onClose();
                    }
                  }}
                  onMouseEnter={() => setHighlightedIndex(pIdx)}
                  className={`pt-2 pb-2 flex items-center justify-between gap-3 p-2.5 rounded-xl transition cursor-pointer border ${
                    isHighlighted
                      ? 'bg-blue-600/20 border-blue-500 shadow-md ring-1 ring-blue-500'
                      : 'border-transparent hover:bg-[#21262d]'
                  } ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.99]'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-xs truncate ${isHighlighted ? 'text-blue-300' : 'text-white'}`}>
                        {cleanDesc}
                      </span>
                      <span className="text-[10px] font-mono bg-[#0d1117] text-gray-400 px-1.5 py-0.5 rounded border border-[#30363d]">
                        {prod.plu || prod.id}
                      </span>
                      {isHighlighted && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-500 text-white font-mono animate-pulse">
                          ENTER
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5 flex-wrap">
                      <span className="text-blue-400 font-semibold">{prod.category || 'Umum'}</span>
                      {prod.brand && <span className="text-cyan-300 font-medium">• {prod.brand}</span>}
                      {prod.barcode && (
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <Barcode className="w-3 h-3 text-gray-500" />
                          {prod.barcode}
                        </span>
                      )}
                      {prod.packagingUnit && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                          {prod.packagingUnit}
                        </span>
                      )}
                      {prod.pharmacyClass && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                          prod.pharmacyClass === 'OBAT_BEBAS'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : prod.pharmacyClass === 'OBAT_BEBAS_TERBATAS'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}>
                          {prod.pharmacyClass.replace(/_/g, ' ')}
                        </span>
                      )}
                      {prod.variantSize && (
                        <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                          Size: {prod.variantSize}
                        </span>
                      )}
                      {prod.warrantyPeriod && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          Garansi: {prod.warrantyPeriod}
                        </span>
                      )}
                      {prod.serviceDuration && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          ⏱ {prod.serviceDuration}
                        </span>
                      )}
                      {prod.unitSecondary && (
                        <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                          Grosir: {prod.unitSecondary}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          isOutOfStock
                            ? 'bg-rose-500/20 text-rose-400'
                            : stockNum <= 10
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {language === 'ID' ? 'Stok' : 'Stock'}: {stockNum}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-xs text-[#10B981]">
                        Rp {sellPrice.toLocaleString('id-ID')}
                      </span>
                      {prod.price_member && (
                        <span className="text-[10px] text-amber-400 font-mono font-semibold">
                          Mbr: Rp {prod.price_member.toLocaleString('id-ID')}
                        </span>
                      )}
                      {prod.price_wholesale && (
                        <span className="text-[10px] text-cyan-400 font-mono font-semibold">
                          Grs: Rp {prod.price_wholesale.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) {
                          onSelectProduct(prod);
                          onClose();
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer ${
                        isHighlighted
                          ? 'bg-blue-600 hover:bg-blue-500 ring-2 ring-blue-400'
                          : 'bg-[#0052FF] hover:bg-[#0043d1]'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'ID' ? 'Tambah [Enter]' : 'Add [Enter]'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span>
              {filtered.length} {language === 'ID' ? 'item ditemukan' : 'items found'}
            </span>
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-400 font-mono">
              <span className="px-1.5 py-0.5 rounded bg-[#21262d] text-gray-300 border border-[#30363d]">[↑/↓] Pilih</span>
              <span className="px-1.5 py-0.5 rounded bg-[#21262d] text-blue-300 border border-[#30363d]">[Enter] Masukkan</span>
              <span className="px-1.5 py-0.5 rounded bg-[#21262d] text-rose-300 border border-[#30363d]">[Esc] Tutup</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-gray-300 font-bold transition cursor-pointer"
          >
            {language === 'ID' ? 'Tutup [Esc]' : 'Close [Esc]'}
          </button>
        </div>
      </div>
    </div>
  );
};
