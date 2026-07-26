const { z } = require("zod");

function textoObrigatorio(campo) {
  return z
    .string()
    .min(1, `${campo} is required`)
    .refine((valor) => valor.trim().length > 0, `${campo} não pode conter apenas espaços`);
}

const createPostSchema = z.object({
  title: textoObrigatorio("title"),
  content: textoObrigatorio("content"),
  author: textoObrigatorio("author"),
});

const updatePostSchema = z.object({
  title: textoObrigatorio("title"),
  content: textoObrigatorio("content"),
});

module.exports = { createPostSchema, updatePostSchema };

