const alunoService = require("./aluno.service");

async function create(req, res) {
  try {
    const aluno = await alunoService.createAluno(req.body);
    return res.status(201).json(aluno);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function list(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const result = await alunoService.listAlunos({ page, limit });
    return res.json(result);
  } catch (error) {
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
    return res.status(400).json({ error: error.message });
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
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
};
