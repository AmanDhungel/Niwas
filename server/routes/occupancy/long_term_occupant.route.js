import express from "express";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import {
  handle_get_long_term_occupants,
  handle_get_long_term_occupant,
  handle_add_long_term_occupant,
  handle_edit_long_term_occupant,
  handle_delete_long_term_occupant,
  handle_update_long_term_occupant_status,
} from "../../controllers/occupancy/long_term_occupant.controller.js";

const longTermOccupantFileUpload = multer({
  limits: { fileSize: 16_000_000 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg|pdf)$/)) {
      return cb(new Error("Only image or PDF files are allowed !"), false);
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "./uploads/temporary/long_term_occupant/",
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${nanoid(32)}${ext}`);
    },
  }),
});

const longTermOccupantFileSizeErrorHandler = (err, req, res, next) => {
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File size limit of 16MB exceeded !" });
    }
    return res.status(400).json({ message: err.message });
  }
  next();
};

const long_term_occupant_router = express.Router();

long_term_occupant_router.get("/", handle_get_long_term_occupants);

long_term_occupant_router.get("/:occupant_id", handle_get_long_term_occupant);

long_term_occupant_router.post(
  "/add",
  longTermOccupantFileUpload.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "government_id", maxCount: 1 },
    { name: "proof_of_income", maxCount: 1 },
    { name: "health_certificate", maxCount: 1 },
  ]),
  longTermOccupantFileSizeErrorHandler,
  handle_add_long_term_occupant,
);

long_term_occupant_router.post(
  "/edit/:occupant_id",
  longTermOccupantFileUpload.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "government_id", maxCount: 1 },
    { name: "proof_of_income", maxCount: 1 },
    { name: "health_certificate", maxCount: 1 },
  ]),
  longTermOccupantFileSizeErrorHandler,
  handle_edit_long_term_occupant,
);

long_term_occupant_router.post(
  "/delete/:occupant_id",
  handle_delete_long_term_occupant,
);
long_term_occupant_router.post(
  "/update_status/:occupant_id",
  handle_update_long_term_occupant_status,
);

export default long_term_occupant_router;
