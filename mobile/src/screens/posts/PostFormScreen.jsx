import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { postsService } from '../../services/postsService';
import { colors, spacing, typography } from '../../theme/tokens';

// Reutilizável para criação E edição: route.params?.id presente = modo edição.
export default function PostFormScreen({ route, navigation }) {
  const id = route.params?.id;
  const isEditMode = id !== undefined && id !== null;
  const { user } = useAuth();

  const [loadingPost, setLoadingPost] = useState(isEditMode);
  const [loadError, setLoadError] = useState(null);
  const [loadKey, setLoadKey] = useState(0);
  const [postAuthor, setPostAuthor] = useState(user.name);
  const [submitError, setSubmitError] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { title: '', content: '' } });

  // Modo edição: busca dados atuais do post e popula o formulário via reset().
  // Modo criação: nenhuma chamada de rede, formulário renderiza vazio imediatamente.
  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    setLoadingPost(true);
    setLoadError(null);
    postsService.getById(id)
      .then((data) => {
        if (cancelled) return;
        setPostAuthor(data.author ?? user.name);
        reset({ title: data.title ?? '', content: data.content ?? '' });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err?.response?.status === 404 ? 'notFound' : 'requestFailed');
      })
      .finally(() => {
        if (!cancelled) setLoadingPost(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEditMode, loadKey, reset, user.name]);

  function onSubmit(data) {
    setSubmitError(null);
    // Edição preserva autoria original; criação atribui autoria ao professor autenticado.
    const payload = { title: data.title, content: data.content, author: postAuthor };
    const request = isEditMode ? postsService.update(id, payload) : postsService.create(payload);
    return request
      .then(() => {
        navigation.goBack();
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status >= 400 && status < 500) {
          setSubmitError('Dados inválidos. Verifique os campos e tente novamente.');
        } else {
          setSubmitError('Não foi possível salvar o post. Verifique sua conexão e tente novamente.');
        }
      });
  }

  if (loadingPost) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} accessibilityLabel="Carregando post" />
      </View>
    );
  }

  if (loadError) {
    const notFound = loadError === 'notFound';
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {notFound
            ? 'Este post não existe mais.'
            : 'Não foi possível carregar o post. Verifique sua conexão e tente novamente.'}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
          onPress={notFound ? navigation.goBack : () => setLoadKey((key) => key + 1)}
          accessibilityRole="button"
          accessibilityLabel={notFound ? 'Voltar para a lista de posts' : 'Tentar carregar o post novamente'}
        >
          <Text style={styles.buttonText}>{notFound ? 'Voltar' : 'Tentar novamente'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Título</Text>
      <Controller
        control={control}
        name="title"
        rules={{ required: 'Título obrigatório' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Digite o título do post"
            placeholderTextColor={colors.textMuted}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            accessibilityLabel="Título"
          />
        )}
      />
      {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}

      <Text style={[styles.label, styles.fieldSpacing]}>Conteúdo</Text>
      <Controller
        control={control}
        name="content"
        rules={{ required: 'Conteúdo obrigatório' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Digite o conteúdo do post"
            placeholderTextColor={colors.textMuted}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            multiline
            accessibilityLabel="Conteúdo"
          />
        )}
      />
      {errors.content && <Text style={styles.errorText}>{errors.content.message}</Text>}

      <Text style={[styles.label, styles.fieldSpacing]}>Autor</Text>
      <Text style={styles.readonlyValue}>{postAuthor}</Text>

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
          ? 'Salvando post'
          : isEditMode ? 'Salvar alterações' : 'Publicar post'}
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.onAccent} accessibilityLabel="Salvando post" />
        ) : (
          <Text style={styles.buttonText}>{isEditMode ? 'Salvar alterações' : 'Publicar post'}</Text>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
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
  multilineInput: {
    minHeight: 120,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  readonlyValue: {
    ...typography.body,
    color: colors.textMuted,
  },
  errorText: {
    ...typography.label,
    color: colors.destructive,
    marginTop: spacing.sm,
  },
  submitError: {
    marginTop: spacing.xl,
  },
  retryButton: {
    marginTop: spacing.lg,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
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
