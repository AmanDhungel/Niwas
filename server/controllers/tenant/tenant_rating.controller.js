import tenant_rating_model from "../../models/tenant/tenant_rating.model.js";

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

/* ================= GET ALL TENANT RATINGS ================= */
export const handle_get_tenant_ratings = async (req, res) => {
  try {
    const ratings = await tenant_rating_model
      .find()
      .populate("tenant_and_property_information.property");

    return res.status(200).json({
      status: "success",
      message: "Tenant ratings fetched successfully",
      data: ratings,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching tenant ratings",
      error: error.message,
    });
  }
};

/* ================= GET TENANT RATING BY ID ================= */
export const handle_get_tenant_rating = async (req, res) => {
  try {
    const { rating_id } = req.params;

    const rating = await tenant_rating_model
      .findById(rating_id)
      .populate("tenant_and_property_information.property");

    if (!rating) {
      return res.status(404).json({
        status: "error",
        message: "Tenant rating not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Tenant rating fetched successfully",
      data: rating,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching tenant rating",
      error: error.message,
    });
  }
};

/* ================= ADD TENANT RATING ================= */
export const handle_add_tenant_rating = async (req, res) => {
  try {
    const {
      tenant_and_property_information,
      performance_ratings,
      written_review,
      additional_settings,
    } = req.body;

    const rawPayload = {
      tenant_and_property_information,
      performance_ratings,
      written_review,
      additional_settings,
    };
    const cleanedPayload = sanitizePayload(rawPayload);

    const rating = await tenant_rating_model.create(cleanedPayload);

    return res.status(201).json({
      status: "success",
      message: "Tenant rating added successfully",
      data: rating,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding tenant rating",
      error: error.message,
    });
  }
};

/* ================= EDIT TENANT RATING ================= */
export const handle_edit_tenant_rating = async (req, res) => {
  try {
    const { rating_id } = req.params;

    const rating = await tenant_rating_model.findById(rating_id);
    if (!rating) {
      return res.status(404).json({
        status: "error",
        message: "Tenant rating not found",
      });
    }

    const {
      tenant_and_property_information,
      performance_ratings,
      written_review,
      additional_settings,
    } = req.body;

    const rawPayload = {
      tenant_and_property_information,
      performance_ratings,
      written_review,
      additional_settings,
    };
    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_rating = await tenant_rating_model.findByIdAndUpdate(
      rating_id,
      { $set: cleanedPayload },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Tenant rating updated successfully",
      data: updated_rating,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating tenant rating",
      error: error.message,
    });
  }
};

/* ================= DELETE TENANT RATING ================= */
export const handle_delete_tenant_rating = async (req, res) => {
  try {
    const { rating_id } = req.params;

    const deleted_rating =
      await tenant_rating_model.findByIdAndDelete(rating_id);

    if (!deleted_rating) {
      return res.status(404).json({
        status: "error",
        message: "Tenant rating not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Tenant rating deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting tenant rating",
      error: error.message,
    });
  }
};

/* ================= UPDATE VISIBILITY ================= */
export const handle_update_tenant_rating_visibility = async (req, res) => {
  try {
    const { rating_id } = req.params;
    const { make_rating_public } = req.body;

    if (typeof make_rating_public !== "boolean") {
      return res.status(400).json({
        status: "error",
        message: "make_rating_public must be a boolean value",
      });
    }

    const rating = await tenant_rating_model.findByIdAndUpdate(
      rating_id,
      { $set: { "additional_settings.make_rating_public": make_rating_public } },
      { new: true },
    );

    if (!rating) {
      return res.status(404).json({
        status: "error",
        message: "Tenant rating not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Tenant rating visibility updated successfully",
      data: {
        _id: rating._id,
        make_rating_public: rating.additional_settings.make_rating_public,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating tenant rating visibility",
      error: error.message,
    });
  }
};