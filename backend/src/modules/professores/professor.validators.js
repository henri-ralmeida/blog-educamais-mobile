const { z } = require("zod");

const createProfessorSchema = z.object({
  nome: z.string().min(1, "nome is required"),
  email: z.email("email inválido"),
  senha: z.string().min(6, "senha deve ter ao menos 6 caracteres"),
});

const updateProfessorSchema = z.object({
  nome: z.string().min(1).optional(),
  email: z.email().optional(),
  senha: z.string().min(6).optional(),
});

module.exports = { createProfessorSchema, updateProfessorSchema };
