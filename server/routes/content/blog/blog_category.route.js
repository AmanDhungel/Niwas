import express from "express";
import {
  handle_add_blog_category,
  handle_delete_blog_category,
  handle_edit_blog_category,
  handle_get_blog_categories,
  handle_get_blog_category,
} from "../../../controllers/content/blog/blog_category.controller.js";

const blog_category_router = express.Router();

blog_category_router.get("/", handle_get_blog_categories);

blog_category_router.get("/:category_id", handle_get_blog_category);

blog_category_router.post("/add", handle_add_blog_category);

blog_category_router.post("/edit/:category_id", handle_edit_blog_category);

blog_category_router.post("/delete/:category_id", handle_delete_blog_category);

export default blog_category_router;
