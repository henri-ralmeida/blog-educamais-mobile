const prisma = require("../../config/prisma");

// Seleção explícita, como no módulo de professores: consultas com SELECT *
// passariam a vazar qualquer coluna sensível adicionada ao modelo no futuro.
const PUBLIC_ALUNO_SELECT = {
  id: true,
  nome: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

async function createAluno(data) {
  return prisma.aluno.create({
    data: { ...data, email: data.email.trim().toLowerCase() },
    select: PUBLIC_ALUNO_SELECT,
  });
}

async function listAlunos({ page = 1, limit = 10 } = {}) {
  const currentPage = page || 1;
  const currentLimit = limit || 10;
  const skip = (currentPage - 1) * currentLimit;

  const [data, total] = await prisma.$transaction([
    prisma.aluno.findMany({
      skip,
      take: currentLimit,
      orderBy: { createdAt: "desc" },
      select: PUBLIC_ALUNO_SELECT,
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
  const payload = { ...data };
  if (payload.email) {
    payload.email = payload.email.trim().toLowerCase();
  }
  return prisma.aluno.update({
    where: { id },
    data: payload,
    select: PUBLIC_ALUNO_SELECT,
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
  PUBLIC_ALUNO_SELECT,
  createAluno,
  listAlunos,
  updateAluno,
  deleteAluno,
};
