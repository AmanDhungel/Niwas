import express from "express";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import {
  handle_get_complaints,
  handle_get_complaint,
  handle_add_complaint,
  handle_edit_complaint,
  handle_delete_complaint,
  handle_get_user_complaints,
  handle_update_complaint_status,
} from "../../controllers/complaint/complaint.controller.js";

const complaintFileUpload = multer({
  limits: { fileSize: 50000000 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (
      !file.originalname.match(
        /\.(png|jpg|jpeg|mp4|mov|mp3|wav|m4a|pdf|doc|docx)$/,
      )
    ) {
      return cb(new Error("File type not allowed"), false);
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "../uploads/temporary/complaint/",
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${nanoid(32)}${ext}`);
    },
  }),
});

const complaintFileSizeErrorHandler = (err, req, res, next) => {
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File size limit of 50MB exceeded!" });
    }
    return res.status(400).json({ message: err.message });
  }
  next();
};

const complaint_router = express.Router();

complaint_router.get("/", handle_get_complaints);

complaint_router.get("/user_complaints", handle_get_user_complaints);

complaint_router.get("/complaint/:complaint_id", handle_get_complaint);

complaint_router.post(
  "/add",
  complaintFileUpload.fields([
    { name: "photos", maxCount: 10 },
    { name: "videos", maxCount: 5 },
    { name: "audios", maxCount: 5 },
    { name: "documents", maxCount: 5 },
  ]),
  complaintFileSizeErrorHandler,
  handle_add_complaint,
);

complaint_router.post(
  "/edit/:complaint_id",
  complaintFileUpload.fields([
    { name: "photos", maxCount: 10 },
    { name: "videos", maxCount: 5 },
    { name: "audios", maxCount: 5 },
    { name: "documents", maxCount: 5 },
  ]),
  complaintFileSizeErrorHandler,
  handle_edit_complaint,
);

complaint_router.post("/delete/:complaint_id", handle_delete_complaint);

complaint_router.post(
  "/update_status/:complaint_id",
  handle_update_complaint_status,
);

export default complaint_router;
