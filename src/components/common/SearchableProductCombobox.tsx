import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product } from '../../types';
import { Search } from 'lucide-react';

interface SearchableProductComboboxProps {
  products: Product[];
  selectedId: string;
  onSelect: (productId: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchableProductCombobox: React.FC<SearchableProductComboboxProps> = ({
  products,
  selectedId,
  onSelect,
  placeholder = 'Cari produk...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Deduplicate products
  const uniqueProducts = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => {
        if(p.id) map.set(p.id, p);
        else if(p.sku) map.set(p.sku, p);
    });
    return Array.from(map.values());
  }, [products]);

  const filtered = useMemo(() => {
    if (!search) return uniqueProducts.slice(0, 30);
    const q = search.toLowerCase();
    return uniqueProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.sku || '').toLowerCase().includes(q) || 
      (p.id || '').toLowerCase().includes(q)
    );
  }, [uniqueProducts, search]);

  const selectedProduct = useMemo(() => 
    uniqueProducts.find(p => p.id === selectedId), 
  [uniqueProducts, selectedId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div 
        className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 cursor-pointer flex items-center justify-between text-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate text-gray-300">
          {selectedProduct ? `[${selectedProduct.sku || selectedProduct.id}] ${selectedProduct.name} (Stok: ${selectedProduct.stock} Unit)` : placeholder}
        </span>
        <Search className="w-3.5 h-3.5 text-gray-500" />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#161b22] border border-[#30363d] rounded-xl shadow-lg max-h-60 overflow-y-auto">
          <input 
            type="text"
            className="w-full bg-[#0d1117] text-white px-3 py-2 text-xs border-b border-[#30363d] outline-none"
            placeholder="Ketik untuk mencari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {filtered.map(p => (
            <div 
              key={p.id}
              className="px-3 py-2 text-xs text-gray-300 hover:bg-[#21262d] cursor-pointer hover:text-white"
              onClick={() => {
                onSelect(p.id);
                setIsOpen(false);
                setSearch('');
              }}
            >
              [{p.sku || p.id}] {p.name} (Stok: {p.stock} Unit)
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
