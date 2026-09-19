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
