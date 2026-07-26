// Listagem paginada real de professores, com paginação no servidor.
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../../components/EmptyState';
import { usePaginatedCrudList } from '../../hooks/usePaginatedCrudList';
import { professoresService } from '../../services/professoresService';
import { colors, spacing, typography } from '../../theme/tokens';

const PAGE_LIMIT = 10;

export default function ProfessorListScreen({ navigation }) {
  const {
    items,
    loading,
    refreshing,
    isFetchingMore,
    hasError,
    loadMoreError,
    reconciliationError,
    loadFirstPage,
    refresh,
    loadMore,
    reconcileFirstPage,
  } = usePaginatedCrudList(professoresService, { pageLimit: PAGE_LIMIT });

  // Ignora o primeiro evento de foco, já coberto pelo carregamento inicial do hook.
  const isFirstFocus = useRef(true);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      loadFirstPage();
    });
    return unsubscribe;
  }, [loadFirstPage, navigation]);

  function handleRefresh() {
    refresh();
  }

  function handleEndReached() {
    loadMore();
  }

  function retryLoadMore() {
    loadMore({ retry: true });
  }

  function confirmDelete(professor) {
    Alert.alert(
      'Excluir professor',
      'Tem certeza que deseja excluir este professor? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => handleDelete(professor),
        },
      ],
    );
  }

  async function handleDelete(professor) {
    try {
      await professoresService.remove(professor.id);
    } catch (err) {
      // 404: professor já não existe, que era o objetivo — reconcilia mesmo assim.
      if (err?.response?.status !== 404) {
        Alert.alert('Erro', 'Não foi possível excluir o professor. Tente novamente.');
        return;
      }
    }

    await reconcileFirstPage();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} accessibilityLabel="Carregando professores" />
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
          onPress={() => loadFirstPage({ showLoading: true })}
          accessibilityRole="button"
          accessibilityLabel="Tentar carregar os professores novamente"
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      {reconciliationError && (
        <View style={styles.reconciliationBanner} accessibilityLiveRegion="polite">
          <Text style={styles.reconciliationText}>
            Professor excluído, mas não foi possível atualizar a lista.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.reconciliationRetry, pressed && styles.buttonPressed]}
            onPress={() => reconcileFirstPage()}
            accessibilityRole="button"
            accessibilityLabel="Atualizar lista de professores novamente"
          >
            <Text style={styles.reconciliationRetryText}>Atualizar lista</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => String(item.id)}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
        isFetchingMore ? (
          <View style={styles.listFooter}>
            <ActivityIndicator color={colors.accent} accessibilityLabel="Carregando mais professores" />
          </View>
        ) : loadMoreError ? (
          <View style={styles.listFooter} accessibilityLiveRegion="polite">
            <Text style={styles.footerErrorText}>Não foi possível carregar mais professores.</Text>
            <Pressable
              style={({ pressed }) => [styles.footerRetryButton, pressed && styles.buttonPressed]}
              onPress={retryLoadMore}
              accessibilityRole="button"
              accessibilityLabel="Tentar carregar mais professores novamente"
            >
              <Text style={styles.footerRetryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.nome} numberOfLines={1}>
            {item.nome}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {item.email}
          </Text>
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}
              onPress={() =>
                navigation.navigate('ProfessorForm', { id: item.id, nome: item.nome, email: item.email })
              }
              accessibilityRole="button"
              accessibilityLabel={`Editar professor: ${item.nome}`}
            >
              <Ionicons name="create-outline" size={20} color={colors.accent} />
              <Text style={styles.editLabel}>Editar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
              onPress={() => confirmDelete(item)}
              accessibilityRole="button"
              accessibilityLabel={`Excluir professor: ${item.nome}`}
            >
              <Ionicons name="trash-outline" size={20} color={colors.destructive} />
              <Text style={styles.deleteLabel}>Excluir</Text>
            </Pressable>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="person-outline"
          heading="Nenhum professor cadastrado"
          body="Cadastre o primeiro professor para começar."
        />
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
  reconciliationBanner: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.destructive,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reconciliationText: {
    ...typography.label,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  reconciliationRetry: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  reconciliationRetryText: {
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
    ...typography.button,
    color: colors.onAccent,
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
