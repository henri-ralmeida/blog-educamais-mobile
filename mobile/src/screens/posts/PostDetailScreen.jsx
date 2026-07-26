import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import ErrorState from '../../components/ErrorState';
import { postsService } from '../../services/postsService';
import { describeRequestError } from '../../utils/requestError';
import { colors, spacing, typography } from '../../theme/tokens';

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('pt-BR');
}

export default function PostDetailScreen({ route }) {
  // route.params vinha desestruturado direto: alcançar a tela sem params
  // (deep link, restauração de estado) lançava TypeError antes do primeiro render.
  const { id } = route?.params ?? {};
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (id === undefined || id === null) {
      setErrorMessage('Post não informado. Volte para a lista e escolha uma leitura.');
      return undefined;
    }
    let cancelled = false;
    setErrorMessage(null);
    setNotFound(false);
    setPost(null);
    postsService.getById(id)
      .then((data) => {
        if (!cancelled) setPost(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          setErrorMessage(describeRequestError(err).message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, retryKey]);

  if (notFound) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body} accessibilityRole="alert" accessibilityLiveRegion="polite">
          Post não encontrado
        </Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <ErrorState
          message={errorMessage}
          onRetry={id === undefined || id === null ? undefined : () => setRetryKey((k) => k + 1)}
          retryLabel="Tentar carregar o post novamente"
        />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} accessibilityLabel="Carregando post" />
      </View>
    );
  }

  const publishedAt = formatDate(post.createdAt);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">{post.title}</Text>
      {/* A leitura omitia autor e data que a API já devolve, regredindo a
          informação que o card da lista mostra. */}
      <Text style={styles.meta}>
        {post.author}
        {publishedAt ? ` · ${publishedAt}` : ''}
      </Text>
      <Text style={styles.body}>{post.content}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.textPrimary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing['3xl'],
  },
});
