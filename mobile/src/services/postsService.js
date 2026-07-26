import client from './api/client';
import { ContractError } from '../utils/requestError';

// Validação de forma na fronteira do serviço: um 200 com corpo que não é lista
// (portal cativo devolvendo HTML, EXPO_PUBLIC_API_URL na porta errada) chegava
// direto na FlatList e derrubava a tela no ErrorBoundary, sem retorno possível.
function ensureList(data) {
  if (!Array.isArray(data)) {
    throw new ContractError('Resposta de lista de posts não é um array');
  }
  return data;
}

function ensurePost(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ContractError('Resposta de post não é um objeto');
  }
  return data;
}

export const postsService = {
  list: () => client.get('/posts').then((res) => ensureList(res.data)),

  // ATENÇÃO: query param é "term", confirmado em post.controller.js do backend real.
  // Backend responde 400 se "term" estiver ausente/vazio — cai para list() antes de chamar.
  // O termo chega já normalizado da tela; a normalização vive só em um lugar.
  search: (term) => {
    if (!term) return postsService.list();
    return client
      .get('/posts/search', { params: { term } })
      .then((res) => ensureList(res.data));
  },

  getById: (id) => client.get(`/posts/${id}`).then((res) => ensurePost(res.data)),

  // DELETE /posts/:id retorna 204 sem corpo em sucesso — res.data será undefined,
  // o que é esperado e não deve ser tratado como erro (confirmado em post.routes.js).
  remove: (id) => client.delete(`/posts/${id}`).then((res) => res.data),

  // POST /posts — cria post, body { title, content, author } completo.
  create: (data) => client.post('/posts', data).then((res) => ensurePost(res.data)),

  // PUT /posts/:id — atualiza post, esta tela sempre envia os 3 campos completos
  // (nunca PATCH parcial).
  update: (id, data) => client.put(`/posts/${id}`, data).then((res) => ensurePost(res.data)),
};
