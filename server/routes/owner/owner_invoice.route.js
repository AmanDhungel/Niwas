import express from "express";
import {
  handle_get_owner_invoices,
  handle_get_owner_invoice,
  handle_add_owner_invoice,
  handle_edit_owner_invoice,
  handle_delete_owner_invoice,
  handle_update_owner_invoice_status,
} from "../../controllers/owner/owner_invoice.controller.js";

const owner_invoice_router = express.Router();

owner_invoice_router.get("/:owner_id", handle_get_owner_invoices);

owner_invoice_router.get("/:owner_id/:invoice_id", handle_get_owner_invoice);

owner_invoice_router.post("/add", handle_add_owner_invoice);

owner_invoice_router.post("/edit/:invoice_id", handle_edit_owner_invoice);

owner_invoice_router.post("/delete/:invoice_id", handle_delete_owner_invoice);

owner_invoice_router.post(
  "/update_status/:invoice_id",
  handle_update_owner_invoice_status,
);

export default owner_invoice_router;
