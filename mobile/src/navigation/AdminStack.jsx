import { Pressable, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PostAdminListScreen from '../screens/posts/PostAdminListScreen';
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

export default function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PostAdminList"
        component={PostAdminListScreen}
        options={{
          title: 'Administração de posts',
          headerLeft: () => <LogoutButton />,
        }}
      />
    </Stack.Navigator>
  );
}
