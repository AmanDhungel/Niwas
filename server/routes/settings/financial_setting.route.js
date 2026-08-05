import express from "express";
import {
  handle_get_payment_gateways,
  handle_enable_payment_gateway,
  handle_configure_payment_gateway,
  handle_get_tax_rates,
  handle_add_tax_rate,
  handle_edit_tax_rate,
  handle_delete_tax_rate,
  handle_get_currencies,
  handle_add_currency,
  handle_edit_currency,
  handle_delete_currency,
} from "../../controllers/settings/financial_setting.controller.js";

const financial_setting_router = express.Router();

financial_setting_router.get("/payment-gateway", handle_get_payment_gateways);

financial_setting_router.post(
  "/payment-gateway/enable/:gateway",
  handle_enable_payment_gateway,
);

financial_setting_router.post(
  "/payment-gateway/configure/:gateway",
  handle_configure_payment_gateway,
);

financial_setting_router.get("/tax-rate", handle_get_tax_rates);

financial_setting_router.post("/tax-rate/add", handle_add_tax_rate);

financial_setting_router.post(
  "/tax-rate/edit/:tax_rate_id",
  handle_edit_tax_rate,
);

financial_setting_router.post(
  "/tax-rate/delete/:tax_rate_id",
  handle_delete_tax_rate,
);

financial_setting_router.get("/currency", handle_get_currencies);

financial_setting_router.post("/currency/add", handle_add_currency);

financial_setting_router.post(
  "/currency/edit/:currency_id",
  handle_edit_currency,
);

financial_setting_router.post(
  "/currency/delete/:currency_id",
  handle_delete_currency,
);

export default financial_setting_router;
