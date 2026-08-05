import express from "express";
import multer from "multer";
import {
  handle_get_blogs,
  handle_get_blog,
  handle_add_blog,
  handle_edit_blog,
  handle_delete_blog,
  handle_toggle_blog_like,
  handle_add_blog_comment,
} from "../../../controllers/content/blog/blog.controller.js";

const blog_router = express.Router();

const upload = multer({ dest: "temp/" });

// Public
blog_router.get("/", handle_get_blogs);

blog_router.get("/:blog_id", handle_get_blog);

// Admin — CRUD
blog_router.post("/add", upload.single("banner_image"), handle_add_blog);

blog_router.post(
  "/edit/:blog_id",
  upload.single("banner_image"),
  handle_edit_blog,
);
blog_router.post("/delete/:blog_id", handle_delete_blog);

// Authenticated user actions
blog_router.post("/like/:blog_id", handle_toggle_blog_like);

blog_router.post("/comment/:blog_id", handle_add_blog_comment);

export default blog_router;
