import property_model from "../../models/property/property.model.js";

export const handle_get_featured_listings = async (req, res) => {
  try {
    const properties = await property_model
      .find({
        "basic_info.status": "active",
      })
      .populate("property_ownership.property_manager");

    return res.status(200).json({
      status: "success",
      message: "Featured listings fetched successfully",
      data: properties,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching featured listings",
      error: error.message,
    });
  }
};
