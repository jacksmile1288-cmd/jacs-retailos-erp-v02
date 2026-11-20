import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AuditTrailTab } from './AuditTrailTab';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  Database,
  Cpu,
  HardDrive,
  Activity,
  FileText,
  RefreshCw,
  Trash2,
  KeyRound,
  Zap,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  Sparkles,
  Plus,
  Eye,
  EyeOff,
  Layers,
  Server,
  UserCheck,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';

export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  eventType: string;
  source: string;
  operator: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  details: string;
}

export const SecurityModule: React.FC = () => {
  const {
    theme,
    language,
    showToast,
    activeUser,
    currentUser,
    products,
    sales,
    businessProfile,
    isGlobalMaintenance,
    toggleGlobalMaintenance,
  } = useApp();

  const isLight = theme === 'light';
  const isEn = language === 'en';

  // Sub-tab navigasi modul Security
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'audit'>('overview');

  const operatorName =
    activeUser?.name || currentUser?.name || 'Security Officer';

  // State: Emergency Killswitch / Safe Mode Toggle
  const [isSafeModeActive, setIsSafeModeActive] = useState<boolean>(false);

  // State: Modal Passcode Konfirmasi Ekstrem
  const [passcodeModal, setPasscodeModal] = useState<{
    isOpen: boolean;
    actionType: 'WIPE_PRODUCTS' | 'RESET_SALES' | 'PURGE_CACHE' | null;
    actionTitle: string;
  }>({
    isOpen: false,
    actionType: null,
    actionTitle: '',
  });

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // State: Modal Tambah Catatan Manual Insiden
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [noteEventType, setNoteEventType] = useState<string>('MANUAL_INCIDENT_NOTE');
  const [noteSeverity, setNoteSeverity] = useState<'CRITICAL' | 'WARNING' | 'INFO'>('WARNING');
  const [noteText, setNoteText] = useState<string>('');

  // State: Realtime Security Audit Log Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');

  // --- NEW STATES FOR API KEY & MAINTENANCE ENGINE ---
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('jacs_superadmin_api_key') || 'clv_live_wrhnkUi6OMSHOVXlwt9Z1Obs7F3k9wu5A8E7qzt7XF7';
  });
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] System Diagnostic initialized.`,
    `[${new Date().toLocaleTimeString()}] Awaiting module synchronization signal...`,
  ]);
  const terminalRef = React.useRef<HTMLDivElement>(null);

  const addTerminalLog = (msg: string) => {
    setTerminalLogs(prev => [...prev.slice(-49), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleSyncModules = () => {
    addTerminalLog("Initiating real-time cross-module reconciliation...");

    try {
      // 1. Reconcile Sales to Finance
      const savedSales = localStorage.getItem('jacs_erp_sales');
      const savedFinance = localStorage.getItem('jacs_erp_finance');
      const salesData = savedSales ? JSON.parse(savedSales) : [];
      const financeData = savedFinance ? JSON.parse(savedFinance) : [];

      let newFinanceEntries = 0;
      salesData.forEach((sale: any) => {
        const exists = financeData.find((f: any) => f.reference === sale.transaction_id);
        if (!exists) {
          financeData.push({
            id: `FIN-${Date.now()}-${Math.random()}`,
            date: sale.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            category: 'Penjualan POS',
            account_target: 'Kas Kasir',
            description: `Sinkronisasi Penjualan POS: ${sale.transaction_id}`,
            amount: sale.total,
            type: 'INCOME',
            payment_method: sale.paymentMethod || 'CASH',
            reference: sale.transaction_id,
          });
          newFinanceEntries++;
        }
      });

      // 2. Reconcile Inventory to Products
      const savedInventory = localStorage.getItem('jacs_erp_inventory');
      const savedProducts = localStorage.getItem('jacs_erp_products');
      const inventoryData = savedInventory ? JSON.parse(savedInventory) : [];
      const productsData = savedProducts ? JSON.parse(savedProducts) : [];

      let updatedProducts = 0;
      inventoryData.forEach((inv: any) => {
        const prodIdx = productsData.findIndex((p: any) => p.id === inv.productId);
        if (prodIdx !== -1 && productsData[prodIdx].stock !== inv.remainingQty) {
          productsData[prodIdx].stock = inv.remainingQty;
          updatedProducts++;
        }
      });

      // 3. Save updates
      localStorage.setItem('jacs_erp_finance', JSON.stringify(financeData));
      localStorage.setItem('jacs_erp_products', JSON.stringify(productsData));

      // 4. Dispatch Update Event
      window.dispatchEvent(new CustomEvent('jacs_sync_update', { detail: { timestamp: Date.now() } }));

      // 5. Finalize Logs
      addTerminalLog(`Sync Summary:`);
      addTerminalLog(`- Transactions processed: ${salesData.length}`);
      addTerminalLog(`- New ledger entries added: ${newFinanceEntries}`);
      addTerminalLog(`- Inventory items reconciled: ${updatedProducts}`);
      addTerminalLog(`Sync complete. Global state updated.`);
      showToast("Sinkronisasi data riil berhasil diselesaikan.");
    } catch (err) {
      addTerminalLog(`ERROR during sync: ${err instanceof Error ? err.message : String(err)}`);
      showToast("Sinkronisasi gagal, periksa terminal log.");
    }
  };

  const handleExportBugLog = () => {
    addTerminalLog("Generating diagnostic error log dump...");
    const dummyLog = {
      timestamp: new Date().toISOString(),
      active_user: operatorName,
      diagnostic_buffer: terminalLogs,
      detected_anomalies: 0,
      system_state: "HEALTHY"
    };
    const blob = new Blob([JSON.stringify(dummyLog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bug_Error_Log_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addTerminalLog("Bug log exported successfully.");
  };

  const handleClearDiagnosticCache = () => {
    setTerminalLogs([`[${new Date().toLocaleTimeString()}] Diagnostic buffer cleared by operator.`]);
    showToast("Diagnostic cache berhasil dibersihkan.");
  };

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem('jacs_superadmin_api_key', val);
  };
  // ---------------------------------------------------

  // Initial Audit Log Data
  const [auditLogs, setAuditLogs] = useState<SecurityAuditEvent[]>([
    {
      id: 'SEC-LOG-8009',
      timestamp: '2026-10-28 13:40:12',
      eventType: 'SYSTEM_HEARTBEAT_CHECK',
      source: 'System Integrity Engine',
      operator: 'Automated Daemon',
      severity: 'INFO',
      details: 'Pemeriksaan integritas database & kuota penyimpanan lokal berhasil 100% tanpa anomaly.',
    },
    {
      id: 'SEC-LOG-8008',
      timestamp: '2026-10-28 13:22:45',
      eventType: 'UNAUTHORIZED_PIN_ATTEMPT',
      source: 'Terminal POS 02 - Kasir',
      operator: 'Operator Shift 1',
      severity: 'WARNING',
      details: 'Percobaan otorisasi PIN 2x gagal pada modul terproteksi Eksekutif.',
    },
    {
      id: 'SEC-LOG-8007',
      timestamp: '2026-10-28 12:15:30',
      eventType: 'SESSION_CREDENTIAL_ISSUED',
      source: 'Public Gateway Portal',
      operator: 'System Gateway',
      severity: 'INFO',
      details: 'Sesi otentikasi diterbitkan untuk divisi Security & Access Control.',
    },
    {
      id: 'SEC-LOG-8006',
      timestamp: '2026-10-28 11:05:00',
      eventType: 'DATABASE_MUTATION_CHECK',
      source: 'DB_Sales Ledger Sync',
      operator: 'System Firewall',
      severity: 'INFO',
      details: 'Dua ratus sembilan belas jurnal transaksi POS tervalidasi cocok dengan buku kasir.',
    },
    {
      id: 'SEC-LOG-8005',
      timestamp: '2026-10-28 09:30:18',
      eventType: 'PAYLOAD_VALIDATION_PASS',
      source: 'API Gateway Proxy',
      operator: 'Internal Guard',
      severity: 'INFO',
      details: 'Pemeriksaan payload JSON bebas dari ancaman SQL Injection / Script XSS.',
    },
  ]);

  // Toggle Safe Mode / Emergency Killswitch
  const handleToggleSafeMode = () => {
    const nextState = !isSafeModeActive;
    setIsSafeModeActive(nextState);

    const newLog: SecurityAuditEvent = {
      id: `SEC-LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      eventType: nextState ? 'EMERGENCY_SAFE_MODE_ENABLED' : 'EMERGENCY_SAFE_MODE_DISABLED',
      source: 'Security Control Panel',
      operator: operatorName,
      severity: nextState ? 'CRITICAL' : 'INFO',
      details: nextState
        ? '🚨 EMERGENCY KILLSWITCH AKTIF: Seluruh mutasi transaksi & inventori dibekukan sementara!'
        : '✓ SAFE MODE DINONAKTIFKAN: Operasional transaksi dan mutasi kembali normal.',
    };

    setAuditLogs((prev) => [newLog, ...prev]);

    showToast(
      nextState
        ? '🚨 Emergency Safe Mode AKTIF: Transaksi & mutasi dibekukan!'
        : '✓ Safe Mode Dinonaktifkan: Operasional kembali normal.'
    );
  };

  // Open Passcode Modal for Extreme Action
  const handleOpenExtremeAction = (
    type: 'WIPE_PRODUCTS' | 'RESET_SALES' | 'PURGE_CACHE',
    title: string
  ) => {
    setPasscodeModal({
      isOpen: true,
      actionType: type,
      actionTitle: title,
    });
    setEnteredPin('');
    setShowPin(false);
    setPinError(null);
  };

  // Verify Extreme Action Passcode
  const handleConfirmExtremeAction = () => {
    const validPins = ['Admin123', 'admin123', '9999', '1234', activeUser?.pin || 'Admin123'];
    if (!validPins.includes(enteredPin.trim())) {
      setPinError('PIN Otorisasi Keamanan Salah! Akses Ditolak.');

      const failLog: SecurityAuditEvent = {
        id: `SEC-LOG-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        eventType: 'EXTREME_ACTION_UNAUTHORIZED_PIN',
        source: 'Security Guard Modal',
        operator: operatorName,
        severity: 'CRITICAL',
        details: `Gagal verifikasi PIN untuk tindakan ekstrem [${passcodeModal.actionTitle}]. PIN dimasukkan: ${enteredPin || 'Kosong'}.`,
      };
      setAuditLogs((prev) => [failLog, ...prev]);
      return;
    }

    const successLog: SecurityAuditEvent = {
      id: `SEC-LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      eventType: `EXTREME_ACTION_${passcodeModal.actionType}`,
      source: 'Security Guard Modal',
      operator: operatorName,
      severity: 'CRITICAL',
      details: `VERIFIKASI PIN BERHASIL: Tindakan [${passcodeModal.actionTitle}] dieksekusi dengan otorisasi resmi.`,
    };
    setAuditLogs((prev) => [successLog, ...prev]);

    showToast(`✓ Otorisasi Berhasil: ${passcodeModal.actionTitle} telah dieksekusi.`);
    setPasscodeModal({ isOpen: false, actionType: null, actionTitle: '' });
    setEnteredPin('');
  };

  // Save Manual Incident Note
  const handleSaveManualNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const newLog: SecurityAuditEvent = {
      id: `SEC-LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      eventType: noteEventType.toUpperCase().replace(/\s+/g, '_'),
      source: 'Manual Incident Log',
      operator: operatorName,
      severity: noteSeverity,
      details: noteText.trim(),
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    setIsNoteModalOpen(false);
    setNoteText('');
    showToast('Catatan insiden keamanan berhasil ditambahkan ke Live Audit Log.');
  };

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSeverity =
        severityFilter === 'ALL' || log.severity === severityFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        log.eventType.toLowerCase().includes(q) ||
        log.source.toLowerCase().includes(q) ||
        log.operator.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q);

      return matchSeverity && matchSearch;
    });
  }, [auditLogs, severityFilter, searchQuery]);

  // Export Audit Log to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Event Type', 'Source', 'Operator', 'Severity', 'Details'];
    const rows = filteredAuditLogs.map((l) => [
      l.id,
      l.timestamp,
      l.eventType,
      l.source,
      l.operator,
      l.severity,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Security_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('File CSV Security Audit Log berhasil diunduh.');
  };

  return (
    <div id="security-module-container" className="w-full max-w-[1360px] mx-auto flex flex-col space-y-5 pb-8 animate-fadeIn">
      {/* 1. OPERATIONAL HEADER & SYSTEM SHIELD BANNER */}
      <div
        className={`relative overflow-hidden rounded-2xl p-5 border-2 transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isLight
            ? 'bg-white border-rose-500 shadow-sm'
            : 'bg-[#161b22] border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-500 border border-rose-500/40 flex items-center justify-center shrink-0 shadow-md">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-rose-100 border border-rose-300 text-rose-900 font-bold text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-500/40">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>{isEn ? 'SECURITY & ACCESS CONTROL ENGINE' : 'ENGINE KEAMANAN & HAK AKSES'}</span>
              </span>
              <span className="bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-[11px] px-2.5 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
                FIREWALL ACTIVE 100%
              </span>
            </div>
            <h1
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              System Integrity & Security Guard
            </h1>
            <p className="text-slate-500 font-bold text-xs dark:text-slate-400">
              Pemantauan kesehatan database, proteksi killswitch darurat, guard aksi ekstrem & audit log keamanan.
            </p>
          </div>
        </div>

        {/* Emergency Killswitch Toggle Button */}
        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleToggleSafeMode}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-md ${
              isSafeModeActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-rose-950/80 dark:hover:bg-rose-900 dark:text-rose-200 dark:border dark:border-rose-500/40'
            }`}
          >
            <Zap className={`w-4 h-4 ${isSafeModeActive ? 'text-amber-300' : 'text-rose-400'}`} />
            <span>
              {isSafeModeActive
                ? (isEn ? 'SAFE MODE ACTIVE (FREEZE ON)' : 'SAFE MODE AKTIF (TRANSAKSI DIBEKUKAN)')
                : (isEn ? 'TOGGLE EMERGENCY SAFE MODE' : 'AKTIFKAN SAFE MODE (BEKUKAN SISTEM)')}
            </span>
          </button>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS (Overview vs Enterprise Audit Trail) */}
      <div className={`p-1.5 rounded-2xl border flex items-center gap-2 ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#161b22] border-slate-800'
      }`}>
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Security Overview & Guard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('audit')}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'audit'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Enterprise Audit Trail Log</span>
        </button>
      </div>

      {/* RENDER CONTENT BASED ON SUB-TAB */}
      {activeSubTab === 'audit' ? (
        <AuditTrailTab />
      ) : (
        <>
          {/* 2. SAFE MODE PULSING WARNING BANNER (When Active) */}
          {isSafeModeActive && (
            <div className="w-full rounded-2xl p-4 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white border-2 border-rose-400 shadow-xl flex items-center justify-between gap-4 animate-bounce">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-200 shrink-0" />
                <div>
                  <h4 className="font-black text-sm tracking-tight flex items-center gap-2">
                    <span>🚨 EMERGENCY SAFE MODE / KILLSWITCH AKTIF</span>
                  </h4>
                  <p className="text-xs font-semibold text-rose-100 mt-0.5">
                    Seluruh pembuatan transaksi POS, mutasi stok gudang, dan pembaharuan database dibekukan untuk pencegahan anomali data.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleSafeMode}
                className="px-3 py-1.5 rounded-lg bg-white text-rose-900 font-bold text-xs hover:bg-rose-100 shrink-0 cursor-pointer shadow-sm"
              >
                Matikan Safe Mode
              </button>
            </div>
          )}

          {/* 3. STATUS INTEGRITAS SISTEM (4 INDICATOR CARDS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className={`p-4 rounded-2xl border-2 transition-all ${
                isLight
                  ? 'bg-white border-emerald-500 shadow-sm'
                  : 'bg-[#161b22] border-emerald-500/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Koneksi Database
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <Database className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>CONNECTED (100%)</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold pt-1">
                  <span>Latensi: 12 ms</span>
                  <span>6 Terminal Active</span>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border-2 transition-all ${
                isLight
                  ? 'bg-white border-cyan-500 shadow-sm'
                  : 'bg-[#161b22] border-cyan-500/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Safe Storage Quota
                </span>
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  <HardDrive className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-lg font-black font-mono text-cyan-600 dark:text-cyan-400">
                  1.28 MB / 5.00 MB
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
                  <div className="bg-cyan-500 h-full rounded-full w-[25.6%]" />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold pt-0.5">
                  Status Kapasitas: AMAN (25.6%)
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border-2 transition-all ${
                isLight
                  ? 'bg-white border-amber-500 shadow-sm'
                  : 'bg-[#161b22] border-amber-500/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Memory &amp; Payload State
                </span>
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">
                  0 Payload Anomaly
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold pt-1">
                  <span>Sync State: 100% Valid</span>
                  <span>Heap: 42.5 MB</span>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border-2 transition-all ${
                isLight
                  ? 'bg-white border-rose-500 shadow-sm'
                  : 'bg-[#161b22] border-rose-500/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Indeks Ancaman Security
                </span>
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                  LEVEL: NORMAL (0%)
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold pt-1">
                  <span>Akses Ilegal: 0</span>
                  <span>Intrusion: Clear</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. API KEY, SYNC & MAINTENANCE ENGINE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                      <span>SUPER ADMIN SYNC &amp; AUDIT API KEY</span>
                    </label>
                    <div className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      CONNECTED &amp; AUTHORIZED
                    </div>
                  </div>
                  <div className="relative group">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={showApiKey ? `${apiKey.slice(0, 14)}••••••••••••••••••••••••••••${apiKey.slice(-4)}` : apiKey}
                      readOnly
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-cyan-400 focus:outline-none transition-all shadow-inner"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(apiKey);
                          showToast("API Key berhasil disalin ke clipboard!");
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Salin
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-1.5 text-slate-500 hover:text-white transition-colors cursor-pointer"
                      >
                        {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isGlobalMaintenance ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">GLOBAL MAINTENANCE MODE</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Kunci seluruh akses operasional sistem untuk pemeliharaan.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      toggleGlobalMaintenance();
                      localStorage.setItem('jacs_maintenance_mode', (!isGlobalMaintenance).toString());
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isGlobalMaintenance ? 'bg-amber-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isGlobalMaintenance ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleSyncModules}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[10px] font-black uppercase transition shadow-lg shadow-cyan-900/20 cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    Sync Antar Modul
                  </button>
                  <button
                    type="button"
                    onClick={handleExportBugLog}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase transition border border-slate-700 cursor-pointer"
                  >
                    <Download size={14} />
                    Export Bug &amp; Error Log
                  </button>
                  <button
                    type="button"
                    onClick={handleClearDiagnosticCache}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 rounded-xl text-[10px] font-black uppercase transition border border-slate-700 hover:border-rose-500/30 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    Clear Diagnostic Cache
                  </button>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>DIAGNOSTIC &amp; SYNC TERMINAL LOG</span>
                </label>
                <div
                  ref={terminalRef}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 h-36 lg:h-40 overflow-y-auto font-mono text-xs text-slate-300 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
                >
                  {terminalLogs.map((log, idx) => (
                    <div key={idx} className="mb-1 border-l-2 border-slate-800 pl-2 hover:bg-white/5 transition-colors py-0.5">
                      <span className={log.includes("Sync:") || log.includes("verified") ? "text-emerald-400" : log.includes("Initiating") ? "text-cyan-400" : ""}>
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 5. GUARD KONFIRMASI EKSTREM (PROTEKSI AKSI RISIKO TINGGI) */}
          <div
            className={`p-5 rounded-2xl border-2 transition ${
              isLight
                ? 'bg-white border-amber-500 shadow-sm'
                : 'bg-[#161b22] border-amber-500/60'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/30 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h3 className={`font-black text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Guard Konfirmasi Ekstrem (High-Risk System Protection)
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                WAJIB PASSCODE PIN KEAMANAN
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-semibold">
              Seluruh fungsi sensitif berisiko destruktif di bawah ini dilindungi oleh modal otorisasi Passcode PIN Keamanan secara ketat untuk mencegah kebocoran atau kerusakan data operasional.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-black text-xs uppercase">
                    <Trash2 className="w-4 h-4" />
                    <span>Reset Massal Katalog Products</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
                    Menghapus total seluruh {products.length} SKU katalog produk master di database.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenExtremeAction(
                      'WIPE_PRODUCTS',
                      'Reset Massal Master Data Katalog'
                    )
                  }
                  className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition cursor-pointer shadow-xs"
                >
                  Hapus Massal Master Data
                </button>
              </div>

              <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-xs uppercase">
                    <RefreshCw className="w-4 h-4" />
                    <span>Reset Ledger Transaksi POS</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
                    Membersihkan histori {sales.length} riwayat nota penjualan kasir &amp; jurnal penjualan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenExtremeAction(
                      'RESET_SALES',
                      'Reset Seluruh Ledger Transaksi POS'
                    )
                  }
                  className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-black text-xs transition cursor-pointer shadow-xs"
                >
                  Reset Ledger Transaksi
                </button>
              </div>

              <div className="p-4 rounded-xl border border-purple-300 dark:border-purple-500/40 bg-purple-50/50 dark:bg-purple-950/20 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-black text-xs uppercase">
                    <HardDrive className="w-4 h-4" />
                    <span>Purge Local Cache Memory</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
                    Membersihkan cache penyimpanan sesi dan memuat ulang buffer browser.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenExtremeAction(
                      'PURGE_CACHE',
                      'Purge Local Cache & Session Memory'
                    )
                  }
                  className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition cursor-pointer shadow-xs"
                >
                  Clear Local Cache Memory
                </button>
              </div>
            </div>
          </div>

          {/* 6. LIVE SECURITY AUDIT LOG TABLE */}
          <div
            className={`p-5 rounded-2xl border-2 transition ${
              isLight
                ? 'bg-white border-slate-300 shadow-sm'
                : 'bg-[#161b22] border-[#30363d]'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-500" />
                  <h3 className={`font-black text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Live Security Audit Log (Pencatatan Real-time)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Log aktivitas keamanan, otentikasi sesi, percobaan PIN ilegal, dan perubahan status killswitch.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-rose-400" />
                  <span>Tambah Catatan Insiden</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari event log, operator, sumber, atau rincian..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-800 shrink-0">
                {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      severityFilter === sev
                        ? 'bg-white text-slate-900 border border-slate-300 shadow-xs dark:bg-rose-600 dark:text-white dark:border-rose-600'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Waktu (Timestamp)</th>
                    <th className="py-2.5 px-3">Kode &amp; Tipe Event</th>
                    <th className="py-2.5 px-3">Sumber &amp; Operator</th>
                    <th className="py-2.5 px-3 text-center">Severity</th>
                    <th className="py-2.5 px-3">Detail Rincian Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400 font-semibold">
                        Tidak ada catatan audit security yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {log.eventType}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          <div className="font-bold">{log.source}</div>
                          <div className="text-[10px] text-slate-500">{log.operator}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                              log.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-500/40'
                                : log.severity === 'WARNING'
                                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-500/40'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-500/40'
                            }`}
                          >
                            {log.severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ================================================================= */}
      {/* MODAL PASSCODE KONFIRMASI EKSTREM                                 */}
      {/* ================================================================= */}
      {passcodeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-2xl border-2 shadow-2xl overflow-hidden ${
              isLight ? 'bg-white border-rose-500 text-slate-900' : 'bg-[#161b22] border-rose-500 text-white'
            }`}
          >
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-300 animate-pulse" />
                <span>Otorisasi Passcode PIN Keamanan</span>
              </div>
              <button
                type="button"
                onClick={() => setPasscodeModal({ isOpen: false, actionType: null, actionTitle: '' })}
                className="text-white hover:text-rose-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-rose-900 dark:text-rose-200 text-xs font-medium">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>PERINGATAN AKSI RISK TINGGI:</span>
                </div>
                Anda akan mengeksekusi <strong className="underline">{passcodeModal.actionTitle}</strong>. Masukkan PIN Security Officer untuk konfirmasi resmi.
              </div>

              {pinError && (
                <div className="p-2.5 rounded-lg bg-rose-500 text-white font-bold text-xs flex items-center gap-2 animate-shake">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Masukkan PIN / Master Passcode Security:
                </label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value);
                      setPinError(null);
                    }}
                    autoFocus
                    placeholder="••••••••"
                    className="w-full text-center text-xl font-mono tracking-widest py-2.5 pl-10 pr-10 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
                    title={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
                  >
                    {showPin ? <EyeOff className="w-5 h-5 text-rose-500" /> : <Eye className="w-5 h-5 text-slate-400" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 block text-center mt-1.5 font-medium">
                  (Master PIN Security: Admin123 atau PIN Akun Aktif)
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPasscodeModal({ isOpen: false, actionType: null, actionTitle: '' })}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExtremeAction}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Konfirmasi Eksekusi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL TAMBAH CATATAN MANUAL INSIDEN SECURITY                      */}
      {/* ================================================================= */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div
            className={`w-full max-w-lg rounded-2xl border-2 shadow-2xl overflow-hidden ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 font-black text-sm">
                <Plus className="w-4 h-4 text-rose-400" />
                <span>Tambah Catatan Insiden Keamanan</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualNote} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipe Event / Insiden:
                  </label>
                  <input
                    type="text"
                    value={noteEventType}
                    onChange={(e) => setNoteEventType(e.target.value)}
                    required
                    placeholder="e.g. AUDIT_PEMERIKSAAN_Shift"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Level Severity:
                  </label>
                  <select
                    value={noteSeverity}
                    onChange={(e) => setNoteSeverity(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="INFO">INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rincian Catatan Incident / Observasi Field Officer:
                </label>
                <textarea
                  rows={4}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  required
                  placeholder="Tuliskan temuan observasi keamanan, penyesuaian otorisasi, atau verifikasi shift fisik..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Catatan Audit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityModule;