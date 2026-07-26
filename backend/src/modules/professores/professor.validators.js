const { z } = require("zod");
const { emailNormalizado, nomeObrigatorio } = require("../../config/campos");
const { MIN_SENHA_CARACTERES, MAX_SENHA_BYTES } = require("../../config/security");

function validarSenhaLiteral(senha, contexto) {
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

const createProfessorSchema = z
  .object({
    nome: nomeObrigatorio(),
    email: emailNormalizado(),
    senha: z
      .string()
      .min(1, "senha é obrigatória")
      .superRefine(validarSenhaLiteral),
  })
  .strict();

// Senha vazia era aceita como no-op silencioso, indistinguível de "manter a
// senha atual" por engano. Para manter a senha, o campo deve ser omitido.
const updateProfessorSchema = z
  .object({
    nome: nomeObrigatorio().optional(),
    email: emailNormalizado().optional(),
    senha: z
      .string()
      .min(1, "senha não pode ser vazia; omita o campo para manter a senha atual")
      .superRefine(validarSenhaLiteral)
      .optional(),
  })
  .strict();

module.exports = { createProfessorSchema, updateProfessorSchema };
