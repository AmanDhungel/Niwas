import express from "express";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import {
  handle_get_gdpr_cookies,
  handle_update_gdpr_cookies,
  handle_get_maintenance_mode,
  handle_update_maintenance_mode,
  handle_get_otp_settings,
  handle_update_otp_settings,
} from "../../controllers/settings/system_setting.controller.js";

const maintenanceImageUpload = multer({
  limits: { fileSize: 5_000_000 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg|svg|webp)$/)) {
      return cb(
        new Error("Only image files (png, jpg, jpeg, svg, webp) are allowed!"),
        false,
      );
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "./uploads/temporary/system_setting/",
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${nanoid(32)}${ext}`);
    },
  }),
});

const maintenanceImageErrorHandler = (err, req, res, next) => {
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File size limit of 5MB exceeded!" });
    }
    return res.status(400).json({ message: err.message });
  }
  next();
};

const system_setting_router = express.Router();

system_setting_router.get("/gdpr-cookies", handle_get_gdpr_cookies);

system_setting_router.post("/gdpr-cookies", handle_update_gdpr_cookies);

system_setting_router.get("/maintenance-mode", handle_get_maintenance_mode);

system_setting_router.post(
  "/maintenance-mode",
  maintenanceImageUpload.fields([{ name: "image", maxCount: 1 }]),
  maintenanceImageErrorHandler,
  handle_update_maintenance_mode,
);

system_setting_router.get("/otp", handle_get_otp_settings);

system_setting_router.post("/otp", handle_update_otp_settings);

export default system_setting_router;
