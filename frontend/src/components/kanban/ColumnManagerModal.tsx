import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Plus, Trash2, ArrowUp, ArrowDown, X, Check, Clock, Pencil, Loader2 } from 'lucide-react';
import { KanbanColumn } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { generateUUID } from '../../services/kanbanService';

interface ColumnManagerModalProps {
  isOpen: boolean;
  columns: KanbanColumn[];
  onClose: () => void;
  onSaveColumns: (columns: KanbanColumn[]) => Promise<boolean | void> | void;
}

const colorPalette = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#f97316', // Orange
  '#eab308', // Yellow
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#22c55e', // Green
  '#ec4899', // Pink
  '#ef4444', // Red
];

export const ColumnManagerModal: React.FC<ColumnManagerModalProps> = ({
  isOpen,
  columns,
  onClose,
  onSaveColumns,
}) => {
  if (!isOpen) return null;

  const [cols, setCols] = useState<KanbanColumn[]>(() =>
    [...columns].sort((a, b) => a.order - b.order)
  );

  // Sync state whenever modal opens or parent columns change
  useEffect(() => {
    setCols([...columns].sort((a, b) => a.order - b.order));
    setEditingColId(null);
  }, [columns, isOpen]);

  // New column creation form
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState(colorPalette[0]);
  const [newSla, setNewSla] = useState(4);

  // Inline editing state for an existing column
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editColor, setEditColor] = useState(colorPalette[0]);
  const [editSla, setEditSla] = useState(4);

  // Save loading state
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = (col: KanbanColumn) => {
    setEditingColId(col.id);
    setEditTitle(col.title);
    setEditColor(col.color);
    setEditSla(col.slaHours || 4);
  };

  const handleSaveEdit = (colId: string) => {
    if (!editTitle.trim()) return;
    setCols((prev) =>
      prev.map((c) =>
        c.id === colId
          ? {
              ...c,
              title: editTitle.trim(),
              color: editColor,
              slaHours: Number(editSla) || 4,
            }
          : c
      )
    );
    setEditingColId(null);
  };

  const handleCancelEdit = () => {
    setEditingColId(null);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cols.length) return;

    const newCols = [...cols];
    const temp = newCols[index];
    newCols[index] = newCols[targetIndex];
    newCols[targetIndex] = temp;

    // update order property
    const updated = newCols.map((c, i) => ({ ...c, order: i }));
    setCols(updated);
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    iconType?: 'trash' | 'logout' | 'alert' | 'power';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleDelete = (id: string) => {
    if (cols.length <= 1) {
      setConfirmModal({
        isOpen: true,
        title: 'Ação não permitida',
        message: 'Você precisa manter pelo menos 1 coluna no funil de vendas para organizar seus clientes.',
        confirmText: 'Entendi',
        cancelText: 'Fechar',
        confirmVariant: 'primary',
        iconType: 'alert',
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    const col = cols.find((c) => c.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Etapa do Funil',
      message: `Tem certeza que deseja remover a etapa "${col?.title}"? Todos os clientes que estão nesta etapa serão remanejados automaticamente para a primeira etapa ativa ("${cols[0]?.title}").`,
      confirmText: 'Excluir Coluna',
      cancelText: 'Cancelar',
      confirmVariant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        const filtered = cols.filter((c) => c.id !== id).map((c, i) => ({ ...c, order: i }));
        setCols(filtered);
        if (editingColId === id) {
          setEditingColId(null);
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Direct UUID generation ensures immediate persistence compatibility
    const newCol: KanbanColumn = {
      id: generateUUID(),
      title: newTitle.trim(),
      color: newColor,
      order: cols.length,
      slaHours: Number(newSla) || 4,
    };

    setCols([...cols, newCol]);
    setNewTitle('');
    setNewSla(4);
  };

  const handleSave = async () => {
    // If user was in the middle of editing an item, commit the inline edit
    let finalCols = [...cols];
    if (editingColId && editTitle.trim()) {
      finalCols = finalCols.map((c) =>
        c.id === editingColId
          ? {
              ...c,
              title: editTitle.trim(),
              color: editColor,
              slaHours: Number(editSla) || 4,
            }
          : c
      );
    }

    setIsSaving(true);
    try {
      await onSaveColumns(finalCols);
      onClose();
    } catch (err) {
      console.error('Error during onSaveColumns:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 bg-[#14382F] border-b border-[#235447] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C1F76B]/15 text-[#C1F76B] flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#FDFEF8]">Gerenciar Colunas do Funil</h3>
              <p className="text-xs text-[#95BDB0]">Crie, edite, ordene e configure o SLA de cada etapa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#0F2D26] transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Columns List */}
        <div className="p-5 max-h-80 overflow-y-auto space-y-2">
          {cols.map((col, idx) => {
            const isEditingThis = editingColId === col.id;

            if (isEditingThis) {
              return (
                <div
                  key={col.id}
                  className="p-3 bg-[#11332a] border-2 border-[#C1F76B] rounded-2xl space-y-2.5 transition-all shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Nome da etapa"
                      autoFocus
                      className="flex-1 bg-[#14382F] text-xs font-semibold text-[#FDFEF8] px-3 py-1.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
                    />
                    <div className="flex items-center gap-1 bg-[#14382F] px-2 py-1.5 rounded-xl border border-[#2D6B5A]">
                      <span className="text-[10px] text-[#95BDB0]">SLA:</span>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={editSla}
                        onChange={(e) => setEditSla(Number(e.target.value))}
                        className="w-10 bg-transparent text-xs text-[#FDFEF8] text-center focus:outline-none font-bold"
                      />
                      <span className="text-[10px] text-[#95BDB0]">h</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[#95BDB0]">Cor:</span>
                      {colorPalette.slice(0, 7).map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditColor(color)}
                          className={`w-4 h-4 rounded-full transition-transform ${
                            editColor === color ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="p-1 text-[#95BDB0] hover:text-[#FDFEF8] rounded-lg hover:bg-[#14382F]"
                        title="Cancelar edição"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(col.id)}
                        disabled={!editTitle.trim()}
                        className="px-2.5 py-1 bg-[#C1F76B] text-[#0F2D26] hover:bg-[#b0ec53] rounded-lg text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-40"
                        title="Salvar etapa"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Confirmar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={col.id}
                className="p-3 bg-[#14382F] border border-[#235447] rounded-2xl flex items-center justify-between gap-3 hover:border-[#2D6B5A] transition-colors"
              >
                <div className="flex items-center gap-3 truncate">
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: col.color }}
                  />
                  <div className="truncate">
                    <p className="font-semibold text-xs text-[#FDFEF8] truncate">{col.title}</p>
                    <p className="text-[10px] text-[#95BDB0] flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      <span>SLA: {col.slaHours}h sem resposta</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1.5 text-[#95BDB0] hover:text-[#FDFEF8] disabled:opacity-20 rounded-lg hover:bg-[#184339] transition-colors"
                    title="Mover para a esquerda / cima"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === cols.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1.5 text-[#95BDB0] hover:text-[#FDFEF8] disabled:opacity-20 rounded-lg hover:bg-[#184339] transition-colors"
                    title="Mover para a direita / baixo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => startEditing(col)}
                    className="p-1.5 text-[#95BDB0] hover:text-[#C1F76B] rounded-lg hover:bg-[#184339] transition-colors"
                    title="Editar nome, cor ou SLA desta etapa"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(col.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-colors ml-0.5"
                    title="Excluir Coluna"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Column Form */}
        <form onSubmit={handleAddColumn} className="p-4 bg-[#14382F] border-t border-[#235447] space-y-3">
          <p className="text-xs font-bold text-[#FDFEF8] flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-[#C1F76B]" />
            Adicionar Nova Etapa ao Funil
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex: Aguardando Estoque"
              className="flex-1 bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
            />

            <div className="flex items-center gap-1 bg-[#14382F] px-2 py-1.5 rounded-xl border border-[#2D6B5A]">
              <span className="text-[10px] text-[#95BDB0]">SLA:</span>
              <input
                type="number"
                min="1"
                max="168"
                value={newSla}
                onChange={(e) => setNewSla(Number(e.target.value))}
                className="w-10 bg-transparent text-xs text-[#FDFEF8] text-center focus:outline-none font-bold"
              />
              <span className="text-[10px] text-[#95BDB0]">h</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#95BDB0]">Cor:</span>
              {colorPalette.slice(0, 7).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    newColor === color ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-3 py-1.5 bg-[#C1F76B] text-[#0F2D26] hover:bg-[#b0ec53] disabled:opacity-40 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Inserir</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-[#0B241D] border-t border-[#235447] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#b0ec53] shadow-md shadow-[#C1F76B]/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando no banco...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>

        {/* Custom Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          confirmVariant={confirmModal.confirmVariant}
          iconType={confirmModal.iconType}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  );
};


