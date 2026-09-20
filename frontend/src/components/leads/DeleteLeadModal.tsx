import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { ContactLead } from '../../types';

interface DeleteLeadModalProps {
  isOpen: boolean;
  lead: ContactLead | null;
  onClose: () => void;
  onConfirmDelete: (leadId: string) => Promise<void> | void;
}

export const DeleteLeadModal: React.FC<DeleteLeadModalProps> = ({
  isOpen,
  lead,
  onClose,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !lead) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete(lead.id);
      onClose();
    } catch (err) {
      console.error('Error during lead deletion:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#0F2D26] border border-red-500/30 rounded-3xl w-full max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-hidden shadow-2xl shadow-black/60 flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-red-950/40 border-b border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shadow-xs flex-shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#FDFEF8]">Excluir Contato</h3>
              <p className="text-xs text-red-300/80">Remoção permanente em cascata</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-8 h-8 rounded-full bg-[#14382F] text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#184339] flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#0F2D26] border border-[#235447] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#184339] border border-[#2E6858] flex items-center justify-center text-sm font-bold text-[#C1F76B] flex-shrink-0">
              {lead.name ? lead.name.trim().charAt(0).toUpperCase() : '#'}
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm text-[#FDFEF8] truncate">{lead.name}</h4>
              <p className="text-xs text-[#95BDB0]">{lead.phone}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-red-300">Atenção: Ação irreversível!</p>
              <p className="text-[11px] text-red-200/80 leading-relaxed">
                Todas as mensagens do WhatsApp trocadas com este contato, histórico do funil, notas e agendamentos serão excluídos definitivamente em cascata.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0B241D] border-t border-[#235447] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-[#14382F] hover:bg-[#184339] text-[#95BDB0] hover:text-[#FDFEF8] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-900/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Excluindo...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Lead</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
