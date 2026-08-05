import timesheet_model from "../../models/hrm/timesheet.model.js";

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

export const handle_get_timesheets = async (req, res) => {
  try {
    const timesheets = await timesheet_model.find().populate("employee");

    return res.status(200).json({
      status: "success",
      message: "Timesheets fetched successfully",
      data: timesheets,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching timesheets",
      error: error.message,
    });
  }
};

export const handle_get_timesheet = async (req, res) => {
  try {
    const { timesheet_id } = req.params;

    const timesheet = await timesheet_model
      .findById(timesheet_id)
      .populate("employee");
    if (!timesheet) {
      return res.status(404).json({
        status: "error",
        message: "Timesheet not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Timesheet fetched successfully",
      data: timesheet,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching timesheet",
      error: error.message,
    });
  }
};

export const handle_add_timesheet = async (req, res) => {
  try {
    const {
      project,
      deadline,
      total_hours,
      remaining_hours,
      date,
      hours,
      employee,
    } = req.body;

    const rawPayload = {
      project,
      deadline,
      total_hours,
      remaining_hours,
      date,
      hours,
      employee,
    };

    const payload = sanitizePayload(rawPayload);

    const new_timesheet = await timesheet_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Timesheet added successfully",
      data: new_timesheet,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding timesheet",
      error: error.message,
    });
  }
};

export const handle_edit_timesheet = async (req, res) => {
  try {
    const { timesheet_id } = req.params;
    const {
      project,
      deadline,
      total_hours,
      remaining_hours,
      date,
      hours,
      employee,
    } = req.body;

    const rawPayload = {
      project,
      deadline,
      total_hours,
      remaining_hours,
      date,
      hours,
      employee,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_timesheet = await timesheet_model.findByIdAndUpdate(
      timesheet_id,
      payload,
      { new: true },
    );

    if (!updated_timesheet) {
      return res.status(404).json({
        status: "error",
        message: "Timesheet not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Timesheet edited successfully",
      data: updated_timesheet,
    });
  } catch (error) {
    return res.status(
      500,
      res.json({
        status: "error",
        message: "An error occurred while editing timesheet",
        error: error.message,
      }),
    );
  }
};

export const handle_delete_timesheet = async (req, res) => {
  try {
    const { timesheet_id } = req.params;

    const deleted_timesheet =
      await timesheet_model.findByIdAndDelete(timesheet_id);

    if (!deleted_timesheet) {
      return res.status(404).json({
        status: "error",
        message: "Timesheet not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Timesheet deleted successfully",
      data: deleted_timesheet,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting timesheet",
      error: error.message,
    });
  }
};
