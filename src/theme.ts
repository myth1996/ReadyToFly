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
