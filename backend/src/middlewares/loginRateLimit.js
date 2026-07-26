const { createHmac } = require("crypto");
const { rateLimit } = require("express-rate-limit");

const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_MAX = 10;
const LOGIN_RATE_LIMIT_MESSAGE = Object.freeze({
  message: "Muitas tentativas de login. Tente novamente mais tarde.",
});
const LOGIN_IDENTITY_DOMAIN = "blogeducamais:login-rate-limit:v1\0";

function normalizeLoginIdentity(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function createLoginIdentityKey(email, secret) {
  return createHmac("sha256", secret)
    .update(LOGIN_IDENTITY_DOMAIN)
    .update(normalizeLoginIdentity(email))
    .digest("hex");
}

function createLoginRateLimiters({
  secret,
  windowMs = LOGIN_RATE_LIMIT_WINDOW_MS,
  ipLimit = LOGIN_RATE_LIMIT_MAX,
  identityLimit = LOGIN_RATE_LIMIT_MAX,
} = {}) {
  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error("Segredo do rate limit de login deve ter ao menos 32 caracteres");
  }

  const commonOptions = {
    windowMs,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: LOGIN_RATE_LIMIT_MESSAGE,
  };

  const ipLimiter = rateLimit({
    ...commonOptions,
    limit: ipLimit,
    identifier: "login-por-ip",
    requestPropertyName: "loginRateLimitByIp",
  });

  const identityLimiter = rateLimit({
    ...commonOptions,
    limit: identityLimit,
    identifier: "login-por-identidade",
    requestPropertyName: "loginRateLimitByIdentity",
    keyGenerator: (req) => createLoginIdentityKey(req.body?.email, secret),
  });

  return { ipLimiter, identityLimiter };
}

module.exports = {
  LOGIN_RATE_LIMIT_MAX,
  LOGIN_RATE_LIMIT_MESSAGE,
  LOGIN_RATE_LIMIT_WINDOW_MS,
  createLoginIdentityKey,
  createLoginRateLimiters,
  normalizeLoginIdentity,
};
