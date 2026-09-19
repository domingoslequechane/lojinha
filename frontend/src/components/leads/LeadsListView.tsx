import React, { useState } from 'react';
import { Users, Search, MessageSquare, Clock, MapPin, Tag, Baby, FileSpreadsheet, Trash2, CopySlash, Phone } from 'lucide-react';
import { ContactLead, KanbanColumn } from '../../types';
import { CustomSelect } from '../common/CustomSelect';
import { formatPhoneForCall } from '../../utils/phoneUtils';

interface LeadsListViewProps {
  leads: ContactLead[];
  columns: KanbanColumn[];
  selectedLeadId?: string | null;
  onSelectLeadForChat: (lead: ContactLead) => void;
  onOpenFollowUpModal: (lead: ContactLead) => void;
  onOpenImportCsv?: () => void;
  onOpenDeduplicate?: () => void;
  onDeleteLead?: (lead: ContactLead) => void;
}

export const LeadsListView: React.FC<LeadsListViewProps> = ({
  leads,
  columns,
  selectedLeadId,
  onSelectLeadForChat,
  onOpenFollowUpModal,
  onOpenImportCsv,
  onOpenDeduplicate,
  onDeleteLead,
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
        <div className="flex items-center gap-2 flex-wrap">
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

          {onOpenDeduplicate && (
            <button
              onClick={onOpenDeduplicate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#14382F] hover:bg-amber-500/20 hover:border-amber-400/50 text-amber-300 rounded-xl text-xs font-bold border border-[#235447] transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
              title="Escanear e remover leads repetidos pelo número de telefone"
            >
              <CopySlash className="w-3.5 h-3.5" />
              <span>Varredura de Duplicados</span>
            </button>
          )}

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

      {/* Desktop Table (Hidden on mobile) */}
      <div className="hidden md:block rounded-2xl border border-[#235447] bg-[#0F2D26] overflow-hidden">
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
                      <div className="flex items-center justify-end gap-2 sm:gap-3.5">
                        {lead.phone && (
                          <a
                            href={formatPhoneForCall(lead.phone)}
                            className="p-1.5 rounded-xl bg-[#14382F] hover:bg-[#C1F76B] text-[#C1F76B] hover:text-[#0F2D26] border border-[#235447] hover:border-[#C1F76B] transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                            title={`Ligar para ${lead.name || lead.phone}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
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
                        {onDeleteLead && (
                          <button
                            type="button"
                            onClick={() => onDeleteLead(lead)}
                            className="p-1.5 rounded-xl bg-[#14382F] hover:bg-red-500/20 text-[#95BDB0] hover:text-red-400 border border-[#235447] hover:border-red-500/40 transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                            title="Excluir Lead permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View (Visible only on mobile devices) */}
      <div className="md:hidden space-y-3 pb-8">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[#95BDB0] bg-[#0F2D26] rounded-2xl border border-[#235447]">
            <p className="text-sm font-medium text-[#FDFEF8]">Nenhum cliente cadastrado ainda</p>
            <p className="text-xs text-[#95BDB0] mt-1">Os novos leads do WhatsApp aparecerão aqui automaticamente.</p>
          </div>
        ) : (
          filtered.map((lead) => {
            const col = columns.find((c) => c.id === lead.columnId);
            const isSelected = lead.id === selectedLeadId;
            const hasUnread = (lead.unreadCount || 0) > 0;

            return (
              <div
                key={lead.id}
                onClick={() => onSelectLeadForChat(lead)}
                className={`p-3.5 rounded-2xl border bg-[#0F2D26] transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#C1F76B] ring-1 ring-[#C1F76B] bg-[#14382F]'
                    : 'border-[#235447] hover:border-[#2E6858] active:bg-[#14382F]'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-shrink-0">
                      {lead.avatar ? (
                        <img
                          src={lead.avatar}
                          alt={lead.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#2E6858]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#184339] border border-[#2E6858] flex items-center justify-center text-sm font-bold text-[#C1F76B]">
                          {lead.name ? lead.name.trim().charAt(0).toUpperCase() : '#'}
                        </div>
                      )}
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C1F76B] text-[#0F2D26] font-extrabold text-[10px] flex items-center justify-center ring-2 ring-[#0F2D26]">
                          {lead.unreadCount}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-[#FDFEF8] leading-tight">{lead.name}</h4>
                      <p className="text-xs text-[#95BDB0] mt-0.5">{lead.phone}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-xs text-[#C1F76B] bg-[#C1F76B]/15 px-2 py-0.5 rounded-md border border-[#C1F76B]/30 inline-block">
                      {lead.dealValue.toLocaleString()} MT
                    </span>
                    {col && (
                      <div className="mt-1">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            backgroundColor: `${col.color}15`,
                            color: col.color,
                            border: `1px solid ${col.color}30`,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                          {col.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub info */}
                {(lead.childInfo || lead.location) && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#D1EAE0] mb-3 bg-[#14382F]/60 px-2.5 py-1.5 rounded-xl border border-[#235447]/60">
                    {lead.childInfo && (
                      <span className="flex items-center gap-1">
                        <Baby className="w-3 h-3 text-pink-400" />
                        <span>{lead.childInfo}</span>
                      </span>
                    )}
                    {lead.location && (
                      <span className="flex items-center gap-1 text-[#95BDB0]">
                        <MapPin className="w-3 h-3 text-red-400" />
                        <span>{lead.location}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#235447]/60" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    {lead.phone && (
                      <a
                        href={formatPhoneForCall(lead.phone)}
                        className="px-3 py-2 rounded-xl bg-[#14382F] hover:bg-[#C1F76B] text-[#C1F76B] hover:text-[#0F2D26] border border-[#235447] font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                        title={`Ligar para ${lead.name || lead.phone}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Ligar</span>
                      </a>
                    )}
                    {onDeleteLead && (
                      <button
                        type="button"
                        onClick={() => onDeleteLead(lead)}
                        className="p-2 rounded-xl bg-[#14382F] hover:bg-red-500/20 text-[#95BDB0] hover:text-red-400 border border-[#235447] transition-all"
                        title="Excluir Lead"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectLeadForChat(lead)}
                    className="flex-1 py-2 px-3.5 rounded-xl bg-[#C1F76B] text-[#0F2D26] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#C1F76B]/20 active:scale-95 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'Fechar Chat' : 'Conversar'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

