const postService = require("./post.service");

async function create(req, res) {
  try {
    const post = await postService.createPost(req.body);
    return res.status(201).json(post);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function list(req, res) {
  try {
    const posts = await postService.getAllPosts();
    return res.json(posts);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getById(req, res) {
  try {
    const post = await postService.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    return res.json(post);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function update(req, res) {
  try {
    const post = await postService.updatePost(req.params.id, req.body);
    return res.json(post);
  } catch (error) {
    return res.status(400).json({ error: error.message });
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
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function search(req, res) {
  try {
    const term = req.query.term;
    if (!term) {
      return res.status(400).json({ message: "Missing query param: term" });
    }

    
    const posts = await postService.searchPosts(term);
    return res.json(posts);
  } catch (error) {
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
