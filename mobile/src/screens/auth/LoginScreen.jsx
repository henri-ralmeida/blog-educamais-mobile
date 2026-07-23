// Login desta etapa: coleta apenas o nome do professor, sem senha real
// verificada contra o backend — o backend atual só checa o header estático
// `x-user-type: teacher`. o endpoint de login real chega depois, e a tela
// passa a chamá-lo então. Nenhuma verificação de senha/token é
// simulada aqui.
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography } from '../../theme/tokens';

export default function LoginScreen() {
  const { login } = useAuth();
  const [loginError, setLoginError] = useState(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: '' } });

  async function onSubmit(data) {
    setLoginError(null);
    try {
      await login(data.name);
    } catch {
      setLoginError('Não foi possível entrar. Tente novamente.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nome do professor</Text>
      <Controller
        control={control}
        name="name"
        rules={{
          required: 'Nome obrigatório',
          validate: (v) => v.trim().length > 0 || 'Nome obrigatório',
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Digite seu nome"
            placeholderTextColor={colors.textMuted}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
      {loginError && <Text style={styles.errorText}>{loginError}</Text>}

      <Pressable
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
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
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
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
