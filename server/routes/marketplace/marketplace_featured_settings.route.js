import express from "express";
import {
  handle_get_featured_settings,
  handle_reset_featured_settings,
  handle_get_general_settings,
  handle_edit_general_settings,
  handle_reset_general_settings,
  handle_get_display_preferences,
  handle_edit_display_preferences,
  handle_reset_display_preferences,
} from "../../controllers/marketplace/marketplace_featured_settings.controller.js";

const marketplace_featured_settings_router = express.Router();

/* -------- Full settings -------- */
marketplace_featured_settings_router.get("/", handle_get_featured_settings);
marketplace_featured_settings_router.post(
  "/reset",
  handle_reset_featured_settings,
);

/* -------- General settings -------- */
marketplace_featured_settings_router.get(
  "/general",
  handle_get_general_settings,
);
marketplace_featured_settings_router.post(
  "/general/edit",
  handle_edit_general_settings,
);
marketplace_featured_settings_router.post(
  "/general/reset",
  handle_reset_general_settings,
);

/* -------- Display preferences -------- */
marketplace_featured_settings_router.get(
  "/display",
  handle_get_display_preferences,
);
marketplace_featured_settings_router.post(
  "/display/edit",
  handle_edit_display_preferences,
);
marketplace_featured_settings_router.post(
  "/display/reset",
  handle_reset_display_preferences,
);

export default marketplace_featured_settings_router;
