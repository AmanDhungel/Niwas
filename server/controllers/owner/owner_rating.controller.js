import owner_rating_model from "../../models/owner/owner_rating.model.js";

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

/* ================= GET ALL OWNER RATINGS ================= */
export const handle_get_owner_ratings = async (req, res) => {
  try {
    const ratings = await owner_rating_model
      .find()
      .populate("owner_and_property_information.property");

    return res.status(200).json({
      status: "success",
      message: "Owner ratings fetched successfully",
      data: ratings,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching owner ratings",
      error: error.message,
    });
  }
};

/* ================= GET OWNER RATING BY ID ================= */
export const handle_get_owner_rating = async (req, res) => {
  try {
    const { rating_id } = req.params;

    const rating = await owner_rating_model
      .findById(rating_id)
      .populate("owner_and_property_information.property");

    if (!rating) {
      return res.status(404).json({
        status: "error",
        message: "Owner rating not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Owner rating fetched successfully",
      data: rating,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching owner rating",
      error: error.message,
    });
  }
};

/* ================= ADD OWNER RATING ================= */
export const handle_add_owner_rating = async (req, res) => {
  try {
    const {
      owner_and_property_information,
      performance_ratings,
      written_review,
      additional_settings,
    } = req.body;

    const rawPayload = {
      owner_and_property_information,
      performance_ratings,
      written_review,
      additional_settings,
    };
    const cleanedPayload = sanitizePayload(rawPayload);

    const rating = await owner_rating_model.create(cleanedPayload);

    return res.status(201).json({
      status: "success",
      message: "Owner rating added successfully",
      data: rating,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding owner rating",
      error: error.message,
    });
  }
};

/* ================= EDIT OWNER RATING ================= */
export const handle_edit_owner_rating = async (req, res) => {
  try {
    const { rating_id } = req.params;

    const rating = await owner_rating_model.findById(rating_id);
    if (!rating) {
      return res.status(404).json({
        status: "error",
        message: "Owner rating not found",
      });
    }

    const {
      owner_and_property_information,
      performance_ratings,
      written_review,
      additional_settings,
    } = req.body;

    const rawPayload = {
      owner_and_property_information,
      performance_ratings,
      written_review,
      additional_settings,
    };
    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_rating = await owner_rating_model.findByIdAndUpdate(
      rating_id,
      { $set: cleanedPayload },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Owner rating updated successfully",
      data: updated_rating,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating owner rating",
      error: error.message,
    });
  }
};

/* ================= DELETE OWNER RATING ================= */
export const handle_delete_owner_rating = async (req, res) => {
  try {
    const { rating_id } = req.params;

    const deleted_rating =
      await owner_rating_model.findByIdAndDelete(rating_id);

    if (!deleted_rating) {
      return res.status(404).json({
        status: "error",
        message: "Owner rating not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Owner rating deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting owner rating",
      error: error.message,
    });
  }
};

/* ================= UPDATE VISIBILITY ================= */
export const handle_update_owner_rating_visibility = async (req, res) => {
  try {
    const { rating_id } = req.params;
    const { make_rating_public } = req.body;

    if (typeof make_rating_public !== "boolean") {
      return res.status(400).json({
        status: "error",
        message: "make_rating_public must be a boolean value",
      });
    }

    const rating = await owner_rating_model.findByIdAndUpdate(
      rating_id,
      { $set: { "additional_settings.make_rating_public": make_rating_public } },
      { new: true },
    );

    if (!rating) {
      return res.status(404).json({
        status: "error",
        message: "Owner rating not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Owner rating visibility updated successfully",
      data: {
        _id: rating._id,
        make_rating_public: rating.additional_settings.make_rating_public,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating owner rating visibility",
      error: error.message,
    });
  }
};