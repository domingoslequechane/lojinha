import React from 'react';
import { 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCheck, 
  Baby,
  MessageSquare,
  FileText,
  Edit3,
  Phone
} from 'lucide-react';
import { ContactLead, KanbanColumn } from '../../types';
import { formatPhoneForCall, formatFollowUpDate } from '../../utils/phoneUtils';
import { formatMoney } from '../../utils/formatters';

interface KanbanCardProps {
  lead: ContactLead;
  column: KanbanColumn;
  isSelected: boolean;
  onSelect: (lead: ContactLead) => void;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
  onOpenFollowUpModal: (lead: ContactLead) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  lead,
  column,
  isSelected,
  onSelect,
  onDragStart,
  onOpenFollowUpModal,
}) => {
  const hasUnread = (lead.unreadCount || 0) > 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      onClick={() => onSelect(lead)}
      className={`group relative p-3 rounded-2xl cursor-pointer transition-all duration-150 border hover:scale-[1.015] active:scale-[0.99] ${
        isSelected
          ? 'bg-[#1E5044] border-[#C1F76B] shadow-lg shadow-[#C1F76B]/20 ring-1 ring-[#C1F76B]'
          : hasUnread
          ? 'bg-[#184339] border-[#245447] border-l-4 border-l-[#C1F76B] ring-1 ring-[#C1F76B]/30 shadow-md shadow-[#C1F76B]/10 hover:bg-[#1E5044] hover:border-[#C1F76B]/60'
          : 'bg-[#184339] border-[#245447] hover:bg-[#1E5044] hover:border-[#2E6858] hover:shadow-xl hover:shadow-black/30'
      }`}
    >
      {/* Card Header: Avatar, Name, Unread & Value */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            {lead.avatar ? (
              <img
                src={lead.avatar}
                alt={lead.name}
                className="w-10 h-10 rounded-full object-cover border border-[#2E6858]"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#184339] border border-[#2E6858] flex items-center justify-center text-sm font-bold text-[#C1F76B]">
                {lead.name ? lead.name.trim().charAt(0).toUpperCase() : '#'}
              </div>
            )}
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C1F76B] text-[#0F2D26] font-extrabold text-[10px] flex items-center justify-center ring-2 ring-[#184339]">
                {lead.unreadCount}
              </span>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-[#FDFEF8] group-hover:text-[#C1F76B] transition-colors leading-tight">
              {lead.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[11px] text-[#95BDB0]">{lead.phone}</p>
              {lead.phone && (
                <a
                  href={formatPhoneForCall(lead.phone)}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded-md bg-[#0F2D26] hover:bg-[#C1F76B] text-[#C1F76B] hover:text-[#0F2D26] border border-[#2E6858] hover:border-[#C1F76B] transition-all flex items-center justify-center cursor-pointer shadow-xs"
                  title={`Ligar para ${lead.name || lead.phone}`}
                >
                  <Phone className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Deal Value */}
        <div className="text-right">
          <span className="font-bold text-xs text-[#C1F76B] bg-[#C1F76B]/15 px-2 py-0.5 rounded-md border border-[#C1F76B]/30 inline-block shadow-xs">
            {formatMoney(lead.dealValue)}
          </span>
          <p className="text-[10px] text-[#95BDB0] mt-1">{lead.lastMessageTime}</p>
        </div>
      </div>

      {/* Number of Unread Messages Alert */}
      {hasUnread ? (
        <div className="flex items-center justify-between gap-1.5 px-2.5 py-1 mb-2 rounded-xl bg-[#C1F76B]/15 border border-[#C1F76B]/35 text-[#C1F76B] text-[11px] font-bold shadow-xs">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 fill-[#C1F76B]/20 animate-pulse" />
            <span>{lead.unreadCount} {lead.unreadCount === 1 ? 'mensagem não aberta' : 'mensagens não abertas'}</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#C1F76B] animate-ping" />
        </div>
      ) : (
        <div className="flex items-center gap-1 text-[10px] text-[#95BDB0]/70 mb-1.5 px-0.5">
          <CheckCheck className="w-3 h-3 text-[#C1F76B]/80" />
          <span>Mensagens lidas</span>
        </div>
      )}

      {/* Last message / conversation preview */}
      {lead.lastMessage && !hasUnread && (
        <div className="flex items-start gap-1.5 text-[10px] text-[#95BDB0] mb-1.5 px-0.5 line-clamp-2">
          <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5 text-[#578577]" />
          <span className="line-clamp-2 leading-relaxed italic">{lead.lastMessage}</span>
        </div>
      )}

      {/* Child info / Product note */}
      {lead.childInfo && (
        <div className="flex items-center gap-1.5 text-[11px] text-[#D1EAE0] mb-2 bg-[#0F2D26]/80 px-2 py-1 rounded-lg border border-[#235447]/60">
          <Baby className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
          <span className="truncate">{lead.childInfo} • {lead.productInterest}</span>
        </div>
      )}

      {/* Bloco Unificado: Nota de Atendimento & Follow-up (Apenas 1 elemento) */}
      {(lead.followUpNotes || lead.followUpDate) ? (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onOpenFollowUpModal(lead);
          }}
          className="group/note mb-2 p-2 rounded-xl bg-[#091E19] border border-[#235447] hover:border-[#C1F76B]/60 transition-all cursor-pointer shadow-xs"
          title="Clique na nota para ver mais ou editar"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <div className="flex items-center gap-1.5 truncate">
              <FileText className="w-3 h-3 text-[#C1F76B] flex-shrink-0" />
              <span className="text-[10px] font-bold text-[#C1F76B] uppercase tracking-wider truncate">
                Nota & Follow-up
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {lead.followUpDate && (
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md truncate max-w-[120px]">
                  <Clock className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />
                  <span className="truncate">{formatFollowUpDate(lead.followUpDate)}</span>
                </span>
              )}
              <span className="opacity-0 group-hover/note:opacity-100 transition-opacity text-[10px] text-[#C1F76B] flex items-center gap-0.5 font-medium">
                <Edit3 className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>

          {/* Texto curto da nota */}
          {lead.followUpNotes ? (
            <p className="text-xs text-[#E3F2ED] line-clamp-2 leading-relaxed font-normal">
              {lead.followUpNotes}
            </p>
          ) : (
            <p className="text-xs text-amber-200/80 italic line-clamp-1">
              Follow-up marcado para {formatFollowUpDate(lead.followUpDate)}
            </p>
          )}
        </div>
      ) : null}

      {/* Tags & Location */}
      <div className="flex flex-wrap items-center gap-1.5">
        {lead.location && (
          <span className="inline-flex items-center gap-1 text-[10px] bg-[#0F2D26] text-[#95BDB0] border border-[#235447] px-2 py-0.5 rounded-md">
            <MapPin className="w-2.5 h-2.5 text-red-400" />
            <span className="truncate max-w-[120px]">{lead.location}</span>
          </span>
        )}
        {lead.tags.map((tag, i) => (
          <span
            key={i}
            className="text-[10px] bg-[#14382F] text-[#D1EAE0] border border-[#245447] px-1.5 py-0.5 rounded-md"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};
