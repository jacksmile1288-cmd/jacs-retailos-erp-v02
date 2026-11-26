import React, { useState, useEffect } from 'react';
import { dualBackendSync, SyncStatusSnapshot } from '../services/dualBackendSync';
import { useApp } from '../context/AppContext';
import { CloudSyncResult, testCloudConnections } from '../services/cloudSyncService';
import { Cloud, CheckCircle2, AlertTriangle, RefreshCw, X, Download, Server, FlaskConical, ShieldCheck } from 'lucide-react';

export const DualBackendStatusWidget: React.FC = () => {
  const {
    products,
    transactions,
    executeCloudSync,
    language,
    theme,
    isDemoSandbox,
    resetDemoSandboxSession,
  } = useApp();
  const isEn = language === 'en';
  const isLight = theme === 'light';
  const [status, setStatus] = useState<SyncStatusSnapshot>(() => dualBackendSync.getSnapshot());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<CloudSyncResult | null>(null);

  // Form Konfigurasi Dual-Backend
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [gasWebhookUrl, setGasWebhookUrl] = useState('');
  const [pingResult, setPingResult] = useState<{ supabase: string; gas: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const unsubscribe = dualBackendSync.subscribe((snap) => {
      setStatus(snap);
      if (snap.lastSyncFailed === false) {
        setLastSyncResult((prev) => (prev && !prev.success ? null : prev));
      }
    });
    return unsubscribe;
  }, []);

  const handleOpenSettings = () => {
    const cfg = dualBackendSync.getConfig();
    setSupabaseUrl(cfg.supabaseUrl || '');
    setSupabaseAnonKey(cfg.supabaseAnonKey || '');
    setGasWebhookUrl(cfg.gasWebhookUrl || '');
    setPingResult(null);
    setIsModalOpen(true);
  };

  const handleSyncNow = async () => {
    if (isSyncingNow || status.isSyncing) return;
    setIsSyncingNow(true);
    try {
      const res = await executeCloudSync();
      setLastSyncResult(res);
      setStatus(dualBackendSync.getSnapshot());
    } finally {
      setIsSyncingNow(false);
    }
  };

  const handleSaveConfig = async () => {
    const cfg = {
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      gasWebhookUrl: gasWebhookUrl.trim(),
    };
    dualBackendSync.saveConfig(cfg);
    setIsModalOpen(false);
    await handleSyncNow();
  };

  const handleTestPing = async () => {
    setIsTesting(true);
    const cfg = {
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      gasWebhookUrl: gasWebhookUrl.trim(),
    };
    dualBackendSync.saveConfig(cfg);
    const res = await testCloudConnections(cfg);
    setPingResult({
      supabase: res.supabase.statusText,
      gas: res.gas.statusText,
    });
    if (res.supabase.connected || res.gas.connected) {
      setLastSyncResult((prev) => (prev && !prev.success ? null : prev));
    }
    setStatus(dualBackendSync.getSnapshot());
    setIsTesting(false);
  };

  const handleExportBackup = () => {
    dualBackendSync.exportBackupJson({
      productsCount: products?.length || 0,
      transactionsCount: transactions?.length || 0,
      products,
      transactions,
    });
  };

  // Penentuan Tampilan Badge Status Cloud Ringkas
  const isLocalOnlyMode = status.storageMode === 'LOCAL_ONLY';
  const isHybridMode = status.storageMode === 'HYBRID_MIGRATION';
  const isBusySyncing = status.isSyncing || isSyncingNow;
  const hasSyncFailure =
    !isLocalOnlyMode && Boolean((lastSyncResult && !lastSyncResult.success) || status.lastSyncFailed);

  let containerTone = isLight
    ? 'bg-emerald-50/90 border-emerald-200/90 text-emerald-800'
    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
  let dotColor = 'bg-emerald-500';
  let statusLabel = 'SYNCED';
  let fullStatusTitle = isEn
    ? 'Cloud Online — Synced. Click to configure Supabase & GAS.'
    : 'Cloud Online — Tersinkronisasi. Klik untuk pengaturan Supabase & GAS.';

  if (isDemoSandbox) {
    containerTone = isLight
      ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
      : 'bg-indigo-500/15 border-indigo-400/40 text-indigo-300';
    dotColor = 'bg-indigo-500 animate-pulse';
    statusLabel = 'DEMO SANDBOX';
    fullStatusTitle =
      'Mode Demo Sandbox (?demo=1) — Data simulasi terisolasi di browser, tidak menulis ke database cloud Supabase produksi.';
  } else if (isLocalOnlyMode) {
    containerTone = isLight
      ? 'bg-amber-50 border-amber-200 text-amber-800'
      : 'bg-amber-500/10 border-amber-500/35 text-amber-300';
    dotColor = 'bg-amber-500';
    statusLabel = 'LOCAL';
    fullStatusTitle = 'Mode Lokal Saja (100% Offline — Tanpa Cloud). Klik untuk pengaturan mode penyimpanan.';
  } else if (!status.isOnline) {
    containerTone = isLight
      ? 'bg-amber-50 border-amber-200 text-amber-800'
      : 'bg-amber-500/10 border-amber-500/35 text-amber-300';
    dotColor = 'bg-amber-500';
    statusLabel = status.queuedCount > 0 ? `OFFLINE (${status.queuedCount})` : 'OFFLINE';
    fullStatusTitle = `Offline — ${status.queuedCount} antrean menunggu koneksi internet.`;
  } else if (isBusySyncing) {
    containerTone = isLight
      ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
      : 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300';
    dotColor = 'bg-cyan-400 animate-ping';
    statusLabel = 'SYNCING';
    fullStatusTitle = 'Sedang menyinkronkan data ke cloud (Supabase & GAS)...';
  } else if (hasSyncFailure) {
    containerTone = isLight
      ? 'bg-rose-50 border-rose-200 text-rose-800'
      : 'bg-rose-500/15 border-rose-500/35 text-rose-300';
    dotColor = 'bg-rose-500';
    statusLabel = 'SYNC ERR';
    fullStatusTitle = `Sinkronisasi gagal: ${lastSyncResult?.message || status.lastSyncErrorMessage || 'Periksa konfigurasi cloud'}`;
  } else if (isHybridMode && !status.lastSyncTime) {
    containerTone = isLight
      ? 'bg-amber-50 border-amber-200 text-amber-800'
      : 'bg-amber-500/10 border-amber-500/35 text-amber-300';
    dotColor = 'bg-amber-500';
    statusLabel = status.queuedCount > 0 ? `HYBRID (${status.queuedCount})` : 'HYBRID';
    fullStatusTitle = `Mode Hybrid — ${status.queuedCount} item siap dimigrasi ke cloud.`;
  } else if (status.queuedCount > 0) {
    containerTone = isLight
      ? 'bg-amber-50 border-amber-200 text-amber-800'
      : 'bg-amber-500/10 border-amber-500/35 text-amber-300';
    dotColor = 'bg-amber-500';
    statusLabel = `QUEUED (${status.queuedCount})`;
    fullStatusTitle = `Online — ${status.queuedCount} item menunggu sinkronisasi cloud.`;
  }

  return (
    <>
      {/* Lencana Status Cloud Ringkas + Tombol Ikon Refresh Kecil */}
      <div
        className={`h-[34px] inline-flex items-center rounded-full border p-0.5 gap-0.5 shrink-0 transition-colors ${containerTone}`}
      >
        <button
          type="button"
          onClick={handleOpenSettings}
          title={fullStatusTitle}
          aria-label={fullStatusTitle}
          className="h-[28px] px-2 sm:px-2.5 rounded-full flex items-center gap-1.5 text-[10.5px] font-mono font-bold tracking-wide whitespace-nowrap transition-opacity hover:opacity-85 cursor-pointer"
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
          <span className={`${isDemoSandbox ? 'inline' : 'hidden sm:inline'} tabular-nums`}>
            {statusLabel}
          </span>
        </button>

        {!isLocalOnlyMode && !isDemoSandbox && (
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={!status.isOnline || isBusySyncing}
            title={
              isBusySyncing
                ? isEn
                  ? 'Syncing with cloud...'
                  : 'Sedang menyinkronkan ke cloud...'
                : isHybridMode
                ? 'Migrasi Cloud Sekarang (Supabase & GAS)'
                : isEn
                ? 'Sync Now (Supabase & GAS)'
                : 'Sync Sekarang (Supabase & GAS)'
            }
            aria-label={isEn ? 'Sync Now' : 'Sync Sekarang'}
            className={`w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 shrink-0 ${
              isLight
                ? 'hover:bg-black/10 text-current'
                : 'hover:bg-white/15 text-current'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBusySyncing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Modal Konfigurasi Dual-Backend & Backup (atau Info Isolasi Demo Sandbox) */}
      {isModalOpen && isDemoSandbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl w-full max-w-md p-5 text-slate-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shrink-0">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-indigo-300 uppercase tracking-wider">
                    DEMO SANDBOX TERISOLASI
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Parameter URL <code className="text-indigo-300 font-mono">?demo=1</code> Aktif
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 space-y-2 text-xs text-slate-200 leading-relaxed">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Database Cloud Produksi 100% Aman</span>
              </div>
              <p className="text-slate-300 text-[11.5px]">
                Seluruh transaksi, stok, kasir POS, dan jurnal selama sesi demo ini disimpan terisolasi pada{' '}
                <code className="font-mono text-indigo-300">sessionStorage / jacs_demo_sandbox_*</code> dan{' '}
                <strong className="text-white">tidak pernah menulis atau menimpa</strong> database cloud Supabase maupun Google Apps Script produksi.
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  resetDemoSandboxSession();
                  setIsModalOpen(false);
                }}
                className="px-3.5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Simulasi Demo</span>
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && !isDemoSandbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 text-slate-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-cyan-400 uppercase tracking-wider">
                    {isEn ? 'Dual-Backend Cloud Sync Engine' : 'Layanan Sinkronisasi Cloud Nyata'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Supabase REST API (Realtime Database) &amp; Google Apps Script Webhook
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ringkasan Antrean Offline */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
                <p className="text-[10px] text-slate-400">Jaringan</p>
                <p className={`text-xs font-black ${status.isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {status.isOnline ? 'ONLINE' : 'OFFLINE'}
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
                <p className="text-[10px] text-slate-400">Antrean Sync</p>
                <p className="text-xs font-black text-cyan-400">{status.queuedCount} Item</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
                <p className="text-[10px] text-slate-400">Sync Terakhir</p>
                <p className="text-[10px] font-mono text-slate-300 mt-0.5 truncate">
                  {status.lastSyncTime ? new Date(status.lastSyncTime).toLocaleTimeString('id-ID') : 'Belum Pernah'}
                </p>
              </div>
            </div>

            {/* Form Jalur 1: Supabase */}
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5" />
                    <span>Jalur 1: Supabase REST API</span>
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    status.supabaseStatus === 'CONNECTED'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {status.supabaseStatus}
                  </span>
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
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Jalur 2: Google Apps Script Webhook</span>
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    status.gasStatus === 'CONNECTED'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {status.gasStatus}
                  </span>
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
              <div className="p-2.5 bg-slate-950 border border-cyan-800/50 rounded-xl text-[11px] font-mono space-y-1">
                <p className="text-emerald-300">• Supabase: {pingResult.supabase}</p>
                <p className="text-amber-300">• Google Apps Script: {pingResult.gas}</p>
              </div>
            )}

            {/* Hasil Terakhir Sinkronisasi */}
            {lastSyncResult && (
              <div
                className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  lastSyncResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {lastSyncResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{lastSyncResult.message}</span>
                </div>
              </div>
            )}

            {/* Tombol Aksi */}
            <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-800">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={isTesting}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? 'Testing...' : 'Test Ping'}
                </button>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Backup JSON</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-lg uppercase tracking-wider cursor-pointer"
              >
                Simpan &amp; Sync Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DualBackendStatusWidget;