import express from "express";
// import {
//   handle_add_policy,
//   handle_get_policies,
//   handle_get_policy,
// } from "../../controllers/hrm/policy.controller.js";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import {
  handle_add_budget_expense,
  handle_delete_budget_expense,
  handle_edit_budget_expense,
  handle_get_budget_expense,
  handle_get_budget_expenses,
} from "../../controllers/accounting/budget_expense.controller.js";

const budgetExpenseFileUpload = multer({
  limits: { fileSize: 1000000 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("Only image files are allowed !"), false);
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "../uploads/temporary/budget_expense/",
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const randomName = `${nanoid(32)}`;
      cb(null, randomName + ext);
    },
  }),
});

const budgetExpenseFileSizeErrorHandler = (err, req, res, next) => {
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

const budget_expense_router = express.Router();

budget_expense_router.get("/", handle_get_budget_expenses);

budget_expense_router.get(
  "/budget_expense/:budget_expense_id",
  handle_get_budget_expense,
);

budget_expense_router.post(
  "/add",
  budgetExpenseFileUpload.fields([{ name: "attachments", maxCount: 10 }]),
  budgetExpenseFileSizeErrorHandler,
  handle_add_budget_expense,
);

budget_expense_router.post(
  "/edit/:budget_expense_id",
  budgetExpenseFileUpload.fields([{ name: "attachments", maxCount: 10 }]),
  budgetExpenseFileSizeErrorHandler,
  handle_edit_budget_expense,
);

budget_expense_router.post(
  "/delete/:budget_expense_id",
  handle_delete_budget_expense,
);

// budget_expense_router.post(
//   "/add",
//   policyFileUpload.fields([{ name: "files", maxCount: 10 }]),
//   policyFileSizeErrorHandler,
//   handle_add_policy,
// );

// budget_expense_router.get("/", handle_get_policies);

// budget_expense_router.get("/:policy_id", handle_get_policy);

export default budget_expense_router;
