import express from "express";
import {
  handle_add_goal,
  handle_add_goal_type,
  handle_delete_goal,
  handle_delete_goal_type,
  handle_edit_goal,
  handle_edit_goal_type,
  handle_get_goal,
  handle_get_goal_type,
  handle_get_goal_types,
  handle_get_goals,
} from "../../../controllers/hrm/goal/goal.controller.js";

const goal_router = express.Router();

goal_router.get("/", handle_get_goals);

goal_router.post("/add", handle_add_goal);

goal_router.post("/edit/:goal_id", handle_edit_goal);

goal_router.get("/goal/:goal_id", handle_get_goal);

goal_router.post("/delete/:goal_id", handle_delete_goal);

goal_router.get("/types", handle_get_goal_types);

goal_router.get("/types/:goal_type_id", handle_get_goal_type);

goal_router.post("/add_type", handle_add_goal_type);

goal_router.post("/edit_type/:goal_type_id", handle_edit_goal_type);

goal_router.post("/delete_type/:goal_type_id", handle_delete_goal_type);

export default goal_router;
