import resignation_model from "../../models/hrm/resignation.model.js";
import jwt from "jsonwebtoken";
import user_model from "../../models/user.model.js";

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

export const handle_get_resignations = async (req, res) => {
  try {
    const resignations = await resignation_model
      .find()
      .populate("resigning_employee");

    return res.status(200).json({
      status: "success",
      message: "Resignations fetched successfully",
      data: resignations,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching resignations",
      error: error.message,
    });
  }
};

export const handle_get_resignation = async (req, res) => {
  try {
    const { resignation_id } = req.params;

    const resignation = await resignation_model
      .findById(resignation_id)
      .populate("resigning_employee");
    if (!resignation) {
      return res.status(404).json({
        status: "error",
        message: "Resignation not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Resignation fetched successfully",
      data: resignation,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching resignation",
      error: error.message,
    });
  }
};

export const handle_add_resignation = async (req, res) => {
  try {
    const { resigning_employee, notice_date, resignation_date, reason } =
      req.body;

    const rawPayload = {
      resigning_employee,
      notice_date,
      resignation_date,
      reason,
    };

    const payload = sanitizePayload(rawPayload);

    const new_resignation = await resignation_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Resignation added successfully",
      data: new_resignation,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding resignation",
      error: error.message,
    });
  }
};

export const handle_edit_resignation = async (req, res) => {
  try {
    const { resignation_id } = req.params;
    const { resigning_employee, notice_date, resignation_date, reason } =
      req.body;

    const rawPayload = {
      resigning_employee,
      notice_date,
      resignation_date,
      reason,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_resignation = await resignation_model.findByIdAndUpdate(
      resignation_id,
      payload,
      { new: true },
    );

    if (!updated_resignation) {
      return res.status(404).json({
        status: "error",
        message: "Resignation not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Resignation updated successfully",
      data: updated_resignation,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating resignation",
      error: error.message,
    });
  }
};

export const handle_approve_reject_resignation = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { resignation_id } = req.params;
    const { status, approved_rejected_notes } = req.body;

    const updated_resignation = await resignation_model.findByIdAndUpdate(
      resignation_id,
      {
        status,
        approved_rejected_notes,
        approver_rejector: user_id,
        approve_reject_date: new Date(),
      },
      { new: true },
    );

    if (!updated_resignation) {
      return res.status(404).json({
        status: "error",
        message: "Resignation not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Resignation approved/rejected successfully",
      data: updated_resignation,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while approving/rejecting resignation",
      error: error.message,
    });
  }
};

export const handle_submit_resignation_by_employee = async (req, res) => {
  try {
    const { user_token } = req.cookies;
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    const user = await user_model.findOne({ _id: user_id });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "You are not authorized to perform this action.",
        error: "Unauthorized",
      });
    }
    const { notice_date, resignation_date, reason } = req.body;

    const rawPayload = {
      resigning_employee: user_id,
      notice_date,
      resignation_date,
      reason,
    };

    const payload = sanitizePayload(rawPayload);

    const new_resignation = await resignation_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Resignation submitted successfully",
      data: new_resignation,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while submitting resignation",
      error: error.message,
    });
  }
};

export const handle_delete_resignation = async (req, res) => {
  try {
    const { resignation_id } = req.params;

    const deleted_resignation =
      await resignation_model.findByIdAndDelete(resignation_id);

    if (!deleted_resignation) {
      return res.status(404).json({
        status: "error",
        message: "Resignation not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Resignation deleted successfully",
      data: deleted_resignation,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting resignation",
      error: error.message,
    });
  }
};
