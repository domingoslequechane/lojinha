import React from 'react';
import { Clock, MessageSquare, Check, X, Calendar, Phone, Bell, Package, MapPin, ShoppingBag, AlertTriangle } from 'lucide-react';
import { ContactLead } from '../../types';
import { formatPhoneForCall, formatMoney, formatFollowUpDate, followUpDaysRemaining } from '../../utils/phoneUtils';


interface FollowUpListModalProps {
  isOpen: boolean;
  leadsWithFollowUp: ContactLead[]; // overdue + next-24h (already filtered & sorted)
  overdueLeads: ContactLead[];      // subset that is overdue (for section header)
  onClose: () => void;
  onSelectLeadForChat: (lead: ContactLead) => void;
  onResolveFollowUp: (leadId: string) => void;
}

export const FollowUpListModal: React.FC<FollowUpListModalProps> = ({
  isOpen,
  leadsWithFollowUp,
  overdueLeads,
  onClose,
  onSelectLeadForChat,
  onResolveFollowUp,
}) => {
  if (!isOpen) return null;

  const overdueIds = new Set(overdueLeads.map((l) => l.id));
  const upcomingLeads = leadsWithFollowUp.filter((l) => !overdueIds.has(l.id));

  const totalFollowUps = leadsWithFollowUp.filter(l => l.followUpType !== 'entrega').length;
  const totalEntregas = leadsWithFollowUp.filter(l => l.followUpType === 'entrega').length;
  const totalOverdue = overdueLeads.length;

  const renderCard = (lead: ContactLead, isOverdue: boolean) => {
    const isEntrega = lead.followUpType === 'entrega';
    const days = followUpDaysRemaining(lead.followUpDate);

    return (
      <div
        key={lead.id}
        className={`p-4 border rounded-2xl flex flex-col gap-2.5 transition-all ${
          isOverdue
            ? 'bg-red-950/40 border-red-500/50 hover:border-red-400/70'
            : isEntrega
            ? 'bg-blue-950/30 border-blue-500/30 hover:border-blue-400/50'
            : 'bg-[#14382F] border-[#235447] hover:border-amber-500/40'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {lead.avatar ? (
              <img src={lead.avatar} alt={lead.name}
                className="w-10 h-10 rounded-full object-cover border border-[#2D6B5A]" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#184339] border border-[#2D6B5A] flex items-center justify-center text-sm font-bold text-[#C1F76B]">
                {lead.name ? lead.name.trim().charAt(0).toUpperCase() : '#'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[#FDFEF8]">{lead.name}</h4>
                {/* Type badge */}
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isOverdue
                    ? 'bg-red-500/20 text-red-300'
                    : isEntrega
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {isOverdue
                    ? <><AlertTriangle className="w-2.5 h-2.5" /> Atrasado</>
                    : isEntrega
                    ? <><Package className="w-2.5 h-2.5" /> Entrega</>
                    : <><Bell className="w-2.5 h-2.5" /> Follow Up</>
                  }
                </span>
              </div>
              <p className="text-xs text-[#95BDB0]">{lead.phone} • {lead.location}</p>
            </div>
          </div>

          <div className="text-right flex flex-col items-end gap-1">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl border ${
              isOverdue
                ? 'text-red-300 bg-red-500/15 border-red-500/30'
                : isEntrega
                ? 'text-blue-300 bg-blue-500/15 border-blue-500/30'
                : 'text-amber-300 bg-amber-500/15 border-amber-500/30'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              {formatFollowUpDate(lead.followUpDate)}
            </span>
            {(() => {
              if (days === null) return null;
              if (isOverdue) return <span className="text-[10px] font-semibold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Atrasado</span>;
              if (days === 0) return <span className="text-[10px] font-semibold text-[#C1F76B] bg-[#C1F76B]/10 px-2 py-0.5 rounded-full">Hoje</span>;
              if (days === 1) return <span className="text-[10px] font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full">Amanhã</span>;
              return <span className="text-[10px] text-[#95BDB0] bg-[#0F2D26] px-2 py-0.5 rounded-full">{days} dias restantes</span>;
            })()}
          </div>
        </div>

        {/* Delivery extra info */}
        {isEntrega && (lead.deliveryProduct || lead.deliveryAddress || lead.deliveryQuantity || lead.deliveryValue) && (
          <div className="bg-blue-950/40 border border-blue-500/20 rounded-xl p-2.5 space-y-1">
            {lead.deliveryProduct && (
              <div className="flex items-center gap-1.5 text-xs text-blue-200">
                <ShoppingBag className="w-3 h-3 text-blue-400 flex-shrink-0" />
                <span>{lead.deliveryProduct}{lead.deliveryQuantity ? ` × ${lead.deliveryQuantity}` : ''}</span>
                {lead.deliveryValue && <span className="text-blue-300 font-bold ml-auto">{lead.deliveryValue.toLocaleString('pt-MZ')} MT</span>}
              </div>
            )}
            {lead.deliveryAddress && (
              <div className="flex items-center gap-1.5 text-xs text-blue-200/80">
                <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
                <span>{lead.deliveryAddress}</span>
              </div>
            )}
          </div>
        )}

        {/* Follow-up notes */}
        {lead.followUpNotes && (
          <div className="text-xs text-[#C2DDD4] bg-[#0F2D26] p-2.5 rounded-xl border border-[#235447]/60 leading-relaxed">
            <span className="text-[#95BDB0] font-semibold">Lembrete: </span>
            {lead.followUpNotes}
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-[#235447]/50">
          <span className="text-xs font-bold text-[#C1F76B]">
            {formatMoney(lead.dealValue)} {lead.productInterest ? `— ${lead.productInterest}` : ''}
          </span>

          <div className="flex items-center gap-2">
            {lead.phone && (
              <a href={formatPhoneForCall(lead.phone)}
                className="px-3 py-1.5 rounded-xl bg-[#0F2D26] hover:bg-[#C1F76B] text-[#C1F76B] hover:text-[#0F2D26] border border-[#235447] hover:border-[#C1F76B] text-xs font-semibold flex items-center gap-1 transition-all"
                title={`Ligar para ${lead.phone}`}>
                <Phone className="w-3.5 h-3.5" />
                <span>Ligar</span>
              </a>
            )}
            <button onClick={() => onResolveFollowUp(lead.id)}
              className="px-3 py-1.5 rounded-xl bg-[#14382F] hover:bg-[#2D6B5A] text-xs text-[#95BDB0] hover:text-[#FDFEF8] transition-colors flex items-center gap-1"
              title="Marcar como concluído">
              <Check className="w-3.5 h-3.5" />
              <span>Concluir</span>
            </button>
            <button onClick={() => { onSelectLeadForChat(lead); onClose(); }}
              className="px-3.5 py-1.5 rounded-xl bg-[#C1F76B] text-[#0F2D26] hover:bg-[#b0ec53] text-xs font-bold shadow-md shadow-[#C1F76B]/20 transition-all flex items-center gap-1.5 cursor-pointer">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Abrir Chat</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-xl max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-[#14382F] border-b border-[#235447] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              totalOverdue > 0 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {totalOverdue > 0 ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#FDFEF8]">Agendamentos — Próximas 24h</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {totalOverdue > 0 && (
                  <span className="text-[10px] font-semibold text-red-300 bg-red-500/15 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" /> {totalOverdue} Atrasado{totalOverdue > 1 ? 's' : ''}
                  </span>
                )}
                {totalFollowUps > 0 && (
                  <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Bell className="w-2.5 h-2.5" /> {totalFollowUps} Follow-up{totalFollowUps > 1 ? 's' : ''}
                  </span>
                )}
                {totalEntregas > 0 && (
                  <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/15 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Package className="w-2.5 h-2.5" /> {totalEntregas} Entrega{totalEntregas > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#0F2D26] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {leadsWithFollowUp.length === 0 ? (
            <div className="p-8 text-center text-[#95BDB0]">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-[#2D6B5A]" />
              <p className="text-sm font-medium text-[#FDFEF8]">Sem agendamentos nas próximas 24h!</p>
              <p className="text-xs text-[#95BDB0] mt-1">
                Agende follow-ups e entregas com clientes para não perder vendas.
              </p>
            </div>
          ) : (
            <>
              {/* Section: Overdue (max alert) */}
              {overdueLeads.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Atrasados — Requer atenção imediata</span>
                    <div className="flex-1 h-px bg-red-500/25" />
                  </div>
                  {overdueLeads.map((lead) => renderCard(lead, true))}
                </div>
              )}

              {/* Section: Upcoming 24h */}
              {upcomingLeads.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Próximas 24 horas</span>
                    <div className="flex-1 h-px bg-amber-500/25" />
                  </div>
                  {upcomingLeads.map((lead) => renderCard(lead, false))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0B241D] border-t border-[#235447] flex items-center justify-end">
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#14382F] hover:bg-[#2D6B5A] text-[#FDFEF8] transition-all">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
