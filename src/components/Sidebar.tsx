import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Terminal as TerminalIcon,
  LogOut,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onLockPublicGateway?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onCloseMobile,
  onLockPublicGateway,
}) => {
  const {
    activeNav,
    setActiveNav,
    isSidebarCollapsed,
    toggleSidebar,
    contextualProfile,
    logout,
    t,
  } = useApp();

  const role = contextualProfile?.exactRole || 'staff';

  const getNavItemsByRole = (): NavItem[] => {
    switch (role) {
      case 'executive':
        return [
          { id: 'executive', label: t('nav_executive'), icon: ShieldCheck },
        ];

      case 'superadmin':
        return [
          { id: 'admin', label: t('nav_admin'), icon: TerminalIcon, badge: 'ROOT' },
          { id: 'executive', label: t('nav_executive'), icon: ShieldCheck },
        ];

      case 'finance':
        return [
          { id: 'finance', label: t('nav_finance'), icon: DollarSign },
        ];

      case 'purchasing':
        return [
          { id: 'purchasing', label: t('nav_purchasing'), icon: ShoppingCart },
        ];

      case 'kasir':
        return [
          { id: 'pos', label: t('nav_pos'), icon: TerminalIcon },
        ];

      case 'warehouse':
        return [
          { id: 'warehouse', label: t('nav_warehouse'), icon: Package },
        ];

      case 'hr':
        return [
          { id: 'hr', label: t('nav_hr'), icon: Users },
        ];

      default:
        return [
          { id: 'pos', label: t('nav_pos'), icon: TerminalIcon },
        ];
    }
  };

  const navItems = getNavItemsByRole();

  const handleLogoutClick = () => {
    logout();
    if (onLockPublicGateway) {
      onLockPublicGateway();
    }
  };

  return (
    <aside
      className={`relative flex flex-col h-full bg-slate-950 border-r border-cyan-900/30 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        {!isSidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="font-['Plus_Jakarta_Sans'] text-sm font-normal text-cyan-400 tracking-wider truncate">
              JacS Enterprise
            </h1>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {contextualProfile.position}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors cursor-pointer"
          title="Toggle Sidebar"
        >
          <TerminalIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {!isSidebarCollapsed && (
          <div className="px-3 mb-2 text-[10px] font-semibold text-slate-300 tracking-wider uppercase">
            MENU WEWENANG DIVISI
          </div>
        )}

        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeNav === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveNav(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-medium transition-all duration-200 group cursor-pointer ${
                isActive
                  ? 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border border-transparent'
              }`}
            >
              <IconComponent
                className={`w-5 h-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />

              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-cyan-900/60 border border-cyan-700/50 text-cyan-300 rounded">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
        <button
          type="button"
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/30 hover:border hover:border-rose-900/50 transition-all group cursor-pointer"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 text-rose-500 group-hover:text-rose-400" />
          {!isSidebarCollapsed && <span className="truncate">{t('btn_logout')}</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;