const prisma = require("../../config/prisma");

async function createAluno(data) {
  return prisma.aluno.create({ data });
}

async function listAlunos({ page = 1, limit = 10 } = {}) {
  const currentPage = page || 1;
  const currentLimit = limit || 10;
  const skip = (currentPage - 1) * currentLimit;

  const [data, total] = await Promise.all([
    prisma.aluno.findMany({
      skip,
      take: currentLimit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.aluno.count(),
  ]);

  return {
    data,
    total,
    page: currentPage,
    limit: currentLimit,
  };
}

async function updateAluno(id, data) {
  return prisma.aluno.update({
    where: { id },
    data,
  });
}

async function deleteAluno(id) {
  try {
    await prisma.aluno.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    if (error.code === "P2025") return false; // não existe
    throw error; // erro real
  }
}

module.exports = {
  createAluno,
  listAlunos,
  updateAluno,
  deleteAluno,
};
