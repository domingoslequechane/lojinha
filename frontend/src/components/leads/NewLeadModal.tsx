import React, { useState } from 'react';
import { UserPlus, X, Check, MapPin, DollarSign, Baby } from 'lucide-react';
import { ContactLead, KanbanColumn } from '../../types';
import { CustomSelect } from '../common/CustomSelect';

interface NewLeadModalProps {
  isOpen: boolean;
  columns: KanbanColumn[];
  defaultColumnId?: string;
  onClose: () => void;
  onCreateLead: (lead: ContactLead, initialMessage: string) => void;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  columns,
  defaultColumnId,
  onClose,
  onCreateLead,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+258 8');
  const [columnId, setColumnId] = useState(defaultColumnId || columns[0]?.id || 'col-new');
  const [dealValue, setDealValue] = useState('3800');
  const [productInterest, setProductInterest] = useState('Tablet Infantil 7" Rosa');
  const [childInfo, setChildInfo] = useState('Menina 5 anos');
  const [location, setLocation] = useState('Maputo Cidade');
  const [initialMessage, setInitialMessage] = useState('Olá! Gostaria de saber mais sobre o tablet infantil.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newLead: ContactLead = {
      id: `lead-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      avatar: undefined,
      columnId,
      unreadCount: 1,
      lastMessage: initialMessage.trim() || 'Novo lead cadastrado',
      lastMessageTime: 'Agora',
      lastMessageTimestamp: Date.now(),
      dealValue: Number(dealValue) || 0,
      tags: [productInterest.split(' ')[0], location.split(' ')[0]],
      location: location.trim(),
      childInfo: childInfo.trim(),
      productInterest: productInterest.trim(),
    };

    onCreateLead(newLead, initialMessage.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 bg-[#14382F] border-b border-[#235447] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C1F76B]/15 text-[#C1F76B] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#FDFEF8]">Novo Lead / Comprador</h3>
              <p className="text-xs text-[#95BDB0]">Cadastre um novo contato para acompanhar no funil</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#0F2D26] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
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
              <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                WhatsApp (+258) *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+258 84..."
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                Valor Previsto (MT)
              </label>
              <input
                type="number"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                placeholder="3800"
                className="w-full bg-[#14382F] text-xs text-[#C1F76B] font-bold px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                Produto de Interesse
              </label>
              <input
                type="text"
                value={productInterest}
                onChange={(e) => setProductInterest(e.target.value)}
                placeholder="Ex: Tablet 7' Azul"
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
                Bairro / Cidade
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Matola Gare"
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
              Idade da Criança (opcional)
            </label>
            <input
              type="text"
              value={childInfo}
              onChange={(e) => setChildInfo(e.target.value)}
              placeholder="Ex: Menino 4 anos, estuda no pré-escolar"
              className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
              Primeira Mensagem Recebida
            </label>
            <textarea
              rows={2}
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="O que o cliente disse..."
              className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#235447] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#b0ec53] shadow-md shadow-[#C1F76B]/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Cadastrar Lead</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

