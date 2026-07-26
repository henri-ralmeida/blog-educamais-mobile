const bcrypt = require("bcryptjs");
const prisma = require("../../config/prisma");
const { BCRYPT_SALT_ROUNDS } = require("../../config/security");

const PUBLIC_PROFESSOR_SELECT = {
  id: true,
  nome: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

async function createProfessor(data) {
  const senhaHash = await bcrypt.hash(data.senha, BCRYPT_SALT_ROUNDS);
  return prisma.professor.create({
    data: { ...data, email: data.email.trim().toLowerCase(), senha: senhaHash },
    select: PUBLIC_PROFESSOR_SELECT,
  });
}

async function listProfessores({ page = 1, limit = 10 } = {}) {
  const currentPage = page || 1;
  const currentLimit = limit || 10;
  const skip = (currentPage - 1) * currentLimit;

  const [data, total] = await Promise.all([
    prisma.professor.findMany({
      skip,
      take: currentLimit,
      orderBy: { createdAt: "desc" },
      select: PUBLIC_PROFESSOR_SELECT,
    }),
    prisma.professor.count(),
  ]);

  return {
    data,
    total,
    page: currentPage,
    limit: currentLimit,
  };
}

async function updateProfessor(id, data) {
  const payload = { ...data };
  if (payload.email) {
    payload.email = payload.email.trim().toLowerCase();
  }
  if (payload.senha === "") {
    delete payload.senha;
  } else if (payload.senha !== undefined) {
    payload.senha = await bcrypt.hash(payload.senha, BCRYPT_SALT_ROUNDS);
    payload.tokenVersion = { increment: 1 };
  }
  return prisma.professor.update({
    where: { id },
    data: payload,
    select: PUBLIC_PROFESSOR_SELECT,
  });
}

async function deleteProfessor(id) {
  try {
    await prisma.professor.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    if (error.code === "P2025") return false; // não existe
    throw error; // erro real
  }
}

module.exports = {
  createProfessor,
  listProfessores,
  updateProfessor,
  deleteProfessor,
};
