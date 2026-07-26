import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import PostCard from '../../components/PostCard';
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { postsService } from '../../services/postsService';
import { describeRequestError } from '../../utils/requestError';
import { colors, spacing, typography } from '../../theme/tokens';

const DEBOUNCE_MS = 400;
const PAGE_SIZE = 10;

export default function PostListScreen({ navigation }) {
  const [allPosts, setAllPosts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const requestSeqRef = useRef(0);

  // Debounce: agenda a atualização de debouncedTerm 400ms após o último keystroke,
  // cancelando o timeout anterior a cada novo caractere digitado.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // keepReveal preserva quantos itens já estavam revelados: no pull-to-refresh a
  // lista encolhia de 30 para 10 itens porque o contador era sempre resetado.
  function fetchPosts(term, { finishRefresh = false, keepReveal = false } = {}) {
    const requestSeq = ++requestSeqRef.current;
    const normalizedTerm = term.trim();

    setErrorMessage(null);
    setIsFetching(true);
    return postsService
      .search(normalizedTerm)
      .then((data) => {
        if (requestSeq !== requestSeqRef.current) return;
        setAllPosts(data);
        setVisibleCount((current) =>
          keepReveal ? Math.min(Math.max(current, PAGE_SIZE), Math.max(data.length, PAGE_SIZE)) : PAGE_SIZE,
        );
        setErrorMessage(null);
      })
      .catch((error) => {
        if (requestSeq !== requestSeqRef.current) return;
        setErrorMessage(describeRequestError(error).message);
      })
      .finally(() => {
        if (requestSeq !== requestSeqRef.current) return;
        setLoading(false);
        setIsFetching(false);
        if (finishRefresh) setRefreshing(false);
      });
  }

  useEffect(() => {
    fetchPosts(debouncedTerm);
  }, [debouncedTerm]);

  useEffect(() => () => {
    requestSeqRef.current += 1;
  }, []);

  // Paginação local: todos os posts já vieram da busca; onEndReached só aumenta
  // o slice visível de forma síncrona, sem requisição e sem timer artificial.
  function handleEndReached() {
    setVisibleCount((current) =>
      current >= allPosts.length ? current : Math.min(current + PAGE_SIZE, allPosts.length),
    );
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchPosts(debouncedTerm, { finishRefresh: true, keepReveal: true });
  }

  function handleRetry() {
    setLoading(true);
    fetchPosts(debouncedTerm, { keepReveal: true });
  }

  function handleClearSearch() {
    setSearchTerm('');
    setDebouncedTerm('');
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} accessibilityLabel="Carregando posts" />
      </View>
    );
  }

  const visiblePosts = allPosts.slice(0, visibleCount);
  const normalizedTerm = debouncedTerm.trim();
  const hasFilter = normalizedTerm.length > 0;

  // O erro entra como ListEmptyComponent em vez de substituir a tela: antes o
  // early return desmontava a SearchBar junto, e um termo que falhava de forma
  // determinística não podia mais ser apagado — beco sem saída até reiniciar.
  function renderEmptyArea() {
    if (errorMessage) {
      return (
        <ErrorState
          message={errorMessage}
          onRetry={handleRetry}
          retryLabel="Tentar carregar os posts novamente"
          secondaryLabel={hasFilter ? 'Limpar busca' : undefined}
          onSecondary={hasFilter ? handleClearSearch : undefined}
        />
      );
    }
    // Sem esta guarda a tela afirmava "Ainda não há posts publicados" enquanto
    // uma busca ainda estava em voo, mesmo com posts existindo no servidor.
    if (isFetching) {
      return (
        <View style={styles.inlineLoader}>
          <ActivityIndicator color={colors.accent} accessibilityLabel="Buscando posts" />
        </View>
      );
    }
    return hasFilter ? (
      <EmptyState
        icon="document-text-outline"
        heading="Nenhum resultado para sua busca"
        body={`Não encontramos posts para "${normalizedTerm}". Tente outra palavra-chave.`}
      />
    ) : (
      <EmptyState
        icon="document-text-outline"
        heading="Nenhum post encontrado"
        body="Ainda não há posts publicados. Puxe a lista para baixo para atualizar."
      />
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[
        styles.listContent,
        visiblePosts.length === 0 && styles.emptyListContent,
      ]}
      data={visiblePosts}
      keyExtractor={(item) => String(item.id)}
      // Com o teclado aberto o primeiro toque no card era engolido pelo dismiss,
      // exigindo dois toques no fluxo buscar -> ler.
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <View style={styles.intro}>
            <Text style={styles.eyebrow}>CONTEÚDO PARA APRENDER</Text>
            <Text style={styles.introTitle} accessibilityRole="header">
              Ideias que continuam com você.
            </Text>
            <Text style={styles.introBody}>
              Encontre leituras preparadas por professores para ampliar o que você aprende.
            </Text>
          </View>
          <SearchBar value={searchTerm} onChangeText={setSearchTerm} />
        </View>
      }
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => navigation.navigate('PostDetail', { id: item.id })}
        />
      )}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      ListEmptyComponent={renderEmptyArea()}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingTop: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  listHeader: {},
  intro: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.label,
    color: colors.accent,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  introTitle: {
    ...typography.display,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  introBody: {
    ...typography.body,
    color: colors.textSecondary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  inlineLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
