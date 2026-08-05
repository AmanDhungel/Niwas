import express from "express";
import {
  handle_add_department,
  handle_delete_department,
  handle_edit_department,
  handle_get_department,
  handle_get_departments,
} from "../../controllers/hrm/department.controller.js";

const department_router = express.Router();

department_router.get("/", handle_get_departments);

department_router.get("/:department_id", handle_get_department);

department_router.post("/add", handle_add_department);

department_router.post("/delete/:department_id", handle_delete_department);

department_router.post("/edit/:department_id", handle_edit_department);

export default department_router;
