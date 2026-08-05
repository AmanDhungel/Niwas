import parking_assignment_model from "../../models/parking/parking_assignment.model.js";

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
    if (!isEmptyValue(value)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

/* ================= GET ALL PARKING ASSIGNMENTS ================= */
export const handle_get_parking_assignments = async (req, res) => {
  try {
    const assignments = await parking_assignment_model
      .find()
      .populate("targets.properties")
      .populate("targets.tenants");

    return res.status(200).json({
      status: "success",
      message: "Parking assignments fetched successfully",
      data: assignments,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching parking assignments",
      error: error.message,
    });
  }
};

/* ================= GET PARKING ASSIGNMENT BY ID ================= */
export const handle_get_parking_assignment = async (req, res) => {
  try {
    const { assignment_id } = req.params;

    const assignment = await parking_assignment_model
      .findById(assignment_id)
      .populate("targets.properties")
      .populate("targets.tenants");

    if (!assignment) {
      return res.status(404).json({
        status: "error",
        message: "Parking assignment not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Parking assignment fetched successfully",
      data: assignment,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching parking assignment",
      error: error.message,
    });
  }
};

/* ================= ADD PARKING ASSIGNMENT ================= */
export const handle_add_parking_assignment = async (req, res) => {
  try {
    /* -------- BODY -------- */
    const {
      assignment_type,
      targets,
      spaces,
      configuration,
    } = req.body;

    const rawPayload = {
      assignment_type,
      targets: JSON.parse(targets || "{}"),
      spaces: JSON.parse(spaces || "[]"),
      configuration: JSON.parse(configuration || "{}"),
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const assignment = await parking_assignment_model.create({
      assignment_type: cleanedPayload.assignment_type,
      targets: cleanedPayload.targets || {
        properties: [],
        units: [],
        tenants: [],
      },
      spaces: cleanedPayload.spaces || [],
      configuration: cleanedPayload.configuration || {},
    });

    return res.status(201).json({
      status: "success",
      message: "Parking assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while creating parking assignment",
      error: error.message,
    });
  }
};

/* ================= EDIT PARKING ASSIGNMENT ================= */
export const handle_edit_parking_assignment = async (req, res) => {
  try {
    const { assignment_id } = req.params;

    /* -------- BODY -------- */
    const {
      assignment_type,
      targets,
      spaces,
      configuration,
    } = req.body;

    const rawPayload = {
      assignment_type,
      targets: JSON.parse(targets || "{}"),
      spaces: JSON.parse(spaces || "[]"),
      configuration: JSON.parse(configuration || "{}"),
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_assignment = await parking_assignment_model.findByIdAndUpdate(
      assignment_id,
      { $set: cleanedPayload },
      { new: true },
    );

    if (!updated_assignment) {
      return res.status(404).json({
        status: "error",
        message: "Parking assignment not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Parking assignment updated successfully",
      data: updated_assignment,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating parking assignment",
      error: error.message,
    });
  }
};

/* ================= DELETE PARKING ASSIGNMENT ================= */
export const handle_delete_parking_assignment = async (req, res) => {
  try {
    const { assignment_id } = req.params;

    const deleted_assignment =
      await parking_assignment_model.findByIdAndDelete(assignment_id);

    if (!deleted_assignment) {
      return res.status(404).json({
        status: "error",
        message: "Parking assignment not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Parking assignment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting parking assignment",
      error: error.message,
    });
  }
};
