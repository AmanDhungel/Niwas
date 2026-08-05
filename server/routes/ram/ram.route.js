import multer from "multer";
import { nanoid } from "nanoid";
import path from "path";
import express from "express";
import {
  handle_create_ram,
  handle_get_ram,
  handle_get_rams,
} from "../../controllers/ram/ram.controller.js";

const ramFileUpload = multer({
  limits: { fileSize: 1000000 }, // 1MB
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/i)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "../uploads/temporary/ram/",
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${nanoid(32)}${ext}`);
    },
  }),
});

const ramFileSizeErrorHandler = (err, req, res, next) => {
  if (!err) return next();

  if (err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(400)
      .json({ status: "error", message: "File size limit of 1MB exceeded!" });
  }

  return res.status(400).json({
    status: "error",
    message: err.message,
  });
};

const ram_router = express.Router();

ram_router.get("/", handle_get_rams);

ram_router.get("/:ram_id", handle_get_ram);

ram_router.post(
  "/create",
  ramFileUpload.array("attachment_file", 5),
  ramFileSizeErrorHandler,
  handle_create_ram,
);

export default ram_router;
