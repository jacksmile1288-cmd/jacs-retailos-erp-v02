import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { dualBackendSync } from '../../services/dualBackendSync';
import { AlertTriangle, RefreshCw, Wrench, X, ShieldAlert, ArrowRight, Trash2 } from 'lucide-react';

export const SystemHealthNotificationBanner: React.FC = () => {
  const {
    offlineQueue,
    gasOfflineQueueCount,
    supabaseOfflineQueueCount,
    errorLogs,
    syncOfflineTransactions,
    syncOfflineQueues,
    clearFailedOfflineQueues,
    setActiveNav,
    activeBackendProvider,
    theme,
  } = useApp();

  const isLight = theme === 'light';
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [dualQueuedCount, setDualQueuedCount] = useState<number>(
    () => dualBackendSync.getSnapshot().queuedCount
  );

  useEffect(() => {
    const unsubscribe = dualBackendSync.subscribe((snap) => {
      setDualQueuedCount(snap.queuedCount);
    });
    return unsubscribe;
  }, []);

  const totalOfflineQueued =
    (offlineQueue?.length || 0) +
    (gasOfflineQueueCount || 0) +
    (supabaseOfflineQueueCount || 0) +
    (dualQueuedCount || 0);
  
  const validErrors = useMemo(() => {
    return (errorLogs || []).filter((err) => {
      const msg = (err.message || '').toLowerCase();
      if (
        activeBackendProvider === 'LOCAL' &&
        (msg.includes('fetch') ||
          msg.includes('network') ||
          msg.includes('supabase') ||
          msg.includes('gas') ||
          msg.includes('timeout') ||
          msg.includes('net::ERR_'))
      ) {
        return false;
      }
      return true;
    });
  }, [errorLogs, activeBackendProvider]);

  const totalErrors = validErrors.length;
  const hasIssues = totalOfflineQueued > 0 || totalErrors > 0;

  if (!hasIssues || isDismissed) {
    return null;
  }

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await syncOfflineTransactions();
      await syncOfflineQueues();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearStuckQueue = () => {
    clearFailedOfflineQueues();
    setDualQueuedCount(dualBackendSync.getSnapshot().queuedCount);
  };

  const handleOpenSuperAdmin = () => {
    setActiveNav('super-admin');
  };

  return (
    <div className={`mx-4 mt-3 mb-1 p-3.5 rounded-2xl border shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
      totalErrors > 0
        ? isLight ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-rose-950/40 border-rose-800/60 text-rose-200 shadow-rose-950/30'
        : isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-950/40 border-amber-800/60 text-amber-200 shadow-amber-950/30'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
          totalErrors > 0
            ? 'bg-rose-500/20 text-rose-500 border-rose-500/30'
            : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
        }`}>
          {totalErrors > 0 ? <ShieldAlert className="w-5 h-5 animate-bounce" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xs font-black uppercase tracking-wider">
              {totalErrors > 0 ? 'Peringatan Gangguan Sistem & Error' : 'Peringatan Antrean Offline Menumpuk'}
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/20 dark:bg-white/10">
              Provider: {activeBackendProvider}
            </span>
          </div>
          <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
            {totalOfflineQueued > 0 && `${totalOfflineQueued} transaksi/mutasi dalam antrean offline menunggu sinkronisasi cloud.`}
            {totalOfflineQueued > 0 && totalErrors > 0 && ' • '}
            {totalErrors > 0 && `${totalErrors} error sistem tercatat di log diagnostik.`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {totalOfflineQueued > 0 && (
          <>
            <button
              type="button"
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyelaraskan...' : 'Sync Sekarang'}</span>
            </button>

            <button
              type="button"
              onClick={handleClearStuckQueue}
              disabled={isSyncing}
              title="Kosongkan paksa antrean sinkronisasi offline lokal yang macet (Clear Failed Queue)"
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Antrean Macet</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={handleOpenSuperAdmin}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-bold rounded-xl cursor-pointer shadow transition flex items-center gap-1.5"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>SuperAdmin Maintenance &amp; Perbaikan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
          title="Tutup Banner Sementara"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SystemHealthNotificationBanner;
