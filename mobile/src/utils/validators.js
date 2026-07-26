export const emailRule = {
  required: 'Email obrigatório',
  pattern: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email inválido',
  },
};
