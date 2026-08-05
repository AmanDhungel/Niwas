import express from "express";
import {
  handle_add_designation,
  handle_delete_designation,
  handle_edit_designation,
  handle_get_designation,
  handle_get_designations,
} from "../../controllers/hrm/designation.controller.js";

const designation_router = express.Router();

designation_router.get("/", handle_get_designations);

designation_router.get("/:designation_id", handle_get_designation);

designation_router.post("/add", handle_add_designation);

designation_router.post("/delete/:designation_id", handle_delete_designation);

designation_router.post("/edit/:designation_id", handle_edit_designation);

export default designation_router;
