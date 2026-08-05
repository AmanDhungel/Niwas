import express from "express";
import {
  handle_get_workorder_vendors,
  handle_get_workorder_vendor,
  handle_add_workorder_vendor,
  handle_edit_workorder_vendor,
  handle_delete_workorder_vendor,
  handle_update_workorder_vendor_status,
  handle_toggle_preferred_vendor,
  handle_update_document_status,
} from "../../controllers/workorder/workorder_vendor.controller.js";

const workorder_vendor_router = express.Router();

// workorder_vendor_router.get(
//   "/:domain_workspace_id",
//   handle_get_workorder_vendors,
// );

// workorder_vendor_router.get(
//   "/:domain_workspace_id/:vendor_id",
//   handle_get_workorder_vendor,
// );

workorder_vendor_router.get("/", handle_get_workorder_vendors);

workorder_vendor_router.get("/:vendor_id", handle_get_workorder_vendor);

workorder_vendor_router.post("/add", handle_add_workorder_vendor);

workorder_vendor_router.post("/edit/:vendor_id", handle_edit_workorder_vendor);

workorder_vendor_router.post(
  "/delete/:vendor_id",
  handle_delete_workorder_vendor,
);
workorder_vendor_router.post(
  "/update_status/:vendor_id",
  handle_update_workorder_vendor_status,
);
workorder_vendor_router.post(
  "/toggle_preferred/:vendor_id",
  handle_toggle_preferred_vendor,
);
workorder_vendor_router.post(
  "/update_document_status/:vendor_id",
  handle_update_document_status,
);

export default workorder_vendor_router;
