import React, { useState } from 'react';
import { Users, Search, MessageSquare, Clock, MapPin, Tag, Baby, FileSpreadsheet } from 'lucide-react';
import { ContactLead, KanbanColumn } from '../../types';
import { CustomSelect } from '../common/CustomSelect';

interface LeadsListViewProps {
  leads: ContactLead[];
  columns: KanbanColumn[];
  selectedLeadId?: string | null;
  onSelectLeadForChat: (lead: ContactLead) => void;
  onOpenFollowUpModal: (lead: ContactLead) => void;
  onOpenImportCsv?: () => void;
}

export const LeadsListView: React.FC<LeadsListViewProps> = ({
  leads,
  columns,
  selectedLeadId,
  onSelectLeadForChat,
  onOpenFollowUpModal,
  onOpenImportCsv,
}) => {
  const [filterColumn, setFilterColumn] = useState<string>('all');
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = leads.filter((lead) => {
    const matchesCol = filterColumn === 'all' || lead.columnId === filterColumn;
    const matchesText =
      lead.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      lead.phone.includes(filterQuery) ||
      (lead.location && lead.location.toLowerCase().includes(filterQuery.toLowerCase()));
    return matchesCol && matchesText;
  });

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 bg-[#091E19] space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#FDFEF8] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#C1F76B]" />
            Base de Contatos & Compradores
          </h2>
          <p className="text-xs text-[#95BDB0] mt-1">
            Lista completa de clientes com histórico de compras e localização
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <CustomSelect
            value={filterColumn}
            onChange={setFilterColumn}
            options={[
              { value: 'all', label: 'Todas as Etapas' },
              ...columns.map((c) => ({
                value: c.id,
                label: c.title,
                color: c.color,
              })),
            ]}
            className="min-w-[190px]"
          />

          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filtrar por nome..."
            className="bg-[#0F2D26] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#235447] focus:outline-none focus:border-[#C1F76B]"
          />

          {onOpenImportCsv && (
            <button
              onClick={onOpenImportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#14382F] hover:bg-[#184339] hover:border-[#C1F76B]/40 text-[#C1F76B] rounded-xl text-xs font-bold border border-[#235447] transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Importar CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#235447] bg-[#0F2D26] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#14382F] text-[#95BDB0] uppercase text-[10px] tracking-wider border-b border-[#235447]">
              <tr>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Produto / Criança</th>
                <th className="p-3.5">Etapa Funil</th>
                <th className="p-3.5">Localização</th>
                <th className="p-3.5">Valor (MT)</th>
                <th className="p-3.5">Follow-up</th>
                <th className="p-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#235447]/60 text-[#FDFEF8]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#95BDB0]">
                    <p className="text-sm font-medium text-[#FDFEF8]">Nenhum cliente cadastrado ainda</p>
                    <p className="text-xs text-[#95BDB0] mt-1">Os novos leads do WhatsApp aparecerão aqui automaticamente.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => {
                const col = columns.find((c) => c.id === lead.columnId);
                const isSelected = lead.id === selectedLeadId;
                const hasUnread = (lead.unreadCount || 0) > 0;

                return (
                  <tr 
                    key={lead.id} 
                    className={`transition-all duration-150 cursor-pointer ${
                      isSelected 
                        ? 'bg-[#14382F] ring-1 ring-inset ring-[#C1F76B]' 
                        : 'hover:bg-[#14382F] hover:brightness-105'
                    }`}
                    onClick={() => onSelectLeadForChat(lead)}
                  >
                    <td className="p-3.5 flex items-center gap-2.5">
                      <div className="relative flex-shrink-0 group-hover:scale-105 transition-transform">
                        {lead.avatar ? (
                          <img
                            src={lead.avatar}
                            alt={lead.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#184339] border border-[#2E6858] flex items-center justify-center text-xs font-bold text-[#C1F76B]">
                            {lead.name ? lead.name.trim().charAt(0).toUpperCase() : '#'}
                          </div>
                        )}
                        {hasUnread && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C1F76B] text-black font-extrabold text-[10px] flex items-center justify-center ring-2 ring-[#14382F]">
                            {lead.unreadCount}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-[#FDFEF8] hover:text-[#C1F76B] transition-colors">{lead.name}</p>
                          {hasUnread && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#C1F76B]/20 text-[#C1F76B] font-bold">
                              {lead.unreadCount} nova(s)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#95BDB0]">{lead.phone}</p>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <p className="text-[#FDFEF8] font-medium">{lead.productInterest || 'Tablet'}</p>
                      {lead.childInfo && (
                        <p className="text-[10px] text-[#95BDB0] flex items-center gap-1 mt-0.5">
                          <Baby className="w-3 h-3 text-pink-400" />
                          {lead.childInfo}
                        </p>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                        style={{
                          backgroundColor: `${col?.color}15`,
                          color: col?.color,
                          border: `1px solid ${col?.color}30`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: col?.color }}
                        />
                        {col?.title}
                      </span>
                    </td>

                    <td className="p-3.5 text-[#95BDB0]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                        {lead.location || 'Não informado'}
                      </span>
                    </td>

                    <td className="p-3.5 font-bold text-[#C1F76B]">
                      {lead.dealValue.toLocaleString()} MT
                    </td>

                    <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                      {lead.followUpDate ? (
                        <button
                          onClick={() => onOpenFollowUpModal(lead)}
                          className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Clock className="w-3 h-3" />
                          <span>{lead.followUpDate}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenFollowUpModal(lead)}
                          className="text-[#95BDB0] hover:text-[#C1F76B] transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          + Agendar
                        </button>
                      )}
                    </td>

                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectLeadForChat(lead)}
                        className={`px-3 py-1.5 font-semibold rounded-xl text-xs inline-flex items-center gap-1 transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer ${
                          isSelected
                            ? 'bg-[#14382F] text-[#FDFEF8] border border-[#C1F76B] ring-1 ring-[#C1F76B] hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300'
                            : 'bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] font-bold shadow-md shadow-[#C1F76B]/20 hover:shadow-[#C1F76B]/40'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'Fechar Chat' : 'Abrir Chat'}</span>
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

