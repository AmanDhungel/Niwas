import express from "express";
import {
  handle_create_sms_setting,
  handle_get_sms_settings,
  handle_get_single_sms_setting,
  handle_update_sms_setting,
  handle_delete_sms_setting,
} from "../../controllers/application/sms_setting.controller.js";

const sms_setting_router = express.Router();

sms_setting_router.post("/create", handle_create_sms_setting);

sms_setting_router.get("/", handle_get_sms_settings);

sms_setting_router.get("/:sms_setting_id", handle_get_single_sms_setting);

sms_setting_router.post("/update/:sms_setting_id", handle_update_sms_setting);

sms_setting_router.delete("/delete/:sms_setting_id", handle_delete_sms_setting);

export default sms_setting_router;
