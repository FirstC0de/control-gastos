import { Appearance } from 'react-native';

const light = {
  primary:       '#3b82f6',
  primaryDark:   '#1d4ed8',
  secondary:     '#10b981',
  danger:        '#ef4444',
  warning:       '#f59e0b',

  background:    '#f1f5f9',
  card:          '#ffffff',
  border:        '#e2e8f0',

  text:          '#0f172a',
  textSecondary: '#475569',
  textMuted:     '#94a3b8',

  dark:          '#0f172a',
  darkCard:      '#1e293b',
};

const dark = {
  primary:       '#60a5fa',
  primaryDark:   '#1d4ed8',
  secondary:     '#34d399',
  danger:        '#f87171',
  warning:       '#fbbf24',

  background:    '#0f172a',
  card:          '#1e293b',
  border:        '#334155',

  text:          '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted:     '#64748b',

  dark:          '#020617',
  darkCard:      '#0f172a',
};

export type ThemeColors = typeof light;

/**
 * Proxy que devuelve el color correcto según el tema activo en cada render.
 * Cuando _layout.tsx fuerza un re-render al cambiar el tema del sistema,
 * todos los componentes que leen Colors.X obtienen automáticamente el valor nuevo.
 */
export const Colors = new Proxy({} as ThemeColors, {
  get(_, key: string) {
    const scheme = Appearance.getColorScheme();
    const palette = scheme === 'dark' ? dark : light;
    return palette[key as keyof ThemeColors];
  },
});
