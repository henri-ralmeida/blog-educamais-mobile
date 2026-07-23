// Listagem paginada real de alunos — espelha ProfessorListScreen 1:1,
// mesma mecânica de paginação real no servidor via infinite scroll.
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
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
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const hasMore = items.length < total;

  // Reseta para a primeira página a cada retryKey (também cobre o recarregamento ao
  // voltar de criar/editar/excluir, via o listener de focus abaixo).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setHasError(false);
    alunosService.list({ page: 1, limit: PAGE_LIMIT })
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

  function handleEndReached() {
    // Guarda dupla: não busca se já há fetch em voo, nem se não há mais páginas.
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    const nextPage = page + 1;
    alunosService.list({ page: nextPage, limit: PAGE_LIMIT })
      .then((res) => {
        setItems((current) => [...current, ...res.data]);
        setTotal(res.total);
        setPage(nextPage);
      })
      .catch(() => {
        // Falha ao buscar próxima página: mantém lista atual, permite retry no próximo scroll.
      })
      .finally(() => setIsFetchingMore(false));
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
      .then(() => {
        setItems((current) => current.filter((a) => a.id !== aluno.id));
        setTotal((t) => Math.max(0, t - 1));
      })
      .catch((err) => {
        // 404: aluno já não existe, que era o objetivo — sucesso silencioso.
        if (err?.response?.status === 404) {
          setItems((current) => current.filter((a) => a.id !== aluno.id));
          setTotal((t) => Math.max(0, t - 1));
          return;
        }
        Alert.alert('Erro', 'Não foi possível excluir o aluno. Tente novamente.');
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
      data={items}
      keyExtractor={(item) => String(item.id)}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={isFetchingMore ? <ActivityIndicator color={colors.accent} /> : null}
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
              style={styles.editButton}
              onPress={() =>
                navigation.navigate('AlunoForm', { id: item.id, nome: item.nome, email: item.email })
              }
            >
              <Ionicons name="create-outline" size={20} color={colors.accent} />
              <Text style={styles.editLabel}>Editar</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={() => confirmDelete(item)}>
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
