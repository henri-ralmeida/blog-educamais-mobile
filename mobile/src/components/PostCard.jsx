import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';

const DESCRIPTION_LIMIT = 150;

function buildDescription(content) {
  if (!content) return '';
  const codePoints = Array.from(content);
  if (codePoints.length <= DESCRIPTION_LIMIT) return content;
  return `${codePoints.slice(0, DESCRIPTION_LIMIT).join('')}…`;
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function PostCard({ post, onPress }) {
  const description = buildDescription(post.content);
  const data = formatDate(post.createdAt);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      // O label só continha o título, então leitor de tela não recebia autor nem
      // descrição — o requisito 1 do PDF exige os três em cada item da lista.
      accessibilityLabel={`Ler post: ${post.title}. Autor: ${post.author}. ${description}`}
      accessibilityHint="Abre o conteúdo completo do post"
    >
      {/* Faixa de marca-texto: identifica o item de leitura sem pesar o card. */}
      <View style={styles.marker} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.author} numberOfLines={1}>
            {post.author}
          </Text>
          {data ? <Text style={styles.metaSeparator}>·</Text> : null}
          {data ? <Text style={styles.date}>{data}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    minHeight: 44,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardPressed: {
    backgroundColor: colors.surface,
  },
  marker: {
    width: 4,
    backgroundColor: colors.highlight,
  },
  body: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  author: {
    ...typography.label,
    color: colors.accent,
    fontWeight: '600',
    flexShrink: 1,
  },
  metaSeparator: {
    ...typography.label,
    color: colors.textMuted,
  },
  date: {
    ...typography.label,
    color: colors.textMuted,
  },
});
