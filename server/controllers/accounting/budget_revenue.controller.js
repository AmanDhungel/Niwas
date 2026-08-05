import fs from "fs";
import path from "path";

import budget_revenue_model from "../../models/accounting/budget_revenue.model.js";

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

export const handle_get_budget_revenues = async (req, res) => {
  try {
    /* ================= FETCH BUDGET REVENUES ================= */
    const budgetRevenues = await budget_revenue_model.find();

    /* ================= RESPONSE ================= */
    return res.status(200).json({
      status: "success",
      message: "Budget revenues fetched successfully.",
      data: budgetRevenues,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_get_budget_revenue = async (req, res) => {
  try {
    /* ================= PARAMS ================= */
    const { budget_revenue_id } = req.params;

    /* ================= FETCH BUDGET REVENUE ================= */
    const budgetRevenue =
      await budget_revenue_model.findById(budget_revenue_id);
    if (!budgetRevenue) {
      return res.status(404).json({
        status: "error",
        message: "Budget revenue not found.",
      });
    }

    /* ================= RESPONSE ================= */
    return res.status(200).json({
      status: "success",
      message: "Budget revenue fetched successfully.",
      data: budgetRevenue,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_add_budget_revenue = async (req, res) => {
  try {
    /* ================= BODY ================= */
    const { name, category_name, sub_category_name, amount, revenue_date } =
      req.body;

    const rawPayload = {
      name,
      category_name,
      sub_category_name,
      amount,
      revenue_date,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    /* ================= CREATE BUDGET REVENUE ================= */
    const budgetRevenue = await budget_revenue_model.create({
      name: cleanedPayload.name?.trim() || "",
      category_name: cleanedPayload.category_name?.trim() || "",
      sub_category_name: cleanedPayload.sub_category_name?.trim() || "",
      amount: cleanedPayload.amount || 0,
      revenue_date: cleanedPayload.revenue_date || null,
      attachments: [],
    });

    /* ================= FILE UPLOAD & Move to New Location from Temporary Location ================= */
    const files = req.files?.attachments || [];

    if (files.length > 0) {
      const revenueDir = path.join(
        process.cwd(),
        "uploads/budget_revenue",
        budgetRevenue._id.toString(),
      );

      fs.mkdirSync(revenueDir, { recursive: true });

      const filePaths = [];

      for (const file of files) {
        const newPath = path.join(revenueDir, file.filename);
        fs.renameSync(file.path, newPath);

        filePaths.push(
          `/uploads/budget_revenue/${budgetRevenue._id}/${file.filename}`,
        );
      }

      budgetRevenue.attachments = filePaths;
      await budgetRevenue.save();
    }

    /* ================= RESPONSE ================= */
    return res.status(201).json({
      status: "success",
      message: "Budget revenue created successfully.",
      data: budgetRevenue,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_edit_budget_revenue = async (req, res) => {
  try {
    /* ================= PARAMS ================= */
    const { budget_revenue_id } = req.params;

    /* ================= BODY ================= */
    const { name, category_name, sub_category_name, amount, revenue_date } =
      req.body;

    const rawPayload = {
      name,
      category_name,
      sub_category_name,
      amount,
      revenue_date,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    /* ================= UPDATE BUDGET REVENUE ================= */
    const budgetRevenue = await budget_revenue_model.findByIdAndUpdate(
      budget_revenue_id,
      {
        name: cleanedPayload.name?.trim() || "",
        category_name: cleanedPayload.category_name?.trim() || "",
        sub_category_name: cleanedPayload.sub_category_name?.trim() || "",
        amount: cleanedPayload.amount || 0,
        revenue_date: cleanedPayload.revenue_date || null,
      },
      { new: true },
    );

    if (!budgetRevenue) {
      return res.status(404).json({
        status: "error",
        message: "Budget revenue not found.",
      });
    }

    /* ================= FILE UPLOAD & Move to New Location from Temporary Location ================= */
    const files = req.files?.attachments || [];
    if (files.length > 0) {
      const revenueDir = path.join(
        process.cwd(),
        "uploads/budget_revenue",
        budgetRevenue._id.toString(),
      );

      fs.mkdirSync(revenueDir, { recursive: true });

      const filePaths = [];

      for (const file of files) {
        const newPath = path.join(revenueDir, file.filename);
        fs.renameSync(file.path, newPath);

        filePaths.push(
          `/uploads/budget_revenue/${budgetRevenue._id}/${file.filename}`,
        );
      }

      budgetRevenue.attachments = filePaths;
      await budgetRevenue.save();
    }

    /* ================= RESPONSE ================= */
    return res.status(200).json({
      status: "success",
      message: "Budget revenue updated successfully.",
      data: budgetRevenue,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_delete_budget_revenue = async (req, res) => {
  try {
    /* ================= PARAMS ================= */
    const { budget_revenue_id } = req.params;

    /* ================= DELETE BUDGET REVENUE ================= */
    const budgetRevenue =
      await budget_revenue_model.findByIdAndDelete(budget_revenue_id);

    if (!budgetRevenue) {
      return res.status(404).json({
        status: "error",
        message: "Budget revenue not found.",
      });
    }

    /* ================= RESPONSE ================= */
    return res.status(200).json({
      status: "success",
      message: "Budget revenue deleted successfully.",
      data: budgetRevenue,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};