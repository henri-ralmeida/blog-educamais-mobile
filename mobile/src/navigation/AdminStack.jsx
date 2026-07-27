import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import PostAdminListScreen from '../screens/posts/PostAdminListScreen';
import PostFormScreen from '../screens/posts/PostFormScreen';
import ProfessorListScreen from '../screens/professores/ProfessorListScreen';
import ProfessorFormScreen from '../screens/professores/ProfessorFormScreen';
import AlunoListScreen from '../screens/alunos/AlunoListScreen';
import AlunoFormScreen from '../screens/alunos/AlunoFormScreen';
import PostListScreen from '../screens/posts/PostListScreen';
import PostDetailScreen from '../screens/posts/PostDetailScreen';
import { useAuth } from '../contexts/AuthContext';
import { confirmDestructiveAction, notify } from '../utils/dialogs';
import { colors, radii, spacing, typography } from '../theme/tokens';

const Stack = createNativeStackNavigator();

// Componente separado (fora de options): useAuth() é hook, só pode ser chamado
// dentro do corpo de um componente React, nunca dentro de uma função de config de rota.
function LogoutButton() {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Alert.alert é no-op na web: o botão "Sair" simplesmente não fazia nada e o
  // JWT continuava no storage do navegador até expirar, com a área
  // administrativa acessível para o próximo usuário da máquina.
  async function handleLogout() {
    if (isLoggingOut) return;
    const confirmed = await confirmDestructiveAction({
      title: 'Sair',
      message: 'Deseja encerrar a sessão administrativa?',
      confirmLabel: 'Sair',
    });
    if (!confirmed) return;

    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      // Mensagem de rejeição não-Error virava "undefined" na tela.
      notify('Erro ao sair', err?.message ?? 'Não foi possível encerrar a sessão.');
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
      onPress={handleLogout}
      disabled={isLoggingOut}
      accessibilityRole="button"
      accessibilityLabel={isLoggingOut ? 'Encerrando sessão administrativa' : 'Sair da área administrativa'}
      accessibilityState={{ disabled: isLoggingOut, busy: isLoggingOut }}
      hitSlop={spacing.sm}
    >
      {isLoggingOut ? (
        <ActivityIndicator color={colors.textSecondary} accessibilityLabel="Encerrando sessão" />
      ) : (
        <>
          <Ionicons
            name="log-out-outline"
            size={16}
            color={colors.textSecondary}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
          <Text style={styles.logoutText}>Sair</Text>
        </>
      )}
    </Pressable>
  );
}


export default function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: { ...typography.title, color: colors.textPrimary },
        headerTintColor: colors.accent,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.paper },
      }}
    >
      <Stack.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{
          title: 'Administração',
          headerLeft: () => <LogoutButton />,
        }}
      />
      <Stack.Screen
        name="PostAdminList"
        component={PostAdminListScreen}
        options={{ title: 'Posts' }}
      />
      <Stack.Screen
        name="PostForm"
        component={PostFormScreen}
        options={({ route }) => ({
          title: route.params?.id !== undefined && route.params?.id !== null ? 'Editar post' : 'Novo post',
        })}
      />
      <Stack.Screen
        name="ProfessorList"
        component={ProfessorListScreen}
        options={{ title: 'Professores' }}
      />
      <Stack.Screen
        name="ProfessorForm"
        component={ProfessorFormScreen}
        options={({ route }) => ({
          title: route.params?.id !== undefined && route.params?.id !== null ? 'Editar professor' : 'Novo professor',
        })}
      />
      <Stack.Screen
        name="AlunoList"
        component={AlunoListScreen}
        options={{ title: 'Alunos' }}
      />
      <Stack.Screen
        name="AlunoForm"
        component={AlunoFormScreen}
        options={({ route }) => ({
          title: route.params?.id !== undefined && route.params?.id !== null ? 'Editar aluno' : 'Novo aluno',
        })}
      />
      {/* Reaproveita as telas da área pública dentro do stack administrativo: o professor
          navega e volta pelo botão padrão do header, sem sair da própria sessão. */}
      <Stack.Screen
        name="StudentPreview"
        component={PostListScreen}
        options={{ title: 'Visão do aluno' }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Post' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minWidth: 44,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    marginLeft: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerActionPressed: {
    opacity: 0.72,
  },
  logoutText: {
    ...typography.button,
    color: colors.textSecondary,
  },
});
