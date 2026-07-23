import client from './api/client';

export const postsService = {
  list: () => client.get('/posts').then((res) => res.data),

  // ATENÇÃO: query param é "term", confirmado em post.controller.js do backend real.
  // Backend responde 400 se "term" estiver ausente/vazio — cai para list() antes de chamar.
  search: (term) => {
    const trimmed = term ? term.trim() : '';
    if (!trimmed) return postsService.list();
    return client.get('/posts/search', { params: { term: trimmed } }).then((res) => res.data);
  },

  getById: (id) => client.get(`/posts/${id}`).then((res) => res.data),

  // DELETE /posts/:id retorna 204 sem corpo em sucesso — res.data será undefined,
  // o que é esperado e não deve ser tratado como erro (confirmado em post.routes.js).
  remove: (id) => client.delete(`/posts/${id}`).then((res) => res.data),

  // POST /posts — cria post, body { title, content, author } completo.
  create: (data) => client.post('/posts', data).then((res) => res.data),

  // PUT /posts/:id — atualiza post, esta tela sempre envia os 3 campos completos
  // (nunca PATCH parcial).
  update: (id, data) => client.put(`/posts/${id}`, data).then((res) => res.data),
};
