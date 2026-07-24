import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import PostAdminListScreen from '../screens/posts/PostAdminListScreen';
import PostFormScreen from '../screens/posts/PostFormScreen';
import ProfessorListScreen from '../screens/professores/ProfessorListScreen';
import ProfessorFormScreen from '../screens/professores/ProfessorFormScreen';
import AlunoListScreen from '../screens/alunos/AlunoListScreen';
import AlunoFormScreen from '../screens/alunos/AlunoFormScreen';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, typography } from '../theme/tokens';

const Stack = createNativeStackNavigator();

// Componente separado (fora de options): useAuth() é hook, só pode ser chamado
// dentro do corpo de um componente React, nunca dentro de uma função de config de rota.
function LogoutButton() {
  const { logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      Alert.alert('Erro', err.message);
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
      onPress={handleLogout}
      accessibilityRole="button"
      accessibilityLabel="Sair da área administrativa"
      hitSlop={spacing.sm}
    >
      <Text style={styles.logoutText}>Sair</Text>
    </Pressable>
  );
}

function CreatePostButton({ navigation }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
      onPress={() => navigation.navigate('PostForm')}
      accessibilityRole="button"
      accessibilityLabel="Criar novo post"
      hitSlop={spacing.sm}
    >
      <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
    </Pressable>
  );
}

function CreateProfessorButton({ navigation }) {
  return (
    <Pressable onPress={() => navigation.navigate('ProfessorForm')}>
      <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
    </Pressable>
  );
}

function CreateAlunoButton({ navigation }) {
  return (
    <Pressable onPress={() => navigation.navigate('AlunoForm')}>
      <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
    </Pressable>
  );
}

export default function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: typography.display,
        headerTintColor: colors.textPrimary,
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
        options={({ navigation }) => ({
          title: 'Administração de posts',
          headerRight: () => <CreatePostButton navigation={navigation} />,
        })}
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
        options={({ navigation }) => ({
          title: 'Professores',
          headerRight: () => <CreateProfessorButton navigation={navigation} />,
        })}
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
        options={({ navigation }) => ({
          title: 'Alunos',
          headerRight: () => <CreateAlunoButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="AlunoForm"
        component={AlunoFormScreen}
        options={({ route }) => ({
          title: route.params?.id !== undefined && route.params?.id !== null ? 'Editar aluno' : 'Novo aluno',
        })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionPressed: {
    opacity: 0.72,
  },
  logoutText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
