/**
 * Normalize a country-calling code to 1–3 digits, or fall back to India (91).
 * Rejects pasted Phone Number IDs / Meta test numbers (too long).
 */
export function normalizeCountryCode(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '91';
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 1 && digits.length <= 3) return digits;
  return '91';
}

/**
 * Normalize an India-centric phone to E.164 digits without +.
 * Returns null if invalid.
 * Never prepends a country code longer than 3 digits.
 */
export function normalizeIndiaPhone(
  raw: string,
  defaultCountryCode = '91'
): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  // Strip leading zeros (common local format 09876…)
  while (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (!digits) return null;

  const cc = normalizeCountryCode(defaultCountryCode);

  if (digits.length === 10) {
    return `${cc}${digits}`;
  }

  // Already includes country code (e.g. 91xxxxxxxxxx)
  if (digits.startsWith(cc) && digits.length === cc.length + 10) {
    return digits;
  }

  // Generic: 11–15 digits (E.164 without +); do not invent a long CC prefix
  if (digits.length >= 11 && digits.length <= 15) {
    return digits;
  }

  return null;
}
