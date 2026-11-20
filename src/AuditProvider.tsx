import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { AuditContext, AuditLogEntry } from './audit';

const AUDIT_STORAGE_KEY = 'jacs_enterprise_audit_trail_v1';
const MAX_LOCAL_AUDIT_LOGS = 1000;

export interface AuditProviderProps {
  children: ReactNode;
}

export const AuditProvider: React.FC<AuditProviderProps> = ({ children }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(AUDIT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error('[AuditEngine] Gagal memuat buffer audit lokal:', err);
      return [];
    }
  });

  // Append-only persistence ke storage browser
  useEffect(() => {
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
    } catch (err) {
      console.warn('[AuditEngine] Kuota storage lokal penuh, memangkas entri tertua:', err);
      if (logs.length > 200) {
        const trimmed = logs.slice(-500);
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(trimmed));
      }
    }
  }, [logs]);

  const recordAudit = useCallback(
    (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'clientMetadata'>) => {
      const newEntry: AuditLogEntry = {
        ...entry,
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        clientMetadata: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node/Worker',
          isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
        },
      };

      setLogs((prev) => {
        const updated = [...prev, newEntry];
        return updated.length > MAX_LOCAL_AUDIT_LOGS
          ? updated.slice(-MAX_LOCAL_AUDIT_LOGS)
          : updated;
      });

      if (process.env.NODE_ENV !== 'production' || entry.severity === 'CRITICAL' || entry.severity === 'SECURITY') {
        console.info(`[AUDIT::${entry.severity}] [${entry.action}]`, newEntry);
      }
    },
    []
  );

  const clearAuditBuffer = useCallback(() => {
    setLogs([]);
    localStorage.removeItem(AUDIT_STORAGE_KEY);
  }, []);

  const exportAuditLogsJSON = useCallback(() => {
    return JSON.stringify(logs, null, 2);
  }, [logs]);

  return (
    <AuditContext.Provider
      value={{
        logs,
        recordAudit,
        clearAuditBuffer,
        exportAuditLogsJSON,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};