import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/tokens';

export default function EmptyState({ heading, body, icon }) {
  return (
    // A troca para o estado vazio não era anunciada: sem live region o usuário de
    // leitor de tela ficava sem saber que a busca não retornou nada.
    <View style={styles.container} accessibilityLiveRegion="polite">
      <View
        style={styles.iconWell}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Ionicons name={icon} size={32} color={colors.accent} style={styles.icon} />
      </View>
      <Text style={styles.heading} accessibilityRole="header">{heading}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    paddingVertical: spacing['2xl'],
    maxWidth: 320,
    alignSelf: 'center',
    width: '100%',
  },
  iconWell: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    marginBottom: 0,
  },
  heading: {
    ...typography.heading,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
