import express from "express";
import {
  handle_add_promotion,
  handle_delete_promotion,
  handle_edit_promotion,
  handle_get_promotion,
  handle_get_promotions,
} from "../../controllers/hrm/promotion.controller.js";

const promotion_router = express.Router();

promotion_router.get("/", handle_get_promotions);

promotion_router.post("/add_promotion", handle_add_promotion);

promotion_router.get("/:promotion_id", handle_get_promotion);

promotion_router.post("/delete/:promotion_id", handle_delete_promotion);

promotion_router.post("/edit/:promotion_id", handle_edit_promotion);

// designation_router.get("/", handle_get_designations);

// designation_router.get("/:designation_id", handle_get_designation);

// designation_router.post("/add", handle_add_designation);

// designation_router.post("/delete/:designation_id", handle_delete_designation);

export default promotion_router;
