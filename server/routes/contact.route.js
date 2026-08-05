import express from "express";
import multer from "multer";
import {
  handle_add_contact,
  handle_delete_contact,
  handle_edit_contact,
  handle_get_contact,
  handle_get_contacts,
  handle_add_note_to_contact,
  handle_edit_note_on_contact,
  handle_delete_note_from_contact,
  handle_add_file_to_contact,
  handle_delete_file_from_contact,
  handle_edit_file_on_contact,
  handle_add_call_log_to_contact,
  handle_delete_call_log_from_contact,
  handle_edit_call_log_on_contact,
} from "../controllers/contact.controller.js";
import check_permission_policy from "../middlewares/permission_policy.middleware.js";

const contact_router = express.Router();

const upload = multer({ dest: "uploads/tmp/" });

/* ================= CONTACT ROUTES ================= */
contact_router.get("/", handle_get_contacts);
contact_router.get("/:contact_id", handle_get_contact);
contact_router.post(
  "/add",
  check_permission_policy({ policies: "create:crm_contact" }),
  upload.single("image"),
  handle_add_contact,
);
contact_router.post(
  "/edit/:contact_id",
  upload.single("image"),
  handle_edit_contact,
);
contact_router.post("/delete/:contact_id", handle_delete_contact);

/* ================= NOTE ROUTES ================= */
contact_router.post(
  "/:contact_id/notes/add",
  upload.fields([{ name: "attachments" }]),
  handle_add_note_to_contact,
);
contact_router.post(
  "/:contact_id/notes/edit/:note_id",
  upload.fields([{ name: "attachments" }]),
  handle_edit_note_on_contact,
);
contact_router.post(
  "/:contact_id/notes/delete/:note_id",
  handle_delete_note_from_contact,
);

/* ================= CALL LOG ROUTES ================= */
contact_router.post(
  "/:contact_id/call_log/add",
  handle_add_call_log_to_contact,
);
contact_router.post(
  "/:contact_id/call_log/edit/:call_log_id",
  handle_edit_call_log_on_contact,
);
contact_router.post(
  "/:contact_id/call_log/delete/:call_log_id",
  handle_delete_call_log_from_contact,
);

/* ================= FILE ROUTES ================= */
contact_router.post("/:contact_id/files/add", handle_add_file_to_contact);
contact_router.post(
  "/:contact_id/files/edit/:file_id",
  handle_edit_file_on_contact,
);
contact_router.post(
  "/:contact_id/files/delete/:file_id",
  handle_delete_file_from_contact,
);

export default contact_router;
