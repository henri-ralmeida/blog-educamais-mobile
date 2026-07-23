const professorService = require("./professor.service");

async function create(req, res) {
  try {
    const professor = await professorService.createProfessor(req.body);
    return res.status(201).json(professor);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email já cadastrado" });
    }
    console.error(error);
    return res.status(400).json({ error: "Requisição inválida" });
  }
}

async function list(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const result = await professorService.listProfessores({ page, limit });
    return res.json(result);
  } catch (error) {
    console.error(error);
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
    console.error(error);
    return res.status(400).json({ error: "Requisição inválida" });
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
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
};
