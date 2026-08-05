import express from "express";
import {
  handle_get_rentals,
  handle_get_rental,
} from "../../controllers/rental/rental.controller.js";

const rental_router = express.Router();

rental_router.get("/", handle_get_rentals);
rental_router.get("/:type/:rental_id", handle_get_rental);

export default rental_router;
