import React, { useState, useEffect } from 'react';
import { dualBackendSync, SyncStatusSnapshot } from '../services/dualBackendSync';
import { useApp } from '../context/AppContext';

export const DualBackendStatusWidget: React.FC = () => {
  const { products, transactions } = useApp();
  const [status, setStatus] = useState<SyncStatusSnapshot>(() => dualBackendSync.getSnapshot());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Konfigurasi Dual-Backend
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [gasWebhookUrl, setGasWebhookUrl] = useState('');
  const [pingResult, setPingResult] = useState<{ supabase: string; gas: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const unsubscribe = dualBackendSync.subscribe((snap) => {
      setStatus(snap);
    });
    return unsubscribe;
  }, []);

  const handleOpenSettings = () => {
    const cfg = dualBackendSync.getConfig();
    setSupabaseUrl(cfg.supabaseUrl);
    setSupabaseAnonKey(cfg.supabaseAnonKey);
    setGasWebhookUrl(cfg.gasWebhookUrl);
    setPingResult(null);
    setIsModalOpen(true);
  };

  const handleSaveConfig = () => {
    dualBackendSync.saveConfig({
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      gasWebhookUrl: gasWebhookUrl.trim()
    });
    dualBackendSync.processQueue();
    setIsModalOpen(false);
  };

  const handleTestPing = async () => {
    setIsTesting(true);
    dualBackendSync.saveConfig({
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      gasWebhookUrl: gasWebhookUrl.trim()
    });
    const res = await dualBackendSync.testConnections();
    setPingResult(res);
    setIsTesting(false);
  };

  const handleExportBackup = () => {
    dualBackendSync.exportBackupJson({
      productsCount: products?.length || 0,
      transactionsCount: transactions?.length || 0,
      products,
      transactions
    });
  };

  // Penentuan Tampilan Badge Status Global
  let badgeColor = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
  let dotColor = 'bg-emerald-400';
  let statusLabel = 'ONLINE — SYNCED';

  if (!status.isOnline) {
    badgeColor = 'bg-amber-500/15 border-amber-500/40 text-amber-300';
    dotColor = 'bg-amber-400';
    statusLabel = `OFFLINE — QUEUED [${status.queuedCount}]`;
  } else if (status.isSyncing) {
    badgeColor = 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300';
    dotColor = 'bg-cyan-400 animate-ping';
    statusLabel = 'SYNCING...';
  } else if (status.queuedCount > 0) {
    badgeColor = 'bg-amber-500/15 border-amber-500/40 text-amber-300';
    dotColor = 'bg-amber-400';
    statusLabel = `ONLINE — QUEUED [${status.queuedCount}]`;
  }

  return (
    <>
      {/* Status Badge & Tombol Sync Now di Header */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleOpenSettings}
          title="Konfigurasi Dual-Backend (Supabase & Google Apps Script)"
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-mono font-bold whitespace-nowrap transition-all hover:opacity-90 cursor-pointer shrink-0 ${badgeColor}`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
          <span>{statusLabel}</span>
        </button>

        <button
          type="button"
          onClick={() => dualBackendSync.processQueue()}
          disabled={!status.isOnline || status.isSyncing}
          title="Paksa Sinkronisasi Antrean Sekarang"
          className="px-2 py-1 bg-slate-800 hover:bg-cyan-600 disabled:opacity-40 text-slate-200 hover:text-slate-950 text-[10px] font-bold rounded-lg border border-slate-700 whitespace-nowrap transition-all cursor-pointer shrink-0"
        >
          Sync Now
        </button>
      </div>

      {/* Modal Konfigurasi Dual-Backend & Backup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <div>
                <h2 className="text-sm font-black text-cyan-400 uppercase tracking-wider">
                  JacS Enterprise — Dual-Backend Sync Engine
                </h2>
                <p className="text-[11px] text-slate-400">
                  Sinkronisasi Paralel Supabase REST + Google Apps Script & Antrean Offline FIFO
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Ringkasan Antrean Offline */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="bg-slate-950 border border-slate-800 p-2 rounded-lg">
                <p className="text-[10px] text-slate-400">Jaringan</p>
                <p className={`text-xs font-black ${status.isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {status.isOnline ? 'ONLINE' : 'OFFLINE'}
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2 rounded-lg">
                <p className="text-[10px] text-slate-400">Antrean FIFO</p>
                <p className="text-xs font-black text-cyan-400">{status.queuedCount} Item</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2 rounded-lg">
                <p className="text-[10px] text-slate-400">Sync Terakhir</p>
                <p className="text-[10px] font-mono text-slate-300 mt-0.5">
                  {status.lastSyncTime ? new Date(status.lastSyncTime).toLocaleTimeString('id-ID') : 'Belum Pernah'}
                </p>
              </div>
            </div>

            {/* Form Jalur 1: Supabase */}
            <div className="space-y-3 mb-4">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-400">Jalur 1: Supabase REST API (Realtime POS & Stok)</span>
                  <span className="text-[10px] font-mono text-slate-400">{status.supabaseStatus}</span>
                </div>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="Supabase Anon / Public Key (eyJ...)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Form Jalur 2: Google Apps Script */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-400">Jalur 2: Google Apps Script Webhook (Google Sheets)</span>
                  <span className="text-[10px] font-mono text-slate-400">{status.gasStatus}</span>
                </div>
                <input
                  type="text"
                  value={gasWebhookUrl}
                  onChange={(e) => setGasWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Hasil Test Ping */}
            {pingResult && (
              <div className="mb-4 p-2.5 bg-slate-950 border border-cyan-800/50 rounded-lg text-[11px] font-mono space-y-1">
                <p className="text-emerald-300">• Supabase: {pingResult.supabase}</p>
                <p className="text-amber-300">• Google Apps Script: {pingResult.gas}</p>
              </div>
            )}

            {/* Tombol Aksi */}
            <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-800">
              <div className="flex gap-2">
                <button
                  onClick={handleTestPing}
                  disabled={isTesting}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-lg border border-slate-700"
                >
                  {isTesting ? 'Testing...' : 'Test Ping'}
                </button>
                <button
                  onClick={handleExportBackup}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-lg border border-slate-700"
                >
                  Export Backup JSON
                </button>
              </div>

              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-lg uppercase tracking-wider"
              >
                Simpan & Sinkronkan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DualBackendStatusWidget;