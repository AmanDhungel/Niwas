import express from "express";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import {
  handle_add_user,
  handle_edit_user,
  handle_get_user,
  handle_get_users,
  handle_suspend_user,
  handle_unsuspend_user,
} from "../controllers/user.controller.js";

const userPhotoUpload = multer({
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "../uploads/temporary/users/",
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${nanoid(32)}${ext}`);
    },
  }),
});

const userPhotoErrorHandler = (err, req, res, next) => {
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File size limit of 2MB exceeded!" });
    }
    return res.status(400).json({ message: err.message });
  }
  next();
};

const user_router = express.Router();

user_router.get("/", handle_get_users);

user_router.get("/user/:user_id", handle_get_user);

user_router.post(
  "/add",
  userPhotoUpload.single("photo"),
  userPhotoErrorHandler,
  handle_add_user,
);

user_router.post(
  "/edit/:user_id",
  userPhotoUpload.single("photo"),
  userPhotoErrorHandler,
  handle_edit_user,
);

user_router.post("/suspend_user", handle_suspend_user);

user_router.post("/unsuspend_user", handle_unsuspend_user);

export default user_router;
