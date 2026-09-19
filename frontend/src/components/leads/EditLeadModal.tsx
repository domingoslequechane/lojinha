import React, { useState, useEffect } from 'react';
import { Pencil, X, Check, MapPin, DollarSign, Baby, ShoppingBag, Phone, User, Tag, FileText } from 'lucide-react';
import { ContactLead, KanbanColumn } from '../../types';
import { CustomSelect } from '../common/CustomSelect';

interface EditLeadModalProps {
  isOpen: boolean;
  lead: ContactLead | null;
  columns: KanbanColumn[];
  onClose: () => void;
  onSave: (updatedLead: ContactLead) => void;
}

export const EditLeadModal: React.FC<EditLeadModalProps> = ({
  isOpen,
  lead,
  columns,
  onClose,
  onSave,
}) => {
  if (!isOpen || !lead) return null;

  const [name, setName] = useState(lead.name || '');
  const [phone, setPhone] = useState(lead.phone || '');
  const [columnId, setColumnId] = useState(lead.columnId || columns[0]?.id || 'col-new');
  const [dealValue, setDealValue] = useState(String(lead.dealValue || 0));
  const [productInterest, setProductInterest] = useState(lead.productInterest || '');
  const [childInfo, setChildInfo] = useState(lead.childInfo || '');
  const [location, setLocation] = useState(lead.location || '');
  const [followUpNotes, setFollowUpNotes] = useState(lead.followUpNotes || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(lead.tags || []);

  useEffect(() => {
    if (lead) {
      setName(lead.name || '');
      setPhone(lead.phone || '');
      setColumnId(lead.columnId || columns[0]?.id || 'col-new');
      setDealValue(String(lead.dealValue || 0));
      setProductInterest(lead.productInterest || '');
      setChildInfo(lead.childInfo || '');
      setLocation(lead.location || '');
      setFollowUpNotes(lead.followUpNotes || '');
      setTags(lead.tags || []);
    }
  }, [lead, columns]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const updated: ContactLead = {
      ...lead,
      name: name.trim(),
      phone: phone.trim(),
      columnId,
      dealValue: Number(dealValue) || 0,
      productInterest: productInterest.trim() || undefined,
      childInfo: childInfo.trim() || undefined,
      location: location.trim() || undefined,
      followUpNotes: followUpNotes.trim() || undefined,
      tags,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-[#14382F] border-b border-[#235447] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C1F76B]/15 text-[#C1F76B] flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#FDFEF8]">Editar Informações do Cliente</h3>
              <p className="text-xs text-[#95BDB0]">Atualize os dados de {lead.name || lead.phone}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#0F2D26] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
          {/* Nome e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#95BDB0] flex items-center gap-1 mb-1">
                <User className="w-3 h-3 text-[#C1F76B]" />
                Nome do Cliente *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Teresa Mondlane"
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#95BDB0] flex items-center gap-1 mb-1">
                <Phone className="w-3 h-3 text-[#C1F76B]" />
                WhatsApp / Telefone *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+258 84..."
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Etapa do Funil e Valor da Venda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                Etapa do Funil
              </label>
              <CustomSelect
                value={columnId}
                onChange={setColumnId}
                options={columns.map((col) => ({
                  value: col.id,
                  label: col.title,
                  color: col.color,
                }))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#95BDB0] flex items-center gap-1 mb-1">
                <DollarSign className="w-3 h-3 text-[#C1F76B]" />
                Valor da Venda
              </label>
              <input
                type="number"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                placeholder="0"
                className="w-full bg-[#14382F] text-xs text-[#C1F76B] font-bold px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
              />
            </div>
          </div>

          {/* Produto de Interesse e Informações Adicionais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#95BDB0] flex items-center gap-1 mb-1">
                <ShoppingBag className="w-3 h-3 text-[#C1F76B]" />
                Produto de Interesse
              </label>
              <input
                type="text"
                value={productInterest}
                onChange={(e) => setProductInterest(e.target.value)}
                placeholder="Ex: Produto ou Serviço"
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#95BDB0] flex items-center gap-1 mb-1">
                <Baby className="w-3 h-3 text-[#C1F76B]" />
                Observações / Informações Adicionais
              </label>
              <input
                type="text"
                value={childInfo}
                onChange={(e) => setChildInfo(e.target.value)}
                placeholder="Ex: Preferências ou anotações"
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
              />
            </div>
          </div>

          {/* Localização / Cidade */}
          <div>
            <label className="text-[11px] font-semibold text-[#95BDB0] flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-[#C1F76B]" />
              Localização / Cidade / Bairro
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Cidade, Bairro ou Região"
              className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-[11px] font-semibold text-[#95BDB0] flex items-center gap-1 mb-1">
              <Tag className="w-3 h-3 text-[#C1F76B]" />
              Etiquetas / Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="bg-[#184339] text-[#C1F76B] border border-[#2E6858] text-[11px] font-medium px-2 py-0.5 rounded-lg flex items-center gap-1"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-red-400 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Adicionar tag (pressione Enter)..."
                className="flex-1 bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-1.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-[#184339] hover:bg-[#235447] text-[#C1F76B] border border-[#2D6B5A] rounded-xl text-xs font-semibold cursor-pointer"
              >
                + Tag
              </button>
            </div>
          </div>

          {/* Notas / Observações */}
          <div>
            <label className="text-[11px] font-semibold text-[#95BDB0] flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3 text-[#C1F76B]" />
              Notas e Observações Internas
            </label>
            <textarea
              rows={2}
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              placeholder="Preferências do cliente, urgência de entrega, endereço detalhado..."
              className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#235447]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#C1F76B] hover:bg-[#b0ec53] text-[#0F2D26] font-bold text-xs rounded-xl shadow-lg shadow-[#C1F76B]/15 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
