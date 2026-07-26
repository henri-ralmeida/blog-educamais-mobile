const express = require("express");
const controller = require("./post.controller");
const requireTeacher = require("../../middlewares/requireTeacher");
const validateBody = require("../../middlewares/validateBody");
const { createPostSchema, updatePostSchema } = require("./post.validators");

const router = express.Router();

// Leitura (aluno e professor)
router.get("/", controller.list);
router.get("/search", controller.search);
router.get("/:id", controller.getById);

// Escrita (somente professor autenticado por Bearer JWT)
router.post("/", requireTeacher, validateBody(createPostSchema), controller.create);
router.put("/:id", requireTeacher, validateBody(updatePostSchema), controller.update);
router.delete("/:id", requireTeacher, controller.remove);

module.exports = router;


