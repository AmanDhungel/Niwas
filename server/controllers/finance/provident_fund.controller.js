import provident_fund_model from "../../models/finance/provident_fund.model.js";

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

export const handle_get_provident_funds = async (req, res) => {
  try {
    const provident_funds = await provident_fund_model
      .find()
      .populate("employee");

    return res.status(200).json({
      status: "success",
      message: "Provident Funds fetched successfully",
      data: provident_funds,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching provident funds",
      error: error.message,
    });
  }
};

export const handle_get_provident_fund = async (req, res) => {
  try {
    const { provident_fund_id } = req.params;

    const provident_fund = await provident_fund_model
      .findById(provident_fund_id)
      .populate("employee");
    if (!provident_fund) {
      return res.status(404).json({
        status: "error",
        message: "Provident Fund not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Provident Fund fetched successfully",
      data: provident_fund,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching provident fund",
      error: error.message,
    });
  }
};

export const handle_add_provident_fund = async (req, res) => {
  try {
    const {
      employee,
      type,
      employee_share_percentage,
      organization_share_percentage,
      employee_share_amount,
      organization_share_amount,
      description,
    } = req.body;

    const rawPayload = {
      employee,
      type,
      employee_share_percentage,
      organization_share_percentage,
      employee_share_amount,
      organization_share_amount,
      description,
    };

    const payload = sanitizePayload(rawPayload);

    const new_provident_fund = await provident_fund_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Provident Fund added successfully",
      data: new_provident_fund,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding provident fund",
      error: error.message,
    });
  }
};

export const handle_edit_provident_fund = async (req, res) => {
  try {
    const { provident_fund_id } = req.params;
    const {
      employee,
      type,
      employee_share_percentage,
      organization_share_percentage,
      employee_share_amount,
      organization_share_amount,
      description,
    } = req.body;

    const rawPayload = {
      employee,
      type,
      employee_share_percentage,
      organization_share_percentage,
      employee_share_amount,
      organization_share_amount,
      description,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_provident_fund = await provident_fund_model.findByIdAndUpdate(
      provident_fund_id,
      payload,
      { new: true },
    );

    if (!updated_provident_fund) {
      return res.status(404).json({
        status: "error",
        message: "Provident Fund not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Provident Fund updated successfully",
      data: updated_provident_fund,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating provident fund",
      error: error.message,
    });
  }
};

export const handle_delete_provident_fund = async (req, res) => {
  try {
    const { provident_fund_id } = req.params;

    const deleted_provident_fund =
      await provident_fund_model.findByIdAndDelete(provident_fund_id);

    if (!deleted_provident_fund) {
      return res.status(404).json({
        status: "error",
        message: "Provident Fund not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Provident Fund deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting provident fund",
      error: error.message,
    });
  }
};

export const handle_update_provident_fund_status = async (req, res) => {
  try {
    const { provident_fund_id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid status value",
      });
    }

    const updated_provident_fund =
      await provident_fund_model.findByIdAndUpdate(
        provident_fund_id,
        { status },
        { new: true },
      );

    if (!updated_provident_fund) {
      return res.status(404).json({
        status: "error",
        message: "Provident Fund not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Provident Fund status updated successfully",
      data: updated_provident_fund,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating provident fund status",
      error: error.message,
    });
  }
};