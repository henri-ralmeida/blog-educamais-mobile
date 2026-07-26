import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/tokens';

export default function SearchBar({ value, onChangeText, placeholder = 'Buscar por título ou conteúdo...' }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, focused && styles.containerFocused]}>
      <Ionicons name="search" size={20} color={colors.textMuted} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        // Cor do placeholder com contraste WCAG AA (>=4.5:1) contra o fundo branco
        // (textMuted #6B7280 sobre background #FFFFFF ~= 4.83:1). O fundo permanece
        // branco também no foco, evitando a queda de contraste que acontecia quando o
        // fundo mudava para accentSoft (#E8F0FE ~= 4.22:1, abaixo do mínimo).
        placeholderTextColor={colors.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel="Buscar posts por título ou conteúdo"
        accessibilityRole="search"
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  // No foco apenas realça a borda (accent => contraste 5.17:1 sobre branco); o fundo
  // permanece branco para preservar o contraste do placeholder (ver comentário acima).
  containerFocused: {
    borderColor: colors.accent,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
});
