import express from "express";
import {
  handle_get_parking_assignments,
  handle_get_parking_assignment,
  handle_add_parking_assignment,
  handle_edit_parking_assignment,
  handle_delete_parking_assignment,
} from "../../controllers/parking/parking_assignment.controller.js";

const parking_assignment_router = express.Router();

parking_assignment_router.get("/", handle_get_parking_assignments);

parking_assignment_router.get(
  "/parking_assignment/:assignment_id",
  handle_get_parking_assignment,
);

parking_assignment_router.post("/add", handle_add_parking_assignment);

parking_assignment_router.post(
  "/edit/:assignment_id",
  handle_edit_parking_assignment,
);

parking_assignment_router.post(
  "/delete/:assignment_id",
  handle_delete_parking_assignment,
);

export default parking_assignment_router;
