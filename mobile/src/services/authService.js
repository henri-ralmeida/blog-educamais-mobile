import client from './api/client';

export const authService = {
  // POST /auth/login: 200 com {id,nome,email,createdAt,updatedAt} (SEM campo senha) em
  // sucesso; 401 com {message:"Email ou senha inválidos"} — mesma mensagem/status para
  // email inexistente OU senha errada (impede enumerar quais emails existem).
  login: (email, senha) => client.post('/auth/login', { email, senha }).then((res) => res.data),
};
