import express from "express";
import {
  handle_get_tenant_invoices,
  handle_get_tenant_invoice,
  handle_add_tenant_invoice,
  handle_edit_tenant_invoice,
  handle_delete_tenant_invoice,
  handle_update_tenant_invoice_status,
} from "../../controllers/tenant/tenant_invoice.controller.js";

const tenant_invoice_router = express.Router();

tenant_invoice_router.get("/:tenant_id", handle_get_tenant_invoices);

tenant_invoice_router.get("/:tenant_id/:invoice_id", handle_get_tenant_invoice);

tenant_invoice_router.post("/add", handle_add_tenant_invoice);

tenant_invoice_router.post("/edit/:invoice_id", handle_edit_tenant_invoice);

tenant_invoice_router.post("/delete/:invoice_id", handle_delete_tenant_invoice);

tenant_invoice_router.post(
  "/update_status/:invoice_id",
  handle_update_tenant_invoice_status,
);

export default tenant_invoice_router;
