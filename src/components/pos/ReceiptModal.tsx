import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Printer,
  X,
  CheckCircle2,
  Copy,
  Smartphone,
  PauseCircle,
  Send,
  Terminal,
  FileCode,
  QrCode,
  Check,
  CreditCard,
  Banknote,
  Sparkles,
  Download
} from 'lucide-react';
import { hasValidProfileValue } from '../../utils/businessProfileUtils';

// Helper to generate a clean Code128-like SVG barcode
const TransactionBarcodeSvg: React.FC<{ value: string; widthMm?: '58mm' | '80mm' }> = ({ value, widthMm }) => {
  // Generate deterministic pseudo-bar widths from string chars
  const bars: { width: number; isSpace: boolean }[] = [];
  
  // Guard start bar
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 1, isSpace: true });
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 2, isSpace: true });

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const b1 = (code % 3) + 1;
    const s1 = ((code >> 1) % 2) + 1;
    const b2 = ((code >> 2) % 3) + 1;
    const s2 = ((code >> 3) % 2) + 1;
    bars.push({ width: b1, isSpace: false });
    bars.push({ width: s1, isSpace: true });
    bars.push({ width: b2, isSpace: false });
    bars.push({ width: s2, isSpace: true });
  }

  // Guard stop bar
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 1, isSpace: true });
  bars.push({ width: 3, isSpace: false });

  let currentX = 4;
  const rects: { x: number; width: number }[] = [];
  bars.forEach((b) => {
    if (!b.isSpace) {
      rects.push({ x: currentX, width: b.width * 1.5 });
    }
    currentX += b.width * 1.5;
  });

  const totalWidth = currentX + 4;
  const isCompact = widthMm === '58mm';

  return (
    <div className="flex flex-col items-center justify-center my-1 select-none">
      <svg
        viewBox={`0 0 ${totalWidth} 42`}
        className={isCompact ? 'w-44 h-9 max-w-full' : 'w-56 h-11 max-w-full'}
        style={{ shapeRendering: 'crispEdges' }}
      >
        <rect width="100%" height="100%" fill="#ffffff" />
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={2} width={r.width} height={32} fill="#000000" />
        ))}
      </svg>
      <span className="font-mono text-[9px] tracking-[0.2em] text-gray-700 font-bold mt-0.5">
        *{value}*
      </span>
    </div>
  );
};

export const ReceiptModal: React.FC = () => {
  const { isReceiptModalOpen, closeReceipt, currentReceiptSale, showToast, businessProfile, activeUser } = useApp();
  const [waNumber, setWaNumber] = useState<string>('');
  const [receiptWidth, setReceiptWidth] = useState<'58mm' | '80mm'>('80mm');
  const [showEscPosModal, setShowEscPosModal] = useState<boolean>(false);
  const [copiedEscPos, setCopiedEscPos] = useState<boolean>(false);

  useEffect(() => {
    if (currentReceiptSale) {
      setWaNumber(currentReceiptSale.customer_phone || '');
    }
  }, [currentReceiptSale]);

  if (!isReceiptModalOpen || !currentReceiptSale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleHoldFromReceipt = () => {
    window.dispatchEvent(
      new CustomEvent('pos-hold-from-receipt', {
        detail: { sale: currentReceiptSale },
      })
    );
    closeReceipt();
    showToast('Transaksi ditunda (Hold). Belanjaan dibuka kembali untuk penambahan barang.');
  };

  // Hitung Nilai PPN (jika ada selisih atau PPN 11%)
  const subtotalAfterDisc = currentReceiptSale.subtotal - (currentReceiptSale.discount || 0);
  const calculatedTax = Math.max(0, currentReceiptSale.total_amount - subtotalAfterDisc);
  const hasTax = calculatedTax > 0;

  // Nama kasir definitif
  const cashierDisplayName =
    currentReceiptSale.cashier_name ||
    activeUser?.name ||
    currentReceiptSale.cashier_id ||
    'Kasir Utama';

  // Format metode pembayaran lengkap
  const formatPaymentMethodDetails = (method: string) => {
    const m = (method || '').toUpperCase();
    if (m.includes('CASH') || m.includes('TUNAI')) {
      return { label: 'Tunai (Cash)', icon: Banknote, color: 'text-emerald-700' };
    }
    if (m.includes('QRIS')) {
      return { label: 'QRIS Dinamis / Statis', icon: QrCode, color: 'text-purple-700' };
    }
    if (m.includes('DEBIT') || m.includes('KREDIT') || m.includes('EDC') || m.includes('BANK') || m.includes('TRANSFER')) {
      return { label: 'Bank / Kartu Debit & EDC', icon: CreditCard, color: 'text-blue-700' };
    }
    return { label: currentReceiptSale.payment_method || 'Tunai', icon: Banknote, color: 'text-gray-800' };
  };

  const payInfo = formatPaymentMethodDetails(currentReceiptSale.payment_method);

  // Generate plain text ESC/POS raw commands string
  const generateEscPosRawCommands = () => {
    const lineWidth = receiptWidth === '58mm' ? 32 : 48;
    const divider = '-'.repeat(lineWidth);
    const doubleDivider = '='.repeat(lineWidth);

    const padBetween = (left: string, right: string) => {
      const spaceNeeded = lineWidth - left.length - right.length;
      if (spaceNeeded <= 0) return `${left} ${right}`;
      return `${left}${' '.repeat(spaceNeeded)}${right}`;
    };

    const centerText = (text: string) => {
      if (text.length >= lineWidth) return text;
      const leftPad = Math.floor((lineWidth - text.length) / 2);
      return ' '.repeat(leftPad) + text;
    };

    const storeName = businessProfile?.name || 'JacS RetailOS ERP';
    const storeAddress = businessProfile?.address || 'Jakarta, Indonesia';
    const storePhone = businessProfile?.phone ? `Telp: ${businessProfile.phone}` : '';
    const trxId = currentReceiptSale.receipt_number || currentReceiptSale.transaction_id;
    const timeStr = currentReceiptSale.created_at || currentReceiptSale.date;

    const itemsStr =
      currentReceiptSale.items && currentReceiptSale.items.length > 0
        ? currentReceiptSale.items
            .map((it) => {
              const name = it.product.name.slice(0, lineWidth);
              const qtyPrice = `${it.quantity} x Rp ${it.product.sell_price.toLocaleString('id-ID')}`;
              const sub = `Rp ${it.subtotal.toLocaleString('id-ID')}`;
              return `${name}\n${padBetween(qtyPrice, sub)}`;
            })
            .join('\n')
        : padBetween(currentReceiptSale.items_summary.slice(0, 20), `Rp ${currentReceiptSale.total_amount.toLocaleString('id-ID')}`);

    return `\x1B\x40` + // ESC @ (Initialize printer)
`\x1B\x61\x01` + // Center align
`${centerText(storeName.toUpperCase())}\n` +
`${centerText(storeAddress)}\n` +
(storePhone ? `${centerText(storePhone)}\n` : '') +
`${doubleDivider}\n` +
`\x1B\x61\x00` + // Left align
`${padBetween('No. Struk:', trxId)}\n` +
`${padBetween('Waktu:', timeStr)}\n` +
`${padBetween('Terminal:', currentReceiptSale.terminal_name)}\n` +
`${padBetween('Kasir:', cashierDisplayName)}\n` +
`${padBetween('Tier:', currentReceiptSale.price_tier || 'Ecer / Regular')}\n` +
(currentReceiptSale.customer_name ? `${padBetween('Pelanggan:', currentReceiptSale.customer_name)}\n` : '') +
`${divider}\n` +
`${itemsStr}\n` +
`${divider}\n` +
`${padBetween('Subtotal:', `Rp ${currentReceiptSale.subtotal.toLocaleString('id-ID')}`)}\n` +
(currentReceiptSale.discount > 0 ? `${padBetween('Diskon:', `-Rp ${currentReceiptSale.discount.toLocaleString('id-ID')}`)}\n` : '') +
(hasTax ? `${padBetween('PPN (11%):', `Rp ${calculatedTax.toLocaleString('id-ID')}`)}\n` : '') +
`\x1B\x45\x01` + // Bold on
`${padBetween('TOTAL:', `Rp ${currentReceiptSale.total_amount.toLocaleString('id-ID')}`)}\n` +
`\x1B\x45\x00` + // Bold off
`${padBetween('Metode Bayar:', payInfo.label)}\n` +
(currentReceiptSale.amount_paid ? `${padBetween('Dibayar:', `Rp ${currentReceiptSale.amount_paid.toLocaleString('id-ID')}`)}\n` : '') +
(currentReceiptSale.change_amount !== undefined ? `${padBetween('Kembalian:', `Rp ${(currentReceiptSale.change_amount || 0).toLocaleString('id-ID')}`)}\n` : '') +
`${doubleDivider}\n` +
`\x1B\x61\x01` + // Center align
`\x1D\x68\x40` + // Barcode height (64 dots)
`\x1D\x77\x02` + // Barcode module width
`\x1D\x6B\x49` + `${String.fromCharCode(trxId.length)}${trxId}\n` + // GS k (Code128 barcode)
`* ${trxId} *\n` +
`Terima Kasih Atas Kunjungan Anda\n` +
`Petugas Kasir: ${cashierDisplayName}\n` +
(businessProfile?.footerNote ? `${businessProfile.footerNote}\n` : '') +
`\n\n\n` + // Feed 3 lines
`\x1D\x56\x41\x10`; // GS V A 16 (Full paper cut & feed)
  };

  const handleCopyEscPos = () => {
    const raw = generateEscPosRawCommands();
    navigator.clipboard.writeText(raw);
    setCopiedEscPos(true);
    showToast('Payload Raw ESC/POS berhasil disalin! Siap dikirim ke RawBT / USB Thermal Driver.');
    setTimeout(() => setCopiedEscPos(false), 2500);
  };

  const handleSimulatePrintDriver = () => {
    setShowEscPosModal(true);
  };

  const handleCopyText = () => {
    const headerSub = hasValidProfileValue(businessProfile?.headerNote)
      ? `${businessProfile!.headerNote}\n`
      : '';
    const footerMsg = hasValidProfileValue(businessProfile?.footerNote)
      ? `\n=================================\n${businessProfile!.footerNote}`
      : '\n=================================';

    const text = `
=================================
       ${businessProfile?.name || 'JacS RetailOS ERP'}
${headerSub}=================================
No. Struk : ${currentReceiptSale.receipt_number || currentReceiptSale.transaction_id}
Tanggal   : ${currentReceiptSale.created_at || currentReceiptSale.date}
Terminal  : ${currentReceiptSale.terminal_name}
Kasir     : ${cashierDisplayName}
Tier      : ${currentReceiptSale.price_tier || 'Ecer / Regular'}
${currentReceiptSale.customer_name ? `Pelanggan : ${currentReceiptSale.customer_name} (${currentReceiptSale.customer_phone || waNumber || '-'})\n` : ''}---------------------------------
Ringkasan : ${currentReceiptSale.items_summary}
Subtotal  : Rp ${currentReceiptSale.subtotal.toLocaleString('id-ID')}
${currentReceiptSale.discount > 0 ? `Diskon    : -Rp ${currentReceiptSale.discount.toLocaleString('id-ID')}\n` : ''}${hasTax ? `PPN (11%) : Rp ${calculatedTax.toLocaleString('id-ID')}\n` : ''}TOTAL     : Rp ${currentReceiptSale.total_amount.toLocaleString('id-ID')}
Metode    : ${payInfo.label}
${currentReceiptSale.amount_paid ? `Dibayar   : Rp ${currentReceiptSale.amount_paid.toLocaleString('id-ID')}\n` : ''}${currentReceiptSale.change_amount ? `Kembalian : Rp ${currentReceiptSale.change_amount.toLocaleString('id-ID')}\n` : ''}${footerMsg}
Kasir Bertugas: ${cashierDisplayName}
    `;
    navigator.clipboard.writeText(text.trim());
    showToast('Struk teks berhasil disalin ke clipboard!');
  };

  const handleSendWhatsApp = () => {
    const phone = (waNumber.trim() || currentReceiptSale.customer_phone || '').trim();
    if (!phone) {
      showToast('Silakan masukkan nomor WhatsApp pelanggan terlebih dahulu!');
      const inputEl = document.getElementById('input-customer-wa-receipt') as HTMLInputElement | null;
      if (inputEl) inputEl.focus();
      return;
    }

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('8')) {
      cleanPhone = '62' + cleanPhone;
    }

    if (cleanPhone.length < 9) {
      showToast('Nomor WhatsApp tidak valid! Pastikan format 08xx atau 628xx.');
      const inputEl = document.getElementById('input-customer-wa-receipt') as HTMLInputElement | null;
      if (inputEl) inputEl.focus();
      return;
    }

    const itemsList =
      currentReceiptSale.items && currentReceiptSale.items.length > 0
        ? currentReceiptSale.items
            .map((it) => {
              const cleanDesc =
                it.product.description && !it.product.description.toLowerCase().includes('unknown')
                  ? it.product.description
                  : it.product.name;
              const unitPrice = it.product.sell_price ? ` @ Rp ${it.product.sell_price.toLocaleString('id-ID')}` : '';
              return `• ${cleanDesc} (${it.quantity}x${unitPrice}) = Rp ${it.subtotal.toLocaleString('id-ID')}`;
            })
            .join('\n')
        : currentReceiptSale.items_summary;

    const message =
      `*STRUK RESMI ${(businessProfile?.name || 'JacS RetailOS ERP').toUpperCase()}*\n` +
      `=================================\n` +
      `No. Struk : ${currentReceiptSale.receipt_number || currentReceiptSale.transaction_id}\n` +
      `Waktu     : ${currentReceiptSale.created_at || currentReceiptSale.date}\n` +
      `Terminal  : ${currentReceiptSale.terminal_name}\n` +
      `Kasir     : ${cashierDisplayName}\n` +
      `Tier      : ${currentReceiptSale.price_tier || 'Ecer / Regular'}\n` +
      (currentReceiptSale.customer_name ? `Pelanggan : ${currentReceiptSale.customer_name} (${cleanPhone})\n` : '') +
      (currentReceiptSale.points_earned !== undefined && currentReceiptSale.points_earned > 0
        ? `Reward Pts: +${currentReceiptSale.points_earned} Pts (Tersimpan ke Akun Member)\n`
        : '') +
      `=================================\n` +
      `RINCIAN PESANAN:\n` +
      `${itemsList}\n` +
      `=================================\n` +
      `Subtotal  : Rp ${currentReceiptSale.subtotal.toLocaleString('id-ID')}\n` +
      (currentReceiptSale.discount > 0
        ? `Diskon    : -Rp ${currentReceiptSale.discount.toLocaleString('id-ID')}\n`
        : '') +
      (hasTax
        ? `PPN (11%) : Rp ${calculatedTax.toLocaleString('id-ID')}\n`
        : '') +
      `*GRAND TOTAL : Rp ${currentReceiptSale.total_amount.toLocaleString('id-ID')}*\n` +
      `Metode    : ${payInfo.label}\n` +
      (currentReceiptSale.amount_paid
        ? `Dibayar   : Rp ${currentReceiptSale.amount_paid.toLocaleString('id-ID')}\n`
        : '') +
      (currentReceiptSale.change_amount
        ? `Kembalian : Rp ${currentReceiptSale.change_amount.toLocaleString('id-ID')}\n`
        : '') +
      `=================================\n` +
      `Kasir: ${cashierDisplayName}\n` +
      (hasValidProfileValue(businessProfile?.footerNote) ? `${businessProfile!.footerNote}\n` : '') +
      `${businessProfile?.name || 'JacS RetailOS ERP'}${hasValidProfileValue(businessProfile?.headerNote) ? ` • ${businessProfile!.headerNote}` : ''}`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Membuka WhatsApp untuk mengirim struk ke ${cleanPhone}...`);
  };

  const trxIdentifier = currentReceiptSale.receipt_number || currentReceiptSale.transaction_id;

  return (
    <>
      <div
        id="modal-receipt"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto"
      >
        <div className="w-full max-w-4xl bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-5 shadow-[0_25px_70px_rgba(0,0,0,0.95)] relative animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
          {/* Top Header Banner */}
          <div className="flex items-center justify-between pb-3 border-b border-[#30363d] mb-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="text-sm font-black tracking-wide">TRANSAKSI BERHASIL DICATAT</span>
              <span className="hidden sm:inline text-xs text-gray-400 font-mono">
                • #{trxIdentifier}
              </span>
            </div>
            <button
              onClick={closeReceipt}
              className="text-gray-400 hover:text-white bg-slate-800/80 hover:bg-rose-600 p-1.5 rounded-lg border border-slate-700 hover:border-rose-500 transition cursor-pointer shadow-sm group"
              title="Tutup Struk [Esc]"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Selector Ukuran Lebar Thermal ESC/POS (58mm vs 80mm) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d1117] border border-[#30363d] px-3.5 py-2.5 rounded-xl mb-4">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-xs font-bold text-gray-200">Format Printer Thermal:</span>
              <span className="text-[11px] text-gray-400">Pilih lebar kertas struk kasir</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#161b22] p-1 rounded-lg border border-[#30363d]">
              <button
                type="button"
                onClick={() => setReceiptWidth('58mm')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  receiptWidth === '58mm'
                    ? 'bg-[#0052FF] text-white shadow-xs'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Lebar 58mm (Printer Kasir Mini / Bluetooth Portabel)"
              >
                <span>58mm</span>
                <span className="text-[10px] opacity-75 font-normal">(Ringkas)</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptWidth('80mm')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  receiptWidth === '80mm'
                    ? 'bg-[#0052FF] text-white shadow-xs'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Lebar 80mm (Printer Kasir Ritel Standar / USB LAN Kasir)"
              >
                <span>80mm</span>
                <span className="text-[10px] opacity-75 font-normal">(Standar Ritel)</span>
              </button>
            </div>
          </div>

          {/* 2 Kolom Berdampingan (Side-by-Side Layout) */}
          <div className="flex flex-col md:flex-row gap-5 items-start w-full">
            {/* KOLOM KIRI: Struk Kertas Putih dengan Wadah Lebar Dinamis */}
            <div className="w-full md:w-3/5 flex-1 min-w-0 flex flex-col items-center">
              <div
                id="printable-receipt"
                className={`bg-white text-gray-900 rounded-xl font-mono shadow-inner border border-gray-300 space-y-2.5 transition-all duration-200 ${
                  receiptWidth === '58mm'
                    ? 'receipt-58mm w-[290px] p-3 text-[10px]'
                    : 'receipt-80mm w-full max-w-[390px] p-4 sm:p-5 text-xs'
                }`}
              >
                {/* Header Toko / Brand */}
                <div className="text-center border-b border-dashed border-gray-400 pb-2">
                  {businessProfile?.logoUrl && (
                    <img
                      src={businessProfile.logoUrl}
                      alt="Logo"
                      className="w-10 h-10 object-contain mx-auto mb-1 rounded-sm"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                  <h2 className={`font-black tracking-wider text-black ${receiptWidth === '58mm' ? 'text-sm' : 'text-base'}`}>
                    {businessProfile?.name || 'JacS RetailOS ERP'}
                  </h2>
                  {hasValidProfileValue(businessProfile?.headerNote) && (
                    <p className="text-[10px] text-gray-600 leading-tight">
                      {businessProfile!.headerNote}
                    </p>
                  )}
                  {(hasValidProfileValue(businessProfile?.address) ||
                    hasValidProfileValue(businessProfile?.phone)) && (
                    <p className="text-[10px] text-gray-600 leading-tight">
                      {[
                        hasValidProfileValue(businessProfile?.address) ? businessProfile!.address : null,
                        hasValidProfileValue(businessProfile?.phone) ? `Telp: ${businessProfile!.phone}` : null,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  )}
                </div>

                {/* Meta Informasi Transaksi */}
                <div className="space-y-1 border-b border-dashed border-gray-400 pb-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-600">No. Trx:</span>
                    <span className="font-bold text-black">{trxIdentifier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Waktu:</span>
                    <span>{currentReceiptSale.created_at || currentReceiptSale.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terminal:</span>
                    <span className="font-semibold">{currentReceiptSale.terminal_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kasir:</span>
                    <span className="font-semibold text-black">{cashierDisplayName}</span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-gray-600">Tier Harga:</span>
                    <div className="flex items-center gap-1">
                      {currentReceiptSale.isOffline && (
                        <span className="font-bold px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 border border-amber-300">
                          OFFLINE QUEUED
                        </span>
                      )}
                      <span className="font-bold px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-[#0052FF] border border-blue-200">
                        {currentReceiptSale.price_tier || 'Ecer / Regular'}
                      </span>
                    </div>
                  </div>
                  {currentReceiptSale.customer_name && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-600">Pelanggan:</span>
                      <span className="font-bold text-black truncate max-w-[180px]">
                        {currentReceiptSale.customer_name}{' '}
                        {currentReceiptSale.customer_phone ? `(${currentReceiptSale.customer_phone})` : ''}
                      </span>
                    </div>
                  )}
                  {currentReceiptSale.points_earned !== undefined && currentReceiptSale.points_earned > 0 && (
                    <div className="flex justify-between items-center text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-amber-900 font-semibold">
                      <span>Reward Poin Belanja:</span>
                      <span className="font-bold font-mono text-amber-800">
                        +{currentReceiptSale.points_earned} Pts
                      </span>
                    </div>
                  )}
                </div>

                {/* Rincian Item Belanja */}
                <div className="space-y-1.5 border-b border-dashed border-gray-400 pb-2.5 max-h-52 overflow-y-auto pr-1">
                  {currentReceiptSale.items && currentReceiptSale.items.length > 0 ? (
                    currentReceiptSale.items.map((item, idx) => {
                      const cleanDesc =
                        item.product.description && !item.product.description.toLowerCase().includes('unknown')
                          ? item.product.description
                          : item.product.name;
                      return (
                        <div key={idx} className="space-y-0.5">
                          <div className="font-semibold text-black leading-tight text-xs break-words">
                            {cleanDesc}
                          </div>
                          <div className="flex justify-between text-[11px] text-gray-600">
                            <span>
                              {item.quantity} x Rp {item.product.sell_price.toLocaleString('id-ID')}
                            </span>
                            <span className="font-mono font-medium text-black">
                              Rp {item.subtotal.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-[11px] text-gray-700">{currentReceiptSale.items_summary}</div>
                  )}
                </div>

                {/* Rincian Perhitungan Total, PPN, dan Metode Bayar */}
                <div className="space-y-1 text-[11px] border-b border-dashed border-gray-400 pb-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>Rp {currentReceiptSale.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {currentReceiptSale.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Diskon Promo</span>
                      <span>-Rp {currentReceiptSale.discount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {/* Rincian PPN 11% */}
                  {hasTax && (
                    <div className="flex justify-between text-blue-700 font-medium">
                      <span>PPN (11%)</span>
                      <span>Rp {calculatedTax.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm text-black pt-1 border-t border-gray-300">
                    <span>GRAND TOTAL</span>
                    <span>Rp {currentReceiptSale.total_amount.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Rincian Metode Bayar (Tunai, QRIS, Bank/EDC) */}
                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-gray-600">Metode Bayar:</span>
                    <span className={`font-bold flex items-center gap-1 ${payInfo.color}`}>
                      <payInfo.icon className="w-3.5 h-3.5 inline shrink-0" />
                      {payInfo.label}
                    </span>
                  </div>

                  {currentReceiptSale.amount_paid && currentReceiptSale.amount_paid > 0 && (
                    <>
                      <div className="flex justify-between text-[11px] text-gray-600">
                        <span>Jumlah Dibayar</span>
                        <span className="font-semibold text-black">
                          Rp {currentReceiptSale.amount_paid.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-emerald-700 font-black">
                        <span>Kembalian</span>
                        <span>Rp {(currentReceiptSale.change_amount || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Barcode Transaksi Resmi */}
                <div className="pt-1 pb-1 flex flex-col items-center border-b border-dashed border-gray-300">
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">
                    Barcode Validasi Transaksi
                  </span>
                  <TransactionBarcodeSvg value={trxIdentifier} widthMm={receiptWidth} />
                </div>

                {/* Catatan Kaki & Footer Petugas Kasir */}
                <div className="text-center pt-1 text-[10px] text-gray-600 space-y-1">
                  <p className="font-bold text-black leading-tight">
                    Barang yang sudah dibeli tidak dapat ditukar/dikembalikan
                  </p>
                  {hasValidProfileValue(businessProfile?.footerNote) && (
                    <p className="leading-tight text-gray-700">{businessProfile!.footerNote}</p>
                  )}
                  {/* Footer Nama Kasir */}
                  <div className="pt-1 border-t border-dotted border-gray-300 text-gray-700">
                    <span className="text-[9px] text-gray-500 uppercase">Petugas Kasir:</span>{' '}
                    <span className="font-bold text-black">{cashierDisplayName}</span>
                  </div>
                  <p className="text-[9px] text-gray-400">
                    Simpan struk ini sebagai bukti pembayaran yang sah
                  </p>
                </div>
              </div>

              <div className="mt-2 text-center text-[11px] text-gray-400">
                Mode aktif: <span className="text-blue-400 font-bold">{receiptWidth} Thermal Paper</span> • Sesuai standar printer ESC/POS
              </div>
            </div>

            {/* KOLOM KANAN: Panel Aksi & Driver ESC/POS */}
            <div className="w-full md:w-2/5 flex flex-col gap-3 justify-start shrink-0">
              {/* Bilah Direct WhatsApp Receipt */}
              <div className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Direct WhatsApp Receipt</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">wa.me resmi</span>
                </div>

                <div className="space-y-2">
                  <label htmlFor="input-customer-wa-receipt" className="block text-[11px] font-medium text-gray-300">
                    Nomor HP Pelanggan (08xx / 628xx):
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="input-customer-wa-receipt"
                      placeholder="Contoh: 081234567890..."
                      value={waNumber}
                      onChange={(e) => setWaNumber(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendWhatsApp();
                        }
                      }}
                      className="w-full text-xs bg-[#161b22] border border-[#30363d] text-white rounded-lg px-3 py-2 outline-none focus:border-emerald-500 font-mono tracking-wide placeholder:text-gray-500"
                    />
                    {waNumber && (
                      <button
                        type="button"
                        onClick={() => setWaNumber('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 text-xs cursor-pointer"
                        title="Hapus nomor"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    id="btn-send-wa"
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="w-full flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold py-2.5 px-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.25)] transition cursor-pointer text-xs active:scale-95"
                    title="Kirim rincian nota transaksi via WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span>Kirim Struk ke WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Tumpukan Tombol Aksi Kasir Termasuk ESC/POS Raw Driver */}
              <div className="w-full flex flex-col gap-2.5 pt-1">
                {/* Tombol Utama 1: Cetak Struk Browser */}
                <button
                  id="btn-print-receipt"
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#0052FF] hover:bg-[#0043d1] text-white font-black py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(0,82,255,0.4)] transition cursor-pointer text-sm active:scale-95 border-2 border-blue-400/40"
                  title="Cetak Struk Browser Standar [Selesai]"
                >
                  <Printer className="w-4 h-4 shrink-0" />
                  <span>Cetak Struk (Browser / PDF)</span>
                </button>

                {/* Tombol Utama Baru 2: Simulasi Print Driver (ESC/POS Raw) */}
                <button
                  id="btn-simulate-escpos-raw"
                  type="button"
                  onClick={handleSimulatePrintDriver}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/40 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer text-xs sm:text-sm active:scale-95 shadow-sm"
                  title="Buka simulasi driver ESC/POS thermal printer (RawBT / USB / Bluetooth)"
                >
                  <Terminal className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>Simulasi Print Driver (ESC/POS Raw)</span>
                </button>

                {/* Tombol Utama 3: Tunda Transaksi (Hold) */}
                <button
                  id="btn-hold-from-receipt"
                  onClick={handleHoldFromReceipt}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer text-xs sm:text-sm active:scale-95"
                  title="Tunda transaksi ini ke antrean dan buka kembali jika pelanggan ingin menambah belanjaan"
                >
                  <PauseCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Tunda Transaksi (Hold)</span>
                </button>

                {/* Tombol Utama 4: Salin Text Struk */}
                <button
                  onClick={handleCopyText}
                  className="w-full flex items-center justify-center gap-2 bg-[#21262d] hover:bg-[#30363d] text-gray-200 font-semibold py-2.5 px-4 rounded-xl border border-[#30363d] transition cursor-pointer text-xs sm:text-sm active:scale-95"
                  title="Salin teks nota belanja ke clipboard"
                >
                  <Copy className="w-4 h-4 shrink-0 text-gray-400" />
                  <span>Salin Text Struk</span>
                </button>

                {/* Tombol Utama 5: Tutup / Transaksi Baru [Esc] */}
                <button
                  onClick={closeReceipt}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-gray-300 hover:text-white font-bold py-2.5 px-4 rounded-xl border border-slate-700 hover:border-slate-600 transition cursor-pointer text-xs sm:text-sm active:scale-95 mt-1"
                  title="Tutup modal struk dan kembali ke register transaksi baru [Esc]"
                >
                  <X className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Tutup / Transaksi Baru [Esc]</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Simulasi Driver ESC/POS Thermal Raw Payload */}
      {showEscPosModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#0d1117] border border-indigo-500/40 rounded-2xl p-5 shadow-[0_20px_60px_rgba(79,70,229,0.25)] relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d] mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Simulasi Driver Hardware (ESC/POS Raw)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                      Thermal {receiptWidth}
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Protokol byte printer thermal Epson/Star kompatibel RawBT, USB Pos, Serial & Bluetooth
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEscPosModal(false)}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
                title="Tutup simulator"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Informasi Driver */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-[11px]">
              <div className="bg-[#161b22] border border-[#30363d] p-2 rounded-lg">
                <div className="text-gray-400 text-[10px]">Lebar Karakter:</div>
                <div className="font-bold text-white font-mono">
                  {receiptWidth === '58mm' ? '32 Kolom (58mm)' : '48 Kolom (80mm)'}
                </div>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] p-2 rounded-lg">
                <div className="text-gray-400 text-[10px]">Metode Bayar:</div>
                <div className="font-bold text-white truncate">{payInfo.label}</div>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] p-2 rounded-lg">
                <div className="text-gray-400 text-[10px]">PPN Terkalkulasi:</div>
                <div className="font-bold text-white font-mono">
                  {hasTax ? `Rp ${calculatedTax.toLocaleString('id-ID')}` : 'Rp 0'}
                </div>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] p-2 rounded-lg">
                <div className="text-gray-400 text-[10px]">Petugas Kasir:</div>
                <div className="font-bold text-white truncate">{cashierDisplayName}</div>
              </div>
            </div>

            {/* Payload Preview */}
            <div className="flex-1 min-h-[220px] bg-[#05070a] border border-[#30363d] rounded-xl p-3 font-mono text-xs text-emerald-400 overflow-y-auto whitespace-pre-wrap select-all leading-relaxed shadow-inner">
              {generateEscPosRawCommands()
                .replace(/\x1B\x40/g, '<ESC @ - Init Printer>\n')
                .replace(/\x1B\x61\x01/g, '<ESC a 1 - Center>\n')
                .replace(/\x1B\x61\x00/g, '<ESC a 0 - Left>\n')
                .replace(/\x1B\x45\x01/g, '<ESC E 1 - Bold ON>')
                .replace(/\x1B\x45\x00/g, '<ESC E 0 - Bold OFF>')
                .replace(/\x1D\x68\x40/g, '<GS h 64 - Barcode Height 64>\n')
                .replace(/\x1D\x77\x02/g, '<GS w 2 - Barcode Width 2>\n')
                .replace(/\x1D\x6B\x49/g, '<GS k Code128 Barcode: ')
                .replace(/\x1D\x56\x41\x10/g, '\n<GS V A 16 - Cut & Feed Paper>')}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#30363d] mt-3">
              <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Format stream siap dikirim via Web Serial API / Bluetooth Thermal</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyEscPos}
                  className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-bold py-2 px-3.5 rounded-xl border border-[#30363d] transition cursor-pointer"
                >
                  {copiedEscPos ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                  <span>{copiedEscPos ? 'Tersalin!' : 'Salin Raw Byte'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('Perintah cetak ESC/POS disimulasikan berhasil terkirim ke printer!');
                    setShowEscPosModal(false);
                  }}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Kirim ke Driver (Simulasi Sukses)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

