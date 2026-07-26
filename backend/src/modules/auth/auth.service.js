const jwt = require("jsonwebtoken");
const { getConfig } = require("../../config/env");
const bcrypt = require("bcryptjs");
const prisma = require("../../config/prisma");

function omitCredenciais(professor) {
  if (!professor) return professor;
  const { senha: _senha, tokenVersion: _tokenVersion, ...rest } = professor;
  return rest;
}

// Hash bcrypt "dummy" (senha aleatória, nunca usada) — compara contra ele quando o
// email não existe, pra bcrypt.compare rodar no mesmo tempo em ambos os casos e não
// vazar via timing se o email está cadastrado.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8i.pR8QsjJDoJ3AZbLXvHVWs0RGNv6";

async function login(email, senha) {
  const professor = await prisma.professor.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  const hashToCheck = professor ? professor.senha : DUMMY_HASH;
  const senhaValida = await bcrypt.compare(senha, hashToCheck);

  if (!professor || !senhaValida) return null;

  const professorSeguro = omitCredenciais(professor);
  const { jwtSecret, jwtExpiresIn } = getConfig();
  const token = jwt.sign(
    { role: "teacher", tokenVersion: professor.tokenVersion ?? 1 },
    jwtSecret,
    {
      algorithm: "HS256",
      expiresIn: jwtExpiresIn,
      subject: String(professor.id),
    }
  );

  return { token, professor: professorSeguro };
}

module.exports = { login };
