import appraisal_model from "../../models/hrm/appraisal.model.js";

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

export const handle_get_appraisals = async (req, res) => {
  try {
    const appraisals = await appraisal_model.find().populate("employee");

    return res.status(200).json({
      status: "success",
      message: "Appraisals fetched successfully",
      data: appraisals,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching appraisals",
      error: error.message,
    });
  }
};

export const handle_get_appraisal = async (req, res) => {
  try {
    const { appraisal_id } = req.params;

    const appraisal = await appraisal_model
      .findById(appraisal_id)
      .populate("employee");
    if (!appraisal) {
      return res.status(404).json({
        status: "error",
        message: "Appraisal not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Appraisal fetched successfully",
      data: appraisal,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching appraisal",
      error: error.message,
    });
  }
};

export const handle_delete_appraisal = async (req, res) => {
  try {
    const { appraisal_id } = req.params;

    const deleted_appraisal =
      await appraisal_model.findByIdAndDelete(appraisal_id);

    if (!deleted_appraisal) {
      return res.status(404).json({
        status: "error",
        message: "Appraisal not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Appraisal deleted successfully",
      data: deleted_appraisal,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting appraisal",
      error: error.message,
    });
  }
};

export const handle_add_appraisal = async (req, res) => {
  try {
    const {
      employee,
      appraisal_date,
      technical_competencies,
      organizational_competencies,
      status,
    } = req.body;

    const rawPayload = {
      employee,
      appraisal_date,
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

    const new_appraisal = await appraisal_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Appraisal added successfully",
      data: new_appraisal,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding appraisal",
      error: error.message,
    });
  }
};

export const handle_edit_appraisal = async (req, res) => {
  try {
    const { appraisal_id } = req.params;
    const {
      employee,
      appraisal_date,
      technical_competencies,
      organizational_competencies,
      status,
    } = req.body;

    const rawPayload = {
      employee,
      appraisal_date,
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

    const updated_appraisal = await appraisal_model.findByIdAndUpdate(
      appraisal_id,
      payload,
      { new: true },
    );

    if (!updated_appraisal) {
      return res.status(404).json({
        status: "error",
        message: "Appraisal not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Appraisal updated successfully",
      data: updated_appraisal,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating appraisal",
      error: error.message,
    });
  }
};
