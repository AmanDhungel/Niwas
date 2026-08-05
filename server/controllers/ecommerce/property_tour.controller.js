import jwt from "jsonwebtoken";
import user_model from "../../models/user.model.js";
import property_tour_model from "../../models/ecommerce/property_tour.model.js";

/* ================= HELPER ================= */
const get_ecommerce_user = async (req) => {
  const { user_token } = req.cookies;
  if (!user_token) return { user: null, user_id: null };

  try {
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    const user = await user_model.findOne({
      _id: user_id,
      user_type: "ecommerce_user",
      is_deleted: false,
      is_active: true,
    });

    return { user, user_id };
  } catch {
    return { user: null, user_id: null };
  }
};


/* ================= CREATE ================= */
export const handle_create_property_tour_request = async (req, res) => {
  try {
    const { user, user_id } = await get_ecommerce_user(req);
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized.",
      });
    }

    const {
      property,
      type,
      preferred_date,
      preferred_time,
      additional_notes,
    } = req.body;

    if (!property || !type || !preferred_date || !preferred_time) {
      return res.status(400).json({
        status: "error",
        message: "Property, type, preferred date and preferred time are required.",
      });
    }

    if (!["in_person", "virtual"].includes(type)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid type. Allowed values are in_person and virtual.",
      });
    }

    const tour_request = await property_tour_model.create({
      requestor: user_id,
      property,
      type,
      preferred_date,
      preferred_time,
      additional_notes,
    });

    return res.status(201).json({
      status: "success",
      message: "Property tour request created successfully.",
      data: tour_request,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while creating property tour request.",
      error: error.message,
    });
  }
};


/* ================= USER REQUESTS ================= */
export const handle_get_user_property_tour_requests = async (req, res) => {
  try {
    const { user, user_id } = await get_ecommerce_user(req);
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized.",
      });
    }

    const tour_requests = await property_tour_model
      .find({ requestor: user_id })
      .populate("property")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      message: "Property tour requests fetched successfully.",
      data: tour_requests,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching property tour requests.",
      error: error.message,
    });
  }
};


/* ================= SINGLE REQUEST ================= */
export const handle_get_single_property_tour_request = async (req, res) => {
  try {
    const { user, user_id } = await get_ecommerce_user(req);
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized.",
      });
    }

    const { tour_id } = req.params;

    const tour_request = await property_tour_model
      .findOne({ _id: tour_id, requestor: user_id })
      .populate("property");

    if (!tour_request) {
      return res.status(404).json({
        status: "error",
        message: "Property tour request not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Property tour request fetched successfully.",
      data: tour_request,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching property tour request.",
      error: error.message,
    });
  }
};


/* ================= UPDATE ================= */
export const handle_update_property_tour_request = async (req, res) => {
  try {
    const { user, user_id } = await get_ecommerce_user(req);
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized.",
      });
    }

    const { tour_id } = req.params;

    const tour_request = await property_tour_model.findOne({
      _id: tour_id,
      requestor: user_id,
    });

    if (!tour_request) {
      return res.status(404).json({
        status: "error",
        message: "Property tour request not found.",
      });
    }

    if (tour_request.status !== "pending") {
      return res.status(400).json({
        status: "error",
        message: "Only pending property tour requests can be updated.",
      });
    }

    const {
      property,
      type,
      preferred_date,
      preferred_time,
      additional_notes,
    } = req.body;

    if (property !== undefined) tour_request.property = property;

    if (type !== undefined) {
      if (!["in_person", "virtual"].includes(type)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid type. Allowed values are in_person and virtual.",
        });
      }
      tour_request.type = type;
    }

    if (preferred_date !== undefined) tour_request.preferred_date = preferred_date;
    if (preferred_time !== undefined) tour_request.preferred_time = preferred_time;
    if (additional_notes !== undefined) tour_request.additional_notes = additional_notes;

    await tour_request.save();

    return res.status(200).json({
      status: "success",
      message: "Property tour request updated successfully.",
      data: tour_request,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating property tour request.",
      error: error.message,
    });
  }
};


/* ================= CANCEL ================= */
export const handle_cancel_property_tour_request = async (req, res) => {
  try {
    const { user, user_id } = await get_ecommerce_user(req);
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized.",
      });
    }

    const { tour_id } = req.params;

    const tour_request = await property_tour_model.findOne({
      _id: tour_id,
      requestor: user_id,
    });

    if (!tour_request) {
      return res.status(404).json({
        status: "error",
        message: "Property tour request not found.",
      });
    }

    if (tour_request.status === "completed") {
      return res.status(400).json({
        status: "error",
        message: "Completed property tour requests cannot be cancelled.",
      });
    }

    if (tour_request.status === "cancelled") {
      return res.status(400).json({
        status: "error",
        message: "Property tour request is already cancelled.",
      });
    }

    tour_request.status = "cancelled";
    await tour_request.save();

    return res.status(200).json({
      status: "success",
      message: "Property tour request cancelled successfully.",
      data: tour_request,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while cancelling property tour request.",
      error: error.message,
    });
  }
};