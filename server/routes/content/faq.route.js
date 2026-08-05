import express from "express";
import {
  handle_get_faqs,
  handle_get_faq,
  handle_add_faq,
  handle_edit_faq,
  handle_delete_faq,
} from "../../controllers/content/faq.controller.js";

const faq_router = express.Router();

faq_router.get("/", handle_get_faqs);

faq_router.get("/:faq_id", handle_get_faq);

faq_router.post("/add", handle_add_faq);

faq_router.post("/edit/:faq_id", handle_edit_faq);

faq_router.post("/delete/:faq_id", handle_delete_faq);

export default faq_router;
