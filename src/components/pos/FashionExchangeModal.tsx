import React, { useState, useMemo, useEffect } from 'react';
import {
  Sale,
  Product,
  FashionExchangePayload,
  CartItem,
} from '../../types';
import {
  X,
  ArrowLeftRight,
  Search,
  CheckCircle2,
  Package,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import {
  FASHION_STANDARD_COLORS,
  FASHION_STANDARD_SIZES,
  FASHION_APPAREL_PRODUCTS,
} from '../../data/industryTerminalProducts';
import {
  isFashionSale,
  isFashionProduct,
} from '../../utils/fashionAnalytics';

interface FashionExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
  products: Product[];
  fashionAdvisorId?: string;
  fashionAdvisorName?: string;
  activeStationCode?: string;
  activeTerminalId?: string;
  activeShiftId?: string;
  isLight?: boolean;
  onSubmitExchange: (payload: FashionExchangePayload) => {
    success: boolean;
    message: string;
  };
}

export const FashionExchangeModal: React.FC<FashionExchangeModalProps> = ({
  isOpen,
  onClose,
  sales,
  products,
  fashionAdvisorId,
  fashionAdvisorName,
  activeStationCode,
  activeTerminalId,
  activeShiftId,
  isLight = false,
  onSubmitExchange,
}) => {
  const [receiptSearch, setReceiptSearch] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [selectedOldItemIdx, setSelectedOldItemIdx] = useState<number>(0);
  const [returnedSize, setReturnedSize] = useState<string>('M');
  const [returnedColor, setReturnedColor] = useState<string>('Sage');

  const [replacementProductId, setReplacementProductId] = useState<string>('');
  const [replacementSize, setReplacementSize] = useState<string>('L');
  const [replacementColor, setReplacementColor] = useState<string>('Sage');
  const [exchangeQty, setExchangeQty] = useState<number>(1);
  const [payMethod, setPayMethod] = useState<'CASH' | 'QRIS' | 'EDC_DEBIT'>('CASH');
  const [reason, setReason] = useState<string>('Tukar Ukuran (Kebesaran / Kekecilan)');

  const getItemProductId = (item?: CartItem | null): string =>
    String(item?.product?.id || (item as any)?.productId || '');

  const getItemProductName = (item?: CartItem | null): string =>
    String(item?.product?.name || (item as any)?.productName || (item as any)?.name || 'Artikel Butik');

  const getItemSellPrice = (item?: CartItem | null): number =>
    Number(item?.product?.sell_price ?? (item as any)?.price ?? (item as any)?.unitPrice ?? 0) || 0;

  const getItemQty = (item?: CartItem | null): number =>
    Math.max(1, Number(item?.quantity ?? (item as any)?.qty ?? 1) || 1);

  // Merge state products + FASHION_APPAREL_PRODUCTS baseline catalog with robust sizeUpcharges fallback
  const fashionProducts = useMemo(() => {
    const map = new Map<string, Product>();
    FASHION_APPAREL_PRODUCTS.forEach((p) => {
      const baselineUpcharges = p.sizeUpcharges || { S: 0, M: 0, L: 0, XL: 10000, XXL: 15000 };
      map.set(p.id, { ...p, sizeUpcharges: baselineUpcharges });
    });
    (products || []).forEach((p) => {
      if (p && (isFashionProduct(p) || p.businessModel === 'fashion' || String(p.id || '').toUpperCase().startsWith('FASH-'))) {
        const baselineMatch = FASHION_APPAREL_PRODUCTS.find((bp) => bp.id === p.id);
        const defaultUpcharges = baselineMatch?.sizeUpcharges || { S: 0, M: 0, L: 0, XL: 10000, XXL: 15000 };
        const mergedUpcharges = {
          ...defaultUpcharges,
          ...(p.sizeUpcharges || {})
        };
        map.set(p.id, { ...p, sizeUpcharges: mergedUpcharges });
      }
    });
    return Array.from(map.values()).filter(
      (p) => String(p.status).toUpperCase() !== 'DISCONTINUED' && p.itemType !== 'RAW_MATERIAL'
    );
  }, [products]);

  // Candidate sales restricted STRICTLY to Fashion & Boutique transactions
  const candidateSales = useMemo(() => {
    const valid = (sales || []).filter(
      (s) =>
        s &&
        !s.isFashionExchange &&
        s.status !== 'VOID' &&
        s.status !== 'VOIDED' &&
        s.status !== 'CANCELLED' &&
        Array.isArray(s.items) &&
        s.items.length > 0 &&
        isFashionSale(s)
    );
    const sorted = [...valid].sort((a, b) => {
      return String(b.created_at || b.date).localeCompare(String(a.created_at || a.date));
    });
    const q = receiptSearch.trim().toLowerCase();
    if (!q) return sorted.slice(0, 10);
    return sorted
      .filter(
        (s) =>
          (s.receipt_number || '').toLowerCase().includes(q) ||
          (s.transaction_id || '').toLowerCase().includes(q) ||
          (s.customer_name || '').toLowerCase().includes(q) ||
          (s.customer_phone || '').toLowerCase().includes(q) ||
          (s.items_summary || '').toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [sales, receiptSearch]);

  const selectedSale = useMemo(
    () =>
      candidateSales.find(
        (s) =>
          s.transaction_id === selectedSaleId ||
          s.receipt_number === selectedSaleId
      ) || candidateSales[0] || null,
    [candidateSales, selectedSaleId]
  );

  const selectedSaleFashionItems = useMemo(() => {
    if (!selectedSale || !Array.isArray(selectedSale.items)) return [];
    return selectedSale.items.filter(
      (it) => isFashionProduct(it?.product) || (it as any)?.selectedFashionSize || (it as any)?.selectedFashionColor
    );
  }, [selectedSale]);

  const selectedOldItem: CartItem | null = useMemo(() => {
    if (selectedSaleFashionItems.length === 0) return null;
    return selectedSaleFashionItems[selectedOldItemIdx] || selectedSaleFashionItems[0] || null;
  }, [selectedSaleFashionItems, selectedOldItemIdx]);

  useEffect(() => {
    if (!isOpen) return;
    if (selectedSale && !selectedSaleId) {
      setSelectedSaleId(selectedSale.transaction_id);
    }
  }, [isOpen, selectedSale, selectedSaleId]);

  useEffect(() => {
    if (!selectedOldItem) return;
    const oldProdId = getItemProductId(selectedOldItem);
    const oldProdRef =
      selectedOldItem.product ||
      fashionProducts.find((p) => p?.id === oldProdId) ||
      null;

    const oldSize =
      selectedOldItem.selectedFashionSize ||
      oldProdRef?.variantSize?.split(',')[0]?.trim() ||
      'M';
    const oldColor =
      selectedOldItem.selectedFashionColor ||
      oldProdRef?.variantColor?.split(',')[0]?.trim() ||
      'Sage';
    setReturnedSize(oldSize);
    setReturnedColor(oldColor);

    const matchingProd =
      fashionProducts.find((p) => p?.id && p.id === oldProdId) ||
      oldProdRef ||
      fashionProducts[0] ||
      null;
    setReplacementProductId(matchingProd?.id || fashionProducts[0]?.id || '');

    const altCell = matchingProd?.variantMatrix?.find(
      (c) =>
        (c.size !== oldSize || c.color !== oldColor) && (Number(c.stock) || 0) > 0
    );
    setReplacementSize(altCell?.size || (oldSize === 'M' ? 'L' : 'M'));
    setReplacementColor(altCell?.color || oldColor);
  }, [selectedOldItem, fashionProducts]);

  // Replacement product lookup with sizeUpcharges guaranteed from baseline
  const replacementProduct = useMemo(() => {
    const foundInFashionList = fashionProducts.find((p) => p?.id && p.id === replacementProductId);
    const foundInState = (products || []).find((p) => p?.id && p.id === replacementProductId);
    const foundInBaseline = FASHION_APPAREL_PRODUCTS.find((p) => p?.id && p.id === replacementProductId);

    const baseProd = foundInFashionList || foundInState || foundInBaseline || selectedOldItem?.product || fashionProducts[0] || null;
    if (!baseProd) return null;

    const baselineMatch = FASHION_APPAREL_PRODUCTS.find((p) => p.id === baseProd.id);
    const defaultUpcharges = baselineMatch?.sizeUpcharges || { S: 0, M: 0, L: 0, XL: 10000, XXL: 15000 };
    const mergedUpcharges = {
      ...defaultUpcharges,
      ...(baseProd.sizeUpcharges || {})
    };
    return {
      ...baseProd,
      sizeUpcharges: mergedUpcharges
    };
  }, [products, replacementProductId, fashionProducts, selectedOldItem]);

  if (!isOpen) return null;

  const oldProdId = getItemProductId(selectedOldItem);
  const oldProdName = getItemProductName(selectedOldItem);
  const oldQty = getItemQty(selectedOldItem);

  const oldItemSize = returnedSize || selectedOldItem?.selectedFashionSize || 'M';
  const oldItemUpcharge = Number(
    selectedOldItem?.product?.sizeUpcharges?.[oldItemSize] ||
      selectedOldItem?.product?.sizeUpcharges?.[oldItemSize?.toUpperCase()] ||
      replacementProduct?.sizeUpcharges?.[oldItemSize] ||
      replacementProduct?.sizeUpcharges?.[oldItemSize?.toUpperCase()] ||
      0
  );
  const oldUnitPrice = selectedOldItem
    ? Math.max(
        0,
        Math.round(
          (Number(selectedOldItem.subtotal) || (getItemSellPrice(selectedOldItem) + oldItemUpcharge) * oldQty) /
            Math.max(1, oldQty)
        )
      )
    : 0;

  const computeEffectiveFashionPrice = (prod: Product | null, sz: string): number => {
    if (!prod) return 0;
    const base = Number(prod.sell_price ?? prod.price_retail ?? 0);
    const up = Number(prod.sizeUpcharges?.[sz] || prod.sizeUpcharges?.[sz.toUpperCase()] || prod.sizeUpcharges?.[sz.toLowerCase()] || 0);
    const raw = base + up;
    if (prod.fashionPromo?.clearanceActive && (prod.fashionPromo.clearanceValue || 0) > 0) {
      const sav =
        prod.fashionPromo.clearanceType === 'NOMINAL'
          ? Math.min(raw, Number(prod.fashionPromo.clearanceValue) || 0)
          : Math.round((raw * Math.min(100, Number(prod.fashionPromo.clearanceValue) || 0)) / 100);
      return Math.max(0, raw - sav);
    }
    return raw;
  };

  const newUnitPrice = computeEffectiveFashionPrice(replacementProduct, replacementSize);

  const qty = Math.max(1, exchangeQty);
  // Pure price difference calculation: (New Variant Price * Qty) - (Old Item Credit * Qty)
  // Supports size upcharge differences (e.g. M to XXL -> +Rp 15.000)
  const priceDifference = (newUnitPrice - oldUnitPrice) * qty;

  const repMatrix = replacementProduct?.variantMatrix || [];
  const repSizes =
    repMatrix.length > 0
      ? Array.from(new Set(repMatrix.map((c) => c.size)))
      : FASHION_STANDARD_SIZES;
  const repColors =
    repMatrix.length > 0
      ? Array.from(new Set(repMatrix.map((c) => c.color)))
      : FASHION_STANDARD_COLORS;

  const handleConfirmExchange = () => {
    if (!selectedSale || !selectedOldItem || !replacementProduct) return;
    const res = onSubmitExchange({
      originalSaleId: selectedSale.transaction_id,
      originalReceiptNumber: selectedSale.receipt_number || selectedSale.transaction_id,
      customerId: selectedSale.customer_id,
      customerName: selectedSale.customer_name,
      customerPhone: selectedSale.customer_phone,
      returnedProductId: oldProdId,
      returnedProductName: oldProdName,
      returnedSize,
      returnedColor,
      returnedUnitPrice: oldUnitPrice,
      replacementProductId: replacementProduct.id,
      replacementProductName: replacementProduct.name,
      replacementSize,
      replacementColor,
      replacementUnitPrice: newUnitPrice,
      qty,
      priceDifference,
      paymentMethod: priceDifference === 0 ? 'TUKAR IMPAS (Rp 0)' : payMethod,
      fashionAdvisorId,
      fashionAdvisorName,
      reason,
      stationCode: activeStationCode,
      terminalId: activeTerminalId,
      shiftId: activeShiftId,
    });
    if (res.success) {
      onClose();
    }
  };

  const isSameArticle = Boolean(
    selectedOldItem &&
      replacementProduct &&
      oldProdId &&
      replacementProduct.id &&
      oldProdId.trim().toLowerCase() === replacementProduct.id.trim().toLowerCase()
  );

  return (
    <div
      id="modal-fashion-exchange"
      onClick={onClose}
      className="fixed inset-0 z-55 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isLight
            ? 'bg-white border-purple-400/70 text-slate-900'
            : 'bg-slate-900 border-purple-500/40 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isLight ? 'bg-purple-50/70 border-slate-200' : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/35 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Tukar Ukuran / Barang Butik (Fashion &amp; Butik)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih struk butik, kembalikan stok varian lama (+1), kurangi varian baru (-1), &amp; hitung selisih harga upcharge
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'border-slate-200 text-slate-500 hover:bg-slate-100'
                : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Search Original Receipt */}
          <div className="space-y-2">
            <label className="text-xs font-semibold flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-purple-500" />
              <span>1. Cari &amp; Pilih Nomor Struk Penjualan Butik</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={receiptSearch}
                onChange={(e) => setReceiptSearch(e.target.value)}
                placeholder="Ketik No. Struk Butik (INV-...), nama pelanggan, atau nama artikel baju..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500'
                    : 'bg-slate-950 border-slate-700 text-white focus:border-purple-500'
                }`}
              />
            </div>

            {candidateSales.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 space-y-1">
                <Package className="w-8 h-8 mx-auto opacity-40" />
                <p>Belum ada transaksi penjualan Fashion &amp; Butik yang tercatat pada sesi ini untuk ditukar.</p>
                <p className="text-[11px]">Lakukan checkout penjualan di POS Butik terlebih dahulu, lalu cari nomor struknya di sini.</p>
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {candidateSales.map((s, idx) => {
                  const saleKey = s.transaction_id || s.receipt_number || `sale-${idx}`;
                  const isSel = selectedSale?.transaction_id === s.transaction_id;
                  return (
                    <button
                      key={saleKey}
                      type="button"
                      onClick={() => {
                        setSelectedSaleId(s.transaction_id);
                        setSelectedOldItemIdx(0);
                      }}
                      className={`px-3 py-2 rounded-xl border text-left shrink-0 min-w-[220px] cursor-pointer transition ${
                        isSel
                          ? 'bg-purple-600/15 border-purple-500 ring-1 ring-purple-500'
                          : isLight
                          ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                          : 'bg-slate-950 hover:bg-slate-800 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                        <span className="font-bold text-purple-600 dark:text-purple-300">
                          {s.receipt_number || s.transaction_id}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Rp {(Number(s.total_amount) || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="text-[11px] truncate mt-0.5 font-medium">
                        {s.customer_name || 'Walk-in Guest'}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {s.items_summary}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedSale && selectedOldItem && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* LEFT: Old Item Returned (+1 Stock) with locked size/color */}
              <div
                className={`p-3.5 rounded-xl border space-y-3 ${
                  isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/15 border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    2. Item &amp; Varian Dikembalikan (+{qty} Stok)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200">
                    Struk: {selectedSale.receipt_number || selectedSale.transaction_id}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pilih Item Butik dari Struk:
                  </label>
                  <select
                    value={selectedOldItemIdx}
                    onChange={(e) => setSelectedOldItemIdx(Number(e.target.value) || 0)}
                    className={`w-full px-2.5 py-2 rounded-xl border text-xs outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  >
                    {selectedSaleFashionItems.map((it, idx) => (
                      <option key={`old-item-${getItemProductId(it) || 'item'}-${idx}`} value={idx}>
                        {getItemProductName(it)} ({it?.selectedFashionSize || 'M'} •{' '}
                        {it?.selectedFashionColor || 'Sage'}) — {getItemQty(it)}x
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">
                      Ukuran Lama (Terkunci)
                    </label>
                    <select
                      value={returnedSize}
                      disabled
                      className={`w-full px-2 py-1.5 rounded-lg border text-xs font-mono opacity-80 cursor-not-allowed ${
                        isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <option value={returnedSize}>{returnedSize}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">
                      Warna Lama (Terkunci)
                    </label>
                    <select
                      value={returnedColor}
                      disabled
                      className={`w-full px-2 py-1.5 rounded-lg border text-xs opacity-80 cursor-not-allowed ${
                        isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <option value={returnedColor}>{returnedColor}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">
                      Qty Tukar
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, Math.floor(oldQty))}
                      value={qty}
                      onChange={(e) =>
                        setExchangeQty(
                          Math.max(
                            1,
                            Math.min(
                              Math.floor(oldQty),
                              parseInt(e.target.value, 10) || 1
                            )
                          )
                        )
                      }
                      className={`w-full px-2 py-1.5 rounded-lg border text-xs font-mono text-center ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 block mb-1">
                    Alasan Penukaran
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  >
                    <option value="Tukar Ukuran (Kebesaran / Kekecilan)">
                      Tukar Ukuran (Kebesaran / Kekecilan)
                    </option>
                    <option value="Tukar Warna / Motif">Tukar Warna / Motif</option>
                    <option value="Ganti Model / Upgrade Artikel Lain">
                      Ganti Model / Upgrade Artikel Lain
                    </option>
                    <option value="Cacat Jahitan / Kancing Lepas">
                      Cacat Jahitan / Kancing Lepas
                    </option>
                  </select>
                </div>

                <div className="pt-2 border-t border-amber-500/25 flex justify-between text-xs font-mono">
                  <span>Nilai Kredit Barang Lama ({returnedSize}):</span>
                  <span className="font-bold">
                    Rp {(oldUnitPrice * qty).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* RIGHT: Replacement Product & Size x Color Matrix with Upcharge Badges (+10k/+15k) */}
              <div
                className={`p-3.5 rounded-xl border space-y-3 ${
                  isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/15 border-emerald-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    3. Artikel &amp; Varian Pengganti (-{qty} Stok)
                  </span>
                  {isSameArticle && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      Model Sama
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 dark:text-slate-400">
                    Produk Pengganti:
                  </label>
                  <select
                    value={replacementProduct?.id || ''}
                    onChange={(e) => setReplacementProductId(e.target.value)}
                    className={`w-full px-2.5 py-2 rounded-xl border text-xs outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  >
                    {fashionProducts.map((p, idx) => (
                      <option key={`rep-prod-${p.id || idx}`} value={p.id}>
                        {p.name} — Rp {Number(p.sell_price ?? p.price_retail ?? 0).toLocaleString('id-ID')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mini Size x Color Matrix with +10k / +15k Badges */}
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className={isLight ? 'bg-slate-100' : 'bg-slate-950'}>
                        <th className="py-1 px-2 text-left font-mono">Size \ Warna</th>
                        {repColors.map((cl, cIdx) => (
                          <th key={`matrix-col-${cl}-${cIdx}`} className="py-1 px-1.5 text-center font-medium">
                            {cl}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {repSizes.map((sz, sIdx) => {
                        const szUpcharge = Number(replacementProduct?.sizeUpcharges?.[sz] || replacementProduct?.sizeUpcharges?.[sz.toUpperCase()] || 0);
                        return (
                          <tr key={`matrix-row-${sz}-${sIdx}`}>
                            <td className="py-1 px-2 font-mono font-bold">
                              <div className="flex items-center justify-between gap-1">
                                <span>{sz}</span>
                                {szUpcharge > 0 && (
                                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300">
                                    +{szUpcharge >= 1000 ? `${szUpcharge / 1000}k` : szUpcharge}
                                  </span>
                                )}
                              </div>
                            </td>
                            {repColors.map((cl, cIdx) => {
                              const cell = repMatrix.find(
                                (c) => c.size === sz && c.color === cl
                              );
                              const st = cell ? Number(cell.stock) || 0 : 0;
                              const isPicked =
                                replacementSize === sz && replacementColor === cl;
                              return (
                                <td key={`matrix-cell-${sz}-${cl}-${cIdx}`} className="p-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplacementSize(sz);
                                      setReplacementColor(cl);
                                    }}
                                    className={`w-full py-1 px-1 rounded border font-mono text-[10px] cursor-pointer transition ${
                                      isPicked
                                        ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                                        : st <= 0
                                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                                        : 'bg-white/60 dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-emerald-400'
                                    }`}
                                  >
                                    {st}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pt-1 flex justify-between text-xs font-mono">
                  <span>
                    Varian Baru: <strong>{replacementSize} • {replacementColor}</strong>
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Rp {(newUnitPrice * qty).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Price Difference Summary */}
          {selectedSale && selectedOldItem && (
            <div
              className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                priceDifference === 0
                  ? isLight
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
                  : priceDifference > 0
                  ? isLight
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-amber-950/25 border-amber-500/40 text-amber-200'
                  : isLight
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-950'
                  : 'bg-cyan-950/25 border-cyan-500/40 text-cyan-200'
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {priceDifference === 0
                    ? 'Tukar Ukuran / Warna Varian Sesuai: Tidak ada selisih harga (Rp 0).'
                    : priceDifference > 0
                    ? `Selisih Kurang Bayar (Termasuk Upcharge Ukuran): Pelanggan menambah Rp ${priceDifference.toLocaleString('id-ID')}.`
                    : `Selisih Lebih Bayar: Pengembalian selisih Rp ${Math.abs(priceDifference).toLocaleString('id-ID')}.`}
                </span>
              </div>

              {priceDifference !== 0 && (
                <div className="flex items-center gap-1.5">
                  {(['CASH', 'QRIS', 'EDC_DEBIT'] as const).map((m) => (
                    <button
                      key={`pay-method-${m}`}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer ${
                        payMethod === m
                          ? 'bg-purple-600 text-white border-purple-400'
                          : isLight
                          ? 'bg-white border-slate-300 text-slate-700'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {m === 'CASH' ? 'Tunai' : m === 'QRIS' ? 'QRIS' : 'Debit/EDC'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-end gap-2.5 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl border text-xs cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!selectedSale || !selectedOldItem || !replacementProduct}
            onClick={handleConfirmExchange}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-sm transition active:scale-[0.99]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {priceDifference > 0
                ? `Proses & Bayar Selisih (+Rp ${priceDifference.toLocaleString('id-ID')})`
                : priceDifference < 0
                ? `Proses Tukar (Refund Rp ${Math.abs(priceDifference).toLocaleString('id-ID')})`
                : 'Proses Tukar (Impas Rp 0)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
