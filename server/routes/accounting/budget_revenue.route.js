import express from "express";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import {
  handle_add_budget_revenue,
  handle_delete_budget_revenue,
  handle_edit_budget_revenue,
  handle_get_budget_revenue,
  handle_get_budget_revenues,
} from "../../controllers/accounting/budget_revenue.controller.js";

const budgetRevenueFileUpload = multer({
  limits: { fileSize: 1000000 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("Only image files are allowed !"), false);
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "../uploads/temporary/budget_revenue/",
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const randomName = `${nanoid(32)}`;
      cb(null, randomName + ext);
    },
  }),
});

const budgetRevenueFileSizeErrorHandler = (err, req, res, next) => {
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

const budget_revenue_router = express.Router();

budget_revenue_router.get("/", handle_get_budget_revenues);

budget_revenue_router.get(
  "/budget_revenue/:budget_revenue_id",
  handle_get_budget_revenue,
);

budget_revenue_router.post(
  "/add",
  budgetRevenueFileUpload.fields([{ name: "attachments", maxCount: 10 }]),
  budgetRevenueFileSizeErrorHandler,
  handle_add_budget_revenue,
);

budget_revenue_router.post(
  "/edit/:budget_revenue_id",
  budgetRevenueFileUpload.fields([{ name: "attachments", maxCount: 10 }]),
  budgetRevenueFileSizeErrorHandler,
  handle_edit_budget_revenue,
);

budget_revenue_router.post(
  "/delete/:budget_revenue_id",
  handle_delete_budget_revenue,
);

export default budget_revenue_router;
