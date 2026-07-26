// Login real do professor contra POST /auth/login, substituindo
// o login fake da Fase 2 (só coletava um nome livre, sem verificação de credencial).
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography } from '../../theme/tokens';
import { emailRule, senhaRules } from '../../utils/validators';

function getLoginErrorMessage(error) {
  const status = error?.response?.status;
  if (typeof status === 'number') {
    if (status === 400) return 'Confira os campos informados e tente novamente.';
    if (status === 401) return 'Email ou senha inválidos. Verifique suas credenciais e tente novamente.';
    if (status === 429) return 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
    if (status >= 500) return 'O servidor está indisponível no momento. Tente novamente mais tarde.';
    return 'Não foi possível entrar. Tente novamente.';
  }
  // Só é falha de rede quando a requisição chegou a sair. Erro de domínio
  // (sessão inválida vinda de um 200) caía aqui e mentia "sem conexão",
  // deixando o login impossível sem nenhuma pista do motivo real.
  if (error?.request) return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  return error?.message ?? 'Não foi possível entrar. Tente novamente.';
}

export default function LoginScreen() {
  const { login } = useAuth();
  const [loginError, setLoginError] = useState(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', senha: '' } });

  async function onSubmit(data) {
    setLoginError(null);
    try {
      await login(data.email.trim(), data.senha);
    } catch (err) {
      setLoginError(getLoginErrorMessage(err));
    }
  }

  return (
    // O container tinha `accessible`, o que colapsava o formulário inteiro em um
    // único elemento e tornava os campos e o botão inalcançáveis pelo VoiceOver.
    <View style={styles.container}>
      <Text
        style={styles.heading}
        accessibilityRole="header"
        accessibilityLabel="Acesso restrito: entrada"
      >
        Entrar
      </Text>
      <Text style={styles.label} nativeID="email-label">Email</Text>
      <Controller
        control={control}
        name="email"
        rules={emailRule}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Digite seu email"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            accessibilityLabel="Email"
            accessibilityLabelledBy="email-label"
            onBlur={onBlur}
            onChangeText={(text) => {
              // O erro de login continuava anunciado em live region assertiva
              // enquanto o usuário já estava corrigindo os campos.
              if (loginError) setLoginError(null);
              onChange(text);
            }}
            value={value}
          />
        )}
      />
      {errors.email && (
        <Text
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          {errors.email.message}
        </Text>
      )}

      <Text style={[styles.label, styles.fieldSpacing]} nativeID="senha-label">Senha</Text>
      <Controller
        control={control}
        name="senha"
        rules={senhaRules()}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoComplete="password"
            accessibilityLabel="Senha"
            accessibilityLabelledBy="senha-label"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.senha && (
        <Text
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          {errors.senha.message}
        </Text>
      )}
      {loginError && (
        <Text
          style={[styles.errorText, styles.loginErrorText]}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          {loginError}
        </Text>
      )}

      <Pressable
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Entrar"
        accessibilityState={{ disabled: isSubmitting }}
      >
        <Text style={styles.buttonText}>Entrar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  heading: {
    ...typography.display,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  fieldSpacing: {
    marginTop: spacing.lg,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    color: colors.textPrimary,
  },
  errorText: {
    ...typography.label,
    color: colors.destructive,
    marginTop: spacing.sm,
  },
  loginErrorText: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.xl,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
