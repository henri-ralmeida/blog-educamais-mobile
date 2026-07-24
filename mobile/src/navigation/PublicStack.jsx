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
        headerTitleStyle: typography.display,
        headerTintColor: colors.textPrimary,
      }}
    >
      <Stack.Screen
        name="PostList"
        component={PostListScreen}
        options={({ navigation }) => ({
          title: 'Posts',
          headerRight: () => (
            <Pressable
              style={({ pressed }) => [styles.loginButton, pressed && styles.buttonPressed]}
              onPress={() => navigation.navigate('Login')}
              accessibilityRole="button"
              accessibilityLabel="Entrar na área do professor"
              hitSlop={spacing.sm}
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
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  loginButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
