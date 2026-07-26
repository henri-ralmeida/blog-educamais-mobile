// Log redutor de erros. `console.error(error)` serializava o objeto de erro do
// Prisma inteiro, que embute o `data` da operação — ou seja, email do professor
// (PII) e o hash bcrypt iam parar no stdout do container.
function logControllerError(scope, operation, error) {
  console.error(`[${scope}] Falha na operação`, {
    operation,
    name: typeof error?.name === "string" ? error.name : "UnknownError",
    code: typeof error?.code === "string" ? error.code : "UNKNOWN",
  });
}

module.exports = { logControllerError };
