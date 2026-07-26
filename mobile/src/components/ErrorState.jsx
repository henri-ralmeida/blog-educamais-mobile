import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import { colors, radii, spacing, typography } from '../theme/tokens';

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
      <View
        style={styles.iconWell}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Ionicons name="cloud-offline-outline" size={26} color={colors.destructive} />
      </View>
      <Text style={styles.text}>{message}</Text>
      {onRetry ? (
        <PrimaryButton
          label="Tentar novamente"
          icon="refresh"
          onPress={onRetry}
          accessibilityLabel={retryLabel}
          style={styles.action}
        />
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
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
  iconWell: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.destructiveSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 360,
  },
  action: {
    marginTop: spacing.lg,
  },
  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
});
