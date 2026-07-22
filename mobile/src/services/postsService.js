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
};
