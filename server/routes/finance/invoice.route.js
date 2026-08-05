import express from "express";
import {
  handle_add_invoice,
  handle_delete_invoice,
  handle_edit_invoice,
  handle_get_invoice,
  handle_get_invoice_accounts,
  handle_get_invoice_escrows,
  handle_get_invoice_payments,
  handle_get_invoices,
  handle_mark_invoice_as_paid,
} from "../../controllers/finance/invoice.controller.js";

const invoice_router = express.Router();

invoice_router.post("/add", handle_add_invoice);
invoice_router.get("/", handle_get_invoices);

/* -------- Static routes FIRST -------- */
invoice_router.get("/invoice_payments", handle_get_invoice_payments);
invoice_router.get("/invoice_escrows", handle_get_invoice_escrows);
invoice_router.get("/invoice_accounts", handle_get_invoice_accounts);

/* -------- Dynamic routes LAST -------- */
invoice_router.get("/:invoice_id", handle_get_invoice);
invoice_router.post("/edit/:invoice_id", handle_edit_invoice);
invoice_router.post("/delete/:invoice_id", handle_delete_invoice);
invoice_router.post("/mark_paid/:invoice_id", handle_mark_invoice_as_paid);

export default invoice_router;
