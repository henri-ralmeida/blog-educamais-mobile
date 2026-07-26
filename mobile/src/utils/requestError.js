// Classificação única de erro de requisição para todas as telas.
// Antes cada tela inferia "sem conexão" de qualquer falha, o que mostrava
// mensagem de rede para 500, timeout e resposta fora de contrato.

export const ERROR_KIND = {
  contract: 'contract',
  timeout: 'timeout',
  network: 'network',
  session: 'session',
  notFound: 'notFound',
  conflict: 'conflict',
  validation: 'validation',
  server: 'server',
  unknown: 'unknown',
};

export class ContractError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ContractError';
    this.isContractError = true;
  }
}

function serverMessage(error) {
  const data = error?.response?.data;
  if (!data || typeof data !== 'object') return null;
  const raw = data.message ?? data.error;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

export function describeRequestError(error, { fallback } = {}) {
  if (__DEV__) {
    // Sem o log o erro real ficava invisível: o usuário via "verifique sua conexão"
    // e o desenvolvedor não tinha rastro nenhum do status ou do código.
    console.warn('[requestError]', error?.code ?? '', error?.response?.status ?? '', error?.message ?? '');
  }

  if (error?.isContractError) {
    return {
      kind: ERROR_KIND.contract,
      message: 'O servidor respondeu em um formato inesperado. Confira o endereço da API e tente novamente.',
    };
  }

  const status = typeof error?.response?.status === 'number' ? error.response.status : null;

  if (status === null) {
    if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
      return {
        kind: ERROR_KIND.timeout,
        message: 'O servidor demorou demais para responder. Tente novamente.',
      };
    }
    if (error?.request) {
      return {
        kind: ERROR_KIND.network,
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      };
    }
    return {
      kind: ERROR_KIND.unknown,
      message: fallback ?? 'Não foi possível concluir a operação. Tente novamente.',
    };
  }

  if (status === 401 || status === 403) {
    return {
      kind: ERROR_KIND.session,
      message: 'Sua sessão expirou. Entre novamente para continuar.',
    };
  }
  if (status === 404) {
    return {
      kind: ERROR_KIND.notFound,
      message: 'O registro não existe mais. Atualize a lista e tente novamente.',
    };
  }
  if (status === 409) {
    return {
      kind: ERROR_KIND.conflict,
      message: serverMessage(error) ?? 'Este email já está cadastrado.',
    };
  }
  if (status >= 500) {
    return {
      kind: ERROR_KIND.server,
      message: 'O servidor falhou ao processar a requisição. Tente novamente em instantes.',
    };
  }
  if (status >= 400) {
    return {
      kind: ERROR_KIND.validation,
      message: serverMessage(error) ?? 'Dados inválidos. Verifique os campos e tente novamente.',
    };
  }

  return {
    kind: ERROR_KIND.unknown,
    message: fallback ?? 'Não foi possível concluir a operação. Tente novamente.',
  };
}
