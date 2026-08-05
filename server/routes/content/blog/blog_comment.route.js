import express from "express";
import {
  handle_get_blog_comments,
  handle_get_blog_comment,
  handle_toggle_blog_comment_status,
  handle_delete_blog_comment,
} from "../../../controllers/content/blog/blog_comment.controller.js";

const blog_comment_router = express.Router();

blog_comment_router.get("/", handle_get_blog_comments);

blog_comment_router.get("/:comment_id", handle_get_blog_comment);

blog_comment_router.post(
  "/status/:comment_id",
  handle_toggle_blog_comment_status,
);

blog_comment_router.post("/delete/:comment_id", handle_delete_blog_comment);

export default blog_comment_router;
