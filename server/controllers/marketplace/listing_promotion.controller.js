import listing_promotion_model from "../../models/marketplace/listing_promotion.model.js";
import promotion_package_model from "../../models/marketplace/promotion_package.model.js";

const isEmptyValue = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof Date) return false; // ✅ add this line
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

/* ================= GET ALL LISTING PROMOTIONS ================= */
export const handle_get_listing_promotions = async (req, res) => {
  try {
    const promotions = await listing_promotion_model
      .find()
      .populate("property")
      .populate("promotion_package");

    return res.status(200).json({
      status: "success",
      message: "Listing promotions fetched successfully",
      data: promotions,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching listing promotions",
      error: error.message,
    });
  }
};

/* ================= GET LISTING PROMOTION BY ID ================= */
export const handle_get_listing_promotion = async (req, res) => {
  try {
    const { promotion_id } = req.params;

    const promotion = await listing_promotion_model
      .findById(promotion_id)
      .populate("property")
      .populate("promotion_package");

    if (!promotion) {
      return res.status(404).json({
        status: "error",
        message: "Listing promotion not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Listing promotion fetched successfully",
      data: promotion,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching listing promotion",
      error: error.message,
    });
  }
};

/* ================= ADD LISTING PROMOTION ================= */
export const handle_add_listing_promotion = async (req, res) => {
  try {
    const { property, promotion_package, duration_type, start_date } = req.body;

    /* -------- Fetch & validate promotion package -------- */
    const pkg = await promotion_package_model.findById(promotion_package);
    if (!pkg) {
      return res.status(404).json({
        status: "error",
        message: "Promotion package not found",
      });
    }

    if (!pkg.is_enabled || pkg.status !== "active") {
      return res.status(400).json({
        status: "error",
        message: "Selected promotion package is not currently active",
      });
    }

    /* -------- Calculate end date from package duration -------- */
    const parsed_start_date = new Date(start_date);
    const end_date = new Date(parsed_start_date);
    end_date.setDate(end_date.getDate() + pkg.duration_days);

    /* -------- Determine initial status -------- */
    const now = new Date();
    const promotion_status = parsed_start_date <= now ? "active" : "scheduled";

    /* -------- Build snapshot from package -------- */
    const package_snapshot = {
      name: pkg.name,
      package_type: pkg.package_type,
      description: pkg.description,
      duration_days: pkg.duration_days,
      price: pkg.price,
      priority_level: pkg.priority_level,
      placement_zones: pkg.placement_zones,
      features: pkg.features,
    };

    const rawPayload = {
      property,
      promotion_package,
      package_snapshot,
      duration_type,
      start_date: parsed_start_date,
      end_date,
      promotion_status,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const promotion = await listing_promotion_model.create(cleanedPayload);

    return res.status(201).json({
      status: "success",
      message: "Listing promoted successfully",
      data: promotion,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while promoting listing",
      error: error.message,
    });
  }
};

/* ================= EDIT LISTING PROMOTION ================= */
export const handle_edit_listing_promotion = async (req, res) => {
  try {
    const { promotion_id } = req.params;
    const { promotion_package, duration_type, start_date, promotion_status } =
      req.body;

    const promotion = await listing_promotion_model.findById(promotion_id);
    if (!promotion) {
      return res.status(404).json({
        status: "error",
        message: "Listing promotion not found",
      });
    }

    const rawPayload = { duration_type, promotion_status, promotion_package };

    /* -------- Recalculate end_date if start_date changes -------- */
    if (start_date) {
      const parsed_start_date = new Date(start_date);
      const duration_days = promotion.package_snapshot?.duration_days || 0;
      const new_end_date = new Date(parsed_start_date);
      new_end_date.setDate(new_end_date.getDate() + duration_days);

      rawPayload.start_date = parsed_start_date;
      rawPayload.end_date = new_end_date;
    }

    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_promotion = await listing_promotion_model.findByIdAndUpdate(
      promotion_id,
      { $set: cleanedPayload },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Listing promotion updated successfully",
      data: updated_promotion,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating listing promotion",
      error: error.message,
    });
  }
};

/* ================= DELETE LISTING PROMOTION ================= */
export const handle_delete_listing_promotion = async (req, res) => {
  try {
    const { promotion_id } = req.params;

    const deleted_promotion =
      await listing_promotion_model.findByIdAndDelete(promotion_id);

    if (!deleted_promotion) {
      return res.status(404).json({
        status: "error",
        message: "Listing promotion not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Listing promotion deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting listing promotion",
      error: error.message,
    });
  }
};
