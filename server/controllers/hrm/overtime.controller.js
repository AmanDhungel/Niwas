import overtime_model from "../../models/hrm/overtime.model.js";

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

export const handle_get_overtimes = async (req, res) => {
  try {
    const overtimes = await overtime_model.find().populate("employee");

    return res.status(200).json({
      status: "success",
      message: "Overtimes fetched successfully",
      data: overtimes,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching overtimes",
      error: error.message,
    });
  }
};

export const handle_get_overtime = async (req, res) => {
  try {
    const { overtime_id } = req.params;

    const overtime = await overtime_model
      .findById(overtime_id)
      .populate("employee");
    if (!overtime) {
      return res.status(404).json({
        status: "error",
        message: "Overtime not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Overtime fetched successfully",
      data: overtime,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching overtime",
      error: error.message,
    });
  }
};

export const handle_add_overtime = async (req, res) => {
  try {
    const {
      project,
      employee,
      date,
      overtime,
      remaining_hours,
      description,
      status,
    } = req.body;

    const rawPayload = {
      project,
      employee,
      date,
      overtime,
      remaining_hours,
      description,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const new_overtime = await overtime_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Overtime added successfully",
      data: new_overtime,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding overtime",
      error: error.message,
    });
  }
};

export const handle_edit_overtime = async (req, res) => {
  try {
    const { overtime_id } = req.params;
    const {
      project,
      employee,
      date,
      overtime,
      remaining_hours,
      description,
      status,
    } = req.body;

    const rawPayload = {
      project,
      employee,
      date,
      overtime,
      remaining_hours,
      description,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_overtime = await overtime_model.findByIdAndUpdate(
      overtime_id,
      payload,
      { new: true },
    );

    if (!updated_overtime) {
      return res.status(404).json({
        status: "error",
        message: "Overtime not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Overtime edited successfully",
      data: updated_overtime,
    });
  } catch (error) {
    return res.status(
      500,
      res.json({
        status: "error",
        message: "An error occurred while editing overtime",
        error: error.message,
      }),
    );
  }
};

export const handle_delete_overtime = async (req, res) => {
  try {
    const { overtime_id } = req.params;

    const deleted_overtime =
      await overtime_model.findByIdAndDelete(overtime_id);

    if (!deleted_overtime) {
      return res.status(404).json({
        status: "error",
        message: "Overtime not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Overtime deleted successfully",
      data: deleted_overtime,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting overtime",
      error: error.message,
    });
  }
};
