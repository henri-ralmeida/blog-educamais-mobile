export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const colors = {
  background: '#FFFFFF',
  surface: '#F3F4F6',
  accent: '#2563EB',
  onAccent: '#FFFFFF',
  transparent: 'transparent',
  // Reservado para Fase 2 (confirmação de exclusão de post/professor/aluno) — ver 01-UI-SPEC.md.
  destructive: '#DC2626',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
};

// lineHeight já convertido para pixel absoluto (fontSize × ratio da 01-UI-SPEC.md),
// pois React Native espera número absoluto, não razão unitless como CSS.
export const typography = {
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  label: { fontSize: 13, fontWeight: '400', lineHeight: 18.2 },
  heading: { fontSize: 20, fontWeight: '600', lineHeight: 25 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  display: { fontSize: 24, fontWeight: '600', lineHeight: 28.8 },
};
