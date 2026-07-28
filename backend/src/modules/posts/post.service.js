const prisma = require('../../config/prisma');

async function createPost(data, professorId) {
  const professor = await prisma.professor.findUnique({
    where: { id: professorId },
    select: { nome: true },
  });

  if (!professor) {
    throw Object.assign(new Error("Professor autenticado não encontrado"), {
      code: "AUTHENTICATED_PROFESSOR_NOT_FOUND",
    });
  }

  return prisma.post.create({
    data: {
      title: data.title,
      content: data.content,
      author: professor.nome,
    },
  });
}

async function getAllPosts() {
  return prisma.post.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

async function getPostById(id) {
  return prisma.post.findUnique({
    where: { id }
  });
}

async function updatePost(id, data) {
  return prisma.post.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
    },
  });
}

async function deletePost(id) {
  try {
    await prisma.post.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    if (error.code === "P2025") return false; // não existe
    throw error; // erro real
  }
}

// `contains` gera LIKE sem escapar curingas: buscar "%" ou "_" devolvia
// praticamente todos os posts em vez de buscar o caractere literal.
// No PostgreSQL a barra invertida é o escape padrão do LIKE.
function escapeLikeWildcards(term) {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}

// unaccent() dos dois lados: "fotossintese" (sem acento, digitado pelo aluno)
// precisa achar "fotossíntese" (com acento, no conteúdo real). Prisma não tem
// função de busca no schema, por isso vai como SQL cru — os valores seguem
// interpolados com segurança pelo tagged template, sem concatenação de string.
async function searchPosts(term) {
  const safeTerm = escapeLikeWildcards(term);
  const pattern = `%${safeTerm}%`;
  return prisma.$queryRaw`
    SELECT * FROM "Post"
    WHERE unaccent(title) ILIKE unaccent(${pattern}) ESCAPE '\\'
       OR unaccent(content) ILIKE unaccent(${pattern}) ESCAPE '\\'
    ORDER BY "createdAt" DESC
  `;
}

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  searchPosts,
};
