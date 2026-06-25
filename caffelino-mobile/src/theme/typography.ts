import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: undefined as string | undefined,
  medium: undefined as string | undefined,
  bold: undefined as string | undefined,
};

export const typography = {
  hero: { fontSize: 32, fontWeight: '700', letterSpacing: 1 } as TextStyle,
  h1: { fontSize: 28, fontWeight: '700' } as TextStyle,
  h2: { fontSize: 22, fontWeight: '600' } as TextStyle,
  h3: { fontSize: 18, fontWeight: '600' } as TextStyle,
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 } as TextStyle,
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 } as TextStyle,
  caption: { fontSize: 12, fontWeight: '500', letterSpacing: 0.5 } as TextStyle,
  button: { fontSize: 16, fontWeight: '600', letterSpacing: 0.3 } as TextStyle,
  logo: { fontSize: 36, fontWeight: '800', letterSpacing: 4 } as TextStyle,
};
