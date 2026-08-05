import express from "express";
import {
  handle_add_termination,
  handle_delete_termination,
  handle_edit_termination,
  handle_get_termination,
  handle_get_terminations,
} from "../../controllers/hrm/termination.controller.js";

const termination_router = express.Router();

termination_router.get("/", handle_get_terminations);

termination_router.get("/:termination_id", handle_get_termination);

termination_router.post("/add", handle_add_termination);

termination_router.post("/delete/:termination_id", handle_delete_termination);

termination_router.post("/edit/:termination_id", handle_edit_termination);

export default termination_router;
