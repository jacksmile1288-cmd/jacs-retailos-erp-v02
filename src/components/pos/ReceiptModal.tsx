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
  Download,
  Trash2,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { hasValidProfileValue } from '../../utils/businessProfileUtils';
import {
  getSectorTerminalSubtitle,
  resolveSynchronizedTerminalDisplayName,
} from '../../utils/terminalConfigUtils';

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
  const {
    isReceiptModalOpen,
    closeReceipt,
    currentReceiptSale,
    showToast,
    businessProfile,
    activeSector,
    businessDomainConfig,
    activeUser,
    customers,
    voidTransaction,
    theme,
  } = useApp();
  const isLight = theme === 'light';
  const [showVoidPinAuth, setShowVoidPinAuth] = useState(false);
  const [voidPinInput, setVoidPinInput] = useState('');
  const [voidReason, setVoidReason] = useState('Pelanggan Batal Beli');
  const [voidError, setVoidError] = useState<string | null>(null);
  const [waNumber, setWaNumber] = useState<string>('');
  const [receiptWidth, setReceiptWidth] = useState<'58mm' | '80mm'>('80mm');
  const [showEscPosModal, setShowEscPosModal] = useState<boolean>(false);
  const [copiedEscPos, setCopiedEscPos] = useState<boolean>(false);

  useEffect(() => {
    if (currentReceiptSale) {
      setWaNumber(currentReceiptSale.customer_phone || '');
    }
  }, [currentReceiptSale]);

  useEffect(() => {
    if (!isReceiptModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || e.key === 'Enter') {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeReceipt();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReceiptModalOpen]);

  if (!isReceiptModalOpen || !currentReceiptSale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDateLocal = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };
  const customerData = customers?.find(c => c.id === currentReceiptSale.customer_id);
  const isMember = Boolean(
    currentReceiptSale.customer_id && 
    currentReceiptSale.customer_id !== 'regular' &&
    currentReceiptSale.customer_id !== 'GUEST' &&
    !currentReceiptSale.customer_name?.toLowerCase().includes('umum') &&
    currentReceiptSale.customer_name !== 'Guest' &&
    currentReceiptSale.price_tier !== 'RETAIL' &&
    currentReceiptSale.price_tier !== 'ECER'
  );
  const currentTierLabel = currentReceiptSale.price_tier || (isMember ? 'Member' : 'Umum / Reguler');
  const isVoided = currentReceiptSale.status === 'VOID' || currentReceiptSale.status === 'VOIDED' || currentReceiptSale.status === 'CANCELLED';

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

  const activeBusinessName = (
    businessProfile?.name ||
    businessProfile?.businessName ||
    'BARBER HUMAIRA'
  ).trim();
  const primaryModel =
    businessDomainConfig?.primaryBusinessModel || businessProfile?.businessType;
  const sectorTerminalSubtitle = getSectorTerminalSubtitle(activeSector, primaryModel);
  const syncedTerminalName = resolveSynchronizedTerminalDisplayName(
    currentReceiptSale.stationCode ||
      currentReceiptSale.terminalId ||
      currentReceiptSale.terminal_name,
    activeSector,
    primaryModel
  );
  const isGenericDefaultHeaderNote =
    !hasValidProfileValue(businessProfile?.headerNote) ||
    businessProfile?.headerNote === 'Unified Retail Operating System & Enterprise Management' ||
    (activeSector !== 'RETAIL' &&
      (businessProfile?.headerNote === 'Best Price & Quality Retail' ||
        businessProfile?.headerNote === 'Authentic Skincare & Beauty Essentials'));

  const isSplitReceipt = Boolean(
    String(currentReceiptSale.payment_method || '').toUpperCase().includes('SPLIT') ||
      ((Number(currentReceiptSale.splitCashAmount) || 0) > 0 &&
        (Number(currentReceiptSale.splitNonCashAmount) || 0) > 0)
  );
  const splitCashAmt = isSplitReceipt
    ? Math.max(0, Math.round(Number(currentReceiptSale.splitCashAmount) || 0))
    : 0;
  const splitNonCashAmt = isSplitReceipt
    ? Math.max(
        0,
        Math.round(
          Number(currentReceiptSale.splitNonCashAmount) ||
            Math.max(0, currentReceiptSale.total_amount - splitCashAmt)
        )
      )
    : 0;
  const splitNonCashChannel = String(currentReceiptSale.splitNonCashMethod || 'QRIS').toUpperCase();

  const isKasbonReceipt = Boolean(
    !isSplitReceipt &&
      (String(currentReceiptSale.payment_method || '').toUpperCase().includes('TEMPO') ||
        String(currentReceiptSale.payment_method || '').toUpperCase().includes('KASBON') ||
        String(currentReceiptSale.payment_method || '').toUpperCase().includes('AR') ||
        (Number(currentReceiptSale.remainingBalance) || 0) > 0 ||
        currentReceiptSale.laundryPaymentStatus === 'DP' ||
        currentReceiptSale.laundryPaymentStatus === 'BAYAR_AMBIL')
  );
  const kasbonDpPaid = isKasbonReceipt
    ? Math.max(
        0,
        Math.round(
          Number(
            currentReceiptSale.dpAmount ??
              (currentReceiptSale.remainingBalance !== undefined
                ? Math.max(0, currentReceiptSale.total_amount - currentReceiptSale.remainingBalance)
                : currentReceiptSale.amount_paid || 0)
          ) || 0
        )
      )
    : 0;
  const kasbonRemainingAr = isKasbonReceipt
    ? Math.max(
        0,
        Math.round(
          currentReceiptSale.remainingBalance !== undefined
            ? Number(currentReceiptSale.remainingBalance)
            : Math.max(0, currentReceiptSale.total_amount - kasbonDpPaid)
        )
      )
    : 0;
  const kasbonTempoDays = Number(currentReceiptSale.tempoDays) > 0 ? Number(currentReceiptSale.tempoDays) : 14;
  const kasbonDueDateStr = (() => {
    if (currentReceiptSale.dueDate) return currentReceiptSale.dueDate;
    const d = new Date(currentReceiptSale.created_at || currentReceiptSale.date || new Date().toISOString());
    d.setDate(d.getDate() + kasbonTempoDays);
    return d.toISOString().slice(0, 10);
  })();

  // Format metode pembayaran lengkap
  const formatPaymentMethodDetails = (method: string) => {
    const m = (method || '').toUpperCase();
    if (isSplitReceipt || m.includes('SPLIT')) {
      return {
        label: `Split (Tunai + ${splitNonCashChannel})`,
        icon: Banknote,
        color: 'text-indigo-700',
      };
    }
    if (isKasbonReceipt || m.includes('TEMPO') || m.includes('KASBON') || m.includes('AR')) {
      return {
        label: 'Kasbon / Piutang (DP & Termin)',
        icon: CreditCard,
        color: 'text-amber-700',
      };
    }
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

  const trxIdentifier = currentReceiptSale.receipt_number || currentReceiptSale.transaction_id;
  const isLaundryReceipt = Boolean(
    currentReceiptSale.isLaundryOrder ||
      currentReceiptSale.laundryBagTagCode ||
      currentReceiptSale.items?.some(
        (it) =>
          it.product?.businessModel === 'laundry' ||
          Boolean(it.product?.laundryUnitType) ||
          String(it.product?.id || '').startsWith('LND-')
      )
  );
  const laundryTagCode =
    currentReceiptSale.laundryBagTagCode ||
    `TAG-${String(trxIdentifier).replace(/[^A-Z0-9]/gi, '').slice(-4)}`;
  const laundryTotalPcs =
    currentReceiptSale.laundryTotalPieces ??
    (currentReceiptSale.items?.reduce(
      (sum, it) => sum + Math.max(1, Math.round(it.quantity || 1)),
      0
    ) ||
      1);
  const laundryPayStatus =
    currentReceiptSale.laundryPaymentStatus ||
    ((currentReceiptSale.remainingBalance || 0) > 0
      ? (currentReceiptSale.amount_paid || 0) > 0
        ? 'DP'
        : 'BAYAR_AMBIL'
      : 'LUNAS_AWAL');
  const laundryPaidAmt =
    laundryPayStatus === 'BAYAR_AMBIL'
      ? 0
      : currentReceiptSale.dpAmount ??
        currentReceiptSale.amount_paid ??
        currentReceiptSale.total_amount;
  const laundryRemainingAmt =
    currentReceiptSale.remainingBalance !== undefined
      ? currentReceiptSale.remainingBalance
      : Math.max(0, currentReceiptSale.total_amount - laundryPaidAmt);
  const laundryEstDoneDisplay = currentReceiptSale.laundryEstimatedDoneAt
    ? formatDateLocal(currentReceiptSale.laundryEstimatedDoneAt)
    : '';
  const laundryPayStatusLabel =
    laundryPayStatus === 'LUNAS_AWAL'
      ? 'LUNAS DI AWAL'
      : laundryPayStatus === 'DP'
      ? 'DP (UANG MUKA)'
      : 'BAYAR SAAT AMBIL';

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

    const storeName = activeBusinessName;
    const storeSubtitle = `${activeBusinessName} • ${sectorTerminalSubtitle}`;
    const storeAddress = businessProfile?.address || 'Jakarta, Indonesia';
    const storePhone = businessProfile?.phone ? `T: ${businessProfile.phone}` : '';
    const storeWA = businessProfile?.whatsapp ? `WA: ${businessProfile.whatsapp}` : '';
    const contactLine = [storePhone, storeWA].filter(Boolean).join(' | ');
    const trxId = currentReceiptSale.receipt_number || currentReceiptSale.transaction_id;
    const timeStr = formatDateLocal(currentReceiptSale.created_at || currentReceiptSale.date);

    const itemsStr =
      currentReceiptSale.items && currentReceiptSale.items.length > 0
        ? currentReceiptSale.items
            .map((it) => {
              const tierTag = it.buildingTierBadge ? `[${it.buildingTierBadge}] ` : '';
              const badge = it.promoBadge ? `${it.promoBadge} ` : '';
              const fashionVar =
                it.selectedFashionSize || it.selectedFashionColor
                  ? ` [${[it.selectedFashionSize, it.selectedFashionColor].filter(Boolean).join(' • ')}]`
                  : '';
              const name = `${tierTag}${badge}${it.product.name}${fashionVar}`.slice(0, lineWidth);
              const unitEff = Math.max(0, it.product.sell_price - (it.itemDiscount || 0));
              const qtyPrice = `${it.quantity} x Rp ${unitEff.toLocaleString('id-ID')}`;
              const sub = `Rp ${it.subtotal.toLocaleString('id-ID')}`;
              const savings = it.promoSavings ?? ((it.itemDiscount || 0) * it.quantity);
              const slaLine = it.product.slaDuration ? `\n  SLA: ${it.product.slaDuration}` : '';
              const dimLine = it.laundryLengthM && it.laundryWidthM ? `\n  Dimensi: ${it.laundryLengthM}m x ${it.laundryWidthM}m` : '';
              const scaleLine = it.grossWeightKg !== undefined
                ? `\n  Timbang: Bruto ${it.grossWeightKg.toFixed(2)}kg - Tare ${(it.tareWeightKg || 0).toFixed(2)}kg = Netto ${(it.actualNetWeightKg ?? it.quantity).toFixed(2)}kg${it.isMinWeightAdjusted ? ` [Auto Min. ${it.minWeightAppliedKg ?? it.quantity} kg]` : ''}`
                : it.isMinWeightAdjusted
                ? `\n  [Auto Min. Order: ${it.minWeightAppliedKg ?? it.quantity} ${it.selectedUnit || it.product.unit || 'kg'}]`
                : '';
              const freeLine = (it.freeBonusQty || 0) > 0 ? `\n  + Bonus Gratis: ${it.freeBonusQty} unit` : '';
              const hintLine = it.promoHint ? `\n  (${it.promoHint})` : '';
              const manReasonLine = it.manualDiscountReason ? `\n  Alasan Disc: ${it.manualDiscountReason}` : '';
              const savLine = savings > 0 ? `\n  Hemat: -Rp ${savings.toLocaleString('id-ID')}` : '';
              const fnbModParts: string[] = [];
              if (it.modifiers?.toppings && it.modifiers.toppings.length > 0) {
                fnbModParts.push(`+ ${it.modifiers.toppings.join(', ')}`);
              }
              if (it.modifiers?.spicyLabel) {
                fnbModParts.push(`Pedas: ${it.modifiers.spicyLabel}`);
              }
              if (it.modifiers?.sugarIceLabel && it.modifiers.sugarIceLabel !== 'Normal') {
                fnbModParts.push(it.modifiers.sugarIceLabel);
              }
              const fnbModLine = fnbModParts.length > 0 ? `\n  ${fnbModParts.join(' | ')}` : '';
              const fnbNoteLine = it.modifiers?.notes ? `\n  Catatan: ${it.modifiers.notes}` : '';
              return `${name}\n${padBetween(qtyPrice, sub)}${fnbModLine}${fnbNoteLine}${slaLine}${dimLine}${scaleLine}${freeLine}${hintLine}${manReasonLine}${savLine}`;
            })
            .join('\n')
        : padBetween(currentReceiptSale.items_summary.slice(0, 20), `Rp ${currentReceiptSale.total_amount.toLocaleString('id-ID')}`);

    const fnbOrderModeEscLine = (() => {
      if (!currentReceiptSale.fnbOrderMode) return '';
      const modeUpper = currentReceiptSale.fnbOrderMode.toUpperCase();
      if (modeUpper === 'DINE-IN') {
        const rawTbl = (currentReceiptSale.fnbTableNo || 'Meja 01').trim();
        const tblLabel = rawTbl.toLowerCase().includes('meja') ? rawTbl : `Meja ${rawTbl}`;
        return `${padBetween('Mode Pesanan:', `Dine-In (${tblLabel})`)}\n`;
      }
      if (modeUpper === 'DELIVERY') {
        return `${padBetween('Mode Pesanan:', 'Delivery (Tanpa Meja)')}\n`;
      }
      return `${padBetween('Mode Pesanan:', 'Takeaway (Tanpa Meja)')}\n`;
    })();

    return `\x1B\x40` + // ESC @ (Initialize printer)
`\x1B\x61\x01` + // Center align
`${centerText(storeName.toUpperCase())}\n` +
`${centerText(storeSubtitle)}\n` +
`${centerText(storeAddress)}\n` +
(contactLine ? `${centerText(contactLine)}\n` : '') +
`${doubleDivider}\n` +
`\x1B\x61\x00` + // Left align
`${padBetween('No. Struk:', trxId)}\n` +
`${padBetween('Waktu:', timeStr)}\n` +
`${padBetween('Terminal:', syncedTerminalName)}\n` +
`${padBetween('Kasir:', cashierDisplayName)}\n` +
fnbOrderModeEscLine +
(currentReceiptSale.fashionAdvisorName ? `${padBetween('Pramuniaga:', currentReceiptSale.fashionAdvisorName)}\n` : '') +
`${padBetween('Tier:', currentTierLabel)}\n` +
(currentReceiptSale.customer_name ? `${padBetween('Pelanggan:', currentReceiptSale.customer_name)}\n` : '') +
(currentReceiptSale.isFashionExchange
  ? `TUKAR BARANG/UKURAN (Ref: ${currentReceiptSale.exchangeRefReceipt || '-'})\n${currentReceiptSale.exchangeSummary ? `${currentReceiptSale.exchangeSummary}\n` : ''}`
  : '') +
`${divider}\n` +
`${itemsStr}\n` +
`${divider}\n` +
`${padBetween('Subtotal:', `Rp ${currentReceiptSale.subtotal.toLocaleString('id-ID')}`)}\n` +
(currentReceiptSale.discount > 0 ? `${padBetween('Total Hemat Promo:', `-Rp ${currentReceiptSale.discount.toLocaleString('id-ID')}`)}\n` : '') +
(hasTax ? `${padBetween('PPN (11%):', `Rp ${calculatedTax.toLocaleString('id-ID')}`)}\n` : '') +
`\x1B\x45\x01` + // Bold on
`${padBetween('TOTAL:', `Rp ${currentReceiptSale.total_amount.toLocaleString('id-ID')}`)}\n` +
`\x1B\x45\x00` + // Bold off
`${padBetween('Metode Bayar:', payInfo.label)}\n` +
(isSplitReceipt
  ? `${padBetween('Tunai (1-10101):', `Rp ${splitCashAmt.toLocaleString('id-ID')}`)}\n` +
    `${padBetween(`Non-Tunai (${splitNonCashChannel}):`, `Rp ${splitNonCashAmt.toLocaleString('id-ID')}`)}\n`
  : '') +
(isKasbonReceipt
  ? `${padBetween('Total Tagihan:', `Rp ${currentReceiptSale.total_amount.toLocaleString('id-ID')}`)}\n` +
    `${padBetween('DP Dibayar:', `Rp ${kasbonDpPaid.toLocaleString('id-ID')}`)}\n` +
    `\x1B\x45\x01${padBetween('Sisa Piutang:', `Rp ${kasbonRemainingAr.toLocaleString('id-ID')}`)}\n\x1B\x45\x00` +
    `${padBetween('Jatuh Tempo:', `${kasbonDueDateStr} (+${kasbonTempoDays} Hr)`)}\n`
  : '') +
(isLaundryReceipt ? `${padBetween('Status Bayar:', laundryPayStatusLabel)}\n` : '') +
(!isKasbonReceipt && !isSplitReceipt && currentReceiptSale.amount_paid
  ? `${padBetween('Dibayar:', `Rp ${currentReceiptSale.amount_paid.toLocaleString('id-ID')}`)}\n`
  : '') +
(!isKasbonReceipt && currentReceiptSale.change_amount
  ? `${padBetween('Kembalian:', `Rp ${(currentReceiptSale.change_amount || 0).toLocaleString('id-ID')}`)}\n`
  : '') +
`${doubleDivider}\n` +
`\x1B\x61\x01` + // Center align
`\x1D\x68\x40` + // Barcode height (64 dots)
`\x1D\x77\x02` + // Barcode module width
`\x1D\x6B\x49` + `${String.fromCharCode(trxId.length)}${trxId}\n` + // GS k (Code128 barcode)
`* ${trxId} *\n` +
`Terima Kasih Atas Kunjungan Anda\n` +
`Petugas Kasir: ${cashierDisplayName}\n` +
(businessProfile?.footerNote ? `${businessProfile.footerNote}\n` : '') +
(isLaundryReceipt
  ? `\n---- POTONG DISINI : TAG KANTONG CUCIAN ----\n` +
    `\x1B\x45\x01TAG: ${laundryTagCode} | ${trxId}\x1B\x45\x00\n` +
    `\x1B\x61\x00` +
    `${padBetween('Pelanggan:', currentReceiptSale.customer_name || 'Pelanggan Laundry')}\n` +
    (currentReceiptSale.customer_phone ? `${padBetween('WhatsApp:', currentReceiptSale.customer_phone)}\n` : '') +
    `${padBetween('Total Fisik:', `${laundryTotalPcs} Pcs`)}\n` +
    (currentReceiptSale.laundryConditionNotes && currentReceiptSale.laundryConditionNotes !== '-'
      ? `Kondisi: ${currentReceiptSale.laundryConditionNotes}\n`
      : '') +
    (laundryEstDoneDisplay ? `${padBetween('Est. Selesai:', laundryEstDoneDisplay)}\n` : '') +
    (currentReceiptSale.laundryRackNumber ? `${padBetween('Nomor Rak:', currentReceiptSale.laundryRackNumber)}\n` : '') +
    `${padBetween('Tagihan:', laundryRemainingAmt > 0 ? `SISA Rp ${laundryRemainingAmt.toLocaleString('id-ID')}` : 'LUNAS')}\n` +
    `${divider}\n`
  : '') +
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
    const headerSub = !isGenericDefaultHeaderNote
      ? `${businessProfile!.headerNote}\n`
      : `${activeBusinessName} • ${sectorTerminalSubtitle}\n`;
    const footerMsg = hasValidProfileValue(businessProfile?.footerNote)
      ? `\n=================================\n${businessProfile!.footerNote}`
      : '\n=================================';

    const text = `
=================================
       ${activeBusinessName}
${headerSub}=================================
Toko: ${businessProfile?.address || 'Jakarta'}
${[businessProfile?.phone ? `T: ${businessProfile.phone}` : null, businessProfile?.whatsapp ? `WA: ${businessProfile.whatsapp}` : null].filter(Boolean).join(' | ')}
=================================
No. Struk : ${currentReceiptSale.receipt_number || currentReceiptSale.transaction_id}
Tanggal   : ${formatDateLocal(currentReceiptSale.created_at || currentReceiptSale.date)}
Terminal  : ${syncedTerminalName}
Kasir     : ${cashierDisplayName}
Tier      : ${currentTierLabel}
${currentReceiptSale.customer_name ? `Pelanggan : ${currentReceiptSale.customer_name} (${currentReceiptSale.customer_phone || waNumber || '-'})\n` : ''}---------------------------------
Ringkasan : ${currentReceiptSale.items_summary}
Subtotal  : Rp ${currentReceiptSale.subtotal.toLocaleString('id-ID')}
${currentReceiptSale.discount > 0 ? `Diskon    : -Rp ${currentReceiptSale.discount.toLocaleString('id-ID')}\n` : ''}${hasTax ? `PPN (11%) : Rp ${calculatedTax.toLocaleString('id-ID')}\n` : ''}TOTAL     : Rp ${currentReceiptSale.total_amount.toLocaleString('id-ID')}
Metode    : ${payInfo.label}
${
  isSplitReceipt
    ? `Tunai     : Rp ${splitCashAmt.toLocaleString('id-ID')}\nNon-Tunai : Rp ${splitNonCashAmt.toLocaleString('id-ID')} (${splitNonCashChannel})\n`
    : isKasbonReceipt
    ? `Total Tagihan : Rp ${currentReceiptSale.total_amount.toLocaleString('id-ID')}\nDP Dibayar    : Rp ${kasbonDpPaid.toLocaleString('id-ID')}\nSisa Piutang  : Rp ${kasbonRemainingAr.toLocaleString('id-ID')}\nJatuh Tempo   : ${kasbonDueDateStr} (+${kasbonTempoDays} Hari)\n`
    : `${currentReceiptSale.amount_paid ? `Dibayar   : Rp ${currentReceiptSale.amount_paid.toLocaleString('id-ID')}\n` : ''}${currentReceiptSale.change_amount ? `Kembalian : Rp ${currentReceiptSale.change_amount.toLocaleString('id-ID')}\n` : ''}`
}${footerMsg}
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
              const tierTag = it.buildingTierBadge ? `[${it.buildingTierBadge}] ` : '';
              const badge = it.promoBadge ? `${it.promoBadge} ` : '';
              const fashionVar =
                it.selectedFashionSize || it.selectedFashionColor
                  ? ` [${[it.selectedFashionSize, it.selectedFashionColor].filter(Boolean).join(' • ')}]`
                  : '';
              const cleanName = `${tierTag}${badge}${it.product.name}${fashionVar}`;
              const effUnit = Math.max(0, it.product.sell_price - (it.itemDiscount || 0));
              const unitPrice = effUnit ? ` @ Rp ${effUnit.toLocaleString('id-ID')}` : '';
              const freeText = (it.freeBonusQty || 0) > 0 ? ` [+Gratis ${it.freeBonusQty} unit]` : '';
              const savings = it.promoSavings ?? ((it.itemDiscount || 0) * it.quantity);
              const savText = savings > 0 ? ` [Hemat Rp ${savings.toLocaleString('id-ID')}]` : '';
              const modDetails: string[] = [];
              if (it.modifiers?.toppings && it.modifiers.toppings.length > 0) {
                modDetails.push(`Topping: ${it.modifiers.toppings.join(', ')}`);
              }
              if (it.modifiers?.spicyLabel) {
                modDetails.push(`Pedas: ${it.modifiers.spicyLabel}`);
              }
              if (it.modifiers?.sugarIceLabel && it.modifiers.sugarIceLabel !== 'Normal') {
                modDetails.push(it.modifiers.sugarIceLabel);
              }
              if (it.modifiers?.notes) {
                modDetails.push(`Catatan: ${it.modifiers.notes}`);
              }
              const modSubLine = modDetails.length > 0 ? `\n   ↳ ${modDetails.join(' • ')}` : '';
              return `• ${cleanName} (${it.quantity}x${unitPrice}) = Rp ${it.subtotal.toLocaleString('id-ID')}${freeText}${savText}${modSubLine}`;
            })
            .join('\n')
        : currentReceiptSale.items_summary;

    const fnbWaModeLine = (() => {
      if (!currentReceiptSale.fnbOrderMode) return '';
      const modeUpper = currentReceiptSale.fnbOrderMode.toUpperCase();
      if (modeUpper === 'DINE-IN') {
        const rawTbl = (currentReceiptSale.fnbTableNo || 'Meja 01').trim();
        const tblLabel = rawTbl.toLowerCase().includes('meja') ? rawTbl : `Meja ${rawTbl}`;
        return `Pesanan   : Dine-In • ${tblLabel}\n`;
      }
      if (modeUpper === 'DELIVERY') {
        return `Pesanan   : Delivery • Tanpa Meja (Kurir)\n`;
      }
      return `Pesanan   : Takeaway • Tanpa Meja (Bungkus)\n`;
    })();

    const message =
      `*STRUK RESMI ${activeBusinessName.toUpperCase()}*\n` +
      `${activeBusinessName} • ${sectorTerminalSubtitle}\n` +
      `=================================\n` +
      `No. Struk : ${currentReceiptSale.receipt_number || currentReceiptSale.transaction_id}\n` +
      `Waktu     : ${formatDateLocal(currentReceiptSale.created_at || currentReceiptSale.date)}\n` +
      `Terminal  : ${syncedTerminalName}\n` +
      `Kasir     : ${cashierDisplayName}\n` +
      fnbWaModeLine +
      (currentReceiptSale.fashionAdvisorName ? `Pramuniaga: ${currentReceiptSale.fashionAdvisorName}\n` : '') +
      `Tier      : ${currentTierLabel}\n` +
      (currentReceiptSale.customer_name ? `Pelanggan : ${currentReceiptSale.customer_name} (${cleanPhone})\n` : '') +
      (currentReceiptSale.isFashionExchange
        ? `Tukar Barang: Ref ${currentReceiptSale.exchangeRefReceipt || '-'} (${currentReceiptSale.exchangeSummary || ''})\n`
        : '') +
      (isMember && currentReceiptSale.points_earned !== undefined && currentReceiptSale.points_earned > 0
        ? `Reward Pts: +${currentReceiptSale.points_earned} Pts (Tersimpan ke Akun Member)\n`
        : '') +
      `=================================\n` +
      `RINCIAN PESANAN:\n` +
      `${itemsList}\n` +
      `=================================\n` +
      `Subtotal  : Rp ${currentReceiptSale.subtotal.toLocaleString('id-ID')}\n` +
      (currentReceiptSale.discount > 0
        ? `Hemat Promo: -Rp ${currentReceiptSale.discount.toLocaleString('id-ID')}${currentReceiptSale.manualDiscountReason ? ` (${currentReceiptSale.manualDiscountReason})` : ''}\n`
        : '') +
      (hasTax
        ? `PPN (11%) : Rp ${calculatedTax.toLocaleString('id-ID')}\n`
        : '') +
      `*GRAND TOTAL : Rp ${currentReceiptSale.total_amount.toLocaleString('id-ID')}*\n` +
      `Metode    : ${payInfo.label}\n` +
      (isSplitReceipt
        ? `Tunai (1-10101): Rp ${splitCashAmt.toLocaleString('id-ID')}\n` +
          `Non-Tunai (${splitNonCashChannel}): Rp ${splitNonCashAmt.toLocaleString('id-ID')}\n`
        : '') +
      (isKasbonReceipt
        ? `Total Tagihan : Rp ${currentReceiptSale.total_amount.toLocaleString('id-ID')}\n` +
          `DP Dibayar    : Rp ${kasbonDpPaid.toLocaleString('id-ID')}\n` +
          `*Sisa Piutang : Rp ${kasbonRemainingAr.toLocaleString('id-ID')}*\n` +
          `Jatuh Tempo   : ${kasbonDueDateStr} (+${kasbonTempoDays} Hari)\n`
        : '') +
      (isLaundryReceipt
        ? `Tag Kantong : ${laundryTagCode}\n` +
          `Jumlah Pcs  : ${laundryTotalPcs} Pcs\n` +
          (currentReceiptSale.laundryConditionNotes && currentReceiptSale.laundryConditionNotes !== '-'
            ? `Kondisi Awal: ${currentReceiptSale.laundryConditionNotes}\n`
            : '') +
          (laundryEstDoneDisplay ? `Est. Selesai: ${laundryEstDoneDisplay} (${currentReceiptSale.laundrySlaLabel || 'SLA'})\n` : '') +
          `Status Bayar: ${laundryPayStatusLabel}\n`
        : '') +
      (!isKasbonReceipt && !isSplitReceipt && currentReceiptSale.amount_paid && !isLaundryReceipt
        ? `Dibayar   : Rp ${currentReceiptSale.amount_paid.toLocaleString('id-ID')}\n`
        : '') +
      (!isKasbonReceipt && currentReceiptSale.change_amount
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

  return (
    <>
      <div
        id="modal-receipt"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto"
      >
        <div className={`w-full max-w-4xl rounded-2xl p-4 sm:p-5 relative animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto border transition-all ${
          isLight
            ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-800'
            : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-white'
        }`}>
          {/* Top Header Banner */}
          <div className={`flex items-center justify-between pb-3 border-b mb-4 transition-colors ${
            isVoided 
              ? 'border-rose-500/40 text-rose-500' 
              : isLight 
              ? 'border-slate-200 text-emerald-600' 
              : 'border-[#30363d] text-emerald-400'
          }`}>
            <div className="flex items-center gap-2">
              {isVoided ? (
                <>
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span className="text-base leading-6 font-medium tracking-wide uppercase">TRANSAKSI TELAH DIBATALKAN (VOID) • #{trxIdentifier}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span className="text-base leading-6 font-medium tracking-wide">TRANSAKSI BERHASIL DICATAT</span>
                </>
              )}
              {!isVoided && (
                <span className="hidden sm:inline text-xs text-gray-400 font-mono font-normal">
                  • #{trxIdentifier}
                </span>
              )}
            </div>
            <button
              onClick={closeReceipt}
              className="text-gray-400 hover:text-white bg-slate-800/80 hover:bg-rose-600 p-1.5 rounded-lg border border-slate-700 hover:border-rose-500 transition cursor-pointer shadow-sm group active:scale-[0.99]"
              title="Tutup Struk [Esc]"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Selector Ukuran Lebar Thermal ESC/POS (58mm vs 80mm) */}
          <div className={`flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl mb-4 border transition-colors ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
          }`}>
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-cyan-500 shrink-0" />
              <span className={`text-xs font-medium ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>Format Printer Thermal:</span>
              <span className="text-[11px] text-gray-400 font-normal">Pilih lebar kertas struk kasir</span>
            </div>
            <div className={`flex items-center gap-1.5 p-1 rounded-lg border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
            }`}>
              <button
                type="button"
                onClick={() => setReceiptWidth('58mm')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition cursor-pointer active:scale-[0.99] ${
                  receiptWidth === '58mm'
                    ? 'bg-[#0052FF] text-white shadow-xs'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition cursor-pointer active:scale-[0.99] ${
                  receiptWidth === '80mm'
                    ? 'bg-[#0052FF] text-white shadow-xs'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                className={`bg-white text-gray-900 rounded-xl font-mono shadow-inner border border-gray-300 space-y-2.5 transition-all duration-200 relative overflow-hidden ${
                  receiptWidth === '58mm'
                    ? 'receipt-58mm w-[290px] p-3 text-[10px]'
                    : 'receipt-80mm w-full max-w-[390px] p-4 sm:p-5 text-xs'
                }`}
              >
                {/* Watermark VOID */}
                {isVoided && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none overflow-hidden">
                    <div className="border-[12px] border-rose-500/20 text-rose-500/20 font-black text-5xl sm:text-7xl uppercase tracking-[0.2em] -rotate-[35deg] px-8 py-4 rounded-3xl transform scale-125 whitespace-nowrap">
                      BATAL / VOID
                    </div>
                  </div>
                )}
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
                  <h2 className={`font-black tracking-wider text-black uppercase ${receiptWidth === '58mm' ? 'text-sm' : 'text-base'}`}>
                    {activeBusinessName}
                  </h2>
                  <p className="text-[10px] text-gray-600 font-sans leading-tight">
                    {activeBusinessName} • {sectorTerminalSubtitle}
                  </p>
                  {!isGenericDefaultHeaderNote && (
                    <p className="text-[10px] text-gray-600 leading-tight">
                      {businessProfile!.headerNote}
                    </p>
                  )}
                  {(hasValidProfileValue(businessProfile?.address) ||
                    hasValidProfileValue(businessProfile?.phone) ||
                    hasValidProfileValue(businessProfile?.whatsapp)) && (
                    <p className="text-[10px] text-gray-600 leading-tight">
                      {[
                        hasValidProfileValue(businessProfile?.address) ? businessProfile!.address : null,
                        hasValidProfileValue(businessProfile?.phone) ? `T: ${businessProfile!.phone}` : null,
                        hasValidProfileValue(businessProfile?.whatsapp) ? `WA: ${businessProfile!.whatsapp}` : null,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  )}
                </div>

                {/* Meta Informasi Transaksi */}
                <div className="space-y-1 border-b border-dashed border-gray-400 pb-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Waktu:</span>
                    <span>{formatDateLocal(currentReceiptSale.created_at || currentReceiptSale.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terminal:</span>
                    <span className="font-semibold">{syncedTerminalName}</span>
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
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded text-[10px] border ${
                          currentReceiptSale.isContractorMode || (currentReceiptSale.price_tier || '').includes('Kontraktor')
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : (currentReceiptSale.price_tier || '').includes('Tukang')
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-blue-50 text-[#0052FF] border-blue-200'
                        }`}
                      >
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
                  {currentReceiptSale.fnbOrderMode && (
                    <div className="flex justify-between items-center text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <span>F&B Order Mode:</span>
                      <span>
                        {currentReceiptSale.fnbOrderMode.toUpperCase() === 'DINE-IN'
                          ? (() => {
                              const rawTbl = (currentReceiptSale.fnbTableNo || 'Meja 01').trim();
                              const tblLabel = rawTbl.toLowerCase().includes('meja')
                                ? rawTbl
                                : `Meja ${rawTbl}`;
                              return `Dine-In • ${tblLabel}`;
                            })()
                          : currentReceiptSale.fnbOrderMode.toUpperCase() === 'DELIVERY'
                          ? 'Delivery • Tanpa Meja (Kurir)'
                          : 'Takeaway • Tanpa Meja (Bungkus)'}
                      </span>
                    </div>
                  )}
                  {currentReceiptSale.vehiclePlate && (
                    <div className="flex justify-between items-center text-[10px] font-bold text-orange-800 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                      <span>Bengkel & Otomotif:</span>
                      <span>No. Pol: {currentReceiptSale.vehiclePlate} ({currentReceiptSale.mechanicName || 'Mekanik'})</span>
                    </div>
                  )}
                  {currentReceiptSale.stylistName && (
                    <div className="flex justify-between items-center text-[10px] font-bold text-pink-800 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200">
                      <span>Salon / Barbershop:</span>
                      <span>Capster: {currentReceiptSale.stylistName}</span>
                    </div>
                  )}
                  {currentReceiptSale.petOrClientName && (
                    <div className="flex justify-between items-center text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      <span>Petshop / Apotik:</span>
                      <span>Pasien/Hewan: {currentReceiptSale.petOrClientName}</span>
                    </div>
                  )}
                  {currentReceiptSale.fashionAdvisorName && (
                    <div className="flex justify-between items-center text-[10px] font-bold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                      <span>Fashion Advisor / Pramuniaga:</span>
                      <span>{currentReceiptSale.fashionAdvisorName}</span>
                    </div>
                  )}
                  {currentReceiptSale.isFashionExchange && (
                    <div className="p-1.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-0.5 text-[10px]">
                      <div className="flex justify-between font-bold">
                        <span>⇄ TUKAR UKURAN / BARANG BUTIK</span>
                        <span>Ref: {currentReceiptSale.exchangeRefReceipt || '-'}</span>
                      </div>
                      {currentReceiptSale.exchangeSummary && (
                        <div className="text-[9px] font-mono text-emerald-800 leading-snug">
                          {currentReceiptSale.exchangeSummary}
                        </div>
                      )}
                    </div>
                  )}
                  {currentReceiptSale.deliveryFleetActive && (
                    <div className="flex justify-between items-center text-[10px] font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      <span>Pengiriman Armada:</span>
                      <span>Aktif (Surat Jalan / DO)</span>
                    </div>
                  )}
                  {isLaundryReceipt && (
                    <div className="mt-1 p-1.5 rounded bg-cyan-50 border border-cyan-300 text-cyan-950 space-y-0.5 text-[10px]">
                      <div className="flex justify-between font-bold">
                        <span>🧺 Tag Kantong: {laundryTagCode}</span>
                        <span>{laundryTotalPcs} Pcs Fisik</span>
                      </div>
                      {laundryEstDoneDisplay && (
                        <div className="flex justify-between">
                          <span className="text-cyan-800">Est. Selesai ({currentReceiptSale.laundrySlaLabel || 'SLA'}):</span>
                          <span className="font-bold">{laundryEstDoneDisplay}</span>
                        </div>
                      )}
                      {currentReceiptSale.laundryConditionNotes && currentReceiptSale.laundryConditionNotes !== '-' && (
                        <div className="text-[9px] text-amber-900 bg-amber-100/80 px-1 py-0.5 rounded border border-amber-300">
                          Kondisi Awal: {currentReceiptSale.laundryConditionNotes}
                        </div>
                      )}
                      {currentReceiptSale.laundryRackNumber && (
                        <div className="flex justify-between font-bold text-indigo-800">
                          <span>Lokasi Rak:</span>
                          <span>{currentReceiptSale.laundryRackNumber}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {isMember && currentReceiptSale.points_earned !== undefined && currentReceiptSale.points_earned > 0 && (
                    <div className="flex flex-col gap-1 bg-amber-50 px-2 py-1.5 rounded border border-amber-200 text-amber-900">
                      <div className="flex justify-between items-center text-[10px] font-semibold">
                        <span>Reward Poin Belanja:</span>
                        <span className="font-bold font-mono text-amber-800">
                          +{currentReceiptSale.points_earned} Pts
                        </span>
                      </div>
                      {customerData && (
                        <div className="flex justify-between items-center text-[9px] opacity-75 border-t border-amber-200/50 pt-1">
                          <span>Sisa Saldo Poin:</span>
                          <span className="font-mono">{customerData.points || 0} Pts</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Rincian Item Belanja */}
                <div className="space-y-1.5 border-b border-dashed border-gray-400 pb-2.5 max-h-52 overflow-y-auto pr-1">
                  {currentReceiptSale.items && currentReceiptSale.items.length > 0 ? (
                    currentReceiptSale.items.map((item, idx) => {
                      const cleanName = item.product.name;
                      const variantStr = [
                        item.selectedFashionSize || item.product.size || item.product.variantSize,
                        item.selectedFashionColor || item.product.color || item.product.variantColor || item.modifiers?.variant,
                      ]
                        .filter(Boolean)
                        .join(' • ');
                      const snImeiStr = item.product.imeiSerial || item.product.sku;
                      const unitDisc = item.itemDiscount || 0;
                      const effectiveUnit = Math.max(0, item.product.sell_price - unitDisc);
                      const lineSavings = item.promoSavings ?? (unitDisc * item.quantity);
                      const comps = item.componentSkus || item.product?.componentSkus;
                      return (
                        <div key={`rcpt-item-${idx}`} className="space-y-0.5">
                          <div className="font-semibold text-black leading-tight text-xs break-words flex flex-wrap items-center gap-1">
                            <span>{cleanName}</span>
                            {item.buildingTierBadge && (
                              <span
                                className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded border ${
                                  item.buildingTierName === 'KONTRAKTOR'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                    : 'bg-amber-100 text-amber-900 border-amber-400'
                                }`}
                              >
                                {item.buildingTierBadge}
                              </span>
                            )}
                            {item.promoBadge && (
                              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {item.promoBadge}
                              </span>
                            )}
                          </div>
                          {Array.isArray(comps) && comps.length > 0 && (
                            <div className="text-[9px] text-gray-600 font-mono pl-1">
                              Isi Paket: {comps.map((c) => `${c.qty * (item.quantity + (item.freeBonusQty || 0))}x ${c.skuName}`).join(', ')}
                            </div>
                          )}
                          {(item.freeBonusQty || 0) > 0 && (
                            <div className="text-[10px] text-emerald-700 font-semibold font-mono pl-1">
                              + Bonus Gratis: {item.freeBonusQty} unit ({item.freeBonusLabel || 'Beli X Gratis Y'})
                            </div>
                          )}
                          {variantStr && (
                            <div className="text-[10px] text-purple-700 font-medium">
                              Varian: {variantStr}
                            </div>
                          )}
                          {item.modifiers &&
                            ((item.modifiers.toppings && item.modifiers.toppings.length > 0) ||
                              item.modifiers.spicyLabel ||
                              (item.modifiers.sugarIceLabel && item.modifiers.sugarIceLabel !== 'Normal') ||
                              item.modifiers.notes) && (
                              <div className="pl-2 text-[10px] text-gray-700 space-y-0.5 font-sans">
                                {item.modifiers.toppings && item.modifiers.toppings.length > 0 && (
                                  <div className="text-emerald-800 font-medium">
                                    +{' '}
                                    {item.modifiers.toppingDetails && item.modifiers.toppingDetails.length > 0
                                      ? item.modifiers.toppingDetails
                                          .map((t) =>
                                            t.price > 0
                                              ? `${t.name} (+Rp ${t.price.toLocaleString('id-ID')})`
                                              : t.name
                                          )
                                          .join(', ')
                                      : item.modifiers.toppings.join(', ')}
                                  </div>
                                )}
                                {(item.modifiers.spicyLabel ||
                                  (item.modifiers.sugarIceLabel && item.modifiers.sugarIceLabel !== 'Normal')) && (
                                  <div className="text-amber-800">
                                    {[
                                      item.modifiers.spicyLabel ? `Pedas: ${item.modifiers.spicyLabel}` : null,
                                      item.modifiers.sugarIceLabel && item.modifiers.sugarIceLabel !== 'Normal'
                                        ? item.modifiers.sugarIceLabel
                                        : null,
                                    ]
                                      .filter(Boolean)
                                      .join(' • ')}
                                  </div>
                                )}
                                {item.modifiers.notes && (
                                  <div className="text-gray-600 italic">
                                    Catatan: &quot;{item.modifiers.notes}&quot;
                                  </div>
                                )}
                              </div>
                            )}
                          {snImeiStr && !item.isPackage && (
                            <div className="text-[10px] text-cyan-800 font-mono">
                              SN/IMEI: {snImeiStr} {item.product.warrantyPeriod ? `(Garansi: ${item.product.warrantyPeriod})` : ''}
                            </div>
                          )}
                          {(item.selectedUnit || item.product.slaDuration || item.grossWeightKg !== undefined || (item.laundryLengthM && item.laundryWidthM)) && (
                            <div className="text-[10px] text-indigo-800 font-medium space-y-0.5">
                              {item.selectedUnit && (
                                <div>
                                  Satuan / Qty: {item.quantity} {item.selectedUnit}
                                  {item.cubicDeductionM3
                                    ? ` (Konversi Curah: ${item.cubicDeductionM3} m³)`
                                    : ''}
                                </div>
                              )}
                              {item.product.slaDuration && (
                                <div className="text-[9px] text-cyan-800 font-mono">
                                  SLA Pengerjaan: {item.product.slaDuration}
                                </div>
                              )}
                              {item.laundryLengthM && item.laundryWidthM && (
                                <div className="text-[9px] text-indigo-700 font-mono">
                                  Dimensi: {item.laundryLengthM}m × {item.laundryWidthM}m ({(item.laundryLengthM * item.laundryWidthM).toFixed(2)} m²)
                                </div>
                              )}
                              {item.grossWeightKg !== undefined ? (
                                <div className="text-[9px] text-slate-700 font-mono">
                                  Timbang: Bruto {item.grossWeightKg.toFixed(2)}kg - Tare {(item.tareWeightKg || 0).toFixed(2)}kg = Netto {(item.actualNetWeightKg ?? item.quantity).toFixed(2)}kg
                                  {item.isMinWeightAdjusted ? ` • Auto Min. ${item.minWeightAppliedKg ?? item.quantity} kg` : ''}
                                </div>
                              ) : item.isMinWeightAdjusted ? (
                                <div className="text-[9px] text-amber-700 font-mono">
                                  Auto Min. Order diterapkan ({item.minWeightAppliedKg ?? item.quantity} {item.selectedUnit || item.product.unit || 'kg'})
                                </div>
                              ) : null}
                            </div>
                          )}
                          <div className="flex justify-between text-[11px] text-gray-600">
                            <span>
                              {item.quantity} x Rp {effectiveUnit.toLocaleString('id-ID')}
                              {unitDisc > 0 && (
                                <span className="line-through text-[9px] text-gray-400 ml-1">
                                  Rp {item.product.sell_price.toLocaleString('id-ID')}
                                </span>
                              )}
                            </span>
                            <span className="font-mono font-medium text-black">
                              Rp {item.subtotal.toLocaleString('id-ID')}
                            </span>
                          </div>
                          {(lineSavings > 0 || item.promoHint || item.manualDiscountReason) && (
                            <div className="text-[10px] text-emerald-700 font-semibold space-y-0.5">
                              {lineSavings > 0 && (
                                <div className="flex justify-between">
                                  <span>{item.promoName || item.buildingTierLabel || (item.manualDiscountReason ? 'Diskon Manual Item' : 'Promo Aktif')}</span>
                                  <span>Hemat Rp {lineSavings.toLocaleString('id-ID')}</span>
                                </div>
                              )}
                              {item.manualDiscountReason && (
                                <div className="text-[9px] text-amber-800 font-normal">
                                  Alasan: {item.manualDiscountReason}
                                  {item.manualDiscountAuthorizedBy ? ` (${item.manualDiscountAuthorizedBy})` : ''}
                                </div>
                              )}
                              {item.promoHint && (
                                <div className="text-[9px] text-gray-500 font-normal">
                                  {item.promoHint}
                                </div>
                              )}
                            </div>
                          )}
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
                  {(currentReceiptSale.promoSavingsTotal || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>
                        {currentReceiptSale.items?.some((it) => it.buildingTierSavings && it.buildingTierSavings > 0)
                          ? 'Total Hemat Tier / Promo'
                          : 'Total Hemat Promo'}
                      </span>
                      <span>-Rp {(currentReceiptSale.promoSavingsTotal || 0).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {(currentReceiptSale.cartVoucherDiscount || 0) > 0 && (
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-rose-600">
                        <span>Diskon Voucher / Kasir</span>
                        <span>-Rp {(currentReceiptSale.cartVoucherDiscount || 0).toLocaleString('id-ID')}</span>
                      </div>
                      {currentReceiptSale.manualDiscountReason && (
                        <div className="text-[9px] text-amber-800 font-normal">
                          Alasan: {currentReceiptSale.manualDiscountReason}
                          {currentReceiptSale.manualDiscountAuthorizedBy ? ` • ${currentReceiptSale.manualDiscountAuthorizedBy}` : ''}
                        </div>
                      )}
                    </div>
                  )}
                  {currentReceiptSale.discount > 0 && !(currentReceiptSale.promoSavingsTotal || 0) && !(currentReceiptSale.cartVoucherDiscount || 0) && (
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
                  {currentReceiptSale.discount > 0 && (
                    <div className="text-center text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded py-0.5 mt-1">
                      🎉 Anda Hemat Rp {currentReceiptSale.discount.toLocaleString('id-ID')} pada transaksi ini!
                    </div>
                  )}

                  {/* Rincian Akuntansi Logistik & Est. Laba Bersih Setelah Ongkir (Depo Bangunan) */}
                  {(currentReceiptSale.netProfitAfterShipping !== undefined ||
                    (currentReceiptSale.loadingFee || 0) > 0 ||
                    (currentReceiptSale.fleetDeliveryCost || 0) > 0) && (
                    <div className="mt-1.5 p-1.5 rounded bg-slate-100 border border-slate-300 text-[10px] space-y-0.5 font-mono text-slate-800">
                      <div className="font-bold text-slate-900 uppercase tracking-wider text-[9px] border-b border-slate-300 pb-0.5 mb-0.5">
                        Ringkasan Jurnal Logistik & Margin Depo
                      </div>
                      {currentReceiptSale.materialRevenue !== undefined && (
                        <div className="flex justify-between">
                          <span>Pendapatan Material (4-10001):</span>
                          <span className="font-semibold">Rp {currentReceiptSale.materialRevenue.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      {(currentReceiptSale.loadingFee || 0) > 0 && (
                        <div className="flex justify-between text-indigo-800">
                          <span>Jasa Bongkar Kuli (4-10102):</span>
                          <span className="font-semibold">+Rp {(currentReceiptSale.loadingFee || 0).toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      {(currentReceiptSale.fleetDeliveryCost || 0) > 0 && (
                        <div className="flex justify-between text-rose-700">
                          <span>Beban Armada Frangko (5-10205):</span>
                          <span className="font-semibold">-Rp {(currentReceiptSale.fleetDeliveryCost || 0).toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      {currentReceiptSale.netProfitAfterShipping !== undefined && (
                        <div className="flex justify-between text-emerald-800 font-bold border-t border-slate-300 pt-0.5">
                          <span>Est. Laba Bersih Stlh Ongkir:</span>
                          <span>Rp {currentReceiptSale.netProfitAfterShipping.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rincian Metode Bayar (Tunai, QRIS, Bank/EDC, Split, Kasbon/DP) */}
                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-gray-600">Metode Bayar:</span>
                    <span className={`font-bold flex items-center gap-1 ${payInfo.color}`}>
                      <payInfo.icon className="w-3.5 h-3.5 inline shrink-0" />
                      {payInfo.label}
                    </span>
                  </div>

                  {/* Rincian Split Payment (Tunai 1-10101 + Non-Tunai 1-10102) */}
                  {isSplitReceipt && (
                    <div className="mt-1 p-1.5 rounded bg-indigo-50 border border-indigo-200 text-[10px] space-y-0.5 text-slate-800">
                      <div className="font-bold text-indigo-900 uppercase tracking-wider text-[9px] border-b border-indigo-200 pb-0.5">
                        Rincian Split Payment (Lunas 100%)
                      </div>
                      <div className="flex justify-between">
                        <span>Tunai (Kas 1-10101):</span>
                        <span className="font-bold text-emerald-800">
                          Rp {splitCashAmt.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Non-Tunai ({splitNonCashChannel} • 1-10102):</span>
                        <span className="font-bold text-indigo-800">
                          Rp {splitNonCashAmt.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Rincian Kasbon / Piutang Pelanggan (Total Tagihan, DP Dibayar, Sisa Piutang 1-10105) */}
                  {isKasbonReceipt && (
                    <div className="mt-1 p-1.5 rounded bg-amber-50 border border-amber-300 text-[10px] space-y-0.5 text-slate-900">
                      <div className="flex justify-between items-center font-bold text-amber-900 uppercase tracking-wider text-[9px] border-b border-amber-300 pb-0.5">
                        <span>Rincian Kasbon / Piutang (1-10105)</span>
                        <span>Tempo +{kasbonTempoDays} Hr</span>
                      </div>
                      <div className="flex justify-between text-gray-800">
                        <span>Total Tagihan:</span>
                        <span className="font-bold">
                          Rp {currentReceiptSale.total_amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-800">
                        <span>DP Dibayar:</span>
                        <span className="font-bold">
                          Rp {kasbonDpPaid.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between text-rose-700 font-black border-t border-amber-300 pt-0.5 text-[11px]">
                        <span>Sisa Piutang:</span>
                        <span>Rp {kasbonRemainingAr.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-amber-900 pt-0.5">
                        <span>Jatuh Tempo:</span>
                        <span className="font-bold">{kasbonDueDateStr}</span>
                      </div>
                    </div>
                  )}

                  {isLaundryReceipt && !isKasbonReceipt && (
                    <div className="mt-1 p-1.5 rounded bg-slate-100 border border-slate-300 text-[10px] space-y-0.5">
                      <div className="flex justify-between font-bold">
                        <span>Status Pembayaran:</span>
                        <span
                          className={
                            laundryRemainingAmt > 0 ? 'text-rose-700' : 'text-emerald-700'
                          }
                        >
                          {laundryPayStatusLabel}
                        </span>
                      </div>
                      {laundryPaidAmt > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span>Dibayar Awal (DP/Tunai):</span>
                          <span className="font-bold">Rp {laundryPaidAmt.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      {laundryRemainingAmt > 0 && (
                        <div className="flex justify-between text-rose-700 font-black border-t border-slate-300 pt-0.5">
                          <span>SISA TAGIHAN AMBIL:</span>
                          <span>Rp {laundryRemainingAmt.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!isKasbonReceipt &&
                    !isSplitReceipt &&
                    currentReceiptSale.amount_paid !== undefined &&
                    currentReceiptSale.amount_paid > 0 && (
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

                {/* Tear-off Label Tag Kantong Cucian (Laundry) */}
                {isLaundryReceipt && (
                  <div className="mt-2 pt-2 border-t-2 border-dashed border-gray-600 text-[10px] space-y-1 bg-slate-50 p-2 rounded border border-gray-300">
                    <div className="text-center text-[9px] font-black uppercase tracking-widest text-gray-600 border-b border-dashed border-gray-400 pb-1">
                      ✂️ POTONG — TAG KANTONG CUCIAN
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-sm font-black text-black tracking-wider bg-white px-1.5 py-0.5 border border-black rounded">
                        {laundryTagCode}
                      </span>
                      <span className="font-bold text-black bg-cyan-100 px-1.5 py-0.5 rounded border border-cyan-400">
                        {laundryTotalPcs} PCS FISIK
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-600">Order:</span>
                      <span className="font-bold text-black">{trxIdentifier}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-600">Pelanggan:</span>
                      <span className="font-bold text-black truncate max-w-[175px]">
                        {currentReceiptSale.customer_name || 'Pelanggan Laundry'}
                        {currentReceiptSale.customer_phone ? ` (${currentReceiptSale.customer_phone})` : ''}
                      </span>
                    </div>
                    {laundryEstDoneDisplay && (
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-600">Est. Selesai:</span>
                        <span className="font-bold text-black">{laundryEstDoneDisplay}</span>
                      </div>
                    )}
                    {currentReceiptSale.laundryConditionNotes && currentReceiptSale.laundryConditionNotes !== '-' && (
                      <div className="text-[9px] bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-amber-950 font-semibold">
                        Catatan: {currentReceiptSale.laundryConditionNotes}
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-dotted border-gray-400 font-bold text-[10px]">
                      <span>{currentReceiptSale.laundryRackNumber ? `RAK: ${currentReceiptSale.laundryRackNumber}` : 'TAG KANTONG RESMI'}</span>
                      <span className={laundryRemainingAmt > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                        {laundryRemainingAmt > 0
                          ? `SISA Rp ${laundryRemainingAmt.toLocaleString('id-ID')}`
                          : 'LUNAS'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2 text-center text-[11px] text-gray-400">
                Mode aktif: <span className="text-blue-400 font-bold">{receiptWidth} Thermal Paper</span> • Sesuai standar printer ESC/POS
              </div>
            </div>

            {/* KOLOM KANAN: Panel Aksi & Driver ESC/POS */}
            <div className="w-full md:w-2/5 flex flex-col gap-3 justify-start shrink-0">
              {/* Bilah Direct WhatsApp Receipt */}
              <div className={`w-full rounded-xl p-3 space-y-2 border transition-colors ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
              }`}>
                <div className="flex items-center justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Direct WhatsApp Receipt</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono font-normal">wa.me resmi</span>
                </div>

                <div className="space-y-2">
                  <label htmlFor="input-customer-wa-receipt" className={`block text-[11px] font-normal ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
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
                      className={`w-full text-xs rounded-lg px-3 py-2 outline-none font-mono tracking-wide placeholder:italic border transition-colors ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-800 focus:border-emerald-500'
                          : 'bg-[#161b22] border-[#30363d] text-white focus:border-emerald-500 placeholder:text-gray-500'
                      }`}
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
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.25)] transition cursor-pointer text-xs active:scale-[0.99]"
                    title="Kirim rincian nota transaksi via WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span>Kirim Struk ke WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Tumpukan Tombol Aksi Kasir Termasuk ESC/POS Raw Driver */}
              <div className="w-full flex flex-col gap-2.5 pt-1">
                {/* Tombol Cetak Surat Jalan / DO jika pengiriman armada aktif */}
                {(currentReceiptSale.deliveryFleetActive || currentReceiptSale.items?.some(i => i.product.businessModel === 'building')) && (
                  <button
                    onClick={() => {
                      showToast('Mencetak Surat Jalan / Delivery Order resmi pengiriman armada...');
                      window.print();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl shadow-md transition cursor-pointer text-sm active:scale-[0.99]"
                    title="Cetak Surat Jalan / Delivery Order (DO)"
                  >
                    <span>🚚 Cetak Surat Jalan / DO</span>
                  </button>
                )}

                {/* Tombol Utama 1: Cetak Struk Hardware */}
                <button
                  id="btn-print-receipt"
                  onClick={handlePrint}
                  className={`w-full flex items-center justify-center gap-2.5 text-white font-medium py-3.5 px-4 rounded-xl shadow-[0_0_15px_rgba(0,82,255,0.4)] transition cursor-pointer text-base active:scale-[0.99] border ${
                    isVoided 
                      ? 'bg-rose-600 hover:bg-rose-700 border-rose-400/40' 
                      : 'bg-[#0052FF] hover:bg-[#0043d1] border-blue-400/40'
                  }`}
                  title={isVoided ? "Cetak Bukti Pembatalan (Void)" : "Cetak Struk Kasir [Enter / F12]"}
                >
                  <Printer className="w-5 h-5 shrink-0" />
                  <span>{isVoided ? 'Cetak Bukti Pembatalan (Void)' : 'Cetak Struk [Enter / F12]'}</span>
                </button>

                {/* Tombol Void Transaksi (Hanya jika belum void) */}
                {!isVoided && (
                  <button
                    onClick={() => {
                      setVoidPinInput('');
                      setVoidError(null);
                      setShowVoidPinAuth(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30 font-medium py-3 px-4 rounded-xl transition cursor-pointer text-sm active:scale-[0.99]"
                    title="Batalkan transaksi ini dan kembalikan stok"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>✕ Batal Transaksi Ini (Void)</span>
                  </button>
                )}

                {/* Tombol Utama 2: Tutup / Transaksi Baru [Esc] */}
                <button
                  onClick={closeReceipt}
                  className={`w-full flex items-center justify-center gap-2 font-medium py-3 px-4 rounded-xl border transition cursor-pointer text-sm active:scale-[0.99] ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-gray-300 hover:text-white border-slate-700'
                  }`}
                  title="Tutup modal struk dan kembali ke register transaksi baru [Esc]"
                >
                  <X className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>✕ Transaksi Baru [Esc]</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Simulasi Driver ESC/POS Thermal Raw Payload */}
      {showEscPosModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#0d1117] border border-cyan-500/35 rounded-2xl p-5 shadow-[0_0_24px_rgba(6,182,212,0.12)] relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d] mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-white flex items-center gap-2">
                    <span>Simulasi Driver Hardware (ESC/POS Raw)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-normal bg-cyan-900/60 text-cyan-300 border border-cyan-700">
                      Thermal {receiptWidth}
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-400 font-normal">
                    Protokol byte printer thermal Epson/Star kompatibel RawBT, USB Pos, Serial & Bluetooth
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEscPosModal(false)}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition active:scale-[0.99]"
                title="Tutup simulator"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Informasi Driver */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-[11px]">
              <div className="bg-[#161b22] border border-[#30363d] p-2 rounded-lg">
                <div className="text-gray-400 text-[10px] font-normal">Lebar Karakter:</div>
                <div className="font-semibold text-white font-mono">
                  {receiptWidth === '58mm' ? '32 Kolom (58mm)' : '48 Kolom (80mm)'}
                </div>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] p-2 rounded-lg">
                <div className="text-gray-400 text-[10px] font-normal">Metode Bayar:</div>
                <div className="font-semibold text-white truncate">{payInfo.label}</div>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] p-2 rounded-lg">
                <div className="text-gray-400 text-[10px] font-normal">PPN Terkalkulasi:</div>
                <div className="font-semibold text-white font-mono">
                  {hasTax ? `Rp ${calculatedTax.toLocaleString('id-ID')}` : 'Rp 0'}
                </div>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] p-2 rounded-lg">
                <div className="text-gray-400 text-[10px] font-normal">Petugas Kasir:</div>
                <div className="font-semibold text-white truncate">{cashierDisplayName}</div>
              </div>
            </div>

            {/* Payload Preview */}
            <div className="flex-1 min-h-[220px] bg-[#05070a] border border-[#30363d] rounded-xl p-3 font-mono text-xs text-emerald-400 overflow-y-auto whitespace-pre-wrap select-all leading-relaxed shadow-inner font-normal">
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
              <div className="text-[11px] text-gray-400 flex items-center gap-1.5 font-normal">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Format stream siap dikirim via Web Serial API / Bluetooth Thermal</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyEscPos}
                  className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-medium py-2 px-3.5 rounded-xl border border-[#30363d] transition cursor-pointer active:scale-[0.99]"
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
                  className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium py-2 px-4 rounded-xl shadow-md transition cursor-pointer active:scale-[0.99]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Kirim ke Driver (Simulasi Sukses)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Supervisor PIN Authorization Modal for Void */}
      {showVoidPinAuth && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#161b22] border border-rose-500/40 rounded-2xl shadow-[0_0_24px_rgba(244,63,94,0.15)] p-6 text-white text-center space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-500">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-medium text-base uppercase tracking-wider">Otorisasi Void</h3>
              </div>
              <button onClick={() => setShowVoidPinAuth(false)} className="text-gray-500 hover:text-white p-1 rounded-lg active:scale-[0.99]"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-normal">Masukkan PIN Supervisor (1234 / 8888) untuk membatalkan transaksi ini.</p>
              
              <div className="flex justify-center gap-4 py-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${idx < voidPinInput.length ? 'bg-rose-500 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] scale-110' : 'bg-transparent border-[#30363d]'}`} />
                ))}
              </div>

              {voidError && <div className="text-[10px] font-medium text-rose-500 animate-bounce">{voidError}</div>}
            </div>

            <div className="space-y-4">
              <div className="text-left">
                <label className="text-[10px] font-normal text-gray-400 uppercase tracking-wider ml-1">Alasan Pembatalan:</label>
                <select 
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-rose-500 transition font-normal"
                >
                  <option value="Pelanggan Batal Beli">Pelanggan Batal Beli</option>
                  <option value="Salah Scan / Input">Salah Scan / Input</option>
                  <option value="Ganti Metode Bayar">Ganti Metode Bayar</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === 'C') setVoidPinInput('');
                      else if (key === '⌫') setVoidPinInput(p => p.slice(0, -1));
                      else if (voidPinInput.length < 4) {
                        const next = voidPinInput + key;
                        setVoidPinInput(next);
                        if (next.length === 4) {
                          if (next === '1234' || next === '8888') {
                            voidTransaction(trxIdentifier, voidReason);
                            setShowVoidPinAuth(false);
                            showToast('Transaksi berhasil dibatalkan (VOID)');
                          } else {
                            setVoidError('PIN Supervisor tidak valid');
                            setTimeout(() => {
                              setVoidPinInput('');
                              setVoidError(null);
                            }, 800);
                          }
                        }
                      }
                    }}
                    className={`h-12 rounded-xl font-mono font-normal flex items-center justify-center transition active:scale-[0.99] ${
                      key === 'C' || key === '⌫' 
                        ? 'bg-[#21262d] text-gray-400 text-xs' 
                        : 'bg-[#30363d] text-white hover:bg-[#3b424a]'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

