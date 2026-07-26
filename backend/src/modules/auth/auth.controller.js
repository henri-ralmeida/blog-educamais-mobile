const authService = require("./auth.service");

const INVALID_CREDENTIALS_MESSAGE = "Email ou senha inválidos";

async function login(req, res) {
  try {
    const session = await authService.login(req.body.email, req.body.senha);

    if (!session) {
      return res.status(401).json({ message: INVALID_CREDENTIALS_MESSAGE });
    }

    return res.status(200).json(session);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { login };
