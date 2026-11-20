import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AuditLog } from '../../types';
import {
  ShieldCheck,
  Search,
  Lock,
  Clock,
  Filter,
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  FileCheck,
  Wallet,
  Activity,
} from 'lucide-react';

interface ExecutiveAuditLogTabProps {
  isDark: boolean;
}

type AuditCategoryFilter =
  | 'ALL'
  | 'VOID_POS'
  | 'EXCHANGE'
  | 'STOCK_OPNAME'
  | 'AP_PAYMENT'
  | 'PAYROLL';

const classifyAuditLog = (log: AuditLog): {
  key: AuditCategoryFilter | 'OTHER';
  label: string;
  tone: 'rose' | 'amber' | 'cyan' | 'indigo' | 'emerald' | 'slate';
} => {
  const cat = String(log.category || '').toUpperCase();
  const act = String(log.action || '').toUpperCase();
  const det = String(log.details || '').toUpperCase();
  const mod = String(log.module || '').toUpperCase();

  if (
    cat === 'VOID_POS' ||
    act.includes('VOID') ||
    det.includes('VOID / PEMBATALAN') ||
    det.includes('DIBATALKAN')
  ) {
    return { key: 'VOID_POS', label: 'Void / Batal POS', tone: 'rose' };
  }

  if (
    cat === 'EXCHANGE' ||
    act.includes('EXCHANGE') ||
    act.includes('RETURN') ||
    det.includes('TUKAR UKURAN') ||
    det.includes('PENUKARAN') ||
    det.includes('RETUR')
  ) {
    return { key: 'EXCHANGE', label: 'Penukaran Barang', tone: 'amber' };
  }

  if (
    cat === 'STOCK_OPNAME' ||
    act.includes('OPNAME') ||
    act.includes('STOCK_ADJUSTMENT') ||
    det.includes('STOCK OPNAME') ||
    det.includes('PENYESUAIAN STOK')
  ) {
    return { key: 'STOCK_OPNAME', label: 'Stock Opname', tone: 'cyan' };
  }

  if (
    cat === 'AP_PAYMENT' ||
    act.includes('AP_INVOICE_PAYMENT') ||
    act.includes('AP_PO_PAYMENT') ||
    act.includes('AP_OFFSET') ||
    det.includes('PELUNASAN FAKTUR AP') ||
    det.includes('PEMBAYARAN HUTANG')
  ) {
    return { key: 'AP_PAYMENT', label: 'Pelunasan AP', tone: 'indigo' };
  }

  if (
    cat === 'PAYROLL' ||
    act.includes('PAYROLL') ||
    det.includes('PENCAIRAN PAYROLL') ||
    mod.includes('PAYROLL')
  ) {
    return { key: 'PAYROLL', label: 'Payroll', tone: 'emerald' };
  }

  return { key: 'OTHER', label: log.module || 'Sistem', tone: 'slate' };
};

const extractNominal = (log: AuditLog): number | null => {
  if (typeof log.amount === 'number' && !Number.isNaN(log.amount) && log.amount > 0) {
    return log.amount;
  }
  const text = `${log.details || ''} ${log.action || ''}`;
  const match = text.match(/Rp\s?([\d.]+)/i);
  if (match && match[1]) {
    const parsed = Number(match[1].replace(/\./g, ''));
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return null;
};

const formatTimestamp = (raw: string): string => {
  if (!raw) return '-';
  const parsed = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const ExecutiveAuditLogTab: React.FC<ExecutiveAuditLogTabProps> = ({ isDark }) => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<AuditCategoryFilter>('ALL');

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (auditLogs || []).filter((log) => {
      const cls = classifyAuditLog(log);
      if (categoryFilter !== 'ALL' && cls.key !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        log.timestamp,
        log.user,
        log.division,
        log.module,
        log.action,
        log.details,
        cls.label,
        typeof log.amount === 'number' ? String(log.amount) : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [auditLogs, searchQuery, categoryFilter]);

  const getBadgeClasses = (tone: 'rose' | 'amber' | 'cyan' | 'indigo' | 'emerald' | 'slate') => {
    switch (tone) {
      case 'rose':
        return isDark
          ? 'bg-rose-500/15 text-rose-300 border-rose-500/35'
          : 'bg-rose-50 text-rose-700 border-rose-200';
      case 'amber':
        return isDark
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
          : 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cyan':
        return isDark
          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35'
          : 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'indigo':
        return isDark
          ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35'
          : 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'emerald':
        return isDark
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return isDark
          ? 'bg-slate-800 text-slate-300 border-slate-700'
          : 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const renderCategoryIcon = (key: AuditCategoryFilter | 'OTHER') => {
    switch (key) {
      case 'VOID_POS':
        return <AlertTriangle className="w-3 h-3 shrink-0" />;
      case 'EXCHANGE':
        return <ArrowLeftRight className="w-3 h-3 shrink-0" />;
      case 'STOCK_OPNAME':
        return <Boxes className="w-3 h-3 shrink-0" />;
      case 'AP_PAYMENT':
        return <FileCheck className="w-3 h-3 shrink-0" />;
      case 'PAYROLL':
        return <Wallet className="w-3 h-3 shrink-0" />;
      default:
        return <Activity className="w-3 h-3 shrink-0" />;
    }
  };

  return (
    <div
      id="executive-audit-log-tab"
      className={`p-5 rounded-2xl border transition-all space-y-4 ${
        isDark
          ? 'bg-slate-900/50 border-white/[0.08] backdrop-blur-xl'
          : 'bg-white border-slate-200 shadow-xs'
      }`}
    >
      {/* Header + Read-Only Badge */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b ${
          isDark ? 'border-white/[0.08]' : 'border-slate-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-purple-500/15 border-purple-500/35 text-purple-300'
                : 'bg-purple-50 border-purple-200 text-purple-700'
            }`}
          >
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Audit Log Aktivitas Sensitif
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                  isDark
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
                title="Log bersifat permanen dan tidak dapat dihapus dari antarmuka"
              >
                <Lock className="w-2.5 h-2.5" />
                <span>Read-Only · Permanen</span>
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Pencatatan otomatis Void POS, Penukaran Barang, Stock Opname, Pelunasan AP, dan Pencairan Payroll.
            </p>
          </div>
        </div>

        <div className={`text-xs font-mono tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Menampilkan <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{filteredLogs.length}</span> dari {(auditLogs || []).length} entri
        </div>
      </div>

      {/* Filter Pencarian Sederhana */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-executive-audit-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pengguna, divisi, aksi, nomor struk/faktur, atau nominal..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none transition ${
              isDark
                ? 'bg-[#0b1120] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-cyan-600'
            }`}
          />
        </div>

        <div className="relative sm:w-56">
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            id="select-executive-audit-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as AuditCategoryFilter)}
            className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs font-medium outline-none transition cursor-pointer ${
              isDark
                ? 'bg-[#0b1120] border-slate-700 text-slate-100 focus:border-cyan-400'
                : 'bg-slate-50 border-slate-300 text-slate-800 focus:bg-white focus:border-cyan-600'
            }`}
          >
            <option value="ALL">Semua Kategori Aksi</option>
            <option value="VOID_POS">Void / Batal POS</option>
            <option value="EXCHANGE">Penukaran Barang</option>
            <option value="STOCK_OPNAME">Koreksi Stock Opname</option>
            <option value="AP_PAYMENT">Pelunasan Faktur AP</option>
            <option value="PAYROLL">Pencairan Payroll</option>
          </select>
        </div>
      </div>

      {/* Tabel Read-Only Audit Log */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isDark ? 'border-white/[0.08] bg-[#0b1120]/60' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead
              className={`sticky top-0 z-10 border-b ${
                isDark
                  ? 'bg-slate-900 border-white/[0.08] text-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <tr className="text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3 whitespace-nowrap">Waktu</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Kategori &amp; Aksi</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Divisi / Pengguna</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Nominal</th>
                <th className="py-2.5 px-3">Detail Aktivitas</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDark ? 'divide-white/[0.05]' : 'divide-slate-100'
              }`}
            >
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className={`py-10 text-center text-xs ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Tidak ada catatan audit log yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const cls = classifyAuditLog(log);
                  const nominal = extractNominal(log);
                  const divisionLabel = log.division || log.module || '-';

                  return (
                    <tr
                      key={log.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap align-top">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                          <Clock className="w-3 h-3 shrink-0 opacity-70" />
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap align-top">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getBadgeClasses(
                            cls.tone
                          )}`}
                        >
                          {renderCategoryIcon(cls.key)}
                          <span>{cls.label}</span>
                        </span>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-[170px]">
                          {log.action}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap align-top">
                        <div className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {log.user || 'System'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {divisionLabel}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap align-top font-mono font-bold tabular-nums">
                        {nominal !== null ? (
                          <span
                            className={
                              cls.tone === 'rose'
                                ? 'text-rose-500 dark:text-rose-400'
                                : cls.tone === 'emerald'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isDark
                                ? 'text-cyan-300'
                                : 'text-slate-900'
                            }
                          >
                            Rp {nominal.toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      <td
                        className={`py-2.5 px-3 align-top text-xs leading-relaxed min-w-[260px] ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
