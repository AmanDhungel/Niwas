import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  handle_get_ai_settings,
  handle_get_appearance_settings,
  handle_get_authentication_settings,
  handle_get_business_settings,
  handle_get_localization_settings,
  handle_get_preferences_settings,
  handle_get_prefixes_settings,
  handle_get_seo_settings,
  handle_update_ai_settings,
  handle_update_appearance_settings,
  handle_update_authentication_settings,
  handle_update_business_settings,
  handle_update_localization_settings,
  handle_update_preferences_settings,
  handle_update_prefixes_settings,
  handle_update_seo_settings,
} from "../../controllers/settings/website_setting.controller.js";

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

const website_setting_router = express.Router();

website_setting_router.get("/business", handle_get_business_settings);

website_setting_router.post(
  "/business",
  upload.fields([
    { name: "white_logo", maxCount: 1 },
    { name: "dark_logo", maxCount: 1 },
    { name: "white_mini_logo", maxCount: 1 },
    { name: "dark_mini_logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
    { name: "apple_touch_icon", maxCount: 1 },
  ]),
  handle_update_business_settings,
);

website_setting_router.get("/seo", handle_get_seo_settings);

website_setting_router.post(
  "/seo",
  upload.fields([{ name: "og_image", maxCount: 1 }]),
  handle_update_seo_settings,
);

website_setting_router.get("/localization", handle_get_localization_settings);

website_setting_router.post(
  "/localization",
  handle_update_localization_settings,
);

website_setting_router.get("/prefixes", handle_get_prefixes_settings);

website_setting_router.post("/prefixes", handle_update_prefixes_settings);

website_setting_router.get("/preferences", handle_get_preferences_settings);

website_setting_router.post("/preferences", handle_update_preferences_settings);

website_setting_router.get("/ai", handle_get_ai_settings);

website_setting_router.post("/ai", handle_update_ai_settings);

website_setting_router.get("/authentication", handle_get_authentication_settings);

website_setting_router.post("/authentication", handle_update_authentication_settings);

website_setting_router.get("/appearance", handle_get_appearance_settings);

website_setting_router.post("/appearance", handle_update_appearance_settings);

export default website_setting_router;
