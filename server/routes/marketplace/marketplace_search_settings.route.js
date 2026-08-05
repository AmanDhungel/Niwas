import express from "express";
import {
  handle_get_ranking_factors,
  handle_edit_ranking_factors,
  handle_reset_ranking_factors,
  handle_get_filter_configuration,
  handle_edit_filter_configuration,
} from "../../controllers/marketplace/marketplace_search_settings.controller.js";

const marketplace_search_settings_router = express.Router();

marketplace_search_settings_router.get(
  "/ranking_factors",
  handle_get_ranking_factors,
);

marketplace_search_settings_router.post(
  "/ranking_factors/edit",
  handle_edit_ranking_factors,
);

marketplace_search_settings_router.post(
  "/ranking_factors/reset",
  handle_reset_ranking_factors,
);

marketplace_search_settings_router.get(
  "/filter_configuration",
  handle_get_filter_configuration,
);

marketplace_search_settings_router.post(
  "/filter_configuration/edit",
  handle_edit_filter_configuration,
);

export default marketplace_search_settings_router;
