import React from 'react';
import { Clock, MessageSquare, Check, X, Calendar, UserCheck } from 'lucide-react';
import { ContactLead } from '../../types';

interface FollowUpListModalProps {
  isOpen: boolean;
  leadsWithFollowUp: ContactLead[];
  onClose: () => void;
  onSelectLeadForChat: (lead: ContactLead) => void;
  onResolveFollowUp: (leadId: string) => void;
}

export const FollowUpListModal: React.FC<FollowUpListModalProps> = ({
  isOpen,
  leadsWithFollowUp,
  onClose,
  onSelectLeadForChat,
  onResolveFollowUp,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 bg-[#14382F] border-b border-[#235447] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#FDFEF8]">Próximos Follow-ups Agendados</h3>
              <p className="text-xs text-[#95BDB0]">
                {leadsWithFollowUp.length} compradores aguardando retorno agendado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#0F2D26] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Scheduled Leads */}
        <div className="p-5 max-h-96 overflow-y-auto space-y-3">
          {leadsWithFollowUp.length === 0 ? (
            <div className="p-8 text-center text-[#95BDB0]">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-[#2D6B5A]" />
              <p className="text-sm font-medium text-[#FDFEF8]">Nenhum follow-up pendente!</p>
              <p className="text-xs text-[#95BDB0] mt-1">
                Agende retornos com clientes para não perder vendas.
              </p>
            </div>
          ) : (
            leadsWithFollowUp.map((lead) => (
              <div
                key={lead.id}
                className="p-4 bg-[#14382F] border border-[#235447] hover:border-amber-500/40 rounded-2xl flex flex-col gap-2.5 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {lead.avatar ? (
                      <img
                        src={lead.avatar}
                        alt={lead.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#2D6B5A]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#184339] border border-[#2D6B5A] flex items-center justify-center text-sm font-bold text-[#C1F76B]">
                        {lead.name ? lead.name.trim().charAt(0).toUpperCase() : '#'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-[#FDFEF8]">{lead.name}</h4>
                      <p className="text-xs text-[#95BDB0]">{lead.phone} • {lead.location}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                      <Clock className="w-3.5 h-3.5" />
                      {lead.followUpDate}
                    </span>
                  </div>
                </div>

                {lead.followUpNotes && (
                  <div className="text-xs text-[#C2DDD4] bg-[#0F2D26] p-2.5 rounded-xl border border-[#235447]/60 leading-relaxed">
                    <span className="text-[#95BDB0] font-semibold">Lembrete: </span>
                    {lead.followUpNotes}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-[#235447]/50">
                  <span className="text-xs font-bold text-[#C1F76B]">
                    Interesse: {lead.dealValue.toLocaleString()} MT ({lead.productInterest || 'Tablet'})
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onResolveFollowUp(lead.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#14382F] hover:bg-[#2D6B5A] text-xs text-[#95BDB0] hover:text-[#FDFEF8] transition-colors flex items-center gap-1"
                      title="Marcar como atendido"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Concluir</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectLeadForChat(lead);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#C1F76B] text-[#0F2D26] hover:bg-[#b0ec53] text-xs font-bold shadow-md shadow-[#C1F76B]/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Abrir no WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0B241D] border-t border-[#235447] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#14382F] hover:bg-[#2D6B5A] text-[#FDFEF8] transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

