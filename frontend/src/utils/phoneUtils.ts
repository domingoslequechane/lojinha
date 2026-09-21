/**
 * Phone number formatting utilities for Lojinha (Mozambique + international)
 */

export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove spaces, parentheses, hyphens, dots
  let cleaned = phone.trim().replace(/[\s().-]/g, '');

  // If already starts with +
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If starts with 258 (Mozambique country code without +)
  if (cleaned.startsWith('258') && cleaned.length >= 11) {
    return `+${cleaned}`;
  }

  // If standard Mozambican mobile number (starts with 82, 83, 84, 85, 86, 87) with 9 digits
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length === 9 && digitsOnly.startsWith('8')) {
    return `+258${digitsOnly}`;
  }

  // If has leading zeroes
  if (digitsOnly.length > 9 && digitsOnly.startsWith('00258')) {
    return `+${digitsOnly.slice(2)}`;
  }

  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

export function formatPhoneForCall(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  return `tel:${cleaned}`;
}

/**
 * Formata um valor numérico para o padrão de moeda de Moçambique (ex: 1.000,00 MT).
 */
export function formatMoney(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') {
    return '0,00 MT';
  }

  let num: number;
  if (typeof val === 'number') {
    num = val;
  } else {
    const cleaned = val.toString().replace(/[^\d.,-]/g, '').replace(',', '.');
    num = parseFloat(cleaned);
  }

  if (isNaN(num)) {
    return '0,00 MT';
  }

  const parts = num.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1];

  return `${integerPart},${decimalPart} MT`;
}

/**
 * Retorna apenas o número formatado com decimais sem a sigla da moeda (ex: 1.000,00).
 */
export function formatMoneyNumber(val: number | string | undefined | null): string {
  return formatMoney(val).replace(' MT', '');
}

/**
 * Formata a data ISO de um follow-up para exibição amigável em português.
 * Ex: "2025-09-25T14:30:00" → "Qua, 25 de Setembro às 14:30"
 * Datas no formato antigo (texto livre) são exibidas tal qual.
 */
const MONTHS_PT_SHORT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const WEEKDAYS_PT_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function formatFollowUpDate(value: string | undefined | null): string {
  if (!value) return '';
  // Try ISO format
  if (value.includes('T')) {
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const weekday = WEEKDAYS_PT_SHORT[d.getDay()];
        const day = d.getDate();
        const month = MONTHS_PT_SHORT[d.getMonth()];
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${weekday}, ${day} de ${month} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    } catch {}
  }
  // Legacy text value — return as-is
  return value;
}

/**
 * Retorna o número de dias restantes até a data de follow-up.
 * Retorna null se a data for inválida ou no formato antigo.
 */
export function followUpDaysRemaining(value: string | undefined | null): number | null {
  if (!value || !value.includes('T')) return null;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

