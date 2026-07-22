import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';

const DESCRIPTION_LIMIT = 150;

function buildDescription(content) {
  if (!content) return '';
  if (content.length <= DESCRIPTION_LIMIT) return content;
  return `${content.slice(0, DESCRIPTION_LIMIT)}…`;
}

export default function PostCard({ post, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.title} numberOfLines={2}>
        {post.title}
      </Text>
      <Text style={styles.author} numberOfLines={1}>
        {post.author}
      </Text>
      <Text style={styles.description} numberOfLines={3}>
        {buildDescription(post.content)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 44,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  title: {
    ...typography.heading,
    color: colors.accent,
  },
  author: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
