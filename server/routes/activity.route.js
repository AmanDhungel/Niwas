import express from "express";
import {
  handle_add_activity,
  handle_delete_activity,
  handle_edit_activity,
  handle_get_activities,
  handle_get_activity,
} from "../controllers/activity.controller.js";

const activity_router = express.Router();

activity_router.get("/", handle_get_activities);

activity_router.get("/:activity_id", handle_get_activity);

activity_router.post("/add", handle_add_activity);

activity_router.post("/edit/:activity_id", handle_edit_activity);

activity_router.post(
  "/delete/:activity_id",
  handle_delete_activity,
);

export default activity_router;
