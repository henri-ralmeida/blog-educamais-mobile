const { z } = require("zod");

const loginSchema = z.object({
  email: z.email("email inválido"),
  senha: z
    .string()
    .min(1, "senha is required")
    .refine((senha) => !/^\s+$/u.test(senha), "senha não pode conter apenas espaços"),
});

module.exports = { loginSchema };
