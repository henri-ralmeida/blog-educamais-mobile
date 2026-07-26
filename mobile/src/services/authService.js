import client from './api/client';

export const authService = {
  // POST /auth/login: 200 com { token, professor } (nunca senha); 401 genérico para
  // email inexistente ou senha errada.
  login: (email, senha) => client.post('/auth/login', { email, senha }).then((res) => res.data),

  // GET /auth/session: valida assinatura, expiração, existência do professor e
  // revogação por troca de senha antes de restaurar a sessão persistida.
  validateSession: () => client.get('/auth/session').then((res) => res.data),
};
