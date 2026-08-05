import express from "express";
import {
  handle_make_property_offer,
  handle_get_user_property_offers,
  handle_get_single_property_offer,
  handle_cancel_property_offer,
} from "../../controllers/ecommerce/property_offer.controller.js";

const property_offer_router = express.Router();

property_offer_router.post("/make", handle_make_property_offer);

property_offer_router.get("/user_offers", handle_get_user_property_offers);

property_offer_router.get("/:offer_id", handle_get_single_property_offer);

property_offer_router.delete("/cancel/:offer_id", handle_cancel_property_offer);

export default property_offer_router;
