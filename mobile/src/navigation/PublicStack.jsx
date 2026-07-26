import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PostDetailScreen from '../screens/posts/PostDetailScreen';
import PostListScreen from '../screens/posts/PostListScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import { colors, radii, spacing, typography } from '../theme/tokens';

const Stack = createNativeStackNavigator();

export default function PublicStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: {
          ...typography.title,
          color: colors.textPrimary,
        },
        headerTintColor: colors.accent,
        headerTitleAlign: 'left',
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.paper,
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
              <Ionicons
                name="lock-closed-outline"
                size={15}
                color={colors.accent}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 40,
    minWidth: 44,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.accent,
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
