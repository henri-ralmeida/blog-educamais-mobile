// Reutilizável para criar e editar professor. Diferente de
// PostFormScreen: não existe GET /professores/:id no
// backend real — dados de edição vêm de route.params (objeto completo já carregado na
// lista), nunca de uma nova chamada de rede. Por isso não há loadingItem/loadError aqui.
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { professoresService } from '../../services/professoresService';
import { colors, spacing, typography } from '../../theme/tokens';

export default function ProfessorFormScreen({ route, navigation }) {
  const id = route.params?.id;
  const isEditMode = id !== undefined && id !== null;

  const [submitError, setSubmitError] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nome: route.params?.nome ?? '',
      email: route.params?.email ?? '',
      senha: '',
    },
  });

  function onSubmit(data) {
    setSubmitError(null);
    // Payload nunca envia senha vazia — o schema de update rejeita string
    // vazia por min(6), e uma PUT com senha vazia poderia sinalizar troca não intencional.
    const payload = { nome: data.nome, email: data.email };
    const trimmedSenha = data.senha ? data.senha.trim() : '';
    if (trimmedSenha) {
      payload.senha = trimmedSenha;
    }
    const request = isEditMode
      ? professoresService.update(id, payload)
      : professoresService.create(payload);
    return request
      .then(() => {
        navigation.goBack();
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status >= 400 && status < 500) {
          setSubmitError('Dados inválidos. Verifique os campos e tente novamente.');
        } else {
          setSubmitError('Não foi possível salvar o professor. Verifique sua conexão e tente novamente.');
        }
      });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Nome</Text>
      <Controller
        control={control}
        name="nome"
        rules={{ required: 'Nome obrigatório' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Digite o nome do professor"
            placeholderTextColor={colors.textMuted}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}

      <Text style={[styles.label, styles.fieldSpacing]}>Email</Text>
      <Controller
        control={control}
        name="email"
        rules={{
          required: 'Email obrigatório',
          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Digite o email"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

      <Text style={[styles.label, styles.fieldSpacing]}>Senha</Text>
      <Controller
        control={control}
        name="senha"
        rules={
          isEditMode
            ? {
                validate: (v) =>
                  !v || v.length >= 6 || 'Senha deve ter ao menos 6 caracteres',
              }
            : {
                required: 'Senha obrigatória',
                minLength: { value: 6, message: 'Senha deve ter ao menos 6 caracteres' },
              }
        }
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder={
              isEditMode ? 'Deixe em branco para manter a senha atual' : 'Digite uma senha'
            }
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.senha && <Text style={styles.errorText}>{errors.senha.message}</Text>}

      {submitError && <Text style={[styles.errorText, styles.submitError]}>{submitError}</Text>}

      <Pressable
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isEditMode ? 'Salvar alterações' : 'Cadastrar professor'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
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
  submitError: {
    marginTop: spacing.xl,
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
