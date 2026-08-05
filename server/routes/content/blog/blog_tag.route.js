import express from "express";
import {
  handle_add_blog_tag,
  handle_delete_blog_tag,
  handle_edit_blog_tag,
  handle_get_blog_tag,
  handle_get_blog_tags,
} from "../../../controllers/content/blog/blog_tag.controller.js";

const blog_tag_router = express.Router();

blog_tag_router.get("/", handle_get_blog_tags);

blog_tag_router.get("/:tag_id", handle_get_blog_tag);

blog_tag_router.post("/add", handle_add_blog_tag);

blog_tag_router.post("/edit/:tag_id", handle_edit_blog_tag);

blog_tag_router.post("/delete/:tag_id", handle_delete_blog_tag);

export default blog_tag_router;
