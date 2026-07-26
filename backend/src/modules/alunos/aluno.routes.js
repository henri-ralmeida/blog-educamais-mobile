const express = require("express");
const controller = require("./aluno.controller");
const requireTeacher = require("../../middlewares/requireTeacher");
const validateBody = require("../../middlewares/validateBody");
const { createAlunoSchema, updateAlunoSchema } = require("./aluno.validators");

const router = express.Router();

// Leitura protegida: dado pessoal de aluno (nome/email) nunca fica em rota pública.
router.get("/", requireTeacher, controller.list);

// Escrita (somente professor autenticado por Bearer JWT)
router.post("/", requireTeacher, validateBody(createAlunoSchema), controller.create);
router.put("/:id", requireTeacher, validateBody(updateAlunoSchema), controller.update);
router.delete("/:id", requireTeacher, controller.remove);

module.exports = router;
