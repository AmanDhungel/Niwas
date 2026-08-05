import express from "express";
import {
  handle_get_employee_attendances,
  handle_get_employee_attendance_stats,
  handle_punch_in,
  handle_punch_out,
  handle_start_break,
  handle_end_break,
  handle_get_todays_attendance_admin,
} from "../../../controllers/hrm/attendance/attendance.controller.js";

const attendance_router = express.Router();

attendance_router.get("/attendance", handle_get_employee_attendances);
attendance_router.get("/stats", handle_get_employee_attendance_stats);
attendance_router.post("/punch_in", handle_punch_in);
attendance_router.post("/punch_out", handle_punch_out);
attendance_router.post("/break/start", handle_start_break);
attendance_router.post("/break/end", handle_end_break);
attendance_router.get(
  "/admin/todays_attendance",
  handle_get_todays_attendance_admin,
);

export default attendance_router;
