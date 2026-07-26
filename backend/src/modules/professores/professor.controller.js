const professorService = require("./professor.service");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_PAGE = 1_000_000;
const MAX_LIMIT = 100;

function parsePaginationValue(value, { name, defaultValue, maximum }) {
  if (value === undefined) return { value: defaultValue };

  const parsed = typeof value === "string" || typeof value === "number"
    ? Number(value)
    : Number.NaN;

  if (
    (typeof value === "string" && value.trim() === "")
    || !Number.isFinite(parsed)
    || !Number.isInteger(parsed)
    || parsed < 1
    || parsed > maximum
  ) {
    return {
      issue: {
        path: name,
        message: `${name} deve ser um número inteiro entre 1 e ${maximum}`,
      },
    };
  }

  return { value: parsed };
}

function parsePagination(query) {
  const page = parsePaginationValue(query.page, {
    name: "page",
    defaultValue: DEFAULT_PAGE,
    maximum: MAX_PAGE,
  });
  const limit = parsePaginationValue(query.limit, {
    name: "limit",
    defaultValue: DEFAULT_LIMIT,
    maximum: MAX_LIMIT,
  });
  const issues = [page.issue, limit.issue].filter(Boolean);

  return issues.length > 0
    ? { issues }
    : { page: page.value, limit: limit.value };
}

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
