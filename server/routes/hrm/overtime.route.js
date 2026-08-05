import express from "express";
import {
  handle_add_overtime,
  handle_delete_overtime,
  handle_edit_overtime,
  handle_get_overtime,
  handle_get_overtimes,
} from "../../controllers/hrm/overtime.controller.js";

const overtime_router = express.Router();

overtime_router.post("/add", handle_add_overtime);

overtime_router.get("/", handle_get_overtimes);

overtime_router.get("/overtime/:overtime_id", handle_get_overtime);

overtime_router.post("/edit/:overtime_id", handle_edit_overtime);

overtime_router.post("/delete/:overtime_id", handle_delete_overtime);

export default overtime_router;
