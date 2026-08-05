import tax_model from "../../models/finance/tax.model.js";

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

export const handle_get_taxes = async (req, res) => {
  try {
    const taxes = await tax_model.find();

    return res.status(200).json({
      status: "success",
      message: "Taxes fetched successfully",
      data: taxes,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching taxes",
      error: error.message,
    });
  }
};

export const handle_get_tax = async (req, res) => {
  try {
    const { tax_id } = req.params;

    const tax = await tax_model.findById(tax_id);
    if (!tax) {
      return res.status(404).json({
        status: "error",
        message: "Tax not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Tax fetched successfully",
      data: tax,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching tax",
      error: error.message,
    });
  }
};

export const handle_add_tax = async (req, res) => {
  try {
    const { name, percentage, description } = req.body;

    const rawPayload = {
      name,
      percentage,
      description,
    };

    const payload = sanitizePayload(rawPayload);

    const new_tax = await tax_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Tax added successfully",
      data: new_tax,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding tax",
      error: error.message,
    });
  }
};

export const handle_edit_tax = async (req, res) => {
  try {
    const { tax_id } = req.params;
    const { name, percentage, description } = req.body; 

    const rawPayload = {
      name,
      percentage,
      description,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_tax = await tax_model.findByIdAndUpdate(tax_id, payload, {
      new: true,
    });

    if (!updated_tax) {
      return res.status(404).json({
        status: "error",
        message: "Tax not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Tax updated successfully",
      data: updated_tax,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating tax",
      error: error.message,
    });
  }
};

export const handle_delete_tax = async (req, res) => {
  try {
    const { tax_id } = req.params;

    const deleted_tax = await tax_model.findByIdAndDelete(tax_id);

    if (!deleted_tax) {
      return res.status(404).json({
        status: "error",
        message: "Tax not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Tax deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting tax",
      error: error.message,
    });
  }
};