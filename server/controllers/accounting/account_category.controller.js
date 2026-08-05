import account_category_model from "../../models/accounting/account_category.model.js";

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

export const handle_get_account_categories = async (req, res) => {
  try {
    const account_categories = await account_category_model.find();

    return res.status(200).json({
      status: "success",
      message: "Account categories fetched successfully",
      data: account_categories,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching account categories",
      error: error.message,
    });
  }
};

export const handle_get_account_category = async (req, res) => {
  try {
    const { account_category_id } = req.params;

    const account_category =
      await account_category_model.findById(account_category_id);
    if (!account_category) {
      return res.status(404).json({
        status: "error",
        message: "Account category not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Account category fetched successfully",
      data: account_category,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching account category",
      error: error.message,
    });
  }
};

export const handle_add_account_category = async (req, res) => {
  try {
    const { category_name, sub_category_name } = req.body;

    const rawPayload = {
      category_name,
      sub_category_name,
    };

    const payload = sanitizePayload(rawPayload);

    const new_account_category = await account_category_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Account category added successfully",
      data: new_account_category,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding account category",
      error: error.message,
    });
  }
};

export const handle_edit_account_category = async (req, res) => {
  try {
    const { account_category_id } = req.params;
    const { category_name, sub_category_name } = req.body;

    const rawPayload = {
      category_name,
      sub_category_name,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_account_category =
      await account_category_model.findByIdAndUpdate(
        account_category_id,
        payload,
        {
          new: true,
        },
      );

    if (!updated_account_category) {
      return res.status(404).json({
        status: "error",
        message: "Account category not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Account category updated successfully",
      data: updated_account_category,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating account category",
      error: error.message,
    });
  }
};

export const handle_delete_account_category = async (req, res) => {
  try {
    const { account_category_id } = req.params;

    const deleted_account_category =
      await account_category_model.findByIdAndDelete(account_category_id);

    if (!deleted_account_category) {
      return res.status(404).json({
        status: "error",
        message: "Account category not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Account category deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting account category",
      error: error.message,
    });
  }
};