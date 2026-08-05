import express from "express";
import {
  handle_add_tax,
  handle_delete_tax,
  handle_edit_tax,
  handle_get_tax,
  handle_get_taxes,
} from "../../controllers/finance/tax.controller.js";

const tax_router = express.Router();

tax_router.post("/add", handle_add_tax);

tax_router.get("/", handle_get_taxes);

tax_router.get("/tax/:tax_id", handle_get_tax);

tax_router.post("/edit/:tax_id", handle_edit_tax);

tax_router.post("/delete/:tax_id", handle_delete_tax);

export default tax_router;
