import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import PublicStack from './src/navigation/PublicStack';
import ErrorBoundary from './src/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <PublicStack />
        <StatusBar style="auto" />
      </NavigationContainer>
    </ErrorBoundary>
  );
}
