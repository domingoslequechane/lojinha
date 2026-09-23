import React, { useState, useMemo } from 'react';
import { Clock, Calendar, X, Check, FileText, Plus, Trash2, ChevronLeft, ChevronRight, Bell, Package, MapPin, ShoppingBag, Hash, DollarSign } from 'lucide-react';
import { ContactLead } from '../../types';

export type FollowUpType = 'followup' | 'entrega';

export interface DeliveryData {
  address?: string;
  product?: string;
  quantity?: string;
  value?: number;
}

interface FollowUpModalProps {
  isOpen: boolean;
  lead: ContactLead | null;
  onClose: () => void;
  onSave: (
    leadId: string,
    followUpDate: string,
    notes: string,
    followUpType: FollowUpType,
    delivery?: DeliveryData
  ) => void;
  onClear: (leadId: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstWeekday(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatIso(date: Date, hour: number, minute: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:${pad(minute)}:00`;
}

function parseSaved(value: string): { date: Date | null; hour: number; minute: number } {
  if (!value) return { date: null, hour: 9, minute: 0 };
  try {
    if (value.includes('T')) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return { date: d, hour: d.getHours(), minute: d.getMinutes() };
    }
  } catch {}
  return { date: null, hour: 9, minute: 0 };
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

interface CalendarPickerProps {
  selected: Date | null;
  onSelect: (d: Date) => void;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({ selected, onSelect }) => {
  const today = todayMidnight();
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startOffset = firstWeekday(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#95BDB0] hover:text-[#C1F76B] hover:bg-[#1A4B3F] transition-colors cursor-pointer">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-[#FDFEF8]">{MONTHS_PT[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#95BDB0] hover:text-[#C1F76B] hover:bg-[#1A4B3F] transition-colors cursor-pointer">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS_PT.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-[#95BDB0] py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const cellDate = new Date(viewYear, viewMonth, day);
          cellDate.setHours(0, 0, 0, 0);
          const isPast = cellDate < today;
          const isToday = cellDate.getTime() === today.getTime();
          const isSelected = selected && cellDate.getTime() === (() => {
            const s = new Date(selected); s.setHours(0, 0, 0, 0); return s.getTime();
          })();
          return (
            <button key={day} type="button" disabled={isPast} onClick={() => onSelect(cellDate)}
              className={`h-8 w-full rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isSelected ? 'bg-[#C1F76B] text-[#0F2D26] font-bold shadow-md shadow-[#C1F76B]/30'
                : isToday ? 'border border-[#C1F76B]/60 text-[#C1F76B]'
                : isPast ? 'text-[#95BDB0]/30 cursor-not-allowed'
                : 'text-[#FDFEF8] hover:bg-[#1A4B3F] hover:text-[#C1F76B]'
              }`}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Time Picker ──────────────────────────────────────────────────────────────

interface TimePickerProps {
  hour: number; minute: number;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ hour, minute, onHourChange, onMinuteChange }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <label className="block text-[10px] text-[#95BDB0] mb-1 font-medium">Hora</label>
        <select value={hour} onChange={e => onHourChange(Number(e.target.value))}
          className="w-full bg-[#0F2D26] border border-[#235447] focus:border-amber-400 text-[#FDFEF8] text-sm rounded-xl px-3 py-2 outline-none transition-colors cursor-pointer">
          {hours.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}h</option>)}
        </select>
      </div>
      <div className="text-[#95BDB0] font-bold text-lg mt-4">:</div>
      <div className="flex-1">
        <label className="block text-[10px] text-[#95BDB0] mb-1 font-medium">Minuto</label>
        <select value={minute} onChange={e => onMinuteChange(Number(e.target.value))}
          className="w-full bg-[#0F2D26] border border-[#235447] focus:border-amber-400 text-[#FDFEF8] text-sm rounded-xl px-3 py-2 outline-none transition-colors cursor-pointer">
          {minutes.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
        </select>
      </div>
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen, lead, onClose, onSave, onClear,
}) => {
  if (!isOpen || !lead) return null;

  const parsed = parseSaved(lead.followUpDate || '');

  const [notes, setNotes] = useState(lead.followUpNotes || '');
  const [followUpType, setFollowUpType] = useState<FollowUpType>(lead.followUpType || 'followup');
  const [showSchedule, setShowSchedule] = useState(Boolean(lead.followUpDate));
  const [selectedDate, setSelectedDate] = useState<Date | null>(parsed.date);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);

  // Delivery fields
  const [deliveryAddress, setDeliveryAddress] = useState(lead.deliveryAddress || '');
  const [deliveryProduct, setDeliveryProduct] = useState(lead.deliveryProduct || '');
  const [deliveryQuantity, setDeliveryQuantity] = useState(lead.deliveryQuantity || '');
  const [deliveryValue, setDeliveryValue] = useState(lead.deliveryValue?.toString() || '');

  const quickTags = [
    'Recusa: Preço alto',
    'Recusa: Frete / Localização',
    'Sugestão do cliente',
    'Pedido: Tablet 7 polegadas',
    'Aguardando decisão do esposo',
    'Retornar no dia de pagamento',
  ];

  const { daysRemaining, weekdayName, formattedDate } = useMemo(() => {
    if (!selectedDate) return { daysRemaining: null, weekdayName: null, formattedDate: null };
    const today = todayMidnight();
    const target = new Date(selectedDate);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const weekday = WEEKDAYS_PT[selectedDate.getDay()];
    const day = selectedDate.getDate();
    const month = MONTHS_PT[selectedDate.getMonth()];
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      daysRemaining: diff,
      weekdayName: weekday,
      formattedDate: `${weekday}, ${day} de ${month} às ${pad(hour)}:${pad(minute)}`,
    };
  }, [selectedDate, hour, minute]);

  const handleAppendTag = (tag: string) => {
    setNotes(prev => {
      const prefix = prev.trim() ? `${prev.trim()}\n• ` : '• ';
      return `${prefix}${tag}: `;
    });
  };

  const handleSave = () => {
    const dateStr = selectedDate ? formatIso(selectedDate, hour, minute) : '';
    const delivery: DeliveryData | undefined = followUpType === 'entrega' ? {
      address: deliveryAddress.trim() || undefined,
      product: deliveryProduct.trim() || undefined,
      quantity: deliveryQuantity.trim() || undefined,
      value: deliveryValue ? parseFloat(deliveryValue) : undefined,
    } : undefined;
    onSave(lead.id, dateStr, notes.trim(), followUpType, delivery);
    onClose();
  };

  const handleClearReminder = () => {
    setSelectedDate(null);
    setShowSchedule(false);
    const delivery: DeliveryData | undefined = followUpType === 'entrega' ? {
      address: deliveryAddress.trim() || undefined,
      product: deliveryProduct.trim() || undefined,
      quantity: deliveryQuantity.trim() || undefined,
      value: deliveryValue ? parseFloat(deliveryValue) : undefined,
    } : undefined;
    onSave(lead.id, '', notes.trim(), followUpType, delivery);
  };

  const hasReminder = Boolean(selectedDate);

  const isEntrega = followUpType === 'entrega';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#0F2D26] border border-[#235447] rounded-3xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 flex flex-col">

        {/* Header */}
        <div className="p-3 bg-[#14382F] border-b border-[#235447] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C1F76B]/15 text-[#C1F76B] border border-[#C1F76B]/30 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#FDFEF8]">Folha de Atendimento & Follow-up</h3>
              <p className="text-xs text-[#95BDB0]">{lead.name} • {lead.phone}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-xl text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#0F2D26] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content: Scrollable */}
        <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-0">

          {/* Notas de Atendimento */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#C1F76B] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Nota de Atendimento do Cliente</span>
              </label>
              {notes && (
                <button type="button" onClick={() => setNotes('')}
                  className="text-[11px] text-red-400/80 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer">
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar texto</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {quickTags.map((tag, idx) => (
                <button key={idx} type="button" onClick={() => handleAppendTag(tag)}
                  className="text-[10px] font-medium bg-[#14382F] text-[#D1EAE0] hover:text-[#C1F76B] hover:bg-[#1A4B3F] border border-[#2D6B5A] px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer">
                  <Plus className="w-2.5 h-2.5 text-[#C1F76B]" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
            <div className="relative rounded-2xl bg-[#0F2D26] border border-[#2D6B5A] focus-within:border-[#C1F76B] transition-colors p-3 shadow-inner">
              <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Escreva os detalhes do atendimento: motivo de recusa, sugestões, itens do pedido, o que ficou combinado..."
                className="w-full bg-transparent text-sm text-[#FDFEF8] placeholder-[#95BDB0]/60 focus:outline-none resize-y leading-relaxed font-normal" />
              <div className="flex items-center justify-between pt-2 border-t border-[#235447]/60 text-[11px] text-[#95BDB0]">
                <span>Esta nota substituirá a mensagem padrão no card do Kanban.</span>
                <span>{notes.length} caracteres</span>
              </div>
            </div>
          </div>

          {/* Seção de Agendamento */}
          <div className="pt-2 border-t border-[#235447]/80">
            {!showSchedule && !hasReminder ? (
              <div className="flex gap-2">
                <button type="button" onClick={() => { setFollowUpType('followup'); setShowSchedule(true); }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-dashed border-[#2D6B5A] hover:border-[#C1F76B]/60 bg-[#14382F]/40 hover:bg-[#14382F] text-xs font-semibold text-[#95BDB0] hover:text-[#C1F76B] flex items-center justify-center gap-2 transition-all cursor-pointer">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>+ Agendar Follow-up</span>
                </button>
                <button type="button" onClick={() => { setFollowUpType('entrega'); setShowSchedule(true); }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-dashed border-[#2D6B5A] hover:border-blue-400/60 bg-[#14382F]/40 hover:bg-[#14382F] text-xs font-semibold text-[#95BDB0] hover:text-blue-300 flex items-center justify-center gap-2 transition-all cursor-pointer">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span>+ Agendar Entrega</span>
                </button>
              </div>
            ) : (
              <div className={`rounded-2xl overflow-hidden animate-in fade-in border ${isEntrega ? 'bg-blue-950/30 border-blue-500/30' : 'bg-[#14382F]/50 border-amber-500/30'}`}>

                {/* Type selector header */}
                <div className={`px-3.5 pt-3 pb-2 flex items-center justify-between border-b ${isEntrega ? 'border-blue-500/20' : 'border-amber-500/20'}`}>
                  <div className="flex items-center gap-2">
                    {/* Toggle buttons */}
                    <button type="button" onClick={() => setFollowUpType('followup')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${!isEntrega ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'text-[#95BDB0] hover:text-amber-300 hover:bg-amber-500/10'}`}>
                      <Bell className="w-3.5 h-3.5" />
                      Follow Up
                    </button>
                    <button type="button" onClick={() => setFollowUpType('entrega')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isEntrega ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40' : 'text-[#95BDB0] hover:text-blue-300 hover:bg-blue-500/10'}`}>
                      <Package className="w-3.5 h-3.5" />
                      Entrega
                    </button>
                  </div>
                  <button type="button" onClick={handleClearReminder}
                    className="text-[11px] text-red-400/70 hover:text-red-300 transition-colors cursor-pointer">
                    Remover
                  </button>
                </div>

                {/* Delivery extra fields */}
                {isEntrega && (
                  <div className="px-3.5 pt-3 pb-2 space-y-2 border-b border-blue-500/20">
                    <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3 h-3" /> Detalhes da Entrega
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Produto */}
                      <div className="col-span-2">
                        <label className="text-[10px] text-[#95BDB0] mb-1 flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> Produto encomendado</label>
                        <input type="text" value={deliveryProduct} onChange={e => setDeliveryProduct(e.target.value)}
                          placeholder="Ex: Tablet 7' Rosa"
                          className="w-full bg-[#0F2D26] border border-[#235447] focus:border-blue-400 text-[#FDFEF8] text-sm rounded-xl px-3 py-2 outline-none transition-colors placeholder-[#95BDB0]/40" />
                      </div>
                      {/* Endereço */}
                      <div className="col-span-2">
                        <label className="text-[10px] text-[#95BDB0] mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Endereço de entrega</label>
                        <input type="text" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                          placeholder="Ex: Av. Eduardo Mondlane, 104, Maputo"
                          className="w-full bg-[#0F2D26] border border-[#235447] focus:border-blue-400 text-[#FDFEF8] text-sm rounded-xl px-3 py-2 outline-none transition-colors placeholder-[#95BDB0]/40" />
                      </div>
                      {/* Quantidade */}
                      <div>
                        <label className="text-[10px] text-[#95BDB0] mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> Quantidade</label>
                        <input type="text" value={deliveryQuantity} onChange={e => setDeliveryQuantity(e.target.value)}
                          placeholder="Ex: 2 unid."
                          className="w-full bg-[#0F2D26] border border-[#235447] focus:border-blue-400 text-[#FDFEF8] text-sm rounded-xl px-3 py-2 outline-none transition-colors placeholder-[#95BDB0]/40" />
                      </div>
                      {/* Valor total */}
                      <div>
                        <label className="text-[10px] text-[#95BDB0] mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Valor total (MT)</label>
                        <input type="number" value={deliveryValue} onChange={e => setDeliveryValue(e.target.value)}
                          placeholder="Ex: 4500"
                          className="w-full bg-[#0F2D26] border border-[#235447] focus:border-blue-400 text-[#FDFEF8] text-sm rounded-xl px-3 py-2 outline-none transition-colors placeholder-[#95BDB0]/40" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="px-3.5 pb-3.5 pt-3 space-y-3">
                  {/* Calendar */}
                  <div className="bg-[#0F2D26] rounded-xl p-3 border border-[#235447]">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Calendar className="w-3.5 h-3.5 text-[#C1F76B]" />
                      <span className="text-[10px] font-bold text-[#C1F76B] uppercase tracking-wider">Selecionar Dia</span>
                    </div>
                    <CalendarPicker selected={selectedDate} onSelect={d => setSelectedDate(d)} />
                  </div>

                  {/* Time Picker */}
                  <div className="bg-[#0F2D26] rounded-xl p-3 border border-[#235447]">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Clock className={`w-3.5 h-3.5 ${isEntrega ? 'text-blue-400' : 'text-amber-400'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isEntrega ? 'text-blue-300' : 'text-amber-300'}`}>Selecionar Hora</span>
                    </div>
                    <TimePicker hour={hour} minute={minute} onHourChange={setHour} onMinuteChange={setMinute} />
                  </div>

                  {/* Summary card */}
                  {selectedDate && (
                    <div className={`border rounded-xl p-3 flex items-start gap-3 animate-in fade-in ${isEntrega ? 'bg-blue-500/10 border-blue-400/30' : 'bg-amber-500/10 border-amber-400/30'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isEntrega ? 'bg-blue-500/20' : 'bg-amber-500/20'}`}>
                        {isEntrega ? <Package className="w-4 h-4 text-blue-400" /> : <Calendar className="w-4 h-4 text-amber-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${isEntrega ? 'text-blue-200' : 'text-amber-200'}`}>{formattedDate}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {daysRemaining === 0 ? (
                            <span className="text-[11px] font-semibold text-[#C1F76B] bg-[#C1F76B]/15 px-2 py-0.5 rounded-full">Hoje</span>
                          ) : daysRemaining === 1 ? (
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isEntrega ? 'text-blue-300 bg-blue-400/15' : 'text-amber-300 bg-amber-400/15'}`}>Amanhã</span>
                          ) : (daysRemaining ?? 0) > 1 ? (
                            <span className="text-[11px] font-semibold text-[#95BDB0] bg-[#0F2D26] px-2 py-0.5 rounded-full">{daysRemaining} dias restantes</span>
                          ) : (
                            <span className="text-[11px] font-semibold text-red-400 bg-red-400/15 px-2 py-0.5 rounded-full">Data passada</span>
                          )}
                          <span className="text-[11px] text-[#95BDB0]">• {weekdayName}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0B241D] border-t border-[#235447] flex items-center justify-between gap-3 flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] transition-all cursor-pointer">
            Cancelar
          </button>
          <button onClick={handleSave}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#b0ec53] shadow-md shadow-[#C1F76B]/25 hover:shadow-[#C1F76B]/40 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5">
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{hasReminder ? (isEntrega ? 'Salvar & Agendar Entrega' : 'Salvar & Agendar Follow-up') : 'Salvar Nota de Atendimento'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
