import express from "express";
import {
  handle_add_account_category,
  handle_delete_account_category,
  handle_edit_account_category,
  handle_get_account_categories,
  handle_get_account_category,
} from "../../controllers/accounting/account_category.controller.js";

const account_category_router = express.Router();

account_category_router.post("/add", handle_add_account_category);

account_category_router.get("/", handle_get_account_categories);

account_category_router.get(
  "/category/:account_category_id",
  handle_get_account_category,
);

account_category_router.post(
  "/edit/:account_category_id",
  handle_edit_account_category,
);

account_category_router.post(
  "/delete/:account_category_id",
  handle_delete_account_category,
);

export default account_category_router;
