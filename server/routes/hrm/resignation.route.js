import express from "express";
import {
  handle_add_resignation,
  handle_approve_reject_resignation,
  handle_delete_resignation,
  handle_edit_resignation,
  handle_get_resignation,
  handle_get_resignations,
  handle_submit_resignation_by_employee,
} from "../../controllers/hrm/resignation.controller.js";
import check_permission_policy from "../../middlewares/permission_policy.middleware.js";

const resignation_router = express.Router();

resignation_router.get(
  "/",
  check_permission_policy({
    policies: "view:hrm_resignations",
  }),
  handle_get_resignations,
);

resignation_router.get(
  "/:resignation_id",
  check_permission_policy({
    policies: "view:hrm_resignations",
  }),
  handle_get_resignation,
);

resignation_router.post(
  "/add",
  check_permission_policy({
    policies: "create:hrm_resignations",
  }),
  handle_add_resignation,
);

resignation_router.post(
  "/delete/:resignation_id",
  check_permission_policy({
    policies: "delete:hrm_resignations",
  }),
  handle_delete_resignation,
);

resignation_router.post(
  "/edit/:resignation_id",
  check_permission_policy({
    policies: "edit:hrm_resignations",
  }),
  handle_edit_resignation,
);

resignation_router.post(
  "/approve_reject/:resignation_id",
  check_permission_policy({
    policies: "approve_reject:hrm_resignations",
  }),
  handle_approve_reject_resignation,
);

resignation_router.post(
  "/submit_resignation_by_employee",
  handle_submit_resignation_by_employee,
);

export default resignation_router;
