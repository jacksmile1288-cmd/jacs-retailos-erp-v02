import React, { useState } from 'react';
import { callRouterAI } from '../../services/aiService';
import { Sparkles, ClipboardList, Package, Copy, Loader2 } from 'lucide-react';

export const DeveloperAiTester: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string>('');

  const runTest = async (type: 'restock' | 'audit' | 'po') => {
    setLoading(true);
    setResponse('');
    setError('');
    
    try {
      let systemPrompt = '';
      let userPrompt = '';
      
      switch (type) {
        case 'restock':
          systemPrompt = "You are a warehouse manager AI. Suggest restock quantities in JSON format based on hypothetical stock levels.";
          userPrompt = "Check minimum stock for product 'Fresh Milk' and 'Bread' and suggest restock quantities.";
          break;
        case 'audit':
          systemPrompt = "You are a POS auditor AI. Summarize daily transaction data for an owner's WhatsApp.";
          userPrompt = "Summarize daily sales for today: Total Sales 5,000,000, Transactions 120, Highest item: Rice.";
          break;
        case 'po':
          systemPrompt = "You are a procurement AI. Draft a PO message for a supplier.";
          userPrompt = "Draft a message to supplier 'IndoSupplier' to order 50 packs of Coffee.";
          break;
      }

      const result = await callRouterAI({ systemPrompt, userPrompt });
      setResponse(result);
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 text-slate-200">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-purple-400">
        <Sparkles className="w-5 h-5" /> Developer AI Tester Runner
      </h2>
      
      <div className="flex gap-2 mb-4">
        <button onClick={() => runTest('restock')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-2">
          <Package className="w-4 h-4" /> Uji Restock Master Data
        </button>
        <button onClick={() => runTest('audit')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Uji Audit Kasir POS
        </button>
        <button onClick={() => runTest('po')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-2">
          <Package className="w-4 h-4" /> Uji Draf PO Supplier
        </button>
      </div>

      <div className="bg-black p-4 rounded-lg border border-slate-800 min-h-[150px] relative">
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {!loading && !error && (
          <div className="text-sm font-mono whitespace-pre-wrap">{response || 'Hasil respons akan muncul di sini...'}</div>
        )}
        {response && !loading && (
          <button onClick={() => navigator.clipboard.writeText(response)} className="absolute top-2 right-2 p-1 hover:bg-slate-800 rounded">
            <Copy className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
