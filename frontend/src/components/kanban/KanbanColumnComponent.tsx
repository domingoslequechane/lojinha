import React, { useState } from 'react';
import { Plus, Clock, MessageSquare, SlidersHorizontal } from 'lucide-react';
import { ContactLead, KanbanColumn } from '../../types';
import { KanbanCard } from './KanbanCard';
import { formatMoney } from '../../utils/formatters';

interface KanbanColumnComponentProps {
  column: KanbanColumn;
  leads: ContactLead[];
  selectedLeadId: string | null;
  onSelectLead: (lead: ContactLead) => void;
  onDropCard: (leadId: string, targetColumnId: string) => void;
  onEditColumn: (column: KanbanColumn) => void;
  onOpenFollowUpModal: (lead: ContactLead) => void;
  onAddLeadToColumn: (columnId: string) => void;
}

export const KanbanColumnComponent: React.FC<KanbanColumnComponentProps> = ({
  column,
  leads,
  selectedLeadId,
  onSelectLead,
  onDropCard,
  onEditColumn,
  onOpenFollowUpModal,
  onAddLeadToColumn,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const totalValue = leads.reduce((acc, curr) => acc + curr.dealValue, 0);
  const unreadConversationsCount = leads.filter((l) => (l.unreadCount || 0) > 0).length;
  const totalUnreadMessages = leads.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      onDropCard(leadId, column.id);
    }
  };

  const handleCardDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col sm:w-80 sm:min-w-[320px] sm:max-w-[320px] md:h-full md:max-h-full rounded-2xl bg-[#0F2D26] border transition-all duration-200 flex-shrink-0 md:overflow-hidden ${
        isDragOver
          ? 'border-[#C1F76B] bg-[#14382F] shadow-xl shadow-[#C1F76B]/15 ring-2 ring-[#C1F76B]'
          : 'border-[#235447]'
      }`}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-[#235447] flex items-center justify-between gap-2 flex-shrink-0 bg-[#0F2D26]">
        <div className="flex items-center gap-2 truncate">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-bold text-sm text-[#FDFEF8] truncate" title={column.title}>
            {column.title}
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#14382F] text-[#95BDB0] font-semibold border border-[#235447]">
            {leads.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Unread conversations in this column */}
          {unreadConversationsCount > 0 ? (
            <span
              className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold text-[#C1F76B] bg-[#27AE60]/20 border border-[#27AE60]/40 px-2 py-0.5 rounded-full animate-pulse shadow-sm shadow-[#27AE60]/20"
              title={`${unreadConversationsCount} conversa(s) com ${totalUnreadMessages} mensagem(ns) não aberta(s)`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>{unreadConversationsCount} não aberta{unreadConversationsCount > 1 ? 's' : ''}</span>
            </span>
          ) : (
            <span
              className="flex-shrink-0 text-[10px] text-[#95BDB0] bg-[#14382F]/70 px-1.5 py-0.5 rounded-full border border-[#235447]/60"
              title="Nenhuma conversa não aberta nesta etapa"
            >
              0 não abertas
            </span>
          )}

          <button
            onClick={() => onEditColumn(column)}
            className="p-1 rounded-lg text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] transition-colors"
            title={`Gerenciar ou editar as etapas do funil`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-header: Column Meta (Count & Total Value) */}
      <div className="px-3.5 py-2 bg-[#0B241D] flex items-center justify-between text-[11px] text-[#95BDB0] border-b border-[#235447]/60 flex-shrink-0">
        <span>
          {leads.length} {leads.length === 1 ? 'cliente' : 'clientes'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`font-bold ${column.includeInPipelineTotal !== false ? 'text-[#C1F76B]' : 'text-[#95BDB0]/80'}`}>
            {formatMoney(totalValue)}
          </span>
          {column.includeInPipelineTotal === false && (
            <span
              className="text-[9px] font-semibold text-amber-300/90 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded"
              title="O valor desta etapa não é somado à previsão total do funil"
            >
              Fora do funil
            </span>
          )}
        </div>
      </div>

      {/* Cards Container with smooth vertical scroll */}
      <div className="p-2.5 space-y-2.5 md:flex-1 md:min-h-0 md:overflow-y-auto">
        {leads.length === 0 ? (
          <div className="h-32 border-2 border-dashed border-[#235447] rounded-xl flex flex-col items-center justify-center text-center p-4 text-[#95BDB0]">
            <p className="text-xs">Nenhum cliente nesta etapa</p>
            <p className="text-[10px] text-[#95BDB0]/70 mt-1">Arraste um card para cá</p>
          </div>
        ) : (
          leads.map((lead) => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              column={column}
              isSelected={lead.id === selectedLeadId}
              onSelect={onSelectLead}
              onDragStart={handleCardDragStart}
              onOpenFollowUpModal={onOpenFollowUpModal}
            />
          ))
        )}
      </div>

      {/* Column Footer: Quick Add Lead */}
      <div className="p-2 border-t border-[#235447] bg-[#0B241D] rounded-b-2xl flex-shrink-0">
        <button
          onClick={() => onAddLeadToColumn(column.id)}
          className="w-full py-1.5 px-3 rounded-xl bg-[#14382F] hover:bg-[#184339] hover:border-[#C1F76B]/40 hover:text-[#FDFEF8] text-xs text-[#95BDB0] flex items-center justify-center gap-1.5 transition-all duration-150 hover:scale-[1.01] active:scale-[0.98] cursor-pointer border border-[#235447]"
        >
          <Plus className="w-3.5 h-3.5 text-[#C1F76B] stroke-[2.5]" />
          <span>Adicionar lead aqui</span>
        </button>
      </div>
    </div>
  );
};
