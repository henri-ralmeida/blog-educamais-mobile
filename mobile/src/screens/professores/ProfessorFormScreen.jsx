// Reutilizável para criar e editar professor. Diferente de
// PostFormScreen: não existe GET /professores/:id no
// backend real — dados de edição vêm de route.params (objeto completo já carregado na
// lista), nunca de uma nova chamada de rede. Por isso não há loadingItem/loadError aqui.
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, Pressable } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { professoresService } from '../../services/professoresService';
import { colors, spacing, typography } from '../../theme/tokens';
import { emailRule } from '../../utils/validators';

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
    // Na edição, somente a string realmente vazia mantém a senha atual. Qualquer senha
    // válida segue no payload sem trim nem outra normalização.
    const payload = { nome: data.nome, email: data.email };
    if (!isEditMode || data.senha !== '') {
      payload.senha = data.senha;
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
            accessibilityLabel="Nome"
          />
        )}
      />
      {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}

      <Text style={[styles.label, styles.fieldSpacing]}>Email</Text>
      <Controller
        control={control}
        name="email"
        rules={emailRule}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Digite o email"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            accessibilityLabel="Email"
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
                validate: {
                  notBlank: (v) =>
                    v === '' || !/^\s+$/u.test(v) || 'Senha não pode conter apenas espaços',
                  minLength: (v) =>
                    v === '' || v.length >= 6 || 'Senha deve ter ao menos 6 caracteres',
                },
              }
            : {
                required: 'Senha obrigatória',
                validate: {
                  notBlank: (v) =>
                    !/^\s+$/u.test(v) || 'Senha não pode conter apenas espaços',
                  minLength: (v) =>
                    v.length >= 6 || 'Senha deve ter ao menos 6 caracteres',
                },
              }
        }
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder={
              isEditMode ? 'Deixe em branco para manter a senha atual' : 'Digite uma senha'
            }
            placeholderTextColor={colors.textMuted}
            autoComplete="new-password"
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            accessibilityLabel="Senha"
          />
        )}
      />
      {errors.senha && <Text style={styles.errorText}>{errors.senha.message}</Text>}

      {submitError && <Text style={[styles.errorText, styles.submitError]}>{submitError}</Text>}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          isSubmitting && styles.buttonDisabled,
          pressed && !isSubmitting && styles.buttonPressed,
        ]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel={isSubmitting
          ? 'Salvando professor'
          : isEditMode ? 'Salvar alterações' : 'Cadastrar professor'}
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.onAccent} accessibilityLabel="Salvando professor" />
        ) : (
          <Text style={styles.buttonText}>
            {isEditMode ? 'Salvar alterações' : 'Cadastrar professor'}
          </Text>
        )}
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
  buttonPressed: {
    opacity: 0.72,
  },
  buttonText: {
    ...typography.button,
    color: colors.onAccent,
  },
});
