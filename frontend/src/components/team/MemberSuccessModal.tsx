import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  Share2, 
  ExternalLink, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Columns, 
  ArrowRight,
  Smartphone
} from 'lucide-react';
import { StoreMember, KanbanColumn, ModulePermission } from '../../types';

interface MemberSuccessModalProps {
  isOpen: boolean;
  member: StoreMember | null;
  temporaryPassword?: string;
  storeName?: string;
  columns: KanbanColumn[];
  onClose: () => void;
}

const MODULE_NAMES: Record<ModulePermission, string> = {
  cockpit: 'Vendas (Funil Kanban & Chat)',
  quickreplies: 'Respostas Rápidas',
  leads: 'Contatos & Leads',
  metrics: 'Métricas & Relatórios',
  store: 'Minha Loja & Catálogo',
  whatsapp: 'Conexões do WhatsApp',
};

export const MemberSuccessModal: React.FC<MemberSuccessModalProps> = ({
  isOpen,
  member,
  temporaryPassword,
  storeName = 'Minha Loja',
  columns,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  if (!isOpen || !member) return null;

  const appUrl = window.location.origin + '/login';

  const hasRestrictedColumns =
    member.permissions?.includes('cockpit') &&
    member.allowedColumnIds &&
    member.allowedColumnIds.length > 0;

  const allowedColumnTitles = hasRestrictedColumns
    ? columns.filter((c) => member.allowedColumnIds!.includes(c.id)).map((c) => c.title)
    : ['Todas as etapas do funil'];

  // Prepared instruction text for WhatsApp/Email
  const messageText = `*Olá, ${member.name}!* 👋\n\n` +
    `Você foi adicionado(a) à equipe da loja *${storeName}* no *Lojinha*.\n\n` +
    `*Seus dados de acesso:*\n` +
    `🌐 Link de Acesso: ${appUrl}\n` +
    `📧 E-mail: ${member.email}\n` +
    (temporaryPassword ? `🔑 Senha de Acesso: ${temporaryPassword}\n` : '') +
    `💼 Papel: ${member.role.toUpperCase()}\n\n` +
    `*O que você deve fazer agora:*\n` +
    `1. Acesse o link acima no seu celular ou computador.\n` +
    `2. Digite seu e-mail e senha.\n` +
    `3. Pronto! Você terá acesso imediato aos clientes e conversas autorizados.\n\n` +
    `Boas vendas! 🚀`;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  const handleCopyPasswordOnly = async () => {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = (member.phone || '').replace(/\D/g, '');
    const encoded = encodeURIComponent(messageText);
    const url = cleanPhone.length >= 8
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#0F2D26] border border-[#C1F76B]/40 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-[#14382F] border-b border-[#235447] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C1F76B]/20 text-[#C1F76B] border border-[#C1F76B]/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-baloo font-bold text-base sm:text-lg text-[#FDFEF8] leading-tight flex items-center gap-2">
                <span>Colaborador Adicionado com Sucesso!</span>
              </h3>
              <p className="text-xs text-[#95BDB0]">
                O membro já está cadastrado na equipe. Envie as instruções de acesso abaixo.
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

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Credentials Card */}
          <div className="p-4 rounded-2xl bg-[#14382F] border border-[#235447] space-y-3">
            <div className="flex items-center justify-between border-b border-[#235447]/60 pb-2">
              <span className="text-[11px] font-bold text-[#C1F76B] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Credenciais do Colaborador
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#C1F76B]/15 text-[#C1F76B] border border-[#C1F76B]/30">
                {member.role}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="space-y-0.5">
                <span className="text-[#95BDB0] text-[11px]">Nome:</span>
                <p className="font-bold text-[#FDFEF8] truncate">{member.name}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[#95BDB0] text-[11px]">E-mail de Login:</span>
                <p className="font-mono font-medium text-[#D1EAE0] truncate">{member.email}</p>
              </div>

              {temporaryPassword && (
                <div className="space-y-0.5 sm:col-span-2 p-2.5 rounded-xl bg-[#0F2D26] border border-[#C1F76B]/30 flex items-center justify-between">
                  <div>
                    <span className="text-[#95BDB0] text-[11px] block">Senha de Acesso:</span>
                    <span className="font-mono font-bold text-[#C1F76B] text-sm tracking-wider">
                      {temporaryPassword}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPasswordOnly}
                    className="px-2.5 py-1 rounded-lg bg-[#14382F] hover:bg-[#184339] text-[#C1F76B] text-[11px] font-bold border border-[#235447] flex items-center gap-1 cursor-pointer transition-all"
                  >
                    {copiedPassword ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPassword ? 'Copiada!' : 'Copiar'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Permissions & Columns Summary */}
          <div className="p-3.5 rounded-2xl bg-[#091E19] border border-[#235447] space-y-2 text-xs">
            <span className="text-[11px] font-semibold text-[#95BDB0] block">
              Permissões Liberadas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {member.permissions.map((perm) => (
                <span
                  key={perm}
                  className="px-2 py-0.5 rounded-lg bg-[#14382F] text-[11px] text-[#D1EAE0] border border-[#235447]"
                >
                  ✓ {MODULE_NAMES[perm] || perm}
                </span>
              ))}
            </div>

            {member.permissions.includes('cockpit') && (
              <div className="pt-2 border-t border-[#235447]/60 flex items-start gap-1.5 text-[11px] text-[#C1F76B]">
                <Columns className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Colunas do Funil:</strong>{' '}
                  {hasRestrictedColumns
                    ? allowedColumnTitles.join(', ')
                    : 'Acesso total a todas as etapas do funil'}
                </span>
              </div>
            )}
          </div>

          {/* Instructions Box */}
          <div className="p-4 rounded-2xl bg-[#14382F]/70 border border-[#235447] space-y-2">
            <h4 className="text-xs font-bold text-[#FDFEF8] flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-[#C1F76B]" />
              O que o colaborador deve fazer para entrar:
            </h4>
            <ol className="text-xs text-[#D1EAE0] space-y-1.5 pl-4 list-decimal leading-relaxed">
              <li>
                Acessar o link do aplicativo:{' '}
                <a
                  href={appUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#C1F76B] font-mono hover:underline inline-flex items-center gap-0.5"
                >
                  {appUrl} <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                Inserir o e-mail <strong>{member.email}</strong> e a senha informada.
              </li>
              <li>
                O sistema abrirá automaticamente a loja <strong>{storeName}</strong> com as permissões configuradas.
              </li>
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#0B241D] border-t border-[#235447] flex flex-col sm:flex-row items-center justify-between gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#14382F] hover:bg-[#184339] text-[#95BDB0] hover:text-[#FDFEF8] transition-all"
          >
            Fechar Janela
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold bg-[#14382F] hover:bg-[#184339] text-[#FDFEF8] border border-[#235447] hover:border-[#C1F76B]/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#C1F76B]" />}
              <span>{copied ? 'Instruções Copiadas!' : 'Copiar Mensagem'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold bg-[#27AE60] hover:bg-[#219653] text-white shadow-md shadow-[#27AE60]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>Enviar no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
