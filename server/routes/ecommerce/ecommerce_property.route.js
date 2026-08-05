import express from "express";
import {
  handle_ecommerce_get_properties,
  handle_ecommerce_get_property,
} from "../../controllers/ecommerce/ecommerce_property.controller.js";

const ecommerce_property_router = express.Router();

ecommerce_property_router.get("/", handle_ecommerce_get_properties);

ecommerce_property_router.get("/:property_id", handle_ecommerce_get_property);

export default ecommerce_property_router;
