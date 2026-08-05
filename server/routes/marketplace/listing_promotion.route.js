import express from "express";
import {
  handle_get_listing_promotions,
  handle_get_listing_promotion,
  handle_add_listing_promotion,
  handle_edit_listing_promotion,
  handle_delete_listing_promotion,
} from "../../controllers/marketplace/listing_promotion.controller.js";

const listing_promotion_router = express.Router();

listing_promotion_router.get("/", handle_get_listing_promotions);

listing_promotion_router.get(
  "/listing_promotion/:promotion_id",
  handle_get_listing_promotion,
);

listing_promotion_router.post("/add", handle_add_listing_promotion);

listing_promotion_router.post(
  "/edit/:promotion_id",
  handle_edit_listing_promotion,
);

listing_promotion_router.post(
  "/delete/:promotion_id",
  handle_delete_listing_promotion,
);

export default listing_promotion_router;
