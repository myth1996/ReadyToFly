export const lightColors = {
  primary: '#1A56A6',
  primaryDark: '#0F3C7A',
  primaryLight: '#4A80C8',
  white: '#FFFFFF',
  background: '#F5F7FA',
  card: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

export const darkColors = {
  primary: '#1A56A6',
  primaryDark: '#0F3C7A',
  primaryLight: '#4A80C8',
  white: '#FFFFFF',
  background: '#0D0F1A',
  card: '#1A1E2E',
  text: '#F0F2F5',
  textSecondary: '#9CA3AF',
  border: '#2D3748',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

// Backward-compatible default export — screens that haven't been
// updated to use useSettings() will still get the light palette.
export const colors = lightColors;

// ─── Typography Scale ────────────────────────────────────────────────────────
export const typography = {
  xs:   { fontSize: 11, lineHeight: 15 } as const,
  sm:   { fontSize: 13, lineHeight: 18 } as const,
  base: { fontSize: 15, lineHeight: 22 } as const,
  lg:   { fontSize: 17, lineHeight: 24 } as const,
  xl:   { fontSize: 20, lineHeight: 28 } as const,
  xxl:  { fontSize: 28, lineHeight: 34 } as const,
  hero: { fontSize: 52, lineHeight: 58 } as const,
};

// ─── Font Weights ────────────────────────────────────────────────────────────
export const fontWeight = {
  regular: '400' as const,
  medium:  '500' as const,
  semi:    '600' as const,
  bold:    '700' as const,
  heavy:   '800' as const,
};

// ─── Spacing Scale ───────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

// ─── Border Radius ───────────────────────────────────────────────────────────
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// ─── Shadow Presets ──────────────────────────────────────────────────────────
export const shadow = {
  sm: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  md: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  lg: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
};
