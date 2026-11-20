import React, { useState } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Wallet, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CashEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashEntryModal: React.FC<CashEntryModalProps> = ({ isOpen, onClose }) => {
  const { addFinanceEntry, language, theme } = useApp();
  const isEn = language === 'en';
  const isLight = theme === 'light';

  const [formData, setFormData] = useState({
    type: 'EXPENSE', // Default to Out (Petty Cash/Expense)
    account_target: '1-10001', // Default to Kas Kasir
    coa_opposite: '5-10004', // Default to Beban Operasional
    amount: 0,
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const t = {
    title: isEn ? "Cash Transaction Entry" : "Pencatatan Transaksi Kas",
    type: isEn ? "Transaction Type" : "Tipe Transaksi",
    cashIn: isEn ? "Cash In (Income)" : "Kas Masuk (Penerimaan)",
    cashOut: isEn ? "Cash Out (Petty Cash)" : "Kas Keluar (Biaya)",
    account: isEn ? "Source/Target Account" : "Akun Kas/Bank",
    opposite: isEn ? "Opposite Account / Category" : "Akun Lawan / Kategori",
    amount: isEn ? "Amount (Rp)" : "Nominal (Rp)",
    memo: isEn ? "Notes / Description" : "Catatan / Keterangan",
    btnSave: isEn ? "Save Cash Transaction" : "Simpan Transaksi Kas",
    btnCancel: isEn ? "Cancel" : "Batal",
  };

  const cashAccounts = [
    { code: '1-10000', name: isEn ? 'Main Vault / Safe' : 'Kas Utama / Brankas' },
    { code: '1-10001', name: isEn ? 'Cashier Drawer' : 'Kas Kasir / Laci POS' },
    { code: '1-10002', name: isEn ? 'Operational Bank' : 'Bank Operasional' },
  ];

  const oppositeAccounts = [
    { code: '5-10004', name: isEn ? 'Operational Expense' : 'Beban Operasional' },
    { code: '5-10002', name: isEn ? 'Cashier Variance' : 'Biaya Selisih Kasir' },
    { code: '4-10000', name: isEn ? 'Other Income' : 'Pendapatan Lain-lain' },
    { code: '3-10001', name: isEn ? 'Paid-in Capital' : 'Modal Disetor / Prive' },
    { code: '5-10101', name: isEn ? 'Electricity & Water' : 'Biaya Listrik & Air' },
  ];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return;

    const refPrefix = formData.type === 'INCOME' ? 'CSH-IN' : 'CSH-OUT';
    const reference = `${refPrefix}-${Date.now().toString().slice(-4)}`;

    addFinanceEntry({
      date: formData.date,
      type: formData.type as any,
      category: oppositeAccounts.find(a => a.code === formData.coa_opposite)?.name || 'General',
      description: formData.description,
      amount: formData.amount,
      reference: reference,
      payment_method: formData.account_target === '1-10002' ? 'TRANSFER' : 'CASH',
      account_target: `${formData.account_target} - ${cashAccounts.find(a => a.code === formData.account_target)?.name}`,
      created_at: new Date().toISOString(),
    });

    onClose();
  };

  const isIncome = formData.type === 'INCOME';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className={`border rounded-xl p-5 sm:p-6 w-full max-w-lg shadow-2xl transition-all duration-200 animate-in zoom-in-95 ${
        isLight
          ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-900'
          : 'bg-slate-900 border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-white'
      }`}>
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
              isIncome 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            }`}>
              <Wallet size={18} />
            </div>
            <div>
              <h3 className="text-base leading-6 font-medium tracking-tight">{t.title}</h3>
              <p className="text-xs leading-4 text-slate-500 dark:text-slate-400 font-normal">
                {isIncome ? 'Penerimaan dana kas masuk' : 'Pengeluaran kas kecil & beban'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type Switcher */}
          <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'INCOME' })}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs leading-5 font-normal transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                formData.type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <ArrowUpRight size={15} />
              {t.cashIn}
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs leading-5 font-normal transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                formData.type === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <ArrowDownRight size={15} />
              {t.cashOut}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 uppercase block">
                {t.account}
              </label>
              <select
                value={formData.account_target}
                onChange={(e) => setFormData({ ...formData, account_target: e.target.value })}
                className={`w-full rounded-xl px-3 py-2 text-xs leading-5 font-normal border transition focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                {cashAccounts.map((acc) => (
                  <option key={acc.code} value={acc.code}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 uppercase block">
                {t.opposite}
              </label>
              <select
                value={formData.coa_opposite}
                onChange={(e) => setFormData({ ...formData, coa_opposite: e.target.value })}
                className={`w-full rounded-xl px-3 py-2 text-xs leading-5 font-normal border transition focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                {oppositeAccounts.map((acc) => (
                  <option key={acc.code} value={acc.code}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 uppercase block">
              {t.amount}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-normal text-xs">Rp</span>
              <input
                type="number"
                required
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className={`w-full rounded-xl pl-11 pr-4 py-2.5 text-lg leading-7 font-mono font-semibold border transition focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                  isLight
                    ? 'bg-white border-slate-300 placeholder:text-slate-400/80'
                    : 'bg-slate-950 border-slate-800 placeholder:text-slate-500'
                } ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] leading-4 font-mono font-normal tracking-widest text-slate-500 uppercase block">
              {t.memo}
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full rounded-xl px-3 py-2 text-xs leading-5 font-normal border transition focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400/80 placeholder:italic'
                  : 'bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500 placeholder:italic'
              }`}
              placeholder={isEn ? "e.g. Payment for office supplies..." : "Contoh: Pembayaran alat tulis kantor..."}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-xl text-xs leading-5 font-normal transition-all duration-200 cursor-pointer active:scale-[0.99] border ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {t.btnCancel}
            </button>
            <button
              type="submit"
              className={`flex-[2] px-4 py-2.5 text-white rounded-xl text-xs leading-5 font-medium transition-all duration-200 cursor-pointer active:scale-[0.99] shadow-md flex items-center justify-center gap-2 ${
                isIncome
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
              }`}
            >
              <Save size={15} />
              {t.btnSave}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
