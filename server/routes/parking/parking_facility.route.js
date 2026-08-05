import express from "express";
import {
  handle_get_parking_facilities,
  handle_get_parking_facility,
  handle_add_parking_facility,
  handle_edit_parking_facility,
  handle_delete_parking_facility,
} from "../../controllers/parking/parking_facility.controller.js";

const parking_facility_router = express.Router();

parking_facility_router.get("/", handle_get_parking_facilities);

parking_facility_router.get(
  "/parking_facility/:facility_id",
  handle_get_parking_facility,
);

parking_facility_router.post("/add", handle_add_parking_facility);

parking_facility_router.post(
  "/edit/:facility_id",
  handle_edit_parking_facility,
);

parking_facility_router.post(
  "/delete/:facility_id",
  handle_delete_parking_facility,
);

export default parking_facility_router;
