// Reutilizável para criar e editar aluno. Espelha ProfessorFormScreen,
// mas sem nenhum campo de credencial — Aluno não tem senha no model do backend.
// Diferente de PostFormScreen: não existe GET /alunos/:id no backend real — dados de
// edição vêm de route.params (objeto completo já carregado na lista), nunca de uma nova
// chamada de rede. Por isso não há loadingItem/loadError aqui.
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, Pressable } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import FieldError from '../../components/FieldError';
import { alunosService } from '../../services/alunosService';
import { describeRequestError } from '../../utils/requestError';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { emailRule, nomeRule } from '../../utils/validators';

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
    const payload = { nome: data.nome.trim(), email: data.email.trim() };
    const request = isEditMode
      ? alunosService.update(id, payload)
      : alunosService.create(payload);
    return request
      .then(() => {
        navigation.goBack();
      })
      .catch((err) => {
        // A faixa 4xx generica apagava o 409 de email ja cadastrado e o 404 de
        // registro removido enquanto a tela estava aberta.
        setSubmitError(describeRequestError(err).message);
      });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Nome</Text>
      <Controller
        control={control}
        name="nome"
        rules={nomeRule}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Digite o nome do aluno"
            placeholderTextColor={colors.textMuted}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            accessibilityLabel="Nome"
          />
        )}
      />
      <FieldError>{errors.nome?.message}</FieldError>

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
      <FieldError>{errors.email?.message}</FieldError>

      <FieldError style={styles.submitError}>{submitError}</FieldError>

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
          ? 'Salvando aluno'
          : isEditMode ? 'Salvar alterações' : 'Cadastrar aluno'}
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.onAccent} accessibilityLabel="Salvando aluno" />
        ) : (
          <Text style={styles.buttonText}>
            {isEditMode ? 'Salvar alterações' : 'Cadastrar aluno'}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    padding: spacing.lg,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  label: {
    ...typography.label,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  fieldSpacing: {
    marginTop: spacing.lg,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 46,
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
    flexDirection: 'row',
    marginTop: spacing.xl,
    minHeight: 46,
    borderRadius: radii.md,
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
