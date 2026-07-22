import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/tokens';

export default function EmptyState({ heading, body, icon }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color="#6B7280" style={styles.icon} />
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  icon: {
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.heading,
    color: '#111827',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: '#6B7280',
    textAlign: 'center',
  },
});
