const express = require("express");
const controller = require("./auth.controller");
const { loginSchema } = require("./auth.validators");
const requireTeacher = require("../../middlewares/requireTeacher");
const validateBody = require("../../middlewares/validateBody");

const router = express.Router();

// Login do professor é público: credenciais válidas emitem o Bearer JWT da sessão.
router.post("/login", validateBody(loginSchema), controller.login);

// Revalidação remota da sessão antes de RESTORE no mobile: confirma que o token
// ainda está assinado, não expirou, pertence a um professor existente e cujo
// tokenVersion não avançou desde o login (troca de senha revoga sessões antigas).
router.get("/session", requireTeacher, controller.session);

module.exports = router;
