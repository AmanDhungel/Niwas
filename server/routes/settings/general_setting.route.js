import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  handle_change_password,
  handle_deactivate_account,
  handle_delete_account,
  handle_get_notification_settings,
  handle_get_profile_settings,
  handle_update_notification_settings,
  handle_update_profile_settings,
} from "../../controllers/settings/general_setting.controller.js";

const temp_dir = "temp/uploads";
if (!fs.existsSync(temp_dir)) fs.mkdirSync(temp_dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, temp_dir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

const general_setting_router = express.Router();

general_setting_router.get("/profile", handle_get_profile_settings);

general_setting_router.post(
  "/profile",
  upload.fields([{ name: "photo", maxCount: 1 }]),
  handle_update_profile_settings,
);

general_setting_router.get("/notifications", handle_get_notification_settings);

general_setting_router.post(
  "/notifications",
  handle_update_notification_settings,
);

general_setting_router.post("/change_password", handle_change_password);

general_setting_router.post("/delete_account", handle_delete_account);

general_setting_router.post("/deactivate_account", handle_deactivate_account);

export default general_setting_router;
