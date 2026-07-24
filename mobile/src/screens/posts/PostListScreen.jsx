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
import PostCard from '../../components/PostCard';
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/EmptyState';
import { postsService } from '../../services/postsService';
import { colors, spacing, typography } from '../../theme/tokens';

const DEBOUNCE_MS = 400;
const PAGE_SIZE = 10;

export default function PostListScreen({ navigation }) {
  const [allPosts, setAllPosts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const requestSeqRef = useRef(0);
  const endReachedLockRef = useRef(false);
  const loadMoreTimeoutRef = useRef(null);

  // Debounce: agenda a atualização de debouncedTerm 400ms após o último keystroke,
  // cancelando o timeout anterior a cada novo caractere digitado.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  function fetchPosts(term, { finishRefresh = false } = {}) {
    const requestSeq = ++requestSeqRef.current;
    const normalizedTerm = term.trim();

    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
      loadMoreTimeoutRef.current = null;
      setIsLoadingMore(false);
    }
    setHasError(false);
    return postsService
      .search(normalizedTerm)
      .then((data) => {
        if (requestSeq !== requestSeqRef.current) return;
        setAllPosts(data);
        setVisibleCount(PAGE_SIZE);
        setHasError(false);
      })
      .catch(() => {
        if (requestSeq === requestSeqRef.current) setHasError(true);
      })
      .finally(() => {
        if (requestSeq === requestSeqRef.current) setLoading(false);
        if (finishRefresh) setRefreshing(false);
      });
  }

  useEffect(() => {
    fetchPosts(debouncedTerm);
  }, [debouncedTerm]);

  useEffect(() => () => {
    requestSeqRef.current += 1;
    if (loadMoreTimeoutRef.current) clearTimeout(loadMoreTimeoutRef.current);
  }, []);

  function handleEndReached() {
    if (endReachedLockRef.current || visibleCount >= allPosts.length) return;
    endReachedLockRef.current = true;
    setIsLoadingMore(true);
    loadMoreTimeoutRef.current = setTimeout(() => {
      setVisibleCount((c) => Math.min(c + PAGE_SIZE, allPosts.length));
      setIsLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 120);
  }

  function handleMomentumScrollBegin() {
    endReachedLockRef.current = false;
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchPosts(debouncedTerm, { finishRefresh: true });
  }

  function handleRetry() {
    setHasError(false);
    setLoading(true);
    fetchPosts(debouncedTerm);
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
        <Pressable
          style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
          onPress={handleRetry}
          accessibilityRole="button"
          accessibilityLabel="Tentar carregar os posts novamente"
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  const visiblePosts = allPosts.slice(0, visibleCount);
  const normalizedTerm = debouncedTerm.trim();

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[
        styles.listContent,
        visiblePosts.length === 0 && styles.emptyListContent,
      ]}
      data={visiblePosts}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View style={styles.searchBarWrapper}>
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
      onMomentumScrollBegin={handleMomentumScrollBegin}
      ListFooterComponent={
        isLoadingMore ? (
          <ActivityIndicator
            color={colors.accent}
            style={styles.footerLoader}
            accessibilityLabel="Carregando mais posts"
          />
        ) : null
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} colors={[colors.accent]} />
      }
      ListEmptyComponent={
        normalizedTerm ? (
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
        )
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
  emptyListContent: {
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
  footerLoader: {
    marginVertical: spacing.lg,
  },
  searchBarWrapper: {
    paddingBottom: spacing.xl,
  },
});
