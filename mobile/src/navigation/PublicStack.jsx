import { Pressable, StyleSheet, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PostDetailScreen from '../screens/posts/PostDetailScreen';
import PostListScreen from '../screens/posts/PostListScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import { colors, spacing, typography } from '../theme/tokens';

const Stack = createNativeStackNavigator();

export default function PublicStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: {
          ...typography.heading,
          color: colors.textPrimary,
        },
        headerTintColor: colors.accent,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="PostList"
        component={PostListScreen}
        options={({ navigation }) => ({
          title: 'Educa+',
          headerRight: () => (
            <Pressable
              style={({ pressed }) => [styles.loginButton, pressed && styles.loginButtonPressed]}
              onPress={() => navigation.navigate('Login')}
              accessibilityRole="button"
              accessibilityLabel="Entrar na área do professor"
              accessibilityHint="Abre a tela de login do professor"
              hitSlop={{ top: 8, bottom: 8, left: 12, right: 8 }}
            >
              <Text style={styles.loginButtonText}>Entrar</Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Post' }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Área do professor' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loginButton: {
    minHeight: 40,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    marginRight: spacing.sm,
  },
  loginButtonPressed: {
    opacity: 0.78,
  },
  loginButtonText: {
    ...typography.label,
    color: colors.accent,
    fontWeight: '600',
  },
});
