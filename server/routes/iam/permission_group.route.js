import express from "express";
import {
  handle_get_permission_groups,
  handle_get_permission_group,
  handle_create_permission_group,
  handle_edit_permission_group,
  handle_delete_permission_group,
  handle_update_group_policies,
  handle_update_group_users,
} from "../../controllers/iam/permission_group.controller.js";

const permission_group_router = express.Router();

/* ---- CRUD ---- */
permission_group_router.get("/", handle_get_permission_groups);

permission_group_router.post("/create", handle_create_permission_group);

permission_group_router.post("/edit/:group_id", handle_edit_permission_group);

permission_group_router.post(
  "/delete/:group_id",
  handle_delete_permission_group,
);

permission_group_router.post(
  "/policy/update/:group_id",
  handle_update_group_policies,
);

permission_group_router.post(
  "/user/update/:group_id",
  handle_update_group_users,
);

permission_group_router.get("/:group_id", handle_get_permission_group);

export default permission_group_router;