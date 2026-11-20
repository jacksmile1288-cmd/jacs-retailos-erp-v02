import React from 'react';
import { Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { PayrollTab } from './PayrollTab';
import {
  calculateCashierCommission,
  isCashierEmployee,
  parsePeriodToYearMonth,
  CashierCommissionResult,
} from '../../context/AppContext';

export interface CashierCommissionSlipItemProps {
  commission: number;
  salesTotal: number;
  transactionCount: number;
  ratePercent?: number;
  periodMonth?: string;
  isLight?: boolean;
  isEn?: boolean;
}

/**
 * Komponen Rincian "Komisi Penjualan POS (1%)" pada slip gaji kasir
 */
export const CashierCommissionSlipItem: React.FC<CashierCommissionSlipItemProps> = ({
  commission,
  salesTotal,
  transactionCount,
  ratePercent = 1,
  periodMonth,
  isLight = false,
  isEn = false,
}) => {
  return (
    <div
      className={`p-3 rounded-xl border transition-all duration-200 font-sans ${
        isLight
          ? 'bg-emerald-50 border-emerald-500/60 text-slate-900 shadow-[0_0_12px_rgba(16,185,129,0.12)]'
          : 'bg-emerald-950/25 border-emerald-500/40 text-white shadow-[0_0_12px_rgba(16,185,129,0.1)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${
            isLight
              ? 'bg-white text-emerald-600 border-emerald-500/50'
              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-emerald-700 dark:text-emerald-400">
                {isEn ? `POS Sales Commission (${ratePercent}%)` : `Komisi Penjualan POS (${ratePercent}%)`}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-normal uppercase tracking-widest border ${
                isLight
                  ? 'bg-white text-emerald-700 border-emerald-500/50'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
              }`}>
                {isEn ? 'Cashier Bonus' : 'Insentif Kasir'}
              </span>
            </div>
            <div className="text-sm font-normal text-slate-600 dark:text-gray-400 mt-1">
              {isEn ? 'Sales Base:' : 'Basis Omzet POS:'}{' '}
              <span className="font-mono font-normal text-slate-900 dark:text-gray-200">
                Rp {salesTotal.toLocaleString('id-ID')}
              </span>{' '}
              •{' '}
              <span className="font-mono font-normal text-emerald-700 dark:text-emerald-400">
                {transactionCount}
              </span>{' '}
              {isEn ? 'COMPLETED trxs' : 'transaksi COMPLETED'}
              {periodMonth && (
                <span className="text-[11px] font-mono text-slate-500 dark:text-gray-500 ml-1">
                  ({periodMonth})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="font-mono font-medium text-base text-emerald-700 dark:text-emerald-400">
            + Rp {commission.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-gray-400 font-mono font-normal">
            {ratePercent}% &times; Rp {salesTotal.toLocaleString('id-ID')}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface PayrollModuleProps {
  isLight?: boolean;
  isEn?: boolean;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({
  isLight = false,
  isEn = false,
}) => {
  return <PayrollTab isLight={isLight} isEn={isEn} />;
};

// Re-export helper kalkulasi dan fungsi terkait
export {
  calculateCashierCommission,
  isCashierEmployee,
  parsePeriodToYearMonth,
  PayrollTab,
};
export type { CashierCommissionResult };
export default PayrollModule;
