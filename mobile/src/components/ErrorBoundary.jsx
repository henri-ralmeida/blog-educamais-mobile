import { Component } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // Sem componentDidCatch o erro de render era engolido por completo: nem stack,
  // nem componentStack, nem indício de qual tela quebrou.
  componentDidCatch(error, info) {
    if (__DEV__) {
      console.error('[ErrorBoundary]', error?.message ?? error, info?.componentStack ?? '');
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          <Text style={styles.text}>
            Algo deu errado ao montar esta tela. Tente carregar novamente.
          </Text>
          {/* "Reinicie o aplicativo" não é acionável na web; o reset devolve o
              usuário ao fluxo sem depender de fechar o navegador. */}
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={this.handleReset}
            accessibilityRole="button"
            accessibilityLabel="Tentar carregar a tela novamente"
          >
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing['3xl'],
  },
  text: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 10,
  },
  buttonText: {
    ...typography.button,
    color: colors.onAccent,
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
