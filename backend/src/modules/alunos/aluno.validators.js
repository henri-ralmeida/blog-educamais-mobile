const { z } = require("zod");

const createAlunoSchema = z.object({
  nome: z.string().min(1, "nome is required"),
  email: z.email("email inválido"),
});

const updateAlunoSchema = z.object({
  nome: z.string().min(1).optional(),
  email: z.email().optional(),
});

module.exports = { createAlunoSchema, updateAlunoSchema };
