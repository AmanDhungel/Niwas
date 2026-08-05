import express from "express";
import multer from "multer";
import {
  handle_get_deals,
  handle_get_deal,
  handle_add_deal,
  handle_edit_deal,
  handle_delete_deal,
  handle_add_note_to_deal,
  handle_edit_note_on_deal,
  handle_delete_note_from_deal,
  handle_add_call_log_to_deal,
  handle_edit_call_log_on_deal,
  handle_delete_call_log_from_deal,
} from "../controllers/deal.controller.js";
import check_permission_policy from "../middlewares/permission_policy.middleware.js";

const deal_router = express.Router();

const upload = multer({ dest: "uploads/tmp/" });

/* ================= DEAL ROUTES ================= */
deal_router.get("/", handle_get_deals);
deal_router.get("/:deal_id", handle_get_deal);
deal_router.post(
  "/add",
  check_permission_policy({
    policies: "create:crm_deal",
  }),
  handle_add_deal,
);
deal_router.post("/edit/:deal_id", handle_edit_deal);
deal_router.post("/delete/:deal_id", handle_delete_deal);

/* ================= NOTE ROUTES ================= */
deal_router.post(
  "/:deal_id/notes/add",
  upload.fields([{ name: "attachments" }]),
  handle_add_note_to_deal,
);

deal_router.post(
  "/:deal_id/notes/edit/:note_id",
  upload.fields([{ name: "attachments" }]),
  handle_edit_note_on_deal,
);

deal_router.post(
  "/:deal_id/notes/delete/:note_id",
  handle_delete_note_from_deal,
);

/* ================= CALL LOG ROUTES ================= */
deal_router.post("/:deal_id/call_log/add", handle_add_call_log_to_deal);
deal_router.post(
  "/:deal_id/call_log/edit/:call_log_id",
  handle_edit_call_log_on_deal,
);
deal_router.post(
  "/:deal_id/call_log/delete/:call_log_id",
  handle_delete_call_log_from_deal,
);

export default deal_router;
