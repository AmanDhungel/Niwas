import express from "express";
import {
  handle_get_agreements,
  handle_get_agreement,
  handle_add_agreement,
  handle_edit_agreement,
  handle_delete_agreement,
} from "../../controllers/agreement/agreement.controller.js";

const agreement_router = express.Router();

agreement_router.get("/", handle_get_agreements);

agreement_router.get("/agreement/:agreement_id", handle_get_agreement);

agreement_router.post("/add", handle_add_agreement);

agreement_router.post("/edit/:agreement_id", handle_edit_agreement);

agreement_router.post("/delete/:agreement_id", handle_delete_agreement);

export default agreement_router;
