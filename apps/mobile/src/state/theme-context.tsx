import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

import { themes, type AppTheme, type ThemeMode } from '@/theme/tokens';

type ThemeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function LifeThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('living');
  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    theme: themes[mode],
    setMode,
    toggleMode: () => setMode((current) => current === 'living' ? 'night' : 'living'),
  }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useLifeTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useLifeTheme must be used inside LifeThemeProvider');
  return value;
}
