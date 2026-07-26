import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import { colors, radii, spacing, typography } from '../theme/tokens';

export default function EmptyState({ heading, body, icon, actionLabel, onAction }) {
  return (
    // A troca para o estado vazio não era anunciada: sem live region o usuário de
    // leitor de tela ficava sem saber que a busca não retornou nada.
    <View style={styles.container} accessibilityLiveRegion="polite">
      <View
        style={styles.iconWell}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Ionicons name={icon} size={28} color={colors.accent} />
      </View>
      <Text style={styles.heading} accessibilityRole="header">{heading}</Text>
      <Text style={styles.body}>{body}</Text>
      {/* Tela vazia é convite para agir: antes só informava que não havia nada. */}
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} icon="add" onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    maxWidth: 360,
    alignSelf: 'center',
    width: '100%',
  },
  iconWell: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.lg,
  },
});
