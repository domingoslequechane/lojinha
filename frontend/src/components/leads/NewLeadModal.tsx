import React, { useState } from 'react';
import { UserPlus, X, Check, MapPin, DollarSign, Package, ShoppingBag, FileText, Phone, User } from 'lucide-react';
import { ContactLead, KanbanColumn, StoreProduct } from '../../types';
import { CustomSelect } from '../common/CustomSelect';

interface NewLeadModalProps {
  isOpen: boolean;
  columns: KanbanColumn[];
  products?: StoreProduct[];
  defaultColumnId?: string;
  onClose: () => void;
  onCreateLead: (lead: ContactLead, initialMessage: string) => void;
}

/** Extracts numeric price from strings like "MZN 3.800", "3800 MT", "3,800.00" */
function extractNumericPrice(priceStr?: string): number | null {
  if (!priceStr) return null;
  const digits = priceStr.replace(/[^\d]/g, '');
  if (!digits) return null;
  const num = parseInt(digits, 10);
  return isNaN(num) ? null : num;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  columns,
  products = [],
  defaultColumnId,
  onClose,
  onCreateLead,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [columnId, setColumnId] = useState(defaultColumnId || columns[0]?.id || 'col-new');
  const [dealValue, setDealValue] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products.length > 0 ? products[0].title : ''
  );
  const [customProductInterest, setCustomProductInterest] = useState('');
  const [location, setLocation] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  const isCustomProduct = selectedProductId === '__custom__' || (products.length === 0);
  const finalProductInterest = isCustomProduct ? customProductInterest : selectedProductId;

  const handleProductChange = (val: string) => {
    setSelectedProductId(val);
    if (val !== '__custom__') {
      const prod = products.find((p) => p.title === val || p.id === val);
      if (prod) {
        const numPrice = extractNumericPrice(prod.price);
        if (numPrice && (!dealValue || dealValue === '0')) {
          setDealValue(String(numPrice));
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const tags: string[] = [];
    if (finalProductInterest.trim()) tags.push(finalProductInterest.trim());
    if (location.trim()) tags.push(location.trim());

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
      tags,
      location: location.trim() || undefined,
      productInterest: finalProductInterest.trim() || undefined,
      followUpNotes: followUpNotes.trim() || undefined,
    };

    onCreateLead(newLead, initialMessage.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-[#14382F] border-b border-[#235447] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C1F76B]/15 text-[#C1F76B] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#FDFEF8]">Novo Lead / Contacto</h3>
              <p className="text-xs text-[#95BDB0]">Cadastre um novo cliente com produto de interesse da loja</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#0F2D26] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
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
                placeholder="+258 84 000 0000"
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Etapa do Funil e Valor Previsto */}
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
                Valor Previsto (MT)
              </label>
              <input
                type="number"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                placeholder="0"
                className="w-full bg-[#14382F] text-xs text-[#C1F76B] font-bold px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Produto de Interesse (Dropdown do Catálogo da Loja) */}
          <div>
            <label className="text-[11px] font-semibold text-[#95BDB0] flex items-center gap-1.5 mb-1">
              <ShoppingBag className="w-3.5 h-3.5 text-[#C1F76B]" />
              Produto de Interesse (Catálogo da Loja)
            </label>
            {products && products.length > 0 ? (
              <div className="space-y-2">
                <CustomSelect
                  value={selectedProductId}
                  onChange={handleProductChange}
                  options={[
                    ...products.map((p) => ({
                      value: p.title,
                      label: `${p.title}${p.price ? ` — ${p.price}` : ''}`,
                    })),
                    { value: '__custom__', label: '✏️ Outro produto / Digitar manualmente...' },
                  ]}
                  className="w-full"
                />

                {isCustomProduct && (
                  <input
                    type="text"
                    value={customProductInterest}
                    onChange={(e) => setCustomProductInterest(e.target.value)}
                    placeholder="Digite o nome do produto ou serviço..."
                    autoFocus
                    className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none animate-in fade-in duration-150"
                  />
                )}
              </div>
            ) : (
              <input
                type="text"
                value={customProductInterest}
                onChange={(e) => setCustomProductInterest(e.target.value)}
                placeholder="Ex: Produto ou serviço de interesse"
                className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
              />
            )}
          </div>

          {/* Localização / Cidade / Bairro */}
          <div>
            <label className="text-[11px] font-semibold text-[#95BDB0] flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-[#C1F76B]" />
              Localização / Cidade / Bairro
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Maputo, Matola, Beira..."
              className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
            />
          </div>

          {/* Notas & Observações do Cliente */}
          <div>
            <label className="text-[11px] font-semibold text-[#95BDB0] flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3 text-[#C1F76B]" />
              Notas e Observações do Cliente (opcional)
            </label>
            <textarea
              rows={2}
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              placeholder="Preferências, canal de origem, urgência de entrega..."
              className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none resize-none"
            />
          </div>

          {/* Primeira Mensagem Recebida (opcional) */}
          <div>
            <label className="text-[11px] font-semibold text-[#95BDB0] block mb-1">
              Primeira Mensagem Recebida (opcional)
            </label>
            <textarea
              rows={2}
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Ex: Olá, gostaria de saber o preço do produto..."
              className="w-full bg-[#14382F] text-xs text-[#FDFEF8] px-3 py-2 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#235447] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] transition-colors cursor-pointer"
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
