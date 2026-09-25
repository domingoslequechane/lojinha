import React, { useState, useEffect } from 'react';
import { Pencil, X, Check, MapPin, DollarSign, Package, ShoppingBag, Phone, User, Tag, FileText } from 'lucide-react';
import { ContactLead, KanbanColumn, StoreProduct } from '../../types';
import { CustomSelect } from '../common/CustomSelect';

interface EditLeadModalProps {
  isOpen: boolean;
  lead: ContactLead | null;
  columns: KanbanColumn[];
  products?: StoreProduct[];
  onClose: () => void;
  onSave: (updatedLead: ContactLead) => void;
}

/** Extracts numeric price from strings like "MZN 3.800", "3800 MT", "3,800.00" */
function extractNumericPrice(priceStr?: string): number | null {
  if (!priceStr) return null;
  const digits = priceStr.replace(/[^\d]/g, '');
  if (!digits) return null;
  const num = parseInt(digits, 10);
  return isNaN(num) ? null : num;
}

export const EditLeadModal: React.FC<EditLeadModalProps> = ({
  isOpen,
  lead,
  columns,
  products = [],
  onClose,
  onSave,
}) => {
  if (!isOpen || !lead) return null;

  const [name, setName] = useState(lead.name || '');
  const [phone, setPhone] = useState(lead.phone || '');
  const [columnId, setColumnId] = useState(lead.columnId || columns[0]?.id || 'col-new');
  const [dealValue, setDealValue] = useState(String(lead.dealValue || 0));

  // Determine if lead.productInterest matches one of the store products
  const isExistingInCatalog = products.some((p) => p.title === lead.productInterest);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    isExistingInCatalog ? (lead.productInterest || '') : (lead.productInterest ? '__custom__' : (products[0]?.title || '__custom__'))
  );
  const [customProductInterest, setCustomProductInterest] = useState(
    isExistingInCatalog ? '' : (lead.productInterest || '')
  );

  const [location, setLocation] = useState(lead.location || '');
  const [followUpNotes, setFollowUpNotes] = useState(lead.followUpNotes || lead.childInfo || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(lead.tags || []);

  useEffect(() => {
    if (lead) {
      setName(lead.name || '');
      setPhone(lead.phone || '');
      setColumnId(lead.columnId || columns[0]?.id || 'col-new');
      setDealValue(String(lead.dealValue || 0));
      const inCatalog = products.some((p) => p.title === lead.productInterest);
      if (inCatalog) {
        setSelectedProductId(lead.productInterest || '');
        setCustomProductInterest('');
      } else if (lead.productInterest) {
        setSelectedProductId('__custom__');
        setCustomProductInterest(lead.productInterest);
      } else {
        setSelectedProductId(products.length > 0 ? products[0].title : '__custom__');
        setCustomProductInterest('');
      }
      setLocation(lead.location || '');
      setFollowUpNotes(lead.followUpNotes || lead.childInfo || '');
      setTags(lead.tags || []);
    }
  }, [lead, columns, products]);

  const isCustomProduct = selectedProductId === '__custom__' || products.length === 0;
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
      productInterest: finalProductInterest.trim() || undefined,
      location: location.trim() || undefined,
      followUpNotes: followUpNotes.trim() || undefined,
      tags,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-3.5 bg-[#14382F] border-b border-[#235447] flex items-center justify-between flex-shrink-0">
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
                Valor da Venda / Oportunidade (MT)
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
              placeholder="Ex: Maputo, Matola, Bairro Central..."
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

          {/* Notas & Observações do Cliente */}
          <div>
            <label className="text-[11px] font-semibold text-[#95BDB0] flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3 text-[#C1F76B]" />
              Notas e Observações do Cliente
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
