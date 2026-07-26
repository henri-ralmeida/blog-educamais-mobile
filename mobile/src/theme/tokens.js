import { Platform } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Paleta de "caderno": papel quente, tinta escura, verde de lousa como ação e
// amarelo de marca-texto como acento pontual. Evita o azul de template.
export const colors = {
  paper: '#FBFAF7',
  background: '#FFFFFF',
  surface: '#F4F2EC',
  border: '#E7E3DA',
  accent: '#1B6B5A',
  accentSoft: '#E4F0EC',
  onAccent: '#FFFFFF',
  highlight: '#F2B705',
  destructive: '#B3261E',
  destructiveSoft: '#FBEAE8',
  textPrimary: '#16202E',
  textSecondary: '#3D4A5C',
  textMuted: '#68758A',
};

// Serifada nos títulos (material de leitura), sans no corpo. Platform.select
// evita passar uma pilha de fontes CSS para o runtime nativo, que não a entende.
const displayFamily = Platform.select({
  web: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
  ios: 'Georgia',
  default: 'serif',
});

const bodyFamily = Platform.select({
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: undefined,
});

export const typography = {
  display: { fontFamily: displayFamily, fontSize: 28, fontWeight: '600', lineHeight: 34 },
  title: { fontFamily: displayFamily, fontSize: 21, fontWeight: '600', lineHeight: 27 },
  heading: { fontFamily: bodyFamily, fontSize: 17, fontWeight: '600', lineHeight: 23 },
  body: { fontFamily: bodyFamily, fontSize: 16, fontWeight: '400', lineHeight: 24 },
  label: { fontFamily: bodyFamily, fontSize: 13, fontWeight: '400', lineHeight: 18 },
  eyebrow: { fontFamily: bodyFamily, fontSize: 11, fontWeight: '700', lineHeight: 16, letterSpacing: 1.4 },
  button: { fontFamily: bodyFamily, fontSize: 15, fontWeight: '600', lineHeight: 20 },
};

export const radii = {
  sm: 6,
  md: 10,
  pill: 999,
};
