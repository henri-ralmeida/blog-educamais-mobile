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

async function searchPosts(term) {
  return prisma.post.findMany({
    where: {
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { content: { contains: term, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  searchPosts,
};
