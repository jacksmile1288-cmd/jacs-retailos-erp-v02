import React from 'react';
import { Topbar } from './Topbar';
import { TelemetryBar } from './TelemetryBar';

export interface HeaderProps {
  onOpenMobileMenu?: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      <Topbar onOpenMobileMenu={onOpenMobileMenu} />
    </div>
  );
};

export { TelemetryBar };
export default Header;
