import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PostDetailScreen from '../screens/posts/PostDetailScreen';
import PostListScreen from '../screens/posts/PostListScreen';

const Stack = createNativeStackNavigator();

export default function PublicStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PostList"
        component={PostListScreen}
        options={{ title: 'Posts' }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Post' }}
      />
    </Stack.Navigator>
  );
}
