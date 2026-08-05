import express from "express";
import {
  handle_add_leave,
  handle_add_leave_policy,
  handle_delete_leave,
  handle_delete_leave_policy,
  handle_edit_leave,
  handle_edit_leave_policy,
  handle_get_leave,
  handle_get_leave_policies,
  handle_get_leave_policy,
  handle_get_leaves,
  handle_approve_leave,
  handle_add_leave_admin,
  handle_edit_leave_admin,
  handle_get_leaves_admin,
  handle_get_leave_admin,
  handle_delete_leave_admin,
  handle_approve_leave_admin,
  handle_get_leave_admin_stats,
  handle_reject_leave_admin,
  handle_reject_leave,
  handle_change_status_leavepolicy,
} from "../../../controllers/hrm/leave/leave.controller.js";

const leave_router = express.Router();

/* ================= LEAVE POLICIES ================= */
leave_router.get("/leave_policies", handle_get_leave_policies);
leave_router.get("/leave_policy/:leave_policy_id", handle_get_leave_policy);
leave_router.post("/add_policy", handle_add_leave_policy);
leave_router.post("/edit_policy/:leave_policy_id", handle_edit_leave_policy);
leave_router.post(
  "/delete_policy/:leave_policy_id",
  handle_delete_leave_policy,
);
leave_router.post("/status/:leave_policy_id", handle_change_status_leavepolicy);

/* ================= ADMIN LEAVES ================= */
leave_router.get("/admin/stats", handle_get_leave_admin_stats);
leave_router.get("/admin", handle_get_leaves_admin);
leave_router.get("/admin/:leave_id", handle_get_leave_admin);
leave_router.post("/admin/add", handle_add_leave_admin);
leave_router.post("/admin/edit/:leave_id", handle_edit_leave_admin);
leave_router.post("/admin/delete/:leave_id", handle_delete_leave_admin);
leave_router.post("/admin/approve/:leave_id", handle_approve_leave_admin);
leave_router.post("/admin/reject/:leave_id", handle_reject_leave_admin);

/* ================= LEAVES ================= */
leave_router.get("/", handle_get_leaves);
leave_router.get("/:leave_id", handle_get_leave);
leave_router.post("/add", handle_add_leave);
leave_router.post("/edit/:leave_id", handle_edit_leave);
leave_router.post("/delete/:leave_id", handle_delete_leave);
leave_router.post("/approve/:leave_id", handle_approve_leave);
leave_router.post("/reject/:leave_id", handle_reject_leave);

export default leave_router;
