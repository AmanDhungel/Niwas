import express from "express";
import {
  handle_add_tenant_lease,
  handle_delete_tenant_lease,
  handle_edit_tenant_lease,
  handle_get_tenant_lease,
  handle_get_tenant_leases,
} from "../../controllers/tenant/tenant_lease.controller.js";

const tenant_lease_router = express.Router();

tenant_lease_router.get("/:tenant_id", handle_get_tenant_leases);

tenant_lease_router.get("/:tenant_id/:lease_id", handle_get_tenant_lease);

tenant_lease_router.post("/add", handle_add_tenant_lease);

tenant_lease_router.post("/edit/:lease_id", handle_edit_tenant_lease);

tenant_lease_router.post("/delete/:lease_id", handle_delete_tenant_lease);

export default tenant_lease_router;
