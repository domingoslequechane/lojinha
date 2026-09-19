import React, { useState } from 'react';
import { Zap, Plus, Trash2, X, Check, Copy, Sparkles } from 'lucide-react';
import { QuickReply } from '../../types';

interface QuickRepliesModalProps {
  isOpen: boolean;
  quickReplies: QuickReply[];
  onClose: () => void;
  onSaveReplies: (replies: QuickReply[]) => void;
}

export const QuickRepliesModal: React.FC<QuickRepliesModalProps> = ({
  isOpen,
  quickReplies,
  onClose,
  onSaveReplies,
}) => {
  if (!isOpen) return null;

  const [replies, setReplies] = useState<QuickReply[]>([...quickReplies]);
  const [shortcut, setShortcut] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortcut.trim() || !title.trim() || !content.trim()) return;

    const formattedShortcut = shortcut.startsWith('/') ? shortcut.trim() : `/${shortcut.trim()}`;

    const newReply: QuickReply = {
      id: `qr-${Date.now()}`,
      shortcut: formattedShortcut,
      title: title.trim(),
      category: 'demonstracao',
      content: content.trim(),
    };

    setReplies([...replies, newReply]);
    setShortcut('');
    setTitle('');
    setContent('');
  };

  const handleDelete = (id: string) => {
    setReplies(replies.filter((r) => r.id !== id));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = () => {
    onSaveReplies(replies);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 bg-[#14382F] border-b border-[#235447] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#FDFEF8]">Respostas Rápidas & Snippets de Venda</h3>
              <p className="text-xs text-[#95BDB0]">Dispare mensagens completas com 1 toque no chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#0F2D26] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Quick Replies List */}
        <div className="p-5 max-h-80 overflow-y-auto space-y-3">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="p-3.5 bg-[#14382F] border border-[#235447] rounded-2xl flex flex-col gap-2 group hover:border-[#2D6B5A] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {reply.shortcut}
                  </span>
                  <h4 className="font-semibold text-xs text-[#FDFEF8]">{reply.title}</h4>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(reply.id, reply.content)}
                    className="p-1.5 text-[#95BDB0] hover:text-[#C1F76B] rounded-lg hover:bg-[#14382F] transition-colors text-xs flex items-center gap-1"
                    title="Copiar Texto"
                  >
                    {copiedId === reply.id ? (
                      <span className="text-xs text-[#C1F76B] font-medium">Copiado!</span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(reply.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#95BDB0] whitespace-pre-line bg-[#0F2D26] p-2.5 rounded-xl border border-[#235447]/60 font-sans leading-relaxed">
                {reply.content}
              </p>
            </div>
          ))}
        </div>

        {/* Create New Quick Reply Form */}
        <form onSubmit={handleAdd} className="p-4 bg-[#14382F] border-t border-[#235447] space-y-3">
          <p className="text-xs font-bold text-[#FDFEF8] flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-[#C1F76B]" />
            Criar Novo Snippet de Resposta
          </p>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={shortcut}
              onChange={(e) => setShortcut(e.target.value)}
              placeholder="Atalho (ex: /garantia ou /desconto)"
              className="bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none font-mono"
            />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título (ex: Termo de Garantia 6 Meses)"
              className="bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
            />
          </div>

          <textarea
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Mensagem completa que será enviada no WhatsApp..."
            className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none resize-none"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!shortcut.trim() || !title.trim() || !content.trim()}
              className="px-4 py-2 bg-[#14382F] hover:bg-[#C1F76B] disabled:opacity-40 text-[#FDFEF8] rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Resposta</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-[#0B241D] border-t border-[#235447] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] shadow-md shadow-[#C1F76B]/20 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Respostas</span>
          </button>
        </div>
      </div>
    </div>
  );
};

