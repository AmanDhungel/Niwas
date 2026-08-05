import express from "express";
import {
  handle_get_utility_providers,
  handle_get_utility_provider,
  handle_add_utility_provider,
  handle_edit_utility_provider,
  handle_delete_utility_provider,
} from "../../controllers/utility/utility_provider.controller.js";

const utility_provider_router = express.Router();

utility_provider_router.get("/", handle_get_utility_providers);

utility_provider_router.get("/:provider_id", handle_get_utility_provider);

utility_provider_router.post("/add", handle_add_utility_provider);

utility_provider_router.post(
  "/edit/:provider_id",
  handle_edit_utility_provider,
);

utility_provider_router.post(
  "/delete/:provider_id",
  handle_delete_utility_provider,
);

export default utility_provider_router;
