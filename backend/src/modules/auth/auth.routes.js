const express = require("express");
const controller = require("./auth.controller");
const { loginSchema } = require("./auth.validators");

const router = express.Router();

// Middleware genérico de validação com Zod (mesmo padrão de professor.routes.js)
function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation error",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }
    req.body = parsed.data; // body sanitizado
    return next();
  };
}

// Login do professor é público: credenciais válidas emitem o Bearer JWT da sessão.
router.post("/login", validateBody(loginSchema), controller.login);

module.exports = router;
