import React from 'react';
import { Delete, Check, DollarSign } from 'lucide-react';

interface VirtualNumpadProps {
  value: number;
  onChange: (val: number) => void;
  totalAmount: number;
}

export const VirtualNumpad: React.FC<VirtualNumpadProps> = ({
  value,
  onChange,
  totalAmount,
}) => {
  const handleDigit = (digit: string) => {
    const currentStr = value === 0 ? '' : value.toString();
    const nextStr = currentStr + digit;
    const nextNum = parseInt(nextStr, 10);
    if (!isNaN(nextNum) && nextNum <= 100000000) {
      onChange(nextNum);
    }
  };

  const handleBackspace = () => {
    const currentStr = value.toString();
    if (currentStr.length <= 1) {
      onChange(0);
    } else {
      const nextStr = currentStr.slice(0, -1);
      onChange(parseInt(nextStr, 10) || 0);
    }
  };

  const handleQuickNominal = (amount: number) => {
    onChange(amount);
  };

  const quickNominals = [
    { label: 'Uang Pas', amount: totalAmount },
    { label: '+10rb', amount: Math.ceil(totalAmount / 10000) * 10000 || 10000 },
    { label: '50rb', amount: 50000 },
    { label: '100rb', amount: 100000 },
    { label: '200rb', amount: 200000 },
    { label: '500rb', amount: 500000 },
  ];

  return (
    <div className="space-y-2.5">
      {/* Quick Cash Chips */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {quickNominals.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickNominal(item.amount)}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
              value === item.amount
                ? 'bg-amber-500 border-amber-400 text-black shadow-sm'
                : 'bg-[#0d1117] border-[#30363d] text-gray-300 hover:border-gray-500 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 3x4 Virtual Numpad */}
      <div className="grid grid-cols-3 gap-1.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              if (k === '⌫') {
                handleBackspace();
              } else {
                handleDigit(k);
              }
            }}
            className="h-11 sm:h-12 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-white font-bold text-lg border border-[#30363d] active:scale-95 transition cursor-pointer flex items-center justify-center select-none"
          >
            {k === '⌫' ? <Delete className="w-5 h-5 text-rose-400" /> : k}
          </button>
        ))}
      </div>
    </div>
  );
};
