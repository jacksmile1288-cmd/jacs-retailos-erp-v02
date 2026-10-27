import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';

export interface TelemetryBarProps {
  className?: string;
  isLight?: boolean;
  showSyncButton?: boolean;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  className = '',
  isLight: propIsLight,
  showSyncButton = true,
}) => {
  const {
    theme,
    isOnline: contextIsOnline,
    offlineQueue = [],
    syncOfflineTransactions,
    showToast,
  } = useApp();

  const isLight = propIsLight !== undefined ? propIsLight : theme === 'light';

  // Dynamic state initialized from browser navigator.onLine
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [heartbeatStatus, setHeartbeatStatus] = useState<'healthy' | 'checking' | 'degraded'>('healthy');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(() => new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Heartbeat probe function
  const runHeartbeat = useCallback(async () => {
    // If navigator explicitly reports offline, immediate offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setHeartbeatStatus('degraded');
      setLatency(null);
      return;
    }

    setHeartbeatStatus('checking');
    const startTime = performance.now();

    try {
      // Lightweight probe with 3-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Probe origin with cache-busting head request
      const response = await fetch(`/?heartbeat=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      }).catch(async () => {
        // Fallback probe to current window location if subpath or relative path
        return await fetch(window.location.href, {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
      });

      clearTimeout(timeoutId);

      const endTime = performance.now();
      const roundTrip = Math.round(endTime - startTime);

      if (response && (response.ok || response.status < 500)) {
        setIsOnline(true);
        setHeartbeatStatus('healthy');
        setLatency(roundTrip);
        setLastHeartbeat(new Date());
      } else {
        // Even if server returns 500, internet connection is alive
        setIsOnline(true);
        setHeartbeatStatus('healthy');
        setLatency(roundTrip);
      }
    } catch {
      // If fetch fails (timeout or network error)
      // Check if navigator still considers network up
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
        setHeartbeatStatus('degraded');
        setLatency(null);
      } else {
        // Device is nominally connected according to navigator
        setIsOnline(true);
        setHeartbeatStatus('healthy');
        setLastHeartbeat(new Date());
      }
    }
  }, []);

  // Window event listeners for immediate online / offline detection without reload
  useEffect(() => {
    const handleWindowOnline = () => {
      setIsOnline(true);
      setHeartbeatStatus('healthy');
      runHeartbeat();
      if (showToast) {
        showToast('🌐 Koneksi internet pulih (ONLINE - Cloud Connected)');
      }
    };

    const handleWindowOffline = () => {
      setIsOnline(false);
      setHeartbeatStatus('degraded');
      setLatency(null);
      if (showToast) {
        showToast('⚠️ Koneksi terputus (OFFLINE MODE - Local Storage Active)');
      }
    };

    // Attach native window event listeners
    window.addEventListener('online', handleWindowOnline);
    window.addEventListener('offline', handleWindowOffline);

    // Initial heartbeat ping
    runHeartbeat();

    // Periodic heartbeat check every 25 seconds
    heartbeatTimerRef.current = setInterval(() => {
      runHeartbeat();
    }, 25000);

    return () => {
      window.removeEventListener('online', handleWindowOnline);
      window.removeEventListener('offline', handleWindowOffline);
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
    };
  }, [runHeartbeat, showToast]);

  // Keep in sync if context updates
  useEffect(() => {
    if (contextIsOnline !== undefined && contextIsOnline !== isOnline) {
      if (typeof navigator !== 'undefined') {
        setIsOnline(navigator.onLine);
      } else {
        setIsOnline(contextIsOnline);
      }
    }
  }, [contextIsOnline, isOnline]);

  const handleManualSync = async () => {
    if (!syncOfflineTransactions || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncOfflineTransactions();
      if (showToast) {
        showToast(res.message);
      }
    } catch {
      if (showToast) {
        showToast('Gagal menyinkronkan transaksi offline.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const formattedHeartbeatTime = lastHeartbeat
    ? lastHeartbeat.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '-';

  return (
    <div id="telemetry-bar-root" className={`flex items-center shrink-0 ${className}`}>
      {/* Dynamic Condition: navigator.onLine === true */}
      {isOnline ? (
        <div
          id="system-online-badge"
          className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-2 sm:px-2.5 py-1 text-xs font-semibold border whitespace-nowrap transition-all duration-300 ${
            isLight
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm'
              : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.35)]'
          }`}
          title={`Cloud Connected • Heartbeat: ${heartbeatStatus === 'healthy' ? 'Normal' : 'Checking'} • Latency: ${latency ? `${latency}ms` : '<10ms'} • Waktu: ${formattedHeartbeatTime}`}
        >
          {/* Indikator titik hijau berkedip (blinking green dot) */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 bg-emerald-500 ${
                isLight ? '' : 'drop-shadow-[0_0_8px_rgba(34,197,94,0.9)] animate-pulse'
              }`}
            ></span>
          </span>

          <span
            className={`font-bold tracking-wide flex items-center gap-1.5 text-[11px] whitespace-nowrap ${
              isLight ? 'text-slate-800' : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.9)]'
            }`}
          >
            <Wifi className="w-3 h-3 shrink-0 text-slate-700 dark:text-slate-200" />
            <span>ONLINE (Cloud Connected)</span>
          </span>

          {latency !== null && (
            <span
              className={`hidden md:inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                isLight ? 'bg-slate-200/90 text-slate-800 border border-slate-300' : 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
              }`}
            >
              <Activity className="w-2.5 h-2.5 text-slate-700 dark:text-slate-200" />
              {latency}ms
            </span>
          )}

          {showSyncButton && offlineQueue.length > 0 && (
            <button
              type="button"
              id="btn-topbar-manual-sync"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-900 hover:bg-amber-400 transition cursor-pointer flex items-center gap-1 shadow-xs disabled:opacity-50"
              title="Klik untuk menyinkronkan transaksi offline sekarang ke Cloud"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sinkronkan Sekarang (Sync Cloud) ({offlineQueue.length})</span>
            </button>
          )}
        </div>
      ) : (
        /* Dynamic Condition: navigator.onLine === false */
        <div
          id="system-offline-badge"
          className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold border whitespace-nowrap transition-all duration-300 animate-pulse ${
            isLight
              ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm'
              : 'bg-amber-950/70 border-amber-500/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
          }`}
          title="Koneksi Terputus: Transaksi disimpan ke Local Storage & Struk tetap dapat dicetak"
        >
          {/* Indikator titik oranye berkedip */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-ping"></span>
          </span>

          <span className="font-black tracking-wide flex items-center gap-1 text-[11px] whitespace-nowrap text-amber-600 dark:text-amber-300">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>OFFLINE MODE (Local Storage Active)</span>
          </span>

          {offlineQueue.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
              [ {offlineQueue.length} Transaksi Tertunda ]
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TelemetryBar;
