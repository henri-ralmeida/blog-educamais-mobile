import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import PrimaryButton from '../../components/PrimaryButton';
import { postsService } from '../../services/postsService';
import { confirmDestructiveAction } from '../../utils/dialogs';
import { describeRequestError } from '../../utils/requestError';
import { colors, radii, spacing, typography } from '../../theme/tokens';

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

  const banner = actionError ?? errorMessage;

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View>
          <Text style={styles.toolbarEyebrow}>PUBLICAÇÕES</Text>
          <Text style={styles.toolbarCount}>
            {posts.length === 1 ? '1 post publicado' : `${posts.length} posts publicados`}
          </Text>
        </View>
        <PrimaryButton
          label="Novo post"
          icon="add"
          onPress={() => navigation.navigate('PostForm')}
          accessibilityLabel="Criar novo post"
        />
      </View>

      {banner && (
        <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Ionicons
            name="alert-circle"
            size={18}
            color={colors.destructive}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
          <Text style={styles.bannerText}>{banner}</Text>
          <Pressable
            onPress={() => {
              setActionError(null);
              setRetryKey((k) => k + 1);
            }}
            accessibilityRole="button"
            accessibilityLabel="Atualizar a lista de posts"
            style={({ pressed }) => [styles.bannerAction, pressed && styles.pressed]}
          >
            <Text style={styles.bannerActionText}>Atualizar</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={posts}
        keyExtractor={(item) => String(item.id)}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.preview} numberOfLines={2}>
                {item.content}
              </Text>
              <Text style={styles.author} numberOfLines={1}>
                {item.author}
              </Text>
            </View>
            {/* Ações à direita da linha, ícone destrutivo tintado: antes eram
                dois links de texto no rodapé do card, com o mesmo peso visual. */}
            <View style={styles.rowActions}>
              <Pressable
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                onPress={() => navigation.navigate('PostForm', { id: item.id })}
                accessibilityRole="button"
                accessibilityLabel={`Editar post: ${item.title}`}
              >
                <Ionicons name="create-outline" size={20} color={colors.accent} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  styles.iconButtonDanger,
                  pressed && styles.pressed,
                ]}
                onPress={() => confirmDelete(item)}
                accessibilityRole="button"
                accessibilityLabel={`Excluir post: ${item.title}`}
              >
                <Ionicons name="trash-outline" size={20} color={colors.destructive} />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            heading="Nenhum post publicado"
            body="Publique a primeira leitura para os alunos."
            actionLabel="Novo post"
            onAction={() => navigation.navigate('PostForm')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toolbarEyebrow: {
    ...typography.eyebrow,
    color: colors.accent,
  },
  toolbarCount: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: 2,
  },
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    flexGrow: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.title,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  preview: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  author: {
    ...typography.label,
    color: colors.accent,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  iconButtonDanger: {
    backgroundColor: colors.destructiveSoft,
  },
  pressed: {
    opacity: 0.7,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.destructiveSoft,
  },
  bannerText: {
    ...typography.label,
    color: colors.textPrimary,
    flex: 1,
  },
  bannerAction: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  bannerActionText: {
    ...typography.button,
    color: colors.destructive,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.xl,
  },
});
