import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  SlidersHorizontal, 
  Wifi, 
  Clock,
  FileSpreadsheet, 
  CopySlash,
  Bell,
  X,
  Download,
  Settings
} from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenColumnManager: () => void;
  onOpenNewLead: () => void;
  onOpenFollowUpList: () => void;
  onOpenImportCsv?: () => void;
  onOpenDeduplicate?: () => void;
  pendingFollowUpsCount: number;
  totalFilteredLeads: number;
  activeInstanceName?: string;
  activeInstanceStatus?: string;
  onNavigateToWhatsApp?: () => void;
  onOpenPwaModal?: () => void;
  onOpenAccountSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  onSearchChange,
  onOpenColumnManager,
  onOpenNewLead,
  onOpenFollowUpList,
  onOpenImportCsv,
  onOpenDeduplicate,
  pendingFollowUpsCount,
  totalFilteredLeads,
  activeInstanceName = 'Vendas Tablets',
  activeInstanceStatus = 'disconnected',
  onNavigateToWhatsApp,
  onOpenPwaModal,
  onOpenAccountSettings,
}) => {
  const { canInstall, isInstalled, install } = usePwaInstall();
  const [isSearchOpenMobile, setIsSearchOpenMobile] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const isOnline = activeInstanceStatus === 'connected';
  const isConnecting = activeInstanceStatus === 'connecting';

  useEffect(() => {
    if (isSearchOpenMobile) {
      mobileInputRef.current?.focus();
    }
  }, [isSearchOpenMobile]);

  return (
    <header className="fixed top-2.5 sm:top-4 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-7xl z-50 bg-[#0F2D26]/95 backdrop-blur-md border border-[#235447] rounded-2xl sm:rounded-3xl shadow-2xl px-4 sm:px-6 py-3 flex items-center justify-between gap-2 transition-all duration-300 pointer-events-auto md:static md:left-auto md:translate-x-0 md:w-full md:max-w-none md:border-b md:border-t-0 md:border-x-0 md:rounded-none md:shadow-none flex-shrink-0">
      {/* Mobile Expandable Search Bar (Active state) */}
      {isSearchOpenMobile ? (
        <div className="md:hidden flex items-center gap-2 w-full animate-in fade-in duration-150">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#95BDB0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={mobileInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Pesquisar por nome, telefone..."
              className="w-full h-9 bg-[#14382F] text-xs text-[#FDFEF8] placeholder-[#95BDB0] pl-9 pr-8 rounded-xl border border-[#C1F76B] focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#95BDB0] hover:text-[#FDFEF8]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsSearchOpenMobile(false);
              onSearchChange('');
            }}
            className="p-2 rounded-xl bg-[#14382F] text-[#95BDB0] hover:text-[#FDFEF8] border border-[#235447] flex-shrink-0"
            title="Fechar busca"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Brand Logo & Name (visible only on mobile devices) */}
          <div className="flex md:hidden items-center gap-2.5 flex-shrink-0 select-none group">
            <div className="w-8 h-8 rounded-xl bg-[#14382F] border border-[#235447] flex items-center justify-center p-1 transition-transform group-hover:scale-105">
              <img src="/sidebar-icon.png" alt="Lojinha" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-baloo font-bold text-xl text-[#FDFEF8] leading-none">
                Loj<span className="text-[#C1F76B]">inha</span>
              </span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide font-sans bg-[#C1F76B]/15 text-[#C1F76B] border border-[#C1F76B]/30">
                PRO
              </span>
            </div>
          </div>

          {/* Desktop Search Bar (Always visible on md+) */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-md min-w-0 mr-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#95BDB0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Pesquisar contatos, clientes ou mensagens..."
                className="w-full h-10 bg-[#14382F] text-xs sm:text-sm text-[#FDFEF8] placeholder-[#95BDB0] pl-10 pr-4 rounded-xl border border-[#235447] focus:border-[#C1F76B] focus:ring-1 focus:ring-[#C1F76B]/50 focus:outline-none transition-all"
              />
              {searchTerm && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#95BDB0] bg-[#0F2D26] border border-[#235447] px-1.5 py-0.5 rounded">
                  {totalFilteredLeads}
                </span>
              )}
            </div>
          </div>

          {/* Center: Evolution Connection (Desktop) */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={onNavigateToWhatsApp}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer ${
                isOnline
                  ? 'bg-[#14382F]/90 border-[#C1F76B]/40 text-[#FDFEF8]'
                  : isConnecting
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-[#14382F]/60 border-[#235447] text-[#95BDB0]'
              }`}
              title="Clique para gerenciar suas contas de WhatsApp"
            >
              <span className="relative flex h-2 w-2">
                {isOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C1F76B] opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isOnline ? 'bg-[#C1F76B]' : isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-zinc-500'
                  }`}
                ></span>
              </span>
              <Wifi className={`w-3.5 h-3.5 ${isOnline ? 'text-[#C1F76B]' : isConnecting ? 'text-amber-400' : 'text-zinc-500'}`} />
              <span className="text-[#95BDB0]">WhatsApp:</span>
              <span className="text-[#FDFEF8] font-medium truncate max-w-[120px]">{activeInstanceName}</span>
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Mobile Search Expand Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpenMobile(true)}
              className="md:hidden p-2 rounded-xl bg-[#14382F] hover:bg-[#184339] text-[#95BDB0] hover:text-[#C1F76B] border border-[#235447] active:scale-95 transition-all"
              title="Pesquisar"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* PWA Install Button (Mobile) */}
            {!isInstalled && (
              <button
                type="button"
                onClick={async () => {
                  const res = await install();
                  if (res === 'manual') {
                    onOpenPwaModal?.();
                  }
                }}
                className="md:hidden p-2 rounded-xl bg-[#14382F] hover:bg-[#184339] text-[#C1F76B] border border-[#C1F76B]/40 active:scale-95 transition-all"
                title="Instalar Aplicativo"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {/* Notification Bell (Follow-ups & Alerts) */}
            <button
              type="button"
              onClick={onOpenFollowUpList}
              className={`p-2 rounded-xl relative transition-all active:scale-95 cursor-pointer ${
                pendingFollowUpsCount > 0
                  ? 'bg-amber-500/15 border border-amber-500/35 text-amber-300 animate-pulse'
                  : 'bg-[#14382F] border border-[#235447] text-[#95BDB0] hover:text-[#FDFEF8]'
              }`}
              title={pendingFollowUpsCount > 0 ? `${pendingFollowUpsCount} Notificações de Follow-up` : 'Notificações & Follow-ups'}
            >
              <Bell className="w-4 h-4" />
              {pendingFollowUpsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-400 text-[#0F2D26] font-extrabold text-[9px] flex items-center justify-center ring-2 ring-[#0F2D26]">
                  {pendingFollowUpsCount}
                </span>
              )}
            </button>

            {/* PWA Install Button (Desktop) */}
            {!isInstalled && (
              <button
                type="button"
                onClick={async () => {
                  const res = await install();
                  if (res === 'manual') {
                    onOpenPwaModal?.();
                  }
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#14382F] hover:bg-[#C1F76B]/15 hover:border-[#C1F76B]/60 text-[#C1F76B] rounded-xl text-xs font-semibold border border-[#C1F76B]/30 transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                title="Instalar aplicativo no computador ou celular"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Instalar App</span>
              </button>
            )}

            {/* Varredura de Duplicados (Desktop) */}
            {onOpenDeduplicate && (
              <button
                onClick={onOpenDeduplicate}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#14382F] hover:bg-amber-500/20 hover:border-amber-400/50 text-amber-300 rounded-xl text-xs font-medium border border-[#235447] transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                title="Escanear e limpar leads duplicados por telefone"
              >
                <CopySlash className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline">Varredura</span>
              </button>
            )}

            {/* Importar CSV (Desktop) */}
            {onOpenImportCsv && (
              <button
                onClick={onOpenImportCsv}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#14382F] hover:bg-[#184339] hover:border-[#C1F76B]/40 text-[#D1EAE0] hover:text-[#C1F76B] rounded-xl text-xs font-medium border border-[#235447] transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                title="Importar lista de clientes via planilha CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#C1F76B]" />
                <span className="hidden md:inline">Importar CSV</span>
              </button>
            )}

            {/* Ajustar Funil (Desktop) */}
            <button
              onClick={onOpenColumnManager}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-[#14382F] hover:bg-[#184339] hover:border-[#C1F76B]/40 text-[#FDFEF8] rounded-xl text-xs font-medium border border-[#235447] transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C1F76B]" />
              <span>Ajustar Funil</span>
            </button>

            {/* Novo Lead Button (Desktop Only CTA) */}
            <button
              onClick={onOpenNewLead}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-[#C1F76B]/20 hover:shadow-[#C1F76B]/40 flex-shrink-0"
              style={{ backgroundColor: '#C1F76B', color: '#0F2D26' }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Novo Lead</span>
            </button>
          </div>
        </>
      )}
    </header>
  );
};

