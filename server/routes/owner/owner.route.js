import express from "express";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import {
  handle_get_owners,
  handle_get_owner,
  handle_add_owner,
  handle_edit_owner,
  handle_delete_owner,
} from "../../controllers/owner/owner.controller.js";

const ownerFileUpload = multer({
  limits: { fileSize: 10_000_000 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("Only image files are allowed !"), false);
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "./uploads/temporary/owner/",
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${nanoid(32)}${ext}`);
    },
  }),
});

const ownerFileSizeErrorHandler = (err, req, res, next) => {
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size limit of 10MB exceeded !" });
    }
    return res.status(400).json({ message: err.message });
  }
  next();
};

const owner_router = express.Router();

owner_router.get("/", handle_get_owners);

owner_router.get("/:owner_id", handle_get_owner);

owner_router.post(
  "/add",
  ownerFileUpload.fields([{ name: "profile_image", maxCount: 1 }]),
  ownerFileSizeErrorHandler,
  handle_add_owner,
);

owner_router.post(
  "/edit/:owner_id",
  ownerFileUpload.fields([{ name: "profile_image", maxCount: 1 }]),
  ownerFileSizeErrorHandler,
  handle_edit_owner,
);

owner_router.post("/delete/:owner_id", handle_delete_owner);

export default owner_router;