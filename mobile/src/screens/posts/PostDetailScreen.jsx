import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { postsService } from '../../services/postsService';
import { colors, spacing, typography } from '../../theme/tokens';

export default function PostDetailScreen({ route }) {
  const { id } = route.params;
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    postsService.getById(id)
      .then((data) => setPost(data))
      .catch((error) => {
        if (error?.response?.status === 404) {
          setNotFound(true);
        }
      });
  }, [id]);

  if (notFound) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body}>Post não encontrado</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.body}>{post.content}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    ...typography.heading,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
