const { z } = require("zod");

const createPostSchema = z.object({
  title: z.string().min(1, "title is required"),
  content: z.string().min(1, "content is required"),
  author: z.string().min(1, "author is required"),
});

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
});

module.exports = { createPostSchema, updatePostSchema };

