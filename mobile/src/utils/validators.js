// Regras de validação compartilhadas pelos formulários (login, professor, aluno).
// Antes cada tela repetia o regex de email, e só o login validava o limite de
// bytes da senha que o backend impõe — o formulário de professor deixava passar.

export const MIN_SENHA_CARACTERES = 6;
export const MAX_SENHA_BYTES = 72;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function utf8ByteLength(value) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value).length;
  // Fallback sem unescape (global deprecado): soma o tamanho de cada code point.
  let bytes = 0;
  for (const char of value) {
    const codePoint = char.codePointAt(0);
    if (codePoint < 0x80) bytes += 1;
    else if (codePoint < 0x800) bytes += 2;
    else if (codePoint < 0x10000) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}

// O backend normaliza o email com trim antes de gravar e de buscar; validar o
// valor cru rejeitava " professor@example.com " que o servidor aceitaria.
export const emailRule = {
  required: 'Email obrigatório',
  validate: {
    formato: (value) => EMAIL_PATTERN.test((value ?? '').trim()) || 'Email inválido',
  },
};

export const nomeRule = {
  required: 'Nome obrigatório',
  validate: {
    // O backend rejeita nome só com espaços; sem esta regra o formulário
    // mandava mesmo assim e recebia 400 sem erro visível no campo.
    naoApenasEspacos: (value) => (value ?? '').trim().length > 0 || 'Nome não pode conter apenas espaços',
  },
};

// obrigatoria=false no formulário de edição de professor, onde deixar a senha
// em branco significa "manter a senha atual".
export function senhaRules({ obrigatoria = true } = {}) {
  return {
    ...(obrigatoria ? { required: 'Senha obrigatória' } : {}),
    validate: {
      apenasEspacos: (value) => {
        if (!obrigatoria && !value) return true;
        return !/^\s+$/u.test(value ?? '') || 'Senha não pode conter apenas espaços';
      },
      minimoCaracteres: (value) => {
        if (!obrigatoria && !value) return true;
        return [...(value ?? '')].length >= MIN_SENHA_CARACTERES
          || `Senha deve ter ao menos ${MIN_SENHA_CARACTERES} caracteres`;
      },
      maximoBytes: (value) => {
        if (!obrigatoria && !value) return true;
        return utf8ByteLength(value ?? '') <= MAX_SENHA_BYTES
          || `Senha deve ter no máximo ${MAX_SENHA_BYTES} bytes em UTF-8`;
      },
    },
  };
}
