import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getThemePreference, setThemePreference } from '../services/storage.service';
import { colors, darkColors, type ColorPalette } from '../theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  palette: ColorPalette;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode] = useState<ThemeMode>('light');

  const isDark = false;
  const palette: ColorPalette = colors;

  const setMode = async (next: ThemeMode) => {
    // Disabled: Dark mode is removed
  };

  const value = useMemo(
    () => ({ mode, isDark, palette, setMode }),
    [mode, isDark, palette],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
