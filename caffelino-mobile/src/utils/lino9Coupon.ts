import { round2 } from './orderBilling';

export const LINO9_CODE = 'LINO9';

/** Official meetup coupon — 9% off subtotal */
export function computeLino9Discount(subtotal: number) {
  if (subtotal <= 0) return 0;
  return round2((subtotal * 9) / 100);
}

export function isLino9Code(code: string) {
  return code.trim().toUpperCase() === LINO9_CODE;
}
