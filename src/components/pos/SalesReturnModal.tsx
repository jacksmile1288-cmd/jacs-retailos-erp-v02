import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale, CartItem } from '../../types';
import { X, RotateCcw, ShieldAlert } from 'lucide-react';

interface SalesReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any | null; // using any to support multiple property patterns for ID
  language?: 'ID' | 'EN';
}

export const SalesReturnModal: React.FC<SalesReturnModalProps> = ({
  isOpen,
  onClose,
  sale: order,
  language = 'ID',
}) => {
  const { handleSalesReturn, salesReturns, theme } = useApp();
  const isLight = theme === 'light';
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  const [qtyReturn, setQtyReturn] = useState(1);
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [reason, setReason] = useState('');

  // Hitung max returnable qty
  const maxReturnableQty = useMemo(() => {
    if (!selectedItem || !order) return 0;
    const transactionId = order.transaction_id || order.id || order.orderId;
    const itemReturns = salesReturns.filter(r => r.transactionId === transactionId && r.items.some(it => it.productId === selectedItem.product.id));
    const alreadyReturnedQty = itemReturns.reduce((sum, r) => sum + r.items.reduce((acc, it) => it.productId === selectedItem.product.id ? acc + it.returnQty : acc, 0), 0);
    return selectedItem.quantity - alreadyReturnedQty;
  }, [selectedItem, order, salesReturns]);

  const [showPinAuth, setShowPinAuth] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleKeyPress = (num: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + num;
      setPinInput(next);
      setPinError(null);
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const verifyPin = (pin: string) => {
    // Basic verification logic matching SupervisorVoidModal
    if (pin === '1234' || pin === '8888') {
      executeReturn();
    } else {
      setPinError(language === 'ID' ? 'PIN Supervisor tidak valid.' : 'Invalid Supervisor PIN.');
      setTimeout(() => setPinInput(''), 700);
    }
  };

  const executeReturn = () => {
    if (!order || !selectedItem || qtyReturn <= 0 || qtyReturn > maxReturnableQty) return;

    const targetOrderId = order.id || order.orderId || order.invoiceNo || order.receipt_number || order.transaction_id;
    const targetSku = (selectedItem.product as any).sku || (selectedItem.product as any).barcode || selectedItem.product.id || selectedItem.product.name;

    handleSalesReturn({
      orderId: targetOrderId,
      itemSku: targetSku,
      qtyReturn: Number(qtyReturn),
      refundMethod: refundMethod || 'CASH',
      reason: reason || 'Retur Barang',
    });

    onClose();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!order || !selectedItem || qtyReturn <= 0 || qtyReturn > maxReturnableQty) return;
    setShowPinAuth(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-lg rounded-2xl p-6 border transition-all ${
        isLight
          ? 'bg-white border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.22)] text-slate-800'
          : 'bg-[#161b22] border-cyan-500/35 shadow-[0_0_24px_rgba(6,182,212,0.12)] text-white'
      } overflow-hidden`}>
        {!showPinAuth ? (
          <>
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-700/30">
              <h3 className="font-medium text-base flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-500" />
                {language === 'ID' ? 'Proses Retur Penjualan' : 'Process Sales Return'}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg transition active:scale-[0.99]"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-normal text-gray-400 uppercase tracking-wider mb-1">{language === 'ID' ? 'Pilih Item' : 'Select Item'}</label>
                <select className={`w-full text-xs p-2.5 rounded-lg border outline-none font-normal ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0d1117] text-white border-[#30363d]'
                }`} onChange={(e) => {
                    const item = order.items?.find((i: any) => (i.product.id === e.target.value || i.product.sku === e.target.value));
                    setSelectedItem(item || null);
                    setQtyReturn(1);
                }}>
                    <option value="">-- Pilih Item --</option>
                    {order.items?.map((item: any, itemIdx: number) => {
                        const transactionId = order.transaction_id || order.id || order.orderId;
                        const itemReturns = salesReturns.filter(r => r.transactionId === transactionId && r.items.some(it => it.productId === item.product.id));
                        const alreadyReturnedQty = itemReturns.reduce((sum, r) => sum + r.items.reduce((acc, it) => it.productId === item.product.id ? acc + it.returnQty : acc, 0), 0);
                        const canReturn = item.quantity - alreadyReturnedQty;
                        return (
                            <option key={`${item.product?.id || 'ret-item'}-${itemIdx}`} value={item.product.id} disabled={canReturn <= 0}>
                                {item.product.name} (Qty: {item.quantity}) {canReturn <= 0 ? '- Sudah Diretur Penuh' : ''}
                            </option>
                        )
                    })}
                </select>
              </div>

              {selectedItem && (
                <>
                  <div>
                    <label className="block text-[11px] font-mono font-normal text-gray-400 uppercase tracking-wider mb-1">{language === 'ID' ? 'Qty Retur' : 'Return Qty'} (Maks: {maxReturnableQty} unit)</label>
                    <input type="number" min="1" max={maxReturnableQty} value={qtyReturn} onChange={(e) => setQtyReturn(Math.min(maxReturnableQty, Math.max(1, Number(e.target.value))))} className={`w-full text-xs p-2.5 rounded-lg border outline-none font-mono font-normal ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0d1117] text-white border-[#30363d]'
                    }`} />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-mono font-normal text-gray-400 uppercase tracking-wider mb-1">{language === 'ID' ? 'Metode Refund' : 'Refund Method'}</label>
                    <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value as 'CASH' | 'BANK')} className={`w-full text-xs p-2.5 rounded-lg border outline-none font-normal ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0d1117] text-white border-[#30363d]'
                    }`}>
                      <option value="CASH">CASH</option>
                      <option value="BANK">BANK</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-normal text-gray-400 uppercase tracking-wider mb-1">{language === 'ID' ? 'Alasan Retur' : 'Return Reason'}</label>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} className={`w-full text-xs p-2.5 rounded-lg border outline-none font-normal h-20 resize-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0d1117] text-white border-[#30363d]'
                    }`} />
                  </div>
                </>
              )}

              <button onClick={() => handleSubmit()} disabled={!selectedItem} className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium text-sm transition active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                {language === 'ID' ? 'Proses Retur' : 'Process Return'}
              </button>
            </div>
          </>
        ) : (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-700/30">
              <h3 className="font-medium text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                {language === 'ID' ? 'Otorisasi Supervisor' : 'Supervisor Authorization'}
              </h3>
              <button onClick={() => setShowPinAuth(false)} className="text-gray-400 hover:text-white flex items-center gap-1 text-[11px] font-mono font-normal uppercase tracking-wider p-1 rounded-lg active:scale-[0.99]">
                <X className="w-4 h-4" />
                {language === 'ID' ? 'Batal' : 'Cancel'}
              </button>
            </div>

            <div className="text-center mb-6">
              <p className="text-xs text-gray-400 mb-4 font-normal">
                {language === 'ID' 
                  ? 'Retur penjualan memerlukan PIN Supervisor untuk otorisasi.' 
                  : 'Sales return requires Supervisor PIN for authorization.'}
              </p>
              
              <div className="flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className={`w-4 h-4 rounded-full border ${idx < pinInput.length ? 'bg-amber-500 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-transparent border-[#30363d]'}`} />
                ))}
              </div>

              {pinError && (
                <div className="mb-4 text-xs font-normal text-rose-500 animate-bounce">
                  {pinError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'DEL'].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      if (val === 'CLR') setPinInput('');
                      else if (val === 'DEL') setPinInput(p => p.slice(0, -1));
                      else handleKeyPress(val);
                    }}
                    className={`h-12 rounded-xl font-mono font-normal text-base flex items-center justify-center transition active:scale-[0.99] cursor-pointer ${
                      val === 'CLR' || val === 'DEL' 
                        ? 'bg-[#21262d] text-gray-400 text-xs' 
                        : 'bg-[#30363d] text-white hover:bg-[#3b424a]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-[#30363d] text-center">
                <p className="text-[11px] font-mono text-gray-500 uppercase tracking-widest font-normal">
                  PIN DEMO: 1234 / 8888
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
