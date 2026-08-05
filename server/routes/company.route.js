import express from "express";
import multer from "multer";
import {
  handle_get_companies,
  handle_get_company,
  handle_add_company,
  handle_edit_company,
  handle_delete_company,
  handle_add_note_to_company,
  handle_edit_note_on_company,
  handle_delete_note_from_company,
  handle_add_call_log_to_company,
  handle_edit_call_log_on_company,
  handle_delete_call_log_from_company,
} from "../controllers/company.controller.js";
import check_permission_policy from "../middlewares/permission_policy.middleware.js";

const company_router = express.Router();

const upload = multer({ dest: "uploads/tmp/" });

/* ================= COMPANY ROUTES ================= */
company_router.get("/", handle_get_companies);
company_router.get("/:company_id", handle_get_company);

company_router.post(
  "/add",
  check_permission_policy({
    policies: "create:cem_company",
  }),
  upload.single("image"),
  handle_add_company,
);

company_router.post(
  "/edit/:company_id",
  upload.single("image"),
  handle_edit_company,
);

company_router.post("/delete/:company_id", handle_delete_company);

/* ================= NOTE ROUTES ================= */
company_router.post(
  "/:company_id/notes/add",
  upload.fields([{ name: "attachments" }]),
  handle_add_note_to_company,
);

company_router.post(
  "/:company_id/notes/edit/:note_id",
  upload.fields([{ name: "attachments" }]),
  handle_edit_note_on_company,
);

company_router.post(
  "/:company_id/notes/delete/:note_id",
  handle_delete_note_from_company,
);

/* ================= CALL LOG ROUTES ================= */
company_router.post(
  "/:company_id/call_log/add",
  handle_add_call_log_to_company,
);

company_router.post(
  "/:company_id/call_log/edit/:call_log_id",
  handle_edit_call_log_on_company,
);

company_router.post(
  "/:company_id/call_log/delete/:call_log_id",
  handle_delete_call_log_from_company,
);

export default company_router;
