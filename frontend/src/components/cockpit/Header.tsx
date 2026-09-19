import React from 'react';
import { 
  Search, 
  Plus, 
  SlidersHorizontal, 
  Wifi, 
  Clock,
  FileSpreadsheet,
  CopySlash
} from 'lucide-react';

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
}) => {
  const isOnline = activeInstanceStatus === 'connected';
  const isConnecting = activeInstanceStatus === 'connecting';

  return (
    <header className="h-16 bg-[#0F2D26] border-b border-[#235447] px-3 sm:px-4 flex items-center justify-between gap-2.5 sm:gap-4 z-20 select-none flex-shrink-0">
      {/* Mobile Brand Icon & Logo (Visible only when desktop sidebar is hidden) */}
      <div className="md:hidden flex items-center gap-2 flex-shrink-0">
        <img src="/sidebar-icon.png" alt="Lojinha" className="w-7 h-7 object-contain" />
        <span className="font-baloo font-bold text-base text-[#FDFEF8] leading-none">
          Loj<span className="text-[#C1F76B]">inha</span>
        </span>
      </div>

      {/* Left / Center: Search & Filter */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md min-w-0">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#95BDB0] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Pesquisar..."
            className="w-full h-9 sm:h-10 bg-[#14382F] text-xs sm:text-sm text-[#FDFEF8] placeholder-[#95BDB0] pl-9 pr-3 sm:pl-10 sm:pr-4 rounded-xl border border-[#235447] focus:border-[#C1F76B] focus:ring-1 focus:ring-[#C1F76B]/50 focus:outline-none transition-all"
          />
          {searchTerm && (
            <span className="hidden sm:inline absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#95BDB0] bg-[#0F2D26] border border-[#235447] px-1.5 py-0.5 rounded">
              {totalFilteredLeads}
            </span>
          )}
        </div>
      </div>

      {/* Center: Evolution Connection & Quick Alert Badge */}
      <div className="hidden lg:flex items-center gap-4">
        {/* Evolution API Status */}
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
          <span className="text-[#FDFEF8] font-medium truncate max-w-[140px]">{activeInstanceName}</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
              isOnline
                ? 'text-[#C1F76B] bg-[#C1F76B]/15'
                : isConnecting
                ? 'text-amber-400 bg-amber-400/15'
                : 'text-zinc-400 bg-zinc-700/30'
            }`}
          >
            {isOnline ? 'Online' : isConnecting ? 'Conectando...' : 'Desconectado'}
          </span>
        </button>


        {/* Follow-up reminder alert pill */}
        {pendingFollowUpsCount > 0 && (
          <button
            onClick={onOpenFollowUpList}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 hover:bg-amber-500/25 text-xs font-medium transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer animate-pulse"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{pendingFollowUpsCount} Follow-ups Agendados</span>
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* Mobile Follow-up alert icon button */}
        {pendingFollowUpsCount > 0 && (
          <button
            onClick={onOpenFollowUpList}
            className="lg:hidden p-2 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 relative transition-all active:scale-95 cursor-pointer animate-pulse"
            title={`${pendingFollowUpsCount} Follow-ups Agendados`}
          >
            <Clock className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-400 text-[#0F2D26] font-extrabold text-[9px] flex items-center justify-center">
              {pendingFollowUpsCount}
            </span>
          </button>
        )}

        {/* Varredura de Duplicados */}
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

        {/* Importar CSV */}
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

        {/* Ajustar Funil */}
        <button
          onClick={onOpenColumnManager}
          className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-[#14382F] hover:bg-[#184339] hover:border-[#C1F76B]/40 text-[#FDFEF8] rounded-xl text-xs font-medium border border-[#235447] transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#C1F76B]" />
          <span>Ajustar Funil</span>
        </button>

        {/* Novo Lead Button (Loginha Signature Lime CTA) */}
        <button
          onClick={onOpenNewLead}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-[#C1F76B]/20 hover:shadow-[#C1F76B]/40"
          style={{ backgroundColor: '#C1F76B', color: '#0F2D26' }}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden xs:inline sm:inline">Novo Lead</span>
          <span className="xs:hidden sm:hidden">Novo</span>
        </button>
      </div>
    </header>
  );
};
