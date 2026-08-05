import express from "express";
import {
  handle_add_provident_fund,
  handle_delete_provident_fund,
  handle_edit_provident_fund,
  handle_get_provident_fund,
  handle_get_provident_funds,
  handle_update_provident_fund_status,
} from "../../controllers/finance/provident_fund.controller.js";

const provident_fund_router = express.Router();

provident_fund_router.post("/add", handle_add_provident_fund);

provident_fund_router.get("/", handle_get_provident_funds);

provident_fund_router.get(
  "/provident_fund/:provident_fund_id",
  handle_get_provident_fund,
);

provident_fund_router.post(
  "/edit/:provident_fund_id",
  handle_edit_provident_fund,
);

provident_fund_router.post(
  "/delete/:provident_fund_id",
  handle_delete_provident_fund,
);

provident_fund_router.post(
  "/update_status/:provident_fund_id",
  handle_update_provident_fund_status,
);

export default provident_fund_router;
