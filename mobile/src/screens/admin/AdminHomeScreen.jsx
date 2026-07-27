// Hub administrativo — rota inicial do AdminStack, único ponto de entrada para
// as 3 áreas administrativas: Posts, Professores e Alunos. Sem lógica de rede própria,
// apenas navegação local.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radii, spacing, typography } from '../../theme/tokens';

function MenuCard({ icon, label, description, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${label}`}
      accessibilityHint={description}
    >
      <View
        style={styles.iconWell}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{label}</Text>
        {/* A linha só dizia "Posts"; agora diz o que se faz lá dentro. */}
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.textMuted}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </Pressable>
  );
}

export default function AdminHomeScreen({ navigation }) {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ÁREA DO PROFESSOR</Text>
        <Text style={styles.saudacao}>{user?.nome ? `Olá, ${user.nome}.` : 'Olá.'}</Text>
        <Text style={styles.subtitulo}>Escolha o que você quer gerenciar agora.</Text>
      </View>

      <MenuCard
        icon="document-text-outline"
        label="Posts"
        description="Publicar, editar e remover leituras"
        onPress={() => navigation.navigate('PostAdminList')}
      />
      <MenuCard
        icon="person-outline"
        label="Professores"
        description="Cadastrar e manter contas de professor"
        onPress={() => navigation.navigate('ProfessorList')}
      />
      <MenuCard
        icon="people-outline"
        label="Alunos"
        description="Cadastrar e manter registros de aluno"
        onPress={() => navigation.navigate('AlunoList')}
      />
      <MenuCard
        icon="eye-outline"
        label="Ver como aluno"
        description="Abrir a leitura pública sem sair da sua conta"
        onPress={() => navigation.navigate('StudentPreview')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accent,
  },
  saudacao: {
    ...typography.display,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  subtitulo: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    backgroundColor: colors.surface,
  },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  cardDescription: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: 2,
  },
});
