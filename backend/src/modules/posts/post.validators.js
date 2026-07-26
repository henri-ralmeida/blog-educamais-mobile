const { z } = require("zod");

function textoObrigatorio(campo) {
  return z
    .string()
    .min(1, `${campo} é obrigatório`)
    .refine((valor) => valor.trim().length > 0, `${campo} não pode conter apenas espaços`);
}

// "author" não entra no schema: a autoria é sempre derivada do professor
// autenticado em post.service.createPost. Exigir o campo no corpo devolvia 400
// para um cliente correto e, quando enviado, era silenciosamente sobrescrito.
const createPostSchema = z.object({
  title: textoObrigatorio("title"),
  content: textoObrigatorio("content"),
});

const updatePostSchema = z.object({
  title: textoObrigatorio("title"),
  content: textoObrigatorio("content"),
});

module.exports = { createPostSchema, updatePostSchema };
