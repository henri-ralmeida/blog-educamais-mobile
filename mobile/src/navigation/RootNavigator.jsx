import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/tokens';
import PublicStack from './PublicStack';
import AdminStack from './AdminStack';

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Nunca decidir a stack antes do boot terminar — evita flash da stack errada.
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return isAuthenticated ? <AdminStack /> : <PublicStack />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
