import express from "express";
import { handle_get_featured_listings } from "../../controllers/marketplace/marketplace_listing.controller.js";

const marketplace_listing_router = express.Router();

marketplace_listing_router.get("/featured", handle_get_featured_listings);

export default marketplace_listing_router;
