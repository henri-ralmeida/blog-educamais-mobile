import client from './api/client';

export const authService = {
  // POST /auth/login: 200 com { token, professor } (nunca senha); 401 genérico para
  // email inexistente ou senha errada.
  login: (email, senha) => client.post('/auth/login', { email, senha }).then((res) => res.data),
};
