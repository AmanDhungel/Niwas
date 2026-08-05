import express from "express";
import {
  handle_add_salary,
  handle_delete_salary,
  handle_edit_salary,
  handle_get_salaries,
  handle_get_salary,
} from "../../controllers/payroll/salary.controller.js";

const salary_router = express.Router();

salary_router.post("/add", handle_add_salary);

salary_router.get("/", handle_get_salaries);

salary_router.get("/salary/:salary_id", handle_get_salary);

salary_router.post("/edit/:salary_id", handle_edit_salary);

salary_router.post("/delete/:salary_id", handle_delete_salary);

export default salary_router;
