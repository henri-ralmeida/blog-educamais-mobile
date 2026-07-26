import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';

// Bloco de erro compartilhado (lista pública, leitura, listas administrativas).
// Antes cada tela repetia o mesmo markup e os mesmos estilos, e nenhuma delas
// anunciava a troca de estado para leitor de tela.
export default function ErrorState({
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
  secondaryLabel,
  onSecondary,
}) {
  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>{message}</Text>
      {onRetry ? (
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
        >
          <Text style={styles.buttonText}>{retryLabel}</Text>
        </Pressable>
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={onSecondary}
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel}
        >
          <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  text: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 10,
  },
  buttonText: {
    ...typography.button,
    color: colors.onAccent,
  },
  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.accent,
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
