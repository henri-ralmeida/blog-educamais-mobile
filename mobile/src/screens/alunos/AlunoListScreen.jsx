// Listagem paginada real de alunos — espelha ProfessorListScreen 1:1,
// mesma mecânica de paginação real no servidor via infinite scroll.
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { alunosService } from '../../services/alunosService';
import { colors, spacing, typography } from '../../theme/tokens';

const PAGE_LIMIT = 10;

export default function AlunoListScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const hasMore = items.length < total;
  const mountedRef = useRef(true);
  const requestGenerationRef = useRef(0);
  const endReachedLockRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestGenerationRef.current += 1;
    };
  }, []);

  const loadFirstPage = useCallback(async ({ showLoading = false, showRefreshing = false } = {}) => {
    const requestGeneration = ++requestGenerationRef.current;
    endReachedLockRef.current = true;
    setIsFetchingMore(false);
    if (showLoading) setLoading(true);
    if (showRefreshing) setRefreshing(true);
    setHasError(false);

    try {
      const res = await alunosService.list({ page: 1, limit: PAGE_LIMIT });
      if (!mountedRef.current || requestGeneration !== requestGenerationRef.current) return false;
      setItems(res.data);
      setTotal(res.total);
      setPage(1);
      return true;
    } catch {
      if (!mountedRef.current || requestGeneration !== requestGenerationRef.current) return false;
      setHasError(true);
      setPage(1);
      return false;
    } finally {
      if (mountedRef.current && requestGeneration === requestGenerationRef.current) {
        endReachedLockRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Reseta para a primeira página a cada retryKey (também cobre o recarregamento ao
  // voltar de criar/editar/excluir, via o listener de focus abaixo).
  useEffect(() => {
    loadFirstPage({ showLoading: true });
  }, [loadFirstPage, retryKey]);

  // Ignora o primeiro evento de foco (montagem inicial), já coberto pelo useEffect acima.
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
    loadFirstPage({ showRefreshing: true });
  }

  async function reconcileFirstPage() {
    // Invalida qualquer próxima página em voo antes de buscar a fonte de verdade.
    await loadFirstPage();
  }

  function handleEndReached() {
    // A ref bloqueia reentradas no mesmo ciclo, antes de isFetchingMore renderizar.
    if (endReachedLockRef.current || isFetchingMore || !hasMore || hasError) return;
    endReachedLockRef.current = true;
    setIsFetchingMore(true);
    const nextPage = page + 1;
    const requestGeneration = requestGenerationRef.current;
    alunosService.list({ page: nextPage, limit: PAGE_LIMIT })
      .then((res) => {
        if (!mountedRef.current || requestGeneration !== requestGenerationRef.current) return;
        setItems((current) => [...current, ...res.data]);
        setTotal(res.total);
        setPage(nextPage);
      })
      .catch(() => {
        // Falha ao buscar próxima página: mantém lista e offset atuais.
      })
      .finally(() => {
        if (!mountedRef.current || requestGeneration !== requestGenerationRef.current) return;
        endReachedLockRef.current = false;
        setIsFetchingMore(false);
      });
  }

  function confirmDelete(aluno) {
    Alert.alert(
      'Excluir aluno',
      'Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => handleDelete(aluno),
        },
      ],
    );
  }

  function handleDelete(aluno) {
    alunosService.remove(aluno.id)
      .then(() => reconcileFirstPage())
      .catch((err) => {
        // 404: aluno já não existe, que era o objetivo — reconcilia mesmo assim.
        if (err?.response?.status === 404) {
          reconcileFirstPage();
          return;
        }
        Alert.alert('Erro', 'Não foi possível excluir o aluno. Tente novamente.');
      });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} accessibilityLabel="Carregando alunos" />
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
          onPress={() => setRetryKey((k) => k + 1)}
          accessibilityRole="button"
          accessibilityLabel="Tentar carregar os alunos novamente"
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={items}
      keyExtractor={(item) => String(item.id)}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingMore ? (
          <ActivityIndicator color={colors.accent} accessibilityLabel="Carregando mais alunos" />
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
                navigation.navigate('AlunoForm', { id: item.id, nome: item.nome, email: item.email })
              }
              accessibilityRole="button"
              accessibilityLabel={`Editar aluno: ${item.nome}`}
            >
              <Ionicons name="create-outline" size={20} color={colors.accent} />
              <Text style={styles.editLabel}>Editar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
              onPress={() => confirmDelete(item)}
              accessibilityRole="button"
              accessibilityLabel={`Excluir aluno: ${item.nome}`}
            >
              <Ionicons name="trash-outline" size={20} color={colors.destructive} />
              <Text style={styles.deleteLabel}>Excluir</Text>
            </Pressable>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="people-outline"
          heading="Nenhum aluno cadastrado"
          body="Cadastre o primeiro aluno para começar."
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
