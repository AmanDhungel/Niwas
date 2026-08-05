import promotion_package_model from "../../models/marketplace/promotion_package.model.js";

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

/* ================= GET ALL PROMOTION PACKAGES ================= */
export const handle_get_promotion_packages = async (req, res) => {
  try {
    const packages = await promotion_package_model.find();

    return res.status(200).json({
      status: "success",
      message: "Promotion packages fetched successfully",
      data: packages,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching promotion packages",
      error: error.message,
    });
  }
};

/* ================= GET PROMOTION PACKAGE BY ID ================= */
export const handle_get_promotion_package = async (req, res) => {
  try {
    const { package_id } = req.params;

    const package_data = await promotion_package_model.findById(package_id);

    if (!package_data) {
      return res.status(404).json({
        status: "error",
        message: "Promotion package not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Promotion package fetched successfully",
      data: package_data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching promotion package",
      error: error.message,
    });
  }
};

/* ================= ADD PROMOTION PACKAGE ================= */
export const handle_add_promotion_package = async (req, res) => {
  try {
    /* -------- BODY -------- */
    const {
      name,
      package_type,
      description,
      duration_days,
      price,
      priority_level,
      placement_zones,
      features,
      is_enabled,
      status,
    } = req.body;

    const rawPayload = {
      name,
      package_type,
      description,
      duration_days: Number(duration_days),
      price: Number(price),
      priority_level: Number(priority_level),
      placement_zones: JSON.parse(placement_zones || "{}"),
      features: JSON.parse(features || "[]"),
      is_enabled: is_enabled === "true" || is_enabled === true,
      status,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    // Auto-set status based on is_enabled if not explicitly provided
    if (!cleanedPayload.status) {
      cleanedPayload.status = cleanedPayload.is_enabled ? "active" : "inactive";
    }

    const new_package = await promotion_package_model.create(cleanedPayload);

    return res.status(201).json({
      status: "success",
      message: "Promotion package created successfully",
      data: new_package,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while creating promotion package",
      error: error.message,
    });
  }
};

/* ================= EDIT PROMOTION PACKAGE ================= */
export const handle_edit_promotion_package = async (req, res) => {
  try {
    const { package_id } = req.params;

    /* -------- BODY -------- */
    const {
      name,
      package_type,
      description,
      duration_days,
      price,
      priority_level,
      placement_zones,
      features,
      is_enabled,
      status,
    } = req.body;

    const rawPayload = {
      name,
      package_type,
      description,
      duration_days: duration_days ? Number(duration_days) : undefined,
      price: price ? Number(price) : undefined,
      priority_level: priority_level ? Number(priority_level) : undefined,
      placement_zones: JSON.parse(placement_zones || "{}"),
      features: JSON.parse(features || "[]"),
      is_enabled: is_enabled !== undefined
        ? is_enabled === "true" || is_enabled === true
        : undefined,
      status,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_package = await promotion_package_model.findByIdAndUpdate(
      package_id,
      { $set: cleanedPayload },
      { new: true },
    );

    if (!updated_package) {
      return res.status(404).json({
        status: "error",
        message: "Promotion package not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Promotion package updated successfully",
      data: updated_package,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating promotion package",
      error: error.message,
    });
  }
};

/* ================= DELETE PROMOTION PACKAGE ================= */
export const handle_delete_promotion_package = async (req, res) => {
  try {
    const { package_id } = req.params;

    const deleted_package =
      await promotion_package_model.findByIdAndDelete(package_id);

    if (!deleted_package) {
      return res.status(404).json({
        status: "error",
        message: "Promotion package not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Promotion package deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting promotion package",
      error: error.message,
    });
  }
};
