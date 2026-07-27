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
import PrimaryButton from '../../components/PrimaryButton';
import { usePaginatedCrudList } from '../../hooks/usePaginatedCrudList';
import { useAuth } from '../../contexts/AuthContext';
import { confirmDestructiveAction } from '../../utils/dialogs';
import { describeRequestError } from '../../utils/requestError';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const PAGE_LIMIT = 10;

function iniciais(nome) {
  // Só palavras que começam com letra: "Professor Ficticio 12" virava "P1",
  // misturando inicial com número de sequência.
  const partes = String(nome ?? '')
    .trim()
    .split(/\s+/)
    .filter((parte) => /^\p{L}/u.test(parte));
  if (partes.length === 0) return '?';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : partes[0][1] ?? '';
  return (primeira + ultima).toUpperCase();
}

export default function CrudListScreen({
  navigation,
  service,
  formRoute,
  singular,
  plural,
  criarLabel,
  emptyIcon,
  emptyHeading,
  emptyBody,
  // Só professores: a conta autenticada não pode se auto-excluir nem se
  // auto-editar sem aviso (trocar a própria senha derruba a sessão).
  protegerContaPropria = false,
}) {
  const {
    items,
    total,
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

  function ehContaPropria(item) {
    return user?.id !== undefined && String(user.id) === String(item.id);
  }

  // A própria conta sempre no topo da lista, independente da ordenação vinda do
  // servidor (createdAt desc). Só reordena a página já carregada; o restante
  // mantém a ordem original entre si.
  function comContaPropriaNoTopo(lista) {
    if (!protegerContaPropria) return lista;
    const indice = lista.findIndex((item) => ehContaPropria(item));
    if (indice <= 0) return lista;
    const copia = lista.slice();
    const [propria] = copia.splice(indice, 1);
    copia.unshift(propria);
    return copia;
  }

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

  // Trocar a própria senha não derruba mais a sessão (ProfessorFormScreen reloga
  // sozinho depois de salvar), então editar a própria conta não precisa mais
  // de confirmação prévia — o aviso ficaria descrevendo um risco que não existe.
  function abrirEdicao(item) {
    navigation.navigate(formRoute, { id: item.id, nome: item.nome, email: item.email });
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
    <View style={styles.container}>
      {/* A ação principal da tela era um "+" de 24px na barra de navegação, o
          elemento menos visível do layout. Agora é um botão rotulado, junto da
          contagem de registros. */}
      <View style={styles.toolbar}>
        <View>
          <Text style={styles.toolbarEyebrow}>{plural.toUpperCase()}</Text>
          <Text style={styles.toolbarCount}>
            {/* Mostrava só o que estava carregado: "10 registros" com 14 no
                servidor parecia que a lista tinha perdido gente. */}
            {total > items.length
              ? `${items.length} de ${total} carregados`
              : `${total} ${total === 1 ? 'registro' : 'registros'}`}
            {refreshing ? ' · atualizando' : ''}
          </Text>
        </View>
        <PrimaryButton
          label={criarLabel}
          icon="add"
          onPress={() => navigation.navigate(formRoute)}
          accessibilityLabel={`Criar novo ${singular}`}
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
            style={({ pressed }) => [styles.bannerAction, pressed && styles.pressed]}
            onPress={() => {
              setActionError(null);
              reconcileFirstPage();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Atualizar lista de ${plural}`}
          >
            <Text style={styles.bannerActionText}>Atualizar</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={comContaPropriaNoTopo(items)}
        keyExtractor={(item) => String(item.id)}
        onEndReached={() => loadMore()}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          isFetchingMore ? (
            <View style={styles.listFooter}>
              <ActivityIndicator color={colors.accent} accessibilityLabel={`Carregando mais ${plural}`} />
            </View>
          ) : loadMoreError ? (
            <View style={styles.listFooter} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Text style={styles.footerErrorText}>{`Não foi possível carregar mais ${plural}.`}</Text>
              <Pressable
                style={({ pressed }) => [styles.footerRetryButton, pressed && styles.pressed]}
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
            <View style={styles.row}>
              <View style={[styles.avatar, contaPropria && styles.avatarPropria]}>
                <Text style={styles.avatarText}>{iniciais(item.nome)}</Text>
              </View>
              <View style={styles.rowInfo}>
                <View style={styles.rowTitleLine}>
                  <Text style={styles.nome} numberOfLines={1}>
                    {item.nome}
                  </Text>
                  {contaPropria && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>você</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.email} numberOfLines={1}>
                  {item.email}
                </Text>
              </View>
              {/* Ações à direita, na mesma linha do registro: antes ficavam no
                  rodapé do card, em texto, com o destrutivo do mesmo peso do
                  seguro. */}
              <View style={styles.rowActions}>
                <Pressable
                  style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                  onPress={() => abrirEdicao(item)}
                  disabled={refreshing}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${singular}: ${item.nome}`}
                  accessibilityState={{ disabled: refreshing }}
                >
                  <Ionicons name="create-outline" size={20} color={colors.accent} />
                </Pressable>
                {contaPropria ? null : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.iconButton,
                      styles.iconButtonDanger,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => confirmDelete(item)}
                    disabled={refreshing}
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir ${singular}: ${item.nome}`}
                    accessibilityState={{ disabled: refreshing }}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon={emptyIcon}
            heading={emptyHeading}
            body={emptyBody}
            actionLabel={criarLabel}
            onAction={() => navigation.navigate(formRoute)}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.paper,
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
    marginLeft: spacing.md + 40 + spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPropria: {
    backgroundColor: colors.highlight,
  },
  avatarText: {
    ...typography.label,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nome: {
    ...typography.heading,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radii.pill,
    backgroundColor: colors.highlight,
  },
  chipText: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textPrimary,
  },
  email: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: 2,
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.xl,
  },
});
