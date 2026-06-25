/** Meetup bills always split equally among members */
export type SplitType = 'equal';

export interface BillTotals {
  subtotal: number;
  couponDiscount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  finalAmount: number;
}

export function round2(n: number) {
  return parseFloat(n.toFixed(2));
}

/** CGST 2.5% + SGST 2.5% on amount after coupon */
export function computeBill(subtotal: number, couponDiscount = 0): BillTotals {
  const coupon = Math.min(couponDiscount, subtotal);
  const taxableAmount = round2(subtotal - coupon);
  const cgst = round2(taxableAmount * 0.025);
  const sgst = round2(taxableAmount * 0.025);
  const finalAmount = round2(taxableAmount + cgst + sgst);
  return { subtotal, couponDiscount: coupon, taxableAmount, cgst, sgst, finalAmount };
}

export function formatRupee(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function perPersonEqual(total: number, members: number) {
  if (members < 1) return total;
  return round2(total / members);
}
