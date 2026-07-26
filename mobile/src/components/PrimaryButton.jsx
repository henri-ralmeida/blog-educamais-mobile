import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme/tokens';

// Botão de ação principal reutilizado pelas telas. Antes cada tela redefinia o
// mesmo Pressable com estilos ligeiramente diferentes, e a ação primária de
// algumas telas era só um ícone "+" na barra de navegação.
export default function PrimaryButton({
  label,
  onPress,
  icon,
  loading = false,
  disabled = false,
  variant = 'solid',
  accessibilityLabel,
  style,
}) {
  const inativo = disabled || loading;
  const contorno = variant === 'outline';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        contorno ? styles.outline : styles.solid,
        inativo && styles.disabled,
        pressed && !inativo && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inativo, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={contorno ? colors.accent : colors.onAccent} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={contorno ? colors.accent : colors.onAccent}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          ) : null}
          <Text style={[styles.label, contorno ? styles.labelOutline : styles.labelSolid]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  solid: {
    backgroundColor: colors.accent,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.82,
  },
  label: {
    ...typography.button,
  },
  labelSolid: {
    color: colors.onAccent,
  },
  labelOutline: {
    color: colors.accent,
  },
});
