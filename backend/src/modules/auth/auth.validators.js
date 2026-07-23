const { z } = require("zod");

const loginSchema = z.object({
  email: z.email("email inválido"),
  senha: z.string().min(1, "senha is required"),
});

module.exports = { loginSchema };
