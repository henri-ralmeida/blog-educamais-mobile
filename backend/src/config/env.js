const DEFAULT_JWT_EXPIRES_IN = "8h";
const MINIMUM_JWT_SECRET_LENGTH = 32;
const ORIGIN_PATTERN = /^(?:https?|exp):\/\/[^/\s]+$/i;

function requireEnvironmentValue(env, name) {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`${name} é obrigatório`);
  }
  return value;
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

  const corsOrigin = requireEnvironmentValue(env, "CORS_ORIGIN");

  return Object.freeze({
    nodeEnv: env.NODE_ENV?.trim() || "development",
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN?.trim() || DEFAULT_JWT_EXPIRES_IN,
    corsOrigins: Object.freeze(parseCorsOrigins(corsOrigin)),
  });
}

let config;

function getConfig() {
  if (!config) config = loadConfig();
  return config;
}

module.exports = {
  DEFAULT_JWT_EXPIRES_IN,
  MINIMUM_JWT_SECRET_LENGTH,
  getConfig,
  loadConfig,
};
