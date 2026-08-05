import parking_facility_model from "../../models/parking/parking_facility.model.js";

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

/* ================= GET ALL PARKING FACILITIES ================= */
export const handle_get_parking_facilities = async (req, res) => {
  try {
    const facilities = await parking_facility_model.find();

    return res.status(200).json({
      status: "success",
      message: "Parking facilities fetched successfully",
      data: facilities,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching parking facilities",
      error: error.message,
    });
  }
};

/* ================= GET PARKING FACILITY BY ID ================= */
export const handle_get_parking_facility = async (req, res) => {
  try {
    const { facility_id } = req.params;

    const facility = await parking_facility_model.findById(facility_id);

    if (!facility) {
      return res.status(404).json({
        status: "error",
        message: "Parking facility not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Parking facility fetched successfully",
      data: facility,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching parking facility",
      error: error.message,
    });
  }
};

/* ================= ADD PARKING FACILITY ================= */
export const handle_add_parking_facility = async (req, res) => {
  try {
    const {
      basic_info,
      location,
      structure,
      opening_hours,
      access_control,
      amenities_and_parking,
    } = req.body;

    // Parse each field - if missing from body, result is {}
    const rawPayload = {
      basic_info: JSON.parse(basic_info || "{}"),
      location: JSON.parse(location || "{}"),
      structure: JSON.parse(structure || "{}"),
      opening_hours: JSON.parse(opening_hours || "{}"),
      access_control: JSON.parse(access_control || "{}"),
      amenities_and_parking: JSON.parse(amenities_and_parking || "{}"),
    };

    // sanitizePayload removes empty objects — use cleanedPayload directly
    const cleanedPayload = sanitizePayload(rawPayload);

    // ✅ Don't fallback to {} — let Mongoose receive undefined for missing fields
    // so required validation gives a meaningful error on the actual missing field
    const facility = await parking_facility_model.create(cleanedPayload);

    return res.status(201).json({
      status: "success",
      message: "Parking facility created successfully",
      data: facility,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while creating parking facility",
      error: error.message,
    });
  }
};

/* ================= EDIT PARKING FACILITY ================= */
export const handle_edit_parking_facility = async (req, res) => {
  try {
    const { facility_id } = req.params;

    /* -------- BODY -------- */
    const {
      basic_info,
      location,
      structure,
      opening_hours,
      access_control,
      amenities_and_parking,
    } = req.body;

    const rawPayload = {
      basic_info: JSON.parse(basic_info || "{}"),
      location: JSON.parse(location || "{}"),
      structure: JSON.parse(structure || "{}"),
      opening_hours: JSON.parse(opening_hours || "{}"),
      access_control: JSON.parse(access_control || "{}"),
      amenities_and_parking: JSON.parse(amenities_and_parking || "{}"),
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_facility = await parking_facility_model.findByIdAndUpdate(
      facility_id,
      { $set: cleanedPayload },
      { new: true },
    );

    if (!updated_facility) {
      return res.status(404).json({
        status: "error",
        message: "Parking facility not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Parking facility updated successfully",
      data: updated_facility,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating parking facility",
      error: error.message,
    });
  }
};

/* ================= DELETE PARKING FACILITY ================= */
export const handle_delete_parking_facility = async (req, res) => {
  try {
    const { facility_id } = req.params;

    const deleted_facility =
      await parking_facility_model.findByIdAndDelete(facility_id);

    if (!deleted_facility) {
      return res.status(404).json({
        status: "error",
        message: "Parking facility not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Parking facility deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting parking facility",
      error: error.message,
    });
  }
};
