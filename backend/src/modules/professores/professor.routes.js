const express = require("express");
const controller = require("./professor.controller");
const requireTeacher = require("../../middlewares/requireTeacher");
const { createProfessorSchema, updateProfessorSchema } = require("./professor.validators");

const router = express.Router();

// Middleware genérico de validação com Zod
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

// Leitura protegida (não é conteúdo público como posts — expõe nome/email de professores)
router.get("/", requireTeacher, controller.list);

// Escrita (somente professor autenticado por Bearer JWT)
router.post("/", requireTeacher, validateBody(createProfessorSchema), controller.create);
router.put("/:id", requireTeacher, validateBody(updateProfessorSchema), controller.update);
router.delete("/:id", requireTeacher, controller.remove);

module.exports = router;
