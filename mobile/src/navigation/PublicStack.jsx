import { Pressable, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PostDetailScreen from '../screens/posts/PostDetailScreen';
import PostListScreen from '../screens/posts/PostListScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import { colors } from '../theme/tokens';

const Stack = createNativeStackNavigator();

export default function PublicStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PostList"
        component={PostListScreen}
        options={({ navigation }) => ({
          title: 'Posts',
          headerRight: () => (
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={{ color: colors.textSecondary }}>Entrar</Text>
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
