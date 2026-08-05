import express from "express";
import {
  handle_add_asset,
  handle_add_asset_category,
  handle_delete_asset,
  handle_delete_asset_category,
  handle_edit_asset,
  handle_edit_asset_category,
  handle_get_asset,
  handle_get_asset_categories,
  handle_get_asset_category,
  handle_get_assets,
} from "../../../controllers/administration/assets/asset.controller.js";

const asset_router = express.Router();

asset_router.get("/", handle_get_assets);

asset_router.get("/asset/:asset_id", handle_get_asset);

asset_router.post("/add", handle_add_asset);

asset_router.post("/edit/:asset_id", handle_edit_asset);

asset_router.post("/delete/:asset_id", handle_delete_asset);

asset_router.get("/categories", handle_get_asset_categories);

asset_router.get("/categories/:category_id", handle_get_asset_category);

asset_router.post("/add_category", handle_add_asset_category);

asset_router.post("/edit_category/:category_id", handle_edit_asset_category);

asset_router.post(
  "/delete_category/:category_id",
  handle_delete_asset_category,
);

// goal_router.get("/", handle_get_goals);

// goal_router.post("/add", handle_add_goal);

// goal_router.post("/edit/:goal_id", handle_edit_goal);

// goal_router.get("/goal/:goal_id", handle_get_goal);

// goal_router.post("/delete/:goal_id", handle_delete_goal);

// goal_router.get("/types", handle_get_goal_types);

// goal_router.get("/types/:goal_type_id", handle_get_goal_type);

// goal_router.post("/add_type", handle_add_goal_type);

// goal_router.post("/edit_type/:goal_type_id", handle_edit_goal_type);

// goal_router.post("/delete_type/:goal_type_id", handle_delete_goal_type);

export default asset_router;
