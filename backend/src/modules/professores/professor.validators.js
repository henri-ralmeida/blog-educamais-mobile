const { z } = require("zod");

const MIN_SENHA_CARACTERES = 6;
const MAX_SENHA_BYTES = 72;

function validarSenhaLiteral(senha, contexto, permitirVazia = false) {
  if (permitirVazia && senha === "") return;

  if (/^\s+$/u.test(senha)) {
    contexto.addIssue({
      code: "custom",
      message: "senha não pode conter apenas espaços",
    });
    return;
  }

  if ([...senha].length < MIN_SENHA_CARACTERES) {
    contexto.addIssue({
      code: "too_small",
      minimum: MIN_SENHA_CARACTERES,
      origin: "string",
      inclusive: true,
      message: `senha deve ter ao menos ${MIN_SENHA_CARACTERES} caracteres`,
    });
  }

  if (Buffer.byteLength(senha, "utf8") > MAX_SENHA_BYTES) {
    contexto.addIssue({
      code: "too_big",
      maximum: MAX_SENHA_BYTES,
      origin: "string",
      inclusive: true,
      message: `senha deve ter no máximo ${MAX_SENHA_BYTES} bytes em UTF-8`,
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
