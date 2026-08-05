import express from "express";
import {
  handle_get_employees,
  handle_get_employee,
  handle_add_employee,
  handle_edit_employee,
  handle_delete_employee,
  handle_update_employee_profile,
} from "../controllers/employee.controller.js";

const employee_router = express.Router();

employee_router.get("/", handle_get_employees);
employee_router.get("/:employee_id", handle_get_employee);

employee_router.post("/add", handle_add_employee);

employee_router.post("/edit/:employee_id", handle_edit_employee);

employee_router.post("/delete/:employee_id", handle_delete_employee);

employee_router.post("/profile/:employee_id", handle_update_employee_profile);

export default employee_router;
