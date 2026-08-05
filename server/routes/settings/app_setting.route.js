import express from "express";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import {
  handle_get_salary_settings,
  handle_update_salary_settings,
  handle_get_approval_settings,
  handle_update_approval_settings,
  handle_get_invoice_settings,
  handle_update_invoice_settings,
  handle_get_leave_types,
  handle_add_leave_type,
  handle_edit_leave_type,
  handle_delete_leave_type,
  handle_get_custom_fields,
  handle_add_custom_field,
  handle_edit_custom_field,
  handle_delete_custom_field,
} from "../../controllers/settings/app_setting.controller.js";

const invoiceLogoUpload = multer({
  limits: { fileSize: 5_000_000 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg|svg)$/)) {
      return cb(
        new Error("Only image files (png, jpg, jpeg, svg) are allowed!"),
        false,
      );
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "./uploads/temporary/app_setting/",
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${nanoid(32)}${ext}`);
    },
  }),
});

const invoiceLogoErrorHandler = (err, req, res, next) => {
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

const app_setting_router = express.Router();

app_setting_router.get("/salary", handle_get_salary_settings);

app_setting_router.post("/salary", handle_update_salary_settings);

app_setting_router.get("/approval", handle_get_approval_settings);

app_setting_router.post("/approval", handle_update_approval_settings);

app_setting_router.get("/invoice", handle_get_invoice_settings);

app_setting_router.post(
  "/invoice",
  invoiceLogoUpload.fields([{ name: "logo", maxCount: 1 }]),
  invoiceLogoErrorHandler,
  handle_update_invoice_settings,
);

app_setting_router.get("/leave", handle_get_leave_types);

app_setting_router.post("/leave/add", handle_add_leave_type);

app_setting_router.post("/leave/edit/:leave_type_id", handle_edit_leave_type);

app_setting_router.post(
  "/leave/delete/:leave_type_id",
  handle_delete_leave_type,
);

app_setting_router.get("/custom-field", handle_get_custom_fields);

app_setting_router.post("/custom-field/add", handle_add_custom_field);

app_setting_router.post(
  "/custom-field/edit/:custom_field_id",
  handle_edit_custom_field,
);

app_setting_router.post(
  "/custom-field/delete/:custom_field_id",
  handle_delete_custom_field,
);

export default app_setting_router;
