import React, { useState, useMemo } from 'react';
import { X, Trash2, Plus, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface JournalLine {
  id: number;
  coa: string;
  memo: string;
  debit: number;
  credit: number;
}

interface JournalVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  isLight?: boolean;
  initialData?: any;
}

export const JournalVoucherModal: React.FC<JournalVoucherModalProps> = ({ isOpen, onClose, onSave, isLight: isLightProp, initialData }) => {
  const { language, theme, businessDomainConfig } = useApp();
  const isEn = language === 'en';
  const isLight = isLightProp ?? (theme === 'light');

  const isBuildingBulk = businessDomainConfig?.mechanismFamily === 'BUILDING_BULK';
  const isFnbCulinary = businessDomainConfig?.mechanismFamily === 'FNB_CULINARY';
  const isHybridMode = Boolean(businessDomainConfig?.isHybridMultiUnit);
  const isBuildingIsolated = isBuildingBulk && !isHybridMode;
  const isFnbIsolated = isFnbCulinary && !isHybridMode;

  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().slice(0, 10),
    reference: initialData?.reference || `JV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
    type: initialData?.type || 'Adjustment',
    sector: initialData?.sector || (isBuildingIsolated ? 'Bangunan' : isFnbIsolated ? 'Resto' : 'Retail'),
    terminal: initialData?.terminal || (isBuildingIsolated ? 'Terminal Kasir Depo Bangunan' : isFnbIsolated ? 'KASIR-02' : 'Semua Terminal'),
    branch: initialData?.branch || (isBuildingIsolated ? 'Depo Utama' : isFnbIsolated ? 'Dapur & Resto Utama' : 'Pusat'),
    memo: initialData?.memo || '',
  });

  React.useEffect(() => {
    if (isBuildingIsolated) {
      setFormData((prev) => ({
        ...prev,
        sector: 'Bangunan',
        terminal:
          prev.terminal === 'Terminal Kasir Depo Bangunan' || prev.terminal === 'KASIR-DEPO-01'
            ? prev.terminal
            : 'Terminal Kasir Depo Bangunan',
        branch: ['Depo Utama', 'Kasir Depo', 'Gudang Curah & Armada'].includes(prev.branch)
          ? prev.branch
          : 'Depo Utama',
      }));
    } else if (isFnbIsolated) {
      setFormData((prev) => ({
        ...prev,
        sector: prev.sector === 'Resto' || prev.sector === 'Kafe' ? prev.sector : 'Resto',
        terminal: prev.terminal === 'KASIR-02' || prev.terminal === 'Semua Terminal' ? prev.terminal : 'KASIR-02',
        branch: ['Dapur & Resto Utama', 'Barista Corner', 'Gudang Bahan Baku Dapur'].includes(prev.branch)
          ? prev.branch
          : 'Dapur & Resto Utama',
      }));
    }
  }, [isBuildingIsolated, isFnbIsolated]);

  const [lines, setLines] = useState<JournalLine[]>(
    initialData?.lines || [
      { id: 1, coa: '', memo: '', debit: 0, credit: 0 },
      { id: 2, coa: '', memo: '', debit: 0, credit: 0 }
    ]
  );

  const t = {
    title: isEn ? "General Journal & Adjustment Voucher" : "Voucher Jurnal Umum & Penyesuaian",
    badge: "ENTERPRISE DOUBLE-ENTRY AUDIT",
    labelDate: isEn ? "Transaction Date" : "Tanggal Transaksi",
    labelRef: isEn ? "Voucher Number / Ref" : "Nomor Voucher / Ref",
    labelType: isEn ? "Journal Type" : "Jenis Jurnal",
    labelBranch: isEn ? "Branch / Cost Center" : "Cabang / Pusat Biaya",
    labelMemo: isEn ? "Main Description / Audit Memo" : "Keterangan Utama / Memo Audit",
    placeholderMemo: isEn ? "Global description for adjustment journal..." : "Deskripsi global jurnal penyesuaian...",
    colNo: "No",
    colCoa: isEn ? "Account COA (Chart of Accounts)" : "Akun COA (Chart of Accounts)",
    colLineMemo: isEn ? "Line Description" : "Keterangan Baris",
    colDebit: "Debit (Rp)",
    colCredit: "Kredit (Rp)",
    colAction: isEn ? "Action" : "Aksi",
    btnAddLine: isEn ? "Tambah Baris Transaksi" : "Tambah Baris Transaksi",
    totalDebit: "Total Debit",
    totalCredit: "Total Kredit",
    diff: isEn ? "Imbalance" : "Selisih (Imbalance)",
    statusBalanced: isEn ? "Balanced (Rp 0) - Ready to Post" : "Seimbang (Rp 0) - Siap Posting",
    statusUnbalanced: isEn ? "Unbalanced" : "Belum Seimbang",
    btnCancel: isEn ? "Batal / Tutup" : "Batal / Tutup",
    btnSave: isEn ? "Simpan & Posting ke Buku Besar" : "Simpan & Posting ke Buku Besar",
    placeholderLine: isEn ? "Line notes..." : "Catatan baris...",
    selectAccount: isEn ? "Select COA Account..." : "Pilih Akun COA...",
  };

  // Hidden COA codes when BUILDING_BULK is active and Hybrid Mode is OFF
  const BUILDING_ISOLATED_HIDDEN_COA_CODES = new Set([
    '1-10502',
    '2-10201',
    '2-10301',
    '5-10101',
    '5-10005',
    '5-10201',
  ]);

  // Hidden COA codes when FNB_CULINARY is active and Hybrid Mode is OFF
  const FNB_ISOLATED_HIDDEN_COA_CODES = new Set([
    '1-10501',
    '2-10301',
    '2-10401',
    '4-10102',
    '4-10003',
    '4-10004',
    '5-10005',
    '5-10201',
    '5-10205',
    '5-10302',
  ]);

  const allCoaOptions = useMemo(() => [
    { code: '1-10000', name: isEn ? 'Main Vault / Safe' : 'Kas Utama / Brankas' },
    { code: '1-10001', name: isEn ? 'Cashier Drawer / POS' : 'Kas Kasir / Laci POS' },
    { code: '1-10002', name: isEn ? 'Operational Bank' : 'Bank Operasional' },
    { code: '1-10003', name: isEn ? 'Bank QRIS & Settlement' : 'Bank QRIS & Settlement EDC' },
    { code: '1-10301', name: isEn ? 'Accounts Receivable (AR)' : 'Piutang Usaha (AR)' },
    { code: '1-10305', name: isEn ? 'Supplier Rebate Receivable (AP Rebate)' : 'Piutang Rebate Supplier (AP Rebate Claimable)' },
    { code: '1-10501', name: isEn ? 'Inventory Merchandise / Building Material' : (isBuildingBulk ? 'Persediaan Barang Dagang & Material Bangunan' : 'Persediaan Barang Dagang Retail') },
    { code: '1-10502', name: isEn ? 'Inventory F&B Ingredients' : 'Persediaan Bahan Baku Dapur F&B' },
    { code: '2-10001', name: isEn ? 'Accounts Payable (AP)' : 'Hutang Usaha (AP)' },
    { code: '2-10201', name: isEn ? 'F&B Service Charge Deposit' : 'Titipan Service Charge F&B' },
    { code: '2-10301', name: isEn ? 'Warranty Claim Reserve' : 'Cadangan Klaim Garansi Elektronik/Servis' },
    { code: '2-10401', name: isEn ? 'Contractor Project Down Payment (DP)' : 'Uang Muka (DP) Proyek Kontraktor' },
    { code: '4-10001', name: isEn ? 'Sales Revenue' : (isBuildingBulk ? 'Pendapatan Penjualan Material Bangunan' : isFnbCulinary ? 'Pendapatan Penjualan Resto & Kafe' : 'Pendapatan Penjualan Retail & F&B') },
    { code: '4-10102', name: isEn ? 'Loading/Unloading Labor Service Revenue' : 'Pendapatan / Titipan Jasa Bongkar Kuli' },
    { code: '4-10003', name: isEn ? 'Service Fee Revenue' : 'Pendapatan Biaya Jasa / Ongkos Pasang' },
    { code: '4-10004', name: isEn ? 'Fashion / Wholesale Sales Discount' : (isBuildingBulk ? 'Diskon Penjualan Partai / Kontraktor' : 'Potongan & Diskon Penjualan Fashion / Grosir') },
    { code: '5-10001', name: isEn ? 'Cost of Goods Sold (COGS)' : 'Beban Pokok Penjualan (HPP)' },
    { code: '5-10101', name: isEn ? 'F&B Kitchen COGS' : 'Beban Bahan Pokok F&B (Kitchen COGS)' },
    { code: '5-10003', name: isEn ? 'Stock Opname Variance' : 'Beban Selisih Stok Opname' },
    { code: '5-10004', name: isEn ? 'Cash Shortage/MDR Expense' : 'Beban Selisih Kas Kasir & MDR QRIS' },
    { code: '5-10005', name: isEn ? 'Expired/Write-Off Expense' : 'Beban Kadaluarsa / Write-Off Apotek & Retail' },
    { code: '5-10201', name: isEn ? 'FEFO Clearance Expense' : 'Beban Clearance & Penyelamatan Kadaluarsa (FEFO)' },
    { code: '5-10202', name: isEn ? 'Store Promotion & Sales Discount' : 'Beban Promosi & Diskon Penjualan Toko' },
    { code: '5-10205', name: isEn ? 'Frangko Fleet Delivery Expense' : 'Beban Pengiriman Armada Frangko' },
    { code: '5-10302', name: isEn ? 'Bulk Material Shrinkage / Variance Expense' : 'Beban Selisih / Susut Material Curah' },
  ], [isEn, isBuildingBulk, isFnbCulinary]);

  const coaOptions = useMemo(() => {
    if (isBuildingIsolated) {
      return allCoaOptions.filter((opt) => !BUILDING_ISOLATED_HIDDEN_COA_CODES.has(opt.code));
    }
    if (isFnbIsolated) {
      return allCoaOptions.filter((opt) => !FNB_ISOLATED_HIDDEN_COA_CODES.has(opt.code));
    }
    return allCoaOptions;
  }, [allCoaOptions, isBuildingIsolated, isFnbIsolated]);

  const totals = useMemo(() => {
    return lines.reduce((acc, line) => {
      acc.debit += Number(line.debit) || 0;
      acc.credit += Number(line.credit) || 0;
      return acc;
    }, { debit: 0, credit: 0 });
  }, [lines]);

  const diff = Math.abs(totals.debit - totals.credit);
  const isBalanced = totals.debit === totals.credit && totals.debit > 0;

  const handleAddLine = () => setLines([...lines, { id: Date.now(), coa: '', memo: '', debit: 0, credit: 0 }]);
  const handleRemoveLine = (id: number) => {
    if (lines.length > 2) {
      setLines(lines.filter(l => l.id !== id));
    }
  };
  const handleUpdateLine = (id: number, field: keyof JournalLine, value: any) => {
    setLines(lines.map(l => {
      if (l.id === id) {
        return { ...l, [field]: value };
      }
      return l;
    }));
  };

  const handleSave = () => {
    if (!isBalanced) return;
    onSave({
      ...formData,
      lines: lines.map(l => ({
        coa: l.coa,
        accountCode: l.coa,
        accountName: allCoaOptions.find(o => o.code === l.coa)?.name || '',
        memo: l.memo,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0
      }))
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 md:p-8 backdrop-blur-sm">
      <div className={`w-full max-w-6xl max-h-[92vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden transition-all duration-200 ${
        isLight
          ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-900'
          : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-white'
      }`}>
        {/* Header Section */}
        <div className={`p-5 sm:p-6 border-b transition-colors ${
          isLight
            ? 'border-slate-200 bg-slate-50'
            : 'border-slate-800 bg-slate-950'
        } flex justify-between items-start gap-4`}>
          <div className="flex-1">
            <h2 className="text-base leading-6 font-medium flex items-center gap-3">
              {t.title}
              <span className="px-2 py-0.5 rounded-md text-[11px] leading-4 font-mono font-normal tracking-widest bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <ShieldCheck size={12}/> {t.badge}
              </span>
            </h2>
            
            {/* Document Controls Grid - 6 Columns */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
              <div className="space-y-1">
                <label className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 uppercase block">Tanggal</label>
                <input 
                  type="date" 
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})} 
                  className={`w-full rounded-xl px-3 py-2 text-xs leading-5 font-normal border transition focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
                  }`} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 uppercase block">No. Voucher</label>
                <input 
                  type="text" 
                  value={formData.reference} 
                  readOnly 
                  className={`w-full rounded-xl px-3 py-2 text-xs leading-5 font-mono font-normal text-cyan-600 dark:text-cyan-400 border cursor-not-allowed ${
                    isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-800/60 border-slate-700'
                  }`} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 uppercase block">Sektor/Model</label>
                <select 
                  value={formData.sector} 
                  onChange={e => setFormData({...formData, sector: e.target.value})} 
                  className={`w-full rounded-xl px-3 py-2 text-xs leading-5 font-normal border transition focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
                  }`}
                >
                  {isBuildingIsolated ? (
                    <option value="Bangunan">Bahan Bangunan &amp; Material Curah</option>
                  ) : isFnbIsolated ? (
                    <>
                      <option value="Resto">F&amp;B Resto</option>
                      <option value="Kafe">F&amp;B Kafe &amp; Bakery</option>
                    </>
                  ) : (
                    <>
                      <option value="Retail">Retail Modern</option>
                      <option value="Wholesale">Grosir/Wholesale</option>
                      <option value="Resto">F&amp;B Resto</option>
                      <option value="Kafe">F&amp;B Kafe</option>
                      <option value="Jasa">Jasa/Reparasi</option>
                      <option value="Farmasi">Apotek/Farmasi</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Bangunan">Bahan Bangunan</option>
                      <option value="Gadget">Elektronik/Gadget</option>
                    </>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 uppercase block">Terminal</label>
                <select 
                  value={formData.terminal}
                  onChange={e => setFormData({...formData, terminal: e.target.value})}
                  className={`w-full rounded-xl px-3 py-2 text-xs leading-5 font-normal border transition focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
                  }`}
                >
                  {isBuildingIsolated ? (
                    <>
                      <option value="Terminal Kasir Depo Bangunan">Terminal Kasir Depo Bangunan</option>
                      <option value="KASIR-DEPO-01">KASIR-DEPO-01 (Depo Material &amp; Kontraktor)</option>
                    </>
                  ) : isFnbIsolated ? (
                    <>
                      <option value="KASIR-02">KASIR-02 (POS Resto, Kafe &amp; Bakery)</option>
                      <option value="Semua Terminal">Semua Terminal F&amp;B</option>
                    </>
                  ) : (
                    <>
                      <option value="Semua Terminal">Semua Terminal</option>
                      {[...Array(8)].map((_,i) => <option key={i} value={`KASIR-0${i+1}`}>KASIR-0{i+1}</option>)}
                    </>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 uppercase block">Jenis Jurnal</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})} 
                  className={`w-full rounded-xl px-3 py-2 text-xs leading-5 font-normal border transition focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
                  }`}
                >
                  <option value="Adjustment">Penyesuaian</option>
                  <option value="StockCorrection">Koreksi Selisih Stok</option>
                  <option value="Reclassification">Reklasifikasi Beban</option>
                  <option value="Reversal">Jurnal Pembalik</option>
                  <option value="Capital">Setoran/Tarik Modal</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 uppercase block">Pusat Biaya</label>
                <select 
                  value={formData.branch} 
                  onChange={e => setFormData({...formData, branch: e.target.value})} 
                  className={`w-full rounded-xl px-3 py-2 text-xs leading-5 font-normal border transition focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
                  }`}
                >
                  {isBuildingIsolated ? (
                    <>
                      <option value="Depo Utama">Depo Utama</option>
                      <option value="Kasir Depo">Kasir Depo</option>
                      <option value="Gudang Curah & Armada">Gudang Curah &amp; Armada</option>
                    </>
                  ) : isFnbIsolated ? (
                    <>
                      <option value="Dapur & Resto Utama">Dapur &amp; Resto Utama</option>
                      <option value="Barista Corner">Barista Corner</option>
                      <option value="Gudang Bahan Baku Dapur">Gudang Bahan Baku Dapur</option>
                    </>
                  ) : (
                    <>
                      <option value="Pusat">Pusat / Toko Utama</option>
                      <option value="POS-01">POS-01</option>
                      <option value="Gudang">Gudang Retail</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preset Buttons */}
        <div className={`p-3 px-5 border-b flex flex-wrap gap-2 items-center ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-400 uppercase mr-1">
            Preset Cepat:
          </span>
          {isBuildingBulk ? (
            <>
              <button 
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    type: 'StockCorrection',
                    branch: 'Gudang Curah & Armada',
                    memo: 'Penyesuaian Susut Kubikasi Material Curah (Pasir / Batu Split)',
                  }));
                  setLines([
                    { id: 1, coa: '5-10302', memo: 'Susut Material Curah (Pasir / Batu Split)', debit: 150000, credit: 0 },
                    { id: 2, coa: '1-10501', memo: 'Penyesuaian Persediaan Material Curah', debit: 0, credit: 150000 },
                  ]);
                }} 
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs leading-5 font-normal px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all duration-200 cursor-pointer active:scale-[0.99]"
              >
                ⚡ Preset Depo: Susut Material Curah
              </button>
              <button 
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    type: 'Adjustment',
                    branch: 'Gudang Curah & Armada',
                    memo: 'Beban Pengiriman Armada Frangko & Operasional Bongkar',
                  }));
                  setLines([
                    { id: 1, coa: '5-10205', memo: 'Beban Pengiriman Armada Frangko & Bongkar', debit: 175000, credit: 0 },
                    { id: 2, coa: '1-10001', memo: 'Kas Kasir Depo untuk Ritase Armada', debit: 0, credit: 175000 },
                  ]);
                }} 
                className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs leading-5 font-normal px-2.5 py-1 rounded-lg border border-orange-500/30 transition-all duration-200 cursor-pointer active:scale-[0.99]"
              >
                ⚡ Preset Depo: Beban Armada &amp; Bongkar
              </button>
            </>
          ) : (
            <button 
              type="button"
              onClick={() => setLines([{id:1, coa:'5-10001', memo:'Waste F&B', debit:100000, credit:0}, {id:2, coa:'1-10501', memo:'Waste F&B', debit:0, credit:100000}])} 
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs leading-5 font-normal px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all duration-200 cursor-pointer active:scale-[0.99]"
            >
              ⚡ Preset F&amp;B: Waste
            </button>
          )}
          <button 
            type="button"
            onClick={() => setLines([{id:1, coa:'5-10004', memo:'Selisih Kas', debit:50000, credit:0}, {id:2, coa:'1-10001', memo:'Selisih Kas', debit:0, credit:50000}])} 
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs leading-5 font-normal px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all duration-200 cursor-pointer active:scale-[0.99]"
          >
            ⚡ Preset POS: Selisih Kasir
          </button>
          <button 
            type="button"
            onClick={() => setLines([{id:1, coa:'1-10002', memo:'QRIS Sett', debit:95000, credit:0}, {id:2, coa:'5-10004', memo:'MDR', debit:5000, credit:0}, {id:3, coa:'1-10001', memo:'Settlement', debit:0, credit:100000}])} 
            className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs leading-5 font-normal px-2.5 py-1 rounded-lg border border-cyan-500/30 transition-all duration-200 cursor-pointer active:scale-[0.99]"
          >
            ⚡ Preset Settlement QRIS
          </button>
        </div>

        {/* Dynamic Lines Table */}
        <div className="flex-1 overflow-y-auto p-0 border-b border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs leading-5 border-collapse">
            <thead className={`text-[11px] leading-4 font-mono font-normal tracking-widest uppercase sticky top-0 z-10 border-b ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              <tr>
                <th className="py-2.5 px-3.5 w-12 text-center">{t.colNo}</th>
                <th className="py-2.5 px-3.5 text-left">{t.colCoa}</th>
                <th className="py-2.5 px-3.5 text-left">{t.colLineMemo}</th>
                <th className="py-2.5 px-3.5 w-44 text-right">{t.colDebit}</th>
                <th className="py-2.5 px-3.5 w-44 text-right">{t.colCredit}</th>
                <th className="py-2.5 px-3.5 w-16 text-center">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-normal">
              {lines.map((line, index) => (
                <tr key={line.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3.5 text-center text-slate-500 font-mono text-xs">{index + 1}</td>
                  <td className="py-2 px-3.5">
                    <select 
                      value={line.coa} 
                      onChange={e => handleUpdateLine(line.id, 'coa', e.target.value)} 
                      className={`w-full rounded-lg px-2.5 py-1.5 text-xs leading-5 font-normal border transition focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
                      }`}
                    >
                      <option value="">{t.selectAccount}</option>
                      {coaOptions.map(o => <option key={o.code} value={o.code}>{o.code} - {o.name}</option>)}
                    </select>
                  </td>
                  <td className="py-2 px-3.5">
                    <input 
                      type="text" 
                      placeholder={t.placeholderLine} 
                      value={line.memo} 
                      onChange={e => handleUpdateLine(line.id, 'memo', e.target.value)} 
                      className={`w-full rounded-lg px-2.5 py-1.5 text-xs leading-5 font-normal border transition focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                        isLight 
                          ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400/80 placeholder:italic' 
                          : 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 placeholder:italic'
                      }`} 
                    />
                  </td>
                  <td className="py-2 px-3.5">
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={line.debit || ''} 
                      onChange={e => handleUpdateLine(line.id, 'debit', Number(e.target.value))} 
                      className={`w-full rounded-lg px-2.5 py-1.5 text-xs leading-5 text-right font-mono font-semibold border transition focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        isLight 
                          ? 'bg-white border-emerald-500/40 text-emerald-700' 
                          : 'bg-slate-800 border-emerald-500/30 text-emerald-400'
                      }`} 
                    />
                  </td>
                  <td className="py-2 px-3.5">
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={line.credit || ''} 
                      onChange={e => handleUpdateLine(line.id, 'credit', Number(e.target.value))} 
                      className={`w-full rounded-lg px-2.5 py-1.5 text-xs leading-5 text-right font-mono font-semibold border transition focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                        isLight 
                          ? 'bg-white border-cyan-500/40 text-cyan-700' 
                          : 'bg-slate-800 border-cyan-500/30 text-cyan-400'
                      }`} 
                    />
                  </td>
                  <td className="py-2 px-3.5 text-center">
                    <button 
                      onClick={() => handleRemoveLine(line.id)} 
                      disabled={lines.length <= 2}
                      className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 size={15}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={`p-3.5 ${isLight ? 'bg-slate-50' : 'bg-slate-900/30'}`}>
            <button 
              type="button"
              onClick={handleAddLine} 
              className={`px-3.5 py-1.5 rounded-lg text-xs leading-5 font-normal flex items-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.99] border ${
                isLight 
                  ? 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-100 text-slate-700' 
                  : 'border-slate-700 hover:border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Plus size={14}/> {t.btnAddLine}
            </button>
          </div>
        </div>

        {/* Footer Audit Balance Section */}
        <div className={`p-4 sm:p-5 border-t flex flex-col md:flex-row justify-between items-center gap-4 transition-colors ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="grid grid-cols-3 gap-6 sm:gap-8 w-full md:w-auto">
            <div className="space-y-1">
              <span className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 uppercase block">{t.totalDebit}</span>
              <span className="text-lg leading-7 font-mono font-semibold text-emerald-600 dark:text-emerald-400">Rp {totals.debit.toLocaleString('id-ID')}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 uppercase block">{t.totalCredit}</span>
              <span className="text-lg leading-7 font-mono font-semibold text-cyan-600 dark:text-cyan-400">Rp {totals.credit.toLocaleString('id-ID')}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 uppercase block">{t.diff}</span>
              <span className={`text-lg leading-7 font-mono font-semibold ${diff === 0 ? 'text-slate-500' : 'text-rose-600 dark:text-rose-400'}`}>
                Rp {diff.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
            <div>
              {isBalanced ? 
                <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs leading-5 font-normal flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 size={14}/> {t.statusBalanced}
                </span> :
                <span className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg text-xs leading-5 font-normal flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.1)] animate-pulse">
                  <AlertCircle size={14}/> {t.statusUnbalanced} ({isEn ? 'Diff' : 'Selisih'}: Rp {diff.toLocaleString()})
                </span>
              }
            </div>
            <div className="h-8 w-px bg-slate-300 dark:bg-slate-800 mx-1 hidden md:block"></div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button 
                type="button"
                onClick={onClose} 
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs leading-5 font-normal transition-all duration-200 cursor-pointer active:scale-[0.99] border ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {t.btnCancel}
              </button>
              <button 
                type="button"
                disabled={!isBalanced} 
                onClick={handleSave} 
                className="flex-1 sm:flex-none px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed text-white rounded-xl text-xs leading-5 font-medium transition-all duration-200 cursor-pointer active:scale-[0.99] shadow-md shadow-cyan-600/20"
              >
                {t.btnSave}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
