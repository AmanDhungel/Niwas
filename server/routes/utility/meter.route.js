import express from "express";
import {
  handle_get_meters,
  handle_get_meter,
  handle_add_meter,
  handle_edit_meter,
  handle_delete_meter,
} from "../../controllers/utility/meter.controller.js";

const meter_router = express.Router();

meter_router.get("/", handle_get_meters);

meter_router.get("/meter/:meter_id", handle_get_meter);

meter_router.post("/add", handle_add_meter);

meter_router.post("/edit/:meter_id", handle_edit_meter);

meter_router.post("/delete/:meter_id", handle_delete_meter);

export default meter_router;
