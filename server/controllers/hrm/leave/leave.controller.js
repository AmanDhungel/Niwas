import leave_model from "../../../models/hrm/leave/leave.model.js";
import leave_admin_model from "../../../models/hrm/leave/leave_admin.model.js";
import leave_policy_model from "../../../models/hrm/leave/leave_policy.model.js";
import user_model from "../../../models/user.model.js";
import jwt from "jsonwebtoken";

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

export const handle_get_leaves = async (req, res) => {
  try {
    const leaves = await leave_model.find().populate("employee");
    return res.status(200).json({
      status: "success",
      message: "Leaves fetched successfully",
      data: leaves,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching leaves",
      error: error.message,
    });
  }
};

export const handle_get_leave = async (req, res) => {
  try {
    const { leave_id } = req.params;

    const leave = await leave_model.findById(leave_id).populate("employee");
    if (!leave) {
      return res.status(404).json({
        status: "error",
        message: "Leave not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Leave fetched successfully",
      data: leave,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching leave",
      error: error.message,
    });
  }
};

export const handle_get_leave_policies = async (req, res) => {
  try {
    const leave_policies = await leave_policy_model
      .find()
      .populate("employees");
    return res.status(200).json({
      status: "success",
      message: "Leave policies fetched successfully",
      data: leave_policies,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching leave policies",
      error: error.message,
    });
  }
};

export const handle_get_leave_policy = async (req, res) => {
  try {
    const { leave_policy_id } = req.params;

    const leave_policy = await leave_policy_model
      .findById(leave_policy_id)
      .populate("employees");
    if (!leave_policy) {
      return res.status(404).json({
        status: "error",
        message: "Leave policy not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Leave policy fetched successfully",
      data: leave_policy,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching leave policy",
      error: error.message,
    });
  }
};

export const handle_delete_leave_policy = async (req, res) => {
  try {
    const { leave_policy_id } = req.params;

    const deleted_leave_policy =
      await leave_policy_model.findByIdAndDelete(leave_policy_id);

    if (!deleted_leave_policy) {
      return res.status(404).json({
        status: "error",
        message: "Leave policy not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Leave policy deleted successfully",
      data: deleted_leave_policy,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting leave policy",
      error: error.message,
    });
  }
};

export const handle_delete_leave = async (req, res) => {
  try {
    const { leave_id } = req.params;

    const deleted_leave = await leave_model.findByIdAndDelete(leave_id);

    if (!deleted_leave) {
      return res.status(404).json({
        status: "error",
        message: "Leave not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Leave deleted successfully",
      data: deleted_leave,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting leave",
      error: error.message,
    });
  }
};

export const handle_add_leave_policy = async (req, res) => {
  try {
    const { leave_type, policy_name, no_of_days, employees } = req.body;

    const rawPayload = {
      leave_type,
      policy_name,
      no_of_days,
      employees,
    };

    const payload = sanitizePayload(rawPayload);

    const new_leave_policy = await leave_policy_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Leave policy added successfully",
      data: new_leave_policy,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding leave policy",
      error: error.message,
    });
  }
};

export const handle_edit_leave_policy = async (req, res) => {
  try {
    const { leave_policy_id } = req.params;
    const { leave_type, policy_name, no_of_days, employees } = req.body;

    const rawPayload = {
      leave_type,
      policy_name,
      no_of_days,
      employees,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_leave_policy = await leave_policy_model.findByIdAndUpdate(
      leave_policy_id,
      payload,
      { new: true },
    );

    if (!updated_leave_policy) {
      return res.status(404).json({
        status: "error",
        message: "Leave policy not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Leave policy updated successfully",
      data: updated_leave_policy,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating leave policy",
      error: error.message,
    });
  }
};

export const handle_add_leave = async (req, res) => {
  try {
    const { employee, leave_type, from_date, to_date, type, reason, status } =
      req.body;

    const rawPayload = {
      employee,
      leave_type,
      from_date,
      to_date,
      type,
      reason,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const new_leave = await leave_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Leave added successfully",
      data: new_leave,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding leave",
      error: error.message,
    });
  }
};

export const handle_edit_leave = async (req, res) => {
  try {
    const { leave_id } = req.params;
    const { employee, leave_type, from_date, to_date, type, reason, status } =
      req.body;

    const rawPayload = {
      employee,
      leave_type,
      from_date,
      to_date,
      type,
      reason,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_leave = await leave_model.findByIdAndUpdate(
      leave_id,
      payload,
      {
        new: true,
      },
    );

    if (!updated_leave) {
      return res.status(404).json({
        status: "error",
        message: "Leave not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Leave updated successfully",
      data: updated_leave,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating leave",
      error: error.message,
    });
  }
};

export const handle_approve_leave = async (req, res) => {
  try {
    const { user_token } = req.cookies;
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    const user = await user_model.findOne({
      _id: user_id,
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const { leave_id } = req.params;

    const leave = await leave_model.findById(leave_id);
    if (!leave) {
      return res.status(404).json({
        status: "error",
        message: "Leave not found",
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        status: "error",
        message: "Only pending leaves can be approved",
      });
    }

    leave.status = "approved";
    leave.approved_by = user._id;
    await leave.save();

    return res.status(200).json({
      status: "success",
      message: "Leave approved successfully",
      data: leave,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while approving leave",
      error: error.message,
    });
  }
};

export const handle_change_status_leavepolicy = async (req, res) => {
  try {
    const { leave_policy_id } = req.params;
    const { status } = req.body;

    const leave = await leave_policy_model.findById(leave_policy_id);
    if (!leave) {
      return res.status(404).json({
        status: "error",
        message: "Leave not found",
      });
    }

    leave.status = status;
    await leave.save();

    return res.status(200).json({
      status: "success",
      message: "Leave status changed successfully",
      data: leave,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while changing leave status",
      error: error.message,
    });
  }
}

export const handle_reject_leave = async (req, res) => {
  try {
    const { user_token } = req.cookies;
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    const user = await user_model.findOne({
      _id: user_id,
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const { leave_id } = req.params;

    const leave = await leave_model.findById(leave_id);
    if (!leave) {
      return res.status(404).json({
        status: "error",
        message: "Leave not found",
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        status: "error",
        message: "Only pending leaves can be rejected",
      });
    }

    leave.status = "rejected";
    leave.rejected_by = user._id;
    await leave.save();

    return res.status(200).json({
      status: "success",
      message: "Leave rejected successfully",
      data: leave,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while rejecting leave",
      error: error.message,
    });
  }
};

export const handle_add_leave_admin = async (req, res) => {
  try {
    const { employee, leave_type, from_date, to_date, type, reason, status } =
      req.body;

    const rawPayload = {
      employee,
      leave_type,
      from_date,
      to_date,
      type,
      reason,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const new_leave_admin = await leave_admin_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Leave added successfully",
      data: new_leave_admin,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding leave",
      error: error.message,
    });
  }
};

export const handle_edit_leave_admin = async (req, res) => {
  try {
    const { leave_id } = req.params;
    const { employee, leave_type, from_date, to_date, type, reason, status } =
      req.body;

    const rawPayload = {
      employee,
      leave_type,
      from_date,
      to_date,
      type,
      reason,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_leave_admin = await leave_admin_model.findByIdAndUpdate(
      leave_id,
      payload,
      {
        new: true,
      },
    );

    if (!updated_leave_admin) {
      return res.status(404).json({
        status: "error",
        message: "Leave not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Leave updated successfully",
      data: updated_leave_admin,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating leave",
      error: error.message,
    });
  }
};

export const handle_get_leaves_admin = async (req, res) => {
  try {
    const leaves_admin = await leave_admin_model.find().populate("employee");
    return res.status(200).json({
      status: "success",
      message: "Leaves fetched successfully",
      data: leaves_admin,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching leaves",
      error: error.message,
    });
  }
};

export const handle_get_leave_admin = async (req, res) => {
  try {
    const { leave_id } = req.params;

    const leave_admin = await leave_admin_model
      .findById(leave_id)
      .populate("employee");
    if (!leave_admin) {
      return res.status(404).json({
        status: "error",
        message: "Leave not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Leave fetched successfully",
      data: leave_admin,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching leave",
      error: error.message,
    });
  }
};

export const handle_delete_leave_admin = async (req, res) => {
  try {
    const { leave_id } = req.params;

    const deleted_leave_admin =
      await leave_admin_model.findByIdAndDelete(leave_id);

    if (!deleted_leave_admin) {
      return res.status(404).json({
        status: "error",
        message: "Leave not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Leave deleted successfully",
      data: deleted_leave_admin,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting leave",
      error: error.message,
    });
  }
};

export const handle_approve_leave_admin = async (req, res) => {
  try {
    const { user_token } = req.cookies;
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    const user = await user_model.findOne({
      _id: user_id,
      user_type: "admin",
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const { leave_id } = req.params;

    const leave_admin = await leave_admin_model.findById(leave_id);
    if (!leave_admin) {
      return res.status(404).json({
        status: "error",
        message: "Leave not found",
      });
    }

    if (leave_admin.status !== "pending") {
      return res.status(400).json({
        status: "error",
        message: "Only pending leaves can be approved",
      });
    }

    leave_admin.status = "approved";
    leave_admin.approved_by = user._id;
    await leave_admin.save();

    return res.status(200).json({
      status: "success",
      message: "Leave approved successfully",
      data: leave_admin,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while approving leave",
      error: error.message,
    });
  }
};

export const handle_reject_leave_admin = async (req, res) => {
  try {
    const { user_token } = req.cookies;
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    const user = await user_model.findOne({
      _id: user_id,
      user_type: "admin",
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const { leave_id } = req.params;

    const leave_admin = await leave_admin_model.findById(leave_id);
    if (!leave_admin) {
      return res.status(404).json({
        status: "error",
        message: "Leave not found",
      });
    }

    if (leave_admin.status !== "pending") {
      return res.status(400).json({
        status: "error",
        message: "Only pending leaves can be rejected",
      });
    }

    leave_admin.status = "rejected";
    leave_admin.rejected_by = user._id;
    await leave_admin.save();

    return res.status(200).json({
      status: "success",
      message: "Leave rejected successfully",
      data: leave_admin,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while rejecting leave",
      error: error.message,
    });
  }
};

export const handle_get_leave_admin_stats = async (req, res) => {
  try {
    const planned_leaves_count = await leave_admin_model.countDocuments({
      leave_type: { $ne: "unplanned_leave" },
    });

    const unplanned_leaves_count = await leave_admin_model.countDocuments({
      leave_type: "unplanned_leave",
    });

    const pending_leaves_count = await leave_admin_model.countDocuments({
      status: "pending",
    });

    const approved_leaves_count = await leave_admin_model.countDocuments({
      status: "approved",
    });

    return res.status(200).json({
      status: "success",
      message: "Leave stats fetched successfully",
      data: {
        planned_leaves_count,
        unplanned_leaves_count,
        pending_leaves_count,
        approved_leaves_count,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching leave stats",
      error: error.message,
    });
  }
};
