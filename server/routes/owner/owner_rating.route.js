import express from "express";
import {
  handle_get_owner_ratings,
  handle_get_owner_rating,
  handle_add_owner_rating,
  handle_edit_owner_rating,
  handle_delete_owner_rating,
  handle_update_owner_rating_visibility,
} from "../../controllers/owner/owner_rating.controller.js";

const owner_rating_router = express.Router();

owner_rating_router.get("/", handle_get_owner_ratings);

owner_rating_router.get("/:rating_id", handle_get_owner_rating);

owner_rating_router.post("/add", handle_add_owner_rating);

owner_rating_router.post("/edit/:rating_id", handle_edit_owner_rating);

owner_rating_router.post("/delete/:rating_id", handle_delete_owner_rating);

owner_rating_router.post(
  "/update_visibility/:rating_id",
  handle_update_owner_rating_visibility,
);

export default owner_rating_router;
