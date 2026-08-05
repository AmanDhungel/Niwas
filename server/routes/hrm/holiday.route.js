import express from "express";
import {
  handle_add_holiday,
  handle_delete_holiday,
  handle_edit_holiday,
  handle_get_holiday,
  handle_get_holidays,
} from "../../controllers/hrm/holiday.controller.js";

const holiday_router = express.Router();

holiday_router.get("/", handle_get_holidays);

holiday_router.get("/:holiday_id", handle_get_holiday);

holiday_router.post("/add", handle_add_holiday);

holiday_router.post("/delete/:holiday_id", handle_delete_holiday);

holiday_router.post("/edit/:holiday_id", handle_edit_holiday);

export default holiday_router;
