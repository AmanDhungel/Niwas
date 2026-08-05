import express from "express";
import {
  handle_add_estimate,
  handle_delete_estimate,
  handle_edit_estimate,
  handle_get_estimate,
  handle_get_estimates,
} from "../../controllers/finance/estimate.controller.js";

const estimate_router = express.Router();

estimate_router.post("/add", handle_add_estimate);

estimate_router.get("/", handle_get_estimates);

estimate_router.get("/estimate/:estimate_id", handle_get_estimate);

estimate_router.post("/edit/:estimate_id", handle_edit_estimate);

estimate_router.post("/delete/:estimate_id", handle_delete_estimate);

export default estimate_router;
