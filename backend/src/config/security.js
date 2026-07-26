// Custo do bcrypt configurável por ambiente: era literal 10 sem override, o que
// impede elevar o custo conforme o hardware evolui sem alterar código.
const DEFAULT_SALT_ROUNDS = 10;
const MIN_SALT_ROUNDS = 10;
const MAX_SALT_ROUNDS = 15;

const MIN_SENHA_CARACTERES = 6;
const MAX_SENHA_BYTES = 72; // limite do próprio bcrypt

function resolveSaltRounds(env = process.env) {
  const raw = env.BCRYPT_SALT_ROUNDS;
  if (raw === undefined || String(raw).trim() === "") return DEFAULT_SALT_ROUNDS;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < MIN_SALT_ROUNDS || parsed > MAX_SALT_ROUNDS) {
    throw new Error(
      `BCRYPT_SALT_ROUNDS deve ser um inteiro entre ${MIN_SALT_ROUNDS} e ${MAX_SALT_ROUNDS}`,
    );
  }
  return parsed;
}

const BCRYPT_SALT_ROUNDS = resolveSaltRounds();

module.exports = {
  BCRYPT_SALT_ROUNDS,
  MIN_SENHA_CARACTERES,
  MAX_SENHA_BYTES,
};
