import express from "express";
// import require_permission from "../middlewares/permission.middleware.js";
import {
  handle_add_event,
  handle_delete_event,
  handle_edit_event,
  handle_get_event,
  handle_get_events,
} from "../../controllers/event/event.controller.js";

const event_router = express.Router();

event_router.get("/", handle_get_events);

event_router.get("/:event_id", handle_get_event);

event_router.post(
  "/add",
  handle_add_event,
);

event_router.post("/delete/:event_id", handle_delete_event);

event_router.post("/edit/:event_id", handle_edit_event);

export default event_router;
