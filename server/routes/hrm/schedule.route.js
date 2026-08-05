import express from "express";

import {
  handle_add_schedule,
  handle_delete_schedule,
  handle_edit_schedule,
  handle_get_schedule,
  handle_get_schedules,
} from "../../controllers/hrm/schedule.controller.js";

const schedule_router = express.Router();

schedule_router.post("/add", handle_add_schedule);

schedule_router.get("/", handle_get_schedules);

schedule_router.get("/schedule/:schedule_id", handle_get_schedule);

schedule_router.post("/edit/:schedule_id", handle_edit_schedule);

schedule_router.post("/delete/:schedule_id", handle_delete_schedule);

export default schedule_router;
