const express = require("express");
const controller = require("./auth.controller");
const { loginSchema } = require("./auth.validators");
const requireTeacher = require("../../middlewares/requireTeacher");

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

// Revalidação remota da sessão antes de RESTORE no mobile: confirma que o token
// ainda está assinado, não expirou, pertence a um professor existente e cujo
// tokenVersion não avançou desde o login (troca de senha revoga sessões antigas).
router.get("/session", requireTeacher, controller.session);

module.exports = router;
