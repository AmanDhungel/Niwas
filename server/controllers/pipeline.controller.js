import pipeline_model from "../models/pipeline.model.js";

const isEmptyValue = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

const sanitizePayload = (payload) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!isEmptyValue(value)) cleaned[key] = value;
  }
  return cleaned;
};

/* ================= GET PIPELINES ================= */
export const handle_get_pipelines = async (req, res) => {
  try {
    const pipelines = await pipeline_model.find().populate("allowed_users");

    return res.status(200).json({
      status: "success",
      message: "Pipelines fetched successfully",
      data: pipelines,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching pipelines",
      error: error.message,
    });
  }
};

/* ================= GET PIPELINE ================= */
export const handle_get_pipeline = async (req, res) => {
  try {
    const { pipeline_id } = req.params;

    const pipeline = await pipeline_model
      .findById(pipeline_id)
      .populate("allowed_users");

    if (!pipeline) {
      return res.status(404).json({
        status: "error",
        message: "Pipeline not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Pipeline fetched successfully",
      data: pipeline,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching pipeline",
      error: error.message,
    });
  }
};

/* ================= ADD PIPELINE ================= */
export const handle_add_pipeline = async (req, res) => {
  try {
    const { name, stages, access, allowed_users } = req.body;

    const rawPayload = {
      name,
      access,
      ...(stages && { stages: JSON.parse(stages) }),
      ...(allowed_users && { allowed_users: JSON.parse(allowed_users) }),
    };

    const payload = sanitizePayload(rawPayload);
    const new_pipeline = await pipeline_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Pipeline added successfully",
      data: new_pipeline,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding pipeline",
      error: error.message,
    });
  }
};

/* ================= EDIT PIPELINE ================= */
export const handle_edit_pipeline = async (req, res) => {
  try {
    const { pipeline_id } = req.params;

    const { name, stages, access, allowed_users } = req.body;

    const rawPayload = {
      name,
      access,
      ...(stages && { stages: JSON.parse(stages) }),
      ...(allowed_users && { allowed_users: JSON.parse(allowed_users) }),
    };

    const payload = sanitizePayload(rawPayload);
    const updated_pipeline = await pipeline_model.findByIdAndUpdate(
      pipeline_id,
      payload,
      { new: true },
    );

    if (!updated_pipeline) {
      return res.status(404).json({
        status: "error",
        message: "Pipeline not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Pipeline updated successfully",
      data: updated_pipeline,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating pipeline",
      error: error.message,
    });
  }
};

/* ================= DELETE PIPELINE ================= */
export const handle_delete_pipeline = async (req, res) => {
  try {
    const { pipeline_id } = req.params;
    const deleted_pipeline =
      await pipeline_model.findByIdAndDelete(pipeline_id);

    if (!deleted_pipeline) {
      return res.status(404).json({
        status: "error",
        message: "Pipeline not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Pipeline deleted successfully",
      data: deleted_pipeline,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting pipeline",
      error: error.message,
    });
  }
};
