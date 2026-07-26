const professorService = require("./professor.service");
const { parsePagination } = require("../../middlewares/parsePagination");
const { logControllerError } = require("../../config/logger");

// Códigos do Prisma que representam erro do cliente. Qualquer outro erro é
// falha do servidor: antes P1001 (banco indisponível) virava 400 e o app tratava
// queda de infraestrutura como erro de formulário.
const CLIENT_ERROR_CODES = new Set(["P2000", "P2003", "P2011", "P2012"]);

async function create(req, res) {
  try {
    const professor = await professorService.createProfessor(req.body);
    return res.status(201).json(professor);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email já cadastrado" });
    }
    logControllerError("professor.controller", "create", error);
    if (CLIENT_ERROR_CODES.has(error?.code)) {
      return res.status(400).json({ error: "Requisição inválida" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function list(req, res) {
  try {
    const parsed = parsePagination(req.query);
    if (parsed.issues) {
      return res.status(400).json({
        message: "Validation error",
        issues: parsed.issues,
      });
    }
    const result = await professorService.listProfessores(parsed);
    return res.json(result);
  } catch (error) {
    logControllerError("professor.controller", "list", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function update(req, res) {
  try {
    const professor = await professorService.updateProfessor(req.params.id, req.body);
    return res.json(professor);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Professor not found" });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email já cadastrado" });
    }
    logControllerError("professor.controller", "update", error);
    if (CLIENT_ERROR_CODES.has(error?.code)) {
      return res.status(400).json({ error: "Requisição inválida" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function remove(req, res) {
  try {
    const deleted = await professorService.deleteProfessor(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Professor not found" });
    }

    return res.status(204).send();
  } catch (error) {
    logControllerError("professor.controller", "remove", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
};
