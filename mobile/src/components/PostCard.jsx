import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/tokens';

const DESCRIPTION_LIMIT = 150;

function buildDescription(content) {
  if (!content) return '';
  if (content.length <= DESCRIPTION_LIMIT) return content;
  return `${content.slice(0, DESCRIPTION_LIMIT)}…`;
}

export default function PostCard({ post, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ler post: ${post.title}`}
      accessibilityHint="Abre o conteúdo completo do post"
    >
      <View style={styles.authorRow}>
        <Ionicons name="ribbon" size={12} color={colors.textMuted} style={styles.authorIcon} />
        <Text style={styles.author} numberOfLines={1}>
          {post.author}
        </Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {post.title}
      </Text>
      <Text style={styles.description} numberOfLines={3}>
        {buildDescription(post.content)}
      </Text>
      <Text style={styles.cta}>
        Continuar leitura
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 44,
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  authorIcon: {
    marginRight: 6,
  },
  author: {
    ...typography.label,
    color: colors.textMuted,
    fontWeight: '500',
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  cta: {
    ...typography.label,
    color: colors.accent,
    fontWeight: '600',
    marginTop: spacing.md,
  },
});
