import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { X, Printer, Settings, Copy, Tag, Check, RefreshCw } from 'lucide-react';

interface BarcodeLabelStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  allProducts: Product[];
  onSelectProduct?: (prod: Product) => void;
  language?: 'ID' | 'EN';
  isLight?: boolean;
}

// ============================================================================
// ISO/IEC 15417 Code 128 (Set B) Standard Barcode Generator
// ============================================================================
const CODE128_WIDTHS: number[][] = [
  [2,1,2,2,2,2], [2,2,2,1,2,2], [2,2,2,2,2,1], [1,2,1,2,2,3], [1,2,1,3,2,2], // 0-4
  [1,3,1,2,2,2], [1,2,2,2,1,3], [1,2,2,3,1,2], [1,3,2,2,1,2], [2,2,1,2,1,3], // 5-9
  [2,2,1,3,1,2], [2,3,1,2,1,2], [1,1,2,2,3,2], [1,2,2,1,3,2], [1,2,2,2,3,1], // 10-14
  [1,1,3,2,2,2], [1,2,3,1,2,2], [1,2,3,2,2,1], [2,2,3,2,1,1], [2,2,1,1,3,2], // 15-19
  [2,2,1,2,3,1], [2,1,3,2,1,2], [2,2,3,1,1,2], [3,1,2,1,3,1], [3,1,1,2,2,2], // 20-24
  [3,2,1,1,2,2], [3,2,1,2,2,1], [3,1,2,2,1,2], [3,2,2,1,1,2], [3,2,2,2,1,1], // 25-29
  [2,1,2,1,2,3], [2,1,2,3,2,1], [2,3,2,1,2,1], [1,1,1,3,2,3], [1,3,1,1,2,3], // 30-34
  [1,3,1,3,2,1], [1,1,2,3,1,3], [1,3,2,1,1,3], [1,3,2,3,1,1], [2,1,1,3,1,3], // 35-39
  [2,3,1,1,1,3], [2,3,1,3,1,1], [1,1,2,1,3,3], [1,1,2,3,3,1], [1,3,2,1,3,1], // 40-44
  [1,1,3,1,2,3], [1,1,3,3,2,1], [1,3,3,1,2,1], [3,1,3,1,2,1], [2,1,1,3,3,1], // 45-49
  [2,3,1,1,3,1], [2,1,3,1,1,3], [2,1,3,3,1,1], [2,1,3,1,3,1], [3,1,1,1,2,3], // 50-54
  [3,1,1,3,2,1], [3,3,1,1,2,1], [3,1,2,1,1,3], [3,1,2,3,1,1], [3,3,2,1,1,1], // 55-59
  [3,1,4,1,1,1], [2,2,1,4,1,1], [4,3,1,1,1,1], [1,1,1,2,2,4], [1,1,1,4,2,2], // 60-64
  [1,2,1,1,2,4], [1,2,1,4,2,1], [1,4,1,1,2,2], [1,4,1,2,2,1], [1,1,2,2,1,4], // 65-69
  [1,1,2,4,1,2], [1,2,2,1,1,4], [1,2,2,4,1,1], [1,4,2,1,1,2], [1,4,2,2,1,1], // 70-74
  [2,4,1,2,1,1], [2,2,1,1,1,4], [4,1,3,1,1,1], [2,4,1,1,1,2], [1,3,4,1,1,1], // 75-79
  [1,1,1,2,4,2], [1,2,1,1,4,2], [1,2,1,2,4,1], [1,1,4,2,1,2], [1,2,4,1,1,2], // 80-84
  [1,2,4,2,1,1], [4,1,1,2,1,2], [4,2,1,1,1,2], [4,2,1,2,1,1], [2,1,2,1,4,1], // 85-89
  [2,1,4,1,2,1], [4,1,2,1,2,1], [1,1,1,1,4,3], [1,1,1,3,4,1], [1,3,1,1,4,1], // 90-94
  [1,1,4,1,1,3], [1,1,4,3,1,1], [4,1,1,1,1,3], [4,1,1,3,1,1], [1,1,3,1,4,1], // 95-99
  [1,1,4,1,3,1], [3,1,1,1,4,1], [4,1,1,1,3,1], [2,1,1,4,1,2], [2,1,1,2,1,4], // 100-104
  [2,1,1,2,3,2], // 105
  [2,3,3,1,1,1,2] // 106 (Stop: 7 widths)
];

// Generate SVG bar segments for Code 128 Set B
function encodeCode128B(rawText: string): { bars: { x: number; width: number }[]; totalWidth: number } {
  const text = (rawText || '0000000000').trim();
  const codes: number[] = [104]; // Start B

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Printable ASCII 32 - 126
    if (code >= 32 && code <= 126) {
      codes.push(code - 32);
    } else {
      codes.push(31); // Fallback to '?'
    }
  }

  // Calculate checksum
  let sum = codes[0];
  for (let i = 1; i < codes.length; i++) {
    sum += codes[i] * i;
  }
  const checksum = sum % 103;
  codes.push(checksum);
  codes.push(106); // Stop

  // Build bars (alternating black bar and white space)
  const bars: { x: number; width: number }[] = [];
  let currentX = 10; // 10 module quiet zone

  codes.forEach((symIdx) => {
    const widths = CODE128_WIDTHS[symIdx] || CODE128_WIDTHS[0];
    widths.forEach((w, wIdx) => {
      const isBar = wIdx % 2 === 0;
      if (isBar) {
        bars.push({ x: currentX, width: w });
      }
      currentX += w;
    });
  });

  currentX += 10; // Quiet zone at end
  return { bars, totalWidth: currentX };
}

// React component to render crisp vector barcode SVG
export const Code128Svg: React.FC<{
  code: string;
  height?: number;
  barColor?: string;
  className?: string;
}> = ({ code, height = 48, barColor = '#000000', className = '' }) => {
  const { bars, totalWidth } = useMemo(() => encodeCode128B(code), [code]);

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${height}`}
      className={`w-full ${className}`}
      style={{ height: `${height}px`, maxHeight: `${height}px` }}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
    >
      {bars.map((bar, i) => (
        <rect
          key={`bar-${bar.x}-${i}`}
          x={bar.x}
          y={0}
          width={bar.width}
          height={height}
          fill={barColor}
        />
      ))}
    </svg>
  );
};

// ============================================================================
// Modal Component: Barcode & Label Studio
// ============================================================================
export const BarcodeLabelStudioModal: React.FC<BarcodeLabelStudioModalProps> = ({
  isOpen,
  onClose,
  product,
  allProducts,
  onSelectProduct,
  language = 'ID',
  isLight = false,
}) => {
  const [selectedProdId, setSelectedProdId] = useState<string>(product?.id || '');
  const [copies, setCopies] = useState<number>(1);
  const [paperFormat, setPaperFormat] = useState<'ROLL_40x30' | 'A4_SHEET'>('ROLL_40x30');
  const [showStoreName, setShowStoreName] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [storeName, setStoreName] = useState<string>('JacS Enterprise');

  // Keep active product in sync if prop changes
  const activeProduct = useMemo(() => {
    if (selectedProdId) {
      const found = allProducts.find((p) => p.id === selectedProdId);
      if (found) return found;
    }
    return product || allProducts[0] || null;
  }, [selectedProdId, product, allProducts]);

  if (!isOpen || !activeProduct) return null;

  const barcodeValue = activeProduct.barcode || activeProduct.plu || activeProduct.id;
  const retailPrice = activeProduct.price_retail ?? activeProduct.sell_price;
  const description = activeProduct.description || activeProduct.name;
  const isEn = language === 'EN';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Container - hide during print */}
      <div className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:hidden transition-all ${
        isLight
          ? 'bg-white border border-slate-200 text-slate-900 shadow-slate-300/60'
          : 'bg-[#12161f] border border-[#30363d] text-white'
      }`}>
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#161b22] border-gray-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isLight
                ? 'bg-purple-100 text-purple-700 border-purple-300'
                : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
            }`}>
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <span>{isEn ? 'Barcode & Label Studio' : 'Studio Cetak Barcode & Label Produk'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  isLight
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                }`}>
                  CODE 128
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-gray-400">
                {isEn
                  ? 'High-density barcode label generator for Thermal Roll & A4 sheets'
                  : 'Generator label barcode siap scan untuk printer thermal roll & kertas stiker A4'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left Controls, Right Preview */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Sisi Kiri: Pengaturan & Konfigurasi (5 Kolom) */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. Pilih Produk */}
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              isLight ? 'border-slate-200 bg-slate-50' : 'border-gray-800 bg-[#0d1117]'
            }`}>
              <label className="block text-slate-900 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5">
                <Tag className={`w-3.5 h-3.5 ${isLight ? 'text-teal-700' : 'text-cyan-400'}`} />
                {isEn ? 'Select Product to Print:' : 'Pilih Produk untuk Dicetak:'}
              </label>
              <select
                value={activeProduct.id}
                onChange={(e) => {
                  setSelectedProdId(e.target.value);
                  const p = allProducts.find((x) => x.id === e.target.value);
                  if (p && onSelectProduct) onSelectProduct(p);
                }}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                    : 'bg-black/40 border-gray-700 text-white focus:border-cyan-500'
                }`}
              >
                {allProducts.map((p, pIdx) => (
                  <option key={`lbl-prod-${p.id || p.barcode || 'prod'}-${pIdx}`} value={p.id}>
                    {p.name || 'Produk'} [{p.barcode || p.plu || p.id}]
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Pengaturan Kertas & Format */}
            <div className={`p-3.5 rounded-xl border space-y-3 ${
              isLight ? 'border-slate-200 bg-slate-50' : 'border-gray-800 bg-[#0d1117]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-slate-900 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5">
                  <Settings className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                  {isEn ? 'Paper & Layout Format:' : 'Format Kertas & Tata Letak:'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaperFormat('ROLL_40x30')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                    paperFormat === 'ROLL_40x30'
                      ? isLight
                        ? 'bg-purple-100 border-purple-500 text-purple-950 font-bold shadow-xs'
                        : 'bg-purple-500/20 border-purple-500 text-white font-bold shadow-xs'
                      : isLight
                      ? 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      : 'bg-black/30 border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className={`text-[11px] font-bold ${isLight ? 'text-purple-800' : 'text-purple-300'}`}>Thermal Roll</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>40 x 30 mm (Label)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaperFormat('A4_SHEET')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                    paperFormat === 'A4_SHEET'
                      ? isLight
                        ? 'bg-purple-100 border-purple-500 text-purple-950 font-bold shadow-xs'
                        : 'bg-purple-500/20 border-purple-500 text-white font-bold shadow-xs'
                      : isLight
                      ? 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      : 'bg-black/30 border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className={`text-[11px] font-bold ${isLight ? 'text-purple-800' : 'text-purple-300'}`}>Lembaran A4</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Grid Stiker (24 Label)</div>
                </button>
              </div>

              {/* Jumlah Salinan */}
              <div className="pt-1">
                <label className="block text-slate-900 dark:text-slate-100 text-[11px] font-semibold mb-1">
                  {isEn ? 'Number of Copies (Pcs):' : 'Jumlah Salinan Cetak (Pcs):'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className={`w-24 p-2 rounded-lg border text-xs font-mono font-bold text-center transition ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-black/40 border-gray-700 text-white'
                    }`}
                  />
                  <div className="flex gap-1.5">
                    {[1, 5, 10, 24].map((cnt) => (
                      <button
                        key={`btn-copy-${cnt}`}
                        type="button"
                        onClick={() => setCopies(cnt)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition ${
                          isLight
                            ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                            : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        +{cnt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Kustomisasi Header Label */}
            <div className={`p-3.5 rounded-xl border space-y-2.5 text-xs ${
              isLight ? 'border-slate-200 bg-slate-50' : 'border-gray-800 bg-[#0d1117]'
            }`}>
              <span className="text-slate-900 dark:text-slate-100 font-bold text-xs block">
                {isEn ? 'Label Details Customization:' : 'Kustomisasi Tampilan Label:'}
              </span>

              <div>
                <label className="block text-slate-900 dark:text-slate-100 text-[11px] mb-1 font-semibold">
                  {isEn ? 'Store / Brand Header:' : 'Nama Toko / Kop Label:'}
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Contoh: JacS Enterprise"
                  className={`w-full p-2 rounded-lg border text-xs transition ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-black/40 border-gray-700 text-white placeholder-slate-500'
                  }`}
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 text-slate-900 dark:text-slate-100 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={showStoreName}
                    onChange={(e) => setShowStoreName(e.target.checked)}
                    className="rounded text-purple-500 focus:ring-0"
                  />
                  <span>{isEn ? 'Show Store Name' : 'Tampilkan Nama Toko di Atas'}</span>
                </label>
                <label className="flex items-center gap-2 text-slate-900 dark:text-slate-100 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded text-purple-500 focus:ring-0"
                  />
                  <span>{isEn ? 'Show Retail Price (HET)' : 'Tampilkan Harga Ecer (HET)'}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Live Preview Visual Label (7 Kolom) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Copy className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                {isEn ? 'Live Label Print Preview' : 'Pratinjau Hasil Cetak Label'}
              </span>
              <span className="text-[10px] text-slate-600 dark:text-gray-400 font-mono">
                {paperFormat === 'ROLL_40x30' ? 'Thermal 40x30mm' : 'A4 Sticker Grid'} • {copies} Pcs
              </span>
            </div>

            {/* Preview Box Container */}
            <div className={`flex-1 min-h-[300px] border rounded-2xl p-5 flex flex-col items-center justify-center overflow-auto ${
              isLight ? 'bg-slate-100/80 border-slate-300' : 'bg-slate-900/60 border-gray-800'
            }`}>
              {/* Actual Physical Label Simulation (40x30mm scaled up for clear viewing) */}
              <div
                className="bg-white text-black p-3 rounded-lg shadow-xl border border-gray-300 flex flex-col justify-between"
                style={{
                  width: '280px',
                  minHeight: '190px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {/* 1. Header: Store Name */}
                {showStoreName && (
                  <div className="text-center border-b border-gray-300 pb-1 mb-1">
                    <div className="font-extrabold text-[12px] uppercase tracking-wider text-black">
                      {storeName || 'JacS Enterprise'}
                    </div>
                  </div>
                )}

                {/* 2. Description Produk */}
                <div className="text-center my-0.5">
                  <div className="font-bold text-[11px] leading-tight text-black line-clamp-2" title={description}>
                    {description}
                  </div>
                  <div className="text-[9px] text-gray-600 mt-0.5 font-semibold">
                    {activeProduct.brand} • {activeProduct.unit || 'PCS'}
                  </div>
                </div>

                {/* 3. Barcode Vector SVG + ID Text */}
                <div className="my-1 flex flex-col items-center">
                  <div className="w-full px-2">
                    <Code128Svg code={barcodeValue} height={44} barColor="#000000" />
                  </div>
                  <div className="font-mono font-bold text-[11px] tracking-widest text-black mt-0.5">
                    {barcodeValue}
                  </div>
                </div>

                {/* 4. Footer: Retail Price */}
                {showPrice && (
                  <div className="border-t border-dashed border-gray-400 pt-1 mt-1 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-gray-600 uppercase">HET / ECER:</span>
                    <span className="text-[13px] font-black font-mono text-black">
                      Rp {retailPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-600 dark:text-gray-400 mt-4 text-center max-w-sm">
                💡 Garis barcode dihasilkan dengan format <b>Code 128</b> presisi tinggi, mendukung pemindaian instan oleh laser barcode scanner, camera phone, dan scanner POS.
              </div>
            </div>

            {/* Action Bar Bottom */}
            <div className={`mt-4 pt-3 border-t flex items-center justify-end gap-2.5 ${
              isLight ? 'border-slate-200' : 'border-gray-800'
            }`}>
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                  isLight
                    ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
                    : 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {isEn ? 'Close' : 'Tutup'}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-[0_0_18px_rgba(168,85,247,0.45)] cursor-pointer transition"
              >
                <Printer className="w-4 h-4" />
                <span>{isEn ? `Print Label / PDF (${copies} pcs)` : `Cetak Label / PDF (${copies} pcs)`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PURE PRINT MEDIA STYLING & CLEAN PRINT SHEETS                        */}
      {/* ===================================================================== */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #barcode-print-container, #barcode-print-container * {
            visibility: visible !important;
          }
          #barcode-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: ${paperFormat === 'ROLL_40x30' ? '40mm 30mm' : 'A4 portrait'};
            margin: ${paperFormat === 'ROLL_40x30' ? '0mm' : '8mm'};
          }
          .label-item-thermal {
            page-break-after: always;
            break-after: page;
            width: 38mm;
            height: 28mm;
            margin: 1mm auto;
            box-sizing: border-box;
          }
          .label-grid-a4 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4mm;
            width: 100%;
          }
          .label-item-a4 {
            width: 100%;
            height: 32mm;
            box-sizing: border-box;
            border: 1px dashed #ccc;
          }
        }
      `}</style>

      {/* Invisible on screen, visible ONLY when printing via @media print */}
      <div id="barcode-print-container" className="hidden print:block">
        {paperFormat === 'ROLL_40x30' ? (
          <div>
            {Array.from({ length: copies }).map((_, idx) => (
              <div
                key={`thermal-print-${barcodeValue}-${idx}`}
                className="label-item-thermal flex flex-col justify-between p-1 bg-white text-black"
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                {showStoreName && (
                  <div className="text-center font-bold text-[8px] uppercase tracking-wide border-b border-black pb-0.5">
                    {storeName}
                  </div>
                )}
                <div className="text-center my-0.5">
                  <div className="font-bold text-[8px] leading-tight line-clamp-2">
                    {description}
                  </div>
                  <div className="text-[6.5px] text-gray-700">
                    {activeProduct.brand || ''} • {activeProduct.unit || 'PCS'}
                  </div>
                </div>
                <div className="flex flex-col items-center my-0.5">
                  <div className="w-full px-1">
                    <Code128Svg code={barcodeValue} height={28} barColor="#000000" />
                  </div>
                  <div className="font-mono font-bold text-[7.5px] tracking-wider">
                    {barcodeValue}
                  </div>
                </div>
                {showPrice && (
                  <div className="border-t border-black pt-0.5 flex items-center justify-between text-[7.5px] font-bold">
                    <span>HET:</span>
                    <span>Rp {retailPrice.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="label-grid-a4">
            {Array.from({ length: copies }).map((_, idx) => (
              <div
                key={`a4-print-${barcodeValue}-${idx}`}
                className="label-item-a4 flex flex-col justify-between p-1.5 bg-white text-black"
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                {showStoreName && (
                  <div className="text-center font-bold text-[8px] uppercase tracking-wide border-b border-black pb-0.5">
                    {storeName}
                  </div>
                )}
                <div className="text-center my-0.5">
                  <div className="font-bold text-[8.5px] leading-tight line-clamp-2">
                    {description}
                  </div>
                  <div className="text-[7px] text-gray-700">
                    {activeProduct.brand || ''} • {activeProduct.unit || 'PCS'}
                  </div>
                </div>
                <div className="flex flex-col items-center my-0.5">
                  <div className="w-full px-2">
                    <Code128Svg code={barcodeValue} height={32} barColor="#000000" />
                  </div>
                  <div className="font-mono font-bold text-[8px] tracking-wider">
                    {barcodeValue}
                  </div>
                </div>
                {showPrice && (
                  <div className="border-t border-black pt-0.5 flex items-center justify-between text-[8.5px] font-bold">
                    <span>HET / ECER:</span>
                    <span>Rp {retailPrice.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
