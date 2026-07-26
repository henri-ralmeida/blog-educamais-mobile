const authService = require("./auth.service");

const INVALID_CREDENTIALS_MESSAGE = "Email ou senha inválidos";

function logLoginFailure(error) {
  console.error("[auth.login] Falha não esperada durante autenticação", {
    name: typeof error?.name === "string" ? error.name : "UnknownError",
    code: typeof error?.code === "string" ? error.code : "UNKNOWN",
  });
}

async function login(req, res) {
  try {
    const session = await authService.login(req.body.email, req.body.senha);

    if (!session) {
      return res.status(401).json({ message: INVALID_CREDENTIALS_MESSAGE });
    }

    return res.status(200).json(session);
  } catch (error) {
    logLoginFailure(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function session(req, res) {
  return res.status(200).json({ professor: req.auth.professor });
}

module.exports = { login, session };
