import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  LayoutDashboard, 
  Zap, 
  Users, 
  TrendingUp, 
  Store, 
  Smartphone,
  Check,
  Lock,
  Columns,
  Sparkles
} from 'lucide-react';
import { StoreMember, ModulePermission, KanbanColumn } from '../../types';

interface MemberModalProps {
  isOpen: boolean;
  member?: StoreMember | null;
  columns: KanbanColumn[];
  onClose: () => void;
  onSave: (memberData: Partial<StoreMember> & { name: string; email: string; password?: string }) => Promise<void>;
}

const AVAILABLE_MODULES: {
  id: ModulePermission;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    id: 'cockpit',
    label: 'Vendas (Cockpit Kanban & Chat)',
    description: 'Acesso ao funil de vendas, quadros Kanban e atendimento via chat ao vivo.',
    icon: LayoutDashboard,
    color: '#C1F76B',
  },
  {
    id: 'quickreplies',
    label: 'Respostas Rápidas',
    description: 'Visualizar e utilizar os atalhos e mensagens pré-definidas da loja.',
    icon: Zap,
    color: '#f59e0b',
  },
  {
    id: 'leads',
    label: 'Contatos & Leads',
    description: 'Gestão completa da base de clientes, importação de CSV e histórico.',
    icon: Users,
    color: '#38bdf8',
  },
  {
    id: 'metrics',
    label: 'Métricas & Funil',
    description: 'Visualizar relatórios de faturamento, taxas de conversão e gráficos.',
    icon: TrendingUp,
    color: '#a78bfa',
  },
  {
    id: 'store',
    label: 'Minha Loja (Catálogo e Ajustes)',
    description: 'Editar produtos do catálogo, formas de pagamento e dados da loja.',
    icon: Store,
    color: '#f472b6',
  },
  {
    id: 'whatsapp',
    label: 'Conexões do WhatsApp',
    description: 'Visualizar instâncias conectadas e escanear QR codes do WhatsApp.',
    icon: Smartphone,
    color: '#27AE60',
  },
];

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  member,
  columns,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'gerente' | 'vendedor'>('vendedor');
  const [selectedPermissions, setSelectedPermissions] = useState<ModulePermission[]>(['cockpit']);
  const [restrictColumns, setRestrictColumns] = useState(false);
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setEmail(member.email || '');
      setPhone(member.phone || '');
      setRole(member.role || 'vendedor');
      setSelectedPermissions(member.permissions && member.permissions.length > 0 ? member.permissions : ['cockpit']);
      if (member.allowedColumnIds && member.allowedColumnIds.length > 0) {
        setRestrictColumns(true);
        setSelectedColumnIds(member.allowedColumnIds);
      } else {
        setRestrictColumns(false);
        setSelectedColumnIds([]);
      }
      setPassword('');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRole('vendedor');
      setSelectedPermissions(['cockpit', 'quickreplies', 'leads']);
      setRestrictColumns(false);
      setSelectedColumnIds([]);
    }
    setError(null);
  }, [member, isOpen]);

  if (!isOpen) return null;

  const handleToggleModule = (modId: ModulePermission) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(modId)) {
        // Must keep at least one permission
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== modId);
      } else {
        return [...prev, modId];
      }
    });
  };

  const handleToggleColumn = (colId: string) => {
    setSelectedColumnIds((prev) => {
      if (prev.includes(colId)) {
        return prev.filter((id) => id !== colId);
      } else {
        return [...prev, colId];
      }
    });
  };

  const handleSelectAllColumns = () => {
    setSelectedColumnIds(columns.map((c) => c.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome do membro.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }
    if (selectedPermissions.length === 0) {
      setError('Selecione pelo menos uma funcionalidade permitida.');
      return;
    }
    if (selectedPermissions.includes('cockpit') && restrictColumns && selectedColumnIds.length === 0) {
      setError('Selecione pelo menos uma coluna do funil para o membro ter acesso.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave({
        id: member?.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password: password.trim() || undefined,
        role,
        permissions: selectedPermissions,
        allowedColumnIds: restrictColumns && selectedPermissions.includes('cockpit') ? selectedColumnIds : null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar membro da equipe.');
    } finally {
      setLoading(false);
    }
  };

  const hasCockpitSelected = selectedPermissions.includes('cockpit');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#14382F] border-b border-[#235447] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C1F76B]/15 text-[#C1F76B] border border-[#C1F76B]/30 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-baloo font-bold text-base sm:text-lg text-[#FDFEF8] leading-tight">
                {member ? 'Editar Membro da Equipe' : 'Adicionar Novo Membro'}
              </h3>
              <p className="text-xs text-[#95BDB0]">
                Defina os dados, papéis e permissões de acesso deste colaborador.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#0F2D26] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C1F76B] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Informações do Colaborador
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#D1EAE0] mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#95BDB0] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Ana Silva"
                    className="w-full h-10 bg-[#14382F] text-xs sm:text-sm text-[#FDFEF8] placeholder-[#95BDB0]/60 pl-9 pr-3 rounded-xl border border-[#235447] focus:border-[#C1F76B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1EAE0] mb-1">
                  E-mail de Acesso *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#95BDB0] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: ana@loja.com"
                    className="w-full h-10 bg-[#14382F] text-xs sm:text-sm text-[#FDFEF8] placeholder-[#95BDB0]/60 pl-9 pr-3 rounded-xl border border-[#235447] focus:border-[#C1F76B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1EAE0] mb-1">
                  Telefone / WhatsApp (Opcional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#95BDB0] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: +258 84 123 4567"
                    className="w-full h-10 bg-[#14382F] text-xs sm:text-sm text-[#FDFEF8] placeholder-[#95BDB0]/60 pl-9 pr-3 rounded-xl border border-[#235447] focus:border-[#C1F76B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1EAE0] mb-1">
                  Papel na Loja
                </label>
                <div className="grid grid-cols-3 gap-1.5 h-10 p-1 bg-[#14382F] border border-[#235447] rounded-xl">
                  {(['vendedor', 'gerente', 'admin'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`h-full text-xs font-bold rounded-lg capitalize transition-all ${
                        role === r
                          ? 'bg-[#C1F76B] text-[#0F2D26] shadow-sm'
                          : 'text-[#95BDB0] hover:text-[#FDFEF8]'
                      }`}
                    >
                      {r === 'vendedor' ? 'Vendedor' : r === 'gerente' ? 'Gerente' : 'Admin'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!member && (
              <div>
                <label className="block text-xs font-semibold text-[#D1EAE0] mb-1">
                  Senha Temporária de Acesso (Opcional)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#95BDB0] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Defina uma senha inicial ou deixe em branco para convite"
                    className="w-full h-10 bg-[#14382F] text-xs sm:text-sm text-[#FDFEF8] placeholder-[#95BDB0]/60 pl-9 pr-3 rounded-xl border border-[#235447] focus:border-[#C1F76B] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-[#235447]/60" />

          {/* Module Permissions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#C1F76B] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Funcionalidades Permitidas
              </h4>
              <span className="text-[11px] text-[#95BDB0]">
                {selectedPermissions.length} de {AVAILABLE_MODULES.length} ativas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_MODULES.map((mod) => {
                const Icon = mod.icon;
                const isSelected = selectedPermissions.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => handleToggleModule(mod.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                      isSelected
                        ? 'bg-[#14382F] border-[#C1F76B]/60 shadow-sm shadow-[#C1F76B]/5 ring-1 ring-[#C1F76B]/20'
                        : 'bg-[#0B241D] border-[#235447] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected ? 'bg-[#C1F76B]/20 text-[#C1F76B]' : 'bg-[#14382F] text-[#95BDB0]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? 'text-[#FDFEF8]' : 'text-[#95BDB0]'}`}>
                          {mod.label}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#C1F76B] border-[#C1F76B] text-[#0F2D26]'
                              : 'border-[#235447] bg-[#14382F]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#95BDB0] mt-0.5 leading-tight">
                        {mod.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Granular Cockpit Columns Permissions (Visible when Cockpit is selected) */}
          {hasCockpitSelected && (
            <div className="p-4 rounded-2xl bg-[#091E19] border border-[#235447] space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Columns className="w-4 h-4 text-[#C1F76B]" />
                  <div>
                    <h5 className="text-xs font-bold text-[#FDFEF8]">
                      Acesso às Etapas do Funil (Colunas)
                    </h5>
                    <p className="text-[11px] text-[#95BDB0]">
                      Defina quais colunas do Kanban este colaborador poderá visualizar e interagir.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mode Toggle: All vs Specific */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#14382F] rounded-xl border border-[#235447]">
                <button
                  type="button"
                  onClick={() => setRestrictColumns(false)}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    !restrictColumns
                      ? 'bg-[#C1F76B] text-[#0F2D26] font-bold shadow-xs'
                      : 'text-[#95BDB0] hover:text-[#FDFEF8]'
                  }`}
                >
                  Todas as Colunas (Livre)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRestrictColumns(true);
                    if (selectedColumnIds.length === 0) {
                      handleSelectAllColumns();
                    }
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    restrictColumns
                      ? 'bg-[#C1F76B] text-[#0F2D26] font-bold shadow-xs'
                      : 'text-[#95BDB0] hover:text-[#FDFEF8]'
                  }`}
                >
                  Colunas Específicas
                </button>
              </div>

              {/* Columns Selector Checklist */}
              {restrictColumns && (
                <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] text-[#95BDB0] px-1">
                    <span>Selecione as colunas permitidas:</span>
                    <button
                      type="button"
                      onClick={handleSelectAllColumns}
                      className="text-[#C1F76B] hover:underline font-semibold"
                    >
                      Selecionar Todas
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {columns.map((col) => {
                      const isChecked = selectedColumnIds.includes(col.id);
                      return (
                        <div
                          key={col.id}
                          onClick={() => handleToggleColumn(col.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'bg-[#14382F] border-[#C1F76B]/40 text-[#FDFEF8]'
                              : 'bg-[#0F2D26] border-[#235447] text-[#95BDB0] opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: col.color || '#C1F76B' }}
                            />
                            <span className="text-xs font-medium truncate">{col.title}</span>
                          </div>
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                              isChecked
                                ? 'bg-[#C1F76B] border-[#C1F76B] text-[#0F2D26]'
                                : 'border-[#235447] bg-[#091E19]'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#235447]/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#14382F] hover:bg-[#184339] text-[#95BDB0] hover:text-[#FDFEF8] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#b0ec53] shadow-md shadow-[#C1F76B]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{member ? 'Atualizar Membro' : 'Adicionar à Equipe'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
