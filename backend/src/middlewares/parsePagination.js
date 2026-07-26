// Paginação compartilhada por professores e alunos. As duas cópias eram
// idênticas byte a byte, e MAX_LIMIT é o teto anti-dump de PII: divergir aqui
// seria silencioso e perigoso.
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

module.exports = { parsePagination, DEFAULT_PAGE, DEFAULT_LIMIT, MAX_PAGE, MAX_LIMIT };
