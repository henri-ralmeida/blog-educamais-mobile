import { Pressable, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import PostAdminListScreen from '../screens/posts/PostAdminListScreen';
import PostFormScreen from '../screens/posts/PostFormScreen';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/tokens';

const Stack = createNativeStackNavigator();

// Componente separado (fora de options): useAuth() é hook, só pode ser chamado
// dentro do corpo de um componente React, nunca dentro de uma função de config de rota.
function LogoutButton() {
  const { logout } = useAuth();
  return (
    <Pressable onPress={logout}>
      <Text style={{ color: colors.textSecondary }}>Sair</Text>
    </Pressable>
  );
}

function CreatePostButton({ navigation }) {
  return (
    <Pressable onPress={() => navigation.navigate('PostForm')}>
      <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
    </Pressable>
  );
}

export default function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PostAdminList"
        component={PostAdminListScreen}
        options={({ navigation }) => ({
          title: 'Administração de posts',
          headerLeft: () => <LogoutButton />,
          headerRight: () => <CreatePostButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="PostForm"
        component={PostFormScreen}
        options={({ route }) => ({
          title: route.params?.id ? 'Editar post' : 'Novo post',
        })}
      />
    </Stack.Navigator>
  );
}
