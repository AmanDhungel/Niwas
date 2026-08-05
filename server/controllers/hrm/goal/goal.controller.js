import goal_model from "../../../models/hrm/goal/goal.model.js";
import goal_type_model from "../../../models/hrm/goal/goal_type.model.js";

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

export const handle_get_goals = async (req, res) => {
  try {
    const goals = await goal_model.find().populate("goal_type");

    return res.status(200).json({
      status: "success",
      message: "Goals fetched successfully",
      data: goals,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching goals",
      error: error.message,
    });
  }
};

export const handle_get_goal = async (req, res) => {
  try {
    const { goal_id } = req.params;

    const goal = await goal_model.findById(goal_id).populate("goal_type");
    if (!goal) {
      return res.status(404).json({
        status: "error",
        message: "Goal not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Goal fetched successfully",
      data: goal,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching goal",
      error: error.message,
    });
  }
};

export const handle_delete_goal = async (req, res) => {
  try {
    const { goal_id } = req.params;

    const deleted_goal = await goal_model.findByIdAndDelete(goal_id);

    if (!deleted_goal) {
      return res.status(404).json({
        status: "error",
        message: "Goal not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Goal deleted successfully",
      data: deleted_goal,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting goal",
      error: error.message,
    });
  }
};

export const handle_get_goal_types = async (req, res) => {
  try {
    const goal_types = await goal_type_model.find();

    return res.status(200).json({
      status: "success",
      message: "Goal types fetched successfully",
      data: goal_types,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching goal types",
      error: error.message,
    });
  }
};

export const handle_get_goal_type = async (req, res) => {
  try {
    const { goal_type_id } = req.params;

    const goal_type = await goal_type_model.findById(goal_type_id);
    if (!goal_type) {
      return res.status(404).json({
        status: "error",
        message: "Goal type not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Goal type fetched successfully",
      data: goal_type,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching goal type",
      error: error.message,
    });
  }
};

export const handle_delete_goal_type = async (req, res) => {
  try {
    const { goal_type_id } = req.params;

    const deleted_goal_type =
      await goal_type_model.findByIdAndDelete(goal_type_id);

    if (!deleted_goal_type) {
      return res.status(404).json({
        status: "error",
        message: "Goal type not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Goal type deleted successfully",
      data: deleted_goal_type,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting goal type",
      error: error.message,
    });
  }
};

export const handle_add_goal_type = async (req, res) => {
  try {
    const { goal_type, description, status } = req.body;

    const rawPayload = {
      goal_type,
      description,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const new_goal_type = await goal_type_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Goal type added successfully",
      data: new_goal_type,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding goal type",
      error: error.message,
    });
  }
};

export const handle_edit_goal_type = async (req, res) => {
  try {
    const { goal_type_id } = req.params;
    const { goal_type, description, status } = req.body;

    const rawPayload = {
      goal_type,
      description,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_goal_type = await goal_type_model.findByIdAndUpdate(
      goal_type_id,
      payload,
      { new: true },
    );

    if (!updated_goal_type) {
      return res.status(404).json({
        status: "error",
        message: "Goal type not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Goal type updated successfully",
      data: updated_goal_type,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating goal type",
      error: error.message,
    });
  }
};

export const handle_add_goal = async (req, res) => {
  try {
    const {
      goal_type,
      subject,
      target_achievement,
      start_date,
      end_date,
      description,
      status,
    } = req.body;

    const rawPayload = {
      goal_type,
      subject,
      target_achievement,
      start_date,
      end_date,
      description,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const new_goal = await goal_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Goal added successfully",
      data: new_goal,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding goal",
      error: error.message,
    });
  }
};

export const handle_edit_goal = async (req, res) => {
  try {
    const { goal_id } = req.params;
    const {
      goal_type,
      subject,
      target_achievement,
      start_date,
      end_date,
      description,
      status,
    } = req.body;

    const rawPayload = {
      goal_type,
      subject,
      target_achievement,
      start_date,
      end_date,
      description,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_goal = await goal_model.findByIdAndUpdate(goal_id, payload, {
      new: true,
    });

    if (!updated_goal) {
      return res.status(404).json({
        status: "error",
        message: "Goal not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Goal updated successfully",
      data: updated_goal,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating goal",
      error: error.message,
    });
  }
};