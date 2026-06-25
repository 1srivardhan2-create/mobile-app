/** Minimum order amounts by café (subtotal before coupon). */
const PREMIUM_CAFES = ['the chocolate room', 'kaapiya cafe', 'kaapiya'];
const STANDARD_CAFES = ['living room cafe', 'alkemy cafe'];

export function getMinimumOrderAmount(cafeName: string): number {
  const name = cafeName.trim().toLowerCase();
  if (PREMIUM_CAFES.some((c) => name.includes(c) || c.includes(name))) {
    return 500;
  }
  if (STANDARD_CAFES.some((c) => name.includes(c) || c.includes(name))) {
    return 300;
  }
  return 300;
}

export function getMinimumOrderTier(cafeName: string): 'premium' | 'standard' {
  return getMinimumOrderAmount(cafeName) >= 500 ? 'premium' : 'standard';
}

export function getAmountNeeded(subtotal: number, minimum: number) {
  return Math.max(0, parseFloat((minimum - subtotal).toFixed(2)));
}

export function meetsMinimumOrder(subtotal: number, cafeName: string) {
  return subtotal >= getMinimumOrderAmount(cafeName);
}
