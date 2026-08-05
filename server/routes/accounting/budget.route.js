import express from "express";
import {
  handle_add_budget,
  handle_delete_budget,
  handle_edit_budget,
  handle_get_budget,
  handle_get_budgets,
} from "../../controllers/accounting/budget.controller.js";

const budget_router = express.Router();

budget_router.post("/add", handle_add_budget);

budget_router.get("/", handle_get_budgets);

budget_router.get("/budget/:budget_id", handle_get_budget);

budget_router.post("/edit/:budget_id", handle_edit_budget);

budget_router.post("/delete/:budget_id", handle_delete_budget);

export default budget_router;
