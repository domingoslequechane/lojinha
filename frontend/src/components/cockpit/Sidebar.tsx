import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Zap, TrendingUp, ChevronLeft, ChevronRight,
  BellRing, Smartphone, Store, User, LogOut, ShieldCheck
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';
import { LoginhaLogo, LoginhaIcon } from '../common/LoginhaLogo';
import { formatMoney } from '../../utils/formatters';
import { ModulePermission } from '../../types';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  totalLeads: number;
  totalRevenue: number;
  pendingFollowUps: number;
  unreadLeadsCount?: number;
  connectedInstancesCount: number;
  isOwner?: boolean;
  userPermissions?: ModulePermission[];
  storeName?: string;
  storeLogoUrl?: string;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed, onToggleCollapse, activeTab, onSelectTab,
  totalLeads, totalRevenue, pendingFollowUps, unreadLeadsCount = 0,
  connectedInstancesCount, isOwner = true, userPermissions,
  storeName, storeLogoUrl, onLogout,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const allNavItems = [
    {
      id: 'cockpit', label: 'Cockpit Vendas', icon: LayoutDashboard,
      iconColor: '#C1F76B',
      badgeBg: 'rgba(193, 247, 107, 0.15)',
      badgeBorder: 'rgba(193, 247, 107, 0.3)',
      activeBg: '#C1F76B',
      activeText: '#0F2D26',
      indicatorColor: '#C1F76B',
      unreadBadge: unreadLeadsCount,
    },
    {
      id: 'quickreplies', label: 'Respostas Rápidas', icon: Zap,
      iconColor: '#f59e0b',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeBorder: 'rgba(245, 158, 11, 0.3)',
      activeBg: '#f59e0b',
      activeText: '#0F2D26',
      indicatorColor: '#f59e0b',
    },
    {
      id: 'leads', label: 'Contatos & Leads', icon: Users,
      iconColor: '#38bdf8',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      badgeBorder: 'rgba(56, 189, 248, 0.3)',
      activeBg: '#38bdf8',
      activeText: '#0F2D26',
      indicatorColor: '#38bdf8',
    },
    {
      id: 'metrics', label: 'Métricas & Funil', icon: TrendingUp,
      iconColor: '#a78bfa',
      badgeBg: 'rgba(167, 139, 250, 0.15)',
      badgeBorder: 'rgba(167, 139, 250, 0.3)',
      activeBg: '#a78bfa',
      activeText: '#0F2D26',
      indicatorColor: '#a78bfa',
    },
    {
      id: 'store', label: 'Minha Loja', icon: Store,
      iconColor: '#f472b6',
      badgeBg: 'rgba(244, 114, 182, 0.15)',
      badgeBorder: 'rgba(244, 114, 182, 0.3)',
      activeBg: '#f472b6',
      activeText: '#0F2D26',
      indicatorColor: '#f472b6',
    },
    {
      id: 'whatsapp', label: 'Conectar WhatsApp', icon: Smartphone,
      iconColor: '#27AE60',
      badgeBg: 'rgba(39, 174, 96, 0.15)',
      badgeBorder: 'rgba(39, 174, 96, 0.3)',
      activeBg: '#27AE60',
      activeText: '#FDFEF8',
      indicatorColor: '#27AE60',
      counter: connectedInstancesCount,
    },
    ...(isOwner
      ? [
          {
            id: 'team',
            label: 'Equipe & Acessos',
            icon: ShieldCheck,
            iconColor: '#10b981',
            badgeBg: 'rgba(16, 185, 129, 0.15)',
            badgeBorder: 'rgba(16, 185, 129, 0.3)',
            activeBg: '#10b981',
            activeText: '#0F2D26',
            indicatorColor: '#10b981',
          },
        ]
      : []),
  ];

  // Filter based on member permissions if not owner
  const navItems = isOwner
    ? allNavItems
    : allNavItems.filter((item) =>
        userPermissions ? userPermissions.includes(item.id as ModulePermission) : item.id === 'cockpit'
      );


  return (
    <aside
      className={`h-full hidden md:flex flex-col bg-[#0F2D26]/95 backdrop-blur-md border-r border-[#235447] transition-all duration-300 z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-[#235447]">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden select-none">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
              <img
                src="/sidebar-icon.png"
                alt="Lojinha"
                className="w-full h-full object-contain drop-shadow-sm select-none"
                draggable={false}
              />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span
                  className="font-baloo font-bold tracking-normal text-lg"
                  style={{
                    color: '#FDFEF8',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Loj<span style={{ color: '#C1F76B' }}>inha</span>
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide font-sans bg-[#C1F76B]/15 text-[#C1F76B] border border-[#C1F76B]/30">
                  PRO
                </span>
              </div>
              <span className="font-medium tracking-normal text-[9px] text-[#95BDB0]">
                A tua loja, simples.
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mx-auto w-8 h-8 flex items-center justify-center">
            <img
              src="/sidebar-icon.png"
              alt="Lojinha"
              className="w-full h-full object-contain drop-shadow-sm select-none"
              draggable={false}
            />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer"
          title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const hasUnread = (item.unreadBadge ?? 0) > 0;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 cursor-pointer group select-none relative ${
                collapsed ? 'justify-center p-2' : 'px-3 py-2 text-sm font-medium'
              } ${
                isActive
                  ? 'bg-[#14382F] text-[#FDFEF8] border border-[#235447] shadow-sm'
                  : 'text-[#95BDB0] hover:bg-[#14382F]/70 hover:text-[#FDFEF8] border border-transparent'
              }`}
              title={item.label}
            >
              {/* Active indicator bar */}
              {isActive && !collapsed && (
                <span
                  className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r"
                  style={{ backgroundColor: item.indicatorColor }}
                />
              )}

              {/* Icon Badge */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 relative"
                style={{
                  backgroundColor: isActive ? item.activeBg : item.badgeBg,
                  color: isActive ? item.activeText : item.iconColor,
                  border: `1px solid ${isActive ? 'transparent' : item.badgeBorder}`,
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <Icon className="w-4 h-4" />
                {/* Unread chat badge (red dot on icon when collapsed) */}
                {hasUnread && collapsed && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white font-extrabold text-[9px] flex items-center justify-center ring-2 ring-[#0F2D26]">
                    {(item.unreadBadge ?? 0) > 99 ? '99+' : item.unreadBadge}
                  </span>
                )}
              </div>

              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className={`truncate ${isActive ? 'font-semibold text-[#FDFEF8]' : ''}`}>
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Unread chats badge (expanded sidebar) */}
                    {hasUnread && (
                      <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white font-extrabold text-[9px] flex items-center justify-center">
                        {(item.unreadBadge ?? 0) > 99 ? '99+' : item.unreadBadge}
                      </span>
                    )}
                    {item.counter !== undefined && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: 'rgba(193, 247, 107, 0.15)', color: '#C1F76B' }}
                      >
                        {item.counter}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* KPI Summary */}
      {!collapsed ? (
        <div className="p-3 m-2 rounded-xl bg-[#14382F] border border-[#235447] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#95BDB0]">Leads Ativos:</span>
            <span className="font-semibold text-[#FDFEF8]">{totalLeads}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#95BDB0]">Valor no Funil:</span>
            <span className="font-bold text-[#C1F76B]">{formatMoney(totalRevenue)}</span>
          </div>
          {pendingFollowUps > 0 && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#235447] text-amber-400">
              <span className="flex items-center gap-1">
                <BellRing className="w-3.5 h-3.5 animate-pulse" /> Follow-ups:
              </span>
              <span className="font-bold">{pendingFollowUps} hoje</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-2 flex flex-col items-center gap-2 border-t border-[#235447]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#C1F76B]" title="Conectado" />
        </div>
      )}

      {/* Account Footer */}
      <div
        onClick={() => onSelectTab('account')}
        className={`p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 active:scale-[0.98] group ${
          collapsed ? 'justify-center' : ''
        } ${
          activeTab === 'account'
            ? 'bg-[#14382F] border-t-2 border-t-[#C1F76B]'
            : 'bg-[#0B241D] hover:bg-[#14382F] border-t border-[#235447]'
        }`}
        title="Minha Conta"
      >
        <div className="relative flex-shrink-0">
          {storeLogoUrl ? (
            <img
              src={storeLogoUrl}
              alt={storeName || 'Loja'}
              className="w-9 h-9 rounded-full object-cover border border-[#C1F76B]/40 transition-all duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#14382F] border border-[#C1F76B]/40 flex items-center justify-center text-[#C1F76B] transition-all duration-200 group-hover:scale-105">
              <User className="w-4 h-4" />
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#C1F76B] ring-2 ring-[#0F2D26]" />
        </div>

        {!collapsed && (
          <div className="truncate flex-1">
            <p
              className={`text-xs font-semibold truncate transition-colors ${
                activeTab === 'account' ? 'text-[#C1F76B]' : 'text-[#FDFEF8] group-hover:text-[#C1F76B]'
              }`}
            >
              {storeName || 'Minha Loja'}
            </p>
            <p className="text-[10px] text-[#95BDB0] truncate">Minha Conta</p>
          </div>
        )}

        {!collapsed && onLogout && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowLogoutConfirm(true);
            }}
            className="p-1.5 rounded-lg text-[#95BDB0] hover:text-red-400 hover:bg-red-500/15 transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer opacity-70 group-hover:opacity-100"
            title="Sair da Conta"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Encerrar Sessão"
        message="Tem certeza que deseja sair da sua conta no Loginha?"
        confirmText="Sair da Conta"
        cancelText="Cancelar"
        confirmVariant="danger"
        iconType="logout"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout?.();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </aside>
  );
};
