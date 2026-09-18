import React from 'react';
import { Plus } from 'lucide-react';
import { ContactLead, KanbanColumn } from '../../types';
import { KanbanColumnComponent } from './KanbanColumnComponent';

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
  onDeleteLead?: (lead: ContactLead) => void;
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
  onDeleteLead,
}) => {
  // Sort columns by order
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <div className="flex-1 h-full min-h-0 overflow-x-auto overflow-y-hidden pl-4 py-3 pr-0 bg-[#091E19] kanban-column-scroll select-none">
      <div className="flex items-stretch gap-4 h-full w-max min-w-full pr-4 pb-1">
        {sortedColumns.map((col, index) => {
          const colLeads = leads.filter((lead) => {
            if (lead.columnId === col.id) return true;
            // Fallback: If lead has no columnId or its columnId is not in any active column, place it in the first column
            if (index === 0 && (!lead.columnId || !sortedColumns.some((c) => c.id === lead.columnId))) {
              return true;
            }
            return false;
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
              onDeleteLead={onDeleteLead}
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
            Adicionar Nova Coluna
          </p>
          <p className="text-xs text-[#95BDB0] mt-1">
            Personalize o seu funil de vendas
          </p>
        </div>
      </div>
    </div>
  );
};
