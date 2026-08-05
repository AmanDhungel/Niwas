import express from "express";
import {
  handle_add_invoice,
  handle_get_invoice,
  handle_get_invoices,
} from "../controllers/invoice.controller.js";
import require_permission from "../middlewares/permission.middleware.js";

const invoice_router = express.Router();

invoice_router.get("/", handle_get_invoices);

invoice_router.get("/:invoice_id", handle_get_invoice);

invoice_router.post(
  "/add",
  require_permission("invoice", "create"),
  handle_add_invoice
);

export default invoice_router;
