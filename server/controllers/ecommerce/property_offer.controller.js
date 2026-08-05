import jwt from "jsonwebtoken";
import user_model from "../../models/user.model.js";
import property_offer_model from "../../models/ecommerce/property_offer.model.js";

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


/* ================= MAKE OFFER ================= */
export const handle_make_property_offer = async (req, res) => {
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
      offer_amount,
      financing_type,
      contingencies,
      proposed_closing_date,
      additional_notes,
    } = req.body;

    if (!property || !offer_amount || !financing_type) {
      return res.status(400).json({
        status: "error",
        message: "Property, offer amount and financing type are required.",
      });
    }

    if (!["cash", "financing", "mixed"].includes(financing_type)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid financing type. Allowed values: cash, financing, mixed.",
      });
    }

    if (typeof offer_amount !== "number" || offer_amount <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Offer amount must be a positive number.",
      });
    }

    // One active offer per user per property
    const existing_offer = await property_offer_model.findOne({
      requestor: user_id,
      property,
    });

    if (existing_offer) {
      return res.status(400).json({
        status: "error",
        message: "You have already made an offer on this property.",
      });
    }

    const new_offer = await property_offer_model.create({
      requestor: user_id,
      property,
      offer_amount,
      financing_type,
      contingencies: contingencies ?? {},
      proposed_closing_date,
      additional_notes,
    });

    return res.status(201).json({
      status: "success",
      message: "Property offer submitted successfully.",
      data: new_offer,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while submitting property offer.",
      error: error.message,
    });
  }
};


/* ================= GET USER OFFERS ================= */
export const handle_get_user_property_offers = async (req, res) => {
  try {
    const { user, user_id } = await get_ecommerce_user(req);
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized.",
      });
    }

    const offers = await property_offer_model
      .find({ requestor: user_id })
      .populate("property")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      message: "Property offers fetched successfully.",
      data: offers,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching property offers.",
      error: error.message,
    });
  }
};


/* ================= GET SINGLE OFFER ================= */
export const handle_get_single_property_offer = async (req, res) => {
  try {
    const { user, user_id } = await get_ecommerce_user(req);
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized.",
      });
    }

    const { offer_id } = req.params;

    const offer = await property_offer_model
      .findOne({ _id: offer_id, requestor: user_id })
      .populate("property");

    if (!offer) {
      return res.status(404).json({
        status: "error",
        message: "Property offer not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Property offer fetched successfully.",
      data: offer,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching property offer.",
      error: error.message,
    });
  }
};


/* ================= CANCEL OFFER ================= */
export const handle_cancel_property_offer = async (req, res) => {
  try {
    const { user, user_id } = await get_ecommerce_user(req);
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized.",
      });
    }

    const { offer_id } = req.params;

    const offer = await property_offer_model.findOne({
      _id: offer_id,
      requestor: user_id,
    });

    if (!offer) {
      return res.status(404).json({
        status: "error",
        message: "Property offer not found.",
      });
    }

    await property_offer_model.deleteOne({ _id: offer_id });

    return res.status(200).json({
      status: "success",
      message: "Property offer cancelled successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while cancelling property offer.",
      error: error.message,
    });
  }
};