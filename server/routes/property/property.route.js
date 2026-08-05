import express from "express";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import {
  handle_get_properties,
  handle_get_property_by_id,
  handle_property_quick_setup,
  handle_property_complete_creation,
  handle_delete_property,
  handle_edit_property_complete,
  handle_edit_property_quick_setup,
  handle_save_property_draft,
  handle_update_property_draft,
  handle_publish_draft,
} from "../../controllers/property/property.controller.js";

const propertyFileUpload = multer({
  limits: { fileSize: 10_000_000 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg|mp4|mov)$/)) {
      return cb(new Error("Only image or video files are allowed !"), false);
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "./uploads/temporary/property/",
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${nanoid(32)}${ext}`);
    },
  }),
});

const propertyFileSizeErrorHandler = (err, req, res, next) => {
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

const ALL_FIELDS = [
  { name: "property_photos", maxCount: 20 },
  { name: "property_videos", maxCount: 10 },
  { name: "floor_plans_and_layouts", maxCount: 10 },
  { name: "legal_documents", maxCount: 10 },
  { name: "insurance_papers", maxCount: 10 },
  { name: "furniture_images", maxCount: 20 },
  { name: "floor_images", maxCount: 20 },
];

const QUICK_FIELDS = [
  { name: "property_photos", maxCount: 10 },
  { name: "property_videos", maxCount: 5 },
  { name: "floor_plans_and_layouts", maxCount: 5 },
  { name: "legal_documents", maxCount: 5 },
  { name: "insurance_papers", maxCount: 5 },
];

const property_router = express.Router();

// Fetch
property_router.get("/", handle_get_properties); // ?draft=true|false|omit
property_router.get("/:property_id", handle_get_property_by_id);

// Quick setup
property_router.post(
  "/quick_setup",
  propertyFileUpload.fields(QUICK_FIELDS),
  propertyFileSizeErrorHandler,
  handle_property_quick_setup,
);

property_router.post(
  "/edit/quick_setup/:property_id",
  propertyFileUpload.fields(QUICK_FIELDS),
  propertyFileSizeErrorHandler,
  handle_edit_property_quick_setup,
);

// Complete creation
property_router.post(
  "/complete",
  propertyFileUpload.fields(ALL_FIELDS),
  propertyFileSizeErrorHandler,
  handle_property_complete_creation,
);

property_router.post(
  "/edit/complete/:property_id",
  propertyFileUpload.fields(ALL_FIELDS),
  propertyFileSizeErrorHandler,
  handle_edit_property_complete,
);

// Draft
property_router.post(
  "/draft",
  propertyFileUpload.fields(ALL_FIELDS),
  propertyFileSizeErrorHandler,
  handle_save_property_draft,
);

property_router.post(
  "/draft/update/:property_id",
  propertyFileUpload.fields(ALL_FIELDS),
  propertyFileSizeErrorHandler,
  handle_update_property_draft,
);

property_router.post("/draft/publish/:property_id", handle_publish_draft);

// Delete
property_router.post("/delete/:property_id", handle_delete_property);

export default property_router;
