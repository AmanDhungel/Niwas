import express from "express";
import {
  handle_get_search_boosts,
  handle_get_search_boost,
  handle_add_search_boost,
  handle_edit_search_boost,
  handle_delete_search_boost,
} from "../../controllers/marketplace/search_boost.controller.js";

const search_boost_router = express.Router();

search_boost_router.get("/", handle_get_search_boosts);

search_boost_router.get(
  "/search_boost/:boost_id",
  handle_get_search_boost,
);

search_boost_router.post("/add", handle_add_search_boost);

search_boost_router.post("/edit/:boost_id", handle_edit_search_boost);

search_boost_router.post("/delete/:boost_id", handle_delete_search_boost);

export default search_boost_router;