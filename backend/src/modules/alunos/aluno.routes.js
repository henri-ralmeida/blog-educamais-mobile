const express = require("express");
const controller = require("./aluno.controller");
const requireTeacher = require("../../middlewares/requireTeacher");
const { createAlunoSchema, updateAlunoSchema } = require("./aluno.validators");

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

// Leitura protegida: dado pessoal de aluno (nome/email) nunca fica em rota pública.
router.get("/", requireTeacher, controller.list);

// Escrita (somente professor - simulado por header x-user-type)
router.post("/", requireTeacher, validateBody(createAlunoSchema), controller.create);
router.put("/:id", requireTeacher, validateBody(updateAlunoSchema), controller.update);
router.delete("/:id", requireTeacher, controller.remove);

module.exports = router;
