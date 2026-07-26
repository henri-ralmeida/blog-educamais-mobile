// Login real do professor contra POST /auth/login, substituindo
// o login fake da Fase 2 (só coletava um nome livre, sem verificação de credencial).
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography } from '../../theme/tokens';
import { emailRule } from '../../utils/validators';

const MIN_SENHA_CARACTERES = 6;
const MAX_SENHA_BYTES = 72;

function utf8ByteLength(value) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value).length;
  return unescape(encodeURIComponent(value)).length;
}

function getLoginErrorMessage(error) {
  const status = error?.response?.status;
  if (status === 400) return 'Confira os campos informados e tente novamente.';
  if (status === 401) return 'Email ou senha inválidos. Verifique suas credenciais e tente novamente.';
  if (status === 429) return 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
  if (status >= 500) return 'O servidor está indisponível no momento. Tente novamente mais tarde.';
  if (!error?.response) return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  return 'Não foi possível entrar. Tente novamente.';
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
      await login(data.email, data.senha);
    } catch (err) {
      setLoginError(getLoginErrorMessage(err));
    }
  }

  return (
    <View style={styles.container} accessible accessibilityLabel="Tela de login">
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
            onChangeText={onChange}
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
        rules={{
          required: 'Senha obrigatória',
          validate: {
            apenasEspacos: (v) => !/^\s+$/u.test(v) || 'Senha não pode conter apenas espaços',
            minimoCaracteres: (v) =>
              [...v].length >= MIN_SENHA_CARACTERES ||
              `Senha deve ter ao menos ${MIN_SENHA_CARACTERES} caracteres`,
            maximoBytes: (v) =>
              utf8ByteLength(v) <= MAX_SENHA_BYTES ||
              `Senha deve ter no máximo ${MAX_SENHA_BYTES} bytes em UTF-8`,
          },
        }}
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
