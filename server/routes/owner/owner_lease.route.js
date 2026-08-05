import express from "express";
import {
  handle_get_owner_leases,
  handle_get_owner_lease,
  handle_add_owner_lease,
  handle_edit_owner_lease,
  handle_delete_owner_lease,
} from "../../controllers/owner/owner_lease.controller.js";

const owner_lease_router = express.Router();

owner_lease_router.get("/:owner_id", handle_get_owner_leases);

owner_lease_router.get("/:owner_id/:lease_id", handle_get_owner_lease);

owner_lease_router.post("/add", handle_add_owner_lease);

owner_lease_router.post("/edit/:lease_id", handle_edit_owner_lease);

owner_lease_router.post("/delete/:lease_id", handle_delete_owner_lease);

export default owner_lease_router;
