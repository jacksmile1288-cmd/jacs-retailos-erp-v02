import React from 'react';

export type AuditActionType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_OVERRIDE_PIN'
  | 'POS_CHECKOUT'
  | 'POS_VOID_ITEM'
  | 'POS_DISCOUNT_APPLIED'
  | 'STOCK_ADJUSTMENT'
  | 'STOCK_RECEIVING'
  | 'PURCHASE_ORDER_CREATE'
  | 'PURCHASE_ORDER_PAYMENT'
  | 'SALARY_PAYROLL_RUN'
  | 'CONFIG_CHANGE';

export type AuditSeverity = 'INFO' | 'WARN' | 'CRITICAL' | 'SECURITY';

export interface AuditLogEntry {
  id: string;               // UUID v4 atau nanoid
  traceId: string;          // Korelasi session / transaksi ID
  timestamp: string;        // ISO 8601 UTC
  userId: string;
  userName: string;
  userRole: string;
  module: string;           // Divisi / Modul (POS, Warehouse, Finance, dsb.)
  action: AuditActionType;
  severity: AuditSeverity;
  entityId?: string;        // ID referensi (Invoice No, PO No, SKU)
  payloadBefore?: Record<string, any> | null;
  payloadAfter?: Record<string, any> | null;
  clientMetadata: {
    userAgent: string;
    isOffline: boolean;
  };
}

export interface AuditContextType {
  logs: AuditLogEntry[];
  recordAudit: (
    entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'clientMetadata'>
  ) => void;
  clearAuditBuffer: () => void;
  exportAuditLogsJSON: () => string;
}

export const AuditContext = React.createContext<AuditContextType | null>(null);

export const useAudit = (): AuditContextType => {
  const context = React.useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
};