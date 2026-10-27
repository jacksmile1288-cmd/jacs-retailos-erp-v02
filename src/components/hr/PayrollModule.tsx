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
      className={`p-3 rounded-xl border transition-all duration-200 ${
        isLight
          ? 'bg-emerald-50/90 border-emerald-300 text-slate-800 shadow-xs'
          : 'bg-emerald-950/25 border-emerald-500/35 text-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                {isEn ? `POS Sales Commission (${ratePercent}%)` : `Komisi Penjualan POS (${ratePercent}%)`}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                {isEn ? 'Cashier Bonus' : 'Insentif Kasir'}
              </span>
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              {isEn ? 'Sales Base:' : 'Basis Omzet POS:'}{' '}
              <span className="font-mono font-bold text-slate-800 dark:text-gray-200">
                Rp {salesTotal.toLocaleString('id-ID')}
              </span>{' '}
              •{' '}
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {transactionCount}
              </span>{' '}
              {isEn ? 'COMPLETED trxs' : 'transaksi COMPLETED'}
              {periodMonth && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">
                  ({periodMonth})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
            + Rp {commission.toLocaleString('id-ID')}
          </div>
          <div className="text-[9px] text-gray-400 dark:text-gray-500 font-mono">
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
