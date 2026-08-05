import express from "express";
import multer from "multer";
import {
  handle_create_maintenance_service_request,
  handle_get_user_maintenance_service_requests,
  handle_get_single_maintenance_service_request,
} from "../../controllers/ecommerce/maintenance_service.controller.js";

const maintenance_service_router = express.Router();

const upload = multer({ dest: "temp/" });

maintenance_service_router.post(
  "/create",
  upload.array("photos"),
  handle_create_maintenance_service_request,
);

maintenance_service_router.get("/user_requests", handle_get_user_maintenance_service_requests);

maintenance_service_router.get("/:request_id", handle_get_single_maintenance_service_request);

export default maintenance_service_router;