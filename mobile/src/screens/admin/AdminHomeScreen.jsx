// Hub administrativo — rota inicial do AdminStack, único ponto de entrada para
// as 3 áreas administrativas: Posts, Professores e Alunos. Sem lógica de rede própria,
// apenas navegação local.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/tokens';

function MenuRow({ icon, label, onPress }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowContent}>
        <Ionicons name={icon} size={24} color={colors.accent} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.accent} />
    </Pressable>
  );
}

export default function AdminHomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <MenuRow
        icon="document-text-outline"
        label="Posts"
        onPress={() => navigation.navigate('PostAdminList')}
      />
      <MenuRow
        icon="person-outline"
        label="Professores"
        onPress={() => navigation.navigate('ProfessorList')}
      />
      <MenuRow
        icon="people-outline"
        label="Alunos"
        onPress={() => navigation.navigate('AlunoList')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
