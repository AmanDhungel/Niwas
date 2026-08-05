import express from "express";
import {
  handle_get_owner_invitations,
  handle_get_owner_invitation,
  handle_add_owner_invitation,
  handle_edit_owner_invitation,
  handle_delete_owner_invitation,
} from "../../controllers/owner/owner_invitation.controller.js";

const owner_invitation_router = express.Router();

owner_invitation_router.get("/", handle_get_owner_invitations);

owner_invitation_router.get("/:invitation_id", handle_get_owner_invitation);

owner_invitation_router.post("/add", handle_add_owner_invitation);

owner_invitation_router.post(
  "/edit/:invitation_id",
  handle_edit_owner_invitation,
);

owner_invitation_router.post(
  "/delete/:invitation_id",
  handle_delete_owner_invitation,
);

export default owner_invitation_router;
