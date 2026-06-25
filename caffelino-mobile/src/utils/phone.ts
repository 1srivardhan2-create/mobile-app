/** India: 10-digit mobile, starts with 6–9 */
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export function parseIndianMobile(input: string): string {
  return input.replace(/\D/g, '').slice(0, 10);
}

/** Display: 98765 43210 */
export function formatIndianMobile(digits: string): string {
  const d = parseIndianMobile(digits);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)} ${d.slice(5)}`;
}

export function isValidIndianMobile(digits: string): boolean {
  return INDIAN_MOBILE_REGEX.test(parseIndianMobile(digits));
}

/** E.164-style for API: 919876543210 */
export function toIndianE164(digits: string): string {
  return `+91${parseIndianMobile(digits)}`;
}

/** Display: +91 98765 43210 */
export function formatIndianE164Display(e164: string): string {
  const raw = e164.replace(/\D/g, '');
  const local = raw.startsWith('91') ? raw.slice(2) : raw;
  return `+91 ${formatIndianMobile(local)}`;
}

export function normalizePhone(countryCode: string, number: string): string {
  const digits = number.replace(/\D/g, '');
  const code = countryCode.replace(/\D/g, '');
  return code + digits;
}
