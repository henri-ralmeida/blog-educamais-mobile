import client from './api/client';

export const alunosService = {
  // GET /alunos?page=&limit= -> {data,total,page,limit} — protegido por
  // requireTeacher (mesmo padrão de professoresService, GET sempre exige x-user-type: teacher).
  list: ({ page = 1, limit = 10 } = {}) =>
    client.get('/alunos', { params: { page, limit } }).then((res) => res.data),

  // ATENÇÃO: GET /alunos/:id NÃO existe no backend real (confirmado em
  // aluno.routes.js — só há GET "/", POST "/", PUT "/:id", DELETE "/:id"). Não criar
  // nem chamar esse método — o dado de edição vem do
  // item já carregado na lista, passado via route.params.

  create: (data) => client.post('/alunos', data).then((res) => res.data),
  update: (id, data) => client.put(`/alunos/${id}`, data).then((res) => res.data),
  remove: (id) => client.delete(`/alunos/${id}`).then((res) => res.data),
};
