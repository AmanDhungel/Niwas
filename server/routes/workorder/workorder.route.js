import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  handle_get_workorders,
  handle_get_workorder,
  handle_add_workorder,
  handle_edit_workorder,
  handle_delete_workorder,
} from "../../controllers/workorder/workorder.controller.js";

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

const workorder_photo_upload = upload.fields([
  { name: "before_photos", maxCount: 10 },
  { name: "after_photos", maxCount: 10 },
]);

const workorder_router = express.Router();

workorder_router.get("/", handle_get_workorders);
workorder_router.get("/:workorder_id", handle_get_workorder);
workorder_router.post("/add", workorder_photo_upload, handle_add_workorder);
workorder_router.post(
  "/edit/:workorder_id",
  workorder_photo_upload,
  handle_edit_workorder,
);
workorder_router.post("/delete/:workorder_id", handle_delete_workorder);

export default workorder_router;
