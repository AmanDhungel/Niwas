import express from "express";
import {
  handle_add_timesheet,
  handle_delete_timesheet,
  handle_edit_timesheet,
  handle_get_timesheet,
  handle_get_timesheets,
} from "../../controllers/hrm/timesheet.controller.js";

const timesheet_router = express.Router();

timesheet_router.post("/add", handle_add_timesheet);

timesheet_router.get("/", handle_get_timesheets);

timesheet_router.get("/timesheet/:timesheet_id", handle_get_timesheet);

timesheet_router.post("/edit/:timesheet_id", handle_edit_timesheet);

timesheet_router.post("/delete/:timesheet_id", handle_delete_timesheet);

export default timesheet_router;
