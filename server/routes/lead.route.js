import express from "express";
import multer from "multer";
import {
  handle_get_leads,
  handle_get_lead,
  handle_add_lead,
  handle_edit_lead,
  handle_delete_lead,
  handle_add_note_to_lead,
  handle_edit_note_on_lead,
  handle_delete_note_from_lead,
  handle_add_call_log_to_lead,
  handle_edit_call_log_on_lead,
  handle_delete_call_log_from_lead,
} from "../controllers/lead.controller.js";
import check_permission_policy from "../middlewares/permission_policy.middleware.js";

const lead_router = express.Router();

const upload = multer({ dest: "uploads/tmp/" });

/* ================= LEAD ROUTES ================= */
lead_router.get("/", handle_get_leads);
lead_router.get("/:lead_id", handle_get_lead);
lead_router.post(
  "/add",
  check_permission_policy({
    policies: "create:crm_lead",
  }),
  handle_add_lead,
);
lead_router.post("/edit/:lead_id", handle_edit_lead);
lead_router.post("/delete/:lead_id", handle_delete_lead);

/* ================= NOTE ROUTES ================= */
lead_router.post(
  "/:lead_id/notes/add",
  upload.fields([{ name: "attachments" }]),
  handle_add_note_to_lead,
);

lead_router.post(
  "/:lead_id/notes/edit/:note_id",
  upload.fields([{ name: "attachments" }]),
  handle_edit_note_on_lead,
);

lead_router.post(
  "/:lead_id/notes/delete/:note_id",
  handle_delete_note_from_lead,
);

/* ================= CALL LOG ROUTES ================= */
lead_router.post("/:lead_id/call_log/add", handle_add_call_log_to_lead);
lead_router.post(
  "/:lead_id/call_log/edit/:call_log_id",
  handle_edit_call_log_on_lead,
);
lead_router.post(
  "/:lead_id/call_log/delete/:call_log_id",
  handle_delete_call_log_from_lead,
);

export default lead_router;
