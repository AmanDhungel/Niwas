import search_boost_model from "../../models/marketplace/search_boost.model.js";

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

/* ================= HELPER: Multiplier string → numeric value ================= */
const resolve_multiplier_value = (boost_multiplier) => {
  const map = {
    "1.2x_subtle_boost": 1.2,
    "1.5x_medium_boost": 1.5,
    "2.0x_strong_boost": 2.0,
    "3.0x_maximum_boost": 3.0,
  };
  return map[boost_multiplier] ?? 1.0;
};

/* ================= GET ALL SEARCH BOOSTS ================= */
export const handle_get_search_boosts = async (req, res) => {
  try {
    const boosts = await search_boost_model.find();

    return res.status(200).json({
      status: "success",
      message: "Search boosts fetched successfully",
      data: boosts,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching search boosts",
      error: error.message,
    });
  }
};

/* ================= GET SEARCH BOOST BY ID ================= */
export const handle_get_search_boost = async (req, res) => {
  try {
    const { boost_id } = req.params;

    const boost = await search_boost_model.findById(boost_id);

    if (!boost) {
      return res.status(404).json({
        status: "error",
        message: "Search boost not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Search boost fetched successfully",
      data: boost,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching search boost",
      error: error.message,
    });
  }
};

/* ================= ADD SEARCH BOOST ================= */
export const handle_add_search_boost = async (req, res) => {
  try {
    const {
      boost_type,
      target_property,
      target_owner,
      target_name_or_id,
      boost_multiplier,
      start_date,
      end_date,
    } = req.body;

    /* -------- Validate date range -------- */
    const parsed_start = new Date(start_date);
    const parsed_end = new Date(end_date);

    if (parsed_end <= parsed_start) {
      return res.status(400).json({
        status: "error",
        message: "End date must be after start date",
      });
    }

    /* -------- Auto-resolve multiplier numeric value -------- */
    const multiplier_value = resolve_multiplier_value(boost_multiplier);

    /* -------- Determine initial status -------- */
    const now = new Date();
    const boost_status = parsed_start <= now ? "active" : "scheduled";

    const rawPayload = {
      boost_type,
      target_property: target_property || null,
      target_owner: target_owner || null,
      target_name_or_id,
      boost_multiplier,
      multiplier_value,
      start_date: parsed_start,
      end_date: parsed_end,
      boost_status,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const boost = await search_boost_model.create(cleanedPayload);

    return res.status(201).json({
      status: "success",
      message: "Search boost created successfully",
      data: boost,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while creating search boost",
      error: error.message,
    });
  }
};

/* ================= EDIT SEARCH BOOST ================= */
export const handle_edit_search_boost = async (req, res) => {
  try {
    const { boost_id } = req.params;

    const {
      boost_type,
      target_property,
      target_owner,
      target_name_or_id,
      boost_multiplier,
      start_date,
      end_date,
      boost_status,
    } = req.body;

    const rawPayload = {
      boost_type,
      target_property: target_property || undefined,
      target_owner: target_owner || undefined,
      target_name_or_id,
      boost_multiplier,
      boost_status,
    };

    /* -------- Recalculate multiplier_value if multiplier changes -------- */
    if (boost_multiplier) {
      rawPayload.multiplier_value = resolve_multiplier_value(boost_multiplier);
    }

    /* -------- Validate & update dates -------- */
    if (start_date || end_date) {
      const existing = await search_boost_model.findById(boost_id);
      if (!existing) {
        return res.status(404).json({
          status: "error",
          message: "Search boost not found",
        });
      }

      const new_start = start_date ? new Date(start_date) : existing.start_date;
      const new_end = end_date ? new Date(end_date) : existing.end_date;

      if (new_end <= new_start) {
        return res.status(400).json({
          status: "error",
          message: "End date must be after start date",
        });
      }

      rawPayload.start_date = new_start;
      rawPayload.end_date = new_end;
    }

    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_boost = await search_boost_model.findByIdAndUpdate(
      boost_id,
      { $set: cleanedPayload },
      { new: true },
    );

    if (!updated_boost) {
      return res.status(404).json({
        status: "error",
        message: "Search boost not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Search boost updated successfully",
      data: updated_boost,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating search boost",
      error: error.message,
    });
  }
};

/* ================= DELETE SEARCH BOOST ================= */
export const handle_delete_search_boost = async (req, res) => {
  try {
    const { boost_id } = req.params;

    const deleted_boost = await search_boost_model.findByIdAndDelete(boost_id);

    if (!deleted_boost) {
      return res.status(404).json({
        status: "error",
        message: "Search boost not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Search boost deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting search boost",
      error: error.message,
    });
  }
};
