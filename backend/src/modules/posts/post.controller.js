const postService = require("./post.service");

function logControllerError(operation, error) {
  console.error("[post.controller] Falha na operação", {
    operation,
    name: typeof error?.name === "string" ? error.name : "UnknownError",
    code: typeof error?.code === "string" ? error.code : "UNKNOWN",
  });
}

async function create(req, res) {
  try {
    const post = await postService.createPost(req.body, req.auth.professor.id);
    return res.status(201).json(post);
  } catch (error) {
    logControllerError("create", error);
    // Professor excluído entre o middleware e o service: era 500, o app mostrava
    // "verifique sua conexão" e a sessão morta continuava ativa porque o
    // interceptor só invalida a sessão em 401.
    if (error?.code === "AUTHENTICATED_PROFESSOR_NOT_FOUND") {
      return res.status(401).json({ message: "Sessão inválida" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function list(req, res) {
  try {
    const posts = await postService.getAllPosts();
    return res.json(posts);
  } catch (error) {
    logControllerError("list", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getById(req, res) {
  try {
    const post = await postService.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    return res.json(post);
  } catch (error) {
    logControllerError("getById", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function update(req, res) {
  try {
    const post = await postService.updatePost(req.params.id, req.body);
    return res.json(post);
  } catch (error) {
    logControllerError("update", error);
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function remove(req, res) {
  try {
    const deleted = await postService.deletePost(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.status(204).send();
  } catch (error) {
    logControllerError("remove", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function search(req, res) {
  try {
    const term = req.query.term;
    // ?term=a&term=b chega como array no Express 5 e o Prisma lançava erro de
    // validação, transformando entrada inválida em 500 num endpoint público.
    if (typeof term !== "string" || !term.trim()) {
      return res.status(400).json({ message: "Missing query param: term" });
    }

    const posts = await postService.searchPosts(term.trim());
    return res.json(posts);
  } catch (error) {
    logControllerError("search", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  search,
};
