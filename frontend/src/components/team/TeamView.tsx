import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Shield, 
  Search, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Mail, 
  Phone, 
  LayoutDashboard, 
  Zap, 
  TrendingUp, 
  Store, 
  Smartphone,
  Columns,
  Sparkles,
  ShieldCheck,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';
import { StoreMember, KanbanColumn, ModulePermission } from '../../types';
import { teamService } from '../../services/teamService';
import { MemberModal } from './MemberModal';
import { MemberSuccessModal } from './MemberSuccessModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface TeamViewProps {
  storeId: string;
  storeName?: string;
  columns: KanbanColumn[];
}

const MODULE_ICONS: Record<ModulePermission, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  cockpit: { label: 'Vendas (Funil)', icon: LayoutDashboard, color: '#C1F76B' },
  quickreplies: { label: 'Respostas Rápidas', icon: Zap, color: '#f59e0b' },
  leads: { label: 'Leads & Clientes', icon: Users, color: '#38bdf8' },
  metrics: { label: 'Métricas & Funil', icon: TrendingUp, color: '#a78bfa' },
  store: { label: 'Minha Loja', icon: Store, color: '#f472b6' },
  whatsapp: { label: 'Conexões WhatsApp', icon: Smartphone, color: '#27AE60' },
};

export const TeamView: React.FC<TeamViewProps> = ({ storeId, storeName = 'Minha Loja', columns }) => {
  const [members, setMembers] = useState<StoreMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StoreMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<StoreMember | null>(null);
  const [successModalMember, setSuccessModalMember] = useState<StoreMember | null>(null);
  const [successModalPassword, setSuccessModalPassword] = useState<string | undefined>(undefined);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await teamService.getTeamMembers(storeId);
      setMembers(data);
    } catch (e) {
      console.error('Error loading team members:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [storeId]);

  const handleSaveMember = async (memberData: Partial<StoreMember> & { name: string; email: string; password?: string }) => {
    const result = await teamService.saveTeamMember(memberData, storeId);
    if (result.success && result.member) {
      setMembers((prev) => {
        const idx = prev.findIndex((m) => m.id === result.member!.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = result.member!;
          return updated;
        }
        return [...prev, result.member!];
      });

      // Abre o modal de sucesso com as instruções para o colaborador
      setSuccessModalMember(result.member);
      setSuccessModalPassword(memberData.password);
      setIsModalOpen(false);
      setEditingMember(null);
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    await teamService.deleteTeamMember(memberToDelete.id, storeId);
    setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
    setMemberToDelete(null);
  };

  const handleToggleStatus = async (member: StoreMember) => {
    const newStatus = !member.isActive;
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, isActive: newStatus } : m))
    );
    await teamService.toggleMemberStatus(member.id, newStatus, storeId);
  };

  const filteredMembers = members.filter((m) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      (m.phone && m.phone.includes(term)) ||
      m.role.toLowerCase().includes(term)
    );
  });

  const activeCount = members.filter((m) => m.isActive).length;
  const sellersCount = members.filter((m) => m.role === 'vendedor').length;
  const managersCount = members.filter((m) => m.role === 'gerente' || m.role === 'admin').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#091E19] overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full custom-scrollbar">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#235447]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#C1F76B]/15 text-[#C1F76B] border border-[#C1F76B]/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="font-baloo font-bold text-2xl sm:text-3xl text-[#FDFEF8] tracking-tight">
              Gestão de Equipe & Permissões
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#95BDB0] mt-1 max-w-2xl leading-relaxed">
            Adicione vendedores e gerentes, defina quais módulos do Lojinha eles podem acessar e controle as colunas do funil liberadas para cada um.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingMember(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#b0ec53] shadow-lg shadow-[#C1F76B]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Adicionar Membro</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-6">
        <div className="bg-[#0F2D26] border border-[#235447] p-4 rounded-2xl">
          <span className="text-xs text-[#95BDB0]">Total na Equipe</span>
          <p className="text-2xl font-bold text-[#FDFEF8] mt-1">{members.length}</p>
        </div>
        <div className="bg-[#0F2D26] border border-[#235447] p-4 rounded-2xl">
          <span className="text-xs text-[#95BDB0]">Membros Ativos</span>
          <p className="text-2xl font-bold text-[#C1F76B] mt-1">{activeCount}</p>
        </div>
        <div className="bg-[#0F2D26] border border-[#235447] p-4 rounded-2xl">
          <span className="text-xs text-[#95BDB0]">Vendedores</span>
          <p className="text-2xl font-bold text-[#38bdf8] mt-1">{sellersCount}</p>
        </div>
        <div className="bg-[#0F2D26] border border-[#235447] p-4 rounded-2xl">
          <span className="text-xs text-[#95BDB0]">Gerentes / Admins</span>
          <p className="text-2xl font-bold text-[#f59e0b] mt-1">{managersCount}</p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#95BDB0] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou papel..."
            className="w-full h-10 bg-[#0F2D26] text-xs sm:text-sm text-[#FDFEF8] placeholder-[#95BDB0]/60 pl-10 pr-4 rounded-xl border border-[#235447] focus:border-[#C1F76B] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Members Grid / List */}
      {loading ? (
        <div className="p-12 text-center text-[#95BDB0]">
          <div className="w-8 h-8 border-2 border-[#C1F76B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Carregando membros da equipe...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="p-12 text-center bg-[#0F2D26]/60 border border-[#235447] rounded-3xl my-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#14382F] text-[#95BDB0] flex items-center justify-center mx-auto mb-4 border border-[#235447]">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-[#FDFEF8]">
            {searchTerm ? 'Nenhum membro encontrado na busca' : 'Nenhum colaborador adicionado ainda'}
          </h3>
          <p className="text-xs text-[#95BDB0] mt-1.5 max-w-md mx-auto leading-relaxed">
            {searchTerm
              ? 'Tente pesquisar com outros termos.'
              : 'Dê acesso ao Lojinha para os vendedores e gerentes da sua loja com permissões personalizadas.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => {
                setEditingMember(null);
                setIsModalOpen(true);
              }}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#b0ec53] transition-all cursor-pointer shadow-md shadow-[#C1F76B]/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Adicionar Primeiro Membro</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
          {filteredMembers.map((member) => {
            const hasRestrictedColumns =
              member.permissions?.includes('cockpit') &&
              member.allowedColumnIds &&
              member.allowedColumnIds.length > 0;

            const allowedColumnsCount = hasRestrictedColumns
              ? member.allowedColumnIds!.length
              : columns.length;

            return (
              <div
                key={member.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                  member.isActive
                    ? 'bg-[#0F2D26] border-[#235447] hover:border-[#C1F76B]/40'
                    : 'bg-[#091E19]/80 border-[#235447]/60 opacity-60'
                }`}
              >
                {/* Member Top Info */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#14382F] border border-[#235447] flex items-center justify-center text-[#C1F76B] font-bold text-base flex-shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-[#FDFEF8] leading-snug">
                            {member.name}
                          </h4>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider border ${
                              member.role === 'admin'
                                ? 'bg-red-500/15 text-red-300 border-red-500/30'
                                : member.role === 'gerente'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-[#C1F76B]/15 text-[#C1F76B] border-[#C1F76B]/30'
                            }`}
                          >
                            {member.role === 'vendedor' ? 'Vendedor' : member.role === 'gerente' ? 'Gerente' : 'Admin'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#95BDB0] mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#95BDB0]/70" />
                            {member.email}
                          </span>
                          {member.phone && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-[#95BDB0]/70" />
                                {member.phone}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(member)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        member.isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
                      }`}
                      title={member.isActive ? 'Clique para desativar' : 'Clique para ativar'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                      <span>{member.isActive ? 'Ativo' : 'Inativo'}</span>
                    </button>
                  </div>

                  {/* Permissions Chips */}
                  <div className="mt-4 pt-3.5 border-t border-[#235447]/60 space-y-2">
                    <span className="text-[11px] font-semibold text-[#95BDB0] block">
                      Módulos com Acesso:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {member.permissions && member.permissions.length > 0 ? (
                        member.permissions.map((perm) => {
                          const config = MODULE_ICONS[perm];
                          if (!config) return null;
                          const Icon = config.icon;
                          return (
                            <span
                              key={perm}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#14382F] border border-[#235447] text-[11px] font-medium text-[#D1EAE0]"
                            >
                              <Icon className="w-3 h-3" />
                              <span>{config.label}</span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[11px] text-zinc-500 italic">Nenhum módulo configurado</span>
                      )}
                    </div>

                    {/* Cockpit Column Access Indicator */}
                    {member.permissions?.includes('cockpit') && (
                      <div className="mt-2 text-xs flex items-center gap-2 pt-1 text-[#C1F76B]">
                        <Columns className="w-3.5 h-3.5 text-[#C1F76B]" />
                        <span className="text-[11px] font-semibold">
                          {hasRestrictedColumns
                            ? `Acesso a ${allowedColumnsCount} de ${columns.length} colunas do funil`
                            : 'Acesso a todas as colunas do funil'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-[#235447]/60 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingMember(member);
                      setIsModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#14382F] hover:bg-[#184339] hover:border-[#C1F76B]/40 text-[#D1EAE0] hover:text-[#C1F76B] text-xs font-semibold border border-[#235447] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Permissões</span>
                  </button>

                  <button
                    onClick={() => setMemberToDelete(member)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer"
                    title="Remover membro da equipe"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Member Edit / Create Modal */}
      <MemberModal
        isOpen={isModalOpen}
        member={editingMember}
        columns={columns}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
      />

      {/* Member Success & Instructions Modal */}
      <MemberSuccessModal
        isOpen={!!successModalMember}
        member={successModalMember}
        temporaryPassword={successModalPassword}
        storeName={storeName}
        columns={columns}
        onClose={() => {
          setSuccessModalMember(null);
          setSuccessModalPassword(undefined);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!memberToDelete}
        title="Remover Membro da Equipe"
        message={`Tem certeza que deseja remover ${memberToDelete?.name} da equipe? Este usuário perderá o acesso à loja.`}
        confirmText="Sim, Remover"
        cancelText="Cancelar"
        confirmVariant="danger"
        iconType="trash"
        onConfirm={handleDeleteMember}
        onCancel={() => setMemberToDelete(null)}
      />
    </div>
  );
};
