import fs from "fs";
import path from "path";

import budget_expense_model from "../../models/accounting/budget_expense.model.js";

const isEmptyValue = (value) => {
  if (value === undefined || value === null) return true;

  if (typeof value === "string") {
    return value.trim() === "";
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }

  return false;
};

const sanitizePayload = (payload) => {
  const cleaned = {};

  for (const [key, value] of Object.entries(payload)) {
    if (!isEmptyValue(value)) {
      cleaned[key] = value;
    }
  }

  return cleaned;
};

export const handle_get_budget_expenses = async (req, res) => {
  try {
    /* ================= FETCH BUDGET EXPENSES ================= */
    const budgetExpenses = await budget_expense_model.find();

    /* ================= RESPONSE ================= */
    return res.status(200).json({
      status: "success",
      message: "Budget expenses fetched successfully.",
      data: budgetExpenses,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_get_budget_expense = async (req, res) => {
  try {
    /* ================= PARAMS ================= */
    const { budget_expense_id } = req.params;

    /* ================= FETCH BUDGET EXPENSE ================= */
    const budgetExpense = await budget_expense_model.findById(expense_id);
    if (!budgetExpense) {
      return res.status(404).json({
        status: "error",
        message: "Budget expense not found.",
      });
    }

    /* ================= RESPONSE ================= */
    return res.status(200).json({
      status: "success",
      message: "Budget expense fetched successfully.",
      data: budgetExpense,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_add_budget_expense = async (req, res) => {
  try {
    /* ================= BODY ================= */
    const { name, category_name, sub_category_name, amount, expense_date } =
      req.body;

    const rawPayload = {
      name,
      category_name,
      sub_category_name,
      amount,
      expense_date,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    /* ================= CREATE BUDGET EXPENSE ================= */
    const budgetExpense = await budget_expense_model.create({
      name: cleanedPayload.name?.trim() || "",
      category_name: cleanedPayload.category_name?.trim() || "",
      sub_category_name: cleanedPayload.sub_category_name?.trim() || "",
      amount: cleanedPayload.amount || 0,
      expense_date: cleanedPayload.expense_date || null,
      attachments: [],
    });

    /* ================= FILE UPLOAD & Move to New Location from Temporary Location ================= */
    const files = req.files?.attachments || [];
    if (files.length > 0) {
      const expenseDir = path.join(
        process.cwd(),
        "uploads/budget_expense",
        budgetExpense._id.toString(),
      );

      fs.mkdirSync(expenseDir, { recursive: true });

      const filePaths = [];

      for (const file of files) {
        const newPath = path.join(expenseDir, file.filename);
        fs.renameSync(file.path, newPath);

        filePaths.push(
          `/uploads/budget_expense/${budgetExpense._id}/${file.filename}`,
        );
      }

      budgetExpense.attachments = filePaths;
      await budgetExpense.save();
    }

    /* ================= RESPONSE ================= */
    return res.status(201).json({
      status: "success",
      message: "Budget expense created successfully.",
      data: budgetExpense,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_edit_budget_expense = async (req, res) => {
  try {
    /* ================= PARAMS ================= */
    const { budget_expense_id } = req.params;

    /* ================= BODY ================= */
    const { name, category_name, sub_category_name, amount, expense_date } =
      req.body;

    const rawPayload = {
      name,
      category_name,
      sub_category_name,
      amount,
      expense_date,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    /* ================= UPDATE BUDGET EXPENSE ================= */
    const budgetExpense = await budget_expense_model.findByIdAndUpdate(
      budget_expense_id,
      {
        name: cleanedPayload.name?.trim() || "",
        category_name: cleanedPayload.category_name?.trim() || "",
        sub_category_name: cleanedPayload.sub_category_name?.trim() || "",
        amount: cleanedPayload.amount || 0,
        expense_date: cleanedPayload.expense_date || null,
      },
      { new: true },
    );

    if (!budgetExpense) {
      return res.status(404).json({
        status: "error",
        message: "Budget expense not found.",
      });
    }

    /* ================= FILE UPLOAD & Move to New Location from Temporary Location ================= */
    const files = req.files?.attachments || [];
    if (files.length > 0) {
      const expenseDir = path.join(
        process.cwd(),
        "uploads/budget_expense",
        budgetExpense._id.toString(),
      );

      fs.mkdirSync(expenseDir, { recursive: true });

      const filePaths = [];

      for (const file of files) {
        const newPath = path.join(expenseDir, file.filename);
        fs.renameSync(file.path, newPath);

        filePaths.push(
          `/uploads/budget_expense/${budgetExpense._id}/${file.filename}`,
        );
      }

      budgetExpense.attachments = filePaths;
      await budgetExpense.save();
    }

    /* ================= RESPONSE ================= */
    return res.status(200).json({
      status: "success",
      message: "Budget expense updated successfully.",
      data: budgetExpense,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_delete_budget_expense = async (req, res) => {
  try {
    /* ================= PARAMS ================= */
    const { budget_expense_id } = req.params;

    /* ================= DELETE BUDGET EXPENSE ================= */
    const budgetExpense =
      await budget_expense_model.findByIdAndDelete(budget_expense_id);

    if (!budgetExpense) {
      return res.status(404).json({
        status: "error",
        message: "Budget expense not found.",
      });
    }

    /* ================= RESPONSE ================= */
    return res.status(200).json({
      status: "success",
      message: "Budget expense deleted successfully.",
      data: budgetExpense,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};
