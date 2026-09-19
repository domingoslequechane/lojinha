import React, { useState, useMemo, useEffect } from 'react';
import {
  CopySlash,
  X,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Users,
  Sparkles,
  Phone,
  Check
} from 'lucide-react';
import { ContactLead, KanbanColumn } from '../../types';

interface DeduplicateLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: ContactLead[];
  columns: KanbanColumn[];
  onDeleteDuplicateLeads: (leadIdsToDelete: string[]) => Promise<boolean>;
}

export function normalizePhoneForDeduplication(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return phone.trim();

  // Mozambique standard 9-digit starting with 82, 83, 84, 85, 86, 87 -> 2588...
  if (digits.length === 9 && digits.startsWith('8')) {
    return `258${digits}`;
  }
  // If starts with 258 and is 11 or 12 digits
  if (digits.startsWith('258') && (digits.length === 11 || digits.length === 12)) {
    return digits;
  }
  return digits;
}

interface DuplicateGroup {
  phoneKey: string;
  displayPhone: string;
  leads: ContactLead[];
  recommendedKeepId: string;
}

export const DeduplicateLeadsModal: React.FC<DeduplicateLeadsModalProps> = ({
  isOpen,
  onClose,
  leads,
  columns,
  onDeleteDuplicateLeads,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToDelete, setSelectedToDelete] = useState<Set<string>>(new Set());
  const [keepSelections, setKeepSelections] = useState<Record<string, string>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedCount, setDeletedCount] = useState<number | null>(null);

  // Group leads by normalized phone
  const duplicateGroups: DuplicateGroup[] = useMemo(() => {
    const map = new Map<string, ContactLead[]>();

    for (const lead of leads) {
      const key = normalizePhoneForDeduplication(lead.phone);
      if (!key || key.length < 5) continue; // ignore blank or trivial phone
      const group = map.get(key) || [];
      group.push(lead);
      map.set(key, group);
    }

    const groups: DuplicateGroup[] = [];

    map.forEach((groupedLeads, phoneKey) => {
      if (groupedLeads.length > 1) {
        // Find best lead to keep by scoring
        const sorted = [...groupedLeads].sort((a, b) => {
          // Priority 1: Has unread or active messages
          const scoreA_unread = (a.unreadCount || 0) > 0 ? 10 : 0;
          const scoreB_unread = (b.unreadCount || 0) > 0 ? 10 : 0;

          // Priority 2: Has follow-up
          const scoreA_follow = a.followUpDate || a.followUpNotes ? 5 : 0;
          const scoreB_follow = b.followUpDate || b.followUpNotes ? 5 : 0;

          // Priority 3: Higher deal value
          const scoreA_deal = (a.dealValue || 0) > 0 ? 2 : 0;
          const scoreB_deal = (b.dealValue || 0) > 0 ? 2 : 0;

          // Priority 4: Column position (further than first column)
          const colIndexA = columns.findIndex((c) => c.id === a.columnId);
          const colIndexB = columns.findIndex((c) => c.id === b.columnId);

          // Priority 5: Timestamp
          const timeA = Number(a.lastMessageTimestamp) || 0;
          const timeB = Number(b.lastMessageTimestamp) || 0;

          const totalA = scoreA_unread + scoreA_follow + scoreA_deal + colIndexA * 0.1 + timeA * 0.0000000001;
          const totalB = scoreB_unread + scoreB_follow + scoreB_deal + colIndexB * 0.1 + timeB * 0.0000000001;

          return totalB - totalA;
        });

        const recommended = sorted[0].id;
        const displayPhone = groupedLeads[0].phone || phoneKey;

        groups.push({
          phoneKey,
          displayPhone,
          leads: groupedLeads,
          recommendedKeepId: recommended,
        });
      }
    });

    return groups.sort((a, b) => b.leads.length - a.leads.length);
  }, [leads, columns]);

  // Initialize keep selections and delete selections when duplicateGroups change
  useEffect(() => {
    if (!isOpen) {
      setDeletedCount(null);
      return;
    }

    const initialKeep: Record<string, string> = {};
    const initialDelete = new Set<string>();

    duplicateGroups.forEach((group) => {
      const keepId = group.recommendedKeepId;
      initialKeep[group.phoneKey] = keepId;
      group.leads.forEach((l) => {
        if (l.id !== keepId) {
          initialDelete.add(l.id);
        }
      });
    });

    setKeepSelections(initialKeep);
    setSelectedToDelete(initialDelete);
  }, [isOpen, duplicateGroups]);

  // Change which lead to keep for a specific group
  const handleSelectKeepLead = (phoneKey: string, keepLeadId: string) => {
    setKeepSelections((prev) => ({ ...prev, [phoneKey]: keepLeadId }));

    // Find the group and update selectedToDelete accordingly
    const group = duplicateGroups.find((g) => g.phoneKey === phoneKey);
    if (!group) return;

    setSelectedToDelete((prev) => {
      const updated = new Set(prev);
      group.leads.forEach((l) => {
        if (l.id === keepLeadId) {
          updated.delete(l.id);
        } else {
          updated.add(l.id);
        }
      });
      return updated;
    });
  };

  // Toggle individual lead deletion
  const handleToggleLeadDelete = (leadId: string, phoneKey: string) => {
    const currentKeepId = keepSelections[phoneKey];
    if (leadId === currentKeepId) return; // Cannot delete the selected keep lead directly without selecting another

    setSelectedToDelete((prev) => {
      const updated = new Set(prev);
      if (updated.has(leadId)) {
        updated.delete(leadId);
      } else {
        updated.add(leadId);
      }
      return updated;
    });
  };

  // Quick action: Select all surplus duplicates
  const handleSelectAllDuplicates = () => {
    const toDelete = new Set<string>();
    duplicateGroups.forEach((group) => {
      const keepId = keepSelections[group.phoneKey] || group.recommendedKeepId;
      group.leads.forEach((l) => {
        if (l.id !== keepId) {
          toDelete.add(l.id);
        }
      });
    });
    setSelectedToDelete(toDelete);
  };

  // Quick action: Deselect all
  const handleDeselectAll = () => {
    setSelectedToDelete(new Set());
  };

  // Quick action: Keep newest in all groups
  const handleKeepNewest = () => {
    const newKeep: Record<string, string> = {};
    const newDelete = new Set<string>();

    duplicateGroups.forEach((group) => {
      const sorted = [...group.leads].sort((a, b) => {
        const timeA = Number(a.lastMessageTimestamp) || 0;
        const timeB = Number(b.lastMessageTimestamp) || 0;
        return timeB - timeA;
      });
      const newestId = sorted[0].id;
      newKeep[group.phoneKey] = newestId;
      group.leads.forEach((l) => {
        if (l.id !== newestId) newDelete.add(l.id);
      });
    });

    setKeepSelections(newKeep);
    setSelectedToDelete(newDelete);
  };

  // Filtered groups by search
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return duplicateGroups;
    const term = searchTerm.toLowerCase();
    return duplicateGroups.filter(
      (g) =>
        g.displayPhone.toLowerCase().includes(term) ||
        g.leads.some(
          (l) =>
            l.name.toLowerCase().includes(term) ||
            (l.location && l.location.toLowerCase().includes(term)) ||
            (l.tags && l.tags.some((t) => t.toLowerCase().includes(term)))
        )
    );
  }, [duplicateGroups, searchTerm]);

  // Execute deletion
  const handleConfirmDelete = async () => {
    const idsToDelete = Array.from(selectedToDelete);
    if (idsToDelete.length === 0) return;

    setIsDeleting(true);
    try {
      const success = await onDeleteDuplicateLeads(idsToDelete);
      if (success) {
        setDeletedCount(idsToDelete.length);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Error during duplicate removal:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const totalCopiesToDelete = selectedToDelete.size;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-[#091E19] border border-[#235447] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#14382F] border-b border-[#235447] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <CopySlash className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#FDFEF8] flex items-center gap-2">
                <span>Varredura de Leads Duplicados</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {duplicateGroups.length} telefones repetidos
                </span>
              </h3>
              <p className="text-xs text-[#95BDB0]">
                Varredura automática por número de telefone. Escolha qual lead manter e elimine as cópias extras.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#0F2D26] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Success Banner */}
          {deletedCount !== null && (
            <div className="p-4 rounded-2xl bg-[#C1F76B]/15 border border-[#C1F76B]/30 text-[#C1F76B] text-xs flex items-center gap-3 animate-in zoom-in-95">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm text-[#FDFEF8]">Varredura Concluída com Sucesso!</p>
                <p className="text-xs text-[#C1F76B]">
                  {deletedCount} cópias duplicadas foram removidas. Sua base agora possui 1 lead único por contato.
                </p>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-[#0F2D26] border border-[#235447] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#14382F] text-[#C1F76B] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-[#95BDB0]">Total Analisado</p>
                <p className="text-sm font-bold text-[#FDFEF8]">{leads.length} Leads</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0F2D26] border border-[#235447] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-[#95BDB0]">Telefones Duplicados</p>
                <p className="text-sm font-bold text-amber-300">{duplicateGroups.length} Grupos</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0F2D26] border border-[#235447] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-[#95BDB0]">Cópias para Exclusão</p>
                <p className="text-sm font-bold text-red-400">{totalCopiesToDelete} Selecionadas</p>
              </div>
            </div>
          </div>

          {duplicateGroups.length === 0 ? (
            /* Clean State */
            <div className="p-12 text-center bg-[#0F2D26] border border-[#235447] rounded-2xl flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-3xl bg-[#C1F76B]/15 text-[#C1F76B] border border-[#C1F76B]/30 flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#FDFEF8]">Nenhum Lead Duplicado Encontrado</h4>
                <p className="text-xs text-[#95BDB0] max-w-sm mt-1">
                  Todos os {leads.length} leads na sua base possuem números de telefone distintos.
                </p>
              </div>
            </div>
          ) : (
            /* Duplicate Groups List */
            <div className="space-y-4">
              {/* Filter and Quick Action Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-[#95BDB0] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar por telefone ou nome..."
                    className="w-full bg-[#0F2D26] text-xs text-[#FDFEF8] pl-8 pr-3 py-2 rounded-xl border border-[#235447] focus:border-[#C1F76B] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSelectAllDuplicates}
                    className="px-2.5 py-1.5 rounded-lg bg-[#14382F] hover:bg-[#184339] text-[#95BDB0] hover:text-[#C1F76B] border border-[#235447] text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    Marcar Todas Cópias
                  </button>
                  <button
                    type="button"
                    onClick={handleKeepNewest}
                    className="px-2.5 py-1.5 rounded-lg bg-[#14382F] hover:bg-[#184339] text-[#95BDB0] hover:text-[#C1F76B] border border-[#235447] text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    Manter + Recente
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2.5 py-1.5 rounded-lg bg-[#14382F] hover:bg-[#184339] text-[#95BDB0] hover:text-red-300 border border-[#235447] text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>

              {/* Group Cards */}
              <div className="space-y-3">
                {filteredGroups.map((group) => {
                  const currentKeepId = keepSelections[group.phoneKey] || group.recommendedKeepId;

                  return (
                    <div
                      key={group.phoneKey}
                      className="rounded-2xl border border-[#235447] bg-[#0F2D26] overflow-hidden"
                    >
                      {/* Group Header */}
                      <div className="px-4 py-2.5 bg-[#14382F] border-b border-[#235447] flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#C1F76B]" />
                          <span className="text-xs font-bold text-[#FDFEF8] font-mono">{group.displayPhone}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30">
                            {group.leads.length} cadastros repetidos
                          </span>
                        </div>
                        <span className="text-[11px] text-[#95BDB0]">
                          1 principal será mantido · {group.leads.length - 1} cópia(s) a remover
                        </span>
                      </div>

                      {/* Lead items in this group */}
                      <div className="p-3 space-y-2">
                        {group.leads.map((lead) => {
                          const isKeep = lead.id === currentKeepId;
                          const isMarkedDelete = selectedToDelete.has(lead.id);
                          const col = columns.find((c) => c.id === lead.columnId);

                          return (
                            <div
                              key={lead.id}
                              onClick={() => {
                                if (!isKeep) {
                                  handleSelectKeepLead(group.phoneKey, lead.id);
                                }
                              }}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                isKeep
                                  ? 'bg-[#14382F]/90 border-[#C1F76B]/60 ring-1 ring-[#C1F76B]/40 shadow-sm'
                                  : isMarkedDelete
                                  ? 'bg-[#1A1A1A]/40 border-red-500/30 hover:border-red-500/50 opacity-90'
                                  : 'bg-[#14382F]/40 border-[#235447] hover:border-[#95BDB0]/40'
                              }`}
                            >
                              {/* Left Info */}
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative flex-shrink-0">
                                  {lead.avatar ? (
                                    <img
                                      src={lead.avatar}
                                      alt={lead.name}
                                      className="w-9 h-9 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-[#184339] border border-[#2E6858] flex items-center justify-center text-xs font-bold text-[#C1F76B]">
                                      {lead.name ? lead.name.trim().charAt(0).toUpperCase() : '#'}
                                    </div>
                                  )}
                                  {isKeep && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#C1F76B] text-[#0F2D26] flex items-center justify-center ring-2 ring-[#14382F]">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-xs text-[#FDFEF8] truncate">{lead.name}</p>
                                    <span
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                                      style={{
                                        backgroundColor: `${col?.color || '#95BDB0'}15`,
                                        color: col?.color || '#95BDB0',
                                        border: `1px solid ${col?.color || '#95BDB0'}30`,
                                      }}
                                    >
                                      {col?.title || 'Sem Etapa'}
                                    </span>
                                    {lead.dealValue > 0 && (
                                      <span className="text-[10px] text-[#C1F76B] font-bold">
                                        {lead.dealValue.toLocaleString()} MT
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 text-[11px] text-[#95BDB0] mt-0.5 truncate">
                                    <span>{lead.lastMessage || 'Sem mensagens'}</span>
                                    {lead.followUpNotes && (
                                      <span className="text-amber-300 truncate">
                                        • Nota: {lead.followUpNotes}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right Action */}
                              <div
                                className="flex items-center gap-2 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isKeep ? (
                                  <span className="px-3 py-1 rounded-xl bg-[#C1F76B]/15 text-[#C1F76B] border border-[#C1F76B]/40 text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Manter (Principal)</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleLeadDelete(lead.id, group.phoneKey)}
                                    className={`px-3 py-1 rounded-xl text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                                      isMarkedDelete
                                        ? 'bg-red-500/15 text-red-300 border border-red-500/40 hover:bg-red-500/25'
                                        : 'bg-[#14382F] text-[#95BDB0] border border-[#235447] hover:text-[#FDFEF8]'
                                    }`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>{isMarkedDelete ? 'Apagar Cópia' : 'Preservar Cópia'}</span>
                                  </button>
                                )}

                                {!isKeep && (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectKeepLead(group.phoneKey, lead.id)}
                                    className="text-[11px] text-[#95BDB0] hover:text-[#C1F76B] underline transition-colors cursor-pointer"
                                  >
                                    Definir Principal
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0B241D] border-t border-[#235447] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] transition-all cursor-pointer"
          >
            Fechar
          </button>

          {duplicateGroups.length > 0 && totalCopiesToDelete > 0 && (
            <button
              type="button"
              disabled={isDeleting || totalCopiesToDelete === 0}
              onClick={handleConfirmDelete}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/25 hover:shadow-red-500/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Apagando {totalCopiesToDelete} Cópias...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 stroke-[2.2]" />
                  <span>Remover {totalCopiesToDelete} Cópias Duplicadas</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
