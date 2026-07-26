// Listagem paginada real de professores — espelha a estrutura de
// PostAdminListScreen.jsx (guarda cancelled/retryKey/listener de focus), mas com
// paginação real no servidor via infinite scroll, diferente
// de posts (que não pagina).
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../../components/EmptyState';
import { professoresService } from '../../services/professoresService';
import { colors, spacing, typography } from '../../theme/tokens';

const PAGE_LIMIT = 10;

export default function ProfessorListScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const hasMore = items.length < total;

  // Reseta para a primeira página a cada retryKey (também cobre o recarregamento ao
  // voltar de criar/editar/excluir, via o listener de focus abaixo).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setHasError(false);
    professoresService.list({ page: 1, limit: PAGE_LIMIT })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data);
        setTotal(res.total);
        setPage(1);
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

  // Ignora o primeiro evento de foco (montagem inicial), já coberto pelo useEffect acima.
  const isFirstFocus = useRef(true);
  const endReachedLockRef = useRef(false);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      setRetryKey((k) => k + 1);
    });
    return unsubscribe;
  }, [navigation]);

  // Após excluir, volta à página 1 e usa o total devolvido pelo servidor. A
  // redução local mantém a interface coerente caso essa reconciliação falhe.
  function reconcileFirstPage(deletedId) {
    setItems((current) => current.filter((item) => item.id !== deletedId).slice(0, PAGE_LIMIT));
    setTotal((current) => Math.max(0, current - 1));
    setPage(1);

    return professoresService
      .list({ page: 1, limit: PAGE_LIMIT })
      .then((res) => {
        setItems(res.data);
        setTotal(res.total);
        setPage(1);
      })
      .catch(() => {
        // Mantém a primeira página reconciliada localmente; o próximo foco tenta de novo.
      });
  }

  function handleEndReached() {
    // A ref bloqueia reentradas no mesmo ciclo, antes de isFetchingMore renderizar.
    // A liberação ocorre somente quando a requisição termina.
    if (endReachedLockRef.current || isFetchingMore || !hasMore) return;
    endReachedLockRef.current = true;
    setIsFetchingMore(true);
    const nextPage = page + 1;
    professoresService.list({ page: nextPage, limit: PAGE_LIMIT })
      .then((res) => {
        setItems((current) => [...current, ...res.data]);
        setTotal(res.total);
        setPage(nextPage);
      })
      .catch(() => {
        // Falha ao buscar próxima página: mantém lista atual, permite retry no próximo scroll.
      })
      .finally(() => {
        endReachedLockRef.current = false;
        setIsFetchingMore(false);
      });
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

  function handleDelete(professor) {
    professoresService.remove(professor.id)
      .then(() => reconcileFirstPage(professor.id))
      .catch((err) => {
        // 404: professor já não existe, que era o objetivo — reconcilia mesmo assim.
        if (err?.response?.status === 404) {
          reconcileFirstPage(professor.id);
          return;
        }
        Alert.alert('Erro', 'Não foi possível excluir o professor. Tente novamente.');
      });
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
          onPress={() => setRetryKey((k) => k + 1)}
          accessibilityRole="button"
          accessibilityLabel="Tentar carregar os professores novamente"
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
          <ActivityIndicator color={colors.accent} accessibilityLabel="Carregando mais professores" />
        ) : null
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
