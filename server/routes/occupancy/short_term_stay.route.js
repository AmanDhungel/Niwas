import express from "express";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import {
  handle_get_short_term_stays,
  handle_get_short_term_stay,
  handle_add_short_term_stay,
  handle_edit_short_term_stay,
  handle_delete_short_term_stay,
  handle_update_short_term_stay_status,
} from "../../controllers/occupancy/short_term_stay.controller.js";

const shortTermStayFileUpload = multer({
  limits: { fileSize: 10_000_000 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg|pdf)$/)) {
      return cb(new Error("Only image or PDF files are allowed !"), false);
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "./uploads/temporary/occupancy/",
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${nanoid(32)}${ext}`);
    },
  }),
});

const shortTermStayFileSizeErrorHandler = (err, req, res, next) => {
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

const short_term_stay_router = express.Router();

short_term_stay_router.get("/", handle_get_short_term_stays);

short_term_stay_router.get("/:stay_id", handle_get_short_term_stay);

short_term_stay_router.post(
  "/add",
  shortTermStayFileUpload.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "id_document", maxCount: 1 },
    { name: "additional_guest_documents", maxCount: 10 },
  ]),
  shortTermStayFileSizeErrorHandler,
  handle_add_short_term_stay,
);

short_term_stay_router.post(
  "/edit/:stay_id",
  shortTermStayFileUpload.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "id_document", maxCount: 1 },
    { name: "additional_guest_documents", maxCount: 10 },
  ]),
  shortTermStayFileSizeErrorHandler,
  handle_edit_short_term_stay,
);

short_term_stay_router.post("/delete/:stay_id", handle_delete_short_term_stay);
short_term_stay_router.post(
  "/update_status/:stay_id",
  handle_update_short_term_stay_status,
);

export default short_term_stay_router;
