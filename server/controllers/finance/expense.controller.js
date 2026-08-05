import expense_model from "../../models/finance/expense.model.js";

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

export const handle_get_expenses = async (req, res) => {
  try {
    const expenses = await expense_model.find();

    return res.status(200).json({
      status: "success",
      message: "Expenses fetched successfully",
      data: expenses,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching expenses",
      error: error.message,
    });
  }
};

export const handle_get_expense = async (req, res) => {
  try {
    const { expense_id } = req.params;

    const expense = await expense_model.findById(expense_id);
    if (!expense) {
      return res.status(404).json({
        status: "error",
        message: "Expense not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Expense fetched successfully",
      data: expense,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching expense",
      error: error.message,
    });
  }
};

export const handle_add_expense = async (req, res) => {
  try {
    const { name, amount, date, payment_method } = req.body;

    const rawPayload = {
      name,
      amount,
      date,
      payment_method,
    };

    const payload = sanitizePayload(rawPayload);

    const new_expense = await expense_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Expense added successfully",
      data: new_expense,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding expense",
      error: error.message,
    });
  }
};

export const handle_edit_expense = async (req, res) => {
  try {
    const { expense_id } = req.params;
    const { name, amount, date, payment_method } = req.body;

    const rawPayload = {
      name,
      amount,
      date,
      payment_method,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_expense = await expense_model.findByIdAndUpdate(
      expense_id,
      payload,
      {
        new: true,
      },
    );

    if (!updated_expense) {
      return res.status(404).json({
        status: "error",
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Expense updated successfully",
      data: updated_expense,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating expense",
      error: error.message,
    });
  }
};

export const handle_delete_expense = async (req, res) => {
  try {
    const { expense_id } = req.params;

    const deleted_expense = await expense_model.findByIdAndDelete(expense_id);

    if (!deleted_expense) {
      return res.status(404).json({
        status: "error",
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Expense deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting expense",
      error: error.message,
    });
  }
};