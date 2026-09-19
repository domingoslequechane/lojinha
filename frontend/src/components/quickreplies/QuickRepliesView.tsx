import React, { useState } from 'react';
import { 
  Zap, 
  Plus, 
  Search, 
  Copy, 
  Trash2, 
  Edit3, 
  Check, 
  Sparkles,
  Layers,
  Image as ImageIcon,
  Smartphone,
  CreditCard,
  Truck,
  Clock,
  ListFilter,
  X,
  MessageSquare
} from 'lucide-react';
import { QuickReply } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { CustomSelect } from '../common/CustomSelect';

interface QuickRepliesViewProps {
  quickReplies: QuickReply[];
  onSaveReplies: (replies: QuickReply[]) => void;
}

export const QuickRepliesView: React.FC<QuickRepliesViewProps> = ({
  quickReplies,
  onSaveReplies,
}) => {
  const [replies, setReplies] = useState<QuickReply[]>([...quickReplies]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New/Edit form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [shortcut, setShortcut] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'demonstracao' | 'pagamento' | 'entrega' | 'followup'>('demonstracao');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  const categories: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Todos os Snippets', icon: <ListFilter className="w-3.5 h-3.5" /> },
    { id: 'demonstracao', label: 'Demonstração', icon: <Smartphone className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'followup', label: 'Follow-ups', icon: <Clock className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'pagamento', label: 'Pagamentos', icon: <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'entrega', label: 'Fretes & Bairros', icon: <Truck className="w-3.5 h-3.5 text-violet-400" /> },
  ];

  const filteredReplies = replies.filter((reply) => {
    const matchesCategory = activeCategory === 'all' || reply.category === activeCategory;
    const matchesSearch =
      reply.shortcut.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reply.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reply.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    replyId: string | null;
    replyTitle: string;
  }>({
    isOpen: false,
    replyId: null,
    replyTitle: '',
  });

  const handleDelete = (id: string) => {
    const r = replies.find((item) => item.id === id);
    setDeleteConfirmState({
      isOpen: true,
      replyId: id,
      replyTitle: r?.title || 'este snippet',
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmState.replyId) {
      const updated = replies.filter((r) => r.id !== deleteConfirmState.replyId);
      setReplies(updated);
      onSaveReplies(updated);
    }
    setDeleteConfirmState({ isOpen: false, replyId: null, replyTitle: '' });
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setShortcut('/');
    setTitle('');
    setContent('');
    setMediaUrl('');
    setCategory('demonstracao');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (reply: QuickReply) => {
    setEditingId(reply.id);
    setShortcut(reply.shortcut);
    setTitle(reply.title);
    setContent(reply.content);
    setMediaUrl(reply.mediaUrl || '');
    setCategory(reply.category);
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortcut.trim() || !title.trim() || !content.trim()) return;

    const formattedShortcut = shortcut.startsWith('/') ? shortcut.trim() : `/${shortcut.trim()}`;

    if (editingId) {
      // Update existing
      const updated = replies.map((r) =>
        r.id === editingId
          ? {
              ...r,
              shortcut: formattedShortcut,
              title: title.trim(),
              category,
              content: content.trim(),
              mediaUrl: mediaUrl.trim() || undefined,
            }
          : r
      );
      setReplies(updated);
      onSaveReplies(updated);
    } else {
      // Create new
      const newReply: QuickReply = {
        id: `qr-${Date.now()}`,
        shortcut: formattedShortcut,
        title: title.trim(),
        category,
        content: content.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
      };
      const updated = [newReply, ...replies];
      setReplies(updated);
      onSaveReplies(updated);
    }

    setIsFormOpen(false);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-3 sm:p-6 bg-[#091E19] space-y-4 sm:space-y-6 select-none font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#FDFEF8] flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            Respostas Rápidas & Snippets de Venda
          </h2>
          <p className="text-xs text-[#95BDB0] mt-1">
            Responda dúvidas sobre tablets, envie dados de M-Pesa e faça follow-up com 1 clique no WhatsApp
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2.5 bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] rounded-xl text-xs font-bold shadow-md shadow-[#C1F76B]/20 transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Snippet</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F2D26] p-3 rounded-2xl border border-[#235447]">
        {/* Categories Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none]">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? 'bg-[#C1F76B] text-[#0F2D26] font-semibold shadow-md shadow-[#C1F76B]/20'
                  : 'text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F]'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[#95BDB0] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por atalho ou texto..."
            className="w-full bg-[#14382F] text-xs text-[#FDFEF8] pl-9 pr-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
          />
        </div>
      </div>

      {/* Snippets Grid or Empty State */}
      {filteredReplies.length === 0 ? (
        <div className="p-12 text-center bg-[#0F2D26] border border-[#235447] rounded-3xl flex flex-col items-center justify-center space-y-3 animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-2xl bg-[#14382F] flex items-center justify-center text-[#95BDB0]">
            <MessageSquare className="w-6 h-6 text-[#C1F76B]" />
          </div>
          <h3 className="text-sm font-bold text-[#FDFEF8]">Nenhum snippet encontrado</h3>
          <p className="text-xs text-[#95BDB0] max-w-sm">
            Crie suas próprias respostas rápidas para agilizar o atendimento aos seus clientes no WhatsApp.
          </p>
          <button
            onClick={handleOpenNew}
            className="mt-2 px-4 py-2.5 bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Primeiro Snippet</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReplies.map((reply) => (
          <div
            key={reply.id}
            className="p-4 bg-[#0F2D26] border border-[#235447] hover:border-[#C1F76B]/40 hover:scale-[1.015] hover:shadow-xl hover:shadow-black/30 rounded-2xl flex flex-col justify-between transition-all duration-200 group"
          >
            <div>
              {/* Card Top */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {reply.shortcut}
                </span>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(reply.id, reply.content)}
                    className="p-1.5 text-[#95BDB0] hover:text-[#C1F76B] rounded-lg hover:bg-[#14382F] transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer"
                    title="Copiar texto"
                  >
                    {copiedId === reply.id ? (
                      <Check className="w-3.5 h-3.5 text-[#C1F76B]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(reply)}
                    className="p-1.5 text-[#95BDB0] hover:text-[#FDFEF8] rounded-lg hover:bg-[#14382F] transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer"
                    title="Editar snippet"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(reply.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/20 transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="font-semibold text-sm text-[#FDFEF8] mb-2 leading-snug">
                {reply.title}
              </h4>

              {/* Snippet Content Preview */}
              <p className="text-xs text-[#95BDB0] whitespace-pre-line bg-[#0B241D] p-3 rounded-xl border border-[#235447]/60 font-sans leading-relaxed line-clamp-6">
                {reply.content}
              </p>

              {reply.mediaUrl && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#C1F76B] bg-[#C1F76B]/10 px-2.5 py-1 rounded-lg border border-[#C1F76B]/20">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Possui imagem/mídia anexada</span>
                </div>
              )}
            </div>

            {/* Category tag */}
            <div className="mt-3 pt-2.5 border-t border-[#235447]/60 flex items-center justify-between text-[11px]">
              <span className="text-[#95BDB0] capitalize flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#C1F76B]" />
                {reply.category}
              </span>
              <span className="text-[10px] text-[#95BDB0]/70">Disponível no chat</span>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Create / Edit Drawer/Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-[#14382F] border-b border-[#235447] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#FDFEF8] flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                {editingId ? 'Editar Snippet' : 'Criar Novo Snippet de Resposta'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                    Atalho (ex: /specs, /mpesa) *
                  </label>
                  <input
                    type="text"
                    required
                    value={shortcut}
                    onChange={(e) => setShortcut(e.target.value)}
                    placeholder="/atalho"
                    className="w-full bg-[#14382F] text-xs text-amber-400 font-mono font-bold px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                    Categoria *
                  </label>
                  <CustomSelect
                    value={category}
                    onChange={(val) => setCategory(val as any)}
                    options={[
                      { value: 'demonstracao', label: 'Demonstração' },
                      { value: 'followup', label: 'Follow-up de Venda' },
                      { value: 'pagamento', label: 'Pagamento (M-Pesa)' },
                      { value: 'entrega', label: 'Entrega / Frete' },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                  Título Identificador *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Tabela de Fretes Matola / Zimpeto"
                  className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                  Mensagem Completa que o WhatsApp enviará *
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva a resposta formatada com emojis e detalhes..."
                  className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none resize-none font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                  URL de Foto ou Vídeo (Opcional)
                </label>
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://... foto do tablet ou capa"
                  className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#235447] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#95BDB0] hover:text-[#FDFEF8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] shadow-md shadow-[#C1F76B]/20"
                >
                  {editingId ? 'Salvar Alterações' : 'Criar Snippet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmState.isOpen}
        title="Excluir Resposta Rápida"
        message={`Tem certeza que deseja excluir o snippet "${deleteConfirmState.replyTitle}"? Esta mensagem deixará de estar disponível nos atalhos do chat.`}
        confirmText="Excluir Snippet"
        cancelText="Cancelar"
        confirmVariant="danger"
        iconType="trash"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmState({ isOpen: false, replyId: null, replyTitle: '' })}
      />
    </div>
  );
};

