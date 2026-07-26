const alunoService = require("./aluno.service");
const { parsePagination } = require("../../middlewares/parsePagination");
const { logControllerError } = require("../../config/logger");

// Mesma política do módulo de professores: só código de erro de cliente vira
// 400; falha de infraestrutura continua sendo 500.
const CLIENT_ERROR_CODES = new Set(["P2000", "P2003", "P2011", "P2012"]);

async function create(req, res) {
  try {
    const aluno = await alunoService.createAluno(req.body);
    return res.status(201).json(aluno);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email já cadastrado" });
    }
    logControllerError("aluno.controller", "create", error);
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
    const result = await alunoService.listAlunos(parsed);
    return res.json(result);
  } catch (error) {
    logControllerError("aluno.controller", "list", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function update(req, res) {
  try {
    const aluno = await alunoService.updateAluno(req.params.id, req.body);
    return res.json(aluno);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Aluno not found" });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email já cadastrado" });
    }
    logControllerError("aluno.controller", "update", error);
    if (CLIENT_ERROR_CODES.has(error?.code)) {
      return res.status(400).json({ error: "Requisição inválida" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function remove(req, res) {
  try {
    const deleted = await alunoService.deleteAluno(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Aluno not found" });
    }

    return res.status(204).send();
  } catch (error) {
    logControllerError("aluno.controller", "remove", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
};
