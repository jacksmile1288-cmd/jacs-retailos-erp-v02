import React from 'react';

export interface JacSLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string;
  showSubtitle?: boolean;
  showErpBadge?: boolean;
  className?: string;
  isLight?: boolean;
  imgOnly?: boolean;
}

export const JacSLogo: React.FC<JacSLogoProps> = ({ imgOnly, className }) => {
  const [imgError, setImgError] = React.useState(false);

  const imageElement = (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-[#0d1117]/80 border border-[#30363d]/60 p-1 shadow-md ${className || ''}`}>
      {!imgError ? (
        <img
          src="/logo-jacs-enterprise.png"
          alt="JacS Enterprise Logo"
          className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(0,82,255,0.4)]"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg select-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
          J
        </div>
      )}
    </div>
  );

  if (imgOnly) {
    return imageElement;
  }

  return (
    <div className="flex items-center gap-3">
      {imageElement}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <h1 className="text-slate-900 font-black text-lg tracking-tight dark:text-white">
            JacS RetailOS
          </h1>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white leading-none shrink-0">
            ERP
          </span>
        </div>
        <p className="text-slate-800 font-bold text-xs dark:text-slate-200">Enterprise Retail Management</p>
      </div>
    </div>
  );
};
