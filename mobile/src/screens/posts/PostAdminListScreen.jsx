import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../../components/EmptyState';
import { postsService } from '../../services/postsService';
import { colors, spacing, typography } from '../../theme/tokens';

export default function PostAdminListScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Guarda cancelled — mesmo padrão já estabelecido na Fase 1 (evita setState em
  // componente desmontado). Sem paginação/infinite-scroll nesta tela.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setHasError(false);
    postsService.list()
      .then((data) => {
        if (!cancelled) setPosts(data);
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  function confirmDelete(post) {
    Alert.alert(
      'Excluir post',
      'Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => handleDelete(post),
        },
      ],
    );
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
        }
      });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.
        </Text>
        <Pressable style={styles.retryButton} onPress={() => setRetryKey((k) => k + 1)}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={posts}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {item.author}
          </Text>
          <Pressable style={styles.deleteButton} onPress={() => confirmDelete(item)}>
            <Ionicons name="trash-outline" size={20} color={colors.destructive} />
            <Text style={styles.deleteLabel}>Excluir</Text>
          </Pressable>
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
  errorText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
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
  author: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 44,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  deleteLabel: {
    ...typography.label,
    color: colors.destructive,
  },
});
