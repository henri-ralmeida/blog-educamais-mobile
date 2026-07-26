import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { postsService } from '../../services/postsService';
import { confirmDestructiveAction } from '../../utils/dialogs';
import { describeRequestError } from '../../utils/requestError';
import { colors, spacing, typography } from '../../theme/tokens';

export default function PostAdminListScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const hasLoadedRef = useRef(false);

  // Recarrega no foco inicial e após voltar da criação/edição. Cleanup impede
  // atualização de estado quando tela perde foco ou é desmontada.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!hasLoadedRef.current) setLoading(true);
      setErrorMessage(null);
      postsService.list()
        .then((data) => {
          if (cancelled) return;
          setPosts(data);
          hasLoadedRef.current = true;
        })
        .catch((error) => {
          if (cancelled) return;
          setErrorMessage(describeRequestError(error).message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [retryKey]),
  );

  async function confirmDelete(post) {
    setActionError(null);
    const confirmed = await confirmDestructiveAction({
      title: 'Excluir post',
      message: `Tem certeza que deseja excluir "${post.title}"? Esta ação não pode ser desfeita.`,
    });
    if (confirmed) handleDelete(post);
  }

  function handleDelete(post) {
    postsService.remove(post.id)
      .then(() => {
        setPosts((current) => current.filter((p) => p.id !== post.id));
      })
      .catch((err) => {
        // 404: o post já não existe, que era o objetivo — sucesso silencioso.
        if (err?.response?.status === 404) {
          setPosts((current) => current.filter((p) => p.id !== post.id));
          return;
        }
        // Antes o feedback saía por Alert.alert, engolido na web: uma falha de
        // exclusão não produzia sinal nenhum e o usuário assumia sucesso.
        setActionError(describeRequestError(err).message);
      });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} accessibilityLabel="Carregando posts" />
      </View>
    );
  }

  // Erro em tela cheia só quando não há nada para mostrar. Antes uma falha
  // transitória no refetch de foco descartava a lista inteira já carregada.
  if (errorMessage && posts.length === 0) {
    return (
      <View style={styles.centered}>
        <ErrorState
          message={errorMessage}
          onRetry={() => setRetryKey((k) => k + 1)}
          retryLabel="Tentar carregar os posts novamente"
        />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={posts}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        errorMessage || actionError ? (
          <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text style={styles.bannerText}>{actionError ?? errorMessage}</Text>
            <Pressable
              onPress={() => {
                setActionError(null);
                setRetryKey((k) => k + 1);
              }}
              accessibilityRole="button"
              accessibilityLabel="Atualizar a lista de posts"
              style={({ pressed }) => [styles.bannerAction, pressed && styles.buttonPressed]}
            >
              <Text style={styles.bannerActionText}>Atualizar</Text>
            </Pressable>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.preview} numberOfLines={3}>
            {item.content}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {item.author}
          </Text>
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}
              onPress={() => navigation.navigate('PostForm', { id: item.id })}
              accessibilityRole="button"
              accessibilityLabel={`Editar post: ${item.title}`}
            >
              <Ionicons name="create-outline" size={20} color={colors.accent} />
              <Text style={styles.editLabel}>Editar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
              onPress={() => confirmDelete(item)}
              accessibilityRole="button"
              accessibilityLabel={`Excluir post: ${item.title}`}
            >
              <Ionicons name="trash-outline" size={20} color={colors.destructive} />
              <Text style={styles.deleteLabel}>Excluir</Text>
            </Pressable>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="document-text-outline"
          heading="Nenhum post cadastrado"
          body="Crie seu primeiro post para começar."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingTop: spacing.lg,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing['3xl'],
  },
  banner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.destructive,
  },
  bannerText: {
    ...typography.label,
    color: colors.textPrimary,
  },
  bannerAction: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  bannerActionText: {
    ...typography.button,
    color: colors.accent,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  item: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  preview: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  author: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 44,
    gap: spacing.xs,
  },
  editLabel: {
    ...typography.label,
    color: colors.accent,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 44,
    gap: spacing.xs,
  },
  deleteLabel: {
    ...typography.label,
    color: colors.destructive,
  },
});
