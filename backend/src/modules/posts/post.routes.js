const express = require("express");
const controller = require("./post.controller");
const requireTeacher = require("../../middlewares/requireTeacher");
const { createPostSchema, updatePostSchema } = require("./post.validators");

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

// Leitura (aluno e professor)
router.get("/", controller.list);
router.get("/search", controller.search);
router.get("/:id", controller.getById);

// Escrita (somente professor - simulado por header x-user-type)
router.post("/", requireTeacher, validateBody(createPostSchema), controller.create);
router.put("/:id", requireTeacher, validateBody(updatePostSchema), controller.update);
router.delete("/:id", requireTeacher, controller.remove);

module.exports = router;


