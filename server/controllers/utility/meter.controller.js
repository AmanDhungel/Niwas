import meter_model from "../../models/utility/meter.model.js";

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

/* ================= GET ALL METERS ================= */
export const handle_get_meters = async (req, res) => {
  try {
    const meters = await meter_model
      .find()
      .populate("location.property")
      .populate("location.unit");

    return res.status(200).json({
      status: "success",
      message: "Meters fetched successfully",
      data: meters,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching meters",
      error: error.message,
    });
  }
};

/* ================= GET METER BY ID ================= */
export const handle_get_meter = async (req, res) => {
  try {
    const { meter_id } = req.params;

    const meter = await meter_model
      .findById(meter_id)
      .populate("location.property")
      .populate("location.unit");

    if (!meter) {
      return res.status(404).json({
        status: "error",
        message: "Meter not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Meter fetched successfully",
      data: meter,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching meter",
      error: error.message,
    });
  }
};

/* ================= ADD METER ================= */
export const handle_add_meter = async (req, res) => {
  try {
    /* -------- BODY -------- */
    const {
      basic_info,
      location,
      technical_specs,
      configuration,
      settings,
      additional_notes,
      status,
    } = req.body;

    const rawPayload = {
      basic_info: JSON.parse(basic_info || "{}"),
      location: JSON.parse(location || "{}"),
      technical_specs: JSON.parse(technical_specs || "{}"),
      configuration: JSON.parse(configuration || "{}"),
      settings: JSON.parse(settings || "{}"),
      additional_notes,
      status,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const meter = await meter_model.create({
      basic_info: cleanedPayload.basic_info || {},
      location: cleanedPayload.location || {},
      technical_specs: cleanedPayload.technical_specs || {},
      configuration: cleanedPayload.configuration || {},
      settings: cleanedPayload.settings || {},
      additional_notes: cleanedPayload.additional_notes || "",
      status: cleanedPayload.status || "active",
    });

    return res.status(201).json({
      status: "success",
      message: "Meter added successfully",
      data: meter,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding meter",
      error: error.message,
    });
  }
};

/* ================= EDIT METER ================= */
export const handle_edit_meter = async (req, res) => {
  try {
    const { meter_id } = req.params;

    /* -------- BODY -------- */
    const {
      basic_info,
      location,
      technical_specs,
      configuration,
      settings,
      additional_notes,
      status,
    } = req.body;

    const rawPayload = {
      basic_info: JSON.parse(basic_info || "{}"),
      location: JSON.parse(location || "{}"),
      technical_specs: JSON.parse(technical_specs || "{}"),
      configuration: JSON.parse(configuration || "{}"),
      settings: JSON.parse(settings || "{}"),
      additional_notes,
      status,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_meter = await meter_model.findByIdAndUpdate(
      meter_id,
      { $set: cleanedPayload },
      { new: true },
    );

    if (!updated_meter) {
      return res.status(404).json({
        status: "error",
        message: "Meter not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Meter updated successfully",
      data: updated_meter,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating meter",
      error: error.message,
    });
  }
};

/* ================= DELETE METER ================= */
export const handle_delete_meter = async (req, res) => {
  try {
    const { meter_id } = req.params;

    const deleted_meter = await meter_model.findByIdAndDelete(meter_id);

    if (!deleted_meter) {
      return res.status(404).json({
        status: "error",
        message: "Meter not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Meter deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting meter",
      error: error.message,
    });
  }
};
