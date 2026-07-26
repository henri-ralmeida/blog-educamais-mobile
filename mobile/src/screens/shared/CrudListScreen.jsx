// Listagem paginada administrativa compartilhada por professores e alunos.
// As duas telas eram ~95% idênticas: cada correção precisava ser aplicada duas
// vezes e as cópias já começavam a divergir.
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { usePaginatedCrudList } from '../../hooks/usePaginatedCrudList';
import { useAuth } from '../../contexts/AuthContext';
import { confirmDestructiveAction } from '../../utils/dialogs';
import { describeRequestError } from '../../utils/requestError';
import { colors, spacing, typography } from '../../theme/tokens';

const PAGE_LIMIT = 10;

export default function CrudListScreen({
  navigation,
  service,
  formRoute,
  singular,
  plural,
  emptyIcon,
  emptyHeading,
  emptyBody,
  // Só professores: a conta autenticada não pode se auto-excluir nem se
  // auto-editar sem aviso (trocar a própria senha derruba a sessão).
  protegerContaPropria = false,
}) {
  const {
    items,
    loading,
    refreshing,
    isFetchingMore,
    errorMessage,
    loadMoreError,
    reconciliationError,
    loadFirstPage,
    refresh,
    loadMore,
    reconcileFirstPage,
  } = usePaginatedCrudList(service, { pageLimit: PAGE_LIMIT });
  const { user } = useAuth();
  const [actionError, setActionError] = useState(null);

  // Ignora o primeiro evento de foco, já coberto pelo carregamento inicial do hook.
  const isFirstFocus = useRef(true);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      // showRefreshing: o recarregamento por foco era silencioso e deixava até
      // dez segundos de dados obsoletos totalmente clicáveis.
      loadFirstPage({ showRefreshing: true });
    });
    return unsubscribe;
  }, [loadFirstPage, navigation]);

  async function confirmDelete(item) {
    setActionError(null);
    const confirmed = await confirmDestructiveAction({
      title: `Excluir ${singular}`,
      message: `Tem certeza que deseja excluir "${item.nome}"? Esta ação não pode ser desfeita.`,
    });
    if (confirmed) handleDelete(item);
  }

  async function handleDelete(item) {
    try {
      await service.remove(item.id);
    } catch (err) {
      // 404: o registro já não existe, que era o objetivo — reconcilia mesmo assim.
      if (err?.response?.status !== 404) {
        setActionError(describeRequestError(err).message);
        return;
      }
    }
    await reconcileFirstPage();
  }

  async function abrirEdicao(item) {
    if (protegerContaPropria && ehContaPropria(item)) {
      const confirmed = await confirmDestructiveAction({
        title: 'Editar a própria conta',
        message:
          'Você está editando a conta com a qual está logado. Se alterar a senha, sua sessão será encerrada e você precisará entrar de novo.',
        confirmLabel: 'Continuar',
      });
      if (!confirmed) return;
    }
    navigation.navigate(formRoute, { id: item.id, nome: item.nome, email: item.email });
  }

  function ehContaPropria(item) {
    return user?.id !== undefined && String(user.id) === String(item.id);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} accessibilityLabel={`Carregando ${plural}`} />
      </View>
    );
  }

  // Erro em tela cheia só sem nada carregado: antes uma falha no recarregamento
  // silencioso apagava a lista inteira que já estava na tela.
  if (errorMessage && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ErrorState
          message={errorMessage}
          onRetry={() => loadFirstPage({ showLoading: true })}
          retryLabel={`Tentar carregar os ${plural} novamente`}
        />
      </View>
    );
  }

  const banner = actionError
    ?? errorMessage
    ?? (reconciliationError
      ? `Registro de ${singular} excluído, mas não foi possível atualizar a lista.`
      : null);

  return (
    <>
      {banner && (
        <View
          style={styles.banner}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.bannerText}>{banner}</Text>
          <Pressable
            style={({ pressed }) => [styles.bannerAction, pressed && styles.buttonPressed]}
            onPress={() => {
              setActionError(null);
              reconcileFirstPage();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Atualizar lista de ${plural}`}
          >
            <Text style={styles.bannerActionText}>Atualizar lista</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => String(item.id)}
        onEndReached={() => loadMore()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingMore ? (
            <View style={styles.listFooter}>
              <ActivityIndicator color={colors.accent} accessibilityLabel={`Carregando mais ${plural}`} />
            </View>
          ) : loadMoreError ? (
            <View style={styles.listFooter} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Text style={styles.footerErrorText}>{`Não foi possível carregar mais ${plural}.`}</Text>
              <Pressable
                style={({ pressed }) => [styles.footerRetryButton, pressed && styles.buttonPressed]}
                onPress={() => loadMore({ retry: true })}
                accessibilityRole="button"
                accessibilityLabel={`Tentar carregar mais ${plural} novamente`}
              >
                <Text style={styles.footerRetryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        renderItem={({ item }) => {
          const contaPropria = protegerContaPropria && ehContaPropria(item);
          return (
            <View style={styles.item}>
              <Text style={styles.nome} numberOfLines={1}>
                {item.nome}
                {contaPropria ? ' (você)' : ''}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {item.email}
              </Text>
              <View style={styles.actionsRow}>
                <Pressable
                  style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
                  onPress={() => abrirEdicao(item)}
                  disabled={refreshing}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${singular}: ${item.nome}`}
                  accessibilityState={{ disabled: refreshing }}
                >
                  <Ionicons name="create-outline" size={20} color={colors.accent} />
                  <Text style={styles.editLabel}>Editar</Text>
                </Pressable>
                {/* Auto-exclusão trancaria a área administrativa quando este for
                    o único professor cadastrado. */}
                {contaPropria ? null : (
                  <Pressable
                    style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
                    onPress={() => confirmDelete(item)}
                    disabled={refreshing}
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir ${singular}: ${item.nome}`}
                    accessibilityState={{ disabled: refreshing }}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                    <Text style={styles.deleteLabel}>Excluir</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon={emptyIcon} heading={emptyHeading} body={emptyBody} />
        }
      />
    </>
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
  listFooter: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  footerErrorText: {
    ...typography.label,
    color: colors.destructive,
    textAlign: 'center',
  },
  footerRetryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  footerRetryText: {
    ...typography.button,
    color: colors.accent,
  },
  banner: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.destructive,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bannerText: {
    ...typography.label,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  bannerAction: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  bannerActionText: {
    ...typography.button,
    color: colors.accent,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing['3xl'],
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
  nome: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  email: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  actionButton: {
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
  deleteLabel: {
    ...typography.label,
    color: colors.destructive,
  },
});
