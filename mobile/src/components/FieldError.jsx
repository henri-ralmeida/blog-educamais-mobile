import { StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';

// Erro de campo com anúncio para leitor de tela. Só o LoginScreen fazia isso;
// nos demais formulários a validação falhava em silêncio e o usuário achava
// que o botão tinha travado.
export default function FieldError({ children, style }) {
  if (!children) return null;
  return (
    <Text
      style={[styles.text, style]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    ...typography.label,
    color: colors.destructive,
    marginTop: spacing.sm,
  },
});
