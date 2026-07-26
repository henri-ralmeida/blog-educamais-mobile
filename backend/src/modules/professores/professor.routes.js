const express = require("express");
const controller = require("./professor.controller");
const requireTeacher = require("../../middlewares/requireTeacher");
const validateBody = require("../../middlewares/validateBody");
const { createProfessorSchema, updateProfessorSchema } = require("./professor.validators");

const router = express.Router();

// Leitura protegida (não é conteúdo público como posts — expõe nome/email de professores)
router.get("/", requireTeacher, controller.list);

// Escrita (somente professor autenticado por Bearer JWT)
router.post("/", requireTeacher, validateBody(createProfessorSchema), controller.create);
router.put("/:id", requireTeacher, validateBody(updateProfessorSchema), controller.update);
router.delete("/:id", requireTeacher, controller.remove);

module.exports = router;
