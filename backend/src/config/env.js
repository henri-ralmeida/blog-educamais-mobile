const DEFAULT_JWT_EXPIRES_IN = "8h";
const MAXIMUM_JWT_DURATION_SECONDS = 365 * 24 * 60 * 60;
const JWT_EXPIRES_IN_PATTERN = /^([1-9]\d*)([smhd])$/;
const JWT_DURATION_FACTORS = Object.freeze({
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
});
const MINIMUM_JWT_SECRET_LENGTH = 32;
const ORIGIN_PATTERN = /^(?:https?|exp):\/\/[^/\s]+$/i;

function requireEnvironmentValue(env, name) {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`${name} é obrigatório`);
  }
  return value;
}

function parseJwtExpiresIn(value) {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_JWT_EXPIRES_IN;
  }

  const trimmed = value.trim();
  const match = trimmed.match(JWT_EXPIRES_IN_PATTERN);
  if (!match) {
    throw new Error(
      "JWT_EXPIRES_IN deve ser um número positivo com unidade explícita (s, m, h, d). Exemplos válidos: \"8h\", \"30m\", \"7d\", \"3600s\"."
    );
  }

  const magnitude = Number(match[1]);
  if (!Number.isSafeInteger(magnitude)) {
    throw new Error("JWT_EXPIRES_IN com magnitude muito grande");
  }

  const durationSeconds = magnitude * JWT_DURATION_FACTORS[match[2]];
  if (durationSeconds > MAXIMUM_JWT_DURATION_SECONDS) {
    throw new Error(
      `JWT_EXPIRES_IN não pode exceder ${MAXIMUM_JWT_DURATION_SECONDS} segundos (1 ano).`
    );
  }

  return trimmed;
}

function parseCorsOrigins(value) {
  const origins = value.split(",").map((origin) => origin.trim()).filter(Boolean);

  if (origins.length === 0) {
    throw new Error("CORS_ORIGIN deve conter ao menos uma origem");
  }

  for (const origin of origins) {
    if (origin === "*") {
      throw new Error("CORS_ORIGIN não permite wildcard");
    }
    if (!ORIGIN_PATTERN.test(origin)) {
      throw new Error(`Origem inválida em CORS_ORIGIN: ${origin}`);
    }
  }

  return origins;
}

function loadConfig(env = process.env) {
  const jwtSecret = requireEnvironmentValue(env, "JWT_SECRET");
  if (jwtSecret.length < MINIMUM_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET deve ter ao menos ${MINIMUM_JWT_SECRET_LENGTH} caracteres`);
  }

  const rateLimitSecret = requireEnvironmentValue(env, "RATE_LIMIT_SECRET");
  if (rateLimitSecret.length < MINIMUM_JWT_SECRET_LENGTH) {
    throw new Error(`RATE_LIMIT_SECRET deve ter ao menos ${MINIMUM_JWT_SECRET_LENGTH} caracteres`);
  }

  const corsOrigin = requireEnvironmentValue(env, "CORS_ORIGIN");

  return Object.freeze({
    nodeEnv: env.NODE_ENV?.trim() || "development",
    jwtSecret,
    rateLimitSecret,
    jwtExpiresIn: parseJwtExpiresIn(env.JWT_EXPIRES_IN),
    corsOrigins: Object.freeze(parseCorsOrigins(corsOrigin)),
  });
}

let config;

function getConfig() {
  if (!config) config = loadConfig();
  return config;
}

// Somente getConfig é consumido pela aplicação; os demais símbolos existem
// apenas como detalhe interno deste módulo.
module.exports = { getConfig };
