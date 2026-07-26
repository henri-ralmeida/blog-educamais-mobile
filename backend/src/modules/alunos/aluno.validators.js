const { z } = require("zod");
const { emailNormalizado, nomeObrigatorio } = require("../../config/campos");

// .strict(): o schema não-estrito aceitava POST /alunos com "senha" no corpo,
// respondia 201 e descartava a chave em silêncio — o cliente ficava achando que
// tinha cadastrado uma credencial de aluno, que nem existe no modelo.
const createAlunoSchema = z
  .object({
    nome: nomeObrigatorio(),
    email: emailNormalizado(),
  })
  .strict();

const updateAlunoSchema = z
  .object({
    nome: nomeObrigatorio().optional(),
    email: emailNormalizado().optional(),
  })
  .strict();

module.exports = { createAlunoSchema, updateAlunoSchema };
