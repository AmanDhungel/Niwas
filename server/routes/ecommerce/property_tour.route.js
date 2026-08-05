import express from "express";
import {
  handle_create_property_tour_request,
  handle_get_user_property_tour_requests,
  handle_get_single_property_tour_request,
  handle_update_property_tour_request,
  handle_cancel_property_tour_request,
} from "../../controllers/ecommerce/property_tour.controller.js";

const property_tour_router = express.Router();

property_tour_router.post("/create", handle_create_property_tour_request);

property_tour_router.get("/user_requests", handle_get_user_property_tour_requests);

property_tour_router.get("/:tour_id", handle_get_single_property_tour_request);

property_tour_router.post("/update/:tour_id", handle_update_property_tour_request);

property_tour_router.post("/cancel/:tour_id", handle_cancel_property_tour_request);

export default property_tour_router;