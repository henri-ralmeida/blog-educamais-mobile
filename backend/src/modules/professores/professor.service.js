const bcrypt = require("bcryptjs");
const prisma = require("../../config/prisma");

const SALT_ROUNDS = 10;

function omitSenha(professor) {
  if (!professor) return professor;
  const { senha: _omit, ...rest } = professor;
  return rest;
}

async function createProfessor(data) {
  const senhaHash = await bcrypt.hash(data.senha, SALT_ROUNDS);
  const professor = await prisma.professor.create({
    data: { ...data, email: data.email.trim().toLowerCase(), senha: senhaHash },
  });
  return omitSenha(professor);
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
    }),
    prisma.professor.count(),
  ]);

  return {
    data: data.map(omitSenha),
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
    payload.senha = await bcrypt.hash(payload.senha, SALT_ROUNDS);
  }
  const professor = await prisma.professor.update({
    where: { id },
    data: payload,
  });
  return omitSenha(professor);
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
