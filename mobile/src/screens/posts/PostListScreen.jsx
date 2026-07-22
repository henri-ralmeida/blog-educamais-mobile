import { useEffect, useState } from 'react';
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
  const [hasError, setHasError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounce: agenda a atualização de debouncedTerm 400ms após o último keystroke,
  // cancelando o timeout anterior a cada novo caractere digitado.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // cancelled/manualFetchToken evitam setState em componente desmontado e descartam
  // respostas obsoletas de uma busca anterior mais lenta.
  useEffect(() => {
    let cancelled = false;
    postsService
      .search(debouncedTerm)
      .then((data) => {
        if (cancelled) return;
        setAllPosts(data);
        setVisibleCount(PAGE_SIZE);
        setHasError(false);
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedTerm]);

  function fetchPosts(term) {
    setHasError(false);
    return postsService
      .search(term)
      .then((data) => {
        setAllPosts(data);
        setVisibleCount(PAGE_SIZE);
      })
      .catch(() => {
        setHasError(true);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  function handleEndReached() {
    if (visibleCount >= allPosts.length) return;
    setVisibleCount((c) => Math.min(c + PAGE_SIZE, allPosts.length));
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchPosts(debouncedTerm);
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
        <Pressable style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  const visiblePosts = allPosts.slice(0, visibleCount);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
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
      ListFooterComponent={
        visibleCount < allPosts.length ? (
          <ActivityIndicator color={colors.accent} style={styles.footerLoader} />
        ) : null
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} colors={[colors.accent]} />
      }
      ListEmptyComponent={
        debouncedTerm ? (
          <EmptyState
            icon="document-text-outline"
            heading="Nenhum resultado para sua busca"
            body={`Não encontramos posts para "${debouncedTerm}". Tente outra palavra-chave.`}
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
  footerLoader: {
    marginVertical: spacing.lg,
  },
  searchBarWrapper: {
    paddingBottom: spacing.xl,
  },
});
