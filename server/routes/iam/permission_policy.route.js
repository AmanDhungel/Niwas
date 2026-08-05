import express from "express";
import {
  handle_add_user_to_permission_groups,
  handle_copy_permission_policies_from_another_user,
  handle_get_permission_policies,
  handle_get_user_permissions,
  handle_refresh_permission_policies,
  handle_update_user_permission_policies,
} from "../../controllers/iam/permission_policy.controller.js";

const permission_policy_router = express.Router();

permission_policy_router.get("/", handle_get_permission_policies);

permission_policy_router.get("/refresh", handle_refresh_permission_policies);

permission_policy_router.post(
  "/user/:target_user_id/update",
  handle_update_user_permission_policies,
);

permission_policy_router.post(
  "/user/add/permission_group/:target_user_id",
  handle_add_user_to_permission_groups,
);

permission_policy_router.post(
  "/user/copy/permission_policies/:target_user_id",
  handle_copy_permission_policies_from_another_user,
);

permission_policy_router.get("/user/permissions", handle_get_user_permissions);

export default permission_policy_router;