import budget_model from "../../models/accounting/budget.model.js";

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

export const handle_get_budgets = async (req, res) => {
  try {
    const budgets = await budget_model.find();

    return res.status(200).json({
      status: "success",
      message: "Budgets fetched successfully",
      data: budgets,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching budgets",
      error: error.message,
    });
  }
};

export const handle_get_budget = async (req, res) => {
  try {
    const { budget_id } = req.params;

    const budget = await budget_model.findById(budget_id);
    if (!budget) {
      return res.status(404).json({
        status: "error",
        message: "Budget not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Budget fetched successfully",
      data: budget,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching budget",
      error: error.message,
    });
  }
};

export const handle_add_budget = async (req, res) => {
  try {
    const {
      title,
      respect_type,
      start_date,
      end_date,
      expected_revenues,
      overall_revenue,
      expected_expenses,
      overall_expense,
      expected_profit,
      tax,
      budget_amount,
    } = req.body;

    const rawPayload = {
      title,
      respect_type,
      start_date,
      end_date,
      expected_revenues: JSON.parse(expected_revenues) || [],
      overall_revenue,
      expected_expenses: JSON.parse(expected_expenses) || [],
      overall_expense,
      expected_profit,
      tax,
      budget_amount,
    };

    const payload = sanitizePayload(rawPayload);

    const new_budget = await budget_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Budget added successfully",
      data: new_budget,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding budget",
      error: error.message,
    });
  }
};

export const handle_edit_budget = async (req, res) => {
  try {
    const { budget_id } = req.params;
    const {
      title,
      respect_type,
      start_date,
      end_date,
      expected_revenues,
      overall_revenue,
      expected_expenses,
      overall_expense,
      expected_profit,
      tax,
      budget_amount,
    } = req.body;

    const rawPayload = {
      title,
      respect_type,
      start_date,
      end_date,
      expected_revenues: JSON.parse(expected_revenues) || [],
      overall_revenue,
      expected_expenses: JSON.parse(expected_expenses) || [],
      overall_expense,
      expected_profit,
      tax,
      budget_amount,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_budget = await budget_model.findByIdAndUpdate(
      budget_id,
      payload,
      {
        new: true,
      },
    );

    if (!updated_budget) {
      return res.status(404).json({
        status: "error",
        message: "Budget not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Budget updated successfully",
      data: updated_budget,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating budget",
      error: error.message,
    });
  }
};

export const handle_delete_budget = async (req, res) => {
  try {
    const { budget_id } = req.params;

    const deleted_budget = await budget_model.findByIdAndDelete(budget_id);

    if (!deleted_budget) {
      return res.status(404).json({
        status: "error",
        message: "Budget not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Budget deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting budget",
      error: error.message,
    });
  }
};