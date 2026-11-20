import React, { useState, useMemo } from 'react';
import { useAudit } from '../../audit';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  Download,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lock,
} from 'lucide-react';

export const AuditTrailTab: React.FC = () => {
  const { logs, clearAuditBuffer, exportAuditLogsJSON } = useAudit();
  const { theme } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        const matchesSearch =
          log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.entityId && log.entityId.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesSeverity =
          selectedSeverity === 'ALL' || log.severity === selectedSeverity;
        const matchesModule =
          selectedModule === 'ALL' || log.module === selectedModule;

        return matchesSearch && matchesSeverity && matchesModule;
      })
      .reverse(); // Urutan terbaru di atas
  }, [logs, searchTerm, selectedSeverity, selectedModule]);

  const handleDownloadLogs = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(exportAuditLogsJSON());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `audit_trail_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'SECURITY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3" />
            {severity}
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            WARN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Info className="w-3 h-3" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-slate-800'
      }`}>
        <div>
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>Sistem Audit Trail & Immutability Log</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pencatatan real-time perubahan data, otorisasi transaksi, dan aktivitas sistem enterprise.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleDownloadLogs}
            disabled={logs.length === 0}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor JSON</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm('Hapus seluruh buffer log audit lokal saat ini?')) {
                clearAuditBuffer();
              }
            }}
            disabled={logs.length === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan</span>
          </button>
        </div>
      </div>

      {/* Filter & Kontrol Pencarian */}
      <div className={`p-3 rounded-2xl border flex flex-wrap items-center gap-3 ${
        theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#161b22] border-slate-800'
      }`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari user, aksi, ID entitas, modul..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-[#0d1117] border-slate-700 text-white'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-xl border focus:outline-none ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-[#0d1117] border-slate-700 text-white'
            }`}
          >
            <option value="ALL">Semua Tingkat</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="SECURITY">SECURITY</option>
          </select>

          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-xl border focus:outline-none ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-[#0d1117] border-slate-700 text-white'
            }`}
          >
            <option value="ALL">Semua Modul</option>
            <option value="AUTH">AUTH</option>
            <option value="POS">POS</option>
            <option value="WAREHOUSE">WAREHOUSE</option>
            <option value="FINANCE">FINANCE</option>
            <option value="PURCHASING">PURCHASING</option>
          </select>
        </div>
      </div>

      {/* Tabel Log */}
      <div className={`rounded-2xl border overflow-hidden ${
        theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#161b22] border-slate-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-mono uppercase text-[10px] tracking-wider ${
              theme === 'light' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#0d1117] text-slate-400 border-slate-800'
            }`}>
              <tr>
                <th className="px-4 py-3">Waktu (UTC)</th>
                <th className="px-4 py-3">Tingkat</th>
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-4 py-3">Modul / Aksi</th>
                <th className="px-4 py-3">Referensi Entitas</th>
                <th className="px-4 py-3">Status Jaringan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 font-mono text-xs">
                    Belum ada rekaman audit trail.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {getSeverityBadge(log.severity)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="font-bold">{log.userName}</div>
                      <div className="text-[10px] text-slate-500">{log.userRole}</div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-cyan-400 font-bold">{log.module}</span>
                      <span className="mx-1 text-slate-600">/</span>
                      <span className="font-mono text-[11px]">{log.action}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                      {log.entityId || '-'}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {log.clientMetadata?.isOffline ? (
                        <span className="text-amber-400 text-[10px] font-bold">Offline Sync</span>
                      ) : (
                        <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Online
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};