import express from "express";
import multer from "multer";
import {
  handle_get_policies,
  handle_get_policy,
  handle_add_policy,
  handle_edit_policy,
  handle_delete_policy,
} from "../../controllers/hrm/policy.controller.js";

const policy_router = express.Router();

const upload = multer({ dest: "uploads/tmp/" });

policy_router.get("/", handle_get_policies);
policy_router.get("/:policy_id", handle_get_policy);

policy_router.post(
  "/add",
  upload.fields([{ name: "files" }]),
  handle_add_policy,
);

policy_router.post(
  "/edit/:policy_id",
  upload.fields([{ name: "files" }]),
  handle_edit_policy,
);

policy_router.post("/delete/:policy_id", handle_delete_policy);

export default policy_router;
