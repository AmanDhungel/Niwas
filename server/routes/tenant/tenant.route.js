import express from "express";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import {
  handle_get_tenants,
  handle_get_tenant,
  handle_add_tenant,
  handle_edit_tenant,
  handle_delete_tenant,
} from "../../controllers/tenant/tenant.controller.js";

const tenantFileUpload = multer({
  limits: { fileSize: 10_000_000 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("Only image files are allowed !"), false);
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "./uploads/temporary/tenant/",
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${nanoid(32)}${ext}`);
    },
  }),
});

const tenantFileSizeErrorHandler = (err, req, res, next) => {
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File size limit of 10MB exceeded !" });
    }
    return res.status(400).json({ message: err.message });
  }
  next();
};

const tenant_router = express.Router();

tenant_router.get("/", handle_get_tenants);

tenant_router.get("/:tenant_id", handle_get_tenant);

tenant_router.post(
  "/add",
  tenantFileUpload.fields([{ name: "profile_image", maxCount: 1 }]),
  tenantFileSizeErrorHandler,
  handle_add_tenant,
);

tenant_router.post(
  "/edit/:tenant_id",
  tenantFileUpload.fields([{ name: "profile_image", maxCount: 1 }]),
  tenantFileSizeErrorHandler,
  handle_edit_tenant,
);

tenant_router.post("/delete/:tenant_id", handle_delete_tenant);

export default tenant_router;
