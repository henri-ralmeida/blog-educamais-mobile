import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import PostCard from '../../components/PostCard';
import SearchBar from '../../components/SearchBar';
import { postsService } from '../../services/postsService';
import { colors, spacing } from '../../theme/tokens';

const DEBOUNCE_MS = 400;

export default function PostListScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    postsService.search(debouncedTerm).then((data) => {
      setPosts(data);
      setLoading(false);
    });
  }, [debouncedTerm]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={posts}
      keyExtractor={(item) => item.id}
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
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
