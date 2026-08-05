import express from "express";
import {
  handle_add_performance_indicator,
  handle_delete_performance_indicator,
  handle_edit_performance_indicator,
  handle_get_performance_indicator,
  handle_get_performance_indicators,
} from "../../controllers/hrm/performance_indicator.controller.js";

const performance_indicator_router = express.Router();

performance_indicator_router.get("/", handle_get_performance_indicators);

performance_indicator_router.post("/add", handle_add_performance_indicator);

performance_indicator_router.get(
  "/:performance_indicator_id",
  handle_get_performance_indicator,
);

performance_indicator_router.post(
  "/delete/:performance_indicator_id",
  handle_delete_performance_indicator,
);

performance_indicator_router.post(
  "/edit/:performance_indicator_id",
  handle_edit_performance_indicator,
);

export default performance_indicator_router;
