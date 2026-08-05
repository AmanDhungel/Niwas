import express from "express";
import {
  handle_add_expense,
  handle_delete_expense,
  handle_edit_expense,
  handle_get_expense,
  handle_get_expenses,
} from "../../controllers/finance/expense.controller.js";

const expense_router = express.Router();

expense_router.post("/add", handle_add_expense);

expense_router.get("/", handle_get_expenses);

expense_router.get("/expense/:expense_id", handle_get_expense);

expense_router.post("/edit/:expense_id", handle_edit_expense);

expense_router.post("/delete/:expense_id", handle_delete_expense);

export default expense_router;
