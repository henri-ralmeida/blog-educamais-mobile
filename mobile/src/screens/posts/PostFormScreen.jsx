import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import FieldError from '../../components/FieldError';
import { useAuth } from '../../contexts/AuthContext';
import { postsService } from '../../services/postsService';
import { describeRequestError } from '../../utils/requestError';
import { colors, radii, spacing, typography } from '../../theme/tokens';

function validarTextoObrigatorio(rotulo) {
  return (valor) => (
    typeof valor === 'string' && valor.trim().length > 0
  ) || `${rotulo} não pode conter apenas espaços`;
}

// Reutilizável para criação E edição: route.params?.id presente = modo edição.
export default function PostFormScreen({ route, navigation }) {
  const id = route.params?.id;
  const isEditMode = id !== undefined && id !== null;
  const { user } = useAuth();
  // user.nome era desreferenciado sem guarda; hoje só não quebra porque o
  // RootNavigator troca a árvore inteira ao deslogar.
  const nomeProfessor = user?.nome ?? '';

  const [loadingPost, setLoadingPost] = useState(isEditMode);
  const [loadError, setLoadError] = useState(null);
  const [loadKey, setLoadKey] = useState(0);
  const [submitError, setSubmitError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { title: '', content: '', author: nomeProfessor },
  });

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
        reset({
          title: data.title ?? '',
          content: data.content ?? '',
          // Na edição o backend não altera a autoria: mostrar o nome da sessão
          // fazia a tela mentir sobre quem consta como autor do post.
          author: data.author ?? '',
        });
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
  }, [id, isEditMode, loadKey, reset]);

  function onSubmit(data) {
    setSubmitError(null);
    // A autoria é sempre definida pelo backend a partir do JWT; enviar "author"
    // era campo morto no update e exigência inútil no create.
    const payload = { title: data.title, content: data.content };
    const request = isEditMode ? postsService.update(id, payload) : postsService.create(payload);
    return request
      .then(() => {
        navigation.goBack();
      })
      .catch((err) => {
        // A faixa 4xx genérica engolia 401/403 (sessão revogada) e 404 (post
        // removido), mandando o usuário revisar campos que estavam corretos.
        if (isMountedRef.current) setSubmitError(describeRequestError(err).message);
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
        rules={{
          required: 'Título obrigatório',
          validate: validarTextoObrigatorio('Título'),
        }}
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
      <FieldError>{errors.title?.message}</FieldError>

      <Text style={[styles.label, styles.fieldSpacing]}>Conteúdo</Text>
      <Controller
        control={control}
        name="content"
        rules={{
          required: 'Conteúdo obrigatório',
          validate: validarTextoObrigatorio('Conteúdo'),
        }}
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
      <FieldError>{errors.content?.message}</FieldError>

      <Text style={[styles.label, styles.fieldSpacing]}>Autor</Text>
      <Controller
        control={control}
        name="author"
        rules={{
          required: 'Autor obrigatório',
          validate: validarTextoObrigatorio('Autor'),
        }}
        render={({ field: { value } }) => (
          <TextInput
            style={[styles.input, styles.readonlyValue]}
            value={value}
            editable={false}
            accessibilityLabel="Autor"
            accessibilityHint="Autoria vinculada ao professor autenticado"
          />
        )}
      />
      <FieldError>{errors.author?.message}</FieldError>

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
    backgroundColor: colors.paper,
  },
  content: {
    padding: spacing.lg,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
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
  multilineInput: {
    minHeight: 120,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  readonlyValue: {
    ...typography.body,
    backgroundColor: colors.surface,
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
