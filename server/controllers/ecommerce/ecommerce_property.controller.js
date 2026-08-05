import property_model from "../../models/property/property.model.js";


/* ================= GET PROPERTIES (PUBLIC — with filters) ================= */
export const handle_ecommerce_get_properties = async (req, res) => {
  try {
    const {
      // Listing type
      listing_type,         // "sale" | "rent" | "lease"

      // Basic info
      property_type,        // "residential" | "commercial"
      category,             // e.g. "apartment", "villa", "bungalow" — matches property_details or tags

      // Location
      city,
      state,
      country,

      // Pricing
      price_min,
      price_max,
      currency,

      // Property details
      bed_type,
      room_size_min,
      room_size_max,
      furnished,            // "true" | "false"
      air_conditioning,     // "true" | "false"
      attached_bathroom,    // "true" | "false"

      // Availability
      available_from,       // ISO date string
      available_to,         // ISO date string
      current_status,       // "available" | "booked" | "pending" | "unavailable"

      // Publishing
      publishing_status,    // defaults to "published"
      instant_booking,      // "true" | "false"
      virtual_tours,        // "true" | "false"
      tags,                 // comma-separated: "pool,beachfront"

      // Apartment-level filters
      apartment_type,       // "studio" | "1-bedroom" | "2-bedroom" | "3-bedroom"

      // Sorting & pagination
      sort_by,              // "price_asc" | "price_desc" | "newest" | "oldest"
      page,
      limit,
    } = req.query;

    const filter = {};

    /* -------- Publishing: always filter to published unless explicitly overridden -------- */
    filter["publishing.publishing_status"] = publishing_status || "published";

    /* -------- Basic info -------- */
    if (property_type) {
      filter["basic_info.type"] = property_type;
    }

    if (category) {
      filter["publishing.property_tags"] = {
        $in: [new RegExp(category, "i")],
      };
    }

    /* -------- Location -------- */
    if (city)    filter["location.city"]    = new RegExp(city, "i");
    if (state)   filter["location.state"]   = new RegExp(state, "i");
    if (country) filter["location.country"] = new RegExp(country, "i");

    /* -------- Pricing by listing type -------- */
    if (listing_type && (price_min || price_max)) {
      const priceField = `publishing.pricing_configuration.${listing_type}.amount`;
      filter[priceField] = {};
      if (price_min) filter[priceField].$gte = Number(price_min);
      if (price_max) filter[priceField].$lte = Number(price_max);
    }

    if (listing_type) {
      filter[`publishing.pricing_configuration.${listing_type}.active`] = true;
      if (currency) {
        filter[`publishing.pricing_configuration.${listing_type}.currency`] = currency;
      }
    }

    /* -------- Property details -------- */
    if (bed_type)       filter["property_details.bed_type"]          = new RegExp(bed_type, "i");
    if (furnished)      filter["property_details.furnished"]         = furnished === "true";
    if (air_conditioning) filter["property_details.air_conditioning"] = air_conditioning === "true";
    if (attached_bathroom) filter["property_details.attached_bathroom"] = attached_bathroom === "true";

    if (room_size_min || room_size_max) {
      filter["property_details.room_size"] = {};
      if (room_size_min) filter["property_details.room_size"].$gte = Number(room_size_min);
      if (room_size_max) filter["property_details.room_size"].$lte = Number(room_size_max);
    }

    /* -------- Availability -------- */
    if (current_status) {
      filter["publishing.current_status"] = current_status;
    }

    if (available_from) {
      filter["publishing.available_from"] = { $lte: new Date(available_from) };
    }

    if (available_to) {
      filter["publishing.available_to"] = { $gte: new Date(available_to) };
    }

    /* -------- Publishing features -------- */
    if (instant_booking) {
      filter["publishing.publishing_features.instant_booking"] = instant_booking === "true";
    }
    if (virtual_tours) {
      filter["publishing.publishing_features.virtual_tours"] = virtual_tours === "true";
    }

    /* -------- Tags -------- */
    if (tags) {
      const tag_list = tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (tag_list.length > 0) {
        filter["publishing.property_tags"] = { $in: tag_list };
      }
    }

    /* -------- Apartment type (unit_structure level) -------- */
    if (apartment_type) {
      filter["unit_structure.apartments.type"] = apartment_type;
    }

    /* -------- Sorting -------- */
    let sort = {};
    switch (sort_by) {
      case "price_asc":
        sort[`publishing.pricing_configuration.${listing_type || "rent"}.amount`] = 1;
        break;
      case "price_desc":
        sort[`publishing.pricing_configuration.${listing_type || "rent"}.amount`] = -1;
        break;
      case "oldest":
        sort["createdAt"] = 1;
        break;
      case "newest":
      default:
        sort["createdAt"] = -1;
        break;
    }

    /* -------- Pagination -------- */
    const page_num  = Math.max(1, parseInt(page)  || 1);
    const limit_num = Math.min(100, parseInt(limit) || 12);
    const skip      = (page_num - 1) * limit_num;

    /* -------- Query -------- */
    const [properties, total] = await Promise.all([
      property_model
        .find(filter)
        .select(
          "basic_info location property_details publishing.pricing_configuration publishing.current_status publishing.publishing_features publishing.property_tags publishing.available_from publishing.available_to media_and_files.property_photos amenities createdAt",
        )
        .sort(sort)
        .skip(skip)
        .limit(limit_num)
        .populate("property_ownership.property_manager", "user_name user_email"),
      property_model.countDocuments(filter),
    ]);

    return res.status(200).json({
      status:  "success",
      message: "Properties fetched successfully.",
      data: {
        properties,
        pagination: {
          total,
          page:        page_num,
          limit:       limit_num,
          total_pages: Math.ceil(total / limit_num),
          has_next:    page_num < Math.ceil(total / limit_num),
          has_prev:    page_num > 1,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({
      status:  "error",
      message: "Internal server error.",
      error:   err.message,
    });
  }
};


/* ================= GET SINGLE PROPERTY (PUBLIC — full detail) ================= */
export const handle_ecommerce_get_property = async (req, res) => {
  try {
    const { property_id } = req.params;

    const property = await property_model
      .findOne({
        _id: property_id,
        "publishing.publishing_status": "published",
      })
      .populate("property_ownership.property_manager", "user_name user_email");

    if (!property) {
      return res.status(404).json({
        status:  "error",
        message: "Property not found.",
      });
    }

    return res.status(200).json({
      status:  "success",
      message: "Property retrieved successfully.",
      data:    property,
    });
  } catch (err) {
    return res.status(500).json({
      status:  "error",
      message: "Internal server error.",
      error:   err.message,
    });
  }
};