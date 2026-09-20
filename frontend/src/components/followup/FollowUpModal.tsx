import React, { useState } from 'react';
import { Clock, Calendar, X, Check, FileText, Plus, Trash2 } from 'lucide-react';
import { ContactLead } from '../../types';

interface FollowUpModalProps {
  isOpen: boolean;
  lead: ContactLead | null;
  onClose: () => void;
  onSave: (leadId: string, followUpDate: string, notes: string) => void;
  onClear: (leadId: string) => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  lead,
  onClose,
  onSave,
  onClear,
}) => {
  if (!isOpen || !lead) return null;

  const [dateText, setDateText] = useState(lead.followUpDate || '');
  const [notes, setNotes] = useState(lead.followUpNotes || '');
  const [showSchedule, setShowSchedule] = useState(Boolean(lead.followUpDate));

  const quickTags = [
    'Recusa: Preço alto',
    'Recusa: Frete / Localização',
    'Sugestão do cliente',
    'Pedido: Tablet 7 polegadas',
    'Aguardando decisão do esposo',
    'Retornar no dia de pagamento',
  ];

  const presets = [
    { label: 'Hoje às 19:00', value: 'Hoje às 19:00', desc: 'Esposo chega em casa' },
    { label: 'Amanhã às 10:00', value: 'Amanhã às 10:00', desc: 'Primeiro horário comercial' },
    { label: 'Em 48 Horas', value: 'Em 48 Horas', desc: 'Tempo para decidir' },
    { label: 'Dia 25 (Salário)', value: 'Dia 25 às 09:30', desc: 'Pagamento de funcionários' },
    { label: 'Dia 30 (Fim de Mês)', value: 'Dia 30 às 10:00', desc: 'Fechamento de salário' },
    { label: 'Próxima Segunda', value: 'Próxima Segunda 10:00', desc: 'Início de semana' },
  ];

  const handleAppendTag = (tag: string) => {
    setNotes((prev) => {
      const prefix = prev.trim() ? `${prev.trim()}\n• ` : '• ';
      return `${prefix}${tag}: `;
    });
  };

  const handleSave = () => {
    onSave(lead.id, dateText.trim(), notes.trim());
    onClose();
  };

  const handleClearReminder = () => {
    setDateText('');
    setShowSchedule(false);
    onSave(lead.id, '', notes.trim());
  };

  const handleClearNote = () => {
    setNotes('');
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="p-3 bg-[#14382F] border-b border-[#235447] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C1F76B]/15 text-[#C1F76B] border border-[#C1F76B]/30 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#FDFEF8]">Folha de Atendimento & Follow-up</h3>
              <p className="text-xs text-[#95BDB0]">{lead.name} • {lead.phone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#0F2D26] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content: Scrollable */}
        <div className="p-3 space-y-3 overflow-y-auto flex-1">
          {/* Folha de Notas do Atendimento */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#C1F76B] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Nota de Atendimento do Cliente</span>
              </label>
              {notes && (
                <button
                  type="button"
                  onClick={handleClearNote}
                  className="text-[11px] text-red-400/80 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar texto</span>
                </button>
              )}
            </div>

            {/* Quick Tag Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {quickTags.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAppendTag(tag)}
                  className="text-[10px] font-medium bg-[#14382F] text-[#D1EAE0] hover:text-[#C1F76B] hover:bg-[#1A4B3F] border border-[#2D6B5A] px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5 text-[#C1F76B]" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>

            {/* Notepad Area */}
            <div className="relative rounded-2xl bg-[#0F2D26] border border-[#2D6B5A] focus-within:border-[#C1F76B] transition-colors p-3 shadow-inner">
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escreva como em uma folha de caderno os detalhes do atendimento: motivo de recusa, sugestões, itens do pedido, endereço de entrega ou o que ficou combinado..."
                className="w-full bg-transparent text-sm text-[#FDFEF8] placeholder-[#95BDB0]/60 focus:outline-none resize-y leading-relaxed font-normal"
              />
              <div className="flex items-center justify-between pt-2 border-t border-[#235447]/60 text-[11px] text-[#95BDB0]">
                <span>Esta nota substituirá a mensagem padrão no card do Kanban.</span>
                <span>{notes.length} caracteres</span>
              </div>
            </div>
          </div>

          {/* Seção de Lembrete / Agendamento de Data (Opcional) */}
          <div className="pt-2 border-t border-[#235447]/80">
            {!showSchedule && !dateText ? (
              <button
                type="button"
                onClick={() => setShowSchedule(true)}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#2D6B5A] hover:border-amber-400/60 bg-[#14382F]/40 hover:bg-[#14382F] text-xs font-semibold text-[#95BDB0] hover:text-amber-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>+ Agendar data/hora de retorno (Follow-up)</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[#14382F]/50 border border-amber-500/30 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lembrete de Retorno (Follow-up)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleClearReminder}
                    className="text-[11px] text-amber-400/80 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    Remover data
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {presets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDateText(p.value)}
                      className={`p-2 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                        dateText === p.value
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold shadow-xs'
                          : 'bg-[#0F2D26] border-[#2D6B5A] text-[#FDFEF8] hover:border-amber-400/50 hover:bg-[#184339]'
                      }`}
                    >
                      <p className="font-medium truncate">{p.label}</p>
                      <p className="text-[10px] text-[#95BDB0] truncate">{p.desc}</p>
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={dateText}
                  onChange={(e) => setDateText(e.target.value)}
                  placeholder="Ex: Hoje às 19:00 ou 25/09 às 10:00"
                  className="w-full bg-[#0F2D26] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-amber-400 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0B241D] border-t border-[#235447] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] transition-all cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#b0ec53] shadow-md shadow-[#C1F76B]/25 hover:shadow-[#C1F76B]/40 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{dateText.trim() ? 'Salvar Nota & Lembrete' : 'Salvar Nota de Atendimento'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

