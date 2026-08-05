import express from "express";
import multer from "multer";
import {
  handle_get_testimonials,
  handle_get_testimonial,
  handle_add_testimonial,
  handle_edit_testimonial,
  handle_delete_testimonial,
} from "../../controllers/content/testimonial.controller.js";

const testimonial_router = express.Router();

// Multer — store to temp disk, single author image
const upload = multer({ dest: "temp/" });

testimonial_router.get("/", handle_get_testimonials);

testimonial_router.get("/:testimonial_id", handle_get_testimonial);

testimonial_router.post(
  "/add",
  upload.single("author_image"),
  handle_add_testimonial,
);

testimonial_router.post(
  "/edit/:testimonial_id",
  upload.single("author_image"),
  handle_edit_testimonial,
);

testimonial_router.post("/delete/:testimonial_id", handle_delete_testimonial);

export default testimonial_router;
