// Reutilizável para criar e editar aluno. Espelha ProfessorFormScreen,
// mas sem nenhum campo de credencial — Aluno não tem senha no model do backend.
// Diferente de PostFormScreen: não existe GET /alunos/:id no backend real — dados de
// edição vêm de route.params (objeto completo já carregado na lista), nunca de uma nova
// chamada de rede. Por isso não há loadingItem/loadError aqui.
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { alunosService } from '../../services/alunosService';
import { colors, spacing, typography } from '../../theme/tokens';

export default function AlunoFormScreen({ route, navigation }) {
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
    },
  });

  function onSubmit(data) {
    setSubmitError(null);
    // Payload sempre completo — nunca PUT parcial.
    const payload = { nome: data.nome, email: data.email };
    const request = isEditMode
      ? alunosService.update(id, payload)
      : alunosService.create(payload);
    return request
      .then(() => {
        navigation.goBack();
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status >= 400 && status < 500) {
          setSubmitError('Dados inválidos. Verifique os campos e tente novamente.');
        } else {
          setSubmitError('Não foi possível salvar o aluno. Verifique sua conexão e tente novamente.');
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
            placeholder="Digite o nome do aluno"
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

      {submitError && <Text style={[styles.errorText, styles.submitError]}>{submitError}</Text>}

      <Pressable
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isEditMode ? 'Salvar alterações' : 'Cadastrar aluno'}
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
