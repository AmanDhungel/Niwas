import performance_indicator_model from "../../models/hrm/performance_indicator.model.js";

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

export const handle_get_performance_indicators = async (req, res) => {
  try {
    const performance_indicators = await performance_indicator_model
      .find()
      .populate("designation");

    return res.status(200).json({
      status: "success",
      message: "Performance indicators fetched successfully",
      data: performance_indicators,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching performance indicators",
      error: error.message,
    });
  }
};

export const handle_get_performance_indicator = async (req, res) => {
  try {
    const { performance_indicator_id } = req.params;

    const performance_indicator = await performance_indicator_model
      .findById(performance_indicator_id)
      .populate("designation");
    if (!performance_indicator) {
      return res.status(404).json({
        status: "error",
        message: "Performance indicator not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Performance indicator fetched successfully",
      data: performance_indicator,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching performance indicator",
      error: error.message,
    });
  }
};

export const handle_delete_performance_indicator = async (req, res) => {
  try {
    const { performance_indicator_id } = req.params;

    const deleted_performance_indicator =
      await performance_indicator_model.findByIdAndDelete(
        performance_indicator_id,
      );

    if (!deleted_performance_indicator) {
      return res.status(404).json({
        status: "error",
        message: "Performance indicator not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Performance indicator deleted successfully",
      data: deleted_performance_indicator,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting performance indicator",
      error: error.message,
    });
  }
};

export const handle_add_performance_indicator = async (req, res) => {
  try {
    const {
      designation,
      technical_competencies,
      organizational_competencies,
      status,
    } = req.body;

    const rawPayload = {
      designation,
      technical_competencies,
      organizational_competencies,
      status,
    };

    const payload = sanitizePayload({
      ...rawPayload,
      technical_competencies: JSON.parse(
        rawPayload.technical_competencies || "[]",
      ),
      organizational_competencies: JSON.parse(
        rawPayload.organizational_competencies || "[]",
      ),
    });

    const new_performance_indicator =
      await performance_indicator_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Performance indicator added successfully",
      data: new_performance_indicator,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding performance indicator",
      error: error.message,
    });
  }
};

export const handle_edit_performance_indicator = async (req, res) => {
  try {
    const { performance_indicator_id } = req.params;
    const {
      designation,
      technical_competencies,
      organizational_competencies,
      status,
    } = req.body;

    const rawPayload = {
      designation,
      technical_competencies,
      organizational_competencies,
      status,
    };

    const payload = sanitizePayload({
      ...rawPayload,
      technical_competencies: JSON.parse(
        rawPayload.technical_competencies || "[]",
      ),
      organizational_competencies: JSON.parse(
        rawPayload.organizational_competencies || "[]",
      ),
    });

    const updated_performance_indicator =
      await performance_indicator_model.findByIdAndUpdate(
        performance_indicator_id,
        payload,
        { new: true },
      );

    if (!updated_performance_indicator) {
      return res.status(404).json({
        status: "error",
        message: "Performance indicator not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Performance indicator updated successfully",
      data: updated_performance_indicator,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating performance indicator",
      error: error.message,
    });
  }
};
