import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import PublicStack from './src/navigation/PublicStack';

export default function App() {
  return (
    <NavigationContainer>
      <PublicStack />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
