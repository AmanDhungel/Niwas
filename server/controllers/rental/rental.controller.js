import long_term_occupant_model from "../../models/occupancy/long_term_occupant.model.js";
import short_term_stay_model from "../../models/occupancy/short_term_stay.model.js";

/* ================= GET ALL RENTALS (merged) ================= */
export const handle_get_rentals = async (req, res) => {
  try {
    const { status, type, property, unit } = req.query;

    /* -------- Build filters -------- */
    const short_term_filter = {};
    const long_term_filter = {};

    if (status) {
      short_term_filter.request_status = status;
      long_term_filter.request_status = status;
    }
    if (property) {
      short_term_filter.property = property;
      long_term_filter.property = property;
    }
    if (unit) {
      short_term_filter.unit = unit;
      long_term_filter.unit = unit;
    }

    /* -------- Fetch both in parallel -------- */
    const [short_term_stays, long_term_occupants] = await Promise.all([
      type === "long_term"
        ? []
        : short_term_stay_model
            .find(short_term_filter)
            .populate("tenant")
            .populate("property")
            .populate("unit"),

      type === "short_term"
        ? []
        : long_term_occupant_model
            .find(long_term_filter)
            .populate("tenant")
            .populate("property")
            .populate("unit"),
    ]);

    /* -------- Normalize short_term_stays -------- */
    const normalized_short_term = short_term_stays.map((stay) => ({
      _id: stay._id,
      booking_type: "short_term",
      guest_name:
        `${stay.guest_info?.first_name || ""} ${stay.guest_info?.last_name || ""}`.trim(),
      profile_image: stay.guest_info?.profile_image || null,
      phone: stay.guest_info?.phone_number || null,
      email: stay.guest_info?.email || null,
      check_in_date: stay.stay_details?.check_in_date || null,
      check_out_date: stay.stay_details?.check_out_date || null,
      purpose: stay.stay_details?.purpose_category || null,
      urgency_level: stay.stay_details?.urgency_level || null,
      request_status: stay.request_status,
      tenant: stay.tenant,
      property: stay.property,
      unit: stay.unit,
      emergency_contact: stay.emergency_contact,
      additional_guests_count: stay.additional_guests?.length || 0,
      createdAt: stay.createdAt,
      raw: stay,
    }));

    /* -------- Normalize long_term_occupants -------- */
    const normalized_long_term = long_term_occupants.map((occupant) => ({
      _id: occupant._id,
      booking_type: "long_term",
      guest_name:
        `${occupant.personal_info?.first_name || ""} ${occupant.personal_info?.last_name || ""}`.trim(),
      profile_image: occupant.personal_info?.profile_image || null,
      phone: occupant.contact_info?.phone_number || null,
      email: occupant.contact_info?.email || null,
      check_in_date: occupant.stay_info?.planned_move_in_date || null,
      check_out_date: null,
      purpose: occupant.stay_info?.reason_for_stay || null,
      urgency_level: occupant.stay_info?.urgency_level || null,
      request_status: occupant.request_status,
      tenant: occupant.tenant,
      property: occupant.property,
      unit: occupant.unit,
      emergency_contact: occupant.emergency_contact,
      additional_guests_count: 0,
      createdAt: occupant.createdAt,
      raw: occupant,
    }));

    /* -------- Merge and sort by createdAt desc -------- */
    const merged = [...normalized_short_term, ...normalized_long_term].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    return res.status(200).json({
      status: "success",
      message: "Rentals fetched successfully",
      total: merged.length,
      short_term_count: normalized_short_term.length,
      long_term_count: normalized_long_term.length,
      data: merged,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching rentals",
      error: error.message,
    });
  }
};

/* ================= GET SINGLE RENTAL ================= */
export const handle_get_rental = async (req, res) => {
  try {
    const { rental_id, type } = req.params;

    let rental = null;
    let booking_type = null;

    if (type === "short_term") {
      rental = await short_term_stay_model
        .findById(rental_id)
        .populate("tenant")
        .populate("property")
        .populate("unit");
      booking_type = "short_term";
    } else if (type === "long_term") {
      rental = await long_term_occupant_model
        .findById(rental_id)
        .populate("tenant")
        .populate("property")
        .populate("unit");
      booking_type = "long_term";
    } else {
      // Try both if type not specified
      rental = await short_term_stay_model
        .findById(rental_id)
        .populate("tenant")
        .populate("property")
        .populate("unit");
      booking_type = "short_term";

      if (!rental) {
        rental = await long_term_occupant_model
          .findById(rental_id)
          .populate("tenant")
          .populate("property")
          .populate("unit");
        booking_type = "long_term";
      }
    }

    if (!rental) {
      return res.status(404).json({
        status: "error",
        message: "Rental not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Rental fetched successfully",
      booking_type,
      data: rental,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching rental",
      error: error.message,
    });
  }
};
