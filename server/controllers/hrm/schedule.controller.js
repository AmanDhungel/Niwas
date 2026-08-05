import schedule_model from "../../models/hrm/schedule.model.js";

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

export const handle_get_schedules = async (req, res) => {
  try {
    const schedules = await schedule_model
      .find()
      .populate("department")
      .populate("employee");

    return res.status(200).json({
      status: "success",
      message: "Schedules fetched successfully",
      data: schedules,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching schedules",
      error: error.message,
    });
  }
};

export const handle_get_schedule = async (req, res) => {
  try {
    const { schedule_id } = req.params;

    const schedule = await schedule_model
      .findById(schedule_id)
      .populate("department")
      .populate("employee");
    if (!schedule) {
      return res.status(404).json({
        status: "error",
        message: "Schedule not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Schedule fetched successfully",
      data: schedule,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching schedule",
      error: error.message,
    });
  }
};

export const handle_add_schedule = async (req, res) => {
  try {
    const {
      department,
      employee,
      date,
      shift,
      min_start_time,
      start_time,
      max_start_time,
      min_end_time,
      end_time,
      max_end_time,
      break_time,
      accept_extra_hours,
      publish,
    } = req.body;

    const rawPayload = {
      department,
      employee,
      date,
      shift,
      min_start_time,
      start_time,
      max_start_time,
      min_end_time,
      end_time,
      max_end_time,
      break_time,
      accept_extra_hours,
      publish,
    };

    const payload = sanitizePayload(rawPayload);

    const new_schedule = await schedule_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Schedule added successfully",
      data: new_schedule,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding schedule",
      error: error.message,
    });
  }
};

export const handle_edit_schedule = async (req, res) => {
  try {
    const { schedule_id } = req.params;
    const {
      department,
      employee,
      date,
      shift,
      min_start_time,
      start_time,
      max_start_time,
      min_end_time,
      end_time,
      max_end_time,
      break_time,
      accept_extra_hours,
      publish,
    } = req.body;

    const rawPayload = {
      department,
      employee,
      date,
      shift,
      min_start_time,
      start_time,
      max_start_time,
      min_end_time,
      end_time,
      max_end_time,
      break_time,
      accept_extra_hours,
      publish,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_schedule = await schedule_model.findByIdAndUpdate(
      schedule_id,
      payload,
      { new: true },
    );

    if (!updated_schedule) {
      return res.status(404).json({
        status: "error",
        message: "Schedule not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Schedule edited successfully",
      data: updated_schedule,
    });
  } catch (error) {
    return res.status(
      500,
      res.json({
        status: "error",
        message: "An error occurred while editing schedule",
        error: error.message,
      }),
    );
  }
};

export const handle_delete_schedule = async (req, res) => {
  try {
    const { schedule_id } = req.params;

    const deleted_schedule =
      await schedule_model.findByIdAndDelete(schedule_id);

    if (!deleted_schedule) {
      return res.status(404).json({
        status: "error",
        message: "Schedule not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Schedule deleted successfully",
      data: deleted_schedule,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting schedule",
      error: error.message,
    });
  }
};