import express from "express";
import {
  handle_google_signin,
  handle_signin,
  handle_signup,
  handle_update_user,
  handle_user_logout,
  handle_verify_user_token,
} from "../controllers/auth.controllers.js";
// import { check_auth } from "../middlewares/auth.middlewares.js";
import multer from "multer";
import { nanoid } from "nanoid";
import path from "path";

const userFileUpload = multer({
  dest: "../uploads/temporary/user/",
  limits: { fileSize: 1000000 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("Only image files are allowed !"), false);
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "../uploads/temporary/user/",
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const randomName = `${nanoid(32)}`;
      cb(null, randomName + ext);
    },
  }),
});

const userFileSizeErrorHandler = (err, req, res, next) => {
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ message: "File size limit of 1MB exceeded !" });
    } else {
      res.status(400).json({ message: err.message });
    }
  } else {
    next();
  }
};

const auth_router = express.Router();

auth_router.post("/signup", handle_signup);

auth_router.post("/signin", handle_signin);

auth_router.post("/verify_token", handle_verify_user_token);

auth_router.get("/logout", handle_user_logout);

auth_router.post("/google", handle_google_signin);

auth_router.post(
  "/update_user",
  // check_auth,
  userFileUpload.single("new_user_image"),
  userFileSizeErrorHandler,
  handle_update_user
);

export default auth_router;
