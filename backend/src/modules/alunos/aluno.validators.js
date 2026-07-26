const { z } = require("zod");

function nomeObrigatorio() {
  return z
    .string()
    .min(1, "nome is required")
    .refine((nome) => nome.trim().length > 0, "nome não pode conter apenas espaços");
}

const createAlunoSchema = z.object({
  nome: nomeObrigatorio(),
  email: z.email("email inválido"),
});

const updateAlunoSchema = z.object({
  nome: nomeObrigatorio().optional(),
  email: z.email().optional(),
});

module.exports = { createAlunoSchema, updateAlunoSchema };
