import express from "express";
import {
  handle_get_promotion_packages,
  handle_get_promotion_package,
  handle_add_promotion_package,
  handle_edit_promotion_package,
  handle_delete_promotion_package,
} from "../../controllers/marketplace/promotion_package.controller.js";

const promotion_package_router = express.Router();

promotion_package_router.get("/", handle_get_promotion_packages);

promotion_package_router.get(
  "/promotion_package/:package_id",
  handle_get_promotion_package,
);

promotion_package_router.post("/add", handle_add_promotion_package);

promotion_package_router.post(
  "/edit/:package_id",
  handle_edit_promotion_package,
);

promotion_package_router.post(
  "/delete/:package_id",
  handle_delete_promotion_package,
);

export default promotion_package_router;