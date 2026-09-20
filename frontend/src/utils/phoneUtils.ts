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
