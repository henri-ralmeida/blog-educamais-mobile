const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const {
  createProfessorSchema,
} = require("../src/modules/professores/professor.validators");
const { BCRYPT_SALT_ROUNDS } = require("../src/config/security");
const PUBLIC_PROFESSOR_SELECT = {
  id: true,
  nome: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

function requireInitialValue(env, name, preserveWhitespace = false) {
  const value = env[name];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} é obrigatória para executar o seed`);
  }

  // Um .env salvo com CRLF entrega a senha terminada em carriage return. Com
  // preserveWhitespace esse caractere entrava no hash e o login falhava para
  // sempre com a senha correta, sem que o seed idempotente corrigisse depois.
  const QUEBRAS_DE_LINHA = [String.fromCharCode(13), String.fromCharCode(10)];
  if (QUEBRAS_DE_LINHA.some((caractere) => value.includes(caractere))) {
    throw new Error(
      `${name} contem quebra de linha (arquivo .env salvo com CRLF?). Regrave o .env com fim de linha LF.`,
    );
  }
  return preserveWhitespace ? value : value.trim();
}

function loadInitialTeacher(env = process.env) {
  const result = createProfessorSchema.safeParse({
    nome: requireInitialValue(env, "INITIAL_TEACHER_NAME"),
    email: requireInitialValue(env, "INITIAL_TEACHER_EMAIL").toLowerCase(),
    senha: requireInitialValue(env, "INITIAL_TEACHER_PASSWORD", true),
  });

  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path[0]))];
    throw new Error(`Variáveis do professor inicial inválidas: ${fields.join(", ")}`);
  }

  return result.data;
}

async function seedInitialTeacher({
  prismaClient,
  initialTeacher,
  hashPassword = bcrypt.hash,
  maxRetries = 3,
}) {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await prismaClient.$transaction(async (transaction) => {
        const existingProfessor = await transaction.professor.findFirst({
          select: { id: true },
        });

        if (existingProfessor) {
          return { created: false };
        }

        const senhaHash = await hashPassword(initialTeacher.senha, BCRYPT_SALT_ROUNDS);
        const professor = await transaction.professor.create({
          data: {
            nome: initialTeacher.nome,
            email: initialTeacher.email,
            senha: senhaHash,
          },
          select: PUBLIC_PROFESSOR_SELECT,
        });

        return { created: true, professor };
      }, { isolationLevel: "Serializable" });
    } catch (error) {
      if (error?.code !== "P2034" || attempt === maxRetries) throw error;
    }
  }

  throw new Error("Não foi possível concluir o seed do professor inicial");
}

async function main() {
  const initialTeacher = loadInitialTeacher();
  const prisma = new PrismaClient();

  try {
    const result = await seedInitialTeacher({ prismaClient: prisma, initialTeacher });
    console.log(result.created
      ? "Professor inicial criado com sucesso."
      : "Professor já existente; nenhuma alteração realizada.");
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[seed] ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  PUBLIC_PROFESSOR_SELECT,
  loadInitialTeacher,
  seedInitialTeacher,
};
