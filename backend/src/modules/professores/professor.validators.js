const { z } = require("zod");

function validarSenhaLiteral(senha, contexto, permitirVazia = false) {
  if (permitirVazia && senha === "") return;

  if (/^\s+$/u.test(senha)) {
    contexto.addIssue({
      code: "custom",
      message: "senha não pode conter apenas espaços",
    });
    return;
  }

  if (senha.length < 6) {
    contexto.addIssue({
      code: "too_small",
      minimum: 6,
      origin: "string",
      inclusive: true,
      message: "senha deve ter ao menos 6 caracteres",
    });
  }
}

const createProfessorSchema = z.object({
  nome: z.string().min(1, "nome is required"),
  email: z.email("email inválido"),
  senha: z
    .string()
    .min(1, "senha is required")
    .superRefine((senha, contexto) => validarSenhaLiteral(senha, contexto)),
});

const updateProfessorSchema = z.object({
  nome: z.string().min(1).optional(),
  email: z.email().optional(),
  senha: z
    .string()
    .superRefine((senha, contexto) => validarSenhaLiteral(senha, contexto, true))
    .optional(),
});

module.exports = { createProfessorSchema, updateProfessorSchema };
