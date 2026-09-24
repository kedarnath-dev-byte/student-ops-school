/**
 * Normalize an India-centric phone to E.164 digits without +.
 * Returns null if invalid.
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

  const cc = defaultCountryCode.replace(/\D/g, '') || '91';

  if (digits.length === 10) {
    return `${cc}${digits}`;
  }

  // Already includes country code (e.g. 91xxxxxxxxxx)
  if (digits.startsWith(cc) && digits.length === cc.length + 10) {
    return digits;
  }

  // Generic: 11–15 digits starting with country code of any length 1–3
  if (digits.length >= 11 && digits.length <= 15) {
    return digits;
  }

  return null;
}
