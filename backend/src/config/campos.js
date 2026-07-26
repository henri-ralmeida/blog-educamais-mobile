const { z } = require("zod");

// Normalização de email vivia replicada em seis pontos de cinco arquivos
// (services, seed, auth), com variação entre eles. Agora acontece uma única vez,
// na fronteira de validação, e os services recebem o valor já normalizado.
function emailNormalizado(mensagem = "email inválido") {
  return z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email(mensagem));
}

function nomeObrigatorio() {
  return z
    .string()
    .min(1, "nome é obrigatório")
    .refine((nome) => nome.trim().length > 0, "nome não pode conter apenas espaços");
}

module.exports = { emailNormalizado, nomeObrigatorio };
