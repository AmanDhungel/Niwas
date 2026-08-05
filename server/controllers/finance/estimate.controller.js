import estimate_model from "../../models/finance/estimate.model.js";
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

export const handle_get_estimates = async (req, res) => {
  try {
    const estimates = await estimate_model
      .find()
      .populate("client")
      .populate("tax");

    return res.status(200).json({
      status: "success",
      message: "Estimates fetched successfully",
      data: estimates,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching estimates",
      error: error.message,
    });
  }
};

export const handle_get_estimate = async (req, res) => {
  try {
    const { estimate_id } = req.params;

    const estimate = await estimate_model
      .findById(estimate_id)
      .populate("client")
      .populate("tax");
    if (!estimate) {
      return res.status(404).json({
        status: "error",
        message: "Estimate not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Estimate fetched successfully",
      data: estimate,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching estimate",
      error: error.message,
    });
  }
};

export const handle_add_estimate = async (req, res) => {
  try {
    const {
      client,
      project,
      email,
      tax,
      client_address,
      billing_address,
      estimate_date,
      expiry_date,
      items,
      total_amount,
      discount_percentage,
      grand_total,
      other_information,
    } = req.body;

    const rawPayload = {
      client,
      project,
      email,
      tax,
      client_address,
      billing_address,
      estimate_date,
      expiry_date,
      items,
      total_amount,
      discount_percentage,
      grand_total,
      other_information,
    };

    const payload = sanitizePayload({
      ...rawPayload,
      items: JSON.parse(rawPayload.items || "[]"),
    });

    const tax_record = await tax_model.findById(tax);
    if (!tax_record) {
      return res.status(400).json({
        status: "error",
        message: "Invalid tax ID provided",
      });
    }

    const new_estimate = await estimate_model.create({
      ...payload,
      tax_amount: (payload.total_amount * tax_record.percentage) / 100,
    });

    return res.status(201).json({
      status: "success",
      message: "Estimate added successfully",
      data: new_estimate,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding estimate",
      error: error.message,
    });
  }
};

export const handle_edit_estimate = async (req, res) => {
  try {
    const { estimate_id } = req.params;
    const {
      client,
      project,
      email,
      tax,
      client_address,
      billing_address,
      estimate_date,
      expiry_date,
      items,
      total_amount,
      discount_percentage,
      grand_total,
      other_information,
    } = req.body;

    const rawPayload = {
      client,
      project,
      email,
      tax,
      client_address,
      billing_address,
      estimate_date,
      expiry_date,
      items,
      total_amount,
      discount_percentage,
      grand_total,
      other_information,
    };

    const payload = sanitizePayload({
      ...rawPayload,
      items: JSON.parse(rawPayload.items || "[]"),
    });

    const tax_record = await tax_model.findById(tax);
    if (!tax_record) {
      return res.status(400).json({
        status: "error",
        message: "Invalid tax ID provided",
      });
    }

    const updated_estimate = await estimate_model.findByIdAndUpdate(
      estimate_id,
      {
        ...payload,
        tax_amount: (payload.total_amount * tax_record.percentage) / 100,
      },
      { new: true },
    );

    if (!updated_estimate) {
      return res.status(404).json({
        status: "error",
        message: "Estimate not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Estimate updated successfully",
      data: updated_estimate,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating estimate",
      error: error.message,
    });
  }
};

export const handle_delete_estimate = async (req, res) => {
  try {
    const { estimate_id } = req.params;

    const deleted_estimate =
      await estimate_model.findByIdAndDelete(estimate_id);

    if (!deleted_estimate) {
      return res.status(404).json({
        status: "error",
        message: "Estimate not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Estimate deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting estimate",
      error: error.message,
    });
  }
};
