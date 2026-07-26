import client from './api/client';

export const professoresService = {
  // GET /professores?page=&limit= -> {data,total,page,limit} — protegido por
  // requireTeacher (diferente de posts, GET de professor SEMPRE exige Authorization: Bearer <token>).
  list: ({ page = 1, limit = 10 } = {}) =>
    client.get('/professores', { params: { page, limit } }).then((res) => res.data),

  // ATENÇÃO: GET /professores/:id NÃO existe no backend real (confirmado em
  // professor.routes.js — só há GET "/", POST "/", PUT "/:id", DELETE "/:id"). Não criar
  // nem chamar esse método — o dado de edição vem do item
  // já carregado na lista, passado via route.params.

  create: (data) => client.post('/professores', data).then((res) => res.data),
  update: (id, data) => client.put(`/professores/${id}`, data).then((res) => res.data),
  remove: (id) => client.delete(`/professores/${id}`).then((res) => res.data),
};
