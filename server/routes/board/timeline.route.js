import multer from "multer";
import { nanoid } from "nanoid";
import path from "path";
import express from "express";
import {
  handle_create_timeline,
  handle_get_board_timelines,
} from "../../controllers/board/timeline.controller.js";

const timelineFileUpload = multer({
  limits: { fileSize: 1_000_000 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "./uploads/temporary/timeline/",
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${nanoid(32)}${ext}`);
    },
  }),
});

const timelineFileSizeErrorHandler = (err, req, res, next) => {
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size limit of 1MB exceeded!" });
    }
    return res.status(400).json({ message: err.message });
  }
  next();
};

const timeline_router = express.Router();

timeline_router.post(
  "/create_timeline",
  timelineFileUpload.array("attachment_file", 5),
  timelineFileSizeErrorHandler,
  handle_create_timeline,
);

timeline_router.get(
  "/board_timelines/:board_id/:task_list_id/:task_id",
  handle_get_board_timelines,
);

export default timeline_router;