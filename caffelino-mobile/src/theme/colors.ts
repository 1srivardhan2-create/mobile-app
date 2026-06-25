/** Caffélino premium coffee palette — mobile-only design system */
export interface ColorPalette {
  darkCoffee: string;
  coffeeBrown: string;
  latteBrown: string;
  cream: string;
  espresso: string;
  goldAccent: string;
  white: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  forestGreen: string;
  warmCream: string;
  error: string;
  border: string;
  glass: string;
  glassBorder: string;
  overlay: string;
}

export const colors: ColorPalette = {
  darkCoffee: '#3E2723',
  coffeeBrown: '#6F4E37',
  latteBrown: '#A67B5B',
  cream: '#F5E6D3',
  espresso: '#2B1B17',
  goldAccent: '#D4A373',
  white: '#FFFFFF',
  textPrimary: '#2B1B17',
  textSecondary: '#6F4E37',
  textMuted: '#A67B5B',
  success: '#4CAF50',
  forestGreen: '#2E7D32',
  warmCream: '#FFF8F0',
  error: '#C62828',
  border: 'rgba(111, 78, 55, 0.2)',
  glass: 'rgba(245, 230, 211, 0.65)',
  glassBorder: 'rgba(212, 163, 115, 0.35)',
  overlay: 'rgba(43, 27, 23, 0.55)',
};

export const darkColors: ColorPalette = {
  ...colors,
  cream: '#2B1B17',
  warmCream: '#1E1410',
  espresso: '#F5E6D3',
  textPrimary: '#F5E6D3',
  textSecondary: '#D4A373',
  textMuted: '#A67B5B',
  glass: 'rgba(62, 39, 35, 0.75)',
  border: 'rgba(212, 163, 115, 0.15)',
};
