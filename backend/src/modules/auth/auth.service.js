const bcrypt = require("bcryptjs");
const prisma = require("../../config/prisma");

function omitSenha(professor) {
  if (!professor) return professor;
  const { senha: _omit, ...rest } = professor;
  return rest;
}

async function login(email, senha) {
  const professor = await prisma.professor.findUnique({ where: { email } });
  if (!professor) return null;

  const senhaValida = await bcrypt.compare(senha, professor.senha);
  if (!senhaValida) return null;

  return omitSenha(professor);
}

module.exports = { login };
