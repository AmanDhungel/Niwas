import express from "express";
import {
  handle_create_email_setting,
  handle_get_email_settings,
  handle_get_single_email_setting,
  handle_update_email_setting,
  handle_delete_email_setting,
} from "../../controllers/application/email_setting.controller.js";

const email_setting_router = express.Router();

email_setting_router.post("/create", handle_create_email_setting);

email_setting_router.get("/", handle_get_email_settings);

email_setting_router.get("/:email_setting_id", handle_get_single_email_setting);

email_setting_router.post("/update/:email_setting_id", handle_update_email_setting);

email_setting_router.delete("/delete/:email_setting_id", handle_delete_email_setting);

export default email_setting_router;