import express from "express";
import {
  handle_get_tenant_invitations,
  handle_get_tenant_invitation,
  handle_add_tenant_invitation,
  handle_edit_tenant_invitation,
  handle_delete_tenant_invitation,
} from "../../controllers/tenant/tenant_invitation.controller.js";

const tenant_invitation_router = express.Router();

tenant_invitation_router.get("/", handle_get_tenant_invitations);

tenant_invitation_router.get("/:invitation_id", handle_get_tenant_invitation);

tenant_invitation_router.post("/add", handle_add_tenant_invitation);

tenant_invitation_router.post(
  "/edit/:invitation_id",
  handle_edit_tenant_invitation,
);

tenant_invitation_router.post(
  "/delete/:invitation_id",
  handle_delete_tenant_invitation,
);

export default tenant_invitation_router;
