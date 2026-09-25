import React, { useRef, useEffect, useState } from 'react';
import { Plus, SlidersHorizontal, MessageSquare } from 'lucide-react';
import { ContactLead, KanbanColumn } from '../../types';
import { KanbanColumnComponent } from './KanbanColumnComponent';
import { KanbanCard } from './KanbanCard';
import { formatMoney } from '../../utils/formatters';

interface KanbanBoardProps {
  columns: KanbanColumn[];
  leads: ContactLead[];
  selectedLeadId: string | null;
  onSelectLead: (lead: ContactLead) => void;
  onMoveLead: (leadId: string, targetColumnId: string) => void;
  onEditColumn: (column: KanbanColumn) => void;
  onAddNewColumn: () => void;
  onOpenFollowUpModal: (lead: ContactLead) => void;
  onAddLeadToColumn: (columnId: string) => void;
  onToggleIncludeInPipeline?: (columnId: string) => void;
  canManageColumns?: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  leads,
  selectedLeadId,
  onSelectLead,
  onMoveLead,
  onEditColumn,
  onAddNewColumn,
  onOpenFollowUpModal,
  onAddLeadToColumn,
  onToggleIncludeInPipeline,
  canManageColumns = true,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  // Mobile active stage state
  const [activeMobileColumnId, setActiveMobileColumnId] = useState<string>(
    sortedColumns[0]?.id || ''
  );
  const mobilePillsContainerRef = useRef<HTMLDivElement>(null);

  // Fallback to first column if active id is invalid
  const currentMobileColId = sortedColumns.some((c) => c.id === activeMobileColumnId)
    ? activeMobileColumnId
    : sortedColumns[0]?.id || '';

  const activeMobileCol = sortedColumns.find((c) => c.id === currentMobileColId) || sortedColumns[0];
  const activeMobileColIndex = sortedColumns.findIndex((c) => c.id === activeMobileCol?.id);

  // Filter leads for the active mobile column
  const activeMobileLeads = leads
    .filter((lead) => {
      if (!activeMobileCol) return false;
      if (lead.columnId === activeMobileCol.id) return true;
      if (activeMobileColIndex === 0 && (!lead.columnId || !sortedColumns.some((c) => c.id === lead.columnId))) {
        return true;
      }
      return false;
    })
    .sort((a, b) => {
      const aUnread = (a.unreadCount || 0) > 0 ? 1 : 0;
      const bUnread = (b.unreadCount || 0) > 0 ? 1 : 0;
      if (bUnread !== aUnread) return bUnread - aUnread;
      return (Number(b.lastMessageTimestamp) || 0) - (Number(a.lastMessageTimestamp) || 0);
    });

  const activeMobileTotalValue = activeMobileLeads.reduce((acc, curr) => acc + curr.dealValue, 0);
  const activeMobileUnreadCount = activeMobileLeads.filter((l) => (l.unreadCount || 0) > 0).length;

  const handleSelectMobileStage = (colId: string) => {
    setActiveMobileColumnId(colId);
  };

  // Desktop scroll handler — works for both mouse wheel and trackpad:
  // - Trackpad horizontal swipe (deltaX > deltaY) → browser handles board horizontal scroll naturally
  // - Shift+wheel → explicit board horizontal scroll
  // - Mouse/trackpad vertical scroll inside a column → EXPLICITLY scrolls that column
  // - Mouse/trackpad vertical scroll on board background → scrolls board horizontally
  // - At column boundary (top/bottom) → redirects to board horizontal scroll
  // ⚠️ DO NOT remove this — without it, trackpad horizontal swipe and column scroll both break
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const handleWheel = (e: WheelEvent) => {
      // Only intercept on desktop
      if (window.innerWidth < 768) return;

      const absDeltaX = Math.abs(e.deltaX);
      const absDeltaY = Math.abs(e.deltaY);

      // Pure horizontal trackpad swipe → let browser handle naturally (board has overflow-x-auto)
      if (absDeltaX > absDeltaY) {
        return;
      }

      // Shift+scroll → explicit horizontal scroll
      if (e.shiftKey) {
        board.scrollLeft += e.deltaY;
        e.preventDefault();
        return;
      }

      // Walk up the DOM from the event target to find a scrollable column container
      const target = e.target as HTMLElement | null;
      let el: HTMLElement | null = target;
      let scrollableCol: HTMLElement | null = null;
      while (el && el !== board) {
        const ov = getComputedStyle(el).overflowY;
        if (el.scrollHeight > el.clientHeight + 2 && (ov === 'auto' || ov === 'scroll')) {
          scrollableCol = el;
          break;
        }
        el = el.parentElement;
      }

      if (scrollableCol) {
        const atTop = scrollableCol.scrollTop <= 0 && e.deltaY < 0;
        const atBottom =
          scrollableCol.scrollTop + scrollableCol.clientHeight >= scrollableCol.scrollHeight - 2 &&
          e.deltaY > 0;

        if (atTop || atBottom) {
          // At column boundary → redirect to horizontal board scroll
          board.scrollLeft += e.deltaY * 0.5;
        } else {
          // Inside column with room to scroll — explicitly scroll the column vertically.
          // This works for both mouse wheel (large discrete deltaY) and trackpad (small pixel deltaY).
          scrollableCol.scrollTop += e.deltaY;
        }
        // Always prevent default when inside a column — we handle everything explicitly
        e.preventDefault();
      } else {
        // On board background / column header → horizontal board scroll
        board.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };

    board.addEventListener('wheel', handleWheel, { passive: false });
    return () => board.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      {/* ── MOBILE VIEW: Natural Full-Page Funnel Flow ── */}
      <div
        className="md:hidden w-full max-w-full px-2.5 sm:px-3 overflow-x-hidden"
      >
        {/* Stage Navigation Pills: Sticky below floating top header */}
        <div className="sticky top-[0rem] z-30 w-full py-1 bg-[#091E19]/95 backdrop-blur-md border-b border-[#235447]/40 mb-1.5">
          <div
            ref={mobilePillsContainerRef}
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 w-full max-w-full"
          >
            {sortedColumns.map((col, idx) => {
              const count = leads.filter((lead) => {
                if (lead.columnId === col.id) return true;
                if (idx === 0 && (!lead.columnId || !sortedColumns.some((c) => c.id === lead.columnId))) {
                  return true;
                }
                return false;
              }).length;
              const isActive = col.id === currentMobileColId;

              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => handleSelectMobileStage(col.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#C1F76B] text-[#0F2D26] shadow-md shadow-[#C1F76B]/20 font-bold'
                      : 'bg-[#14382F] text-[#95BDB0] border border-[#235447] hover:text-[#FDFEF8]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isActive ? '#0F2D26' : col.color }}
                  />
                  <span>{col.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-[#0F2D26]/20 text-[#0F2D26]'
                        : 'bg-[#0F2D26] text-[#95BDB0]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Quick Add Stage Button */}
            <button
              type="button"
              onClick={onAddNewColumn}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-[#95BDB0] bg-[#14382F] border border-dashed border-[#235447] hover:text-[#C1F76B] hover:border-[#C1F76B] whitespace-nowrap flex-shrink-0 cursor-pointer"
              title="Nova Etapa"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Etapa</span>
            </button>
          </div>
        </div>

        {/* Active Stage Meta Header */}
        {activeMobileCol && (
          <div className="px-3 py-2 bg-[#0F2D26] border border-[#235447] rounded-2xl mb-2 flex items-center justify-between text-xs text-[#95BDB0] shadow-sm flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[#FDFEF8]">
                {activeMobileLeads.length} {activeMobileLeads.length === 1 ? 'cliente' : 'clientes'}
              </span>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={!canManageColumns}
                  onClick={() => onToggleIncludeInPipeline?.(activeMobileCol.id)}
                  className={`group relative inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                    activeMobileCol.includeInPipelineTotal !== false
                      ? 'bg-[#C1F76B]'
                      : 'bg-[#184339] border border-[#235447]'
                  } ${canManageColumns ? 'cursor-pointer hover:opacity-90 active:scale-95' : 'cursor-not-allowed opacity-50'}`}
                  title={
                    canManageColumns
                      ? (activeMobileCol.includeInPipelineTotal !== false
                          ? 'Retorno Esperado: ATIVADO (valor contabilizado no total). Clique para desativar.'
                          : 'Retorno Esperado: DESATIVADO (valor ignorado no total). Clique para ativar.')
                      : (activeMobileCol.includeInPipelineTotal !== false
                          ? 'Retorno esperado ativo'
                          : 'Retorno esperado inativo')
                  }
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full transition duration-200 ease-in-out ${
                      activeMobileCol.includeInPipelineTotal !== false
                        ? 'translate-x-3.5 bg-[#0F2D26]'
                        : 'translate-x-0.5 bg-[#95BDB0]/70'
                    }`}
                  />
                </button>
                <span className={`font-bold transition-all ${activeMobileCol.includeInPipelineTotal !== false ? 'text-[#C1F76B]' : 'text-[#95BDB0]/50 line-through'}`}>
                  {formatMoney(activeMobileTotalValue)}
                </span>
                {activeMobileCol.includeInPipelineTotal === false && (
                  <span className="text-[8px] font-bold uppercase text-amber-300/80 bg-amber-500/10 border border-amber-500/25 px-1 py-0.2 rounded">
                    Off
                  </span>
                )}
              </div>
              {activeMobileUnreadCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#C1F76B] bg-[#27AE60]/20 border border-[#27AE60]/40 px-2 py-0.5 rounded-full">
                  <MessageSquare className="w-2.5 h-2.5" />
                  {activeMobileUnreadCount} nova{activeMobileUnreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => onAddLeadToColumn(activeMobileCol.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14382F] hover:bg-[#184339] text-[#C1F76B] text-xs font-bold border border-[#235447] transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Adicionar</span>
              </button>

              <button
                type="button"
                onClick={() => onEditColumn(activeMobileCol)}
                className="p-1.5 rounded-lg text-[#95BDB0] hover:text-[#FDFEF8] bg-[#14382F] border border-[#235447] cursor-pointer"
                title="Editar Etapas"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Active Stage Leads: Natural flow in document */}
        <div className="space-y-2 pb-6">
          {activeMobileLeads.length === 0 ? (
            <div className="p-8 text-center text-[#95BDB0] bg-[#0F2D26] rounded-2xl border border-[#235447]">
              <p className="text-sm font-semibold text-[#FDFEF8]">Nenhum cliente nesta etapa</p>
              <p className="text-xs text-[#95BDB0] mt-1 mb-4">
                Adicione clientes ou mova-os a partir de outras etapas do funil.
              </p>
              {activeMobileCol && (
                <button
                  type="button"
                  onClick={() => onAddLeadToColumn(activeMobileCol.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C1F76B] text-[#0F2D26] text-xs font-bold shadow-md shadow-[#C1F76B]/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Adicionar Cliente</span>
                </button>
              )}
            </div>
          ) : (
            activeMobileLeads.map((lead) => (
              <KanbanCard
                key={lead.id}
                lead={lead}
                column={activeMobileCol}
                isSelected={lead.id === selectedLeadId}
                onSelect={onSelectLead}
                onDragStart={() => {}}
                onOpenFollowUpModal={onOpenFollowUpModal}
              />
            ))
          )}
        </div>
      </div>

      {/* ── DESKTOP VIEW: Multi-Column Horizontal Board ── */}
      <div
        ref={boardRef}
        className="hidden md:flex md:flex-1 md:h-full md:min-h-0 overflow-x-auto md:overflow-y-hidden px-3 sm:pl-4 sm:pr-0 py-3 bg-[#091E19] sm:snap-none"
      >
        <div className="flex items-stretch gap-3 sm:gap-4 h-full w-max min-w-full pr-3 sm:pr-4 pb-1">
          {sortedColumns.map((col, index) => {
            const colLeads = leads
              .filter((lead) => {
                if (lead.columnId === col.id) return true;
                if (index === 0 && (!lead.columnId || !sortedColumns.some((c) => c.id === lead.columnId))) {
                  return true;
                }
                return false;
              })
              .sort((a, b) => {
                const aUnread = (a.unreadCount || 0) > 0 ? 1 : 0;
                const bUnread = (b.unreadCount || 0) > 0 ? 1 : 0;
                if (bUnread !== aUnread) return bUnread - aUnread;
                return (Number(b.lastMessageTimestamp) || 0) - (Number(a.lastMessageTimestamp) || 0);
              });
            return (
              <KanbanColumnComponent
                key={col.id}
                column={col}
                leads={colLeads}
                selectedLeadId={selectedLeadId}
                onSelectLead={onSelectLead}
                onDropCard={onMoveLead}
                onEditColumn={onEditColumn}
                onOpenFollowUpModal={onOpenFollowUpModal}
                onAddLeadToColumn={onAddLeadToColumn}
                onToggleIncludeInPipeline={onToggleIncludeInPipeline}
                canManageColumns={canManageColumns}
              />
            );
          })}

          {/* Add New Column Button Card */}
          <div
            className="w-72 min-w-[280px] h-36 rounded-2xl border-2 border-dashed border-[#235447] hover:border-[#C1F76B] flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-200 group bg-[#14382F]/40 hover:bg-[#14382F]/70 hover:scale-[1.01] flex-shrink-0 self-start"
            onClick={onAddNewColumn}
          >
            <div className="w-10 h-10 rounded-full bg-[#184339] group-hover:bg-[#C1F76B] text-[#95BDB0] group-hover:text-[#0F2D26] flex items-center justify-center transition-all mb-2 shadow-sm">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <p className="text-sm font-semibold text-[#FDFEF8] group-hover:text-[#C1F76B] transition-colors">
              Adicionar Nova Etapa
            </p>
            <p className="text-xs text-[#95BDB0] mt-1">
              Personalize o seu funil de vendas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
