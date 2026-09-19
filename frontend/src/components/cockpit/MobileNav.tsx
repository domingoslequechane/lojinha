import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Smartphone, 
  Menu, 
  X, 
  Zap, 
  Store, 
  FileSpreadsheet, 
  CopySlash, 
  SlidersHorizontal, 
  LogOut,
  ChevronRight,
  Wifi
} from 'lucide-react';
import { LoginhaLogo } from '../common/LoginhaLogo';

interface MobileNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  totalLeads: number;
  unreadLeadsCount?: number;
  connectedInstancesCount: number;
  storeName?: string;
  storeLogoUrl?: string;
  onOpenImportCsv?: () => void;
  onOpenDeduplicate?: () => void;
  onOpenColumnManager?: () => void;
  onLogout?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  totalLeads,
  unreadLeadsCount = 0,
  connectedInstancesCount,
  storeName = 'Minha Loja',
  storeLogoUrl,
  onOpenImportCsv,
  onOpenDeduplicate,
  onOpenColumnManager,
  onLogout,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainTabs = [
    {
      id: 'cockpit',
      label: 'Funil',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: Users,
      badge: unreadLeadsCount > 0 ? unreadLeadsCount : null,
    },
    {
      id: 'metrics',
      label: 'Métricas',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: Smartphone,
      isOnline: connectedInstancesCount > 0,
      badge: null,
    },
  ];

  const handleTabClick = (tabId: string) => {
    setIsMenuOpen(false);
    onSelectTab(tabId);
  };

  return (
    <>
      {/* Fixed Bottom Navigation Bar (Mobile only) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0F2D26] border-t border-[#235447] flex items-center justify-around px-2 pb-safe md:hidden select-none shadow-2xl">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && !isMenuOpen;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-150 active:scale-95 cursor-pointer ${
                isActive ? 'text-[#C1F76B]' : 'text-[#95BDB0] hover:text-[#FDFEF8]'
              }`}
            >
              {/* Active Pill Indicator */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-[#C1F76B] rounded-b-full shadow-sm shadow-[#C1F76B]" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 px-1 min-w-4 h-4 rounded-full bg-[#C1F76B] text-[#0F2D26] font-extrabold text-[9px] flex items-center justify-center ring-2 ring-[#0F2D26]">
                    {tab.badge}
                  </span>
                )}
                {tab.isOnline !== undefined && (
                  <span
                    className={`absolute -top-0.5 -right-1 w-2 h-2 rounded-full ring-2 ring-[#0F2D26] ${
                      tab.isOnline ? 'bg-[#C1F76B]' : 'bg-zinc-500'
                    }`}
                  />
                )}
              </div>
              <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Menu / Drawer Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-150 active:scale-95 cursor-pointer ${
            isMenuOpen || ['quickreplies', 'store', 'account'].includes(activeTab)
              ? 'text-[#C1F76B]'
              : 'text-[#95BDB0] hover:text-[#FDFEF8]'
          }`}
        >
          {isMenuOpen && (
            <span className="absolute top-0 w-8 h-1 bg-[#C1F76B] rounded-b-full shadow-sm shadow-[#C1F76B]" />
          )}
          <Menu className="w-5 h-5 stroke-2" />
          <span className="text-[10px] mt-1 font-medium">Menu</span>
        </button>
      </nav>

      {/* Slide-up Mobile Drawer / Sheet */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden select-none animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Sheet Container */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-[#0F2D26] border-t border-[#235447] rounded-t-3xl p-5 shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-bottom duration-250">
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-[#235447] rounded-full mx-auto mb-4" />

            {/* Header with store info and close */}
            <div className="flex items-center justify-between pb-4 border-b border-[#235447] mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#14382F] border border-[#235447] flex items-center justify-center overflow-hidden">
                  {storeLogoUrl ? (
                    <img src={storeLogoUrl} alt={storeName} className="w-full h-full object-cover" />
                  ) : (
                    <img src="/sidebar-icon.png" alt="Lojinha" className="w-6 h-6 object-contain" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#FDFEF8] leading-tight">{storeName}</h3>
                  <p className="text-[11px] text-[#95BDB0] flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#C1F76B]" />
                    {connectedInstancesCount > 0 ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-xl bg-[#14382F] text-[#95BDB0] hover:text-[#FDFEF8] border border-[#235447]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Actions */}
            <div className="space-y-1.5 py-1">
              <button
                type="button"
                onClick={() => handleTabClick('quickreplies')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                  activeTab === 'quickreplies'
                    ? 'bg-[#14382F] text-[#C1F76B] border border-[#235447]'
                    : 'bg-[#14382F]/60 hover:bg-[#14382F] text-[#FDFEF8] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold">Respostas Rápidas</p>
                    <p className="text-[10px] text-[#95BDB0]">Atalhos de texto e catálogo</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#95BDB0]" />
              </button>

              <button
                type="button"
                onClick={() => handleTabClick('store')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                  activeTab === 'store'
                    ? 'bg-[#14382F] text-[#C1F76B] border border-[#235447]'
                    : 'bg-[#14382F]/60 hover:bg-[#14382F] text-[#FDFEF8] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#C1F76B]/15 text-[#C1F76B] flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold">Minha Loja & Catálogo</p>
                    <p className="text-[10px] text-[#95BDB0]">Produtos, fotos e preços</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#95BDB0]" />
              </button>

              {/* Quick Actions inside drawer */}
              <div className="pt-2 pb-1">
                <p className="text-[10px] font-bold text-[#95BDB0] uppercase tracking-wider px-1 mb-2">
                  Ferramentas Rápidas
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {onOpenImportCsv && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenImportCsv();
                      }}
                      className="p-3 rounded-2xl bg-[#14382F]/80 border border-[#235447] flex flex-col items-center text-center gap-1.5 active:scale-95 transition-all"
                    >
                      <FileSpreadsheet className="w-5 h-5 text-[#C1F76B]" />
                      <span className="text-[10px] font-semibold text-[#FDFEF8]">Importar CSV</span>
                    </button>
                  )}

                  {onOpenDeduplicate && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenDeduplicate();
                      }}
                      className="p-3 rounded-2xl bg-[#14382F]/80 border border-[#235447] flex flex-col items-center text-center gap-1.5 active:scale-95 transition-all"
                    >
                      <CopySlash className="w-5 h-5 text-amber-400" />
                      <span className="text-[10px] font-semibold text-[#FDFEF8]">Duplicados</span>
                    </button>
                  )}

                  {onOpenColumnManager && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenColumnManager();
                      }}
                      className="p-3 rounded-2xl bg-[#14382F]/80 border border-[#235447] flex flex-col items-center text-center gap-1.5 active:scale-95 transition-all"
                    >
                      <SlidersHorizontal className="w-5 h-5 text-sky-400" />
                      <span className="text-[10px] font-semibold text-[#FDFEF8]">Funil</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Logout button */}
              {onLogout && (
                <div className="pt-3 border-t border-[#235447]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full py-2.5 px-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
